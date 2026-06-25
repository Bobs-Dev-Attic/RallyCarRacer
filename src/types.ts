/** Normalized control input shared by player (touch/keyboard) and AI cars. */
export interface InputState {
  /** -1 (full left) .. 1 (full right) */
  steer: number
  /** 0 .. 1 */
  throttle: number
  /** 0 .. 1 (also used for reverse when standing still) */
  brake: number
  /** locks the rear wheels and breaks traction for drifting */
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
  return { steer: 0, throttle: 0, brake: 0, handbrake: false }
}
