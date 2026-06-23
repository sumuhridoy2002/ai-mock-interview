"""Offline answer evaluation when Ollama is unavailable."""

import re
from typing import Any

from app.schemas import EvaluationResult

GARBAGE_PATTERN = re.compile(r"[^\x00-\x7F]{2,}")

TECH_TERMS = (
    "laravel",
    "php",
    "mysql",
    "api",
    "rest",
    "mvc",
    "eloquent",
    "database",
    "javascript",
    "vue",
    "react",
)

REFUSAL_PATTERNS = (
    re.compile(r"\bsorry\b", re.I),
    re.compile(r"\b(can'?t|cannot|can not)\b.*\banswer\b", re.I),
    re.compile(r"\b(don'?t|do not)\b know\b", re.I),
    re.compile(r"\bno answer\b", re.I),
    re.compile(r"\bpass on this\b", re.I),
    re.compile(r"\bskip (this )?question\b", re.I),
    re.compile(r"\bi (can'?t|cannot) (answer|respond)\b", re.I),
)

CONFUSION_PATTERNS = (
    re.compile(r"\bcan you (please )?(ask|repeat)\b", re.I),
    re.compile(r"\b(don'?t|do not) understand\b", re.I),
    re.compile(r"\bcannot understand\b", re.I),
    re.compile(r"\bwhat do you mean\b", re.I),
    re.compile(r"\bplease ask me\b", re.I),
)

SKIP_OR_NON_ANSWER_PATTERNS = (
    re.compile(r"\bnext question\b", re.I),
    re.compile(r"\bask me (the )?next\b", re.I),
    re.compile(r"\bmove on\b", re.I),
    re.compile(r"\black of knowledge\b", re.I),
    re.compile(r"\bno knowledge\b", re.I),
    re.compile(r"\bnot sure (about|how to)\b", re.I),
)


