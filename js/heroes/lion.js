// ─── LION ─────────────────────────────────────────────────────────────────────
// Int, Sentinel, Support/Disable. Robed figure, demon hand, staff.
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'lion',
  def: {
    name: 'LION',
    color: 0x663322,
    headColor: 0xaa6644,
    team: 'sentinel',
    hp: 492,
    mp: 351,
    move: 8,
    range: 12,
    dmgMin: 43,
    dmgMax: 49,
    armor: 2,
    atkSpd: 0.9,
    skills: ['Earth Spike', 'Hex', 'Mana Drain', 'Finger of Death'],
  },
  skillCosts: { Q: [100, 100, 100, 100], W: [125, 125, 125, 125], E: [10, 10, 10, 10], R: [200, 200, 200] },
  skillCDs: { Q: 12, W: 30, E: 20, R: 160 },
  skillNames: { Q: 'EARTH SPIKE', W: 'HEX', E: 'MANA DRAIN', R: 'FINGER OF DEATH' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'power_boots', 'void_staff'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const brown = 0x663322;
    const tan = 0xaa6644;
    const dark = 0x330011;

    // Robe
    const robe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.38, 0.95, 10),
      stdMat(brown, 0.85)
    );
    robe.position.y = 0.5;
    robe.castShadow = true;
    g.add(robe);

    // Hood/collar
    const hood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.24, 0.2, 8),
      stdMat(dark, 0.9)
    );
    hood.position.y = 1.0;
    g.add(hood);

    // Head (face)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 10),
      stdMat(0xbb8866, 0.75)
    );
    head.position.y = 1.22;
    head.castShadow = true;
    g.add(head);

    // Horns
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.18, 5),
        stdMat(dark, 0.8)
      );
      horn.position.set(s * 0.14, 1.42, -0.02);
      horn.rotation.z = s * -0.25;
      g.add(horn);
    }

    // Demon hand (claw) — large, raised
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      stdMat(0x442211, 0.8)
    );
    hand.position.set(-0.2, 1.05, 0.18);
    hand.scale.set(1.2, 1, 1.1);
    g.add(hand);
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.1, 4),
        stdMat(0x331100, 0.7)
      );
      claw.position.set(-0.2 + (i - 1) * 0.04, 1.14, 0.28);
      claw.rotation.x = -0.4;
      g.add(claw);
    }
    parts.demonHand = hand;

    // Staff
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 1.0, 6),
      metalMat(0x2a1810, 0.35, 0.65)
    );
    staff.position.set(0.24, 0.7, 0.06);
    staff.rotation.z = 0.1;
    g.add(staff);
    const staffTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      glowMat(0x6644aa, 1.5)
    );
    staffTop.position.set(0.26, 1.22, 0.08);
    g.add(staffTop);

    parts.glowColor = 0x6644aa;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return true;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('magic');
      const dmg = [80, 140, 200, 260][lvl - 1] || 80;
      const stunDur = [0.8, 1.2, 1.6, 2.0][lvl - 1] || 0.8;
      if (!targetPos) return;
      const dx = targetPos.x - hero.x, dz = targetPos.z - hero.z;
      const dist = Math.min(12, Math.sqrt(dx * dx + dz * dz));
      if (dist > 0.1) hero.group.rotation.y = Math.atan2(dx, dz);
      const nx = dist > 0 ? dx / dist : 0;
      const nz = dist > 0 ? dz / dist : 0;
      const lineLen = 10;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const ex = e.x - hero.x, ez = e.z - hero.z;
        const ed = Math.sqrt(ex * ex + ez * ez);
        if (ed > lineLen) continue;
        const dot = (ex / ed) * nx + (ez / ed) * nz;
        const cross = Math.abs((ex / ed) * nz - (ez / ed) * nx);
        if (dot > 0.9 && cross < 0.15) {
          applyDamage(e, dmg, 'magic');
          e.stunTimer = stunDur;
          spawnParticles(e.x, e.z, 0x886622, 4);
        }
      }
      spawnParticles(hero.x + nx * 5, hero.z + nz * 5, 0x886622, 6);
      floatDamage(hero.x, hero.z, 'EARTH SPIKE', '#886622');
    } else if (key === 'W') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 12));
      if (!target || !target.alive) return;
      playSound('magic');
      target.hexTimer = [2.5, 3.0, 3.5, 4.0][lvl - 1] || 2.5;
      target.slowTimer = target.hexTimer;
      applyDamage(target, 20 * lvl, 'magic');
      spawnParticles(target.x, target.z, 0x6644aa, 8);
      floatDamage(target.x, target.z, 'HEX', '#6644aa');
    } else if (key === 'E') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 10));
      if (!target || !target.alive) return;
      playSound('magic');
      const drain = [30, 60, 90, 120][lvl - 1] || 30;
      const actual = Math.min(drain, target.mp || 0);
      target.mp = Math.max(0, (target.mp || 0) - actual);
      hero.mp = Math.min(hero.maxMp, hero.mp + actual);
      spawnSpellProjectile(target.x, target.z, hero, 0x4488ff, 12, () => {
        spawnParticles(hero.x, hero.z, 0x4488ff, 4);
        floatDamage(hero.x, hero.z, '+' + Math.floor(actual) + ' MP', '#4488ff');
      });
    } else if (key === 'R') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 14));
      if (!target || !target.alive) return;
      playSound('magic');
      const baseDmg = [500, 650, 800][Math.min(lvl - 1, 2)] || 500;
      const bonus = (hero.fingerKills || 0) * 40;
      const dmg = baseDmg + bonus;
      applyDamage(target, dmg, 'magic');
      spawnSpellProjectile(hero.x, hero.z, target, 0xaa2266, 28, (t) => {
        spawnParticles(t.x, t.z, 0xaa2266, 10);
        floatDamage(t.x, t.z, 'FINGER!', '#aa2266');
      });
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    if (!target || !target.alive) return;
    playSound('magic');
    const dmg = 500 + (hero.fingerKills || 0) * 40;
    spawnSpellProjectile(hero.x, hero.z, target, 0xaa2266, 24, (t) => {
      applyDamage(t, dmg, 'magic');
      spawnParticles(t.x, t.z, 0xaa2266, 8);
    });
  },

  drawPortrait(ctx2d) {
    const w = 136, h = 100;
    ctx2d.fillStyle = '#330011';
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.fillStyle = '#663322';
    ctx2d.beginPath();
    ctx2d.moveTo(25, h);
    ctx2d.lineTo(45, 45);
    ctx2d.lineTo(91, 45);
    ctx2d.lineTo(111, h);
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.fillStyle = '#aa6644';
    ctx2d.fillRect(38, 28, 60, 22);
    ctx2d.fillStyle = '#bb8866';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#330011';
    ctx2d.beginPath();
    ctx2d.moveTo(58, 22);
    ctx2d.lineTo(62, 38);
    ctx2d.lineTo(74, 38);
    ctx2d.lineTo(78, 22);
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.strokeStyle = '#2a1810';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(92, 38);
    ctx2d.lineTo(125, 25);
    ctx2d.lineTo(125, 70);
    ctx2d.stroke();
    ctx2d.fillStyle = '#6644aa';
    ctx2d.beginPath();
    ctx2d.arc(125, 48, 6, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
