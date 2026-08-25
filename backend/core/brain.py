"""ORYX Core — Brain.

The main intelligence layer. Every user message flows through here:

  1. Store user message in short-term memory
  2. Search long-term memory for relevant context
  3. Ask the Planner to create a plan
  4. Route to the correct Agent (or handle as plain chat)
  5. Store assistant reply in short-term memory
  6. Return reply + metadata to the API layer
"""

from __future__ import annotations

from backend.memory.manager import memory_manager
from backend.core.planner import planner
from backend.core.router import agent_router
from backend.llm.model_router import model_router


SYSTEM_PROMPT = """You are ORYX, a personal AI assistant. You are helpful, concise, and speak in the same language the user uses.

You have access to these capabilities:
- Task management (create, list, update, delete tasks)
- Reminders (schedule reminders at specific times)
- Memory (store and recall facts the user tells you to remember)
- PC control (open/close apps, folders, screenshots, system info)
- Research (search the web and summarize)
- Email (read, analyze, draft emails — V1 basic)

Answer naturally. If you don't know something, say so. Don't make up information.""" 


class Brain:
    async def process(self, user_message: str, provider: str = "automatic") -> dict:
        """Full pipeline: memory → plan → agent → reply."""
        # 1. Store user message
        memory_manager.add_user_message(user_message)

        # 2. Search long-term memory for relevant context
        memories = memory_manager.search_memory(user_message, limit=5)
        memory_context = ""
        if memories:
            memory_context = "\n".join([f"- {m['key']}: {m['value']}" for m in memories])
            memory_context = f"Relevant memories:\n{memory_context}\n"

        # 3. Plan
        plan = await planner.plan(user_message)
        intent = plan.get("intent", "chat")

        # 4. Handle memory intents directly (no agent needed)
        if intent == "memory_store":
            key = plan["params"].get("key", "")
            value = plan["params"].get("value", "")
            if key and value:
                memory_manager.remember(key, value)
                reply = f"I'll remember that: {key} = {value}"
                memory_manager.add_assistant_message(reply)
                return {"status": "success", "agent": "none", "reply": reply, "intent": intent}

        if intent == "memory_recall":
            query = plan["params"].get("query", user_message)
            results = memory_manager.search_memory(query)
            if results:
                reply = "\n".join([f"- {r['key']}: {r['value']}" for r in results])
            else:
                reply = "I don't have any memories matching that."
            memory_manager.add_assistant_message(reply)
            return {"status": "success", "agent": "none", "reply": reply, "intent": intent}

        # 5. Route to agent
        result = await agent_router.route(plan)

        # 6. If agent didn't produce a reply, fall back to LLM chat
        reply = result.get("reply", "") or plan.get("raw_reply", "")
        if not reply:
            messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n" + memory_context}]
            messages.extend(memory_manager.get_context_messages())
            llm_result = await model_router.chat(messages, provider=provider)
            reply = llm_result.get("reply", "")
            result["provider"] = llm_result.get("provider")

        # 7. Store assistant reply
        memory_manager.add_assistant_message(reply)
        result["reply"] = reply
        result["intent"] = intent
        return result


brain = Brain()
