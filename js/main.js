// ─── MAIN ENTRY POINT ──────────────────────────────────────────────────────────
import { HERO_DEFS, CREEP_SPAWN_INTERVAL, GOLD_TICK, GOLD_PER_TICK } from './constants.js';
import { G } from './state.js';
import { initThree, scene, camera, renderer, camTarget, updateCamera } from './scene.js';
import { buildMap } from './map.js';
import { createHero } from './heroes.js';
import { spawnWave, updateCreeps } from './creeps.js';
import { buildTowers, updateTowers } from './towers.js';
import { updateProjectiles, moveToward, spawnProjectile, floatDamage, applyDamage } from './combat.js';
import { updateSkillCDs, castSkill, processAssassinateEffect } from './skills.js';
import { updateAI } from './ai.js';
import { initControls, toggleAttackMode, joystick, keys } from './controls.js';
import { updateHUD, updateMinimap, updateSkillUI, showAnnouncer, drawPortrait } from './hud.js';
import { playSound, playMainTheme, stopMainTheme } from './audio.js';
import { spawnParticles, updateParticles, updateEffects } from './particles.js';

// ─── Expose HUD functions for combat.js bridge ──────────────────────────────────
window._hudFns = { showAnnouncer, updateSkillUI };

// ─── Expose endGame for combat.js bridge ────────────────────────────────────────
window._endGame = endGame;

// ─── Shrapnel tick handler ───────────────────────────────────────────────────────
// Registered after module loads so combat is available
window._shrapnelTick = function(e) {
  // Deal DPS in shrapnel zone to all enemies of whoever cast it
  // Shrapnel is always cast targeting enemies, so apply to enemies of player's team
  const ph = G.playerHero;
  if(!ph) return;
  // Get all units not on player team (i.e., enemies)
  const allUnits = [...G.creeps, ...G.towers];
  if(G.aiHero && G.aiHero.alive) allUnits.push(G.aiHero);
  for(const en of allUnits) {
    if(!en.alive) continue;
    if(en.team === ph.team) continue; // skip allies
    const dx=en.x-e.x, dz=en.z-e.z;
    if(Math.sqrt(dx*dx+dz*dz)<=e.radius) {
      applyDamage(en, e.dps*0.5, 'magic');
      en.slowTimer = 0.7;
    }
  }
};

// Clock
const clock = {last:0};

const ALL_HEROES = ['lich','sniper','dragon_knight','shadow_fiend','windrunner'];

// ─── HERO SELECT ──────────────────────────────────────────────────────────────
export function selectHero(type) {
  G.pickedHero = type;
  for(const h of ALL_HEROES) {
    const el = document.getElementById('pick-'+h);
    if(el) el.classList.toggle('selected', h===type);
  }
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').textContent = 'START GAME';
}

// ─── GAME START ────────────────────────────────────────────────────────────────
export function startGame() {
  if(!G.pickedHero) return;
  G.phase = 'game';
  document.getElementById('lobby').style.display='none';
  document.getElementById('hud').style.display='block';

  initThree();
  buildMap();
  buildTowers();

  const playerTeam = HERO_DEFS[G.pickedHero].team;
  const opponents = ALL_HEROES.filter(h => HERO_DEFS[h].team !== playerTeam);
  const aiType = opponents[Math.floor(Math.random() * opponents.length)];
  G.playerHero = createHero(G.pickedHero, true);
  G.aiHero = createHero(aiType, false);
  G.aiHero.wpIndex = 0;

  const heroNameEl = document.getElementById('hero-name');
  if(heroNameEl) heroNameEl.textContent = HERO_DEFS[G.pickedHero].name;
  updateSkillUI();

  // Draw small portraits in topbar
  drawPortrait('port-canvas-player', G.pickedHero);
  drawPortrait('port-canvas-enemy', aiType);

  // Wire minimap click
  const minimapEl = document.getElementById('minimap');
  if(minimapEl) {
    minimapEl.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width;
      const fz = 1 - (e.clientY - rect.top) / rect.height;
      camTarget.set(fx*100, 0, fz*100);
    });
  }

  // Init controls
  initControls();

  // Spawn initial creep wave
  spawnWave();

  // Sound
  playMainTheme();
  setTimeout(()=>playSound('spawn'), 800);

  requestAnimationFrame(loop);
}

