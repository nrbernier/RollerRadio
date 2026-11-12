// ============================================================
//  OLD TOWN — steep lanes between rows of houses in five quarters
//  (each its own colours), little squares, courtyards, a chapel,
//  playgrounds; roofs you can get onto and travel across
// ============================================================
function buildOldTown(H) {
  const { K, W, B, F, S } = H, r = U.rng(404), put = H.put;
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
  const R = PLAN.byKey.oldtown.rect;
  // the open places: each is reserved, and joined to the nearest lane by a side lane
  const links = [];
  for (const p of OLD_PADS) {
    const [x, z, hf] = p; H.reserve([x - hf, z - hf, x + hf, z + hf]);
    let bd = 1e9, bq = null;
    for (const L of lanes) for (let i = 0; i < L.length - 1; i++) { const [ax, az] = L[i], dx = L[i + 1][0] - ax, dz = L[i + 1][1] - az, u = U.clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), qx = ax + dx * u, qz = az + dz * u, dd = Math.hypot(qx - x, qz - z); if (dd < bd) { bd = dd; bq = [qx, qz]; } }
    if (bd > hf * 0.7) { const k = (bd - hf * 0.7) / bd; links.push([[bq[0], bq[1]], [bq[0] + (x - bq[0]) * k, bq[1] + (z - bq[1]) * k]]); p.link = bq; }
  }
  const sq = [660, -570];
  // the square
  const sqR = [sq[0] - 26, sq[1] - 24, sq[0] + 26, sq[1] + 24];
  H.patch(sqR, '#c9b79a', 'walk', 0.07); H.reserve(sqR);
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
  for (const L of lanes) { H.path(L, 7, '#b8a88c', 'walk'); H.line(L, 3.5); }
  for (const L of links) { H.path(L, 5, '#b8a88c', 'walk'); H.line(L, 2.6); }
  W.oldLanes = lanes.concat(links);
  for (const p of OLD_PADS) oldPad(H, p, r);
  // rows of houses round each open place, facing in
  for (const p of OLD_PADS) {
    const [x, z, hf, kind] = p; if (kind === 'court') continue;
    const q = oldQ(x, z), g = 1.2;
    terraceRow(H, true, x - hf, x + hf, z - hf - g, -1, r, { q, shop: 0.4 }); terraceRow(H, true, x - hf, x + hf, z + hf + g, 1, r, { q, shop: 0.4 });
    terraceRow(H, false, z - hf, z + hf, x - hf - g, -1, r, { q, shop: 0.4 }); terraceRow(H, false, z - hf, z + hf, x + hf + g, 1, r, { q, shop: 0.4 });
  }
  // houses along the lanes, sawtooth facades (they stay square to the compass)
  for (const L of lanes) for (let i = 0; i < L.length - 1; i++) {
    const [ax, az] = L[i], [bx, bz] = L[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    for (let s = 6; s < len - 4; s += 7.5 + r() * 2.5) for (const side of [-1, 1]) {
      const w = 7.5 + r() * 4, d = 8.5 + r() * 4.5;
      const alongX = Math.abs(ux) > Math.abs(uz);
      const hx = alongX ? w / 2 : d / 2, hz = alongX ? d / 2 : w / 2;
      // push the (square-to-the-compass) house out until its nearest corner clears the lane
      const off = 4.4 + hx * Math.abs(uz) + hz * Math.abs(ux) + r() * 0.6;
      const cx = ax + ux * s - uz * off * side, cz = az + uz * s + ux * off * side;
      const x0 = cx - hx, z0 = cz - hz, x1 = cx + hx, z1 = cz + hz;
      if (rectDist(R, cx, cz) > -4 && rectDist(PLAN.byKey.obs.rect, cx, cz) > 0) { if (rectDist(R, cx, cz) > 30) continue; }
      if (!H.clearOf(x0, z0, x1, z1, 0.5)) continue;
      const lx = ax + ux * s, lz = az + uz * s;
      oldHouse(H, x0, z0, x1, z1, r, { front: alongX ? (cz < lz ? 's' : 'n') : (cx < lx ? 'e' : 'w') });
    }
    // lamps
    for (let s = 14; s < len; s += 36) { const x = ax + ux * s + uz * 3.6, z = az + uz * s - ux * 3.6; if (H.clearOf(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 0)) H.lamp(x, z, { style: 'globe', h: 3.6, color: '#2a2a32' }); }
  }
  // courtyards: four wings round a yard, a gateway in, a gallery and stairs inside
  for (let i = 0, n = 0; i < 400 && n < 9; i++) {
    const x = U.lerp(R[0] + 26, R[2] - 26, r()), z = U.lerp(R[1] + 24, R[3] - 24, r());
    if (!H.clearOf(x - 17, z - 15, x + 17, z + 15, 2)) continue;
    const [lo, hi] = groundSpan(x - 17, z - 15, x + 17, z + 15); if (hi - lo > 7) continue;
    courtBlock(H, x, z, r); n++;
  }
  // short rows tucked into the gaps between lanes
  for (let i = 0; i < 520; i++) {
    const alongX = r() < 0.5, n = 2 + Math.floor(r() * 3), len = n * 8.6, x = U.lerp(R[0] + 6, R[2] - 6 - (alongX ? len : 11), r()), z = U.lerp(R[1] + 6, R[3] - 6 - (alongX ? 11 : len), r());
    if (!H.clearOf(x, z, x + (alongX ? len : 11.5), z + (alongX ? 11.5 : len), 2.4)) continue;
    terraceRow(H, alongX, alongX ? x : z, (alongX ? x : z) + len, alongX ? z : x, 1, r, { shop: 0.12 });
  }
  // and single houses in what is left
  for (let i = 0; i < 260; i++) {
    const x = U.lerp(R[0] + 6, R[2] - 6, r()), z = U.lerp(R[1] + 6, R[3] - 6, r()), w = 7 + r() * 4, d = 7 + r() * 4;
    if (!H.clearOf(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 2.5)) continue;
    oldHouse(H, x - w / 2, z - d / 2, x + w / 2, z + d / 2, r);
  }
  // roof level: ways up, then everything that ties the roofs together
  const list = W.roofsOld || [];
  roofWays(H, list, r, { stair: 0.7, slide: 0.24 });
  roofLinks(H, list, r, { skip: 0.15 });
  // gardens and trees in the gaps
  for (let i = 0; i < 260; i++) {
    const x = U.lerp(R[0], R[2], r()), z = U.lerp(R[1], R[3], r());
    if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 1)) { H.tree(x, z, { s: 0.7 + r() * 0.4, color: pick(r, ['#5f8f4a', '#6f9a4a', '#4f7f45']), color2: '#7aa055' }); H.reserve([x - 2, z - 2, x + 2, z + 2]); }
  }
  H.walkers(lanes, 50, 'oldtown');
}

