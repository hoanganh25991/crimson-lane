// ─── HUD ────────────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { camera } from './scene.js';

export function showAnnouncer(text, color, dur=2500) {
  const el = document.getElementById('announcer');
  if(!el) return;
  el.textContent = text;
  el.style.color = color;
  el.style.opacity = '1';
  setTimeout(()=>el.style.opacity='0', dur-400);
}

export function floatDamageHUD(worldX, worldZ, amount, color) {
  // Re-exported from combat but can be called here for UI-only floats
  const vec = new THREE.Vector3(worldX, 1.5, worldZ);
  vec.project(camera);
  const x = (vec.x*0.5+0.5)*window.innerWidth;
  const y = (-vec.y*0.5+0.5)*window.innerHeight;
  const div = document.createElement('div');
  div.className = 'dmg-num';
  div.style.left = (x + (Math.random()-0.5)*20) + 'px';
  div.style.top = y + 'px';
  div.style.color = color;
  div.textContent = amount;
  const hud = document.getElementById('hud');
  if(hud) hud.appendChild(div);
  setTimeout(()=>div.remove(), 900);
}

export function updateHUD() {
  const h = G.playerHero;
  if(!h) return;
  const hpFill = document.getElementById('hp-bar-fill');
  const mpFill = document.getElementById('mp-bar-fill');
  const hpVal = document.getElementById('hp-val');
  const mpVal = document.getElementById('mp-val');
  const goldEl = document.getElementById('gold-display');
  const kdaEl = document.getElementById('kda-display');
  const levelEl = document.getElementById('level-display');
  const timeEl = document.getElementById('time-display');

  if(hpFill) hpFill.style.width = Math.max(0,(h.hp/h.maxHp)*100)+'%';
  if(mpFill) mpFill.style.width = Math.max(0,(h.mp/h.maxMp)*100)+'%';
  if(hpVal) hpVal.textContent = Math.ceil(h.hp)+'/'+h.maxHp;
  if(mpVal) mpVal.textContent = Math.ceil(h.mp)+'/'+h.maxMp;
  if(goldEl) goldEl.textContent = '◆ '+Math.floor(G.gold);
  if(kdaEl) kdaEl.textContent = G.kills+' / '+G.deaths+' / '+G.assists;
  if(levelEl) levelEl.textContent = 'LVL '+h.level;

  if(timeEl) {
    const sec = Math.floor(G.time); const m = Math.floor(sec/60); const s = sec%60;
    timeEl.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }

  // XP bar
  const xpFill = document.getElementById('xp-bar-fill');
  if(xpFill) xpFill.style.width = Math.max(0,(h.xp/h.xpNext)*100)+'%';

  // Portrait HP bars for all heroes
  for(const hero of G.heroList) {
    if(!hero || !hero._uid) continue;
    const portHp = document.getElementById('port-hp-' + hero._uid);
    if(portHp) portHp.style.width = Math.max(0,(hero.hp/hero.maxHp)*100)+'%';
    const portSlot = document.getElementById('port-' + hero._uid);
    if(portSlot) portSlot.classList.toggle('dead', !hero.alive);
  }

  // Skill cooldowns
  const cdKeys = ['Q','W','E','R'];
  for(const k of cdKeys) {
    const cd = G.skillCDs[k];
    const el = document.getElementById('cd'+k);
    if(el) {
      if(cd > 0) { el.style.display='flex'; el.textContent=cd.toFixed(1); }
      else { el.style.display='none'; }
    }
  }

  // Respawn
  if(!h.alive) {
    const ro = document.getElementById('respawn-overlay');
    if(ro) {
      ro.style.display='flex';
      ro.style.flexDirection='column';
      ro.style.alignItems='center';
      ro.style.justifyContent='center';
      ro.style.position='absolute';
      ro.style.inset='0';
      const rt = document.getElementById('respawn-timer');
      if(rt) rt.textContent = Math.ceil(h.respawnTimer);
    }
  } else {
    const ro = document.getElementById('respawn-overlay');
    if(ro) ro.style.display='none';
  }
}

