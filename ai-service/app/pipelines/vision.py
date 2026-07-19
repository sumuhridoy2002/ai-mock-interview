"""
Vision analysis pipeline.

Snapshot path (preferred):
  1. MediaPipe Face Landmarker — iris gaze, EAR blinks, head pose
  2. Batched HuggingFace emotion model (EMOTION_MODEL env)
  3. Optional answer audio → librosa prosody (pitch, pauses, speech rate)

Video path (fallback):
  OpenCV ~3 fps sampling + same models + prosody from video audio track.

Set AI_USE_MOCK=true to skip ML and return deterministic mock metrics.
"""

from __future__ import annotations

import io
import logging
import os
import tempfile
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

USE_MOCK = os.getenv("AI_USE_MOCK", "false").lower() == "true"
EMOTION_MODEL = os.getenv(
    "EMOTION_MODEL", "dima806/facial_emotions_image_detection"
)
EMOTION_BATCH_SIZE = int(os.getenv("EMOTION_BATCH_SIZE", "8"))
SNAPSHOT_INTERVAL_SEC = float(os.getenv("SNAPSHOT_INTERVAL_SEC", "10"))
MAX_EMOTION_FRAMES = int(os.getenv("MAX_EMOTION_FRAMES", "12"))

FRAME_OK_CONFIDENCE = 60
FRAME_OK_NERVOUSNESS = 45
FRAME_OK_EYE_CONTACT = 0.5

# ---------------------------------------------------------------------------
# Lazy model cache — loaded once, reused across requests
# ---------------------------------------------------------------------------
_emotion_pipe = None
_mp_face_mesh = None
_face_landmarker = None


def _get_emotion_pipeline():
    global _emotion_pipe
    if _emotion_pipe is None:
        from transformers import pipeline as hf_pipeline
        import torch

        device = 0 if torch.cuda.is_available() else -1
        logger.info("Loading emotion model %s on device=%s", EMOTION_MODEL, "GPU" if device == 0 else "CPU")
        _emotion_pipe = hf_pipeline(
            "image-classification",
            model=EMOTION_MODEL,
            device=device,
            top_k=7,
        )
    return _emotion_pipe


def _normalize_emotion_label(label: str) -> str:
    key = label.lower()
    aliases = {
        "disgust": "disgusted",
        "fear": "fearful",
        "surprise": "surprised",
        "anger": "angry",
    }
    return aliases.get(key, key)


def _frame_status(
    face_detected: bool,
    confidence: int,
    nervousness: int,
    eye_contact: float,
) -> str:
    if not face_detected:
        return "issue"
    if (
        confidence >= FRAME_OK_CONFIDENCE
        and nervousness <= FRAME_OK_NERVOUSNESS
        and eye_contact >= FRAME_OK_EYE_CONTACT
    ):
        return "ok"
    return "issue"


def _landmarker_model_path() -> str:
    cache_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, "face_landmarker.task")
    if not os.path.exists(path):
        import urllib.request

        url = (
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
            "face_landmarker/float16/1/face_landmarker.task"
        )
        logger.info("Downloading Face Landmarker model to %s", path)
        urllib.request.urlretrieve(url, path)
    return path


def _get_face_landmarker():
    global _face_landmarker
    if _face_landmarker is None:
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        options = vision.FaceLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=_landmarker_model_path()),
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        _face_landmarker = vision.FaceLandmarker.create_from_options(options)
        logger.info("Face Landmarker loaded")
    return _face_landmarker


def _detect_landmarks(rgb_arr: np.ndarray):
    """Return face landmark list or None using Face Landmarker (fallback: FaceMesh)."""
    try:
        from mediapipe import Image as MPImage
        from mediapipe import ImageFormat

        landmarker = _get_face_landmarker()
        mp_image = MPImage(image_format=ImageFormat.SRGB, data=rgb_arr)
        result = landmarker.detect(mp_image)
        if result.face_landmarks:
            return result.face_landmarks[0]
    except Exception as e:
        logger.debug("Face Landmarker failed, falling back to FaceMesh: %s", e)

    import mediapipe as mp

    face_mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    )
    try:
        results = face_mesh.process(rgb_arr)
        if results.multi_face_landmarks:
            return results.multi_face_landmarks[0].landmark
    finally:
        face_mesh.close()
    return None


def _get_face_mesh():
    global _mp_face_mesh
    if _mp_face_mesh is None:
        import mediapipe as mp
        _mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
    return _mp_face_mesh


