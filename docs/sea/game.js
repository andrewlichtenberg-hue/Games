'use strict';
/* ============================================================
   LILA & THE SONG OF THE SEA
   A Shimmer Isle Adventure  —  sequel to Lila's Nature Explorer
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
// deterministic hash noise (for scenery that must not jitter frame to frame)
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

// rounded-rect path helper
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
// soft radial glow
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('AL', a.toFixed(3)));
  g.addColorStop(1, col.replace('AL', '0'));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
const rgba = (r, g, b) => `rgba(${r},${g},${b},AL)`;

/* ── save data ───────────────────────────────────────────── */
const SAVE_KEY = 'lilaSongOfTheSea_v1';
function defaultSave() {
  return {
    started: false,
    mq: 1,                 // main quest index (1..14, 15 = postgame)
    shells: 0,
    inv: {},               // itemId -> count
    gear: {},              // snorkel, tank1, tank2, flippers, lantern, wetsuit, net, compass, key, blessing
    pearls: [false, false, false, false, false, false],
    fish: {},              // fishId -> total caught
    seen: {},              // fishId -> true (journal)
    hearts: { melody: 0, purin: 0, pochacco: 0, kitty: 0, coral: 0, marina: 0, inky: 0 },
    flags: {},             // story flags
    recipes: ['tart'],     // unlocked recipe ids
    stickers: [],          // collected starfish ids
    px: 480,               // island x position
    tod: 0.34,             // time of day 0..1 (0.5 = noon)
    music: true, sfx: true,
    outfit: 'red',         // 'red' | 'rainbow'
    playSeconds: 0,
  };
}
let S = defaultSave();
let saveDirty = false, saveTimer = 0;
function markSave() { saveDirty = true; }
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  saveDirty = false;
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    S = Object.assign(defaultSave(), d);
    S.hearts = Object.assign(defaultSave().hearts, d.hearts || {});
    return S.started;
  } catch (e) { return false; }
}
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = defaultSave(); }

/* inventory helpers */
function invAdd(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; markSave(); }
function invCount(id) { return S.inv[id] || 0; }
function invTake(id, n = 1) {
  if (invCount(id) < n) return false;
  S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id];
  markSave(); return true;
}
function addShells(n) { S.shells += n; markSave(); updateHUD(); }
function heart(who, n = 1) {
  S.hearts[who] = Math.min(5, (S.hearts[who] || 0) + n);
  markSave();
}

/* ── runtime state ───────────────────────────────────────── */
const G = {
  mode: 'boot',            // boot | title | island | dive
  p: { x: 480, y: 0, vx: 0, vy: 0, face: 1, walk: 0, anim: 0, air: 1, depth: 0, sting: 0, dash: 0 },
  cam: { x: 0, y: 0 },
  t: 0,                    // global seconds
  tod: 0.34,               // time of day mirror (advances, stored to S)
  busy: false,             // dialog / cutscene / panel blocks movement
  dialog: null,
  cutscene: null,
  rhythm: null,
  fireflies: [],           // active firefly entities (night, jungle)
  sparkles: [],            // pickup fx particles
  toastT: 0,
  weather: { rain: 0, target: 0, next: 60 },
  dive: null,              // dive session state
  nearTarget: null,        // current interactable
  titleT: 0,
  shakeT: 0, shakeAmp: 0,
  flash: 0,
  npcTalk: {},             // per-npc idle bounce timers
};

