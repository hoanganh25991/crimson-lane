// ─── SKILLS ─────────────────────────────────────────────────────────────────────
import { HERO_REGISTRY } from './heroes/registry.js';
import { G } from './state.js';
import { scene } from './scene.js';
import { applyDamage, getEnemiesOf, getEnemyHeroesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';

const SKILL_CAP = { Q: 4, W: 4, E: 4, R: 3 };
const ULT_LEVEL_GATES = [6, 11, 16];

function ensureHeroSkillState(hero) {
  if (!hero) return;
  if (!hero.skillLevels) hero.skillLevels = { Q: 0, W: 0, E: 0, R: 0 };
  if (typeof hero.skillPoints !== 'number') hero.skillPoints = 0;
}

export function getHeroSkillLevel(hero, key) {
  if (!hero) return 0;
  ensureHeroSkillState(hero);
  return Math.max(0, hero.skillLevels[key] || 0);
}

function getLevelScaledValue(v, lvl) {
  if (Array.isArray(v)) {
    if (lvl <= 0) return 0;
    const idx = Math.min(lvl, v.length) - 1;
    return v[idx] ?? 0;
  }
  return v ?? 0;
}

export function canLearnSkill(hero, key) {
  if (!hero) return false;
  ensureHeroSkillState(hero);
  if ((hero.skillPoints || 0) <= 0) return false;
  const cur = hero.skillLevels[key] || 0;
  const cap = SKILL_CAP[key] || 4;
  if (cur >= cap) return false;
  if (key === 'R') {
    const reqLevel = ULT_LEVEL_GATES[cur] || 99;
    if ((hero.level || 1) < reqLevel) return false;
  }
  return true;
}

export function learnSkill(key, hero = G.playerHero) {
  if (!hero) return false;
  ensureHeroSkillState(hero);
  if (!canLearnSkill(hero, key)) return false;
  hero.skillLevels[key] = (hero.skillLevels[key] || 0) + 1;
  hero.skillPoints -= 1;

  if (hero.isPlayer) {
    G.skillLevels = hero.skillLevels;
    G.skillPoints = hero.skillPoints;
    if (window._hudFns && window._hudFns.updateSkillUI) window._hudFns.updateSkillUI();
  }
  return true;
}

export function getSkillCD(hero, key) {
  const mod = HERO_REGISTRY[hero.type];
  if (!mod || !mod.skillCDs) return 0;
  const lvl = getHeroSkillLevel(hero, key);
  return getLevelScaledValue(mod.skillCDs[key], lvl);
}

export function getSkillCost(hero, key) {
  const mod = HERO_REGISTRY[hero.type];
  if (!mod || !mod.skillCosts) return 0;
  const lvl = getHeroSkillLevel(hero, key);
  return getLevelScaledValue(mod.skillCosts[key], lvl);
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
  ensureHeroSkillState(h);
  const lvl = getHeroSkillLevel(h, key);

  const mod = HERO_REGISTRY[h.type];
  if (!mod) return;

  // Passive skills cannot be manually cast — show brief feedback and bail
  const skillType = (mod.skillTypes && mod.skillTypes[key]) || 'active';
  if (skillType === 'passive') {
    const btn = document.getElementById('sb' + key);
    if (btn) { btn.style.filter = 'brightness(1.5)'; setTimeout(() => { btn.style.filter = ''; }, 250); }
    return;
  }

  if (lvl <= 0) { flashNoMana(key); return; }
  if (G.skillCDs[key] > 0) { flashNoMana(key); return; }
  const cost = getSkillCost(h, key);
  if (h.mp < cost) { flashNoMana(key); return; }

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
    getEnemyHeroesOf,
    findEnemyNear,
    killEntity,
    spawnSpellProjectile,
    floatDamage,
    spawnParticles,
    playSound,
    showAnnouncer: (window._hudFns && window._hudFns.showAnnouncer) || (() => {})
  };
  mod.castSkill(h, key, lvl, targetPos, targetEntity, ctx);

  const sbEl = document.getElementById('sb' + key);
  if (sbEl) sbEl.classList.remove('active-target');
}

export function processAssassinateEffect(e) {
  if (e.type === 'crosshair' && e.life <= 0 && e.heroRef && e.target) {
    playSound('assassinate_fire');
    const rLvl = getHeroSkillLevel(e.heroRef, 'R');
    if (rLvl <= 0) return;
    const dmg = [355, 505, 655][rLvl - 1] || 355;
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
