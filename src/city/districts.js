// ============================================================
//  DISTRICTS — shared helpers, then one builder per district
// ============================================================
function districtKit(K, S, F) {
  const W = K.W, B = K.B;
  const H = { K, S, F, W, B };
  // keep things off the metro viaduct, the big roads and the canal
  const M = W.metro;
  H.clearOf = (x0, z0, x1, z1, pad = 3) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rr = Math.hypot(x1 - x0, z1 - z0) / 2 + pad;
    if (M) for (let i = 0; i < M.N; i += 2) { const p = M.pts[i]; if (Math.abs(p.x - cx) > rr + 12 || Math.abs(p.z - cz) > rr + 12) continue; if (rectDist([x0 - pad, z0 - pad, x1 + pad, z1 + pad], p.x, p.z) < METRO.deckW / 2 + 1.5) return false; }
    for (const st of (W.stations || [])) for (const rp of st.ramps) { const dx = rp.to[0] - rp.from[0], dz = rp.to[1] - rp.from[1], L = Math.hypot(dx, dz); for (let t = 0; t <= L; t += 4) if (rectDist([x0 - pad, z0 - pad, x1 + pad, z1 + pad], rp.from[0] + dx * t / L, rp.from[1] + dz * t / L) < 3) return false; }
    for (const r of Object.values(W.roads || {})) for (let i = 0; i < r.pts.length - 1; i++) {
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], L = Math.hypot(bx - ax, bz - az);
      for (let t = 0; t <= L; t += 6) if (rectDist([x0 - pad, z0 - pad, x1 + pad, z1 + pad], ax + (bx - ax) * t / L, az + (bz - az) * t / L) < r.width / 2 + 3.5) return false;
    }
    for (const x of [x0, x1, cx]) for (const z of [z0, z1, cz]) if (inCanal(x, z)) return false;
    for (const b of (H.reserved || [])) if (x1 + pad > b[0] && x0 - pad < b[2] && z1 + pad > b[1] && z0 - pad < b[3]) return false;
    for (const [P, hw] of H.lines) for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1];
      if (Math.max(ax, bx) + hw < x0 - pad || Math.min(ax, bx) - hw > x1 + pad || Math.max(az, bz) + hw < z0 - pad || Math.min(az, bz) - hw > z1 + pad) continue;
      const L = Math.hypot(bx - ax, bz - az); for (let t = 0; t <= L; t += 2) if (rectDist([x0 - pad, z0 - pad, x1 + pad, z1 + pad], ax + (bx - ax) * t / L, az + (bz - az) * t / L) < hw) return false;
    }
    return true;
  };
  H.reserved = []; H.lines = [];
  H.line = (P, hw) => H.lines.push([P, hw]);
  H.reserve = (r) => H.reserved.push(r);
  // a building standing on the slope (its floor line is the highest corner)
  H.bldg = (x0, z0, x1, z1, h, col, o = {}) => {
    const [lo, hi] = groundSpan(x0, z0, x1, z1);
    const base = lo - 1.5, top = (o.top ?? hi + h);
    K.box(x0, base, z0, x1, top, z1, col, o.kind || 'building', { roofColor: o.roof || col, outlineT: o.outline ?? 0.16 });
    if (o.trim !== false) B.box(x0 - 0.2, top - 0.7, z0 - 0.2, x1 + 0.2, top - 0.05, z1 + 0.2, o.trim || '#3a3550', 'plain', { outlineT: 0, edges: false });
    F.box(x0, base, z0, x1, top, z1, o.far || col);
    return { base, top, lo, hi };
  };
  // pitched roof: two kit ramps (so you can skate up one side and off the other)
  H.roof = (x0, z0, x1, z1, y, rise, col, alongX = null) => {
    const ax = alongX ?? (x1 - x0 < z1 - z0);       // ridge runs along the long side; slopes across the short one
    if (ax) { const m = (x0 + x1) / 2; K.ramp(x0 - 0.4, z0 - 0.4, m, z1 + 0.4, 'x', y, y + rise, col, false, y - 0.3, 'roof'); K.ramp(m, z0 - 0.4, x1 + 0.4, z1 + 0.4, 'x', y + rise, y, col, false, y - 0.3, 'roof'); }
    else { const m = (z0 + z1) / 2; K.ramp(x0 - 0.4, z0 - 0.4, x1 + 0.4, m, 'z', y, y + rise, col, false, y - 0.3, 'roof'); K.ramp(x0 - 0.4, m, x1 + 0.4, z1 + 0.4, 'z', y + rise, y, col, false, y - 0.3, 'roof'); }
    const g = ax ? prismGeo(x1 - x0 + 0.8, rise, z1 - z0 + 0.8, true) : prismGeo(x1 - x0 + 0.8, rise, z1 - z0 + 0.8, false);
    F.add(g, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, y, (z0 + z1) / 2), col);
  };
  // trees: faceted canopies (flat-shaded), trunk collider; big ones have no camera box (you're under them)
  H.tree = (x, z, o = {}) => {
    const s = o.s ?? 1, h = (o.h ?? 4) * s, r = (o.r ?? 2.6) * s, y = o.y ?? terrainAt(x, z), col = o.color || '#3f8a4a', rot = (x * 13.1 + z * 7.7) % 6.28;
    K.cyl(x, y - 0.3, z, 0.28 * s, h + 0.6, o.trunk || '#6b4a35', { outline: 0.05 * s, seg: 6, r2: 0.4 * s });
    const blob = (bx, by, bz, br, c) => B.add(flatGeo(new THREE.IcosahedronGeometry(br, 0)), new THREE.Matrix4().compose(V3(bx, by, bz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot, rot * 2, 0)), V3(1, o.squash ?? 0.85, 1)), c, 'flat', { outlineT: 0.14 * s, edges: false });
    blob(x, y + h + r * 0.55, z, r, col);
    if (!o.single) { blob(x + r * 0.55, y + h + r * 0.15, z + r * 0.25, r * 0.66, o.color2 || col); blob(x - r * 0.45, y + h + r * 0.25, z - r * 0.35, r * 0.62, o.color2 || col); }
    W.boxes.push({ x0: x - 0.4 * s, y0: y - 1, z0: z - 0.4 * s, x1: x + 0.4 * s, y1: y + h, z1: z + 0.4 * s, tag: 'tree' });
    if (!o.tall) W.camBoxes.push({ x0: x - r, y0: y + h, z0: z - r, x1: x + r, y1: y + h + r * 1.4, z1: z + r });
    if (o.far !== false) F.add(new THREE.IcosahedronGeometry(r * 0.9, 0), new THREE.Matrix4().compose(V3(x, y + h + r * 0.55, z), new THREE.Quaternion(), V3(1, 0.8, 1)), o.farColor || col);
  };
  H.pine = (x, z, o = {}) => {
    const s = o.s ?? 1, y = o.y ?? terrainAt(x, z), col = o.color || '#2f5a3a';
    K.cyl(x, y - 0.3, z, 0.25 * s, 2.2 * s, '#5b4030', { outline: 0.04, seg: 5 });
    for (let k = 0; k < 3; k++) B.add(flatGeo(new THREE.ConeGeometry((2.4 - k * 0.6) * s, 3.2 * s, 6)), new THREE.Matrix4().makeTranslation(x, y + (2.6 + k * 1.7) * s, z), col, 'flat', { outlineT: 0.1, edges: false });
    W.boxes.push({ x0: x - 0.35, y0: y - 1, z0: z - 0.35, x1: x + 0.35, y1: y + 3, z1: z + 0.35, tag: 'tree' });
    if (o.far !== false) F.add(new THREE.ConeGeometry(2.0 * s, 6 * s, 5), new THREE.Matrix4().makeTranslation(x, y + 4.2 * s, z), col);
  };
  // street lamp (glows at night) — lamps also chime softly as you pass (an instrument)
  H.lamp = (x, z, o = {}) => {
    const y = o.y ?? terrainAt(x, z), h = o.h ?? 4.6, col = o.color || '#2e2b3a';
    K.cyl(x, y - 0.2, z, 0.09, h + 0.2, col, { outline: 0.03, seg: 6 });
    if (o.style === 'globe') K.sphere(x, y + h + 0.25, z, 0.38, '#fff1c8', { kind: 'lamp', outline: 0.04, seg: 8 });
    else { B.box(x - 0.32, y + h - 0.1, z - 0.32, x + 0.32, y + h + 0.05, z + 0.32, col, 'plain', { outlineT: 0.02, edges: false }); B.box(x - 0.24, y + h - 0.5, z - 0.24, x + 0.24, y + h - 0.1, z + 0.24, o.glow || '#ffe2a6', 'lamp', { outlineT: 0.02, edges: false }); }
    W.boxes.push({ x0: x - 0.14, y0: y - 1, z0: z - 0.14, x1: x + 0.14, y1: y + h, z1: z + 0.14, tag: 'lamp' });
    W.lamps.push([x, y + h, z]);
    if (o.sound !== false) H.sound(x, y + 1, z, 1.6, o.sound || 'lamp');
  };
  H.bench = (x, z, alongX = true, o = {}) => {
    const y = o.y ?? terrainAt(x, z) + 0.02;
    K.bench(x, z, alongX, y, o.color || '#b8743a', o.rail ?? true);
    W.benches.push({ x, y, z, alongX, view: o.view });
  };
  // a paved patch that follows the ground (sampled on the terrain grid so it sits flush)
  H.patch = (r, color, kind = 'walk', lift = 0.06) => {
    const pos = [], st = 8;
    const sx0 = Math.floor((r[0] - TER.x0) / st) * st + TER.x0, sz0 = Math.floor((r[1] - TER.z0) / st) * st + TER.z0;
    for (let x = sx0; x < r[2]; x += st) for (let z = sz0; z < r[3]; z += st) {
      const a = Math.max(x, r[0]), b = Math.min(x + st, r[2]), c = Math.max(z, r[1]), d = Math.min(z + st, r[3]);
      if (b - a < 0.05 || d - c < 0.05 || inHole((a + b) / 2, (c + d) / 2) || inCanal((a + b) / 2, (c + d) / 2)) continue;
      const P = (px, pz) => [px, terrainAt(px, pz) + lift, pz];
      // match the terrain's triangle split inside each grid cell
      const m = [(a + b) / 2, (c + d) / 2];
      pos.push(...P(a, c), ...P(a, d), ...P(m[0], m[1]), ...P(a, d), ...P(b, d), ...P(m[0], m[1]), ...P(b, d), ...P(b, c), ...P(m[0], m[1]), ...P(b, c), ...P(a, c), ...P(m[0], m[1]));
    }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    B.add(g, null, color, kind, { outlineT: 0, edges: false });
  };
  H.path = (pts, width, color = '#cdbf9e', kind = 'gravel') => groundRibbon(B, pts, width, color, kind, 0.08, 3);
  // interaction: something that plays a note when you pass close
  H.sound = (x, y, z, r, kind, data = {}) => { W.sounds.push({ x, y, z, r, kind, cd: 0, ...data }); };
  H.spot = (key, x, z, r, extra = {}) => { const y = terrainAt(x, z); W.spots.push(Object.assign({ key, x, y, z, r, w: 0 }, extra)); };
  // a busker: a person, an instrument case, a little tune that grows as you come close
  H.busker = (inst, x, z, yaw = 0) => {
    const y = terrainAt(x, z);
    H.standers([[x, z, yaw, y]], 'market');
    const cx = x + Math.sin(yaw) * 1.2, cz = z + Math.cos(yaw) * 1.2;
    B.box(cx - 0.45, y, cz - 0.2, cx + 0.45, y + 0.25, cz + 0.2, '#3a2a22', 'plain', { outlineT: 0.02, edges: false });
    B.box(cx - 0.4, y + 0.25, cz - 0.15, cx + 0.4, y + 0.28, cz + 0.15, '#a0302a', 'plain', { outlineT: 0, edges: false });
    W.spots.push({ key: 'busk_' + inst, x, y, z, r: 22, w: 0, busker: true });
  };
  // walking people (and standing ones); stored for the life system
  H.walkers = (paths, n, style) => W.npcs.push({ kind: 'walk', paths, n, style });
  H.standers = (pts, style) => W.npcs.push({ kind: 'stand', pts, style });
  return H;
}
// faceted look: forget the smooth normals (the batcher then computes one per face)
function flatGeo(g) { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('normal'); return n; }
// a triangular prism (roof), ridge along x if alongX
function prismGeo(w, h, d, alongX) {
  const g = new THREE.BufferGeometry(), hw = w / 2, hd = d / 2, v = [];
  if (alongX) { const A = [-hw, 0, -hd], Bq = [-hw, 0, hd], C = [-hw, h, 0], D = [hw, 0, -hd], E = [hw, 0, hd], Fv = [hw, h, 0]; v.push(...A, ...C, ...Bq, ...D, ...E, ...Fv, ...A, ...D, ...Fv, ...A, ...Fv, ...C, ...Bq, ...C, ...Fv, ...Bq, ...Fv, ...E); }
  else { const A = [-hw, 0, -hd], Bq = [hw, 0, -hd], C = [0, h, -hd], D = [-hw, 0, hd], E = [hw, 0, hd], Fv = [0, h, hd]; v.push(...A, ...Bq, ...C, ...D, ...Fv, ...E, ...A, ...C, ...Fv, ...A, ...Fv, ...D, ...Bq, ...E, ...Fv, ...Bq, ...Fv, ...C); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const BIZ_PAL = ['#8fb7cc', '#d8d2c4', '#c9b28a', '#e6dfcf', '#7a9aa8', '#b9c7cf', '#d9a07a', '#e8c87a', '#9fbfb0', '#e4572e', '#2f8f9d', '#f2efe6'];

function buildDistricts(K, S, F) {
  const H = districtKit(K, S, F);
  // the canals and lakeshore first: their quays and promenades claim the ground the others avoid
  buildCanals(H);
  buildLakeshore(H);
  buildBusiness(H);
  buildMarket(H);
  buildOldTown(H);
  buildDocks(H);
  buildPark(H);
  buildObservatory(H);
  return H;
}

// ============================================================
//  BUSINESS — towers on the slope, busy streets, a parking garage
//  that spirals up to a hidden rooftop garden
// ============================================================
function buildBusiness(H) {
  const { K, W, B, F, S } = H, r = U.rng(101);
  const R = PLAN.byKey.business.rect;
  const xs = [-240, -116, 8, 132, 256, 396], zs = [-996, -870, -744, -618, -492, -366, -240, -114, 12, 138, 240];
  const street = 16, pal = BIZ_PAL;
  // streets: the grid, laid on the slope
  for (const x of xs.slice(1, -1)) { groundRibbon(B, [[x, R[1] + 4], [x, R[3] - 4]], street + 6, '#cfc8bb', 'walk', 0.07); const P = groundRibbon(B, [[x, R[1] + 4], [x, R[3] - 4]], street - 4, '#55535f', 'road', 0.1); roadDashes(B, P); W.walkLines = (W.walkLines || []).concat([[[x - street / 2 - 1, R[1] + 10], [x - street / 2 - 1, R[3] - 10]], [[x + street / 2 + 1, R[1] + 10], [x + street / 2 + 1, R[3] - 10]]]); }
  for (const z of zs.slice(1, -1)) { groundRibbon(B, [[R[0] + 4, z], [R[2] - 4, z]], street + 6, '#cfc8bb', 'walk', 0.07); groundRibbon(B, [[R[0] + 4, z], [R[2] - 4, z]], street - 4, '#55535f', 'road', 0.1); W.walkLines.push([[R[0] + 10, z - street / 2 - 1], [R[2] - 10, z - street / 2 - 1]]); }
  // Central plaza: around the station
  const cs = PLAN.stations.find(s => s.key === 'central').at;
  const plaza = [cs[0] - 70, cs[1] - 60, cs[0] + 70, cs[1] + 60];
  H.patch(plaza, '#d8cfbf', 'tiles', 0.08); H.reserve(plaza);
  // fountain in the plaza
  const fx = cs[0] + 40, fz = cs[1] + 32, fy = terrainAt(fx, fz);
  K.cyl(fx, fy - 0.2, fz, 6, 0.8, '#bdb4a4', { outline: 0.08, seg: 24 }); K.cyl(fx, fy - 0.2, fz, 1.0, 2.6, '#bdb4a4', { outline: 0.06, seg: 12 });
  W.boxes.push({ x0: fx - 5, y0: fy - 1, z0: fz - 5, x1: fx + 5, y1: fy + 0.6, z1: fz + 5, tag: 'fountain' });
  W.fountains = [{ x: fx, y: fy + 2.6, z: fz }];
  H.sound(fx, fy + 1, fz, 7, 'fountain');
  for (let a = 0; a < 6; a++) H.bench(fx + Math.cos(a) * 11, fz + Math.sin(a) * 11, Math.abs(Math.cos(a)) < 0.5);
  H.busker('sax', fx - 14, fz + 4, Math.PI / 2);
  // the rooftop garden: a car park with ramps up to a roof full of plants
  const sp = PLAN.spots.find(s => s.key === 'rooftop').at;
  buildGarage(H, sp[0] - 22, sp[1] - 16, sp[0] + 22, sp[1] + 16);
  // blocks
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const bx0 = xs[i] + street / 2 + 5, bx1 = xs[i + 1] - street / 2 - 5, bz0 = zs[j] + street / 2 + 5, bz1 = zs[j + 1] - street / 2 - 5;
    if (bx1 - bx0 < 20 || bz1 - bz0 < 20) continue;
    // centrality: taller near Central and the middle of the district
    const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, core = Math.exp(-Math.hypot(cx - 60, cz + 280) / 520);
    // split into lots
    const lots = [];
    if (r() < 0.35) lots.push([bx0, bz0, bx1, bz1]);
    else { const mx = U.lerp(bx0, bx1, 0.4 + r() * 0.2), mz = U.lerp(bz0, bz1, 0.4 + r() * 0.2); lots.push([bx0, bz0, mx - 4, mz - 4], [mx + 4, bz0, bx1, mz - 4], [bx0, mz + 4, mx - 4, bz1], [mx + 4, mz + 4, bx1, bz1]); }
    for (const [x0, z0, x1, z1] of lots) {
      if (x1 - x0 < 12 || z1 - z0 < 12) continue;
      if (!H.clearOf(x0, z0, x1, z1, 4)) {
        // too close to the viaduct: a small pavilion or trees instead
        if (H.clearOf(x0 + 6, z0 + 6, x1 - 6, z1 - 6, 1) && r() < 0.5) H.bldg(x0 + 6, z0 + 6, x1 - 6, z1 - 6, 6 + r() * 4, pick(r, pal), { trim: '#2a2838' });
        else for (let k = 0; k < 3; k++) { const tx = U.lerp(x0, x1, r()), tz = U.lerp(z0, z1, r()); if (H.clearOf(tx - 2, tz - 2, tx + 2, tz + 2, 1)) H.tree(tx, tz, { s: 0.8, color: '#4f9a52' }); }
        continue;
      }
      const tall = 14 + r() * 20 + core * (40 + r() * 70);
      const col = pick(r, pal), trim = pick(r, ['#2a2838', '#e8e2d4', '#c9a24a', '#14101f']);
      // a podium, then a tower with set-backs
      const pod = H.bldg(x0, z0, x1, z1, 7 + r() * 4, pick(r, ['#d9d3c4', '#c8bfae', '#b5a993', '#e6dfd0']), { trim: '#3a3550' });
      let y = pod.top, ix0 = x0 + 3, iz0 = z0 + 3, ix1 = x1 - 3, iz1 = z1 - 3, h = tall;
      let tiers = 1 + Math.floor(r() * 3);
      while (tiers-- > 0 && h > 8) {
        const th = tiers === 0 ? h : h * (0.45 + r() * 0.25);
        K.box(ix0, y - 0.2, iz0, ix1, y + th, iz1, col, r() < 0.65 ? 'tower' : 'building', { roofColor: '#c9c2b4', outlineT: 0.16 });
        B.box(ix0 - 0.2, y + th - 0.7, iz0 - 0.2, ix1 + 0.2, y + th - 0.1, iz1 + 0.2, trim, 'plain', { outlineT: 0, edges: false });
        F.box(ix0, y - 0.2, iz0, ix1, y + th, iz1, col);
        y += th; h -= th; const sh = 2 + r() * 3; ix0 += sh; iz0 += sh; ix1 -= sh; iz1 -= sh;
        if (ix1 - ix0 < 6 || iz1 - iz0 < 6) break;
      }
      // crowns: antenna, beacon, rooftop boxes
      if (tall > 60 && r() < 0.6) { const ax = (ix0 + ix1) / 2, az = (iz0 + iz1) / 2; K.cyl(ax, y, az, 0.25, 8 + r() * 10, '#d9d4ea', { outline: 0.03, seg: 6 }); K.sphere(ax, y + 9, az, 0.5, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 }); }
      else if (r() < 0.7) K.ac((ix0 + ix1) / 2 + (r() - 0.5) * 4, (iz0 + iz1) / 2 + (r() - 0.5) * 4, y, 3, 1.6, 3, '#e9e4f5');
    }
    // street trees + lamps along the block edges
    for (let t = bz0 + 6; t < bz1 - 4; t += 18) {
      if (H.clearOf(bx0 - 7, t - 1, bx0 - 5, t + 1, 0)) H.tree(bx0 - 6, t, { s: 0.75, color: '#5aa35a', color2: '#4a8f4a' });
      if (H.clearOf(bx0 - 7, t + 7, bx0 - 5, t + 10, 0)) H.lamp(bx0 - 6, t + 9);
    }
  }
  // people: lots of them, walking the sidewalks
  H.walkers(W.walkLines, 140, 'business');
  // music points: the district's crowd percussion lives on the sidewalks (see life)
}
// a four-level car park: ramps up the east and west strips in turn; the roof is a garden (hidden spot)
function buildGarage(H, x0, z0, x1, z1) {
  const { K, W, B, S, F } = H;
  H.reserve([x0 - 10, z0 - 10, x1 + 10, z1 + 10]);
  const [lo, hi] = groundSpan(x0, z0, x1, z1), g0 = hi + 0.05, lvl = 4.2, nL = 4, sw = 7.6;
  const fx0 = x0 + sw, fx1 = x1 - sw, zc = (z0 + z1) / 2;
  H.patch([x0 - 4, z0 - 4, x1 + 4, z1 + 4], '#b9b3a8', 'walk');
  for (let k = 0; k <= nL; k++) {
    const y = g0 + k * lvl;
    if (k > 0) {
      S.add(fx0, y, zc, fx1, y, zc, (z1 - z0) / 2);
      B.box(fx0, y - 0.6, z0, fx1, y, z1, '#bdb6a8', 'plain', { outlineT: 0.08 });
      W.boxes.push({ x0: fx0, y0: y - 0.6, z0, x1: fx1, y1: y - 0.55, z1, nocam: true, tag: 'slab' });
      // floor-edge parapets on the north and south sides
      for (const zz of [z0 + 0.3, z1 - 0.3]) K.rail([[fx0, y + 1.0, zz], [fx1, y + 1.0, zz]], { color: '#e9e4f5', postMax: 1.2, round: 0 });
    }
    if (k < nL) {
      // even levels climb the east strip northwards, odd ones the west strip southwards
      const east = k % 2 === 0, sx = east ? x1 - sw / 2 : x0 + sw / 2;
      const za = east ? z0 + 1 : z1 - 1, zb = east ? z1 - 1 : z0 + 1, ya = y, yb = y + lvl;
      S.add(sx, ya, za, sx, yb, zb, sw / 2 - 0.2);
      const len = Math.abs(zb - za), mid = V3(sx, (ya + yb) / 2 - 0.3, (za + zb) / 2);
      B.add(new THREE.BoxGeometry(sw - 0.4, 0.5, Math.hypot(len, lvl)), new THREE.Matrix4().makeRotationX((east ? -1 : 1) * Math.atan2(lvl, len)).setPosition(mid), '#a8a194', 'plain', { outlineT: 0.06, edges: false });
      // its outer rail, sloping with it
      const ox = east ? x1 - 0.3 : x0 + 0.3;
      K.rail([[ox, ya + 1.0, za], [ox, yb + 1.0, zb]], { color: '#e9e4f5', postMax: 1.2, round: 0 });
      for (const [cx, cz] of [[fx0, z0 + 0.6], [fx0, z1 - 0.6], [fx1, z0 + 0.6], [fx1, z1 - 0.6]]) K.box(cx - 0.45, y - 0.3, cz - 0.45, cx + 0.45, y + lvl - 0.6, cz + 0.45, '#9a9386', 'plain', { outlineT: 0.04 });
    }
  }
  F.box(fx0, lo, z0, fx1, g0 + nL * lvl, z1, '#bdb6a8');
  // the garden on top
  const ry = g0 + nL * lvl;
  for (let i = 0; i < 6; i++) { const tx = U.lerp(fx0 + 4, fx1 - 4, (i % 3) / 2), tz = U.lerp(z0 + 5, z1 - 5, Math.floor(i / 3)); K.box(tx - 1.6, ry, tz - 1.6, tx + 1.6, ry + 0.8, tz + 1.6, '#8a6a4a', 'wood', { outlineT: 0.04 }); H.tree(tx, tz, { y: ry + 0.8, s: 0.6, h: 2.5, color: ['#6fbf6a', '#d9779a', '#e8b84a'][i % 3], far: false }); }
  H.bench((fx0 + fx1) / 2, zc, true, { y: ry + 0.02, view: true });
  H.spot('rooftop', (fx0 + fx1) / 2, zc, 22);
  W.spots[W.spots.length - 1].y = ry;
}

