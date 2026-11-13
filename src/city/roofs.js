// ============================================================
//  ROOFS — life at roof level in the old town and the market:
//  the house kinds (gabled, timbered, stepped, stone, towers, flat
//  terraces), the ways up (outside stairs, low-swept roofs, shades
//  set out as steps), and what ties the roofs together (ridges to
//  grind, galleries, plank bridges, washing lines with pegs).
// ============================================================
const SHADES = ['#c4523a', '#e8b84a', '#3e8f86', '#d9779a', '#4a6aa0', '#f2efe6', '#8a5a9e', '#6aa04a', '#e4572e', '#2f8f9d'];
// the old town's five quarters: each has its own colours and its own mix of houses, so you can tell where you are
const OLD_Q = [
  { key: 'bell', at: [660, -570], walls: ['#f2d7c0', '#e8c8a0', '#f4ecd8', '#e8b8a8', '#f0e0a0'], roofs: ['#b85a3a', '#a04a32', '#b8643f'], trim: '#6a5a4a', types: ['gable', 'gable', 'timber', 'terrace', 'gable', 'stepped'] },
  { key: 'church', at: [770, -1010], walls: ['#e8c87a', '#f0d890', '#e0b060', '#f4e4b0', '#d9a860'], roofs: ['#8a4a3a', '#7a4030', '#9a5a44'], trim: '#6a4a2a', types: ['gable', 'steep', 'stepped', 'gable', 'terrace', 'steep'] },
  { key: 'upper', at: [850, -1290], walls: ['#d8d4c8', '#c8c4b8', '#e4e0d4', '#b8b4a8', '#cfc8b8'], roofs: ['#5a6272', '#6a6a7a', '#4a5260'], trim: '#4a4a52', types: ['stone', 'steep', 'tower', 'stone', 'gable', 'steep'] },
  { key: 'east', at: [960, -760], walls: ['#c8d8e0', '#d9e0c8', '#c8dcd0', '#b8d0d8', '#e0e8d8'], roofs: ['#9a5a44', '#8a5040', '#a86a4a'], trim: '#4a5a5a', types: ['gable', 'timber', 'timber', 'terrace', 'gable', 'tower'] },
  { key: 'west', at: [545, -1000], walls: ['#f0c8c0', '#f4dcd4', '#e8b0a8', '#f6e8e0', '#e0c0d0'], roofs: ['#c8703f', '#b85a3a', '#d08050'], trim: '#7a4a4a', types: ['gable', 'terrace', 'stepped', 'gable', 'timber', 'terrace'] },
];
const oldQ = (x, z) => OLD_Q.reduce((b, q) => Math.hypot(q.at[0] - x, q.at[1] - z) < Math.hypot(b.at[0] - x, b.at[1] - z) ? q : b);
const shuffled = (r, a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// the height of a roof's surface over (x, z)
function roofY(c, x, z) {
  if (c.flat) return c.top;
  const t = c.slopeX ? Math.abs(x - (c.x0 + c.x1) / 2) / ((c.x1 - c.x0) / 2 + 0.4) : Math.abs(z - (c.z0 + c.z1) / 2) / ((c.z1 - c.z0) / 2 + 0.4);
  return c.top + c.rise * Math.max(0, 1 - t);
}

// ---------- house kinds ----------
// a gabled roof's ridge: a pale cap of tiles you can grind from end to end
function roofRidge(H, c, stepCol) {
  const y = c.top + c.rise, mx = (c.x0 + c.x1) / 2, mz = (c.z0 + c.z1) / 2, w = c.x1 - c.x0, d = c.z1 - c.z0;
  H.put(H.SH.BOX, mx, y + 0.02, mz, c.slopeX ? 0.36 : w + 0.9, 0.16, c.slopeX ? d + 0.9 : 0.36, '#eadfc8', 'plain', 0.03);
  c.ridge = c.slopeX ? [[mx, y + 0.12, c.z0 - 0.3], [mx, y + 0.12, c.z1 + 0.3]] : [[c.x0 - 0.3, y + 0.12, mz], [c.x1 + 0.3, y + 0.12, mz]];
  H.K.rail(c.ridge, { hidden: true, voice: 'balcony' });
  if (!stepCol) return;
  // crow-stepped gable ends
  for (const e of [0, 1]) for (let k = 0; k < 3; k++) {
    const f = 1 - (k + 0.5) / 3.4, y0 = c.top + c.rise * k / 3 - 0.2, y1 = c.top + c.rise * (k + 1) / 3 + 0.45;
    if (c.slopeX) { const z = e ? c.z1 : c.z0; H.B.box(mx - w / 2 * f - 0.3, y0, z - 0.3, mx + w / 2 * f + 0.3, y1, z + 0.3, stepCol, 'plain', { outlineT: 0.05, edges: false }); }
    else { const x = e ? c.x1 : c.x0; H.B.box(x - 0.3, y0, mz - d / 2 * f - 0.3, x + 0.3, y1, mz + d / 2 * f + 0.3, stepCol, 'plain', { outlineT: 0.05, edges: false }); }
  }
}
// half-timbering: dark beams on the upper floors
function timbers(H, c) {
  const put = H.put, beam = '#4a3628', y0 = c.hi + 3.1, y1 = c.top - 0.75, ym = (y0 + y1) / 2;
  if (y1 - y0 < 2) return;
  for (const f of ['n', 's', 'w', 'e']) {
    const fr = faceFrame(f, c.x0, c.z0, c.x1, c.z1), ax = fr.nx === 0, n = Math.max(2, Math.round(fr.L / 2.3));
    const bar = (u, y, lu, ly, tilt = 0) => { const [x, z] = frPt(fr, u, 0.05); put(H.SH.BOX, x, y, z, ax ? lu : 0.1, ly, ax ? 0.1 : lu, beam, 'plain', 0, 0, ax ? 0 : tilt * fr.nx, ax ? -tilt * fr.nz : 0); };
    bar(0, y0, fr.L, 0.22); bar(0, y1, fr.L, 0.22);
    for (let k = 0; k <= n; k++) bar(U.lerp(-fr.L / 2 + 0.1, fr.L / 2 - 0.1, k / n), ym, 0.2, y1 - y0);
    for (const k of [0, n - 1]) bar(U.lerp(-fr.L / 2, fr.L / 2, (k + 0.5) / n), ym, 0.16, (y1 - y0) * 1.05, k ? 0.5 : -0.5);
  }
}
// a flat roof to sit out on: a low parapet all round (its top grinds), and something up there
function roofTerrace(H, c, r, o = {}) {
  const { K, W, B } = H, put = H.put, { x0, z0, x1, z1, top } = c, wall = o.wall || '#efe6d4', ph = o.tower ? 0.9 : (o.ph ?? 0.4), t = 0.32;
  for (const [a0, c0, a1, c1] of [[x0, z0, x1, z0 + t], [x0, z1 - t, x1, z1], [x0, z0 + t, x0 + t, z1 - t], [x1 - t, z0 + t, x1, z1 - t]]) K.box(a0, top - 0.05, c0, a1, top + ph, c1, wall, 'plain', { outlineT: 0.05, nocam: true });
  const e = 0.16, ry = top + ph + 0.03;
  K.rail([[x0 + e, ry, z0 + e], [x1 - e, ry, z0 + e], [x1 - e, ry, z1 - e], [x0 + e, ry, z1 - e]], { hidden: true, loop: true, round: 0, voice: 'balcony' });
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (o.tower) {
    // a lookout: battlements, a flag
    for (const f of ['n', 's', 'w', 'e']) { const fr = faceFrame(f, x0, z0, x1, z1); for (let u = -fr.L / 2 + 0.6; u < fr.L / 2; u += 1.5) { const [px, pz] = frPt(fr, u, -0.16); put(H.SH.BOX, px, top + ph + 0.3, pz, 0.6, 0.6, 0.6, wall, 'plain', 0.03); } }
    K.cyl(cx, top, cz, 0.07, 4.6, '#3a3550', { outline: 0.02, seg: 6 });
    put(H.SH.BOX, cx + 0.75, top + 4.1, cz, 1.4, 0.8, 0.04, o.flag || '#c4302b', 'plain', 0.02);
    H.bench(cx, cz + d / 2 - 1.3, true, { y: top + 0.02, color: '#7a5a3a', view: true });
    return;
  }
  if (o.bare || Math.min(w, d) < 5) return;
  const what = r();
  if (o.dome && Math.min(w, d) > 7.5) {
    const R = Math.min(w, d) * 0.3;
    K.sphere(cx, top, cz, R, o.dome, { sy: 0.8, seg: 12, outline: 0.07 }); put(H.SH.CYL, cx, top + R * 0.8 + 0.3, cz, 0.06, 0.7, 0.06, '#c9a24a', 'plain', 0);
    W.boxes.push({ x0: cx - R * 0.72, y0: top, z0: cz - R * 0.72, x1: cx + R * 0.72, y1: top + R * 0.56, z1: cz + R * 0.72, tag: 'dome' });
  } else if (what < 0.34) {
    // a pergola with a fabric shade (taut: it bounces), cushions under it
    const pw = Math.min(3.4, w - 2), pd = Math.min(2.8, d - 2), px = cx + (r() - 0.5) * (w - pw - 1.6), pz = cz + (r() - 0.5) * (d - pd - 1.6), col = pick(r, SHADES);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(H.SH.CYL, px + a * pw / 2, top + 1.15, pz + b * pd / 2, 0.06, 2.3, 0.06, '#6a4a2e', 'plain', 0.02);
    B.box(px - pw / 2 - 0.2, top + 2.3, pz - pd / 2 - 0.2, px + pw / 2 + 0.2, top + 2.4, pz + pd / 2 + 0.2, col, 'plain', { outlineT: 0.03, edges: false });
    B.box(px - 0.5, top + 2.4, pz - pd / 2 - 0.2, px + 0.5, top + 2.42, pz + pd / 2 + 0.2, '#f6f1e7', 'plain', { outlineT: 0, edges: false });
    W.boxes.push({ x0: px - pw / 2 - 0.2, y0: top + 2.0, z0: pz - pd / 2 - 0.2, x1: px + pw / 2 + 0.2, y1: top + 2.4, z1: pz + pd / 2 + 0.2, tag: 'bounce', nocam: true });
    put(H.SH.BOX, px, top + 0.14, pz, pw * 0.7, 0.24, pd * 0.5, pick(r, SHADES), 'plain', 0.03);
    H.bench(px, pz + pd / 2 - 0.5, true, { y: top + 0.02, color: '#7a5a3a', rail: false });
  } else if (what < 0.56) {
    H.bench(cx, cz + (r() < 0.5 ? -1 : 1) * (d / 2 - 1.4), true, { y: top + 0.02, color: '#7a5a3a', view: true });
  } else if (what < 0.74 && Math.max(w, d) > 6.5) {
    // a rack of washing
    const ax = w > d, L = (ax ? w : d) - 2.4, y = top + 2.0;
    const a = ax ? [cx - L / 2, y, cz + 0.8] : [cx + 0.8, y, cz - L / 2], b = ax ? [cx + L / 2, y, cz + 0.8] : [cx + 0.8, y, cz + L / 2];
    for (const p of [a, b]) put(H.SH.CYL, p[0], top + 1.0, p[2], 0.05, 2.0, 0.05, '#6a4a2e', 'plain', 0.02);
    K.rail([a, b], { kind: 'cable', laundry: true, posts: false, sag: 0.25 });
  } else if (what < 0.86 && o.mkt) {
    // a wind tower
    K.box(cx - 0.9, top, cz - 0.9, cx + 0.9, top + 3.4, cz + 0.9, wall, 'plain', { outlineT: 0.06 });
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const k of [-0.4, 0, 0.4]) put(H.SH.BOX, cx + a * 0.91 + b * k, top + 2.5, cz + b * 0.91 + a * k, a ? 0.04 : 0.22, 1.2, b ? 0.04 : 0.22, '#3a3640', 'plain', 0);
  }
  // pots of green along one edge
  if (r() < 0.6) for (let k = 0, n = 2 + Math.floor(r() * 3); k < n; k++) { const px = U.lerp(x0 + 0.9, x1 - 0.9, r()), pz = r() < 0.5 ? z0 + 0.8 : z1 - 0.8; put(H.SH.CYL, px, top + 0.2, pz, 0.24, 0.4, 0.24, '#b8643f', 'plain', 0.02); put(H.SH.ICO, px, top + 0.62, pz, 0.38, 0.4, 0.38, pick(r, ['#5a9a52', '#4f8a4a', '#6fa85a', '#d9779a', '#f2c14e']), 'flat', 0.03); }
}

