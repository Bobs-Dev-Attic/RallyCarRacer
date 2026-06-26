import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier, useBeforePhysicsStep, type RapierRigidBody } from '@react-three/rapier'
import type { DynamicRayCastVehicleController } from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Object3D } from 'three'
import type { InputState } from '../types'
import { useGameStore } from '../store/useGameStore'
import { DEFAULT_TUNING, type CarTuning } from '../store/useSettingsStore'
import { clamp, moveTowards } from '../utils/math'
import {
  chassis as chassisCfg,
  drive,
  wheel as wheelCfg,
  wheels as wheelCfgs,
  FRONT_LEFT,
  FRONT_RIGHT,
  REAR_LEFT,
  REAR_RIGHT,
} from './carConfig'

const DOWN = new THREE.Vector3(0, -1, 0)
const AXLE = new THREE.Vector3(-1, 0, 0)

// scratch objects for flip recovery (reused, no per-step allocation)
const recUp = new THREE.Vector3()
const recFwd = new THREE.Vector3()
const recQuat = new THREE.Quaternion()
const recUpright = new THREE.Quaternion()
const recEuler = new THREE.Euler()

export interface CarControllerOptions {
  chassisRef: React.RefObject<RapierRigidBody>
  wheelRefs: React.RefObject<Object3D>[]
  /** returns the latest control input each physics step */
  getInput: () => InputState
  /** returns the live car tuning each step (defaults to DEFAULT_TUNING) */
  getTuning?: () => CarTuning
  /** called every frame with current forward speed in km/h (optional) */
  onSpeed?: (kmh: number) => void
}

/**
 * Wraps Rapier's DynamicRayCastVehicleController: builds the four-wheel
 * raycast vehicle, drives it from an InputState each physics step, and writes
 * the resulting wheel transforms onto the visual wheel meshes each frame.
 */
