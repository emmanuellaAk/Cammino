from typing import Optional

from pydantic import BaseModel, Field


class ResumeAnalyzeRequest(BaseModel):
    resume_content: str  # base64
    mime_type: str


class ResumeAnalyzeResponse(BaseModel):
    skills: list[str]
    experience_years: Optional[int] = None
    education: Optional[str] = None
    strengths: list[str]
    summary: str


class JobMatchRequest(BaseModel):
    resume_content: str  # base64
    mime_type: str
    job_title: str
    company: str
    location: Optional[str] = None
    job_description: Optional[str] = None


class JobMatchResponse(BaseModel):
    match_score: int = Field(ge=0, le=100)
    matching_skills: list[str]
    missing_skills: list[str]
    recommendations: list[str]
    summary: str


# ── JSON Schemas passed to Ollama's structured-output ("format") param ────────
# These constrain generation directly — the model cannot produce a shape other
# than this, so we don't need to defensively re-validate model output by hand.

RESUME_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "skills": {"type": "array", "items": {"type": "string"}},
        "experience_years": {"type": "integer"},
        "education": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "summary": {"type": "string"},
    },
    "required": ["skills", "experience_years", "education", "strengths", "summary"],
}

JOB_MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "match_score": {"type": "integer"},
        "matching_skills": {"type": "array", "items": {"type": "string"}},
        "missing_skills": {"type": "array", "items": {"type": "string"}},
        "recommendations": {"type": "array", "items": {"type": "string"}},
        "summary": {"type": "string"},
    },
    "required": ["match_score", "matching_skills", "missing_skills", "recommendations", "summary"],
}
