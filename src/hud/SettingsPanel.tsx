import { useSettingsStore, TUNING_RANGES, type TuningKey } from '../store/useSettingsStore'

const KEYS = Object.keys(TUNING_RANGES) as TuningKey[]

/** Car tuning menu: sliders for engine, suspension, grip and steering. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const tuning = useSettingsStore((s) => s.tuning)
  const setTuning = useSettingsStore((s) => s.setTuning)
  const reset = useSettingsStore((s) => s.reset)

  return (
    <div className="overlay">
      <div className="panel settings">
        <h2 className="title">⚙ Tune Your Car</h2>
        <p className="subtitle">Changes save automatically and apply on your next race.</p>

        {KEYS.map((k) => {
          const r = TUNING_RANGES[k]
          const value = tuning[k]
          const pct = ((value - r.min) / (r.max - r.min)) * 100
          return (
            <div className="slider-row" key={k}>
              <div className="slider-head">
                <span>{r.label}</span>
                <span className="slider-val">{r.fmt(value)}</span>
              </div>
              <input
                type="range"
                min={r.min}
                max={r.max}
                step={r.step}
                value={value}
                style={{ '--pct': `${pct}%` } as React.CSSProperties}
                onChange={(e) => setTuning(k, Number(e.target.value))}
              />
            </div>
          )
        })}

        <div className="settings-actions">
          <button className="btn ghost" onClick={reset}>
            Reset
          </button>
          <button className="cta" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
