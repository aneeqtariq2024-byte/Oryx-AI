"""ORYX Core — Planner.

Parses a user command into a structured plan:
  - intent  (what the user wants)
  - agent   (which agent should handle it)
  - params  (extracted parameters)
"""

import json
import re
from datetime import datetime

from backend.llm.model_router import model_router
from backend.memory.manager import memory_manager


SYSTEM_PROMPT = """You are ORYX's intent parser. Given a user message, respond with ONLY a JSON object (no markdown, no explanation) with these fields:

{
  "intent": "one of: chat, task, reminder, memory_store, memory_recall, pc_control, research, email",
  "agent": "one of: none, task_agent, email_agent, research_agent, pc_agent",
  "params": {
    ... extracted parameters depending on intent ...
  },
  "raw_reply": "A brief natural-language confirmation shown to the user before the agent acts."
}

Rules:
- If the user is just chatting, set intent="chat" and agent="none".
- For tasks: extract title, priority (high/medium/low), due_date if mentioned.
- For reminders: extract message and remind_at (ISO datetime or relative like "tomorrow 9am").
- For memory_store: extract key and value.
- For memory_recall: extract the query.
- For pc_control: extract action (open_application, close_application, open_folder, screenshot, system_info, type_text, click, scroll) and relevant params.
- For research: extract the query.
- For email: extract action (read, draft, send), recipients, subject, body if mentioned.

Respond with ONLY the JSON object."""


class Planner:
    async def plan(self, user_message: str) -> dict:
        """Parse *user_message* into a structured plan dict."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        result = await model_router.chat(messages, provider="groq")
        reply = result.get("reply", "{}")

        # Strip markdown fences if the model added them
        reply = re.sub(r"```json?\s*", "", reply)
        reply = re.sub(r"```\s*", "", reply)
        reply = reply.strip()

        try:
            plan = json.loads(reply)
        except json.JSONDecodeError:
            plan = {"intent": "chat", "agent": "none", "params": {}, "raw_reply": reply}

        # Normalise
        plan.setdefault("intent", "chat")
        plan.setdefault("agent", "none")
        plan.setdefault("params", {})
        plan.setdefault("raw_reply", "")
        return plan


planner = Planner()
