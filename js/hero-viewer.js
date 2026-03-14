import { stdMat, glowMat, metalMat, transMat } from './hero-models.js';
import { HERO_REGISTRY, ALL_HERO_IDS } from './heroes/registry.js';
import { t } from './i18n.js';

let heroViewerInited = false;
export function initHeroViewer() {
  if (heroViewerInited) return;
  const canvas = document.getElementById('hv-hero-canvas');
  if (!canvas) return;
  heroViewerInited = true;

  // ─── VIEWER STATS (primary attr + str/agi/int for display; from docs/heroes.md) ─
  const VIEWER_STATS = {
    lich: { primary: 'int', str: 15, strG: 1.75, agi: 15, agiG: 1.5, int: 22, intG: 3.0, hpLvl: 19, manaLvl: 26 },
    sniper: { primary: 'agi', str: 15, strG: 1.7, agi: 21, agiG: 2.9, int: 16, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    dragonKnight: { primary: 'str', str: 21, strG: 2.9, agi: 21, agiG: 1.5, int: 14, intG: 1.5, hpLvl: 25, manaLvl: 13 },
    shadowFiend: { primary: 'agi', str: 15, strG: 2.0, agi: 20, agiG: 2.9, int: 18, intG: 1.8, hpLvl: 19, manaLvl: 14 },
    windrunner: { primary: 'agi', str: 15, strG: 1.5, agi: 21, agiG: 2.9, int: 18, intG: 2.0, hpLvl: 19, manaLvl: 26 },
    axe: { primary: 'str', str: 22, strG: 2.5, agi: 18, agiG: 1.5, int: 16, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    pudge: { primary: 'str', str: 23, strG: 2.7, agi: 16, agiG: 1.4, int: 18, intG: 1.6, hpLvl: 25, manaLvl: 14 },
    sven: { primary: 'str', str: 21, strG: 2.4, agi: 18, agiG: 1.6, int: 15, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    tidehunter: { primary: 'str', str: 21, strG: 2.3, agi: 17, agiG: 1.5, int: 17, intG: 1.5, hpLvl: 19, manaLvl: 14 },
    earthshaker: { primary: 'str', str: 20, strG: 2.3, agi: 17, agiG: 1.5, int: 19, intG: 1.8, hpLvl: 19, manaLvl: 14 },
    phantomAssassin: { primary: 'agi', str: 17, strG: 1.7, agi: 22, agiG: 2.9, int: 15, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    juggernaut: { primary: 'agi', str: 18, strG: 1.9, agi: 21, agiG: 2.6, int: 16, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    drowRanger: { primary: 'agi', str: 15, strG: 1.6, agi: 22, agiG: 2.8, int: 16, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    bountyHunter: { primary: 'agi', str: 16, strG: 1.6, agi: 21, agiG: 2.6, int: 17, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    vengefulSpirit: { primary: 'agi', str: 17, strG: 1.8, agi: 20, agiG: 2.6, int: 17, intG: 1.5, hpLvl: 19, manaLvl: 13 },
    crystalMaiden: { primary: 'int', str: 15, strG: 1.75, agi: 15, agiG: 1.5, int: 22, intG: 2.9, hpLvl: 19, manaLvl: 26 },
    zeus: { primary: 'int', str: 17, strG: 1.8, agi: 16, agiG: 1.5, int: 22, intG: 2.7, hpLvl: 19, manaLvl: 14 },
    lina: { primary: 'int', str: 15, strG: 1.5, agi: 18, agiG: 2.0, int: 22, intG: 2.8, hpLvl: 19, manaLvl: 14 },
    lion: { primary: 'int', str: 15, strG: 1.5, agi: 18, agiG: 2.0, int: 22, intG: 2.8, hpLvl: 19, manaLvl: 14 },
    enigma: { primary: 'int', str: 17, strG: 1.8, agi: 16, agiG: 1.5, int: 22, intG: 2.7, hpLvl: 19, manaLvl: 14 },
  };

  function buildViewerHeroes() {
    const keys = ['Q', 'W', 'E', 'R'];
    return ALL_HERO_IDS.map((id) => {
      const mod = HERO_REGISTRY[id];
      const def = mod.def;
      const extra = VIEWER_STATS[id] || { primary: 'str', str: 20, strG: 2, agi: 20, agiG: 2, int: 20, intG: 2, hpLvl: 19, manaLvl: 13 };
      const team = (def.team || 'scourge').toLowerCase();
      const teamLabel = team === 'sentinel' ? t('viewer.sentinel') : t('viewer.scourge');
      const primaryLabel = extra.primary === 'str' ? t('viewer.strength') : extra.primary === 'agi' ? t('viewer.agility') : t('viewer.intelligence');
      const skills = keys.map((key, i) => {
        const name = mod.skillNames?.[key] || def.skills?.[i] || key;
        const costs = mod.skillCosts?.[key];
        const cds = mod.skillCDs?.[key];
        const skillType = mod.skillTypes?.[key] || 'active';
        const costStr = Array.isArray(costs) ? (costs[0] ?? costs) : (costs ?? 0);
        const cdVal = Array.isArray(cds) ? (cds[0] ?? cds) : (cds ?? 0);
        const typeLabel = t(`viewer.skill_type_${skillType}`);
        const costLabel = costStr > 0 ? t('viewer.mana_cost', { n: costStr }) : '';
        const cdLabel = cdVal > 0 ? t('viewer.cooldown', { n: cdVal }) : '';
        return {
          key,
          type: skillType,
          name: typeof name === 'string' ? name : (name && name.name) || key,
          meta: [typeLabel, costLabel, cdLabel].filter(Boolean).join(' · '),
          desc: t('viewer.skill_desc'),
          anim: key === 'R' ? 'castR' : 'castQ',
        };
      });
      return {
        id,
        name: def.name?.replace(/_/g, ' ') || id,
        sub: `${primaryLabel} · ${teamLabel}`,
        primary: extra.primary,
        color: def.color ?? 0x888888,
        baseHP: def.hp,
        hpLvl: extra.hpLvl ?? 19,
        baseMana: def.mp,
        manaLvl: extra.manaLvl ?? 13,
        armor: def.armor ?? 0,
        range: def.range ?? 128,
        ms: (def.move ?? 8) * 36,
        dmg: `${def.dmgMin ?? 0}–${def.dmgMax ?? 0}`,
        str: extra.str ?? 20,
        strG: extra.strG ?? 2,
        agi: extra.agi ?? 20,
        agiG: extra.agiG ?? 2,
        int: extra.int ?? 20,
        intG: extra.intG ?? 2,
        skills,
      };
    });
  }

  const HEROES = buildViewerHeroes();

  const PORTRAIT_ICONS = ['❄️','🎯','🐉','👻','🏹','🪓','🔪','⚔️','🐚','⛏️','🗡️','🌀','🏹','🥷','👻','❄️','⚡','🔥','🦁','🌑'];

// ─── THREE.JS SETUP ───────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07070f);
scene.fog = new THREE.Fog(0x07070f, 12, 30);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 1.8, 3.6);
camera.lookAt(0, 1.2, 0);

// ─── LIGHTING ────────────────────────────────────────────────────────────────
const hemi = new THREE.HemisphereLight(0x223355, 0x0a0a10, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(3, 6, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 30;
sun.shadow.camera.left = -4; sun.shadow.camera.right = 4;
sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -2;
scene.add(sun);
const fill1 = new THREE.PointLight(0x3355ff, 0.6, 10);
fill1.position.set(-3,2,1); scene.add(fill1);
const fill2 = new THREE.PointLight(0xff5533, 0.4, 10);
fill2.position.set(3,1,-2); scene.add(fill2);
const rim = new THREE.PointLight(0xaaccff, 0.5, 8);
rim.position.set(0, 4, -3); scene.add(rim);

// ─── SCENE OBJECTS ────────────────────────────────────────────────────────────
const platformGeo = new THREE.CylinderGeometry(1.5,1.5,0.08,32);
const platform = new THREE.Mesh(platformGeo, stdMat(0x1a1a2a,0.9,0.1));
platform.receiveShadow = true;
platform.position.y = -0.04;
scene.add(platform);

const ringGeo = new THREE.TorusGeometry(1.5,0.025,8,64);
const ringMesh = new THREE.Mesh(ringGeo, glowMat(0x4444ff,1.5));
ringMesh.rotation.x = Math.PI/2;
ringMesh.position.y = 0.01;
scene.add(ringMesh);

const grid = new THREE.GridHelper(10,20,0x111122,0x0d0d1a);
grid.position.y = -0.04;
scene.add(grid);

// Dummy target
const dummyGroup = new THREE.Group();
dummyGroup.position.set(1.4,0,0);
const dummyBody = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.6,0.3), stdMat(0x226633,0.9));
dummyBody.position.y = 0.34; dummyBody.castShadow = true;
const dummyHead = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6), stdMat(0x226633,0.9));
dummyHead.position.y = 0.85; dummyHead.castShadow = true;
dummyGroup.add(dummyBody,dummyHead);
scene.add(dummyGroup);

// Hero glow light
const heroLight = new THREE.PointLight(0x00ffcc, 1.0, 4);
heroLight.position.set(0,1.5,0.5);
scene.add(heroLight);

// ─── HERO MANAGEMENT ─────────────────────────────────────────────────────────
let heroObjects = [];
let currentHero = 0;
let currentAnim = 'idle';
let animTime = 0;
let attackSpeedMult = 1.0;

function buildAllHeroes() {
  heroObjects.forEach(h => { if (h && h.group) scene.remove(h.group); });
  heroObjects = ALL_HERO_IDS.map((id) => HERO_REGISTRY[id].buildModel());
  heroObjects.forEach((h, i) => {
    if (h && h.group) {
      h.group.visible = (i === currentHero);
      scene.add(h.group);
    }
  });
}

function showHero(idx) {
  heroObjects.forEach((h,i) => { h.group.visible = (i===idx); });
  currentHero = idx;
  const hero = HEROES[idx];
  // Update hero light color
  heroLight.color.setHex(hero.color);
  ringMesh.material = glowMat(hero.color, 1.5);
  updateUI();
  updatePortraits();
  setAnim('idle');
}

// ─── ANIMATION ────────────────────────────────────────────────────────────────
let isAutoRotate = false;
let cameraTheta = 0, cameraPhi = 0.3, cameraDist = 3.6;
let isDragging = false, lastMX = 0, lastMY = 0;

function setAnim(name) {
  currentAnim = name;
  animTime = 0;
  document.querySelectorAll('.hv-anim-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === name);
  });
  isAutoRotate = (name === 'idle');
}

function animateHero(dt) {
  const h = heroObjects[currentHero];
  if(!h) return;
  const p = h.parts || {};
  animTime += dt * attackSpeedMult;
  const t = animTime;
  const sin = Math.sin, cos = Math.cos;

  if(currentAnim === 'idle') {
    // Gentle breathing/bobbing
    h.group.position.y = sin(t*1.2)*0.015;
    if(p.armR) p.armR.rotation.x = sin(t*1.2)*0.04;
    if(p.armL) p.armL.rotation.x = sin(t*1.2+Math.PI)*0.04;
    if(p.skull) { p.skull.rotation.y = sin(t*0.8)*0.05; p.skull.position.y = 1.54+sin(t*1.2)*0.008; }
    if(p.gem) { p.gem.rotation.y = t*1.5; p.gem.rotation.x = sin(t*0.7)*0.3; }
    if(p.iceOrb) { p.iceOrb.position.x = -0.10+sin(t*1.1)*0.04; p.iceOrb.rotation.y = t*2; }
    if(p.iceShell) { p.iceShell.position.x = p.iceOrb.position.x; p.iceShell.rotation.y = -t*1.5; }
    if(p.wingL) { p.wingL.rotation.z = sin(t*1.0)*0.05; }
    if(p.wingR) { p.wingR.rotation.z = sin(t*1.0)*-0.05; }
    if(p.soulOrbs) p.soulOrbs.forEach((o,i) => {
      if(!o.visible) return;
      const a = o.userData.angle + t*1.2;
      o.position.set(sin(a)*o.userData.radius, o.userData.height+sin(t+i)*0.1, cos(a)*o.userData.radius);
    });
    if(p.wisps) p.wisps.forEach((w,i) => {
      const a = w.userData.angle + t*(0.8+i*0.1);
      w.position.set(sin(a)*w.userData.radius, w.userData.height+sin(t*1.5+i)*0.12, cos(a)*w.userData.radius);
    });
    if(p.cape) p.cape.rotation.z = sin(t*0.9)*0.04;
    if(p.bow) p.bow.rotation.z = sin(t*0.9)*0.03;
  }
  else if(currentAnim === 'walk') {
    h.group.position.y = Math.abs(sin(t*4))*0.04;
    if(p.armR) p.armR.rotation.x = sin(t*4)*0.35;
    if(p.armL) p.armL.rotation.x = sin(t*4+Math.PI)*0.35;
    if(p.legR) p.legR.rotation.x = sin(t*4)*0.4;
    if(p.legL) p.legL.rotation.x = sin(t*4+Math.PI)*0.4;
    if(p.cape) p.cape.rotation.x = sin(t*4)*0.08+0.05;
    if(p.bow) p.bow.position.z = 0.08+sin(t*4)*0.02;
    if(p.skull) p.skull.rotation.y = sin(t*2)*0.06;
    if(p.soulOrbs) p.soulOrbs.forEach((o,i) => {
      if(!o.visible) return;
      const a = o.userData.angle + t*2.5;
      o.position.set(sin(a)*o.userData.radius, o.userData.height+sin(t+i)*0.08, cos(a)*o.userData.radius);
    });
    if(p.wisps) p.wisps.forEach((w,i) => {
      const a = w.userData.angle + t*(1.5+i*0.1);
      w.position.set(sin(a)*w.userData.radius, w.userData.height+sin(t*2+i)*0.1, cos(a)*w.userData.radius);
    });
  }
  else if(currentAnim === 'attack') {
    const cycle = (t % 1.0) / 1.0;
    if(cycle < 0.3) {
      if(p.armR) p.armR.rotation.x = -sin(cycle/0.3*Math.PI)*0.6;
    } else if(cycle < 0.5) {
      const f = (cycle-0.3)/0.2;
      if(p.armR) p.armR.rotation.x = -sin((1-f)*Math.PI)*0.6;
      if(cycle > 0.35 && cycle < 0.45) {
        if(p.muzzle) { p.muzzle.visible = true; setTimeout(()=>{if(p.muzzle)p.muzzle.visible=false;},80); }
        // spawn arrow for ranged heroes
        if(p.type==='sniper' && Math.floor(t*10)%10===3) spawnBullet();
        if(p.type==='windrunner' && Math.floor(t*10)%10===3) spawnArrow();
      }
    } else {
      if(p.armR) p.armR.rotation.x += (0-p.armR.rotation.x)*0.15;
    }
    h.group.position.y = Math.abs(sin(t*2))*0.015;
    if(p.soulOrbs) p.soulOrbs.forEach((o,i) => {
      if(!o.visible) return;
      const a = o.userData.angle + t*2.0;
      o.position.set(sin(a)*o.userData.radius, o.userData.height+sin(t+i)*0.08, cos(a)*o.userData.radius);
    });
  }
  else if(currentAnim === 'castQ') {
    const cycle = (t % 1.2) / 1.2;
    if(p.armL) p.armL.rotation.x = sin(cycle*Math.PI)*-0.8;
    if(p.armR) p.armR.rotation.x = sin(cycle*Math.PI)*0.3;
    h.group.position.y = sin(t*2)*0.02;
    if(p.skull) p.skull.rotation.y = sin(t*3)*0.1;
    if(p.soulOrbs) p.soulOrbs.forEach((o,i) => {
      if(!o.visible) return;
      const a = o.userData.angle + t*3.0;
      o.position.set(sin(a)*o.userData.radius, o.userData.height+sin(t+i)*0.1, cos(a)*o.userData.radius);
    });
  }
  else if(currentAnim === 'castR') {
    if(p.armR) p.armR.rotation.x = sin(t*3)*0.5-0.3;
    if(p.armL) p.armL.rotation.x = sin(t*3+1)*0.5-0.3;
    h.group.position.y = Math.abs(sin(t*3))*0.04;
    h.group.rotation.y = sin(t*1.5)*0.1;
    if(p.wingL) p.wingL.rotation.z = sin(t*2)*0.25+0.2;
    if(p.wingR) p.wingR.rotation.z = -sin(t*2)*0.25-0.2;
    if(p.soulOrbs) p.soulOrbs.forEach((o,i) => {
      if(!o.visible) return;
      const a = o.userData.angle + t*4.0;
      const r = o.userData.radius*(1.0+sin(t*3+i)*0.3);
      o.position.set(sin(a)*r, o.userData.height+sin(t*2+i)*0.2, cos(a)*r);
    });
    if(p.gem) { p.gem.rotation.y = t*4; }
  }
  else if(currentAnim === 'die') {
    const fall = Math.min(t*0.8, Math.PI/2);
    h.group.rotation.x = fall;
    h.group.position.y = -sin(fall)*0.3;
    if(p.armR) p.armR.rotation.z = fall*0.5;
    if(p.armL) p.armL.rotation.z = -fall*0.5;
  }
}

// ─── SPELL EFFECTS ────────────────────────────────────────────────────────────
const effects = [];

function addEffect(obj, duration, onTick, onDone) {
  effects.push({obj, duration, elapsed:0, onTick, onDone});
  scene.add(obj);
}

function tickEffects(dt) {
  for(let i=effects.length-1; i>=0; i--) {
    const e = effects[i];
    e.elapsed += dt;
    e.onTick && e.onTick(e.elapsed/e.duration, e.elapsed);
    if(e.elapsed >= e.duration) {
      scene.remove(e.obj);
      e.onDone && e.onDone();
      effects.splice(i,1);
    }
  }
}

function announce(text, color='#ffcc44') {
  const el = document.getElementById('hv-announcer');
  el.textContent = text;
  el.style.color = color;
  el.style.opacity = '1';
  setTimeout(()=>{ el.style.opacity='0'; }, 1800);
}

function showDamage(val, color='#ffffff') {
  const wrap = document.getElementById('hv-dmg-overlay');
  const el = document.createElement('div');
  el.className = 'hv-dmg-num';
  el.style.color = color;
  el.style.left = (40+Math.random()*20)+'%';
  el.style.top = (20+Math.random()*20)+'%';
  el.textContent = (Math.random()<0.05?'MISS':'–'+val);
  wrap.appendChild(el);
  setTimeout(()=>el.remove(), 1200);
}

function castFrostNova() {
  announce('FROST NOVA!','#88eeff');
  const g = new THREE.Group();
  // Expanding ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1,0.04,8,32), glowMat(0x00ddff,3));
  ring.rotation.x = Math.PI/2; ring.position.y = 0.1; g.add(ring);
  // Ice spikes rising
  for(let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.30,5), glowMat(0x88eeff,2));
    spike.position.set(Math.cos(a)*0.3, 0, Math.sin(a)*0.3);
    g.add(spike);
  }
  addEffect(g, 1.2, (frac)=>{
    const s = frac*2.5;
    ring.scale.set(s,s,s);
    ring.material.emissiveIntensity = (1-frac)*3;
    g.children.slice(1).forEach((sp,i)=>{
      sp.position.y = frac*0.5;
      sp.scale.setScalar(1-frac*0.5);
    });
  });
  showDamage(225,'#88eeff');
}

function castChainFrost() {
  announce('CHAIN FROST!','#00ffcc');
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12,1), glowMat(0x00ffee,3));
  orb.position.set(0, 1.2, 0);
  addEffect(orb, 1.5, (frac,t)=>{
    orb.position.set(Math.sin(t*8)*0.8, 1.0+Math.cos(t*6)*0.3, frac*2.5-0.5);
    orb.rotation.y = t*5;
    orb.material.emissiveIntensity = 3*(1-frac*0.5);
  });
  showDamage(370,'#00ffee');
}

