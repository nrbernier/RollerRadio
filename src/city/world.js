// ============================================================
//  CITY WORLD — assembles terrain, water, roads, metro and districts
// ============================================================
const GROUND_COLS = {
  park: '#3d5f36', obs: '#6f8f4f', oldtown: '#7c8a56', business: '#a8a398', market: '#b89a72',
  canals: '#8f8a7c', docks: '#8c877e', lake: '#6c9150'
};
const _gc = new THREE.Color(), _gc2 = new THREE.Color(), _gw = {};
function paintGround(x, z, y, steep, out) {
  districtWeights(x, z, _gw, 90);
  out.setRGB(0, 0, 0);
  for (const k in _gw) { if (_gw[k] < 0.001) continue; _gc.set(GROUND_COLS[k]); out.r += _gc.r * _gw[k]; out.g += _gc.g * _gw[k]; out.b += _gc.b * _gw[k]; }
  // beaches and wet sand
  const dz = z - shoreZ(x);
  if (dz > -45 && !(x > 452 && x < 1076)) { _gc.set(dz > 0 ? '#c9b98a' : '#e6d7a8'); out.lerp(_gc, U.smooth(U.clamp((dz + 45) / 25, 0, 1))); }
  // steep ground shows rock
  if (steep > 0.28) out.lerp(_gc.set('#8c8170'), U.clamp((steep - 0.28) * 3, 0, 0.8));
  // a little variation so big lawns aren't flat
  const n = Math.sin(x * 0.05) * Math.sin(z * 0.043) * 0.5 + Math.sin(x * 0.013 + z * 0.021) * 0.5;
  out.multiplyScalar(0.95 + n * 0.06);
  if (y < -0.5) out.lerp(_gc.set('#6f8a8a'), U.clamp(-y / 4, 0, 0.7));
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
  return P;
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
  const T0 = performance.now();
  buildHeights();
  const P = PLAN.pond; P.y = landH(P.x, P.z) + 6;
  pondBowl(P.x, P.z, P.r, P.y);
  const M = planMetro();
  // the gallery: dig the line into the ridge
  const corridor = []; for (let i = 0; i < M.N; i += 2) { const p = M.pts[i]; if (p.covered || M.pts[(i + 6) % M.N].covered || M.pts[(i - 6 + M.N) % M.N].covered) corridor.push([p.x, p.y, p.z]); else if (corridor.length && corridor[corridor.length - 1] !== null) corridor.push(null); }
  let run = []; for (const c of corridor) { if (c === null) { if (run.length > 1) carveCorridor(run, METRO.deckW / 2 + 2, -1.8); run = []; } else run.push(c); } if (run.length > 1) carveCorridor(run, METRO.deckW / 2 + 2, -1.8);
  if (typeof prepDistricts === 'function') prepDistricts();
  // station surroundings: a little forecourt where each ramp lands
  const B = new CellBatch(), F = new FarBatch(), S = makeSlabs();
  const mats = cityMaterials();
  const K = makeKit({
    name: 'Rubato', killY: -30, batch: B,
    phys: { friction: 0.5, fastFriction: 0.55, overDecay: 0.6, slopeK: 0.45, drag: 0.0012, climb: 1.6 },
    buildBatch: (b, W) => { W.cells = b.buildCells(mats); for (const g of W.cells.values()) W.group.add(g); }
  });
  const W = K.W;
  W.far = F; W.slabs = S; W.mats = mats; W.sounds = []; W.spots = []; W.benches = []; W.lamps = []; W.npcs = []; W.vehicles = [];
  W.spawn = V3(96, 0, -1168); W.spawnYaw = 0;
  W.spawn.y = terrainAt(W.spawn.x, W.spawn.z);
  // ground
  const terrain = terrainMeshes(paintGround, mats.ground); W.group.add(terrain);
  W.group.add(outerHills(mats.hills));
  // lake: a huge sheet of water, and a dark floor far below so you never see through it
  const lakeMat = new THREE.MeshBasicMaterial({ color: 0x6fb0c8, map: mats.waterTex, transparent: true, opacity: 0.78, depthWrite: false });
  mats.waterTex.repeat.set(1, 1);
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000, 1, 1), lakeMat); lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0, 1150 + 3000); lake.renderOrder = 3; W.group.add(lake);
  const lakeUV = lake.geometry.attributes.uv; for (let i = 0; i < lakeUV.count; i++) lakeUV.setXY(i, lakeUV.getX(i) * 900, lakeUV.getY(i) * 600); lakeUV.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12000, 8000), new THREE.MeshBasicMaterial({ color: 0x23485a })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -14, 3000); W.group.add(floor);
  W.waters.push({ x0: -6000, z0: 1150, x1: 6000, z1: 9000, y: 0, deep: true, lake: true });
  W.lakeMat = lakeMat;
  buildCanal(K, S, F);
  buildRoads(K, S, F);
  buildMetro(K, M, S, F);
  buildStations(K, M, S, F);
  buildDistricts(K, S, F);
  // the edges of the world: soft invisible walls on the hills
  for (const b of [[-1300, -1700, -1050, 1300], [1052, -1700, 1300, 1300], [-1300, -1700, 1300, -1480]]) W.boxes.push({ x0: b[0], y0: -50, z0: b[1], x1: b[2], y1: 400, z1: b[3], tag: 'edge', nocam: true });
  K.finish();
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
    for (const g of W.cells.values()) {
      const d = Math.hypot(g.userData.cx - cx, g.userData.cz - cz);
      g.visible = g.visible ? d < R + 40 : d < R;
    }
  };
  return W;
}

