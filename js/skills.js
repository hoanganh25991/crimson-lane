// ─── SKILLS ─────────────────────────────────────────────────────────────────────
import { SKILL_COSTS, SKILL_CDS } from './constants.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { applyDamage, getEnemiesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

export function getSkillCD(hero, key) { return SKILL_CDS[hero.type][key]||0; }
export function getSkillCost(hero, key) { return (SKILL_COSTS[hero.type][key]||[0])[G.skillLevels[key]-1]||0; }

function flashNoMana(key) {
  const el = document.getElementById('sb'+key);
  if(!el) return;
  el.classList.add('no-mana');
  setTimeout(()=>el.classList.remove('no-mana'),400);
}

export function castSkill(key, targetPos, targetEntity) {
  const h = G.playerHero; if(!h||!h.alive) return;
  if(G.skillCDs[key]>0) { flashNoMana(key); return; }
  const cost = getSkillCost(h, key);
  if(h.mp < cost) { flashNoMana(key); return; }

  // Targeted skills need a target position
  const needsTarget = (
    (key==='Q' && (h.type==='lich' || h.type==='sniper')) ||
    (h.type==='sniper' && key==='R') ||
    (h.type==='windrunner' && (key==='Q' || key==='W'))
  );
  if(!targetPos && needsTarget) {
    G.targetingSkill = key;
    document.body.classList.add('targeting-skill');
    const sbEl = document.getElementById('sb'+key);
    if(sbEl) sbEl.classList.add('active-target');
    return;
  }

  h.mp -= cost;
  G.skillCDs[key] = getSkillCD(h, key);

  // Trigger cast animation
  h._castAnim = (key === 'R') ? 'castR' : 'castQ';
  h._castAnimTimer = (key === 'R') ? 1.0 : 0.7;

  if(h.type === 'lich') castLichSkill(h, key, targetPos, targetEntity);
  else if(h.type === 'sniper') castSniperSkill(h, key, targetPos, targetEntity);
  else if(h.type === 'dragon_knight') castDragonKnightSkill(h, key, targetPos, targetEntity);
  else if(h.type === 'shadow_fiend') castShadowFiendSkill(h, key, targetPos, targetEntity);
  else if(h.type === 'windrunner') castWindrunnerSkill(h, key, targetPos, targetEntity);

  const sbEl = document.getElementById('sb'+key);
  if(sbEl) sbEl.classList.remove('active-target');
}

function castLichSkill(hero, key, pos, _ent) {
  const lvl = G.skillLevels[key];
  if(key==='Q') { // Frost Nova
    playSound('frost');
    const dmg = 100+50*lvl;
    const radius = 5;
    const ringGeo = new THREE.RingGeometry(0,radius,32);
    const ringMat = new THREE.MeshBasicMaterial({color:0x00ffcc, side:THREE.DoubleSide, transparent:true, opacity:0.4});
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI/2;
    ring.position.set(pos.x, 0.05, pos.z);
    scene.add(ring);
    G.effects.push({mesh:ring, life:0.6, maxLife:0.6, type:'ring', scale:1});

    const enemies = getEnemiesOf(hero.team);
    for(const e of enemies) {
      if(!e.alive) continue;
      const dx=e.x-pos.x, dz=e.z-pos.z;
      if(Math.sqrt(dx*dx+dz*dz)<=radius) {
        applyDamage(e, dmg, 'magic');
        e.slowTimer = 3;
      }
    }
    spawnParticles(pos.x, pos.z, 0x00ffcc, 8);
  }
  else if(key==='W') { // Dark Ritual
    let best=null, bestDist=Infinity;
    for(const c of G.creeps) {
      if(!c.alive||c.team!==hero.team) continue;
      const dx=c.x-hero.x,dz=c.z-hero.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d<bestDist){bestDist=d;best=c;}
    }
    if(best && bestDist<15) {
      const restore = best.hp;
      hero.mp = Math.min(hero.maxMp, hero.mp + restore);
      killEntity(best);
      floatDamage(hero.x, hero.z, '+'+Math.floor(restore)+' MP', '#3366ff');
      spawnParticles(hero.x, hero.z, 0x3366ff, 6);
    }
    playSound('magic');
  }
  else if(key==='E') { // Chain Frost
    playSound('chain_frost');
    const dmg = 280;
    const enemies = getEnemiesOf(hero.team).filter(e=>e.alive);
    if(!enemies.length) return;
    let nearest=null,bestDist=Infinity;
    for(const e of enemies){const dx=e.x-hero.x,dz=e.z-hero.z;const d=Math.sqrt(dx*dx+dz*dz);if(d<bestDist){bestDist=d;nearest=e;}}
    if(!nearest) return;
    let bounces = 10+lvl*2;
    let hit = new Set();
    const doNextBounce = (from, count) => {
      if(count<=0||!from||!from.alive) return;
      if(!hit.has(from)) {
        hit.add(from);
        applyDamage(from, dmg, 'magic');
        from.slowTimer = 1.5;
        spawnParticles(from.x, from.z, 0x00ffcc, 4);
      }
      let next=null,nd=Infinity;
      for(const e of enemies){
        if(!e.alive) continue;
        const dx=e.x-from.x,dz=e.z-from.z;
        const d=Math.sqrt(dx*dx+dz*dz);
        if(d<=8&&d>0&&d<nd&&!hit.has(e)){nd=d;next=e;}
      }
      setTimeout(()=>doNextBounce(next,count-1),150);
    };
    spawnSpellProjectile(hero.x, hero.z, nearest, 0x00ffcc, 12, ()=>doNextBounce(nearest, bounces));
  }
  else if(key==='R') { // Frost Armor (passive)
    floatDamage(hero.x, hero.z, 'FROST ARMOR', '#00ffcc');
    playSound('magic');
  }
}

