const BASE = ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || res.statusText)
  }
  return res.json()
}

export const api = {
  // Brain
  chat: (message, provider = 'automatic') =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ message, provider }) }),

  // Tasks
  getTasks: () => request('/api/tasks'),
  createTask: (task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, updates) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Reminders
  getReminders: () => request('/api/reminders'),
  createReminder: (message, remind_at) =>
    request('/api/reminders', { method: 'POST', body: JSON.stringify({ message, remind_at }) }),
  deleteReminder: (id) => request(`/api/reminders/${id}`, { method: 'DELETE' }),

  // Memory
  getMemory: () => request('/api/memory'),
  storeMemory: (key, value) =>
    request('/api/memory', { method: 'POST', body: JSON.stringify({ key, value }) }),
  deleteMemory: (key) => request(`/api/memory/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  // Research
  research: (query) => request('/api/research', { method: 'POST', body: JSON.stringify({ query }) }),

  // Tools / PC
  getTools: () => request('/api/tools'),
  executeTool: (action, params = {}) =>
    request('/api/tools/execute', { method: 'POST', body: JSON.stringify({ action, params }) }),

  // Status
  getLLMStatus: () => request('/api/llm/status'),
  getEvents: () => request('/api/events'),
  getApprovals: () => request('/api/approvals'),
  resolveApproval: (id, approved) =>
    request(`/api/approvals/${id}/resolve`, { method: 'POST', body: JSON.stringify({ approved }) }),

  // Voice
  transcribe: async (audioBlob) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'speech.wav')
    const res = await fetch('/api/voice/stt', { method: 'POST', body: form })
    return res.json()
  },
  speak: async (text) => {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('TTS unavailable')
    const blob = await res.blob()
    const audio = new Audio(URL.createObjectURL(blob))
    audio.play()
  },
}
