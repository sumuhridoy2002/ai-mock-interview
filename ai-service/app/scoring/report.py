"""Canonical report aggregation — mirrors PHP ReportAggregator."""

from __future__ import annotations

from app.scoring.constants import get, hiring_threshold


def overall_score(scores: list[dict]) -> int:
    if not scores:
        return int(get("report.defaultOverall", 50))
    return round(sum(item.get("score", 0) for item in scores) / len(scores))


def category_scores(scores: list[dict]) -> dict[str, int]:
    totals: dict[str, list[int]] = {}
    for item in scores:
        cat = item.get("category", "general")
        totals.setdefault(cat, []).append(item.get("score", 0))
    return {cat: round(sum(vals) / len(vals)) for cat, vals in totals.items()}


def hiring_recommendation(score: int) -> str:
    if score >= hiring_threshold("strong_yes"):
        return "strong_yes"
    if score >= hiring_threshold("yes"):
        return "yes"
    if score >= hiring_threshold("maybe"):
        return "maybe"
    if score >= hiring_threshold("no"):
        return "no"
    return "strong_no"
