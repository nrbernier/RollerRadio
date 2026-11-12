// ============================================================
//  FRONTS — what you meet at street level downtown: ground floors of
//  several kinds (arcades to skate through, buildings on stilts, glass
//  lobbies, stepped plinths, cut corners, forecourts) and the landmark
//  fronts you find your way by: cinema, theatre, hotel, bank, diner…
// ============================================================
// landmark fronts, one per block: 'column,row' of the downtown grid → what stands there
const BIZ_LAND = { '0,1': 'museum', '3,0': 'library', '4,2': 'hotel', '2,2': 'cinema', '0,3': 'bank', '3,3': 'theatre', '1,5': 'diner', '4,5': 'post', '2,6': 'arcade', '3,7': 'radio', '0,9': 'baths', '4,8': 'opera' };
const BIZ_SHOPS = [['BAKERY', '#f2e2c0', '#7a3a2a'], ['CAFÉ', '#2f5f4a', '#f6f1e7'], ['BOOKS', '#3a4a7a', '#f2ead8'], ['FLOWERS', '#d9779a', '#fff6e0'], ['PHARMACY', '#f6f1e7', '#2f8f4a'], ['MUSIC', '#1b1a24', '#f2c14e'], ['TOYS', '#f2c14e', '#c4302b'], ['BIKES', '#2f8f9d', '#f6f1e7'], ['TAILOR', '#5a3a5a', '#f2e2c0'], ['NOODLES', '#c4302b', '#fff1c4']];
const LAND_STYLE = { museum: 'steps', library: 'arcade', hotel: 'band', cinema: 'band', bank: 'steps', theatre: 'steps', diner: 'band', post: 'band', arcade: 'band', radio: 'lobby', baths: 'steps', opera: 'arcade' };

// a facade as a frame: centre, outward normal, length; boxes are given along it (u) and outward (o)
function faceFrame(f, x0, z0, x1, z1) {
  if (f === 'n') return { f, cx: (x0 + x1) / 2, cz: z0, nx: 0, nz: -1, L: x1 - x0 };
  if (f === 's') return { f, cx: (x0 + x1) / 2, cz: z1, nx: 0, nz: 1, L: x1 - x0 };
  if (f === 'w') return { f, cx: x0, cz: (z0 + z1) / 2, nx: -1, nz: 0, L: z1 - z0 };
  return { f, cx: x1, cz: (z0 + z1) / 2, nx: 1, nz: 0, L: z1 - z0 };
}
const frBox = (fr, u0, u1, o0, o1) => fr.nx === 0
  ? [fr.cx + u0, Math.min(fr.cz + fr.nz * o0, fr.cz + fr.nz * o1), fr.cx + u1, Math.max(fr.cz + fr.nz * o0, fr.cz + fr.nz * o1)]
  : [Math.min(fr.cx + fr.nx * o0, fr.cx + fr.nx * o1), fr.cz + u0, Math.max(fr.cx + fr.nx * o0, fr.cx + fr.nx * o1), fr.cz + u1];
