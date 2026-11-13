// ============================================================
//  MODEL KIT, part two — the skater, street furniture, vehicles.
//  Same format as kit.js (see README.md), plus two shapes:
//  cap [r, len] (a capsule, len = the straight part) and
//  torus [R, r] (ring radius, tube radius; lies in the x–y plane).
// ============================================================
(() => {
  const K = KIT, PI = Math.PI;
  const P = (s, size, at, col, o) => Object.assign({ s, size, at, col }, o || {});
  const base = K.TRIS; K.TRIS = (p) => p.s === 'cap' ? 112 : p.s === 'torus' ? 10 * (p.seg || 12) : base(p);
  const lift = K.lift;

  // ---------- the skater ----------
  // Parts per joint of the game's Rig (src/characters.js), in that joint's own frame, for scale 1. Joint pivots, as the
  // Rig has them: hips at the hip line; torso = hips + [0, .04, 0]; head = torso + [0, .78, 0]; arm = torso + [±.31, .5, 0];
  // fore = arm + [0, -.31, 0]; leg = hips + [±.12, -.05, 0]; shin = leg + [0, -.42, 0]; skate = shin + [0, -.40, 0].
  // Left and right use the same lists; a part with `side: true` has its x mirrored on the other side.
  // The face stays the game's own (a drawn texture on the front of the skull); the antenna tip is `antTip`.
  K.SKATER = {
    pivots: { torso: [0, 0.04, 0], head: [0, 0.78, 0], arm: [0.31, 0.5, 0], fore: [0, -0.31, 0], leg: [0.12, -0.05, 0], shin: [0, -0.42, 0], skate: [0, -0.40, 0] },
    hips: [P('sph', [0.2], [0, 0, 0], 'pants'), P('cyl', [0.232, 0.24, 0.13], [0, 0.15, 0], 'shirt', { scale: [1.05, 1, 0.84], seg: 12 }), P('cyl', [0.218, 0.218, 0.06], [0, 0.07, 0], 'ink', { scale: [1.04, 1, 0.9], seg: 12 }), P('box', [0.08, 0.07, 0.03], [0, 0.07, 0.195], 'accent')],
    torso: [
      P('cap', [0.24, 0.26], [0, 0.3, 0], 'jacket', { scale: [1.08, 1, 0.82] }),
      P('cyl', [0.262, 0.268, 0.08], [0, 0.13, 0], 'accent', { scale: [1.08, 1, 0.82], seg: 12 }),           // the cropped jacket's hem
      P('box', [0.03, 0.4, 0.02], [0, 0.33, 0.2], 'ink'), P('box', [0.13, 0.1, 0.02], [-0.12, 0.38, 0.19], 'accent'),   // zip, chest badge
      P('sph', [0.19], [0, 0.58, -0.15], 'jacket2', { scale: [1.15, 0.7, 0.9], opt: 'hood' }),                             // hood, down
      P('torus', [0.17, 0.06], [0, 0.58, 0], 'accent', { rot: [PI / 2, 0, 0], seg: 14 }),                    // collar
      P('cyl', [0.07, 0.08, 0.14], [0, 0.66, 0], 'skin', { seg: 8 }),
      // the radio on the back: speaker, dials, antenna
      P('box', [0.4, 0.44, 0.2], [0, 0.34, -0.28], 'radio', { opt: 'radio' }), P('box', [0.42, 0.06, 0.22], [0, 0.55, -0.28], 'ink', { opt: 'radio' }),
      P('cyl', [0.115, 0.115, 0.03], [-0.07, 0.3, -0.385], 'ink', { opt: 'radio', rot: [PI / 2, 0, 0], seg: 10 }), P('cyl', [0.07, 0.07, 0.035], [-0.07, 0.3, -0.39], 'radio2', { opt: 'radio', rot: [PI / 2, 0, 0], seg: 10 }),
      P('cyl', [0.03, 0.03, 0.04], [0.1, 0.42, -0.385], 'accent', { opt: 'radio', rot: [PI / 2, 0, 0], seg: 6 }), P('cyl', [0.03, 0.03, 0.04], [0.1, 0.32, -0.385], 'accent', { opt: 'radio', rot: [PI / 2, 0, 0], seg: 6 }), P('box', [0.1, 0.035, 0.02], [0.1, 0.22, -0.385], 'radio2', { opt: 'radio' }),
      P('cyl', [0.012, 0.012, 0.6], [0.14, 0.82, -0.3], 'ink', { opt: 'radio', rot: [0, 0, -0.25], seg: 5 }), P('sph', [0.04], [0.21, 1.1, -0.3], 'glow', { opt: 'radio', id: 'antTip', seg: 6 }),
      P('box', [0.05, 0.4, 0.03], [-0.14, 0.36, 0.195], 'ink', { opt: 'radio', rot: [0.1, 0, 0] }), P('box', [0.05, 0.4, 0.03], [0.14, 0.36, 0.195], 'ink', { opt: 'radio', rot: [0.1, 0, 0] }),
    ],
    head: [
      P('sph', [0.21], [0, 0, 0], 'skin', { scale: [1, 1.05, 0.98], seg: 14, id: 'skull' }),
      P('dome', [0.222], [0, 0.03, -0.01], 'hair', { opt: 'hair', scale: [1.02, 1, 1.06], seg: 12 }), P('box', [0.3, 0.085, 0.1], [0.03, 0.13, 0.175], 'hair', { opt: 'hair', rot: [0, 0, 0.16] }),
      P('cone', [0.085, 0.2], [0.06, 0.24, 0.06], 'hair', { opt: 'hair', rot: [0.5, 0, -0.35] }), P('cone', [0.08, 0.2], [-0.06, 0.25, -0.02], 'hair', { opt: 'hair', rot: [-0.2, 0, 0.3] }), P('cone', [0.09, 0.22], [0, 0.14, -0.21], 'hair', { opt: 'hair', rot: [-1.9, 0, 0] }),
      // headphones
      P('torus', [0.218, 0.028], [0, 0.01, -0.01], 'ink', { seg: 14, opt: 'phones' }), P('cyl', [0.085, 0.085, 0.07], [-0.222, -0.01, -0.01], 'accent', { rot: [0, 0, PI / 2], seg: 10, opt: 'phones' }), P('cyl', [0.085, 0.085, 0.07], [0.222, -0.01, -0.01], 'accent', { rot: [0, 0, PI / 2], seg: 10, opt: 'phones' }),
    ],
    arm: [P('cap', [0.078, 0.2], [0, -0.15, 0], 'jacket'), P('sph', [0.1], [0, -0.02, 0], 'accent', { scale: [1, 0.7, 1], seg: 8 })],
    fore: [P('cap', [0.066, 0.18], [0, -0.13, 0], 'sleeve'), P('cyl', [0.076, 0.072, 0.09], [0, -0.235, 0], 'ink', { seg: 8 }), P('box', [0.07, 0.1, 0.03], [0, -0.245, 0.062], 'accent'), P('sph', [0.075], [0, -0.3, 0], 'glove', { seg: 8 })],
    leg: [P('cap', [0.105, 0.32], [0, -0.21, 0], 'pants'), P('box', [0.07, 0.15, 0.13], [0.105, -0.27, 0], 'pants2', { side: true })],
    shin: [P('cyl', [0.095, 0.128, 0.37], [0, -0.2, 0], 'pants', { seg: 10 }), P('sph', [0.088], [0, -0.02, 0.07], 'ink', { scale: [1, 1.1, 0.6], seg: 8 }), P('box', [0.1, 0.06, 0.03], [0, -0.02, 0.125], 'accent')],
    skate: [
      P('box', [0.17, 0.2, 0.32], [0, -0.05, 0.04], 'boot'), P('box', [0.176, 0.11, 0.1], [0, -0.095, 0.155], 'boot2'), P('cyl', [0.1, 0.11, 0.1], [0, 0.04, 0], 'boot2', { seg: 10 }),
      P('box', [0.182, 0.035, 0.2], [0, 0.005, 0.03], 'accent'), P('box', [0.182, 0.035, 0.22], [0, -0.07, 0.05], 'accent'),
      P('box', [0.05, 0.06, 0.37], [0, -0.165, 0.04], 'frame'), P('box', [0.07, 0.06, 0.06], [0, -0.17, -0.165], 'ink'),
      ...[0, 1, 2, 3].map(i => P('cyl', [0.05, 0.05, 0.04], [0, -0.195, -0.105 + i * 0.097], 'wheels', { rot: [0, 0, PI / 2], seg: 10 })),
    ],
    looks: [
      { name: 'Signal', note: 'The game\'s present colours', c: { jacket: '#3f8f7a', jacket2: '#357a68', sleeve: '#3f8f7a', accent: '#f2c14e', shirt: '#f6f1e7', pants: '#2a2f45', pants2: '#353b55', boot: '#e9e4f5', boot2: '#c9c4d8', frame: '#3a3550', wheels: '#e4572e', radio: '#e4572e', radio2: '#f2c14e', hair: '#1f1a18', skin: '#d9a07a', glove: '#1d1a26', ink: '#1d1a26', glow: '#ff5ab0' } },
      { name: 'Ember', note: 'Red jacket, cream trim', c: { jacket: '#e4572e', jacket2: '#c4452a', sleeve: '#f6f1e7', accent: '#f6f1e7', shirt: '#1d1a26', pants: '#3a3550', pants2: '#474262', boot: '#1d1a26', boot2: '#3a3550', frame: '#c9c4d8', wheels: '#f2c14e', radio: '#2f8f9d', radio2: '#f6f1e7', hair: '#7a2f1f', skin: '#f0c8a0', glove: '#f6f1e7', ink: '#1d1a26', glow: '#7fd3ff' } },
      { name: 'Night bus', note: 'Violet, ice blue, pink wheels', c: { jacket: '#8a5a9e', jacket2: '#734a85', sleeve: '#1f1f28', accent: '#7fd3ff', shirt: '#f6f1e7', pants: '#1f1f28', pants2: '#2c2c38', boot: '#f6f1e7', boot2: '#7fd3ff', frame: '#1d1a26', wheels: '#ff5a8a', radio: '#f2c14e', radio2: '#1d1a26', hair: '#e8e2d4', skin: '#7a4a32', glove: '#7fd3ff', ink: '#1d1a26', glow: '#ff5a8a' } },
    ],
  };
  K.skaterTris = () => { const S = K.SKATER, n = (L) => L.reduce((s, q) => s + K.TRIS(q), 0); return n(S.hips) + n(S.torso) + n(S.head) + 2 * (n(S.arm) + n(S.fore) + n(S.leg) + n(S.shin) + n(S.skate)); };

  // ---------- street furniture ----------
  // Static pieces: origin on the ground, front to +z. Tags as for houses, plus 'light' (it glows at night, hang a pool of light under it).
  const SP = K.STREET_PAL = { iron: '#2a2838', wood: '#8a6a4a', wood2: '#a07a4a', stone: '#b9b0a0', glass: '#9fc4d8', lamp: '#ffe2a6', red: '#c4302b', green: '#2f5f4a', yellow: '#f2c14e', cream: '#f4ecd8', blue: '#2f6f9d', dark: '#1b1a24', leaf: '#5a9a52', leaf2: '#6fb25e', tyre: '#1b1a24', steel: '#c9d2da', soil: '#5a4030', banner: '#e4572e', amber: '#f2a03a', go: '#4ac06a' };
  const F = {};
  F.bench = () => { const q = [P('box', [1.7, 0.06, 0.46], [0, 0.44, 0], 'wood', { tag: 'solid' })];
    for (const z of [-0.15, 0, 0.15]) q.push(P('box', [1.72, 0.035, 0.12], [0, 0.475, z], 'wood2'));
    for (const [y, tg] of [[0.66, 0], [0.8, 0], [0.94, 1]]) q.push(P('box', [1.72, 0.11, 0.035], [0, y, -0.25 - (y - 0.6) * 0.16], 'wood2', Object.assign({ rot: [-0.16, 0, 0] }, tg ? { tag: 'grind' } : {})));
    for (const s of [-1, 1]) q.push(P('box', [0.06, 0.44, 0.06], [s * 0.76, 0.22, 0.18], 'iron'), P('box', [0.06, 1.0, 0.06], [s * 0.76, 0.5, -0.24], 'iron', { rot: [-0.14, 0, 0] }), P('box', [0.06, 0.05, 0.5], [s * 0.76, 0.66, 0], 'iron'), P('box', [0.06, 0.05, 0.46], [s * 0.76, 0.1, -0.02], 'iron'));
    return q; };
  F.lantern = () => [P('cyl', [0.15, 0.2, 0.34], [0, 0.17, 0], 'iron'), P('cyl', [0.055, 0.08, 3.1], [0, 1.85, 0], 'iron', { seg: 6 }), P('cyl', [0.1, 0.1, 0.07], [0, 0.9, 0], 'iron', { seg: 6 }),
    P('box', [0.05, 0.05, 0.75], [0, 3.36, 0.34], 'iron'), P('box', [0.04, 0.5, 0.04], [0, 3.14, 0.2], 'iron', { rot: [0.9, 0, 0] }), P('box', [0.03, 0.2, 0.03], [0, 3.26, 0.68], 'iron'),
    P('box', [0.26, 0.36, 0.26], [0, 2.98, 0.68], 'lamp', { tag: 'light' }), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => P('box', [0.035, 0.4, 0.035], [a * 0.135, 2.98, 0.68 + b * 0.135], 'iron')),
    P('box', [0.34, 0.04, 0.34], [0, 2.79, 0.68], 'iron'), P('cone', [0.27, 0.2], [0, 3.26, 0.68], 'iron', { seg: 4, rot: [0, PI / 4, 0] })];
  F.streetlamp = () => [P('cyl', [0.16, 0.2, 0.5], [0, 0.25, 0], 'dark'), P('cyl', [0.065, 0.11, 6.2], [0, 3.1, 0], 'dark', { seg: 6 }),
    ...[-1, 1].flatMap(s => [P('box', [1.3, 0.07, 0.1], [s * 0.66, 6.1, 0], 'dark', { rot: [0, 0, s * 0.1] }), P('box', [0.55, 0.08, 0.26], [s * 1.2, 6.14, 0], 'dark'), P('box', [0.48, 0.03, 0.2], [s * 1.2, 6.09, 0], 'lamp', { tag: 'light' })]),
    P('box', [0.04, 0.04, 0.7], [0, 4.5, 0.36], 'dark'), P('box', [0.03, 1.5, 0.62], [0, 3.72, 0.38], 'banner', { sign: true }), P('box', [0.04, 0.04, 0.7], [0, 2.95, 0.36], 'dark')];
  F.bin = () => [P('cyl', [0.27, 0.23, 0.78], [0, 0.45, 0], 'green', { seg: 10, tag: 'solid' }), P('cyl', [0.29, 0.29, 0.07], [0, 0.86, 0], 'dark', { seg: 10 }), P('cyl', [0.272, 0.262, 0.1], [0, 0.6, 0], 'cream', { seg: 10 }), P('cyl', [0.2, 0.2, 0.02], [0, 0.9, 0], 'dark', { seg: 10 }), P('cyl', [0.2, 0.22, 0.06], [0, 0.03, 0], 'dark', { seg: 10 })];
  F.bollards = () => { const q = []; for (const x of [-1, 1]) q.push(P('cyl', [0.085, 0.11, 0.8], [x, 0.4, 0], 'iron', { tag: 'solid' }), P('sph', [0.1], [x, 0.85, 0], 'iron', { seg: 6 }), P('cyl', [0.1, 0.1, 0.05], [x, 0.66, 0], 'cream', { seg: 8 }));
    for (const [x, y, a] of [[-0.62, 0.6, 0.38], [0, 0.52, 0], [0.62, 0.6, -0.38]]) q.push(P('box', [0.68, 0.035, 0.035], [x, y, 0], 'iron', { rot: [0, 0, -a] })); return q; };
  F.postbox = () => [P('cyl', [0.06, 0.08, 0.95], [0, 0.475, 0], 'dark', { seg: 6 }), P('box', [0.52, 0.7, 0.36], [0, 1.3, 0], 'yellow', { tag: 'solid' }), P('box', [0.56, 0.06, 0.4], [0, 1.67, 0], 'dark'), P('box', [0.34, 0.04, 0.02], [0, 1.47, 0.185], 'dark'), P('box', [0.3, 0.22, 0.015], [0, 1.2, 0.185], 'cream'), P('box', [0.1, 0.06, 0.02], [0, 1.02, 0.185], 'dark')];
  // a finger post: one board per district, each in that district's colour (point them with rot y)
  F.fingerpost = () => [P('cyl', [0.05, 0.065, 3.1], [0, 1.55, 0], 'dark', { seg: 6 }), P('sph', [0.09], [0, 3.16, 0], 'yellow', { seg: 6 }), P('cyl', [0.14, 0.18, 0.2], [0, 0.1, 0], 'dark'),
    ...[['red', 2.9, 0.3], ['blue', 2.66, 2.2], ['green', 2.42, -1.3], ['yellow', 2.18, 3.6]].flatMap(([c, y, a]) => [P('box', [0.95, 0.19, 0.03], [Math.cos(a) * 0.5, y, -Math.sin(a) * 0.5], c, { rot: [0, a, 0], sign: true }), P('box', [0.16, 0.14, 0.035], [Math.cos(a) * 1.02, y, -Math.sin(a) * 1.02], c, { rot: [0, a, PI / 4] })])];
  F.kiosk = () => { const q = [P('box', [2.2, 2.3, 1.7], [0, 1.15, 0], 'green', { tag: 'solid' }), P('box', [1.7, 0.95, 0.06], [0, 1.55, 0.83], 'dark'), P('box', [1.9, 0.08, 0.4], [0, 1.05, 0.95], 'wood2'), P('box', [2.3, 0.4, 1.8], [0, 2.5, 0], 'cream', { sign: true }), P('box', [2.7, 0.1, 2.2], [0, 2.75, 0], 'green'), P('cone', [1.2, 0.7], [0, 3.15, 0], 'green', { seg: 6 }), P('sph', [0.12], [0, 3.55, 0], 'yellow', { seg: 6 }),
      P('box', [2.0, 0.05, 1.0], [0, 2.2, 1.3], 'red', { rot: [0.3, 0, 0], tag: 'bounce' }), P('box', [0.5, 0.055, 1.0], [-0.5, 2.202, 1.3], 'cream', { rot: [0.3, 0, 0] }), P('box', [0.5, 0.055, 1.0], [0.5, 2.202, 1.3], 'cream', { rot: [0.3, 0, 0] })];
    ['red', 'yellow', 'blue', 'cream', 'amber'].forEach((c, i) => q.push(P('box', [0.26, 0.36, 0.04], [-0.7 + i * 0.35, 0.72, 0.87], c, { rot: [-0.15, 0, 0] }))); return q; };
  F.shelter = () => { const q = [P('box', [4.2, 0.1, 1.9], [0, 2.55, 0.1], 'dark', { rot: [0.05, 0, 0], tag: 'solid' }), P('box', [4.0, 1.7, 0.04], [0, 1.5, -0.7], 'glass'), P('box', [0.04, 1.7, 1.2], [-1.98, 1.5, -0.1], 'glass'), P('box', [1.0, 1.4, 0.05], [1.4, 1.5, -0.66], 'cream', { sign: true }), P('box', [3.0, 0.06, 0.4], [-0.3, 0.5, -0.45], 'wood2', { tag: 'solid' })];
    for (const [x, z] of [[-2, -0.72], [2, -0.72], [-2, 0.6], [2, 0.6]]) q.push(P('box', [0.08, 2.5, 0.08], [x, 1.25, z], 'dark'));
    for (const x of [-1.6, 1.0]) q.push(P('box', [0.06, 0.5, 0.06], [x, 0.25, -0.45], 'dark'));
    q.push(P('cyl', [0.04, 0.05, 2.8], [2.6, 1.4, 0.7], 'dark', { seg: 6 }), P('cyl', [0.3, 0.3, 0.05], [2.6, 2.75, 0.7], 'yellow', { rot: [PI / 2, 0, 0], seg: 10, sign: true }), P('box', [0.34, 0.46, 0.04], [2.6, 1.7, 0.7], 'cream')); return q; };
  F.cafe = () => { const q = [P('cyl', [0.42, 0.42, 0.035], [0, 0.74, 0], 'cream', { seg: 10, tag: 'solid' }), P('cyl', [0.035, 0.035, 0.72], [0, 0.37, 0], 'iron', { seg: 5 }), P('cyl', [0.24, 0.26, 0.03], [0, 0.015, 0], 'iron', { seg: 8 }),
      P('cyl', [0.025, 0.025, 2.5], [0, 1.25, 0], 'wood', { seg: 5 }), P('cone', [1.35, 0.5], [0, 2.5, 0], 'red', { seg: 8, tag: 'bounce' }), P('cyl', [1.36, 1.36, 0.14], [0, 2.2, 0], 'cream', { seg: 8 }), P('sph', [0.05], [0, 2.78, 0], 'wood', { seg: 5 })];
    for (const a of [0.5, 3.4]) { const c = [P('box', [0.4, 0.04, 0.4], [0, 0.45, 0], 'blue'), P('box', [0.4, 0.34, 0.035], [0, 0.72, -0.19], 'blue', { rot: [-0.12, 0, 0] })]; for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.push(P('box', [0.03, z < 0 ? 0.9 : 0.45, 0.03], [x * 0.18, z < 0 ? 0.45 : 0.225, z * 0.18], 'iron')); q.push(...lift(c, Math.sin(a) * 0.75, 0, Math.cos(a) * 0.75, a + PI)); }
    return q; };
  F.bikes = () => { const q = []; for (const x of [-0.7, 0, 0.7]) q.push(P('box', [0.05, 0.8, 0.05], [x, 0.4, -0.3], 'steel'), P('box', [0.05, 0.8, 0.05], [x, 0.4, 0.3], 'steel'), P('box', [0.05, 0.05, 0.65], [x, 0.8, 0], 'steel', { tag: 'grind' }));
    const b = [P('torus', [0.33, 0.025], [0, 0.36, 0.52], 'tyre', { rot: [0, PI / 2, 0] }), P('torus', [0.33, 0.025], [0, 0.36, -0.52], 'tyre', { rot: [0, PI / 2, 0] }),
      P('box', [0.035, 0.035, 0.62], [0, 0.72, 0.04], 'red'), P('box', [0.035, 0.6, 0.035], [0, 0.56, 0.3], 'red', { rot: [0.5, 0, 0] }), P('box', [0.035, 0.56, 0.035], [0, 0.58, -0.2], 'red', { rot: [-0.25, 0, 0] }), P('box', [0.03, 0.03, 0.42], [0, 0.36, -0.32], 'red'), P('box', [0.03, 0.5, 0.03], [0, 0.6, 0.5], 'steel', { rot: [-0.3, 0, 0] }),
      P('box', [0.46, 0.03, 0.03], [0, 0.98, 0.4], 'dark'), P('box', [0.1, 0.05, 0.24], [0, 0.9, -0.28], 'dark'), P('box', [0.03, 0.2, 0.03], [0, 0.8, -0.27], 'steel')];
    q.push(...lift(b, 0.36, 0, 0, 0.12).map(p => Object.assign(p, { rot: [p.rot[0], p.rot[1], (p.rot[2] || 0) + 0.12] }))); return q; };
  F.hydrant = () => [P('cyl', [0.17, 0.19, 0.08], [0, 0.04, 0], 'red', { seg: 8 }), P('cyl', [0.12, 0.13, 0.58], [0, 0.37, 0], 'red', { seg: 8, tag: 'solid' }), P('cyl', [0.15, 0.15, 0.06], [0, 0.6, 0], 'red', { seg: 8 }), P('dome', [0.13], [0, 0.63, 0], 'red', { seg: 8 }), P('cyl', [0.04, 0.04, 0.06], [0, 0.79, 0], 'steel', { seg: 5 }),
    P('cyl', [0.06, 0.06, 0.4], [0, 0.42, 0], 'red', { rot: [0, 0, PI / 2], seg: 6 }), P('cyl', [0.07, 0.07, 0.1], [0, 0.42, 0.13], 'steel', { rot: [PI / 2, 0, 0], seg: 6 })];
  F.trafficlight = () => { const q = [P('cyl', [0.13, 0.16, 0.4], [0, 0.2, 0], 'dark'), P('cyl', [0.06, 0.07, 3.3], [0, 1.65, 0], 'dark', { seg: 6 }), P('box', [0.32, 0.9, 0.26], [0, 3.1, 0.12], 'dark'), P('box', [0.26, 0.4, 0.2], [0, 2.1, 0.12], 'dark'), P('box', [0.16, 0.16, 0.02], [0, 2.18, 0.225], 'red'), P('box', [0.16, 0.16, 0.02], [0, 2.0, 0.225], 'go', { tag: 'light' })];
    ['red', 'amber', 'go'].forEach((c, i) => q.push(P('cyl', [0.1, 0.1, 0.03], [0, 3.38 - i * 0.28, 0.255], c, { rot: [PI / 2, 0, 0], seg: 8, tag: 'light' }), P('box', [0.24, 0.03, 0.14], [0, 3.49 - i * 0.28, 0.3], 'dark'))); return q; };
  F.planter = () => { const q = [P('box', [1.4, 0.6, 1.4], [0, 0.3, 0], 'wood', { tag: 'solid' }), P('box', [1.24, 0.04, 1.24], [0, 0.6, 0], 'soil'), P('cyl', [0.1, 0.14, 2.3], [0, 1.75, 0], 'wood', { seg: 6 }), P('ico', [1.0], [0, 3.2, 0], 'leaf', { scale: [1.1, 0.9, 1.1] }), P('ico', [0.7], [0.5, 2.8, 0.3], 'leaf2'), P('ico', [0.65], [-0.45, 3.0, -0.35], 'leaf2'), P('ico', [0.55], [-0.1, 3.9, 0.1], 'leaf2')];
    for (const [a, b, c, e] of [[1.5, 0.12, 0, 0.7], [1.5, 0.12, 0, -0.7], [0.12, 1.5, 0.7, 0], [0.12, 1.5, -0.7, 0]]) q.push(P('box', [a, 0.09, b], [c, 0.64, e], 'wood2', { tag: 'grind' })); return q; };
  K.FURNITURE = [['Bench', F.bench, 'Slatted wood on iron; the top of the back grinds'], ['Old-town lantern', F.lantern, 'Old town, canals'], ['Street lamp with banner', F.streetlamp, 'Downtown; the banner takes the district\'s colour'], ['Finger post', F.fingerpost, 'One board per district, at crossroads'],
    ['Kiosk', F.kiosk, 'Squares, station forecourts'], ['Tram shelter', F.shelter, 'Roof is solid; its edge could grind'], ['Café table', F.cafe, 'The parasol bounces'], ['Bike rack', F.bikes, 'Hoops grind'],
    ['Tree in a planter', F.planter, 'The rim grinds'], ['Litter bin', F.bin, ''], ['Bollards and chain', F.bollards, ''], ['Post box', F.postbox, ''], ['Hydrant', F.hydrant, ''], ['Traffic light', F.trafficlight, 'Downtown crossings']];

  // ---------- vehicles ----------
  // Rigid, instanced (instKit in src/city/life.js): parts whose col is 'paint' take the vehicle's own colour, the rest are fixed.
  // Origin on the road under the middle; the nose points to +z. `box` is the body for collision: [w, h, l].
  const wheels = (hw, zs, r = 0.33) => zs.flatMap(z => [-1, 1].flatMap(s => [P('cyl', [r, r, 0.24], [s * hw, r, z], '#1b1a24', { rot: [0, 0, PI / 2], seg: 10 }), P('cyl', [r * 0.5, r * 0.5, 0.25], [s * hw, r, z], '#c9c2b4', { rot: [0, 0, PI / 2], seg: 6 })]));
  const lights = (hw, y, zf, zb) => [-1, 1].flatMap(s => [P('box', [0.36, 0.17, 0.06], [s * hw, y, zf], '#fff3c4', { tag: 'light' }), P('box', [0.34, 0.15, 0.06], [s * hw, y, zb], '#ff3a3a')]);
  const GL = '#2a3550', BUMP = '#3a3a42';
  const V = {};
  V.city = () => [P('box', [1.72, 0.6, 3.5], [0, 0.66, 0], 'paint'), P('box', [1.66, 0.16, 0.95], [0, 1.0, 1.2], 'paint', { rot: [0.13, 0, 0] }), P('box', [1.6, 0.6, 1.9], [0, 1.28, -0.4], 'paint'), P('box', [1.64, 0.4, 1.72], [0, 1.3, -0.4], GL),
    P('box', [1.46, 0.52, 0.06], [0, 1.27, 0.62], GL, { rot: [-0.5, 0, 0] }), P('box', [1.5, 0.06, 1.6], [0, 1.6, -0.45], 'paint'), P('box', [1.78, 0.2, 0.16], [0, 0.44, 1.74], BUMP), P('box', [1.78, 0.2, 0.16], [0, 0.44, -1.74], BUMP),
    P('box', [0.5, 0.12, 0.03], [0, 0.6, 1.83], '#f6f1e7'), P('box', [0.12, 0.09, 0.16], [-0.92, 1.12, 0.5], 'paint'), P('box', [0.12, 0.09, 0.16], [0.92, 1.12, 0.5], 'paint'), ...lights(0.58, 0.78, 1.75, -1.75), ...wheels(0.82, [1.12, -1.12], 0.31)];
  V.saloon = (taxi) => [P('box', [1.84, 0.58, 4.4], [0, 0.68, 0], 'paint'), P('box', [1.66, 0.56, 2.1], [0, 1.25, -0.25], 'paint'), P('box', [1.7, 0.38, 1.9], [0, 1.27, -0.25], GL), P('box', [1.5, 0.56, 0.06], [0, 1.22, 0.9], GL, { rot: [-0.62, 0, 0] }), P('box', [1.5, 0.52, 0.06], [0, 1.22, -1.38], GL, { rot: [0.7, 0, 0] }),
    P('box', [1.56, 0.06, 1.7], [0, 1.55, -0.25], 'paint'), P('box', [1.9, 0.2, 0.16], [0, 0.46, 2.2], BUMP), P('box', [1.9, 0.2, 0.16], [0, 0.46, -2.2], BUMP), P('box', [1.86, 0.07, 4.2], [0, 0.6, 0], BUMP), P('box', [0.9, 0.2, 0.05], [0, 0.72, 2.21], BUMP),
    P('box', [0.5, 0.12, 0.03], [0, 0.58, 2.29], '#f6f1e7'), P('box', [0.12, 0.09, 0.16], [-0.98, 1.1, 0.75], 'paint'), P('box', [0.12, 0.09, 0.16], [0.98, 1.1, 0.75], 'paint'), ...lights(0.64, 0.8, 2.2, -2.2), ...wheels(0.88, [1.4, -1.4]),
    ...(taxi ? [P('box', [0.56, 0.17, 0.22], [0, 1.67, -0.1], '#fff3c4', { tag: 'light', sign: true }), P('box', [1.86, 0.14, 2.0], [0, 0.82, -0.1], '#1b1a24')] : [])];
  V.van = () => [P('box', [2.0, 1.75, 3.3], [0, 1.3, -0.75], 'paint'), P('box', [2.0, 0.85, 1.5], [0, 0.86, 1.6], 'paint'), P('box', [1.9, 0.75, 1.0], [0, 1.6, 1.25], 'paint'), P('box', [1.94, 0.5, 0.8], [0, 1.66, 1.3], GL), P('box', [1.76, 0.7, 0.06], [0, 1.6, 1.84], GL, { rot: [-0.42, 0, 0] }),
    P('box', [2.04, 0.5, 2.6], [0, 1.5, -0.8], '#f6f1e7', { sign: true }), P('box', [2.02, 0.04, 3.2], [0, 0.62, -0.75], BUMP), P('box', [2.06, 0.22, 0.16], [0, 0.46, 2.36], BUMP), P('box', [2.06, 0.22, 0.16], [0, 0.46, -2.42], BUMP), P('box', [0.04, 1.5, 0.04], [1.01, 1.3, -0.05], BUMP), P('box', [0.04, 1.5, 0.04], [-1.01, 1.3, -0.05], BUMP),
    P('box', [1.6, 0.06, 2.6], [0, 2.24, -0.8], BUMP), P('box', [0.14, 0.1, 0.18], [-1.08, 1.5, 1.7], BUMP), P('box', [0.14, 0.1, 0.18], [1.08, 1.5, 1.7], BUMP), ...lights(0.7, 0.86, 2.36, -2.42), ...wheels(0.94, [1.5, -1.6], 0.36)];
  V.pickup = () => { const q = [P('box', [1.92, 0.6, 4.9], [0, 0.78, 0], 'paint'), P('box', [1.8, 0.7, 1.7], [0, 1.42, 0.55], 'paint'), P('box', [1.84, 0.46, 1.5], [0, 1.46, 0.55], GL), P('box', [1.6, 0.6, 0.06], [0, 1.4, 1.5], GL, { rot: [-0.45, 0, 0] }), P('box', [1.7, 0.06, 1.4], [0, 1.8, 0.5], 'paint'),
      P('box', [0.1, 0.4, 2.1], [-0.91, 1.26, -1.35], 'paint'), P('box', [0.1, 0.4, 2.1], [0.91, 1.26, -1.35], 'paint'), P('box', [1.92, 0.4, 0.1], [0, 1.26, -2.4], 'paint'), P('box', [1.72, 0.04, 2.0], [0, 1.1, -1.35], BUMP),
      P('box', [1.98, 0.22, 0.18], [0, 0.52, 2.46], BUMP), P('box', [1.98, 0.22, 0.18], [0, 0.52, -2.46], BUMP), P('box', [0.14, 0.1, 0.18], [-1.04, 1.3, 1.25], 'paint'), P('box', [0.14, 0.1, 0.18], [1.04, 1.3, 1.25], 'paint'), ...lights(0.68, 0.9, 2.45, -2.45), ...wheels(0.92, [1.55, -1.55], 0.38)];
    // crates of fruit in the back: this one is the market's
    [['#e85a3a', -0.45, -0.8], ['#f2b23a', 0.45, -0.8], ['#7ac04a', -0.45, -1.7], ['#c83a6a', 0.45, -1.7]].forEach(([c, x, z]) => q.push(P('box', [0.75, 0.4, 0.75], [x, 1.32, z], '#a07a4a'), P('box', [0.62, 0.1, 0.62], [x, 1.55, z], c)));
    return q; };
  V.bus = () => { const q = [P('box', [2.5, 1.1, 10], [0, 0.95, 0], 'paint'), P('box', [2.5, 1.5, 10], [0, 2.25, 0], '#f4ecd8'), P('box', [2.54, 0.85, 9.3], [0, 2.15, -0.15], GL), P('box', [2.3, 1.0, 0.06], [0, 2.15, 5.0], GL), P('box', [2.52, 0.14, 10.02], [0, 1.52, 0], 'paint'),
      P('box', [1.7, 0.34, 0.08], [0, 2.82, 5.0], '#1b1a24', { sign: true }), P('box', [1.5, 0.22, 0.04], [0, 2.82, 5.04], '#f2c14e'), P('box', [2.4, 0.16, 9.6], [0, 3.06, 0], '#e8e2d4'), P('box', [1.4, 0.24, 2.2], [0, 3.2, -2.5], '#c9c2b4'),
      P('box', [2.56, 0.24, 0.2], [0, 0.5, 5.0], BUMP), P('box', [2.56, 0.24, 0.2], [0, 0.5, -5.0], BUMP), P('box', [0.16, 0.24, 0.1], [-1.4, 2.5, 4.9], BUMP), P('box', [0.16, 0.24, 0.1], [1.4, 2.5, 4.9], BUMP), ...lights(0.9, 0.9, 5.0, -5.0), ...wheels(1.16, [3.3, -3.0], 0.48)];
    for (const z of [3.6, -1.2]) q.push(P('box', [0.05, 2.1, 1.2], [1.27, 1.55, z], '#3a3a42'), P('box', [0.06, 1.3, 0.5], [1.275, 1.8, z - 0.28], GL), P('box', [0.06, 1.3, 0.5], [1.275, 1.8, z + 0.28], GL));
    for (let z = -4; z <= 4.1; z += 1.6) for (const s of [-1, 1]) q.push(P('box', [0.03, 0.85, 0.08], [s * 1.275, 2.15, z], '#f4ecd8'));
    return q; };
  V.scooter = () => [P('torus', [0.22, 0.07], [0, 0.29, 0.62], '#1b1a24', { rot: [0, PI / 2, 0], seg: 8 }), P('torus', [0.22, 0.07], [0, 0.29, -0.55], '#1b1a24', { rot: [0, PI / 2, 0], seg: 8 }),
    P('box', [0.38, 0.5, 0.75], [0, 0.6, -0.5], 'paint'), P('box', [0.34, 0.1, 0.6], [0, 0.92, -0.45], '#3a2a22'), P('box', [0.3, 0.06, 0.5], [0, 0.34, 0.08], 'paint'), P('box', [0.42, 0.75, 0.08], [0, 0.72, 0.42], 'paint', { rot: [-0.25, 0, 0] }),
    P('box', [0.2, 0.12, 0.36], [0, 0.52, 0.64], 'paint'), P('cyl', [0.035, 0.035, 0.4], [0, 1.15, 0.33], '#c9d2da', { rot: [-0.25, 0, 0], seg: 5 }), P('box', [0.6, 0.05, 0.05], [0, 1.32, 0.3], '#1b1a24'), P('cyl', [0.09, 0.09, 0.06], [0, 1.2, 0.4], '#fff3c4', { rot: [PI / 2, 0, 0], seg: 8, tag: 'light' }),
    P('box', [0.1, 0.07, 0.04], [0, 0.72, -0.9], '#ff3a3a'), P('box', [0.04, 0.3, 0.04], [-0.14, 0.15, 0.0], '#c9d2da', { rot: [0, 0, 0.4] })];
  K.VEHICLES = [
    { name: 'City car', build: V.city, box: [1.72, 1.6, 3.5], paints: ['#e4572e', '#7fb7d8', '#f2efe6', '#6fb38a'], note: 'The everyday car, a little shorter than today\'s' },
    { name: 'Saloon', build: () => V.saloon(false), box: [1.84, 1.55, 4.4], paints: ['#3a4a6a', '#8a8f9a', '#7a2f3a', '#1f2433'], note: 'Downtown' },
    { name: 'Taxi', build: () => V.saloon(true), box: [1.84, 1.7, 4.4], paints: ['#f2c14e'], note: 'The saloon with a roof light and a dark band' },
    { name: 'Delivery van', build: V.van, box: [2.0, 2.25, 4.8], paints: ['#2f6f9d', '#f2efe6', '#3e8f56', '#c4523a'], note: 'The white panel takes a shop\'s name' },
    { name: 'Market pickup', build: V.pickup, box: [1.92, 1.85, 4.9], paints: ['#3e8f86', '#c4523a', '#e8b84a'], note: 'Crates of fruit in the back' },
    { name: 'Bus', build: V.bus, box: [2.5, 3.3, 10], paints: ['#e4572e', '#2f8f9d'], note: 'Two-tone; the board over the windscreen shows the route' },
    { name: 'Scooter', build: V.scooter, box: [0.6, 1.35, 1.8], paints: ['#7fb7d8', '#e4572e', '#f2efe6', '#6fb38a'], note: 'Parked on the old town\'s lanes; no rider' },
  ];
})();
