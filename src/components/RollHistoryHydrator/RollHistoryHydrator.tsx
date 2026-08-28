import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../state/store';
import { hydrateRollHistory } from '../../state/slices/rollHistorySlice';
import { loadRollHistory } from '../../game/storage/rollHistory';

/**
 * Loads the persisted roll history into Redux once on the client, before any
 * roll can happen. Without this, the first roll of a session would persist a
 * history built from an empty in-memory slice and wipe accumulated counts.
 * Renders nothing.
 */
export function RollHistoryHydrator() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    const stored = loadRollHistory();
    if (stored) dispatch(hydrateRollHistory(stored));
  }, [dispatch]);
  return null;
}
