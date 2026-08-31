import type { TPlayerColour } from '../../../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import styles from './QuadrantLabel.module.css';
import clsx from 'clsx';

type Props = {
  colour: TPlayerColour;
};

/**
 * The "Human / 0%" caption that sits inside each colour's home quadrant on the
 * board. The type label hugs the board's outer edge and the progress percentage
 * hugs the centre-facing edge, matching the reference art.
 */
export default function QuadrantLabel({ colour }: Props) {
  const player = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)
  );
  if (!player) return null;

  const tokensHome = player.tokens.filter((t) => t.hasTokenReachedHome).length;
  const progress = Math.round((tokensHome / player.tokens.length) * 100);
  const typeLabel = player.isBot ? 'Bot' : 'Human';

  return (
    <div className={clsx(styles.quadrant, styles[colour])} aria-hidden="true">
      <span className={styles.type}>{typeLabel}</span>
      <span className={styles.progress}>{progress}%</span>
    </div>
  );
}
