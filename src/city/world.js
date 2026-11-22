// ============================================================
//  CITY WORLD — assembles terrain, water, roads, metro and districts
// ============================================================
const GROUND_COLS = {
  park: '#3d5f36', obs: '#6f8f4f', oldtown: '#7c8a56', business: '#a8a398', market: '#b89a72',
  canals: '#7d8a5e', docks: '#8c877e', lake: '#6c9150'
};
const _gc = new THREE.Color(), _gc2 = new THREE.Color(), _gw = {};
function paintGround(x, z, y, steep, out) {
  districtWeights(x, z, _gw, 90);
  out.setRGB(0, 0, 0);
  for (const k in _gw) { if (_gw[k] < 0.001) continue; _gc.set(GROUND_COLS[k]); out.r += _gc.r * _gw[k]; out.g += _gc.g * _gw[k]; out.b += _gc.b * _gw[k]; }
  // beaches and wet sand
  const dz = z - shoreZ(x);
  if (dz > -45 && !(x > PLAN.docksX[0] && x < PLAN.docksX[1])) { _gc.set(dz > 0 ? '#c9b98a' : '#e6d7a8'); out.lerp(_gc, U.smooth(U.clamp((dz + 45) / 25, 0, 1))); }
  // steep ground shows rock
  if (steep > 0.28) out.lerp(_gc.set('#8c8170'), U.clamp((steep - 0.28) * 3, 0, 0.8));
  // a little variation so big lawns aren't flat
  const n = Math.sin(x * 0.05) * Math.sin(z * 0.043) * 0.5 + Math.sin(x * 0.013 + z * 0.021) * 0.5;
  out.multiplyScalar(0.95 + n * 0.06);
  if (y < -0.5) out.lerp(_gc.set('#6f8a8a'), U.clamp(-y / 4, 0, 0.7));
  reliefPaint(x, z, y, steep, out);
}

