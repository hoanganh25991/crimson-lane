// ─── ENIGMA ─────────────────────────────────────────────────────────────────────
// Int, Scourge, Initiator. Floating cosmic figure, void/star theme.
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'enigma',
  def: {
    name: 'ENIGMA',
    color: 0x220022,
    headColor: 0xaa44aa,
    team: 'scourge',
    hp: 511,
    mp: 351,
    move: 7,
    range: 12,
    dmgMin: 44,
    dmgMax: 50,
    armor: 2,
    atkSpd: 0.9,
    skills: ['Malefice', 'Demonic Conversion', 'Midnight Pulse', 'Black Hole'],
  },
  skillCosts: { Q: [110, 110, 110, 110], W: [140, 140, 140, 140], E: [95, 95, 95, 95], R: [200, 200, 200] },
  skillCDs: { Q: 15, W: 35, E: 25, R: 160 },
  skillNames: { Q: 'MALEFICE', W: 'DEMONIC CONVERSION', E: 'MIDNIGHT PULSE', R: 'BLACK HOLE' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'power_boots', 'void_staff'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const voidC = 0x220022;
    const midC = 0x660066;
    const accent = 0xaa44aa;

    // Central orb/core (floating)
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 12),
      stdMat(voidC, 0.8)
    );
    core.position.y = 0.85;
    core.castShadow = true;
    g.add(core);
    parts.core = core;

    // Inner glow
    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 8),
      glowMat(accent, 2)
    );
    innerGlow.position.y = 0.85;
    g.add(innerGlow);

    // Orbiting fragments (small spheres)
    parts.fragments = [];
    for (let i = 0; i < 6; i++) {
      const frag = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        glowMat(midC, 1.5)
      );
      frag.userData.angle = (i / 6) * Math.PI * 2;
      frag.userData.radius = 0.45;
      frag.userData.height = 0.85;
      g.add(frag);
      parts.fragments.push(frag);
    }

    // Void tendrils (short cones around base)
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.15, 5),
        transMat(0x440044, 0.5)
      );
      const a = (i / 4) * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.2, 0.72, Math.sin(a) * 0.2);
      t.rotation.x = 0.3;
      t.rotation.z = -a;
      g.add(t);
    }

    parts.glowColor = accent;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'E' || key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 14));
      if (!target || !target.alive) return;
      playSound('magic');
      const dmgPerPulse = [30, 50, 70, 90][lvl - 1] || 30;
      const stunPerPulse = 0.4;
      const pulses = 3;
      let count = 0;
      const doPulse = () => {
        if (!target.alive || count >= pulses) return;
        applyDamage(target, dmgPerPulse, 'magic');
        target.stunTimer = stunPerPulse;
        spawnParticles(target.x, target.z, 0xaa44aa, 4);
        count++;
        if (count < pulses) setTimeout(doPulse, 400);
      };
      spawnSpellProjectile(hero.x, hero.z, target, 0xaa44aa, 14, doPulse);
      setTimeout(() => { doPulse(); }, 300);
    } else if (key === 'W') {
      playSound('magic');
      let best = null, bestDist = Infinity;
      for (const c of G.creeps || []) {
        if (!c.alive || c.team !== hero.team) continue;
        const dx = c.x - hero.x, dz = c.z - hero.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 8 && d < bestDist) { bestDist = d; best = c; }
      }
      if (best && bestDist < 8) {
        killEntity(best);
        spawnParticles(best.x, best.z, 0x660066, 10);
        floatDamage(best.x, best.z, 'EIDOLONS', '#aa44aa');
        // Eidolon spawn could be added to G.creeps here if game supports it
      } else {
        floatDamage(hero.x, hero.z, 'NO CREEP', '#666');
      }
    } else if (key === 'E') {
      if (!targetPos) return;
      playSound('magic');
      const radius = 5;
      const pctDmg = [3, 4, 5, 6][lvl - 1] || 3;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0, radius, 32),
        new THREE.MeshBasicMaterial({ color: 0x330033, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(targetPos.x, 0.03, targetPos.z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 4, maxLife: 4, type: 'ring', scale: 1 });
      const tick = () => {
        const enemies = getEnemiesOf(hero.team);
        for (const e of enemies) {
          if (!e.alive) continue;
          const dx = e.x - targetPos.x, dz = e.z - targetPos.z;
          if (Math.sqrt(dx * dx + dz * dz) <= radius) {
            const dmg = Math.max(1, (e.maxHp || e.hp) * (pctDmg / 100));
            applyDamage(e, dmg, 'magic');
          }
        }
      };
      tick();
      const iv = setInterval(tick, 1000);
      setTimeout(() => clearInterval(iv), 4000);
      spawnParticles(targetPos.x, targetPos.z, 0x660066, 8);
      floatDamage(targetPos.x, targetPos.z, 'MIDNIGHT PULSE', '#aa44aa');
    } else if (key === 'R') {
      if (!targetPos) return;
      playSound('magic');
      const radius = 6;
      const dmg = [55, 110, 165][Math.min(lvl - 1, 2)] || 55;
      const pullStun = 3;
      const vortex = new THREE.Mesh(
        new THREE.RingGeometry(1, radius, 32),
        new THREE.MeshBasicMaterial({ color: 0x110011, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      vortex.rotation.x = -Math.PI / 2;
      vortex.position.set(targetPos.x, 0.02, targetPos.z);
      scene.add(vortex);
      G.effects.push({ mesh: vortex, life: 4, maxLife: 4, type: 'ring', scale: 1 });
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - targetPos.x, dz = e.z - targetPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius) {
          e.stunTimer = pullStun;
          e.slowTimer = pullStun;
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0xaa44aa, 4);
        }
      }
      spawnParticles(targetPos.x, targetPos.z, 0x330033, 12);
      floatDamage(targetPos.x, targetPos.z, 'BLACK HOLE', '#aa44aa');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    if (!target || !target.alive) return;
    playSound('magic');
    spawnSpellProjectile(hero.x, hero.z, target, 0xaa44aa, 14, (t) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!t.alive) return;
          applyDamage(t, 50, 'magic');
          t.stunTimer = 0.4;
          spawnParticles(t.x, t.z, 0xaa44aa, 3);
        }, i * 400);
      }
    });
  },

  drawPortrait(ctx2d) {
    const w = 136, h = 100;
    ctx2d.fillStyle = '#220022';
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.fillStyle = '#660066';
    ctx2d.beginPath();
    ctx2d.arc(68, 52, 36, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#aa44aa';
    ctx2d.beginPath();
    ctx2d.arc(68, 52, 22, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#330033';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx2d.beginPath();
      ctx2d.arc(
        68 + Math.cos(a) * 42,
        52 + Math.sin(a) * 42,
        5,
        0,
        Math.PI * 2
      );
      ctx2d.fill();
    }
    ctx2d.strokeStyle = '#440044';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.arc(68, 52, 28, 0, Math.PI * 2);
    ctx2d.stroke();
  },
};
