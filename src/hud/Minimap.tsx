import { useEffect, useRef } from 'react'
import { CENTERLINE, START } from '../scene/trackData'
import { carBlips } from '../scene/carTracker'

const SIZE = 124
const PAD = 12

// Project world XZ into the minimap square once (track shape is static).
const xs = CENTERLINE.map((p) => p.x)
const zs = CENTERLINE.map((p) => p.z)
const minX = Math.min(...xs)
const maxX = Math.max(...xs)
const minZ = Math.min(...zs)
const maxZ = Math.max(...zs)
const spanX = maxX - minX
const spanZ = maxZ - minZ
const scale = (SIZE - PAD * 2) / Math.max(spanX, spanZ)
const offX = (SIZE - spanX * scale) / 2
const offZ = (SIZE - spanZ * scale) / 2
const toX = (x: number) => offX + (x - minX) * scale
const toY = (z: number) => offZ + (z - minZ) * scale

/** A live top-down minimap of the track with a dot per car. */
export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = SIZE * dpr
    cv.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      // track ribbon
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 7
      ctx.beginPath()
      for (let i = 0; i < CENTERLINE.length; i++) {
        const p = CENTERLINE[i]
        const X = toX(p.x)
        const Y = toY(p.z)
        if (i) ctx.lineTo(X, Y)
        else ctx.moveTo(X, Y)
      }
      ctx.closePath()
      ctx.stroke()

      // start/finish marker
      ctx.fillStyle = '#ffd166'
      ctx.beginPath()
      ctx.arc(toX(START.position.x), toY(START.position.z), 3, 0, Math.PI * 2)
      ctx.fill()

      // cars
      carBlips.forEach((b) => {
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(toX(b.x), toY(b.z), b.isPlayer ? 4.5 : 3, 0, Math.PI * 2)
        ctx.fill()
        if (b.isPlayer) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className="minimap" style={{ width: SIZE, height: SIZE }} />
}
