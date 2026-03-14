// ─── PEERJS WRAPPER ────────────────────────────────────────────────────────────
// Create/join room, send/receive. Requires PeerJS loaded (e.g. from CDN).
// Uses explicit STUN (and optional TURN) for better reliability when default PeerJS cloud is flaky.

let _peer = null;
let _roomCode = null;
const _connections = new Map(); // peerId -> DataConnection
const _listeners = [];

/**
 * ICE servers: multiple STUN + free public TURN relay (openrelay.metered.ca).
 * STUN alone fails when both peers sit behind symmetric NAT — TURN acts as relay
 * so connections succeed regardless of NAT type.
 */
const ICE_SERVERS_DEFAULT = [
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
];

/** Optional TURN via Metered (paid/free-tier). Set both to override the default ICE config. */
const METERED_TURN_APP_NAME = '';
const METERED_TURN_API_KEY = '';

/** Resolve ICE servers: default STUN+TURN, or credentials-based Metered config when set. */
async function getIceServersAsync() {
  if (METERED_TURN_APP_NAME && METERED_TURN_API_KEY) {
    try {
      const url = `https://${METERED_TURN_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(METERED_TURN_API_KEY)}`;
      const res = await fetch(url);
      if (res.ok) {
        const servers = await res.json();
        if (Array.isArray(servers) && servers.length > 0) {
          return [...ICE_SERVERS_DEFAULT.slice(0, 4), ...servers.slice(0, 4)];
        }
      }
    } catch (e) {
      console.warn('[P2P] Failed to fetch TURN credentials, using defaults:', e.message);
    }
  }
  return ICE_SERVERS_DEFAULT;
}

function getPeer() {
  if (typeof window !== 'undefined' && window.Peer) return window.Peer;
  return null;
}

const STORAGE_KEY_PEER_ID = 'dota_peer_id';

/** This device's persistent Peer ID (UUID). Host and joiner use the same ID forever; host = room code. */
export function getOrCreatePersistentPeerId() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  }
  let id = localStorage.getItem(STORAGE_KEY_PEER_ID);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
    try {
      localStorage.setItem(STORAGE_KEY_PEER_ID, id);
    } catch (_) {}
  }
  return id;
}

function _freshPeerId() {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
  try { localStorage.setItem(STORAGE_KEY_PEER_ID, id); } catch (_) {}
  return id;
}

function _tryCreatePeer(Peer, roomCode, iceServers, onConnection) {
  return new Promise((resolve, reject) => {
    if (_peer) { _peer.destroy(); _peer = null; }
    _connections.clear();

    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(val);
    };

    const timer = setTimeout(() => {
      if (_peer) { _peer.destroy(); _peer = null; }
      _connections.clear();
      done(reject, new Error('Could not reach the signaling server. Check your internet connection and try again.'));
    }, 14000);

    _peer = new Peer(roomCode, { debug: 0, config: { iceServers } });
    _peer.on('open', () => done(resolve, _peer.id));
    _peer.on('error', (err) => done(reject, err));
    _peer.on('connection', onConnection);
  });
}

/** Create a new peer and become host. Uses persistent peer ID (same device = same room code forever). Returns peer id. */
export async function createRoom() {
  const Peer = getPeer();
  if (!Peer) return Promise.reject(new Error('PeerJS not loaded. Check your internet connection.'));
  const iceServers = await getIceServersAsync();

  const onConnection = (conn) => {
    conn.on('open', () => {
      _connections.set(conn.peer, conn);
      conn.on('data', (data) => _listeners.forEach(fn => fn(conn.peer, data)));
      conn.on('close', () => _connections.delete(conn.peer));
      // PeerJS quirk: host must send first so joiner's conn.on('open') fires
      try { conn.send({ type: 'hostReady' }); } catch (_) {}
    });
  };

  let roomCode = getOrCreatePersistentPeerId();
  _roomCode = roomCode;

  try {
    const id = await _tryCreatePeer(Peer, roomCode, iceServers, onConnection);
    return id;
  } catch (err) {
    // "unavailable-id" means our persisted peer ID is still registered on the server.
    // Rotate to a fresh UUID and retry once.
    const msg = err && (err.message || err.type || '');
    if (/unavailable.?id|id.?taken/i.test(msg)) {
      console.warn('[P2P] Peer ID taken — rotating to fresh ID and retrying.');
      roomCode = _freshPeerId();
      _roomCode = roomCode;
      return _tryCreatePeer(Peer, roomCode, iceServers, onConnection);
    }
    throw err;
  }
}

