// ─── CREEPS ────────────────────────────────────────────────────────────────────
import { WAYPOINTS } from './constants.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { getEnemiesOf, spawnProjectile, moveToward } from './combat.js';
import { playSound } from './audio.js';

export function spawnWave() {
  const lanes = ['top','mid','bot'];
  for(const lane of lanes) {
    spawnLaneCreeps('scourge', lane);
    spawnLaneCreeps('sentinel', lane);
  }
}

export function spawnLaneCreeps(team, lane) {
  const wps = WAYPOINTS[team][lane];
  const start = wps[0];
  for(let i=0;i<3;i++) {
    const c = createCreep('melee', team, lane, wps);
    c.group.position.set(start.x + (Math.random()-0.5)*3, 0, start.z + (Math.random()-0.5)*3);
    c.x = c.group.position.x; c.z = c.group.position.z;
    scene.add(c.group);
    G.creeps.push(c);
  }
  const rc = createCreep('ranged', team, lane, wps);
  rc.group.position.set(start.x + (Math.random()-0.5)*2, 0, start.z + (Math.random()-0.5)*2);
  rc.x = rc.group.position.x; rc.z = rc.group.position.z;
  scene.add(rc.group);
  G.creeps.push(rc);
}

export function createCreep(type, team, lane, wps) {
  const isMelee = type === 'melee';
  const color = team === 'scourge' ? 0x882222 : 0x224488;
  const s = isMelee ? 0.5 : 0.35;
  const geo = new THREE.BoxGeometry(s,s,s);
  const mat = new THREE.MeshStandardMaterial({color, roughness:0.8});
  const body = new THREE.Mesh(geo, mat);
  body.position.y = s/2;
  body.castShadow = true;

  const group = new THREE.Group();
  group.add(body);

  // HP bar
  const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.1), new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide}));
  hpBg.position.set(0,s+0.3,0);
  group.add(hpBg);
  const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.1), new THREE.MeshBasicMaterial({color:color,side:THREE.DoubleSide}));
  hpFill.position.set(0,s+0.31,0);
  group.add(hpFill);

  return {
    group, body, hpFill,
    type, team, lane, wps,
    hp: isMelee ? 550 : 360,
    maxHp: isMelee ? 550 : 360,
    dmgMin: isMelee ? 30 : 25,
    dmgMax: isMelee ? 38 : 33,
    range: isMelee ? 1.5 : 8,
    speed: isMelee ? 4 : 4.5,
    armor: 2,
    atkCd: isMelee ? 1.0 : 0.9,
    atkTimer: Math.random()*0.8,
    wpIndex: 0,
    alive: true,
    attackTarget: null,
    x:0, z:0,
    slowTimer:0, stunTimer:0
  };
}

function findCreepTarget(creep) {
  const enemies = getEnemiesOf(creep.team).filter(e=>e.alive);
  let best=null, bestDist=Infinity;
  for(const e of enemies) {
    const dx=e.x-creep.x, dz=e.z-creep.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d<=creep.range*2 && d<bestDist){bestDist=d;best=e;}
  }
  return best;
}

export function updateCreeps(dt) {
  for(const creep of G.creeps) {
    if(!creep.alive) continue;
    if(creep.stunTimer>0){creep.stunTimer-=dt;continue;}
    if(creep.slowTimer>0) creep.slowTimer-=dt;

    // HP bar
    creep.hpFill.scale.x = Math.max(0.001, creep.hp/creep.maxHp);
    creep.hpFill.position.x = -(1-creep.hp/creep.maxHp)*0.35;

    // Find attack target
    if(!creep.attackTarget || !creep.attackTarget.alive) {
      creep.attackTarget = findCreepTarget(creep);
    }

    if(creep.attackTarget && creep.attackTarget.alive) {
      const tx=creep.attackTarget.x, tz=creep.attackTarget.z;
      const dx=tx-creep.x, dz=tz-creep.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d <= creep.range) {
        creep.atkTimer -= dt;
        if(creep.atkTimer<=0) {
          creep.atkTimer = creep.atkCd;
          const dmg = creep.dmgMin + Math.random()*(creep.dmgMax-creep.dmgMin);
          spawnProjectile(creep, creep.attackTarget, creep.team==='scourge'?0xff4444:0x4488ff, dmg, 'physical', null);
          playSound('hit');
          // Frost armor proc (Lich passive)
          if(G.playerHero && G.playerHero.type==='lich' && creep.attackTarget===G.playerHero) {
            creep.slowTimer = 2;
          }
        }
      } else {
        moveToward(creep, tx, tz, dt);
      }
    } else {
      creep.attackTarget = null;
      if(creep.wpIndex < creep.wps.length) {
        const wp = creep.wps[creep.wpIndex];
        const dx=wp.x-creep.x, dz=wp.z-creep.z;
        if(Math.sqrt(dx*dx+dz*dz)<1.5) creep.wpIndex++;
        else moveToward(creep, wp.x, wp.z, dt);
      }
    }
  }

  // Remove dead creeps from array periodically
  if(G.creeps.length > 200) {
    G.creeps = G.creeps.filter(c=>{
      if(!c.alive && !c.group.visible) {
        scene.remove(c.group); return false;
      }
      return true;
    });
  }
}
