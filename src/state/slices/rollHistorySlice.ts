import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TFaceCounts, TRollHistoryEntry } from '../../types/rollHistory';
import {
  emptyFaceCounts,
  MAX_RECENT_ENTRIES,
  type TStoredRollHistory,
} from '../../game/storage/rollHistory';

export type TRollHistoryState = {
  // Most-recent-first, capped at MAX_RECENT_ENTRIES.
  entries: TRollHistoryEntry[];
  // Running per-face counts and total; these accumulate across sessions.
  faceCounts: TFaceCounts;
  totalRolls: number;
};

export const initialState: TRollHistoryState = {
  entries: [],
  faceCounts: emptyFaceCounts(),
  totalRolls: 0,
};

const reducers = {
  // Records one finalized roll: bumps the running counts and prepends to the
  // capped recent list.
  addRollHistoryEntry: (state: TRollHistoryState, action: PayloadAction<TRollHistoryEntry>) => {
    const entry = action.payload;
    const face = entry.value as keyof TFaceCounts;
    if (state.faceCounts[face] !== undefined) state.faceCounts[face] += 1;
    state.totalRolls += 1;
    state.entries.unshift(entry);
    if (state.entries.length > MAX_RECENT_ENTRIES) {
      state.entries.length = MAX_RECENT_ENTRIES;
    }
  },
  // Replaces the whole slice from persisted storage (client hydration).
  hydrateRollHistory: (state: TRollHistoryState, action: PayloadAction<TStoredRollHistory>) => {
    state.entries = action.payload.entries;
    state.faceCounts = action.payload.faceCounts;
    state.totalRolls = action.payload.totalRolls;
  },
  clearRollHistory: () => initialState,
};

const rollHistorySlice = createSlice({
  name: 'rollHistory',
  initialState,
  reducers,
});

export const { addRollHistoryEntry, hydrateRollHistory, clearRollHistory } =
  rollHistorySlice.actions;

export default rollHistorySlice.reducer;
