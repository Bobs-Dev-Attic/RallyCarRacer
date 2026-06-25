import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

/**
 * Drives the race-phase state machine each frame: counts the countdown down,
 * then accumulates race time while racing. Discrete only — no per-frame React
 * state beyond the store ticks it owns.
 */
export function RaceDirector() {
  useFrame((_, dt) => {
    const { phase, tickCountdown, tickRaceTime } = useGameStore.getState()
    const clamped = Math.min(dt, 0.05)
    if (phase === 'countdown') tickCountdown(clamped)
    else if (phase === 'racing') tickRaceTime(clamped)
  })
  return null
}
