import styles from './OrientationLock.module.css';

/**
 * Full-screen "please rotate to portrait" overlay. Family Ludo is portrait-only:
 * the installed PWA is locked via the manifest, but iOS Safari ignores
 * orientation locks before install, so this CSS-only overlay covers the app when
 * a touch device is held in landscape. It never shows on pointer-fine devices
 * (desktops), so it can't interfere with normal landscape browsing.
 */
export function OrientationLock() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.icon}>📱</div>
      <div className={styles.title}>Please rotate to portrait</div>
      <div className={styles.subtitle}>Family Ludo is best played with your device upright.</div>
    </div>
  );
}
