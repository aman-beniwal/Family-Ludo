import { type RootState, type AppDispatch } from './../state/store';
import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { TPlayerColour } from '../types';
import { setIsPlaceholderShowing, setIsSpinning, setDiceNumber } from '../state/slices/diceSlice';
import { recordExitRoll } from '../state/slices/playersSlice';
import { rollFairDie } from '../game/dice/rollFairDie';
import { addRollHistoryEntry } from '../state/slices/rollHistorySlice';
import { saveRollHistory } from '../game/storage/rollHistory';
import { playSound } from '../game/sound/soundManager';
import { saveState } from '../game/storage/saveState';
import { sleep } from '../utils/sleep';
import { ERRORS } from '../utils/errors';

// How long the rolling-dice Lottie spins before the die lands. Purely visual —
// the outcome is decided only after it, below. Kept short so the roll feels
// snappy alongside the faster playback speed.
const SPIN_DURATION = 500;
// After the value lands it is held for this long before the caller acts, so a
// fast auto-move (e.g. a single pawn already out) can't whisk the number away
// before the player has read it.
const DICE_REVEAL_DELAY = 650;
// Anti-frustration rule: if a player rolls this many turns with every token
// still stuck in base and never a 6, the next roll is forced to a 6 so they
// finally get a pawn out.
const STUCK_TURNS_BEFORE_PITY_SIX = 5;

export const useRollDice = () => {
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    async (colour: TPlayerColour): Promise<number> => {
      if (store.getState().players.isGameEnded) throw new Error(ERRORS.gameEnded());
      // Is this player fully stuck in base, and stuck long enough to be owed a
      // pity 6? Read before the spin so the outcome is settled up front.
      const player = store.getState().players.players.find((p) => p.colour === colour);
      const allInBase = !!player && player.tokens.every((t) => t.isLocked && !t.hasTokenReachedHome);
      const owedPitySix = allInBase && (player?.turnsStuckInBase ?? 0) >= STUCK_TURNS_BEFORE_PITY_SIX;

      // isPlaceholderShowing stays true for the whole roll (spin + reveal) so
      // the roll button never reappears; isSpinning gates the tumble itself.
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
      dispatch(setIsSpinning({ colour, isSpinning: true }));
      playSound('diceRoll');
      // Let the rolling-dice Lottie spin.
      await sleep(SPIN_DURATION);
      // Single choke point: humans and bots both reach the dice through here.
      // The value is the stateless fair generator (R1–R4) unless the player is
      // owed a pity 6 for being stuck in base too long.
      const diceNumber = owedPitySix ? 6 : rollFairDie();
      // Update the stuck-in-base streak from what actually landed.
      dispatch(recordExitRoll({ colour, allInBase, rolledSix: diceNumber === 6 }));
      // Land: stop the tumble and show the number (placeholder still true, so
      // it's the number on screen — not the roll button).
      dispatch(setDiceNumber({ colour, value: diceNumber }));
      dispatch(setIsSpinning({ colour, isSpinning: false }));
      // Record the finalized roll and persist the running history so per-face
      // counts accumulate across sessions (R5) — only the landed value counts.
      dispatch(addRollHistoryEntry({ colour, value: diceNumber, timestamp: Date.now() }));
      saveRollHistory(store.getState().rollHistory);
      // Hold the number so it's clearly readable, then end the roll. The caller
      // then acts (activating tokens / auto-move) which keeps the number up.
      await sleep(DICE_REVEAL_DELAY);
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
      saveState(store.getState());
      return diceNumber;
    },
    [dispatch, store]
  );
};
