import { useRef } from 'react'
import { Physics } from '@react-three/rapier'
import { Desert } from './Desert'
import { PlayerCar } from '../vehicle/PlayerCar'
import { AICar } from '../vehicle/AICar'
import { Dust } from '../vehicle/Dust'
import { CameraRig } from '../camera/CameraRig'
import type { CarHandle } from '../vehicle/Car'
import { spawnSlot } from './desert'

const DEBUG_PHYSICS = false

const OPPONENTS = [
  { id: 'ai-1', color: '#457b9d', skill: 0.9, seed: 3 },
  { id: 'ai-2', color: '#f4a261', skill: 0.8, seed: 11 },
  { id: 'ai-3', color: '#9b5de5', skill: 0.86, seed: 19 },
]

export function Scene() {
  const playerRef = useRef<CarHandle>(null)
  const playerSlot = spawnSlot(0)

  return (
    <>
      {/* bright desert sun */}
      <hemisphereLight args={['#cfe0ff', '#caa777', 0.85]} />
      <directionalLight
        position={[60, 90, 30]}
        intensity={1.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
      />

      <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]} debug={DEBUG_PHYSICS}>
        <Desert />

        <PlayerCar ref={playerRef} position={playerSlot.position} heading={playerSlot.heading} />

        {OPPONENTS.map((o, i) => {
          const slot = spawnSlot(i + 1)
          return (
            <AICar
              key={o.id}
              id={o.id}
              position={slot.position}
              heading={slot.heading}
              color={o.color}
              skill={o.skill}
              seed={o.seed}
            />
          )
        })}

        <Dust playerRef={playerRef} />
      </Physics>

      <CameraRig playerRef={playerRef} />
    </>
  )
}
