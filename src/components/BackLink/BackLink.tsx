import { Link } from 'react-router';
import styles from './BackLink.module.css';

/** Fixed top-left "Back" link shared by the standalone pages (Players, Roll History). */
export function BackLink({ to = '/', label = 'Back' }: { to?: string; label?: string }) {
  return (
    <Link className={styles.backBtn} to={to}>
      &larr; {label}
    </Link>
  );
}
