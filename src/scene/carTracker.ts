/**
 * Lightweight live registry of car positions for the minimap. Cars write their
 * world XZ each frame; the minimap reads it from a rAF loop. Plain module state
 * avoids routing per-frame transforms through React.
 */
export interface CarBlip {
  x: number
  z: number
  color: string
  isPlayer: boolean
}

export const carBlips = new Map<string, CarBlip>()

export function registerBlip(id: string, color: string, isPlayer: boolean) {
  carBlips.set(id, { x: 0, z: 0, color, isPlayer })
}

export function updateBlip(id: string, x: number, z: number) {
  const b = carBlips.get(id)
  if (b) {
    b.x = x
    b.z = z
  }
}

export function removeBlip(id: string) {
  carBlips.delete(id)
}
