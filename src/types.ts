/** Normalized control input shared by player (touch/keyboard) and AI cars. */
export interface InputState {
  /** -1 (full left) .. 1 (full right) */
  steer: number
  /** 0 .. 1 */
  throttle: number
  /** 0 .. 1 — slows the car (no longer auto-reverses) */
  brake: number
  /** drive backwards */
  reverse: boolean
  /** locks the rear wheels and breaks traction for drifting (keyboard only) */
  handbrake: boolean
}

export type CameraMode = 'chase' | 'topdown'

export type RacePhase = 'menu' | 'countdown' | 'racing' | 'finished'

export interface CarStanding {
  id: string
  /** total progress measured in checkpoints passed (monotonic) */
  progress: number
  lap: number
  isPlayer: boolean
}

export function createInput(): InputState {
  return { steer: 0, throttle: 0, brake: 0, reverse: false, handbrake: false }
}