// a courtyard block: four wings under one eave line, a gateway through one of them
function courtBlock(H, cx, cz, r, o = {}) {
  const { K, W, B } = H, hw = 17, hd = 15, t = 8, x0 = cx - hw, x1 = cx + hw, z0 = cz - hd, z1 = cz + hd, q = o.q || oldQ(cx, cz);
  const [lo, hi] = groundSpan(x0, z0, x1, z1), top = hi + 7 + r() * 2, gate = o.gate || (r() < 0.5 ? 's' : 'n'), gw = 2.6;
  const col = pick(r, q.walls), rc = pick(r, q.roofs), rise = 2.6 + r(), opt = { q, top, type: 'gable', col, rc, rise, shop: 0 };
  for (const [a0, c0, a1, c1, f] of [[x0, z0, x1, z0 + t, 'n'], [x0, z1 - t, x1, z1, 's'], [x0, z0 + t, x0 + t, z1 - t, 'w'], [x1 - t, z0 + t, x1, z1 - t, 'e']]) {
    const sx = f === 'w' || f === 'e';
    if (f !== gate) { oldHouse(H, a0, c0, a1, c1, r, Object.assign({ slopeX: sx }, opt)).noWay = true; continue; }
    // the gateway wing: two halves and the room over the arch
    oldHouse(H, a0, c0, cx - gw, c1, r, Object.assign({ slopeX: false }, opt)).noWay = true; oldHouse(H, cx + gw, c0, a1, c1, r, Object.assign({ slopeX: false }, opt)).noWay = true;
    K.box(cx - gw, hi + 4.3, c0 + 0.25, cx + gw, top, c1 - 0.25, col, 'house', { outlineT: 0.1 });
    H.roof(cx - gw - 0.4, c0, cx + gw + 0.4, c1, top, rise, rc, false);
    B.box(cx - gw - 0.3, lo - 1, c0 - 0.15, cx - gw, hi + 4.3, c1 + 0.15, '#b9b0a0', 'paving', { outlineT: 0.04, edges: false }); B.box(cx + gw, lo - 1, c0 - 0.15, cx + gw + 0.3, hi + 4.3, c1 + 0.15, '#b9b0a0', 'paving', { outlineT: 0.04, edges: false });
    const gz = f === 'n' ? z0 : z1, dz = f === 'n' ? -1 : 1;
    H.path([[cx, gz - dz * t], [cx, gz + dz * 7]], 4.6, '#b8a88c', 'walk');
    H.lamp(cx + gw + 1.2, gz + dz * 1.2, { style: 'globe', h: 3.4, color: '#2a2a32' });
  }
  // the yard: paving, a tree, a bench; a gallery along the north wing with a stair up to it, and a second flight to the roof
  const Y = [x0 + t, z0 + t, x1 - t, z1 - t], gy = hi + 3.6;
  H.patch(Y, '#c9b79a', 'walk', 0.07);
  H.planter(cx + 3, cz + 1, 3, 3, { h: 0.5, tree: pick(r, ['#5f8f4a', '#6f9a4a', '#d9779a']) });
  H.bench(cx - 4, Y[3] - 1.6, true, { color: '#7a5a3a' });
  gallery(H, faceFrame('s', Y[0], z0, Y[2], Y[1]), gy, r, { inset: 0, dep: 1.7, rail: '#6a4a2e' });
  const g0 = terrainAt(Y[0] + 1, Y[3] - 1) + 0.04;
  K.ramp(Y[0] + 0.1, Y[1] + 1.7, Y[0] + 1.8, Y[3] - 0.6, 'z', gy, g0, '#c9a878', true, 0, 'wood');
  K.rail([[Y[0] + 1.8, g0 + 0.95, Y[3] - 0.6], [Y[0] + 1.8, gy + 0.95, Y[1] + 1.7]], { color: '#6a4a2e', postMax: 8, round: 0, radius: 0.06 });
  K.ramp(Y[2] - 1.8, Y[1] + 1.7, Y[2] - 0.1, Y[3] - 0.6, 'z', gy, top, '#c9a878', true, 0, 'wood');
  K.rail([[Y[2] - 1.8, gy + 0.95, Y[1] + 1.7], [Y[2] - 1.8, top + 0.95, Y[3] - 0.6]], { color: '#6a4a2e', postMax: 12, round: 0, radius: 0.06 });
  K.rail([[Y[0], top + 0.3, cz - 2], [Y[2], top + 0.3, cz + 2]], { kind: 'cable', laundry: true, posts: false, sag: 0.45 });
  H.reserve([x0, z0, x1, z1]);
}

