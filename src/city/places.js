// ============================================================
//  PLACES — the forest crag, the building site, the tower.
//  Each has its own musical ambience (see SPOTS in music.js: crag, site, skydeck).
// ============================================================
const CRAG_LINK = [[-900, -831], [-852, -842], [-800, -830]];           // from the glasshouse's path to the foot of the ridge
// the zip line off the prow: from the tip, over the trees, down into the clearing by Park station
function cragZip() {
  const S = CRAG.spine, a = S[S.length - 2], b = S[S.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  return { ux, uz, top: [b[0] + ux * (CRAG.w1 - 3), b[1] + uz * (CRAG.w1 - 3)], end: [b[0] + ux * 122, b[1] + uz * 122] };
}
// claim the ground first, so the districts build round the new places
function prePlaces(H) {
  const V = VALLEY;
  H.line([[V.x, V.z0], [V.x, V.z3]], V.rimHalf + 1);
  for (let t = 0; t <= 1.0001; t += 0.02) { const [x, z] = cragAt(t), nat = cityHeight(x, z), top = U.lerp(CRAG.y0, CRAG.y1, t); H.block(x, z, U.lerp(CRAG.w0, CRAG.w1, t) + 8 + 0.3 * Math.max(0, top - nat)); }
  H.line(CRAG_LINK, 4);
  const zp = cragZip(); H.line([zp.top, zp.end], 7);
  H.reserve(SITE); H.reserve(TOWER.block);
}
function buildPlaces(H) {
  buildCrag(H); buildSite(H); buildTower(H);
}

// ---------- the crag ----------
function buildCrag(H) {
  const { K, W, B, F } = H, r = U.rng(3131), N = 64;
  // the way up: a gravel path along the spine from the glasshouse, a rail all along its outer side
  const sp = []; for (let i = 0; i <= N; i++) sp.push(cragAt(i / N * 0.985).slice());
  H.path(CRAG_LINK.concat(sp.slice(1)), 4.2, '#cdbf9e');
  const side = (i, off) => { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(N, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [sp[i][0] - (b[1] - a[1]) / L * off, sp[i][1] + (b[0] - a[0]) / L * off]; };
  for (const [i0, i1] of [[3, 30], [31, 58]]) {
    const run = []; for (let i = i0; i <= i1; i++) { const [x, z] = side(i, 3.4); run.push([x, terrainAt(x, z) + 0.95, z]); if (i % 3 === 0) H.sound(x, terrainAt(x, z), z, 1.6, 'fence'); }
    K.rail(run, { color: '#b5482e', postColor: '#5a4a40', round: 2 });
  }
  // the summit: a cairn, a pole with a pennant, benches looking out over the city, a telescope
  const [sx, sz] = sp[N], sy = terrainAt(sx, sz), zp = cragZip();
  for (let k = 0; k < 5; k++) H.put(H.SH.ICO, sx - 5 + (r() - 0.5) * 0.5, sy + 0.3 + k * 0.42, sz - 4 + (r() - 0.5) * 0.5, 0.95 - k * 0.15, 0.3, 0.9 - k * 0.14, pick(r, ['#8f8a80', '#a39d92', '#7f7a72']), 'flat', 0.04, r() * 6);
  W.boxes.push({ x0: sx - 5.8, y0: sy - 1, z0: sz - 4.8, x1: sx - 4.2, y1: sy + 1.9, z1: sz - 3.2, tag: 'rock' });
  K.cyl(sx + 4, sy - 0.3, sz - 5, 0.09, 6.3, '#e9e4f5', { outline: 0.03, seg: 6 });
  H.put(H.SH.BOX, sx + 4.85, sy + 5.5, sz - 5, 1.6, 0.9, 0.04, '#c4302b', 'plain', 0.02); H.put(H.SH.BOX, sx + 4.85, sy + 5.5, sz - 5, 0.3, 0.9, 0.06, '#f6f1e7', 'plain', 0); H.put(H.SH.BOX, sx + 4.85, sy + 5.5, sz - 5, 0.9, 0.3, 0.06, '#f6f1e7', 'plain', 0);
  W.boxes.push({ x0: sx + 3.85, y0: sy - 1, z0: sz - 5.15, x1: sx + 4.15, y1: sy + 6, z1: sz - 4.85, tag: 'lamp' });
  for (const u of [-5, 5]) { const bx = sx + zp.ux * 6 - zp.uz * u, bz = sz + zp.uz * 6 + zp.ux * u; H.bench(bx, bz, Math.abs(zp.uz) > Math.abs(zp.ux), { color: '#7a5a3a', view: true }); }
  { const tx = sx + zp.ux * 11 + zp.uz * 6, tz = sz + zp.uz * 11 - zp.ux * 6, ty = terrainAt(tx, tz); K.cyl(tx, ty, tz, 0.12, 1.1, '#3a3550', { outline: 0.02, seg: 6 }); B.add(new THREE.CylinderGeometry(0.18, 0.28, 1.2, 8), new THREE.Matrix4().makeRotationX(-0.9).setPosition(tx, ty + 1.35, tz + 0.3), '#c9a24a', 'plain', { outlineT: 0.03, edges: false }); H.sound(tx, ty + 1, tz, 2, 'telescope'); }
  H.spot('crag', sx, sz, 150, { tall: true }); W.spots[W.spots.length - 1].y = sy;
  // the zip line
  { const ty = terrainAt(zp.top[0], zp.top[1]), ey = terrainAt(zp.end[0], zp.end[1]);
    K.cyl(zp.top[0], ty - 0.5, zp.top[1], 0.16, 3.4, '#b5482e', { outline: 0.04, seg: 8 });
    K.rail([[zp.top[0], ty + 2.6, zp.top[1]], [zp.end[0], ey + 3.2, zp.end[1]]], { kind: 'cable', color: '#2a2838', sag: 0.5, posts: false, endBoost: 1.5 });
    K.cyl(zp.end[0], ey - 0.5, zp.end[1], 0.2, 4.2, '#b5482e', { outline: 0.04, seg: 8 });
    // a step up to the cable at the top
    K.box(zp.top[0] - zp.ux * 2.6 - 0.9, ty - 0.5, zp.top[1] - zp.uz * 2.6 - 0.9, zp.top[0] - zp.ux * 2.6 + 0.9, ty + 1.0, zp.top[1] - zp.uz * 2.6 + 0.9, '#8f8a80', 'paving', { outlineT: 0.05 });
  }
  // the rail down the cliff: bolted to the west face, it drops from the summit to the forest floor
  { const pts = [], n = 44, mid = cragAt(0.5), sgn = side(N / 2, 1)[0] < mid[0] ? 1 : -1;
    for (let k = 0; k <= n; k++) {
      const u = k / n, t = 0.975 - 0.56 * u, i = Math.round(t * N / 0.985), w = U.lerp(CRAG.w0, CRAG.w1, t), [cx, cz] = cragAt(t), nat = cityHeight(cx, cz), fall = 6 + 0.3 * Math.max(0, U.lerp(CRAG.y0, CRAG.y1, t) - nat);
      const a = sp[Math.max(0, Math.min(N, i) - 1)], b = sp[Math.min(N, Math.max(1, i + 1))], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, off = sgn * U.lerp(w - 1.5, w + fall + 3, U.smooth(u));
      const x = cx - (b[1] - a[1]) / L * off, z = cz + (b[0] - a[0]) / L * off;
      pts.push([x, terrainAt(x, z) + (k === 0 ? 0.5 : 1.3), z]);
    }
    K.rail(pts, { color: '#b5482e', postColor: '#5a4a40', round: 3, postMax: 9, endBoost: 1 });
  }
  // boulders at the foot of the cliffs, a few stunted pines on the ridge
  for (let k = 0; k < 70; k++) {
    const t = r(), [cx, cz] = cragAt(t), a = r() * 6.28, top = U.lerp(CRAG.y0, CRAG.y1, t), d = U.lerp(CRAG.w0, CRAG.w1, t) + 6 + 0.3 * Math.max(0, top - cityHeight(cx, cz)) + r() * 7, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (cragShape(x, z, -1e9) && terrainAt(x, z) > cityHeight(x, z) + 1.5) continue;
    if (Math.hypot(x - zp.end[0], z - zp.end[1]) < 8) continue;
    H.rock(x, z, 1.2 + r() * 2.6, r, { moss: r() < 0.5 });
  }
  for (let k = 0; k < 14; k++) { const i = 4 + Math.floor(r() * (N - 14)), [x, z] = side(i, (r() < 0.5 ? -1 : 1) * (6 + r() * 4)); if (Math.abs(terrainAt(x + 1, z) - terrainAt(x - 1, z)) < 1.2) H.pine(x, z, { s: 0.7 + r() * 0.5, color: '#2c5236', far: false }); }
}

// ---------- the building site ----------
function buildSite(H) {
  const { K, W, B, S, F } = H, r = U.rng(4141), put = H.put, y = SITE.y;
  const x0 = SITE[0] + 5, z0 = SITE[1] + 5, x1 = SITE[2] - 5, z1 = SITE[3] - 5, steel = '#c9d2da', yel = '#f2c14e';
  // hoarding all round (its top edge grinds), a gate in the east side and one in the south
  const gates = [[x1, (z0 + z1) / 2 + 14, 5], [(x0 + x1) / 2 - 10, z1, 5]];
  const fence = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 4), alongX = Math.abs(bx - ax) > Math.abs(bz - az); let run = [];
    const flush = () => { if (run.length > 1) K.rail(run, { hidden: true, round: 0 }); run = []; };
    for (let k = 0; k < n; k++) {
      const px0 = U.lerp(ax, bx, k / n), pz0 = U.lerp(az, bz, k / n), px1 = U.lerp(ax, bx, (k + 1) / n), pz1 = U.lerp(az, bz, (k + 1) / n), mx = (px0 + px1) / 2, mz = (pz0 + pz1) / 2;
      if (gates.some(g => Math.hypot(mx - g[0], mz - g[1]) < g[2])) { flush(); continue; }
      const g = Math.max(terrainAt(px0, pz0), terrainAt(px1, pz1)), top = g + 2.3;
      K.box(Math.min(px0, px1) - (alongX ? 0 : 0.1), g - 1.5, Math.min(pz0, pz1) - (alongX ? 0.1 : 0), Math.max(px0, px1) + (alongX ? 0 : 0.1), top, Math.max(pz0, pz1) + (alongX ? 0.1 : 0), k % 2 ? '#f6f1e7' : '#2f5f8a', 'plain', { outlineT: 0.04 });
      if (!run.length) run.push([px0, top + 0.03, pz0]); run.push([px1, top + 0.03, pz1]);
      if (k % 3 === 0) H.sound(mx, g + 1, mz, 1.6, 'fence');
    }
    flush();
  };
  fence(x0, z0, x1, z0); fence(x1, z0, x1, z1); fence(x1, z1, x0, z1); fence(x0, z1, x0, z0);
  H.sign('BUILDING SITE', x1 + 0.3, terrainAt(x1, gates[0][1] - 10) + 1.5, gates[0][1] - 10, Math.PI / 2, 5, 1.0, '#f2c14e', '#1b1a24', { oneSide: true });
  H.sign('MORE CITY SOON', (x0 + x1) / 2 + 2, terrainAt((x0 + x1) / 2 + 2, z1) + 1.5, z1 + 0.3, 0, 6, 1.0, '#f2c14e', '#1b1a24', { oneSide: true });

  // the frame: four concrete floors on columns, ramps of planks zig-zagging up through it
  const fx0 = x0 + 8, fz0 = z0 + 8, fx1 = fx0 + 36, fz1 = fz0 + 28, lv = 3.8, nL = 4, conc = '#b9b3a8';
  for (let k = 0; k <= nL; k++) {
    const fy = y + k * lv;
    if (k > 0) {
      // (a slot along the north edge of each floor lets the ramp through)
      K.box(fx0, fy - 0.4, fz0 + 4.2, fx1, fy, fz1, conc, 'plain', { outlineT: 0.07 });
      if (k % 2 === 1) K.box(fx0, fy - 0.4, fz0, fx0 + 4, fy, fz0 + 4.2, conc, 'plain', { outlineT: 0.07 }); else K.box(fx1 - 4, fy - 0.4, fz0, fx1, fy, fz0 + 4.2, conc, 'plain', { outlineT: 0.07 });
    }
    if (k < nL) {
      for (let a = 0; a <= 3; a++) for (let b = 0; b <= 2; b++) { const cx = U.lerp(fx0 + 0.5, fx1 - 0.5, a / 3), cz = U.lerp(fz0 + 5, fz1 - 0.5, b / 2); K.box(cx - 0.4, fy - (k ? 0 : 1), cz - 0.4, cx + 0.4, fy + lv - 0.4, cz + 0.4, '#a8a194', 'plain', { outlineT: 0.04 }); }
      // the ramp: along the north edge, east on even floors, west on odd ones
      const east = k % 2 === 0, ax = east ? fx0 + 4.5 : fx1 - 4.5, bx = east ? fx1 - 4.5 : fx0 + 4.5, rz = fz0 + 2.1;
      S.add(ax, fy + 0.03, rz, bx, fy + lv, rz, 1.9);
      B.add(new THREE.BoxGeometry(Math.hypot(bx - ax, lv), 0.16, 3.8), new THREE.Matrix4().makeRotationZ(Math.atan2(lv, bx - ax) * (east ? 1 : -1) + (east ? 0 : Math.PI)).setPosition((ax + bx) / 2, fy + lv / 2 - 0.06, rz), '#c9a878', 'wood', { outlineT: 0.04, edges: false });
      K.rail([[ax, fy + 1.0, fz0 + 0.15], [bx, fy + lv + 1.0, fz0 + 0.15]], { color: '#e4572e', postMax: 1.2, round: 0, radius: 0.06 });
      S.add(east ? bx : bx - 4.5, fy + lv, rz, east ? bx + 4.5 : bx, fy + lv, rz, 2.1);
    }
  }
  const topY = y + nL * lv;
  F.box(fx0, y, fz0, fx1, topY, fz1, conc);
  // rebar sprouting from the top floor, a stack of formwork, an orange safety rail on two sides
  for (let k = 0; k < 16; k++) { const rx = U.lerp(fx0 + 1, fx1 - 1, (k % 8) / 7), rz = k < 8 ? fz1 - 0.8 : fz0 + 6; put(H.SH.CYL, rx, topY + 0.8, rz, 0.04, 1.6, 0.04, '#8a4a3a', 'plain', 0); }
  K.box(fx0 + 14, topY, fz0 + 14, fx0 + 20, topY + 1.0, fz0 + 18, '#c9a878', 'wood', { outlineT: 0.05 });
  K.rail([[fx0 + 0.2, topY + 1.0, fz0 + 5], [fx0 + 0.2, topY + 1.0, fz1 - 0.2], [fx1 - 0.2, topY + 1.0, fz1 - 0.2]], { color: '#e4572e', postMax: 1.2, round: 0.5, radius: 0.06 });
  for (const k of [1, 2, 3]) K.rail([[fx1 - 0.15, y + k * lv + 1.0, fz0 + 6], [fx1 - 0.15, y + k * lv + 1.0, fz1 - 0.3]], { color: '#e4572e', postMax: 1.2, round: 0, radius: 0.06 });

  // scaffolding along the south face: three decks of planks, steel tubes to grind at every level
  const sz0 = fz1 + 0.6, sz1 = fz1 + 2.4;
  for (let k = 1; k <= 4; k++) {
    const dy = y + k * 2.6;
    K.box(fx0, dy - 0.12, sz0, fx1, dy, sz1, '#c9a878', 'wood', { outlineT: 0.03, nocam: true });
    K.rail([[fx0, dy + 1.0, sz1 + 0.05], [fx1, dy + 1.0, sz1 + 0.05]], { color: steel, posts: false, round: 0, radius: 0.05, voice: 'balcony' });
    for (let x = fx0 + 3; x < fx1; x += 9) H.sound(x, dy, sz1, 1.6, 'plank');
  }
  for (let x = fx0; x <= fx1 + 0.1; x += 4.5) for (const z of [sz0, sz1]) put(H.SH.CYL, x, y + 5.9, z, 0.05, 11.8, 0.05, steel, 'plain', 0.02);
  for (let k = 0; k < 4; k++) { const a = k % 2 === 0, ax = a ? fx0 + 2 : fx1 - 2, bx = a ? fx0 + 12 : fx1 - 12, ya = y + k * 2.6, yb = y + (k + 1) * 2.6, rz = sz1 + 1.3;
    S.add(ax, ya + 0.03, rz, bx, yb, rz, 0.8); S.add(bx, yb, rz, bx, yb, sz1 - 0.6, 0.8);
    B.add(new THREE.BoxGeometry(Math.hypot(bx - ax, 2.6), 0.1, 1.6), new THREE.Matrix4().makeRotationZ(Math.atan2(yb - ya, bx - ax)).setPosition((ax + bx) / 2, (ya + yb) / 2 - 0.05, rz), '#c9a878', 'wood', { outlineT: 0.03, edges: false }); }
  // from the top deck of the scaffold a long plank up onto the top floor
  S.add(fx1 - 16, y + 4 * 2.6, sz1 - 0.6, fx1 - 16, topY, fz1 - 3, 0.9);
  B.add(new THREE.BoxGeometry(1.8, 0.1, Math.hypot(sz1 + 2.4 - fz1, topY - y - 10.4)), new THREE.Matrix4().makeRotationX(Math.atan2(topY - y - 10.4, sz1 + 2.4 - fz1)).setPosition(fx1 - 16, (topY + y + 10.4) / 2 - 0.05, (sz1 - 0.6 + fz1 - 3) / 2), '#c9a878', 'wood', { outlineT: 0.03, edges: false });

  // the tower crane: lattice mast, cab, a long jib you can grind from end to end, a girder on the hook
  const cx = fx1 + 14, cz = fz0 + 10, mh = 27, jy = y + mh;
  K.box(cx - 2.6, y - 1, cz - 2.6, cx + 2.6, y + 0.8, cz + 2.6, conc, 'plain', { outlineT: 0.06 });
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.rod(V3(cx + a * 1.1, y + 0.8, cz + b * 1.1), V3(cx + a * 1.1, jy, cz + b * 1.1), 0.1, yel, 0.03);
  for (let k = 0; k < 9; k++) { const ya = y + 0.8 + k * (mh - 0.8) / 9, yb = y + 0.8 + (k + 1) * (mh - 0.8) / 9, s = k % 2 ? 1 : -1; put(H.SH.BOX, cx, yb, cz, 2.3, 0.1, 2.3, yel, 'plain', 0.02); K.rod(V3(cx - 1.1 * s, ya, cz + 1.1), V3(cx + 1.1 * s, yb, cz + 1.1), 0.05, yel, 0); K.rod(V3(cx + 1.1, ya, cz - 1.1 * s), V3(cx + 1.1, yb, cz + 1.1 * s), 0.05, yel, 0); }
  W.boxes.push({ x0: cx - 1.2, y0: y, z0: cz - 1.2, x1: cx + 1.2, y1: jy, z1: cz + 1.2, tag: 'pillar' });
  // the jib runs west over the frame, the counter-jib east; both are decks you can stand on, with a rail on the top chord
  const jx0 = cx - 46, jx1 = cx + 13;
  K.box(jx0, jy, cz - 0.6, jx1, jy + 0.25, cz + 0.6, yel, 'plain', { outlineT: 0.05, nocam: true });
  K.rail([[jx0 + 0.3, jy + 1.5, cz], [cx - 3, jy + 1.5, cz]], { color: yel, posts: false, round: 0, radius: 0.09, endBoost: 2 });
  for (let x = jx0 + 0.3; x < cx - 3; x += 4.4) { K.rod(V3(x, jy + 0.25, cz - 0.5), V3(x + 2.2, jy + 1.45, cz), 0.05, yel, 0); K.rod(V3(x + 2.2, jy + 1.45, cz), V3(x + 4.4, jy + 0.25, cz + 0.5), 0.05, yel, 0); if (Math.round(x) % 3 === 0) H.sound(x, jy + 1.5, cz, 1.6, 'container'); }
  K.box(cx - 1.6, jy + 0.25, cz - 1.6, cx + 1.6, jy + 2.9, cz + 1.6, '#f6f1e7', 'plain', { outlineT: 0.06 });
  B.box(cx - 1.65, jy + 1.3, cz - 1.65, cx + 1.65, jy + 2.3, cz + 1.65, '#3a4a5a', 'plain', { outlineT: 0, edges: false });
  K.rod(V3(cx, jy + 2.9, cz), V3(cx, jy + 9, cz), 0.12, yel, 0.03); K.rod(V3(cx, jy + 9, cz), V3(jx0 + 8, jy + 1.5, cz), 0.04, '#2a2838', 0); K.rod(V3(cx, jy + 9, cz), V3(jx1 - 2, jy + 0.3, cz), 0.04, '#2a2838', 0);
  K.sphere(cx, jy + 9.3, cz, 0.35, '#ff5a5a', { kind: 'lamp', outline: 0.03, seg: 8 });
  K.box(jx1 - 5, jy - 1.6, cz - 1.0, jx1 - 0.5, jy, cz + 1.0, '#8f8a80', 'paving', { outlineT: 0.05 });
  F.box(jx0, jy, cz - 0.6, jx1, jy + 0.6, cz + 0.6, yel, 0); F.box(cx - 1.1, y, cz - 1.1, cx + 1.1, jy, cz + 1.1, yel, 0);
  // the way onto the crane: a plank from the top floor's corner up to the jib
  { const ax = fx1 - 3, az = cz, ya = topY, bx = fx1 + 9.5;
    S.add(ax, ya + 0.03, az, bx, jy + 0.25, az, 0.9); S.add(bx, jy + 0.25, az, bx + 2, jy + 0.25, az, 0.9);
    B.add(new THREE.BoxGeometry(Math.hypot(bx - ax, jy + 0.25 - ya), 0.12, 1.8), new THREE.Matrix4().makeRotationZ(Math.atan2(jy + 0.25 - ya, bx - ax)).setPosition((ax + bx) / 2, (ya + jy + 0.25) / 2 - 0.06, az), '#c9a878', 'wood', { outlineT: 0.03, edges: false });
    for (let x = ax + 3; x < bx; x += 3) { const py = U.lerp(ya, jy + 0.25, (x - ax) / (bx - ax)); put(H.SH.CYL, x, (py + topY) / 2 - 0.1, az + 0.8, 0.05, py - topY, 0.05, steel, 'plain', 0.02); } }
  // the hook: a cable down from the jib, a steel girder hanging level over the yard (land on it, grind it)
  { const hx = jx0 + 9, gy = y + 9.5;
    K.rod(V3(hx, jy, cz), V3(hx, gy + 2.2, cz), 0.04, '#2a2838', 0);
    for (const s of [-1, 1]) K.rod(V3(hx, gy + 2.2, cz), V3(hx, gy + 0.5, cz + s * 4), 0.03, '#2a2838', 0);
    K.box(hx - 0.35, gy, cz - 5, hx + 0.35, gy + 0.5, cz + 5, '#b5482e', 'plain', { outlineT: 0.05, nocam: true });
    K.rail([[hx, gy + 0.53, cz - 4.9], [hx, gy + 0.53, cz + 4.9]], { hidden: true, voice: 'balcony' });
    H.sound(hx, gy + 0.5, cz, 3, 'container');
    // and a cable from the jib's tip down to the far corner of the yard
    K.rail([[jx0 + 0.4, jy + 0.4, cz], [x0 + 5, y + 3.2, z1 - 6]], { kind: 'cable', color: '#2a2838', sag: 0.4, posts: false });
    K.cyl(x0 + 5, y - 0.3, z1 - 6, 0.14, 3.7, steel, { outline: 0.03, seg: 6 }); }

  // the yard: site huts (two containers stacked), concrete pipes, steel beams, dirt kickers, an excavator
  const hx0 = x1 - 16, hz0 = z1 - 22;
  K.box(hx0, y - 0.5, hz0, hx0 + 12, y + 2.6, hz0 + 3, '#2f5f8a', 'plain', { outlineT: 0.07 }); K.box(hx0, y + 2.6, hz0, hx0 + 12, y + 5.2, hz0 + 3, '#f6f1e7', 'plain', { outlineT: 0.07 });
  for (const k of [0, 1]) { B.box(hx0 + 1.5, y + 1.2 + k * 2.6, hz0 + 2.98, hx0 + 4, y + 2.1 + k * 2.6, hz0 + 3.05, '#9fb8cf', 'plain', { outlineT: 0, edges: false }); B.box(hx0 + 8, y + 0.1 + k * 2.6, hz0 + 2.98, hx0 + 9.2, y + 2.2 + k * 2.6, hz0 + 3.05, '#3a4a5a', 'plain', { outlineT: 0, edges: false }); }
  S.add(hx0 - 6, y + 0.03, hz0 + 4, hx0, y + 2.6, hz0 + 4, 0.9); S.add(hx0, y + 2.6, hz0 + 4, hx0 + 12, y + 2.6, hz0 + 4, 0.9);
  B.add(new THREE.BoxGeometry(Math.hypot(6, 2.6), 0.1, 1.8), new THREE.Matrix4().makeRotationZ(Math.atan2(2.6, 6)).setPosition(hx0 - 3, y + 1.25, hz0 + 4), steel, 'plain', { outlineT: 0.03, edges: false });
  B.box(hx0, y + 2.5, hz0 + 3.1, hx0 + 12, y + 2.6, hz0 + 4.9, steel, 'plain', { outlineT: 0.03 });
  K.rail([[hx0 - 6, y + 1.0, hz0 + 4.95], [hx0, y + 3.6, hz0 + 4.95], [hx0 + 12, y + 3.6, hz0 + 4.95]], { color: steel, postMax: 4, round: 0, radius: 0.05 });
  H.sound(hx0 + 6, y + 1, hz0 + 3.5, 3, 'container');
  // pipes: a pyramid of three
  { const px = x0 + 14, pz = z1 - 14, pr = 1.15, len = 9;
    for (const [dx, dy] of [[-pr, pr], [pr, pr], [0, pr * 2.73]]) { K.rod(V3(px + dx, y + dy, pz - len / 2), V3(px + dx, y + dy, pz + len / 2), pr, '#a8a39a', 0.06); K.rod(V3(px + dx, y + dy, pz - len / 2 - 0.02), V3(px + dx, y + dy, pz - len / 2 + 0.02), pr * 0.8, '#3a3640', 0); K.rod(V3(px + dx, y + dy, pz + len / 2 - 0.02), V3(px + dx, y + dy, pz + len / 2 + 0.02), pr * 0.8, '#3a3640', 0); }
    W.boxes.push({ x0: px - 2 * pr, y0: y - 1, z0: pz - len / 2, x1: px + 2 * pr, y1: y + 2 * pr - 0.1, z1: pz + len / 2, tag: 'rock' }, { x0: px - pr * 0.8, y0: y, z0: pz - len / 2, x1: px + pr * 0.8, y1: y + pr * 3.7, z1: pz + len / 2, tag: 'rock' });
    K.rail([[px, y + pr * 3.75, pz - len / 2 + 0.2], [px, y + pr * 3.75, pz + len / 2 - 0.2]], { hidden: true }); H.sound(px, y + 2, pz, 3, 'bin'); }
  // steel beams laid out in the yard (low ledges)
  for (const [bx, bz, len, ax] of [[x0 + 30, z1 - 8, 12, true], [x0 + 32, z1 - 11, 10, true], [x1 - 26, z0 + 14, 9, false], [x1 - 22, z0 + 12, 12, false]]) {
    const hx = ax ? len / 2 : 0.25, hz = ax ? 0.25 : len / 2;
    K.box(bx - hx, y - 0.2, bz - hz, bx + hx, y + 0.5, bz + hz, '#b5482e', 'plain', { outlineT: 0.04 });
    K.rail(ax ? [[bx - hx + 0.1, y + 0.53, bz], [bx + hx - 0.1, y + 0.53, bz]] : [[bx, y + 0.53, bz - hz + 0.1], [bx, y + 0.53, bz + hz - 0.1]], { hidden: true, voice: 'balcony' });
  }
  // heaps of earth: two are kickers
  for (const [kx, kz, dir] of [[x0 + 44, z1 - 26, 1], [x1 - 34, z1 - 12, -1]]) {
    S.add(kx, y + 0.03, kz, kx + dir * 5, y + 1.7, kz, 1.8);
    B.add(new THREE.BoxGeometry(Math.hypot(5, 1.7), 0.5, 3.6), new THREE.Matrix4().makeRotationZ(Math.atan2(1.7, 5) * dir).setPosition(kx + dir * 2.5, y + 0.62, kz), '#9a7f58', 'plain', { outlineT: 0.05, edges: false });
    put(H.SH.ICO, kx + dir * 5.4, y + 0.5, kz, 1.6, 1.3, 2.4, '#8a7050', 'flat', 0.06);
  }
  put(H.SH.ICO, x0 + 8, y + 1.2, z1 - 34, 5, 3, 4.2, '#9a7f58', 'flat', 0.08, 0.5); W.boxes.push({ x0: x0 + 5, y0: y - 1, z0: z1 - 36.5, x1: x0 + 11, y1: y + 3.4, z1: z1 - 31.5, tag: 'rock' });
  // the excavator
  { const ex = x1 - 30, ez = z1 - 30;
    K.box(ex - 2.2, y - 0.2, ez - 1.6, ex + 2.2, y + 0.9, ez + 1.6, '#2a2838', 'plain', { outlineT: 0.05 });
    K.box(ex - 1.7, y + 0.9, ez - 1.4, ex + 1.5, y + 2.9, ez + 1.4, yel, 'plain', { outlineT: 0.06 });
    B.box(ex - 1.72, y + 1.7, ez - 1.0, ex - 0.4, y + 2.7, ez + 1.42, '#3a4a5a', 'plain', { outlineT: 0, edges: false });
    K.rod(V3(ex - 1.2, y + 2.4, ez - 0.8), V3(ex - 4.6, y + 5.2, ez - 0.8), 0.28, yel, 0.04); K.rod(V3(ex - 4.6, y + 5.2, ez - 0.8), V3(ex - 6.8, y + 1.4, ez - 0.8), 0.22, yel, 0.04);
    put(H.SH.BOX, ex - 6.9, y + 0.9, ez - 0.8, 1.2, 1.0, 1.3, '#3a3640', 'plain', 0.04, 0, 0, 0.4);
    K.rail([[ex - 1.2, y + 2.75, ez - 0.8], [ex - 4.6, y + 5.55, ez - 0.8]], { hidden: true }); }
  // cones, floodlights, people at work
  for (let k = 0; k < 14; k++) { const px = U.lerp(x0 + 6, x1 - 6, r()), pz = U.lerp(fz1 + 8, z1 - 4, r()); put(H.SH.CONE, px, y + 0.35, pz, 0.22, 0.7, 0.22, '#e4572e', 'plain', 0.02); put(H.SH.BOX, px, y + 0.03, pz, 0.5, 0.06, 0.5, '#e4572e', 'plain', 0); }
  for (const [lx, lz] of [[x0 + 3, z0 + 3], [x1 - 3, z0 + 3], [x0 + 3, z1 - 3], [x1 - 3, z1 - 3]]) H.lamp(lx, lz, { h: 8, glow: '#fff6d8', sound: false });
  H.standers([[fx0 + 10, sz1 + 5, 2.6], [fx0 + 11.5, sz1 + 5.6, -1.2], [hx0 + 5, hz0 + 6.5, 0], [x1 - 27, z1 - 26, 1.2], [fx0 + 20, fz0 + 16, 0.4, y + lv], [fx0 + 9, fz0 + 20, 2.2, y + 2 * lv], [cx - 6, cz + 9, 3.6]], 'docks');
  H.group(x0 + 26, z1 - 20, 3, 'docks');
  H.spot('site', (x0 + x1) / 2, (z0 + z1) / 2, 78, { tall: true }); W.spots[W.spots.length - 1].y = y;
}