function castAssassinate() {
  announce('ASSASSINATE!','#ffee22');
  const mat = new THREE.LineBasicMaterial({color:0xffee44});
  const pts = [new THREE.Vector3(0.4,1.0,0.9), new THREE.Vector3(1.4,0.85,0)];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  addEffect(line, 0.4, (frac)=>{ mat.opacity=1-frac; }, ()=>{ showDamage(505,'#ffee22'); });
  // Muzzle flash
  const h = heroObjects[currentHero];
  if(h && h.parts.muzzle){ h.parts.muzzle.visible=true; setTimeout(()=>{ if(h.parts.muzzle) h.parts.muzzle.visible=false; },120); }
}

function castShrapnel() {
  announce('SHRAPNEL!','#ffcc44');
  const g = new THREE.Group();
  for(let i=0;i<12;i++){
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06), stdMat(0x888866,0.6,0.5));
    sh.position.set((Math.random()-0.5)*0.8, 0.1+Math.random()*0.4, (Math.random()-0.5)*0.8+1.0);
    sh.userData.vy = 0.8+Math.random()*0.6;
    sh.userData.vx = (Math.random()-0.5)*0.5;
    sh.userData.vz = (Math.random()-0.5)*0.5;
    g.add(sh);
  }
  addEffect(g, 1.2, (frac,t)=>{
    g.children.forEach(sh=>{
      sh.position.y += sh.userData.vy*0.016-0.012;
      sh.position.x += sh.userData.vx*0.012;
      sh.position.z += sh.userData.vz*0.012;
      sh.rotation.x += 0.1; sh.rotation.y += 0.08;
      if(sh.position.y < 0) sh.position.y = 0;
    });
  });
}

