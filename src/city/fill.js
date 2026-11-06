// ============================================================
//  FILL — street furniture, gardens, people at rest, and the
//  little things to ride between: planters, ledges, bus-stop roofs,
//  kiosks, sculptures you can grind, playgrounds, bandstands
// ============================================================
function fillKit(H) {
  const { K, W, B, F } = H;
  const BOX = prepShape(new THREE.BoxGeometry(1, 1, 1)), CYL = prepShape(new THREE.CylinderGeometry(1, 1, 1, 8));
  const ICO = (() => { const g = flatGeo(new THREE.IcosahedronGeometry(1, 0)); g.computeVertexNormals(); return prepShape(g); })();
  const CONE = prepShape(new THREE.ConeGeometry(1, 1, 10)), WHEEL = prepShape(new THREE.TorusGeometry(0.32, 0.035, 4, 12));
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = V3(), _s = V3(), _e = new THREE.Euler();
  // one call per little box/cylinder/blob, straight into the cell batch
  const put = H.put = (sh, x, y, z, sx, sy, sz, col, kind = 'plain', ol = 0.03, ry = 0, rx = 0, rz = 0) => {
    _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); B.addShape(sh, _m, col, kind, ol);
  };
  H.SH = { BOX, CYL, ICO, CONE, WHEEL };
  const FLOWERS = ['#e4572e', '#f2c14e', '#d9779a', '#f2efe6', '#8a5a9e', '#ff9a4a'];
  H.FLOWERS = FLOWERS;

  // a raised planter: a ledge to land on and grind along its long edges
  H.planter = (x, z, w, d, o = {}) => {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, [lo, hi] = groundSpan(x0, z0, x1, z1);
    const top = hi + (o.h ?? 0.55);
    K.box(x0, lo - 0.3, z0, x1, top, z1, o.color || '#b9b0a0', 'paving', { outlineT: 0.05 });
    B.box(x0 + 0.18, top, z0 + 0.18, x1 - 0.18, top + 0.06, z1 - 0.18, '#5a4a3a', 'plain', { outlineT: 0, edges: false });
    const r = U.rng((x * 7 + z * 13) | 0);
    if (o.flowers) for (let i = 0; i < w * d * 1.5; i++) put(ICO, U.lerp(x0 + 0.35, x1 - 0.35, r()), top + 0.18, U.lerp(z0 + 0.35, z1 - 0.35, r()), 0.22, 0.2, 0.22, pick(r, FLOWERS), 'flat', 0);
    else { const n = Math.max(1, Math.round(Math.max(w, d) / 1.6)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; put(ICO, w > d ? U.lerp(x0, x1, t) : x, top + 0.45, w > d ? z : U.lerp(z0, z1, t), 0.75, 0.6, 0.75, pick(r, ['#5a9a52', '#4f8a4a', '#6fa85a']), 'flat', 0.06); } }
    if (o.tree) H.tree(x, z, { y: top, s: 0.7, h: 3, color: o.tree, far: false });
    const e = 0.14, along = w >= d;
    if (along) for (const zz of [z0 + e, z1 - e]) K.rail([[x0 + 0.2, top + 0.03, zz], [x1 - 0.2, top + 0.03, zz]], { hidden: true });
    else for (const xx of [x0 + e, x1 - e]) K.rail([[xx, top + 0.03, z0 + 0.2], [xx, top + 0.03, z1 - 0.2]], { hidden: true });
    H.reserve([x0, z0, x1, z1]);
    return top;
  };
  // a long low hedge or stone wall (a ledge with a grindable top edge)
  H.ledge = (pts, o = {}) => {
    const h = o.h ?? 0.6, w = o.w ?? 0.6, col = o.color || '#9a9080', kind = o.kind || 'paving';
    const railPts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 4));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, x0 = U.lerp(ax, bx, t0), z0 = U.lerp(az, bz, t0), x1 = U.lerp(ax, bx, t1), z1 = U.lerp(az, bz, t1);
        const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, y0 = terrainAt(x0, z0), y1 = terrainAt(x1, z1), ym = (y0 + y1) / 2, len = Math.hypot(x1 - x0, z1 - z0);
        const yaw = Math.atan2(x1 - x0, z1 - z0), pitch = -Math.atan2(y1 - y0, len);
        put(BOX, xm, ym + h / 2 - 0.15, zm, w, h + 0.3, len + 0.06, col, kind, 0.05, yaw, pitch);
        if (o.top) put(BOX, xm, ym + h + 0.02, zm, w + 0.1, 0.08, len + 0.06, o.top, 'plain', 0.02, yaw, pitch);
        if (o.shrub) put(ICO, xm, ym + h + 0.1, zm, w * 0.8, 0.45, len * 0.55, o.shrub, 'flat', 0.05, yaw);
        W.boxes.push({ x0: Math.min(x0, x1) - w / 2, y0: ym - 1, z0: Math.min(z0, z1) - w / 2, x1: Math.max(x0, x1) + w / 2, y1: Math.max(y0, y1) + h - (Math.abs(y1 - y0) > 0.3 ? 0.3 : 0), z1: Math.max(z0, z1) + w / 2, tag: 'ledge' });
        if (k === 0 && i === 0) railPts.push([x0, y0 + h + 0.03, z0]);
        railPts.push([x1, y1 + h + 0.03, z1]);
      }
    }
    if (!o.noGrind) K.rail(railPts, { hidden: true, round: 0.5 });
  };
  H.bin = (x, z, col = '#3a4a3a') => { const y = terrainAt(x, z); put(CYL, x, y + 0.45, z, 0.28, 0.9, 0.28, col, 'plain', 0.03); put(CYL, x, y + 0.92, z, 0.31, 0.06, 0.31, '#2a2a32', 'plain', 0); };
  // a rack of bikes (hoops and simple bikes leaning in)
  H.bikes = (x, z, alongX, n, r) => {
    const y = terrainAt(x, z), ux = alongX ? 1 : 0, uz = alongX ? 0 : 1;
    for (let i = 0; i < n; i++) {
      const bx = x + ux * (i - (n - 1) / 2) * 0.8, bz = z + uz * (i - (n - 1) / 2) * 0.8, yaw = alongX ? 0 : Math.PI / 2;
      if (r() < 0.75) {
        const col = pick(r, ['#c4523a', '#2f5f8a', '#1f1f28', '#e8c84a', '#3e8f86', '#f2efe6']);
        // (wheels sit along the bike's axis, perpendicular to the rack)
        const ax = alongX ? 0 : 1, az = alongX ? 1 : 0;
        for (const s of [-0.52, 0.52]) put(WHEEL, bx + ax * s, y + 0.34, bz + az * s, 1, 1, 1, '#1f1f28', 'plain', 0, alongX ? Math.PI / 2 : 0);
        put(BOX, bx, y + 0.62, bz, ax ? 1.0 : 0.05, 0.05, az ? 1.0 : 0.05, col, 'plain', 0);
        put(BOX, bx + ax * 0.12, y + 0.48, bz + az * 0.12, ax ? 0.05 : 0.05, 0.42, 0.05, col, 'plain', 0, 0, az ? 0.5 : 0, ax ? -0.5 : 0);
        put(BOX, bx - ax * 0.45, y + 0.86, bz - az * 0.45, ax ? 0.08 : 0.5, 0.04, az ? 0.08 : 0.5, '#2a2a32', 'plain', 0);
      }
      put(BOX, bx, y + 0.4, bz, ux ? 0.05 : 0.6, 0.8, uz ? 0.05 : 0.6, '#8a8fa8', 'plain', 0.02);
    }
  };
  // café: round tables, chairs, people sitting; parasols if asked
  H.cafe = (x0, z0, x1, z1, style, r, o = {}) => {
    const pts = [];
    for (let x = x0 + 1.4; x < x1 - 1; x += 3.2) for (let z = z0 + 1.4; z < z1 - 1; z += 3.2) {
      const y = o.y ?? terrainAt(x, z);
      put(CYL, x, y + 0.36, z, 0.05, 0.72, 0.05, '#2a2a32', 'plain', 0); put(CYL, x, y + 0.74, z, 0.42, 0.04, 0.42, o.table || '#f2efe6', 'plain', 0.02);
      W.boxes.push({ x0: x - 0.4, y0: y - 1, z0: z - 0.4, x1: x + 0.4, y1: y + 0.76, z1: z + 0.4, tag: 'table' });
      const n = r() < 0.5 ? 2 : 4;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (n === 2 ? Math.PI / 2 : Math.PI / 4), cx = x + Math.sin(a) * 0.8, cz = z + Math.cos(a) * 0.8, yaw = a + Math.PI;
        put(BOX, cx, y + 0.44, cz, 0.42, 0.05, 0.42, o.chair || '#3a4a5a', 'plain', 0.02, yaw);
        put(BOX, cx + Math.sin(a) * 0.2, y + 0.7, cz + Math.cos(a) * 0.2, 0.42, 0.5, 0.04, o.chair || '#3a4a5a', 'plain', 0.02, yaw);
        for (const s of [-0.17, 0.17]) put(BOX, cx + Math.cos(a) * s, y + 0.21, cz - Math.sin(a) * s, 0.04, 0.42, 0.04, '#2a2a32', 'plain', 0, yaw);
        if (r() < (o.busy ?? 0.55)) pts.push([cx - Math.sin(a) * 0.05, cz - Math.cos(a) * 0.05, yaw, y + 0.47, 'sit']);
      }
      if (o.parasol && r() < 0.8) { put(CYL, x, y + 1.3, z, 0.04, 1.4, 0.04, '#d9d4c8', 'plain', 0); put(CONE, x, y + 2.25, z, 1.5, 0.5, 1.5, pick(r, o.parasol), 'plain', 0.03); }
    }
    if (pts.length) H.standers(pts, style);
  };
  // picnic: a blanket on the grass, people sitting round it
  H.picnic = (x, z, style, r) => {
    const y = terrainAt(x, z), yaw = r() * Math.PI, col = pick(r, ['#c4523a', '#2f8f9d', '#e8c84a', '#d9779a', '#f2efe6', '#8a5a9e']);
    put(BOX, x, y + 0.04, z, 2.2, 0.04, 1.7, col, 'plain', 0, yaw);
    put(BOX, x + 0.3, y + 0.18, z + 0.2, 0.45, 0.28, 0.32, '#a07a4a', 'wood', 0.02, yaw);
    const n = 2 + Math.floor(r() * 3), pts = [];
    for (let k = 0; k < n; k++) { const a = yaw + (k / n) * Math.PI * 2 + 0.3, d = 1.15; pts.push([x + Math.sin(a) * d, z + Math.cos(a) * d, a + Math.PI, y, r() < 0.7 ? 'ground' : 'sit']); }
    // 'sit' on the ground means sitting cross-legged-ish; nudge those down to the blanket
    H.standers(pts.map(p => p[4] === 'sit' ? [p[0], p[1], p[2], p[3] + 0.45, 'sit'] : p), style);
  };
  H.group = (x, z, n, style, y) => W.npcs.push({ kind: 'group', x, z, n, style, y });
  // a kiosk with a flat roof you can get onto, and an awning; the seller looks out
  H.kiosk = (x, z, yaw, col, r, style = 'market') => {
    const [lo, hi] = groundSpan(x - 2, z - 2, x + 2, z + 2), y = hi, w = 3.2, d = 2.4, h = 2.6;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), ax = Math.abs(fx) > 0.5;
    const hw = ax ? d / 2 : w / 2, hd = ax ? w / 2 : d / 2;
    K.box(x - hw, lo - 0.3, z - hd, x + hw, y + h, z + hd, col, 'plain', { outlineT: 0.06 });
    B.box(x - hw - 0.15, y + h, z - hd - 0.15, x + hw + 0.15, y + h + 0.18, z + hd + 0.15, '#f2efe6', 'plain', { outlineT: 0.04, edges: false });
    put(BOX, x + fx * (ax ? hw : hd) + fx * 0.02, y + 1.3, z + fz * (ax ? hw : hd) + fz * 0.02, ax ? 0.04 : w * 0.7, 0.9, ax ? w * 0.7 : 0.04, '#2a2838', 'plain', 0);
    put(BOX, x + fx * ((ax ? hw : hd) + 0.6), y + 2.2, z + fz * ((ax ? hw : hd) + 0.6), ax ? 1.3 : w + 0.2, 0.06, ax ? w + 0.2 : 1.3, pick(r, ['#e4572e', '#f2c14e', '#2f8f9d', '#d9779a']), 'plain', 0.03, 0, ax ? 0 : -0.25 * fz, ax ? 0.25 * fx : 0);
    H.standers([[x + fx * ((ax ? hw : hd) + 1.6), z + fz * ((ax ? hw : hd) + 1.6), yaw + Math.PI, y]], style);
    H.reserve([x - hw - 1, z - hd - 1, x + hw + 1, z + hd + 1]);
  };
  // a bus stop: a roof to jump onto, a bench, people waiting
  H.busStop = (x, z, alongX, style, r) => {
    const y = terrainAt(x, z), w = 5, d = 1.8, hw = alongX ? w / 2 : d / 2, hd = alongX ? d / 2 : w / 2;
    K.box(x - hw, y + 2.45, z - hd, x + hw, y + 2.62, z + hd, '#e9e4f5', 'plain', { outlineT: 0.04 });
    for (const s of [-1, 1]) { const px = alongX ? x + s * (hw - 0.2) : x, pz = alongX ? z : z + s * (hd - 0.2); put(BOX, px, y + 1.23, pz, 0.1, 2.45, 0.1, '#3a3550', 'plain', 0.02); }
    put(BOX, alongX ? x : x - hw + 0.06, y + 1.4, alongX ? z - hd + 0.06 : z, alongX ? w - 0.4 : 0.05, 1.8, alongX ? 0.05 : w - 0.4, '#a8c4d8', 'plain', 0.02);
    H.bench(x + (alongX ? 0 : -0.25), z + (alongX ? -0.25 : 0), alongX, { color: '#7a8a9a' });
    if (r() < 0.8) H.standers([[x + (alongX ? 1.8 : 1.4), z + (alongX ? 1.4 : 1.8), alongX ? 0 : Math.PI / 2]], style);
    H.reserve([x - hw - 0.5, z - hd - 0.5, x + hw + 0.5, z + hd + 0.5]);
  };
  // flower bed: low mound of colour
  H.flowerBed = (x, z, rad, r, y) => {
    const n = Math.round(rad * rad * 2.4);
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad, fx = x + Math.cos(a) * d, fz = z + Math.sin(a) * d; put(ICO, fx, (y ?? terrainAt(fx, fz)) + 0.15, fz, 0.28, 0.22, 0.28, pick(r, FLOWERS), 'flat', 0); }
    for (let i = 0; i < n / 3; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad, fx = x + Math.cos(a) * d, fz = z + Math.sin(a) * d; put(ICO, fx, (y ?? terrainAt(fx, fz)) + 0.1, fz, 0.4, 0.25, 0.4, '#4f8a4a', 'flat', 0); }
  };
  // a statue on a plinth (the plinth is a ledge)
  H.statue = (x, z, col = '#6a8a7a') => {
    const y = terrainAt(x, z);
    K.box(x - 1.2, y - 0.3, z - 1.2, x + 1.2, y + 1.1, z + 1.2, '#cfc6b4', 'paving', { outlineT: 0.05 });
    put(CYL, x, y + 1.9, z, 0.32, 1.6, 0.28, col, 'plain', 0.04); put(ICO, x, y + 2.95, z, 0.28, 0.3, 0.28, col, 'flat', 0.03);
    put(BOX, x + 0.42, y + 2.3, z, 0.14, 0.9, 0.14, col, 'plain', 0.03, 0, 0, -0.9);
    for (const [ax, az] of [[1, 0], [-1, 0]]) K.rail([[x + ax * 1.08, y + 1.13, z - 1.0], [x + ax * 1.08, y + 1.13, z + 1.0]], { hidden: true });
    W.boxes.push({ x0: x - 0.4, y0: y + 1.1, z0: z - 0.4, x1: x + 0.4, y1: y + 3.2, z1: z + 0.4, tag: 'statue' });
    H.reserve([x - 1.5, z - 1.5, x + 1.5, z + 1.5]);
  };
  // a sculpture you can ride: a sweeping ribbon of steel on posts
  H.wave = (pts, col, o = {}) => K.rail(pts, { color: col, kind: o.kind || 'pipe', radius: o.radius ?? 0.16, round: o.round ?? 3, postMax: 12, stubs: o.stubs, collar: o.collar || col, endBoost: o.endBoost ?? 2 });
  // playground: slide, swings, a climbing frame, children
  H.playground = (x, z, r, style) => {
    const y = terrainAt(x, z);
    H.patch([x - 12, z - 9, x + 12, z + 9], '#d9b98a', 'gravel', 0.07);
    // slide: a ladder tower and a ramp down (rideable)
    K.box(x - 9, y - 0.3, z - 6, x - 7, y + 2.2, z - 4, '#e4572e', 'plain', { outlineT: 0.04 });
    K.ramp(x - 7, z - 5.8, x - 1, z - 4.2, 'x', 2.2, 0.3, '#f2c14e', false, y - 0.3);
    // swings
    for (const s of [-1, 1]) put(BOX, x + 4 + s * 2.4, y + 1.2, z - 4, 0.12, 2.4, 0.12, '#2f5f8a', 'plain', 0.02);
    K.rail([[x + 1.4, y + 2.45, z - 4], [x + 6.6, y + 2.45, z - 4]], { color: '#2f5f8a', postMax: 0 , round: 0, posts: false });
    for (const s of [-1, 1]) { put(BOX, x + 4 + s * 1.1, y + 0.55, z - 4, 0.5, 0.05, 0.25, '#2a2a32', 'plain', 0.01); for (const t of [-0.2, 0.2]) put(BOX, x + 4 + s * 1.1 + t, y + 1.5, z - 4, 0.02, 1.9, 0.02, '#8a8fa8', 'plain', 0); }
    // climbing dome
    const dome = new THREE.SphereGeometry(2.6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    B.add(dome, new THREE.Matrix4().makeTranslation(x + 3, y, z + 4), '#3e8f86', 'plain', { outlineT: 0.04, edges: false });
    W.boxes.push({ x0: x + 1.2, y0: y - 1, z0: z + 2.2, x1: x + 4.8, y1: y + 2.4, z1: z + 5.8, tag: 'dome' });
    // sandpit and kids
    put(BOX, x - 5, y + 0.1, z + 4, 5, 0.2, 4, '#e8d4a0', 'plain', 0.03);
    const kids = []; for (let i = 0; i < 6; i++) kids.push([x - 8 + r() * 14, z - 6 + r() * 12, r() * 6]);
    H.standers(kids, style); W.npcs[W.npcs.length - 1].kids = true;
    H.bench(x, z + 8, true, {}); H.bench(x + 8, z + 8, true, {});
    H.reserve([x - 12, z - 9, x + 12, z + 9]);
  };
}

