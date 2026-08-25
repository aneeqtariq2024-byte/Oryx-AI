"""ORYX AI — FastAPI backend entrypoint.

Run with:  uvicorn backend.main:app --reload
"""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from backend.config import settings
from backend.database.database import db
from backend.core.brain import brain
from backend.core.events import event_bus, Event
from backend.llm.model_router import model_router
from backend.memory.manager import memory_manager
from backend.scheduler.scheduler import scheduler_loop
from backend.scheduler.reminders import reminder_manager
from backend.security.approval import get_pending_approvals, resolve_approval
from backend.security.audit import get_audit_log
from backend.tools.dispatcher import list_tools, dispatch
from backend.voice import stt, tts


# ------------------------------------------------------------------
# Lifespan — init DB + start scheduler
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_tables()
    scheduler_task = asyncio.create_task(scheduler_loop())
    print("🦾 ORYX AI backend started.")
    yield
    scheduler_task.cancel()
    print("🦾 ORYX AI backend stopped.")


app = FastAPI(title="ORYX AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    provider: str = "automatic"


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: str = ""


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    due_date: str | None = None


class ReminderCreate(BaseModel):
    message: str
    remind_at: str


class MemoryStore(BaseModel):
    key: str
    value: str
    category: str = "general"


class ResearchRequest(BaseModel):
    query: str


class ToolRequest(BaseModel):
    action: str
    params: dict = {}


class ApprovalDecision(BaseModel):
    approved: bool


# ------------------------------------------------------------------
# Health
# ------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "online", "name": "ORYX AI", "version": "1.0.0"}


# ------------------------------------------------------------------
# Chat — the main brain endpoint
# ------------------------------------------------------------------
@app.post("/api/chat")
async def chat(req: ChatRequest):
    result = await brain.process(req.message, provider=req.provider)
    return result


# ------------------------------------------------------------------
# LLM status
# ------------------------------------------------------------------
@app.get("/api/llm/status")
async def llm_status():
    return await model_router.status()


# ------------------------------------------------------------------
# Tasks
# ------------------------------------------------------------------
@app.get("/api/tasks")
async def list_tasks(status: str | None = None):
    tasks = db.fetch_all("tasks", **({"status": status} if status else {}))
    return {"tasks": tasks}


@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    task_id = db.insert("tasks", task.model_dump())
    return {"id": task_id, "status": "created"}


@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int):
    t = db.fetch_one("tasks", task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    return t


@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: int, updates: TaskUpdate):
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(400, "No fields to update")
    db.update("tasks", task_id, data)
    return {"status": "updated"}


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int):
    db.delete("tasks", task_id)
    return {"status": "deleted"}


# ------------------------------------------------------------------
# Reminders
# ------------------------------------------------------------------
@app.get("/api/reminders")
async def list_reminders():
    return {"reminders": reminder_manager.get_all()}


@app.post("/api/reminders")
async def create_reminder(r: ReminderCreate):
    reminder_id = reminder_manager.create(r.message, r.remind_at)
    return {"id": reminder_id, "status": "created"}


@app.delete("/api/reminders/{reminder_id}")
async def delete_reminder(reminder_id: int):
    reminder_manager.delete(reminder_id)
    return {"status": "deleted"}


# ------------------------------------------------------------------
# Memory
# ------------------------------------------------------------------
@app.get("/api/memory")
async def get_memory(category: str | None = None):
    return {"memories": memory_manager.long_term.get_all(category)}


@app.post("/api/memory")
async def store_memory(m: MemoryStore):
    memory_manager.remember(m.key, m.value, m.category)
    return {"status": "stored"}


@app.get("/api/memory/search")
async def search_memory(q: str):
    return {"results": memory_manager.search_memory(q)}


@app.delete("/api/memory/{key}")
async def delete_memory(key: str):
    memory_manager.long_term.delete(key)
    return {"status": "deleted"}


@app.get("/api/conversations")
async def get_conversations(limit: int = 50):
    rows = db.execute_sql(
        "SELECT * FROM conversations ORDER BY id DESC LIMIT ?",
        (limit,),
    )
    return {"conversations": list(reversed(rows))}


# ------------------------------------------------------------------
# Research
# ------------------------------------------------------------------
@app.post("/api/research")
async def research(req: ResearchRequest):
    from backend.agents.research_agent import research_agent
    return await research_agent.execute("research", {"query": req.query})


# ------------------------------------------------------------------
# Tools (direct dispatch — used by PC panel)
# ------------------------------------------------------------------
@app.get("/api/tools")
async def tools():
    return {"tools": list_tools()}


@app.post("/api/tools/execute")
async def execute_tool(req: ToolRequest):
    result = await dispatch(req.action, req.params)
    return result


# ------------------------------------------------------------------
# Approvals
# ------------------------------------------------------------------
@app.get("/api/approvals")
async def approvals():
    return {"pending": get_pending_approvals()}


@app.post("/api/approvals/{approval_id}/resolve")
async def resolve(approval_id: int, decision: ApprovalDecision):
    resolve_approval(approval_id, decision.approved)
    return {"status": "approved" if decision.approved else "rejected"}


# ------------------------------------------------------------------
# Audit
# ------------------------------------------------------------------
@app.get("/api/audit")
async def audit(limit: int = 100):
    return {"entries": get_audit_log(limit)}


# ------------------------------------------------------------------
# Voice
# ------------------------------------------------------------------
@app.post("/api/voice/stt")
async def voice_stt(audio: UploadFile = File(...)):
    data = await audio.read()
    text = stt.transcribe(data)
    return {"text": text}


@app.post("/api/voice/tts")
async def voice_tts(body: dict):
    text = body.get("text", "")
    if not text:
        raise HTTPException(400, "text is required")
    audio_bytes = tts.synthesize(text)
    if audio_bytes is None:
        raise HTTPException(503, "TTS engine unavailable")
    return Response(content=audio_bytes, media_type="audio/wav")


# ------------------------------------------------------------------
# Events (recent activity polling fallback)
# ------------------------------------------------------------------
@app.get("/api/events")
async def recent_events(limit: int = 20):
    return {"events": event_bus.get_recent(limit)}


# ------------------------------------------------------------------
# WebSocket — live agent activity
# ------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    async def forward(event: Event):
        await ws.send_text(json.dumps(event.to_dict()))

    event_bus.subscribe(forward)
    try:
        while True:
            # Keep the connection alive; client messages ignored in V1
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        event_bus.unsubscribe(forward)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
