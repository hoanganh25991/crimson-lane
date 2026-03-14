// ─── HOST (AUTHORITATIVE) ──────────────────────────────────────────────────────
// Accept connections, receive commands from clients, broadcast state snapshots.

import * as peer from './peer.js';
import { serializeSnapshot, parseCommand, MSG } from './protocol.js';

let _snapshotInterval = null;
let _getState = null;
let _onCommand = null;

/** Start host with room code; getState() returns G; onCommand(peerId, cmd) handles input */
export function startHost(roomCode, getState, onCommand) {
  _getState = getState;
  _onCommand = onCommand;
  return peer.createRoom(roomCode).then(() => {
    peer.onReceive((peerId, data) => {
      const cmd = parseCommand(data);
      if (cmd && _onCommand) _onCommand(peerId, cmd);
    });
    return roomCode;
  });
}

/** Start broadcasting snapshots at ~20 Hz */
export function startSnapshotBroadcast(intervalMs = 50) {
  stopSnapshotBroadcast();
  _snapshotInterval = setInterval(() => {
    if (!_getState) return;
    const G = _getState();
    const snapshot = serializeSnapshot(G);
    peer.broadcast(snapshot);
  }, intervalMs);
}

export function stopSnapshotBroadcast() {
  if (_snapshotInterval) {
    clearInterval(_snapshotInterval);
    _snapshotInterval = null;
  }
}

/** Get list of connected client peer ids */
export function getConnections() {
  return peer.getConnectionIds();
}

export function stopHost() {
  stopSnapshotBroadcast();
  peer.disconnect();
  _getState = null;
  _onCommand = null;
}
