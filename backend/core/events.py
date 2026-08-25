"""ORYX Core — Event bus for real-time agent activity updates.

Used by agents to broadcast status so the frontend can show
live activity (e.g. "Email Agent working...").
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Awaitable


@dataclass
class Event:
    type: str          # "agent_status", "task_update", "reminder_fired", ...
    agent: str = ""
    message: str = ""
    data: dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "agent": self.agent,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp,
        }


class EventBus:
    def __init__(self):
        self._subscribers: list[Callable[[Event], Awaitable[None]]] = []
        self._history: list[Event] = []
        self._max_history = 200

    def subscribe(self, handler: Callable[[Event], Awaitable[None]]):
        self._subscribers.append(handler)

    def unsubscribe(self, handler: Callable[[Event], Awaitable[None]]):
        self._subscribers.remove(handler)

    async def emit(self, event: Event):
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]
        for handler in self._subscribers:
            try:
                await handler(event)
            except Exception:
                pass

    def get_recent(self, limit: int = 20) -> list[dict]:
        return [e.to_dict() for e in self._history[-limit:]]


event_bus = EventBus()