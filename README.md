# Rally Car Racer

A 3D mobile rally driving game — roam an open desert of rolling dunes, bumps and
jumps with real physics and gravity, on-screen touch controls, switchable
3rd-person / top-down cameras, a live minimap, tire dust, and AI cars wandering
the sands.

Built with **React Three Fiber** (Three.js) + **Rapier** physics, TypeScript and
Vite. Runs in any mobile browser and is wrappable for the app stores later.

## Play

```bash
npm install
npm run dev      # open the printed URL on a phone (same network) or desktop
```

- **Touch:** drag the left wheel to steer · **GAS / BRAKE / REV** pedals on the right
- **Keyboard (desktop):** WASD / arrow keys to drive, **Space** for the handbrake/drift
- Tap **Chase / Top-down** to switch camera. **⚙ Tune Car** adjusts engine, suspension, grip, steering and center of gravity.
- Drive anywhere — just avoid the rocks, bushes and ditches.

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## How it works

| Area | Where |
| --- | --- |
| Vehicle physics (Rapier raycast vehicle) | `src/vehicle/useCarController.ts`, `carConfig.ts` |
| Procedural desert terrain (mesh + trimesh collider) + obstacles | `src/scene/desert.ts`, `Desert.tsx` |
| Tire dust particles | `src/vehicle/Dust.tsx` |
| Touch + keyboard input (shared input ref) | `src/controls/` |
| Chase / top-down camera | `src/camera/useFollowCamera.ts` |
| Roaming AI cars | `src/ai/useAIController.ts` |
| Car tuning (persisted) | `src/store/useSettingsStore.ts` |
| Game state + HUD/minimap | `src/store/useGameStore.ts`, `src/hud/` |

The desert is a single procedural grid: the same geometry is used for the visual
terrain and the physics trimesh, so what you see is exactly what you drive on.
Layered sine waves form the dunes, with gaussian humps for jumps and dips for
ditches.

## Roadmap

Surface variety (sand vs hardpack grip), engine + collision audio, jump/airtime
scoring, and a Capacitor wrapper for iOS/Android.
