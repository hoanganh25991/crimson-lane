// Copy this file as js/heroes/<hero_id>.js
// Fill in all sections, then add import to registry.js
// THREE is available globally (CDN). Import material helpers from hero-models.js.

import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'HERO_ID',
  def: {
    name: 'Hero Name',
    color: 0xffffff,
    headColor: 0xffddbb,
    team: 'sentinel', // or 'scourge'
    hp: 600,
    mp: 300,
    move: 8,
    range: 1.2,
    dmgMin: 45,
    dmgMax: 55,
    armor: 3,
    atkSpd: 1.0,
    skills: ['Skill Q', 'Skill W', 'Skill E', 'Skill R'],
  },
  skillCosts: { Q: [0, 0, 0, 0], W: [0, 0, 0, 0], E: [0, 0, 0, 0], R: [0, 0, 0] },
  skillCDs: { Q: [0, 0, 0, 0], W: [0, 0, 0, 0], E: [0, 0, 0, 0], R: [0, 0, 0] },
  // castRangeByLevel: { Q: [600,600,600,600], ... } — units; use Infinity for global, 0 for self
  skillNames: { Q: 'Q', W: 'W', E: 'E', R: 'R' },
  aiBuild: [],

  buildModel() {
    const g = new THREE.Group();
    // Build 3D model here; add parts to g and to parts object
    const parts = {};
    parts.glowColor = 0x888888;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    // Return true if this skill requires a target position/entity
    return false;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    // ctx = { scene, G, applyDamage, getEnemiesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage, spawnParticles, playSound, showAnnouncer }
  },

  castAISkill(hero, target, ctx) {
    // AI decides and executes one skill against target
  },

  drawPortrait(ctx2d) {
    // Draw in 136x100 coordinate space (caller scales canvas)
  },
};
