// ─── PEERJS WRAPPER ────────────────────────────────────────────────────────────
// Create/join room, send/receive. Requires PeerJS loaded (e.g. from CDN).
// Uses global Peer when in browser.

let _peer = null;
let _roomCode = null;
const _connections = new Map(); // peerId -> DataConnection
const _listeners = [];

function getPeer() {
  if (typeof window !== 'undefined' && window.Peer) return window.Peer;
  return null;
}

/** Create a new peer and become host with given id (room code). Returns peer id. */
export function createRoom(roomCode) {
  const Peer = getPeer();
  if (!Peer) throw new Error('PeerJS not loaded. Add script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"');
  return new Promise((resolve, reject) => {
    if (_peer) { _peer.destroy(); _peer = null; }
    _connections.clear();
    _roomCode = roomCode;
    _peer = new Peer(roomCode, { debug: 0 });
    _peer.on('open', () => resolve(_peer.id));
    _peer.on('error', (err) => reject(err));
    _peer.on('connection', (conn) => {
      conn.on('open', () => {
        _connections.set(conn.peer, conn);
        conn.on('data', (data) => _listeners.forEach(fn => fn(conn.peer, data)));
        conn.on('close', () => _connections.delete(conn.peer));
      });
    });
  });
}

/** Join an existing room (host's peer id). Returns our peer id. */
export function joinRoom(hostPeerId) {
  const Peer = getPeer();
  if (!Peer) throw new Error('PeerJS not loaded.');
  return new Promise((resolve, reject) => {
    if (_peer) { _peer.destroy(); _peer = null; }
    _connections.clear();
    _peer = new Peer({ debug: 0 });
    _peer.on('open', () => {
      const conn = _peer.connect(hostPeerId, { reliable: true });
      conn.on('open', () => {
        _connections.set(hostPeerId, conn);
        conn.on('data', (data) => _listeners.forEach(fn => fn(hostPeerId, data)));
        conn.on('close', () => _connections.delete(hostPeerId));
        resolve(_peer.id);
      });
      conn.on('error', reject);
    });
    _peer.on('error', reject);
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
