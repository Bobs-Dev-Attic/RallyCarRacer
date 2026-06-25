import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Scene } from './scene/Scene'
import { HUD } from './hud/HUD'

const SKY = '#9fb4d8'

export default function App() {
  const [dpr, setDpr] = useState(1.5)

  return (
    <>
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 6, -14], fov: 60, near: 0.3, far: 400 }}
      >
        <color attach="background" args={[SKY]} />
        <fog attach="fog" args={[SKY, 70, 240]} />

        {/* drop resolution automatically if the framerate sags on weaker phones */}
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.5)}
        />
        <AdaptiveDpr pixelated />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <HUD />
    </>
  )
}