// ============================================================
//  the fill itself, district by district
// ============================================================
function fillDistricts(H) {
  fillKit(H);
  fillBusiness(H);
  fillCanalQuarter(H);
  fillLakeshore(H);
  fillSouthStrip(H);
  fillObservatory(H);
  fillPark(H);
  fillOldTownMarket(H);
  fillDocks(H);
}

function fillBusiness(H) {
  const { K, W, B } = H, r = U.rng(1101);
  const R = PLAN.byKey.business.rect;
  const xs = [-240, -116, 8, 132, 256, 396], zs = [-996, -870, -744, -618, -492, -366, -240, -114, 12, 138, 240];
  const pal = ['#d8cfbf', '#c9c2b4'];
  // sidewalk furniture along every street, between the trees and lamps
  let k = 0;
  for (const x of xs.slice(1, -1)) for (const sd of [-1, 1]) for (let z = R[1] + 20; z < R[3] - 20; z += 9) {
    if (zs.some(zz => Math.abs(zz - z) < 14)) continue;
    const fx = x + sd * 7;
    const what = (k++) % 6;
    if (!H.clearOf(fx - 1.5, z - 2.5, fx + 1.5, z + 2.5, 0.2)) continue;
    if (what === 0) H.planter(fx, z, 1.4, 4, { flowers: r() < 0.5 });
    else if (what === 1) H.bench(fx, z, false, { color: '#5a4a3a' });
    else if (what === 2) H.bikes(fx, z, false, 4, r);
    else if (what === 3) H.bin(fx, z);
    else if (what === 4 && r() < 0.3) H.busStop(fx + sd * 0.8, z, false, 'business', r);
    else if (what === 5 && r() < 0.35) H.kiosk(fx + sd * 2, z, sd > 0 ? -Math.PI / 2 : Math.PI / 2, pick(r, ['#2f5f8a', '#3e8f86', '#7a2f3a']), r, 'business');
  }
  // the plaza: tree squares in planters, a café terrace, chess tables, food carts, people chatting,
  // a ribbon sculpture to ride (the plaza was reserved whole, so only the viaduct and roads are avoided)
  const cs = PLAN.stations.find(s => s.key === 'central').at;
  const px = cs[0], pz = cs[1], used = [];
  const free = (x0, z0, x1, z1) => H.clearPts(x0, z0, x1, z1, 1) && !used.some(u => x1 > u[0] && x0 < u[2] && z1 > u[1] && z0 < u[3]) && Math.hypot((x0 + x1) / 2 - (px + 40), (z0 + z1) / 2 - (pz + 32)) > 14;
  const take = (x0, z0, x1, z1) => used.push([x0 - 1, z0 - 1, x1 + 1, z1 + 1]);
  for (let gx = px + 22; gx < px + 68; gx += 10) for (let gz = pz - 54; gz < pz - 20; gz += 10) if (free(gx - 1.5, gz - 1.5, gx + 1.5, gz + 1.5)) { H.planter(gx, gz, 3, 3, { h: 0.5, tree: pick(r, ['#5aa35a', '#6fb25e', '#4a8f4a']) }); take(gx - 1.5, gz - 1.5, gx + 1.5, gz + 1.5); }
  if (free(px + 46, pz + 6, px + 68, pz + 20)) { H.cafe(px + 46, pz + 6, px + 68, pz + 20, 'business', r, { parasol: ['#f2efe6', '#2f5f8a', '#c9a24a'], busy: 0.7 }); take(px + 46, pz + 6, px + 68, pz + 20); }
  for (const [kx, kz, c] of [[px + 22, pz + 54, '#e4572e'], [px + 62, pz + 54, '#2f8f9d'], [px - 30, pz - 46, '#f2c14e']]) if (free(kx - 3, kz - 3, kx + 3, kz + 3)) { H.kiosk(kx, kz, Math.PI, c, r, 'business'); take(kx - 3, kz - 3, kx + 3, kz + 3); }
  for (let i = 0; i < 6; i++) { const cx = px - 34 + (i % 3) * 6, cz = pz + 70 - Math.floor(i / 3) * 6; if (!free(cx - 1, cz - 1, cx + 1, cz + 1)) continue; const y = terrainAt(cx, cz); H.put(H.SH.CYL, cx, y + 0.38, cz, 0.45, 0.76, 0.45, '#cfc6b4', 'paving', 0.03); H.put(H.SH.BOX, cx, y + 0.78, cz, 0.7, 0.03, 0.7, '#2a2a32', 'plain', 0); H.standers([[cx - 0.9, cz, Math.PI / 2, y + 0.45, 'sit'], [cx + 0.9, cz, -Math.PI / 2, y + 0.45, 'sit']], 'business'); for (const s2 of [-1, 1]) H.put(H.SH.CYL, cx + s2 * 0.9, y + 0.22, cz, 0.22, 0.45, 0.22, '#cfc6b4', 'paving', 0.02); take(cx - 1.5, cz - 1, cx + 1.5, cz + 1); }
  let ng = 0; for (let i = 0; i < 60 && ng < 14; i++) { const gx = px - 66 + r() * 132, gz = pz - 56 + r() * 112; if (free(gx - 1.5, gz - 1.5, gx + 1.5, gz + 1.5)) { H.group(gx, gz, 2 + Math.floor(r() * 3), 'business'); take(gx - 1.5, gz - 1.5, gx + 1.5, gz + 1.5); ng++; } }
  for (let i = 0; i < 40; i++) { const bx = px - 66 + r() * 132, bz = pz - 56 + r() * 112; if (free(bx - 2.2, bz - 0.6, bx + 2.2, bz + 0.6)) { H.bench(bx, bz, true, { color: '#5a4a3a' }); take(bx - 2.2, bz - 0.6, bx + 2.2, bz + 0.6); } }
  if (free(px - 20, pz - 24, px - 14, pz - 18)) H.statue(px - 17, pz - 21, '#7a9a8a');
  // a wave rail across the plaza's west side: low, then a hump, then low
  const wy = (x, z, h) => [x, terrainAt(x, z) + h, z];
  H.wave([wy(px - 64, pz - 40, 0.7), wy(px - 56, pz - 20, 1.5), wy(px - 60, pz, 2.4), wy(px - 54, pz + 18, 1.3), wy(px - 62, pz + 34, 0.7)], '#ff7a5a');
  for (let i = 0; i < 5; i++) if (free(px + 50, pz - 47 + i * 9, px + 54, pz - 41 + i * 9)) H.planter(px + 52, pz - 44 + i * 9, 1.4, 5, { flowers: i % 2 === 0, h: 0.5 + i * 0.12 });
  (W.pigeonSpots = W.pigeonSpots || []).push([px + 10, pz - 30, 14], [px + 40, pz + 50, 10]);
  // the sky rail: from the garage roof's edge, a long steel line down over the street to the plaza
  const sp = PLAN.spots.find(s => s.key === 'rooftop').at;
  const g0 = groundSpan(sp[0] - 22, sp[1] - 16, sp[0] + 22, sp[1] + 16)[1] + 0.05 + 4 * 4.2;
  const sx = 132, top = [sp[0] - 22 + 7.6 + 2, g0 + 0.9, sp[1] + 15.4];
  const pts = [top, [top[0], g0 + 0.6, sp[1] + 30], [sx, terrainAt(sx, sp[1] + 60) + 10, sp[1] + 60]];
  for (let z = sp[1] + 100; z < -60; z += 40) { const t = U.clamp((z - (sp[1] + 60)) / (-60 - (sp[1] + 60)), 0, 1); pts.push([sx, terrainAt(sx, z) + U.lerp(10, 1.2, t * t), z]); }
  pts.push([sx, terrainAt(sx, -50) + 1.0, -50]);
  H.wave(pts, '#ff7a5a', { radius: 0.18, round: 8, stubs: false });
  // more people in the streets
  H.walkers(W.walkLines, 120, 'business');
}

