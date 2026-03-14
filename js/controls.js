// ─── CONTROLS ──────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { camera, groundPlane } from './scene.js';
import { castSkill } from './skills.js';
import { getEnemiesOf, floatDamage } from './combat.js';

export const joystick = {active:false, dx:0, dz:0, wx:0, wz:0, startX:0, startY:0, ox:0, oy:0};
export const keys = {};

export function initControls() {
  const joystickArea = document.getElementById('joystick-area');
  const joystickOuter = document.getElementById('joystick-outer');
  const joystickInner = document.getElementById('joystick-inner');

  // Initialize joystick inner position
  joystickInner.style.left='38px';
  joystickInner.style.top='38px';
  joystickInner.style.position='absolute';

  function repositionOuter(clientX, clientY) {
    const r = joystickArea.getBoundingClientRect();
    const localX = clientX - r.left;
    const localY = clientY - r.top;
    const half = 60;
    const ox = Math.max(half, Math.min(r.width - half, localX)) - half;
    const oy = Math.max(half, Math.min(r.height - half, localY)) - half;
    joystickOuter.style.left = ox + 'px';
    joystickOuter.style.top = oy + 'px';
    joystickOuter.style.bottom = 'auto';
    joystickInner.style.left = '38px';
    joystickInner.style.top = '38px';
  }

  function resetOuter() {
    joystickOuter.style.bottom = '20px';
    joystickOuter.style.left = '20px';
    joystickOuter.style.top = 'auto';
    joystickInner.style.left = '38px';
    joystickInner.style.top = '38px';
  }

  joystickArea.addEventListener('touchstart', e=>{
    e.preventDefault();
    const t = e.changedTouches[0];
    repositionOuter(t.clientX, t.clientY);
    joystick.active = true;
    joystick.startX = t.clientX; joystick.startY = t.clientY;
  },{passive:false});

  joystickArea.addEventListener('touchmove', e=>{
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX-joystick.startX;
    const dy = t.clientY-joystick.startY;
    const len = Math.sqrt(dx*dx+dy*dy);
    const maxR = 38;
    const clampLen = Math.min(len, maxR);
    const nx = len>0?dx/len:0, ny = len>0?dy/len:0;
    joystickInner.style.left = (60+nx*clampLen-22)+'px';
    joystickInner.style.top = (60+ny*clampLen-22)+'px';
    joystick.dx = nx; joystick.dz = ny;
    // Camera from west: screen right = world +Z, screen up = world +X
    joystick.wz = joystick.dx;
    joystick.wx = -joystick.dz;
  },{passive:false});

  joystickArea.addEventListener('touchend', e=>{
    e.preventDefault();
    joystick.active=false; joystick.dx=0; joystick.dz=0; joystick.wx=0; joystick.wz=0;
    resetOuter();
  },{passive:false});

  // Mouse joystick support (desktop) — floating: repositions to click point
  joystickArea.addEventListener('mousedown', e=>{
    e.preventDefault();
    repositionOuter(e.clientX, e.clientY);
    joystick.active=true;
    joystick.startX=e.clientX; joystick.startY=e.clientY;
  });
  document.addEventListener('mousemove', e=>{
    if(!joystick.active) return;
    const dx=e.clientX-joystick.startX, dy=e.clientY-joystick.startY;
    const len=Math.sqrt(dx*dx+dy*dy);
    const maxR=38, clampLen=Math.min(len,maxR);
    const nx=len>0?dx/len:0, ny=len>0?dy/len:0;
    joystickInner.style.left=(60+nx*clampLen-22)+'px';
    joystickInner.style.top=(60+ny*clampLen-22)+'px';
    joystick.dx=nx; joystick.dz=ny;
    joystick.wz = joystick.dx;
    joystick.wx = -joystick.dz;
  });
  document.addEventListener('mouseup', ()=>{
    if(!joystick.active) return;
    joystick.active=false; joystick.dx=0; joystick.dz=0; joystick.wx=0; joystick.wz=0;
    resetOuter();
  });

  // Desktop click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  document.getElementById('canvas').addEventListener('click', e=>{
    if(G.phase!=='game') return;
    const h = G.playerHero; if(!h||!h.alive) return;

    mouse.x = (e.clientX/window.innerWidth)*2-1;
    mouse.y = -(e.clientY/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, camera);

    if(G.targetingSkill) {
      const hits = raycaster.intersectObject(groundPlane);
      if(hits.length) {
        const pos = hits[0].point;
        const sk = G.targetingSkill;
        G.targetingSkill = null;
        document.body.classList.remove('targeting-skill');
        const sbEl = document.getElementById('sb'+sk);
        if(sbEl) sbEl.classList.remove('active-target');
        castSkill(sk, {x:pos.x,z:pos.z}, null);
      }
      return;
    }

    if(G.selectingTPTarget) {
      const hits = raycaster.intersectObject(groundPlane);
      if(hits.length) {
        const pos = hits[0].point;
        const alliedStructures = G.towers.filter(t => t.team === h.team && t.alive);
        let nearest = null, nearestDist = Infinity;
        for(const t of alliedStructures) {
          const dx = t.x - pos.x, dz = t.z - pos.z;
          const d = Math.sqrt(dx*dx + dz*dz);
          if(d < nearestDist) { nearestDist = d; nearest = t; }
        }
        G.selectingTPTarget = false;
        if(nearest && nearestDist <= 20) {
          h.tpTarget = { x: nearest.x, z: nearest.z };
        } else {
          // Fallback: teleport to own base fountain
          h.tpTarget = { x: h.team==='scourge'?10:90, z: h.team==='scourge'?10:90 };
        }
        h.channeling = 3;
        floatDamage(h.x, h.z, 'TELEPORTING...', '#44ffcc');
      }
      return;
    }

    // Attack targets: enemies + neutral creeps + deniable allied creeps (<50% HP)
    const enemyHeroes = G.heroList.filter(eh=>eh&&eh.alive&&eh.team!==h.team);
    const allEntities = [...G.creeps, ...G.towers, ...G.barracks, ...enemyHeroes].filter(e=>e&&e.alive);
    let hitTarget = null;
    for(const ent of allEntities) {
      const ex = ent.x||(ent.def?.x)||0, ez = ent.z||(ent.def?.z)||0;
      const pos = new THREE.Vector3(ex, 1, ez);
      const screen = pos.clone().project(camera);
      const sx=(screen.x*0.5+0.5)*window.innerWidth;
      const sy=(-screen.y*0.5+0.5)*window.innerHeight;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if(Math.sqrt(dx*dx+dy*dy)<25) {
        const isEnemy = ent.team !== h.team && ent.team !== 'neutral';
        const isNeutral = ent.team === 'neutral';
        const isDeniable = ent.team === h.team && !ent.def && !ent.isBarracks && ent.isPlayer===undefined && (ent.hp/ent.maxHp) < 0.5;
        if(isEnemy || isNeutral || isDeniable) { hitTarget = ent; break; }
      }
    }
    if(hitTarget) { h.attackTarget = hitTarget; h.moveTarget = null; }
    // No click-to-move: movement is joystick or keyboard only
  });

  // Keyboard
  document.addEventListener('keydown', e=>{
    // Block WASD from being stored as movement keys (they're skill/action keys only)
    if(!['w','W','a','A','s','S','d','D'].includes(e.key)) keys[e.key] = true;
    if(G.phase!=='game') return;
    const h = G.playerHero;
    switch(e.key) {
      case 'q': case 'Q': castSkill('Q'); break;
      case 'w': case 'W': castSkill('W'); break;
      case 'e': case 'E': castSkill('E'); break;
      case 'r': case 'R': castSkill('R'); break;
      case 'Escape':
        if(G.targetingSkill){
          G.targetingSkill=null;
          document.body.classList.remove('targeting-skill');
          ['Q','W','E','R'].forEach(k=>{const el=document.getElementById('sb'+k);if(el)el.classList.remove('active-target');});
        }
        if(G.selectingTPTarget){G.selectingTPTarget=false;}
        break;
      case ' ': if(h){h.moveTarget=null;h.attackTarget=null;} e.preventDefault(); break;
      case 'b': case 'B': if(window.toggleShop) window.toggleShop(); break;
      case 'a': case 'A': {
        doAttackNearest();
        break;
      }
    }
  });

  document.addEventListener('keyup', e=>{
    if(!['w','W','a','A','s','S','d','D'].includes(e.key)) keys[e.key] = false;
  });

  // Scroll zoom
  document.addEventListener('wheel', e=>{
    if(G.phase!=='game') return;
    const aspect = window.innerWidth/window.innerHeight;
    const delta = e.deltaY*0.05;
    const newZoom = Math.max(15, Math.min(35, camera.top + delta));
    camera.left = -newZoom*aspect; camera.right = newZoom*aspect;
    camera.top = newZoom; camera.bottom = -newZoom;
    camera.updateProjectionMatrix();
  });

  // ─── Mobile skill buttons: drag-to-aim + double-tap auto-target ─────────────
  const DRAG_THRESHOLD = 20;    // px — below this is a tap, not a drag
  const DOUBLE_TAP_MS  = 300;   // ms — window for double-tap detection
  const CAST_RANGE     = 500;   // world units — drag-cast projection distance

  const aimIndicator = document.getElementById('aim-indicator');
  const aimArrow     = document.getElementById('aim-arrow');

  const skillDrag    = { active: false, key: null, startX: 0, startY: 0, touchId: -1 };
  const lastSkillTap = { key: null, time: 0 };

  const dragRaycaster = new THREE.Raycaster();
  const dragMouse     = new THREE.Vector2();

  function touchWorldPos(clientX, clientY) {
    dragMouse.x = (clientX / window.innerWidth) * 2 - 1;
    dragMouse.y = -(clientY / window.innerHeight) * 2 + 1;
    dragRaycaster.setFromCamera(dragMouse, camera);
    const hits = dragRaycaster.intersectObject(groundPlane);
    return hits.length ? { x: hits[0].point.x, z: hits[0].point.z } : null;
  }

  document.querySelectorAll('.skill-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      const key = btn.id.replace('sb', '');
      const t   = e.changedTouches[0];
      skillDrag.active  = true;
      skillDrag.key     = key;
      skillDrag.startX  = t.clientX;
      skillDrag.startY  = t.clientY;
      skillDrag.touchId = t.identifier;
      aimIndicator.style.left    = t.clientX + 'px';
      aimIndicator.style.top     = t.clientY + 'px';
      aimIndicator.style.display = 'block';
      aimArrow.style.transform   = 'rotate(0deg)';
    }, { passive: false });

    btn.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!skillDrag.active) return;
      const t = Array.from(e.changedTouches).find(ct => ct.identifier === skillDrag.touchId);
      if (!t) return;
      const dx    = t.clientX - skillDrag.startX;
      const dy    = t.clientY - skillDrag.startY;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      aimArrow.style.transform = `rotate(${angle}deg)`;
    }, { passive: false });

    btn.addEventListener('touchend', e => {
      e.preventDefault();
      if (!skillDrag.active) return;
      const t = Array.from(e.changedTouches).find(ct => ct.identifier === skillDrag.touchId);
      if (!t) return;
      const dx   = t.clientX - skillDrag.startX;
      const dy   = t.clientY - skillDrag.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const key  = skillDrag.key;
      skillDrag.active = false;
      aimIndicator.style.display = 'none';

      if (dist >= DRAG_THRESHOLD) {
        // ── Drag cast: project finger endpoint to world ground ──────────────
        const worldPos = touchWorldPos(t.clientX, t.clientY);
        if (worldPos) {
          castSkill(key, worldPos, null);
        } else {
          // Fallback: project drag direction from hero position
          const h = G.playerHero;
          if (h && dist > 0) {
            // Camera is from west: screenX→world+Z, screenY→world+X (inverted)
            const nx = dx / dist, ny = dy / dist;
            castSkill(key, { x: h.x + (-ny) * CAST_RANGE * 0.5, z: h.z + nx * CAST_RANGE * 0.5 }, null);
          }
        }
      } else {
        // ── Tap: check for double-tap ────────────────────────────────────────
        const now = Date.now();
        if (lastSkillTap.key === key && (now - lastSkillTap.time) < DOUBLE_TAP_MS) {
          lastSkillTap.key = null;
          // Double-tap: auto-cast on nearest enemy hero in range
          const h = G.playerHero;
          if (h) {
            const enemies = getEnemiesOf(h.team).filter(en => en.alive);
            let best = null, bestD = Infinity;
            for (const en of enemies) {
              const edx = en.x - h.x, edz = en.z - h.z;
              const d   = Math.sqrt(edx * edx + edz * edz);
              if (d <= CAST_RANGE && d < bestD) { bestD = d; best = en; }
            }
            castSkill(key, best ? { x: best.x, z: best.z } : null, best || null);
          }
        } else {
          // Single tap: enter targeting mode or cast (existing behavior)
          lastSkillTap.key  = key;
          lastSkillTap.time = now;
          castSkill(key);
        }
      }
    }, { passive: false });
  });

  // Attack button — find nearest enemy, set target, fire immediately
  function doAttackNearest() {
    const h = G.playerHero; if(!h||!h.alive) return;
    // Always play attack animation regardless of cooldown or enemy presence
    h._atkAnimTimer = Math.min(h.atkCd * 0.8, 0.55);
    // Lock on to nearest enemy if any
    const range = h.def.range;
    const enemies = getEnemiesOf(h.team).filter(en=>en.alive);
    let best=null, bestD=Infinity;
    for(const en of enemies){
      const dx=en.x-h.x, dz=en.z-h.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d<=range && d<bestD){bestD=d;best=en;}
    }
    if(best){ h.attackTarget=best; h.moveTarget=null; }
  }
  const atkBtn = document.getElementById('attack-btn');
  atkBtn.addEventListener('touchstart', e=>{ e.preventDefault(); doAttackNearest(); },{passive:false});
  atkBtn.addEventListener('click', ()=>doAttackNearest());
}

