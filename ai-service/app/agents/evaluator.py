import json
import logging
from typing import Any

from app.schemas import EvaluationResult
from app.services.heuristic_evaluator import (
    apply_transcript_overrides,
    evaluate_heuristic,
    sanitize_transcript,
)
from app.services.ollama_client import call_ollama, load_prompt, parse_with_fallback

logger = logging.getLogger(__name__)

def _empty_transcript_result() -> dict[str, Any]:
    return EvaluationResult(
        score=0,
        relevance=0,
        technical_accuracy=0,
        communication=0,
        confidence=0,
        completeness=0,
        strengths=[],
        weaknesses=["We could not transcribe your spoken answer"],
        recommendations=[
            "Speak clearly for at least 5 seconds after pressing Record",
            "Check that your microphone is selected in the browser",
            "Use Chrome or Edge for best recording support",
        ],
        model_answer=(
            "A strong answer would briefly introduce your background, highlight 1-2 relevant skills or projects, "
            "and explain why you are interested in this role — with a specific example."
        ),
    ).model_dump()


def _coerce_evaluation_result(result: dict[str, Any]) -> dict[str, Any]:
    score = result.get("score", result.get("overall_score", 0))
    try:
        score = int(score)
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))
    result["score"] = score

    for field in ("relevance", "technical_accuracy", "communication", "confidence", "completeness"):
        value = result.get(field, score)
        try:
            value = int(value)
        except (TypeError, ValueError):
            value = score
        result[field] = max(0, min(100, value))

    for field in ("strengths", "weaknesses", "recommendations"):
        if not isinstance(result.get(field), list):
            result[field] = []

    model_answer = result.get("model_answer")
    result["model_answer"] = str(model_answer).strip() if model_answer else None

    return result


async def evaluate_answer(
    question: str,
    transcript: str,
    required_skills: list[str],
    category: str = "technical",
) -> dict[str, Any]:
    transcript = (transcript or "").strip()
    transcript, _ = sanitize_transcript(transcript)

    if not transcript:
        logger.warning("Evaluation skipped — empty transcript")
        return _empty_transcript_result()

    template = load_prompt("evaluation")
    prompt = template.format(
        question=question,
        transcript=transcript,
        required_skills=json.dumps(required_skills),
        category=category,
    )

    raw = await call_ollama(prompt, EvaluationResult.model_json_schema())

    if not raw or "score" not in raw:
        logger.warning("Ollama evaluation empty — using transcript heuristic fallback")
        return evaluate_heuristic(transcript, category, required_skills, question)

    result = parse_with_fallback(raw, {})
    if "score" not in result and "overall_score" in result:
        result["score"] = result["overall_score"]

    try:
        result = _coerce_evaluation_result(result)
        result = apply_transcript_overrides(result, transcript, question, category)
        return EvaluationResult(**result).model_dump()
    except Exception as exc:
        logger.warning("Invalid evaluation JSON from Ollama: %s", exc)
        return evaluate_heuristic(transcript, category, required_skills, question)
