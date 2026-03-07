/**
 * Audio Manager using the Web Audio API.
 * Generates music and sound effects procedurally — no audio files needed.
 */

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

type TrackName = 'theme' | 'park' | 'beach' | 'forest' | 'mountain' | 'celebration';
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

// ─── Low-level helpers ───────────────────────────────────────────────────────

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

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private currentTrack: TrackName | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private masterVolume = 0.8;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AC = (typeof window !== 'undefined')
        ? (window.AudioContext ?? (window as any).webkitAudioContext)
        : null;
      if (!AC) throw new Error('Web Audio API not available');
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.masterVolume;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async playMusic(track: TrackName) {
    if (this.currentTrack === track) return;
    this._clearLoop();
    this.currentTrack = track;
    try {
      const ctx = this.getCtx();
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(this.masterVolume, ctx.currentTime, 0.1);
      }
      this._scheduleLoop(track, TRACKS[track], ctx.currentTime);
    } catch (e) {
      console.warn('[Audio] playMusic error:', e);
    }
  }

  private _scheduleLoop(name: TrackName, def: TrackDef, startAt: number) {
    if (this.currentTrack !== name) return;
    const ctx = this.getCtx();
    const dest = this.musicGain!;
    const beatDur = 60 / def.bpm;
    const loopDur = def.melody.reduce((s, n) => s + n.b, 0) * beatDur;
    const endAt = startAt + loopDur;

    scheduleSeq(ctx, dest, def.melody, def.bpm, def.wave, def.vol, startAt);
    scheduleSeq(ctx, dest, def.bass, def.bpm, 'sine', def.bassVol, startAt);

    const delay = Math.max(50, (endAt - ctx.currentTime - 0.2) * 1000);
    this.loopTimer = setTimeout(() => this._scheduleLoop(name, def, endAt), delay);
  }

  private _clearLoop() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.currentTrack = null;
  }

  async stopMusic() {
    this._clearLoop();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
  }

  async playSfx(sfx: SfxName) {
    try {
      const ctx = this.getCtx();
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
          // Magical sparkle: rapid ascending shimmer
          [523, 659, 784, 880, 1047, 1319].forEach((f, i) =>
            tone(f, 0.1, 0.11, 'sine', t + i * 0.07),
          );
          break;

        case 'friendship':
          // Warm major chord
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

  async setMusicVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(
        this.masterVolume,
        this.ctx.currentTime,
        0.05,
      );
    }
  }
}

export const audioManager = new AudioManagerClass();
