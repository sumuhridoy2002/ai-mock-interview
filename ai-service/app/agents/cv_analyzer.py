import re
from datetime import datetime
from typing import Any

from app.schemas import CvProfile
from app.services.ollama_client import call_ollama, load_prompt

SKILL_PATTERN = re.compile(
    r"\b("
    r"Python|JavaScript|JAVASCRIPT|TypeScript|PHP|Laravel|LARAVEL|React(?:\.js)?|Next\.js|"
    r"Node\.js|Inertia\.js|CodeIgniter|Codeigniter|Express(?:\.js)?|"
    r"SQL|MySQL|PostgreSQL|MongoDB|Redis|Docker|Kubernetes|AWS|Azure|GCP|Firebase|"
    r"Git|GitHub|GitLab|API|REST|GraphQL|Vue(?:\.js)?|Angular|Java|C\+\+|C#|Go|Rust|"
    r"HTML|CSS|Tailwind(?:\s+CSS)?|SASS|Bootstrap|jQuery|FastAPI|Django|Flask|"
    r"WordPress|Linux|Nginx|Apache|CI/CD|Agile|Scrum"
    r")\b",
    re.IGNORECASE,
)

SKILL_LABEL_PATTERN = re.compile(
    r"(?:Backend|Frontend|Tools?|Languages?)\s*:\s*(.+)",
    re.IGNORECASE,
)

EDUCATION_LINE = re.compile(
    r"\b("
    r"B\.?\s*Sc\.?|Bachelor|M\.?\s*Sc\.?|Master|MBA|PhD|Ph\.?\s*D\.?|"
    r"HSC|SSC|Higher Secondary|Secondary School|Diploma|Associate|"
    r"Computer Science|CSE|Engineering|Bishwabidyalay|University|College|Institute"
    r")\b",
    re.IGNORECASE,
)

SECTION_HEADERS = re.compile(
    r"(?:^|\n)\s*("
    r"WORK EXPERIENCE|EXPERIENCE|WORK HISTORY|EMPLOYMENT|"
    r"EDUCATION|ACADEMIC|QUALIFICATIONS?|"
    r"SKILLS|PROJECTS|PORTFOLIO|PROFILE|SUMMARY|"
    r"CONTACT|REFERENCE|LANGUAGES?"
    r")\s*(?:[:\n]|$)",
    re.IGNORECASE,
)

WORK_SECTION = re.compile(
    r"(?:^|\n)\s*(?:WORK EXPERIENCE|EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL EXPERIENCE)\s*[:\n]?",
    re.IGNORECASE,
)

EDUCATION_SECTION = re.compile(
    r"(?:^|\n)\s*(?:EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS?)\s*[:\n]?",
    re.IGNORECASE,
)

PROFILE_SECTION = re.compile(
    r"(?:^|\n)\s*(?:PROFILE|SUMMARY|ABOUT ME|OBJECTIVE)\s*[:\n]?",
    re.IGNORECASE,
)

YEAR_RANGE = re.compile(
    r"(\d{4})\s*[-–—~to]+\s*(Present|Current|Now|Today|\d{4})",
    re.IGNORECASE,
)

