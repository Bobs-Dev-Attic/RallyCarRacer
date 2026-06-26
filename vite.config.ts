import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// Short commit SHA on Vercel, otherwise a local build timestamp, so the
// in-game version tag always tells you exactly which build you're looking at.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(sha || `local ${buildTime}`),
  },
  // The Rapier physics engine ships as a WASM module; excluding it from the
  // dev-server pre-bundle avoids the optimizer choking on the .wasm import.
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
  server: {
    host: true,
  },
})