// what stands on each of the old town's level places
function oldPad(H, p, r) {
  const { K, W, B, F } = H, put = H.put, [x, z, hf, kind] = p, y = p.y, R = [x - hf, z - hf, x + hf, z + hf], q = oldQ(x, z);
  const stone = '#c9b79a';
  const corners = (d) => [[x - d, z - d], [x + d, z - d], [x - d, z + d], [x + d, z + d]];
  if (kind === 'court') { courtBlock(H, x, z, r, { q, gate: p.link && p.link[1] > z ? 's' : 'n' }); return; }
  if (kind === 'play') {
    H.playground(x, z, r, 'oldtown');
    for (const [tx, tz] of corners(hf - 2.5)) H.tree(tx, tz, { s: 0.9, color: '#5f8f4a', color2: '#7aa055' });
    H.ledge([[x - hf + 1, z - hf + 1], [x + hf - 1, z - hf + 1]], { h: 0.7, w: 0.5, color: '#b9b0a0', top: '#d8d4cc' });
    return;
  }
  if (kind === 'garden') {
    // a walled garden: gates in the middle of each side, beds, a big tree, a pergola walk
    const d = hf - 1, wall = { h: 1.1, w: 0.55, color: '#d8cfbf', top: q.roofs[0] };
    for (const s of [-1, 1]) { H.ledge([[x - d, z + s * d], [x - 2.2, z + s * d]], wall); H.ledge([[x + 2.2, z + s * d], [x + d, z + s * d]], wall); H.ledge([[x + s * d, z - d], [x + s * d, z - 2.2]], wall); H.ledge([[x + s * d, z + 2.2], [x + s * d, z + d]], wall); }
    H.path([[x - d, z], [x + d, z]], 3, '#cdbf9e'); H.path([[x, z - d], [x, z + d]], 3, '#cdbf9e');
    for (const [tx, tz] of corners(hf * 0.5)) H.flowerBed(tx, tz, 3.4, r, y);
    H.tree(x + 5, z - 5, { s: 1.3, color: '#4f7f45', color2: '#6f9a4a' });
    for (let k = -1; k <= 1; k++) { for (const s of [-1, 1]) put(H.SH.CYL, x + k * 3.6, y + 1.2, z + 5 + s * 1.3, 0.07, 2.4, 0.07, '#6a4a2e', 'plain', 0.02); put(H.SH.BOX, x + k * 3.6, y + 2.42, z + 5, 0.12, 0.12, 3.2, '#6a4a2e', 'plain', 0.02); put(H.SH.ICO, x + k * 3.6, y + 2.6, z + 5, 1.1, 0.35, 1.5, '#6fa85a', 'flat', 0.03); }
    H.bench(x - 6, z + 5, false, { color: '#7a5a3a' }); H.bench(x + 7, z + 6, false, { color: '#7a5a3a' });
    H.picnic(x - 6, z - 6, 'oldtown', r);
    return;
  }
  if (kind === 'boules') {
    H.blob(x, z, 11, 6.5, '#d9c9a0', 'gravel', 0.07, 5);
    for (const s of [-1, 1]) H.ledge([[x - 10, z + s * 6], [x + 10, z + s * 6]], { h: 0.28, w: 0.3, color: '#8a6a4a', kind: 'wood' });
    for (let k = 0; k < 7; k++) put(H.SH.ICO, x - 3 + r() * 7, y + 0.16, z - 2 + r() * 4, 0.16, 0.16, 0.16, k ? '#8e98a4' : '#e4572e', 'flat', 0.02);
    for (const s of [-1, 1]) for (const tx of [-8, 0, 8]) H.tree(x + tx, z + s * 10.5, { s: 1.05, color: '#6f9a4a', color2: '#8aa055' });
    H.group(x - 5, z - 1, 3, 'oldtown'); H.standers([[x + 6, z + 2, -1.6, y], [x + 7.2, z - 1, -1.9, y]], 'oldtown');
    H.bench(x - 6, z + 8, true, { color: '#7a5a3a' }); H.bench(x + 6, z - 8, true, { color: '#7a5a3a' });
    return;
  }
  H.patch(R, stone, 'walk', 0.07);
  if (kind === 'church') {
    // the chapel: a whitewashed nave under a steep roof, a tower with a spire at its south end
    const nx0 = x - 6, nz0 = z - 15, nx1 = x + 6, nz1 = z + 3, white = '#f4ecd8', rc = q.roofs[1];
    const bb = H.bldg(nx0, nz0, nx1, nz1, 8.5, white, { trim: '#6a4a2a', outline: 0.12, kind: 'plain' });
    const c = { x0: nx0, z0: nz0, x1: nx1, z1: nz1, top: bb.top, lo: bb.lo, hi: bb.hi, rise: 6, flat: false, slopeX: true, type: 'chapel', noWay: true };
    H.roof(nx0, nz0, nx1, nz1, bb.top, 6, rc, true); roofRidge(H, c); (W.roofsOld = W.roofsOld || []).push(c);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { B.box(x + s * 6.02 - 0.05, y + 2.4, nz0 + 2.4 + k * 4, x + s * 6.02 + 0.05, y + 6.2, nz0 + 3.8 + k * 4, '#3a5a7a', 'plain', { outlineT: 0, edges: false }); B.box(x + s * 6.5 - 0.5, y - 1, nz0 + 0.3 + k * 4, x + s * 6.5 + 0.5, y + 5, nz0 + 1.5 + k * 4, white, 'plain', { outlineT: 0.05, edges: false }); }
    const tx0 = x - 3.4, tz0 = z + 3, tx1 = x + 3.4, tz1 = z + 9.8, th = 23;
    K.box(tx0, y - 1.5, tz0, tx1, y + th, tz1, white, 'plain', { outlineT: 0.14 });
    B.box(tx0 - 0.25, y + th - 0.7, tz0 - 0.25, tx1 + 0.25, y + th, tz1 + 0.25, '#6a4a2a', 'plain', { outlineT: 0, edges: false });
    B.add(new THREE.ConeGeometry(5.3, 11, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(x, y + th + 5.5, z + 6.4), rc, 'roof', { outlineT: 0.1 });
    put(H.SH.BOX, x, y + th + 12, z + 6.4, 0.14, 2.2, 0.14, '#c9a24a', 'plain', 0.02); put(H.SH.BOX, x, y + th + 12.3, z + 6.4, 1.0, 0.14, 0.14, '#c9a24a', 'plain', 0.02);
    for (const [fx, fz] of [[0, 1], [1, 0], [-1, 0]]) B.box(x + fx * 3.42 - (fx ? 0.05 : 0.9), y + th - 5, z + 6.4 + fz * 3.42 - (fz ? 0.05 : 0.9), x + fx * 3.42 + (fx ? 0.05 : 0.9), y + th - 2, z + 6.4 + fz * 3.42 + (fz ? 0.05 : 0.9), '#3a3640', 'plain', { outlineT: 0, edges: false });
    B.box(x - 1.2, y, tz1 - 0.02, x + 1.2, y + 3.2, tz1 + 0.1, '#5a3a2a', 'plain', { outlineT: 0.03, edges: false });
    B.add(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 16), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(x, y + 9, tz1 + 0.06), '#3a5a7a', 'plain', { outlineT: 0.04, edges: false });
    K.box(x - 3, y - 0.5, tz1, x + 3, y + 0.3, tz1 + 1.6, '#b9b0a0', 'paving', { outlineT: 0.04 });
    F.box(tx0, y, tz0, tx1, y + th, tz1, white); F.add(new THREE.ConeGeometry(5, 11, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(x, y + th + 5.5, z + 6.4), rc);
    for (const sx of [-1, 1]) { H.tree(x + sx * 13, z + 12, { s: 1.1, color: '#4f7f45', color2: '#6f9a4a' }); H.bench(x + sx * 9, z + 15, true, { color: '#7a5a3a' }); H.lamp(x + sx * 6, z + 12.5, { style: 'globe', h: 3.6, color: '#2a2a32' }); }
    (W.pigeonSpots = W.pigeonSpots || []).push([x, z + 14, 6]);
    return;
  }
  if (kind === 'well') {
    // a well under a little roof, plane trees, café tables
    K.cyl(x, y - 0.3, z, 1.5, 1.25, '#b8a88c', { outline: 0.06, seg: 14 }); K.cyl(x, y + 0.9, z, 1.15, 0.08, '#3a4a5a', { outline: 0, seg: 14 });
    W.boxes.push({ x0: x - 1.3, y0: y - 1, z0: z - 1.3, x1: x + 1.3, y1: y + 0.95, z1: z + 1.3, tag: 'fountain' });
    for (const s of [-1, 1]) put(H.SH.BOX, x + s * 1.35, y + 1.9, z, 0.16, 2.0, 0.16, '#6a4a2e', 'plain', 0.03);
    B.add(prismGeo(3.6, 1.0, 2.2, true), new THREE.Matrix4().makeTranslation(x, y + 2.9, z), q.roofs[0], 'plain', { outlineT: 0.05, edges: false });
    put(H.SH.CYL, x, y + 2.6, z, 0.08, 0.1, 0.08, '#2a2838', 'plain', 0, 0, 0, Math.PI / 2);
    H.sound(x, y + 1, z, 3, 'bin');
    for (const [tx, tz] of corners(hf - 3.5)) H.planter(tx, tz, 3, 3, { h: 0.5, tree: '#6f9a4a' });
    H.cafe(x - hf + 3, z + 4, x - 2, z + hf - 3, 'oldtown', r, { y, parasol: ['#c4523a', '#e8c84a', '#f2efe6'] });
    H.bench(x + 6, z - 6, true, { y: y + 0.02, color: '#7a5a3a' }); H.bench(x + 7, z + 5, false, { y: y + 0.02, color: '#7a5a3a' });
    (W.pigeonSpots = W.pigeonSpots || []).push([x + 4, z + 2, 6]);
    return;
  }
  // 'fountain': a tiered fountain in the middle of a paved square, benches round it, lamps at the corners
  K.cyl(x, y - 0.3, z, 4.2, 0.95, '#b8a88c', { outline: 0.06, seg: 18 }); K.cyl(x, y + 0.55, z, 3.8, 0.08, '#6fb7d8', { outline: 0, seg: 18 });
  K.cyl(x, y, z, 0.5, 2.6, '#b8a88c', { outline: 0.04, seg: 8 }); K.cyl(x, y + 1.7, z, 1.9, 0.22, '#b8a88c', { outline: 0.05, seg: 14 }); K.sphere(x, y + 2.9, z, 0.45, '#c9a24a', { outline: 0.04, seg: 8 });
  W.boxes.push({ x0: x - 3.7, y0: y - 1, z0: z - 3.7, x1: x + 3.7, y1: y + 0.65, z1: z + 3.7, tag: 'fountain' });
  K.rail(pArc(x, z, 4.0, 0, Math.PI * 2 * 23 / 24, y + 0.68, y + 0.68, Math.PI * 2 * 4.0 / 24), { hidden: true, loop: true });
  (W.fountains = W.fountains || []).push({ x, y: y + 2.9, z }); H.sound(x, y, z, 6, 'fountain');
  for (let a = 0; a < 4; a++) H.bench(x + Math.cos(a * 1.57 + 0.78) * 8.5, z + Math.sin(a * 1.57 + 0.78) * 8.5, a % 2 === 0, { y: y + 0.02, color: '#7a5a3a' });
  for (const [tx, tz] of corners(hf - 2)) H.lamp(tx, tz, { y, style: 'globe', h: 3.8, color: '#2a2a32' });
  (W.pigeonSpots = W.pigeonSpots || []).push([x - 5, z + 5, 7]);
}

// ============================================================
//  MARKET — one great market round the hall (a field of stalls under
//  a clock tower), covered lanes to the north, courtyard inns and the
//  dyers' yard to the south; flat roofs everywhere, tied together
// ============================================================
const MKT = { hall: [690, -80, 810, -10], field: [600, -124, 900, 44], tower: [884, -44], cross: [620, 700, 840, 920], lanes: [-250, -190, -130, 50, 110, 170, 230],
  inns: [[712, 117, 760, 163, 'THE BLUE INN', '#2f6f9d'], [632, 177, 690, 223, 'CARAVANSERAI', '#c4523a'], [926, 117, 984, 163, 'THE FIG TREE', '#3e8f56']], dyers: [770, 117, 832, 163] };
function buildMarket(H) {
  const { K, W, B, F, S } = H, r = U.rng(505), put = H.put;
  const R = PLAN.byKey.market.rect, roofs = W.roofsMkt = [];
  H.patch([R[0] + 4, R[1] + 4, R[2] - 4, R[3] - 4], '#c9a983', 'walk', 0.05);
  // the hall: columns, a big skateable gable roof
  const [hx0, hz0, hx1, hz1] = MKT.hall;
  const [hlo, hhi] = groundSpan(hx0, hz0, hx1, hz1), hy = hhi + 9;
  for (let x = hx0; x <= hx1; x += 12) for (const z of [hz0, hz1]) { const gy = terrainAt(x, z); K.box(x - 0.6, gy - 1, z - 0.6, x + 0.6, hy, z + 0.6, '#7a5a3a', 'wood', { outlineT: 0.06 }); }
  for (let z = hz0 + 14; z < hz1; z += 14) for (const x of [hx0, hx1]) { const gy = terrainAt(x, z); K.box(x - 0.6, gy - 1, z - 0.6, x + 0.6, hy, z + 0.6, '#7a5a3a', 'wood', { outlineT: 0.06 }); }
  B.box(hx0 - 1, hy - 0.6, hz0 - 1, hx1 + 1, hy, hz1 + 1, '#6a4a2e', 'wood', { outlineT: 0.08 });
  W.boxes.push({ x0: hx0 - 1, y0: hy - 0.6, z0: hz0 - 1, x1: hx1 + 1, y1: hy, z1: hz1 + 1, tag: 'hallroof', nocam: true });
  H.roof(hx0 - 1, hz0 - 1, hx1 + 1, hz1 + 1, hy, 9, '#a0523a', false);
  W.camBoxes.push({ x0: hx0, y0: hy, z0: hz0, x1: hx1, y1: hy + 9, z1: hz1 });
  H.reserve([hx0 - 3, hz0 - 3, hx1 + 3, hz1 + 3]);
  // shades as steps up two of the hall's posts, to its roof
  shadeSteps(H, { f: 's', cx: hx0 + 30, cz: hz1 + 1, nx: 0, nz: 1, L: 9 }, hy, r, ['#c4523a', '#f6f1e7']);
  shadeSteps(H, { f: 'n', cx: hx1 - 30, cz: hz0 - 1, nx: 0, nz: -1, L: 9 }, hy, r, ['#3e8f86', '#f6f1e7']);
  // stalls: a counter of goods under an awning on four poles (taut canvas: land on one and it throws you up)
  const GOODS = { fruit: ['#e85a3a', '#f2b23a', '#7ac04a', '#c83a6a', '#f2e04a', '#ff8a3a'], spice: ['#c8501e', '#e8a020', '#8a3a1e', '#d8c040', '#a82a1e'], flower: H.FLOWERS, cloth: ['#c4302b', '#2f6f9d', '#f2c14e', '#7a3a9e', '#3e8f56', '#f6f1e7', '#d9408a'] };
  const stall = (x, z, col, kind = 'fruit', ah = 2.75) => {
    const y = terrainAt(x, z), w = 3.6, d = 1.6, x0 = x - w / 2, z0 = z - d / 2, x1 = x + w / 2, z1 = z + d / 2, G = GOODS[kind];
    K.box(x0, y - 0.5, z0, x1, y + 0.9, z1, '#8a6a4a', 'wood', { outlineT: 0.04 });
    for (let k = 0; k < 4; k++) {
      const gx = U.lerp(x0 + 0.5, x1 - 0.5, (k + 0.5) / 4), c = pick(r, G);
      if (kind === 'cloth') put(H.SH.BOX, gx, y + 1.05, z, 0.7, 0.3, 1.2, c, 'plain', 0.02);
      else if (kind === 'spice') { put(H.SH.CYL, gx, y + 0.98, z, 0.34, 0.16, 0.34, '#d8cfbf', 'plain', 0.02); put(H.SH.CONE, gx, y + 1.26, z, 0.3, 0.42, 0.3, c, 'plain', 0); }
      else put(H.SH.ICO, gx, y + 1.08, z, 0.4, kind === 'flower' ? 0.42 : 0.28, 0.4, c, 'flat', 0);
    }
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) put(H.SH.CYL, px, y + ah / 2, pz, 0.06, ah, 0.06, '#4a3a2a', 'plain', 0);
    B.add(new THREE.BoxGeometry(w + 0.6, 0.08, d + 1.4), new THREE.Matrix4().makeRotationX(0.18).setPosition(x, y + ah + 0.15, z), col, 'plain', { outlineT: 0.04, edges: false });
    W.boxes.push({ x0: x - w / 2, y0: y + ah - 0.25, z0: z - (d + 1.4) / 2, x1: x + w / 2, y1: y + ah + 0.2, z1: z + (d + 1.4) / 2, tag: 'bounce', nocam: true });
    F.box(x0, y, z0, x1, y + ah, z1, col);
    H.sound(x, y + 1, z, 2.2, 'crate');
    return y;
  };
  const vendors = [];
  for (let x = hx0 + 10; x < hx1 - 6; x += 9) for (const z of [hz0 + 18, hz0 + 34, hz0 + 50]) { const y = stall(x, z, pick(r, SHADES), 'fruit'); vendors.push([x, z + 1.8, Math.PI, y]); }
  const MX0 = 560, MX1 = 960, lanesZ = MKT.lanes, crossX = MKT.cross;
  for (const z of lanesZ) H.line([[MX0 - 10, z], [MX1 + 10, z]], 2.6);
  buildRecordShop(H, r);
  marketTower(H, MKT.tower[0], MKT.tower[1]);
  // the great market: rows of stalls all round the hall, each part of the field with its own trade
  const GM = MKT.field;
  H.patch(GM, '#dcc59c', 'tiles', 0.065);
  const rows = [[-120, 'cloth'], [-108, 'cloth'], [-96, 'spice'], [4, 'fruit'], [16, 'fruit'], [28, 'flower'], [40, 'flower']].map(([z, k]) => [z, k, GM[0] + 6, GM[2] - 4]);
  for (const z of [-70, -58, -46, -34, -22]) rows.push([z, 'spice', GM[0] + 6, hx0 - 8], [z, 'cloth', hx1 + 10, GM[2] - 4]);
  rows.forEach(([z, kind, xa, xb], ri) => {
    for (let x = xa, k = 0; x < xb; x += 8.5, k++) {
      if (crossX.some(c => Math.abs(x - c) < 4.6) || k % 6 === 5) continue;
      if (!H.clearOf(x - 2.4, z - 1.4, x + 2.4, z + 1.4, 1.2)) continue;
      const y = stall(x, z, pick(r, SHADES), kind, 2.75 + ((k + ri) % 3) * 0.55); vendors.push([x, z + 1.8, Math.PI, y]);
      H.reserve([x - 2.4, z - 1.4, x + 2.4, z + 1.4]);
    }
  });
  // strings of lanterns over the aisles (grinds)
  for (const x of [652, 752, 852]) for (const [za, zb] of [[-127, -86], [-4, 47]]) {
    if (!H.clearOf(x - 0.4, za - 0.4, x + 0.4, za + 0.4, 0.1) || !H.clearOf(x - 0.4, zb - 0.4, x + 0.4, zb + 0.4, 0.1)) continue;
    const y0 = terrainAt(x, za), y1 = terrainAt(x, zb);
    K.cyl(x, y0 - 0.2, za, 0.1, 6.7, '#4a3a2a', { outline: 0.02, seg: 5 }); K.cyl(x, y1 - 0.2, zb, 0.1, 6.7, '#4a3a2a', { outline: 0.02, seg: 5 });
    K.rail([[x, y0 + 6.3, za], [x, y1 + 6.3, zb]], { kind: 'cable', lanterns: true, posts: false, sag: 0.6 });
  }
  // inns and the dyers' yard claim their ground before the rows of shops
  for (const [x0, z0, x1, z1, name, band] of MKT.inns) if (H.clearPts(x0, z0, x1, z1, 2)) buildInn(H, x0, z0, x1, z1, r, name, band, roofs);
  if (H.clearPts(...MKT.dyers, 2)) buildDyers(H, ...MKT.dyers, r);
  // rows of flat-roofed shops along every lane
  const shopCols = ['#f4ecd8', '#efe0c0', '#e8c890', '#d9a066', '#f6f1e7', '#e0b070', '#d08a5a', '#f0d8a8', '#e8d0b0'];
  const mrow = (z, side, off, o = {}) => {
    const built = []; let x = R[0] + 10;
    while (x < R[2] - 10) {
      const w = 8 + r() * 7, d = 10 + r() * (o.covered ? 3 : 5);
      if (crossX.some(c => x < c + 5 && x + w > c - 5)) { x += 2; continue; }
      const z0 = side > 0 ? z + off : z - off - d, z1 = side > 0 ? z + off + d : z - off;
      if (H.clearOf(x + 0.05, z0 + 0.05, x + w - 0.05, z1 - 0.05, 0)) {
        flatHouse(H, x, z0, x + w, z1, o.covered ? 6.6 + r() * 1.8 : 5.5 + r() * 5.5, pick(r, shopCols), r, { list: roofs, front: side > 0 ? 'n' : 's', covered: o.covered });
        built.push([x, x + w]);
      }
      x += w;
    }
    return built;
  };
  for (const z of lanesZ) {
    const covered = z < -150, off = covered ? 4.6 : z === -130 || z === 50 ? 9 : 7;
    const N = z === 50 ? [] : mrow(z, -1, off, { covered }), Sd = z === -130 ? [] : mrow(z, 1, off, { covered });
    if (!covered) continue;
    // the covered lanes: beams from wall to wall carrying canvas (it bounces) and slatted screens (you can walk on those); lanterns under
    const cov = (L, p) => L.some(([a, b]) => p >= a && p <= b); let run = null;
    for (let x = R[0] + 12, k = 0; x < R[2] - 16; x += 6, k++) {
      const ok = cov(N, x + 0.3) && cov(N, x + 5.7) && cov(Sd, x + 0.3) && cov(Sd, x + 5.7) && !crossX.some(c => Math.abs(x + 3 - c) < 8);
      if (!ok) { run = null; continue; }
      const y = Math.max(terrainAt(x, z), terrainAt(x + 6, z)) + 5.2, m = k % 5;
      put(H.SH.BOX, x, y - 0.18, z, 0.3, 0.3, off * 2, '#5a4030', 'wood', 0.03);
      if (m === 2) K.box(x + 0.2, y - 0.04, z - off + 0.05, x + 5.8, y + 0.12, z + off - 0.05, '#a07a4a', 'wood', { outlineT: 0.04 });
      else if (m !== 4) {
        const c = SHADES[(k * 3 + (z < -200 ? 1 : 4)) % SHADES.length];
        B.box(x + 0.3, y, z - off + 0.05, x + 5.7, y + 0.1, z + off - 0.05, c, 'plain', { outlineT: 0.03, edges: false });
        B.box(x + 2.4, y + 0.1, z - off + 0.05, x + 3.6, y + 0.12, z + off - 0.05, '#f6f1e7', 'plain', { outlineT: 0, edges: false });
        W.boxes.push({ x0: x + 0.3, y0: y - 0.35, z0: z - off + 0.05, x1: x + 5.7, y1: y + 0.1, z1: z + off - 0.05, tag: 'bounce' });
      }
      if (k % 2 === 0) { K.sphere(x, y - 0.75, z, 0.3, ['#ffd27a', '#ff9a6a', '#ffe9b0'][k % 3], { kind: 'glow', outline: 0.03, seg: 8, sy: 1.25 }); W.lamps.push([x, y - 0.7, z]); if (k % 4 === 0) H.pool(x, z, 5, '#ffc870'); }
      if (run && Math.abs(run[4] - (y - 0.1)) < 1.5) run[2] = x + 6; else (W.indoor = W.indoor || []).push(run = [x, z - off, x + 6, z + off, y - 0.1]);
    }
  }
  for (const cx of crossX) H.path([[cx, R[1] + 6], [cx, R[3] - 6]], 6, '#c2a27c', 'walk');
  // roof level
  roofWays(H, roofs, r, { stair: 0.5, color: '#c9a878', rail: '#2f6f9d' });
  roofLinks(H, roofs, r, { skip: 0.1, lanterns: 0.5, maxGap: 15 });
  const alleys = lanesZ.map(z => [[MX0, z], [MX1, z]]).concat([[[604, -88], [896, -88]], [[604, -2], [896, -2]], [[604, -114], [896, -114]], [[604, 10], [896, 10]]]);
  W.marketAlleys = alleys;
  H.standers(vendors, 'market');
  H.busker('oud', 650, -45, 1.57);
  H.walkers(alleys, 90, 'market');
  (W.pigeonSpots = W.pigeonSpots || []).push([620, 120, 12], [930, -200, 10]);
}

