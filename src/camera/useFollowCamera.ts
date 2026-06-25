import { useFrame, useThree } from '@react-three/fiber'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import { damp } from '../utils/math'

const carPos = new THREE.Vector3()
const carQuat = new THREE.Quaternion()
const desired = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
const currentLook = new THREE.Vector3()
const fwd = new THREE.Vector3()

const CHASE_OFFSET = new THREE.Vector3(0, 5.5, -13)
const TOPDOWN_HEIGHT = 46

/** Chase / top-down follow camera with frame-rate independent smoothing. */
export function useFollowCamera(targetRef: React.RefObject<RapierRigidBody>) {
  const camera = useThree((s) => s.camera)
  const cameraMode = useGameStore((s) => s.cameraMode)

  useFrame((_, dtRaw) => {
    const body = targetRef.current
    if (!body) return
    const dt = Math.min(dtRaw, 0.05)

    const t = body.translation()
    carPos.set(t.x, t.y, t.z)
    const r = body.rotation()
    carQuat.set(r.x, r.y, r.z, r.w)
    fwd.set(0, 0, 1).applyQuaternion(carQuat).setY(0).normalize()

    if (cameraMode === 'chase') {
      desired.copy(CHASE_OFFSET).applyQuaternion(carQuat).add(carPos)
      // keep the camera from dipping below the car
      if (desired.y < carPos.y + 3) desired.y = carPos.y + 3
      camera.position.lerp(desired, 1 - Math.exp(-6 * dt))
      lookTarget.copy(carPos).addScaledVector(fwd, 6)
      lookTarget.y = carPos.y + 1.2
    } else {
      desired.set(carPos.x, TOPDOWN_HEIGHT, carPos.z - 0.001)
      camera.position.lerp(desired, 1 - Math.exp(-8 * dt))
      lookTarget.copy(carPos)
    }

    currentLook.lerp(lookTarget, 1 - Math.exp(-8 * dt))
    if (currentLook.lengthSq() === 0) currentLook.copy(lookTarget)
    camera.lookAt(currentLook)

    // subtle speed-based FOV punch (chase only)
    if (camera instanceof THREE.PerspectiveCamera) {
      const speed = Math.hypot(body.linvel().x, body.linvel().z)
      const targetFov = cameraMode === 'chase' ? 60 + Math.min(speed / 30, 1) * 12 : 55
      camera.fov = damp(camera.fov, targetFov, 4, dt)
      camera.updateProjectionMatrix()
    }
  })
}
