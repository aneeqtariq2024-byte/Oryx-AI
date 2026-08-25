## Cloud Brain Section — Claude-style (like reference pics)

**Already done (before plan mode):** Sidebar has the "Cloud Brain" button (Brain icon, coral highlight, works open+collapsed), `currentView` supports `'cloudbrain'`, old API-keys settings tab removed, key states (`keyStatuses`, `keyInputs`, `handleSaveKey`, `fetchKeyStatuses`) wired with auto-refresh on view open. Backend `/api/keys` (status + save) already works.

### Remaining changes

**1. `src/app/page.tsx` — add the Cloud Brain view page** (main piece)
Insert render block before `currentView === 'projects'` branch:
- **Hero**: coral gradient Brain icon (#D97757), serif heading "Cloud Brain", subtitle explaining Boss Agent auto-routing + free-tier failover
- **Live stats pills**: "X of 5 brains connected" + "X×2+ models in Boss pool"
- **Provider cards grid** (2 cols, warm dark #2B2926 cards like Claude's UI):
  - **Claude** — full-width featured card, "RECOMMENDED" badge, Sonnet 4 · Haiku 3.5, link console.anthropic.com
  - Groq (amber Zap), Gemini (blue Sparkles), OpenRouter (purple Layers), NVIDIA (emerald Cpu)
  - Each card: icon, models line, live **Connected / Not connected** pill (pulsing dot), password input, **Connect/Replace** button (coral), free-tier note, **Get API Key ↗** link
- Footer note: keys stored locally in `.env.local`, active instantly
- Reuses existing `handleSaveKey` — saving connects the brain immediately, no restart

**2. `src/app/page.tsx` — small wirings**
- Add `Zap, Layers, Cpu` to lucide imports (Sparkles/Brain already there); drop now-unused `KeyRound`
- Header title shows **"Cloud Brain"** when that view is active

**3. Verify**
- `npx tsc --noEmit` → clean
- Live check on http://localhost:3000: open sidebar → Cloud Brain → page renders with correct Connected statuses (Groq/Gemini/OpenRouter ✅, Claude/NVIDIA not connected)

No backend changes needed — `/api/keys` and Boss Agent already work with all 5 providers.