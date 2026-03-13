// ─── HERO CREATION ─────────────────────────────────────────────────────────────
import { HERO_DEFS } from './constants.js';
import { scene } from './scene.js';

export function createHero(type, isPlayer) {
  const def = HERO_DEFS[type];
  const group = new THREE.Group();

  const bodyRadius = type==='dragon_knight' ? 0.45 : (type==='shadow_fiend' ? 0.28 : 0.35);
  const bodyTopR = type==='dragon_knight' ? 0.5 : (type==='shadow_fiend' ? 0.35 : 0.4);
  const bodyH = type==='dragon_knight' ? 1.3 : 1.2;
  const bodyColor = type==='shadow_fiend' ? 0x220000 : def.color;
  const bodyMetal = type==='dragon_knight' ? 0.4 : 0.1;
  const bodyEmissive = type==='shadow_fiend' ? 0x110000 : undefined;
  const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyTopR, bodyH, 8);
  const bodyMatOpts = {color:bodyColor, roughness:0.7, metalness:bodyMetal};
  if(bodyEmissive) { bodyMatOpts.emissive = new THREE.Color(bodyEmissive); bodyMatOpts.emissiveIntensity = 0.3; }
  const bodyMat = new THREE.MeshStandardMaterial(bodyMatOpts);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = type==='dragon_knight' ? 0.65 : 0.6;
  body.castShadow = true;
  group.add(body);

  // Head — shadow_fiend and dragon_knight have custom heads built below; lich/sniper/windrunner use sphere
  const headRadius = type==='dragon_knight' ? 0 : (type==='shadow_fiend' ? 0.28 : 0.32);
  const headMat = new THREE.MeshStandardMaterial({color:def.headColor, roughness:0.6});
  let head = null;
  if(headRadius > 0) {
    const headGeo = new THREE.SphereGeometry(headRadius,8,6);
    head = new THREE.Mesh(headGeo, headMat);
    head.position.y = type==='shadow_fiend' ? 1.45 : 1.42;
    head.castShadow = true;
    group.add(head);
  } else {
    // DK head is the helm added in hero-specific section
    head = body; // fallback reference
  }

  // Hero-specific geometry
  if(type === 'dragon_knight') {
    // Armored chest plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.65,0.7,0.32), new THREE.MeshStandardMaterial({color:0xcc5511,roughness:0.4,metalness:0.6}));
    plate.position.set(0,0.75,0.18); group.add(plate);
    // Pauldrons (shoulder guards)
    for(const s of [-1,1]) {
      const paul = new THREE.Mesh(new THREE.SphereGeometry(0.22,6,4), new THREE.MeshStandardMaterial({color:0xcc5511,roughness:0.4,metalness:0.5}));
      paul.scale.set(1,0.6,1); paul.position.set(s*0.52,1.05,0); group.add(paul);
    }
    // Helm
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.37,0.38,8), new THREE.MeshStandardMaterial({color:0xcc5511,roughness:0.35,metalness:0.65}));
    helm.position.y = 1.52; group.add(helm);
    // Visor slit
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.1,0.32), new THREE.MeshStandardMaterial({color:0x1a0800}));
    visor.position.set(0,1.5,0.18); group.add(visor);
    // Dragon horns
    for(const s of [-1,1]) {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.08,0.32,5), new THREE.MeshStandardMaterial({color:0xdd7700,roughness:0.6}));
      horn.position.set(s*0.2,1.73,0); horn.rotation.z = s*0.45; group.add(horn);
    }
    // Sword
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.09,1.5,0.06), new THREE.MeshStandardMaterial({color:0xccccdd,metalness:0.9,roughness:0.1}));
    sword.position.set(0.56,0.88,0); sword.rotation.z = 0.2; group.add(sword);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.07,0.08), new THREE.MeshStandardMaterial({color:0xdd9900,metalness:0.7,roughness:0.3}));
    guard.position.set(0.56,0.46,0); guard.rotation.z = 0.2; group.add(guard);
  } else if(type === 'shadow_fiend') {
    // Wings
    for(const s of [-1,1]) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0,0); wingShape.lineTo(s*1.4,0.5); wingShape.lineTo(s*1.8,1.1);
      wingShape.lineTo(s*1.2,1.5); wingShape.lineTo(s*0.3,0.9); wingShape.closePath();
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape),
        new THREE.MeshBasicMaterial({color:0x440011,side:THREE.DoubleSide,transparent:true,opacity:0.82}));
      wing.position.set(0,0.2,-0.1); group.add(wing);
    }
    // Soul aura
    const soulAura = new THREE.Mesh(new THREE.SphereGeometry(0.55,8,6),
      new THREE.MeshBasicMaterial({color:0xff2200,transparent:true,opacity:0.07,side:THREE.DoubleSide}));
    soulAura.position.y = 0.8; group.add(soulAura);
    // Glowing red eyes
    for(const s of [-1,1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065,5,4),
        new THREE.MeshStandardMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:2}));
      eye.position.set(s*0.1,1.48,0.24); group.add(eye);
    }
    // Horns
    for(const s of [-1,1]) {
      const sfHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.07,0.38,5),
        new THREE.MeshStandardMaterial({color:0x550000,roughness:0.6}));
      sfHorn.position.set(s*0.15,1.72,0); sfHorn.rotation.z = s*0.52; group.add(sfHorn);
    }
  } else if(type === 'windrunner') {
    // Cape
    const cape = new THREE.Mesh(new THREE.ConeGeometry(0.5,1.0,6),
      new THREE.MeshStandardMaterial({color:0x115533,roughness:0.8,side:THREE.DoubleSide}));
    cape.position.set(0,0.5,-0.22); cape.rotation.x = 0.32; group.add(cape);
    // Hair
    const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.19,0.6,6),
      new THREE.MeshStandardMaterial({color:0xaa6600,roughness:0.9}));
    hair.position.set(0,1.12,-0.18); hair.rotation.x = 0.42; group.add(hair);
    // Bow
    const bowCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.44,0.38,0), new THREE.Vector3(0.66,0.9,0), new THREE.Vector3(0.44,1.42,0));
    const bow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve,8,0.026,4,false),
      new THREE.MeshStandardMaterial({color:0x5a3a10,roughness:0.7}));
    group.add(bow);
    // Bowstring
    const strCurve = new THREE.LineCurve3(new THREE.Vector3(0.44,0.38,0), new THREE.Vector3(0.44,1.42,0));
    const bowStr = new THREE.Mesh(new THREE.TubeGeometry(strCurve,2,0.008,3,false),
      new THREE.MeshBasicMaterial({color:0xddcc88}));
    group.add(bowStr);
    // Quiver
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.62,6),
      new THREE.MeshStandardMaterial({color:0x4a2a08}));
    quiver.position.set(-0.3,0.78,-0.22); quiver.rotation.z = 0.32; group.add(quiver);
  }

  // Weapon (lich staff and sniper rifle; dk/sf/wr weapons built in hero-specific section above)
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
  } else if(type === 'sniper') {
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
    shrapnelZones:[],
    // Dragon Knight buffs
    dragonFormActive:false, dragonFormTimer:0,
    // Windrunner buffs
    windrunActive:false, windrunTimer:0,
    focusFireActive:false, focusFireTimer:0, focusFireTarget:null,
    // Shadow Fiend soul stacks
    soulStacks:0
  };
  scene.add(group);
  return hero;
}
