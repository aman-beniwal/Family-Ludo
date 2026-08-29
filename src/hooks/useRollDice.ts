import { type RootState, type AppDispatch } from './../state/store';
import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { TPlayerColour } from '../types';
import { setIsPlaceholderShowing, setDiceNumber } from '../state/slices/diceSlice';
import { rollFairDie } from '../game/dice/rollFairDie';
import { addRollHistoryEntry } from '../state/slices/rollHistorySlice';
import { saveRollHistory } from '../game/storage/rollHistory';
import { playSound } from '../game/sound/soundManager';
import { saveState } from '../game/storage/saveState';
import { sleep } from '../utils/sleep';
import { ERRORS } from '../utils/errors';

// Kept short so the roll feels snappy — the fair value is picked the moment
// the brief spin ends (the previous 1000ms felt very slow).
const DICE_PLACEHOLDER_DELAY = 350;

export const useRollDice = () => {
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    async (colour: TPlayerColour): Promise<number> => {
      if (store.getState().players.isGameEnded) throw new Error(ERRORS.gameEnded());
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
      playSound('diceRoll');
      await sleep(DICE_PLACEHOLDER_DELAY);
      // Single choke point: humans and bots both reach the dice through here,
      // and the value comes only from the stateless fair generator (R1–R4).
      const diceNumber = rollFairDie();
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
      dispatch(setDiceNumber({ colour, value: diceNumber }));
      // Record the finalized roll and persist the running history so per-face
      // counts accumulate across sessions (R5).
      dispatch(addRollHistoryEntry({ colour, value: diceNumber, timestamp: Date.now() }));
      saveRollHistory(store.getState().rollHistory);
      saveState(store.getState());
      return diceNumber;
    },
    [dispatch, store]
  );
};
