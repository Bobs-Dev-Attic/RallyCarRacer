// Injected at build time by vite.config.ts.
export const VERSION = __APP_VERSION__
export const BUILD_ID = __BUILD_ID__

/** e.g. "v0.2.0 · d5bf733" (or "v0.2.0 · local 2026-06-25 21:40") */
export const VERSION_LABEL = `v${VERSION} · ${BUILD_ID}`