// one old-town house. o: { q (quarter), front (the side the lane is on), type, top, col, rc, rise, slopeX, shop }
function oldHouse(H, x0, z0, x1, z1, r, o = {}) {
  const { K, W, B } = H, Q = o.q || oldQ((x0 + x1) / 2, (z0 + z1) / 2), w = x1 - x0, d = z1 - z0;
  let type = o.type || pick(r, Q.types);
  if (type === 'tower' && (Math.max(w, d) > 8.5 || o.top !== undefined)) type = 'gable';
  const col = o.col || pick(r, Q.walls), rc = o.rc || pick(r, Q.roofs);
  const h = type === 'tower' ? 14 + r() * 5 : type === 'terrace' ? 5.5 + r() * 3 : 6.5 + r() * 5.5;
  const flat = type === 'terrace' || type === 'tower';
  const bb = H.bldg(x0, z0, x1, z1, h, col, { trim: flat ? false : Q.trim, outline: 0.12, kind: type === 'stone' || type === 'tower' ? 'brick' : 'house', top: o.top, roof: flat ? '#d9cdb4' : col });
  const c = { x0, z0, x1, z1, top: bb.top, lo: bb.lo, hi: bb.hi, rise: 0, flat, type, col, rc };
  if (flat) roofTerrace(H, c, r, { wall: type === 'tower' ? col : '#efe6d4', tower: type === 'tower', flag: Q.roofs[0] });
  else {
    c.rise = o.rise ?? (type === 'steep' ? 4.4 : 2.4) + r() * 1.5; c.slopeX = o.slopeX ?? (w < d);
    H.roof(x0, z0, x1, z1, bb.top, c.rise, rc, c.slopeX);
    roofRidge(H, c, type === 'stepped' ? col : null);
    if (type === 'timber') timbers(H, c);
  }
  if (o.front) {
    const fr = faceFrame(o.front, x0, z0, x1, z1), [gl, gh] = frGround(fr, 0.6);
    if (type !== 'tower' && r() < (o.shop ?? 0.28)) shopFront(H, fr, gh, r, c);
    else if (type !== 'tower' && fr.L > 4.5 && bb.top - gh > 4.2) kitFront(H, fr, gh, bb.top, c, Q, r);
    else {
      // a door with a step, sometimes a pot of flowers
      const u = (r() - 0.5) * (fr.L - 3), b = frBox(fr, u - 0.55, u + 0.55, 0, 0.09), s = frBox(fr, u - 0.8, u + 0.8, 0, 0.7);
      B.box(b[0], gl, b[1], b[2], gh + 2.1, b[3], pick(r, ['#5a3a2a', '#2f5f6a', '#3e6f4a', '#7a2f2f', '#2f4f7a', '#3a3550']), 'plain', { outlineT: 0.03, edges: false });
      B.box(s[0], gl - 0.3, s[1], s[2], gh + 0.12, s[3], '#b9b0a0', 'paving', { outlineT: 0.03, edges: false });
      if (r() < 0.5) { const [px, pz] = frPt(fr, u + 1.1, 0.4); H.put(H.SH.CYL, px, gh + 0.2, pz, 0.22, 0.4, 0.22, '#b8643f', 'plain', 0.02); H.put(H.SH.ICO, px, gh + 0.6, pz, 0.34, 0.36, 0.34, pick(r, H.FLOWERS), 'flat', 0.03); }
    }
    if (!flat && bb.top - gh > 8.2 && r() < 0.45) { gallery(H, fr, gh + 6.3, r); if (r() < 0.5) gallery(H, fr, gh + 3.5, r, { inset: 1.2 }); }
  }
  H.reserve([x0, z0, x1, z1]);
  (o.list || (W.roofsOld = W.roofsOld || [])).push(c);
  return c;
}
// the street front of the model sheet's house (KIT.house, light version): real windows with shutters and sills, a door
// with its hood and step, timbers or quoins. A plain panel in the wall colour covers the painted windows of that face.
const SHUT = ['#3e6f5a', '#2f5f6a', '#7a2f2f', '#5a6a7a', '#6a4a2a', '#2f4f7a', '#8a6a3a'];
const DOORS = ['#5a3a2a', '#2f5f6a', '#3e6f4a', '#7a2f2f', '#2f4f7a', '#3a3550'];
function kitFront(H, fr, gh, top, c, Q, r) {
  const wallH = top - gh, floors = Math.max(1, Math.min(4, Math.floor((wallH - 0.9) / 2.8))), bays = Math.max(1, Math.min(5, Math.round((fr.L - 1) / 2.6)));
  const kind = c.type === 'timber' ? 'timber' : c.type === 'stone' ? 'stone' : 'town', d = 6;
  const h = KIT.house({ w: fr.L - 0.4, d, floors, kind, bays, lite: true }), fz = d / 2;
  const parts = h.parts.filter(p => p.at[2] > fz - 0.6 && p.tag !== 'solid' && p.tag !== 'roof' && p.s !== 'prism' && p.at[1] < h.eave)
    .map(p => Object.assign({}, p, { at: [p.at[0], p.at[1], p.at[2] - fz] }));
  const wall = '#' + new THREE.Color(c.col).getHexString(), sh = pick(r, SHUT), dr = pick(r, DOORS);
  const pal = Object.assign({}, KIT.HOUSES[0].pal, { wall, wall2: '#' + new THREE.Color(c.col).multiplyScalar(0.86).getHexString(), shutter: sh, shutter2: '#' + new THREE.Color(sh).multiplyScalar(0.85).getHexString(),
    door: dr, door2: '#' + new THREE.Color(dr).multiplyScalar(0.85).getHexString(), roof: c.rc, trim: c.type === 'timber' ? '#4a3628' : Q.trim === '#4a4a52' ? '#d8d4c8' : '#f4ecd8' });
  // cover the painted windows: a thin panel on the face, from the ground to just under the eaves
  const pb = frBox(fr, -fr.L / 2 + 0.02, fr.L / 2 - 0.02, 0, 0.03);
  H.B.box(pb[0], gh - 0.4, pb[1], pb[2], top - 0.05, pb[3], c.col, 'plain', { outlineT: 0, edges: false });
  const [x, z] = frPt(fr, 0, 0.03);
  H.kitPut(parts, pal, x, gh, z, frYaw(fr), 1, { outline: 0.02 });
  (H.W.kitFronts = H.W.kitFronts || []).push([x, z, fr.nx, fr.nz]);
}
// a row of houses wall to wall (their ridges line up into one long run). `c` is the front line, `dir` the side the houses stand on
function terraceRow(H, alongX, a0, a1, c, dir, r, o = {}) {
  const out = []; let a = a0;
  while (a < a1 - 5.5) {
    let w = 6.5 + r() * 4.5; if (a + w > a1 - 5.5) w = a1 - a; if (w > 12) w /= 2;
    const d = 8 + r() * 3.5;
    const [x0, z0, x1, z1] = alongX ? [a, dir > 0 ? c : c - d, a + w, dir > 0 ? c + d : c] : [dir > 0 ? c : c - d, a, dir > 0 ? c + d : c, a + w];
    if (H.clearOf(x0 + 0.05, z0 + 0.05, x1 - 0.05, z1 - 0.05, o.pad ?? 0)) out.push(oldHouse(H, x0, z0, x1, z1, r, Object.assign({ slopeX: !alongX, front: alongX ? (dir > 0 ? 'n' : 's') : (dir > 0 ? 'w' : 'e') }, o)));
    a += w;
  }
  return out;
}