def sanitize_transcript(text: str) -> tuple[str, bool]:
    had_garbage = bool(GARBAGE_PATTERN.search(text))
    cleaned = GARBAGE_PATTERN.sub(" ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned, had_garbage


def model_answer_for(question: str, category: str) -> str:
    snippet = question[:120]
    if category in ("behavioral", "communication"):
        return (
            f'For "{snippet}", a strong answer uses STAR: set the Situation, '
            "explain your Task, describe specific Actions, and share the Result."
        )
    if category in ("technical", "problem_solving"):
        return (
            f'For "{snippet}", explain your approach step-by-step, name Laravel features '
            "(routes, controllers, FormRequest, Sanctum/Passport, etc.), and give a concrete example."
        )
    return (
        f'For "{snippet}", give a specific, structured answer with a real example '
        "and clear actions and results."
    )


def is_refusal(transcript: str) -> bool:
    text = transcript.strip()
    if not text:
        return False
    word_count = len(text.split())
    matches = sum(1 for pattern in REFUSAL_PATTERNS if pattern.search(text))
    if matches >= 1 and word_count <= 20:
        return True
    if matches >= 2:
        return True
    return bool(re.search(r"^sorry\b.*\b(cannot|can't|can not)\b", text, re.I))


def is_confusion_or_off_topic(transcript: str, question: str) -> bool:
    text = transcript.strip()
    if not text:
        return False
    if any(pattern.search(text) for pattern in CONFUSION_PATTERNS):
        return True
    question_words = {
        w.lower()
        for w in re.findall(r"[a-zA-Z]{4,}", question)
        if w.lower() not in {"tell", "about", "describe", "what", "your", "would", "could", "please", "this", "that", "with", "from", "have", "been", "when", "where"}
    }
    answer_words = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", text)}
    if question_words and len(question_words & answer_words) == 0 and len(text.split()) < 25:
        return True
    return False


def is_skip_or_non_answer(transcript: str, question: str = "") -> bool:
    text = transcript.strip()
    if not text:
        return True
    if is_refusal(text):
        return True
    if is_confusion_or_off_topic(text, question):
        return True
    return any(pattern.search(text) for pattern in SKIP_OR_NON_ANSWER_PATTERNS)


def is_substantive_answer(transcript: str, min_words: int = 12) -> bool:
    text = transcript.strip()
    if not text or is_skip_or_non_answer(text):
        return False
    return len(text.split()) >= min_words


def should_clarify_previous(last_answer: str, last_score: int | None, last_question: str = "") -> bool:
    if last_score is None or last_score >= 55:
        return False
    return is_substantive_answer(last_answer) and not is_skip_or_non_answer(last_answer, last_question)


def quotes_last_answer(question: str, last_answer: str) -> bool:
    answer = re.sub(r"\s+", " ", last_answer.strip())
    if len(answer) < 12:
        return False
    normalized_q = question.lower()
    for length in (80, 60, 40, 25):
        snippet = answer[:length].lower().strip()
        if len(snippet) >= 20 and snippet in normalized_q:
            return True
        if len(snippet) >= 15 and f'"{snippet}' in normalized_q:
            return True
    return 'you mentioned "' in normalized_q and is_skip_or_non_answer(last_answer)


def refusal_evaluation(question: str, category: str) -> dict[str, Any]:
    return EvaluationResult(
        score=8,
        relevance=5,
        technical_accuracy=0,
        communication=10,
        confidence=5,
        completeness=0,
        strengths=[],
        weaknesses=["Did not attempt to answer the question"],
        recommendations=[
            "When unsure, share what you do know or describe a related experience instead of declining",
        ],
        model_answer=model_answer_for(question, category),
    ).model_dump()


def confusion_evaluation(question: str, category: str) -> dict[str, Any]:
    return EvaluationResult(
        score=18,
        relevance=12,
        technical_accuracy=8,
        communication=20,
        confidence=15,
        completeness=10,
        strengths=[],
        weaknesses=["Response did not address what the interviewer asked"],
        recommendations=[
            "Listen to the full question, then answer it directly — ask for clarification only if truly needed",
        ],
        model_answer=model_answer_for(question, category),
    ).model_dump()


def _targeted_recommendations(
    category: str,
    *,
    too_brief: bool,
    missing_skills: bool,
    missing_technical_terms: bool,
    repetitive: bool,
    weak_tie_in: bool,
) -> list[str]:
    picks: list[str] = []

    if too_brief:
        picks.append("Expand with a concrete example: what you did, how you did it, and the outcome")
    if missing_skills and category in ("technical", "problem_solving"):
        picks.append("Name specific tools from the job description (e.g. Laravel, MySQL, REST APIs)")
    elif missing_skills:
        picks.append("Connect your answer to skills or requirements mentioned in the job description")
    if missing_technical_terms and category in ("technical", "problem_solving"):
        picks.append("Explain the Laravel approach: routes, controllers, validation, auth, and database layer")
    if repetitive:
        picks.append("Avoid repeating the same phrases — add new details in each sentence")
    if weak_tie_in:
        picks.append("Tie your experience more directly to the role you are interviewing for")
    if category == "behavioral" and not too_brief and len(picks) < 2:
        picks.append("Structure with Situation, Task, Action, and Result when describing past experience")
    if category == "problem_solving" and not missing_technical_terms and len(picks) < 2:
        picks.append("Walk through diagnosis steps, the fix you applied, and how you verified it worked")
    if category == "scenario" and len(picks) < 2:
        picks.append("State your priorities first, then the actions you would take")
    if category == "communication" and len(picks) < 2:
        picks.append("Lead with your main point, then support it with one specific example")

    if not picks:
        picks.append("Add one more specific detail or metric to strengthen this answer")

    return picks[:2]


def evaluate_heuristic(
    transcript: str,
    category: str = "technical",
    required_skills: list[str] | None = None,
    question: str = "",
) -> dict[str, Any]:
    required_skills = required_skills or []
    transcript, poor_quality = sanitize_transcript(transcript)

    if is_confusion_or_off_topic(transcript, question):
        return confusion_evaluation(question, category)

    if is_refusal(transcript):
        return refusal_evaluation(question, category)

    words = transcript.split()
    word_count = len(words)
    text_lower = transcript.lower()
    unique_ratio = len({w.lower() for w in words}) / max(word_count, 1)

    base = 48 + min(word_count, 12)
    skill_hits = sum(1 for skill in required_skills[:10] if skill.lower() in text_lower)
    base += min(skill_hits * 4, 16)

    has_technical_terms = any(term in text_lower for term in TECH_TERMS)
    if category in ("technical", "problem_solving") and has_technical_terms:
        base += 6

    too_brief = word_count < 15
    if too_brief:
        base -= 14
    if poor_quality:
        base -= 18
    if unique_ratio < 0.45 and word_count > 20:
        base -= 10

    category_offset = {"technical": 2, "behavioral": -1, "problem_solving": 0, "scenario": 1, "communication": -2}
    base += category_offset.get(category, 0)
    base = max(32, min(88, base))

    strengths: list[str] = []
    weaknesses: list[str] = []

    if word_count >= 20 and not too_brief:
        strengths.append("Provided a substantive spoken response")
    if skill_hits >= 2:
        strengths.append(f"Mentioned {skill_hits} relevant skills from the role")
    elif skill_hits == 1:
        strengths.append("Referenced a skill relevant to the position")
    if category in ("technical", "problem_solving") and has_technical_terms:
        strengths.append("Used technical terminology appropriately")
    if category == "behavioral" and word_count >= 25 and any(w in text_lower for w in ("project", "team", "worked", "delivered")):
        strengths.append("Described relevant work experience")

    missing_skills = skill_hits == 0
    missing_technical_terms = category in ("technical", "problem_solving") and not has_technical_terms
    repetitive = unique_ratio < 0.45 and word_count > 20
    weak_tie_in = word_count >= 40 and skill_hits == 0

    if too_brief:
        weaknesses.append("Answer was too brief — add a concrete example with actions and outcome")
    if poor_quality:
        weaknesses.append("Transcription quality may be poor")
    if missing_skills and category in ("technical", "problem_solving"):
        weaknesses.append("Did not mention specific tools or technologies from the job")
    elif missing_skills:
        weaknesses.append("Did not connect the answer to role requirements")
    if missing_technical_terms:
        weaknesses.append("Did not explain the technical approach or Laravel concepts asked about")
    if repetitive:
        weaknesses.append("Response had repetitive phrasing")
    if weak_tie_in:
        weaknesses.append("Could tie your experience more directly to the role requirements")

    recommendations = _targeted_recommendations(
        category,
        too_brief=too_brief,
        missing_skills=missing_skills,
        missing_technical_terms=missing_technical_terms,
        repetitive=repetitive,
        weak_tie_in=weak_tie_in,
    )

    show_model = base < 80 or bool(weaknesses)

    return EvaluationResult(
        score=base,
        relevance=max(32, min(100, base + (2 if skill_hits else -4))),
        technical_accuracy=max(32, min(100, base - (8 if missing_technical_terms else 4))),
        communication=max(32, min(100, base - (12 if poor_quality else 0))),
        confidence=max(32, min(100, base - 2)),
        completeness=max(32, min(100, base - (10 if too_brief else 0))),
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        model_answer=model_answer_for(question, category) if show_model else None,
    ).model_dump()


def apply_transcript_overrides(result: dict[str, Any], transcript: str, question: str, category: str) -> dict[str, Any]:
    """Override inflated LLM scores when the transcript is clearly a refusal or off-topic."""
    transcript, _ = sanitize_transcript(transcript)
    if is_confusion_or_off_topic(transcript, question):
        return confusion_evaluation(question, category)
    if is_refusal(transcript):
        return refusal_evaluation(question, category)
    return result
