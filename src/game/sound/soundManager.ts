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

import type { NativeAudio as NativeAudioType } from '@capacitor-community/native-audio';
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

// A small pool of pre-warmed players per sound. Pooling means a rapid retrigger
// (or two effects at once) grabs a ready element instead of seeking one that's
// mid-play, which is the main source of audible lag on iOS media elements.
const POOL_SIZE = 3;
const pools: Partial<Record<SoundName, HTMLAudioElement[]>> = {};
const poolIdx: Partial<Record<SoundName, number>> = {};
let unlocked = false;
let unlocking: Promise<void> | null = null;

// In the native iOS app, play through the native audio engine (AVFoundation via
// @capacitor-community/native-audio): far lower latency than an <audio> element
// in the WKWebView, which is what caused the on-device sound lag. Falls back to
// the HTMLAudio pool if native preload fails. Always false on web.
let useNativeAudio = __NATIVE__;
// Loaded lazily (dynamic import) only in the native app, so the plugin never
// enters the web bundle or the test environment.
let nativeAudio: typeof NativeAudioType | null = null;

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
  if (muted || !unlocked) return false;
  return useNativeAudio || (pools[name]?.length ?? 0) > 0;
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
    const names = Object.keys(SOUND_FILES) as SoundName[];

    // Native app: preload every effect into the native audio engine. assetPath
    // is relative to the app's bundled `public/` folder (Capacitor copies the
    // web build there). If any preload fails, fall back to the HTMLAudio pool.
    if (useNativeAudio) {
      try {
        const mod = await import('@capacitor-community/native-audio');
        nativeAudio = mod.NativeAudio;
        await Promise.all(
          names.map((name) =>
            nativeAudio!.preload({
              assetId: name,
              assetPath: `public/sounds/${name}.wav`,
              audioChannelNum: 1,
              isUrl: false,
            })
          )
        );
        unlocked = true;
        return;
      } catch (e) {
        logError('sound.nativePreload')(e);
        useNativeAudio = false; // fall through to the HTMLAudio path below
      }
    }

    try {
      const jobs: Promise<void>[] = [];
      // Build pools and kick off each element's gesture-unlock synchronously
      // (before the first await) so every play() stays inside the user gesture.
      for (const name of names) {
        let pool = pools[name];
        if (!pool) {
          pool = [];
          for (let i = 0; i < POOL_SIZE; i++) {
            const el = new Audio(SOUND_FILES[name]);
            el.preload = 'auto';
            el.setAttribute('playsinline', '');
            el.setAttribute('webkit-playsinline', '');
            // Rewind when finished so the next play starts instantly with no
            // seek on the hot path.
            el.addEventListener('ended', () => {
              try {
                el.currentTime = 0;
              } catch {
                /* ignore */
              }
            });
            pool.push(el);
          }
          pools[name] = pool;
          poolIdx[name] = 0;
        }
        for (const el of pool) {
          // Muted so the unlock/pre-warm is inaudible (iOS ignores .volume but
          // honours .muted); flipped back off once activated. Playing through
          // also forces a decode so the first real play isn't a cold start.
          el.muted = true;
          jobs.push(
            el
              .play()
              .then(() => {
                el.pause();
                el.currentTime = 0;
              })
              .catch(() => {
                // Element stays usable; a later gesture or direct play retries.
              })
              .finally(() => {
                el.muted = false;
              })
          );
        }
      }
      await Promise.all(jobs);
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

  if (useNativeAudio && nativeAudio) {
    try {
      void nativeAudio.setVolume({ assetId: name, volume: clampVolume(volume) }).catch(() => {});
      void nativeAudio.play({ assetId: name }).catch(() => {});
    } catch (e) {
      logError('sound.playSound.native')(e);
    }
    return;
  }

  const pool = pools[name];
  if (!pool || pool.length === 0) return;
  try {
    // Prefer an idle element so we never interrupt (and re-seek) a playing one;
    // fall back to round-robin when every element is busy.
    const idx = poolIdx[name] ?? 0;
    const idle = pool.find((e) => e.paused || e.ended);
    const el = idle ?? pool[idx];
    poolIdx[name] = (idx + 1) % pool.length;

    el.muted = false;
    el.volume = clampVolume(volume); // honoured on desktop; ignored on iOS
    if (el.currentTime !== 0) el.currentTime = 0;
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
  useNativeAudio = __NATIVE__;
  nativeAudio = null;
  for (const k of Object.keys(pools) as SoundName[]) {
    delete pools[k];
    delete poolIdx[k];
  }
  snapshot = { muted, volume };
}