function castSniperSkill(hero, key, pos, ent) {
  void G.skillLevels[key]; // lvl used implicitly via G.skillLevels['R'] in R branch
  if(key==='Q') { // Shrapnel
    playSound('shrapnel');
    const radius = 7;
    const geo = new THREE.CircleGeometry(radius, 24);
    const mat = new THREE.MeshBasicMaterial({color:0xccaa00, side:THREE.DoubleSide, transparent:true, opacity:0.25});
    const zone = new THREE.Mesh(geo, mat);
    zone.rotation.x = -Math.PI/2;
    zone.position.set(pos.x, 0.03, pos.z);
    scene.add(zone);
    G.effects.push({mesh:zone, life:4, maxLife:4, type:'shrapnel', x:pos.x, z:pos.z, radius, dps:15, tickTimer:0.5, casterTeam:hero.team});
  }
  else if(key==='W') { floatDamage(hero.x, hero.z, 'HEADSHOT', '#ffcc44'); } // Passive
  else if(key==='E') { floatDamage(hero.x, hero.z, 'AIM +RANGE', '#88ff88'); } // Passive
  else if(key==='R') { // Assassinate
    if(!pos && !ent) { G.targetingSkill='R'; document.body.classList.add('targeting-skill'); return; }
    const target = ent || findEnemyNear(pos.x, pos.z, 4);
    if(!target) return;
    hero.channeling = 1.7;
    hero.chanTarget = target;
    hero.assassinateTimer = 1.7;
    hero.assassinateTarget = target;
    playSound('assassinate_channel');
    const crossGeo = new THREE.RingGeometry(0.5,0.65,16);
    const crossMat = new THREE.MeshBasicMaterial({color:0xffff00, side:THREE.DoubleSide});
    const cross = new THREE.Mesh(crossGeo, crossMat);
    cross.rotation.x = -Math.PI/2;
    cross.position.set(target.x, 0.1, target.z);
    scene.add(cross);
    G.effects.push({mesh:cross, life:1.7, maxLife:1.7, type:'crosshair', target, heroRef:hero});
    // Show announcer via window bridge
    const { showAnnouncer } = window._hudFns || {};
    if(showAnnouncer) showAnnouncer('CHANNELING...', '#ffff00', 1700);
    else { const el=document.getElementById('announcer'); if(el){el.textContent='CHANNELING...';el.style.color='#ffff00';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',1300);} }
  }
}

function castDragonKnightSkill(hero, key, _pos, ent) {
  const lvl = G.skillLevels[key];
  const { showAnnouncer } = window._hudFns || {};

  if(key==='Q') { // Dragon Blood passive
    floatDamage(hero.x, hero.z, 'DRAGON BLOOD', '#ff6622');
    playSound('magic');
    return;
  }
  if(key==='W') { // Dragon Tail — stun nearest enemy
    playSound('hit');
    const target = ent || findEnemyNear(hero.x, hero.z, 8);
    if(!target||!target.alive) return;
    const dmg = [25,50,75,100][lvl-1]||25;
    const stunDur = [2,2.25,2.5,2.5][lvl-1]||2;
    applyDamage(target, dmg, 'magic');
    target.stunTimer = stunDur;
    floatDamage(target.x, target.z, 'STUNNED!', '#ff8844');
    spawnParticles(target.x, target.z, 0xff6622, 6);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.55,8,6),
      new THREE.MeshBasicMaterial({color:0xff8844,transparent:true,opacity:0.6}));
    flash.position.set(target.x,1,target.z); scene.add(flash);
    G.effects.push({mesh:flash,life:0.3,maxLife:0.3,type:'ring'});
  }
  if(key==='E') { // Breathe Fire — cone in facing direction
    playSound('fire');
    const dmg = [75,150,225,300][lvl-1]||75;
    const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
    const enemies = getEnemiesOf(hero.team);
    for(const e of enemies) {
      if(!e.alive) continue;
      const dx=e.x-hero.x, dz=e.z-hero.z;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist>9||dist<0.1) continue;
      const dot=(dx/dist)*fwdX+(dz/dist)*fwdZ;
      if(dot<0.42) continue; // ~65 degree half-cone
      applyDamage(e, dmg, 'magic');
      spawnParticles(e.x, e.z, 0xff4400, 4);
    }
    const coneGeo = new THREE.ConeGeometry(3.5,9,10);
    const coneMesh = new THREE.Mesh(coneGeo,
      new THREE.MeshBasicMaterial({color:0xff6600,side:THREE.DoubleSide,transparent:true,opacity:0.28}));
    coneMesh.rotation.set(Math.PI/2,0,-hero.group.rotation.y);
    coneMesh.position.set(hero.x+fwdX*4.5,0.5,hero.z+fwdZ*4.5);
    scene.add(coneMesh);
    G.effects.push({mesh:coneMesh,life:0.45,maxLife:0.45,type:'ring'});
    floatDamage(hero.x,hero.z,'BREATHE FIRE!','#ff6600');
  }
  if(key==='R') { // Elder Dragon Form
    playSound('levelup');
    hero.dragonFormActive = true;
    hero.dragonFormTimer = 30;
    spawnParticles(hero.x, hero.z, 0xff8800, 12);
    floatDamage(hero.x, hero.z, 'DRAGON FORM!', '#ff8800');
    if(showAnnouncer) showAnnouncer('ELDER DRAGON FORM!', '#ff8800', 2000);
  }
}

