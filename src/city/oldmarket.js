// ============================================================
//  OLD TOWN — steep lanes between rows of houses in five quarters
//  (each its own colours), little squares, courtyards, a chapel,
//  playgrounds; roofs you can get onto and travel across
// ============================================================
function buildOldTown(H) {
  const { K, W, B, F, S } = H, r = U.rng(404), put = H.put;
  // the compact city's old town: a round quarter on its hill. Lanes climb from the ring street to the square at
  // the top (and a small lane circles the square); outside the ring, lanes run down to the quarter's edge.
  // outside the wall: from each gate out to the ring street, and lanes running down from the ring to the
  // quarter's edge (the walled town inside is laid out by buildWalledTown)
  const RC = OLDWALL.c, ring = (a) => [RC[0] + Math.cos(a) * 132, RC[1] + Math.sin(a) * 103], gate = (a) => [RC[0] + Math.cos(a) * (OLDWALL.rx + 4), RC[1] + Math.sin(a) * (OLDWALL.rz + 4)];
  const lanes = [];
  for (const a of OLDWALL.gates) lanes.push([gate(a), ring(a)]);
  lanes.push([ring(-Math.PI / 4), [470, -580], [520, -600]], [ring(Math.PI / 8), [520, -400], [570, -390]], [ring(Math.PI / 4), [470, -300], [520, -280]],
    [ring(-Math.PI * 3 / 4), [140, -560], [90, -580]], [ring(Math.PI * 7 / 8), [110, -410], [60, -400]], [ring(Math.PI * 3 / 4), [170, -330], [150, -300]]);
  const R = PLAN.byKey.oldtown.rect;
  // the open places: each is reserved, and joined to the nearest lane by a side lane
  const links = [];
  for (const p of OLD_PADS) {
    const [x, z, hf] = p; H.reserve([x - hf, z - hf, x + hf, z + hf]);
    let bd = 1e9, bq = null;
    for (const L of lanes) for (let i = 0; i < L.length - 1; i++) { const [ax, az] = L[i], dx = L[i + 1][0] - ax, dz = L[i + 1][1] - az, u = U.clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), qx = ax + dx * u, qz = az + dz * u, dd = Math.hypot(qx - x, qz - z); if (dd < bd) { bd = dd; bq = [qx, qz]; } }
    if (bd > hf * 0.7) { const k = (bd - hf * 0.7) / bd; links.push([[bq[0], bq[1]], [bq[0] + (x - bq[0]) * k, bq[1] + (z - bq[1]) * k]]); p.link = bq; }
  }
  const sq = OLDWALL.square;  // the square at the top of the hill, inside the walls
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
  buildWalledTown(H, r);
  for (const L of lanes) { H.path(L, 7, '#b8a88c', 'walk'); H.line(L, 3.5); }
  for (const L of links) { H.path(L, 5, '#b8a88c', 'walk'); H.line(L, 2.6); }
  W.oldLanes = lanes.concat(links, W.oldLanesIn || []);
  for (const p of OLD_PADS) oldPad(H, p, r);
  // rows of houses round each open place, facing in
  for (const p of OLD_PADS) {
    const [x, z, hf, kind] = p; if (kind === 'court') continue;
    if (!oldWallIn(x, z, -6)) continue;        // (outside the wall the open places stand among the village houses)
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
  for (let i = 0, n = 0; i < 0 && n < 9; i++) {      // (no courtyard blocks in the compact old town's outskirts)
    const x = U.lerp(R[0] + 26, R[2] - 26, r()), z = U.lerp(R[1] + 24, R[3] - 24, r());
    if (oldWallIn(x, z, -26) || !H.clearOf(x - 17, z - 15, x + 17, z + 15, 2)) continue;
    const [lo, hi] = groundSpan(x - 17, z - 15, x + 17, z + 15); if (hi - lo > 7) continue;
    courtBlock(H, x, z, r); n++;
  }
  // short rows tucked into the gaps between lanes
  for (let i = 0; i < 0; i++) {      // (no terrace rows outside the wall either)
    const alongX = r() < 0.5, n = 2 + Math.floor(r() * 3), len = n * 8.6, x = U.lerp(R[0] + 6, R[2] - 6 - (alongX ? len : 11), r()), z = U.lerp(R[1] + 6, R[3] - 6 - (alongX ? 11 : len), r());
    if (oldWallIn(x, z, -20) || !H.clearOf(x, z, x + (alongX ? len : 11.5), z + (alongX ? 11.5 : len), 2.4)) continue;
    terraceRow(H, alongX, alongX ? x : z, (alongX ? x : z) + len, alongX ? z : x, 1, r, { shop: 0.12 });
  }
  // and single houses in what is left
  // outside the wall: small houses, each in its garden (fruit trees, a shed, a vegetable patch)
  for (let i = 0; i < 700; i++) {
    const x = U.lerp(R[0] + 6, R[2] - 6, r()), z = U.lerp(R[1] + 6, R[3] - 6, r()), w = 5.5 + r() * 2.5, d = 6 + r() * 2.5;
    if (oldWallIn(x, z, -18) || !H.clearOf(x - w / 2 - 5, z - d / 2 - 5, x + w / 2 + 5, z + d / 2 + 5, 1)) continue;
    oldHouse(H, x - w / 2, z - d / 2, x + w / 2, z + d / 2, r, { type: pick(r, ['gable', 'steep', 'gable', 'timber']), h: 3.6 + r() * 2.2 });
    const gx = x + (r() < 0.5 ? -1 : 1) * (w / 2 + 3.5), gz = z + (r() - 0.5) * d;
    if (r() < 0.5) H.blob(gx, gz, 2.6, 1.8, '#6a5a3a', 'gravel', 0.06, i);
    else H.tree(gx, gz, { s: 0.6, h: 2.4, color: pick(r, ['#6f9a4a', '#8aa04a', '#5f8f45']), far: false });
    if (r() < 0.35) { const sx = x + (r() - 0.5) * w, sz = z + (r() < 0.5 ? -1 : 1) * (d / 2 + 3); const y = terrainAt(sx, sz); K.box(sx - 1.2, y - 0.3, sz - 1, sx + 1.2, y + 2.1, sz + 1, '#8a6a4a', 'wood', { outlineT: 0.05 }); }
    H.reserve([x - w / 2 - 5, z - d / 2 - 5, x + w / 2 + 5, z + d / 2 + 5]);
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

// ---------- the walled town: a fortified wall with round towers and four gates, cobbles inside, and
// short houses packed wall to wall in rows round irregular blocks ----------
const OLDWALL = { c: [300, -440], rx: 114, rz: 86, gates: [0, Math.PI / 2, Math.PI, -Math.PI / 2], square: [330, -444] };
function oldWallIn(x, z, m = 0) { const W = OLDWALL; return ((x - W.c[0]) / (W.rx - m)) ** 2 + ((z - W.c[1]) / (W.rz - m)) ** 2 < 1; }
function buildWalledTown(H, r) {
  const { K, W, B, F, S } = H, OW = OLDWALL, [cx0, cz0] = OW.c;
  // the station's stairways come up in here: keep them clear
  for (const st of (W.metro ? W.metro.stations : [])) for (const e of (st.exits || [])) H.reserve([e.hole[0] - 2, e.hole[1] - 2, e.hole[2] + 2, e.hole[3] + 2]);
  // cobbles: one paved oval over the whole town inside the wall, following the ground
  { const pos = [], NR = 26, NA = 128, pt = (i, k) => { const f = i / NR, a = k / NA * Math.PI * 2, x = cx0 + Math.cos(a) * (OW.rx - 0.5) * f, z = cz0 + Math.sin(a) * (OW.rz - 0.5) * f; return [x, terrainAt(x, z) + 0.1, z]; };
    for (let i = 0; i < NR; i++) for (let k = 0; k < NA; k++) { const a = pt(i, k), b = pt(i + 1, k), c = pt(i + 1, k + 1), d = pt(i, k + 1); pos.push(...a, ...c, ...b, ...a, ...d, ...c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    if (g.attributes.normal.array[1] < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
    B.add(g, null, '#d8d0c4', 'cobble', { outlineT: 0, edges: false }); }
  // lanes: two main ones crossing near the square (gate to gate), two more each way, a little crooked
  const gx = (a) => [cx0 + Math.cos(a) * OW.rx, cz0 + Math.sin(a) * OW.rz];
  const LX = [cx0 - 64, cx0, cx0 + 66], LZ = [cz0 - 52, cz0];       // the lanes' lines (none south of the main one: the station's stairways come up there)
  const lanes = [
    [gx(Math.PI), [cx0, cz0], gx(0)], [gx(-Math.PI / 2), [cx0, cz0], gx(Math.PI / 2)],
    [[cx0 - 100, LZ[0]], [cx0 + 100, LZ[0]]],
    [[LX[0], cz0 - 80], [LX[0], cz0 + 80]], [[LX[2], cz0 - 80], [LX[2], cz0 + 80]],
  ];
  const clip = (L) => { const out = []; let cur = []; for (let i = 0; i < L.length - 1; i++) { const [ax, az] = L[i], [bx, bz] = L[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 3); for (let k = 0; k <= n; k++) { const p = [U.lerp(ax, bx, k / n), U.lerp(az, bz, k / n)]; if (oldWallIn(p[0], p[1], 3)) cur.push(p); else if (cur.length) { out.push(cur); cur = []; } } } if (cur.length) out.push(cur); return out.filter(c => c.length > 1); };
  W.oldLanesIn = [];
  // (the lanes are the cobbles themselves: just a gutter down the middle, and kept clear)
  lanes.forEach((L, i) => { for (const c of clip(L)) { H.path(c, 0.45, '#5f584e', 'plain'); H.line(c, i < 2 ? 2.4 : 1.6); W.oldLanesIn.push(c); } });
  // the square
  const sq = OW.square, sqR = [sq[0] - 24, sq[1] - 20, sq[0] + 24, sq[1] + 20];
  H.reserve(sqR);
  // blocks between the lanes' lines: houses all the way round each one, touching, fronts to the lane
  const xs = [cx0 - OW.rx, LX[0], LX[1], LX[2], cx0 + OW.rx], zs = [cz0 - OW.rz, LZ[0], LZ[1], cz0 + OW.rz];
  const half = (k, n, main) => (k === 0 || k === n - 1) ? 0 : (k === main ? 2.5 : 1.7);      // lane half widths: 5 m main lanes, 3.4 m small ones
  const row = (alongX, a0, a1, c0, c1, front) => {
    // one row of houses from a0 to a1 (along x or z), between c0 and c1 across, no gaps
    let a = a0;
    while (a1 - a > 3.5) {
      let w = 4.2 + r() * 2.2; if (a1 - (a + w) < 3.8) w = a1 - a;
      const [x0, z0, x1, z1] = alongX ? [a, c0, a + w, c1] : [c0, a, c1, a + w];
      const ok = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].every(([x, z]) => oldWallIn(x, z, 2.6));      // (houses back onto the wall)
      if (ok && H.clearOf(x0 + 0.15, z0 + 0.15, x1 - 0.15, z1 - 0.15, 0)) {        // (neighbours touch)
        const q = oldQ((x0 + x1) / 2, (z0 + z1) / 2), types = q.types.filter(t => t !== 'tower' && t !== 'terrace');
        const tall = r() < 0.1;
        oldHouse(H, x0, z0, x1, z1, r, { front, shop: 0.3, type: pick(r, types.length ? types : ['gable']), slopeX: !alongX ? false : true, h: tall ? 9.5 + r() * 2 : 5.8 + r() * 3, jetty: r() < 0.6 });
      }
      a += w;
    }
  };
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const bx0 = xs[i] + half(i, xs.length, 2) + 0.3, bx1 = xs[i + 1] - half(i + 1, xs.length, 2) - 0.3, bz0 = zs[j] + half(j, zs.length, 2) + 0.3, bz1 = zs[j + 1] - half(j + 1, zs.length, 2) - 0.3;
    if (bx1 - bx0 < 12 || bz1 - bz0 < 12) continue;
    const d = 7.5 + r() * 2;
    row(true, bx0, bx1, bz0, bz0 + d, 'n'); row(true, bx0, bx1, bz1 - d, bz1, 's');
    row(false, bz0 + d, bz1 - d, bx0, bx0 + d, 'w'); row(false, bz0 + d, bz1 - d, bx1 - d, bx1, 'e');
    // a second ring behind the first, back to back, facing a little court in the middle (medieval blocks are full)
    { const ix0 = bx0 + d, ix1 = bx1 - d, iz0 = bz0 + d, iz1 = bz1 - d, d2 = 6 + r() * 1.5;
      if (ix1 - ix0 > 2 * d2 + 8 && iz1 - iz0 > 2 * d2 + 8) {
        row(true, ix0, ix1, iz0, iz0 + d2, 's'); row(true, ix0, ix1, iz1 - d2, iz1, 'n');
        row(false, iz0 + d2, iz1 - d2, ix0, ix0 + d2, 'e'); row(false, iz0 + d2, iz1 - d2, ix1 - d2, ix1, 'w');
      } }
    // the yard in the middle: a tree or a well
    const mx = (bx0 + bx1) / 2, mz = (bz0 + bz1) / 2;
    if (bx1 - bx0 > 2 * d + 6 && bz1 - bz0 > 2 * d + 6 && oldWallIn(mx, mz, 10) && H.clearOf(mx - 2, mz - 2, mx + 2, mz + 2, 0)) H.tree(mx, mz, { s: 0.8, color: '#5f8f4a', color2: '#7aa055' });
  }
  // and along the inside of the wall, wherever the blocks left room: houses backing onto it
  for (let k = 0; k < 220; k++) {
    const a = k / 220 * Math.PI * 2, d = 7.5 + r() * 2, w = 4.4 + r() * 2, f = 1 - (2.8 + d / 2) / Math.min(OW.rx, OW.rz);
    const cx = cx0 + Math.cos(a) * OW.rx * f, cz = cz0 + Math.sin(a) * OW.rz * f, ew = Math.abs(Math.cos(a) * OW.rz) > Math.abs(Math.sin(a) * OW.rx);
    const hx = ew ? d / 2 : w / 2, hz = ew ? w / 2 : d / 2, x0 = cx - hx, z0 = cz - hz, x1 = cx + hx, z1 = cz + hz;
    if (![[x0, z0], [x1, z0], [x0, z1], [x1, z1]].every(([x, z]) => oldWallIn(x, z, 2.6)) || !H.clearOf(x0 + 0.15, z0 + 0.15, x1 - 0.15, z1 - 0.15, 0)) continue;
    const q = oldQ(cx, cz), types = q.types.filter(t => t !== 'tower' && t !== 'terrace');
    oldHouse(H, x0, z0, x1, z1, r, { front: ew ? (Math.cos(a) > 0 ? 'w' : 'e') : (Math.sin(a) > 0 ? 'n' : 's'), shop: 0.2, type: pick(r, types.length ? types : ['gable']), slopeX: !ew, h: 5.8 + r() * 3, jetty: r() < 0.5 });
  }
  // lamps on the lanes
  // ROOF ROUTES: across the lanes, where the houses either side stand about as high, a plank from eave to eave
  // (cross the town at roof level); elsewhere washing lines a little under the eaves (grinds) with laundry
  { const topAt = (x, z) => { let t = -1e9; for (let b = W.boxes.length - 1, n = 0; b >= 0 && n < 60000; b--, n++) { const q = W.boxes[b]; if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1 && q.y1 > t) t = q.y1; } return t; };
    const lau = ['#ffffff', '#e4572e', '#2f8f9d', '#f2c14e', '#d9779a', '#8fb7cc'];
    W.oldLanesIn.forEach((c, li) => {
      const w = li < 2 ? 2.5 : 1.7;
      for (let k = 3; k < c.length - 3; k += 4) {
        const [x, z] = c[k], [px, pz] = c[k - 1], [nx, nz] = c[k + 1], dx = nx - px, dz = nz - pz, L = Math.hypot(dx, dz) || 1, vx = -dz / L, vz = dx / L;
        const ax = x + vx * (w + 1.0), az = z + vz * (w + 1.0), bx = x - vx * (w + 1.0), bz = z - vz * (w + 1.0);
        const ha = topAt(ax, az), hb = topAt(bx, bz), g = terrainAt(x, z);
        if (ha < g + 4 || hb < g + 4) continue;                         // a house both sides
        const ex = (o) => [x + vx * o, z + vz * o];
        if (Math.abs(ha - hb) < 1.2 && r() < 0.6) {
          const y = Math.max(ha, hb), [p0x, p0z] = ex(w + 0.6), [p1x, p1z] = ex(-w - 0.6);
          const m = new THREE.Matrix4().makeRotationY(-Math.atan2(vz, vx)).setPosition(x, y - 0.12, z);
          B.add(new THREE.BoxGeometry(w * 2 + 1.6, 0.18, 1.1), m, '#8a6a4a', 'wood', { outlineT: 0.04, edges: false });
          W.boxes.push({ x0: Math.min(p0x, p1x) - 0.55, y0: y - 0.25, z0: Math.min(p0z, p1z) - 0.55, x1: Math.max(p0x, p1x) + 0.55, y1: y, z1: Math.max(p0z, p1z) + 0.55, tag: 'plank' });
        } else {
          const y = Math.min(ha, hb) - 1.4, [p0x, p0z] = ex(w + 0.15), [p1x, p1z] = ex(-w - 0.15);
          K.rail([[p0x, y, p0z], [p1x, y, p1z]], { kind: 'cable', color: '#e9e4f5', sag: 0.08, posts: false });
          for (let t = 0.18; t < 0.86; t += 0.17) { const fx = U.lerp(p0x, p1x, t), fz = U.lerp(p0z, p1z, t), sq = 0.5 + r() * 0.4;
            B.add(new THREE.BoxGeometry(0.06 + Math.abs(vz) * sq, 0.6 + r() * 0.3, 0.06 + Math.abs(vx) * sq), new THREE.Matrix4().makeTranslation(fx, y - 0.45 - Math.sin(t * Math.PI) * 0.15, fz), pick(r, lau), 'plain', { outlineT: 0.02, edges: false }); }
        }
        k += Math.floor(r() * 3);
      }
    }); }
  for (const c of W.oldLanesIn) for (let k = 4; k < c.length; k += 9) { const [x, z] = c[k]; if (H.clearOf(x + 2.2, z - 0.3, x + 2.8, z + 0.3, 0)) H.lamp(x + 2.5, z, { style: 'globe', h: 3.4, color: '#2a2a32' }); }
  // ---- the wall: a stone ring with a walk on top and battlements, round towers, gate towers over the main lanes ----
  const N = 128, P = [], stone = '#b3a68e', cap = '#cbbfa6';
  for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; P.push({ a, x: cx0 + Math.cos(a) * OW.rx, z: cz0 + Math.sin(a) * OW.rz }); }
  const near = (a, list, da) => list.some(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < da);
  const towers = [Math.PI / 4, Math.PI * 3 / 4, -Math.PI / 4, -Math.PI * 3 / 4, Math.PI / 8 * 3, -Math.PI / 8 * 3, Math.PI / 8 * 5, -Math.PI / 8 * 5];
  const top = (x, z) => terrainAt(x, z) + 7.5;
  const ob = (ax, az, bx, bz, thick, y0, y1, col, kind, ol = 0.06) => { const L = Math.hypot(bx - ax, bz - az), m = new THREE.Matrix4().makeRotationY(Math.atan2(bx - ax, bz - az)).setPosition((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2); B.add(new THREE.BoxGeometry(thick, y1 - y0, L + 0.25), m, col, kind, { outlineT: ol, edges: false }); };
  let walk = [];
  const flushWalk = () => { if (walk.length > 3) K.rail(walk, { color: '#e9e4f5', postColor: '#6a6458', postMax: 0.9, round: 2 }); walk = []; };
  for (let k = 0; k < N; k++) {
    const A = P[k], Bp = P[(k + 1) % N], am = (A.a + Bp.a + (k === N - 1 ? Math.PI * 2 : 0)) / 2;
    if (near(am, OW.gates, 0.075)) { flushWalk(); continue; }       // the gateway
    const ya = top(A.x, A.z), yb = top(Bp.x, Bp.z), yt = (ya + yb) / 2, y0 = Math.min(terrainAt(A.x, A.z), terrainAt(Bp.x, Bp.z)) - 1.5;
    ob(A.x, A.z, Bp.x, Bp.z, 3.2, y0, yt, stone, 'brick', 0.08);
    ob(A.x, A.z, Bp.x, Bp.z, 3.6, yt - 0.05, yt + 0.25, cap, 'paving', 0.04);
    S.add(A.x, yt + 0.25, A.z, Bp.x, yt + 0.25, Bp.z, 1.5);
    F.add(new THREE.BoxGeometry(3.2, yt - y0, Math.hypot(Bp.x - A.x, Bp.z - A.z) + 0.25), new THREE.Matrix4().makeRotationY(Math.atan2(Bp.x - A.x, Bp.z - A.z)).setPosition((A.x + Bp.x) / 2, (y0 + yt) / 2, (A.z + Bp.z) / 2), stone);
    // the sides are solid (in short pieces, so the boxes hug the curve)
    for (let t = 0; t < 1; t += 0.5) { const x = U.lerp(A.x, Bp.x, t + 0.25), z = U.lerp(A.z, Bp.z, t + 0.25); W.boxes.push({ x0: x - 1.6, y0, z0: z - 1.6, x1: x + 1.6, y1: yt, z1: z + 1.6, tag: 'wall', nocam: true }); }
    // battlements on the outer edge, the walk's rail on the inner one
    const nx = Math.cos(am) / OW.rx, nz = Math.sin(am) / OW.rz, nl = Math.hypot(nx, nz), ux = nx / nl, uz = nz / nl;
    for (const t of [0.25, 0.75]) { const x = U.lerp(A.x, Bp.x, t) + ux * 1.45, z = U.lerp(A.z, Bp.z, t) + uz * 1.45; H.put(H.SH.BOX, x, yt + 0.95, z, 0.7, 1.4, 1.4, stone, 'plain', 0.04, Math.atan2(Bp.x - A.x, Bp.z - A.z)); }
    if (near(am, towers, 0.07)) { flushWalk(); continue; }
    walk.push([A.x - ux * 1.3, yt + 1.25, A.z - uz * 1.3]);
  }
  flushWalk();
  // round towers
  for (const a of towers) {
    const x = cx0 + Math.cos(a) * OW.rx, z = cz0 + Math.sin(a) * OW.rz, g = terrainAt(x, z), h = 12;
    K.cyl(x, g - 1.5, z, 4.6, h + 1.5, stone, { outline: 0.1, seg: 14, kind: 'brick' });
    K.cyl(x, g + h, z, 5.0, 0.6, cap, { outline: 0.05, seg: 14 });
    B.add(new THREE.ConeGeometry(5.4, 5, 12), new THREE.Matrix4().makeTranslation(x, g + h + 3.1, z), '#8a4a3a', 'roof', { outlineT: 0.08 });
    F.add(new THREE.CylinderGeometry(4.6, 4.6, h, 10), new THREE.Matrix4().makeTranslation(x, g + h / 2, z), stone); F.add(new THREE.ConeGeometry(5.2, 5, 10), new THREE.Matrix4().makeTranslation(x, g + h + 3, z), '#8a4a3a');
    W.boxes.push({ x0: x - 3.8, y0: g - 1.5, z0: z - 3.8, x1: x + 3.8, y1: g + h, z1: z + 3.8, tag: 'tower' });
    H.reserve([x - 6, z - 6, x + 6, z + 6]);
  }
  // gate towers: two piers either side of the lane and a room over the arch
  for (const a of OW.gates) {
    const x = cx0 + Math.cos(a) * OW.rx, z = cz0 + Math.sin(a) * OW.rz, g = terrainAt(x, z), yaw = Math.atan2(-Math.sin(a) * OW.rz, Math.cos(a) * OW.rx) ;
    const tx = -Math.sin(a) * OW.rx, tz = Math.cos(a) * OW.rz, tl = Math.hypot(tx, tz), ux = tx / tl, uz = tz / tl;       // along the wall
    for (const sd of [-1, 1]) {
      const px = x + ux * sd * 5.6, pz = z + uz * sd * 5.6;
      const m = new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz)).setPosition(px, g + 6, pz);
      B.add(new THREE.BoxGeometry(7, 15, 3.6), m, stone, 'brick', { outlineT: 0.1, edges: false });
      W.boxes.push({ x0: px - 2.4, y0: g - 1.5, z0: pz - 2.4, x1: px + 2.4, y1: g + 13.5, z1: pz + 2.4, tag: 'gate' });
    }
    const m = new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz)).setPosition(x, g + 10.5, z);
    B.add(new THREE.BoxGeometry(7, 6, 14.8), m, stone, 'brick', { outlineT: 0.1, edges: false });
    // the passage: a dark vault overhead, an arch moulding on both faces
    B.add(new THREE.BoxGeometry(6.6, 0.3, 7.4), new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz)).setPosition(x, g + 7.4, z), '#3a3430', 'plain', { outlineT: 0, edges: false });
    for (const sd of [-1, 1]) {
      const nx = uz, nz = -ux;       // across the wall
      B.add(new THREE.TorusGeometry(3.6, 0.35, 6, 16, Math.PI), new THREE.Matrix4().makeRotationY(Math.atan2(-uz, ux)).setPosition(x + nx * sd * 3.55, g + 3.9, z + nz * sd * 3.55), cap, 'plain', { outlineT: 0.04, edges: false });
    }
    B.add(new THREE.ConeGeometry(8.4, 5, 4), new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz) + Math.PI / 4).setPosition(x, g + 16, z), '#8a4a3a', 'roof', { outlineT: 0.08 });
    for (const sd of [-1, 1]) F.add(new THREE.BoxGeometry(7, 15, 3.6), new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz)).setPosition(x + ux * sd * 5.6, g + 6, z + uz * sd * 5.6), stone);
    F.add(new THREE.BoxGeometry(7, 6, 14.8), new THREE.Matrix4().makeRotationY(Math.atan2(ux, uz)).setPosition(x, g + 10.5, z), stone);     // (seen from afar, you still see through the gate)
    W.boxes.push({ x0: x - 4, y0: g + 7.5, z0: z - 4, x1: x + 4, y1: g + 13.5, z1: z + 4, tag: 'gate' });
  }
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
  const stall = (x, z, col, kind = 'fruit', ah = 2.75, rot = false) => {
    const y = terrainAt(x, z), w = rot ? 1.6 : 3.6, d = rot ? 3.6 : 1.6, x0 = x - w / 2, z0 = z - d / 2, x1 = x + w / 2, z1 = z + d / 2, G = GOODS[kind];
    K.box(x0, y - 0.5, z0, x1, y + 0.9, z1, '#8a6a4a', 'wood', { outlineT: 0.04 });
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.5) / 4, gx = rot ? x : U.lerp(x0 + 0.5, x1 - 0.5, t), gz = rot ? U.lerp(z0 + 0.5, z1 - 0.5, t) : z, c = pick(r, G);
      if (kind === 'cloth') put(H.SH.BOX, gx, y + 1.05, gz, rot ? 1.2 : 0.7, 0.3, rot ? 0.7 : 1.2, c, 'plain', 0.02);
      else if (kind === 'spice') { put(H.SH.CYL, gx, y + 0.98, gz, 0.34, 0.16, 0.34, '#d8cfbf', 'plain', 0.02); put(H.SH.CONE, gx, y + 1.26, gz, 0.3, 0.42, 0.3, c, 'plain', 0); }
      else put(H.SH.ICO, gx, y + 1.08, gz, 0.4, kind === 'flower' ? 0.42 : 0.28, 0.4, c, 'flat', 0);
    }
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) put(H.SH.CYL, px, y + ah / 2, pz, 0.06, ah, 0.06, '#4a3a2a', 'plain', 0);
    const aw = rot ? w + 1.4 : w + 0.6, ad = rot ? d + 0.6 : d + 1.4;
    B.add(new THREE.BoxGeometry(aw, 0.08, ad), (rot ? new THREE.Matrix4().makeRotationZ(-0.18) : new THREE.Matrix4().makeRotationX(0.18)).setPosition(x, y + ah + 0.15, z), col, 'plain', { outlineT: 0.04, edges: false });
    W.boxes.push({ x0: x - aw / 2, y0: y + ah - 0.25, z0: z - ad / 2, x1: x + aw / 2, y1: y + ah + 0.2, z1: z + ad / 2, tag: 'bounce', nocam: true });
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
  // ---- things to ride, one kind per trade ----
  // SPICE: heaps of paprika, turmeric, saffron, sumac in shallow trays: soft cones to ride up like kickers
  const heap = (x, z, rad, ht) => {
    if (!H.clearOf(x - rad - 0.6, z - rad - 0.6, x + rad + 0.6, z + rad + 0.6, 0.2)) return false;
    const y = terrainAt(x, z), c = pick(r, ['#c8462a', '#e8b02a', '#e07a1a', '#8a2a3a', '#b8a03a']);
    K.cyl(x, y - 0.1, z, rad + 0.5, 0.35, '#8a6a4a', { seg: 16, outline: 0.04, kind: 'wood' });
    B.add(new THREE.ConeGeometry(rad, ht, 14), new THREE.Matrix4().makeTranslation(x, y + 0.25 + ht / 2, z), c, 'flat', { outlineT: 0.05, edges: false });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; S.add(x + Math.cos(a) * (rad + 0.4), y + 0.2, z + Math.sin(a) * (rad + 0.4), x + Math.cos(a) * 0.3, y + 0.25 + ht - 0.15, z + Math.sin(a) * 0.3, 0.9); }
    H.reserve([x - rad - 0.6, z - rad - 0.6, x + rad + 0.6, z + rad + 0.6]);
    return true;
  };
  // BARRELS: wine and oil barrels on their sides in long lines (each line one grind along its top), and pyramids
  const barrels = (x0, z, n) => {
    const L = 1.5, R = 0.62, x1 = x0 + n * (L + 0.05);
    if (!H.clearOf(x0 - 0.5, z - 1, x1 + 0.5, z + 1, 0.3)) return false;
    const y = terrainAt((x0 + x1) / 2, z);
    for (let k = 0; k < n; k++) {
      const cx = x0 + k * (L + 0.05) + L / 2, c = pick(r, ['#7a4a2a', '#6a3a22', '#8a5a32']);
      B.add(new THREE.CylinderGeometry(R, R, L, 12), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(cx, y + R, z), c, 'wood', { outlineT: 0.04, edges: false });
      for (const o of [-0.5, 0.5]) B.add(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.1, 12), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(cx + o, y + R, z), '#3a3530', 'plain', { outlineT: 0, edges: false });
    }
    W.boxes.push({ x0, y0: y, z0: z - R * 0.8, x1, y1: y + R * 1.7, z1: z + R * 0.8, tag: 'barrel' });
    K.rail([[x0 + 0.2, y + R * 2 + 0.02, z], [x1 - 0.2, y + R * 2 + 0.02, z]], { hidden: true, voice: 'wood' });
    H.reserve([x0 - 0.5, z - 1, x1 + 0.5, z + 1]);
    return true;
  };
  const barrelPyramid = (x, z) => {
    if (!H.clearOf(x - 3, z - 2, x + 3, z + 2, 0.3)) return;
    const y = terrainAt(x, z), R = 0.62;
    for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) {
      const cx = x - (2 - row) * R * 1.05 + k * R * 2.1, cy = y + R + row * R * 1.75;
      B.add(new THREE.CylinderGeometry(R, R, 2.6, 12), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(cx, cy, z), pick(r, ['#7a4a2a', '#6a3a22', '#8a5a32']), 'wood', { outlineT: 0.04, edges: false });
      W.boxes.push({ x0: cx - R * 0.85, y0: cy - R, z0: z - 1.3, x1: cx + R * 0.85, y1: cy + R * 0.95, z1: z + 1.3, tag: 'barrel' });
    }
    H.reserve([x - 3, z - 2, x + 3, z + 2]);
  };
  // COUNTERS: fish and cheese on long marble counters, low ledges to grind down the aisle (both top edges)
  const counter = (x0, z, len, kind) => {
    const x1 = x0 + len; if (!H.clearOf(x0 - 0.5, z - 1, x1 + 0.5, z + 1, 0.3)) return false;
    const y = Math.max(terrainAt(x0, z), terrainAt(x1, z));
    K.box(x0, y - 0.4, z - 0.8, x1, y + 0.85, z + 0.8, '#e9e6df', 'plain', { outlineT: 0.05 });
    B.box(x0 + 0.3, y + 0.85, z - 0.6, x1 - 0.3, y + 0.92, z + 0.6, kind === 'fish' ? '#cfe8ef' : '#e8d9b0', 'plain', { outlineT: 0, edges: false });
    for (let x = x0 + 0.8; x < x1 - 0.6; x += 0.9) put(H.SH.BOX, x, y + 1.0, z + (r() - 0.5) * 0.6, kind === 'fish' ? 0.7 : 0.5, 0.14, kind === 'fish' ? 0.22 : 0.5, kind === 'fish' ? pick(r, ['#8aa0b0', '#c0c8d0', '#d0806a']) : pick(r, ['#f2d06a', '#e8b84a', '#f4e4b0']), 'plain', 0.02);
    for (const e of [-0.75, 0.75]) K.rail([[x0 + 0.2, y + 0.87, z + e], [x1 - 0.2, y + 0.87, z + e]], { hidden: true, voice: 'pipe' });
    H.reserve([x0 - 0.5, z - 1, x1 + 0.5, z + 1]);
    return true;
  };
  // spice heaps along the spice row and the spice side rows; barrels down the fruit rows; counters on the cloth side
  for (let x = GM[0] + 10; x < GM[2] - 8; x += 11 + r() * 8) heap(x, -90 + (r() - 0.5) * 2, 2.2 + r() * 1.2, 1.2 + r() * 0.9);
  for (const z of [-64, -40]) for (let x = GM[0] + 12; x < hx0 - 10; x += 14 + r() * 6) heap(x, z, 1.8 + r(), 1.0 + r() * 0.7);
  for (const z of [10, 22, 34]) for (let x = GM[0] + 14; x < GM[2] - 16; x += 26 + r() * 16) { if (barrels(x, z, 4 + Math.floor(r() * 5)) && r() < 0.4) barrelPyramid(x - 4, z); }
  for (const z of [-58, -34]) for (let x = hx1 + 12; x < GM[2] - 14; x += 20 + r() * 8) counter(x, z, 8 + r() * 5, r() < 0.5 ? 'fish' : 'cheese');
  // BUNTING: strings of little flags zig-zagging low over the aisles, from pole to pole (each string a grind)
  for (const za of [-102, -2, 46]) {
    let prev = null;
    for (let x = GM[0] + 8, k = 0; x < GM[2] - 6; x += 9 + r() * 3, k++) {
      const z = za + (k % 2 ? 2.6 : -2.6), gy = terrainAt(x, z);
      if (!H.clearOf(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 0)) { prev = null; continue; }
      K.cyl(x, gy, z, 0.09, 3.6, '#4a3a2a', { outline: 0.02, seg: 5 }); H.block(x, z, 0.4);
      const p = [x, gy + 3.5, z];
      if (prev) {
        K.rail([prev, p], { kind: 'cable', color: '#3a3550', sag: 0.12, posts: false });
        for (let t = 0.1; t < 0.95; t += 0.12) { const fx = U.lerp(prev[0], p[0], t), fz = U.lerp(prev[2], p[2], t), fy = U.lerp(prev[1], p[1], t) - 0.5 * Math.sin(t * Math.PI) * 0.6 - 0.25;
          B.add(new THREE.ConeGeometry(0.22, 0.42, 3), new THREE.Matrix4().makeRotationZ(Math.PI).setPosition(fx, fy, fz), pick(r, ['#e4572e', '#f2c14e', '#2f8f9d', '#ffffff', '#8a5a9e']), 'plain', { outlineT: 0, edges: false }); }
      }
      prev = p;
    }
  }
  // the LOADING YARD behind the hall: a sloped bay up to a dock, roll-up doors, a parked market truck, crates
  { const cands = [[hx1 + 14, hz0 - 34], [hx0 - 44, hz0 - 34], [hx1 + 14, hz1 + 4], [hx0 - 44, hz1 + 4]];
    for (let yz = GM[3] - 24; yz > GM[1]; yz -= 6) for (let yx = GM[2] - 32; yx > GM[0] + 10; yx -= 6) cands.push([yx, yz]);
    for (const [yx, yz] of cands) {
      if (!H.clearOf(yx, yz, yx + 30, yz + 22, 0.5)) continue;
      const y = terrainAt(yx + 15, yz + 11), dk = y + 1.3;
      K.box(yx, y - 0.5, yz, yx + 30, y + 6, yz + 3, '#b8a888', 'brick', { outlineT: 0.1 });                              // the warehouse wall
      for (const dx of [3, 12, 21]) { B.box(yx + dx, dk, yz + 3, yx + dx + 6, dk + 3.6, yz + 3.08, '#8a9098', 'plain', { outlineT: 0.02, edges: false }); for (let k = 0; k < 9; k++) B.box(yx + dx, dk + k * 0.4, yz + 3.08, yx + dx + 6, dk + k * 0.4 + 0.05, yz + 3.12, '#5a606a', 'plain', { outlineT: 0, edges: false }); B.box(yx + dx - 0.3, dk + 3.6, yz + 3, yx + dx + 6.3, dk + 3.9, yz + 3.4, '#f2c14e', 'plain', { outlineT: 0.02, edges: false }); }
      K.box(yx, y - 0.5, yz + 3, yx + 30, dk, yz + 9, '#9a9488', 'paving', { outlineT: 0.06 });                            // the dock
      K.rail([[yx + 0.3, dk + 0.02, yz + 8.85], [yx + 29.7, dk + 0.02, yz + 8.85]], { hidden: true, voice: 'pipe' });      // its edge: a grind
      for (let x = yx + 2; x < yx + 29; x += 3.5) B.box(x, dk - 0.9, yz + 9, x + 0.5, dk - 0.1, yz + 9.25, '#2a2838', 'plain', { outlineT: 0, edges: false });     // rubber bumpers
      K.ramp(yx - 10, yz + 3, yx, yz + 9, 'x', y, dk, '#b8b2a6', false, y);                                               // the sloped bay up to it
      // the truck, backed up to the dock: a cargo box to ride onto and wallride along, a cab in front
      const tx = yx + 18, tz = yz + 9.3;
      K.box(tx - 1.3, y + 0.9, tz, tx + 1.3, y + 4.3, tz + 7.5, '#f2efe6', 'plain', { outlineT: 0.08 });
      K.box(tx - 1.25, y + 0.6, tz + 7.6, tx + 1.25, y + 3.1, tz + 10, '#c4523a', 'plain', { outlineT: 0.08 });
      B.box(tx - 1.0, y + 2.0, tz + 9.95, tx + 1.0, y + 2.9, tz + 10.05, '#3a4a5a', 'plain', { outlineT: 0, edges: false });
      for (const [wx, wz] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, 6], [1.3, 6], [-1.3, 8.8], [1.3, 8.8]]) B.add(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(tx + wx, y + 0.5, tz + wz), '#2a2838', 'plain', { outlineT: 0.03, edges: false });
      for (const e of [-1.2, 1.2]) K.rail([[tx + e, y + 4.32, tz + 0.2], [tx + e, y + 4.32, tz + 7.3]], { hidden: true, voice: 'pipe' });
      for (let i = 0; i < 7; i++) { const cx = yx + 3 + r() * 24, cz = yz + 12 + r() * 8; if (!H.clearOf(cx - 0.7, cz - 0.7, cx + 0.7, cz + 0.7, 0.2)) continue; const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) K.box(cx - 0.6, y + k * 1.2, cz - 0.6, cx + 0.6, y + (k + 1) * 1.2, cz + 0.6, pick(r, ['#a27a4a', '#b8894f']), 'wood', { outlineT: 0.03 }); H.reserve([cx - 0.7, cz - 0.7, cx + 0.7, cz + 0.7]); }
      H.reserve([yx - 10, yz, yx + 30, yz + 22]);
      break;
    }
  }
  // (the rows wave a little, stalls stand at uneven spacing, now and then a few turn across the row, and the
  //  rows break here and there for a small square: a fountain to grind round, or a pile of crates to climb)
  const squares = [];
  rows.forEach(([z, kind, xa, xb], ri) => {
    const ph = r() * 6;
    for (let x = xa + r() * 3, k = 0; x < xb; k++) {
      const zz = z + Math.sin(x * 0.045 + ph) * 1.6;
      if (crossX.some(c => Math.abs(x - c) < 4.6)) { x += 5; continue; }
      if (r() < 0.07 && squares.every(q => Math.hypot(q[0] - x, q[1] - zz) > 40)) { squares.push([x + 7, zz - 1.5]); x += 16; continue; }
      const rot = r() < 0.16, hw = rot ? 1.2 : 2.4, hd = rot ? 2.4 : 1.4;
      if (!H.clearOf(x - hw, zz - hd, x + hw, zz + hd, 0.4)) { x += 3; continue; }
      const y = stall(x, zz, pick(r, SHADES), kind, 2.6 + r() * 1.3, rot); vendors.push([x, zz + 1.8, Math.PI, y]);
      H.reserve([x - hw, zz - hd, x + hw, zz + hd]);
      if (!rot && r() < 0.55 && H.clearOf(x - 2.4, zz - 4.4, x + 2.4, zz - 1.6, 0.2)) { const y2 = stall(x + (r() - 0.5) * 1.2, zz - 3, pick(r, SHADES), kind, 2.6 + r() * 1.3); vendors.push([x, zz - 4.8, 0, y2]); H.reserve([x - 2.4, zz - 4.4, x + 2.4, zz - 1.6]); }
      x += (rot ? 3.4 : 4.8) + (r() < 0.25 ? 2 + r() * 4 : r() * 1.2);
    }
  });
  squares.forEach(([x, z], qi) => {
    const y = terrainAt(x, z);
    if (qi % 2 === 0) {
      // a fountain: a round basin, its rim one ring of a grind, a jet in the middle
      if (!H.clearOf(x - 5, z - 5, x + 5, z + 5, 0)) return;
      K.cyl(x, y - 0.2, z, 4, 0.75, '#cfc3ad', { seg: 20, outline: 0.06, kind: 'paving' });
      B.add(new THREE.CircleGeometry(3.6, 20), new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(x, y + 0.5, z), '#5fb0c8', 'plain', { outlineT: 0, edges: false });
      K.cyl(x, y + 0.5, z, 0.35, 1.6, '#cfc3ad', { seg: 8, outline: 0.04 }); K.sphere(x, y + 2.3, z, 0.45, '#9fd6e6', { outline: 0.02, seg: 8 });
      const ring = []; for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 2; ring.push([x + Math.cos(a) * 3.85, y + 0.58, z + Math.sin(a) * 3.85]); }
      K.rail(ring, { hidden: true, voice: 'pipe' });
      H.sound(x, y + 1, z, 3, 'fountain'); H.reserve([x - 5, z - 5, x + 5, z + 5]);
    } else {
      // a pile of crates in steps: 1, 2, 3 high, then a jump to the nearest awnings
      if (!H.clearOf(x - 5, z - 4, x + 5, z + 4, 0)) return;
      for (let a = 0; a < 3; a++) for (let b = 0; b <= a; b++) {
        const cx = x - 3.6 + a * 2.4, cz = z - 1.2 + (b % 2) * 0.3;
        K.box(cx - 1.15, y - 0.2 + b * 1.1, cz - 1.6, cx + 1.15, y + (b + 1) * 1.1, cz + 1.6, pick(r, ['#a27a4a', '#b8894f', '#8a6a3a']), 'wood', { outlineT: 0.04 });
      }
      K.rail([[x + 1.4, y + 3.32, z - 2.6], [x + 1.4, y + 3.32, z + 0.2]], { hidden: true, voice: 'wood' });
      H.reserve([x - 5, z - 4, x + 5, z + 4]);
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
