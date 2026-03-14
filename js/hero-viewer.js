import { stdMat, glowMat, metalMat, transMat, buildLich, buildSniper, buildDragonKnight, buildShadowFiend, buildWindrunner } from './hero-models.js';

let heroViewerInited = false;
export function initHeroViewer() {
  if (heroViewerInited) return;
  const canvas = document.getElementById('hv-hero-canvas');
  if (!canvas) return;
  heroViewerInited = true;

  // ─── HERO DATA ───────────────────────────────────────────────────────────────
const HEROES = [
  { name:'Lich', sub:'Intelligence · Scourge · Undead', primary:'int', color:0x00ffcc,
    baseHP:454, hpLvl:19, baseMana:403, manaLvl:26,
    armor:1.1, range:600, ms:295, dmg:'49–55',
    str:15, strG:1.75, agi:15, agiG:1.5, int:22, intG:3.0,
    skills:[
      {key:'Q',name:'Frost Nova',meta:'Mana 120–160 · CD 7–4s · AoE',desc:'Deals 75/150/225/300 magic dmg in 400 AoE. Slows 20–50% for 4s.',anim:'castQ'},
      {key:'W',name:'Dark Ritual',meta:'Mana 25 · CD 55–25s · Unit-target',desc:'Sacrifice allied creep → restore mana equal to 100–200% of its HP.',anim:'castQ'},
      {key:'E',name:'Chain Frost',meta:'Mana 150–200 · CD 8s · Unit-target',desc:'Bouncing ice orb. 280/370/460 magic per bounce, up to 10 bounces. Slows 30%.',anim:'castR'},
      {key:'R',name:'Frost Armor',meta:'Passive aura · 900 radius',desc:'Adds 3/4/5/6 armor to nearby allies. Enemies who attack get slowed 40% for 3s.',anim:'idle'},
    ]
  },
  { name:'Sniper', sub:'Agility · Sentinel · Keen', primary:'agi', color:0xffcc00,
    baseHP:492, hpLvl:19, baseMana:195, manaLvl:13,
    armor:2.08, range:550, ms:290, dmg:'38–44',
    str:15, strG:1.7, agi:21, agiG:2.9, int:16, intG:1.5,
    skills:[
      {key:'Q',name:'Shrapnel',meta:'Mana 120 · CD 22s · 2 charges · AoE zone',desc:'350 radius shrapnel zone for 9s. 15/30/45/60 DPS + 30% slow inside.',anim:'castQ'},
      {key:'W',name:'Headshot',meta:'Passive · 40% proc chance',desc:'40% chance: 30/55/80/115 bonus phys dmg + 0.5s mini-stun.',anim:'attack'},
      {key:'E',name:'Aim',meta:'Passive · Attack range bonus',desc:'+75/150/225/300 attack range. At lvl4 Sniper has 850 range.',anim:'idle'},
      {key:'R',name:'Assassinate',meta:'Mana 175–275 · CD 20s · Channel 1.7s',desc:'Channel → fire devastating shot. 355/505/655 magic dmg. Range 2000–3000.',anim:'castR'},
    ]
  },
  { name:'Dragon Knight', sub:'Strength · Sentinel · Human', primary:'str', color:0xffcc00,
    baseHP:625, hpLvl:25, baseMana:195, manaLvl:13,
    armor:3.9, range:128, ms:290, dmg:'53–59',
    str:21, strG:2.9, agi:21, agiG:1.5, int:14, intG:1.5,
    skills:[
      {key:'Q',name:'Dragon Blood',meta:'Passive',desc:'+3/6/9/12 HP regen/sec and +3/4/5/6 armor. Red corona pulses.',anim:'idle'},
      {key:'W',name:'Dragon Tail',meta:'Mana 100 · CD 9s · Melee 150',desc:'Shield bash: 2–2.5s stun + 25/50/75/100 magic dmg.',anim:'castQ'},
      {key:'E',name:'Breathe Fire',meta:'Mana 100–130 · CD 15–6s · Cone 600',desc:'Fire cone: 75/150/225/300 magic dmg. Reduces enemy attack dmg 35% for 5s.',anim:'castQ'},
      {key:'R',name:'Elder Dragon Form',meta:'CD 100s · Duration 60s · Transform',desc:'Become a dragon! Green/Red/Blue levels. +500 range, +15 armor, +50 ms.',anim:'castR'},
    ]
  },
  { name:'Shadow Fiend', sub:'Agility · Scourge · Undead', primary:'agi', color:0xff2200,
    baseHP:530, hpLvl:19, baseMana:260, manaLvl:14,
    armor:3.08, range:128, ms:305, dmg:'51–57 (+2/soul)',
    str:15, strG:2.0, agi:20, agiG:2.9, int:18, intG:1.8,
    skills:[
      {key:'Q',name:'Shadowraze ×3',meta:'Mana 75 · CD 10s each · No-target',desc:'3 fixed razes at 200/450/700 range. 75/150/225/300 magic each.',anim:'castQ'},
      {key:'W',name:'Necromastery',meta:'Passive · Soul collect',desc:'Kill → gain 1 soul (max 12/16/20/24). Each = +2 dmg. Drop 50% on death.',anim:'idle'},
      {key:'E',name:'Dark Presence',meta:'Passive aura · 900 radius',desc:'Reduce nearby enemy armor by 3/4/5/6. Dark mist radiates from feet.',anim:'idle'},
      {key:'R',name:'Requiem of Souls',meta:'Mana 150–200 · CD 120–100s · Global',desc:'Wings OPEN. Soul lines explode outward then retract. (souls÷2)×80/120/160 dmg.',anim:'castR'},
    ]
  },
  { name:'Windrunner', sub:'Agility · Sentinel · Night Elf', primary:'agi', color:0x88ffcc,
    baseHP:492, hpLvl:19, baseMana:234, manaLvl:26,
    armor:1.1, range:600, ms:295, dmg:'36–46',
    str:15, strG:1.5, agi:21, agiG:2.9, int:18, intG:2.0,
    skills:[
      {key:'Q',name:'Shackleshot',meta:'Mana 90–120 · CD 15s · Unit-target',desc:'Arrow stuns target + nearby tree/unit for 0.75/1.5/2.25/3.0s.',anim:'castQ'},
      {key:'W',name:'Powershot',meta:'Mana 90–120 · CD 12s · Channel 1s',desc:'Charge up huge arrow. 340/480/620/760 magic, pierces all units in line.',anim:'castQ'},
      {key:'E',name:'Windrun',meta:'Mana 100 · CD 15–6s · 3s duration',desc:'+50% evasion, +50% ms for 3s. All projectiles miss.',anim:'castQ'},
      {key:'R',name:'Focus Fire',meta:'Mana 200–350 · CD 60s · 20s duration',desc:'Max attack speed (400/600/800) on target. Arrow blur at 800 speed.',anim:'castR'},
    ]
  },
];

const PORTRAIT_ICONS = ['❄️','🎯','🐉','👻','🏹'];

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
const BUILDERS = [buildLich, buildSniper, buildDragonKnight, buildShadowFiend, buildWindrunner];
let heroObjects = [];
let currentHero = 0;
let currentAnim = 'idle';
let animTime = 0;
let attackSpeedMult = 1.0;

function buildAllHeroes() {
  heroObjects.forEach(h => { if(h) scene.remove(h.group); });
  heroObjects = BUILDERS.map(b => b());
  heroObjects.forEach((h,i) => {
    h.group.visible = (i === currentHero);
    scene.add(h.group);
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
  const p = h.parts;
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

function castHeroSpell(key) {
  const hero = HEROES[currentHero];
  const skill = hero.skills.find(s=>s.key===key);
  if(skill){ setAnim(skill.anim||'castQ'); }
  // Hero-specific effects
  if(currentHero===0){
    if(key==='Q') castFrostNova();
    else if(key==='E') castChainFrost();
  } else if(currentHero===1){
    if(key==='Q') castShrapnel();
    else if(key==='R') castAssassinate();
    else if(key==='W'||key==='E') { showDamage(80,'#ffcc44'); announce('HEADSHOT!','#ffcc44'); }
  } else if(currentHero===2){
    if(key==='Q') { announce('DRAGON BLOOD','#ff4400'); }
    else if(key==='W') castDragonTail();
    else if(key==='E') castBreatheFire();
    else if(key==='R') castElderDragon();
  } else if(currentHero===3){
    if(key==='Q') castShadowraze();
    else if(key==='R') castRequiem();
    else if(key==='W'||key==='E') { announce('DARK PRESENCE','#660033'); }
  } else if(currentHero===4){
    if(key==='Q'||key==='W'||key==='E') castWindrun();
    else if(key==='R') castFocusFire();
  }
  // Hit sparks on dummy
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
    ['Damage',h.dmg],['Armor',h.armor],['Range',h.range],['Move Spd',h.ms]
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
const ringColors = [0x4444ff,0xff4400,0x00ffcc,0xffcc00,0x88ffcc];
let ringColorT = 0;

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time-lastTime)/1000, 0.05);
  lastTime = time;

  // Auto rotate camera when idle
  if(isAutoRotate) {
    cameraTheta += dt*0.3;
    updateCamera();
  }

  // Ring color pulse
  ringColorT += dt*0.5;
  const rc = ringColors[currentHero];
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
