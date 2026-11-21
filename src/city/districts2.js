// ============================================================
//  DISTRICTS (2) — old town, market, canals, docks, lakeshore
// ============================================================
// terrain edits that must happen before the ground is drawn
const CELLAR = [878, 166, 902, 190];          // grid-aligned: the sunken record shop in the market
const SKATE = [-620, 200, -470, 312];      // the skatepark in the strip south of the park: levelled
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
    for (let k = 0; k < R.length; k++) { const d = pathDist(C.path, R[k][0], R[k][1], 40); const inside = d.d < C.half + 3; if (inside && !prev) crossings.push({ key, s: d.s, width: rd.width }); prev = inside; }
  }
  const bridgeAt = (s, width, rise, o) => { const a = off(s, -(C.half + 5)), b = off(s, C.half + 5); bridge(H.K, S, F, a[0], a[1], b[0], b[1], width, rise, o); H.line([off(s, -(C.half + 22)), off(s, C.half + 22)], width / 2 + 2); };
  for (const c of crossings) bridgeAt(c.s, c.width + 4, c.key === 'main' ? 2.8 : 1.6, c.key === 'main' ? { color: '#a89a82', wall: '#8a7a64' } : {});
  // footbridges between them, about every 160 m
  const taken = crossings.map(c => c.s);
  for (let s = 90; s < C.path.len - 60; s += 150 + r() * 40) if (!taken.some(t => Math.abs(t - s) < 70)) { bridgeAt(s, 7, 1.6); taken.push(s); }
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
  // container yard: tidy rows of stacks with lanes between (jump from stack to stack)
  const ccols = ['#c4523a', '#2f5f8a', '#e8b84a', '#3e8f86', '#8a5a9e', '#d97a3a', '#f2efe6', '#4a7a3a'];
  for (let x = 620; x < 1010; x += 19) for (let z = 650; z < QZ - 40; z += 3.1) {
    if (r() < 0.22) { z += 6; continue; }
    const h = 1 + Math.floor(r() * r() * 4), w = 12.2, d = 2.5;
    if (!H.clearOf(x - w / 2, z, x + w / 2, z + d, 0.6)) continue;
    const y = terrainAt(x, z + 1.25);
    for (let k = 0; k < h; k++) {
      const c = pick(r, ccols);
      K.box(x - w / 2, y + k * 2.6 - (k ? 0 : 0.3), z, x + w / 2, y + (k + 1) * 2.6, z + d, c, 'plain', { outlineT: 0.05, edges: k === h - 1 });
      if (k === h - 1) F.box(x - w / 2, y - 0.3, z, x + w / 2, y + (k + 1) * 2.6, z + d, c, 0.2);
    }
    if (r() < 0.25) H.sound(x, y + h * 2.6, z + 1.25, 5, 'container');
    // the top edges of every stack are grinds: hop from corner to corner up and down the rows
    const ty = y + h * 2.6 + 0.02;
    K.rail([[x - w / 2 + 0.25, ty, z + 0.12], [x + w / 2 - 0.25, ty, z + 0.12]], { hidden: true, voice: 'pipe' });
    K.rail([[x - w / 2 + 0.25, ty, z + d - 0.12], [x + w / 2 - 0.25, ty, z + d - 0.12]], { hidden: true, voice: 'pipe' });
    H.reserve([x - w / 2, z, x + w / 2, z + d]);
  }
  // staircases of containers at the front of the yard: 1, 2, 3 high, so you can climb by jumping
  for (const [cx, cz] of [[640, 618], [780, 618], [920, 618]]) {
    for (let k = 0; k < 3; k++) {
      const x0 = cx + k * 4.2, y0 = terrainAt(x0, cz), c = pick(r, ccols);
      K.box(x0 - 1.25, y0 - 0.3, cz - 6, x0 + 1.25, y0 + (k + 1) * 2.6, cz + 6, c, 'plain', { outlineT: 0.05 });
      for (const ex of [x0 - 1.13, x0 + 1.13]) K.rail([[ex, y0 + (k + 1) * 2.6 + 0.02, cz - 5.75], [ex, y0 + (k + 1) * 2.6 + 0.02, cz + 5.75]], { hidden: true, voice: 'pipe' });
    }
    H.reserve([cx - 2, cz - 7, cx + 11, cz + 7]);
  }
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
