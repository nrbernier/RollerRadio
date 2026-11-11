// ============================================================
//  RELIEF — the land's bigger gestures, shaped before anything is built:
//  the sunken street through downtown (crossed by three bridges), the
//  forest crag, and the level pads for the building site, the tower and
//  the old town's little squares. Also the one bridge builder they share.
// ============================================================
// the sunken street: a cutting twelve metres deep where a downtown street used to climb the hill.
// The floor is five terrain vertices wide (so its walls can stand exactly on grid lines).
const VALLEY = { x: -114, floorHalf: 16, rimHalf: 24, z0: -735, z1: -625, z2: -400, z3: -246, depth: 12, bridges: [-618, -492, -366] };
const VALLEY_RAMP = [-560, -499];          // the ramp back up, against the east wall (the coping opens where it lands)
function valleyK(z) {
  const V = VALLEY; if (z <= V.z0 || z >= V.z3) return 0;
  if (z < V.z1) return U.smooth((z - V.z0) / (V.z1 - V.z0));
  if (z <= V.z2) return 1;
  return 1 - U.smooth((z - V.z2) / (V.z3 - V.z2));
}
// the crag: a tilted slab of rock in the forest. A ridge climbs gently from the north along a curved
// spine and ends in a prow well above the tree line, with cliffs on every other side.
const CRAG = { spine: [[-800, -830], [-845, -770], [-855, -705], [-820, -650], [-790, -610]], rise: 46, w0: 12, w1: 20 };
{ let L = 0; CRAG.acc = [0]; for (let i = 1; i < CRAG.spine.length; i++) { L += Math.hypot(CRAG.spine[i][0] - CRAG.spine[i - 1][0], CRAG.spine[i][1] - CRAG.spine[i - 1][1]); CRAG.acc.push(L); } CRAG.len = L; }
// nearest point on the spine: [distance, fraction along it]
function cragNear(x, z, out = [0, 0]) {
  const S = CRAG.spine; let bd = 1e9, bt = 0;
  for (let i = 0; i < S.length - 1; i++) {
    const ax = S[i][0], az = S[i][1], dx = S[i + 1][0] - ax, dz = S[i + 1][1] - az, L2 = dx * dx + dz * dz;
    const u = U.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), d = Math.hypot(x - ax - dx * u, z - az - dz * u);
    if (d < bd) { bd = d; bt = (CRAG.acc[i] + u * Math.sqrt(L2)) / CRAG.len; }
  }
  out[0] = bd; out[1] = bt; return out;
}
function cragAt(t, out = [0, 0]) {
  const S = CRAG.spine, s = U.clamp(t, 0, 1) * CRAG.len; let i = 0; while (i < S.length - 2 && CRAG.acc[i + 1] < s) i++;
  const u = (s - CRAG.acc[i]) / (CRAG.acc[i + 1] - CRAG.acc[i]);
  out[0] = U.lerp(S[i][0], S[i + 1][0], u); out[1] = U.lerp(S[i][1], S[i + 1][1], u); return out;
}
const _cn = [0, 0];
// how much of the crag's full height stands at (x, z): 1 on the ridge top, falling off down the cliffs
function cragShape(x, z, nat) {
  if (x < -960 || x > -700 || z < -900 || z > -540) return null;
  const [d, t] = cragNear(x, z, _cn), top = U.lerp(CRAG.y0, CRAG.y1, t);
  if (top <= nat) return null;
  const w = U.lerp(CRAG.w0, CRAG.w1, t), fall = 6 + 0.3 * (top - nat);
  if (d >= w + fall) return null;
  const p = d <= w ? 1 : 1 - U.smooth((d - w) / fall);
  // the cliffs are rough, the top is smooth enough to skate
  const rough = (Math.sin(x * 0.31 + z * 0.17) + Math.sin(z * 0.43 - x * 0.11)) * 1.3 * p * (1 - p) * 4;
  return { p, y: nat + (top - nat) * p + rough, top, t };
}
// level pads
const SITE = [-227, -101, -129, -1];                 // the building site: one downtown block
const TOWER = { x: 70, z: -429, block: [21, -479, 119, -379] };
const OLD_PADS = [                                   // the old town's open places: [x, z, half-size, kind]
  [770, -1010, 20, 'church'], [822, -1150, 16, 'play'], [900, -545, 15, 'well'], [948, -770, 17, 'court'],
  [566, -730, 15, 'garden'], [985, -1170, 15, 'boules'], [585, -1010, 16, 'fountain'], [870, -1320, 15, 'play'], [545, -1270, 15, 'garden'],
];
const placeRects = () => [SITE, TOWER.block];
const inPlace = (x0, z0, x1, z1) => placeRects().some(r => x1 > r[0] && x0 < r[2] && z1 > r[1] && z0 < r[3]);

