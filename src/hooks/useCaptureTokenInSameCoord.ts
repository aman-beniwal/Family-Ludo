import { useDispatch } from 'react-redux';
import {
  deactivateAllTokens,
  lockToken,
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
import tokenStyles from '../pages/Play/components/Token/Token.module.css';

const CAPTURE_FLASH_MS = 450;

// Adds the impact-flash class to a captured token's element for the duration of
// the flash animation, then removes it so a later capture can replay it.
function flashCapturedToken(elementId: string): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.add(tokenStyles.captured);
  window.setTimeout(() => el.classList.remove(tokenStyles.captured), CAPTURE_FLASH_MS);
}

export function useCaptureTokenInSameCoord() {
  const dispatch = useDispatch();
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
        const uniqueId = getGloballyUniqueTokenId(colour, id);
        const entry = tokenMotionRegistry.get(uniqueId);
        if (!entry) continue;
        flashCapturedToken(uniqueId);
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
    },
    [dispatch, getPosition]
  );
}
