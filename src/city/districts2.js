// ============================================================
//  DISTRICTS (2) — old town, market, canals, docks, lakeshore
// ============================================================
// terrain edits that must happen before the ground is drawn
const CELLAR = [878, 166, 902, 190];          // grid-aligned: the sunken record shop in the market
const SKATE = [246, -752, 356, -672];      // the skatepark (real coordinates): the north-east corner, above the old town; levelled
const OBS_T = [96, -1180];                 // the observatory's terrace
function prepDistricts() {
  TER.holes.push(CELLAR);
  PLAN.skateY = (cityHeight(SKATE[0], SKATE[1]) + cityHeight(SKATE[2], SKATE[3]) + cityHeight(SKATE[0], SKATE[3]) + cityHeight(SKATE[2], SKATE[1])) / 4;
  flattenRect(SKATE, PLAN.skateY, 18, 'set');
  // cut the observatory terrace into the hillside so it sits level
  const [tx, tz] = OBS_T, ty = cityHeight(tx, tz) + 0.3;
  flattenRect([tx - 31, tz - 19, tx + 31, tz + 7], ty - 0.5, 14, 'min');
}

// ============================================================
//  CANALS — narrow gabled houses on both quays, bridges, bollards,
//  moored boats; the echo under the stone bridge (hidden spot)
// ============================================================
function buildCanals(H) {
  const { K, W, B, F, S } = H, r = U.rng(606), C = PLAN.canal, P = C.path.pts, n = P.length, acc = C.path.acc;
  // along the canal: a point, its direction and the normal to its left, at arc length s
  const at = (s) => { s = U.clamp(s, 0, C.path.len); let k = 0; while (k < n - 2 && acc[k + 1] < s) k++; const a = P[k], b = P[k + 1], L = acc[k + 1] - acc[k] || 1, t = (s - acc[k]) / L, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ux, uz, nx: -uz, nz: ux }; };
  const off = (s, o) => { const q = at(s); return [q.x + q.nx * o, q.z + q.nz * o]; };
  const line = (o, s0 = 0, s1 = C.path.len, step = 6) => { const L = []; for (let s = s0; s <= s1; s += step) L.push(off(s, o)); return L; };
  // the quays (paved by the canal itself) stay clear
  for (const sd of [-1, 1]) H.line(line(sd * (C.half + 8)), 8);
  // where streets cross: a bridge along the street; the main street's is the old stone arch, with a low ledge under it
  const crossings = [];
  for (const [key, rd] of Object.entries(PLAN.roads)) {
    const R = rd.path.pts; let prev = null;
    for (let k = 0; k < R.length; k++) { const d = pathDist(C.path, R[k][0], R[k][1], 40); const inside = d.d < C.half + 3; if (inside && !prev) {
      // the bridge runs along the street, from its last point clear of the canal to the first one past it
      const clear = (j) => pathDist(C.path, R[j][0], R[j][1], 40).d > C.half + 16;       // (past the quay apron too)
      let a = k; while (a > 0 && !clear(a)) a--; let b = k; while (b < R.length - 1 && !clear(b)) b++;
      crossings.push({ key, s: d.s, width: rd.width, a: R[a], b: R[b] }); }
      prev = inside; }
  }
  const bridgeAt = (s, width, rise, o) => { const a = off(s, -(C.half + 5)), b = off(s, C.half + 5); bridge(H.K, S, F, a[0], a[1], b[0], b[1], width, rise, o); H.line([off(s, -(C.half + 22)), off(s, C.half + 22)], width / 2 + 2); };
  for (const c of crossings) {
    const o = c.key === 'main' ? { color: '#a89a82', wall: '#8a7a64' } : {}, rise = c.key === 'main' ? 2.8 : 1.6;
    if (c.a && c.b && Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) > C.half * 2) { bridge(H.K, S, F, c.a[0], c.a[1], c.b[0], c.b[1], c.width + 4, rise, o); H.line([c.a, c.b], (c.width + 4) / 2 + 2); }
    else bridgeAt(c.s, c.width + 4, rise, o);
  }
  // footbridges between them, about every 160 m
  const taken = crossings.map(c => c.s);
  for (let s = 90; s < C.path.len - 90; s += 150 + r() * 40) if (!taken.some(t => Math.abs(t - s) < 70)) { bridgeAt(s, 7, 1.6); taken.push(s); }
  // the echo under the stone bridge: a low ledge along the south wall
  const main = crossings.find(c => c.key === 'main');
  if (main) {
    const ly = 2.4, o0 = C.half - 3.2, o1 = C.half, s0 = main.s - 30, s1 = main.s + 30;
    for (let s = s0; s < s1; s += 6) { const a = off(s, (o0 + o1) / 2), b = off(Math.min(s + 6, s1), (o0 + o1) / 2); S.add(a[0], ly, a[1], b[0], ly, b[1], (o1 - o0) / 2);
      const q = at(s + 3), m = new THREE.Matrix4().makeRotationY(Math.atan2(q.ux, q.uz)).setPosition(q.x + q.nx * (o0 + o1) / 2, (C.bedY + ly) / 2, q.z + q.nz * (o0 + o1) / 2);
      B.add(new THREE.BoxGeometry(o1 - o0, ly - C.bedY, 6.3), m, '#9a8e7a', 'paving', { outlineT: 0.05, edges: false }); }
    K.rail(line((o0 + 0.2), s0, s1, 6).map(([x, z]) => [x, ly + 1, z]), { color: '#e9e4f5', postMax: 1.2, round: 0 });
    const q = off(main.s, (o0 + o1) / 2); H.spot('arch', q[0], q[1], 15); W.spots[W.spots.length - 1].y = ly;
  }
  // canal houses: narrow, tall, gables to the water, a row on each bank (and a second row where there's room)
  const cols = ['#8a5a4a', '#5a6a6a', '#c8b89a', '#3f5a5a', '#a07a5a', '#d8cfc0', '#6a4a3a', '#7a8a7a', '#9a6a5a', '#b8a888'];
  const keep = PLAN.byKey.canals.shape;
  const house = (cx, cz, alongX, w, d, front) => {
    const hw = alongX ? w / 2 : d / 2, hd = alongX ? d / 2 : w / 2, x0 = cx - hw, x1 = cx + hw, z0 = cz - hd, z1 = cz + hd;
    if (shapeDist(keep, cx, cz) > -4 || !H.clearOf(x0, z0, x1, z1, 0.5)) return false;
    const bb = H.bldg(x0, z0, x1, z1, 10 + r() * 8, pick(r, cols), { trim: '#f2ede2', outline: 0.12, kind: 'house' });
    if (alongX) H.frontage(x0, x1, front > 0 ? z0 : z1, front, bb.hi, bb.top, r, { shop: 0.25, balcony: 0.45 });
    H.roof(x0, z0, x1, z1, bb.top, 3.5 + r() * 2, pick(r, ['#5a4a42', '#6a5a52', '#4a4a52', '#7a4a3a']), alongX);
    H.reserve([x0, z0, x1, z1]);
    return true;
  };
  for (const sd of [-1, 1]) for (const depth of [C.half + 16, C.half + 50]) {
    let s = 20;
    while (s < C.path.len - 30) {
      const w = 6.5 + r() * 4, d = 12 + r() * 4, q = at(s + w / 2);
      const alongX = Math.abs(q.ux) > Math.abs(q.uz);           // the canal runs east–west here: the house's front runs along x
      const o = sd * (depth + d / 2), cx = q.x + q.nx * o, cz = q.z + q.nz * o;
      // the house faces the canal: +1 if the water is to its north
      const front = alongX ? (q.nz * sd > 0 ? 1 : -1) : 0;
      house(cx, cz, alongX, w, d, front);
      s += w + (r() < 0.15 ? 7 : 0.4);
    }
  }
  // bollards, trees and lamps along the quays
  for (let s = 12; s < C.path.len - 8; s += 14) for (const sd of [-1, 1]) {
    const [x, z] = off(s, sd * (C.half + 1.6));
    if (z > shoreZ(x) - 6) continue;
    if (!H.clearOf(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 0)) continue;
    const y = terrainAt(x, z); K.cyl(x, y - 0.2, z, 0.28, 0.9, '#2a2a32', { outline: 0.03, seg: 8, r2: 0.34 }); W.boxes.push({ x0: x - 0.3, y0: y - 1, z0: z - 0.3, x1: x + 0.3, y1: y + 0.7, z1: z + 0.3, tag: 'bollard' });
    H.sound(x, y, z, 1.5, 'bollard');
    const k = Math.round(s / 14) % 3, [tx, tz] = off(s, sd * (C.half + 6.6));
    if (k === 0) { if (H.clearOf(tx - 1, tz - 1, tx + 1, tz + 1, 0)) H.tree(tx, tz, { s: 0.85, color: '#5a8a4a', color2: '#6f9a55' }); }
    else if (k === 1 && H.clearOf(tx - 0.3, tz - 0.3, tx + 0.3, tz + 0.3, 0)) H.lamp(tx, tz, { h: 4.2, color: '#1f2a2a' });
  }
  // moored boats (still) along the south bank
  for (let s = 60; s < C.path.len - 60; s += 70 + r() * 50) {
    if (taken.some(t => Math.abs(t - s) < 18)) continue;
    const q = at(s), o = -(C.half - 2.6), cx = q.x + q.nx * o, cz = q.z + q.nz * o, yaw = Math.atan2(q.ux, q.uz);
    const c = pick(r, ['#2f5f6a', '#8a3a2a', '#3a4a6a', '#5a6a3a', '#d8cfc0']), by = C.waterY + 0.25;
    B.add(new THREE.BoxGeometry(2.4, 1.0, 13), new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, by - 0.1, cz), c, 'plain', { outlineT: 0.05, edges: false });
    B.add(new THREE.BoxGeometry(2.0, 1.4, 5), new THREE.Matrix4().makeRotationY(yaw).setPosition(cx - q.ux * 2, by + 1.0, cz - q.uz * 2), '#efe6d2', 'plain', { outlineT: 0.04, edges: false });
    S.add(cx - q.ux * 6.4, C.waterY + 0.68, cz - q.uz * 6.4, cx + q.ux * 6.4, C.waterY + 0.68, cz + q.uz * 6.4, 1.15);
  }
  // people on the quays, a busker, pigeons
  H.walkers([line(C.half + 6, 20, C.path.len - 20, 12), line(-(C.half + 6), 20, C.path.len - 20, 12)], 40, 'canals');
  { const [bx, bz] = off(C.path.len * 0.25, C.half + 10); H.busker('accordion', bx, bz, Math.PI); }
  (W.pigeonSpots = W.pigeonSpots || []).push(off(C.path.len * 0.4, -(C.half + 30)).concat([8]), off(C.path.len * 0.15, C.half + 30).concat([8]));
}

