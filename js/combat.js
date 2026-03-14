// ─── COMBAT ────────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { scene } from './scene.js';
import { camera } from './scene.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

// ─── Damage display ─────────────────────────────────────────────────────────────
export function floatDamage(worldX, worldZ, amount, color) {
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
  document.getElementById('hud').appendChild(div);
  setTimeout(()=>div.remove(), 900);
}

// ─── Damage calculation ─────────────────────────────────────────────────────────
export function calcPhysDmg(dmg, armor) {
  const red = armor*0.06/(1+armor*0.06);
  return dmg * (1-red);
}

export function calcMagicDmg(dmg) { return dmg * 0.75; }

export function applyDamage(target, amount, type, attacker) {
  if(!target || !target.alive) return 0;
  let actual = 0;
  if(type==='physical') actual = calcPhysDmg(amount, target.armor||0);
  else if(type==='magic') actual = calcMagicDmg(amount);
  else actual = amount; // pure
  actual = Math.floor(actual);
  target.hp -= actual;
  if(attacker) target.lastHitter = attacker;
  const col = type==='magic'?'#00ffcc':(type==='pure'?'#ffffff':'#ffaa44');
  floatDamage(target.x, target.z, actual, col);
  // Cancel TP channeling if damaged
  if(target.tpTarget) { target.tpTarget = null; target.channeling = 0; floatDamage(target.x, target.z, 'TP CANCELLED', '#ff8844'); }
  if(target.hp <= 0) killEntity(target);
  return actual;
}

// ─── Kill logic ─────────────────────────────────────────────────────────────────
export function killEntity(entity) {
  if(!entity.alive) return;
  entity.alive = false;
  playSound('death');
  spawnParticles(entity.x, entity.z, entity.team==='scourge'?0xff2200:0x2244ff, 6);

  if(entity.isPlayer !== undefined) { // hero
    onHeroDeath(entity);
  } else if(entity.isBarracks) { // barracks
    onBarracksDeath(entity);
  } else if(entity.def) { // tower
    onTowerDeath(entity);
  } else { // creep / neutral
    onCreepDeath(entity);
  }
}

function onHeroDeath(hero) {
  hero.respawnMax = 5 + hero.level*4;
  hero.respawnTimer = hero.respawnMax;
  hero.group.visible = false;
  hero.moveTarget = null;
  hero.attackTarget = null;
  hero.channeling = 0;

  const { showAnnouncer } = window._hudFns || {};

  if(hero.isPlayer) {
    G.deaths++;
    if(showAnnouncer) showAnnouncer('YOU DIED', '#ff4444', 2000);
  } else if(hero.team !== G.playerHero.team) {
    // Enemy hero killed — reward player team
    const goldGain = 200 + 50*(hero.level||1);
    G.gold += goldGain;
    G.kills++;
    G.killStreak++;
    if(!G.firstBlood) {
      G.firstBlood = true;
      if(showAnnouncer) showAnnouncer('FIRST BLOOD!', '#ff4444');
      playSound('gold');
    } else if(G.killStreak >= 2) {
      if(showAnnouncer) showAnnouncer('KILL STREAK!', '#ff8800');
    }
    floatDamage(hero.x, hero.z, '+'+goldGain+'g', '#ffcc44');
    if(G.playerHero) addXP(100 + 20*G.playerHero.level);
    playSound('gold');
  } else if(hero.isAllyBot) {
    // Ally bot died
    if(showAnnouncer) showAnnouncer('ALLY KILLED', '#ff8844', 1500);
  }

  // Give gold to nearby enemy bot heroes (for their item buys)
  for(const h of G.heroList) {
    if(!h || !h.alive || h.isPlayer || h.team === hero.team) continue;
    const dx=h.x-hero.x, dz=h.z-hero.z;
    if(Math.sqrt(dx*dx+dz*dz) < 30) {
      h.aiGold = (h.aiGold||625) + 150 + hero.level*20;
    }
  }
}

function onTowerDeath(tower) {
  tower.group.visible = false;
  const { showAnnouncer } = window._hudFns || {};
  if(showAnnouncer) showAnnouncer('TOWER DESTROYED', '#ffcc44');
  playSound('tower_death');

  if(tower.lane === 'ancient' && G.playerHero) {
    const playerWon = (tower.team !== G.playerHero.team);
    if(window._endGame) window._endGame(playerWon);
  }

  if(G.playerHero && tower.team !== G.playerHero.team) {
    const g = tower.tier === 4 ? 200 : 80+tower.tier*30;
    G.gold += g;
    floatDamage(G.playerHero.x, G.playerHero.z, '+'+g+'g', '#ffcc44');
  }
}

