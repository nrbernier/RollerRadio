// ============================================================
//  AUDIO — procedural, reactive soundtrack + SFX (WebAudio)
// ============================================================
const Sound = (() => {
  let ctx = null;
  let master, musicOut, sfxOut, lp, comp, revIn, dlyIn, dly, dlyFb, noiseBuf, crunchCurve;
  const bus = {};          // layer gain nodes
  let drumHP;              // drum high-pass (opens when airborne)
  let wheelsSrc, wheelsGain, wheelsFilt, grindGain, grindOsc, grindFilt;
  const S = {
    song: null, songName: '', step: 0, nextTime: 0, startTime: 0, spb: 0.5, stepDur: 0.125,
    timer: null, playing: false, musicVol: 0.8, sfxVol: 0.9
  };
  // gameplay → music
  const R = { speed: 0, grinding: false, air: false, airTime: 0, combo: 0, unlocks: 0, hype: 0, muffle: 0, duck: 0 };
  const midiF = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain(); master.gain.value = 0.9;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    master.connect(comp); comp.connect(ctx.destination);

    musicOut = ctx.createGain(); musicOut.gain.value = S.musicVol;
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.8;
    musicOut.connect(lp); lp.connect(master);
    sfxOut = ctx.createGain(); sfxOut.gain.value = S.sfxVol; sfxOut.connect(master);

    // noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // reverb
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    conv.buffer = ir;
    revIn = ctx.createGain(); revIn.gain.value = 0.32;
    revIn.connect(conv); conv.connect(musicOut);

    // tempo delay
    dly = ctx.createDelay(2); dlyFb = ctx.createGain(); dlyFb.gain.value = 0.33;
    const dlyLP = ctx.createBiquadFilter(); dlyLP.type = 'lowpass'; dlyLP.frequency.value = 2600;
    dlyIn = ctx.createGain(); dlyIn.gain.value = 0.35;
    dlyIn.connect(dly); dly.connect(dlyLP); dlyLP.connect(dlyFb); dlyFb.connect(dly); dlyLP.connect(musicOut);

    // crunch curve for glitches
    crunchCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; crunchCurve[i] = Math.round(x * 4) / 4; }

    // layer buses
    drumHP = ctx.createBiquadFilter(); drumHP.type = 'highpass'; drumHP.frequency.value = 20; drumHP.Q.value = 0.9;
    drumHP.connect(musicOut);
    for (const k of ['drums', 'bass', 'keys', 'stabs', 'lead', 'perc', 'arp', 'pad', 'anthem', 'vox']) {
      const g = ctx.createGain(); g.gain.value = 0;
      g.connect(k === 'drums' ? drumHP : musicOut);
      bus[k] = g;
    }

    // continuous wheel + grind loops
    wheelsSrc = ctx.createBufferSource(); wheelsSrc.buffer = noiseBuf; wheelsSrc.loop = true;
    wheelsFilt = ctx.createBiquadFilter(); wheelsFilt.type = 'bandpass'; wheelsFilt.frequency.value = 420; wheelsFilt.Q.value = 0.8;
    wheelsGain = ctx.createGain(); wheelsGain.gain.value = 0;
    wheelsSrc.connect(wheelsFilt); wheelsFilt.connect(wheelsGain); wheelsGain.connect(sfxOut); wheelsSrc.start();

    const gsrc = ctx.createBufferSource(); gsrc.buffer = noiseBuf; gsrc.loop = true;
    grindFilt = ctx.createBiquadFilter(); grindFilt.type = 'bandpass'; grindFilt.frequency.value = 3200; grindFilt.Q.value = 6;
    grindOsc = ctx.createOscillator(); grindOsc.type = 'square'; grindOsc.frequency.value = 1180;
    const go = ctx.createGain(); go.gain.value = 0.05;
    grindGain = ctx.createGain(); grindGain.gain.value = 0;
    gsrc.connect(grindFilt); grindFilt.connect(grindGain); grindOsc.connect(go); go.connect(grindGain);
    grindGain.connect(sfxOut); gsrc.start(); grindOsc.start();
  }

  // ---------- low-level helpers ----------
  function env(g, t, a, peak, dec, sus = 0.0001, hold = 0) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold) g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + hold + dec);
  }
  function osc(type, f, t, dur, dest) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dur, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s;
  }
  function gain(dest, v = 1) { const g = ctx.createGain(); g.gain.value = v; g.connect(dest); return g; }
  function filt(type, f, q, dest) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; }

  // ---------- instruments ----------
  const I = {
    kick(t, v = 1, dest = bus.drums) {
      const g = gain(dest, 0); env(g, t, 0.002, 1.1 * v, 0.34);
      const o = osc('sine', 155, t, 0.4, g); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
      const c = gain(dest, 0); env(c, t, 0.001, 0.25 * v, 0.02);
      noise(t, 0.03, filt('highpass', 3000, 0.7, c));
    },
    snare(t, v = 1, dest = bus.drums) {
      const g = gain(dest, 0); env(g, t, 0.001, 0.75 * v, 0.17);
      const bp = filt('bandpass', 1900, 0.6, g); noise(t, 0.22, bp);
      const g2 = gain(dest, 0); env(g2, t, 0.001, 0.45 * v, 0.07);
      const o = osc('triangle', 210, t, 0.1, g2); o.frequency.exponentialRampToValueAtTime(150, t + 0.07);
      if (v > 0.5) { const r = gain(revIn, 0); env(r, t, 0.001, 0.25 * v, 0.12); noise(t, 0.14, filt('bandpass', 2200, 0.6, r)); }
    },
    hat(t, v = 0.5, open = false, dest = bus.drums) {
      const g = gain(dest, 0); env(g, t, 0.001, 0.32 * v, open ? 0.32 : 0.045);
      noise(t, open ? 0.4 : 0.07, filt('highpass', 7600, 0.7, g));
    },
    clap(t, v = 1, dest = bus.drums) {
      const g = gain(dest, 0);
      g.gain.setValueAtTime(0.0001, t);
      [0, 0.011, 0.022].forEach(o => { g.gain.setValueAtTime(0.6 * v, t + o); g.gain.exponentialRampToValueAtTime(0.05, t + o + 0.009); });
      g.gain.setValueAtTime(0.5 * v, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      noise(t, 0.25, filt('bandpass', 1400, 1.2, g));
      const r = gain(revIn, 0.25 * v); noise(t, 0.12, filt('bandpass', 1400, 1, r));
    },
    crash(t, v = 0.8, dest = bus.drums) {
      const g = gain(dest, 0); env(g, t, 0.002, 0.33 * v, 1.6);
      noise(t, 1.7, filt('highpass', 4500, 0.5, g));
      const r = gain(revIn, 0); env(r, t, 0.002, 0.3 * v, 1.2); noise(t, 1.3, filt('highpass', 5000, 0.5, r));
    },
    conga(t, f = 260, v = 0.6, dest = bus.perc) {
      const g = gain(dest, 0); env(g, t, 0.002, 0.55 * v, 0.24);
      const o = osc('sine', f * 1.45, t, 0.3, g); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    },
    shaker(t, v = 0.3, dest = bus.perc) {
      const g = gain(dest, 0); env(g, t, 0.012, 0.12 * v, 0.05);
      noise(t, 0.09, filt('highpass', 6000, 0.6, g));
    },
    cowbell(t, v = 0.5, dest = bus.perc) {
      const g = gain(dest, 0); env(g, t, 0.001, 0.2 * v, 0.28);
      const bp = filt('bandpass', 900, 2.5, g);
      osc('square', 545, t, 0.3, bp); osc('square', 815, t, 0.3, bp);
    },
    bass(t, m, dur, v = 1, dest = bus.bass) {
      const g = gain(dest, 0); env(g, t, 0.004, 0.55 * v, Math.max(0.08, dur * 0.9), 0.0001);
      const f = filt('lowpass', 300, 7, g);
      f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(1500 + R.speed * 30, t + 0.02);
      f.frequency.exponentialRampToValueAtTime(240, t + 0.18);
      osc('sawtooth', midiF(m), t, dur + 0.1, f);
      const sub = gain(g, 0.8); osc('sine', midiF(m), t, dur + 0.1, sub);
    },
    ep(t, notes, dur, v = 1, dest = bus.keys) {
      for (const m of notes) {
        const g = gain(dest, 0); env(g, t, 0.003, 0.11 * v, dur * 1.6 + 0.2);
        const c = osc('sine', midiF(m), t, dur * 1.6 + 0.3, g);
        const mod = ctx.createOscillator(); mod.frequency.value = midiF(m) * 1.0;
        const mg = ctx.createGain(); mg.gain.setValueAtTime(midiF(m) * 2.2, t); mg.gain.exponentialRampToValueAtTime(midiF(m) * 0.15, t + 0.25);
        mod.connect(mg); mg.connect(c.frequency); mod.start(t); mod.stop(t + dur * 1.6 + 0.3);
        const r = gain(revIn, 0); env(r, t, 0.003, 0.05 * v, dur + 0.3); osc('sine', midiF(m), t, dur + 0.35, r);
      }
    },
    stab(t, notes, dur = 0.16, v = 1, dest = bus.stabs) {
      const g = gain(dest, 0); env(g, t, 0.006, 0.16 * v, dur + 0.08);
      const f = filt('lowpass', 3800, 1.5, g);
      f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(700, t + dur + 0.08);
      const s = gain(dlyIn, 0.25); g.connect(s); const rv = gain(revIn, 0.5); g.connect(rv);
      for (const m of notes) {
        const o1 = osc('sawtooth', midiF(m), t, dur + 0.12, f); o1.detune.value = -9;
        const o2 = osc('sawtooth', midiF(m), t, dur + 0.12, f); o2.detune.value = 9;
      }
    },
    lead(t, m, dur, v = 1, dest = bus.lead) {
      const g = gain(dest, 0); env(g, t, 0.02, 0.13 * v, dur * 0.9, 0.0001, dur * 0.2);
      const f = filt('lowpass', 3200, 2, g);
      const o = osc('square', midiF(m), t, dur + 0.1, f);
      const o2 = osc('triangle', midiF(m + 12), t, dur + 0.1, gain(f, 0.5));
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
      const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + dur * 0.7);
      lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); lfo.start(t); lfo.stop(t + dur + 0.1);
      const s = gain(dlyIn, 0.3); g.connect(s);
      const rv = gain(revIn, 0.4); g.connect(rv);
    },
    arp(t, m, v = 1, dest = bus.arp) {
      const g = gain(dest, 0); env(g, t, 0.002, 0.09 * v, 0.1);
      const f = filt('lowpass', 2400 + R.speed * 60, 3, g);
      osc('square', midiF(m), t, 0.14, f);
      const s = gain(dlyIn, 0.5); g.connect(s);
    },
    pad(t, notes, dur, v = 1, dest = bus.pad) {
      const g = gain(dest, 0);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * v, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
      const f = filt('lowpass', 1100, 0.7, g);
      const rv = gain(revIn, 0.6); g.connect(rv);
      for (const m of notes) {
        const a = osc('sawtooth', midiF(m), t, dur + 0.3, f); a.detune.value = -7;
        const b = osc('sawtooth', midiF(m), t, dur + 0.3, f); b.detune.value = 7;
      }
    },
    bell(t, m, v = 1, dest = bus.anthem) {
      const g = gain(dest, 0); env(g, t, 0.002, 0.16 * v, 1.4);
      osc('sine', midiF(m), t, 1.5, g);
      const g2 = gain(dest, 0); env(g2, t, 0.002, 0.05 * v, 0.5); osc('sine', midiF(m) * 2.76, t, 0.6, g2);
      const rv = gain(revIn, 0); env(rv, t, 0.002, 0.12 * v, 1.2); osc('sine', midiF(m), t, 1.3, rv);
    },
    tuba(t, m, dur, v = 1, dest = bus.anthem) {
      const g = gain(dest, 0); env(g, t, 0.03, 0.22 * v, dur, 0.0001, dur * 0.3);
      osc('triangle', midiF(m), t, dur * 1.4, filt('lowpass', 600, 1, g));
    },
    whistle(t, m, dur, v = 1, dest = bus.lead) {
      const g = gain(dest, 0); env(g, t, 0.03, 0.16 * v, dur * 0.9, 0.0001, dur * 0.25);
      const o = osc('sine', midiF(m) * 0.985, t, dur + 0.15, g); o.frequency.exponentialRampToValueAtTime(midiF(m), t + 0.05);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
      const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(18, t + dur * 0.6);
      lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.15);
      const br = gain(g, 0.05); noise(t, dur, filt('bandpass', midiF(m) * 2, 6, br));
      const s = gain(dlyIn, 0.25); g.connect(s); const rv = gain(revIn, 0.5); g.connect(rv);
    },
    marimba(t, m, v = 1, dest = bus.arp) {
      const g = gain(dest, 0); env(g, t, 0.001, 0.16 * v, 0.22);
      osc('sine', midiF(m), t, 0.3, g);
      const g2 = gain(dest, 0); env(g2, t, 0.001, 0.05 * v, 0.05); osc('sine', midiF(m) * 3.9, t, 0.08, g2);
      const s = gain(dlyIn, 0.35); g.connect(s);
    },
    vox(t, base = 220, vowel = 'a', v = 1, dest = sfxOut) {
      const F = { a: [800, 1150, 2900], e: [450, 1900, 2600], o: [450, 800, 2830], u: [325, 700, 2530] }[vowel];
      const g = gain(dest, 0); env(g, t, 0.01, 0.5 * v, 0.28, 0.0001, 0.05);
      const src = ctx.createOscillator(); src.type = 'sawtooth';
      src.frequency.setValueAtTime(base * 1.12, t); src.frequency.exponentialRampToValueAtTime(base * 0.86, t + 0.3);
      F.forEach((f, i) => { const b = filt('bandpass', f, 9, gain(g, [1, 0.6, 0.25][i])); src.connect(b); });
      src.start(t); src.stop(t + 0.4);
    }
  };

  // ---------- songs ----------
  // chords as voicings, bass as [step, midi, durSteps]
  const ROOF = {
    bpm: 116, swing: 0.13, bars: 4,
    chords: [[53, 57, 60, 64], [53, 57, 59, 64], [53, 57, 60, 64], [53, 57, 58, 62]],
    chords2: [null, null, null, [52, 55, 57, 62]],
    arpNotes: [[62, 65, 69, 72, 76], [62, 67, 71, 74, 76], [62, 65, 69, 72, 77], [62, 65, 70, 74, 77]],
    bass: [
      [[0, 38, 3], [3, 50, 1], [6, 48, 1], [7, 50, 1], [10, 38, 2], [13, 41, 1], [14, 43, 1], [15, 45, 1]],
      [[0, 43, 3], [3, 55, 1], [6, 53, 1], [8, 43, 2], [10, 50, 1], [11, 43, 1], [14, 47, 1], [15, 48, 1]],
      [[0, 38, 3], [3, 50, 1], [5, 48, 1], [6, 50, 1], [8, 45, 1], [10, 38, 2], [13, 41, 1], [14, 43, 1]],
      [[0, 46, 2], [3, 58, 1], [6, 46, 1], [8, 48, 2], [11, 60, 1], [13, 48, 1], [14, 50, 1], [15, 52, 1]]
    ],
    lead: [
      [[0, 74, 2], [2, 77, 2], [4, 79, 1], [6, 81, 3], [10, 79, 1], [11, 77, 1], [12, 74, 4]],
      [[0, 72, 2], [2, 74, 2], [4, 77, 4], [10, 76, 2], [12, 74, 4]],
      [[0, 74, 2], [2, 77, 2], [4, 79, 1], [6, 81, 2], [8, 84, 3], [12, 81, 2], [14, 79, 2]],
      [[0, 77, 3], [3, 74, 3], [6, 77, 2], [8, 79, 6], [14, 81, 2]]
    ],
    tick(step, t, sd) {
      const bar = Math.floor(step / 16) % 4, s = step % 16;
      const u = R.unlocks;
      const fast = R.speed > 11;
      // --- drums
      const kicksA = [0, 10], kicksB = [0, 2, 10, 13], kicksF = [0, 3, 8, 10, 14];
      const kicks = bar === 3 ? kicksF : (bar % 2 ? kicksB : kicksA);
      if (kicks.includes(s)) I.kick(t, R.air ? 0.35 : 1);
      if (s === 4 || s === 12) { I.snare(t, 1); if (R.hype > 0.5) I.clap(t, 0.8); }
      if (bar % 2 === 0 && (s === 7 || s === 9 || s === 15)) I.snare(t, 0.22);
      if (R.hype > 0.5 && bar === 3 && s >= 12) I.snare(t, 0.35 + (s - 12) * 0.12);
      const openStep = (bar % 2 === 1 && s === 14);
      if (openStep) I.hat(t, 0.6, true);
      else if (s % 2 === 0) I.hat(t, s % 4 === 0 ? 0.55 : 0.4);
      else if (fast) I.hat(t, 0.22);
      // --- bass
      for (const [st, m, d] of this.bass[bar]) if (st === s) I.bass(t, m, d * sd * 0.9, R.air ? 0.5 : 1);
      // --- keys (relay 1)
      if (u >= 1) {
        const ch = (this.chords2[bar] && s >= 8) ? this.chords2[bar] : this.chords[bar];
        if (s === 2 || s === 10) I.ep(t, ch, sd * 1.1, 0.9);
        if (s === 7 || s === 14) I.ep(t, ch, sd * 2.2, 1);
      } else if (s === 0) I.pad(t, this.chords[bar], sd * 15, 0.7);
      // --- perc (relay 2)
      if (u >= 2) {
        if ([3, 6, 11, 14].includes(s)) I.conga(t, (s === 6 || s === 14) ? 330 : 240, 0.7);
        if (s % 2 === 1) I.shaker(t, 0.5);
        if (bar === 3 && s === 8) I.cowbell(t, 0.6);
      }
      // --- stabs (relay 3)
      if (u >= 3) {
        const top = this.chords[bar].map(n => n + 12);
        if ((bar === 0 || bar === 2) && s === 12) I.stab(t, top, 0.14);
        if (bar === 1 && (s === 6 || s === 7)) I.stab(t, top, 0.09, 0.8);
        if (bar === 3 && (s === 6 || s === 14 || s === 15)) I.stab(t, [65, 69, 72, 77], 0.1, 0.9);
      }
      // --- lead (relay 4 or big combo)
      if (u >= 4 || R.combo >= 4) for (const [st, m, d] of this.lead[bar]) if (st === s) I.lead(t, m, d * sd, u >= 4 ? 1 : 0.8);
      // --- grind arp
      if (R.grinding) { const an = this.arpNotes[bar]; I.arp(t, an[(step * 3 + (s % 3)) % an.length] + (s >= 8 ? 12 : 0)); }
    },
    mix() {
      const u = R.unlocks;
      return { drums: 0.9, bass: 0.85, keys: u >= 1 ? 0.9 : 0, pad: u >= 1 ? 0 : 0.8, perc: u >= 2 ? 0.75 : 0, stabs: u >= 3 ? 0.8 : 0,
        lead: (u >= 4 || R.combo >= 4) ? 0.8 : 0, arp: R.grinding ? 0.75 : 0, anthem: 0 };
    }
  };

  // Civic Park — sunny shuffle in G, whistled hook
  const PARK = {
    bpm: 104, swing: 0.17, bars: 4,
    chords: [[59, 62, 66, 69], [55, 59, 62, 66], [52, 55, 59, 62], [55, 57, 60, 64]],
    arpNotes: [[67, 71, 74, 78, 79], [64, 67, 71, 74, 76], [60, 64, 67, 71, 72], [62, 66, 69, 72, 74]],
    roots: [43, 40, 36, 38],
    lead: [
      [[0, 74, 2], [2, 79, 2], [4, 81, 2], [6, 83, 4], [12, 81, 2], [14, 79, 2]],
      [[0, 76, 4], [4, 79, 2], [6, 76, 2], [8, 74, 6]],
      [[0, 72, 2], [2, 76, 2], [4, 79, 4], [8, 83, 2], [10, 81, 2], [12, 79, 4]],
      [[0, 81, 3], [3, 79, 1], [4, 76, 2], [6, 74, 2], [8, 72, 2], [10, 74, 6]]
    ],
    tick(step, t, sd) {
      const bar = Math.floor(step / 16) % 4, s = step % 16, u = R.unlocks, r = this.roots[bar];
      const kicks = bar === 3 ? [0, 6, 10, 13] : [0, 7, 10];
      if (kicks.includes(s)) I.kick(t, (s === 7 ? 0.6 : 1) * (R.air ? 0.35 : 1));
      if (s === 4 || s === 12) { I.snare(t, 0.85); if (R.hype > 0.5) I.clap(t, 0.8); }
      if (bar === 3 && s >= 13 && R.hype > 0.5) I.snare(t, 0.3 + (s - 13) * 0.15);
      if (s % 2 === 0) I.hat(t, s % 4 === 0 ? 0.45 : 0.35, (bar % 2 === 1 && s === 14));
      else if (R.speed > 11) I.hat(t, 0.18);
      const bl = [[0, 0, 2], [3, 12, 1], [6, 7, 1], [8, 0, 2], [11, 7, 1], [13, 12, 1], [14, bar === 3 ? 14 : 10, 1]];
      for (const [st, iv, d] of bl) if (st === s) I.bass(t, r + iv, d * sd * 0.85, R.air ? 0.5 : 0.95);
      if (u >= 1) {
        const ch = this.chords[bar];
        if (s === 2 || s === 10) I.ep(t, ch, sd * 1.2, 0.85);
        if (s === 6 || s === 14) I.ep(t, ch, sd * 0.8, 0.7);
      } else if (s === 0) I.pad(t, this.chords[bar], sd * 15, 0.7);
      if (u >= 2) {
        if ([3, 5, 11, 13].includes(s)) I.conga(t, (s === 5 || s === 13) ? 520 : 380, 0.55);
        if (s % 2 === 1) I.shaker(t, 0.55);
        if (bar === 1 && s === 8) I.cowbell(t, 0.45);
      }
      if (u >= 3) {
        const top = this.chords[bar].map(n => n + 12);
        if ((bar === 0 || bar === 2) && s === 12) I.stab(t, top, 0.12);
        if (bar === 3 && (s === 14 || s === 15)) I.stab(t, top, 0.08, 0.85);
      }
      if (u >= 4 || R.combo >= 4) for (const [st, m, d] of this.lead[bar]) if (st === s) I.whistle(t, m, d * sd, u >= 4 ? 1 : 0.8);
      if (R.grinding) { const an = this.arpNotes[bar]; I.marimba(t, an[(step * 2 + (s % 3)) % an.length] + (s >= 8 ? 12 : 0)); }
    },
    mix() { return ROOF.mix(); }
  };

  // Ministry anthem — 60 BPM, as mandated by Decree 88
  const ANTHEM = {
    bpm: 60, swing: 0, bars: 4,
    mel: [
      [[0, 79, 4], [4, 76, 4], [8, 72, 4], [12, 76, 4]],
      [[0, 77, 4], [4, 81, 4], [8, 79, 8]],
      [[0, 76, 4], [4, 77, 4], [8, 74, 4], [12, 67, 4]],
      [[0, 72, 12]]
    ],
    bassN: [[48, 55], [53, 60], [57, 55], [48, 43]],
    tick(step, t, sd) {
      const bar = Math.floor(step / 16) % 4, s = step % 16;
      for (const [st, m, d] of this.mel[bar]) if (st === s) I.bell(t, m, 0.9);
      if (s === 0) I.tuba(t, this.bassN[bar][0] - 12, sd * 6, 0.9);
      if (s === 8) I.tuba(t, this.bassN[bar][1] - 12, sd * 6, 0.8);
      if (s === 4 || s === 12) I.bell(t, 84, 0.12);
      if (s === 0) I.pad(t, [[60, 64, 67], [60, 65, 69], [57, 60, 64], [55, 59, 62]][bar], sd * 16, 0.5, bus.anthem);
    },
    mix() { return { anthem: 0.9, drums: 0, bass: 0, keys: 0, pad: 0, perc: 0, stabs: 0, lead: 0, arp: 0 }; }
  };

  // Static's tension bed — sparse, minor, used under the outro twist
  const UNEASE = {
    bpm: 116, swing: 0, bars: 2,
    tick(step, t, sd) {
      const s = step % 16, bar = Math.floor(step / 16) % 2;
      if (s === 0) I.pad(t, bar ? [50, 53, 56, 60] : [50, 53, 57, 61], sd * 16, 0.8, bus.pad);
      if (s === 0 || s === 10) I.kick(t, 0.6);
      if (s % 4 === 2) I.hat(t, 0.25);
      if (s === 12 && bar === 1) I.bell(t, 81, 0.25, bus.pad);
    },
    mix() { return { drums: 0.6, pad: 0.9, anthem: 0, bass: 0, keys: 0, perc: 0, stabs: 0, lead: 0, arp: 0 }; }
  };

  const SONGS = { roof: ROOF, park: PARK, anthem: ANTHEM, unease: UNEASE };

  function schedule() {
    if (!S.playing || !ctx) return;
    const ahead = ctx.currentTime + 0.12;
    while (S.nextTime < ahead) {
      const song = S.song;
      const swingOff = (S.step % 2 === 1) ? song.swing * S.stepDur : 0;
      try { song.tick(S.step, S.nextTime + swingOff, S.stepDur); } catch (e) { console.warn(e); }
      S.step++; S.nextTime += S.stepDur;
    }
    // smooth layer mix
    const mix = S.song.mix();
    const now = ctx.currentTime;
    for (const k in bus) {
      if (k === 'vox') continue;
      const target = (mix[k] || 0) * (1 - R.duck * 0.5);
      bus[k].gain.setTargetAtTime(target, now, k === 'arp' ? 0.04 : 0.25);
    }
    // air: open drum high-pass, bass dips
    const airAmt = R.air ? Math.min(1, R.airTime / 0.35) : 0;
    drumHP.frequency.setTargetAtTime(20 + airAmt * 900, now, R.air ? 0.15 : 0.03);
    // speed opens the master filter: the city wakes up when you move
    const sp = Math.min(1, R.speed / 16);
    const cutoff = R.muffle ? 900 : 1300 * Math.pow(14, sp);
    lp.frequency.setTargetAtTime(Math.min(18500, cutoff), now, 0.2);
  }

  function play(name, { at = 0 } = {}) {
    if (!ctx) return;
    const song = SONGS[name]; if (!song) return;
    S.song = song; S.songName = name;
    S.spb = 60 / song.bpm; S.stepDur = S.spb / 4;
    S.step = 0;
    S.startTime = ctx.currentTime + 0.08 + at;
    S.nextTime = S.startTime;
    S.playing = true;
    if (!S.timer) S.timer = setInterval(schedule, 25);
    schedule();
  }
  function stop() { S.playing = false; if (!ctx) return; for (const k in bus) bus[k].gain.setTargetAtTime(0, ctx.currentTime, 0.1); }

  // map performance.now() → audio context time actually being heard
  function heardTime(perfMs) {
    if (!ctx) return 0;
    const p = perfMs ?? performance.now();
    if (ctx.getOutputTimestamp) {
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0) return ts.contextTime + (p - ts.performanceTime) / 1000;
    }
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0.02);
  }
  // beat info for gameplay. off = signed seconds to nearest beat.
  function beat(perfMs) {
    if (!ctx || !S.playing) {
      const tt = (perfMs ?? performance.now()) / 1000; const b = tt / 0.517;
      return { b, phase: b % 1, inBar: Math.floor(b) % 4, bar: Math.floor(b / 4), off: 99, spb: 0.517, playing: false };
    }
    const tt = heardTime(perfMs) - S.startTime;
    const b = tt / S.spb;
    const near = Math.round(b);
    const ph = ((b % 1) + 1) % 1;
    return { b, phase: ph, inBar: ((Math.floor(b) % 4) + 4) % 4, bar: Math.floor(b / 4), off: (b - near) * S.spb, spb: S.spb, playing: true };
  }
  function judge(perfMs) {
    const bi = beat(perfMs);
    const a = Math.abs(bi.off);
    if (!bi.playing) return 'good';
    return a < 0.09 ? 'perfect' : a < 0.17 ? 'good' : 'miss';
  }

  // ---------- SFX ----------
  const T = () => ctx.currentTime + 0.005;
  const sfx = {
    jump(big) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.01, 0.22, 0.2);
      const f = filt('bandpass', 600, 2, g); f.frequency.exponentialRampToValueAtTime(big ? 3200 : 2000, t + 0.2);
      noise(t, 0.25, f);
      if (big) { const g2 = gain(sfxOut, 0); env(g2, t, 0.005, 0.12, 0.25); const o = osc('triangle', 300, t, 0.3, g2); o.frequency.exponentialRampToValueAtTime(900, t + 0.25); }
    },
    land(h = 1) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.002, 0.35 * Math.min(1.4, h), 0.12);
      const o = osc('sine', 120, t, 0.15, g); o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
      const c = gain(sfxOut, 0); env(c, t, 0.001, 0.18, 0.05); noise(t, 0.06, filt('bandpass', 2500, 1, c));
      if (R.air === false && h > 0.6 && S.playing && S.songName === 'roof') I.crash(t, 0.6, sfxOut);
    },
    scratch(dir = 1) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.01); g.gain.linearRampToValueAtTime(0.1, t + 0.07);
      g.gain.linearRampToValueAtTime(0.55, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      const f = filt('bandpass', 500, 5, g);
      f.frequency.setValueAtTime(dir > 0 ? 400 : 2400, t);
      f.frequency.linearRampToValueAtTime(dir > 0 ? 2600 : 500, t + 0.08);
      f.frequency.linearRampToValueAtTime(dir > 0 ? 700 : 2000, t + 0.18);
      noise(t, 0.22, f);
      const o = osc('sawtooth', 160, t, 0.2, gain(g, 0.25));
      o.frequency.linearRampToValueAtTime(420, t + 0.08); o.frequency.linearRampToValueAtTime(120, t + 0.18);
    },
    perfect(level = 1) {
      if (!ctx) return; const t = T();
      sfx.scratch(1);
      const roots = [62, 65, 67, 69, 72, 74];
      const r = roots[Math.min(roots.length - 1, level - 1)];
      I.stab(t + 0.02, [r + 12, r + 15, r + 19], 0.12, 0.9, sfxOut);
      if (level >= 3) I.vox(t + 0.05, 230 + level * 8, level % 2 ? 'e' : 'o', 0.7);
    },
    offbeat() {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.005, 0.3, 0.35);
      const o = osc('sawtooth', 300, t, 0.4, filt('lowpass', 1200, 2, g)); o.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    },
    push(onBeat) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.003, onBeat ? 0.3 : 0.15, 0.18);
      const f = filt('bandpass', 900, 1.5, g); f.frequency.exponentialRampToValueAtTime(onBeat ? 4000 : 1500, t + 0.15);
      noise(t, 0.2, f);
      if (onBeat) I.kick(t, 0.5, sfxOut);
    },
    tape() {
      if (!ctx) return; const t = T();
      [74, 78, 81, 86, 90].forEach((m, i) => { const g = gain(sfxOut, 0); env(g, t + i * 0.06, 0.003, 0.16, 0.5); osc('triangle', midiF(m), t + i * 0.06, 0.55, g); });
      I.vox(t + 0.1, 260, 'o', 0.5);
    },
    relay() {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      const f = filt('lowpass', 300, 8, g); f.frequency.exponentialRampToValueAtTime(8000, t + 1.0);
      osc('sawtooth', 110, t, 1.2, f); osc('sawtooth', 165, t, 1.2, f);
      I.crash(t + 1.0, 1, sfxOut); I.stab(t + 1.0, [62, 65, 69, 74], 0.4, 1.2, sfxOut);
      I.vox(t + 1.02, 210, 'e', 0.9); I.vox(t + 1.22, 250, 'a', 0.8);
    },
    glitch(dur = 0.6) {
      if (!ctx) return; const t = T();
      const ws = ctx.createWaveShaper(); ws.curve = crunchCurve; ws.connect(sfxOut);
      const g = ctx.createGain(); g.connect(ws);
      g.gain.setValueAtTime(0, t);
      for (let i = 0; i < dur * 30; i++) g.gain.setValueAtTime(Math.random() < 0.6 ? 0.35 : 0, t + i / 30);
      g.gain.setValueAtTime(0, t + dur);
      noise(t, dur, filt('bandpass', 1500, 0.4, g));
      const o = osc('square', 80, t, dur, gain(g, 0.3));
      for (let i = 0; i < 8; i++) o.frequency.setValueAtTime(60 + Math.random() * 900, t + i * dur / 8);
    },
    drone(kind) {
      if (!ctx) return; const t = T();
      if (kind === 'alert') {
        [0, 0.12].forEach(o => { const g = gain(sfxOut, 0); env(g, t + o, 0.002, 0.14, 0.09); osc('square', 1320, t + o, 0.1, filt('lowpass', 3000, 1, g)); });
      } else if (kind === 'vibe') {
        const g = gain(sfxOut, 0); env(g, t, 0.01, 0.2, 0.5);
        const f = filt('bandpass', 400, 6, g); f.frequency.linearRampToValueAtTime(2200, t + 0.25); f.frequency.linearRampToValueAtTime(500, t + 0.5);
        osc('sawtooth', 196, t, 0.55, f);
      } else if (kind === 'chime') {
        [[76, 0], [72, 0.22]].forEach(([m, o]) => I.bell(t + o, m, 1.2, sfxOut));
      }
    },
    blip(pitch = 600) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.001, 0.035, 0.03);
      osc('square', pitch * (0.95 + Math.random() * 0.1), t, 0.04, filt('lowpass', 2500, 1, g));
    },
    click() {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.001, 0.12, 0.06); osc('triangle', 880, t, 0.08, g);
    },
    whoosh() {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.15, 0.18, 0.4);
      const f = filt('bandpass', 300, 1.2, g); f.frequency.exponentialRampToValueAtTime(2500, t + 0.35); f.frequency.exponentialRampToValueAtTime(600, t + 0.6);
      noise(t, 0.65, f);
    },
    splash(v = 1) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.005, 0.22 * v, 0.3);
      const f = filt('bandpass', 1400, 0.8, g); f.frequency.exponentialRampToValueAtTime(500, t + 0.3); noise(t, 0.35, f);
    },
    bounce(big) {
      if (!ctx) return; const t = T();
      const g = gain(sfxOut, 0); env(g, t, 0.002, 0.4, big ? 0.6 : 0.25);
      const o = osc('sine', 90, t, 0.7, g); o.frequency.exponentialRampToValueAtTime(big ? 600 : 220, t + (big ? 0.5 : 0.2));
      if (big) { I.vox(t + 0.02, 240, 'u', 0.6); I.crash(t, 0.5, sfxOut); }
    }
  };

  function update(dt, state) {
    if (!ctx) return;
    Object.assign(R, state);
    const now = ctx.currentTime;
    const ws = (R.grounded && !R.grinding) ? Math.min(1, R.speed / 18) : 0;
    wheelsGain.gain.setTargetAtTime(ws * 0.16, now, 0.05);
    wheelsFilt.frequency.setTargetAtTime(300 + R.speed * 40, now, 0.1);
    grindGain.gain.setTargetAtTime(R.grinding ? 0.11 : 0, now, 0.03);
    grindFilt.frequency.setTargetAtTime(2400 + R.speed * 90, now, 0.05);
    grindOsc.frequency.setTargetAtTime(900 + R.speed * 25, now, 0.05);
  }

  function setVolume(music, sfxV) {
    if (music != null) { S.musicVol = music; if (musicOut) musicOut.gain.setTargetAtTime(music, ctx.currentTime, 0.05); }
    if (sfxV != null) { S.sfxVol = sfxV; if (sfxOut) sfxOut.gain.setTargetAtTime(sfxV, ctx.currentTime, 0.05); }
  }
  function suspend(on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); }

  return { init, play, stop, beat, judge, sfx, update, R, setVolume, suspend, get ready() { return !!ctx; }, get song() { return S.songName; }, get vol() { return S.musicVol; } };
})();