// a ribbon laid on the ground (roads, paths, quays): pts [[x,z],...]
function groundRibbon(B, pts, width, color, kind = 'road', lift = 0.09, step = 4) {
  // resample
  const P = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) P.push([U.lerp(ax, bx, k / n), U.lerp(az, bz, k / n)]);
  }
  P.push(pts[pts.length - 1]);
  const hw = width / 2, pos = [];
  const side = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
  const E = P.map((p, i) => { const [sx, sz] = side[i]; const lx = p[0] + sx * hw, lz = p[1] + sz * hw, rx = p[0] - sx * hw, rz = p[1] - sz * hw; return [[lx, terrainAt(lx, lz) + lift, lz], [p[0], terrainAt(p[0], p[1]) + lift, p[1]], [rx, terrainAt(rx, rz) + lift, rz]]; });
  for (let i = 0; i < P.length - 1; i++) {
    const a = E[i], b = E[i + 1];
    for (const [u, v] of [[0, 1], [1, 2]]) pos.push(...a[u], ...b[u], ...b[v], ...a[u], ...b[v], ...a[v]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  // make sure faces point up
  const n = g.attributes.normal.array; if (n[1] < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
  B.add(g, null, color, kind, { outlineT: 0, edges: false });
  // streets are remembered (in real coordinates, only where they're drawn) so junctions can be laid over them
  if (!groundRibbon.noLog && (kind === 'walk' || kind === 'road')) {
    if (kind === 'walk') groundRibbon.lastWalk = { pts, width };
    else {
      const full = groundRibbon.lastWalk && groundRibbon.lastWalk.pts === pts ? groundRibbon.lastWalk.width : width + 4;
      const dx = (typeof XF !== 'undefined' && XF.g) ? XF.dx : 0, dz = (typeof XF !== 'undefined' && XF.g) ? XF.dz : 0;
      let run = [];
      const flush = () => { if (run.length > 1) (groundRibbon.log = groundRibbon.log || []).push({ pts: run, w: width, full, color }); run = []; };
      for (const p of P) { const x = p[0] + dx, z = p[1] + dz; if (typeof XF !== 'undefined' && XF.g && !xfKeepPoint(x, z)) flush(); else run.push([x, z]); }
      flush();
    }
  }
  // a copy for the far view (just under the near one), so streets don't stop dead in the distance
  if (groundRibbon.far && width >= 8 && (kind === 'road' || kind === 'walk')) {
    const p2 = g.attributes.position.array, per = 36 * 16;
    for (let o = 0; o < p2.length; o += per) { const a = Array.from(p2.subarray(o, Math.min(p2.length, o + per))); for (let i = 1; i < a.length; i += 3) a[i] -= 0.05; const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); groundRibbon.far.add(fg, null, color); }
  }
  return P;
}
// ---------- junctions: where streets meet, one clean piece of asphalt ----------
// A street that runs into another one is carried on across that one's sidewalk to its centre (a T); two streets
// that cross each carry on across the other's whole width (an X). Laid last, just above the dashes.
function buildJunctions(K) {
  const B = K.B, L = groundRibbon.log || [];
  const seg = (P, i) => [P[i], P[i + 1]];
  const inter = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s2 = [d[0] - c[0], d[1] - c[1]], den = r[0] * s2[1] - r[1] * s2[0]; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * s2[1] - (c[1] - a[1]) * s2[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t, t, u] : null; };
  const acc = (P) => { const A = [0]; for (let i = 1; i < P.length; i++) A.push(A[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return A; };
  const at = (P, A, s) => { s = U.clamp(s, 0, A[A.length - 1]); let i = 0; while (i < P.length - 2 && A[i + 1] < s) i++; const t = (s - A[i]) / ((A[i + 1] - A[i]) || 1); return [U.lerp(P[i][0], P[i + 1][0], t), U.lerp(P[i][1], P[i + 1][1], t)]; };
  const near = (P, x, z) => { let bd = 1e9, bq = null; for (let i = 0; i < P.length - 1; i++) { const [a, b] = seg(P, i), dx = b[0] - a[0], dz = b[1] - a[1], u = U.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / ((dx * dx + dz * dz) || 1), 0, 1), q = [a[0] + dx * u, a[1] + dz * u], d = Math.hypot(q[0] - x, q[1] - z); if (d < bd) { bd = d; bq = q; } } return [bd, bq]; };
  const box = (P) => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } return [x0, z0, x1, z1]; };
  const R = L.map(r => ({ ...r, A: acc(r.pts), bb: box(r.pts) }));
  const lay = (pts, w, color) => { groundRibbon.noLog = true; groundRibbon(B, pts, w, color, 'road', 0.14, 2); groundRibbon.noLog = false; };
  const done = [];
  const seen = (x, z) => done.some(([a, b]) => Math.hypot(a - x, b - z) < 3);
  for (let i = 0; i < R.length; i++) for (let j = 0; j < R.length; j++) {
    if (i === j) continue;
    const a = R[i], b = R[j], pad = 20;
    if (a.bb[2] < b.bb[0] - pad || a.bb[0] > b.bb[2] + pad || a.bb[3] < b.bb[1] - pad || a.bb[1] > b.bb[3] + pad) continue;
    // a's ends running into b (T)
    for (const end of [0, a.pts.length - 1]) {
      const E = a.pts[end], [d, C] = near(b.pts, E[0], E[1]);
      if (d > b.full / 2 + 3 || d < 0.5 || inCanal(C[0], C[1]) || seen(C[0] + i * 1e-3, C[1])) continue;
      const back = a.pts[end === 0 ? 1 : a.pts.length - 2], ux = E[0] - back[0], uz = E[1] - back[1], l = Math.hypot(ux, uz) || 1;
      lay([[E[0] - ux / l * 2, E[1] - uz / l * 2], C], a.w, a.color);
      done.push([C[0] + i * 1e-3, C[1]]);
    }
    // a and b crossing (X): each is carried across the other's full width
    if (i < j) for (let p = 0; p < a.pts.length - 1; p++) for (let q = 0; q < b.pts.length - 1; q++) {
      const I = inter(a.pts[p], a.pts[p + 1], b.pts[q], b.pts[q + 1]); if (!I || inCanal(I[0], I[1]) || seen(I[0], I[1])) continue;
      const sa = a.A[p] + (a.A[p + 1] - a.A[p]) * I[2], sb = b.A[q] + (b.A[q + 1] - b.A[q]) * I[3];
      const ea = Math.min(sa, a.A[a.A.length - 1] - sa), eb = Math.min(sb, b.A[b.A.length - 1] - sb);
      if (ea < b.full / 2 + 2 || eb < a.full / 2 + 2) continue;          // (that's a T, laid above)
      lay([at(a.pts, a.A, sa - b.full / 2 - 0.5), at(a.pts, a.A, sa + b.full / 2 + 0.5)], a.w, a.color);
      lay([at(b.pts, b.A, sb - a.full / 2 - 0.5), at(b.pts, b.A, sb + a.full / 2 + 0.5)], b.w, b.color);
      done.push([I[0], I[1]]);
    }
  }
}
// dashed centre line
function roadDashes(B, P, color = '#f2ead0', w = 0.25, dash = 3, gap = 5) {
  let s = 0; const pos = [];
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let t = 0; t < L; t += 0.5) {
      const ph = (s + t) % (dash + gap); if (ph > dash) continue;
      const x0 = ax + ux * t, z0 = az + uz * t, x1 = ax + ux * Math.min(L, t + 0.5), z1 = az + uz * Math.min(L, t + 0.5);
      const y0 = terrainAt(x0, z0) + 0.13, y1 = terrainAt(x1, z1) + 0.13;
      pos.push(x0 - uz * w, y0, z0 + ux * w, x1 - uz * w, y1, z1 + ux * w, x1 + uz * w, y1, z1 - ux * w, x0 - uz * w, y0, z0 + ux * w, x1 + uz * w, y1, z1 - ux * w, x0 + uz * w, y0, z0 - ux * w);
    }
    s += L;
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  if (g.attributes.normal.array[1] < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
  B.add(g, null, color, 'paint', { outlineT: 0, edges: false });
}

