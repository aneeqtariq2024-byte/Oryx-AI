"""ORYX Scheduler — Reminder Manager.

Creates and queries reminder records.
Actual firing is handled by scheduler.py's background loop.
"""

from __future__ import annotations

from datetime import datetime

from backend.database.database import db
from backend.core.events import Event, event_bus
from backend.security.audit import log_audit


class ReminderManager:
    def create(self, message: str, remind_at: str) -> int:
        """Insert a reminder. *remind_at* can be ISO datetime or natural language."""
        parsed = self._parse_time(remind_at)
        return db.insert("reminders", {
            "message": message,
            "remind_at": parsed,
        })

    def get_pending(self) -> list[dict]:
        now = datetime.now().isoformat()
        return db.execute_sql(
            "SELECT * FROM reminders WHERE fired = 0 AND remind_at <= ? ORDER BY remind_at ASC",
            (now,),
        )

    def mark_fired(self, reminder_id: int):
        db.update("reminders", reminder_id, {"fired": 1})
        log_audit("scheduler", "reminder_fired", str(reminder_id))

    def get_all(self) -> list[dict]:
        return db.fetch_all("reminders")

    def delete(self, reminder_id: int):
        db.delete("reminders", reminder_id)

    # ------------------------------------------------------------------
    # Time parsing (simple)
    # ------------------------------------------------------------------
    def _parse_time(self, time_str: str) -> str:
        """Try ISO first, fall back to common natural-language patterns."""
        # Already ISO-ish?
        try:
            datetime.fromisoformat(time_str)
            return time_str
        except (ValueError, TypeError):
            pass

        now = datetime.now()
        t = time_str.lower().strip()

        # "X PM" / "X AM"
        import re
        m = re.match(r"(\d{1,2})\s*(am|pm)", t)
        if m:
            hour = int(m.group(1))
            meridiem = m.group(2)
            if meridiem == "pm" and hour != 12:
                hour += 12
            if meridiem == "am" and hour == 12:
                hour = 0
            target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if target < now:
                from datetime import timedelta
                target += timedelta(days=1)
            return target.isoformat()

        # "tomorrow 9am" etc.
        if "tomorrow" in t:
            from datetime import timedelta
            target = now + timedelta(days=1)
            m2 = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", t)
            if m2:
                hour = int(m2.group(1))
                minute = int(m2.group(2) or 0)
                meridiem = m2.group(3)
                if meridiem == "pm" and hour != 12:
                    hour += 12
                if meridiem == "am" and hour == 12:
                    hour = 0
                target = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return target.isoformat()

        # Fallback: just return tomorrow same time
        from datetime import timedelta
        return (now + timedelta(hours=1)).isoformat()


reminder_manager = ReminderManager()
