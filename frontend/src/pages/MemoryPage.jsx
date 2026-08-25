import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './MemoryPage.css'

export default function MemoryPage() {
  const [memories, setMemories] = useState([])
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const refresh = async () => {
    const res = await api.getMemory()
    setMemories(res.memories || [])
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const add = async () => {
    if (!key.trim() || !value.trim()) return
    await api.storeMemory(key, value)
    setKey('')
    setValue('')
    refresh()
  }

  const remove = async (k) => {
    await api.deleteMemory(k)
    refresh()
  }

  return (
    <div className="memory-page">
      <h2>Memory</h2>
      <p className="hint">Things you tell ORYX to remember live here.</p>

      <div className="add-row">
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key (e.g. project_name)" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (e.g. ORYX AI)" />
        <button onClick={add}>Remember</button>
      </div>

      <div className="memory-list">
        {memories.map((m) => (
          <div key={m.id} className="memory-row">
            <span className="key">{m.key}</span>
            <span className="value">{m.value}</span>
            <button className="del" onClick={() => remove(m.key)}>✕</button>
          </div>
        ))}
        {memories.length === 0 && (
          <p className="empty">No memories yet. Try: "ORYX, remember that my project is called XYZ"</p>
        )}
      </div>
    </div>
  )
}
