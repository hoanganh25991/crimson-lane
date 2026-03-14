// ─── MAIN ENTRY POINT ──────────────────────────────────────────────────────────
import { CREEP_SPAWN_INTERVAL, GOLD_TICK, GOLD_PER_TICK } from './constants.js';
import { HERO_REGISTRY, ALL_HERO_IDS } from './heroes/registry.js';
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
import * as mpLobby from './net/lobby.js';

// ─── Expose HUD functions for combat.js bridge ──────────────────────────────────
window._hudFns = { showAnnouncer, updateSkillUI };

// ─── Expose endGame for combat.js bridge ────────────────────────────────────────
window._endGame = endGame;

// ─── Shrapnel tick handler ───────────────────────────────────────────────────────
window._shrapnelTick = function(e) {
  const casterTeam = e.casterTeam || (G.playerHero && G.playerHero.team);
  if(!casterTeam) return;
  const allUnits = [...G.creeps, ...G.towers, ...G.heroList.filter(h=>h&&h.alive)];
  for(const en of allUnits) {
    if(!en.alive) continue;
    if(en.team === casterTeam) continue;
    const dx=en.x-e.x, dz=en.z-e.z;
    if(Math.sqrt(dx*dx+dz*dz)<=e.radius) {
      applyDamage(en, e.dps*0.5, 'magic');
      en.slowTimer = 0.7;
    }
  }
};

// Clock
const clock = {last:0};

const ALL_HEROES = ALL_HERO_IDS;

// ─── HERO SELECT ──────────────────────────────────────────────────────────────
export function selectHero(type) {
  G.pickedHero = type;
  for(const h of ALL_HEROES) {
    const el = document.getElementById('pick-'+h);
    if(el) el.classList.toggle('selected', h===type);
  }
  const startBtn = document.getElementById('startBtn');
  if (G.isMultiplayer && !G.isHost) {
    startBtn.disabled = true;
    startBtn.textContent = 'HERO SELECTED — WAITING FOR HOST';
  } else {
    startBtn.disabled = false;
    startBtn.textContent = 'START GAME';
  }
}

