// ─── HERO REGISTRY ─────────────────────────────────────────────────────────────
// Import all hero modules and expose HERO_REGISTRY + ALL_HERO_IDS.
// When adding a new hero: create js/heroes/<id>.js, then add one import and push to ALL.

import lich from './lich.js';
import sniper from './sniper.js';
import dragonKnight from './dragon_knight.js';
import shadowFiend from './shadow_fiend.js';
import windrunner from './windrunner.js';

const ALL = [lich, sniper, dragonKnight, shadowFiend, windrunner];

export const HERO_REGISTRY = {};
export const ALL_HERO_IDS = [];

for (const h of ALL) {
  HERO_REGISTRY[h.id] = h;
  ALL_HERO_IDS.push(h.id);
}