// ─── GOLD + INCOME ─────────────────────────────────────────────────────────────
function updateGold(dt) {
  G.goldTimer += dt;
  if(G.goldTimer >= GOLD_TICK) {
    G.goldTimer -= GOLD_TICK;
    G.gold += GOLD_PER_TICK;
  }
}

// ─── WIN CONDITION ─────────────────────────────────────────────────────────────
export function endGame(playerWon) {
  G.phase = 'end';
  stopMainTheme();
  const el = document.getElementById('endscreen');
  el.style.display='flex';
  el.style.flexDirection='column';
  el.style.alignItems='center';
  el.style.justifyContent='center';
  document.getElementById('end-title').textContent = playerWon ? 'VICTORY' : 'DEFEAT';
  document.getElementById('end-title').style.color = playerWon ? '#ffcc44' : '#ff2222';
  document.getElementById('end-sub').textContent = playerWon ? 'The enemy Ancient has been destroyed.' : 'Your Ancient has fallen.';
}

// ─── HERO UPDATE ───────────────────────────────────────────────────────────────
function updateHeroes(dt) {
  const h = G.playerHero;
  if(h) {
    if(!h.alive) {
      h.respawnTimer -= dt;
      if(h.respawnTimer <= 0) respawnHero(h);
      // Don't return here so AI still updates
    } else {
      if(h.slowTimer>0) h.slowTimer-=dt;
      if(h.stunTimer>0){h.stunTimer-=dt;}
      else if(h.channeling>0){h.channeling-=dt;}
      else {
        // Arrow/WASD continuous movement (with camera fix: screen-up = world +x+z)
        let kx=0, kz=0;
        if(keys['ArrowUp']   ||keys['w']||keys['W']) { kx+=1; kz+=1; }
        if(keys['ArrowDown'] ||keys['s']||keys['S']) { kx-=1; kz-=1; }
        if(keys['ArrowRight']||keys['d']||keys['D']) { kx+=1; kz-=1; }
        if(keys['ArrowLeft']) { kx-=1; kz+=1; }
        if(kx!==0||kz!==0) {
          const len=Math.sqrt(kx*kx+kz*kz);
          const spd = h.def.move * (h.slowTimer>0?0.7:1) * (h.windrunActive?1.5:1);
          h.x=Math.max(1,Math.min(99,h.x+(kx/len)*spd*dt));
          h.z=Math.max(1,Math.min(99,h.z+(kz/len)*spd*dt));
          h.group.position.set(h.x,0,h.z);
          h.group.rotation.y = Math.atan2(kx, kz);
          h.moveTarget=null;
        }

        // Joystick movement (using world-relative direction)
        if(joystick.active) {
          const spd = h.def.move * (h.slowTimer>0?0.7:1) * (h.windrunActive?1.5:1);
          h.x = Math.max(0.5, Math.min(99.5, h.x + joystick.wx*spd*dt));
          h.z = Math.max(0.5, Math.min(99.5, h.z + joystick.wz*spd*dt));
          h.group.position.x = h.x;
          h.group.position.z = h.z;
          if(Math.abs(joystick.wx)>0.01||Math.abs(joystick.wz)>0.01) {
            h.group.rotation.y = Math.atan2(joystick.wx, joystick.wz);
          }
          h.moveTarget = null;
        }

        // Click-to-move
        if(h.moveTarget && !joystick.active && kx===0 && kz===0) {
          const dx=h.moveTarget.x-h.x, dz=h.moveTarget.z-h.z;
          const d=Math.sqrt(dx*dx+dz*dz);
          if(d > 0.3) {
            const spd = h.def.move*(h.slowTimer>0?0.7:1);
            const mv = Math.min(d, spd*dt);
            h.x += (dx/d)*mv; h.z += (dz/d)*mv;
            h.group.position.x=h.x; h.group.position.z=h.z;
            h.group.rotation.y = Math.atan2(dx,dz);
          } else { h.moveTarget=null; }
        }

        // Focus Fire forces target lock (Windrunner R)
        if(h.focusFireActive && h.focusFireTarget && h.focusFireTarget.alive) {
          h.attackTarget = h.focusFireTarget;
        }

        // Auto-attack
        if(h.attackTarget && h.attackTarget.alive) {
          const dx=h.attackTarget.x-h.x, dz=h.attackTarget.z-h.z;
          const d=Math.sqrt(dx*dx+dz*dz);
          const range = h.def.range
            + (h.type==='sniper' ? G.skillLevels['E']*3 : 0)
            + (h.dragonFormActive ? 10 : 0);
          if(d > range) {
            if(!joystick.active && kx===0 && kz===0) moveToward(h, h.attackTarget.x, h.attackTarget.z, dt);
          } else {
            h.moveTarget=null;
            h.atkTimer -= dt;
            const effectiveAtkCd = (h.focusFireActive && h.focusFireTarget) ? Math.min(h.atkCd, 0.18) : h.atkCd;
            if(h.atkTimer<=0) {
              h.atkTimer = effectiveAtkCd;
              h.group.rotation.y = Math.atan2(dx,dz);
              let dmg = h.def.dmgMin + Math.random()*(h.def.dmgMax-h.def.dmgMin);
              let onHitFn = null;
              if(h.type==='sniper' && G.skillLevels['W']>0 && Math.random()<0.4) {
                dmg += [30,55,80,115][G.skillLevels['W']-1]||30;
                onHitFn = (t)=>{ if(t&&t.alive){ t.stunTimer=0.5; floatDamage(t.x,t.z,'HEADSHOT!','#ffcc44'); } };
              }
              // Necromastery bonus (Shadow Fiend W)
              if(h.type==='shadow_fiend' && G.skillLevels['W']>0) {
                dmg += h.soulStacks * 2;
              }
              spawnProjectile(h, h.attackTarget, h.team==='scourge'?0xcc88ff:0x88ccff, dmg, 'physical', onHitFn);
              playSound(h.def.range <= 3 ? 'hit' : 'ranged_hit');
            }
          }
        }
      }

      // HP bar update
      h.hpFillMesh.scale.x = Math.max(0.001, h.hp/h.maxHp);
      h.hpFillMesh.position.x = -(1-h.hp/h.maxHp)*0.6;
      h.mpFillMesh.scale.x = Math.max(0.001, h.mp/h.maxMp);
      h.mpFillMesh.position.x = -(1-h.mp/h.maxMp)*0.6;

      // Billboard HP bars face camera
      h.hpFillMesh.rotation.y = -h.group.rotation.y;
      h.mpFillMesh.rotation.y = -h.group.rotation.y;

      // Mana regen near fountain
      const fountain = h.team==='scourge'?{x:10,z:10}:{x:90,z:90};
      const fdx=h.x-fountain.x, fdz=h.z-fountain.z;
      if(Math.sqrt(fdx*fdx+fdz*fdz)<10) {
        h.hp = Math.min(h.maxHp, h.hp + 30*dt);
        h.mp = Math.min(h.maxMp, h.mp + 15*dt);
      }

      // Dragon Blood passive regen (Dragon Knight Q)
      if(h.type==='dragon_knight' && G.skillLevels['Q']>0) {
        const regen = [1,2,3,4][G.skillLevels['Q']-1]||1;
        h.hp = Math.min(h.maxHp, h.hp + regen*dt);
      }

      // Buff timers
      if(h.dragonFormActive) { h.dragonFormTimer-=dt; if(h.dragonFormTimer<=0) h.dragonFormActive=false; }
      if(h.windrunActive) { h.windrunTimer-=dt; if(h.windrunTimer<=0) h.windrunActive=false; }
      if(h.focusFireActive) { h.focusFireTimer-=dt; if(h.focusFireTimer<=0){h.focusFireActive=false;h.focusFireTarget=null;} }

      // Windrun speed multiplier already applied via slowTimer check — override move speed
    }
  }

  // AI hero
  if(G.aiHero) {
    const ai = G.aiHero;
    if(!ai.alive) {
      ai.respawnTimer -= dt;
      if(ai.respawnTimer<=0) respawnHero(ai);
    } else {
      updateAI(ai, dt);
      // Dragon Blood passive for AI Dragon Knight
      if(ai.type==='dragon_knight') ai.hp = Math.min(ai.maxHp, ai.hp + 2*dt);
      ai.hpFillMesh.scale.x = Math.max(0.001, ai.hp/ai.maxHp);
      ai.hpFillMesh.position.x = -(1-ai.hp/ai.maxHp)*0.6;
      ai.mpFillMesh.scale.x = Math.max(0.001, ai.mp/ai.maxMp);
      ai.mpFillMesh.position.x = -(1-ai.mp/ai.maxMp)*0.6;
    }
  }

  // Tower HP bars
  for(const t of G.towers) {
    if(!t.alive) continue;
    t.hpFill.scale.x = Math.max(0.001, t.hp/t.maxHp);
    t.hpFill.position.x = -(1-t.hp/t.maxHp);
  }
}

