import type { TPlayerColour } from '../../../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import styles from './QuadrantLabel.module.css';
import clsx from 'clsx';

type Props = {
  colour: TPlayerColour;
};

/**
 * The name/progress caption inside each colour's home quadrant. The name (or
 * "Bot") hugs the board's outer edge; the completion percentage hugs the
 * centre-facing edge.
 */
export default function QuadrantLabel({ colour }: Props) {
  const player = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)
  );
  if (!player) return null;

  // TODO: switch to an overall completion rate (distance travelled by all
  // tokens / distance to finish). For now: share of tokens that reached home.
  const tokensHome = player.tokens.filter((t) => t.hasTokenReachedHome).length;
  const progress = Math.round((tokensHome / player.tokens.length) * 100);

  const label = player.isBot ? 'Bot' : player.name.trim() || 'Player';

  return (
    <div className={clsx(styles.quadrant, styles[colour])} aria-hidden="true">
      <span className={styles.type}>{label}</span>
      <span className={styles.progress}>{progress}%</span>
    </div>
  );
}
