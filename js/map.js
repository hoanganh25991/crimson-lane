// ─── MAP GENERATION ────────────────────────────────────────────────────────────
import { scene } from './scene.js';

export function buildMap() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(100,100);
  const groundMat = new THREE.MeshStandardMaterial({color:0x0d1a0a, roughness:1});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.set(50,0,50);
  ground.receiveShadow = true;
  scene.add(ground);

  // Lanes (dirt paths)
  function addLane(x,z,w,h,rot) {
    const geo = new THREE.PlaneGeometry(w,h);
    const mat = new THREE.MeshStandardMaterial({color:0x1a1208, roughness:1});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2;
    if(rot) mesh.rotation.z = rot;
    mesh.position.set(x, 0.01, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  addLane(50, 85, 76, 5, 0); // top horizontal (x=12 to x=88)
  addLane(50, 15, 76, 5, 0); // bot horizontal
  addLane(10, 47, 5, 75, 0); // left vertical connector (scourge base → top lane, z=10 to z=85)
  addLane(90, 53, 5, 75, 0); // right vertical connector (bot lane → sentinel base, z=15 to z=90)
  // Mid diagonal
  const midGeo = new THREE.PlaneGeometry(6, 140);
  const midMat = new THREE.MeshStandardMaterial({color:0x1a1208, roughness:1});
  const midMesh = new THREE.Mesh(midGeo, midMat);
  midMesh.rotation.x = -Math.PI/2;
  midMesh.rotation.z = Math.PI/4;
  midMesh.position.set(50, 0.01, 50);
  midMesh.receiveShadow = true;
  scene.add(midMesh);

  // River (diagonal)
  const riverGeo = new THREE.PlaneGeometry(3, 145);
  const riverMat = new THREE.MeshStandardMaterial({color:0x0a1a3a, roughness:0.3, metalness:0.2});
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI/2;
  river.rotation.z = -Math.PI/4;
  river.position.set(50, 0.02, 50);
  scene.add(river);

  // Base pads
  function addBase(x,z,color) {
    const geo = new THREE.CircleGeometry(8, 16);
    const mat = new THREE.MeshStandardMaterial({color, roughness:0.8});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set(x, 0.015, z);
    scene.add(mesh);
  }
  addBase(10, 10, 0x1a0a0a);
  addBase(90, 90, 0x0a0a1a);

  // Base lights
  const scourgeLight = new THREE.PointLight(0xff2200, 1.5, 18);
  scourgeLight.position.set(10, 3, 10);
  scene.add(scourgeLight);
  const sentinelLight = new THREE.PointLight(0x2244ff, 1.5, 18);
  sentinelLight.position.set(90, 3, 90);
  scene.add(sentinelLight);

  // Trees (jungle clusters)
  const treePositions = generateTreePositions();
  const treeMat = new THREE.MeshStandardMaterial({color:0x0a2208, roughness:1});
  for(const p of treePositions) {
    const h = 2.5 + Math.random()*2;
    const geo = new THREE.CylinderGeometry(0.15+Math.random()*0.1, 0.25+Math.random()*0.15, h, 5);
    const mesh = new THREE.Mesh(geo, treeMat);
    mesh.position.set(p.x, h/2, p.z);
    mesh.castShadow = true;
    scene.add(mesh);
    // Canopy
    const cGeo = new THREE.ConeGeometry(0.9+Math.random()*0.4, 1.8, 6);
    const cMat = new THREE.MeshStandardMaterial({color:0x0d2a0a+(Math.floor(Math.random()*3))*0x010100});
    const canopy = new THREE.Mesh(cGeo, cMat);
    canopy.position.set(p.x, h+0.4, p.z);
    canopy.castShadow = true;
    scene.add(canopy);
  }
}

export function generateTreePositions() {
  const positions = [];
  const rng = ()=>Math.random();
  function isInLane(x,z) {
    if(Math.abs(z-85)<6 && x>5 && x<95) return true;
    if(Math.abs(z-15)<6 && x>5 && x<95) return true;
    const diag = Math.abs((z-x)); if(diag<10) return true;
    if(x<20 && z<20) return true;
    if(x>80 && z>80) return true;
    return false;
  }
  const areas = [
    {xMin:2,xMax:40,zMin:22,zMax:78},{xMin:60,xMax:98,zMin:22,zMax:78},
    {xMin:2,xMax:50,zMin:25,zMax:75},{xMin:50,xMax:98,zMin:25,zMax:75},
    {xMin:25,xMax:45,zMin:2,zMax:12},{xMin:55,xMax:75,zMin:88,zMax:98},
    {xMin:2,xMax:12,zMin:25,zMax:75},{xMin:88,xMax:98,zMin:25,zMax:75},
  ];
  for(const a of areas) {
    const count = Math.floor(((a.xMax-a.xMin)*(a.zMax-a.zMin))/60);
    for(let i=0;i<count;i++) {
      const x = a.xMin + rng()*(a.xMax-a.xMin);
      const z = a.zMin + rng()*(a.zMax-a.zMin);
      if(!isInLane(x,z)) positions.push({x,z});
    }
  }
  return positions;
}
