import { useState, useSyncExternalStore } from 'react';
import {
  getServerSnapshot,
  getSnapshot,
  setMuted,
  setVolume,
  subscribe,
  unlockAudio,
} from '../../game/sound/soundManager';
import styles from './SoundControl.module.css';

/**
 * Mute toggle + volume slider for the play screen. The slider is revealed on
 * demand to keep the header uncluttered. State is backed by the sound module,
 * so it persists across reloads.
 */
export function SoundControl() {
  const { muted, volume } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showSlider, setShowSlider] = useState(false);

  const toggleMute = () => {
    void unlockAudio();
    setMuted(!muted);
  };

  return (
    <div className={styles.soundControl}>
      <button
        type="button"
        className={styles.muteBtn}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
        title={muted ? 'Sound off' : 'Sound on'}
        onClick={toggleMute}
        onPointerEnter={() => setShowSlider(true)}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {showSlider && (
        <input
          type="range"
          className={styles.volume}
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          aria-label="Volume"
          onChange={(e) => {
            void unlockAudio();
            const next = parseFloat(e.target.value);
            setVolume(next);
            if (next > 0 && muted) setMuted(false);
          }}
        />
      )}
    </div>
  );
}
