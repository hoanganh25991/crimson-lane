// ─── NETWORK PROTOCOL ──────────────────────────────────────────────────────────
// Message types and serialization for host-authoritative multiplayer.
// Host sends state snapshots; clients send input commands.

export const MSG = {
  SNAPSHOT: 'snapshot',
  COMMAND: 'command',
  JOIN: 'join',
  JOIN_ACK: 'join_ack',
  PEER_LEFT: 'peer_left',
  PING: 'ping',
  PONG: 'pong',
};

/** Serialize hero for network (no THREE objects, no circular refs) */
function serializeHero(h) {
  if (!h) return null;
  return {
    _uid: h._uid,
    type: h.type,
    x: h.x, z: h.z,
    vx: h.vx ?? 0, vz: h.vz ?? 0,
    hp: h.hp, maxHp: h.maxHp, mp: h.mp, maxMp: h.maxMp,
    alive: !!h.alive, level: h.level ?? 1,
    team: h.team, isPlayer: !!h.isPlayer,
    slowTimer: h.slowTimer ?? 0, stunTimer: h.stunTimer ?? 0,
  };
}

/** Serialize creep */
function serializeCreep(c) {
  if (!c || !c.alive) return null;
  return {
    _uid: c._uid ?? ('c' + c.x + '_' + c.z),
    x: c.x, z: c.z, hp: c.hp, maxHp: c.maxHp,
    alive: true, team: c.team,
  };
}

/** Serialize tower */
function serializeTower(t) {
  if (!t) return null;
  return {
    x: t.x, z: t.z, hp: t.hp, maxHp: t.maxHp,
    alive: !!t.alive, team: t.team,
  };
}

/** Serialize projectile (minimal for trail effect) */
function serializeProjectile(p) {
  if (!p || !p.alive) return null;
  const x = p.mesh ? p.mesh.position.x : p.x;
  const z = p.mesh ? p.mesh.position.z : p.z;
  const t = p.target;
  const tx = t && (t.x != null) ? t.x : (t && t.def ? t.def.x : 0);
  const tz = t && (t.z != null) ? t.z : (t && t.def ? t.def.z : 0);
  return { x, z, tx, tz, color: p.color ?? 0xffffff };
}

/** Build full game snapshot from G */
export function serializeSnapshot(G) {
  const heroes = (G.heroList || []).map(serializeHero).filter(Boolean);
  const creeps = (G.creeps || []).filter(c => c.alive).map(serializeCreep).filter(Boolean);
  const towers = (G.towers || []).map(serializeTower).filter(Boolean);
  const projectiles = (G.projectiles || []).slice(0, 50).map(serializeProjectile).filter(Boolean);
  return {
    type: MSG.SNAPSHOT,
    t: Date.now(),
    time: G.time,
    gold: G.gold,
    kills: G.kills,
    deaths: G.deaths,
    heroes,
    creeps,
    towers,
    projectiles,
  };
}

/** Parse snapshot (same shape; for client interpolation) */
export function parseSnapshot(data) {
  if (!data || data.type !== MSG.SNAPSHOT) return null;
  return data;
}

/** Command schema: { type: 'move'|'attack'|'cast', ... } */
export function serializeCommand(cmd) {
  return { type: MSG.COMMAND, ...cmd };
}

export function parseCommand(data) {
  if (!data || data.type !== MSG.COMMAND) return null;
  const { type, ...rest } = data;
  return rest;
}
