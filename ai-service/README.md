# Cammino AI Service

A small FastAPI microservice that gives `analyze-resume` and `match-job` real
implementations, backed by a **local, free, open-weight model via Ollama** —
no API key, no cost, no external network call.

## Why Ollama instead of a cloud API

No signup, no rate limit, no dependency on an external provider staying up
during a demo. The tradeoff is output quality vs. a frontier hosted model —
acceptable for this use case, and the `AiServiceClient` on the Spring Boot
side was already designed provider-agnostically, so swapping to a cloud
API later is a config change, not a rewrite.

## Setup

```bash
brew install ollama
brew services start ollama
ollama pull llama3.2          # ~2GB, one-time

cd ai-service
uv venv && uv pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8010
```

**Port 8010, not 8000** — the Spring Boot default (`app.ai.base-url`) is
`localhost:8000`, but that port may already be in use by something else on
your machine. `application-local.properties` here points at `8010` instead;
change both sides together if you need a different port.

## How it works

1. `POST /analyze-resume` / `POST /match-job` receive the exact JSON shape
   `AiServiceClient` sends (base64 file content + mime type, plus job details
   for matching) — field names match the Java DTOs' `@JsonProperty` values
   (snake_case) exactly.
2. `app/extraction.py` decodes the base64 file and pulls plain text out of it
   (`pypdf` for PDF, `python-docx` for DOCX).
3. `app/prompts.py` builds a task-specific prompt around that text.
4. `app/ollama_client.py` calls Ollama's `/api/generate` with `format` set to
   a JSON Schema — this uses Ollama's **structured output** (constrained
   generation), so the model is not just asked nicely to return JSON, it's
   grammatically restricted to only ever produce that shape. This is the
   single biggest reliability win here over a plain "please respond in JSON"
   prompt.
5. The result is returned as-is (plus a `match_score` clamp to 0-100 as a
   defensive floor, since the schema constrains shape, not value ranges).

## Known limitations (honest, not hidden)

- **Model quality**: `llama3.2` is a 3B model — fast (5-10s per request on a
  16GB M-series Mac, CPU only) but occasionally imprecise. In testing it
  correctly extracted skills/experience/education and gave a sound job-match
  score and gap analysis, but once fabricated a minor detail ("mentions
  Python in a frontend context") that wasn't in the source resume. Treat
  output as a strong first draft, not ground truth — same caveat any AI
  feature like this should carry regardless of model size.
- **Local-only**: if Ollama isn't running, `/analyze-resume` and `/match-job`
  return a 503, which the Spring Boot circuit breaker correctly treats as a
  failure and falls back to the last cached result (or a clean error if
  there's no cache yet).
- **No auth by default**: `AI_SERVICE_API_KEY` is unset in local dev, same
  as the Spring Boot side's `app.ai.api-key`. Set both if deploying this
  somewhere reachable over a network.
