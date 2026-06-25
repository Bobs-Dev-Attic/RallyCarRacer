import { create } from 'zustand'
import type { CameraMode, CarStanding, RacePhase } from '../types'
import { CHECKPOINTS } from '../scene/trackData'

export const TOTAL_LAPS = 3

interface GameState {
  phase: RacePhase
  countdown: number // seconds remaining, 3..0
  raceTime: number // seconds elapsed since green light
  cameraMode: CameraMode

  // player progress
  lap: number
  nextCheckpoint: number
  lapTimes: number[]
  bestLap: number | null

  // live telemetry (updated at low frequency for the HUD)
  speedKmh: number
  position: number // 1-based race position
  totalCars: number

  standings: Record<string, CarStanding>

  // actions
  startRace: () => void
  setPhase: (p: RacePhase) => void
  tickCountdown: (dt: number) => void
  tickRaceTime: (dt: number) => void
  toggleCamera: () => void
  setSpeed: (kmh: number) => void
  registerCar: (id: string, isPlayer: boolean) => void
  passCheckpoint: (id: string, checkpointIndex: number) => void
  recomputePositions: () => void
}

const checkpointCount = CHECKPOINTS.length

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  countdown: 3,
  raceTime: 0,
  cameraMode: 'chase',
  lap: 1,
  nextCheckpoint: 0,
  lapTimes: [],
  bestLap: null,
  speedKmh: 0,
  position: 1,
  totalCars: 1,
  standings: {},

  startRace: () =>
    set({
      phase: 'countdown',
      countdown: 3,
      raceTime: 0,
      lap: 1,
      nextCheckpoint: 0,
      lapTimes: [],
      bestLap: null,
    }),

  setPhase: (p) => set({ phase: p }),

  tickCountdown: (dt) => {
    const next = get().countdown - dt
    if (next <= 0) set({ countdown: 0, phase: 'racing' })
    else set({ countdown: next })
  },

  tickRaceTime: (dt) => set((s) => ({ raceTime: s.raceTime + dt })),

  toggleCamera: () =>
    set((s) => ({ cameraMode: s.cameraMode === 'chase' ? 'topdown' : 'chase' })),

  setSpeed: (kmh) => set({ speedKmh: kmh }),

  registerCar: (id, isPlayer) =>
    set((s) => ({
      standings: {
        ...s.standings,
        [id]: { id, progress: 0, lap: 1, isPlayer },
      },
      totalCars: Object.keys(s.standings).length + (s.standings[id] ? 0 : 1),
    })),

  passCheckpoint: (id, checkpointIndex) => {
    const s = get()
    const car = s.standings[id]
    if (!car) return

    // checkpoints must be taken in order around the loop
    const expected = (Math.floor(car.progress) % checkpointCount + checkpointCount) % checkpointCount
    const expectedNext = expected // progress counts gates passed; next gate index
    if (checkpointIndex !== expectedNext) return

    const newProgress = car.progress + 1
    const crossedLine = checkpointIndex === 0 && car.progress > 0
    let lap = car.lap
    const updates: Partial<GameState> = {}

    if (crossedLine) {
      lap += 1
      if (car.isPlayer) {
        const lapTime = s.raceTime - (s.lapTimes.reduce((a, b) => a + b, 0) || 0)
        const lapTimes = [...s.lapTimes, lapTime]
        updates.lapTimes = lapTimes
        updates.bestLap = s.bestLap == null ? lapTime : Math.min(s.bestLap, lapTime)
        updates.lap = lap
        if (lap > TOTAL_LAPS) updates.phase = 'finished'
      }
    }

    if (car.isPlayer) {
      updates.nextCheckpoint = (checkpointIndex + 1) % checkpointCount
    }

    set({
      ...updates,
      standings: {
        ...s.standings,
        [id]: { ...car, progress: newProgress, lap },
      },
    })
    get().recomputePositions()
  },

  recomputePositions: () => {
    const s = get()
    const cars = Object.values(s.standings)
    cars.sort((a, b) => b.progress - a.progress)
    const playerIdx = cars.findIndex((c) => c.isPlayer)
    if (playerIdx >= 0) set({ position: playerIdx + 1, totalCars: cars.length })
  },
}))
