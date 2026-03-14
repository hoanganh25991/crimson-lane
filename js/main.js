// ─── MAIN ENTRY POINT ──────────────────────────────────────────────────────────
import { HERO_DEFS, CREEP_SPAWN_INTERVAL, GOLD_TICK, GOLD_PER_TICK } from './constants.js';
import { G } from './state.js';
import { initThree, scene, camera, renderer, camTarget, updateCamera } from './scene.js';
import { buildMap } from './map.js';
import { createHero } from './heroes.js';
import { spawnWave, updateCreeps, initNeutralCamps, updateNeutralCamps } from './creeps.js';
import { buildTowers, buildBarracks, updateTowers, updateBarracks } from './towers.js';
import { updateProjectiles, moveToward, spawnProjectile, floatDamage, applyDamage } from './combat.js';
import { updateSkillCDs, castSkill, processAssassinateEffect } from './skills.js';
import { updateAI } from './ai.js';
import { initControls, joystick, keys } from './controls.js';
import { updateHUD, updateMinimap, updateSkillUI, showAnnouncer, drawPortrait } from './hud.js';
import { playSound, playMainTheme, stopMainTheme } from './audio.js';
import { spawnParticles, updateParticles, updateEffects } from './particles.js';
import { updateHeroAnim } from './animations.js';
import { buyItem, useItem, updateItemCooldowns, updateAIItems, ITEM_DEFS } from './items.js';

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
  buildBarracks();

  const others = ALL_HEROES.filter(h => h !== G.pickedHero);
  const aiType = others[Math.floor(Math.random() * others.length)];
  // Team and spawn come only from chosen side (G.playerSide), not from hero type
  const playerSide = G.playerSide || 'scourge';
  const playerBase = playerSide === 'sentinel' ? { x: 90, z: 90 } : { x: 10, z: 10 };
  const aiBase = playerSide === 'sentinel' ? { x: 10, z: 10 } : { x: 90, z: 90 };

  G.playerHero = createHero(G.pickedHero, true);
  G.playerHero.team = playerSide;
  G.playerHero.x = playerBase.x;
  G.playerHero.z = playerBase.z;
  G.playerHero.group.position.set(playerBase.x, 0, playerBase.z);

  G.aiHero = createHero(aiType, false);
  G.aiHero.team = playerSide === 'sentinel' ? 'scourge' : 'sentinel';
  G.aiHero.x = aiBase.x;
  G.aiHero.z = aiBase.z;
  G.aiHero.group.position.set(aiBase.x, 0, aiBase.z);
  G.aiHero.wpIndex = 0;

  // Initial camera: view matches minimap (base bottom-left), hero in lower-left of screen
  camTarget.set(G.playerHero.x + 18, 0, G.playerHero.z + 18);

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

  // Expose item functions globally
  window.buyItemById = (id) => { if(G.playerHero) { buyItem(G.playerHero, id); renderShopItems(); updateInventoryHUD(); } };
  window.useItemSlot = (idx) => { if(G.playerHero) useItem(G.playerHero, idx); };
  window.toggleShop = toggleShop;

  // Spawn initial creep wave and neutral camps
  spawnWave();
  initNeutralCamps();

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
      else if(h.channeling>0){
        const prev=h.channeling; h.channeling-=dt;
        if(h.channeling<=0 && prev>0 && h.tpTarget) {
          h.x=h.tpTarget.x; h.z=h.tpTarget.z;
          h.group.position.set(h.x,0,h.z); h.tpTarget=null;
          spawnParticles(h.x,h.z,0x44ffcc,10);
          playSound('spawn');
          floatDamage(h.x,h.z,'TELEPORTED!','#44ffcc');
        }
      }
      else {
        let kx=0, kz=0;
        if(keys['ArrowUp'])    { kx+=1; kz+=1; }
        if(keys['ArrowDown'])  { kx-=1; kz-=1; }
        if(keys['ArrowRight']) { kx-=1; kz+=1; }
        if(keys['ArrowLeft'])  { kx+=1; kz-=1; }
        h._isMoving = (kx!==0||kz!==0) || joystick.active || !!(h.moveTarget);
        if(kx!==0||kz!==0) {
          const len=Math.sqrt(kx*kx+kz*kz);
          const spd = (h.def.move+(h.itemBonus?.move||0)) * (h.slowTimer>0?0.7:1) * (h.windrunActive?1.5:1);
          h.x=Math.max(1,Math.min(99,h.x+(kx/len)*spd*dt));
          h.z=Math.max(1,Math.min(99,h.z+(kz/len)*spd*dt));
          h.group.position.set(h.x,0,h.z);
          h.group.rotation.y = Math.atan2(kx, kz);
          h.moveTarget=null;
        }

        // Joystick movement (using world-relative direction)
        if(joystick.active) {
          const spd = (h.def.move+(h.itemBonus?.move||0)) * (h.slowTimer>0?0.7:1) * (h.windrunActive?1.5:1);
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
            const spd = (h.def.move+(h.itemBonus?.move||0))*(h.slowTimer>0?0.7:1);
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
              h._atkAnimTimer = Math.min(effectiveAtkCd * 0.8, 0.55);
              h.group.rotation.y = Math.atan2(dx,dz);
              const ib = h.itemBonus;
              let dmg = (h.def.dmgMin+ib.dmgMin) + Math.random()*((h.def.dmgMax+ib.dmgMax)-(h.def.dmgMin+ib.dmgMin));
              const hasLifesteal = h.inventory.includes('lifesteal_blade');
              let onHitFn = null;
              if(h.type==='sniper' && G.skillLevels['W']>0 && Math.random()<0.4) {
                dmg += [30,55,80,115][G.skillLevels['W']-1]||30;
                onHitFn = (t,_d)=>{ if(t&&t.alive){ t.stunTimer=0.5; floatDamage(t.x,t.z,'HEADSHOT!','#ffcc44'); } };
              }
              if(h.type==='shadow_fiend' && G.skillLevels['W']>0) dmg += h.soulStacks*2;
              if(hasLifesteal) {
                const prev=onHitFn;
                onHitFn=(t,actualDmg)=>{ if(prev)prev(t,actualDmg); if(actualDmg>0){h.hp=Math.min(h.maxHp,h.hp+Math.floor(actualDmg*0.2));} };
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

  // Animations
  if(G.playerHero) updateHeroAnim(G.playerHero, dt);
  if(G.aiHero) {
    const ai = G.aiHero;
    if(!ai.alive) {
      ai.respawnTimer -= dt;
      if(ai.respawnTimer<=0) respawnHero(ai);
    } else {
      updateAI(ai, dt);
      ai._isMoving = ai.aiState !== 'fight';
      // Dragon Blood passive for AI Dragon Knight
      if(ai.type==='dragon_knight') ai.hp = Math.min(ai.maxHp, ai.hp + 2*dt);
      ai.hpFillMesh.scale.x = Math.max(0.001, ai.hp/ai.maxHp);
      ai.hpFillMesh.position.x = -(1-ai.hp/ai.maxHp)*0.6;
      ai.mpFillMesh.scale.x = Math.max(0.001, ai.mp/ai.maxMp);
      ai.mpFillMesh.position.x = -(1-ai.mp/ai.maxMp)*0.6;
    }
    updateHeroAnim(ai, dt);
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
  hero.group.rotation.x = 0;
  hero.atkTimer = 0; hero._atkAnimTimer = 0; hero._castAnimTimer = 0; hero._prevAnim = null;
  if(hero.isPlayer) {
    showAnnouncer('— RESPAWNED —', '#88aaff', 1500);
    playSound('respawn');
  }
  spawnParticles(hero.x, hero.z, hero.team==='scourge'?0xff2200:0x2244ff, 8);
}

// ─── ATTACK BUTTON HUD ─────────────────────────────────────────────────────────
function updateAttackBtnHUD() {
  const h = G.playerHero; if(!h) return;
  const cdEl = document.getElementById('atk-cd');
  const btn   = document.getElementById('attack-btn');
  if(!cdEl || !btn) return;
  const cd = h.atkTimer;
  if(cd > 0.08) {
    cdEl.style.display = 'flex';
    cdEl.textContent = cd.toFixed(1);
    btn.style.opacity = '0.5';
  } else {
    cdEl.style.display = 'none';
    btn.style.opacity = '1';
  }
}

// ─── ITEM HUD ──────────────────────────────────────────────────────────────────
function updateInventoryHUD() {
  const h = G.playerHero; if(!h) return;
  for(let i=0;i<6;i++) {
    const slot=document.getElementById('inv'+i);
    const nameEl=document.getElementById('inv-name'+i);
    const cdEl=document.getElementById('inv-cd'+i);
    if(!slot) continue;
    const itemId=h.inventory[i];
    if(itemId) {
      const def=ITEM_DEFS[itemId];
      slot.style.background=def.color+'33';
      slot.style.borderColor=def.color;
      slot.title=def.name;
      if(nameEl) nameEl.textContent=def.short;
      const cd=h.itemCDs[itemId]||0;
      if(cdEl) { if(cd>0){cdEl.style.display='flex';cdEl.textContent=cd.toFixed(1);}else{cdEl.style.display='none';} }
    } else {
      slot.style.background=''; slot.style.borderColor='';
      if(nameEl) nameEl.textContent='';
      if(cdEl) cdEl.style.display='none';
    }
  }
}

function toggleShop() {
  const shop=document.getElementById('shop');
  if(!shop) return;
  const visible=shop.style.display!=='none'&&shop.style.display!=='';
  shop.style.display=visible?'none':'flex';
  if(!visible) renderShopItems();
}

function renderShopItems() {
  const h=G.playerHero; if(!h) return;
  const goldEl=document.getElementById('shop-gold');
  if(goldEl) goldEl.textContent=Math.floor(G.gold);
  const container=document.getElementById('shop-items'); if(!container) return;
  container.innerHTML='';
  const ALL_ITEMS=['boots_of_speed','iron_branch','blades_of_attack','ring_of_protection','magic_charm','vitality_gem',
    'power_boots','arcane_boots','blink_dagger','lifesteal_blade','aura_shield','void_staff','tp_scroll'];
  for(const id of ALL_ITEMS) {
    const def=ITEM_DEFS[id];
    const cost=getItemBuyCost_shop(h,id);
    const canAfford=G.gold>=cost && h.inventory.length<6;
    const owned=h.inventory.includes(id);
    const div=document.createElement('div');
    div.className='shop-item'+(canAfford&&!owned?' can-buy':'')+(owned?' owned':'');
    div.innerHTML=`<div class="si-name" style="color:${def.color}">${def.name}</div>`+
      `<div class="si-cost">${owned?'OWNED':cost+'g'}</div>`+
      `<div class="si-bonus">${formatBonuses(def.bonuses)}</div>`+
      (def.components.length?`<div class="si-recipe">= ${def.components.map(c=>ITEM_DEFS[c]?.short||c).join(' + ')}</div>`:'');
    if(!owned) {
      div.onclick=()=>{ window.buyItemById(id); };
      div.addEventListener('touchend', e=>{ e.preventDefault(); window.buyItemById(id); },{passive:false});
    }
    container.appendChild(div);
  }
}

function getItemBuyCost_shop(hero, itemId) {
  const def=ITEM_DEFS[itemId]; if(!def) return 0;
  if(!def.components.length) return def.cost;
  let tempInv=[...hero.inventory], cost=def.cost;
  for(const comp of def.components){const idx=tempInv.indexOf(comp);if(idx>=0)tempInv.splice(idx,1);else cost+=ITEM_DEFS[comp]?ITEM_DEFS[comp].cost:0;}
  return cost;
}

function formatBonuses(b) {
  if(!b) return '';
  const parts=[];
  if(b.maxHp)  parts.push('+'+b.maxHp+' HP');
  if(b.maxMp)  parts.push('+'+b.maxMp+' MP');
  if(b.dmgMin) parts.push('+'+b.dmgMin+' DMG');
  if(b.armor)  parts.push('+'+b.armor+' Armor');
  if(b.move)   parts.push('+'+b.move+' Spd');
  return parts.join(' · ');
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
    updateNeutralCamps(dt);
    updateTowers(dt);
    updateBarracks(dt);
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
    updateItemCooldowns(G.playerHero, dt);
    if(G.aiHero) updateAIItems(G.aiHero, dt);
    updateInventoryHUD();
    updateAttackBtnHUD();
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

// ─── MAIN MENU & PLAY FLOW & SETTINGS ──────────────────────────────────────────
const mainMenu = document.getElementById('main-menu');
const playFlow = document.getElementById('play-flow');
const settingsScreen = document.getElementById('settings-screen');
const lobby = document.getElementById('lobby');
const playSideOptions = document.getElementById('play-side-options');
const playModeOptions = document.getElementById('play-mode-options');
const playFlowTitle = document.getElementById('play-flow-title');
let playFlowStep = 0; // 0 = side, 1 = mode

function showScreen(show) {
  mainMenu.style.display = show === 'menu' ? 'flex' : 'none';
  playFlow.classList.toggle('show', show === 'play');
  settingsScreen.classList.toggle('show', show === 'settings');
  lobby.classList.toggle('show', show === 'lobby');
}

document.getElementById('btn-play').onclick = () => {
  showScreen('play');
  playFlowStep = 0;
  playFlowTitle.textContent = 'Choose your side';
  playSideOptions.style.display = 'flex';
  playModeOptions.style.display = 'none';
  playModeOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  playSideOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  // Ensure a side is always selected so G.playerSide is never wrong
  let sideSelected = playSideOptions.querySelector('.opt-btn.selected');
  if (!sideSelected) {
    const defaultSide = playSideOptions.querySelector('.opt-btn[data-side="' + (G.playerSide || 'scourge') + '"]');
    (defaultSide || playSideOptions.querySelector('.opt-btn[data-side="scourge"]')).classList.add('selected');
    G.playerSide = (defaultSide && defaultSide.dataset.side) || 'scourge';
  }
};
document.getElementById('btn-settings').onclick = () => {
  showScreen('settings');
  settingsScreen.querySelectorAll('.set-tab').forEach(t => t.classList.remove('active'));
  settingsScreen.querySelectorAll('.set-pane').forEach(p => p.classList.remove('active'));
  settingsScreen.querySelector('.set-tab[data-tab="general"]').classList.add('active');
  settingsScreen.querySelector('.set-pane[data-pane="general"]').classList.add('active');
};

playSideOptions.querySelectorAll('.opt-btn').forEach(btn => {
  btn.onclick = () => {
    playSideOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    G.playerSide = btn.dataset.side;
  };
});
playModeOptions.querySelectorAll('.opt-btn').forEach(btn => {
  btn.onclick = () => {
    playModeOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    G.teamSize = parseInt(btn.dataset.mode, 10);
  };
});

document.getElementById('play-continue-btn').onclick = () => {
  if (playFlowStep === 0) {
    const sideSelected = playSideOptions.querySelector('.opt-btn.selected');
    if (!sideSelected) return;
    playFlowStep = 1;
    playFlowTitle.textContent = 'Choose team size';
    playSideOptions.style.display = 'none';
    playModeOptions.style.display = 'flex';
    return;
  }
  const modeSelected = playModeOptions.querySelector('.opt-btn.selected');
  if (!modeSelected) return;
  G.teamSize = parseInt(modeSelected.dataset.mode, 10);
  showScreen('lobby');
};

document.getElementById('play-back-btn').onclick = () => {
  if (playFlowStep === 1) {
    playFlowStep = 0;
    playFlowTitle.textContent = 'Choose your side';
    playModeOptions.style.display = 'none';
    playSideOptions.style.display = 'flex';
    playModeOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    return;
  }
  showScreen('menu');
};

document.getElementById('settings-back-btn').onclick = () => showScreen('menu');

settingsScreen.querySelectorAll('.set-tab').forEach(tab => {
  tab.onclick = () => {
    settingsScreen.querySelectorAll('.set-tab').forEach(t => t.classList.remove('active'));
    settingsScreen.querySelectorAll('.set-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pane = settingsScreen.querySelector('.set-pane[data-pane="' + tab.dataset.tab + '"]');
    if (pane) pane.classList.add('active');
    if (tab.dataset.tab === 'hero-viewer') {
      import('./hero-viewer.js').then(m => { m.initHeroViewer(); });
    }
  };
});

window.lobbyBack = function() {
  showScreen('play');
  playFlowStep = 1;
  playFlowTitle.textContent = 'Choose team size';
  playSideOptions.style.display = 'none';
  playModeOptions.style.display = 'flex';
};

// Start on main menu; lobby hidden until Play → Continue
showScreen('menu');

// Draw lobby portraits (used when lobby is shown)
drawPortrait('lich-portrait','lich');
drawPortrait('sniper-portrait','sniper');
drawPortrait('dragon_knight-portrait','dragon_knight');
drawPortrait('shadow_fiend-portrait','shadow_fiend');
drawPortrait('windrunner-portrait','windrunner');
