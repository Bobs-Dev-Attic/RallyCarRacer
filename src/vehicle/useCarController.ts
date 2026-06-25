import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier, useBeforePhysicsStep, type RapierRigidBody } from '@react-three/rapier'
import type { DynamicRayCastVehicleController } from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Object3D } from 'three'
import type { InputState } from '../types'
import { useGameStore } from '../store/useGameStore'
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

export interface CarControllerOptions {
  chassisRef: React.RefObject<RapierRigidBody>
  wheelRefs: React.RefObject<Object3D>[]
  /** returns the latest control input each physics step */
  getInput: () => InputState
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
  onSpeed,
}: CarControllerOptions) {
  const { world } = useRapier()
  const controllerRef = useRef<DynamicRayCastVehicleController | null>(null)
  const steerCurrent = useRef(0)

  // Build the vehicle controller once the chassis rigid body exists.
  useEffect(() => {
    const body = chassisRef.current
    if (!body) return

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
    const active = useGameStore.getState().phase === 'racing'
    const speed = controller.currentVehicleSpeed() // m/s, signed
    const speedKmh = Math.abs(speed) * 3.6

    // --- Steering: speed-sensitive max angle, smoothed toward target ---
    const falloff = 1 - drive.steerSpeedFalloff * clamp(speedKmh / drive.steerFalloffSpeed, 0, 1)
    const targetSteer = (active ? input.steer : 0) * drive.maxSteer * falloff
    steerCurrent.current = moveTowards(
      steerCurrent.current,
      targetSteer,
      drive.steerRate * world.timestep,
    )
    controller.setWheelSteering(FRONT_LEFT, steerCurrent.current)
    controller.setWheelSteering(FRONT_RIGHT, steerCurrent.current)

    // --- Engine / brake (rear-wheel drive for a rally feel) ---
    let engine = 0
    let brake = 0
    if (active) {
      if (input.throttle > 0) {
        engine = input.throttle * drive.engineForce
      }
      if (input.brake > 0) {
        // brake when moving forward, otherwise drive in reverse
        if (speed > 1) brake = input.brake * drive.brakeForce
        else engine = -input.brake * drive.reverseForce
      }
    }
    // light engine braking / rolling resistance when coasting
    if (input.throttle === 0 && input.brake === 0) {
      brake += drive.rollingResistance
    }

    controller.setWheelEngineForce(REAR_LEFT, engine)
    controller.setWheelEngineForce(REAR_RIGHT, engine)

    const handbraking = active && input.handbrake
    const rearBrake = handbraking ? brake + drive.handbrakeForce : brake
    controller.setWheelBrake(FRONT_LEFT, brake)
    controller.setWheelBrake(FRONT_RIGHT, brake)
    controller.setWheelBrake(REAR_LEFT, rearBrake)
    controller.setWheelBrake(REAR_RIGHT, rearBrake)

    // handbrake breaks rear traction for a controllable drift
    const rearGrip = handbraking ? wheelCfg.frictionHandbrake : wheelCfg.frictionRear
    controller.setWheelFrictionSlip(REAR_LEFT, rearGrip)
    controller.setWheelFrictionSlip(REAR_RIGHT, rearGrip)

    controller.updateVehicle(world.timestep)
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
      mesh.position.set(base.x, base.y - suspension + wheelCfg.suspensionRestLength, base.z)
      mesh.rotation.set(rotation, steering, 0, 'YXZ')
    }

    if (onSpeed) onSpeed(Math.abs(controller.currentVehicleSpeed()) * 3.6)
  })

  return { controllerRef, chassisCfg }
}