// ─── GAME START ────────────────────────────────────────────────────────────────
export function startGame() {
  if(!G.pickedHero) return;
  if (G.isMultiplayer && G.isHost) {
    mpLobby.broadcastStart({ hero: G.pickedHero, playerSide: G.playerSide, teamSize: G.teamSize });
  }
  G.phase = 'game';
  document.getElementById('lobby').style.display='none';
  document.getElementById('lobby').classList.remove('show');
  const mpSetup = document.getElementById('multiplayer-setup');
  if (mpSetup) mpSetup.style.display = 'none';
  document.getElementById('hud').style.display='block';

  initThree();
  buildMap();
  buildTowers();
  buildBarracks();

  const playerSide = G.playerSide || 'scourge';
  const enemySide = playerSide === 'sentinel' ? 'scourge' : 'sentinel';
  const playerBase = playerSide === 'sentinel' ? { x: 90, z: 90 } : { x: 10, z: 10 };
  const aiBase = playerSide === 'sentinel' ? { x: 10, z: 10 } : { x: 90, z: 90 };
  const lanes = ['top', 'mid', 'bot'];
  const teamSize = G.teamSize || 1;
  const allyBotCount = teamSize - 1;
  const enemyBotCount = teamSize;

  // Reset multi-hero arrays
  G.heroList = [];
  G.allyBots = [];
  G.enemyBots = [];

  // Pick random heroes for bots (allow duplicates)
  const otherHeroes = ALL_HEROES.filter(h => h !== G.pickedHero);
  function pickRandomHero() { return otherHeroes[Math.floor(Math.random() * otherHeroes.length)]; }

  // Create player hero
  G.playerHero = createHero(G.pickedHero, true);
  G.playerHero.team = playerSide;
  G.playerHero.x = playerBase.x;
  G.playerHero.z = playerBase.z;
  G.playerHero.group.position.set(playerBase.x, 0, playerBase.z);
  G.heroList.push(G.playerHero);

  // Create ally bots (same team as player)
  for(let i=0; i<allyBotCount; i++) {
    const heroType = pickRandomHero();
    const bot = createHero(heroType, false);
    bot.team = playerSide;
    bot.isAllyBot = true;
    bot.aiLane = lanes[(i + 1) % 3]; // skip mid (player likely mid), assign top/bot
    bot.x = playerBase.x + (Math.random()-0.5)*6;
    bot.z = playerBase.z + (Math.random()-0.5)*6;
    bot.group.position.set(bot.x, 0, bot.z);
    bot.wpIndex = 0;
    bot.aiCastTimer = 5 + Math.random()*5;
    G.allyBots.push(bot);
    G.heroList.push(bot);
  }

  // Create enemy bots
  for(let i=0; i<enemyBotCount; i++) {
    const heroType = pickRandomHero();
    const bot = createHero(heroType, false);
    bot.team = enemySide;
    bot.aiLane = lanes[i % 3];
    bot.x = aiBase.x + (Math.random()-0.5)*6;
    bot.z = aiBase.z + (Math.random()-0.5)*6;
    bot.group.position.set(bot.x, 0, bot.z);
    bot.wpIndex = 0;
    bot.aiCastTimer = 5 + Math.random()*5;
    G.enemyBots.push(bot);
    G.heroList.push(bot);
  }

  // Backward compat: G.aiHero points to first enemy bot
  G.aiHero = G.enemyBots[0] || null;

  // Initial camera
  camTarget.set(G.playerHero.x + 18, 0, G.playerHero.z + 18);

  const heroNameEl = document.getElementById('hero-name');
  if(heroNameEl && HERO_REGISTRY[G.pickedHero]) heroNameEl.textContent = HERO_REGISTRY[G.pickedHero].def.name;
  updateSkillUI();

  // Build topbar portraits dynamically
  buildTopbarPortraits();

  // Multiplayer host: broadcast state snapshots for clients
  if (G.isMultiplayer && G.isHost) {
    import('./net/host.js').then((host) => {
      host.setStateGetter(() => G);
      host.startSnapshotBroadcast(50);
    });
  }

  // Wire minimap click
  const minimapEl = document.getElementById('minimap');
  if(minimapEl) {
    minimapEl.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const fz = (e.clientX - rect.left) / rect.width;
      const fx = 1 - (e.clientY - rect.top) / rect.height;
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

function buildTopbarPortraits() {
  const teamLeft = document.getElementById('team-left');
  const teamRight = document.getElementById('team-right');
  teamLeft.innerHTML = '';
  teamRight.innerHTML = '';

  const playerTeam = G.playerHero.team;

  for(const hero of G.heroList) {
    const slot = document.createElement('div');
    slot.className = 'port-slot';
    slot.id = 'port-' + hero._uid;

    const canvas = document.createElement('canvas');
    canvas.width = 36; canvas.height = 36;
    canvas.id = 'port-canvas-' + hero._uid;
    slot.appendChild(canvas);

    const hpBar = document.createElement('div');
    hpBar.className = 'port-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'port-hp-fill' + (hero.team !== playerTeam ? ' enemy' : '');
    hpFill.id = 'port-hp-' + hero._uid;
    hpFill.style.width = '100%';
    hpBar.appendChild(hpFill);
    slot.appendChild(hpBar);

    if(hero.team === playerTeam) teamLeft.appendChild(slot);
    else teamRight.appendChild(slot);

    drawPortrait(canvas.id, hero.type);
  }
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
  // ── Player hero ────────────────────────────────────────────────────────────
  const h = G.playerHero;
  if(h) {
    if(!h.alive) {
      h.respawnTimer -= dt;
      if(h.respawnTimer <= 0) respawnHero(h);
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
        // Camera from west: screen up = +X, screen right = +Z
        if(keys['ArrowUp'])    { kx+=1; }
        if(keys['ArrowDown'])  { kx-=1; }
        if(keys['ArrowRight']) { kz+=1; }
        if(keys['ArrowLeft'])  { kz-=1; }
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

        if(h.focusFireActive && h.focusFireTarget && h.focusFireTarget.alive) {
          h.attackTarget = h.focusFireTarget;
        }

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

      // Mana regen near fountain
      const fountain = h.team==='scourge'?{x:10,z:10}:{x:90,z:90};
      const fdx=h.x-fountain.x, fdz=h.z-fountain.z;
      if(Math.sqrt(fdx*fdx+fdz*fdz)<10) {
        h.hp = Math.min(h.maxHp, h.hp + 30*dt);
        h.mp = Math.min(h.maxMp, h.mp + 15*dt);
      }

      // Dragon Blood passive regen
      if(h.type==='dragon_knight' && G.skillLevels['Q']>0) {
        const regen = [1,2,3,4][G.skillLevels['Q']-1]||1;
        h.hp = Math.min(h.maxHp, h.hp + regen*dt);
      }

      // Buff timers
      if(h.dragonFormActive) { h.dragonFormTimer-=dt; if(h.dragonFormTimer<=0) h.dragonFormActive=false; }
      if(h.windrunActive) { h.windrunTimer-=dt; if(h.windrunTimer<=0) h.windrunActive=false; }
      if(h.focusFireActive) { h.focusFireTimer-=dt; if(h.focusFireTimer<=0){h.focusFireActive=false;h.focusFireTarget=null;} }
    }
  }

  // ── All bot heroes (ally + enemy) ──────────────────────────────────────────
  const allBots = [...G.allyBots, ...G.enemyBots];
  for(const bot of allBots) {
    if(!bot.alive) {
      bot.respawnTimer -= dt;
      if(bot.respawnTimer<=0) respawnHero(bot);
    } else {
      updateAI(bot, dt);
      bot._isMoving = bot.aiState !== 'fight';

      // Passive gold income for bots
      bot.aiGold = (bot.aiGold||625) + 1.5*dt;
    }
    updateHeroAnim(bot, dt);
  }

  // ── Update 3D HP/MP bars for ALL heroes ────────────────────────────────────
  for(const hero of G.heroList) {
    if(!hero.alive) continue;
    hero.hpFillMesh.scale.x = Math.max(0.001, hero.hp/hero.maxHp);
    hero.hpFillMesh.position.x = -(1-hero.hp/hero.maxHp)*0.6;
    hero.mpFillMesh.scale.x = Math.max(0.001, hero.mp/hero.maxMp);
    hero.mpFillMesh.position.x = -(1-hero.mp/hero.maxMp)*0.6;
    hero.hpFillMesh.rotation.y = -hero.group.rotation.y;
    hero.mpFillMesh.rotation.y = -hero.group.rotation.y;
  }

  // Animations for player
  if(G.playerHero) updateHeroAnim(G.playerHero, dt);

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
  // Reset bot AI state to march from base
  if(!hero.isPlayer) {
    hero.aiState = 'march';
    hero.wpIndex = 0;
  }
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
    for(const bot of [...G.allyBots, ...G.enemyBots]) {
      updateAIItems(bot, dt);
      updateItemCooldowns(bot, dt);
    }
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
const mpSetupEl = document.getElementById('multiplayer-setup');
const playSideOptions = document.getElementById('play-side-options');
const playModeOptions = document.getElementById('play-mode-options');
const playFlowTitle = document.getElementById('play-flow-title');
let playFlowStep = 0; // 0 = side, 1 = mode

function showScreen(show) {
  mainMenu.style.display = show === 'menu' ? 'flex' : 'none';
  playFlow.classList.toggle('show', show === 'play');
  settingsScreen.classList.toggle('show', show === 'settings');
  lobby.classList.toggle('show', show === 'lobby');
  if (mpSetupEl) mpSetupEl.style.display = show === 'multiplayer' ? 'flex' : 'none';
}

document.getElementById('btn-play').onclick = () => {
  showScreen('play');
  playFlowStep = 0;
  playFlowTitle.textContent = 'Choose your side';
  playSideOptions.style.display = 'flex';
  playModeOptions.style.display = 'none';
  playModeOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  playSideOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  // Default team size selection (3 vs 3)
  const defaultModeBtn = playModeOptions.querySelector('.opt-btn[data-mode="' + (G.teamSize || 3) + '"]');
  if (defaultModeBtn) defaultModeBtn.classList.add('selected');
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
document.getElementById('btn-multiplayer').onclick = () => {
  showScreen('multiplayer');
  mpLobby.showMultiplayerSetup();
};

document.getElementById('mp-create-btn').onclick = () => {
  const btn = document.getElementById('mp-create-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';
  mpLobby.createGame().then(() => {
    btn.disabled = false;
    btn.textContent = 'Create Game';
  }).catch((err) => {
    btn.disabled = false;
    btn.textContent = 'Create Game';
    const errEl = document.getElementById('mp-create-error');
    if (errEl) errEl.textContent = 'Failed to create room: ' + (err && err.message ? err.message : 'Server unavailable. Try again.');
  });
};
document.getElementById('mp-join-btn').onclick = () => {
  document.getElementById('mp-choose').style.display = 'none';
  document.getElementById('mp-join-panel').style.display = 'block';
};
let _connectCountdown = null;
function _resetConnectBtn() {
  const btn = document.getElementById('mp-connect-btn');
  if (_connectCountdown) { clearInterval(_connectCountdown); _connectCountdown = null; }
  btn.disabled = false;
  btn.textContent = 'Connect';
}
document.getElementById('mp-connect-btn').onclick = () => {
  const code = document.getElementById('mp-room-code-in').value.trim().toLowerCase();
  if (!code) return;
  const btn = document.getElementById('mp-connect-btn');
  const errEl = document.getElementById('mp-join-error');
  if (errEl) errEl.textContent = '';
  btn.disabled = true;
  let secsLeft = 12;
  btn.textContent = `Connecting... (${secsLeft}s)`;
  if (_connectCountdown) clearInterval(_connectCountdown);
  _connectCountdown = setInterval(() => {
    secsLeft--;
    if (secsLeft > 0) btn.textContent = `Connecting... (${secsLeft}s)`;
  }, 1000);
  mpLobby.joinGame(code).then(() => {
    _resetConnectBtn();
    G.isMultiplayer = true;
    G.isHost = false;
    G.playerSide = G.playerSide || 'scourge';
    G.teamSize = G.teamSize || 3;
    const mpSetup = document.getElementById('multiplayer-setup');
    if (mpSetup) mpSetup.style.display = 'none';
    const lobbyEl = document.getElementById('lobby');
    if (lobbyEl) { lobbyEl.style.display = 'flex'; lobbyEl.classList.add('show'); }
    const sub = document.getElementById('lobby-sub');
    if (sub) sub.textContent = 'MULTIPLAYER — Pick your hero (waiting for host to start)';
    const sideEl = document.getElementById('lobby-side-name');
    if (sideEl) sideEl.textContent = G.playerSide === 'sentinel' ? 'Sentinel' : 'Scourge';
    const startBtn = document.getElementById('startBtn');
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'WAITING FOR HOST'; }
  }).catch((err) => {
    _resetConnectBtn();
    if (err && err.message === 'Cancelled') return;
    if (errEl) errEl.textContent = 'Connection failed: ' + (err && err.message ? err.message : 'Room not found or server unavailable');
  });
};
document.getElementById('mp-join-back').onclick = () => {
  mpLobby.cancelJoin();
  _resetConnectBtn();
  const errEl = document.getElementById('mp-join-error');
  if (errEl) errEl.textContent = '';
  document.getElementById('mp-join-panel').style.display = 'none';
  document.getElementById('mp-choose').style.display = 'flex';
};
document.getElementById('mp-copy-room-btn').onclick = () => {
  const el = document.getElementById('mp-room-code-display');
  if (el && el.textContent && el.textContent !== '------') {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      const btn = document.getElementById('mp-copy-room-btn');
      if (btn) { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = t; }, 1500); }
    }).catch(() => {});
  }
};
document.getElementById('mp-to-lobby-btn').onclick = () => {
  mpLobby.hostGoToLobby();
  G.isMultiplayer = true;
  G.isHost = true;
  showScreen('lobby');
  const sub = document.getElementById('lobby-sub');
  if (sub) sub.textContent = 'MULTIPLAYER — Pick your hero';
  const info = document.getElementById('lobby-mp-info');
  if (info) { info.style.display = 'block'; }
  const roomEl = document.getElementById('lobby-mp-room');
  if (roomEl) roomEl.textContent = 'Room: ' + (mpLobby.getRoomCode() || '');
  const playersEl = document.getElementById('lobby-mp-players');
  if (playersEl) playersEl.textContent = 'Players: ' + mpLobby.getConnectionCount();
};
document.getElementById('mp-setup-back').onclick = () => {
  mpLobby.hideMultiplayerSetup();
  showScreen('menu');
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
    G.playerSide = sideSelected.dataset.side; // sync from visible selection so lobby always has correct side
    playFlowStep = 1;
    playFlowTitle.textContent = 'Choose team size';
    playSideOptions.style.display = 'none';
    playModeOptions.style.display = 'flex';
    let modeSelected = playModeOptions.querySelector('.opt-btn.selected');
    if (!modeSelected) {
      const defaultModeBtn = playModeOptions.querySelector('.opt-btn[data-mode="' + (G.teamSize || 3) + '"]');
      if (defaultModeBtn) { defaultModeBtn.classList.add('selected'); modeSelected = defaultModeBtn; }
    }
    return;
  }
  const modeSelected = playModeOptions.querySelector('.opt-btn.selected');
  if (!modeSelected) return;
  G.teamSize = parseInt(modeSelected.dataset.mode, 10);
  const sideEl = document.getElementById('lobby-side-name');
  if (sideEl) sideEl.textContent = (G.playerSide === 'sentinel' ? 'Sentinel' : 'Scourge');
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
  if (G.isMultiplayer) {
    G.isMultiplayer = false;
    G.isHost = false;
    const info = document.getElementById('lobby-mp-info');
    if (info) info.style.display = 'none';
    const sub = document.getElementById('lobby-sub');
    if (sub) sub.textContent = 'SINGLE PLAYER VS AI';
    mpLobby.hideMultiplayerSetup();
    showScreen('menu');
    return;
  }
  showScreen('play');
  playFlowStep = 1;
  playFlowTitle.textContent = 'Choose team size';
  playSideOptions.style.display = 'none';
  playModeOptions.style.display = 'flex';
  playModeOptions.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  const defaultModeBtn = playModeOptions.querySelector('.opt-btn[data-mode="' + (G.teamSize || 3) + '"]');
  if (defaultModeBtn) defaultModeBtn.classList.add('selected');
};

