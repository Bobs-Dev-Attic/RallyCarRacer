import { useRef, useCallback } from 'react'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WAYPOINTS } from '../scene/trackData'
import { createInput, type InputState } from '../types'
import { clamp, angleDelta } from '../utils/math'
import { drive } from '../vehicle/carConfig'

// scratch objects reused every call — no per-frame allocation
const pos = new THREE.Vector3()
const quat = new THREE.Quaternion()
const toTarget = new THREE.Vector3()
const fwd = new THREE.Vector3()

const ARRIVE_RADIUS = 8
const LOOKAHEAD = 2 // waypoints ahead used to anticipate corners

export interface AIOptions {
  bodyRef: React.RefObject<RapierRigidBody>
  /** 0..1 skill: higher corners faster and steers more precisely */
  skill?: number
  /** start index offset so cars don't all chase the same point */
  startIndex?: number
}

/**
 * Produces an InputState for an AI car by steering toward the next point on the
 * racing line and modulating throttle/brake by the upcoming corner sharpness.
 * Deterministic and allocation-free in the hot path.
 */
export function useAIController({ bodyRef, skill = 0.85, startIndex = 0 }: AIOptions) {
  const input = useRef<InputState>(createInput())
  const wpIndex = useRef(startIndex % WAYPOINTS.length)
  const stuckTimer = useRef(0)
  const lastStep = useRef(0)

  const getInput = useCallback(() => {
    const body = bodyRef.current
    if (!body) return input.current

    const t = body.translation()
    pos.set(t.x, t.y, t.z)
    const r = body.rotation()
    quat.set(r.x, r.y, r.z, r.w)

    // advance the target waypoint once we're close enough
    let target = WAYPOINTS[wpIndex.current]
    if (pos.distanceTo(target) < ARRIVE_RADIUS) {
      wpIndex.current = (wpIndex.current + 1) % WAYPOINTS.length
      target = WAYPOINTS[wpIndex.current]
    }

    // heading error toward the target (in world XZ)
    toTarget.copy(target).sub(pos).setY(0)
    const targetHeading = Math.atan2(toTarget.x, toTarget.z)
    fwd.set(0, 0, 1).applyQuaternion(quat)
    const carHeading = Math.atan2(fwd.x, fwd.z)
    const err = angleDelta(carHeading, targetHeading)

    input.current.steer = clamp(err / drive.maxSteer, -1, 1)

    // corner anticipation: angle between this segment and the one a few ahead
    const ahead = WAYPOINTS[(wpIndex.current + LOOKAHEAD) % WAYPOINTS.length]
    const cornerAngle = Math.abs(angleDelta(carHeading, Math.atan2(ahead.x - pos.x, ahead.z - pos.z)))
    const corner01 = clamp(cornerAngle / (Math.PI * 0.6), 0, 1)

    // speed control via throttle/brake
    const vel = body.linvel()
    const speed = Math.hypot(vel.x, vel.z)
    const maxSpeed = 14 + skill * 14 // m/s
    const targetSpeed = THREE.MathUtils.lerp(maxSpeed, 5, corner01)

    if (speed < targetSpeed) {
      input.current.throttle = 1
      input.current.brake = 0
    } else if (speed > targetSpeed * 1.18) {
      input.current.throttle = 0
      input.current.brake = 0.6
    } else {
      input.current.throttle = 0.3
      input.current.brake = 0
    }
    // drift into very sharp corners
    input.current.handbrake = corner01 > 0.85 && speed > 10

    // stuck recovery: if barely moving for a while, reverse briefly
    const now = lastStep.current++
    if (speed < 1.5) stuckTimer.current += 1
    else stuckTimer.current = 0
    if (stuckTimer.current > 90) {
      input.current.throttle = 0
      input.current.brake = 1 // reverse (handled by controller when stopped)
      input.current.steer *= -1
      if (stuckTimer.current > 150) stuckTimer.current = 0
    }
    void now

    return input.current
  }, [bodyRef, skill])

  return { getInput, wpIndex }
}
