// ─── HERO ANIMATION SYSTEM ────────────────────────────────────────────────────
// Drives part rotations based on hero state (idle, walk, attack, castQ, castR, die)

export function updateHeroAnim(hero, dt) {
  const p = hero.parts;
  if (!p) return;

  const sin = Math.sin, cos = Math.cos;

  // Advance one-shot timers
  if (hero._atkAnimTimer > 0) hero._atkAnimTimer -= dt;
  if (hero._castAnimTimer > 0) hero._castAnimTimer -= dt;

  // Determine animation state
  let anim = 'idle';
  if (!hero.alive)                                        anim = 'die';
  else if (hero._atkAnimTimer > 0)                        anim = 'attack';
  else if (hero._castAnimTimer > 0 && hero._castAnim)     anim = hero._castAnim;
  else if (hero._isMoving)                                anim = 'walk';

  // Reset time when state changes
  if (anim !== hero._prevAnim) {
    hero.animTime = 0;
    hero._prevAnim = anim;
    // Reset die rotation when leaving die state
    if (hero._prevAnim === 'die') hero.group.rotation.x = 0;
  }

  // Attack anim runs at attack speed, others at normal
  const spd = (anim === 'attack') ? Math.max(1.0, 1.0 / hero.atkCd) : 1.0;
  hero.animTime += dt * spd;
  const t = hero.animTime;

  // ── IDLE ──────────────────────────────────────────────────────────────────────
  if (anim === 'idle') {
    if (p.armR) p.armR.rotation.x = sin(t * 1.2) * 0.04;
    if (p.armL) p.armL.rotation.x = sin(t * 1.2 + Math.PI) * 0.04;
    if (p.legR) { p.legR.rotation.x += (0 - p.legR.rotation.x) * 0.1; }
    if (p.legL) { p.legL.rotation.x += (0 - p.legL.rotation.x) * 0.1; }
    if (p.skull) p.skull.rotation.y = sin(t * 0.8) * 0.05;
    if (p.gem)   { p.gem.rotation.y = t * 1.5; p.gem.rotation.x = sin(t * 0.7) * 0.3; }
    if (p.iceOrb) { p.iceOrb.position.x = -0.10 + sin(t * 1.1) * 0.04; p.iceOrb.rotation.y = t * 2; }
    if (p.iceShell) p.iceShell.position.x = p.iceOrb ? p.iceOrb.position.x : 0;
    if (p.wingL) p.wingL.rotation.z = sin(t * 1.0) * 0.05;
    if (p.wingR) p.wingR.rotation.z = sin(t * 1.0) * -0.05;
    if (p.cape)  p.cape.rotation.z = sin(t * 0.9) * 0.04;
    if (p.bow)   p.bow.rotation.z  = sin(t * 0.9) * 0.03;
    if (p.soulOrbs) p.soulOrbs.forEach((o, i) => {
      if (!o.visible) return;
      const a = o.userData.angle + t * 1.2;
      o.position.set(sin(a) * o.userData.radius, o.userData.height + sin(t + i) * 0.1, cos(a) * o.userData.radius);
    });
    if (p.wisps) p.wisps.forEach((w, i) => {
      const a = w.userData.angle + t * (0.8 + i * 0.1);
      w.position.set(sin(a) * w.userData.radius, w.userData.height + sin(t * 1.5 + i) * 0.12, cos(a) * w.userData.radius);
    });
  }

  // ── WALK ──────────────────────────────────────────────────────────────────────
  else if (anim === 'walk') {
    if (p.armR) p.armR.rotation.x = sin(t * 4) * 0.35;
    if (p.armL) p.armL.rotation.x = sin(t * 4 + Math.PI) * 0.35;
    if (p.legR) p.legR.rotation.x = sin(t * 4) * 0.4;
    if (p.legL) p.legL.rotation.x = sin(t * 4 + Math.PI) * 0.4;
    if (p.skull) p.skull.rotation.y = sin(t * 2) * 0.06;
    if (p.cape)  p.cape.rotation.x = sin(t * 4) * 0.08 + 0.05;
    if (p.bow)   p.bow.position.z  = 0.08 + sin(t * 4) * 0.02;
    if (p.wingL) p.wingL.rotation.z = sin(t * 2) * 0.08;
    if (p.wingR) p.wingR.rotation.z = sin(t * 2) * -0.08;
    if (p.soulOrbs) p.soulOrbs.forEach((o, i) => {
      if (!o.visible) return;
      const a = o.userData.angle + t * 2.5;
      o.position.set(sin(a) * o.userData.radius, o.userData.height + sin(t + i) * 0.08, cos(a) * o.userData.radius);
    });
    if (p.wisps) p.wisps.forEach((w, i) => {
      const a = w.userData.angle + t * (1.5 + i * 0.1);
      w.position.set(sin(a) * w.userData.radius, w.userData.height + sin(t * 2 + i) * 0.1, cos(a) * w.userData.radius);
    });
  }

  // ── ATTACK ────────────────────────────────────────────────────────────────────
  else if (anim === 'attack') {
    const cycle = t % 1.0;
    if (cycle < 0.3) {
      const f = cycle / 0.3;
      if (p.armR) p.armR.rotation.x = -sin(f * Math.PI) * 0.65;
      if (p.swordGroup) p.swordGroup.rotation.x = -sin(f * Math.PI) * 0.4;
      if (p.rifle)  p.rifle.rotation.x  = sin(f * Math.PI) * 0.15;
      if (p.bow)    p.bow.rotation.z     = sin(f * Math.PI) * 0.25;
    } else if (cycle < 0.6) {
      const f = (cycle - 0.3) / 0.3;
      if (p.armR) p.armR.rotation.x = -sin((1 - f) * Math.PI) * 0.65;
      if (p.swordGroup) p.swordGroup.rotation.x = -sin((1 - f) * Math.PI) * 0.4;
      if (p.rifle)  p.rifle.rotation.x  = sin((1 - f) * Math.PI) * 0.15;
      if (p.bow)    p.bow.rotation.z     = sin((1 - f) * Math.PI) * 0.25;
    } else {
      if (p.armR) p.armR.rotation.x += (0 - p.armR.rotation.x) * 0.2;
      if (p.swordGroup) p.swordGroup.rotation.x += (0 - p.swordGroup.rotation.x) * 0.2;
      if (p.rifle) p.rifle.rotation.x += (0 - p.rifle.rotation.x) * 0.2;
      if (p.bow)   p.bow.rotation.z   += (0 - p.bow.rotation.z)   * 0.2;
    }
    if (p.wingL) p.wingL.rotation.z = sin(t * 3) * 0.12;
    if (p.wingR) p.wingR.rotation.z = sin(t * 3) * -0.12;
    if (p.soulOrbs) p.soulOrbs.forEach((o, i) => {
      if (!o.visible) return;
      const a = o.userData.angle + t * 2.0;
      o.position.set(sin(a) * o.userData.radius, o.userData.height + sin(t + i) * 0.08, cos(a) * o.userData.radius);
    });
    if (p.wisps) p.wisps.forEach((w, i) => {
      const a = w.userData.angle + t * (1.5 + i * 0.1);
      w.position.set(sin(a) * w.userData.radius, w.userData.height + sin(t * 2 + i) * 0.1, cos(a) * w.userData.radius);
    });
  }

  // ── CAST Q / CAST R ───────────────────────────────────────────────────────────
  else if (anim === 'castQ' || anim === 'castR') {
    const cycle = t % 1.2;
    if (p.armL) p.armL.rotation.x = sin(cycle / 1.2 * Math.PI) * -0.8;
    if (p.armR) p.armR.rotation.x = sin(cycle / 1.2 * Math.PI) * 0.3;
    if (p.skull) p.skull.rotation.y = sin(t * 3) * 0.1;
    if (p.bow) p.bow.rotation.z = sin(t * 2) * 0.3;
    if (anim === 'castR') {
      if (p.wingL) p.wingL.rotation.z = sin(t * 2) * 0.25 + 0.2;
      if (p.wingR) p.wingR.rotation.z = -sin(t * 2) * 0.25 - 0.2;
      if (p.gem)   p.gem.rotation.y   = t * 4;
    }
    if (p.soulOrbs) p.soulOrbs.forEach((o, i) => {
      if (!o.visible) return;
      const a = o.userData.angle + t * 3.0;
      o.position.set(sin(a) * o.userData.radius, o.userData.height + sin(t + i) * 0.1, cos(a) * o.userData.radius);
    });
    if (p.wisps) p.wisps.forEach((w, i) => {
      const a = w.userData.angle + t * (2.0 + i * 0.2);
      w.position.set(sin(a) * w.userData.radius, w.userData.height + sin(t * 2 + i) * 0.15, cos(a) * w.userData.radius);
    });
  }

  // ── DIE ───────────────────────────────────────────────────────────────────────
  else if (anim === 'die') {
    const fall = Math.min(hero.animTime * 1.5, Math.PI / 2);
    hero.group.rotation.x = fall;
    if (p.armR) p.armR.rotation.z = fall * 0.5;
    if (p.armL) p.armL.rotation.z = -fall * 0.5;
  }
}