/* ── input ───────────────────────────────────────────────── */
const keys = {};
let actionQueued = false;
window.addEventListener('keydown', e => {
  if (e.repeat) return;
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

/* pointer (mouse or touch) — used for swim-steering & taps */
const ptr = { down: false, x: 0, y: 0, tapped: false, downT: 0, moved: false };
function ptrPos(e) {
  const t = e.touches ? e.touches[0] : e;
  return t ? { x: t.clientX, y: t.clientY } : null;
}
function onDown(e) {
  if (e.target && e.target.closest && e.target.closest('#ui') &&
      !e.target.closest('#touch') && e.target.id !== 'ui') return; // let UI handle its own
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

/* touch buttons */
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
   DATA — world, fish, items, recipes, shop, quests, npcs
   ============================================================ */
const ISLE_W = 9600;                    // island world width
const UW_W = 6000, UW_D = 3600;         // underwater world size
const BUOYS = [
  { x: 640, uwx: 950, name: 'Reef Buoy' },
  { x: 3900, uwx: 2750, name: 'Pier Buoy' },
  { x: 7400, uwx: 4800, name: 'Cove Buoy' },
];
const ZONES = [
  { x0: 0, x1: 1800, name: 'Sunrise Beach' },
  { x0: 1800, x1: 4200, name: 'Seashell Village' },
  { x0: 4200, x1: 6600, name: 'Whispering Jungle' },
  { x0: 6600, x1: 9600, name: 'Lighthouse Cliff' },
];
function zoneAt(x) { return ZONES.find(z => x >= z.x0 && x < z.x1) || ZONES[0]; }

/* ── items ────────────────────────────────────────────────── */
const ITEMS = {
  mango:   { n: 'Mango', em: '🥭' },
  banana:  { n: 'Banana', em: '🍌' },
  coconut: { n: 'Coconut', em: '🥥' },
  plank:   { n: 'Driftwood', em: '🪵' },
  dish_tart:     { n: 'Sunrise Tart', em: '🥧' },
  dish_pudding:  { n: 'Dreamy Pudding', em: '🍮' },
  dish_reefroll: { n: 'Reef Roll', em: '🍣' },
  dish_glowsoup: { n: 'Glow Soup', em: '🍲' },
  dish_starcake: { n: 'Starlight Cake', em: '🎂' },
};

/* ── fish ─────────────────────────────────────────────────── */
// band: 0 sunlit (80–800) · 1 twilight (800–2000) · 2 abyss (2000–3600)
// shape: oval tall long seahorse eel squid crab ray angler whale
const FISH = [
  { id: 'sunfish',  n: 'Sunny Sunfish',      band: 0, rare: 0, val: 3,  sz: 26, spd: 40, shape: 'oval', c1: '#FFD24C', c2: '#FF9838', fact: 'Real ocean sunfish can grow heavier than a car!' },
  { id: 'clown',    n: 'Giggle Clownfish',   band: 0, rare: 0, val: 4,  sz: 22, spd: 55, shape: 'oval', c1: '#FF7A3C', c2: '#FFFFFF', fact: 'Clownfish hide in anemones that would sting other fish.' },
  { id: 'tang',     n: 'Blueberry Tang',     band: 0, rare: 0, val: 4,  sz: 24, spd: 60, shape: 'tall', c1: '#3E7BFF', c2: '#FFE14C', fact: 'Tangs tuck themselves into coral cracks to sleep.' },
  { id: 'butterfly',n: 'Butterfly Fish',     band: 0, rare: 0, val: 5,  sz: 22, spd: 50, shape: 'tall', c1: '#FFE14C', c2: '#3B3B4F', fact: 'It has a fake eye near its tail to confuse nibblers!' },
  { id: 'parrot',   n: 'Rainbow Parrotfish', band: 0, rare: 1, val: 7,  sz: 30, spd: 45, shape: 'oval', c1: '#39C6A5', c2: '#FF7AB6', fact: 'Parrotfish crunch coral and turn it into soft white sand.' },
  { id: 'seahorse', n: 'Sparkle Seahorse',   band: 0, rare: 2, val: 12, sz: 20, spd: 18, shape: 'seahorse', c1: '#FF9FD0', c2: '#FFD24C', fact: 'Seahorse dads are the ones who carry the babies!' },
  { id: 'lantern',  n: 'Lanternfish',        band: 1, rare: 0, val: 6,  sz: 20, spd: 55, shape: 'oval', c1: '#57E0E8', c2: '#1B6E8C', fact: 'It makes its own light, like a tiny living flashlight.' },
  { id: 'hatchet',  n: 'Silver Hatchetfish', band: 1, rare: 0, val: 7,  sz: 20, spd: 60, shape: 'tall', c1: '#C9D6E8', c2: '#7B8FA8', fact: 'Its mirror-shiny sides help it vanish in the dim water.' },
  { id: 'snapper',  n: 'Moon Snapper',       band: 1, rare: 0, val: 8,  sz: 28, spd: 50, shape: 'oval', c1: '#B9A8FF', c2: '#6E5BD0', fact: 'Snappers drum little songs to each other at night.' },
  { id: 'eel',      n: 'Ribbon Eel',         band: 1, rare: 2, val: 12, sz: 40, spd: 40, shape: 'eel',  c1: '#3E7BFF', c2: '#FFE14C', fact: 'Ribbon eels start out black and turn bright blue as they grow!' },
  { id: 'squid',    n: 'Twinkle Squid',      band: 1, rare: 2, val: 14, sz: 26, spd: 45, shape: 'squid', c1: '#C77DFF', c2: '#8E4FD0', fact: 'Squids have three hearts. Three!' },
  { id: 'angler',   n: 'Lantern Angler',     band: 2, rare: 0, val: 10, sz: 28, spd: 35, shape: 'angler', c1: '#2E4057', c2: '#9BE8FF', fact: 'She fishes with a glowing lure — a fisher who IS a fish.' },
  { id: 'ghost',    n: 'Ghostfish',          band: 2, rare: 0, val: 10, sz: 24, spd: 30, shape: 'oval', c1: '#D8E8F0', c2: '#9FB8CC', fact: 'It lives so deep it has never once seen the sun.' },
  { id: 'crab',     n: 'Crystal Crab',       band: 2, rare: 0, val: 9,  sz: 24, spd: 20, shape: 'crab', c1: '#9BE8FF', c2: '#5BB8D8', fact: 'Crabs wear their skeleton on the OUTSIDE.' },
  { id: 'dumbo',    n: 'Dumbo Octopus',      band: 2, rare: 2, val: 16, sz: 26, spd: 25, shape: 'squid', c1: '#FF9FD0', c2: '#E56A93', fact: 'It flaps big ear-like fins to fly through the deep!' },
  { id: 'ray',      n: 'Starlight Ray',      band: 2, rare: 3, val: 25, sz: 52, spd: 30, shape: 'ray', c1: '#2B3A6E', c2: '#9BE8FF', fact: 'She glides through the dark like a kite with wings of stars.' },
  { id: 'whale',    n: 'Melody Whale',       band: 2, rare: 3, val: 0,  sz: 220, spd: 12, shape: 'whale', c1: '#3E5C8C', c2: '#9BB8E0', sight: true, fact: 'Her song carries for miles and miles beneath the sea.' },
];
const fishById = id => FISH.find(f => f.id === id);

/* ── recipes ─────────────────────────────────────────────── */
const RECIPES = [
  { id: 'tart',     n: 'Sunrise Tart',   em: '🥧', need: { mango: 2, banana: 1 },            pay: 12 },
  { id: 'pudding',  n: 'Dreamy Pudding', em: '🍮', need: { coconut: 3, mango: 1 },           pay: 15 },
  { id: 'reefroll', n: 'Reef Roll',      em: '🍣', need: { sunfish: 2, banana: 1 },          pay: 18 },
  { id: 'glowsoup', n: 'Glow Soup',      em: '🍲', need: { lantern: 2, coconut: 1 },         pay: 26 },
  { id: 'starcake', n: 'Starlight Cake', em: '🎂', need: { mango: 2, coconut: 2, ghost: 1 }, pay: 40 },
];

/* ── dive shop ───────────────────────────────────────────── */
const SHOP = [
  { id: 'tank1',    n: 'Bubble Tank',     em: '🫧', cost: 30, d: 'Twice the air! Dive into the twilight zone.' },
  { id: 'flippers', n: 'Zoomy Flippers',  em: '🩴', cost: 45, d: 'Swim 40% faster. Wheee!' },
  { id: 'wetsuit',  n: 'Cozy Wetsuit',    em: '🩱', cost: 40, d: 'Jellyfish stings only tickle now.' },
  { id: 'net',      n: 'Pearl Net',       em: '🥍', cost: 55, d: 'Catch fish from farther away.' },
  { id: 'tank2',    n: 'Big Bubble Tank', em: '🛢️', cost: 80, d: 'Huge air supply for the deep trench.', needs: 'tank1' },
];
function airMax() {
  if (S.gear.blessing) return Infinity;
  if (S.gear.tank2) return 200;
  if (S.gear.tank1) return 110;
  return 55;
}

/* ── main quest chain ────────────────────────────────────── */
const MQ = [
  null, // 1-indexed
  { t: 'Welcome Ashore',      h: 'Find My Melody at the Beach Café ☕', tgt: () => ({ sc: 'island', x: 1400 }) },
  { t: 'The Runaway Ball',    h: () => S.flags.gotBall ? 'Bring the ball back to Pochacco 🎾' : "Find Pochacco's lost beach ball near the old dock",
    tgt: () => S.flags.gotBall ? { sc: 'island', x: 2450 } : { sc: 'island', x: 240 } },
  { t: 'First Dive!',         h: () => `Dive at the Reef Buoy and collect sea glass (${S.flags.glass || 0}/5) 🌊`, tgt: () => ({ sc: 'island', x: 640, dive: true }) },
  { t: 'The First Pearl',     h: 'Follow the sparkling compass to the glowing clam 🦪', tgt: () => ({ sc: 'dive', x: 1050, y: 640 }) },
  { t: 'The Beach Café',      h: () => `Gather ${ITEMS.mango.em}×2 ${ITEMS.banana.em}×1 in the jungle, then bake a Sunrise Tart at the café`, tgt: () => (invCount('mango') >= 2 && invCount('banana') >= 1) ? { sc: 'island', x: 1400 } : { sc: 'island', x: 5000 } },
  { t: 'Pudding for Purin',   h: () => invCount('dish_pudding') ? 'Bring the pudding to sleepy Pompompurin 🍮' : `Bake a Dreamy Pudding (${ITEMS.coconut.em}×3 ${ITEMS.mango.em}×1) at the café`, tgt: () => invCount('dish_pudding') ? { sc: 'island', x: 3050 } : { sc: 'island', x: 1400 } },
  { t: 'The Sunken Chest',    h: () => S.gear.tank1 ? 'Open the sunken chest below the Pier Buoy 🗝️' : 'Buy a Bubble Tank at Pochacco\'s dive shop, then dive at the Pier Buoy', tgt: () => S.gear.tank1 ? { sc: 'dive', x: 2750, y: 950 } : { sc: 'island', x: 2450 } },
  { t: 'Light for the Deep',  h: () => !S.flags.kittyMet ? 'Climb to the lighthouse and meet its keeper 🚨' : `Catch fireflies in the jungle at night (${S.flags.fireflies || 0}/5) ✨`,
    tgt: () => !S.flags.kittyMet ? { sc: 'island', x: 8800 } : (S.flags.fireflies >= 5 ? { sc: 'island', x: 8800 } : { sc: 'island', x: 5400 }) },
  { t: 'Song in the Twilight', h: 'Descend into the twilight dark — your lantern will light the way 🏮', tgt: () => ({ sc: 'dive', x: 1700, y: 1500 }) },
  { t: 'Maestro Inky',        h: 'Find the grumpy octopus\'s den, deep past the twilight reef 🐙', tgt: () => ({ sc: 'dive', x: 4200, y: 1800 }) },
  { t: 'After the Storm',     h: () => `Gather driftwood on the beach for My Melody (${invCount('plank')}/4) 🪵`, tgt: () => invCount('plank') >= 4 ? { sc: 'island', x: 1400 } : { sc: 'island', x: 900 } },
  { t: 'Into the Trench',     h: 'Dive into the deep trench below the Cove Buoy for Pearl 5 💙', tgt: () => ({ sc: 'dive', x: 5200, y: 2450 }) },
  { t: 'The Queen of the Deep', h: 'Descend to the Mermaid Palace at the very bottom of the sea 🏰', tgt: () => ({ sc: 'dive', x: 3000, y: 3300 }) },
  { t: 'The Great Song',      h: 'Bring the six pearls to the lighthouse — it\'s festival time! 🎆', tgt: () => ({ sc: 'island', x: 8600 }) },
];
const POSTGAME_HINTS = [
  'Free play! Fill your fish journal, find every starfish… the island is yours 💗',
];

/* ── NPCs ────────────────────────────────────────────────── */
const NPCS = {
  lila:    { n: 'Lila',          col: '#FF8FB1' },
  melody:  { n: 'My Melody',     col: '#FFB3C9', x: 1430, sc: 'island' },
  pochacco:{ n: 'Pochacco',      col: '#BFE3FF', x: 2450, sc: 'island' },
  purin:   { n: 'Pompompurin',   col: '#FFDD75', x: 3060, sc: 'island' },
  kitty:   { n: 'Hello Kitty',   col: '#FF6B81', x: 8800, sc: 'island' },
  sammy:   { n: 'Sammy the Squirrel', col: '#D4A464', x: 5620, sc: 'island' },
  pigeon:  { n: 'Pearl the Pigeon', col: '#C9C9E8', x: 380, sc: 'island' },
  coral:   { n: 'Coral',         col: '#FF9FD0', x: 1150, y: 480, sc: 'dive' },
  marina:  { n: 'Marina',        col: '#8FD0FF', x: 2300, y: 1350, sc: 'dive' },
  queen:   { n: 'Queen Nerissa', col: '#B9A8FF', x: 2830, y: 3330, sc: 'dive' },
  inky:    { n: 'Maestro Inky',  col: '#A88FD0', x: 4200, y: 1820, sc: 'dive' },
};

/* ── collectibles ────────────────────────────────────────── */
// starfish stickers (10): island ground sparkly stars & underwater
const STARFISH = [
  { id: 'sf1', sc: 'island', x: 180 },  { id: 'sf2', sc: 'island', x: 1720 },
  { id: 'sf3', sc: 'island', x: 3480 }, { id: 'sf4', sc: 'island', x: 4870 },
  { id: 'sf5', sc: 'island', x: 6250 }, { id: 'sf6', sc: 'island', x: 7850 },
  { id: 'sf7', sc: 'island', x: 9350 },
  { id: 'sf8', sc: 'dive', x: 520, y: 700 }, { id: 'sf9', sc: 'dive', x: 3600, y: 1700 },
  { id: 'sf10', sc: 'dive', x: 5600, y: 3050 },
];
const ACORNS = [
  { id: 'ac1', x: 4560 }, { id: 'ac2', x: 6380 }, { id: 'ac3', x: 8250 },
];

/* pearls — underwater resting places (P4 & P6 are given by characters) */
const PEARL_SPOTS = [
  { i: 0, x: 1050, y: 640 },   // clam, shallow reef
  { i: 1, x: 2750, y: 950 },   // sunken chest (needs key)
  { i: 2, x: 1700, y: 1500 },  // twilight grotto
  { i: 4, x: 5200, y: 2450 },  // trench cave
];
function pearlCount() { return S.pearls.filter(Boolean).length; }
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
  const dressA = o.outfit === 'rainbow' ? '#FF8FB1' : '#E23B4E';
  const dressB = o.outfit === 'rainbow' ? '#FFD24C' : '#C22B3E';
  if (o.swim) { drawLilaSwim(c, t, o, skin, hair); c.restore(); return; }
  const w = o.walk || 0, ph = t * 11;
  const bob = Math.abs(Math.sin(ph)) * 3.2 * w;
  const swing = Math.sin(ph) * .55 * w;
  c.translate(0, -bob);
  // legs
  line(c, -1, -30, -1 - Math.sin(ph) * 9 * w, -2, 7, skin);
  line(c, 5, -30, 5 + Math.sin(ph) * 9 * w, -2, 7, skin);
  // shoes
  c.fillStyle = '#B3574A';
  oval(c, -1 - Math.sin(ph) * 9 * w + 1.5, -2, 6, 3.6, '#C9575F', INK);
  oval(c, 5 + Math.sin(ph) * 9 * w + 1.5, -2, 6, 3.6, '#C9575F', INK);
  // dress
  c.beginPath();
  c.moveTo(-13, -30); c.lineTo(15, -30); c.lineTo(10, -56); c.lineTo(-8, -56); c.closePath();
  const dg = c.createLinearGradient(0, -56, 0, -30);
  dg.addColorStop(0, dressA); dg.addColorStop(1, dressB);
  c.fillStyle = dg; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  if (o.outfit === 'rainbow') {
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
  // face
  const blink = (Math.sin(t * .9) > .985) || o.blink;
  if (blink) { closedEye(c, hx + 7, hy + 1); closedEye(c, hx - 4, hy + 1); }
  else { dotEye(c, hx + 7, hy + 1, 2.8); dotEye(c, hx - 4, hy + 1, 2.8); }
  blush(c, hx + 12, hy + 6.5); blush(c, hx - 9, hy + 6.5);
  smile(c, hx + 2, hy + 6.5, 3.6, o.talk && Math.sin(t * 14) > 0);
  // lantern in hand at night (island, decorative when owned)
  c.restore();
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
  else if (who === 'pigeon') { pc.translate(-6, 8); pc.scale(2.4, 2.4); PAINT.pigeon(pc, t, {}); }
  else if (PAINT[who]) { pc.translate(0, 8); pc.scale(1.35, 1.35); PAINT[who](pc, t, { talk: true }); }
  pc.restore();
}
/* ============================================================
   ISLAND — Shimmer Isle side-scrolling world
   ============================================================ */
function hexLerp(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  return `rgb(${Math.round(lerp(pa[0], pb[0], t))},${Math.round(lerp(pa[1], pb[1], t))},${Math.round(lerp(pa[2], pb[2], t))})`;
}
/* time-of-day sky keyframes: [t, top, bottom, darkness0-1] */
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

/* elevation & ground */
function elevAt(x) {
  let e = 0;
  if (x > 6600) e = ease(clamp((x - 6600) / 1600, 0, 1)) * 150;
  if (x > 4200 && x <= 6600) e = Math.sin((x - 4200) / 2400 * Math.PI) * 16;
  return e;
}
function gyAt(x) { return VH * .78 - elevAt(x); }

/* ── prop sprites ────────────────────────────────────────── */
function palmSpr(v) {
  return spr('palm' + v, 180, 240, c => {
    const lean = (n1(v * 7.7) - .5) * .5;
    c.strokeStyle = '#8C6A4B'; c.lineWidth = 13; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(lean * 40, -110, lean * 70, -180); c.stroke();
    c.strokeStyle = '#7A5A3E'; c.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      const yy = -i * 36, xx = lean * 40 * (i / 5) * 1.6;
      c.beginPath(); c.moveTo(xx - 7, yy); c.quadraticCurveTo(xx, yy - 5, xx + 7, yy - 2); c.stroke();
    }
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
    c.fillStyle = '#8C6A4B';
    oval(c, tx - 6, ty + 4, 5, 6, '#A67C52', '#7A5A3E'); oval(c, tx + 6, ty + 6, 5, 6, '#A67C52', '#7A5A3E');
  });
}
function houseSpr(v, col, roof) {
  return spr('house' + v, 220, 200, c => {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 3;
    rr(c, -70, -120, 140, 120, 10); c.fill(); c.stroke();
    // roof
    c.fillStyle = roof;
    c.beginPath(); c.moveTo(-84, -114); c.quadraticCurveTo(0, -196, 84, -114); c.lineTo(70, -114);
    c.quadraticCurveTo(0, -178, -70, -114); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-70, -114); c.quadraticCurveTo(0, -178, 70, -114); c.closePath();
    c.fillStyle = roof; c.fill(); c.stroke();
    // door + window
    rr(c, -18, -52, 36, 52, 14); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    oval(c, 8, -26, 2.6, 2.6, '#FFE14C', null);
    oval(c, -42, -80, 15, 15, '#BFE9FF', INK);
    line(c, -42, -95, -42, -65, 2, INK); line(c, -57, -80, -27, -80, 2, INK);
    oval(c, 42, -80, 15, 15, '#BFE9FF', INK);
    line(c, 42, -95, 42, -65, 2, INK); line(c, 27, -80, 57, -80, 2, INK);
    // flowers at base
    for (let i = 0; i < 5; i++) {
      const fx = -60 + i * 30;
      c.fillStyle = ['#FF8FB1', '#FFE14C', '#B9A8FF'][i % 3];
      for (let p = 0; p < 5; p++) { const a = p * TAU / 5; oval(c, fx + Math.cos(a) * 4, -8 + Math.sin(a) * 4, 3, 3, c.fillStyle, null); }
      oval(c, fx, -8, 2.5, 2.5, '#FFF', null);
    }
  });
}
function cafeSpr() {
  return spr('cafe', 320, 260, c => {
    // cottage
    c.fillStyle = '#FFF3DD'; c.strokeStyle = INK; c.lineWidth = 3.5;
    rr(c, -110, -130, 220, 130, 12); c.fill(); c.stroke();
    // strawberry roof
    c.fillStyle = '#F26D99';
    c.beginPath(); c.moveTo(-126, -124); c.quadraticCurveTo(0, -226, 126, -124); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#FFF';
    for (let i = 0; i < 6; i++) oval(c, -75 + i * 30, -150 - Math.abs(i - 2.5) * -2 - 14, 5, 7, '#FFF6E8', null);
    // awning
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#FF9FBE' : '#FFF6E8';
      c.beginPath(); c.moveTo(-108 + i * 36, -86); c.lineTo(-72 + i * 36, -86); c.lineTo(-72 + i * 36, -70);
      c.arc(-90 + i * 36, -70, 18, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
    // window + door
    rr(c, -78, -60, 62, 44, 8); c.fillStyle = '#BFE9FF'; c.fill(); c.stroke();
    c.fillStyle = '#FFD9A0'; rr(c, -70, -34, 46, 8, 3); c.fill();
    rr(c, 22, -64, 44, 64, 16); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    // big sign
    rr(c, -55, -196, 110, 44, 20); c.fillStyle = '#FFF6E8'; c.fill(); c.stroke();
    c.font = '900 21px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#E56A93';
    c.fillText('☕ CAFÉ ♪', 0, -166);
  });
}
function shopSpr() {
  return spr('shop', 280, 230, c => {
    c.fillStyle = '#D8F2FF'; c.strokeStyle = INK; c.lineWidth = 3.5;
    rr(c, -95, -115, 190, 115, 12); c.fill(); c.stroke();
    // flat blue roof
    c.fillStyle = '#3E7BFF';
    rr(c, -108, -140, 216, 30, 10); c.fill(); c.stroke();
    // surfboard leaning
    c.save(); c.translate(-118, -20); c.rotate(-.18);
    oval(c, 0, -50, 16, 58, '#FFC24C', INK);
    line(c, 0, -95, 0, -6, 2.4, '#E09B2D');
    c.restore();
    // porthole windows
    for (const wx of [-45, 45]) {
      oval(c, wx, -75, 17, 17, '#9BE8FF', INK);
      c.strokeStyle = '#3E7B8C'; c.lineWidth = 3; c.beginPath(); c.arc(wx, -75, 12, 0, TAU); c.stroke();
    }
    rr(c, -20, -58, 40, 58, 14); c.fillStyle = '#2B5BB5'; c.fill(); c.strokeStyle = INK; c.stroke();
    // sign
    rr(c, -70, -186, 140, 40, 18); c.fillStyle = '#FFF6E8'; c.fill(); c.stroke();
    c.font = '900 19px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#2B5BB5';
    c.fillText('🤿 DIVE SHOP', 0, -158);
    // flag bunting
    for (let i = 0; i < 5; i++) {
      c.fillStyle = ['#FF8FB1', '#FFE14C', '#7FD8E8', '#7FE08C', '#B9A8FF'][i];
      c.beginPath(); c.moveTo(-90 + i * 45, -140); c.lineTo(-70 + i * 45, -140); c.lineTo(-80 + i * 45, -122); c.closePath(); c.fill();
    }
  });
}
function lighthouseSpr() {
  return spr('lighthouse', 260, 420, c => {
    // tower
    c.beginPath(); c.moveTo(-52, 0); c.lineTo(-34, -290); c.lineTo(34, -290); c.lineTo(52, 0); c.closePath();
    c.fillStyle = '#FFF6E8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.5; c.stroke();
    // red stripes
    c.save(); c.clip();
    c.fillStyle = '#E23B4E';
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(0, -60 - i * 96); c.rotate(-.06);
      c.fillRect(-70, -24, 140, 46); c.restore();
    }
    c.restore();
    c.beginPath(); c.moveTo(-52, 0); c.lineTo(-34, -290); c.lineTo(34, -290); c.lineTo(52, 0); c.closePath(); c.stroke();
    // gallery + lamp room
    rr(c, -44, -304, 88, 16, 6); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
    rr(c, -28, -366, 56, 62, 8); c.fillStyle = '#BFE9FF'; c.fill(); c.stroke();
    line(c, -28, -336, 28, -336, 2.4, INK);
    // dome
    c.beginPath(); c.arc(0, -366, 30, Math.PI, 0); c.closePath();
    c.fillStyle = '#E23B4E'; c.fill(); c.stroke();
    oval(c, 0, -398, 4, 6, '#FFD24C', INK);
    // door
    rr(c, -20, -56, 40, 56, 16); c.fillStyle = '#B3574A'; c.fill(); c.stroke();
  });
}
function standSpr() {
  return spr('stand', 200, 170, c => {
    // pudding stand
    c.fillStyle = '#FFE9C9'; c.strokeStyle = INK; c.lineWidth = 3;
    rr(c, -70, -66, 140, 66, 8); c.fill(); c.stroke();
    c.fillStyle = '#8C5A33'; rr(c, -76, -78, 152, 14, 6); c.fill(); c.stroke();
    for (const px of [-58, 62]) line(c, px, -78, px, -130, 5, '#8C5A33');
    // scalloped awning
    c.fillStyle = '#FFD86B';
    c.beginPath(); c.moveTo(-78, -128); c.lineTo(78, -128); c.lineTo(78, -112);
    for (let i = 3; i >= 0; i--) c.arc(-58 + i * 39 + 19.5, -112, 19.5, 0, Math.PI);
    c.closePath(); c.fill(); c.stroke();
    // big pudding on counter
    c.beginPath(); c.moveTo(-22, -80); c.quadraticCurveTo(-24, -108, 0, -110);
    c.quadraticCurveTo(24, -108, 22, -80); c.closePath();
    c.fillStyle = '#FFD86B'; c.fill(); c.stroke();
    c.fillStyle = '#8C5A33';
    c.beginPath(); c.moveTo(-16, -104); c.quadraticCurveTo(0, -116, 16, -104);
    c.quadraticCurveTo(10, -98, 8, -102); c.quadraticCurveTo(0, -96, -8, -102);
    c.quadraticCurveTo(-12, -98, -16, -104); c.closePath(); c.fill();
  });
}
function hammockSpr() {
  return spr('hammock', 240, 150, c => {
    line(c, -95, 0, -95, -105, 9, '#8C6A4B');
    line(c, 95, 0, 95, -105, 9, '#8C6A4B');
    c.strokeStyle = '#F2E2C4'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(-92, -88); c.quadraticCurveTo(0, -34, 92, -88); c.stroke();
    c.strokeStyle = '#E0C9A0'; c.lineWidth = 2.4;
    for (let i = 1; i < 6; i++) {
      c.beginPath(); c.moveTo(-92 + i * 3, -88);
      c.quadraticCurveTo(0, -36 - i * 1.5, 92 - i * 3, -88); c.stroke();
    }
  });
}
function dockSpr() {
  return spr('dock', 420, 140, c => {
    c.fillStyle = '#A67C52'; c.strokeStyle = '#7A5A3E'; c.lineWidth = 2.4;
    for (let i = 0; i < 9; i++) { rr(c, -200 + i * 45, -60, 41, 14, 3); c.fill(); c.stroke(); }
    for (const px of [-190, -60, 60, 185]) { line(c, px, -52, px, 30, 10, '#8C6A4B'); }
    line(c, -205, -66, 205, -66, 6, '#8C6A4B');
  });
}
function boatSpr() {
  return spr('boat', 260, 220, c => {
    // sailboat
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
function pierSpr() {
  return spr('pier', 200, 110, c => {
    c.fillStyle = '#A67C52'; c.strokeStyle = '#7A5A3E'; c.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) { rr(c, -85 + i * 44, -44, 40, 12, 3); c.fill(); c.stroke(); }
    for (const px of [-78, 0, 82]) line(c, px, -38, px, 26, 9, '#8C6A4B');
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
    if (kind === 'mango') { oval(c, tx - 20, ty + 26, 9, 11, '#FF9838', INK); oval(c, tx + 22, ty + 20, 9, 11, '#FFB84D', INK); }
    if (kind === 'banana') {
      c.strokeStyle = '#FFE14C'; c.lineWidth = 6; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(tx + 14, ty + 24 + i * 3, 12 + i * 2, .3, Math.PI * .8); c.stroke(); }
    }
    if (kind === 'coconut') { oval(c, tx - 10, ty + 18, 8, 8, '#8C6A4B', INK); oval(c, tx + 10, ty + 20, 8, 8, '#7A5A3E', INK); }
  });
}
function festivalSpr() {
  return spr('festival', 460, 200, c => {
    // strings of lanterns between two poles
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

/* ── island prop layout ──────────────────────────────────── */
let PROPS = null;
function initProps() {
  PROPS = [];
  const add = (x, s, scale = 1, layer = 1, para = 1) => PROPS.push({ x, s, scale, layer, para });
  // beach palms
  add(340, palmSpr(1), 1.05); add(760, palmSpr(2), .9); add(1130, palmSpr(3), 1.1);
  add(1680, palmSpr(4), .95);
  add(140, dockSpr(), 1);
  add(60, boatSpr(), .9);
  add(1430, cafeSpr(), 1);
  // village
  add(1980, houseSpr(1, '#FFE3EE', '#F26D99'), .9);
  add(2450, shopSpr(), 1);
  add(2780, houseSpr(2, '#E3F0FF', '#3E7BFF'), .95);
  add(3060, standSpr(), 1);
  add(3200, hammockSpr(), 1);
  add(3620, houseSpr(3, '#FFF3D0', '#FFB84D'), 1);
  add(3900, pierSpr(), 1);
  // jungle
  const JT = [[4450, 'coconut'], [4700, 'mango'], [5100, 'banana'], [5500, 'coconut'], [5900, 'mango'], [6200, 'banana']];
  JT.forEach(([x, k], i) => add(x, jungleTreeSpr(k, i), 1 + n1(i * 5.5) * .25));
  // extra jungle depth (background palms)
  for (let i = 0; i < 9; i++) add(4300 + i * 270 + n1(i) * 120, palmSpr(5 + (i % 3)), .7, 0, .85);
  // cliff
  add(7000, palmSpr(9), .85); add(7400, pierSpr(), 1);
  add(8800, lighthouseSpr(), 1);
  add(8450, festivalSpr(), 1);
}
/* fruit trees state (session) */
const TREES = [
  { x: 4450, kind: 'coconut' }, { x: 4700, kind: 'mango' }, { x: 5100, kind: 'banana' },
  { x: 5500, kind: 'coconut' }, { x: 5900, kind: 'mango' }, { x: 6200, kind: 'banana' },
];
TREES.forEach(tr => { tr.have = 2; tr.timer = 0; tr.shake = 0; });
const FRUIT_OF = { mango: 'mango', banana: 'banana', coconut: 'coconut' };
let fallingFruit = [];

/* clouds & birds */
const CLOUDS = [];
for (let i = 0; i < 9; i++) CLOUDS.push({ x: rnd(0, ISLE_W), y: rnd(.06, .3), s: rnd(.6, 1.4), v: rnd(4, 10) });
let birds = [];

/* ── island update ───────────────────────────────────────── */
function updateIsland(dt) {
  const p = G.p;
  // time of day
  G.tod = (G.tod + dt / 420) % 1;
  S.tod = G.tod;
  // movement
  if (!G.busy) {
    const ax = axisX();
    const spd = 285;
    p.vx = ax * spd;
    p.x = clamp(p.x + p.vx * dt, 60, ISLE_W - 60);
    p.face = ax !== 0 ? Math.sign(ax) : p.face;
    p.walk = lerp(p.walk, ax !== 0 ? 1 : 0, dt * 10);
    if (ax !== 0) {
      p.anim += dt;
      if (p.anim > .26) { p.anim = 0; AudioSys.sfx('step'); }
    }
    S.px = p.x;
  } else p.walk = lerp(p.walk, 0, dt * 10);
  // camera
  G.cam.x = lerp(G.cam.x, clamp(p.x - VW / 2, 0, ISLE_W - VW), 1 - Math.pow(.001, dt));
  // clouds
  CLOUDS.forEach(cl => { cl.x += cl.v * dt; if (cl.x > ISLE_W + 300) cl.x = -300; });
  // birds occasionally
  if (birds.length < 3 && Math.random() < dt * .05 && !isNight()) {
    birds.push({ x: G.cam.x - 100, y: rnd(.1, .35) * VH, v: rnd(60, 110), ph: rnd(TAU) });
    if (Math.random() < .4) AudioSys.sfx('chirp');
  }
  birds = birds.filter(b => b.x < G.cam.x + VW + 200);
  birds.forEach(b => { b.x += b.v * dt; b.y += Math.sin(G.t * 2 + b.ph) * 10 * dt; });
  // trees regrow
  TREES.forEach(tr => {
    tr.shake = Math.max(0, tr.shake - dt * 3);
    if (tr.have < 2) { tr.timer += dt; if (tr.timer > 45) { tr.timer = 0; tr.have++; } }
  });
  // falling fruit
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
  // fireflies at night in jungle
  const inJungle = p.x > 4200 && p.x < 6600;
  if (isNight() && inJungle) {
    while (G.fireflies.length < 12) {
      G.fireflies.push({ x: p.x + rnd(-500, 500), y: gyAt(p.x) - rnd(30, 220), ph: rnd(TAU), caught: false });
    }
  } else if (!isNight()) G.fireflies.length = 0;
  G.fireflies.forEach(ff => {
    ff.x += Math.sin(G.t * .8 + ff.ph) * 26 * dt;
    ff.y += Math.cos(G.t * .6 + ff.ph * 2) * 20 * dt;
  });
  // weather
  const w = G.weather;
  w.next -= dt;
  if (w.next <= 0) { w.target = w.target > 0 ? 0 : (Math.random() < .3 && S.mq > 4 ? 1 : 0); w.next = rnd(50, 110); }
  w.rain = lerp(w.rain, w.target, dt * .5);
  // ambience
  AudioSys.ambience('island', clamp(1.4 - p.x / 2600, .25, 1));
  const wantTrack = isNight() ? 'night' : 'island';
  if (!G.cutscene && AudioSys.current() !== wantTrack && ['island', 'night'].includes(AudioSys.current() || 'island')) AudioSys.play(wantTrack, 2);
  findInteract();
}

/* ── island draw ─────────────────────────────────────────── */
function drawIsland() {
  const sky = skyAt(G.tod);
  const camX = G.cam.x;
  // sky
  const gr = ctx.createLinearGradient(0, 0, 0, VH * .8);
  gr.addColorStop(0, sky.top); gr.addColorStop(1, sky.bot);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  // stars
  if (sky.dark > .3) {
    ctx.fillStyle = `rgba(255,255,240,${(sky.dark - .3) * 1.4})`;
    for (let i = 0; i < 70; i++) {
      const sx = (n1(i * 13.7) * 1.3 * VW - camX * .05) % (VW + 40), sy = n1(i * 7.1) * VH * .55;
      const tw = .5 + .5 * Math.sin(G.t * 2 + i * 2.4);
      ctx.globalAlpha = (sky.dark - .3) * 1.4 * tw;
      ctx.fillRect((sx + VW + 40) % (VW + 40) - 20, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // sun / moon
  const dayArc = clamp((G.tod - .26) / .58, 0, 1);
  if (dayArc > 0 && dayArc < 1) {
    const sx = lerp(VW * .08, VW * .92, dayArc), sy = VH * .62 - Math.sin(dayArc * Math.PI) * VH * .48;
    glow(ctx, sx, sy, 90, rgba(255, 230, 150), .8);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, TAU); ctx.fill();
  }
  if (sky.dark > .4) {
    const na = clamp((G.tod > .5 ? G.tod - .87 : G.tod + .13) / .37, 0, 1);
    const mx = lerp(VW * .1, VW * .9, na), my = VH * .55 - Math.sin(na * Math.PI) * VH * .4;
    glow(ctx, mx, my, 70, rgba(220, 230, 255), .5);
    ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(mx, my, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(200,205,190,.5)';
    ctx.beginPath(); ctx.arc(mx - 8, my - 5, 5, 0, TAU); ctx.arc(mx + 7, my + 8, 7, 0, TAU); ctx.fill();
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
  sea.addColorStop(0, hexLerp('#2E86B0', '#0E2A44', sky.dark));
  sea.addColorStop(1, hexLerp('#5BB8D8', '#123650', sky.dark));
  ctx.fillStyle = sea; ctx.fillRect(0, horY, VW, VH * .3);
  // sun sparkle path on water
  if (sky.dark < .35) {
    ctx.fillStyle = `rgba(255,240,190,${.24 - sky.dark * .4})`;
    for (let i = 0; i < 18; i++) {
      const yy = horY + 8 + i * 8, ww = 30 + i * 6;
      const sx = VW * .5 + Math.sin(G.t * 1.2 + i) * i * 3;
      ctx.fillRect(sx - ww / 2, yy, ww * (.5 + .5 * Math.sin(G.t * 2 + i * 2)), 2.4);
    }
  }
  // distant isles
  ctx.fillStyle = hexLerp('#5C9E8C', '#16324A', sky.dark * .9);
  const dIsle = (bx, w2, h2) => {
    const sx = bx - camX * .12;
    ctx.beginPath(); ctx.moveTo(sx - w2, horY + 2);
    ctx.quadraticCurveTo(sx, horY - h2, sx + w2, horY + 2); ctx.closePath(); ctx.fill();
  };
  dIsle(700, 160, 44); dIsle(2400, 220, 66); dIsle(5200, 130, 36); dIsle(8000, 260, 80);
  // waves at shore
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
  // ground
  drawGround(camX, sky);
  // props behind
  drawPropsLayer(0, camX);
  // water inlets at dive spots + buoys
  BUOYS.forEach(b => drawDiveSpot(b, camX, sky));
  // props main
  drawPropsLayer(1, camX);
  // dynamic bits: fruits on trees handled inside sprites; falling fruit:
  fallingFruit.forEach(f => {
    const em = { mango: '#FF9838', banana: '#FFE14C', coconut: '#8C6A4B' }[f.kind];
    ctx.save(); ctx.translate(f.x - camX, f.y); ctx.rotate(f.life * 3);
    oval(ctx, 0, 0, 8, f.kind === 'banana' ? 5 : 9, em, INK);
    ctx.restore();
  });
  // quest pickups
  drawIslandPickups(camX);
  // NPCs
  drawIslandNPCs(camX);
  // player
  const p = G.p;
  ctx.save();
  ctx.translate(p.x - camX, gyAt(p.x));
  // shadow
  ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.beginPath(); ctx.ellipse(2, 2, 20, 5, 0, 0, TAU); ctx.fill();
  drawLila(ctx, G.t, { face: p.face, walk: p.walk, talk: false, outfit: S.outfit });
  ctx.restore();
  // fireflies
  G.fireflies.forEach(ff => {
    const a = .5 + .5 * Math.sin(G.t * 4 + ff.ph * 3);
    glow(ctx, ff.x - camX, ff.y, 16, rgba(220, 255, 140), .5 * a + .2);
    ctx.fillStyle = `rgba(235,255,160,${.6 + .4 * a})`;
    ctx.beginPath(); ctx.arc(ff.x - camX, ff.y, 2.4, 0, TAU); ctx.fill();
  });
  // rain
  if (G.weather.rain > .02) {
    ctx.strokeStyle = `rgba(180,210,240,${.4 * G.weather.rain})`; ctx.lineWidth = 1.6;
    for (let i = 0; i < 60 * G.weather.rain; i++) {
      const rx = (n1(i * 3.1) * VW + G.t * 300 * (0.7 + n1(i) * .5)) % VW;
      const ry = (n1(i * 7.7) * VH + G.t * (500 + n1(i * 2) * 200)) % VH;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
    }
  }
  // birds
  ctx.strokeStyle = `rgba(60,60,70,${1 - sky.dark})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  birds.forEach(b => {
    const f2 = Math.sin(G.t * 9 + b.ph) * 6;
    ctx.beginPath(); ctx.moveTo(b.x - camX - 8, b.y - f2 * .4);
    ctx.quadraticCurveTo(b.x - camX, b.y + f2, b.x - camX + 8, b.y - f2 * .4); ctx.stroke();
  });
  // night darkness + lights
  if (sky.dark > .02) {
    ctx.fillStyle = `rgba(10,16,50,${sky.dark * .42})`; ctx.fillRect(0, 0, VW, VH);
    // lighthouse beam
    if (S.mq >= 8) {
      const lx = 8800 - camX, ly = gyAt(8800) - 358;
      if (lx > -600 && lx < VW + 600) {
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.sin(G.t * .5) * .5);
        const bg = ctx.createLinearGradient(0, 0, 500, 0);
        bg.addColorStop(0, `rgba(255,240,180,${.34 * sky.dark})`); bg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(520, -70); ctx.lineTo(520, 70); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // window lights
    [[1430, -60], [1980, -80], [2780, -80], [3620, -80], [2450, -75]].forEach(([wx, wy]) => {
      glow(ctx, wx - camX, gyAt(wx) + wy, 40, rgba(255, 220, 140), sky.dark * .5);
    });
    glow(ctx, G.p.x - camX, gyAt(G.p.x) - 50, 110, rgba(255, 235, 190), sky.dark * .3);
  }
  drawSparkles(camX, 0);
  drawInteractPrompt(camX);
  drawCompassHint();
}
function drawGround(camX, sky) {
  const step = 22;
  ctx.beginPath();
  ctx.moveTo(-10, VH + 10);
  for (let sx = -10; sx <= VW + step; sx += step) ctx.lineTo(sx, gyAt(sx + camX));
  ctx.lineTo(VW + 10, VH + 10); ctx.closePath();
  // per-zone tint blend: sample mid zone
  const zx = camX + VW / 2;
  const gcol = zx < 1800 ? ['#F2DCA8', '#E8C98C'] : zx < 4200 ? ['#E8D2A0', '#D8B888'] : zx < 6600 ? ['#7FC96B', '#5CA84E'] : ['#9CA88C', '#7A8A6E'];
  const gg = ctx.createLinearGradient(0, VH * .6, 0, VH);
  gg.addColorStop(0, hexLerp(gcol[0], '#20304A', sky.dark * .6));
  gg.addColorStop(1, hexLerp(gcol[1], '#182640', sky.dark * .6));
  ctx.fillStyle = gg; ctx.fill();
  // ground edge highlight
  ctx.strokeStyle = `rgba(255,255,255,${.35 - sky.dark * .2})`; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let sx = -10; sx <= VW + step; sx += step) {
    const yy = gyAt(sx + camX);
    sx <= 0 ? ctx.moveTo(sx, yy) : ctx.lineTo(sx, yy);
  }
  ctx.stroke();
  // deco: shells/grass/flowers deterministic
  for (let i = 0; i < 40; i++) {
    const wx = Math.floor(camX / 90) * 90 + i * 90 - 400;
    const h = n1(wx * .017);
    const sx2 = wx - camX; if (sx2 < -40 || sx2 > VW + 40) continue;
    const gy = gyAt(wx) + 10 + h * 26;
    if (wx < 1800 || (wx > 3700 && wx < 4200)) { // shells on sand
      if (h > .5) { ctx.fillStyle = h > .75 ? '#FFF0F4' : '#FFD9A0'; ctx.beginPath(); ctx.arc(sx2, gy, 3.4, Math.PI, 0); ctx.fill(); }
    } else if (wx < 6600 && wx > 4200) { // jungle grass
      ctx.strokeStyle = '#3E8E4C'; ctx.lineWidth = 2;
      for (let g2 = -1; g2 <= 1; g2++) {
        ctx.beginPath(); ctx.moveTo(sx2 + g2 * 4, gy);
        ctx.quadraticCurveTo(sx2 + g2 * 6, gy - 8, sx2 + g2 * 8 + Math.sin(G.t * 2 + wx) * 1.5, gy - 13); ctx.stroke();
      }
    } else if (h > .6) { // flowers
      const cols = ['#FF8FB1', '#FFE14C', '#B9A8FF', '#7FD8E8'];
      ctx.fillStyle = cols[Math.floor(h * 8) % 4];
      for (let pp = 0; pp < 5; pp++) { const a = pp * TAU / 5; ctx.beginPath(); ctx.ellipse(sx2 + Math.cos(a) * 3.6, gy - 6 + Math.sin(a) * 3.6, 2.6, 2.6, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(sx2, gy - 6, 2, 0, TAU); ctx.fill();
    }
  }
}
function drawPropsLayer(layer, camX) {
  PROPS.forEach(pr => {
    if (pr.layer !== layer) return;
    const sx = pr.x - camX * pr.para;
    const halfW = pr.s.width / 4 * pr.scale;
    if (sx + halfW < -50 || sx - halfW > VW + 50) return;
    blit(ctx, pr.s, sx, gyAt(pr.x) + 2, pr.scale);
  });
  if (layer !== 1) return;
  // tree shake wobble + fruit indicators
  TREES.forEach(tr => {
    const sx = tr.x - camX;
    if (sx < -150 || sx > VW + 150) return;
    if (tr.have > 0) {
      for (let i = 0; i < tr.have; i++) {
        const fx = sx + (i ? 26 : -22) + Math.sin(G.t * 1.4 + tr.x + i) * 2 + (tr.shake ? Math.sin(G.t * 40) * 4 : 0);
        const fy = gyAt(tr.x) - 172 + i * 10;
        const col = { mango: '#FF9838', banana: '#FFE14C', coconut: '#8C6A4B' }[tr.kind];
        oval(ctx, fx, fy, 8, tr.kind === 'banana' ? 5 : 9, col, INK);
      }
    }
  });
}
function drawDiveSpot(b, camX, sky) {
  const sx = b.x - camX;
  if (sx < -220 || sx > VW + 220) return;
  const gy = gyAt(b.x);
  // water pool
  const wg = ctx.createLinearGradient(0, gy - 4, 0, gy + 60);
  wg.addColorStop(0, hexLerp('#7FD8E8', '#16324A', sky.dark * .7));
  wg.addColorStop(1, hexLerp('#2E86B0', '#0E2A44', sky.dark * .7));
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(sx, gy + 22, 95, 30, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(sx, gy + 22, 95, 30, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  // ripples
  for (let i = 0; i < 2; i++) {
    const rp = ((G.t * .5 + i * .5) % 1);
    ctx.strokeStyle = `rgba(255,255,255,${.4 * (1 - rp)})`;
    ctx.beginPath(); ctx.ellipse(sx, gy + 22, 20 + rp * 60, 7 + rp * 20, 0, 0, TAU); ctx.stroke();
  }
  // buoy
  const bob = Math.sin(G.t * 1.8 + b.x) * 3;
  ctx.save(); ctx.translate(sx + 46, gy + 14 + bob); ctx.rotate(Math.sin(G.t * 1.3 + b.x) * .1);
  oval(ctx, 0, 0, 13, 13, '#E23B4E', INK);
  ctx.fillStyle = '#FFF6E8'; ctx.beginPath(); ctx.arc(0, 0, 13, Math.PI * 1.15, Math.PI * 1.85); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  line(ctx, 0, -12, 0, -20, 3, '#8C6A4B');
  oval(ctx, 0, -22, 3.4, 3.4, '#FFE14C', INK);
  ctx.restore();
}
/* ============================================================
   ISLAND ii — NPCs, pickups, interaction & particles
   ============================================================ */
function islandNPCList() {
  const list = [
    { id: 'melody', x: 1330 },
    { id: 'pochacco', x: 2450 },
    { id: 'purin', x: S.flags.purinAwake ? 3010 : 3200, sleep: !S.flags.purinAwake },
    { id: 'kitty', x: 8760 },
  ];
  if (S.mq >= 5) list.push({ id: 'sammy', x: 5620 });
  if (S.mq <= 1 || S.mq >= 15) list.push({ id: 'pigeon', x: 290 });
  return list;
}
function drawIslandNPCs(camX) {
  if (G.cutscene && G.cutscene.data && G.cutscene.data.fw) return; // finale draws its own cast
  islandNPCList().forEach(n => {
    const sx = n.x - camX;
    if (sx < -120 || sx > VW + 120) return;
    const gy = gyAt(n.x) + (n.id === 'purin' && !S.flags.purinAwake ? -46 : 0); // sleeping in hammock
    const face = G.p.x > n.x ? 1 : -1;
    const talking = G.dialog && G.dialog.who === n.id;
    ctx.save(); ctx.translate(sx, gy);
    ctx.fillStyle = 'rgba(40,30,20,.15)'; ctx.beginPath(); ctx.ellipse(0, 2, 20, 5, 0, 0, TAU); ctx.fill();
    PAINT[n.id](ctx, G.t + n.x, { face, talk: talking, sleep: n.sleep, hop: n.id === 'pochacco' && S.mq === 2 && !S.flags.gotBall });
    ctx.restore();
    // "!" marker when this npc is the quest target
    if (questTargetsNpc(n.id)) {
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
function questTargetsNpc(id) {
  if (S.mq >= 15) return false;
  const q = S.mq;
  if (id === 'melody' && (q === 1 || (q === 5 && invCount('mango') >= 2 && invCount('banana') >= 1) || (q === 6 && !invCount('dish_pudding')) || (q === 11 && invCount('plank') >= 4))) return true;
  if (id === 'pochacco' && ((q === 2 && S.flags.gotBall) || (q === 7 && !S.gear.tank1))) return true;
  if (id === 'purin' && q === 6 && invCount('dish_pudding') > 0) return true;
  if (id === 'kitty' && ((q === 8 && (!S.flags.kittyMet || (S.flags.fireflies || 0) >= 5)) || q === 14)) return true;
  return false;
}

/* quest pickups on island */
function islandPickups() {
  const list = [];
  if (S.mq === 2 && !S.flags.gotBall) list.push({ x: 240, kind: 'ball' });
  if (S.mq === 11) {
    [520, 880, 1180, 1560].forEach((px, i) => {
      if (!S.flags['plank' + i]) list.push({ x: px, kind: 'plank', i });
    });
  }
  STARFISH.forEach(sf => {
    if (sf.sc === 'island' && !S.stickers.includes(sf.id)) list.push({ x: sf.x, kind: 'starfish', id: sf.id });
  });
  ACORNS.forEach(a => {
    if (!S.flags[a.id]) list.push({ x: a.x, kind: 'acorn', id: a.id });
  });
  return list;
}
function drawIslandPickups(camX) {
  islandPickups().forEach(pk => {
    const sx = pk.x - camX;
    if (sx < -60 || sx > VW + 60) return;
    const gy = gyAt(pk.x), bob = Math.sin(G.t * 2.6 + pk.x) * 3;
    if (pk.kind === 'ball') {
      ctx.save(); ctx.translate(sx, gy - 12); ctx.rotate(G.t);
      oval(ctx, 0, 0, 12, 12, '#FFF6E8', INK);
      ctx.fillStyle = '#E23B4E'; ctx.beginPath(); ctx.arc(0, 0, 12, -.5, .9); ctx.lineTo(0, 0); ctx.fill();
      ctx.fillStyle = '#3E7BFF'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI - .5, Math.PI + .9); ctx.lineTo(0, 0); ctx.fill();
      ctx.restore();
      glow(ctx, sx, gy - 12, 26, rgba(255, 255, 200), .3);
    } else if (pk.kind === 'plank') {
      ctx.save(); ctx.translate(sx, gy - 6); ctx.rotate(.2 + n1(pk.i) * .4);
      rr(ctx, -20, -5, 40, 10, 4); ctx.fillStyle = '#A67C52'; ctx.fill();
      ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      glow(ctx, sx, gy - 8, 24, rgba(255, 240, 180), .3 + .15 * Math.sin(G.t * 3));
    } else if (pk.kind === 'starfish') {
      glow(ctx, sx, gy - 10 + bob, 24, rgba(255, 180, 220), .4 + .2 * Math.sin(G.t * 3));
      ctx.save(); ctx.translate(sx, gy - 10 + bob); ctx.rotate(Math.sin(G.t * 1.5) * .2);
      starPath(ctx, 0, 0, 11, 5.2);
      ctx.fillStyle = '#FF8FB1'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      dotEye(ctx, -3, -1, 1.4); dotEye(ctx, 3, -1, 1.4); smile(ctx, 0, 2, 2);
      ctx.restore();
    } else if (pk.kind === 'acorn') {
      glow(ctx, sx, gy - 12 + bob, 22, rgba(255, 215, 120), .45 + .2 * Math.sin(G.t * 4));
      ctx.save(); ctx.translate(sx, gy - 12 + bob);
      oval(ctx, 0, 2, 7, 8, '#FFC24C', INK);
      ctx.fillStyle = '#C98620'; rr(ctx, -8, -9, 16, 7, 3); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      line(ctx, 0, -9, 0, -13, 2.4, '#8C5A33');
      ctx.restore();
    }
  });
}

/* ── interact detection (island) ─────────────────────────── */
function findInteract() {
  const p = G.p, cands = [];
  if (G.busy) { G.nearTarget = null; return; }
  // NPCs
  islandNPCList().forEach(n => {
    if (Math.abs(p.x - n.x) < 78) cands.push({ x: n.x, icon: '💬', label: NPCS[n.id].n, act: () => talkTo(n.id) });
  });
  // café door
  if (Math.abs(p.x - 1505) < 55 && S.flags.cafeOpen) cands.push({ x: 1505, icon: '🍳', label: 'Kitchen', act: () => openPanel('cafe') });
  // dive buoys
  BUOYS.forEach(b => {
    if (Math.abs(p.x - b.x) < 70 && S.gear.snorkel) cands.push({ x: b.x, icon: '🌊', label: 'Dive!', act: () => startDive(b) });
  });
  // trees
  TREES.forEach(tr => {
    if (Math.abs(p.x - tr.x) < 60 && tr.have > 0) cands.push({ x: tr.x, icon: '🌴', label: 'Shake!', act: () => shakeTree(tr) });
  });
  // hammock nap
  if (Math.abs(p.x - 3200) < 55 && S.flags.purinAwake) cands.push({ x: 3200, icon: '😴', label: isNight() ? 'Nap till morning' : 'Nap till night', act: napHammock });
  // pickups
  islandPickups().forEach(pk => {
    if (Math.abs(p.x - pk.x) < 52) cands.push({ x: pk.x, icon: '✨', label: 'Pick up', act: () => takePickup(pk) });
  });
  // fireflies
  if (S.mq === 8 && S.flags.kittyMet && (S.flags.fireflies || 0) < 5 && isNight()) {
    G.fireflies.forEach(ff => {
      if (Math.abs(p.x - ff.x) < 55 && ff.y > gyAt(p.x) - 150) cands.push({ x: ff.x, icon: '🫙', label: 'Catch firefly!', act: () => catchFirefly(ff) });
    });
  }
  cands.sort((a, b2) => Math.abs(p.x - a.x) - Math.abs(p.x - b2.x));
  G.nearTarget = cands[0] || null;
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
  // pointer nub
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

/* ── compass hint (arrow orb pointing to objective) ─────── */
function drawCompassHint() {
  if (!S.gear.compass || S.mq >= 15 || G.busy) return;
  const q = MQ[S.mq]; if (!q) return;
  const tgt = q.tgt();
  let dx = 0, dy = 0, far = false;
  if (G.mode === 'island') {
    if (tgt.sc !== 'island') {
      // nearest buoy
      let best = BUOYS[0], bd = 1e9;
      BUOYS.forEach(b => { const d = Math.abs(Math.abs(tgt.x - b.uwx) * .8 + 0) + Math.abs(b.x - G.p.x); if (d < bd) { bd = d; best = b; } });
      dx = best.x - G.p.x; dy = 0; far = Math.abs(dx) > 260;
    } else { dx = tgt.x - G.p.x; dy = 0; far = Math.abs(dx) > 320; }
  } else if (G.mode === 'dive' && tgt.sc === 'dive') {
    dx = tgt.x - G.p.x; dy = tgt.y - G.p.y; far = Math.hypot(dx, dy) > 320;
  } else if (G.mode === 'dive' && tgt.sc === 'island') {
    dx = 0; dy = -G.p.y; far = true; // point up: surface!
  }
  if (!far) return;
  const px = G.mode === 'island' ? G.p.x - G.cam.x : G.p.x - G.cam.x;
  const py = G.mode === 'island' ? gyAt(G.p.x) - 130 : G.p.y - G.cam.y - 70;
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
   DIVE — the sea beneath Shimmer Isle
   ============================================================ */
let UW = null; // session-persistent underwater layout
function initUW() {
  if (UW) return;
  UW = { corals: [], rocks: [], jellies: [], plants: [], crystals: [] };
  // coral clusters — shallow reef
  for (let i = 0; i < 34; i++) {
    UW.corals.push({
      x: 200 + n1(i * 17.3) * 5600,
      y: 480 + n1(i * 31.1) * 420,
      v: i % 5, s: .7 + n1(i * 7.7) * .9,
      hue: [340, 25, 265, 175, 45][i % 5],
    });
  }
  // rocks scattered all over
  for (let i = 0; i < 60; i++) {
    UW.rocks.push({
      x: 100 + n1(i * 11.7) * (UW_W - 200),
      y: 600 + n1(i * 23.9) * (UW_D - 800),
      s: 26 + n1(i * 5.1) * 90,
    });
  }
  // crystals in abyss
  for (let i = 0; i < 22; i++) {
    UW.crystals.push({ x: 150 + n1(i * 41.3) * (UW_W - 300), y: 2350 + n1(i * 13.7) * 1150, s: 14 + n1(i * 9.1) * 30, ph: n1(i) * TAU });
  }
  // jellyfish — twilight & trench
  for (let i = 0; i < 22; i++) {
    const trench = i > 13;
    UW.jellies.push({
      x: trench ? 4750 + n1(i * 3.3) * 900 : 300 + n1(i * 19.1) * 5400,
      y: trench ? 2050 + n1(i * 7.9) * 900 : 900 + n1(i * 27.7) * 1000,
      ph: n1(i * 2) * TAU, sz: 16 + n1(i * 4.4) * 12, hue: 300 + n1(i * 6.6) * 60, cd: 0,
    });
  }
  // air plants (bubble kelp)
  [[700, 700], [1500, 1100], [2450, 1500], [3300, 1050], [1900, 2100], [4100, 2300],
   [5000, 1900], [5350, 2700], [2800, 2800], [3600, 3200], [2200, 3100], [4700, 3000]]
    .forEach(([x, y]) => UW.plants.push({ x, y, cd: 0 }));
}
function startDive(buoy) {
  initUW();
  fadeTransition(() => {
    G.mode = 'dive';
    const p = G.p;
    p.x = buoy.uwx; p.y = 140; p.vx = 0; p.vy = 0; p.face = 1;
    p.air = airMax(); p.sting = 0;
    G.cam.x = clamp(p.x - VW / 2, 0, UW_W - VW);
    G.cam.y = 0;
    G.dive = {
      buoy, fishes: [], glass: [], bub: [], glowPts: [], whale: { x: 1800, y: 2450, vx: 16, ph: 0 },
      rescue: false, exiting: false,
    };
    // scatter sea glass
    for (let i = 0; i < 26; i++) {
      G.dive.glass.push({
        x: rnd(150, UW_W - 150), y: rnd(400, UW_D - 150),
        kind: Math.random() < .6 ? 'glass' : 'shell', taken: false, ph: rnd(TAU),
      });
    }
    AudioSys.sfx('splash');
    AudioSys.play('sea', 1.6);
    AudioSys.ambience('dive');
    $('airWrap').style.display = 'block';
  });
}
function exitDive(rescued) {
  if (G.dive) G.dive.exiting = true;
  fadeTransition(() => {
    $('airWrap').style.display = 'none';
    G.mode = 'island';
    const bx = G.dive ? G.dive.buoy.x : 640;
    G.p.x = bx; G.p.y = 0; G.p.vx = 0;
    G.cam.x = clamp(bx - VW / 2, 0, ISLE_W - VW);
    G.dive = null;
    AudioSys.sfx('splash');
    AudioSys.setDepth(0);
    AudioSys.play(isNight() ? 'night' : 'island', 1.6);
    AudioSys.ambience('island');
    if (rescued) setTimeout(() => toast('Whew! The bubbles carried you up! 🫧'), 400);
    else onSurfaced();
  });
}

/* fish spawning near player */
function bandOf(y) { return y < 800 ? 0 : y < 2000 ? 1 : 2; }
function spawnFish() {
  const d = G.dive, p = G.p;
  const want = 15;
  if (d.fishes.length >= want) return;
  const band = bandOf(p.y + rnd(-350, 350));
  const pool = FISH.filter(f => f.band === band && !f.sight);
  if (!pool.length) return;
  let def = pick(pool);
  if (def.rare === 2 && Math.random() > .22) def = pick(pool.filter(f => f.rare < 2)) || def;
  if (def.rare === 3 && Math.random() > .1) return;
  const side = Math.random() < .5 ? -1 : 1;
  const bandY = [[120, 790], [820, 1980], [2020, 3480]][band];
  d.fishes.push({
    def, x: clamp(p.x + side * (VW / 2 + rnd(60, 300)), 40, UW_W - 40),
    y: clamp(p.y + rnd(-380, 380), bandY[0], bandY[1]),
    vx: rnd(-1, 1) < 0 ? -def.spd : def.spd, vy: 0, ph: rnd(TAU), flee: 0,
  });
}
function updateDive(dt) {
  const p = G.p, d = G.dive;
  if (!d) return;
  d.glowPts.length = 0;
  // ── swim control
  if (!G.busy && !d.rescue) {
    let ix = axisX(), iy = axisY();
    if (ptr.down && ix === 0 && iy === 0) {
      const px = p.x - G.cam.x, py = p.y - G.cam.y;
      const dx = ptr.x - px, dy = ptr.y - py;
      const m = Math.hypot(dx, dy);
      if (m > 30) { ix = dx / m; iy = dy / m; }
    }
    const m2 = Math.hypot(ix, iy) || 1;
    const spd = 195 * (S.gear.flippers ? 1.5 : 1) * (p.dash > 0 ? 2.4 : 1);
    p.vx = lerp(p.vx, ix / m2 * spd, dt * 4);
    p.vy = lerp(p.vy, iy / m2 * spd - 10, dt * 4);
    p.dash = Math.max(0, p.dash - dt);
  } else { p.vx = lerp(p.vx, 0, dt * 3); p.vy = lerp(p.vy, -6, dt * 3); }
  if (d.rescue) { p.vy = -560; p.vx = 0; }
  p.x = clamp(p.x + p.vx * dt, 30, UW_W - 30);
  p.y = clamp(p.y + p.vy * dt, 26, UW_D - 40);
  if (Math.abs(p.vx) > 12) p.face = Math.sign(p.vx);
  p.depth = p.y;
  // camera
  G.cam.x = lerp(G.cam.x, clamp(p.x - VW / 2, 0, UW_W - VW), 1 - Math.pow(.002, dt));
  G.cam.y = lerp(G.cam.y, clamp(p.y - VH / 2, 0, UW_D - VH), 1 - Math.pow(.002, dt));
  // surface → exit
  if (p.y <= 34 && p.vy < -20 && !d.exiting) { exitDive(d.rescue); return; }
  // ── air
  if (S.gear.blessing) p.air = Infinity;
  else if (!d.rescue) {
    p.air -= dt;
    if (p.air <= 0) { d.rescue = true; AudioSys.sfx('splash'); burst(p.x, p.y, 'rgba(200,240,255,.9)', 24, { grav: -300 }); }
  }
  // sting cooldown
  p.sting = Math.max(0, p.sting - dt);
  // exhale bubbles
  if (Math.random() < dt * 3) d.bub.push({ x: p.x + p.face * 16, y: p.y - 46, r: rnd(2, 5), vy: rnd(-60, -30), wob: rnd(TAU), life: rnd(1.5, 3) });
  d.bub.forEach(b => { b.y += b.vy * dt; b.x += Math.sin(G.t * 3 + b.wob) * 18 * dt; b.life -= dt; });
  d.bub = d.bub.filter(b => b.life > 0 && b.y > 20);
  // ── fish
  if (Math.random() < dt * 3) spawnFish();
  d.fishes.forEach(f => {
    const F = f.def;
    f.flee = Math.max(0, f.flee - dt);
    const near = dist(p.x, p.y, f.x, f.y);
    if (near < 110 && f.flee <= 0 && Math.random() < dt * 2) {
      f.flee = 1.2; f.vx = Math.sign(f.x - p.x) * F.spd * 2.2; f.vy = rnd(-30, 30);
    }
    if (f.flee <= 0) {
      if (Math.random() < dt * .3) f.vx = (Math.random() < .5 ? -1 : 1) * F.spd * rnd(.6, 1.2);
      f.vy = Math.sin(G.t * 1.2 + f.ph) * 18;
    }
    f.x += f.vx * dt; f.y += f.vy * dt;
    const bandY = [[100, 790], [820, 1980], [2020, 3500]][F.band];
    f.y = clamp(f.y, bandY[0], bandY[1]);
    if (f.x < 30) { f.x = 30; f.vx = Math.abs(f.vx); }
    if (f.x > UW_W - 30) { f.x = UW_W - 30; f.vx = -Math.abs(f.vx); }
  });
  d.fishes = d.fishes.filter(f => Math.abs(f.x - p.x) < VW * 1.6 && Math.abs(f.y - p.y) < VH * 1.8);
  // whale
  const wh = d.whale;
  wh.x += wh.vx * dt; wh.ph += dt;
  if (wh.x > 4600) wh.vx = -Math.abs(wh.vx);
  if (wh.x < 1200) wh.vx = Math.abs(wh.vx);
  wh.y = 2450 + Math.sin(wh.ph * .3) * 180;
  if (!S.seen.whale && dist(p.x, p.y, wh.x, wh.y) < 420) {
    S.seen.whale = true; markSave();
    AudioSys.sfx('yay');
    toast('🐋 You met the Melody Whale! Added to your journal!');
    burst(wh.x, wh.y, 'rgba(155,232,255,.9)', 26, { grav: -20, star: true, size: 6 });
  }
  // jellies
  UW.jellies.forEach(j => {
    j.cd = Math.max(0, j.cd - dt);
    const jy = j.y + Math.sin(G.t * .7 + j.ph) * 60;
    const jx = j.x + Math.sin(G.t * .4 + j.ph * 2) * 40;
    if (p.sting <= 0 && j.cd <= 0 && dist(p.x, p.y, jx, jy) < j.sz + 26) {
      p.sting = 1.2; j.cd = 2;
      const loss = S.gear.wetsuit ? 4 : 8;
      if (!S.gear.blessing) p.air = Math.max(2, p.air - loss);
      p.vx = Math.sign(p.x - jx) * 300; p.vy = Math.sign(p.y - jy) * 220;
      AudioSys.sfx('sting');
      G.shakeT = .3; G.shakeAmp = 6;
    }
  });
  // plants give air
  UW.plants.forEach(pl => {
    pl.cd = Math.max(0, pl.cd - dt);
    if (pl.cd <= 0 && dist(p.x, p.y, pl.x, pl.y - 40) < 70 && p.air < airMax() - 5 && !S.gear.blessing) {
      pl.cd = 14;
      p.air = Math.min(airMax(), p.air + 30);
      AudioSys.sfx('bubble'); AudioSys.sfx('pickup');
      burst(pl.x, pl.y - 50, 'rgba(180,240,255,.9)', 14, { grav: -220 });
      toast('🫧 Air bubbles! +30');
    }
  });
  // sea glass magnetic pickup
  d.glass.forEach(gl => {
    if (gl.taken) return;
    if (dist(p.x, p.y, gl.x, gl.y) < 46) {
      gl.taken = true;
      const v = gl.kind === 'shell' ? 3 : 2;
      addShells(v);
      if (S.mq === 3) { S.flags.glass = (S.flags.glass || 0) + 1; markSave(); updateHUD(); }
      AudioSys.sfx('shellS');
      burst(gl.x, gl.y, gl.kind === 'shell' ? '#FFD9A0' : '#9BE8FF', 8, { grav: -60 });
    }
  });
  // audio depth
  AudioSys.setDepth(clamp(p.y / 2600, .12, 1));
  const wantT = p.y > 2000 ? 'deep' : 'sea';
  if (!G.cutscene && AudioSys.current() !== wantT && ['sea', 'deep'].includes(AudioSys.current() || 'sea')) AudioSys.play(wantT, 2.5);
  findInteractDive();
  // quest event triggers (proximity cutscenes)
  diveQuestTriggers();
}

/* interactions underwater */
function findInteractDive() {
  const p = G.p, cands = [];
  if (G.busy || G.dive.rescue) { G.nearTarget = null; return; }
  const D = (x, y) => dist(p.x, p.y, x, y);
  // pearls
  PEARL_SPOTS.forEach(ps => {
    if (S.pearls[ps.i]) return;
    if (ps.i === 0 && S.mq < 4) return;
    if (ps.i === 2 && S.mq < 9) return;
    if (ps.i === 4 && S.mq < 12) return;
    if (ps.i === 1) {
      if (D(ps.x, ps.y) < 95 && S.mq >= 7) {
        cands.push(S.gear.key ? { x: ps.x, y: ps.y, icon: '🗝️', label: 'Unlock chest!', act: () => collectPearl(1) }
          : { x: ps.x, y: ps.y, icon: '🔒', label: 'Locked tight…', act: () => toast('It needs a key… someone in the village might have one. 🔑') });
      }
      return;
    }
    if (D(ps.x, ps.y) < 95) cands.push({ x: ps.x, y: ps.y, icon: '✨', label: 'Take the pearl!', act: () => collectPearl(ps.i) });
  });
  // starfish
  STARFISH.forEach(sf => {
    if (sf.sc === 'dive' && !S.stickers.includes(sf.id) && D(sf.x, sf.y) < 75)
      cands.push({ x: sf.x, y: sf.y, icon: '⭐', label: 'Pick up', act: () => takePickup({ kind: 'starfish', id: sf.id, x: sf.x, y: sf.y }) });
  });
  // mermaids & inky
  if (S.flags.metCoral && D(NPCS.coral.x, NPCS.coral.y) < 90) cands.push({ x: NPCS.coral.x, y: NPCS.coral.y, icon: '💬', label: 'Coral', act: () => talkTo('coral') });
  if (S.mq >= 9 && S.flags.metMarina && D(NPCS.marina.x, NPCS.marina.y) < 90) cands.push({ x: NPCS.marina.x, y: NPCS.marina.y, icon: '💬', label: 'Marina', act: () => talkTo('marina') });
  if (S.flags.inkyFriend && D(NPCS.inky.x, NPCS.inky.y) < 90) cands.push({ x: NPCS.inky.x, y: NPCS.inky.y, icon: '💬', label: 'Maestro Inky', act: () => talkTo('inky') });
  if (S.mq >= 15 && D(NPCS.queen.x, NPCS.queen.y) < 110) cands.push({ x: NPCS.queen.x, y: NPCS.queen.y, icon: '💬', label: 'Queen Nerissa', act: () => talkTo('queen') });
  // fish catching
  const range = S.gear.net ? 120 : 78;
  let bestF = null, bd = 1e9;
  G.dive.fishes.forEach(f => {
    if (f.def.sight) return;
    const dd = D(f.x, f.y);
    if (dd < range && dd < bd) { bd = dd; bestF = f; }
  });
  if (bestF) cands.push({ x: bestF.x, y: bestF.y, icon: '🥍', label: `Catch ${bestF.def.n.split(' ').pop()}!`, act: () => catchFish(bestF) });
  cands.sort((a, b) => D(a.x, a.y) - D(b.x, b.y));
  G.nearTarget = cands[0] || null;
}
function catchFish(f) {
  const d = G.dive;
  d.fishes = d.fishes.filter(x => x !== f);
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
function collectPearl(i) {
  S.pearls[i] = true; markSave();
  AudioSys.sfx('pearl');
  const ps = PEARL_SPOTS.find(p2 => p2.i === i) || { x: G.p.x, y: G.p.y };
  burst(ps.x, ps.y - 20, 'rgba(255,230,250,.95)', 30, { grav: -50, star: true, size: 5 });
  G.flash = .5;
  onPearlGot(i);
}

/* ── dive drawing ────────────────────────────────────────── */
function coralSpr(v, hue) {
  return spr('coral' + v + '_' + hue, 140, 110, c => {
    c.lineCap = 'round';
    if (v === 0) { // branching
      c.strokeStyle = `hsl(${hue},70%,62%)`;
      const br = (x0, y0, a, len, w2, d2) => {
        if (d2 > 3 || len < 8) return;
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
        c.lineWidth = w2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        br(x1, y1, a - .5 - n1(x1) * .3, len * .7, w2 * .7, d2 + 1);
        br(x1, y1, a + .5 + n1(y1) * .3, len * .7, w2 * .7, d2 + 1);
      };
      br(0, 0, -Math.PI / 2, 38, 10, 0);
    } else if (v === 1) { // brain
      c.fillStyle = `hsl(${hue},60%,68%)`;
      c.beginPath(); c.arc(0, -6, 34, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = `hsl(${hue},55%,52%)`; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, -6, 28 - i * 7, Math.PI * 1.1, -.1 * Math.PI); c.stroke(); }
    } else if (v === 2) { // tube
      for (let i = 0; i < 5; i++) {
        c.fillStyle = `hsl(${hue + i * 8},65%,${58 + i * 4}%)`;
        const h = 30 + n1(i * 3.3) * 40;
        rr(c, -30 + i * 13, -h, 10, h, 5); c.fill();
      }
    } else if (v === 3) { // fan
      c.fillStyle = `hsla(${hue},70%,65%,.85)`;
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(-46, -40, -20, -66);
      c.quadraticCurveTo(0, -80, 20, -66);
      c.quadraticCurveTo(46, -40, 0, 0);
      c.fill();
      c.strokeStyle = `hsl(${hue},60%,50%)`; c.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(i * 16, -40, i * 12, -64); c.stroke(); }
    } else { // anemone
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
function palaceSpr() {
  return spr('palace', 640, 460, c => {
    const tower = (x, w2, h, hue) => {
      const g = c.createLinearGradient(x, -h, x, 0);
      g.addColorStop(0, `hsl(${hue},45%,72%)`); g.addColorStop(1, `hsl(${hue},40%,55%)`);
      c.fillStyle = g; c.strokeStyle = 'rgba(40,30,60,.5)'; c.lineWidth = 3;
      rr(c, x - w2 / 2, -h, w2, h, 12); c.fill(); c.stroke();
      // shell dome
      c.fillStyle = `hsl(${hue + 30},60%,78%)`;
      c.beginPath(); c.moveTo(x - w2 / 2 - 10, -h);
      c.quadraticCurveTo(x, -h - w2 * 1.1, x + w2 / 2 + 10, -h); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = `hsl(${hue + 30},50%,62%)`; c.lineWidth = 2.4;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x, -h - w2 * .78); c.quadraticCurveTo(x + i * w2 * .3, -h - w2 * .3, x + i * w2 * .36, -h); c.stroke(); }
      // windows
      for (let i = 0; i < Math.floor(h / 70); i++) {
        c.fillStyle = 'rgba(255,240,180,.95)';
        c.beginPath(); c.arc(x, -h + 45 + i * 70, 9, Math.PI, 0); c.lineTo(x + 9, -h + 55 + i * 70); c.lineTo(x - 9, -h + 55 + i * 70); c.closePath(); c.fill();
      }
    };
    tower(-200, 90, 220, 265); tower(200, 90, 240, 175); tower(-90, 70, 300, 320); tower(90, 70, 290, 205);
    tower(0, 120, 360, 280);
    // gate
    c.fillStyle = 'rgba(30,25,60,.85)';
    c.beginPath(); c.arc(0, 0, 52, Math.PI, 0); c.lineTo(52, 0); c.lineTo(-52, 0); c.closePath(); c.fill();
    c.strokeStyle = '#FFD24C'; c.lineWidth = 4; c.stroke();
    // pearls on spires
    [[-200, 320], [200, 340], [0, 480]].forEach(([sx, sy]) => {
      c.fillStyle = '#FFF0F8'; c.beginPath(); c.arc(sx, -sy, 10, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.stroke();
    });
  });
}
function drawDive() {
  const p = G.p, d = G.dive, camX = G.cam.x, camY = G.cam.y;
  if (!d) return;
  const depth01 = clamp(camY / (UW_D - VH), 0, 1);
  // water gradient by depth
  const cols = [
    ['#4FC3E8', '#2E86B0'], // sunlit
    ['#2E86B0', '#154C74'],
    ['#154C74', '#0A2A4A'], // twilight
    ['#0A2A4A', '#050E20'], // abyss
  ];
  const seg = depth01 * 2.6;
  const i0 = Math.min(2, Math.floor(seg)), tt = clamp(seg - i0, 0, 1);
  const top = hexLerp(cols[i0][0], cols[i0 + 1][0], tt);
  const bot = hexLerp(cols[i0][1], cols[i0 + 1][1], tt);
  const wg = ctx.createLinearGradient(0, 0, 0, VH);
  wg.addColorStop(0, top); wg.addColorStop(1, bot);
  ctx.fillStyle = wg; ctx.fillRect(0, 0, VW, VH);
  // surface line & waves
  if (camY < 130) {
    const sy = -camY;
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.moveTo(0, sy);
    for (let x = 0; x <= VW; x += 18) ctx.lineTo(x, sy + 6 + Math.sin(x * .03 + G.t * 2.4) * 5);
    ctx.lineTo(VW, sy - 40); ctx.lineTo(0, sy - 40); ctx.closePath(); ctx.fill();
  }
  // god rays (sunlit only)
  if (camY < 900) {
    const rayA = clamp(1 - camY / 900, 0, 1) * .16;
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
  // plankton
  ctx.fillStyle = 'rgba(220,245,255,.35)';
  for (let i = 0; i < 40; i++) {
    const px2 = (n1(i * 3.7) * UW_W - camX * .7) % VW, py2 = (n1(i * 9.3) * UW_D - camY * .7 + G.t * 6) % VH;
    ctx.globalAlpha = .15 + .2 * Math.sin(G.t + i);
    ctx.beginPath(); ctx.arc((px2 + VW) % VW, (py2 + VH) % VH, 1.6, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const V = (x, y) => x - camX > -200 && x - camX < VW + 200 && y - camY > -240 && y - camY < VH + 240;
  // seabed
  if (camY > UW_D - VH - 200) {
    ctx.fillStyle = '#1A2A48';
    ctx.beginPath(); ctx.moveTo(0, VH + 10);
    for (let x = 0; x <= VW + 20; x += 30) ctx.lineTo(x, UW_D - 60 - camY - n1((x + camX) * .01) * 40);
    ctx.lineTo(VW + 10, VH + 10); ctx.closePath(); ctx.fill();
  }
  // rocks
  ctx.fillStyle = 'rgba(40,60,95,.65)';
  UW.rocks.forEach(r => {
    if (!V(r.x, r.y)) return;
    ctx.beginPath();
    ctx.ellipse(r.x - camX, r.y - camY, r.s, r.s * .62, n1(r.x) * .6 - .3, 0, TAU); ctx.fill();
  });
  // trench walls hint
  ctx.fillStyle = 'rgba(20,30,55,.5)';
  if (camY > 1700) {
    [[4650, 1], [5750, -1]].forEach(([wx, sd]) => {
      if (Math.abs(wx - camX - VW / 2) < VW * 1.2) {
        ctx.beginPath();
        ctx.moveTo(wx - camX, 2000 - camY);
        for (let y = 2000; y <= UW_D; y += 120) ctx.lineTo(wx - camX + sd * (n1(y * .01) * 60), y - camY);
        ctx.lineTo(wx - camX - sd * 300, UW_D - camY); ctx.lineTo(wx - camX - sd * 300, 2000 - camY);
        ctx.closePath(); ctx.fill();
      }
    });
  }
  // palace
  if (V(3000, 3400)) {
    glow(ctx, 3000 - camX, 3320 - camY, 420, rgba(180, 160, 255), .2 + .06 * Math.sin(G.t * 1.5));
    blit(ctx, palaceSpr(), 3000 - camX, 3500 - camY, 1);
    d.glowPts.push([3000, 3200, 300, 'rgba(190,170,255,']);
  }
  // corals
  UW.corals.forEach(co => {
    if (!V(co.x, co.y)) return;
    blit(ctx, coralSpr(co.v, co.hue), co.x - camX, co.y - camY, co.s);
  });
  // crystals (abyss)
  UW.crystals.forEach(cr => {
    if (!V(cr.x, cr.y)) return;
    const a = .5 + .3 * Math.sin(G.t * 1.6 + cr.ph);
    glow(ctx, cr.x - camX, cr.y - camY, cr.s * 3, rgba(155, 200, 255), .2 * a);
    ctx.save(); ctx.translate(cr.x - camX, cr.y - camY); ctx.rotate(cr.ph);
    ctx.fillStyle = `rgba(140,190,255,${.5 + .2 * a})`;
    ctx.beginPath(); ctx.moveTo(0, -cr.s); ctx.lineTo(cr.s * .5, 0); ctx.lineTo(0, cr.s); ctx.lineTo(-cr.s * .5, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
    d.glowPts.push([cr.x, cr.y, cr.s * 3, 'rgba(140,190,255,']);
  });
  // air plants
  UW.plants.forEach(pl => {
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
  // sea glass
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
  drawDiveQuestItems(camX, camY, V);
  // jellies
  UW.jellies.forEach(j => {
    const jx = j.x + Math.sin(G.t * .4 + j.ph * 2) * 40, jy = j.y + Math.sin(G.t * .7 + j.ph) * 60;
    if (!V(jx, jy)) return;
    ctx.save(); ctx.translate(jx - camX, jy - camY);
    drawJelly(ctx, G.t + j.ph, j.sz, j.hue);
    ctx.restore();
    d.glowPts.push([jx, jy, j.sz * 2.6, 'rgba(255,170,225,']);
  });
  // fish
  d.fishes.forEach(f => {
    if (!V(f.x, f.y)) return;
    ctx.save(); ctx.translate(f.x - camX, f.y - camY);
    ctx.scale(f.vx < 0 ? -1 : 1, 1);
    drawFishSprite(ctx, f.def, G.t, { ph: f.ph });
    ctx.restore();
    if (f.def.band === 2 || f.def.id === 'lantern' || f.def.id === 'squid') d.glowPts.push([f.x, f.y, f.def.sz * 2.6, 'rgba(155,232,255,']);
  });
  // whale
  const wh = d.whale;
  if (V(wh.x, wh.y)) {
    ctx.save(); ctx.translate(wh.x - camX, wh.y - camY); ctx.scale(wh.vx < 0 ? -1 : 1, 1);
    drawFishSprite(ctx, fishById('whale'), G.t, {});
    ctx.restore();
    d.glowPts.push([wh.x, wh.y, 300, 'rgba(140,190,240,']);
    // song notes
    if (Math.sin(G.t * .8) > .6) {
      const nx = wh.x - camX + (wh.vx < 0 ? -1 : 1) * 190, ny = wh.y - camY - 30 - (G.t % 1) * 40;
      ctx.fillStyle = `rgba(190,230,255,${1 - (G.t % 1)})`;
      ctx.font = '20px sans-serif'; ctx.fillText('♪', nx, ny);
    }
  }
  drawDiveNPCs(camX, camY, V);
  // player
  ctx.save();
  ctx.translate(p.x - camX, p.y - camY);
  const ang = clamp(p.vy / 400, -.5, .5) * (p.face);
  ctx.rotate(ang);
  ctx.scale(p.face, 1);
  ctx.translate(0, 42);
  if (p.sting > .6) ctx.globalAlpha = .55 + .4 * Math.sin(G.t * 30);
  drawLila(ctx, G.t, { swim: true });
  ctx.restore();
  // exhale bubbles
  d.bub.forEach(b => {
    ctx.strokeStyle = `rgba(220,245,255,${clamp(b.life, 0, 1) * .8})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, b.r, 0, TAU); ctx.stroke();
  });
  // darkness overlay + lantern
  const dark = clamp((p.y - 750) / 700, 0, 1) * .93;
  if (dark > .02) {
    const lr = S.gear.lantern ? 320 : 120;
    const px = p.x - camX, py = p.y - camY;
    const dg = ctx.createRadialGradient(px, py, lr * .35, px, py, lr * 1.6);
    dg.addColorStop(0, 'rgba(4,8,26,0)');
    dg.addColorStop(1, `rgba(4,8,26,${dark})`);
    ctx.fillStyle = dg; ctx.fillRect(0, 0, VW, VH);
    // re-glow bright things through the dark
    d.glowPts.forEach(([gx, gy, gr, col]) => {
      if (!V(gx, gy)) return;
      glow(ctx, gx - camX, gy - camY, gr * 1.5, col + 'AL)', .3 * dark);
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
  const draw = (id, extra = {}) => {
    const n = NPCS[id];
    if (!V(n.x, n.y)) return;
    const face = G.p.x > n.x ? 1 : -1;
    ctx.save(); ctx.translate(n.x - camX, n.y - camY);
    glow(ctx, 0, -30, 90, rgba(255, 220, 250), .14);
    PAINT[id](ctx, G.t, { face, talk: G.dialog && G.dialog.who === id, ...extra });
    ctx.restore();
    G.dive.glowPts.push([n.x, n.y - 30, 110, 'rgba(255,210,250,']);
  };
  if (S.flags.metCoral) draw('coral');
  if (S.mq >= 9) draw('marina');
  if (S.mq >= 13 || S.flags.queenMet) draw('queen');
  if (S.mq >= 10) draw('inky', { grumpy: !S.flags.inkyFriend, baton: S.flags.inkyFriend });
}
function drawDiveQuestItems(camX, camY, V) {
  const d = G.dive;
  // pearls
  PEARL_SPOTS.forEach(ps => {
    if (S.pearls[ps.i]) return;
    if (!V(ps.x, ps.y)) return;
    const sx = ps.x - camX, sy = ps.y - camY;
    if (ps.i === 0) { // giant clam
      const open = dist(G.p.x, G.p.y, ps.x, ps.y) < 200 && S.mq >= 4;
      ctx.save(); ctx.translate(sx, sy);
      ctx.fillStyle = '#C77DAA'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(0, 8, 34, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(0, 8); ctx.rotate(open ? -.65 : -.06);
      ctx.fillStyle = '#E59FC8';
      ctx.beginPath(); ctx.arc(0, 0, 34, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 12, -30); ctx.stroke(); }
      ctx.restore();
      if (open && S.mq >= 4) drawPearl(ctx, 0, 0, 12, G.t);
      ctx.restore();
      if (S.mq >= 4) d.glowPts.push([ps.x, ps.y, 60, 'rgba(255,230,250,']);
    } else if (ps.i === 1) { // chest
      ctx.save(); ctx.translate(sx, sy);
      ctx.fillStyle = '#8C5A33'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      rr(ctx, -30, -20, 60, 34, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#A6743F';
      ctx.beginPath(); ctx.moveTo(-32, -18); ctx.quadraticCurveTo(0, -44, 32, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFD24C'; rr(ctx, -6, -22, 12, 16, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5B4636'; ctx.beginPath(); ctx.arc(0, -15, 2.6, 0, TAU); ctx.fill();
      ctx.restore();
      if (S.mq >= 7) d.glowPts.push([ps.x, ps.y, 50, 'rgba(255,215,120,']);
    } else {
      const gate = (ps.i === 2 && S.mq < 9) || (ps.i === 4 && S.mq < 12);
      if (!gate) {
        drawPearl(ctx, sx, sy + Math.sin(G.t * 2) * 5, 11, G.t);
        d.glowPts.push([ps.x, ps.y, 70, 'rgba(255,230,250,']);
      }
    }
  });
  // underwater starfish
  STARFISH.forEach(sf => {
    if (sf.sc !== 'dive' || S.stickers.includes(sf.id) || !V(sf.x, sf.y)) return;
    const sx = sf.x - camX, sy = sf.y - camY;
    glow(ctx, sx, sy, 26, rgba(255, 180, 220), .4 + .2 * Math.sin(G.t * 3));
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(G.t * 1.5 + sf.x) * .2);
    starPath(ctx, 0, 0, 11, 5.2);
    ctx.fillStyle = '#FF8FB1'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    dotEye(ctx, -3, -1, 1.4); dotEye(ctx, 3, -1, 1.4); smile(ctx, 0, 2, 2);
    ctx.restore();
    d.glowPts.push([sf.x, sf.y, 30, 'rgba(255,180,220,']);
  });
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
   STORY LOGIC — quests, dialogue, progression
   ============================================================ */
function advanceQuest(n, silent) {
  S.mq = n; markSave(); updateHUD();
  if (!silent && n <= 14) {
    AudioSys.sfx('quest');
    toast(`📜 New quest: ${MQ[n].t}`);
  }
}
function questHint() {
  if (S.mq >= 15) return POSTGAME_HINTS[0];
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
    case 'sammy': return talkSammy();
    case 'pigeon': return talkPigeon(q);
    case 'coral': return talkCoral(q);
    case 'marina': return talkMarina(q);
    case 'inky': return talkInky();
    case 'queen': return talkQueen();
  }
}
function talkMelody(q) {
  if (q === 1) {
    dsay([
      { who: 'melody', text: 'Oh!! You came, you really came! You must be Lila — Pearl flew all the way to Brooklyn with my letter! 💌' },
      { who: 'lila', text: 'My Melody! The letter said the island\'s music is… gone?' },
      { who: 'melody', text: 'Mm-hm. Shimmer Isle always hummed with the Great Song. But a terrible storm scattered the six Song Pearls into the sea… and everything went quiet.' },
      { who: 'melody', text: 'Even my oven won\'t sing anymore. And a café with no song bakes very sad cakes. 🥲' },
      { who: 'lila', text: 'Then I\'ll find the pearls! I\'m an explorer — it\'s kind of my thing.' },
      { who: 'melody', text: 'I hoped you\'d say that! First you\'ll need swim gear. Pochacco runs the dive shop in the village — but he\'s in a tizzy about his lost beach ball. Maybe help him first?' },
    ], () => { heart('melody'); advanceQuest(2); });
    return;
  }
  if (q === 5) {
    if (invCount('mango') >= 2 && invCount('banana') >= 1) {
      dsay([
        { who: 'melody', text: 'Mangoes and a banana — perfect! Come into the kitchen, I\'ll teach you my Sunrise Tart! 🥧' },
      ], () => openPanel('cafe'));
    } else {
      dsay([
        { who: 'melody', text: 'A pearl already?! You\'re amazing! Let\'s celebrate by reopening the café. I need 2 mangoes and 1 banana — shake the trees in the jungle, east of the village! 🌴' },
      ]);
    }
    return;
  }
  if (q === 6 && !invCount('dish_pudding')) {
    dsay([
      { who: 'melody', text: 'Pompompurin has napped straight through the whole quiet time — but he has the old key to the sunken chest!' },
      { who: 'melody', text: 'Only one thing wakes that sleepy head: the smell of fresh pudding. 3 coconuts and 1 mango — to the kitchen! 🍮' },
    ], () => openPanel('cafe'));
    return;
  }
  if (q === 11) {
    if (invCount('plank') >= 4) {
      dsay([
        { who: 'melody', text: 'You found all the driftwood! Now I can fix the café porch. You\'re the kindest storm-fixer I know. 💗' },
        { who: 'lila', text: 'Everyone helps everyone — that\'s what islands are for!' },
      ], () => {
        invTake('plank', 4); addShells(20); heart('melody');
        AudioSys.sfx('quest');
        toast('🐚 +20 shells! 💗 My Melody friendship up!');
        advanceQuest(12);
      });
    } else {
      dsay([{ who: 'melody', text: 'The storm tossed driftwood all over the beach. If you gather 4 planks, I can fix the porch! 🪵' }]);
    }
    return;
  }
  // default chat + menu
  const chats = [
    'The secret ingredient is always a little song. ♪',
    `You've found ${pearlCount()} of 6 pearls… I can almost hear the island humming again!`,
    'Coral the mermaid loves sea glass. And I love that you\'re friends with a mermaid!!',
    'Pompompurin ate nine puddings yesterday. NINE.',
  ];
  const opts = [{ label: '💬 Chat', cb: () => dsay([{ who: 'melody', text: pick(chats) }]) }];
  if (S.flags.cafeOpen) opts.push({ label: '🍳 Kitchen', alt: true, cb: () => openPanel('cafe') });
  opts.push({ label: '🐟 Sell fish', alt: true, cb: () => openPanel('sell') });
  dchoice('melody', 'Hello hello, Lila! What shall we do? ☕', opts);
}
function talkPochacco(q) {
  if (q === 2) {
    if (S.flags.gotBall) {
      dsay([
        { who: 'pochacco', text: 'MY BALL! You found it! You\'re officially my hero. Heroes get dive gear!! 🤿' },
        { who: 'pochacco', text: 'Here — my old snorkel set. The Reef Buoy off Sunrise Beach is the best spot to practice diving.' },
        { who: 'lila', text: 'A real dive! Okay, ocean… ready or not!' },
        { who: 'pochacco', text: 'Underwater tips: swim to sparkly things, and if your AIR bar gets low, swim up or find bubble kelp! Collect 5 pieces of sea glass to practice.' },
      ], () => {
        S.gear.snorkel = true; S.flags.gotBall = false; markSave();
        heart('pochacco'); AudioSys.sfx('quest');
        toast('🤿 Got the Snorkel! Dive at the Reef Buoy!');
        advanceQuest(3);
      });
    } else {
      dsay([
        { who: 'pochacco', text: 'New friend alert!! I\'m Pochacco! I\'d shake your hand but I\'m having a CRISIS — my lucky beach ball rolled off toward the old dock!' },
        { who: 'lila', text: 'The dock by the boat? On it!' },
      ]);
    }
    return;
  }
  if (q === 7 && !S.gear.tank1) {
    dchoice('pochacco', 'A sunken chest under the Pier Buoy? That\'s DEEP. You\'ll need a Bubble Tank — good thing I sell them! 😁', [
      { label: '🛒 Shop', cb: () => openPanel('shop') },
      { label: 'Later', alt: true, cb: () => {} },
    ]);
    return;
  }
  const chats = [
    'I tried to teach a seagull to play ball. It ate the whistle.',
    'Zoomy Flippers make you zoom. It\'s in the name. It\'s the law.',
    'You\'ve got great swim form! Ten out of ten. Maybe eleven.',
  ];
  dchoice('pochacco', 'Hey hey, Lila! Shop\'s open, ocean\'s open, I\'m open! 🏄', [
    { label: '🛒 Shop', cb: () => openPanel('shop') },
    { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'pochacco', text: pick(chats) }]) },
  ]);
}
function talkPurin(q) {
  if (!S.flags.purinAwake) {
    if (q === 6 && invCount('dish_pudding') > 0) {
      dsay([
        { who: 'purin', text: 'Zzz… zzz… …sniff… …sniff sniff… PUDDING?!' },
        { who: 'lila', text: 'Fresh from My Melody\'s kitchen! Careful, it\'s wobbly.' },
        { who: 'purin', text: '*chomp* …mmmMMMM! I dreamed the island stopped singing. Silly dream— wait. WHY IS IT SO QUIET?!' },
        { who: 'lila', text: 'A storm scattered the Song Pearls. I\'m collecting them! But there\'s a sunken chest that needs a key…' },
        { who: 'purin', text: 'A key! I sleep on one — it kept poking me. Take it! Anyone who brings pudding this good deserves ALL my keys.' },
      ], () => {
        invTake('dish_pudding', 1);
        S.flags.purinAwake = true; S.gear.key = true;
        if (!S.recipes.includes('reefroll')) S.recipes.push('reefroll');
        markSave(); heart('purin'); AudioSys.sfx('quest');
        toast('🗝️ Got the Old Key! (and a new recipe: Reef Roll 🍣)');
        advanceQuest(7);
      });
    } else {
      dsay([{ who: 'purin', text: 'Zzzzz… zzz… mmm… puddiiiing… zzz… 💤' }]);
    }
    return;
  }
  const chats = [
    'Napping in the hammock skips time! I invented that. You\'re welcome.',
    'Pudding rating today: the sea glass is pretty but NOT tasty. One star.',
    'When the Great Song comes back, I\'m going to dance. Slowly. After a nap.',
  ];
  if (invCount('dish_pudding') > 0) {
    dchoice('purin', 'Is that… pudding I smell? 👀', [
      { label: '🍮 Give pudding', cb: () => { invTake('dish_pudding', 1); heart('purin'); AudioSys.sfx('heartS'); toast('💗 Pompompurin loves you! (+friendship)'); addShells(10); } },
      { label: '💬 Chat', alt: true, cb: () => dsay([{ who: 'purin', text: pick(chats) }]) },
    ]);
  } else dsay([{ who: 'purin', text: pick(chats) }]);
}
function talkKitty(q) {
  if (q === 8 && !S.flags.kittyMet) {
    dsay([
      { who: 'kitty', text: 'Hello! I\'m Hello Kitty — lighthouse keeper of Shimmer Isle. You\'re the pearl-finder everyone\'s talking about!' },
      { who: 'lila', text: 'That\'s me! But the sea past the reef is so dark, I can\'t see a thing down there.' },
      { who: 'kitty', text: 'You need my Sea Lantern! But the storm blew out its heart-flame. It only relights with living light… firefly light!' },
      { who: 'kitty', text: 'Fireflies dance in the jungle at night. Catch 5! (Psst: nap in the village hammock to skip to nighttime.)' },
    ], () => { S.flags.kittyMet = true; S.flags.fireflies = 0; markSave(); heart('kitty'); updateHUD(); });
    return;
  }
  if (q === 8 && (S.flags.fireflies || 0) >= 5) {
    dsay([
      { who: 'kitty', text: 'Five fireflies! Oh, they tickle! In you go, little lights… ✨' },
      { who: 'kitty', text: 'Look — the Sea Lantern is glowing again! Take it, Lila. It will hold back the deepest dark.' },
      { who: 'lila', text: 'It\'s so warm! Like holding a tiny sunrise.' },
      { who: 'kitty', text: 'The fireflies will fly home by morning, don\'t worry. Now — Marina waits in the twilight. Be brave, little diver!' },
    ], () => {
      S.gear.lantern = true; S.flags.fireflies = 0; markSave();
      if (!S.recipes.includes('glowsoup')) S.recipes.push('glowsoup');
      heart('kitty'); AudioSys.sfx('quest');
      toast('🏮 Got the Sea Lantern! (+ new recipe: Glow Soup 🍲)');
      advanceQuest(9);
    });
    return;
  }
  if (q === 14) {
    dsay([
      { who: 'kitty', text: 'Lila!! Six pearls! The whole island is holding its breath!' },
      { who: 'lila', text: 'Is everything ready?' },
      { who: 'kitty', text: 'Lanterns hung, friends gathered, and the sunset is PERFECT. Shall we begin the Festival of Song?' },
    ], () => runFinale());
    return;
  }
  const chats = [
    'From up here you can see all four corners of the island. My favorite corner is wherever friends are.',
    'The lighthouse says hello too! In light, of course.',
    'Queen Nerissa once sang with this lighthouse, long ago. True story!',
  ];
  dsay([{ who: 'kitty', text: pick(chats) }]);
}
function talkSammy() {
  const have = ['ac1', 'ac2', 'ac3'].filter(a => S.flags[a]).length;
  if (!S.flags.sammyAsked) {
    dsay([
      { who: 'sammy', text: 'Psst! Lila! It\'s me, Sammy — from Prospect Park! I stowed away on your boat. For adventure! And snacks!' },
      { who: 'lila', text: 'SAMMY! You little stowaway!' },
      { who: 'sammy', text: 'I brought 3 golden acorns from home… and immediately lost all of them. They sparkle! Find them and I\'ll pay you in shells. Squirrel promise!' },
    ], () => { S.flags.sammyAsked = true; markSave(); });
  } else if (have >= 3 && !S.flags.sammyDone) {
    dsay([
      { who: 'sammy', text: 'ALL THREE?! You\'re better at finding nuts than me. Don\'t tell the other squirrels. Here — shiny shells, as promised!' },
    ], () => { S.flags.sammyDone = true; markSave(); addShells(25); AudioSys.sfx('quest'); toast('🐚 +25 shells! Sammy is thrilled!'); });
  } else if (!S.flags.sammyDone) {
    dsay([{ who: 'sammy', text: `Golden acorns found: ${have}/3! They glitter — look for sparkles around the jungle and the cliff!` }]);
  } else {
    dsay([{ who: 'sammy', text: pick(['This island has zero oak trees. ZERO. Still love it though.', 'I\'m teaching the crabs to bury nuts. It\'s going… sideways.']) }]);
  }
}
function talkPigeon(q) {
  if (q <= 1) {
    dsay([
      { who: 'pigeon', text: 'Coo! Special delivery complete: one Lila, delivered to Shimmer Isle! My Melody is waiting at the café, up the beach. Coo coo!' },
    ]);
  } else {
    dsay([{ who: 'pigeon', text: pick(['Coo! I told everyone back in Prospect Park. The squirrels are SO jealous.', 'A pigeon never forgets a friend. Or a sandwich. Coo!']) }]);
  }
}
function talkCoral(q) {
  if (q === 4) { dsay([{ who: 'coral', text: 'The first pearl sleeps in the giant clam, just past my rock! Follow your compass sparkle! ✨' }]); return; }
  const seen = FISH.filter(f => S.seen[f.id]).length;
  dsay([{ who: 'coral', text: pick([
    `Your journal knows ${seen} sea creatures! The sea has ${FISH.length} waiting to meet you.`,
    'Sea glass is the ocean returning our treasures, polished and kind.',
    `${pearlCount()} pearls found! I can feel the Great Song stirring…`,
  ]) }]);
}
function talkMarina(q) {
  dsay([{ who: 'marina', text: pick([
    'The twilight is not scary — it is just the sea, dreaming.',
    'Maestro Inky conducts the fish now, you know. They adore him.',
    'The trench below is cold and deep. Big tank. Fast fins. Brave heart.',
  ]) }]);
}
function talkInky() {
  dsay([{ who: 'inky', text: pick([
    'Ah, my duet partner! The anglerfish choir is coming along SWIMMINGLY.',
    'I was never grumpy. I was… dramatically waiting for a friend.',
    'Eight arms means I can conduct four songs at once!',
  ]) }]);
}
function talkQueen() {
  dsay([{ who: 'queen', text: pick([
    'The Great Song is louder than it has been in a hundred years. Because of you, little diver.',
    'Come visit the palace anytime. The door is always open — it has no door!',
  ]) }]);
}

/* ── pickups / actions ───────────────────────────────────── */
function shakeTree(tr) {
  if (tr.have <= 0) return;
  tr.have--; tr.shake = 1;
  AudioSys.sfx('tap');
  const gy = gyAt(tr.x);
  fallingFruit.push({
    kind: FRUIT_OF[tr.kind], x: tr.x + rnd(-30, 30), y: gy - 180,
    vx: rnd(-30, 30), vy: 0, bounces: 0, life: 3, taken: false,
  });
}
function takePickup(pk) {
  if (pk.kind === 'ball') {
    S.flags.gotBall = true; markSave();
    AudioSys.sfx('pickup'); toast('🏐 Got the beach ball! Back to Pochacco!'); updateHUD();
  } else if (pk.kind === 'plank') {
    S.flags['plank' + pk.i] = true; invAdd('plank');
    AudioSys.sfx('pickup'); toast(`🪵 Driftwood! (${invCount('plank')}/4)`); updateHUD();
  } else if (pk.kind === 'starfish') {
    S.stickers.push(pk.id); markSave();
    AudioSys.sfx('ding');
    burst(pk.x, (pk.y || gyAt(pk.x) - 10), '#FF8FB1', 14, { star: true, grav: -30 });
    const n = S.stickers.length;
    toast(`⭐ Starfish sticker! (${n}/10)`);
    if (n >= 10 && !S.flags.rainbow) {
      S.flags.rainbow = true; S.outfit = 'rainbow'; markSave();
      AudioSys.sfx('yay');
      setTimeout(() => toast('🌈 ALL STARFISH FOUND! You earned the Rainbow Dress!'), 1200);
    }
  } else if (pk.kind === 'acorn') {
    S.flags[pk.id] = true; markSave();
    AudioSys.sfx('pickup');
    const have = ['ac1', 'ac2', 'ac3'].filter(a => S.flags[a]).length;
    toast(`🌰 Golden acorn! (${have}/3) — Sammy will be so happy!`);
  }
}
function catchFirefly(ff) {
  G.fireflies = G.fireflies.filter(f => f !== ff);
  S.flags.fireflies = (S.flags.fireflies || 0) + 1; markSave();
  AudioSys.sfx('pickup');
  burst(ff.x, ff.y, 'rgba(230,255,150,.95)', 12, { grav: -40 });
  updateHUD();
  if (S.flags.fireflies >= 5) {
    AudioSys.sfx('quest');
    toast('✨ Five fireflies! Bring them to Hello Kitty at the lighthouse!');
  } else toast(`✨ Firefly caught! (${S.flags.fireflies}/5)`);
}
function napHammock() {
  AudioSys.sfx('tap');
  fadeTransition(() => {
    G.tod = isNight() ? .34 : .92;
    S.tod = G.tod; markSave();
    toast(isNight() ? '🌙 You napped until nightfall…' : '🌞 Good morning, Shimmer Isle!');
  });
}
function buyGear(item) {
  if (S.gear[item.id]) return;
  if (item.needs && !S.gear[item.needs]) { toast('You need the Bubble Tank first!'); return; }
  if (S.shells < item.cost) { AudioSys.sfx('bad'); toast('Not enough shells yet! Catch fish & find sea glass 🐚'); return; }
  S.shells -= item.cost;
  S.gear[item.id] = true; markSave();
  AudioSys.sfx('quest');
  toast(`${item.em} Got the ${item.n}!`);
  updateHUD();
  renderPanel();
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
function checkFishMilestones() {
  const seen = FISH.filter(f => S.seen[f.id]).length;
  [[6, 'fm6', 15], [12, 'fm12', 25], [17, 'fm17', 50]].forEach(([n, flag, pay]) => {
    if (seen >= n && !S.flags[flag]) {
      S.flags[flag] = true; markSave();
      addShells(pay);
      setTimeout(() => { AudioSys.sfx('yay'); toast(`📖 Fish journal: ${n} creatures! Coral sends you ${pay} shells! 🐚`); }, 1500);
    }
  });
}

/* ── pearl & surfacing story beats ───────────────────────── */
function onPearlGot(i) {
  updateHUD();
  if (i === 0) {
    dsay([
      { who: 'coral', text: 'You found it!! Pearl number one! Listen — can you hear it humming? ♪' },
      { who: 'lila', text: 'It\'s warm! And it\'s… singing?!' },
      { who: 'coral', text: 'Every pearl holds one note of the Great Song. Five more to find! Take these shells — spend them at Pochacco\'s shop!' },
    ], () => {
      addShells(15);
      chapterCardShow(2, 'The Beach Café', () => advanceQuest(5, true) || (S.flags.cafeOpen = true, markSave(), toast(`📜 ${MQ[5].t}: ${questHint()}`)));
    });
  } else if (i === 1) {
    dsay([
      { who: 'lila', text: 'The key fits! …Pearl number two! And look at all these shells!' },
    ], () => {
      addShells(20);
      chapterCardShow(3, 'Light for the Deep', () => advanceQuest(8, true) || toast(`📜 ${MQ[8].t}: ${questHint()}`));
    });
  } else if (i === 2) {
    dsay([
      { who: 'marina', text: 'Pearl three sings again! But… do you hear that grumbling? That\'s Maestro Inky. He took a pearl to his den — he thinks it will teach him the Great Song.' },
      { who: 'lila', text: 'Maybe he just needs someone to sing WITH him!' },
      { who: 'marina', text: 'Oh… no mermaid ever thought of that. Go carefully, brave one — his den is east, deep in the twilight.' },
    ], () => advanceQuest(10));
  } else if (i === 4) {
    dsay([
      { who: 'marina', text: 'Pearl five, from the coldest trench! You dive like one of us now.' },
      { who: 'lila', text: 'One pearl left! Where do we look?' },
      { who: 'marina', text: 'The last pearl was never lost, Lila. It belongs to Queen Nerissa herself. Descend to the palace at the very bottom of the sea. She is waiting.' },
    ], () => {
      chapterCardShow(5, 'The Queen of the Deep', () => advanceQuest(13, true) || toast(`📜 ${MQ[13].t}: ${questHint()}`));
    });
  }
}
function onSurfaced() {
  if (S.mq === 3 && (S.flags.glass || 0) >= 5 && !S.flags.metCoral) {
    setTimeout(() => coralRevealScene(), 500);
  } else if (S.flags.stormPending) {
    S.flags.stormPending = false; markSave();
    setTimeout(() => stormScene(), 500);
  }
}
/* proximity story triggers while diving */
function diveQuestTriggers() {
  if (G.busy || !G.dive || G.dive.rescue) return;
  const p = G.p;
  if (S.mq === 9 && !S.flags.metMarina && dist(p.x, p.y, NPCS.marina.x, NPCS.marina.y) < 260) {
    S.flags.metMarina = true; markSave();
    dsay([
      { who: 'marina', text: 'A land-child, glowing in the twilight… so Coral\'s stories are true. I am Marina, keeper of the middle waters.' },
      { who: 'lila', text: 'I\'m Lila! I\'m collecting the Song Pearls to bring back the Great Song!' },
      { who: 'marina', text: 'Then take this light-path: pearl three rests in the grotto, west of here. Your lantern makes the dark gentle. Swim on, brave one.' },
    ], () => heart('marina'));
  }
  if (S.mq === 10 && !S.flags.inkyFriend && !S.flags.inkyBattle && dist(p.x, p.y, NPCS.inky.x, NPCS.inky.y) < 220) {
    S.flags.inkyBattle = true;
    dsay([
      { who: 'inky', text: 'HALT! Who dares approach the den of MAESTRO INKY?! …Oh. A small human with excellent goggles.' },
      { who: 'lila', text: 'You have one of the Song Pearls! The island needs it back — everything\'s gone quiet!' },
      { who: 'inky', text: 'I know it\'s quiet! I took the pearl to learn the Great Song myself. But it won\'t sing for me! NOTHING sings for me!! I have eight arms and NO band!' },
      { who: 'lila', text: 'Then… let\'s sing together! I\'ll copy any tune you play. If we make music, will you give the pearl back?' },
      { who: 'inky', text: 'A DUET?! …Very well. But I warn you: I am EXTREMELY musical. Echo my song, if you can!' },
    ], () => startRhythm({
      rounds: [3, 4, 5], who: 'inky',
      onWin: () => {
        S.flags.inkyFriend = true; S.pearls[3] = true; S.flags.stormPending = true; markSave();
        heart('inky'); AudioSys.sfx('pearl');
        burst(NPCS.inky.x, NPCS.inky.y - 40, 'rgba(255,230,250,.95)', 26, { star: true, grav: -40 });
        updateHUD();
        dsay([
          { who: 'inky', text: 'We… we made MUSIC! Real music! My hearts! All three of them!!' },
          { who: 'lila', text: 'You were amazing, Maestro! The pearl was never the song — singing together is.' },
          { who: 'inky', text: 'Take it, take the pearl! I don\'t need it — I have a DUET PARTNER now. Hmm… the water feels strange. You should surface, little friend. Swiftly!' },
        ], () => toast('✨ Pearl 4 recovered! (4/6) — better head up…'));
      },
      onLose: () => {
        dsay([
          { who: 'inky', text: 'Hah! Too tricky for you? …Don\'t make that face. We octopi are softies. Try again!' },
        ]);
      },
    }));
  }
  if (S.mq === 13 && !S.flags.queenMet && dist(p.x, p.y, 3000, 3300) < 300) {
    S.flags.queenMet = true; markSave();
    queenScene();
  }
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
  $('shellPill').textContent = `🐚 ${S.shells}   💗 ${pearlCount()}/6`;
  $('questPill').textContent = '⭐ ' + questHint();
}
/* ── panels ──────────────────────────────────────────────── */
const PANEL_TABS = {
  journal: [['quests', '📜 Quests'], ['fish', '🐟 Sea Life'], ['friends', '💗 Friends'], ['stickers', '⭐ Stickers']],
  shop: [], cafe: [], sell: [], settings: [],
};
function openPanel(name, tab) {
  AudioSys.sfx('tap');
  G.panel = name;
  G.ptab = tab || (PANEL_TABS[name][0] ? PANEL_TABS[name][0][0] : name);
  refreshBusy();
  $('panelWrap').style.display = 'flex';
  renderPanel();
}
function closePanel() {
  G.panel = null; refreshBusy();
  $('panelWrap').style.display = 'none';
}
$('panelClose').onclick = () => { AudioSys.sfx('tap'); closePanel(); };
$('panelWrap').addEventListener('click', e => { if (e.target === $('panelWrap')) closePanel(); });
$('btnJournal').onclick = () => { if (!G.cutscene && !G.rhythm && !G.cook) openPanel('journal'); };
$('btnSettings').onclick = () => { if (!G.cutscene && !G.rhythm && !G.cook) openPanel('settings'); };

function renderPanel() {
  const name = G.panel;
  if (!name) return;
  const titles = { journal: '📖 Lila\'s Journal', shop: '🤿 Pochacco\'s Dive Shop', cafe: '🍳 Beach Café Kitchen', sell: '🐟 Sell Fish', settings: '⚙️ Settings' };
  $('panelTitle').textContent = titles[name];
  // tabs
  const tabs = PANEL_TABS[name];
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
}
function renderJournal(body) {
  if (G.ptab === 'quests') {
    let html = '';
    if (S.mq >= 15) html += `<div class="card"><h4>🎆 The Great Song is restored!</h4><p>${POSTGAME_HINTS[0]}</p></div>`;
    else html += `<div class="card"><h4>⭐ ${MQ[S.mq].t}</h4><p>${questHint()}</p></div>`;
    for (let i = Math.min(S.mq, 14) - 1; i >= 1; i--) {
      html += `<div class="card" style="opacity:.55"><h4>✅ ${MQ[i].t}</h4></div>`;
    }
    // pearls row
    let pr = '<div class="card"><h4>Song Pearls</h4><p style="font-size:24px;letter-spacing:6px">';
    for (let i = 0; i < 6; i++) pr += S.pearls[i] ? '🩷' : '⚪';
    pr += '</p></div>';
    body.innerHTML = pr + html;
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
    [['melody', 'Baker of songs and tarts'], ['pochacco', 'Dive shop hero'], ['purin', 'Professional napper'], ['kitty', 'Keeper of the light'],
     ['coral', 'Mermaid of the reef'], ['marina', 'Mermaid of the twilight'], ['inky', 'Maestro of the deep']].forEach(([id, sub]) => {
      const h = S.hearts[id] || 0;
      html += `<div class="card"><h4>${NPCS[id].n}</h4><p>${sub}</p>
        <p style="font-size:19px;margin-top:4px">${'💗'.repeat(h)}${'🤍'.repeat(Math.max(0, 5 - h))}</p></div>`;
    });
    body.innerHTML = html;
  } else if (G.ptab === 'stickers') {
    let html = `<p style="font-weight:800;margin:0 0 10px">Starfish stickers: ${S.stickers.length} / 10 ${S.flags.rainbow ? '— 🌈 Rainbow Dress earned!' : ''}</p><div class="grid">`;
    STARFISH.forEach(sf => {
      const got = S.stickers.includes(sf.id);
      html += `<div class="gcell${got ? '' : ' locked'}"><div class="gi" style="font-size:34px">${got ? '⭐' : '❔'}</div>
        <div class="gn">${got ? 'Found!' : (sf.sc === 'island' ? 'On the island…' : 'Under the sea…')}</div></div>`;
    });
    html += '</div>';
    const have = ['ac1', 'ac2', 'ac3'].filter(a => S.flags[a]).length;
    html += `<div class="card" style="margin-top:12px"><h4>🌰 Sammy's Golden Acorns</h4><p>${have} / 3 found</p></div>`;
    body.innerHTML = html;
  }
}
function renderShop(body) {
  let html = `<p style="font-weight:800;margin:0 0 10px">Your shells: 🐚 ${S.shells}</p>`;
  body.innerHTML = html;
  SHOP.forEach(item => {
    const row = document.createElement('div');
    row.className = 'buyRow';
    const owned = S.gear[item.id];
    row.innerHTML = `<div class="bi" style="font-size:34px">${item.em}</div>
      <div class="bt"><b>${item.n}</b><small>${item.d}</small></div>`;
    const b = document.createElement('button');
    b.className = 'buyBtn' + (owned ? ' owned' : '');
    b.textContent = owned ? '✓ Owned' : `🐚 ${item.cost}`;
    b.disabled = owned;
    b.onclick = () => buyGear(item);
    row.appendChild(b);
    body.appendChild(row);
  });
}
function renderCafe(body) {
  body.innerHTML = `<p style="font-weight:800;margin:0 0 10px">Bring ingredients, bake yummy things, serve them for shells! 🐚</p>`;
  RECIPES.forEach(r => {
    if (!S.recipes.includes(r.id)) return;
    const row = document.createElement('div');
    row.className = 'buyRow';
    const needTxt = Object.entries(r.need).map(([k, v]) => {
      const meta = ITEMS[k] || { em: '🐟', n: (fishById(k) || {}).n || k };
      const have = invCount(k);
      const ok = have >= v;
      return `<span style="color:${ok ? '#3E7A3E' : '#C0574A'}">${meta.em}${have}/${v}</span>`;
    }).join(' ');
    row.innerHTML = `<div class="bi" style="font-size:34px">${r.em}</div>
      <div class="bt"><b>${r.n}</b><small>Needs: ${needTxt}</small></div>`;
    const can = Object.entries(r.need).every(([k, v]) => invCount(k) >= v);
    const b = document.createElement('button');
    b.className = 'buyBtn';
    b.textContent = '🍳 Bake!';
    b.disabled = !can;
    b.onclick = () => startCook(r);
    row.appendChild(b);
    body.appendChild(row);
  });
  // dishes to serve
  const dishes = RECIPES.filter(r => invCount('dish_' + r.id) > 0);
  if (dishes.length) {
    const h = document.createElement('p');
    h.style.cssText = 'font-weight:800;margin:14px 0 8px';
    h.textContent = 'Ready to serve:';
    body.appendChild(h);
    dishes.forEach(r => {
      const row = document.createElement('div');
      row.className = 'buyRow';
      row.innerHTML = `<div class="bi" style="font-size:34px">${r.em}</div>
        <div class="bt"><b>${r.n} × ${invCount('dish_' + r.id)}</b><small>A hungry islander will pay 🐚 ${r.pay}</small></div>`;
      const b = document.createElement('button');
      b.className = 'buyBtn';
      b.textContent = '🍽️ Serve';
      b.onclick = () => serveDish(r);
      row.appendChild(b);
      body.appendChild(row);
    });
  }
}
function serveDish(r) {
  if (!invTake('dish_' + r.id, 1)) return;
  addShells(r.pay);
  AudioSys.sfx('shellS');
  const eaters = ['Pochacco', 'Pompompurin', 'Hello Kitty', 'a happy seagull', 'Sammy', 'Pearl the Pigeon'];
  toast(`🍽️ ${pick(eaters)} loved the ${r.n}! +${r.pay} shells`);
  if (Math.random() < .4) { heart('melody'); }
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
  if (!any) body.innerHTML += '<div class="card"><p>No fish yet — grab your snorkel and dive in! 🌊</p></div>';
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
  if (S.flags.rainbow) {
    mkToggle('🌈 Rainbow Dress', S.outfit === 'rainbow', () => { S.outfit = S.outfit === 'rainbow' ? 'red' : 'rainbow'; markSave(); });
  }
  const fsRow = document.createElement('div');
  fsRow.className = 'buyRow';
  fsRow.innerHTML = '<div class="bt"><b>⛶ Fullscreen</b><small>On iPad: use Share → Add to Home Screen for the best fullscreen!</small></div>';
  const fsB = document.createElement('button');
  fsB.className = 'buyBtn'; fsB.textContent = 'Go';
  fsB.onclick = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };
  fsRow.appendChild(fsB);
  body.appendChild(fsRow);
  const rs = document.createElement('div');
  rs.className = 'card';
  rs.innerHTML = `<h4>💾 Save</h4><p>Your adventure saves all by itself. Played for ${Math.round((S.playSeconds || 0) / 60)} minutes!</p>`;
  const del = document.createElement('button');
  del.className = 'buyBtn';
  del.style.marginTop = '8px';
  del.textContent = '🗑 Start a brand-new game';
  let armed = false;
  del.onclick = () => {
    if (!armed) { armed = true; del.textContent = '⚠️ Really erase everything? Tap again!'; return; }
    wipeSave(); location.reload();
  };
  rs.appendChild(del);
  body.appendChild(rs);
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
    AudioSys.play(G.mode === 'dive' ? (G.p.y > 2000 ? 'deep' : 'sea') : 'island', 1.5);
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
  const zone = [.3, .24, .18][C.stage];
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
  if (S.mq === 5 && r.id === 'tart') {
    dsay([
      { who: 'melody', text: 'It\'s GORGEOUS! The oven hummed a little — did you hear it? The café is officially back open! 🥧' },
      { who: 'melody', text: 'Next: Pompompurin naps by his pudding stand, and he\'s guarding an old key… time for my famous Dreamy Pudding recipe!' },
    ], () => {
      if (!S.recipes.includes('pudding')) S.recipes.push('pudding');
      markSave(); heart('melody');
      advanceQuest(6);
    });
  } else if (S.mq === 6 && r.id === 'pudding') {
    toast('🍮 The pudding is ready! Bring it to Pompompurin!');
    updateHUD();
  }
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
  const zone = [.3, .24, .18][Math.min(C.stage, 2)];
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

/* ── INTRO ───────────────────────────────────────────────── */
function introScene() {
  const sc = {
    full: true,
    data: {},
    steps: [
      { d: 4.2, sub: 'Brooklyn, New York. A quiet night, after a long day of exploring…' },
      { d: 4.6, sub: 'Tap tap tap! — "Coo! Special delivery! All the way from across the sea!"', on: () => AudioSys.sfx('chirp') },
      { d: 6.4, sub: '"Dear Lila — our island has lost its song. The sea took our six pearls. Please come. — My Melody" 💌', on: () => AudioSys.sfx('write') },
      { d: 4.4, sub: 'So Lila packed her red dress and her bravest heart…', on: sc2 => { sc2.data.shot = 1; AudioSys.sfx('splash'); } },
      { d: 4.4, sub: '…and sailed three days and three nights, toward a hum only her heart could hear.' },
      { d: 4.6, sub: 'Shimmer Isle. Even hushed and quiet… it was the prettiest place she had ever seen. ✨', on: sc2 => { sc2.data.shot = 2; AudioSys.sfx('yay'); } },
    ],
    done: () => {
      G.mode = 'island';
      G.p.x = 380; G.cam.x = 0;
      G.tod = .34; S.tod = .34;
      AudioSys.play('island', 2);
      AudioSys.ambience('island');
      $('hud').style.display = 'flex';
      if (IS_TOUCH) $('touch').style.display = 'block';
      chapterCardShow(1, 'Welcome Ashore', () => {
        updateHUD();
        toast('⭐ ' + questHint());
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
    // Brooklyn night
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#0A1230'); g.addColorStop(1, '#1E2C54');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    // stars & moon
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255,255,240,${.3 + .5 * Math.sin(t * 2 + i * 3)})`;
      ctx.fillRect(n1(i * 7.3) * VW, n1(i * 3.1) * VH * .5, 2, 2);
    }
    glow(ctx, VW * .8, VH * .18, 80, rgba(230, 235, 255), .5);
    ctx.fillStyle = '#F4F6E8'; ctx.beginPath(); ctx.arc(VW * .8, VH * .18, 30, 0, TAU); ctx.fill();
    // skyline
    ctx.fillStyle = '#0B1226';
    for (let i = 0; i < 14; i++) {
      const bw = 60 + n1(i * 9.1) * 80, bh = 90 + n1(i * 4.7) * 200;
      const bx = i * VW / 13 - 30;
      ctx.fillRect(bx, VH * .82 - bh, bw, bh);
      // lit windows
      for (let wY = 0; wY < Math.floor(bh / 34); wY++) for (let wX = 0; wX < Math.floor(bw / 26); wX++) {
        if (n1(i * 37 + wY * 7 + wX * 3) > .55) {
          ctx.fillStyle = 'rgba(255,220,140,.85)';
          ctx.fillRect(bx + 7 + wX * 26, VH * .82 - bh + 8 + wY * 34, 12, 16);
          ctx.fillStyle = '#0B1226';
        }
      }
    }
    ctx.fillStyle = '#080E1E'; ctx.fillRect(0, VH * .82, VW, VH * .18);
    // Lila at her stoop
    ctx.save(); ctx.translate(VW * .32, VH * .82);
    ctx.scale(1.4, 1.4);
    drawLila(ctx, t, { face: 1, walk: 0, outfit: 'red' });
    ctx.restore();
    // pigeon flies in with letter
    const step = sc.idx;
    const fly = step >= 2 ? 1 : step >= 1 ? clamp(sc.t / 2, 0, 1) : 0;
    if (step >= 1) {
      const px2 = lerp(-60, VW * .32 + 80, ease(fly));
      const py2 = lerp(VH * .3, VH * .82 - 120, ease(fly)) + Math.sin(t * 8) * (1 - fly) * 12;
      ctx.save(); ctx.translate(px2, py2); ctx.scale(-1.6, 1.6);
      PAINT.pigeon(ctx, t, { fly: fly < .95 });
      ctx.restore();
      // envelope
      ctx.save(); ctx.translate(px2 - 4, py2 + 12); ctx.rotate(Math.sin(t * 3) * .08);
      rr(ctx, -16, -11, 32, 22, 4);
      ctx.fillStyle = '#FFE9F2'; ctx.fill(); ctx.strokeStyle = '#E56A93'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, -11); ctx.lineTo(0, 3); ctx.lineTo(16, -11); ctx.stroke();
      ctx.fillStyle = '#E56A93'; ctx.beginPath(); ctx.arc(0, 3, 4, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (step >= 2) {
      // big letter card
      const a = clamp(sc.t / .8, 0, 1);
      ctx.globalAlpha = a;
      const lw = Math.min(480, VW * .7), lh = lw * .62;
      rr(ctx, VW / 2 - lw / 2, VH * .16, lw, lh, 18);
      ctx.fillStyle = '#FFF8EC'; ctx.fill();
      ctx.strokeStyle = '#F26D99'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#C0574A';
      ctx.font = `italic 800 ${lw / 19}px ui-rounded, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Dear Lila —', VW / 2, VH * .16 + lh * .24);
      ctx.fillText('our island has lost its song.', VW / 2, VH * .16 + lh * .43);
      ctx.fillText('Please come.', VW / 2, VH * .16 + lh * .62);
      ctx.fillText('— My Melody 🎀', VW / 2, VH * .16 + lh * .84);
      ctx.globalAlpha = 1;
    }
  } else if (shot === 1) {
    // sailing
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#7FD8E8'); g.addColorStop(.55, '#C9F0F7'); g.addColorStop(.56, '#2E86B0'); g.addColorStop(1, '#155C84');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    glow(ctx, VW * .78, VH * .2, 110, rgba(255, 235, 160), .7);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(VW * .78, VH * .2, 40, 0, TAU); ctx.fill();
    // clouds
    for (let i = 0; i < 4; i++) {
      const cx2 = ((i * 300 + t * 18) % (VW + 300)) - 150, cy2 = VH * (.12 + n1(i) * .2);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(cx2, cy2, 26, 0, TAU); ctx.arc(cx2 + 30, cy2 - 10, 20, 0, TAU); ctx.arc(cx2 + 58, cy2, 22, 0, TAU); ctx.fill();
    }
    // waves
    for (let L = 0; L < 4; L++) {
      const wy = VH * (.58 + L * .1);
      ctx.fillStyle = `rgba(255,255,255,${.14 + L * .04})`;
      ctx.beginPath(); ctx.moveTo(0, VH);
      for (let x = 0; x <= VW; x += 22) ctx.lineTo(x, wy + Math.sin(x * .015 + t * (1.4 + L * .3) + L * 2) * 10);
      ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
    }
    // boat + lila
    const bx = VW * .38 + Math.sin(t * .4) * 12, by = VH * .62 + Math.sin(t * 1.5) * 8;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 1.2) * .05);
    blit(ctx, boatSpr(), 0, 40, 1.15);
    ctx.save(); ctx.translate(-16, -32); ctx.scale(.95, .95);
    drawLila(ctx, t, { face: 1, walk: 0, outfit: 'red' });
    ctx.restore();
    ctx.restore();
    // dolphin arcs
    const dp = (t * .45) % 2;
    if (dp < 1) {
      const dx2 = VW * .68 + dp * 160, dy2 = VH * .68 - Math.sin(dp * Math.PI) * 90;
      ctx.save(); ctx.translate(dx2, dy2); ctx.rotate(-Math.cos(dp * Math.PI) * .8);
      ctx.fillStyle = '#7B99C4';
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 12, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-46, -12); ctx.lineTo(-42, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  } else {
    // island reveal
    const p = clamp(sc.t / 4, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#FF9E7D'); g.addColorStop(.5, '#FFD9A0'); g.addColorStop(.51, '#2E86B0'); g.addColorStop(1, '#155C84');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    glow(ctx, VW / 2, VH * .5, 200, rgba(255, 240, 200), .5);
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(VW / 2, VH * .5, 46, 0, TAU); ctx.fill();
    // island silhouette grows
    const sc2 = lerp(.5, 1.15, ease(p));
    ctx.save(); ctx.translate(VW / 2, VH * .52); ctx.scale(sc2, sc2);
    ctx.fillStyle = '#2E6E54';
    ctx.beginPath(); ctx.moveTo(-320, 0);
    ctx.quadraticCurveTo(-190, -110, -60, -70);
    ctx.quadraticCurveTo(40, -160, 150, -60);
    ctx.quadraticCurveTo(250, -30, 320, 0);
    ctx.closePath(); ctx.fill();
    // tiny lighthouse
    ctx.fillStyle = '#E8DAC4'; ctx.fillRect(140, -120, 14, 60);
    ctx.fillStyle = '#C0574A'; ctx.fillRect(138, -132, 18, 12);
    ctx.restore();
    // rainbow
    ctx.globalAlpha = .5 * p;
    ['#FF6B81', '#FFB84D', '#FFE14C', '#7FE08C', '#7FD8E8', '#B9A8FF'].forEach((col, i) => {
      ctx.strokeStyle = col; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(VW / 2, VH * .78, 300 + i * 11, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // sparkles
    for (let i = 0; i < 16; i++) {
      const a = .4 + .6 * Math.sin(t * 3 + i * 2.1);
      ctx.fillStyle = `rgba(255,255,220,${a * p})`;
      starPath(ctx, n1(i * 5.3) * VW, n1(i * 8.7) * VH * .6, 4, 2);
      ctx.fill();
    }
  }
}

/* ── CORAL REVEAL (after first dive practice) ───────────── */
function coralRevealScene() {
  G.tempActor = { id: 'coral', x: 725, rise: 0 };
  startCutscene({
    steps: [
      { d: 1.6, sub: '…the water begins to sparkle…', on: () => { AudioSys.sfx('twinkle'); burst(700, gyAt(700) + 10, 'rgba(155,232,255,.9)', 22, { grav: -120 }); } },
      { d: 2.2, sub: 'SPLASH! ✨', on: () => { AudioSys.sfx('splash'); G.tempActor.rise = 1; burst(700, gyAt(700), 'rgba(220,245,255,.95)', 30, { grav: 240, speed: 260 }); } },
    ],
    done: () => {
      dsay([
        { who: 'coral', text: 'You swim like a baby dolphin! Hello, land-child! I\'m Coral — I\'ve been watching you collect the sea\'s little treasures.' },
        { who: 'lila', text: 'A REAL MERMAID!! I mean— hi! I\'m Lila! I\'m here to find the Song Pearls!' },
        { who: 'coral', text: 'I knew it! Then you\'ll need this: a Pearl Compass. When you dive, it sparkles toward whatever your heart is seeking.' },
        { who: 'coral', text: 'The first pearl sleeps in the giant clam near my rock, down in the sunny reef. Come find me under the waves!' },
      ], () => {
        S.flags.metCoral = true; S.gear.compass = true; markSave();
        heart('coral');
        AudioSys.sfx('quest');
        toast('🧭 Got the Pearl Compass!');
        if (G.tempActor) { burst(G.tempActor.x, gyAt(G.tempActor.x) + 10, 'rgba(220,245,255,.95)', 24, { grav: 200 }); AudioSys.sfx('splash'); }
        G.tempActor = null;
        advanceQuest(4);
      });
    },
  });
}

/* ── STORM (after Inky) ─────────────────────────────────── */
function stormScene() {
  const sc = {
    steps: [
      { d: 2.6, sub: 'The sky turned dark as ink…', on: () => { AudioSys.play('storm', 1); G.weather.target = 1; G.weather.rain = .4; G.weather.next = 999; } },
      { d: 3, sub: '⚡ A great storm rolled over Shimmer Isle! ⚡', on: () => { AudioSys.sfx('thunder'); G.shakeT = .8; G.shakeAmp = 9; G.flash = .7; } },
      { d: 2.6, sub: 'Everyone hid. Everyone held on.', on: () => { AudioSys.sfx('thunder'); G.flash = .5; G.shakeT = .5; G.shakeAmp = 6; } },
      { d: 3.4, sub: '…but an island full of friends is stronger than any storm. 🌈', on: () => { G.weather.target = 0; G.weather.rain = 0; G.weather.next = 120; AudioSys.play(isNight() ? 'night' : 'island', 3); } },
    ],
    data: { storm: true },
    done: () => {
      chapterCardShow(4, 'After the Storm', () => {
        advanceQuest(11, true);
        toast(`📜 ${MQ[11].t}: ${questHint()}`);
      });
    },
  };
  startCutscene(sc);
}

/* ── QUEEN OF THE DEEP ──────────────────────────────────── */
function queenScene() {
  startCutscene({
    steps: [
      { d: 2.4, sub: 'The palace gates glow, soft as moonlight…', on: () => { AudioSys.sfx('twinkle'); } },
      { d: 2.4, sub: 'A crowned shadow glides out of the dark. 👑', on: () => AudioSys.sfx('ding') },
    ],
    done: () => {
      dsay([
        { who: 'queen', text: 'So. You are the little song-bringer the currents whisper about. Welcome, Lila, to the bottom of the world.' },
        { who: 'lila', text: 'Queen Nerissa! I found five pearls! But the sixth one — Marina said—' },
        { who: 'queen', text: '—has been with me all along. It is the deepest note of the Great Song, and it goes only with someone whose heart can carry it.' },
        { who: 'queen', text: 'Sing with me, child of the shore. Show me everything the sea has taught you.' },
      ], () => startRhythm({
        rounds: [4, 5, 6], who: 'queen',
        onWin: () => {
          dsay([
            { who: 'queen', text: 'Magnificent!! The reef sang, the trench sang, and now you sing. Take my blessing — breathe as the mermaids breathe, forever.' },
            { who: 'lila', text: 'It feels like… like the whole ocean just hugged me!' },
            { who: 'queen', text: 'And take the final pearl. Carry all six to the lighthouse at sunset. Let our island SING again, Lila of Brooklyn!' },
          ], () => {
            S.gear.blessing = true; S.pearls[5] = true; markSave();
            G.p.air = Infinity;
            AudioSys.sfx('pearl');
            G.flash = .6;
            burst(G.p.x, G.p.y, 'rgba(200,180,255,.95)', 40, { star: true, grav: -30, speed: 200 });
            updateHUD();
            advanceQuest(14);
            toast('✨ Mermaid\'s Blessing — you can breathe underwater forever!');
          });
        },
      }));
    },
  });
}

/* ── FINALE ─────────────────────────────────────────────── */
function runFinale() {
  G.p.x = 8560; G.tod = .8; S.tod = .8;
  const sc = {
    data: { fw: [], fwT: 0, pearlsUp: 0, bloom: 0 },
    steps: [
      { d: 3.2, sub: 'Everyone gathered on the cliff as the sun touched the sea…', on: () => { AudioSys.stopMusic(); } },
      { d: 1.1, sub: '♪', on: s => { s.data.pearlsUp = 1; AudioSys.sfx('noteI', 0); } },
      { d: 1.1, sub: '♪ ♪', on: s => { s.data.pearlsUp = 2; AudioSys.sfx('noteI', 1); } },
      { d: 1.1, sub: '♪ ♪ ♪', on: s => { s.data.pearlsUp = 3; AudioSys.sfx('noteI', 2); } },
      { d: 1.1, sub: '♪ ♪ ♪ ♪', on: s => { s.data.pearlsUp = 4; AudioSys.sfx('noteI', 3); } },
      { d: 1.1, sub: '♪ ♪ ♪ ♪ ♪', on: s => { s.data.pearlsUp = 5; AudioSys.sfx('noteI', 4); } },
      { d: 2, sub: '♪ ♪ ♪ ♪ ♪ ♪ !', on: s => { s.data.pearlsUp = 6; AudioSys.sfx('pearl'); G.flash = .8; } },
      { d: 5, sub: 'And the Great Song came home to Shimmer Isle. 🎶', on: s => { s.data.bloom = 1; AudioSys.play('finale', .8); s.data.fireworks = true; } },
      { d: 4.6, sub: 'The lighthouse sang. The sea sang. Even Pompompurin danced (slowly).' },
      { d: 4.6, sub: 'Lila the Explorer — pearl-finder, deep-diver, duet partner, friend of the whole wide sea. 💗' },
      { d: 5.2, sub: 'Starring: Lila! · My Melody · Pochacco · Pompompurin · Hello Kitty · Coral, Marina & Queen Nerissa · Maestro Inky · Sammy & Pearl 🐿🕊' },
      { d: 5.2, sub: 'And starring YOU. The island is yours to explore, forever and ever. ✨ THE END… and the beginning!' },
    ],
    done: () => {
      S.mq = 15; S.flags.finaleDone = true; markSave(); saveGame();
      updateHUD();
      chapterCardShow(99, 'The Song of the Sea 💗', () => {
        toast('🌟 Free play unlocked! Fill your journal, find every starfish!');
      });
    },
    draw: drawFinaleOver,
  };
  startCutscene(sc);
}
function drawFinaleOver(sc) {
  const d = sc.data;
  const camX = G.cam.x;
  // gathered friends
  const friends = [['melody', 8340], ['pochacco', 8420], ['purin', 8250], ['kitty', 8680], ['sammy', 8180], ['pigeon', 8140]];
  friends.forEach(([id, fx], i) => {
    const sx = fx - camX;
    if (sx < -80 || sx > VW + 80) return;
    ctx.save(); ctx.translate(sx, gyAt(fx));
    const dance = d.fireworks ? Math.abs(Math.sin(G.t * (id === 'purin' ? 1.4 : 3.4) + i)) * (id === 'purin' ? 3 : 8) : 0;
    ctx.translate(0, -dance);
    PAINT[id](ctx, G.t + i * 2, { face: fx < 8560 ? 1 : -1 });
    ctx.restore();
  });
  // pearls rising in a crown above the lighthouse
  const lx = 8800 - camX, ly = Math.max(gyAt(8800) - 380, VH * .30);
  for (let i = 0; i < (d.pearlsUp || 0); i++) {
    const ang = -Math.PI / 2 + (i - 2.5) * .42;
    const rr2 = Math.min(130, VH * .22) + Math.sin(G.t * 2 + i) * 8;
    drawPearl(ctx, lx + Math.cos(ang) * rr2, ly + Math.sin(ang) * rr2 * .7, 10, G.t + i);
  }
  // color bloom
  if (d.bloom) {
    const a = .12 + .05 * Math.sin(G.t * 2);
    const bg = ctx.createRadialGradient(lx, ly, 60, lx, ly, VW);
    bg.addColorStop(0, `rgba(255,220,250,${a * 1.6})`);
    bg.addColorStop(.5, `rgba(255,200,140,${a * .5})`);
    bg.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH);
  }
  // fireworks
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
            const a = i / 26 * TAU;
            const sp = rnd(90, 200);
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
/* temp actor (coral popping out of the dive pool) */
function drawTempActor(camX) {
  const a = G.tempActor;
  if (!a) return;
  const sx = a.x - camX, gy = gyAt(a.x) + 26;
  if (a.rise) {
    ctx.save();
    ctx.translate(sx, gy);
    ctx.beginPath(); ctx.rect(-100, -170, 200, 170); ctx.clip();
    ctx.translate(0, lerp(90, -34, ease(Math.min(1, (a.riseT = (a.riseT || 0) + LAST_DT * 1.6)))));
    PAINT.coral(ctx, G.t, { face: G.p.x >= a.x ? 1 : -1, talk: G.dialog && G.dialog.who === 'coral' });
    ctx.restore();
    glow(ctx, sx, gy - 40, 60, rgba(255, 200, 240), .2);
  }
}
/* ============================================================
   TITLE, MAIN LOOP & BOOT
   ============================================================ */
let LAST_DT = 0.016;

/* ── title screen ────────────────────────────────────────── */
function drawTitle() {
  const t = G.t;
  // sunset sky
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#FF9E7D'); g.addColorStop(.4, '#FFD9A0');
  g.addColorStop(.55, '#2E86B0'); g.addColorStop(1, '#123650');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  glow(ctx, VW / 2, VH * .52, 180, rgba(255, 240, 200), .6);
  ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(VW / 2, VH * .52, 44, 0, TAU); ctx.fill();
  // sea
  for (let L = 0; L < 3; L++) {
    ctx.fillStyle = `rgba(255,255,255,${.1 + L * .05})`;
    const wy = VH * (.56 + L * .07);
    ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 24) ctx.lineTo(x, wy + Math.sin(x * .014 + t * (1 + L * .4)) * 7);
    ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
  }
  // island silhouette
  ctx.fillStyle = 'rgba(30,80,70,.85)';
  ctx.beginPath(); ctx.moveTo(VW * .6, VH * .58);
  ctx.quadraticCurveTo(VW * .72, VH * .44, VW * .84, VH * .55);
  ctx.quadraticCurveTo(VW * .95, VH * .5, VW * 1.05, VH * .58);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E8DAC4'; ctx.fillRect(VW * .8, VH * .44, 8, 34);
  ctx.fillStyle = '#C0574A'; ctx.fillRect(VW * .795, VH * .43, 11, 8);
  glow(ctx, VW * .805, VH * .44, 30, rgba(255, 230, 150), .5 + .3 * Math.sin(t * 2));
  // beach strip
  ctx.fillStyle = '#F2DCA8';
  ctx.beginPath(); ctx.moveTo(0, VH);
  ctx.quadraticCurveTo(VW * .3, VH * .82, VW, VH * .94);
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
  // character lineup
  const baseY = VH * .9;
  const chars = [
    ['purin', VW * .12, 1],
    ['melody', VW * .24, 1],
    ['lila', VW * .37, 1.15],
    ['pochacco', VW * .66, -1],
    ['kitty', VW * .78, -1],
  ];
  chars.forEach(([id, cx2, extra], i) => {
    ctx.save();
    ctx.translate(cx2, baseY - Math.abs(Math.sin(t * 2.2 + i * 1.1)) * 6);
    if (id === 'lila') { ctx.scale(extra, Math.abs(extra)); drawLila(ctx, t, { face: 1, walk: 0, outfit: S.outfit }); }
    else { ctx.scale(Math.abs(extra) * (extra < 0 ? -1 : 1) * 1, 1); PAINT[id](ctx, t + i, { face: extra < 0 ? 1 : 1 }); }
    ctx.restore();
  });
  // mermaid in the sea
  ctx.save();
  ctx.translate(VW * .88, VH * .72 + Math.sin(t * 1.4) * 6);
  ctx.scale(.9, .9);
  PAINT.coral(ctx, t, { face: -1 });
  ctx.restore();
  // sparkles
  for (let i = 0; i < 14; i++) {
    const a = .3 + .7 * Math.abs(Math.sin(t * 2 + i * 1.7));
    ctx.fillStyle = `rgba(255,255,230,${a * .7})`;
    starPath(ctx, n1(i * 6.1) * VW, n1(i * 3.9) * VH * .5, 4, 1.8);
    ctx.fill();
  }
  // title
  const ty = VH * .2;
  ctx.textAlign = 'center';
  const T1 = 'Lila';
  const T2 = '& the Song of the Sea';
  ctx.save();
  ctx.translate(VW / 2, ty);
  ctx.rotate(Math.sin(t * .8) * .015);
  const fs1 = Math.min(84, VW / 8);
  ctx.font = `900 ${fs1}px ui-rounded, 'Arial Rounded MT Bold', sans-serif`;
  ctx.lineWidth = fs1 * .22; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#7A2E4A';
  ctx.strokeText(T1, 0, 0);
  const tg = ctx.createLinearGradient(0, -fs1, 0, 10);
  tg.addColorStop(0, '#FFE9F2'); tg.addColorStop(.55, '#FF9FBE'); tg.addColorStop(1, '#F26D99');
  ctx.fillStyle = tg;
  ctx.fillText(T1, 0, 0);
  const fs2 = Math.min(34, VW / 20);
  ctx.font = `900 ${fs2}px ui-rounded, 'Arial Rounded MT Bold', sans-serif`;
  ctx.lineWidth = fs2 * .3;
  ctx.strokeStyle = '#1E4E68';
  ctx.strokeText(T2, 0, fs2 * 1.5);
  const tg2 = ctx.createLinearGradient(0, fs2, 0, fs2 * 2);
  tg2.addColorStop(0, '#E8FBFF'); tg2.addColorStop(1, '#7FD8E8');
  ctx.fillStyle = tg2;
  ctx.fillText(T2, 0, fs2 * 1.5);
  ctx.restore();
  ctx.font = `800 ${Math.min(15, VW / 46)}px ui-rounded, sans-serif`;
  ctx.fillStyle = 'rgba(255,244,220,.85)';
  ctx.fillText('A Shimmer Isle adventure ✨ made with love for Lila', VW / 2, ty + fs1 * .9 + 46);
}

/* ── mode updates/draws ──────────────────────────────────── */
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
  updateSparkles(dt);
  if (G.mode === 'island') updateIsland(dt);
  else if (G.mode === 'dive') updateDive(dt);
  else if (G.mode === 'title') { G.tod = .78; }
  // global action key
  if (actionQueued) {
    actionQueued = false;
    if (G.cutscene || G.cook || G.rhythm || G.chapterT || G.fade) { /* consumed elsewhere */ }
    else if (G.dialog) advanceDialog();
    else if (!G.panel && G.nearTarget) G.nearTarget.act();
  }
  // autosave
  saveTimer += dt;
  if (saveTimer > 5) { saveTimer = 0; if (saveDirty) saveGame(); }
}
function draw() {
  ctx.save();
  if (G.shakeT > 0) ctx.translate(rnd(-G.shakeAmp, G.shakeAmp), rnd(-G.shakeAmp, G.shakeAmp));
  if (G.mode === 'title') drawTitle();
  else if (G.mode === 'island') { drawIsland(); drawTempActor(G.cam.x); }
  else if (G.mode === 'dive') drawDive();
  else { ctx.fillStyle = '#08222e'; ctx.fillRect(0, 0, VW, VH); }
  if (G.cutscene) {
    if (G.cutscene.full) { ctx.fillStyle = '#08222e'; ctx.fillRect(-20, -20, VW + 40, VH + 40); }
    if (G.cutscene.draw) G.cutscene.draw(G.cutscene);
  }
  ctx.restore();
  if (G.rhythm) drawRhythm();
  if (G.cook) drawCook();
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

/* ── title buttons / boot ────────────────────────────────── */
function enterGameFromSave() {
  G.mode = 'island';
  G.p.x = S.px || 480;
  G.tod = S.tod || .34;
  G.cam.x = clamp(G.p.x - VW / 2, 0, ISLE_W - VW);
  $('titleUI').style.display = 'none';
  $('hud').style.display = 'flex';
  if (IS_TOUCH) $('touch').style.display = 'block';
  AudioSys.play(isNight() ? 'night' : 'island', 2);
  AudioSys.ambience('island');
  updateHUD();
  toast('⭐ ' + questHint());
}
function startNewGame() {
  const keepAudio = { music: S.music, sfx: S.sfx };
  wipeSave();
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
  const has = S.started;
  $('btnContinue').style.display = has ? 'block' : 'none';
  $('btnNew').textContent = has ? 'New Adventure 🌊' : 'Start the Adventure 🌊';
  AudioSys.play('title', 2);
}
let newArmed = false;
$('btnNew').onclick = () => {
  AudioSys.unlock(); AudioSys.sfx('tap');
  if (S.started && !newArmed) {
    newArmed = true;
    $('btnNew').textContent = '⚠️ Erase saved game? Tap again!';
    setTimeout(() => { newArmed = false; $('btnNew').textContent = 'New Adventure 🌊'; }, 3000);
    return;
  }
  startNewGame();
};
$('btnContinue').onclick = () => {
  AudioSys.unlock(); AudioSys.sfx('tap');
  enterGameFromSave();
};
/* touch buttons */
bindHold($('btnL'), 'L');
bindHold($('btnR'), 'R');
['touchstart', 'mousedown'].forEach(ev =>
  $('btnA').addEventListener(ev, e => { e.preventDefault(); actionQueued = true; AudioSys.unlock(); }, { passive: false }));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) AudioSys.hush(); else AudioSys.wake();
});
window.addEventListener('beforeunload', () => { if (S.started) saveGame(); });

/* boot */
initProps();
loadGame();
showTitle();
requestAnimationFrame(loop);
