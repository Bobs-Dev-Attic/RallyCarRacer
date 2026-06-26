import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarHandle } from './Car'
import { readPlayerInput } from '../controls/playerInput'
import { useGameStore } from '../store/useGameStore'
import { terrainHeight } from '../scene/desert'

const POOL = 80
const dummy = new THREE.Object3D()
const fwd = new THREE.Vector3()
const quat = new THREE.Quaternion()
const left = new THREE.Vector3()

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  size: number
}

const newParticle = (): Particle => ({ x: 0, y: -1000, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1 })

/** Dust kicked up behind the player's rear tyres while accelerating on the ground. */
export function Dust({ playerRef }: { playerRef: React.RefObject<CarHandle> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const pool = useRef<Particle[]>(Array.from({ length: POOL }, newParticle))
  const cursor = useRef(0)

  useFrame((_, dtRaw) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dt = Math.min(dtRaw, 0.05)
    const body = playerRef.current?.body.current

    // emit from the rear wheels when on the gas and moving
    if (body && useGameStore.getState().phase === 'racing') {
      const inp = readPlayerInput()
      const lv = body.linvel()
      const speed = Math.hypot(lv.x, lv.z)
      if (inp.throttle > 0.15 && speed > 3) {
        const t = body.translation()
        const r = body.rotation()
        quat.set(r.x, r.y, r.z, r.w)
        fwd.set(0, 0, 1).applyQuaternion(quat).setY(0).normalize()
        left.set(fwd.z, 0, -fwd.x)
        for (let k = 0; k < 2; k++) {
          const side = (k % 2 === 0 ? 1 : -1) * 0.85
          const px = t.x - fwd.x * 1.6 + left.x * side
          const pz = t.z - fwd.z * 1.6 + left.z * side
          const p = pool.current[cursor.current]
          cursor.current = (cursor.current + 1) % POOL
          p.x = px
          p.y = terrainHeight(px, pz) + 0.25
          p.z = pz
          p.vx = -fwd.x * 2 + (Math.random() - 0.5) * 1.5
          p.vz = -fwd.z * 2 + (Math.random() - 0.5) * 1.5
          p.vy = 1.2 + Math.random() * 1.3
          p.max = 0.6 + Math.random() * 0.4
          p.life = p.max
          p.size = 0.5 + Math.random() * 0.6
        }
      }
    }

    // integrate + write instance matrices
    for (let i = 0; i < POOL; i++) {
      const p = pool.current[i]
      if (p.life > 0) {
        p.life -= dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.z += p.vz * dt
        p.vy -= 1.5 * dt
        p.vx *= 0.96
        p.vz *= 0.96
      }
      const f = p.max > 0 ? p.life / p.max : 0 // 1 at birth -> 0 at death
      const grow = 0.4 + 0.9 * (1 - f)
      const fade = Math.min(1, p.life * 3)
      const sc = p.life > 0 ? p.size * grow * fade : 0
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, POOL]} frustumCulled={false}>
      <icosahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#d8c39a" transparent opacity={0.5} depthWrite={false} roughness={1} />
    </instancedMesh>
  )
}