function onBarracksDeath(barracks) {
  barracks.group.visible = false;
  const { showAnnouncer } = window._hudFns || {};
  const lane = barracks.lane.toUpperCase();
  const side = barracks.team === 'scourge' ? 'SCOURGE' : 'SENTINEL';
  if(showAnnouncer) showAnnouncer(side+' '+lane+' BARRACKS FALLEN!', '#ffaa00', 3000);
  // Opposing team gets mega creeps on that lane
  const enemy = barracks.team === 'scourge' ? 'sentinel' : 'scourge';
  G.megaLanes[enemy][barracks.lane] = true;
  if(G.playerHero && barracks.team !== G.playerHero.team) {
    G.gold += 250;
    floatDamage(G.playerHero.x, G.playerHero.z, '+250g BARRACKS', '#ffcc44');
    addXP(200);
  }
  playSound('tower_death');
}

function onCreepDeath(creep) {
  creep.group.visible = false;
  const xpAmount = creep.type === 'neutral' ? (creep.tier===2 ? 80 : 50) : 50;

  // Last hit gold — only the killer gets gold
  if(creep.lastHitter) {
    let gold;
    if(creep.type === 'neutral') gold = (creep.tier===2 ? 90 : 55) + Math.floor(Math.random()*15);
    else if(creep.type === 'ranged') gold = 55 + Math.floor(Math.random()*15);
    else gold = 40 + Math.floor(Math.random()*15);

    if(creep.lastHitter === G.playerHero) {
      G.gold += gold;
      floatDamage(creep.x, creep.z, '+'+gold+'g', '#ffcc44');
      playSound('gold');
    } else if(creep.lastHitter.aiGold !== undefined) {
      creep.lastHitter.aiGold += gold;
    }
  }

  // XP to ALL nearby heroes
  for(const h of G.heroList) {
    if(!h || !h.alive) continue;
    const dx = h.x - creep.x, dz = h.z - creep.z;
    if(Math.sqrt(dx*dx+dz*dz) < 20) {
      if(h.isPlayer) {
        addXP(xpAmount);
      } else {
        addHeroXP(h, xpAmount);
      }
    }
  }

  // Neutral camp respawn
  if(creep.type === 'neutral' && creep.campRef) {
    creep.campRef.deadCount = (creep.campRef.deadCount||0) + 1;
    if(creep.campRef.deadCount >= creep.campRef.units.length) {
      creep.campRef.respawnTimer = 60;
      creep.campRef.alive = false;
    }
  }
}

export function addXP(amount) {
  const h = G.playerHero; if(!h) return;
  h.xp += amount;
  G.xp += amount;
  while(h.xp >= h.xpNext && h.level < 25) {
    h.xp -= h.xpNext;
    h.level++;
    h.xpNext = 50 * h.level * h.level;
    onLevelUp(h);
  }
}

export function addHeroXP(hero, amount) {
  if(!hero || hero.isPlayer) { if(hero && hero.isPlayer) addXP(amount); return; }
  hero.xp += amount;
  while(hero.xp >= hero.xpNext && hero.level < 25) {
    hero.xp -= hero.xpNext;
    hero.level++;
    hero.xpNext = 50 * hero.level * hero.level;
    onBotLevelUp(hero);
  }
}

function onLevelUp(h) {
  playSound('levelup');
  h.maxHp += 40; h.hp = Math.min(h.hp+40, h.maxHp);
  h.maxMp += 20; h.mp = Math.min(h.mp+20, h.maxMp);
  const { showAnnouncer, updateSkillUI } = window._hudFns || {};
  if(showAnnouncer) showAnnouncer('LEVEL UP! '+h.level, '#ffcc44', 1500);
  const keys = ['Q','W','E','R'];
  const min = Math.min(...keys.map(k=>G.skillLevels[k]));
  const toUp = keys.find(k=>G.skillLevels[k]===min && G.skillLevels[k]<4);
  if(toUp) G.skillLevels[toUp] = Math.min(4, G.skillLevels[toUp]+1);
  if(updateSkillUI) updateSkillUI();
  spawnParticles(h.x, h.z, 0xffcc44, 8);
}

