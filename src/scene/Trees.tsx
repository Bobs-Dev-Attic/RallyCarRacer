import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import { scatterProps } from './trackGeometry'

/**
 * Lightweight instanced forest. Hundreds of trees draw in two instanced meshes
 * (trunks + canopies). Visual only — kept cheap for mobile.
 */
export function Trees() {
  const trees = useMemo(() => scatterProps(180, 7), [])

  return (
    <group>
      {/* trunks */}
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 2, 6]} />
        <meshStandardMaterial color="#5b4632" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 1, t.z]} scale={[t.scale, t.scale, t.scale]} />
        ))}
      </Instances>

      {/* canopies */}
      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.3, 3, 7]} />
        <meshStandardMaterial color="#2f6b3a" roughness={1} />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, 3.2 * t.scale, t.z]}
            scale={[t.scale, t.scale, t.scale]}
            rotation={[0, t.rot, 0]}
          />
        ))}
      </Instances>
    </group>
  )
}
