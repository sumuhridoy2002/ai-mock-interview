"""Agent orchestrator — coordinates tool calls for interview flow."""

from typing import Any, Optional

from app.agents.cv_analyzer import analyze_cv
from app.agents.evaluator import evaluate_answer
from app.agents.job_analyzer import analyze_job
from app.agents.memory import merge_memory, truncate_memory
from app.agents.question_generator import generate_question
from app.agents.report_generator import generate_report


class AgentOrchestrator:
    async def parse_cv(self, text: str) -> dict[str, Any]:
        return await analyze_cv(text)

    async def parse_job(self, title: str, description: str) -> dict[str, Any]:
        return await analyze_job(title, description)

    async def next_question(
        self,
        cv_profile: dict,
        job_analysis: dict,
        memory: dict,
        experience_level: str = "mid",
        interview_type: str = "mixed",
        last_answer: Optional[str] = None,
    ) -> dict[str, Any]:
        return await generate_question(
            cv_profile, job_analysis, memory, experience_level, interview_type, last_answer
        )

    async def evaluate(
        self,
        question: str,
        transcript: str,
        required_skills: list[str],
        category: str = "technical",
    ) -> dict[str, Any]:
        return await evaluate_answer(question, transcript, required_skills, category)

    async def final_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await generate_report(payload)

    def update_memory(
        self,
        memory: dict,
        question: str,
        transcript: str,
        evaluation: dict,
        topic: str | None = None,
    ) -> dict[str, Any]:
        updated = merge_memory(memory, question, transcript, evaluation, topic)
        return truncate_memory(updated)
