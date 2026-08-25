"""ORYX Agents — Task Agent.

Creates, lists, updates, and deletes tasks + reminders.
"""

from __future__ import annotations

from datetime import datetime

from backend.database.database import db
from backend.security.audit import log_audit
from backend.core.events import Event, event_bus


class TaskAgent:
    """Manages tasks and reminders."""

    async def execute(self, intent: str, params: dict) -> dict:
        if intent == "task":
            return await self._handle_task(params)
        if intent == "reminder":
            return await self._handle_reminder(params)
        return {"status": "error", "reply": f"Task agent cannot handle intent: {intent}"}

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------
    async def _handle_task(self, params: dict) -> dict:
        action = params.get("action", "create")

        if action == "create":
            return self._create_task(params)
        if action == "list":
            return self._list_tasks(params)
        if action == "update":
            return self._update_task(params)
        if action == "delete":
            return self._delete_task(params)
        return {"status": "error", "reply": f"Unknown task action: {action}"}

    def _create_task(self, params: dict) -> dict:
        title = params.get("title", "Untitled task")
        description = params.get("description", "")
        priority = params.get("priority", "medium")
        due_date = params.get("due_date", "")

        task_id = db.insert("tasks", {
            "title": title,
            "description": description,
            "priority": priority,
            "due_date": due_date,
        })
        log_audit("task_agent", "create_task", title)
        return {
            "status": "success",
            "reply": f"Task created: {title} (Priority: {priority})",
            "task_id": task_id,
        }

    def _list_tasks(self, params: dict) -> dict:
        status_filter = params.get("status")
        if status_filter:
            tasks = db.fetch_all("tasks", status=status_filter)
        else:
            tasks = db.fetch_all("tasks")

        if not tasks:
            return {"status": "success", "reply": "No tasks found.", "tasks": []}

        lines = []
        for t in tasks:
            emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(t["priority"], "⚪")
            lines.append(f"{emoji} [{t['status']}] {t['title']}")
            if t.get("due_date"):
                lines.append(f"   Due: {t['due_date']}")

        reply = "\n".join(lines)
        return {"status": "success", "reply": reply, "tasks": tasks}

    def _update_task(self, params: dict) -> dict:
        task_id = params.get("task_id")
        if not task_id:
            return {"status": "error", "reply": "task_id is required to update."}
        updates = {k: v for k, v in params.items() if k in ("title", "description", "priority", "status", "due_date")}
        updates["updated_at"] = datetime.now().isoformat()
        db.update("tasks", task_id, updates)
        log_audit("task_agent", "update_task", str(task_id))
        return {"status": "success", "reply": f"Task {task_id} updated."}

    def _delete_task(self, params: dict) -> dict:
        task_id = params.get("task_id")
        if not task_id:
            return {"status": "error", "reply": "task_id is required to delete."}
        db.delete("tasks", task_id)
        log_audit("task_agent", "delete_task", str(task_id))
        return {"status": "success", "reply": f"Task {task_id} deleted."}

    # ------------------------------------------------------------------
    # Reminders
    # ------------------------------------------------------------------
    async def _handle_reminder(self, params: dict) -> dict:
        from backend.scheduler.reminders import reminder_manager

        message = params.get("message", "Reminder")
        remind_at = params.get("remind_at", "")

        if not remind_at:
            return {"status": "error", "reply": "Please specify when to remind (remind_at)."}

        reminder_id = reminder_manager.create(message, remind_at)
        log_audit("task_agent", "create_reminder", message)
        await event_bus.emit(Event(
            type="reminder_created",
            agent="task_agent",
            message=f"Reminder set: {message} at {remind_at}",
        ))
        return {
            "status": "success",
            "reply": f"Reminder set: {message} at {remind_at}",
            "reminder_id": reminder_id,
        }


task_agent = TaskAgent()