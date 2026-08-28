import type { TFaceCounts, TRollHistoryEntry } from '../../types/rollHistory';

export const ROLL_HISTORY_KEY = 'libreludo-roll-history';

// Keep the recent-rolls list bounded so localStorage cannot grow without limit.
// The aggregate per-face counts and total still accumulate forever; only the
// per-entry log is capped.
export const MAX_RECENT_ENTRIES = 500;

export type TStoredRollHistory = {
  entries: TRollHistoryEntry[];
  faceCounts: TFaceCounts;
  totalRolls: number;
};

export function emptyFaceCounts(): TFaceCounts {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

const VALID_FACES = [1, 2, 3, 4, 5, 6];

function isValidStoredHistory(value: unknown): value is TStoredRollHistory {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.entries)) return false;
  if (typeof v.totalRolls !== 'number') return false;
  if (typeof v.faceCounts !== 'object' || v.faceCounts === null) return false;
  const fc = v.faceCounts as Record<string, unknown>;
  return VALID_FACES.every((f) => typeof fc[String(f)] === 'number');
}

export function loadRollHistory(): TStoredRollHistory | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROLL_HISTORY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredHistory(parsed)) return null;
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function saveRollHistory(history: TStoredRollHistory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLL_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
}
