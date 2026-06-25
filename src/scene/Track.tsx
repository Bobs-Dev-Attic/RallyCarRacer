import { useMemo } from 'react'
import { RigidBody, CuboidCollider, TrimeshCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { buildRibbonGeometry, leftWall, rightWall } from './trackGeometry'
import { Trees } from './Trees'

/**
 * The drivable world: a large sand ground plane, a darker dirt track ribbon on
 * top, invisible boundary walls, and scattered forest props.
 */
export function Track() {
  const ribbon = useMemo(() => buildRibbonGeometry(), [])

  return (
    <group>
      {/* Ground: visual plane + a big thin fixed collider */}
      <RigidBody type="fixed" friction={1} colliders={false}>
        <CuboidCollider args={[200, 0.5, 200]} position={[0, -0.5, 0]} />
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#c2b280" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Track surface (visual only; the ground collider carries it) */}
      <mesh geometry={ribbon} receiveShadow>
        <meshStandardMaterial color="#6b4f3a" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Boundary walls */}
      <RigidBody type="fixed" friction={0.4} restitution={0.1} colliders={false}>
        <TrimeshCollider args={[leftWall.vertices, leftWall.indices]} />
        <TrimeshCollider args={[rightWall.vertices, rightWall.indices]} />
      </RigidBody>

      <Trees />
    </group>
  )
}
