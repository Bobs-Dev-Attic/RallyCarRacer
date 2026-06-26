import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** User-tunable car attributes. Applied live to the player's car. */
export interface CarTuning {
  enginePower: number // engine force (N) on the drive wheels
  suspensionStiffness: number // spring rate — higher = firmer
  suspensionDamping: number // shock damping 0..1 — higher = less bounce
  tireGrip: number // lateral/longitudinal friction
  steering: number // max steering angle (radians)
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
  tireGrip: { min: 1, max: 3.6, step: 0.05, label: 'Tire Grip', fmt: (v) => v.toFixed(2) },
  steering: { min: 0.3, max: 0.85, step: 0.01, label: 'Steering', fmt: (v) => `${Math.round((v / 0.85) * 100)}%` },
}

// Firmer than the original 28-stiffness setup, which felt too soft.
export const DEFAULT_TUNING: CarTuning = {
  enginePower: 6000,
  suspensionStiffness: 46,
  suspensionDamping: 0.9,
  tireGrip: 2.2,
  steering: 0.55,
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
    { name: 'rcr-tuning-v1' },
  ),
)
