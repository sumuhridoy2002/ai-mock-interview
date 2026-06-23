"""Generate a full model answer article for interview coaching."""

import json
import logging
import re
from typing import Any

from app.schemas import AnswerExplainResult
from app.services.ollama_client import call_ollama, load_prompt, parse_with_fallback

logger = logging.getLogger(__name__)

META_PHRASES = (
    "a strong answer would",
    "a strong answer uses",
    "you should mention",
    "for \"",
    "for this question",
    "good response would",
)


def _is_meta_answer(text: str) -> bool:
    lowered = (text or "").lower().strip()
    if len(lowered.split()) < 40:
        return True
    return any(phrase in lowered for phrase in META_PHRASES)


def _build_detailed_fallback(question: str, category: str, job_title: str) -> str:
    q = question.lower()
    role = job_title

    if "30 day" in q or "first 30" in q or "first month" in q:
        return (
            f"If I joined as a {role}, I would structure my first 30 days around learning, "
            f"contributing safely, and building trust with the team.\n\n"
            f"In week one, I would focus on understanding the codebase and delivery process. "
            f"I would clone the repository, run the test suite locally, and trace one complete user "
            f"flow — for example authentication through to a core feature. I would read the README, "
            f"review recent pull requests, and note how the team organizes controllers, services, "
            f"and Eloquent models. I would also meet my lead and one senior developer to clarify "
            f"current sprint priorities and coding standards.\n\n"
            f"In weeks two and three, I would take ownership of a small, well-scoped ticket — such as "
            f"a bug fix, validation improvement, or a minor API endpoint. I would follow existing "
            f"patterns, write or update tests, and ship through code review. This shows I can deliver "
            f"without disrupting team velocity.\n\n"
            f"By day 30, I would aim to understand the main domain models, deployment pipeline, and "
            f"who to ask when blocked. I would document what I learned for future onboarding and "
            f"propose one small improvement I noticed — perhaps clearer error handling or a missing "
            f"test case. That demonstrates initiative while staying realistic for a junior role."
        )

    if "introduce" in q or "tell me about yourself" in q:
        return (
            f"Thank you for having me. I am a Laravel developer with hands-on experience building "
            f"production web applications using PHP, Laravel, MySQL, and modern JavaScript frameworks.\n\n"
            f"Over the past few years I have delivered multiple client projects end-to-end — from database "
            f"design and REST API development to authentication, role-based access, and deployment. "
            f"For example, I built a queue management system where I designed the backend in Laravel, "
            f"implemented user roles, optimized database queries, and integrated a Vue.js frontend. "
            f"The application is now used in production and handles daily operational traffic reliably.\n\n"
            f"What excites me about this {role} position is the chance to work on structured backend "
            f"challenges, collaborate with a team, and keep growing in areas like API design, testing, "
            f"and performance. I am comfortable owning features from requirements through release, and "
            f"I am eager to contribute quickly while learning your team's conventions."
        )

    if "rest api" in q or "api" in q and category in ("technical", "problem_solving"):
        return (
            f"When I structure a REST API in Laravel, I start with clear resource-oriented routes in "
            f"`routes/api.php`, grouped by version if needed. Each endpoint maps to a slim controller "
            f"method that delegates business logic to a service class, keeping controllers thin.\n\n"
            f"For validation, I use Form Request classes so rules and messages live in one place and "
            f"are reusable. For authentication, I typically use Laravel Sanctum for SPA or token-based "
            f"clients — issuing tokens on login, protecting routes with `auth:sanctum`, and scoping "
            f"abilities per role where required.\n\n"
            f"On a recent project I built an API for a dashboard that served filtered reports to a "
            f"Vue frontend. I used API Resources to control JSON shape, added pagination with "
            f"`paginate()`, and returned consistent error responses via the exception handler. "
            f"I also wrote feature tests for happy paths and validation failures. That approach kept "
            f"the API predictable for frontend developers and easier to maintain as endpoints grew."
        )

    if "project" in q and category == "technical":
        return (
            f"One recent project I worked on was a Laravel-based web application for managing customer "
            f"queues and service tokens. I was responsible for the backend architecture and core features.\n\n"
            f"I designed the database schema with Eloquent relationships between users, queues, "
            f"services, and tokens. I built REST endpoints for creating queues, assigning tokens, and "
            f"tracking status in real time. I implemented authentication with role-based permissions "
            f"so staff and administrators saw different views.\n\n"
            f"The outcome was a stable production system that reduced manual coordination for the "
            f"client's team. I learned to balance speed with maintainability — using migrations, "
            f"seeders, and PHPUnit tests so new features could ship without breaking existing flows. "
            f"That experience directly prepares me for similar backend work in a {role} role."
        )

    if "bug" in q or "performance" in q or category == "problem_solving":
        return (
            f"On a production Laravel application I noticed certain report pages were loading slowly "
            f"during peak hours. Users reported timeouts when filtering large date ranges.\n\n"
            f"I started by reproducing the issue locally with similar data volume, then enabled query "
            f"logging and found an N+1 problem — the controller was loading related models inside a "
            f"loop. I fixed it by eager-loading relationships with `with()` and adding a composite "
            f"index on the filtered columns. I also cached aggregated counts for five minutes since "
            f"real-time precision was not required.\n\n"
            f"After deployment, average response time dropped from about four seconds to under "
            f"half a second. I documented the root cause and added a test to prevent the N+1 "
            f"pattern from returning. That systematic approach — measure, diagnose, fix, verify — "
            f"is how I handle production issues."
        )

    if "collaborat" in q or "deadline" in q or category == "behavioral":
        return (
            f"On a client project we had a hard deadline for launching an admin dashboard before a "
            f"marketing campaign. Two days before release, a critical integration with a payment "
            f"gateway started failing in staging.\n\n"
            f"I paired with a frontend developer to divide work: I owned the API debugging and webhook "
            f"handling while they adjusted the UI for edge cases. I traced the issue to mismatched "
            f"payload validation, patched the Form Request rules, and added logging for failed "
            f"callbacks. We ran a focused test checklist and deployed a hotfix the same evening.\n\n"
            f"We launched on time and the campaign went live without payment errors. The result taught "
            f"me to communicate early when risk appears, split tasks clearly under pressure, and keep "
            f"changes small when the deadline is tight."
        )

    if category == "scenario":
        return (
            f"Approaching this scenario as a {role}, I would first clarify constraints — timeline, "
            f"existing systems, and who the stakeholders are. Then I would break the problem into "
            f"phases with clear deliverables rather than trying to solve everything at once.\n\n"
            f"In the first phase I would gather requirements and map them to technical tasks: data "
            f"model changes, API endpoints, and any frontend integration points. I would estimate "
            f"effort with my lead and flag risks early. In the second phase I would implement the "
            f"highest-value slice, write tests, and demo progress for feedback.\n\n"
            f"Throughout, I would document decisions and keep communication transparent — daily updates "
            f"in standup and a short written summary for anything that affects scope. That structured "
            f"approach helps teams deliver predictably even when requirements evolve."
        )

    return (
        f"To answer this question well in a {role} interview, I would respond with a specific example "
        f"from my experience rather than general statements.\n\n"
        f"I would start with a one-sentence direct answer to the question, then describe the situation "
        f"— what project or team I was on and what challenge we faced. Next I would explain the actions "
        f"I took personally: the Laravel features, database work, or collaboration steps involved. "
        f"I would name concrete tools such as Eloquent, migrations, Form Requests, queues, or Git "
        f"workflow where relevant.\n\n"
        f"I would close with a measurable outcome: faster performance, fewer bugs, on-time delivery, "
        f"or improved user experience. That structure shows I understand the question, have real "
        f"experience, and can communicate clearly under interview pressure."
    )


