import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetSoundManagerForTests,
  canPlay,
  clampVolume,
  getSnapshot,
  getVolume,
  isMuted,
  loadSoundSettings,
  playSound,
  setMuted,
  setVolume,
  SOUND_MUTED_KEY,
  SOUND_VOLUME_KEY,
} from '../../src/game/sound/soundManager';

beforeEach(() => {
  localStorage.clear();
  __resetSoundManagerForTests();
});

describe('sound manager', () => {
  it('clamps volume and defaults NaN', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(NaN)).toBeGreaterThan(0);
  });

  it('defaults to unmuted', () => {
    expect(isMuted()).toBe(false);
  });

  it('persists mute across a reload', () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('true');
    // Simulate a fresh load: reset in-memory state, then re-read storage.
    __resetSoundManagerForTests();
    expect(isMuted()).toBe(false);
    loadSoundSettings();
    expect(isMuted()).toBe(true);
  });

  it('persists volume across a reload', () => {
    setVolume(0.35);
    expect(getVolume()).toBeCloseTo(0.35);
    expect(localStorage.getItem(SOUND_VOLUME_KEY)).toBe('0.35');
    __resetSoundManagerForTests();
    loadSoundSettings();
    expect(getVolume()).toBeCloseTo(0.35);
  });

  it('reports canPlay false when muted', () => {
    setMuted(true);
    expect(canPlay('diceRoll')).toBe(false);
  });

  it('playSound is a safe no-op when muted or when audio is not unlocked', () => {
    setMuted(true);
    expect(() => playSound('capture')).not.toThrow();
    setMuted(false);
    // No AudioContext has been unlocked (jsdom), so it must still not throw.
    expect(() => playSound('capture')).not.toThrow();
  });

  it('exposes a snapshot that reflects setting changes', () => {
    expect(getSnapshot().muted).toBe(false);
    setMuted(true);
    expect(getSnapshot().muted).toBe(true);
    setVolume(0.2);
    expect(getSnapshot().volume).toBeCloseTo(0.2);
  });
});
