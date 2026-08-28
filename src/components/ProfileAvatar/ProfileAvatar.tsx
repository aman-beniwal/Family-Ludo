import { useEffect, useMemo } from 'react';
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
  // Derive the object URL from the blob and revoke it when the blob changes or
  // the component unmounts. Kept out of state so no effect writes state.
  const url = useMemo(() => (photoBlob ? URL.createObjectURL(photoBlob) : null), [photoBlob]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

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
