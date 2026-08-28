/**
 * Returns an independent, uniform die roll in the range [1, 6].
 *
 * Uses the Web Crypto API (`crypto.getRandomValues`) with rejection sampling to
 * remove modulo bias, so every face 1..6 has probability exactly 1/6 with no
 * dependence on previous rolls.
 *
 * It deliberately takes NO arguments and holds NO state: a roll can never be
 * conditioned on the player, board, capture, score, turn, or bot logic. This is
 * the single source of dice values for both humans and bots (plan R1–R3).
 */
export function rollFairDie(): number {
  const values = new Uint32Array(1);
  // Largest multiple of 6 below 2^32. Any draw at or above this would bias the
  // modulo, so we reject and re-draw until we land in the unbiased range.
  const limit = 4_294_967_292;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return (values[0] % 6) + 1;
}
