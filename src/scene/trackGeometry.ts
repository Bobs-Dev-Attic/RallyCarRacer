import * as THREE from 'three'
import { CENTERLINE, TANGENTS, TRACK_WIDTH } from './trackData'

const WALL_HEIGHT = 1.6
const WALL_MARGIN = 1.5 // walls sit just outside the drivable ribbon

function leftOf(i: number) {
  const t = TANGENTS[i]
  // left-hand perpendicular in XZ
  return new THREE.Vector3(t.z, 0, -t.x).normalize()
}

/** Visual road surface: a closed triangle ribbon following the centerline. */
export function buildRibbonGeometry(): THREE.BufferGeometry {
  const n = CENTERLINE.length
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i < n; i++) {
    const p = CENTERLINE[i]
    const l = leftOf(i)
    const left = p.clone().addScaledVector(l, TRACK_WIDTH)
    const right = p.clone().addScaledVector(l, -TRACK_WIDTH)
    positions.push(left.x, 0.02, left.z)
    positions.push(right.x, 0.02, right.z)
    const v = i / n
    uvs.push(0, v * 40, 1, v * 40)
  }
  for (let i = 0; i < n; i++) {
    const a = (i * 2) % (n * 2)
    const b = (i * 2 + 1) % (n * 2)
    const c = ((i + 1) * 2) % (n * 2)
    const d = ((i + 1) * 2 + 1) % (n * 2)
    indices.push(a, c, b, b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** Build a vertical wall trimesh along one edge of the track (closed loop). */
function buildWall(side: 1 | -1): { vertices: Float32Array; indices: Uint32Array } {
  const n = CENTERLINE.length
  const verts: number[] = []
  const idx: number[] = []
  const offset = side * (TRACK_WIDTH + WALL_MARGIN)

  for (let i = 0; i < n; i++) {
    const p = CENTERLINE[i]
    const l = leftOf(i)
    const base = p.clone().addScaledVector(l, offset)
    verts.push(base.x, 0, base.z) // bottom
    verts.push(base.x, WALL_HEIGHT, base.z) // top
  }
  for (let i = 0; i < n; i++) {
    const b0 = (i * 2) % (n * 2)
    const t0 = (i * 2 + 1) % (n * 2)
    const b1 = ((i + 1) * 2) % (n * 2)
    const t1 = ((i + 1) * 2 + 1) % (n * 2)
    // two triangles, both windings so the wall collides from either face
    idx.push(b0, t0, b1, t0, t1, b1)
  }
  return { vertices: new Float32Array(verts), indices: new Uint32Array(idx) }
}

export const leftWall = buildWall(1)
export const rightWall = buildWall(-1)

/** Scatter positions for trees / rocks just outside the walls. */
export function scatterProps(count: number, seedStep: number) {
  const out: { x: number; z: number; scale: number; rot: number }[] = []
  const n = CENTERLINE.length
  for (let k = 0; k < count; k++) {
    const i = (k * seedStep) % n
    const p = CENTERLINE[i]
    const l = leftOf(i)
    const side = k % 2 === 0 ? 1 : -1
    // pseudo-random but deterministic spread
    const dist = TRACK_WIDTH + 4 + ((k * 7.13) % 22)
    const along = ((k * 3.7) % 6) - 3
    const t = TANGENTS[i]
    const pos = p
      .clone()
      .addScaledVector(l, side * dist)
      .addScaledVector(t, along)
    out.push({ x: pos.x, z: pos.z, scale: 0.8 + ((k * 1.31) % 1.4), rot: (k * 0.9) % (Math.PI * 2) })
  }
  return out
}
