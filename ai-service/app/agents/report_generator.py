from typing import Any

from app.schemas import ReportResult
from app.services.ollama_client import call_ollama, parse_with_fallback


from app.scoring.report import category_scores, hiring_recommendation, overall_score


async def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    scores = payload.get("scores") or []
    avg = overall_score(scores)
    category_scores_map = category_scores(scores)

    all_strengths: list[str] = []
    all_weaknesses: list[str] = []
    for item in scores:
        all_strengths.extend(item.get("strengths") or [])
        all_weaknesses.extend(item.get("weaknesses") or [])

    memory = payload.get("memory") or {}
    all_strengths.extend(memory.get("candidate_strengths") or [])
    all_weaknesses.extend(memory.get("candidate_weaknesses") or [])

    strengths = list(dict.fromkeys(all_strengths))[:8]
    weaknesses = list(dict.fromkeys(all_weaknesses))[:8]

    defaults = {
        "overall_score": avg,
        "category_scores": category_scores_map or {"overall": avg},
        "strengths": strengths or ["Participated actively in the interview"],
        "weaknesses": weaknesses or ["Room for deeper technical examples"],
        "improvement_areas": (weaknesses[:5] if weaknesses else ["Practice structured answers"]),
        "hiring_recommendation": hiring_recommendation(avg),
    }

    import os
    if os.getenv("AI_USE_MOCK", "false").lower() == "true":
        return ReportResult(**defaults).model_dump()

    prompt = f"""Generate final interview report from aggregated data:
Scores: {scores[:10]}
Average: {avg}
Category scores: {category_scores_map}

Return JSON: overall_score, category_scores, strengths[], weaknesses[], improvement_areas[], hiring_recommendation (strong_yes|yes|maybe|no|strong_no)"""

    raw = await call_ollama(prompt, ReportResult.model_json_schema())
    result = parse_with_fallback(raw, defaults)

    return ReportResult(**result).model_dump()
