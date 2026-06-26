import { createInput, type InputState } from '../types'

/**
 * Two independent input sources for the player car — the on-screen touch
 * controls and the desktop keyboard — each mutate their own slot. The car
 * reads a merged view so either source (or both) works at any time. Module
 * singletons let the DOM HUD overlay and the in-canvas car share state without
 * prop-drilling or React re-renders.
 */
export const touch: InputState = createInput()
export const keyboard: InputState = createInput()

const merged = createInput()

export function readPlayerInput(): InputState {
  // steering: take whichever source is pushing harder
  merged.steer = Math.abs(touch.steer) >= Math.abs(keyboard.steer) ? touch.steer : keyboard.steer
  merged.throttle = Math.max(touch.throttle, keyboard.throttle)
  merged.brake = Math.max(touch.brake, keyboard.brake)
  merged.reverse = touch.reverse || keyboard.reverse
  merged.handbrake = touch.handbrake || keyboard.handbrake
  return merged
}