// ---------- canal ----------
function buildCanal(K, S, F) {
  const W = K.W, C = PLAN.canal, B = K.B;
  const wall = '#8f8577', top = '#b9b0a0';
  const sz = shoreZ(C.bendX) + 4;
  // walls (thin boxes from the bed up to the quay), a stone coping on top
  const walls = [
    [C.x0, C.z - C.half - 1, C.bendX + C.half, C.z - C.half],             // north
    [C.x0, C.z + C.half, C.bendX - C.half, C.z + C.half + 1],             // south (west of the bend)
    [C.bendX - C.half - 1, C.z + C.half, C.bendX - C.half, sz],           // west side of the bend
    [C.bendX + C.half, C.z - C.half, C.bendX + C.half + 1, sz],           // east side of the bend
  ];
  for (const [x0, z0, x1, z1] of walls) {
    // in pieces, so the cells can cull them
    const alongX = x1 - x0 > z1 - z0, L = alongX ? x1 - x0 : z1 - z0;
    for (let s = 0; s < L; s += 32) {
      const a = s, b = Math.min(L, s + 32);
      const X0 = alongX ? x0 + a : x0, X1 = alongX ? x0 + b : x1, Z0 = alongX ? z0 : z0 + a, Z1 = alongX ? z1 : z0 + b;
      B.box(X0, C.bedY, Z0, X1, C.quayY - 0.05, Z1, wall, 'brick', { outlineT: 0, edges: false });
      B.box(X0 - (alongX ? 0 : 0.4), C.quayY - 0.05, Z0 - (alongX ? 0.4 : 0), X1 + (alongX ? 0 : 0.4), C.quayY + 0.2, Z1 + (alongX ? 0.4 : 0), top, 'paving', { outlineT: 0.04, edges: false });
    }
  }
  // the bed
  for (let x = C.x0; x < C.bendX + C.half; x += 64) B.box(x, C.bedY - 0.5, C.z - C.half, Math.min(C.bendX + C.half, x + 64), C.bedY, C.z + C.half, '#4a5a50', 'plain', { outlineT: 0, edges: false });
  for (let z = C.z + C.half; z < sz; z += 64) B.box(C.bendX - C.half, C.bedY - 0.5, z, C.bendX + C.half, C.bedY, Math.min(sz, z + 64), '#4a5a50', 'plain', { outlineT: 0, edges: false });
  // water: separate meshes (always drawn) + the deep-water zones
  const wm = new THREE.MeshBasicMaterial({ color: 0x5f9fa0, map: W.mats.waterTex, transparent: true, opacity: 0.8, depthWrite: false });
  const addWater = (x0, z0, x1, z1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), wm); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, C.waterY, (z0 + z1) / 2); m.renderOrder = 3;
    const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 10, uv.getY(i) * (z1 - z0) / 10); uv.needsUpdate = true;
    W.group.add(m);
    W.waters.push({ x0, z0, x1, z1, y: C.waterY, deep: true, canal: true });
  };
  addWater(C.x0, C.z - C.half, C.bendX + C.half, C.z + C.half);
  addWater(C.bendX - C.half, C.z + C.half, C.bendX + C.half, sz);
  W.canalWaterMat = wm;
  // the weir where the canal steps down into the lake
  K.waterfall(C.bendX - C.half, C.bendX + C.half, sz, C.waterY, 0.05, '#cfeff0');
  F.box(C.x0, C.bedY, C.z - C.half - 1, C.bendX + C.half + 1, C.quayY, C.z - C.half, wall, 0);
  W.canal = C;
}

// ---------- the big roads (district streets are laid by each district) ----------
const ROADS = {
  boulevard: [[432, -720], [432, -360], [432, 0], [432, 400], [432, 800], [432, 1190]],
  avenue: [[-1040, 336], [-600, 336], [-200, 336], [200, 336], [432, 336], [800, 336], [1040, 336]],
  hill: [[432, -720], [520, -790], [660, -852], [600, -905], [372, -960], [290, -1000], [216, -1044]],
};
function buildRoads(K, S, F) {
  const W = K.W, B = K.B;
  W.roads = {};
  for (const [key, pts] of Object.entries(ROADS)) {
    const width = key === 'boulevard' ? 20 : key === 'avenue' ? 16 : 11;
    // sidewalks first (wider, paler), then the asphalt on top
    groundRibbon(B, pts, width + 7, '#c8c1b4', 'walk', 0.07);
    const P = groundRibbon(B, pts, width, '#5a5868', 'road', 0.1);
    roadDashes(B, P);
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
