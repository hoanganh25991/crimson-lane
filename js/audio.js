// ─── AUDIO ─────────────────────────────────────────────────────────────────────
let audioCtx;
let mainThemeInterval = null;

function getAudio() {
  if(!audioCtx) {
    try { audioCtx = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)(); } catch(e){}
  }
  return audioCtx;
}

export function playSound(type) {
  const ctx = getAudio(); if(!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime;
    switch(type) {
      case 'hit': osc.type='square'; osc.frequency.value=180; gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.08); break;
      case 'magic': osc.type='sine'; osc.frequency.setValueAtTime(440,t); osc.frequency.exponentialRampToValueAtTime(220,t+0.3); gain.gain.setValueAtTime(0.15,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.4); break;
      case 'death': osc.type='sawtooth'; osc.frequency.setValueAtTime(300,t); osc.frequency.exponentialRampToValueAtTime(80,t+0.6); gain.gain.setValueAtTime(0.15,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.7); break;
      case 'levelup': osc.type='sine'; osc.frequency.setValueAtTime(523,t); osc.frequency.setValueAtTime(659,t+0.1); osc.frequency.setValueAtTime(784,t+0.2); gain.gain.setValueAtTime(0.2,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.5); break;
      case 'gold': osc.type='sine'; osc.frequency.value=880; gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.15); break;
      case 'spawn': osc.type='sine'; osc.frequency.setValueAtTime(300,t); osc.frequency.exponentialRampToValueAtTime(600,t+0.4); gain.gain.setValueAtTime(0.18,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.5); break;
      case 'ranged_hit': osc.type='square'; osc.frequency.value=220; gain.gain.setValueAtTime(0.08,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.06); break;
      case 'tower_hit': osc.type='square'; osc.frequency.value=140; gain.gain.setValueAtTime(0.13,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.09); break;
      case 'tower_death': osc.type='sawtooth'; osc.frequency.setValueAtTime(200,t); osc.frequency.exponentialRampToValueAtTime(60,t+0.8); gain.gain.setValueAtTime(0.2,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.9); break;
      case 'frost': osc.type='sine'; osc.frequency.setValueAtTime(600,t); osc.frequency.exponentialRampToValueAtTime(300,t+0.4); gain.gain.setValueAtTime(0.13,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.5); break;
      case 'shrapnel': osc.type='sawtooth'; osc.frequency.setValueAtTime(400,t); osc.frequency.exponentialRampToValueAtTime(100,t+0.3); gain.gain.setValueAtTime(0.1,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.35); break;
      case 'chain_frost': osc.type='sine'; osc.frequency.setValueAtTime(800,t); osc.frequency.exponentialRampToValueAtTime(200,t+0.6); gain.gain.setValueAtTime(0.18,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.7); break;
      case 'assassinate_channel': osc.type='sine'; osc.frequency.value=440; gain.gain.setValueAtTime(0.08,t); gain.gain.linearRampToValueAtTime(0.15,t+1.7); break;
      case 'assassinate_fire': osc.type='sawtooth'; osc.frequency.setValueAtTime(600,t); osc.frequency.exponentialRampToValueAtTime(150,t+0.5); gain.gain.setValueAtTime(0.2,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.6); break;
      case 'respawn': osc.type='sine'; osc.frequency.setValueAtTime(400,t); osc.frequency.setValueAtTime(600,t+0.15); osc.frequency.setValueAtTime(800,t+0.3); gain.gain.setValueAtTime(0.15,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.5); break;
      case 'fire': osc.type='sawtooth'; osc.frequency.setValueAtTime(200,t); osc.frequency.exponentialRampToValueAtTime(80,t+0.4); gain.gain.setValueAtTime(0.14,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.45); break;
      case 'windrun': osc.type='sine'; osc.frequency.setValueAtTime(300,t); osc.frequency.exponentialRampToValueAtTime(800,t+0.15); osc.frequency.exponentialRampToValueAtTime(400,t+0.35); gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.4); break;
      case 'buy': osc.type='sine'; osc.frequency.setValueAtTime(660,t); osc.frequency.setValueAtTime(880,t+0.08); gain.gain.setValueAtTime(0.13,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.25); break;
    }
    osc.start(t); osc.stop(t+1);
  } catch(e){}
}

export function playMainTheme() {
  // Simple procedural melody loop
  const ctx = getAudio(); if(!ctx) return;
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
      gain.gain.exponentialRampToValueAtTime(0.001, t+0.45);
      osc.start(t); osc.stop(t+0.5);
      idx++;
    } catch(e){}
  }
  playNote();
  mainThemeInterval = setInterval(playNote, 500);
}

export function stopMainTheme() {
  if(mainThemeInterval) {
    clearInterval(mainThemeInterval);
    mainThemeInterval = null;
  }
}
