// Self-contained sound module: preloads short buffers, unlocks the Web Audio
// context on the first user gesture (required by iOS autoplay policy), and
// plays six game events while respecting a persisted mute/volume setting.

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

let audioCtx: AudioContext | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
let unlocking: Promise<void> | null = null;

// ~0.2s of silence (8kHz 8-bit mono). Looping this through a plain <audio>
// element during a user gesture flips iOS off the "ambient" audio session
// category — the one the hardware mute/ring switch silences — so Web Audio
// sound effects play even when the iPad's side switch is set to silent.
// Regenerate: node -e '... writes 0x80 samples ...' (see notes in repo history).
const SILENT_WAV =
  'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
let mediaPrimer: HTMLAudioElement | null = null;

/**
 * Plays a looping silent clip through a plain HTMLAudioElement to unstick iOS
 * from the mute-switch-silenced audio category. Must run inside a user gesture;
 * failures are swallowed (non-iOS platforms simply don't need it).
 */
function primeMediaSession(): void {
  if (typeof Audio === 'undefined') return;
  try {
    if (!mediaPrimer) {
      mediaPrimer = new Audio(SILENT_WAV);
      mediaPrimer.loop = true;
      // Keep inline so iOS never pops a fullscreen player; the content is
      // silence, so volume is irrelevant to what the user hears.
      mediaPrimer.setAttribute('playsinline', '');
      mediaPrimer.setAttribute('webkit-playsinline', '');
    }
    // play() returns undefined on very old browsers; optional-chain the catch.
    void mediaPrimer.play()?.catch(() => {});
  } catch {
    // Ignore: this is a best-effort enhancement, not required for playback.
  }
}

const listeners = new Set<() => void>();
let snapshot: Snapshot = { muted, volume };
const serverSnapshot: Snapshot = { muted: false, volume: DEFAULT_VOLUME };

function isBrowser(): boolean {
  return typeof window !== 'undefined';
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
  return !muted && audioCtx !== null && buffers[name] !== undefined;
}

/**
 * Unlocks/creates the audio context inside a user gesture and preloads all
 * buffers. Idempotent and safe to call repeatedly. On unsupported platforms or
 * SSR it resolves without doing anything.
 */
export function unlockAudio(): Promise<void> {
  if (!isBrowser()) return Promise.resolve();
  if (unlocking) return unlocking;

  unlocking = (async () => {
    try {
      // Runs before the first await, so this .play() stays inside the gesture.
      primeMediaSession();
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtx) audioCtx = new Ctor();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      await Promise.all(
        (Object.keys(SOUND_FILES) as SoundName[]).map(async (name) => {
          if (buffers[name]) return;
          const res = await fetch(SOUND_FILES[name]);
          const arrayBuffer = await res.arrayBuffer();
          buffers[name] = await audioCtx!.decodeAudioData(arrayBuffer);
        })
      );
    } catch (e) {
      logError('sound.unlockAudio')(e);
      // Reset so a later gesture retries fetch/decode. Without this, a single
      // transient failure (e.g. a cold PWA before the service worker caches
      // /sounds/*) would cache a failed attempt and silence sound all session.
      // Successfully decoded buffers are already cached and are not re-fetched.
      unlocking = null;
    }
  })();

  return unlocking;
}

/** Plays a sound. A no-op when muted, during SSR, or before audio is unlocked. */
export function playSound(name: SoundName): void {
  if (muted || !isBrowser() || !audioCtx) return;
  const buffer = buffers[name];
  if (!buffer) return;
  try {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(audioCtx.destination);
    source.start(0);
  } catch (e) {
    logError('sound.playSound')(e);
  }
}

// Test-only reset so suites can start from a clean module state.
export function __resetSoundManagerForTests(): void {
  muted = false;
  volume = DEFAULT_VOLUME;
  settingsLoaded = false;
  audioCtx = null;
  unlocking = null;
  mediaPrimer = null;
  for (const k of Object.keys(buffers) as SoundName[]) delete buffers[k];
  snapshot = { muted, volume };
}
