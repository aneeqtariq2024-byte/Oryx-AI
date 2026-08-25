"""ORYX LLM — Ollama provider (local, private)."""

import httpx
from backend.config import settings


class OllamaProvider:
    """Chat with a locally running Ollama model."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def chat(self, messages: list[dict], **kwargs) -> str:
        """Send messages and return the assistant reply text."""
        payload = {
            "model": kwargs.get("model", self.model),
            "messages": messages,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def list_models(self) -> list[str]:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{self.base_url}/api/tags")
            resp.raise_for_status()
            return [m["name"] for m in resp.json().get("models", [])]

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}")
                return resp.status_code == 200
        except Exception:
            return False
