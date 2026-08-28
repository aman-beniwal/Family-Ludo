import type { TProfile } from '../../types/profiles';

// On-device profile storage. Profiles (name + photo Blob) live only in the
// browser's IndexedDB — nothing is ever uploaded (R10, R12).

export const DB_NAME = 'libreludo-profiles';
export const DB_VERSION = 1;
export const STORE_NAME = 'profiles';

export class ProfileStoreError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ProfileStoreError';
  }
}

function isBrowser(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new ProfileStoreError('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new ProfileStoreError('Failed to open profile database', { cause: request.error }));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let request: IDBRequest<T>;
        try {
          request = work(store);
        } catch (e) {
          db.close();
          reject(new ProfileStoreError('Profile operation failed', { cause: e }));
          return;
        }
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(new ProfileStoreError('Profile operation failed', { cause: request.error }));
        tx.oncomplete = () => db.close();
      })
  );
}

/**
 * Best-effort request for persistent storage to reduce the chance iOS evicts
 * profiles under storage pressure (plan KTD5 / Appendix D). Never throws.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // ignore
  }
  return false;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export async function createProfile(input: {
  name: string;
  photoBlob: Blob | null;
}): Promise<TProfile> {
  const profile: TProfile = {
    id: generateId(),
    name: input.name,
    photoBlob: input.photoBlob,
    createdAt: Date.now(),
  };
  void requestPersistentStorage();
  await runTransaction('readwrite', (store) => store.add(profile));
  return profile;
}

export async function listProfiles(): Promise<TProfile[]> {
  const all = await runTransaction<TProfile[]>('readonly', (store) => store.getAll());
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getProfile(id: string): Promise<TProfile | undefined> {
  return runTransaction<TProfile | undefined>('readonly', (store) => store.get(id));
}

export async function updateProfile(profile: TProfile): Promise<TProfile> {
  await runTransaction('readwrite', (store) => store.put(profile));
  return profile;
}

/** Inserts or overwrites a profile verbatim (used by backup import). */
export async function putProfile(profile: TProfile): Promise<void> {
  void requestPersistentStorage();
  await runTransaction('readwrite', (store) => store.put(profile));
}

export async function deleteProfile(id: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(id));
}
