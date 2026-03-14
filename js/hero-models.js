// ─── HERO MODEL BUILDERS ─────────────────────────────────────────────────────
// Shared between game (heroes.js) and hero-viewer.html
// THREE must be loaded globally before this module is used

export function stdMat(color, rough=0.75, metal=0) {
  return new THREE.MeshStandardMaterial({color, roughness:rough, metalness:metal});
}
export function glowMat(color, intensity=2) {
  return new THREE.MeshStandardMaterial({color, emissive:new THREE.Color(color), emissiveIntensity:intensity, roughness:0.3, metalness:0});
}
export function metalMat(color, metal=0.8, rough=0.25) {
  return new THREE.MeshStandardMaterial({color, metalness:metal, roughness:rough});
}
export function transMat(color, opacity=0.4) {
  return new THREE.MeshStandardMaterial({color, transparent:true, opacity, roughness:0.5, side:THREE.DoubleSide});
}

// ─── 3D FACE HELPERS ──────────────────────────────────────────────────────────
// These helpers use stdMat/glowMat so they must come after the material helpers.

function addBrowRidge(g, side, x, y, color) {
  // A subtle half-cylinder ridge above each eye brow
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side*(x-.065), y, .155),
    new THREE.Vector3(side*(x-.02),  y+.012, .185),
    new THREE.Vector3(side*(x+.02),  y+.013, .186),
    new THREE.Vector3(side*(x+.055), y+.004, .166),
  ]);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve,8,.016,5,false),
    stdMat(color,.65)
  );
  g.add(mesh);
}

function addHumanEar(g, side, yOffset, color) {
  // Ear as LatheGeometry half-dome + TubeGeometry inner helix
  const earPts=[[0,0],[.022,.02],[.036,.06],[.034,.10],[.024,.14],[.008,.16],[0,.14]]
    .map(([x,y])=>new THREE.Vector2(x,y));
  const earMain = new THREE.Mesh(
    new THREE.LatheGeometry(earPts,6,0,Math.PI),
    stdMat(color,.72)
  );
  earMain.rotation.y = side>0 ? 0 : Math.PI;
  const helixCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.02,.001), new THREE.Vector3(.013,.06,.008),
    new THREE.Vector3(.010,.10,.006), new THREE.Vector3(0,.12,.001)
  ]);
  const helix = new THREE.Mesh(
    new THREE.TubeGeometry(helixCurve,5,.005,4,false),
    stdMat(color*.88,.72)
  );
  const eg = new THREE.Group();
  eg.add(earMain); eg.add(helix);
  eg.position.set(side*.205, yOffset, .02);
  eg.rotation.y = side>0 ? -Math.PI*.38 : Math.PI*.38+Math.PI;
  eg.scale.setScalar(.82);
  g.add(eg);
}

function addElvenEar(g, side, yOffset, color) {
  const earShape = new THREE.Shape();
  earShape.moveTo(0,0);
  earShape.bezierCurveTo(.042,.04,.058,.10,.020,.22); // pointed tip
  earShape.lineTo(-.020,.22);
  earShape.bezierCurveTo(-.058,.10,-.042,.04,0,0);
  earShape.closePath();
  const earMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(earShape,{depth:.024,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:1}),
    stdMat(color,.65)
  );
  // Inner ear canal hint
  const canal = new THREE.Mesh(
    new THREE.CylinderGeometry(.008,.008,.02,5),
    stdMat(color*.75,.8)
  );
  canal.position.set(0,.06,.022);
  const eg = new THREE.Group();
  eg.add(earMesh); eg.add(canal);
  eg.position.set(side*.196, yOffset, .04);
  eg.rotation.y = side>0 ? -Math.PI*.32 : Math.PI*(1+.32);
  g.add(eg);
}

// ─── HERO BUILDERS ────────────────────────────────────────────────────────────

