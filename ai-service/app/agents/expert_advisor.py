"""Conversational expert agent that explains how Mock Interview Pro scores interviews."""

import json
import logging
import os
import re
from typing import Any

from app.schemas import ExpertChatResult
from app.services.ollama_client import call_ollama, load_prompt, parse_with_fallback

logger = logging.getLogger(__name__)

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

DEFAULT_FOLLOWUPS = [
    "What scoring dimensions do you use?",
    "How does behavior analysis affect my score?",
    "Which AI models power the scoring?",
]


def _render_prompt(template: str, knowledge_base: str, history: str, message: str) -> str:
    """Safe substitution — avoids str.format() breaking on JSON braces in values."""
    return (
        template.replace("{knowledge_base}", knowledge_base)
        .replace("{history}", history)
        .replace("{message}", message)
    )


def _history_text(history: list[dict[str, Any]]) -> str:
    if not history:
        return "(no previous messages — this is the start of the conversation)"
    lines = [f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-8:]]
    return "\n".join(lines)


def _user_stats_line(context: dict[str, Any]) -> str:
    completed = context.get("user_completed_interviews", 0)
    avg = context.get("user_average_score")
    if completed and avg:
        return (
            f"Based on your {completed} completed interview{'s' if completed != 1 else ''} "
            f"(average score {avg}/100), "
        )
    if completed:
        return f"Based on your {completed} completed interview{'s' if completed != 1 else ''}, "
    return ""


_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|hiya|howdy|yo|sup|greetings|"
    r"good\s+(morning|afternoon|evening|day)|"
    r"what'?s?\s+up|thanks|thank\s+you|thx|"
    r"bye|goodbye|see\s+you|nice\s+to\s+meet)\b",
    re.I,
)


def _normalize_message(message: str) -> str:
    return re.sub(r"[^\w\s']", " ", message.lower()).strip()


def _is_greeting_or_smalltalk(message: str) -> bool:
    normalized = _normalize_message(message)
    if not normalized:
        return True
    if _GREETING_RE.match(normalized):
        return True
    words = normalized.split()
    if len(words) <= 3 and "?" not in message:
        casual = {"hi", "hello", "hey", "thanks", "thank", "yo", "sup", "bye", "ok", "okay", "cool", "nice"}
        if words and all(w in casual for w in words):
            return True
    return False


def _looks_like_follow_up(message: str) -> bool:
    normalized = _normalize_message(message)
    if not normalized or _is_greeting_or_smalltalk(message):
        return False
    if "?" in message:
        return True
    follow_up_patterns = (
        r"\b(that|this|those|these|it|them|same|above|earlier|before)\b",
        r"\b(more|also|another|else|again|recap|repeat|continue|clarify)\b",
        r"\b(what about|how about|tell me more|go on|and then|you said|you mentioned)\b",
        r"^(why|how|what|when|where|which|who|can you|could you|do you|does it|is it|are there)\b",
    )
    return any(re.search(pattern, normalized) for pattern in follow_up_patterns)


def _reply_greeting(context: dict[str, Any], message: str) -> str:
    normalized = _normalize_message(message)
    completed = context.get("user_completed_interviews", 0)

    if re.search(r"\b(thanks|thank you|thx)\b", normalized):
        return (
            "You're welcome! Happy to help anytime. "
            "If you want to dig into scoring, AI models, or interview strategy, just ask."
        )
    if re.search(r"\b(bye|goodbye|see you)\b", normalized):
        return "Good luck with your practice interviews! Come back whenever you want coaching or platform help."

    stats_hint = ""
    if completed:
        stats_hint = (
            f" I can see you've completed {completed} interview{'s' if completed != 1 else ''} here — "
            "ask me how to improve your scores or how evaluation works."
        )

    return (
        "Hello! I'm your Mock Interview Pro expert advisor."
        f"{stats_hint}\n\n"
        "Ask me about scoring, local AI models, behavior analysis, STAR answers, or your reports — "
        "what would you like to know?"
    )


