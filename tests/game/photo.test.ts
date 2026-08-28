import { describe, expect, it } from 'vitest';
import { fitWithin } from '../../src/game/profiles/photo';

describe('fitWithin', () => {
  it('leaves small images unchanged', () => {
    expect(fitWithin(100, 80, 320)).toEqual({ width: 100, height: 80 });
  });

  it('scales a wide image down to the max dimension preserving aspect ratio', () => {
    expect(fitWithin(1600, 800, 320)).toEqual({ width: 320, height: 160 });
  });

  it('scales a tall image down to the max dimension preserving aspect ratio', () => {
    expect(fitWithin(800, 1600, 320)).toEqual({ width: 160, height: 320 });
  });

  it('scales a square image to the max on both sides', () => {
    expect(fitWithin(1000, 1000, 320)).toEqual({ width: 320, height: 320 });
  });
});
