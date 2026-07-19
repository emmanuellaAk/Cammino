import base64
import io

from docx import Document
from fastapi import HTTPException
from pypdf import PdfReader

from app.config import settings

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def extract_text(resume_content_b64: str, mime_type: str) -> str:
    """Decode a base64-encoded resume file and pull out its plain text."""
    try:
        raw = base64.b64decode(resume_content_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 resume content: {e}")

    if mime_type == PDF_MIME:
        text = _extract_pdf(raw)
    elif mime_type == DOCX_MIME:
        text = _extract_docx(raw)
    else:
        raise HTTPException(status_code=422, detail=f"Unsupported mime type: {mime_type}")

    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Could not extract any text from the resume file")

    return text[: settings.max_resume_chars]


def _extract_pdf(raw: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(raw))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {e}")


def _extract_docx(raw: bytes) -> str:
    try:
        doc = Document(io.BytesIO(raw))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse DOCX: {e}")
