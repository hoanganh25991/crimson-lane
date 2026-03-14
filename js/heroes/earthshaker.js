// ─── EARTHSHAKER ──────────────────────────────────────────────────────────────
// Spec: docs/heroes.md §10 — Str, Sentinel, Initiator

import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'earthshaker',
  def: {
    name: 'Earthshaker',
    color: 0x4a3728,
    headColor: 0x8b6914,
    team: 'sentinel',
    hp: 610,
    mp: 291,
    move: 7.5,
    range: 2.5,
    dmgMin: 50,
    dmgMax: 56,
    armor: 3,
    atkSpd: 0.9,
    skills: ['Fissure', 'Enchant Totem', 'Aftershock', 'Echo Slam'],
  },
  skillCosts: { Q: [125, 125, 125, 125], W: [20, 20, 20, 20], E: [0, 0, 0, 0], R: [145, 145, 145] },
  skillCDs: { Q: [15, 15, 15, 15], W: [6, 6, 6, 6], E: [0, 0, 0, 0], R: [150, 150, 150] },
  skillNames: { Q: 'Fissure', W: 'Enchant Totem', E: 'Aftershock', R: 'Echo Slam' },
  skillTypes: { E: 'passive' },
  aiBuild: [],

  buildModel() {
    const g = new THREE.Group();
    const parts = {};
    const brown = 0x4a3728;
    const totem = 0x8b6914;
    const dark = 0x2a1810;

    // Torso — tall
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.65, 8), stdMat(brown, 0.85));
    torso.position.y = 0.72;
    torso.castShadow = true;
    g.add(torso);
    // Tribal armor bands
    for (let i = 0; i < 2; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 8), stdMat(totem, 0.75));
      band.position.y = 0.6 + i * 0.2;
      g.add(band);
    }
    // Legs
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.4, 6), stdMat(dark, 0.9));
      leg.position.set(s * 0.1, 0.18, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), stdMat(0x6b5344, 0.8));
    head.position.y = 1.12;
    g.add(head);
    // Horns
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), stdMat(dark, 0.85));
      horn.position.set(s * 0.14, 1.28, -0.06);
      horn.rotation.z = s * 0.4;
      g.add(horn);
    }
    // Totem (tall cylinder + glow)
    const totemCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6), stdMat(totem, 0.7));
    totemCyl.position.set(0.28, 0.5, 0.08);
    totemCyl.rotation.z = -0.15;
    totemCyl.castShadow = true;
    g.add(totemCyl);
    parts.totem = totemCyl;
    const totemCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 6), metalMat(0x5a4a20, 0.5, 0.6));
    totemCap.position.set(0.3, 1.02, 0.08);
    totemCap.rotation.z = -0.15;
    g.add(totemCap);
    // Arm holding totem
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), stdMat(brown, 0.85));
    arm.position.set(0.2, 0.88, 0.12);
    arm.rotation.z = -0.2;
    g.add(arm);

    parts.type = this.id;
    parts.glowColor = 0x8b6914;
    return { group: g, parts };
  },

  needsTarget(key) {
    return key === 'Q';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      if (!targetPos) return;
      playSound('hit');
      const dmg = 80 + 40 * lvl;
      const radius = 4;
      const length = 8;
      const enemies = getEnemiesOf(hero.team);
      const fwdX = Math.sin(hero.group.rotation.y);
      const fwdZ = Math.cos(hero.group.rotation.y);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - targetPos.x, dz = e.z - targetPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius) {
          const dot = (dx / (dist || 1)) * fwdX + (dz / (dist || 1)) * fwdZ;
          if (Math.abs(dot) < 0.95 || dist < length) {
            applyDamage(e, dmg, 'magic');
            e.stunTimer = 1 + 0.25 * lvl;
            spawnParticles(e.x, e.z, 0x8b6914, 4);
          }
        }
      }
      const lineGeo = new THREE.PlaneGeometry(length, 1.5, 1, 1);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x6b5344, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = -hero.group.rotation.y;
      line.position.set(targetPos.x, 0.1, targetPos.z);
      scene.add(line);
      G.effects = G.effects || [];
      G.effects.push({ mesh: line, life: 0.5, maxLife: 0.5, type: 'ring' });
      floatDamage(targetPos.x, targetPos.z, 'FISSURE', '#8b6914');
    } else if (key === 'W') {
      hero.enchantTotemActive = true;
      hero.enchantTotemTimer = 8;
      floatDamage(hero.x, hero.z, 'ENCHANT TOTEM', '#8b6914');
      spawnParticles(hero.x, hero.z, 0x8b6914, 6);
      playSound('magic');
    } else if (key === 'E') {
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz <= 25) {
          e.slowTimer = 0.8;
          e.stunTimer = 0.3;
        }
      }
      spawnParticles(hero.x, hero.z, 0x6b5344, 5);
      playSound('hit');
    } else if (key === 'R') {
      playSound('hit');
      const enemies = getEnemiesOf(hero.team).filter(e => e.alive);
      const baseDmg = 100;
      const perUnit = 30;
      const dmg = baseDmg + enemies.length * perUnit;
      const radius = 7;
      for (const e of getEnemiesOf(hero.team)) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz <= radius * radius) {
          applyDamage(e, dmg, 'magic');
          e.stunTimer = 0.5;
          spawnParticles(e.x, e.z, 0x8b6914, 4);
        }
      }
      const ringGeo = new THREE.RingGeometry(0, radius, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b6914, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(hero.x, 0.05, hero.z);
      scene.add(ring);
      G.effects = G.effects || [];
      G.effects.push({ mesh: ring, life: 0.6, maxLife: 0.6, type: 'ring' });
      floatDamage(hero.x, hero.z, 'ECHO SLAM', '#8b6914');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, getEnemiesOf, spawnParticles, playSound } = ctx;
    const enemies = getEnemiesOf(hero.team).filter(e => e.alive);
    if (enemies.length >= 2) {
      const dmg = 100 + enemies.length * 30;
      const radius = 7;
      for (const e of enemies) {
        const dx = e.x - hero.x, dz = e.z - hero.z;
        if (dx * dx + dz * dz <= radius * radius) {
          applyDamage(e, dmg, 'magic');
          e.stunTimer = 0.5;
          spawnParticles(e.x, e.z, 0x8b6914, 4);
        }
      }
      playSound('hit');
    } else if (target && target.alive) {
      applyDamage(target, 120, 'magic');
      target.stunTimer = 1.25;
      spawnParticles(target.x, target.z, 0x8b6914, 4);
      playSound('hit');
    }
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#4a3728';
    ctx2d.fillRect(40, 35, 56, 58);
    ctx2d.fillStyle = '#2a1810';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 18, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#8b6914';
    ctx2d.fillRect(88, 28, 12, 70);
    ctx2d.fillStyle = '#6b5344';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 6, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#8b6914';
    ctx2d.lineWidth = 2;
    ctx2d.strokeRect(42, 37, 52, 54);
  },
};