def _detect_topics(message: str) -> list[str]:
    """Priority-ordered topic detection — specific topics before generic ones."""
    m = message.lower()

    if re.search(r"\b(model|ollama|llama|whisper|gpt|chatgpt|which ai|what ai|ai stack|ai model)\b", m):
        return ["ai_stack"]

    if re.search(r"\b(dimensions?|criteria|rubric|scoring dimension|what do you (score|measure|rate))\b", m):
        return ["dimensions"]

    if re.search(r"\b(behavior|behaviour|eye contact|gaze|prosody|video analys|facial emotion|delivery|nervous)\b", m):
        return ["behavior"]

    if re.search(r"\b(behavioral answer|star method|situation.task|tell me about a time|soft skill|strong behavioral)\b", m):
        return ["behavioral_tips"]

    if re.search(r"\b(mastery|mastered|skip question|remember|memory|cross.interview)\b", m):
        return ["mastery"]

    if re.search(r"\b(report|pdf|hiring recommendation|overall score|final score)\b", m):
        return ["report"]

    if re.search(
        r"(evaluat\w*|how do you score|how does scoring|how are answers|how it works|pipeline|process|"
        r"\bscoring\b|\bscore\b|\bevaluate\b|\bevaluation\b|interview process)",
        m,
    ):
        return ["evaluation"]

    if re.search(r"\b(pass|fail|threshold|grade|band)\b", m) or re.search(r"\b70\b", m):
        return ["thresholds"]

    if re.search(r"\b(improve|better answer|tips|advice|stronger|weak)\b", m):
        return ["coaching"]

    return ["overview"]


def _reply_ai_stack(context: dict[str, Any]) -> str:
    stack = context.get("ai_stack") or {}
    llm = stack.get("llm", f"Llama 3 8B ({OLLAMA_MODEL}) via Ollama")
    stt = stack.get("stt", "OpenAI Whisper (local, model: small)")
    vision = stack.get("vision", "MediaPipe + emotion/gaze analysis on video snapshots")
    backend = stack.get("backend", "Laravel API + queue workers")
    ai_service = stack.get("ai_service", "FastAPI orchestrator")

    return (
        "Mock Interview Pro runs entirely on your local stack — no ChatGPT or cloud API keys:\n\n"
        f"• Answer scoring & coaching: {llm}. Ollama sends your question + transcript to the model, "
        "which returns structured JSON scores across five dimensions.\n"
        f"• Speech-to-text: {stt} — transcribes your spoken answers during live interviews.\n"
        f"• Behavior analysis: {vision} — analyzes eye contact, emotion, head stability, and voice prosody.\n"
        f"• Orchestration: {ai_service} coordinates agents; {backend} handles auth, storage, and WebSocket events.\n\n"
        "If Ollama is temporarily unavailable, a rule-based heuristic evaluator in both Python and PHP "
        "ensures you still receive scores and feedback — so you're never blocked."
    )


def _reply_dimensions(context: dict[str, Any]) -> str:
    dims = context.get("dimension_details") or {}
    pass_t = context.get("pass_threshold", 70)
    lines = [
        "Every answer is scored on five independent dimensions (0–100 each), then combined into an overall score:\n"
    ]
    for key, desc in dims.items():
        label = key.replace("_", " ").title()
        lines.append(f"• {label} — {desc}")
    lines.append(
        f"\nThe overall score drives your pass/fail ({pass_t}+ = pass), hiring recommendation tier, "
        "and whether a model answer is generated for coaching."
    )
    return "\n".join(lines)


def _reply_behavior(context: dict[str, Any]) -> str:
    weights = context.get("behavior_weights") or {}
    return (
        "Behavior analysis is a separate layer from answer content scoring — it does NOT replace your "
        "relevance or technical scores. Here's how it works:\n\n"
        "During video interviews, we capture snapshots and analyze:\n"
        "• Eye contact ratio — are you looking at the camera?\n"
        "• Facial emotions — positive vs nervous expressions\n"
        "• Head stability — excessive movement signals uncertainty\n"
        "• Blink rate — abnormal patterns may indicate stress\n"
        "• Voice prosody — pitch variance and pause ratio from your audio\n\n"
        "These feed into Confidence and Nervousness scores (0–100) using weighted formulas "
        f"(confidence weights: {json.dumps(weights.get('confidence', {})) if weights else 'emotion, gaze, stability, pitch, blink'}). "
        "They appear in your final report alongside answer scores, giving coaching context about "
        "delivery — not punishing you for content gaps."
    )


def _reply_behavioral_tips(context: dict[str, Any]) -> str:
    prefix = _user_stats_line(context)
    return (
        f"{prefix}A strong behavioral answer uses the STAR method:\n\n"
        "• Situation — Set the scene in 1–2 sentences (project, team, challenge).\n"
        "• Task — Your specific responsibility.\n"
        "• Action — What YOU did (tools, decisions, collaboration). Use 'I', not 'we'.\n"
        "• Result — Measurable outcome (on-time delivery, fewer bugs, happy client).\n\n"
        "Common mistakes we penalize: staying vague ('I usually collaborate well'), skipping the result, "
        "or describing the team instead of your personal actions. Aim for 60–90 seconds with one concrete "
        "example. Our communication and completeness dimensions specifically reward structured, specific answers."
    )


