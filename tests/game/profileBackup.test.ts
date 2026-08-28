// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  exportProfilesToJson,
  importProfiles,
  parseBackup,
  type ProfileBackup,
} from '../../src/game/profiles/backup';
import {
  __resetProfileCacheForTests,
  createProfile,
  DB_NAME,
  listProfiles,
} from '../../src/game/profiles/store';

function resetDB(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await resetDB();
  __resetProfileCacheForTests();
});

describe('profile backup', () => {
  it('exports all profiles and photos to a backup file', async () => {
    await createProfile({ name: 'Asha', photoBlob: new Blob([new Uint8Array([1, 2, 3])]) });
    await createProfile({ name: 'Bo', photoBlob: null });
    const json = await exportProfilesToJson(1000);
    const backup = JSON.parse(json) as ProfileBackup;
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.profiles).toHaveLength(2);
    expect(backup.profiles[0].name).toBe('Asha');
    expect(backup.profiles[0].photoData).toBeTruthy();
  });

  it('restores profiles into an empty store with photo bytes intact', async () => {
    const created = await createProfile({
      name: 'Asha',
      photoBlob: new Blob([new Uint8Array([9, 8, 7, 6])], { type: 'image/jpeg' }),
    });
    const json = await exportProfilesToJson(1000);
    await resetDB();
    expect(await listProfiles()).toHaveLength(0);

    const parsed = parseBackup(json);
    const count = await importProfiles(parsed);
    expect(count).toBe(1);

    const restored = await listProfiles();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe(created.id);
    expect(restored[0].name).toBe('Asha');
    const bytes = new Uint8Array(await restored[0].photoBlob!.arrayBuffer());
    expect(Array.from(bytes)).toEqual([9, 8, 7, 6]);
  });

  it('rejects a malformed backup file without touching existing data', async () => {
    await createProfile({ name: 'Existing', photoBlob: null });
    expect(() => parseBackup('{ not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ format: 'something-else', profiles: [] }))).toThrow();
    // Existing data is untouched because parse throws before any import.
    expect(await listProfiles()).toHaveLength(1);
  });
});
