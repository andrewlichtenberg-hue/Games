'use strict';
/* ============================================================
   LILA & THE TIDES OF SHIMMER ISLE
   Sequel to "Lila & the Song of the Sea" — one year later.
   Single-file HTML5 canvas game. No external assets.
   ============================================================ */

/* ── tiny DOM / math helpers ─────────────────────────────── */
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const n1 = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

/* ── canvas ──────────────────────────────────────────────── */
const cvs = $('c'), ctx = cvs.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth; VH = window.innerHeight;
  cvs.width = Math.round(VW * DPR); cvs.height = Math.round(VH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('AL', a.toFixed(3)));
  g.addColorStop(1, col.replace('AL', '0'));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
const rgba = (r, g, b) => `rgba(${r},${g},${b},AL)`;

/* ── save data: 3 profiles ───────────────────────────────── */
const SAVE_PREFIX = 'lilaTides_p';
const ACTIVE_KEY = 'lilaTides_active';
let activeSlot = 1;
function defaultSave() {
  return {
    started: false,
    mq: 1,                     // main quest index; 99 = postgame free play
    shells: 0,
    inv: {},
    gear: {},                  // snorkel tank1 tank2 tank3 flippers lantern wetsuit net compass blessing shovel
    hearts: { melody: 0, pochacco: 0, purin: 0, kitty: 0, coral: 0, marina: 0, inky: 0, pusheen: 0, turtles: 0 },
    fish: {}, seen: {},
    recipes: ['tart', 'reefroll'],
    charms: [],                // 12 hidden seashell charms
    outfit: { dress: 'red', hat: null },
    ownedDress: ['red'], ownedHat: [],
    vehicles: {},              // bike, surf, boat
    medals: {},                // raceId -> 1 bronze 2 silver 3 gold
    house: {},                 // slotIdx -> furniture id
    ownedFurn: [],
    pet: { adopted: false, treats: 0, hearts: 0 },
    mapPieces: [], dug: [],    // treasure maps
    frags: [false, false, false], // tide-pearl fragments
    isle: 'home', px: 900, tod: 0.36,
    visited: ['home'],
    flags: {},
    music: true, sfx: true,
    playSeconds: 0,
  };
}
let S = defaultSave();
let saveDirty = false, saveTimer = 0;
function markSave() { saveDirty = true; }
function slotKey(n) { return SAVE_PREFIX + n; }
function saveGame() {
  try { localStorage.setItem(slotKey(activeSlot), JSON.stringify(S)); } catch (e) {}
  saveDirty = false;
}
function peekSlot(n) {
  try {
    const raw = localStorage.getItem(slotKey(n));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d.started ? d : null;
  } catch (e) { return null; }
}
function loadSlot(n) {
  activeSlot = n;
  try { localStorage.setItem(ACTIVE_KEY, String(n)); } catch (e) {}
  const d = peekSlot(n);
  if (d) {
    S = Object.assign(defaultSave(), d);
    S.hearts = Object.assign(defaultSave().hearts, d.hearts || {});
    S.pet = Object.assign(defaultSave().pet, d.pet || {});
    S.outfit = Object.assign(defaultSave().outfit, d.outfit || {});
    return true;
  }
  S = defaultSave();
  return false;
}
function wipeSlot(n) { try { localStorage.removeItem(slotKey(n)); } catch (e) {} if (n === activeSlot) S = defaultSave(); }
/* did she finish (or play) the first game on this device? */
function songOfSeaSave() {
  try {
    const raw = localStorage.getItem('lilaSongOfTheSea_v1');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
/* magic backup code: base64 of save JSON */
function exportCode() {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); } catch (e) { return ''; }
}
function importCode(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || !d.started) return false;
    S = Object.assign(defaultSave(), d);
    saveGame();
    return true;
  } catch (e) { return false; }
}

/* inventory helpers */
function invAdd(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; markSave(); }
function invCount(id) { return S.inv[id] || 0; }
function invTake(id, n = 1) {
  if (invCount(id) < n) return false;
  S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id];
  markSave(); return true;
}
function hasItems(need) { return Object.entries(need).every(([k, v]) => invCount(k) >= v); }
function takeItems(need) { Object.entries(need).forEach(([k, v]) => invTake(k, v)); }
function addShells(n) { S.shells = Math.max(0, S.shells + n); markSave(); updateHUD(); }
function heart(who, n = 1) { S.hearts[who] = Math.min(5, (S.hearts[who] || 0) + n); markSave(); }

/* ── runtime state ───────────────────────────────────────── */
const G = {
  mode: 'boot',            // boot | title | land | dive | sail | house
  p: { x: 900, y: 0, vx: 0, vy: 0, face: 1, walk: 0, anim: 0, air: 1, depth: 0, sting: 0, dash: 0, jumpY: 0, jumpV: 0, spin: 0 },
  cam: { x: 0, y: 0 },
  t: 0,
  tod: 0.36,
  busy: false,
  dialog: null, cutscene: null, rhythm: null, cook: null, train: null, race: null,
  fireflies: [], sparkles: [], toastT: 0,
  weather: { rain: 0, target: 0, next: 90 },
  dive: null, sailS: null,
  nearTarget: null,
  vehicle: null,           // null | 'bike' | 'surf'
  pet: { x: 0, y: 0, vx: 0, state: 'idle', digT: 0 },
  shakeT: 0, shakeAmp: 0, flash: 0,
  tempActor: null,
  chapterT: false, fade: null, panel: null, ptab: null,
};

/* ── input ───────────────────────────────────────────────── */
const keys = {};
let actionQueued = false;
window.addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') { actionQueued = true; e.preventDefault(); }
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') e.preventDefault();
  AudioSys.unlock();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
function axisX() {
  let a = 0;
  if (keys.ArrowLeft || keys.KeyA || touchHeld.L) a -= 1;
  if (keys.ArrowRight || keys.KeyD || touchHeld.R) a += 1;
  return a;
}
function axisY() {
  let a = 0;
  if (keys.ArrowUp || keys.KeyW) a -= 1;
  if (keys.ArrowDown || keys.KeyS) a += 1;
  return a;
}
const ptr = { down: false, x: 0, y: 0, tapped: false, downT: 0, moved: false };
function ptrPos(e) {
  const t = e.touches ? e.touches[0] : e;
  return t ? { x: t.clientX, y: t.clientY } : null;
}
function onDown(e) {
  if (e.target && e.target.closest && e.target.closest('#ui') &&
      !e.target.closest('#touch') && e.target.id !== 'ui') return;
  const p = ptrPos(e); if (!p) return;
  ptr.down = true; ptr.x = p.x; ptr.y = p.y; ptr.downT = G.t; ptr.moved = false;
  AudioSys.unlock();
}
function onMove(e) {
  const p = ptrPos(e); if (!p) return;
  if (ptr.down && dist(p.x, p.y, ptr.x, ptr.y) > 14) ptr.moved = true;
  ptr.x = p.x; ptr.y = p.y;
}
function onUp() {
  if (ptr.down && !ptr.moved && G.t - ptr.downT < 0.4) ptr.tapped = true;
  ptr.down = false;
}
window.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
window.addEventListener('touchstart', onDown, { passive: true });
window.addEventListener('touchmove', onMove, { passive: true });
window.addEventListener('touchend', onUp);

const touchHeld = { L: false, R: false };
function bindHold(el, key) {
  const set = v => e => { e.preventDefault(); touchHeld[key] = v; el.classList.toggle('held', v); AudioSys.unlock(); };
  el.addEventListener('touchstart', set(true), { passive: false });
  el.addEventListener('touchend', set(false));
  el.addEventListener('touchcancel', set(false));
  el.addEventListener('mousedown', set(true));
  el.addEventListener('mouseup', set(false));
  el.addEventListener('mouseleave', set(false));
}
const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
/* ============================================================
   AUDIO — procedural soundtrack + sfx (Web Audio)
   ============================================================ */
const AudioSys = (() => {
  let ac = null, master, musicBus, musicGain, musicFilt, sfxBus, delaySend;
  let noiseBuf = null;
  let ambWave = null, ambBub = null;          // ambience loop gains
  let curTrack = null, pendingTrack = null, layers = [], percs = [], schedTimer = null;
  let fading = false;

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nfreq(name) {
    if (name === 'R') return 0;
    let i = 0, semi = SEMI[name[i++]];
    if (name[i] === '#') { semi++; i++; } else if (name[i] === 'b') { semi--; i++; }
    const oct = parseInt(name.slice(i), 10);
    return 440 * Math.pow(2, ((oct + 1) * 12 + semi - 69) / 12);
  }
  function parseSeq(str) {
    return str.trim().split(/\s+/).map(tok => {
      const [n, b] = tok.split(':');
      return { f: nfreq(n), b: parseFloat(b || '1') };
    });
  }

  /* ── track library ────────────────────────────────────── */
  const arpBar = (a, b, c, d, e2, f, g, h) => `${a}:.5 ${b}:.5 ${c}:.5 ${d}:.5 ${e2}:.5 ${f}:.5 ${g}:.5 ${h}:.5`;
  const ARP = {
    C: arpBar('C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4'),
    Am: arpBar('A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'C4'),
    F: arpBar('F3', 'A3', 'C4', 'F4', 'C4', 'A3', 'F3', 'A3'),
    G: arpBar('G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'G3', 'B3'),
  };
  const TRACKS = {
    island: {
      bpm: 104,
      layers: [
        { w: 'triangle', v: .15, env: 'pluck', seq: `E4:1 G4:1 A4:1 G4:1  E4:1 C4:2 R:1  F4:1 A4:1 G4:1 E4:1  D4:3 R:1
                E4:1 G4:1 A4:1 C5:1  B4:1 G4:2 R:1  A4:1 G4:1 E4:1 D4:1  C4:3 R:1` },
        { w: 'triangle', v: .05, env: 'pluck', seq: `${ARP.C} ${ARP.Am} ${ARP.F} ${ARP.G} ${ARP.C} ${ARP.Am} ${ARP.F} ${ARP.G}` },
        { w: 'sine', v: .12, env: 'pad', seq: 'C3:4 A2:4 F2:4 G2:4 C3:4 A2:4 F2:4 G2:4' },
      ],
      perc: [{ n: 'kick', pat: 'x...x...' }, { n: 'shk', pat: '.x.x.xxx' }],
    },
    night: {
      bpm: 66,
      layers: [
        { w: 'sine', v: .13, env: 'bell', seq: `A4:2 G4:2 F4:3 R:1 G4:2 A4:2 C5:3 R:1
                A4:2 G4:2 F4:2 E4:2 G4:2 E4:2 F4:3 R:1` },
        { w: 'sine', v: .1, env: 'pad', seq: 'F2:4 C3:4 Bb2:4 C3:4 F2:4 C3:4 Bb2:4 C3:4' },
        { w: 'triangle', v: .05, env: 'bell', seq: 'R:14 C6:2 R:14 A5:2' },
      ],
      perc: [],
    },
    sea: {
      bpm: 72,
      layers: [
        { w: 'triangle', v: .085, env: 'pluck', seq: `
          A3:.5 C4:.5 E4:.5 A4:.5 C5:.5 A4:.5 E4:.5 C4:.5  F3:.5 A3:.5 C4:.5 F4:.5 A4:.5 F4:.5 C4:.5 A3:.5
          G3:.5 C4:.5 E4:.5 G4:.5 C5:.5 G4:.5 E4:.5 C4:.5  G3:.5 B3:.5 D4:.5 G4:.5 B4:.5 G4:.5 D4:.5 B3:.5
          A3:.5 C4:.5 E4:.5 A4:.5 C5:.5 A4:.5 E4:.5 C4:.5  F3:.5 A3:.5 C4:.5 F4:.5 A4:.5 F4:.5 C4:.5 A3:.5
          G3:.5 C4:.5 E4:.5 G4:.5 C5:.5 G4:.5 E4:.5 C4:.5  G3:.5 B3:.5 D4:.5 G4:.5 B4:.5 G4:.5 D4:.5 B3:.5` },
        { w: 'sine', v: .1, env: 'pad', seq: 'A2:8 F2:8 C3:8 G2:8 A2:8 F2:8 C3:8 G2:8' },
        { w: 'sine', v: .06, env: 'pad', seq: 'R:2 A4:2 C5:2 B4:2 A4:4 R:4 R:2 E5:2 D5:2 C5:2 B4:6 R:2 R:32' },
      ],
      perc: [],
    },
    deep: {
      bpm: 56,
      layers: [
        { w: 'sine', v: .11, env: 'pad', seq: 'D2:8 Bb2:8 F2:8 A2:8' },
        { w: 'sine', v: .07, env: 'bell', seq: 'R:3 D5:1 R:4 R:6 A4:1 R:1 R:3 F5:1 R:4 R:6 E5:1 R:1' },
      ],
      perc: [],
    },
    storm: {
      bpm: 138,
      layers: [
        { w: 'sawtooth', v: .07, env: 'pluck', seq: 'A2:1 A2:1 E2:1 G2:1 F2:1 F2:1 C3:1 E2:1 A2:1 A2:1 E2:1 G2:1 F2:1 F2:1 D3:1 E2:1' },
        { w: 'sawtooth', v: .035, env: 'pad', seq: 'A4:4 G4:4 F4:4 E4:4' },
      ],
      perc: [{ n: 'kick', pat: 'x.x.x.x.' }],
    },
    finale: {
      bpm: 122,
      layers: [
        { w: 'triangle', v: .17, env: 'pluck', seq: `C5:1 D5:1 E5:1 G5:1  E5:2 C5:2  A4:1 C5:1 D5:1 E5:1  D5:2 G4:2
                C5:1 D5:1 E5:1 G5:1  A5:2 G5:2  E5:1 G5:1 D5:1 E5:1  C5:4` },
        { w: 'square', v: .035, env: 'pluck', seq: `${ARP.C} ${ARP.G} ${ARP.Am} ${ARP.F} ${ARP.C} ${ARP.G} ${ARP.Am} ${ARP.F}` },
        { w: 'sine', v: .13, env: 'pad', seq: 'C3:4 G2:4 A2:4 F2:4 C3:4 G2:4 A2:4 F2:4' },
      ],
      perc: [{ n: 'kick', pat: 'x...x...' }, { n: 'shk', pat: 'x.x.x.x.' }, { n: 'snare', pat: '....x...' }],
    },
    echo: {
      bpm: 80,
      layers: [
        { w: 'sine', v: .08, env: 'pad', seq: 'A2:8 F2:8 C3:8 E2:8' },
      ],
      perc: [{ n: 'shk', pat: '..x...x.' }],
    },
  };
  TRACKS.title = { bpm: 88, layers: TRACKS.island.layers.map(l => ({ ...l, v: l.v * .9 })), perc: [] };
  TRACKS.snack = {
    bpm: 112,
    layers: [
      { w: 'triangle', v: .15, env: 'pluck', seq: `F4:1 A4:1 C5:1 A4:1  G4:1 F4:2 R:1  A4:1 C5:1 D5:1 C5:1  A4:3 R:1
              F4:1 A4:1 C5:1 F5:1  E5:1 C5:2 R:1  D5:1 C5:1 A4:1 G4:1  F4:3 R:1` },
      { w: 'sine', v: .11, env: 'pad', seq: 'F2:4 Bb2:4 C3:4 F2:4 F2:4 Bb2:4 C3:4 F2:4' },
      { w: 'square', v: .03, env: 'pluck', seq: 'R:1 A4:.5 R:.5 R:1 A4:.5 R:.5 R:1 Bb4:.5 R:.5 R:1 C5:.5 R:.5 R:1 A4:.5 R:.5 R:1 A4:.5 R:.5 R:1 Bb4:.5 R:.5 R:1 C5:.5 R:.5' },
    ],
    perc: [{ n: 'kick', pat: 'x...x...' }, { n: 'shk', pat: '..x...x.' }],
  };
  TRACKS.dojo = {
    bpm: 96,
    layers: [
      { w: 'square', v: .07, env: 'pluck', seq: `A3:1 C4:1 D4:1 E4:1  G4:2 E4:2  D4:1 C4:1 A3:1 C4:1  D4:3 R:1
              A3:1 C4:1 D4:1 E4:1  G4:1 A4:2 G4:1  E4:1 D4:1 C4:1 D4:1  A3:3 R:1` },
      { w: 'sine', v: .12, env: 'pad', seq: 'A2:4 A2:4 G2:4 A2:4 A2:4 A2:4 G2:4 A2:4' },
    ],
    perc: [{ n: 'kick', pat: 'x..x..x.' }, { n: 'snare', pat: '....x...' }],
  };
  TRACKS.lagoon = {
    bpm: 90,
    layers: [
      { w: 'sine', v: .13, env: 'bell', seq: `E5:2 D5:1 C5:2 G4:1 A4:2 B4:1 C5:3
              E5:2 G5:1 E5:2 D5:1 C5:2 D5:1 E5:3
              A4:2 B4:1 C5:2 D5:1 E5:2 D5:1 C5:3
              B4:2 A4:1 G4:2 A4:1 C5:3 R:3` },
      { w: 'triangle', v: .06, env: 'pluck', seq: 'C3:1 E4:1 G4:1 C3:1 E4:1 G4:1 A2:1 E4:1 A4:1 A2:1 E4:1 A4:1 F2:1 C4:1 A4:1 F2:1 C4:1 A4:1 G2:1 D4:1 B4:1 G2:1 D4:1 B4:1 C3:1 E4:1 G4:1 C3:1 E4:1 G4:1 A2:1 E4:1 A4:1 A2:1 E4:1 A4:1 F2:1 C4:1 A4:1 F2:1 C4:1 A4:1 G2:1 D4:1 B4:1 G2:1 D4:1 B4:1' },
    ],
    perc: [],
  };
  TRACKS.mist = {
    bpm: 58,
    layers: [
      { w: 'sine', v: .1, env: 'pad', seq: 'D2:8 F2:8 C3:8 G2:8' },
      { w: 'sine', v: .07, env: 'bell', seq: 'R:2 D5:2 R:4 R:3 A4:1 R:4 R:2 F5:2 R:4 R:1 E5:1 C5:2 R:4' },
    ],
    perc: [],
  };
  TRACKS.ember = {
    bpm: 92,
    layers: [
      { w: 'triangle', v: .13, env: 'pluck', seq: `G3:1 Bb3:1 D4:1 G4:1  F4:2 D4:2  Eb4:1 D4:1 Bb3:1 D4:1  G3:3 R:1
              G3:1 Bb3:1 D4:1 G4:1  Bb4:2 A4:1 G4:1  F4:1 D4:1 Eb4:1 F4:1  G4:3 R:1` },
      { w: 'sine', v: .12, env: 'pad', seq: 'G2:4 Eb2:4 F2:4 G2:4 G2:4 Eb2:4 F2:4 D2:4' },
    ],
    perc: [{ n: 'kick', pat: 'x...x..x' }, { n: 'shk', pat: '..x...x.' }],
  };
  TRACKS.sail = {
    bpm: 116,
    layers: [
      { w: 'triangle', v: .16, env: 'pluck', seq: `C5:1 G4:1 E4:1 G4:1  C5:1 D5:2 R:1  E5:1 D5:1 C5:1 A4:1  G4:3 R:1
              C5:1 G4:1 E4:1 G4:1  A4:1 C5:2 R:1  D5:1 E5:1 D5:1 B4:1  C5:3 R:1` },
      { w: 'sine', v: .12, env: 'pad', seq: 'C3:4 F2:4 G2:4 C3:4 C3:4 F2:4 G2:4 C3:4' },
      { w: 'triangle', v: .045, env: 'pluck', seq: `${ARP.C} ${ARP.F} ${ARP.G} ${ARP.C} ${ARP.C} ${ARP.F} ${ARP.G} ${ARP.C}` },
    ],
    perc: [{ n: 'kick', pat: 'x...x...' }, { n: 'shk', pat: 'x.x.x.x.' }],
  };
  TRACKS.house = {
    bpm: 72,
    layers: [
      { w: 'sine', v: .11, env: 'bell', seq: `E5:1 G5:1 B4:2  D5:1 F5:1 A4:2  C5:1 E5:1 G4:2  B4:1 D5:1 G5:2
              E5:1 G5:1 B4:2  D5:1 F5:1 A4:2  C5:2 D5:2  E5:4` },
      { w: 'sine', v: .07, env: 'pad', seq: 'E3:4 D3:4 C3:4 G2:4 E3:4 D3:4 C3:8' },
    ],
    perc: [],
  };

  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    // music chain: layers -> musicGain -> lowpass -> master (+ delay shimmer)
    musicFilt = ac.createBiquadFilter(); musicFilt.type = 'lowpass'; musicFilt.frequency.value = 18000;
    musicGain = ac.createGain(); musicGain.gain.value = 0;
    musicBus = ac.createGain();
    musicBus.connect(musicGain); musicGain.connect(musicFilt); musicFilt.connect(master);
    delaySend = ac.createDelay(1); delaySend.delayTime.value = .28;
    const dGain = ac.createGain(); dGain.gain.value = .18;
    const dFb = ac.createGain(); dFb.gain.value = .25;
    musicGain.connect(delaySend); delaySend.connect(dFb); dFb.connect(delaySend);
    delaySend.connect(dGain); dGain.connect(musicFilt);
    sfxBus = ac.createGain(); sfxBus.gain.value = S.sfx ? 1 : 0; sfxBus.connect(master);
    // noise buffer
    const len = ac.sampleRate * 2;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // ambience: waves
    ambWave = makeAmb(420, 'bandpass', .0);
    ambBub = makeAmb(900, 'lowpass', .0);
    schedTimer = setInterval(schedule, 90);
    if (pendingTrack) { const t = pendingTrack; pendingTrack = null; play(t, 1.5); }
  }
  function makeAmb(freq, type, vol) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = .6;
    const g = ac.createGain(); g.gain.value = vol;
    const lfo = ac.createOscillator(); lfo.frequency.value = .13 + Math.random() * .1;
    const lg = ac.createGain(); lg.gain.value = vol * 0;
    src.connect(f); f.connect(g); g.connect(master);
    lfo.connect(lg); lg.connect(g.gain);
    src.start(); lfo.start();
    return { g, lg, f };
  }
  function unlock() {
    if (!ac) init();
    if (ac.state === 'suspended') ac.resume();
  }

  /* ── sequencer ────────────────────────────────────────── */
  function startTrack(name) {
    stopLayers();
    curTrack = name;
    const T = TRACKS[name];
    if (!T) return;
    const spb = 60 / T.bpm;
    const t0 = ac.currentTime + .12;
    layers = T.layers.map(l => {
      const g = ac.createGain(); g.gain.value = l.v; g.connect(musicBus);
      return { def: l, notes: parseSeq(l.seq), pos: 0, next: t0, g, spb };
    });
    percs = (T.perc || []).map(p => ({ def: p, pos: 0, next: t0, spb }));
  }
  function stopLayers() {
    layers.forEach(l => { try { l.g.disconnect(); } catch (e) {} });
    layers = []; percs = [];
  }
  function schedule() {
    if (!ac || !curTrack || ac.state !== 'running') return;
    const horizon = ac.currentTime + .38;
    layers.forEach(L => {
      let guard = 0;
      while (L.next < horizon && guard++ < 64) {
        const n = L.notes[L.pos];
        if (n.f > 0 && S.music) note(n.f, L.next, n.b * L.spb, L.def.w, L.def.env, L.g);
        L.next += n.b * L.spb;
        L.pos = (L.pos + 1) % L.notes.length;
      }
    });
    percs.forEach(P => {
      let guard = 0;
      const step = P.spb / 2;
      while (P.next < horizon && guard++ < 64) {
        const ch = P.def.pat[P.pos % P.def.pat.length];
        if (ch === 'x' && S.music) percHit(P.def.n, P.next);
        P.next += step;
        P.pos++;
      }
    });
  }
  function note(f, t, dur, wave, env, out) {
    const o = ac.createOscillator(); o.type = wave; o.frequency.value = f;
    const g = ac.createGain();
    o.connect(g); g.connect(out);
    const a = Math.max(.008, env === 'pad' ? Math.min(.4, dur * .3) : .008);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + a);
    if (env === 'pluck') {
      const d = Math.min(Math.max(.22, dur * .9), .6);
      g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.start(t); o.stop(t + d + .05);
    } else if (env === 'bell') {
      const d = Math.min(Math.max(.5, dur), 1.6);
      g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.start(t); o.stop(t + d + .05);
    } else { // pad
      g.gain.setValueAtTime(1, t + Math.max(a, dur - .3));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.start(t); o.stop(t + dur + .05);
    }
  }
  function percHit(kind, t) {
    if (kind === 'kick') {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
      g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .14);
      o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + .16);
    } else {
      const src = ac.createBufferSource(); src.buffer = noiseBuf;
      src.playbackRate.value = kind === 'shk' ? 1.6 : 1;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = kind === 'shk' ? 6500 : 2000;
      const g = ac.createGain();
      const v = kind === 'shk' ? .05 : .12, d = kind === 'shk' ? .05 : .12;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      src.connect(f); f.connect(g); g.connect(musicBus);
      src.start(t, Math.random()); src.stop(t + d + .02);
    }
  }

  function play(name, fadeSec = 1.2) {
    if (!ac) { pendingTrack = name; return; }
    if (curTrack === name) return;
    const now = ac.currentTime;
    if (curTrack && !fading) {
      fading = true;
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(0, now + .7);
      setTimeout(() => {
        fading = false;
        startTrack(name);
        const t2 = ac.currentTime;
        musicGain.gain.cancelScheduledValues(t2);
        musicGain.gain.setValueAtTime(0, t2);
        musicGain.gain.linearRampToValueAtTime(.9, t2 + fadeSec);
      }, 720);
    } else if (!fading) {
      startTrack(name);
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(.9, now + fadeSec);
    } else {
      pendingLate(name, fadeSec);
    }
  }
  let lateTimer = null;
  function pendingLate(name, f) { clearTimeout(lateTimer); lateTimer = setTimeout(() => play(name, f), 800); }
  function stopMusic() {
    if (!ac || !curTrack) return;
    const now = ac.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    musicGain.gain.linearRampToValueAtTime(0, now + .6);
    curTrack = null;
    setTimeout(stopLayers, 650);
  }

  /* depth: 0 = surface … 1 = abyss. Muffles music, swaps ambience */
  function setDepth(d) {
    if (!ac) return;
    const f = d <= 0 ? 18000 : lerp(2600, 320, clamp(d, 0, 1));
    musicFilt.frequency.setTargetAtTime(f, ac.currentTime, .25);
  }
  function ambience(mode, shore = 1) {
    if (!ac) return;
    const t = ac.currentTime;
    const wv = mode === 'island' ? .028 * shore : 0;
    const bb = mode === 'dive' ? .02 : 0;
    ambWave.g.gain.setTargetAtTime(S.sfx ? wv : 0, t, .8);
    ambBub.g.gain.setTargetAtTime(S.sfx ? bb : 0, t, .8);
  }

  /* ── SFX ──────────────────────────────────────────────── */
  function tone(f0, f1, dur, wave, vol, t0 = 0) {
    if (!ac || !S.sfx) return;
    const t = ac.currentTime + t0;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + dur + .05);
  }
  function noiseHit(vol, dur, filtFreq, type = 'lowpass', t0 = 0) {
    if (!ac || !S.sfx) return;
    const t = ac.currentTime + t0;
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = filtFreq;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t, Math.random()); src.stop(t + dur + .02);
  }
  const PENTA = [261.63, 329.63, 392, 440, 523.25]; // C E G A C — echo-song notes
  const SFX = {
    tap: () => tone(660, 880, .07, 'sine', .12),
    blip: () => tone(880, 990, .04, 'square', .04),
    step: () => noiseHit(.05, .07, 900),
    pickup: () => { tone(740, 1180, .1, 'sine', .14); tone(1480, 1760, .12, 'sine', .07, .05); },
    shellS: () => { tone(523, 659, .09, 'triangle', .13); tone(1047, 1319, .1, 'sine', .06, .06); },
    pearl: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, .5, 'sine', .12, i * .1)); },
    quest: () => { [523, 659, 784].forEach((f, i) => tone(f, f, .22, 'triangle', .14, i * .12)); tone(1047, 1047, .5, 'triangle', .14, .36); },
    heartS: () => { tone(784, 988, .14, 'sine', .12); tone(1175, 1319, .2, 'sine', .09, .1); },
    splash: () => { noiseHit(.3, .4, 1400); tone(300, 90, .3, 'sine', .12); },
    bubble: () => tone(rnd(400, 700), rnd(900, 1400), .12, 'sine', .05),
    sting: () => { tone(330, 190, .25, 'sawtooth', .06); tone(220, 140, .3, 'sine', .1, .05); },
    catchS: () => { noiseHit(.14, .12, 3000, 'highpass'); tone(880, 1320, .12, 'sine', .12, .06); },
    dashS: () => noiseHit(.12, .18, 1800),
    chirp: () => { const f = rnd(2000, 3200); tone(f, f * 1.3, .07, 'sine', .035); tone(f * 1.1, f * .9, .06, 'sine', .03, .09); },
    noteI: i => { const f = PENTA[i % PENTA.length]; tone(f * 2, f * 2, .45, 'sine', .16); tone(f * 4, f * 4, .3, 'sine', .05); },
    good: () => { [659, 784, 1047].forEach((f, i) => tone(f, f, .3, 'sine', .13, i * .07)); },
    bad: () => { tone(392, 330, .3, 'triangle', .1); tone(311, 262, .35, 'triangle', .1, .12); },
    boom: () => { noiseHit(.4, .8, 500); tone(160, 40, .8, 'sine', .25); },
    twinkle: () => { const f = rnd(1200, 2400); tone(f, f * 1.5, .3, 'sine', .05); },
    cookTick: () => tone(1200, 1200, .05, 'square', .06),
    ding: () => { tone(1568, 1568, .6, 'sine', .12); tone(3136, 3136, .3, 'sine', .04); },
    thunder: () => { noiseHit(.5, 1.6, 240); tone(70, 45, 1.4, 'sine', .2); },
    yay: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, .3, 'triangle', .1, i * .06)); },
    write: () => noiseHit(.04, .05, 4000, 'highpass'),
  };
  function sfx(name, arg) { const f = SFX[name]; if (f) f(arg); }

  function setMusicOn(on) { S.music = on; markSave(); if (ac && !on) stopLayers(); if (ac && on && curTrack) startTrack(curTrack); }
  function setSfxOn(on) { S.sfx = on; markSave(); if (sfxBus) sfxBus.gain.value = on ? 1 : 0; }
  function current() { return curTrack; }
  function hush() { if (ac && ac.state === 'running') ac.suspend(); }
  function wake() { if (ac && ac.state === 'suspended') ac.resume(); }

  return { init, unlock, play, stopMusic, setDepth, ambience, sfx, setMusicOn, setSfxOn, current, PENTA, hush, wake };
})();
/* ============================================================
   DATA — archipelago, items, shops, outfits, fish, quests
   ============================================================ */

/* ── the archipelago ─────────────────────────────────────── */
const ISLES = {
  home:    { name: 'Shimmer Isle',   w: 12000, seaX: 900,   dock: 340,  theme: 'home',    music: 'island', unlockMq: 0 },
  snack:   { name: 'Snack Cove',     w: 4800,  seaX: 3600,  dock: 380,  theme: 'snack',   music: 'snack',  unlockMq: 10 },
  turtle:  { name: 'Turtle Island',  w: 5200,  seaX: 6400,  dock: 380,  theme: 'turtle',  music: 'dojo',   unlockMq: 14 },
  lagoon:  { name: 'Mermaid Lagoon', w: 4600,  seaX: 9200,  dock: 380,  theme: 'lagoon',  music: 'lagoon', unlockMq: 21 },
  mist:    { name: 'Foglight Isle',  w: 4200,  seaX: 12000, dock: 380,  theme: 'mist',    music: 'mist',   unlockMq: 26 },
  volcano: { name: 'Ember Isle',     w: 5000,  seaX: 14800, dock: 380,  theme: 'volcano', music: 'ember',  unlockMq: 34 },
};
const SEA_W = 15800;
const isleDef = () => ISLES[S.isle];
function isleUnlocked(id) { return S.mq >= ISLES[id].unlockMq || S.mq >= 99; }

/* zones for ambience labels (home only, others one zone) */
const HOME_ZONES = [
  { x0: 0, x1: 2400, name: 'Sunrise Beach' },
  { x0: 2400, x1: 4900, name: 'Seashell Village' },
  { x0: 4900, x1: 7700, name: 'Whispering Jungle' },
  { x0: 7700, x1: 9700, name: 'Boardwalk & Tidepools' },
  { x0: 9700, x1: 12000, name: 'Lighthouse Cliff' },
];

/* buoys: per isle → dive map + spawn x */
const BUOYS = {
  home: [
    { x: 700, map: 'home', uwx: 950, name: 'Reef Buoy' },
    { x: 4750, map: 'home', uwx: 2750, name: 'Pier Buoy' },
    { x: 9900, map: 'home', uwx: 4800, name: 'Cove Buoy' },
  ],
  lagoon: [{ x: 1800, map: 'lagoon', uwx: 800, name: 'Lagoon Buoy' }],
  volcano: [{ x: 4200, map: 'ember', uwx: 700, name: 'Ember Buoy' }],
  snack: [], turtle: [], mist: [],
};
const DIVEMAPS = {
  home:   { w: 6000, d: 3600 },
  lagoon: { w: 4200, d: 1500 },
  ember:  { w: 3800, d: 2400 },
};

/* key world x-positions (home isle) */
const POS = {
  dock: 340, boat: 120, cottage: 1050, cafe: 1650, cafeDoor: 1760,
  garage: 2850, boutiqueTP: 9250, furnShop: 3700, toyShop: 4150, purinStand: 4450,
  melody: 1540, pochacco: 2850, purin: 4400, kittyLH: 11150, sammy: 4150,
  jungle0: 5000, jungle1: 7600, icecream: 8250, sandcastle: 8650, tidepools: 9250,
  ramp1: 2250, ramp2: 6300, ramp3: 8900,
};

/* ── items ───────────────────────────────────────────────── */
const ITEMS = {
  mango: { n: 'Mango', em: '🥭' }, banana: { n: 'Banana', em: '🍌' }, coconut: { n: 'Coconut', em: '🥥' },
  blueberry: { n: 'Blueberry', em: '🫐' }, firefruit: { n: 'Fire Fruit', em: '🌶️' },
  flour: { n: 'Flour', em: '🌾' }, plank: { n: 'Driftwood', em: '🪵' },
  silvershell: { n: 'Silver Shell', em: '🐚' }, boatpart: { n: 'Boat Part', em: '⚙️' },
  prism: { n: 'Lamp Prism', em: '🔷' }, moonkelp: { n: 'Moon Kelp', em: '🌿' },
  treat: { n: 'Pusheen Treat', em: '🍪' }, donut: { n: 'Donut', em: '🍩' },
  icecream: { n: 'Ice Cream', em: '🍦' }, lemonade: { n: 'Lemonade', em: '🍋' },
  dish_tart: { n: 'Sunrise Tart', em: '🥧' }, dish_pudding: { n: 'Dreamy Pudding', em: '🍮' },
  dish_reefroll: { n: 'Reef Roll', em: '🍣' }, dish_glowsoup: { n: 'Glow Soup', em: '🍲' },
  dish_starcake: { n: 'Starlight Cake', em: '🎂' }, dish_pizza: { n: 'Island Pizza', em: '🍕' },
  dish_stew: { n: 'Fire Fruit Stew', em: '🍛' },
};

/* ── fish (26 creatures across 3 seas) ───────────────────── */
const FISH = [
  // home waters (original cast)
  { id: 'sunfish', n: 'Sunny Sunfish', map: 'home', band: 0, rare: 0, val: 3, sz: 26, spd: 40, shape: 'oval', c1: '#FFD24C', c2: '#FF9838', fact: 'Real ocean sunfish can grow heavier than a car!' },
  { id: 'clown', n: 'Giggle Clownfish', map: 'home', band: 0, rare: 0, val: 4, sz: 22, spd: 55, shape: 'oval', c1: '#FF7A3C', c2: '#FFFFFF', fact: 'Clownfish hide in anemones that would sting other fish.' },
  { id: 'tang', n: 'Blueberry Tang', map: 'home', band: 0, rare: 0, val: 4, sz: 24, spd: 60, shape: 'tall', c1: '#3E7BFF', c2: '#FFE14C', fact: 'Tangs tuck themselves into coral cracks to sleep.' },
  { id: 'butterfly', n: 'Butterfly Fish', map: 'home', band: 0, rare: 0, val: 5, sz: 22, spd: 50, shape: 'tall', c1: '#FFE14C', c2: '#3B3B4F', fact: 'It has a fake eye near its tail to confuse nibblers!' },
  { id: 'parrot', n: 'Rainbow Parrotfish', map: 'home', band: 0, rare: 1, val: 7, sz: 30, spd: 45, shape: 'oval', c1: '#39C6A5', c2: '#FF7AB6', fact: 'Parrotfish crunch coral and turn it into soft white sand.' },
  { id: 'seahorse', n: 'Sparkle Seahorse', map: 'home', band: 0, rare: 2, val: 12, sz: 20, spd: 18, shape: 'seahorse', c1: '#FF9FD0', c2: '#FFD24C', fact: 'Seahorse dads are the ones who carry the babies!' },
  { id: 'lantern', n: 'Lanternfish', map: 'home', band: 1, rare: 0, val: 6, sz: 20, spd: 55, shape: 'oval', c1: '#57E0E8', c2: '#1B6E8C', fact: 'It makes its own light, like a tiny living flashlight.' },
  { id: 'hatchet', n: 'Silver Hatchetfish', map: 'home', band: 1, rare: 0, val: 7, sz: 20, spd: 60, shape: 'tall', c1: '#C9D6E8', c2: '#7B8FA8', fact: 'Its mirror-shiny sides help it vanish in the dim water.' },
  { id: 'snapper', n: 'Moon Snapper', map: 'home', band: 1, rare: 0, val: 8, sz: 28, spd: 50, shape: 'oval', c1: '#B9A8FF', c2: '#6E5BD0', fact: 'Snappers drum little songs to each other at night.' },
  { id: 'eel', n: 'Ribbon Eel', map: 'home', band: 1, rare: 2, val: 12, sz: 40, spd: 40, shape: 'eel', c1: '#3E7BFF', c2: '#FFE14C', fact: 'Ribbon eels start out black and turn bright blue as they grow!' },
  { id: 'squid', n: 'Twinkle Squid', map: 'home', band: 1, rare: 2, val: 14, sz: 26, spd: 45, shape: 'squid', c1: '#C77DFF', c2: '#8E4FD0', fact: 'Squids have three hearts. Three!' },
  { id: 'angler', n: 'Lantern Angler', map: 'home', band: 2, rare: 0, val: 10, sz: 28, spd: 35, shape: 'angler', c1: '#2E4057', c2: '#9BE8FF', fact: 'She fishes with a glowing lure — a fisher who IS a fish.' },
  { id: 'ghost', n: 'Ghostfish', map: 'home', band: 2, rare: 0, val: 10, sz: 24, spd: 30, shape: 'oval', c1: '#D8E8F0', c2: '#9FB8CC', fact: 'It lives so deep it has never once seen the sun.' },
  { id: 'crab', n: 'Crystal Crab', map: 'home', band: 2, rare: 0, val: 9, sz: 24, spd: 20, shape: 'crab', c1: '#9BE8FF', c2: '#5BB8D8', fact: 'Crabs wear their skeleton on the OUTSIDE.' },
  { id: 'dumbo', n: 'Dumbo Octopus', map: 'home', band: 2, rare: 2, val: 16, sz: 26, spd: 25, shape: 'squid', c1: '#FF9FD0', c2: '#E56A93', fact: 'It flaps big ear-like fins to fly through the deep!' },
  { id: 'ray', n: 'Starlight Ray', map: 'home', band: 2, rare: 3, val: 25, sz: 52, spd: 30, shape: 'ray', c1: '#2B3A6E', c2: '#9BE8FF', fact: 'She glides through the dark like a kite with wings of stars.' },
  { id: 'whale', n: 'Melody Whale', map: 'home', band: 2, rare: 3, val: 0, sz: 220, spd: 12, shape: 'whale', c1: '#3E5C8C', c2: '#9BB8E0', sight: true, fact: 'Her song carries for miles and miles beneath the sea.' },
  // the silver tide
  { id: 'sardine', n: 'Silver Sardine', map: 'any', band: 0, rare: 1, val: 6, sz: 18, spd: 70, shape: 'oval', c1: '#DCE8F4', c2: '#9FB8D8', fact: 'It arrived with the Silver Tide, glittering like a coin.' },
  // lagoon
  { id: 'pinkangel', n: 'Pink Angelfish', map: 'lagoon', band: 0, rare: 0, val: 6, sz: 24, spd: 45, shape: 'tall', c1: '#FF9FD0', c2: '#FFE9F2', fact: 'Angelfish grow up wearing completely different colors than their parents.' },
  { id: 'wrasse', n: 'Rainbow Wrasse', map: 'lagoon', band: 0, rare: 0, val: 7, sz: 22, spd: 60, shape: 'oval', c1: '#39C6A5', c2: '#FFB84D', fact: 'Wrasses give bigger fish little cleaning check-ups!' },
  { id: 'shrimp', n: 'Kelp Shrimp', map: 'lagoon', band: 0, rare: 1, val: 8, sz: 16, spd: 30, shape: 'crab', c1: '#FFB6C1', c2: '#FF8FB1', fact: 'Some shrimp can snap their claws louder than a firecracker.' },
  { id: 'seaturtle', n: 'Green Sea Turtle', map: 'lagoon', band: 0, rare: 3, val: 0, sz: 60, spd: 25, shape: 'ray', c1: '#3E9E5C', c2: '#A8D8A0', sight: true, fact: 'Sea turtles come back to the very beach where they hatched.' },
  // ember
  { id: 'ember', n: 'Emberfish', map: 'ember', band: 1, rare: 0, val: 9, sz: 22, spd: 55, shape: 'oval', c1: '#FF6B4A', c2: '#FFD24C', fact: 'It loves warm water and glows like a little coal.' },
  { id: 'puffer', n: 'Puffy Pufferfish', map: 'ember', band: 1, rare: 1, val: 11, sz: 24, spd: 30, shape: 'oval', c1: '#FFE14C', c2: '#C9A84C', fact: 'When surprised, it puffs into a spiky balloon!' },
  { id: 'obscrab', n: 'Obsidian Crab', map: 'ember', band: 2, rare: 1, val: 12, sz: 26, spd: 20, shape: 'crab', c1: '#4A4A5C', c2: '#FF6B4A', fact: 'Its shell is made shiny-dark by volcano glass.' },
  { id: 'calf', n: 'Silver Whale Calf', map: 'ember', band: 2, rare: 3, val: 0, sz: 130, spd: 20, shape: 'whale', c1: '#C9D6E8', c2: '#EAF2FA', sight: true, fact: 'A baby whale with a song made of moonlight.' },
];
const fishById = id => FISH.find(f => f.id === id);

/* ── recipes ─────────────────────────────────────────────── */
const RECIPES = [
  { id: 'tart', n: 'Sunrise Tart', em: '🥧', need: { mango: 2, banana: 1 }, pay: 12 },
  { id: 'reefroll', n: 'Reef Roll', em: '🍣', need: { sunfish: 2, banana: 1 }, pay: 18 },
  { id: 'pudding', n: 'Dreamy Pudding', em: '🍮', need: { coconut: 3, mango: 1 }, pay: 15 },
  { id: 'pizza', n: 'Island Pizza', em: '🍕', need: { flour: 1, sunfish: 2, mango: 1 }, pay: 20 },
  { id: 'glowsoup', n: 'Glow Soup', em: '🍲', need: { lantern: 2, coconut: 1 }, pay: 26 },
  { id: 'stew', n: 'Fire Fruit Stew', em: '🍛', need: { firefruit: 2, coconut: 1, flour: 1 }, pay: 30 },
  { id: 'starcake', n: 'Starlight Cake', em: '🎂', need: { mango: 2, coconut: 2, ghost: 1 }, pay: 40 },
];

/* ── outfits & hats ──────────────────────────────────────── */
const DRESSES = {
  red:        { n: 'Explorer Red', a: '#E23B4E', b: '#C22B3E', cost: 0 },
  sunny:      { n: 'Sunny Day', a: '#FFD24C', b: '#F0A828', cost: 30 },
  ocean:      { n: 'Ocean Blue', a: '#3E7BFF', b: '#2B5BB5', cost: 30 },
  mint:       { n: 'Mint Sailor', a: '#7FE0C0', b: '#4FBE9E', cost: 35 },
  lavender:   { n: 'Lavender Twirl', a: '#B9A8FF', b: '#8E7BD0', cost: 35 },
  strawberry: { n: 'Strawberry Frill', a: '#FF8FB1', b: '#E56A93', cost: 40 },
  star:       { n: 'Starry Night', a: '#2B3A6E', b: '#1E2A52', star: true, cost: 50 },
  shimmer:    { n: 'Mermaid Shimmer', a: '#57E0E8', b: '#39A6C6', cost: 80 },
  aurora:     { n: 'Aurora Dress', a: 'rainbow', b: '', cost: -1 }, // 12 charms reward
};
const HATS = {
  sunhat:  { n: 'Sun Hat', cost: 20 }, bow: { n: 'Big Red Bow', cost: 15 },
  flowers: { n: 'Flower Crown', cost: 25 }, captain: { n: 'Captain Cap', cost: 30 },
  crown:   { n: 'Pearl Crown', cost: 60 },
  hb_blue: { n: 'Blue Headband', cost: 20, perk: 'Swim a little faster' },
  hb_red:  { n: 'Red Headband', cost: 20, perk: 'Bike a little faster' },
  hb_orange: { n: 'Orange Headband', cost: 20, perk: 'Yummier cooking tips' },
  hb_purple: { n: 'Purple Headband', cost: 20, perk: 'Sparkles show secrets sooner' },
};

/* ── furniture (cottage) ─────────────────────────────────── */
const FURN = {
  catbed:   { n: 'Cozy Cat Bed', em: '🛏️', cost: 25 },
  rug:      { n: 'Round Rug', em: '🟠', cost: 20 },
  lamp:     { n: 'Shell Lamp', em: '🪔', cost: 20 },
  plant:    { n: 'Palm Plant', em: '🪴', cost: 15 },
  bookshelf:{ n: 'Little Bookshelf', em: '📚', cost: 30 },
  table:    { n: 'Tea Table', em: '🍵', cost: 25 },
  toybox:   { n: 'Toy Box', em: '🧸', cost: 30 },
  aquarium: { n: 'Bubbly Aquarium', em: '🐠', cost: 45 },
  mobile:   { n: 'Star Mobile', em: '✨', cost: 35 },
  poster:   { n: 'Pudding Poster', em: '🖼️', cost: 15 },
  mirror:   { n: 'Seashell Mirror', em: '🪞', cost: 40 },
  chair:    { n: 'Cozy Chair', em: '🛋️', cost: 30 },
  musicbox: { n: 'Music Box', em: '🎶', cost: 50 },
};
const HOUSE_SLOTS = 8; // placement spots inside the cottage

/* ── shops ───────────────────────────────────────────────── */
const SHOPS = {
  garage: {
    title: "🚲 Pochacco's Garage & Dive", keeper: 'pochacco',
    stock: [
      { kind: 'gear', id: 'flippers', n: 'Zoomy Flippers', em: '🩴', cost: 45, d: 'Swim 50% faster!' },
      { kind: 'gear', id: 'tank2', n: 'Big Bubble Tank', em: '🛢️', cost: 60, d: 'Lots more air for deep dives.' },
      { kind: 'gear', id: 'tank3', n: 'Mega Bubble Tank', em: '🫧', cost: 110, d: 'Huge air supply — the deepest deeps.', needs: 'tank2' },
      { kind: 'gear', id: 'wetsuit', n: 'Cozy Wetsuit', em: '🩱', cost: 40, d: 'Jellyfish stings only tickle.' },
      { kind: 'gear', id: 'net', n: 'Pearl Net', em: '🥍', cost: 55, d: 'Catch fish from farther away.' },
      { kind: 'upgrade', id: 'bell', n: 'Bike Bell', em: '🔔', cost: 15, d: 'Ring-ring! (Press action while riding)' },
      { kind: 'upgrade', id: 'fattires', n: 'Extra-Fat Tires', em: '🛞', cost: 30, d: 'Bike 25% faster on sand.' },
      { kind: 'upgrade', id: 'wax', n: 'Surf Wax', em: '🧴', cost: 25, d: 'Windsurf 25% faster.' },
      { kind: 'upgrade', id: 'sail2', n: 'Rainbow Sail', em: '🌈', cost: 40, d: 'A beautiful new sail for the boat.' },
      { kind: 'upgrade', id: 'motor', n: 'Turbo Rudder', em: '⚡', cost: 60, d: 'Sail 30% faster between islands.' },
    ],
  },
  boutique: {
    title: "👗 Coral's Tidepool Boutique", keeper: 'coral',
    stock: [], // filled from DRESSES + HATS at render
  },
  furniture: {
    title: "🛋️ Purin's Comfy Corner", keeper: 'purin',
    stock: [], // filled from FURN
  },
  snackshack: {
    title: "🍪 Pusheen's Snack Shack", keeper: 'pusheen',
    stock: [
      { kind: 'item', id: 'treat', n: 'Pusheen Treat', em: '🍪', cost: 5, d: 'A cookie for a very good cat.' },
      { kind: 'item', id: 'donut', n: 'Donut', em: '🍩', cost: 10, d: 'Give it to a friend for a friendship heart!' },
      { kind: 'item', id: 'lemonade', n: 'Lemonade', em: '🍋', cost: 8, d: 'Sweet, cold, and shareable.' },
      { kind: 'item', id: 'flour', n: 'Bag of Flour', em: '🌾', cost: 6, d: 'For pizza and stew at the café.' },
      { kind: 'item', id: 'blueberry', n: 'Blueberry Basket', em: '🫐', cost: 4, d: 'Plump cove blueberries.' },
    ],
  },
  toyshop: {
    title: "🧸 Sammy's Treasure Stand", keeper: 'sammy',
    stock: [
      { kind: 'item', id: 'icecream', n: 'Ice Cream', em: '🍦', cost: 6, d: 'Share with a friend! (+heart)' },
      { kind: 'flag', id: 'spyglass', n: 'Spyglass', em: '🔭', cost: 35, d: 'Secret sparkles glow from farther away.' },
      { kind: 'recipe', id: 'starcake', n: 'Starlight Cake Recipe', em: '📜', cost: 45, d: 'A legendary café recipe card.' },
      { kind: 'furn', id: 'musicbox', n: 'Music Box', em: '🎶', cost: 50, d: 'Plays the island song in your cottage.' },
      { kind: 'flag', id: 'kite', n: 'Rainbow Kite', em: '🪁', cost: 25, d: 'Flies behind you on the beach on windy days!' },
    ],
  },
};

/* ── races ───────────────────────────────────────────────── */
const RACES = {
  bike1: { n: 'Beach Sprint', isle: 'home', veh: 'bike', gates: [3300, 4200, 5300, 6400], startX: 2600, gold: 24, silver: 32, bronze: 45 },
  bike2: { n: 'Boardwalk Blitz', isle: 'home', veh: 'bike', gates: [7900, 8500, 9100, 9700, 10400, 11000], startX: 7500, gold: 33, silver: 44, bronze: 60 },
  surf1: { n: 'Lagoon Slalom', isle: 'lagoon', veh: 'surf', gates: [2800, 3150, 3500, 3850, 4200], startX: 2550, gold: 20, silver: 28, bronze: 40 },
  surf2: { n: 'Sunset Skim', isle: 'home', veh: 'surf', gates: [8000, 8400, 8800, 9200, 9550], startX: 7800, gold: 18, silver: 25, bronze: 36 },
};

/* ── treasure maps (2 pieces each) ───────────────────────── */
const TMAPS = [
  { id: 'm1', n: 'Sandy Map', isle: 'home', x: 8620, reward: { shells: 40, charm: true } },
  { id: 'm2', n: 'Picnic Map', isle: 'snack', x: 4020, reward: { shells: 30, dress: 'star' } },
  { id: 'm3', n: 'Zen Map', isle: 'turtle', x: 4620, reward: { shells: 30, furn: 'aquarium' } },
  { id: 'm4', n: 'Ember Map', isle: 'volcano', x: 820, reward: { shells: 60, flag: 'goldbell' } },
];
function mapComplete(id) { return S.mapPieces.includes(id + 'a') && S.mapPieces.includes(id + 'b'); }

/* ── seashell charms (12 hidden across the isles) ────────── */
const CHARMS = [
  { id: 'c1', isle: 'home', x: 190 }, { id: 'c2', isle: 'home', x: 5600 },
  { id: 'c3', isle: 'home', x: 9420 }, { id: 'c4', isle: 'home', x: 11800 },
  { id: 'c5', isle: 'snack', x: 1600 }, { id: 'c6', isle: 'snack', x: 4500 },
  { id: 'c7', isle: 'turtle', x: 2100 }, { id: 'c8', isle: 'turtle', x: 4900 },
  { id: 'c9', isle: 'lagoon', x: 1100 }, { id: 'c10', isle: 'lagoon', x: 4300 },
  { id: 'c11', isle: 'mist', x: 2200 }, { id: 'c12', isle: 'volcano', x: 3000 },
];

/* ── NPCs ────────────────────────────────────────────────── */
const NPCS = {
  lila: { n: 'Lila', col: '#FF8FB1' },
  melody: { n: 'My Melody', col: '#FFB3C9' },
  pochacco: { n: 'Pochacco', col: '#BFE3FF' },
  purin: { n: 'Pompompurin', col: '#FFDD75' },
  kitty: { n: 'Hello Kitty', col: '#FF6B81' },
  sammy: { n: 'Sammy the Squirrel', col: '#D4A464' },
  pigeon: { n: 'Pearl the Pigeon', col: '#C9C9E8' },
  coral: { n: 'Coral', col: '#FF9FD0' },
  marina: { n: 'Marina', col: '#8FD0FF' },
  queen: { n: 'Queen Nerissa', col: '#B9A8FF' },
  inky: { n: 'Maestro Inky', col: '#A88FD0' },
  pusheen: { n: 'Pusheen', col: '#B8BCC9' },
  leo: { n: 'Leonardo', col: '#7FD8E8' },
  raph: { n: 'Raphael', col: '#FF8A80' },
  mikey: { n: 'Michelangelo', col: '#FFC24C' },
  donnie: { n: 'Donatello', col: '#C89EF0' },
  glimmer: { n: 'Glimmer', col: '#D8F4FF' },
};

/* ── chapters & main quests ──────────────────────────────── */
const CHAPTERS = [
  null,
  { at: 1, n: 'The Silver Tide' },       // 1-5
  { at: 6, n: 'Wheels & Waves' },        // 6-9
  { at: 10, n: 'Snack Cove' },           // 10-13
  { at: 14, n: 'Turtle Island' },        // 14-17
  { at: 18, n: 'A Friend for the Cottage' }, // 18-20
  { at: 21, n: 'The Mermaid Lagoon' },   // 21-25
  { at: 26, n: 'Foglight Isle' },        // 26-29
  { at: 30, n: 'The Silver Storm' },     // 30-33
  { at: 34, n: 'Ember Isle' },           // 34-38
  { at: 39, n: 'The Moon Pearl' },       // 39-42
];
function chapterOf(mq) {
  let c = 1;
  for (let i = 1; i < CHAPTERS.length; i++) if (mq >= CHAPTERS[i].at) c = i;
  return c;
}
/* title, dynamic hint, compass target */
const MQ = [null,
  /*1*/ { t: 'Welcome Home!', h: 'Say hello to My Melody at the Beach Café ☕', tgt: () => ({ isle: 'home', x: POS.melody }) },
  /*2*/ { t: 'Silver on the Sand', h: () => `Gather the strange silver shells on the beach (${invCount('silvershell')}/5) 🐚`, tgt: () => invCount('silvershell') >= 5 ? { isle: 'home', x: POS.melody } : { isle: 'home', x: 2000 } },
  /*3*/ { t: "Kitty's Surprise", h: () => S.flags.gotCottage ? 'Open the door of your very own cottage! 🏠' : 'Hello Kitty has a surprise for you at the lighthouse 💝', tgt: () => S.flags.gotCottage ? { isle: 'home', x: POS.cottage } : { isle: 'home', x: POS.kittyLH } },
  /*4*/ { t: 'Sweet Dreams', h: 'Climb into your new bed and take a nap… 😴', tgt: () => ({ isle: 'home', x: POS.cottage }) },
  /*5*/ { t: 'The Queen\'s Warning', h: 'Dive at the Reef Buoy — Queen Nerissa is waiting by Coral\'s rock 👑', tgt: () => ({ isle: 'home', x: 700, dive: true }) },
  /*6*/ { t: 'Pochacco\'s Garage', h: () => S.flags.bikeRaceStarted ? 'Win the Beach Sprint to earn your bike! 🚲' : 'Visit Pochacco\'s new garage in the village 🔧', tgt: () => ({ isle: 'home', x: POS.garage }) },
  /*7*/ { t: 'Ramp Champ', h: 'Ride your bike over a trick ramp — catch some air! 🚲💨', tgt: () => ({ isle: 'home', x: POS.ramp1 }) },
  /*8*/ { t: 'Three Boat Parts', h: () => `Find boat parts for the old sailboat (${invCount('boatpart')}/3): dock, jungle & tidepools ⚙️`, tgt: () => invCount('boatpart') >= 3 ? { isle: 'home', x: POS.garage } : { isle: 'home', x: [420, 6800, 9350][invCount('boatpart')] || 420 } },
  /*9*/ { t: 'Maiden Voyage', h: 'Set sail! Follow the silver sparkles out to sea ⛵', tgt: () => ({ isle: 'home', x: POS.dock }) },
  /*10*/ { t: 'Land Ho: Snack Cove!', h: 'Sail east to the new island: Snack Cove 🍩', tgt: () => ({ sail: 'snack' }) },
  /*11*/ { t: 'The Sleepiest Cat', h: () => invCount('dish_reefroll') || invCount('dish_tart') ? 'Wake the round gray cat with something yummy 🍣' : 'Someone\'s asleep on the donut float… bake a treat at the café to wake them! (Reef Roll or Tart)', tgt: () => (invCount('dish_reefroll') || invCount('dish_tart')) ? { isle: 'snack', x: 1250 } : { isle: 'home', x: POS.cafeDoor } },
  /*12*/ { t: 'Perfect Picnic', h: () => `Pusheen's picnic: blueberries (${invCount('blueberry')}/6) and coconuts (${invCount('coconut')}/2) 🧺`, tgt: () => hasItems({ blueberry: 6, coconut: 2 }) ? { isle: 'snack', x: 4000 } : { isle: 'snack', x: 3000 } },
  /*13*/ { t: 'The Singing Sardine', h: 'Catch a Silver Sardine in the shallows and show Pusheen ✨🐟', tgt: () => invCount('sardine') ? { isle: 'snack', x: 1250 } : { isle: 'home', x: 700, dive: true } },
  /*14*/ { t: 'Turtle Island', h: 'Sail east to Turtle Island 🐢', tgt: () => ({ sail: 'turtle' }) },
  /*15*/ { t: 'The Four Brothers', h: 'Meet the turtles at their beach dojo 🥋', tgt: () => ({ isle: 'turtle', x: 2650 }) },
  /*16*/ { t: 'Training: Focus!', h: 'Pass Leonardo\'s focus training at the dojo 🎯', tgt: () => ({ isle: 'turtle', x: 3800 }) },
  /*17*/ { t: 'Pizza Time!', h: () => invCount('dish_pizza') >= 2 ? 'Deliver 2 pizzas to the dojo — sail fast, keep \'em warm! 🍕' : 'Bake 2 Island Pizzas at the café (get flour at Snack Cove!) 🍕', tgt: () => invCount('dish_pizza') >= 2 ? { isle: 'turtle', x: 2650 } : { isle: 'home', x: POS.cafeDoor } },
  /*18*/ { t: 'A Special Visitor', h: 'Someone is waiting at the Shimmer Isle dock… 🐾', tgt: () => ({ isle: 'home', x: POS.dock + 160 }) },
  /*19*/ { t: 'A Bed for Pusheen', h: () => S.ownedFurn.includes('catbed') ? 'Place the cat bed in your cottage 🛏️' : 'Buy a Cozy Cat Bed at Purin\'s Comfy Corner 🛋️', tgt: () => S.ownedFurn.includes('catbed') ? { isle: 'home', x: POS.cottage } : { isle: 'home', x: POS.furnShop } },
  /*20*/ { t: 'Buried Wonders', h: 'Walk the beach with Pusheen — she smells something under the sand! 🐾', tgt: () => ({ isle: 'home', x: 1900 }) },
  /*21*/ { t: 'The Mermaid Lagoon', h: 'Sail east to the Mermaid Lagoon 🧜‍♀️', tgt: () => ({ sail: 'lagoon' }) },
  /*22*/ { t: 'Moon Kelp Garden', h: () => `Dive the lagoon and gather moon kelp (${invCount('moonkelp')}/5) 🌿`, tgt: () => invCount('moonkelp') >= 5 ? { isle: 'lagoon', x: 1400 } : { isle: 'lagoon', x: 1800, dive: true } },
  /*23*/ { t: 'The Surf Shack', h: () => `Help fix the surf shack: driftwood (${invCount('plank')}/3) 🪵`, tgt: () => invCount('plank') >= 3 ? { isle: 'lagoon', x: 2250 } : { isle: 'lagoon', x: 3400 } },
  /*24*/ { t: 'Learn to Fly (on water)', h: 'Windsurf the Lagoon Slalom — bronze or better! 🏄‍♀️', tgt: () => ({ isle: 'lagoon', x: 2550 }) },
  /*25*/ { t: 'The Singing Grotto', h: 'Follow the song deep into the lagoon — echo it back 🎶', tgt: () => ({ isle: 'lagoon', x: 1800, dive: true }) },
  /*26*/ { t: 'Into the Fog', h: 'Sail east to the island hiding in the mist 🌫️', tgt: () => ({ sail: 'mist' }) },
  /*27*/ { t: 'Four Lost Prisms', h: () => `Find the lighthouse's lamp prisms in the fog (${invCount('prism')}/4) 🔷`, tgt: () => invCount('prism') >= 4 ? { isle: 'mist', x: 2800 } : { isle: 'mist', x: 1500 } },
  /*28*/ { t: 'Light the Beacon', h: 'Climb the old lighthouse and relight the lamp 🕯️', tgt: () => ({ isle: 'mist', x: 2800 }) },
  /*29*/ { t: 'The Glimmering Cave', h: 'Glimmer says a treasure sleeps in the sea cave — bring your lantern! 🏮', tgt: () => ({ isle: 'mist', x: 3850 }) },
  /*30*/ { t: 'Tell the Queen', h: 'Sail home and tell Queen Nerissa about the fragments 👑', tgt: () => ({ isle: 'home', x: 700, dive: true }) },
  /*31*/ { t: 'After the Silver Storm', h: () => `Storm cleanup: gather driftwood for the café (${invCount('plank')}/4) 🪵`, tgt: () => invCount('plank') >= 4 ? { isle: 'home', x: POS.melody } : { isle: 'home', x: 1100 } },
  /*32*/ { t: 'The Runaway Wheel', h: 'Purin\'s pudding-cart wheel rolled into the jungle — find it! ☸️', tgt: () => S.flags.gotWheel ? { isle: 'home', x: POS.purinStand } : { isle: 'home', x: 6500 } },
  /*33*/ { t: 'Turtle Power', h: 'The turtles came to help! Pass the balance training to earn your headband 🐢', tgt: () => ({ isle: 'turtle', x: 3800 }) },
  /*34*/ { t: 'Ember Isle', h: 'Sail to the far volcano island 🌋', tgt: () => ({ sail: 'volcano' }) },
  /*35*/ { t: 'Welcome Stew', h: () => `Purin's on vacation here! Gather fire fruit for welcome stew (${invCount('firefruit')}/3) 🌶️`, tgt: () => invCount('firefruit') >= 3 ? { isle: 'volcano', x: 1650 } : { isle: 'volcano', x: 2800 } },
  /*36*/ { t: 'The Silver Singer', h: 'Dive the ember sea — something silver is circling the warm vents 🐋', tgt: () => ({ isle: 'volcano', x: 4200, dive: true }) },
  /*37*/ { t: 'The Whale\'s Secret', h: 'Bring the silver scale to Queen Nerissa 👑', tgt: () => ({ isle: 'home', x: 700, dive: true }) },
  /*38*/ { t: 'The Ember Grotto', h: 'With the mermaid\'s blessing, dive to the bottom of the ember sea 🔥', tgt: () => ({ isle: 'volcano', x: 4200, dive: true }) },
  /*39*/ { t: 'Moon Cake', h: 'Ask My Melody to bake her legendary Moon Cake 🌙', tgt: () => ({ isle: 'home', x: POS.melody }) },
  /*40*/ { t: 'The Drum Team', h: 'Invite the turtle brothers to play the festival drums 🥁', tgt: () => ({ isle: 'turtle', x: 2650 }) },
  /*41*/ { t: 'Snacks for Everyone', h: 'Ask Pusheen to cater the festival (she says yes immediately) 🍪', tgt: () => S.pet.adopted ? { isle: 'home', x: POS.cottage } : { isle: 'snack', x: 2050 } },
  /*42*/ { t: 'The Moon Pearl', h: 'The Deep Descent: dive the ember sea, to the Moon Pearl itself 🌕', tgt: () => ({ isle: 'volcano', x: 4200, dive: true }) },
];
const POSTGAME_HINT = 'Free play forever! Fill the journal, find every charm, win every gold medal 💗';
/* ============================================================
   ART — hand-drawn vector characters, fish, shared helpers
   All characters draw with feet (or tail) at (0,0), facing right.
   ============================================================ */
const INK = '#4A3B33';
function oval(c, x, y, rx, ry, fill, stroke) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2.4; c.stroke(); }
}
function line(c, x1, y1, x2, y2, w, col) {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function dotEye(c, x, y, r = 2.6) {
  c.fillStyle = '#26201C'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x + r * .35, y - r * .35, r * .38, 0, TAU); c.fill();
}
function closedEye(c, x, y, r = 3) {
  c.strokeStyle = '#26201C'; c.lineWidth = 1.8; c.beginPath();
  c.arc(x, y - 1, r, .15 * Math.PI, .85 * Math.PI); c.stroke();
}
function blush(c, x, y) { c.fillStyle = 'rgba(255,130,150,.4)'; c.beginPath(); c.ellipse(x, y, 4.4, 2.8, 0, 0, TAU); c.fill(); }
function smile(c, x, y, r, open = false) {
  c.strokeStyle = '#8C4A3C'; c.lineWidth = 2; c.beginPath();
  if (open) { c.fillStyle = '#B3574A'; c.beginPath(); c.arc(x, y, r, 0, Math.PI); c.fill(); }
  else { c.arc(x, y, r, .12 * Math.PI, .88 * Math.PI); c.stroke(); }
}
function starPath(c, x, y, r, r2) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r2 : r;
    c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  c.closePath();
}
function drawPearl(c, x, y, r, t) {
  glow(c, x, y, r * 3.2, rgba(255, 235, 190), .5 + .2 * Math.sin(t * 3));
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(.55, '#FFE9F2'); g.addColorStop(1, '#E8C9E0');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(210,160,190,.7)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x - r * .3, y - r * .35, r * .22, 0, TAU); c.fill();
}
/* sprite cache for static props */
const sprCache = {};
function spr(key, w, h, fn) {
  let s = sprCache[key];
  if (!s) {
    s = document.createElement('canvas');
    s.width = w * 2; s.height = h * 2;
    const sc = s.getContext('2d');
    sc.scale(2, 2); sc.translate(w / 2, h);   // origin: center-bottom
    fn(sc);
    sprCache[key] = s;
  }
  return s;
}
function blit(c, s, x, y, scale = 1) {
  c.drawImage(s, x - s.width / 4 * scale, y - s.height / 2 * scale, s.width / 2 * scale, s.height / 2 * scale);
}

/* ── LILA ─────────────────────────────────────────────────
   o: {face,walk,t,swim,talk,gear,outfit,blink}                */
function drawLila(c, t, o = {}) {
  const face = o.face || 1;
  c.save(); c.scale(face, 1);
  c.lineJoin = 'round';
  const skin = '#F2C298', hair = '#5E4128';
  const dsel = DRESSES[o.outfit || S.outfit.dress] || DRESSES.red;
  const rainbowD = dsel.a === 'rainbow';
  const dressA = rainbowD ? '#FF8FB1' : dsel.a;
  const dressB = rainbowD ? '#FFD24C' : dsel.b;
  if (o.swim) { drawLilaSwim(c, t, o, skin, hair); c.restore(); return; }
  const w = o.walk || 0, ph = t * 11;
  const bob = Math.abs(Math.sin(ph)) * 3.2 * w;
  const swing = Math.sin(ph) * .55 * w;
  c.translate(0, -bob);
  if (o.ride) {
    // bent legs on the pedals
    line(c, 0, -30, 8, -16, 7, skin);
    line(c, 4, -30, 12, -18, 7, skin);
    oval(c, 10, -14, 5.5, 3.2, '#C9575F', INK);
    oval(c, 14, -16, 5.5, 3.2, '#C9575F', INK);
  } else {
    // legs
    line(c, -1, -30, -1 - Math.sin(ph) * 9 * w, -2, 7, skin);
    line(c, 5, -30, 5 + Math.sin(ph) * 9 * w, -2, 7, skin);
    // shoes
    c.fillStyle = '#B3574A';
    oval(c, -1 - Math.sin(ph) * 9 * w + 1.5, -2, 6, 3.6, '#C9575F', INK);
    oval(c, 5 + Math.sin(ph) * 9 * w + 1.5, -2, 6, 3.6, '#C9575F', INK);
  }
  // dress
  c.beginPath();
  c.moveTo(-13, -30); c.lineTo(15, -30); c.lineTo(10, -56); c.lineTo(-8, -56); c.closePath();
  const dg = c.createLinearGradient(0, -56, 0, -30);
  dg.addColorStop(0, dressA); dg.addColorStop(1, dressB);
  c.fillStyle = dg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  if (rainbowD) {
    const cols = ['#FF8FB1', '#FFC24C', '#7FE08C', '#7FD8E8', '#B9A8FF'];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = cols[i];
      c.beginPath();
      const y0 = -56 + i * 5.2, y1 = y0 + 5.2;
      const xl0 = lerp(-8, -13, (y0 + 56) / 26), xr0 = lerp(10, 15, (y0 + 56) / 26);
      const xl1 = lerp(-8, -13, (y1 + 56) / 26), xr1 = lerp(10, 15, (y1 + 56) / 26);
      c.moveTo(xl0, y0); c.lineTo(xr0, y0); c.lineTo(xr1, y1); c.lineTo(xl1, y1); c.closePath(); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-13, -30); c.lineTo(15, -30); c.lineTo(10, -56); c.lineTo(-8, -56); c.closePath(); c.stroke();
  }
  // sailor collar
  c.fillStyle = '#FFF6E8';
  c.beginPath(); c.moveTo(-8, -56); c.lineTo(10, -56); c.lineTo(6, -49); c.lineTo(-4, -49); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // arms
  const armA = -swing;
  line(c, -6, -52, -6 - Math.sin(armA) * 4 - 5, -38 + Math.cos(armA) * 2, 6, skin);
  line(c, 8, -52, 8 + Math.sin(armA) * 4 + 5, -38 - Math.cos(armA) * 2, 6, skin);
  // head
  const hx = 1, hy = -74;
  oval(c, hx, hy, 19.5, 18.5, skin, INK);
  // hair: cap + braids
  c.fillStyle = hair;
  c.beginPath(); c.arc(hx, hy - 2.5, 19.5, Math.PI * .95, Math.PI * 2.06); c.quadraticCurveTo(hx + 6, hy - 8, hx - 2, hy - 6); c.closePath(); c.fill();
  c.beginPath(); c.arc(hx, hy - 3, 19.8, Math.PI * .9, Math.PI * 2.1); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  // braids (both sides)
  for (const sd of [-1, 1]) {
    const bx = hx + sd * 17.5;
    c.fillStyle = hair;
    for (let i = 0; i < 3; i++) oval(c, bx + sd * i * 1.4, hy + 4 + i * 7.5, 5.4 - i * .8, 5, hair, INK);
    // bow on both braids
    c.fillStyle = '#FFC24C';
    starPath(c, bx + sd * 1.2, hy + 1, 4.6, 2.2); c.fill();
  }
  if (dsel.star) {
    c.fillStyle = '#FFE14C';
    [[-6, -44], [4, -38], [-2, -34], [9, -48]].forEach(([sx2, sy2]) => { starPath(c, sx2, sy2, 2.6, 1.2); c.fill(); });
  }
  // face
  const blink = (Math.sin(t * .9) > .985) || o.blink;
  if (blink) { closedEye(c, hx + 7, hy + 1); closedEye(c, hx - 4, hy + 1); }
  else { dotEye(c, hx + 7, hy + 1, 2.8); dotEye(c, hx - 4, hy + 1, 2.8); }
  blush(c, hx + 12, hy + 6.5); blush(c, hx - 9, hy + 6.5);
  smile(c, hx + 2, hy + 6.5, 3.6, o.talk && Math.sin(t * 14) > 0);
  if (!o.noHat) drawHat(c, hx, hy, o.hat !== undefined ? o.hat : S.outfit.hat);
  c.restore();
}
function drawHat(c, hx, hy, hat) {
  if (!hat) return;
  c.lineJoin = 'round';
  if (hat === 'sunhat') {
    c.fillStyle = '#F2E2B8'; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.ellipse(hx, hy - 15, 26, 7, -.06, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.arc(hx, hy - 16, 13, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    line(c, hx - 13, hy - 17, hx + 13, hy - 17, 3, '#FF8FB1');
  } else if (hat === 'bow') {
    c.fillStyle = '#E23B4E'; c.strokeStyle = INK; c.lineWidth = 2;
    oval(c, hx + 6, hy - 18, 6.5, 5, '#E23B4E', INK); oval(c, hx + 17, hy - 18, 6.5, 5, '#E23B4E', INK);
    oval(c, hx + 11.5, hy - 18, 3, 3.4, '#C22B3E', INK);
  } else if (hat === 'flowers') {
    for (let i = 0; i < 5; i++) {
      const fx = hx - 14 + i * 7, fy = hy - 16 - Math.sin(i * 1.2) * 3;
      c.fillStyle = ['#FF8FB1', '#FFE14C', '#B9A8FF', '#7FD8E8', '#FF8FB1'][i];
      for (let p = 0; p < 5; p++) { const a = p * TAU / 5; oval(c, fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.2, 2.2, c.fillStyle, null); }
      oval(c, fx, fy, 1.8, 1.8, '#FFF', null);
    }
  } else if (hat === 'captain') {
    c.fillStyle = '#FFF6E8'; c.strokeStyle = INK; c.lineWidth = 2;
    rr(c, hx - 14, hy - 22, 28, 9, 4); c.fill(); c.stroke();
    c.fillStyle = '#2B5BB5'; rr(c, hx - 15, hy - 14, 30, 4.5, 2); c.fill(); c.stroke();
    oval(c, hx, hy - 17.5, 3.4, 3.4, '#FFD24C', INK);
  } else if (hat === 'crown') {
    c.fillStyle = '#FFD24C'; c.strokeStyle = INK; c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(hx - 12, hy - 14); c.lineTo(hx - 10, hy - 24); c.lineTo(hx - 5, hy - 16);
    c.lineTo(hx, hy - 26); c.lineTo(hx + 5, hy - 16); c.lineTo(hx + 10, hy - 24); c.lineTo(hx + 12, hy - 14);
    c.closePath(); c.fill(); c.stroke();
    oval(c, hx, hy - 21, 2, 2, '#FF6B81', null);
  } else if (hat.startsWith('hb_')) {
    const col = { hb_blue: '#4FC3F7', hb_red: '#FF6B5C', hb_orange: '#FFB84D', hb_purple: '#B98CE8' }[hat];
    line(c, hx - 17, hy - 8, hx + 17, hy - 8, 5.5, col);
    c.strokeStyle = INK; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(hx - 17, hy - 10.5); c.lineTo(hx + 17, hy - 10.5); c.moveTo(hx - 17, hy - 5.5); c.lineTo(hx + 17, hy - 5.5); c.stroke();
    line(c, hx - 17, hy - 8, hx - 24, hy - 2, 4, col);
    line(c, hx - 17, hy - 8, hx - 23, hy - 12, 4, col);
  }
}
function drawLilaSwim(c, t, o, skin, hair) {
  const kick = Math.sin(t * 9);
  // flowing hair behind (drawn first)
  c.fillStyle = hair;
  c.beginPath();
  c.moveTo(8, -52);
  c.quadraticCurveTo(-10, -58 + Math.sin(t * 2.6) * 3, -24, -52 + Math.sin(t * 2.1) * 4);
  c.quadraticCurveTo(-34, -46 + Math.sin(t * 1.8) * 5, -30, -38 + Math.sin(t * 2.4) * 4);
  c.quadraticCurveTo(-18, -40, -8, -40);
  c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // legs (prone, kicking)
  line(c, -14, -42, -30, -44 - kick * 8, 6.5, skin);
  line(c, -14, -37, -30, -34 + kick * 8, 6.5, skin);
  if (S.gear.flippers) {
    oval(c, -35, -45 - kick * 9, 8, 3.6, '#39C6A5', INK);
    oval(c, -35, -33 + kick * 9, 8, 3.6, '#39C6A5', INK);
  }
  // air tank on back
  if (S.gear.tank1 || S.gear.tank2) {
    rr(c, -12, -56, 16, 9, 4.5);
    c.fillStyle = S.gear.tank2 ? '#FFC24C' : '#9BE8FF'; c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  }
  // swimsuit torso (horizontal capsule)
  rr(c, -18, -48, 28, 16, 8);
  const bg = c.createLinearGradient(0, -48, 0, -32);
  bg.addColorStop(0, '#FF8A54'); bg.addColorStop(1, '#E86A3C');
  c.fillStyle = bg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // arms reaching forward
  line(c, 6, -44, 26, -46 + Math.sin(t * 9 + 1.5) * 2.5, 5.5, skin);
  line(c, 6, -39, 25, -37 - Math.sin(t * 9 + 1.5) * 2.5, 5.5, skin);
  // head (in front)
  const hx = 13, hy = -42;
  oval(c, hx, hy, 16, 15, skin, INK);
  // hair cap over top of head
  c.fillStyle = hair;
  c.beginPath();
  c.arc(hx, hy - 2, 16, Math.PI * .8, Math.PI * 1.98);
  c.quadraticCurveTo(hx + 4, hy - 10, hx - 4, hy - 8);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(hx, hy - 2, 16, Math.PI * .85, Math.PI * 1.95);
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  // goggle strap + goggles
  line(c, hx - 14, hy - 3, hx - 2, hy - 5, 3, '#3E7B8C');
  c.fillStyle = 'rgba(155,232,255,.8)';
  oval(c, hx + 7, hy - 2, 7, 6, 'rgba(155,232,255,.8)', '#3E7B8C');
  dotEye(c, hx + 7, hy - 2, 2.5);
  blush(c, hx + 11, hy + 6);
  smile(c, hx + 5, hy + 7, 3, false);
  if (S.gear.blessing) glow(c, 0, -40, 55, rgba(155, 232, 255), .35 + .12 * Math.sin(t * 4));
}


/* ── SANRIO FRIENDS ──────────────────────────────────────── */
const PAINT = {};
PAINT.melody = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const bob = Math.sin(t * 2.2) * 1.5;
  c.translate(0, -bob * .4);
  // feet
  oval(c, -7, -3, 5.5, 3.5, '#fff', INK); oval(c, 7, -3, 5.5, 3.5, '#fff', INK);
  // dress (pink)
  c.beginPath(); c.moveTo(-14, -5); c.quadraticCurveTo(0, -12, 14, -5);
  c.lineTo(9, -28); c.lineTo(-9, -28); c.closePath();
  c.fillStyle = '#FF9FBE'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // arms
  oval(c, -12, -22, 4.5, 3.5, '#fff', INK); oval(c, 12, -22, 4.5, 3.5, '#fff', INK);
  // head (white) with pink hood
  const hy = -42 + bob * .3;
  oval(c, 0, hy, 17, 15.5, '#FFFDF8', INK);
  // hood outline
  c.strokeStyle = '#F26D99'; c.lineWidth = 5;
  c.beginPath(); c.arc(0, hy, 16.2, Math.PI * .78, Math.PI * 2.22); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.8;
  c.beginPath(); c.arc(0, hy, 18.8, Math.PI * .78, Math.PI * 2.22); c.stroke();
  // hood ears (long, droopy-up)
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 9, hy - 12); c.rotate(sd * .5 + Math.sin(t * 2 + sd) * .04);
    oval(c, 0, -14, 6.2, 16, '#F26D99', INK);
    oval(c, 0, -12, 3, 11, '#FFC9DB', null);
    c.restore();
  }
  // flower on hood
  c.fillStyle = '#FFE14C';
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + t * .2; oval(c, -12 + Math.cos(a) * 3.4, hy - 9 + Math.sin(a) * 3.4, 2.4, 2.4, '#FF6B81', null); }
  oval(c, -12, hy - 9, 2.2, 2.2, '#FFE14C', null);
  // face
  if (o.blink || Math.sin(t * 1.1 + 2) > .98) { closedEye(c, -5, hy + 1); closedEye(c, 6, hy + 1); }
  else { dotEye(c, -5, hy + 1, 2.5); dotEye(c, 6, hy + 1, 2.5); }
  oval(c, .5, hy + 6, 2.2, 1.7, '#FFD24C', null); // yellow nose
  smile(c, .5, hy + 8.5, 2.6, o.talk && Math.sin(t * 14) > 0);
  blush(c, -10, hy + 6); blush(c, 11, hy + 6);
  c.restore();
};
PAINT.purin = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const breathe = Math.sin(t * (o.sleep ? 1.3 : 2.5)) * 1.6;
  // pudding-shaped sitting body
  c.beginPath();
  c.moveTo(-22, 0); c.quadraticCurveTo(-24, -26 - breathe, 0, -28 - breathe);
  c.quadraticCurveTo(24, -26 - breathe, 22, 0); c.closePath();
  c.fillStyle = '#FFD86B'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
  // belly
  oval(c, 0, -8, 12, 9, '#FFF3D0', null);
  // paws
  oval(c, -14, -2, 6, 4, '#FFD86B', INK); oval(c, 14, -2, 6, 4, '#FFD86B', INK);
  // head
  const hy = -40 - breathe;
  oval(c, 0, hy, 19, 16, '#FFD86B', INK);
  // floppy ears
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 15, hy - 8); c.rotate(sd * .9);
    oval(c, 0, -6, 5.5, 9, '#C68A4B', INK);
    c.restore();
  }
  // brown beret
  c.beginPath(); c.ellipse(2, hy - 14.5, 13.5, 5.5, -.08, 0, TAU);
  c.fillStyle = '#8C5A33'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  oval(c, 2, hy - 19.5, 2.4, 2.4, '#8C5A33', INK);
  // face
  if (o.sleep) { closedEye(c, -6, hy + 1); closedEye(c, 7, hy + 1); }
  else if (Math.sin(t * 1.2 + 4) > .98) { closedEye(c, -6, hy + 1); closedEye(c, 7, hy + 1); }
  else { dotEye(c, -6, hy + 1, 2.5); dotEye(c, 7, hy + 1, 2.5); }
  smile(c, .5, hy + 5.5, 3, o.talk && Math.sin(t * 14) > 0);
  blush(c, -12, hy + 5); blush(c, 13, hy + 5);
  if (o.sleep) {
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '700 13px sans-serif';
    const zp = (t % 2) / 2;
    c.globalAlpha = 1 - zp;
    c.fillText('z', 20 + zp * 8, hy - 18 - zp * 14);
    c.fillText('Z', 27 + zp * 10, hy - 26 - zp * 18);
    c.globalAlpha = 1;
  }
  c.restore();
};
PAINT.pochacco = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const hop = o.hop ? Math.abs(Math.sin(t * 6)) * 6 : 0;
  c.translate(0, -hop);
  // legs
  oval(c, -7, -3, 5.5, 4, '#FFFDF8', INK); oval(c, 7, -3, 5.5, 4, '#FFFDF8', INK);
  // body
  rr(c, -13, -30, 26, 26, 11); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // red bandana
  c.beginPath(); c.moveTo(-11, -28); c.quadraticCurveTo(0, -22, 11, -28); c.lineTo(8, -24); c.quadraticCurveTo(0, -19, -8, -24); c.closePath();
  c.fillStyle = '#E23B4E'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // arms
  oval(c, -13, -20, 4.5, 3.5, '#FFFDF8', INK); oval(c, 13, -20, 4.5, 3.5, '#FFFDF8', INK);
  // head (tall oval)
  const hy = -44 + hop * .2;
  oval(c, 0, hy, 16.5, 15, '#FFFDF8', INK);
  // black floppy ears
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 11, hy - 10); c.rotate(sd * (.7 + (o.hop ? Math.sin(t * 6) * .15 : .02 * Math.sin(t * 2))));
    oval(c, 0, 7, 5, 12, '#2B2B33', INK);
    c.restore();
  }
  // face
  if (Math.sin(t * 1.3 + 1) > .98) { closedEye(c, -5.5, hy - 1); closedEye(c, 5.5, hy - 1); }
  else { dotEye(c, -5.5, hy - 1, 2.6); dotEye(c, 5.5, hy - 1, 2.6); }
  oval(c, 0, hy + 4.5, 2.6, 2, '#2B2B33', null);
  smile(c, 0, hy + 7, 2.8, o.talk && Math.sin(t * 14) > 0);
  blush(c, -10.5, hy + 4); blush(c, 10.5, hy + 4);
  c.restore();
};
PAINT.kitty = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const bob = Math.sin(t * 2) * 1.2;
  c.translate(0, -bob * .3);
  // feet
  oval(c, -7, -3, 6, 4, '#FFFDF8', INK); oval(c, 7, -3, 6, 4, '#FFFDF8', INK);
  // blue overall dress + red shirt
  c.beginPath(); c.moveTo(-13, -4); c.lineTo(13, -4); c.lineTo(10, -24); c.lineTo(-10, -24); c.closePath();
  c.fillStyle = '#3E7BFF'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  c.fillStyle = '#E23B4E';
  c.beginPath(); c.moveTo(-10, -24); c.lineTo(10, -24); c.lineTo(9, -29); c.lineTo(-9, -29); c.closePath(); c.fill(); c.stroke();
  // arms
  oval(c, -12, -20, 4.5, 3.5, '#FFFDF8', INK); oval(c, 12, -20, 4.5, 3.5, '#FFFDF8', INK);
  // head — wide oval
  const hy = -42 + bob * .3;
  oval(c, 0, hy, 20, 15.5, '#FFFDF8', INK);
  // pointy ears
  for (const sd of [-1, 1]) {
    c.beginPath();
    c.moveTo(sd * 8, hy - 12.5); c.lineTo(sd * 15, hy - 22); c.lineTo(sd * 16.5, hy - 9);
    c.closePath(); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  }
  // red bow (on her left = screen right when facing right)
  c.save(); c.translate(11 * f > 0 ? 11 : 11, hy - 13);
  c.fillStyle = '#E23B4E'; c.strokeStyle = INK; c.lineWidth = 1.8;
  oval(c, -5, 0, 5, 4.2, '#E23B4E', INK); oval(c, 5, 0, 5, 4.2, '#E23B4E', INK);
  oval(c, 0, 0, 2.8, 3, '#C22B3E', INK);
  c.restore();
  // face — kitty has no mouth
  dotEye(c, -6.5, hy + 1, 2.4); dotEye(c, 6.5, hy + 1, 2.4);
  oval(c, 0, hy + 5, 2.4, 1.9, '#FFD24C', INK);
  // whiskers
  c.strokeStyle = INK; c.lineWidth = 1.4;
  for (const sd of [-1, 1]) for (let i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(sd * 14, hy + 2 + i * 3.4);
    c.lineTo(sd * 22, hy + 1 + i * 4.6); c.stroke();
  }
  c.restore();
};
PAINT.sammy = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const bounce = Math.abs(Math.sin(t * 5)) * (o.hop ? 4 : 1);
  c.translate(0, -bounce);
  // big curly tail
  c.strokeStyle = '#8B5E3C'; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-10, -8);
  c.quadraticCurveTo(-24, -14, -22, -28 + Math.sin(t * 3) * 2);
  c.quadraticCurveTo(-20, -38, -10, -34); c.stroke();
  c.strokeStyle = '#D4A464'; c.lineWidth = 4.5;
  c.beginPath(); c.moveTo(-11, -10); c.quadraticCurveTo(-21, -15, -19.5, -27 + Math.sin(t * 3) * 2); c.stroke();
  // body
  oval(c, 0, -10, 9.5, 10, '#8B5E3C', INK);
  oval(c, 1, -8, 5.5, 6.5, '#E8C9A0', null);
  // head
  oval(c, 4, -24, 9, 8.5, '#8B5E3C', INK);
  // ears
  oval(c, -1, -31, 3, 4, '#8B5E3C', INK); oval(c, 9, -31, 3, 4, '#8B5E3C', INK);
  dotEye(c, 7, -25, 2); blush(c, 10, -21);
  oval(c, 12, -23, 1.6, 1.3, '#4A3B33', null);
  c.restore();
};
PAINT.pigeon = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const fly = o.fly ? Math.sin(t * 16) : 0;
  // body
  oval(c, 0, -10, 11, 9, '#B8B8D0', INK);
  // wing
  c.save(); c.translate(-3, -13); c.rotate(o.fly ? fly * .8 : Math.sin(t * 1.5) * .05);
  oval(c, -4, 0, 8.5, 5, '#9E9EBC', INK);
  c.restore();
  // head
  oval(c, 8, -19, 5.5, 5, '#B8B8D0', INK);
  dotEye(c, 9.5, -20, 1.6);
  // beak
  c.fillStyle = '#FFB84D'; c.beginPath();
  c.moveTo(13, -19.5); c.lineTo(17.5, -18.5); c.lineTo(13, -17); c.closePath(); c.fill();
  // iridescent neck
  oval(c, 6, -15, 3, 3.4, 'rgba(123,104,238,.5)', null);
  if (!o.fly) { line(c, -2, -2, -2, 0, 2, '#FFB84D'); line(c, 3, -2, 3, 0, 2, '#FFB84D'); }
  c.restore();
};
/* mermaids: cfg {hair, tail, skin, crown} — floats, tail sways */
function drawMermaid(c, t, cfg, o = {}) {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const sway = Math.sin(t * 1.8 + (cfg.ph || 0));
  c.translate(0, Math.sin(t * 1.4 + (cfg.ph || 0)) * 3);
  // tail (curves behind, fin flick)
  c.beginPath();
  c.moveTo(-2, -26);
  c.quadraticCurveTo(-16, -16, -20, -2 + sway * 3);
  c.quadraticCurveTo(-22, 6 + sway * 4, -32, 10 + sway * 6);
  c.quadraticCurveTo(-20, 12 + sway * 5, -14, 6 + sway * 3);
  c.quadraticCurveTo(-4, -6, 8, -20);
  c.closePath();
  const tg = c.createLinearGradient(0, -26, -30, 12);
  tg.addColorStop(0, cfg.tail); tg.addColorStop(1, cfg.tail2 || cfg.tail);
  c.fillStyle = tg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.3; c.stroke();
  // fin
  c.beginPath();
  c.moveTo(-30, 10 + sway * 6);
  c.quadraticCurveTo(-42, 2 + sway * 8, -44, -6 + sway * 9);
  c.quadraticCurveTo(-38, 4 + sway * 7, -34, 4 + sway * 6);
  c.quadraticCurveTo(-40, 12 + sway * 7, -44, 22 + sway * 5);
  c.quadraticCurveTo(-36, 16 + sway * 6, -30, 10 + sway * 6);
  c.fillStyle = cfg.tail2 || cfg.tail; c.fill(); c.stroke();
  // scale sparkles
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    c.beginPath(); c.arc(-8 - i * 4.5, -14 + i * 5 + sway * i, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  }
  // torso
  line(c, 0, -27, 5, -42, 10, cfg.skin);
  // shell top
  oval(c, 2, -41, 7.5, 5, cfg.shell || '#FFE14C', INK);
  line(c, -1, -44, 6, -44, 1.6, INK);
  // arms
  line(c, 1, -42, -8 + Math.sin(t * 2) * 2, -32, 4.5, cfg.skin);
  line(c, 6, -42, 15, -34 + Math.sin(t * 2.3) * 3, 4.5, cfg.skin);
  // head
  const hy = -56;
  oval(c, 7, hy, 13.5, 12.5, cfg.skin, INK);
  // flowing hair
  c.fillStyle = cfg.hair;
  c.beginPath();
  c.moveTo(13, hy - 12);
  c.quadraticCurveTo(-6, hy - 16, -10, hy - 4 + Math.sin(t * 2.2) * 2);
  c.quadraticCurveTo(-16, hy + 12 + Math.sin(t * 1.7) * 4, -8, hy + 26 + Math.sin(t * 2) * 4);
  c.quadraticCurveTo(-2, hy + 18, -2, hy + 8);
  c.quadraticCurveTo(-4, hy + 2, 2, hy - 5);
  c.quadraticCurveTo(8, hy - 10, 13, hy - 12);
  c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.arc(7, hy - 1.5, 13.5, Math.PI * .95, Math.PI * 1.85); c.stroke();
  // crown
  if (cfg.crown) {
    c.fillStyle = '#FFD24C'; c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, hy - 11); c.lineTo(2, hy - 18); c.lineTo(5.5, hy - 12.5);
    c.lineTo(8.5, hy - 19); c.lineTo(12, hy - 12.5); c.lineTo(14.5, hy - 17); c.lineTo(15.5, hy - 10.5);
    c.closePath(); c.fill(); c.stroke();
    oval(c, 8, hy - 15, 1.8, 1.8, '#FF6B81', null);
  }
  // face
  if (o.blink || Math.sin(t * 1.15 + (cfg.ph || 0)) > .98) { closedEye(c, 4, hy + 1); closedEye(c, 12, hy + 1); }
  else { dotEye(c, 4, hy + 1, 2.2); dotEye(c, 12, hy + 1, 2.2); }
  blush(c, 1, hy + 6); blush(c, 15, hy + 6);
  smile(c, 8, hy + 5.5, 2.6, o.talk && Math.sin(t * 14) > 0);
  c.restore();
}
PAINT.coral = (c, t, o) => drawMermaid(c, t, { hair: '#FF7AB6', tail: '#FF9FD0', tail2: '#FFC9DB', skin: '#F2C298', shell: '#FFE14C', ph: 0 }, o);
PAINT.marina = (c, t, o) => drawMermaid(c, t, { hair: '#4FC3F7', tail: '#3E7BFF', tail2: '#7FD8E8', skin: '#E8B48C', shell: '#FF9FD0', ph: 2 }, o);
PAINT.queen = (c, t, o) => { c.save(); c.scale(1.25, 1.25); drawMermaid(c, t, { hair: '#C77DFF', tail: '#8E4FD0', tail2: '#B9A8FF', skin: '#F2C298', shell: '#9BE8FF', crown: true, ph: 4 }, o); c.restore(); };
PAINT.inky = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  const b = Math.sin(t * 2.2) * 2;
  c.translate(0, -14 + b);
  // tentacles
  c.strokeStyle = '#7E5BB5'; c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const bx = -20 + i * 8;
    c.lineWidth = 7;
    c.beginPath(); c.moveTo(bx * .6, -6);
    c.quadraticCurveTo(bx, 6 + Math.sin(t * 3 + i * 1.3) * 3, bx * 1.15, 12 + Math.sin(t * 2.4 + i) * 3);
    c.stroke();
  }
  // dome
  c.beginPath();
  c.moveTo(-22, -4);
  c.quadraticCurveTo(-24, -34, 0, -36);
  c.quadraticCurveTo(24, -34, 22, -4);
  c.quadraticCurveTo(12, -10, 0, -8);
  c.quadraticCurveTo(-12, -10, -22, -4);
  c.closePath();
  const dg = c.createLinearGradient(0, -36, 0, 0);
  dg.addColorStop(0, '#9B79CC'); dg.addColorStop(1, '#7E5BB5');
  c.fillStyle = dg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // beret (maestro!)
  c.beginPath(); c.ellipse(-6, -35, 12, 4.8, -.15, 0, TAU);
  c.fillStyle = '#2B2B44'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
  oval(c, -7, -39.5, 2, 2, '#2B2B44', INK);
  // face
  if (o.grumpy) {
    line(c, -12, -26, -4, -23, 2, '#26201C'); line(c, 12, -26, 4, -23, 2, '#26201C');
    dotEye(c, -7, -19, 3); dotEye(c, 7, -19, 3);
    c.strokeStyle = '#4A2B3C'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -8, 3.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    dotEye(c, -7, -20, 3); dotEye(c, 7, -20, 3);
    smile(c, 0, -12, 3.2, o.talk && Math.sin(t * 14) > 0);
    blush(c, -14, -15); blush(c, 14, -15);
  }
  // baton
  if (o.baton) {
    c.save(); c.translate(24, -8); c.rotate(Math.sin(t * (o.conduct ? 8 : 2)) * .5 - .4);
    line(c, 0, 0, 14, -12, 2.4, '#FFF6E8'); oval(c, 15, -13, 2, 2, '#FFE14C', null);
    c.restore();
  }
  c.restore();
};

/* ── FISH painter ────────────────────────────────────────── */
function drawFishSprite(c, F, t, o = {}) {
  // draws centered at 0,0 facing right; sz = half length
  const s = F.sz, ph = (o.ph || 0);
  const wag = Math.sin(t * 7 + ph) * .35;
  c.save();
  if (F.glowy || F.band === 2 || F.id === 'lantern' || F.id === 'squid') glow(c, 0, 0, s * 2.6, rgba(155, 232, 255), .16);
  c.lineJoin = 'round';
  const body = (rx, ry) => { oval(c, 0, 0, rx, ry, F.c1, INK); };
  const tail = (x0, szT) => {
    c.save(); c.translate(x0, 0); c.rotate(wag);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-szT, -szT * .62); c.lineTo(-szT * .7, 0); c.lineTo(-szT, szT * .62); c.closePath();
    c.fillStyle = F.c2; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.restore();
  };
  switch (F.shape) {
    case 'tall':
      tail(-s * .8, s * .55); oval(c, 0, 0, s * .8, s * .95, F.c1, INK);
      c.fillStyle = F.c2; c.beginPath(); c.ellipse(-s * .15, 0, s * .18, s * .9, 0, 0, TAU); c.fill();
      dotEye(c, s * .42, -s * .25, s * .11); break;
    case 'seahorse': {
      c.strokeStyle = F.c1; c.lineWidth = s * .42; c.lineCap = 'round';
      c.beginPath(); c.moveTo(s * .1, -s * .7);
      c.quadraticCurveTo(s * .55, -s * .1, s * .1, s * .35);
      c.quadraticCurveTo(-s * .3, s * .8, s * .15, s * .95);
      c.stroke();
      oval(c, 0, -s * .8, s * .34, s * .3, F.c1, INK);
      line(c, s * .25, -s * .85, s * .62, -s * .8, s * .16, F.c1);
      dotEye(c, s * .08, -s * .85, s * .09);
      c.strokeStyle = F.c2; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(s * .18, -s * .35 + i * s * .3, s * .16, -1, 1); c.stroke(); }
      break;
    }
    case 'eel': {
      c.strokeStyle = F.c1; c.lineWidth = s * .28; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = s * .9 - i * s * .18, y = Math.sin(t * 5 + i * .8 + ph) * s * .18;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      c.strokeStyle = F.c2; c.lineWidth = s * .1;
      c.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = s * .9 - i * s * .18, y = Math.sin(t * 5 + i * .8 + ph) * s * .18 - s * .1;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      oval(c, s * .9, 0, s * .2, s * .16, F.c1, INK);
      dotEye(c, s * .98, -s * .04, s * .06); break;
    }
    case 'squid': {
      c.save(); c.rotate(-.2 + Math.sin(t * 2 + ph) * .1);
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = F.c2; c.lineWidth = s * .14; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-s * .2, s * .1);
        c.quadraticCurveTo(-s * .5, s * .3 + Math.sin(t * 4 + i) * s * .12, -s * .9, s * .15 + Math.sin(t * 3 + i * 1.7) * s * .2);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(-s * .25, -s * .35); c.quadraticCurveTo(s * .1, -s * .75, s * .55, -s * .1);
      c.quadraticCurveTo(s * .75, s * .15, s * .3, s * .3); c.quadraticCurveTo(-s * .1, s * .42, -s * .25, -s * .35);
      c.closePath(); c.fillStyle = F.c1; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      dotEye(c, s * .05, 0, s * .12);
      if (F.id === 'dumbo') { oval(c, s * .25, -s * .55, s * .22, s * .3, F.c2, INK); oval(c, -s * .1, -s * .62, s * .22, s * .3, F.c2, INK); }
      c.restore(); break;
    }
    case 'crab': {
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
        line(c, sd * s * .3, s * .1, sd * s * (.6 + i * .12), s * (.35 + Math.sin(t * 6 + i + (sd + 1)) * .06), s * .08, F.c2);
      }
      oval(c, 0, 0, s * .7, s * .45, F.c1, INK);
      for (const sd of [-1, 1]) {
        oval(c, sd * s * .75, -s * .3, s * .2, s * .16, F.c2, INK);
      }
      dotEye(c, -s * .18, -s * .15, s * .09); dotEye(c, s * .18, -s * .15, s * .09);
      smile(c, 0, s * .05, s * .12); break;
    }
    case 'ray': {
      const flap = Math.sin(t * 3 + ph) * .35;
      c.beginPath();
      c.moveTo(s * .8, 0);
      c.quadraticCurveTo(0, -s * (.55 + flap * .3), -s * .5, -s * .1);
      c.quadraticCurveTo(-s * .9, 0, -s * .5, s * .1);
      c.quadraticCurveTo(0, s * (.55 + flap * .3), s * .8, 0);
      c.closePath(); c.fillStyle = F.c1; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      line(c, -s * .5, 0, -s * .95, Math.sin(t * 4) * s * .1, s * .05, F.c1);
      c.fillStyle = F.c2;
      for (let i = 0; i < 7; i++) { const a = n1(i * 3.7); c.beginPath(); c.arc((a - .3) * s, (n1(i * 9.1) - .5) * s * .5, s * .05, 0, TAU); c.fill(); }
      dotEye(c, s * .5, -s * .08, s * .08); break;
    }
    case 'angler': {
      // lure
      c.strokeStyle = F.c1; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s * .3, -s * .5); c.quadraticCurveTo(s * .8, -s * 1.1, s * 1.05, -s * .7); c.stroke();
      glow(c, s * 1.05, -s * .7, s * .8, rgba(155, 232, 255), .5 + .2 * Math.sin(t * 4));
      oval(c, s * 1.05, -s * .7, s * .12, s * .12, '#D8F8FF', null);
      tail(-s * .75, s * .5);
      oval(c, 0, 0, s * .85, s * .62, F.c1, INK);
      dotEye(c, s * .35, -s * .12, s * .14);
      c.strokeStyle = '#D8F8FF'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(s * .1, s * .18, s * .4, .15, Math.PI * .85); c.stroke(); break;
    }
    case 'whale': {
      c.beginPath();
      c.moveTo(s * .9, -s * .05);
      c.quadraticCurveTo(s * .5, -s * .42, -s * .3, -s * .38);
      c.quadraticCurveTo(-s * .85, -s * .3, -s * .8, 0);
      c.quadraticCurveTo(-s * .75, s * .22, -s * .3, s * .3);
      c.quadraticCurveTo(s * .4, s * .38, s * .9, s * .12);
      c.quadraticCurveTo(s * 1, s * .02, s * .9, -s * .05);
      c.closePath();
      const wg = c.createLinearGradient(0, -s * .4, 0, s * .4);
      wg.addColorStop(0, F.c1); wg.addColorStop(1, F.c2);
      c.fillStyle = wg; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      // tail
      c.save(); c.translate(-s * .8, 0); c.rotate(Math.sin(t * 1.6) * .18);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(-s * .25, -s * .3, -s * .45, -s * .35);
      c.quadraticCurveTo(-s * .25, -s * .05, -s * .2, 0);
      c.quadraticCurveTo(-s * .25, s * .05, -s * .45, s * .35);
      c.quadraticCurveTo(-s * .25, s * .3, 0, 0);
      c.fillStyle = F.c1; c.fill(); c.stroke(); c.restore();
      // fin + eye + glow spots
      oval(c, s * .05, s * .15, s * .16, s * .08, F.c1, INK);
      dotEye(c, s * .62, -s * .08, s * .05);
      for (let i = 0; i < 8; i++) {
        glow(c, (n1(i * 7.3) - .5) * s * 1.2, (n1(i * 3.1) - .55) * s * .5, s * .1, rgba(200, 240, 255), .5 + .3 * Math.sin(t * 2 + i));
      }
      smile(c, s * .68, s * .05, s * .08); break;
    }
    default: { // oval
      tail(-s * .8, s * .5);
      body(s * .85, s * .55);
      if (F.id === 'clown') {
        c.fillStyle = F.c2;
        for (const bx of [-s * .25, s * .3]) {
          c.beginPath(); c.ellipse(bx, 0, s * .12, s * .52, 0, 0, TAU); c.fill();
          c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
        }
      } else if (F.id === 'parrot') {
        c.fillStyle = '#FFE14C'; c.beginPath(); c.ellipse(-s * .2, -s * .1, s * .3, s * .3, .4, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,122,182,.6)'; c.beginPath(); c.ellipse(s * .2, s * .1, s * .3, s * .25, -.3, 0, TAU); c.fill();
      } else {
        c.fillStyle = F.c2; c.beginPath(); c.ellipse(-s * .15, -s * .05, s * .3, s * .32, .3, 0, TAU); c.fill();
      }
      // side fin
      c.save(); c.translate(-s * .05, s * .1); c.rotate(Math.sin(t * 8 + ph) * .3 + .3);
      oval(c, 0, 0, s * .22, s * .12, F.c2, null); c.restore();
      dotEye(c, s * .48, -s * .15, Math.max(2, s * .11));
      if (F.id === 'lantern') glow(c, s * .1, s * .05, s * 1.4, rgba(87, 224, 232), .3 + .15 * Math.sin(t * 5 + ph));
      smile(c, s * .6, s * .1, s * .1);
    }
  }
  c.restore();
}

/* jellyfish (hazard) */
function drawJelly(c, t, sz, hue) {
  const pul = 1 + Math.sin(t * 3) * .12;
  glow(c, 0, 0, sz * 2.4, rgba(255, 160, 220), .18);
  c.save(); c.scale(pul, 2 - pul);
  c.beginPath(); c.arc(0, 0, sz, Math.PI, 0);
  c.quadraticCurveTo(sz, sz * .35, sz * .8, sz * .4);
  for (let i = 3; i >= -3; i--) c.quadraticCurveTo(sz * i / 3.5, sz * .55, sz * (i - .5) / 3.5 * .9, sz * .38);
  c.closePath();
  c.fillStyle = `hsla(${hue},85%,78%,.75)`; c.fill();
  c.strokeStyle = `hsla(${hue},60%,60%,.9)`; c.lineWidth = 2; c.stroke();
  c.restore();
  c.strokeStyle = `hsla(${hue},80%,72%,.6)`; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(i * sz * .3, sz * .4);
    c.quadraticCurveTo(i * sz * .3 + Math.sin(t * 2.5 + i) * 5, sz * 1.1, i * sz * .25 + Math.sin(t * 2 + i * 2) * 8, sz * 1.7);
    c.stroke();
  }
  dotEye(c, -sz * .25, -sz * .2, 2.2); dotEye(c, sz * .25, -sz * .2, 2.2);
  smile(c, 0, -sz * .05, sz * .14);
}

/* ── portraits (dialog box) ──────────────────────────────── */
function drawPortrait(who) {
  const pc = $('dlgPortrait').getContext('2d');
  pc.setTransform(1, 0, 0, 1, 0, 0);
  pc.clearRect(0, 0, 168, 168);
  pc.save();
  pc.scale(2, 2); // canvas is 168 for crispness, draw at 84 logical
  const bgCol = (NPCS[who] || {}).col || '#FFD9A0';
  const g = pc.createRadialGradient(42, 30, 4, 42, 42, 44);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, bgCol);
  pc.fillStyle = g; pc.beginPath(); pc.arc(42, 42, 41, 0, TAU); pc.fill();
  pc.beginPath(); pc.arc(42, 42, 41, 0, TAU); pc.clip();
  pc.translate(42, 84);
  const t = G.t;
  if (who === 'lila') { pc.translate(0, 24); pc.scale(1.15, 1.15); drawLila(pc, t, { face: 1, talk: true, outfit: S.outfit }); }
  else if (who === 'coral' || who === 'marina' || who === 'queen') { pc.translate(-7, 26); pc.scale(1.15, 1.15); PAINT[who](pc, t, { talk: true }); }
  else if (who === 'inky') { pc.translate(0, 6); pc.scale(1.35, 1.35); PAINT.inky(pc, t, { talk: true, baton: true }); }
  else if (who === 'sammy') { pc.translate(-4, 4); pc.scale(2, 2); PAINT.sammy(pc, t, {}); }
  else if (who === 'pusheen') { pc.translate(-16, 2); pc.scale(1.5, 1.5); PAINT.pusheen(pc, t, { talk: true }); }
  else if (who === 'glimmer') { pc.translate(0, 44); pc.scale(1.5, 1.5); PAINT.glimmer(pc, t, {}); }
  else if (who === 'pigeon') { pc.translate(-6, 8); pc.scale(2.4, 2.4); PAINT.pigeon(pc, t, {}); }
  else if (PAINT[who]) { pc.translate(0, 8); pc.scale(1.35, 1.35); PAINT[who](pc, t, { talk: true }); }
  pc.restore();
}


/* ── PUSHEEN ─────────────────────────────────────────────── */
PAINT.pusheen = (c, t, o = {}) => {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  c.lineJoin = 'round';
  const bob = o.sleep ? 0 : Math.sin(t * 2.4) * 1.4;
  const squish = o.sleep ? .82 : 1;
  c.translate(0, -bob * .3);
  // thick striped tail
  c.save(); c.rotate(o.sleep ? .3 : Math.sin(t * 1.6) * .12);
  c.strokeStyle = '#9EA3B0'; c.lineWidth = 11; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-20, -10);
  c.quadraticCurveTo(-34, -8, -38, -20 + Math.sin(t * 2) * 3); c.stroke();
  c.strokeStyle = '#7E8492'; c.lineWidth = 11;
  c.setLineDash([5, 6]); c.beginPath(); c.moveTo(-22, -10);
  c.quadraticCurveTo(-34, -8, -38, -20 + Math.sin(t * 2) * 3); c.stroke();
  c.setLineDash([]);
  c.restore();
  // loaf body
  rr(c, -26, -30 * squish, 52, 30 * squish, 15);
  c.fillStyle = '#B8BCC9'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // back stripes
  c.strokeStyle = '#8E93A2'; c.lineWidth = 3.4;
  for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(-8 + i * 8, -30 * squish + 1.5);
    c.quadraticCurveTo(-6 + i * 8, -24 * squish, -8 + i * 8, -19 * squish); c.stroke();
  }
  // ears
  for (const sd of [-1, 1]) {
    c.beginPath();
    c.moveTo(sd * 20, -28 * squish); c.lineTo(sd * 25, -38 * squish); c.lineTo(sd * 12, -32 * squish);
    c.closePath(); c.fillStyle = '#B8BCC9'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  }
  // feet bumps
  if (!o.sleep) {
    oval(c, -16, -2, 6, 3.4, '#B8BCC9', INK); oval(c, 16, -2, 6, 3.4, '#B8BCC9', INK);
  }
  // face
  const ey = -18 * squish;
  if (o.sleep) { closedEye(c, 6, ey); closedEye(c, 22, ey); }
  else { dotEye(c, 6, ey, 2.4); dotEye(c, 22, ey, 2.4); }
  // :3 mouth
  c.strokeStyle = '#26201C'; c.lineWidth = 1.8;
  c.beginPath(); c.arc(12, ey + 5, 2.6, .1, Math.PI - .1);
  c.arc(17.4, ey + 5, 2.6, .1, Math.PI - .1); c.stroke();
  // whiskers
  c.strokeStyle = 'rgba(60,60,70,.7)'; c.lineWidth = 1.3;
  for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) {
    const bx2 = sd > 0 ? 26 : 1;
    c.beginPath(); c.moveTo(bx2, ey + 1 + i * 4); c.lineTo(bx2 + sd * 9, ey + i * 5); c.stroke();
  }
  blush(c, 2, ey + 6); blush(c, 25, ey + 6);
  if (o.sleep) {
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 11px sans-serif';
    const zp = (t % 2) / 2;
    c.globalAlpha = 1 - zp;
    c.fillText('z', 26 + zp * 6, -34 - zp * 10);
    c.globalAlpha = 1;
  }
  if (o.dig) {
    // sand flying
    for (let i = 0; i < 5; i++) {
      const dp2 = ((t * 2 + i * .37) % 1);
      c.fillStyle = `rgba(242,220,168,${1 - dp2})`;
      c.beginPath(); c.arc(30 + dp2 * 22, -8 - Math.sin(dp2 * Math.PI) * 22, 3, 0, TAU); c.fill();
    }
  }
  c.restore();
};

/* ── TURTLE BROTHERS ─────────────────────────────────────── */
function drawTurtle(c, t, band, o = {}) {
  const f = o.face || 1; c.save(); c.scale(f, 1);
  c.lineJoin = 'round';
  const bounce = o.hop ? Math.abs(Math.sin(t * 6)) * 5 : Math.sin(t * 2.2 + band.length) * 1.2;
  c.translate(0, -bounce * .4);
  // shell behind
  c.beginPath(); c.arc(-6, -26, 20, 0, TAU);
  c.fillStyle = '#8C6A4B'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = '#6E5238'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-6, -44); c.lineTo(-6, -8);
  c.moveTo(-24, -30); c.lineTo(10, -30); c.moveTo(-22, -19); c.lineTo(9, -19); c.stroke();
  // legs
  oval(c, -8, -3, 6, 4.5, '#5CBE6E', INK); oval(c, 8, -3, 6, 4.5, '#5CBE6E', INK);
  // body
  rr(c, -12, -30, 26, 26, 11); c.fillStyle = '#5CBE6E'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  // belly plate
  rr(c, -7, -26, 16, 20, 8); c.fillStyle = '#EFE3B4'; c.fill(); c.strokeStyle = '#C9B888'; c.lineWidth = 1.6; c.stroke();
  // arms
  oval(c, -13, -20, 4.5, 3.8, '#5CBE6E', INK); oval(c, 15, -20, 4.5, 3.8, '#5CBE6E', INK);
  // head
  const hy = -44;
  oval(c, 2, hy, 15, 13.5, '#5CBE6E', INK);
  // bandana across the eyes
  c.fillStyle = band; c.strokeStyle = INK; c.lineWidth = 1.8;
  rr(c, -12, hy - 5, 28, 9, 4.5); c.fill(); c.stroke();
  // bandana tails
  c.save(); c.translate(-12, hy - 1);
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(-10, 2 + Math.sin(t * 3) * 2, -15, 8 + Math.sin(t * 2.4) * 3);
  c.lineTo(-11, 9 + Math.sin(t * 2.4) * 3); c.quadraticCurveTo(-8, 4, 0, 3.5); c.closePath();
  c.fillStyle = band; c.fill(); c.stroke();
  c.restore();
  // eyes on the bandana
  dotEye(c, -3.5, hy - .5, 2.6); dotEye(c, 8, hy - .5, 2.6);
  smile(c, 2.5, hy + 6, 3, o.talk && Math.sin(t * 14) > 0);
  c.restore();
}
PAINT.leo = (c, t, o) => drawTurtle(c, t, '#4FC3F7', o);
PAINT.raph = (c, t, o) => drawTurtle(c, t, '#FF6B5C', o);
PAINT.mikey = (c, t, o) => drawTurtle(c, t, '#FFB84D', o);
PAINT.donnie = (c, t, o) => drawTurtle(c, t, '#B98CE8', o);

/* ── GLIMMER (light spirit) ─────────────────────────────── */
PAINT.glimmer = (c, t, o = {}) => {
  c.save();
  c.translate(0, -46 + Math.sin(t * 1.8) * 6);
  glow(c, 0, 0, 60, rgba(216, 244, 255), .5 + .15 * Math.sin(t * 3));
  glow(c, 0, 0, 26, rgba(255, 255, 255), .6);
  c.fillStyle = 'rgba(240,252,255,.95)';
  starPath(c, 0, 0, 13 + Math.sin(t * 4) * 1.5, 6.5);
  c.fill();
  c.strokeStyle = 'rgba(160,220,255,.8)'; c.lineWidth = 1.6; c.stroke();
  dotEye(c, -3.5, -1, 1.7); dotEye(c, 3.5, -1, 1.7);
  smile(c, 0, 2.5, 2);
  // trailing sparkles
  for (let i = 0; i < 4; i++) {
    const tp = ((t * .8 + i * .25) % 1);
    c.globalAlpha = 1 - tp;
    c.fillStyle = '#D8F4FF';
    starPath(c, -8 - tp * 22, 8 + tp * 20 + Math.sin(t * 3 + i) * 4, 3.4 * (1 - tp), 1.6);
    c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
};

/* ── VEHICLES ────────────────────────────────────────────── */
function drawBike(c, t, speed, air) {
  // fat-tire beach bike; Lila drawn separately on top with o.ride
  c.save();
  const wheelSpin = t * clamp(Math.abs(speed) * .05, 0, 14);
  const wheel = (wx) => {
    c.fillStyle = '#3B3B44'; c.beginPath(); c.arc(wx, -12, 13, 0, TAU); c.fill();
    c.strokeStyle = '#2A2A32'; c.lineWidth = 5; c.stroke();
    c.fillStyle = '#F2DCA8';
    for (let i = 0; i < 6; i++) {
      const a = wheelSpin + i * TAU / 6;
      c.beginPath(); c.arc(wx + Math.cos(a) * 12.5, -12 + Math.sin(a) * 12.5, 1.8, 0, TAU); c.fill();
    }
    c.fillStyle = '#FFE9C9'; c.beginPath(); c.arc(wx, -12, 4.5, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  };
  wheel(-17); wheel(19);
  c.strokeStyle = '#FF8FB1'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-17, -12); c.lineTo(-2, -30); c.lineTo(12, -30); c.lineTo(19, -12);
  c.moveTo(-2, -30); c.lineTo(2, -14); c.lineTo(19, -12);
  c.moveTo(12, -30); c.lineTo(16, -38);
  c.stroke();
  // handlebar + saddle
  line(c, 16, -38, 22, -40, 3.4, '#5B4636');
  line(c, -6, -32, -1, -33, 4.5, '#5B4636');
  // basket with flowers
  rr(c, 20, -36, 12, 9, 3);
  c.fillStyle = '#E8C98C'; c.fill(); c.strokeStyle = '#A8894C'; c.lineWidth = 1.6; c.stroke();
  oval(c, 24, -37, 2.6, 2.6, '#FF8FB1', null); oval(c, 28, -38, 2.4, 2.4, '#FFE14C', null);
  if (air) { // little speed stars when airborne
    for (let i = 0; i < 3; i++) {
      c.fillStyle = 'rgba(255,255,220,.8)';
      starPath(c, -26 - i * 9, -18 + Math.sin(t * 10 + i * 2) * 6, 3.4, 1.6); c.fill();
    }
  }
  c.restore();
}
function drawSurf(c, t, speed) {
  c.save();
  const bob2 = Math.sin(t * 5) * 1.5;
  c.translate(0, bob2);
  // board
  c.beginPath(); c.ellipse(0, -3, 34, 6.5, 0, 0, TAU);
  const bgr = c.createLinearGradient(-30, 0, 30, 0);
  bgr.addColorStop(0, '#FFC24C'); bgr.addColorStop(1, '#FF8FB1');
  c.fillStyle = bgr; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  line(c, -20, -3, 20, -3, 1.6, 'rgba(255,255,255,.7)');
  // mast + sail
  line(c, 2, -4, 6, -78, 3.5, '#8C6A4B');
  c.beginPath();
  c.moveTo(7, -76);
  c.quadraticCurveTo(44 + clamp(speed * .02, -4, 8), -56, 34, -14);
  c.lineTo(7, -12); c.closePath();
  const sg = c.createLinearGradient(8, -70, 40, -16);
  sg.addColorStop(0, 'rgba(255,246,232,.95)'); sg.addColorStop(1, 'rgba(127,216,232,.9)');
  c.fillStyle = sg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  line(c, 8, -46, 34, -38, 2.6, '#8C6A4B'); // boom
  c.restore();
}
function drawSailboat(c, t, o = {}) {
  // side-view sailboat for the sea lane; origin at waterline center
  c.save();
  c.rotate(Math.sin(t * 1.3) * .04);
  // hull
  c.beginPath(); c.moveTo(-56, -18); c.lineTo(56, -18); c.quadraticCurveTo(46, 8, 20, 12);
  c.lineTo(-38, 12); c.quadraticCurveTo(-54, 4, -56, -18); c.closePath();
  c.fillStyle = '#E23B4E'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
  line(c, -50, -18, 50, -18, 4, '#FFF6E8');
  // mast
  line(c, 0, -18, 0, -104, 4.5, '#8C6A4B');
  // sails
  const rainbow = S.vehicles && S.gear && S.flags && S.flags.sail2;
  if (rainbow) {
    const cols = ['#FF6B81', '#FFB84D', '#FFE14C', '#7FE08C', '#7FD8E8', '#B9A8FF'];
    for (let i = 0; i < 6; i++) {
      c.fillStyle = cols[i];
      c.beginPath(); c.moveTo(3, -101 + i * 9);
      c.quadraticCurveTo(40 - i * 3, -84 + i * 7, 36 - i * 3.4, -30);
      c.lineTo(3, -30); c.closePath(); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.moveTo(3, -101); c.quadraticCurveTo(42, -80, 36, -30); c.lineTo(3, -30); c.closePath(); c.stroke();
  } else {
    c.fillStyle = '#FFF6E8';
    c.beginPath(); c.moveTo(3, -101); c.quadraticCurveTo(42, -80, 36, -30); c.lineTo(3, -30); c.closePath();
    c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  }
  c.fillStyle = '#FF9FBE';
  c.beginPath(); c.moveTo(-3, -98); c.quadraticCurveTo(-32, -76, -26, -34); c.lineTo(-3, -34); c.closePath();
  c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  // flag
  c.fillStyle = '#FFE14C';
  c.beginPath(); c.moveTo(0, -104); c.lineTo(18 + Math.sin(t * 6) * 2, -99); c.lineTo(0, -94); c.closePath(); c.fill();
  // Lila at the tiller
  c.save(); c.translate(-24, -16); c.scale(.8, .8);
  drawLila(c, t, { face: 1 });
  c.restore();
  // Pusheen aboard once adopted
  if (S.pet.adopted) {
    c.save(); c.translate(26, -17); c.scale(.62, .62);
    PAINT.pusheen(c, t, { face: -1 });
    c.restore();
  }
  c.restore();
}

/* Lila asleep in bed (house scene) */
function drawLilaSleeping(c, t) {
  c.save();
  c.lineJoin = 'round';
  // head on pillow
  oval(c, -34, -10, 17, 16, '#F2C298', INK);
  c.fillStyle = '#5E4128';
  c.beginPath(); c.arc(-34, -13, 17, Math.PI * .7, Math.PI * 1.9); c.closePath(); c.fill();
  closedEye(c, -30, -8); closedEye(c, -40, -8);
  blush(c, -26, -4); blush(c, -44, -4);
  smile(c, -34, -3, 3);
  // blanket over body
  c.beginPath();
  c.moveTo(-18, -16);
  c.quadraticCurveTo(10, -26 + Math.sin(t * 1.2) * 1.5, 46, -14);
  c.lineTo(48, 6); c.lineTo(-18, 6); c.closePath();
  c.fillStyle = '#FF9FBE'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-14, -8); c.quadraticCurveTo(12, -16, 44, -7); c.stroke();
  c.restore();
}
/* ============================================================
   LAND i — themes, prop sprites, per-isle layouts
   ============================================================ */
function hexLerp(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  return `rgb(${Math.round(lerp(pa[0], pb[0], t))},${Math.round(lerp(pa[1], pb[1], t))},${Math.round(lerp(pa[2], pb[2], t))})`;
}
const SKY_KEYS = [
  [0.00, '#0B1E3C', '#16324F', .78],
  [0.20, '#12254A', '#274468', .72],
  [0.27, '#FF9E7D', '#FFD9A0', .18],
  [0.34, '#7FD8E8', '#C9F0F7', 0],
  [0.50, '#55C4E8', '#B4ECF7', 0],
  [0.70, '#66C4E0', '#FFE0B0', .04],
  [0.78, '#FF8A54', '#FFC96B', .16],
  [0.855, '#4A3C7A', '#9C6BAA', .5],
  [0.92, '#101F44', '#1E3A5C', .75],
  [1.00, '#0B1E3C', '#16324F', .78],
];
function skyAt(tod) {
  let i = 0;
  while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1][0] < tod) i++;
  const A = SKY_KEYS[i], B = SKY_KEYS[i + 1];
  const t = clamp((tod - A[0]) / (B[0] - A[0] || 1), 0, 1);
  return { top: hexLerp(A[1], B[1], t), bot: hexLerp(A[2], B[2], t), dark: lerp(A[3], B[3], t) };
}
const isNight = () => G.tod < 0.24 || G.tod > 0.86;

/* ground colors + elevation per isle theme */
const THEMES = {
  home:    { ground: x => x < 2400 ? ['#F2DCA8', '#E8C98C'] : x < 4900 ? ['#E8D2A0', '#D8B888'] : x < 7700 ? ['#7FC96B', '#5CA84E'] : x < 9700 ? ['#F2DCA8', '#E8C98C'] : ['#9CA88C', '#7A8A6E'] },
  snack:   { ground: () => ['#F8E3C0', '#F0CFA0'] },
  turtle:  { ground: x => x < 4300 ? ['#EFE3B4', '#DCC990'] : ['#E8E0C8', '#D4CCAC'] },
  lagoon:  { ground: () => ['#F4E8C8', '#E4D2A4'] },
  mist:    { ground: () => ['#A8B4A0', '#8A9884'] },
  volcano: { ground: () => ['#8A7A74', '#6E5E58'] },
};
function elevAt(x) {
  const isle = S.isle;
  let e = 0;
  if (isle === 'home') {
    if (x > 9700) e = ease(clamp((x - 9700) / 1500, 0, 1)) * 150;
    if (x > 4900 && x <= 7700) e = Math.sin((x - 4900) / 2800 * Math.PI) * 16;
  } else if (isle === 'volcano') {
    if (x > 3200) e = ease(clamp((x - 3200) / 1800, 0, 1)) * 110;
  } else if (isle === 'mist') {
    if (x > 2400 && x < 3300) e = Math.sin((x - 2400) / 900 * Math.PI) * 30;
  } else {
    e = Math.sin(x / 900) * 8;
  }
  return e;
}
function gyAt(x) { return VH * .78 - elevAt(x); }
const SURF_STRIPS = { home: [7800, 9550], lagoon: [2500, 4300] };

/* ── prop sprites (shared style with game 1) ─────────────── */
function palmSpr(v) {
  return spr('palm' + v, 180, 240, c => {
    const lean = (n1(v * 7.7) - .5) * .5;
    c.strokeStyle = '#8C6A4B'; c.lineWidth = 13; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(lean * 40, -110, lean * 70, -180); c.stroke();
    const tx = lean * 70, ty = -180;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * .48;
      c.fillStyle = i % 2 ? '#3E9E5C' : '#4FBE6E';
      c.beginPath(); c.moveTo(tx, ty);
      const ex = tx + Math.cos(a) * 78, ey = ty + Math.sin(a) * 46 + 22;
      c.quadraticCurveTo(tx + Math.cos(a) * 45, ty + Math.sin(a) * 40 - 14, ex, ey);
      c.quadraticCurveTo(tx + Math.cos(a) * 42, ty + Math.sin(a) * 36 + 6, tx, ty);
      c.fill();
    }
    oval(c, tx - 6, ty + 4, 5, 6, '#A67C52', '#7A5A3E'); oval(c, tx + 6, ty + 6, 5, 6, '#A67C52', '#7A5A3E');
  });
}
function pineSpr(v) {
  return spr('pine' + v, 150, 250, c => {
    line(c, 0, 0, 0, -60, 10, '#5E5648');
    for (let i = 0; i < 4; i++) {
      const w2 = 62 - i * 12, y0 = -50 - i * 44;
      c.fillStyle = i % 2 ? '#5E7A6A' : '#6E8A78';
      c.beginPath(); c.moveTo(-w2, y0); c.lineTo(w2, y0); c.lineTo(0, y0 - 66); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,55,48,.5)'; c.lineWidth = 2; c.stroke();
    }
  });
}
function genericShop(key, base, roof, sign, accent) {
  return spr(key, 300, 250, c => {
    c.fillStyle = base; c.strokeStyle = INK; c.lineWidth = 3.4;
    rr(c, -100, -120, 200, 120, 12); c.fill(); c.stroke();
    c.fillStyle = roof;
    c.beginPath(); c.moveTo(-116, -114); c.quadraticCurveTo(0, -206, 116, -114); c.closePath(); c.fill(); c.stroke();
    // awning
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? accent : '#FFF6E8';
      c.beginPath(); c.moveTo(-98 + i * 40, -80); c.lineTo(-58 + i * 40, -80); c.lineTo(-58 + i * 40, -66);
      c.arc(-78 + i * 40, -66, 20, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
    rr(c, -70, -56, 56, 42, 8); c.fillStyle = '#BFE9FF'; c.fill(); c.strokeStyle = INK; c.stroke();
    rr(c, 18, -60, 42, 60, 15); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    rr(c, -62, -178, 124, 40, 18); c.fillStyle = '#FFF6E8'; c.fill(); c.stroke();
    c.font = '900 19px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#5B4636';
    c.fillText(sign, 0, -150);
  });
}
function cafeSpr() {
  return spr('cafe', 320, 260, c => {
    c.fillStyle = '#FFF3DD'; c.strokeStyle = INK; c.lineWidth = 3.5;
    rr(c, -110, -130, 220, 130, 12); c.fill(); c.stroke();
    c.fillStyle = '#F26D99';
    c.beginPath(); c.moveTo(-126, -124); c.quadraticCurveTo(0, -226, 126, -124); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#FFF';
    for (let i = 0; i < 6; i++) oval(c, -75 + i * 30, -164, 5, 7, '#FFF6E8', null);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#FF9FBE' : '#FFF6E8';
      c.beginPath(); c.moveTo(-108 + i * 36, -86); c.lineTo(-72 + i * 36, -86); c.lineTo(-72 + i * 36, -70);
      c.arc(-90 + i * 36, -70, 18, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
    rr(c, -78, -60, 62, 44, 8); c.fillStyle = '#BFE9FF'; c.fill(); c.stroke();
    rr(c, 22, -64, 44, 64, 16); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    rr(c, -55, -196, 110, 44, 20); c.fillStyle = '#FFF6E8'; c.fill(); c.stroke();
    c.font = '900 21px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#E56A93';
    c.fillText('☕ CAFÉ ♪', 0, -166);
  });
}
function cottageSpr() {
  return spr('cottage', 300, 240, c => {
    c.fillStyle = '#FFF0DD'; c.strokeStyle = INK; c.lineWidth = 3.4;
    rr(c, -95, -115, 190, 115, 12); c.fill(); c.stroke();
    // teal shingle roof
    c.fillStyle = '#5BB8B0';
    c.beginPath(); c.moveTo(-112, -108); c.quadraticCurveTo(0, -200, 112, -108); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#3E8E88'; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(0, -30 - i * 4, 118 - i * 22, Math.PI * 1.22, Math.PI * 1.78); c.stroke(); }
    // chimney with heart smoke
    rr(c, 48, -178, 22, 44, 4); c.fillStyle = '#C9908C'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    // round window + door
    oval(c, -45, -75, 18, 18, '#BFE9FF', INK);
    line(c, -45, -93, -45, -57, 2, INK); line(c, -63, -75, -27, -75, 2, INK);
    rr(c, 8, -66, 46, 66, 18); c.fillStyle = '#E8945C'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    oval(c, 44, -34, 3, 3, '#FFE14C', null);
    // heart on the door
    c.fillStyle = '#FF8FB1';
    c.beginPath(); c.moveTo(31, -40);
    c.bezierCurveTo(25, -48, 33, -52, 31, -45); c.bezierCurveTo(29, -52, 37, -48, 31, -40);
    c.fill();
    // name plaque
    rr(c, -70, -160, 140, 34, 16); c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    c.font = '900 17px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#3E8E88';
    c.fillText("🏠 LILA'S COTTAGE", 0, -137);
    // flowers
    for (let i = 0; i < 6; i++) {
      const fx = -80 + i * 32;
      c.fillStyle = ['#FF8FB1', '#FFE14C', '#B9A8FF'][i % 3];
      for (let p = 0; p < 5; p++) { const a = p * TAU / 5; oval(c, fx + Math.cos(a) * 4, -8 + Math.sin(a) * 4, 3, 3, c.fillStyle, null); }
      oval(c, fx, -8, 2.5, 2.5, '#FFF', null);
    }
  });
}
function garageSpr() {
  return spr('garage', 320, 240, c => {
    c.fillStyle = '#D8F2FF'; c.strokeStyle = INK; c.lineWidth = 3.4;
    rr(c, -110, -115, 220, 115, 12); c.fill(); c.stroke();
    c.fillStyle = '#3E7BFF'; rr(c, -122, -140, 244, 30, 10); c.fill(); c.stroke();
    // roll-up door
    rr(c, -80, -90, 100, 90, 8); c.fillStyle = '#B8CDE0'; c.fill(); c.stroke();
    c.strokeStyle = '#8FA8C0'; c.lineWidth = 3;
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-78, -90 + i * 17); c.lineTo(18, -90 + i * 17); c.stroke(); }
    // wheel sign
    c.strokeStyle = '#2A2A32'; c.lineWidth = 7; c.beginPath(); c.arc(60, -66, 22, 0, TAU); c.stroke();
    c.strokeStyle = '#FFB84D'; c.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.moveTo(60, -66); c.lineTo(60 + Math.cos(a) * 18, -66 + Math.sin(a) * 18); c.stroke(); }
    rr(c, -74, -186, 148, 40, 18); c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.font = '900 18px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#2B5BB5';
    c.fillText('🚲 GARAGE & DIVE', 0, -158);
    // surfboard
    c.save(); c.translate(-128, -16); c.rotate(-.16);
    oval(c, 0, -48, 15, 55, '#FFC24C', INK);
    c.restore();
  });
}
function lighthouseSpr(key, litCol) {
  return spr(key, 260, 420, c => {
    c.beginPath(); c.moveTo(-52, 0); c.lineTo(-34, -290); c.lineTo(34, -290); c.lineTo(52, 0); c.closePath();
    c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.5; c.stroke();
    c.save(); c.clip();
    c.fillStyle = litCol;
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(0, -60 - i * 96); c.rotate(-.06);
      c.fillRect(-70, -24, 140, 46); c.restore();
    }
    c.restore();
    c.beginPath(); c.moveTo(-52, 0); c.lineTo(-34, -290); c.lineTo(34, -290); c.lineTo(52, 0); c.closePath(); c.stroke();
    rr(c, -44, -304, 88, 16, 6); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    rr(c, -28, -366, 56, 62, 8); c.fillStyle = '#BFE9FF'; c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -366, 30, Math.PI, 0); c.closePath();
    c.fillStyle = litCol; c.fill(); c.stroke();
    rr(c, -20, -56, 40, 56, 16); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
  });
}
function dockSpr() {
  return spr('dock', 420, 140, c => {
    c.fillStyle = '#A67C52'; c.strokeStyle = '#7A5A3E'; c.lineWidth = 2.4;
    for (let i = 0; i < 9; i++) { rr(c, -200 + i * 45, -60, 41, 14, 3); c.fill(); c.stroke(); }
    for (const px of [-190, -60, 60, 185]) line(c, px, -52, px, 30, 10, '#8C6A4B');
    line(c, -205, -66, 205, -66, 6, '#8C6A4B');
  });
}
function rampSpr() {
  return spr('ramp', 130, 70, c => {
    c.beginPath(); c.moveTo(-55, 0); c.lineTo(48, 0); c.lineTo(48, -52); c.closePath();
    c.fillStyle = '#E8B96A'; c.fill(); c.strokeStyle = '#A8894C'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(120,90,40,.5)'; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-55 + i * 25, 0); c.lineTo(48, -52 * (i * 25) / 103); c.stroke(); }
    c.fillStyle = '#FF8FB1'; starPath(c, 30, -30, 7, 3.4); c.fill();
  });
}
function boardwalkSpr() {
  return spr('boardwalk', 460, 90, c => {
    c.fillStyle = '#C89468'; c.strokeStyle = '#96683E'; c.lineWidth = 2;
    for (let i = 0; i < 11; i++) { rr(c, -220 + i * 41, -14, 38, 12, 2); c.fill(); c.stroke(); }
    line(c, -225, -30, 225, -30, 5, '#96683E');
    for (const px of [-210, -105, 0, 105, 210]) line(c, px, -30, px, -4, 6, '#7A5A3E');
  });
}
function icecreamSpr() {
  return spr('icecream', 220, 220, c => {
    c.fillStyle = '#FFF0F4'; c.strokeStyle = INK; c.lineWidth = 3;
    rr(c, -70, -70, 140, 70, 10); c.fill(); c.stroke();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? '#FF9FBE' : '#FFF6E8';
      c.beginPath(); c.moveTo(-76 + i * 38, -120); c.lineTo(-38 + i * 38, -120); c.lineTo(-38 + i * 38, -104);
      c.arc(-57 + i * 38, -104, 19, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
    for (const px of [-64, 64]) line(c, px, -70, px, -118, 5, '#8C6A4B');
    // giant cone on top
    c.save(); c.translate(0, -130); c.rotate(.08);
    c.fillStyle = '#E8B96A'; c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.lineTo(0, 34); c.closePath(); c.fill();
    c.strokeStyle = '#A8894C'; c.lineWidth = 2; c.stroke();
    oval(c, 0, -8, 15, 13, '#FF9FBE', INK);
    oval(c, -1, -20, 12, 11, '#FFF3D0', INK);
    oval(c, 1, -29, 3, 3, '#E23B4E', INK);
    c.restore();
  });
}
function sandcastleSpr() {
  return spr('sandcastle', 200, 140, c => {
    c.fillStyle = '#EBCB94'; c.strokeStyle = '#C9A468'; c.lineWidth = 2.4;
    rr(c, -60, -55, 120, 55, 4); c.fill(); c.stroke();
    for (const [tx, th] of [[-48, 40], [48, 40], [0, 55]]) {
      rr(c, tx - 17, -55 - th, 34, th + 8, 3); c.fill(); c.stroke();
      for (let i = -1; i <= 1; i++) { c.fillRect(tx + i * 11 - 4, -55 - th - 7, 8, 8); }
      line(c, tx, -55 - th, tx, -55 - th - 16, 2, '#8C6A4B');
      c.fillStyle = ['#FF8FB1', '#7FD8E8', '#FFE14C'][Math.abs(tx) % 3];
      c.beginPath(); c.moveTo(tx, -55 - th - 16); c.lineTo(tx + 12, -55 - th - 12); c.lineTo(tx, -55 - th - 8); c.closePath(); c.fill();
      c.fillStyle = '#EBCB94';
    }
    c.fillStyle = 'rgba(120,90,50,.6)';
    c.beginPath(); c.arc(0, -18, 10, Math.PI, 0); c.closePath(); c.fill();
  });
}
function tidepoolSpr() {
  return spr('tidepool', 260, 90, c => {
    c.fillStyle = 'rgba(90,180,200,.75)';
    c.beginPath(); c.ellipse(0, -12, 110, 26, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(0, -12, 110, 26, 0, 0, TAU); c.stroke();
    c.fillStyle = '#8898A0';
    [[-95, -6, 22], [96, -10, 18], [60, -2, 14]].forEach(([rx, ry, rs]) => {
      c.beginPath(); c.ellipse(rx, ry, rs, rs * .55, 0, 0, TAU); c.fill();
    });
    // starfish & shells in the pool
    c.fillStyle = '#FF8FB1'; starPath(c, -30, -10, 9, 4.4); c.fill();
    c.fillStyle = '#FFD9A0'; c.beginPath(); c.arc(20, -8, 7, Math.PI, 0); c.closePath(); c.fill();
  });
}
function dojoSpr() {
  return spr('dojo', 380, 280, c => {
    // wooden dojo with curved roof
    c.fillStyle = '#E8D8B8'; c.strokeStyle = INK; c.lineWidth = 3.4;
    rr(c, -130, -120, 260, 120, 8); c.fill(); c.stroke();
    c.fillStyle = '#4A5A46';
    c.beginPath(); c.moveTo(-152, -112);
    c.quadraticCurveTo(-140, -170, 0, -178);
    c.quadraticCurveTo(140, -170, 152, -112);
    c.quadraticCurveTo(80, -132, 0, -134);
    c.quadraticCurveTo(-80, -132, -152, -112);
    c.closePath(); c.fill(); c.stroke();
    line(c, 0, -178, 0, -196, 4, '#8C6A4B');
    oval(c, 0, -202, 7, 7, '#5CBE6E', INK);
    // sliding doors
    for (const dx of [-34, 4]) {
      rr(c, dx, -84, 34, 84, 3); c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = '#8C6A4B'; c.lineWidth = 3; c.stroke();
      line(c, dx + 17, -84, dx + 17, 0, 2, '#C9B888');
      line(c, dx, -42, dx + 34, -42, 2, '#C9B888');
    }
    // turtle banner
    rr(c, -108, -100, 56, 84, 4); c.fillStyle = '#5CBE6E'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = '#FFF6E8'; c.font = '900 30px sans-serif'; c.textAlign = 'center';
    c.fillText('🐢', -80, -46);
    // lanterns
    for (const lx of [-140, 140]) {
      line(c, lx, -112, lx, -96, 2.4, '#7A5A3E');
      rr(c, lx - 10, -96, 20, 26, 8); c.fillStyle = '#FF9F6A'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
  });
}
function snackShackSpr() {
  return spr('snackshack', 300, 230, c => {
    c.fillStyle = '#FFE9C9'; c.strokeStyle = INK; c.lineWidth = 3;
    rr(c, -95, -100, 190, 100, 10); c.fill(); c.stroke();
    // giant donut sign
    c.save(); c.translate(0, -150);
    c.fillStyle = '#E8B96A'; c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.arc(0, 0, 15, 0, TAU, true); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.6;
    c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke();
    c.fillStyle = '#FF9FBE';
    c.beginPath(); c.arc(0, 0, 37, 0, TAU); c.arc(0, 0, 16, 0, TAU, true); c.clip();
    c.beginPath(); c.arc(0, -6, 37, Math.PI * 1.05, Math.PI * 1.95); c.arc(0, 0, 16, 0, TAU, true); c.fill();
    c.restore();
    // sprinkles
    for (let i = 0; i < 10; i++) {
      const a = n1(i * 3.1) * TAU, rr2 = 20 + n1(i * 7.3) * 14;
      ctxSprinkle(c, Math.cos(a) * rr2, -150 + Math.sin(a) * rr2 * .9, i);
    }
    // counter window
    rr(c, -60, -78, 120, 50, 8); c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    line(c, -60, -50, 60, -50, 3, '#E0B888');
    // snacks on counter
    oval(c, -30, -54, 8, 5, '#FF9FBE', INK); oval(c, 0, -55, 9, 6, '#E8B96A', INK); oval(c, 30, -54, 8, 5, '#FFE14C', INK);
  });
}
function ctxSprinkle(c, x, y, i) {
  c.save(); c.translate(x, y); c.rotate(n1(i * 9.7) * TAU);
  c.fillStyle = ['#FFE14C', '#7FE08C', '#7FD8E8', '#FFF'][i % 4];
  rr(c, -3, -1.2, 6, 2.4, 1.2); c.fill();
  c.restore();
}
function donutFloatSpr() {
  return spr('donutfloat', 200, 90, c => {
    c.fillStyle = 'rgba(127,216,232,.5)';
    c.beginPath(); c.ellipse(0, -6, 95, 22, 0, 0, TAU); c.fill();
    c.save(); c.translate(0, -22); c.scale(1, .55);
    c.fillStyle = '#FF9FBE'; c.beginPath(); c.arc(0, 0, 55, 0, TAU); c.arc(0, 0, 22, 0, TAU, true); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 55, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.stroke();
    c.restore();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      ctxSprinkle(c, Math.cos(a) * 38, -22 + Math.sin(a) * 20, i);
    }
  });
}
function bushSpr(v) {
  return spr('bush' + v, 130, 100, c => {
    c.fillStyle = '#4FA85C';
    c.beginPath();
    c.arc(-25, -28, 24, 0, TAU); c.arc(0, -42, 28, 0, TAU); c.arc(26, -28, 24, 0, TAU); c.arc(0, -22, 30, 0, TAU);
    c.fill();
    c.strokeStyle = '#37804A'; c.lineWidth = 2.4;
    c.beginPath(); c.arc(0, -30, 44, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  });
}
function picnicSpr() {
  return spr('picnic', 220, 100, c => {
    c.save(); c.rotate(-.02);
    c.fillStyle = '#FF9FBE';
    c.beginPath(); c.moveTo(-90, -6); c.lineTo(90, -6); c.lineTo(70, -46); c.lineTo(-70, -46); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = '#FFF6E8';
    for (let gx = 0; gx < 6; gx++) for (let gyy = 0; gyy < 3; gyy++) {
      if ((gx + gyy) % 2) continue;
      const y0 = -12 - gyy * 12, y1 = y0 - 12;
      const w0 = lerp(88, 70, (gyy * 12 + 6) / 40), xw = w0 / 3;
      c.fillRect(-w0 + gx * xw, y1, xw, 12);
    }
    // basket + treats
    rr(c, -20, -70, 40, 26, 6); c.fillStyle = '#C89468'; c.fill(); c.strokeStyle = '#96683E'; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.arc(0, -70, 16, Math.PI, 0); c.strokeStyle = '#96683E'; c.lineWidth = 3.4; c.stroke();
    oval(c, -40, -50, 8, 8, '#FFE14C', INK); oval(c, 42, -52, 9, 6, '#FF9FBE', INK);
    c.restore();
  });
}
function zenSpr() {
  return spr('zen', 260, 80, c => {
    c.strokeStyle = 'rgba(160,140,100,.65)'; c.lineWidth = 3;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, -10, 90 - i * 22, 24 - i * 6, 0, 0, TAU); c.stroke(); }
    c.fillStyle = '#8898A0';
    [[-30, -14, 16], [26, -8, 12], [0, -20, 9]].forEach(([rx, ry, rs]) => {
      c.beginPath(); c.ellipse(rx, ry, rs, rs * .7, .3, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(60,70,80,.5)'; c.lineWidth = 2; c.stroke();
    });
  });
}
function surfShackSpr() {
  return spr('surfshack', 280, 230, c => {
    // bamboo hut
    c.fillStyle = '#E8D0A0'; c.strokeStyle = '#A8894C'; c.lineWidth = 3;
    rr(c, -85, -95, 170, 95, 8); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(150,120,70,.5)'; c.lineWidth = 2;
    for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(-85 + i * 28, -95); c.lineTo(-85 + i * 28, 0); c.stroke(); }
    // palm-leaf roof
    c.fillStyle = '#4FA85C';
    c.beginPath(); c.moveTo(-105, -88); c.quadraticCurveTo(0, -160, 105, -88);
    c.lineTo(88, -76); c.quadraticCurveTo(0, -136, -88, -76); c.closePath(); c.fill();
    c.strokeStyle = '#37804A'; c.lineWidth = 2.4; c.stroke();
    // boards leaning
    for (const [bx2, col] of [[-108, '#FF8FB1'], [-88, '#7FD8E8'], [108, '#FFE14C']]) {
      c.save(); c.translate(bx2, -8); c.rotate(bx2 < 0 ? -.14 : .14);
      oval(c, 0, -42, 13, 48, col, INK);
      line(c, 0, -82, 0, -4, 2, 'rgba(255,255,255,.6)');
      c.restore();
    }
    rr(c, -55, -142, 110, 34, 16); c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    c.font = '900 16px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#2B8BA5';
    c.fillText('🏄 SURF SHACK', 0, -119);
  });
}
function mermaidRockSpr() {
  return spr('mrocks', 260, 140, c => {
    c.fillStyle = '#9AA8B8';
    [[-70, 0, 55, 40], [40, 0, 70, 55], [-10, 0, 40, 26]].forEach(([rx, ry, rw, rh]) => {
      c.beginPath(); c.ellipse(rx, ry - rh * .4, rw, rh, 0, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,80,95,.6)'; c.lineWidth = 2.4; c.stroke();
    });
    c.fillStyle = '#FF8FB1'; starPath(c, -60, -12, 8, 4); c.fill();
    c.fillStyle = '#FFD9A0'; c.beginPath(); c.arc(60, -20, 8, Math.PI, 0); c.closePath(); c.fill();
    // scattered pearls
    for (let i = 0; i < 3; i++) { oval(c, -20 + i * 22, -6, 4, 4, '#FFF0F8', 'rgba(200,170,190,.8)'); }
  });
}
function caveMouthSpr() {
  return spr('cavemouth', 300, 230, c => {
    c.fillStyle = '#5E6A62';
    c.beginPath(); c.moveTo(-130, 0);
    c.quadraticCurveTo(-120, -150, 0, -170);
    c.quadraticCurveTo(120, -150, 130, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,50,45,.7)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#141C20';
    c.beginPath(); c.moveTo(-62, 0);
    c.quadraticCurveTo(-56, -92, 0, -102);
    c.quadraticCurveTo(56, -92, 62, 0);
    c.closePath(); c.fill();
    // moss
    c.strokeStyle = '#6E8A78'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const mx = -50 + i * 25;
      c.beginPath(); c.moveTo(mx, -96 + Math.abs(mx) * .4); c.lineTo(mx + 3, -80 + Math.abs(mx) * .4); c.stroke();
    }
  });
}
function hotspringSpr() {
  return spr('hotspring', 280, 110, c => {
    c.fillStyle = '#8898A0';
    c.beginPath(); c.ellipse(0, -8, 120, 34, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,220,235,.9)';
    c.beginPath(); c.ellipse(0, -10, 105, 26, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(0, -10, 105, 26, 0, 0, TAU); c.stroke();
    c.fillStyle = '#6E7A84';
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + .4;
      c.beginPath(); c.ellipse(Math.cos(a) * 112, -8 + Math.sin(a) * 26, 15, 10, 0, 0, TAU); c.fill();
    }
  });
}
function firetreeSpr(v) {
  return spr('firetree' + v, 180, 220, c => {
    const lean = (n1(v * 3.1) - .5) * .3;
    c.strokeStyle = '#5E4A44'; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(lean * 40, -90, lean * 55, -150); c.stroke();
    const tx = lean * 55, ty = -150;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .5;
      c.fillStyle = i % 2 ? '#C05840' : '#D87050';
      c.beginPath(); c.moveTo(tx, ty);
      const ex = tx + Math.cos(a) * 66, ey = ty + Math.sin(a) * 40 + 18;
      c.quadraticCurveTo(tx + Math.cos(a) * 38, ty + Math.sin(a) * 34 - 12, ex, ey);
      c.quadraticCurveTo(tx + Math.cos(a) * 36, ty + Math.sin(a) * 30 + 6, tx, ty);
      c.fill();
    }
  });
}
function festivalSpr() {
  return spr('festival', 460, 200, c => {
    for (const px of [-210, 210]) line(c, px, 0, px, -160, 8, '#8C6A4B');
    c.strokeStyle = 'rgba(90,70,50,.8)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-210, -155); c.quadraticCurveTo(0, -110, 210, -155); c.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + .5) / 7, lx = lerp(-210, 210, t), ly = -155 + Math.sin(t * Math.PI) * 42;
      c.fillStyle = ['#FF8FB1', '#FFE14C', '#7FD8E8', '#7FE08C', '#B9A8FF', '#FFB84D', '#FF9FD0'][i];
      line(c, lx, ly, lx, ly + 8, 2, '#7A5A3E');
      rr(c, lx - 11, ly + 8, 22, 28, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(90,70,50,.8)'; c.lineWidth = 2.4;
    }
  });
}
function boatSpr() {
  return spr('boat', 260, 220, c => {
    c.beginPath(); c.moveTo(-88, -40); c.lineTo(88, -40); c.quadraticCurveTo(70, 6, 30, 10);
    c.lineTo(-60, 10); c.quadraticCurveTo(-86, 0, -88, -40); c.closePath();
    c.fillStyle = '#E23B4E'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    line(c, -80, -40, 80, -40, 5, '#FFF6E8');
    line(c, 0, -40, 0, -180, 6, '#8C6A4B');
    c.fillStyle = '#FFF6E8';
    c.beginPath(); c.moveTo(4, -175); c.quadraticCurveTo(70, -130, 58, -50); c.lineTo(4, -50); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#FF9FBE';
    c.beginPath(); c.moveTo(-4, -170); c.quadraticCurveTo(-52, -125, -40, -56); c.lineTo(-4, -56); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#FFE14C';
    c.beginPath(); c.moveTo(0, -180); c.lineTo(26, -172); c.lineTo(0, -164); c.closePath(); c.fill();
  });
}
function jungleTreeSpr(kind, v) {
  return spr('jt' + kind + v, 220, 280, c => {
    c.strokeStyle = '#7A5A3E'; c.lineWidth = 15; c.lineCap = 'round';
    const lean = (n1(v * 3.3) - .5) * .3;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(lean * 50, -120, lean * 60, -190); c.stroke();
    const tx = lean * 60, ty = -190;
    const leaf = kind === 'banana' ? '#4FBE6E' : kind === 'coconut' ? '#3E9E5C' : '#3E8E4C';
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i - 3.5) * .46;
      c.fillStyle = i % 2 ? leaf : '#5CCE7C';
      c.beginPath(); c.moveTo(tx, ty);
      const ex = tx + Math.cos(a) * 88, ey = ty + Math.sin(a) * 52 + 26;
      c.quadraticCurveTo(tx + Math.cos(a) * 50, ty + Math.sin(a) * 46 - 16, ex, ey);
      c.quadraticCurveTo(tx + Math.cos(a) * 46, ty + Math.sin(a) * 40 + 8, tx, ty);
      c.fill();
    }
  });
}
function volcanoBgSpr() {
  return spr('volcanobg', 700, 420, c => {
    const g = c.createLinearGradient(0, -400, 0, 0);
    g.addColorStop(0, '#6E4A4A'); g.addColorStop(1, '#4E3A3A');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-340, 0);
    c.lineTo(-120, -330); c.lineTo(-40, -310); c.lineTo(60, -350); c.lineTo(340, 0);
    c.closePath(); c.fill();
    // crater glow
    glow(c, -30, -330, 90, rgba(255, 140, 80), .5);
    c.fillStyle = 'rgba(255,120,60,.8)';
    c.beginPath(); c.ellipse(-32, -328, 52, 12, 0, 0, TAU); c.fill();
    // snow-ish ash cap lines
    c.strokeStyle = 'rgba(230,210,200,.35)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(-110, -300); c.lineTo(-60, -270); c.lineTo(-10, -295); c.lineTo(40, -320); c.stroke();
  });
}

/* ── per-isle prop layouts ───────────────────────────────── */
const PROPS_CACHE = {};
function propsFor(isle) {
  if (PROPS_CACHE[isle]) return PROPS_CACHE[isle];
  const P = [];
  const add = (x, s, scale = 1, layer = 1, para = 1) => P.push({ x, s, scale, layer, para });
  if (isle === 'home') {
    add(140, dockSpr(), 1); add(90, boatSpr(), .9, 1);
    add(440, palmSpr(1), 1.05); add(760, palmSpr(2), .9);
    add(1050, cottageSpr(), 1);
    add(1650, cafeSpr(), 1);
    add(2000, palmSpr(3), 1.05);
    add(2250, rampSpr(), 1);
    add(2850, garageSpr(), 1);
    add(3250, genericShop('houseA', '#FFE3EE', '#F26D99', '🌸 Petal House', '#FF9FBE'), .92);
    add(3700, genericShop('furnshop', '#FFF3D0', '#FFB84D', '🛋️ COMFY CORNER', '#FFD86B'), 1);
    add(4150, genericShop('toyshop', '#E8F5D8', '#7FB86A', '🧸 TREASURES', '#A8D890'), .95);
    add(4450, genericShop('pudstand', '#FFF3DD', '#C68A4B', '🍮 PUDDING', '#FFD86B'), .8);
    add(4750, dockSpr(), .7);
    const JT = [[5100, 'coconut'], [5400, 'mango'], [5800, 'banana'], [6200, 'coconut'], [6300, 'ramp'], [6700, 'mango'], [7200, 'banana']];
    JT.forEach(([x, k], i) => k === 'ramp' ? add(x, rampSpr(), 1) : add(x, jungleTreeSpr(k, i), 1 + n1(i * 5.5) * .25));
    for (let i = 0; i < 8; i++) add(5000 + i * 320 + n1(i) * 120, palmSpr(5 + (i % 3)), .68, 0, .85);
    add(7900, boardwalkSpr(), 1); add(8360, boardwalkSpr(), 1); add(8820, boardwalkSpr(), 1); add(9280, boardwalkSpr(), 1);
    add(8250, icecreamSpr(), 1);
    add(8650, sandcastleSpr(), 1);
    add(8900, rampSpr(), 1);
    add(9250, tidepoolSpr(), 1);
    add(10300, palmSpr(9), .85);
    add(11150, lighthouseSpr('lighthouse', '#E23B4E'), 1);
    add(10800, festivalSpr(), 1);
  } else if (isle === 'snack') {
    add(380, dockSpr(), .8);
    add(800, palmSpr(11), .95);
    add(1250, donutFloatSpr(), 1);
    add(1700, palmSpr(12), .85);
    add(2050, snackShackSpr(), 1);
    [2700, 3000, 3300].forEach((x, i) => add(x, bushSpr(i), 1));
    add(3700, palmSpr(13), 1);
    add(4000, picnicSpr(), 1);
    add(4400, palmSpr(14), .9);
  } else if (isle === 'turtle') {
    add(380, dockSpr(), .8);
    add(900, palmSpr(15), .95);
    add(1500, palmSpr(16), .85);
    add(2650, dojoSpr(), 1);
    add(3250, picnicSpr(), .9); // pizza table
    add(3800, zenSpr(), .9);    // training yard mat
    add(4600, zenSpr(), 1.1);
    add(4950, pineSpr(1), .8);
  } else if (isle === 'lagoon') {
    add(380, dockSpr(), .8);
    add(900, palmSpr(17), .9);
    add(1400, mermaidRockSpr(), 1);
    add(2250, surfShackSpr(), 1);
    add(4450, palmSpr(18), .95);
  } else if (isle === 'mist') {
    add(380, dockSpr(), .8);
    [900, 1300, 1750, 2150].forEach((x, i) => add(x, pineSpr(i + 2), .9 + n1(i) * .3));
    add(2800, lighthouseSpr('lighthouse2', '#5E6A80'), .95);
    add(3550, caveMouthSpr(), 1);
    for (let i = 0; i < 5; i++) add(600 + i * 700, pineSpr(i + 8), .6, 0, .85);
  } else if (isle === 'volcano') {
    add(2600, volcanoBgSpr(), 1.4, 0, .75);
    add(380, dockSpr(), .8);
    add(1000, firetreeSpr(1), .9);
    add(1650, hotspringSpr(), 1);
    [2500, 2800, 3100].forEach((x, i) => add(x, firetreeSpr(i + 2), 1 + n1(i) * .2));
    add(3900, firetreeSpr(6), .85);
  }
  PROPS_CACHE[isle] = P;
  return P;
}

/* trees / bushes with pickable fruit, per isle */
const TREE_SETS = {
  home: [
    { x: 5100, kind: 'coconut' }, { x: 5400, kind: 'mango' }, { x: 5800, kind: 'banana' },
    { x: 6200, kind: 'coconut' }, { x: 6700, kind: 'mango' }, { x: 7200, kind: 'banana' },
  ],
  snack: [{ x: 2700, kind: 'blueberry' }, { x: 3000, kind: 'blueberry' }, { x: 3300, kind: 'blueberry' }],
  volcano: [{ x: 2500, kind: 'firefruit' }, { x: 2800, kind: 'firefruit' }, { x: 3100, kind: 'firefruit' }],
  turtle: [], lagoon: [], mist: [],
};
Object.values(TREE_SETS).forEach(set => set.forEach(tr => { tr.have = 2; tr.timer = 0; tr.shake = 0; }));
const FRUIT_COL = { mango: '#FF9838', banana: '#FFE14C', coconut: '#8C6A4B', blueberry: '#5B7BD8', firefruit: '#E8543C' };

const CLOUDS = [];
for (let i = 0; i < 9; i++) CLOUDS.push({ x: rnd(0, 12000), y: rnd(.06, .3), s: rnd(.6, 1.4), v: rnd(4, 10) });
let birds = [];
let fallingFruit = [];
/* ============================================================
   LAND ii — update, draw, NPCs, pickups, interaction, pet
   ============================================================ */
function landNPCList() {
  const q = S.mq, isle = S.isle, list = [];
  if (isle === 'home') {
    list.push({ id: 'melody', x: POS.melody });
    list.push({ id: 'pochacco', x: POS.pochacco });
    if (!(q >= 34 && q <= 38)) list.push({ id: 'purin', x: POS.purin });
    list.push({ id: 'kitty', x: POS.kittyLH });
    list.push({ id: 'sammy', x: POS.sammy });
    list.push({ id: 'pigeon', x: POS.icecream - 60 });
    if (q >= 3) list.push({ id: 'coral', x: POS.tidepools, mermaid: true });
    if (q === 18 && !S.pet.adopted) list.push({ id: 'pusheen', x: POS.dock + 160 });
  } else if (isle === 'snack') {
    if (q >= 11 && q <= 13 && !S.flags.pusheenAwake) list.push({ id: 'pusheen', x: 1250, sleep: true, float: true });
    else if (!S.pet.adopted) list.push({ id: 'pusheen', x: q <= 13 ? 1250 : 2050, float: q <= 13 });
  } else if (isle === 'turtle') {
    list.push({ id: 'leo', x: 2560 });
    list.push({ id: 'raph', x: 2760 });
    list.push({ id: 'mikey', x: 3250 });
    list.push({ id: 'donnie', x: 3800 });
  } else if (isle === 'lagoon') {
    if (S.mq >= 23 || S.flags.surfShackFixed) list.push({ id: 'pochacco', x: 2350 });
  } else if (isle === 'mist') {
    if (S.mq >= 28 || S.flags.beaconLit) list.push({ id: 'glimmer', x: 2950 });
    else if (S.mq >= 27) list.push({ id: 'glimmer', x: 1500, shy: true });
  } else if (isle === 'volcano') {
    if (S.mq >= 34) list.push({ id: 'purin', x: 1700, bathing: true });
  }
  return list;
}
function npcMark(id) {
  const q = S.mq;
  switch (id) {
    case 'melody': return q === 1 || (q === 2 && invCount('silvershell') >= 5) || (q === 31 && invCount('plank') >= 4) || q === 39;
    case 'pochacco': return q === 6 || (q === 8 && invCount('boatpart') >= 3) || (q === 23 && invCount('plank') >= 3 && S.isle === 'lagoon') || (q === 24 && S.isle === 'lagoon');
    case 'kitty': return q === 3 && !S.flags.gotCottage;
    case 'purin': return (q === 32 && S.flags.gotWheel) || (q === 35 && invCount('firefruit') >= 3);
    case 'pusheen': return (q === 11 && (invCount('dish_reefroll') || invCount('dish_tart'))) || (q === 12 && hasItems({ blueberry: 6, coconut: 2 })) || (q === 13 && invCount('sardine')) || q === 18 || q === 41;
    case 'leo': return q === 15 || q === 16 || q === 40;
    case 'donnie': return q === 16 || q === 33;
    case 'mikey': return q === 17 && invCount('dish_pizza') >= 2;
    case 'glimmer': return q === 28 || q === 29;
    case 'coral': return false;
    default: return false;
  }
}
function drawLandNPCs(camX) {
  if (G.cutscene && G.cutscene.data && G.cutscene.data.fw) return;
  landNPCList().forEach(n => {
    const sx = n.x - camX;
    if (sx < -140 || sx > VW + 140) return;
    let gy = gyAt(n.x);
    if (n.float) gy -= 6 + Math.sin(G.t * 1.6) * 3;   // pusheen on donut float
    const face = G.p.x > n.x ? 1 : -1;
    const talking = G.dialog && G.dialog.who === n.id;
    ctx.save(); ctx.translate(sx, gy);
    ctx.fillStyle = 'rgba(40,30,20,.15)'; ctx.beginPath(); ctx.ellipse(0, 2, 20, 5, 0, 0, TAU); ctx.fill();
    if (n.mermaid) { // coral lounging in the tidepool
      ctx.translate(0, 16);
      PAINT.coral(ctx, G.t, { face, talk: talking });
    } else if (n.bathing) { // purin in the hot spring
      ctx.translate(0, 26);
      PAINT.purin(ctx, G.t + n.x, { face, talk: talking });
      ctx.fillStyle = 'rgba(140,220,235,.85)';
      ctx.beginPath(); ctx.ellipse(0, -8, 42, 12, 0, 0, TAU); ctx.fill();
    } else {
      PAINT[n.id](ctx, G.t + n.x, { face, talk: talking, sleep: n.sleep, hop: n.id === 'pochacco' && npcMark('pochacco') });
    }
    ctx.restore();
    if (npcMark(n.id)) {
      const by = gy - 96 + Math.sin(G.t * 3) * 4;
      glow(ctx, sx, by, 22, rgba(255, 220, 100), .5);
      ctx.fillStyle = '#FFC24C';
      rr(ctx, sx - 9, by - 13, 18, 26, 9); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#5B4636'; ctx.font = '900 17px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', sx, by + 6);
    }
  });
}

/* ── quest & collectible pickups on land ─────────────────── */
function landPickups() {
  const q = S.mq, isle = S.isle, list = [];
  const spot = (x, kind, extra) => list.push(Object.assign({ x, kind }, extra));
  if (isle === 'home') {
    if (q === 2) [600, 1250, 1900, 2100, 780].forEach((x, i) => { if (!S.flags['ss' + i]) spot(x, 'silvershell', { i }); });
    if (q === 8) {
      if (!S.flags.bp0) spot(420, 'boatpart', { i: 0 });
      if (!S.flags.bp1) spot(6800, 'boatpart', { i: 1 });
      if (!S.flags.bp2) spot(9350, 'boatpart', { i: 2 });
    }
    if (q === 31) [1100, 1500, 1950, 2200].forEach((x, i) => { if (!S.flags['pk' + i]) spot(x, 'plank', { i: 'pk' + i }); });
    if (q === 32 && !S.flags.gotWheel) spot(6500, 'wheel');
  }
  if (isle === 'lagoon' && q === 23) [3400, 3800, 4150].forEach((x, i) => { if (!S.flags['lg' + i]) spot(x, 'plank', { i: 'lg' + i }); });
  if (isle === 'mist' && q === 27) [900, 1650, 2350, 3250].forEach((x, i) => { if (!S.flags['pr' + i]) spot(x, 'prism', { i }); });
  if (isle === 'volcano' && q >= 35 && !S.mapPieces.includes('m4a')) spot(1780, 'mappiece', { piece: 'm4a' });
  CHARMS.forEach(c2 => { if (c2.isle === isle && !S.charms.includes(c2.id)) spot(c2.x, 'charm', { id: c2.id }); });
  TMAPS.forEach(m => {
    if (m.isle === isle && mapComplete(m.id) && !S.dug.includes(m.id) && S.flags.shovel) spot(m.x, 'digspot', { id: m.id });
  });
  return list;
}
function drawLandPickups(camX) {
  landPickups().forEach(pk => {
    const sx = pk.x - camX;
    if (sx < -60 || sx > VW + 60) return;
    const gy = gyAt(pk.x), bob = Math.sin(G.t * 2.6 + pk.x) * 3;
    if (pk.kind === 'silvershell') {
      glow(ctx, sx, gy - 8 + bob, 24, rgba(220, 235, 255), .5 + .2 * Math.sin(G.t * 4));
      ctx.save(); ctx.translate(sx, gy - 8 + bob);
      ctx.fillStyle = '#DCE8F4'; ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#9FB8D8'; ctx.lineWidth = 1.6; ctx.stroke();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 5.5, -8); ctx.stroke(); }
      ctx.restore();
    } else if (pk.kind === 'boatpart' || pk.kind === 'wheel') {
      glow(ctx, sx, gy - 12 + bob, 26, rgba(255, 220, 140), .4);
      ctx.save(); ctx.translate(sx, gy - 12 + bob); ctx.rotate(G.t * .8);
      ctx.strokeStyle = '#7B8FA8'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6; line(ctx, Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a) * 14, Math.sin(a) * 14, 4, '#7B8FA8'); }
      ctx.restore();
    } else if (pk.kind === 'plank') {
      ctx.save(); ctx.translate(sx, gy - 6); ctx.rotate(.2 + n1(pk.x) * .4);
      rr(ctx, -20, -5, 40, 10, 4); ctx.fillStyle = '#A67C52'; ctx.fill();
      ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      glow(ctx, sx, gy - 8, 24, rgba(255, 240, 180), .3 + .15 * Math.sin(G.t * 3));
    } else if (pk.kind === 'prism') {
      glow(ctx, sx, gy - 14 + bob, 30, rgba(160, 220, 255), .55 + .2 * Math.sin(G.t * 3));
      ctx.save(); ctx.translate(sx, gy - 14 + bob); ctx.rotate(G.t);
      ctx.fillStyle = 'rgba(160,215,255,.9)';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 0); ctx.lineTo(0, 12); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    } else if (pk.kind === 'mappiece') {
      glow(ctx, sx, gy - 12 + bob, 26, rgba(255, 230, 170), .5);
      ctx.save(); ctx.translate(sx, gy - 12 + bob); ctx.rotate(.15);
      rr(ctx, -11, -8, 22, 16, 2); ctx.fillStyle = '#F2E2C4'; ctx.fill();
      ctx.strokeStyle = '#A8894C'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = '#C0574A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, 4); ctx.moveTo(4, -3); ctx.lineTo(-4, 4); ctx.stroke();
      ctx.restore();
    } else if (pk.kind === 'charm') {
      glow(ctx, sx, gy - 10 + bob, 24, rgba(255, 180, 220), .4 + .2 * Math.sin(G.t * 3));
      ctx.save(); ctx.translate(sx, gy - 10 + bob); ctx.rotate(Math.sin(G.t * 1.5) * .2);
      ctx.fillStyle = '#FFB6D9'; ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI * .85, Math.PI * .15); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#E56A93'; ctx.lineWidth = 1.8; ctx.stroke();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(i * 6, -7); ctx.stroke(); }
      ctx.restore();
    } else if (pk.kind === 'digspot') {
      // X marks the spot
      glow(ctx, sx, gy - 4, 34, rgba(255, 215, 120), .35 + .2 * Math.sin(G.t * 2.5));
      ctx.strokeStyle = 'rgba(200,80,60,.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx - 14, gy - 16); ctx.lineTo(sx + 14, gy + 4);
      ctx.moveTo(sx + 14, gy - 16); ctx.lineTo(sx - 14, gy + 4); ctx.stroke();
    }
  });
}

/* ── land interaction ───────────────────────────────────── */
function findInteractLand() {
  const p = G.p, cands = [];
  if (G.busy || G.race) { G.nearTarget = null; return; }
  const near = (x, r = 78) => Math.abs(p.x - x) < r;
  landNPCList().forEach(n => {
    if (near(n.x)) cands.push({ x: n.x, icon: '💬', label: NPCS[n.id].n, act: () => { G.vehicle = null; talkTo(n.id); } });
  });
  if (S.isle === 'home') {
    if (near(POS.cafeDoor, 60)) cands.push({ x: POS.cafeDoor, icon: '🍳', label: 'Kitchen', act: () => openPanel('cafe') });
    if (near(POS.cottage, 70) && S.flags.gotCottage) cands.push({ x: POS.cottage, icon: '🏠', label: 'Go inside', act: enterHouse });
    if (near(POS.garage, 70)) cands.push({ x: POS.garage, icon: '🛒', label: 'Garage shop', act: () => openShop('garage') });
    if (near(POS.furnShop, 70)) cands.push({ x: POS.furnShop, icon: '🛋️', label: 'Comfy Corner', act: () => openShop('furniture') });
    if (near(POS.toyShop, 70)) cands.push({ x: POS.toyShop, icon: '🧸', label: 'Treasure Stand', act: () => openShop('toyshop') });
    if (near(POS.tidepools, 80) && S.mq >= 6) cands.push({ x: POS.tidepools, icon: '👗', label: 'Tide Boutique', act: () => openShop('boutique') });
    if (near(POS.icecream, 62)) cands.push({ x: POS.icecream, icon: '🍦', label: 'Ice cream!', act: buyIcecream });
    if (near(POS.dock, 90)) {
      if (S.vehicles.boat) cands.push({ x: POS.dock, low: true, icon: '⛵', label: 'Set sail!', act: () => startSail() });
      else if (S.mq === 9) cands.push({ x: POS.dock, icon: '⛵', label: 'Set sail!', act: () => quest9Sail() });
    }
  } else {
    if (near(isleDef().dock, 90) && S.vehicles.boat) cands.push({ x: isleDef().dock, low: true, icon: '⛵', label: 'Set sail!', act: () => startSail() });
  }
  if (S.isle === 'snack' && near(2050, 70) && (S.flags.pusheenAwake || S.mq >= 14)) cands.push({ x: 2050, icon: '🍪', label: 'Snack Shack', act: () => openShop('snackshack') });
  if (S.isle === 'mist' && near(2800, 70) && S.mq >= 27 && !S.flags.beaconLit && invCount('prism') >= 4) {
    cands.push({ x: 2800, icon: '🕯️', label: 'Relight the beacon!', act: relightBeacon });
  }
  if (S.isle === 'mist' && near(3850, 90) && S.mq === 29 && !S.mapPieces.includes('m3a')) {
    cands.push({ x: 3850, icon: '✨', label: 'Search the cave', act: caveTreasure });
  }
  // your cat!
  if (S.pet.adopted && Math.abs(p.x - G.pet.x) < 64 && !G.vehicle) {
    cands.push({ x: G.pet.x, icon: '🐾', label: 'Pusheen', act: petTalk });
  }
  // buoys
  (BUOYS[S.isle] || []).forEach(b => {
    if (near(b.x, 70)) cands.push({ x: b.x, icon: '🌊', label: 'Dive!', act: () => { G.vehicle = null; startDive(b); } });
  });
  // fruit trees & bushes
  (TREE_SETS[S.isle] || []).forEach(tr => {
    if (near(tr.x, 60) && tr.have > 0) cands.push({ x: tr.x, icon: tr.kind === 'blueberry' ? '🫐' : '🌴', label: tr.kind === 'blueberry' ? 'Pick berries!' : 'Shake!', act: () => shakeTree(tr) });
  });
  // windsurf mount
  const strip = SURF_STRIPS[S.isle];
  if (strip && S.vehicles.surf && !G.vehicle && p.x > strip[0] - 80 && p.x < strip[1] + 80) {
    cands.push({ x: clamp(p.x, strip[0], strip[1]), low: true, icon: '🏄', label: 'Windsurf!', act: () => { G.vehicle = 'surf'; AudioSys.sfx('splash'); updateVehBtn(); } });
  }
  // races
  Object.entries(RACES).forEach(([rid, R]) => {
    if (R.isle !== S.isle) return;
    const unlocked = (rid === 'bike1' && S.mq >= 6) || (rid === 'bike2' && S.mq >= 18) || (rid === 'surf1' && S.mq >= 24) || (rid === 'surf2' && S.mq >= 26 && S.vehicles.surf);
    if (!unlocked) return;
    if ((R.veh === 'bike' && !S.vehicles.bike && !(rid === 'bike1' && S.mq === 6)) || (R.veh === 'surf' && !S.vehicles.surf && rid !== 'surf1')) return;
    if (near(R.startX, 60)) {
      const medal = S.medals[rid] || 0;
      cands.push({ x: R.startX, icon: '🏁', label: `${R.n}${medal ? ' ' + ['', '🥉', '🥈', '🥇'][medal] : ''}`, act: () => startRace(rid) });
    }
  });
  // pickups
  landPickups().forEach(pk => {
    if (near(pk.x, 55)) {
      if (pk.kind === 'digspot') cands.push({ x: pk.x, icon: '⛏️', label: 'Dig!', act: () => digTreasure(pk.id) });
      else cands.push({ x: pk.x, icon: '✨', label: 'Pick up', act: () => takeLandPickup(pk) });
    }
  });
  cands.sort((a, b2) => (Math.abs(p.x - a.x) + (a.low ? 44 : 0)) - (Math.abs(p.x - b2.x) + (b2.low ? 44 : 0)));
  G.nearTarget = cands[0] || null;
}

/* ── land update ─────────────────────────────────────────── */
function updateLand(dt) {
  const p = G.p, def = isleDef();
  G.tod = (G.tod + dt / 420) % 1;
  S.tod = G.tod;
  const strip = SURF_STRIPS[S.isle];
  const raceLock = G.race && G.race.phase === 'count';
  if (!G.busy && !raceLock) {
    const ax = axisX();
    let spd = 285;
    if (G.vehicle === 'bike') spd = 600 * (S.flags.fattires ? 1.25 : 1) * (S.outfit.hat === 'hb_red' ? 1.12 : 1);
    if (G.vehicle === 'surf') spd = 500 * (S.flags.wax ? 1.25 : 1);
    p.vx = ax * spd;
    p.x = clamp(p.x + p.vx * dt, 60, def.w - 60);
    if (G.vehicle === 'surf' && strip) {
      if (p.x < strip[0] || p.x > strip[1]) { G.vehicle = null; AudioSys.sfx('splash'); updateVehBtn(); }
    }
    p.face = ax !== 0 ? Math.sign(ax) : p.face;
    p.walk = lerp(p.walk, ax !== 0 ? 1 : 0, dt * 10);
    if (ax !== 0 && !G.vehicle) {
      p.anim += dt;
      if (p.anim > .26) { p.anim = 0; AudioSys.sfx('step'); }
    }
    // bike jumps & ramps
    if (G.vehicle === 'bike') {
      if (p.jumpY < 0 || p.jumpV !== 0) {
        p.jumpV += 1300 * dt;
        p.jumpY += p.jumpV * dt;
        p.spin += dt * 9;
        if (p.jumpY >= 0) {
          p.jumpY = 0; p.jumpV = 0; p.spin = 0;
          AudioSys.sfx('catchS');
          burst(p.x, gyAt(p.x), '#FFE9C9', 10, { grav: 100 });
          if (S.mq === 7 && S.flags.airTime) { S.flags.trickDone = true; markSave(); quest7Done(); }
          S.flags.airTime = false;
        } else if (p.jumpY < -60) S.flags.airTime = true;
      }
      if (S.isle === 'home' && Math.abs(p.vx) > 380 && p.jumpY === 0) {
        for (const rx of [POS.ramp1, POS.ramp2, POS.ramp3]) {
          if (Math.abs(p.x - rx) < 34) { p.jumpV = -430; p.jumpY = -1; AudioSys.sfx('dashS'); break; }
        }
      }
      if (Math.random() < dt * 6 && Math.abs(p.vx) > 100) burst(p.x - p.face * 24, gyAt(p.x) - 4, 'rgba(242,220,168,.7)', 1, { grav: 60, speed: 40, size: 3 });
    }
    if (G.vehicle === 'surf' && Math.abs(p.vx) > 100 && Math.random() < dt * 10) {
      burst(p.x - p.face * 30, gyAt(p.x) + 22, 'rgba(220,245,255,.8)', 2, { grav: 140, speed: 90, size: 3 });
    }
    S.px = p.x;
  } else p.walk = lerp(p.walk, 0, dt * 10);
  G.cam.x = lerp(G.cam.x, clamp(p.x - VW / 2, 0, def.w - VW), 1 - Math.pow(.001, dt));
  // clouds & birds
  CLOUDS.forEach(cl => { cl.x += cl.v * dt; if (cl.x > def.w + 300) cl.x = -300; });
  if (birds.length < 3 && Math.random() < dt * .05 && !isNight() && S.isle !== 'mist') {
    birds.push({ x: G.cam.x - 100, y: rnd(.1, .35) * VH, v: rnd(60, 110), ph: rnd(TAU) });
    if (Math.random() < .4) AudioSys.sfx('chirp');
  }
  birds = birds.filter(b => b.x < G.cam.x + VW + 200);
  birds.forEach(b => { b.x += b.v * dt; b.y += Math.sin(G.t * 2 + b.ph) * 10 * dt; });
  // trees
  (TREE_SETS[S.isle] || []).forEach(tr => {
    tr.shake = Math.max(0, tr.shake - dt * 3);
    if (tr.have < 2) { tr.timer += dt; if (tr.timer > 40) { tr.timer = 0; tr.have++; } }
  });
  fallingFruit.forEach(f => {
    f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * dt;
    const gy = gyAt(f.x);
    if (f.y > gy - 6) { f.y = gy - 6; f.vy *= -.4; f.vx *= .7; f.bounces++; }
    f.life -= dt;
    if (f.bounces >= 2 && !f.taken) {
      f.taken = true;
      invAdd(f.kind); AudioSys.sfx('pickup');
      burst(f.x, f.y - 10, '#FFE14C', 8);
      toast(`${ITEMS[f.kind].em} ${ITEMS[f.kind].n}! (have ${invCount(f.kind)})`);
      updateHUD();
    }
  });
  fallingFruit = fallingFruit.filter(f => f.life > 0);
  // decorative fireflies (home jungle at night)
  if (isNight() && S.isle === 'home' && p.x > 4900 && p.x < 7700) {
    while (G.fireflies.length < 10) G.fireflies.push({ x: p.x + rnd(-500, 500), y: gyAt(p.x) - rnd(30, 220), ph: rnd(TAU) });
  } else if (!isNight()) G.fireflies.length = 0;
  G.fireflies.forEach(ff => {
    ff.x += Math.sin(G.t * .8 + ff.ph) * 26 * dt;
    ff.y += Math.cos(G.t * .6 + ff.ph * 2) * 20 * dt;
  });
  // weather
  const w = G.weather;
  w.next -= dt;
  if (w.next <= 0) { w.target = w.target > 0 ? 0 : (Math.random() < .25 && S.mq > 4 && S.isle !== 'volcano' ? 1 : 0); w.next = rnd(60, 130); }
  w.rain = lerp(w.rain, w.target, dt * .5);
  // pet follow
  updatePet(dt);
  // audio
  AudioSys.ambience('island', clamp(1.3 - p.x / 3000, .25, 1));
  const nightTrack = ['home', 'snack', 'turtle', 'lagoon'].includes(S.isle);
  const wantTrack = (isNight() && nightTrack) ? 'night' : def.music;
  const landTracks = ['island', 'night', 'snack', 'dojo', 'lagoon', 'mist', 'ember'];
  if (!G.cutscene && AudioSys.current() !== wantTrack && landTracks.includes(AudioSys.current() || 'island')) AudioSys.play(wantTrack, 2);
  findInteractLand();
  landQuestTriggers();
}
function updatePet(dt) {
  if (!S.pet.adopted || G.mode !== 'land') return;
  const pet = G.pet, p = G.p;
  const want = p.x - p.face * 74;
  const d = want - pet.x;
  if (Math.abs(d) > 600) pet.x = want; // teleport if way behind
  const spd = clamp(Math.abs(d) * 3, 0, Math.abs(p.vx) + 320);
  if (Math.abs(d) > 26) { pet.x += Math.sign(d) * spd * dt; pet.state = 'walk'; pet.face = Math.sign(d); }
  else pet.state = 'idle';
  // sniff out buried secrets
  pet.digT = Math.max(0, pet.digT - dt);
  const range = S.flags.spyglass ? 340 : 200;
  let nearSecret = false;
  TMAPS.forEach(m => {
    if (m.isle === S.isle && mapComplete(m.id) && !S.dug.includes(m.id) && Math.abs(pet.x - m.x) < range) nearSecret = true;
  });
  CHARMS.forEach(c2 => { if (c2.isle === S.isle && !S.charms.includes(c2.id) && Math.abs(pet.x - c2.x) < range * .6) nearSecret = true; });
  if (nearSecret) {
    pet.state = 'dig';
    if (pet.digT <= 0) { pet.digT = 2.2; AudioSys.sfx('bubble'); burst(pet.x + 26, gyAt(pet.x) - 6, 'rgba(242,220,168,.85)', 6, { grav: 200, speed: 90 }); }
  }
}

/* ── land draw ───────────────────────────────────────────── */
function drawLand() {
  const sky = skyAt(G.tod);
  const camX = G.cam.x, def = isleDef();
  const gr = ctx.createLinearGradient(0, 0, 0, VH * .8);
  gr.addColorStop(0, sky.top); gr.addColorStop(1, sky.bot);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  if (S.isle === 'mist') { ctx.fillStyle = `rgba(190,200,205,${S.flags.beaconLit ? .25 : .45})`; ctx.fillRect(0, 0, VW, VH); }
  if (S.isle === 'volcano') { ctx.fillStyle = 'rgba(255,120,60,.08)'; ctx.fillRect(0, 0, VW, VH); }
  // stars
  if (sky.dark > .3) {
    for (let i = 0; i < 70; i++) {
      const sx = (n1(i * 13.7) * 1.3 * VW - camX * .05) % (VW + 40), sy = n1(i * 7.1) * VH * .55;
      const tw = .5 + .5 * Math.sin(G.t * 2 + i * 2.4);
      ctx.globalAlpha = (sky.dark - .3) * 1.4 * tw;
      ctx.fillStyle = '#FFFEF0';
      ctx.fillRect((sx + VW + 40) % (VW + 40) - 20, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // sun / moon
  const dayArc = clamp((G.tod - .26) / .58, 0, 1);
  if (dayArc > 0 && dayArc < 1 && S.isle !== 'mist') {
    const sx = lerp(VW * .08, VW * .92, dayArc), sy = VH * .62 - Math.sin(dayArc * Math.PI) * VH * .48;
    glow(ctx, sx, sy, 90, rgba(255, 230, 150), .8);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, TAU); ctx.fill();
  }
  if (sky.dark > .4) {
    const na = clamp((G.tod > .5 ? G.tod - .87 : G.tod + .13) / .37, 0, 1);
    const mx = lerp(VW * .1, VW * .9, na), my = VH * .55 - Math.sin(na * Math.PI) * VH * .4;
    glow(ctx, mx, my, 70, rgba(220, 230, 255), .5);
    ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(mx, my, 26, 0, TAU); ctx.fill();
  }
  // clouds
  CLOUDS.forEach(cl => {
    const sx = cl.x - camX * .25;
    if (sx < -300 || sx > VW + 300) return;
    ctx.fillStyle = `rgba(255,255,255,${.75 - sky.dark * .5})`;
    const cy = cl.y * VH;
    ctx.beginPath();
    ctx.arc(sx, cy, 26 * cl.s, 0, TAU); ctx.arc(sx + 30 * cl.s, cy - 12 * cl.s, 22 * cl.s, 0, TAU);
    ctx.arc(sx + 62 * cl.s, cy, 25 * cl.s, 0, TAU); ctx.arc(sx + 30 * cl.s, cy + 8 * cl.s, 24 * cl.s, 0, TAU);
    ctx.fill();
  });
  // sea horizon
  const horY = VH * .52;
  const sea = ctx.createLinearGradient(0, horY, 0, VH * .8);
  const seaTint = S.isle === 'lagoon' ? '#39B8C6' : S.isle === 'volcano' ? '#2E6E90' : '#2E86B0';
  sea.addColorStop(0, hexLerp(seaTint, '#0E2A44', sky.dark));
  sea.addColorStop(1, hexLerp('#5BB8D8', '#123650', sky.dark));
  ctx.fillStyle = sea; ctx.fillRect(0, horY, VW, VH * .3);
  ctx.fillStyle = hexLerp('#5C9E8C', '#16324A', sky.dark * .9);
  const dIsle = (bx, w2, h2) => {
    const sx = bx - camX * .12;
    ctx.beginPath(); ctx.moveTo(sx - w2, horY + 2);
    ctx.quadraticCurveTo(sx, horY - h2, sx + w2, horY + 2); ctx.closePath(); ctx.fill();
  };
  dIsle(700, 160, 44); dIsle(2900, 220, 66); dIsle(6200, 130, 36); dIsle(9500, 260, 80);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const wy = horY + 30 + i * 26 + Math.sin(G.t * 1.6 + i * 2) * 4;
    ctx.beginPath();
    for (let x = 0; x <= VW; x += 24) {
      const yy = wy + Math.sin(x * .02 + G.t * 2 + i) * 3;
      x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
    }
    ctx.stroke();
  }
  drawGroundLand(camX, sky);
  drawPropsLayer(0, camX);
  (BUOYS[S.isle] || []).forEach(b => drawDiveSpot(b, camX, sky));
  // windsurf water strip
  const strip = SURF_STRIPS[S.isle];
  if (strip) {
    const x0 = strip[0] - camX, x1 = strip[1] - camX;
    if (x1 > 0 && x0 < VW) {
      const wg = ctx.createLinearGradient(0, gyAt(strip[0]) + 6, 0, gyAt(strip[0]) + 50);
      wg.addColorStop(0, 'rgba(127,216,232,.55)'); wg.addColorStop(1, 'rgba(46,134,176,.65)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(x0, gyAt(strip[0]) + 8);
      for (let x = strip[0]; x <= strip[1]; x += 40) ctx.lineTo(x - camX, gyAt(x) + 8 + Math.sin(x * .02 + G.t * 2.4) * 3);
      ctx.lineTo(x1, gyAt(strip[1]) + 48); ctx.lineTo(x0, gyAt(strip[0]) + 48);
      ctx.closePath(); ctx.fill();
    }
  }
  drawPropsLayer(1, camX);
  // fruits on trees
  (TREE_SETS[S.isle] || []).forEach(tr => {
    const sx = tr.x - camX;
    if (sx < -150 || sx > VW + 150) return;
    const bush = tr.kind === 'blueberry';
    for (let i = 0; i < tr.have; i++) {
      const fx = sx + (i ? 26 : -22) + Math.sin(G.t * 1.4 + tr.x + i) * 2 + (tr.shake ? Math.sin(G.t * 40) * 4 : 0);
      const fy = gyAt(tr.x) - (bush ? 42 : 152) + i * 10;
      oval(ctx, fx, fy, bush ? 6 : 8, tr.kind === 'banana' ? 5 : bush ? 6 : 9, FRUIT_COL[tr.kind], INK);
    }
  });
  fallingFruit.forEach(f => {
    ctx.save(); ctx.translate(f.x - camX, f.y); ctx.rotate(f.life * 3);
    oval(ctx, 0, 0, 8, f.kind === 'banana' ? 5 : 8, FRUIT_COL[f.kind], INK);
    ctx.restore();
  });
  drawLandPickups(camX);
  drawRaceGates(camX);
  drawLandNPCs(camX);
  drawPet(camX);
  drawPlayerLand(camX);
  // fireflies
  G.fireflies.forEach(ff => {
    const a = .5 + .5 * Math.sin(G.t * 4 + ff.ph * 3);
    glow(ctx, ff.x - camX, ff.y, 16, rgba(220, 255, 140), .5 * a + .2);
    ctx.fillStyle = `rgba(235,255,160,${.6 + .4 * a})`;
    ctx.beginPath(); ctx.arc(ff.x - camX, ff.y, 2.4, 0, TAU); ctx.fill();
  });
  // ember sparks on volcano
  if (S.isle === 'volcano') {
    for (let i = 0; i < 14; i++) {
      const ep = ((G.t * .12 + n1(i * 7.7)) % 1);
      const ex = (n1(i * 3.3) * 5000 - camX * .8) % (VW + 100), ey = VH * (1 - ep) - 60;
      ctx.fillStyle = `rgba(255,${140 + n1(i) * 80},60,${(1 - ep) * .5})`;
      ctx.beginPath(); ctx.arc((ex + VW + 100) % (VW + 100) - 50, ey, 2.2, 0, TAU); ctx.fill();
    }
  }
  // rain
  if (G.weather.rain > .02) {
    ctx.strokeStyle = `rgba(180,210,240,${.4 * G.weather.rain})`; ctx.lineWidth = 1.6;
    for (let i = 0; i < 60 * G.weather.rain; i++) {
      const rx = (n1(i * 3.1) * VW + G.t * 300 * (0.7 + n1(i) * .5)) % VW;
      const ry = (n1(i * 7.7) * VH + G.t * (500 + n1(i * 2) * 200)) % VH;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
    }
  }
  ctx.strokeStyle = `rgba(60,60,70,${1 - sky.dark})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  birds.forEach(b => {
    const f2 = Math.sin(G.t * 9 + b.ph) * 6;
    ctx.beginPath(); ctx.moveTo(b.x - camX - 8, b.y - f2 * .4);
    ctx.quadraticCurveTo(b.x - camX, b.y + f2, b.x - camX + 8, b.y - f2 * .4); ctx.stroke();
  });
  // fog drift on mist isle
  if (S.isle === 'mist') {
    const fogA = S.flags.beaconLit ? .18 : .4;
    for (let i = 0; i < 5; i++) {
      const fx = ((i * 500 + G.t * 22 - camX * .5) % (VW + 700)) - 350;
      const fy = VH * (.5 + n1(i * 3.7) * .35);
      const fg2 = ctx.createRadialGradient(fx, fy, 20, fx, fy, 260);
      fg2.addColorStop(0, `rgba(215,225,228,${fogA})`); fg2.addColorStop(1, 'rgba(215,225,228,0)');
      ctx.fillStyle = fg2; ctx.beginPath(); ctx.arc(fx, fy, 260, 0, TAU); ctx.fill();
    }
    // sea-cave darkness
    if (G.p.x > 3450) {
      const caveDark = clamp((G.p.x - 3450) / 300, 0, 1) * .82;
      const px = G.p.x - camX, py = gyAt(G.p.x) - 50;
      const dg = ctx.createRadialGradient(px, py, S.gear.lantern ? 150 : 70, px, py, 420);
      dg.addColorStop(0, 'rgba(6,10,18,0)'); dg.addColorStop(1, `rgba(6,10,18,${caveDark})`);
      ctx.fillStyle = dg; ctx.fillRect(0, 0, VW, VH);
      if (S.gear.lantern) glow(ctx, px + G.p.face * 26, py, 80, rgba(255, 235, 180), .25);
    }
  }
  // night dark + lights
  if (sky.dark > .02 && S.isle !== 'mist') {
    ctx.fillStyle = `rgba(10,16,50,${sky.dark * .42})`; ctx.fillRect(0, 0, VW, VH);
    if (S.isle === 'home') {
      const lx = 11150 - camX, ly = gyAt(11150) - 358;
      if (lx > -600 && lx < VW + 600) {
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.sin(G.t * .5) * .5);
        const bg = ctx.createLinearGradient(0, 0, 500, 0);
        bg.addColorStop(0, `rgba(255,240,180,${.34 * sky.dark})`); bg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(520, -70); ctx.lineTo(520, 70); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      [[POS.cafe, -60], [POS.cottage, -60], [POS.garage, -75], [POS.furnShop, -80], [POS.toyShop, -80]].forEach(([wx, wy]) => {
        glow(ctx, wx - camX, gyAt(wx) + wy, 40, rgba(255, 220, 140), sky.dark * .5);
      });
    }
    glow(ctx, G.p.x - camX, gyAt(G.p.x) - 50, 110, rgba(255, 235, 190), sky.dark * .3);
  }
  drawSparkles(camX, 0);
  drawInteractPrompt(camX);
  drawCompassHint();
  drawRaceHUD();
}
function drawGroundLand(camX, sky) {
  const step = 22, theme = THEMES[S.isle];
  ctx.beginPath();
  ctx.moveTo(-10, VH + 10);
  for (let sx = -10; sx <= VW + step; sx += step) ctx.lineTo(sx, gyAt(sx + camX));
  ctx.lineTo(VW + 10, VH + 10); ctx.closePath();
  const gcol = theme.ground(camX + VW / 2);
  const gg = ctx.createLinearGradient(0, VH * .6, 0, VH);
  gg.addColorStop(0, hexLerp(gcol[0], '#20304A', sky.dark * .6));
  gg.addColorStop(1, hexLerp(gcol[1], '#182640', sky.dark * .6));
  ctx.fillStyle = gg; ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${.35 - sky.dark * .2})`; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let sx = -10; sx <= VW + step; sx += step) {
    const yy = gyAt(sx + camX);
    sx <= 0 ? ctx.moveTo(sx, yy) : ctx.lineTo(sx, yy);
  }
  ctx.stroke();
  // deco
  for (let i = 0; i < 40; i++) {
    const wx = Math.floor(camX / 90) * 90 + i * 90 - 400;
    const h = n1(wx * .017);
    const sx2 = wx - camX; if (sx2 < -40 || sx2 > VW + 40) continue;
    const gy = gyAt(wx) + 10 + h * 26;
    if (S.isle === 'volcano') {
      if (h > .6) { ctx.fillStyle = 'rgba(60,50,55,.7)'; ctx.beginPath(); ctx.ellipse(sx2, gy, 5, 3, 0, 0, TAU); ctx.fill(); }
    } else if (S.isle === 'mist') {
      if (h > .55) {
        ctx.strokeStyle = '#7A8A78'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx2, gy); ctx.quadraticCurveTo(sx2 + 3, gy - 8, sx2 + 5, gy - 12); ctx.stroke();
      }
    } else if (h > .5) {
      ctx.fillStyle = h > .75 ? '#FFF0F4' : '#FFD9A0';
      ctx.beginPath(); ctx.arc(sx2, gy, 3.4, Math.PI, 0); ctx.fill();
    }
  }
}
function drawPropsLayer(layer, camX) {
  propsFor(S.isle).forEach(pr => {
    if (pr.layer !== layer) return;
    const sx = pr.x - camX * pr.para;
    const halfW = pr.s.width / 4 * pr.scale;
    if (sx + halfW < -50 || sx - halfW > VW + 50) return;
    blit(ctx, pr.s, sx, gyAt(pr.x) + 2, pr.scale);
  });
}
function drawDiveSpot(b, camX, sky) {
  const sx = b.x - camX;
  if (sx < -220 || sx > VW + 220) return;
  const gy = gyAt(b.x);
  const wg = ctx.createLinearGradient(0, gy - 4, 0, gy + 60);
  wg.addColorStop(0, hexLerp('#7FD8E8', '#16324A', sky.dark * .7));
  wg.addColorStop(1, hexLerp('#2E86B0', '#0E2A44', sky.dark * .7));
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(sx, gy + 22, 95, 30, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 2; i++) {
    const rp = ((G.t * .5 + i * .5) % 1);
    ctx.strokeStyle = `rgba(255,255,255,${.4 * (1 - rp)})`;
    ctx.beginPath(); ctx.ellipse(sx, gy + 22, 20 + rp * 60, 7 + rp * 20, 0, 0, TAU); ctx.stroke();
  }
  const bob = Math.sin(G.t * 1.8 + b.x) * 3;
  ctx.save(); ctx.translate(sx + 46, gy + 14 + bob); ctx.rotate(Math.sin(G.t * 1.3 + b.x) * .1);
  oval(ctx, 0, 0, 13, 13, '#E23B4E', INK);
  ctx.fillStyle = '#FFF6E8'; ctx.beginPath(); ctx.arc(0, 0, 13, Math.PI * 1.15, Math.PI * 1.85); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  line(ctx, 0, -12, 0, -20, 3, '#8C6A4B');
  oval(ctx, 0, -22, 3.4, 3.4, '#FFE14C', INK);
  ctx.restore();
}
function drawPlayerLand(camX) {
  const p = G.p;
  const gy = gyAt(p.x);
  ctx.save();
  if (G.vehicle === 'surf') {
    ctx.translate(p.x - camX, gy + 26);
    ctx.scale(p.face, 1);
    drawSurf(ctx, G.t, p.vx * p.face);
    ctx.save(); ctx.translate(-4, -6); ctx.scale(.92, .92);
    drawLila(ctx, G.t, { face: 1, walk: 0 });
    ctx.restore();
  } else if (G.vehicle === 'bike') {
    ctx.translate(p.x - camX, gy + p.jumpY);
    ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.beginPath(); ctx.ellipse(2, 2 - p.jumpY, 26, 5, 0, 0, TAU); ctx.fill();
    ctx.scale(p.face, 1);
    if (p.jumpY < -4) ctx.rotate(Math.sin(p.spin) * .22);
    drawBike(ctx, G.t, p.vx * p.face, p.jumpY < -4);
    ctx.save(); ctx.translate(-4, -22);
    drawLila(ctx, G.t, { face: 1, ride: true });
    ctx.restore();
  } else {
    ctx.translate(p.x - camX, gy);
    ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.beginPath(); ctx.ellipse(2, 2, 20, 5, 0, 0, TAU); ctx.fill();
    drawLila(ctx, G.t, { face: p.face, walk: p.walk });
    // kite on breezy beach days
    if (S.flags.kite && !isNight() && S.isle === 'home' && p.x < 9700) {
      const kx = -p.face * 46 + Math.sin(G.t * 1.4) * 10, ky = -130 + Math.sin(G.t * 1.1) * 8;
      ctx.strokeStyle = 'rgba(120,100,80,.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-p.face * 8, -50); ctx.quadraticCurveTo(kx * .5, ky * .6, kx, ky); ctx.stroke();
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(Math.sin(G.t * 1.7) * .2 - p.face * .3);
      const cols = ['#FF6B81', '#FFB84D', '#7FE08C', '#7FD8E8'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo([14, 0, -14, 0][i], [0, 18, 0, -18][i]);
        ctx.lineTo([0, -14, 0, 14][i], [18, 0, -18, 0][i]);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
function drawPet(camX) {
  if (!S.pet.adopted || G.mode !== 'land') return;
  const pet = G.pet;
  const sx = pet.x - camX;
  if (sx < -80 || sx > VW + 80) return;
  ctx.save();
  ctx.translate(sx, gyAt(pet.x));
  ctx.fillStyle = 'rgba(40,30,20,.15)'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 4.5, 0, 0, TAU); ctx.fill();
  ctx.scale(.8, .8);
  if (pet.state === 'walk') ctx.translate(0, -Math.abs(Math.sin(G.t * 8)) * 4);
  PAINT.pusheen(ctx, G.t, { face: pet.face || 1, dig: pet.state === 'dig' });
  ctx.restore();
  if (pet.state === 'dig') {
    ctx.font = '800 13px ui-rounded, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(91,70,54,.85)';
    ctx.fillText('❕ Pusheen smells something!', sx, gyAt(pet.x) - 66 + Math.sin(G.t * 3) * 3);
  }
}
function drawInteractPrompt(camX) {
  const t = G.nearTarget;
  if (!t || G.busy) return;
  const sx = t.x - camX, sy = gyAt(t.x) - 128 + Math.sin(G.t * 3.4) * 3;
  ctx.font = '800 14px ui-rounded, sans-serif';
  const w = ctx.measureText(t.label).width + 46;
  rr(ctx, sx - w / 2, sy - 16, w, 32, 16);
  ctx.fillStyle = 'rgba(255,248,236,.95)'; ctx.fill();
  ctx.strokeStyle = '#FFB84D'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#5B4636'; ctx.textAlign = 'left';
  ctx.fillText(t.icon, sx - w / 2 + 8, sy + 5);
  ctx.fillText(t.label, sx - w / 2 + 30, sy + 5);
  ctx.beginPath(); ctx.moveTo(sx - 6, sy + 15); ctx.lineTo(sx + 6, sy + 15); ctx.lineTo(sx, sy + 24); ctx.closePath();
  ctx.fillStyle = 'rgba(255,248,236,.95)'; ctx.fill();
}

/* ── particles ───────────────────────────────────────────── */
function burst(x, y, col, n = 10, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), sp = rnd(30, opts.speed || 130);
    G.sparkles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      life: rnd(.5, 1.1), max: 1.1, col, grav: opts.grav !== undefined ? opts.grav : 160,
      r: rnd(2, opts.size || 4), star: opts.star,
    });
  }
}
function updateSparkles(dt) {
  G.sparkles.forEach(s => { s.vy += (s.grav || 0) * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; });
  G.sparkles = G.sparkles.filter(s => s.life > 0);
}
function drawSparkles(camX, camY) {
  G.sparkles.forEach(s => {
    const a = clamp(s.life / s.max, 0, 1);
    ctx.globalAlpha = a;
    if (s.star) {
      ctx.save(); ctx.translate(s.x - camX, s.y - camY); ctx.rotate(s.life * 4);
      starPath(ctx, 0, 0, s.r * 2, s.r); ctx.fillStyle = s.col; ctx.fill(); ctx.restore();
    } else {
      ctx.fillStyle = s.col;
      ctx.beginPath(); ctx.arc(s.x - camX, s.y - camY, s.r * a, 0, TAU); ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

/* ── compass hint ────────────────────────────────────────── */
function drawCompassHint() {
  if (!S.gear.compass || S.mq >= 99 || G.busy || G.race) return;
  const q = MQ[S.mq]; if (!q) return;
  const tgt = q.tgt();
  let dx = 0, dy = 0, far = false;
  if (G.mode === 'land') {
    if (tgt.sail || (tgt.isle && tgt.isle !== S.isle)) {
      dx = isleDef().dock - G.p.x; dy = 0; far = Math.abs(dx) > 240;
    } else if (tgt.isle === S.isle) {
      if (tgt.dive) {
        const b = (BUOYS[S.isle] || []).find(b2 => Math.abs(b2.x - tgt.x) < 200) || (BUOYS[S.isle] || [])[0];
        dx = (b ? b.x : tgt.x) - G.p.x;
      } else dx = tgt.x - G.p.x;
      far = Math.abs(dx) > 300;
    }
  } else if (G.mode === 'dive' && tgt.dive && G.dive) {
    if (G.dive.tgt) { dx = G.dive.tgt.x - G.p.x; dy = G.dive.tgt.y - G.p.y; far = Math.hypot(dx, dy) > 300; }
  } else if (G.mode === 'dive') {
    dx = 0; dy = -G.p.y; far = true;
  } else if (G.mode === 'sail') {
    const tx = tgt.sail ? ISLES[tgt.sail].seaX : (tgt.isle ? ISLES[tgt.isle].seaX : ISLES.home.seaX);
    dx = tx - G.p.x; dy = 0; far = Math.abs(dx) > 400;
  }
  if (!far) return;
  const px = G.p.x - G.cam.x;
  const py = G.mode === 'land' ? gyAt(G.p.x) - 130 : G.mode === 'sail' ? VH * .5 - 120 : G.p.y - G.cam.y - 70;
  const ang = Math.atan2(dy, dx);
  const pulse = .6 + .3 * Math.sin(G.t * 4);
  glow(ctx, px, py, 26, rgba(255, 220, 140), .35 * pulse);
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
  ctx.fillStyle = `rgba(255,215,120,${.75 + .2 * pulse})`;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,20,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
}
/* ============================================================
   DIVE — three seas: home waters, mermaid lagoon, ember sea
   ============================================================ */
function airMax() {
  if (S.gear.blessing) return Infinity;
  if (S.gear.tank3) return 300;
  if (S.gear.tank2) return 180;
  if (S.gear.tank1) return 110;
  return 60;
}
let UWCACHE = {};
function uwFor(mapId) {
  if (UWCACHE[mapId]) return UWCACHE[mapId];
  const M = DIVEMAPS[mapId];
  const U = { corals: [], rocks: [], jellies: [], plants: [], crystals: [], vents: [] };
  const seed = mapId === 'home' ? 0 : mapId === 'lagoon' ? 100 : 200;
  if (mapId === 'home') {
    for (let i = 0; i < 34; i++) U.corals.push({ x: 200 + n1(i * 17.3) * 5600, y: 480 + n1(i * 31.1) * 420, v: i % 5, s: .7 + n1(i * 7.7) * .9, hue: [340, 25, 265, 175, 45][i % 5] });
    for (let i = 0; i < 60; i++) U.rocks.push({ x: 100 + n1(i * 11.7) * (M.w - 200), y: 600 + n1(i * 23.9) * (M.d - 800), s: 26 + n1(i * 5.1) * 90 });
    for (let i = 0; i < 22; i++) U.crystals.push({ x: 150 + n1(i * 41.3) * (M.w - 300), y: 2350 + n1(i * 13.7) * 1150, s: 14 + n1(i * 9.1) * 30, ph: n1(i) * TAU });
    for (let i = 0; i < 18; i++) U.jellies.push({ x: 300 + n1(i * 19.1) * 5400, y: 900 + n1(i * 27.7) * 2200, ph: n1(i * 2) * TAU, sz: 16 + n1(i * 4.4) * 12, hue: 300 + n1(i * 6.6) * 60, cd: 0 });
    [[700, 700], [1500, 1100], [2450, 1500], [3300, 1050], [1900, 2100], [4100, 2300], [5000, 1900], [2800, 2800], [3600, 3200]].forEach(([x, y]) => U.plants.push({ x, y, cd: 0 }));
  } else if (mapId === 'lagoon') {
    for (let i = 0; i < 40; i++) U.corals.push({ x: 150 + n1(seed + i * 13.3) * (M.w - 300), y: 350 + n1(seed + i * 29.1) * 1000, v: i % 5, s: .8 + n1(seed + i * 7.7) * 1, hue: [340, 175, 45, 300, 190][i % 5] });
    for (let i = 0; i < 24; i++) U.rocks.push({ x: 100 + n1(seed + i * 11.7) * (M.w - 200), y: 500 + n1(seed + i * 23.9) * (M.d - 650), s: 22 + n1(seed + i * 5.1) * 60 });
    for (let i = 0; i < 6; i++) U.jellies.push({ x: 400 + n1(seed + i * 19.1) * (M.w - 800), y: 700 + n1(seed + i * 27.7) * 600, ph: n1(i * 2) * TAU, sz: 14 + n1(i * 4.4) * 8, hue: 320 + n1(i * 6.6) * 40, cd: 0 });
    [[900, 800], [2200, 1100], [3300, 700]].forEach(([x, y]) => U.plants.push({ x, y, cd: 0 }));
  } else { // ember
    for (let i = 0; i < 18; i++) U.corals.push({ x: 150 + n1(seed + i * 13.3) * (M.w - 300), y: 400 + n1(seed + i * 29.1) * 700, v: i % 5, s: .7 + n1(seed + i * 7.7) * .8, hue: [15, 35, 350, 25, 45][i % 5] });
    for (let i = 0; i < 40; i++) U.rocks.push({ x: 100 + n1(seed + i * 11.7) * (M.w - 200), y: 500 + n1(seed + i * 23.9) * (M.d - 650), s: 26 + n1(seed + i * 5.1) * 80 });
    for (let i = 0; i < 14; i++) U.crystals.push({ x: 150 + n1(seed + i * 41.3) * (M.w - 300), y: 1300 + n1(seed + i * 13.7) * 1000, s: 14 + n1(seed + i * 9.1) * 26, ph: n1(i) * TAU });
    for (let i = 0; i < 10; i++) U.jellies.push({ x: 300 + n1(seed + i * 19.1) * (M.w - 600), y: 800 + n1(seed + i * 27.7) * 1300, ph: n1(i * 2) * TAU, sz: 15 + n1(i * 4.4) * 10, hue: 10 + n1(i * 6.6) * 30, cd: 0 });
    [[600, 900], [1500, 1500], [2800, 1100], [3300, 1900]].forEach(([x, y]) => U.plants.push({ x, y, cd: 0 }));
    [[1250, 0], [2650, 0], [3350, 0]].forEach(([x]) => U.vents.push({ x, ph: rnd(TAU) }));
  }
  UWCACHE[mapId] = U;
  return U;
}
/* fixed underwater pickups per quest */
const KELP_SPOTS = [[600, 900], [1300, 1200], [2100, 800], [2900, 1150], [3600, 900]];
const QUEST_UW = {
  5: () => ({ map: 'home', x: 1150, y: 520 }),
  22: () => { const i = [0, 1, 2, 3, 4].find(i2 => !S.flags['mk' + i2]); return i === undefined ? null : { map: 'lagoon', x: KELP_SPOTS[i][0], y: KELP_SPOTS[i][1] }; },
  25: () => ({ map: 'lagoon', x: 1500, y: 1150 }),
  30: () => ({ map: 'home', x: 1150, y: 520 }),
  36: () => G.dive && G.dive.calf ? { map: 'ember', x: G.dive.calf.x, y: G.dive.calf.y } : { map: 'ember', x: 1900, y: 1500 },
  37: () => ({ map: 'home', x: 1150, y: 520 }),
  38: () => ({ map: 'ember', x: 1900, y: 2100 }),
  42: () => ({ map: 'ember', x: 1900, y: 2260 }),
};
function startDive(buoy) {
  const M = DIVEMAPS[buoy.map];
  fadeTransition(() => {
    G.mode = 'dive';
    const p = G.p;
    p.x = buoy.uwx; p.y = 140; p.vx = 0; p.vy = 0; p.face = 1;
    p.air = airMax(); p.sting = 0;
    G.vehicle = null; updateVehBtn();
    G.cam.x = clamp(p.x - VW / 2, 0, M.w - VW);
    G.cam.y = 0;
    G.dive = {
      buoy, map: buoy.map, M, fishes: [], glass: [], bub: [], glowPts: [],
      whale: buoy.map === 'home' ? { x: 1800, y: 2450, vx: 16, ph: 0 } : null,
      calf: buoy.map === 'ember' ? { x: 2400, y: 1500, vx: -20, ph: 0, fled: false } : null,
      turtle: buoy.map === 'lagoon' ? { x: 3000, y: 700, vx: -22, ph: 1 } : null,
      rescue: false, exiting: false, tgt: null,
    };
    for (let i = 0; i < (buoy.map === 'home' ? 26 : 16); i++) {
      G.dive.glass.push({ x: rnd(150, M.w - 150), y: rnd(350, M.d - 150), kind: Math.random() < .6 ? 'glass' : 'shell', taken: false, ph: rnd(TAU) });
    }
    AudioSys.sfx('splash');
    AudioSys.play('sea', 1.6);
    AudioSys.ambience('dive');
    $('airWrap').style.display = 'block';
  });
}
function exitDive(rescued) {
  if (G.dive) G.dive.exiting = true;
  const bx = G.dive ? G.dive.buoy.x : 700;
  fadeTransition(() => {
    $('airWrap').style.display = 'none';
    G.mode = 'land';
    G.p.x = bx; G.p.y = 0; G.p.vx = 0;
    G.cam.x = clamp(bx - VW / 2, 0, isleDef().w - VW);
    G.dive = null;
    AudioSys.sfx('splash');
    AudioSys.setDepth(0);
    AudioSys.play(isNight() ? 'night' : isleDef().music, 1.6);
    AudioSys.ambience('island');
    if (rescued) setTimeout(() => toast('Whew! The bubbles carried you up! 🫧'), 400);
    else onSurfaced();
  });
}
function bandOf(y) { return y < 800 ? 0 : y < 2000 ? 1 : 2; }
function spawnFish() {
  const d = G.dive, p = G.p, M = d.M;
  if (d.fishes.length >= 15) return;
  const yy = clamp(p.y + rnd(-350, 350), 100, M.d - 100);
  const band = d.map === 'lagoon' ? 0 : bandOf(yy);
  let pool = FISH.filter(f => !f.sight && (f.map === d.map || f.map === 'any') && (d.map === 'lagoon' ? true : f.band === band));
  if (d.map === 'ember') pool = pool.concat(FISH.filter(f => f.map === 'home' && f.band === band && !f.sight && Math.random() < .3));
  if (d.map === 'lagoon') pool = pool.concat(FISH.filter(f => f.map === 'home' && f.band === 0 && !f.sight));
  pool = pool.filter(f => f.id !== 'sardine' || S.mq >= 13);
  if (!pool.length) return;
  let def = pick(pool);
  if (def.rare === 2 && Math.random() > .25) def = pick(pool.filter(f => f.rare < 2)) || def;
  const side = Math.random() < .5 ? -1 : 1;
  d.fishes.push({
    def, x: clamp(p.x + side * (VW / 2 + rnd(60, 300)), 40, M.w - 40),
    y: clamp(yy, 100, M.d - 80),
    vx: rnd(-1, 1) < 0 ? -def.spd : def.spd, vy: 0, ph: rnd(TAU), flee: 0,
  });
}
function updateDive(dt) {
  const p = G.p, d = G.dive;
  if (!d) return;
  const M = d.M;
  d.glowPts.length = 0;
  if (!G.busy && !d.rescue) {
    let ix = axisX(), iy = axisY();
    if (ptr.down && ix === 0 && iy === 0) {
      const px = p.x - G.cam.x, py = p.y - G.cam.y;
      const dx = ptr.x - px, dy = ptr.y - py;
      const m = Math.hypot(dx, dy);
      if (m > 30) { ix = dx / m; iy = dy / m; }
    }
    const m2 = Math.hypot(ix, iy) || 1;
    const spd = 195 * (S.gear.flippers ? 1.5 : 1) * (S.outfit.hat === 'hb_blue' ? 1.12 : 1) * (p.dash > 0 ? 2.4 : 1);
    p.vx = lerp(p.vx, ix / m2 * spd, dt * 4);
    p.vy = lerp(p.vy, iy / m2 * spd - 10, dt * 4);
    p.dash = Math.max(0, p.dash - dt);
  } else { p.vx = lerp(p.vx, 0, dt * 3); p.vy = lerp(p.vy, -6, dt * 3); }
  if (d.rescue) { p.vy = -560; p.vx = 0; }
  // thermal vents push you up
  const U = uwFor(d.map);
  if (!G.busy) U.vents.forEach(v => {
    if (Math.abs(p.x - v.x) < 70 && p.y < M.d - 60) p.vy -= 320 * dt * clamp(1 - Math.abs(p.x - v.x) / 70, 0, 1);
  });
  p.x = clamp(p.x + p.vx * dt, 30, M.w - 30);
  p.y = clamp(p.y + p.vy * dt, 26, M.d - 40);
  if (Math.abs(p.vx) > 12) p.face = Math.sign(p.vx);
  p.depth = p.y;
  G.cam.x = lerp(G.cam.x, clamp(p.x - VW / 2, 0, M.w - VW), 1 - Math.pow(.002, dt));
  G.cam.y = lerp(G.cam.y, clamp(p.y - VH / 2, 0, M.d - VH), 1 - Math.pow(.002, dt));
  if (p.y <= 34 && p.vy < -20 && !d.exiting && !G.busy) { exitDive(d.rescue); return; }
  if (S.gear.blessing) p.air = Infinity;
  else if (!d.rescue) {
    p.air -= dt;
    if (p.air <= 0) { d.rescue = true; AudioSys.sfx('splash'); burst(p.x, p.y, 'rgba(200,240,255,.9)', 24, { grav: -300 }); }
  }
  p.sting = Math.max(0, p.sting - dt);
  if (Math.random() < dt * 3) d.bub.push({ x: p.x + p.face * 16, y: p.y - 46, r: rnd(2, 5), vy: rnd(-60, -30), wob: rnd(TAU), life: rnd(1.5, 3) });
  d.bub.forEach(b => { b.y += b.vy * dt; b.x += Math.sin(G.t * 3 + b.wob) * 18 * dt; b.life -= dt; });
  d.bub = d.bub.filter(b => b.life > 0 && b.y > 20);
  if (Math.random() < dt * 3) spawnFish();
  d.fishes.forEach(f => {
    const F = f.def;
    f.flee = Math.max(0, f.flee - dt);
    if (dist(p.x, p.y, f.x, f.y) < 110 && f.flee <= 0 && Math.random() < dt * 2) {
      f.flee = 1.2; f.vx = Math.sign(f.x - p.x) * F.spd * 2.2; f.vy = rnd(-30, 30);
    }
    if (f.flee <= 0) {
      if (Math.random() < dt * .3) f.vx = (Math.random() < .5 ? -1 : 1) * F.spd * rnd(.6, 1.2);
      f.vy = Math.sin(G.t * 1.2 + f.ph) * 18;
    }
    f.x += f.vx * dt; f.y += f.vy * dt;
    f.y = clamp(f.y, 100, M.d - 80);
    if (f.x < 30) { f.x = 30; f.vx = Math.abs(f.vx); }
    if (f.x > M.w - 30) { f.x = M.w - 30; f.vx = -Math.abs(f.vx); }
  });
  d.fishes = d.fishes.filter(f => Math.abs(f.x - p.x) < VW * 1.6 && Math.abs(f.y - p.y) < VH * 1.8);
  // giants
  const giant = (g, name, ymid, yamp, x0, x1) => {
    if (!g) return;
    g.x += g.vx * dt; g.ph += dt;
    if (g.x > x1) g.vx = -Math.abs(g.vx);
    if (g.x < x0) g.vx = Math.abs(g.vx);
    g.y = ymid + Math.sin(g.ph * .3) * yamp;
    if (!S.seen[name] && dist(p.x, p.y, g.x, g.y) < 400) {
      S.seen[name] = true; markSave();
      AudioSys.sfx('yay');
      toast(`✨ You met the ${fishById(name).n}! Added to your journal!`);
      burst(g.x, g.y, 'rgba(155,232,255,.9)', 26, { grav: -20, star: true, size: 6 });
    }
  };
  giant(d.whale, 'whale', 2450, 180, 1200, 4600);
  giant(d.turtle, 'seaturtle', 750, 150, 800, 3600);
  if (d.calf && !d.calf.fled) giant(d.calf, 'calf', 1500, 200, 1000, 3000);
  // jellies
  U.jellies.forEach(j => {
    j.cd = Math.max(0, j.cd - dt);
    const jy = j.y + Math.sin(G.t * .7 + j.ph) * 60;
    const jx = j.x + Math.sin(G.t * .4 + j.ph * 2) * 40;
    if (!G.busy && p.sting <= 0 && j.cd <= 0 && dist(p.x, p.y, jx, jy) < j.sz + 26) {
      p.sting = 1.2; j.cd = 2;
      if (!S.gear.blessing) p.air = Math.max(2, p.air - (S.gear.wetsuit ? 4 : 8));
      p.vx = Math.sign(p.x - jx) * 300; p.vy = Math.sign(p.y - jy) * 220;
      AudioSys.sfx('sting');
      G.shakeT = .3; G.shakeAmp = 6;
    }
  });
  U.plants.forEach(pl => {
    pl.cd = Math.max(0, pl.cd - dt);
    if (pl.cd <= 0 && dist(p.x, p.y, pl.x, pl.y - 40) < 70 && p.air < airMax() - 5 && !S.gear.blessing) {
      pl.cd = 14;
      p.air = Math.min(airMax(), p.air + 30);
      AudioSys.sfx('bubble'); AudioSys.sfx('pickup');
      burst(pl.x, pl.y - 50, 'rgba(180,240,255,.9)', 14, { grav: -220 });
      toast('🫧 Air bubbles! +30');
    }
  });
  d.glass.forEach(gl => {
    if (gl.taken) return;
    if (dist(p.x, p.y, gl.x, gl.y) < 46) {
      gl.taken = true;
      addShells(gl.kind === 'shell' ? 3 : 2);
      AudioSys.sfx('shellS');
      burst(gl.x, gl.y, gl.kind === 'shell' ? '#FFD9A0' : '#9BE8FF', 8, { grav: -60 });
    }
  });
  // moon kelp (lagoon quest)
  if (d.map === 'lagoon' && S.mq >= 22) {
    KELP_SPOTS.forEach(([kx, ky], i) => {
      if (S.flags['mk' + i]) return;
      if (dist(p.x, p.y, kx, ky) < 52) {
        S.flags['mk' + i] = true; invAdd('moonkelp'); markSave();
        AudioSys.sfx('pickup');
        burst(kx, ky, 'rgba(180,255,220,.9)', 12, { grav: -60 });
        toast(`🌿 Moon kelp! (${invCount('moonkelp')}/5)`);
        updateHUD();
      }
    });
  }
  AudioSys.setDepth(clamp(p.y / (M.d * .72), .12, 1));
  const wantT = (d.map === 'home' && p.y > 2000) || (d.map === 'ember' && p.y > 1400) ? 'deep' : 'sea';
  if (!G.cutscene && AudioSys.current() !== wantT && ['sea', 'deep'].includes(AudioSys.current() || 'sea')) AudioSys.play(wantT, 2.5);
  // compass target
  const qw = QUEST_UW[S.mq];
  d.tgt = qw ? (() => { const t2 = qw(); return t2 && t2.map === d.map ? t2 : null; })() : null;
  findInteractDive();
  diveQuestTriggers();
}
function findInteractDive() {
  const p = G.p, d = G.dive, cands = [];
  if (G.busy || d.rescue) { G.nearTarget = null; return; }
  const D = (x, y) => dist(p.x, p.y, x, y);
  if (d.map === 'home') {
    if (S.mq >= 3 && D(1150, 520) < 110) cands.push({ x: 1150, y: 520, icon: '💬', label: 'Queen Nerissa', act: () => talkTo('queen') });
    if (D(4200, 1820) < 100) cands.push({ x: 4200, y: 1820, icon: '💬', label: 'Maestro Inky', act: () => talkTo('inky') });
  }
  if (d.map === 'lagoon') {
    if (S.mq >= 21 && D(1500, 1100) < 100 && S.mq !== 25) cands.push({ x: 1500, y: 1100, icon: '💬', label: 'Marina', act: () => talkTo('marina') });
    if (S.mq >= 22 && !S.mapPieces.includes('m2a') && D(3400, 1250) < 80) {
      cands.push({ x: 3400, y: 1250, icon: '🗺️', label: 'Open the chest!', act: () => { gainMapPiece('m2a'); } });
    }
  }
  if (d.map === 'ember') {
    if (S.mq === 38 && !S.frags[2] && D(1900, 2100) < 95) cands.push({ x: 1900, y: 2100, icon: '✨', label: 'Take the fragment!', act: () => gainFragment(2) });
    if (S.mq === 42 && D(1900, 2260) < 130) cands.push({ x: 1900, y: 2260, icon: '🌕', label: 'The Moon Pearl…', act: () => moonPearlScene() });
  }
  const range = S.gear.net ? 120 : 78;
  let bestF = null, bd = 1e9;
  d.fishes.forEach(f => {
    if (f.def.sight) return;
    const dd = D(f.x, f.y);
    if (dd < range && dd < bd) { bd = dd; bestF = f; }
  });
  if (bestF) cands.push({ x: bestF.x, y: bestF.y, icon: '🥍', label: `Catch ${bestF.def.n.split(' ').pop()}!`, act: () => catchFish(bestF) });
  cands.sort((a, b) => D(a.x, a.y) - D(b.x, b.y));
  G.nearTarget = cands[0] || null;
}
function catchFish(f) {
  G.dive.fishes = G.dive.fishes.filter(x => x !== f);
  G.p.dash = .22;
  const isNew = !S.seen[f.def.id];
  S.seen[f.def.id] = true;
  invAdd(f.def.id);
  S.fish[f.def.id] = (S.fish[f.def.id] || 0) + 1;
  markSave();
  AudioSys.sfx('catchS');
  burst(f.x, f.y, '#FFE9C9', 12, { grav: -40 });
  toast(isNew ? `✨ NEW! ${f.def.n} added to your journal!` : `${f.def.n} caught! (have ${invCount(f.def.id)})`);
  if (isNew) AudioSys.sfx('ding');
  checkFishMilestones();
}
/* ── dive drawing ────────────────────────────────────────── */
function coralSpr(v, hue) {
  return spr('coral' + v + '_' + hue, 140, 110, c => {
    c.lineCap = 'round';
    if (v === 0) {
      c.strokeStyle = `hsl(${hue},70%,62%)`;
      const br = (x0, y0, a, len, w2, d2) => {
        if (d2 > 3 || len < 8) return;
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
        c.lineWidth = w2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        br(x1, y1, a - .5 - n1(x1) * .3, len * .7, w2 * .7, d2 + 1);
        br(x1, y1, a + .5 + n1(y1) * .3, len * .7, w2 * .7, d2 + 1);
      };
      br(0, 0, -Math.PI / 2, 38, 10, 0);
    } else if (v === 1) {
      c.fillStyle = `hsl(${hue},60%,68%)`;
      c.beginPath(); c.arc(0, -6, 34, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = `hsl(${hue},55%,52%)`; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, -6, 28 - i * 7, Math.PI * 1.1, -.1 * Math.PI); c.stroke(); }
    } else if (v === 2) {
      for (let i = 0; i < 5; i++) {
        c.fillStyle = `hsl(${hue + i * 8},65%,${58 + i * 4}%)`;
        const h = 30 + n1(i * 3.3) * 40;
        rr(c, -30 + i * 13, -h, 10, h, 5); c.fill();
      }
    } else if (v === 3) {
      c.fillStyle = `hsla(${hue},70%,65%,.85)`;
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(-46, -40, -20, -66);
      c.quadraticCurveTo(0, -80, 20, -66);
      c.quadraticCurveTo(46, -40, 0, 0);
      c.fill();
      c.strokeStyle = `hsl(${hue},60%,50%)`; c.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(i * 16, -40, i * 12, -64); c.stroke(); }
    } else {
      c.strokeStyle = `hsl(${hue},75%,70%)`; c.lineWidth = 5;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        c.beginPath(); c.moveTo(0, 0);
        c.quadraticCurveTo(Math.cos(a) * 20, -24, Math.cos(a) * 30, -34 - n1(i) * 10);
        c.stroke();
      }
    }
  });
}
function drawDive() {
  const p = G.p, d = G.dive, camX = G.cam.x, camY = G.cam.y;
  if (!d) return;
  const M = d.M, U = uwFor(d.map);
  const depth01 = clamp(camY / (M.d - VH || 1), 0, 1);
  const PALS = {
    home: [['#4FC3E8', '#2E86B0'], ['#2E86B0', '#154C74'], ['#154C74', '#0A2A4A'], ['#0A2A4A', '#050E20']],
    lagoon: [['#6FE0E8', '#39B8C6'], ['#4FC8D6', '#2E98B0'], ['#2E98B0', '#1E7890'], ['#1E7890', '#155C74']],
    ember: [['#4FA8C8', '#2E7090'], ['#2E7090', '#3A4A6A'], ['#3A4A6A', '#42304A'], ['#42304A', '#301820']],
  };
  const cols = PALS[d.map];
  const seg = depth01 * 2.6;
  const i0 = Math.min(2, Math.floor(seg)), tt = clamp(seg - i0, 0, 1);
  const wg = ctx.createLinearGradient(0, 0, 0, VH);
  wg.addColorStop(0, hexLerp(cols[i0][0], cols[i0 + 1][0], tt));
  wg.addColorStop(1, hexLerp(cols[i0][1], cols[i0 + 1][1], tt));
  ctx.fillStyle = wg; ctx.fillRect(0, 0, VW, VH);
  if (camY < 130) {
    const sy = -camY;
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.moveTo(0, sy);
    for (let x = 0; x <= VW; x += 18) ctx.lineTo(x, sy + 6 + Math.sin(x * .03 + G.t * 2.4) * 5);
    ctx.lineTo(VW, sy - 40); ctx.lineTo(0, sy - 40); ctx.closePath(); ctx.fill();
  }
  if (camY < 900) {
    const rayA = clamp(1 - camY / 900, 0, 1) * (d.map === 'lagoon' ? .22 : .16);
    for (let i = 0; i < 5; i++) {
      const rx = ((i * 320 + 100 - camX * .5) % (VW + 500)) - 250 + Math.sin(G.t * .3 + i) * 40;
      ctx.save(); ctx.translate(rx, -camY - 20); ctx.rotate(.24 + Math.sin(G.t * .2 + i * 2) * .05);
      const rg = ctx.createLinearGradient(0, 0, 0, VH * 1.2);
      rg.addColorStop(0, `rgba(255,250,220,${rayA})`); rg.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(120, 0); ctx.lineTo(240, VH * 1.25); ctx.lineTo(60, VH * 1.25); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.fillStyle = 'rgba(220,245,255,.35)';
  for (let i = 0; i < 40; i++) {
    const px2 = (n1(i * 3.7) * M.w - camX * .7) % VW, py2 = (n1(i * 9.3) * M.d - camY * .7 + G.t * 6) % VH;
    ctx.globalAlpha = .15 + .2 * Math.sin(G.t + i);
    ctx.beginPath(); ctx.arc((px2 + VW) % VW, (py2 + VH) % VH, 1.6, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const V = (x, y) => x - camX > -200 && x - camX < VW + 200 && y - camY > -240 && y - camY < VH + 240;
  if (camY > M.d - VH - 200) {
    ctx.fillStyle = d.map === 'ember' ? '#2A1A22' : '#1A2A48';
    ctx.beginPath(); ctx.moveTo(0, VH + 10);
    for (let x = 0; x <= VW + 20; x += 30) ctx.lineTo(x, M.d - 60 - camY - n1((x + camX) * .01) * 40);
    ctx.lineTo(VW + 10, VH + 10); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = d.map === 'ember' ? 'rgba(70,45,60,.7)' : 'rgba(40,60,95,.65)';
  U.rocks.forEach(r => {
    if (!V(r.x, r.y)) return;
    ctx.beginPath();
    ctx.ellipse(r.x - camX, r.y - camY, r.s, r.s * .62, n1(r.x) * .6 - .3, 0, TAU); ctx.fill();
  });
  U.corals.forEach(co => {
    if (!V(co.x, co.y)) return;
    blit(ctx, coralSpr(co.v, co.hue), co.x - camX, co.y - camY, co.s);
  });
  U.crystals.forEach(cr => {
    if (!V(cr.x, cr.y)) return;
    const a = .5 + .3 * Math.sin(G.t * 1.6 + cr.ph);
    const col = d.map === 'ember' ? rgba(255, 160, 100) : rgba(155, 200, 255);
    glow(ctx, cr.x - camX, cr.y - camY, cr.s * 3, col, .2 * a);
    ctx.save(); ctx.translate(cr.x - camX, cr.y - camY); ctx.rotate(cr.ph);
    ctx.fillStyle = d.map === 'ember' ? `rgba(255,150,90,${.5 + .2 * a})` : `rgba(140,190,255,${.5 + .2 * a})`;
    ctx.beginPath(); ctx.moveTo(0, -cr.s); ctx.lineTo(cr.s * .5, 0); ctx.lineTo(0, cr.s); ctx.lineTo(-cr.s * .5, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,255,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
    d.glowPts.push([cr.x, cr.y, cr.s * 3, d.map === 'ember' ? 'rgba(255,150,90,' : 'rgba(140,190,255,']);
  });
  // vents
  U.vents.forEach(v => {
    const sx = v.x - camX;
    if (sx < -120 || sx > VW + 120) return;
    const baseY = M.d - 70 - camY;
    ctx.fillStyle = 'rgba(90,60,70,.9)';
    ctx.beginPath(); ctx.moveTo(sx - 46, baseY + 20); ctx.lineTo(sx - 14, baseY - 40); ctx.lineTo(sx + 14, baseY - 40); ctx.lineTo(sx + 46, baseY + 20); ctx.closePath(); ctx.fill();
    glow(ctx, sx, baseY - 40, 60, rgba(255, 150, 80), .3 + .1 * Math.sin(G.t * 4 + v.ph));
    for (let i = 0; i < 6; i++) {
      const bp = ((G.t * .35 + i * .17 + v.ph) % 1);
      const by = baseY - 50 - bp * (M.d - 160);
      if (by < -40 || by > VH + 40) continue;
      ctx.strokeStyle = `rgba(255,220,200,${.5 * (1 - bp)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx + Math.sin(bp * 14 + i) * 22, by, 5 + bp * 8, 0, TAU); ctx.stroke();
    }
    d.glowPts.push([v.x, M.d - 110, 90, 'rgba(255,150,80,']);
  });
  U.plants.forEach(pl => {
    if (!V(pl.x, pl.y)) return;
    const sx = pl.x - camX, sy = pl.y - camY;
    ctx.strokeStyle = '#3E9E7C'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(sx + i * 8, sy);
      ctx.quadraticCurveTo(sx + i * 14 + Math.sin(G.t * 1.5 + i) * 6, sy - 30, sx + i * 10 + Math.sin(G.t * 1.2 + i * 2) * 9, sy - 58);
      ctx.stroke();
    }
    if (pl.cd <= 0) {
      for (let i = 0; i < 3; i++) {
        const bp = (G.t * .4 + i * .33) % 1;
        ctx.strokeStyle = `rgba(200,240,255,${.7 * (1 - bp)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx + Math.sin(bp * 9) * 8, sy - 60 - bp * 70, 4 + bp * 5, 0, TAU); ctx.stroke();
      }
      d.glowPts.push([pl.x, pl.y - 80, 70, 'rgba(160,230,255,']);
    }
  });
  // moon kelp spots
  if (d.map === 'lagoon' && S.mq >= 22) {
    KELP_SPOTS.forEach(([kx, ky], i) => {
      if (S.flags['mk' + i] || !V(kx, ky)) return;
      const sx = kx - camX, sy = ky - camY;
      glow(ctx, sx, sy - 20, 40, rgba(180, 255, 220), .4 + .15 * Math.sin(G.t * 3 + i));
      ctx.strokeStyle = '#7FE0B0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(sx + k * 7, sy);
        ctx.quadraticCurveTo(sx + k * 13 + Math.sin(G.t * 1.8 + k) * 5, sy - 26, sx + k * 9, sy - 46);
        ctx.stroke();
      }
      oval(ctx, sx, sy - 50, 6, 6, '#D8FFE8', '#7FE0B0');
      d.glowPts.push([kx, ky - 20, 46, 'rgba(180,255,220,']);
    });
  }
  // lagoon chest
  if (d.map === 'lagoon' && S.mq >= 22 && !S.mapPieces.includes('m2a') && V(3400, 1250)) {
    const sx = 3400 - camX, sy = 1250 - camY;
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = '#8C5A33'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    rr(ctx, -30, -20, 60, 34, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#A6743F';
    ctx.beginPath(); ctx.moveTo(-32, -18); ctx.quadraticCurveTo(0, -44, 32, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFD24C'; rr(ctx, -6, -22, 12, 16, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    d.glowPts.push([3400, 1250, 50, 'rgba(255,215,120,']);
  }
  // fragment 3
  if (d.map === 'ember' && S.mq >= 38 && !S.frags[2] && V(1900, 2100)) {
    drawPearl(ctx, 1900 - camX, 2100 - camY + Math.sin(G.t * 2) * 5, 11, G.t);
    d.glowPts.push([1900, 2100, 70, 'rgba(255,230,250,']);
  }
  // moon pearl chamber glow
  if (d.map === 'ember' && S.mq >= 42 && V(1900, 2280)) {
    glow(ctx, 1900 - camX, 2280 - camY, 200, rgba(220, 230, 255), .35 + .1 * Math.sin(G.t * 2));
    drawPearl(ctx, 1900 - camX, 2280 - camY, 26, G.t);
    d.glowPts.push([1900, 2280, 220, 'rgba(220,230,255,']);
  }
  d.glass.forEach(gl => {
    if (gl.taken || !V(gl.x, gl.y)) return;
    const sx = gl.x - camX, sy = gl.y - camY + Math.sin(G.t * 2 + gl.ph) * 4;
    glow(ctx, sx, sy, 20, gl.kind === 'shell' ? rgba(255, 215, 160) : rgba(155, 232, 255), .4);
    if (gl.kind === 'shell') {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(gl.ph);
      ctx.fillStyle = '#FFD9A0'; ctx.beginPath(); ctx.arc(0, 0, 8, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#C98620'; ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 5, -7); ctx.stroke(); }
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(155,232,255,.9)';
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(gl.ph + G.t * .5);
      rr(ctx, -5, -6, 10, 12, 4); ctx.fill(); ctx.restore();
    }
    d.glowPts.push([gl.x, gl.y, 26, gl.kind === 'shell' ? 'rgba(255,215,160,' : 'rgba(155,232,255,']);
  });
  U.jellies.forEach(j => {
    const jx = j.x + Math.sin(G.t * .4 + j.ph * 2) * 40, jy = j.y + Math.sin(G.t * .7 + j.ph) * 60;
    if (!V(jx, jy)) return;
    ctx.save(); ctx.translate(jx - camX, jy - camY);
    drawJelly(ctx, G.t + j.ph, j.sz, j.hue);
    ctx.restore();
    d.glowPts.push([jx, jy, j.sz * 2.6, 'rgba(255,170,225,']);
  });
  d.fishes.forEach(f => {
    if (!V(f.x, f.y)) return;
    ctx.save(); ctx.translate(f.x - camX, f.y - camY);
    ctx.scale(f.vx < 0 ? -1 : 1, 1);
    drawFishSprite(ctx, f.def, G.t, { ph: f.ph });
    ctx.restore();
    if (f.def.band === 2 || f.def.id === 'lantern' || f.def.id === 'squid' || f.def.id === 'ember') d.glowPts.push([f.x, f.y, f.def.sz * 2.6, 'rgba(155,232,255,']);
  });
  [['whale', d.whale], ['seaturtle', d.turtle], ['calf', d.calf]].forEach(([id, g]) => {
    if (!g || (id === 'calf' && g.fled) || !V(g.x, g.y)) return;
    ctx.save(); ctx.translate(g.x - camX, g.y - camY); ctx.scale(g.vx < 0 ? -1 : 1, 1);
    drawFishSprite(ctx, fishById(id), G.t, {});
    ctx.restore();
    d.glowPts.push([g.x, g.y, fishById(id).sz * 1.4, 'rgba(140,190,240,']);
    if (id !== 'seaturtle' && Math.sin(G.t * .8) > .6) {
      ctx.fillStyle = `rgba(190,230,255,${1 - (G.t % 1)})`;
      ctx.font = '20px sans-serif';
      ctx.fillText('♪', g.x - camX + (g.vx < 0 ? -1 : 1) * fishById(id).sz * .9, g.y - camY - 30 - (G.t % 1) * 40);
    }
  });
  drawDiveNPCs(camX, camY, V);
  // player
  ctx.save();
  ctx.translate(p.x - camX, p.y - camY);
  ctx.rotate(clamp(p.vy / 400, -.5, .5) * p.face);
  ctx.scale(p.face, 1);
  ctx.translate(0, 42);
  if (p.sting > .6) ctx.globalAlpha = .55 + .4 * Math.sin(G.t * 30);
  drawLila(ctx, G.t, { swim: true });
  ctx.restore();
  d.bub.forEach(b => {
    ctx.strokeStyle = `rgba(220,245,255,${clamp(b.life, 0, 1) * .8})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, b.r, 0, TAU); ctx.stroke();
  });
  // darkness
  const darkStart = d.map === 'lagoon' ? 99999 : d.map === 'ember' ? 1100 : 750;
  const dark = clamp((p.y - darkStart) / 700, 0, 1) * .92;
  if (dark > .02) {
    const lr = S.gear.lantern ? 320 : 120;
    const px = p.x - camX, py = p.y - camY;
    const dg = ctx.createRadialGradient(px, py, lr * .35, px, py, lr * 1.6);
    dg.addColorStop(0, 'rgba(4,8,26,0)');
    dg.addColorStop(1, `rgba(${d.map === 'ember' ? '20,8,14' : '4,8,26'},${dark})`);
    ctx.fillStyle = dg; ctx.fillRect(0, 0, VW, VH);
    d.glowPts.forEach(([gx, gy, gr2, col]) => {
      if (!V(gx, gy)) return;
      glow(ctx, gx - camX, gy - camY, gr2 * 1.5, col + 'AL)', .3 * dark);
    });
    if (S.gear.lantern) glow(ctx, px + p.face * 30, py - 20, 90, rgba(255, 235, 180), .25);
  }
  updateAirHUD();
  drawSparkles(camX, camY);
  drawDivePrompt(camX, camY);
  drawCompassHint();
}
function drawDivePrompt(camX, camY) {
  const t = G.nearTarget;
  if (!t || G.busy) return;
  const sx = t.x - camX, sy = (t.y || 0) - camY - 60 + Math.sin(G.t * 3.4) * 3;
  ctx.font = '800 14px ui-rounded, sans-serif';
  const w = ctx.measureText(t.label).width + 46;
  rr(ctx, sx - w / 2, sy - 16, w, 32, 16);
  ctx.fillStyle = 'rgba(255,248,236,.93)'; ctx.fill();
  ctx.strokeStyle = '#7FD8E8'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#204658'; ctx.textAlign = 'left';
  ctx.fillText(t.icon, sx - w / 2 + 8, sy + 5);
  ctx.fillText(t.label, sx - w / 2 + 30, sy + 5);
}
function drawDiveNPCs(camX, camY, V) {
  const d = G.dive;
  const draw = (id, x, y, extra = {}) => {
    if (!V(x, y)) return;
    const face = G.p.x > x ? 1 : -1;
    ctx.save(); ctx.translate(x - camX, y - camY);
    glow(ctx, 0, -30, 90, rgba(255, 220, 250), .14);
    PAINT[id](ctx, G.t, { face, talk: G.dialog && G.dialog.who === id, ...extra });
    ctx.restore();
    d.glowPts.push([x, y - 30, 110, 'rgba(255,210,250,']);
  };
  if (d.map === 'home') {
    if (S.mq >= 3) draw('queen', 1150, 520);
    draw('inky', 4200, 1820, { baton: true });
  }
  if (d.map === 'lagoon' && S.mq >= 21) draw('marina', 1500, 1100);
}
function updateAirHUD() {
  const p = G.p;
  if (S.gear.blessing) {
    $('airFill').style.width = '100%';
    $('airFill').style.background = 'linear-gradient(90deg,#C7A8FF,#FF9FD0)';
    $('airLbl').textContent = "✨ MERMAID'S BLESSING ✨";
    return;
  }
  const f = clamp(p.air / airMax(), 0, 1);
  $('airFill').style.width = (f * 100).toFixed(1) + '%';
  $('airFill').style.background = f > .35 ? 'linear-gradient(90deg,#9BE8FF,#4FC3F7)' : 'linear-gradient(90deg,#FFB84D,#FF6B6B)';
  $('airLbl').textContent = f < .3 ? '⚠️ AIR — swim up or find bubbles!' : 'AIR';
}
/* ============================================================
   SAIL — the open sea between the isles
   ============================================================ */
function startSail() {
  fadeTransition(() => {
    G.mode = 'sail';
    G.vehicle = null; updateVehBtn();
    const p = G.p;
    p.x = ISLES[S.isle].seaX; p.vx = 0; p.face = 1;
    G.cam.x = clamp(p.x - VW / 2, 0, SEA_W - VW);
    G.sailS = { crates: [], dolphins: [], t: 0 };
    for (let i = 0; i < 7; i++) {
      G.sailS.crates.push({ x: rnd(600, SEA_W - 600), taken: false, ph: rnd(TAU) });
    }
    AudioSys.play('sail', 1.5);
    AudioSys.ambience('island', 1);
  });
}
function quest9Sail() {
  S.flags.q9sailing = true; markSave();
  startSail();
  setTimeout(() => toast('⛵ Follow the silver sparkles, east across the sea!'), 1200);
}
function arriveAt(isleId) {
  fadeTransition(() => {
    S.isle = isleId; markSave();
    if (!S.visited.includes(isleId)) { S.visited.push(isleId); markSave(); }
    G.mode = 'land';
    G.p.x = ISLES[isleId].dock + 60; G.p.vx = 0;
    G.cam.x = clamp(G.p.x - VW / 2, 0, ISLES[isleId].w - VW);
    G.sailS = null;
    AudioSys.sfx('splash');
    AudioSys.play(isNight() ? 'night' : ISLES[isleId].music, 1.8);
    toast(`🏝️ ${ISLES[isleId].name}!`);
    onArrive(isleId);
  });
}
function updateSail(dt) {
  const p = G.p, ss = G.sailS;
  if (!ss) return;
  ss.t += dt;
  G.tod = (G.tod + dt / 420) % 1; S.tod = G.tod;
  if (!G.busy) {
    const ax = axisX();
    const spd = 260 * (S.flags.motor ? 1.3 : 1);
    p.vx = lerp(p.vx, ax * spd, dt * 2.2);
    p.x = clamp(p.x + p.vx * dt, 260, SEA_W - 260);
    if (ax !== 0) p.face = Math.sign(ax);
  } else p.vx = lerp(p.vx, 0, dt * 2);
  G.cam.x = lerp(G.cam.x, clamp(p.x - VW / 2, 0, SEA_W - VW), 1 - Math.pow(.002, dt));
  // dolphins
  if (ss.dolphins.length < 2 && Math.random() < dt * .2) {
    ss.dolphins.push({ x: p.x + rnd(-400, 400), ph: 0, dir: Math.random() < .5 ? -1 : 1 });
  }
  ss.dolphins.forEach(dl => { dl.ph += dt * .7; dl.x += dl.dir * 60 * dt; });
  ss.dolphins = ss.dolphins.filter(dl => dl.ph < 6);
  // crates
  ss.crates.forEach(cr => {
    if (cr.taken) return;
    if (Math.abs(p.x - cr.x) < 70) {
      cr.taken = true;
      AudioSys.sfx('pickup');
      const roll = Math.random();
      if (roll < .5) { const n = irnd(3, 8); addShells(n); toast(`📦 Drifting crate: +${n} shells!`); }
      else if (roll < .75) { invAdd('coconut'); toast('📦 Drifting crate: a coconut! 🥥'); }
      else { invAdd('flour'); toast('📦 Drifting crate: a bag of flour! 🌾'); }
      burst(cr.x, 0, '#FFE9C9', 10, { grav: 60 });
    }
  });
  // quest 9: the silver trail
  if (S.mq === 9 && !S.flags.q9done && p.x > 2400) {
    S.flags.q9done = true; markSave();
    dsay([
      { who: 'lila', text: 'The sparkles… they go on and ON! Whole new islands, hiding out in the silver mist!' },
      { who: 'lila', text: 'Okay, little boat. We have a WHOLE SEA to explore. Snack Cove first — I can smell donuts from here!' },
    ], () => {
      chapterCardShow(3, 'Snack Cove', () => advanceQuest(10, true) || toast(`📜 ${MQ[10].t}`));
    });
  }
  AudioSys.ambience('island', 1);
  // arrival prompts
  G.nearTarget = null;
  if (!G.busy) {
    for (const [id, def] of Object.entries(ISLES)) {
      if (Math.abs(p.x - def.seaX) < 170 && isleUnlocked(id)) {
        G.nearTarget = { x: def.seaX, icon: '🏝️', label: `Go ashore: ${def.name}`, act: () => arriveAt(id) };
        break;
      }
    }
  }
}
function drawSail() {
  const sky = skyAt(G.tod);
  const camX = G.cam.x, p = G.p;
  const gr = ctx.createLinearGradient(0, 0, 0, VH * .55);
  gr.addColorStop(0, sky.top); gr.addColorStop(1, sky.bot);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  // sun/moon simple
  const dayArc = clamp((G.tod - .26) / .58, 0, 1);
  if (dayArc > 0 && dayArc < 1) {
    const sx = lerp(VW * .1, VW * .9, dayArc), sy = VH * .5 - Math.sin(dayArc * Math.PI) * VH * .38;
    glow(ctx, sx, sy, 90, rgba(255, 230, 150), .8);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, TAU); ctx.fill();
  }
  if (sky.dark > .3) {
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = (sky.dark - .3) * (.5 + .5 * Math.sin(G.t * 2 + i * 2.4));
      ctx.fillStyle = '#FFFEF0';
      ctx.fillRect((n1(i * 13.7) * VW * 1.3 - camX * .04) % VW, n1(i * 7.1) * VH * .4, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // clouds
  for (let i = 0; i < 7; i++) {
    const cxx = ((i * 700 + G.t * 14 - camX * .2) % (SEA_W * .3 + VW)) - 200;
    const cy = VH * (.08 + n1(i * 3.3) * .2);
    ctx.fillStyle = `rgba(255,255,255,${.7 - sky.dark * .4})`;
    ctx.beginPath(); ctx.arc(cxx, cy, 24, 0, TAU); ctx.arc(cxx + 28, cy - 10, 19, 0, TAU); ctx.arc(cxx + 56, cy, 22, 0, TAU); ctx.fill();
  }
  // islands on the horizon
  const horY = VH * .55;
  Object.entries(ISLES).forEach(([id, def]) => {
    const sx = def.seaX - camX;
    if (sx < -500 || sx > VW + 500) return;
    const unlocked = isleUnlocked(id);
    ctx.fillStyle = unlocked ? hexLerp('#4E9E7C', '#16324A', sky.dark * .8) : 'rgba(120,140,150,.55)';
    ctx.beginPath();
    ctx.moveTo(sx - 260, horY + 4);
    if (id === 'volcano') { ctx.lineTo(sx - 60, horY - 190); ctx.lineTo(sx - 10, horY - 165); ctx.lineTo(sx + 30, horY - 195); }
    else { ctx.quadraticCurveTo(sx - 90, horY - 110 - n1(def.seaX) * 40, sx + 10, horY - 90); ctx.quadraticCurveTo(sx + 120, horY - 130, sx + 180, horY - 50); }
    ctx.lineTo(sx + 260, horY + 4);
    ctx.closePath(); ctx.fill();
    if (id === 'volcano' && unlocked) glow(ctx, sx - 15, horY - 180, 50, rgba(255, 140, 80), .4);
    if (id === 'mist' && !S.flags.beaconLit) {
      ctx.fillStyle = 'rgba(210,220,222,.5)';
      ctx.beginPath(); ctx.ellipse(sx, horY - 80, 280, 90, 0, 0, TAU); ctx.fill();
    }
    // name plate
    if (Math.abs(sx - VW / 2) < 400) {
      ctx.font = '900 16px ui-rounded, sans-serif'; ctx.textAlign = 'center';
      const label = unlocked ? def.name : '???';
      const w = ctx.measureText(label).width + 30;
      rr(ctx, sx - w / 2, horY - 250, w, 30, 15);
      ctx.fillStyle = 'rgba(255,248,236,.9)'; ctx.fill();
      ctx.strokeStyle = '#FFB84D'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#5B4636';
      ctx.fillText(label, sx, horY - 229);
    }
    // dock posts
    ctx.fillStyle = '#8C6A4B';
    ctx.fillRect(sx - 6, horY - 16, 5, 22); ctx.fillRect(sx + 8, horY - 16, 5, 22);
  });
  // sea
  const sea = ctx.createLinearGradient(0, horY, 0, VH);
  sea.addColorStop(0, hexLerp('#2E86B0', '#0E2A44', sky.dark));
  sea.addColorStop(1, hexLerp('#155C84', '#0A1E33', sky.dark));
  ctx.fillStyle = sea; ctx.fillRect(0, horY, VW, VH - horY);
  for (let L = 0; L < 4; L++) {
    ctx.fillStyle = `rgba(255,255,255,${.08 + L * .05})`;
    const wy = horY + 30 + L * (VH - horY - 60) / 4;
    ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 22) {
      ctx.lineTo(x, wy + Math.sin(x * .012 + G.t * (1.2 + L * .35) + L * 2 - camX * (0.002 + L * .002)) * (6 + L * 3));
    }
    ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
  }
  // silver sparkle trail east (quest 9+)
  if (S.mq >= 9 && S.mq <= 10) {
    for (let i = 0; i < 12; i++) {
      const sxx = (p.x + 100 + ((G.t * 120 + i * 90) % 900)) - camX;
      const syy = horY + 60 + Math.sin(G.t * 2 + i) * 14;
      ctx.fillStyle = `rgba(220,235,255,${.6 - (sxx - (p.x - camX)) / 1400})`;
      starPath(ctx, sxx, syy, 4, 2); ctx.fill();
    }
  }
  // crates
  G.sailS.crates.forEach(cr => {
    if (cr.taken) return;
    const sx = cr.x - camX;
    if (sx < -60 || sx > VW + 60) return;
    const by = VH * .68 + Math.sin(G.t * 1.6 + cr.ph) * 6;
    ctx.save(); ctx.translate(sx, by); ctx.rotate(Math.sin(G.t * 1.2 + cr.ph) * .1);
    rr(ctx, -16, -14, 32, 26, 4);
    ctx.fillStyle = '#C89468'; ctx.fill(); ctx.strokeStyle = '#96683E'; ctx.lineWidth = 2.4; ctx.stroke();
    line(ctx, -16, -1, 16, -1, 2.4, '#96683E'); line(ctx, 0, -14, 0, 12, 2.4, '#96683E');
    ctx.restore();
    glow(ctx, sx, by, 30, rgba(255, 230, 170), .25 + .1 * Math.sin(G.t * 3));
  });
  // dolphins
  G.sailS.dolphins.forEach(dl => {
    const dp = dl.ph % 2;
    if (dp > 1) return;
    const dx2 = dl.x - camX, dy2 = VH * .72 - Math.sin(dp * Math.PI) * 90;
    if (dx2 < -80 || dx2 > VW + 80) return;
    ctx.save(); ctx.translate(dx2, dy2); ctx.rotate(-Math.cos(dp * Math.PI) * .8 * dl.dir);
    ctx.scale(dl.dir, 1);
    ctx.fillStyle = '#7B99C4';
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-44, -12); ctx.lineTo(-40, 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(4, -20); ctx.lineTo(10, -8); ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  // the boat
  ctx.save();
  ctx.translate(p.x - camX, VH * .75 + Math.sin(G.t * 1.5) * 6);
  ctx.scale(p.face, 1);
  drawSailboat(ctx, G.t, {});
  ctx.restore();
  // wake
  if (Math.abs(p.vx) > 40 && Math.random() < .5) {
    burst(p.x - p.face * 60, VH * .75 + 8 + G.cam.y * 0, 'rgba(220,245,255,.6)', 1, { grav: 40, speed: 50, size: 3 });
  }
  drawSparkles(camX, 0);
  // night dark
  if (sky.dark > .02) { ctx.fillStyle = `rgba(10,16,50,${sky.dark * .35})`; ctx.fillRect(0, 0, VW, VH); }
  // arrival prompt
  const t2 = G.nearTarget;
  if (t2 && !G.busy) {
    const sx = t2.x - camX;
    ctx.font = '800 15px ui-rounded, sans-serif';
    const w = ctx.measureText(t2.label).width + 48;
    const sy = VH * .38 + Math.sin(G.t * 3) * 4;
    rr(ctx, sx - w / 2, sy - 18, w, 36, 18);
    ctx.fillStyle = 'rgba(255,248,236,.95)'; ctx.fill();
    ctx.strokeStyle = '#FFB84D'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = '#5B4636'; ctx.textAlign = 'left';
    ctx.fillText(t2.icon, sx - w / 2 + 9, sy + 6);
    ctx.fillText(t2.label, sx - w / 2 + 32, sy + 6);
  }
  drawCompassHint();
}

/* ============================================================
   HOUSE — Lila's cottage
   ============================================================ */
const HOUSE_W = 1000;
const SLOT_X = [150, 260, 370, 470, 570, 670, 760, 930];
function enterHouse() {
  fadeTransition(() => {
    G.mode = 'house';
    G.vehicle = null; updateVehBtn();
    G.p.x = 120; G.p.vx = 0; G.p.face = 1;
    G.cam.x = 0;
    AudioSys.play('house', 1.6);
    AudioSys.ambience('none');
    if (!S.flags.houseSeen) {
      S.flags.houseSeen = true; markSave();
      setTimeout(() => {
        dsay([
          { who: 'lila', text: 'My very own cottage!! A bed, a window with a sea view, shelves for treasures… I LOVE IT!' },
          { who: 'lila', text: 'I can buy furniture at Purin\'s Comfy Corner, and decorate however I want. And when I\'m sleepy… that bed looks SO comfy.' },
        ], () => { if (S.mq === 3) advanceQuest(4); });
      }, 700);
    }
  });
}
function exitHouse() {
  fadeTransition(() => {
    G.mode = 'land';
    G.p.x = POS.cottage + 80;
    G.cam.x = clamp(G.p.x - VW / 2, 0, isleDef().w - VW);
    AudioSys.play(isNight() ? 'night' : 'island', 1.6);
    AudioSys.ambience('island');
  });
}
function houseFloorY() { return VH * .78; }
function updateHouse(dt) {
  const p = G.p;
  G.tod = (G.tod + dt / 420) % 1; S.tod = G.tod;
  if (!G.busy) {
    const ax = axisX();
    p.vx = ax * 260;
    p.x = clamp(p.x + p.vx * dt, 70, HOUSE_W - 50);
    p.face = ax !== 0 ? Math.sign(ax) : p.face;
    p.walk = lerp(p.walk, ax !== 0 ? 1 : 0, dt * 10);
    if (ax !== 0) { p.anim += dt; if (p.anim > .26) { p.anim = 0; AudioSys.sfx('step'); } }
  } else p.walk = lerp(p.walk, 0, dt * 10);
  G.cam.x = clamp(p.x - VW / 2, 0, Math.max(0, HOUSE_W - VW));
  // interact
  const cands = [];
  if (!G.busy) {
    if (Math.abs(p.x - 90) < 55) cands.push({ x: 90, icon: '🚪', label: 'Go outside', act: exitHouse });
    if (Math.abs(p.x - 850) < 75) cands.push({ x: 850, icon: '😴', label: 'Sleep…', act: sleepMenu });
    SLOT_X.forEach((sx, i) => {
      if (i === 7) return; // slot under the window stays open for the bed zone
      if (Math.abs(p.x - sx) < 42) {
        if (S.house[i]) cands.push({ x: sx, icon: '↔️', label: FURN[S.house[i]].n, act: () => furnitureMenu(i) });
        else if (S.ownedFurn.some(f => !Object.values(S.house).includes(f))) cands.push({ x: sx, icon: '➕', label: 'Decorate!', act: () => openPanel('decor', 'decor'), slot: i });
      }
    });
    // feed pusheen
    if (S.pet.adopted && Math.abs(p.x - 640) < 60 && invCount('treat') > 0) {
      cands.push({ x: 640, icon: '🍪', label: 'Give Pusheen a treat', act: feedPusheen });
    }
  }
  cands.sort((a, b2) => Math.abs(p.x - a.x) - Math.abs(p.x - b2.x));
  G.nearTarget = cands[0] || null;
  if (G.nearTarget && G.nearTarget.slot !== undefined) G.decorSlot = G.nearTarget.slot;
}
function sleepMenu() {
  dchoice('lila', 'The bed looks so cozy… sleep until when?', [
    { label: '🌞 Morning', cb: () => sleepScene(.34) },
    { label: '🌙 Nighttime', cb: () => sleepScene(.92) },
    { label: 'Not yet', alt: true, cb: () => {} },
  ]);
}
function furnitureMenu(slot) {
  dchoice('lila', `The ${FURN[S.house[slot]].n} — move it away?`, [
    { label: '📦 Put away', cb: () => { delete S.house[slot]; markSave(); AudioSys.sfx('tap'); } },
    { label: 'Keep it', alt: true, cb: () => {} },
  ]);
}
function feedPusheen() {
  invTake('treat', 1);
  S.pet.treats++; S.pet.hearts = Math.min(5, S.pet.hearts + 1);
  heart('pusheen'); markSave();
  AudioSys.sfx('heartS');
  burst(640, houseFloorY() - 40, '#FF9FBE', 10, { grav: -60, star: true });
  toast(pick(['Pusheen: mlem mlem mlem. 💗', 'Pusheen purrs like a tiny motorboat!', 'Pusheen is 2% rounder and 100% happier.']));
}
function sleepScene(targetTod) {
  startCutscene({
    noSkip: true,
    data: { sleep: true },
    steps: [
      { d: 1.6, sub: '', on: () => { AudioSys.sfx('write'); } },
      { d: 4.2, sub: 'Z z z …', on: () => { AudioSys.stopMusic(); } },
      { d: 1.4, sub: '', on: () => { G.tod = targetTod; S.tod = targetTod; markSave(); AudioSys.sfx('chirp'); } },
    ],
    draw: drawSleepOver,
    done: () => {
      AudioSys.play('house', 2);
      toast(targetTod < .5 ? '🌞 Good morning, sunshine!' : '🌙 The stars are out…');
      if (S.mq === 4 && !S.flags.dreamDone) {
        S.flags.dreamDone = true; markSave();
        setTimeout(() => dsay([
          { who: 'lila', text: '…I dreamed of a silver whale. It was singing my name, way down deep, under a mountain of fire…' },
          { who: 'lila', text: 'Queen Nerissa will know what it means. To the Reef Buoy!' },
        ], () => advanceQuest(5)), 600);
      }
      saveGame();
    },
  });
}
function drawSleepOver(sc) {
  const p = clamp(sc.t / 1.2, 0, 1);
  const st = sc.idx;
  // dim the room
  ctx.fillStyle = `rgba(8,10,30,${st === 0 ? p * .75 : st === 1 ? .75 : .75 * (1 - clamp(sc.t / 1.2, 0, 1))})`;
  ctx.fillRect(0, 0, VW, VH);
  // Lila tucked in
  const bx = 850 - G.cam.x, by = houseFloorY() - 44;
  ctx.save(); ctx.translate(bx, by);
  drawLilaSleeping(ctx, G.t);
  ctx.restore();
  if (st === 1) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 3; i++) {
      const zp = ((G.t * .5 + i * .33) % 1);
      ctx.globalAlpha = 1 - zp;
      ctx.font = `800 ${16 + i * 6}px ui-rounded, sans-serif`;
      ctx.fillText('Z', bx + 30 + zp * 40 + i * 14, by - 40 - zp * 60 - i * 12);
    }
    ctx.globalAlpha = 1;
  }
}
function drawHouse() {
  const camX = G.cam.x, fy = houseFloorY();
  // walls
  const wg = ctx.createLinearGradient(0, 0, 0, fy);
  wg.addColorStop(0, '#F7E8D2'); wg.addColorStop(1, '#F0D9B8');
  ctx.fillStyle = wg; ctx.fillRect(0, 0, VW, fy);
  // wainscot
  ctx.fillStyle = '#E0C39A'; ctx.fillRect(0, fy - 90, VW, 90);
  ctx.strokeStyle = '#C9A87C'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, fy - 90); ctx.lineTo(VW, fy - 90); ctx.stroke();
  // floor
  const fg = ctx.createLinearGradient(0, fy, 0, VH);
  fg.addColorStop(0, '#C89468'); fg.addColorStop(1, '#A87848');
  ctx.fillStyle = fg; ctx.fillRect(0, fy, VW, VH - fy);
  ctx.strokeStyle = 'rgba(120,86,50,.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const yy = fy + 14 + i * 18; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(VW, yy); ctx.stroke(); }
  // door
  const dx = 90 - camX;
  rr(ctx, dx - 42, fy - 170, 84, 170, 12);
  ctx.fillStyle = '#E8945C'; ctx.fill(); ctx.strokeStyle = '#B06A3C'; ctx.lineWidth = 4; ctx.stroke();
  oval(ctx, dx + 26, fy - 88, 5, 5, '#FFE14C', '#B06A3C');
  // window with live sky
  const wx = 700 - camX, wy2 = fy - 210, ww = 150, wh = 120;
  const sky = skyAt(G.tod);
  const swg = ctx.createLinearGradient(0, wy2, 0, wy2 + wh);
  swg.addColorStop(0, sky.top); swg.addColorStop(1, sky.bot);
  rr(ctx, wx - ww / 2, wy2, ww, wh, 14);
  ctx.fillStyle = swg; ctx.fill();
  // tiny sea + sun through window
  ctx.save();
  rr(ctx, wx - ww / 2, wy2, ww, wh, 14); ctx.clip();
  ctx.fillStyle = hexLerp('#2E86B0', '#0E2A44', sky.dark);
  ctx.fillRect(wx - ww / 2, wy2 + wh * .62, ww, wh);
  if (sky.dark < .35) { glow(ctx, wx + 30, wy2 + 34, 26, rgba(255, 235, 160), .8); ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(wx + 30, wy2 + 34, 11, 0, TAU); ctx.fill(); }
  else { ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(wx + 34, wy2 + 30, 9, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy2 + wh * .7); ctx.lineTo(wx + ww / 2, wy2 + wh * .7); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#B06A3C'; ctx.lineWidth = 5;
  rr(ctx, wx - ww / 2, wy2, ww, wh, 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy2); ctx.lineTo(wx, wy2 + wh); ctx.moveTo(wx - ww / 2, wy2 + wh / 2); ctx.lineTo(wx + ww / 2, wy2 + wh / 2); ctx.stroke();
  // curtains
  ctx.fillStyle = 'rgba(255,159,190,.85)';
  ctx.beginPath(); ctx.moveTo(wx - ww / 2 - 8, wy2 - 6); ctx.quadraticCurveTo(wx - ww / 2 + 16, wy2 + wh * .5, wx - ww / 2 - 4, wy2 + wh + 8); ctx.lineTo(wx - ww / 2 - 12, wy2 + wh + 8); ctx.lineTo(wx - ww / 2 - 12, wy2 - 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(wx + ww / 2 + 8, wy2 - 6); ctx.quadraticCurveTo(wx + ww / 2 - 16, wy2 + wh * .5, wx + ww / 2 + 4, wy2 + wh + 8); ctx.lineTo(wx + ww / 2 + 12, wy2 + wh + 8); ctx.lineTo(wx + ww / 2 + 12, wy2 - 6); ctx.closePath(); ctx.fill();
  // trophy shelf
  const shx = 420 - camX;
  line(ctx, shx - 130, fy - 250, shx + 130, fy - 250, 8, '#B06A3C');
  ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
  let ti = 0;
  const trophy = em => { ctx.fillText(em, shx - 110 + ti * 38, fy - 258); ti++; };
  Object.values(S.medals).forEach(m => { if (m === 3) trophy('🏆'); });
  S.dug.forEach(() => trophy('🗺️'));
  if (S.charms.length >= 12) trophy('🌈');
  S.frags.forEach(f => { if (f) trophy('🩵'); });
  if (S.flags.goldbell) trophy('🔔');
  if (S.mq >= 99) trophy('🌕');
  if (ti === 0) { ctx.font = '800 13px ui-rounded, sans-serif'; ctx.fillStyle = 'rgba(120,86,50,.6)'; ctx.fillText('(trophies will go here!)', shx, fy - 260); }
  // bed
  const bx = 850 - camX;
  rr(ctx, bx - 80, fy - 58, 160, 52, 10);
  ctx.fillStyle = '#B06A3C'; ctx.fill(); ctx.strokeStyle = '#8A4E28'; ctx.lineWidth = 3; ctx.stroke();
  rr(ctx, bx - 74, fy - 74, 148, 30, 12);
  ctx.fillStyle = '#FFF6E8'; ctx.fill(); ctx.strokeStyle = '#E0C9A0'; ctx.lineWidth = 2; ctx.stroke();
  rr(ctx, bx - 20, fy - 70, 92, 42, 10);
  ctx.fillStyle = '#FF9FBE'; ctx.fill(); ctx.strokeStyle = '#E56A93'; ctx.lineWidth = 2.4; ctx.stroke();
  oval(ctx, bx - 48, fy - 66, 22, 12, '#FFFDF6', '#E0C9A0');
  rr(ctx, bx - 88, fy - 108, 14, 102, 6); ctx.fillStyle = '#B06A3C'; ctx.fill(); ctx.strokeStyle = '#8A4E28'; ctx.stroke();
  rr(ctx, bx + 74, fy - 92, 14, 86, 6); ctx.fill(); ctx.stroke();
  // furniture in slots
  Object.entries(S.house).forEach(([slot, fid]) => {
    drawFurniture(fid, SLOT_X[slot] - camX, fy);
  });
  // pusheen snoozing on her bed
  if (S.pet.adopted) {
    const cbSlot = Object.entries(S.house).find(([, f]) => f === 'catbed');
    const px = cbSlot ? SLOT_X[cbSlot[0]] - camX : 640 - camX;
    ctx.save(); ctx.translate(px, fy - (cbSlot ? 10 : 0)); ctx.scale(.72, .72);
    PAINT.pusheen(ctx, G.t, { sleep: true });
    ctx.restore();
  }
  // player
  ctx.save();
  ctx.translate(G.p.x - camX, fy);
  ctx.fillStyle = 'rgba(40,30,20,.15)'; ctx.beginPath(); ctx.ellipse(2, 2, 20, 5, 0, 0, TAU); ctx.fill();
  drawLila(ctx, G.t, { face: G.p.face, walk: G.p.walk });
  ctx.restore();
  // night lamp glow
  const sky2 = skyAt(G.tod);
  if (sky2.dark > .1) {
    ctx.fillStyle = `rgba(20,16,60,${sky2.dark * .3})`; ctx.fillRect(0, 0, VW, VH);
    Object.entries(S.house).forEach(([slot, fid]) => {
      if (fid === 'lamp') glow(ctx, SLOT_X[slot] - camX, fy - 60, 130, rgba(255, 220, 150), .4);
    });
  }
  drawSparkles(camX, 0);
  drawInteractPromptHouse(camX);
}
function drawInteractPromptHouse(camX) {
  const t = G.nearTarget;
  if (!t || G.busy) return;
  const sx = t.x - camX, sy = houseFloorY() - 150 + Math.sin(G.t * 3.4) * 3;
  ctx.font = '800 14px ui-rounded, sans-serif';
  const w = ctx.measureText(t.label).width + 46;
  rr(ctx, sx - w / 2, sy - 16, w, 32, 16);
  ctx.fillStyle = 'rgba(255,248,236,.95)'; ctx.fill();
  ctx.strokeStyle = '#FFB84D'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#5B4636'; ctx.textAlign = 'left';
  ctx.fillText(t.icon, sx - w / 2 + 8, sy + 5);
  ctx.fillText(t.label, sx - w / 2 + 30, sy + 5);
}
function drawFurniture(fid, sx, fy) {
  ctx.save(); ctx.translate(sx, fy);
  ctx.lineJoin = 'round';
  switch (fid) {
    case 'catbed':
      oval(ctx, 0, -8, 34, 14, '#B98CE8', '#8E6BC0');
      oval(ctx, 0, -12, 26, 9, '#E8DBFF', null);
      break;
    case 'rug':
      oval(ctx, 0, 2, 52, 13, '#FFB84D', null);
      oval(ctx, 0, 2, 38, 9, '#FF8FB1', null);
      oval(ctx, 0, 2, 22, 5.5, '#FFE14C', null);
      break;
    case 'lamp':
      line(ctx, 0, -4, 0, -78, 5, '#8C6A4B');
      oval(ctx, 0, -2, 20, 5, '#8C6A4B', null);
      ctx.beginPath(); ctx.moveTo(-24, -78); ctx.lineTo(24, -78); ctx.lineTo(15, -112); ctx.lineTo(-15, -112); ctx.closePath();
      ctx.fillStyle = '#FFD9A0'; ctx.fill(); ctx.strokeStyle = '#C9A468'; ctx.lineWidth = 2.4; ctx.stroke();
      break;
    case 'plant':
      rr(ctx, -16, -30, 32, 30, 5); ctx.fillStyle = '#C0574A'; ctx.fill(); ctx.strokeStyle = '#8A3E34'; ctx.lineWidth = 2.4; ctx.stroke();
      for (let i = -2; i <= 2; i++) {
        ctx.strokeStyle = '#4FA85C'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -30);
        ctx.quadraticCurveTo(i * 18, -60, i * 26, -78 + Math.abs(i) * 8); ctx.stroke();
      }
      break;
    case 'bookshelf':
      rr(ctx, -34, -100, 68, 100, 5); ctx.fillStyle = '#B06A3C'; ctx.fill(); ctx.strokeStyle = '#8A4E28'; ctx.lineWidth = 2.6; ctx.stroke();
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        for (let b = 0; b < 5; b++) {
          ctx.fillStyle = ['#FF8FB1', '#7FD8E8', '#FFE14C', '#7FE08C', '#B9A8FF'][(b + sIdx) % 5];
          ctx.fillRect(-28 + b * 12, -92 + sIdx * 31, 9, 24);
        }
        line(ctx, -32, -64 + sIdx * 31, 32, -64 + sIdx * 31, 3, '#8A4E28');
      }
      break;
    case 'table':
      oval(ctx, 0, -46, 38, 9, '#D8A868', '#A87848');
      line(ctx, -26, -42, -30, -2, 6, '#A87848'); line(ctx, 26, -42, 30, -2, 6, '#A87848');
      oval(ctx, 0, -52, 8, 4, '#7FD8E8', '#3E8EA8');
      break;
    case 'toybox':
      rr(ctx, -32, -44, 64, 44, 7); ctx.fillStyle = '#7FD8E8'; ctx.fill(); ctx.strokeStyle = '#3E8EA8'; ctx.lineWidth = 2.6; ctx.stroke();
      oval(ctx, -12, -48, 8, 8, '#FF8FB1', INK);
      ctx.fillStyle = '#FFE14C'; starPath(ctx, 12, -48, 8, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
      break;
    case 'aquarium':
      rr(ctx, -40, -70, 80, 54, 6);
      ctx.fillStyle = 'rgba(127,216,232,.75)'; ctx.fill(); ctx.strokeStyle = '#3E8EA8'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save();
      rr(ctx, -40, -70, 80, 54, 6); ctx.clip();
      const fx = Math.sin(G.t * 1.2) * 24;
      ctx.save(); ctx.translate(fx, -44); ctx.scale(Math.cos(G.t * 1.2) < 0 ? -0.4 : .4, .4);
      drawFishSprite(ctx, fishById('clown'), G.t, {});
      ctx.restore();
      ctx.restore();
      rr(ctx, -44, -18, 88, 12, 4); ctx.fillStyle = '#B06A3C'; ctx.fill(); ctx.strokeStyle = '#8A4E28'; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'mobile':
      line(ctx, 0, -160, 0, -130, 3, '#C9A87C');
      line(ctx, -30, -130, 30, -130, 3, '#C9A87C');
      for (const [mx, ml] of [[-30, 26], [0, 36], [30, 22]]) {
        line(ctx, mx, -130, mx, -130 + ml, 1.6, '#C9A87C');
        ctx.fillStyle = ['#FFE14C', '#7FD8E8', '#FF8FB1'][Math.abs(mx) / 30 | 0];
        starPath(ctx, mx, -124 + ml, 7, 3.4); ctx.fill();
      }
      break;
    case 'poster':
      rr(ctx, -30, -150, 60, 74, 4); ctx.fillStyle = '#FFF6E8'; ctx.fill(); ctx.strokeStyle = '#C9A87C'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(0, -86); ctx.scale(.55, .55);
      PAINT.purin(ctx, 1.2, {});
      ctx.restore();
      break;
    case 'mirror':
      oval(ctx, 0, -90, 26, 36, '#D8ECF4', '#B06A3C');
      ctx.strokeStyle = '#B06A3C'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, -90, 26, 36, 0, 0, TAU); ctx.stroke();
      line(ctx, 0, -54, 0, -4, 6, '#B06A3C');
      oval(ctx, 0, -2, 18, 4.5, '#B06A3C', null);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.ellipse(-8, -100, 5, 14, .4, 0, TAU); ctx.fill();
      break;
    case 'chair':
      rr(ctx, -26, -46, 52, 40, 12); ctx.fillStyle = '#7FE08C'; ctx.fill(); ctx.strokeStyle = '#4FA85C'; ctx.lineWidth = 2.6; ctx.stroke();
      rr(ctx, -26, -84, 14, 48, 7); ctx.fill(); ctx.stroke();
      rr(ctx, -22, -18, 44, 16, 8); ctx.fillStyle = '#A8ECB2'; ctx.fill();
      break;
    case 'musicbox':
      rr(ctx, -22, -36, 44, 36, 5); ctx.fillStyle = '#E56A93'; ctx.fill(); ctx.strokeStyle = '#B94E71'; ctx.lineWidth = 2.4; ctx.stroke();
      oval(ctx, 0, -44, 5, 8, '#FFD24C', '#C99A20');
      ctx.fillStyle = `rgba(255,255,255,${.5 + .5 * Math.sin(G.t * 3)})`;
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('♪', 14, -50 - (G.t * 20 % 26));
      break;
  }
  ctx.restore();
}
/* ============================================================
   UI — dialog, toasts, panels, HUD, transitions
   ============================================================ */
function refreshBusy() {
  G.busy = !!(G.dialog || G.panel || G.cutscene || G.rhythm || G.cook || G.chapterT || G.fade);
}
/* ── dialog ──────────────────────────────────────────────── */
function dsay(seq, cb) {
  G.dialog = { seq, idx: 0, shown: 0, cb, who: seq[0].who, choices: null };
  refreshBusy();
  $('dlg').style.display = 'block';
  $('dlgChoices').innerHTML = '';
  showDlgLine();
}
function dchoice(who, text, opts) {
  dsay([{ who, text }], null);
  G.dialog.choices = opts;
}
function showDlgLine() {
  const d = G.dialog;
  const ln = d.seq[d.idx];
  d.who = ln.who; d.shown = 0;
  $('dlgName').textContent = NPCS[ln.who] ? NPCS[ln.who].n : ln.who;
  $('dlgName').style.color = (NPCS[ln.who] || {}).col ? '#E56A93' : '#E56A93';
  $('dlgText').textContent = '';
  $('dlgNext').style.visibility = 'hidden';
  drawPortrait(ln.who);
}
function updateDialog(dt) {
  const d = G.dialog;
  if (!d) return;
  const full = d.seq[d.idx].text;
  if (d.shown < full.length) {
    const prev = Math.floor(d.shown);
    d.shown = Math.min(full.length, d.shown + dt * 52);
    if (Math.floor(d.shown) !== prev) {
      $('dlgText').textContent = full.slice(0, Math.floor(d.shown));
      if (Math.floor(d.shown) % 3 === 0) AudioSys.sfx('blip');
    }
  } else {
    $('dlgNext').style.visibility = (d.choices && d.idx === d.seq.length - 1) ? 'hidden' : 'visible';
    if (d.choices && d.idx === d.seq.length - 1 && !d.choicesShown) {
      d.choicesShown = true;
      const box = $('dlgChoices');
      d.choices.forEach(o => {
        const b = document.createElement('button');
        b.className = 'chBtn' + (o.alt ? ' alt' : '');
        b.textContent = o.label;
        b.onclick = e => {
          e.stopPropagation();
          AudioSys.sfx('tap');
          closeDialog();
          if (o.cb) o.cb();
        };
        box.appendChild(b);
      });
    }
  }
  // animated portrait
  drawPortrait(d.who);
}
function advanceDialog() {
  const d = G.dialog;
  if (!d) return;
  const full = d.seq[d.idx].text;
  if (d.shown < full.length) {
    d.shown = full.length;
    $('dlgText').textContent = full;
    return;
  }
  if (d.choices && d.idx === d.seq.length - 1) return; // must pick a choice
  if (d.idx < d.seq.length - 1) {
    d.idx++;
    showDlgLine();
    AudioSys.sfx('tap');
  } else {
    const cb = d.cb;
    closeDialog();
    if (cb) cb();
  }
}
function closeDialog() {
  G.dialog = null;
  $('dlg').style.display = 'none';
  $('dlgChoices').innerHTML = '';
  refreshBusy();
}
$('dlgBox').addEventListener('click', () => advanceDialog());

/* ── toast & chapter card ────────────────────────────────── */
let toastTimer = null;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
  updateHUD();
}
function chapterCardShow(n, title, cb) {
  G.chapterT = true; refreshBusy();
  AudioSys.sfx('yay');
  const card = $('chapterCard');
  $('chapterSmall').textContent = n === 0 ? 'Prologue' : n === 99 ? 'Finale' : `Chapter ${n}`;
  $('chapterBig').textContent = title;
  card.style.display = 'flex';
  card.classList.add('show');
  setTimeout(() => {
    card.classList.remove('show');
    card.style.display = 'none';
    G.chapterT = false; refreshBusy();
    if (cb) cb();
  }, 3400);
}
/* fade to black transition */
function fadeTransition(mid, cb) {
  G.fade = { t: 0, phase: 'out', mid, cb };
  refreshBusy();
}
function updateFade(dt) {
  const f = G.fade;
  if (!f) return;
  f.t += dt * (f.phase === 'out' ? 2.4 : 1.8);
  if (f.phase === 'out' && f.t >= 1) {
    f.t = 1; f.phase = 'in';
    if (f.mid) f.mid();
  } else if (f.phase === 'in' && f.t >= 2) {
    const cb = f.cb;
    G.fade = null; refreshBusy();
    if (cb) cb();
  }
}
function drawFade() {
  if (G.fade) {
    const a = G.fade.phase === 'out' ? ease(G.fade.t) : ease(2 - G.fade.t);
    ctx.fillStyle = `rgba(4,10,24,${clamp(a, 0, 1)})`;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (G.flash > 0) {
    ctx.fillStyle = `rgba(255,250,235,${G.flash})`;
    ctx.fillRect(0, 0, VW, VH);
  }
}

/* ── HUD ─────────────────────────────────────────────────── */
function updateHUD() {
  let extra = '';
  if (S.mq >= 25) extra = `   🩵 ${S.frags.filter(Boolean).length}/3`;
  $('shellPill').textContent = `🐚 ${S.shells}${extra}`;
  $('questPill').textContent = '⭐ ' + questHint();
  updateVehBtn();
}
function updateVehBtn() {
  const b = $('btnVeh');
  if (!b) return;
  if (G.mode !== 'land' || (!S.vehicles.bike && !S.vehicles.surf)) { b.style.display = 'none'; return; }
  b.style.display = 'flex';
  b.textContent = G.vehicle === 'bike' ? '🚶' : G.vehicle === 'surf' ? '🏖️' : '🚲';
}
/* ── panels ──────────────────────────────────────────────── */
const PANEL_TABS = {
  journal: [['quests', '📜 Quests'], ['fish', '🐟 Sea Life'], ['friends', '💗 Friends'], ['coll', '⭐ Treasures']],
  shop: [], cafe: [], sell: [], settings: [], decor: [], map: [],
};
function openPanel(name, tab) {
  AudioSys.sfx('tap');
  G.panel = name;
  G.ptab = tab || (PANEL_TABS[name] && PANEL_TABS[name][0] ? PANEL_TABS[name][0][0] : name);
  refreshBusy();
  $('panelWrap').style.display = 'flex';
  renderPanel();
}
function openShop(id) {
  G.shopId = id;
  openPanel('shop');
}
function closePanel() {
  G.panel = null; refreshBusy();
  $('panelWrap').style.display = 'none';
}
$('panelClose').onclick = () => { AudioSys.sfx('tap'); closePanel(); };
$('panelWrap').addEventListener('click', e => { if (e.target === $('panelWrap')) closePanel(); });
$('btnJournal').onclick = () => { if (!G.cutscene && !G.rhythm && !G.cook && !G.train && !G.race) openPanel('journal'); };
$('btnSettings').onclick = () => { if (!G.cutscene && !G.rhythm && !G.cook && !G.train && !G.race) openPanel('settings'); };
$('btnMap').onclick = () => { if (!G.cutscene && !G.rhythm && !G.cook && !G.train && !G.race && S.mq >= 5) openPanel('map'); };
function renderPanel() {
  const name = G.panel;
  if (!name) return;
  const titles = {
    journal: "📖 Lila's Journal", cafe: '🍳 Beach Café Kitchen', sell: '🐟 Sell Fish',
    settings: '⚙️ Settings', decor: '🛋️ Decorate!', map: '🗺️ The Tide Chart',
    shop: G.shopId ? SHOPS[G.shopId].title : 'Shop',
  };
  $('panelTitle').textContent = titles[name];
  const tabs = PANEL_TABS[name] || [];
  const tbox = $('panelTabs');
  tbox.innerHTML = '';
  tbox.style.display = tabs.length ? 'flex' : 'none';
  tabs.forEach(([id, label]) => {
    const b = document.createElement('button');
    b.className = 'ptab' + (G.ptab === id ? ' on' : '');
    b.textContent = label;
    b.onclick = () => { AudioSys.sfx('tap'); G.ptab = id; renderPanel(); };
    tbox.appendChild(b);
  });
  const body = $('panelBody');
  body.innerHTML = '';
  if (name === 'journal') renderJournal(body);
  if (name === 'shop') renderShop(body);
  if (name === 'cafe') renderCafe(body);
  if (name === 'sell') renderSell(body);
  if (name === 'settings') renderSettings(body);
  if (name === 'decor') renderDecor(body);
  if (name === 'map') renderMap(body);
}
function buyRow(body, { em, n, d, canvasFish }, btnText, disabled, cb, owned) {
  const row = document.createElement('div');
  row.className = 'buyRow';
  row.innerHTML = `<div class="bi" style="font-size:32px">${em || ''}</div>
    <div class="bt"><b>${n}</b>${d ? `<small>${d}</small>` : ''}</div>`;
  const b = document.createElement('button');
  b.className = 'buyBtn' + (owned ? ' owned' : '');
  b.textContent = btnText;
  b.disabled = !!disabled;
  b.onclick = cb;
  row.appendChild(b);
  body.appendChild(row);
  return row;
}
function renderJournal(body) {
  if (G.ptab === 'quests') {
    let html = '';
    const ch = chapterOf(Math.min(S.mq, 42));
    if (S.mq >= 99) html += `<div class="card"><h4>🌕 The Moon Pearl shines!</h4><p>${POSTGAME_HINT}</p></div>`;
    else html += `<div class="card"><h4>Chapter ${ch}: ${CHAPTERS[ch].n}</h4><h4>⭐ ${MQ[S.mq].t}</h4><p>${questHint()}</p></div>`;
    html += `<div class="card"><h4>Tide-Pearl Fragments</h4><p style="font-size:24px;letter-spacing:6px">${[0,1,2].map(i => S.frags[i] ? '🩵' : '⚪').join('')}</p></div>`;
    for (let i = Math.min(S.mq, 42) - 1; i >= 1; i--) html += `<div class="card" style="opacity:.55"><h4>✅ ${MQ[i].t}</h4></div>`;
    body.innerHTML = html;
  } else if (G.ptab === 'fish') {
    const seen = FISH.filter(f => S.seen[f.id]).length;
    let html = `<p style="font-weight:800;margin:0 0 10px">Discovered: ${seen} / ${FISH.length}</p><div class="grid">`;
    FISH.forEach(f => {
      const known = S.seen[f.id];
      html += `<div class="gcell${known ? '' : ' locked'}" data-fact="${known ? f.fact.replace(/"/g, '&quot;') : ''}" data-name="${known ? f.n : '???'}">
        <div class="gi"><canvas class="fc" data-fid="${f.id}" width="120" height="90" style="width:60px;height:45px"></canvas></div>
        <div class="gn">${known ? f.n : '???'}${known && S.fish[f.id] ? `<br>×${S.fish[f.id]}` : ''}</div></div>`;
    });
    html += '</div><p id="fishFact" style="margin-top:12px;font-weight:700;min-height:36px;color:#8a6d52;font-size:14px">Tap a creature to read about it!</p>';
    body.innerHTML = html;
    body.querySelectorAll('.fc').forEach(cv => {
      const f = fishById(cv.dataset.fid);
      const c = cv.getContext('2d');
      c.setTransform(2, 0, 0, 2, 60, 22);
      const sc = Math.min(1, 24 / f.sz);
      c.scale(sc, sc);
      if (!S.seen[f.id]) c.filter = 'grayscale(1) brightness(.55)';
      drawFishSprite(c, f, 1.2, {});
    });
    body.querySelectorAll('.gcell').forEach(cell => {
      cell.onclick = () => {
        if (!cell.dataset.fact) return;
        AudioSys.sfx('blip');
        $('fishFact').textContent = `${cell.dataset.name}: ${cell.dataset.fact}`;
      };
    });
  } else if (G.ptab === 'friends') {
    let html = '';
    [['melody', 'Baker of songs and tarts'], ['pochacco', 'Garage, dive gear & races'], ['purin', 'Comfy Corner & long naps'],
     ['kitty', 'Keeper of the light'], ['pusheen', S.pet.adopted ? 'Your roommate & treasure-sniffer' : 'The roundest cat on Snack Cove'],
     ['turtles', 'The four dojo brothers'], ['coral', 'Tidepool boutique mermaid'], ['marina', 'Mermaid of the lagoon'], ['inky', 'Maestro of the deep']].forEach(([id, sub]) => {
      const h = S.hearts[id] || 0;
      const nm = id === 'turtles' ? 'The Turtle Brothers' : NPCS[id].n;
      html += `<div class="card"><h4>${nm}</h4><p>${sub}</p>
        <p style="font-size:19px;margin-top:4px">${'💗'.repeat(h)}${'🤍'.repeat(Math.max(0, 5 - h))}</p></div>`;
    });
    body.innerHTML = html;
  } else if (G.ptab === 'coll') {
    let html = `<div class="card"><h4>🐚 Seashell Charms: ${S.charms.length} / 12</h4><p>${S.charms.length >= 12 ? '🌈 Aurora Dress earned!' : 'Hidden on every island — look for pink sparkles!'}</p></div>`;
    html += `<div class="card"><h4>🗺️ Treasure Maps</h4>`;
    TMAPS.forEach(m => {
      const a = S.mapPieces.includes(m.id + 'a'), b = S.mapPieces.includes(m.id + 'b');
      const dug = S.dug.includes(m.id);
      html += `<p>${m.n}: ${dug ? '✅ treasure found!' : a && b ? `🧩🧩 complete — dig on ${ISLES[m.isle].name}!` : `${a ? '🧩' : '▫️'}${b ? '🧩' : '▫️'} pieces`}</p>`;
    });
    html += '</div><div class="card"><h4>🏁 Race Medals</h4>';
    Object.entries(RACES).forEach(([rid, R]) => {
      const m = S.medals[rid] || 0;
      html += `<p>${R.n}: ${m ? ['', '🥉 Bronze', '🥈 Silver', '🥇 Gold'][m] : '—'}</p>`;
    });
    html += '</div>';
    const hb = ['hb_blue', 'hb_red', 'hb_orange', 'hb_purple'].filter(h => S.ownedHat.includes(h));
    if (hb.length) html += `<div class="card"><h4>🐢 Turtle Headbands</h4><p>${hb.map(h => HATS[h].n).join(' · ')}</p></div>`;
    body.innerHTML = html;
  }
}
function renderShop(body) {
  const shop = SHOPS[G.shopId];
  body.innerHTML = `<p style="font-weight:800;margin:0 0 10px">Your shells: 🐚 ${S.shells}</p>`;
  if (G.shopId === 'boutique') {
    const wear = document.createElement('p');
    wear.style.cssText = 'font-weight:800;margin:0 0 8px;color:#E56A93';
    wear.textContent = '— Dresses —';
    body.appendChild(wear);
    Object.entries(DRESSES).forEach(([id, d2]) => {
      if (d2.cost < 0 && !S.ownedDress.includes(id)) return;
      const owned = S.ownedDress.includes(id);
      const wearing = S.outfit.dress === id;
      buyRow(body, { em: '👗', n: d2.n, d: owned ? '' : `🐚 ${d2.cost}` },
        wearing ? '✓ Wearing' : owned ? 'Wear!' : `🐚 ${d2.cost}`, wearing,
        () => {
          if (owned) { S.outfit.dress = id; markSave(); AudioSys.sfx('heartS'); toast(`👗 ${d2.n}!`); }
          else if (S.shells >= d2.cost) { S.shells -= d2.cost; S.ownedDress.push(id); S.outfit.dress = id; markSave(); AudioSys.sfx('quest'); toast(`👗 ${d2.n} — it's SO you!`); updateHUD(); }
          else { AudioSys.sfx('bad'); toast('Not enough shells yet! 🐚'); }
          renderPanel();
        }, wearing);
    });
    const hats = document.createElement('p');
    hats.style.cssText = 'font-weight:800;margin:10px 0 8px;color:#E56A93';
    hats.textContent = '— Hats & Headbands —';
    body.appendChild(hats);
    buyRow(body, { em: '🚫', n: 'No hat' }, S.outfit.hat === null ? '✓' : 'Wear', S.outfit.hat === null,
      () => { S.outfit.hat = null; markSave(); renderPanel(); }, S.outfit.hat === null);
    Object.entries(HATS).forEach(([id, h]) => {
      const turtleBand = id.startsWith('hb_');
      const owned = S.ownedHat.includes(id);
      if (turtleBand && !owned && S.mq < 33) return; // headbands come from the dojo later
      const wearing = S.outfit.hat === id;
      buyRow(body, { em: '🎀', n: h.n, d: h.perk || (owned ? '' : `🐚 ${h.cost}`) },
        wearing ? '✓ Wearing' : owned ? 'Wear!' : `🐚 ${h.cost}`, wearing,
        () => {
          if (owned) { S.outfit.hat = id; markSave(); AudioSys.sfx('heartS'); }
          else if (S.shells >= h.cost) { S.shells -= h.cost; S.ownedHat.push(id); S.outfit.hat = id; markSave(); AudioSys.sfx('quest'); toast(`🎀 ${h.n}!`); updateHUD(); }
          else { AudioSys.sfx('bad'); toast('Not enough shells yet! 🐚'); }
          renderPanel();
        }, wearing);
    });
    return;
  }
  if (G.shopId === 'furniture') {
    Object.entries(FURN).forEach(([id, f]) => {
      if (id === 'musicbox') return; // sold at Sammy's
      const owned = S.ownedFurn.includes(id);
      buyRow(body, { em: f.em, n: f.n, d: owned ? 'In your collection — decorate at home!' : '' },
        owned ? '✓ Owned' : `🐚 ${f.cost}`, owned,
        () => {
          if (S.shells >= f.cost) {
            S.shells -= f.cost; S.ownedFurn.push(id); markSave();
            AudioSys.sfx('quest'); toast(`${f.em} ${f.n}! Place it in your cottage!`); updateHUD();
            if (id === 'catbed' && S.mq === 19) updateHUD();
          } else { AudioSys.sfx('bad'); toast('Not enough shells yet! 🐚'); }
          renderPanel();
        }, owned);
    });
    return;
  }
  shop.stock.forEach(item => {
    let owned = false;
    if (item.kind === 'gear') owned = !!S.gear[item.id];
    if (item.kind === 'upgrade' || item.kind === 'flag') owned = !!S.flags[item.id];
    if (item.kind === 'recipe') owned = S.recipes.includes(item.id);
    if (item.kind === 'furn') owned = S.ownedFurn.includes(item.id);
    const dis = owned || (item.needs && !S.gear[item.needs]);
    buyRow(body, item, owned ? '✓ Owned' : `🐚 ${item.cost}`, dis && !owned ? true : owned,
      () => {
        if (owned) return;
        if (item.needs && !S.gear[item.needs]) { toast('You need the Big Bubble Tank first!'); return; }
        if (S.shells < item.cost) { AudioSys.sfx('bad'); toast('Not enough shells yet! Catch fish & find sea glass 🐚'); return; }
        S.shells -= item.cost;
        if (item.kind === 'gear') S.gear[item.id] = true;
        else if (item.kind === 'upgrade' || item.kind === 'flag') S.flags[item.id] = true;
        else if (item.kind === 'recipe') S.recipes.push(item.id);
        else if (item.kind === 'furn') S.ownedFurn.push(item.id);
        else invAdd(item.id);
        markSave();
        AudioSys.sfx('quest');
        toast(`${item.em} ${item.n}!`);
        updateHUD();
        renderPanel();
      }, owned);
  });
}
function renderCafe(body) {
  body.innerHTML = `<p style="font-weight:800;margin:0 0 10px">Bring ingredients, bake yummy things, serve them for shells! 🐚</p>`;
  RECIPES.forEach(r => {
    if (!S.recipes.includes(r.id)) return;
    const needTxt = Object.entries(r.need).map(([k, v]) => {
      const meta = ITEMS[k] || { em: '🐟' };
      const have = invCount(k);
      return `<span style="color:${have >= v ? '#3E7A3E' : '#C0574A'}">${meta.em}${have}/${v}</span>`;
    }).join(' ');
    const can = hasItems(r.need);
    buyRow(body, { em: r.em, n: r.n, d: `Needs: ${needTxt}` }, '🍳 Bake!', !can, () => startCook(r));
  });
  const dishes = RECIPES.filter(r => invCount('dish_' + r.id) > 0);
  if (dishes.length) {
    const h = document.createElement('p');
    h.style.cssText = 'font-weight:800;margin:14px 0 8px';
    h.textContent = 'Ready to serve:';
    body.appendChild(h);
    dishes.forEach(r => {
      buyRow(body, { em: r.em, n: `${r.n} × ${invCount('dish_' + r.id)}`, d: `A hungry islander pays 🐚 ${r.pay}` }, '🍽️ Serve', false, () => serveDish(r));
    });
  }
  const sellBtn = document.createElement('button');
  sellBtn.className = 'chBtn alt';
  sellBtn.style.marginTop = '8px';
  sellBtn.textContent = '🐟 Sell fish to My Melody';
  sellBtn.onclick = () => openPanel('sell');
  body.appendChild(sellBtn);
}
function serveDish(r) {
  if (!invTake('dish_' + r.id, 1)) return;
  addShells(r.pay);
  AudioSys.sfx('shellS');
  const eaters = ['Pochacco', 'Pompompurin', 'Hello Kitty', 'a happy seagull', 'Sammy', 'Pearl the Pigeon', 'Michelangelo', 'Pusheen (obviously)'];
  toast(`🍽️ ${pick(eaters)} loved the ${r.n}! +${r.pay} shells`);
  if (Math.random() < .4) heart('melody');
  renderPanel();
}
function renderSell(body) {
  body.innerHTML = `<p style="font-weight:800;margin:0 0 10px">My Melody buys fresh fish for the café! Your shells: 🐚 ${S.shells}</p>`;
  let any = false;
  FISH.forEach(f => {
    const n = invCount(f.id);
    if (!n) return;
    any = true;
    const row = document.createElement('div');
    row.className = 'buyRow';
    row.innerHTML = `<div class="bi"><canvas width="108" height="72" style="width:54px;height:36px"></canvas></div>
      <div class="bt"><b>${f.n} × ${n}</b><small>🐚 ${f.val} each</small></div>`;
    const cv = row.querySelector('canvas');
    const c = cv.getContext('2d');
    c.setTransform(2, 0, 0, 2, 54, 18);
    const sc = Math.min(1, 20 / f.sz); c.scale(sc, sc);
    drawFishSprite(c, f, 1.2, {});
    const b = document.createElement('button');
    b.className = 'buyBtn';
    b.textContent = `Sell all (🐚 ${f.val * n})`;
    b.onclick = () => sellFish(f.id);
    row.appendChild(b);
    body.appendChild(row);
  });
  if (!any) body.innerHTML += '<div class="card"><p>No fish to sell right now — dive in! 🌊</p></div>';
}
function sellFish(fid) {
  const F = fishById(fid);
  const n = invCount(fid);
  if (!n) return;
  invTake(fid, n);
  addShells(F.val * n);
  AudioSys.sfx('shellS');
  toast(`🐚 Sold ${n} × ${F.n} for ${F.val * n} shells!`);
  renderPanel();
}
function renderDecor(body) {
  body.innerHTML = '<p style="font-weight:800;margin:0 0 10px">Pick something for this spot:</p>';
  const placed = Object.values(S.house);
  let any = false;
  S.ownedFurn.forEach(fid => {
    if (placed.includes(fid)) return;
    any = true;
    buyRow(body, { em: FURN[fid].em, n: FURN[fid].n }, 'Place here!', false, () => {
      S.house[G.decorSlot] = fid; markSave();
      AudioSys.sfx('ding');
      if (fid === 'catbed' && S.mq === 19) { closePanel(); adoptionScene(); return; }
      closePanel();
      toast(`${FURN[fid].em} Perfect spot!`);
    });
  });
  if (!any) body.innerHTML += '<div class="card"><p>Nothing to place! Visit Purin\'s Comfy Corner in the village to buy furniture. 🛋️</p></div>';
}
function renderMap(body) {
  body.innerHTML = '<p style="font-weight:800;margin:0 0 10px">The Silver Tide revealed a whole archipelago! ⛵</p>';
  const emojis = { home: '🏝️', snack: '🍩', turtle: '🐢', lagoon: '🧜‍♀️', mist: '🌫️', volcano: '🌋' };
  Object.entries(ISLES).forEach(([id, def]) => {
    const unlocked = isleUnlocked(id);
    const here = S.isle === id && G.mode !== 'sail';
    const visited = S.visited.includes(id);
    const canGo = unlocked && S.vehicles.boat && !here && (G.mode === 'land' || G.mode === 'sail');
    buyRow(body, {
      em: unlocked ? emojis[id] : '❔',
      n: unlocked ? def.name : '??? (keep exploring!)',
      d: here ? 'You are here!' : !unlocked ? 'Hidden in the silver mist…' : visited ? '' : 'Not yet visited — sail there first!',
    }, here ? '📍 Here' : '⛵ Sail!', !canGo || !visited && !unlocked, () => {
      if (!canGo) return;
      closePanel();
      if (visited) arriveAt(id);
      else { startSail(); }
    }, here);
  });
}
function renderSettings(body) {
  body.innerHTML = '';
  const mkToggle = (label, val, cb) => {
    const row = document.createElement('div');
    row.className = 'buyRow';
    row.innerHTML = `<div class="bt"><b>${label}</b></div>`;
    const b = document.createElement('button');
    b.className = 'buyBtn' + (val ? ' owned' : '');
    b.textContent = val ? 'On ✓' : 'Off';
    b.onclick = () => { cb(); renderPanel(); };
    row.appendChild(b);
    body.appendChild(row);
  };
  mkToggle('🎵 Music', S.music, () => AudioSys.setMusicOn(!S.music));
  mkToggle('🔔 Sounds', S.sfx, () => AudioSys.setSfxOn(!S.sfx));
  const fsRow = document.createElement('div');
  fsRow.className = 'buyRow';
  fsRow.innerHTML = '<div class="bt"><b>⛶ Fullscreen</b><small>On iPad: Share → Add to Home Screen is even better!</small></div>';
  const fsB = document.createElement('button');
  fsB.className = 'buyBtn'; fsB.textContent = 'Go';
  fsB.onclick = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };
  fsRow.appendChild(fsB);
  body.appendChild(fsRow);
  // magic backup code
  const bk = document.createElement('div');
  bk.className = 'card';
  bk.innerHTML = `<h4>🔮 Magic Backup Code</h4>
    <p>Copy this code somewhere safe (a note, a text to a grown-up). Paste it back anytime — even on a different iPad — and your whole adventure returns!</p>
    <textarea id="bkOut" readonly style="width:100%;height:56px;margin-top:8px;border-radius:10px;border:2px solid #F4DDB8;font-size:10px;padding:6px;user-select:text;-webkit-user-select:text"></textarea>`;
  body.appendChild(bk);
  const bkBtns = document.createElement('div');
  bkBtns.style.cssText = 'display:flex;gap:8px;margin-top:8px';
  const showB = document.createElement('button');
  showB.className = 'buyBtn'; showB.textContent = '✨ Show my code';
  showB.onclick = () => { saveGame(); const ta = $('bkOut'); ta.value = exportCode(); ta.select(); try { document.execCommand('copy'); toast('📋 Copied!'); } catch (e) {} };
  const loadB = document.createElement('button');
  loadB.className = 'buyBtn'; loadB.textContent = '📥 Paste a code';
  loadB.onclick = () => {
    const ta = $('bkOut');
    ta.readOnly = false; ta.value = ''; ta.placeholder = 'Paste the magic code here, then tap Restore';
    loadB.textContent = '✅ Restore!';
    loadB.onclick = () => {
      if (importCode(ta.value)) { toast('✨ Adventure restored!'); location.reload(); }
      else { AudioSys.sfx('bad'); toast('Hmm, that code doesn\'t look right…'); }
    };
    ta.focus();
  };
  bkBtns.appendChild(showB); bkBtns.appendChild(loadB);
  bk.appendChild(bkBtns);
  const sw = document.createElement('div');
  sw.className = 'card';
  sw.innerHTML = `<h4>💾 Save Slot ${activeSlot}</h4><p>Played ${Math.round((S.playSeconds || 0) / 60)} minutes. Everything saves automatically!</p>`;
  const swB = document.createElement('button');
  swB.className = 'buyBtn';
  swB.style.marginTop = '8px';
  swB.textContent = '🔁 Switch save slot (back to title)';
  swB.onclick = () => { saveGame(); location.reload(); };
  sw.appendChild(swB);
  body.appendChild(sw);
}
/* ============================================================
   MINIGAMES — Echo Song (rhythm) & Café cooking
   ============================================================ */
/* ── Echo Song ───────────────────────────────────────────── */
const ECHO_BTNS = [
  { em: '🐚', col: '#FF8FB1' }, { em: '🐠', col: '#7FD8E8' },
  { em: '⭐', col: '#FFD24C' }, { em: '🪸', col: '#B9A8FF' },
];
function startRhythm(cfg) {
  G.rhythm = {
    cfg, round: 0, seq: [], phase: 'intro', timer: 1.2,
    showIdx: 0, inputIdx: 0, lit: -1, litT: 0, msg: 'Listen to the song…', fails: 0,
  };
  refreshBusy();
  AudioSys.play('echo', 1);
}
function rhythmGen() {
  const R = G.rhythm;
  const len = R.cfg.rounds[R.round];
  R.seq = [];
  for (let i = 0; i < len; i++) R.seq.push(irnd(0, 3));
}
function rhythmPress(i) {
  const R = G.rhythm;
  if (!R || R.phase !== 'input') return;
  R.lit = i; R.litT = .25;
  AudioSys.sfx('noteI', i);
  if (i === R.seq[R.inputIdx]) {
    R.inputIdx++;
    if (R.inputIdx >= R.seq.length) {
      R.phase = 'good'; R.timer = 1;
      R.msg = pick(['Beautiful!! ♪', 'Perfect echo!', 'You two sound amazing!']);
      AudioSys.sfx('good');
    }
  } else {
    R.phase = 'bad'; R.timer = 1.1; R.fails++;
    R.msg = pick(['Almost! Listen again…', 'Oops! One more time!', 'So close! Again!']);
    AudioSys.sfx('bad');
  }
}
window.addEventListener('keydown', e => {
  if (G.rhythm && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
    rhythmPress(parseInt(e.code.slice(5), 10) - 1);
  }
});
function rhythmBtnPos(i) {
  const cx = VW / 2, cy = VH * .68;
  const gap = Math.min(120, VW / 5.5);
  return { x: cx + (i - 1.5) * gap, y: cy, r: Math.min(46, gap * .4) };
}
function updateRhythm(dt) {
  const R = G.rhythm;
  if (!R) return;
  R.litT = Math.max(0, R.litT - dt);
  if (R.litT <= 0 && R.phase !== 'show') R.lit = -1;
  R.timer -= dt;
  if (R.phase === 'intro' && R.timer <= 0) {
    rhythmGen();
    R.phase = 'show'; R.showIdx = 0; R.timer = .8;
    R.msg = `Round ${R.round + 1} of ${R.cfg.rounds.length} — listen! 🎵`;
  } else if (R.phase === 'show' && R.timer <= 0) {
    if (R.showIdx < R.seq.length) {
      R.lit = R.seq[R.showIdx]; R.litT = .32;
      AudioSys.sfx('noteI', R.lit);
      R.showIdx++; R.timer = .58;
    } else {
      R.phase = 'input'; R.inputIdx = 0;
      R.msg = 'Your turn! Echo the song! ✨';
    }
  } else if (R.phase === 'good' && R.timer <= 0) {
    R.round++;
    if (R.round >= R.cfg.rounds.length) {
      R.phase = 'win'; R.timer = 1.4;
      R.msg = '🎉 THE DUET IS COMPLETE! 🎉';
      AudioSys.sfx('yay');
    } else { R.phase = 'show'; rhythmGen(); R.showIdx = 0; R.timer = .9; R.msg = `Round ${R.round + 1} — listen! 🎵`; }
  } else if (R.phase === 'bad' && R.timer <= 0) {
    R.phase = 'show'; R.showIdx = 0; R.timer = .9;
    R.msg = 'Listen once more… 🎵';
  } else if (R.phase === 'win' && R.timer <= 0) {
    const cfg = R.cfg;
    G.rhythm = null; refreshBusy();
    AudioSys.play(G.mode === 'dive' ? (G.p.y > 1400 ? 'deep' : 'sea') : (isNight() ? 'night' : isleDef().music), 1.5);
    if (cfg.onWin) cfg.onWin();
    return;
  }
  // taps
  if (ptr.tapped) {
    for (let i = 0; i < 4; i++) {
      const b = rhythmBtnPos(i);
      if (dist(ptr.x, ptr.y, b.x, b.y) < b.r + 14) { rhythmPress(i); break; }
    }
  }
}
function drawRhythm() {
  const R = G.rhythm;
  if (!R) return;
  ctx.fillStyle = 'rgba(8,16,40,.72)';
  ctx.fillRect(0, 0, VW, VH);
  // singer (inky or queen) at top
  const singer = R.cfg.who;
  ctx.save();
  ctx.translate(VW / 2, VH * .3);
  ctx.scale(1.7, 1.7);
  glow(ctx, 0, -20, 90, rgba(200, 180, 255), .3 + .1 * Math.sin(G.t * 3));
  if (singer === 'inky') PAINT.inky(ctx, G.t, { baton: true, conduct: R.phase === 'show', talk: false });
  else PAINT.queen(ctx, G.t, {});
  ctx.restore();
  // floating notes during show
  if (R.phase === 'show' || R.lit >= 0) {
    ctx.fillStyle = `rgba(220,235,255,${.5 + .5 * Math.sin(G.t * 6)})`;
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('♪', VW / 2 + Math.sin(G.t * 3) * 60, VH * .3 - 110 - (G.t * 30 % 40));
    ctx.fillText('♫', VW / 2 - Math.sin(G.t * 2.2) * 80, VH * .3 - 90 - (G.t * 22 % 34));
  }
  // message
  ctx.fillStyle = '#FFF4DC';
  ctx.font = `900 ${Math.min(26, VW / 24)}px ui-rounded, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(R.msg, VW / 2, VH * .52);
  // round pips
  for (let i = 0; i < R.cfg.rounds.length; i++) {
    ctx.beginPath(); ctx.arc(VW / 2 + (i - (R.cfg.rounds.length - 1) / 2) * 26, VH * .565, 7, 0, TAU);
    ctx.fillStyle = i < R.round ? '#FFD24C' : 'rgba(255,255,255,.25)';
    ctx.fill();
  }
  // buttons
  for (let i = 0; i < 4; i++) {
    const b = rhythmBtnPos(i);
    const lit = R.lit === i;
    const sc = lit ? 1.22 : 1;
    if (lit) glow(ctx, b.x, b.y, b.r * 2.6, rgba(255, 245, 200), .5);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * sc, 0, TAU);
    ctx.fillStyle = lit ? '#FFFDF0' : ECHO_BTNS[i].col;
    ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = lit ? ECHO_BTNS[i].col : 'rgba(255,255,255,.85)';
    ctx.stroke();
    ctx.font = `${Math.round(b.r * .95)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ECHO_BTNS[i].em, b.x, b.y + 2);
    ctx.textBaseline = 'alphabetic';
    // progress dots under buttons during input
  }
  if (R.phase === 'input') {
    for (let i = 0; i < R.seq.length; i++) {
      ctx.beginPath(); ctx.arc(VW / 2 + (i - (R.seq.length - 1) / 2) * 22, VH * .68 + 74, 6, 0, TAU);
      ctx.fillStyle = i < R.inputIdx ? '#7FE08C' : 'rgba(255,255,255,.3)';
      ctx.fill();
    }
  }
}

/* ── Cooking ─────────────────────────────────────────────── */
function startCook(recipe) {
  closePanel();
  G.cook = { r: recipe, stage: 0, pos: 0, dir: 1, speed: .75, results: [], flash: 0, done: 0, msg: 'Tap when the spoon hits the pink zone!' };
  refreshBusy();
  AudioSys.sfx('tap');
}
function updateCook(dt) {
  const C = G.cook;
  if (!C) return;
  C.flash = Math.max(0, C.flash - dt * 2);
  if (C.done > 0) {
    C.done -= dt;
    if (C.done <= 0) finishCook();
    return;
  }
  C.speed = .75 + C.stage * .25;
  C.pos += C.dir * C.speed * dt;
  if (C.pos > 1) { C.pos = 1; C.dir = -1; }
  if (C.pos < 0) { C.pos = 0; C.dir = 1; }
  const zone = [.3, .24, .18][C.stage] * (S.outfit.hat === 'hb_orange' ? 1.35 : 1);
  const hit = () => {
    const d = Math.abs(C.pos - .5);
    const great = d < zone / 2;
    C.results.push(great);
    C.flash = 1;
    AudioSys.sfx(great ? 'good' : 'cookTick');
    C.msg = great ? pick(['Perfect stir!! ✨', 'Chef Lila!! 💗', 'Wonderful!']) : pick(['Good!', 'Nice!', 'Keep going!']);
    C.stage++;
    if (C.stage >= 3) { C.done = 1; C.msg = 'Into the oven…! 🔥'; }
  };
  if (ptr.tapped || actionQueued) { actionQueued = false; hit(); }
}
function finishCook() {
  const C = G.cook;
  const r = C.r;
  Object.entries(r.need).forEach(([k, v]) => invTake(k, v));
  invAdd('dish_' + r.id);
  const greats = C.results.filter(Boolean).length;
  const bonus = [0, 1, 3, 6][greats];
  if (bonus) addShells(bonus);
  G.cook = null; refreshBusy();
  AudioSys.sfx('ding');
  burst(G.p.x, gyAt ? gyAt(G.p.x) - 60 : G.p.y, '#FFE9C9', 16, { grav: -60 });
  toast(`${r.em} ${r.n} baked!${greats === 3 ? ' PERFECT! ✨' : ''}${bonus ? ` (+${bonus} tip 🐚)` : ''}`);
  updateHUD();
}
function drawCook() {
  const C = G.cook;
  if (!C) return;
  ctx.fillStyle = 'rgba(20,14,10,.62)';
  ctx.fillRect(0, 0, VW, VH);
  const px = VW / 2, py = VH / 2;
  // card
  rr(ctx, px - 260, py - 150, 520, 300, 28);
  ctx.fillStyle = '#FFF8EC'; ctx.fill();
  ctx.strokeStyle = '#FFD9A0'; ctx.lineWidth = 5; ctx.stroke();
  ctx.font = '58px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(C.r.em, px, py - 74);
  ctx.fillStyle = '#5B4636';
  ctx.font = '900 24px ui-rounded, sans-serif';
  ctx.fillText(`Baking: ${C.r.n}`, px, py - 22);
  ctx.font = '800 17px ui-rounded, sans-serif';
  ctx.fillStyle = '#E56A93';
  ctx.fillText(C.msg, px, py + 10);
  // bar
  const bw = 400, bh = 26, bx = px - bw / 2, by = py + 40;
  rr(ctx, bx, by, bw, bh, 13);
  ctx.fillStyle = '#F4DDB8'; ctx.fill();
  const zone = [.3, .24, .18][Math.min(C.stage, 2)] * (S.outfit.hat === 'hb_orange' ? 1.35 : 1);
  rr(ctx, bx + (0.5 - zone / 2) * bw, by, zone * bw, bh, 13);
  ctx.fillStyle = C.flash > 0 ? '#FFE14C' : '#FF9FBE'; ctx.fill();
  rr(ctx, bx, by, bw, bh, 13);
  ctx.strokeStyle = '#E0B888'; ctx.lineWidth = 3; ctx.stroke();
  // marker (spoon)
  const mx = bx + C.pos * bw;
  ctx.font = '34px sans-serif';
  ctx.fillText('🥄', mx, by - 8 + Math.sin(G.t * 10) * 2);
  // stage stars
  for (let i = 0; i < 3; i++) {
    ctx.font = '26px sans-serif';
    ctx.globalAlpha = i < C.results.length ? 1 : .25;
    ctx.fillText(i < C.results.length ? (C.results[i] ? '⭐' : '✔️') : '⭐', px - 40 + i * 40, py + 116);
  }
  ctx.globalAlpha = 1;
}

/* ── RACES ───────────────────────────────────────────────── */
function startRace(rid) {
  const R = RACES[rid];
  AudioSys.sfx('tap');
  G.race = { rid, R, phase: 'count', t: 3.9, gate: 0, time: 0 };
  G.p.x = R.startX; G.p.vx = 0; G.p.face = 1;
  G.vehicle = R.veh;
  updateVehBtn();
  refreshBusyRace();
}
function refreshBusyRace() { /* races don't set busy — you need to move! */ }
function updateRace(dt) {
  const r = G.race;
  if (!r) return;
  if (r.phase === 'count') {
    const before = Math.ceil(r.t);
    r.t -= dt;
    G.p.vx = 0;
    if (Math.ceil(r.t) !== before && r.t > 0) AudioSys.sfx('cookTick');
    if (r.t <= 0) { r.phase = 'run'; AudioSys.sfx('good'); }
    return;
  }
  r.time += dt;
  const gx = r.R.gates[r.gate];
  if (gx !== undefined && Math.abs(G.p.x - gx) < 46) {
    r.gate++;
    AudioSys.sfx('noteI', r.gate % 5);
    burst(gx, gyAt(gx) - 60, '#FFE14C', 10, { grav: -40, star: true });
  }
  if (r.gate >= r.R.gates.length) finishRace();
}
function finishRace() {
  const r = G.race;
  const R = r.R, t = r.time;
  const medal = t <= R.gold ? 3 : t <= R.silver ? 2 : t <= R.bronze ? 1 : 0;
  const prev = S.medals[r.rid] || 0;
  G.race = null;
  if (r.R.veh === 'bike' && !S.vehicles.bike) G.vehicle = null;
  updateVehBtn();
  const timeStr = t.toFixed(1) + 's';
  if (medal === 0) {
    AudioSys.sfx('bad');
    dsay([{ who: 'pochacco', text: `${timeStr}! Sooo close to a medal. One more try? You've got this!` }]);
    return;
  }
  AudioSys.sfx('yay');
  const medalName = ['', '🥉 BRONZE', '🥈 SILVER', '🥇 GOLD'][medal];
  burst(G.p.x, gyAt(G.p.x) - 60, '#FFD24C', 24, { grav: -60, star: true, size: 5 });
  let rewardTxt = '';
  if (medal > prev) {
    S.medals[r.rid] = medal; markSave();
    const shellPay = [0, 12, 20, 32][medal];
    addShells(shellPay);
    rewardTxt = ` +${shellPay} shells!`;
  }
  toast(`🏁 ${R.n}: ${timeStr} — ${medalName}!${rewardTxt}`);
  // story hooks
  if (r.rid === 'bike1' && S.mq === 6) {
    S.vehicles.bike = true; markSave();
    G.vehicle = 'bike'; updateVehBtn();
    dsay([
      { who: 'pochacco', text: `${timeStr}!! Natural talent! The bike is YOURS, champ — fat tires and all. Try the ramps: pedal fast and FLY!` },
    ], () => advanceQuest(7));
  } else if (r.rid === 'surf1' && S.mq === 24) {
    dsay([
      { who: 'pochacco', text: 'You FLEW! Officially a windsurfer! Now… Marina keeps humming about a singing grotto down in the lagoon. Dive and follow the song!' },
    ], () => advanceQuest(25));
  } else if (r.rid === 'bike2' && !S.mapPieces.includes('m2b')) {
    gainMapPiece('m2b');
  }
  saveGame();
}
function drawRaceGates(camX) {
  const r = G.race;
  if (!r) return;
  r.R.gates.forEach((gx, i) => {
    const sx = gx - camX;
    if (sx < -80 || sx > VW + 80) return;
    const passed = i < r.gate, next = i === r.gate;
    const gy = gyAt(gx);
    ctx.globalAlpha = passed ? .35 : 1;
    for (const sd of [-38, 38]) {
      line(ctx, sx + sd, gy, sx + sd, gy - 90, 5, '#8C6A4B');
      ctx.fillStyle = next ? '#FFE14C' : passed ? '#A8D8A0' : '#FF8FB1';
      ctx.beginPath(); ctx.moveTo(sx + sd, gy - 90); ctx.lineTo(sx + sd + 24 * Math.sign(sd) * -1, gy - 82); ctx.lineTo(sx + sd, gy - 74); ctx.closePath(); ctx.fill();
    }
    if (next) glow(ctx, sx, gy - 60, 60, rgba(255, 225, 76), .3 + .15 * Math.sin(G.t * 5));
    ctx.globalAlpha = 1;
  });
}
function drawRaceHUD() {
  const r = G.race;
  if (!r) return;
  if (r.phase === 'count') {
    const n = Math.ceil(r.t);
    ctx.font = `900 ${Math.min(110, VW / 7)}px ui-rounded, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(90,50,30,.8)';
    const txt = n > 3 ? 'Ready…' : n > 0 ? String(n) : 'GO!';
    ctx.strokeText(txt, VW / 2, VH * .4);
    ctx.fillStyle = '#FFE14C';
    ctx.fillText(txt, VW / 2, VH * .4);
  } else {
    ctx.font = '900 26px ui-rounded, sans-serif'; ctx.textAlign = 'center';
    const txt = `⏱ ${r.time.toFixed(1)}s   🚩 ${r.gate}/${r.R.gates.length}`;
    const w = ctx.measureText(txt).width + 40;
    rr(ctx, VW / 2 - w / 2, 54, w, 44, 22);
    ctx.fillStyle = 'rgba(255,248,236,.92)'; ctx.fill();
    ctx.strokeStyle = '#FFB84D'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5B4636';
    ctx.fillText(txt, VW / 2, 85);
  }
}

/* ── TURTLE TRAINING ─────────────────────────────────────── */
function startTrain(type, sensei, onWin) {
  G.train = {
    type, sensei, onWin,
    state: 'intro', t: 1.4, round: 0, hits: 0,
    pos: 0, vel: 0, holdT: 0,
    msg: type === 'reflex' ? 'Watch the lantern. When it flashes GREEN — tap!' : 'Hold LEFT / RIGHT (or tap the sides) to stay balanced!',
  };
  refreshBusy();
  AudioSys.play('dojo', 1);
}
function updateTrain(dt) {
  const T = G.train;
  if (!T) return;
  const tapped = ptr.tapped || actionQueued;
  if (actionQueued) actionQueued = false;
  if (T.type === 'reflex') {
    T.t -= dt;
    if (T.state === 'intro' && T.t <= 0) { T.state = 'wait'; T.t = rnd(1.2, 3.2); T.msg = 'Steady……'; }
    else if (T.state === 'wait') {
      if (tapped) { T.state = 'oops'; T.t = 1.2; T.msg = 'Too soon! Breathe like the tide…'; AudioSys.sfx('bad'); }
      else if (T.t <= 0) { T.state = 'go'; T.t = .75; T.msg = 'NOW!!'; AudioSys.sfx('ding'); }
    } else if (T.state === 'go') {
      if (tapped) {
        T.hits++; AudioSys.sfx('good');
        burst(G.p.x, G.mode === 'land' ? gyAt(G.p.x) - 80 : G.p.y, '#7FE08C', 12, { grav: -60, star: true });
        if (T.hits >= 3) { T.state = 'win'; T.t = 1.4; T.msg = '🎉 FOCUS MASTERED! 🎉'; AudioSys.sfx('yay'); }
        else { T.state = 'wait'; T.t = rnd(1.2, 3.2); T.msg = `${T.hits}/3! Steady……`; }
      } else if (T.t <= 0) { T.state = 'oops'; T.t = 1.2; T.msg = 'Missed it! Eyes on the lantern…'; AudioSys.sfx('bad'); }
    } else if (T.state === 'oops' && T.t <= 0) { T.state = 'wait'; T.t = rnd(1.2, 3.2); T.msg = 'Steady……'; }
    else if (T.state === 'win' && T.t <= 0) endTrain();
  } else { // balance
    T.t -= dt;
    if (T.state === 'intro' && T.t <= 0) { T.state = 'run'; T.t = 12; T.msg = 'Balance! Stay in the circle!'; }
    else if (T.state === 'run') {
      T.vel += (n1(Math.floor(G.t * 2.5)) - .5) * 3.2 * dt + T.pos * 1.1 * dt;
      let input = 0;
      if (keys.ArrowLeft || keys.KeyA || touchHeld.L || (ptr.down && ptr.x < VW / 2)) input -= 1;
      if (keys.ArrowRight || keys.KeyD || touchHeld.R || (ptr.down && ptr.x >= VW / 2)) input += 1;
      T.vel += input * 2.6 * dt;
      T.vel *= (1 - dt * .6);
      T.pos += T.vel * dt;
      if (Math.abs(T.pos) > 1) {
        T.pos = 0; T.vel = 0; T.t = 12;
        T.msg = 'Whoops! Wibble-wobble… again!'; AudioSys.sfx('bad');
      }
      if (T.t <= 0) { T.state = 'win'; T.t = 1.4; T.msg = '🎉 PERFECT BALANCE! 🎉'; AudioSys.sfx('yay'); }
    } else if (T.state === 'win' && T.t <= 0) endTrain();
  }
}
function endTrain() {
  const T = G.train;
  G.train = null; refreshBusy();
  AudioSys.play(isleDef().music, 1.5);
  if (T.onWin) T.onWin();
}
function drawTrain() {
  const T = G.train;
  if (!T) return;
  ctx.fillStyle = 'rgba(14,20,16,.72)';
  ctx.fillRect(0, 0, VW, VH);
  // sensei
  ctx.save();
  ctx.translate(VW / 2, VH * .34);
  ctx.scale(1.7, 1.7);
  PAINT[T.sensei](ctx, G.t, { talk: false, hop: T.state === 'win' });
  ctx.restore();
  ctx.fillStyle = '#FFF4DC';
  ctx.font = `900 ${Math.min(24, VW / 26)}px ui-rounded, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(T.msg, VW / 2, VH * .52);
  if (T.type === 'reflex') {
    // the lantern
    const lit = T.state === 'go';
    glow(ctx, VW / 2, VH * .68, 70, lit ? rgba(126, 224, 140) : rgba(255, 160, 106), lit ? .7 : .25);
    rr(ctx, VW / 2 - 26, VH * .68 - 34, 52, 68, 16);
    ctx.fillStyle = lit ? '#7FE08C' : '#B06A3C'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(VW / 2 + (i - 1) * 30, VH * .84, 8, 0, TAU);
      ctx.fillStyle = i < T.hits ? '#7FE08C' : 'rgba(255,255,255,.25)'; ctx.fill();
    }
  } else {
    // balance beam
    const bw = Math.min(420, VW * .7);
    rr(ctx, VW / 2 - bw / 2, VH * .7, bw, 20, 10);
    ctx.fillStyle = 'rgba(255,248,236,.25)'; ctx.fill();
    rr(ctx, VW / 2 - bw * .18, VH * .7, bw * .36, 20, 10);
    ctx.fillStyle = 'rgba(126,224,140,.45)'; ctx.fill();
    const mx = VW / 2 + T.pos * bw / 2;
    ctx.save(); ctx.translate(mx, VH * .7 + 6); ctx.rotate(T.pos * .5);
    ctx.scale(.7, .7); ctx.translate(0, 10);
    drawLila(ctx, G.t, { face: 1 });
    ctx.restore();
    if (T.state === 'run') {
      ctx.font = '900 22px ui-rounded, sans-serif';
      ctx.fillStyle = '#FFE14C';
      ctx.fillText(`${Math.max(0, T.t).toFixed(1)}s`, VW / 2, VH * .64);
    }
  }
}
/* ============================================================
   STORY LOGIC — quests, dialogue, progression
   ============================================================ */
function advanceQuest(n, silent) {
  const prevCh = chapterOf(Math.min(S.mq, 42));
  S.mq = n; markSave(); updateHUD();
  if (n <= 42) {
    const ch = chapterOf(n);
    if (ch !== prevCh && CHAPTERS[ch].at === n && !silent) {
      chapterCardShow(ch, CHAPTERS[ch].n, () => { AudioSys.sfx('quest'); toast(`📜 ${MQ[n].t}`); });
      return;
    }
    if (!silent) { AudioSys.sfx('quest'); toast(`📜 New quest: ${MQ[n].t}`); }
  }
  saveGame();
}
function questHint() {
  if (S.mq >= 99) return POSTGAME_HINT;
  const q = MQ[S.mq];
  return typeof q.h === 'function' ? q.h() : q.h;
}

/* ── talk dispatcher ─────────────────────────────────────── */
function talkTo(id) {
  AudioSys.sfx('tap');
  const q = S.mq;
  switch (id) {
    case 'melody': return talkMelody(q);
    case 'pochacco': return talkPochacco(q);
    case 'purin': return talkPurin(q);
    case 'kitty': return talkKitty(q);
    case 'sammy': return talkSammy(q);
    case 'pigeon': return buyIcecream();
    case 'coral': return talkCoral(q);
    case 'marina': return talkMarina(q);
    case 'queen': return talkQueen(q);
    case 'inky': return talkInky(q);
    case 'pusheen': return talkPusheen(q);
    case 'leo': return talkLeo(q);
    case 'raph': return talkRaph(q);
    case 'mikey': return talkMikey(q);
    case 'donnie': return talkDonnie(q);
    case 'glimmer': return talkGlimmer(q);
  }
}
function talkMelody(q) {
  if (q === 1) {
    dsay([
      { who: 'melody', text: 'LILA!! You came back for the Festival of Song! Oh, hug, hug, HUG! A whole year! You got taller! Did you get taller?' },
      { who: 'lila', text: 'My Melody!! The island looks beautiful — the song is everywhere now!' },
      { who: 'melody', text: 'Mm-hm! But… something funny is happening. The tide turned SILVER last night, and it keeps leaving little gifts on the sand. Shells that shimmer like moonlight!' },
      { who: 'melody', text: 'Could you gather five of them? I want to show the Queen — my paws are all covered in flour!' },
    ], () => { heart('melody'); advanceQuest(2); });
    return;
  }
  if (q === 2 && invCount('silvershell') >= 5) {
    dsay([
      { who: 'melody', text: 'Oh my — they\'re humming! Every one a different note. This isn\'t ordinary sea-magic, Lila…' },
      { who: 'melody', text: 'Take them when you visit Queen Nerissa. OH! But first — Hello Kitty has been bouncing on her toes all morning. She has a surprise for you at the lighthouse. GO GO GO!' },
    ], () => { invTake('silvershell', 5); heart('melody'); advanceQuest(3); });
    return;
  }
  if (q === 31) {
    if (invCount('plank') >= 4) {
      dsay([
        { who: 'melody', text: 'All the driftwood! The café porch will be better than ever. You\'re the best storm-fixer TWO years running. 💗' },
      ], () => {
        invTake('plank', 4); addShells(20); heart('melody');
        advanceQuest(32);
      });
    } else dsay([{ who: 'melody', text: 'The silver storm scattered driftwood down the beach — four planks and the porch is saved! 🪵' }]);
    return;
  }
  if (q === 39) {
    dsay([
      { who: 'melody', text: 'A festival to heal the Moon Pearl?! Then it needs my GRANDEST bake: the legendary MOON CAKE. Seven layers! Silver frosting! A little bell on top!' },
      { who: 'lila', text: 'Can you really bake all that?' },
      { who: 'melody', text: 'For the Moon Pearl? I\'d bake a cake the size of the lighthouse. It\'ll be ready — go gather the band, maestro!' },
    ], () => { heart('melody'); S.flags.mooncake = true; markSave(); advanceQuest(40); });
    return;
  }
  const chats = [
    'The Silver Tide left a spoon on the beach this morning. A SILVER spoon! For me!',
    `Pusheen ordered "one of everything" again. I love that cat.`,
    'Your cottage chimney puffs the sweetest little smoke rings. So cozy!',
    'The turtle boys eat pizza faster than I can slice it. It\'s a beautiful thing.',
  ];
  const opts = [{ label: '💬 Chat', cb: () => dsay([{ who: 'melody', text: pick(chats) }]) }];
  opts.push({ label: '🍳 Kitchen', alt: true, cb: () => openPanel('cafe') });
  opts.push({ label: '🐟 Sell fish', alt: true, cb: () => openPanel('sell') });
  if (invCount('donut') || invCount('icecream') || invCount('lemonade')) {
    opts.push({ label: '🎁 Give a treat', alt: true, cb: () => giveTreat('melody') });
  }
  dchoice('melody', 'Hello hello, sweet Lila! ☕', opts);
}
function giveTreat(who) {
  const item = invCount('donut') ? 'donut' : invCount('icecream') ? 'icecream' : 'lemonade';
  invTake(item, 1);
  heart(who);
  AudioSys.sfx('heartS');
  burst(G.p.x, gyAt(G.p.x) - 70, '#FF9FBE', 12, { grav: -50, star: true });
  toast(`💗 ${NPCS[who].n} loved the ${ITEMS[item].n}!`);
}
function talkPochacco(q) {
  if (S.isle === 'lagoon') {
    if (q === 23 && invCount('plank') >= 3) {
      dsay([
        { who: 'pochacco', text: 'Driftwood delivery! The Surf Shack lives!! Branch number TWO of the Pochacco empire!' },
        { who: 'pochacco', text: 'And every grand opening needs a grand opening GIFT: one windsurf board, custom, just for you! Wind + board + Lila = ZOOM.' },
      ], () => {
        invTake('plank', 3);
        S.vehicles.surf = true; S.flags.surfShackFixed = true; markSave();
        heart('pochacco');
        toast('🏄 You got the Windsurf Board!');
        advanceQuest(24);
        updateVehBtn();
      });
    } else if (q === 24) {
      dchoice('pochacco', 'Ready for the Lagoon Slalom? Bronze or better and you\'re an official windsurfer! 🌊', [
        { label: '🏁 Race!', cb: () => startRace('surf1') },
        { label: 'Not yet', alt: true, cb: () => {} },
      ]);
    } else {
      dchoice('pochacco', 'Surf\'s up at branch #2! What\'ll it be?', [
        { label: '🏁 Lagoon Slalom', cb: () => startRace('surf1') },
        { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pochacco', text: pick(['The lagoon wind is PERFECT. Ten out of ten. Maybe eleven.', 'Marina judges my surf style. She gives me sardines out of ten.']) }]) },
      ]);
    }
    return;
  }
  if (q === 6) {
    if (!S.flags.bikeRaceStarted) {
      dsay([
        { who: 'pochacco', text: 'LILA!! Welcome to POCHACCO\'S GARAGE & DIVE — vehicles, gear, and at least three kinds of zoom!' },
        { who: 'lila', text: 'The Queen says new islands are appearing. I\'m going to need to get around fast!' },
        { who: 'pochacco', text: 'Then you need WHEELS. This beach bike has extra-fat sand tires and a flower basket. She\'s yours — IF you can pass my totally official Beach Sprint. Ready?' },
      ], () => { S.flags.bikeRaceStarted = true; markSave(); dchoice('pochacco', 'Four flag gates, east down the beach. GO time?', [
        { label: '🏁 Let\'s race!', cb: () => startRace('bike1') },
        { label: 'One second…', alt: true, cb: () => {} },
      ]); });
    } else {
      dchoice('pochacco', 'The Beach Sprint awaits! Four gates, east down the beach!', [
        { label: '🏁 Let\'s race!', cb: () => startRace('bike1') },
        { label: 'One second…', alt: true, cb: () => {} },
      ]);
    }
    return;
  }
  if (q === 8 && invCount('boatpart') >= 3) {
    dsay([
      { who: 'pochacco', text: 'Rudder pin, pulley, mast ring — that\'s everything! Give me one afternoon and a LOT of snacks…' },
      { who: 'pochacco', text: '…okay it took four minutes, I\'m amazing. The S.S. Lila is READY TO SAIL! She\'s waiting at the dock!' },
      { who: 'lila', text: 'My own boat!! Shimmer Isle, Brooklyn, and now the whole SEA!' },
    ], () => {
      invTake('boatpart', 3);
      S.vehicles.boat = true; markSave();
      heart('pochacco');
      toast('⛵ The S.S. Lila is yours! Set sail at the dock!');
      advanceQuest(9);
    });
    return;
  }
  dchoice('pochacco', 'Hey hey, champ! Garage is open — gear, upgrades, races!', [
    { label: '🛒 Shop', cb: () => openShop('garage') },
    { label: '🏁 Beach Sprint', alt: true, cb: () => startRace('bike1') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pochacco', text: pick(['Fat tires float on sand. It\'s science. Beach science.', 'I waxed your boat. And my head. Shiny day!', 'Boardwalk Blitz is the big one — six gates. Gold medal = legend status.']) }]) },
  ]);
}
function talkPurin(q) {
  if (S.isle === 'volcano') {
    if (q === 35 && invCount('firefruit') >= 3) {
      dsay([
        { who: 'purin', text: 'Fire fruit! You found them! The hot spring chef promised me welcome stew and then fell asleep. I understood completely.' },
        { who: 'purin', text: '*sniff* Wait. Do you smell that? Something under the water is… singing? It made my pudding wobble in a MYSTERIOUS way.' },
        { who: 'lila', text: 'The silver song! It\'s close! Time to dive, Purin!' },
      ], () => { invTake('firefruit', 3); heart('purin'); addShells(15); advanceQuest(36); });
    } else {
      dsay([{ who: 'purin', text: pick(['This hot spring is the greatest nap of my LIFE.', 'Volcano pudding idea: warm bottom, cool top. I am a genius.', 'The bubbles go blub, blub, blub… ahhh.']) }]);
    }
    return;
  }
  if (q === 32 && S.flags.gotWheel) {
    dsay([
      { who: 'purin', text: 'My pudding cart wheel!! It rolled off in the storm and I chased it for almost four steps before nap time.' },
      { who: 'purin', text: 'You\'re my hero. Here — shells, and a lifetime discount on comfy things.' },
    ], () => { S.flags.gotWheel = false; markSave(); addShells(15); heart('purin'); advanceQuest(33); });
    return;
  }
  const opts = [
    { label: '🛒 Comfy Corner', cb: () => openShop('furniture') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'purin', text: pick(['Every home needs a rug. Rugs are naps for floors.', 'The cat bed is my finest work. Pusheen-tested. Purin-approved.', 'I sleep in the shop sometimes. For quality control.']) }]) },
  ];
  if (invCount('dish_pudding') > 0) opts.unshift({ label: '🍮 Give pudding', cb: () => { invTake('dish_pudding', 1); heart('purin'); addShells(10); AudioSys.sfx('heartS'); toast('💗 Pompompurin is SO happy! (+10 shells tip)'); } });
  dchoice('purin', 'Welcome to the Comfy Corner… *yawn*… everything is soft…', opts);
}
function talkKitty(q) {
  if (q === 3 && !S.flags.gotCottage) {
    dsay([
      { who: 'kitty', text: 'Lila!! Surprise time! All year, the whole island worked on something for you. Close your eyes… okay, don\'t, you need to walk. Come see!' },
      { who: 'kitty', text: 'The little cottage by the café… IT\'S YOURS! Your very own home on Shimmer Isle. Bed, window, and shelves for every treasure you\'ll ever find!' },
      { who: 'lila', text: 'A HOME?! On the island?! This is the best surprise in the history of surprises!!' },
      { who: 'kitty', text: 'Every explorer needs a harbor, sweet one. Now go try it! And take the coziest nap of your life — Queen Nerissa can wait until you\'ve rested.' },
    ], () => {
      S.flags.gotCottage = true; markSave();
      heart('kitty', 2);
      AudioSys.sfx('yay');
      toast('🏠 You got the Cottage! Go inside!');
      updateHUD();
    });
    return;
  }
  dsay([{ who: 'kitty', text: pick([
    'Your cottage chimney and my lighthouse say good morning to each other. I\'ve seen it.',
    'The Silver Tide isn\'t scary, I think. It feels like… an invitation.',
    'Six islands now! The sea got so much bigger, and so did our family.',
    'Bring Pusheen to visit! I\'ll hide the yarn. I will NOT hide the cookies.',
  ]) }]);
}
function talkSammy(q) {
  dchoice('sammy', 'Lila! Welcome to my Treasure Stand — everything shiny, most things useful!', [
    { label: '🛒 Shop', cb: () => openShop('toyshop') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'sammy', text: pick(['I retired from acorns. The treasure business is nuts anyway. HA!', 'The spyglass? Found it in a crate from the Silver Tide. Genuine mystery merchandise!', 'A squirrel, running a shop on a tropical island. Mom would be so proud.']) }]) },
  ]);
}
function buyIcecream() {
  dchoice('pigeon', 'Coo! Pearl\'s Ice Cream — coldest coo-nes on the boardwalk!', [
    { label: '🍦 Ice cream (🐚6)', cb: () => { if (S.shells < 6) { toast('Not enough shells! 🐚'); return; } addShells(-6); invAdd('icecream'); AudioSys.sfx('shellS'); toast('🍦 One scoop of Sea-Salt Swirl! Give it to a friend for a heart!'); } },
    { label: '🍋 Lemonade (🐚8)', cb: () => { if (S.shells < 8) { toast('Not enough shells! 🐚'); return; } addShells(-8); invAdd('lemonade'); AudioSys.sfx('shellS'); toast('🍋 Fresh lemonade!'); } },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pigeon', text: pick(['Coo! I flew to Brooklyn and back for this recipe. Worth it.', 'A pigeon CAN run an ice cream stand. I am the proof. Coo!']) }]) },
  ]);
}
function talkCoral(q) {
  dchoice('coral', 'Hello, land-sister! The tidepool boutique is open — come see what the sea made for you! 💗', [
    { label: '👗 Boutique', cb: () => openShop('boutique') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'coral', text: pick(['I sew with sea-silk and starlight. And a very small crab helps with buttons.', `You've found ${S.charms.length} seashell charms! Twelve, and I'll sew you a dress made of dawn.`, 'Marina loves the lagoon. I love the tidepools. Sisters need their own puddles.']) }]) },
  ]);
}
function talkMarina(q) {
  if (q === 22 && invCount('moonkelp') >= 5) {
    dsay([
      { who: 'marina', text: 'Five moon kelp, cut so gently — the garden thanks you. It glows brighter already.' },
      { who: 'marina', text: 'The lagoon has taken a liking to you. Go and see Pochacco at the shack above — I believe the wind has a gift in mind.' },
    ], () => { invTake('moonkelp', 5); heart('marina'); advanceQuest(23); });
    return;
  }
  dsay([{ who: 'marina', text: pick([
    'The singing grotto only sings for those who sing back.',
    'This lagoon is the sea\'s jewelry box. Please don\'t tell the tourists.',
    'The Silver Tide hums a note I haven\'t heard in a hundred years… a young note.',
  ]) }]);
}
function talkQueen(q) {
  if (q === 5) {
    dsay([
      { who: 'queen', text: 'Little song-bringer. One year, and the sea still tells stories about you. Welcome home.' },
      { who: 'lila', text: 'Your Majesty! The tide turned silver — and it left these singing shells — and I dreamed of a silver whale under a fire mountain!' },
      { who: 'queen', text: 'Then the dream and the tide agree. Far east, past the mist, an old island has woken: Ember Isle. Something there is calling, and the Silver Tide is its voice.' },
      { who: 'queen', text: 'Take this Tide Chart. The silver will reveal the islands one by one — follow it, friend of the sea. And you\'ll need a boat! I hear a certain white pup just opened a garage…' },
    ], () => {
      heart('coral'); heart('marina');
      AudioSys.sfx('quest');
      toast('🗺️ Got the Tide Chart! (Map button unlocked)');
      chapterCardShow(2, 'Wheels & Waves', () => advanceQuest(6, true) || toast(`📜 ${MQ[6].t}`));
    });
    return;
  }
  if (q === 30) {
    dsay([
      { who: 'queen', text: 'Two fragments of a tide-pearl… and a lighthouse that woke from a hundred-year sleep. Lila, these are pieces of the MOON PEARL — the first pearl, the deepest song, the mother of all six you rescued.' },
      { who: 'lila', text: 'The whale in my dream! It\'s guarding the Moon Pearl, isn\'t it? Under Ember Isle!' },
      { who: 'queen', text: 'And the Moon Pearl is cracked — that is why the tide runs silver. It is calling for help. Hurry home and rest, brave one. The sea feels… restless tonight.' },
    ], () => {
      S.flags.stormPending = true; markSave();
      advanceQuest(31, true);
      toast('⚠️ The sea feels strange… head up!');
    });
    return;
  }
  if (q === 37) {
    dsay([
      { who: 'queen', text: 'A scale of the Silver Whale calf… oh, little one. She is the Moon Pearl\'s last guardian, singing alone in the dark to keep it company.' },
      { who: 'lila', text: 'Alone? Then we\'ll go to her! But the ember deep is too far down, even with my biggest tank…' },
      { who: 'queen', text: 'Not for a friend of mermaids. Take my blessing once more — breathe as we breathe, forever this time. Find the last fragment. And Lila… sing to her gently. She has been lonely a very long while.' },
    ], () => {
      S.gear.blessing = true; markSave();
      G.flash = .6;
      AudioSys.sfx('pearl');
      burst(G.p.x, G.p.y, 'rgba(200,180,255,.95)', 40, { star: true, grav: -30, speed: 200 });
      toast('✨ Mermaid\'s Blessing — breathe underwater forever!');
      advanceQuest(38);
    });
    return;
  }
  dsay([{ who: 'queen', text: pick([
    'The six pearls you rescued still sing every night. Listen at the lighthouse — you\'ll hear them.',
    'The sea grows when hearts grow. Six islands now. Perhaps more someday.',
  ]) }]);
}
function talkInky(q) {
  dsay([{ who: 'inky', text: pick([
    'My anglerfish choir has LEARNED HARMONY. The deep has never sounded so dramatic!',
    'The Silver Tide? Musically speaking, it\'s a soprano. A very young, very lonely soprano.',
    'Eight arms and I STILL can\'t play the drums like those turtles. Respect.',
  ]) }]);
}
function petTalk() {
  if (S.mq === 41) { talkPusheen(41); return; }
  const opts = [
    { label: '🤗 Pet her', cb: () => { AudioSys.sfx('heartS'); burst(G.pet.x, gyAt(G.pet.x) - 40, '#FF9FBE', 8, { grav: -50, star: true }); toast(pick(['purrrrrrr.', 'Pusheen does a slow, happy blink.', 'maximum floof achieved.'])); } },
  ];
  if (invCount('treat') > 0) opts.unshift({ label: '🍪 Give a treat', cb: () => { invTake('treat', 1); S.pet.hearts = Math.min(5, S.pet.hearts + 1); heart('pusheen'); markSave(); AudioSys.sfx('heartS'); toast('Pusheen: mlem mlem mlem. 💗'); } });
  opts.push({ label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pusheen', text: pick(['I smell treasure sometimes. I will point with my whole body.', 'This island has excellent sun squares.', 'You walk fast. I respect it. I will not do it.']) }]) });
  dchoice('pusheen', 'mrrp?', opts);
}
function talkPusheen(q) {
  if (q === 11 && (invCount('dish_reefroll') || invCount('dish_tart'))) {
    const dish = invCount('dish_reefroll') ? 'dish_reefroll' : 'dish_tart';
    dsay([
      { who: 'pusheen', text: 'zzz… zzz… …sniff. …SNIFF SNIFF.' },
      { who: 'lila', text: 'Fresh from My Melody\'s café! Careful, it\'s still warm!' },
      { who: 'pusheen', text: '*chomp* …mlem. You have excellent taste in snacks AND islands. I\'m Pusheen. I nap here. I also nap other places. It\'s a lifestyle.' },
      { who: 'lila', text: 'I\'m Lila! I\'m following the Silver Tide — did anything strange wash up here?' },
      { who: 'pusheen', text: 'Mmhm. The tide sings while I nap. Little silver songs. Stay for a picnic and I\'ll tell you everything I dream about it.' },
    ], () => {
      invTake(dish, 1);
      S.flags.pusheenAwake = true; markSave();
      heart('pusheen');
      advanceQuest(12);
    });
    return;
  }
  if (q === 12 && hasItems({ blueberry: 6, coconut: 2 })) {
    dsay([
      { who: 'pusheen', text: 'Blueberries AND coconuts. This is the greatest day of my nine lives. Picnic time!!' },
      { who: 'pusheen', text: '*munch* Okay. The dream: a little silver fish sings outside my float every night. It learned the song from a GREAT BIG silver singer, far away east. It\'ll sing for you too — if you catch it nicely.' },
      { who: 'lila', text: 'A silver sardine! I\'ll find it in the shallows!' },
    ], () => { takeItems({ blueberry: 6, coconut: 2 }); heart('pusheen'); advanceQuest(13); });
    return;
  }
  if (q === 13 && invCount('sardine')) {
    dsay([
      { who: 'pusheen', text: '*whispers* that\'s the one. Hold it up… listen…' },
      { who: 'lila', text: 'It\'s humming! The same tune as the silver shells — it IS all one song!' },
      { who: 'pusheen', text: 'Told you. Naps make you wise. Here — half a treasure map I found in a donut box. Adventurers share. It\'s the law of snacks.' },
    ], () => {
      heart('pusheen');
      gainMapPiece('m1a');
      chapterCardShow(4, 'Turtle Island', () => advanceQuest(14, true) || toast(`📜 ${MQ[14].t}`));
    });
    return;
  }
  if (q === 18) {
    dsay([
      { who: 'pusheen', text: '…hi. I sailed here in a soup pot. Don\'t ask. Okay, ask: I missed you. And your island smells like tarts ALL THE TIME.' },
      { who: 'lila', text: 'Pusheen!! Are you… moving to Shimmer Isle?!' },
      { who: 'pusheen', text: 'I\'m moving in with YOU, roommate. I require: one cat bed, warm sun square, occasional treats. In exchange: I am fluffy, and I can smell buried treasure. It\'s my only sport.' },
      { who: 'lila', text: 'DEAL! Purin sells the coziest cat beds — I\'ll get one right now!' },
    ], () => { heart('pusheen'); advanceQuest(19); });
    return;
  }
  if (q === 41) {
    dsay([
      { who: 'pusheen', text: 'Cater the Moon Pearl festival? *stands up* *actually stands up* I\'ve trained my whole life for this.' },
      { who: 'pusheen', text: 'Donuts for the turtles. Tarts for the mermaids. And for the Moon Pearl… the moon is round. Donuts are round. I see no problems, only friends.' },
    ], () => {
      heart('pusheen');
      dsay([
        { who: 'lila', text: 'Cake, drums, snacks… everyone\'s ready. Okay, sea. One more dive. The deepest one. Let\'s go and heal the Moon Pearl!' },
      ], () => advanceQuest(42));
    });
    return;
  }
  dchoice('pusheen', 'mlem. Snack Shack\'s open. Honor system: pay in shells or excellent chin scratches.', [
    { label: '🛒 Snacks', cb: () => openShop('snackshack') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pusheen', text: pick(['Current mood: loaf.', 'I dreamed I was a donut. Honestly? No notes.', 'Your cottage sun square at 3pm is elite napping real estate.']) }]) },
  ]);
}
function talkLeo(q) {
  if (q === 15) {
    dsay([
      { who: 'leo', text: 'A visitor! Welcome to our dojo, traveler. I\'m Leonardo. The sea carried our whole dojo here on the Silver Tide — one week we\'re in a sewer, next week: BEACH.' },
      { who: 'raph', text: 'Best. Tide. Ever.' },
      { who: 'lila', text: 'I\'m Lila! I\'m following the silver song east. The mermaid queen said it comes from beyond your island!' },
      { who: 'leo', text: 'Then you\'ll need a focused mind for what\'s out there. Our masters taught us: calm sea, calm heart. Pass our trainings and we\'ll share what the tide whispered to US.' },
    ], () => { heart('turtles'); advanceQuest(16); });
    return;
  }
  if (q === 40) {
    dsay([
      { who: 'leo', text: 'Festival drums for the Moon Pearl? Brothers — DRUM FORMATION!' },
      { who: 'mikey', text: 'Boom boom BOOM! I call the big one!' },
      { who: 'donnie', text: 'Technically they\'re taiko drums, and technically I\'m SO excited.' },
      { who: 'raph', text: 'We\'ll shake the whole beach. In a good way.' },
    ], () => { heart('turtles'); advanceQuest(41); });
    return;
  }
  dsay([{ who: 'leo', text: pick(['Balance in all things. Especially pizza toppings.', 'Train a little every day — even naps count, if you nap with focus.', 'The sea took us in like family. Islands do that.']) }]);
}
function talkRaph(q) {
  dsay([{ who: 'raph', text: pick(['You ride that bike like it owes you shells. Respect.', 'Tough on the outside, big softie on the inside. The coconut and me both.', 'Rematch on the balance beam. Anytime. I\'ll win. Probably.']) }]);
}
function talkMikey(q) {
  if (q === 17 && invCount('dish_pizza') >= 2) {
    dsay([
      { who: 'mikey', text: 'PIZZA!! Still warm!! Across an ENTIRE OCEAN!! Dude. DUDE. You\'re officially my hero forever.' },
      { who: 'leo', text: 'Then it\'s time we shared the legend. Gather round…' },
      { who: 'leo', text: 'Long ago, the FIRST pearl — the MOON PEARL — sang the sea to sleep each night, from a chamber under the fire mountain. When it cracked, its lullaby became the Silver Tide: a call for help, drifting on every current.' },
      { who: 'donnie', text: 'Our masters said only a heart the sea already trusts could ever reach it. Sooo… that\'s you. That\'s extremely you.' },
    ], () => {
      invTake('dish_pizza', 2);
      heart('turtles');
      chapterCardShow(5, 'A Friend for the Cottage', () => advanceQuest(18, true) || toast(`📜 ${MQ[18].t}`));
    });
    return;
  }
  dsay([{ who: 'mikey', text: pick(['Pizza thought: mango belongs. I said what I said.', 'Cowabunga is a feeling, dude. The ocean gets it.', 'Pusheen out-ate me once. ONCE.']) }]);
}
function talkDonnie(q) {
  if (q === 16) {
    dchoice('donnie', 'Training menu! Focus first — reflex training with Leonardo\'s lantern. Then memory — echo my drum pattern! Ready?', [
      { label: '🎯 Focus training', cb: () => startTrain('reflex', 'leo', () => {
        AudioSys.sfx('yay');
        dsay([{ who: 'donnie', text: 'Focus: confirmed! Now the memory drums — listen, then echo!' }], () =>
          startRhythm({ rounds: [3, 4], who: 'donnie', onWin: () => {
            heart('turtles');
            dsay([
              { who: 'donnie', text: 'Both trainings passed on day one?! Statistically remarkable. Officially: welcome to the dojo family, Lila!' },
              { who: 'mikey', text: 'Family dinner is PIZZA. It\'s always pizza. Which reminds me — we haven\'t had a real one since the tide moved us…' },
            ], () => advanceQuest(17));
          } }));
      }) },
      { label: 'Not yet', alt: true, cb: () => {} },
    ]);
    return;
  }
  if (q === 33) {
    dchoice('donnie', 'Storm cleanup complete — the island thanks you! Final training: BALANCE. Twelve seconds on the wobble beam. Then… headband ceremony. 🐢', [
      { label: '🌀 Balance training', cb: () => startTrain('balance', 'raph', () => {
        heart('turtles');
        dsay([
          { who: 'raph', text: 'TWELVE SECONDS! Kid\'s got sea legs!' },
          { who: 'leo', text: 'Lila of Shimmer Isle: you\'ve passed focus, memory, and balance. Choose your headband — you\'ve earned your colors.' },
        ], () => dchoice('leo', 'Choose your headband! (You can buy the others later — and each one has a little power!)', [
          { label: '💙 Blue (swim+)', cb: () => giveHeadband('hb_blue') },
          { label: '❤️ Red (bike+)', cb: () => giveHeadband('hb_red') },
          { label: '🧡 Orange (cook+)', cb: () => giveHeadband('hb_orange') },
          { label: '💜 Purple (secrets+)', cb: () => giveHeadband('hb_purple') },
        ]));
      }) },
      { label: 'Not yet', alt: true, cb: () => {} },
    ]);
    return;
  }
  dsay([{ who: 'donnie', text: pick(['I\'m building a wave-powered pizza oven. For science. And pizza.', 'The Silver Tide\'s song is exactly 432 hertz of lovely.', 'Purple headband wearers see 23% more secrets. I made that number up. It feels right though.']) }]);
}
function giveHeadband(id) {
  S.ownedHat.push(id); S.outfit.hat = id; markSave();
  AudioSys.sfx('yay');
  burst(G.p.x, gyAt(G.p.x) - 80, '#7FE08C', 20, { star: true, grav: -50 });
  toast(`🐢 ${HATS[id].n} — you're one of the family now!`);
  if (!S.mapPieces.includes('m3b')) gainMapPiece('m3b');
  chapterCardShow(9, 'Ember Isle', () => advanceQuest(34, true) || toast(`📜 ${MQ[34].t}`));
}
function talkGlimmer(q) {
  if (q === 28 && S.flags.beaconLit) {
    dsay([
      { who: 'glimmer', text: '…light! LIGHT! Oh, hello!! I\'m Glimmer — I kept this lighthouse for a hundred years, and then the fog swallowed us, and I got so small and dim and forgetful…' },
      { who: 'lila', text: 'You\'ve been here alone for a HUNDRED YEARS?!' },
      { who: 'glimmer', text: 'Time is soft in the fog. But YOU brought the light back! And now I remember — I was keeping something safe. Something that fell from the Moon, into the sea cave behind the tower. Take your lantern. It\'s yours now, brave one.' },
    ], () => { advanceQuest(29); });
    return;
  }
  dsay([{ who: 'glimmer', text: pick([
    'The beacon and I hum together at night. We\'re a little choir of two!',
    'Fog isn\'t empty, you know. It\'s full of sleepy stories.',
    'Say hello to the other lighthouse for me — the red-striped one. We\'re pen pals now. Light pals!',
  ]) }]);
}

/* ── pickups / actions ───────────────────────────────────── */
function shakeTree(tr) {
  if (tr.have <= 0) return;
  tr.have--; tr.shake = 1;
  AudioSys.sfx('tap');
  const gy = gyAt(tr.x);
  fallingFruit.push({
    kind: tr.kind, x: tr.x + rnd(-30, 30), y: gy - (tr.kind === 'blueberry' ? 46 : 160),
    vx: rnd(-30, 30), vy: 0, bounces: 0, life: 3, taken: false,
  });
}
function takeLandPickup(pk) {
  AudioSys.sfx('pickup');
  if (pk.kind === 'silvershell') {
    S.flags['ss' + pk.i] = true; invAdd('silvershell');
    burst(pk.x, gyAt(pk.x) - 10, 'rgba(220,235,255,.95)', 12, { grav: -40 });
    toast(`🐚 Silver shell! (${invCount('silvershell')}/5) — it's humming!`);
  } else if (pk.kind === 'boatpart') {
    S.flags['bp' + pk.i] = true; invAdd('boatpart');
    toast(`⚙️ Boat part! (${invCount('boatpart')}/3)`);
  } else if (pk.kind === 'plank') {
    S.flags[pk.i] = true; invAdd('plank');
    toast(`🪵 Driftwood! (have ${invCount('plank')})`);
  } else if (pk.kind === 'prism') {
    S.flags['pr' + pk.i] = true; invAdd('prism');
    AudioSys.sfx('twinkle');
    toast(`🔷 Lamp prism! (${invCount('prism')}/4)`);
  } else if (pk.kind === 'wheel') {
    S.flags.gotWheel = true;
    toast('☸️ Found Purin\'s cart wheel!');
  } else if (pk.kind === 'mappiece') {
    gainMapPiece(pk.piece);
  } else if (pk.kind === 'charm') {
    S.charms.push(pk.id); markSave();
    AudioSys.sfx('ding');
    burst(pk.x, gyAt(pk.x) - 10, '#FF8FB1', 14, { star: true, grav: -30 });
    toast(`🐚 Seashell charm! (${S.charms.length}/12)`);
    if (S.charms.length >= 12 && !S.ownedDress.includes('aurora')) {
      S.ownedDress.push('aurora'); S.outfit.dress = 'aurora'; markSave();
      AudioSys.sfx('yay');
      setTimeout(() => toast('🌈 ALL 12 CHARMS! Coral sewed you the AURORA DRESS!'), 1400);
    }
  }
  markSave(); updateHUD();
}
function gainMapPiece(piece) {
  if (S.mapPieces.includes(piece)) return;
  S.mapPieces.push(piece); markSave();
  AudioSys.sfx('ding');
  const mapId = piece.slice(0, 2);
  const m = TMAPS.find(m2 => m2.id === mapId);
  if (mapComplete(mapId)) {
    AudioSys.sfx('yay');
    toast(`🗺️ ${m.n} COMPLETE! X marks a spot on ${ISLES[m.isle].name}!`);
  } else toast(`🧩 Treasure map piece! (${m.n}: 1/2)`);
}
function digTreasure(mapId) {
  const m = TMAPS.find(m2 => m2.id === mapId);
  AudioSys.sfx('dashS');
  G.shakeT = .3; G.shakeAmp = 4;
  burst(m.x, gyAt(m.x), 'rgba(242,220,168,.9)', 24, { grav: 160, speed: 200 });
  setTimeout(() => {
    S.dug.push(mapId); markSave();
    AudioSys.sfx('yay');
    G.flash = .4;
    let msg = `💰 TREASURE! +${m.reward.shells} shells`;
    addShells(m.reward.shells);
    if (m.reward.dress && !S.ownedDress.includes(m.reward.dress)) { S.ownedDress.push(m.reward.dress); msg += ` + the ${DRESSES[m.reward.dress].n} dress!`; }
    if (m.reward.furn && !S.ownedFurn.includes(m.reward.furn)) { S.ownedFurn.push(m.reward.furn); msg += ` + a ${FURN[m.reward.furn].n}!`; }
    if (m.reward.flag) { S.flags[m.reward.flag] = true; msg += ' + a GOLDEN bike bell!'; }
    if (m.reward.charm) msg += ' (What a haul!)';
    markSave();
    toast(msg);
    updateHUD();
  }, 700);
}
function gainFragment(i) {
  S.frags[i] = true; markSave();
  AudioSys.sfx('pearl');
  G.flash = .5;
  burst(G.p.x, G.p.y || gyAt(G.p.x) - 40, 'rgba(200,230,255,.95)', 30, { grav: -50, star: true, size: 5 });
  toast(`🩵 Tide-Pearl Fragment! (${S.frags.filter(Boolean).length}/3)`);
  updateHUD();
  if (i === 1) { // mist cave
    setTimeout(() => {
      chapterCardShow(8, 'The Silver Storm', () => advanceQuest(30, true) || toast(`📜 ${MQ[30].t}`));
    }, 1200);
  }
  if (i === 2) {
    setTimeout(() => {
      chapterCardShow(10, 'The Moon Pearl', () => advanceQuest(39, true) || toast(`📜 ${MQ[39].t}`));
    }, 1200);
  }
  saveGame();
}
function relightBeacon() {
  invTake('prism', 4);
  S.flags.beaconLit = true; markSave();
  AudioSys.sfx('pearl');
  G.flash = .7;
  burst(2800, gyAt(2800) - 300, 'rgba(255,240,190,.95)', 40, { grav: -20, star: true, size: 6, speed: 220 });
  sprCache.lighthouse2 = null; // rebuild un-fogged? (kept same look; beam draws at night)
  dsay([
    { who: 'lila', text: 'Four prisms, one lamp… light UP!' },
    { who: 'lila', text: 'WOW!! The whole fog is turning to gold and — wait. Something small and sparkly is coming down the stairs…!' },
  ], () => { advanceQuest(28); setTimeout(() => talkGlimmer(28) || 0, 400); S.flags.beaconLit = true; });
}
function caveTreasure() {
  AudioSys.sfx('twinkle');
  dsay([
    { who: 'lila', text: 'The lantern light… it\'s bouncing off something at the back of the cave. Moon-white and shimmering…' },
  ], () => {
    gainMapPiece('m3a');
    gainFragment(1);
  });
}
function quest7Done() {
  AudioSys.sfx('yay');
  dsay([
    { who: 'lila', text: 'WHEEEEE!! Did the seagulls see that?! I was FLYING!' },
  ], () => advanceQuest(8));
}
function checkFishMilestones() {
  const seen = FISH.filter(f => S.seen[f.id]).length;
  [[8, 'fm8', 15], [16, 'fm16', 30], [26, 'fm26', 80]].forEach(([n, flag, pay]) => {
    if (seen >= n && !S.flags[flag]) {
      S.flags[flag] = true; markSave();
      addShells(pay);
      setTimeout(() => { AudioSys.sfx('yay'); toast(`📖 Sea life journal: ${n} creatures! The mermaids send ${pay} shells! 🐚`); }, 1500);
    }
  });
}

/* ── event triggers ──────────────────────────────────────── */
function onSurfaced() {
  if (S.flags.stormPending) {
    S.flags.stormPending = false; markSave();
    setTimeout(() => stormScene(), 600);
  }
  if (S.mq === 42 && S.flags.pearlHealed) {
    setTimeout(() => finaleScene(), 600);
  }
}
function onArrive(isleId) {
  if (isleId === 'snack' && S.mq === 10) {
    setTimeout(() => dsay([
      { who: 'lila', text: 'Palm trees with pink leaves… a giant donut floating in the bay… and is that SNORING? Somebody lives here!' },
    ], () => advanceQuest(11)), 900);
  }
  if (isleId === 'turtle' && S.mq === 14) {
    setTimeout(() => dsay([
      { who: 'lila', text: 'A dojo! On a beach! With a turtle banner! This is already the coolest island ever.' },
    ], () => advanceQuest(15)), 900);
  }
  if (isleId === 'lagoon' && S.mq === 21) {
    setTimeout(() => dsay([
      { who: 'lila', text: 'The water here is like glass made of light… Marina must LOVE it. Time to dive and say hello!' },
    ], () => advanceQuest(22)), 900);
  }
  if (isleId === 'mist' && S.mq === 26) {
    setTimeout(() => dsay([
      { who: 'lila', text: 'Brrr… the fog is so thick I can barely see my own braids. There\'s an old lighthouse up ahead — dark and quiet. Maybe THAT\'s why this island got lost!' },
    ], () => advanceQuest(27)), 900);
  }
  if (isleId === 'volcano' && S.mq === 34) {
    setTimeout(() => dsay([
      { who: 'lila', text: 'Ember Isle… warm sand, glowing mountain, and — is that POMPOMPURIN in a hot spring?!' },
    ], () => advanceQuest(35)), 900);
  }
  if (isleId === 'home' && S.mq === 18) {
    setTimeout(() => toast('🐾 Someone small and round is waiting at the dock…'), 900);
  }
}
function landQuestTriggers() {
  if (G.busy) return;
  // quest 20: walking the beach with pusheen
  if (S.mq === 20 && S.isle === 'home' && S.pet.adopted && Math.abs(G.p.x - 1900) < 120 && !S.flags.dig1) {
    S.flags.dig1 = true; markSave();
    dsay([
      { who: 'pusheen', text: '*freezes* *sniff sniff* …STOP. Treasure. Right here. Under the sand. My whiskers are 100% sure.' },
      { who: 'lila', text: 'Really?! Then we dig! Good thing Pochacco left this little shovel with the bike!' },
    ], () => {
      S.flags.shovel = true; S.gear.shovel = true; markSave();
      AudioSys.sfx('dashS');
      burst(1900, gyAt(1900), 'rgba(242,220,168,.9)', 20, { grav: 160, speed: 180 });
      setTimeout(() => {
        AudioSys.sfx('ding');
        dsay([
          { who: 'lila', text: 'A little box! And inside… another map piece! Pusheen, you\'re a genius. A fluffy, sleepy genius.' },
          { who: 'pusheen', text: 'I accept payment in treats.' },
        ], () => {
          gainMapPiece('m1b');
          chapterCardShow(6, 'The Mermaid Lagoon', () => advanceQuest(21, true) || toast(`📜 ${MQ[21].t}`));
        });
      }, 800);
    });
  }
}
function diveQuestTriggers() {
  if (G.busy || !G.dive || G.dive.rescue) return;
  const p = G.p, d = G.dive;
  // q5: queen intro
  if (S.mq === 5 && d.map === 'home' && !S.flags.queenMet2 && dist(p.x, p.y, 1150, 520) < 240) {
    S.flags.queenMet2 = true; markSave();
    talkQueen(5);
  }
  // q25: the singing grotto
  if (S.mq === 25 && d.map === 'lagoon' && !S.flags.grottoDone && dist(p.x, p.y, 1500, 1150) < 220) {
    S.flags.grottoDone = true; markSave();
    dsay([
      { who: 'marina', text: 'You came! Listen — the grotto is singing the Silver Tide\'s song. Coral and I have tried to echo it for weeks… but it wants a land-heart\'s voice too.' },
      { who: 'lila', text: 'Then let\'s sing it together. All of us!' },
    ], () => startRhythm({
      rounds: [3, 4, 5], who: 'marina',
      onWin: () => {
        dsay([
          { who: 'marina', text: 'The grotto is opening! Lila — LOOK! A piece of pearl, bright as a little moon!' },
          { who: 'lila', text: 'It\'s like the Song Pearls… but older. And it\'s crying the silver song. We HAVE to find the rest of it.' },
          { who: 'marina', text: 'Then follow the tide east, brave one. Past the fog. We\'ll be singing behind you the whole way.' },
        ], () => {
          gainFragment(0);
          chapterCardShow(7, 'Foglight Isle', () => advanceQuest(26, true) || toast(`📜 ${MQ[26].t}`));
        });
      },
    }));
  }
  // q36: the silver whale calf
  if (S.mq === 36 && d.map === 'ember' && d.calf && !d.calf.fled && dist(p.x, p.y, d.calf.x, d.calf.y) < 260) {
    d.calf.fled = true;
    S.flags.gotScale = true; markSave();
    AudioSys.sfx('twinkle');
    burst(d.calf.x, d.calf.y, 'rgba(220,235,255,.95)', 30, { star: true, grav: -20, speed: 240 });
    dsay([
      { who: 'lila', text: 'A little silver whale!! Hello! HELLO! I heard your song, I came as fast as—' },
      { who: 'lila', text: '…she\'s gone. Fast as a shooting star. But she left a scale — it\'s glowing like moonlight. The Queen needs to see this!' },
    ], () => advanceQuest(37));
  }
}
/* ============================================================
   CUTSCENES — cinematic story moments
   ============================================================ */
function startCutscene(sc) {
  G.cutscene = sc;
  sc.idx = -1; sc.t = 0;
  refreshBusy();
  document.body.classList.add('cine');
  $('skipBtn').style.display = sc.noSkip ? 'none' : 'block';
  cutNext();
}
function cutNext() {
  const sc = G.cutscene;
  sc.idx++;
  sc.t = 0;
  if (sc.idx >= sc.steps.length) { endCutscene(); return; }
  const st = sc.steps[sc.idx];
  $('subT').style.display = st.sub ? 'block' : 'none';
  if (st.sub) $('subT').textContent = st.sub;
  if (st.on) st.on(sc);
}
function endCutscene() {
  const sc = G.cutscene;
  if (!sc) return;
  G.cutscene = null;
  document.body.classList.remove('cine');
  $('skipBtn').style.display = 'none';
  $('subT').style.display = 'none';
  refreshBusy();
  if (sc.done) sc.done();
}
$('skipBtn').onclick = () => { AudioSys.sfx('tap'); endCutscene(); };
function updateCutscene(dt) {
  const sc = G.cutscene;
  if (!sc) return;
  sc.t += dt;
  const st = sc.steps[sc.idx];
  if (st && sc.t >= st.d) cutNext();
}

/* ── INTRO: the return voyage ────────────────────────────── */
function introScene() {
  const oldSave = songOfSeaSave();
  const sc = {
    full: true,
    data: {},
    steps: [
      { d: 4.6, sub: 'One whole year after the Great Song came home…' },
      { d: 4.6, sub: '…a letter arrived in Brooklyn, smelling of salt and strawberry frosting: "Festival time! Come home to Shimmer Isle! 💌"' },
      { d: 4.4, sub: 'Lila didn\'t even finish reading before she was packing.', on: s => { s.data.shot = 1; AudioSys.sfx('splash'); } },
      { d: 4.6, sub: 'But halfway across the sea, the water turned to moonlight — a SILVER TIDE, humming a song she\'d never heard…' },
      { d: 4.8, sub: 'Shimmer Isle, dead ahead! And out beyond it, in the silver mist… were those NEW islands?! ✨', on: s => { s.data.shot = 2; AudioSys.sfx('yay'); } },
    ],
    done: () => {
      G.mode = 'land';
      S.isle = 'home';
      G.p.x = 480; G.cam.x = 0;
      G.tod = .34; S.tod = .34;
      // Lila keeps her old dive gear from the first adventure
      S.gear.snorkel = true; S.gear.compass = true; S.gear.tank1 = true; S.gear.lantern = true;
      if (oldSave && oldSave.started) {
        S.flags.welcomeGift = true;
        S.shells += 25;
        if (!S.ownedHat.includes('bow')) S.ownedHat.push('bow');
      }
      markSave();
      AudioSys.play('island', 2);
      AudioSys.ambience('island');
      $('hud').style.display = 'flex';
      if (IS_TOUCH) $('touch').style.display = 'block';
      chapterCardShow(1, 'The Silver Tide', () => {
        updateHUD();
        toast('⭐ ' + questHint());
        if (S.flags.welcomeGift) setTimeout(() => toast('💝 Welcome back, Song-Bringer! (+25 shells & a red bow — from your last adventure!)'), 3600);
        saveGame();
      });
    },
    draw: drawIntro,
  };
  S.started = true; markSave();
  startCutscene(sc);
}
function drawIntro(sc) {
  const shot = sc.data.shot || 0;
  const t = G.t;
  if (shot === 0) {
    // cozy Brooklyn morning, letter
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#FFD9A0'); g.addColorStop(1, '#FFEFD8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#C9A88C';
    for (let i = 0; i < 14; i++) {
      const bw = 60 + n1(i * 9.1) * 80, bh = 90 + n1(i * 4.7) * 200;
      ctx.fillRect(i * VW / 13 - 30, VH * .82 - bh, bw, bh);
    }
    ctx.fillStyle = '#B08A6A'; ctx.fillRect(0, VH * .82, VW, VH * .18);
    ctx.save(); ctx.translate(VW * .3, VH * .82); ctx.scale(1.4, 1.4);
    drawLila(ctx, t, { face: 1, walk: 0, outfit: 'red', hat: null });
    ctx.restore();
    ctx.save(); ctx.translate(VW * .3 + 90, VH * .82 - 20); ctx.scale(1.4, 1.4);
    PAINT.pigeon(ctx, t, {});
    ctx.restore();
    if (sc.idx >= 1) {
      const a = clamp(sc.t / .8, 0, 1);
      ctx.globalAlpha = a;
      const lw = Math.min(460, VW * .66), lh = lw * .56;
      rr(ctx, VW / 2 - lw / 2, VH * .12, lw, lh, 18);
      ctx.fillStyle = '#FFF8EC'; ctx.fill();
      ctx.strokeStyle = '#F26D99'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#C0574A';
      ctx.font = `italic 800 ${lw / 20}px ui-rounded, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Dear Lila — festival time!', VW / 2, VH * .12 + lh * .3);
      ctx.fillText('Come home to Shimmer Isle!', VW / 2, VH * .12 + lh * .55);
      ctx.fillText('— everyone 💗', VW / 2, VH * .12 + lh * .82);
      ctx.globalAlpha = 1;
    }
  } else if (shot === 1) {
    // sailing through the silver tide
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#4A5C8C'); g.addColorStop(.5, '#7B8FC4');
    g.addColorStop(.51, '#8FA8CC'); g.addColorStop(1, '#3E5474');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    glow(ctx, VW * .75, VH * .18, 90, rgba(230, 235, 255), .6);
    ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(VW * .75, VH * .18, 32, 0, TAU); ctx.fill();
    // silver waves
    for (let L = 0; L < 4; L++) {
      const wy = VH * (.55 + L * .11);
      ctx.fillStyle = `rgba(220,232,255,${.12 + L * .07})`;
      ctx.beginPath(); ctx.moveTo(0, VH);
      for (let x = 0; x <= VW; x += 22) ctx.lineTo(x, wy + Math.sin(x * .015 + t * (1.4 + L * .3) + L * 2) * 10);
      ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
    }
    // sparkles drifting on the water
    for (let i = 0; i < 26; i++) {
      const sx = (n1(i * 5.1) * VW + t * 30 * (0.5 + n1(i))) % VW;
      const sy = VH * (.56 + n1(i * 3.3) * .38);
      ctx.fillStyle = `rgba(228,240,255,${.4 + .5 * Math.sin(t * 3 + i * 2)})`;
      starPath(ctx, sx, sy, 3.6, 1.7); ctx.fill();
    }
    ctx.save();
    ctx.translate(VW * .4 + Math.sin(t * .4) * 12, VH * .6 + Math.sin(t * 1.5) * 8);
    drawSailboat(ctx, t, {});
    ctx.restore();
  } else {
    // arrival: archipelago reveal
    const p = clamp(sc.t / 4, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#FF9E7D'); g.addColorStop(.5, '#FFD9A0'); g.addColorStop(.51, '#2E86B0'); g.addColorStop(1, '#155C84');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    glow(ctx, VW * .32, VH * .5, 160, rgba(255, 240, 200), .5);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(VW * .32, VH * .5, 40, 0, TAU); ctx.fill();
    // home isle big
    ctx.fillStyle = '#2E6E54';
    ctx.beginPath(); ctx.moveTo(VW * .05, VH * .52);
    ctx.quadraticCurveTo(VW * .18, VH * .36, VW * .3, VH * .46);
    ctx.quadraticCurveTo(VW * .42, VH * .3, VW * .52, VH * .52);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E8DAC4'; ctx.fillRect(VW * .44, VH * .35, 9, 40);
    ctx.fillStyle = '#C0574A'; ctx.fillRect(VW * .435, VH * .34, 12, 9);
    // new isles in silver mist
    ctx.globalAlpha = p;
    [[.62, .07, 44], [.74, .09, 56], [.85, .06, 40], [.95, .12, 70]].forEach(([fx, fh, fw], i) => {
      ctx.fillStyle = `rgba(160,185,205,${.75 - i * .1})`;
      ctx.beginPath(); ctx.moveTo(VW * fx - fw, VH * .52);
      if (i === 3) { ctx.lineTo(VW * fx - 10, VH * (.52 - fh * 1.8)); ctx.lineTo(VW * fx + 12, VH * (.52 - fh * 1.5)); }
      else ctx.quadraticCurveTo(VW * fx, VH * (.52 - fh), VW * fx + fw * .4, VH * (.52 - fh * .5));
      ctx.lineTo(VW * fx + fw, VH * .52); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = `rgba(215,228,240,${.4 * p})`;
    ctx.beginPath(); ctx.ellipse(VW * .78, VH * .45, VW * .3, VH * .13, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 18; i++) {
      const a = .4 + .6 * Math.sin(t * 3 + i * 2.1);
      ctx.fillStyle = `rgba(255,255,220,${a * p})`;
      starPath(ctx, n1(i * 5.3) * VW, n1(i * 8.7) * VH * .5, 4, 2); ctx.fill();
    }
    ctx.save();
    ctx.translate(VW * .3 + p * VW * .06, VH * .68 + Math.sin(t * 1.5) * 7);
    ctx.scale(.8, .8);
    drawSailboat(ctx, t, {});
    ctx.restore();
  }
}

/* ── ADOPTION: Pusheen moves in ──────────────────────────── */
function adoptionScene() {
  startCutscene({
    noSkip: true,
    steps: [
      { d: 2.4, sub: 'One cozy cat bed, placed in the perfect sun square…', on: () => AudioSys.sfx('ding') },
      { d: 3, sub: '*pat pat pat* …a small round gray shape pads through the door…', on: () => AudioSys.sfx('step') },
      { d: 3.4, sub: 'Pusheen circles the bed once. Twice. Flops. Purrs like a tiny motorboat. 💗', on: () => { AudioSys.sfx('heartS'); } },
    ],
    draw: sc => {
      // spotlight on the cat bed inside the house
      const cbSlot = Object.entries(S.house).find(([, f]) => f === 'catbed');
      const px = (cbSlot ? SLOT_X[cbSlot[0]] : 640) - G.cam.x;
      const fy = houseFloorY();
      ctx.fillStyle = 'rgba(10,12,30,.45)'; ctx.fillRect(0, 0, VW, VH);
      glow(ctx, px, fy - 30, 130, rgba(255, 230, 180), .4);
      drawFurniture('catbed', px, fy);
      if (sc.idx >= 1) {
        const walk = sc.idx === 1 ? clamp(sc.t / 2.4, 0, 1) : 1;
        ctx.save();
        ctx.translate(lerp(90 - G.cam.x, px, ease(walk)), fy - (sc.idx >= 2 ? 10 : 0));
        ctx.scale(.72, .72);
        PAINT.pusheen(ctx, G.t, { face: 1, sleep: sc.idx >= 2 });
        ctx.restore();
      }
      if (sc.idx >= 2) {
        for (let i = 0; i < 5; i++) {
          const hp = ((G.t * .6 + i * .2) % 1);
          ctx.globalAlpha = 1 - hp;
          ctx.font = `${12 + hp * 10}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('💗', px + Math.sin(i * 2.2) * 40, fy - 60 - hp * 60);
        }
        ctx.globalAlpha = 1;
      }
    },
    done: () => {
      S.pet.adopted = true; markSave();
      heart('pusheen', 2);
      G.pet.x = G.p.x - 70;
      AudioSys.sfx('yay');
      toast('🐾 Pusheen lives here now! She\'ll follow you everywhere!');
      advanceQuest(20);
    },
  });
}

/* ── STORM ───────────────────────────────────────────────── */
function stormScene() {
  startCutscene({
    steps: [
      { d: 2.6, sub: 'That night, the Silver Tide rose and rose — and the sky went dark…', on: () => { AudioSys.play('storm', 1); G.weather.target = 1; G.weather.rain = .5; G.weather.next = 999; } },
      { d: 3, sub: '⚡ The SILVER STORM — the Moon Pearl, crying out across every island at once! ⚡', on: () => { AudioSys.sfx('thunder'); G.shakeT = .8; G.shakeAmp = 9; G.flash = .7; } },
      { d: 2.6, sub: 'Everyone held on. Even the lighthouse hid its light.', on: () => { AudioSys.sfx('thunder'); G.flash = .5; G.shakeT = .5; G.shakeAmp = 6; } },
      { d: 3.6, sub: '…but six islands full of friends are stronger than any storm. Time to fix things up — and finish this quest. 🌈', on: () => { G.weather.target = 0; G.weather.rain = 0; G.weather.next = 150; AudioSys.play(isNight() ? 'night' : 'island', 3); } },
    ],
    done: () => {
      toast(`📜 ${MQ[31].t}`);
      AudioSys.sfx('quest');
    },
  });
}

/* ── MOON PEARL: the deep descent & healing ──────────────── */
function moonPearlScene() {
  dsay([
    { who: 'lila', text: 'The Moon Pearl… it\'s enormous. And the crack — I can hear the silver song pouring out of it like tears.' },
    { who: 'queen', text: 'We are all here, little one. The whole sea swam down behind you tonight.' },
    { who: 'lila', text: 'Little whale? It\'s me. We brought your pearl the three lost pieces… and one more thing. A song with EVERYONE in it. Will you sing it with us?' },
  ], () => startRhythm({
    rounds: [4, 5, 6], who: 'queen',
    onWin: () => {
      S.frags = [true, true, true];
      S.flags.pearlHealed = true; markSave();
      G.flash = .9;
      AudioSys.sfx('pearl');
      burst(G.p.x, G.p.y, 'rgba(220,230,255,.95)', 50, { star: true, grav: -30, speed: 260 });
      dsay([
        { who: 'lila', text: 'The fragments — they\'re flying to the crack — it\'s sealing up with LIGHT!' },
        { who: 'queen', text: 'The Moon Pearl sings whole again… and listen. The little guardian is singing WITH it. Not lonely. Not anymore.' },
        { who: 'lila', text: 'Then there\'s only one thing left to do… FESTIVAL! Everyone to the beach!!' },
      ], () => {
        toast('🌕 The Moon Pearl is healed! Swim up — festival time!');
        updateHUD();
        saveGame();
      });
    },
  }));
}

/* ── FINALE: the Moonlight Festival ──────────────────────── */
function finaleScene() {
  fadeTransition(() => {
    S.isle = 'home'; G.mode = 'land';
    G.p.x = 8450; G.cam.x = clamp(8450 - VW / 2, 0, 12000 - VW);
    G.tod = .84; S.tod = .84;
  }, () => {
    const sc = {
      data: { fw: [], fwT: 0, bloom: 0 },
      steps: [
        { d: 3.4, sub: 'That evening, every friend from every island gathered on the boardwalk…', on: () => AudioSys.stopMusic() },
        { d: 3.2, sub: 'The turtle brothers raised their drumsticks. My Melody raised the Moon Cake. Pusheen raised a donut. 🥁🎂🍩' },
        { d: 2.2, sub: '…and out in the bay, the Silver Whale calf rose to listen. 🐋', on: s => { AudioSys.sfx('twinkle'); s.data.whale = true; } },
        { d: 5, sub: 'THE MOONLIGHT FESTIVAL! 🎆', on: s => { s.data.bloom = 1; s.data.fireworks = true; AudioSys.play('finale', .8); G.flash = .6; } },
        { d: 4.6, sub: 'The Moon Pearl\'s lullaby rolled soft and silver over six islands — a bigger song, for a bigger family.' },
        { d: 4.6, sub: 'Lila the Explorer — sailor, diver, racer, roommate of the world\'s roundest cat, healer of the Moon Pearl. 💗' },
        { d: 5.4, sub: 'Starring: Lila! · Pusheen · My Melody · Pochacco · Pompompurin · Hello Kitty · Leonardo, Raphael, Michelangelo & Donatello 🐢' },
        { d: 5, sub: '…and the mermaids, and Glimmer, and Sammy, and Pearl, and YOU. Six islands, forever yours. THE END… and the beginning! ✨' },
      ],
      done: () => {
        S.mq = 99; S.flags.finaleDone = true; markSave(); saveGame();
        updateHUD();
        chapterCardShow(99, 'The Tides of Shimmer Isle 💗', () => {
          toast('🌟 Free play forever! New races, treasures, and outfits await!');
        });
      },
      draw: drawFinaleOver,
    };
    startCutscene(sc);
  });
}
function drawFinaleOver(sc) {
  const d = sc.data;
  const camX = G.cam.x;
  const cast = [
    ['melody', 8050], ['pochacco', 8150], ['purin', 7950], ['kitty', 8250],
    ['leo', 8600], ['raph', 8700], ['mikey', 8800], ['donnie', 8900],
    ['sammy', 7870], ['pigeon', 7810],
  ];
  cast.forEach(([id, fx], i) => {
    const sx = fx - camX;
    if (sx < -80 || sx > VW + 80) return;
    ctx.save(); ctx.translate(sx, gyAt(fx));
    const dance = d.fireworks ? Math.abs(Math.sin(G.t * (id === 'purin' ? 1.4 : 3.2) + i)) * (id === 'purin' ? 3 : 8) : 0;
    ctx.translate(0, -dance);
    const drumming = ['leo', 'raph', 'mikey', 'donnie'].includes(id) && d.fireworks;
    PAINT[id](ctx, G.t + i * 2, { face: fx < 8450 ? 1 : -1, hop: drumming });
    ctx.restore();
  });
  // pusheen next to lila
  ctx.save(); ctx.translate(8380 - camX, gyAt(8380));
  ctx.scale(.8, .8);
  PAINT.pusheen(ctx, G.t, { face: 1 });
  ctx.restore();
  // whale calf in the bay
  if (d.whale) {
    const wx = 9000 - camX, wy = VH * .62 + Math.sin(G.t * 1.2) * 8;
    ctx.save(); ctx.translate(wx, wy); ctx.scale(-.5, .5);
    drawFishSprite(ctx, fishById('calf'), G.t, {});
    ctx.restore();
    glow(ctx, wx, wy, 90, rgba(220, 235, 255), .3);
    if (Math.sin(G.t * .9) > .4) {
      ctx.fillStyle = `rgba(220,235,255,${1 - (G.t % 1)})`;
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('♪', wx - 60, wy - 40 - (G.t % 1) * 44);
    }
  }
  if (d.bloom) {
    const a = .1 + .05 * Math.sin(G.t * 2);
    const bg = ctx.createRadialGradient(VW / 2, VH * .3, 60, VW / 2, VH * .3, VW);
    bg.addColorStop(0, `rgba(220,232,255,${a * 1.8})`);
    bg.addColorStop(.5, `rgba(255,200,240,${a * .6})`);
    bg.addColorStop(1, 'rgba(255,200,240,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH);
  }
  if (d.fireworks) {
    d.fwT -= LAST_DT;
    if (d.fwT <= 0) {
      d.fwT = rnd(.3, .8);
      d.fw.push({ x: rnd(VW * .1, VW * .9), y: VH + 10, vy: -rnd(400, 560), ex: rnd(VH * .12, VH * .42), col: `hsl(${irnd(0, 360)},90%,70%)`, parts: null });
    }
    d.fw.forEach(f => {
      if (!f.parts) {
        f.y += f.vy * LAST_DT;
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, TAU); ctx.fill();
        if (f.y <= f.ex) {
          f.parts = [];
          AudioSys.sfx('boom');
          for (let i = 0; i < 26; i++) {
            const a = i / 26 * TAU, sp = rnd(90, 200);
            f.parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(.8, 1.4) });
          }
        }
      } else {
        f.parts.forEach(p => {
          p.vy += 100 * LAST_DT;
          p.x += p.vx * LAST_DT; p.y += p.vy * LAST_DT;
          p.life -= LAST_DT;
          ctx.globalAlpha = clamp(p.life, 0, 1);
          ctx.fillStyle = f.col;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, TAU); ctx.fill();
        });
        ctx.globalAlpha = 1;
        f.parts = f.parts.filter(p => p.life > 0);
      }
    });
    d.fw = d.fw.filter(f => !f.parts || f.parts.length);
  }
}
/* ============================================================
   TITLE, MAIN LOOP & BOOT
   ============================================================ */
let LAST_DT = 0.016;

function drawTitle() {
  const t = G.t;
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#3E5474'); g.addColorStop(.35, '#7B8FC4');
  g.addColorStop(.55, '#8FA8CC'); g.addColorStop(1, '#123650');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  // silver moon
  glow(ctx, VW * .78, VH * .16, 110, rgba(230, 238, 255), .7);
  ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(VW * .78, VH * .16, 38, 0, TAU); ctx.fill();
  // stars
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = .3 + .6 * Math.abs(Math.sin(t * 2 + i * 1.7));
    ctx.fillStyle = '#FFFEF0';
    ctx.fillRect(n1(i * 7.3) * VW, n1(i * 3.1) * VH * .4, 2, 2);
  }
  ctx.globalAlpha = 1;
  // archipelago silhouettes
  const horY = VH * .55;
  ctx.fillStyle = 'rgba(30,70,80,.85)';
  [[.1, 90, 180], [.34, 60, 120], [.55, 40, 90], [.72, 50, 110], [.9, 100, 90]].forEach(([fx, fh, fw], i) => {
    ctx.beginPath(); ctx.moveTo(VW * fx - fw, horY + 3);
    if (i === 4) { ctx.lineTo(VW * fx - 16, horY - fh * 1.6); ctx.lineTo(VW * fx + 14, horY - fh * 1.3); }
    else ctx.quadraticCurveTo(VW * fx, horY - fh, VW * fx + fw * .4, horY - fh * .45);
    ctx.lineTo(VW * fx + fw, horY + 3); ctx.closePath(); ctx.fill();
  });
  glow(ctx, VW * .9 - 4, horY - 138, 40, rgba(255, 150, 90), .45 + .2 * Math.sin(t * 2));
  // silver sea
  for (let L = 0; L < 4; L++) {
    ctx.fillStyle = `rgba(220,232,255,${.08 + L * .06})`;
    const wy = horY + 14 + L * (VH - horY) / 4.4;
    ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 24) ctx.lineTo(x, wy + Math.sin(x * .014 + t * (1 + L * .4)) * 7);
    ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
  }
  // sparkles on water
  for (let i = 0; i < 20; i++) {
    const sx = (n1(i * 5.1) * VW + t * 24 * (0.5 + n1(i))) % VW;
    ctx.fillStyle = `rgba(228,240,255,${.3 + .5 * Math.sin(t * 3 + i * 2)})`;
    starPath(ctx, sx, horY + 20 + n1(i * 3.3) * (VH - horY - 60), 3.2, 1.5); ctx.fill();
  }
  // beach + cast
  ctx.fillStyle = '#E8D2A8';
  ctx.beginPath(); ctx.moveTo(0, VH);
  ctx.quadraticCurveTo(VW * .3, VH * .8, VW, VH * .93);
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
  const baseY = VH * .9;
  const cast = [['purin', .07], ['melody', .17], ['pusheen', .27], ['lila', .38], ['leo', .6], ['mikey', .7], ['kitty', .8], ['pochacco', .9]];
  cast.forEach(([id, fx], i) => {
    ctx.save();
    ctx.translate(VW * fx, baseY - Math.abs(Math.sin(t * 2.2 + i * 1.1)) * 6);
    if (id === 'lila') { ctx.scale(1.15, 1.15); drawLila(ctx, t, { face: 1 }); }
    else if (id === 'pusheen') { ctx.scale(.85, .85); PAINT.pusheen(ctx, t, {}); }
    else { const flip = fx > .5 ? -1 : 1; ctx.scale(flip, 1); PAINT[id](ctx, t + i, {}); }
    ctx.restore();
  });
  // title
  const ty = VH * .18;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(VW / 2, ty);
  ctx.rotate(Math.sin(t * .8) * .012);
  const fs1 = Math.min(76, VW / 9);
  ctx.font = `900 ${fs1}px ui-rounded, 'Arial Rounded MT Bold', sans-serif`;
  ctx.lineWidth = fs1 * .22; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3E2A5C';
  ctx.strokeText('Lila', 0, 0);
  const tg = ctx.createLinearGradient(0, -fs1, 0, 10);
  tg.addColorStop(0, '#FFE9F2'); tg.addColorStop(.55, '#FF9FBE'); tg.addColorStop(1, '#F26D99');
  ctx.fillStyle = tg;
  ctx.fillText('Lila', 0, 0);
  const fs2 = Math.min(30, VW / 24);
  ctx.font = `900 ${fs2}px ui-rounded, 'Arial Rounded MT Bold', sans-serif`;
  ctx.lineWidth = fs2 * .3;
  ctx.strokeStyle = '#1E3A5C';
  ctx.strokeText('& the Tides of Shimmer Isle', 0, fs2 * 1.6);
  const tg2 = ctx.createLinearGradient(0, fs2, 0, fs2 * 2.2);
  tg2.addColorStop(0, '#F0F6FF'); tg2.addColorStop(1, '#9FC4E8');
  ctx.fillStyle = tg2;
  ctx.fillText('& the Tides of Shimmer Isle', 0, fs2 * 1.6);
  ctx.restore();
  ctx.font = `800 ${Math.min(14, VW / 50)}px ui-rounded, sans-serif`;
  ctx.fillStyle = 'rgba(240,246,255,.85)';
  ctx.fillText('Six islands ⛵ one silver song ✨ made with love for Lila', VW / 2, ty + fs1 * .9 + 44);
}

/* ── update / draw dispatch ─────────────────────────────── */
function update(dt) {
  G.t += dt;
  LAST_DT = dt;
  G.shakeT = Math.max(0, G.shakeT - dt);
  G.flash = Math.max(0, G.flash - dt * 1.4);
  S.playSeconds = (S.playSeconds || 0) + dt;
  updateFade(dt);
  updateCutscene(dt);
  updateDialog(dt);
  if (G.cook) updateCook(dt);
  if (G.rhythm) updateRhythm(dt);
  if (G.train) updateTrain(dt);
  if (G.race) updateRace(dt);
  updateSparkles(dt);
  if (G.mode === 'land') updateLand(dt);
  else if (G.mode === 'dive') updateDive(dt);
  else if (G.mode === 'sail') updateSail(dt);
  else if (G.mode === 'house') updateHouse(dt);
  else if (G.mode === 'title') { G.tod = .88; }
  if (actionQueued) {
    actionQueued = false;
    if (G.cutscene || G.cook || G.rhythm || G.train || G.chapterT || G.fade) { /* consumed elsewhere */ }
    else if (G.dialog) advanceDialog();
    else if (!G.panel && G.nearTarget) G.nearTarget.act();
    else if (!G.panel && G.vehicle === 'bike' && S.flags.bell) { AudioSys.sfx(S.flags.goldbell ? 'yay' : 'ding'); }
  }
  saveTimer += dt;
  if (saveTimer > 5) { saveTimer = 0; if (saveDirty) saveGame(); }
}
function draw() {
  ctx.save();
  if (G.shakeT > 0) ctx.translate(rnd(-G.shakeAmp, G.shakeAmp), rnd(-G.shakeAmp, G.shakeAmp));
  if (G.mode === 'title') drawTitle();
  else if (G.mode === 'land') drawLand();
  else if (G.mode === 'dive') drawDive();
  else if (G.mode === 'sail') drawSail();
  else if (G.mode === 'house') drawHouse();
  else { ctx.fillStyle = '#0a1830'; ctx.fillRect(0, 0, VW, VH); }
  if (G.cutscene) {
    if (G.cutscene.full) { ctx.fillStyle = '#0a1830'; ctx.fillRect(-20, -20, VW + 40, VH + 40); }
    if (G.cutscene.draw) G.cutscene.draw(G.cutscene);
  }
  ctx.restore();
  if (G.rhythm) drawRhythm();
  if (G.cook) drawCook();
  if (G.train) drawTrain();
  drawFade();
}
let lastTS = 0;
function loop(ts) {
  const dt = clamp((ts - lastTS) / 1000, 0, .05) || .016;
  lastTS = ts;
  try { update(dt); draw(); } catch (e) { console.error(e); }
  ptr.tapped = false;
  requestAnimationFrame(loop);
}

/* ── title slots ─────────────────────────────────────────── */
function renderSlots() {
  const box = $('slotBox');
  box.innerHTML = '';
  for (let n = 1; n <= 3; n++) {
    const d = peekSlot(n);
    const b = document.createElement('button');
    b.className = 'titleBtn' + (d ? '' : ' alt');
    if (d) {
      const ch = d.mq >= 99 ? '🌕 Free play' : `Ch.${(() => { let c = 1; for (let i = 1; i < CHAPTERS.length; i++) if (d.mq >= CHAPTERS[i].at) c = i; return c; })()}`;
      b.innerHTML = `⭐ Slot ${n} — ${ch} · 🐚${d.shells} · ${Math.round((d.playSeconds || 0) / 60)}min`;
    } else {
      b.textContent = `🌊 Slot ${n} — New Adventure`;
    }
    let armed = false;
    b.onclick = () => {
      AudioSys.unlock(); AudioSys.sfx('tap');
      if (d) {
        loadSlot(n);
        enterGameFromSave();
      } else {
        loadSlot(n);
        startNewGame();
      }
    };
    // long-press / second small button to erase
    if (d) {
      const del = document.createElement('button');
      del.className = 'slotDel';
      del.textContent = '🗑';
      del.onclick = e => {
        e.stopPropagation();
        if (!armed) { armed = true; del.textContent = '⚠️tap again'; setTimeout(() => { armed = false; del.textContent = '🗑'; }, 2500); return; }
        wipeSlot(n); renderSlots();
      };
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center';
      wrap.appendChild(b); wrap.appendChild(del);
      box.appendChild(wrap);
      continue;
    }
    box.appendChild(b);
  }
}
function enterGameFromSave() {
  $('titleUI').style.display = 'none';
  G.mode = 'land';
  G.p.x = S.px || 480;
  G.tod = S.tod || .36;
  G.cam.x = clamp(G.p.x - VW / 2, 0, isleDef().w - VW);
  G.pet.x = G.p.x - 70;
  $('hud').style.display = 'flex';
  if (IS_TOUCH) $('touch').style.display = 'block';
  AudioSys.play(isNight() ? 'night' : isleDef().music, 2);
  AudioSys.ambience('island');
  updateHUD();
  toast('⭐ ' + questHint());
}
function startNewGame() {
  const keepAudio = { music: S.music, sfx: S.sfx };
  S = defaultSave();
  S.music = keepAudio.music; S.sfx = keepAudio.sfx;
  $('titleUI').style.display = 'none';
  introScene();
}
function showTitle() {
  G.mode = 'title';
  $('titleUI').style.display = 'flex';
  $('hud').style.display = 'none';
  $('touch').style.display = 'none';
  renderSlots();
  AudioSys.play('title', 2);
}
/* HUD vehicle toggle */
$('btnVeh').onclick = () => {
  if (G.busy || G.race || G.mode !== 'land') return;
  AudioSys.sfx('tap');
  if (G.vehicle === 'bike' || G.vehicle === 'surf') G.vehicle = null;
  else if (S.vehicles.bike) G.vehicle = 'bike';
  updateVehBtn();
};
/* touch buttons */
bindHold($('btnL'), 'L');
bindHold($('btnR'), 'R');
['touchstart', 'mousedown'].forEach(ev =>
  $('btnA').addEventListener(ev, e => { e.preventDefault(); actionQueued = true; AudioSys.unlock(); }, { passive: false }));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (S.started) saveGame(); AudioSys.hush(); } else AudioSys.wake();
});
window.addEventListener('beforeunload', () => { if (S.started) saveGame(); });

/* boot */
try { activeSlot = parseInt(localStorage.getItem(ACTIVE_KEY) || '1', 10) || 1; } catch (e) {}
loadSlot(activeSlot);
showTitle();
requestAnimationFrame(loop);