function castElderDragon() {
  announce('ELDER DRAGON FORM!','#ff6600');
  const colors = [0x00ff44, 0xff2200, 0x0088ff];
  colors.forEach((c,i)=>{
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5+i*0.15, 0.04, 8, 32), glowMat(c,3));
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.8;
    addEffect(ring, 1.5+i*0.3, (frac)=>{
      ring.scale.setScalar(1+frac*0.5);
      ring.material.emissiveIntensity = (1-frac)*3;
      ring.position.y = 0.8+frac*0.8;
    });
  });
}

function castRequiem() {
  announce('REQUIEM OF SOULS!','#ff2200');
  const g = new THREE.Group();
  for(let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    const mat = new THREE.LineBasicMaterial({color:0xff3300});
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,1.0,0), new THREE.Vector3(Math.cos(a)*0.1, 1.0, Math.sin(a)*0.1)
    ]), mat);
    line.userData.angle = a;
    g.add(line);
  }
  addEffect(g, 2.0, (frac)=>{
    const radius = frac < 0.5 ? frac*2*3.5 : (1-frac)*2*3.5;
    g.children.forEach(line=>{
      const a = line.userData.angle;
      const pts = [new THREE.Vector3(0,1.0,0), new THREE.Vector3(Math.cos(a)*radius,1.0,Math.sin(a)*radius)];
      line.geometry.setFromPoints(pts);
    });
  });
  showDamage(640,'#ff4400');
}

