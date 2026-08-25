import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './SettingsPage.css'

export default function SettingsPage() {
  const [providers, setProviders] = useState({})
  const [tools, setTools] = useState([])

  useEffect(() => {
    api.getLLMStatus().then((r) => setProviders(r || {})).catch(() => {})
    api.getTools().then((r) => setTools(r.tools || [])).catch(() => {})
  }, [])

  const rows = [
    { name: 'Ollama', key: 'ollama', note: 'Local & private — set OLLAMA_MODEL in .env' },
    { name: 'Groq', key: 'groq', note: 'Fast responses — set GROQ_API_KEY in .env' },
    { name: 'Gemini', key: 'gemini', note: 'Complex reasoning — set GEMINI_API_KEY in .env' },
  ]

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <p className="hint">API keys and models are configured in the <code>.env</code> file at the project root. Edit it, then restart the backend.</p>

      <h3>LLM Providers</h3>
      <div className="provider-list">
        {rows.map((r) => (
          <div key={r.key} className="provider-row">
            <span className={`dot ${providers[r.key] ? 'on' : 'off'}`} />
            <span className="name">{r.name}</span>
            <span className="note">{r.note}</span>
          </div>
        ))}
      </div>

      <h3>Available Tools ({tools.length})</h3>
      <div className="tools-grid">
        {tools.map((t) => (
          <div key={t.name} className={`tool level-${t.level}`}>
            <span className="tool-name">{t.name}</span>
            <span className="tool-level">{t.level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
