// ============================================================
//  MODEL KIT — house pieces, five houses, pedestrians.
//  Pure data + small pure functions; no three.js, no game code.
//  See models/README.md for the format and how to wire it in.
//  Units: metres. y up. A house's origin is the middle of its
//  footprint at ground level; its street front faces +z.
// ============================================================
const KIT = (() => {
  const K = {}, PI = Math.PI;
  // one primitive. s: box [w,h,d] | cyl [rTop,rBot,h] | cone [r,h] | sph [r] | dome [r] | ico [r] | prism [len,h,base]
  // at: centre (prism, dome, cone base: see README). rot: [rx,ry,rz], applied Y then X then Z. col: a palette slot or '#hex'.
  const P = (s, size, at, col, o) => Object.assign({ s, size, at, col }, o || {});
  K.TRIS = (p) => p.s === 'box' ? 12 : p.s === 'cyl' ? 4 * (p.seg || 8) : p.s === 'cone' ? 2 * (p.seg || 6) : p.s === 'sph' ? 10 * (p.seg || 8) : p.s === 'dome' ? 7 * (p.seg || 8) : p.s === 'ico' ? 20 : 8;
  K.count = (parts) => parts.reduce((n, p) => n + K.TRIS(p), 0);

  // ---------- pieces (local frame: x along the wall, y up from the piece's own base line, z out of the wall) ----------
  // a window. y = 0 is the bottom of the glass. o: { shutters, box (flowers), lintel, lite (far sides: frame + glass only) }
  K.window = (w = 1.0, h = 1.45, o = {}) => {
    const q = [P('box', [w + 0.26, h + 0.26, 0.08], [0, h / 2, 0.04], 'trim'), P('box', [w, h, 0.05], [0, h / 2, 0.085], 'glass')];
    if (o.lite) { if (o.shutters) for (const s of [-1, 1]) q.push(P('box', [w / 2, h + 0.06, 0.05], [s * (w * 0.75 + 0.16), h / 2, 0.045], 'shutter')); return q; }
    q.push(P('box', [0.06, h, 0.03], [0, h / 2, 0.115], 'trim'), P('box', [w, 0.06, 0.03], [0, h * 0.62, 0.115], 'trim'));
    q.push(P('box', [w + 0.44, 0.09, 0.26], [0, -0.175, 0.13], 'stone'));
    if (o.lintel) q.push(P('box', [w + 0.5, 0.2, 0.12], [0, h + 0.23, 0.06], 'stone'));
    if (o.shutters) for (const s of [-1, 1]) { const x = s * (w * 0.75 + 0.16); q.push(P('box', [w / 2, h + 0.06, 0.05], [x, h / 2, 0.045], 'shutter'), P('box', [w / 2 - 0.14, h * 0.34, 0.02], [x, h * 0.72, 0.075], 'shutter2'), P('box', [w / 2 - 0.14, h * 0.34, 0.02], [x, h * 0.28, 0.075], 'shutter2')); }
    if (o.box) { q.push(P('box', [w + 0.1, 0.2, 0.2], [0, -0.03, 0.3], 'wood')); for (const k of [-1, 0, 1]) q.push(P('ico', [0.14], [k * w * 0.33, 0.14, 0.3], k ? 'flower' : 'leaf', { scale: [1.2, 0.8, 1] })); }
    return q;
  };
  // a door on a stone step. y = 0 is the ground. o: { fanlight, hood, arch }
  K.door = (w = 1.1, h = 2.15, o = {}) => {
    const st = 0.18, top = st + h + (o.fanlight ? 0.42 : 0), q = [P('box', [w + 0.7, st, 0.6], [0, st / 2, 0.3], 'stone', { tag: 'solid' })];
    q.push(P('box', [w + 0.3, top - st + 0.15, 0.12], [0, (top + st + 0.15) / 2, 0.06], 'trim'), P('box', [w, h, 0.08], [0, st + h / 2, 0.1], 'door'));
    for (const y of [0.3, 0.7]) q.push(P('box', [w * 0.62, h * 0.3, 0.03], [0, st + h * y, 0.15], 'door2'));
    q.push(P('ico', [0.05], [w * 0.36, st + h * 0.48, 0.17], 'brass'));
    if (o.fanlight) q.push(P('box', [w, 0.34, 0.05], [0, st + h + 0.23, 0.1], 'glass'), P('box', [0.05, 0.34, 0.03], [0, st + h + 0.23, 0.13], 'trim'));
    if (o.arch) q.push(P('cyl', [w / 2 + 0.15, w / 2 + 0.15, 0.12], [0, st + h, 0.06], 'trim', { rot: [PI / 2, 0, 0], seg: 12 }), P('cyl', [w / 2, w / 2, 0.08], [0, st + h, 0.1], 'door', { rot: [PI / 2, 0, 0], seg: 12 }));
    if (o.hood) { q.push(P('box', [w + 0.8, 0.07, 0.75], [0, top + 0.5, 0.36], 'roof', { rot: [0.32, 0, 0] })); for (const s of [-1, 1]) q.push(P('box', [0.08, 0.4, 0.08], [s * (w / 2 + 0.25), top + 0.28, 0.3], 'timber', { rot: [-0.7, 0, 0] })); }
    return q;
  };
  // a shop front, ground floor. The awning is taut canvas (bounce); the fascia is where the sign goes
  K.shop = (w = 5, o = {}) => {
    const q = [P('box', [w, 0.6, 0.14], [0, 0.3, 0.07], 'accent'), P('box', [w - 0.3, 1.75, 0.05], [0, 1.5, 0.06], 'glass'), P('box', [w + 0.2, 0.5, 0.16], [0, 2.85, 0.08], 'accent', { sign: true })];
    for (const s of [-1, 1]) q.push(P('box', [0.22, 3.1, 0.18], [s * (w / 2), 1.55, 0.09], 'trim'));
    const n = Math.max(2, Math.round(w / 1.6)); for (let k = 1; k < n; k++) q.push(P('box', [0.06, 1.75, 0.04], [-w / 2 + k * w / n, 1.5, 0.1], 'trim'));
    q.push(P('box', [0.95, 2.05, 0.06], [w * 0.28, 1.03, 0.1], 'door'), P('box', [0.7, 1.2, 0.03], [w * 0.28, 1.35, 0.14], 'glass'));
    if (o.awning !== false) { q.push(P('box', [w - 0.1, 0.06, 1.55], [0, 2.42, 0.86], 'awning', { rot: [0.24, 0, 0], tag: 'bounce' }), P('box', [w - 0.1, 0.24, 0.04], [0, 2.14, 1.62], 'awning2')); for (let k = 0; k < 3; k++) q.push(P('box', [(w - 0.1) / 7, 0.065, 1.55], [(k - 1) * (w - 0.1) * 2 / 7, 2.422, 0.86], 'awning2', { rot: [0.24, 0, 0] })); }
    return q;
  };
  // a balcony: floor (solid), a railing whose top bar is a grind
  K.balcony = (w = 2.4) => {
    const q = [P('box', [w, 0.1, 0.9], [0, -0.05, 0.45], 'stone', { tag: 'solid' })];
    for (const s of [-1, 1]) q.push(P('box', [0.1, 0.34, 0.6], [s * (w / 2 - 0.2), -0.24, 0.3], 'stone', { rot: [0.5, 0, 0] }), P('box', [0.05, 0.05, 0.86], [s * (w / 2 - 0.03), 0.95, 0.44], 'iron'), P('box', [0.05, 0.95, 0.05], [s * (w / 2 - 0.03), 0.47, 0.86], 'iron'));
    q.push(P('box', [w, 0.06, 0.06], [0, 0.97, 0.86], 'iron', { tag: 'grind' }), P('box', [w, 0.04, 0.04], [0, 0.14, 0.86], 'iron'));
    const n = Math.round(w / 0.3); for (let k = 1; k < n; k++) q.push(P('box', [0.035, 0.82, 0.035], [-w / 2 + k * w / n, 0.55, 0.86], 'iron'));
    return q;
  };
  // one bay of half-timbering, w × h: posts, rails, a brace
  K.timber = (w = 2.3, h = 2.7, lean = 1) => [
    P('box', [0.18, h, 0.07], [-w / 2 + 0.09, h / 2, 0.035], 'timber'), P('box', [0.18, h, 0.07], [w / 2 - 0.09, h / 2, 0.035], 'timber'),
    P('box', [w, 0.18, 0.07], [0, 0.09, 0.035], 'timber'), P('box', [w, 0.18, 0.07], [0, h - 0.09, 0.035], 'timber'),
    P('box', [0.14, Math.hypot(w * 0.42, h * 0.8), 0.06], [lean * w * 0.24, h / 2, 0.03], 'timber', { rot: [0, 0, lean * Math.atan2(w * 0.42, h * 0.8)] }),
  ];
  // a chimney with two pots. y = 0 is where it leaves the roof
  K.chimney = (h = 1.7) => [P('box', [0.62, h, 0.62], [0, h / 2 - 0.4, 0], 'stone'), P('box', [0.8, 0.12, 0.8], [0, h - 0.34, 0], 'trim'), P('cyl', [0.1, 0.13, 0.32], [-0.15, h - 0.12, 0], 'pot', { seg: 6 }), P('cyl', [0.1, 0.13, 0.32], [0.15, h - 0.12, 0], 'pot', { seg: 6 })];
  // a dormer window. y = 0 is its sill line on the roof; it faces +z
  K.dormer = (w = 1.3) => {
    const q = [P('box', [w, 1.0, 1.5], [0, 0.5, -0.5], 'wall'), P('prism', [1.9, 0.5, w + 0.36], [0, 1.0, -0.5], 'roof', { rot: [0, PI / 2, 0] })];
    for (const p of K.window(w - 0.5, 0.72, { lite: true })) q.push(Object.assign({}, p, { at: [p.at[0], p.at[1] + 0.14, p.at[2] + 0.25] }));
    return q;
  };
  // a gabled, tiled roof over a w × d box. y = 0 is the eave line. Ridge along x. Slabs (tag 'roof': skate on them), three courses of tiles a side, ridge cap
  K.roof = (w, d, rise, o = {}) => {
    const ov = 0.45, half = d / 2 + ov, a = Math.atan2(rise, d / 2), t = Math.tan(a), L = half / Math.cos(a), q = [P('prism', [w, rise, d], [0, 0, 0], o.gable || 'wall')];
    for (const s of [-1, 1]) {
      q.push(P('box', [w + 0.7, 0.16, L], [0, rise - half / 2 * t + 0.02, s * half / 2], 'roof', { rot: [s * a, 0, 0], tag: 'roof' }));
      if (!o.lite) for (const f of [0.2, 0.5, 0.8]) q.push(P('box', [w + 0.74, 0.06, L * 0.17], [0, rise - half * f * t + 0.13, s * half * f], 'roof2', { rot: [s * a, 0, 0] }));
      q.push(P('box', [w + 0.76, 0.2, 0.1], [0, rise - half * t + 0.02, s * (half + 0.02)], 'trim'));
    }
    q.push(P('box', [w + 0.8, 0.16, 0.36], [0, rise + 0.12, 0], 'roof3', { tag: 'grind' }));
    return q;
  };
  // crow steps for a gable end of base d and height rise (stand it on the eave line, in the plane of the gable wall)
  K.crowSteps = (d, rise, n = 4) => { const q = []; for (let k = 0; k < n; k++) q.push(P('box', [d * (1 - k / n) + 0.5, rise / n + (k === n - 1 ? 0.5 : 0.05), 0.36], [0, rise * (k + 0.5) / n + (k === n - 1 ? 0.22 : 0), 0], 'stone')); return q; };
  // a wooden bay window with a lattice (market houses)
  K.lattice = (w = 1.7) => { const q = [P('box', [w, 1.5, 0.6], [0, 0.75, 0.3], 'wood'), P('box', [w - 0.26, 1.05, 0.04], [0, 0.82, 0.61], 'lattice'), P('box', [w + 0.2, 0.08, 0.76], [0, 1.56, 0.36], 'timber', { rot: [0.12, 0, 0] })]; for (const s of [-1, 1]) q.push(P('box', [0.1, 0.5, 0.5], [s * (w / 2 - 0.2), -0.2, 0.22], 'timber', { rot: [0.75, 0, 0] })); for (let k = 1; k < 5; k++) q.push(P('box', [0.035, 1.05, 0.02], [-w / 2 + 0.13 + k * (w - 0.26) / 5, 0.82, 0.635], 'wood')); return q; };
  // a pergola for a flat roof: four posts, a striped shade (bounce), a cushion
  K.pergola = (w = 3.2, d = 2.6) => { const q = []; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) q.push(P('cyl', [0.06, 0.06, 2.3], [a * w / 2, 1.15, b * d / 2], 'timber', { seg: 6 })); q.push(P('box', [w + 0.4, 0.07, d + 0.4], [0, 2.34, 0], 'awning', { tag: 'bounce' }), P('box', [(w + 0.4) / 5, 0.075, d + 0.4], [-(w + 0.4) / 5, 2.342, 0], 'awning2'), P('box', [(w + 0.4) / 5, 0.075, d + 0.4], [(w + 0.4) / 5, 2.342, 0], 'awning2'), P('box', [w * 0.7, 0.22, d * 0.45], [0, 0.11, 0], 'fabric')); return q; };
  K.pot = (r = 0.24) => [P('cyl', [r, r * 0.75, r * 1.6], [0, r * 0.8, 0], 'pot', { seg: 7 }), P('ico', [r * 1.5], [0, r * 2.4, 0], 'leaf', { scale: [1, 0.9, 1] })];

  // ---------- assembly ----------
  // put a piece on one face of a w × d box: 'f' front (+z), 'b' back, 'r' right (+x), 'l' left. x along the face, y up, out = extra stand-off
  const FACE = { f: 0, r: PI / 2, b: PI, l: -PI / 2 };
  K.onFace = (parts, face, w, d, x, y, out = 0) => parts.map(p => {
    const th = FACE[face], dist = (face === 'f' || face === 'b' ? d : w) / 2 + out, lx = p.at[0] + x, lz = p.at[2] + dist, c = Math.cos(th), s = Math.sin(th), r = p.rot || [0, 0, 0];
    return Object.assign({}, p, { at: [lx * c + lz * s, p.at[1] + y, -lx * s + lz * c], rot: [r[0], r[1] + th, r[2]] });
  });
  const lift = (parts, x, y, z, ry = 0) => parts.map(p => { const c = Math.cos(ry), s = Math.sin(ry), r = p.rot || [0, 0, 0]; return Object.assign({}, p, { at: [p.at[0] * c + p.at[2] * s + x, p.at[1] + y, -p.at[0] * s + p.at[2] * c + z], rot: [r[0], r[1] + ry, r[2]] }); });
  K.lift = lift;
  const bays = (w, n) => Array.from({ length: n }, (_, i) => (i + 0.5 - n / 2) * w / n);

  // a house from a spec. Returns { parts, size: [w, h, d], eave }.
  // spec: { w, d, floors, kind: 'town' | 'timber' | 'stone' | 'shop' | 'market', bays, rise, lite }
  // lite: the version for every house that is not close to the player — front only, plain windows, no tile courses
  K.house = (S) => {
    const { w, d, floors, kind } = S, lite = !!S.lite, gh = kind === 'shop' ? 3.3 : 3.0, fh = 2.85, H = gh + (floors - 1) * fh, n = S.bays || Math.max(2, Math.round(w / 2.6)), X = bays(w, n), q = [];
    const jet = kind === 'timber' ? 0.4 : 0, add = (parts, face, x, y, out = 0) => q.push(...K.onFace(parts, face, w, d, x, y, out));
    // walls
    q.push(P('box', [w, kind === 'timber' ? gh : H, d], [0, (kind === 'timber' ? gh : H) / 2, 0], kind === 'timber' ? 'wall2' : 'wall', { tag: 'solid' }));
    if (jet) q.push(P('box', [w + 0.1, H - gh, d + jet], [0, gh + (H - gh) / 2, jet / 2], 'wall', { tag: 'solid' }));
    q.push(P('box', [w + 0.14, kind === 'market' ? 1.0 : 0.55, d + 0.14], [0, kind === 'market' ? 0.5 : 0.275, 0], kind === 'market' ? 'accent' : 'stone'));
    if (kind !== 'timber') for (let f = 1; f < floors; f++) q.push(P('box', [w + 0.1, 0.12, d + 0.1], [0, gh + (f - 1) * fh - 0.06, 0], 'trim'));
    // ground floor, front
    const doorX = X[kind === 'shop' ? n - 1 : Math.floor(n / 2) - (n % 2 ? 0 : 1)];
    if (kind === 'shop') { add(K.shop(w - 2.6), 'f', -1.0, 0); add(K.door(1.0, 2.1), 'f', w / 2 - 0.9, 0); }
    else for (const x of X) { if (x === doorX) add(K.door(1.1, kind === 'market' ? 1.95 : 2.15, { fanlight: kind === 'town', hood: kind === 'timber', arch: kind === 'market' || kind === 'stone' }), 'f', x, 0); else add(K.window(kind === 'stone' ? 0.8 : 1.0, 1.35, { lite, shutters: kind === 'town' || kind === 'market', lintel: kind === 'stone', box: kind === 'town' }), 'f', x, 1.0); }
    // upper floors, front; plain windows on the back, 'lite' ones on the sides
    for (let f = 1; f < floors; f++) {
      const y = gh + (f - 1) * fh;
      if (kind === 'timber') for (const [i, x] of X.entries()) { add(K.timber(w / n, fh, i < n / 2 ? -1 : 1), 'f', x, y, jet); }
      for (const [i, x] of X.entries()) {
        if (kind === 'market' && f === 1 && i === Math.floor(n / 2)) { add(K.lattice(1.7), 'f', x, y + 0.75); continue; }
        add(K.window(kind === 'stone' ? 0.8 : 1.0, kind === 'timber' ? 1.15 : 1.4, { lite, shutters: kind !== 'stone' && kind !== 'timber', lintel: kind === 'stone', box: (kind === 'town' || kind === 'shop') && f === 1 && i % 2 === 0 }), 'f', x, y + (kind === 'timber' ? 1.0 : 0.95), jet + (kind === 'timber' ? 0.06 : 0));
      }
      if (kind === 'shop' && f === 1 && !lite) add(K.balcony(w * 0.5), 'f', -w * 0.12, y + 0.6);
    }
    if (!lite) for (let f = 0; f < floors; f++) { const y = (f ? gh + (f - 1) * fh : 0) + 1.0; for (const x of X) add(K.window(0.9, 1.3, {}), 'b', x, y); for (const x of bays(d, Math.max(1, Math.round(d / 3.6)))) for (const fc of ['l', 'r']) add(K.window(0.9, 1.3, { lite: true }), fc, x, y); }
    if (jet && !lite) for (let x = -w / 2 + 0.3; x <= w / 2 - 0.2; x += 0.9) q.push(P('box', [0.16, 0.2, jet + 0.1], [x, gh - 0.1, d / 2 + jet / 2], 'timber'));
    // roof
    let top = H;
    if (kind === 'market') {
      for (const [a, b, c, e] of [[w, 0.3, 0, d / 2 - 0.15], [w, 0.3, 0, -d / 2 + 0.15], [0.3, d - 0.6, w / 2 - 0.15, 0], [0.3, d - 0.6, -w / 2 + 0.15, 0]]) q.push(P('box', [a, 0.42, b], [c, H + 0.21, e], 'trim', { tag: 'grind' }));
      q.push(...lift(K.pergola(), -w * 0.18, H, -d * 0.1), ...lift(K.pot(), w / 2 - 0.7, H, d / 2 - 0.7), ...lift(K.pot(0.2), w / 2 - 1.4, H, d / 2 - 0.65), P('dome', [1.25], [w * 0.26, H, -d * 0.2], 'plaster', { seg: 10 }), P('cyl', [0.04, 0.04, 0.6], [w * 0.26, H + 1.5, -d * 0.2], 'brass', { seg: 5 }));
      top = H + 2.4;
    } else {
      const rise = S.rise || (kind === 'timber' ? 4.2 : 3.0), street = kind === 'stone';      // the stone house turns its gable to the street
      const R = K.roof(street ? d + jet : w + (jet ? 0.1 : 0), street ? w : d + jet, rise, { lite });
      q.push(...lift(R, 0, H, street ? 0 : jet / 2, street ? PI / 2 : 0));
      if (street) for (const s of [-1, 1]) q.push(...lift(K.crowSteps(w, rise), 0, H, s * (d / 2 + 0.02)));
      else {
        const half = d / 2 + jet / 2, t = rise / half, dz = half * 0.52;
        for (const x of kind === 'shop' ? [-w * 0.22, w * 0.22] : kind === 'town' ? [0] : []) q.push(...lift(K.dormer(), x, H + rise - dz * t - 0.25, jet / 2 + dz + 0.35));
      }
      q.push(...lift(K.chimney(), street ? w * 0.22 : w * 0.3, H + rise * 0.55, street ? -d * 0.2 : -d * 0.14));
      top = H + rise + 1.2;
    }
    return { parts: q, size: [w, top, d + jet], eave: H };
  };
  // the five houses, each with the palette it was drawn in (slots → colours; a quarter's own colours can replace wall / roof / shutter)
  const BASE = { trim: '#f4ecd8', stone: '#b9b0a0', glass: '#3f5468', timber: '#4a3628', wood: '#8a6a4a', iron: '#2a2838', brass: '#c9a24a', pot: '#b8643f', leaf: '#5a9a52', flower: '#e4572e', door2: '#3a2a22', wall2: '#cfc6b4', roof: '#a04a32', roof2: '#b85a3a', roof3: '#7a3a28', accent: '#2f5f4a', awning: '#c4523a', awning2: '#f6f1e7', shutter: '#3e6f5a', shutter2: '#335c4a', door: '#5a3a2a', plaster: '#f6f1e7', fabric: '#d9779a', lattice: '#5a4030' };
  K.HOUSES = [
    { name: 'Town house', where: 'Bell quarter, church quarter', spec: { w: 7.6, d: 8.5, floors: 2, kind: 'town', bays: 3 }, pal: { wall: '#f2d7c0', roof: '#b85a3a', roof2: '#c96b48', roof3: '#8f4028', shutter: '#3e6f5a', shutter2: '#335c4a', door: '#2f5f6a', door2: '#274f58' } },
    { name: 'Timbered house', where: 'East quarter', spec: { w: 7.0, d: 8.0, floors: 3, kind: 'timber', bays: 3 }, pal: { wall: '#f4ecd8', wall2: '#cfc6b4', roof: '#8a5040', roof2: '#9c6250', roof3: '#6a3a2e', door: '#7a2f2f', door2: '#662626', trim: '#4a3628' } },
    { name: 'Stone house', where: 'Upper town', spec: { w: 7.2, d: 9.0, floors: 2, kind: 'stone', bays: 3, rise: 4.0 }, pal: { wall: '#d8d4c8', stone: '#a8a498', trim: '#c8c4b8', roof: '#5a6272', roof2: '#6a7282', roof3: '#454c5a', door: '#3a3550', door2: '#2e2a40' } },
    { name: 'Shop house', where: 'Round the squares', spec: { w: 8.6, d: 8.5, floors: 3, kind: 'shop', bays: 3 }, pal: { wall: '#e8c87a', roof: '#8a4a3a', roof2: '#9c5c4a', roof3: '#6a352a', shutter: '#7a2f3a', shutter2: '#662630', door: '#7a2f3a', door2: '#662630', accent: '#2f5f4a', awning: '#c4523a', awning2: '#f6f1e7' } },
    { name: 'Market house', where: 'Market', spec: { w: 9.0, d: 9.0, floors: 2, kind: 'market', bays: 3 }, pal: { wall: '#f4ecd8', trim: '#f6f1e7', accent: '#2f6f9d', shutter: '#2f6f9d', shutter2: '#275d85', door: '#2f6f9d', door2: '#275d85', awning: '#e8b84a', awning2: '#f6f1e7', stone: '#d8cfbf' } },
  ].map(h => Object.assign(h, { pal: Object.assign({}, BASE, h.pal), build: (lite) => K.house(Object.assign({}, h.spec, { lite })) }));
  K.PIECES = [
    ['Window, shutters and flowers', () => K.window(1.0, 1.45, { shutters: true, box: true }), 0], ['Window, stone lintel', () => K.window(0.8, 1.35, { lintel: true }), 2], ['Door with fanlight', () => K.door(1.1, 2.15, { fanlight: true }), 0],
    ['Arched door', () => K.door(1.1, 1.95, { arch: true }), 4], ['Shop front with awning', () => K.shop(5), 3], ['Balcony', () => K.balcony(2.4), 3], ['Timber bay', () => K.timber(), 1],
    ['Tiled roof, ridge and eaves', () => K.roof(7, 8, 3), 0], ['Dormer', () => K.dormer(), 0], ['Chimney', () => K.chimney(), 0], ['Lattice bay', () => K.lattice(), 4], ['Pergola', () => K.pergola(), 4],
  ];

  // ---------- pedestrians ----------
  // The game draws people as instanced meshes, one per body part, one colour per instance. So a person here is a
  // choice of part variants. In a part, `sh` (0..1) multiplies the instance colour (1 = the colour itself; lower = a
  // darker shade of it); `col` instead fixes a colour (then give that instance white). Pivots: torso, head, hair, hats
  // and body accessories sit in the body frame (origin at the feet); a leg hangs from the hip [±0.1, 0.84, 0]; an arm
  // and what it holds hangs from the shoulder [±0.27, 1.38, 0]. Adult height 1.78; children are the same parts at 0.68.
  const B = (s, size, at, sh = 1, o) => Object.assign({ s, size, at, sh }, o || {});
  const SHOULD = B('sph', [0.24], [0, 1.42, 0], 1, { scale: [1, 0.5, 0.76] });
  K.BODY = {
    pivots: { legL: [-0.1, 0.84, 0], legR: [0.1, 0.84, 0], armL: [-0.27, 1.38, 0], armR: [0.27, 1.38, 0] },
    torso: {   // instance colour: the top
      jacket: [B('cyl', [0.2, 0.235, 0.6], [0, 1.14, 0]), SHOULD, B('cyl', [0.24, 0.245, 0.1], [0, 0.88, 0], 0.8), B('cyl', [0.1, 0.135, 0.08], [0, 1.49, 0], 0.72), B('box', [0.03, 0.5, 0.02], [0, 1.14, 0.222], 0.7)],
      coat: [B('cyl', [0.2, 0.3, 1.0], [0, 0.95, 0]), SHOULD, B('cyl', [0.252, 0.262, 0.07], [0, 1.02, 0], 0.6), B('cyl', [0.12, 0.16, 0.1], [0, 1.49, 0], 0.75), B('box', [0.03, 0.9, 0.02], [0, 0.95, 0.27], 0.7, { rot: [-0.1, 0, 0] })],
      dress: [B('cyl', [0.17, 0.195, 0.42], [0, 1.24, 0]), B('sph', [0.215], [0, 1.42, 0], 1, { scale: [1, 0.45, 0.72] }), B('cyl', [0.2, 0.43, 0.76], [0, 0.66, 0], 1, { seg: 10 }), B('cyl', [0.202, 0.207, 0.06], [0, 1.03, 0], 0.72)],
      hoodie: [B('cyl', [0.22, 0.25, 0.62], [0, 1.13, 0]), SHOULD, B('sph', [0.16], [0, 1.5, -0.13], 0.9, { scale: [1.1, 0.8, 0.9] }), B('box', [0.26, 0.12, 0.04], [0, 1.0, 0.235], 0.8), B('cyl', [0.25, 0.255, 0.08], [0, 0.86, 0], 0.85)],
    },
    leg: {     // instance colour: trousers — or skin, for 'bare' (worn under a dress)
      trousers: [B('sph', [0.11], [0, 0, 0]), B('cyl', [0.095, 0.075, 0.76], [0, -0.39, 0], 1, { seg: 6 }), B('box', [0.13, 0.09, 0.27], [0, -0.795, 0.05], 0.45)],
      bare: [B('cyl', [0.068, 0.058, 0.78], [0, -0.39, 0], 1, { seg: 6 }), B('box', [0.12, 0.08, 0.25], [0, -0.8, 0.045], 0.35)],
    },
    arm: { sleeve: [B('cyl', [0.068, 0.056, 0.56], [0, -0.28, 0], 1, { seg: 5 }), B('cyl', [0.06, 0.06, 0.05], [0, -0.55, 0], 0.8, { seg: 5 })] },   // instance colour: the top
    hand: [B('sph', [0.062], [0, -0.61, 0], 1, { seg: 5 })],                                                                                      // instance colour: skin (same matrix as its arm)
    head: [B('sph', [0.18], [0, 1.68, 0], 1, { scale: [1, 1.06, 1] }), B('cyl', [0.07, 0.08, 0.14], [0, 1.5, 0], 0.92, { seg: 6 }), B('box', [0.045, 0.05, 0.05], [0, 1.655, 0.175], 0.9), B('box', [0.034, 0.05, 0.02], [-0.066, 1.71, 0.166], 0.14), B('box', [0.034, 0.05, 0.02], [0.066, 1.71, 0.166], 0.14)],
    hair: {    // instance colour: hair
      short: [B('dome', [0.19], [0, 1.69, -0.015], 1, { scale: [1, 0.95, 1.05] })],
      long: [B('dome', [0.192], [0, 1.69, -0.015], 1, { scale: [1, 0.95, 1.05] }), B('box', [0.31, 0.42, 0.1], [0, 1.5, -0.15], 0.92)],
      bun: [B('dome', [0.19], [0, 1.69, -0.015], 1, { scale: [1, 0.95, 1.05] }), B('sph', [0.09], [0, 1.87, -0.1], 0.9, { seg: 6 })],
      bob: [B('dome', [0.195], [0, 1.69, -0.01], 1, { scale: [1, 0.95, 1.05] }), B('box', [0.06, 0.24, 0.26], [-0.175, 1.6, -0.03], 0.92), B('box', [0.06, 0.24, 0.26], [0.175, 1.6, -0.03], 0.92), B('box', [0.34, 0.24, 0.07], [0, 1.6, -0.16], 0.92)],
    },
    hat: {     // each its own instance colour
      cap: [B('dome', [0.196], [0, 1.74, 0], 1, { scale: [1, 0.72, 1.02] }), B('box', [0.2, 0.03, 0.17], [0, 1.755, 0.2], 0.85)],
      sunhat: [B('cyl', [0.34, 0.34, 0.03], [0, 1.79, 0], 1, { seg: 12 }), B('cyl', [0.17, 0.19, 0.13], [0, 1.86, 0], 1), B('cyl', [0.192, 0.194, 0.04], [0, 1.82, 0], 0.55)],
      beanie: [B('dome', [0.2], [0, 1.72, 0], 1, { scale: [1, 1.08, 1.03] }), B('cyl', [0.203, 0.203, 0.06], [0, 1.74, 0], 0.8), B('sph', [0.055], [0, 1.95, 0], 1.0, { seg: 5 })],
      hardhat: [B('dome', [0.206], [0, 1.73, 0], 1, { scale: [1, 0.9, 1.05] }), B('cyl', [0.235, 0.235, 0.03], [0, 1.745, 0.02], 0.9, { seg: 10 }), B('box', [0.05, 0.2, 0.36], [0, 1.83, 0], 0.85)],
    },
    acc: {     // accessories. at: 'body' or an arm. Parts with `col` keep that colour; the rest take the instance colour
      backpack: { at: 'body', parts: [B('box', [0.3, 0.4, 0.16], [0, 1.2, -0.28]), B('box', [0.22, 0.16, 0.05], [0, 1.1, -0.37], 0.8), B('box', [0.05, 0.42, 0.03], [-0.12, 1.25, 0.2], 0.7), B('box', [0.05, 0.42, 0.03], [0.12, 1.25, 0.2], 0.7)] },
      bag: { at: 'body', parts: [B('box', [0.1, 0.22, 0.28], [0.29, 0.86, 0.02]), B('box', [0.05, 0.86, 0.02], [0.02, 1.2, 0.225], 0.7, { rot: [0, 0, 0.62] }), B('box', [0.05, 0.86, 0.02], [0.02, 1.2, -0.2], 0.7, { rot: [0, 0, 0.62] })] },
      apron: { at: 'body', parts: [B('box', [0.36, 0.62, 0.03], [0, 0.98, 0.245], 1, { rot: [-0.06, 0, 0] }), B('box', [0.22, 0.26, 0.03], [0, 1.36, 0.205]), B('cyl', [0.245, 0.25, 0.04], [0, 1.2, 0], 0.85)] },
      scarf: { at: 'body', parts: [B('cyl', [0.135, 0.15, 0.1], [0, 1.51, 0]), B('box', [0.1, 0.32, 0.04], [0.08, 1.33, 0.2], 0.9)] },
      headphones: { at: 'body', parts: [B('box', [0.34, 0.03, 0.05], [0, 1.89, 0]), B('box', [0.03, 0.2, 0.05], [-0.185, 1.8, 0]), B('box', [0.03, 0.2, 0.05], [0.185, 1.8, 0]), B('cyl', [0.065, 0.065, 0.05], [-0.2, 1.69, 0], 1, { rot: [0, 0, PI / 2], seg: 7 }), B('cyl', [0.065, 0.065, 0.05], [0.2, 1.69, 0], 1, { rot: [0, 0, PI / 2], seg: 7 })] },
      vest: { at: 'body', parts: [B('cyl', [0.215, 0.248, 0.5], [0, 1.16, 0]), B('cyl', [0.232, 0.24, 0.06], [0, 1.08, 0], 1, { col: '#e9e4f5' }), B('cyl', [0.222, 0.23, 0.06], [0, 1.26, 0], 1, { col: '#e9e4f5' })] },
      cane: { at: 'armR', parts: [B('cyl', [0.016, 0.016, 0.82], [0, -1.0, 0.07], 1, { seg: 5 }), B('box', [0.03, 0.03, 0.14], [0, -0.6, 0.03])] },
      shopping: { at: 'armL', parts: [B('box', [0.13, 0.28, 0.24], [0, -0.78, 0.02], 1, { col: '#c9a878' }), B('cyl', [0.03, 0.03, 0.5], [0, -0.52, 0.06], 1, { col: '#d9a85a', rot: [0.3, 0, 0.1], seg: 5 }), B('ico', [0.07], [0, -0.6, -0.04], 1, { col: '#5a9a52' })] },
      phone: { at: 'armR', parts: [B('box', [0.08, 0.15, 0.02], [0, -0.64, 0.05], 1, { col: '#1b1a24' })] },
    },
  };
  // eight people: which variants, and the colours they were drawn in. `pose` is only for the preview
  K.PEOPLE = [
    { name: 'Commuter', where: 'Downtown', torso: 'jacket', leg: 'trousers', hair: 'short', acc: ['bag', 'phone'], c: { top: '#2f5f8a', legs: '#2a2f45', skin: '#d9a07a', hair: '#3a2a20', bag: '#8a5a4a' } },
    { name: 'Stallholder', where: 'Market', torso: 'jacket', leg: 'trousers', hair: 'short', hat: 'cap', acc: ['apron'], c: { top: '#c4523a', legs: '#5a4a3a', skin: '#a8704a', hair: '#1f1a18', hat: '#e8b84a', apron: '#f2efe6' } },
    { name: 'Grandmother', where: 'Old town', torso: 'coat', leg: 'trousers', hair: 'bun', acc: ['scarf', 'cane'], c: { top: '#7a4a6a', legs: '#3a3a42', skin: '#f0c8a0', hair: '#c9c4c0', scarf: '#e8d4a0', cane: '#5a3a24' } },
    { name: 'Schoolchild', where: 'Everywhere', scale: 0.68, torso: 'hoodie', leg: 'trousers', hair: 'bob', hat: 'beanie', acc: ['backpack'], c: { top: '#e8c84a', legs: '#4a5a7a', skin: '#e8b890', hair: '#5a3a24', hat: '#e4572e', backpack: '#2f8f9d' } },
    { name: 'Summer dress', where: 'Lake, park', torso: 'dress', leg: 'bare', hair: 'long', hat: 'sunhat', acc: ['shopping'], c: { top: '#4aa0c8', skin: '#c68c5a', hair: '#1f1a18', hat: '#e8dcc0' } },
    { name: 'Visitor', where: 'Squares, observatory', torso: 'jacket', leg: 'trousers', hair: 'long', hat: 'cap', acc: ['backpack'], c: { top: '#6f8a5a', legs: '#c9c2b4', skin: '#f0c8a0', hair: '#8a5a30', hat: '#2f5f8a', backpack: '#b8743a' } },
    { name: 'Builder', where: 'Building site, docks', torso: 'jacket', leg: 'trousers', hair: 'short', hat: 'hardhat', acc: ['vest'], c: { top: '#3a4a5a', legs: '#2f4a6a', skin: '#7a4a32', hair: '#1f1a18', hat: '#f2c14e', vest: '#ff8a3a' } },
    { name: 'Listener', where: 'Canals, skatepark', torso: 'hoodie', leg: 'trousers', hair: 'bob', acc: ['headphones'], c: { top: '#8a5a9e', legs: '#1f1f28', skin: '#d9a07a', hair: '#7a2f1f', headphones: '#1b1a24' } },
  ];
  K.personTris = (p) => { const b = K.BODY, n = (L) => L.reduce((s, q) => s + K.TRIS(q), 0); return n(b.torso[p.torso]) + 2 * n(b.leg[p.leg]) + 2 * (n(b.arm.sleeve) + n(b.hand)) + n(b.head) + n(b.hair[p.hair]) + (p.hat ? n(b.hat[p.hat]) : 0) + (p.acc || []).reduce((s, a) => s + n(b.acc[a].parts), 0); };
  return K;
})();
if (typeof module !== 'undefined') module.exports = KIT;
