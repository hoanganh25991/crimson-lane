// ─── HERO CREATION ─────────────────────────────────────────────────────────────
import { HERO_DEFS } from './constants.js';
import { scene } from './scene.js';

export function createHero(type, isPlayer) {
  const def = HERO_DEFS[type];
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.35,0.4,1.2,8);
  const bodyMat = new THREE.MeshStandardMaterial({color:def.color, roughness:0.7, metalness:0.1});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.35,8,6);
  const headMat = new THREE.MeshStandardMaterial({color:def.headColor, roughness:0.6});
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.45;
  head.castShadow = true;
  group.add(head);

  // Weapon
  if(type === 'lich') {
    const staffGeo = new THREE.CylinderGeometry(0.04,0.04,1.8,5);
    const staffMat = new THREE.MeshStandardMaterial({color:0x6633cc, emissive:0x330066, emissiveIntensity:0.5});
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.5,0.9,0);
    staff.rotation.z = 0.2;
    group.add(staff);
    const orbGeo = new THREE.SphereGeometry(0.12,6,4);
    const orbMat = new THREE.MeshStandardMaterial({color:0x00ffcc, emissive:0x00ffcc, emissiveIntensity:1});
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.6,1.75,0);
    group.add(orb);
  } else {
    const rifleGeo = new THREE.CylinderGeometry(0.03,0.03,1.2,5);
    const rifleMat = new THREE.MeshStandardMaterial({color:0x554433});
    const rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.4,1.0,0);
    rifle.rotation.z = Math.PI/2 - 0.3;
    group.add(rifle);
  }

  // Selection ring
  const selGeo = new THREE.TorusGeometry(0.6, 0.05, 4, 16);
  const selMat = new THREE.MeshBasicMaterial({color:0xffcc44});
  const selRing = new THREE.Mesh(selGeo, selMat);
  selRing.position.y = 0.05;
  selRing.rotation.x = Math.PI/2;
  selRing.visible = isPlayer;
  group.add(selRing);

  // HP bar (billboard)
  const hpBgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.15), new THREE.MeshBasicMaterial({color:0x330000, side:THREE.DoubleSide}));
  hpBgMesh.position.set(0,2.1,0);
  group.add(hpBgMesh);
  const hpFillMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.15), new THREE.MeshBasicMaterial({color:0x22cc22, side:THREE.DoubleSide}));
  hpFillMesh.position.set(0,2.11,0);
  group.add(hpFillMesh);

  // MP bar
  const mpBgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.1), new THREE.MeshBasicMaterial({color:0x000033, side:THREE.DoubleSide}));
  mpBgMesh.position.set(0,1.94,0);
  group.add(mpBgMesh);
  const mpFillMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.1), new THREE.MeshBasicMaterial({color:0x3366ff, side:THREE.DoubleSide}));
  mpFillMesh.position.set(0,1.95,0);
  group.add(mpFillMesh);

  const startPos = def.team === 'scourge' ? {x:10,z:10} : {x:90,z:90};
  group.position.set(startPos.x, 0, startPos.z);

  const hero = {
    type, group, body, head, selRing, hpFillMesh, mpFillMesh,
    def, team:def.team,
    hp:def.hp, maxHp:def.hp, mp:def.mp, maxMp:def.mp,
    alive:true, isPlayer,
    moveTarget:null, attackTarget:null,
    atkTimer:0, atkCd:1/def.atkSpd,
    x:startPos.x, z:startPos.z,
    vx:0, vz:0,
    level:1, xp:0, xpNext:50,
    slowTimer:0, stunTimer:0, channeling:0, chanTarget:null,
    respawnTimer:0, respawnMax:0,
    wpIndex:0, aiState:'march',
    // Headshot passive tracking
    headshotReady:false,
    // Assassinate channel
    assassinateTarget:null, assassinateTimer:0,
    // Shrapnel zones
    shrapnelZones:[]
  };
  scene.add(group);
  return hero;
}
