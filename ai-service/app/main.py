import json
import os
from typing import Any, Literal, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

from app.agents.answer_explainer import explain_answer
from app.agents.cv_analyzer import analyze_cv
from app.services.document_parser import extract_document_text
from app.agents.evaluator import evaluate_answer
from app.agents.expert_advisor import chat_expert
from app.agents.job_analyzer import analyze_job
from app.agents.question_generator import generate_question
from app.agents.report_generator import generate_report
from app.pipelines.transcribe import transcribe_audio
from app.pipelines.vision import analyze_video, analyze_images
from app.pipelines.voice import process_voice

app = FastAPI(title="Mock Interview AI Service", version="1.0.0")

AI_SECRET = os.getenv("AI_SERVICE_SECRET", "")


def verify_secret(x_ai_secret: Optional[str] = Header(default=None)) -> None:
    if AI_SECRET and x_ai_secret != AI_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health():
    model_name = os.getenv("WHISPER_MODEL", "small")
    ffmpeg_available = bool(__import__("shutil").which("ffmpeg") or os.getenv("FFMPEG_PATH"))
    return {
        "status": "ok",
        "service": "ai-interviewer",
        "whisper_model": model_name,
        "ffmpeg_available": ffmpeg_available,
    }


class CvAnalyzeRequest(BaseModel):
    text: str


@app.post("/agents/cv/analyze", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def cv_analyze(body: CvAnalyzeRequest):
    return await analyze_cv(body.text)


@app.post("/agents/cv/analyze-file", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def cv_analyze_file(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_document_text(file.filename or "resume.pdf", content)

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from file.")

    return await analyze_cv(text)


class JobAnalyzeRequest(BaseModel):
    job_title: str
    job_description: str


@app.post("/agents/job/analyze", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def job_analyze(body: JobAnalyzeRequest):
    return await analyze_job(body.job_title, body.job_description)


class UserMemory(BaseModel):
    mastered_questions: list[str] = []
    mastered_topics: list[str] = []
    prior_strengths: list[str] = []
    prior_weaknesses: list[str] = []
    interviews_completed: int = 0


class QuestionGenerateRequest(BaseModel):
    cv_profile: dict[str, Any] = {}
    job_analysis: dict[str, Any] = {}
    memory: dict[str, Any] = {}
    user_memory: UserMemory = UserMemory()
    experience_level: str = "mid"
    interview_type: str = "mixed"
    last_answer: Optional[str] = None
    question_number: int = 1
    job_title: str = "this role"
    qa_history: list[dict[str, Any]] = []


@app.post("/agents/questions/generate", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def questions_generate(body: QuestionGenerateRequest):
    return await generate_question(
        body.cv_profile,
        body.job_analysis,
        body.memory,
        body.experience_level,
        body.interview_type,
        body.last_answer,
        body.question_number,
        body.job_title,
        body.qa_history,
        body.user_memory.model_dump(),
    )


class EvaluateRequest(BaseModel):
    question: str
    transcript: str
    required_skills: list[str] = []
    category: str = "technical"


@app.post("/agents/answers/evaluate", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def answers_evaluate(body: EvaluateRequest):
    return await evaluate_answer(
        body.question, body.transcript, body.required_skills, body.category
    )


class ExplainAnswerRequest(BaseModel):
    question: str
    transcript: str = ""
    category: str = "technical"
    job_title: str = "this role"
    score: int = 0
    strengths: list[str] = []
    weaknesses: list[str] = []
    model_answer: Optional[str] = None


@app.post("/agents/answers/explain", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def answers_explain(body: ExplainAnswerRequest):
    return await explain_answer(
        body.question,
        body.transcript,
        body.category,
        body.job_title,
        body.score,
        body.strengths,
        body.weaknesses,
        body.model_answer,
    )


class ReportGenerateRequest(BaseModel):
    interview: dict[str, Any] = {}
    cv_profile: dict[str, Any] = {}
    job_analysis: dict[str, Any] = {}
    scores: list[dict[str, Any]] = []
    memory: dict[str, Any] = {}


@app.post("/agents/reports/generate", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def reports_generate(body: ReportGenerateRequest):
    return await generate_report(body.model_dump())


class ExpertChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str = ""


class ExpertChatRequest(BaseModel):
    message: str
    history: list[ExpertChatHistoryItem] = []
    context: dict[str, Any] = {}


@app.post("/agents/expert/chat", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def expert_chat(body: ExpertChatRequest):
    return await chat_expert(
        body.message,
        [h.model_dump() for h in body.history],
        body.context,
    )


@app.post("/pipeline/transcribe", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def pipeline_transcribe(
    audio: UploadFile = File(...),
    job_title: str = Form(""),
    required_skills: str = Form("[]"),
    question: str = Form(""),
):
    audio_bytes = await audio.read()
    skills = json.loads(required_skills) if required_skills and required_skills != "[]" else []
    result = transcribe_audio(
        audio_bytes,
        audio.filename or "audio.webm",
        job_title=job_title or None,
        required_skills=skills or None,
        question=question or None,
    )
    return {"transcript": result["transcript"], "quality_poor": result["quality_poor"]}


@app.post("/pipeline/vision/analyze", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def vision_analyze(
    video: UploadFile = File(...),
    question: str = Form(""),
    generate_narrative: str = Form("true"),
):
    """
    Analyse a video recording for behavioural signals:
    confidence, nervousness, eye contact, head stability, blink rate,
    emotion distribution, and audio prosody.
    """
    video_bytes = await video.read()
    want_narrative = generate_narrative.lower() not in ("false", "0", "no")
    return await analyze_video(
        video_bytes,
        filename=video.filename or "answer.webm",
        question=question,
        generate_narrative=want_narrative,
    )


@app.post("/pipeline/vision/analyze-snapshots", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def vision_analyze_snapshots(
    snapshots: list[UploadFile] = File(...),
    question: str = Form(""),
    generate_narrative: str = Form("true"),
    snapshot_interval_sec: str = Form("10"),
    audio: UploadFile | None = File(None),
):
    """
    Analyse JPEG/PNG snapshots (~every 10s during recording).
    Optional answer audio adds librosa prosody to confidence/nervousness scores.
    """
    images: list[bytes] = [await s.read() for s in snapshots]
    audio_bytes = await audio.read() if audio is not None else None
    audio_name = audio.filename if audio is not None else "answer.webm"
    want_narrative = generate_narrative.lower() not in ("false", "0", "no")
    try:
        interval = float(snapshot_interval_sec)
    except ValueError:
        interval = 10.0
    return await analyze_images(
        images,
        question=question,
        generate_narrative=want_narrative,
        audio_bytes=audio_bytes,
        audio_filename=audio_name,
        snapshot_interval_sec=interval,
    )


@app.post("/pipeline/voice/process", dependencies=[Depends(verify_secret)] if AI_SECRET else [])
async def voice_process(
    audio: UploadFile = File(...),
    question: str = Form(""),
    required_skills: str = Form("[]"),
    cv_profile: str = Form("{}"),
    job_analysis: str = Form("{}"),
    memory: str = Form("{}"),
    experience_level: str = Form("mid"),
    interview_type: str = Form("mixed"),
    job_title: str = Form(""),
):
    audio_bytes = await audio.read()
    return await process_voice(
        audio_bytes,
        audio.filename or "audio.webm",
        question,
        json.loads(required_skills),
        json.loads(cv_profile),
        json.loads(job_analysis),
        json.loads(memory),
        experience_level,
        interview_type,
        job_title=job_title or None,
    )
