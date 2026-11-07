// ============================================================
//  DISTRICTS (2) — old town, market, canals, docks, lakeshore
// ============================================================
// terrain edits that must happen before the ground is drawn
const CELLAR = [878, 166, 902, 190];          // grid-aligned: the sunken record shop in the market
const SKATE = [-620, 200, -470, 312];      // the skatepark in the strip south of the park: levelled
function prepDistricts() {
  TER.holes.push(CELLAR);
  PLAN.skateY = (cityHeight(SKATE[0], SKATE[1]) + cityHeight(SKATE[2], SKATE[3]) + cityHeight(SKATE[0], SKATE[3]) + cityHeight(SKATE[2], SKATE[1])) / 4;
  flattenRect(SKATE, PLAN.skateY, 18, 'set');
  // cut the observatory terrace into the hillside so it sits level
  const tx = 96, tz = -1180, ty = cityHeight(tx, tz) + 0.3;
  flattenRect([tx - 31, tz - 19, tx + 31, tz + 7], ty - 0.5, 14, 'min');
}

// ============================================================
//  OLD TOWN — steep lanes, pastel houses with skateable roofs,
//  washing lines, a square with a bell tower (hidden spot)
// ============================================================
function buildOldTown(H) {
  const { K, W, B, F, S } = H, r = U.rng(404);
  const lanes = [
    [[560, -380], [600, -470], [660, -560], [700, -640], [640, -720], [720, -800], [800, -880], [760, -980], [840, -1080], [800, -1180], [880, -1280], [860, -1400]],
    [[470, -600], [560, -620], [660, -560], [780, -540], [900, -520], [1010, -560]],
    [[480, -1010], [600, -1040], [760, -980], [920, -1000], [1020, -940]],
    [[700, -640], [820, -700], [960, -740], [1020, -820]],
    [[800, -1180], [680, -1240], [560, -1300], [470, -1260]],
    [[880, -1280], [980, -1200], [1020, -1100]],
    [[640, -720], [560, -760], [480, -800]],
    [[840, -1080], [960, -1100], [1010, -1160]],
  ];
  const sq = [660, -570];
  // the square
  const sqR = [sq[0] - 26, sq[1] - 24, sq[0] + 26, sq[1] + 24];
  H.patch(sqR, '#c9b79a', 'walk', 0.07); H.reserve(sqR);
  for (const L of lanes) { H.path(L, 7, '#b8a88c', 'walk'); H.line(L, 3.5); }
  W.oldLanes = lanes;
  // the bell tower in the square's corner
  const tx = sq[0] + 14, tz = sq[1] - 12, ty = terrainAt(tx, tz);
  K.box(tx - 3.5, ty - 1, tz - 3.5, tx + 3.5, ty + 18, tz + 3.5, '#e8dcc4', 'brick', { outlineT: 0.12 });
  for (const [cx, cz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) K.box(tx + cx - 0.5, ty + 18, tz + cz - 0.5, tx + cx + 0.5, ty + 23, tz + cz + 0.5, '#e8dcc4', 'brick', { outlineT: 0.06 });
  B.box(tx - 3.8, ty + 23, tz - 3.8, tx + 3.8, ty + 23.8, tz + 3.8, '#c9b89a', 'plain', { outlineT: 0.06 });
  B.add(new THREE.ConeGeometry(5.6, 7, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(tx, ty + 27.3, tz), '#7a5a4a', 'roof', { outlineT: 0.1 });
  K.sphere(tx, ty + 20.4, tz, 1.4, '#b88a3a', { outline: 0.06, seg: 12, sy: 1.1 });
  F.box(tx - 3.5, ty - 1, tz - 3.5, tx + 3.5, ty + 23, tz + 3.5, '#e8dcc4'); F.add(new THREE.ConeGeometry(5.2, 7, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(tx, ty + 27, tz), '#7a5a4a');
  W.bell = { x: tx, y: ty, z: tz };
  H.spot('belltower', tx, tz + 6, 30);
  // the square: a little fountain, café tables, pigeons
  const fx = sq[0] - 8, fz = sq[1] + 6, fy = terrainAt(fx, fz);
  K.cyl(fx, fy - 0.2, fz, 3, 0.7, '#b8a88c', { outline: 0.06, seg: 16 }); K.cyl(fx, fy, fz, 0.5, 1.8, '#b8a88c', { outline: 0.04, seg: 8 });
  W.boxes.push({ x0: fx - 2.6, y0: fy - 1, z0: fz - 2.6, x1: fx + 2.6, y1: fy + 0.5, z1: fz + 2.6 });
  (W.fountains = W.fountains || []).push({ x: fx, y: fy + 1.8, z: fz });
  H.sound(fx, fy, fz, 5, 'fountain');
  for (let i = 0; i < 6; i++) { const cx = sq[0] - 18 + (i % 3) * 7, cz = sq[1] - 14 + Math.floor(i / 3) * 7, cy = terrainAt(cx, cz); K.cyl(cx, cy, cz, 0.6, 0.75, '#efe8dc', { outline: 0.03, seg: 10 }); K.cyl(cx, cy, cz, 0.05, 2.3, '#3a3550', { outline: 0, seg: 4 }); B.add(new THREE.ConeGeometry(1.5, 0.6, 8), new THREE.Matrix4().makeTranslation(cx, cy + 2.5, cz), ['#c4523a', '#e8c84a', '#3e8f86'][i % 3], 'plain', { outlineT: 0.04, edges: false }); W.boxes.push({ x0: cx - 0.6, y0: cy, z0: cz - 0.6, x1: cx + 0.6, y1: cy + 0.75, z1: cz + 0.6 }); }
  (W.pigeonSpots = W.pigeonSpots || []).push([sq[0], sq[1] + 10, 10]);
  for (const [bx, bz] of [[sq[0] - 22, sq[1]], [sq[0] + 22, sq[1] + 6]]) H.bench(bx, bz, false, { view: true });
  H.busker('trumpet', sq[0] - 6, sq[1] - 16, 0);
  // houses along the lanes, sawtooth facades (they stay square to the compass)
  const pastel = ['#f2d7c0', '#e8c8a0', '#d9e0c8', '#c8d8e0', '#f0e0a0', '#e8b8a8', '#d0c0d8', '#f4ecd8', '#e0c8b8', '#c8dcd0'];
  const roofs = ['#b85a3a', '#a04a32', '#9a5a44', '#6a6a7a', '#b8643f'];
  const R = PLAN.byKey.oldtown.rect;
  for (const L of lanes) for (let i = 0; i < L.length - 1; i++) {
    const [ax, az] = L[i], [bx, bz] = L[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    for (let s = 6; s < len - 4; s += 8 + r() * 3) for (const side of [-1, 1]) {
      const w = 8 + r() * 4, d = 9 + r() * 5;
      const alongX = Math.abs(ux) > Math.abs(uz);
      const hx = alongX ? w / 2 : d / 2, hz = alongX ? d / 2 : w / 2;
      // push the (square-to-the-compass) house out until its nearest corner clears the lane
      const off = 4.6 + hx * Math.abs(uz) + hz * Math.abs(ux) + r() * 0.8;
      const cx = ax + ux * s - uz * off * side, cz = az + uz * s + ux * off * side;
      const x0 = cx - hx, z0 = cz - hz, x1 = cx + hx, z1 = cz + hz;
      if (rectDist(R, cx, cz) > -4 && rectDist(PLAN.byKey.obs.rect, cx, cz) > 0) { if (rectDist(R, cx, cz) > 30) continue; }
      if (!H.clearOf(x0, z0, x1, z1, 0.8)) continue;
      const hgt = 7 + r() * 6, bb = H.bldg(x0, z0, x1, z1, hgt, pick(r, pastel), { trim: '#6a5a4a', outline: 0.12, kind: 'house' });
      H.roof(x0, z0, x1, z1, bb.top, 2.6 + r() * 1.6, pick(r, roofs));
      H.reserve([x0, z0, x1, z1]);
      if (alongX) { const laneZ = az + uz * s, south = cz < laneZ; H.frontage(x0, x1, south ? z1 : z0, south ? -1 : 1, bb.hi, bb.top, r, { shop: 0.3, balcony: 0.3 }); }
    }
    // washing lines across the lane (grindable, with laundry)
    if (r() < 0.75) {
      const s = len * (0.3 + r() * 0.4), cx = ax + ux * s, cz = az + uz * s, y = terrainAt(cx, cz) + 6.2;
      K.rail([[cx - uz * 6, y, cz + ux * 6], [cx + uz * 6, y, cz - ux * 6]], { kind: 'cable', laundry: true, posts: false, sag: 0.5 });
    }
    // lamps
    for (let s = 14; s < len; s += 36) { const x = ax + ux * s + uz * 3.6, z = az + uz * s - ux * 3.6; if (H.clearOf(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 0)) H.lamp(x, z, { style: 'globe', h: 3.6, color: '#2a2a32' }); }
  }
  // more houses tucked into the gaps between lanes
  for (let i = 0; i < 900; i++) {
    const x = U.lerp(R[0] + 6, R[2] - 6, r()), z = U.lerp(R[1] + 6, R[3] - 6, r()), w = 8 + r() * 5, d = 8 + r() * 5;
    if (!H.clearOf(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 2.5)) continue;
    const bb = H.bldg(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 6 + r() * 6, pick(r, pastel), { trim: '#6a5a4a', outline: 0.12, kind: 'house' });
    H.roof(x - w / 2, z - d / 2, x + w / 2, z + d / 2, bb.top, 2.4 + r() * 1.5, pick(r, roofs));
    H.reserve([x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
  }
  // gardens and trees in the gaps
  for (let i = 0; i < 260; i++) {
    const x = U.lerp(R[0], R[2], r()), z = U.lerp(R[1], R[3], r());
    if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 1)) { H.tree(x, z, { s: 0.7 + r() * 0.4, color: pick(r, ['#5f8f4a', '#6f9a4a', '#4f7f45']), color2: '#7aa055' }); H.reserve([x - 2, z - 2, x + 2, z + 2]); }
  }
  H.walkers(lanes, 50, 'oldtown');
}

// ============================================================
//  MARKET — the hall, stall alleys, lantern strings, a sunken record shop
// ============================================================
function buildMarket(H) {
  const { K, W, B, F, S } = H, r = U.rng(505);
  const R = PLAN.byKey.market.rect;
  H.patch([R[0] + 4, R[1] + 4, R[2] - 4, R[3] - 4], '#c9a983', 'walk', 0.05);
  // the hall: columns, a big skateable gable roof
  const hx0 = 690, hz0 = -80, hx1 = 810, hz1 = -10;
  const [hlo, hhi] = groundSpan(hx0, hz0, hx1, hz1), hy = hhi + 9;
  for (let x = hx0; x <= hx1; x += 12) for (const z of [hz0, hz1]) { const gy = terrainAt(x, z); K.box(x - 0.6, gy - 1, z - 0.6, x + 0.6, hy, z + 0.6, '#7a5a3a', 'wood', { outlineT: 0.06 }); }
  for (let z = hz0 + 14; z < hz1; z += 14) for (const x of [hx0, hx1]) { const gy = terrainAt(x, z); K.box(x - 0.6, gy - 1, z - 0.6, x + 0.6, hy, z + 0.6, '#7a5a3a', 'wood', { outlineT: 0.06 }); }
  B.box(hx0 - 1, hy - 0.6, hz0 - 1, hx1 + 1, hy, hz1 + 1, '#6a4a2e', 'wood', { outlineT: 0.08 });
  W.boxes.push({ x0: hx0 - 1, y0: hy - 0.6, z0: hz0 - 1, x1: hx1 + 1, y1: hy, z1: hz1 + 1, tag: 'hallroof', nocam: true });
  H.roof(hx0 - 1, hz0 - 1, hx1 + 1, hz1 + 1, hy, 9, '#a0523a', false);
  W.camBoxes.push({ x0: hx0, y0: hy, z0: hz0, x1: hx1, y1: hy + 9, z1: hz1 });
  H.reserve([hx0 - 3, hz0 - 3, hx1 + 3, hz1 + 3]);
  // stalls: inside the hall and along alleys outside
  const stallCols = ['#c4523a', '#e8b84a', '#3e8f86', '#d9779a', '#4a6aa0', '#f2efe6', '#8a5a9e', '#6aa04a'];
  const produce = ['#e85a3a', '#f2b23a', '#7ac04a', '#c83a6a', '#f2e04a', '#8a4ac0', '#ff8a3a'];
  const stall = (x, z, alongX, col) => {
    const y = terrainAt(x, z), w = 3.6, d = 1.6;
    const [x0, z0, x1, z1] = alongX ? [x - w / 2, z - d / 2, x + w / 2, z + d / 2] : [x - d / 2, z - w / 2, x + d / 2, z + w / 2];
    K.box(x0, y - 0.5, z0, x1, y + 0.9, z1, '#8a6a4a', 'wood', { outlineT: 0.04 });
    for (let k = 0; k < 3; k++) K.sphere(U.lerp(x0 + 0.6, x1 - 0.6, (k + 0.5) / 3), y + 1.05, (z0 + z1) / 2, 0.42, pick(r, produce), { outline: 0, seg: 5, sy: 0.6 });
    // awning on four poles
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) K.cyl(px, y, pz, 0.06, 2.6, '#4a3a2a', { outline: 0, seg: 3 });
    const aw = new THREE.BoxGeometry(alongX ? w + 0.6 : d + 1.4, 0.08, alongX ? d + 1.4 : w + 0.6);
    B.add(aw, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(alongX ? 0.18 : 0, 0, alongX ? 0 : 0.18)).setPosition(x, y + 2.75, z), col, 'plain', { outlineT: 0.04, edges: false });
    // the awnings are taut canvas: land on one and it throws you up (into a little note)
    W.boxes.push({ x0: x - (alongX ? w : d + 1.4) / 2, y0: y + 2.55, z0: z - (alongX ? d + 1.4 : w) / 2, x1: x + (alongX ? w : d + 1.4) / 2, y1: y + 2.8, z1: z + (alongX ? d + 1.4 : w) / 2, tag: 'bounce', nocam: true });
    F.box(x0, y, z0, x1, y + 2.6, z1, col);
    H.sound(x, y + 1, z, 2.2, 'crate');
    return y;
  };
  const vendors = [];
  for (let x = hx0 + 10; x < hx1 - 6; x += 9) for (const z of [hz0 + 18, hz0 + 34, hz0 + 50]) { const y = stall(x, z, true, pick(r, stallCols)); vendors.push([x, z + 1.8, Math.PI, y]); }
  // alleys around the hall: rows of stalls, lanterns strung across
  const alleys = [];
  const MX0 = 560, MX1 = 960;
  for (const z of [-250, -190, -130, 50, 110, 170, 230]) {
    const row = [];
    for (let x = MX0; x < MX1; x += 8.5) {
      if (Math.floor((x - MX0) / 68) % 2 === 1 && z % 120 !== 50) { row.push([x, z]); continue; }   // open stretches
      for (const side of [-1, 1]) {
        const sx = x, sz = z + side * 4.4;
        if (!H.clearOf(sx - 2.4, sz - 1.4, sx + 2.4, sz + 1.4, 1.5) || rectDist(CELLAR, sx, sz) < 8) continue;
        if (r() < 0.15) continue;
        const y = stall(sx, sz, true, pick(r, stallCols)); vendors.push([sx, sz + side * 1.8, side > 0 ? 0 : Math.PI, y]);
        H.reserve([sx - 2.4, sz - 1.4, sx + 2.4, sz + 1.4]);
      }
      row.push([x, z]);
    }
    if (row.length > 4) alleys.push(row);
    H.line([[MX0 - 10, z], [MX1 + 10, z]], 2.6);
    for (let x = MX0 + 14; x < MX1 - 10; x += 24) {
      if (!H.clearOf(x - 0.4, z - 7, x + 0.4, z - 6.2, 0.2) || !H.clearOf(x + 1.6, z + 6.2, x + 2.4, z + 7, 0.2)) continue;
      const y0 = terrainAt(x, z - 6.6), y1 = terrainAt(x + 2, z + 6.6);
      K.cyl(x, y0 - 0.2, z - 6.6, 0.1, 6, '#4a3a2a', { outline: 0.02, seg: 5 }); K.cyl(x + 2, y1 - 0.2, z + 6.6, 0.1, 6, '#4a3a2a', { outline: 0.02, seg: 5 });
      K.rail([[x, y0 + 5.6, z - 6.6], [x + 2, y1 + 5.6, z + 6.6]], { kind: 'cable', lanterns: true, posts: false, sag: 0.6 });
    }
  }
  // the market quarter: continuous shop facades facing each alley, cross lanes every so often
  const shopCols = ['#e0b070', '#d08a5a', '#c87a4a', '#e8c890', '#b86a4a', '#f0d8a8', '#a8c0a0', '#d8a0a0', '#e8d0b0'];
  const crossX = [620, 700, 840, 920];
  for (const z of [-250, -190, -130, 50, 110, 170, 230]) for (const side of [-1, 1]) {
    let x = R[0] + 10;
    while (x < R[2] - 10) {
      const w = 9 + r() * 8, d = 10 + r() * 6;
      if (crossX.some(c => x < c + 5 && x + w > c - 5)) { x += 4; continue; }
      const z0 = side > 0 ? z + 9 : z - 9 - d, z1 = side > 0 ? z + 9 + d : z - 9;
      if (H.clearOf(x, z0, x + w, z1, 0.4)) {
        const bb = H.bldg(x, z0, x + w, z1, 6 + r() * 7, pick(r, shopCols), { trim: '#7a4a32', outline: 0.12, kind: 'house' });
        if (r() < 0.55) H.roof(x, z0, x + w, z1, bb.top, 2.2 + r() * 1.5, pick(r, ['#b85a3a', '#a04a32', '#c8703f']));
        // a coloured awning over the shop front
        const fz = side > 0 ? z0 : z1, dz = side > 0 ? -1 : 1;
        B.box(x + 0.6, bb.hi + 2.8, Math.min(fz, fz + dz * 2.2), x + w - 0.6, bb.hi + 3.0, Math.max(fz, fz + dz * 2.2), pick(r, stallCols), 'plain', { outlineT: 0.03, edges: false });
        W.boxes.push({ x0: x + 0.6, y0: bb.hi + 2.8, z0: Math.min(fz, fz + dz * 2.2), x1: x + w - 0.6, y1: bb.hi + 3.0, z1: Math.max(fz, fz + dz * 2.2), tag: 'bounce', nocam: true });
        H.reserve([x, z0, x + w, z1]);
      }
      x += w + 0.05;
    }
  }
  for (const cx of crossX) H.path([[cx, R[1] + 6], [cx, R[3] - 6]], 6, '#c2a27c', 'walk');
  W.marketAlleys = alleys;
  H.standers(vendors, 'market');
  H.busker('oud', 650, -45, 1.57);
  H.walkers(alleys.filter(a => a.length > 2).map(a => [a[0], a[a.length - 1]]), 90, 'market');
  // the record shop: a sunken yard with crates of records and string lights (hidden spot)
  const [cx0, cz0, cx1, cz1] = CELLAR, gy = Math.min(terrainAt(cx0, cz0), terrainAt(cx1, cz0), terrainAt(cx0, cz1), terrainAt(cx1, cz1)), fy = gy - 3.6;
  // floor and ramp
  S.add(cx0 + 6, fy, (cz0 + cz1) / 2, cx1, fy, (cz0 + cz1) / 2, (cz1 - cz0) / 2);
  S.add(cx0, fy, cz1 - 4, cx0 + 6, fy, cz1 - 4, 4);
  S.add(cx0 + 3, terrainAt(cx0 + 3, cz0) + 0.02, cz0, cx0 + 3, fy, cz1 - 8, 3);
  B.box(cx0, fy - 0.6, cz0, cx1, fy, cz1, '#6a5a4a', 'wood', { outlineT: 0, edges: false });
  const rl = Math.hypot(cz1 - 8 - cz0, gy - fy);
  B.add(new THREE.BoxGeometry(6, 0.4, rl), new THREE.Matrix4().makeRotationX(Math.atan2(gy - fy, cz1 - 8 - cz0)).setPosition(cx0 + 3, (gy + fy) / 2 - 0.2, (cz0 + cz1 - 8) / 2), '#8a7a6a', 'paving', { outlineT: 0.04, edges: false });
  // walls (seen from inside and out)
  for (const [x0, z0, x1, z1] of [[cx0, cz0, cx1, cz0 + 0.6], [cx0, cz1 - 0.6, cx1, cz1], [cx1 - 0.6, cz0, cx1, cz1], [cx0, cz0 + 0.6, cx0 + 0.6, cz1]]) K.box(x0, fy - 0.6, z0, x1, gy + 0.6, z1, '#8a5a42', 'brick', { outlineT: 0.05 });
  K.rail([[cx0 + 6.3, gy + 1.5, cz0 + 0.3], [cx1 - 0.3, gy + 1.5, cz0 + 0.3]], { color: '#e9e4f5', postMax: 1.5 });
  for (let i = 0; i < 6; i++) { const x = cx0 + 10 + (i % 3) * 4.5, z = cz0 + 6 + Math.floor(i / 3) * 6; K.box(x - 1.2, fy, z - 0.6, x + 1.2, fy + 0.8, z + 0.6, '#5a4a3a', 'wood', { outlineT: 0.03 }); for (let k = 0; k < 6; k++) B.box(x - 1.1 + k * 0.38, fy + 0.8, z - 0.5, x - 0.82 + k * 0.38, fy + 1.15, z + 0.5, pick(r, ['#14101f', '#c4523a', '#e8b84a', '#3e8f86', '#f2efe6']), 'plain', { outlineT: 0, edges: false }); }
  K.box(cx1 - 6, fy, cz1 - 5, cx1 - 2, fy + 0.9, cz1 - 2, '#3a2a22', 'wood', { outlineT: 0.03 }); K.cyl(cx1 - 4, fy + 0.9, cz1 - 3.5, 0.9, 0.08, '#14101f', { outline: 0.02, seg: 18 });
  K.rail([[cx0 + 1, gy + 3.5, cz0 + 1], [cx1 - 1, gy + 3.5, cz1 - 1]], { kind: 'cable', lanterns: ['#ffd27a', '#ff9a6a'], posts: false, sag: 0.8, deco: true });
  K.rail([[cx1 - 1, gy + 3.5, cz0 + 1], [cx0 + 1, gy + 3.5, cz1 - 1]], { kind: 'cable', lanterns: ['#ffd27a', '#ff9a6a'], posts: false, sag: 0.8, deco: true });
  H.reserve([cx0 - 4, cz0 - 4, cx1 + 4, cz1 + 4]);
  H.spot('cellar', (cx0 + cx1) / 2, (cz0 + cz1) / 2, 17); W.spots[W.spots.length - 1].y = fy;
  H.bench(cx0 + 12, cz1 - 3, true, { y: fy, view: false });
  (W.pigeonSpots = W.pigeonSpots || []).push([620, 120, 12], [930, -200, 10]);
}

// ============================================================
//  CANALS — narrow gabled houses on both quays, bridges, bollards,
//  moored boats; the echo under the stone bridge (hidden spot)
// ============================================================
function buildCanals(H) {
  const { K, W, B, F, S } = H, r = U.rng(606), C = PLAN.canal;
  const qN = C.z - C.half, qS = C.z + C.half;               // the canal's north and south walls
  // quays
  groundRibbon(B, [[C.x0 + 4, qN - 8], [C.bendX + C.half + 6, qN - 8]], 15, '#b9ad98', 'walk', 0.07);
  groundRibbon(B, [[C.x0 + 4, qS + 8], [C.bendX - C.half - 2, qS + 8]], 15, '#b9ad98', 'walk', 0.07);
  groundRibbon(B, [[C.bendX - C.half - 8, qS + 4], [C.bendX - C.half - 8, shoreZ(C.bendX) - 10]], 15, '#b9ad98', 'walk', 0.07);
  groundRibbon(B, [[C.bendX + C.half + 8, qN], [C.bendX + C.half + 8, shoreZ(C.bendX) - 10]], 15, '#b9ad98', 'walk', 0.07);
  H.line([[C.x0, qN - 8], [C.bendX + C.half + 8, qN - 8]], 8); H.line([[C.x0, qS + 8], [C.bendX, qS + 8]], 8);
  H.line([[C.bendX - C.half - 8, qS], [C.bendX - C.half - 8, 1300]], 8); H.line([[C.bendX + C.half + 8, qN], [C.bendX + C.half + 8, 1300]], 8);
  // bridges
  const bridges = [-870, -560, 210];
  for (const bx of bridges) { bridge(H.K, S, F, bx, qN - 4, bx, qS + 4, 7, 1.6); H.line([[bx, qN - 20], [bx, qS + 20]], 5); }
  // the stone arch bridge with a low ledge under it
  bridge(H.K, S, F, -60, qN - 10, -60, qS + 10, 8, 2.8, { color: '#a89a82', wall: '#8a7a64' });
  H.line([[-60, qN - 26], [-60, qS + 26]], 6);
  const ly = 2.4, lz0 = qS - 3.2, lz1 = qS;
  S.add(-190, C.quayY, (lz0 + lz1) / 2, -140, ly, (lz0 + lz1) / 2, (lz1 - lz0) / 2);
  S.add(-140, ly, (lz0 + lz1) / 2, 20, ly, (lz0 + lz1) / 2, (lz1 - lz0) / 2);
  B.box(-140, C.bedY, lz0, 20, ly, lz1, '#9a8e7a', 'paving', { outlineT: 0.05, edges: false });
  B.add(new THREE.BoxGeometry(50.2, 0.5, lz1 - lz0), new THREE.Matrix4().makeRotationZ(Math.atan2(C.quayY - ly, 50)).setPosition(-165, (C.quayY + ly) / 2 - 0.25, (lz0 + lz1) / 2), '#9a8e7a', 'paving', { outlineT: 0.05, edges: false });
  K.rail([[-188, C.quayY + 1, lz0 + 0.2], [-140, ly + 1, lz0 + 0.2], [20, ly + 1, lz0 + 0.2]], { color: '#e9e4f5', postMax: 1.2, round: 0 });
  H.spot('arch', -60, (lz0 + lz1) / 2, 15); W.spots[W.spots.length - 1].y = ly;
  // south-leg bridges (east–west)
  for (const bz of [640, 1000]) { bridge(H.K, S, F, C.bendX - C.half - 4, bz, C.bendX + C.half + 4, bz, 7, 1.6); H.line([[C.bendX - C.half - 20, bz], [C.bendX + C.half + 20, bz]], 5); }
  H.busker('accordion', -588, qN - 10, Math.PI);
  // canal houses: narrow, tall, gables to the water
  const cols = ['#8a5a4a', '#5a6a6a', '#c8b89a', '#3f5a5a', '#a07a5a', '#d8cfc0', '#6a4a3a', '#7a8a7a', '#9a6a5a', '#b8a888'];
  const row = (x0, x1, zFront, dir, depth) => {
    let x = x0;
    while (x < x1) {
      const w = 6.5 + r() * 4, d = depth * (0.8 + r() * 0.3);
      const z0 = dir > 0 ? zFront : zFront - d, z1 = dir > 0 ? zFront + d : zFront;
      if (H.clearOf(x, z0, x + w, z1, 0.5)) {
        const bb = H.bldg(x, z0, x + w, z1, 10 + r() * 8, pick(r, cols), { trim: '#f2ede2', outline: 0.12, kind: 'house' });
        H.frontage(x, x + w, dir > 0 ? z0 : z1, dir, bb.hi, bb.top, r, { shop: 0.25, balcony: 0.45 });
        H.roof(x, z0, x + w, z1, bb.top, 3.5 + r() * 2, pick(r, ['#5a4a42', '#6a5a52', '#4a4a52', '#7a4a3a']), true);
        H.reserve([x, z0, x + w, z1]);
      }
      x += w + (r() < 0.15 ? 6 : 0.05);
    }
  };
  const xA = PLAN.byKey.canals.rect[0] + 6;
  row(xA, C.bendX - 6, qN - 16, -1, 14);
  row(xA, C.bendX - 6, PLAN.avenueZ + 16, 1, 16);
  row(xA, C.bendX - C.half - 18, qS + 16, 1, 14);
  row(xA, C.bendX - C.half - 18, qS + 62, 1, 16);
  row(xA, C.bendX - C.half - 18, qS + 124, 1, 14);
  for (let z = qS + 30; z < 780; z += 60) {    // a short row facing the south leg, too
    let zz = z; const x1 = C.bendX - C.half - 16, x0 = x1 - 14;
    if (H.clearOf(x0, zz, x1, zz + 9, 0.5)) { const bb = H.bldg(x0, zz, x1, zz + 9, 12 + r() * 6, pick(r, cols), { trim: '#f2ede2', kind: 'house' }); H.roof(x0, zz, x1, zz + 9, bb.top, 3.5, '#5a4a42', false); H.reserve([x0, zz, x1, zz + 9]); }
  }
  // bollards and trees along the quays, moored boats
  for (let x = C.x0 + 20; x < C.bendX - 10; x += 14) {
    for (const [z, dz] of [[qN - 1.6, -1], [qS + 1.6, 1]]) {
      if (!H.clearOf(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 0)) continue;
      const y = terrainAt(x, z); K.cyl(x, y - 0.2, z, 0.28, 0.9, '#2a2a32', { outline: 0.03, seg: 8, r2: 0.34 }); W.boxes.push({ x0: x - 0.3, y0: y - 1, z0: z - 0.3, x1: x + 0.3, y1: y + 0.7, z1: z + 0.3, tag: 'bollard' });
      H.sound(x, y, z, 1.5, 'bollard');
      if ((x / 14 | 0) % 3 === 0) { const tz = z + dz * 5; if (H.clearOf(x - 1, tz - 1, x + 1, tz + 1, 0)) H.tree(x, tz, { s: 0.85, color: '#5a8a4a', color2: '#6f9a55' }); }
      else if ((x / 14 | 0) % 3 === 1) { const lz = z + dz * 5; if (H.clearOf(x - 0.3, lz - 0.3, x + 0.3, lz + 0.3, 0)) H.lamp(x, lz, { h: 4.2, color: '#1f2a2a' }); }
    }
  }
  // moored boats (still) along the south quay
  for (let x = C.x0 + 60; x < C.bendX - 80; x += 70 + r() * 50) {
    if (bridges.concat([-60]).some(b => Math.abs(b - x) < 16)) continue;
    const c = pick(r, ['#2f5f6a', '#8a3a2a', '#3a4a6a', '#5a6a3a', '#d8cfc0']), by = C.waterY + 0.25;
    B.box(x - 6.5, by - 0.6, qS - 3.8, x + 6.5, by + 0.4, qS - 1.4, c, 'plain', { outlineT: 0.05, edges: false });
    B.box(x - 4.5, by + 0.3, qS - 3.6, x + 0.5, by + 1.7, qS - 1.6, '#efe6d2', 'plain', { outlineT: 0.04, edges: false });
    S.add(x - 6.4, C.waterY + 0.68, qS - 2.6, x + 6.4, C.waterY + 0.68, qS - 2.6, 1.15);
  }
  // people on the quays
  H.walkers([[[C.x0 + 20, qN - 6], [C.bendX - 10, qN - 6]], [[C.x0 + 20, qS + 6], [C.bendX - 30, qS + 6]], [[C.bendX + C.half + 6, qN + 10], [C.bendX + C.half + 6, 1150]]], 40, 'canals');
  (W.pigeonSpots = W.pigeonSpots || []).push([-300, qS + 40, 8], [-700, qN - 30, 8]);
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
  H.busker('pan', prom[20][0], prom[20][1] - 7, 0);
  // the pier and the lighthouse
  const px = -480, pz0 = shoreZ(px) - 12, pz1 = 1585, py = 2.7;
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
