import { useEffect, useState, useRef } from 'react'

/**
 * Live event stream from the backend (WebSocket with polling fallback).
 * Returns { events, connected }.
 */
export function useEvents(maxEvents = 30) {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data)
        setEvents((prev) => [...prev.slice(-(maxEvents - 1)), event])
      } catch {
        /* ignore malformed */
      }
    }

    return () => ws.close()
  }, [maxEvents])

  return { events, connected }
}
