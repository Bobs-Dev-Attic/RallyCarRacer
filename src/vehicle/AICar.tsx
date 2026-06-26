import { useMemo, useRef } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import { Car, type CarHandle } from './Car'
import { useRoamController } from '../ai/useAIController'

interface AICarProps {
  id: string
  position: [number, number, number]
  heading: number
  color: string
  skill: number
  seed: number
}

/** A computer-controlled car that wanders the desert. Same physics as the player. */
export function AICar({ id, position, heading, color, skill, seed }: AICarProps) {
  const ref = useRef<CarHandle>(null)

  // A stable ref-like view onto the (lazily mounted) chassis rigid body.
  const bodyRef = useMemo<React.RefObject<RapierRigidBody>>(
    () => ({
      get current() {
        return ref.current?.body.current ?? null
      },
    }),
    [],
  )

  const { getInput } = useRoamController({ bodyRef, skill, seed })

  return (
    <Car ref={ref} carId={id} position={position} heading={heading} color={color} getInput={getInput} />
  )
}
