// ─── AUDIO ─────────────────────────────────────────────────────────────────────
// Uses Howler.js (loaded as global via CDN) for real .wav SFX files
// Main theme uses Web Audio oscillator (no music file)

// Preload all SFX as Howl instances
const SFX = {
  hit:                  new Howl({ src: ['sounds/hit.wav'],                volume: 0.55 }),
  magic:                new Howl({ src: ['sounds/magic.wav'],              volume: 0.5  }),
  death:                new Howl({ src: ['sounds/death.wav'],              volume: 0.6  }),
  levelup:              new Howl({ src: ['sounds/levelup.wav'],            volume: 0.65 }),
  gold:                 new Howl({ src: ['sounds/gold.wav'],               volume: 0.4  }),
  spawn:                new Howl({ src: ['sounds/spawn.wav'],              volume: 0.5  }),
  ranged_hit:           new Howl({ src: ['sounds/ranged_hit.wav'],         volume: 0.45 }),
  tower_hit:            new Howl({ src: ['sounds/tower_hit.wav'],          volume: 0.5  }),
  tower_death:          new Howl({ src: ['sounds/tower_death.wav'],        volume: 0.65 }),
  frost:                new Howl({ src: ['sounds/frost.wav'],              volume: 0.55 }),
  shrapnel:             new Howl({ src: ['sounds/shrapnel.wav'],           volume: 0.5  }),
  chain_frost:          new Howl({ src: ['sounds/chain_frost.wav'],        volume: 0.6  }),
  assassinate_channel:  new Howl({ src: ['sounds/assassinate_channel.wav'],volume: 0.5  }),
  assassinate_fire:     new Howl({ src: ['sounds/assassinate_fire.wav'],   volume: 0.7  }),
  respawn:              new Howl({ src: ['sounds/respawn.wav'],            volume: 0.55 }),
  fire:                 new Howl({ src: ['sounds/fire.wav'],               volume: 0.55 }),
  windrun:              new Howl({ src: ['sounds/windrun.wav'],            volume: 0.5  }),
  buy:                  new Howl({ src: ['sounds/buy.wav'],                volume: 0.5  }),
};

export function playSound(type) {
  const sfx = SFX[type];
  if (sfx) sfx.play();
}

// ─── Main theme — procedural oscillator (no music file) ─────────────────────
let audioCtx;
let mainThemeInterval = null;

function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || /** @type {any} */(window).webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}

export function playMainTheme() {
  const ctx = getAudio(); if (!ctx) return;
  const notes = [220, 261, 293, 329, 349, 392, 440, 493];
  let idx = 0;
  function playNote() {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.value = notes[idx % notes.length] * (idx > 7 ? 0.5 : 1);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.5);
      idx++;
    } catch(e) {}
  }
  playNote();
  mainThemeInterval = setInterval(playNote, 500);
}

export function stopMainTheme() {
  if (mainThemeInterval) {
    clearInterval(mainThemeInterval);
    mainThemeInterval = null;
  }
}
