// ─── PARTICLES & EFFECTS ───────────────────────────────────────────────────────
import { G } from './state.js';
import { scene } from './scene.js';

export function spawnParticles(x, z, color, count) {
  for(let i=0;i<count;i++) {
    const geo = new THREE.SphereGeometry(0.08,4,3);
    const mat = new THREE.MeshBasicMaterial({color});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x,0.5,z);
    scene.add(mesh);
    const angle = Math.random()*Math.PI*2;
    const spd = 2+Math.random()*3;
    G.particles.push({mesh, vx:Math.cos(angle)*spd, vy:2+Math.random()*2, vz:Math.sin(angle)*spd, life:0.5+Math.random()*0.3, alive:true});
  }
}

export function spawnRing(x, z, color, radius) {
  const ringGeo = new THREE.RingGeometry(0, radius, 32);
  const ringMat = new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide, transparent:true, opacity:0.4});
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x, 0.05, z);
  scene.add(ring);
  G.effects.push({mesh:ring, life:0.6, maxLife:0.6, type:'ring', scale:1});
}

export function updateParticles(dt) {
  for(const p of G.particles) {
    if(!p.alive) continue;
    p.life -= dt;
    if(p.life<=0){p.alive=false;scene.remove(p.mesh);continue;}
    p.mesh.position.x += p.vx*dt;
    p.mesh.position.y += p.vy*dt;
    p.mesh.position.z += p.vz*dt;
    p.vy -= 6*dt;
    p.mesh.material.opacity = p.life * 2;
    p.mesh.material.transparent = true;
  }
  G.particles = G.particles.filter(p=>p.alive);
}

export function updateEffects(dt) {
  for(const e of G.effects) {
    e.life -= dt;
    if(e.life<=0){scene.remove(e.mesh);continue;}
    if(e.type==='ring') {
      const t = 1-(e.life/e.maxLife);
      e.mesh.scale.set(1+t*2,1+t*2,1);
      e.mesh.material.opacity = (e.life/e.maxLife)*0.5;
    }
    if(e.type==='shrapnel') {
      e.tickTimer -= dt;
      if(e.tickTimer<=0) {
        e.tickTimer = 0.5;
        // Fire shrapnel tick callback if registered
        if(window._shrapnelTick) window._shrapnelTick(e);
      }
      e.mesh.material.opacity = (e.life/e.maxLife)*0.3;
    }
    if(e.type==='crosshair' && e.target && e.target.alive) {
      e.mesh.position.x = e.target.x;
      e.mesh.position.z = e.target.z;
      e.mesh.rotation.z += dt*3;
    }
  }
  G.effects = G.effects.filter(e=>e.life>0);
}