export function updateSkillUI() {
  const h = G.playerHero; if(!h) return;
  const names = {
    lich:{Q:'FROST NOVA',W:'DARK RITUAL',E:'CHAIN FROST',R:'FROST ARMOR'},
    sniper:{Q:'SHRAPNEL',W:'HEADSHOT',E:'AIM',R:'ASSASSINATE'},
    dragon_knight:{Q:'DRGN BLOOD',W:'DRGN TAIL',E:'BREATHE',R:'ELDER FORM'},
    shadow_fiend:{Q:'SHADOWRAZE',W:'NECRO',E:'DARK PRES',R:'REQUIEM'},
    windrunner:{Q:'SHACKLE',W:'POWERSHOT',E:'WINDRUN',R:'FOCUS FIRE'}
  };
  const ns = names[h.type] || names.lich;
  for(const k of ['Q','W','E','R']) {
    const snEl = document.getElementById('sn'+k);
    if(snEl) snEl.textContent = ns[k];
    const dotsEl = document.getElementById('dots'+k);
    if(dotsEl) {
      dotsEl.innerHTML='';
      const lvl = G.skillLevels[k];
      for(let i=0;i<4;i++) {
        const d = document.createElement('div');
        d.className = 'skill-dot' + (i<lvl?' on':'');
        dotsEl.appendChild(d);
      }
    }
  }
}

