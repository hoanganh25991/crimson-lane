// ─── SHADOW FIEND ────────────────────────────────────────────────────────────
import { buildShadowFiend } from '../hero-models.js';

export default {
  id: 'shadow_fiend',
  def: {
    name: 'SHADOW FIEND',
    color: 0xff2200,
    headColor: 0x880000,
    team: 'scourge',
    hp: 530,
    mp: 260,
    move: 9,
    range: 2.5,
    dmgMin: 51,
    dmgMax: 57,
    armor: 2,
    atkSpd: 1.1,
    skills: ['Shadowraze', 'Necromastery', 'Dark Presence', 'Requiem of Souls'],
  },
  skillCosts: { Q: [75, 75, 75, 75], W: [0, 0, 0, 0], E: [0, 0, 0, 0], R: [150, 175, 200, 200] },
  skillCDs: { Q: 10, W: 0, E: 0, R: 120 },
  skillNames: { Q: 'SHADOWRAZE', W: 'NECRO', E: 'DARK PRES', R: 'REQUIEM' },
  aiBuild: ['boots_of_speed', 'blades_of_attack', 'iron_branch', 'lifesteal_blade'],

  buildModel() {
    return buildShadowFiend();
  },

  needsTarget(key) {
    return false;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      playSound('magic');
      const dmg = [75, 150, 225, 300][lvl - 1] || 75;
      const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
      for (const dist of [3, 5.5, 8]) {
        const rx = hero.x + fwdX * dist, rz = hero.z + fwdZ * dist;
        const raze = new THREE.Mesh(new THREE.CircleGeometry(2.2, 12), new THREE.MeshBasicMaterial({ color: 0xcc0000, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
        raze.rotation.x = -Math.PI / 2;
        raze.position.set(rx, 0.03, rz);
        scene.add(raze);
        G.effects.push({ mesh: raze, life: 0.45, maxLife: 0.45, type: 'ring' });
        const enemies = getEnemiesOf(hero.team);
        for (const e of enemies) {
          if (!e.alive) continue;
          const dx = e.x - rx, dz = e.z - rz;
          if (Math.sqrt(dx * dx + dz * dz) <= 2.2) {
            applyDamage(e, dmg, 'magic');
            spawnParticles(e.x, e.z, 0xff0000, 3);
          }
        }
      }
      floatDamage(hero.x, hero.z, 'SHADOWRAZE!', '#ff2200');
    }
    if (key === 'W' || key === 'E') {
      floatDamage(hero.x, hero.z, key === 'W' ? 'NECROMASTERY' : 'DARK PRESENCE', '#880000');
    }
    if (key === 'R') {
      playSound('chain_frost');
      const dmg = [150, 250, 350][lvl - 1] || 150;
      const radius = 10;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0, radius, 32), new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(hero.x, 0.05, hero.z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 0.8, maxLife: 0.8, type: 'ring' });
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (Math.sqrt(dx * dx + dz * dz) <= radius) {
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0xff2200, 5);
        }
      }
      spawnParticles(hero.x, hero.z, 0xff0000, 12);
      if (showAnnouncer) showAnnouncer('REQUIEM OF SOULS!', '#ff2200', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
    for (const dist of [3, 5.5, 8]) {
      const rx = hero.x + fwdX * dist, rz = hero.z + fwdZ * dist;
      const dx = target.x - rx, dz = target.z - rz;
      if (Math.sqrt(dx * dx + dz * dz) <= 2.2) {
        applyDamage(target, 150, 'magic');
        spawnParticles(rx, rz, 0xff0000, 3);
      }
    }
    playSound('magic');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#220000';
    ctx2d.fillRect(52, 40, 32, 44);
    ctx2d.fillStyle = '#550011';
    ctx2d.beginPath();
    ctx2d.moveTo(52, 60);
    ctx2d.lineTo(20, 40);
    ctx2d.lineTo(28, 70);
    ctx2d.lineTo(50, 74);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.moveTo(84, 60);
    ctx2d.lineTo(116, 40);
    ctx2d.lineTo(108, 70);
    ctx2d.lineTo(86, 74);
    ctx2d.fill();
    ctx2d.fillStyle = '#330000';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#550000';
    ctx2d.beginPath();
    ctx2d.moveTo(58, 20);
    ctx2d.lineTo(52, 8);
    ctx2d.lineTo(62, 18);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.moveTo(78, 20);
    ctx2d.lineTo(84, 8);
    ctx2d.lineTo(74, 18);
    ctx2d.fill();
    ctx2d.fillStyle = '#ff0000';
    ctx2d.beginPath();
    ctx2d.arc(62, 28, 4, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 28, 4, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
