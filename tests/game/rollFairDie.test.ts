import { describe, expect, it } from 'vitest';
import { rollFairDie } from '../../src/game/dice/rollFairDie';

describe('rollFairDie', () => {
  it('returns only integers 1-6 over a large sample', () => {
    const faces = new Set<number>();
    for (let i = 0; i < 20000; i++) {
      const v = rollFairDie();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      faces.add(v);
    }
    // Every face should appear at least once over a large sample.
    expect(faces).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('takes zero arguments so it cannot be conditioned on game state (R3)', () => {
    expect(rollFairDie.length).toBe(0);
  });
});
