import json
import logging

import httpx
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger("ai-service.ollama")


async def generate_structured(prompt: str, schema: dict, num_predict: int | None = None, timeout_seconds: float | None = None) -> dict:
    """Call the local Ollama server and force output matching `schema` via
    Ollama's structured-output support (constrained generation — the model
    literally cannot emit invalid JSON here, unlike a plain "please return JSON"
    prompt)."""
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "format": schema,
        "stream": False,
        "options": {
            "num_predict": num_predict or settings.ollama_num_predict,
            "temperature": 0.2,  # low temperature — this is extraction, not creative writing
        },
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds or settings.ollama_timeout_seconds) as client:
            res = await client.post(f"{settings.ollama_base_url}/api/generate", json=payload)
    except httpx.ConnectError as e:
        logger.error("Could not reach Ollama at %s: %s", settings.ollama_base_url, e)
        raise HTTPException(status_code=503, detail="Local model server (Ollama) is not reachable") from e
    except httpx.TimeoutException as e:
        logger.error("Ollama request timed out: %s", e)
        raise HTTPException(status_code=504, detail="Local model took too long to respond") from e

    if res.status_code != 200:
        logger.error("Ollama returned %s: %s", res.status_code, res.text[:500])
        raise HTTPException(status_code=502, detail=f"Ollama error: {res.status_code}")

    body = res.json()
    raw_output = body.get("response", "")

    try:
        return json.loads(raw_output)
    except json.JSONDecodeError as e:
        logger.error("Model did not return valid JSON despite schema constraint: %s", raw_output[:500])
        raise HTTPException(status_code=502, detail="Model returned malformed output") from e
