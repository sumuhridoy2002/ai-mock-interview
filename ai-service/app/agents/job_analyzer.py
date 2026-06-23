from typing import Any

from app.schemas import JobAnalysis
from app.services.ollama_client import call_ollama, parse_with_fallback


async def analyze_job(job_title: str, job_description: str) -> dict[str, Any]:
    prompt = f"""Analyze this job posting.
Title: {job_title}
Description: {job_description[:6000]}

Return JSON: {{"required_skills":[],"responsibilities":[],"seniority":"junior|mid|senior"}}"""

    raw = await call_ollama(prompt, JobAnalysis.model_json_schema())
    defaults = {
        "required_skills": _extract_skills(job_description),
        "responsibilities": _extract_bullets(job_description),
        "seniority": _detect_seniority(job_title, job_description),
    }
    result = parse_with_fallback(raw, defaults)

    return JobAnalysis(**result).model_dump()


def _extract_skills(text: str) -> list[str]:
    import re
    keywords = re.findall(
        r"\b(Python|JavaScript|TypeScript|PHP|Laravel|React|Next\.js|Node|SQL|MySQL|Redis|Docker|AWS|Leadership|Communication)\b",
        text,
        re.IGNORECASE,
    )
    return list(dict.fromkeys(k.title() if k.islower() else k for k in keywords))[:10]


def _extract_bullets(text: str) -> list[str]:
    lines = [line.strip("- •*\t ") for line in text.splitlines() if line.strip()]
    return [line for line in lines if len(line) > 20][:8]


def _detect_seniority(title: str, description: str) -> str:
    combined = f"{title} {description}".lower()
    if any(w in combined for w in ["senior", "lead", "principal", "staff"]):
        return "senior"
    if any(w in combined for w in ["junior", "entry", "graduate", "intern"]):
        return "junior"
    return "mid"
