// ─── VENGEFUL SPIRIT ──────────────────────────────────────────────────────────
// Winged archer, glowing, dark purple. Agi, Scourge, Support/Stun
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'vengeful_spirit',
  def: {
    name: 'VENGEFUL SPIRIT',
    color: 0xaa88cc,
    headColor: 0xccaaee,
    team: 'scourge',
    hp: 530,
    mp: 234,
    move: 8,
    range: 12,
    dmgMin: 42,
    dmgMax: 48,
    armor: 2,
    atkSpd: 0.95,
    skills: ['Magic Missile', 'Wave of Terror', 'Vengeance Aura', 'Nether Swap'],
  },
  skillCosts: { Q: [110, 110, 110, 110], W: [40, 40, 40, 40], E: [0, 0, 0, 0], R: [100, 100, 100, 100] },
  skillCDs: { Q: [13, 13, 13, 13], W: [15, 15, 15, 15], E: [0, 0, 0, 0], R: [45, 45, 45, 45] },
  skillNames: { Q: 'MAGIC MISSILE', W: 'WAVE OF TERROR', E: 'VENGEANCE AURA', R: 'NETHER SWAP' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'vitality_gem'],

  buildModel() {
    const g = new THREE.Group();
    const dark = 0x2a1a3a;
    const purple = 0x4a2a5a;
    const accent = 0xaa88cc;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.2), stdMat(purple));
    torso.position.y = 0.5;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), stdMat(0xbb99bb));
    head.position.y = 1.02;
    g.add(head);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), stdMat(0xddcc44));
    crown.position.y = 1.22;
    g.add(crown);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.7), stdMat(dark));
    wingL.position.set(-0.28, 0.7, 0);
    wingL.rotation.z = 0.2;
    g.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.7), stdMat(dark));
    wingR.position.set(0.28, 0.7, 0);
    wingR.rotation.z = -0.2;
    g.add(wingR);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.08), stdMat(0x664433));
    bow.position.set(0.2, 0.55, 0.25);
    bow.rotation.z = -0.15;
    g.add(bow);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat(accent));
    orb.position.set(0.24, 0.58, 0.32);
    g.add(orb);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.1), stdMat(purple));
    legL.position.set(-0.08, 0.21, 0);
    g.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.1), stdMat(purple));
    legR.position.set(0.08, 0.21, 0);
    g.add(legR);
    const parts = {};
    parts.type = this.id;
    parts.glowColor = accent;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 14);
      if (!target || !target.alive) return;
      const dmg = 80 + 35 * lvl;
      const stunDur = 1 + 0.25 * lvl;
      applyDamage(target, dmg, 'magic');
      target.stunTimer = stunDur;
      spawnParticles(target.x, target.z, 0xaa88cc, 6);
      floatDamage(target.x, target.z, 'STUN', '#aa88cc');
      playSound('magic');
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xaa88cc }));
      bolt.position.set(target.x, 0.8, target.z);
      scene.add(bolt);
      G.effects.push({ mesh: bolt, life: 0.3, maxLife: 0.3, type: 'ring' });
    } else if (key === 'W') {
      playSound('magic');
      const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
      const dmg = 25 + 20 * lvl;
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 8 || dist < 0.1) continue;
        const dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;
        if (dot < 0.5) continue;
        applyDamage(e, dmg, 'magic');
        e.armorDebuff = (e.armorDebuff || 0) + 2;
        spawnParticles(e.x, e.z, 0xaa88cc, 3);
      }
      const coneGeo = new THREE.ConeGeometry(2, 8, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0x8844aa, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.set(Math.PI / 2, 0, -hero.group.rotation.y);
      cone.position.set(hero.x + fwdX * 4, 0.5, hero.z + fwdZ * 4);
      scene.add(cone);
      G.effects.push({ mesh: cone, life: 0.4, maxLife: 0.4, type: 'ring' });
      floatDamage(hero.x, hero.z, 'WAVE', '#aa88cc');
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'VENGEANCE AURA', '#aa88cc');
      playSound('magic');
    } else if (key === 'R') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 12);
      if (!target || !target.alive) return;
      const hx = hero.x, hz = hero.z;
      hero.x = target.x;
      hero.z = target.z;
      if (hero.group) {
        hero.group.position.x = hero.x;
        hero.group.position.z = hero.z;
      }
      target.x = hx;
      target.z = hz;
      if (target.group) {
        target.group.position.x = target.x;
        target.group.position.z = target.z;
      }
      spawnParticles(hero.x, hero.z, 0xaa88cc, 8);
      spawnParticles(target.x, target.z, 0xaa88cc, 8);
      floatDamage(hero.x, hero.z, 'SWAP', '#aa88cc');
      playSound('magic');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    applyDamage(target, 120, 'magic');
    target.stunTimer = 1.5;
    spawnParticles(target.x, target.z, 0xaa88cc, 6);
    playSound('magic');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#2a1a3a';
    ctx2d.fillRect(0, 0, 136, 100);
    ctx2d.fillStyle = '#4a2a5a';
    ctx2d.fillRect(44, 38, 48, 50);
    ctx2d.fillStyle = '#bb99bb';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 18, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#ddcc44';
    ctx2d.beginPath();
    ctx2d.moveTo(68, 12);
    ctx2d.lineTo(64, 22);
    ctx2d.lineTo(72, 22);
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.fillStyle = '#2a1a3a';
    ctx2d.fillRect(24, 48, 16, 44);
    ctx2d.fillRect(96, 48, 16, 44);
    ctx2d.strokeStyle = '#aa88cc';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.arc(90, 52, 8, 0, Math.PI * 2);
    ctx2d.stroke();
    ctx2d.fillStyle = '#aa88cc';
    ctx2d.beginPath();
    ctx2d.arc(90, 52, 4, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
