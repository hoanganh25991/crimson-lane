// ─── LINA ─────────────────────────────────────────────────────────────────────
// Int, Sentinel, Nuker. Female caster, flame hair, staff.
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'lina',
  def: {
    name: 'LINA',
    color: 0xcc2200,
    headColor: 0xff6622,
    team: 'sentinel',
    hp: 492,
    mp: 351,
    move: 8,
    range: 12,
    dmgMin: 44,
    dmgMax: 50,
    armor: 2,
    atkSpd: 0.9,
    skills: ['Dragon Slave', 'Light Strike Array', 'Fiery Soul', 'Laguna Blade'],
  },
  skillCosts: { Q: [100, 100, 100, 100], W: [90, 90, 90, 90], E: [0, 0, 0, 0], R: [280, 280, 280] },
  skillCDs: { Q: 9, W: 7, E: 0, R: 60 },
  skillNames: { Q: 'DRAGON SLAVE', W: 'LIGHT STRIKE', E: 'FIERY SOUL', R: 'LAGUNA BLADE' },
  skillTypes: { E: 'passive' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'power_boots', 'void_staff'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const darkRed = 0x552200;
    const midRed = 0xcc2200;
    const flame = 0xff6622;

    // Robe (slim cylinder)
    const robe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.35, 0.9, 10),
      stdMat(darkRed, 0.85)
    );
    robe.position.y = 0.5;
    robe.castShadow = true;
    g.add(robe);

    // Torso overlay
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8),
      stdMat(midRed, 0.8)
    );
    torso.position.y = 0.88;
    g.add(torso);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      stdMat(0xddaa88, 0.75)
    );
    head.position.y = 1.22;
    head.castShadow = true;
    g.add(head);

    // Flame hair (several cones)
    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.06 + i * 0.01, 0.2 + i * 0.04, 6),
        glowMat(flame, 2)
      );
      cone.position.set(
        (i - 2) * 0.08,
        1.38 + Math.sin(i * 0.7) * 0.05,
        -0.05 - i * 0.02
      );
      cone.rotation.x = 0.2 + i * 0.05;
      g.add(cone);
    }

    // Staff
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.95, 6),
      metalMat(0x332211, 0.4, 0.6)
    );
    staff.position.set(0.22, 0.72, 0.08);
    staff.rotation.z = 0.15;
    g.add(staff);

    // Staff flame orb
    const staffFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 8),
      glowMat(flame, 2.5)
    );
    staffFlame.position.set(0.26, 1.18, 0.1);
    g.add(staffFlame);
    parts.staffFlame = staffFlame;

    parts.glowColor = flame;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'W' || key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('fire');
      const dmg = [80, 140, 200, 260][lvl - 1] || 80;
      if (!targetPos) return;
      const dx = targetPos.x - hero.x;
      const dz = targetPos.z - hero.z;
      const dist = Math.min(14, Math.sqrt(dx * dx + dz * dz));
      if (dist > 0.1) hero.group.rotation.y = Math.atan2(dx, dz);
      const nx = dx / dist || 0;
      const nz = dz / dist || 0;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const ex = e.x - hero.x, ez = e.z - hero.z;
        const ed = Math.sqrt(ex * ex + ez * ez);
        if (ed > 14) continue;
        const dot = (ex / ed) * nx + (ez / ed) * nz;
        const cross = Math.abs((ex / ed) * nz - (ez / ed) * nx);
        if (dot > 0.92 && cross < 0.12) {
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0xff6622, 4);
        }
      }
      spawnParticles(hero.x + nx * 6, hero.z + nz * 6, 0xff6622, 8);
      floatDamage(hero.x, hero.z, 'DRAGON SLAVE', '#ff6622');
    } else if (key === 'W') {
      playSound('fire');
      const dmg = [90, 160, 230, 300][lvl - 1] || 90;
      const stunDur = [0.6, 1.0, 1.4, 1.8][lvl - 1] || 0.6;
      const radius = 4;
      if (!targetPos) return;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0, radius, 24),
        new THREE.MeshBasicMaterial({ color: 0xff6622, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(targetPos.x, 0.05, targetPos.z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 0.8, maxLife: 0.8, type: 'ring', scale: 1 });
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - targetPos.x, dz = e.z - targetPos.z;
        if (Math.sqrt(dx * dx + dz * dz) <= radius) {
          applyDamage(e, dmg, 'magic');
          e.stunTimer = stunDur;
          spawnParticles(e.x, e.z, 0xff6622, 4);
        }
      }
      spawnParticles(targetPos.x, targetPos.z, 0xff6622, 10);
      floatDamage(targetPos.x, targetPos.z, 'LIGHT STRIKE', '#ff6622');
    } else if (key === 'E') {
      // Fiery Soul passive: stack attack speed on spell cast (handled elsewhere or visual only)
      floatDamage(hero.x, hero.z, 'FIERY SOUL', '#ff6622');
      playSound('magic');
    } else if (key === 'R') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 14));
      if (!target || !target.alive) return;
      playSound('fire');
      const dmg = [450, 675, 900][Math.min(lvl - 1, 2)] || 450;
      applyDamage(target, dmg, 'pure');
      spawnSpellProjectile(hero.x, hero.z, target, 0xff2266, 25, () => {
        spawnParticles(target.x, target.z, 0xff2266, 12);
        floatDamage(target.x, target.z, 'LAGUNA!', '#ff2266');
      });
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    if (!target || !target.alive) return;
    playSound('fire');
    spawnSpellProjectile(hero.x, hero.z, target, 0xff2266, 22, (t) => {
      applyDamage(t, 450, 'pure');
      spawnParticles(t.x, t.z, 0xff2266, 8);
    });
  },

  drawPortrait(ctx2d) {
    const w = 136, h = 100;
    ctx2d.fillStyle = '#552200';
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.fillStyle = '#cc2200';
    ctx2d.beginPath();
    ctx2d.moveTo(30, h);
    ctx2d.lineTo(50, 50);
    ctx2d.lineTo(86, 50);
    ctx2d.lineTo(106, h);
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.fillStyle = '#ddaa88';
    ctx2d.beginPath();
    ctx2d.arc(68, 38, 18, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#ff6622';
    for (let i = 0; i < 5; i++) {
      ctx2d.beginPath();
      ctx2d.moveTo(58 + i * 6, 28);
      ctx2d.lineTo(62 + i * 6, 18);
      ctx2d.lineTo(66 + i * 6, 28);
      ctx2d.closePath();
      ctx2d.fill();
    }
    ctx2d.strokeStyle = '#332211';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(88, 35);
    ctx2d.lineTo(120, 20);
    ctx2d.lineTo(120, 75);
    ctx2d.stroke();
    ctx2d.fillStyle = '#ff6622';
    ctx2d.beginPath();
    ctx2d.arc(120, 48, 8, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
