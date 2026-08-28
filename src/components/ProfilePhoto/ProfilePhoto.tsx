import { useEffect, useState } from 'react';
import { getProfile } from '../../game/profiles/store';
import { ProfileAvatar } from '../ProfileAvatar/ProfileAvatar';

type Props = {
  profileId: string | null;
  name: string;
  size?: number;
  className?: string;
};

/**
 * Resolves a profile's photo from IndexedDB by id and renders it. If the
 * profile was deleted or evicted (lookup returns nothing), it falls back to the
 * coloured-initial avatar using the saved name (R11 fallback).
 */
export function ProfilePhoto({ profileId, name, size, className }: Props) {
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const blob = profileId ? ((await getProfile(profileId))?.photoBlob ?? null) : null;
        if (active) setPhotoBlob(blob);
      } catch {
        if (active) setPhotoBlob(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [profileId]);

  return <ProfileAvatar name={name} photoBlob={photoBlob} size={size} className={className} />;
}
