"""ORYX security — approval request lifecycle."""

from datetime import datetime
from backend.database.database import db


def create_approval(agent: str, action: str, description: str) -> int:
    return db.insert("approvals", {
        "agent": agent,
        "action": action,
        "description": description,
        "status": "pending",
    })


def resolve_approval(approval_id: int, approved: bool):
    status = "approved" if approved else "rejected"
    db.update("approvals", approval_id, {
        "status": status,
        "resolved_at": datetime.now().isoformat(),
    })


def get_pending_approvals() -> list[dict]:
    return db.fetch_all("approvals", status="pending")
