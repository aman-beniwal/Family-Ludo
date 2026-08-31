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
  // Capture stats shown in the player panels: kills = opponent tokens this
  // player captured; deaths = this player's tokens captured by others.
  kills: number;
  deaths: number;
  tokens: TToken[];
  // Links a human seat to its on-device profile so the photo can be resolved
  // from IndexedDB (null for bots or when no profile is linked). Photos are not
  // stored in Redux/the save — only this id, then looked up at render.
  profileId: string | null;
  // Anti-frustration counter: consecutive turns this player rolled with every
  // token still stuck in base (never a 6). After enough such turns the next
  // roll is forced to a 6 so they finally get a pawn out. Optional so saves
  // written before it existed still resume, defaulting to 0.
  turnsStuckInBase?: number;
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
