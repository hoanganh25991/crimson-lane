// ─── AXE ─────────────────────────────────────────────────────────────────────
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'axe',
  def: {
    name: 'AXE',
    color: 0x8b0000,
    headColor: 0xcc4422,
    team: 'scourge',
    hp: 650,
    mp: 220,
    move: 8,
    range: 2.5,
    dmgMin: 52,
    dmgMax: 58,
    armor: 4,
    atkSpd: 0.9,
    skills: ["Berserker's Call", 'Battle Hunger', 'Counter Helix', 'Culling Blade'],
  },
  skillCosts: { Q: [80, 80, 80, 80], W: [75, 75, 75, 75], E: [0, 0, 0, 0], R: [120, 120, 120] },
  skillCDs: { Q: [14, 14, 14, 14], W: [20, 20, 20, 20], E: 0, R: [75, 75, 75] },
  skillNames: { Q: 'BERSERKER', W: 'BATTLE HUNGER', E: 'COUNTER HELIX', R: 'CULLING BLADE' },
  skillTypes: { E: 'passive' },
  aiBuild: ['boots_of_speed', 'vitality_gem', 'ring_of_protection', 'power_boots'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const darkRed = 0x8b0000;
    const darkBrown = 0x2a1510;
    const accent = 0xcc4422;

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), stdMat(darkRed, 0.7, 0.2));
    torso.position.y = 0.75;
    torso.castShadow = true;
    g.add(torso);

    // Shoulder pads
    for (const s of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), stdMat(darkRed, 0.65, 0.25));
      pad.position.set(s * 0.36, 1.12, 0);
      g.add(pad);
    }

    // Helmet with horns
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 8), metalMat(darkBrown, 0.5, 0.6));
    helm.position.y = 1.42;
    g.add(helm);
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), stdMat(darkBrown, 0.7));
      horn.position.set(s * 0.14, 1.58, 0);
      horn.rotation.z = s * 0.35;
      g.add(horn);
    }

    // Face (visor slit)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.02), stdMat(0x0a0505, 1));
    visor.position.set(0, 1.44, 0.22);
    g.add(visor);

    // Legs
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), stdMat(darkRed, 0.75));
      leg.position.set(s * 0.14, 0.24, 0);
      leg.castShadow = true;
      g.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.26), stdMat(darkBrown, 0.8));
      boot.position.set(s * 0.14, 0.0, 0.02);
      g.add(boot);
    }

    // Axe: handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), stdMat(0x3a2a1a, 0.8));
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.28, 0.95, 0.18);
    g.add(handle);
    // Axe: blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.25), metalMat(accent, 0.4, 0.7));
    blade.position.set(0.28, 0.95, 0.58);
    g.add(blade);
    parts.axeBlade = blade;

    parts.glowColor = accent;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'W' || key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, killEntity, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('magic');
      hero.berserkerCallActive = true;
      hero.berserkerCallTimer = 2;
      hero.bonusArmorTemp = (hero.bonusArmorTemp || 0) + 30;
      const enemies = getEnemiesOf(hero.team);
      const radius = 6;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz > radius * radius) continue;
        e.tauntTarget = hero;
        e.tauntTimer = 2;
        spawnParticles(e.x, e.z, 0xcc4422, 3);
      }
      spawnParticles(hero.x, hero.z, 0xcc4422, 8);
      floatDamage(hero.x, hero.z, 'BERSERKER CALL!', '#cc4422');
    }
    if (key === 'W') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 5));
      if (!target || !target.alive) return;
      playSound('magic');
      const dmgPerTick = [12, 18, 24, 30][lvl - 1] || 12;
      spawnSpellProjectile(hero.x, hero.z, target, 0xcc4422, 18, (t) => {
        if (!t.alive) return;
        t.battleHunger = { dmg: dmgPerTick, duration: 10, slow: 0.3 };
        t.slowTimer = Math.max(t.slowTimer || 0, 2);
        floatDamage(t.x, t.z, 'BATTLE HUNGER', '#cc4422');
      });
      floatDamage(hero.x, hero.z, 'BATTLE HUNGER', '#cc4422');
    }
    if (key === 'E') {
      floatDamage(hero.x, hero.z, 'COUNTER HELIX', '#888');
      playSound('hit');
    }
    if (key === 'R') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 4));
      if (!target || !target.alive) return;
      playSound('hit');
      const executeDmg = (target.hp !== undefined && target.hp <= 100) ? 350 : [250, 350, 450][lvl - 1] || 250;
      applyDamage(target, executeDmg, 'magic');
      if (target.hp !== undefined && target.hp <= 0) killEntity && killEntity(target);
      spawnParticles(target.x, target.z, 0xcc4422, 10);
      floatDamage(target.x, target.z, 'CULLING BLADE!', '#cc4422');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, findEnemyNear, floatDamage, spawnParticles } = ctx;
    const near = findEnemyNear(hero.x, hero.z, 6);
    if (near && hero.mp >= 80) {
      this.castSkill(hero, 'Q', 1, null, null, ctx);
      return;
    }
    if (target && hero.mp >= 120 && target.hp <= 150) {
      this.castSkill(hero, 'R', 1, null, target, ctx);
      return;
    }
    if (target && hero.mp >= 75) {
      this.castSkill(hero, 'W', 1, null, target, ctx);
      return;
    }
    if (target) {
      ctx.applyDamage(target, 50, 'magic');
      ctx.spawnParticles(target.x, target.z, 0xcc4422, 3);
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#5a0a0a';
    ctx2d.fillRect(20, 35, 96, 58);
    ctx2d.fillStyle = '#8B0000';
    ctx2d.fillRect(28, 42, 80, 44);
    ctx2d.fillStyle = '#2a1510';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#cc4422';
    ctx2d.fillRect(58, 24, 20, 10);
    ctx2d.fillStyle = '#cc4422';
    ctx2d.fillRect(98, 30, 12, 50);
    ctx2d.fillRect(94, 48, 20, 8);
  },
};
