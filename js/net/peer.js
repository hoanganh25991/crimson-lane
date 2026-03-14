// ─── P2P NETWORKING (Trystero / BitTorrent tracker signaling) ─────────────────
//
// Replaces PeerJS. Trystero uses distributed BitTorrent tracker infrastructure
// for peer discovery — no single cloud signaling server that can go down.
//
// External API is identical to the old PeerJS wrapper so callers need no changes:
//   createRoom()          → host; resolves with room code (persistent UUID)
//   joinRoom(roomCode)    → client; resolves with self peer-session id
//   send(peerId, data)    → unicast to one peer
//   broadcast(data)       → send to all connected peers
//   onReceive(fn)         → fn(peerId, data); returns unsubscribe
//   disconnect()          → leave room
//   getPeerId()           → our session peer id
//   getRoomCode()         → room code (set when host)
//   getConnectionIds()    → array of connected peer ids

import { joinRoom as trysteroJoin } from 'https://esm.sh/trystero/torrent';

// ── Config ─────────────────────────────────────────────────────────────────────

/** Unique namespace for this game — prevents cross-app peer discovery. */
const APP_ID = 'crimson-lane-v1';

const STORAGE_KEY_PEER_ID = 'dota_peer_id';

/**
 * ICE servers: STUN for standard NAT + TURN relay for symmetric NAT.
 * Trystero accepts rtcConfig as part of joinRoom options.
 */
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

// ── Module state ───────────────────────────────────────────────────────────────

let _room     = null;   // Trystero room object
let _roomCode = null;   // set when we are host (= our persistent UUID)
let _selfId   = null;   // our session id (returned by getPeerId)
let _peers    = new Set(); // Trystero peer ids of connected remote peers
let _sendMsg  = null;   // Trystero send function for the 'msg' action
const _listeners = [];  // onReceive subscribers: fn(peerId, data)

// ── Helpers ────────────────────────────────────────────────────────────────────

function _makeUUID() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
}

/** Persistent device UUID — used as room code by the host. */
export function getOrCreatePersistentPeerId() {
  if (typeof window === 'undefined' || !window.localStorage) return _makeUUID();
  let id = localStorage.getItem(STORAGE_KEY_PEER_ID);
  if (!id) {
    id = _makeUUID();
    try { localStorage.setItem(STORAGE_KEY_PEER_ID, id); } catch (_) {}
  }
  return id;
}

function _freshPeerId() {
  const id = _makeUUID();
  try { localStorage.setItem(STORAGE_KEY_PEER_ID, id); } catch (_) {}
  return id;
}

/** Tear down existing room cleanly before creating/joining a new one. */
function _destroyRoom() {
  if (_room) {
    try { _room.leave(); } catch (_) {}
    _room = null;
  }
  _peers.clear();
  _sendMsg = null;
  _selfId  = null;
}

/**
 * Wire up the Trystero room's shared 'msg' action.
 * All game messages (hostReady, start, snapshots, commands) flow through this
 * single action so we keep a minimal surface area.
 *
 * Returns the sendMsg function.
 */
function _wireRoom(room, onMessage) {
  const [sendMsg, onMsg] = room.makeAction('msg');
  _sendMsg = sendMsg;

  room.onPeerJoin(id  => { _peers.add(id); });
  room.onPeerLeave(id => { _peers.delete(id); });

  onMsg(onMessage);
  return sendMsg;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create room as host.
 * Uses a persistent UUID as the room code so the same device always has the
 * same room code. Resolves immediately (Trystero connects in background);
 * sends `hostReady` to each client as they arrive.
 */
export async function createRoom() {
  _destroyRoom();

  const roomCode = getOrCreatePersistentPeerId();
  _roomCode = roomCode;
  _selfId   = roomCode;

  _room = trysteroJoin({ appId: APP_ID, rtcConfig: RTC_CONFIG }, roomCode);

  const sendMsg = _wireRoom(_room, (data, peerId) => {
    _listeners.forEach(fn => fn(peerId, data));
  });

  // Greet each joiner so they can resolve their joinRoom promise quickly.
  _room.onPeerJoin(id => {
    try { sendMsg({ type: 'hostReady' }, id); } catch (_) {}
  });

  return roomCode;
}

/**
 * Join an existing room as client.
 * Resolves once the host sends a `hostReady` handshake (or times out after 20 s).
 */
export async function joinRoom(hostRoomCode) {
  _destroyRoom();
  _selfId = _makeUUID();

  return new Promise((resolve, reject) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (resolved) return;
      _destroyRoom();
      reject(new Error(
        'Connection timed out. Make sure the host is online and sharing the correct room code.'
      ));
    }, 20000);

    _room = trysteroJoin({ appId: APP_ID, rtcConfig: RTC_CONFIG }, hostRoomCode);

    _wireRoom(_room, (data, peerId) => {
      // Resolve on first hostReady — connection is established.
      if (!resolved && data && data.type === 'hostReady') {
        resolved = true;
        clearTimeout(timer);
        resolve(_selfId);
      }
      // Always dispatch to subscribers (start signal, snapshots, etc.).
      _listeners.forEach(fn => fn(peerId, data));
    });
  });
}

/** Send data to one specific peer (by Trystero peer id). */
export function send(peerId, data) {
  if (_sendMsg) {
    try { _sendMsg(data, peerId); } catch (_) {}
  }
}

/** Broadcast data to all connected peers. */
export function broadcast(data) {
  if (_sendMsg) {
    try { _sendMsg(data); } catch (_) {}
  }
}

/**
 * Register a data listener: fn(peerId, data).
 * Returns an unsubscribe function.
 */
export function onReceive(fn) {
  _listeners.push(fn);
  return () => {
    const i = _listeners.indexOf(fn);
    if (i >= 0) _listeners.splice(i, 1);
  };
}

/** Leave the room and clean up. */
export function disconnect() {
  _destroyRoom();
  _roomCode = null;
  _listeners.length = 0;
}

/** Our session peer id (host = room code UUID, client = ephemeral UUID). */
export function getPeerId() { return _selfId; }

/** Room code — non-null only when we are host. */
export function getRoomCode() { return _roomCode; }

/** Trystero peer ids of all currently connected remote peers. */
export function getConnectionIds() { return Array.from(_peers); }