export function buildLich() {
  const g = new THREE.Group();
  const parts = {};

  // Robe (LatheGeometry, 14 points, 16 sides)
  const robePoints = [
    [0.58,0.00],[0.61,0.04],[0.57,0.10],[0.51,0.20],
    [0.45,0.32],[0.40,0.44],[0.34,0.56],[0.27,0.68],
    [0.22,0.80],[0.19,0.92],[0.16,1.02],[0.14,1.10],
    [0.13,1.14],[0.12,1.18]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const robe = new THREE.Mesh(new THREE.LatheGeometry(robePoints,16), stdMat(0x1a0a2e,0.9,0.05));
  robe.castShadow = true; robe.position.y = 0;
  g.add(robe);

  // Robe trim
  const trimPts = [[0.595,0.00],[0.625,0.02],[0.61,0.06],[0.58,0.08]].map(([x,y])=>new THREE.Vector2(x,y));
  const trim = new THREE.Mesh(new THREE.LatheGeometry(trimPts,16), stdMat(0x0d2244,0.8,0.2));
  g.add(trim);

  // Vertebrae above collar
  for(let i=0;i<4;i++){
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.04,0.05,6), stdMat(0xddccaa,0.7));
    v.position.set(0, 1.22+i*0.058, 0);
    g.add(v);
  }

  // Skull (high-poly, slightly squished)
  const skullGeo = new THREE.SphereGeometry(0.22,20,16);
  const skull = new THREE.Mesh(skullGeo, stdMat(0xe8ddc8,0.78));
  skull.scale.set(1,0.92,0.95); skull.position.set(0,1.54,0);
  skull.castShadow = true; g.add(skull); parts.skull = skull;

  // Nasal cavity — two dark oval hollows
  for(const s of[-1,1]){
    const nc = new THREE.Mesh(new THREE.SphereGeometry(.022,7,5), stdMat(0x060606,1));
    nc.scale.set(1.1,.8,.55); nc.position.set(s*.036,1.455,.195); g.add(nc);
  }
  // Nasal bridge bone (thin tube)
  const nasalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.52,.17), new THREE.Vector3(0,1.49,.19), new THREE.Vector3(0,1.46,.20)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(nasalCurve,4,.010,5,false), stdMat(0xd8c8b0,.75)));
  // Teeth row — 5 small cylinders
  for(let i=0;i<5;i++){
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.010,.012,.038,5), stdMat(0xddd5c0,.6));
    t.position.set((i-2)*.026, 1.385, .195); t.rotation.x = Math.PI/2; g.add(t);
  }

  // Jaw (ExtrudeGeometry)
  const jawShape = new THREE.Shape();
  jawShape.moveTo(-0.14,0); jawShape.lineTo(-0.16,-0.04); jawShape.lineTo(-0.12,-0.10);
  jawShape.lineTo(0,-0.11); jawShape.lineTo(0.12,-0.10); jawShape.lineTo(0.16,-0.04);
  jawShape.lineTo(0.14,0); jawShape.closePath();
  const jaw = new THREE.Mesh(new THREE.ExtrudeGeometry(jawShape,{depth:0.12,bevelEnabled:true,bevelSize:0.012,bevelThickness:0.012,bevelSegments:2}), stdMat(0xe0d4bc,0.8));
  jaw.rotation.x = Math.PI/2; jaw.position.set(-0.06,1.36,0.05); g.add(jaw);

  // Zygomatic arches (cheekbone tubes)
  for(const s of[-1,1]){
    const zc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.16,1.55,.12), new THREE.Vector3(s*.20,1.50,.14),
      new THREE.Vector3(s*.22,1.44,.10), new THREE.Vector3(s*.20,1.38,.06)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(zc,6,.012,5,false), stdMat(0xd0c0a8,.8)));
  }

  // 3D eye sockets (deep) + glowing point lights
  for(const s of[-1,1]){
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.058,10,8), stdMat(0x080808,1.0));
    socket.scale.set(1,.55,.65); socket.position.set(s*.09,1.58,.14); g.add(socket);
    // Glowing iris sphere (adds depth alongside texture)
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038,8,6), glowMat(0x00ffcc,3.5));
    iris.position.set(s*.09,1.58,.195); g.add(iris);
    // Tiny point light per eye
    const el = new THREE.PointLight(0x00ffcc,.4,1.2);
    el.position.set(s*.09,1.58,.22); g.add(el);
  }

  // Shoulder spikes (LatheGeometry, 7 points, 6 sides)
  const spikeProfile = [[0,0],[0.04,0.02],[0.05,0.06],[0.04,0.12],[0.03,0.18],[0.015,0.22],[0,0.24]].map(([x,y])=>new THREE.Vector2(x,y));
  for(let s of[-1,1]){
    for(let i=0;i<3;i++){
      const sp = new THREE.Mesh(new THREE.LatheGeometry(spikeProfile,6), stdMat(0xccbbaa,0.7));
      sp.position.set(s*(0.28+i*0.05), 1.26-i*0.03, 0.02);
      sp.rotation.z = s*(0.3+i*0.15);
      sp.rotation.x = -0.2;
      g.add(sp);
    }
  }

  // Arms (TubeGeometry along CatmullRomCurve3)
  for(let s of[-1,1]){
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*0.18, 1.18, 0.02),
      new THREE.Vector3(s*0.28, 1.10, 0.06),
      new THREE.Vector3(s*0.34, 0.96, 0.04),
      new THREE.Vector3(s*0.30, 0.82, 0.08),
      new THREE.Vector3(s*0.26, 0.72, 0.12),
    ]);
    const armMesh = new THREE.Mesh(new THREE.TubeGeometry(armCurve,10,0.036,7,false), stdMat(0xd4c8b0,0.85));
    armMesh.castShadow = true;
    if(s===1){ parts.armR = armMesh; } else { parts.armL = armMesh; }
    g.add(armMesh);

    // Fingers (4 per hand, 3 segments each)
    for(let f=0;f<4;f++){
      for(let seg=0;seg<3;seg++){
        const len = 0.06-seg*0.01;
        const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.01,len,5), stdMat(0xccbba0,0.85));
        fg.position.set(s*(0.28+f*0.018), 0.64-seg*0.055, 0.12+f*0.01);
        fg.rotation.z = s*(0.2+f*0.08);
        fg.rotation.x = 0.3+seg*0.1;
        g.add(fg);
      }
    }
  }

  // Staff shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.032,1.3,7), metalMat(0x3a2a1a,0.3,0.7));
  shaft.position.set(0.34,0.72,0.08); shaft.rotation.z = 0.12;
  shaft.castShadow = true; g.add(shaft);

  // Staff top ornament (LatheGeometry, 11 points, 8 sides)
  const ornPts = [[0,0],[0.05,0.02],[0.08,0.05],[0.09,0.09],[0.07,0.14],[0.05,0.18],[0.06,0.22],[0.08,0.26],[0.07,0.30],[0.04,0.32],[0,0.33]].map(([x,y])=>new THREE.Vector2(x,y));
  const orn = new THREE.Mesh(new THREE.LatheGeometry(ornPts,8), metalMat(0x8866aa,0.4,0.7));
  orn.position.set(0.36,1.35,0.08); orn.rotation.z = 0.12;
  g.add(orn);

  // Gem (OctahedronGeometry glowing)
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12,1), glowMat(0x00ffee,3));
  gem.position.set(0.37,1.52,0.09);
  g.add(gem); parts.gem = gem;

  // Ice orb core + shell
  const iceOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11,1), glowMat(0x88eeff,2));
  iceOrb.position.set(-0.1,1.3,0.28);
  g.add(iceOrb); parts.iceOrb = iceOrb;
  const iceShell = new THREE.Mesh(new THREE.SphereGeometry(0.15,12,10), transMat(0xaaddff,0.25));
  iceShell.position.copy(iceOrb.position);
  g.add(iceShell); parts.iceShell = iceShell;

  // Hero glow color
  parts.glowColor = 0x00ffcc;
  parts.type = 'lich';
  return {group:g, parts};
}

