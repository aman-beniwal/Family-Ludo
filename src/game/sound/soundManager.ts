// Self-contained sound module. Playback goes through HTMLAudioElements (one per
// event) rather than the Web Audio API: on iOS/iPadOS, Web Audio output obeys
// the hardware ring/mute switch, but <audio>/<video> media playback ignores it —
// so routing the effects through media elements is what makes them audible on
// iPad with the switch set to silent. Elements are "unlocked" on the first user
// gesture (iOS autoplay policy) and playback respects a persisted mute/volume.
//
// iOS caveat: media-element .volume is read-only there (hardware-controlled), so
// the in-app volume slider only scales effect loudness on desktop; on iOS the
// effects play at system volume. Muting still fully silences them everywhere.

import { logError } from '../../utils/logError';

export type SoundName = 'diceRoll' | 'move' | 'capture' | 'home' | 'turn' | 'win';

// BASE_URL is '/' locally and '/Family-Ludo/' on the GitHub Pages build, so the
// fetched URL matches the service worker's precached URL in both.
const BASE = import.meta.env.BASE_URL;
export const SOUND_FILES: Record<SoundName, string> = {
  diceRoll: `${BASE}sounds/diceRoll.wav`,
  move: `${BASE}sounds/move.wav`,
  capture: `${BASE}sounds/capture.wav`,
  home: `${BASE}sounds/home.wav`,
  turn: `${BASE}sounds/turn.wav`,
  win: `${BASE}sounds/win.wav`,
};

export const SOUND_MUTED_KEY = 'libreludo-sound-muted';
export const SOUND_VOLUME_KEY = 'libreludo-sound-volume';
const DEFAULT_VOLUME = 0.8;

export function clampVolume(v: number): number {
  if (Number.isNaN(v)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, v));
}

type Snapshot = { muted: boolean; volume: number };

let muted = false;
let volume = DEFAULT_VOLUME;
let settingsLoaded = false;

const elements: Partial<Record<SoundName, HTMLAudioElement>> = {};
let unlocked = false;
let unlocking: Promise<void> | null = null;

const listeners = new Set<() => void>();
let snapshot: Snapshot = { muted, volume };
const serverSnapshot: Snapshot = { muted: false, volume: DEFAULT_VOLUME };

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function hasAudioElement(): boolean {
  return typeof Audio !== 'undefined';
}

function emit(): void {
  snapshot = { muted, volume };
  listeners.forEach((l) => l());
}

/** Reads persisted mute/volume once. Safe to call during SSR (no-op). */
export function loadSoundSettings(): void {
  if (settingsLoaded || !isBrowser()) return;
  settingsLoaded = true;
  try {
    muted = localStorage.getItem(SOUND_MUTED_KEY) === 'true';
    const storedVol = localStorage.getItem(SOUND_VOLUME_KEY);
    if (storedVol !== null) volume = clampVolume(parseFloat(storedVol));
  } catch (e) {
    logError('sound.loadSettings')(e);
  }
  emit();
}

export function isMuted(): boolean {
  return muted;
}

export function getVolume(): number {
  return volume;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (isBrowser()) {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(next));
    } catch (e) {
      logError('sound.setMuted')(e);
    }
  }
  emit();
}

export function setVolume(next: number): void {
  volume = clampVolume(next);
  if (isBrowser()) {
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
    } catch (e) {
      logError('sound.setVolume')(e);
    }
  }
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Snapshot {
  return snapshot;
}

export function getServerSnapshot(): Snapshot {
  return serverSnapshot;
}

/** True only when a real, playable sound is available and not muted. */
export function canPlay(name: SoundName): boolean {
  return !muted && unlocked && elements[name] !== undefined;
}

/**
 * Creates one HTMLAudioElement per sound and "unlocks" each inside a user
 * gesture: a muted play()/pause() marks the element user-activated on iOS, so
 * later unmuted plays work and route through the media pathway (which ignores
 * the mute switch). Idempotent; a no-op during SSR or where Audio is missing.
 */
export function unlockAudio(): Promise<void> {
  if (!isBrowser() || !hasAudioElement()) return Promise.resolve();
  if (unlocking) return unlocking;

  unlocking = (async () => {
    try {
      const names = Object.keys(SOUND_FILES) as SoundName[];
      // Kick off every element's gesture-unlock synchronously (before the first
      // await), so each play() call stays inside the triggering user gesture.
      await Promise.all(
        names.map(async (name) => {
          let el = elements[name];
          if (!el) {
            el = new Audio(SOUND_FILES[name]);
            el.preload = 'auto';
            el.setAttribute('playsinline', '');
            el.setAttribute('webkit-playsinline', '');
            elements[name] = el;
          }
          // Muted so the unlock is inaudible (iOS ignores .volume but honours
          // .muted); flipped back off once activated.
          el.muted = true;
          try {
            await el.play();
            el.pause();
            el.currentTime = 0;
          } catch {
            // Element stays usable; a later gesture or direct play can retry.
          } finally {
            el.muted = false;
          }
        })
      );
      unlocked = true;
    } catch (e) {
      logError('sound.unlockAudio')(e);
      // Reset so a later gesture retries. Successfully created elements are
      // cached and simply re-unlocked.
      unlocking = null;
    }
  })();

  return unlocking;
}

/** Plays a sound. A no-op when muted, during SSR, or before audio is unlocked. */
export function playSound(name: SoundName): void {
  if (muted || !isBrowser()) return;
  const el = elements[name];
  if (!el) return;
  try {
    el.muted = false;
    el.volume = clampVolume(volume); // honoured on desktop; ignored on iOS
    el.currentTime = 0;
    void el.play()?.catch(() => {});
  } catch (e) {
    logError('sound.playSound')(e);
  }
}

// Test-only reset so suites can start from a clean module state.
export function __resetSoundManagerForTests(): void {
  muted = false;
  volume = DEFAULT_VOLUME;
  settingsLoaded = false;
  unlocked = false;
  unlocking = null;
  for (const k of Object.keys(elements) as SoundName[]) delete elements[k];
  snapshot = { muted, volume };
}
