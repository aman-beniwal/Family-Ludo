import { useEffect, useState } from 'react';
import styles from './ProfileAvatar.module.css';
import clsx from 'clsx';

type Props = {
  name: string;
  photoBlob: Blob | null;
  size?: number;
  className?: string;
};

/**
 * Renders a profile photo from its Blob (via an object URL it owns and revokes)
 * or a coloured initial fallback when there is no photo — used by the profile
 * manager and the setup picker.
 */
export function ProfileAvatar({ name, photoBlob, size = 64, className }: Props) {
  // Create the object URL in an effect and revoke it in the matching cleanup,
  // so allocation and release pair 1:1 with each commit (a StrictMode remount
  // recreates exactly what its cleanup revoked). Creating it in render/useMemo
  // instead would leak a URL per double-render.
  const [url, setUrl] = useState<string | null>(null);
  // set-state-in-effect is disabled for this effect on purpose: the object URL
  // must be created in the effect so its cleanup can revoke it 1:1 (and clear on
  // blob change/unmount). Deriving it in render to satisfy the rule leaks a URL
  // per StrictMode double-render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!photoBlob) return;
    const objectUrl = URL.createObjectURL(photoBlob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [photoBlob]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      className={clsx(styles.avatar, className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" className={styles.img} /> : <span>{initial}</span>}
    </span>
  );
}