export function buildSniper() {
  const g = new THREE.Group();
  const parts = {};

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.24,0.55,8), stdMat(0x8b5e3c,0.8));
  torso.position.y = 0.68; torso.castShadow = true; g.add(torso);
  // Belly detail
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8), stdMat(0x7a5030,0.85));
  belly.position.set(0.06,0.72,0.14); belly.scale.set(1,0.7,0.6); g.add(belly);

  // Legs upper+lower
  for(let s of[-1,1]){
    const legU = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.08,0.22,7), stdMat(0x5c3e22,0.85));
    legU.position.set(s*0.10,0.31,0); legU.castShadow = true; g.add(legU);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.08,0.22,7), stdMat(0x4a3018,0.85));
    legL.position.set(s*0.10,0.08,0.02); legL.castShadow = true;
    if(s===1){parts.legR=legL;}else{parts.legL=legL;}
    g.add(legL);
    // Boot (ExtrudeGeometry)
    const bootShape = new THREE.Shape();
    bootShape.moveTo(-0.08,0); bootShape.lineTo(-0.09,0.08); bootShape.lineTo(-0.06,0.16);
    bootShape.lineTo(0.10,0.16); bootShape.lineTo(0.14,0.12); bootShape.lineTo(0.14,0.04);
    bootShape.lineTo(0.08,0); bootShape.closePath();
    const boot = new THREE.Mesh(new THREE.ExtrudeGeometry(bootShape,{depth:0.12,bevelEnabled:true,bevelSize:0.01,bevelThickness:0.01,bevelSegments:1}), stdMat(0x2a1a0a,0.9));
    boot.rotation.y = s>0?Math.PI/2:-Math.PI/2; boot.position.set(s*0.10,-0.05,0); g.add(boot);
  }

  // Head (high-poly, gnome proportions)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24,20,16), stdMat(0xd4a870,0.68));
  head.scale.set(1,0.88,1); head.position.y = 1.15; head.castShadow = true; g.add(head);

  // 3D Brow ridges (thick gnome brows, inline)
  for(const s of[-1,1]){
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.02,1.234,.196), new THREE.Vector3(s*.06,1.238,.200),
      new THREE.Vector3(s*.09,1.232,.196), new THREE.Vector3(s*.12,1.218,.186)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(bc,6,.018,6,false), stdMat(0xa07830,.82)));
  }

  // Human ears (inline — LatheGeometry half-dome + inner tube)
  for(const s of[-1,1]){
    const earPts = [[0,0],[.032,.01],[.048,.04],[.050,.08],[.044,.13],[.030,.16],[0,.17]]
      .map(([x,y])=>new THREE.Vector2(x,y));
    const ear = new THREE.Mesh(new THREE.LatheGeometry(earPts,7), stdMat(0xd4a870,.75));
    ear.rotation.y = s>0 ? Math.PI/2 : -Math.PI/2;
    ear.position.set(s*.242,1.14,0); g.add(ear);
    // Inner helix tube
    const hc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.241,1.17,.02), new THREE.Vector3(s*.243,1.14,.04),
      new THREE.Vector3(s*.241,1.11,.02)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hc,4,.008,5,false), stdMat(0xc09060,.8)));
  }

  // 3D Layered eyes (sit just in front of the face texture for depth)
  for(const s of[-1,1]){
    // Eye socket recess
    const sock = new THREE.Mesh(new THREE.SphereGeometry(.062,10,8), stdMat(0xc08040,.9));
    sock.scale.set(1,.68,.45); sock.position.set(s*.093,1.18,.182); g.add(sock);
    // Sclera
    const wh = new THREE.Mesh(new THREE.SphereGeometry(.052,10,8), new THREE.MeshStandardMaterial({color:0xfefef5,roughness:.35}));
    wh.scale.set(1,.72,.52); wh.position.set(s*.092,1.18,.208); g.add(wh);
    // Iris
    const ir = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), stdMat(0x2244aa,.45));
    ir.scale.z = .38; ir.position.set(s*.092,1.18,.234); g.add(ir);
    // Pupil
    const pu = new THREE.Mesh(new THREE.SphereGeometry(.018,6,5), stdMat(0x060606,.3));
    pu.scale.z = .3; pu.position.set(s*.092,1.18,.244); g.add(pu);
    // Specular highlight
    const hi = new THREE.Mesh(new THREE.SphereGeometry(.009,5,4), glowMat(0xffffff,.8));
    hi.position.set(s*.082,1.191,.248); g.add(hi);
  }

  // Big gnome nose (LatheGeometry, 9 points)
  const nosePts = [[0,0],[0.028,.01],[0.048,.04],[0.055,.09],[0.052,.14],[0.045,.18],[0.030,.20],[0.012,.21],[0,.21]]
    .map(([x,y])=>new THREE.Vector2(x,y));
  const nose = new THREE.Mesh(new THREE.LatheGeometry(nosePts,10), stdMat(0xc89060,.72));
  nose.rotation.x = -Math.PI/2.1; nose.position.set(0,1.118,.225); g.add(nose);

  // Hat brim (LatheGeometry, 7 points, 14 sides)
  const brimPts = [[0,0],[0.20,0.00],[0.28,0.01],[0.34,0.02],[0.36,0.005],[0.34,-0.02],[0.30,-0.04]].map(([x,y])=>new THREE.Vector2(x,y));
  const brim = new THREE.Mesh(new THREE.LatheGeometry(brimPts,14), stdMat(0x2a1a08,0.9));
  brim.position.y = 1.30; g.add(brim);
  // Hat crown
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.20,0.24,10), stdMat(0x2a1a08,0.9));
  crown.position.y = 1.44; g.add(crown);
  // Hat feather (TubeGeometry)
  const featherCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14,1.56,0.02),new THREE.Vector3(0.18,1.68,-0.04),new THREE.Vector3(0.14,1.78,0.02),new THREE.Vector3(0.06,1.82,0.06)
  ]);
  const feather = new THREE.Mesh(new THREE.TubeGeometry(featherCurve,8,0.012,5,false), stdMat(0xddcc88,0.6));
  g.add(feather);

  // Beard (5x TubeGeometry curly strands)
  const beardColors = [0xd4aa66,0xc89850,0xbf9040,0xd4aa66,0xc89850];
  for(let i=0;i<5;i++){
    const bx = (i-2)*0.04;
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx,1.04,0.20),new THREE.Vector3(bx+0.03,0.96,0.22),
      new THREE.Vector3(bx-0.02,0.88,0.20),new THREE.Vector3(bx+0.02,0.80,0.18)
    ]);
    const b = new THREE.Mesh(new THREE.TubeGeometry(bCurve,8,0.014,5,false), stdMat(beardColors[i],0.8));
    g.add(b);
  }

  // Arm pivot groups
  const armRPivot = new THREE.Group();
  armRPivot.position.set(0.22,1.08,0);
  const armRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-0.02,0),new THREE.Vector3(0.04,-0.12,0.04),new THREE.Vector3(0.08,-0.22,0.10),new THREE.Vector3(0.14,-0.30,0.18)
  ]);
  const armR = new THREE.Mesh(new THREE.TubeGeometry(armRCurve,8,0.05,6,false), stdMat(0x8b5e3c,0.8));
  armR.castShadow = true;
  armRPivot.add(armR); g.add(armRPivot); parts.armR = armRPivot;

  const armLPivot = new THREE.Group();
  armLPivot.position.set(-0.22,1.08,0);
  const armLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-0.02,0),new THREE.Vector3(-0.04,-0.12,0.04),new THREE.Vector3(-0.08,-0.22,0.10),new THREE.Vector3(-0.14,-0.30,0.18)
  ]);
  const armL = new THREE.Mesh(new THREE.TubeGeometry(armLCurve,8,0.05,6,false), stdMat(0x8b5e3c,0.8));
  armL.castShadow = true;
  armLPivot.add(armL); g.add(armLPivot); parts.armL = armLPivot;

  // Rifle group
  const rifleGroup = new THREE.Group();
  rifleGroup.position.set(0.2,0.92,0.22);
  rifleGroup.rotation.y = 0.1;

  // Barrel (TubeGeometry, 10 segs, 7 sides)
  const barrelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),new THREE.Vector3(0.02,0,0.2),new THREE.Vector3(0.03,-0.01,0.4),
    new THREE.Vector3(0.02,-0.02,0.6),new THREE.Vector3(0,-0.03,0.82)
  ]);
  const barrel = new THREE.Mesh(new THREE.TubeGeometry(barrelCurve,10,0.022,7,false), metalMat(0x445566,0.3,0.85));
  rifleGroup.add(barrel);
  // Heat shroud
  const shroudCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0.05),new THREE.Vector3(0.02,0,0.22),new THREE.Vector3(0.03,-0.01,0.38)
  ]);
  const shroud = new THREE.Mesh(new THREE.TubeGeometry(shroudCurve,6,0.032,8,false), metalMat(0x334455,0.35,0.8));
  rifleGroup.add(shroud);
  // Stock (ExtrudeGeometry)
  const stockShape = new THREE.Shape();
  stockShape.moveTo(0,0); stockShape.lineTo(-0.26,0); stockShape.lineTo(-0.30,-0.08);
  stockShape.lineTo(-0.20,-0.15); stockShape.lineTo(-0.08,-0.12); stockShape.lineTo(0,-0.06); stockShape.closePath();
  const stock = new THREE.Mesh(new THREE.ExtrudeGeometry(stockShape,{depth:0.05,bevelEnabled:true,bevelSize:0.008,bevelThickness:0.008,bevelSegments:2}), stdMat(0x5c3e1a,0.8));
  stock.rotation.y = Math.PI/2; stock.position.set(-0.025,-0.02,-0.02); rifleGroup.add(stock);
  // Scope
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.26,8), metalMat(0x223344,0.3,0.9));
  scope.rotation.x = Math.PI/2; scope.position.set(0,0.055,0.18); rifleGroup.add(scope);
  // Scope lenses
  for(let lz of[0.04,0.30]){
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.04,8), stdMat(0x223355,0.2,0.2));
    lens.rotation.x = Math.PI/2; lens.position.set(0,0.055,lz); rifleGroup.add(lens);
  }
  // Trigger guard
  const tgCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-0.01,-0.04),new THREE.Vector3(0.01,-0.06,-0.02),
    new THREE.Vector3(0,-0.08,0.02),new THREE.Vector3(0,-0.04,0.06)
  ]);
  const tg = new THREE.Mesh(new THREE.TubeGeometry(tgCurve,6,0.008,5,false), metalMat(0x334455,0.3,0.8));
  rifleGroup.add(tg);
  // Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.10,0.04), metalMat(0x223344,0.35,0.8));
  mag.position.set(0,-0.08,0.10); rifleGroup.add(mag);
  // Bipod
  for(let s of[-1,1]){
    const bi = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.12,4), metalMat(0x334455,0.3,0.8));
    bi.position.set(s*0.028,  -0.06, 0.68); bi.rotation.z = s*0.5; rifleGroup.add(bi);
  }
  // Muzzle flash
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6), glowMat(0xffee44,4));
  muzzle.position.set(0,-0.04,0.9); muzzle.visible = false; rifleGroup.add(muzzle);
  parts.muzzle = muzzle;

  g.add(rifleGroup); parts.rifle = rifleGroup;

  parts.glowColor = 0xffcc00;
  parts.type = 'sniper';
  return {group:g, parts};
}

