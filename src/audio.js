// All-procedural audio via Web Audio API: generative relaxing BGM,
// engine (idle/throttle/brake), surface rolling per biome, collision + splash SFX.
// No audio files — everything is synthesized.

function makeNoiseBuffer(ctx, seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // pinkish noise (lowpassed white) sounds less harsh than pure white
    const white = Math.random() * 2 - 1;
    last = last * 0.94 + white * 0.06;
    d[i] = last * 6;
  }
  return buf;
}

// C-major pentatonic-friendly chord loop: Cmaj7 → Am7 → Fmaj7 → G6
const CHORDS = [
  [130.81, 164.81, 196.0, 246.94],
  [110.0, 130.81, 164.81, 196.0],
  [87.31, 110.0, 130.81, 164.81],
  [98.0, 123.47, 146.83, 164.81],
];
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.26];

const BGM_BASE = 0.3; // headroom-safe base level for the music bus

function clamp01(v) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
}

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('cv-muted') === '1';
    this.bgmVol = clamp01(parseFloat(localStorage.getItem('cv-bgm-vol') ?? '1'));
    this.sfxVol = clamp01(parseFloat(localStorage.getItem('cv-sfx-vol') ?? '1'));
    this._impactCooldown = 0;
  }

  // must be called from a user gesture (the START button)
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.noiseBuf = makeNoiseBuffer(ctx);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);

    // separate buses so BGM and SFX volume can be set independently
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);

    this._initBgm();
    this._initEngine();
    this._initSurface();
    this._initSkid();
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem('cv-muted', m ? '1' : '0');
    if (this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.1);
    }
  }

  setBgmVolume(v) {
    this.bgmVol = clamp01(v);
    localStorage.setItem('cv-bgm-vol', String(this.bgmVol));
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(BGM_BASE * this.bgmVol, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(v) {
    this.sfxVol = clamp01(v);
    localStorage.setItem('cv-sfx-vol', String(this.sfxVol));
    if (this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  // ---------- BGM: slow pads + occasional pentatonic plucks ----------

  _initBgm() {
    const ctx = this.ctx;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = BGM_BASE * this.bgmVol;

    this.bgmFilter = ctx.createBiquadFilter();
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.value = 900;
    this.bgmFilter.connect(this.bgmGain);
    this.bgmGain.connect(this.master);

    // pluck echo
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.34;
    this.delay.connect(fb);
    fb.connect(this.delay);
    this.delay.connect(this.bgmGain);

    this._chordIdx = 0;
    this._nextChordAt = 0;
    this._nextPluckAt = 0;
  }

  _playChord(freqs, when, dur) {
    const ctx = this.ctx;
    for (const f of freqs) {
      for (const det of [-2.5, 2.5]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        o.detune.value = det;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.055, when + 2.4);
        g.gain.setValueAtTime(0.055, when + dur - 3);
        g.gain.linearRampToValueAtTime(0, when + dur);
        o.connect(g);
        g.connect(this.bgmFilter);
        o.start(when);
        o.stop(when + dur + 0.1);
      }
    }
  }

  _playPluck(when) {
    const ctx = this.ctx;
    const f = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.16, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, when + 1.4);
    o.connect(g);
    g.connect(this.delay);
    g.connect(this.bgmFilter);
    o.start(when);
    o.stop(when + 1.6);
  }

  _updateBgm() {
    const t = this.ctx.currentTime;
    const CHORD_DUR = 8;
    if (t + 0.5 >= this._nextChordAt) {
      const when = Math.max(t, this._nextChordAt);
      this._playChord(CHORDS[this._chordIdx % CHORDS.length], when, CHORD_DUR + 2);
      this._chordIdx++;
      this._nextChordAt = when + CHORD_DUR;
    }
    if (t >= this._nextPluckAt) {
      if (Math.random() < 0.55) this._playPluck(t + 0.05);
      this._nextPluckAt = t + 1.8 + Math.random() * 2.6;
    }
  }

  // ---------- engine ----------

  _initEngine() {
    const ctx = this.ctx;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 400;
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxBus);

    this.engOsc1 = ctx.createOscillator();
    this.engOsc1.type = 'sawtooth';
    this.engOsc1.frequency.value = 50;
    this.engOsc2 = ctx.createOscillator();
    this.engOsc2.type = 'square';
    this.engOsc2.frequency.value = 25;
    const g2 = ctx.createGain();
    g2.gain.value = 0.5;
    this.engOsc1.connect(this.engineFilter);
    this.engOsc2.connect(g2);
    g2.connect(this.engineFilter);
    this.engOsc1.start();
    this.engOsc2.start();

    this._rpm = 0;
  }

  // ---------- surface rolling noise ----------

  _initSurface() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;

    this.surfFilter = ctx.createBiquadFilter();
    this.surfFilter.type = 'lowpass';
    this.surfFilter.frequency.value = 500;

    this.surfGain = ctx.createGain();
    this.surfGain.gain.value = 0;

    // bumpiness LFO (amplitude wobble, rate differs per surface)
    this.surfLfo = ctx.createOscillator();
    this.surfLfo.frequency.value = 8;
    this.surfLfoDepth = ctx.createGain();
    this.surfLfoDepth.gain.value = 0;
    this.surfLfo.connect(this.surfLfoDepth);
    this.surfLfoDepth.connect(this.surfGain.gain);
    this.surfLfo.start();

    src.connect(this.surfFilter);
    this.surfFilter.connect(this.surfGain);
    this.surfGain.connect(this.sfxBus);
    src.start();
  }

  // ---------- brake skid ----------

  _initSkid() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    src.playbackRate.value = 1.6;

    this.skidFilter = ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.value = 950;
    this.skidFilter.Q.value = 1.2;

    this.skidGain = ctx.createGain();
    this.skidGain.gain.value = 0;

    src.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.sfxBus);
    src.start();
  }

  // ---------- one-shot SFX ----------

  collision(intensity) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (t < this._impactCooldown) return;
    this._impactCooldown = t + 0.18;
    const k = Math.min(1, intensity);

    // thump: falling sine
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.22);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5 * k, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 0.3);

    // crunch: noise burst
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.4 * k, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    n.connect(f); f.connect(ng); ng.connect(this.sfxBus);
    n.start(t); n.stop(t + 0.2);
  }

  // Countdown pip. Used by the race start lights: three low, one high.
  beep(freq = 660, dur = 0.16, vol = 0.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  fanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // short rising arpeggio: C5 E5 G5 C6
    [523.25, 659.26, 783.99, 1046.5].forEach((f, i) => {
      const when = t + i * 0.11;
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(i === 3 ? 0.22 : 0.14, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + (i === 3 ? 0.9 : 0.35));
      o.connect(g); g.connect(this.master);
      o.start(when); o.stop(when + 1);
    });
  }

  landThud(intensity) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const k = Math.min(1, intensity);

    // suspension bottoming out: deep thump + short gravel spray
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(75, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.45 * k, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 0.25);

    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 450;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.22 * k, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    n.connect(f); f.connect(ng); ng.connect(this.sfxBus);
    n.start(t); n.stop(t + 0.3);
  }

  treeCrack(intensity) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const k = Math.min(1, intensity);

    // sharp wood crack
    const crack = this.ctx.createBufferSource();
    crack.buffer = this.noiseBuf;
    crack.playbackRate.value = 2.2;
    const cf = this.ctx.createBiquadFilter();
    cf.type = 'highpass';
    cf.frequency.value = 1300;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.5 * k, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    crack.connect(cf); cf.connect(cg); cg.connect(this.sfxBus);
    crack.start(t); crack.stop(t + 0.12);

    // foliage whoosh while it falls
    const wh = this.ctx.createBufferSource();
    wh.buffer = this.noiseBuf;
    const wf = this.ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.setValueAtTime(3400, t);
    wf.frequency.exponentialRampToValueAtTime(900, t + 0.55);
    wf.Q.value = 0.8;
    const wg = this.ctx.createGain();
    wg.gain.setValueAtTime(0.001, t);
    wg.gain.exponentialRampToValueAtTime(0.2 * k, t + 0.08);
    wg.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    wh.connect(wf); wf.connect(wg); wg.connect(this.sfxBus);
    wh.start(t); wh.stop(t + 0.7);

    // ground thump when the trunk lands
    const land = t + 0.38;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, land);
    o.frequency.exponentialRampToValueAtTime(32, land + 0.2);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.4 * k, land);
    og.gain.exponentialRampToValueAtTime(0.001, land + 0.26);
    o.connect(og); og.connect(this.sfxBus);
    o.start(land); o.stop(land + 0.3);
  }

  splash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // whoosh of water
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    n.connect(f); f.connect(g); g.connect(this.sfxBus);
    n.start(t); n.stop(t + 0.9);

    // a few rising "bloops"
    for (let i = 0; i < 3; i++) {
      const when = t + 0.15 + i * 0.16 + Math.random() * 0.05;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      const f0 = 180 + Math.random() * 120;
      o.frequency.setValueAtTime(f0, when);
      o.frequency.exponentialRampToValueAtTime(f0 * 2.6, when + 0.18);
      const og = this.ctx.createGain();
      og.gain.setValueAtTime(0.12, when);
      og.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      o.connect(og); og.connect(this.sfxBus);
      o.start(when); o.stop(when + 0.25);
    }
  }

  // ---------- per-frame update ----------

  // state: { speed, maxSpeed, throttle, biomes, path, inWater }
  update(dt, state) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this._updateBgm();

    const t = this.ctx.currentTime;
    const absV = Math.abs(state.speed);
    const vRatio = Math.min(1, absV / state.maxSpeed);

    // --- engine: idle rumble -> revving ---
    const targetRpm = 0.12 + vRatio * 0.75 + (state.throttle > 0 ? 0.16 : 0);
    this._rpm += (targetRpm - this._rpm) * Math.min(1, dt * 3.5);
    const baseF = 42 + this._rpm * 95;
    this.engOsc1.frequency.setTargetAtTime(baseF, t, 0.05);
    this.engOsc2.frequency.setTargetAtTime(baseF * 0.501, t, 0.05);
    this.engineFilter.frequency.setTargetAtTime(280 + this._rpm * 900, t, 0.08);
    const engVol = 0.024 + this._rpm * 0.045 + (state.throttle > 0 ? 0.01 : 0);
    this.engineGain.gain.setTargetAtTime(engVol, t, 0.1);

    // --- surface rolling: blend params by biome weights ---
    const b = state.biomes;
    // per-surface: [filterFreq, volume factor, lfoRate, lfoDepth]
    let freq = 0, vol = 0, lfoRate = 0, lfoDepth = 0;
    const add = (w, fr, vo, lr, ld) => { freq += w * fr; vol += w * vo; lfoRate += w * lr; lfoDepth += w * ld; };
    const dirtiness = Math.max(state.path, 0); // dirt path overrides local biome feel
    const wPath = dirtiness, wRest = 1 - dirtiness;
    add(wPath, 480, 1.0, 9, 0.5);                       // dirt road: low rumble, bumpy
    add(wRest * b.grass, 1500, 0.55, 5, 0.25);          // grass: soft swish
    add(wRest * b.forest, 700, 0.8, 7, 0.4);            // forest floor: duff & twigs
    add(wRest * b.desert, 330, 0.9, 0.1, 0.05);         // sand: smooth deep hiss
    add(wRest * b.beach, 380, 0.85, 0.1, 0.05);         // beach sand
    add(wRest * b.snow, 2600, 0.7, 16, 0.55);           // snow: bright fast crunch
    if (state.inWater) { freq = 900; vol = 1.1; lfoRate = 4; lfoDepth = 0.5; this.surfFilter.type = 'bandpass'; }
    else this.surfFilter.type = 'lowpass';

    const rollVol = state.airborne ? 0 : Math.min(1, absV / 8) * 0.1 * vol;
    this.surfFilter.frequency.setTargetAtTime(Math.max(120, freq), t, 0.15);
    this.surfGain.gain.setTargetAtTime(rollVol, t, 0.1);
    this.surfLfo.frequency.setTargetAtTime(Math.max(0.1, lfoRate * (0.5 + vRatio)), t, 0.2);
    this.surfLfoDepth.gain.setTargetAtTime(rollVol * lfoDepth, t, 0.1);

    // --- brake skid: braking hard while moving fast ---
    const braking = state.throttle < -0.01 && state.speed > 7 && !state.airborne;
    this.skidGain.gain.setTargetAtTime(braking ? 0.09 * vRatio : 0, t, braking ? 0.03 : 0.12);
  }
}
