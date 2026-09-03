import type { TPlayerColour, TPlayer, TCoordinate } from '../../types';
import type { TToken } from '../../types';
import { areCoordsEqual } from '../coords/logic';
import { getDistanceInTokenPath, getHomeCoordForColour } from '../coords/logic';
import { tokenPaths } from './paths';

export function isAnyTokenActiveOfColour(colour: TPlayerColour, players: TPlayer[]): boolean {
  const player = players.find((p) => p.colour === colour);
  if (!player || !player.tokens) return false;
  return player.tokens.some((t) => t.isActive);
}

export function tokensWithCoord(coord: TCoordinate, players: TPlayer[]): TToken[] {
  const allTokens = players.flatMap((p) => p.tokens);
  return allTokens.filter((t) => areCoordsEqual(t.coordinates, coord));
}

export function getAvailableSteps({ colour, coordinates }: TToken): number {
  return getDistanceInTokenPath(colour, coordinates, getHomeCoordForColour(colour));
}

export function isTokenMovable(token: TToken, diceNumber?: number): boolean {
  if (!diceNumber) return !token.isLocked && !token.hasTokenReachedHome;
  return !token.isLocked && !token.hasTokenReachedHome && getAvailableSteps(token) >= diceNumber;
}

export function getGloballyUniqueTokenId(colour: TPlayerColour, id: number): string {
  return `${colour}_${id}`;
}

/**
 * A player's overall completion rate (0–100), rounded. Each pawn travels the
 * full path — 57 tiles including the final home spot — so the total to finish
 * is 57 × 4 = 228 steps. A pawn in base counts 0; on the path it counts its
 * 1-based position; home counts the full path length. So 100 combined steps →
 * round(100 / 228 × 100) = 44%, and all four home → 100%.
 */
export function getPlayerProgressPercent(colour: TPlayerColour, tokens: TToken[]): number {
  if (tokens.length === 0) return 0;
  const path = tokenPaths[colour];
  const stepsPerPawn = path.length;
  const stepsTaken = tokens.reduce((sum, t) => {
    if (t.hasTokenReachedHome) return sum + stepsPerPawn;
    const idx = path.findIndex((c) => areCoordsEqual(c, t.coordinates));
    return sum + (idx >= 0 ? idx + 1 : 0);
  }, 0);
  return Math.round((stepsTaken / (stepsPerPawn * tokens.length)) * 100);
}