MONTH_YEAR_RANGE = re.compile(
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"[\s,.'-]*(\d{4})\s*[-–—~to]+\s*"
    r"(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"[\s,.'-]*)?(Present|Current|Now|Today|\d{4})",
    re.IGNORECASE,
)

EXPLICIT_YEARS = re.compile(
    r"(\d+)\s*\+\s*(?:years?|yrs?)|(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[\w\s,]+?\s+)?experience",
    re.IGNORECASE,
)

REFERENCE_BLOCK = re.compile(
    r"(?:^|\n)\s*(?:REFERENCE|REFERENCES)\s*",
    re.IGNORECASE,
)


def _normalize_skills(skills: list[str]) -> list[str]:
    aliases = {
        "javascript": "JavaScript",
        "laravel": "Laravel",
        "php": "PHP",
        "next.js": "Next.js",
        "node.js": "Node.js",
        "vue.js": "Vue.js",
        "vue": "Vue.js",
        "react.js": "React.js",
        "react": "React.js",
        "express.js": "Express.js",
        "express": "Express.js",
        "codeigniter": "CodeIgniter",
        "inertia.js": "Inertia.js",
        "tailwind css": "Tailwind CSS",
        "tailwind": "Tailwind CSS",
        "rest": "REST APIs",
        "api": "REST APIs",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "firebase": "Firebase",
    }

    canonical = {
        "react": "react.js",
        "react.js": "react.js",
        "vue": "vue.js",
        "vue.js": "vue.js",
        "express": "express.js",
        "express.js": "express.js",
        "node.js": "node.js",
        "next.js": "next.js",
        "inertia.js": "inertia.js",
        "tailwind": "tailwind css",
        "tailwind css": "tailwind css",
        "rest": "rest apis",
        "api": "rest apis",
        "rest apis": "rest apis",
    }

    seen: dict[str, str] = {}
    for skill in skills:
        cleaned = re.sub(r"\s+", " ", skill.strip(" ,;"))
        if not cleaned or len(cleaned) < 2:
            continue
        key = canonical.get(cleaned.lower(), cleaned.lower())
        label = aliases.get(cleaned.lower(), cleaned)
        if key not in seen:
            seen[key] = label

    return list(seen.values())


def _extract_skills_from_labels(text: str) -> list[str]:
    skills: list[str] = []
    for match in SKILL_LABEL_PATTERN.finditer(text):
        chunk = match.group(1)
        chunk = re.sub(r"\([^)]*\)", "", chunk)
        parts = re.split(r"[,;|/&]+", chunk)
        for part in parts:
            part = part.strip()
            if part and len(part) > 1:
                skills.append(part)
    return skills


def _extract_keywords(text: str) -> list[str]:
    found = list(SKILL_PATTERN.findall(text))
    found.extend(_extract_skills_from_labels(text))
    return _normalize_skills(found)


def _section_text(text: str, start_pattern: re.Pattern, stop_before: set[str] | None = None) -> str:
    match = start_pattern.search(text)
    if not match:
        return ""

    start = match.end()
    remainder = text[start:]
    stops = stop_before or {
        "work experience", "experience", "education", "skills", "projects",
        "profile", "summary", "contact", "reference", "languages",
    }

    end = len(remainder)
    for header in SECTION_HEADERS.finditer(remainder):
        name = header.group(1).strip().lower()
        if name in stops and header.start() > 0:
            end = header.start()
            break

    return remainder[:end].strip()


def _extract_education(text: str) -> list[str]:
    entries: list[str] = []
    section = _section_text(
        text,
        EDUCATION_SECTION,
        stop_before={"reference", "references", "contact", "skills", "work experience", "experience"},
    )

    lines = [re.sub(r"\s+", " ", ln).strip() for ln in section.splitlines() if ln.strip()]
    buffer = ""

    for line in lines:
        if REFERENCE_BLOCK.search(line) or re.search(r"^\+\d", line):
            break
        if re.search(r"^(Phone|Email|Website)\s*:", line, re.I):
            continue
        if re.search(r"\b(CEO|Team Leader|Developer)\b", line) and not EDUCATION_LINE.search(line):
            break
        if re.search(r"^[A-Z][a-z]+\s+[A-Z][a-z]+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", line):
            break
        if len(line) < 6:
            continue

        if EDUCATION_LINE.search(line):
            if buffer:
                entries.append(buffer[:250])
            buffer = line
        elif buffer and re.search(r"College|University|Bishwabidyalay", line, re.I):
            buffer = f"{buffer} — {line}"
            entries.append(buffer[:250])
            buffer = ""

    if buffer:
        entries.append(buffer[:250])

    if not entries:
        for line in text.splitlines():
            line = re.sub(r"\s+", " ", line).strip()
            if EDUCATION_LINE.search(line) and 10 <= len(line) <= 250:
                if line not in entries:
                    entries.append(line)

    return entries[:8]


def _work_body_text(text: str) -> str:
    """Collect job-related lines when section headers appear before content (common in PDF exports)."""
    raw = _section_text(
        text,
        PROFILE_SECTION,
        stop_before={"reference", "contact", "skills", "languages"},
    )
    if not raw:
        match = WORK_SECTION.search(text)
        raw = text[match.end() :] if match else text

    lines: list[str] = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if REFERENCE_BLOCK.match(stripped):
            break
        if re.search(r"^(Phone|Email|Website)\s*:", stripped, re.I):
            break
        if EDUCATION_LINE.search(stripped) and re.search(
            r"\b(B\.?\s*Sc|HSC|SSC|Bachelor|Master|Gono Bishwabidyalay|Laboratory College)\b",
            stripped,
            re.I,
        ):
            break
        if re.match(r"^Md\.\s", stripped):
            break
        lines.append(stripped)

    return "\n".join(lines)


def _extract_projects(text: str) -> list[str]:
    entries: list[str] = []
    work_body = _work_body_text(text)

    for line in work_body.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) < 20 or len(line) > 280:
            continue
        if re.search(r"\b(Findbook|Reference|Phone:|Email :)\b", line, re.I):
            continue
        if not re.search(
            r"\b(\d+\+\s*(?:production|web|major)|\d+\s+major projects|eCommerce|ERP systems?)\b",
            line,
            re.I,
        ):
            continue
        if line not in entries:
            entries.append(line)

    return entries[:10]


