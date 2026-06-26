import { useMemo } from 'react'
import { RigidBody, TrimeshCollider, BallCollider } from '@react-three/rapier'
import { Instances, Instance } from '@react-three/drei'
import { buildDesert } from './desert'

/**
 * The open desert: one procedural terrain mesh (also used as the trimesh
 * collider so visuals and physics match exactly), plus scattered rock and bush
 * obstacles. All obstacle colliders share a single fixed body.
 */
export function Desert() {
  const d = useMemo(() => buildDesert(), [])

  return (
    <group>
      {/* terrain */}
      <RigidBody type="fixed" colliders={false} friction={1.1}>
        <mesh geometry={d.geometry} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} metalness={0} />
        </mesh>
        <TrimeshCollider args={[d.vertices, d.indices]} />
      </RigidBody>

      {/* rock visuals */}
      <Instances limit={d.rocks.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a7a66" roughness={1} flatShading />
        {d.rocks.map((r, i) => (
          <Instance
            key={i}
            position={[r.x, r.y + r.scale * 0.4, r.z]}
            scale={r.scale}
            rotation={[r.rot * 0.3, r.rot, r.rot * 0.2]}
          />
        ))}
      </Instances>

      {/* bush visuals */}
      <Instances limit={d.bushes.length} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5b7a3a" roughness={1} flatShading />
        {d.bushes.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, b.y + b.scale * 0.5, b.z]}
            scale={[b.scale, b.scale * 0.8, b.scale]}
            rotation={[0, b.rot, 0]}
          />
        ))}
      </Instances>

      {/* all obstacle colliders on a single static body */}
      <RigidBody type="fixed" colliders={false} friction={0.8}>
        {d.rocks.map((r, i) => (
          <BallCollider key={'r' + i} args={[r.scale * 0.85]} position={[r.x, r.y + r.scale * 0.4, r.z]} />
        ))}
        {d.bushes.map((b, i) => (
          <BallCollider key={'b' + i} args={[b.scale * 0.6]} position={[b.x, b.y + b.scale * 0.5, b.z]} />
        ))}
      </RigidBody>
    </group>
  )
}
