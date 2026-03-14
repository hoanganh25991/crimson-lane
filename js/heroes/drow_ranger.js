// ─── DROW RANGER ──────────────────────────────────────────────────────────────
// Spec: docs/heroes.md §13 — Agi, Sentinel, Carry/Range

import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'drow_ranger',
  def: {
    name: 'Drow Ranger',
    color: 0x4466aa,
    headColor: 0x88aacc,
    team: 'sentinel',
    hp: 530,
    mp: 195,
    move: 8,
    range: 12,
    dmgMin: 44,
    dmgMax: 51,
    armor: 2,
    atkSpd: 1.0,
    skills: ['Frost Arrows', 'Gust', 'Precision Aura', 'Marksmanship'],
  },
  skillCosts: { Q: [0, 0, 0, 0], W: [90, 90, 90, 90], E: [0, 0, 0, 0], R: [0, 0, 0, 0] },
  skillCDs: { Q: [0, 0, 0, 0], W: [13, 13, 13, 13], E: [0, 0, 0, 0], R: [0, 0, 0] },
  skillNames: { Q: 'Frost Arrows', W: 'Gust', E: 'Precision Aura', R: 'Marksmanship' },
  // Q = toggle orb, E/R = passives
  skillTypes: { Q: 'toggle', E: 'passive', R: 'passive' },
  aiBuild: [],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const blue = 0x4466aa;
    const light = 0x88aacc;
    const dark = 0x2a3355;

    // Slim torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.2, 1), stdMat(blue, 0.8));
    torso.position.y = 0.68;
    torso.castShadow = true;
    g.add(torso);
    // Cloak
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.06), stdMat(dark, 0.85));
    cloak.position.set(0, 0.66, -0.18);
    g.add(cloak);
    // Legs
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.09), stdMat(dark, 0.85));
      leg.position.set(s * 0.07, 0.18, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    // Head + hood
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), stdMat(0xc8a878, 0.75));
    head.position.y = 1.06;
    g.add(head);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), stdMat(blue, 0.8));
    hood.position.y = 1.08;
    g.add(hood);
    // Bow (half torus)
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.028, 6, 20, Math.PI), stdMat(0x3a2a1a, 0.7));
    bow.position.set(0.22, 0.5, 0.1);
    bow.rotation.y = -Math.PI / 2;
    bow.rotation.z = 0.15;
    g.add(bow);
    parts.bow = bow;
    const bowGlow = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.02, 4, 16, Math.PI), glowMat(light, 0.4));
    bowGlow.position.copy(bow.position);
    bowGlow.rotation.copy(bow.rotation);
    g.add(bowGlow);
    // Quiver
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 8), stdMat(0x2a2010, 0.8));
    quiver.position.set(-0.18, 0.6, -0.1);
    quiver.rotation.z = 0.15;
    g.add(quiver);

    parts.type = this.id;
    parts.glowColor = 0x88aacc;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'W';
  },

  getToggleState(hero, key) {
    if (key === 'Q') return !!hero.frostArrowsActive;
    return false;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      // Toggle Frost Arrows on/off (orb effect: adds slow + bonus magic dmg to basic attacks)
      hero.frostArrowsActive = !hero.frostArrowsActive;
      if (hero.frostArrowsActive) {
        floatDamage(hero.x, hero.z, 'FROST ARROWS ON', '#88aacc');
        spawnParticles(hero.x, hero.z, 0x88aacc, 5);
        playSound('frost');
      } else {
        floatDamage(hero.x, hero.z, 'FROST ARROWS OFF', '#445566');
        spawnParticles(hero.x, hero.z, 0x334455, 2);
      }
    } else if (key === 'W') {
      if (!targetPos) return;
      playSound('frost');
      const dmg = 50 + 30 * lvl;
      const coneRadius = 5;
      const fwdX = targetPos.x - hero.x;
      const fwdZ = targetPos.z - hero.z;
      const len = Math.sqrt(fwdX * fwdX + fwdZ * fwdZ) || 1;
      const ux = fwdX / len, uz = fwdZ / len;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 12) continue;
        const dot = (dx / (dist || 1)) * ux + (dz / (dist || 1)) * uz;
        if (dot > 0.5) {
          applyDamage(e, dmg, 'magic');
          e.slowTimer = 2;
          e.stunTimer = 0.4;
          spawnParticles(e.x, e.z, 0x88aacc, 4);
        }
      }
      const coneGeo = new THREE.ConeGeometry(coneRadius, 10, 12);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0x88aacc, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI / 2;
      cone.rotation.y = -Math.atan2(fwdX, fwdZ);
      cone.position.set(hero.x + ux * 5, 0.5, hero.z + uz * 5);
      scene.add(cone);
      G.effects = G.effects || [];
      G.effects.push({ mesh: cone, life: 0.35, maxLife: 0.35, type: 'ring' });
      floatDamage(targetPos.x, targetPos.z, 'GUST', '#88aacc');
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'PRECISION AURA', '#88aacc');
      playSound('magic');
    } else if (key === 'R') {
      floatDamage(hero.x, hero.z, 'MARKSMANSHIP', '#88aacc');
      playSound('magic');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, getEnemiesOf, spawnParticles, playSound } = ctx;
    if (target && target.alive) {
      playSound('frost');
      const dmg = 80;
      applyDamage(target, dmg, 'magic');
      target.slowTimer = 2;
      target.stunTimer = 0.4;
      spawnParticles(target.x, target.z, 0x88aacc, 6);
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#4466aa';
    ctx2d.fillRect(42, 36, 52, 58);
    ctx2d.fillStyle = '#2a3355';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#88aacc';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 8, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#3a2a1a';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(94, 50, 20, -Math.PI * 0.6, Math.PI * 0.6);
    ctx2d.stroke();
    ctx2d.fillStyle = '#88aacc';
    ctx2d.fillRect(38, 58, 8, 32);
    ctx2d.strokeStyle = '#88aacc';
    ctx2d.lineWidth = 2;
    ctx2d.strokeRect(44, 38, 48, 54);
  },
};
