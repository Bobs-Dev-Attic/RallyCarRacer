import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** User-tunable car attributes. Applied live to the player's car. */
export interface CarTuning {
  enginePower: number // engine force (N) on the drive wheels
  suspensionStiffness: number // spring rate — higher = firmer
  suspensionDamping: number // shock damping 0..1 — higher = less bounce
  tireGrip: number // lateral/longitudinal friction
  steering: number // max steering angle (radians)
  stability: number // 0..1 — higher lowers the center of gravity (resists flipping)
}

export type TuningKey = keyof CarTuning

export interface TuningRange {
  min: number
  max: number
  step: number
  label: string
  /** format the raw value for display */
  fmt: (v: number) => string
}

export const TUNING_RANGES: Record<TuningKey, TuningRange> = {
  enginePower: { min: 3000, max: 12000, step: 250, label: 'Engine / Torque', fmt: (v) => `${Math.round(v / 100) / 10}k` },
  suspensionStiffness: { min: 18, max: 75, step: 1, label: 'Suspension Stiffness', fmt: (v) => `${Math.round(v)}` },
  suspensionDamping: { min: 0.55, max: 1, step: 0.01, label: 'Suspension Damping', fmt: (v) => v.toFixed(2) },
  stability: { min: 0, max: 1, step: 0.02, label: 'Stability (low CoG)', fmt: (v) => `${Math.round(v * 100)}%` },
  tireGrip: { min: 1, max: 3.6, step: 0.05, label: 'Tire Grip', fmt: (v) => v.toFixed(2) },
  steering: { min: 0.3, max: 0.85, step: 0.01, label: 'Steering', fmt: (v) => `${Math.round((v / 0.85) * 100)}%` },
}

// Firmer than the original 28-stiffness setup, which felt too soft.
export const DEFAULT_TUNING: CarTuning = {
  enginePower: 6000,
  suspensionStiffness: 46,
  suspensionDamping: 0.9,
  stability: 0.8, // low center of gravity by default so it resists flipping
  tireGrip: 2.2,
  steering: 0.55,
}

/** Map the 0..1 stability slider to a center-of-mass Y offset (more negative = lower/steadier). */
export function cgFromStability(stability: number) {
  const s = Number.isFinite(stability) ? Math.min(Math.max(stability, 0), 1) : DEFAULT_TUNING.stability
  return -0.45 - s * 0.95 // ranges from -0.45 (tippy) to -1.4 (very low)
}

interface SettingsState {
  tuning: CarTuning
  setTuning: (key: TuningKey, value: number) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tuning: { ...DEFAULT_TUNING },
      setTuning: (key, value) => set((s) => ({ tuning: { ...s.tuning, [key]: value } })),
      reset: () => set({ tuning: { ...DEFAULT_TUNING } }),
    }),
    {
      name: 'rcr-tuning-v1',
      // fill in any tuning keys missing from older persisted state (e.g. new
      // sliders added after a player first saved their settings)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>
        return {
          ...current,
          ...p,
          tuning: { ...DEFAULT_TUNING, ...(p.tuning ?? {}) },
        }
      },
    },
  ),
)