function castShadowraze() {
  announce('SHADOWRAZE!','#660033');
  const distances = [0.6, 1.2, 1.9];
  distances.forEach((d,i)=>{
    const smoke = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.12,12), glowMat(0x220011,1.5));
    smoke.position.set(0,0.06,d);
    addEffect(smoke, 0.8+i*0.1, (frac)=>{
      smoke.scale.y = 1+frac*2;
      smoke.scale.x = 1+frac*0.8;
      smoke.scale.z = 1+frac*0.8;
      smoke.material.emissiveIntensity = (1-frac)*1.5;
    });
  });
  showDamage(225,'#aa0044');
}

function castWindrun() {
  announce('WINDRUN!','#44ffcc');
  const g = new THREE.Group();
  for(let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25+i*0.1,0.02,6,20), glowMat(0x44ffcc,2));
    ring.rotation.x = Math.PI/2; ring.position.y = 0.5;
    g.add(ring);
  }
  addEffect(g, 0.8, (frac)=>{
    g.children.forEach((r,i)=>{ r.scale.setScalar(1+frac*(1+i*0.3)); r.material.emissiveIntensity = (1-frac)*2; });
    g.rotation.y = frac*Math.PI*4;
  });
}

function castFocusFire() {
  announce('FOCUS FIRE!','#88ffcc');
  for(let i=0;i<6;i++){
    setTimeout(()=>spawnArrow(), i*80);
  }
  showDamage(380,'#88ffcc');
}

