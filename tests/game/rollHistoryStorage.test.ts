import { afterEach, describe, expect, it } from 'vitest';
import {
  loadRollHistory,
  ROLL_HISTORY_KEY,
  saveRollHistory,
  type TStoredRollHistory,
} from '../../src/game/storage/rollHistory';

const sample: TStoredRollHistory = {
  entries: [{ colour: 'blue', value: 4, timestamp: 123 }],
  faceCounts: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0, 6: 0 },
  totalRolls: 1,
};

afterEach(() => {
  localStorage.clear();
});

describe('roll history storage', () => {
  it('round-trips a saved history', () => {
    saveRollHistory(sample);
    expect(loadRollHistory()).toEqual(sample);
  });

  it('returns null when nothing is stored', () => {
    expect(loadRollHistory()).toBeNull();
  });

  it('returns null for a malformed stored value rather than throwing', () => {
    localStorage.setItem(ROLL_HISTORY_KEY, '{ not valid json');
    expect(loadRollHistory()).toBeNull();
  });

  it('rejects a structurally invalid history (missing faceCounts)', () => {
    localStorage.setItem(ROLL_HISTORY_KEY, JSON.stringify({ entries: [], totalRolls: 0 }));
    expect(loadRollHistory()).toBeNull();
  });
});