// ---------- fronts ----------
// a shop: a window, a canvas shade over it (it bounces), sometimes a sign. Some shops' shades are set out as steps up the wall.
function shopFront(H, fr, gh, r, c, o = {}) {
  const { W, B } = H, hw = fr.L / 2 - 0.7, col = pick(r, SHADES);
  let b = frBox(fr, -hw, hw, 0, 0.1); B.box(b[0], gh + 0.5, b[1], b[2], gh + 2.6, b[3], '#2e3c4c', 'plain', { outlineT: 0, edges: false });
  if (r() < (o.steps ?? 0.3) && shadeSteps(H, fr, c.top, r, [col, '#f6f1e7'])) { c.way = 'shades'; c.wayAt = frPt(fr, 0, 3); return; }
  b = frBox(fr, -hw, hw, 0, 1.9); B.box(b[0], gh + 2.86, b[1], b[2], gh + 3.0, b[3], col, 'plain', { outlineT: 0.03, edges: false });
  W.boxes.push({ x0: b[0], y0: gh + 2.55, z0: b[1], x1: b[2], y1: gh + 3.0, z1: b[3], tag: 'bounce', nocam: true });
  if (r() < 0.4) { const s = pick(r, BIZ_SHOPS); wallSign(H, s[0], fr, 0, gh + 3.75, Math.min(4.2, fr.L - 2), 0.8, s[1], s[2]); }
}
// shades as stepping stones: from a crate you jump to the first, and each throws you up to the next, to the roof
function shadeSteps(H, fr, top, r, cols) {
  const { K, W, B } = H, [gl, gh] = frGround(fr, 1.2);
  if (fr.L < 7.5 || gh - gl > 1.3 || top - gh < 5) return false;
  const tri = [-1, 0, 1, 0], span = Math.min(2.7, (fr.L - 2.7) / 2), rise = 2.0;
  for (let k = 0; k < 12; k++) {
    const u = tri[k % 4] * span, y = gh + 2.3 + k * rise; if (y > top - 0.5) break;
    const b = frBox(fr, u - 1.25, u + 1.25, 0, 1.9), f = frBox(fr, u - 1.25, u + 1.25, 1.8, 1.9);
    B.box(b[0], y - 0.12, b[1], b[2], y, b[3], cols[0], 'plain', { outlineT: 0.04, edges: false });
    B.box(f[0], y - 0.45, f[1], f[2], y - 0.1, f[3], cols[0], 'plain', { outlineT: 0.02, edges: false });
    const s = frBox(fr, u - 0.4, u + 0.4, 0, 1.92); B.box(s[0], y - 0.11, s[1], s[2], y + 0.01, s[3], cols[1], 'plain', { outlineT: 0, edges: false });
    W.boxes.push({ x0: b[0], y0: y - 0.5, z0: b[1], x1: b[2], y1: y, z1: b[3], tag: 'bounce', kick: 11.8, nocam: true });
  }
  const [cx, cz] = frPt(fr, tri[0] * span, 2.9), cy = terrainAt(cx, cz);
  K.box(cx - 0.6, cy - 0.5, cz - 0.6, cx + 0.6, cy + 1.0, cz + 0.6, '#a07a4a', 'wood', { outlineT: 0.05 });
  H.sound(cx, cy + 1, cz, 1.8, 'crate'); H.reserve([cx - 0.8, cz - 0.8, cx + 0.8, cz + 0.8]);
  return true;
}
// a gallery: a long balcony you can stand on, its railing a grind
function gallery(H, fr, y, r, o = {}) {
  const { K, B } = H, hw = fr.L / 2 - (o.inset ?? 0.5), dep = o.dep ?? 1.25;
  if (hw < 1.2) return;
  const b = frBox(fr, -hw, hw, 0, dep);
  K.box(b[0], y - 0.14, b[1], b[2], y, b[3], o.floor || '#e6dfd2', 'plain', { outlineT: 0.03, nocam: true });
  for (let u = -hw + 0.3; u <= hw - 0.2; u += 2.2) { const q = frBox(fr, u - 0.08, u + 0.08, 0, dep * 0.8); B.box(q[0], y - 0.55, q[1], q[2], y - 0.14, q[3], '#6a5a4a', 'plain', { outlineT: 0, edges: false }); }
  const a = frPt(fr, -hw + 0.06, dep - 0.06), c = frPt(fr, hw - 0.06, dep - 0.06);
  K.rail([[a[0], y + 0.95, a[1]], [c[0], y + 0.95, c[1]]], { color: o.rail || '#2a2838', radius: 0.05, round: 0, postMax: 1.3, voice: 'balcony' });
  if (r() < 0.6) { const [px, pz] = frPt(fr, (r() - 0.5) * hw, dep - 0.4); H.put(H.SH.ICO, px, y + 0.3, pz, 0.34, 0.3, 0.34, pick(r, H.FLOWERS), 'flat', 0.02); }
}