function castDragonTail() {
  announce('DRAGON TAIL!','#ffaa00');
  const g = new THREE.Group();
  const shock = new THREE.Mesh(new THREE.TorusGeometry(0.1,0.06,8,20), glowMat(0xffaa00,3));
  shock.rotation.x = Math.PI/2; shock.position.set(1.4,0.1,0);
  g.add(shock);
  addEffect(g, 0.6, (frac)=>{
    shock.scale.setScalar(1+frac*3);
    shock.material.emissiveIntensity = (1-frac)*3;
  });
  showDamage(75,'#ffaa00');
}

function castBreatheFire() {
  announce('BREATHE FIRE!','#ff6600');
  const g = new THREE.Group();
  for(let i=0;i<10;i++){
    const fb = new THREE.Mesh(new THREE.SphereGeometry(0.06+Math.random()*0.04,6,4), glowMat(i%2===0?0xff4400:0xff8800,2));
    fb.position.set((Math.random()-0.5)*0.6, 0.4+Math.random()*0.5, Math.random()*1.5+0.2);
    fb.userData.vz = 0.04+Math.random()*0.03;
    g.add(fb);
  }
  addEffect(g, 0.9, (frac)=>{
    g.children.forEach(fb=>{ fb.position.z += fb.userData.vz; fb.material.emissiveIntensity = (1-frac)*2; });
  });
  showDamage(225,'#ff6600');
}

