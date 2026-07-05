"""Canonical behavior score derivation from vision signals."""

from __future__ import annotations

from app.scoring.constants import get


def derive_scores(
    emotion_dist: dict[str, float],
    eye_contact_ratio: float,
    head_stability: float,
    blink_rate: float,
    prosody: dict[str, float],
) -> tuple[int, int]:
    conf_emotions = set(get("behavior.confidenceEmotions", ["happy", "neutral", "surprised"]))
    nerv_emotions = set(get("behavior.nervousnessEmotions", ["fearful", "sad", "disgusted", "angry"]))

    pos_emotion = sum(emotion_dist.get(e, 0) for e in conf_emotions)
    neg_emotion = sum(emotion_dist.get(e, 0) for e in nerv_emotions)

    ec_ideal = float(get("behavior.eyeContactIdeal", 0.75))
    ec_score = min(eye_contact_ratio / ec_ideal, 1.0)
    hs_score = min(head_stability, 1.0)

    blink_ideal = float(get("behavior.blinkRateIdeal", 16))
    blink_tol = float(get("behavior.blinkRateTolerance", 20))
    blink_normal = max(0.0, 1.0 - abs(blink_rate - blink_ideal) / blink_tol)

    pitch_max = float(get("behavior.pitchVarianceMax", 60))
    pitch_var = prosody.get("pitch_variance", 30.0)
    pitch_score = min(pitch_var / pitch_max, 1.0)

    pause_max = float(get("behavior.pauseRatioMax", 0.4))
    pause_ratio = prosody.get("pause_ratio", 0.2)
    pause_penalty = min(pause_ratio / pause_max, 1.0)

    cw = get("behavior.confidenceWeights", {})
    nw = get("behavior.nervousnessWeights", {})
    scale = float(get("behavior.confidenceScale", 110))

    confidence_raw = (
        cw.get("positiveEmotion", 0.30) * pos_emotion
        + cw.get("eyeContact", 0.25) * ec_score
        + cw.get("headStability", 0.20) * hs_score
        + cw.get("pitch", 0.15) * pitch_score
        + cw.get("blinkNormal", 0.10) * blink_normal
        - cw.get("pausePenalty", 0.15) * pause_penalty
    )
    confidence = int(max(0, min(100, confidence_raw * scale)))

    nervousness_raw = (
        nw.get("negativeEmotion", 0.35) * neg_emotion
        + nw.get("lowEyeContact", 0.20) * (1 - ec_score)
        + nw.get("lowHeadStability", 0.15) * (1 - hs_score)
        + nw.get("pause", 0.15) * pause_penalty
        + nw.get("abnormalBlink", 0.15) * (1 - blink_normal)
    )
    nervousness = int(max(0, min(100, nervousness_raw * scale)))

    return confidence, nervousness