export function buildDragonKnight() {
  const g = new THREE.Group();
  const parts = {};

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.26,0.6,8), metalMat(0x8b0000,0.4,0.7));
  torso.position.y = 0.78; torso.castShadow = true; g.add(torso);
  // Chest plate overlay (ExtrudeGeometry)
  const cpShape = new THREE.Shape();
  cpShape.moveTo(-0.18,0); cpShape.bezierCurveTo(-0.22,0.1,-0.20,0.3,-0.12,0.40);
  cpShape.lineTo(0,0.44); cpShape.lineTo(0.12,0.40);
  cpShape.bezierCurveTo(0.20,0.3,0.22,0.1,0.18,0); cpShape.closePath();
  const chestPlate = new THREE.Mesh(new THREE.ExtrudeGeometry(cpShape,{depth:0.06,bevelEnabled:true,bevelSize:0.012,bevelThickness:0.012,bevelSegments:2}), metalMat(0xcc0000,0.25,0.9));
  chestPlate.rotation.x = -Math.PI/2; chestPlate.position.set(0,1.0,0.26); g.add(chestPlate);

  // Pauldrons (LatheGeometry, 10 points, 10 sides)
  const paulPts = [[0,0],[0.08,0.01],[0.18,0.04],[0.26,0.10],[0.30,0.18],[0.28,0.26],[0.22,0.32],[0.14,0.36],[0.06,0.36],[0,0.34]].map(([x,y])=>new THREE.Vector2(x,y));
  for(let s of[-1,1]){
    const paul = new THREE.Mesh(new THREE.LatheGeometry(paulPts,10), metalMat(0x8b0000,0.3,0.8));
    paul.rotation.z = s*(Math.PI/2+0.2); paul.position.set(s*0.38,1.16,0);
    paul.castShadow = true; g.add(paul);
  }

  // Helmet (LatheGeometry)
  const helmPts = [
    [0,0],[0.24,0.01],[0.26,0.05],[0.24,0.12],
    [0.23,0.20],[0.22,0.26],[0.18,0.30],[0.08,0.31],[0,0.32]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const helm = new THREE.Mesh(new THREE.LatheGeometry(helmPts,12), metalMat(0x991100,0.3,0.85));
  helm.position.y = 1.40; helm.castShadow = true; g.add(helm);
  // Visor slit (narrow eye gap)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.20,0.038,0.06), stdMat(0x030303,1.0));
  visor.position.set(0,1.56,0.24); g.add(visor);
  // Amber eyes visible through visor
  for(const s of[-1,1]){
    const eyeGL = new THREE.Mesh(new THREE.SphereGeometry(.022,6,5), glowMat(0xffaa22,2.5));
    eyeGL.position.set(s*.055,1.562,.27); g.add(eyeGL);
    const el = new THREE.PointLight(0xff8800,.35,.8);
    el.position.set(s*.055,1.562,.28); g.add(el);
  }
  // Lower face visible below helm (chin/jaw/mouth area)
  const lowerFace = new THREE.Mesh(new THREE.SphereGeometry(0.18,16,10), stdMat(0xc08048,.7));
  lowerFace.scale.set(1,.55,1); lowerFace.position.set(0,1.40,.12); g.add(lowerFace);
  // Chin cleft — small dark sphere indent
  const chinCleft = new THREE.Mesh(new THREE.SphereGeometry(.018,6,5), stdMat(0xa06830,1));
  chinCleft.scale.set(1,.7,.5); chinCleft.position.set(0,1.374,.228); g.add(chinCleft);
  // Chin strap geometry
  for(const s of[-1,1]){
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.24,1.56,.06), new THREE.Vector3(s*.20,1.46,.14),
      new THREE.Vector3(s*.12,1.38,.18), new THREE.Vector3(0,1.34,.20)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(strapCurve,6,.012,5,false), metalMat(0x991100,.35,.8)));
  }
  // Brow ridge above visor (inline)
  for(const s of[-1,1]){
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.01,1.618,.22), new THREE.Vector3(s*.05,1.622,.224),
      new THREE.Vector3(s*.09,1.615,.218), new THREE.Vector3(s*.13,1.600,.206)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(bc,5,.016,5,false), metalMat(0x991100,.35,.85)));
  }
  // Dragon crest
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.18,5), stdMat(0xcc2200,0.5,0.3));
  crest.position.set(0,1.78,0); crest.rotation.x = -0.2; g.add(crest);
  const crest2 = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.12,4), stdMat(0xdd3300,0.5,0.3));
  crest2.position.set(0,1.85,-0.04); crest2.rotation.x = -0.1; g.add(crest2);

  // Legs (armored, octagonal)
  for(let s of[-1,1]){
    const legU = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.10,0.28,8), metalMat(0x771100,0.35,0.75));
    legU.position.set(s*0.12,0.34,0); legU.castShadow = true; g.add(legU);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.10,0.26,8), metalMat(0x660f00,0.4,0.7));
    legL.position.set(s*0.12,0.06,0.02); legL.castShadow = true;
    if(s===1){parts.legR=legL;}else{parts.legL=legL;} g.add(legL);
    // Knee guard
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6), metalMat(0xaa1100,0.25,0.9));
    knee.position.set(s*0.12,0.20,0.06); g.add(knee);
  }

  // Arm pivots
  const armRPivot = new THREE.Group();
  armRPivot.position.set(0.26,1.12,0);
  const armRM = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.34,8), metalMat(0x881100,0.35,0.75));
  armRM.position.set(0.12,-0.17,0); armRM.rotation.z = 0.3;
  armRPivot.add(armRM); g.add(armRPivot); parts.armR = armRPivot;

  const armLPivot = new THREE.Group();
  armLPivot.position.set(-0.26,1.12,0);
  const armLM = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.34,8), metalMat(0x881100,0.35,0.75));
  armLM.position.set(-0.12,-0.17,0); armLM.rotation.z = -0.3;
  armLPivot.add(armLM); g.add(armLPivot); parts.armL = armLPivot;

  // Sword group — child of armRPivot so it swings with the arm
  // armRPivot is at world (0.26, 1.12, 0); hand is ~(0.17, -0.32, 0.12) in pivot space
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0.19, -0.23, 0.22);
  swordGroup.rotation.z = -0.15; // lean outward (right) — blade clears body
  // Blade (ExtrudeGeometry tapered, points up Y-axis)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.04,0); bladeShape.lineTo(-0.04,0.5); bladeShape.bezierCurveTo(-0.04,0.72,-0.02,0.84,0,0.90);
  bladeShape.bezierCurveTo(0.02,0.84,0.04,0.72,0.04,0.5); bladeShape.lineTo(0.04,0); bladeShape.closePath();
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:0.014,bevelEnabled:true,bevelSize:0.006,bevelThickness:0.006,bevelSegments:2}), metalMat(0xddddcc,0.15,0.95));
  blade.position.z = -0.007; swordGroup.add(blade);
  // Crossguard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.04,0.04), metalMat(0xbb6600,0.3,0.8));
  guard.position.y = 0.02; swordGroup.add(guard);
  // Handle
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.18,6), stdMat(0x3a1a08,0.9));
  handle.position.y = -0.10; swordGroup.add(handle);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04,8,6), metalMat(0xbb6600,0.3,0.8));
  pommel.position.y = -0.20; swordGroup.add(pommel);
  armRPivot.add(swordGroup); parts.swordGroup = swordGroup;

  // Shield (kite shape, ExtrudeGeometry) — child of armLPivot
  // Left hand endpoint in pivot-local: (-0.170, -0.332, 0)
  // Shield top (y=0 local) placed at hand, hangs forward-left
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.14, -0.33, 0.22);
  shieldGroup.rotation.y = -0.3; // face outward (left side)
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0,0);
  shieldShape.bezierCurveTo(0.28,0,0.30,-0.18,0.30,-0.28);
  shieldShape.bezierCurveTo(0.30,-0.44,0.16,-0.58,0,-0.68);
  shieldShape.bezierCurveTo(-0.16,-0.58,-0.30,-0.44,-0.30,-0.28);
  shieldShape.bezierCurveTo(-0.30,-0.18,-0.28,0,0,0);
  const shield = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape,{depth:0.08,bevelEnabled:true,bevelSize:0.02,bevelThickness:0.02,bevelSegments:3}), metalMat(0x992200,0.3,0.8));
  shieldGroup.add(shield);
  const shieldCrest = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6), metalMat(0xffaa00,0.2,0.9));
  shieldCrest.position.set(0,-0.24,0.08); shieldGroup.add(shieldCrest);
  armLPivot.add(shieldGroup); parts.shieldGroup = shieldGroup;

  // Cape (PlaneGeometry with wave)
  const capeGeo = new THREE.PlaneGeometry(0.5,0.8,4,8);
  const capePos = capeGeo.attributes.position;
  for(let i=0;i<capePos.count;i++){
    const x=capePos.getX(i), y=capePos.getY(i);
    capePos.setZ(i, Math.sin(x*3)*0.03+Math.sin(y*2)*0.04);
  }
  capeGeo.computeVertexNormals();
  const cape = new THREE.Mesh(capeGeo, stdMat(0x880000,0.9,0));
  cape.position.set(0,0.88,-0.28); cape.castShadow = true;
  g.add(cape); parts.cape = cape;

  parts.glowColor = 0xff4400;
  parts.type = 'dragonknight';
  return {group:g, parts};
}

