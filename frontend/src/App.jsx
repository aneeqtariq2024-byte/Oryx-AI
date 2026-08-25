import { useMemo, useState } from 'react'
import SolarCore from './components/SolarCore'
import ChatPage from './pages/ChatPage'
import TasksPage from './pages/TasksPage'
import MemoryPage from './pages/MemoryPage'
import ResearchPage from './pages/ResearchPage'
import SettingsPage from './pages/SettingsPage'
import { useEvents } from './hooks/useEvents'
import { api } from './services/api'
import './App.css'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'memory', label: 'Memory', icon: '🧠' },
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [activeAgent, setActiveAgent] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)
  const { events, connected } = useEvents()

  // Derive current agent activity from the latest event
  const latest = events[events.length - 1]
  const shownEvents = useMemo(() => [...events].reverse().slice(0, 12), [events])

  const onChatResult = (result) => {
    if (result.agent && result.agent !== 'none') {
      setActiveAgent(result.agent)
      setStatusMessage(`${result.agent.replace('_agent', '')}: done`)
      setTimeout(() => setActiveAgent(null), 4000)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">🦾 ORYX</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <span className="icon">{n.icon}</span> {n.label}
          </button>
        ))}
      </aside>

      <main className="main">
        <header className="topbar">
          <span>ORYX AI</span>
          <span className={`status ${connected ? 'online' : 'offline'}`}>
            {connected ? 'ONLINE ●' : 'OFFLINE ●'}
          </span>
        </header>

        <div className="content">
          {page === 'dashboard' && (
            <div className="dashboard">
              <div className="core-wrap">
                <SolarCore activeAgent={activeAgent} statusMessage={statusMessage} />
              </div>
              <div className="activity-panel">
                <div className="panel-title">LIVE ACTIVITY</div>
                {shownEvents.length === 0 && <div className="activity-empty">Waiting for agent activity…</div>}
                {shownEvents.map((e, i) => (
                  <div key={i} className="activity-row">
                    <span className="evt-type">{e.type}</span>
                    <span className="evt-msg">{e.message || e.agent}</span>
                    <span className="evt-time">{(e.timestamp || '').slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {page === 'chat' && <ChatPage onResult={onChatResult} />}
          {page === 'tasks' && <TasksPage />}
          {page === 'memory' && <MemoryPage />}
          {page === 'research' && <ResearchPage />}
          {page === 'settings' && <SettingsPage />}
        </div>

        <footer className="commandbar">
          <span className="mic-icon">🎙️</span>
          <input
            placeholder="Talk to ORYX..."
            onFocus={() => setPage('chat')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                window.dispatchEvent(new CustomEvent('oryx-command', { detail: e.target.value }))
                e.target.value = ''
                setPage('chat')
              }
            }}
          />
          <button className="send" onClick={() => setPage('chat')}>SEND</button>
        </footer>
      </main>
    </div>
  )
}
