"""ORYX security — permission checks for tool / agent actions."""

from enum import Enum
from typing import Callable


class ActionLevel(Enum):
    SAFE = "safe"
    SENSITIVE = "sensitive"
    DANGEROUS = "dangerous"


# Actions classified by risk level.
ACTION_LEVELS: dict[str, ActionLevel] = {
    # PC — safe
    "open_application": ActionLevel.SAFE,
    "close_application": ActionLevel.SAFE,
    "open_folder": ActionLevel.SAFE,
    "system_info": ActionLevel.SAFE,
    "screenshot": ActionLevel.SAFE,
    # PC — sensitive
    "type_text": ActionLevel.SENSITIVE,
    "click": ActionLevel.SENSITIVE,
    "scroll": ActionLevel.SENSITIVE,
    "keyboard_hotkey": ActionLevel.SENSITIVE,
    # Email — sensitive
    "read_emails": ActionLevel.SENSITIVE,
    "draft_email": ActionLevel.SENSITIVE,
    # Email — dangerous
    "send_email": ActionLevel.DANGEROUS,
    # Research — safe
    "web_search": ActionLevel.SAFE,
    "summarize": ActionLevel.SAFE,
    # Task — safe
    "create_task": ActionLevel.SAFE,
    "update_task": ActionLevel.SAFE,
    "delete_task": ActionLevel.SAFE,
    # Reminder — safe
    "create_reminder": ActionLevel.SAFE,
    # Memory — safe
    "store_memory": ActionLevel.SAFE,
    "recall_memory": ActionLevel.SAFE,
}


def requires_approval(action: str) -> bool:
    """Return True if the action needs user approval before execution."""
    level = ACTION_LEVELS.get(action)
    if level is None:
        return True  # unknown actions default to needing approval
    return level in (ActionLevel.SENSITIVE, ActionLevel.DANGEROUS)


def is_dangerous(action: str) -> bool:
    return ACTION_LEVELS.get(action) == ActionLevel.DANGEROUS
