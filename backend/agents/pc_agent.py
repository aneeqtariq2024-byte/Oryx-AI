"""ORYX Agents — PC Agent.

Delegates to the tool dispatcher for all PC control actions.
"""

from __future__ import annotations

from backend.tools.dispatcher import dispatch
from backend.security.audit import log_audit


class PCAgent:
    """Wraps the tool dispatcher for PC control operations."""

    async def execute(self, intent: str, params: dict) -> dict:
        action = params.get("action", "")
        if not action:
            return {"status": "error", "reply": "No PC action specified."}

        # Inject agent name for audit trail
        params["_agent"] = "pc_agent"
        result = await dispatch(action, params)

        reply = result.get("message", "") or ""
        if result.get("status") == "success":
            data = result.get("data") or ""
            if data:
                import json
                reply = f"{action}: {json.dumps(data, indent=2)}" if isinstance(data, (dict, list)) else str(data)
            if not reply:
                reply = f"Done: {action}"
        elif result.get("status") == "approval_required":
            reply = result.get("message", "Approval required.")
        else:
            reply = f"Error: {result.get('error', 'Unknown error')}"

        return {"status": result.get("status"), "reply": reply}


pc_agent = PCAgent()