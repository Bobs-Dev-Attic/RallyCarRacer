# Rally Car Racer

A 3D mobile rally racing game — drive a rally car through a forest track with
real physics and gravity, on-screen touch controls, switchable 3rd-person /
top-down cameras, and AI opponents.

Built with **React Three Fiber** (Three.js) + **Rapier** physics, TypeScript and
Vite. Runs in any mobile browser and is wrappable for the app stores later.

## Play

```bash
npm install
npm run dev      # open the printed URL on a phone (same network) or desktop
```

- **Touch:** drag the left wheel to steer · **GAS / BRAKE / DRIFT** pedals on the right
- **Keyboard (desktop):** WASD / arrow keys to drive, **Space** for the handbrake/drift
- Tap **Chase / Top-down** to switch camera. Race **3 laps** against the AI.

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## How it works

| Area | Where |
| --- | --- |
| Vehicle physics (Rapier raycast vehicle) | `src/vehicle/useCarController.ts`, `carConfig.ts` |
| Touch + keyboard input (shared input ref) | `src/controls/` |
| Chase / top-down camera | `src/camera/useFollowCamera.ts` |
| Track, walls, trees, checkpoints | `src/scene/` |
| AI opponents (racing-line follower) | `src/ai/useAIController.ts` |
| Race state (laps, timing, standings) | `src/store/useGameStore.ts` |
| On-screen HUD + controls | `src/hud/` |

The track centerline is one closed Catmull-Rom curve (`src/scene/trackData.ts`);
the road ribbon, boundary walls, checkpoint gates and the AI racing line are all
derived from it so they stay in sync.

## Roadmap

Multiple tracks (sand / snow surfaces), engine + collision audio, more AI
tuning, online leaderboards, and a Capacitor wrapper for iOS/Android.
