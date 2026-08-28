import type { TPlayerColour } from './players';

export type TRollHistoryEntry = {
  colour: TPlayerColour;
  value: number;
  timestamp: number;
};

export type TFaceCounts = Record<1 | 2 | 3 | 4 | 5 | 6, number>;
