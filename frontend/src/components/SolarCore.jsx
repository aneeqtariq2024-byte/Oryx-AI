import { useEffect, useState } from 'react'
import './SolarCore.css'

/**
 * ORYX CORE — Solar System UI.
 * Center sun = ORYX brain. Orbiting planets = agents.
 * When an agent is active, its planet lights up and grows (Agent Focus Mode).
 */
const AGENTS = [
  { id: 'task_agent', label: 'TASK', orbit: 110, speed: 14, color: '#ffb347' },
  { id: 'email_agent', label: 'EMAIL', orbit: 150, speed: 22, color: '#5bc0eb' },
  { id: 'research_agent', label: 'RESEARCH', orbit: 190, speed: 32, color: '#c39bd3' },
  { id: 'pc_agent', label: 'PC', orbit: 230, speed: 44, color: '#7ee081' },
]

export default function SolarCore({ activeAgent, statusMessage }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let raf
    let start = performance.now()
    const loop = (now) => {
      setTick((now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="solar-core">
      <div className="orbits">
        {AGENTS.map((a) => (
          <div key={a.id} className="orbit-ring" style={{ width: a.orbit * 2, height: a.orbit * 2 }} />
        ))}
      </div>

      {AGENTS.map((a) => {
        const angle = (tick * 360) / a.speed
        const rad = (angle * Math.PI) / 180
        const x = Math.cos(rad) * a.orbit
        const y = Math.sin(rad) * a.orbit
        const isActive = activeAgent === a.id
        return (
          <div
            key={a.id}
            className={`planet ${isActive ? 'planet-active' : ''}`}
            style={{
              transform: `translate(${x}px, ${y}px)`,
              background: a.color,
              boxShadow: isActive ? `0 0 24px 8px ${a.color}` : `0 0 10px ${a.color}66`,
              width: isActive ? 26 : 16,
              height: isActive ? 26 : 16,
            }}
            title={a.label}
          >
            {isActive && <span className="planet-label">{a.label}</span>}
          </div>
        )
      })}

      <div className={`sun ${activeAgent ? 'sun-busy' : ''}`}>
        <div className="sun-inner">ORYX</div>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  )
}