function respawnHero(hero) {
  hero.alive = true;
  hero.group.visible = true;
  const spawn = hero.team==='scourge'?{x:10,z:10}:{x:90,z:90};
  hero.x = spawn.x; hero.z = spawn.z;
  hero.group.position.set(spawn.x, 0, spawn.z);
  hero.hp = hero.maxHp; hero.mp = hero.maxMp;
  hero.attackTarget = null; hero.moveTarget = null;
  hero.channeling = 0;
  if(hero.isPlayer) {
    showAnnouncer('— RESPAWNED —', '#88aaff', 1500);
    playSound('respawn');
  }
  spawnParticles(hero.x, hero.z, hero.team==='scourge'?0xff2200:0x2244ff, 8);
}

// ─── MAIN LOOP ─────────────────────────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min((ts - (clock.last||ts))/1000, 0.05);
  clock.last = ts;

  if(G.phase === 'game') {
    G.time += dt;

    updateSkillCDs(dt);
    updateHeroes(dt);
    updateCreeps(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    // Process assassinate before effects update
    for(const e of G.effects) {
      if(e.type==='crosshair' && e.life - dt <= 0 && e.heroRef && e.target && e.life > 0) {
        processAssassinateEffect(e);
      }
    }
    updateEffects(dt);
    updateCamera(dt, G.playerHero);
    updateGold(dt);
    updateHUD();
    updateMinimap();

    // Spawn waves
    G.lastSpawn += dt;
    if(G.lastSpawn >= CREEP_SPAWN_INTERVAL) {
      G.lastSpawn = 0;
      spawnWave();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ─── LOBBY SETUP ──────────────────────────────────────────────────────────────
window.selectHero = selectHero;
window.startGame = startGame;
window.castSkill = castSkill;
window.toggleAttackMode = toggleAttackMode;

// Draw lobby portraits on load
drawPortrait('lich-portrait','lich');
drawPortrait('sniper-portrait','sniper');
drawPortrait('dragon_knight-portrait','dragon_knight');
drawPortrait('shadow_fiend-portrait','shadow_fiend');
drawPortrait('windrunner-portrait','windrunner');