def _reply_evaluation(context: dict[str, Any]) -> str:
    pass_t = context.get("pass_threshold", 70)
    model_t = context.get("model_answer_threshold", 70)
    prefix = _user_stats_line(context)
    return (
        f"{prefix}Here's the full evaluation pipeline for each answer you record:\n\n"
        "1. Your speech is transcribed by Whisper STT.\n"
        "2. The question text, your transcript, required skills, and category are sent to Llama 3 (Ollama).\n"
        "3. The model scores five dimensions and returns strengths, weaknesses, and recommendations as JSON.\n"
        "4. Post-processing clamps scores 0–100 and applies transcript overrides (e.g. refusals are downgraded).\n"
        "5. If Ollama is offline, a heuristic evaluator mirrors the same dimensions using keyword/signal analysis.\n"
        f"6. Overall score ≥ {pass_t} = pass. Below {model_t}, we generate a model answer showing what a stronger response looks like.\n"
        "7. For video answers, behavior analysis runs in parallel and merges into your final report."
    )


def _reply_mastery(context: dict[str, Any]) -> str:
    mastery_t = context.get("mastery_threshold", 60)
    return (
        f"Mastery memory tracks questions you've already passed (score ≥ {mastery_t}). "
        "After each interview, passed questions and topics are saved to your user profile. "
        "On your next interview setup, the question generator reads this memory and skips topics "
        "you've mastered — so you practice new areas instead of repeating what you already know. "
        "This builds progressively harder, personalized interview sessions over time."
    )


def _reply_report(context: dict[str, Any]) -> str:
    tiers = context.get("hiring_recommendation_tiers") or {}
    tier_text = ", ".join(f"{k.replace('_', ' ')} ≥ {v}" for k, v in tiers.items()) if tiers else "strong_yes ≥ 85, yes ≥ 70, maybe ≥ 55"
    return (
        "When you complete an interview, all per-answer scores are aggregated into a final report:\n\n"
        "• Overall score (0–100) and per-category breakdown\n"
        "• Strengths and weaknesses across the session\n"
        "• Hiring recommendation tier based on your average\n"
        f"• Tiers: {tier_text}\n"
        "• Behavior summary (confidence, nervousness, coaching narrative) if video was recorded\n"
        "• Downloadable PDF for sharing or review\n\n"
        "You can also open per-question explain pages with STAR breakdowns and model answers."
    )


def _reply_thresholds(context: dict[str, Any]) -> str:
    pass_t = context.get("pass_threshold", 70)
    mastery_t = context.get("mastery_threshold", 60)
    bands = context.get("grade_bands") or {}
    return (
        f"Key score thresholds in Mock Interview Pro:\n\n"
        f"• Pass threshold: {pass_t}/100 — answers at or above this count as passing\n"
        f"• Mastery threshold: {mastery_t}/100 — questions you pass are remembered for future sessions\n"
        f"• Model answer generated when overall score is below {context.get('model_answer_threshold', 70)}\n"
        f"• Grade bands: Excellent ≥ {bands.get('excellent', 85)}, Good ≥ {bands.get('good', 70)}, "
        f"Fair ≥ {bands.get('fair', 55)}\n\n"
        "Dashboard letter grades (A/B/C/D) use these same bands for your session averages."
    )


def _reply_coaching(context: dict[str, Any]) -> str:
    prefix = _user_stats_line(context)
    return (
        f"{prefix}To improve your scores across all five dimensions:\n\n"
        "• Relevance — Answer the question directly in your first sentence, don't pivot.\n"
        "• Technical accuracy — Name specific tools, patterns, and outcomes (Laravel features, SQL, Git workflow).\n"
        "• Communication — Structure with STAR for behavioral, step-by-step for technical.\n"
        "• Confidence — Speak for at least 30–60 seconds; brief answers score low on completeness.\n"
        "• Completeness — Cover situation, your actions, AND the result.\n\n"
        "After each interview, read the per-question explain pages — they show exactly where your answer "
        "fell short and provide a full model answer you can practice."
    )


def _reply_overview(context: dict[str, Any]) -> str:
    return (
        "I'm your Mock Interview Pro expert advisor. I can explain:\n\n"
        "• How we evaluate your answers (5 scoring dimensions + Llama 3 AI)\n"
        "• Which local AI models power scoring, transcription, and behavior analysis\n"
        "• How video behavior metrics (eye contact, emotion, prosody) appear in your report\n"
        "• How to structure strong behavioral answers with STAR\n"
        "• Mastery memory, hiring recommendations, and PDF reports\n\n"
        "What would you like to dive into?"
    )