// ---------- ways up ----------
// an outside stair of planks along a wall, from the ground to the roof's edge; its handrail grinds
function outStair(H, c, r, o = {}) {
  const { K } = H, wd = 1.7;
  for (const f of shuffled(r, c.flat ? ['n', 's', 'w', 'e'] : c.slopeX ? ['w', 'e'] : ['n', 's'])) {
    const fr = faceFrame(f, c.x0, c.z0, c.x1, c.z1), ax = fr.nx === 0; if (fr.L < 7) continue;
    for (const dir of (r() < 0.5 ? [1, -1] : [-1, 1])) {
      const b = frBox(fr, -fr.L / 2, fr.L / 2, 0.1, 0.1 + wd), foot = frPt(fr, -dir * fr.L / 2, 0.1 + wd / 2), g = terrainAt(foot[0], foot[1]) + 0.04, sl = (c.top - g) / fr.L;
      if (sl > 0.8 || sl < 0.12 || !H.clearOf(b[0] + 0.08, b[1] + 0.08, b[2] - 0.08, b[3] - 0.08, 0)) continue;
      K.ramp(b[0], b[1], b[2], b[3], ax ? 'x' : 'z', dir > 0 ? g : c.top, dir > 0 ? c.top : g, o.color || '#c9a878', true, 0, 'wood');
      const p0 = frPt(fr, -dir * fr.L / 2, wd), p1 = frPt(fr, dir * fr.L / 2, wd);
      K.rail([[p0[0], g + 0.95, p0[1]], [p1[0], c.top + 0.95, p1[1]]], { color: o.rail || '#e9e4f5', postColor: '#6a4a2e', postMax: 16, round: 0, radius: 0.06 });
      H.reserve(b); c.way = 'stair'; c.wayAt = foot; return true;
    }
  }
  return false;
}
// a roof swept down low over a lean-to: jump on at the bottom and ride it all the way up to the ridge
function catslide(H, c, r, col, rc) {
  const { K, W, B } = H, dep = 6.5;
  for (const f of shuffled(r, c.slopeX ? ['w', 'e'] : ['n', 's'])) {
    const fr = faceFrame(f, c.x0, c.z0, c.x1, c.z1), b = frBox(fr, -fr.L / 2, fr.L / 2, 0, dep);
    const [ox, oz] = frPt(fr, 0, dep), lip = terrainAt(ox, oz) + 1.0, sl = (c.top - lip) / dep;
    if (sl > 0.98 || sl < 0.3 || !H.clearOf(b[0] + 0.08, b[1] + 0.08, b[2] - 0.08, b[3] - 0.08, 0)) continue;
    const ax = fr.nx !== 0, out = f === 'e' || f === 's', h0 = out ? c.top : lip, h1 = out ? lip : c.top, g = groundSpan(b[0], b[1], b[2], b[3])[0];
    B.add(wedgeGeo(b[0] + 0.15, b[1] + 0.15, b[2] - 0.15, b[3] - 0.15, ax ? 'x' : 'z', h0 - 0.3, h1 - 0.3, g - 1, false), new THREE.Matrix4(), col, 'plain', { outlineT: 0.08 });
    const rb = [b[0] - (ax ? 0 : 0.4), b[1] - (ax ? 0.4 : 0), b[2] + (ax ? 0 : 0.4), b[3] + (ax ? 0.4 : 0)];
    K.ramp(rb[0], rb[1], rb[2], rb[3], ax ? 'x' : 'z', h0, h1, rc, true, 0, 'roof');
    H.F.add(wedgeGeo(rb[0], rb[1], rb[2], rb[3], ax ? 'x' : 'z', h0, h1, 0, true).toNonIndexed(), new THREE.Matrix4(), rc);     // (like every roof, it is drawn by the far copy)
    const lb = frBox(fr, -fr.L / 2 + 0.15, fr.L / 2 - 0.15, dep - 2.2, dep - 0.15); W.boxes.push({ x0: lb[0], y0: g - 1, z0: lb[1], x1: lb[2], y1: lip - 0.2, z1: lb[3], tag: 'ledge' });
    H.reserve(b); c.way = 'catslide'; c.wayAt = [ox, oz]; return true;
  }
  return false;
}

