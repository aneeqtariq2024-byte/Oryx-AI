"""ORYX LLM — Gemini provider (complex reasoning)."""

import httpx
from backend.config import settings


class GeminiProvider:
    """Chat via the Google Gemini API."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        )

    async def chat(self, messages: list[dict], **kwargs) -> str:
        """Convert OpenAI-style messages to Gemini format and call the API."""
        system_instruction = ""
        contents = []
        for msg in messages:
            role = msg["role"]
            text = msg["content"]
            if role == "system":
                system_instruction = text
                continue
            gemini_role = "user" if role == "user" else "model"
            contents.append({"role": gemini_role, "parts": [{"text": text}]})

        payload: dict = {"contents": contents}
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        payload["generationConfig"] = {
            "temperature": kwargs.get("temperature", 0.7),
            "maxOutputTokens": kwargs.get("max_tokens", 2048),
        }

        url = f"{self.base_url}?key={self.api_key}"
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    async def is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")
