// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
export const MAP_SIZE = 100;
export const ZOOM = 22;
export const CREEP_SPAWN_INTERVAL = 30;
export const GOLD_TICK = 3;
export const GOLD_PER_TICK = 3;

export const HERO_DEFS = {
  lich: {name:'LICH',color:0x8844cc,headColor:0x5522aa,team:'scourge',hp:454,mp:403,move:8,range:12,dmgMin:49,dmgMax:57,armor:1,atkSpd:0.9,
    skills:['Frost Nova','Dark Ritual','Chain Frost','Frost Armor']},
  sniper: {name:'SNIPER',color:0x44aa44,headColor:0xaacc88,team:'sentinel',hp:492,mp:195,move:8,range:14,dmgMin:35,dmgMax:45,armor:2,atkSpd:1.1,
    skills:['Shrapnel','Headshot','Aim','Assassinate']}
};

export const WAYPOINTS = {
  scourge:{
    top:[{x:10,z:85},{x:30,z:85},{x:50,z:85},{x:70,z:85},{x:85,z:85},{x:90,z:85}],
    mid:[{x:10,z:10},{x:25,z:25},{x:40,z:40},{x:50,z:50},{x:65,z:65},{x:80,z:80},{x:90,z:90}],
    bot:[{x:10,z:15},{x:30,z:15},{x:50,z:15},{x:70,z:15},{x:85,z:15},{x:90,z:15}]
  },
  sentinel:{
    top:[{x:90,z:85},{x:70,z:85},{x:50,z:85},{x:30,z:85},{x:15,z:85},{x:10,z:85}],
    mid:[{x:90,z:90},{x:75,z:75},{x:60,z:60},{x:50,z:50},{x:35,z:35},{x:20,z:20},{x:10,z:10}],
    bot:[{x:90,z:15},{x:70,z:15},{x:50,z:15},{x:30,z:15},{x:15,z:15},{x:10,z:15}]
  }
};

export const TOWER_DEFS = [
  {team:'scourge',lane:'top',tier:1,x:22,z:85,hp:900},
  {team:'scourge',lane:'top',tier:2,x:14,z:85,hp:1200},
  {team:'scourge',lane:'mid',tier:1,x:22,z:22,hp:900},
  {team:'scourge',lane:'mid',tier:2,x:15,z:15,hp:1200},
  {team:'scourge',lane:'bot',tier:1,x:22,z:15,hp:900},
  {team:'scourge',lane:'bot',tier:2,x:14,z:15,hp:1200},
  {team:'scourge',lane:'base',tier:3,x:12,z:12,hp:1400},
  {team:'scourge',lane:'base',tier:3,x:12,z:8,hp:1400},
  {team:'scourge',lane:'ancient',tier:4,x:8,z:8,hp:4750},
  {team:'sentinel',lane:'top',tier:1,x:78,z:85,hp:900},
  {team:'sentinel',lane:'top',tier:2,x:86,z:85,hp:1200},
  {team:'sentinel',lane:'mid',tier:1,x:78,z:78,hp:900},
  {team:'sentinel',lane:'mid',tier:2,x:85,z:85,hp:1200},
  {team:'sentinel',lane:'bot',tier:1,x:78,z:15,hp:900},
  {team:'sentinel',lane:'bot',tier:2,x:86,z:15,hp:1200},
  {team:'sentinel',lane:'base',tier:3,x:88,z:88,hp:1400},
  {team:'sentinel',lane:'base',tier:3,x:88,z:92,hp:1400},
  {team:'sentinel',lane:'ancient',tier:4,x:92,z:92,hp:4750}
];

export const SKILL_COSTS = {
  lich:{Q:[100,115,125,140],W:[25,25,25,25],E:[200,290,380,380],R:[0,0,0,0]},
  sniper:{Q:[120,120,120,120],W:[0,0,0,0],E:[0,0,0,0],R:[200,200,200,200]}
};

export const SKILL_CDS = {
  lich:{Q:6,W:30,E:145,R:0},
  sniper:{Q:22,W:0,E:0,R:20}
};
