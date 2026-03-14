// ─── ZEUS ──────────────────────────────────────────────────────────────────────
// Robed elder, lightning, beard, crown. Int, Sentinel, Nuker
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'zeus',
  def: {
    name: 'ZEUS',
    color: 0xffcc00,
    headColor: 0xfff0aa,
    team: 'sentinel',
    hp: 511,
    mp: 351,
    move: 7.5,
    range: 12,
    dmgMin: 41,
    dmgMax: 49,
    armor: 2,
    atkSpd: 0.9,
    skills: ['Arc Lightning', 'Lightning Bolt', 'Static Field', "Thundergod's Wrath"],
  },
  skillCosts: { Q: [65, 65, 65, 65], W: [100, 100, 100, 100], E: [0, 0, 0, 0], R: [225, 225, 225, 225] },
  skillCDs: { Q: [2, 2, 2, 2], W: [7, 7, 7, 7], E: [0, 0, 0, 0], R: [90, 90, 90, 90] },
  castRangeByLevel: { Q: [700, 700, 700, 700], W: [700, 700, 700, 700], R: [Infinity, Infinity, Infinity] },
  skillNames: { Q: 'ARC LIGHTNING', W: 'LIGHTNING BOLT', E: 'STATIC FIELD', R: "THUNDERGOD'S WRATH" },
  skillTypes: { E: 'passive' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'void_staff', 'power_boots'],

  buildModel() {
    const g = new THREE.Group();
    const gold = 0xffcc00;
    const brown = 0x886622;
    const accent = 0xfff0aa;
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 0.95, 10), stdMat(gold));
    robe.position.y = 0.52;
    g.add(robe);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12), stdMat(brown));
    belt.position.y = 0.35;
    g.add(belt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), stdMat(0xddbb88));
    head.position.y = 1.05;
    g.add(head);
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.12), stdMat(0xaa8866));
    beard.position.set(0, 0.92, 0.08);
    g.add(beard);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 5), stdMat(0xddcc00));
    crown.position.y = 1.28;
    g.add(crown);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glowMat(accent));
    orb.position.set(0.2, 0.6, 0.22);
    g.add(orb);
    const parts = {};
    parts.type = this.id;
    parts.glowColor = accent;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'W';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, getEnemyHeroesOf, findEnemyNear, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 14);
      if (!target || !target.alive) return;
      playSound('lightning');
      const dmg = 80 + 30 * lvl;
      const hit = new Set([target]);
      applyDamage(target, dmg, 'magic');
      spawnParticles(target.x, target.z, 0xfff0aa, 4);
      const enemies = getEnemiesOf(hero.team).filter(e => e.alive && !hit.has(e));
      let current = target;
      for (let b = 0; b < 3 + lvl; b++) {
        let next = null, bestD = 7;
        for (const e of enemies) {
          const dx = e.x - current.x, dz = e.z - current.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d <= bestD && d > 0.5 && !hit.has(e)) { bestD = d; next = e; }
        }
        if (!next) break;
        hit.add(next);
        applyDamage(next, dmg * 0.85, 'magic');
        spawnParticles(next.x, next.z, 0xfff0aa, 3);
        current = next;
      }
      floatDamage(hero.x, hero.z, 'ARC', '#fff0aa');
    } else if (key === 'W') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 14);
      if (!target || !target.alive) return;
      playSound('lightning');
      const dmg = 100 + 75 * lvl;
      applyDamage(target, dmg, 'magic');
      target.stunTimer = 0.25;
      spawnParticles(target.x, target.z, 0xfff0aa, 8);
      floatDamage(target.x, target.z, 'BOLT', '#ffff88');
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(target.x, 1.2, target.z);
      scene.add(bolt);
      G.effects.push({ mesh: bolt, life: 0.25, maxLife: 0.25, type: 'ring' });
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'STATIC FIELD', '#fff0aa');
      playSound('magic');
    } else if (key === 'R') {
      playSound('lightning');
      const dmg = 225 + 100 * lvl;
      const heroes = (typeof getEnemyHeroesOf === 'function' ? getEnemyHeroesOf(hero.team) : getEnemiesOf(hero.team).filter(e => e.isHero));
      for (const e of heroes || []) {
        if (!e.alive) continue;
        applyDamage(e, dmg, 'magic');
        spawnParticles(e.x, e.z, 0xfff0aa, 6);
        floatDamage(e.x, e.z, 'WRATH', '#ffff88');
      }
      if (!heroes?.length) {
        const enemies = getEnemiesOf(hero.team).filter(e => e.alive);
        for (const e of enemies.slice(0, 5)) {
          applyDamage(e, dmg, 'magic');
          spawnParticles(e.x, e.z, 0xfff0aa, 4);
        }
      }
      floatDamage(hero.x, hero.z, "THUNDERGOD'S WRATH", '#ffff88');
      if (showAnnouncer) showAnnouncer("⚡ THUNDERGOD'S WRATH!", '#ffff88', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    applyDamage(target, 175, 'magic');
    target.stunTimer = 0.25;
    spawnParticles(target.x, target.z, 0xfff0aa, 6);
    playSound('lightning');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#886622';
    ctx2d.fillRect(0, 0, 136, 100);
    ctx2d.fillStyle = '#ffcc00';
    ctx2d.fillRect(40, 32, 56, 60);
    ctx2d.fillStyle = '#886622';
    ctx2d.fillRect(44, 48, 48, 8);
    ctx2d.fillStyle = '#ddbb88';
    ctx2d.beginPath();
    ctx2d.arc(68, 26, 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#aa8866';
    ctx2d.fillRect(52, 32, 32, 14);
    ctx2d.fillStyle = '#ffcc00';
    ctx2d.beginPath();
    ctx2d.moveTo(68, 8);
    ctx2d.lineTo(58, 22);
    ctx2d.lineTo(78, 22);
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.fillStyle = '#fff0aa';
    ctx2d.beginPath();
    ctx2d.arc(88, 48, 10, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#ffffcc';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.moveTo(88, 38);
    ctx2d.lineTo(88, 58);
    ctx2d.stroke();
  },
};