function fillCanalQuarter(H) {
  const { K, W, B } = H, r = U.rng(1202), C = PLAN.canal;
  const R = PLAN.byKey.canals.rect, qN = C.z - C.half, qS = C.z + C.half;
  const cols = ['#8a5a4a', '#5a6a6a', '#c8b89a', '#3f5a5a', '#a07a5a', '#d8cfc0', '#6a4a3a', '#7a8a7a', '#9a6a5a', '#b8a888', '#c9a07a', '#e0d0b0'];
  const roofs = ['#5a4a42', '#6a5a52', '#4a4a52', '#7a4a3a', '#8a5a3a'];
  const xA = R[0] + 6, xB = C.bendX - C.half - 18;
  // back lanes (cobbles) between the rows; people use them
  const lanes = [];
  const lane = (z, x0 = xA, x1 = xB) => { groundRibbon(B, [[x0, z], [x1, z]], 7, '#a89a86', 'tiles', 0.07, 4); H.line([[x0, z], [x1, z]], 3.5); lanes.push([[x0 + 4, z], [x1 - 4, z]]); };
  lane(400, xA, C.bendX - 6); lane(532); lane(588); lane(650); lane(712);
  // squares: little parks with a fountain or a tree, benches, a café
  const squares = [];
  for (const [sx, sz, w, d] of [[-860, 650, 70, 50], [-520, 690, 80, 60], [-180, 650, 60, 50], [120, 690, 70, 60], [-700, 760, 60, 40], [-300, 760, 80, 40]]) {
    const q = [sx - w / 2, sz - d / 2, sx + w / 2, sz + d / 2]; squares.push(q);
    H.patch(q, '#c9bda6', 'tiles', 0.075); H.reserve(q);
    const y = terrainAt(sx, sz);
    if (r() < 0.5) { K.cyl(sx, y - 0.2, sz, 3.4, 0.7, '#a89a82', { outline: 0.06, seg: 16 }); W.boxes.push({ x0: sx - 3, y0: y - 1, z0: sz - 3, x1: sx + 3, y1: y + 0.5, z1: sz + 3, tag: 'fountain' }); (W.fountains = W.fountains || []).push({ x: sx, y: y + 1.2, z: sz }); H.sound(sx, y + 1, sz, 5, 'fountain'); }
    else H.tree(sx, sz, { s: 1.6, h: 4.5, color: '#5f8f45', color2: '#7aa055' });
    for (const [bx, bz] of [[sx - 8, sz], [sx + 8, sz]]) H.bench(bx, bz, false, { color: '#6a4a3a' });
    for (const [tx, tz] of [[q[0] + 4, q[1] + 4], [q[2] - 4, q[1] + 4], [q[0] + 4, q[3] - 4], [q[2] - 4, q[3] - 4]]) H.tree(tx, tz, { s: 0.9, color: pick(r, ['#5f8f45', '#6f9a50', '#8aa04a']) });
    H.cafe(q[0] + 6, q[1] + 8, q[0] + 20, q[3] - 8, 'canals', r, { parasol: ['#a03a3a', '#f2efe6', '#2f5f6a'], chair: '#2a3a3a' });
    H.group(sx + 14, sz + 8, 3, 'canals'); H.group(sx + 4, sz - 14, 2, 'canals');
    (W.pigeonSpots = W.pigeonSpots || []).push([sx + 10, sz - 6, 6]);
  }
  // rows of houses facing the lanes (narrow, tall, gabled; a few shops at street level)
  const row = (x0, x1, zFront, dir, depth) => {
    let x = x0;
    while (x < x1) {
      const w = 6 + r() * 4.5, d = depth * (0.8 + r() * 0.3);
      const z0 = dir > 0 ? zFront : zFront - d, z1 = dir > 0 ? zFront + d : zFront;
      if (H.clearOf(x, z0, x + w, z1, 0.4)) {
        const bb = H.bldg(x, z0, x + w, z1, 8 + r() * 9, pick(r, cols), { trim: '#f2ede2', outline: 0.12, kind: 'house' });
        H.roof(x, z0, x + w, z1, bb.top, 3 + r() * 2.2, pick(r, roofs), true);
        if (r() < 0.3) { const fz = dir > 0 ? z0 : z1; B.box(x + 0.6, bb.hi + 2.4, fz - (dir > 0 ? 1.2 : 0), x + w - 0.6, bb.hi + 2.5, fz + (dir > 0 ? 0 : 1.2), pick(r, ['#a03a3a', '#2f5f6a', '#e8c84a', '#f2efe6']), 'plain', { outlineT: 0.03, edges: false }); }
        H.reserve([x, z0, x + w, z1]);
      }
      x += w + (r() < 0.12 ? 7 : 0.05);
    }
  };
  row(xA, C.bendX - 6, 404, 1, 13); row(xA, C.bendX - 6, 396, -1, 12);
  row(xA, xB, 536, 1, 10); row(xA, xB, 584, -1, 12); row(xA, xB, 592, 1, 11);
  row(xA, xB, 646, -1, 11); row(xA, xB, 654, 1, 12); row(xA, xB, 708, -1, 12); row(xA, xB, 716, 1, 12);
  row(xA, xB, 790, -1, 13);
  // gardens and trees in the leftover gaps (courtyards)
  for (let i = 0; i < 500; i++) {
    const x = xA + r() * (xB - xA), z = 340 + r() * 450;
    if (!H.clearOf(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 0.5)) continue;
    const t = r();
    if (t < 0.55) H.tree(x, z, { s: 0.7 + r() * 0.4, color: pick(r, ['#5f8f45', '#6f9a50', '#4f7f42', '#8aa04a']) });
    else if (t < 0.75) H.flowerBed(x, z, 1.6, r);
    else if (t < 0.85) { H.put(H.SH.BOX, x, terrainAt(x, z) + 1, z, 2.2, 2, 1.6, pick(r, ['#8a6a4a', '#5a6a5a', '#a07a5a']), 'wood', 0.04); }
    else H.picnic(x, z, 'canals', r);
    H.reserve([x - 2.5, z - 2.5, x + 2.5, z + 2.5]);
  }
  // the quay edges: a long stone coping you can grind, broken at the bridges
  const breaks = [-870, -560, -60, 210];
  for (const z of [qN - 0.6, qS + 0.6]) {
    let x = C.x0 + 14; const xe = (z < C.z ? C.bendX + C.half + 2 : C.bendX - C.half - 2);
    const segs = []; let cur = [];
    for (; x < xe; x += 4) {
      if (breaks.some(b => Math.abs(b - x) < 14)) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
      cur.push([x, C.quayY + 0.42, z]);
    }
    if (cur.length > 1) segs.push(cur);
    for (const s of segs) { K.rail(s, { hidden: true, round: 0 }); B.box(s[0][0], C.quayY - 0.1, z - 0.35, s[s.length - 1][0], C.quayY + 0.4, z + 0.35, '#8a7e6a', 'paving', { outlineT: 0.04, edges: false }); }
  }
  H.walkers(lanes, 70, 'canals');
  H.walkers([[[C.x0 + 20, qN - 6], [C.bendX - 10, qN - 6]], [[C.x0 + 20, qS + 6], [C.bendX - 30, qS + 6]]], 40, 'canals');
  (W.gullSpots = W.gullSpots || []).push([-300, qS + 1, 4, C.quayY + 0.4], [-760, qN - 1, 4, C.quayY + 0.4]);
}