// a flat-roofed market house. o: { list, front, covered (its front opens onto a covered lane), top, bare }
function flatHouse(H, x0, z0, x1, z1, h, col, r, o = {}) {
  const { K, W, B } = H, put = H.put;
  const bb = H.bldg(x0, z0, x1, z1, h, col, { trim: false, outline: 0.12, kind: 'house', top: o.top, roof: '#e0d4b8' });
  const c = { x0, z0, x1, z1, top: bb.top, lo: bb.lo, hi: bb.hi, rise: 0, flat: true, type: 'flat', noWay: o.bare };
  roofTerrace(H, c, r, { wall: '#f6f1e7', mkt: true, bare: o.bare, ph: o.ph, dome: !o.bare && r() < 0.14 ? pick(r, ['#f6f1e7', '#2f6f9d', '#3e8f86', '#e8c890']) : null });
  if (o.front) {
    const fr = faceFrame(o.front, x0, z0, x1, z1), [gl, gh] = frGround(fr, 0.6), hw = fr.L / 2 - 0.8;
    // a band of colour along the foot of the wall
    const bd = frBox(fr, -fr.L / 2, fr.L / 2, 0, 0.06); B.box(bd[0], gl - 0.5, bd[1], bd[2], gh + 0.5, bd[3], pick(r, ['#2f6f9d', '#c4523a', '#3e8f86', '#e8b84a', '#8a5a9e']), 'plain', { outlineT: 0, edges: false });
    if (o.covered) {
      // an open shop: a dark opening, goods set out in front and hung on the wall
      const b = frBox(fr, -hw, hw, 0, 0.12); B.box(b[0], gh + 0.1, b[1], b[2], gh + 3.0, b[3], '#3a2a22', 'plain', { outlineT: 0, edges: false });
      const what = Math.floor(r() * 4);
      for (let k = 0, n = Math.max(2, Math.floor(hw)); k < n; k++) {
        const u = U.lerp(-hw + 0.5, hw - 0.5, (k + 0.5) / n), [px, pz] = frPt(fr, u, 0.75), c2 = pick(r, SHADES);
        if (what === 0) { const q = frBox(fr, u - 0.45, u + 0.45, 0.13, 0.19); B.box(q[0], gh + 0.9, q[1], q[2], gh + 2.9, q[3], c2, 'plain', { outlineT: 0.02, edges: false }); }      // carpets
        else if (what === 1) { put(H.SH.CYL, px, gh + 0.3, pz, 0.32, 0.6, 0.32, '#b8643f', 'plain', 0.03); put(H.SH.CONE, px, gh + 0.78, pz, 0.28, 0.4, 0.28, pick(r, ['#c8501e', '#e8a020', '#d8c040', '#8a3a1e']), 'plain', 0); }   // sacks of spice
        else if (what === 2) { put(H.SH.ICO, px, gh + 0.32, pz, 0.36, 0.36, 0.36, pick(r, ['#b8643f', '#2f6f9d', '#f6f1e7', '#3e8f86']), 'flat', 0.03); }                           // pots
        else { const [lx, lz] = frPt(fr, u, 0.5); put(H.SH.CYL, lx, gh + 2.75, lz, 0.015, 0.5, 0.015, '#2a2838', 'plain', 0); K.sphere(lx, gh + 2.35, lz, 0.2, pick(r, ['#ffd27a', '#ff9a6a', '#7fd3ff', '#ff7ab0']), { kind: 'glow', outline: 0.02, seg: 6, sy: 1.2 }); }   // lamps
      }
      if (r() < 0.5) { const [px, pz] = frPt(fr, (r() - 0.5) * hw, 1.3); H.standers([[px, pz, frYaw(fr), terrainAt(px, pz)]], 'market'); }
    } else shopFront(H, fr, gh, r, c, { steps: 0.22 });
    if (!o.covered && bb.top - gh > 8.6 && r() < 0.5) gallery(H, fr, gh + 6.2, r, { rail: '#2f6f9d', floor: '#f6f1e7' });
  }
  H.reserve([x0, z0, x1, z1]);
  if (o.list) o.list.push(c);
  return c;
}

