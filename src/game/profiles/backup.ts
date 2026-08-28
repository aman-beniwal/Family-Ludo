import type { TProfile } from '../../types/profiles';
import { listProfiles, putProfile } from './store';

// Exports/imports all profiles (names + photos) as a single JSON file the owner
// saves off-device. Photos are base64-encoded inside the file; nothing is ever
// uploaded. This is the insurance against iOS evicting on-device storage (R23).

export const BACKUP_FORMAT = 'libreludo-profiles-backup';
export const BACKUP_VERSION = 1;

type BackupEntry = {
  id: string;
  name: string;
  createdAt: number;
  photoType: string | null;
  photoData: string | null; // base64, no data-URL prefix
};

export type ProfileBackup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  profiles: BackupEntry[];
};

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function buildBackup(profiles: TProfile[], exportedAt: number): Promise<ProfileBackup> {
  const entries: BackupEntry[] = await Promise.all(
    profiles.map(async (p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      photoType: p.photoBlob?.type ?? null,
      photoData: p.photoBlob ? await blobToBase64(p.photoBlob) : null,
    }))
  );
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt, profiles: entries };
}

/** Serializes all stored profiles to a JSON string ready to download. */
export async function exportProfilesToJson(exportedAt: number): Promise<string> {
  const profiles = await listProfiles();
  return JSON.stringify(await buildBackup(profiles, exportedAt), null, 2);
}

function isBackupEntry(value: unknown): value is BackupEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.createdAt === 'number' &&
    (v.photoType === null || typeof v.photoType === 'string') &&
    (v.photoData === null || typeof v.photoData === 'string')
  );
}

/** Parses and validates a backup file's text into profiles. Throws on invalid input. */
export function parseBackup(text: string): TProfile[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('This file is not a valid backup.');
  }
  const backup = parsed as Record<string, unknown>;
  if (backup.format !== BACKUP_FORMAT || !Array.isArray(backup.profiles)) {
    throw new Error('This file is not a LibreLudo profiles backup.');
  }
  if (!backup.profiles.every(isBackupEntry)) {
    throw new Error('This backup file is damaged and could not be read.');
  }
  return (backup.profiles as BackupEntry[]).map((e) => ({
    id: e.id,
    name: e.name,
    createdAt: e.createdAt,
    photoBlob:
      e.photoData !== null ? base64ToBlob(e.photoData, e.photoType ?? 'image/jpeg') : null,
  }));
}

/**
 * Imports profiles into the store, merging by id (an incoming profile overwrites
 * an existing one with the same id; others are left intact). Returns the count
 * imported. Validation happens in parseBackup before any write, so a malformed
 * file never corrupts existing data.
 */
export async function importProfiles(profiles: TProfile[]): Promise<number> {
  for (const profile of profiles) {
    await putProfile(profile);
  }
  return profiles.length;
}