TOPIC_HANDLERS = {
    "ai_stack": _reply_ai_stack,
    "dimensions": _reply_dimensions,
    "behavior": _reply_behavior,
    "behavioral_tips": _reply_behavioral_tips,
    "evaluation": _reply_evaluation,
    "mastery": _reply_mastery,
    "report": _reply_report,
    "thresholds": _reply_thresholds,
    "coaching": _reply_coaching,
    "overview": _reply_overview,
}

TOPIC_FOLLOWUPS: dict[str, list[str]] = {
    "ai_stack": [
        "How do you evaluate our interview questions and our answers?",
        "What happens when Ollama is offline?",
        "How does behavior analysis work?",
    ],
    "dimensions": [
        "How does behavior analysis affect my score?",
        "What makes a strong behavioral answer?",
        "How can I improve my scores?",
    ],
    "behavior": [
        "What scoring dimensions do you use?",
        "Does poor eye contact fail my interview?",
        "How is the final report structured?",
    ],
    "behavioral_tips": [
        "How do you evaluate our interview questions and our answers?",
        "What are the pass thresholds?",
        "How does mastery memory work?",
    ],
    "evaluation": [
        "Which AI models power the scoring?",
        "What scoring dimensions do you use?",
        "How can I improve my scores?",
    ],
}


def _expert_reply(message: str, history: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any]:
    """Knowledge-driven expert system — used when Ollama is unavailable or returns empty."""
    if _is_greeting_or_smalltalk(message):
        return {
            "reply": _reply_greeting(context, message).strip(),
            "suggested_followups": DEFAULT_FOLLOWUPS,
        }

    topics = _detect_topics(message)
    primary = topics[0]

    # Follow-up detection: only when the message clearly references prior context
    if primary == "overview" and history and _looks_like_follow_up(message):
        last_user = next((h["content"] for h in reversed(history) if h.get("role") == "user"), "")
        if last_user and not _is_greeting_or_smalltalk(last_user):
            topics = _detect_topics(last_user)
            primary = topics[0]

    handler = TOPIC_HANDLERS.get(primary, _reply_overview)
    reply = handler(context)

    # If multiple topics detected, append secondary (max 1)
    if len(topics) > 1 and topics[1] != primary:
        secondary_handler = TOPIC_HANDLERS.get(topics[1])
        if secondary_handler:
            reply += "\n\n" + secondary_handler(context)

    followups = TOPIC_FOLLOWUPS.get(primary, DEFAULT_FOLLOWUPS)
    return {"reply": reply.strip(), "suggested_followups": followups}


async def chat_expert(
    message: str,
    history: list[dict[str, Any]],
    context: dict[str, Any],
) -> dict[str, Any]:
    message = (message or "").strip()
    if not message:
        return {
            "reply": "Ask me anything about how Mock Interview Pro scores your answers, which AI models we use, or how to improve.",
            "suggested_followups": DEFAULT_FOLLOWUPS,
        }

    expert_fallback = _expert_reply(message, history, context)

    template = load_prompt("expert_advisor")
    if not template.strip():
        return expert_fallback

    kb_json = json.dumps(context, indent=2, ensure_ascii=False)
    prompt = _render_prompt(template, kb_json, _history_text(history), message)

    expert_system = (
        "You are a senior mock interview coach and product expert for Mock Interview Pro. "
        "Answer the specific question asked. Use conversation history for follow-ups. "
        "Return valid JSON only with reply and suggested_followups fields."
    )

    raw = await call_ollama(
        prompt,
        ExpertChatResult.model_json_schema(),
        system=expert_system,
        num_predict=900,
    )

    if not raw or "reply" not in raw:
        logger.warning("Expert chat: Ollama unavailable — using knowledge-based expert system")
        return expert_fallback

    try:
        result = parse_with_fallback(raw, expert_fallback)
        reply = str(result.get("reply") or "").strip()
        if len(reply) < 20 and not _is_greeting_or_smalltalk(message):
            return expert_fallback
        followups = result.get("suggested_followups")
        if not isinstance(followups, list) or not followups:
            followups = expert_fallback["suggested_followups"]
        return ExpertChatResult(reply=reply, suggested_followups=followups[:4]).model_dump()
    except Exception as exc:
        logger.warning("Invalid expert chat JSON: %s", exc)
        return expert_fallback
