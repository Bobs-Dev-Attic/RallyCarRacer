import { useEffect } from 'react'
import { keyboard } from './playerInput'

/**
 * Desktop fallback controls (WASD / arrow keys + space handbrake). Writes into
 * the shared keyboard input slot so the physics loop can poll it without
 * triggering React re-renders.
 */
export function useKeyboardInput() {
  useEffect(() => {
    const keys: Record<string, boolean> = {}
    const down = (e: KeyboardEvent) => {
      keys[e.code] = true
      if (e.code === 'Space') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      keys[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    let raf = 0
    const poll = () => {
      const left = keys['ArrowLeft'] || keys['KeyA']
      const right = keys['ArrowRight'] || keys['KeyD']
      const fwd = keys['ArrowUp'] || keys['KeyW']
      const back = keys['ArrowDown'] || keys['KeyS']
      keyboard.steer = (left ? -1 : 0) + (right ? 1 : 0)
      keyboard.throttle = fwd ? 1 : 0
      keyboard.brake = 0
      keyboard.reverse = back // brakes then reverses (handled in the controller)
      keyboard.handbrake = !!keys['Space']
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf)
    }
  }, [])
}
