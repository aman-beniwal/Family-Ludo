import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { logError } from '../../utils/logError';

export const PWAUpdater = () => {
  useEffect(() => {
    // The native (Capacitor) app bundles all assets and has no service worker,
    // so skip registration there entirely.
    if (__NATIVE__) return;
    const updateSW = registerSW({
      onNeedRefresh() {
        const shouldUpdate = window.confirm('A new version of Family Ludo is available. Update now?');
        if (shouldUpdate) {
          updateSW(true).catch(logError('PWAUpdater.updateSW'));
          console.info(`Family Ludo updated successfully to v${__LIBRELUDO_VERSION__}`);
        } else {
          console.info('Update postponed. Current version maintained.');
        }
      },
    });
  }, []);

  return null;
};
