import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import backImg from '../../../../assets/theme/btn-back.png';
import runImg from '../../../../assets/theme/btn-run.png';
import settingsImg from '../../../../assets/theme/btn-settings.png';
import { SoundControl } from '../../../../components/SoundControl/SoundControl';
import styles from './BottomBar.module.css';

type Props = {
  onExit: () => void;
};

/**
 * The play-screen footer: exit (left), the game-mode caption (centre) and the
 * roll + settings controls (right). "Solo" when a single human is playing,
 * otherwise "Local" for a shared-device game.
 */
export default function BottomBar({ onExit }: Props) {
  const players = useSelector((state: RootState) => state.players.players);
  const [showSettings, setShowSettings] = useState(false);

  const humanCount = players.filter((p) => !p.isBot).length;
  const modeLabel = humanCount <= 1 ? 'Solo' : 'Local';

  // Reuse the existing dice hotkey so the footer roll button drives the very
  // same roll path the active player's corner button does — only the current
  // human's (enabled) dice responds.
  const handleRoll = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
  };

  return (
    <div className={styles.bottomBar}>
      <button type="button" className={styles.iconBtn} aria-label="Exit game" onClick={onExit}>
        <img src={backImg} alt="" aria-hidden="true" />
      </button>

      <div className={styles.mode}>
        <span className={styles.modeTitle}>{modeLabel}</span>
        <span className={styles.modeSub}>Classic</span>
      </div>

      <div className={styles.rightControls}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Roll dice"
          title="Roll dice (Press D)"
          onClick={handleRoll}
        >
          <img src={runImg} alt="" aria-hidden="true" />
        </button>
        <div className={styles.settingsWrap}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Sound settings"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((s) => !s)}
          >
            <img src={settingsImg} alt="" aria-hidden="true" />
          </button>
          {showSettings && (
            <div className={styles.settingsPopover}>
              <SoundControl />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
