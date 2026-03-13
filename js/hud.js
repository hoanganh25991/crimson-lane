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

  // Portrait HP bars
  const portHpPlayer = document.getElementById('port-hp-player');
  if(portHpPlayer) portHpPlayer.style.width = Math.max(0,(h.hp/h.maxHp)*100)+'%';
  const portSlotPlayer = document.getElementById('port-player');
  if(portSlotPlayer) portSlotPlayer.classList.toggle('dead', !h.alive);

  if(G.aiHero) {
    const ai = G.aiHero;
    const portHpEnemy = document.getElementById('port-hp-enemy');
    if(portHpEnemy) portHpEnemy.style.width = Math.max(0,(ai.hp/ai.maxHp)*100)+'%';
    const portSlotEnemy = document.getElementById('port-enemy');
    if(portSlotEnemy) portSlotEnemy.classList.toggle('dead', !ai.alive);
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
    sniper:{Q:'SHRAPNEL',W:'HEADSHOT',E:'AIM',R:'ASSASSINATE'}
  };
  const ns = names[h.type];
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

  // Lanes
  ctx.fillStyle='#1a1208';
  ctx.fillRect(0,13,100,4);    // bot lane
  ctx.fillRect(0,1,100,4);     // top lane
  ctx.save(); ctx.translate(50,50); ctx.rotate(Math.PI/4); ctx.fillRect(-2,-60,4,120); ctx.restore();

  // River
  ctx.fillStyle='#0a1a3a';
  ctx.save(); ctx.translate(50,50); ctx.rotate(-Math.PI/4); ctx.fillRect(-1,-60,2,120); ctx.restore();

  // Towers
  for(const t of G.towers) {
    if(!t.alive) continue;
    ctx.fillStyle = t.team==='scourge' ? '#cc4444' : '#4488cc';
    const mx = (t.x/100)*W, mz = (t.z/100)*H;
    ctx.fillRect(mx-1.5, H-mz-1.5, 3, 3);
  }

  // Creeps
  for(const c of G.creeps) {
    if(!c.alive) continue;
    ctx.fillStyle = c.team==='scourge' ? '#ff8844' : '#88aaff';
    const mx=(c.x/100)*W, mz=(c.z/100)*H;
    ctx.fillRect(mx-1,H-mz-1,2,2);
  }

  // AI hero
  if(G.aiHero && G.aiHero.alive) {
    ctx.fillStyle='#ff4444';
    const mx=(G.aiHero.x/100)*W, mz=(G.aiHero.z/100)*H;
    ctx.beginPath(); ctx.arc(mx,H-mz,2.5,0,Math.PI*2); ctx.fill();
  }

  // Player hero
  if(G.playerHero && G.playerHero.alive) {
    ctx.fillStyle='#ffff00';
    const mx=(G.playerHero.x/100)*W, mz=(G.playerHero.z/100)*H;
    ctx.beginPath(); ctx.arc(mx,H-mz,3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ffff00';
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(mx,H-mz,4,0,Math.PI*2); ctx.stroke();
  }
}

export function drawPortrait(canvasId, heroType) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle='#0d0d1a';
  ctx.fillRect(0,0,W,H);

  if(heroType==='lich') {
    // Scale for different canvas sizes
    const sx = W/136, sy = H/100;
    ctx.save();
    ctx.scale(sx, sy);
    // Body
    ctx.fillStyle='#8844cc';
    ctx.fillRect(52,40,32,40);
    // Head
    ctx.fillStyle='#5522aa';
    ctx.beginPath(); ctx.arc(68,32,16,0,Math.PI*2); ctx.fill();
    // Staff
    ctx.strokeStyle='#6633cc'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(90,20); ctx.lineTo(90,75); ctx.stroke();
    // Orb
    ctx.fillStyle='#00ffcc';
    ctx.beginPath(); ctx.arc(90,20,6,0,Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle='#00ffcc';
    ctx.beginPath(); ctx.arc(62,30,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,30,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  } else {
    // Sniper
    const sx = W/136, sy = H/100;
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle='#44aa44';
    ctx.fillRect(52,40,32,40);
    ctx.fillStyle='#d4a870';
    ctx.beginPath(); ctx.arc(68,32,16,0,Math.PI*2); ctx.fill();
    // Hat
    ctx.fillStyle='#775533';
    ctx.fillRect(52,18,36,16); ctx.fillRect(46,28,48,8);
    // Rifle
    ctx.strokeStyle='#554433'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(84,40); ctx.lineTo(115,25); ctx.stroke();
    // Eyes
    ctx.fillStyle='#2244aa';
    ctx.beginPath(); ctx.arc(62,30,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(74,30,2.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}
