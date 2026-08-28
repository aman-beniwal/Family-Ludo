export type TProfile = {
  id: string;
  name: string;
  // Stored as a Blob (not base64) to keep IndexedDB small. Null means the
  // profile has no photo yet.
  photoBlob: Blob | null;
  createdAt: number;
};
