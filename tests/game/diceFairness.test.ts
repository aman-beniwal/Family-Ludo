import { describe, expect, it } from 'vitest';
import { rollFairDie } from '../../src/game/dice/rollFairDie';

/**
 * Fair-dice audit (plan U11 / gate for R1–R3).
 *
 * This proves the uniformity and serial-independence of THIS build's dice
 * (rollFairDie). It says nothing about any commercial Ludo app's dice — it is a
 * guarantee about our own generator only.
 *
 * Uniformity is checked with a chi-square goodness-of-fit test against a pinned
 * significance level of p < 0.001. Independence is checked with a lag-1 serial
 * correlation, so a stateful RNG defect (e.g. a polyfill that reuses state) is
 * caught rather than slipping past a frequency-only test.
 */

const SAMPLE_SIZE = 60_000;
const FACES = [1, 2, 3, 4, 5, 6] as const;

// Critical chi-square value for 5 degrees of freedom (6 faces - 1) at the pinned
// alpha = 0.001. If the statistic exceeds this, uniformity is rejected.
const CHI_SQUARE_CRITICAL_DF5_P001 = 20.515;

// Lag-1 serial correlation tolerance. For an independent sequence the sample
// correlation has standard error ~1/sqrt(N) ≈ 0.004 at N = 60k, so 0.02 is a
// ~5-sigma band: tight enough to catch a stateful defect, loose enough not to
// flake on honest randomness.
const SERIAL_CORRELATION_TOLERANCE = 0.02;

function drawSample(n: number): number[] {
  const sample: number[] = new Array<number>(n);
  for (let i = 0; i < n; i++) sample[i] = rollFairDie();
  return sample;
}

function chiSquareStatistic(sample: number[]): number {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const v of sample) counts[v]++;
  const expected = sample.length / FACES.length;
  return FACES.reduce((acc, face) => {
    const diff = counts[face] - expected;
    return acc + (diff * diff) / expected;
  }, 0);
}

function lag1Correlation(sample: number[]): number {
  const n = sample.length;
  const mean = sample.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const d = sample[i] - mean;
    denominator += d * d;
    if (i < n - 1) numerator += d * (sample[i + 1] - mean);
  }
  return numerator / denominator;
}

describe('dice fairness audit', () => {
  const sample = drawSample(SAMPLE_SIZE);

  it('has zero arity so it cannot be conditioned on game state (R3)', () => {
    expect(rollFairDie.length).toBe(0);
  });

  it('produces every face with none missing', () => {
    const seen = new Set(sample);
    expect(seen).toEqual(new Set(FACES));
  });

  it('is uniform: chi-square within the p < 0.001 bound (R1)', () => {
    const stat = chiSquareStatistic(sample);
    expect(stat).toBeLessThan(CHI_SQUARE_CRITICAL_DF5_P001);
  });

  it('shows no serial dependence: lag-1 correlation near zero (R1)', () => {
    const r = lag1Correlation(sample);
    expect(Math.abs(r)).toBeLessThan(SERIAL_CORRELATION_TOLERANCE);
  });
});
