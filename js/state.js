// ─── GAME STATE ────────────────────────────────────────────────────────────────
export const G = {
  phase: 'lobby', time: 0, gold: 625, kills: 0, deaths: 0, assists: 0,
  xp: 0, level: 1, xpNext: 50,
  skillLevels: {Q:1,W:1,E:1,R:1}, skillCDs: {Q:0,W:0,E:0,R:0},
  pickedHero: null, playerHero: null, aiHero: null,
  playerSide: 'scourge', teamSize: 1,
  creeps: [], towers: [], barracks: [], projectiles: [], particles: [], effects: [],
  neutralCamps: [],
  megaLanes: {scourge:{top:false,mid:false,bot:false}, sentinel:{top:false,mid:false,bot:false}},
  lastSpawn: 0, goldTimer: 0, aiCastTimer: 0,
  attackMode: false, targetingSkill: null,
  firstBlood: false, killStreak: 0
};
