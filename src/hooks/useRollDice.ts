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

// Cosmetic tumble: flash this many random faces before the die lands, so the
// roll reads as a spin. These values are decorative only — never recorded and
// never the outcome (the real value comes from rollFairDie below).
const SPIN_TICKS = 7;
const SPIN_INTERVAL = 70;
// After the value lands it is held for this long before the caller acts, so a
// fast auto-move (e.g. a single pawn already out) can't whisk the number away
// before the player has read it.
const DICE_REVEAL_DELAY = 650;

// A random 1–6 face that differs from the previous one, so the tumble never
// appears to stall on a repeated value.
function nextSpinFace(previous: number): number {
  const face = Math.floor(Math.random() * 5) + 1;
  return face >= previous ? face + 1 : face;
}

export const useRollDice = () => {
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    async (colour: TPlayerColour): Promise<number> => {
      if (store.getState().players.isGameEnded) throw new Error(ERRORS.gameEnded());
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
      playSound('diceRoll');
      // Tumble through a few random faces (fast), purely visual.
      let face = 0;
      for (let i = 0; i < SPIN_TICKS; i++) {
        face = nextSpinFace(face);
        dispatch(setDiceNumber({ colour, value: face }));
        await sleep(SPIN_INTERVAL);
      }
      // Single choke point: humans and bots both reach the dice through here,
      // and the value comes only from the stateless fair generator (R1–R4).
      const diceNumber = rollFairDie();
      // Land on the real value and hold it so it's clearly readable.
      dispatch(setDiceNumber({ colour, value: diceNumber }));
      // Record the finalized roll and persist the running history so per-face
      // counts accumulate across sessions (R5) — only the landed value counts.
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