function fillLakeshore(H) {
  const { K, W, B } = H, r = U.rng(1303);
  const R = PLAN.byKey.lake.rect;
  // a sea wall along the beach side of the promenade: one long ledge to grind (gaps at the pier and marina)
  const prom = []; for (let x = R[0] + 4; x <= R[2] + 160; x += 12) prom.push([x, shoreZ(x) - 34 + 5.4]);
  const parts = []; let cur = [];
  for (const p of prom) { if (Math.abs(p[0] + 480) < 9 || Math.abs(p[0]) < 8 || p[0] > 296) { if (cur.length > 1) parts.push(cur); cur = []; } else cur.push(p); }
  if (cur.length > 1) parts.push(cur);
  for (const p of parts) H.ledge(p, { h: 0.55, w: 0.7, color: '#cbbfa6', top: '#e0d6c0' });
  // paths across the lawn, with lamps and benches
  const paths = [
    [[-1000, 870], [-860, 940], [-700, 920], [-560, 990], [-420, 960], [-260, 1010], [-100, 980], [60, 1030], [200, 1000]],
    [[-900, 860], [-880, 1000], [-820, 1150]], [[-600, 860], [-560, 990], [-600, 1150]], [[-300, 860], [-260, 1010], [-230, 1160]], [[0, 860], [60, 1030], [40, 1160]],
  ];
  for (const P of paths) {
    H.path(P, 3.2, '#d9cdb0'); H.line(P, 2);
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let t = 10; t < L - 6; t += 26) {
        const x = ax + ux * t - uz * 3, z = az + uz * t + ux * 3;
        if (!H.clearOf(x - 2, z - 2, x + 2, z + 2, 0)) continue;
        if ((t / 26 | 0) % 2) H.lamp(x, z, { style: 'globe', h: 3.6, color: '#1f2a3a', sound: false });
        else H.bench(x, z, Math.abs(ux) > Math.abs(uz), { color: '#7a5a3a' });
      }
    }
  }
  // the bandstand: a round deck with a rail round its edge, a roof on posts
  const bx = -620, bz = 1040, by = terrainAt(bx, bz) + 0.9, br = 9;
  K.cyl(bx, by - 1.4, bz, br, 1.4, '#e8e2d4', { outline: 0.08, seg: 16 });
  W.boxes.push({ x0: bx - br * 0.72, y0: by - 3, z0: bz - br * 0.72, x1: bx + br * 0.72, y1: by, z1: bz + br * 0.72, tag: 'deck' });
  const ring = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ring.push([bx + Math.cos(a) * (br - 0.3), by + 0.02, bz + Math.sin(a) * (br - 0.3)]); }
  K.rail(ring, { hidden: true, loop: true, round: 1 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; K.cyl(bx + Math.cos(a) * (br - 1), by, bz + Math.sin(a) * (br - 1), 0.18, 3.4, '#f2efe6', { outline: 0.03, seg: 6 }); }
  B.add(new THREE.ConeGeometry(br + 0.8, 3, 8), new THREE.Matrix4().makeTranslation(bx, by + 4.9, bz), '#3e8f86', 'plain', { outlineT: 0.08 });
  K.ramp(bx - 2, bz + br - 0.6, bx + 2, bz + br + 4, 'z', by, terrainAt(bx, bz + br + 4), '#e8e2d4', false, by - 2);
  H.reserve([bx - br - 4, bz - br - 4, bx + br + 4, bz + br + 6]);
  H.standers([[bx - 2, bz - 2, 0.6, by], [bx + 2, bz - 3, -0.4, by], [bx, bz + 1, 3.1, by]], 'lake');
  for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = br + 6 + r() * 10; const x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d; if (H.clearOf(x - 1.5, z - 1.5, x + 1.5, z + 1.5, 0)) H.picnic(x, z, 'lake', r); }
  // groves: clumps of trees with open meadows between
  for (let g = 0; g < 18; g++) {
    const gx = R[0] + 40 + r() * (R[2] - R[0] - 80), gz = R[1] + 30 + r() * 230, n = 6 + Math.floor(r() * 9), col = pick(r, ['#5f8f45', '#4f7f42', '#6f9a50', '#7aa04a', '#3f7a45']);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 16, x = gx + Math.cos(a) * d, z = gz + Math.sin(a) * d; if (H.clearOf(x - 1.5, z - 1.5, x + 1.5, z + 1.5, 1)) { H.tree(x, z, { s: 0.9 + r() * 0.7, h: 3.6 + r() * 1.6, color: col, color2: '#7aa055' }); H.reserve([x - 1.5, z - 1.5, x + 1.5, z + 1.5]); } }
  }
  buildFerris(H, -250, 1105);
  // a playground, an ice-cream kiosk, picnics and groups across the lawn
  H.playground(-150, 920, r, 'lake');
  H.kiosk(-380, 930, Math.PI, '#f2c14e', r, 'lake'); H.kiosk(120, 940, Math.PI, '#d9779a', r, 'lake');
  for (let i = 0; i < 60; i++) {
    const x = R[0] + 30 + r() * (R[2] - R[0] - 60), z = R[1] + 20 + r() * (shoreZ(x) - 60 - R[1]);
    if (!H.clearOf(x - 2, z - 2, x + 2, z + 2, 1)) continue;
    if (r() < 0.6) H.picnic(x, z, 'lake', r); else H.group(x, z, 2 + Math.floor(r() * 3), 'lake');
    H.reserve([x - 2, z - 2, x + 2, z + 2]);
  }
  // flower beds and a few groves of birches by the paths
  for (let i = 0; i < 24; i++) { const x = R[0] + 40 + r() * (R[2] - R[0] - 80), z = R[1] + 30 + r() * 260; if (H.clearOf(x - 3, z - 3, x + 3, z + 3, 1)) { H.flowerBed(x, z, 2.4, r); H.reserve([x - 3, z - 3, x + 3, z + 3]); } }
  // on the beach: sunbathers, a volleyball net, people paddling
  const sun = [];
  for (let i = 0; i < 50; i++) { const x = R[0] + 40 + r() * (R[2] - R[0] - 80), z = shoreZ(x) - 8 - r() * 18; if (Math.abs(x + 480) < 10 || (x > -210 && x < 160)) continue; sun.push([x, z, r() * 6, terrainAt(x, z), r() < 0.6 ? 'ground' : undefined]); }
  H.standers(sun, 'lake');
  for (const vx of [-880, -330]) { const vz = shoreZ(vx) - 16, y = terrainAt(vx, vz); for (const s of [-1, 1]) H.put(H.SH.CYL, vx, y + 1.2, vz + s * 4.5, 0.06, 2.4, 0.06, '#f2efe6', 'plain', 0.02); H.put(H.SH.BOX, vx, y + 2.1, vz, 0.04, 0.8, 9, '#f2efe6', 'plain', 0.02); H.standers([[vx - 4, vz - 2, Math.PI / 2], [vx - 4, vz + 2, Math.PI / 2], [vx + 4, vz, -Math.PI / 2], [vx + 4, vz + 3, -Math.PI / 2]], 'lake'); }
  H.walkers(paths, 60, 'lake');
  H.walkers([prom.map(p => [p[0], p[1] - 8])], 40, 'lake');
  (W.gullSpots = W.gullSpots || []).push([-480, 1500, 5, 2.7], [-300, shoreZ(-300) + 2, 6, 2.1]);
}

