export type RadioStationId =
  | 'off'
  | 'sarkor'
  | 'tooth'
  | 'backbone'
  | 'inner'
  | 'mundaka_surf';

export interface RadioStation {
  id: RadioStationId;
  bandName: string;
  town: string;
  genre: string;
  trackTitle: string;
  bpm: number;
  accentHex: string;
}

export const RADIO_STATIONS: readonly RadioStation[] = [
  {
    id: 'sarkor',
    bandName: 'Sarkor',
    town: 'Gernika-Lumo',
    genre: 'Punk-Rock',
    trackTitle: 'Gernikako Kaleak',
    bpm: 158,
    accentHex: '#ef4444',
  },
  {
    id: 'tooth',
    bandName: 'Tooth',
    town: 'Gernika-Lumo',
    genre: 'Post-Hardcore',
    trackTitle: 'Oka Gaineko Oihartzuna',
    bpm: 126,
    accentHex: '#f59e0b',
  },
  {
    id: 'backbone',
    bandName: 'Backbone',
    town: 'Bermeo',
    genre: 'Hardcore / Metal',
    trackTitle: 'Matxitxako Ekaitza',
    bpm: 144,
    accentHex: '#dc2626',
  },
  {
    id: 'inner',
    bandName: 'Inner',
    town: 'Busturialdea',
    genre: 'Alt-Rock / Stoner',
    trackTitle: 'Ogoñoko Lainoa',
    bpm: 112,
    accentHex: '#06b6d4',
  },
  {
    id: 'mundaka_surf',
    bandName: 'Urdaibai Surf FM',
    town: 'Mundaka',
    genre: 'Surf-Rock',
    trackTitle: 'Ezker Olatua',
    bpm: 138,
    accentHex: '#10b981',
  },
  {
    id: 'off',
    bandName: 'Irratia Itzalita',
    town: 'Urdaibai',
    genre: 'Ingurumen Soinua',
    trackTitle: 'Haizea eta Itsasoa',
    bpm: 0,
    accentHex: '#64748b',
  },
];

// 16-step MIDI note patterns (0 = rest) per station
const RIFFS: Record<Exclude<RadioStationId, 'off'>, { bass: number[]; lead: number[]; kick: number[]; snare: number[]; wave: OscillatorType; drive: number }> = {
  sarkor: {
    // Fast E-minor punk power-chord progression (E-C-G-D)
    bass: [40, 40, 40, 40, 48, 48, 48, 48, 43, 43, 43, 43, 45, 45, 50, 47],
    lead: [64, 0, 64, 67, 72, 0, 71, 67, 67, 0, 67, 71, 69, 67, 66, 62],
    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    wave: 'sawtooth',
    drive: 420,
  },
  tooth: {
    // Angular post-hardcore syncopated drop-D riff
    bass: [38, 0, 38, 41, 38, 0, 45, 44, 38, 0, 38, 41, 43, 0, 41, 40],
    lead: [62, 69, 0, 65, 62, 70, 0, 69, 62, 0, 67, 65, 64, 69, 65, 0],
    kick: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    wave: 'square',
    drive: 550,
  },
  backbone: {
    // Heavy Bermeo metal/HC chug with double-kick
    bass: [36, 36, 36, 0, 36, 36, 39, 36, 36, 36, 36, 0, 43, 42, 41, 39],
    lead: [60, 0, 63, 0, 60, 65, 67, 0, 60, 0, 63, 67, 70, 68, 67, 63],
    kick: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    snare: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    wave: 'sawtooth',
    drive: 720,
  },
  inner: {
    // Atmospheric Busturialdea stoner/alt-rock groove
    bass: [40, 0, 40, 43, 47, 0, 45, 43, 40, 0, 40, 43, 48, 0, 47, 45],
    lead: [64, 67, 71, 0, 69, 67, 64, 0, 64, 67, 72, 71, 69, 0, 67, 62],
    kick: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    wave: 'triangle',
    drive: 240,
  },
  mundaka_surf: {
    // Classic Mundaka surf-rock reverb twang
    bass: [40, 0, 44, 0, 47, 0, 49, 47, 45, 0, 49, 0, 52, 0, 49, 45],
    lead: [64, 64, 68, 71, 76, 74, 71, 68, 69, 69, 73, 76, 73, 71, 69, 68],
    kick: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    wave: 'triangle',
    drive: 160,
  },
};

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class UrdaibaiRadioEngine {
  private ctx: AudioContext | null = null;
  private outGain: GainNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private station: RadioStationId = 'sarkor';
  private step = 0;
  private stepTimer = 0;
  private muted = false;
  private paused = true;

  public getStation(): RadioStationId {
    return this.station;
  }

  public setStation(id: RadioStationId): void {
    this.station = id;
    this.step = 0;
  }

  public cycleStation(): RadioStationId {
    const idx = RADIO_STATIONS.findIndex((s) => s.id === this.station);
    const next = RADIO_STATIONS[(idx + 1) % RADIO_STATIONS.length];
    this.station = next.id;
    this.step = 0;
    return this.station;
  }

  public attachAudioContext(ctx: AudioContext, master: GainNode): void {
    if (this.ctx === ctx) return;
    this.ctx = ctx;

    const outGain = ctx.createGain();
    outGain.gain.value = 0.24;
    outGain.connect(master);
    this.outGain = outGain;

    // Gentle guitar amp saturation waveshaper
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((3 + 18) * x * 20 * (Math.PI / 180)) / (Math.PI + 18 * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.connect(outGain);
    this.shaper = shaper;
  }

  public setState(muted: boolean, paused: boolean): void {
    this.muted = muted;
    this.paused = paused;
  }

  public tick(dt: number): void {
    if (this.muted || this.paused || this.station === 'off' || !this.ctx || !this.outGain || !this.shaper) {
      return;
    }
    if (this.ctx.state === 'suspended') return;

    const spec = RADIO_STATIONS.find((s) => s.id === this.station);
    if (!spec || spec.bpm <= 0) return;

    const stepDur = 60 / spec.bpm / 2; // 8th-note groove
    this.stepTimer += dt;
    if (this.stepTimer < stepDur) return;
    this.stepTimer -= stepDur;

    const riff = RIFFS[this.station];
    const idx = this.step % 16;
    const now = this.ctx.currentTime;

    // 1. Bass / Rhythm Guitar Power Chord
    const bassNote = riff.bass[idx];
    if (bassNote > 0) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      osc.type = riff.wave;
      osc.frequency.setValueAtTime(midiToHz(bassNote), now);
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(riff.drive + 220, now);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.92);
      osc.connect(filt);
      filt.connect(this.shaper);
      osc.connect(g);
      g.connect(this.outGain);
      osc.start(now);
      osc.stop(now + stepDur * 0.95);
    }

    // 2. Lead Guitar Riff
    const leadNote = riff.lead[idx];
    if (leadNote > 0) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = riff.wave === 'triangle' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(midiToHz(leadNote), now);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.85);
      osc.connect(g);
      g.connect(this.outGain);
      osc.start(now);
      osc.stop(now + stepDur * 0.9);
    }

    // 3. Kick Drum
    if (riff.kick[idx] > 0) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(g);
      g.connect(this.outGain);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    // 4. Snare Snap
    if (riff.snare[idx] > 0) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.06);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(this.outGain);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    this.step = (this.step + 1) % 16;
  }
}
