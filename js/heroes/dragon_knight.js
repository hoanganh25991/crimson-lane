// ─── DRAGON KNIGHT ────────────────────────────────────────────────────────────
import { buildDragonKnight } from '../hero-models.js';

export default {
  id: 'dragon_knight',
  def: {
    name: 'DRAGON KNIGHT',
    color: 0xdd6622,
    headColor: 0xcc4400,
    team: 'sentinel',
    hp: 625,
    mp: 195,
    move: 8,
    range: 2.5,
    dmgMin: 53,
    dmgMax: 59,
    armor: 3,
    atkSpd: 0.75,
    skills: ['Dragon Blood', 'Dragon Tail', 'Breathe Fire', 'Elder Dragon Form'],
  },
  skillCosts: { Q: [0, 0, 0, 0], W: [100, 100, 100, 100], E: [100, 115, 115, 130], R: [0, 0, 0, 0] },
  skillCDs: { Q: 0, W: 9, E: 15, R: 100 },
  skillNames: { Q: 'DRGN BLOOD', W: 'DRGN TAIL', E: 'BREATHE', R: 'ELDER FORM' },
  aiBuild: ['boots_of_speed', 'vitality_gem', 'ring_of_protection', 'aura_shield', 'power_boots'],

  buildModel() {
    return buildDragonKnight();
  },

  needsTarget(key) {
    return false;
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      floatDamage(hero.x, hero.z, 'DRAGON BLOOD', '#ff6622');
      playSound('magic');
      return;
    }
    if (key === 'W') {
      playSound('hit');
      const target = targetEntity || findEnemyNear(hero.x, hero.z, 8);
      if (!target || !target.alive) return;
      const dmg = [25, 50, 75, 100][lvl - 1] || 25;
      const stunDur = [2, 2.25, 2.5, 2.5][lvl - 1] || 2;
      applyDamage(target, dmg, 'magic');
      target.stunTimer = stunDur;
      floatDamage(target.x, target.z, 'STUNNED!', '#ff8844');
      spawnParticles(target.x, target.z, 0xff6622, 6);
      const flash = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.6 }));
      flash.position.set(target.x, 1, target.z);
      scene.add(flash);
      G.effects.push({ mesh: flash, life: 0.3, maxLife: 0.3, type: 'ring' });
    }
    if (key === 'E') {
      playSound('fire');
      const dmg = [75, 150, 225, 300][lvl - 1] || 75;
      const fwdX = Math.sin(hero.group.rotation.y), fwdZ = Math.cos(hero.group.rotation.y);
      const enemies = getEnemiesOf(hero.team);
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - hero.x, dz = e.z - hero.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 9 || dist < 0.1) continue;
        const dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;
        if (dot < 0.42) continue;
        applyDamage(e, dmg, 'magic');
        spawnParticles(e.x, e.z, 0xff4400, 4);
      }
      const coneGeo = new THREE.ConeGeometry(3.5, 9, 10);
      const coneMesh = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xff6600, side: THREE.DoubleSide, transparent: true, opacity: 0.28 }));
      coneMesh.rotation.set(Math.PI / 2, 0, -hero.group.rotation.y);
      coneMesh.position.set(hero.x + fwdX * 4.5, 0.5, hero.z + fwdZ * 4.5);
      scene.add(coneMesh);
      G.effects.push({ mesh: coneMesh, life: 0.45, maxLife: 0.45, type: 'ring' });
      floatDamage(hero.x, hero.z, 'BREATHE FIRE!', '#ff6600');
    }
    if (key === 'R') {
      playSound('levelup');
      hero.dragonFormActive = true;
      hero.dragonFormTimer = 30;
      spawnParticles(hero.x, hero.z, 0xff8800, 12);
      floatDamage(hero.x, hero.z, 'DRAGON FORM!', '#ff8800');
      if (showAnnouncer) showAnnouncer('🐉 ELDER DRAGON FORM!', '#ff8800', 2000);
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnParticles, playSound } = ctx;
    applyDamage(target, 75, 'magic');
    target.stunTimer = 2;
    spawnParticles(target.x, target.z, 0xff6622, 5);
    playSound('hit');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#cc5511';
    ctx2d.fillRect(48, 38, 40, 44);
    ctx2d.fillStyle = '#ee7722';
    ctx2d.fillRect(52, 42, 32, 30);
    ctx2d.fillStyle = '#cc5511';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 18, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#cc5511';
    ctx2d.fillRect(52, 28, 32, 14);
    ctx2d.fillStyle = '#1a0800';
    ctx2d.fillRect(54, 30, 28, 8);
    ctx2d.fillStyle = '#dd7700';
    ctx2d.beginPath();
    ctx2d.moveTo(52, 22);
    ctx2d.lineTo(44, 10);
    ctx2d.lineTo(54, 22);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.moveTo(84, 22);
    ctx2d.lineTo(92, 10);
    ctx2d.lineTo(82, 22);
    ctx2d.fill();
    ctx2d.fillStyle = '#ccccdd';
    ctx2d.fillRect(94, 22, 8, 52);
    ctx2d.fillStyle = '#dd9900';
    ctx2d.fillRect(90, 44, 18, 6);
  },
};