export function useCarController({
  chassisRef,
  wheelRefs,
  getInput,
  getTuning,
  onSpeed,
}: CarControllerOptions) {
  const { world } = useRapier()
  const controllerRef = useRef<DynamicRayCastVehicleController | null>(null)
  const steerCurrent = useRef(0)
  const engineCurrent = useRef(0)
  const tipTimer = useRef(0)

  // Build the vehicle controller once the chassis rigid body exists.
  useEffect(() => {
    const body = chassisRef.current
    if (!body) return

    // Force a low center of mass with inflated roll/pitch inertia so the car
    // resists tipping. Overrides the collider-derived mass properties.
    body.setAdditionalMassProperties(
      chassisCfg.mass,
      chassisCfg.centerOfMass,
      chassisCfg.inertia,
      { x: 0, y: 0, z: 0, w: 1 },
      true,
    )

    const controller = world.createVehicleController(body)
    controller.indexUpAxis = 1 // Y is up
    // forward axis defaults to Z which matches our chassis orientation

    for (const w of wheelCfgs) {
      controller.addWheel(w.position, DOWN, AXLE, wheelCfg.suspensionRestLength, wheelCfg.radius)
    }
    for (let i = 0; i < wheelCfgs.length; i++) {
      controller.setWheelSuspensionStiffness(i, wheelCfg.suspensionStiffness)
      controller.setWheelMaxSuspensionTravel(i, wheelCfg.maxSuspensionTravel)
      controller.setWheelSuspensionCompression(i, wheelCfg.suspensionCompression)
      controller.setWheelSuspensionRelaxation(i, wheelCfg.suspensionRelaxation)
      controller.setWheelFrictionSlip(i, wheelCfgs[i].isFront ? wheelCfg.frictionFront : wheelCfg.frictionRear)
    }

    controllerRef.current = controller
    return () => {
      world.removeVehicleController(controller)
      controllerRef.current = null
    }
  }, [world, chassisRef, wheelRefs])

  // Drive the vehicle in lock-step with the fixed physics timestep.
  useBeforePhysicsStep(() => {
    const controller = controllerRef.current
    const body = chassisRef.current
    if (!controller || !body) return

    const input = getInput()
    const tuning = getTuning ? getTuning() : DEFAULT_TUNING
    const active = useGameStore.getState().phase === 'racing'
    const speed = controller.currentVehicleSpeed() // m/s, signed
    const speedKmh = Math.abs(speed) * 3.6

    // --- Apply live suspension tuning (cheap; lets the menu update in real time) ---
    for (let i = 0; i < wheelCfgs.length; i++) {
      controller.setWheelSuspensionStiffness(i, tuning.suspensionStiffness)
      controller.setWheelSuspensionCompression(i, tuning.suspensionDamping)
      controller.setWheelSuspensionRelaxation(i, tuning.suspensionDamping)
    }
    // front grip a touch higher than rear for a controllable rally oversteer
    controller.setWheelFrictionSlip(FRONT_LEFT, tuning.tireGrip * 1.05)
    controller.setWheelFrictionSlip(FRONT_RIGHT, tuning.tireGrip * 1.05)

    // --- Steering: speed-sensitive max angle, smoothed toward target ---
    // NOTE: the controller's positive steering angle turns the car left, so the
    // applied angle is negated to honour the InputState convention (+1 = right).
    const falloff = 1 - drive.steerSpeedFalloff * clamp(speedKmh / drive.steerFalloffSpeed, 0, 1)
    const targetSteer = (active ? input.steer : 0) * tuning.steering * falloff
    steerCurrent.current = moveTowards(
      steerCurrent.current,
      targetSteer,
      drive.steerRate * world.timestep,
    )
    controller.setWheelSteering(FRONT_LEFT, -steerCurrent.current)
    controller.setWheelSteering(FRONT_RIGHT, -steerCurrent.current)

    // --- Engine / brake (rear-wheel drive for a rally feel) ---
    let engine = 0
    let brake = 0
    if (active) {
      if (input.throttle > 0) {
        engine = input.throttle * tuning.enginePower
      }
      if (input.brake > 0) {
        brake = Math.max(brake, input.brake * drive.brakeForce)
      }
      if (input.reverse) {
        // brake to a stop first if still rolling forward, then drive backwards
        if (speed > 1.5) brake = Math.max(brake, drive.brakeForce)
        else engine = -drive.reverseForce
      }
    }
    // light engine braking / rolling resistance when coasting
    if (input.throttle === 0 && input.brake === 0) {
      brake += drive.rollingResistance
    }

    // ramp engine force in/out so a stab of throttle can't spike torque and
    // pitch the car over backwards on launch
    engineCurrent.current = moveTowards(
      engineCurrent.current,
      engine,
      drive.engineRamp * world.timestep,
    )
    controller.setWheelEngineForce(REAR_LEFT, engineCurrent.current)
    controller.setWheelEngineForce(REAR_RIGHT, engineCurrent.current)

    const handbraking = active && input.handbrake
    const rearBrake = handbraking ? brake + drive.handbrakeForce : brake
    controller.setWheelBrake(FRONT_LEFT, brake)
    controller.setWheelBrake(FRONT_RIGHT, brake)
    controller.setWheelBrake(REAR_LEFT, rearBrake)
    controller.setWheelBrake(REAR_RIGHT, rearBrake)

    // handbrake breaks rear traction for a controllable drift
    const rearGrip = handbraking ? wheelCfg.frictionHandbrake : tuning.tireGrip * 0.92
    controller.setWheelFrictionSlip(REAR_LEFT, rearGrip)
    controller.setWheelFrictionSlip(REAR_RIGHT, rearGrip)

    controller.updateVehicle(world.timestep)

    // Hard safety net: clamp angular speed so the car can never spin/flip out
    // of control even after a big collision or landing.
    const av = body.angvel()
    const avMag = Math.hypot(av.x, av.y, av.z)
    if (avMag > drive.maxAngVel) {
      const k = drive.maxAngVel / avMag
      body.setAngvel({ x: av.x * k, y: av.y * k, z: av.z * k }, true)
    }

    // --- Flip recovery: if the car has been on its side/roof for a moment,
    // right it in place, preserving its heading. ---
    const rot = body.rotation()
    recQuat.set(rot.x, rot.y, rot.z, rot.w)
    recUp.set(0, 1, 0).applyQuaternion(recQuat)
    if (recUp.y < drive.flipUpThreshold) {
      tipTimer.current += world.timestep
    } else {
      tipTimer.current = 0
    }
    if (tipTimer.current > drive.flipRecoverTime) {
      recFwd.set(0, 0, 1).applyQuaternion(recQuat)
      const yaw = Math.atan2(recFwd.x, recFwd.z)
      recUpright.setFromEuler(recEuler.set(0, yaw, 0))
      const t = body.translation()
      body.setTranslation({ x: t.x, y: t.y + 1.2, z: t.z }, true)
      body.setRotation({ x: recUpright.x, y: recUpright.y, z: recUpright.z, w: recUpright.w }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      const lv = body.linvel()
      body.setLinvel({ x: lv.x * 0.3, y: 0, z: lv.z * 0.3 }, true)
      steerCurrent.current = 0
      tipTimer.current = 0
    }
  })

  // Sync visual wheels and report speed each rendered frame.
  useFrame(() => {
    const controller = controllerRef.current
    if (!controller) return

    for (let i = 0; i < wheelRefs.length; i++) {
      const mesh = wheelRefs[i]?.current
      if (!mesh) continue
      const steering = controller.wheelSteering(i) ?? 0
      const rotation = controller.wheelRotation(i) ?? 0
      const suspension = controller.wheelSuspensionLength(i) ?? wheelCfg.suspensionRestLength
      const base = wheelCfgs[i].position
      // wheel hub sits at the suspension anchor extended downward by the
      // current suspension length, so the tyre meets the ground
      mesh.position.set(base.x, base.y - suspension, base.z)
      mesh.rotation.set(rotation, steering, 0, 'YXZ')
    }

    if (onSpeed) onSpeed(Math.abs(controller.currentVehicleSpeed()) * 3.6)
  })

  return { controllerRef, chassisCfg }
}
