// ─── HERO CREATION ─────────────────────────────────────────────────────────────
import { HERO_REGISTRY } from './heroes/registry.js';
import { scene } from './scene.js';

let _heroUidCounter = 0;

export function createHero(type, isPlayer) {
  const mod = HERO_REGISTRY[type];
  if (!mod) throw new Error('Unknown hero type: ' + type);

  const def = mod.def;
  const { group, parts } = mod.buildModel();

  // Selection ring
  const selGeo = new THREE.TorusGeometry(0.65, 0.05, 4, 16);
  const selMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
  const selRing = new THREE.Mesh(selGeo, selMat);
  selRing.position.y = 0.05;
  selRing.rotation.x = Math.PI / 2;
  selRing.visible = isPlayer;
  group.add(selRing);

  // HP bar (billboard)
  const hpBgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide }));
  hpBgMesh.position.set(0, 2.1, 0);
  group.add(hpBgMesh);
  const hpFillMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.15), new THREE.MeshBasicMaterial({ color: 0x22cc22, side: THREE.DoubleSide }));
  hpFillMesh.position.set(0, 2.11, 0);
  group.add(hpFillMesh);

  // MP bar
  const mpBgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x000033, side: THREE.DoubleSide }));
  mpBgMesh.position.set(0, 1.94, 0);
  group.add(mpBgMesh);
  const mpFillMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x3366ff, side: THREE.DoubleSide }));
  mpFillMesh.position.set(0, 1.95, 0);
  group.add(mpFillMesh);

  group.position.set(0, 0, 0);

  const hero = {
    _uid: 'hero' + (_heroUidCounter++),
    type, group, parts, selRing, hpFillMesh, mpFillMesh,
    body: null, head: null,
    def, team: 'scourge',
    hp: def.hp, maxHp: def.hp, mp: def.mp, maxMp: def.mp,
    alive: true, isPlayer,
    moveTarget: null, attackTarget: null,
    atkTimer: 0, atkCd: 1 / def.atkSpd,
    x: 0, z: 0,
    vx: 0, vz: 0,
    level: 1, xp: 0, xpNext: 50,
    slowTimer: 0, stunTimer: 0, channeling: 0, chanTarget: null,
    respawnTimer: 0, respawnMax: 0,
    wpIndex: 0, aiState: 'march',
    headshotReady: false,
    assassinateTarget: null, assassinateTimer: 0,
    shrapnelZones: [],
    dragonFormActive: false, dragonFormTimer: 0,
    windrunActive: false, windrunTimer: 0,
    focusFireActive: false, focusFireTimer: 0, focusFireTarget: null,
    soulStacks: 0,
    armor: def.armor,
    inventory: [],
    itemCDs: {},
    itemBonus: { maxHp: 0, maxMp: 0, dmgMin: 0, dmgMax: 0, armor: 0, move: 0 },
    aiBuyTimer: 0, aiGold: 625,
    aiLane: 'mid', aiCastTimer: 5 + Math.random() * 5,
    isAllyBot: false,
    animTime: 0, _prevAnim: null,
    _atkAnimTimer: 0,
    _castAnim: null, _castAnimTimer: 0,
    _isMoving: false
  };
  scene.add(group);
  return hero;
}
