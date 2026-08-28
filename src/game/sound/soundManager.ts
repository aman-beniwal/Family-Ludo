// Self-contained sound module: preloads short buffers, unlocks the Web Audio
// context on the first user gesture (required by iOS autoplay policy), and
// plays six game events while respecting a persisted mute/volume setting.

export type SoundName = 'diceRoll' | 'move' | 'capture' | 'home' | 'turn' | 'win';

export const SOUND_FILES: Record<SoundName, string> = {
  diceRoll: '/sounds/diceRoll.wav',
  move: '/sounds/move.wav',
  capture: '/sounds/capture.wav',
  home: '/sounds/home.wav',
  turn: '/sounds/turn.wav',
  win: '/sounds/win.wav',
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
    console.error(e);
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
      console.error(e);
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
      console.error(e);
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
      console.error('Audio unlock failed', e);
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
    console.error(e);
  }
}

// Test-only reset so suites can start from a clean module state.
export function __resetSoundManagerForTests(): void {
  muted = false;
  volume = DEFAULT_VOLUME;
  settingsLoaded = false;
  audioCtx = null;
  unlocking = null;
  for (const k of Object.keys(buffers) as SoundName[]) delete buffers[k];
  snapshot = { muted, volume };
}