export function buildShadowFiend() {
  const g = new THREE.Group();
  const parts = {};

  // Body (slightly hunched)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.55,8), stdMat(0x1a0a0a,0.95));
  body.position.y = 0.68; body.rotation.x = 0.15; body.castShadow = true; g.add(body);
  // Torso detail
  const chestDetail = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.16,0.3,8), stdMat(0x220808,0.9));
  chestDetail.position.set(0,0.90,0.04); g.add(chestDetail);

  // Head (high-poly, angular demon)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.20,20,16), stdMat(0x140606,.96));
  head.scale.set(1,1.04,.94); head.position.y = 1.28; head.castShadow = true; g.add(head);

  // Forehead marking — raised ridge scar (TubeGeometry)
  const scarCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.04,1.38,.175), new THREE.Vector3(0,1.41,.185), new THREE.Vector3(.04,1.38,.175)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(scarCurve,5,.009,5,false), stdMat(0x3a0808,.95)));

  // Angular cheekbone ridges
  for(const s of[-1,1]){
    const cc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.14,1.34,.12), new THREE.Vector3(s*.18,1.28,.14),
      new THREE.Vector3(s*.19,1.22,.10), new THREE.Vector3(s*.15,1.17,.07)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cc,5,.014,5,false), stdMat(0x220a0a,.9)));
  }

  // Deep-set glowing eyes (3D layered)
  for(const s of[-1,1]){
    // Dark socket recess
    const sock = new THREE.Mesh(new THREE.SphereGeometry(.058,10,8), stdMat(0x0a0202,1));
    sock.scale.set(1,.62,.55); sock.position.set(s*.085,1.315,.135); g.add(sock);
    // Red iris glow
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.038,8,6), glowMat(0xff2200,4.5));
    iris.position.set(s*.085,1.315,.182); g.add(iris);
    // Slit pupil (scaled dark disk)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.024,6,5), stdMat(0x030000,.2));
    pupil.scale.set(.26,1,.3); pupil.position.set(s*.085,1.315,.198); g.add(pupil);
    // Intense point light
    const el = new THREE.PointLight(0xff2200,.55,1.4);
    el.position.set(s*.085,1.315,.21); g.add(el);
  }

  // Angular brow ridges (demonic, sharp-angled)
  for(const s of[-1,1]){
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.04,1.40,.16), new THREE.Vector3(s*.09,1.42,.16),
      new THREE.Vector3(s*.15,1.38,.11), new THREE.Vector3(s*.17,1.32,.07)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(bc,6,.020,5,false), stdMat(0x180505,.95)));
  }

  // Visible fang geometry (protruding below lip line)
  for(const s of[-1,1]){
    const fangCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*.045,1.19,.18), new THREE.Vector3(s*.048,1.14,.185),
      new THREE.Vector3(s*.042,1.09,.175)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(fangCurve,5,.013,5,false), stdMat(0xd0c0b0,.7)));
  }

  // Curved horns (TubeGeometry along curve)
  for(let s of[-1,1]){
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*0.08,1.44,0.02),
      new THREE.Vector3(s*0.14,1.52,-0.04),
      new THREE.Vector3(s*0.18,1.60,-0.02),
      new THREE.Vector3(s*0.16,1.68,0.04),
      new THREE.Vector3(s*0.10,1.72,0.08)
    ]);
    const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve,8,0.024,6,false), stdMat(0x220808,0.8));
    g.add(horn);
    // Horn tip
    const hornTip = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(s*0.10,1.72,0.08),new THREE.Vector3(s*0.06,1.78,0.10)]),
      4,0.008,5,false), stdMat(0x330a0a,0.75));
    g.add(hornTip);
  }

  // Wings (ExtrudeGeometry with finger detail)
  for(let s of[-1,1]){
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0,0);
    wingShape.bezierCurveTo(s*0.2,0.35,s*0.7,0.42,s*1.05,0.22);
    wingShape.lineTo(s*1.18,0.05);
    wingShape.bezierCurveTo(s*1.05,-0.28,s*0.88,-0.32,s*0.90,-0.52);
    wingShape.lineTo(s*0.80,-0.62);
    wingShape.bezierCurveTo(s*0.76,-0.46,s*0.68,-0.42,s*0.70,-0.60);
    wingShape.lineTo(s*0.60,-0.70);
    wingShape.bezierCurveTo(s*0.56,-0.52,s*0.48,-0.46,s*0.44,-0.60);
    wingShape.lineTo(s*0.34,-0.68);
    wingShape.bezierCurveTo(s*0.24,-0.48,s*0.10,-0.28,0,0);
    const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape,{depth:0.02,bevelEnabled:true,bevelSize:0.006,bevelThickness:0.006,bevelSegments:2}), transMat(0x330000,0.82));
    wing.position.set(0,1.10,0.02); wing.rotation.y = s*0.15;
    if(s===1){parts.wingR=wing;}else{parts.wingL=wing;}
    g.add(wing);

    // Wing ribs (TubeGeometry)
    const ribEnds = [[s*1.1,0.12],[s*0.82,-0.60],[s*0.62,-0.68],[s*0.36,-0.66]];
    for(let re of ribEnds){
      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,1.10,0.02),
        new THREE.Vector3(re[0]*0.5,(1.10+re[1]*0.5)*0.95,0.03),
        new THREE.Vector3(re[0],1.10+re[1],0.02)
      ]);
      const rib = new THREE.Mesh(new THREE.TubeGeometry(ribCurve,6,0.01,5,false), stdMat(0x1a0000,0.9));
      g.add(rib);
    }
  }

  // Arm pivots
  for(let s of[-1,1]){
    const pivot = new THREE.Group();
    pivot.position.set(s*0.20,1.08,0);
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),new THREE.Vector3(s*0.04,-0.12,0.04),
      new THREE.Vector3(s*0.08,-0.22,0.10),new THREE.Vector3(s*0.14,-0.32,0.16)
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve,8,0.044,6,false), stdMat(0x1a0808,0.9));
    arm.castShadow = true; pivot.add(arm); g.add(pivot);
    if(s===1){parts.armR=pivot;}else{parts.armL=pivot;}

    // Crescent blade on each arm
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0,0);
    bladeShape.bezierCurveTo(-0.04,0.2,-0.06,0.45,-0.02,0.70);
    bladeShape.lineTo(0.02,0.72);
    bladeShape.bezierCurveTo(0.08,0.50,0.10,0.25,0.05,0);
    bladeShape.closePath();
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:0.015,bevelEnabled:true,bevelSize:0.006,bevelThickness:0.006,bevelSegments:2}), metalMat(0x220000,0.2,0.9));
    blade.position.set(s*0.22,0.64,0.16); blade.rotation.z = s*0.2;
    g.add(blade);
    // Blade glow
    const bladeGlowShape = new THREE.Shape();
    bladeGlowShape.moveTo(0.005,0.02);
    bladeGlowShape.bezierCurveTo(-0.02,0.22,-0.03,0.44,0.0,0.65);
    bladeGlowShape.lineTo(0.02,0.66);
    bladeGlowShape.bezierCurveTo(0.04,0.46,0.05,0.22,0.02,0.02);
    bladeGlowShape.closePath();
    const bladeGlow = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeGlowShape,{depth:0.008,bevelEnabled:false}), glowMat(0xff2200,1.5));
    bladeGlow.position.set(s*0.22,0.64,0.165); bladeGlow.rotation.z = s*0.2;
    g.add(bladeGlow);
  }

  // Soul orbs (12 IcosahedronGeometry orbiting)
  parts.soulOrbs = [];
  for(let i=0;i<12;i++){
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065,0), glowMat(0xff4400,2.5));
    orb.visible = i < 8;
    orb.userData.angle = (i/12)*Math.PI*2;
    orb.userData.radius = 0.55+Math.sin(i)*0.12;
    orb.userData.height = 0.8+Math.sin(i*0.7)*0.3;
    g.add(orb); parts.soulOrbs.push(orb);
  }

  // Dark mist at feet
  for(let i=0;i<8;i++){
    const mist = new THREE.Mesh(new THREE.SphereGeometry(0.06+Math.random()*0.04,6,4), transMat(0x220011,0.3));
    mist.position.set(Math.cos(i/8*Math.PI*2)*0.3, 0.08, Math.sin(i/8*Math.PI*2)*0.3);
    g.add(mist);
  }

  parts.glowColor = 0xff2200;
  parts.type = 'shadowfiend';
  return {group:g, parts};
}

