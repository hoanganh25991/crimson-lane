// ─── HUD ────────────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { camera } from './scene.js';
import { HERO_REGISTRY } from './heroes/registry.js';
import { t } from './i18n.js';
import { getEnemiesOf } from './combat.js';
import { canLearnSkill } from './skills.js';

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
  if(goldEl) goldEl.textContent = t('hud.gold', { n: Math.floor(G.gold) });
  if(kdaEl) kdaEl.textContent = t('hud.kda', { k: G.kills, d: G.deaths, a: G.assists });
  if(levelEl) levelEl.textContent = t('hud.level', { n: h.level });
  const skillPointsEl = document.getElementById('skill-points-label');
  if (skillPointsEl) {
    const pts = h.skillPoints || 0;
    skillPointsEl.textContent = t('hud.skill_points', { n: pts });
    skillPointsEl.classList.toggle('has-points', pts > 0);
  }

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

  // Skill cooldowns + toggle-on state
  const cdKeys = ['Q','W','E','R'];
  const hudMod = h && HERO_REGISTRY[h.type];
  for(const k of cdKeys) {
    const cd = G.skillCDs[k];
    const el = document.getElementById('cd'+k);
    if(el) {
      if(cd > 0) { el.style.display='flex'; el.textContent=cd.toFixed(1); }
      else { el.style.display='none'; }
    }
    // Toggle-on highlight (blue glow when skill is toggled on)
    const btn = document.getElementById('sb'+k);
    if(btn && hudMod && hudMod.skillTypes && hudMod.skillTypes[k] === 'toggle') {
      const isOn = hudMod.getToggleState ? hudMod.getToggleState(h, k) : false;
      btn.classList.toggle('skill-toggled-on', isOn);
    }
  }

  // TP target-selection banner
  const announcer = document.getElementById('announcer');
  if(G.selectingTPTarget && announcer) {
    announcer.textContent = t('announce.tp_select');
    announcer.style.color = '#44ffcc';
    announcer.style.opacity = '1';
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

  // Attack button range gate — only light up when a target is within attack range
  const atkBtn = document.getElementById('attack-btn');
  if(atkBtn) {
    let hasTarget = false;
    if(h.alive) {
      // Same range used by doAttackNearest() in controls.js
      const range = (h.def.range || 3) + 4;
      const rangeSq = range * range;
      // Check enemy heroes + lane creeps
      const enemies = getEnemiesOf(h.team);
      for(const en of enemies) {
        if(!en.alive) continue;
        const dx = en.x - h.x, dz = en.z - h.z;
        if(dx*dx + dz*dz <= rangeSq) { hasTarget = true; break; }
      }
      // Check neutral creep camps
      if(!hasTarget && G.neutralCreeps) {
        outer: for(const camp of G.neutralCreeps) {
          if(!camp.units) continue;
          for(const u of camp.units) {
            if(!u || !u.alive) continue;
            const dx = u.x - h.x, dz = u.z - h.z;
            if(dx*dx + dz*dz <= rangeSq) { hasTarget = true; break outer; }
          }
        }
      }
    }
    atkBtn.classList.toggle('has-target', hasTarget);
  }
}

