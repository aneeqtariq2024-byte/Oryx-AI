"""ORYX Memory — Manager that combines short-term and long-term memory."""

from backend.memory.short_term import ShortTermMemory
from backend.memory.long_term import LongTermMemory


class MemoryManager:
    def __init__(self):
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory()

    # ------------------------------------------------------------------
    # Conversation
    # ------------------------------------------------------------------
    def add_user_message(self, text: str):
        self.short_term.add("user", text)

    def add_assistant_message(self, text: str):
        self.short_term.add("assistant", text)

    def get_context_messages(self) -> list[dict]:
        return self.short_term.to_messages()

    # ------------------------------------------------------------------
    # Long-term facts
    # ------------------------------------------------------------------
    def remember(self, key: str, value: str, category: str = "general"):
        self.long_term.store(key, value, category)

    def recall(self, key: str) -> str | None:
        return self.long_term.recall(key)

    def search_memory(self, query: str) -> list[dict]:
        return self.long_term.search(query)

    # ------------------------------------------------------------------
    # Build full prompt context (system + memory + history)
    # ------------------------------------------------------------------
    def build_context(self, system_prompt: str) -> list[dict]:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.get_context_messages())
        return messages


memory_manager = MemoryManager()
