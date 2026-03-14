// ─── CONTROLS ──────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { camera, groundPlane } from './scene.js';
import { castSkill } from './skills.js';
import { getEnemiesOf } from './combat.js';

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
    joystick.wx = -(joystick.dx + joystick.dz) * 0.707;
    joystick.wz = (joystick.dx - joystick.dz) * 0.707;
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
    joystick.wx=-(joystick.dx+joystick.dz)*0.707;
    joystick.wz=(joystick.dx-joystick.dz)*0.707;
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

    // Attack targets: enemies + neutral creeps + deniable allied creeps (<50% HP)
    const allEntities = [...G.creeps, ...G.towers, ...G.barracks, G.aiHero].filter(e=>e&&e.alive);
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
      case ' ': if(h){h.moveTarget=null;h.attackTarget=null;} e.preventDefault(); break;
      case 'b': case 'B': if(window.toggleShop) window.toggleShop(); break;
      case 'a': case 'A': {
        if(!h||!h.alive) break;
        const enems = getEnemiesOf(h.team).filter(en=>en.alive);
        let best=null,bd=Infinity;
        for(const en of enems){const dx=en.x-h.x,dz=en.z-h.z,d=dx*dx+dz*dz;if(d<bd){bd=d;best=en;}}
        if(best){h.attackTarget=best;h.moveTarget=null;}
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

  // Mobile skill buttons
  document.querySelectorAll('.skill-btn').forEach(btn=>{
    btn.addEventListener('touchstart', e=>{
      e.preventDefault();
      const key = e.currentTarget.id.replace('sb','');
      castSkill(key);
    },{passive:false});
  });

  // Attack button mobile
  document.getElementById('attack-btn').addEventListener('touchstart', e=>{
    e.preventDefault();
    const h = G.playerHero; if(!h||!h.alive) return;
    const enemies = getEnemiesOf(h.team).filter(en=>en.alive);
    let best=null, bestD=Infinity;
    for(const en of enemies){
      const dx=en.x-h.x,dz=en.z-h.z;
      const d=Math.sqrt(dx*dx+dz*dz);
      if(d<bestD){bestD=d;best=en;}
    }
    if(best){h.attackTarget=best;h.moveTarget=null;}
  },{passive:false});
}

export function toggleAttackMode() {
  G.attackMode = !G.attackMode;
  const btn = document.getElementById('attack-btn');
  btn.style.background = G.attackMode ? '#8a1111' : '#4a1111';
  btn.style.borderColor = G.attackMode ? '#ff2222' : '#882222';
}