function prepRelief() {
  const { nx, nz, x0, z0, cell, H } = TER, W1 = nx + 1, V = VALLEY;
  const each = (r, fn) => { for (let j = Math.max(0, Math.floor((r[1] - z0) / cell)); j <= Math.min(nz, Math.ceil((r[3] - z0) / cell)); j++) for (let i = Math.max(0, Math.floor((r[0] - x0) / cell)); i <= Math.min(nx, Math.ceil((r[2] - x0) / cell)); i++) fn(x0 + i * cell, z0 + j * cell, j * W1 + i); };
  // the sunken street
  each([V.x - V.floorHalf, V.z0, V.x + V.floorHalf, V.z3], (x, z, idx) => {
    if (Math.abs(x - V.x) > V.floorHalf + 0.1) return;
    const k = valleyK(z); if (k <= 0) return;
    H[idx] = U.lerp(H[idx], cityHeight(V.x, z), U.smooth(Math.min(1, k * 3))) - V.depth * k;
  });
  // the crag
  CRAG.y0 = cityHeight(CRAG.spine[0][0], CRAG.spine[0][1]);
  const sm = CRAG.spine[CRAG.spine.length - 1]; CRAG.y1 = cityHeight(sm[0], sm[1]) + CRAG.rise;
  each([-960, -900, -700, -540], (x, z, idx) => { const c = cragShape(x, z, H[idx]); if (c) H[idx] = c.y; });
  // the building site and the tower's foot: levelled
  const mean = (r) => (cityHeight(r[0], r[1]) + cityHeight(r[2], r[1]) + cityHeight(r[0], r[3]) + cityHeight(r[2], r[3])) / 4;
  SITE.y = mean(SITE); flattenRect([SITE[0] + 8, SITE[1] + 8, SITE[2] - 8, SITE[3] - 8], SITE.y, 10, 'set');
  TOWER.y = cityHeight(TOWER.x, TOWER.z + 24); flattenRect([TOWER.x - 24, TOWER.z - 24, TOWER.x + 24, TOWER.z + 26], TOWER.y, 14, 'set');
  // the old town's squares and playgrounds sit on little terraces
  for (const p of OLD_PADS) { p.y = cityHeight(p[0], p[1]); flattenRect([p[0] - p[2], p[1] - p[2], p[0] + p[2], p[1] + p[2]], p.y, 12, 'set'); }
}
// ground colours for the new places (rock, bare earth)
const _rc = new THREE.Color();
function reliefPaint(x, z, y, steep, out) {
  const c = cragShape(x, z, -1e9);
  if (c && y > cityHeight(x, z) + 0.6) {
    const n = Math.sin(x * 0.21) * Math.sin(z * 0.19) + Math.sin(x * 0.07 + z * 0.05) * 0.6;
    out.lerp(_rc.set(steep > 0.5 ? '#7d776c' : n > 0.5 ? '#7f9058' : n < -0.6 ? '#a59f92' : '#928c80'), 0.92);
  }
  const s = rectDist(SITE, x, z);
  if (s < 2) out.lerp(_rc.set(Math.sin(x * 0.4) * Math.sin(z * 0.37) > 0.3 ? '#a98f68' : '#b89c74'), U.clamp((2 - s) / 8, 0, 0.9));
}

// people and animals walk over bridges, not through the air under them
const DECKS = [];
function walkY(x, z) {
  for (const d of DECKS) if (x > d.x0 && x < d.x1 && z > d.z0 && z < d.z1) { const t = d.ax ? (x - d.x0) / (d.x1 - d.x0) : (z - d.z0) / (d.z1 - d.z0); return U.lerp(d.ya, d.yb, t); }
  return terrainAt(x, z);
}