function spawnBullet() {
  const mat = new THREE.LineBasicMaterial({color:0xffee88});
  const pts = [new THREE.Vector3(0.3,0.96,0.9), new THREE.Vector3(1.4,0.6,0)];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  addEffect(line, 0.25, (frac)=>{ mat.opacity=1-frac; });
}

function spawnArrow() {
  const arw = new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.3,5), stdMat(0x8b5c1e,0.7));
  arw.rotation.z = Math.PI/2;
  arw.position.set(0.3,0.9,0);
  addEffect(arw, 0.3, (frac)=>{
    arw.position.x = 0.3+frac*1.5;
    arw.position.z = frac*(-0.8);
    arw.position.y = 0.9;
  });
}

function castGenericSpell(skillName, colorHex) {
  const color = '#' + (colorHex || 0x888888).toString(16).padStart(6, '0');
  announce((skillName || 'SKILL').toUpperCase().replace(/\s+/g, ' '), color);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 24), glowMat(colorHex || 0x888888, 2));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.6;
  g.add(ring);
  addEffect(g, 0.6, (frac) => {
    ring.scale.setScalar(1 + frac * 0.8);
    ring.material.emissiveIntensity = (1 - frac) * 2;
  });
  spawnHitSparks();
}

function castHeroSpell(key) {
  const hero = HEROES[currentHero];
  const skill = hero.skills.find(s=>s.key===key);
  if(skill){ setAnim(skill.anim||'castQ'); }
  const id = hero.id;
  if(id==='lich'){
    if(key==='Q') castFrostNova();
    else if(key==='E') castChainFrost();
    else { castGenericSpell(skill?.name, hero.color); }
  } else if(id==='sniper'){
    if(key==='Q') castShrapnel();
    else if(key==='R') castAssassinate();
    else if(key==='W'||key==='E') { showDamage(80,'#ffcc44'); announce('HEADSHOT!','#ffcc44'); }
    else { castGenericSpell(skill?.name, hero.color); }
  } else if(id==='dragonKnight'){
    if(key==='Q') { announce('DRAGON BLOOD','#ff4400'); }
    else if(key==='W') castDragonTail();
    else if(key==='E') castBreatheFire();
    else if(key==='R') castElderDragon();
    else { castGenericSpell(skill?.name, hero.color); }
  } else if(id==='shadowFiend'){
    if(key==='Q') castShadowraze();
    else if(key==='R') castRequiem();
    else if(key==='W'||key==='E') { announce('DARK PRESENCE','#660033'); }
    else { castGenericSpell(skill?.name, hero.color); }
  } else if(id==='windrunner'){
    if(key==='Q'||key==='W'||key==='E') castWindrun();
    else if(key==='R') castFocusFire();
    else { castGenericSpell(skill?.name, hero.color); }
  } else {
    castGenericSpell(skill?.name, hero.color);
  }
  spawnHitSparks();
}

