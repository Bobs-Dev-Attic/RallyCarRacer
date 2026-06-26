import { useEffect, useRef } from 'react'
import { buildDesert, HALF } from '../scene/desert'
import { carBlips } from '../scene/carTracker'

const SIZE = 124
const PAD = 8
const scale = (SIZE - PAD * 2) / (HALF * 2)
const toPx = (world: number) => SIZE / 2 + world * scale

/** A live top-down minimap of the desert: obstacles as faint dots, a dot per car. */
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

    const desert = buildDesert()

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      // sand backdrop + border
      ctx.fillStyle = 'rgba(210,192,156,0.25)'
      ctx.fillRect(PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2)

      // rocks (obstacles)
      ctx.fillStyle = 'rgba(80,70,55,0.7)'
      for (const r of desert.rocks) {
        ctx.fillRect(toPx(r.x) - 1, toPx(r.z) - 1, 2, 2)
      }

      // cars
      carBlips.forEach((b) => {
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(toPx(b.x), toPx(b.z), b.isPlayer ? 4.5 : 3, 0, Math.PI * 2)
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
