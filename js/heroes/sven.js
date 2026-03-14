// ─── SVEN ────────────────────────────────────────────────────────────────────
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'sven',
  def: {
    name: 'SVEN',
    color: 0x2244aa,
    headColor: 0xaaccff,
    team: 'sentinel',
    hp: 620,
    mp: 195,
    move: 8,
    range: 2.5,
    dmgMin: 54,
    dmgMax: 56,
    armor: 3,
    atkSpd: 0.9,
    skills: ['Storm Hammer', 'Great Cleave', 'Warcry', "God's Strength"],
  },
  skillCosts: { Q: [140, 140, 140, 140], W: [0, 0, 0, 0], E: [25, 25, 25, 25], R: [100, 100, 100] },
  skillCDs: { Q: [15, 15, 15, 15], W: 0, E: [36, 36, 36, 36], R: [80, 80, 80] },
  skillNames: { Q: 'STORM HAMMER', W: 'GREAT CLEAVE', E: 'WARCRY', R: "GOD'S STRENGTH" },
  skillTypes: { W: 'passive' },
  aiBuild: ['boots_of_speed', 'blades_of_attack', 'vitality_gem', 'power_boots'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const blue = 0x2244aa;
    const silver = 0xaaccff;
    const midBlue = 0x6688cc;

    // Torso (armored)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.3), metalMat(blue, 0.4, 0.65));
    torso.position.y = 0.78;
    torso.castShadow = true;
    g.add(torso);

    // Pauldrons
    for (const s of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.24), metalMat(midBlue, 0.35, 0.7));
      pad.position.set(s * 0.34, 1.12, 0);
      g.add(pad);
    }

    // Helmet
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.26, 8), metalMat(blue, 0.4, 0.65));
    helm.position.y = 1.38;
    g.add(helm);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), stdMat(0x0a0a1a, 1));
    visor.position.set(0, 1.4, 0.2);
    g.add(visor);

    // Legs & boots
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.16), metalMat(midBlue, 0.45, 0.6));
      leg.position.set(s * 0.13, 0.26, 0);
      leg.castShadow = true;
      g.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.24), stdMat(0x0a1a55, 0.8));
      boot.position.set(s * 0.13, 0.0, 0.02);
      g.add(boot);
    }

    // Greatsword
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.04), metalMat(silver, 0.2, 0.9));
    blade.position.set(0.26, 0.5, 0.2);
    g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.06), metalMat(0x8888aa, 0.3, 0.8));
    guard.position.set(0.26, 0.88, 0.2);
    g.add(guard);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), stdMat(0x2a2a3a, 0.9));
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.26, 0.98, 0.2);
    g.add(handle);
    parts.sword = blade;

    // Cape
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.06), stdMat(0x1a2a55, 0.85));
    cape.position.set(0, 0.72, -0.2);
    g.add(cape);
    parts.cape = cape;

    parts.glowColor = 0xffcc00;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      playSound('hit');
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 8));
      if (!target || !target.alive) return;
      const dmg = [100, 175, 250, 325][lvl - 1] || 100;
      const stunDur = [2, 2, 2, 2.5][lvl - 1] || 2;
      spawnSpellProjectile(hero.x, hero.z, target, 0xffcc44, 24, (t) => {
        if (!t.alive) return;
        applyDamage(t, dmg, 'magic');
        t.stunTimer = stunDur;
        spawnParticles(t.x, t.z, 0xffcc44, 6);
        floatDamage(t.x, t.z, 'STUNNED!', '#ffcc44');
      });
      floatDamage(hero.x, hero.z, 'STORM HAMMER!', '#ffcc44');
    }
    if (key === 'W') {
      floatDamage(hero.x, hero.z, 'GREAT CLEAVE', '#888');
      playSound('hit');
    }
    if (key === 'E') {
      playSound('magic');
      hero.warcryActive = true;
      hero.warcryTimer = 6;
      hero.bonusArmorTemp = (hero.bonusArmorTemp || 0) + 5;
      spawnParticles(hero.x, hero.z, 0xffcc44, 8);
      floatDamage(hero.x, hero.z, 'WARCRY!', '#ffcc44');
    }
    if (key === 'R') {
      playSound('levelup');
      hero.godsStrengthActive = true;
      hero.godsStrengthTimer = 25;
      hero.bonusDmgPercent = (hero.bonusDmgPercent || 0) + 100;
      spawnParticles(hero.x, hero.z, 0xffcc00, 12);
      floatDamage(hero.x, hero.z, "GOD'S STRENGTH!", '#ffcc00');
      if (showAnnouncer) showAnnouncer("⚡ GOD'S STRENGTH!", '#ffcc00', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    if (target && hero.mp >= 140) {
      this.castSkill(hero, 'Q', 1, null, target, ctx);
      return;
    }
    if (hero.mp >= 25 && !hero.warcryActive) {
      this.castSkill(hero, 'E', 1, null, null, ctx);
      return;
    }
    if (target) {
      ctx.applyDamage(target, 55, 'magic');
      ctx.spawnParticles(target.x, target.z, 0xffcc44, 3);
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#0a1530';
    ctx2d.fillRect(22, 32, 92, 60);
    ctx2d.fillStyle = '#2244aa';
    ctx2d.fillRect(28, 42, 80, 48);
    ctx2d.fillStyle = '#6688cc';
    ctx2d.fillRect(32, 46, 72, 36);
    ctx2d.fillStyle = '#aaccff';
    ctx2d.beginPath();
    ctx2d.arc(68, 26, 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#1a2a55';
    ctx2d.fillRect(54, 22, 28, 10);
    ctx2d.fillStyle = '#ccddff';
    ctx2d.fillRect(100, 24, 6, 56);
    ctx2d.fillStyle = '#ffcc00';
    ctx2d.fillRect(96, 42, 14, 8);
  },
};