def _build_visual_breakdown(
    question: str,
    category: str,
    job_title: str,
    transcript: str,
) -> dict[str, Any]:
    q = question.lower()
    your_snippet = (transcript or "").strip()
    if len(your_snippet) > 120:
        your_snippet = your_snippet[:117] + "..."

    if "30 day" in q or "first 30" in q or "first month" in q:
        return {
            "type": "timeline",
            "title": "30-day onboarding roadmap",
            "items": [
                {
                    "label": "Week 1 · Learn",
                    "description": "Clone repo, run tests, trace one user flow end-to-end, read README & recent PRs.",
                    "highlight": "Meet lead + senior dev",
                },
                {
                    "label": "Weeks 2–3 · Contribute",
                    "description": "Pick a small ticket (bug fix, validation, minor API). Follow patterns, add tests, ship via review.",
                    "highlight": "First merged PR",
                },
                {
                    "label": "Day 30 · Own",
                    "description": "Understand domain models & deploy pipeline. Document learnings, propose one small improvement.",
                    "highlight": "Show initiative safely",
                },
            ],
        }

    if "introduce" in q or "tell me about yourself" in q:
        return {
            "type": "flow",
            "title": "Introduction answer flow",
            "items": [
                {"label": "1. Who you are", "description": "Role + years of experience + core stack (Laravel, PHP, MySQL)."},
                {"label": "2. Proof", "description": "One concrete project with what you built and the outcome."},
                {"label": "3. Why this role", "description": f"Connect your background to {job_title} and what you want to grow in."},
            ],
        }

    if "rest api" in q or ("api" in q and category in ("technical", "problem_solving")):
        return {
            "type": "flow",
            "title": "Laravel REST API layers",
            "items": [
                {"label": "Routes", "description": "Resource routes in routes/api.php, versioned if needed."},
                {"label": "Controller", "description": "Thin controller — validate input, call service, return Resource."},
                {"label": "Form Request", "description": "Centralized validation rules and error messages."},
                {"label": "Auth", "description": "Sanctum tokens, auth:sanctum middleware, role abilities."},
                {"label": "Response", "description": "API Resources + pagination + consistent error format."},
            ],
        }

    if category == "behavioral" or "collaborat" in q or "deadline" in q:
        return {
            "type": "star",
            "title": "STAR method breakdown",
            "items": [
                {"label": "S · Situation", "description": "Set the scene — project, team, deadline or pressure."},
                {"label": "T · Task", "description": "Your specific responsibility in that situation."},
                {"label": "A · Action", "description": "Steps you personally took (tools, collaboration, decisions)."},
                {"label": "R · Result", "description": "Measurable outcome — on-time delivery, fewer bugs, happy client."},
            ],
        }

    if "bug" in q or "performance" in q or category == "problem_solving":
        return {
            "type": "steps",
            "title": "Debug & fix workflow",
            "items": [
                {"label": "Reproduce", "description": "Replicate locally with similar data volume or traffic."},
                {"label": "Measure", "description": "Query log, Laravel Debugbar, or APM to find bottleneck."},
                {"label": "Fix", "description": "Eager-load, index, cache, or refactor the hot path."},
                {"label": "Verify", "description": "Re-test, add regression test, deploy & monitor."},
            ],
        }

    if category == "scenario":
        return {
            "type": "steps",
            "title": "Scenario response structure",
            "items": [
                {"label": "Clarify", "description": "Confirm constraints, stakeholders, and timeline."},
                {"label": "Prioritize", "description": "List what matters most in the first 1–2 weeks."},
                {"label": "Plan", "description": "Break into phases with clear deliverables."},
                {"label": "Communicate", "description": "Share plan with lead, update daily, flag risks early."},
            ],
        }

    return {
        "type": "steps",
        "title": "Strong answer structure",
        "items": [
            {"label": "Open", "description": "Direct one-sentence answer to the question."},
            {"label": "Example", "description": "Real project story with Laravel/PHP specifics."},
            {"label": "Detail", "description": "Actions you took — tools, patterns, collaboration."},
            {"label": "Close", "description": "Outcome with a number or clear result."},
        ],
    }