// a street bridge, straight, from one bank to the other (axis-aligned). Carries the street's
// sidewalks and asphalt, parapets you can grind, lamps; piers stand `piers` metres in from each end.
function deckBridge(H, ax, az, bx, bz, width, o = {}) {
  const { K, W, B, S, F } = H, alongX = Math.abs(bx - ax) > Math.abs(bz - az);
  const ya = o.ya ?? terrainAt(ax, az) + 0.06, yb = o.yb ?? terrainAt(bx, bz) + 0.06, L = alongX ? bx - ax : bz - az, hw = width / 2, pitch = Math.atan2(yb - ya, L);
  const mx = (ax + bx) / 2, mz = (az + bz) / 2, my = (ya + yb) / 2, SL = Math.hypot(L, yb - ya), road = o.road ?? width - 10;
  S.add(ax, ya, az, bx, yb, bz, hw);
  const M = (dy, lat) => { const m = alongX ? new THREE.Matrix4().makeRotationZ(pitch) : new THREE.Matrix4().makeRotationX(-pitch); return m.setPosition(mx + (alongX ? 0 : lat), my + dy, mz + (alongX ? lat : 0)); };
  const slabG = (w, t, len = SL) => alongX ? new THREE.BoxGeometry(len, t, w) : new THREE.BoxGeometry(w, t, len);
  B.add(slabG(width, 1.0), M(-0.56, 0), o.color || '#b9b2a4', 'paving', { outlineT: 0.08 });
  B.add(slabG(road, 0.1), M(-0.03, 0), '#55535f', 'road', { outlineT: 0, edges: false });
  for (const sd of [-1, 1]) B.add(slabG((width - road) / 2 - 0.5, 0.14), M(-0.01, sd * (road / 2 + (width - road) / 4 + 0.25)), '#cfc8bb', 'walk', { outlineT: 0, edges: false });
  for (let s = 3; s < SL - 4; s += 8) { const t = s / SL - 0.5; B.add(slabG(0.25, 0.02, 3), new THREE.Matrix4().copy(M(0.03, 0)).setPosition(mx + (alongX ? L * t : 0), my + (yb - ya) * t + 0.035, mz + (alongX ? 0 : L * t)), '#f2ead0', 'paint', { outlineT: 0, edges: false }); }
  // the deck is solid from below too (you can't jump up through it)
  for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, y = Math.min(U.lerp(ya, yb, t0), U.lerp(ya, yb, t1)); W.boxes.push(alongX ? { x0: U.lerp(ax, bx, t0), y0: y - 1.1, z0: az - hw, x1: U.lerp(ax, bx, t1), y1: y - 0.05, z1: az + hw, tag: 'retain', nocam: true } : { x0: ax - hw, y0: y - 1.1, z0: U.lerp(az, bz, t0), x1: ax + hw, y1: y - 0.05, z1: U.lerp(az, bz, t1), tag: 'retain', nocam: true }); }
  // parapets: a low wall with a rail on top
  for (const sd of [-1, 1]) {
    const lat = sd * (hw - 0.3);
    B.add(slabG(0.5, 0.7), M(0.3, lat), o.wall || '#a39b8c', 'paving', { outlineT: 0.05 });
    const P = (t, dy) => alongX ? [U.lerp(ax, bx, t), U.lerp(ya, yb, t) + dy, az + lat] : [ax + lat, U.lerp(ya, yb, t) + dy, U.lerp(az, bz, t)];
    K.rail([P(0, 1.05), P(1, 1.05)], { color: o.rail || '#e9e4f5', postColor: '#6a6458', postMax: 0.6, round: 0, radius: 0.07 });
    for (let k = 0; k < 6; k++) { const a = P(k / 6, 0), b = P((k + 1) / 6, 0); W.boxes.push({ x0: Math.min(a[0], b[0]) - (alongX ? 0 : 0.25), y0: Math.min(a[1], b[1]) - 0.5, z0: Math.min(a[2], b[2]) - (alongX ? 0.25 : 0), x1: Math.max(a[0], b[0]) + (alongX ? 0 : 0.25), y1: Math.min(a[1], b[1]) + 0.62, z1: Math.max(a[2], b[2]) + (alongX ? 0.25 : 0), tag: 'retain', nocam: true }); }
    if (o.lamps !== false) for (const t of [0.25, 0.75]) { const p = P(t, 0); H.lamp(p[0] - (alongX ? 0 : sd * 0.9), p[2] - (alongX ? sd * 0.9 : 0), { y: p[1], h: 4.2, sound: 'lamp' }); }
  }
  // piers down to whatever is below
  for (const t of (o.piers || [])) {
    const px = U.lerp(ax, bx, t), pz = U.lerp(az, bz, t), py = U.lerp(ya, yb, t) - 1.0, gy = terrainAt(px, pz) - 1;
    if (py - gy < 1.5) continue;
    const x0 = alongX ? px - 1.1 : px - hw + 0.6, x1 = alongX ? px + 1.1 : px + hw - 0.6, z0 = alongX ? pz - hw + 0.6 : pz - 1.1, z1 = alongX ? pz + hw - 0.6 : pz + 1.1;
    K.box(x0, gy, z0, x1, py, z1, o.pier || '#a39b8c', 'paving', { outlineT: 0.08, tag: 'retain' });
    B.box(x0 - 0.3, py - 0.7, z0 - 0.3, x1 + 0.3, py, z1 + 0.3, '#c9c2b4', 'plain', { outlineT: 0.04, edges: false });
  }
  F.add(slabG(width - 0.8, 1.2), M(-0.9, 0), o.color || '#b9b2a4');
  DECKS.push(alongX ? { ax: true, x0: ax, x1: bx, z0: az - hw, z1: az + hw, ya, yb } : { ax: false, x0: ax - hw, x1: ax + hw, z0: az, z1: bz, ya, yb });
  return { ya, yb };
}