// sits a box on the ground (base below the lowest corner) — for buildings and walls on slopes
function groundSpan(x0, z0, x1, z1) {
  let lo = 1e9, hi = -1e9;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]]) { const y = terrainAt(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  return [lo, hi];
}

function buildCity() {
  const T0 = performance.now(), laps = location.hash === '#laps', lap = (n) => laps && console.log('[city] ' + n + ' ' + Math.round(performance.now() - T0) + 'ms');
  buildHeights();
  const P = PLAN.pond; P.y = landH(P.x, P.z) + 6;
  pondBowl(P.x, P.z, P.r, P.y);
  prepRelief();
  const M = planMetro();
  // the gallery: dig the line into the ridge
  // (downtown is bored, not dug: only the approaches where the deck runs at or just below the ground are cut)
  // dig wherever the deck is below the ground but too shallow to bore (a wide cutting, so its slopes stay off the deck)
  const cut = (p) => !p.bored && p.g > p.y - 1.5 && !inHole(p.x, p.z);
  const corridor = []; for (let i = 0; i < M.N; i += 2) { const p = M.pts[i]; if (cut(p) || (!p.bored && (M.pts[(i + 4) % M.N].bored || M.pts[(i - 4 + M.N) % M.N].bored))) corridor.push([p.x, p.y, p.z]); else if (corridor.length && corridor[corridor.length - 1] !== null) corridor.push(null); }
  let run = []; for (const c of corridor) { if (c === null) { if (run.length > 1) carveCorridor(run, METRO.deckW / 2 + 8.5, -1.8); run = []; } else run.push(c); } if (run.length > 1) carveCorridor(run, METRO.deckW / 2 + 8.5, -1.8);
  // over a bored tunnel the terrain skirts stay shallow (they would hang into it)
  { const tg = new Map(), k = (x, z) => Math.floor(x / 16) + ',' + Math.floor(z / 16);
    for (const p of M.pts) if (p.bored) { const kk = k(p.x, p.z); (tg.get(kk) || tg.set(kk, []).get(kk)).push(p); }
    TER.skirtD = (x, z) => { let d = 4; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const p of (tg.get((Math.floor(x / 16) + a) + ',' + (Math.floor(z / 16) + b)) || [])) if (Math.hypot(p.x - x, p.z - z) < 16) d = Math.min(d, Math.max(0.3, terrainAt(x, z) - p.y - 8)); return d; }; }
  if (typeof prepDistricts === 'function') prepDistricts();
  // station surroundings: a little forecourt where each ramp lands
  lap('heights');
  const B = new CellBatch(), F = new FarBatch(), S = makeSlabs();
  const mats = cityMaterials();
  const K = makeKit({
    name: 'Downtone', killY: -30, batch: B, lowPoly: true,
    phys: { friction: 0.5, fastFriction: 0.55, overDecay: 0.6, slopeK: 0.45, drag: 0.0012, climb: 1.6 },
    buildBatch: (b, W) => {
      W.cells = b.buildCells(mats);
      for (const e of (W.cellExtras || [])) {
        const key = Math.floor(e.x / CELL) + ',' + Math.floor(e.z / CELL);
        let g = W.cells.get(key); if (!g) { g = new THREE.Group(); g.userData = { cx: (Math.floor(e.x / CELL) + 0.5) * CELL, cz: (Math.floor(e.z / CELL) + 0.5) * CELL }; W.cells.set(key, g); }
        g.add(e.mesh);
      }
      for (const g of W.cells.values()) W.group.add(g);
    }
  });
  const W = K.W;
  groundRibbon.far = F; W.far = F; W.slabs = S; W.mats = mats; W.sounds = []; W.spots = []; W.benches = []; W.lamps = []; W.npcs = []; W.vehicles = [];
  W.spawn = V3(PLAN.places.summit[0], 0, PLAN.places.summit[1] + 20); W.spawnYaw = 0;
  W.spawn.y = terrainAt(W.spawn.x, W.spawn.z);
  // ground
  const terrain = terrainMeshes(paintGround, mats.ground); W.group.add(terrain);
  W.group.add(outerHills(mats.hills)); hillTrees(F);
  lap('terrain');
  // lake: a huge sheet of water, and a dark floor far below so you never see through it
  const lakeMat = new THREE.MeshBasicMaterial({ color: 0x6fb0c8, map: mats.waterTex, transparent: true, opacity: 0.78, depthWrite: false });
  mats.waterTex.repeat.set(1, 1);
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000, 1, 1), lakeMat); lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0, 470 + 3000); lake.renderOrder = 3; W.group.add(lake);
  const lakeUV = lake.geometry.attributes.uv; for (let i = 0; i < lakeUV.count; i++) lakeUV.setXY(i, lakeUV.getX(i) * 900, lakeUV.getY(i) * 600); lakeUV.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12000, 8000), new THREE.MeshBasicMaterial({ color: 0x23485a })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -14, 3000); W.group.add(floor);
  W.waters.push({ x0: -6000, z0: 470, x1: 6000, z1: 9000, y: 0, deep: true, lake: true });
  W.lakeMat = lakeMat;
  buildCanal(K, S, F);
  buildRoads(K, S, F);
  paveDowntown(K.B);
  buildMetro(K, M, S, F);
  buildStations(K, M, S, F);
  lap('canal, roads, metro');
  buildDistricts(K, S, F);
  lap('districts');
  // the edges of the world: soft invisible walls on the hills
  for (const b of [[-900, -1100, -650, 800], [650, -1100, 900, 800], [-900, -1100, 900, -760]]) W.boxes.push({ x0: b[0], y0: -50, z0: b[1], x1: b[2], y1: 400, z1: b[3], tag: 'edge', nocam: true });
  K.finish();
  lap('finish');
  // ground = terrain (with canals open), slabs, train roofs, plus kit boxes
  W.groundExtra = (x, z, yMax, r) => {
    let y = inCanal(x, z) ? PLAN.canal.bedY : inHole(x, z) ? -1e9 : terrainAt(x, z), hit = TERRAIN_HIT;
    if (y > yMax) { y = -1e9; hit = null; }
    const s = S.query(x, z, yMax, Math.min(r, 0.2)); if (s && s.y > y) { y = s.y; hit = s.hit; }
    if (W.trainsys) { const t = W.trainsys.ground(x, z, yMax); if (t && t.y > y) { y = t.y; hit = t.hit; } }
    return hit ? { y, hit } : null;
  };
  W.group.add(F.build(mats.far));
  console.log('city built in ' + Math.round(performance.now() - T0) + ' ms');
  W.trainsys = makeTrains(W, M, W.group);
  W.dyn.push({ update: (dt) => W.trainsys.update(dt) });
  // visibility of the detailed cells
  W.updateCells = (cx, cz, R = 340) => {
    terrain.userData.lod(cx, cz);
    for (const g of W.cells.values()) {
      const d = Math.hypot(g.userData.cx - cx, g.userData.cz - cz);
      g.visible = g.visible ? d < R + 40 : d < R;
    }
  };
  return W;
}

