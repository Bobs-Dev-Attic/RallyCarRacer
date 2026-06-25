import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The Rapier physics engine ships as a WASM module; excluding it from the
  // dev-server pre-bundle avoids the optimizer choking on the .wasm import.
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
  server: {
    host: true,
  },
})
