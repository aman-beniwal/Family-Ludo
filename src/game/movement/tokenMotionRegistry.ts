import type { Easing, MotionValue } from 'framer-motion';

type TokenMotionEntry = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  setExternallyAnimating: (v: boolean) => void;
  animateTo: (
    x: number,
    y: number,
    transition: { duration: number; ease: Easing }
  ) => Promise<void>;
  // Plays the capture impact flash on the token. Owned by the Token component,
  // which holds the DOM node and its CSS module, so hooks never reach into a
  // page component's DOM/styles directly.
  flashCapture: () => void;
};

export const tokenMotionRegistry = new Map<string, TokenMotionEntry>();