// ---------- the tower ----------
function buildTower(H) {
  const { K, W, B, S, F } = H, put = H.put, cx = TOWER.x, cz = TOWER.z, y = TOWER.y, R = TOWER.block;
  const deckY = Math.max((W.bizTop || 0) + 45, y + 200), glassC = '#8fb7cc', red = '#e4572e';
  TOWER.deckY = deckY;
  // the plaza it stands in: paving, trees in planters, benches
  H.patch(R, '#d8cfbf', 'tiles', 0.075);
  for (const [px, pz] of [[R[0] + 10, R[1] + 10], [R[2] - 10, R[1] + 10], [R[0] + 10, R[3] - 10], [R[2] - 10, R[3] - 10], [R[0] + 10, cz], [R[2] - 10, cz]]) H.planter(px, pz, 3.4, 3.4, { h: 0.55, tree: pick(U.rng(px | 0), ['#5aa35a', '#6fb25e', '#4a8f4a']) });
  for (const [bx, bz, ax] of [[cx - 18, R[3] - 8, true], [cx + 18, R[3] - 8, true], [R[0] + 8, cz - 22, false], [R[2] - 8, cz + 22, false]]) H.bench(bx, bz, ax, { color: '#5a4a3a' });
  // the shaft: three tiers of glass, a red fin up each corner
  const tiers = [[15, 0.46], [12, 0.8], [9.5, 1]]; let y0 = y - 2;
  for (const [hw, f] of tiers) {
    const y1 = y + (deckY - 1.2 - y) * f;
    K.box(cx - hw, y0, cz - hw, cx + hw, y1, cz + hw, glassC, 'tower', { roofColor: '#c9c2b4', outlineT: 0.18 });
    B.box(cx - hw - 0.25, y1 - 0.8, cz - hw - 0.25, cx + hw + 0.25, y1 - 0.1, cz + hw + 0.25, '#2a2838', 'plain', { outlineT: 0, edges: false });
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(H.SH.BOX, cx + a * hw, (y0 + y1) / 2, cz + b * hw, 1.1, y1 - y0, 1.1, red, 'plain', 0.03);
    F.box(cx - hw, y0, cz - hw, cx + hw, y1, cz + hw, glassC, 0.2);
    y0 = y1;
  }
  // the sky deck: an open platform wider than the shaft, a rail all round it (one long square grind)
  const dh = 21;
  K.box(cx - dh, deckY - 1.2, cz - dh, cx + dh, deckY, cz + dh, '#cfc8bb', 'paving', { outlineT: 0.1 });
  B.box(cx - dh - 0.3, deckY - 1.6, cz - dh - 0.3, cx + dh + 0.3, deckY - 1.2, cz + dh + 0.3, red, 'plain', { outlineT: 0.04, edges: false });
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.rod(V3(cx + a * 9.5, deckY - 9, cz + b * 9.5), V3(cx + a * (dh - 1), deckY - 1.4, cz + b * (dh - 1)), 0.3, '#2a2838', 0.04);
  K.rail([[cx - dh + 0.4, deckY + 1.05, cz - dh + 0.4], [cx + dh - 0.4, deckY + 1.05, cz - dh + 0.4], [cx + dh - 0.4, deckY + 1.05, cz + dh - 0.4], [cx - dh + 0.4, deckY + 1.05, cz + dh - 0.4]], { loop: true, color: '#e9e4f5', postColor: '#6a6458', postMax: 1.3, round: 1.5, radius: 0.07 });
  F.box(cx - dh, deckY - 1.6, cz - dh, cx + dh, deckY, cz + dh, '#cfc8bb', 0);
  // on the deck: the lift's pavilion, benches at the edge, telescopes, the mast with its red light
  const px0 = cx - 3.5, pz0 = cz - 4, px1 = cx + 3.5, pz1 = cz + 3;
  K.box(px0, deckY, pz0, px1, deckY + 3.6, pz1, '#f6f1e7', 'plain', { outlineT: 0.08 });
  B.box(px0 - 0.5, deckY + 3.6, pz0 - 0.5, px1 + 0.5, deckY + 3.9, pz1 + 0.5, red, 'plain', { outlineT: 0.05 });
  K.cyl(cx, deckY + 3.9, cz - 0.5, 0.35, 16, '#d9d4ea', { outline: 0.04, seg: 8 }); K.cyl(cx, deckY + 19.9, cz - 0.5, 0.12, 12, '#d9d4ea', { outline: 0.03, seg: 6 });
  K.sphere(cx, deckY + 32.3, cz - 0.5, 0.6, '#ff5a5a', { kind: 'lamp', outline: 0.04, seg: 8 });
  F.add(new THREE.CylinderGeometry(0.3, 0.6, 28, 5), new THREE.Matrix4().makeTranslation(cx, deckY + 18, cz - 0.5), '#d9d4ea');
  for (const [bx, bz, ax] of [[cx - 10, cz + dh - 3, true], [cx + 10, cz + dh - 3, true], [cx - dh + 3, cz - 8, false], [cx + dh - 3, cz + 8, false], [cx, cz - dh + 3, true]]) H.bench(bx, bz, ax, { y: deckY + 0.02, color: '#5a4a3a', view: true });
  for (const [tx, tz] of [[cx - 16, cz + dh - 1.6], [cx + 16, cz + dh - 1.6], [cx + dh - 1.6, cz - 14], [cx - dh + 1.6, cz + 14]]) { K.cyl(tx, deckY, tz, 0.12, 1.1, '#3a3550', { outline: 0.02, seg: 6 }); B.add(new THREE.CylinderGeometry(0.18, 0.28, 1.2, 8), new THREE.Matrix4().makeRotationX(-0.9).setPosition(tx, deckY + 1.35, tz + 0.3), '#c9a24a', 'plain', { outlineT: 0.03, edges: false }); H.sound(tx, deckY + 1, tz, 2, 'telescope'); }
  for (const [lx, lz] of [[cx - dh + 2, cz - dh + 2], [cx + dh - 2, cz - dh + 2], [cx - dh + 2, cz + dh - 2], [cx + dh - 2, cz + dh - 2]]) H.lamp(lx, lz, { y: deckY, h: 3.4, style: 'globe', sound: 'lamp' });
  H.spot('skydeck', cx, cz, 46); W.spots[W.spots.length - 1].y = deckY;
  // the lift: a lit doorway in the foot of the tower, and another in the pavilion on the deck
  const door = (dx, dz, dy, label) => {
    B.box(dx - 1.5, dy, dz - 0.06, dx + 1.5, dy + 2.9, dz + 0.1, '#1f2a36', 'plain', { outlineT: 0, edges: false });
    for (const [a, b] of [[-1.4, -0.05], [0.05, 1.4]]) B.box(dx + a, dy + 0.1, dz + 0.1, dx + b, dy + 2.7, dz + 0.16, '#c9d2da', 'plain', { outlineT: 0, edges: false });
    B.box(dx - 1.75, dy, dz + 0.05, dx - 1.5, dy + 3.1, dz + 0.3, red, 'plain', { outlineT: 0.03, edges: false }); B.box(dx + 1.5, dy, dz + 0.05, dx + 1.75, dy + 3.1, dz + 0.3, red, 'plain', { outlineT: 0.03, edges: false });
    B.box(dx - 1.75, dy + 2.9, dz + 0.05, dx + 1.75, dy + 3.2, dz + 0.3, red, 'plain', { outlineT: 0.03, edges: false });
    B.box(dx - 0.5, dy + 3.3, dz + 0.1, dx + 0.5, dy + 3.55, dz + 0.22, '#ffe9b0', 'lamp', { outlineT: 0, edges: false });
    H.sign(label, dx, dy + 4.3, dz + 0.2, 0, 4.6, 0.9, '#1b1a24', '#ffe9b0', { oneSide: true });
    W.lamps.push([dx, dy + 3.4, dz + 1]); H.pool(dx, dz + 2.5, 5, '#ffc870', dy);
  };
  const gz = cz + 15, gy = terrainAt(cx, gz + 2);
  door(cx, gz, gy, 'LIFT · SKY DECK'); door(cx, pz1, deckY, 'LIFT · STREET');
  K.box(cx - 3, gy + 3.3, gz, cx + 3, gy + 3.5, gz + 3.4, '#2a2838', 'plain', { outlineT: 0.04, nocam: true });
  H.patch([cx - 2, gz, cx + 2, gz + 9], red, 'paint', 0.11);
  wallSign(H, 'THE NEEDLE', faceFrame('s', cx - 15, cz - 15, cx + 15, cz + 15), 0, gy + 7.4, 10, 1.8, red, '#fff6e0');
  W.lifts = [{ ax: cx, ay: gy, az: gz + 1.6, bx: cx, by: deckY, bz: pz1 + 1.6, r: 1.5 }];
  // the way down: a red pipe winding five times round the tower, from the deck's east edge to the plaza
  const turns = 5, hr = dh + 3.2;
  const helix = pHelix(cx, cz, hr, 0, turns + 0.25, deckY + 0.2, terrainAt(cx, cz + hr) + 1.1);
  helix.unshift([cx + dh - 1, deckY + 0.5, cz - 6], [cx + dh + 1.6, deckY + 0.35, cz - 3]);
  const last = helix[helix.length - 1]; helix.push([last[0] - 5, last[1] - 0.1, last[2] + 1.5], [last[0] - 10, terrainAt(last[0] - 10, last[2] + 2) + 0.9, last[2] + 2]);
  K.rail(helix, { kind: 'pipe', color: red, radius: 0.2, round: 0, stubs: false, collar: '#2a2838', minSpeed: 9, endBoost: 1 });
  // struts from the shaft out to the pipe, four a turn
  for (let k = 1; k < turns * 4; k++) {
    const a = k * Math.PI / 2, t = k / ((turns + 0.25) * 4), hy = U.lerp(deckY + 0.2, terrainAt(cx, cz + hr) + 1.1, t) - 0.15, f = (hy - y) / (deckY - 1.2 - y), hw = f < 0.46 ? 15 : f < 0.8 ? 12 : 9.5;
    K.rod(V3(cx + Math.cos(a) * hw, hy + 1.2, cz + Math.sin(a) * hw), V3(cx + Math.cos(a) * hr, hy, cz + Math.sin(a) * hr), 0.1, '#2a2838', 0.02);
  }
  // and for the brave: a cable from the deck's south rail all the way down to Central's plaza
  { const cs = PLAN.stations.find(s => s.key === 'central').at, a = [cx - 8, deckY + 1.4, cz + dh - 0.2];
    for (const [tx, tz] of [[cs[0] + 6, cs[1] - 46], [cs[0] + 30, cs[1] - 40], [cs[0] - 22, cs[1] - 44]]) {
      const b = [tx, terrainAt(tx, tz) + 5.5, tz], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      let clear = true;
      for (let s = 30; s < L - 6 && clear; s += 4) { const t = s / L, px = U.lerp(a[0], b[0], t), pz = U.lerp(a[2], b[2], t), py = U.lerp(a[1], b[1], t) - 4 * 0.35 * L / 20 * t * (1 - t) - 4; for (const bb of W.boxes) if (px > bb.x0 - 2 && px < bb.x1 + 2 && pz > bb.z0 - 2 && pz < bb.z1 + 2 && py < bb.y1 && py + 8 > bb.y0) { clear = false; break; } }
      if (!clear) continue;
      K.rail([a, b], { kind: 'cable', color: '#2a2838', sag: 0.35, posts: false, endBoost: 1 });
      K.cyl(tx, terrainAt(tx, tz) - 0.3, tz, 0.2, 6.2, red, { outline: 0.04, seg: 8 }); H.block(tx, tz, 2);
      K.cyl(a[0], deckY, a[2], 0.14, 1.6, red, { outline: 0.03, seg: 6 });
      break;
    } }
}
