#!/usr/bin/env node
/**
 * Generate WAV SFX for Dota-like game. Matches js/audio.js sound types.
 * Usage: node scripts/generate-dota-sfx.js [output-dir]
 * No deps. Output: sounds/hit.wav, magic.wav, death.wav, etc.
 */

const fs = require('fs');
const path = require('path');

const SR = 44100;
const BITS = 16;
const CH = 1;

function wavHeader(dataLen) {
  const h = Buffer.alloc(44);
  let o = 0;
  h.write('RIFF', o); o += 4;
  h.writeUInt32LE(36 + dataLen, o); o += 4;
  h.write('WAVE', o); o += 4;
  h.write('fmt ', o); o += 4;
  h.writeUInt32LE(16, o); o += 4;
  h.writeUInt16LE(1, o); o += 2;
  h.writeUInt16LE(CH, o); o += 2;
  h.writeUInt32LE(SR, o); o += 4;
  h.writeUInt32LE(SR * CH * (BITS / 8), o); o += 4;
  h.writeUInt16LE(CH * (BITS / 8), o); o += 2;
  h.writeUInt16LE(BITS, o); o += 2;
  h.write('data', o); o += 4;
  h.writeUInt32LE(dataLen, o);
  return h;
}

function f16(s) {
  const x = Math.max(-1, Math.min(1, s));
  return x < 0 ? x * 0x8000 : x * 0x7FFF;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function expRamp(t, endT, from, to) {
  if (t >= endT) return to;
  const x = t / endT;
  return from * Math.pow(to / from, x);
}

function sine(freq, duration, gainEnv) {
  const n = Math.floor(SR * duration);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phase = 2 * Math.PI * freq * t;
    let g = gainEnv ? gainEnv(t, duration) : 1;
    const s = Math.sin(phase) * g;
    buf.writeInt16LE(f16(s), i * 2);
  }
  return buf;
}

function square(freq, duration, gainEnv, amplitude = 0.3) {
  const n = Math.floor(SR * duration);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phase = 2 * Math.PI * freq * t;
    let g = gainEnv ? gainEnv(t, duration) : 1;
    const s = (Math.sin(phase) >= 0 ? 1 : -1) * g;
    buf.writeInt16LE(f16(s * amplitude), i * 2);
  }
  return buf;
}

function sawtooth(freq, duration, gainEnv) {
  const n = Math.floor(SR * duration);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phase = (freq * t) % 1;
    const s = (2 * phase - 1) * (gainEnv ? gainEnv(t, duration) : 1);
    buf.writeInt16LE(f16(s * 0.25), i * 2);
  }
  return buf;
}

function sineFreqRamp(freqStart, freqEnd, duration, gainEnv) {
  const n = Math.floor(SR * duration);
  const buf = Buffer.alloc(n * 2);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / duration;
    const f = expRamp(t, duration, freqStart, freqEnd);
    phase += (2 * Math.PI * f) / SR;
    const g = gainEnv ? gainEnv(t, duration) : 1;
    buf.writeInt16LE(f16(Math.sin(phase) * g), i * 2);
  }
  return buf;
}

function sawFreqRamp(freqStart, freqEnd, duration, gainEnv) {
  const n = Math.floor(SR * duration);
  const buf = Buffer.alloc(n * 2);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = expRamp(t, duration, freqStart, freqEnd);
    phase += f / SR;
    const s = (2 * (phase % 1) - 1) * (gainEnv ? gainEnv(t, duration) : 1);
    buf.writeInt16LE(f16(s * 0.25), i * 2);
  }
  return buf;
}

function gainExpDecay(attack, decayEnd) {
  return (t, dur) => {
    if (t >= decayEnd) return 0.001;
    return Math.exp(Math.log(0.001) * (t / decayEnd));
  };
}

function gainExpDecayFrom(level, decayEnd) {
  return (t, dur) => {
    if (t >= decayEnd) return 0.001;
    return level * Math.exp(Math.log(0.001 / level) * (t / decayEnd));
  };
}

const sounds = {
  hit: () => square(180, 0.08, (t, d) => 0.45 * Math.exp(-t / 0.02), 0.75),
  magic: () => sineFreqRamp(440, 220, 0.4, gainExpDecayFrom(0.15, 0.4)),
  death: () => sawFreqRamp(300, 80, 0.7, gainExpDecayFrom(0.15, 0.7)),
  levelup: () => {
    const b1 = sine(523, 0.1, () => 0.2);
    const b2 = sine(659, 0.1, () => 0.2);
    const b3 = sine(784, 0.3, (t) => 0.2 * Math.exp(-t / 0.15));
    return Buffer.concat([b1, b2, b3]);
  },
  gold: () => sine(880, 0.15, gainExpDecayFrom(0.12, 0.15)),
  spawn: () => sineFreqRamp(300, 600, 0.5, gainExpDecayFrom(0.18, 0.5)),
  ranged_hit: () => square(220, 0.06, gainExpDecayFrom(0.4, 0.06), 0.7),
  tower_hit: () => square(140, 0.09, gainExpDecayFrom(0.5, 0.09), 0.75),
  tower_death: () => sawFreqRamp(200, 60, 0.9, gainExpDecayFrom(0.2, 0.9)),
  frost: () => sineFreqRamp(600, 300, 0.5, gainExpDecayFrom(0.13, 0.5)),
  shrapnel: () => sawFreqRamp(400, 100, 0.35, gainExpDecayFrom(0.1, 0.35)),
  chain_frost: () => sineFreqRamp(800, 200, 0.7, gainExpDecayFrom(0.18, 0.7)),
  assassinate_channel: () => sine(440, 1.7, (t) => lerp(0.08, 0.15, t / 1.7)),
  assassinate_fire: () => sawFreqRamp(600, 150, 0.6, gainExpDecayFrom(0.2, 0.6)),
  respawn: () => {
    const b1 = sine(400, 0.15, () => 0.15);
    const b2 = sine(600, 0.15, () => 0.15);
    const b3 = sine(800, 0.2, (t) => 0.15 * Math.exp(-t / 0.1));
    return Buffer.concat([b1, b2, b3]);
  },
  fire: () => sawFreqRamp(200, 80, 0.45, gainExpDecayFrom(0.14, 0.45)),
  windrun: () => {
    const n = Math.floor(SR * 0.4);
    const buf = Buffer.alloc(n * 2);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let f = t < 0.15 ? lerp(300, 800, t / 0.15) : lerp(800, 400, (t - 0.15) / 0.25);
      phase += (2 * Math.PI * f) / SR;
      const g = 0.12 * Math.exp(-t / 0.2);
      buf.writeInt16LE(f16(Math.sin(phase) * g), i * 2);
    }
    return buf;
  },
  buy: () => {
    const b1 = sine(660, 0.08, () => 0.13);
    const b2 = sine(880, 0.17, (t) => 0.13 * Math.exp(-t / 0.08));
    return Buffer.concat([b1, b2]);
  },
};

function main() {
  const outDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'sounds'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, fn] of Object.entries(sounds)) {
    const pcm = fn();
    const header = wavHeader(pcm.length);
    const wavPath = path.join(outDir, `${name}.wav`);
    fs.writeFileSync(wavPath, Buffer.concat([header, pcm]));
    console.log('Written:', wavPath);
  }
  console.log('Done. Generated', Object.keys(sounds).length, 'sounds for Dota-like game.');
}

main();
