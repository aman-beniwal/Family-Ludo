import type { TToken } from './tokens';

export type TPlayerColour = 'blue' | 'red' | 'green' | 'yellow';

export type TPlayerNameAndColour = {
  name: string;
  colour: TPlayerColour;
};

export type TPlayer = {
  name: string;
  colour: TPlayerColour;
  isBot: boolean;
  numberOfConsecutiveSix: number;
  playerFinishTime: number;
  tokens: TToken[];
  // Links a human seat to its on-device profile so the photo can be resolved
  // from IndexedDB (null for bots or when no profile is linked). Photos are not
  // stored in Redux/the save — only this id, then looked up at render.
  profileId: string | null;
};

export type TCoordinate = {
  // The origin is the top-leftmost tile of the board
  x: number;
  y: number;
};

export type TPlayerInitData = {
  isBot: boolean;
  name: string;
  profileId: string | null;
};

export type TPlayerCount = 'two' | 'three' | 'four';
