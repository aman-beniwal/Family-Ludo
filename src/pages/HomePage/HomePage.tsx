import { Link, type MetaFunction } from 'react-router';
import { useEffect } from 'react';
import { useCleanup } from '../../hooks/useCleanup';
import styles from './HomePage.module.css';
import clsx from 'clsx';
import { H } from '../../components/H/H';

const LUDO_COLOURS = ['red', 'green', 'yellow', 'blue'] as const;

export default function HomePage() {
  const cleanup = useCleanup();

  useEffect(() => {
    cleanup();
  }, [cleanup]);

  return (
    <div className={styles.pageContainer}>
      <main className={styles.homePage}>
        <section className={styles.welcome}>
          <div className={styles.pawns} aria-hidden="true">
            {LUDO_COLOURS.map((c) => (
              <span key={c} className={clsx(styles.pawn, styles[c])} />
            ))}
          </div>
          <h1>
            <span className={styles.family}>Family</span> Ludo
          </h1>
          <p className={styles.tagline}>Grab the dice, gather everyone, and play together.</p>
          <nav className={styles.ctaButtons}>
            <Link className={clsx(styles.ctaButton, styles.playNowBtn)} to="/setup">
              <H c="🎲" /> Play Now!
            </Link>
            <Link className={clsx(styles.ctaButton, styles.secondaryBtn)} to="/how-to-play">
              How to Play
            </Link>
            <Link className={clsx(styles.ctaButton, styles.secondaryBtn)} to="/profiles">
              <H c="👥" /> Players
            </Link>
            <Link className={clsx(styles.ctaButton, styles.secondaryBtn)} to="/history">
              <H c="📜" /> Roll History
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}

export const meta: MetaFunction = () => [{ title: 'Family Ludo' }];
