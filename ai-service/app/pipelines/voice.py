import asyncio
from typing import Any

from app.agents.evaluator import evaluate_answer
from app.agents.question_generator import generate_question
from app.pipelines.transcribe import transcribe_audio
from app.schemas import VoiceProcessResult


async def process_voice(
    audio_bytes: bytes,
    filename: str,
    question: str,
    required_skills: list[str],
    cv_profile: dict[str, Any],
    job_analysis: dict[str, Any],
    memory: dict[str, Any],
    experience_level: str = "mid",
    interview_type: str = "mixed",
    job_title: str | None = None,
) -> dict[str, Any]:
    result = transcribe_audio(
        audio_bytes,
        filename,
        job_title=job_title,
        required_skills=required_skills or None,
        question=question or None,
    )
    transcript = result["transcript"]

    eval_task = evaluate_answer(question, transcript, required_skills)
    question_task = generate_question(
        cv_profile, job_analysis, memory, experience_level, interview_type, transcript
    )

    evaluation, next_q = await asyncio.gather(eval_task, question_task)

    voice_result = VoiceProcessResult(
        transcript=transcript,
        evaluation=evaluation,
        next_question=next_q,
    )

    return voice_result.model_dump()
