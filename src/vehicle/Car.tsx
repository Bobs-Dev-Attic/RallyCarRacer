import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Object3D } from 'three'
import { useCarController } from './useCarController'
import { chassis as chassisCfg, wheels as wheelCfgs, wheel as wheelCfg } from './carConfig'
import type { InputState } from '../types'
import type { CarTuning } from '../store/useSettingsStore'
import { registerBlip, updateBlip, removeBlip } from '../scene/carTracker'

export interface CarHandle {
  body: React.RefObject<RapierRigidBody>
}

interface CarProps {
  carId: string
  position: [number, number, number]
  heading: number
  color: string
  getInput: () => InputState
  getTuning?: () => CarTuning
  onSpeed?: (kmh: number) => void
}

const wheelGeo = new THREE.CylinderGeometry(wheelCfg.radius, wheelCfg.radius, 0.3, 16)
const wheelMat = new THREE.MeshStandardMaterial({ color: '#15151a', roughness: 0.8 })

/**
 * A drivable rally car: a dynamic chassis rigid body with a manual cuboid
 * collider (wheels are visual only), driven by the shared vehicle controller.
 */
export const Car = forwardRef<CarHandle, CarProps>(function Car(
  { carId, position, heading, color, getInput, getTuning, onSpeed },
  ref,
) {
  const body = useRef<RapierRigidBody>(null)
  const wheelRefs = useRef(wheelCfgs.map(() => ({ current: null as Object3D | null })))

  useImperativeHandle(ref, () => ({ body }), [])

  useCarController({ chassisRef: body, wheelRefs: wheelRefs.current, getInput, getTuning, onSpeed })

  // feed the minimap
  const isPlayer = carId === 'player'
  useEffect(() => {
    registerBlip(carId, color, isPlayer)
    return () => removeBlip(carId)
  }, [carId, color, isPlayer])
  useFrame(() => {
    const t = body.current?.translation()
    if (t) updateBlip(carId, t.x, t.z)
  })

  const he = chassisCfg.halfExtents

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={position}
      rotation={[0, heading, 0]}
      mass={chassisCfg.mass}
      linearDamping={0.05}
      angularDamping={0.6}
      canSleep={false}
      userData={{ carId }}
      ccd
    >
      {/* collision box around the chassis; the low center of mass is set
          separately on the rigid body in useCarController */}
      <CuboidCollider args={[he.x, he.y, he.z]} position={[0, 0, 0]} />

      {/* body shell */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[he.x * 2, he.y * 1.6, he.z * 2]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* cabin */}
      <mesh castShadow position={[0, 0.55, -0.1]}>
        <boxGeometry args={[he.x * 1.6, he.y * 1.2, he.z * 1.0]} />
        <meshStandardMaterial color="#222" metalness={0.2} roughness={0.4} />
      </mesh>

      {/* visual wheels — positions written each frame by the controller */}
      {wheelCfgs.map((w, i) => (
        <group
          key={i}
          ref={(o) => (wheelRefs.current[i].current = o)}
          position={[w.position.x, w.position.y, w.position.z]}
        >
          <mesh
            geometry={wheelGeo}
            material={wheelMat}
            castShadow
            rotation={[0, 0, Math.PI / 2]}
          />
        </group>
      ))}
    </RigidBody>
  )
})
