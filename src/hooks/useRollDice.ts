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

// After the value is picked it is shown on the die and held for this long
// before the caller acts, so a fast auto-move (e.g. a single pawn already out)
// can't whisk the number away before the player has read it.
const DICE_REVEAL_DELAY = 800;

export const useRollDice = () => {
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    async (colour: TPlayerColour): Promise<number> => {
      if (store.getState().players.isGameEnded) throw new Error(ERRORS.gameEnded());
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
      playSound('diceRoll');
      // Single choke point: humans and bots both reach the dice through here,
      // and the value comes only from the stateless fair generator (R1–R4).
      const diceNumber = rollFairDie();
      // Reveal the rolled number straight away (the die face shows it while
      // isPlaceholderShowing is true), then hold before returning.
      dispatch(setDiceNumber({ colour, value: diceNumber }));
      // Record the finalized roll and persist the running history so per-face
      // counts accumulate across sessions (R5).
      dispatch(addRollHistoryEntry({ colour, value: diceNumber, timestamp: Date.now() }));
      saveRollHistory(store.getState().rollHistory);
      await sleep(DICE_REVEAL_DELAY);
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
      saveState(store.getState());
      return diceNumber;
    },
    [dispatch, store]
  );
};
