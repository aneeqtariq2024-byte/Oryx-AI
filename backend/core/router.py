"""ORYX Core — Agent Router.

Receives a plan from the Planner and dispatches to the correct agent.
"""

from __future__ import annotations

from backend.agents.task_agent import task_agent
from backend.agents.email_agent import email_agent
from backend.agents.research_agent import research_agent
from backend.agents.pc_agent import pc_agent
from backend.core.events import Event, event_bus


AGENT_MAP = {
    "task_agent": task_agent,
    "email_agent": email_agent,
    "research_agent": research_agent,
    "pc_agent": pc_agent,
}


class AgentRouter:
    async def route(self, plan: dict) -> dict:
        """Execute the plan via the appropriate agent."""
        agent_name = plan.get("agent", "none")
        intent = plan.get("intent", "chat")
        params = plan.get("params", {})

        if agent_name == "none":
            # Plain chat — no agent needed, raw_reply is already set
            return {"status": "success", "agent": "none", "reply": plan.get("raw_reply", "")}

        agent = AGENT_MAP.get(agent_name)
        if agent is None:
            return {"status": "error", "agent": agent_name, "reply": f"Unknown agent: {agent_name}"}

        # Emit live activity event
        await event_bus.emit(Event(
            type="agent_status",
            agent=agent_name,
            message=f"{agent_name.replace('_', ' ').title()} working...",
        ))

        result = await agent.execute(intent, params)
        result["agent"] = agent_name

        # Emit completion
        await event_bus.emit(Event(
            type="agent_status",
            agent=agent_name,
            message=f"{agent_name.replace('_', ' ').title()} done.",
            data=result,
        ))

        return result


agent_router = AgentRouter()