// ---------- links between roofs ----------
// every roof looks for its nearest neighbour to the east and to the south: flat roofs close together get a plank
// bridge, the others a washing line (pegged with laundry) or a string of lanterns, all of them grinds
function roofLinks(H, list, r, o = {}) {
  const { K, W, B } = H, G = makeGrid(24), q = [], maxGap = o.maxGap || 13;
  for (const c of list) G.add(c, c.x0, c.z0, c.x1, c.z1);
  let n = 0;
  for (const A of list) for (const dir of [0, 1]) {
    let best = null, bg = maxGap;
    G.query(dir ? A.x0 : A.x1, dir ? A.z1 : A.z0, dir ? A.x1 : A.x1 + maxGap, dir ? A.z1 + maxGap : A.z1, q);
    for (const C of q) {
      if (C === A) continue;
      const gap = dir ? C.z0 - A.z1 : C.x0 - A.x1, ov = dir ? Math.min(A.x1, C.x1) - Math.max(A.x0, C.x0) : Math.min(A.z1, C.z1) - Math.max(A.z0, C.z0);
      if (gap > 0.9 && gap < bg && ov > 2.4) { bg = gap; best = C; }
    }
    if (!best || r() < (o.skip ?? 0.2)) continue;
    const C = best, lo = dir ? Math.max(A.x0, C.x0) : Math.max(A.z0, C.z0), hi = dir ? Math.min(A.x1, C.x1) : Math.min(A.z1, C.z1), m = U.lerp(lo + 1, hi - 1, r());
    const pa = dir ? [m, A.z1] : [A.x1, m], pb = dir ? [m, C.z0] : [C.x0, m];
    const ya = roofY(A, pa[0], pa[1]), yb = roofY(C, pb[0], pb[1]);
    if (Math.abs(ya - yb) > 5.5) continue;
    if (A.flat && C.flat && bg < 7 && Math.abs(ya - yb) < 1.6) {
      // a plank bridge with rope rails
      const hw = 0.75;
      if (dir) K.ramp(m - hw, A.z1 - 0.3, m + hw, C.z0 + 0.3, 'z', ya + 0.42, yb + 0.42, '#c9a878', true, 0, 'wood'); else K.ramp(A.x1 - 0.3, m - hw, C.x0 + 0.3, m + hw, 'x', ya + 0.42, yb + 0.42, '#c9a878', true, 0, 'wood');
      for (const s of [-1, 1]) K.rail(dir ? [[m + s * hw, ya + 1.3, A.z1], [m + s * hw, yb + 1.3, C.z0]] : [[A.x1, ya + 1.3, m + s * hw], [C.x0, yb + 1.3, m + s * hw]], { kind: 'cable', color: '#8a6a4a', posts: false, sag: 0.25 });
      n++; continue;
    }
    if (bg < 2.6) continue;
    const a = [pa[0], ya + 0.5, pa[1]], b = [pb[0], yb + 0.5, pb[1]];
    for (const p of [a, b]) H.put(H.SH.BOX, p[0], p[1] - 0.2, p[2], 0.14, 0.5, 0.14, '#4a3a2a', 'plain', 0.02);
    if (o.lanterns && r() < o.lanterns) K.rail([a, b], { kind: 'cable', lanterns: true, posts: false, sag: 0.45 });
    else K.rail([a, b], { kind: 'cable', laundry: true, posts: false, sag: 0.4, color: '#e9e4f5' });
    n++;
  }
  return n;
}
// ways up for a whole list of roofs: stairs to most flat roofs, a low-swept roof or a stair on some of the others
function roofWays(H, list, r, o = {}) {
  let n = 0;
  for (const c of list) {
    if (c.way || c.type === 'tower' || c.noWay) continue;
    const u = r();
    if (c.flat) { if (u < (o.stair ?? 0.6) && outStair(H, c, r, o)) n++; }
    else if (u < (c.top - c.hi < 8.2 ? 0.6 : (o.slide ?? 0.2)) && c.top - c.hi < 9.5) { if (catslide(H, c, r, c.col || '#e6dfd2', c.rc || '#a04a32')) n++; }
    else if (u < (o.slide ?? 0.2) + 0.1 && outStair(H, c, r, o)) n++;
  }
  return n;
}
