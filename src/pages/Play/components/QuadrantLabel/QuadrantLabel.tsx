import { useState } from 'react';
import type { TPlayerColour } from '../../../../types';
import type { TProfile } from '../../../../types/profiles';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../state/store';
import { setPlayerProfile } from '../../../../state/slices/playersSlice';
import { listProfiles } from '../../../../game/profiles/store';
import { saveState } from '../../../../game/storage/saveState';
import { logError } from '../../../../utils/logError';
import ProfilePicker from '../../../PlayerSetup/components/ProfilePicker/ProfilePicker';
import styles from './QuadrantLabel.module.css';
import clsx from 'clsx';

type Props = {
  colour: TPlayerColour;
};

/**
 * The name/progress caption inside each colour's home quadrant. The name (or
 * "Bot") hugs the board's outer edge; the completion percentage hugs the
 * centre-facing edge.
 *
 * A human seat's name is double-tappable: it opens the profile picker so a
 * player can pick (or change) their saved profile mid-game — handy when a game
 * was started straight away with default colour names.
 */
export default function QuadrantLabel({ colour }: Props) {
  const players = useSelector((state: RootState) => state.players.players);
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const [profiles, setProfiles] = useState<TProfile[]>([]);
  const [picking, setPicking] = useState(false);

  const player = players.find((p) => p.colour === colour);
  if (!player) return null;

  const takenProfileIds = new Set(
    players
      .filter((p) => p.colour !== colour)
      .map((p) => p.profileId)
      .filter((id): id is string => id !== null)
  );

  // TODO: switch to an overall completion rate (distance travelled by all
  // tokens / distance to finish). For now: share of tokens that reached home.
  const tokensHome = player.tokens.filter((t) => t.hasTokenReachedHome).length;
  const progress = Math.round((tokensHome / player.tokens.length) * 100);

  const label = player.isBot ? 'Bot' : player.name.trim() || 'Player';

  const openPicker = () => {
    listProfiles()
      .then((list) => {
        setProfiles(list);
        setPicking(true);
      })
      .catch(logError('QuadrantLabel.loadProfiles'));
  };

  const handleSelect = (profile: TProfile) => {
    dispatch(setPlayerProfile({ colour, name: profile.name, profileId: profile.id }));
    try {
      saveState(store.getState());
    } catch {
      // A save mid-animation is skipped; the change still applies in memory.
    }
    setPicking(false);
  };

  return (
    <>
      <div className={clsx(styles.quadrant, styles[colour])}>
        {player.isBot ? (
          <span className={styles.type} aria-hidden="true">
            {label}
          </span>
        ) : (
          <button
            type="button"
            className={clsx(styles.type, styles.editable)}
            title="Double-tap to choose a player"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
          >
            {label}
          </button>
        )}
        <span className={styles.progress} aria-hidden="true">
          {progress}%
        </span>
      </div>

      {picking && (
        <ProfilePicker
          profiles={profiles}
          takenProfileIds={takenProfileIds}
          currentProfileId={player.profileId}
          onSelect={handleSelect}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
