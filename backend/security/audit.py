"""ORYX security — audit logging for every agent / tool action."""

from datetime import datetime
from backend.database.database import db
from backend.config import settings


def log_audit(agent: str, action: str, target: str = "", status: str = "success", details: str = ""):
    """Persist an audit entry when `settings.AUDIT_LOG` is enabled."""
    if not settings.AUDIT_LOG:
        return
    db.insert("audit_log", {
        "agent": agent,
        "action": action,
        "target": target,
        "status": status,
        "details": details,
    })


def get_audit_log(limit: int = 100) -> list[dict]:
    return db.execute_sql(
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?",
        (limit,),
    )
