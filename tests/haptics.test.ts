import { afterEach, describe, expect, it, vi } from 'vitest';
import { vibrate } from '../src/utils/haptics';

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error cleanup optional API
  delete navigator.vibrate;
});

describe('vibrate', () => {
  it('does not throw when navigator.vibrate is absent (iPad)', () => {
    // jsdom's navigator has no vibrate by default.
    expect('vibrate' in navigator).toBe(false);
    expect(() => vibrate([0, 40, 30, 40])).not.toThrow();
  });

  it('calls navigator.vibrate when supported', () => {
    const spy = vi.fn();
    navigator.vibrate = spy;
    vibrate(50);
    expect(spy).toHaveBeenCalledWith(50);
  });

  it('swallows errors thrown by navigator.vibrate', () => {
    navigator.vibrate = () => {
      throw new Error('blocked');
    };
    expect(() => vibrate(50)).not.toThrow();
  });
});
