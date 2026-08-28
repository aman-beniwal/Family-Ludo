import { useEffect } from 'react';
import { loadSoundSettings, unlockAudio } from '../../game/sound/soundManager';

/**
 * Loads persisted sound settings and unlocks the Web Audio context on the very
 * first user gesture anywhere in the app. iOS Safari blocks audio until a
 * gesture, so without this the first sounds would be silent. Renders nothing.
 */
export function SoundUnlocker() {
  useEffect(() => {
    loadSoundSettings();

    const unlock = () => {
      void unlockAudio();
      remove();
    };
    const remove = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });
    return remove;
  }, []);

  return null;
}
