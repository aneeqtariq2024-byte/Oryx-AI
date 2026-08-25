"""ORYX Tools — Dispatcher.

Routes tool calls from agents to the correct tool module,
enforcing permission / approval checks before execution.
"""

import json
from backend.security.permissions import requires_approval, is_dangerous
from backend.security.approval import create_approval
from backend.config import settings
from backend.tools import pc, keyboard, mouse, system


async def dispatch(action: str, params: dict | None = None) -> dict:
    """Execute a tool action, requesting approval if needed.

    Returns dict with keys: status, action, and either result data or approval_id.
    """
    params = params or {}

    if requires_approval(action) and settings.APPROVAL_REQUIRED:
        approval_id = create_approval(
            agent=params.pop("_agent", "unknown"),
            action=action,
            description=params.get("description", json.dumps(params)),
        )
        return {
            "status": "approval_required",
            "action": action,
            "approval_id": approval_id,
            "message": f"Approval required for action: {action}",
        }

    return await _execute(action, params)


async def _execute(action: str, params: dict) -> dict:
    """Direct execution (permission already granted or not needed)."""
    handler = TOOL_MAP.get(action)
    if handler is None:
        return {"status": "error", "action": action, "error": f"Unknown tool: {action}"}

    try:
        return handler(params)
    except Exception as e:
        from backend.security.audit import log_audit
        log_audit("dispatcher", action, "", "error", str(e))
        return {"status": "error", "action": action, "error": str(e)}


# ------------------------------------------------------------------
# Tool registry
# ------------------------------------------------------------------
TOOL_MAP: dict[str, callable] = {
    # PC tools
    "open_application": lambda p: pc.open_application(p.get("name", "")),
    "close_application": lambda p: pc.close_application(p.get("name", "")),
    "open_folder": lambda p: pc.open_folder(p.get("path", "")),
    "screenshot": lambda p: pc.screenshot(),
    "system_info": lambda p: {"status": "success", "data": system.get_system_info()},
    # Keyboard tools
    "type_text": lambda p: keyboard.type_text(p.get("text", "")),
    "keyboard_hotkey": lambda p: keyboard.hotkey(*p.get("keys", [])),
    "key_press": lambda p: keyboard.press(p.get("key", "")),
    # Mouse tools
    "click": lambda p: mouse.click(p.get("x"), p.get("y"), p.get("button", "left")),
    "scroll": lambda p: mouse.scroll(p.get("direction", "down"), p.get("amount", 5)),
    "move_to": lambda p: mouse.move_to(p.get("x", 0), p.get("y", 0)),
    "get_position": lambda p: mouse.get_position(),
}


def list_tools() -> list[dict]:
    """Return metadata about every registered tool."""
    from backend.security.permissions import ACTION_LEVELS, ActionLevel
    tools = []
    for name in TOOL_MAP:
        level = ACTION_LEVELS.get(name, ActionLevel.SENSITIVE)
        tools.append({"name": name, "level": level.value})
    return tools
