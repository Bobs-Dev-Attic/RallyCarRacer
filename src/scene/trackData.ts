import * as THREE from 'three'

/**
 * The rally course is a single closed loop defined by a handful of control
 * points in the XZ plane. Everything else — the visual ribbon, the boundary
 * walls, the checkpoint gates and the AI racing line — is derived from this
 * one curve so they always stay in sync.
 */
const CONTROL_POINTS: [number, number][] = [
  [0, 40],
  [38, 32],
  [50, -4],
  [28, -40],
  [-8, -48],
  [-40, -30],
  [-52, 6],
  [-34, 40],
]

export const TRACK_WIDTH = 9 // half-width of the drivable ribbon

export const curve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true, // closed loop
  'catmullrom',
  0.5,
)

/** Densely sampled centerline points, evenly spaced along the curve. */
export const CENTERLINE: THREE.Vector3[] = curve.getSpacedPoints(220)

/** Tangent (forward) direction at each centerline sample. */
export const TANGENTS: THREE.Vector3[] = CENTERLINE.map((_, i) =>
  curve.getTangentAt(i / CENTERLINE.length).setY(0).normalize(),
)

export interface Checkpoint {
  index: number
  position: THREE.Vector3
  /** heading (radians) the car should be travelling through the gate */
  heading: number
}

/** Evenly spaced ordered gates around the loop; gate 0 is the start/finish. */
export const CHECKPOINTS: Checkpoint[] = (() => {
  const count = 12
  const out: Checkpoint[] = []
  for (let i = 0; i < count; i++) {
    const t = i / count
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    out.push({
      index: i,
      position: new THREE.Vector3(p.x, 0, p.z),
      heading: Math.atan2(tan.x, tan.z),
    })
  }
  return out
})()

export const START = CHECKPOINTS[0]

/** Racing line the AI follows — the centerline sampled a bit coarser. */
export const WAYPOINTS: THREE.Vector3[] = curve
  .getSpacedPoints(64)
  .map((p) => new THREE.Vector3(p.x, 0, p.z))

/**
 * A spawn pose just behind the start line, offset sideways so multiple cars
 * line up on a grid without overlapping.
 */
export function gridSlot(i: number): { position: [number, number, number]; heading: number } {
  // staggered 2-per-row grid behind the start line, with enough gap that the
  // (~4m long) cars never spawn overlapping each other.
  const row = Math.floor(i / 2)
  const t0 = -0.03 * (row + 1)
  const at = (1 + t0) % 1
  const p = curve.getPointAt(at)
  const tan = curve.getTangentAt(at)
  const heading = Math.atan2(tan.x, tan.z)
  const side = i % 2 === 0 ? -1 : 1
  const left = new THREE.Vector3(tan.z, 0, -tan.x).normalize()
  const pos = p.clone().addScaledVector(left, side * 3.5)
  return { position: [pos.x, 1.0, pos.z], heading }
}