// between the park and the avenue: a skatepark, ball courts, allotments
function fillSouthStrip(H) {
  const { K, W, B } = H, r = U.rng(1404);
  const z0 = 190, z1 = PLAN.avenueZ - 18;
  // the skatepark
  const [sx0, sz0, sx1, sz1] = SKATE;
  const y = PLAN.skateY;
  if (H.clearOf(sx0, sz0, sx1, sz1, 0)) {
    H.patch(SKATE, '#c8c4bc', 'tiles', 0.06);
    // quarter pipes at both ends (curved: steeper as they rise), each in short straight pieces
    const qp = (xWall, dir) => {
      const D = 6, Hh = 3.2, n = 6;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, h0 = Hh * t0 * t0, h1 = Hh * t1 * t1;
        const xa = xWall - dir * D * (1 - t0), xb = xWall - dir * D * (1 - t1);
        K.ramp(Math.min(xa, xb), sz0 + 3, Math.max(xa, xb), sz1 - 3, 'x', dir > 0 ? y + h0 : y + h1, dir > 0 ? y + h1 : y + h0, '#d8d4cc', false, y);
      }
      K.box(xWall - (dir > 0 ? 0 : 1.2), y, sz0 + 3, xWall + (dir > 0 ? 1.2 : 0), y + Hh, sz1 - 3, '#bdb8ae', 'paving', { outlineT: 0.05 });
      K.rail([[xWall + dir * 0.15, y + Hh + 0.05, sz0 + 3.2], [xWall + dir * 0.15, y + Hh + 0.05, sz1 - 3.2]], { color: '#e9e4f5', posts: false, round: 0 });
    };
    qp(sx0 + 14, -1); qp(sx1 - 14, 1);
    // funbox in the middle with a rail and ramps
    const fx = (sx0 + sx1) / 2, fz = (sz0 + sz1) / 2;
    K.box(fx - 8, y - 0.1, fz - 5, fx + 8, y + 1.1, fz + 5, '#bdb8ae', 'paving', { outlineT: 0.05 });
    K.ramp(fx - 16, fz - 5, fx - 8, fz + 5, 'x', y, y + 1.1, '#d8d4cc', false, y);
    K.ramp(fx + 8, fz - 5, fx + 16, fz + 5, 'x', y + 1.1, y, '#d8d4cc', false, y);
    K.rail([[fx - 14, y + 1.0, fz - 9], [fx - 7, y + 2.0, fz - 9], [fx + 7, y + 2.0, fz - 9], [fx + 14, y + 1.0, fz - 9]], { color: '#ff7a5a', round: 1.5 });
    K.rail([[fx - 12, y + 0.7, fz + 10], [fx + 12, y + 0.7, fz + 10]], { color: '#f2c14e', round: 0 });
    // banks along the long sides, ledges, a pyramid
    K.ramp(sx0 + 12, sz0, sx1 - 12, sz0 + 7, 'z', y + 2.2, y, '#d8d4cc', false, y - 0.5);
    K.ramp(sx0 + 12, sz1 - 7, sx1 - 12, sz1, 'z', y, y + 2.2, '#d8d4cc', false, y - 0.5);
    K.rail([[sx0 + 14, y + 2.25, sz0 + 0.3], [sx1 - 14, y + 2.25, sz0 + 0.3]], { color: '#e9e4f5', round: 0, postMax: 3 });
    K.rail([[sx0 + 14, y + 2.25, sz1 - 0.3], [sx1 - 14, y + 2.25, sz1 - 0.3]], { color: '#e9e4f5', round: 0, postMax: 3 });
    for (const [lx, lz] of [[sx0 + 20, fz - 16], [sx1 - 30, fz + 16]]) { K.box(lx, y - 0.1, lz - 0.8, lx + 12, y + 0.6, lz + 0.8, '#9a9488', 'paving', { outlineT: 0.04 }); K.rail([[lx + 0.2, y + 0.62, lz - 0.7], [lx + 11.8, y + 0.62, lz - 0.7]], { hidden: true }); K.rail([[lx + 0.2, y + 0.62, lz + 0.7], [lx + 11.8, y + 0.62, lz + 0.7]], { hidden: true }); }
    // graffiti panels (colour blocks) and skaters hanging out
    for (let i = 0; i < 6; i++) H.put(H.SH.BOX, sx0 + 10 + i * 22, y + 1.2, sz1 + 1.2, 10, 2.4, 0.3, pick(r, ['#ff7a5a', '#2f8f9d', '#f2c14e', '#8a5a9e', '#3e8f86']), 'plain', 0.04);
    H.standers([[sx0 + 8, sz0 + 4, 1, y], [sx0 + 9, sz0 + 6, 2.5, y], [sx1 - 6, fz, -1.6, y], [fx, sz1 - 2, 3.1, y + 2.2]], 'park');
    H.reserve([sx0 - 8, sz0 - 2, sx1 + 8, sz1 + 2]);
  }
  // two ball courts with players
  for (const [cx, cz] of [[-760, 265], [-380, 265]]) {
    if (!H.clearOf(cx - 16, cz - 10, cx + 16, cz + 10, 0)) continue;
    H.patch([cx - 16, cz - 10, cx + 16, cz + 10], '#c4704a', 'tiles', 0.08);
    for (const s of [-1, 1]) { const hy = terrainAt(cx + s * 14, cz); H.put(H.SH.CYL, cx + s * 14.5, hy + 1.6, cz, 0.08, 3.2, 0.08, '#e9e4f5', 'plain', 0.02); H.put(H.SH.BOX, cx + s * 14, hy + 3.1, cz, 0.06, 1, 1.6, '#f2efe6', 'plain', 0.02); }
    H.group(cx - 5, cz, 3, 'park'); H.group(cx + 6, cz + 2, 3, 'park');
    H.reserve([cx - 16, cz - 10, cx + 16, cz + 10]);
  }
  // allotments: neat beds, sheds, people bending over them
  for (let x = -1010; x < -660; x += 24) for (let z = z0 + 6; z < z1 - 8; z += 18) {
    if (!H.clearOf(x, z, x + 20, z + 14, 0)) continue;
    const y0 = terrainAt(x + 10, z + 7);
    for (let k = 0; k < 4; k++) H.put(H.SH.BOX, x + 2.5 + k * 4.5, y0 + 0.12, z + 7, 3, 0.25, 11, pick(r, ['#6a4a32', '#5a8a3a', '#7a9a4a', '#6a4a32']), 'plain', 0);
    for (let k = 0; k < 8; k++) H.put(H.SH.ICO, x + 2.5 + (k % 4) * 4.5, y0 + 0.4, z + 4 + Math.floor(k / 4) * 6, 0.9, 0.5, 2, pick(r, ['#4f8a4a', '#6fa85a', '#8aa04a']), 'flat', 0);
    if (r() < 0.4) { H.put(H.SH.BOX, x + 18, y0 + 1, z + 2.5, 2.4, 2, 2.4, pick(r, ['#8a6a4a', '#5a7a8a', '#a05a4a']), 'wood', 0.04); }
    if (r() < 0.5) H.standers([[x + 4 + r() * 12, z + 3 + r() * 8, r() * 6]], 'park');
    H.reserve([x, z, x + 20, z + 14]);
  }
  // trees and benches along a path through the strip
  const P = [[-1020, z1 - 2], [-280, z1 - 2]];
  H.path(P, 3, '#d9cdb0'); H.walkers([P], 30, 'park');
  for (let x = -1000; x < -290; x += 16) { const z = z1 - 7; if (H.clearOf(x - 1, z - 1, x + 1, z + 1, 0)) H.tree(x, z, { s: 0.9, color: pick(r, ['#5f8f45', '#6f9a50']) }); }
}