function castShadowFiendSkill(hero, key, _pos, _ent) {
  const lvl = G.skillLevels[key];
  const { showAnnouncer } = window._hudFns || {};

  if(key==='Q') { // Shadowraze — 3 razes in front
    playSound('magic');
    const dmg = [75,150,225,300][lvl-1]||75;
    const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
    for(const dist of [3,5.5,8]) {
      const rx=hero.x+fwdX*dist, rz=hero.z+fwdZ*dist;
      const raze = new THREE.Mesh(new THREE.CircleGeometry(2.2,12),
        new THREE.MeshBasicMaterial({color:0xcc0000,side:THREE.DoubleSide,transparent:true,opacity:0.55}));
      raze.rotation.x=-Math.PI/2; raze.position.set(rx,0.03,rz);
      scene.add(raze);
      G.effects.push({mesh:raze,life:0.45,maxLife:0.45,type:'ring'});
      const enemies=getEnemiesOf(hero.team);
      for(const e of enemies) {
        if(!e.alive) continue;
        const dx=e.x-rx,dz=e.z-rz;
        if(Math.sqrt(dx*dx+dz*dz)<=2.2) {
          applyDamage(e,dmg,'magic');
          spawnParticles(e.x,e.z,0xff0000,3);
        }
      }
    }
    floatDamage(hero.x,hero.z,'SHADOWRAZE!','#ff2200');
  }
  if(key==='W'||key==='E') { // Passive
    floatDamage(hero.x,hero.z,key==='W'?'NECROMASTERY':'DARK PRESENCE','#880000');
  }
  if(key==='R') { // Requiem of Souls
    playSound('chain_frost');
    const dmg = [150,250,350][lvl-1]||150;
    const radius=10;
    const ring=new THREE.Mesh(new THREE.RingGeometry(0,radius,32),
      new THREE.MeshBasicMaterial({color:0xff0000,side:THREE.DoubleSide,transparent:true,opacity:0.4}));
    ring.rotation.x=-Math.PI/2; ring.position.set(hero.x,0.05,hero.z);
    scene.add(ring);
    G.effects.push({mesh:ring,life:0.8,maxLife:0.8,type:'ring'});
    const enemies=getEnemiesOf(hero.team);
    for(const e of enemies) {
      if(!e.alive) continue;
      const dx=e.x-hero.x,dz=e.z-hero.z;
      if(Math.sqrt(dx*dx+dz*dz)<=radius) {
        applyDamage(e,dmg,'magic');
        spawnParticles(e.x,e.z,0xff2200,5);
      }
    }
    spawnParticles(hero.x,hero.z,0xff0000,12);
    if(showAnnouncer) showAnnouncer('REQUIEM OF SOULS!','#ff2200',2000);
  }
}

