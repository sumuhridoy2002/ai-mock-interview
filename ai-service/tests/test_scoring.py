"""Tests for canonical scoring modules."""

from app.scoring.report import hiring_recommendation, overall_score


def test_hiring_recommendation_tiers():
    assert hiring_recommendation(90) == "strong_yes"
    assert hiring_recommendation(75) == "yes"
    assert hiring_recommendation(60) == "maybe"
    assert hiring_recommendation(45) == "no"
    assert hiring_recommendation(10) == "strong_no"


def test_overall_score_average():
    scores = [{"score": 80}, {"score": 60}]
    assert overall_score(scores) == 70
