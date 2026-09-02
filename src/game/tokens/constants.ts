import type { Easing } from 'framer-motion';
import type { TPlayerColour, TCoordinate } from '../../types';
import type { TTokenDirection, TTokenPath } from '../../types/tokens';

export const transitionStates = {
  forward: {
    timingFn: 'easeInOut',
    // ~30% faster per-tile hop (was 150ms).
    durationMs: 115,
  },
  backward: {
    // Captured tokens snap home fast.
    timingFn: 'linear',
    durationMs: 40,
  },
} as const satisfies Record<TTokenDirection, { durationMs: number; timingFn: Easing }>;

// Height of the per-tile hop during a forward move, as a fraction of the token
// height — gives the pawn a bounce as it travels block to block.
export const FORWARD_HOP_FRACTION = 0.5;

export const GENERAL_TOKEN_PATH: TTokenPath[] = [
  {
    startCoords: { x: 6, y: 13 },
    endCoords: { x: 6, y: 9 },
  },
  {
    startCoords: { x: 5, y: 8 },
    endCoords: { x: 1, y: 8 },
  },
  {
    startCoords: { x: 0, y: 8 },
    endCoords: { x: 0, y: 6 },
  },
  {
    startCoords: { x: 1, y: 6 },
    endCoords: { x: 5, y: 6 },
  },
  {
    startCoords: { x: 6, y: 5 },
    endCoords: { x: 6, y: 1 },
  },
  {
    startCoords: { x: 6, y: 0 },
    endCoords: { x: 8, y: 0 },
  },
  {
    startCoords: { x: 8, y: 1 },
    endCoords: { x: 8, y: 5 },
  },
  {
    startCoords: { x: 9, y: 6 },
    endCoords: { x: 13, y: 6 },
  },
  {
    startCoords: { x: 14, y: 6 },
    endCoords: { x: 14, y: 8 },
  },
  {
    startCoords: { x: 13, y: 8 },
    endCoords: { x: 9, y: 8 },
  },
  {
    startCoords: { x: 8, y: 9 },
    endCoords: { x: 8, y: 13 },
  },
  {
    startCoords: { x: 8, y: 14 },
    endCoords: { x: 6, y: 14 },
  },
];

// Layout matches the design art (board.png): green = top-left, red = top-right,
// yellow = bottom-left, blue = bottom-right. Each colour's home column runs from
// its arm into the centre: green = left arm, red = top arm, yellow = bottom arm,
// blue = right arm.
export const TOKEN_HOME_ENTRY_PATH: Record<TPlayerColour, TTokenPath> = {
  yellow: {
    startCoords: { x: 7, y: 13 },
    endCoords: { x: 7, y: 8 },
  },
  green: {
    startCoords: { x: 1, y: 7 },
    endCoords: { x: 6, y: 7 },
  },
  red: {
    startCoords: { x: 7, y: 1 },
    endCoords: { x: 7, y: 6 },
  },
  blue: {
    startCoords: { x: 13, y: 7 },
    endCoords: { x: 8, y: 7 },
  },
};

export const TOKEN_START_COORDINATES: Record<TPlayerColour, TCoordinate> = {
  yellow: { x: 6, y: 13 },
  green: { x: 1, y: 6 },
  red: { x: 8, y: 1 },
  blue: { x: 13, y: 8 },
};

export const TOKEN_SAFE_COORDINATES: TCoordinate[] = [
  ...Object.values(TOKEN_START_COORDINATES),
  { x: 8, y: 12 },
  { x: 2, y: 8 },
  { x: 6, y: 2 },
  { x: 12, y: 6 },
];

export const TOKEN_LOCKED_COORDINATES: Record<TPlayerColour, TCoordinate[]> = {
  // bottom-left base
  yellow: [
    { x: 1.5, y: 10.2 },
    { x: 3.5, y: 10.2 },
    { x: 1.5, y: 12.2 },
    { x: 3.5, y: 12.2 },
  ],
  // top-left base
  green: [
    { x: 1.5, y: 1.2 },
    { x: 3.5, y: 1.2 },
    { x: 1.5, y: 3.2 },
    { x: 3.5, y: 3.2 },
  ],
  // top-right base
  red: [
    { x: 10.5, y: 1.2 },
    { x: 12.5, y: 1.2 },
    { x: 10.5, y: 3.2 },
    { x: 12.5, y: 3.2 },
  ],
  // bottom-right base
  blue: [
    { x: 10.5, y: 10.2 },
    { x: 12.5, y: 10.2 },
    { x: 10.5, y: 12.2 },
    { x: 12.5, y: 12.2 },
  ],
};
