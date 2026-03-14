// ─── PEERJS WRAPPER ────────────────────────────────────────────────────────────
// Create/join room, send/receive. Requires PeerJS loaded (e.g. from CDN).
// Uses explicit STUN (and optional TURN) for better reliability when default PeerJS cloud is flaky.

let _peer = null;
let _roomCode = null;
const _connections = new Map(); // peerId -> DataConnection
const _listeners = [];

/** STUN only — works when host and joiner are on same WiFi or NAT is permissive. */
const ICE_SERVERS_STUN = [{ urls: 'stun:stun.l.google.com:19302' }];

/** Optional TURN via Metered (free tier). Set both to enable; leave empty to use STUN only. */
const METERED_TURN_APP_NAME = '';
const METERED_TURN_API_KEY = '';

/** Resolve ICE servers: STUN only by default, or STUN + TURN from Metered if credentials are set. */
async function getIceServersAsync() {
  if (METERED_TURN_APP_NAME && METERED_TURN_API_KEY) {
    try {
      const url = `https://${METERED_TURN_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(METERED_TURN_API_KEY)}`;
      const res = await fetch(url);
      if (res.ok) {
        const servers = await res.json();
        if (Array.isArray(servers) && servers.length > 0) {
          return servers.slice(0, 4);
        }
      }
    } catch (e) {
      console.warn('[P2P] Failed to fetch TURN credentials, using STUN only:', e.message);
    }
  }
  return ICE_SERVERS_STUN;
}

function getPeer() {
  if (typeof window !== 'undefined' && window.Peer) return window.Peer;
  return null;
}

/** Create a new peer and become host with given id (room code). Returns peer id. */
export async function createRoom(roomCode) {
  const Peer = getPeer();
  if (!Peer) return Promise.reject(new Error('PeerJS not loaded. Check your internet connection.'));
  const iceServers = await getIceServersAsync();
  return new Promise((resolve, reject) => {
    if (_peer) { _peer.destroy(); _peer = null; }
    _connections.clear();
    _roomCode = roomCode;

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
      _roomCode = null;
      done(reject, new Error('Could not connect to PeerJS server. Check your internet connection.'));
    }, 12000);

    _peer = new Peer(roomCode, { debug: 0, config: { iceServers } });
    _peer.on('open', () => done(resolve, _peer.id));
    _peer.on('error', (err) => done(reject, err));
    _peer.on('connection', (conn) => {
      conn.on('open', () => {
        _connections.set(conn.peer, conn);
        conn.on('data', (data) => _listeners.forEach(fn => fn(conn.peer, data)));
        conn.on('close', () => _connections.delete(conn.peer));
        // PeerJS quirk: host must send first so joiner's conn.open can fire (see monk-journey)
        try { conn.send({ type: 'hostReady' }); } catch (_) {}
      });
    });
  });
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

    const timer = setTimeout(() => {
      if (_peer) { _peer.destroy(); _peer = null; }
      _connections.clear();
      done(reject, new Error('Connection timed out. Room not found or host is offline.'));
    }, 12000);

    _peer = new Peer({ debug: 0, config: { iceServers } });
    _peer.on('open', () => {
      // Brief delay so signaling server has joiner registered (PeerJS timing)
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

        // PeerJS quirk: connection can open when we receive host's first message (hostReady) even if conn.on('open') is delayed
        conn.on('data', (data) => {
          const msg = data && typeof data === 'object' ? data : (typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch (_) { return null; } })() : null);
          if (msg && msg.type === 'hostReady') markOpen();
        });
        conn.on('open', () => markOpen());
        conn.on('error', (err) => done(reject, err));
      }, 500);
    });
    _peer.on('error', (err) => done(reject, err));
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
