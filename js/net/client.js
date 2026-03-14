// ─── CLIENT ────────────────────────────────────────────────────────────────────
// Connect to host, send commands, receive state snapshots (for interpolation).

import * as peer from './peer.js';
import { serializeCommand, parseSnapshot, MSG } from './protocol.js';

let _hostPeerId = null;
let _onSnapshot = null;

/** Connect to host; onSnapshot(snapshot) called when state received */
export function connect(hostPeerId, onSnapshot) {
  _hostPeerId = hostPeerId;
  _onSnapshot = onSnapshot;
  return peer.joinRoom(hostPeerId).then((myId) => {
    peer.onReceive((fromPeerId, data) => {
      const snapshot = parseSnapshot(data);
      if (snapshot && _onSnapshot) _onSnapshot(snapshot);
    });
    return myId;
  });
}

/** Send one input command to host */
export function sendCommand(cmd) {
  if (_hostPeerId) peer.send(_hostPeerId, serializeCommand(cmd));
}

/** Disconnect from host */
export function disconnect() {
  _hostPeerId = null;
  _onSnapshot = null;
  peer.disconnect();
}

/** Simple interpolation: blend from last snapshot toward current. Call each frame. */
export function interpolateSnapshot(last, next, t) {
  if (!last || !next) return next || last;
  if (t >= 1) return next;
  const out = { ...next };
  out.heroes = (next.heroes || []).map((h, i) => {
    const prev = (last.heroes || [])[i] || h;
    return {
      ...h,
      x: prev.x + (h.x - prev.x) * t,
      z: prev.z + (h.z - prev.z) * t,
    };
  });
  out.creeps = (next.creeps || []).map((c, i) => {
    const prev = (last.creeps || [])[i] || c;
    return {
      ...c,
      x: prev.x + (c.x - prev.x) * t,
      z: prev.z + (c.z - prev.z) * t,
    };
  });
  return out;
}
