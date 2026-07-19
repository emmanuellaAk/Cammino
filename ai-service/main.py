import logging

from fastapi import FastAPI, Header, HTTPException

from app.config import settings
from app.extraction import extract_text
from app.ollama_client import generate_structured
from app.prompts import job_match_prompt, resume_analysis_prompt, resume_edit_prompt
from app.schemas import (
    JOB_MATCH_SCHEMA,
    RESUME_ANALYSIS_SCHEMA,
    RESUME_EDIT_SCHEMA,
    JobMatchRequest,
    JobMatchResponse,
    ResumeAnalyzeRequest,
    ResumeAnalyzeResponse,
    ResumeEditRequest,
    ResumeEditResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

app = FastAPI(title="Cammino AI Service", version="1.0.0")


def check_api_key(x_api_key: str | None = Header(default=None)):
    """No-op unless AI_SERVICE_API_KEY is configured — mirrors the Spring Boot
    client, which only sends X-API-Key at all when app.ai.api-key is non-blank."""
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.ollama_model}


@app.post("/analyze-resume", response_model=ResumeAnalyzeResponse)
async def analyze_resume(body: ResumeAnalyzeRequest, x_api_key: str | None = Header(default=None)):
    check_api_key(x_api_key)

    resume_text = extract_text(body.resume_content, body.mime_type)
    prompt = resume_analysis_prompt(resume_text)

    logger.info("Analysing resume (%d chars extracted)", len(resume_text))
    result = await generate_structured(prompt, RESUME_ANALYSIS_SCHEMA)
    return ResumeAnalyzeResponse(**result)


@app.post("/match-job", response_model=JobMatchResponse)
async def match_job(body: JobMatchRequest, x_api_key: str | None = Header(default=None)):
    check_api_key(x_api_key)

    resume_text = extract_text(body.resume_content, body.mime_type)
    prompt = job_match_prompt(resume_text, body.job_title, body.company, body.location, body.job_description)

    logger.info("Matching resume against job '%s' at '%s'", body.job_title, body.company)
    result = await generate_structured(prompt, JOB_MATCH_SCHEMA)

    # Clamp defensively — the schema constrains shape, not value ranges (e.g. an
    # integer field could technically come back outside 0-100).
    result["match_score"] = max(0, min(100, int(result.get("match_score", 0))))
    return JobMatchResponse(**result)


@app.post("/resume/edit", response_model=ResumeEditResponse)
async def edit_resume(body: ResumeEditRequest, x_api_key: str | None = Header(default=None)):
    check_api_key(x_api_key)

    prompt = resume_edit_prompt(body.mdx_content, body.instruction, body.chat_history)

    logger.info("Editing resume draft via chat: %r", body.instruction[:100])
    # Regenerating a whole document needs more output budget and time than the
    # short analysis/match calls.
    result = await generate_structured(prompt, RESUME_EDIT_SCHEMA, num_predict=1400, timeout_seconds=55.0)
    return ResumeEditResponse(**result)