export function updateMinimap() {
  const canvas = document.getElementById('minimap');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 100, H = 100;
  ctx.fillStyle='#0a1a0a';
  ctx.fillRect(0,0,W,H);

  // Camera looks from west: screen right = +Z, screen up = +X
  // Minimap must match: canvas horizontal = world Z, canvas vertical (up) = world X

  // Lanes (L-shaped side lanes + diagonal mid)
  ctx.fillStyle='#1a1208';
  ctx.fillRect(0, H-15, W, 4);   // lane along x≈10 (bottom of minimap)
  ctx.fillRect(83, 0, 4, H);     // lane along z≈85 (right of minimap)
  ctx.fillRect(13, 0, 4, H);     // lane along z≈15 (left of minimap)
  ctx.fillRect(0, 8, W, 4);      // lane along x≈90 (top of minimap)
  ctx.save(); ctx.translate(50,50); ctx.rotate(-Math.PI/4); ctx.fillRect(-2,-60,4,120); ctx.restore();

  // River
  ctx.fillStyle='#0a1a3a';
  ctx.save(); ctx.translate(50,50); ctx.rotate(Math.PI/4); ctx.fillRect(-1,-60,2,120); ctx.restore();

  // Towers — swap x↔z so minimap matches game view
  for(const t of G.towers) {
    if(!t.alive) continue;
    ctx.fillStyle = t.team==='scourge' ? '#cc4444' : '#4488cc';
    const mx = (t.z/100)*W, my = H-(t.x/100)*H;
    ctx.fillRect(mx-1.5, my-1.5, 3, 3);
  }

  // Creeps
  for(const c of G.creeps) {
    if(!c.alive) continue;
    ctx.fillStyle = c.team==='scourge' ? '#ff8844' : '#88aaff';
    const mx=(c.z/100)*W, my=H-(c.x/100)*H;
    ctx.fillRect(mx-1,my-1,2,2);
  }

  // All heroes on minimap
  const playerTeam = G.playerHero ? G.playerHero.team : 'scourge';
  for(const hero of G.heroList) {
    if(!hero || !hero.alive) continue;
    const mx=(hero.z/100)*W, my=H-(hero.x/100)*H;
    if(hero.isPlayer) {
      ctx.fillStyle='#ffff00';
      ctx.beginPath(); ctx.arc(mx,my,3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#ffff00';
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(mx,my,4,0,Math.PI*2); ctx.stroke();
    } else if(hero.team === playerTeam) {
      ctx.fillStyle='#44ff44';
      ctx.beginPath(); ctx.arc(mx,my,2.5,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle='#ff4444';
      ctx.beginPath(); ctx.arc(mx,my,2.5,0,Math.PI*2); ctx.fill();
    }
  }
}

export function drawPortrait(canvasId, heroType) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle='#0d0d1a';
  ctx.fillRect(0,0,W,H);

  const sx = W/136, sy = H/100;
  ctx.save();
  ctx.scale(sx, sy);
  if(heroType==='lich') {
    ctx.fillStyle='#8844cc'; ctx.fillRect(52,40,32,40);
    ctx.fillStyle='#5522aa'; ctx.beginPath(); ctx.arc(68,32,16,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#6633cc'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(90,20); ctx.lineTo(90,75); ctx.stroke();
    ctx.fillStyle='#00ffcc'; ctx.beginPath(); ctx.arc(90,20,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#00ffcc';
    ctx.beginPath(); ctx.arc(62,30,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,30,3,0,Math.PI*2); ctx.fill();
  } else if(heroType==='sniper') {
    ctx.fillStyle='#44aa44'; ctx.fillRect(52,40,32,40);
    ctx.fillStyle='#d4a870'; ctx.beginPath(); ctx.arc(68,32,16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#775533'; ctx.fillRect(52,18,36,16); ctx.fillRect(46,28,48,8);
    ctx.strokeStyle='#554433'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(84,40); ctx.lineTo(115,25); ctx.stroke();
    ctx.fillStyle='#2244aa';
    ctx.beginPath(); ctx.arc(62,30,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,30,2.5,0,Math.PI*2); ctx.fill();
  } else if(heroType==='dragon_knight') {
    // Armored body
    ctx.fillStyle='#cc5511'; ctx.fillRect(48,38,40,44);
    // Chest plate
    ctx.fillStyle='#ee7722'; ctx.fillRect(52,42,32,30);
    // Helm
    ctx.fillStyle='#cc5511'; ctx.beginPath(); ctx.arc(68,28,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#cc5511'; ctx.fillRect(52,28,32,14);
    // Visor
    ctx.fillStyle='#1a0800'; ctx.fillRect(54,30,28,8);
    // Horns
    ctx.fillStyle='#dd7700';
    ctx.beginPath(); ctx.moveTo(52,22); ctx.lineTo(44,10); ctx.lineTo(54,22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(84,22); ctx.lineTo(92,10); ctx.lineTo(82,22); ctx.fill();
    // Sword
    ctx.fillStyle='#ccccdd'; ctx.fillRect(94,22,8,52);
    ctx.fillStyle='#dd9900'; ctx.fillRect(90,44,18,6);
  } else if(heroType==='shadow_fiend') {
    // Dark body
    ctx.fillStyle='#220000'; ctx.fillRect(52,40,32,44);
    // Wings
    ctx.fillStyle='#550011';
    ctx.beginPath(); ctx.moveTo(52,60); ctx.lineTo(20,40); ctx.lineTo(28,70); ctx.lineTo(50,74); ctx.fill();
    ctx.beginPath(); ctx.moveTo(84,60); ctx.lineTo(116,40); ctx.lineTo(108,70); ctx.lineTo(86,74); ctx.fill();
    // Head
    ctx.fillStyle='#330000'; ctx.beginPath(); ctx.arc(68,28,16,0,Math.PI*2); ctx.fill();
    // Horns
    ctx.fillStyle='#550000';
    ctx.beginPath(); ctx.moveTo(58,20); ctx.lineTo(52,8); ctx.lineTo(62,18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(78,20); ctx.lineTo(84,8); ctx.lineTo(74,18); ctx.fill();
    // Glowing eyes
    ctx.fillStyle='#ff0000';
    ctx.beginPath(); ctx.arc(62,28,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,28,4,0,Math.PI*2); ctx.fill();
  } else if(heroType==='windrunner') {
    // Body with cape
    ctx.fillStyle='#228844'; ctx.fillRect(52,40,32,44);
    ctx.fillStyle='#115533';
    ctx.beginPath(); ctx.moveTo(52,42); ctx.lineTo(36,90); ctx.lineTo(52,82); ctx.fill();
    // Head
    ctx.fillStyle='#d4a870'; ctx.beginPath(); ctx.arc(68,30,16,0,Math.PI*2); ctx.fill();
    // Hair
    ctx.fillStyle='#aa6600';
    ctx.beginPath(); ctx.moveTo(52,24); ctx.lineTo(48,48); ctx.lineTo(56,32); ctx.fill();
    ctx.beginPath(); ctx.moveTo(84,24); ctx.lineTo(86,38); ctx.lineTo(80,30); ctx.fill();
    // Bow
    ctx.strokeStyle='#5a3a10'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(96,54,22,Math.PI*0.7,Math.PI*1.3); ctx.stroke();
    ctx.strokeStyle='#ddcc88'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(82,38); ctx.lineTo(82,70); ctx.stroke();
    // Eyes
    ctx.fillStyle='#226644';
    ctx.beginPath(); ctx.arc(62,28,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,28,2.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
