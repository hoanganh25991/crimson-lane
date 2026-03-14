// ─── JUGGERNAUT ──────────────────────────────────────────────────────────────
// Spec: docs/heroes.md §12 — Agi, Sentinel, Carry/Fighter

import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'juggernaut',
  def: {
    name: 'Juggernaut',
    color: 0xcc4422,
    headColor: 0xff8844,
    team: 'sentinel',
    hp: 560,
    mp: 195,
    move: 8,
    range: 2.5,
    dmgMin: 46,
    dmgMax: 50,
    armor: 3,
    atkSpd: 0.95,
    skills: ['Blade Fury', 'Healing Ward', 'Blade Dance', 'Omnislash'],
  },
  skillCosts: { Q: [120, 120, 120, 120], W: [140, 140, 140, 140], E: [0, 0, 0, 0], R: [200, 200, 200] },
  skillCDs: { Q: [42, 42, 42, 42], W: [60, 60, 60, 60], E: [0, 0, 0, 0], R: [130, 130, 130] },
  skillNames: { Q: 'Blade Fury', W: 'Healing Ward', E: 'Blade Dance', R: 'Omnislash' },
  aiBuild: [],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const armor = 0xcc4422;
    const dark = 0x2a1510;
    const accent = 0xff8844;

    // Armored torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.28), metalMat(armor, 0.4, 0.7));
    torso.position.y = 0.72;
    torso.castShadow = true;
    g.add(torso);
    // Shoulder pads
    for (const s of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.14), metalMat(dark, 0.35, 0.75));
      pad.position.set(s * 0.24, 1.0, 0);
      g.add(pad);
    }
    // Mask (flat face)
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.12), stdMat(dark, 0.8));
    mask.position.set(0, 1.14, 0.1);
    g.add(mask);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), glowMat(accent, 1.5));
      eye.position.set(s * 0.05, 1.16, 0.18);
      g.add(eye);
    }
    // Bandana
    const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8), stdMat(0x881100, 0.8));
    bandana.position.y = 1.28;
    bandana.rotation.x = Math.PI / 2;
    g.add(bandana);
    // Legs
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), metalMat(armor, 0.45, 0.65));
      leg.position.set(s * 0.1, 0.18, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    // Long blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.03), metalMat(0xddddcc, 0.15, 0.9));
    blade.position.set(0.26, 0.6, 0.15);
    blade.rotation.z = -0.1;
    blade.castShadow = true;
    g.add(blade);
    parts.blade = blade;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), metalMat(accent, 0.3, 0.8));
    guard.position.set(0.26, 0.88, 0.15);
    guard.rotation.z = -0.1;
    g.add(guard);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 6), stdMat(dark, 0.9));
    handle.position.set(0.26, 1.0, 0.15);
    handle.rotation.z = -0.1;
    g.add(handle);

    parts.type = this.id;
    parts.glowColor = 0xff8844;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('hit');
      hero.bladeFuryActive = true;
      hero.bladeFuryTimer = 5;
      const dmg = 60 + 30 * lvl;
      const radius = 5;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz <= radius * radius) {
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0xff8844, 3);
        }
      }
      const ringGeo = new THREE.RingGeometry(2, radius, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8844, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(hero.x, 0.05, hero.z);
      scene.add(ring);
      G.effects = G.effects || [];
      G.effects.push({ mesh: ring, life: 0.4, maxLife: 0.4, type: 'ring' });
      floatDamage(hero.x, hero.z, 'BLADE FURY', '#ff8844');
    } else if (key === 'W') {
      playSound('magic');
      const healAmount = 80 + 40 * lvl;
      hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
      floatDamage(hero.x, hero.z, '+' + Math.floor(healAmount) + ' HP', '#44ff44');
      spawnParticles(hero.x, hero.z, 0x44ff88, 8);
      const wardRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.5, 16), new THREE.MeshBasicMaterial({ color: 0x44ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
      wardRing.rotation.x = -Math.PI / 2;
      wardRing.position.set(hero.x, 0.05, hero.z);
      scene.add(wardRing);
      G.effects = G.effects || [];
      G.effects.push({ mesh: wardRing, life: 0.5, maxLife: 0.5, type: 'ring' });
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'BLADE DANCE', '#ff8844');
      playSound('magic');
    } else if (key === 'R') {
      const target = targetEntity || findEnemyNear(hero.x, hero.z, 10);
      if (!target || !target.alive) return;
      playSound('hit');
      const hits = 4 + lvl;
      const dmgPerHit = 50 + 25 * lvl;
      let count = 0;
      const doSlash = (t) => {
        if (!t || !t.alive || count >= hits) return;
        applyDamage(t, dmgPerHit, 'physical');
        t.stunTimer = 0.15;
        spawnParticles(t.x, t.z, 0xff8844, 3);
        count++;
        const enemies = getEnemiesOf(hero.team).filter(e => e.alive && e !== t);
        if (enemies.length > 0 && count < hits) {
          let nearest = null, bestD = 6;
          for (const e of enemies) {
            const dx = e.x - t.x, dz = e.z - t.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < bestD) { bestD = d; nearest = e; }
          }
          if (nearest) setTimeout(() => doSlash(nearest), 120);
        }
      };
      doSlash(target);
      floatDamage(target.x, target.z, 'OMNISLASH', '#ff8844');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    if (target && target.alive) {
      const enemies = getEnemiesOf(hero.team).filter(e => e.alive);
      if (enemies.length >= 2) {
        playSound('hit');
        const dmg = 60 + 30 * 2;
        const radius = 5;
        for (const e of enemies) {
          const dx = e.x - hero.x, dz = e.z - hero.z;
          if (dx * dx + dz * dz <= radius * radius) {
            applyDamage(e, dmg, 'magic');
            spawnParticles(e.x, e.z, 0xff8844, 3);
          }
        }
      } else {
        playSound('hit');
        applyDamage(target, 80, 'physical');
        target.stunTimer = 0.2;
        spawnParticles(target.x, target.z, 0xff8844, 4);
      }
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#cc4422';
    ctx2d.fillRect(46, 36, 44, 58);
    ctx2d.fillStyle = '#2a1510';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#ff8844';
    ctx2d.beginPath();
    ctx2d.arc(62, 28, 2, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 28, 2, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#881100';
    ctx2d.fillRect(52, 26, 32, 6);
    ctx2d.fillStyle = '#ddddcc';
    ctx2d.fillRect(90, 30, 6, 52);
    ctx2d.strokeStyle = '#ff8844';
    ctx2d.lineWidth = 2;
    ctx2d.strokeRect(48, 38, 40, 54);
  },
};
