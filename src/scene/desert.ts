import * as THREE from 'three'

/**
 * Procedural open desert. The same grid geometry is used for the visual mesh
 * and a trimesh collider, so what you see is exactly what you drive on.
 */
export const SIZE = 320 // world units across
export const HALF = SIZE / 2
const SEG = 80 // grid cells per side

// deterministic PRNG so terrain + obstacles are stable across reloads
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Large jumps (positive humps) and ditches (negative dips) scattered around.
interface Feature {
  x: number
  z: number
  s: number // spread
  h: number // height (negative = ditch)
}
const FEATURES: Feature[] = [
  { x: 40, z: 30, s: 8, h: 6.5 }, // ramp / jump
  { x: -55, z: 60, s: 9, h: 7 },
  { x: 70, z: -50, s: 7, h: 6 },
  { x: -40, z: -70, s: 10, h: 7.5 },
  { x: 95, z: 80, s: 9, h: 6.5 },
  { x: -100, z: -20, s: 11, h: 8 },
  { x: 20, z: 95, s: 7, h: 5.5 },
  { x: 25, z: -25, s: 5, h: -4 }, // ditch
  { x: -30, z: 35, s: 6, h: -4.5 },
  { x: 60, z: 10, s: 5, h: -3.5 },
  { x: -75, z: -45, s: 6, h: -4 },
]

/** Terrain height at a world XZ. */
export function terrainHeight(x: number, z: number): number {
  let h =
    Math.sin(x * 0.035) * 2.4 +
    Math.cos(z * 0.04) * 2.2 +
    Math.sin(x * 0.09 + z * 0.06) * 1.2 +
    Math.sin(x * 0.19) * Math.cos(z * 0.17) * 0.55

  for (const f of FEATURES) {
    const d2 = (x - f.x) * (x - f.x) + (z - f.z) * (z - f.z)
    h += f.h * Math.exp(-d2 / (2 * f.s * f.s))
  }

  // flatten a calm spawn pad in the middle
  const d = Math.hypot(x, z)
  const flat = Math.min(Math.max((d - 9) / 13, 0), 1)
  return h * flat
}

export interface Prop {
  x: number
  y: number
  z: number
  scale: number
  rot: number
}

export interface Desert {
  geometry: THREE.BufferGeometry
  vertices: Float32Array
  indices: Uint32Array
  rocks: Prop[]
  bushes: Prop[]
  spawn: { x: number; y: number; z: number }
}

let cached: Desert | null = null

export function buildDesert(): Desert {
  if (cached) return cached

  const verts = new Float32Array((SEG + 1) * (SEG + 1) * 3)
  const colors = new Float32Array((SEG + 1) * (SEG + 1) * 3)
  const uvs = new Float32Array((SEG + 1) * (SEG + 1) * 2)
  const sandLow = new THREE.Color('#b08d57')
  const sandHigh = new THREE.Color('#e3c690')

  let p = 0
  let c = 0
  let u = 0
  for (let j = 0; j <= SEG; j++) {
    for (let i = 0; i <= SEG; i++) {
      const x = (i / SEG - 0.5) * SIZE
      const z = (j / SEG - 0.5) * SIZE
      const y = terrainHeight(x, z)
      verts[p] = x
      verts[p + 1] = y
      verts[p + 2] = z
      p += 3
      const t = Math.min(Math.max((y + 4) / 12, 0), 1)
      const col = sandLow.clone().lerp(sandHigh, t)
      colors[c] = col.r
      colors[c + 1] = col.g
      colors[c + 2] = col.b
      c += 3
      uvs[u] = i / SEG
      uvs[u + 1] = j / SEG
      u += 2
    }
  }

  const indices = new Uint32Array(SEG * SEG * 6)
  let n = 0
  const row = SEG + 1
  for (let j = 0; j < SEG; j++) {
    for (let i = 0; i < SEG; i++) {
      const a = j * row + i
      const b = a + 1
      const cc = a + row
      const d = cc + 1
      indices[n++] = a
      indices[n++] = cc
      indices[n++] = b
      indices[n++] = b
      indices[n++] = cc
      indices[n++] = d
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()

  // scatter obstacles on the surface, clear of the spawn pad
  const rnd = mulberry32(1337)
  const rocks: Prop[] = []
  const bushes: Prop[] = []
  const place = (count: number, out: Prop[], minScale: number, maxScale: number) => {
    let placed = 0
    let guard = 0
    while (placed < count && guard < count * 20) {
      guard++
      const x = (rnd() - 0.5) * (SIZE - 30)
      const z = (rnd() - 0.5) * (SIZE - 30)
      if (Math.hypot(x, z) < 22) continue // keep spawn pad clear
      out.push({
        x,
        y: terrainHeight(x, z),
        z,
        scale: minScale + rnd() * (maxScale - minScale),
        rot: rnd() * Math.PI * 2,
      })
      placed++
    }
  }
  place(46, rocks, 1.1, 3.2)
  place(70, bushes, 0.7, 1.6)

  cached = {
    geometry,
    vertices: verts,
    indices,
    rocks,
    bushes,
    spawn: { x: 0, y: terrainHeight(0, 0) + 1.2, z: 0 },
  }
  return cached
}

/** A spawn pose offset from the center pad so multiple cars don't overlap. */
export function spawnSlot(i: number): { position: [number, number, number]; heading: number } {
  const angle = (i / 5) * Math.PI * 2
  const r = i === 0 ? 0 : 9
  const x = Math.cos(angle) * r
  const z = Math.sin(angle) * r
  return { position: [x, terrainHeight(x, z) + 1.2, z], heading: angle + Math.PI }
}
