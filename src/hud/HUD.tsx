import { useState } from 'react'
import { useGameStore, TOTAL_LAPS } from '../store/useGameStore'
import { TouchControls } from './TouchControls'
import { SettingsPanel } from './SettingsPanel'
import { Minimap } from './Minimap'
import { VERSION_LABEL } from '../version'

function fmt(t: number) {
  if (!isFinite(t) || t <= 0) return '--:--'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const ms = Math.floor((t * 1000) % 1000)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const countdown = useGameStore((s) => s.countdown)
  const raceTime = useGameStore((s) => s.raceTime)
  const lap = useGameStore((s) => s.lap)
  const speedKmh = useGameStore((s) => s.speedKmh)
  const position = useGameStore((s) => s.position)
  const totalCars = useGameStore((s) => s.totalCars)
  const bestLap = useGameStore((s) => s.bestLap)
  const lapTimes = useGameStore((s) => s.lapTimes)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCamera = useGameStore((s) => s.toggleCamera)
  const startRace = useGameStore((s) => s.startRace)

  const [showSettings, setShowSettings] = useState(false)

  const racing = phase === 'racing' || phase === 'countdown'

  return (
    <>
      {/* Build/version tag — always visible so you can confirm the deployed build */}
      <div className="version-tag">{VERSION_LABEL}</div>

      {/* In-race HUD + touch controls */}
      {racing && (
        <>
          <div className="hud">
            <div className="hud-top">
              <div className="chip">
                <div className="label">Lap</div>
                <div className="value">
                  {Math.min(lap, TOTAL_LAPS)}/{TOTAL_LAPS}
                </div>
              </div>
              <div className="chip">
                <div className="label">Time</div>
                <div className="value">{fmt(raceTime)}</div>
              </div>
              <div className="chip">
                <div className="label">Pos</div>
                <div className="value">
                  {position}/{totalCars}
                </div>
              </div>
            </div>

            <button className="btn cam-toggle" onClick={toggleCamera}>
              {cameraMode === 'chase' ? '◎ Chase' : '▣ Top-down'}
            </button>

            <Minimap />


            <div className="speedo">
              <span className="kmh">{Math.round(speedKmh)}</span>
              <span className="unit"> km/h</span>
            </div>
          </div>
          <TouchControls />
        </>
      )}

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className="overlay clear">
          <div className="countdown">{Math.ceil(countdown) || 'GO!'}</div>
        </div>
      )}

      {/* Start menu */}
      {phase === 'menu' && (
        <div className="overlay">
          <div className="panel">
            <h1 className="title">Rally Car Racer</h1>
            <p className="subtitle">
              {TOTAL_LAPS} laps · forest rally · beat the AI
              <br />
              Drag the wheel to steer · GAS / BRAKE / DRIFT
            </p>
            <div className="menu-buttons">
              <button className="cta" onClick={startRace}>
                ▶ Start Race
              </button>
              <button className="btn ghost icon-btn" onClick={() => setShowSettings(true)}>
                ⚙ Tune Car
              </button>
            </div>
            <div className="panel-version">{VERSION_LABEL}</div>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'finished' && (
        <div className="overlay">
          <div className="panel">
            <h1 className="title">{position === 1 ? '🏆 You Won!' : `Finished ${position}/${totalCars}`}</h1>
            <p className="subtitle">Total time {fmt(raceTime)}</p>
            {lapTimes.map((t, i) => (
              <div className="results-row" key={i}>
                <span>Lap {i + 1}</span>
                <span>{fmt(t)}</span>
              </div>
            ))}
            <div className="results-row" style={{ opacity: 0.8, marginTop: 8 }}>
              <span>Best</span>
              <span>{fmt(bestLap ?? 0)}</span>
            </div>
            <div className="menu-buttons" style={{ marginTop: 18 }}>
              <button className="cta" onClick={startRace}>
                ↻ Race Again
              </button>
              <button className="btn ghost icon-btn" onClick={() => setShowSettings(true)}>
                ⚙ Tune Car
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Car tuning menu */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  )
}
