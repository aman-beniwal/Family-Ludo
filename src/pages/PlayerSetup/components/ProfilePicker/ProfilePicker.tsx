import { Link } from 'react-router';
import type { TProfile } from '../../../../types/profiles';
import { ProfileAvatar } from '../../../../components/ProfileAvatar/ProfileAvatar';
import clsx from 'clsx';
import styles from './ProfilePicker.module.css';

type Props = {
  profiles: TProfile[];
  takenProfileIds: Set<string>;
  currentProfileId: string | null;
  onSelect: (profile: TProfile) => void;
  onClose: () => void;
};

/**
 * Modal that fills a seat by tapping a stored profile. A profile already used
 * by another seat is shown as taken and cannot be double-selected. When there
 * are no profiles yet, it routes to the profile manager to create one.
 */
export default function ProfilePicker({
  profiles,
  takenProfileIds,
  currentProfileId,
  onSelect,
  onClose,
}: Props) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Choose a player">
      <div className={styles.modal}>
        <h2>Choose a player</h2>

        {profiles.length === 0 ? (
          <div className={styles.empty}>
            <p>No players yet.</p>
            <Link to="/profiles" className={styles.manageBtn}>
              + Create players
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.grid}>
              {profiles.map((profile) => {
                const takenByOther =
                  takenProfileIds.has(profile.id) && profile.id !== currentProfileId;
                const isCurrent = profile.id === currentProfileId;
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      className={clsx(styles.card, {
                        [styles.taken]: takenByOther,
                        [styles.current]: isCurrent,
                      })}
                      disabled={takenByOther}
                      onClick={() => onSelect(profile)}
                    >
                      <ProfileAvatar name={profile.name} photoBlob={profile.photoBlob} size={64} />
                      <span className={styles.name}>{profile.name}</span>
                      {takenByOther && <span className={styles.badge}>In use</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link to="/profiles" className={styles.manageLink}>
              Manage players
            </Link>
          </>
        )}

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
