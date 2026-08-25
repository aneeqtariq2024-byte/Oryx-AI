import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './TasksPage.css'

const PRIORITY_EMOJI = { high: '🔴', medium: '🟡', low: '🟢' }

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const refresh = async () => {
    const [t, r] = await Promise.all([api.getTasks(), api.getReminders()])
    setTasks(t.tasks || [])
    setReminders(r.reminders || [])
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const addTask = async () => {
    if (!title.trim()) return
    await api.createTask({ title, priority })
    setTitle('')
    refresh()
  }

  const toggleStatus = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    await api.updateTask(task.id, { status: next })
    refresh()
  }

  const remove = async (id) => {
    await api.deleteTask(id)
    refresh()
  }

  const removeReminder = async (id) => {
    await api.deleteReminder(id)
    refresh()
  }

  const pending = tasks.filter((t) => t.status !== 'completed')
  const done = tasks.filter((t) => t.status === 'completed')

  return (
    <div className="tasks-page">
      <h2>Tasks</h2>

      <div className="add-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="New task..."
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={addTask}>Add</button>
      </div>

      <div className="task-list">
        {pending.map((t) => (
          <div key={t.id} className="task-row">
            <input type="checkbox" checked={false} onChange={() => toggleStatus(t)} />
            <span className="prio">{PRIORITY_EMOJI[t.priority]}</span>
            <span className="title">{t.title}</span>
            {t.due_date && <span className="due">{t.due_date}</span>}
            <button className="del" onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
        {done.length > 0 && <div className="section-label">COMPLETED</div>}
        {done.map((t) => (
          <div key={t.id} className="task-row done">
            <input type="checkbox" checked onChange={() => toggleStatus(t)} />
            <span className="prio">{PRIORITY_EMOJI[t.priority]}</span>
            <span className="title">{t.title}</span>
            <button className="del" onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
        {tasks.length === 0 && <p className="empty">No tasks yet. Ask ORYX: "create a task to finish JavaScript tomorrow"</p>}
      </div>

      <h2>Reminders</h2>
      <div className="task-list">
        {reminders.map((r) => (
          <div key={r.id} className="task-row reminder">
            <span className="bell">🔔</span>
            <span className="title">{r.message}</span>
            <span className="due">{r.remind_at?.slice(0, 16).replace('T', ' ')}</span>
            <button className="del" onClick={() => removeReminder(r.id)}>✕</button>
          </div>
        ))}
        {reminders.length === 0 && <p className="empty">No reminders set.</p>}
      </div>
    </div>
  )
}
