"""ORYX Memory — Long-term: persistent key-value facts.

Basic version uses SQLite. Future: vector DB / RAG."""

from datetime import datetime
from backend.database.database import db


class LongTermMemory:
    """Store and recall facts by key or fuzzy keyword search."""

    def store(self, key: str, value: str, category: str = "general"):
        existing = db.fetch_all("memory", key=key)
        if existing:
            db.update("memory", existing[0]["id"], {
                "value": value,
                "category": category,
                "updated_at": datetime.now().isoformat(),
            })
        else:
            db.insert("memory", {"key": key, "value": value, "category": category})

    def recall(self, key: str) -> str | None:
        rows = db.fetch_all("memory", key=key)
        return rows[0]["value"] if rows else None

    def search(self, query: str, limit: int = 10) -> list[dict]:
        """Simple keyword search across keys and values."""
        pattern = f"%{query}%"
        return db.execute_sql(
            "SELECT * FROM memory WHERE key LIKE ? OR value LIKE ? ORDER BY updated_at DESC LIMIT ?",
            (pattern, pattern, limit),
        )

    def delete(self, key: str):
        rows = db.fetch_all("memory", key=key)
        for row in rows:
            db.delete("memory", row["id"])

    def get_all(self, category: str | None = None) -> list[dict]:
        if category:
            return db.fetch_all("memory", category=category)
        return db.fetch_all("memory")
