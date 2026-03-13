// ─── TOWERS ────────────────────────────────────────────────────────────────────
import { TOWER_DEFS } from './constants.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { getEnemiesOf, spawnProjectile } from './combat.js';
import { playSound } from './audio.js';

export function buildTowers() {
  for(const def of TOWER_DEFS) {
    const tower = createTower(def);
    G.towers.push(tower);
    scene.add(tower.group);
  }
}

export function createTower(def) {
  const isAncient = def.lane === 'ancient';
  const r1 = isAncient ? 1.2 : 0.4;
  const r2 = isAncient ? 1.4 : 0.5;
  const h = isAncient ? 4 : 3;
  const color = def.team === 'scourge' ? 0x882222 : 0x224488;

  const group = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(r1, r2, h, 6);
  const bodyMat = new THREE.MeshStandardMaterial({color, roughness:0.6, metalness:0.3});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h/2;
  body.castShadow = true;
  group.add(body);

  const topGeo = new THREE.SphereGeometry(isAncient?1.0:0.6, 8, 6);
  const topMat = new THREE.MeshStandardMaterial({color:isAncient?0xffcc44:color, roughness:0.3, metalness:0.5,
    emissive:isAncient?0xaa8800:color, emissiveIntensity:0.3});
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = h+0.4;
  group.add(top);

  // HP bar
  const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(2,0.25), new THREE.MeshBasicMaterial({color:0x330000, side:THREE.DoubleSide}));
  hpBg.position.set(0, h+1.4, 0);
  hpBg.rotation.x = -Math.PI/2 + 0.01;
  group.add(hpBg);
  const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(2,0.25), new THREE.MeshBasicMaterial({color:isAncient?0xffcc44:0x22cc22, side:THREE.DoubleSide}));
  hpFill.position.set(0, h+1.41, 0);
  hpFill.rotation.x = -Math.PI/2 + 0.01;
  group.add(hpFill);

  group.position.set(def.x, 0, def.z);

  const t = {
    group, body, hpFill, def,
    team:def.team, lane:def.lane, tier:def.tier,
    hp:def.hp, maxHp:def.hp, alive:true,
    atkTimer:0, atkCd:1/0.7, range:14, dmg:130,
    x:def.x, z:def.z
  };
  if(isAncient) { t.range = 12; }
  return t;
}

export function updateTowers(dt) {
  for(const tower of G.towers) {
    if(!tower.alive) continue;
    tower.atkTimer -= dt;
    if(tower.atkTimer > 0) continue;

    const enemies = getEnemiesOf(tower.team).filter(e=>e.alive);
    let best=null, bestDist=Infinity;
    for(const e of enemies) {
      const dx=e.x-tower.x, dz=e.z-tower.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d<=tower.range && d<bestDist){bestDist=d;best=e;}
    }
    if(best) {
      tower.atkTimer = tower.atkCd;
      spawnProjectile(tower, best, tower.team==='scourge'?0xff4444:0x4488ff, tower.dmg, 'pure', null);
      playSound('tower_hit');
    }
  }
}
