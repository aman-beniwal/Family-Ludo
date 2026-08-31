import type { TCoordinate, TPlayerColour } from '../../types';
import type { TTokenPath } from '../../types';
import { TOKEN_HOME_ENTRY_PATH, GENERAL_TOKEN_PATH } from './constants';

export function getIntegersBetween(a: number, b: number): number[] {
  if (a === b) return [a];
  let result = [];
  const start = Math.min(a, b) + 1;
  const end = Math.max(a, b);

  for (let i = start; i < end; i++) {
    result.push(i);
  }

  if (a > b) result = result.reverse();

  return [a, ...result, b];
}

export function expandTokenPath(tokenPaths: TTokenPath[]): TCoordinate[] {
  const expandedPath: TCoordinate[] = [];
  for (let i = 0; i < tokenPaths.length; i++) {
    const path = tokenPaths[i];
    const isVertical = path.startCoords.x === path.endCoords.x;
    const staticCoordinateComponent = isVertical ? path.startCoords.x : path.startCoords.y;
    const variableStartCoordinate = isVertical ? path.startCoords.y : path.startCoords.x;
    const variableEndCoordinate = isVertical ? path.endCoords.y : path.endCoords.x;

    const variableCoordinates = getIntegersBetween(variableStartCoordinate, variableEndCoordinate);

    for (let j = 0; j < variableCoordinates.length; j++) {
      if (isVertical)
        expandedPath.push({
          x: staticCoordinateComponent,
          y: variableCoordinates[j],
        });
      else
        expandedPath.push({
          x: variableCoordinates[j],
          y: staticCoordinateComponent,
        });
    }
  }

  return expandedPath;
}

export const expandedTokenHomeEntryPath = Object.fromEntries(
  Object.entries(TOKEN_HOME_ENTRY_PATH).map(([key, value]) => [key, expandTokenPath([value])])
) as Record<TPlayerColour, TCoordinate[]>;

export const expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH);

// GENERAL_TOKEN_PATH starts at the bottom arm (yellow's start). Each colour
// enters the ring one arm further round: yellow=0, green=3, red=6, blue=9
// (matches the board.png layout — green TL / red TR / yellow BL / blue BR).
function genTokenPath(sliceOffset: number, colour: TPlayerColour): TCoordinate[] {
  const path =
    sliceOffset === 0
      ? GENERAL_TOKEN_PATH
      : [...GENERAL_TOKEN_PATH.slice(sliceOffset), ...GENERAL_TOKEN_PATH.slice(0, sliceOffset)];
  const expandedRing = expandTokenPath(path).slice(0, -1);
  return [...expandedRing, ...expandedTokenHomeEntryPath[colour]];
}

const yellowTokenPath = genTokenPath(0, 'yellow');
const greenTokenPath = genTokenPath(3, 'green');
const redTokenPath = genTokenPath(6, 'red');
const blueTokenPath = genTokenPath(9, 'blue');

export const tokenPaths: Record<TPlayerColour, TCoordinate[]> = {
  blue: blueTokenPath,
  red: redTokenPath,
  green: greenTokenPath,
  yellow: yellowTokenPath,
};
