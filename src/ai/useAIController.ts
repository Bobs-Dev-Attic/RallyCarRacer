import { useRef, useCallback } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { HALF } from '../scene/desert'
import { createInput, type InputState } from '../types'
import { clamp, angleDelta } from '../utils/math'
import { drive } from '../vehicle/carConfig'

// scratch objects reused every call — no per-frame allocation
const pos = new THREE.Vector3()
const quat = new THREE.Quaternion()
const toTarget = new THREE.Vector3()
const fwd = new THREE.Vector3()

const ARRIVE_RADIUS = 12
const ROAM = HALF - 30 // keep wandering targets inside the desert

export interface RoamOptions {
  bodyRef: React.RefObject<RapierRigidBody>
  /** 0..1 skill: higher cruises faster */
  skill?: number
  seed?: number
}

/**
 * Drives an AI car to wander the open desert: pick a random destination, steer
 * toward it, slow for sharp heading changes, and on arrival pick a new one.
 */
export function useRoamController({ bodyRef, skill = 0.85, seed = 0 }: RoamOptions) {
  const input = useRef<InputState>(createInput())
  const target = useRef(new THREE.Vector3((((seed * 53) % 200) - 100), 0, (((seed * 97) % 200) - 100)))
  const stuckTimer = useRef(0)

  const pickTarget = () => {
    target.current.set((Math.random() - 0.5) * 2 * ROAM, 0, (Math.random() - 0.5) * 2 * ROAM)
  }

  const getInput = useCallback(() => {
    const body = bodyRef.current
    if (!body) return input.current

    const t = body.translation()
    pos.set(t.x, t.y, t.z)
    const r = body.rotation()
    quat.set(r.x, r.y, r.z, r.w)

    if (pos.distanceTo(target.current) < ARRIVE_RADIUS) pickTarget()

    // heading error toward the target (world XZ)
    toTarget.copy(target.current).sub(pos).setY(0)
    const targetHeading = Math.atan2(toTarget.x, toTarget.z)
    fwd.set(0, 0, 1).applyQuaternion(quat)
    const carHeading = Math.atan2(fwd.x, fwd.z)
    const err = angleDelta(carHeading, targetHeading)

    // controller's positive steer turns left, AI sign matches that convention
    input.current.steer = clamp(err / drive.maxSteer, -1, 1)

    // speed control: ease off when we need to turn hard
    const vel = body.linvel()
    const speed = Math.hypot(vel.x, vel.z)
    const turnSharp = Math.min(Math.abs(err) / 1.2, 1)
    const maxSpeed = 12 + skill * 12
    const targetSpeed = THREE.MathUtils.lerp(maxSpeed, 5, turnSharp)
    if (speed < targetSpeed) {
      input.current.throttle = 1
      input.current.brake = 0
    } else if (speed > targetSpeed * 1.2) {
      input.current.throttle = 0
      input.current.brake = 0.5
    } else {
      input.current.throttle = 0.35
      input.current.brake = 0
    }
    input.current.handbrake = false
    input.current.reverse = false

    // stuck recovery: hit a rock/ditch? back up, turn away, pick a new target
    if (speed < 1.5) stuckTimer.current += 1
    else stuckTimer.current = 0
    if (stuckTimer.current > 80) {
      input.current.throttle = 0
      input.current.brake = 0
      input.current.reverse = true
      input.current.steer *= -1
      if (stuckTimer.current > 150) {
        stuckTimer.current = 0
        pickTarget()
      }
    }

    return input.current
  }, [bodyRef, skill])

  return { getInput }
}
