import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import './ChatPage.css'

export default function ChatPage({ onResult }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (!message || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: message }])
    setBusy(true)
    try {
      const result = await api.chat(message)
      setMessages((m) => [...m, { role: 'assistant', content: result.reply || '(no reply)' }])
      onResult?.(result)
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setBusy(true)
        try {
          const { text } = await api.transcribe(blob)
          if (text) await send(text)
        } catch {
          setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Voice transcription failed.' }])
        } finally {
          setBusy(false)
        }
      }
      recorder.start()
      setRecording(true)
      window._oryxRecorder = recorder
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Microphone unavailable.' }])
    }
  }

  const stopRecording = () => {
    window._oryxRecorder?.stop()
    setRecording(false)
  }

  return (
    <div className="chat-page">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Say <b>"ORYX, aaj ke tasks batao"</b> or ask anything.</p>
            <p className="hint">Try: create a task • set a reminder • remember something • research a topic • open Notepad</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="bubble assistant typing">ORYX is thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <button
          className={`mic ${recording ? 'recording' : ''}`}
          onClick={recording ? stopRecording : startRecording}
          title="Voice input"
        >
          🎙️
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Talk to ORYX..."
          disabled={busy}
        />
        <button className="send" onClick={() => send()} disabled={busy || !input.trim()}>
          SEND
        </button>
      </div>
    </div>
  )
}
