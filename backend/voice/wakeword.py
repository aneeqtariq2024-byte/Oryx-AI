"""ORYX Voice — Wake Word detector ("ORYX").

Uses speech_recognition's ambient noise and keyword matching.
In production replace with a dedicated wake-word engine (Porcupine, etc.).
"""

import threading
from backend.config import settings


class WakeWordDetector:
    def __init__(self):
        self.wake_word = settings.WAKE_WORD.upper()
        self._listening = False
        self._callback = None
        self._thread = None

    def start(self, callback):
        """Start listening in a background thread.

        *callback* is called with no args when the wake word is detected.
        """
        self._callback = callback
        self._listening = True
        self._thread = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._listening = False
        if self._thread:
            self._thread.join(timeout=2)

    def _listen_loop(self):
        try:
            import speech_recognition as sr
        except ImportError:
            print("[WakeWord] speech_recognition not installed — wake word disabled.")
            return

        recognizer = sr.Recognizer()
        mic = sr.Microphone()

        with mic as source:
            recognizer.adjust_for_ambient_noise(source, duration=1)

        while self._listening:
            try:
                with mic as source:
                    audio = recognizer.listen(source, timeout=2, phrase_time_limit=3)
                text = recognizer.recognize_google(audio).upper()
                if self.wake_word in text:
                    if self._callback:
                        self._callback()
            except sr.WaitTimeoutError:
                continue
            except sr.UnknownValueError:
                continue
            except Exception as e:
                print(f"[WakeWord] Error: {e}")
                break


wake_word_detector = WakeWordDetector()
