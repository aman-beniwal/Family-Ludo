import * as z from 'zod';
import { logError } from '../../utils/logError';
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

const faceCountSchema = z.number();
const storedRollHistorySchema = z.object({
  entries: z.array(
    z.object({
      colour: z.enum(['blue', 'red', 'green', 'yellow']),
      value: z.number(),
      timestamp: z.number(),
    })
  ),
  faceCounts: z.object({
    1: faceCountSchema,
    2: faceCountSchema,
    3: faceCountSchema,
    4: faceCountSchema,
    5: faceCountSchema,
    6: faceCountSchema,
  }),
  totalRolls: z.number(),
});

export function loadRollHistory(): TStoredRollHistory | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROLL_HISTORY_KEY);
    if (!raw) return null;
    const result = storedRollHistorySchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch (e) {
    logError('rollHistory.load')(e);
    return null;
  }
}

export function saveRollHistory(history: TStoredRollHistory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLL_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    logError('rollHistory.save')(e);
  }
}
