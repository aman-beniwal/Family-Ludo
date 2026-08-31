import type { TPlayerColour, TPlayerCount } from '../../types';

export const playerColours = {
  blue: '#1295e7ff',
  red: '#ff0002ff',
  green: '#049645ff',
  yellow: '#ffde15ff',
} as const;

export const MAX_PLAYER_NAME_LENGTH = 15;
// Turn order follows the board clockwise: blue (bottom-right) → yellow
// (bottom-left) → green (top-left) → red (top-right). Fewer-player games keep
// that same relative rotation, dropping the unused colours.
export const playerSequences: Record<TPlayerCount, TPlayerColour[]> = {
  two: ['blue', 'green'],
  three: ['blue', 'green', 'red'],
  four: ['blue', 'yellow', 'green', 'red'],
} as const;
