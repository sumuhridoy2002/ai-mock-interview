"""Audio transcription via OpenAI Whisper.

Env vars:
  WHISPER_MODEL        Model size (default: small). Options: base, small, medium, large.
  WHISPER_LANGUAGE     Language code (default: en). Set explicitly to skip auto-detect.
  WHISPER_INITIAL_PROMPT  Global vocabulary hint appended to per-request prompts.
  FFMPEG_PATH          Absolute path to ffmpeg binary (optional; falls back to PATH then imageio-ffmpeg).
  AI_USE_MOCK          Set "true" to disable Whisper entirely (for dev without GPU/Whisper).
"""

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

_whisper_model = None


def _get_whisper():
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model
    if os.getenv("AI_USE_MOCK", "false").lower() == "true":
        return None
    try:
        import whisper

        model_name = os.getenv("WHISPER_MODEL", "small")
        logger.info("Loading Whisper model: %s", model_name)
        _whisper_model = whisper.load_model(model_name)
        logger.info("Whisper model loaded: %s", model_name)
        return _whisper_model
    except Exception as exc:
        logger.error("Failed to load Whisper model: %s", exc)
        return None


def _ffmpeg_path() -> str | None:
    configured = os.getenv("FFMPEG_PATH")
    if configured and Path(configured).exists():
        return configured

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg

        bundled = imageio_ffmpeg.get_ffmpeg_exe()
        if bundled and Path(bundled).exists():
            return bundled
    except Exception as exc:
        logger.warning("imageio-ffmpeg not available: %s", exc)

    return None


def _prepare_audio_path(input_path: str) -> tuple[str, bool]:
    """Convert to 16 kHz mono WAV with loudness normalisation.

    Returns (output_path, converted). If conversion fails, returns the
    original path so Whisper can still attempt raw decoding.
    """
    ffmpeg = _ffmpeg_path()
    if not ffmpeg:
        logger.warning(
            "ffmpeg not found — Whisper accuracy will be lower on webm/opus files. "
            "Install ffmpeg or set FFMPEG_PATH."
        )
        return input_path, False

    output_path = f"{input_path}.16k.wav"
    try:
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i", input_path,
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                # Light audio filter: high-pass at 80 Hz removes low-frequency rumble
                # without affecting speech; loudnorm ensures consistent volume.
                "-af", "highpass=f=80,loudnorm",
                output_path,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return output_path, True
    except subprocess.CalledProcessError as exc:
        logger.warning("ffmpeg conversion failed: %s", exc.stderr or exc)
        return input_path, False


def _load_wav_mono_16k(path: str) -> np.ndarray:
    import wave

    with wave.open(path, "rb") as wav_file:
        channels = wav_file.getnchannels()
        sample_width = wav_file.getsampwidth()
        sample_rate = wav_file.getframerate()
        frames = wav_file.readframes(wav_file.getnframes())

    if sample_width != 2:
        raise ValueError(f"Unsupported WAV sample width: {sample_width}")

    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0

    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)

    if sample_rate != 16000:
        duration = len(audio) / sample_rate
        target_length = int(duration * 16000)
        if target_length > 0:
            audio = np.interp(
                np.linspace(0, len(audio) - 1, target_length),
                np.arange(len(audio)),
                audio,
            ).astype(np.float32)

    return audio


def _build_initial_prompt(
    job_title: str | None,
    required_skills: list[str] | None,
    question: str | None,
) -> str:
    """Build a Whisper initial_prompt that improves technical vocabulary recognition."""
    parts: list[str] = []

    if job_title:
        parts.append(f"{job_title} interview.")

    skills = [s.strip() for s in (required_skills or []) if s.strip()]
    if skills:
        parts.append("Technical terms: " + ", ".join(skills[:20]) + ".")

    if question:
        # Truncate to keep the prompt short; Whisper uses it as a context seed.
        parts.append("Question: " + question[:120] + ".")

    # Append any global hint set in the environment.
    global_hint = os.getenv("WHISPER_INITIAL_PROMPT", "").strip()
    if global_hint:
        parts.append(global_hint)

    return " ".join(parts) or "Software engineering interview."


def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    job_title: str | None = None,
    required_skills: list[str] | None = None,
    question: str | None = None,
) -> dict[str, Any]:
    """Transcribe audio bytes with Whisper.

    Returns a dict:
      transcript      str    — recognised text (empty string on failure)
      quality_poor    bool   — True when no_speech_prob is high or result is empty
    """
    empty: dict[str, Any] = {"transcript": "", "quality_poor": True}

    if not audio_bytes:
        return empty

    model = _get_whisper()
    if model is None:
        return empty

    suffix = os.path.splitext(filename)[1] or ".webm"
    temp_path = ""
    converted_path = ""

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            temp_path = tmp.name

        audio_path, converted = _prepare_audio_path(temp_path)
        if converted:
            converted_path = audio_path

        audio_np: np.ndarray | None = None
        if audio_path.endswith(".wav"):
            try:
                audio_np = _load_wav_mono_16k(audio_path)
            except Exception as exc:
                logger.warning("WAV load failed, letting Whisper decode directly: %s", exc)

        initial_prompt = _build_initial_prompt(job_title, required_skills, question)

        try:
            import torch

            use_fp16 = torch.cuda.is_available()
        except Exception:
            use_fp16 = False

        decode_kwargs: dict[str, Any] = dict(
            language=os.getenv("WHISPER_LANGUAGE", "en"),
            task="transcribe",
            fp16=use_fp16,
            temperature=0.0,
            beam_size=5,
            best_of=1,
            condition_on_previous_text=False,
            initial_prompt=initial_prompt,
        )

        if audio_np is not None and len(audio_np) > 0:
            result = model.transcribe(audio_np, **decode_kwargs)
        else:
            result = model.transcribe(audio_path, **decode_kwargs)

        text = (result.get("text") or "").strip()

        # Estimate quality from per-segment no_speech_prob.
        segments = result.get("segments") or []
        if segments:
            avg_no_speech = sum(s.get("no_speech_prob", 0) for s in segments) / len(segments)
        else:
            avg_no_speech = 1.0 if not text else 0.0

        quality_poor = not text or avg_no_speech > 0.6

        logger.info(
            "Transcribed %d bytes → %d chars | model=%s | no_speech_prob=%.2f | quality_poor=%s",
            len(audio_bytes),
            len(text),
            os.getenv("WHISPER_MODEL", "small"),
            avg_no_speech,
            quality_poor,
        )

        return {"transcript": text, "quality_poor": quality_poor}

    except Exception as exc:
        logger.error("Whisper transcription failed for %s: %s", filename, exc)
        return empty
    finally:
        for path in {temp_path, converted_path}:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass
