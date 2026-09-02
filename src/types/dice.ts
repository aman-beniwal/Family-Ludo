import type { TPlayerColour } from './players';

export type TDice = {
  colour: TPlayerColour;
  diceNumber: number;
  // True for the whole roll (spin + the hold that keeps the rolled number
  // readable) — it suppresses the roll button. `isSpinning` is the narrower
  // window where the tumbling animation plays; once it clears, the landed
  // number shows while the roll is still "in progress".
  isPlaceholderShowing: boolean;
  isSpinning?: boolean;
};
