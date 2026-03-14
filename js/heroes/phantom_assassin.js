// ─── PHANTOM ASSASSIN ─────────────────────────────────────────────────────────
// Spec: docs/heroes.md §11 — Agi, Scourge, Carry/Assassin

import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'phantom_assassin',
  def: {
    name: 'Phantom Assassin',
    color: 0x2a0010,
    headColor: 0xaa2244,
    team: 'scourge',
    hp: 530,
    mp: 195,
    move: 8.5,
    range: 2.5,
    dmgMin: 51,
    dmgMax: 53,
    armor: 2,
    atkSpd: 1.0,
    skills: ['Stifling Dagger', 'Phantom Strike', 'Blur', 'Coup de Grâce'],
  },
  skillCosts: { Q: [30, 30, 30, 30], W: [50, 50, 50, 50], E: [0, 0, 0, 0], R: [0, 0, 0, 0] },
  skillCDs: { Q: [8, 8, 8, 8], W: [20, 20, 20, 20], E: [0, 0, 0, 0], R: [0, 0, 0] },
  skillNames: { Q: 'Stifling Dagger', W: 'Phantom Strike', E: 'Blur', R: 'Coup de Grâce' },
  aiBuild: [],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const dark = 0x2a0010;
    const red = 0xaa2244;
    const darker = 0x440011;

    // Slim torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.2, 1), stdMat(dark, 0.9));
    torso.position.y = 0.68;
    torso.castShadow = true;
    g.add(torso);
    // Hood (cone/cap)
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 8), stdMat(darker, 0.85));
    hood.position.y = 1.08;
    g.add(hood);
    // Face hint (glow eyes)
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), glowMat(red, 2));
      eye.position.set(s * 0.06, 1.1, 0.18);
      g.add(eye);
    }
    // Legs
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.1), stdMat(dark, 0.9));
      leg.position.set(s * 0.08, 0.18, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    // Twin blades (curved box blades)
    for (const s of [-1, 1]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.08), metalMat(0x330011, 0.3, 0.8));
      blade.position.set(s * 0.22, 0.7, 0.18);
      blade.rotation.z = s * 0.3;
      blade.castShadow = true;
      g.add(blade);
      const bladeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.05), glowMat(red, 0.8));
      bladeGlow.position.set(s * 0.24, 0.7, 0.19);
      bladeGlow.rotation.z = s * 0.3;
      g.add(bladeGlow);
    }
    parts.type = this.id;
    parts.glowColor = 0xaa2244;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'W';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      const target = targetEntity || findEnemyNear(hero.x, hero.z, 14);
      if (!target || !target.alive) return;
      playSound('hit');
      const dmg = 40 + 25 * lvl;
      spawnSpellProjectile(hero.x, hero.z, target, 0xaa2244, 18, (t) => {
        if (t && t.alive) {
          applyDamage(t, dmg, 'magic');
          t.slowTimer = 1.5 + 0.25 * lvl;
          spawnParticles(t.x, t.z, 0xaa2244, 4);
          floatDamage(t.x, t.z, 'DAGGER', '#aa2244');
        }
      });
    } else if (key === 'W') {
      const target = targetEntity || findEnemyNear(hero.x, hero.z, 10);
      if (!target || !target.alive) return;
      playSound('magic');
      const dx = target.x - hero.x, dz = target.z - hero.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        hero.x = target.x - (dx / dist) * 1.5;
        hero.z = target.z - (dz / dist) * 1.5;
        if (hero.group) {
          hero.group.position.set(hero.x, 0, hero.z);
        }
      }
      hero.phantomStrikeAtkSpd = 0.5 + 0.15 * lvl;
      hero.phantomStrikeTimer = 4;
      applyDamage(target, 30 + 20 * lvl, 'physical');
      spawnParticles(target.x, target.z, 0xaa2244, 6);
      floatDamage(hero.x, hero.z, 'PHANTOM STRIKE', '#aa2244');
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'BLUR', '#aa2244');
      spawnParticles(hero.x, hero.z, 0x440011, 4);
      playSound('magic');
    } else if (key === 'R') {
      floatDamage(hero.x, hero.z, 'COUP DE GRÂCE', '#aa2244');
      playSound('magic');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    if (target && target.alive) {
      const dist = Math.sqrt((target.x - hero.x) ** 2 + (target.z - hero.z) ** 2);
      if (dist <= 10 && dist > 2) {
        playSound('magic');
        const dx = target.x - hero.x, dz = target.z - hero.z;
        const d = Math.sqrt(dx * dx + dz * dz) || 1;
        hero.x = target.x - (dx / d) * 1.5;
        hero.z = target.z - (dz / d) * 1.5;
        if (hero.group) hero.group.position.set(hero.x, 0, hero.z);
        applyDamage(target, 80, 'physical');
        spawnParticles(target.x, target.z, 0xaa2244, 6);
      } else {
        playSound('hit');
        spawnSpellProjectile(hero.x, hero.z, target, 0xaa2244, 18, (t) => {
          if (t && t.alive) {
            applyDamage(t, 65, 'magic');
            t.slowTimer = 2;
            spawnParticles(t.x, t.z, 0xaa2244, 4);
          }
        });
      }
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#2a0010';
    ctx2d.fillRect(44, 38, 48, 55);
    ctx2d.fillStyle = '#440011';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#aa2244';
    ctx2d.beginPath();
    ctx2d.arc(62, 28, 3, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 28, 3, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#aa2244';
    ctx2d.fillRect(52, 70, 8, 28);
    ctx2d.fillRect(84, 70, 8, 28);
    ctx2d.strokeStyle = '#aa2244';
    ctx2d.lineWidth = 2;
    ctx2d.strokeRect(46, 40, 44, 51);
  },
};
