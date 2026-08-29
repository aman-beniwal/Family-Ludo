import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  ssr: false,
  // Matches Vite `base` so client routing works under the GitHub Pages subpath.
  basename: '/Family-Ludo/',
  prerender: ['/', '/how-to-play', '/setup', '/404'],
} satisfies Config;
