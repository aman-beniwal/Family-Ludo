import type { CapacitorConfig } from '@capacitor/cli';

// Wraps the built web app (root-path NATIVE build) into the iOS app shell.
// Run `pnpm run cap:sync` to rebuild the web assets and copy them into ios/.
const config: CapacitorConfig = {
  appId: 'com.familyludo.app',
  appName: 'Family Ludo',
  webDir: 'build/client',
};

export default config;
