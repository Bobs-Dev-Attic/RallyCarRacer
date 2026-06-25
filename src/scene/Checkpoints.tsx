import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { CHECKPOINTS, TRACK_WIDTH } from './trackData'
import { useGameStore } from '../store/useGameStore'

const GATE_HEIGHT = 4

/**
 * Ordered sensor gates across the track. When any car passes a gate, the store
 * validates that it was the next expected checkpoint (no shortcutting) and
 * advances that car's lap progress.
 */
export function Checkpoints({ debug = false }: { debug?: boolean }) {
  const passCheckpoint = useGameStore((s) => s.passCheckpoint)

  return (
    <group>
      {CHECKPOINTS.map((cp) => (
        <RigidBody key={cp.index} type="fixed" colliders={false} sensor>
          <CuboidCollider
            args={[TRACK_WIDTH, GATE_HEIGHT, 0.6]}
            position={[cp.position.x, GATE_HEIGHT, cp.position.z]}
            rotation={[0, cp.heading, 0]}
            sensor
            onIntersectionEnter={(payload) => {
              const data = payload.other.rigidBodyObject?.userData as
                | { carId?: string }
                | undefined
              if (data?.carId) passCheckpoint(data.carId, cp.index)
            }}
          />
          {debug && (
            <mesh position={[cp.position.x, 1, cp.position.z]} rotation={[0, cp.heading, 0]}>
              <boxGeometry args={[TRACK_WIDTH * 2, 0.1, 0.4]} />
              <meshBasicMaterial color={cp.index === 0 ? '#ffd166' : '#4cc9f0'} />
            </mesh>
          )}
        </RigidBody>
      ))}
      {/* start/finish line marker */}
      <mesh
        position={[CHECKPOINTS[0].position.x, 0.05, CHECKPOINTS[0].position.z]}
        rotation={[-Math.PI / 2, 0, CHECKPOINTS[0].heading]}
      >
        <planeGeometry args={[TRACK_WIDTH * 2, 1.5]} />
        <meshStandardMaterial color="#f1f1f1" />
      </mesh>
    </group>
  )
}
