"""ORYX Agents — Research Agent.

Searches the web and summarizes findings using the LLM.
"""

from __future__ import annotations

import httpx
from backend.security.audit import log_audit
from backend.llm.model_router import model_router


class ResearchAgent:
    """Web search → LLM summarization."""

    async def execute(self, intent: str, params: dict) -> dict:
        query = params.get("query", "")
        if not query:
            return {"status": "error", "reply": "No research query provided."}

        log_audit("research_agent", "web_search", query)

        # Step 1: Web search (DuckDuckGo — no API key needed)
        sources = await self._search(query)
        if not sources:
            return {"status": "success", "reply": f"No results found for: {query}"}

        # Step 2: Summarize with LLM
        summary = await self._summarize(query, sources)
        return {
            "status": "success",
            "reply": summary,
            "sources": sources,
        }

    async def _search(self, query: str, max_results: int = 5) -> list[dict]:
        """Search via DuckDuckGo HTML endpoint."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()

            import re
            results = []
            # Extract titles and URLs from DuckDuckGo HTML
            blocks = re.findall(
                r'<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)</a>',
                resp.text,
                re.DOTALL,
            )
            for url, title_html in blocks[:max_results]:
                title = re.sub(r"<[^>]+>", "", title_html).strip()
                results.append({"title": title, "url": url})
            return results
        except Exception as e:
            log_audit("research_agent", "web_search", query, "error", str(e))
            return []

    async def _summarize(self, query: str, sources: list[dict]) -> str:
        source_text = "\n".join([
            f"- {s['title']}: {s['url']}" for s in sources
        ])
        messages = [
            {
                "role": "system",
                "content": "You are a research assistant. Summarize the search results concisely for the user's query.",
            },
            {
                "role": "user",
                "content": f"Query: {query}\n\nSources found:\n{source_text}\n\nProvide a concise briefing.",
            },
        ]
        result = await model_router.chat(messages)
        return result.get("reply", "Summary unavailable.")


research_agent = ResearchAgent()