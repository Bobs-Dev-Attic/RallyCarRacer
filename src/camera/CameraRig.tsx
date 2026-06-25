import { useMemo } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import { useFollowCamera } from './useFollowCamera'
import type { CarHandle } from '../vehicle/Car'

/** Binds the follow camera to the player car's chassis rigid body. */
export function CameraRig({ playerRef }: { playerRef: React.RefObject<CarHandle> }) {
  const bodyRef = useMemo<React.RefObject<RapierRigidBody>>(
    () => ({
      get current() {
        return playerRef.current?.body.current ?? null
      },
    }),
    [playerRef],
  )
  useFollowCamera(bodyRef)
  return null
}
