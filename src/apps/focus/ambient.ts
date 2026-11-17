// Ambient sound engine: every channel is generated noise shaped by filters
// and slow LFOs; no audio files. The AudioContext is created lazily from a
// user gesture (browsers block audio that starts on its own).

export type ChannelId = 'rain' | 'waves' | 'cafe' | 'wind' | 'white';

export const channels: { id: ChannelId; label: string; icon: string }[] = [
  { id: 'rain', label: 'Rain', icon: 'water_drop' },
  { id: 'waves', label: 'Waves', icon: 'waves' },
  { id: 'cafe', label: 'Café', icon: 'local_cafe' },
  { id: 'wind', label: 'Wind', icon: 'air' },
  { id: 'white', label: 'White noise', icon: 'graphic_eq' },
];

type NoiseColour = 'white' | 'pink' | 'brown';

function noiseBuffer(ctx: AudioContext, colour: NoiseColour): AudioBuffer {
  const length = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0; // prettier-ignore
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (colour === 'white') {
      data[i] = white * 0.5;
    } else if (colour === 'pink') {
      // Paul Kellet's economy pink filter.
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    } else {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
  }
  return buffer;
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private gains = new Map<ChannelId, GainNode>();

  get started() {
    return this.ctx !== null;
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async start() {
    if (!this.ctx) this.build();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  async pause() {
    if (this.ctx?.state === 'running') await this.ctx.suspend();
  }

  /** volume 0..1; a squared curve feels linear to the ear. */
  setVolume(id: ChannelId, volume: number) {
    const gain = this.gains.get(id);
    if (gain && this.ctx) gain.gain.setTargetAtTime(volume * volume, this.ctx.currentTime, 0.08);
  }

  setMaster(volume: number) {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(volume * volume * 0.8, this.ctx.currentTime, 0.08);
    }
  }

  /** Soft two-note bell for the end of a session. */
  chime() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    [660, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, now + i * 0.18);
      env.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 1.6);
      osc.connect(env).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 1.7);
    });
  }

  async dispose() {
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    this.gains.clear();
    await ctx?.close();
  }

  private build() {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;

    const buffers = {
      white: noiseBuffer(ctx, 'white'),
      pink: noiseBuffer(ctx, 'pink'),
      brown: noiseBuffer(ctx, 'brown'),
    };

    const source = (colour: NoiseColour) => {
      const src = ctx.createBufferSource();
      src.buffer = buffers[colour];
      src.loop = true;
      src.start(0, Math.random() * 3); // offset so channels don't phase-lock
      return src;
    };

    const filter = (type: BiquadFilterType, frequency: number, q = 0.7) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = frequency;
      f.Q.value = q;
      return f;
    };

    /** Slow sine LFO added onto an AudioParam. */
    const lfo = (param: AudioParam, rate: number, depth: number) => {
      const osc = ctx.createOscillator();
      const amount = ctx.createGain();
      osc.frequency.value = rate;
      amount.gain.value = depth;
      osc.connect(amount).connect(param);
      osc.start();
    };

    const out = (id: ChannelId) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      this.gains.set(id, gain);
      return gain;
    };

    // Rain: bright pink noise.
    source('pink')
      .connect(filter('highpass', 400))
      .connect(filter('lowpass', 8000))
      .connect(out('rain'));

    // Waves: brown noise swelling every ~12 s.
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    lfo(swell.gain, 0.08, 0.45);
    source('brown').connect(filter('lowpass', 700)).connect(swell).connect(out('waves'));

    // Café: a mid-band murmur with a little movement, over low room tone.
    const murmur = filter('bandpass', 900, 0.6);
    lfo(murmur.frequency, 0.23, 250);
    const cafe = out('cafe');
    source('pink').connect(murmur).connect(cafe);
    source('brown').connect(filter('lowpass', 250)).connect(cafe);

    // Wind: white noise through a wandering resonant band.
    const gust = filter('bandpass', 500, 1.4);
    lfo(gust.frequency, 0.11, 300);
    source('white').connect(gust).connect(out('wind'));

    // White noise, softened.
    source('white').connect(filter('lowpass', 9000)).connect(out('white'));
  }
}
