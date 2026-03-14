// ─── MULTIPLAYER LOBBY LOGIC ─────────────────────────────────────────────────
// Create/join room, room code, QR, player list. Uses Trystero via peer.js.

import * as peer from './peer.js';
import { MSG } from './protocol.js';

const MP_SETUP = document.getElementById('multiplayer-setup');
const MP_CHOOSE = document.getElementById('mp-choose');
const MP_JOIN_PANEL = document.getElementById('mp-join-panel');
const MP_HOST_PANEL = document.getElementById('mp-host-panel');
const MP_CLIENT_WAIT = document.getElementById('mp-client-wait');
const MP_ROOM_CODE_IN = document.getElementById('mp-room-code-in');
const MP_ROOM_CODE_DISPLAY = document.getElementById('mp-room-code-display');
const MP_QR_CONTAINER = document.getElementById('mp-qr-container');
const MP_PLAYERS_COUNT = document.getElementById('mp-players-count');
const MP_SETUP_BACK = document.getElementById('mp-setup-back');

let _roomCode = null;
let _onStartAsHost = null;
let _onStartAsClient = null;
let _joinCancelled = false;

function generateQR(urlOrText) {
  if (typeof qrcode !== 'undefined' && qrcode) {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(urlOrText);
      qr.make();
      return qr.createImgTag(4, 4);
    } catch (e) { return ''; }
  }
  if (typeof qrcodeGenerator !== 'undefined') {
    try {
      const qr = qrcodeGenerator(0, 'M');
      qr.addData(urlOrText);
      qr.make();
      return qr.createImgTag(4, 4);
    } catch (e) { return ''; }
  }
  return '';
}

function showMPPanel(panel) {
  MP_CHOOSE.style.display = panel === 'choose' ? 'flex' : 'none';
  MP_JOIN_PANEL.style.display = panel === 'join' ? 'block' : 'none';
  MP_HOST_PANEL.style.display = panel === 'host' ? 'block' : 'none';
  MP_CLIENT_WAIT.style.display = panel === 'client' ? 'block' : 'none';
  MP_SETUP_BACK.style.display = (panel === 'host' || panel === 'client') ? 'block' : 'none';
}

export function showMultiplayerSetup() {
  if (MP_SETUP) MP_SETUP.style.display = 'flex';
  showMPPanel('choose');
  _roomCode = null;
  peer.disconnect();
}

export function hideMultiplayerSetup() {
  if (MP_SETUP) MP_SETUP.style.display = 'none';
  peer.disconnect();
}

/** Create game as host. Uses persistent peer ID (same device = same room code). Returns room code. */
export function createGame() {
  return peer.createRoom().then(() => {
    _roomCode = peer.getRoomCode();
    showMPPanel('host');
    if (MP_ROOM_CODE_DISPLAY) MP_ROOM_CODE_DISPLAY.textContent = _roomCode;
    const url = window.location.href.split('?')[0] + '?room=' + _roomCode;
    const qrHtml = generateQR(url);
    if (MP_QR_CONTAINER) MP_QR_CONTAINER.innerHTML = qrHtml || '<span style="color:#666">QR not available</span>';
    updatePlayersCount();
    const unsub = peer.onReceive(() => updatePlayersCount());
    return _roomCode;
  }).catch((err) => {
    console.error('Create room failed', err);
    showMPPanel('choose');
    throw err;
  });
}

/** Join game as client. */
export function joinGame(roomCode) {
  _joinCancelled = false;
  return peer.joinRoom(roomCode.trim()).then((myId) => {
    if (_joinCancelled) {
      peer.disconnect();
      throw new Error('Cancelled');
    }
    showMPPanel('client');
    return myId;
  }).catch((err) => {
    if (!_joinCancelled) console.error('Join room failed:', err.message || err);
    throw err;
  });
}

/** Abort an in-flight joinGame() call. Resets peer state immediately. */
export function cancelJoin() {
  _joinCancelled = true;
  peer.disconnect();
}

export function updatePlayersCount() {
  const ids = peer.getConnectionIds();
  const n = 1 + ids.length;
  if (MP_PLAYERS_COUNT) MP_PLAYERS_COUNT.textContent = 'Players: ' + n + (n === 1 ? ' (you are host)' : '');
}

/** Host: go to hero pick lobby (multiplayer). */
export function hostGoToLobby() {
  hideMultiplayerSetup();
  return _roomCode;
}

/** Register callback when host starts: onStartAsHost(roomCode, pickedHero). */
export function onStartAsHost(fn) { _onStartAsHost = fn; }

/** Register callback when client receives start: onStartAsClient(pickedHero). */
export function onStartAsClient(fn) { _onStartAsClient = fn; }

/** Send start signal (host sends to all clients). Payload: { hero, playerSide, teamSize }. */
export function broadcastStart(payload) {
  peer.broadcast({ type: 'start', ...payload });
}

/** Listen for start signal (client). Returns unsubscribe. */
export function onStartSignal(fn) {
  return peer.onReceive((peerId, data) => {
    if (data && data.type === 'start') fn(data);
  });
}

export function getRoomCode() { return _roomCode; }
export function isHost() { return _roomCode != null && peer.getRoomCode() != null; }

/** Number of connected players (host + clients). For display in lobby. */
export function getConnectionCount() {
  return 1 + peer.getConnectionIds().length;
}
