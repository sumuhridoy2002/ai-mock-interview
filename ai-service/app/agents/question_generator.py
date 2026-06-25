import json
import re
from typing import Any, Optional

from app.schemas import QuestionResult
from app.services.heuristic_evaluator import (
    is_skip_or_non_answer,
    quotes_last_answer,
    should_clarify_previous,
)
from app.services.ollama_client import call_ollama, load_prompt, parse_with_fallback

INTERVIEWER_SYSTEM = load_prompt("interviewer")

VALID_CATEGORIES = frozenset({"technical", "behavioral", "problem_solving", "scenario", "communication"})
VALID_DIFFICULTIES = frozenset({"junior", "mid", "senior"})

_REPETITIVE_PREFIXES = (
    "building on what you shared",
    "building on that",
    "building on what you shared about",
    "you mentioned \"",
)


async def generate_question(
    cv_profile: dict[str, Any],
    job_analysis: dict[str, Any],
    memory: dict[str, Any],
    experience_level: str = "mid",
    interview_type: str = "mixed",
    last_answer: Optional[str] = None,
    question_number: int = 1,
    job_title: str = "this role",
    qa_history: Optional[list[dict[str, Any]]] = None,
    user_memory: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    qa_history = qa_history or []
    user_memory = user_memory or {}

    # Session-scoped asked questions
    session_asked = memory.get("questions_asked") or []
    # Cross-interview mastered questions (from user_memory_profiles)
    mastered_questions = user_memory.get("mastered_questions") or []
    mastered_topics_raw = user_memory.get("mastered_topics") or []
    mastered_topics: set[str] = {str(t).lower().strip() for t in mastered_topics_raw}

    # Merge both into one dedup set
    all_asked = list(dict.fromkeys(session_asked + mastered_questions))
    asked_normalized = {_normalize_question(q) for q in all_asked}

    if question_number <= 1:
        result = await _generate_opening(
            cv_profile, job_analysis, experience_level, interview_type, job_title, asked_normalized,
            user_memory=user_memory,
        )
    else:
        result = await _generate_follow_up(
            cv_profile,
            job_analysis,
            memory,
            experience_level,
            interview_type,
            job_title,
            question_number,
            qa_history,
            all_asked,
            asked_normalized,
            last_answer,
            user_memory=user_memory,
        )

    question = (result.get("question") or "").strip()
    last_answer_text = ""
    if qa_history:
        last_answer_text = (qa_history[-1].get("answer") or "").strip()

    topic_of_result = (result.get("topic") or "").lower().strip()
    topic_is_mastered = bool(topic_of_result and topic_of_result in mastered_topics)

    if (
        not question
        or _normalize_question(question) in asked_normalized
        or _is_repetitive_template(question, asked_normalized)
        or topic_is_mastered
        or (last_answer_text and quotes_last_answer(question, last_answer_text))
        or (last_answer_text and is_skip_or_non_answer(last_answer_text) and "you mentioned" in question.lower())
    ):
        result = _phase_fallback(
            question_number,
            cv_profile,
            job_analysis,
            job_title,
            qa_history,
            asked_normalized,
            experience_level,
            mastered_topics=mastered_topics,
        )

    defaults = {
        "category": result.get("category", "technical"),
        "difficulty": experience_level,
        "topic": result.get("topic", "general"),
    }
    result = _coerce_question_result(result, defaults)

    return QuestionResult(**result).model_dump()


def _coerce_question_result(result: dict[str, Any], defaults: dict[str, Any]) -> dict[str, Any]:
    merged = {**defaults, **{k: v for k, v in result.items() if v is not None}}
    category = str(merged.get("category", "technical")).lower().replace("-", "_").replace(" ", "_")
    if category not in VALID_CATEGORIES:
        category = str(defaults.get("category", "technical"))
        if category not in VALID_CATEGORIES:
            category = "technical"
    merged["category"] = category

    difficulty = str(merged.get("difficulty", defaults.get("difficulty", "mid"))).lower()
    if difficulty not in VALID_DIFFICULTIES:
        difficulty = str(defaults.get("difficulty", "mid")).lower()
        if difficulty not in VALID_DIFFICULTIES:
            difficulty = "mid"
    merged["difficulty"] = difficulty

    merged["question"] = str(merged.get("question", "")).strip()
    merged["topic"] = str(merged.get("topic") or defaults.get("topic") or "general")
    return merged


async def _generate_opening(
    cv_profile: dict,
    job_analysis: dict,
    experience_level: str,
    interview_type: str,
    job_title: str,
    asked_normalized: set[str],
    user_memory: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    user_memory = user_memory or {}
    mastered_topics = user_memory.get("mastered_topics") or []
    prior_strengths = user_memory.get("prior_strengths") or []

    template = load_prompt("question_opening")
    prompt = template.format(
        cv_json=json.dumps(cv_profile)[:2500],
        job_json=json.dumps(job_analysis)[:2000],
        experience_level=experience_level,
        interview_type=interview_type,
        job_title=job_title,
        mastered_topics_json=json.dumps(mastered_topics),
        prior_strengths_json=json.dumps(prior_strengths[:10]),
    )

    raw = await call_ollama(
        prompt,
        QuestionResult.model_json_schema(),
        system=INTERVIEWER_SYSTEM,
    )

    defaults = {
        "question": _opening_fallback(cv_profile, job_analysis, job_title),
        "category": "behavioral",
        "difficulty": experience_level,
        "topic": "introduction",
    }

    return parse_with_fallback(raw, defaults)


async def _generate_follow_up(
    cv_profile: dict,
    job_analysis: dict,
    memory: dict,
    experience_level: str,
    interview_type: str,
    job_title: str,
    question_number: int,
    qa_history: list[dict],
    asked: list[str],
    asked_normalized: set[str],
    last_answer: Optional[str],
    user_memory: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    user_memory = user_memory or {}
    mastered_topics = user_memory.get("mastered_topics") or []
    prior_strengths = user_memory.get("prior_strengths") or []
    prior_weaknesses = user_memory.get("prior_weaknesses") or []
    mastered_questions_extra = user_memory.get("mastered_questions") or []

    if not qa_history and last_answer:
        qa_history = [{"question": asked[-1] if asked else "", "answer": last_answer, "score": None}]

    # Combine session asked + cross-interview mastered for the prompt
    all_asked_for_prompt = list(dict.fromkeys(asked + mastered_questions_extra))

    template = load_prompt("question_follow_up")
    prompt = template.format(
        cv_json=json.dumps(cv_profile)[:2000],
        job_json=json.dumps(job_analysis)[:2000],
        qa_history_json=json.dumps(qa_history, ensure_ascii=False)[:4000],
        questions_already_asked=json.dumps(all_asked_for_prompt, ensure_ascii=False),
        experience_level=experience_level,
        interview_type=interview_type,
        job_title=job_title,
        question_number=question_number,
        mastered_topics_json=json.dumps(mastered_topics),
        prior_strengths_json=json.dumps(prior_strengths[:10]),
        prior_weaknesses_json=json.dumps(prior_weaknesses[:10]),
    )

    raw = await call_ollama(
        prompt,
        QuestionResult.model_json_schema(),
        system=INTERVIEWER_SYSTEM,
    )

    mastered_topics_set: set[str] = {str(t).lower().strip() for t in mastered_topics}

    fallback = _follow_up_fallback_dict(
        cv_profile, job_analysis, job_title, qa_history, asked_normalized, question_number,
        mastered_topics=mastered_topics_set,
    )
    defaults = {
        "question": fallback["question"],
        "category": fallback["category"],
        "difficulty": experience_level,
        "topic": fallback["topic"],
    }

    parsed = parse_with_fallback(raw, defaults)
    question = (parsed.get("question") or "").strip()
    last_answer = (qa_history[-1].get("answer") or "").strip() if qa_history else ""
    parsed_topic = (parsed.get("topic") or "").lower().strip()
    if (
        _is_repetitive_template(question, asked_normalized)
        or (parsed_topic and parsed_topic in mastered_topics_set)
        or (last_answer and quotes_last_answer(question, last_answer))
        or (last_answer and is_skip_or_non_answer(last_answer) and "you mentioned" in question.lower())
    ):
        parsed = fallback

    return parsed


def _opening_fallback(cv: dict, job: dict, job_title: str) -> str:
    skills = cv.get("skills") or []
    projects = cv.get("projects") or []
    experience = cv.get("experience_years") or cv.get("years_experience")

    if skills:
        skill = skills[0]
        return (
            f"Thanks for joining today. To start, could you introduce yourself and tell me "
            f"how your experience with {skill} prepares you for the {job_title} role?"
        )

    if projects:
        project = projects[0]
        return (
            f"Welcome. I'd like to hear about yourself first — especially your work on "
            f"{project} and why you're interested in this {job_title} position."
        )

    if experience:
        return (
            f"Let's begin with introductions. With about {experience} years of experience, "
            f"what drew you to apply for this {job_title} role?"
        )

    required = (job.get("required_skills") or [])[:1]
    if required:
        return (
            f"To kick off, please introduce yourself and share how your background "
            f"aligns with our need for {required[0]} in this {job_title} role."
        )

    return (
        f"Thanks for being here. Please introduce yourself and walk me through "
        f"why you're a strong fit for the {job_title} position."
    )


def _detect_role_type(job_title: str, skills: list[str]) -> str:
    """Classify the role so the fallback pool stays relevant."""
    title_lower = job_title.lower()
    skills_lower = " ".join(str(s) for s in skills).lower()
    combined = f"{title_lower} {skills_lower}"

    tech_keywords = (
        "developer", "engineer", "programmer", "software", "backend", "frontend",
        "fullstack", "devops", "data scientist", "machine learning", "laravel",
        "react", "django", "node", "python", "java", "php", "api", "cloud",
        "devops", "sre", "qa", "tester", "architect", "database admin",
    )
    admin_keywords = (
        "executive", "admin", "desk", "clerk", "assistant", "coordinator",
        "secretary", "receptionist", "office", "data entry", "clerical",
        "support", "operations assistant", "personal assistant",
    )
    sales_keywords = (
        "sales", "marketing", "business development", "account manager",
        "customer success", "growth", "seo", "content", "brand", "digital marketing",
    )
    hr_keywords = (
        "hr", "human resources", "talent", "recruitment", "recruiter",
        "people", "learning and development", "payroll",
    )
    finance_keywords = (
        "finance", "accounting", "accountant", "bookkeeper", "financial",
        "audit", "tax", "treasury", "controller",
    )
    ops_keywords = (
        "manager", "director", "operations", "supervisor", "team lead",
        "project manager", "product manager", "scrum", "agile",
    )

    if any(k in combined for k in tech_keywords):
        return "technical"
    if any(k in combined for k in admin_keywords):
        return "administrative"
    if any(k in combined for k in sales_keywords):
        return "sales"
    if any(k in combined for k in hr_keywords):
        return "hr"
    if any(k in combined for k in finance_keywords):
        return "finance"
    if any(k in combined for k in ops_keywords):
        return "operations"
    return "general"


def _follow_up_question_pool(cv: dict, job: dict, job_title: str) -> list[dict[str, str]]:
    all_skills = (cv.get("skills") or []) + (job.get("required_skills") or [])
    skill = all_skills[0] if all_skills else None
    role_type = _detect_role_type(job_title, all_skills)

    if role_type == "technical":
        skill_str = skill or "your main technical stack"
        return [
            {"question": f"Tell me about a recent project where you used {skill_str}. What was your role and outcome?", "category": "technical", "topic": "projects"},
            {"question": "How do you approach debugging a complex issue in production?", "category": "problem_solving", "topic": "debugging"},
            {"question": f"If you joined as a {job_title}, what would you focus on in your first 30 days?", "category": "scenario", "topic": "onboarding"},
            {"question": "Tell me about a time you collaborated with a team under a tight deadline.", "category": "behavioral", "topic": "teamwork"},
            {"question": "How do you ensure code quality and maintainability in your work?", "category": "technical", "topic": "quality"},
            {"question": "Describe a time you received critical technical feedback. How did you respond?", "category": "behavioral", "topic": "feedback"},
            {"question": f"What part of the {job_title} role excites you most and why?", "category": "communication", "topic": "motivation"},
            {"question": "How do you stay current with new tools and technologies relevant to your role?", "category": "scenario", "topic": "learning"},
            {"question": "Walk me through how you approach planning and estimating a new feature or task.", "category": "problem_solving", "topic": "planning"},
            {"question": "Describe a situation where you had to make a technical decision with incomplete information.", "category": "scenario", "topic": "decision_making"},
        ]

    if role_type == "administrative":
        skill_str = skill or "Microsoft Office"
        return [
            {"question": f"How do you use tools like {skill_str} in your daily work? Can you give a specific example?", "category": "technical", "topic": "tools"},
            {"question": "How do you prioritize and manage multiple tasks or deadlines at the same time?", "category": "problem_solving", "topic": "time_management"},
            {"question": "Describe a time you had to handle a difficult request from a colleague or client professionally.", "category": "behavioral", "topic": "communication"},
            {"question": f"What do you think the most important responsibility of a {job_title} is?", "category": "communication", "topic": "role_understanding"},
            {"question": "Tell me about a time you noticed an error in a document or process and how you corrected it.", "category": "problem_solving", "topic": "attention_to_detail"},
            {"question": "How do you maintain confidentiality when handling sensitive information?", "category": "behavioral", "topic": "integrity"},
            {"question": f"If you joined as a {job_title}, what would you do in your first week to get up to speed?", "category": "scenario", "topic": "onboarding"},
            {"question": "Describe a situation where you had to learn a new tool or system quickly. How did you approach it?", "category": "scenario", "topic": "learning"},
            {"question": "How do you handle situations where you receive unclear or conflicting instructions?", "category": "behavioral", "topic": "communication"},
            {"question": "Tell me about a time you improved an administrative process or helped the team work more efficiently.", "category": "problem_solving", "topic": "improvement"},
        ]

    if role_type == "sales":
        return [
            {"question": f"Tell me about a successful sale or campaign you were part of. What was your contribution?", "category": "behavioral", "topic": "achievements"},
            {"question": "How do you handle rejection or a lost deal? What do you do next?", "category": "behavioral", "topic": "resilience"},
            {"question": f"What strategies do you use to understand a customer's needs before pitching?", "category": "technical", "topic": "discovery"},
            {"question": f"If you joined as a {job_title}, how would you approach your first 30 days building relationships?", "category": "scenario", "topic": "onboarding"},
            {"question": "Describe a time you had to manage multiple leads or accounts simultaneously.", "category": "problem_solving", "topic": "pipeline"},
            {"question": "How do you stay motivated when targets are challenging or the market is slow?", "category": "communication", "topic": "motivation"},
            {"question": "Tell me about a time you had to tailor your communication style for a specific audience.", "category": "behavioral", "topic": "communication"},
            {"question": "How do you keep up with competitor offerings and market trends?", "category": "scenario", "topic": "market_awareness"},
            {"question": "Describe a situation where you turned a negative customer experience into a positive one.", "category": "behavioral", "topic": "customer_success"},
            {"question": "What metrics do you track to measure your own performance in a sales or marketing role?", "category": "technical", "topic": "metrics"},
        ]

    if role_type == "hr":
        return [
            {"question": "Walk me through your approach to screening and shortlisting candidates for a role.", "category": "technical", "topic": "recruitment"},
            {"question": "Describe a time you handled a sensitive employee situation. How did you manage it?", "category": "behavioral", "topic": "employee_relations"},
            {"question": f"What do you think makes a strong onboarding experience for a new {job_title} hire?", "category": "scenario", "topic": "onboarding"},
            {"question": "How do you ensure fairness and consistency in performance review processes?", "category": "technical", "topic": "performance"},
            {"question": "Tell me about a time you had to communicate a difficult decision to an employee or team.", "category": "behavioral", "topic": "communication"},
            {"question": "How do you stay current with employment law or HR best practices?", "category": "scenario", "topic": "learning"},
            {"question": "Describe your experience with HR information systems or applicant tracking tools.", "category": "technical", "topic": "tools"},
            {"question": "How do you balance the needs of employees with the priorities of the business?", "category": "problem_solving", "topic": "balance"},
            {"question": "Tell me about a time you identified a gap in a people process and proposed an improvement.", "category": "problem_solving", "topic": "improvement"},
            {"question": "What does a healthy workplace culture look like to you, and how have you helped build it?", "category": "communication", "topic": "culture"},
        ]

    if role_type == "finance":
        skill_str = skill or "accounting tools"
        return [
            {"question": f"Tell me about your experience with {skill_str}. How have you used it in a financial context?", "category": "technical", "topic": "tools"},
            {"question": "How do you ensure accuracy and reduce errors in financial reporting?", "category": "problem_solving", "topic": "accuracy"},
            {"question": "Describe a time you identified a financial discrepancy. How did you investigate and resolve it?", "category": "problem_solving", "topic": "reconciliation"},
            {"question": f"If you joined as a {job_title}, what processes would you review first?", "category": "scenario", "topic": "onboarding"},
            {"question": "How do you manage month-end or year-end closing pressures?", "category": "behavioral", "topic": "deadlines"},
            {"question": "Tell me about a time you explained a complex financial matter to a non-finance stakeholder.", "category": "communication", "topic": "communication"},
            {"question": "How do you stay updated on regulatory or compliance changes that affect your work?", "category": "scenario", "topic": "compliance"},
            {"question": "Describe a process improvement you made in a finance or accounting workflow.", "category": "problem_solving", "topic": "improvement"},
            {"question": "How do you handle confidential financial information and maintain data integrity?", "category": "behavioral", "topic": "integrity"},
            {"question": "What financial software or ERP systems have you worked with, and what do you like about them?", "category": "technical", "topic": "systems"},
        ]

    # operations / general fallback
    skill_str = skill or "your key skills"
    return [
        {"question": f"Tell me about a situation where you applied {skill_str} to solve a real problem at work.", "category": "behavioral", "topic": "application"},
        {"question": f"What attracted you to the {job_title} role, and what do you hope to achieve in it?", "category": "communication", "topic": "motivation"},
        {"question": "How do you handle competing priorities when everything feels urgent?", "category": "problem_solving", "topic": "time_management"},
        {"question": "Tell me about a time you had to adapt quickly to an unexpected change at work.", "category": "behavioral", "topic": "adaptability"},
        {"question": f"If you joined as a {job_title}, what would your first 30 days look like?", "category": "scenario", "topic": "onboarding"},
        {"question": "Describe a time you worked with a team that had different working styles. How did you manage?", "category": "behavioral", "topic": "teamwork"},
        {"question": "Tell me about a project or task you are most proud of. What made it successful?", "category": "behavioral", "topic": "achievement"},
        {"question": "Describe a situation where you received feedback you disagreed with. How did you handle it?", "category": "behavioral", "topic": "feedback"},
        {"question": "How do you keep yourself organized and make sure nothing falls through the cracks?", "category": "problem_solving", "topic": "organization"},
        {"question": f"What skills or experience do you think will be most valuable to you in this {job_title} position?", "category": "communication", "topic": "fit"},
    ]


def _follow_up_fallback_dict(
    cv: dict,
    job: dict,
    job_title: str,
    qa_history: list[dict],
    asked_normalized: set[str],
    question_number: int,
    mastered_topics: Optional[set[str]] = None,
) -> dict[str, str]:
    mastered_topics = mastered_topics or set()

    if qa_history:
        last = qa_history[-1]
        last_answer = (last.get("answer") or "").strip()
        last_question = (last.get("question") or "").strip()
        last_score = last.get("score")
        snippet = _snippet(last_answer, 100)

        if should_clarify_previous(last_answer, last_score, last_question) and snippet:
            candidate = (
                "I'd like to understand that better — could you give me a concrete example "
                "with the steps you took and the result?"
            )
            clarification_mastered = "clarification" in mastered_topics
            if (
                not clarification_mastered
                and _normalize_question(candidate) not in asked_normalized
                and not _is_repetitive_template(candidate, asked_normalized)
            ):
                return {
                    "question": candidate,
                    "category": "behavioral",
                    "topic": "clarification",
                }

    pool = _follow_up_question_pool(cv, job, job_title)
    start_idx = max(0, question_number - 2) % len(pool)
    last_was_skip = bool(qa_history) and is_skip_or_non_answer((qa_history[-1].get("answer") or ""))

    for offset in range(len(pool)):
        item = pool[(start_idx + offset) % len(pool)]
        question = item["question"]
        topic = (item.get("topic") or "").lower().strip()
        if (
            _normalize_question(question) not in asked_normalized
            and not _is_repetitive_template(question, asked_normalized)
            and topic not in mastered_topics
        ):
            if last_was_skip:
                item = {
                    **item,
                    "question": f"No problem — let's try a different topic. {question}",
                }
            return item

    return {
        "question": f"What else from your background should I know for this {job_title} role?",
        "category": "communication",
        "topic": "closing",
    }


def _follow_up_fallback(
    cv: dict,
    job: dict,
    job_title: str,
    qa_history: list[dict],
    asked_normalized: set[str],
    question_number: int = 2,
) -> str:
    return _follow_up_fallback_dict(cv, job, job_title, qa_history, asked_normalized, question_number)["question"]


def _phase_fallback(
    question_number: int,
    cv: dict,
    job: dict,
    job_title: str,
    qa_history: list[dict],
    asked_normalized: set[str],
    experience_level: str = "mid",
    mastered_topics: Optional[set[str]] = None,
) -> dict[str, Any]:
    mastered_topics = mastered_topics or set()

    if question_number <= 1:
        return {
            "question": _opening_fallback(cv, job, job_title),
            "category": "behavioral",
            "difficulty": experience_level,
            "topic": "introduction",
        }

    fallback = _follow_up_fallback_dict(
        cv, job, job_title, qa_history, asked_normalized, question_number,
        mastered_topics=mastered_topics,
    )

    return {
        "question": fallback["question"],
        "category": fallback["category"],
        "difficulty": experience_level,
        "topic": fallback["topic"],
    }


def _is_repetitive_template(question: str, asked_normalized: set[str]) -> bool:
    normalized = _normalize_question(question)
    if not normalized:
        return True

    for prefix in _REPETITIVE_PREFIXES:
        if normalized.startswith(prefix):
            return True

    opening = " ".join(normalized.split()[:5])
    if len(opening.split()) >= 4:
        for asked in asked_normalized:
            if asked.startswith(opening):
                return True

    return False


def _pick_follow_up_category(interview_type: str, qa_history: list[dict]) -> str:
    used = {item.get("category") for item in qa_history if item.get("category")}

    if interview_type == "technical":
        pool = ["technical", "problem_solving", "behavioral"]
    elif interview_type == "behavioral":
        pool = ["behavioral", "scenario", "communication"]
    else:
        pool = ["technical", "behavioral", "problem_solving", "scenario", "communication"]

    for cat in pool:
        if cat not in used:
            return cat

    return pool[len(qa_history) % len(pool)]


def _pick_topic(cv: dict, job: dict, memory: dict) -> str:
    skills = (cv.get("skills") or []) + (job.get("required_skills") or [])
    covered = set(memory.get("topics_covered") or [])
    for skill in skills:
        key = str(skill).lower()
        if key not in covered:
            return key
    return "general"


def _snippet(text: str, max_len: int = 80) -> str:
    text = re.sub(r"\s+", " ", text.strip())
    if len(text) <= max_len:
        return text
    return text[: max_len - 3].rsplit(" ", 1)[0] + "..."


def _normalize_question(question: str) -> str:
    text = re.sub(r"\s*\(follow-up\s*#\d+\)\s*$", "", question.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*\(additional detail\s*#\d+\)\s*$", "", text, flags=re.IGNORECASE)
    return text.lower()