/** Join an existing room (host's peer id). Returns our peer id. */
export async function joinRoom(hostPeerId) {
  const Peer = getPeer();
  if (!Peer) return Promise.reject(new Error('PeerJS not loaded. Check your internet connection.'));
  const iceServers = await getIceServersAsync();
  return new Promise((resolve, reject) => {
    if (_peer) { _peer.destroy(); _peer = null; }
    _connections.clear();

    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(val);
    };

    // Extended timeout: TURN relay negotiation can take up to ~15s on slow networks
    const timer = setTimeout(() => {
      if (_peer) { _peer.destroy(); _peer = null; }
      _connections.clear();
      done(reject, new Error(
        'Connection timed out. Make sure the host is online and sharing the correct room code. ' +
        'If on different networks, try the same WiFi network.'
      ));
    }, 20000);

    _peer = new Peer({ debug: 0, config: { iceServers } });
    _peer.on('open', () => {
      // Brief delay so signaling server has joiner registered (PeerJS timing quirk)
      setTimeout(() => {
        if (settled || !_peer) return;
        const conn = _peer.connect(hostPeerId, { reliable: true });

        const markOpen = () => {
          if (settled) return;
          _connections.set(hostPeerId, conn);
          conn.on('data', (data) => _listeners.forEach(fn => fn(hostPeerId, data)));
          conn.on('close', () => _connections.delete(hostPeerId));
          done(resolve, _peer.id);
        };

        // PeerJS quirk: conn.on('open') can be delayed — also resolve when we receive the
        // host's first handshake message so we don't wait unnecessarily.
        conn.on('data', (data) => {
          const msg = data && typeof data === 'object' ? data : (typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch (_) { return null; } })() : null);
          if (msg && msg.type === 'hostReady') markOpen();
        });
        conn.on('open', () => markOpen());
        conn.on('error', (err) => {
          const detail = err && err.message ? err.message : String(err);
          done(reject, new Error('Could not connect to host: ' + detail));
        });
      }, 500);
    });
    _peer.on('error', (err) => {
      const detail = err && err.message ? err.message : String(err);
      done(reject, new Error('Signaling error: ' + detail + '. Check your internet connection.'));
    });
  });
}

/** Send data to one peer (host sends to one client; client sends to host) */
export function send(peerId, data) {
  const conn = _connections.get(peerId);
  if (conn && conn.open) conn.send(data);
}

/** Broadcast to all connected peers */
export function broadcast(data) {
  _connections.forEach((conn, peerId) => {
    if (conn.open) conn.send(data);
  });
}

/** Register listener: fn(peerId, data) */
export function onReceive(fn) {
  _listeners.push(fn);
  return () => { const i = _listeners.indexOf(fn); if (i >= 0) _listeners.splice(i, 1); };
}

/** Disconnect and destroy peer */
export function disconnect() {
  _connections.forEach(c => c.close());
  _connections.clear();
  if (_peer) { _peer.destroy(); _peer = null; }
  _roomCode = null;
}

/** Current peer id (host room code or our id when client) */
export function getPeerId() { return _peer ? _peer.id : null; }

/** Room code when we are host */
export function getRoomCode() { return _roomCode; }

/** All connected peer ids */
export function getConnectionIds() { return Array.from(_connections.keys()); }