def _with_visual(payload: dict[str, Any], question: str, category: str, job_title: str, transcript: str) -> dict[str, Any]:
    payload["visual_breakdown"] = _build_visual_breakdown(question, category, job_title, transcript)
    if transcript.strip():
        payload["visual_breakdown"]["comparison"] = {
            "your_answer": transcript.strip()[:200],
            "should_include": "Specific example · Named tools · Clear outcome",
        }
    return payload


def _local_fallback(
    question: str,
    transcript: str,
    category: str,
    job_title: str,
    score: int,
    weaknesses: list[str],
) -> dict[str, Any]:
    declined = not transcript.strip() or any(
        w in (weaknesses or [])
        for w in ("Did not attempt to answer the question", "Response did not address")
    ) or re.search(r"\b(sorry|cannot answer|can't answer|next question)\b", transcript, re.I)

    context = (
        f"This {category.replace('_', ' ')} question evaluates how you think on your feet for a "
        f"{job_title} role. The interviewer wants a structured, specific response — not a refusal "
        f"or a repeat of the question."
    )

    if declined or score < 25:
        gap = (
            "You declined or could not answer, so the interviewer did not hear your approach, "
            "priorities, or relevant experience. Even when unsure, briefly outline how you would "
            "think through the problem."
        )
    elif score < 55:
        gap = (
            "Your response did not give enough concrete detail — the interviewer needs named actions, "
            "tools, and outcomes to assess your fit for the role."
        )
    else:
        gap = (
            "Your answer had some relevant points but could be expanded with clearer structure, "
            "specific examples, and a stronger closing outcome."
        )

    detailed = _build_detailed_fallback(question, category, job_title)

    payload = AnswerExplainResult(
        context=context,
        gap_analysis=gap,
        detailed_answer=detailed,
    ).model_dump()

    return _with_visual(payload, question, category, job_title, transcript)


