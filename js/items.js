// ─── ITEM SYSTEM ────────────────────────────────────────────────────────────────
import { G } from './state.js';
import { applyDamage, getEnemiesOf } from './combat.js';
import { spawnParticles } from './particles.js';
import { playSound } from './audio.js';
import { floatDamage } from './combat.js';

export const ITEM_DEFS = {
  // ── Basic Components ──────────────────────────────────────────────────────────
  boots_of_speed:    { id:'boots_of_speed',    name:'Boots of Speed',    short:'BOOTS',    cost:500,  components:[], bonuses:{move:2},                        color:'#cc9922' },
  iron_branch:       { id:'iron_branch',       name:'Iron Branch',       short:'BRANCH',   cost:53,   components:[], bonuses:{maxHp:30,maxMp:30,dmgMin:2,dmgMax:2}, color:'#228844' },
  blades_of_attack:  { id:'blades_of_attack',  name:'Blades of Attack',  short:'BLADES',   cost:500,  components:[], bonuses:{dmgMin:12,dmgMax:12},            color:'#cc4422' },
  ring_of_protection:{ id:'ring_of_protection',name:'Ring of Protection',short:'RING',     cost:175,  components:[], bonuses:{armor:2},                        color:'#aaaacc' },
  magic_charm:       { id:'magic_charm',       name:'Magic Charm',       short:'CHARM',    cost:175,  components:[], bonuses:{maxMp:150},                      color:'#4466ff' },
  vitality_gem:      { id:'vitality_gem',      name:'Vitality Gem',      short:'VITALITY', cost:350,  components:[], bonuses:{maxHp:200},                      color:'#44cc44' },
  // ── Upgrade Items ─────────────────────────────────────────────────────────────
  power_boots:  { id:'power_boots',  name:'Power Boots',    short:'P.BOOTS',  cost:450,  components:['boots_of_speed','vitality_gem'],           bonuses:{move:3,maxHp:250},                      color:'#ffcc22' },
  arcane_boots: { id:'arcane_boots', name:'Arcane Boots',   short:'A.BOOTS',  cost:550,  components:['boots_of_speed','magic_charm'],            bonuses:{move:3,maxMp:150},   activeId:'mana_restore', activeCD:55, color:'#4488ff' },
  blink_dagger: { id:'blink_dagger', name:'Blink Dagger',   short:'BLINK',    cost:2150, components:['iron_branch','iron_branch'],               bonuses:{maxHp:60,maxMp:60,dmgMin:4,dmgMax:4}, activeId:'blink', activeCD:15, color:'#aa44ff' },
  lifesteal_blade:{ id:'lifesteal_blade',name:'Lifesteal Blade',short:'LIFESTEAL',cost:600, components:['blades_of_attack','ring_of_protection'], bonuses:{dmgMin:15,dmgMax:15,armor:2}, passiveId:'lifesteal', color:'#ff4444' },
  aura_shield:  { id:'aura_shield',  name:'Aura Shield',    short:'SHIELD',   cost:700,  components:['ring_of_protection','vitality_gem'],       bonuses:{armor:4,maxHp:200},  passiveId:'armor_aura',   color:'#88aaff' },
  void_staff:   { id:'void_staff',   name:'Void Staff',     short:'VOID',     cost:900,  components:['magic_charm','magic_charm'],               bonuses:{maxMp:300},          activeId:'void_burst', activeCD:30, color:'#ff44ff' },
  tp_scroll:    { id:'tp_scroll',    name:'TP Scroll',      short:'TP',       cost:135,  components:[],                                         bonuses:{},                   activeId:'teleport',   activeCD:60, color:'#44ffcc' },
};

export function getItemFullCost(itemId) {
  const def = ITEM_DEFS[itemId]; if(!def) return 0;
  return def.cost + def.components.reduce((s,c)=>s+getItemFullCost(c),0);
}

export function getItemBuyCost(hero, itemId) {
  const def = ITEM_DEFS[itemId]; if(!def) return 0;
  if(!def.components.length) return def.cost;
  let tempInv=[...hero.inventory], cost=def.cost;
  for(const comp of def.components) {
    const idx=tempInv.indexOf(comp);
    if(idx>=0) tempInv.splice(idx,1); else cost+=getItemFullCost(comp);
  }
  return cost;
}

export function buyItem(hero, itemId) {
  const def = ITEM_DEFS[itemId];
  if(!def || hero.inventory.length >= 6) return false;
  const cost = getItemBuyCost(hero, itemId);
  if(G.gold < cost) return false;
  G.gold -= cost;
  for(const comp of def.components) {
    const idx = hero.inventory.indexOf(comp);
    if(idx>=0) { unapplyItemBonuses(hero, ITEM_DEFS[comp]); hero.inventory.splice(idx,1); }
  }
  hero.inventory.push(itemId);
  applyItemBonuses(hero, def);
  playSound('buy');
  floatDamage(hero.x, hero.z, def.name, '#ffcc44');
  return true;
}

