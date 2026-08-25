"""ORYX AI — Central configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")


class Settings:
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # LLM — Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1")

    # LLM — Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")

    # LLM — Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./oryx.db")
    DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).parent / "oryx.db"))

    # Voice
    WAKE_WORD: str = os.getenv("WAKE_WORD", "ORYX")
    STT_ENGINE: str = os.getenv("STT_ENGINE", "whisper")
    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "pyttsx3")

    # Security
    APPROVAL_REQUIRED: bool = os.getenv("APPROVAL_REQUIRED", "true").lower() == "true"
    AUDIT_LOG: bool = os.getenv("AUDIT_LOG", "true").lower() == "true"


settings = Settings()
