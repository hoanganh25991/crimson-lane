// ─── BOUNTY HUNTER ───────────────────────────────────────────────────────────
// Stealthy figure, dual blades, hood. Agi, Scourge, Ganker/Roam
import { stdMat, glowMat, metalMat, transMat } from '../hero-models.js';

export default {
  id: 'bounty_hunter',
  def: {
    name: 'BOUNTY HUNTER',
    color: 0x558855,
    headColor: 0x88cc88,
    team: 'scourge',
    hp: 550,
    mp: 195,
    move: 8.5,
    range: 2.5,
    dmgMin: 48,
    dmgMax: 54,
    armor: 3,
    atkSpd: 0.95,
    skills: ['Shuriken Toss', 'Jinada', 'Shadow Walk', 'Track'],
  },
  skillCosts: { Q: [90, 90, 90, 90], W: [0, 0, 0, 0], E: [50, 50, 50, 50], R: [50, 50, 50, 50] },
  skillCDs: { Q: [10, 10, 10, 10], W: [0, 0, 0, 0], E: [15, 15, 15, 15], R: [5, 5, 5, 5] },
  skillNames: { Q: 'SHURIKEN', W: 'JINADA', E: 'SHADOW WALK', R: 'TRACK' },
  aiBuild: ['boots_of_speed', 'blades_of_attack', 'vitality_gem'],

  buildModel() {
    const g = new THREE.Group();
    const dark = 0x1a2a1a;
    const green = 0x558855;
    const accent = 0x88cc88;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.22), stdMat(green));
    torso.position.y = 0.5;
    g.add(torso);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), stdMat(dark));
    hood.position.y = 1.05;
    g.add(hood);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.12), stdMat(0x662222));
    scarf.position.set(0, 0.82, -0.08);
    g.add(scarf);
    const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.06), metalMat(0x8899aa));
    bladeL.position.set(-0.22, 0.52, 0.2);
    g.add(bladeL);
    const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.06), metalMat(0x8899aa));
    bladeR.position.set(0.22, 0.52, 0.2);
    g.add(bladeR);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), stdMat(dark));
    legL.position.set(-0.1, 0.2, 0.02);
    g.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), stdMat(dark));
    legR.position.set(0.1, 0.2, 0.02);
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
    const { scene, G, applyDamage, getEnemiesOf, findEnemyNear, spawnSpellProjectile, floatDamage, spawnParticles, playSound } = ctx;
    if (key === 'Q') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 12);
      if (!target || !target.alive) return;
      const dmg = 60 + 40 * lvl;
      spawnSpellProjectile(hero.x, hero.z, target, 0x88cc88, 18, (t) => {
        applyDamage(t, dmg, 'magic');
        t.stunTimer = 0.25;
        spawnParticles(t.x, t.z, 0x88cc88, 4);
        playSound('hit');
      });
      playSound('magic');
    } else if (key === 'W') {
      floatDamage(hero.x, hero.z, 'JINADA', '#88cc88');
      playSound('magic');
    } else if (key === 'E') {
      hero.shadowWalk = true;
      hero.shadowWalkTimer = 4;
      spawnParticles(hero.x, hero.z, 0x334433, 6);
      floatDamage(hero.x, hero.z, 'INVIS', '#558855');
      playSound('magic');
    } else if (key === 'R') {
      const target = targetEntity || findEnemyNear(targetPos?.x ?? hero.x, targetPos?.z ?? hero.z, 14);
      if (!target || !target.alive) return;
      target.tracked = true;
      target.trackedTimer = 15;
      spawnParticles(target.x, target.z, 0x88cc88, 4);
      floatDamage(target.x, target.z, 'TRACKED', '#88cc88');
      playSound('magic');
    }
  },

  castAISkill(hero, target, ctx) {
    const { applyDamage, spawnSpellProjectile, spawnParticles, playSound } = ctx;
    spawnSpellProjectile(hero.x, hero.z, target, 0x88cc88, 18, (t) => {
      applyDamage(t, 120, 'magic');
      t.stunTimer = 0.25;
      spawnParticles(t.x, t.z, 0x88cc88, 4);
    });
    playSound('magic');
  },

  drawPortrait(ctx2d) {
    ctx2d.fillStyle = '#1a2a1a';
    ctx2d.fillRect(0, 0, 136, 100);
    ctx2d.fillStyle = '#558855';
    ctx2d.fillRect(44, 36, 48, 52);
    ctx2d.fillStyle = '#1a2a1a';
    ctx2d.beginPath();
    ctx2d.arc(68, 28, 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#662222';
    ctx2d.fillRect(40, 52, 56, 10);
    ctx2d.strokeStyle = '#88cc88';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.moveTo(36, 58);
    ctx2d.lineTo(52, 42);
    ctx2d.stroke();
    ctx2d.beginPath();
    ctx2d.moveTo(100, 58);
    ctx2d.lineTo(84, 42);
    ctx2d.stroke();
    ctx2d.fillStyle = '#88cc88';
    ctx2d.beginPath();
    ctx2d.arc(68, 50, 6, 0, Math.PI * 2);
    ctx2d.fill();
  },
};
