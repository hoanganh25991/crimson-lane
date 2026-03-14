// ─── SKILLS ─────────────────────────────────────────────────────────────────────
import { HERO_REGISTRY } from './heroes/registry.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { applyDamage, getEnemiesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

export function getSkillCD(hero, key) {
  const mod = HERO_REGISTRY[hero.type];
  if (!mod || !mod.skillCDs) return 0;
  const v = mod.skillCDs[key];
  return Array.isArray(v) ? (v[0] ?? 0) : (v ?? 0);
}

export function getSkillCost(hero, key) {
  const mod = HERO_REGISTRY[hero.type];
  if (!mod || !mod.skillCosts) return 0;
  const arr = mod.skillCosts[key];
  const lvl = G.skillLevels[key];
  return (Array.isArray(arr) ? (arr[lvl - 1] ?? 0) : 0) || 0;
}

function flashNoMana(key) {
  const el = document.getElementById('sb' + key);
  if (!el) return;
  el.classList.add('no-mana');
  setTimeout(() => el.classList.remove('no-mana'), 400);
}

export function castSkill(key, targetPos, targetEntity) {
  const h = G.playerHero;
  if (!h || !h.alive) return;
  if (G.skillCDs[key] > 0) { flashNoMana(key); return; }
  const cost = getSkillCost(h, key);
  if (h.mp < cost) { flashNoMana(key); return; }

  const mod = HERO_REGISTRY[h.type];
  if (!mod) return;

  const needsTarget = mod.needsTarget ? mod.needsTarget(key) : false;
  if (!targetPos && needsTarget) {
    G.targetingSkill = key;
    document.body.classList.add('targeting-skill');
    const sbEl = document.getElementById('sb' + key);
    if (sbEl) sbEl.classList.add('active-target');
    return;
  }

  h.mp -= cost;
  G.skillCDs[key] = getSkillCD(h, key);

  h._castAnim = (key === 'R') ? 'castR' : 'castQ';
  h._castAnimTimer = (key === 'R') ? 1.0 : 0.7;

  const ctx = {
    scene,
    G,
    applyDamage,
    getEnemiesOf,
    findEnemyNear,
    killEntity,
    spawnSpellProjectile,
    floatDamage,
    spawnParticles,
    playSound,
    showAnnouncer: (window._hudFns && window._hudFns.showAnnouncer) || (() => {})
  };
  mod.castSkill(h, key, G.skillLevels[key], targetPos, targetEntity, ctx);

  const sbEl = document.getElementById('sb' + key);
  if (sbEl) sbEl.classList.remove('active-target');
}

export function processAssassinateEffect(e) {
  if (e.type === 'crosshair' && e.life <= 0 && e.heroRef && e.target) {
    playSound('assassinate_fire');
    const dmg = [355, 505, 655][G.skillLevels['R'] - 1] || 355;
    spawnSpellProjectile(e.heroRef.x, e.heroRef.z, e.target, 0xffff00, 25, (t) => {
      applyDamage(t, dmg, 'magic');
      spawnParticles(t.x, t.z, 0xffff00, 8);
    });
    e.heroRef.channeling = 0;
  }
}

export function updateSkillCDs(dt) {
  for (const k in G.skillCDs) { if (G.skillCDs[k] > 0) G.skillCDs[k] = Math.max(0, G.skillCDs[k] - dt); }
}
