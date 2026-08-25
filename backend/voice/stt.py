"""ORYX Voice — Speech-to-Text.

Uses speech_recognition (Google by default).
Replace with Whisper local model for full privacy.
"""

import io
from backend.config import settings


def transcribe(audio_data: bytes, engine: str | None = None) -> str:
    """Convert raw audio bytes (WAV) to text."""
    engine = engine or settings.STT_ENGINE

    try:
        import speech_recognition as sr
    except ImportError:
        return "[STT] speech_recognition not installed."

    recognizer = sr.Recognizer()
    audio = sr.AudioFile(io.BytesIO(audio_data))
    with audio as source:
        wav = recognizer.record(source)

    if engine == "whisper":
        try:
            return recognizer.recognize_whisper(wav, model="base")
        except Exception:
            pass

    # Default: Google
    try:
        return recognizer.recognize_google(wav)
    except sr.UnknownValueError:
        return ""
    except Exception as e:
        return f"[STT Error] {e}"