def _months_between(start_year: int, start_month: int, end_year: int, end_month: int) -> int:
    return max(0, (end_year - start_year) * 12 + (end_month - start_month))


def _estimate_years_from_month_ranges(text: str) -> int:
    """Return career span from earliest job start to latest end (handles overlaps)."""
    current = datetime.now()
    starts: list[tuple[int, int]] = []
    ends: list[tuple[int, int]] = []

    for match in MONTH_YEAR_RANGE.finditer(text):
        start_year = int(match.group(1))
        end_token = match.group(2)
        if end_token.lower() in {"present", "current", "now", "today"}:
            end_year, end_month = current.year, current.month
        else:
            end_year = int(end_token)
            end_month = 12

        starts.append((start_year, 1))
        ends.append((end_year, end_month))

    if not starts:
        return 0

    earliest = min(starts)
    latest = max(ends)
    months = _months_between(earliest[0], earliest[1], latest[0], latest[1])
    return max(1, round(months / 12)) if months else 0


def _estimate_years_explicit(text: str) -> int:
    profile = _section_text(text, PROFILE_SECTION) or text
    for block in (profile, text):
        for match in EXPLICIT_YEARS.finditer(block):
            years = match.group(1) or match.group(2)
            if years:
                return int(years)
    return 0


def _estimate_experience_years(text: str) -> int:
    explicit = _estimate_years_explicit(text)
    if explicit > 0:
        return explicit

    work_body = _work_body_text(text)
    return _estimate_years_from_month_ranges(work_body)


def _heuristic_profile(text: str) -> dict[str, Any]:
    return {
        "skills": _extract_keywords(text),
        "experience_years": _estimate_experience_years(text),
        "projects": _extract_projects(text),
        "education": _extract_education(text),
    }


def _merge_profiles(ai: dict[str, Any], heuristics: dict[str, Any]) -> dict[str, Any]:
    merged = dict(heuristics)

    ai_skills = ai.get("skills") or []
    if ai_skills:
        merged["skills"] = _normalize_skills(list(ai_skills) + heuristics.get("skills", []))

    ai_education = [e for e in (ai.get("education") or []) if str(e).strip()]
    if ai_education:
        merged["education"] = list(dict.fromkeys(ai_education + heuristics.get("education", [])))[:8]

    ai_projects = [p for p in (ai.get("projects") or []) if str(p).strip()]
    if ai_projects:
        merged["projects"] = list(dict.fromkeys(ai_projects + heuristics.get("projects", [])))[:10]

    ai_years = ai.get("experience_years")
    if isinstance(ai_years, (int, float)) and int(ai_years) > 0:
        merged["experience_years"] = max(int(ai_years), heuristics.get("experience_years", 0))

    if not merged.get("skills"):
        merged["skills"] = heuristics.get("skills", [])
    if not merged.get("education"):
        merged["education"] = heuristics.get("education", [])
    if not merged.get("projects"):
        merged["projects"] = heuristics.get("projects", [])

    return merged


async def analyze_cv(text: str) -> dict[str, Any]:
    text = re.sub(r"\r\n?", "\n", (text or "").strip())
    heuristics = _heuristic_profile(text)

    if not text:
        return CvProfile(**heuristics).model_dump()

    template = load_prompt("cv_analysis")
    prompt = template.format(cv_text=text[:8000])

    raw = await call_ollama(prompt, CvProfile.model_json_schema())
    merged = _merge_profiles(raw or {}, heuristics)

    return CvProfile(**merged).model_dump()