// ============================================================
//  FOREST PARK — tall trees you skate under, trails, a pond with a boardwalk,
//  and a glasshouse on a knoll (hidden spot)
// ============================================================
function buildPark(H) {
  const { K, W, B, F, S } = H, r = U.rng(202);
  const R = PLAN.byKey.park.rect;
  const pond = PLAN.pond;
  // trails: a few long loops (paths are where the music likes to be)
  const trails = [
    [[-330, 160], [-420, 40], [-520, -60], [-610, -220], [-700, -380], [-660, -510], [-560, -700], [-470, -900], [-420, -1100], [-380, -1300]],
    [[-660, -510], [-780, -420], [-880, -330], [-960, -180], [-880, -60], [-760, -100], [-700, -220], [-610, -220]],
    [[-700, -380], [-850, -560], [-930, -720], [-900, -888], [-800, -1000], [-700, -1150], [-560, -1300], [-380, -1300]],
    [[-520, -60], [-640, 60], [-800, 120], [-960, 60], [-1000, -60], [-960, -180]],
  ];
  const trailPts = [];
  for (const t of trails) { const P = H.path(t, 4.5, '#c9b892'); trailPts.push(...P); }
  W.parkTrails = trails;
  const nearTrail = (x, z, d) => { for (const p of trailPts) if (Math.abs(p[0] - x) < d && Math.abs(p[1] - z) < d && Math.hypot(p[0] - x, p[1] - z) < d) return true; return false; };
  // lanterns + benches along the trails
  let k = 0;
  for (const t of trails) for (let i = 0; i < t.length - 1; i++) {
    const [ax, az] = t[i], [bx, bz] = t[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let s = 20; s < L - 10; s += 46) {
      const x = ax + ux * s - uz * 3.6, z = az + uz * s + ux * 3.6;
      if (k++ % 3 === 0) H.bench(x, z, Math.abs(ux) > Math.abs(uz), { color: '#7a5a3a', view: false }); else H.lamp(x, z, { h: 3.2, style: 'globe', color: '#2a3a2a', sound: 'lantern' });
    }
  }
  // the pond: water, reeds, a boardwalk across
  const pm = new THREE.Mesh(new THREE.CircleGeometry(pond.r, 40), new THREE.MeshBasicMaterial({ color: 0x3f6f5a, map: W.mats.waterTex, transparent: true, opacity: 0.85, depthWrite: false }));
  pm.rotation.x = -Math.PI / 2; pm.position.set(pond.x, pond.y, pond.z); pm.renderOrder = 3; W.group.add(pm);
  const puv = pm.geometry.attributes.uv; for (let i = 0; i < puv.count; i++) puv.setXY(i, puv.getX(i) * 18, puv.getY(i) * 18); puv.needsUpdate = true;
  W.waters.push({ x0: pond.x - pond.r * 0.7, z0: pond.z - pond.r * 0.7, x1: pond.x + pond.r * 0.7, z1: pond.z + pond.r * 0.7, y: pond.y, deep: true, pond: true });
  W.pond = pond;
  const bw0 = [pond.x - pond.r - 6, pond.z + 10], bw1 = [pond.x + pond.r + 6, pond.z - 14];
  const by = pond.y + 0.7;
  S.add(bw0[0], terrainAt(bw0[0], bw0[1]) + 0.1, bw0[1], pond.x - pond.r + 18, by, U.lerp(bw0[1], bw1[1], 0.08), 1.6);
  S.add(pond.x - pond.r + 18, by, U.lerp(bw0[1], bw1[1], 0.08), pond.x + pond.r - 18, by, U.lerp(bw0[1], bw1[1], 0.92), 1.6);
  S.add(pond.x + pond.r - 18, by, U.lerp(bw0[1], bw1[1], 0.92), bw1[0], terrainAt(bw1[0], bw1[1]) + 0.1, bw1[1], 1.6);
  const bl = Math.hypot(bw1[0] - bw0[0], bw1[1] - bw0[1]), byaw = Math.atan2(bw1[0] - bw0[0], bw1[1] - bw0[1]);
  for (let s = 0; s < bl; s += 4) {
    const t = s / bl, x = U.lerp(bw0[0], bw1[0], t), z = U.lerp(bw0[1], bw1[1], t);
    const yy = Math.max(by * (t > 0.08 && t < 0.92 ? 1 : 0), terrainAt(x, z) + 0.1, t < 0.08 ? U.lerp(terrainAt(bw0[0], bw0[1]) + 0.1, by, t / 0.08) : t > 0.92 ? U.lerp(by, terrainAt(bw1[0], bw1[1]) + 0.1, (t - 0.92) / 0.08) : by);
    B.add(new THREE.BoxGeometry(3.2, 0.25, 4.1), new THREE.Matrix4().makeRotationY(byaw).setPosition(x, yy - 0.13, z), '#8a6a48', 'wood', { outlineT: 0.04, edges: false });
    if (s % 8 === 0) for (const sd of [-1, 1]) K.cyl(x + Math.cos(byaw) * sd * 1.5, pond.y - 2, z - Math.sin(byaw) * sd * 1.5, 0.12, yy - pond.y + 2.9, '#5a4430', { outline: 0.02, seg: 5 });
    if (s % 12 === 0) H.sound(x, yy, z, 2.4, 'plank');
  }
  for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, d = pond.r * (0.85 + r() * 0.2), x = pond.x + Math.cos(a) * d, z = pond.z + Math.sin(a) * d; B.add(new THREE.ConeGeometry(0.25, 1.6 + r(), 4), new THREE.Matrix4().makeTranslation(x, pond.y + 0.5, z), '#6f8f4a', 'flat', { outlineT: 0, edges: false }); }
  H.sound(pond.x, pond.y, pond.z, pond.r + 15, 'pond');
  // the glasshouse
  const gh = PLAN.spots.find(s => s.key === 'glasshouse').at;
  buildGlasshouse(H, gh[0], gh[1]);
  // the forest: big trees except on trails, the pond, clearings and the station
  const clear = [[-900, -888, 46], [-660, -510, 70], [pond.x, pond.z, pond.r + 18], [-760, -100, 40], [-560, -1300, 55], [-440, -1000, 30]];
  const pst = PLAN.stations.find(s => s.key === 'park').at;
  for (let x = R[0] + 8; x < R[2] - 4; x += 15) for (let z = R[1] + 8; z < R[3] - 4; z += 15) {
    const tx = x + (r() - 0.5) * 12, tz = z + (r() - 0.5) * 12;
    if (clear.some(([cx, cz, cr]) => Math.hypot(tx - cx, tz - cz) < cr)) continue;
    if (nearTrail(tx, tz, 6)) continue;
    // glades: patches of open meadow
    const glade = Math.sin(tx * 0.013) * Math.sin(tz * 0.011) > 0.55;
    if (glade && r() < 0.85) continue;
    if (!H.clearOf(tx - 1, tz - 1, tx + 1, tz + 1, 1)) continue;
    const big = r() < 0.7, dark = r();
    const col = dark < 0.33 ? '#2f5f34' : dark < 0.66 ? '#3a6f3a' : '#47803f';
    if (tz < -1000 && r() < 0.5) H.pine(tx, tz, { s: 1.6 + r() * 0.8, color: '#2c5236' });
    else H.tree(tx, tz, { s: big ? 1.9 + r() * 0.9 : 1.1 + r() * 0.4, h: big ? 6.4 : 4.4, r: 3.4, color: col, color2: dark < 0.5 ? '#36693a' : '#4f8a44', tall: big, trunk: '#5a4232' });
  }
  // shafts of light through the canopy (soft additive planes)
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true });
  W.rayMat = rayMat;
  const rayParts = [];
  for (let i = 0; i < 70; i++) {
    const t = trailPts[Math.floor(r() * trailPts.length)], x = t[0] + (r() - 0.5) * 20, z = t[1] + (r() - 0.5) * 20, y = terrainAt(x, z);
    rayParts.push([new THREE.PlaneGeometry(2 + r() * 3, 26), T4(x, y + 11, z, 0.35, r() * 6, 0.25), '#ffffff']);
  }
  const rays = new THREE.Mesh(mergeParts(rayParts), rayMat); W.group.add(rays);
  H.walkers(trails.map(t => t.slice()), 26, 'park');
  H.busker('flute', -760, -96, 0.6);
}
function buildGlasshouse(H, x, z) {
  const { K, W, B, F } = H;
  const y = terrainAt(x, z) + 0.05, w = 22, d = 34;
  H.patch([x - w / 2 - 4, z - d / 2 - 4, x + w / 2 + 4, z + d / 2 + 4], '#d8cdb5', 'tiles');
  // glass walls (collide) with a doorway on the south side
  const glass = '#bfe8e8';
  const wall = (x0, z0, x1, z1) => { B.box(x0, y, z0, x1, y + 6, z1, glass, 'glass', { outlineT: 0, edges: true }); W.boxes.push({ x0, y0: y - 1, z0, x1, y1: y + 6, z1, nocam: true }); };
  wall(x - w / 2, z - d / 2, x + w / 2, z - d / 2 + 0.3);
  wall(x - w / 2, z - d / 2, x - w / 2 + 0.3, z + d / 2);
  wall(x + w / 2 - 0.3, z - d / 2, x + w / 2, z + d / 2);
  wall(x - w / 2, z + d / 2 - 0.3, x - 3, z + d / 2); wall(x + 3, z + d / 2 - 0.3, x + w / 2, z + d / 2);
  // the curved roof as ribs + glass
  for (let i = 0; i <= 8; i++) { const zz = z - d / 2 + i * d / 8; const pts = []; for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI; pts.push(V3(x - Math.cos(t) * w / 2, y + 6 + Math.sin(t) * 5, zz)); } B.add(tubeGeo(pts, 0.12, 5), null, '#f4f1ea', 'plain', { outlineT: 0, edges: false }); }
  const roof = new THREE.CylinderGeometry(w / 2, w / 2, d, 16, 1, true, -Math.PI / 2, Math.PI);
  roof.rotateX(Math.PI / 2); roof.scale(1, 1, 1);
  const rm = new THREE.Mesh(roof, new THREE.MeshBasicMaterial({ color: 0xcff5f0, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
  rm.scale.set(1, 5 / (w / 2), 1); rm.position.set(x, y + 6, z); W.group.add(rm);
  W.camBoxes.push({ x0: x - w / 2, y0: y + 6, z0: z - d / 2, x1: x + w / 2, y1: y + 12, z1: z + d / 2 });
  // plants inside: palms and flowers
  for (let i = 0; i < 10; i++) { const px = x + ((i % 2) ? 5 : -5), pz = z - d / 2 + 4 + Math.floor(i / 2) * 6.5; H.tree(px, pz, { y, s: 0.7, h: 3.5, color: ['#4fae6a', '#e07a9a', '#7fcf5a'][i % 3], single: i % 3 === 1, far: false }); }
  F.box(x - w / 2, y, z - d / 2, x + w / 2, y + 9, z + d / 2, '#cfeeea');
  H.bench(x, z + 4, false, { y, view: false });
  H.spot('glasshouse', x, z, 20);
}

// ============================================================
//  OBSERVATORY — the summit: a domed observatory, a viewing terrace, meadow
// ============================================================
function buildObservatory(H) {
  const { K, W, B, F, S } = H, r = U.rng(303);
  const ox = 90, oz = -1300, oy = terrainAt(ox, oz);
  // the building
  H.patch([ox - 26, oz - 26, ox + 26, oz + 26], '#d6ccb8', 'walk');
  K.cyl(ox, oy - 2, oz, 9, 9, '#efe8dc', { outline: 0.12, seg: 20 });
  W.boxes.push({ x0: ox - 8.5, y0: oy - 2, z0: oz - 8.5, x1: ox + 8.5, y1: oy + 7, z1: oz + 8.5, tag: 'obs' });
  K.sphere(ox, oy + 7, oz, 9.2, '#c9d2dc', { outline: 0.14, seg: 20, sy: 0.85 });
  B.box(ox - 1.2, oy + 9, oz - 9.5, ox + 1.2, oy + 15, oz - 5, '#3a4458', 'plain', { outlineT: 0.04 });
  F.add(new THREE.CylinderGeometry(8.8, 8.8, 9, 12), new THREE.Matrix4().makeTranslation(ox, oy + 2.5, oz), '#efe8dc');
  F.add(new THREE.SphereGeometry(8.9, 12, 6), new THREE.Matrix4().makeTranslation(ox, oy + 7, oz), '#c9d2dc');
  // the terrace: a low wall around a stone platform looking south over the city
  const tx = 96, tz = -1180, ty = cityHeight(tx, tz) + 0.3;
  S.add(tx - 30, ty, tz - 6, tx + 30, ty, tz - 6, 12);
  B.box(tx - 30, ty - 1.4, tz - 18, tx + 30, ty, tz + 6, '#c9b99a', 'paving', { outlineT: 0.08 });
  W.boxes.push({ x0: tx - 30, y0: ty - 1.4, z0: tz - 18, x1: tx + 30, y1: ty - 0.05, z1: tz + 6, tag: 'terrace', nocam: true });
  K.rail([[tx - 29.5, ty + 1.0, tz + 5.6], [tx - 7, ty + 1.0, tz + 5.6]], { color: '#e9e4f5', postMax: 1.2 });
  K.rail([[tx + 7, ty + 1.0, tz + 5.6], [tx + 29.5, ty + 1.0, tz + 5.6]], { color: '#e9e4f5', postMax: 1.2 });
  // a ramp down from the gap onto the meadow path
  const gy = terrainAt(tx, tz + 22);
  S.add(tx, ty, tz + 5.5, tx, gy + 0.05, tz + 22, 6);
  B.add(new THREE.BoxGeometry(12, 0.6, Math.hypot(16.5, ty - gy)), new THREE.Matrix4().makeRotationX(Math.atan2(ty - gy, 16.5)).setPosition(tx, (ty + gy) / 2 - 0.35, tz + 13.75), '#cbbd9f', 'paving', { outlineT: 0.06, edges: false });
  for (const bx of [-18, -6, 6, 18]) H.bench(tx + bx, tz + 2, true, { y: ty + 0.02, view: true });
  for (const bx of [-24, 24]) { K.cyl(tx + bx, ty, tz + 3, 0.12, 1.1, '#3a3550', { outline: 0.02, seg: 6 }); B.add(new THREE.CylinderGeometry(0.18, 0.28, 1.2, 8), new THREE.Matrix4().makeRotationX(-0.9).setPosition(tx + bx, ty + 1.35, tz + 3.3), '#c9a24a', 'plain', { outlineT: 0.03, edges: false }); H.sound(tx + bx, ty + 1, tz + 3, 2, 'telescope'); }
  W.spawn.set(tx, ty, tz - 6); W.spawnYaw = 0;
  W.terrace = { x: tx, y: ty, z: tz };
  // meadow: flowers (tiny coloured cones) and a few pines; paths down the hill
  for (let i = 0; i < 700; i++) {
    const a = r() * Math.PI * 2, d = 40 + r() * 260, x = ox + Math.cos(a) * d, z = oz + Math.sin(a) * d * 0.8;
    if (!H.clearOf(x - 1, z - 1, x + 1, z + 1, 0) || rectDist([tx - 32, tz - 20, tx + 32, tz + 8], x, z) < 2) continue;
    const y = terrainAt(x, z);
    B.add(new THREE.ConeGeometry(0.22, 0.5, 4), new THREE.Matrix4().makeTranslation(x, y + 0.2, z), pick(r, ['#f2d24a', '#e86fa0', '#ffffff', '#9a7fe0', '#ff8a4a']), 'flat', { outlineT: 0, edges: false });
  }
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 120 + r() * 220, x = ox + Math.cos(a) * d, z = oz + Math.sin(a) * d * 0.7; if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 2) && rectDist([tx - 40, tz - 30, tx + 40, tz + 20], x, z) > 4) H.pine(x, z, { s: 1.1 + r() * 0.6 }); }
  const paths = [[[tx, tz + 6], [tx - 40, tz + 60], [tx + 30, tz + 130], [tx - 10, tz + 200], [40, -900]], [[ox, oz + 24], [ox + 60, oz + 80], [tx + 30, tz - 10]], [[216, -1044], [180, -1090], [tx + 31, tz - 6]], [[ox - 20, oz], [-120, -1250], [-260, -1200], [-380, -1300]]];
  for (const p of paths) H.path(p, 3.6, '#d8cba8');
  H.walkers(paths, 6, 'park');
}
