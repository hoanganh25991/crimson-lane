// ─── SNIPER ───────────────────────────────────────────────────────────────────
import { buildSniper } from '../hero-models.js';

export default {
  id: 'sniper',
  def: {
    name: 'SNIPER',
    color: 0x44aa44,
    headColor: 0xaacc88,
    team: 'sentinel',
    hp: 492,
    mp: 195,
    move: 8,
    range: 14,
    dmgMin: 35,
    dmgMax: 45,
    armor: 2,
    atkSpd: 1.1,
    skills: ['Shrapnel', 'Headshot', 'Aim', 'Assassinate'],
  },
  skillCosts: { Q: [120, 120, 120, 120], W: [0, 0, 0, 0], E: [0, 0, 0, 0], R: [200, 200, 200, 200] },
  skillCDs: { Q: 22, W: 0, E: 0, R: 20 },
  skillNames: { Q: 'SHRAPNEL', W: 'HEADSHOT', E: 'AIM', R: 'ASSASSINATE' },
  aiBuild: ['boots_of_speed', 'blades_of_attack', 'ring_of_protection', 'lifesteal_blade'],

  buildModel() {
    return buildSniper();
  },

  needsTarget(key) {
    return key === 'Q' || key === 'R';
  },

  castSkill(hero, key, lvl, targetPos, targetEntity, ctx) {
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound, showAnnouncer } = ctx;
    if (key === 'Q') {
      playSound('shrapnel');
      const radius = 7;
      const geo = new THREE.CircleGeometry(radius, 24);
      const mat = new THREE.MeshBasicMaterial({ color: 0xccaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
      const zone = new THREE.Mesh(geo, mat);
      zone.rotation.x = -Math.PI / 2;
      zone.position.set(targetPos.x, 0.03, targetPos.z);
      scene.add(zone);
      G.effects.push({ mesh: zone, life: 4, maxLife: 4, type: 'shrapnel', x: targetPos.x, z: targetPos.z, radius, dps: 15, tickTimer: 0.5, casterTeam: hero.team });
    } else if (key === 'W') {
      floatDamage(hero.x, hero.z, 'HEADSHOT', '#ffcc44');
    } else if (key === 'E') {
      floatDamage(hero.x, hero.z, 'AIM +RANGE', '#88ff88');
    } else if (key === 'R') {
      const target = targetEntity || findEnemyNear(targetPos.x, targetPos.z, 4);
      if (!target) return;
      hero.channeling = 1.7;
      hero.chanTarget = target;
      hero.assassinateTimer = 1.7;
      hero.assassinateTarget = target;
      playSound('assassinate_channel');
      const crossGeo = new THREE.RingGeometry(0.5, 0.65, 16);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
      const cross = new THREE.Mesh(crossGeo, crossMat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(target.x, 0.1, target.z);
      scene.add(cross);
      G.effects.push({ mesh: cross, life: 1.7, maxLife: 1.7, type: 'crosshair', target, heroRef: hero });
      if (showAnnouncer) showAnnouncer('🔭 CHANNELING...', '#ffff00', 1700);
      else {
        const el = document.getElementById('announcer');
        if (el) { el.textContent = 'CHANNELING...'; el.style.color = '#ffff00'; el.style.opacity = '1'; setTimeout(() => el.style.opacity = '0', 1300); }
      }
    }
  },

  castAISkill(hero, target, ctx) {
    const { scene, G, playSound } = ctx;
    const pos = { x: target.x + (Math.random() - 0.5) * 3, z: target.z + (Math.random() - 0.5) * 3 };
    const zone = new THREE.Mesh(
      new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({ color: 0xccaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.2 })
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(pos.x, 0.03, pos.z);
    scene.add(zone);
    G.effects.push({ mesh: zone, life: 4, maxLife: 4, type: 'shrapnel', x: pos.x, z: pos.z, radius: 7, dps: 15, tickTimer: 0.5, casterTeam: hero.team });
    playSound('magic');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#44aa44';
    ctx2d.fillRect(52, 40, 32, 40);
    ctx2d.fillStyle = '#d4a870';
    ctx2d.beginPath();
    ctx2d.arc(68, 32, 16, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#775533';
    ctx2d.fillRect(52, 18, 36, 16);
    ctx2d.fillRect(46, 28, 48, 8);
    ctx2d.strokeStyle = '#554433';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(84, 40);
    ctx2d.lineTo(115, 25);
    ctx2d.stroke();
    ctx2d.fillStyle = '#2244aa';
    ctx2d.beginPath();
    ctx2d.arc(62, 30, 2.5, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(74, 30, 2.5, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