export function updateSkillUI() {
  const h = G.playerHero; if(!h) return;
  if (!h.skillLevels) h.skillLevels = { Q: 0, W: 0, E: 0, R: 0 };
  if (typeof h.skillPoints !== 'number') h.skillPoints = 0;
  G.skillLevels = h.skillLevels;
  G.skillPoints = h.skillPoints;
  const mod = HERO_REGISTRY[h.type];
  const ns = (mod && mod.skillNames) ? mod.skillNames : { Q: 'Q', W: 'W', E: 'E', R: 'R' };
  const skillTypes = (mod && mod.skillTypes) || {};
  const getMaxLevel = (key) => {
    const costs = mod?.skillCosts?.[key];
    if (Array.isArray(costs) && costs.length) return costs.length;
    const cds = mod?.skillCDs?.[key];
    if (Array.isArray(cds) && cds.length) return cds.length;
    return key === 'R' ? 3 : 4;
  };

  for(const k of ['Q','W','E','R']) {
    const snEl = document.getElementById('sn'+k);
    if(snEl) snEl.textContent = ns[k];
    const dotsEl = document.getElementById('dots'+k);
    if(dotsEl) {
      dotsEl.innerHTML='';
      const lvl = h.skillLevels[k] || 0;
      const max = getMaxLevel(k);
      for(let i=0;i<max;i++) {
        const d = document.createElement('div');
        d.className = 'skill-dot' + (i<lvl?' on':'');
        dotsEl.appendChild(d);
      }
    }
    // Apply passive / toggle styling
    const btn = document.getElementById('sb'+k);
    if(btn) {
      const skillType = skillTypes[k] || 'active';
      const lvl = h.skillLevels[k] || 0;
      const max = getMaxLevel(k);
      const learnable = canLearnSkill(h, k);
      btn.classList.toggle('skill-passive', skillType === 'passive');
      btn.classList.toggle('skill-toggle', skillType === 'toggle');
      btn.classList.toggle('skill-unlearned', lvl <= 0);
      btn.classList.toggle('learnable', learnable);
      btn.classList.toggle('locked', !learnable && lvl < max);
      let badge = btn.querySelector('.skill-type-badge');
      if(skillType === 'passive' || skillType === 'toggle') {
        if(!badge) { badge = document.createElement('span'); badge.className='skill-type-badge'; btn.appendChild(badge); }
        badge.textContent = skillType === 'passive' ? t('hud.skill_type_passive_short') : t('hud.skill_type_toggle_short');
      } else if(badge) {
        if(badge) badge.remove();
      }
      const learnBtn = document.getElementById('learn' + k);
      if (learnBtn) {
        learnBtn.style.display = learnable ? 'flex' : 'none';
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

  // Barracks
  const playerTeam = G.playerHero ? G.playerHero.team : 'scourge';
  for(const b of G.barracks) {
    if(!b.alive) continue;
    ctx.fillStyle = b.team === playerTeam ? '#88ff44' : '#ff4444';
    const mx = (b.z/100)*W, my = H-(b.x/100)*H;
    ctx.fillRect(mx-1.5, my-1.5, 3, 3);
  }

  // Creeps
  for(const c of G.creeps) {
    if(!c.alive) continue;
    ctx.fillStyle = c.team==='scourge' ? '#ff8844' : '#88aaff';
    const mx=(c.z/100)*W, my=H-(c.x/100)*H;
    ctx.fillRect(mx-1,my-1,2,2);
  }

  // Fog of war vision radii (world units, squared for fast distance check)
  const FOG_HERO_R2 = 15 * 15;
  const FOG_TOWER_R2 = 12 * 12;
  const FOG_CREEP_R2 = 10 * 10;

  function isVisibleToAlly(ex, ez) {
    for(const h of G.heroList) {
      if(!h || !h.alive || h.team !== playerTeam) continue;
      const dx = h.x - ex, dz = h.z - ez;
      if(dx*dx + dz*dz <= FOG_HERO_R2) return true;
    }
    for(const t of G.towers) {
      if(!t.alive || t.team !== playerTeam) continue;
      const dx = t.x - ex, dz = t.z - ez;
      if(dx*dx + dz*dz <= FOG_TOWER_R2) return true;
    }
    for(const c of G.creeps) {
      if(!c.alive || c.team !== playerTeam) continue;
      const dx = c.x - ex, dz = c.z - ez;
      if(dx*dx + dz*dz <= FOG_CREEP_R2) return true;
    }
    return false;
  }

  // Heroes on minimap — enemy heroes hidden by fog of war
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
      if(!isVisibleToAlly(hero.x, hero.z)) continue;
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

  const mod = HERO_REGISTRY[heroType];
  if (!mod || !mod.drawPortrait) return;
  const sx = W/136, sy = H/100;
  ctx.save();
  ctx.scale(sx, sy);
  mod.drawPortrait(ctx);
  ctx.restore();
}
