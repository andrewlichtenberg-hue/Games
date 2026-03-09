/**
 * Audio Manager — dual-mode:
 *   • Web / Expo-Web  → Web Audio API (procedural synthesis)
 *   • Native iOS/Android → expo-av with a generated WAV data URI
 *
 * Critical fixes vs. v1:
 *   - Properly AWAITS ctx.resume() before scheduling notes (was a silent bug)
 *   - Adds 150 ms scheduling headroom so notes are never in the past
 *   - Falls back to expo-av on native platforms
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// ─── Frequency table ────────────────────────────────────────────────────────

const FREQ: Record<string, number> = {
  R: 0,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77, C6: 1046.50,
};

// ─── Track definitions ───────────────────────────────────────────────────────

type Note = { n: string; b: number }; // note name, beat count
interface TrackDef {
  melody: Note[];
  bass: Note[];
  bpm: number;
  wave: OscillatorType;
  vol: number;
  bassVol: number;
}

export type TrackName = 'theme' | 'park' | 'beach' | 'forest' | 'mountain' | 'celebration';
type SfxName = 'tap' | 'success' | 'levelup' | 'discover' | 'friendship' | 'walk' | 'whoosh' | 'pop';

const TRACKS: Record<TrackName, TrackDef> = {

  // Gentle, welcoming — C major, 88 BPM, sine
  theme: {
    bpm: 88, wave: 'sine', vol: 0.15, bassVol: 0.06,
    melody: [
      { n: 'C5', b: 1 }, { n: 'B4', b: 1 }, { n: 'A4', b: 1 }, { n: 'G4', b: 1 },
      { n: 'E4', b: 2 }, { n: 'G4', b: 2 },
      { n: 'A4', b: 1 }, { n: 'G4', b: 1 }, { n: 'F4', b: 1 }, { n: 'E4', b: 1 },
      { n: 'D4', b: 4 },
      { n: 'E4', b: 1 }, { n: 'G4', b: 1 }, { n: 'A4', b: 1 }, { n: 'C5', b: 1 },
      { n: 'B4', b: 1 }, { n: 'A4', b: 1 }, { n: 'G4', b: 1 }, { n: 'F4', b: 1 },
      { n: 'E4', b: 2 }, { n: 'D4', b: 2 },
      { n: 'C4', b: 4 },
    ],
    bass: [
      { n: 'C3', b: 4 }, { n: 'C3', b: 4 },
      { n: 'F3', b: 4 }, { n: 'G3', b: 4 },
      { n: 'C3', b: 4 }, { n: 'A3', b: 4 },
      { n: 'F3', b: 4 }, { n: 'C3', b: 4 },
    ],
  },

  // Cheerful, bouncy — C major, 116 BPM, triangle
  park: {
    bpm: 116, wave: 'triangle', vol: 0.14, bassVol: 0.06,
    melody: [
      { n: 'E5', b: 1 }, { n: 'D5', b: 1 }, { n: 'C5', b: 1 }, { n: 'D5', b: 1 },
      { n: 'E5', b: 2 }, { n: 'E5', b: 2 },
      { n: 'D5', b: 1 }, { n: 'C5', b: 1 }, { n: 'D5', b: 1 }, { n: 'E5', b: 1 },
      { n: 'C5', b: 4 },
      { n: 'E5', b: 1 }, { n: 'G5', b: 1 }, { n: 'A5', b: 1 }, { n: 'G5', b: 1 },
      { n: 'E5', b: 2 }, { n: 'C5', b: 2 },
      { n: 'D5', b: 1 }, { n: 'E5', b: 1 }, { n: 'D5', b: 1 }, { n: 'C5', b: 1 },
      { n: 'G4', b: 4 },
    ],
    bass: [
      { n: 'C3', b: 4 }, { n: 'C3', b: 4 },
      { n: 'C3', b: 4 }, { n: 'G3', b: 4 },
      { n: 'C3', b: 4 }, { n: 'F3', b: 4 },
      { n: 'G3', b: 4 }, { n: 'C3', b: 4 },
    ],
  },

  // Calm, dreamy — Eb major, 70 BPM, sine
  beach: {
    bpm: 70, wave: 'sine', vol: 0.12, bassVol: 0.05,
    melody: [
      { n: 'Eb4', b: 2 }, { n: 'F4', b: 2 },
      { n: 'G4', b: 4 },
      { n: 'Ab4', b: 2 }, { n: 'G4', b: 2 },
      { n: 'F4', b: 4 },
      { n: 'Eb4', b: 2 }, { n: 'C4', b: 2 },
      { n: 'Eb4', b: 3 }, { n: 'F4', b: 1 },
      { n: 'G4', b: 2 }, { n: 'F4', b: 2 },
      { n: 'Eb4', b: 4 },
    ],
    bass: [
      { n: 'C3', b: 4 }, { n: 'C3', b: 4 },
      { n: 'Ab3', b: 4 }, { n: 'G3', b: 4 },
      { n: 'C3', b: 4 }, { n: 'C3', b: 4 },
      { n: 'Ab3', b: 4 }, { n: 'G3', b: 4 },
    ],
  },

  // Mysterious, magical — A minor, 80 BPM, triangle
  forest: {
    bpm: 80, wave: 'triangle', vol: 0.12, bassVol: 0.05,
    melody: [
      { n: 'A4', b: 2 }, { n: 'C5', b: 2 },
      { n: 'E5', b: 2 }, { n: 'D5', b: 2 },
      { n: 'C5', b: 2 }, { n: 'B4', b: 2 },
      { n: 'A4', b: 4 },
      { n: 'G4', b: 1 }, { n: 'A4', b: 1 }, { n: 'B4', b: 1 }, { n: 'C5', b: 1 },
      { n: 'D5', b: 2 }, { n: 'E5', b: 2 },
      { n: 'C5', b: 1 }, { n: 'B4', b: 1 }, { n: 'A4', b: 1 }, { n: 'G4', b: 1 },
      { n: 'A4', b: 4 },
    ],
    bass: [
      { n: 'A3', b: 4 }, { n: 'A3', b: 4 },
      { n: 'D3', b: 4 }, { n: 'E3', b: 4 },
      { n: 'A3', b: 4 }, { n: 'A3', b: 4 },
      { n: 'D3', b: 4 }, { n: 'E3', b: 4 },
    ],
  },

  // Adventurous — G major pentatonic, 100 BPM, triangle
  mountain: {
    bpm: 100, wave: 'triangle', vol: 0.14, bassVol: 0.06,
    melody: [
      { n: 'G4', b: 2 }, { n: 'A4', b: 2 },
      { n: 'B4', b: 2 }, { n: 'D5', b: 2 },
      { n: 'E5', b: 2 }, { n: 'D5', b: 2 },
      { n: 'B4', b: 4 },
      { n: 'D5', b: 1 }, { n: 'E5', b: 1 }, { n: 'D5', b: 1 }, { n: 'B4', b: 1 },
      { n: 'A4', b: 2 }, { n: 'G4', b: 2 },
      { n: 'A4', b: 2 }, { n: 'B4', b: 2 },
      { n: 'G4', b: 4 },
    ],
    bass: [
      { n: 'G3', b: 4 }, { n: 'G3', b: 4 },
      { n: 'G3', b: 4 }, { n: 'D3', b: 4 },
      { n: 'G3', b: 4 }, { n: 'G3', b: 4 },
      { n: 'D3', b: 4 }, { n: 'G3', b: 4 },
    ],
  },

  // Triumphant — C major, 140 BPM, soft square
  celebration: {
    bpm: 140, wave: 'square', vol: 0.07, bassVol: 0.04,
    melody: [
      { n: 'C5', b: 1 }, { n: 'E5', b: 1 }, { n: 'G5', b: 1 }, { n: 'C6', b: 1 },
      { n: 'G5', b: 1 }, { n: 'E5', b: 1 }, { n: 'C5', b: 1 }, { n: 'R', b: 1 },
      { n: 'E5', b: 1 }, { n: 'G5', b: 1 }, { n: 'E5', b: 1 }, { n: 'C5', b: 1 },
      { n: 'D5', b: 2 }, { n: 'G4', b: 2 },
      { n: 'E5', b: 1 }, { n: 'D5', b: 1 }, { n: 'C5', b: 1 }, { n: 'D5', b: 1 },
      { n: 'E5', b: 2 }, { n: 'C5', b: 2 },
      { n: 'G4', b: 1 }, { n: 'A4', b: 1 }, { n: 'B4', b: 1 }, { n: 'C5', b: 1 },
      { n: 'C5', b: 4 },
    ],
    bass: [
      { n: 'C3', b: 2 }, { n: 'G3', b: 2 }, { n: 'C3', b: 2 }, { n: 'G3', b: 2 },
      { n: 'C3', b: 2 }, { n: 'G3', b: 2 }, { n: 'C3', b: 2 }, { n: 'G3', b: 2 },
      { n: 'C3', b: 2 }, { n: 'F3', b: 2 }, { n: 'C3', b: 2 }, { n: 'G3', b: 2 },
      { n: 'C3', b: 2 }, { n: 'G3', b: 2 }, { n: 'C3', b: 4 },
    ],
  },
};

// ─── WAV generator (for native expo-av path) ─────────────────────────────────

const SAMPLE_RATE = 22050;

/** Render note sequences to a 16-bit mono WAV, returned as a base64 string. */
function buildWavBase64(def: TrackDef): string {
  const beatDur = 60 / def.bpm;

  // Total duration in seconds
  const totalBeats = def.melody.reduce((s, n) => s + n.b, 0);
  const totalSec = totalBeats * beatDur;
  const numSamples = Math.ceil(totalSec * SAMPLE_RATE);
  const pcm = new Float32Array(numSamples);

  // Helper: render a single note into pcm
  function renderNote(freq: number, startSec: number, durSec: number, vol: number) {
    if (freq <= 0 || durSec <= 0) return;
    const startIdx = Math.floor(startSec * SAMPLE_RATE);
    const endIdx = Math.min(numSamples, Math.floor((startSec + durSec) * SAMPLE_RATE));
    const attackSamples = Math.floor(0.015 * SAMPLE_RATE);
    const releaseSamples = Math.floor(0.06 * SAMPLE_RATE);
    for (let i = startIdx; i < endIdx; i++) {
      const t = (i - startIdx) / SAMPLE_RATE;
      const samplesLeft = endIdx - i;
      let envelope = 1;
      const fromStart = i - startIdx;
      if (fromStart < attackSamples) {
        envelope = fromStart / attackSamples;
      } else if (samplesLeft < releaseSamples) {
        envelope = samplesLeft / releaseSamples;
      }
      const sample = Math.sin(2 * Math.PI * freq * t);
      pcm[i] += sample * vol * envelope;
    }
  }

  // Render melody
  let t = 0;
  for (const { n, b } of def.melody) {
    const freq = FREQ[n] ?? 0;
    const dur = b * beatDur;
    renderNote(freq, t, dur * 0.9, def.vol);
    t += dur;
  }

  // Render bass (always sine)
  t = 0;
  for (const { n, b } of def.bass) {
    const freq = FREQ[n] ?? 0;
    const dur = b * beatDur;
    renderNote(freq, t, dur * 0.9, def.bassVol);
    t += dur;
  }

  // Clamp and convert to 16-bit int
  const numBytes = 44 + numSamples * 2;
  const buf = new ArrayBuffer(numBytes);
  const view = new DataView(buf);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  const writeU32 = (offset: number, val: number) => view.setUint32(offset, val, true);
  const writeU16 = (offset: number, val: number) => view.setUint16(offset, val, true);

  writeStr(0, 'RIFF');
  writeU32(4, numBytes - 8);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  writeU32(16, 16);
  writeU16(20, 1);           // PCM
  writeU16(22, 1);           // mono
  writeU32(24, SAMPLE_RATE);
  writeU32(28, SAMPLE_RATE * 2); // byteRate
  writeU16(32, 2);           // blockAlign
  writeU16(34, 16);          // bitsPerSample
  writeStr(36, 'data');
  writeU32(40, numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, pcm[i]));
    const int16 = Math.floor(clamped * 32767);
    view.setInt16(44 + i * 2, int16, true);
  }

  // Convert ArrayBuffer → base64
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Low-level Web Audio helpers ─────────────────────────────────────────────

function playNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  vol: number,
  wave: OscillatorType,
) {
  if (freq <= 0 || dur <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.015);
  gain.gain.setValueAtTime(vol, Math.max(start + 0.015, start + dur - 0.06));
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

function scheduleSeq(
  ctx: AudioContext,
  dest: AudioNode,
  notes: Note[],
  bpm: number,
  wave: OscillatorType,
  vol: number,
  startAt: number,
): number {
  const bd = 60 / bpm;
  let t = startAt;
  for (const { n, b } of notes) {
    playNote(ctx, dest, FREQ[n] ?? 0, t, b * bd * 0.9, vol, wave);
    t += b * bd;
  }
  return t;
}

// ─── Audio Manager ───────────────────────────────────────────────────────────

const isNative = Platform.OS !== 'web';

class AudioManagerClass {
  // ── Web Audio state ─────────────────────────────────────────────────────────
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private masterVolume = 0.8;

  // ── Native (expo-av) state ──────────────────────────────────────────────────
  private nativeSound: Audio.Sound | null = null;
  private nativeCurrentTrack: TrackName | null = null;
  private wavCache: Partial<Record<TrackName, string>> = {};

  // ── Shared state ────────────────────────────────────────────────────────────
  private currentTrack: TrackName | null = null;

  // ── Web Audio helpers ───────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AC =
        typeof window !== 'undefined'
          ? (window.AudioContext ?? (window as any).webkitAudioContext)
          : null;
      if (!AC) throw new Error('Web Audio API not available');
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.masterVolume;
      this.musicGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Returns a fully-running AudioContext, awaiting resume if suspended. */
  private async getCtxReady(): Promise<AudioContext> {
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  private _clearLoop() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private _scheduleLoop(name: TrackName, def: TrackDef, startAt: number) {
    if (this.currentTrack !== name) return;
    const ctx = this.ctx!;
    const dest = this.musicGain!;
    const beatDur = 60 / def.bpm;
    const loopDur = def.melody.reduce((s, n) => s + n.b, 0) * beatDur;
    const endAt = startAt + loopDur;

    scheduleSeq(ctx, dest, def.melody, def.bpm, def.wave, def.vol, startAt);
    scheduleSeq(ctx, dest, def.bass, def.bpm, 'sine', def.bassVol, startAt);

    const delay = Math.max(50, (endAt - ctx.currentTime - 0.2) * 1000);
    this.loopTimer = setTimeout(() => this._scheduleLoop(name, def, endAt), delay);
  }

  // ── Native (expo-av) helpers ────────────────────────────────────────────────

  private getWavBase64(track: TrackName): string {
    if (!this.wavCache[track]) {
      this.wavCache[track] = buildWavBase64(TRACKS[track]);
    }
    return this.wavCache[track]!;
  }

  private async playNative(track: TrackName) {
    if (this.nativeCurrentTrack === track) return;
    await this.stopNative();
    this.nativeCurrentTrack = track;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const wav64 = this.getWavBase64(track);
      const uri = `data:audio/wav;base64,${wav64}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { isLooping: true, volume: this.masterVolume, shouldPlay: true },
      );
      this.nativeSound = sound;
    } catch (e) {
      console.warn('[Audio] native playMusic error:', e);
      this.nativeCurrentTrack = null;
    }
  }

  private async stopNative() {
    if (this.nativeSound) {
      try {
        await this.nativeSound.stopAsync();
        await this.nativeSound.unloadAsync();
      } catch (_) {}
      this.nativeSound = null;
    }
    this.nativeCurrentTrack = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async playMusic(track: TrackName) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;

    if (isNative) {
      await this.playNative(track);
      return;
    }

    // Web Audio path
    this._clearLoop();
    try {
      const ctx = await this.getCtxReady(); // ← critical: await resume!
      if (this.currentTrack !== track) return; // guard against race
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(this.masterVolume, ctx.currentTime, 0.1);
      }
      // Small 150 ms headroom so notes are never scheduled in the past
      this._scheduleLoop(track, TRACKS[track], ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('[Audio] playMusic error:', e);
    }
  }

  async stopMusic() {
    this.currentTrack = null;
    if (isNative) {
      await this.stopNative();
      return;
    }
    this._clearLoop();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
  }

  async playSfx(sfx: SfxName) {
    if (isNative) {
      // SFX on native: generate a tiny WAV tone inline
      this._playNativeSfx(sfx);
      return;
    }
    try {
      const ctx = await this.getCtxReady();
      const t = ctx.currentTime;
      const dest = ctx.destination;

      const tone = (
        freq: number,
        dur: number,
        vol: number,
        wave: OscillatorType = 'sine',
        start = t,
        freqEnd?: number,
      ) => {
        if (freq <= 0) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, start);
        if (freqEnd !== undefined) {
          osc.frequency.linearRampToValueAtTime(freqEnd, start + dur);
        }
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.01);
        gain.gain.setValueAtTime(vol, Math.max(start + 0.01, start + dur - 0.04));
        gain.gain.linearRampToValueAtTime(0, start + dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + dur + 0.01);
      };

      switch (sfx) {
        case 'tap':
          tone(880, 0.06, 0.12);
          break;
        case 'success':
          tone(523, 0.15, 0.14, 'sine', t);
          tone(659, 0.18, 0.14, 'sine', t + 0.13);
          tone(784, 0.25, 0.14, 'sine', t + 0.26);
          break;
        case 'levelup':
          tone(523, 0.12, 0.14, 'sine', t);
          tone(659, 0.12, 0.14, 'sine', t + 0.12);
          tone(784, 0.12, 0.14, 'sine', t + 0.24);
          tone(1047, 0.45, 0.18, 'sine', t + 0.36);
          break;
        case 'discover':
          [523, 659, 784, 880, 1047, 1319].forEach((f, i) =>
            tone(f, 0.1, 0.11, 'sine', t + i * 0.07),
          );
          break;
        case 'friendship':
          tone(261, 0.55, 0.09, 'sine', t);
          tone(330, 0.55, 0.09, 'sine', t);
          tone(392, 0.55, 0.09, 'sine', t);
          tone(523, 0.55, 0.07, 'sine', t);
          break;
        case 'walk':
          tone(220, 0.07, 0.09, 'sine', t, 140);
          break;
        case 'whoosh':
          tone(650, 0.28, 0.11, 'sine', t, 130);
          break;
        case 'pop':
          tone(420, 0.09, 0.15, 'sine', t, 180);
          break;
      }
    } catch (e) {
      console.warn('[Audio] SFX error:', e);
    }
  }

  /** Play a very short tone via expo-av for native SFX. */
  private async _playNativeSfx(sfx: SfxName) {
    // Map sfx to a simple frequency + duration
    const SFX_PARAMS: Record<SfxName, { freq: number; dur: number; vol: number }> = {
      tap:        { freq: 880, dur: 0.08, vol: 0.25 },
      success:    { freq: 659, dur: 0.35, vol: 0.25 },
      levelup:    { freq: 1047, dur: 0.45, vol: 0.28 },
      discover:   { freq: 880, dur: 0.40, vol: 0.22 },
      friendship: { freq: 523, dur: 0.55, vol: 0.22 },
      walk:       { freq: 200, dur: 0.08, vol: 0.15 },
      whoosh:     { freq: 500, dur: 0.28, vol: 0.18 },
      pop:        { freq: 420, dur: 0.10, vol: 0.20 },
    };
    const p = SFX_PARAMS[sfx];
    try {
      const def: TrackDef = {
        bpm: Math.round(60 / p.dur),
        wave: 'sine',
        vol: p.vol,
        bassVol: 0,
        melody: [{ n: Object.entries(FREQ).find(([, v]) => Math.abs(v - p.freq) < 5)?.[0] ?? 'A4', b: 1 }],
        bass: [],
      };
      const wav64 = buildWavBase64(def);
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${wav64}` },
        { shouldPlay: true, volume: this.masterVolume },
      );
      // Auto-unload after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (_) {
      // SFX failure is non-fatal; haptics already handle feedback
    }
  }

  async setMusicVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (isNative) {
      if (this.nativeSound) {
        await this.nativeSound.setVolumeAsync(this.masterVolume).catch(() => {});
      }
      return;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }
}

export const audioManager = new AudioManagerClass();
