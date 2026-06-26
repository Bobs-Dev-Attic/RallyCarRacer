import { create } from 'zustand'
import type { CameraMode } from '../types'

/** Free-roam game state. 'menu' = title screen, 'racing' = driving the desert. */
export type Phase = 'menu' | 'racing'

interface GameState {
  phase: Phase
  cameraMode: CameraMode
  speedKmh: number

  startRace: () => void
  toMenu: () => void
  toggleCamera: () => void
  setSpeed: (kmh: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  cameraMode: 'chase',
  speedKmh: 0,

  startRace: () => set({ phase: 'racing' }),
  toMenu: () => set({ phase: 'menu' }),
  toggleCamera: () => set((s) => ({ cameraMode: s.cameraMode === 'chase' ? 'topdown' : 'chase' })),
  setSpeed: (kmh) => set({ speedKmh: kmh }),
}))