// ============================================================
//  DOCKS — warehouses with sawtooth roofs, container stacks to jump,
//  a ship at the quay, cranes, the water tower (hidden spot)
// ============================================================
function buildDocks(H) {
  const { K, W, B, F, S } = H, r = U.rng(707);
  const R = PLAN.byKey.docks.rect, QZ = PLAN.docksQuayZ;
  H.patch([R[0] - 4, R[1] - 6, R[2] + 20, QZ], '#8c877e', 'walk', 0.05);
  // quay edge: a stone wall down into the harbour, bollards
  for (let x = R[0] - 4; x < R[2] + 20; x += 40) {
    B.box(x, -6, QZ, Math.min(R[2] + 20, x + 40), 3.9, QZ + 1, '#6f6a62', 'brick', { outlineT: 0, edges: false });
  }
  for (let x = R[0] + 10; x < R[2] + 10; x += 18) { const y = terrainAt(x, QZ - 1.5); K.cyl(x, y - 0.2, QZ - 1.5, 0.35, 0.9, '#c4b23a', { outline: 0.03, seg: 8 }); W.boxes.push({ x0: x - 0.35, y0: y - 1, z0: QZ - 1.85, x1: x + 0.35, y1: y + 0.7, z1: QZ - 1.15, tag: 'bollard' }); H.sound(x, y, QZ - 1.5, 1.6, 'bollard'); }
  W.waters.push({ x0: R[0] - 20, z0: QZ, x1: R[2] + 40, z1: QZ + 400, y: 0, deep: true, harbour: true });
  // warehouses
  const wcols = ['#a0522d', '#3a6a6a', '#8a4a3a', '#7a7a7a', '#5a6a4a', '#b8864a'];
  const sheds = [[480, 420, 600, 470], [640, 420, 780, 470], [830, 420, 1020, 470], [480, 520, 560, 640], [880, 520, 1020, 600], [480, 700, 560, 820]];
  for (const [x0, z0, x1, z1] of sheds) {
    if (!H.clearOf(x0, z0, x1, z1, 2)) continue;
    const col = pick(r, wcols), bb = H.bldg(x0, z0, x1, z1, 9 + r() * 4, col, { trim: '#3a3a3a', outline: 0.14, kind: 'shed' });
    // sawtooth roof: a row of ramps you can run up and drop off
    const n = Math.max(2, Math.round((x1 - x0) / 12)), step = (x1 - x0) / n;
    for (let k = 0; k < n; k++) K.ramp(x0 + k * step, z0, x0 + (k + 1) * step, z1, 'x', bb.top, bb.top + 3.2, '#c9c2b4', false, bb.top - 0.2, 'roof');
    H.reserve([x0, z0, x1, z1]);
  }
  // (the container yard is laid in real coordinates after the docks: see buildContainerTrail)
  const ccols = ['#c4523a', '#2f5f8a', '#e8b84a', '#3e8f86', '#8a5a9e', '#d97a3a', '#f2efe6', '#4a7a3a'];
  // a rail siding with freight wagons along the west side
  const rx = 590;
  groundRibbon(B, [[rx, 500], [rx, QZ - 30]], 3.2, '#6a6458', 'gravel', 0.08);
  for (const o of [-0.75, 0.75]) K.rail([[rx + o, terrainAt(rx + o, 500) + 0.25, 500], [rx + o, terrainAt(rx + o, QZ - 30) + 0.25, QZ - 30]], { color: '#8a8a92', posts: false, radius: 0.06, round: 0 });
  for (let z = 520; z < QZ - 60; z += 17) {
    if (r() < 0.3) continue;
    const y = terrainAt(rx, z), c = pick(r, ['#7a3a2a', '#3a4a5a', '#5a5a3a', '#8a6a3a']);
    K.box(rx - 1.5, y + 0.9, z, rx + 1.5, y + 4.2, z + 15, c, 'shed', { outlineT: 0.08, roofColor: '#6a6a6a' });
    F.box(rx - 1.5, y + 0.9, z, rx + 1.5, y + 4.2, z + 15, c, 0.2);
  }
  H.line([[rx, 500], [rx, QZ - 30]], 3);
  // a cargo ship at the quay, with a gangway up to its deck
  const sx0 = 640, sx1 = 900, sz0 = QZ + 6, sz1 = QZ + 30, sy = 8.5;
  K.box(sx0, -6, sz0, sx1, sy, sz1, '#2f3f5a', 'plain', { outlineT: 0.16 });
  B.box(sx0 + 0.3, sy - 2.5, sz0 - 0.05, sx1 - 0.3, sy - 1.6, sz0, '#c4523a', 'plain', { outlineT: 0, edges: false });
  K.box(sx1 - 40, sy, sz0 + 3, sx1 - 12, sy + 14, sz1 - 3, '#f2efe6', 'building', { roofColor: '#c9c2b4', outlineT: 0.12 });
  K.cyl(sx1 - 26, sy + 14, (sz0 + sz1) / 2, 2.2, 8, '#c4523a', { outline: 0.08, seg: 12 });
  for (let x = sx0 + 12; x < sx1 - 50; x += 14) { const c = pick(r, ccols); K.box(x - 6, sy, sz0 + 3, x + 6, sy + 2.6, sz0 + 5.6, c, 'plain', { outlineT: 0.05 }); if (r() < 0.6) K.box(x - 6, sy, sz1 - 5.6, x + 6, sy + 2.6, sz1 - 3, pick(r, ccols), 'plain', { outlineT: 0.05 }); }
  F.box(sx0, -2, sz0, sx1, sy, sz1, '#2f3f5a'); F.box(sx1 - 40, sy, sz0 + 3, sx1 - 12, sy + 14, sz1 - 3, '#f2efe6');
  const gx = 760, gy0 = terrainAt(gx, QZ - 6);
  S.add(gx, gy0, QZ - 8, gx, sy, sz0 + 2, 1.6);
  B.add(new THREE.BoxGeometry(3, 0.3, Math.hypot(sz0 + 10 - QZ, sy - gy0)), new THREE.Matrix4().makeRotationX(-Math.atan2(sy - gy0, sz0 + 10 - QZ)).setPosition(gx, (gy0 + sy) / 2 - 0.15, (QZ - 8 + sz0 + 2) / 2), '#c9c2b4', 'plain', { outlineT: 0.04, edges: false });
  K.rail([[sx0 + 1, sy + 1.1, sz1 - 0.5], [sx1 - 1, sy + 1.1, sz1 - 0.5]], { color: '#e9e4f5', postMax: 1.2 });
  K.rail([[sx0 + 1, sy + 1.1, sz0 + 0.5], [gx - 3, sy + 1.1, sz0 + 0.5]], { color: '#e9e4f5', postMax: 1.2 });
  K.rail([[gx + 3, sy + 1.1, sz0 + 0.5], [sx1 - 1, sy + 1.1, sz0 + 0.5]], { color: '#e9e4f5', postMax: 1.2 });
  K.rail([[sx0 + 0.5, sy + 1.1, sz0 + 1], [sx0 + 0.5, sy + 1.1, sz1 - 1]], { color: '#e9e4f5', postMax: 1.2 });
  // and the container tops on deck
  for (let x = sx0 + 12; x < sx1 - 50; x += 14) for (const z of [sz0 + 3.12, sz0 + 5.48]) K.rail([[x - 5.8, sy + 2.62, z], [x + 5.8, sy + 2.62, z]], { hidden: true, voice: 'pipe' });
  // harbour cranes along the quay (tall frames), the gantry over the yard
  for (const cx of [560, 960]) {
    const cy = terrainAt(cx, QZ - 8);
    for (const [ox, oz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) K.box(cx + ox - 0.5, cy, QZ - 8 + oz - 0.5, cx + ox + 0.5, cy + 22, QZ - 8 + oz + 0.5, '#e8b84a', 'plain', { outlineT: 0.06 });
    K.box(cx - 5, cy + 22, QZ - 16, cx + 5, cy + 26, QZ + 30, '#e8b84a', 'plain', { outlineT: 0.08 });
    K.box(cx - 3, cy + 26, QZ - 12, cx + 3, cy + 31, QZ - 4, '#c4523a', 'plain', { outlineT: 0.06 });
    F.box(cx - 5, cy, QZ - 12, cx + 5, cy + 26, QZ - 4, '#e8b84a', 0.5); F.box(cx - 5, cy + 22, QZ - 16, cx + 5, cy + 26, QZ + 30, '#e8b84a', 0.3);
  }
  // the water tower: a tank on legs, a hum underneath
  const wt = PLAN.spots.find(s => s.key === 'watertower').at, wy = terrainAt(wt[0], wt[1]);
  for (const [ox, oz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { K.box(wt[0] + ox - 0.5, wy - 0.5, wt[1] + oz - 0.5, wt[0] + ox + 0.5, wy + 18, wt[1] + oz + 0.5, '#6a5a52', 'plain', { outlineT: 0.05 }); }
  K.rod(V3(wt[0] - 5, wy + 6, wt[1] - 5), V3(wt[0] + 5, wy + 12, wt[1] + 5), 0.18, '#6a5a52'); K.rod(V3(wt[0] + 5, wy + 6, wt[1] - 5), V3(wt[0] - 5, wy + 12, wt[1] + 5), 0.18, '#6a5a52');
  K.cyl(wt[0], wy + 18, wt[1], 7.5, 9, '#8a7a6a', { outline: 0.1, seg: 18, kind: 'wood' });
  B.add(new THREE.ConeGeometry(8, 3.5, 18), new THREE.Matrix4().makeTranslation(wt[0], wy + 28.7, wt[1]), '#5a4a42', 'roof', { outlineT: 0.08 });
  W.boxes.push({ x0: wt[0] - 7.5, y0: wy + 18, z0: wt[1] - 7.5, x1: wt[0] + 7.5, y1: wy + 27, z1: wt[1] + 7.5, tag: 'tank' });
  F.add(new THREE.CylinderGeometry(7.2, 7.2, 9, 12), new THREE.Matrix4().makeTranslation(wt[0], wy + 22.5, wt[1]), '#8a7a6a');
  H.reserve([wt[0] - 10, wt[1] - 10, wt[0] + 10, wt[1] + 10]);
  H.spot('watertower', wt[0], wt[1], 24);
  // sodium lamps
  for (let x = R[0] + 20; x < R[2]; x += 48) for (let z = R[1] + 40; z < QZ - 10; z += 72) if (H.clearOf(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 1)) H.lamp(x, z, { h: 7, glow: '#ffb36a', color: '#3a3a3a', sound: 'lamp' });
  H.walkers([[[R[0] + 10, QZ - 10], [R[2] - 10, QZ - 10]], [[R[0] + 10, 600], [R[2] - 10, 600]], [[600, R[1] + 30], [600, QZ - 20]]], 18, 'docks');
}

// ============================================================
//  LAKESHORE — promenade under plane trees, the beach, the marina,
//  a long pier with a lighthouse at the end (hidden spot)
// ============================================================
function buildLakeshore(H) {
  const { K, W, B, F, S } = H, r = U.rng(808);
  const R = PLAN.byKey.lake.rect;
  // the promenade, following the shore
  const prom = []; for (let x = R[0] + 4; x <= R[2] + 160; x += 24) prom.push([x, shoreZ(x) - 34]);
  groundRibbon(B, prom, 10, '#d8cbb0', 'walk', 0.08); H.line(prom, 5);
  for (let i = 0; i < prom.length; i++) {
    const [x, z] = prom[i];
    if (i % 2 === 0 && H.clearOf(x - 1, z - 12, x + 1, z - 8, 0)) H.tree(x, z - 10, { s: 1.25, h: 4.5, color: '#5f8f45', color2: '#6f9a50', squash: 0.75 });
    if (i % 2 === 1) { if (H.clearOf(x - 2, z + 5, x + 2, z + 6, 0)) H.bench(x, z + 5.6, true, { view: true }); }
    if (i % 3 === 0 && H.clearOf(x - 0.3, z - 6.3, x + 0.3, z - 5.7, 0)) H.lamp(x + 6, z - 6, { style: 'globe', h: 4, color: '#1f2a3a' });
  }
  H.walkers([prom], 50, 'lake');
  H.busker('pan', prom[20][0] + 7, prom[20][1] - 5, 0);
  // the pier and the lighthouse
  const px = -360, pz0 = shoreZ(px) - 12, pz1 = Math.round(shoreZ(px) + 110), py = 2.7;      // (a pier of about 120 m)
  S.add(px, terrainAt(px, pz0) + 0.05, pz0, px, py, pz0 + 14, 2.6);
  S.add(px, py, pz0 + 14, px, py, pz1 - 8, 2.6);
  for (let z = pz0; z < pz1 - 8; z += 4) {
    const y = z < pz0 + 14 ? U.lerp(terrainAt(px, pz0) + 0.05, py, (z - pz0) / 14) : py;
    B.add(new THREE.BoxGeometry(5.4, 0.3, 4.05), new THREE.Matrix4().makeRotationX(z < pz0 + 14 ? -Math.atan2(py - terrainAt(px, pz0), 14) : 0).setPosition(px, y - 0.15, z + 2), '#9a7a58', 'wood', { outlineT: 0.03, edges: false });
    if (z % 12 === 0) for (const sd of [-1, 1]) K.cyl(px + sd * 2.5, -4, z, 0.22, y + 4, '#5a4430', { outline: 0.02, seg: 6 });
    if (z % 8 === 0) H.sound(px, y, z, 2.4, 'plank');
  }
  for (const sd of [-1, 1]) K.rail([[px + sd * 2.5, py + 1, pz0 + 16], [px + sd * 2.5, py + 1, pz1 - 10]], { color: '#e9e4f5', postColor: '#5a4430', postMax: 1.2 });
  F.box(px - 2.6, py - 0.6, pz0, px + 2.6, py, pz1, '#9a7a58', 0);
  // the platform and lighthouse
  S.add(px - 8, py, pz1, px + 8, py, pz1, 8);
  K.box(px - 8, -4, pz1 - 8, px + 8, py - 0.02, pz1 + 8, '#a89a84', 'paving', { outlineT: 0.08 });
  W.boxes.pop();      // the platform is a slab, not a wall
  const lx = px, lz = pz1 + 2;
  for (let k = 0; k < 6; k++) K.cyl(lx, py + k * 3, lz, 3.4 - k * 0.2, 3, k % 2 ? '#c4523a' : '#f2efe6', { outline: 0.08, seg: 16, r2: 3.6 - k * 0.2 });
  W.boxes.push({ x0: lx - 3.2, y0: py, z0: lz - 3.2, x1: lx + 3.2, y1: py + 18, z1: lz + 3.2, tag: 'lighthouse' });
  B.box(lx - 2.2, py + 18, lz - 2.2, lx + 2.2, py + 21, lz + 2.2, '#ffe9b0', 'lamp', { outlineT: 0.05 });
  B.add(new THREE.ConeGeometry(3, 3, 12), new THREE.Matrix4().makeTranslation(lx, py + 22.5, lz), '#2a2a32', 'plain', { outlineT: 0.06 });
  F.add(new THREE.CylinderGeometry(3, 3.4, 18, 10), new THREE.Matrix4().makeTranslation(lx, py + 9, lz), '#f2efe6');
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 9, 120, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  beam.rotation.z = Math.PI / 2; beam.position.x = 60; const piv = new THREE.Group(); piv.position.set(lx, py + 19.5, lz); piv.add(beam); W.group.add(piv);
  W.lighthouse = { piv, beam };
  H.bench(px + 4, pz1 + 6, true, { y: py, view: true });
  H.spot('lighthouse', lx, pz1, 32); W.spots[W.spots.length - 1].y = py;
  // the marina: pontoons, sailboats with ringing rigging
  const mx0 = -200, mx1 = 150, mz = shoreZ(0) + 6;
  S.add(mx0, 0.7, mz + 4, mx1, 0.7, mz + 4, 1.6);
  const rz0 = shoreZ(0) - 10, ry0 = terrainAt(0, rz0) + 0.05;
  S.add(0, ry0, rz0, 0, 0.7, mz + 2.5, 1.5);
  B.add(new THREE.BoxGeometry(3, 0.3, Math.hypot(mz + 2.5 - rz0, ry0 - 0.7)), new THREE.Matrix4().makeRotationX(Math.atan2(ry0 - 0.7, mz + 2.5 - rz0)).setPosition(0, (ry0 + 0.7) / 2 - 0.15, (rz0 + mz + 2.5) / 2), '#9a7a58', 'wood', { outlineT: 0.03, edges: false });
  B.box(mx0, 0.3, mz + 2.4, mx1, 0.7, mz + 5.6, '#9a7a58', 'wood', { outlineT: 0.03, edges: false });
  for (let x = mx0 + 20; x < mx1; x += 40) {
    S.add(x, 0.7, mz + 5, x, 0.7, mz + 60, 1.2); B.box(x - 1.2, 0.3, mz + 5, x + 1.2, 0.7, mz + 60, '#9a7a58', 'wood', { outlineT: 0.03, edges: false });
    for (const sd of [-1, 1]) for (let z = mz + 14; z < mz + 58; z += 13) {
      const bx = x + sd * 5;
      B.box(bx - 1.5, -0.25, z - 4.5, bx + 1.5, 0.65, z + 4.5, pick(r, ['#f2efe6', '#f2efe6', '#2f5f8a', '#c4523a']), 'plain', { outlineT: 0.04, edges: false });
      K.cyl(bx, 0.6, z + 0.5, 0.07, 10, '#d9d4c8', { outline: 0.02, seg: 5 });
      H.sound(bx, 1, z, 4, 'rigging');
    }
  }
  // beach umbrellas and a kiosk
  for (let i = 0; i < 26; i++) { const x = R[0] + 60 + r() * (R[2] - R[0] - 120), z = shoreZ(x) - 12 - r() * 14; if (x > mx0 - 20 && x < mx1 + 20) continue; if (Math.abs(x - px) < 10 || !H.clearOf(x - 1, z - 1, x + 1, z + 1, 0)) continue; const y = terrainAt(x, z); K.cyl(x, y - 0.2, z, 0.05, 2.4, '#d9d4c8', { outline: 0, seg: 4 }); B.add(new THREE.ConeGeometry(1.7, 0.7, 10), new THREE.Matrix4().makeTranslation(x, y + 2.4, z), pick(r, ['#e4572e', '#f2efe6', '#2f8f9d', '#e8c84a']), 'plain', { outlineT: 0.04, edges: false }); }
  const kx = -760, kz = shoreZ(-760) - 52; const kb = H.bldg(kx - 6, kz - 4, kx + 6, kz + 4, 3.5, '#2f8f9d', { trim: '#f2efe6', kind: 'house' }); H.roof(kx - 7, kz - 5, kx + 7, kz + 5, kb.top, 1.4, '#e4572e');
  // the lawn behind the promenade: big trees, paths
  for (let i = 0; i < 140; i++) { const x = R[0] + 20 + r() * (R[2] - R[0] - 40), z = R[1] + 10 + r() * (shoreZ(x) - 70 - R[1]); if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 1.5)) { H.tree(x, z, { s: 1.1 + r() * 0.6, h: 4.2, color: pick(r, ['#5f8f45', '#4f7f42', '#6f9a50']), color2: '#7aa055' }); H.reserve([x - 2, z - 2, x + 2, z + 2]); } }
  (W.pigeonSpots = W.pigeonSpots || []).push([px, pz0 - 20, 10], [0, mz - 30, 8]);
}

// ============================================================
//  THE LIDO — a lake bath on a deck where the promenade ends: a 50 m pool, a row of changing cabins,
//  sunshades, an entrance pavilion, and a diving tower over the lake. It has its own record (surf).
// ============================================================
const LIDO = { x0: -622, z0: 526, x1: -486, z1: 606, y: 3.2, pool: [-604, 548, -544, 578], waterY: 2.75 };
function buildLido(H) {
  const L = LIDO;
  { let m = -1e9; for (let x = L.x0; x <= L.x1; x += 4) m = Math.max(m, terrainAt(x, L.z0), terrainAt(x, L.z0 + 6)); L.y = Math.round((m + 0.3) * 10) / 10; L.waterY = L.y - 0.45; }   // the deck just clears the ground at its back
  const { K, W, B, S } = H, r = U.rng(4242), y = L.y, [px0, pz0, px1, pz1] = L.pool;
  const lo = (x0, z0, x1, z1) => Math.min(terrainAt(x0, z0), terrainAt(x1, z0), terrainAt(x0, z1), terrainAt(x1, z1), -0.5) - 1.5;
  const deck = '#cfc4ae', tile = '#7fd3e3', edge = '#f7f2e6';
  // the deck: four slabs round the pool (the lake end stands on piles over the water)
  const slab = (x0, z0, x1, z1) => K.box(x0, lo(x0, z0, x1, z1), z0, x1, y, z1, deck, 'tiles', { outlineT: 0.05 });
  slab(L.x0, L.z0, L.x1, pz0); slab(L.x0, pz1, L.x1, L.z1 - 10); slab(L.x0, pz0, px0, pz1); slab(px1, pz0, L.x1, pz1);
  K.box(L.x0, y - 0.6, L.z1 - 10, L.x1, y, L.z1, '#c9b48e', 'wood', { outlineT: 0.04 });          // the boards over the lake
  for (let x = L.x0 + 2; x < L.x1; x += 8) for (const z of [L.z1 - 8, L.z1 - 1]) K.cyl(x, -2.5, z, 0.35, y - 0.6 + 2.5, '#6a5440', { outline: 0.02, seg: 6 });
  // the pool: tiled floor and walls, a white coping, the water
  K.box(px0, lo(px0, pz0, px1, pz1), pz0, px1, L.waterY - 0.5, pz1, tile, 'tiles', { outlineT: 0 });        // (shallow: you skate through it in a spray)
  for (const [a, b, c, d] of [[px0, pz0 - 0.5, px1, pz0], [px0, pz1, px1, pz1 + 0.5], [px0 - 0.5, pz0, px0, pz1], [px1, pz0, px1 + 0.5, pz1]]) B.box(a, L.waterY - 0.5, b, c, y + 0.12, d, edge, 'plain', { outlineT: 0.03 });
  { const wm = new THREE.Mesh(new THREE.PlaneGeometry(px1 - px0, pz1 - pz0), new THREE.MeshBasicMaterial({ color: 0x5fd0ea, map: W.mats.waterTex, transparent: true, opacity: 0.78, depthWrite: false }));
    wm.rotation.x = -Math.PI / 2; wm.position.set((px0 + px1) / 2, L.waterY, (pz0 + pz1) / 2); wm.renderOrder = 4; W.group.add(wm);
    const uv = wm.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * 4); uv.needsUpdate = true; }
  W.waters.push({ x0: px0, z0: pz0, x1: px1, z1: pz1, y: L.waterY, pool: true });
  // lanes: ropes of red and white floats, dark lines on the floor
  for (let k = 1; k < 6; k++) { const z = pz0 + k * (pz1 - pz0) / 6; for (let x = px0 + 0.6; x < px1 - 0.4; x += 0.8) B.box(x - 0.18, L.waterY - 0.08, z - 0.18, x + 0.18, L.waterY + 0.1, z + 0.18, Math.floor(x) % 4 < 2 ? '#e4572e' : '#ffffff', 'plain', { outlineT: 0, edges: false }); }
  for (let k = 0; k < 6; k++) { const z = pz0 + (k + 0.5) * (pz1 - pz0) / 6; B.box(px0 + 2, L.waterY - 0.49, z - 0.25, px1 - 2, L.waterY - 0.46, z + 0.25, '#2f5f8a', 'plain', { outlineT: 0, edges: false }); }
  // starting blocks at the west end, a ladder at each corner
  for (let k = 0; k < 6; k++) { const z = pz0 + (k + 0.5) * (pz1 - pz0) / 6; K.box(px0 - 1.6, y, z - 0.45, px0 - 0.6, y + 0.75, z + 0.45, k % 2 ? '#2f8f9d' : '#f2efe6', 'plain', { outlineT: 0.04 }); }
  for (const [x, z] of [[px1 - 2, pz0], [px1 - 2, pz1]]) K.rail([[x, y + 0.9, z], [x + 1.2, y + 0.9, z]], { color: '#c9d2dc', postMax: 1.2, round: 0 });
  // changing cabins along the back: little huts, roofs in a row you can ride along
  const cols = ['#f2efe6', '#7fd3e3', '#e4572e', '#f2efe6', '#f2c14e', '#7fd3e3'];
  for (let x = L.x0 + 3, k = 0; x < px1 + 6; x += 3.4, k++) {
    const z0 = L.z0 + 3, z1 = L.z0 + 8;
    K.box(x, y, z0, x + 3.2, y + 2.7, z1, cols[k % cols.length], 'plain', { outlineT: 0.05 });
    B.box(x + 0.8, y, z1, x + 2.4, y + 2.1, z1 + 0.05, '#3a3550', 'plain', { outlineT: 0, edges: false });          // the door
  }
  K.box(L.x0 + 2.6, y + 2.7, L.z0 + 2.4, px1 + 6.4, y + 2.95, L.z0 + 8.8, '#ffffff', 'plain', { outlineT: 0.05 });       // one long roof slab
  // the entrance pavilion, where the promenade ends: a round-cornered box under a thin cantilevered roof
  { const ex0 = L.x1 - 22, ex1 = L.x1 - 4, ez0 = L.z0 + 2, ez1 = L.z0 + 12;
    K.box(ex0, y, ez0, ex1, y + 3.4, ez1, '#f2c14e', 'plain', { outlineT: 0.05 });
    for (let x = ex0 + 2; x < ex1 - 1; x += 4) B.box(x, y + 0.9, ez1, x + 2.4, y + 2.6, ez1 + 0.05, '#3a3550', 'plain', { outlineT: 0, edges: false });      // the ticket windows
    K.box(ex0 - 2, y + 3.4, ez0 - 2, ex1 + 4, y + 3.7, ez1 + 3, '#2f8f9d', 'plain', { outlineT: 0.06 });
    for (let k = 0; k < 8; k++) B.box(ex0 - 2 + k * 3, y + 3.7, ez1 + 2.95, ex0 - 2 + k * 3 + 1.5, y + 4.2, ez1 + 3.1, k % 2 ? '#e4572e' : '#ffffff', 'plain', { outlineT: 0, edges: false });
    for (const x of [ex1 + 3, ex0 - 1]) K.cyl(x, y, ez1 + 2, 0.2, 3.4, '#3a3550', { outline: 0.02, seg: 8 });
    // a ramp up from the end of the promenade to the deck
    const gx = L.x1 + 2, gz = (ez0 + ez1) / 2, gy = terrainAt(L.x1 + 16, gz);
    S.add(L.x1 + 16, gy, gz, L.x1, y, gz, 4.5);
    B.add(new THREE.BoxGeometry(16.5, 0.4, 9), new THREE.Matrix4().makeRotationZ(Math.atan2(y - gy, 16)).setPosition(L.x1 + 8, (gy + y) / 2 - 0.2, gz), deck, 'tiles', { outlineT: 0.04, edges: false });
    void gx; }
  // sunshades and deckchairs on the east deck, by the lake
  const shade = ['#e4572e', '#f2c14e', '#2f8f9d', '#ffffff', '#d9779a'];
  for (let i = 0; i < 14; i++) {
    const x = px1 + 5 + (i % 4) * 8 + r() * 2, z = pz0 + 2 + Math.floor(i / 4) * 9 + r() * 2;
    if (x > L.x1 - 4 || z > L.z1 - 12) continue;
    K.cyl(x, y, z, 0.06, 2.4, '#3a3550', { outline: 0, seg: 5 });
    B.add(new THREE.ConeGeometry(1.7, 0.7, 8), new THREE.Matrix4().makeTranslation(x, y + 2.55, z), shade[i % shade.length], 'plain', { outlineT: 0.04 });
    for (const sd of [-1, 1]) K.box(x + sd * 1.2 - 0.4, y, z + 0.4, x + sd * 1.2 + 0.4, y + 0.35, z + 2.2, '#f2efe6', 'plain', { outlineT: 0.03 });
  }
  // the west deck: planters with trees, a kiosk with a striped awning
  for (const [x, z] of [[L.x0 + 6, pz0 + 4], [L.x0 + 6, pz1 - 4], [L.x0 + 6, L.z1 - 16]]) { K.box(x - 1.6, y, z - 1.6, x + 1.6, y + 0.8, z + 1.6, '#b8743a', 'wood', { outlineT: 0.04 }); H.tree(x, z, { y: y + 0.8, s: 0.7, h: 3, color: '#6fbf6a', far: false }); }
  { const kx = L.x0 + 4, kz = (pz1 + L.z1 - 10) / 2 + 2; K.box(kx, y, kz - 3, kx + 5, y + 2.8, kz + 3, '#f7f2e6', 'plain', { outlineT: 0.05 });
    for (let k = 0; k < 4; k++) B.box(kx + 5, y + 2.4 - 0.02 * k, kz - 3 + k * 1.5, kx + 6.4, y + 2.5, kz - 1.5 + k * 1.5, k % 2 ? '#ffffff' : '#e4572e', 'plain', { outlineT: 0.02, edges: false }); }
  // a lifeguard's high chair by the pool
  K.box(px1 - 6, y, pz1 + 1.2, px1 - 4.8, y + 2.4, pz1 + 2.4, '#ffffff', 'plain', { outlineT: 0.04 });
  W.npcs.push({ kind: 'stand', pts: [[px1 - 5.4, pz1 + 1.8, Math.PI, y + 2.4]], style: 'lake' });
  // people: swimmers' friends on the deck, a few sunbathers
  for (let i = 0; i < 8; i++) { const x = U.lerp(px0, px1, r()), z = r() < 0.5 ? pz0 - 3 : pz1 + 5; W.npcs.push({ kind: 'stand', pts: [[x, z, r() * 6, y]], style: 'lake' }); }
  // the diving tower over the lake: 3, 5 and 10 m boards, stairs up the back
  { const tx = L.x1 - 14, tz = L.z1 - 4, c = '#e8e2d4';
    K.box(tx - 1.5, -2.5, tz - 1.5, tx + 1.5, y + 10, tz + 1.5, c, 'plain', { outlineT: 0.06 });
    for (const [h, len, w] of [[3, 5, 1.6], [5, 6, 1.6], [10, 7, 2.2]]) {
      const side = h === 5 ? -1 : 1;
      K.box(tx - w / 2 + side * (h === 5 ? 2.5 : 0), y + h - 0.25, tz, tx + w / 2 + side * (h === 5 ? 2.5 : 0), y + h, tz + len, h === 10 ? '#2f8f9d' : '#ffffff', 'plain', { outlineT: 0.05 });
      K.rail([[tx - w / 2 + side * (h === 5 ? 2.5 : 0), y + h + 1, tz], [tx - w / 2 + side * (h === 5 ? 2.5 : 0), y + h + 1, tz + len * 0.6]], { color: '#c9d2dc', postMax: 1, round: 0 });
    }
    // stairs: up the back in flights, a landing at each board
    S.add(tx - 8, y, tz - 6, tx - 1.6, y + 5, tz - 6, 1.2);
    K.box(tx - 1.6, y + 4.75, tz - 7.2, tx + 1.6, y + 5, tz - 1.5, '#ffffff', 'plain', { outlineT: 0.04 });
    S.add(tx + 1.6, y + 5, tz - 4, tx + 8, y + 10, tz - 4, 1.2);
    K.box(tx + 8, y + 9.75, tz - 5.2, tx + 10, y + 10, tz - 2.8, '#ffffff', 'plain', { outlineT: 0.04 });
    K.box(tx + 1.5, y + 9.75, tz - 2.8, tx + 10, y + 10, tz + 0.4, '#ffffff', 'plain', { outlineT: 0.04 });
    for (const [a, b] of [[[tx - 8, y + 1, tz - 7.1], [tx - 1.6, y + 6, tz - 7.1]], [[tx + 1.6, y + 6, tz - 2.9], [tx + 8, y + 11, tz - 2.9]]]) K.rail([a, b], { color: '#c9d2dc', postMax: 1.1, round: 0 });
  }
  // railings along the lake edge (a long grind), lamps and flags
  K.rail([[L.x0 + 1, y + 1, L.z1 - 0.5], [L.x1 - 20, y + 1, L.z1 - 0.5]], { color: '#e9e4f5', postColor: '#3a3550', postMax: 1.1, round: 2 });
  for (let x = L.x0 + 6; x < L.x1 - 4; x += 14) H.lamp(x, L.z0 + 13, { y, style: 'globe', h: 3.6, color: '#2f5f8a' });
  for (let x = L.x0 + 10; x < L.x1 - 20; x += 18) { K.cyl(x, y, L.z1 - 9, 0.07, 6, '#ffffff', { outline: 0, seg: 5 }); B.box(x + 0.07, y + 4.8, L.z1 - 9.02, x + 1.7, y + 5.8, L.z1 - 8.98, shade[(x | 0) % 5 < 0 ? 0 : Math.abs(x | 0) % 5], 'plain', { outlineT: 0, edges: false }); }
  W.lido = { x: (L.x0 + L.x1) / 2, z: (L.z0 + L.z1) / 2 };
}

