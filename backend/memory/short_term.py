"""ORYX Memory — Short-term: recent conversation history."""

from backend.database.database import db


class ShortTermMemory:
    """Stores and retrieves the last N conversation turns."""

    def __init__(self, max_turns: int = 50):
        self.max_turns = max_turns

    def add(self, role: str, content: str):
        db.insert("conversations", {"role": role, "content": content})

    def get_recent(self, n: int | None = None) -> list[dict]:
        n = n or self.max_turns
        rows = db.execute_sql(
            "SELECT * FROM conversations ORDER BY id DESC LIMIT ?",
            (n,),
        )
        return list(reversed(rows))

    def clear(self):
        db.execute_sql("DELETE FROM conversations")

    def to_messages(self) -> list[dict]:
        """Return conversation rows as OpenAI-style message dicts."""
        return [{"role": r["role"], "content": r["content"]} for r in self.get_recent()]
