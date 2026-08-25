"""ORYX Scheduler — Background loop that fires due reminders.

Runs as an asyncio task inside FastAPI's lifespan.
"""

from __future__ import annotations

import asyncio
from backend.scheduler.reminders import reminder_manager
from backend.core.events import Event, event_bus


async def scheduler_loop(interval: int = 10):
    """Check every *interval* seconds for pending reminders."""
    while True:
        try:
            pending = reminder_manager.get_pending()
            for r in pending:
                await event_bus.emit(Event(
                    type="reminder_fired",
                    agent="scheduler",
                    message=r["message"],
                    data=r,
                ))
                reminder_manager.mark_fired(r["id"])
        except Exception as e:
            print(f"[Scheduler] Error: {e}")
        await asyncio.sleep(interval)