// a courtyard inn: a square of rooms round a yard, a gallery on posts all round inside, gateways north and south
function buildInn(H, x0, z0, x1, z1, r, name, band, roofs) {
  const { K, W, B } = H, put = H.put, t = 9, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wall = '#f4ecd8', gw = 2.8;
  const [lo, hi] = groundSpan(x0, z0, x1, z1), top = hi + 8.4, gy = hi + 4.1;
  const wing = (a0, c0, a1, c1) => flatHouse(H, a0, c0, a1, c1, 0, wall, r, { list: roofs, top, bare: true, ph: 0.3 });
  for (const [c0, c1] of [[z0, z0 + t], [z1 - t, z1]]) {
    wing(x0, c0, cx - gw, c1); wing(cx + gw, c0, x1, c1);
    K.box(cx - gw, hi + 4.6, c0, cx + gw, top, c1, wall, 'house', { outlineT: 0.1 });
    for (const s of [-1, 1]) for (const [e0, e1] of [[c0 - 0.12, c0 + 0.5], [c1 - 0.5, c1 + 0.12]]) B.box(cx + s * gw - 0.3, lo - 1, e0, cx + s * gw + 0.3, hi + 4.6, e1, band, 'plain', { outlineT: 0.03, edges: false });
    B.box(cx - gw - 0.3, hi + 4.6, c0 - 0.12, cx + gw + 0.3, hi + 5.1, c1 + 0.12, band, 'plain', { outlineT: 0.03, edges: false });
  }
  wing(x0, z0 + t, x0 + t, z1 - t); wing(x1 - t, z0 + t, x1, z1 - t);
  for (const f of ['n', 's', 'w', 'e']) { const fr = faceFrame(f, x0, z0, x1, z1), b = frBox(fr, -fr.L / 2, fr.L / 2, 0, 0.07); B.box(b[0], lo - 1, b[1], b[2], hi + 1.1, b[3], band, 'plain', { outlineT: 0, edges: false }); if (f === 'n' || f === 's') wallSign(H, name, fr, 0, hi + 6.2, 8, 1.2, band, '#fff6e0'); }
  // the yard
  const Y = [x0 + t, z0 + t, x1 - t, z1 - t], gd = 2.2, I = [Y[0] + gd, Y[1] + gd, Y[2] - gd, Y[3] - gd];
  H.patch(Y, '#e0cfa8', 'tiles', 0.07);
  for (const [a0, c0, a1, c1] of [[Y[0], Y[1], Y[2], I[1]], [Y[0], I[3], Y[2], Y[3]], [Y[0], I[1], I[0], I[3]], [I[2], I[1], Y[2], I[3]]]) K.box(a0, gy - 0.18, c0, a1, gy, c1, '#e6dfd2', 'plain', { outlineT: 0.04 });
  for (let x = I[0]; x <= I[2] + 0.1; x += (I[2] - I[0]) / 4) for (const z of [I[1], I[3]]) put(H.SH.CYL, x, (terrainAt(x, z) + gy) / 2 - 0.2, z, 0.16, gy - terrainAt(x, z) + 0.2, 0.16, band, 'plain', 0.03);
  for (let z = I[1] + (I[3] - I[1]) / 3; z < I[3] - 1; z += (I[3] - I[1]) / 3) for (const x of [I[0], I[2]]) put(H.SH.CYL, x, (terrainAt(x, z) + gy) / 2 - 0.2, z, 0.16, gy - terrainAt(x, z) + 0.2, 0.16, band, 'plain', 0.03);
  // stairs: from the yard to the gallery (west side), from the gallery to the roof (east side); the railing leaves room for the first
  const g0 = terrainAt(I[0] + 1, I[1] + 1) + 0.04;
  K.ramp(I[0] + 0.1, I[1] + 0.2, I[0] + 1.8, I[3], 'z', g0, gy, '#c9a878', true, 0, 'wood');
  K.rail([[I[0] + 2.0, gy + 0.95, I[3]], [I[2], gy + 0.95, I[3]], [I[2], gy + 0.95, I[1]], [I[0], gy + 0.95, I[1]], [I[0], gy + 0.95, I[3]]], { color: band, radius: 0.06, round: 0, postMax: 1.3, voice: 'balcony' });
  K.rail([[I[0] + 1.85, g0 + 0.95, I[1] + 0.2], [I[0] + 1.85, gy + 0.95, I[3]]], { color: band, radius: 0.06, round: 0, postMax: 6 });
  K.ramp(I[2] + 0.3, I[1], Y[2] - 0.2, I[3], 'z', top, gy, '#c9a878', true, 0, 'wood');
  // a tree, tables, lanterns from roof to roof
  H.planter(cx, cz, 4, 4, { h: 0.6, tree: '#5f8f4a' });
  H.cafe(I[0] + 3.5, cz + 3.5, cx - 2, I[3] - 1, 'market', r, { table: '#f6f1e7', chair: band, busy: 0.6 });
  K.rail([[Y[0], top + 0.5, cz - 5], [Y[2], top + 0.5, cz + 5]], { kind: 'cable', lanterns: true, posts: false, sag: 0.5 });
  K.rail([[Y[0], top + 0.5, cz + 6], [Y[2], top + 0.5, cz - 6]], { kind: 'cable', lanterns: ['#ffd27a', '#ffe9b0'], posts: false, sag: 0.5 });
  H.reserve([x0, z0, x1, z1]);
}

