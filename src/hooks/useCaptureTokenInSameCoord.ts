import { useDispatch, useStore } from 'react-redux';
import {
  deactivateAllTokens,
  lockToken,
  recordCapture,
  setIsAnyTokenMoving,
  setTokenAlignmentData,
} from '../state/slices/playersSlice';
import { type TSequenceCalculationResult } from '../types';
import { type TToken } from '../types';
import { useCallback } from 'react';
import { transitionStates } from '../game/tokens/constants';
import { defaultTokenAlignmentData } from '../game/tokens/alignment';
import { getGloballyUniqueTokenId } from '../game/tokens/logic';
import { useCoordsToPosition } from './useCoordsToPosition';
import { tokenMotionRegistry } from '../game/movement/tokenMotionRegistry';
import { sleep } from '../utils/sleep';
import { playSound } from '../game/sound/soundManager';
import { vibrate } from '../utils/haptics';
import { saveState } from '../game/storage/saveState';
import type { RootState } from '../state/store';

export function useCaptureTokenInSameCoord() {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const getPosition = useCoordsToPosition();

  return useCallback(
    async (
      captureData: TSequenceCalculationResult['captureData'],
      capturingToken: TToken
    ): Promise<void> => {
      dispatch(deactivateAllTokens(capturingToken.colour));
      dispatch(setIsAnyTokenMoving(true));
      // Capture feedback: sound + best-effort haptics as the captured token(s)
      // start heading home (R14). Haptics is a no-op on iPad.
      if (captureData.length > 0) {
        playSound('capture');
        vibrate([0, 40, 30, 40]);
        // Tally the capture for the panel counters (R12/R13): capturer's kills
        // and each captured token owner's deaths.
        dispatch(
          recordCapture({
            capturer: capturingToken.colour,
            captured: captureData.map((cd) => cd.token.colour),
          })
        );
      }
      dispatch(
        setTokenAlignmentData({
          colour: capturingToken.colour,
          id: capturingToken.id,
          newAlignmentData: defaultTokenAlignmentData,
        })
      );

      const { durationMs, timingFn } = transitionStates.backward;
      const animationPromises: Promise<void>[] = [];
      for (let i = 0; i < captureData.length; i++) {
        const { token, moveSequence } = captureData[i];
        const { colour, id } = token;
        const entry = tokenMotionRegistry.get(getGloballyUniqueTokenId(colour, id));
        if (!entry) continue;
        entry.flashCapture();
        entry.setExternallyAnimating(true);
        dispatch(
          setTokenAlignmentData({ colour, id, newAlignmentData: defaultTokenAlignmentData })
        );
        const animateToken = async () => {
          for (const coord of moveSequence) {
            const { x, y } = getPosition(coord, defaultTokenAlignmentData);
            await entry.animateTo(x, y, { duration: durationMs / 1000, ease: timingFn });
          }
          entry.setExternallyAnimating(false);
          dispatch(lockToken({ colour, id }));
        };
        animationPromises.push(animateToken());
        if (i < captureData.length - 1) await sleep(250);
      }
      if (animationPromises.length !== 0) await Promise.all(animationPromises);
      dispatch(setIsAnyTokenMoving(false));
      // Persist after the movement lock clears so the updated kill/death counts
      // (and the captured tokens' locked positions) survive an immediate reload.
      if (captureData.length > 0) saveState(store.getState());
    },
    [dispatch, getPosition, store]
  );
}
