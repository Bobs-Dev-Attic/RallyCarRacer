import { forwardRef, useCallback, useEffect, useRef, useImperativeHandle } from 'react'
import { Car, type CarHandle } from './Car'
import { readPlayerInput } from '../controls/playerInput'
import { useKeyboardInput } from '../controls/useKeyboardInput'
import { useGameStore } from '../store/useGameStore'

const PLAYER_ID = 'player'

interface PlayerCarProps {
  position: [number, number, number]
  heading: number
}

/** The human-driven car. Merges touch + keyboard input and feeds the HUD speed. */
export const PlayerCar = forwardRef<CarHandle, PlayerCarProps>(function PlayerCar(
  { position, heading },
  ref,
) {
  const carRef = useRef<CarHandle>(null)
  useImperativeHandle(ref, () => carRef.current as CarHandle, [])
  useKeyboardInput()
  const registerCar = useGameStore((s) => s.registerCar)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const lastSpeedPush = useRef(0)

  useEffect(() => {
    registerCar(PLAYER_ID, true)
  }, [registerCar])

  // throttle HUD speed updates to ~10Hz to avoid thrashing React
  const onSpeed = useCallback(
    (kmh: number) => {
      const now = performance.now()
      if (now - lastSpeedPush.current > 100) {
        lastSpeedPush.current = now
        setSpeed(kmh)
      }
    },
    [setSpeed],
  )

  return (
    <Car
      ref={carRef}
      carId={PLAYER_ID}
      position={position}
      heading={heading}
      color="#e63946"
      getInput={readPlayerInput}
      onSpeed={onSpeed}
    />
  )
})

export { PLAYER_ID }
