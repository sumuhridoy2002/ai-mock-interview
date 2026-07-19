"""Conversational expert agent that explains how Mock Interview Pro scores interviews."""

import json
import logging
from typing import Any

from app.schemas import ExpertChatResult
from app.services.ollama_client import call_ollama, load_prompt, parse_with_fallback

logger = logging.getLogger(__name__)

DEFAULT_FOLLOWUPS = [
    "What scoring dimensions do you use?",
    "How does behavior analysis affect my score?",
    "What makes a strong behavioral answer?",
]


def _fallback_reply(message: str, context: dict[str, Any]) -> dict[str, Any]:
    lowered = message.lower()
    pass_threshold = context.get("pass_threshold", 70)
    dimensions = context.get("dimensions") or [
        "relevance", "technical accuracy", "communication", "confidence", "completeness",
    ]
    dim_text = ", ".join(dimensions)

    if any(k in lowered for k in ("evaluat", "score", "grade", "grad")):
        reply = (
            f"Every answer you record is scored across five dimensions — {dim_text} — each on a 0-100 scale. "
            f"A local Llama 3 model reads your question and transcript and scores it the way a hiring manager would, "
            f"then those dimensions are combined into an overall score. {pass_threshold}+ counts as a pass; "
            f"below that we generate a model answer so you can see what a stronger response looks like. "
            f"If the AI model is temporarily offline, a rule-based heuristic in our backend fills in so you still "
            f"get a score. For video interviews we also analyze eye contact, emotion, and voice pacing, and blend "
            f"that into your final report."
        )
    elif "behavio" in lowered or "video" in lowered or "eye contact" in lowered:
        reply = (
            "During video interviews we analyze eye contact, facial emotion, head stability, blink rate, and voice "
            "prosody (pitch variance and pause ratio). These combine into confidence and nervousness scores that "
            "show up alongside your answer scores in the final report — they don't replace the content scoring, "
            "they add coaching context about delivery."
        )
    else:
        reply = (
            "I'm the Mock Interview Pro expert advisor. Ask me how scoring works, how behavior analysis affects "
            "your results, or how to structure a stronger answer, and I'll walk you through it."
        )

    return {"reply": reply, "suggested_followups": DEFAULT_FOLLOWUPS}


async def chat_expert(
    message: str,
    history: list[dict[str, Any]],
    context: dict[str, Any],
) -> dict[str, Any]:
    message = (message or "").strip()
    if not message:
        return {
            "reply": "Ask me anything about how Mock Interview Pro scores your answers or how to improve.",
            "suggested_followups": DEFAULT_FOLLOWUPS,
        }

    defaults = _fallback_reply(message, context)

    template = load_prompt("expert_advisor")
    if not template.strip():
        return defaults

    history_text = "\n".join(
        f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-6:]
    ) or "(no previous messages)"

    prompt = template.format(
        knowledge_base=json.dumps(context, indent=2),
        history=history_text,
        message=message,
    )

    expert_system = (
        "You are a friendly, precise product expert for an AI mock interview platform. "
        "Only use facts from the provided knowledge base. Return valid JSON only."
    )

    raw = await call_ollama(prompt, ExpertChatResult.model_json_schema(), system=expert_system, num_predict=500)

    if not raw or "reply" not in raw:
        logger.warning("Expert chat empty — using fallback reply")
        return defaults

    try:
        result = parse_with_fallback(raw, defaults)
        if not isinstance(result.get("suggested_followups"), list) or not result["suggested_followups"]:
            result["suggested_followups"] = DEFAULT_FOLLOWUPS
        result["reply"] = str(result.get("reply") or defaults["reply"]).strip()
        return ExpertChatResult(**result).model_dump()
    except Exception as exc:
        logger.warning("Invalid expert chat JSON: %s", exc)
        return defaults