function fillObservatory(H) {
  const { K, W, B } = H, r = U.rng(1505);
  const R = PLAN.byKey.obs.rect;
  // radio dishes on the meadow: tilted bowls on pedestals, a rail round each rim
  for (const [dx, dz, ds] of [[-150, -1340, 9], [-70, -1395, 7], [300, -1330, 8]]) {
    const y = terrainAt(dx, dz);
    K.cyl(dx, y - 0.3, dz, 1.2, 5.3, '#d9d4c8', { outline: 0.05, seg: 10 });
    const tilt = 0.6, yaw = Math.atan2(dx - 90, dz + 1200);
    const dish = new THREE.SphereGeometry(ds, 16, 6, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt, yaw, 0, 'YXZ')); m.setPosition(dx, y + 5 + ds * 0.79, dz);
    B.add(dish, m, '#f2efe6', 'plain', { outlineT: 0.1 });
    // the rim: a tilted ring (grindable)
    const rim = [], rr = ds * Math.sin(Math.PI * 0.38), hy = -ds * Math.cos(Math.PI * 0.38);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, p = V3(Math.cos(a) * rr, hy + 0.15, Math.sin(a) * rr).applyMatrix4(m); rim.push([p.x, p.y, p.z]); }
    K.rail(rim, { loop: true, color: '#e9e4f5', posts: false, round: 1 });
    W.boxes.push({ x0: dx - 1.2, y0: y - 1, z0: dz - 1.2, x1: dx + 1.2, y1: y + 5, z1: dz + 1.2, tag: 'dish' });
    H.reserve([dx - ds, dz - ds, dx + ds, dz + ds]);
    H.sound(dx, y, dz, ds + 6, 'dish');
  }
  // standing stones in a ring (jump from top to top)
  const cx = 250, cz = -1180, ry = terrainAt(cx, cz);
  if (H.clearOf(cx - 18, cz - 18, cx + 18, cz + 18, 0)) {
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, x = cx + Math.cos(a) * 14, z = cz + Math.sin(a) * 14, h = 1.4 + (i % 3) * 0.5, yy = terrainAt(x, z); K.box(x - 1, yy - 0.5, z - 0.7, x + 1, yy + h, z + 0.7, pick(r, ['#9a9488', '#8a8478', '#a8a296']), 'paving', { outlineT: 0.06 }); }
    H.reserve([cx - 18, cz - 18, cx + 18, cz + 18]);
    H.group(cx, cz, 3, 'obs');
  }
  // dry stone walls along the slope (long ledges)
  for (const W2 of [[[-230, -1080], [-120, -1120], [0, -1100], [60, -1140]], [[150, -1060], [260, -1100], [400, -1090]], [[-220, -1250], [-120, -1270]]]) H.ledge(W2, { h: 0.7, w: 0.8, color: '#a8a296', kind: 'paving' });
  // wildflowers, picnics, a few people looking at the view
  for (let i = 0; i < 40; i++) { const x = R[0] + 20 + r() * (R[2] - R[0] - 40), z = R[1] + 20 + r() * (R[3] - R[1] - 40); if (H.clearOf(x - 3, z - 3, x + 3, z + 3, 1)) { H.flowerBed(x, z, 2.5 + r() * 2, r); H.reserve([x - 3, z - 3, x + 3, z + 3]); } }
  for (let i = 0; i < 16; i++) { const x = R[0] + 20 + r() * (R[2] - R[0] - 40), z = R[1] + 60 + r() * (R[3] - R[1] - 80); if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 1)) { H.picnic(x, z, 'obs', r); H.reserve([x - 2, z - 2, x + 2, z + 2]); } }
  // sheep, grazing
  for (let i = 0; i < 26; i++) { const x = -60 + r() * 420, z = -1430 + r() * 160; if (!H.clearOf(x - 1, z - 1, x + 1, z + 1, 0)) continue; const y = terrainAt(x, z); const a = r() * 6, fx = Math.sin(a), fz = Math.cos(a); H.put(H.SH.ICO, x, y + 0.72, z, 0.6, 0.48, 0.8, '#f2efe6', 'flat', 0.04, a); H.put(H.SH.BOX, x + fx * 0.75, y + 0.78, z + fz * 0.75, 0.3, 0.32, 0.38, '#2a2a32', 'plain', 0.02, a); for (const [lx, lz] of [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]]) H.put(H.SH.BOX, x + fz * lx + fx * lz, y + 0.2, z - fx * lx + fz * lz, 0.1, 0.45, 0.1, '#2a2a32', 'plain', 0, a); }
  H.walkers([[[-200, -1060], [0, -1150], [96, -1180], [250, -1250], [400, -1300]]], 14, 'obs');
}