function castWindrunnerSkill(hero, key, pos, ent) {
  const lvl = G.skillLevels[key];
  const { showAnnouncer } = window._hudFns || {};

  if(key==='Q') { // Shackleshot — stun arrow to target
    playSound('ranged_hit');
    const target = ent || findEnemyNear(pos.x, pos.z, 4);
    if(!target||!target.alive) return;
    const stunDur = [0.75,1.5,2.25,3.0][lvl-1]||0.75;
    spawnSpellProjectile(hero.x, hero.z, target, 0x88ffcc, 22, (t)=>{
      if(!t.alive) return;
      t.stunTimer = stunDur;
      applyDamage(t, 30, 'magic');
      spawnParticles(t.x,t.z,0x88ffcc,4);
      floatDamage(t.x,t.z,'SHACKLED!','#88ffcc');
    });
  }
  if(key==='W') { // Powershot — long arrow in aimed direction
    playSound('ranged_hit');
    const dmg = [340,480,620,760][lvl-1]||340;
    // Aim toward targetPos if given
    if(pos) {
      const dx=pos.x-hero.x, dz=pos.z-hero.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d>0.1) { hero.group.rotation.y=Math.atan2(dx,dz); }
    }
    const fx=Math.sin(hero.group.rotation.y), fz=Math.cos(hero.group.rotation.y);
    // Damage all enemies along path
    const enemies=getEnemiesOf(hero.team);
    for(const e of enemies) {
      if(!e.alive) continue;
      const ex=e.x-hero.x, ez=e.z-hero.z;
      const dist=Math.sqrt(ex*ex+ez*ez);
      if(dist>22||dist<0.1) continue;
      const dot=(ex/dist)*fx+(ez/dist)*fz;
      const cross=Math.abs((ex/dist)*fz-(ez/dist)*fx);
      if(dot>0.85&&cross<0.18) { // narrow corridor
        applyDamage(e,dmg,'magic');
        spawnParticles(e.x,e.z,0x88ff44,4);
      }
    }
    // VFX arrow line
    const arrowEnd = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,4),
      new THREE.MeshBasicMaterial({color:0xaaffaa}));
    arrowEnd.position.set(hero.x+fx*12, 0.8, hero.z+fz*12);
    scene.add(arrowEnd);
    G.effects.push({mesh:arrowEnd,life:0.35,maxLife:0.35,type:'ring'});
    floatDamage(hero.x,hero.z,'POWERSHOT!','#88ff44');
  }
  if(key==='E') { // Windrun — speed + evasion
    playSound('windrun');
    hero.windrunActive = true;
    hero.windrunTimer = 3;
    spawnParticles(hero.x,hero.z,0x88ffcc,8);
    floatDamage(hero.x,hero.z,'WINDRUN!','#88ffcc');
  }
  if(key==='R') { // Focus Fire — rapid attacks on nearest enemy
    playSound('levelup');
    const target = findEnemyNear(hero.x, hero.z, 25);
    if(!target) { floatDamage(hero.x,hero.z,'NO TARGET','#888'); return; }
    hero.focusFireActive = true;
    hero.focusFireTimer = 20;
    hero.focusFireTarget = target;
    hero.attackTarget = target;
    spawnParticles(hero.x,hero.z,0x88ff44,6);
    floatDamage(hero.x,hero.z,'FOCUS FIRE!','#88ff44');
    if(showAnnouncer) showAnnouncer('FOCUS FIRE!','#88ff44',2000);
  }
}

export function processAssassinateEffect(e) {
  // Called when crosshair effect expires — fire the shot
  if(e.type==='crosshair' && e.life<=0 && e.heroRef && e.target) {
    playSound('assassinate_fire');
    const dmg = [355,505,655][G.skillLevels['R']-1]||355;
    spawnSpellProjectile(e.heroRef.x, e.heroRef.z, e.target, 0xffff00, 25, (t)=>{
      applyDamage(t, dmg, 'magic');
      spawnParticles(t.x, t.z, 0xffff00, 8);
    });
    e.heroRef.channeling = 0;
  }
}

export function updateSkillCDs(dt) {
  for(const k in G.skillCDs) { if(G.skillCDs[k]>0) G.skillCDs[k]=Math.max(0,G.skillCDs[k]-dt); }
}
