// ─── THREE.JS SCENE SETUP ──────────────────────────────────────────────────────
import { ZOOM } from './constants.js';

export let scene, camera, renderer, camTarget, groundPlane;

export function initThree() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07070f, 80, 200);
  scene.background = new THREE.Color(0x07070f);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera(-ZOOM*aspect, ZOOM*aspect, ZOOM, -ZOOM, -500, 500);
  camTarget = new THREE.Vector3(50, 0, 50);
  // Camera positioned so player base (10,10) is bottom-left, enemy (90,90) top-right
  camera.position.set(camTarget.x - 30, 35, camTarget.z - 30);
  camera.lookAt(camTarget.x, 0, camTarget.z);

  renderer = new THREE.WebGLRenderer({canvas:document.getElementById('canvas'), antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // Lights
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sun.position.set(40, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x2a2a4a, 0x1a1208, 0.7);
  scene.add(hemi);

  // Ground raycaster plane
  const gGeo = new THREE.PlaneGeometry(1,1);
  const gMat = new THREE.MeshBasicMaterial({visible:false, side:THREE.DoubleSide});
  groundPlane = new THREE.Mesh(gGeo, gMat);
  groundPlane.rotation.x = -Math.PI/2;
  groundPlane.scale.set(1000,1000,1);
  groundPlane.position.set(50,0,50);
  scene.add(groundPlane);

  window.addEventListener('resize', onResize);
  onResize();
}

export function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  const aspect = w/h;
  camera.left = -ZOOM*aspect; camera.right = ZOOM*aspect;
  camera.top = ZOOM; camera.bottom = -ZOOM;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

export function updateCamera(_dt, playerHero) {
  if(playerHero && playerHero.alive) {
    camTarget.x += (playerHero.x - camTarget.x)*0.08;
    camTarget.z += (playerHero.z - camTarget.z)*0.08;
  }
  camTarget.x = Math.max(0, Math.min(100, camTarget.x));
  camTarget.z = Math.max(0, Math.min(100, camTarget.z));
  // Player base (10,10) bottom-left, enemy (90,90) top-right
  camera.position.x = camTarget.x - 30;
  camera.position.z = camTarget.z - 30;
  camera.lookAt(camTarget.x, 0, camTarget.z);
}