function fillPark(H) {
  const { K, W, B } = H, r = U.rng(1606);
  // picnics and people in the clearings, logs to grind on
  for (const [cx, cz, cr] of [[-900, -888, 40], [-660, -510, 60], [-760, -100, 34], [-560, -1300, 48], [-440, -1000, 26]]) {
    for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = r() * cr * 0.7, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (H.clearOf(x - 2, z - 2, x + 2, z + 2, 0.5)) { H.picnic(x, z, 'park', r); H.reserve([x - 2, z - 2, x + 2, z + 2]); } }
    for (let i = 0; i < 2; i++) {
      const a = r() * 6.28, d = cr * 0.5, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, ya = r() * 3, L = 7 + r() * 5;
      const x0 = x - Math.cos(ya) * L / 2, z0 = z - Math.sin(ya) * L / 2, x1 = x + Math.cos(ya) * L / 2, z1 = z + Math.sin(ya) * L / 2;
      if (!H.clearOf(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), 0.5)) continue;
      const y0 = terrainAt(x0, z0), y1 = terrainAt(x1, z1);
      K.rod(V3(x0, y0 + 0.4, z0), V3(x1, y1 + 0.4, z1), 0.42, '#6b4a35', 0.05);
      K.rail([[x0, y0 + 0.84, z0], [x1, y1 + 0.84, z1]], { hidden: true });
      W.boxes.push({ x0: Math.min(x0, x1), y0: Math.min(y0, y1) - 1, z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.min(y0, y1) + 0.6, z1: Math.max(z0, z1), tag: 'log' });
      H.reserve([Math.min(x0, x1) - 1, Math.min(z0, z1) - 1, Math.max(x0, x1) + 1, Math.max(z0, z1) + 1]);
    }
  }
  (W.pigeonSpots = W.pigeonSpots || []).push([-660, -510, 8]);
}

