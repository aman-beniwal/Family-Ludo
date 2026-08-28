import { describe, expect, it } from 'vitest';
import rollHistoryReducer, {
  addRollHistoryEntry,
  clearRollHistory,
  hydrateRollHistory,
  initialState,
} from '../../src/state/slices/rollHistorySlice';
import { MAX_RECENT_ENTRIES } from '../../src/game/storage/rollHistory';

describe('rollHistory slice', () => {
  describe('addRollHistoryEntry', () => {
    it('appends exactly one entry and bumps the running counts', () => {
      const state = rollHistoryReducer(
        initialState,
        addRollHistoryEntry({ colour: 'blue', value: 4, timestamp: 100 })
      );
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0]).toEqual({ colour: 'blue', value: 4, timestamp: 100 });
      expect(state.totalRolls).toBe(1);
      expect(state.faceCounts[4]).toBe(1);
    });

    it('keeps per-face counts summing to the total across many rolls', () => {
      let state = initialState;
      const values = [1, 6, 6, 3, 3, 3, 1];
      values.forEach((v, i) =>
        (state = rollHistoryReducer(state, addRollHistoryEntry({ colour: 'red', value: v, timestamp: i })))
      );
      const sumOfFaces = ([1, 2, 3, 4, 5, 6] as const).reduce((a, f) => a + state.faceCounts[f], 0);
      expect(state.totalRolls).toBe(values.length);
      expect(sumOfFaces).toBe(state.totalRolls);
      expect(state.faceCounts[3]).toBe(3);
      expect(state.faceCounts[6]).toBe(2);
    });

    it('prepends most-recent-first and caps the recent list', () => {
      let state = initialState;
      for (let i = 0; i < MAX_RECENT_ENTRIES + 25; i++) {
        state = rollHistoryReducer(
          state,
          addRollHistoryEntry({ colour: 'green', value: (i % 6) + 1, timestamp: i })
        );
      }
      expect(state.entries.length).toBe(MAX_RECENT_ENTRIES);
      // most recent (highest timestamp) is first
      expect(state.entries[0].timestamp).toBe(MAX_RECENT_ENTRIES + 24);
      // but the running total is not capped
      expect(state.totalRolls).toBe(MAX_RECENT_ENTRIES + 25);
    });
  });

  describe('hydrateRollHistory', () => {
    it('replaces the slice from persisted storage', () => {
      const state = rollHistoryReducer(
        initialState,
        hydrateRollHistory({
          entries: [{ colour: 'yellow', value: 2, timestamp: 5 }],
          faceCounts: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 },
          totalRolls: 1,
        })
      );
      expect(state.totalRolls).toBe(1);
      expect(state.faceCounts[2]).toBe(1);
      expect(state.entries[0].colour).toBe('yellow');
    });
  });

  describe('clearRollHistory', () => {
    it('resets to empty', () => {
      const populated = rollHistoryReducer(
        initialState,
        addRollHistoryEntry({ colour: 'blue', value: 1, timestamp: 1 })
      );
      expect(rollHistoryReducer(populated, clearRollHistory())).toEqual(initialState);
    });
  });
});
