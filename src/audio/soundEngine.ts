import type { VehicleId } from '../world/urdaibaiMap';
import type { WeatherCondition } from '../world/weatherSystem';
import { type RadioStationId, UrdaibaiRadioEngine } from './radioEngine';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private radio = new UrdaibaiRadioEngine();
  private muted = false;
  private initialized = false;

  public getRadioStation(): RadioStationId {
    return this.radio.getStation();
  }

  public setRadioStation(id: RadioStationId): void {
    this.unlock();
    this.radio.setStation(id);
  }

  public cycleRadioStation(): RadioStationId {
    this.unlock();
    return this.radio.cycleStation();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
      if (this.ctx && this.masterGain) {
        this.radio.attachAudioContext(this.ctx, this.masterGain);
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.35;
      master.connect(ctx.destination);
      this.masterGain = master;

      // Engine / rotor synth oscillator
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      const engFilter = ctx.createBiquadFilter();
      engFilter.type = 'lowpass';
      engFilter.frequency.value = 240;
      const engGain = ctx.createGain();
      engGain.gain.value = 0;

      osc.connect(engFilter);
      engFilter.connect(engGain);
      engGain.connect(master);
      osc.start();

      this.engineOsc = osc;
      this.engineGain = engGain;

      // Ambient coastal wind / sea surf noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = data[i];
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      noise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 380;
      windFilter.Q.value = 0.7;

      const windGain = ctx.createGain();
      windGain.gain.value = 0.05;

      noise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      noise.start();

      // Rain shower white/pink noise layer
      const rainBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const rData = rainBuf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        // Occasional crisp droplet transient mixed into steady rainfall
        rData[i] = Math.random() < 0.015 ? w * 0.85 : w * 0.35;
      }
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = rainBuf;
      rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1850;
      rainFilter.Q.value = 0.45;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0;

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);
      rainSource.start();

      this.windFilter = windFilter;
      this.windGain = windGain;
      this.rainFilter = rainFilter;
      this.rainGain = rainGain;
      this.radio.attachAudioContext(ctx, master);
      this.initialized = true;
    } catch {
      // AudioContext unavailable in restricted headless contexts
    }
  }

  public update(
    vehicle: VehicleId,
    speedKmh: number,
    altitudeM: number,
    paused: boolean,
    dt = 0.016,
    weather: WeatherCondition = 'sunny',
  ): void {
    this.radio.setState(this.muted, paused);
    this.radio.tick(dt);

    if (!this.initialized || !this.ctx || !this.engineOsc || !this.engineGain || !this.windGain || !this.windFilter) {
      return;
    }
    const now = this.ctx.currentTime;
    if (paused || this.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      this.windGain.gain.setTargetAtTime(0, now, 0.08);
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }

    // Wind & rain react dynamically to speed, altitude, and weather
    const weatherWindBoost = weather === 'rainy' ? 0.045 : weather === 'cloudy' ? 0.02 : 0;
    const windLevel = Math.min(0.25, 0.035 + weatherWindBoost + speedKmh * 0.0007 + altitudeM * 0.0004);
    this.windGain.gain.setTargetAtTime(windLevel, now, 0.12);
    this.windFilter.frequency.setTargetAtTime(320 + speedKmh * 4 + altitudeM * 2, now, 0.12);

    if (this.rainGain && this.rainFilter) {
      const targetRain = weather === 'rainy' ? 0.14 : weather === 'cloudy' ? 0.012 : 0;
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.35);
      this.rainFilter.frequency.setTargetAtTime(weather === 'rainy' ? 1950 : 1100, now, 0.3);
    }

    const engDuck = this.radio.getStation() === 'off' ? 1 : 0.7;

    // Engine tone per vehicle
    if (vehicle === 'car' || vehicle === 'moto') {
      const baseHz = vehicle === 'moto' ? 68 : 48;
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setTargetAtTime(baseHz + speedKmh * 1.15, now, 0.06);
      this.engineGain.gain.setTargetAtTime((0.055 + Math.min(0.08, speedKmh * 0.0005)) * engDuck, now, 0.08);
    } else if (vehicle === 'plane' || vehicle === 'heli') {
      this.engineOsc.type = vehicle === 'heli' ? 'triangle' : 'sawtooth';
      const baseHz = vehicle === 'heli' ? 32 : 62;
      this.engineOsc.frequency.setTargetAtTime(baseHz + speedKmh * 0.55, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.09 * engDuck, now, 0.08);
    } else if (vehicle === 'scooter') {
      this.engineOsc.type = 'sine';
      this.engineOsc.frequency.setTargetAtTime(140 + speedKmh * 3.5, now, 0.06);
      this.engineGain.gain.setTargetAtTime((speedKmh > 2 ? 0.035 : 0) * engDuck, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    }
  }

  public playChime(type: 'vehicle' | 'discover' | 'jump'): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g);
    g.connect(this.masterGain);

    if (type === 'discover') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'vehicle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.1);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
