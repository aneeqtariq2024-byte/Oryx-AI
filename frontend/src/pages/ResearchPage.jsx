import { useState } from 'react'
import { api } from '../services/api'
import './ResearchPage.css'

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState('')
  const [sources, setSources] = useState([])

  const run = async () => {
    if (!query.trim() || busy) return
    setBusy(true)
    setSummary('')
    setSources([])
    try {
      const res = await api.research(query)
      setSummary(res.reply || 'No results.')
      setSources(res.sources || [])
    } catch (e) {
      setSummary(`⚠️ ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="research-page">
      <h2>Research</h2>
      <p className="hint">ORYX searches the web and gives you a concise briefing.</p>

      <div className="add-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="e.g. latest AI news"
        />
        <button onClick={run} disabled={busy}>{busy ? 'Researching…' : 'Research'}</button>
      </div>

      {summary && <div className="summary">{summary}</div>}

      {sources.length > 0 && (
        <>
          <h3>Sources</h3>
          <div className="sources">
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="source">
                {s.title || s.url}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