// ============================================================
//  THE STACKS — container trails in the docks yard (real coordinates). Not a grid: each trail is one line of
//  stacks, end to end with short gaps, rising and falling (1 to 4 high), turning at wide pads (two containers side
//  by side). Grinds only along the trail (no parallel rows next to it to pull a jump sideways). A ramp at each start,
//  a gantry crane over the east trail with its beam as a high grind.
// ============================================================
function buildContainerTrail(H) {
  const { K, W, B, F } = H, r = U.rng(9191), L = 12.2, Wd = 2.5, Hc = 2.6;
  const ccols = ['#c4523a', '#2f5f8a', '#e8b84a', '#3e8f86', '#8a5a9e', '#d97a3a', '#f2efe6', '#4a7a3a'];
  // (the docks' own reservations include warehouses that were trimmed away: the trails check what's really there)
  const placed = [];
  const free = (x0, z0, x1, z1, m = 0) => {
    if (placed.some(p => x1 + m > p[0] && x0 - m < p[2] && z1 + m > p[1] && z0 - m < p[3])) return false;
    if (x0 < 282 || x1 > 638 || z0 < 268 || z1 > PLAN.docksQuayZ - 6) return false;
    if (Math.hypot(Math.max(x0 - 262, 0, 262 - x1), Math.max(z0 - 322, 0, 322 - z1)) < 12) return false;     // the water tower
    for (const rd of Object.values(PLAN.roads)) for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]]) if (pathDist(rd.path, x, z, 40).d < rd.width / 2 + 6) return false;
    return true;
  };
  const stack = (x0, z0, x1, z1, h, along) => {     // along: 'x' or 'z' (the long side)
    const y = Math.min(terrainAt(x0, z0), terrainAt(x1, z1), terrainAt(x0, z1), terrainAt(x1, z0));
    for (let k = 0; k < h; k++) {
      const c = pick(r, ccols);
      K.box(x0, y + k * Hc - (k ? 0 : 0.4), z0, x1, y + (k + 1) * Hc, z1, c, 'plain', { outlineT: 0.05, edges: k === h - 1 });
      // ribs on the long sides (corrugation reads from afar)
      if (along === 'x') for (let x = x0 + 1; x < x1 - 0.5; x += 1.5) for (const z of [z0 - 0.06, z1 - 0.02]) B.box(x, y + k * Hc + 0.15, z, x + 0.35, y + (k + 1) * Hc - 0.15, z + 0.08, '#' + new THREE.Color(c).multiplyScalar(0.78).getHexString(), 'plain', { outlineT: 0, edges: false });
    }
    const ty = y + h * Hc;
    F.box(x0, y - 0.4, z0, x1, ty, z1, '#8a6a5a', 0.2);
    H.reserve([x0 - 0.5, z0 - 0.5, x1 + 0.5, z1 + 0.5]); placed.push([x0, z0, x1, z1]);
    if (r() < 0.3) H.sound((x0 + x1) / 2, ty, (z0 + z1) / 2, 5, 'container');
    return ty;
  };
  const trail = (P, prof) => {
    let idx = 0, lastTop = null;
    const rails = [];      // the trail's two edge grinds, broken where the height changes
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], alongX = Math.abs(bx - ax) > Math.abs(bz - az), sgn = Math.sign(alongX ? bx - ax : bz - az), len = Math.abs(alongX ? bx - ax : bz - az);
      let t = i === 0 ? 0 : Wd * 2 + 2;
      const stop = i < P.length - 2 ? len - (Wd * 2 + 2) : len;      // (leave the corner to its pad)
      while (t + L <= stop) {
        const h = prof[idx++ % prof.length], c0 = t, c1 = t + L;
        let x0, z0, x1, z1;
        if (alongX) { x0 = ax + sgn * c0; x1 = ax + sgn * c1; if (x0 > x1) [x0, x1] = [x1, x0]; z0 = az - Wd / 2; z1 = az + Wd / 2; }
        else { z0 = az + sgn * c0; z1 = az + sgn * c1; if (z0 > z1) [z0, z1] = [z1, z0]; x0 = ax - Wd / 2; x1 = ax + Wd / 2; }
        if (!free(x0, z0, x1, z1)) { t += 2; continue; }
        const ty = stack(x0, z0, x1, z1, h, alongX ? 'x' : 'z') + 0.02;
        // the two long top edges: grinds
        for (const e of [-1, 1]) {
          const pts = alongX ? [[x0 + 0.25, ty, az + e * (Wd / 2 - 0.12)], [x1 - 0.25, ty, az + e * (Wd / 2 - 0.12)]] : [[ax + e * (Wd / 2 - 0.12), ty, z0 + 0.25], [ax + e * (Wd / 2 - 0.12), ty, z1 - 0.25]];
          K.rail(pts, { hidden: true, voice: 'pipe' });
        }
        lastTop = ty;
        t = c1 + (r() < 0.2 ? 0.05 : 1.6 + r() * 1.6);      // mostly short gaps, now and then flush
      }
      // a pad at the turn: two containers side by side, across the corner
      if (i < P.length - 2) {
        const h = prof[idx % prof.length], [cx, cz] = P[i + 1];
        const ok = alongX ? free(cx - Wd - 0.1, cz - L / 2, cx + Wd + 0.1, cz + L / 2) : free(cx - L / 2, cz - Wd - 0.1, cx + L / 2, cz + Wd + 0.1);
        if (ok) {
          if (alongX) { for (const o of [-Wd / 2 - 0.02, Wd / 2 + 0.02]) stack(cx + o - Wd / 2, cz - L / 2, cx + o + Wd / 2, cz + L / 2, h, 'z'); }
          else { for (const o of [-Wd / 2 - 0.02, Wd / 2 + 0.02]) stack(cx - L / 2, cz + o - Wd / 2, cx + L / 2, cz + o + Wd / 2, h, 'x'); }
        }
      }
    }
    void rails; void lastTop;
  };
  // the ramp up onto a trail's first stack
  const ramp = (x0, z0, x1, z1, axis, yLow, yHigh, up) => K.ramp(x0, z0, x1, z1, axis, up ? yLow : yHigh, up ? yHigh : yLow, '#b8b2a6', false, yLow);
  // east trail: down the east side, then west along the quay
  const E = [[616, 286], [616, 446], [556, 446]];
  { const y = terrainAt(616, 280); ramp(616 - Wd / 2, 272, 616 + Wd / 2, 286, 'z', y, y + Hc, true); }
  trail(E, [1, 2, 2, 3, 2, 3, 4, 3, 2, 3, 2, 1]);
  // west trail: a snake across the yard north of the road
  const Wt = [[300, 282], [446, 282], [446, 314], [306, 314], [306, 346], [404, 346]];
  { const y = terrainAt(290, 282); ramp(286, 282 - Wd / 2, 300, 282 + Wd / 2, 'x', y, y + Hc, true); }
  trail(Wt, [1, 2, 3, 2, 3, 4, 4, 3, 2, 1, 2, 3, 2]);
  // the gantry crane over the east trail: legs either side, the beam a long grind high above
  { const gx0 = 600, gx1 = 632, gz = 380, top = terrainAt(616, gz) + 15;
    for (const x of [gx0, gx1]) for (const dz of [-3, 3]) K.box(x - 0.6, terrainAt(x, gz + dz), gz + dz - 0.6, x + 0.6, top, gz + dz + 0.6, '#e8b84a', 'plain', { outlineT: 0.06 });
    K.box(gx0 - 1.5, top, gz - 3.6, gx1 + 1.5, top + 1.4, gz + 3.6, '#e8b84a', 'plain', { outlineT: 0.08 });
    K.rail([[gx0 - 1.2, top + 1.45, gz - 3.3], [gx1 + 1.2, top + 1.45, gz - 3.3]], { hidden: true, voice: 'pipe' });
    K.rail([[gx0 - 1.2, top + 1.45, gz + 3.3], [gx1 + 1.2, top + 1.45, gz + 3.3]], { hidden: true, voice: 'pipe' });
    K.box(613, top - 3, gz - 2, 619, top, gz + 2, '#3a3550', 'plain', { outlineT: 0.05 });      // the trolley
    F.box(gx0 - 1.5, top, gz - 3.6, gx1 + 1.5, top + 1.4, gz + 3.6, '#e8b84a', 0.2); }
  // sawtooth warehouses: brick sheds whose roofs are rows of slopes and drops (ride across: up, off, up, off)
  const shed = (x0, z0, x1, z1, tooth) => {
    if (!free(x0, z0, x1, z1, 2)) return;
    const y = Math.min(terrainAt(x0, z0), terrainAt(x1, z1), terrainAt(x0, z1), terrainAt(x1, z0)), top = y + 6.5, th = 2.6;
    K.box(x0, y - 0.4, z0, x1, top, z1, pick(r, ['#9a5a44', '#8a6a52', '#a8644a']), 'brick', { outlineT: 0.1 });
    for (let x = x0; x < x1 - 0.5; x += tooth) {
      const xe = Math.min(x1, x + tooth);
      K.ramp(x, z0, xe - 0.4, z1, 'x', top, top + th, '#c9c4b8', false, top);
      B.box(xe - 0.4, top, z0 + 0.4, xe, top + th, z1 - 0.4, '#7fa8c0', 'plain', { outlineT: 0.04, edges: false });      // the north-light glazing
      W.boxes.push({ x0: xe - 0.4, y0: top, z0, x1: xe, y1: top + th, z1, tag: 'shed' });
      K.rail([[xe - 0.2, top + th + 0.02, z0 + 0.3], [xe - 0.2, top + th + 0.02, z1 - 0.3]], { hidden: true, voice: 'pipe' });     // each crest a grind
    }
    // big doors on the long sides, a loading ramp at one end (the way up)
    for (const z of [z0 - 0.06, z1 - 0.04]) for (let x = x0 + 6; x < x1 - 8; x += 14) B.box(x, y, z, x + 5, y + 4.6, z + 0.1, '#3a4452', 'plain', { outlineT: 0.02, edges: false });
    K.ramp(x0 - 12, z0 + 2, x0, z0 + 8, 'x', terrainAt(x0 - 12, z0 + 5), top, '#b8b2a6', false, terrainAt(x0 - 12, z0 + 5));
    F.box(x0, y, z0, x1, top + th, z1, '#9a5a44', 0.2);
    placed.push([x0 - 12, z0, x1, z1]); H.reserve([x0 - 12, z0, x1, z1]);
  };
  shed(530, 352, 590, 382, 7.5);
  shed(306, 366, 366, 394, 7.5);
  shed(540, 396, 596, 428, 7);
  // loose containers about the yard: singles and pairs, lying either way, now and then one on top of another
  for (let i = 0, n = 0; i < 300 && n < 22; i++) {
    const along = r() < 0.5, x = U.lerp(290, 632, r()), z = U.lerp(272, PLAN.docksQuayZ - 12, r());
    const w = along ? L : Wd, d = along ? Wd : L, x0 = x - w / 2, z0 = z - d / 2, x1 = x + w / 2, z1 = z + d / 2;
    if (!free(x0, z0, x1, z1, 3)) continue;
    const h = r() < 0.7 ? 1 : 2;
    const ty = stack(x0, z0, x1, z1, h, along ? 'x' : 'z');
    if (r() < 0.25) { const off = (r() - 0.5) * 3; if (along) stack(x0 + off + 1, z0, x1 + off - 1, z1, 0, 'x'); }
    void ty; n++;
  }
  // bollards and pallets about the yard
  for (let i = 0; i < 26; i++) { const x = U.lerp(300, 630, r()), z = U.lerp(280, 470, r()); if (!H.clearOf(x - 1, z - 1, x + 1, z + 1, 0.5)) continue; const y = terrainAt(x, z); K.box(x - 0.6, y, z - 0.6, x + 0.6, y + 0.15 + 0.15 * Math.floor(r() * 4), z + 0.6, '#a27a4a', 'wood', { outlineT: 0.03 }); }
}
