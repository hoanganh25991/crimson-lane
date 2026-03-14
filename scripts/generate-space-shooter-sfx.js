#!/usr/bin/env node
/**
 * Generate laser, explosion, pickup WAVs for space shooter. No deps.
 * Usage: node scripts/generate-space-shooter-sfx.js [output-dir]
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

function createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  let offset = 0;
  header.write('RIFF', offset); offset += 4;
  header.writeUInt32LE(36 + dataLength, offset); offset += 4;
  header.write('WAVE', offset); offset += 4;
  header.write('fmt ', offset); offset += 4;
  header.writeUInt32LE(16, offset); offset += 4;
  header.writeUInt16LE(1, offset); offset += 2;
  header.writeUInt16LE(numChannels, offset); offset += 2;
  header.writeUInt32LE(sampleRate, offset); offset += 4;
  header.writeUInt32LE(byteRate, offset); offset += 4;
  header.writeUInt16LE(blockAlign, offset); offset += 2;
  header.writeUInt16LE(bitsPerSample, offset); offset += 2;
  header.write('data', offset); offset += 4;
  header.writeUInt32LE(dataLength, offset);
  return header;
}

function floatTo16(sample) {
  const s = Math.max(-1, Math.min(1, sample));
  return s < 0 ? s * 0x8000 : s * 0x7FFF;
}

function tone(freq, durationSec, sampleRate, envelope) {
  const len = Math.floor(sampleRate * durationSec);
  const buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    let amp = Math.sin(2 * Math.PI * freq * t);
    if (envelope) amp *= envelope(i, len);
    buf.writeInt16LE(floatTo16(amp), i * 2);
  }
  return buf;
}

function noise(durationSec, sampleRate, envelope) {
  const len = Math.floor(sampleRate * durationSec);
  const buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    let amp = (Math.random() * 2 - 1);
    if (envelope) amp *= envelope(i, len);
    buf.writeInt16LE(floatTo16(amp), i * 2);
  }
  return buf;
}

function expDecay(i, len) {
  return Math.exp(-(i / len) * 6);
}
function shortDecay(i, len) {
  const t = i / len;
  return 1 - t * t;
}

// Laser: high sweep + tight noise "pew"
function generateLaser() {
  const dur = 0.18;
  const len = Math.floor(SAMPLE_RATE * dur);
  const buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const f = 800 + (2800 - 800) * (t / dur);
    const env = Math.exp(-t * 25) * 0.6;
    const tone = Math.sin(2 * Math.PI * f * t) * env;
    const n = (Math.random() * 2 - 1) * env * 0.3;
    buf.writeInt16LE(floatTo16(tone + n), i * 2);
  }
  return buf;
}

// Explosion: low rumble + noise burst
function generateExplosion() {
  const dur = 0.4;
  const len = Math.floor(SAMPLE_RATE * dur);
  const buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8);
    const rumble = Math.sin(2 * Math.PI * 60 * t) * env * 0.5;
    const n = (Math.random() * 2 - 1) * env * 0.5;
    buf.writeInt16LE(floatTo16(rumble + n), i * 2);
  }
  return buf;
}

// Pickup: two-tone ascending ping
function generatePickup() {
  const b1 = tone(880, 0.06, SAMPLE_RATE, shortDecay);
  const pad = Buffer.alloc(Math.floor(SAMPLE_RATE * 0.03) * 2);
  const b2 = tone(1320, 0.14, SAMPLE_RATE, (i, len) => (i > SAMPLE_RATE * 0.04 ? shortDecay(i - SAMPLE_RATE * 0.04, len - SAMPLE_RATE * 0.04) : 0));
  return Buffer.concat([b1, pad, b2]);
}

const presets = {
  laser: generateLaser,
  explosion: generateExplosion,
  pickup: generatePickup,
};

function main() {
  const outDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'sounds'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, fn] of Object.entries(presets)) {
    const pcm = fn();
    const header = createWavHeader(pcm.length, SAMPLE_RATE, NUM_CHANNELS, BITS_PER_SAMPLE);
    const wavPath = path.join(outDir, `${name}.wav`);
    fs.writeFileSync(wavPath, Buffer.concat([header, pcm]));
    console.log('Written:', wavPath);
  }
  console.log('Done. Use sounds/laser.wav, sounds/explosion.wav, sounds/pickup.wav in your game.');
}

main();