def _normalize_fields(result: dict[str, Any], defaults: dict[str, Any]) -> dict[str, Any]:
    merged = {**defaults, **{k: v for k, v in result.items() if v is not None}}

    if not merged.get("context") and merged.get("summary"):
        merged["context"] = merged["summary"]
    if not merged.get("gap_analysis") and merged.get("feedback"):
        merged["gap_analysis"] = merged["feedback"]
    if not merged.get("detailed_answer"):
        merged["detailed_answer"] = merged.get("example_answer") or defaults.get("detailed_answer", "")

    if _is_meta_answer(merged.get("detailed_answer", "")):
        merged["detailed_answer"] = defaults["detailed_answer"]

    return {
        "context": str(merged.get("context", "")).strip(),
        "gap_analysis": str(merged.get("gap_analysis", "")).strip(),
        "detailed_answer": str(merged.get("detailed_answer", "")).strip(),
    }


def _finalize_result(
    result: dict[str, Any],
    question: str,
    category: str,
    job_title: str,
    transcript: str,
) -> dict[str, Any]:
    return _with_visual(result, question, category, job_title, transcript)


async def explain_answer(
    question: str,
    transcript: str,
    category: str = "technical",
    job_title: str = "this role",
    score: int = 0,
    strengths: list[str] | None = None,
    weaknesses: list[str] | None = None,
    model_answer: str | None = None,
) -> dict[str, Any]:
    weaknesses = weaknesses or []
    transcript = (transcript or "").strip()

    defaults = _local_fallback(question, transcript, category, job_title, score, weaknesses)

    template = load_prompt("answer_explain")
    if not template.strip():
        return defaults

    prompt = template.format(
        question=question,
        category=category,
        job_title=job_title,
        transcript=transcript or "(candidate declined or gave no substantive answer)",
        score=score,
        strengths=json.dumps(strengths or []),
        weaknesses=json.dumps(weaknesses),
    )

    coach_system = (
        "You write complete interview answers in first person. Never give meta-advice. "
        "Return valid JSON only."
    )

    raw = await call_ollama(
        prompt,
        AnswerExplainResult.model_json_schema(),
        system=coach_system,
        num_predict=1200,
    )

    if not raw or "detailed_answer" not in raw and "example_answer" not in raw and "summary" not in raw:
        logger.warning("Answer explain empty — using article fallback")
        return defaults

    try:
        normalized = _normalize_fields(parse_with_fallback(raw, defaults), defaults)
        return _finalize_result(normalized, question, category, job_title, transcript)
    except Exception as exc:
        logger.warning("Invalid explain JSON: %s", exc)
        return defaults
