"""Pydantic schemas for AI agent I/O."""

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class CvProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience_years: int = 0
    projects: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)


class JobAnalysis(BaseModel):
    required_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    seniority: str = "mid"


class QuestionResult(BaseModel):
    question: str
    category: Literal["technical", "behavioral", "problem_solving", "scenario", "communication"] = "technical"
    difficulty: Literal["junior", "mid", "senior"] = "mid"
    topic: str = "general"
    follow_up_reason: Optional[str] = None


class EvaluationResult(BaseModel):
    score: int = Field(ge=0, le=100)
    relevance: int = Field(ge=0, le=100, default=0)
    technical_accuracy: int = Field(ge=0, le=100, default=0)
    communication: int = Field(ge=0, le=100, default=0)
    confidence: int = Field(ge=0, le=100, default=0)
    completeness: int = Field(ge=0, le=100, default=0)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    model_answer: Optional[str] = None


class ReportResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    category_scores: dict[str, int] = Field(default_factory=dict)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    improvement_areas: list[str] = Field(default_factory=list)
    hiring_recommendation: Literal["strong_yes", "yes", "maybe", "no", "strong_no"] = "maybe"


class AnswerExplainResult(BaseModel):
    context: str
    gap_analysis: str
    detailed_answer: str
    visual_breakdown: Optional[dict[str, Any]] = None


class VoiceProcessResult(BaseModel):
    transcript: str
    evaluation: EvaluationResult
    next_question: Optional[QuestionResult] = None
