// ─── TIDEHUNTER ──────────────────────────────────────────────────────────────
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'tidehunter',
  def: {
    name: 'TIDEHUNTER',
    color: 0x2d5a4a,
    headColor: 0x88ccaa,
    team: 'scourge',
    hp: 660,
    mp: 234,
    move: 7.5,
    range: 2.5,
    dmgMin: 50,
    dmgMax: 56,
    armor: 3,
    atkSpd: 0.9,
    skills: ['Gush', 'Kraken Shell', 'Anchor Smash', 'Ravage'],
  },
  skillCosts: { Q: [120, 120, 120, 120], W: [0, 0, 0, 0], E: [0, 0, 0, 0], R: [150, 150, 150] },
  skillCDs: { Q: [12, 12, 12, 12], W: 0, E: 0, R: [150, 150, 150] },
  skillNames: { Q: 'GUSH', W: 'KRAKEN SHELL', E: 'ANCHOR SMASH', R: 'RAVAGE' },
  skillTypes: { W: 'passive', E: 'passive' },
  aiBuild: ['boots_of_speed', 'vitality_gem', 'ring_of_protection', 'power_boots'],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const teal = 0x2d5a4a;
    const dark = 0x1a3a2e;
    const accent = 0x88ccaa;

    // Rounded body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.65, 10), stdMat(teal, 0.8));
    body.position.y = 0.75;
    body.castShadow = true;
    g.add(body);

    // Shell back
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), stdMat(dark, 0.75));
    shell.position.set(0, 0.78, -0.2);
    g.add(shell);

    // Head (fish-like)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), stdMat(teal, 0.78));
    head.scale.set(1, 1, 1.1);
    head.position.y = 1.28;
    head.castShadow = true;
    g.add(head);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), stdMat(0x1a2a22, 1));
    mouth.position.set(0, 1.22, 0.22);
    g.add(mouth);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowMat(accent, 1.2));
      eye.position.set(s * 0.1, 1.34, 0.16);
      g.add(eye);
    }

    // Legs / webbed feet
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.38, 8), stdMat(teal, 0.82));
      leg.position.set(s * 0.16, 0.28, 0.04);
      leg.castShadow = true;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.28), stdMat(dark, 0.85));
      foot.position.set(s * 0.16, 0.04, 0.08);
      g.add(foot);
    }

    // Anchor: shaft + head
    const anchorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), metalMat(0x555555, 0.5, 0.6));
    anchorShaft.rotation.x = Math.PI / 2;
    anchorShaft.position.set(0.28, 0.7, 0.18);
    g.add(anchorShaft);
    const anchorHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.1), metalMat(0x666666, 0.45, 0.65));
    anchorHead.position.set(0.52, 0.7, 0.18);
    g.add(anchorHead);
    parts.anchor = anchorHead;

    parts.glowColor = accent;
    parts.type = this.id;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      playSound('magic');
      const target = targetEntity || (targetPos && findEnemyNear(targetPos.x, targetPos.z, 8));
      if (!target || !target.alive) return;
      const dmg = [110, 180, 250, 320][lvl - 1] || 110;
      const slow = [0.4, 0.4, 0.4, 0.5][lvl - 1] || 0.4;
      spawnSpellProjectile(hero.x, hero.z, target, 0x88ccaa, 20, (t) => {
        if (!t.alive) return;
        applyDamage(t, dmg, 'magic');
        t.slowTimer = Math.max(t.slowTimer || 0, 4);
        t.slowPercent = (t.slowPercent || 0) < slow ? slow : t.slowPercent;
        spawnParticles(t.x, t.z, 0x88ccaa, 6);
        floatDamage(t.x, t.z, 'GUSH!', '#88ccaa');
      });
      floatDamage(hero.x, hero.z, 'GUSH', '#88ccaa');
    }
    if (key === 'W') {
      floatDamage(hero.x, hero.z, 'KRAKEN SHELL', '#666');
      playSound('magic');
    }
    if (key === 'E') {
      floatDamage(hero.x, hero.z, 'ANCHOR SMASH', '#888');
      playSound('hit');
    }
    if (key === 'R') {
      playSound('magic');
      const radius = 10;
      const dmg = [200, 325, 450][lvl - 1] || 200;
      const stunDur = [2.5, 2.5, 2.5][lvl - 1] || 2.5;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz > radius * radius) continue;
        applyDamage(e, dmg, 'magic');
        e.stunTimer = Math.max(e.stunTimer || 0, stunDur);
        spawnParticles(e.x, e.z, 0x88ccaa, 5);
      }
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.5, radius + 0.5, 32), new THREE.MeshBasicMaterial({ color: 0x88ccaa, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(hero.x, 0.02, hero.z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 0.5, maxLife: 0.5, type: 'ring' });
      floatDamage(hero.x, hero.z, 'RAVAGE!', '#88ccaa');
      if (showAnnouncer) showAnnouncer('🌊 RAVAGE!', '#88ccaa', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    const { getEnemiesOf } = ctx;
    const enemies = getEnemiesOf(hero.team);
    const inRange = enemies.filter(e => e.alive && (e.x - hero.x) ** 2 + (e.z - hero.z) ** 2 <= 100);
    if (inRange.length >= 2 && hero.mp >= 150) {
      this.castSkill(hero, 'R', 1, null, null, ctx);
      return;
    }
    if (target && hero.mp >= 120) {
      this.castSkill(hero, 'Q', 1, null, target, ctx);
      return;
    }
    if (target) {
      ctx.applyDamage(target, 55, 'magic');
      ctx.spawnParticles(target.x, target.z, 0x88ccaa, 3);
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#0f2520';
    ctx2d.fillRect(20, 34, 96, 58);
    ctx2d.fillStyle = '#2d5a4a';
    ctx2d.fillRect(28, 44, 80, 42);
    ctx2d.fillStyle = '#1a3a2e';
    ctx2d.beginPath();
    ctx2d.ellipse(68, 72, 38, 18, 0, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#88ccaa';
    ctx2d.beginPath();
    ctx2d.arc(68, 30, 22, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#5a9a7a';
    ctx2d.beginPath();
    ctx2d.arc(60, 26, 4, 0, Math.PI * 2);
    ctx2d.arc(76, 26, 4, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#668877';
    ctx2d.fillRect(98, 50, 10, 42);
    ctx2d.fillRect(94, 62, 18, 10);
  },
};
