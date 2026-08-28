// @vitest-environment node
// Uses Node's native Blob (jsdom's Blob does not survive structuredClone, which
// fake-indexeddb relies on). The store touches no DOM APIs, so node is correct.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createProfile,
  deleteProfile,
  DB_NAME,
  getProfile,
  listProfiles,
  ProfileStoreError,
  putProfile,
  updateProfile,
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
});

describe('profile store', () => {
  it('creates a profile and lists it back', async () => {
    const created = await createProfile({ name: 'Asha', photoBlob: new Blob(['x']) });
    expect(created.id).toBeTruthy();
    const list = await listProfiles();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Asha');
  });

  it('updates a profile name and photo', async () => {
    const created = await createProfile({ name: 'Old', photoBlob: null });
    await updateProfile({ ...created, name: 'New', photoBlob: new Blob(['pic']) });
    const fetched = await getProfile(created.id);
    expect(fetched?.name).toBe('New');
    expect(fetched?.photoBlob).toBeInstanceOf(Blob);
  });

  it('deletes a profile', async () => {
    const created = await createProfile({ name: 'Temp', photoBlob: null });
    await deleteProfile(created.id);
    expect(await listProfiles()).toHaveLength(0);
  });

  it('round-trips a large photo Blob', async () => {
    const bytes = new Uint8Array(200_000).fill(7);
    const created = await createProfile({ name: 'Big', photoBlob: new Blob([bytes]) });
    const fetched = await getProfile(created.id);
    expect(fetched?.photoBlob?.size).toBe(200_000);
  });

  it('persists across a reopened connection (survives reload)', async () => {
    await createProfile({ name: 'Persisted', photoBlob: null });
    // listProfiles reopens the DB each call, simulating a fresh page load.
    const list = await listProfiles();
    expect(list.map((p) => p.name)).toContain('Persisted');
  });

  it('putProfile overwrites an existing id (import/restore)', async () => {
    const created = await createProfile({ name: 'A', photoBlob: null });
    await putProfile({ ...created, name: 'A-restored' });
    const fetched = await getProfile(created.id);
    expect(fetched?.name).toBe('A-restored');
  });

  it('surfaces an error rather than silently losing data when storage is unavailable', async () => {
    const original = globalThis.indexedDB;
    // @ts-expect-error simulate an environment without IndexedDB
    delete globalThis.indexedDB;
    try {
      await expect(createProfile({ name: 'X', photoBlob: null })).rejects.toBeInstanceOf(
        ProfileStoreError
      );
    } finally {
      globalThis.indexedDB = original;
    }
  });
});