function spawnHitSparks() {
  const g = new THREE.Group();
  for(let i=0;i<8;i++){
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.04,4,4), glowMat(0xffaa22,3));
    const a = Math.random()*Math.PI*2;
    sp.userData.vx = Math.cos(a)*0.04;
    sp.userData.vy = 0.04+Math.random()*0.04;
    sp.userData.vz = Math.sin(a)*0.04;
    g.add(sp);
  }
  g.position.set(1.4,0.5,0);
  addEffect(g, 0.5, (frac)=>{
    g.children.forEach(sp=>{
      sp.position.x += sp.userData.vx;
      sp.position.y += sp.userData.vy;
      sp.position.z += sp.userData.vz;
      sp.userData.vy -= 0.003;
      sp.material.emissiveIntensity = (1-frac)*3;
      sp.scale.setScalar(1-frac);
    });
  });
}

// ─── CAMERA ORBIT ─────────────────────────────────────────────────────────────
function updateCamera() {
  const x = cameraDist * Math.sin(cameraTheta) * Math.cos(cameraPhi);
  const y = cameraDist * Math.sin(cameraPhi) + 1.2;
  const z = cameraDist * Math.cos(cameraTheta) * Math.cos(cameraPhi);
  camera.position.set(x, Math.max(0.3, y), z);
  camera.lookAt(0, 1.2, 0);
}

canvas.addEventListener('mousedown', e=>{ isDragging=true; lastMX=e.clientX; lastMY=e.clientY; });
window.addEventListener('mouseup', ()=>{ isDragging=false; });
window.addEventListener('mousemove', e=>{
  if(!isDragging) return;
  const dx = e.clientX-lastMX, dy = e.clientY-lastMY;
  cameraTheta -= dx*0.008;
  cameraPhi = Math.max(-0.2, Math.min(1.2, cameraPhi - dy*0.006));
  lastMX = e.clientX; lastMY = e.clientY;
  updateCamera();
});
canvas.addEventListener('wheel', e=>{
  cameraDist = Math.max(1.5, Math.min(8, cameraDist + e.deltaY*0.005));
  updateCamera(); e.preventDefault();
}, {passive:false});

// Touch support
let touchStart = null;
canvas.addEventListener('touchstart', e=>{ if(e.touches.length===1){ touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; } });
canvas.addEventListener('touchmove', e=>{
  if(e.touches.length===1 && touchStart){
    const dx=e.touches[0].clientX-touchStart.x, dy=e.touches[0].clientY-touchStart.y;
    cameraTheta -= dx*0.008; cameraPhi = Math.max(-0.2,Math.min(1.2,cameraPhi-dy*0.006));
    touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
    updateCamera();
  }
  e.preventDefault();
},{passive:false});

// ─── UI ────────────────────────────────────────────────────────────────────────
function buildPortraits() {
  const strip = document.getElementById('hv-portrait-strip');
  strip.innerHTML = '';
  HEROES.forEach((h,i)=>{
    const p = document.createElement('div');
    p.className = 'hv-portrait' + (i===currentHero?' active':'');
    p.innerHTML = `<div class="port-icon">${PORTRAIT_ICONS[i]}</div><div>${h.name.substring(0,6)}</div>`;
    p.addEventListener('click', ()=>showHero(i));
    strip.appendChild(p);
  });
}

function updatePortraits() {
  document.querySelectorAll('.hv-portrait').forEach((p,i)=>{ p.classList.toggle('active',i===currentHero); });
}