// the dyers' yard: stone vats of colour (their rims grind), long cloths drying on high lines
function buildDyers(H, x0, z0, x1, z1, r) {
  const { K, W, B } = H, put = H.put, cx = (x0 + x1) / 2;
  const DYES = ['#c4302b', '#e8862a', '#f2c14e', '#3e8f56', '#2f8f9d', '#2f4f9d', '#7a3a9e', '#d9408a', '#8a3a1e', '#1f6a6a', '#e4572e', '#5a3a8a'];
  H.reserve([x0, z0, x1, z1]);
  H.patch([x0, z0, x1, z1], '#bfae92', 'paving', 0.07);
  const wall = { h: 1.2, w: 0.6, color: '#f4ecd8', top: '#2f4f9d' };
  for (const z of [z0 + 0.4, z1 - 0.4]) { H.ledge([[x0 + 0.4, z], [cx - 3.5, z]], wall); H.ledge([[cx + 3.5, z], [x1 - 0.4, z]], wall); }
  for (const x of [x0 + 0.4, x1 - 0.4]) H.ledge([[x, z0 + 0.4], [x, z1 - 0.4]], wall);
  let k = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const vx = x0 + 8 + i * 8, vz = z0 + 10 + j * 13, vy = terrainAt(vx, vz), c = DYES[k++];
    K.cyl(vx, vy - 0.5, vz, 2.7, 1.45, '#d8cfbf', { outline: 0.06, seg: 16 }); K.cyl(vx, vy + 0.9, vz, 2.25, 0.08, c, { outline: 0, seg: 16 });
    W.boxes.push({ x0: vx - 2.4, y0: vy - 1, z0: vz - 2.4, x1: vx + 2.4, y1: vy + 0.95, z1: vz + 2.4, tag: 'vat' });
    K.rail(pArc(vx, vz, 2.5, 0, Math.PI * 2 * 23 / 24, vy + 0.99, vy + 0.99, Math.PI * 2 * 2.5 / 24), { hidden: true, loop: true, voice: 'balcony' });
    H.sound(vx, vy + 1, vz, 3, 'bin');
    if (r() < 0.5) H.blob(vx + 3.2, vz + 3.4, 1.6, 1.2, c, 'paint', 0.09, k);
  }
  // drying lines: tall posts north and south, cloths hanging between
  for (let i = 0, lx = x0 + 42; lx < x1 - 4; lx += 5, i++) {
    const a = [lx, z0 + 5], b = [lx, z1 - 5], ya = terrainAt(a[0], a[1]), yb = terrainAt(b[0], b[1]);
    K.cyl(a[0], ya - 0.3, a[1], 0.12, 7.6, '#6a4a2e', { outline: 0.03, seg: 6 }); K.cyl(b[0], yb - 0.3, b[1], 0.12, 7.6, '#6a4a2e', { outline: 0.03, seg: 6 });
    K.rail([[a[0], ya + 7.1, a[1]], [b[0], yb + 7.1, b[1]]], { kind: 'cable', laundry: DYES.slice(i * 3 % 9, i * 3 % 9 + 4), cloth: 3.6, posts: false, sag: 0.3, color: '#e9e4f5' });
  }
  const gy = terrainAt(cx, z0);
  for (const s of [-1, 1]) K.cyl(cx + s * 3.6, gy - 0.3, z0 + 0.4, 0.14, 5.6, '#2f4f9d', { outline: 0.03, seg: 6 });
  H.sign('DYERS', cx, gy + 4.6, z0 + 0.4, 0, 6.6, 1.3, '#2f4f9d', '#fff6e0');
  H.standers([[x0 + 12, z0 + 16.5, 0.6, terrainAt(x0 + 12, z0 + 16.5)], [x0 + 28, z0 + 29.5, 2.4, terrainAt(x0 + 28, z0 + 29.5)], [x0 + 46, z0 + 20, -1.5, terrainAt(x0 + 46, z0 + 20)]], 'market');
}