// ---------- canal ----------
// the canal follows PLAN.canal.path: stone walls and a coping along both banks, a paved apron
// over the cut-out terrain cells, the bed, the water; a tunnel portal at the west end, a lock at the basin
function buildCanal(K, S, F) {
  const W = K.W, C = PLAN.canal, B = K.B, P = C.path.pts, n = P.length;
  const wall = '#8f8577', top = '#b9b0a0', pave = '#b9ad98';
  const N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
  const obox = (ax, az, bx, bz, off, thick, y0, y1, col, kind, ol) => {
    const L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
    B.add(new THREE.BoxGeometry(thick, y1 - y0, L + 0.35), m, col, kind, { outlineT: ol, edges: false });
  };
  // walls + coping, in 8 m pieces (every second sample), each side
  // everything stops on the harbour's quay line: there the canal opens into the basin
  const dry = (k) => P[k][1] < PLAN.docksQuayZ, pier = dry;
  for (let i = 0; i < n - 1; i += 2) {
    const j = Math.min(n - 1, i + 2);
    if (!pier(i) || !pier(j)) continue;
    for (const sd of [-1, 1]) {
      const o = C.half + 0.5, ax = P[i][0] + N[i][0] * o * sd, az = P[i][1] + N[i][1] * o * sd, bx = P[j][0] + N[j][0] * o * sd, bz = P[j][1] + N[j][1] * o * sd;
      obox(ax, az, bx, bz, 0, 1, C.bedY, C.quayY - 0.05, wall, 'brick', 0);
      const o2 = C.half + 0.3, cx = P[i][0] + N[i][0] * o2 * sd, cz = P[i][1] + N[i][1] * o2 * sd, dx = P[j][0] + N[j][0] * o2 * sd, dz = P[j][1] + N[j][1] * o2 * sd;
      obox(cx, cz, dx, dz, 0, 1.4, C.quayY - 0.05, C.quayY + 0.2, top, 'paving', 0.04);
    }
  }
  // strips along the path: (inner offset, outer offset, y at inner, y at outer or null = on the terrain)
  const strip = (o0, o1, y0, y1, col, kind, mesh) => {
    const pos = [], uv = [];
    for (let i = 0; i < n - 1; i++) for (const sd of (o0 === -o1 ? [1] : [-1, 1])) {
      if (!dry(i + 1)) continue;
      const q = (k, o) => { const x = P[k][0] + N[k][0] * o * sd, z = P[k][1] + N[k][1] * o * sd; return [x, o === o1 && y1 === null ? terrainAt(x, z) + 0.08 : (o === o0 ? y0 : y1), z]; };
      const a = q(i, o0), b = q(i, o1), c = q(i + 1, o0), d = q(i + 1, o1);
      // faces up whichever side we're on
      if (sd > 0) pos.push(...a, ...c, ...b, ...b, ...c, ...d); else pos.push(...a, ...b, ...c, ...b, ...d, ...c);
      if (mesh) for (const p of [a, c, b, b, c, d]) uv.push(p[0] / 10, p[2] / 10);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    if (g.attributes.normal.array[1] < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
    if (mesh) { g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; }
    B.add(g, null, col, kind, { outlineT: 0, edges: false });
  };
  strip(C.half + 1.0, C.half + 15, C.quayY + 0.12, null, pave, 'walk');           // the quay apron, both sides
  // the harbour basin's west side: a stone embankment from the quay line down into the lake (the beach beyond it)
  { const x = PLAN.docksX[0], z0 = PLAN.docksQuayZ - 1, z1 = shoreZ(x) + 34;
    K.box(x - 1.6, -6.5, z0, x + 1.6, 3.9, z1, wall, 'brick', { outlineT: 0.06 }); B.box(x - 1.9, 3.85, z0, x + 1.9, 4.15, z1 + 0.3, top, 'paving', { outlineT: 0.04, edges: false });
    // and the quay from it to the canal's west wall
    let k = n - 1; while (k > 0 && !dry(k)) k--;
    const xw = Math.min(P[k][0] + N[k][0] * (C.half + 1), P[k][0] - N[k][0] * (C.half + 1)), zq = PLAN.docksQuayZ;
    K.box(x, -6.5, zq - 1.6, xw, C.quayY - 0.05, zq + 1.6, wall, 'brick', { outlineT: 0.06 }); B.box(x, C.quayY - 0.05, zq - 1.9, xw, C.quayY + 0.2, zq + 1.9, top, 'paving', { outlineT: 0.04, edges: false }); }
  strip(-C.half - 1, C.half + 1, C.bedY, C.bedY, '#4a5a50', 'plain');             // the bed
  // water: one mesh (always drawn) + a deep-water zone (game.js checks inCanal inside its box)
  const wm = new THREE.MeshBasicMaterial({ color: 0x5f9fa0, map: W.mats.waterTex, transparent: true, opacity: 0.8, depthWrite: false });
  { const g = strip(-C.half - 0.6, C.half + 0.6, C.waterY + 0.03, C.waterY + 0.03, null, null, true), m = new THREE.Mesh(g, wm); m.renderOrder = 4; W.group.add(m); }     // (drawn over the lake's sheet)
  { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    W.waters.push({ x0: x0 - C.half - 12, z0: z0 - C.half, x1: x1 + C.half, z1: z1 + C.half, y: C.waterY, deep: true, canal: true }); }
  // the tunnel mouth (the path starts heading east): a stone portal across canal and quays, a dark arch, a keystone, a lamp each side
  { const x = C.x0, cz = C.z, top = Math.max(C.quayY + 9, terrainAt(x - 6, cz) + 1.5), st = '#8f8676';
    K.box(x - 10, C.bedY, cz - C.half - 16, x, top, cz - C.half + 0.5, st, 'brick', { outlineT: 0.08 });
    K.box(x - 10, C.bedY, cz + C.half - 0.5, x, top, cz + C.half + 16, st, 'brick', { outlineT: 0.08 });
    K.box(x - 10, C.quayY + 4.2, cz - C.half + 0.5, x, top, cz + C.half - 0.5, st, 'brick', { outlineT: 0.08 });
    K.box(x - 10, C.bedY, cz - C.half, x - 9, C.quayY + 4.3, cz + C.half, '#0d0c12', 'plain', { outlineT: 0 });
    B.box(x - 9.5, C.quayY + 4.0, cz - C.half + 0.4, x + 0.05, C.quayY + 4.4, cz + C.half - 0.4, '#0d0c12', 'plain', { outlineT: 0, edges: false });
    for (let k = -5; k <= 5; k++) B.box(x - 0.1, C.quayY + 4.2, cz + k * 2.1 - 0.9, x + 0.35, C.quayY + (k === 0 ? 6.2 : 5.4), cz + k * 2.1 + 0.9, k === 0 ? '#d9cfb8' : '#b5ab98', 'plain', { outlineT: 0.04 });
    B.box(x - 0.2, top, cz - C.half - 16.3, x + 0.4, top + 0.6, cz + C.half + 16.3, '#d9cfb8', 'plain', { outlineT: 0.05 });
    for (const sd of [-1, 1]) { K.cyl(x + 1.2, C.quayY, cz + sd * (C.half + 5), 0.1, 3.2, '#2a2838', { outline: 0.03, seg: 6 }); B.box(x + 0.9, C.quayY + 3.2, cz + sd * (C.half + 5) - 0.3, x + 1.5, C.quayY + 3.7, cz + sd * (C.half + 5) + 0.3, '#ffe9b0', 'lamp', { outlineT: 0, edges: false }); }
  }
  { let e = n - 1; while (e > 2 && !pier(e)) e--; e -= e % 2;
    for (const sd of [-1, 1]) { const x = P[e][0] + N[e][0] * (C.half + 0.5) * sd, z = P[e][1] + N[e][1] * (C.half + 0.5) * sd;
      K.cyl(x, C.quayY + 0.2, z, 0.12, 3.4, '#2a2838', { outline: 0.03, seg: 6 }); B.box(x - 0.35, C.quayY + 3.6, z - 0.35, x + 0.35, C.quayY + 4.2, z + 0.35, sd > 0 ? '#e85a3a' : '#7ac04a', 'lamp', { outlineT: 0.03, edges: false }); } }
  W.canalWaterMat = wm;
  W.canal = C;
}

// ---------- the big roads (district streets are laid by each district) ----------
// (their lines are in PLAN.roads)
// downtown's open ground: paving, not bare earth (the streets are drawn over it; the sunken street and the
// building site keep their own ground)
function paveDowntown(B) {
  const D = PLAN_REAL.byKey.business, st = 6, pos = [], uv = [];
  const [x0, z0, x1, z1] = D.rect;
  const ok = (x, z) => districtDist(D, x, z) < -9 && !(Math.abs(x - VALLEY.x) < VALLEY.rimHalf + 1 && z > VALLEY.z0 - 2 && z < VALLEY.z3 + 2)
    && !(x > SITE[0] - 2 && x < SITE[2] + 2 && z > SITE[1] - 2 && z < SITE[3] + 2);
  const P = (x, z) => [x, terrainAt(x, z) + 0.05, z];
  for (let z = z0; z < z1; z += st) for (let x = x0; x < x1; x += st) {
    if (!ok(x, z) || !ok(x + st, z) || !ok(x, z + st) || !ok(x + st, z + st)) continue;
    const a = P(x, z), b = P(x + st, z), c = P(x, z + st), d = P(x + st, z + st);
    pos.push(...a, ...c, ...b, ...b, ...c, ...d);
    for (const q of [a, c, b, b, c, d]) uv.push(q[0] / 6, q[2] / 6);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  B.add(g, null, '#a39d92', 'paving', { outlineT: 0, edges: false });
}
function buildRoads(K, S, F) {
  const W = K.W, B = K.B;
  W.roads = {};
  for (const [key, road] of Object.entries(PLAN.roads)) {
    const pts = road.path.pts, width = road.width;
    // sidewalks first (wider, paler), then the asphalt on top
    // (where a street crosses the sunken street it's carried by that street's bridge: no ribbon down in the cut)
    const inCut = (x, z) => Math.abs(x - VALLEY.x) < VALLEY.rimHalf + 0.5 && z > VALLEY.z0 && z < VALLEY.z3;
    const runs = []; let run = [];
    for (const p of pts) { if (inCut(p[0], p[1])) { if (run.length > 1) runs.push(run); run = []; } else run.push(p); }
    if (run.length > 1) runs.push(run);
    const P = [];
    for (const rp of runs) {
      groundRibbon(B, rp, width + 7, '#c8c1b4', 'walk', 0.07);
      const Pr = groundRibbon(B, rp, width, '#5a5868', 'road', 0.1);
      roadDashes(B, Pr); P.push(...Pr);
    }
    W.roads[key] = { pts, width, P };
  }
}
// a bridge between two quay points (flat or arched by `rise`); also used over the canal
function bridge(K, S, F, ax, az, bx, bz, width, rise = 1.4, o = {}) {
  const W = K.W, B = K.B, C = PLAN.canal;
  const ya = terrainAt(ax, az) + 0.05, yb = terrainAt(bx, bz) + 0.05, mx = (ax + bx) / 2, mz = (az + bz) / 2, ym = Math.max(ya, yb) + rise;
  const L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
  S.add(ax, ya, az, mx, ym, mz, width / 2 - 0.3); S.add(mx, ym, mz, bx, yb, bz, width / 2 - 0.3);
  const n = 8, col = o.color || '#b0a18a';
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, y0 = t0 < 0.5 ? U.lerp(ya, ym, U.smooth(t0 * 2)) : U.lerp(ym, yb, U.smooth(t0 * 2 - 1)), y1 = t1 < 0.5 ? U.lerp(ya, ym, U.smooth(t1 * 2)) : U.lerp(ym, yb, U.smooth(t1 * 2 - 1));
    const x0 = U.lerp(ax, bx, t0), z0 = U.lerp(az, bz, t0), x1 = U.lerp(ax, bx, t1), z1 = U.lerp(az, bz, t1);
    const segL = Math.hypot(x1 - x0, z1 - z0), mid = V3((x0 + x1) / 2, (y0 + y1) / 2 - 0.45, (z0 + z1) / 2);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.atan2(y1 - y0, segL), yaw, 0, 'YXZ')).setPosition(mid);
    B.add(new THREE.BoxGeometry(width, 0.9, segL + 0.06), m, col, o.kind || 'paving', { outlineT: 0.06, edges: false });
  }
  // abutments on each bank
  for (const [x, z, y] of [[ax, az, ya], [bx, bz, yb]]) {
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, (C.bedY + y) / 2 - 0.3, z);
    B.add(new THREE.BoxGeometry(width + 0.6, y - C.bedY, 3), m, o.wall || '#8f8577', 'brick', { outlineT: 0.05, edges: false });
  }
  // parapets (grindable rails on top)
  for (const sd of [-1, 1]) {
    const rx = Math.cos(yaw) * sd * (width / 2 - 0.3), rz = -Math.sin(yaw) * sd * (width / 2 - 0.3), pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12, y = t < 0.5 ? U.lerp(ya, ym, U.smooth(t * 2)) : U.lerp(ym, yb, U.smooth(t * 2 - 1)); pts.push([U.lerp(ax, bx, t) + rx, y + 1.0, U.lerp(az, bz, t) + rz]); }
    K.rail(pts, { color: o.rail || '#e9e4f5', postColor: '#6a6458', postMax: 1.2, round: 0, radius: 0.07 });
  }
  F.add(new THREE.BoxGeometry(width - 0.6, 0.8, L), new THREE.Matrix4().makeRotationY(yaw).setPosition(mx, (ya + yb) / 2 + rise * 0.6 - 0.5, mz), col);
  return { ax, az, bx, bz, ym };
}