const frPt = (fr, u, o) => fr.nx === 0 ? [fr.cx + u, fr.cz + fr.nz * o] : [fr.cx + fr.nx * o, fr.cz + u];
const frYaw = (fr) => Math.atan2(fr.nx, fr.nz);
function frGround(fr, o = 1.5) { let lo = 1e9, hi = -1e9; for (const u of [-fr.L / 2 + 1, 0, fr.L / 2 - 1]) { const [x, z] = frPt(fr, u, o), y = terrainAt(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; }

// the podium of a downtown building. Returns what H.bldg returns, plus `box`: the footprint the tower may use
function bizPodium(H, x0, z0, x1, z1, h, col, style, sr, faces, land) {
  const { K, W, B, F } = H, put = H.put, M = W.metro;
  const [lo, hi] = groundSpan(x0, z0, x1, z1), top = hi + h;
  let base = lo - 1.5;
  if (M) for (let i = 0; i < M.N; i += 2) { const p = M.pts[i]; if (p.bored && p.x > x0 - 7 && p.x < x1 + 7 && p.z > z0 - 7 && p.z < z1 + 7) base = Math.max(base, p.y + STN.ceil + 0.3); }
  const glass = '#34465a', trimC = '#3a3550', pale = '#e6dfd0';
  const body = (a0, c0, a1, c1, y0, y1, kind = 'building', c = col) => K.box(a0, y0, c0, a1, y1, c1, c, kind, { roofColor: c, outlineT: 0.16 });
  // the band of shop windows sits at each side's own pavement level (the lots slope)
  const band = (a0, c0, a1, c1, y0 = null, y1 = null) => { for (const [ax, az, bx, bz] of [[a0 - 0.06, c0 + 1, a0 + 0.1, c1 - 1], [a1 - 0.1, c0 + 1, a1 + 0.06, c1 - 1], [a0 + 1, c0 - 0.06, a1 - 1, c0 + 0.1], [a0 + 1, c1 - 0.1, a1 - 1, c1 + 0.06]]) { const g = y0 ?? Math.max(terrainAt(ax, az), terrainAt(bx, bz)) + 0.2; B.box(ax, g, az, bx, Math.min(top - 1, y1 ?? g + 3.2), bz, glass, 'plain', { outlineT: 0, edges: false }); } };
  const cap = (a0, c0, a1, c1, y) => B.box(a0 - 0.2, y - 0.7, c0 - 0.2, a1 + 0.2, y - 0.05, c1 + 0.2, trimC, 'plain', { outlineT: 0, edges: false });
  const post = (x, z, y1, w = 0.45, c = pale) => { const g = terrainAt(x, z); K.box(x - w, g - 1, z - w, x + w, y1, z + w, c, 'paving', { outlineT: 0.05 }); };
  const w = x1 - x0, d = z1 - z0;
  let box = [x0, z0, x1, z1], farY = base;
  if (style === 'arcade' && w > 20 && d > 20 && h > 6.4) {
    // the upper floors come out over the pavement on a row of piers; shop windows stand back in the shade
    const g = 3.6, fl = hi + 4.6; farY = fl; F.box(x0 + g, base, z0 + g, x1 - g, fl, z1 - g, glass);
    body(x0 + g, z0 + g, x1 - g, z1 - g, base, fl, 'plain', glass);
    for (const [a0, c0, a1, c1] of [[x0 + g - 0.08, z0 + g + 2, x0 + g, z1 - g - 2], [x1 - g, z0 + g + 2, x1 - g + 0.08, z1 - g - 2], [x0 + g + 2, z0 + g - 0.08, x1 - g - 2, z0 + g], [x0 + g + 2, z1 - g, x1 - g - 2, z1 - g + 0.08]]) B.box(a0, hi + 3.0, c0, a1, hi + 3.5, c1, pick(sr, ['#e4572e', '#f2c14e', '#2f8f9d', '#f2efe6', '#3e8f86']), 'plain', { outlineT: 0, edges: false });
    body(x0, z0, x1, z1, fl, top);
    B.box(x0 - 0.1, fl - 0.5, z0 - 0.1, x1 + 0.1, fl, z1 + 0.1, pale, 'plain', { outlineT: 0.04, edges: false });
    const nx = Math.max(2, Math.round(w / 5.5)), nz = Math.max(2, Math.round(d / 5.5));
    for (let k = 0; k <= nx; k++) for (const z of [z0 + 0.5, z1 - 0.5]) post(U.lerp(x0 + 0.5, x1 - 0.5, k / nx), z, fl);
    for (let k = 1; k < nz; k++) for (const x of [x0 + 0.5, x1 - 0.5]) post(x, U.lerp(z0 + 0.5, z1 - 0.5, k / nz), fl);
  } else if (style === 'pilotis' && w > 22 && d > 22) {
    // the whole building on stilts: you skate straight through underneath, round a glass core
    const fl = hi + 5.6; farY = fl; const cw = w * 0.22, cd = d * 0.22, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    body(cx - cw, cz - cd, cx + cw, cz + cd, base, fl, 'plain', '#7d93ab');
    B.box(cx - cw - 0.05, hi + 0.1, cz - cd - 0.05, cx + cw + 0.05, hi + 0.5, cz + cd + 0.05, trimC, 'plain', { outlineT: 0, edges: false });
    body(x0, z0, x1, z1, fl, top);
    B.box(x0 - 0.1, fl - 0.45, z0 - 0.1, x1 + 0.1, fl, z1 + 0.1, trimC, 'plain', { outlineT: 0.04, edges: false });
    const nx = Math.max(2, Math.round(w / 9)), nz = Math.max(2, Math.round(d / 9));
    for (let a = 0; a <= nx; a++) for (let b = 0; b <= nz; b++) {
      const px = U.lerp(x0 + 1.6, x1 - 1.6, a / nx), pz = U.lerp(z0 + 1.6, z1 - 1.6, b / nz);
      if (Math.abs(px - cx) < cw + 1 && Math.abs(pz - cz) < cd + 1) continue;
      const g = terrainAt(px, pz); K.cyl(px, g - 1, pz, 0.6, fl - g + 1, pale, { outline: 0.05, seg: 10 });
      W.boxes.push({ x0: px - 0.5, y0: g - 1, z0: pz - 0.5, x1: px + 0.5, y1: fl, z1: pz + 0.5, tag: 'pillar' });
    }
    H.patch([x0, z0, x1, z1], '#d8cfbf', 'tiles', 0.075);
  } else if (style === 'steps' && w > 18 && d > 18) {
    // a plinth of two broad steps all round (their edges grind), the building standing back on top
    const s = 1.3;
    K.box(x0, base, z0, x1, hi + 0.42, z1, '#cfc6b4', 'paving', { outlineT: 0.05 });
    K.box(x0 + s, base, z0 + s, x1 - s, hi + 0.84, z1 - s, '#d8cfbf', 'paving', { outlineT: 0.05 });
    // (a landmark's own steps and columns stand on its front side: the plinth's edges don't grind there)
    const skip = land ? ['n', 'e', 's', 'w'].indexOf(['s', 'e', 'w', 'n'].find(q => faces.includes(q)) || 's') : -1;
    for (const [k, y] of [[0.12, hi + 0.45], [s + 0.12, hi + 0.87]]) {
      const c = [[x0 + k, y, z0 + k], [x1 - k, y, z0 + k], [x1 - k, y, z1 - k], [x0 + k, y, z1 - k]];
      if (skip < 0) K.rail(c, { hidden: true, loop: true, round: 0 }); else K.rail([0, 1, 2, 3].map(i => c[(skip + 1 + i) % 4]), { hidden: true, round: 0 });
    }
    box = [x0 + 2 * s, z0 + 2 * s, x1 - 2 * s, z1 - 2 * s];
    body(box[0], box[1], box[2], box[3], hi + 0.8, top);
    band(box[0], box[1], box[2], box[3], hi + 1.0, hi + 4.2);
  } else if (style === 'corner' && faces.length >= 2 && w > 20 && d > 20) {
    // the street corner is cut away at ground level: a little covered place under the upper floors
    const n = 7.5, fl = hi + 4.8; farY = fl; const ex = faces.includes('e'), sz = faces.includes('s');
    const ax0 = ex ? x0 : x0 + n, ax1 = ex ? x1 - n : x1;
    body(ax0, z0, ax1, z1, base, fl); band(ax0, z0, ax1, z1); F.box(ax0, base, z0, ax1, fl, z1, col);
    const bx0 = ex ? x1 - n : x0, bx1 = ex ? x1 : x0 + n, bz0 = sz ? z0 : z0 + n, bz1 = sz ? z1 - n : z1;
    body(bx0, bz0, bx1, bz1, base, fl); band(bx0, bz0, bx1, bz1);
    body(x0, z0, x1, z1, fl, top);
    const kx = ex ? x1 - 0.8 : x0 + 0.8, kz = sz ? z1 - 0.8 : z0 + 0.8, g = terrainAt(kx, kz);
    K.cyl(kx, g - 1, kz, 0.7, fl - g + 1, pale, { outline: 0.05, seg: 12 }); W.boxes.push({ x0: kx - 0.6, y0: g - 1, z0: kz - 0.6, x1: kx + 0.6, y1: fl, z1: kz + 0.6, tag: 'pillar' });
    // something to meet under: a clock on a post, a bench
    const mx = ex ? x1 - n / 2 : x0 + n / 2, mz = sz ? z1 - n / 2 : z0 + n / 2, my = terrainAt(mx, mz);
    K.cyl(mx, my - 0.2, mz, 0.09, 3.3, '#2a2838', { outline: 0.03, seg: 6 }); K.cyl(mx, my + 3.0, mz, 0.55, 0.3, '#f6f1e7', { outline: 0.04, seg: 14 });
    put(H.SH.BOX, mx, my + 3.32, mz, 0.05, 0.02, 0.4, '#1b1a24', 'plain', 0, 0.6); put(H.SH.BOX, mx, my + 3.32, mz, 0.05, 0.02, 0.3, '#1b1a24', 'plain', 0, 2.2);
    W.boxes.push({ x0: mx - 0.15, y0: my - 1, z0: mz - 0.15, x1: mx + 0.15, y1: my + 3.3, z1: mz + 0.15, tag: 'lamp' });
    H.sound(mx, my + 1, mz, 1.8, 'lamp');
  } else if (style === 'setback' && faces.length && w > 26 && d > 26) {
    // the building stands back from the street behind a forecourt: trees in planters, benches
    const fr = faceFrame(faces[Math.floor(sr() * faces.length) % faces.length], x0, z0, x1, z1), dep = 8;
    if (fr.f === 'n') box = [x0, z0 + dep, x1, z1]; else if (fr.f === 's') box = [x0, z0, x1, z1 - dep]; else if (fr.f === 'w') box = [x0 + dep, z0, x1, z1]; else box = [x0, z0, x1 - dep, z1];
    body(box[0], box[1], box[2], box[3], base, top); band(box[0], box[1], box[2], box[3]);
    const fc = frBox(fr, -fr.L / 2, fr.L / 2, -dep, 0); H.patch(fc, '#d8cfbf', 'tiles', 0.075);
    const n = Math.max(2, Math.floor(fr.L / 9));
    for (let k = 0; k < n; k++) { const [px, pz] = frPt(fr, U.lerp(-fr.L / 2 + 4, fr.L / 2 - 4, n === 1 ? 0.5 : k / (n - 1)), -dep / 2); if (k % 2 === 0) H.planter(px, pz, 2.6, 2.6, { h: 0.55, tree: pick(sr, ['#5aa35a', '#6fb25e', '#d9779a', '#e8b84a']) }); else H.bench(px, pz, fr.nx === 0, { color: '#5a4a3a' }); }
  } else {
    // 'band' and 'lobby': the plain podium with its dark glass band of shop windows
    body(x0, z0, x1, z1, base, top); band(x0, z0, x1, z1);
    if (style === 'lobby' && faces.length) {
      // a tall glass lobby pushed out onto the pavement, a canopy over its door
      const fr = faceFrame(['s', 'e', 'w', 'n'].find(q => faces.includes(q)), x0, z0, x1, z1), lw = Math.min(11, fr.L - 6) / 2, [gl, gh] = frGround(fr), lh = Math.min(h - 0.6, 6.5);
      const lb = frBox(fr, -lw, lw, 0, 3.6); K.box(lb[0], gl - 1, lb[1], lb[2], gh + lh, lb[3], '#9fc4d8', 'glass', { outlineT: 0.06 });
      const fb = frBox(fr, -lw - 0.15, lw + 0.15, -0.1, 3.75); B.box(fb[0], gh + lh, fb[1], fb[2], gh + lh + 0.3, fb[3], pale, 'plain', { outlineT: 0.04, edges: false });
      for (const u of [-lw, 0, lw]) { const mb = frBox(fr, u - 0.12, u + 0.12, 3.55, 3.7); B.box(mb[0], gl, mb[1], mb[2], gh + lh, mb[3], pale, 'plain', { outlineT: 0, edges: false }); }
      const cb = frBox(fr, -2.6, 2.6, 3.6, 6.2); K.box(cb[0], gh + 3.0, cb[1], cb[2], gh + 3.25, cb[3], trimC, 'plain', { outlineT: 0.04, nocam: true });
      for (const u of [-2.3, 2.3]) { const [px, pz] = frPt(fr, u, 5.9); K.cyl(px, terrainAt(px, pz) - 0.2, pz, 0.08, gh + 3.2 - terrainAt(px, pz), '#c9a24a', { outline: 0.02, seg: 6 }); }
      const db = frBox(fr, -1.3, 1.3, 3.58, 3.66); B.box(db[0], gh + 0.05, db[1], db[2], gh + 2.6, db[3], '#1f2a36', 'plain', { outlineT: 0, edges: false });
    }
  }
  cap(x0, z0, x1, z1, top);
  F.box(box[0], farY, box[1], box[2], top, box[3], col);
  return { base, top, lo, hi, box };
}

// a rooftop board on two posts: the name of the place, readable from streets away
function roofBoard(H, text, fr, y, bg, fg, w = 13, h = 2.8) {
  const [x, z] = frPt(fr, 0, -1.6), yaw = frYaw(fr);
  H.sign(text, x, y + 1.2 + h / 2, z, yaw, w, h, bg, fg);
  for (const u of [-w / 2 + 1, w / 2 - 1]) { const [px, pz] = frPt(fr, u, -1.6); H.K.cyl(px, y, pz, 0.12, 1.3, '#2a2838', { outline: 0.03, seg: 6 }); }
}
// a sign flat on a facade (read from the street)
function wallSign(H, text, fr, u, y, w, h, bg, fg, o = 0.14) { const [x, z] = frPt(fr, u, o); H.sign(text, x, y, z, frYaw(fr), w, h, bg, fg, { oneSide: true }); }

// the landmark fronts
function bizLandmark(H, kind, pod, faces, sr) {
  const { K, W, B } = H, put = H.put, [x0, z0, x1, z1] = pod.box;
  // (the front looks down the hill if it can: south first, then the other street sides)
  const f = ['s', 'e', 'w', 'n'].find(q => faces.includes(q)) || 's', fr = faceFrame(f, x0, z0, x1, z1), [gl, gh] = frGround(fr), ax = fr.nx === 0, hw = Math.min(fr.L / 2 - 1.5, 9);
  const fb = (u0, u1, o0, o1, y0, y1, c, kind2 = 'plain', o = {}) => { const b = frBox(fr, u0, u1, o0, o1); if (o.solid) K.box(b[0], y0, b[1], b[2], y1, b[3], c, kind2, { outlineT: o.ol ?? 0.05, nocam: true }); else B.box(b[0], y0, b[1], b[2], y1, b[3], c, kind2, { outlineT: o.ol ?? 0.03, edges: false }); };
  const col = (u, o, r, y1, c) => { const [px, pz] = frPt(fr, u, o), g = terrainAt(px, pz); K.cyl(px, g - 1, pz, r, y1 - g + 1, c, { outline: 0.05, seg: 12 }); W.boxes.push({ x0: px - r * 0.8, y0: g - 1, z0: pz - r * 0.8, x1: px + r * 0.8, y1, z1: pz + r * 0.8, tag: 'pillar' }); };
  const steps = (o1, n = 2) => { for (let k = 0; k < n; k++) fb(-hw - 1 + k * 0.8, hw + 1 - k * 0.8, 0, o1 - k * 1.1, gl - 1, gh + 0.3 * (k + 1), '#d8cfbf', 'paving', { solid: true }); };
  const doors = (y0 = gh + 0.1) => { for (const u of [-1.6, 1.6]) fb(u - 1.2, u + 1.2, 0.02, 0.1, y0, y0 + 2.7, '#1f2a36'); };
  const bulbs = (u0, u1, o, y, c = '#fff1c4') => { for (let u = u0; u <= u1; u += 0.9) fb(u - 0.12, u + 0.12, o - 0.12, o + 0.12, y - 0.14, y, c, 'lamp', { ol: 0 }); };
  const lit = (u, o, y) => { const [px, pz] = frPt(fr, u, o); W.lamps.push([px, y, pz]); H.pool(px, pz, 7, '#ffc870'); };
  if (kind === 'cinema') {
    const red = '#c4302b';
    fb(-hw, hw, 0, 3.6, gh + 3.9, gh + 4.9, red, 'plain', { solid: true });
    fb(-hw + 0.3, hw - 0.3, 3.55, 3.7, gh + 4.05, gh + 4.75, '#f6f1e7');
    bulbs(-hw + 0.5, hw - 0.5, 3.1, gh + 3.9); bulbs(-hw + 0.5, hw - 0.5, 0.9, gh + 3.9); lit(0, 2.5, gh + 3.8);
    wallSign(H, 'CINEMA', fr, 0, gh + 6.6, Math.min(11, hw * 1.5), 2.4, red, '#fff1c4');
    // the blade sign up the corner, with a ball on top
    fb(-hw - 1.0, -hw - 0.5, 0, 1.6, gh + 4.9, pod.top + 5, red, 'plain', { ol: 0.05 });
    for (let y = gh + 5.6; y < pod.top + 4.6; y += 1.1) fb(-hw - 0.9, -hw - 0.6, 1.6, 1.7, y, y + 0.5, '#fff1c4', 'lamp', { ol: 0 });
    doors(); for (const u of [-hw + 1.6, hw - 1.6]) fb(u - 1.1, u + 1.1, 0.02, 0.12, gh + 0.7, gh + 3.1, pick(sr, ['#f2c14e', '#2f8f9d', '#d9779a', '#3e8f86']));
    { const b = frBox(fr, -1, 1, 1.6, 3.0); K.box(b[0], gl - 0.5, b[1], b[2], gh + 2.3, b[3], '#f2e2c0', 'plain', { outlineT: 0.05 }); }
    roofBoard(H, 'CINEMA', fr, pod.top, red, '#fff1c4');
  } else if (kind === 'theatre' || kind === 'opera' || kind === 'museum' || kind === 'bank' || kind === 'baths') {
    const stone = kind === 'bank' ? '#cfc8b8' : kind === 'baths' ? '#d8e4e2' : '#efe6d4', ch = Math.min(8, pod.top - gh - 1.2), n = kind === 'bank' ? 4 : 6;
    steps(5.2, 2);
    for (let k = 0; k < n; k++) { const u = U.lerp(-hw + 1, hw - 1, k / (n - 1)); if (kind === 'bank') { const b = frBox(fr, u - 0.6, u + 0.6, 2.4, 3.6); K.box(b[0], gl - 1, b[1], b[2], gh + ch, b[3], stone, 'paving', { outlineT: 0.06 }); } else col(u, 3.2, 0.55, gh + ch, stone); }
    fb(-hw - 0.2, hw + 0.2, 0, 4.2, gh + ch, gh + ch + 1.1, stone, 'paving', { solid: true });
    if (kind !== 'bank') { const [px, pz] = frPt(fr, 0, 2.1); B.add(prismGeo(ax ? 2 * hw + 0.8 : 4.4, 2.6, ax ? 4.4 : 2 * hw + 0.8, !ax), new THREE.Matrix4().makeTranslation(px, gh + ch + 1.1, pz), kind === 'museum' ? '#c9b89a' : kind === 'baths' ? '#5fa8b8' : '#b85a3a', 'plain', { outlineT: 0.06, edges: false }); }
    doors(gh + 0.65); lit(0, 2, gh + ch - 0.3);
    const [bg, fg, name] = { theatre: ['#7a1f2a', '#f2c14e', 'THEATRE'], opera: ['#1f2a44', '#f2c14e', 'OPERA'], museum: ['#2a2838', '#f6f1e7', 'MUSEUM'], bank: ['#2f3a34', '#e8c87a', 'BANK'], baths: ['#2f8f9d', '#f6f1e7', 'BATHS'] }[kind];
    wallSign(H, name, fr, 0, gh + ch + 0.55, Math.min(9, hw * 1.3), 0.95, bg, fg, 4.26);
    if (kind === 'theatre' || kind === 'opera') for (let k = 0; k < n - 1; k++) { const u = U.lerp(-hw + 1, hw - 1, (k + 0.5) / (n - 1)); if (Math.abs(u) > 3) fb(u - 0.5, u + 0.5, 0.05, 0.12, gh + 3.2, gh + ch - 0.4, bg); }
    if (kind === 'museum') { const [px, pz] = frPt(fr, hw - 1, 7.5), g = terrainAt(px, pz); K.box(px - 1.1, g - 0.5, pz - 1.1, px + 1.1, g + 0.7, pz + 1.1, '#cfc6b4', 'paving', { outlineT: 0.05 }); put(H.SH.BOX, px, g + 2.1, pz, 1.7, 1.7, 1.7, '#e4572e', 'plain', 0.06, 0.6, 0.62, 0.78); for (const u of [-hw + 0.5, hw - 0.5]) fb(u - 0.45, u + 0.45, 4.25, 4.33, gh + ch - 4.2, gh + ch - 0.2, u < 0 ? '#2f8f9d' : '#e4572e'); }
    if (kind === 'baths') { const [px, pz] = frPt(fr, -hw + 1, 7.5); H.planter(px, pz, 2.6, 2.6, { h: 0.6, tree: '#6fb25e' }); }
    roofBoard(H, name, fr, pod.top, bg, fg);
  } else if (kind === 'hotel') {
    const navy = '#1f3a5f';
    fb(-3.4, 3.4, 0, 6.0, gh + 3.5, gh + 3.9, navy, 'plain', { solid: true });
    fb(-3.5, 3.5, 5.95, 6.1, gh + 3.3, gh + 3.95, '#c9a24a');
    for (const u of [-3.1, 3.1]) col(u, 5.6, 0.1, gh + 3.5, '#c9a24a');
    { const b = frBox(fr, -1.5, 1.5, 0, 7.5); for (let k = 0; k < 3; k++) { const t0 = k / 3, t1 = (k + 1) / 3, c = ax ? [b[0], U.lerp(b[1], b[3], t0), b[2], U.lerp(b[1], b[3], t1)] : [U.lerp(b[0], b[2], t0), b[1], U.lerp(b[0], b[2], t1), b[3]]; H.patch(c, '#b0252f', 'paint', 0.11); } }
    doors(); bulbs(-3, 3, 3, gh + 3.5); lit(0, 3, gh + 3.4);
    for (const u of [-5.2, 5.2]) { const [px, pz] = frPt(fr, u, 1.2); H.lamp(px, pz, { style: 'globe', h: 3.2, color: '#c9a24a', sound: 'lamp' }); }
    // flags leaning out over the door
    [['#c4302b', -2.4], ['#f6f1e7', 0], ['#2f5f8a', 2.4]].forEach(([c, u]) => { const [px, pz] = frPt(fr, u, 1.3), yaw = frYaw(fr); put(H.SH.CYL, px, gh + 6.2, pz, 0.05, 3.2, 0.05, '#d9d4c8', 'plain', 0.01, yaw, 0.7); const [qx, qz] = frPt(fr, u + 0.55, 2.3); put(H.SH.BOX, qx, gh + 6.6, qz, ax ? 1.1 : 0.04, 0.75, ax ? 0.04 : 1.1, c, 'plain', 0.02); });
    wallSign(H, 'GRAND HOTEL', fr, 0, gh + 4.9, 7, 1.0, navy, '#e8c87a');
    roofBoard(H, 'HOTEL', fr, pod.top, navy, '#e8c87a', 11, 3.2);
  } else if (kind === 'diner') {
    // a striped canopy the whole length, a counter window, booths outside
    for (let k = 0, u = -hw; u < hw - 0.1; u += 1.5, k++) fb(u, Math.min(hw, u + 1.5), 0, 2.6, gh + 3.15, gh + 3.3, k % 2 ? '#f6f1e7' : '#e4572e');
    { const b = frBox(fr, -hw, hw, 0, 2.6); W.boxes.push({ x0: b[0], y0: gh + 3.1, z0: b[1], x1: b[2], y1: gh + 3.3, z1: b[3], tag: 'bounce', nocam: true }); }
    fb(-hw, hw, 0.02, 0.12, gh + 3.4, gh + 3.9, '#d9dde2'); fb(-hw, hw, 0.02, 0.14, gh + 0.1, gh + 0.9, '#e4572e');
    fb(-hw, hw, 0.1, 0.2, gh + 3.95, gh + 4.1, '#ff7ab0', 'lamp', { ol: 0 }); lit(0, 2.5, gh + 3.1);
    wallSign(H, 'DINER', fr, 0, gh + 5.3, 6.5, 1.7, '#e4572e', '#fff6e0');
    { const b = frBox(fr, -hw + 1, hw - 1, 3.2, 8.2); H.cafe(b[0], b[1], b[2], b[3], 'business', sr, { table: '#e4572e', chair: '#d9dde2', busy: 0.7 }); H.reserve(b); }
    roofBoard(H, 'DINER', fr, pod.top, '#e4572e', '#fff6e0', 10, 3);
  } else if (kind === 'post') {
    fb(-hw, hw, 0.02, 0.14, gh + 3.4, gh + 4.3, '#f2c14e'); doors();
    wallSign(H, 'POST', fr, 0, gh + 5.3, 5, 1.5, '#f2c14e', '#1b1a24');
    for (const u of [-3.6, -4.5, 3.6]) { const [px, pz] = frPt(fr, u, 1.2), g = terrainAt(px, pz); K.box(px - 0.3, g - 0.3, pz - 0.3, px + 0.3, g + 1.25, pz + 0.3, '#f2c14e', 'plain', { outlineT: 0.04 }); H.sound(px, g + 1, pz, 1.4, 'bin'); }
    { const [px, pz] = frPt(fr, hw - 2, 2.2); H.bikes(px, pz, ax, 4, sr); }
    roofBoard(H, 'POST', fr, pod.top, '#f2c14e', '#1b1a24', 8, 2.8);
  } else if (kind === 'arcade') {
    const pu = '#6a3a9e';
    fb(-hw, hw, 0.02, 0.14, gh + 3.4, gh + 4.4, pu); doors();
    [['#ff5ab0', gh + 4.5], ['#5ad8ff', gh + 3.3], ['#ffe45a', gh + 0.3]].forEach(([c, y]) => fb(-hw, hw, 0.14, 0.22, y, y + 0.12, c, 'lamp', { ol: 0 }));
    for (const u of [-hw + 0.1, hw - 0.1]) fb(u - 0.06, u + 0.06, 0.14, 0.22, gh + 0.3, gh + 4.6, '#ff5ab0', 'lamp', { ol: 0 });
    wallSign(H, 'ARCADE', fr, 0, gh + 5.6, 7.5, 1.8, pu, '#ffe45a'); lit(0, 2.5, gh + 3.2);
    roofBoard(H, 'ARCADE', fr, pod.top, pu, '#ffe45a', 11, 3);
  } else if (kind === 'library') {
    wallSign(H, 'LIBRARY', fr, 0, gh + 6.3, 7.5, 1.3, '#3a4a7a', '#f2ead8');
    for (const u of [-hw + 1, hw - 1]) { const [px, pz] = frPt(fr, u, 1.8); H.lamp(px, pz, { style: 'globe', h: 3.4, color: '#3a4a7a', sound: 'lamp' }); }
    { const [px, pz] = frPt(fr, 0, 2.4); H.bikes(px, pz, ax, 6, sr); }
    roofBoard(H, 'LIBRARY', fr, pod.top, '#3a4a7a', '#f2ead8');
  } else if (kind === 'radio') {
    // the radio station: an ON AIR light over the door, and a lattice mast on the roof you can see from anywhere
    wallSign(H, 'ROLLER RADIO', fr, 0, gh + 5.0, 8, 1.2, '#1b1a24', '#ff6a5a', 3.76);
    { const [px, pz] = frPt(fr, 0, 3.8); H.sign('ON AIR', px, gh + 2.75, pz, frYaw(fr), 1.9, 0.5, '#c4302b', '#fff6e0', { oneSide: true }); }
    const [mx, mz] = frPt(fr, 0, -5), y = pod.top, mh = 26;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.rod(V3(mx + a * 1.5, y, mz + b * 1.5), V3(mx + a * 0.25, y + mh, mz + b * 0.25), 0.09, '#c4302b', 0.02);
    for (let k = 1; k < 7; k++) { const t = k / 7, s = U.lerp(1.5, 0.25, t); put(H.SH.BOX, mx, y + mh * t, mz, 2 * s, 0.1, 2 * s, k % 2 ? '#f6f1e7' : '#c4302b', 'plain', 0.02); }
    K.sphere(mx, y + mh + 0.5, mz, 0.5, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 });
    W.boxes.push({ x0: mx - 1, y0: y, z0: mz - 1, x1: mx + 1, y1: y + 4, z1: mz + 1, tag: 'pillar' });
    H.F.add(new THREE.ConeGeometry(1.6, mh, 4), new THREE.Matrix4().makeTranslation(mx, y + mh / 2, mz), '#c4302b');
    roofBoard(H, 'RADIO', fr, pod.top, '#1b1a24', '#ff6a5a', 9, 2.8);
  }
}
// an ordinary shop: an awning (taut canvas: it bounces) and a little sign over one bay
function bizShop(H, pod, faces, sr) {
  const { W, B } = H, [x0, z0, x1, z1] = pod.box;
  for (const f of faces) {
    if (sr() < 0.45) continue;
    const fr = faceFrame(f, x0, z0, x1, z1), [gl, gh] = frGround(fr), n = Math.floor((fr.L - 4) / 7);
    for (let k = 0; k < n; k++) {
      if (sr() < 0.5) continue;
      const u = -fr.L / 2 + 5.5 + k * 7, c = pick(sr, ['#e4572e', '#f2c14e', '#2f8f9d', '#3e8f86', '#d9779a', '#f2efe6', '#4a6ab8']);
      const b = frBox(fr, u - 2.6, u + 2.6, 0, 1.9); B.box(b[0], gh + 3.05, b[1], b[2], gh + 3.2, b[3], c, 'plain', { outlineT: 0.03, edges: false });
      W.boxes.push({ x0: b[0], y0: gh + 3.0, z0: b[1], x1: b[2], y1: gh + 3.2, z1: b[3], tag: 'bounce', nocam: true });
      if (sr() < 0.42) { const s = pick(sr, BIZ_SHOPS); wallSign(H, s[0], fr, u, gh + 4.05, 4.2, 0.85, s[1], s[2]); }
    }
  }
}
