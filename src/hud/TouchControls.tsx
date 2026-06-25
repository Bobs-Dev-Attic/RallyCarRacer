import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { touch } from '../controls/playerInput'
import { clamp } from '../utils/math'

const STEER_RADIUS = 55 // px of travel for full lock

/** setPointerCapture throws for synthetic/inactive pointers — never let it break input */
function capture(el: HTMLElement, id: number) {
  try {
    el.setPointerCapture(id)
  } catch {
    /* ignore */
  }
}

/**
 * On-screen touch controls: an analog steering pad (drag left/right) and
 * accelerator / brake / handbrake pedals. Each element handles its own pointer
 * so multi-touch (steer + accelerate together) works naturally. All input is
 * written into the shared `touch` slot — no React state in the hot path.
 */
export function TouchControls() {
  const knobRef = useRef<HTMLDivElement>(null)
  const steerPointer = useRef<number | null>(null)
  const startX = useRef(0)

  const onSteerDown = (e: ReactPointerEvent) => {
    steerPointer.current = e.pointerId
    startX.current = e.clientX
    capture(e.target as HTMLElement, e.pointerId)
  }
  const onSteerMove = (e: ReactPointerEvent) => {
    if (steerPointer.current !== e.pointerId) return
    const dx = e.clientX - startX.current
    const s = clamp(dx / STEER_RADIUS, -1, 1)
    touch.steer = s
    if (knobRef.current) knobRef.current.style.transform = `translateX(${s * 38}px)`
  }
  const onSteerUp = (e: ReactPointerEvent) => {
    if (steerPointer.current !== e.pointerId) return
    steerPointer.current = null
    touch.steer = 0
    if (knobRef.current) knobRef.current.style.transform = 'translateX(0px)'
  }

  const press = (
    set: () => void,
    clear: () => void,
  ): {
    onPointerDown: (e: ReactPointerEvent) => void
    onPointerUp: (e: ReactPointerEvent) => void
    onPointerCancel: (e: ReactPointerEvent) => void
    onPointerLeave: (e: ReactPointerEvent) => void
  } => ({
    onPointerDown: (e) => {
      capture(e.target as HTMLElement, e.pointerId)
      e.currentTarget.classList.add('pressed')
      set()
    },
    onPointerUp: (e) => {
      e.currentTarget.classList.remove('pressed')
      clear()
    },
    onPointerCancel: (e) => {
      e.currentTarget.classList.remove('pressed')
      clear()
    },
    onPointerLeave: () => {},
  })

  return (
    <div className="touch-layer">
      <div
        className="steer-pad"
        onPointerDown={onSteerDown}
        onPointerMove={onSteerMove}
        onPointerUp={onSteerUp}
        onPointerCancel={onSteerUp}
      >
        <div className="steer-knob" ref={knobRef} />
      </div>

      <div className="pedals">
        <button
          className="pedal hand"
          {...press(
            () => (touch.handbrake = true),
            () => (touch.handbrake = false),
          )}
        >
          DRIFT
        </button>
        <button
          className="pedal brake"
          {...press(
            () => (touch.brake = 1),
            () => (touch.brake = 0),
          )}
        >
          BRAKE
        </button>
        <button
          className="pedal gas"
          {...press(
            () => (touch.throttle = 1),
            () => (touch.throttle = 0),
          )}
        >
          GAS
        </button>
      </div>
    </div>
  )
}