// ---------- the sunken street: walls, the walks along its rims, three bridges, ways down ----------
function buildValley(H) {
  const { K, W, B, S, F } = H, V = VALLEY, stone = '#9c9384', cope = '#c9c2b4';
  for (const sd of [-1, 1]) {
    const xe = V.x + sd * V.floorHalf, xr = V.x + sd * V.rimHalf, xa = Math.min(xe, xr), xb = Math.max(xe, xr);
    let rail = [];
    const flush = () => { if (rail.length > 1) K.rail(rail, { color: '#e9e4f5', postColor: '#6a6458', postMax: 0.7, round: 0, radius: 0.07 }); rail = []; };
    for (let z = V.z0; z < V.z3 - 1; z += 8) {
      const z1 = z + 8, f0 = terrainAt(V.x, z), f1 = terrainAt(V.x, z1), r0 = terrainAt(xr, z), r1 = terrainAt(xr, z1);
      const d = Math.min(r0 - f0, r1 - f1);
      if (Math.max(r0 - f0, r1 - f1) < 0.4) { flush(); continue; }
      // the walk along the rim: a slab from the wall's top back to the ground behind it
      S.add((xe + xr) / 2, r0 + 0.02, z, (xe + xr) / 2, r1 + 0.02, z1, 4);
      const pitch = Math.atan2(r1 - r0, 8), SL = Math.hypot(8, r1 - r0), ym = (r0 + r1) / 2;
      B.add(new THREE.BoxGeometry(8, 0.4, SL + 0.05), new THREE.Matrix4().makeRotationX(-pitch).setPosition((xe + xr) / 2, ym - 0.18, z + 4), '#cfc8bb', 'walk', { outlineT: 0, edges: false });
      // the wall itself, and its coping
      const top = Math.min(r0, r1);
      B.box(xe - (sd > 0 ? 0 : 0.7), Math.min(f0, f1) - 1, z, xe + (sd > 0 ? 0.7 : 0), top + 0.1, z1, stone, 'brick', { outlineT: 0, edges: false });
      // (solid all the way back to the rim, so nothing ends up inside the bank)
      W.boxes.push({ x0: xa, y0: Math.min(f0, f1) - 1, z0: z, x1: xb, y1: top - 0.25, z1, tag: 'retain' });
      const atBridge = V.bridges.some(bz => z1 > bz - 11.5 && z < bz + 11.5) || (sd > 0 && z <= VALLEY_RAMP[1] && z1 > VALLEY_RAMP[1]);
      if (!atBridge) {
        B.add(new THREE.BoxGeometry(1.0, 0.9, SL + 0.05), new THREE.Matrix4().makeRotationX(-pitch).setPosition(xe + sd * 0.35, ym + 0.42, z + 4), cope, 'paving', { outlineT: 0.05, edges: false });
        W.boxes.push({ x0: xe + (sd > 0 ? 0 : -0.7), y0: top - 0.5, z0: z, x1: xe + (sd > 0 ? 0.7 : 0), y1: top + 0.85, z1, tag: 'retain', nocam: true });
      }
      if (atBridge) flush(); else { if (!rail.length) rail.push([xe + sd * 0.35, r0 + 0.95, z]); rail.push([xe + sd * 0.35, r1 + 0.95, z1]); }
      // blind arches in the wall where it is tall enough: dark recesses, a lamp over every other one
      if (d > 7 && !atBridge && (Math.round(z / 8) % 2 === 0)) {
        const fy = Math.max(f0, f1);
        B.box(xe - sd * 0.06 - 0.05, fy, z + 1.6, xe - sd * 0.06 + 0.05, fy + 4.2, z1 - 1.6, '#3a3640', 'plain', { outlineT: 0, edges: false });
        B.box(xe - sd * 0.1 - 0.1, fy + 4.2, z + 1.2, xe - sd * 0.1 + 0.1, fy + 4.7, z1 - 1.2, cope, 'plain', { outlineT: 0.03, edges: false });
        if (Math.round(z / 8) % 4 === 0) { B.box(xe - sd * 0.5 - 0.2, fy + 5.0, z + 3.8, xe - sd * 0.5 + 0.2, fy + 5.4, z + 4.2, '#ffe2a6', 'lamp', { outlineT: 0.02, edges: false }); H.pool(xe - sd * 2.5, z + 4, 6, '#ffc870'); W.lamps.push([xe - sd * 0.5, fy + 5.2, z + 4]); }
        else { const c = pick(U.rng((z * 7 + sd * 3) | 0), ['#e4572e', '#2f8f9d', '#f2c14e', '#3e8f86', '#d9779a']); B.box(xe - sd * 1.3 - 1.2, fy + 3.3, z + 1.4, xe - sd * 1.3 + 1.2, fy + 3.45, z1 - 1.4, c, 'plain', { outlineT: 0.03, edges: false }); W.boxes.push({ x0: xe - sd * 1.3 - 1.2, y0: fy + 3.25, z0: z + 1.4, x1: xe - sd * 1.3 + 1.2, y1: fy + 3.45, z1: z1 - 1.4, tag: 'bounce', nocam: true }); }
      }
    }
    flush();
  }
  // the bridges: each cross street strides over on two piers
  for (const bz of V.bridges) {
    deckBridge(H, V.x - V.rimHalf, bz, V.x + V.rimHalf, bz, 22, { piers: [0.2, 0.8] });
    // from each bridge a long steel rail slides down to the street below (south, downhill)
    for (const sd of [-1, 1]) {
      const x = V.x + sd * (V.floorHalf - 2.2), top = terrainAt(V.x + sd * V.rimHalf, bz + 12) + 1.0, pts = [[V.x + sd * (V.floorHalf + 0.35), top, bz + 12], [x, top - 0.6, bz + 17]];
      for (let z = bz + 30; z <= bz + 66; z += 12) { const t = (z - bz - 17) / 49; pts.push([x, U.lerp(top - 0.6, terrainAt(x, z) + 0.9, U.smooth(Math.min(1, t * 1.05))), z]); }
      if (bz + 66 < V.z3 - 20) H.wave(pts, '#8e95a2', { radius: 0.13, round: 4, stubs: false, endBoost: 1 });
    }
  }
  // and a zig-zag ramp against the east wall, for coming back up
  { const sd = 1, x = V.x + sd * (V.floorHalf - 2.2), za = VALLEY_RAMP[0], zb = VALLEY_RAMP[1], ya = terrainAt(x, za) + 0.05, yb = terrainAt(V.x + sd * V.rimHalf, zb);
    S.add(x, ya, za, x, yb, zb, 2.2);
    B.add(new THREE.BoxGeometry(4.4, 0.5, Math.hypot(zb - za, yb - ya)), new THREE.Matrix4().makeRotationX(-Math.atan2(yb - ya, zb - za)).setPosition(x, (ya + yb) / 2 - 0.26, (za + zb) / 2), '#b9b2a4', 'paving', { outlineT: 0.06, edges: false });
    for (let z = za + 6; z < zb; z += 9) { const y = U.lerp(ya, yb, (z - za) / (zb - za)); if (y - terrainAt(x, z) > 1.2) K.box(x - 2.0, terrainAt(x, z) - 0.5, z - 0.5, x + 2.0, y - 0.5, z + 0.5, '#a39b8c', 'paving', { outlineT: 0.05, tag: 'retain' }); }
    K.rail([[x - 2.1, ya + 1.0, za], [x - 2.1, yb + 1.0, zb]], { color: '#e9e4f5', postMax: 1.2, round: 0 });
  }
  H.sign('LOWER STREET', V.x, terrainAt(V.x, V.z0 + 30) + 6.2, V.z0 + 30, 0, 9, 1.4, '#1f2a44', '#f2ead8');
  for (const sx of [-1, 1]) K.cyl(V.x + sx * 5.5, terrainAt(V.x + sx * 5.5, V.z0 + 30), V.z0 + 30, 0.14, 7, '#2a2838', { outline: 0.03, seg: 6 });
  B.box(V.x - 5.6, terrainAt(V.x, V.z0 + 30) + 6.95, V.z0 + 29.9, V.x + 5.6, terrainAt(V.x, V.z0 + 30) + 7.1, V.z0 + 30.1, '#2a2838', 'plain', { outlineT: 0, edges: false });
}
