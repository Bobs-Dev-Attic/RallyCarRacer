export const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Frame-rate independent smoothing. `rate` is roughly "how fast" — higher
 * snaps quicker. Equivalent to an exponential decay toward `target`.
 */
export const damp = (current: number, target: number, rate: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-rate * dt))

export const moveTowards = (current: number, target: number, maxDelta: number) => {
  const d = target - current
  if (Math.abs(d) <= maxDelta) return target
  return current + Math.sign(d) * maxDelta
}

/** shortest signed angle difference in radians, wrapped to [-PI, PI] */
export const angleDelta = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}
