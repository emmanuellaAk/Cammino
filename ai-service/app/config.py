from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout_seconds: float = 45.0
    ollama_num_predict: int = 600  # cap output tokens so local CPU inference stays fast

    # Optional shared secret — only enforced if set, mirrors AiServiceProperties.apiKey
    # on the Spring Boot side (which only sends the header if it's non-blank).
    api_key: str = ""

    max_resume_chars: int = 6000  # truncate long resumes before prompting

    class Config:
        env_prefix = "AI_SERVICE_"


settings = Settings()
