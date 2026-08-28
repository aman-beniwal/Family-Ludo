// Generates the six short game sound effects as 16-bit PCM WAV files.
//
// The sounds are fully synthesized here (no third-party audio), so they carry
// no licensing constraints, stay tiny, and are guaranteed to work offline once
// precached. Re-run with `node scripts/generate-sounds.mjs` to regenerate.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');

function encodeWav(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

// 5ms attack ramp + exponential decay, avoids clicks at start/end.
function envelope(t, duration, tau) {
  const attack = Math.min(1, t / 0.005);
  const release = Math.min(1, (duration - t) / 0.01);
  return attack * release * Math.exp(-t / tau);
}

function render(duration, fn) {
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = fn(t) * 0.9;
  }
  return out;
}

const sine = (freq, t) => Math.sin(2 * Math.PI * freq * t);

function tone(duration, freq, tau, gain = 0.6) {
  return render(duration, (t) => sine(freq, t) * envelope(t, duration, tau) * gain);
}

// A short sequence of notes played back to back.
function arpeggio(notes, noteDur, tau) {
  const total = notes.length * noteDur;
  return render(total, (t) => {
    const idx = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const localT = t - idx * noteDur;
    return sine(notes[idx], localT) * envelope(localT, noteDur, tau) * 0.6;
  });
}

// Two notes ringing together (a chord).
function chord(duration, freqs, tau) {
  return render(
    duration,
    (t) => (freqs.reduce((acc, f) => acc + sine(f, t), 0) / freqs.length) *
      envelope(t, duration, tau) *
      0.6
  );
}

function diceRoll() {
  const duration = 0.36;
  // Amplitude-modulated noise: a rattling shake.
  return render(duration, (t) => {
    const rattle = 0.5 + 0.5 * Math.sin(2 * Math.PI * 22 * t);
    const noise = Math.random() * 2 - 1;
    return noise * rattle * envelope(t, duration, 0.14) * 0.5;
  });
}

function capture() {
  const duration = 0.28;
  // Downward pitch sweep + a touch of noise: an impact.
  return render(duration, (t) => {
    const freq = 520 - (520 - 120) * (t / duration);
    const noise = (Math.random() * 2 - 1) * 0.2;
    return (sine(freq, t) + noise) * envelope(t, duration, 0.1) * 0.6;
  });
}

const sounds = {
  move: tone(0.09, 660, 0.03),
  turn: tone(0.11, 392, 0.04),
  diceRoll: diceRoll(),
  capture: capture(),
  home: chord(0.42, [659.25, 987.77], 0.18), // E5 + B5 chime
  win: arpeggio([523.25, 659.25, 783.99, 1046.5], 0.16, 0.12), // C-E-G-C fanfare
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const path = join(OUT_DIR, `${name}.wav`);
  writeFileSync(path, encodeWav(samples));
  console.log(`wrote ${path} (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}
