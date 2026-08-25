"""ORYX Voice — Text-to-Speech.

Uses pyttsx3 (offline) by default.
Returns WAV bytes that the frontend can play.
"""

import io
import tempfile
from pathlib import Path
from backend.config import settings


def synthesize(text: str, engine: str | None = None) -> bytes | None:
    """Convert text to WAV audio bytes."""
    engine_name = engine or settings.TTS_ENGINE

    if engine_name == "pyttsx3":
        return _pyttsx3_synthesize(text)

    return None


def _pyttsx3_synthesize(text: str) -> bytes | None:
    try:
        import pyttsx3
    except ImportError:
        return None

    engine = pyttsx3.init()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        path = f.name
    engine.save_to_file(text, path)
    engine.runAndWait()
    data = Path(path).read_bytes()
    Path(path).unlink(missing_ok=True)
    return data