function onBotLevelUp(hero) {
  hero.maxHp += 40; hero.hp = Math.min(hero.hp+40, hero.maxHp);
  hero.maxMp += 20; hero.mp = Math.min(hero.mp+20, hero.maxMp);
  hero.atkCd = Math.max(0.3, hero.atkCd * 0.97);
  spawnParticles(hero.x, hero.z, 0xffcc44, 5);
}

// ─── Enemy/Ally queries ─────────────────────────────────────────────────────────
export function getEnemiesOf(team) {
  const enemies = [];
  for(const h of G.heroList) { if(h && h.alive && h.team !== team) enemies.push(h); }
  for(const c of G.creeps) { if(c.alive && c.team !== team && c.team !== 'neutral') enemies.push(c); }
  for(const t of G.towers) { if(t.alive && t.team !== team) enemies.push(t); }
  for(const b of G.barracks) { if(b.alive && b.team !== team) enemies.push(b); }
  return enemies;
}

export function getAlliesOf(team) {
  const allies = [];
  for(const h of G.heroList) { if(h && h.alive && h.team === team) allies.push(h); }
  for(const c of G.creeps) { if(c.alive && c.team===team) allies.push(c); }
  for(const t of G.towers) { if(t.alive && t.team===team) allies.push(t); }
  return allies;
}

export function getEnemyHeroesOf(team) {
  return G.heroList.filter(h => h && h.alive && h.team !== team);
}

export function findEnemyNear(x, z, radius) {
  const h = G.playerHero; if(!h) return null;
  const enemies = getEnemiesOf(h.team);
  let best=null, bestD=radius;
  for(const e of enemies) {
    if(!e.alive) continue;
    const dx=e.x-x, dz=e.z-z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d<bestD){bestD=d;best=e;}
  }
  return best;
}

// ─── Movement helper ────────────────────────────────────────────────────────────
export function moveToward(entity, tx, tz, dt) {
  const dx=tx-entity.x, dz=tz-entity.z;
  const d=Math.sqrt(dx*dx+dz*dz);
  if(d < 0.15) return;
  const spd = ((entity.def||{move:4}).move || 4) + (entity.itemBonus?.move||0);
  const slowFactor = entity.slowTimer>0 ? 0.7 : 1;
  const mv = Math.min(d, spd*slowFactor*dt);
  entity.x += (dx/d)*mv;
  entity.z += (dz/d)*mv;
  entity.group.position.x = entity.x;
  entity.group.position.z = entity.z;
  entity.group.rotation.y = Math.atan2(dx, dz);
}

// ─── Projectiles ────────────────────────────────────────────────────────────────
export function spawnProjectile(from, target, color, dmg, dmgType, onHit) {
  const geo = new THREE.SphereGeometry(0.12,6,4);
  const mat = new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.8});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(from.x, 1.2, from.z);
  scene.add(mesh);
  G.projectiles.push({mesh, from, target, dmg, dmgType, speed:20, onHit, alive:true});
}

export function spawnSpellProjectile(x,z, target, color, speed, onHit) {
  const geo = new THREE.SphereGeometry(0.18,6,4);
  const mat = new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:1});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 1.2, z);
  scene.add(mesh);
  G.projectiles.push({mesh, target, dmg:0, dmgType:'magic', speed, onHit, alive:true});
}

export function updateProjectiles(dt) {
  for(const p of G.projectiles) {
    if(!p.alive) continue;
    const t = p.target;
    if(!t||!t.alive) { p.alive=false; scene.remove(p.mesh); continue; }
    const tx=t.x||t.def?.x||0, tz=t.z||t.def?.z||0;
    const dx=tx-p.mesh.position.x, dy=(t.group?.position.y||1.2)-p.mesh.position.y, dz=tz-p.mesh.position.z;
    const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(d < 0.5) {
      p.alive=false;
      scene.remove(p.mesh);
      let actualDmg = 0;
      if(t.alive && p.dmg > 0) actualDmg = applyDamage(t, p.dmg, p.dmgType, p.from);
      if(p.onHit) p.onHit(t, actualDmg);
    } else {
      p.mesh.position.x += (dx/d)*p.speed*dt;
      p.mesh.position.y += (dy/d)*p.speed*dt;
      p.mesh.position.z += (dz/d)*p.speed*dt;
    }
  }
  G.projectiles = G.projectiles.filter(p=>p.alive);
}
