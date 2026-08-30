import type { Config } from '@react-router/dev/config';

// NATIVE=1 (Capacitor iOS app) serves from the bundle root; keep in sync with
// vite.config.ts and pwa.config.ts.
const isNative = process.env.NATIVE === '1';

export default {
  appDirectory: 'src',
  ssr: false,
  // Matches Vite `base` so client routing works under the GitHub Pages subpath
  // (or the bundle root in the native app).
  basename: isNative ? '/' : '/Family-Ludo/',
  prerender: ['/', '/how-to-play', '/setup', '/404'],
} satisfies Config;
