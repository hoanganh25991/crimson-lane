// ─── AI ────────────────────────────────────────────────────────────────────────
import { WAYPOINTS } from './constants.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { applyDamage, getEnemiesOf, spawnProjectile, spawnSpellProjectile, moveToward } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

export function updateAI(hero, dt) {
  if(!hero.alive) return;
  const ph = G.playerHero;

  // State transitions
  if(hero.hp < hero.maxHp*0.25) { hero.aiState='retreat'; }
  else if(ph && ph.alive) {
    const dx=ph.x-hero.x, dz=ph.z-hero.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d <= hero.def.range+1) hero.aiState='fight';
    else if(hero.aiState==='fight' && d > hero.def.range+4) hero.aiState='march';
  }

  if(hero.aiState==='retreat') {
    const home = hero.team==='scourge'?{x:10,z:10}:{x:90,z:90};
    moveToward(hero, home.x, home.z, dt);
    if(hero.hp > hero.maxHp*0.5) hero.aiState='march';
    return;
  }

  if(hero.aiState==='fight') {
    if(ph && ph.alive) {
      const dx=ph.x-hero.x, dz=ph.z-hero.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d <= hero.def.range) {
        hero.atkTimer -= dt;
        if(hero.atkTimer<=0) {
          hero.atkTimer = hero.atkCd;
          hero._atkAnimTimer = Math.min(hero.atkCd * 0.8, 0.55);
          spawnProjectile(hero, ph, hero.team==='scourge'?0xff4444:0x4488ff,
            hero.def.dmgMin + Math.random()*(hero.def.dmgMax-hero.def.dmgMin), 'physical', null);
          playSound('hit');
        }
      } else {
        moveToward(hero, ph.x, ph.z, dt);
      }
      G.aiCastTimer -= dt;
      if(G.aiCastTimer<=0 && d<20) {
        G.aiCastTimer = 8;
        castAISkill(hero, ph);
      }
    }
    return;
  }

  if(hero.aiState==='march') {
    const wps = WAYPOINTS[hero.team].mid;
    if(hero.wpIndex >= wps.length) { hero.wpIndex = wps.length-1; return; }
    const wp = wps[hero.wpIndex];
    const dx=wp.x-hero.x, dz=wp.z-hero.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d < 2) { hero.wpIndex = Math.min(hero.wpIndex+1, wps.length-1); }
    else moveToward(hero, wp.x, wp.z, dt);

    const enemies = getEnemiesOf(hero.team);
    for(const e of enemies) {
      if(!e.alive) continue;
      const ex=e.x-hero.x,ez=e.z-hero.z;
      const ed=Math.sqrt(ex*ex+ez*ez);
      if(ed<=hero.def.range) {
        hero.aiState='fight';
        break;
      }
    }
  }
}

function castAISkill(aiHero, target) {
  if(aiHero.type==='sniper') {
    const pos = {x:target.x+(Math.random()-0.5)*3, z:target.z+(Math.random()-0.5)*3};
    const zone = new THREE.Mesh(
      new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({color:0xccaa00, side:THREE.DoubleSide, transparent:true, opacity:0.2}));
    zone.rotation.x = -Math.PI/2;
    zone.position.set(pos.x, 0.03, pos.z);
    scene.add(zone);
    G.effects.push({mesh:zone, life:4, maxLife:4, type:'shrapnel', x:pos.x, z:pos.z, radius:7, dps:15, tickTimer:0.5});
    playSound('magic');
  } else if(aiHero.type==='lich') {
    applyDamage(target, 150, 'magic');
    target.slowTimer = 3;
    spawnParticles(target.x, target.z, 0x00ffcc, 6);
    playSound('frost');
  } else if(aiHero.type==='dragon_knight') {
    // Dragon Tail stun
    applyDamage(target, 75, 'magic');
    target.stunTimer = 2;
    spawnParticles(target.x, target.z, 0xff6622, 5);
    playSound('hit');
  } else if(aiHero.type==='shadow_fiend') {
    // Shadowraze toward player
    const fwdX = Math.sin(aiHero.group.rotation.y), fwdZ = Math.cos(aiHero.group.rotation.y);
    for(const dist of [3,5.5,8]) {
      const rx=aiHero.x+fwdX*dist, rz=aiHero.z+fwdZ*dist;
      const dx=target.x-rx, dz=target.z-rz;
      if(Math.sqrt(dx*dx+dz*dz)<=2.2) {
        applyDamage(target, 150, 'magic');
        spawnParticles(rx, rz, 0xff0000, 3);
      }
    }
    playSound('magic');
  } else if(aiHero.type==='windrunner') {
    // Powershot line — check if player in path
    const dx=target.x-aiHero.x, dz=target.z-aiHero.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d>0) aiHero.group.rotation.y = Math.atan2(dx, dz);
    spawnSpellProjectile(aiHero.x, aiHero.z, target, 0x88ff44, 25, (t)=>{
      applyDamage(t, 340, 'magic');
      spawnParticles(t.x, t.z, 0x88ff44, 5);
    });
    playSound('ranged_hit');
  }
}