export function buildWindrunner() {
  const g = new THREE.Group();
  const parts = {};

  // Body (LatheGeometry slim elven, 12 pts, 12 sides)
  const bodyPoints = [
    [0.14,0.00],[0.16,0.04],[0.18,0.12],[0.20,0.22],
    [0.18,0.35],[0.16,0.48],[0.15,0.58],[0.14,0.66],
    [0.16,0.72],[0.14,0.76],[0.10,0.78],[0,0.79]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyPoints,12), stdMat(0x2d4a1e,0.8));
  body.castShadow = true; g.add(body);

  // Leaf armor pieces on torso
  for(let i=0;i<3;i++){
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0,0); leafShape.bezierCurveTo(0.06,0.04,0.08,0.10,0.04,0.18);
    leafShape.lineTo(0,0.20); leafShape.lineTo(-0.04,0.18);
    leafShape.bezierCurveTo(-0.08,0.10,-0.06,0.04,0,0);
    const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape,{depth:0.012,bevelEnabled:true,bevelSize:0.005,bevelThickness:0.005,bevelSegments:2}), stdMat(0x3a6622,0.7));
    const a = (i/3)*Math.PI*2;
    leaf.position.set(Math.sin(a)*0.16, 0.50+i*0.06, Math.cos(a)*0.16);
    leaf.rotation.y = a; leaf.rotation.z = 0.2;
    g.add(leaf);
  }

  // Legs (TubeGeometry slim)
  for(let s of[-1,1]){
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s*0.10,0.38,0),new THREE.Vector3(s*0.10,0.20,0.02),
      new THREE.Vector3(s*0.10,0.05,0.01),new THREE.Vector3(s*0.10,0.0,0)
    ]);
    const leg = new THREE.Mesh(new THREE.TubeGeometry(legCurve,8,0.044,6,false), stdMat(0x2d4a1e,0.8));
    leg.castShadow = true;
    if(s===1){parts.legR=leg;}else{parts.legL=leg;} g.add(leg);
    // Boot (ExtrudeGeometry elegant pointy)
    const bootShape = new THREE.Shape();
    bootShape.moveTo(-0.06,0); bootShape.lineTo(-0.07,0.10); bootShape.bezierCurveTo(-0.06,0.16,0.04,0.16,0.12,0.12);
    bootShape.lineTo(0.16,0.06); bootShape.lineTo(0.14,0); bootShape.closePath();
    const boot = new THREE.Mesh(new THREE.ExtrudeGeometry(bootShape,{depth:0.10,bevelEnabled:true,bevelSize:0.01,bevelThickness:0.01,bevelSegments:2}), stdMat(0x1a300e,0.9));
    boot.rotation.y = s>0?Math.PI/2:-Math.PI/2; boot.position.set(s*0.10,-0.04,0); g.add(boot);
  }

  // Head (high-poly, slim elven)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19,20,16), stdMat(0xddc49a,.68));
  head.scale.set(.96,1.04,.96); head.position.y = 1.02; head.castShadow = true; g.add(head);

  // Elven nose bridge — slim tube
  const wrnCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.07,.168), new THREE.Vector3(0,1.04,.172), new THREE.Vector3(0,1.01,.170)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(wrnCurve,4,.009,5,false), stdMat(0xd4b888,.7)));
  // Cupid bow lip — two small half-sphere bumps
  for(const s of[-1,1]){
    const lip = new THREE.Mesh(new THREE.SphereGeometry(.014,7,5), stdMat(0xc89870,.75));
    lip.scale.set(1,.7,.7); lip.position.set(s*.018,.978,.168); g.add(lip);
  }

  // Hood (LatheGeometry partial dome)
  const hoodPts = [[0,.22],[.06,.22],[.12,.20],[.17,.16],[.18,.10],[.16,.04],[.10,.01],[0,0]]
    .map(([x,y])=>new THREE.Vector2(x,y));
  const hood = new THREE.Mesh(new THREE.LatheGeometry(hoodPts,8), stdMat(0x1e3a12,.85));
  hood.position.y = 0.98; g.add(hood);
  // Hood point
  const hoodTip = new THREE.Mesh(new THREE.ConeGeometry(.07,.22,6), stdMat(0x1e3a12,.85));
  hoodTip.position.set(0,1.28,0); hoodTip.rotation.z = .1; g.add(hoodTip);

  // Elven ears (inline ExtrudeGeometry pointed shape)
  for(const s of[-1,1]){
    const earShape = new THREE.Shape();
    earShape.moveTo(0,0); earShape.lineTo(0,.10); earShape.bezierCurveTo(.01,.16,.02,.20,0,.26);
    earShape.bezierCurveTo(-.02,.20,-.01,.16,0,.10); earShape.lineTo(0,0); earShape.closePath();
    const ear = new THREE.Mesh(
      new THREE.ExtrudeGeometry(earShape,{depth:.028,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2}),
      stdMat(0xddc49a,.7)
    );
    ear.rotation.y = s>0 ? Math.PI/2 : -Math.PI/2;
    ear.position.set(s*.186,1.00,.0); g.add(ear);
  }

  // 3D Layered eyes (large, teal)
  for(const s of[-1,1]){
    // Eye socket area (slightly recessed)
    const sock = new THREE.Mesh(new THREE.SphereGeometry(.048,10,8), stdMat(0xc8a878,.75));
    sock.scale.set(1.1,.65,.45); sock.position.set(s*.072,1.044,.155); g.add(sock);
    // Sclera (white)
    const wh = new THREE.Mesh(new THREE.SphereGeometry(.040,10,8), new THREE.MeshStandardMaterial({color:0xfefef8,roughness:.3}));
    wh.scale.set(1.1,.70,.48); wh.position.set(s*.071,1.044,.172); g.add(wh);
    // Iris (large teal, elven)
    const ir = new THREE.Mesh(new THREE.SphereGeometry(.028,8,6), glowMat(0x00cc88,.8));
    ir.scale.set(1,1.1,.4); ir.position.set(s*.071,1.044,.188); g.add(ir);
    // Pupil
    const pu = new THREE.Mesh(new THREE.SphereGeometry(.014,6,5), stdMat(0x040a06,.3));
    pu.scale.z = .32; pu.position.set(s*.071,1.044,.196); g.add(pu);
    // Specular
    const hi = new THREE.Mesh(new THREE.SphereGeometry(.007,5,4), glowMat(0xffffff,.7));
    hi.position.set(s*.063,1.053,.200); g.add(hi);
    // Subtle eye glow light
    const el = new THREE.PointLight(0x44ffcc,.25,.9);
    el.position.set(s*.071,1.044,.21); g.add(el);
  }
  // Ponytail
  const ponyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.14,-0.16),new THREE.Vector3(0.04,0.98,-0.22),
    new THREE.Vector3(-0.02,0.80,-0.24),new THREE.Vector3(0.04,0.64,-0.20)
  ]);
  const ponytail = new THREE.Mesh(new THREE.TubeGeometry(ponyCurve,10,0.032,6,false), stdMat(0x8b4513,0.7));
  g.add(ponytail);
  // Front hair strands
  for(let i=0;i<3;i++){
    const hx = (i-1)*0.06;
    const hCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hx,1.14,0.16),new THREE.Vector3(hx+0.02,1.06,0.18),new THREE.Vector3(hx-0.01,0.98,0.17)
    ]);
    const strand = new THREE.Mesh(new THREE.TubeGeometry(hCurve,5,0.010,4,false), stdMat(0x8b4513,0.7));
    g.add(strand);
  }

  // Arm pivots
  for(let s of[-1,1]){
    const pivot = new THREE.Group();
    pivot.position.set(s*0.18,0.90,0);
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),new THREE.Vector3(s*0.04,-0.10,0.04),
      new THREE.Vector3(s*0.08,-0.20,0.08),new THREE.Vector3(s*0.12,-0.30,0.12)
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve,8,0.038,6,false), stdMat(0xddc49a,0.7));
    arm.castShadow = true; pivot.add(arm); g.add(pivot);
    if(s===1){parts.armR=pivot;}else{parts.armL=pivot;}
  }

  // Longbow (TubeGeometry along arc) — most important
  const bowGroup = new THREE.Group();
  bowGroup.position.set(0.26,0.22,0.08);
  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-0.55,0),new THREE.Vector3(0.12,-0.35,0.04),
    new THREE.Vector3(0.16,0,0.06),new THREE.Vector3(0.12,0.35,0.04),
    new THREE.Vector3(0,0.55,0),
  ]);
  const bow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve,16,0.022,6,false), stdMat(0x5c3a1e,0.7));
  bowGroup.add(bow);
  // Bow recurve tips
  for(let s of[-1,1]){
    const tipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,s*0.55,0),new THREE.Vector3(-0.04,s*0.60,0.02),new THREE.Vector3(-0.06,s*0.58,0.04)
    ]);
    const tip = new THREE.Mesh(new THREE.TubeGeometry(tipCurve,4,0.014,5,false), stdMat(0x5c3a1e,0.7));
    bowGroup.add(tip);
  }
  // Bowstring (thin TubeGeometry)
  const strCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06,-0.58,0.04),new THREE.Vector3(-0.04,0,0.08),new THREE.Vector3(-0.06,0.58,0.04)
  ]);
  const str = new THREE.Mesh(new THREE.TubeGeometry(strCurve,6,0.004,4,false), stdMat(0xddccaa,0.5));
  bowGroup.add(str);
  // Bow rune glow
  const bowGlow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve,16,0.026,6,false), glowMat(0x44ff88,0.3));
  bowGroup.add(bowGlow);
  g.add(bowGroup); parts.bow = bowGroup;

  // Quiver (LatheGeometry)
  const quiverPts = [[0,0],[0.048,0.02],[0.058,0.10],[0.056,0.20],[0.052,0.30],[0.06,0.34],[0.08,0.36],[0.08,0.38]].map(([x,y])=>new THREE.Vector2(x,y));
  const quiver = new THREE.Mesh(new THREE.LatheGeometry(quiverPts,8), stdMat(0x3d2a0e,0.85));
  quiver.position.set(-0.20,0.60,-0.12); quiver.rotation.z = 0.2; g.add(quiver);
  // Arrows in quiver
  for(let i=0;i<3;i++){
    const arw = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.38,5), stdMat(0x8b5c1e,0.7));
    arw.position.set(-0.20+i*0.015,0.82,-0.12); arw.rotation.z = 0.2+i*0.05; g.add(arw);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.012,0.04,5), metalMat(0xaaaaaa,0.2,0.9));
    head.position.set(-0.20+i*0.015,1.02,-0.12); head.rotation.z = 0.2+i*0.05; g.add(head);
  }

  // Cloak (PlaneGeometry with flutter)
  const cloakGeo = new THREE.PlaneGeometry(0.4,0.7,4,8);
  const cloakPos = cloakGeo.attributes.position;
  for(let i=0;i<cloakPos.count;i++){
    const x=cloakPos.getX(i), y=cloakPos.getY(i);
    cloakPos.setZ(i, Math.sin(x*4)*0.02+Math.sin(y*3)*0.03);
  }
  cloakGeo.computeVertexNormals();
  const cloak = new THREE.Mesh(cloakGeo, stdMat(0x1e3a12,0.85));
  cloak.position.set(0,0.60,-0.20); g.add(cloak);

  // Wind wisps
  parts.wisps = [];
  for(let i=0;i<4;i++){
    const wisp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06,0), glowMat(0x44ffcc,2.5));
    wisp.userData.angle = (i/4)*Math.PI*2;
    wisp.userData.radius = 0.5;
    wisp.userData.height = 0.8+i*0.2;
    g.add(wisp); parts.wisps.push(wisp);
  }

  parts.glowColor = 0x88ffcc;
  parts.type = 'windrunner';
  return {group:g, parts};
}
