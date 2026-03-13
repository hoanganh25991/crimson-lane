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

  // Targeted skills need a target
  if(!targetPos && (key==='Q'||(h.type==='sniper'&&key==='R'))) {
    G.targetingSkill = key;
    document.body.classList.add('targeting-skill');
    const sbEl = document.getElementById('sb'+key);
    if(sbEl) sbEl.classList.add('active-target');
    return;
  }

  h.mp -= cost;
  G.skillCDs[key] = getSkillCD(h, key);

  if(h.type === 'lich') castLichSkill(h, key, targetPos, targetEntity);
  else castSniperSkill(h, key, targetPos, targetEntity);

  const sbEl = document.getElementById('sb'+key);
  if(sbEl) sbEl.classList.remove('active-target');
}

function castLichSkill(hero, key, pos, ent) {
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
  const lvl = G.skillLevels[key];
  if(key==='Q') { // Shrapnel
    playSound('shrapnel');
    const radius = 7;
    const geo = new THREE.CircleGeometry(radius, 24);
    const mat = new THREE.MeshBasicMaterial({color:0xccaa00, side:THREE.DoubleSide, transparent:true, opacity:0.25});
    const zone = new THREE.Mesh(geo, mat);
    zone.rotation.x = -Math.PI/2;
    zone.position.set(pos.x, 0.03, pos.z);
    scene.add(zone);
    G.effects.push({mesh:zone, life:4, maxLife:4, type:'shrapnel', x:pos.x, z:pos.z, radius, dps:15, tickTimer:0.5});
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
