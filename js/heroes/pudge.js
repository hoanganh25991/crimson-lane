// ─── PUDGE ────────────────────────────────────────────────────────────────────
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'pudge',
  def: {
    name: 'PUDGE',
    color: 0x3d4a3d,
    headColor: 0x88aa88,
    team: 'scourge',
    hp: 700,
    mp: 280,
    move: 7.5,
    range: 2.5,
    dmgMin: 45,
    dmgMax: 51,
    armor: 2,
    atkSpd: 0.85,
    skills: ['Meat Hook', 'Rot', 'Flesh Heap', 'Dismember'],
  },
  skillCosts: { Q: [110, 110, 110, 110], W: 0, E: [0, 0, 0, 0], R: [100, 100, 100] },
  skillCDs: { Q: [14, 14, 14, 14], W: 0, E: 0, R: [30, 30, 30] },
  skillNames: { Q: 'MEAT HOOK', W: 'ROT', E: 'FLESH HEAP', R: 'DISMEMBER' },
  skillTypes: { W: 'toggle', E: 'passive' },
  aiBuild: ['boots_of_speed', 'vitality_gem', 'ring_of_protection', 'power_boots'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const green = 0x3d4a3d;
    const dark = 0x1a2a1a;
    const accent = 0x88aa88;

    // Rounded torso (belly)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.7, 10), stdMat(green, 0.85));
    torso.position.y = 0.82;
    torso.castShadow = true;
    g.add(torso);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), stdMat(0x354535, 0.88));
    belly.position.set(0.05, 0.88, 0.12);
    belly.scale.set(1, 0.9, 0.8);
    g.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), stdMat(green, 0.8));
    head.position.y = 1.32;
    head.castShadow = true;
    g.add(head);
    // Eyes
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), glowMat(accent, 1.5));
      eye.position.set(s * 0.08, 1.36, 0.2);
      g.add(eye);
    }

    // Legs (stumpy)
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.4, 8), stdMat(dark, 0.85));
      leg.position.set(s * 0.18, 0.32, 0.02);
      leg.castShadow = true;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.22), stdMat(dark, 0.9));
      foot.position.set(s * 0.18, 0.06, 0.04);
      g.add(foot);
    }

    // Meat hook: chain + hook
    const hookArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 6), stdMat(dark, 0.8));
    hookArm.rotation.z = -0.4;
    hookArm.position.set(0.3, 1.0, 0.15);
    g.add(hookArm);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.08), metalMat(0x555555, 0.5, 0.6));
    hook.rotation.z = -0.3;
    hook.position.set(0.42, 0.82, 0.18);
    g.add(hook);
    parts.hook = hook;

    parts.glowColor = accent;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'R';
  },

  getToggleState(hero, key) {
    if (key === 'W') return !!hero.rotActive;
    return false;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('hit');
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 14));
      if (!target || !target.alive) return;
      const dmg = [90, 180, 270, 360][lvl - 1] || 90;
      spawnSpellProjectile(hero.x, hero.z, target, 0x88aa88, 20, (t) => {
        if (!t.alive) return;
        applyDamage(t, dmg, 'magic');
        t.stunTimer = Math.max(t.stunTimer || 0, 0.5);
        t.x = hero.x + (t.x - hero.x) * 0.3;
        t.z = hero.z + (t.z - hero.z) * 0.3;
        if (t.group) t.group.position.set(t.x, t.group.position.y, t.z);
        spawnParticles(t.x, t.z, 0x88aa88, 6);
        floatDamage(t.x, t.z, 'HOOKED!', '#88aa88');
      });
      floatDamage(hero.x, hero.z, 'MEAT HOOK', '#88aa88');
    }
    if (key === 'W') {
      hero.rotActive = !hero.rotActive;
      floatDamage(hero.x, hero.z, hero.rotActive ? 'ROT ON' : 'ROT OFF', '#88aa88');
      playSound('magic');
    }
    if (key === 'E') {
      floatDamage(hero.x, hero.z, 'FLESH HEAP', '#666');
      playSound('magic');
    }
    if (key === 'R') {
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 3));
      if (!target || !target.alive) return;
      playSound('magic');
      target.stunTimer = Math.max(target.stunTimer || 0, [1, 2, 3][lvl - 1] || 1);
      const dmgPerSec = [60, 90, 120][lvl - 1] || 60;
      target.dismember = { dmgPerSec, duration: 3, elapsed: 0 };
      spawnParticles(target.x, target.z, 0x88aa88, 8);
      floatDamage(target.x, target.z, 'DISMEMBER!', '#88aa88');
    }
  },

  castAISkill(hero, target, ctx) {
    if (target && hero.mp >= 110) {
      this.castSkill(hero, 'Q', 1, null, target, ctx);
      return;
    }
    if (target && hero.mp >= 100) {
      this.castSkill(hero, 'R', 1, null, target, ctx);
      return;
    }
    if (target) {
      ctx.applyDamage(target, 60, 'magic');
      ctx.spawnParticles(target.x, target.z, 0x88aa88, 3);
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#1a2a1a';
    ctx2d.fillRect(18, 30, 100, 64);
    ctx2d.fillStyle = '#3d4a3d';
    ctx2d.beginPath();
    ctx2d.ellipse(68, 62, 42, 28, 0, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#2a352a';
    ctx2d.fillRect(32, 48, 72, 44);
    ctx2d.fillStyle = '#88aa88';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 22, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#556655';
    ctx2d.beginPath();
    ctx2d.arc(60, 28, 4, 0, Math.PI * 2);
    ctx2d.arc(76, 28, 4, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#666';
    ctx2d.fillRect(100, 48, 14, 8);
  },
};
