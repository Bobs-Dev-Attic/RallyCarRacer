import { useRef } from 'react'
import { Physics } from '@react-three/rapier'
import { Track } from './Track'
import { Checkpoints } from './Checkpoints'
import { RaceDirector } from './RaceDirector'
import { PlayerCar } from '../vehicle/PlayerCar'
import { AICar } from '../vehicle/AICar'
import { CameraRig } from '../camera/CameraRig'
import type { CarHandle } from '../vehicle/Car'
import { gridSlot } from './trackData'

const DEBUG_PHYSICS = false

const OPPONENTS = [
  { id: 'ai-1', color: '#457b9d', skill: 0.92 },
  { id: 'ai-2', color: '#f4a261', skill: 0.84 },
  { id: 'ai-3', color: '#2a9d8f', skill: 0.88 },
]

export function Scene() {
  const playerRef = useRef<CarHandle>(null)
  const playerSlot = gridSlot(0)

  return (
    <>
      {/* sky + ground lighting */}
      <hemisphereLight args={['#bcd3ff', '#6b5b3a', 0.7]} />
      <directionalLight
        position={[40, 60, 20]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]} debug={DEBUG_PHYSICS}>
        <Track />
        <Checkpoints debug={DEBUG_PHYSICS} />

        <PlayerCar ref={playerRef} position={playerSlot.position} heading={playerSlot.heading} />

        {OPPONENTS.map((o, i) => {
          const slot = gridSlot(i + 1)
          return (
            <AICar
              key={o.id}
              id={o.id}
              position={slot.position}
              heading={slot.heading}
              color={o.color}
              skill={o.skill}
              startIndex={2}
            />
          )
        })}

        <RaceDirector />
      </Physics>

      <CameraRig playerRef={playerRef} />
    </>
  )
}
