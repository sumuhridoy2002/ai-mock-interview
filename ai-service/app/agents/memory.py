from typing import Any


MAX_SUMMARIES = 20


def merge_memory(
    memory: dict[str, Any],
    question: str,
    transcript: str,
    evaluation: dict[str, Any],
    topic: str | None = None,
) -> dict[str, Any]:
    questions = list(memory.get("questions_asked") or [])
    questions.append(question)

    summaries = list(memory.get("answers_summary") or [])
    summaries.append((transcript or "")[:200])
    if len(summaries) > MAX_SUMMARIES:
        summaries = summaries[-MAX_SUMMARIES:]

    strengths = list(dict.fromkeys(
        (memory.get("candidate_strengths") or []) + (evaluation.get("strengths") or [])
    ))
    weaknesses = list(dict.fromkeys(
        (memory.get("candidate_weaknesses") or []) + (evaluation.get("weaknesses") or [])
    ))

    topics = list(memory.get("topics_covered") or [])
    if topic and topic not in topics:
        topics.append(topic)

    token_budget = memory.get("token_budget_used", 0)
    token_budget += len(question) + len(transcript or "")

    return {
        "questions_asked": questions,
        "answers_summary": summaries,
        "candidate_strengths": strengths[:15],
        "candidate_weaknesses": weaknesses[:15],
        "topics_covered": topics,
        "token_budget_used": token_budget,
    }


def truncate_memory(memory: dict[str, Any], max_tokens: int = 4000) -> dict[str, Any]:
    if memory.get("token_budget_used", 0) <= max_tokens:
        return memory

    summaries = memory.get("answers_summary") or []
    if len(summaries) > 5:
        memory["answers_summary"] = summaries[-5:]
        memory["token_budget_used"] = max_tokens

    return memory
