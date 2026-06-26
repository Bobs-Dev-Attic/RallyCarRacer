import * as THREE from 'three'

/**
 * All the knobs that define how the rally car feels. Tuned for a grippy car
 * that breaks into a controllable drift under power / handbrake.
 */
export interface WheelInfo {
  /** chassis-local anchor point of the suspension */
  position: THREE.Vector3
  isFront: boolean
}

export const chassis = {
  /** half-extents of the chassis collider */
  halfExtents: new THREE.Vector3(0.9, 0.35, 1.9),
  mass: 850,
  /**
   * Principal angular inertia. Roll (z) and pitch (x) are inflated well above
   * the physical box values so the car strongly resists flipping; yaw (y) is
   * left moderate so steering stays responsive. (Center of mass height is
   * driven by the tunable "stability" setting — see cgFromStability.)
   */
  inertia: new THREE.Vector3(2200, 1300, 1600),
}

const wheelY = -0.25
const wheelX = 0.85
const wheelZFront = 1.35
const wheelZRear = -1.25

export const wheels: WheelInfo[] = [
  { position: new THREE.Vector3(-wheelX, wheelY, wheelZFront), isFront: true },
  { position: new THREE.Vector3(wheelX, wheelY, wheelZFront), isFront: true },
  { position: new THREE.Vector3(-wheelX, wheelY, wheelZRear), isFront: false },
  { position: new THREE.Vector3(wheelX, wheelY, wheelZRear), isFront: false },
]

export const FRONT_LEFT = 0
export const FRONT_RIGHT = 1
export const REAR_LEFT = 2
export const REAR_RIGHT = 3

export const wheel = {
  radius: 0.4,
  suspensionRestLength: 0.45,
  suspensionStiffness: 28,
  maxSuspensionTravel: 0.3,
  suspensionCompression: 0.85,
  suspensionRelaxation: 0.9,
  frictionFront: 2.4,
  frictionRear: 2.0,
  /** rear grip while handbraking — low value breaks traction for drift */
  frictionHandbrake: 0.55,
}

export const drive = {
  engineForce: 6000,
  reverseForce: 3000,
  brakeForce: 90,
  handbrakeForce: 120,
  /** how fast engine force ramps in (N/s) — softens the launch torque spike */
  engineRamp: 26000,
  /** light engine braking when coasting */
  rollingResistance: 8,
  maxSteer: 0.55, // radians at standstill
  /** steering is reduced at speed for stability */
  steerSpeedFalloff: 0.6,
  steerRate: 5, // how fast the wheels turn toward the target angle
  /** km/h cap used only for the speed-sensitive steering curve */
  steerFalloffSpeed: 45,
  /** hard safety cap on angular speed (rad/s) so the car can never flip out */
  maxAngVel: 3.2,
  /** car is considered tipped when its up-vector Y falls below this */
  flipUpThreshold: 0.45,
  /** seconds tipped before the car auto-rights itself */
  flipRecoverTime: 1.0,
}