# ---------------------------------------------------------------------------
# Mock metrics for dev / CI
# ---------------------------------------------------------------------------
def _mock_result(question: str = "") -> dict[str, Any]:
    return {
        "confidence": 72,
        "nervousness": 28,
        "eye_contact_ratio": 0.71,
        "head_stability": 0.82,
        "blink_rate": 18.0,
        "emotion_distribution": {
            "neutral": 0.55,
            "happy": 0.20,
            "sad": 0.05,
            "angry": 0.02,
            "fearful": 0.08,
            "disgusted": 0.02,
            "surprised": 0.08,
        },
        "prosody": {
            "pitch_variance": 45.2,
            "speech_rate_wpm": 142,
            "pause_ratio": 0.18,
            "energy_mean": 0.062,
        },
        "coaching_narrative": (
            "You maintained steady eye contact and a relaxed head position throughout. "
            "Your speech pace was comfortable and your voice was clear. "
            "Minor hesitation detected — try slowing down at the start of your answer to project confidence."
        ),
        "frames_analyzed": 0,
        "mock": True,
    }


# ---------------------------------------------------------------------------
# Eye Aspect Ratio (blink detection) — 6 landmark indices from FaceMesh
# Upper: 159, 158  /  lower: 145, 153  /  corners: 33, 133  (left eye)
# ---------------------------------------------------------------------------
_LEFT_EYE = [159, 145, 158, 153, 33, 133]


def _ear(landmarks, w: int, h: int) -> float:
    """Eye Aspect Ratio using left-eye landmarks."""
    def pt(idx: int):
        lm = landmarks[idx]
        return np.array([lm.x * w, lm.y * h])

    p1, p2, p3, p4, p5, p6 = [pt(i) for i in _LEFT_EYE]
    vert1 = np.linalg.norm(p2 - p6)
    vert2 = np.linalg.norm(p3 - p5)
    horiz = np.linalg.norm(p1 - p4)
    return float((vert1 + vert2) / (2.0 * horiz + 1e-6))


# ---------------------------------------------------------------------------
# Head pose yaw/pitch from FaceMesh (simplified via nose tip + chin vector)
# ---------------------------------------------------------------------------
_NOSE_TIP = 1
_CHIN = 152
_LEFT_EAR = 234
_RIGHT_EAR = 454


def _head_pose(landmarks, w: int, h: int) -> tuple[float, float]:
    """Return (yaw_deviation, pitch_deviation) in normalised [0, 1] units."""
    def pt(idx: int):
        lm = landmarks[idx]
        return np.array([lm.x, lm.y, lm.z])

    nose = pt(_NOSE_TIP)
    chin = pt(_CHIN)
    left = pt(_LEFT_EAR)
    right = pt(_RIGHT_EAR)

    center = (left + right) / 2.0
    yaw = float(abs(nose[0] - center[0]))       # left-right asymmetry
    pitch = float(abs(nose[1] - chin[1]) - 0.1)  # vertical tilt from neutral
    return yaw, max(0.0, pitch)


# Iris indices (FaceMesh / Face Landmarker with refinement)
_LEFT_EYE_INNER = 133
_LEFT_EYE_OUTER = 33
_LEFT_IRIS = 468
_RIGHT_EYE_INNER = 362
_RIGHT_EYE_OUTER = 263
_RIGHT_IRIS = 473


def _iris_eye_contact(lms, yaw: float) -> float:
    """
    Estimate gaze toward camera using iris position within each eye socket.
    Falls back to head-yaw heuristic when iris landmarks are unavailable.
    """
    try:
        if len(lms) <= _RIGHT_IRIS:
            return 1.0 if yaw < 0.08 else 0.0

        def one_eye(inner_idx: int, outer_idx: int, iris_idx: int) -> float:
            inner, outer, iris = lms[inner_idx], lms[outer_idx], lms[iris_idx]
            width = abs(outer.x - inner.x)
            if width < 0.01:
                return 0.5
            center = (inner.x + outer.x) / 2.0
            offset = abs(iris.x - center) / (width / 2.0)
            return max(0.0, 1.0 - min(offset, 1.0))

        left = one_eye(_LEFT_EYE_INNER, _LEFT_EYE_OUTER, _LEFT_IRIS)
        right = one_eye(_RIGHT_EYE_INNER, _RIGHT_EYE_OUTER, _RIGHT_IRIS)
        return float((left + right) / 2.0)
    except (IndexError, AttributeError, TypeError):
        return 1.0 if yaw < 0.08 else 0.0


