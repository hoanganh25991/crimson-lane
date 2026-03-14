// ─── LICH ─────────────────────────────────────────────────────────────────────
import { buildLich } from '../hero-models.js';

export default {
  id: 'lich',
  def: {
    name: 'LICH',
    color: 0x8844cc,
    headColor: 0x5522aa,
    team: 'scourge',
    hp: 454,
    mp: 403,
    move: 8,
    range: 12,
    dmgMin: 49,
    dmgMax: 57,
    armor: 1,
    atkSpd: 0.9,
    skills: ['Frost Nova', 'Dark Ritual', 'Chain Frost', 'Frost Armor'],
  },
  skillCosts: { Q: [100, 115, 125, 140], W: [25, 25, 25, 25], E: [200, 290, 380, 380], R: [0, 0, 0, 0] },
  skillCDs: { Q: 6, W: 30, E: 145, R: 0 },
  skillNames: { Q: 'FROST NOVA', W: 'DARK RITUAL', E: 'CHAIN FROST', R: 'FROST ARMOR' },
  skillTypes: { R: 'passive' },
  aiBuild: ['boots_of_speed', 'vitality_gem', 'magic_charm', 'power_boots', 'void_staff'],

  buildModel() {
    return buildLich();
  },

  needsTarget(key) {
    return key === 'Q';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, killEntity, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('frost');
      const dmg = 100 + 50 * lvl;
      const radius = 5;
      const ringGeo = new THREE.RingGeometry(0, radius, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(targetPos.x, 0.05, targetPos.z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 0.6, maxLife: 0.6, type: 'ring', scale: 1 });
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - targetPos.x, dz = e.z - targetPos.z;
        if (Math.sqrt(dx * dx + dz * dz) <= radius) {
          applyDamage(e, dmg, 'magic');
          e.slowTimer = 3;
        }
      }
      spawnParticles(targetPos.x, targetPos.z, 0x00ffcc, 8);
    } else if (key === 'W') {
      let best = null, bestDist = Infinity;
      for (const c of G.creeps) {
        if (!c.alive || c.team !== hero.team) continue;
        const dx = c.x - hero.x, dz = c.z - hero.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < bestDist) { bestDist = d; best = c; }
      }
      if (best && bestDist < 15) {
        const restore = best.hp;
        hero.mp = Math.min(hero.maxMp, hero.mp + restore);
        killEntity(best);
        floatDamage(hero.x, hero.z, '+' + Math.floor(restore) + ' MP', '#3366ff');
        spawnParticles(hero.x, hero.z, 0x3366ff, 6);
      }
      playSound('magic');
    } else if (key === 'E') {
      playSound('chain_frost');
      const dmg = 280;
      const enemies = getEnemiesOf(hero.team).filter(e => e.alive);
      if (!enemies.length) return;
      let nearest = null, bestDist = Infinity;
      for (const e of enemies) {
        const dx = e.x - hero.x, dz = e.z - hero.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < bestDist) { bestDist = d; nearest = e; }
      }
      if (!nearest) return;
      const bounces = 10 + lvl * 2;
      const hit = new Set();
      const doNextBounce = (from, count) => {
        if (count <= 0 || !from || !from.alive) return;
        if (!hit.has(from)) {
          hit.add(from);
          applyDamage(from, dmg, 'magic');
          from.slowTimer = 1.5;
          spawnParticles(from.x, from.z, 0x00ffcc, 4);
        }
        let next = null, nd = Infinity;
        for (const e of enemies) {
          if (!e.alive) continue;
          const dx = e.x - from.x, dz = e.z - from.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d <= 8 && d > 0 && d < nd && !hit.has(e)) { nd = d; next = e; }
        }
        setTimeout(() => doNextBounce(next, count - 1), 150);
      };
      spawnSpellProjectile(hero.x, hero.z, nearest, 0x00ffcc, 12, () => doNextBounce(nearest, bounces));
    } else if (key === 'R') {
      floatDamage(hero.x, hero.z, 'FROST ARMOR', '#00ffcc');
      playSound('magic');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    applyDamage(target, 150, 'magic');
    target.slowTimer = 3;
    spawnParticles(target.x, target.z, 0x00ffcc, 6);
    playSound('frost');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#8844cc';
    ctx2d.fillRect(52, 40, 32, 40);
    ctx2d.fillStyle = '#5522aa';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#6633cc';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.moveTo(90, 20);
    ctx2d.lineTo(90, 75);
    ctx2d.stroke();
    ctx2d.fillStyle = '#00ffcc';
    ctx2d.beginPath();
    ctx2d.arc(90, 20, 6, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#00ffcc';
    ctx2d.beginPath();
    ctx2d.arc(62, 30, 3, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 30, 3, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
