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

export function applyDamage(target, amount, type) {
  if(!target || !target.alive) return 0;
  let actual = 0;
  if(type==='physical') actual = calcPhysDmg(amount, target.armor||0);
  else if(type==='magic') actual = calcMagicDmg(amount);
  else actual = amount; // pure
  actual = Math.floor(actual);
  target.hp -= actual;
  const col = type==='magic'?'#00ffcc':(type==='pure'?'#ffffff':'#ffaa44');
  floatDamage(target.x, target.z, actual, col);
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
  } else if(entity.def) { // tower
    onTowerDeath(entity);
  } else { // creep
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

  // Import these lazily to avoid circular deps - use G references
  const { showAnnouncer } = window._hudFns || {};

  if(hero.isPlayer) {
    G.deaths++;
    if(showAnnouncer) showAnnouncer('YOU DIED', '#ff4444', 2000);
    else { const el=document.getElementById('announcer'); if(el){el.textContent='YOU DIED';el.style.color='#ff4444';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',1600);} }
  } else {
    const goldGain = 200 + 50*G.level;
    G.gold += goldGain;
    G.kills++;
    G.killStreak++;
    if(!G.firstBlood) {
      G.firstBlood = true;
      if(showAnnouncer) showAnnouncer('FIRST BLOOD!', '#ff4444');
      else { const el=document.getElementById('announcer'); if(el){el.textContent='FIRST BLOOD!';el.style.color='#ff4444';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2100);} }
      playSound('gold');
    } else if(G.killStreak >= 2) {
      if(showAnnouncer) showAnnouncer('KILL STREAK!', '#ff8800');
      else { const el=document.getElementById('announcer'); if(el){el.textContent='KILL STREAK!';el.style.color='#ff8800';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2100);} }
    }
    floatDamage(hero.x, hero.z, '+'+goldGain+'g', '#ffcc44');
    if(G.playerHero) addXP(100 + 20*G.playerHero.level);
    playSound('gold');
  }
}

function onTowerDeath(tower) {
  tower.group.visible = false;
  const { showAnnouncer } = window._hudFns || {};
  if(showAnnouncer) showAnnouncer('TOWER DESTROYED', '#ffcc44');
  else { const el=document.getElementById('announcer'); if(el){el.textContent='TOWER DESTROYED';el.style.color='#ffcc44';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2100);} }
  playSound('tower_death');

  if(tower.lane === 'ancient') {
    const playerWon = (tower.team !== G.playerHero.team);
    if(window._endGame) window._endGame(playerWon);
  }

  if(tower.team !== G.playerHero.team) {
    const g = tower.tier === 4 ? 200 : 80+tower.tier*30;
    G.gold += g;
    floatDamage(G.playerHero.x, G.playerHero.z, '+'+g+'g', '#ffcc44');
  }
}

function onCreepDeath(creep) {
  creep.group.visible = false;
  const ph = G.playerHero;
  if(ph && ph.alive) {
    const dx = ph.x - creep.x, dz = ph.z - creep.z;
    if(Math.sqrt(dx*dx+dz*dz) < 20) {
      addXP(50);
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

function onLevelUp(h) {
  playSound('levelup');
  h.maxHp += 40; h.hp = Math.min(h.hp+40, h.maxHp);
  h.maxMp += 20; h.mp = Math.min(h.mp+20, h.maxMp);
  const { showAnnouncer, updateSkillUI } = window._hudFns || {};
  if(showAnnouncer) showAnnouncer('LEVEL UP! '+h.level, '#ffcc44', 1500);
  else { const el=document.getElementById('announcer'); if(el){el.textContent='LEVEL UP! '+h.level;el.style.color='#ffcc44';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',1100);} }
  const keys = ['Q','W','E','R'];
  const min = Math.min(...keys.map(k=>G.skillLevels[k]));
  const toUp = keys.find(k=>G.skillLevels[k]===min && G.skillLevels[k]<4);
  if(toUp) G.skillLevels[toUp] = Math.min(4, G.skillLevels[toUp]+1);
  if(updateSkillUI) updateSkillUI();
  spawnParticles(h.x, h.z, 0xffcc44, 8);
}

// ─── Enemy/Ally queries ─────────────────────────────────────────────────────────
export function getEnemiesOf(team) {
  const enemies = [];
  const eh = team==='scourge' ? G.aiHero : G.playerHero;
  if(eh && eh.alive) enemies.push(eh);
  for(const c of G.creeps) { if(c.alive && c.team !== team) enemies.push(c); }
  for(const t of G.towers) { if(t.alive && t.team !== team) enemies.push(t); }
  return enemies;
}

export function getAlliesOf(team) {
  const allies = [];
  for(const c of G.creeps) { if(c.alive && c.team===team) allies.push(c); }
  for(const t of G.towers) { if(t.alive && t.team===team) allies.push(t); }
  return allies;
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
  G.projectiles.push({mesh, target, dmg, dmgType, speed:20, onHit, alive:true});
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
      if(t.alive && p.dmg > 0) actualDmg = applyDamage(t, p.dmg, p.dmgType);
      if(p.onHit) p.onHit(t, actualDmg);
    } else {
      p.mesh.position.x += (dx/d)*p.speed*dt;
      p.mesh.position.y += (dy/d)*p.speed*dt;
      p.mesh.position.z += (dz/d)*p.speed*dt;
    }
  }
  G.projectiles = G.projectiles.filter(p=>p.alive);
}
