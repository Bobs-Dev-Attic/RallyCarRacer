import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { TouchControls } from './TouchControls'
import { SettingsPanel } from './SettingsPanel'
import { Minimap } from './Minimap'
import { VERSION_LABEL } from '../version'

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const speedKmh = useGameStore((s) => s.speedKmh)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCamera = useGameStore((s) => s.toggleCamera)
  const startRace = useGameStore((s) => s.startRace)
  const toMenu = useGameStore((s) => s.toMenu)

  const [showSettings, setShowSettings] = useState(false)
  const driving = phase === 'racing'

  return (
    <>
      <div className="version-tag">{VERSION_LABEL}</div>

      {/* In-drive HUD + touch controls */}
      {driving && (
        <>
          <div className="hud">
            <button className="btn cam-toggle" onClick={toggleCamera}>
              {cameraMode === 'chase' ? '◎ Chase' : '▣ Top-down'}
            </button>

            <button className="btn menu-btn" onClick={toMenu}>
              ≡ Menu
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

      {/* Title menu */}
      {phase === 'menu' && (
        <div className="overlay">
          <div className="panel">
            <h1 className="title">Rally Car Racer</h1>
            <p className="subtitle">
              Open desert · bumps & jumps · roam free
              <br />
              Drag the wheel to steer · GAS / BRAKE / REV · avoid rocks & ditches
            </p>
            <div className="menu-buttons">
              <button className="cta" onClick={startRace}>
                ▶ Drive
              </button>
              <button className="btn ghost icon-btn" onClick={() => setShowSettings(true)}>
                ⚙ Tune Car
              </button>
            </div>
            <div className="panel-version">{VERSION_LABEL}</div>
          </div>
        </div>
      )}

      {/* Car tuning menu */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  )
}