// Start on main menu; lobby hidden until Play → Continue
showScreen('menu');

// Build lobby hero cards from registry and draw portraits
function buildLobbyHeroCards() {
  const container = document.getElementById('hero-picks-container');
  if (!container) return;
  container.innerHTML = '';
  for (const id of ALL_HERO_IDS) {
    const mod = HERO_REGISTRY[id];
    if (!mod || !mod.def) continue;
    const d = mod.def;
    const colorHex = '#' + (d.color != null ? Number(d.color).toString(16).padStart(6, '0') : '888888');
    const teamColor = d.team === 'scourge' ? '#882222' : '#1a4a8a';
    const rangeText = (d.range != null && d.range >= 4) ? ('Range: ' + d.range) : 'Melee';
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.id = 'pick-' + id;
    card.onclick = () => selectHero(id);
    card.innerHTML =
      '<canvas width="120" height="88" id="' + id + '-portrait"></canvas>' +
      '<div class="hname" style="color:' + colorHex + '">' + (d.name || id.toUpperCase()) + '</div>' +
      '<div class="hteam" style="color:' + teamColor + '">' + (d.team || 'sentinel').toUpperCase() + '</div>' +
      '<div class="hstats">HP: ' + (d.hp || 0) + ' · MP: ' + (d.mp || 0) + '<br>' + rangeText + ' · DMG: ' + (d.dmgMin || 0) + '-' + (d.dmgMax || 0) + '</div>';
    container.appendChild(card);
  }
  for (const id of ALL_HERO_IDS) {
    drawPortrait(id + '-portrait', id);
  }
}
buildLobbyHeroCards();

// Client: when host starts, receive hero/side and start game
mpLobby.onStartSignal((data) => {
  if (!G.pickedHero) G.pickedHero = data.hero;
  G.playerSide = data.playerSide || G.playerSide;
  G.teamSize = data.teamSize || G.teamSize || 3;
  G.isMultiplayer = true;
  G.isHost = false;
  mpLobby.hideMultiplayerSetup();
  const lobbyEl = document.getElementById('lobby');
  if (lobbyEl) { lobbyEl.style.display = 'none'; lobbyEl.classList.remove('show'); }
  startGame();
});