// the market's clock tower: striped, with a belvedere on top; you can see it from most of the district
function marketTower(H, x, z) {
  const { K, W, B, F } = H, put = H.put, y = terrainAt(x, z), s = 3.6, h = 30, wall = '#efe0c0';
  H.reserve([x - 6, z - 6, x + 6, z + 6]);
  K.box(x - s, y - 1.5, z - s, x + s, y + h, z + s, wall, 'brick', { outlineT: 0.14 });
  for (const [a, c] of [[5, '#2f6f9d'], [14.5, '#c4523a'], [26.5, '#2f6f9d']]) B.box(x - s - 0.12, y + a, z - s - 0.12, x + s + 0.12, y + a + 1.2, z + s + 0.12, c, 'plain', { outlineT: 0, edges: false });
  K.box(x - s - 0.9, y + h, z - s - 0.9, x + s + 0.9, y + h + 0.5, z + s + 0.9, '#d8cfbf', 'paving', { outlineT: 0.06 });
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.box(x + a * s - 0.4, y + h + 0.5, z + b * s - 0.4, x + a * s + 0.4, y + h + 4.6, z + b * s + 0.4, wall, 'plain', { outlineT: 0.05 });
  B.box(x - s - 0.6, y + h + 4.6, z - s - 0.6, x + s + 0.6, y + h + 5.2, z + s + 0.6, '#d8cfbf', 'plain', { outlineT: 0.05 });
  B.add(new THREE.ConeGeometry(6.2, 7, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(x, y + h + 8.7, z), '#2f6f9d', 'roof', { outlineT: 0.1 });
  K.sphere(x, y + h + 12.6, z, 0.6, '#c9a24a', { outline: 0.05, seg: 10 });
  const e = s + 0.75, ry = y + h + 0.55;
  K.rail([[x - e, ry, z - e], [x + e, ry, z - e], [x + e, ry, z + e], [x - e, ry, z + e]], { hidden: true, loop: true, round: 0 });
  // a clock on each face, MARKET written under it
  [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]].forEach(([fx, fz, yaw]) => {
    const px = x + fx * (s + 0.08), pz = z + fz * (s + 0.08);
    B.add(new THREE.CylinderGeometry(2.0, 2.0, 0.14, 20), (fx ? new THREE.Matrix4().makeRotationZ(Math.PI / 2) : new THREE.Matrix4().makeRotationX(Math.PI / 2)).setPosition(px, y + 21.5, pz), '#f6f1e7', 'plain', { outlineT: 0.06, edges: false });
    put(H.SH.BOX, px + fx * 0.1, y + 22.1, pz + fz * 0.1, fx ? 0.06 : 0.14, 1.3, fz ? 0.06 : 0.14, '#1b1a24', 'plain', 0);
    put(H.SH.BOX, px + fx * 0.1 + fz * 0.4, y + 21.5, pz + fz * 0.1 + fx * 0.4, fx ? 0.06 : 0.9, 0.14, fz ? 0.06 : 0.9, '#1b1a24', 'plain', 0);
    H.sign('MARKET', px + fx * 0.1, y + 10.2, pz + fz * 0.1, yaw, 6.4, 1.5, '#c4523a', '#fff6e0', { oneSide: true });
  });
  F.box(x - s, y, z - s, x + s, y + h + 5, z + s, wall); F.add(new THREE.ConeGeometry(6, 7, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(x, y + h + 8.7, z), '#2f6f9d');
  H.lamp(x - 6.5, z + 6.5, { style: 'globe', h: 3.8 }); H.lamp(x + 6.5, z - 6.5, { style: 'globe', h: 3.8 });
  W.marketTower = { x, y, z };
}

// the record shop: a sunken yard with crates of records and string lights (hidden spot)
function buildRecordShop(H, r) {
  const { K, W, B, F, S } = H;
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
  // a real cellar: a roof over the room (the ramp stays open to the sky), lights strung under it
  const ry = gy + 0.25;
  K.box(cx0 + 6.6, ry, cz0 - 0.2, cx1 + 0.2, ry + 0.5, cz1 + 0.2, '#b9a88e', 'paving', { outlineT: 0.06 });
  K.box(cx0 + 6, fy + 3.1, cz0, cx0 + 6.6, ry + 0.5, cz1 - 8.5, '#8a5a42', 'brick', { outlineT: 0.05 });       // wall between ramp and room, a doorway at the bottom end
  K.box(cx0 + 6, fy - 0.6, cz0, cx0 + 6.6, fy + 3.1, cz1 - 14, '#8a5a42', 'brick', { outlineT: 0.05 });
  (W.camBoxes = W.camBoxes || []).push({ x0: cx0 + 6.6, y0: ry - 0.1, z0: cz0, x1: cx1, y1: ry + 0.6, z1: cz1 });
  (W.indoor = W.indoor || []).push([cx0 + 6, cz0, cx1, cz1, ry]);
  K.rail([[cx0 + 8, fy + 3.3, cz0 + 2], [cx1 - 1, fy + 3.3, cz1 - 2]], { kind: 'cable', lanterns: ['#ffd27a', '#ff9a6a'], posts: false, sag: 0.4, deco: true });
  K.rail([[cx1 - 1, fy + 3.3, cz0 + 2], [cx0 + 8, fy + 3.3, cz1 - 2]], { kind: 'cable', lanterns: ['#ffd27a', '#ff9a6a'], posts: false, sag: 0.4, deco: true });
  for (let i = 0; i < 4; i++) B.box(cx0 + 9 + i * 4, ry - 0.25, (cz0 + cz1) / 2 - 0.5, cx0 + 10 + i * 4, ry - 0.05, (cz0 + cz1) / 2 + 0.5, '#fff2c8', 'lamp', { outlineT: 0, edges: false });
  // you can't miss it now: a giant record standing on the roof, a RECORDS board over the way down, a sign over the door
  { const dx = cx0 + 12, dz = cz0 + 4, dy = ry + 0.5;
    B.add(new THREE.CylinderGeometry(2.6, 2.6, 0.22, 24), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(dx, dy + 2.9, dz), '#14101f', 'plain', { outlineT: 0.07, edges: false });
    for (const k of [-1, 1]) B.add(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 20), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(dx, dy + 2.9, dz + k * 0.13), '#e4572e', 'plain', { outlineT: 0, edges: false });
    K.box(dx - 1.2, dy, dz - 0.5, dx + 1.2, dy + 0.35, dz + 0.5, '#2a2838', 'plain', { outlineT: 0.04 });
    W.boxes.push({ x0: dx - 2.6, y0: dy, z0: dz - 0.2, x1: dx + 2.6, y1: dy + 5.5, z1: dz + 0.2, tag: 'sign' });
    H.sign('RECORDS', cx0 + 3, gy + 4.2, cz0 - 0.6, 0, 6, 1.5, '#e4572e', '#fff6e0');
    for (const sx of [cx0 + 0.3, cx0 + 5.7]) K.cyl(sx, terrainAt(sx, cz0 - 0.6), cz0 - 0.6, 0.1, gy + 3.5 - terrainAt(sx, cz0 - 0.6), '#2a2838', { outline: 0.03, seg: 6 });
    H.sign('RECORD SHOP  ♪', cx0 + 6.62 - 0.72, fy + 3.5, cz1 - 5, -Math.PI / 2, 5, 0.9, '#1b1a24', '#ffd27a', { oneSide: true, bare: true });
  }
  H.reserve([cx0 - 4, cz0 - 4, cx1 + 4, cz1 + 4]);
  H.spot('cellar', (cx0 + cx1) / 2, (cz0 + cz1) / 2, 17); W.spots[W.spots.length - 1].y = fy;
  H.bench(cx0 + 12, cz1 - 3, true, { y: fy, view: false });
}
