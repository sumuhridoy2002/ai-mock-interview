import json
import logging
import os
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120"))
USE_MOCK = os.getenv("AI_USE_MOCK", "false").lower() == "true"


def load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.txt"
    return path.read_text(encoding="utf-8") if path.exists() else ""


def system_prompt() -> str:
    return load_prompt("system") or (
        "You are an expert technical interviewer AI. Respond ONLY with valid JSON. "
        "Do not include markdown or text outside JSON."
    )


async def call_ollama(
    prompt: str,
    schema_hint: str = "",
    system: str | None = None,
    num_predict: int = 768,
) -> dict[str, Any]:
    if USE_MOCK:
        return {}

    full_prompt = f"{prompt}\n\nReturn JSON matching: {schema_hint}" if schema_hint else prompt
    system_message = system or system_prompt()

    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": full_prompt,
                    "system": system_message,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.4, "num_predict": num_predict},
                },
            )
            response.raise_for_status()
            body = response.json()
            text = body.get("response", "{}")
            return json.loads(text)
        except httpx.HTTPError as exc:
            logger.error("Ollama HTTP error: %s", exc)
            return {}
        except json.JSONDecodeError as exc:
            logger.error("Ollama returned invalid JSON: %s", exc)
            return {}


def parse_with_fallback(raw: dict[str, Any], defaults: dict[str, Any]) -> dict[str, Any]:
    merged = {**defaults, **{k: v for k, v in raw.items() if v is not None}}
    return merged
