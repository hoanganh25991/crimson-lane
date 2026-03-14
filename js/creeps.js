// ─── CREEPS ────────────────────────────────────────────────────────────────────
import { WAYPOINTS, NEUTRAL_CAMPS } from './constants.js';
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
  const mega = G.megaLanes[team]?.[lane] || false;
  const color = team === 'scourge' ? 0x882222 : 0x224488;
  const s = isMelee ? (mega ? 0.7 : 0.5) : 0.35;
  const geo = new THREE.BoxGeometry(s,s,s);
  const mat = new THREE.MeshStandardMaterial({color: mega ? (team==='scourge'?0xff4444:0x4488ff) : color, roughness:0.8});
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

  const baseHp = isMelee ? 550 : 360;
  const baseDmgMin = isMelee ? 30 : 25;
  const baseDmgMax = isMelee ? 38 : 33;
  return {
    group, body, hpFill,
    type, team, lane, wps,
    hp: mega ? baseHp*2 : baseHp,
    maxHp: mega ? baseHp*2 : baseHp,
    dmgMin: mega ? baseDmgMin*2 : baseDmgMin,
    dmgMax: mega ? baseDmgMax*2 : baseDmgMax,
    range: isMelee ? 1.5 : 8,
    speed: isMelee ? 4 : 4.5,
    armor: mega ? 6 : 2,
    atkCd: isMelee ? 1.0 : 0.9,
    atkTimer: Math.random()*0.8,
    wpIndex: 0,
    alive: true,
    attackTarget: null,
    x:0, z:0,
    slowTimer:0, stunTimer:0,
    lastHitter: null
  };
}

export function createNeutralCreep(tier, camp) {
  const hp = tier===2 ? 480 : 280;
  const color = tier===2 ? 0x886633 : 0x664422;
  const s = tier===2 ? 0.65 : 0.5;
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(s,s*1.2,s);
  const mat = new THREE.MeshStandardMaterial({color, roughness:0.9});
  const body = new THREE.Mesh(geo, mat);
  body.position.y = s*0.6; body.castShadow = true;
  group.add(body);
  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({color:0xff6600});
  const eyeGeo = new THREE.SphereGeometry(0.06,4,4);
  const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-s*0.25,s*0.6,s*0.4); group.add(e1);
  const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(s*0.25,s*0.6,s*0.4); group.add(e2);
  // HP bar
  const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.1),new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide}));
  hpBg.position.set(0,s+0.4,0); group.add(hpBg);
  const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.1),new THREE.MeshBasicMaterial({color:0xaa6600,side:THREE.DoubleSide}));
  hpFill.position.set(0,s+0.41,0); group.add(hpFill);
  group.position.set(camp.x+(Math.random()-0.5)*3, 0, camp.z+(Math.random()-0.5)*3);
  return {
    group, hpFill,
    type:'neutral', team:'neutral', lane:'jungle', tier,
    campRef: camp,
    hp, maxHp:hp,
    dmgMin: tier===2?35:20, dmgMax: tier===2?45:28,
    range:1.8, armor: tier===2?3:1,
    atkCd:1.2, atkTimer:Math.random()*1.2,
    alive:true, attackTarget:null,
    x:group.position.x, z:group.position.z,
    homeX:camp.x, homeZ:camp.z, leash:camp.leash||12,
    slowTimer:0, stunTimer:0, lastHitter:null, wps:null, wpIndex:0
  };
}

export function initNeutralCamps() {
  for(const campDef of NEUTRAL_CAMPS) {
    const camp = {
      ...campDef, alive:true, respawnTimer:0, deadCount:0,
      units: []
    };
    const count = campDef.tier===2 ? 2 : 3;
    camp.units = new Array(count).fill(null);
    for(let i=0;i<count;i++) {
      const creep = createNeutralCreep(campDef.tier, camp);
      camp.units[i] = creep;
      scene.add(creep.group);
      G.creeps.push(creep);
    }
    G.neutralCamps.push(camp);
  }
}

export function updateNeutralCamps(dt) {
  for(const camp of G.neutralCamps) {
    if(!camp.alive) {
      if(camp.respawnTimer > 0) {
        camp.respawnTimer -= dt;
        if(camp.respawnTimer <= 0) {
          // Respawn camp
          camp.alive = true; camp.deadCount = 0;
          for(let i=0;i<camp.units.length;i++) {
            const creep = createNeutralCreep(camp.tier, camp);
            camp.units[i] = creep;
            scene.add(creep.group);
            G.creeps.push(creep);
          }
        }
      }
    }
  }

  // Neutral creep leash & idle logic
  for(const creep of G.creeps) {
    if(!creep.alive || creep.type !== 'neutral') continue;
    if(!creep.attackTarget || !creep.attackTarget.alive) {
      // Wander back to home
      const dx=creep.homeX-creep.x, dz=creep.homeZ-creep.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d > 1) {
        const spd=3.5, mv=Math.min(d,spd*dt);
        creep.x+=(dx/d)*mv; creep.z+=(dz/d)*mv;
        creep.group.position.x=creep.x; creep.group.position.z=creep.z;
        creep.group.rotation.y=Math.atan2(dx,dz);
        // Heal when returning home
        if(creep.hp < creep.maxHp) creep.hp = Math.min(creep.maxHp, creep.hp+20*dt);
      }
    } else {
      // Check leash
      const dx=creep.x-creep.homeX, dz=creep.z-creep.homeZ;
      if(Math.sqrt(dx*dx+dz*dz) > creep.leash) {
        creep.attackTarget = null;
        creep.hp = creep.maxHp; // reset HP on leash
      }
    }
    // Update HP bar
    creep.hpFill.scale.x = Math.max(0.001, creep.hp/creep.maxHp);
    creep.hpFill.position.x = -(1-creep.hp/creep.maxHp)*0.35;
  }
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
          // Frost armor proc: slow attacker if target is a lich hero
          if(creep.attackTarget && creep.attackTarget.type==='lich' && creep.attackTarget.isPlayer !== undefined) {
            creep.slowTimer = 2;
          }
        }
      } else {
        moveToward(creep, tx, tz, dt);
      }
    } else {
      creep.attackTarget = null;
      if(creep.wps && creep.wpIndex < creep.wps.length) {
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
