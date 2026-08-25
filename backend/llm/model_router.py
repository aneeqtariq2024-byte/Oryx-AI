"""ORYX LLM — Model Router.

Automatically picks the best provider based on task complexity:
  - Simple / private  → Ollama
  - Fast response      → Groq
  - Complex reasoning  → Gemini
  - "automatic"        → let the router decide
"""

from __future__ import annotations

from backend.llm.ollama import OllamaProvider
from backend.llm.groq import GroqProvider
from backend.llm.gemini import GeminiProvider


class ModelRouter:
    providers: dict[str, OllamaProvider | GroqProvider | GeminiProvider]

    def __init__(self):
        self.providers = {
            "ollama": OllamaProvider(),
            "groq": GroqProvider(),
            "gemini": GeminiProvider(),
        }

    async def chat(self, messages: list[dict], provider: str = "automatic", **kwargs) -> dict:
        """Route to a provider and return {"provider": ..., "reply": ...}."""
        if provider == "automatic":
            provider = await self._auto_select(messages)

        llm = self.providers.get(provider)
        if llm is None:
            return {"provider": provider, "reply": f"Unknown provider: {provider}", "error": True}

        available = await llm.is_available()
        if not available:
            fallback = await self._fallback(provider)
            if fallback:
                llm = self.providers[fallback]
                provider = fallback
            else:
                return {"provider": provider, "reply": f"Provider '{provider}' is not available.", "error": True}

        reply = await llm.chat(messages, **kwargs)
        return {"provider": provider, "reply": reply}

    # ------------------------------------------------------------------
    # Internal routing logic
    # ------------------------------------------------------------------
    async def _auto_select(self, messages: list[dict]) -> str:
        """Heuristic: pick provider based on message length and keywords."""
        last = messages[-1]["content"] if messages else ""

        complexity_signals = ["research", "analyze", "compare", "detailed", "explain in depth", "essay"]
        is_complex = any(sig in last.lower() for sig in complexity_signals)

        if is_complex and await self.providers["gemini"].is_available():
            return "gemini"
        if await self.providers["groq"].is_available():
            return "groq"
        if await self.providers["ollama"].is_available():
            return "ollama"
        return "ollama"  # default, will show unavailable error

    async def _fallback(self, failed: str) -> str | None:
        """Return next available provider after *failed*."""
        order = ["ollama", "groq", "gemini"]
        idx = order.index(failed) if failed in order else -1
        for name in order[idx + 1:] + order[:idx]:
            if name != failed and await self.providers[name].is_available():
                return name
        return None

    async def status(self) -> dict[str, bool]:
        result = {}
        for name, llm in self.providers.items():
            result[name] = await llm.is_available()
        return result


model_router = ModelRouter()
