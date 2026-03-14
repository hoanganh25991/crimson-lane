// ─── WINDRUNNER ───────────────────────────────────────────────────────────────
import { buildWindrunner } from '../hero-models.js';

export default {
  id: 'windrunner',
  def: {
    name: 'WINDRUNNER',
    color: 0x44bb77,
    headColor: 0x228855,
    team: 'sentinel',
    hp: 492,
    mp: 234,
    move: 9,
    range: 13,
    dmgMin: 36,
    dmgMax: 46,
    armor: 1,
    atkSpd: 1.1,
    skills: ['Shackleshot', 'Powershot', 'Windrun', 'Focus Fire'],
  },
  skillCosts: { Q: [90, 100, 110, 120], W: [90, 100, 110, 120], E: [100, 100, 100, 100], R: [200, 275, 350, 350] },
  skillCDs: { Q: 15, W: 12, E: 15, R: 60 },
  skillNames: { Q: 'SHACKLE', W: 'POWERSHOT', E: 'WINDRUN', R: 'FOCUS FIRE' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'blades_of_attack', 'arcane_boots', 'lifesteal_blade'],

  buildModel() {
    return buildWindrunner();
  },

  needsTarget(key) {
    return key === 'Q' || key === 'W';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      playSound('ranged_hit');
      const target = targetEntity || findEnemyNear(targetPos.x, targetPos.z, 4);
      if (!target || !target.alive) return;
      const stunDur = [0.75, 1.5, 2.25, 3.0][lvl - 1] || 0.75;
      spawnSpellProjectile(hero.x, hero.z, target, 0x88ffcc, 22, (t) => {
        if (!t.alive) return;
        t.stunTimer = stunDur;
        applyDamage(t, 30, 'magic');
        spawnParticles(t.x, t.z, 0x88ffcc, 4);
        floatDamage(t.x, t.z, 'SHACKLED!', '#88ffcc');
      });
    }
    if (key === 'W') {
      playSound('ranged_hit');
      const dmg = [340, 480, 620, 760][lvl - 1] || 340;
      if (targetPos) {
        const dx = targetPos.x - hero.x, dz = targetPos.z - hero.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d > 0.1) hero.group.rotation.y = Math.atan2(dx, dz);
      }
      const fx = Math.sin(hero.group.rotation.y), fz = Math.cos(hero.group.rotation.y);
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const ex = e.x - hero.x, ez = e.z - hero.z;
        const dist = Math.sqrt(ex * ex + ez * ez);
        if (dist > 22 || dist < 0.1) continue;
        const dot = (ex / dist) * fx + (ez / dist) * fz;
        const cross = Math.abs((ex / dist) * fz - (ez / dist) * fx);
        if (dot > 0.85 && cross < 0.18) {
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0x88ff44, 4);
        }
      }
      const arrowEnd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: 0xaaffaa }));
      arrowEnd.position.set(hero.x + fx * 12, 0.8, hero.z + fz * 12);
      scene.add(arrowEnd);
      G.effects.push({ mesh: arrowEnd, life: 0.35, maxLife: 0.35, type: 'ring' });
      floatDamage(hero.x, hero.z, 'POWERSHOT!', '#88ff44');
    }
    if (key === 'E') {
      playSound('windrun');
      hero.windrunActive = true;
      hero.windrunTimer = 3;
      spawnParticles(hero.x, hero.z, 0x88ffcc, 8);
      floatDamage(hero.x, hero.z, 'WINDRUN!', '#88ffcc');
    }
    if (key === 'R') {
      playSound('levelup');
      const target = findEnemyNear(hero.x, hero.z, 25);
      if (!target) { floatDamage(hero.x, hero.z, 'NO TARGET', '#888'); return; }
      hero.focusFireActive = true;
      hero.focusFireTimer = 20;
      hero.focusFireTarget = target;
      hero.attackTarget = target;
      spawnParticles(hero.x, hero.z, 0x88ff44, 6);
      floatDamage(hero.x, hero.z, 'FOCUS FIRE!', '#88ff44');
      if (showAnnouncer) showAnnouncer('FOCUS FIRE!', '#88ff44', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    const { spawnSpellProjectile, applyDamage, spawnParticles, playSound } = ctx;
    const dx = target.x - hero.x, dz = target.z - hero.z;
    if (Math.sqrt(dx * dx + dz * dz) > 0) hero.group.rotation.y = Math.atan2(dx, dz);
    spawnSpellProjectile(hero.x, hero.z, target, 0x88ff44, 25, (t) => {
      applyDamage(t, 340, 'magic');
      spawnParticles(t.x, t.z, 0x88ff44, 5);
    });
    playSound('ranged_hit');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#228844';
    ctx2d.fillRect(52, 40, 32, 44);
    ctx2d.fillStyle = '#115533';
    ctx2d.beginPath();
    ctx2d.moveTo(52, 42);
    ctx2d.lineTo(36, 90);
    ctx2d.lineTo(52, 82);
    ctx2d.fill();
    ctx2d.fillStyle = '#d4a870';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#aa6600';
    ctx2d.beginPath();
    ctx2d.moveTo(52, 24);
    ctx2d.lineTo(48, 48);
    ctx2d.lineTo(56, 32);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.moveTo(84, 24);
    ctx2d.lineTo(86, 38);
    ctx2d.lineTo(80, 30);
    ctx2d.fill();
    ctx2d.strokeStyle = '#5a3a10';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(96, 54, 22, Math.PI * 0.7, Math.PI * 1.3);
    ctx2d.stroke();
    ctx2d.strokeStyle = '#ddcc88';
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.moveTo(82, 38);
    ctx2d.lineTo(82, 70);
    ctx2d.stroke();
    ctx2d.fillStyle = '#226644';
    ctx2d.beginPath();
    ctx2d.arc(62, 28, 2.5, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 28, 2.5, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