def _frame_quality_score(rgb_arr: np.ndarray, lms) -> float:
    """Higher = better frame for emotion inference (face size + brightness)."""
    h, w = rgb_arr.shape[:2]
    xs = [lm.x for lm in lms]
    ys = [lm.y for lm in lms]
    face_area = (max(xs) - min(xs)) * (max(ys) - min(ys))
    size_score = min(face_area / 0.12, 1.0)
    gray = np.mean(rgb_arr.astype(np.float32), axis=2)
    brightness = float(np.mean(gray)) / 255.0
    brightness_score = 1.0 - abs(brightness - 0.45) * 2.0
    brightness_score = max(0.0, min(1.0, brightness_score))
    return float(size_score * 0.65 + brightness_score * 0.35)


def _batch_classify_emotions(pil_images: list, emotion_pipe, batch_size: int) -> list[list[dict]]:
    """Run HF image-classification in batches for throughput."""
    if not pil_images:
        return []

    all_preds: list[list[dict]] = []
    for start in range(0, len(pil_images), batch_size):
        chunk = pil_images[start : start + batch_size]
        raw = emotion_pipe(chunk, batch_size=len(chunk))
        if chunk and not isinstance(raw, list):
            raw = [raw]
        elif chunk and raw and isinstance(raw[0], dict):
            raw = [raw]
        all_preds.extend(raw)
    return all_preds


# ---------------------------------------------------------------------------
# Audio prosody via librosa
# ---------------------------------------------------------------------------
def _analyze_audio(video_path: str) -> dict[str, float]:
    """Extract prosody features from video audio track."""
    try:
        import librosa
        import soundfile as sf

        # Use ffmpeg to extract audio as wav
        wav_path = video_path + "_audio.wav"
        ret = os.system(f'ffmpeg -y -i "{video_path}" -vn -ar 16000 -ac 1 "{wav_path}" -loglevel quiet')
        if ret != 0 or not os.path.exists(wav_path):
            return {}

        y, sr = librosa.load(wav_path, sr=16000, mono=True)
        os.remove(wav_path)

        if len(y) < sr:  # < 1 second
            return {}

        # Pitch variance (F0 standard deviation)
        f0, _, _ = librosa.pyin(y, fmin=80, fmax=400, sr=sr)
        voiced = f0[~np.isnan(f0)] if f0 is not None else np.array([])
        pitch_var = float(np.std(voiced)) if len(voiced) > 0 else 0.0

        # Speech rate estimate (zero-crossing rate as a rough proxy for syllables)
        zcr = librosa.feature.zero_crossing_rate(y, frame_length=2048, hop_length=512)[0]
        speech_rate_wpm = float(np.mean(zcr) * sr / 512 * 60 / 4)  # rough estimate

        # Pause ratio (fraction of frames with very low RMS)
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        energy_mean = float(np.mean(rms))
        silence_threshold = energy_mean * 0.15
        pause_ratio = float(np.mean(rms < silence_threshold))

        return {
            "pitch_variance": round(pitch_var, 2),
            "speech_rate_wpm": round(speech_rate_wpm, 1),
            "pause_ratio": round(pause_ratio, 3),
            "energy_mean": round(energy_mean, 4),
        }
    except Exception as e:
        logger.warning("Audio prosody analysis failed: %s", e)
        return {}


