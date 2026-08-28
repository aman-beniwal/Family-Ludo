import { useCallback, useEffect, useRef, useState } from 'react';
import { type MetaFunction } from 'react-router';
import { BackLink } from '../../components/BackLink/BackLink';
import type { TProfile } from '../../types/profiles';
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
} from '../../game/profiles/store';
import { downscaleImage } from '../../game/profiles/photo';
import { exportProfilesToJson, importProfiles, parseBackup } from '../../game/profiles/backup';
import { MAX_PLAYER_NAME_LENGTH } from '../../game/players/constants';
import { ProfileAvatar } from '../../components/ProfileAvatar/ProfileAvatar';
import { logError } from '../../utils/logError';
import styles from './Profiles.module.css';

type EditTarget = { mode: 'new' } | { mode: 'edit'; profile: TProfile } | null;

export default function Profiles() {
  const [profiles, setProfiles] = useState<TProfile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProfiles(await listProfiles());
      setLoadError(null);
    } catch (e) {
      logError('Profiles.refresh')(e);
      setLoadError('Could not load saved profiles on this device.');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const handleDelete = async (profile: TProfile) => {
    if (!confirm(`Delete ${profile.name}? This can't be undone.`)) return;
    try {
      await deleteProfile(profile.id);
      await refresh();
    } catch (e) {
      logError('Profiles.delete')(e);
      alert('Sorry, that profile could not be deleted.');
    }
  };

  const handleExport = async () => {
    setBackupError(null);
    setBackupMessage(null);
    try {
      const json = await exportProfilesToJson(Date.now());
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'libreludo-players-backup.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupMessage('Backup saved. Keep it somewhere safe (e.g. the Files app).');
    } catch (e) {
      logError('Profiles.export')(e);
      setBackupError('Could not create a backup.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupError(null);
    setBackupMessage(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseBackup(text);
      const count = await importProfiles(parsed);
      await refresh();
      setBackupMessage(`Restored ${count} player${count === 1 ? '' : 's'} from backup.`);
    } catch (err) {
      logError('Profiles.import')(err);
      setBackupError(err instanceof Error ? err.message : 'That backup could not be imported.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <main className={styles.profiles}>
        <header className={styles.header}>
          <h1>Players</h1>
          <p className={styles.subtitle}>
            Create a profile for each family member. Names and photos stay on this iPad — they are
            never uploaded.
          </p>
        </header>

        {loadError && <p className={styles.error}>{loadError}</p>}

        {profiles.length === 0 && !loadError ? (
          <div className={styles.emptyState}>
            <p>No players yet.</p>
            <button type="button" className={styles.primaryBtn} onClick={() => setEditing({ mode: 'new' })}>
              + Add your first player
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.cardList}>
              {profiles.map((profile) => (
                <li key={profile.id} className={styles.card}>
                  <ProfileAvatar name={profile.name} photoBlob={profile.photoBlob} size={56} />
                  <span className={styles.cardName}>{profile.name}</span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Edit ${profile.name}`}
                      onClick={() => setEditing({ mode: 'edit', profile })}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Delete ${profile.name}`}
                      onClick={() => void handleDelete(profile)}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.primaryBtn} onClick={() => setEditing({ mode: 'new' })}>
              + Add player
            </button>
          </>
        )}

        <section className={styles.backup}>
          <h2>Backup</h2>
          <p className={styles.backupHint}>
            Photos live only on this iPad. Export a backup file and keep it somewhere safe so you
            can restore your players if the device data is ever lost.
          </p>
          <div className={styles.backupActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => void handleExport()}>
              Export backup
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => importInputRef.current?.click()}
            >
              Import backup
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className={styles.hiddenInput}
              onChange={(e) => void handleImportFile(e)}
            />
          </div>
          {backupMessage && <p className={styles.success}>{backupMessage}</p>}
          {backupError && <p className={styles.error}>{backupError}</p>}
        </section>
      </main>

      <BackLink />

      {editing && (
        <ProfileForm
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ProfileForm({
  target,
  onClose,
  onSaved,
}: {
  target: NonNullable<EditTarget>;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const existing = target.mode === 'edit' ? target.profile : null;
  const [name, setName] = useState(existing?.name ?? '');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(existing?.photoBlob ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file still fires a change.
    e.target.value = '';
    if (!file) return; // picker cancelled
    try {
      const blob = await downscaleImage(file);
      setPhotoBlob(blob);
    } catch (err) {
      logError('Profiles.photo')(err);
      setPhotoError(err instanceof Error ? err.message : 'That photo could not be used.');
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveError('Please enter a name.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (existing) {
        await updateProfile({ ...existing, name: trimmed, photoBlob });
      } else {
        await createProfile({ name: trimmed, photoBlob });
      }
      await onSaved();
    } catch (e) {
      logError('Profiles.save')(e);
      setSaveError('Could not save. Your device storage may be full.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Edit player">
      <div className={styles.modal}>
        <h2>{existing ? 'Edit player' : 'New player'}</h2>

        <button
          type="button"
          className={styles.photoPicker}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Choose a photo"
        >
          <ProfileAvatar name={name || '?'} photoBlob={photoBlob} size={110} />
          <span className={styles.photoHint}>{photoBlob ? 'Change photo' : 'Add photo'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={(e) => void handlePhotoChange(e)}
        />
        {photoError && <p className={styles.error}>{photoError}</p>}

        <label className={styles.label}>
          Name
          <input
            type="text"
            className={styles.textInput}
            value={name}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            placeholder="e.g. Grandpa"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        {saveError && <p className={styles.error}>{saveError}</p>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => [{ title: 'LibreLudo - Players' }];
