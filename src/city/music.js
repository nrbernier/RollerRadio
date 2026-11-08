// ============================================================
//  MUSIC — one generative band that follows you around the city.
//  Every district has a recipe (tempo, meter, scale, groove, instruments);
//  where you stand blends them. The clock glides between tempos (through
//  half-time when the jump is big); harmony and meter change on bar lines.
// ============================================================
const Sound = (() => {
  let ctx = null, master, musicOut, gate, tape, mlp, sfxOut, revIn, dlyIn, dly, dlyFb, dlyLP, noiseBuf, crush, crushMix, cleanMix, conv;
  const midiF = m => 440 * Math.pow(2, (m - 69) / 12);
  const TPB = 12;                                  // clock ticks per beat (fits both 16ths and triplets)
  const clk = { bpm: 72, target: 72, tick: 0, next: 0, start: 0, paused: false, resumeAt: null, timer: null, playing: false, beatT: [] };
  // what the player is doing (set every frame by the game)
  const R = { speed: 0, grinding: false, air: false, airTime: 0, grounded: true, listen: 0, night: 0, train: 0, under: 0, water: 0, weights: {}, spots: {}, wet: 0 };
  const S = { musicVol: 0.85, sfxVol: 0.8 };
  let rng = U.rng(9001);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain(); master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.2;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    master.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
    // music: out → gate (stops) → tape (pitch dives) → low-pass (underwater, cellar) → master
    musicOut = ctx.createGain(); musicOut.gain.value = S.musicVol;
    gate = ctx.createGain(); gate.gain.value = 1;
    tape = ctx.createDelay(3); tape.delayTime.value = 0;
    mlp = ctx.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 18000; mlp.Q.value = 0.7;
    // lo-fi crunch path for the record cellar
    crush = ctx.createWaveShaper(); const cc = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 256 - 1; cc[i] = Math.round(x * 10) / 10 * 0.9 + Math.tanh(x * 2) * 0.1; } crush.curve = cc;
    crushMix = ctx.createGain(); crushMix.gain.value = 0; cleanMix = ctx.createGain(); cleanMix.gain.value = 1;
    musicOut.connect(gate); gate.connect(tape); tape.connect(cleanMix); tape.connect(crush); crush.connect(crushMix); cleanMix.connect(mlp); crushMix.connect(mlp); mlp.connect(master);
    sfxOut = ctx.createGain(); sfxOut.gain.value = S.sfxVol; sfxOut.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // reverb (a long, soft room) and a tempo delay
    conv = ctx.createConvolver(); const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1); }
    conv.buffer = ir; revIn = ctx.createGain(); revIn.gain.value = 0.35; revIn.connect(conv); conv.connect(musicOut);
    dly = ctx.createDelay(3); dlyFb = ctx.createGain(); dlyFb.gain.value = 0.35; dlyLP = ctx.createBiquadFilter(); dlyLP.type = 'lowpass'; dlyLP.frequency.value = 2400;
    dlyIn = ctx.createGain(); dlyIn.gain.value = 0.3; dlyIn.connect(dly); dly.connect(dlyLP); dlyLP.connect(dlyFb); dlyFb.connect(dly); dlyLP.connect(musicOut);
    I.init();
  }

  // ---------- helpers ----------
  function env(g, t, a, peak, dec, sus = 0.0001, hold = 0) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + hold + dec); }
  function osc(type, f, t, dur, dest) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (dest) o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
  function noise(t, dur, dest, rate = 1) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate; s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; }
  function gain(dest, v = 1) { const g = ctx.createGain(); g.gain.value = v; g.connect(dest); return g; }
  function filt(type, f, q, dest) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; }
  function sends(g, rev = 0, dl = 0) { if (rev > 0) g.connect(gain(revIn, rev)); if (dl > 0) g.connect(gain(dlyIn, dl)); }
  // a polite ceiling on simultaneous notes, counted against the audio clock (not timers)
  const VMAX = 56, ends = [];
  const voice = (dur) => {
    const now = ctx.currentTime;
    if (ends.length > VMAX) { for (let i = ends.length - 1; i >= 0; i--) if (ends[i] < now) ends.splice(i, 1); if (ends.length > VMAX) return false; }
    ends.push(now + Math.min(dur, 6) + 0.3); return true;
  };

  // ---------- instruments (all take time, then velocity; d = destination) ----------
  const I = {
    init() {},
    kick(t, v = 1, d = musicOut, f0 = 140, f1 = 44, dec = 0.32) { if (!voice(dec)) return; const g = gain(d, 0); env(g, t, 0.002, 1.0 * v, dec); const o = osc('sine', f0, t, dec + 0.1, g); o.frequency.exponentialRampToValueAtTime(f1, t + 0.11); const c = gain(d, 0); env(c, t, 0.001, 0.15 * v, 0.02); noise(t, 0.03, filt('highpass', 2500, 0.7, c)); },
    softKick(t, v = 1, d = musicOut) { I.kick(t, v * 0.7, d, 90, 40, 0.4); },
    snare(t, v = 1, d = musicOut) { if (!voice(0.25)) return; const g = gain(d, 0); env(g, t, 0.001, 0.6 * v, 0.16); noise(t, 0.2, filt('bandpass', 1900, 0.6, g)); const g2 = gain(d, 0); env(g2, t, 0.001, 0.35 * v, 0.07); const o = osc('triangle', 200, t, 0.1, g2); o.frequency.exponentialRampToValueAtTime(150, t + 0.07); sends(g, 0.2 * v); },
    brush(t, v = 0.5, d = musicOut, long = false) { if (!voice(0.3)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18 * v, t + (long ? 0.08 : 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + (long ? 0.32 : 0.12)); noise(t, long ? 0.36 : 0.15, filt('bandpass', 3800, 0.5, g)); },
    rim(t, v = 0.6, d = musicOut) { if (!voice(0.06)) return; const g = gain(d, 0); env(g, t, 0.001, 0.3 * v, 0.035); osc('triangle', 1700, t, 0.06, g); const c = gain(d, 0); env(c, t, 0.001, 0.18 * v, 0.015); noise(t, 0.03, filt('highpass', 4000, 0.7, c)); sends(g, 0.15); },
    hat(t, v = 0.5, open = false, d = musicOut) { if (!voice(0.3)) return; const g = gain(d, 0); env(g, t, 0.001, 0.25 * v, open ? 0.28 : 0.04); noise(t, open ? 0.35 : 0.06, filt('highpass', 7800, 0.7, g)); },
    ride(t, v = 0.4, d = musicOut) { if (!voice(0.6)) return; const g = gain(d, 0); env(g, t, 0.001, 0.13 * v, 0.6); noise(t, 0.65, filt('bandpass', 6800, 1.2, g)); const m = gain(d, 0); env(m, t, 0.001, 0.025 * v, 0.45); osc('square', 4920, t, 0.5, filt('highpass', 3500, 0.7, m)); sends(g, 0.15); },
    clap(t, v = 1, d = musicOut) { if (!voice(0.2)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); [0, 0.011, 0.022].forEach(o => { g.gain.setValueAtTime(0.5 * v, t + o); g.gain.exponentialRampToValueAtTime(0.05, t + o + 0.009); }); g.gain.setValueAtTime(0.4 * v, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); noise(t, 0.22, filt('bandpass', 1300, 1.2, g)); sends(g, 0.3 * v); },
    shaker(t, v = 0.3, d = musicOut) { if (!voice(0.1)) return; const g = gain(d, 0); env(g, t, 0.012, 0.1 * v, 0.05); noise(t, 0.09, filt('highpass', 6200, 0.6, g)); },
    conga(t, f = 260, v = 0.6, d = musicOut) { if (!voice(0.25)) return; const g = gain(d, 0); env(g, t, 0.002, 0.5 * v, 0.22); const o = osc('sine', f * 1.45, t, 0.28, g); o.frequency.exponentialRampToValueAtTime(f, t + 0.03); sends(g, 0.12); },
    doum(t, v = 0.8, d = musicOut) { if (!voice(0.4)) return; const g = gain(d, 0); env(g, t, 0.002, 0.8 * v, 0.35); const o = osc('sine', 110, t, 0.4, g); o.frequency.exponentialRampToValueAtTime(70, t + 0.12); const s = gain(d, 0); env(s, t, 0.001, 0.12 * v, 0.03); noise(t, 0.04, filt('bandpass', 800, 1, s)); },
    tek(t, v = 0.6, d = musicOut) { if (!voice(0.08)) return; const g = gain(d, 0); env(g, t, 0.001, 0.35 * v, 0.05); noise(t, 0.06, filt('bandpass', 3200, 2.5, g)); const o = gain(d, 0); env(o, t, 0.001, 0.2 * v, 0.04); osc('sine', 690, t, 0.06, o); sends(g, 0.15); },
    woodblock(t, m = 84, v = 0.6, d = musicOut) { if (!voice(0.1)) return; const g = gain(d, 0); env(g, t, 0.001, 0.32 * v, 0.06); osc('sine', midiF(m), t, 0.09, g); const g2 = gain(d, 0); env(g2, t, 0.001, 0.12 * v, 0.02); osc('square', midiF(m) * 2.4, t, 0.04, filt('bandpass', midiF(m) * 2.4, 4, g2)); sends(g, 0.35); },
    frame(t, v = 0.6, d = musicOut) { if (!voice(0.5)) return; const g = gain(d, 0); env(g, t, 0.004, 0.55 * v, 0.45); const o = osc('sine', 72, t, 0.5, g); o.frequency.exponentialRampToValueAtTime(55, t + 0.3); const s = gain(d, 0); env(s, t, 0.003, 0.06 * v, 0.2); noise(t, 0.25, filt('lowpass', 500, 0.8, s)); sends(g, 0.3); },
    cowbell(t, v = 0.5, d = musicOut) { if (!voice(0.3)) return; const g = gain(d, 0); env(g, t, 0.001, 0.15 * v, 0.25); const bp = filt('bandpass', 900, 2.5, g); osc('square', 545, t, 0.3, bp); osc('square', 815, t, 0.3, bp); sends(g, 0.15); },
    agogo(t, hi = true, v = 0.5, d = musicOut, m = null) { if (!voice(0.3)) return; const f = m != null ? midiF(m) : hi ? 1120 : 840, g = gain(d, 0); env(g, t, 0.001, 0.16 * v, 0.22); osc('sine', f, t, 0.25, g); osc('sine', f * 2.71, t, 0.12, gain(g, 0.3)); sends(g, 0.2); },
    metal(t, m = 60, v = 0.5, d = musicOut, dec = 0.5) { if (!voice(dec)) return; const f = midiF(m), g = gain(d, 0); env(g, t, 0.001, 0.2 * v, dec); const c = osc('sine', f, t, dec + 0.1, g); const mod = ctx.createOscillator(); mod.frequency.value = f * 1.41; const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 4, t); mg.gain.exponentialRampToValueAtTime(f * 0.2, t + dec); mod.connect(mg); mg.connect(c.frequency); mod.start(t); mod.stop(t + dec + 0.1); sends(g, 0.3, 0.1); },
    clank(t, v = 0.5, d = musicOut) { I.metal(t, deg(Math.floor(Math.random() * 4) * 2, 1), v, d, 0.18); },      // in key: chord-ish degrees
    // pitched
    upright(t, m, dur, v = 1, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.006, 0.6 * v, Math.max(0.2, dur * 0.95)); const f = filt('lowpass', 900, 1.5, g); f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(350, t + 0.15); osc('triangle', midiF(m), t, dur + 0.1, f); osc('sine', midiF(m), t, dur + 0.1, gain(g, 0.7)); },
    sub(t, m, dur, v = 1, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.01, 0.55 * v, dur, 0.0001, dur * 0.4); osc('sine', midiF(m), t, dur + 0.1, g); osc('triangle', midiF(m), t, dur + 0.1, gain(g, 0.15)); },
    acid(t, m, dur, v = 1, acc = false, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.003, (acc ? 0.14 : 0.09) * v, dur); const f = filt('lowpass', 300, 12, g); f.frequency.setValueAtTime(acc ? 3200 : 1800, t); f.frequency.exponentialRampToValueAtTime(240, t + 0.16); osc('sawtooth', midiF(m), t, dur + 0.05, f); sends(g, 0.05, 0.2); },
    ep(t, notes, dur, v = 1, d = musicOut) { for (const m of notes) { if (!voice(dur * 1.6)) return; const g = gain(d, 0); env(g, t, 0.003, 0.09 * v, dur * 1.6 + 0.2); const c = osc('sine', midiF(m), t, dur * 1.6 + 0.3, g); const mod = ctx.createOscillator(); mod.frequency.value = midiF(m); const mg = ctx.createGain(); mg.gain.setValueAtTime(midiF(m) * 1.8, t); mg.gain.exponentialRampToValueAtTime(midiF(m) * 0.1, t + 0.3); mod.connect(mg); mg.connect(c.frequency); mod.start(t); mod.stop(t + dur * 1.6 + 0.3); sends(g, 0.25, 0.08); } },
    vibes(t, m, v = 1, d = musicOut, dur = 1.2) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.002, 0.13 * v, dur); const o = osc('sine', midiF(m), t, dur + 0.1, g); const trem = ctx.createOscillator(); trem.frequency.value = 5.5; const tg = ctx.createGain(); tg.gain.value = 0.04 * v; trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + dur + 0.1); osc('sine', midiF(m) * 4, t, 0.15, gain(g, 0.15)); sends(g, 0.35, 0.15); },
    marimba(t, m, v = 1, d = musicOut) { if (!voice(0.3)) return; const g = gain(d, 0); env(g, t, 0.001, 0.16 * v, 0.25); osc('sine', midiF(m), t, 0.3, g); const g2 = gain(d, 0); env(g2, t, 0.001, 0.05 * v, 0.05); osc('sine', midiF(m) * 3.9, t, 0.08, g2); sends(g, 0.3, 0.12); },
    kalimba(t, m, v = 1, d = musicOut) { if (!voice(0.9)) return; const g = gain(d, 0); env(g, t, 0.001, 0.14 * v, 0.8); osc('sine', midiF(m), t, 0.9, g); const g2 = gain(d, 0); env(g2, t, 0.001, 0.06 * v, 0.12); osc('sine', midiF(m) * 5.4, t, 0.15, g2); sends(g, 0.45, 0.2); },
    glock(t, m, v = 1, d = musicOut) { if (!voice(0.9)) return; const g = gain(d, 0); env(g, t, 0.001, 0.1 * v, 0.9); osc('sine', midiF(m + 12), t, 1.0, g); osc('sine', midiF(m + 12) * 2.76, t, 0.3, gain(g, 0.25)); sends(g, 0.4, 0.1); },
    bell(t, m, v = 1, d = musicOut, dur = 2.4) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.002, 0.13 * v, dur); osc('sine', midiF(m), t, dur + 0.1, g); const g2 = gain(d, 0); env(g2, t, 0.002, 0.05 * v, dur * 0.4); osc('sine', midiF(m) * 2.76, t, dur * 0.4 + 0.1, g2); osc('sine', midiF(m) * 5.4, t, 0.3, gain(g2, 0.4)); sends(g, 0.6, 0.1); },
    musicbox(t, m, v = 1, d = musicOut) { if (!voice(1.4)) return; const g = gain(d, 0); env(g, t, 0.001, 0.12 * v, 1.3); osc('sine', midiF(m), t, 1.4, g); const h = gain(d, 0); env(h, t, 0.001, 0.045 * v, 0.3); osc('sine', midiF(m) * 3.01, t, 0.4, h); sends(g, 0.7, 0.15); },
    pluck(t, m, v = 1, d = musicOut, bright = 1) {         // oud-ish: a decaying, slightly bent saw through a closing filter
      if (!voice(0.6)) return; const g = gain(d, 0); env(g, t, 0.002, 0.12 * v, 0.55);
      const f = filt('lowpass', 2600 * bright, 3, g); f.frequency.exponentialRampToValueAtTime(500, t + 0.35);
      const o = osc('sawtooth', midiF(m) * 1.012, t, 0.6, f); o.frequency.exponentialRampToValueAtTime(midiF(m), t + 0.04);
      osc('triangle', midiF(m + 12), t, 0.3, gain(f, 0.3)); sends(g, 0.25, 0.15);
    },
    flute(t, m, dur, v = 1, d = musicOut) {
      if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.06, 0.12 * v, dur * 0.85, 0.0001, dur * 0.3);
      const o = osc('sine', midiF(m) * 0.99, t, dur + 0.2, g); o.frequency.exponentialRampToValueAtTime(midiF(m), t + 0.08);
      osc('triangle', midiF(m), t, dur + 0.2, gain(g, 0.25));
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + dur * 0.7); lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.2);
      const br = gain(g, 0.25); noise(t, dur + 0.1, filt('bandpass', midiF(m) * 1.5, 3, br));
      sends(g, 0.55, 0.2);
    },
    trumpet(t, m, dur, v = 1, d = musicOut, mute = true) {
      if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.03, 0.1 * v, dur, 0.0001, dur * 0.4);
      const f = filt('bandpass', mute ? 1300 : 1800, mute ? 2.2 : 0.9, g); f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(mute ? 1500 : 2200, t + 0.06);
      const o = osc('sawtooth', midiF(m) * 0.98, t, dur + 0.15, f); o.frequency.exponentialRampToValueAtTime(midiF(m), t + 0.05);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(10, t + dur); lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.15);
      sends(g, 0.35, 0.18);
    },
    accordion(t, notes, dur, v = 1, d = musicOut) {
      if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.02, 0.05 * v, dur, 0.0001, dur * 0.5);
      const f = filt('bandpass', 1400, 0.8, g); const trem = ctx.createOscillator(); trem.frequency.value = 6.5; const tg = ctx.createGain(); tg.gain.value = 0.012 * v; trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + dur + 0.2);
      for (const m of notes) for (const dt of [-6, 6]) { const o = osc('square', midiF(m), t, dur + 0.15, f); o.detune.value = dt; }
      sends(g, 0.25);
    },
    pad(t, notes, dur, v = 1, d = musicOut, bright = 1) {
      if (!voice(dur)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035 * v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
      const f = filt('lowpass', 900 * bright, 0.7, g); sends(g, 0.6);
      for (const m of notes) { const a = osc('sawtooth', midiF(m), t, dur + 0.4, f); a.detune.value = -8; const b = osc('sawtooth', midiF(m), t, dur + 0.4, f); b.detune.value = 8; }
    },
    choir(t, notes, dur, v = 1, d = musicOut) {
      if (!voice(dur)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4); sends(g, 0.8);
      const fA = filt('bandpass', 750, 5, gain(g, 1)), fB = filt('bandpass', 1150, 6, gain(g, 0.6)), fC = filt('bandpass', 2800, 8, gain(g, 0.15));
      for (const m of notes) for (const dt of [-9, 9]) { const o = osc('sawtooth', midiF(m), t, dur + 0.5, null); o.detune.value = dt; o.connect(fA); o.connect(fB); o.connect(fC); }
    },
    skank(t, notes, v = 1, d = musicOut) { if (!voice(0.2)) return; const g = gain(d, 0); env(g, t, 0.003, 0.08 * v, 0.12); const f = filt('bandpass', 1600, 1.2, g); for (const m of notes) osc('sawtooth', midiF(m), t, 0.16, f); sends(g, 0.2, 0.5); },
    melodica(t, m, dur, v = 1, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.03, 0.09 * v, dur, 0.0001, dur * 0.35); const f = filt('lowpass', 2400, 1, g); osc('square', midiF(m), t, dur + 0.1, f); osc('sawtooth', midiF(m) * 1.003, t, dur + 0.1, gain(f, 0.5)); sends(g, 0.3, 0.45); },
    steelpan(t, m, v = 1, d = musicOut) { if (!voice(1.1)) return; const f = midiF(m), g = gain(d, 0); env(g, t, 0.002, 0.1 * v, 1.0); osc('sine', f, t, 1.1, g); osc('sine', f * 2, t, 0.6, gain(g, 0.35)); osc('sine', f * 3.03, t, 0.25, gain(g, 0.12)); sends(g, 0.5, 0.25); },
    drone(t, m, dur, v = 1, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * v, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5); const f = filt('lowpass', 500, 1, g); for (const dt of [-5, 0, 7]) { const o = osc('sawtooth', midiF(m), t, dur + 0.6, f); o.detune.value = dt; } osc('sine', midiF(m - 12), t, dur + 0.6, gain(g, 1.2)); sends(g, 0.7); },
    foghorn(t, v = 1, d = musicOut) { if (!voice(3.5)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * v, t + 0.4); g.gain.setValueAtTime(0.22 * v, t + 2.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4); const f = filt('lowpass', 420, 2, g); for (const fr of [73.4, 74.2, 110]) osc('sawtooth', fr, t, 3.5, f); sends(g, 0.9, 0.3); },
    waves(t, dur, v = 1, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08 * v, t + dur * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + dur); const f = filt('lowpass', 700, 0.5, g); f.frequency.linearRampToValueAtTime(1600, t + dur * 0.45); f.frequency.linearRampToValueAtTime(500, t + dur); noise(t, dur + 0.1, f, 0.6); sends(g, 0.4); },
    vox(t, m, v = 1, vowel = 'a', d = musicOut, dur = 0.3) { if (!voice(dur)) return; const F = { a: [800, 1150, 2900], e: [450, 1900, 2600], o: [450, 800, 2830], u: [325, 700, 2530], i: [300, 2100, 2900] }[vowel]; const g = gain(d, 0); env(g, t, 0.02, 0.22 * v, dur, 0.0001, dur * 0.3); const src = osc('sawtooth', midiF(m) * 0.97, t, dur * 1.4 + 0.1, null); src.frequency.exponentialRampToValueAtTime(midiF(m), t + 0.05); F.forEach((f, i) => src.connect(filt('bandpass', f, 9, gain(g, [1, 0.6, 0.25][i])))); sends(g, 0.4, 0.25); },
    crackle(t, v = 1, d = musicOut) { const g = gain(d, 0); env(g, t, 0.0004, (0.04 + Math.random() * 0.1) * v, 0.004); noise(t, 0.012, filt('highpass', 2400, 0.8, g)); },
    bird(t, v = 0.5, d = musicOut) { if (!voice(0.4)) return; const n = 2 + Math.floor(Math.random() * 3), f0 = 2600 + Math.random() * 1800; for (let i = 0; i < n; i++) { const tt = t + i * (0.07 + Math.random() * 0.04), g = gain(d, 0); env(g, tt, 0.004, 0.05 * v, 0.06); const o = osc('sine', f0 * (0.9 + Math.random() * 0.2), tt, 0.08, g); o.frequency.exponentialRampToValueAtTime(f0 * (1.2 + Math.random() * 0.5), tt + 0.05); } },
    quack(t, v = 0.5, d = musicOut) { if (!voice(0.2)) return; const g = gain(d, 0); env(g, t, 0.004, 0.12 * v, 0.14); const o = osc('sawtooth', 520, t, 0.16, filt('bandpass', 1300, 6, g)); o.frequency.exponentialRampToValueAtTime(380, t + 0.13); },
    bark(t, v = 0.5, d = musicOut) { if (!voice(0.2)) return; const g = gain(d, 0); env(g, t, 0.003, 0.22 * v, 0.1); const o = osc('square', 260, t, 0.13, filt('bandpass', 900, 2, g)); o.frequency.exponentialRampToValueAtTime(170, t + 0.1); noise(t, 0.08, filt('bandpass', 1500, 1, gain(g, 0.4))); },
    whistle(t, m, m2, dur, v = 0.5, d = musicOut) { if (!voice(dur)) return; const g = gain(d, 0); env(g, t, 0.03, 0.07 * v, dur, 0.0001, dur * 0.4); const o = osc('sine', midiF(m), t, dur + 0.1, g); o.frequency.setValueAtTime(midiF(m), t + dur * 0.4); o.frequency.exponentialRampToValueAtTime(midiF(m2), t + dur * 0.7); const lf = ctx.createOscillator(); lf.frequency.value = 6; const lg = ctx.createGain(); lg.gain.value = midiF(m) * 0.012; lf.connect(lg); lg.connect(o.frequency); lf.start(t); lf.stop(t + dur + 0.1); sends(g, 0.3, 0.1); },
    horn(t, notes, v = 0.5, d = musicOut) { if (!voice(0.4)) return; const g = gain(d, 0); env(g, t, 0.01, 0.07 * v, 0.3, 0.0001, 0.12); const f = filt('bandpass', 700, 1.4, g); for (const m of notes) osc('square', midiF(m), t, 0.45, f); },
    croak(t, m, v = 0.5, d = musicOut) { if (!voice(0.3)) return; for (let j = 0; j < 3; j++) { const tt = t + j * 0.045, g = gain(d, 0); env(g, tt, 0.002, 0.12 * v, 0.03); osc('square', midiF(m), tt, 0.05, filt('bandpass', midiF(m) * 5, 3, g)); } },
    hoot(t, v = 0.5, d = musicOut, m = 67, m2 = 66) { if (!voice(1.2)) return; for (const [o, f] of [[0, midiF(m)], [0.45, midiF(m2)], [0.7, midiF(m2)]]) { const g = gain(d, 0); env(g, t + o, 0.04, 0.09 * v, 0.25); const s2 = osc('sine', f * 1.05, t + o, 0.32, g); s2.frequency.exponentialRampToValueAtTime(f, t + o + 0.12); sends(g, 0.6); } },
    clack(t, v = 1, d = musicOut) { if (!voice(0.1)) return; const g = gain(d, 0); env(g, t, 0.001, 0.4 * v, 0.06); noise(t, 0.08, filt('bandpass', 1200, 1.4, g)); const o = gain(d, 0); env(o, t, 0.001, 0.25 * v, 0.05); osc('triangle', 180, t, 0.07, o); },
  };

  // ---------- scales and harmony ----------
  const MODES = { major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], hijaz: [0, 1, 4, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9] };
  // brightest to darkest: at night a district's mood slides one step down this ladder
  const DARK = ['lydian', 'major', 'mixolydian', 'dorian', 'aeolian', 'phrygian'];
  const H = { root: 62, mode: MODES.dorian, modeName: 'dorian', deg: 0, next: null, bell: 0 };   // root as a midi note (D4)
  // midi note for a scale degree (can be negative / beyond 7), relative to the current root
  const deg = (dd, oct = 0) => { const m = H.mode, n = m.length, o = Math.floor(dd / n), k = ((dd % n) + n) % n; return H.root + m[k] + 12 * (o + oct); };
  // chord tones of the current chord (stacked thirds from the chord degree)
  const chord = (size = 4, oct = 0, d0 = H.deg) => { const out = []; for (let i = 0; i < size; i++) out.push(deg(d0 + i * 2, oct)); return out; };
  const fold = (m, hi = 88) => { while (m > hi) m -= 12; return m; };
  const nearest = (m, set) => { let b = set[0], bd = 99; for (const s of set) for (const o of [-24, -12, 0, 12, 24]) { const d = Math.abs(s + o - m); if (d < bd) { bd = d; b = s + o; } } return b; };

  // generators
  const euclid = (k, n, rot = 0) => { const out = []; for (let i = 0; i < n; i++) out.push(((i + rot) * k) % n < k); return out; };
  // a short melodic cell: [step, degreeOffset, lengthInSteps]
  function motif(r, steps, notes, span = 4, rest = 0.25) {
    const out = []; let d = Math.floor(r() * 3);
    const pos = []; for (let i = 0; i < steps; i++) if (r() < notes / steps * 1.2) pos.push(i);
    pos.sort((a, b) => a - b);
    for (let i = 0; i < pos.length; i++) {
      if (r() < rest) continue;
      d += Math.round((r() - 0.5) * span); d = U.clamp(d, -3, 9);
      const len = (pos[i + 1] ?? steps) - pos[i];
      out.push([pos[i], d, Math.max(1, len)]);
    }
    return out;
  }
  const shift = (m, by) => m.map(([s, d, l]) => [s, d + by, l]);

  // ---------- the recipes ----------
  // play(c): c.s = step in bar, c.bar, c.phrase, c.t = time, c.sd = step seconds, c.v = weight·volume,
  // c.r = this recipe's random, c.st = this recipe's state, c.e = energy 0..1 (slowly wandering)
  const REC = {
    business: {   // fast, jazzy, syncopated
      bpm: 124, beats: 4, sub: 4, swing: 0.16, root: 62, mode: 'dorian', rev: 0.25, dly: 0.18,
      moods: ['dorian', 'mixolydian', 'aeolian'], nightTempo: 0.1, nightGain: 0.9,
      prog: [[0, 7], [3, 7], [1, 7], [4, 7]],      // i9 – IV13 – ii – v (D dorian vamp)
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c, n = 16;
        if (!st.kick || c.newPhrase) { st.kick = euclid(r() < 0.5 ? 5 : 3, 16, Math.floor(r() * 3)); st.kick[0] = true; st.comp = [3, 6, 10, 14].map(x => (x + Math.floor(r() * 2)) % 16); st.horn = motif(r, 16, 5, 3); st.walk = 0; }
        // ride cymbal: ding, ding-a-ding (swung)
        if (s % 4 === 0 || s % 8 === 6) I.ride(t, v * (s % 8 === 0 ? 0.9 : 0.6));
        if (s % 8 === 4) I.hat(t, v * 0.35, false);
        if (st.kick[s] && c.night < 0.5) I.kick(t, v * 0.75, musicOut, 120, 48, 0.24);          // at night: a trio, no kick
        if ((s === 4 || s === 12)) I.rim(t, v * 0.7);
        if (e > 0.4 && (s % 2 === 1) && r() < 0.18 + c.crowd * 0.5) I.brush(t, v * (0.25 + r() * 0.3));
        if (bar % 8 === 7 && s >= 12) I.snare(t, v * (0.25 + (s - 12) * 0.12));
        // walking bass: chord tones on the beat, chromatic approach on the last beat
        if (s % 4 === 0) {
          const ct = chord(4, -2);
          let m = s === 0 ? ct[0] : s === 12 ? (deg(c.nextDeg, -2) + (r() < 0.5 ? -1 : 1)) : ct[Math.floor(r() * 4)];
          I.upright(t, m, sd * 3.6, v * 0.9);
          if (r() < 0.2 && s !== 12) I.upright(t + sd * 2.6, m + (r() < 0.5 ? 2 : -1), sd * 1, v * 0.5);
        }
        // rhodes comping, charleston-ish
        if (st.comp.includes(s)) I.ep(t, chord(4, 0).map((m, i) => i === 3 ? m - 12 + 12 : m), sd * 1.2, v * 0.8);
        // muted trumpet answers on bars 2 and 4 of every 4 (call & response with the keys)
        if ((e > 0.55 - c.night * 0.3 || c.listen > 0.5) && bar % 2 === 1) for (const [ss, d, l] of st.horn) if (ss === s) I.trumpet(t, nearest(deg(d, 1), chord(4, 1)), l * sd * 0.9, v * 0.8);
        // vibes sparkle when the energy is up
        if (e > 0.7 && s % 3 === 0 && r() < 0.3) I.vibes(t, deg(Math.floor(r() * 7), 1), v * 0.5);
      }
    },
    park: {       // slow, wooden, dark: 12/8 under big trees
      bpm: 66, beats: 4, sub: 3, swing: 0, root: 64, mode: 'aeolian', rev: 0.5, dly: 0.25,
      moods: ['aeolian', 'dorian', 'aeolian', 'mixolydian'], nightTempo: 0.08, nightGain: 0.9,
      prog: [[0, 7], [5, 7], [2, 7], [6, 7], [0, 7], [3, 7], [4, 7], [0, 7]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (!st.arp || c.newPhrase) { st.arp = [0, 2, 4, 6, 4, 2].map(x => x + (r() < 0.3 ? 1 : 0)); st.fl = motif(r, 12, 4, 3, 0.4); st.flBar = Math.floor(r() * 4); }
        // heartbeat: soft frame drum, woodblock on the triplet
        if (s === 0) I.frame(t, v * 0.6);
        if (s === 7 && e > 0.3) I.frame(t, v * 0.3);
        if (s % 3 === 2 && e > 0.5 && r() < 0.5) I.woodblock(t, deg(s % 6 === 2 ? 4 : 2, 1), v * 0.35);
        // marimba / kalimba rolling arpeggio of the chord
        if (e > 0.2) { const ct = chord(4, 0); const m = ct[st.arp[s % st.arp.length] % 4] + (s >= 6 ? 12 : 0); (s % 2 ? I.kalimba : I.marimba)(t, m, v * (s % 3 === 0 ? 0.7 : 0.45)); }
        // low drone on the root
        if (s === 0 && bar % 2 === 0) I.drone(t, deg(0, -2), sd * 24, v * 0.8);
        // wooden flute: long, sparse
        if ((bar % 4 === st.flBar || c.listen > 0.5) && e > 0.35) for (const [ss, d, l] of st.fl) if (ss === s) I.flute(t, deg(d, 1), Math.max(sd * 2, l * sd), v * 0.9);
        // birds (a quick flute trill) now and then
        if (r() < 0.012) { const m = deg(7 + Math.floor(r() * 5), 1); I.flute(t, m, 0.08, v * 0.5); I.flute(t + 0.09, m + 2, 0.08, v * 0.4); }
      }
    },
    market: {     // bright, busy, 3 against 2
      bpm: 100, beats: 4, sub: 3, swing: 0, root: 57, mode: 'hijaz', rev: 0.2, dly: 0.2,
      moods: ['hijaz', 'harmonic', 'hijaz', 'phrygian'], nightTempo: 0.12, nightGain: 0.5,
      prog: [[0, 3], [0, 3], [6, 3], [0, 3]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (!st.bell || c.newPhrase) { st.bell = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]; st.riff = motif(r, 12, 7, 2, 0.15); st.callBar = Math.floor(r() * 2); }
        // the 12/8 bell (the "standard pattern") on the agogo
        if (st.bell[s]) I.agogo(t, s % 4 !== 1, v * 0.55, musicOut, deg(s % 4 !== 1 ? 4 : 0, 2));
        // doum on 1 and the "and" of 2, teks filling in
        if (s === 0 || s === 5 || (s === 8 && e > 0.5)) I.doum(t, v * 0.8);
        else if ((s % 3 === 1 || s % 3 === 2) && r() < 0.55 + e * 0.3) I.tek(t, v * (0.3 + r() * 0.35));
        // claps in twos against the triplet feel (polyrhythm)
        if (e > 0.45 && c.night < 0.5 && (s === 3 || s === 9)) I.clap(t, v * 0.45);
        // shaker on every triplet
        I.shaker(t, v * (s % 3 === 0 ? 0.6 : 0.35));
        // bass ostinato
        if (s === 0 || s === 4 || s === 7 || s === 10) I.sub(t, deg(s === 7 ? 4 : 0, -2), sd * 2, v * 0.8);
        // oud-like plucks play a running riff
        for (const [ss, d, l] of st.riff) if (ss === s && (e > 0.3 || bar % 2 === 0)) I.pluck(t, deg(d, 0), v * 0.8, musicOut, 1.1);
        // a call (voice) and the plucks answer
        if (bar % 4 === 2 + st.callBar && (s === 0 || s === 3 || s === 6) && e > 0.5 && c.night < 0.5) I.vox(t, deg([4, 3, 1][s / 3], 0), v * 0.6, 'a', musicOut, sd * 2.5);
      }
    },
    canals: {     // dub: one drop, skank on the offbeat, melodica, deep bass
      bpm: 84, beats: 4, sub: 4, swing: 0.1, root: 55, mode: 'dorian', rev: 0.35, dly: 0.5,
      moods: ['dorian', 'mixolydian', 'aeolian'], nightTempo: 0.08, nightGain: 1,
      prog: [[0, 3], [0, 3], [3, 3], [4, 3]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (!st.bass || c.newPhrase) { st.bass = [[0, 0, 3], [3, 0, 1], [6, 4, 2], [10, 2, 2], [12, 3, 2], [14, 4, 2]].filter(() => r() < 0.85); st.mel = motif(r, 16, 5, 3, 0.3); }
        if (s === 8) { I.kick(t, v * 0.9, musicOut, 110, 45, 0.4); I.rim(t, v * 0.8); }
        if (s % 2 === 0) I.hat(t, v * (s % 4 === 2 ? 0.35 : 0.2));
        if (s === 14 && r() < 0.4) I.hat(t, v * 0.4, true);
        if (s === 4 || s === 12) I.skank(t, chord(3, 0), v);
        for (const [ss, d, l] of st.bass) if (ss === s) I.sub(t, deg(d, -2), l * sd * 0.95, v * 0.95);
        if ((e > 0.45 || c.listen > 0.5) && bar % 4 >= 2) for (const [ss, d, l] of st.mel) if (ss === s) I.melodica(t, deg(d, 0), l * sd, v * 0.8);
        if (r() < 0.02) I.metal(t, deg(4, 1), v * 0.3, musicOut, 0.8);   // a drip from the bridge
      }
    },
    oldtown: {    // a waltz: accordion oom-pah-pah, glockenspiel tune, pizzicato bass
      bpm: 96, beats: 3, sub: 2, swing: 0, root: 60, mode: 'major', rev: 0.3, dly: 0.12,
      moods: ['major', 'lydian', 'mixolydian', 'major'], nightTempo: 0.1, nightGain: 0.85,
      prog: [[0, 3], [3, 3], [4, 3], [0, 3], [5, 3], [1, 3], [4, 3], [0, 3]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (!st.tune || c.newPhrase) { st.tune = motif(r, 6, 4, 3, 0.15); st.tune2 = shift(st.tune, 2); }
        if (s === 0) I.upright(t, deg(bar % 2 ? 4 : 0, -2), sd * 1.8, v * 0.9);
        if (s === 2 || s === 4) I.accordion(t, chord(3, 0), sd * 1.4, v);
        if (s === 0) I.brush(t, v * 0.4, musicOut, true); if (s === 3 && e > 0.4) I.brush(t, v * 0.3);
        if (e > 0.3 || c.listen > 0.5) for (const [ss, d, l] of (bar % 2 ? st.tune2 : st.tune)) if (ss === s) I.glock(t, nearest(deg(d, 0), chord(3, 0).concat(chord(3, 1))), v * 0.8);
        if (e > 0.65 && s === 0 && bar % 4 === 0) I.accordion(t, [deg(4, 1)], sd * 5.5, v * 0.7);
      }
    },
    docks: {      // techno: four on the floor, metal on a 7-step loop over 16 (polymeter), acid line
      bpm: 128, beats: 4, sub: 4, swing: 0.02, root: 52, mode: 'phrygian', rev: 0.2, dly: 0.3,
      moods: ['phrygian', 'aeolian', 'dorian'], nightTempo: -0.02, nightGain: 1.35, nightDark: false,
      prog: [[0, 3], [0, 3], [1, 3], [0, 3]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar, idx } = c;
        if (!st.acid || c.newPhrase) { st.acid = []; for (let i = 0; i < 16; i++) st.acid.push(r() < 0.55 ? [Math.floor(r() * 5) - (r() < 0.3 ? 7 : 0), r() < 0.25] : null); st.mlen = 5 + Math.floor(r() * 3) * 2; st.metal = euclid(3, st.mlen, Math.floor(r() * st.mlen)); }
        if (s % 4 === 0) I.kick(t, v * (bar % 8 === 7 && s === 12 ? 0.6 : 1));
        if (s % 4 === 2) I.hat(t, v * 0.55, true);
        if ((s === 4 || s === 12) && e > 0.3) I.clap(t, v * 0.5);
        if (st.metal[idx % st.mlen]) I.clank(t, v * 0.5);
        if (e > 0.4) { const a = st.acid[s]; if (a) I.acid(t, deg(a[0], -1), sd * 0.9, v * 0.9, a[1]); }
        if (s % 2 === 1 && e > 0.7) I.hat(t, v * 0.25);
        if (bar % 16 === 15 && s === 0) I.metal(t, deg(0, 0), v * 0.5, musicOut, 2.2);
        if (c.night > 0.4 && s % 4 === 2) I.sub(t, deg(0, -2), sd * 1.5, v * 0.7 * c.night);       // night: the club opens
        if (c.night > 0.6 && s % 8 === 4 && bar % 2 === 1) I.pad(t, chord(3, 0), sd * 3, v * 0.6, musicOut, 2.5);
      }
    },
    lake: {       // slow ambient dub: soft kick, rigging pings, long pads, waves
      bpm: 70, beats: 4, sub: 4, swing: 0.05, root: 53, mode: 'lydian', rev: 0.6, dly: 0.45,
      moods: ['lydian', 'major', 'mixolydian'], nightTempo: 0.08, nightGain: 1,
      prog: [[0, 7], [0, 7], [4, 7], [1, 7]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (!st.ping || c.newPhrase) { st.ping = euclid(r() < 0.5 ? 3 : 5, 16, Math.floor(r() * 16)); }
        if (s === 0 || (s === 10 && e > 0.5)) I.softKick(t, v * 0.8);
        if (s === 8 && e > 0.35) I.rim(t, v * 0.45);
        if (s === 0 && bar % 2 === 0) I.pad(t, chord(4, 0), sd * 30, v * 0.9, musicOut, 0.9);
        if (s === 0) I.sub(t, deg(0, -2), sd * 10, v * 0.6);
        if (st.ping[s] && r() < 0.6) I.steelpan(t, deg([0, 1, 2, 4, 5][Math.floor(r() * 5)] + (r() < 0.3 ? 7 : 0), 1), v * 0.55);
        if (s === 0 && bar % 2 === 1) I.waves(t, sd * 28, v);
      }
    },
    obs: {        // no drums: drones, stars, voices
      bpm: 60, beats: 4, sub: 4, swing: 0, root: 65, mode: 'lydian', rev: 0.85, dly: 0.5,
      moods: ['lydian', 'major', 'dorian'], nightTempo: 0.05, nightGain: 1.1,
      prog: [[0, 7], [1, 7], [0, 7], [4, 7]],
      play(c) {
        const { s, t, sd, v, r, st, e, bar } = c;
        if (s === 0 && bar % 2 === 0) { I.drone(t, deg(0, -1), sd * 32, v * 0.9); I.choir(t, chord(3, 0), sd * 30, v * 0.6); }
        if (r() < 0.07 + e * 0.05) I.bell(t + r() * sd, deg(Math.floor(r() * 9), 1), v * (0.25 + r() * 0.35), musicOut, 3.2);
        if (r() < 0.03) I.musicbox(t, deg(Math.floor(r() * 7), 2), v * 0.3);
      }
    },
  };
  for (const k in REC) { REC[k].key = k; REC[k].st = {}; REC[k].r = U.rng(k.length * 977 + 13); REC[k].e = 0.5; REC[k].f = 1; REC[k].w = 0; }

  // ---------- hidden spots: local changes to the music ----------
  const SPOTS = {
    glasshouse: (c, w) => { if (c.ds === 0 && c.dsub % 2 === 0) I.musicbox(c.t, deg([0, 2, 4, 7, 4, 2][Math.floor(c.idx / 2) % 6], 2), w * 0.9); },
    belltower: (c, w) => { if (c.ds % 2 === 0) I.bell(c.t, deg([7, 6, 4, 2, 0, 4][(c.dbar * 4 + c.ds / 2) % 6], 0), w * 0.7, musicOut, 2.6); },
    rooftop: (c, w) => { const st = SPOTS.st; if (!st.solo || c.newPhrase) st.solo = motif(U.rng(c.dbar + 7), 8, 5, 3, 0.2); for (const [ss, d, l] of st.solo) if (ss === c.ds * 2) I.trumpet(c.t, nearest(deg(d, 1), chord(4, 1)), l * c.dsd * 0.5, w, musicOut, false); },
    cellar: (c, w) => { if (Math.random() < 0.5) I.crackle(c.t, w); if (c.ds === 0 || c.ds === 2) I.kick(c.t, w * 0.8, musicOut, 100, 45, 0.3); if (c.ds === 1 || c.ds === 3) I.snare(c.t, w * 0.5); if (c.ds === 0 && c.dbar % 2 === 0) I.vox(c.t, deg(4, 0), w * 0.5, 'o', musicOut, 0.6); },
    arch: () => {},
    watertower: (c, w) => { if (c.ds === 0 && c.dbar % 2 === 0) I.drone(c.t, deg(0, -2), c.dsd * 8, w); if (c.ds % 2 === 1 && Math.random() < 0.5) I.metal(c.t, deg(Math.floor(Math.random() * 5), 0), w * 0.5, musicOut, 1.8); },
    lighthouse: (c, w) => { if (c.ds === 0 && c.dbar % 4 === 0) I.foghorn(c.t, w); },
    // the bandstand: a little brass band (tuba on the strong beats, horns on the weak, a tune on top)
    bandstand: (c, w) => {
      const st = SPOTS.st, b = c.ds;
      if (!st.band || c.newPhrase) st.band = motif(U.rng(c.dbar + 99), 16, 6, 2, 0.2);
      if (b === 0 && c.idx % 8 === 0) I.sub(c.t, chord(1, -2)[0], c.dsd * 3, w * 0.9);
      if (b === 0 && c.idx % 8 === 4) I.sub(c.t, deg(H.deg + 4, -2), c.dsd * 3, w * 0.8);
      if (b === 2) I.trumpet(c.t, chord(3, 0)[1], c.dsd * 1.4, w * 0.4, musicOut, false);
      for (const [ss, d, l] of st.band) if (ss === c.idx % 16) I.trumpet(c.t, nearest(deg(d, 1), chord(4, 1)), l * c.dsd * 0.9, w * 0.7, musicOut, false);
      if (b === 0 && c.idx % 16 === 12) I.snare(c.t, w * 0.3);
    },
    // frogs in the reeds: little croaks on the offbeats, a chorus at night
    frogs: (c, w) => { if (c.ds % 2 === 1 && Math.random() < 0.2 + R.night * 0.45) I.croak(c.t, deg([0, 4, 2][c.idx % 3], -1), w * (0.5 + R.night * 0.5)); },
    // the carousel's fairground organ: oom-pah-pah and a glockenspiel tune
    carousel: (c, w) => {
      const st = SPOTS.st; if (!st.organ || c.newPhrase) st.organ = motif(U.rng(c.dbar + 7), 12, 6, 2, 0.15);
      const b = Math.floor(c.idx / 4), beat3 = b % 3;
      if (c.ds === 0) { if (beat3 === 0) I.sub(c.t, chord(1, -2)[0], c.dsd * 3, w * 0.8); else I.accordion(c.t, chord(3, 0), c.dsd * 2, w * 0.8); }
      if (c.ds % 2 === 0) for (const [ss, d] of st.organ) if (ss === (c.idx / 2) % 12) I.glock(c.t, nearest(deg(d, 1), chord(3, 1)), w * 0.7);
    },
    // riding the wheel: a music box; the cable car: a pad that brightens and climbs with height
    ferrisride: (c, w) => { if (c.ds % 2 === 0) { const ct = chord(4, 2); I.musicbox(c.t, ct[(c.idx / 2) % 4] + (Math.floor(c.idx / 8) % 2 ? 0 : -12), w * 0.6); } },
    gondolaride: (c, w) => {
      const alt = U.clamp((R.alt || 0) / 40, 0, 1);
      if (c.ds === 0 && c.idx % 16 === 0) I.pad(c.t, chord(3, alt > 0.5 ? 1 : 0), c.dsd * 16, w * 1.2, musicOut, 0.8 + alt * 2);
      if (c.ds === 2 && Math.random() < 0.3 + alt * 0.4) I.bell(c.t, deg(Math.floor(Math.random() * 7), 1 + Math.round(alt)), w * 0.25, musicOut, 2.5);
    },
    // the radio dishes: another district's music comes in, with static
    radio: (c, w) => { I.crackle(c.t, w * 1.2); if (Math.random() < 0.3) I.crackle(c.t + c.dsd / 2, w); },
    // buskers: a tune on their instrument, livelier when you sit and listen
    busk_trumpet: (c, w) => busk(c, w, 'trumpet'), busk_oud: (c, w) => busk(c, w, 'oud'), busk_accordion: (c, w) => busk(c, w, 'accordion'),
    busk_pan: (c, w) => busk(c, w, 'pan'), busk_flute: (c, w) => busk(c, w, 'flute'), busk_sax: (c, w) => busk(c, w, 'sax'),
    st: {}
  };

  function busk(c, w, inst) {
    const st = SPOTS.st, key = 'b_' + inst;
    if (!st[key] || c.newPhrase || (c.ds === 0 && c.dbar % 4 === 0 && !st[key + 'b'])) { st[key] = motif(U.rng(c.dbar * 31 + inst.length), 16, 6 + R.listen * 4, 3, 0.3 - R.listen * 0.15); st[key + 'b'] = true; }
    if (c.ds === 3) st[key + 'b'] = false;
    const pos = (c.idx % 16);
    for (const [ss, d, l] of st[key]) if (ss === pos) {
      const m = nearest(deg(d, inst === 'flute' || inst === 'pan' ? 1 : 0), chord(4, 0).concat(chord(4, 1))), dur = Math.min(4, l) * c.dsd;
      if (inst === 'trumpet') I.trumpet(c.t, m + 12, dur, w * 0.9, musicOut, false);
      else if (inst === 'sax') I.trumpet(c.t, m, dur, w, musicOut, true);
      else if (inst === 'oud') I.pluck(c.t, m, w);
      else if (inst === 'accordion') I.accordion(c.t, [m, m + 4], dur, w * 0.9);
      else if (inst === 'pan') I.steelpan(c.t, m, w);
      else if (inst === 'flute') I.flute(c.t, m, dur, w);
    }
  }

  // ---------- how your moves sound, district by district ----------
  // lead: the voice of grinds and runs · perc: texture under a grind · land · trick · push · bass
  const KIT = {
    business: {
      lead: (t, m, v) => I.vibes(t, m, v * 0.8, musicOut, 0.6),
      perc: (t, v, i) => i % 2 === 0 ? I.ride(t, v * 0.8) : I.brush(t, v * 0.6),
      land: (t, v) => { I.ep(t, chord(4, 0), 0.4, v * 1.1); I.kick(t, v * 0.4, musicOut, 110, 48, 0.22); },
      trick: (t, sd, v, n) => { const ct = chord(4, 1); for (let i = 0; i < 2 + Math.min(n, 4); i++) I.vibes(t + i * sd, ct[i % 4] + 12 * Math.floor(i / 4), v * 0.6, musicOut, 0.5); I.trumpet(t + sd * 3, ct[0], sd * 2, v * 0.55); },
      push: (t, v) => I.rim(t, v * 0.6),
      bass: (t, m, d, v) => I.upright(t, m, d, v),
    },
    park: {
      lead: (t, m, v) => I.marimba(t, m, v * 1.1),
      perc: (t, v) => I.shaker(t, v * 1.2),
      land: (t, v) => { I.frame(t, v * 0.8); I.kalimba(t, chord(1, 0)[0], v * 0.6); },
      trick: (t, sd, v, n) => { const ct = chord(4, 1); for (let i = 0; i < 2 + Math.min(n, 3); i++) I.flute(t + i * sd * 0.5, ct[i % 4] + 12, sd * 0.45, v * 0.55); },
      push: (t, v) => I.woodblock(t, deg(3, 1), v * 0.5),
      bass: (t, m, d, v) => I.sub(t, m, d, v * 0.8),
    },
    market: {
      lead: (t, m, v) => I.pluck(t, m, v, musicOut, 1.15),
      perc: (t, v, i) => i % 2 ? I.tek(t, v * 0.8) : I.shaker(t, v),
      land: (t, v) => { I.doum(t, v * 0.9); I.pluck(t, chord(1, 0)[0], v * 0.6); },
      trick: (t, sd, v, n) => { for (let i = 0; i < 3 + Math.min(n, 3); i++) I.pluck(t + i * sd * 0.66, deg(4 - i, 1), v * 0.6); if (n > 1) I.vox(t, deg(4, 0), v * 0.35, 'a', musicOut, sd * 2); },
      push: (t, v) => I.tek(t, v * 0.6),
      bass: (t, m, d, v) => I.sub(t, m, d, v * 0.8),
    },
    canals: {
      lead: (t, m, v, dur) => I.melodica(t, m, Math.min(0.7, (dur || 0.2) * 0.95), v * 0.9),
      perc: (t, v, i) => i % 2 ? I.skank(t, chord(3, 0), v * 0.8) : I.hat(t, v * 0.5),
      land: (t, v) => { I.kick(t, v * 0.6, musicOut, 110, 45, 0.4); I.rim(t, v * 0.7); },
      trick: (t, sd, v, n) => { I.skank(t, chord(3, 0), v); I.metal(t + sd * 2, deg(4, 1), v * 0.4, musicOut, 0.8); if (n > 1) I.melodica(t + sd, deg(7, 0), sd * 3, v * 0.6); },
      push: (t, v) => I.rim(t, v * 0.5),
      bass: (t, m, d, v) => I.sub(t, m, d, v),
    },
    oldtown: {
      lead: (t, m, v) => I.glock(t, m - 12, v * 0.9),
      perc: (t, v) => I.brush(t, v * 0.7),
      land: (t, v) => { I.accordion(t, chord(3, 0), 0.35, v * 1.1); I.upright(t, deg(0, -2), 0.4, v * 0.7); },
      trick: (t, sd, v, n) => { const ct = chord(3, 1); for (let i = 0; i < 3 + Math.min(n, 3); i++) I.glock(t + i * sd * 0.5, ct[i % 3] + 12 * Math.floor(i / 3) - 12, v * 0.6); },
      push: (t, v) => I.brush(t, v * 0.5),
      bass: (t, m, d, v) => I.upright(t, m, d, v),
    },
    docks: {
      lead: (t, m, v, dur) => I.acid(t, m - 12, Math.min(0.3, (dur || 0.12) * 0.9), v * 0.8, Math.random() < 0.3),
      perc: (t, v, i) => I.hat(t, v * 0.7, i % 4 === 2),
      land: (t, v) => { I.kick(t, v * 0.7); I.clap(t, v * 0.4); },
      trick: (t, sd, v, n) => { for (let i = 0; i < 2 + Math.min(n, 4); i++) I.metal(t + i * sd * 0.5, deg(i * 2, 0), v * 0.35, musicOut, 0.3); },
      push: (t, v) => I.hat(t, v * 0.5),
      bass: (t, m, d, v) => I.acid(t, m, d * 0.5, v * 0.6, true),
    },
    lake: {
      lead: (t, m, v) => I.steelpan(t, m, v * 0.85),
      perc: (t, v) => I.shaker(t, v * 0.8),
      land: (t, v) => { I.softKick(t, v * 0.7); I.steelpan(t, chord(1, 0)[0], v * 0.5); },
      trick: (t, sd, v, n) => { const ct = chord(4, 1); for (let i = 0; i < 3 + Math.min(n, 3); i++) I.steelpan(t + i * sd * 0.5, ct[i % 4], v * 0.55); },
      push: (t, v) => I.rim(t, v * 0.35),
      bass: (t, m, d, v) => I.sub(t, m, d, v * 0.7),
    },
    obs: {
      lead: (t, m, v) => I.bell(t, m, v * 0.7, musicOut, 1.4),
      perc: (t, v) => { if (Math.random() < 0.5) I.crackle(t, v * 2); },
      land: (t, v) => I.bell(t, deg(0, -1), v * 0.8, musicOut, 2.5),
      trick: (t, sd, v, n) => { const ct = chord(4, 1); for (let i = 0; i < 3 + Math.min(n, 3); i++) I.musicbox(t + i * sd * 0.5, ct[i % 4] + 12, v * 0.6); },
      push: () => {},
      bass: (t, m, d, v) => I.drone(t, m, d, v * 0.5),
    },
  };
  // the kits of the places you're in, by weight (two at most, at a border)
  function kits() {
    const out = []; let tw = 0;
    for (const k in REC) { const w = REC[k].w; if (w > 0.22 && KIT[k]) { out.push([KIT[k], w]); tw += w; } }
    if (!out.length) return [[KIT[dom.key] || KIT.park, 1]];
    out.sort((a, b) => b[1] - a[1]); out.length = Math.min(2, out.length);
    tw = out.reduce((a, o) => a + o[1], 0);
    return out.map(([k, w]) => [k, w / tw]);
  }
  const withKits = (fn) => { for (const [k, w] of kits()) fn(k, w); };

  // ---------- grinding: every rail plays its own little tune, which grows the longer you hold it ----------
  const G = { on: false, n: 0, motif: [0], voice: 'rail', h: 0, end: false };
  function grindBegin(info) {
    G.on = true; G.end = false; G.n = 0; G.voice = info.voice || 'rail'; G.h = info.h || 0;
    const r = U.rng(info.seed | 0); let d = Math.floor(r() * 3) * 2; G.motif = [];
    for (let i = 0; i < 8; i++) { G.motif.push(d); d = U.clamp(d + [-1, 1, 2, -2, 1, -1, 3, 0, 4][Math.floor(r() * 9)], -2, 9); }
  }
  function grindFinish() { if (G.on) G.end = true; G.on = false; }
  function grindStep(c) {
    if (G.end) {       // the rail ends: a resolving note
      G.end = false;
      if (G.n > 3) withKits((k, w) => { k.lead(c.t, nearest(deg(7, Math.min(1, Math.floor(G.h / 4))), chord(3, 0)), 0.7 * w, c.dsd * 4); });
      return;
    }
    if (!G.on || !R.grinding) return;
    const n = G.n++, sp = R.speed, vc = G.voice, bars = n / (4 * dom.beats);
    G.h = R.grindH ?? G.h;
    // the groove under it
    if (vc === 'metro') { if (c.ds % 2 === 0) I.clack(c.t, c.ds === 0 ? 0.36 : 0.22); if (c.ds === 0 && c.di % 8 === 0) I.sub(c.t, deg(0, -2), c.dsd * 7, 0.4); }
    else if (vc === 'cable') { if (n % 32 === 0) I.waves(c.t, c.dsd * 30, 0.45); }
    else if (c.ds % 2 === 0) withKits((k, w) => k.perc && k.perc(c.t, (0.3 + Math.min(0.35, sp / 40)) * w, n >> 1));
    // how often a note: by speed (and some rails have their own pace)
    const rate = vc === 'cable' ? 8 : vc === 'balcony' ? 1 : sp < 5 ? 4 : sp < 10 ? 2 : 1;
    if (n % rate !== 0) return;
    const j = n / rate, dev = Math.floor(j / 16);
    const d = G.motif[j % 8] + [0, 2, 4, 1, 3][dev % 5];
    const oct = U.clamp(Math.floor(G.h / 4), 0, 2);
    let m = deg(d, oct);
    if (c.ds === 0) m = nearest(m, chord(4, oct));
    m = fold(m);                                   // high rails climb, but never into a whistle
    const v = U.clamp(0.35 + sp / 30, 0.35, 0.8), dur = c.dsd * rate;
    if (vc === 'cable') { I.pad(c.t, [m - 12, nearest(deg(d + 2, oct - 1), chord(4, oct - 1))], dur * 1.1, 1.4, musicOut, 1 + G.h / 30); I.bell(c.t, m + 12, 0.18, musicOut, 2); return; }
    if (vc === 'balcony') { I.musicbox(c.t, m + 12, v * 0.7); return; }
    if (vc === 'pipe') I.metal(c.t, m, v * 0.4, musicOut, 0.35);
    withKits((k, w) => k.lead(c.t, m, v * w, dur));
    // after four bars a second voice joins a third above; after two, a bass line
    if (bars >= 4) withKits((k, w) => k.lead(c.t, fold(nearest(deg(d + 2, oct), chord(4, oct))), v * 0.4 * w, dur));
    if (bars >= 2 && c.ds === 0 && c.di % 8 === 0) withKits((k, w) => k.bass && k.bass(c.t, chord(1, -2)[0], c.dsd * 7, 0.6 * w));
  }
  // a run of tricks and grinds without touching the ground: an extra groove that fades when you stop
  let comboL = 0;
  function comboStep(c) {
    if (comboL < 0.08) return;
    if (comboL > 0.3) withKits((k, w) => k.perc && k.perc(c.t, comboL * 0.35 * w * (c.ds === 0 ? 1.3 : 0.8), c.di));
    if (c.ds === 0 && c.di % 4 === 0) withKits((k, w) => k.bass && k.bass(c.t, chord(1, -2)[0], c.dsd * 3, comboL * 0.5 * w));
  }
  // dawn: birds; night: a soft bed under the places that don't have one
  function birdsong(c) {
    const dawn = R.dawn || 0, wild = (REC.park.w + REC.lake.w + REC.obs.w + REC.oldtown.w * 0.5);
    if (dawn > 0.05 && Math.random() < 0.09 * dawn * (0.3 + wild)) I.bird(c.t + Math.random() * c.dsd, 0.5 * dawn * (0.4 + wild));
    // an owl in the woods at night
    if (R.night > 0.6 && c.ds === 0 && REC.park.w + REC.obs.w > 0.3 && Math.random() < 0.012) { const m = nearest(67, chord(3, 0)), below = ((m - 1 - H.root) % 12 + 12) % 12; I.hoot(c.t, 0.7 * (REC.park.w + REC.obs.w), musicOut, m, m - (H.mode.includes(below) ? 1 : 2)); }
  }

  // a busker answers your trick: two beats later, your figure back to you, upside down
  function buskAnswer(sd) {
    let best = null, bw = 0.3; for (const k in R.spots) if (k.startsWith('busk_') && R.spots[k] > bw) { bw = R.spots[k]; best = k.slice(5); }
    if (!best) return;
    const ct = chord(4, best === 'flute' || best === 'pan' ? 1 : 0), t0 = sd * 8;
    return (t) => { for (let i = 0; i < 4; i++) { const m = ct[3 - i] + 12, tt = t + t0 + i * sd * 1.5, dur = sd * 1.4;
      if (best === 'trumpet' || best === 'sax') I.trumpet(tt, best === 'sax' ? m - 12 : m, dur, bw, musicOut, best === 'sax');
      else if (best === 'oud') I.pluck(tt, m - 12, bw); else if (best === 'accordion') I.accordion(tt, [m - 12], dur, bw); else if (best === 'pan') I.steelpan(tt, m, bw); else I.flute(tt, m, dur, bw); } };
  }
  // ---------- moods: each place drifts between a few modes; some corners have their own; night darkens ----------
  const ZONES = {
    pond: { key: 'park', mode: 'lydian' }, deepwood: { key: 'park', mode: 'phrygian' }, plaza: { key: 'business', mode: 'mixolydian' },
    square: { key: 'oldtown', mode: 'lydian' }, cellar: { key: 'market', mode: 'harmonic' }, pier: { key: 'lake', mode: 'major' }, yard: { key: 'docks', mode: 'aeolian' },
  };
  function moodOf(rc) {
    const z = R.zone && ZONES[R.zone];
    let m = z && z.key === rc.key ? z.mode : rc.moods ? rc.moods[(rc.moodI || 0) % rc.moods.length] : rc.mode;
    if (R.night > 0.6 && rc.nightDark !== false) { const i = DARK.indexOf(m); if (i >= 0 && i < DARK.length - 1) m = DARK[i + 1]; }
    return m;
  }
  // ---------- the clock ----------
  let dom = REC.obs, harmonyBar = -1, energyT = 0;
  function tickDur() { return 60 / clk.bpm / TPB; }
  function chooseF(rec, ref) {        // play this recipe at its tempo, or twice as fast in "half-time", whichever is nearer
    const a = Math.abs(Math.log(rec.bpm / ref)), b = Math.abs(Math.log(rec.bpm * 2 / ref));
    return (b < a && rec.bpm * 2 <= 170) ? 2 : 1;
  }
  function schedule() {
    if (!clk.playing || !ctx) return;
    const ahead = ctx.currentTime + 0.12;
    if (clk.paused) {
      if (clk.resumeAt !== null && clk.resumeAt <= ahead) { clk.paused = false; clk.next = clk.resumeAt; clk.resumeAt = null; }
      else return;
    }
    while (clk.next < ahead) {
      // tempo glides a little every tick
      clk.bpm += (clk.target - clk.bpm) * (1 - Math.exp(-tickDur() / 11));   // tempo eases over ~11 s
      const td = tickDur();
      tick(clk.tick, clk.next, td);
      clk.beatT.push([clk.next, clk.tick]); if (clk.beatT.length > 64) clk.beatT.shift();
      clk.tick++; clk.next += td;
    }
    // mix: reverb, delay, lo-fi and underwater from the place you're in
    const now = ctx.currentTime;
    let rev = 0, dl = 0, tw = 0; for (const k in REC) { const w = REC[k].w; rev += REC[k].rev * w; dl += REC[k].dly * w; tw += w; }
    if (tw > 0) { rev /= tw; dl /= tw; }
    const sp = R.spots;
    rev = Math.min(1, rev + (sp.arch || 0) * 0.6 + (sp.glasshouse || 0) * 0.3 + R.night * 0.12 + R.under * 0.25);
    revIn.gain.setTargetAtTime(rev * 0.7, now, 0.5);
    dlyIn.gain.setTargetAtTime(dl * 0.6 + (sp.arch || 0) * 0.6, now, 0.5);
    dlyFb.gain.setTargetAtTime(0.32 + (sp.arch || 0) * 0.42 + (sp.lighthouse || 0) * 0.2, now, 0.5);
    const spbDom = 60 / clk.bpm * dom.f;
    dly.delayTime.setTargetAtTime(Math.min(2.5, spbDom * ((sp.arch || 0) > 0.3 ? 1.5 : 0.75)), now, 0.4);
    crushMix.gain.setTargetAtTime((sp.cellar || 0) * 0.55, now, 0.3); cleanMix.gain.setTargetAtTime(1 - (sp.cellar || 0) * 0.45, now, 0.3);
    const lpf = R.water > 0 ? 380 : 18000 * Math.pow(0.1, (sp.cellar || 0) * 0.9) * (1 - R.under * 0.4);
    mlp.frequency.setTargetAtTime(lpf, now, R.water > 0 ? 0.05 : 0.3);
  }
  function tick(T, t, td) {
    // harmony and the dominant recipe's bar
    const domStep = TPB * dom.f / dom.sub, barTicks = domStep * dom.beats * dom.sub;
    if (T % barTicks === 0) {
      const bar = Math.floor(T / barTicks);
      // a mood change every 16 bars; switch scale when a new place has taken over, or the mood/zone/night asks
      if (bar % 16 === 0 && bar > 0) dom.moodI = (dom.moodI || 0) + 1;
      let newKey = false; if (H.next) { H.root = H.next.root; H.next = null; newKey = true; }
      const want = moodOf(dom);
      // (a new key brings its own mode with it on the same bar, never a bar of the old mode on the new root)
      if (want !== H.modeName && (bar % 2 === 0 || R.zone || newKey)) { H.modeName = want; H.mode = MODES[want]; }
      const p = dom.prog[bar % dom.prog.length]; H.deg = p[0] + (H.bell > 0 ? 3 : 0);
      H.nextDeg = dom.prog[(bar + 1) % dom.prog.length][0];
      harmonyBar = bar;
      if (H.bell > 0) H.bell--;
      // energy wanders on 8-bar phrases
      if (bar % 8 === 0) for (const k in REC) { const rc = REC[k]; rc.e = U.clamp(rc.e + (rc.r() - 0.5) * 0.5 + (0.6 - rc.e) * 0.2, 0.15, 1); }
    }
    // each audible recipe plays its own steps (its own meter: polymeter in the overlaps)
    const total = Object.values(REC).reduce((a, rc) => a + rc.w, 0) || 1;
    for (const k in REC) {
      const rc = REC[k]; if (rc.w < 0.02) continue;
      const stepT = TPB * rc.f / rc.sub; if (T % stepT !== 0) continue;
      const idx = T / stepT, per = rc.beats * rc.sub, s = idx % per, bar = Math.floor(idx / per);
      let tt = t; if (rc.swing && rc.sub === 4 && s % 2 === 1) tt += rc.swing * stepT * td;
      const night = R.night, listenBoost = 1 + R.listen * 0.15;
      const ng = U.lerp(1, rc.nightGain ?? 1, night), ne = rc.key === 'docks' ? night * 0.35 : -night * 0.3;
      const c = { s, bar, idx, t: tt, sd: stepT * td, v: Math.pow(rc.w / total, 0.8) * listenBoost * ng, r: rc.r, st: rc.st, e: U.clamp(rc.e * (1 + ne) + R.listen * 0.25 + Math.min(0.2, R.speed / 80), 0, 1), night, newPhrase: s === 0 && bar % 8 === 0, listen: R.listen, nextDeg: H.nextDeg, crowd: R.crowd || 0 };
      try { rc.play(c); } catch (e) { console.warn(k, e); }
    }
    // the dominant grid: player layers, spots, train
    const dstep = TPB * dom.f / 4;
    if (T % dstep === 0) {
      const di = T / dstep, ds = di % 4, dbar = Math.floor(di / (4 * dom.beats));
      const c = { t, ds, dsub: di, idx: di, dbar, dsd: dstep * td, newPhrase: di % (dom.beats * 32) === 0 };
      for (const k in R.spots) { const w = R.spots[k]; if (w > 0.03 && SPOTS[k]) SPOTS[k](c, w); }
      if (R.train > 0.5 && ds % 2 === 0) I.clack(t, (ds === 0 ? 0.5 : 0.3) * R.train);
      const gc = { t, ds, di, dsd: dstep * td };
      grindStep(gc); comboStep(gc); birdsong(gc);
      // night: a soft pad under the places that have no bed of their own
      if (ds === 0 && di % (4 * dom.beats * 2) === 0 && R.night > 0.3 && !['lake', 'obs', 'park'].includes(dom.key)) I.pad(t, chord(3, 0), dstep * td * 4 * dom.beats * 2, R.night * 0.5, musicOut, 0.7);
      // quantized one-shots from the world (lamps, bollards, landings…)
      while (queue.length) { const q = queue.shift(); try { q(t, dstep * td); } catch (e) {} }
    }
  }
  const queue = [];
  // play something on the next grid step (so whatever you touch is in time)
  function quant(fn) { if (ctx && clk.playing && !clk.paused) queue.push(fn); }

  function start() {
    if (!ctx || clk.playing) return;
    clk.playing = true; clk.next = ctx.currentTime + 0.1; clk.start = clk.next; clk.tick = 0;
    H.root = dom.root; H.modeName = moodOf(dom); H.mode = MODES[H.modeName]; clk.bpm = clk.target = dom.bpm * dom.f;
    if (!clk.timer) clk.timer = setInterval(schedule, 25);
  }
  // where you are: district weights (sum 1) → recipe weights, dominant, tempo target, key
  function setPlace(weights, dt = 1 / 60) {
    let best = null, bw = -1;
    for (const k in REC) { const w = weights[k] || 0; REC[k].wt = w; if (w > bw) { bw = w; best = REC[k]; } }
    // hysteresis on who leads
    if (best !== dom && bw > (dom.wt || 0) + 0.18) {
      dom = best;
      H.next = { root: dom.root };
    }
    // fades: weights glide (so a sudden teleport still crossfades)
    for (const k in REC) {
      const rc = REC[k], target = rc.wt || 0;
      if (rc.w < 0.02 && target >= 0.02) rc.f = chooseF(rc, clk.bpm);          // pick its octave when it comes in
      rc.w += (target - rc.w) * (1 - Math.exp(-dt / 1.6));     // about a 1.6 s crossfade
    }
    // night: everything leans slower; the leader sets the tempo
    clk.target = dom.bpm * dom.f * (1 - R.night * (dom.nightTempo ?? 0.08));
  }

  // ---------- knocks: the record scratches, stops, and starts again ----------
  function knock() {
    if (!ctx || clk.paused) return;
    const t = ctx.currentTime, T = 0.75, n = 40, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const tt = i / (n - 1) * T; curve[i] = tt * tt / (2 * T); }
    tape.delayTime.cancelScheduledValues(t); tape.delayTime.setValueAtTime(0, t); tape.delayTime.setValueCurveAtTime(curve, t, T);
    gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(1, t); gate.gain.setValueAtTime(1, t + T * 0.7); gate.gain.linearRampToValueAtTime(0, t + T);
    clk.paused = true; clk.resumeAt = null; queue.length = 0;
    sfx.scratch(1); setTimeout(() => sfx.scratch(-1), 160);
  }
  function knocked() { return clk.paused; }
  // start again on a fresh bar, with a quick spin-up
  function resume() {
    if (!ctx || !clk.paused || clk.resumeAt !== null) return;
    const t = ctx.currentTime + 0.08;
    tape.delayTime.cancelScheduledValues(t - 0.05); tape.delayTime.setValueAtTime(0.18, t); tape.delayTime.linearRampToValueAtTime(0, t + 0.28);
    gate.gain.cancelScheduledValues(t - 0.05); gate.gain.setValueAtTime(0, t); gate.gain.linearRampToValueAtTime(1, t + 0.12);
    const barTicks = TPB * dom.f / dom.sub * dom.beats * dom.sub;
    clk.tick = Math.ceil(clk.tick / barTicks) * barTicks;
    clk.resumeAt = t;
  }

  // ---------- timing for the game (beats of the place you're in) ----------
  function heardTime(perfMs) {
    if (!ctx) return 0; const p = perfMs ?? performance.now();
    if (ctx.getOutputTimestamp) { const ts = ctx.getOutputTimestamp(); if (ts && ts.performanceTime > 0) return ts.contextTime + (p - ts.performanceTime) / 1000; }
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0.02);
  }
  function beat(perfMs) {
    if (!ctx || !clk.playing || clk.beatT.length < 2) { const tt = (perfMs ?? performance.now()) / 1000, b = tt / 0.9; return { b, phase: b % 1, inBar: Math.floor(b) % 4, bar: Math.floor(b / 4), off: 99, spb: 0.9, playing: false }; }
    const h = heardTime(perfMs);
    let ref = clk.beatT[0]; for (const e of clk.beatT) if (e[0] <= h) ref = e;
    const td = tickDur(), ticks = ref[1] + (h - ref[0]) / td, tpb = TPB * dom.f, b = ticks / tpb;
    const near = Math.round(b), ph = ((b % 1) + 1) % 1;
    return { b, phase: ph, inBar: ((Math.floor(b) % dom.beats) + dom.beats) % dom.beats, bar: Math.floor(b / dom.beats), off: (b - near) * tpb * td, spb: tpb * td, playing: !clk.paused, beats: dom.beats };
  }
  function judge(perfMs) { const bi = beat(perfMs); if (!bi.playing) return 'good'; const a = Math.abs(bi.off); return a < 0.09 ? 'perfect' : a < 0.17 ? 'good' : 'miss'; }

  // ---------- sounds of the world (quantized to the music) ----------
  const T0 = () => ctx.currentTime + 0.005;
  const sfx = {
    scratch(dir = 1) {
      if (!ctx) return; const t = T0(), g = gain(sfxOut, 0);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.01); g.gain.linearRampToValueAtTime(0.08, t + 0.07); g.gain.linearRampToValueAtTime(0.45, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      const f = filt('bandpass', 500, 5, g); f.frequency.setValueAtTime(dir > 0 ? 400 : 2400, t); f.frequency.linearRampToValueAtTime(dir > 0 ? 2600 : 500, t + 0.08); f.frequency.linearRampToValueAtTime(dir > 0 ? 700 : 2000, t + 0.18);
      noise(t, 0.24, f); const o = osc('sawtooth', 160, t, 0.2, gain(g, 0.2)); o.frequency.linearRampToValueAtTime(420, t + 0.08); o.frequency.linearRampToValueAtTime(120, t + 0.18);
    },
    // soft, musical feedback for moves (no "scores")
    jump(onBeat) { if (!ctx) return; const t = T0(), g = gain(sfxOut, 0); env(g, t, 0.01, 0.25, 0.18); const f = filt('bandpass', 700, 1.6, g); f.frequency.exponentialRampToValueAtTime(onBeat ? 2600 : 1600, t + 0.18); noise(t, 0.22, f); },
    land(h = 1) { if (!ctx) return; const t = T0(), g = gain(sfxOut, 0); env(g, t, 0.002, 0.22 * Math.min(1.3, h), 0.1); const o = osc('sine', 110, t, 0.13, g); o.frequency.exponentialRampToValueAtTime(50, t + 0.09); if (h > 0.5) quant((tt) => withKits((k, w) => k.land(tt, 0.5 * Math.min(1.3, h) * w))); },
    trick(n = 0) { quant((t, sd) => { withKits((k, w) => k.trick(t, sd, 0.8 * w, n)); const a = buskAnswer(sd); if (a) a(t); }); },
    // people: brush past someone and they make a little sound of their own, in key
    person(style, i = 0) {
      quant((t, sd) => {
        const ct = chord(4, 1), m = ct[i % 4], v = 1.6;      // loud enough to hear over the band
        const kind = { business: ['phone', 'hey', 'whistle'], market: ['call', 'call', 'hey'], park: ['whistle', 'hum'], canals: ['hum', 'whistle'], oldtown: ['hum', 'whistle', 'laugh'], docks: ['whistle', 'hey'], lake: ['laugh', 'hum', 'whistle'], obs: ['hum'] }[style] || ['hum'];
        switch (kind[i % kind.length]) {
          case 'phone': [0, 2, 1].forEach((k, j) => { const g = gain(musicOut, 0), tt = t + j * sd; env(g, tt, 0.002, 0.1, sd * 0.8); osc('square', midiF(ct[k] + 12), tt, sd, filt('lowpass', 3000, 1, g)); }); break;
          case 'hey': I.vox(t, m - 12, v * 0.6, 'e', musicOut, 0.18); break;
          case 'call': I.vox(t, m, v * 0.6, 'a', musicOut, sd * 2); I.vox(t + sd * 2, ct[(i + 2) % 4] - 12 + 12, v * 0.4, 'o', musicOut, sd * 2); break;
          case 'whistle': I.whistle(t, m + 12, ct[(i + 1) % 4] + 12, sd * 3, v); break;
          case 'hum': I.vox(t, m - 24, v * 0.4, 'u', musicOut, sd * 3); break;
          case 'laugh': for (let j = 0; j < 3; j++) I.vox(t + j * sd * 0.7, m - 12 - j * 2, v * 0.4, 'a', musicOut, sd * 0.5); break;
        }
      });
    },
    // skate through a crowd: a ripple up the scale
    ripple() { quant((t, sd) => withKits((k, w) => { const ct = chord(4, 1); for (let i = 0; i < 6; i++) k.lead(t + i * sd * 0.5, ct[i % 4] + 12 * Math.floor(i / 4), 0.5 * w, sd); })); },
    // a group chatting as you come near: a murmured chord
    murmur() { quant((t, sd) => { const ct = chord(3, -1); ct.forEach((m, j) => I.vox(t + j * sd * 0.3, m, 0.8, ['o', 'u', 'a'][j], musicOut, sd * 5)); }); },
    // a rail within reach: a soft note to say so
    hint() { quant((t) => withKits((k, w) => k.lead(t, chord(3, 1)[2] + 12, 0.5 * w, 0.2))); },
    // a little crowd claps you in, on the beat
    applause(n) { quant((t, sd) => { const k = Math.min(1, n / 6); for (let i = 0; i < 6; i++) I.clap(t + i * sd * 2 + Math.random() * 0.02, (0.5 + k * 0.6) * (1 - i * 0.1)); if (n > 3) I.vox(t, chord(1, 0)[0], 0.25 * k, 'e', musicOut, sd * 3); }); },
    bark() { quant((t, sd) => { I.bark(t, 1.1); if (Math.random() < 0.5) I.bark(t + sd * 2, 0.9); }); },
    grindStart(info) { if (ctx) grindBegin(info); },
    grindEnd() { grindFinish(); },
    push(onBeat) { if (!ctx) return; const t = T0(), g = gain(sfxOut, 0); env(g, t, 0.003, onBeat ? 0.12 : 0.07, 0.16); const f = filt('bandpass', 900, 1.5, g); f.frequency.exponentialRampToValueAtTime(onBeat ? 3000 : 1400, t + 0.15); noise(t, 0.18, f); if (onBeat) quant((tt) => withKits((k, w) => k.push(tt, 0.7 * w))); },
    splash(v = 1) { if (!ctx) return; const t = T0(), g = gain(sfxOut, 0); env(g, t, 0.005, 0.2 * v, 0.3); const f = filt('bandpass', 1400, 0.8, g); f.frequency.exponentialRampToValueAtTime(500, t + 0.3); noise(t, 0.35, f); },
    bubbles() { if (!ctx) return; const t = T0(); for (let i = 0; i < 10; i++) { const tt = t + i * 0.07 + Math.random() * 0.05, g = gain(sfxOut, 0); env(g, tt, 0.002, 0.06, 0.06); const o = osc('sine', 300 + Math.random() * 500, tt, 0.08, g); o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 600, tt + 0.06); } },
    // the world as an instrument
    touch(kind, i = 0) {
      quant((t) => {
        const ct = chord(4, 1), m = ct[i % 4];
        switch (kind) {
          case 'lamp': I.glock(t, m - 12, 0.5); break;
          case 'lantern': I.kalimba(t, m, 0.6); break;
          case 'plank': I.woodblock(t, deg((i % 3) * 2, 1), 0.5); break;
          case 'bollard': I.steelpan(t, m - 12, 0.6); break;
          case 'fountain': I.bell(t, m, 0.3, musicOut, 1.4); break;
          case 'telescope': I.bell(t, m + 12, 0.35); break;
          case 'fence': I.marimba(t, m, 0.5); break;
          case 'bird': I.flute(t, deg(7 + (i % 5), 1), 0.07, 0.4); I.flute(t + 0.08, deg(9 + (i % 5), 1), 0.07, 0.3); break;
          case 'pigeon': I.woodblock(t, fold(deg(4, 2), 90), 0.25); break;
          case 'crate': I.conga(t, 200 + (i % 3) * 60, 0.5); break;
          case 'container': I.metal(t, deg(i % 5, 0), 0.45, musicOut, 0.9); break;
          case 'rigging': I.steelpan(t, deg((i * 2) % 7, 1), 0.4); break;
          case 'chime': [0, 4, 7].forEach((d, k) => I.bell(t + k * 0.32, deg(d, 1), 0.5, musicOut, 1.8)); break;
          case 'bounce': { const ct2 = chord(3, 1), mm = fold(ct2[i % 3] + 12 * Math.min(2, Math.floor(i / 3)), 93); withKits((k, w) => k.lead(t, mm, 0.7 * w, 0.2)); I.kalimba(t + 0.05, ct2[(i + 1) % 3] + 12, 0.2); break; }
          case 'deer': for (let j = 0; j < 6; j++) I.woodblock(t + j * 0.11, deg(j % 3, 0) + 12, 0.3 - j * 0.03); I.flute(t + 0.1, m + 12, 0.25, 0.25); break;
          case 'heron': I.flute(t, m, 0.6, 0.3); I.flute(t + 0.5, m - 5, 0.9, 0.25); for (let j = 0; j < 4; j++) I.brush(t + j * 0.35, 0.4, musicOut, true); break;
          case 'catch': [0, 2, 4, 7].forEach((d, k) => I.steelpan(t + k * 0.12, deg(d, 1), 0.45)); I.vox(t + 0.5, m - 12, 0.3, 'e', musicOut, 0.25); break;
          case 'xylo': I.marimba(t, deg(i, 0), 0.75); I.marimba(t, deg(i, 1), 0.25); break;
          case 'tube': I.bell(t, deg(i, 1), 0.45, musicOut, 2.2); break;
          case 'drum': if (i === 0) I.frame(t, 0.9); else if (i === 1) I.doum(t, 0.9); else if (i === 2) I.conga(t, 220, 0.8); else I.conga(t, 330, 0.7); I.sub(t, deg([0, 4, 7, 9][i % 4], -2), 0.4, 0.4); break;
          case 'puddle': { const g = gain(musicOut, 0); env(g, t, 0.004, 0.12, 0.2); const f = filt('bandpass', 1300, 1, g); f.frequency.exponentialRampToValueAtTime(500, t + 0.2); noise(t, 0.22, f); I.kalimba(t + 0.05, m + 12, 0.35); break; }
          case 'mushroom': [0, 2, 4].forEach((d, k) => I.marimba(t + k * 0.09, deg(d + (i % 4), 1) + 12, 0.35 - k * 0.08)); break;
          case 'flutter': for (let j = 0; j < 8; j++) I.shaker(t + j * 0.045, 1.2 - j * 0.1); break;
          case 'quack': I.quack(t + 0.08, 2.6); if (i % 2) I.quack(t + 0.3, 2); break;
          case 'clink': I.bell(t, m + 24, 0.12, musicOut, 0.6); I.bell(t + 0.07, ct[(i + 1) % 4] + 24, 0.08, musicOut, 0.5); break;
          case 'bin': I.conga(t, 140 + (i % 3) * 30, 0.45); break;
          case 'horn': I.horn(t, [deg(H.deg + 2, -1), deg(H.deg + 4, -1)], 0.7); break;
          case 'dish': I.bell(t, m + 24, 0.35, musicOut, 3.2); I.bell(t + 0.5, ct[(i + 2) % 4] + 12, 0.12, musicOut, 3.2); break;
          case 'ferris': [0, 2, 4, 7].forEach((d, k) => I.kalimba(t + k * 0.16, deg(d + (i % 3), 1), 0.4)); break;
          default: I.marimba(t, m, 0.4);
        }
      });
    },
    // the old town bell: the city changes key for a while
    ringBell() { if (!ctx) return; H.bell = 8; const t = T0(); [0, 0.9, 1.8].forEach((o, k) => I.bell(t + o, deg([7, 4, 0][k], -1), 1, sfxOut, 4)); },
  };

  function update(dt, state) {
    if (!ctx) return; Object.assign(R, state);
    const target = U.clamp(((R.combo || 0) - 1) / 4, 0, 1);
    comboL += (target - comboL) * (1 - Math.exp(-dt / (target > comboL ? 0.3 : 3)));
  }
  function setVolume(music, fx) { if (music != null) { S.musicVol = music; if (musicOut) musicOut.gain.setTargetAtTime(music, ctx.currentTime, 0.05); } if (fx != null) { S.sfxVol = fx; if (sfxOut) sfxOut.gain.setTargetAtTime(fx, ctx.currentTime, 0.05); } }
  function suspend(on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); }
  function debugTap() { if (!ctx) return null; const a = ctx.createAnalyser(); a.fftSize = 2048; master.connect(a); return a; }
  return { init, start, beat, judge, sfx, update, R, setPlace, knock, knocked, resume, quant, setVolume, suspend, debugTap, REC, H, clk,
    get ready() { return !!ctx; }, get place() { return dom.key; }, get modeName() { return H.modeName; }, get bpm() { return clk.bpm; }, get vol() { return S.musicVol; }, get ctx() { return ctx; } };
})();
