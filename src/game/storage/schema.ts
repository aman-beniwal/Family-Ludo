import * as z from 'zod';
import type { TPlayerColour } from '../../types';
import { MAX_PLAYER_NAME_LENGTH } from '../players/constants';

const coloursSchema = z.literal(['blue', 'red', 'green', 'yellow'] satisfies TPlayerColour[]);

const tokenSchema = z.object({
  id: z.number(),
  coordinates: z.object({ x: z.number(), y: z.number() }),
  isLocked: z.boolean(),
  isActive: z.boolean(),
  hasTokenReachedHome: z.boolean(),
});

const diceSchema = z.object({
  diceNumber: z.number(),
  colour: coloursSchema,
});

const playerSchema = z.object({
  name: z.string().max(MAX_PLAYER_NAME_LENGTH).min(1),
  colour: coloursSchema,
  isBot: z.boolean(),
  numberOfConsecutiveSix: z.number(),
  playerFinishTime: z.number(),
  tokens: tokenSchema.array().length(4),
  // Added in SAVE_VERSION 2 so a resumed game shows the same profile photo/name.
  profileId: z.string().nullable(),
  // Capture counters. Optional-with-default so saves written before these
  // fields existed still validate and load (backfilling 0) instead of being
  // discarded — the loader does a single strict parse with no migration step,
  // and SAVE_VERSION is intentionally NOT bumped (the "load last game" gate
  // rejects any version mismatch, which would drop in-progress games).
  kills: z.number().default(0),
  deaths: z.number().default(0),
  // Optional-with-default so saves written before pawn styles existed still
  // validate and load (backfilling 'jelly'), no SAVE_VERSION bump needed.
  pawnStyle: z.enum(['jelly', 'agent', 'cone']).default('jelly'),
});

export const schema = z.object({
  version: z.number(),
  saveTime: z.number(),
  currentPlayerColour: coloursSchema,
  playerFinishOrder: coloursSchema.array().max(4),
  players: playerSchema.array().max(4).min(2),
  dice: diceSchema.array().max(4).min(2),
  session: z.object({
    gameStartTime: z.number(),
    gameInactiveTime: z.number(),
  }),
});

export type TStoredStateSchema = z.infer<typeof schema>;
export type TStoredTokenSchema = z.infer<typeof tokenSchema>;
export type TStoredPlayerSchema = z.infer<typeof playerSchema>;
