import { type MetaFunction } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../../state/store';
import { H } from '../../components/H/H';
import { BackLink } from '../../components/BackLink/BackLink';
import { playerColours } from '../../game/players/constants';
import styles from './RollHistory.module.css';

const FACES = [1, 2, 3, 4, 5, 6] as const;

function formatTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return '';
  }
}

export default function RollHistory() {
  const { entries, faceCounts, totalRolls } = useSelector((state: RootState) => state.rollHistory);

  const maxCount = Math.max(1, ...FACES.map((f) => faceCounts[f]));

  return (
    <div className={styles.pageContainer}>
      <main className={styles.rollHistory}>
        <header className={styles.header}>
          <h1>
            <H c="🎲" /> Roll History &amp; Fairness
          </h1>
          <p className={styles.subtitle}>
            Every roll on this device is recorded here. With honest dice, each face lands close to{' '}
            <strong>1 in 6</strong> over many rolls — whatever comes, comes.
          </p>
        </header>

        <section className={styles.summary}>
          <div className={styles.totalCard}>
            <span className={styles.totalNumber}>{totalRolls.toLocaleString()}</span>
            <span className={styles.totalLabel}>total rolls</span>
          </div>
        </section>

        <section className={styles.faces} aria-label="Per-face counts">
          {FACES.map((face) => {
            const count = faceCounts[face];
            const pct = totalRolls === 0 ? 0 : (count / totalRolls) * 100;
            return (
              <div key={face} className={styles.faceRow}>
                <span className={styles.faceLabel}>{face}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className={styles.faceStat}>
                  {count.toLocaleString()} <span className={styles.facePct}>({pct.toFixed(1)}%)</span>
                </span>
              </div>
            );
          })}
          <p className={styles.expectedNote}>Expected with fair dice: 16.7% each.</p>
        </section>

        <section className={styles.recent}>
          <h2>Recent rolls</h2>
          {entries.length === 0 ? (
            <p className={styles.empty}>No rolls yet. Play a game and they'll show up here.</p>
          ) : (
            <ol className={styles.recentList}>
              {entries.map((entry, i) => (
                <li key={`${entry.timestamp}-${i}`} className={styles.recentItem}>
                  <span
                    className={styles.dot}
                    style={{ backgroundColor: playerColours[entry.colour] }}
                    aria-label={entry.colour}
                    title={entry.colour}
                  />
                  <span className={styles.recentValue}>{entry.value}</span>
                  <span className={styles.recentTime}>{formatTime(entry.timestamp)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      <BackLink />
    </div>
  );
}

export const meta: MetaFunction = () => [{ title: 'Family Ludo - Roll History & Fairness' }];
