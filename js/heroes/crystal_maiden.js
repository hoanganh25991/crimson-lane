// ─── CRYSTAL MAIDEN ───────────────────────────────────────────────────────────
// Robed caster, staff with crystal, ice theme. Int, Sentinel, Support
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'crystal_maiden',
  def: {
    name: 'CRYSTAL MAIDEN',
    color: 0x4488aa,
    headColor: 0xaaddff,
    team: 'sentinel',
    hp: 454,
    mp: 403,
    move: 7,
    range: 12,
    dmgMin: 43,
    dmgMax: 49,
    armor: 1,
    atkSpd: 0.85,
    skills: ['Crystal Nova', 'Frostbite', 'Arcane Aura', 'Freezing Field'],
  },
  skillCosts: { Q: [130, 130, 130, 130], W: [115, 115, 115, 115], E: [0, 0, 0, 0], R: [200, 200, 200, 200] },
  skillCDs: { Q: [12, 12, 12, 12], W: [10, 10, 10, 10], E: [0, 0, 0, 0], R: [90, 90, 90, 90] },
  skillNames: { Q: 'CRYSTAL NOVA', W: 'FROSTBITE', E: 'ARCANE AURA', R: 'FREEZING FIELD' },
  skillTypes: { E: 'passive' },
  aiBuild: ['boots_of_speed', 'magic_charm', 'void_staff', 'vitality_gem'],

  buildModel() {
    const g = new THREE.Group();
    const blue = 0x2266aa;
    const robe = 0x4488aa;
    const accent = 0xaaddff;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.9, 10), stdMat(robe));
    body.position.y = 0.55;
    g.add(body);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.35, 10), stdMat(blue));
    skirt.position.y = 0.2;
    g.add(skirt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), stdMat(0xddccbb));
    head.position.y = 1.08;
    g.add(head);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat(robe));
    hood.position.y = 1.15;
    g.add(hood);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), stdMat(0x554433));
    staff.position.set(0.22, 0.6, 0.15);
    staff.rotation.z = -0.1;
    g.add(staff);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), glowMat(accent));
    crystal.position.set(0.26, 1.08, 0.2);
    g.add(crystal);
    const parts = {};
    parts.type = this.id;
    parts.glowColor = accent;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q' || key === 'W';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      playSound('frost');
      const x = targetPos?.x ?? hero.x, z = targetPos?.z ?? hero.z;
      const dmg = 100 + 50 * lvl;
      const radius = 5;
      const slowDur = 3 + 0.5 * lvl;
      const ringGeo = new THREE.RingGeometry(0, radius, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.05, z);
      scene.add(ring);
      G.effects.push({ mesh: ring, life: 0.5, maxLife: 0.5, type: 'ring', scale: 1 });
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - x, dz = e.z - z;
        if (Math.sqrt(dx * dx + dz * dz) <= radius) {
          applyDamage(e, dmg, 'magic');
          e.slowTimer = slowDur;
          spawnParticles(e.x, e.z, 0xaaddff, 3);
        }
      }
      spawnParticles(x, z, 0xaaddff, 8);
    } else if (key === 'W') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 12);
      if (!target || !target.alive) return;
      playSound('frost');
      const dmg = 30 + 25 * lvl;
      const rootDur = 1.5 + 0.5 * lvl;
      applyDamage(target, dmg, 'magic');
      target.stunTimer = rootDur;
      target.slowTimer = rootDur;
      spawnParticles(target.x, target.z, 0xaaddff, 6);
      floatDamage(target.x, target.z, 'ROOT', '#aaddff');
      const iceRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.5, 16), new THREE.MeshBasicMaterial({ color: 0xaaddff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
      iceRing.rotation.x = -Math.PI / 2;
      iceRing.position.set(target.x, 0.08, target.z);
      scene.add(iceRing);
      G.effects.push({ mesh: iceRing, life: rootDur, maxLife: rootDur, type: 'ring' });
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'ARCANE AURA', '#aaddff');
      playSound('magic');
    } else if (key === 'R') {
      playSound('frost');
      hero.freezingField = true;
      hero.freezingFieldTimer = 4;
      hero.freezingFieldRadius = 6;
      hero.freezingFieldDmg = 40 + 20 * lvl;
      spawnParticles(hero.x, hero.z, 0xaaddff, 12);
      floatDamage(hero.x, hero.z, 'FREEZING FIELD', '#aaddff');
      const ringR = new THREE.Mesh(new THREE.RingGeometry(4, 6.5, 32), new THREE.MeshBasicMaterial({ color: 0xaaddff, side: THREE.DoubleSide, transparent: true, opacity: 0.25 }));
      ringR.rotation.x = -Math.PI / 2;
      ringR.position.set(hero.x, 0.04, hero.z);
      scene.add(ringR);
      G.effects.push({ mesh: ringR, life: 4, maxLife: 4, type: 'freezing_field', heroRef: hero });
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    applyDamage(target, 150, 'magic');
    target.stunTimer = 2;
    target.slowTimer = 2;
    spawnParticles(target.x, target.z, 0xaaddff, 6);
    playSound('frost');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#2266aa';
    ctx2d.fillRect(0, 0, 136, 100);
    ctx2d.fillStyle = '#4488aa';
    ctx2d.beginPath();
    ctx2d.ellipse(68, 58, 36, 42, 0, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#2266aa';
    ctx2d.beginPath();
    ctx2d.ellipse(68, 32, 28, 28, 0, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#ddccbb';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#4488aa';
    ctx2d.beginPath();
    ctx2d.arc(68, 22, 12, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#554433';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(88, 28);
    ctx2d.lineTo(88, 88);
    ctx2d.stroke();
    ctx2d.fillStyle = '#aaddff';
    ctx2d.beginPath();
    ctx2d.moveTo(84, 18);
    ctx2d.lineTo(92, 18);
    ctx2d.lineTo(88, 8);
    ctx2d.closePath();
    ctx2d.fill();
  },
};
