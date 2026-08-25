"""ORYX Agents — Email Agent.

V1 is a placeholder with stub logic. Real Gmail/IMAP integration
comes via the connectors/ layer in a future version.
"""

from __future__ import annotations

from backend.security.audit import log_audit
from backend.llm.model_router import model_router


class EmailAgent:
    """Basic email operations. V1 returns stub responses."""

    async def execute(self, intent: str, params: dict) -> dict:
        action = params.get("action", "read")

        if action == "read":
            return await self._read(params)
        if action == "draft":
            return await self._draft(params)
        if action == "send":
            return await self._send(params)
        return {"status": "error", "reply": f"Unknown email action: {action}"}

    async def _read(self, params: dict) -> dict:
        log_audit("email_agent", "read_emails", "")
        # V1 stub — future: connect via connectors/gmail
        return {
            "status": "success",
            "reply": "Email connector not configured yet. Enable Gmail in a future update.",
            "emails": [],
        }

    async def _draft(self, params: dict) -> dict:
        recipient = params.get("recipient", "")
        subject = params.get("subject", "")
        body = params.get("body", "")
        log_audit("email_agent", "draft_email", recipient)
        draft = f"To: {recipient}\nSubject: {subject}\n\n{body}"
        return {
            "status": "success",
            "reply": f"Draft prepared:\n\n{draft}",
        }

    async def _send(self, params: dict) -> dict:
        log_audit("email_agent", "send_email", params.get("recipient", ""), status="blocked")
        return {
            "status": "approval_required",
            "reply": "Sending emails requires approval. This will be enabled when the Gmail connector is configured.",
        }


email_agent = EmailAgent()