export function applyItemBonuses(hero, def) {
  const b=def.bonuses; if(!b) return;
  if(b.maxHp)  { hero.maxHp+=b.maxHp; hero.hp=Math.min(hero.hp+b.maxHp,hero.maxHp); }
  if(b.maxMp)  { hero.maxMp+=b.maxMp; hero.mp=Math.min(hero.mp+b.maxMp,hero.maxMp); }
  if(b.dmgMin) hero.itemBonus.dmgMin+=b.dmgMin;
  if(b.dmgMax) hero.itemBonus.dmgMax+=b.dmgMax;
  if(b.armor)  { hero.armor+=b.armor; hero.itemBonus.armor+=b.armor; }
  if(b.move)   hero.itemBonus.move+=b.move;
}

export function unapplyItemBonuses(hero, def) {
  const b=def.bonuses; if(!b) return;
  if(b.maxHp)  { hero.maxHp-=b.maxHp; hero.hp=Math.min(hero.hp,hero.maxHp); }
  if(b.maxMp)  { hero.maxMp-=b.maxMp; hero.mp=Math.min(hero.mp,hero.maxMp); }
  if(b.dmgMin) hero.itemBonus.dmgMin-=b.dmgMin;
  if(b.dmgMax) hero.itemBonus.dmgMax-=b.dmgMax;
  if(b.armor)  { hero.armor-=b.armor; hero.itemBonus.armor-=b.armor; }
  if(b.move)   hero.itemBonus.move-=b.move;
}

export function useItem(hero, slotIdx) {
  const itemId = hero.inventory[slotIdx];
  if(!itemId) return;
  const def = ITEM_DEFS[itemId];
  if(!def||!def.activeId) return;
  if((hero.itemCDs[itemId]||0)>0) return;
  switch(def.activeId) {
    case 'mana_restore':
      hero.mp = Math.min(hero.maxMp, hero.mp+150);
      floatDamage(hero.x, hero.z, '+150 MP', '#4488ff');
      playSound('magic');
      break;
    case 'blink': {
      const ang=hero.group.rotation.y;
      hero.x=Math.max(1,Math.min(99,hero.x+Math.sin(ang)*12));
      hero.z=Math.max(1,Math.min(99,hero.z+Math.cos(ang)*12));
      hero.group.position.set(hero.x,0,hero.z);
      hero.moveTarget=null;
      spawnParticles(hero.x,hero.z,0xaa44ff,8);
      playSound('spawn');
      floatDamage(hero.x,hero.z,'BLINK!','#aa44ff');
      break;
    }
    case 'teleport': {
      // 3-second channel then teleport to base
      hero.channeling = 3;
      hero.tpTarget = {x: hero.team==='scourge'?10:90, z: hero.team==='scourge'?10:90};
      floatDamage(hero.x, hero.z, 'TELEPORTING...', '#44ffcc');
      playSound('magic');
      break;
    }
    case 'void_burst': {
      const enemies=getEnemiesOf(hero.team);
      for(const e of enemies) {
        if(!e.alive) continue;
        const dx=e.x-hero.x,dz=e.z-hero.z;
        if(Math.sqrt(dx*dx+dz*dz)<=8) {
          applyDamage(e,200,'magic');
          spawnParticles(e.x,e.z,0xff44ff,4);
        }
      }
      spawnParticles(hero.x,hero.z,0xff44ff,10);
      playSound('chain_frost');
      floatDamage(hero.x,hero.z,'VOID BURST!','#ff44ff');
      break;
    }
  }
  hero.itemCDs[itemId]=def.activeCD;
}

export function updateItemCooldowns(hero, dt) {
  if(!hero||!hero.itemCDs) return;
  for(const k in hero.itemCDs) { if(hero.itemCDs[k]>0) hero.itemCDs[k]=Math.max(0,hero.itemCDs[k]-dt); }
}

// AI item build orders per hero type
const AI_BUILD = {
  lich:         ['boots_of_speed','vitality_gem','magic_charm','power_boots','void_staff'],
  sniper:       ['boots_of_speed','blades_of_attack','ring_of_protection','lifesteal_blade'],
  dragon_knight:['boots_of_speed','vitality_gem','ring_of_protection','aura_shield','power_boots'],
  shadow_fiend: ['boots_of_speed','blades_of_attack','iron_branch','lifesteal_blade'],
  windrunner:   ['boots_of_speed','magic_charm','blades_of_attack','arcane_boots','lifesteal_blade'],
};

export function updateAIItems(hero, dt) {
  if(!hero||!hero.alive) return;
  if(hero.aiGold===undefined) hero.aiGold=625;

  hero.aiBuyTimer=(hero.aiBuyTimer||0)-dt;
  if(hero.aiBuyTimer>0) return;
  hero.aiBuyTimer=8;
  const build=AI_BUILD[hero.type]||[];
  for(const itemId of build) {
    if(hero.inventory.includes(itemId)) continue;
    if(hero.inventory.length>=6) break;
    const cost=getItemBuyCost(hero,itemId);
    if(hero.aiGold>=cost) {
      hero.aiGold-=cost;
      for(const comp of ITEM_DEFS[itemId].components) {
        const idx=hero.inventory.indexOf(comp);
        if(idx>=0) { unapplyItemBonuses(hero,ITEM_DEFS[comp]); hero.inventory.splice(idx,1); }
      }
      hero.inventory.push(itemId);
      applyItemBonuses(hero,ITEM_DEFS[itemId]);
    }
    break;
  }
}
