// ============================================================
//  DISTRICTS — shared helpers, then one builder per district
// ============================================================
function districtKit(K, S, F) {
  const W = K.W, B = K.B;
  const H = { K, S, F, W, B };
  // keep things off the metro viaduct, the big roads, the lanes and each other.
  // Everything that blocks is filed in two grids: points with a radius, and reserved rects.
  const PG = makeGrid(24), RG = makeGrid(24);
  let maxR = 0;
  const block = (x, z, r) => { const e = { x, z, r }; PG.add(e, x - r, z - r, x + r, z + r); if (r > maxR) maxR = r; };
  const M = W.metro;
  // (deep under downtown the line doesn't get in the way of anything on the surface)
  if (M) for (let i = 0; i < M.N; i++) { const p = M.pts[i]; if (p.bored) continue; block(p.x, p.z, p.g > p.y - 1.5 ? METRO.deckW / 2 + 9 : METRO.deckW / 2 + 1.5); }
  for (const st of (W.stations || [])) if (st.court) { const c = st.court; for (let x = c.x0 - 3; x <= c.x1 + 3; x += 6) for (let z = c.z0 - 3; z <= c.z1 + 3; z += 6) block(x, z, 5); }
  for (const st of (W.stations || [])) for (const rp of st.ramps) { const dx = rp.to[0] - rp.from[0], dz = rp.to[1] - rp.from[1], L = Math.hypot(dx, dz); for (let t = 0; t <= L; t += 2) block(rp.from[0] + dx * t / L, rp.from[1] + dz * t / L, 3); }
  for (const r of Object.values(W.roads || {})) for (let i = 0; i < r.pts.length - 1; i++) {
    const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], L = Math.hypot(bx - ax, bz - az);
    for (let t = 0; t <= L; t += 3) block(ax + (bx - ax) * t / L, az + (bz - az) * t / L, r.width / 2 + 3.5);
  }
  const _pq = [], _rq = [];
  H.clearOf = (x0, z0, x1, z1, pad = 3) => {
    const a0 = x0 - pad, b0 = z0 - pad, a1 = x1 + pad, b1 = z1 + pad, rr = [a0, b0, a1, b1];
    for (const x of [x0, x1, (x0 + x1) / 2]) for (const z of [z0, z1, (z0 + z1) / 2]) if (inCanal(x, z)) return false;
    for (const e of PG.query(a0 - maxR, b0 - maxR, a1 + maxR, b1 + maxR, _pq)) if (rectDist(rr, e.x, e.z) < e.r) return false;
    for (const b of RG.query(a0, b0, a1, b1, _rq)) if (a1 > b[0] && a0 < b[2] && b1 > b[1] && b0 < b[3]) return false;
    return true;
  };
  // only the hard obstacles (viaduct, roads, lanes): for filling places that were reserved as a whole
  H.clearPts = (x0, z0, x1, z1, pad = 1) => {
    const a0 = x0 - pad, b0 = z0 - pad, a1 = x1 + pad, b1 = z1 + pad, rr = [a0, b0, a1, b1];
    for (const e of PG.query(a0 - maxR, b0 - maxR, a1 + maxR, b1 + maxR, _pq)) if (rectDist(rr, e.x, e.z) < e.r) return false;
    return true;
  };
  H.block = block;
  H.reserve = (r) => RG.add(r, r[0], r[1], r[2], r[3]);
  H.line = (P, hw) => { for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az); for (let t = 0; t <= L; t += 1.5) block(ax + (bx - ax) * t / L, az + (bz - az) * t / L, hw); } };
  // a building standing on the slope (its floor line is the highest corner)
  H.bldg = (x0, z0, x1, z1, h, col, o = {}) => {
    const [lo, hi] = groundSpan(x0, z0, x1, z1);
    let base = lo - 1.5; const top = (o.top ?? hi + h);
    // (never down into a metro tunnel: over one, the footing stops just above its roof)
    if (M) for (let i = 0; i < M.N; i += 2) { const p = M.pts[i]; if (p.bored && p.x > x0 - 7 && p.x < x1 + 7 && p.z > z0 - 7 && p.z < z1 + 7) base = Math.max(base, p.y + STN.ceil + 0.3); }
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
    // a chimney or two, sometimes a dormer
    const rr = U.rng(((x0 * 31 + z0 * 17) | 0) ^ 0x5f3), n = rr() < 0.7 ? 1 + (rr() < 0.3 ? 1 : 0) : 0;
    for (let k = 0; k < n && H.put; k++) {
      const t = 0.2 + rr() * 0.6, off = (rr() - 0.5) * 0.5;
      const cx = ax ? U.lerp(x0, x1, t) : (x0 + x1) / 2 + off * (x1 - x0), cz = ax ? (z0 + z1) / 2 + off * (z1 - z0) : U.lerp(z0, z1, t);
      const yy = y + rise * (1 - Math.abs(off) * 2) - 0.4, ch = 1.6 + rr() * 0.8, cc = rr() < 0.6 ? '#8a4a3a' : '#9a9080';
      H.put(H.SH.BOX, cx, yy + ch / 2, cz, 0.8, ch, 0.8, cc, 'plain', 0.04);
      H.put(H.SH.BOX, cx, yy + ch + 0.08, cz, 1.0, 0.16, 1.0, '#3a3530', 'plain', 0.02);
    }
    if (H.put && rr() < 0.35) {
      // a dormer window on one slope
      const t = 0.3 + rr() * 0.4, sd = rr() < 0.5 ? -1 : 1, w = 1.6;
      const dx = ax ? U.lerp(x0, x1, t) : (sd < 0 ? x0 + (x1 - x0) * 0.28 : x1 - (x1 - x0) * 0.28), dz = ax ? (sd < 0 ? z0 + (z1 - z0) * 0.28 : z1 - (z1 - z0) * 0.28) : U.lerp(z0, z1, t);
      const dy = y + rise * 0.44;
      H.put(H.SH.BOX, dx, dy + 0.55, dz, ax ? w : 1.4, 1.1, ax ? 1.4 : w, '#f2ede2', 'plain', 0.04);
      H.put(H.SH.BOX, dx + (ax ? 0 : sd * 0.71), dy + 0.55, dz + (ax ? sd * 0.71 : 0), ax ? 0.8 : 0.04, 0.7, ax ? 0.04 : 0.8, '#3e4a58', 'plain', 0);
      H.put(H.SH.BOX, dx, dy + 1.2, dz, ax ? w + 0.3 : 1.7, 0.2, ax ? 1.7 : w + 0.3, col, 'plain', 0.03);
    }
  };
  // balconies on a house front (their railings are short grinds), a shop at street level
  H.frontage = (x0, x1, zf, dir, lo, top, r, o = {}) => {
    // zf: the facade line; dir: +1 if the street is to the north (facade faces -z), -1 if to the south
    const out = -dir;
    if (o.shop && r() < o.shop) {
      const ac = pick(r, ['#a03a3a', '#2f5f6a', '#e8c84a', '#3e8f86', '#d9779a', '#e4572e', '#f2efe6']);
      H.put(H.SH.BOX, (x0 + x1) / 2, lo + 1.5, zf + out * 0.08, x1 - x0 - 1.2, 2.6, 0.12, '#2e3c4c', 'plain', 0);
      H.put(H.SH.BOX, (x0 + x1) / 2, lo + 3.3, zf + out * 0.75, x1 - x0 - 0.8, 0.08, 1.5, ac, 'plain', 0.03, 0, out * 0.3);
      H.put(H.SH.BOX, (x0 + x1) / 2, lo + 3.9, zf + out * 0.06, x1 - x0 - 2, 0.5, 0.1, pick(r, ['#f2efe6', '#2a2838']), 'plain', 0);
    }
    if (o.balcony && r() < o.balcony && top - lo > 9) {
      const w = Math.min(3.2, x1 - x0 - 2), cx = (x0 + x1) / 2 + (r() - 0.5) * (x1 - x0 - w - 1);
      for (let fy = lo + 5.5; fy < top - 2; fy += 3.2) {
        if (r() < 0.25) continue;
        const z = zf + out * 0.6;
        H.put(H.SH.BOX, cx, fy, z, w, 0.15, 1.2, '#e6dfd2', 'plain', 0.03);
        H.put(H.SH.BOX, cx, fy + 0.55, zf + out * 1.17, w, 0.06, 0.06, '#2a2838', 'plain', 0);
        for (let k = 0; k <= 4; k++) H.put(H.SH.BOX, cx - w / 2 + k * w / 4, fy + 0.3, zf + out * 1.17, 0.04, 0.5, 0.04, '#2a2838', 'plain', 0);
        if (r() < 0.5) H.put(H.SH.ICO, cx + w / 2 - 0.4, fy + 0.35, z, 0.35, 0.3, 0.35, pick(r, H.FLOWERS), 'flat', 0);
        K.rail([[cx - w / 2 + 0.1, fy + 0.6, zf + out * 1.17], [cx + w / 2 - 0.1, fy + 0.6, zf + out * 1.17]], { hidden: true, voice: 'balcony' });
      }
    }
  };
  // trees: faceted canopies (flat-shaded), trunk collider; big ones have no camera box (you're under them)
  // shared unit shapes, scaled into place (allocating fresh geometry for thousands of trees is slow)
  const ICO = (() => { const g = flatGeo(new THREE.IcosahedronGeometry(1, 0)); g.computeVertexNormals(); return prepShape(g); })();
  const TRUNK = prepShape(new THREE.CylinderGeometry(0.7, 1, 1, 6)), ICOF = prepShape(new THREE.IcosahedronGeometry(1, 0));
  const _tq = new THREE.Quaternion(), _te = new THREE.Euler(), _tm = new THREE.Matrix4(), _tv = V3(), _ts = V3();
  H.tree = (x, z, o = {}) => {
    const s = o.s ?? 1, h = (o.h ?? 4) * s, r = (o.r ?? 2.6) * s, y = o.y ?? terrainAt(x, z), col = o.color || '#3f8a4a', rot = (x * 13.1 + z * 7.7) % 6.28;
    _tm.compose(_tv.set(x, y - 0.3 + (h + 0.6) / 2, z), _tq.identity(), _ts.set(0.4 * s, h + 0.6, 0.4 * s));
    B.addShape(TRUNK, _tm, o.trunk || '#6b4a35', 'plain', 0.05 * s);
    _tq.setFromEuler(_te.set(rot, rot * 2, 0));
    const blob = (bx, by, bz, br, c) => { _tm.compose(_tv.set(bx, by, bz), _tq, _ts.set(br, br * (o.squash ?? 0.85), br)); B.addShape(ICO, _tm, c, 'flat', 0.14 * s); };
    blob(x, y + h + r * 0.55, z, r, col);
    if (!o.single) { blob(x + r * 0.55, y + h + r * 0.15, z + r * 0.25, r * 0.66, o.color2 || col); blob(x - r * 0.45, y + h + r * 0.25, z - r * 0.35, r * 0.62, o.color2 || col); }
    W.boxes.push({ x0: x - 0.4 * s, y0: y - 1, z0: z - 0.4 * s, x1: x + 0.4 * s, y1: y + h, z1: z + 0.4 * s, tag: 'tree' });
    (W.treeList || (W.treeList = [])).push([x, y, z, h]);
    if (!o.tall) W.camBoxes.push({ x0: x - r, y0: y + h, z0: z - r, x1: x + r, y1: y + h + r * 1.4, z1: z + r });
    if (o.far !== false) { _tm.compose(_tv.set(x, y + h + r * 0.55, z), _tq.identity(), _ts.set(r * 0.9, r * 0.72, r * 0.9)); F.addShape(ICOF, _tm, o.farColor || col); }
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
    H.pool(x, z, Math.min(9, 3 + h * 0.9), o.glow === '#ffb36a' ? '#ff9a4a' : '#ffc870', o.y);
    if (o.sound !== false) H.sound(x, y + 1, z, 1.6, o.sound || 'lamp');
  };
  // a warm disc of light on whatever is under the lamp (additive: black at the rim adds nothing)
  const _pc = new THREE.Color(), _pk = new THREE.Color('#000000');
  H.pool = (x, z, r, col, yFixed) => {
    const n = 14, pos = [], cols = [], c = _pc.set(col);
    const y0 = yFixed !== undefined ? yFixed + 0.14 : W.groundAt ? terrainAt(x, z) + 0.14 : terrainAt(x, z) + 0.14;
    const at = (a, rr) => { const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; return [px, yFixed !== undefined ? yFixed + 0.14 : terrainAt(px, pz) + 0.14, pz]; };
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      pos.push(x, y0, z, ...at(a1, r), ...at(a0, r)); cols.push(c.r, c.g, c.b, 0, 0, 0, 0, 0, 0);
    }
    // straight into the batch's pool bucket (its own colours, no shading)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const b = B.bucket('pool', x, z), P = g.attributes.position.array;
    for (let i = 0; i < P.length; i += 3) { b.pos.push(P[i], P[i + 1], P[i + 2]); b.nor.push(0, 1, 0); b.col.push(cols[i], cols[i + 1], cols[i + 2]); b.uv.push(0, 0); }
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
    const y0 = terrainAt(x, z), y = y0 + 0.3, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = fz, rz = -fx;
    const col = { sax: '#e0a030', flute: '#3aa8c8', trumpet: '#e4572e', oud: '#a8508a', accordion: '#d83a3a', pan: '#35b08a' }[inst] || '#e4572e';
    // a little round stage on a bright rug, so you can spot them across a square
    K.cyl(x, y0 + 0.02, z, 2.3, 0.05, col, { outline: 0.02, seg: 18 });
    K.cyl(x, y0 + 0.05, z, 1.25, 0.25, '#f3ead8', { outline: 0.04, seg: 14 });
    H.standers([[x, z, yaw, y]], 'market');
    const put = (g, px, py, pz, c, rot) => { const m = new THREE.Matrix4(); if (rot) m.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1] + yaw, rot[2], 'YXZ')); else m.makeRotationY(yaw); m.setPosition(x + fx * pz + rx * px, y + py, z + fz * pz + rz * px); B.add(g, m, c, 'plain', { outlineT: 0.03, edges: false }); };
    const CYL = (r, h, r2 = r) => new THREE.CylinderGeometry(r2, r, h, 8), BOX = (a, b, c) => new THREE.BoxGeometry(a, b, c);
    if (inst === 'sax') { put(CYL(0.07, 0.75), 0.08, 1.02, 0.36, '#e8b53a', [0.45, 0, 0.12]); put(CYL(0.17, 0.3, 0.07), 0.1, 0.7, 0.56, '#e8b53a', [-0.9, 0, 0]); put(CYL(0.035, 0.3), 0.06, 1.42, 0.22, '#2a2838', [0.9, 0, 0]); }
    else if (inst === 'flute') put(CYL(0.035, 0.85), 0.2, 1.47, 0.3, '#dfe6ee', [0, 0, Math.PI / 2]);
    else if (inst === 'trumpet') { put(CYL(0.045, 0.6), 0, 1.48, 0.55, '#f0c040', [Math.PI / 2, 0, 0]); put(CYL(0.16, 0.24, 0.05), 0, 1.48, 0.93, '#f0c040', [-Math.PI / 2, 0, 0]); put(BOX(0.12, 0.16, 0.2), 0, 1.42, 0.5, '#f0c040'); }
    else if (inst === 'oud') { put(new THREE.SphereGeometry(0.3, 8, 6), -0.12, 1.02, 0.36, '#b97a3e', [0, 0, 0]); put(BOX(0.08, 0.06, 0.7), 0.34, 1.2, 0.36, '#6a4324', [0, Math.PI / 2, -0.35]); put(CYL(0.1, 0.02), -0.12, 1.02, 0.6, '#3a2a22', [Math.PI / 2, 0, 0]); }
    else if (inst === 'accordion') { put(BOX(0.22, 0.5, 0.3), -0.3, 1.08, 0.4, '#d83a3a'); put(BOX(0.34, 0.46, 0.26), 0, 1.08, 0.4, '#f3ead8'); put(BOX(0.22, 0.5, 0.3), 0.3, 1.08, 0.4, '#d83a3a'); for (const k of [-0.1, 0, 0.1]) put(BOX(0.02, 0.48, 0.28), k, 1.08, 0.4, '#2a2838'); }
    else if (inst === 'pan') { put(CYL(0.42, 0.22, 0.46), 0, 1.0, 0.7, '#c9d2da', [0.25, 0, 0]); put(CYL(0.36, 0.02), 0, 1.1, 0.72, '#8e98a4', [0.25, 0, 0]); for (const sx of [-0.3, 0.3]) put(CYL(0.025, 0.95), sx, 0.47, 0.7, '#2a2838'); }
    // the open case with coins, and a tall pennant
    const cx = x + fx * 2.0, cz = z + fz * 2.0;
    B.box(cx - 0.45, y0, cz - 0.25, cx + 0.45, y0 + 0.22, cz + 0.25, '#3a2a22', 'plain', { outlineT: 0.02, edges: false });
    B.box(cx - 0.4, y0 + 0.22, cz - 0.2, cx + 0.4, y0 + 0.25, cz + 0.2, '#f2c14e', 'plain', { outlineT: 0, edges: false });
    const px = x - fx * 1.5 + rx * 1.5, pz = z - fz * 1.5 + rz * 1.5;
    K.cyl(px, y0, pz, 0.06, 4.6, '#2a2838', { outline: 0.02, seg: 6 });
    for (let k = 0; k < 3; k++) put(BOX(0.9 - k * 0.22, 0.42, 0.04), 1.5 + 0.48 - k * 0.11, 4.0 - k * 0.45 - 0.3, -1.5, k % 2 ? '#f3ead8' : col);
    put(BOX(0.34, 0.5, 0.3), -1.2, 0.0, -0.5, '#2a2838'); put(BOX(0.26, 0.26, 0.02), -1.2, 0.02, -0.34, col);     // a little amp
    W.spots.push({ key: 'busk_' + inst, x, y: y0, z, r: 22, w: 0, busker: true });
    H.block(x, z, 3);
  };
  // a lettered sign board (two-sided): H.sign('CINEMA', x, y, z, yaw, width, height, background, ink)
  H.sign = (text, x, y, z, yaw = 0, w = 5, h = 1.2, bg = '#1b1a24', fg = '#ffe9b0', o = {}) => {
    const key = text + bg + fg, M = W.signMats2 || (W.signMats2 = {});
    const mat = M[key] || (M[key] = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(512, Math.max(64, Math.round(512 * h / w)), (c, cw, ch) => { c.fillStyle = bg; c.fillRect(0, 0, cw, ch); c.strokeStyle = fg; c.lineWidth = ch * 0.06; c.strokeRect(ch * 0.08, ch * 0.08, cw - ch * 0.16, ch - ch * 0.16); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = ch * 0.62; c.font = `700 ${fs}px ${FONT.body}`; const tw = c.measureText(text).width; if (tw > cw * 0.86) { fs *= cw * 0.86 / tw; c.font = `700 ${fs}px ${FONT.body}`; } c.fillText(text, cw / 2, ch / 2 + fs * 0.04); }).tex }));
    for (const side of (o.oneSide ? [0] : [0, 1])) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x + Math.sin(yaw) * (side ? -0.08 : 0.08), y, z + Math.cos(yaw) * (side ? -0.08 : 0.08)); m.rotation.y = yaw + (side ? Math.PI : 0); m.matrixAutoUpdate = false; m.updateMatrix(); (W.cellExtras || (W.cellExtras = [])).push({ mesh: m, x, z }); }
    if (!o.bare) B.add(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.12), new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z), '#2a2838', 'plain', { outlineT: 0.04, edges: false });
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
  const H = districtKit(K, S, F); fillKit(H);
  // the canals and lakeshore first: their quays and promenades claim the ground the others avoid
  const laps = location.hash === '#laps', t0 = performance.now(), lap = (n) => laps && console.log('[districts] ' + n + ' ' + Math.round(performance.now() - t0) + 'ms');
  prePlaces(H);
  buildCable(H); lap('cable car');
  buildCanals(H); lap('canals');
  buildLakeshore(H); lap('lakeshore');
  buildBusiness(H); lap('business');
  buildMarket(H); lap('market');
  buildOldTown(H); lap('old town');
  buildDocks(H); lap('docks');
  buildPark(H); lap('park');
  buildObservatory(H); lap('observatory');
  buildValley(H); buildPlaces(H); lap('new places');
  fillDistricts(H); lap('fill');
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
  const cs = PLAN.stations.find(s => s.key === 'central').at;
  const plaza = [cs[0] - 70, cs[1] - 60, cs[0] + 70, cs[1] + 60];
  // streets: a grid laid on the slope, but not a perfect one — the north–south streets jog sideways
  // at some crossings (one street at a time), and an oblique avenue cuts up from the plaza
  const jog = xs.map((x, i) => zs.map((z, j) => {
    if (i === 0 || i === xs.length - 1 || i === 3 || j === zs.length - 1) return 0;        // edges, and the sky rail's street, stay put
    const z0 = zs[j], z1 = zs[j + 1]; if (i === 2 && z1 > plaza[1] - 20 && z0 < plaza[3] + 20) return 0;
    return r() < 0.4 ? (r() < 0.5 ? -1 : 1) * (6 + r() * 7) : 0;
  }));
  // the sunken street runs dead straight down its four blocks; the tower's and the building site's blocks keep their shape
  for (const j of [2, 3, 4, 5]) jog[1][j] = VALLEY.x - xs[1];
  jog[2][4] = 0; jog[1][7] = 0;
  const valleyRow = (j) => j >= 2 && j <= 5;
  W.bizStreets = [];
  // the sky rail (built later, in fill) drops from the garage roof across one block: keep that block's lots low
  const skyA = (() => { const sp = PLAN.spots.find(s => s.key === 'rooftop').at; return [sp[0] - 22 + 9.6, sp[1] + 30]; })(), skyB = [132, PLAN.spots.find(s => s.key === 'rooftop').at[1] + 60];
  const underSkyRail = (x0, z0, x1, z1) => { for (let t = 0; t <= 1; t += 0.05) { const x = U.lerp(skyA[0], skyB[0], t), z = U.lerp(skyA[1], skyB[1], t); if (x > x0 - 5 && x < x1 + 5 && z > z0 - 5 && z < z1 + 5) return true; } return false; };
  W.walkLines = W.walkLines || [];
  for (let i = 1; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const x = xs[i] + jog[i][j], za = j === 0 ? R[1] + 4 : zs[j] - street / 2, zb = j === zs.length - 2 ? R[3] - 4 : zs[j + 1] + street / 2;
    // (north of downtown the metro runs in a cutting: the street crosses it on a bridge)
    const cut = j === 0 ? cuttingSpan(W.metro, x, za, zb) : null;
    for (const [a, b] of (cut ? [[za, cut[0]], [cut[1], zb]] : [[za, zb]])) { groundRibbon(B, [[x, a], [x, b]], street + 6, '#cfc8bb', 'walk', 0.07); const P = groundRibbon(B, [[x, a], [x, b]], street - 4, '#55535f', 'road', 0.1); roadDashes(B, P); }
    if (cut) { deckBridge(H, x, cut[0], x, cut[1], street + 6, { piers: [0.2, 0.8], lamps: false }); H.reserve([x - 14, cut[0] - 2, x + 14, cut[1] + 2]); }
    W.walkLines.push([[x - street / 2 - 1, za + 4], [x - street / 2 - 1, zb - 4]], [[x + street / 2 + 1, za + 4], [x + street / 2 + 1, zb - 4]]);
    W.bizStreets.push({ x, z0: za, z1: zb });
  }
  for (const z of zs.slice(1, -1)) { for (const [a, b] of (VALLEY.bridges.includes(z) ? [[R[0] + 4, VALLEY.x - VALLEY.rimHalf], [VALLEY.x + VALLEY.rimHalf, R[2] - 4]] : [[R[0] + 4, R[2] - 4]])) { groundRibbon(B, [[a, z], [b, z]], street + 6, '#cfc8bb', 'walk', 0.07); groundRibbon(B, [[a, z], [b, z]], street - 4, '#55535f', 'road', 0.1); } W.walkLines.push([[R[0] + 10, z - street / 2 - 1], [R[2] - 10, z - street / 2 - 1]]); }
  // the oblique avenue: from the plaza's north-east corner up to the street below Hilltop, tree-lined
  const ob = [[plaza[2] - 6, plaza[1] + 4], [214, -250], [328, -492]];
  groundRibbon(B, ob, street + 8, '#cfc8bb', 'walk', 0.075); const OP = groundRibbon(B, ob, street - 4, '#55535f', 'road', 0.105); roadDashes(B, OP);
  H.line(ob, street / 2 + 4);
  W.roads.oblique = { pts: ob, width: street - 4, P: OP };
  for (let k = 0; k < ob.length - 1; k++) {
    const [ax, az] = ob[k], [bx, bz] = ob[k + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    for (const sd of [-1, 1]) W.walkLines.push([[ax - uz * sd * (street / 2 + 2), az + ux * sd * (street / 2 + 2)], [bx - uz * sd * (street / 2 + 2), bz + ux * sd * (street / 2 + 2)]]);
    for (let t = 8; t < L - 6; t += 14) for (const sd of [-1, 1]) { const tx = ax + ux * t - uz * sd * (street / 2 + 1.5), tz = az + uz * t + ux * sd * (street / 2 + 1.5); if (Math.abs(tx - cs[0]) < 75 && Math.abs(tz - cs[1]) < 65) continue; H.tree(tx, tz, { s: 0.8, color: '#5aa35a', color2: '#4a8f4a' }); }
  }
  H.patch(plaza, '#d8cfbf', 'tiles', 0.08); H.reserve(plaza);
  // fountain in the plaza
  const fx = cs[0] + 40, fz = cs[1] + 32, fy = terrainAt(fx, fz);
  K.cyl(fx, fy - 0.2, fz, 6, 0.8, '#bdb4a4', { outline: 0.08, seg: 24 }); K.cyl(fx, fy - 0.2, fz, 1.0, 2.6, '#bdb4a4', { outline: 0.06, seg: 12 });
  W.boxes.push({ x0: fx - 5, y0: fy - 1, z0: fz - 5, x1: fx + 5, y1: fy + 0.6, z1: fz + 5, tag: 'fountain' });
  W.fountains = [{ x: fx, y: fy + 2.6, z: fz }];
  H.sound(fx, fy + 1, fz, 7, 'fountain');
  for (let a = 0; a < 6; a++) H.bench(fx + Math.cos(a) * 11, fz + Math.sin(a) * 11, Math.abs(Math.cos(a)) < 0.5);
  H.busker('sax', fx - 14, fz + 20, Math.PI / 2);
  // the rooftop garden: a car park with ramps up to a roof full of plants
  const sp = PLAN.spots.find(s => s.key === 'rooftop').at;
  buildGarage(H, sp[0] - 22, sp[1] - 16, sp[0] + 22, sp[1] + 16);
  // blocks
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    let bx0 = xs[i] + jog[i][j] + street / 2 + 5, bx1 = xs[i + 1] + jog[i + 1][j] - street / 2 - 5; const bz0 = zs[j] + street / 2 + 5, bz1 = zs[j + 1] - street / 2 - 5;
    // (the blocks either side of the sunken street stand back behind the walks along its rims)
    if (valleyRow(j) && i === 0) bx1 = VALLEY.x - VALLEY.rimHalf - 4; if (valleyRow(j) && i === 1) bx0 = VALLEY.x + VALLEY.rimHalf + 7;
    if (bx1 - bx0 < 20 || bz1 - bz0 < 20) continue;
    let land = BIZ_LAND[i + ',' + j];
    // centrality: taller near Central and the middle of the district
    const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, core = Math.exp(-Math.hypot(cx - 60, cz + 280) / 520);
    // split into lots
    const lots = [];
    if (r() < 0.35) lots.push([bx0, bz0, bx1, bz1]);
    else { const mx = U.lerp(bx0, bx1, 0.4 + r() * 0.2), mz = U.lerp(bz0, bz1, 0.4 + r() * 0.2); lots.push([bx0, bz0, mx - 4, mz - 4], [mx + 4, bz0, bx1, mz - 4], [bx0, mz + 4, mx - 4, bz1], [mx + 4, mz + 4, bx1, bz1]); }
    for (const [x0, z0, x1, z1] of lots) {
      if (x1 - x0 < 12 || z1 - z0 < 12) continue;
      if (inPlace(x0, z0, x1, z1)) continue;
      const faces = []; if (x0 === bx0 && i > 0) faces.push('w'); if (x1 === bx1 && i < xs.length - 2) faces.push('e'); if (z0 === bz0 && j > 0) faces.push('n'); if (z1 === bz1 && j < zs.length - 2) faces.push('s');
      if (underSkyRail(x0, z0, x1, z1)) { for (let k = 0; k < 3; k++) { const tx = U.lerp(x0, x1, r()), tz = U.lerp(z0, z1, r()); if (H.clearOf(tx - 2, tz - 2, tx + 2, tz + 2, 1)) H.tree(tx, tz, { s: 0.8, color: '#4f9a52' }); } continue; }
      if (!H.clearOf(x0, z0, x1, z1, 4)) {
        // cut by the avenue: build on whichever corner still fits, plant the rest
        const halves = [[x0, z0, (x0 + x1) / 2 - 2, (z0 + z1) / 2 - 2], [(x0 + x1) / 2 + 2, z0, x1, (z0 + z1) / 2 - 2], [x0, (z0 + z1) / 2 + 2, (x0 + x1) / 2 - 2, z1], [(x0 + x1) / 2 + 2, (z0 + z1) / 2 + 2, x1, z1]];
        let built = 0;
        for (const q of halves) if (q[2] - q[0] >= 12 && q[3] - q[1] >= 12 && H.clearOf(q[0], q[1], q[2], q[3], 3)) { bizBuilding(H, q[0], q[1], q[2], q[3], 12 + r() * 16 + core * (25 + r() * 40), r); H.reserve(q); built++; }
        if (built) { for (let k = 0; k < 4; k++) { const tx = U.lerp(x0, x1, r()), tz = U.lerp(z0, z1, r()); if (H.clearOf(tx - 2, tz - 2, tx + 2, tz + 2, 1)) { H.tree(tx, tz, { s: 0.8, color: '#4f9a52' }); H.reserve([tx - 2, tz - 2, tx + 2, tz + 2]); } } continue; }
        // too close to the viaduct: a small pavilion or trees instead
        if (H.clearOf(x0 + 6, z0 + 6, x1 - 6, z1 - 6, 1) && r() < 0.5) H.bldg(x0 + 6, z0 + 6, x1 - 6, z1 - 6, 6 + r() * 4, pick(r, pal), { trim: '#2a2838' });
        else for (let k = 0; k < 3; k++) { const tx = U.lerp(x0, x1, r()), tz = U.lerp(z0, z1, r()); if (H.clearOf(tx - 2, tz - 2, tx + 2, tz + 2, 1)) H.tree(tx, tz, { s: 0.8, color: '#4f9a52' }); }
        continue;
      }
      const tall = 14 + r() * 20 + core * (40 + r() * 70);
      const lm = land && x1 - x0 > 22 && z1 - z0 > 22 && faces.includes('s') ? land : null; if (lm) land = null;
      bizBuilding(H, x0, z0, x1, z1, tall, r, { faces, land: lm });
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
// where the metro's cutting crosses a north–south street: the stretch of street to carry on a bridge
function cuttingSpan(M, x, za, zb) {
  let lo = 1e9, hi = -1e9;
  for (const p of M.pts) if (!p.bored && Math.abs(p.x - x) < 13 && p.z > za && p.z < zb && p.g > p.y + 3) { lo = Math.min(lo, p.z); hi = Math.max(hi, p.z); }
  return lo > hi ? null : [Math.max(za + 2, lo - 25), Math.min(zb - 2, hi + 25)];
}
// one business lot: a podium and a tower of one of several kinds, with something on the roof
function bizBuilding(H, x0, z0, x1, z1, tall, r, o = {}) {
  const { K, W, B, F } = H, pal = BIZ_PAL;
  const put = H.put;
  const col = pick(r, pal), trim = pick(r, ['#2a2838', '#e8e2d4', '#c9a24a', '#14101f', '#8a8fa8']);
  // what the building does at street level: its own little generator, so the skyline above stays what it was
  const sr = U.rng(((x0 * 73 + z0 * 131) | 0) ^ 0x9e37), faces = o.faces || [];
  for (let k = 0; k < 3; k++) sr();
  const style = o.land ? LAND_STYLE[o.land] : pick(sr, ['band', 'band', 'arcade', 'arcade', 'pilotis', 'lobby', 'lobby', 'steps', 'corner', 'setback']);
  const pod = bizPodium(H, x0, z0, x1, z1, (o.land === 'diner' ? 5 : 6) + r() * 5, pick(r, ['#d9d3c4', '#c8bfae', '#b5a993', '#e6dfd0', '#a8a49a']), style, sr, faces);
  if (o.land) bizLandmark(H, o.land, pod, faces, sr); else bizShop(H, pod, faces, sr);
  W.bizTop = Math.max(W.bizTop || 0, pod.top + tall);
  [x0, z0, x1, z1] = pod.box;
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  let y = pod.top, top = y;
  const ix0 = x0 + 3, iz0 = z0 + 3, ix1 = x1 - 3, iz1 = z1 - 3, iw = ix1 - ix0, id = iz1 - iz0;
  const t = r(), big = tall > 45;
  const crownRoof = (rx0, rz0, rx1, rz1, yy) => {
    const q = r();
    if (q < 0.25) { put(H.SH.BOX, (rx0 + rx1) / 2, yy + 1.6, (rz0 + rz1) / 2, (rx1 - rx0) * 0.4, 3.2, (rz1 - rz0) * 0.4, '#d9d4ea', 'plain', 0.05); }
    else if (q < 0.45) { const tx = rx0 + 3, tz = rz0 + 3; for (const [a, b] of [[0, 0], [2, 0], [0, 2], [2, 2]]) put(H.SH.BOX, tx + a, yy + 1, tz + b, 0.15, 2, 0.15, '#5a4a3a', 'plain', 0); K.cyl(tx + 1, yy + 2, tz + 1, 1.4, 2.6, '#8a6a4a', { kind: 'wood', outline: 0.04, seg: 10 }); B.add(new THREE.ConeGeometry(1.5, 0.9, 10), new THREE.Matrix4().makeTranslation(tx + 1, yy + 5.05, tz + 1), '#5a4a3a', 'plain', { outlineT: 0.03, edges: false }); }
    else if (q < 0.6) { for (let k = 0; k < 4; k++) put(H.SH.BOX, U.lerp(rx0 + 2, rx1 - 2, (k + 0.5) / 4), yy + 0.6, (rz0 + rz1) / 2, (rx1 - rx0) / 4 - 0.8, 0.08, (rz1 - rz0) * 0.6, '#2f4a6a', 'plain', 0.02, 0); }
    else if (q < 0.75) { B.box(rx0 + 1, yy, rz0 + 1, rx1 - 1, yy + 0.3, rz1 - 1, '#6a9a52', 'plain', { outlineT: 0.02, edges: false }); for (let k = 0; k < 3; k++) H.tree(U.lerp(rx0 + 3, rx1 - 3, r()), U.lerp(rz0 + 3, rz1 - 3, r()), { y: yy + 0.3, s: 0.5, h: 2, color: '#5aa35a', far: false }); }
    else K.ac((rx0 + rx1) / 2 + (r() - 0.5) * 4, (rz0 + rz1) / 2 + (r() - 0.5) * 4, yy, 3, 1.6, 3, '#e9e4f5');
  };
  const fins = (bx0, bz0, bx1, bz1, yy0, yy1, c) => {
    for (let x = bx0 + 1.5; x < bx1 - 1; x += 3) for (const z of [bz0, bz1]) put(H.SH.BOX, x, (yy0 + yy1) / 2, z, 0.3, yy1 - yy0, 0.7, c, 'plain', 0.02);
    for (let z = bz0 + 1.5; z < bz1 - 1; z += 3) for (const x of [bx0, bx1]) put(H.SH.BOX, x, (yy0 + yy1) / 2, z, 0.7, yy1 - yy0, 0.3, c, 'plain', 0.02);
  };
  if (big && t < 0.22 && iw > 14 && id > 14) {
    // a round tower (glass bands), a thin crown ring and a drum on top
    const rad = Math.min(iw, id) / 2 - 1;
    K.cyl(cx, y - 0.2, cz, rad, tall, col, { kind: r() < 0.6 ? 'tower' : 'grid', seg: 24, outline: 0.16 });
    // a round tower's footprint, as three boxes (a plus and a square) so walls and camera both respect it
    for (const [a, b] of [[0.86, 0.86], [0.98, 0.42], [0.42, 0.98]]) W.boxes.push({ x0: cx - rad * a, y0: y - 1, z0: cz - rad * b, x1: cx + rad * a, y1: y + tall, z1: cz + rad * b, tag: 'tower' });
    F.add(new THREE.CylinderGeometry(rad, rad, tall, 12), new THREE.Matrix4().makeTranslation(cx, y + tall / 2, cz), col);
    K.cyl(cx, y + tall - 0.6, cz, rad + 0.3, 0.6, trim, { seg: 24, outline: 0 });
    top = y + tall;
    if (r() < 0.6) { K.cyl(cx, top, cz, rad * 0.55, 4, '#e9e4f5', { seg: 18, outline: 0.06 }); K.cyl(cx, top + 4, cz, 0.3, 10, '#d9d4ea', { seg: 6, outline: 0.03 }); K.sphere(cx, top + 14.2, cz, 0.5, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 }); }
    else crownRoof(cx - rad * 0.6, cz - rad * 0.6, cx + rad * 0.6, cz + rad * 0.6, top);
  } else if (big && t < 0.38 && (iw > 30 || id > 30)) {
    // twins: two slim towers on one podium, a sky bridge between
    const alongX = iw >= id, gap = 6;
    const A = alongX ? [ix0, iz0, (ix0 + ix1) / 2 - gap / 2, iz1] : [ix0, iz0, ix1, (iz0 + iz1) / 2 - gap / 2];
    const Bq = alongX ? [(ix0 + ix1) / 2 + gap / 2, iz0, ix1, iz1] : [ix0, (iz0 + iz1) / 2 + gap / 2, ix1, iz1];
    const kind = pick(r, ['tower', 'grid', 'tower']), h2 = tall * (0.75 + r() * 0.2);
    for (const [q, hh] of [[A, tall], [Bq, h2]]) {
      K.box(q[0], y - 0.2, q[1], q[2], y + hh, q[3], col, kind, { roofColor: '#c9c2b4', outlineT: 0.16 });
      B.box(q[0] - 0.2, y + hh - 0.7, q[1] - 0.2, q[2] + 0.2, y + hh - 0.1, q[3] + 0.2, trim, 'plain', { outlineT: 0, edges: false });
      F.box(q[0], y - 0.2, q[1], q[2], y + hh, q[3], col);
      crownRoof(q[0], q[1], q[2], q[3], y + hh);
    }
    const by = y + Math.min(tall, h2) * 0.62;
    if (alongX) { const zc = (iz0 + iz1) / 2; K.box(A[2], by, zc - 2.5, Bq[0], by + 3.2, zc + 2.5, '#a8c4d8', 'plain', { outlineT: 0.06 }); K.rail([[A[2] - 0.2, by + 3.25, zc], [Bq[0] + 0.2, by + 3.25, zc]], { hidden: true }); }
    else { const xc = (ix0 + ix1) / 2; K.box(xc - 2.5, by, A[3], xc + 2.5, by + 3.2, Bq[1], '#a8c4d8', 'plain', { outlineT: 0.06 }); K.rail([[xc, by + 3.25, A[3] - 0.2], [xc, by + 3.25, Bq[1] + 0.2]], { hidden: true }); }
    top = y + tall;
  } else if (big && t < 0.55) {
    // art deco: many small set-backs and a spire
    let bx0 = ix0, bz0 = iz0, bx1 = ix1, bz1 = iz1, h = tall, yy = y;
    const c2 = pick(r, ['#e8dcc0', '#d9c9a8', '#c8b89a', '#e6d6b8', '#b8a888']);
    for (let k = 0; k < 5 && h > 4 && bx1 - bx0 > 6 && bz1 - bz0 > 6; k++) {
      const th = k === 4 ? h : h * (k === 0 ? 0.5 : 0.35);
      K.box(bx0, yy - 0.2, bz0, bx1, yy + th, bz1, c2, 'deco', { roofColor: '#c9b89a', outlineT: 0.14 });
      B.box(bx0 - 0.25, yy + th - 0.9, bz0 - 0.25, bx1 + 0.25, yy + th - 0.1, bz1 + 0.25, '#b8905a', 'plain', { outlineT: 0, edges: false });
      F.box(bx0, yy - 0.2, bz0, bx1, yy + th, bz1, c2);
      yy += th; h -= th; const sh = 1.6 + r() * 1.4; bx0 += sh; bz0 += sh; bx1 -= sh; bz1 -= sh;
    }
    const sx = (bx0 + bx1) / 2, sz = (bz0 + bz1) / 2;
    B.add(new THREE.ConeGeometry(Math.max(1.5, (bx1 - bx0) / 2), 10 + r() * 8, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(sx, yy + 6, sz), '#c9a24a', 'plain', { outlineT: 0.08, edges: false });
    K.cyl(sx, yy + 10, sz, 0.18, 12, '#e9e4f5', { seg: 5, outline: 0.03 }); K.sphere(sx, yy + 22, sz, 0.45, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 });
    top = yy;
  } else {
    // slabs with set-backs; some wear vertical fins, the rest get a rooftop
    let h = tall, bx0 = ix0, bz0 = iz0, bx1 = ix1, bz1 = iz1;
    let tiers = 1 + Math.floor(r() * 3);
    const kind = big ? pick(r, ['tower', 'tower', 'grid', 'building']) : pick(r, ['grid', 'building', 'building', 'tower']), finned = r() < 0.3;
    const fc = pick(r, ['#e9e4f5', '#2a2838', '#c9a24a', '#8a8fa8']);
    while (tiers-- > 0 && h > 8) {
      const th = tiers === 0 ? h : h * (0.45 + r() * 0.25);
      K.box(bx0, y - 0.2, bz0, bx1, y + th, bz1, col, kind, { roofColor: '#c9c2b4', outlineT: 0.16 });
      B.box(bx0 - 0.2, y + th - 0.7, bz0 - 0.2, bx1 + 0.2, y + th - 0.1, bz1 + 0.2, trim, 'plain', { outlineT: 0, edges: false });
      F.box(bx0, y - 0.2, bz0, bx1, y + th, bz1, col);
      if (finned) fins(bx0, bz0, bx1, bz1, y, y + th - 0.7, fc);
      y += th; h -= th; const sh = 2 + r() * 3; bx0 += sh; bz0 += sh; bx1 -= sh; bz1 -= sh;
      if (bx1 - bx0 < 6 || bz1 - bz0 < 6) break;
    }
    top = y;
    if (tall > 60 && r() < 0.5) { const ax = (bx0 + bx1) / 2, az = (bz0 + bz1) / 2; K.cyl(ax, y, az, 0.25, 8 + r() * 10, '#d9d4ea', { outline: 0.03, seg: 6 }); K.sphere(ax, y + 9, az, 0.5, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 }); }
    else crownRoof(bx0 + 1, bz0 + 1, bx1 - 1, bz1 - 1, y);
  }
  // the podium roof: a terrace with planters (reachable from a neighbour, or the sky rail)
  if (r() < 0.4) for (let k = 0; k < 3; k++) { const px2 = U.lerp(x0 + 1.5, x1 - 1.5, r()), pz2 = r() < 0.5 ? z0 + 1.5 : z1 - 1.5; put(H.SH.BOX, px2, pod.top + 0.35, pz2, 2.2, 0.7, 1, '#8a7a6a', 'plain', 0.03); put(H.SH.ICO, px2, pod.top + 0.9, pz2, 0.9, 0.5, 0.5, '#5aa35a', 'flat', 0.04); }
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
  for (const t of trails) { const P = H.path(t, 4.5, '#c9b892'); trailPts.push(...P); H.line(t, 5.5); }
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
  H.spot('frogs', pond.x, pond.z, pond.r + 30);
  // the glasshouse
  const gh = PLAN.spots.find(s => s.key === 'glasshouse').at;
  buildGlasshouse(H, gh[0], gh[1]);
  // the forest: big trees except on trails, the pond, clearings and the station
  const clear = [[-900, -888, 46], [-660, -510, 70], [pond.x, pond.z, pond.r + 18], [-760, -100, 40], [-560, -1300, 55], [-440, -1000, 30]];
  const pst = PLAN.stations.find(s => s.key === 'park').at;
  for (let x = R[0] + 8; x < R[2] - 4; x += 15) for (let z = R[1] + 8; z < R[3] - 4; z += 15) {
    const tx = x + (r() - 0.5) * 12, tz = z + (r() - 0.5) * 12;
    if (clear.some(([cx, cz, cr]) => Math.hypot(tx - cx, tz - cz) < cr)) continue;
    // glades: patches of open meadow
    const glade = Math.sin(tx * 0.013) * Math.sin(tz * 0.011) > 0.55;
    if (glade && r() < 0.85) continue;
    if (!H.clearOf(tx - 1, tz - 1, tx + 1, tz + 1, 1)) continue;
    const big = r() < 0.7, dark = r();
    const col = dark < 0.33 ? '#2f5f34' : dark < 0.66 ? '#3a6f3a' : '#47803f';
    if (tz < -1000 && r() < 0.5) H.pine(tx, tz, { s: 1.6 + r() * 0.8, color: '#2c5236' });
    else H.tree(tx, tz, { s: big ? 1.9 + r() * 0.9 : 1.1 + r() * 0.4, h: big ? 6.4 : 4.4, r: 3.4, color: col, color2: dark < 0.5 ? '#36693a' : '#4f8a44', tall: big, trunk: '#5a4232' });
  }
  // (shafts of light through the canopy: see Fauna — they follow the sun)
  H.walkers(trails.map(t => t.slice()), 26, 'park');
  H.busker('flute', -760, -96, 0.6);
}
function buildGlasshouse(H, x, z) {
  // a Victorian palm house: brick plinth, glass between white iron, a barrel roof with a lantern,
  // and a porch with an arched door at each end — the path runs straight through
  const { K, W, B, F } = H;
  const y = terrainAt(x, z) + 0.05, w = 22, d = 34, wh = 6, dw = 4.4, dh = 4.2;
  H.patch([x - w / 2 - 5, z - d / 2 - 10, x + w / 2 + 5, z + d / 2 + 10], '#d8cdb5', 'tiles');
  H.path([[x, z - d / 2 - 40], [x, z - d / 2 - 8]], 3.2, '#cdbf9e'); H.path([[x, z + d / 2 + 8], [x, z + d / 2 + 40]], 3.2, '#cdbf9e');
  const glass = '#bfe8e8', iron = '#f4f1ea', brick = '#a0583e';
  const wall = (x0, z0, x1, z1) => {
    B.box(x0, y, z0, x1, y + 0.8, z1, brick, 'brick', { outlineT: 0.04 });
    B.box(x0, y + 0.8, z0, x1, y + wh, z1, glass, 'glass', { outlineT: 0, edges: false });
    B.box(x0 - 0.06, y + wh - 0.25, z0 - 0.06, x1 + 0.06, y + wh, z1 + 0.06, iron, 'plain', { outlineT: 0.03, edges: false });
    W.boxes.push({ x0, y0: y - 1, z0, x1, y1: y + wh, z1, nocam: true });
    // mullions every two metres
    const L = Math.max(x1 - x0, z1 - z0), alongX = x1 - x0 > z1 - z0;
    for (let t = 0; t <= L + 0.01; t += 2) { const mx = alongX ? x0 + t : (x0 + x1) / 2, mz = alongX ? (z0 + z1) / 2 : z0 + t; B.box(mx - 0.08, y + 0.8, mz - 0.08, mx + 0.08, y + wh, mz + 0.08, iron, 'plain', { outlineT: 0, edges: false }); }
  };
  wall(x - w / 2, z - d / 2, x - w / 2 + 0.3, z + d / 2); wall(x + w / 2 - 0.3, z - d / 2, x + w / 2, z + d / 2);
  for (const zs of [-1, 1]) {
    const zf = z + zs * d / 2, za = Math.min(zf, zf - zs * 0.3), zb = Math.max(zf, zf - zs * 0.3);
    wall(x - w / 2, za, x - dw / 2 - 0.6, zb); wall(x + dw / 2 + 0.6, za, x + w / 2, zb);
    // the end wall above the door, glazed, to the roof line
    B.box(x - dw / 2 - 0.6, y + dh + 0.6, za, x + dw / 2 + 0.6, y + wh, zb, glass, 'glass', { outlineT: 0, edges: false });
    // the porch: two posts, an arch of white iron, a little gabled glass roof, steps of tile
    const pz = zf + zs * 3, pza = Math.min(zf, pz), pzb = Math.max(zf, pz);
    for (const sx of [-1, 1]) { K.box(x + sx * (dw / 2 + 0.6) - 0.3, y, pza, x + sx * (dw / 2 + 0.6) + 0.3, y + dh + 0.6, pzb, iron, 'plain', { outlineT: 0.05 }); }
    const arch = []; for (let a = 0; a <= 10; a++) { const t = a / 10 * Math.PI; arch.push(V3(x - Math.cos(t) * (dw / 2 + 0.3), y + dh - 0.6 + Math.sin(t) * 1.2, pz)); }
    B.add(tubeGeo(arch, 0.16, 6), null, iron, 'plain', { outlineT: 0.03, edges: false });
    const pr = new THREE.BufferGeometry(); const hw2 = dw / 2 + 1.2, ry = y + dh + 0.6;
    pr.setAttribute('position', new THREE.Float32BufferAttribute([x - hw2, ry, pza, x, ry + 1.6, pza, x, ry + 1.6, pzb, x - hw2, ry, pza, x, ry + 1.6, pzb, x - hw2, ry, pzb, x, ry + 1.6, pza, x + hw2, ry, pza, x + hw2, ry, pzb, x, ry + 1.6, pza, x + hw2, ry, pzb, x, ry + 1.6, pzb], 3));
    pr.computeVertexNormals(); B.add(pr, null, '#e8f4f2', 'plain', { outlineT: 0.05, edges: false });
    B.box(x - hw2, ry - 0.2, pza, x + hw2, ry, pzb, iron, 'plain', { outlineT: 0.04, edges: false });
    W.boxes.push({ x0: x - hw2, y0: ry - 0.2, z0: pza, x1: x + hw2, y1: ry + 0.4, z1: pzb, tag: 'porch' });
    H.lamp(x - dw / 2 - 2.4, pz + zs * 1.5, { style: 'globe', h: 3.4, color: '#2a3550', sound: false }); H.lamp(x + dw / 2 + 2.4, pz + zs * 1.5, { style: 'globe', h: 3.4, color: '#2a3550', sound: false });
  }
  // the barrel roof: ribs, glass, a ridge lantern
  for (let i = 0; i <= 8; i++) { const zz = z - d / 2 + i * d / 8; const pts = []; for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI; pts.push(V3(x - Math.cos(t) * w / 2, y + wh + Math.sin(t) * 5, zz)); } B.add(tubeGeo(pts, 0.14, 5), null, iron, 'plain', { outlineT: 0, edges: false }); }
  const roof = new THREE.CylinderGeometry(w / 2, w / 2, d, 16, 1, true, -Math.PI / 2, Math.PI);
  roof.rotateX(Math.PI / 2);
  const rm = new THREE.Mesh(roof, new THREE.MeshBasicMaterial({ color: 0xcff5f0, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
  rm.scale.set(1, 5 / (w / 2), 1); rm.position.set(x, y + wh, z); W.group.add(rm);
  B.box(x - 1.4, y + wh + 5, z - d / 2 + 2, x + 1.4, y + wh + 6.2, z + d / 2 - 2, '#e8f4f2', 'glass', { outlineT: 0, edges: false });
  B.box(x - 1.6, y + wh + 6.2, z - d / 2 + 1.8, x + 1.6, y + wh + 6.5, z + d / 2 - 1.8, iron, 'plain', { outlineT: 0.04, edges: false });
  W.camBoxes.push({ x0: x - w / 2, y0: y + wh, z0: z - d / 2, x1: x + w / 2, y1: y + 12, z1: z + d / 2 });
  // inside: a path through, beds of palms and flowers either side, a little pool in the middle
  B.box(x - 1.6, y, z - d / 2, x + 1.6, y + 0.04, z + d / 2, '#d8cdb5', 'tiles', { outlineT: 0, edges: false });
  for (let i = 0; i < 10; i++) { const px = x + ((i % 2) ? 6 : -6), pz = z - d / 2 + 4 + Math.floor(i / 2) * 6.5; H.tree(px, pz, { y, s: 0.7, h: 3.5, color: ['#4fae6a', '#e07a9a', '#7fcf5a'][i % 3], single: i % 3 === 1, far: false }); }
  const rr = U.rng(55); for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) H.flowerBed(x + sx * 3.4, z - d / 2 + 4 + k * 5.2, 1.0, rr, y);
  K.cyl(x, y - 0.2, z + 2, 2.2, 0.6, '#a89a82', { outline: 0.05, seg: 14 });
  B.add(new THREE.CircleGeometry(1.9, 14).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, y + 0.45, z + 2), '#5fa8b8', 'plain', { outlineT: 0, edges: false });
  W.boxes.push({ x0: x - 1.8, y0: y - 1, z0: z + 0.2, x1: x + 1.8, y1: y + 0.4, z1: z + 3.8, tag: 'pool' });
  F.box(x - w / 2, y, z - d / 2, x + w / 2, y + 9, z + d / 2, '#cfeeea');
  H.bench(x - 2.6, z - 6, false, { y, view: false }); H.bench(x + 2.6, z + 9, false, { y, view: false });
  H.reserve([x - w / 2 - 5, z - d / 2 - 10, x + w / 2 + 5, z + d / 2 + 10]);
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
