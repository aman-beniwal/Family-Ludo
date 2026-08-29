import type { VitePWAOptions } from 'vite-plugin-pwa';

// Must match Vite `base`. The manifest/scope/fallback are absolute URLs, so they
// carry the subpath explicitly; change this alongside `base` for a root deploy.
const BASE = '/Family-Ludo/';

export const pwaOptions: Partial<VitePWAOptions> = {
  outDir: 'build/client',
  registerType: 'prompt',
  filename: 'sw.js',
  injectRegister: false,
  scope: BASE,
  manifest: {
    name: 'LibreLudo',
    short_name: 'LibreLudo',
    description:
      'A modern, ad-free, open-source Ludo game with a clean UI, local multiplayer, and bot opponents.',
    start_url: BASE,
    scope: BASE,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C5FFF',
    icons: [
      {
        src: `${BASE}icons/favicon.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${BASE}icons/favicon.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globDirectory: 'build/client',
    globPatterns: [
      '**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,gif,woff2,woff,ttf,eot,json,wav,mp3}',
    ],
    globIgnores: ['icons/favicon.png', 'icons/favicon.svg'],
    navigateFallbackDenylist: [
      /sitemap\.xml$/,
      /robots\.txt$/,
      /manifest\.webmanifest$/,
      /LICENSE\.txt$/,
      /THIRD_PARTY_LICENSES\.txt$/,
    ],
    navigateFallback: `${BASE}index.html`,
    mode: process.env.NODE_ENV,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: false,
  },
};
