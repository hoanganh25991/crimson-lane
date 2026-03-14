// ─── AI ────────────────────────────────────────────────────────────────────────
import { WAYPOINTS } from './constants.js';
import { G } from './state.js';
import { HERO_REGISTRY } from './heroes/registry.js';
import { scene } from './scene.js';
import { applyDamage, getEnemiesOf, getEnemyHeroesOf, spawnProjectile, spawnSpellProjectile, moveToward } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

export function updateAI(hero, dt) {
  if(!hero.alive) return;
  if(hero.stunTimer>0){hero.stunTimer-=dt;return;}
  if(hero.slowTimer>0) hero.slowTimer-=dt;

  // Mana regen near fountain
  const fountain = hero.team==='scourge'?{x:10,z:10}:{x:90,z:90};
  const fdx=hero.x-fountain.x, fdz=hero.z-fountain.z;
  if(Math.sqrt(fdx*fdx+fdz*fdz)<10) {
    hero.hp = Math.min(hero.maxHp, hero.hp + 30*dt);
    hero.mp = Math.min(hero.maxMp, hero.mp + 15*dt);
  }

  // Dragon Blood passive for AI Dragon Knight
  if(hero.type==='dragon_knight') hero.hp = Math.min(hero.maxHp, hero.hp + 2*dt);

  // Passive mana regen for all bots
  hero.mp = Math.min(hero.maxMp, hero.mp + 1.5*dt);

  // Find nearest enemy hero
  const enemyHeroes = getEnemyHeroesOf(hero.team);
  let nearestHero = null, nearestHeroDist = Infinity;
  for(const eh of enemyHeroes) {
    const dx=eh.x-hero.x, dz=eh.z-hero.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    if(d<nearestHeroDist){nearestHeroDist=d;nearestHero=eh;}
  }

  // State transitions
  if(hero.hp < hero.maxHp*0.25) { hero.aiState='retreat'; }
  else if(nearestHero && nearestHeroDist <= hero.def.range+1) hero.aiState='fight';
  else if(hero.aiState==='fight' && (!nearestHero || nearestHeroDist > hero.def.range+4)) hero.aiState='march';

  if(hero.aiState==='retreat') {
    const home = hero.team==='scourge'?{x:10,z:10}:{x:90,z:90};
    moveToward(hero, home.x, home.z, dt);
    if(hero.hp > hero.maxHp*0.5) hero.aiState='march';
    return;
  }

  if(hero.aiState==='fight') {
    // Prioritize enemy heroes, fall back to nearest enemy (creep/tower)
    let target = nearestHero;
    let targetDist = nearestHeroDist;

    if(!target || targetDist > hero.def.range + 8) {
      const enemies = getEnemiesOf(hero.team);
      let bestDist = Infinity;
      for(const e of enemies) {
        if(!e.alive) continue;
        const dx=e.x-hero.x, dz=e.z-hero.z;
        const d=Math.sqrt(dx*dx+dz*dz);
        if(d < bestDist && d < hero.def.range + 4){bestDist=d;target=e;targetDist=d;}
      }
    }

    if(target && target.alive) {
      const dx=target.x-hero.x, dz=target.z-hero.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d <= hero.def.range) {
        hero.atkTimer -= dt;
        if(hero.atkTimer<=0) {
          hero.atkTimer = hero.atkCd;
          hero._atkAnimTimer = Math.min(hero.atkCd * 0.8, 0.55);
          hero.group.rotation.y = Math.atan2(dx,dz);
          const dmg = hero.def.dmgMin + (hero.itemBonus?.dmgMin||0)
            + Math.random()*((hero.def.dmgMax+(hero.itemBonus?.dmgMax||0))-(hero.def.dmgMin+(hero.itemBonus?.dmgMin||0)));
          spawnProjectile(hero, target, hero.team==='scourge'?0xff4444:0x4488ff, dmg, 'physical', null);
          playSound(hero.def.range <= 3 ? 'hit' : 'ranged_hit');
        }
      } else {
        moveToward(hero, target.x, target.z, dt);
      }

      // Skill casting
      if(nearestHero && nearestHeroDist < 20) {
        hero.aiCastTimer -= dt;
        if(hero.aiCastTimer<=0) {
          hero.aiCastTimer = 6 + Math.random()*4;
          castAISkill(hero, nearestHero);
        }
      }
    } else {
      hero.aiState='march';
    }
    return;
  }

  if(hero.aiState==='march') {
    const lane = hero.aiLane || 'mid';
    const wps = WAYPOINTS[hero.team][lane];
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
  const mod = HERO_REGISTRY[aiHero.type];
  if (!mod || !mod.castAISkill) return;
  const manaCost = 100;
  if (aiHero.mp < manaCost) return;
  aiHero.mp -= manaCost;
  aiHero._castAnim = 'castQ';
  aiHero._castAnimTimer = 0.7;
  const ctx = {
    scene,
    G,
    applyDamage,
    getEnemiesOf,
    getEnemyHeroesOf,
    findEnemyNear,
    killEntity,
    floatDamage,
    spawnParticles,
    playSound,
    spawnSpellProjectile
  };
  mod.castAISkill(aiHero, target, ctx);
}
