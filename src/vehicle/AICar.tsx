import { useEffect, useMemo, useRef } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import { Car, type CarHandle } from './Car'
import { useAIController } from '../ai/useAIController'
import { useGameStore } from '../store/useGameStore'

interface AICarProps {
  id: string
  position: [number, number, number]
  heading: number
  color: string
  skill: number
  startIndex: number
}

/** A computer-controlled opponent. Reuses the same physics as the player. */
export function AICar({ id, position, heading, color, skill, startIndex }: AICarProps) {
  const ref = useRef<CarHandle>(null)
  const registerCar = useGameStore((s) => s.registerCar)

  // A stable ref-like view onto the (lazily mounted) chassis rigid body.
  const bodyRef = useMemo<React.RefObject<RapierRigidBody>>(
    () => ({
      get current() {
        return ref.current?.body.current ?? null
      },
    }),
    [],
  )

  const { getInput } = useAIController({ bodyRef, skill, startIndex })

  useEffect(() => {
    registerCar(id, false)
  }, [registerCar, id])

  return (
    <Car
      ref={ref}
      carId={id}
      position={position}
      heading={heading}
      color={color}
      getInput={getInput}
    />
  )
}
