"""Shared scoring constants loaded from repo-root JSON."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_CONSTANTS_PATH = Path(__file__).resolve().parents[3] / "shared" / "scoring" / "constants.json"


@lru_cache(maxsize=1)
def load_constants() -> dict:
    with open(_CONSTANTS_PATH, encoding="utf-8") as f:
        return json.load(f)


def get(key: str, default=None):
    parts = key.split(".")
    value = load_constants()
    for part in parts:
        if not isinstance(value, dict) or part not in value:
            return default
        value = value[part]
    return value


def hiring_threshold(tier: str) -> int:
    return int(get(f"thresholds.hiring.{tier}", 0))
