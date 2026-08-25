# 🦾 ORYX AI — V1

Personal AI assistant with voice + text commands, task management, reminders, memory, PC control, and research.

## Quick Start

### 1. Configure API Keys

Open `.env` in the project root (`D:\Oryx AI\.env`):

```env
# Ollama (local, free, private)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1          # any model you pulled: llama3.1, qwen2.5, mistral...

# Groq (free API key from console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-70b-versatile

# Gemini (free API key from aistudio.google.com)
GEMINI_API_KEY=AIzaxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-pro
```

You need at least ONE provider working. Ollama needs no key — just the app running locally.

**Setup Ollama (recommended, fully local):**
```bash
# 1. Install from https://ollama.com/download
# 2. Pull a model:
ollama pull llama3.1
# 3. It runs automatically on port 11434. Verify:
ollama list
```

**Get Groq key:** https://console.groq.com/keys (free tier)
**Get Gemini key:** https://aistudio.google.com/apikey (free tier)

### 2. Install & Run Backend

```bash
cd "D:\Oryx AI"
pip install -r requirements.txt

# Start the backend (from the project root, so `backend.` imports resolve):
uvicorn backend.main:app --reload --port 8000
```

Backend runs at http://localhost:8000 — API docs at http://localhost:8000/docs

### 3. Install & Run Frontend

```bash
cd "D:\Oryx AI\frontend"
npm install
npm run dev
```

Open http://localhost:5173 — the ORYX dashboard with Solar Core UI.

### 4. Voice (optional)

```bash
pip install SpeechRecognition PyAudio pyttsx3
```

On Windows, PyAudio installs via `pip install pipwin && pipwin install pyaudio` if the normal install fails.

## What You Can Say

| Command | What happens |
|---|---|
| "ORYX, create a task to finish JavaScript tomorrow, high priority" | Task Agent creates a task |
| "ORYX, remind me about GitHub at 7 PM" | Reminder scheduled, notification fires in UI |
| "ORYX, remember that my project is called XYZ" | Stored in long-term memory |
| "ORYX, what's my project name?" | Recalled from memory |
| "ORYX, open Notepad" | PC Agent opens the app |
| "ORYX, open Downloads folder" | Opens in Explorer |
| "ORYX, take a screenshot" | Saved to `screenshots/` |
| "ORYX, system info" | CPU / RAM / disk report |
| "ORYX, research latest AI news" | Web search + LLM summary with sources |

## Architecture

```
User (voice/text)
   → Frontend (React + Vite, Solar Core UI, WebSocket live events)
   → FastAPI (backend/main.py)
   → ORYX Brain (core/brain.py)
       → Planner (LLM parses intent → agent → params)
       → Agent Router → Task / Email / Research / PC agent
       → Tool Dispatcher (security: safe / sensitive / dangerous)
   → Memory (SQLite: conversations + long-term facts)
   → Model Router (Ollama / Groq / Gemini, auto-select + fallback)
   → Scheduler (background loop fires reminders → WebSocket)
```

## Project Structure

```
ORYX AI/
├── .env                  # ← API keys & model names HERE
├── requirements.txt
├── backend/
│   ├── main.py           # FastAPI app, all REST + WS endpoints
│   ├── config.py         # loads .env
│   ├── core/             # brain, planner, agent router, event bus
│   ├── llm/              # ollama, groq, gemini + model_router
│   ├── agents/           # task, email, research, pc agents
│   ├── tools/            # dispatcher, pc, keyboard, mouse, system
│   ├── memory/           # short-term + long-term + manager
│   ├── voice/            # wakeword, stt, tts
│   ├── scheduler/        # reminder manager + background loop
│   ├── security/         # permissions, approvals, audit
│   ├── database/         # SQLite layer
│   └── connectors/       # future: gmail, whatsapp, telegram...
└── frontend/
    └── src/              # App, SolarCore, pages, api service, ws hook
```

## Changing the Ollama Model

Edit `OLLAMA_MODEL` in `.env` to any model you've pulled (`ollama list` shows them), then restart the backend. Common choices: `llama3.1`, `llama3.2`, `qwen2.5:7b`, `mistral`, `phi3`.

## Roadmap (post-V1)

1. Telegram notifications for reminders
2. WhatsApp Business Platform
3. Gmail connector (real email read/draft)
4. Browser agent, more connectors
