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
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoBlob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photoBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoBlob]);

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