function fillOldTownMarket(H) {
  const { K, W, B } = H, r = U.rng(1707);
  // people chatting on the lanes and squares of the old town; more in the market
  for (let i = 0; i < 40; i++) { const x = 470 + r() * 550, z = -1420 + r() * 1030; if (H.clearOf(x - 1.5, z - 1.5, x + 1.5, z + 1.5, 0.3)) { H.group(x, z, 2 + Math.floor(r() * 2), 'oldtown'); H.reserve([x - 1.5, z - 1.5, x + 1.5, z + 1.5]); } }
  for (let i = 0; i < 40; i++) { const x = 480 + r() * 540, z = -310 + r() * 590; if (H.clearOf(x - 1.5, z - 1.5, x + 1.5, z + 1.5, 0.3)) { H.group(x, z, 2 + Math.floor(r() * 3), 'market'); H.reserve([x - 1.5, z - 1.5, x + 1.5, z + 1.5]); } }
  // flower beds and benches in the old town's gaps
  for (let i = 0; i < 300; i++) {
    const x = 470 + r() * 550, z = -1420 + r() * 1030;
    if (!H.clearOf(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 0.5)) continue;
    const t = r();
    if (t < 0.4) H.flowerBed(x, z, 1.8, r); else if (t < 0.6) H.bench(x, z, r() < 0.5, { color: '#7a5a3a' }); else if (t < 0.8) H.tree(x, z, { s: 0.8, color: pick(r, ['#6f9a50', '#8aa04a', '#5f8f45']) }); else H.picnic(x, z, 'oldtown', r);
    H.reserve([x - 2.5, z - 2.5, x + 2.5, z + 2.5]);
  }
  H.walkers(W.oldLanes || [], 40, 'oldtown');
}

function fillDocks(H) {
  const { K, W, B } = H, r = U.rng(1808);
  const R = PLAN.byKey.docks.rect, QZ = PLAN.docksQuayZ;
  // pipelines on stilts between the sheds and the yard: long grinds, jump to the stacks
  const py = 3.8 + 2.6;
  H.wave([[480, py, 470], [560, py, 470], [600, py + 1.4, 520], [600, py + 1.4, 760], [560, py, 800], [490, py, 800]], '#c9a24a', { kind: 'pipe', radius: 0.32, round: 6, stubs: true, collar: '#5b6078' });
  H.wave([[1010, py - 1, 500], [1010, py + 0.6, 700], [960, py + 0.6, 760], [960, py - 1, 1100]], '#8a8fa8', { kind: 'pipe', radius: 0.3, round: 8, stubs: true });
  // workers in groups, crates and pallets to hop over
  for (let i = 0; i < 14; i++) { const x = R[0] + 20 + r() * (R[2] - R[0] - 40), z = R[1] + 20 + r() * (QZ - R[1] - 40); if (H.clearOf(x - 1.5, z - 1.5, x + 1.5, z + 1.5, 0.3)) { H.group(x, z, 2 + Math.floor(r() * 2), 'docks'); H.reserve([x - 1.5, z - 1.5, x + 1.5, z + 1.5]); } }
  for (let i = 0; i < 40; i++) {
    const x = R[0] + 20 + r() * (R[2] - R[0] - 40), z = R[1] + 20 + r() * (QZ - R[1] - 40);
    if (!H.clearOf(x - 2, z - 2, x + 2, z + 2, 0.5)) continue;
    const y = terrainAt(x, z), n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) K.box(x - 1.2, y + k * 1.1 - (k ? 0 : 0.2), z - 1, x + 1.2, y + (k + 1) * 1.1, z + 1, pick(r, ['#a07a4a', '#8a6a3a', '#b8905a']), 'wood', { outlineT: 0.04 });
    H.reserve([x - 2, z - 2, x + 2, z + 2]);
  }
  (W.gullSpots = W.gullSpots || []).push([700, QZ + 1, 6, 3.9], [900, QZ + 1, 5, 3.9]);
}

// the big wheel on the lakeshore: it turns very slowly; jump onto a cabin roof from the platform and ride up
function buildFerris(H, x, z) {
  const { K, W, B } = H;
  const gy = terrainAt(x, z), R = 22, n = 16, ay = gy + 2.2 + 0.6 + R + 0.4;
  H.reserve([x - 26, z - 9, x + 26, z + 9]);
  H.patch([x - 14, z - 8, x + 14, z + 8], '#d8cbb0', 'tiles', 0.08);
  // A-frame legs on both sides of the wheel
  for (const sz of [-3.2, 3.2]) for (const sx of [-1, 1]) K.rod(V3(x + sx * 13, gy, z + sz), V3(x, ay, z + sz * 0.7), 0.45, '#e9e4f5', 0.06);
  K.rod(V3(x, ay, z - 3), V3(x, ay, z + 3), 0.7, '#bdb8ce', 0.06);
  // boarding platform beside the bottom of the wheel, with a ramp up
  const py = gy + 1.5;
  K.box(x - 4, gy - 0.3, z + 2.2, x + 4, py, z + 6.5, '#c4523a', 'plain', { outlineT: 0.06 });
  K.ramp(x - 4, z + 6.5, x + 4, z + 13, 'z', py, gy, '#c4523a', false, gy - 0.3);
  K.rail([[x - 3.8, py + 1, z + 6.3], [x + 3.8, py + 1, z + 6.3]], { color: '#f2efe6', postMax: 1.2, round: 0 });
  // the turning part: rims, spokes, bulbs; cabins are instanced and stay upright
  const parts = [];
  for (const sz of [-1.6, 1.6]) {
    parts.push([new THREE.TorusGeometry(R, 0.24, 5, 64), T4(0, 0, sz), '#e9e4f5'], [new THREE.TorusGeometry(R * 0.55, 0.14, 4, 40), T4(0, 0, sz), '#e9e4f5']);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; parts.push([new THREE.CylinderGeometry(0.09, 0.09, R, 4), T4(Math.cos(a) * R / 2, Math.sin(a) * R / 2, sz, 0, 0, a - Math.PI / 2), '#d9d4ea']); }
  }
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; parts.push([new THREE.CylinderGeometry(0.12, 0.12, 3.4, 5), T4(Math.cos(a) * R, Math.sin(a) * R, 0, Math.PI / 2, 0, 0), '#bdb8ce']); }
  const wheel = solid(parts, 0.05);
  const bulbs = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; for (const sz of [-1.6, 1.6]) bulbs.push([new THREE.SphereGeometry(0.28, 5, 4), T4(Math.cos(a) * (R + 0.3), Math.sin(a) * (R + 0.3), sz + Math.sign(sz) * 0.2), '#ffffff']); }
  const bulbMesh = new THREE.Mesh(mergeParts(bulbs), W.mats.lamp);
  const rot = new THREE.Group(); rot.add(wheel, bulbMesh); rot.position.set(x, ay, z); W.group.add(rot);
  const cabG = mergeParts([
    [new THREE.BoxGeometry(2.2, 1.9, 2.4), T4(0, -1.85, 0), '#ffffff'], [new THREE.BoxGeometry(2.5, 0.22, 2.7), T4(0, -0.75, 0), '#ffffff'],
    [new THREE.BoxGeometry(2.24, 0.75, 2.0), T4(0, -1.55, 0), '#c9e2f0'], [new THREE.BoxGeometry(1.8, 0.75, 2.44), T4(0, -1.55, 0), '#c9e2f0'],
    [new THREE.CylinderGeometry(0.07, 0.07, 0.65, 4), T4(0, -0.32, 0), '#d9d4ea'],
  ]);
  const cabs = new THREE.InstancedMesh(cabG, toon('#ffffff', { noCache: true }), n); cabs.frustumCulled = false; cabs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cc = new THREE.Color(); for (let i = 0; i < n; i++) cabs.setColorAt(i, cc.set(['#e4572e', '#f2c14e', '#2f8f9d', '#d9779a'][i % 4]));
  W.group.add(cabs);
  W.ferris = { x, y: ay, z, R, n, rot, cabs, a: 0, w: (Math.PI * 2) / 150, cab: [], hit: { tag: 'lift', vx: 0, vz: 0, ferris: true } };
  for (let i = 0; i < n; i++) W.ferris.cab.push({ x: 0, y: 0, vx: 0, vy: 0 });
  H.sound(x, gy + 3, z, 14, 'ferris');
  H.walkers([[[x - 30, z + 14], [x + 30, z + 14]]], 8, 'lake');
}