def _analyze_audio_bytes(audio_bytes: bytes, filename: str = "answer.webm") -> dict[str, float]:
    """Extract prosody from answer audio bytes (webm/mp4/wav)."""
    if not audio_bytes:
        return {}

    suffix = os.path.splitext(filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        return _analyze_audio(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ---------------------------------------------------------------------------
# Per-frame emotion scoring
# ---------------------------------------------------------------------------
def _score_frame_emotion(frame_bgr, emotion_pipe) -> dict[str, float] | None:
    """Run emotion classification on a single BGR frame. Returns label→prob dict."""
    try:
        from PIL import Image
        import cv2

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        preds = emotion_pipe(pil_img)
        return {
            _normalize_emotion_label(p["label"]): round(p["score"], 4) for p in preds
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Confidence / nervousness scoring
# ---------------------------------------------------------------------------
_CONFIDENCE_EMOTIONS = {"happy", "neutral", "surprised"}
_NERVOUSNESS_EMOTIONS = {"fearful", "sad", "disgusted", "angry"}


from app.scoring.behavior import derive_scores as _derive_scores_canonical


def _derive_scores(
    emotion_dist: dict[str, float],
    eye_contact_ratio: float,
    head_stability: float,
    blink_rate: float,
    prosody: dict[str, float],
) -> tuple[int, int]:
    """Delegates to canonical weights in app.scoring.behavior."""
    return _derive_scores_canonical(
        emotion_dist, eye_contact_ratio, head_stability, blink_rate, prosody
    )


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def analyze_images(
    images: list[bytes],
    question: str = "",
    generate_narrative: bool = True,
    audio_bytes: bytes | None = None,
    audio_filename: str = "answer.webm",
    snapshot_interval_sec: float | None = None,
) -> dict[str, Any]:
    """
    Analyse a list of JPEG/PNG snapshot bytes captured during recording.

    Uses PIL + MediaPipe (iris gaze, EAR blinks) and batched HuggingFace emotion
    inference. Optional answer audio adds librosa prosody to behavior scores.
    """
    if USE_MOCK or not images:
        return _mock_result(question)

    interval = snapshot_interval_sec if snapshot_interval_sec and snapshot_interval_sec > 0 else SNAPSHOT_INTERVAL_SEC

    try:
        from PIL import Image as PILImage

        emotion_pipe = _get_emotion_pipeline()
        prosody = _analyze_audio_bytes(audio_bytes, audio_filename) if audio_bytes else {}

        ear_values: list[float] = []
        eye_contact_values: list[float] = []
        yaw_values: list[float] = []
        pitch_values: list[float] = []
        frame_scores: list[dict[str, Any]] = []
        face_frames: list[dict[str, Any]] = []

        for img_index, img_bytes in enumerate(images):
            frame_entry: dict[str, Any] = {"face_detected": False, "frame_status": "issue"}
            try:
                pil_img = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
                rgb_arr = np.array(pil_img)
                h, w = rgb_arr.shape[:2]

                lms = _detect_landmarks(rgb_arr)
                if not lms:
                    frame_scores.append(frame_entry)
                    continue

                ear_val = _ear(lms, w, h)
                yaw, pitch = _head_pose(lms, w, h)
                eye_contact = _iris_eye_contact(lms, yaw)

                ear_values.append(ear_val)
                yaw_values.append(yaw)
                pitch_values.append(pitch)
                eye_contact_values.append(eye_contact)

                quality = _frame_quality_score(rgb_arr, lms)
                face_frames.append({
                    "index": len(frame_scores),
                    "quality": quality,
                    "pil": pil_img,
                    "eye_contact": eye_contact,
                })

                f_conf, f_nerv = _derive_scores({}, eye_contact, 0.85, 16.0, prosody)
                frame_entry = {
                    "face_detected": True,
                    "confidence": f_conf,
                    "nervousness": f_nerv,
                    "dominant_emotion": "neutral",
                    "eye_contact": round(eye_contact, 2),
                    "frame_status": _frame_status(True, f_conf, f_nerv, eye_contact),
                }
                frame_scores.append(frame_entry)
            except Exception as e:
                logger.debug("Snapshot landmark error: %s", e)
                frame_scores.append(frame_entry)

        frames_analyzed = len(ear_values)
        if frames_analyzed == 0:
            logger.warning("No faces detected in snapshots — returning mock")
            return _mock_result(question)

        selected = sorted(face_frames, key=lambda item: item["quality"], reverse=True)[:MAX_EMOTION_FRAMES]
        pil_batch = [item["pil"] for item in selected]
        batch_preds = _batch_classify_emotions(pil_batch, emotion_pipe, EMOTION_BATCH_SIZE)

        emotion_accumulator: dict[str, list[float]] = {}
        for slot, preds in zip(selected, batch_preds):
            if not preds:
                continue
            frame_emotions: dict[str, float] = {}
            for p in preds:
                label = _normalize_emotion_label(p["label"])
                score = round(float(p["score"]), 4)
                frame_emotions[label] = score
                emotion_accumulator.setdefault(label, []).append(score)

            idx = slot["index"]
            ec = slot["eye_contact"]
            f_conf, f_nerv = _derive_scores(frame_emotions, ec, 0.85, 16.0, prosody)
            dominant = max(frame_emotions, key=frame_emotions.get)
            if idx < len(frame_scores) and frame_scores[idx].get("face_detected"):
                frame_scores[idx].update({
                    "confidence": f_conf,
                    "nervousness": f_nerv,
                    "dominant_emotion": dominant,
                    "frame_status": _frame_status(True, f_conf, f_nerv, ec),
                })

        ear_arr = np.array(ear_values)
        blinks = int(np.sum(np.diff((ear_arr < 0.21).astype(int)) == 1)) if len(ear_arr) > 1 else 0
        duration_sec = max(1.0, len(images) * interval)
        blink_rate = round(blinks / duration_sec * 60, 1)

        eye_contact_ratio = round(float(np.mean(eye_contact_values)), 3)
        head_stability = round(float(1.0 - min(np.std(yaw_values) + np.std(pitch_values), 1.0)), 3)

        emotion_dist: dict[str, float] = {
            label: round(float(np.mean(probs)), 4)
            for label, probs in emotion_accumulator.items()
        }

        confidence, nervousness = _derive_scores(
            emotion_dist, eye_contact_ratio, head_stability, blink_rate, prosody
        )

        coaching_narrative = ""
        if generate_narrative:
            coaching_narrative = _generate_narrative(
                confidence, nervousness, eye_contact_ratio,
                head_stability, blink_rate, emotion_dist, prosody, question
            )

        return {
            "confidence": confidence,
            "nervousness": nervousness,
            "eye_contact_ratio": eye_contact_ratio,
            "head_stability": head_stability,
            "blink_rate": blink_rate,
            "emotion_distribution": emotion_dist,
            "prosody": prosody,
            "coaching_narrative": coaching_narrative,
            "frames_analyzed": frames_analyzed,
            "frame_scores": frame_scores,
            "mock": False,
        }
    except Exception as e:
        logger.error("analyze_images failed: %s", e)
        return _mock_result(question)


async def analyze_video(
    video_bytes: bytes,
    filename: str = "answer.webm",
    question: str = "",
    generate_narrative: bool = True,
) -> dict[str, Any]:
    """
    Analyse video bytes for behavioural signals.

    Returns a dict suitable for storing in answer_behaviors.
    """
    if USE_MOCK:
        return _mock_result(question)

    try:
        import cv2  # noqa: F401
    except ImportError:
        logger.warning("cv2 not available — returning mock result for video analysis")
        return _mock_result(question)

    import cv2

    # Write bytes to a temp file (cv2 / ffmpeg need a real path)
    suffix = os.path.splitext(filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        return _run_analysis(tmp_path, question, generate_narrative)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _run_analysis(video_path: str, question: str, generate_narrative: bool) -> dict[str, Any]:
    import cv2

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.warning("Could not open video: %s", video_path)
        return _mock_result(question)

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_interval = max(1, int(fps / 3))  # sample ~3 fps

    face_mesh = _get_face_mesh()
    emotion_pipe = _get_emotion_pipeline()

    ear_values: list[float] = []
    yaw_values: list[float] = []
    pitch_values: list[float] = []
    eye_contact_values: list[float] = []
    emotion_accumulator: dict[str, list[float]] = {}
    frames_analyzed = 0
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        if frame_idx % frame_interval != 0:
            continue

        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            continue

        lms = results.multi_face_landmarks[0].landmark

        # Eye Aspect Ratio
        ear_values.append(_ear(lms, w, h))

        # Head pose
        yaw, pitch = _head_pose(lms, w, h)
        yaw_values.append(yaw)
        pitch_values.append(pitch)
        eye_contact_values.append(_iris_eye_contact(lms, yaw))

        # Emotion
        emotions = _score_frame_emotion(frame, emotion_pipe)
        if emotions:
            for label, prob in emotions.items():
                emotion_accumulator.setdefault(label, []).append(prob)

        frames_analyzed += 1

    cap.release()

    if frames_analyzed == 0:
        logger.warning("No face detected in video — returning mock result")
        return _mock_result(question)

    # ── Aggregate frame-level signals ────────────────────────────────────────
    ear_arr = np.array(ear_values)
    # Blink: EAR drops below 0.21 threshold
    blinks = int(np.sum(np.diff((ear_arr < 0.21).astype(int)) == 1))
    duration_sec = max(1, frames_analyzed / 3)  # sampled at 3 fps
    blink_rate = round(blinks / duration_sec * 60, 1)  # blinks per minute

    # Eye contact: iris-aware gaze averaged across sampled frames
    eye_contact_ratio = round(float(np.mean(eye_contact_values)), 3) if eye_contact_values else 0.0

    # Head stability: inverse of yaw + pitch std dev
    head_stability = round(float(1.0 - min(np.std(yaw_values) + np.std(pitch_values), 1.0)), 3)

    # Mean emotion distribution
    emotion_dist: dict[str, float] = {}
    for label, probs in emotion_accumulator.items():
        emotion_dist[label] = round(float(np.mean(probs)), 4)

    # Prosody
    prosody = _analyze_audio(video_path)

    # Derived scores
    confidence, nervousness = _derive_scores(
        emotion_dist, eye_contact_ratio, head_stability, blink_rate, prosody
    )

    # Optional coaching narrative via Ollama
    coaching_narrative = ""
    if generate_narrative:
        coaching_narrative = _generate_narrative(
            confidence, nervousness, eye_contact_ratio,
            head_stability, blink_rate, emotion_dist, prosody, question
        )

    return {
        "confidence": confidence,
        "nervousness": nervousness,
        "eye_contact_ratio": eye_contact_ratio,
        "head_stability": head_stability,
        "blink_rate": blink_rate,
        "emotion_distribution": emotion_dist,
        "prosody": prosody,
        "coaching_narrative": coaching_narrative,
        "frames_analyzed": frames_analyzed,
        "mock": False,
    }


# ---------------------------------------------------------------------------
# Coaching narrative via Ollama (prompt-driven — easy to tune via the .txt file)
# ---------------------------------------------------------------------------
def _generate_narrative(
    confidence: int,
    nervousness: int,
    eye_contact: float,
    head_stability: float,
    blink_rate: float,
    emotion_dist: dict[str, float],
    prosody: dict[str, float],
    question: str,
) -> str:
    try:
        from app.services.ollama_client import call_ollama, load_prompt
        import asyncio

        template = load_prompt("behavior_feedback")
        prompt = template.format(
            confidence=confidence,
            nervousness=nervousness,
            eye_contact_pct=round(eye_contact * 100),
            head_stability_pct=round(head_stability * 100),
            blink_rate=blink_rate,
            dominant_emotion=max(emotion_dist, key=emotion_dist.get) if emotion_dist else "neutral",
            emotion_json=str({k: v for k, v in sorted(emotion_dist.items(), key=lambda x: -x[1])[:4]}),
            speech_rate=prosody.get("speech_rate_wpm", 0),
            pause_ratio_pct=round(prosody.get("pause_ratio", 0) * 100),
            question=question[:200] if question else "N/A",
        )
        # Run in event loop if available, otherwise create one
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, call_ollama(prompt))
                    raw = future.result(timeout=30)
            else:
                raw = loop.run_until_complete(call_ollama(prompt))
        except RuntimeError:
            raw = asyncio.run(call_ollama(prompt))

        if isinstance(raw, dict):
            return raw.get("narrative") or raw.get("feedback") or str(raw)
        return str(raw).strip()
    except Exception as e:
        logger.warning("Coaching narrative generation failed: %s", e)
        return _static_narrative(confidence, nervousness, eye_contact, blink_rate, prosody)


def _static_narrative(
    confidence: int,
    nervousness: int,
    eye_contact: float,
    blink_rate: float,
    prosody: dict[str, float],
) -> str:
    parts: list[str] = []

    if eye_contact >= 0.65:
        parts.append("You maintained good eye contact throughout your answer.")
    elif eye_contact >= 0.4:
        parts.append("Your eye contact was moderate — try to look directly at the camera more consistently.")
    else:
        parts.append("Low eye contact detected. Looking directly at the camera projects more confidence.")

    if confidence >= 70:
        parts.append("Your overall presence was confident and composed.")
    elif confidence >= 50:
        parts.append("You showed moderate confidence — a more upright posture and steady gaze will help.")
    else:
        parts.append("Some signs of low confidence detected. Take a breath before answering to settle yourself.")

    if nervousness >= 60:
        parts.append("Higher nervousness signals were detected. Slow, deliberate speech and deliberate pauses help.")

    blink_rate_val = blink_rate or 0.0
    if blink_rate_val > 30:
        parts.append("Rapid blinking was noted — this often signals stress. Take a moment to relax your eyes.")

    pause_ratio = prosody.get("pause_ratio", 0)
    if pause_ratio > 0.35:
        parts.append("Long pauses were detected. Brief pauses are fine, but extended silences can suggest uncertainty.")

    return " ".join(parts)
