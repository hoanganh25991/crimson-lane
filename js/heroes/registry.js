// ─── HERO REGISTRY ─────────────────────────────────────────────────────────────
// Import all hero modules and expose HERO_REGISTRY + ALL_HERO_IDS.
// When adding a new hero: create js/heroes/<id>.js, then add one import and push to ALL.

import lich from './lich.js';
import sniper from './sniper.js';
import dragonKnight from './dragon_knight.js';
import shadowFiend from './shadow_fiend.js';
import windrunner from './windrunner.js';
import axe from './axe.js';
import pudge from './pudge.js';
import sven from './sven.js';
import tidehunter from './tidehunter.js';
import earthshaker from './earthshaker.js';
import phantomAssassin from './phantom_assassin.js';
import juggernaut from './juggernaut.js';
import drowRanger from './drow_ranger.js';
import bountyHunter from './bounty_hunter.js';
import vengefulSpirit from './vengeful_spirit.js';
import crystalMaiden from './crystal_maiden.js';
import zeus from './zeus.js';
import lina from './lina.js';
import lion from './lion.js';
import enigma from './enigma.js';

const ALL = [
  lich, sniper, dragonKnight, shadowFiend, windrunner,
  axe, pudge, sven, tidehunter, earthshaker, phantomAssassin, juggernaut, drowRanger,
  bountyHunter, vengefulSpirit, crystalMaiden, zeus, lina, lion, enigma
];

export const HERO_REGISTRY = {};
export const ALL_HERO_IDS = [];

for (const h of ALL) {
  HERO_REGISTRY[h.id] = h;
  ALL_HERO_IDS.push(h.id);
}
