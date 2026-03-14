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
    skills:['Shrapnel','Headshot','Aim','Assassinate']},
  dragon_knight: {name:'DRAGON KNIGHT',color:0xdd6622,headColor:0xcc4400,team:'sentinel',hp:625,mp:195,move:8,range:2.5,dmgMin:53,dmgMax:59,armor:3,atkSpd:0.75,
    skills:['Dragon Blood','Dragon Tail','Breathe Fire','Elder Dragon Form']},
  shadow_fiend: {name:'SHADOW FIEND',color:0xff2200,headColor:0x880000,team:'scourge',hp:530,mp:260,move:9,range:2.5,dmgMin:51,dmgMax:57,armor:2,atkSpd:1.1,
    skills:['Shadowraze','Necromastery','Dark Presence','Requiem of Souls']},
  windrunner: {name:'WINDRUNNER',color:0x44bb77,headColor:0x228855,team:'sentinel',hp:492,mp:234,move:9,range:13,dmgMin:36,dmgMax:46,armor:1,atkSpd:1.1,
    skills:['Shackleshot','Powershot','Windrun','Focus Fire']}
};

export const WAYPOINTS = {
  scourge:{
    top:[{x:10,z:10},{x:10,z:50},{x:10,z:82},{x:22,z:85},{x:50,z:85},{x:78,z:85},{x:90,z:85},{x:90,z:90}],
    mid:[{x:10,z:10},{x:25,z:25},{x:40,z:40},{x:50,z:50},{x:65,z:65},{x:80,z:80},{x:90,z:90}],
    bot:[{x:10,z:10},{x:18,z:15},{x:50,z:15},{x:82,z:15},{x:90,z:18},{x:90,z:50},{x:90,z:90}]
  },
  sentinel:{
    top:[{x:90,z:90},{x:90,z:85},{x:78,z:85},{x:50,z:85},{x:22,z:85},{x:10,z:82},{x:10,z:50},{x:10,z:10}],
    mid:[{x:90,z:90},{x:75,z:75},{x:60,z:60},{x:50,z:50},{x:35,z:35},{x:20,z:20},{x:10,z:10}],
    bot:[{x:90,z:90},{x:90,z:50},{x:90,z:18},{x:82,z:15},{x:50,z:15},{x:18,z:15},{x:10,z:15},{x:10,z:10}]
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

export const NEUTRAL_CAMPS = [
  {id:'nc1', x:28, z:55, tier:1, leash:12},
  {id:'nc2', x:32, z:70, tier:1, leash:12},
  {id:'nc3', x:18, z:42, tier:2, leash:14},
  {id:'nc4', x:72, z:45, tier:1, leash:12},
  {id:'nc5', x:68, z:30, tier:1, leash:12},
  {id:'nc6', x:82, z:58, tier:2, leash:14},
];

export const BARRACKS_DEFS = [
  {team:'scourge', lane:'top', x:13, z:88, hp:1000},
  {team:'scourge', lane:'mid', x:12, z:14, hp:1000},
  {team:'scourge', lane:'bot', x:13, z:12, hp:1000},
  {team:'sentinel', lane:'top', x:87, z:88, hp:1000},
  {team:'sentinel', lane:'mid', x:88, z:86, hp:1000},
  {team:'sentinel', lane:'bot', x:87, z:12, hp:1000},
];

export const SKILL_COSTS = {
  lich:{Q:[100,115,125,140],W:[25,25,25,25],E:[200,290,380,380],R:[0,0,0,0]},
  sniper:{Q:[120,120,120,120],W:[0,0,0,0],E:[0,0,0,0],R:[200,200,200,200]},
  dragon_knight:{Q:[0,0,0,0],W:[100,100,100,100],E:[100,115,115,130],R:[0,0,0,0]},
  shadow_fiend:{Q:[75,75,75,75],W:[0,0,0,0],E:[0,0,0,0],R:[150,175,200,200]},
  windrunner:{Q:[90,100,110,120],W:[90,100,110,120],E:[100,100,100,100],R:[200,275,350,350]}
};

export const SKILL_CDS = {
  lich:{Q:6,W:30,E:145,R:0},
  sniper:{Q:22,W:0,E:0,R:20},
  dragon_knight:{Q:0,W:9,E:15,R:100},
  shadow_fiend:{Q:10,W:0,E:0,R:120},
  windrunner:{Q:15,W:12,E:15,R:60}
};