function updateUI() {
  const h = HEROES[currentHero];
  const lvl = parseInt(document.getElementById('hv-lvlSlider').value)||1;
  document.getElementById('hv-heroNameTitle').textContent = h.name.toUpperCase();
  document.getElementById('hv-hero-title').textContent = h.name.toUpperCase();
  document.getElementById('hv-hero-sub').textContent = h.sub;

  const hp = h.baseHP + h.hpLvl*(lvl-1);
  const mp = h.baseMana + h.manaLvl*(lvl-1);
  document.getElementById('hv-hpBar').style.width = '100%';
  document.getElementById('hv-mpBar').style.width = '100%';
  document.getElementById('hv-hpVal').textContent = hp+' / '+hp;
  document.getElementById('hv-mpVal').textContent = mp+' / '+mp;

  const ab = document.getElementById('hv-attrsBox');
  ab.innerHTML = '';
  [['str','❤️','STR',h.str,h.strG],['agi','⚡','AGI',h.agi,h.agiG],['int','🔮','INT',h.int,h.intG]].forEach(([key,icon,label,val,gain])=>{
    const d = document.createElement('div');
    d.className = 'hv-attr-box'+(h.primary===key?' primary':'');
    d.innerHTML = `<div class="attr-icon">${icon}</div><div class="attr-val">${val}</div><div class="attr-gain">+${gain}/lvl</div>`;
    ab.appendChild(d);
  });

  const sg = document.getElementById('hv-statGrid');
  sg.innerHTML = [
    [t('viewer.damage'),h.dmg],[t('viewer.armor'),h.armor],[t('viewer.range'),h.range],[t('viewer.move_spd'),h.ms]
  ].map(([k,v])=>`<div class="hv-stat-item"><span>${k}</span><span>${v}</span></div>`).join('');

  const skGrid = document.getElementById('hv-skillGrid');
  skGrid.innerHTML = '';
  h.skills.forEach(sk=>{
    const btn = document.createElement('button');
    btn.className = 'hv-skill-btn';
    btn.innerHTML = `<div class="skill-key">[${sk.key}]</div><div class="skill-name">${sk.name}</div><div class="skill-meta">${sk.meta}</div>`;
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.hv-skill-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('hv-skill-info').innerHTML = `<div class="si-name">${sk.name}</div>${sk.desc}`;
      castHeroSpell(sk.key);
    });
    skGrid.appendChild(btn);
  });
}

// ─── RESIZE ────────────────────────────────────────────────────────────────────
function resize() {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e=>{
  const k = e.key.toUpperCase();
  if(k==='Q'||k==='W'||k==='E'||k==='R') castHeroSpell(k);
  else if(k==='ARROWLEFT'||k==='ARROWUP') showHero((currentHero+HEROES.length-1)%HEROES.length);
  else if(k==='ARROWRIGHT'||k==='ARROWDOWN') showHero((currentHero+1)%HEROES.length);
  else if(k===' ') { setAnim('attack'); e.preventDefault(); }
  else if(k==='I') setAnim('idle');
  else if(k==='D') setAnim('die');
});

// ─── ANIMATION BUTTONS ────────────────────────────────────────────────────────
document.querySelectorAll('.hv-anim-btn').forEach(b=>{
  b.addEventListener('click', ()=>setAnim(b.dataset.anim));
});
document.getElementById('hv-prev-btn').addEventListener('click', ()=>showHero((currentHero+HEROES.length-1)%HEROES.length));
document.getElementById('hv-next-btn').addEventListener('click', ()=>showHero((currentHero+1)%HEROES.length));

// Sliders
document.getElementById('hv-lvlSlider').addEventListener('input', function(){ document.getElementById('hv-lvlVal').textContent=this.value; updateUI(); });
document.getElementById('hv-atkSlider').addEventListener('input', function(){ document.getElementById('hv-atkVal').textContent=this.value; attackSpeedMult=this.value/100; });

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time-lastTime)/1000, 0.05);
  lastTime = time;

  // Auto rotate camera when idle
  if(isAutoRotate) {
    cameraTheta += dt*0.3;
    updateCamera();
  }

  const pulse = 1.2+Math.sin(time*0.002)*0.4;
  ringMesh.material.emissiveIntensity = pulse;
  heroLight.intensity = 0.8+Math.sin(time*0.003)*0.3;

  animateHero(dt);
  tickEffects(dt);

  // Dummy bob
  dummyGroup.position.y = Math.sin(time*0.002)*0.02;

  renderer.render(scene, camera);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
  buildPortraits();
  buildAllHeroes();
  updateUI();
  resize();
  updateCamera();
  animate(0);
  setTimeout(() => resize(), 100);
}
