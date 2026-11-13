// ============================================================
//  MOVES — how the player's moves sound, district by district.
//  A proposal to replace KIT, grindStep and comboStep in src/city/music.js, and what sfx.trick / land / push / jump do.
//  Not in the game yet: music/preview.html plays it on the game's own synth. See music/README.md.
//
//  What changes, in short:
//  - a grind plays a written two-bar lick in the district's own style and meter, not a random walk of even notes;
//    speed adds ornaments instead of doubling the rate; the tune develops over eight bars and ends on a cadence
//  - each trick has its own figure (a spin turns round a note, a backflip falls and comes back…), a run of tricks
//    climbs the chord, a perfect one sparkles, a missed one stumbles
//  - a clean landing after tricks is a chord from the band; a sloppy one is a thud and a wrong note
//  - a run without touching the ground brings in a bass riff and stabs, written per district
//  - everything is on the district's grid (triplets in the old town and at the observatory, five in the park)
//
//  Pitches (p) are scale steps above the root of the chord of the moment: 0 2 4 6 are chord tones, 7 is the root an
//  octave up, x.5 is the semitone below the next step (a chromatic approach note).
//  A lick is [[step, p, lengthInSteps, level]] over two bars; level 0 always plays, 1 from 5 m/s, 2 from 10 m/s.
// ============================================================
const MOVES = (() => {
  let E = null, I = null;
  const out = () => E.musicOut, ch = (n, o) => E.chord(n, o);

  const STYLE = {
    // DOWNTOWN — jazz-funk. You take the Rhodes; the vibes answer your tricks; the horns hit your landings.
    business: {
      sub: 4, oct: 0, toct: 1, harm: 2,
      lead: (t, m, v, dur) => I.ep(t, [m], Math.max(0.18, dur * 0.9), v * 0.95),
      trick: (t, m, v, dur) => I.vibes(t, m, v, out(), Math.max(0.3, dur)),
      stab: (t, v) => { I.brass(t, ch(3, 0), 0.16, v); I.ep(t, ch(4, 0), 0.3, v * 0.8); },
      bass: (t, m, d, v) => I.ebass(t, m, d, v),
      perc: (c, v) => { if (c.s % 4 === 2) I.ride(c.t, v * 0.8); else if (c.s % 2 === 0) I.brush(c.t, v * 0.5); if (c.s === 7 || c.s === 15) I.conga(c.t, 300, v * 0.6); },
      land: (t, v) => { I.ep(t, ch(4, 0), 0.4, v * 1.1); I.kick(t, v * 0.4, out(), 110, 48, 0.22); },
      push: (t, v, k) => { I.rim(t, v * 0.6); if (k % 4 === 0) I.conga(t, 240, v * 0.6); },
      licks: [
        [[0, 4, 2, 0], [3, 6, 1, 1], [4, 7, 2, 0], [7, 6, 1, 1], [10, 4, 2, 0], [12, 2, 1, 1], [14, 1, 1, 2], [15, 1.5, 1, 2], [16, 2, 3, 0], [22, 4, 1, 1], [23, 6, 1, 1], [24, 7, 2, 0], [27, 9, 1, 1], [28, 8, 2, 0], [30, 6, 2, 1]],
        [[2, 7, 1, 0], [3, 8, 1, 1], [4, 9, 2, 0], [7, 7, 1, 0], [8, 6, 2, 1], [11, 4, 2, 0], [14, 2, 2, 1], [18, 0, 1, 0], [19, 2, 1, 1], [20, 4, 1, 0], [21, 6, 1, 1], [22, 7, 2, 0], [26, 6, 1, 1], [27, 4, 3, 0]],
        [[0, 0, 1, 0], [3, 0, 1, 0], [6, 2, 2, 0], [10, 4, 1, 1], [11, 3.5, 1, 2], [12, 4, 2, 0], [19, 6, 1, 0], [22, 4, 1, 0], [24, 2, 2, 0], [27, 1, 1, 1], [28, 0, 3, 0]],
      ],
      riff: [[0, 0, 2], [6, 4, 1], [10, 6, 2], [14, 4, 2]], comp: [3, 10],
    },
    // FOREST PARK — five to the bar, counted 3+2. A marimba pattern that turns; kalimba for tricks.
    park: {
      sub: 4, oct: 0, toct: 1, harm: 2,
      lead: (t, m, v) => I.marimba(t, m, v * 1.1),
      trick: (t, m, v) => I.kalimba(t, m, v * 1.1),
      stab: (t, v) => ch(3, 0).forEach((m, j) => I.pluck(t + j * 0.025, m, v * 0.8)),
      bass: (t, m, d, v) => I.upright(t, m, d, v * 0.9),
      perc: (c, v) => { if (c.s % 2 === 0) I.shaker(c.t, v * (c.s % 4 === 0 ? 1.2 : 0.8)); if (c.s === 0 || c.s === 12) I.frame(c.t, v * 0.9); },
      land: (t, v) => { I.frame(t, v * 0.8); I.kalimba(t, ch(1, 0)[0], v * 0.6); },
      push: (t, v, k) => I.woodblock(t, pitch(2 * (k % 4), 1), v * 0.5),
      licks: [
        [[0, 0, 2, 0], [2, 4, 2, 1], [4, 2, 2, 0], [6, 4, 2, 1], [8, 7, 2, 0], [12, 6, 2, 0], [14, 4, 2, 1], [16, 2, 4, 0], [20, 0, 2, 0], [22, 4, 2, 1], [24, 2, 2, 0], [26, 4, 2, 1], [28, 8, 2, 0], [32, 7, 2, 0], [34, 4, 2, 1], [36, 6, 4, 0]],
        [[0, 4, 3, 0], [3, 2, 1, 2], [4, 4, 2, 0], [6, 6, 2, 1], [8, 7, 4, 0], [12, 9, 2, 0], [14, 7, 2, 1], [16, 6, 2, 0], [18, 4, 2, 1], [20, 2, 3, 0], [23, 0, 1, 2], [24, 2, 2, 0], [26, 4, 2, 1], [28, 6, 4, 0], [32, 4, 2, 0], [34, 2, 2, 1], [36, 0, 4, 0]],
        [[0, 7, 4, 0], [6, 6, 2, 0], [8, 4, 4, 0], [12, 2, 4, 0], [16, 4, 2, 1], [18, 6, 2, 1], [20, 7, 4, 0], [26, 9, 2, 0], [28, 8, 4, 0], [32, 6, 4, 0], [36, 4, 4, 0]],
      ],
      riff: [[0, 0, 4], [6, 4, 2], [12, 0, 4], [16, 4, 2]], comp: [6, 16],
    },
    // MARKET — highlife. A third guitar, answered in parallel thirds; the clave bell rides under a grind.
    market: {
      sub: 4, oct: 0, toct: 1, harm: 2,
      lead: (t, m, v) => I.pluck(t, m, v, out(), 1.15),
      trick: (t, m, v) => I.pluck(t, m, v * 0.9, out(), 1.5),
      stab: (t, v) => { I.organ(t, ch(3, 0), 0.14, v); I.agogo(t, true, v * 0.6); },
      bass: (t, m, d, v) => I.ebass(t, m, d, v * 0.9),
      perc: (c, v) => { if (c.s % 2) I.tek(c.t, v * 0.6); else I.shaker(c.t, v); if ([0, 3, 6, 10, 12].includes(c.s)) I.agogo(c.t, c.s !== 10, v * 0.7); },
      land: (t, v) => { I.doum(t, v * 0.9); I.pluck(t, ch(1, 0)[0], v * 0.6); },
      push: (t, v, k) => { I.tek(t, v * 0.6); if (k % 2 === 0) I.conga(t, 220 + (k % 4) * 30, v * 0.5); },
      licks: [
        [[0, 4, 2, 0], [3, 6, 2, 0], [6, 7, 2, 0], [8, 6, 1, 1], [10, 4, 2, 0], [12, 2, 1, 1], [14, 4, 2, 0], [16, 4, 2, 0], [19, 6, 2, 0], [22, 7, 2, 0], [24, 9, 2, 0], [27, 7, 1, 1], [28, 6, 2, 0], [30, 4, 2, 1]],
        [[0, 7, 1, 0], [2, 7, 1, 1], [3, 6, 2, 0], [6, 4, 2, 0], [8, 6, 1, 0], [10, 6, 1, 1], [11, 4, 2, 0], [14, 2, 2, 0], [16, 4, 1, 0], [18, 4, 1, 1], [19, 2, 2, 0], [22, 0, 2, 0], [24, 2, 1, 0], [26, 2, 1, 1], [27, 4, 2, 0], [30, 6, 2, 1]],
        [[0, 2, 3, 0], [3, 4, 3, 0], [6, 6, 2, 0], [8, 7, 3, 0], [11, 6, 3, 0], [14, 4, 2, 0], [16, 2, 3, 0], [19, 4, 3, 0], [22, 6, 2, 0], [24, 4, 4, 0], [28, 2, 2, 1], [30, 1, 2, 1]],
      ],
      riff: [[0, 0, 2], [3, 0, 1], [6, 4, 2], [8, 2, 2], [11, 4, 1], [14, 6, 2]], comp: [2, 6, 10, 14],
    },
    // CANALS — dub. Few notes, long, late; a vibraphone into the echo. Tricks are an echoing guitar.
    canals: {
      sub: 4, oct: 0, toct: 1, harm: 4,
      lead: (t, m, v, dur) => I.vibes(t, m, v * 0.85, out(), Math.max(0.6, dur)),
      trick: (t, m, v) => I.chop(t, [m], v * 1.1, 0.2, 1.2, out(), 0.5),
      stab: (t, v) => I.skank(t, ch(3, 0), v * 1.1),
      bass: (t, m, d, v) => I.sub(t, m, d, v),
      perc: (c, v) => { if (c.s % 4 === 2) I.hat(c.t, v * 0.6); if (c.s === 8) I.rim(c.t, v * 0.9); if (c.s === 14) I.hat(c.t, v * 0.4, true); },
      land: (t, v) => { I.kick(t, v * 0.6, out(), 110, 45, 0.4); I.rim(t, v * 0.7); },
      push: (t, v) => I.rim(t, v * 0.5),
      licks: [
        [[2, 4, 4, 0], [8, 6, 2, 0], [10, 4, 4, 0], [18, 2, 4, 0], [24, 4, 2, 1], [26, 2, 2, 0], [28, 0, 4, 0]],
        [[0, 7, 6, 0], [8, 6, 2, 1], [10, 4, 2, 0], [14, 2, 2, 1], [16, 4, 6, 0], [26, 6, 2, 0], [28, 7, 4, 0]],
        [[4, 0, 2, 0], [6, 2, 2, 0], [8, 4, 6, 0], [20, 4, 2, 0], [22, 6, 2, 0], [24, 7, 6, 0]],
      ],
      riff: [[0, 0, 3], [6, 0, 1], [8, 4, 2], [11, 2, 3]], comp: [2, 6, 10, 14],
    },
    // OLD TOWN — manouche. Triplet arpeggios on a solo guitar with approach notes; glockenspiel for tricks.
    oldtown: {
      sub: 3, oct: 0, toct: 1, harm: 2,
      lead: (t, m, v) => I.pluck(t, m, v, out(), 1.3),
      trick: (t, m, v) => I.glock(t, m, v * 0.9),
      stab: (t, v) => { I.chop(t, ch(4, 0), v, 0.12, 1.2); I.accordion(t, ch(3, 0), 0.2, v * 0.7); },
      bass: (t, m, d, v) => I.upright(t, m, d, v),
      perc: (c, v) => { if (c.s % 3 === 0) I.brush(c.t, v * 0.7); else if (c.s % 3 === 2) I.brush(c.t, v * 0.35); },
      land: (t, v) => { I.accordion(t, ch(3, 0), 0.35, v * 1.1); I.upright(t, E.deg(0, -2), 0.4, v * 0.7); },
      push: (t, v) => I.brush(t, v * 0.5),
      licks: [
        [[0, 0, 1, 0], [1, 2, 1, 0], [2, 4, 1, 0], [3, 7, 2, 0], [5, 6.5, 1, 1], [6, 7, 1, 0], [7, 4, 1, 1], [8, 2, 1, 1], [9, 4, 3, 0], [12, 2, 1, 0], [13, 4, 1, 0], [14, 6, 1, 0], [15, 9, 2, 0], [17, 8, 1, 1], [18, 7, 1, 0], [19, 6, 1, 1], [20, 4, 1, 1], [21, 2, 3, 0]],
        [[0, 7, 2, 0], [2, 6, 1, 1], [3, 4, 2, 0], [5, 3.5, 1, 1], [6, 4, 1, 0], [7, 2, 1, 1], [8, 0, 1, 1], [9, 2, 3, 0], [12, 4, 2, 0], [14, 3.5, 1, 2], [15, 4, 1, 0], [16, 6, 1, 0], [17, 7, 1, 0], [18, 9, 3, 0], [21, 7, 3, 0]],
        [[0, 4, 3, 0], [3, 6, 1, 0], [4, 7, 1, 1], [5, 8, 1, 1], [6, 9, 3, 0], [9, 7, 2, 0], [11, 6.5, 1, 2], [12, 7, 3, 0], [15, 6, 1, 0], [16, 4, 1, 1], [17, 2, 1, 1], [18, 1.5, 1, 1], [19, 2, 2, 0], [21, 0, 3, 0]],
      ],
      riff: [[0, 0, 3], [3, 4, 3], [6, 0, 3], [9, 4, 2], [11, 6, 1]], comp: [0, 3, 6, 9],
    },
    // DOCKS — electro. An acid line that repeats and jumps the octave; metal for tricks; claps on your landings.
    docks: {
      sub: 4, oct: -1, toct: 0, harm: 7,
      lead: (t, m, v, dur, acc) => I.acid(t, m, Math.min(0.3, dur * 0.9), v * 0.8, !!acc),
      trick: (t, m, v) => I.metal(t, m, v * 0.55, out(), 0.3),
      stab: (t, v) => { I.skank(t, ch(3, 0), v); I.clap(t, v * 0.6); },
      bass: (t, m, d, v) => I.acid(t, m, d * 0.5, v * 0.6, true),
      perc: (c, v) => { if (c.s % 2 === 0) I.hat(c.t, v * 0.7, c.s % 8 === 6); },
      land: (t, v) => { I.kick(t, v * 0.7); I.clap(t, v * 0.4); },
      push: (t, v) => I.hat(t, v * 0.5),
      licks: [
        [[0, 0, 1, 0], [2, 0, 1, 1], [3, 7, 1, 0], [4, 0, 1, 1], [6, 1, 1, 0], [7, 0, 1, 2], [8, 0, 1, 0], [10, 7, 1, 1], [11, 6, 1, 0], [12, 0, 1, 1], [14, 4, 2, 0], [16, 0, 1, 0], [18, 0, 1, 1], [19, 7, 1, 0], [20, 0, 1, 1], [22, 1, 1, 0], [24, 2, 1, 0], [26, 1, 1, 1], [27, 0, 1, 0], [28, 7, 1, 1], [30, 6, 2, 0]],
        [[0, 4, 1, 0], [1, 4, 1, 2], [3, 2, 1, 0], [4, 4, 1, 1], [6, 7, 2, 0], [8, 4, 1, 0], [9, 4, 1, 2], [11, 2, 1, 0], [12, 1, 1, 1], [14, 0, 2, 0], [16, 4, 1, 0], [19, 6, 1, 0], [20, 4, 1, 1], [22, 7, 2, 0], [24, 9, 1, 0], [26, 7, 1, 1], [27, 6, 1, 0], [28, 4, 1, 1], [30, 2, 2, 0]],
        [[0, 0, 2, 0], [3, 2, 2, 0], [6, 4, 2, 0], [9, 7, 2, 0], [12, 4, 2, 0], [15, 2, 2, 0], [18, 0, 2, 0], [21, 1, 2, 0], [24, 2, 2, 0], [27, 4, 2, 0], [30, 7, 2, 0]],     // in threes against the four
      ],
      riff: [[0, 0, 1], [3, 0, 1], [6, 0, 1], [8, 7, 1], [11, 0, 1], [14, 1, 2]], comp: [4, 12],
    },
    // LAKESHORE — bossa. A nylon guitar that leans on the off-beats; kalimba for tricks; a soft chord to land on.
    lake: {
      sub: 4, oct: 0, toct: 1, harm: 5,
      lead: (t, m, v) => I.pluck(t, m, v * 0.9, out(), 0.7),
      trick: (t, m, v) => I.kalimba(t, m, v),
      stab: (t, v) => I.chop(t, ch(4, 0), v, 0.3, 0.8),
      bass: (t, m, d, v) => I.upright(t, m, d, v * 0.8),
      perc: (c, v) => { if (c.s % 2 === 0) I.shaker(c.t, v * 0.8); if ([0, 3, 6, 10, 13].includes(c.s)) I.rim(c.t, v * 0.7); },
      land: (t, v) => { I.softKick(t, v * 0.7); I.chop(t, ch(3, 0), v * 0.6, 0.3, 0.8); },
      push: (t, v) => I.rim(t, v * 0.35),
      licks: [
        [[0, 4, 3, 0], [3, 6, 3, 0], [6, 7, 4, 0], [10, 6, 2, 1], [12, 4, 3, 0], [16, 2, 3, 0], [19, 4, 3, 0], [22, 6, 4, 0], [26, 4, 2, 1], [28, 2, 4, 0]],
        [[2, 7, 2, 0], [4, 8, 2, 1], [6, 7, 2, 0], [8, 6, 3, 0], [11, 4, 5, 0], [18, 6, 2, 0], [20, 7, 2, 1], [22, 6, 2, 0], [24, 4, 3, 0], [27, 2, 5, 0]],
        [[0, 2, 2, 0], [2, 4, 1, 1], [3, 6, 3, 0], [8, 4, 2, 0], [10, 2, 1, 1], [11, 0, 3, 0], [16, 2, 2, 0], [18, 4, 1, 1], [19, 6, 3, 0], [22, 7, 2, 1], [24, 9, 3, 0], [27, 7, 4, 0]],
      ],
      riff: [[0, 0, 3], [3, 0, 1], [6, 4, 2], [8, 4, 3], [11, 4, 1], [14, 0, 2]], comp: [3, 6, 11, 14],
    },
    // OBSERVATORY — slow triplets. Bells, far apart; the pattern slips a step in its second bar. Music box for tricks.
    obs: {
      sub: 3, oct: 0, toct: 1, harm: 4,
      lead: (t, m, v) => I.bell(t, m, v * 0.6, out(), 1.3),
      trick: (t, m, v) => I.musicbox(t, m, v),
      stab: (t, v) => I.pad(t, ch(3, 0), 1.4, v * 0.9),
      bass: (t, m, d, v) => I.drone(t, m, d, v * 0.5),
      perc: (c, v) => { if (Math.random() < 0.4) I.crackle(c.t, v * 2); },
      land: (t, v) => I.bell(t, E.deg(0, -1), v * 0.8, out(), 2.5),
      push: (t, v, k) => I.kalimba(t, pitch(2 * (k % 3), 0), v * 0.4),
      licks: [
        [[0, 0, 2, 0], [2, 4, 2, 0], [4, 2, 2, 0], [6, 7, 2, 0], [8, 4, 2, 0], [10, 6, 2, 1], [13, 4, 2, 0], [15, 2, 2, 0], [17, 7, 2, 0], [19, 4, 2, 0], [21, 6, 2, 0], [23, 0, 1, 1]],
        [[0, 7, 3, 0], [3, 6, 3, 0], [6, 4, 6, 0], [12, 9, 3, 0], [15, 7, 3, 0], [18, 8, 6, 0]],
        [[0, 4, 1, 0], [1, 6, 1, 1], [2, 7, 4, 0], [6, 6, 1, 0], [7, 4, 1, 1], [8, 2, 4, 0], [12, 4, 1, 0], [13, 6, 1, 1], [14, 9, 4, 0], [18, 7, 1, 0], [19, 6, 1, 1], [20, 4, 4, 0]],
      ],
      riff: [[0, 0, 12]], comp: [0],
    },
  };
  // places inside a district (R.spots): the district's licks, another voice
  const PLACE = {
    crag: { lead: (t, m, v, dur) => I.flute(t, m, Math.max(0.15, dur * 0.9), v * 0.6), trick: (t, m, v) => I.kalimba(t, m, v) },
    site: { lead: (t, m, v) => I.metal(t, m, v * 0.45, out(), 0.35), trick: (t, m, v) => I.woodblock(t, m, v * 0.8), stab: (t, v) => { I.clank(t, v); I.skank(t, ch(3, 0), v * 0.7); } },
    skydeck: { lead: (t, m, v) => I.bell(t, m, v * 0.5, out(), 1.8), trick: (t, m, v) => I.glock(t, m, v * 0.8) },
  };

  // one figure per trick, in steps from the trick's note: the shape is the move
  const FIG = {
    '360 SPIN': [0, 1, 0, -1, 0],                    // once round the note
    'BACKFLIP': [4, 2, 0, -3, 0],                    // over backwards: down, under, back up
    'FRONTFLIP': [-3, 0, 2, 4, 7],                   // forwards: up and over
    'FLATSPIN 540': [0, 1, 0, -1, 0, 1, 2],          // one and a half times round, ending a third up
    'CORKSCREW': [0, 2, 1, 3, 2, 4],                 // twisting thirds
    'MISTY 720': [0, 1, -1, 0, 2, 3, 1, 2, 4],       // twice round, climbing
    'GRIND SWITCH': [4, 0],                          // a snap; it also turns the rail's tune upside down
    'FLAIL': [0, -0.5],                              // the note, then the wrong one next to it
  };

  // ---------- state ----------
  const G = { on: false, end: null, n: 0, seed: 0, voice: 'rail', h: 0, inv: false, i0: -1, scr: null };
  const M = { q: [], pushK: 0, pushT: -9, airN: 0, airTricks: 0, L: 0, last: '' };
  const cur = () => {
    const S = STYLE[E.dom.key] || STYLE.park, sp = E.R.spots || {};
    for (const k in PLACE) if ((sp[k] || 0) > 0.5) return Object.assign({}, S, PLACE[k]);
    return S;
  };
  // chord roots stay close together (−3…3 steps from the key note) so a lick doesn't leap when the chord changes
  const cd = () => ((E.H.deg % 7) + 10) % 7 - 3;
  function pitch(p, oct = 0, hi = 88) { const f = Math.ceil(p); return E.fold(E.deg(cd() + f, oct) - (f !== p ? 1 : 0), hi); }
  const lowp = (p) => { let m = E.deg(cd() + p, -2); while (m < 36) m += 12; while (m > 55) m -= 12; return m; };

  // ---------- the rail's own noise, tuned to the chord ----------
  function scrapeOn() {
    const x = E.ctx, src = x.createBufferSource(); src.buffer = E.noiseBuf; src.loop = true;
    const bp = x.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9; bp.frequency.value = 1200;
    const g = x.createGain(); g.gain.value = 0; src.connect(bp); bp.connect(g); g.connect(E.sfxOut); src.start();
    G.scr = { src, bp, g };
  }
  function scrapeOff() { if (!G.scr) return; const t = E.ctx.currentTime; G.scr.g.gain.setTargetAtTime(0, t, 0.05); G.scr.src.stop(t + 0.4); G.scr = null; }

  // ---------- grinding ----------
  function grindStart(info = {}) {
    if (!E.ctx) return;
    if (G.scr) scrapeOff();
    G.on = true; G.end = null; G.n = 0; G.i0 = -1; G.inv = false; G.voice = info.voice || 'rail'; G.h = info.h || 0; G.seed = Math.abs(info.seed | 0);
    if (G.voice !== 'cable') scrapeOn();
  }
  function grindEnd(q) { if (G.on) G.end = q || 'good'; G.on = false; scrapeOff(); }
  function cadence(c, q) {
    const S = c.S, bars = G.n / c.per, oct = S.oct + (G.h > 6 ? 1 : 0), hit = q === 'perfect';
    if (bars < 0.5) return;
    const fig = bars < 1.5 ? [7] : bars < 4 ? [8, 7] : [9, 8, 7], tl = c.t + (fig.length - 1) * c.sd;
    fig.forEach((p, j) => S.lead(c.t + j * c.sd, pitch(p, oct), j === fig.length - 1 ? 0.75 : 0.55, j === fig.length - 1 ? c.sd * 4 : c.sd, j === fig.length - 1));
    if (bars >= 4 || hit) { S.stab(tl, hit ? 0.6 : 0.45); S.bass(tl, lowp(0), c.sd * 4, 0.6); }
    if (hit) S.trick(tl, pitch(11, S.toct, 96), 0.3, c.sd * 3);
  }
  function grind(c) {
    const S = c.S, R = E.R;
    if (G.end) { const q = G.end; G.end = null; cadence(c, q); return; }
    if (!G.on || !R.grinding) return;
    const pos = (c.bar % 2) * c.per + c.s;
    if (G.i0 < 0) G.i0 = c.i - pos;                  // phrases are counted from the bar pair the grind began in
    G.n++; G.h = R.grindH ?? G.h;
    const sp = R.speed || 0, vc = G.voice, lvl = sp < 5 ? 0 : sp < 10 ? 1 : 2;
    const ph = Math.floor((c.i - G.i0) / (2 * c.per)), part = ph % 4;      // 0 the lick · 1 with a second voice · 2 a third higher · 3 with bass and stabs
    const licks = S.licks, lick = licks[(G.seed + Math.floor(ph / 4)) % licks.length];
    M.last = `lick ${(G.seed + Math.floor(ph / 4)) % licks.length + 1}, part ${part + 1}${G.inv ? ', upside down' : ''}`;
    // what runs under it
    const pv = 0.3 + Math.min(0.35, sp / 40);
    if (vc === 'metro') { if (c.s % 2 === 0) I.clack(c.t, c.s % c.S.sub === 0 ? 0.36 : 0.22); if (c.s === 0 && c.bar % 2 === 0) I.sub(c.t, lowp(0), c.sd * 7, 0.4); }
    else if (vc === 'cable') { if (c.s === 0 && c.bar % 2 === 0) I.waves(c.t, c.sd * c.per * 2, 0.45); }
    else S.perc(c, pv);
    if (G.scr) { G.scr.bp.frequency.setTargetAtTime(Math.min(5000, E.midiF(pitch(0, 2, 96)) * (1 + sp / 60)), c.t, 0.06); G.scr.g.gain.setTargetAtTime(Math.min(0.09, 0.015 + sp / 260), c.t, 0.08); }
    if (part >= 1 && c.s === 0 && vc !== 'cable') S.bass(c.t, lowp(0), c.sd * (part === 3 ? 3 : 6), 0.55);
    if (part === 3 && S.comp.includes(c.s) && vc !== 'cable' && vc !== 'balcony') S.stab(c.t, 0.3);
    // the tune
    const oct = S.oct + (G.h > 6 ? 1 : 0), up = part === 2 ? 2 : 0;
    for (const [st, p0, len, lv] of lick) {
      if (st !== pos || lv > lvl) continue;
      if ((vc === 'cable' || vc === 'balcony' || vc === 'metro') && lv > 0) continue;       // these rails keep to the plain line
      const p = (G.inv ? 8 - p0 : p0) + up, m = pitch(p, oct), dur = len * c.sd, strong = c.s % S.sub === 0;
      const v = U.clamp(0.35 + sp / 30, 0.35, 0.8) * (strong ? 1 : 0.82);
      if (vc === 'cable') { if (len >= 2) { I.pad(c.t, [m - 12, pitch(p + 2, oct - 1)], dur * 1.6, 1.3, out(), 1 + G.h / 30); I.bell(c.t, m + 12, 0.16, out(), 2); } continue; }
      if (vc === 'balcony') { I.musicbox(c.t, E.fold(m + 12, 96), v * 0.7); continue; }
      S.lead(c.t, m, vc === 'ledge' ? v * 0.75 : v, vc === 'ledge' ? dur * 0.5 : dur, strong);
      if (vc === 'pipe' && strong) I.metal(c.t, m - 12, v * 0.4, out(), 0.35);
      if (part >= 1 && lv === 0) S.lead(c.t, pitch(p + S.harm, oct), v * 0.4, dur, false);
    }
  }

  // ---------- tricks ----------
  function trick(n = 1, q = 'good', name = '360 SPIN', where = 'air') {
    if (!E.ctx) return;
    if (where === 'grind') G.inv = !G.inv; else M.airTricks++;
    M.q.push((c) => {
      const S = c.S, miss = q === 'miss', fig = miss ? FIG.FLAIL : (FIG[name] || FIG['360 SPIN']);
      const k = Math.max(0, n - 1), a = 2 * (k % 4) + 7 * (Math.floor(k / 4) % 2);     // a run climbs the chord, then the octave
      const last = fig.length - 1, tl = c.t + last * c.sd;
      fig.forEach((p, j) => {
        const t = c.t + j * c.sd, end = j === last;
        S.trick(t, pitch(a + p, S.toct, 93), (end ? 0.7 : 0.5) * (miss ? 0.6 : 1), end ? c.sd * 3 : c.sd * 0.9);
        if (n >= 3 && !miss && (end || j % 2 === 0)) S.trick(t, pitch(a + p + S.harm, S.toct, 93), 0.28, c.sd);
      });
      M.last = `${miss ? 'FLAIL' : name}, from chord tone ${k % 4 + 1}${n >= 3 && !miss ? ', harmonised' : ''}`;
      if (miss) { I.rim(c.t, 0.5); return; }
      if (q === 'perfect') S.trick(tl, pitch(a + fig[last] + 7, S.toct, 98), 0.26, c.sd * 3);
      if (n >= 5 || (q === 'perfect' && n >= 3)) S.stab(tl, 0.45);
      const ans = E.buskAnswer(c.sd * 4 / S.sub); if (ans) ans(c.t);
    });
  }

  // ---------- landing, pushing, jumping ----------
  const whoosh = (peak, f0, f1, dur) => { const t = E.ctx.currentTime + 0.005, g = E.gain(E.sfxOut, 0); E.env(g, t, 0.006, peak, dur); const f = E.filt('bandpass', f0, 1.5, g); f.frequency.exponentialRampToValueAtTime(f1, t + dur); E.noise(t, dur + 0.04, f); };
  function land(h = 1, info = {}) {
    if (!E.ctx) return;
    const t = E.ctx.currentTime + 0.005, g = E.gain(E.sfxOut, 0); E.env(g, t, 0.002, 0.22 * Math.min(1.3, h), 0.1);
    const o = E.osc('sine', 110, t, 0.13, g); o.frequency.exponentialRampToValueAtTime(50, t + 0.09);
    const combo = info.combo || 0, clean = info.clean !== false;
    M.airTricks = 0; M.airN = 0;
    if (h <= 0.5 && combo < 2) return;
    M.q.push((c) => {
      const S = c.S;
      if (!clean && combo >= 1) { I.rim(c.t, 0.6); S.trick(c.t, pitch(0, S.toct - 1), 0.3, c.sd); S.trick(c.t, pitch(-0.5, S.toct - 1), 0.3, c.sd); M.last = 'sloppy landing'; return; }
      if (combo >= 2) {
        S.stab(c.t, 0.45 + Math.min(0.35, combo * 0.07)); S.bass(c.t, lowp(0), c.sd * 4, 0.6);
        if (combo >= 4) [11, 9, 7].forEach((p, j) => S.trick(c.t + (j + 1) * c.sd, pitch(p, S.toct, 93), 0.4 + j * 0.08, j === 2 ? c.sd * 3 : c.sd));
        M.last = `clean landing after ${combo}`; return;
      }
      S.land(c.t, 0.5 * Math.min(1.3, h));
    });
  }
  function push(onBeat) {
    if (!E.ctx) return;
    whoosh(onBeat ? 0.12 : 0.07, 900, onBeat ? 3000 : 1400, 0.16);
    if (!onBeat) { M.pushK = 0; return; }
    const now = E.ctx.currentTime, spb = 60 / E.clk.bpm * E.dom.f;
    M.pushK = now - M.pushT < spb * 2.5 ? M.pushK + 1 : 0; M.pushT = now;
    const k = M.pushK; M.q.push((c) => c.S.push(c.t, 0.7, k));       // k: how many pushes in a row have been on the beat
  }
  function jump(onBeat) {
    if (!E.ctx) return;
    whoosh(0.25, 700, onBeat ? 2600 : 1600, 0.18);
    if (onBeat) M.q.push((c) => c.S.lead(c.t, pitch(4, c.S.oct + 1), 0.28, c.sd, false));
  }
  // a long jump with no tricks in it: chord tones climb on the beat until you come down
  function air(c) {
    const R = E.R;
    if (!R.air || (R.airTime || 0) < 0.9 || M.airTricks > 0) { if (!R.air) M.airN = 0; return; }
    if (c.s % c.S.sub !== 0) return;
    const n = M.airN++; c.S.lead(c.t, pitch(2 * (n % 4) + 7 * (Math.floor(n / 4) % 2), c.S.oct + 1, 93), Math.min(0.4, 0.2 + n * 0.03), c.sd * 2, false);
  }
  // a run of tricks and grinds without touching the ground: the district's bass riff, then its stabs
  function combo(c) {
    const S = c.S, target = U.clamp(((E.R.combo || 0) - 1) / 4, 0, 1);
    M.L += (target - M.L) * (target > M.L ? 0.3 : 0.03);
    const L = M.L; if (L < 0.08) return;
    if (L > 0.25) { for (const [st, p, len] of S.riff) if (st === c.s) S.bass(c.t, lowp(p), len * c.sd, L * 0.5); }
    else if (c.s === 0) S.bass(c.t, lowp(0), c.sd * 3, L * 0.5);
    if (L > 0.3 && !G.on) S.perc(c, L * 0.35);
    if (L > 0.6 && S.comp.includes(c.s) && !(G.on && Math.floor((c.i - G.i0) / (2 * c.per)) % 4 === 3)) S.stab(c.t, L * 0.3);
  }

  // ---------- the grid: the district's own (16ths, or triplets where the music is in triplets) ----------
  function tick(T, t, td) {
    const d = E.dom, S = cur(), stepT = E.TPB * d.f / S.sub;
    if (T % stepT !== 0) return;
    const i = T / stepT, per = d.beats * S.sub, s = i % per, sd = stepT * td;
    const c = { t: d.swing && S.sub === 4 && s % 2 === 1 ? t + d.swing * sd : t, s, bar: Math.floor(i / per), i, sd, per, S };
    while (M.q.length) { const f = M.q.shift(); try { f(c); } catch (e) { console.warn('moves', e); } }
    try { grind(c); combo(c); air(c); } catch (e) { console.warn('moves', e); }
  }
  // the other sounds that use a district's lead (hint, ripple, bounce) take the new one
  function install(engine) {
    E = engine; I = E.I;
    for (const k in STYLE) if (E.KIT[k]) { E.KIT[k].oldLead = E.KIT[k].oldLead || E.KIT[k].lead; }
  }
  function useLeads(on) { for (const k in STYLE) if (E.KIT[k]) E.KIT[k].lead = on ? (t, m, v, dur) => STYLE[k].lead(t, m, v, dur || 0.2, false) : E.KIT[k].oldLead; }
  return { STYLE, PLACE, FIG, G, M, install, useLeads, tick, grindStart, grindEnd, trick, land, push, jump, pitch };
})();
if (typeof module !== 'undefined') module.exports = MOVES;
