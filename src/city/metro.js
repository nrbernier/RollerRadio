// ============================================================
//  METRO — a two-track loop on viaducts, seven stations, a gallery
//  through the ridge between Park and Hilltop. Trains you can ride on
//  (roof) and that knock you off the rails.
// ============================================================
// the loop, as drawn on the sketch (cubic Béziers in map units), starting at Hilltop
const METRO_SVG = [
  [[235, 115], [255, 150], [270, 200], [280, 262]],
  [[280, 262], [290, 320], [300, 350], [295, 400]],
  [[295, 400], [280, 425], [240, 445], [205, 440]],
  [[205, 440], [165, 435], [130, 400], [125, 350]],
  [[125, 350], [122, 310], [170, 290], [195, 265]],
  [[195, 265], [160, 230], [110, 175], [80, 175]],
  [[80, 175], [120, 150], [190, 120], [235, 115]],
];
const METRO = { deckW: 11, trackOff: 2.3, step: 3, clear: 9, platLen: 96 };

function planMetro() {
  // sample the Béziers evenly
  const raw = [];
  for (const seg of METRO_SVG) {
    const P = seg.map(([u, v]) => M6(u, v));
    for (let i = 0; i < 400; i++) {
      const t = i / 400, a = 1 - t;
      raw.push([a * a * a * P[0][0] + 3 * a * a * t * P[1][0] + 3 * a * t * t * P[2][0] + t * t * t * P[3][0], a * a * a * P[0][1] + 3 * a * a * t * P[1][1] + 3 * a * t * t * P[2][1] + t * t * t * P[3][1]]);
    }
  }
  // resample at METRO.step metres
  const acc = [0]; for (let i = 1; i < raw.length; i++) acc.push(acc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const total = acc[acc.length - 1] + Math.hypot(raw[0][0] - raw[raw.length - 1][0], raw[0][1] - raw[raw.length - 1][1]);
  const n = Math.floor(total / METRO.step), pts = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const s = i * total / n;
    while (k < raw.length - 1 && acc[k + 1] < s) k++;
    const a = raw[k], b = raw[(k + 1) % raw.length], L = (k + 1 < raw.length ? acc[k + 1] : total) - acc[k];
    const t = L > 0 ? (s - acc[k]) / L : 0;
    pts.push({ x: U.lerp(a[0], b[0], t), z: U.lerp(a[1], b[1], t), s });
  }
  const L = total, N = pts.length;
  // stations: nearest sample to each
  const stations = PLAN.stations.map(st => {
    let bi = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p.x - st.at[0], p.z - st.at[1]); if (d < bd) { bd = d; bi = i; } });
    return Object.assign({}, st, { i: bi, s: pts[bi].s });
  });
  // heights: stations sit METRO.clear above the ground; in between, a smooth line,
  // lifted wherever the ground comes too close — except in the ridge, where it tunnels
  const ground = pts.map(p => terrainAt(p.x, p.z));
  const half = METRO.platLen / 2 / METRO.step;
  const fixed = new Array(N).fill(null);
  for (const st of stations) {
    let g = -1e9; for (let d = -half; d <= half; d++) g = Math.max(g, ground[(st.i + d + N) % N]);
    st.y = g + METRO.clear - 1;
    for (let d = -half; d <= half; d++) fixed[(st.i + d + N) % N] = st.y;
  }
  const y = new Array(N).fill(0);
  const ord = stations.slice().sort((a, b) => a.i - b.i);
  for (let q = 0; q < ord.length; q++) {
    const A = ord[q], Bs = ord[(q + 1) % ord.length];
    const i0 = A.i + half, i1 = (Bs.i - half + N) % N;
    const len = ((i1 - i0) % N + N) % N;
    for (let d = 0; d <= len; d++) { const i = (i0 + d) % N, t = U.smooth(d / len); y[i] = U.lerp(A.y, Bs.y, t); }
  }
  for (let i = 0; i < N; i++) if (fixed[i] !== null) y[i] = fixed[i];
  // the gallery section (Park → Hilltop) may go under the hill; everywhere else stay above it
  const park = stations.find(s => s.key === 'park'), hill = stations.find(s => s.key === 'hilltop');
  const inTunnelSpan = (i) => { const a = park.i + half, b = hill.i - half + N; const ii = i < park.i ? i + N : i; return ii > a && ii < b; };
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < N; i++) if (fixed[i] === null && !inTunnelSpan(i)) y[i] = Math.max(y[i], ground[i] + 6);
    // smooth (never touching the platforms)
    const y2 = y.slice();
    for (let i = 0; i < N; i++) { if (fixed[i] !== null) continue; let s = 0, c = 0; for (let d = -12; d <= 12; d++) { s += y[(i + d + N) % N]; c++; } y2[i] = s / c; }
    for (let i = 0; i < N; i++) y[i] = y2[i];
  }
  for (let i = 0; i < N; i++) { pts[i].y = y[i]; pts[i].g = ground[i]; }
  // directions
  for (let i = 0; i < N; i++) { const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N]; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); pts[i].dx = dx / l; pts[i].dz = dz / l; }
  // covered parts: the ground is well above the deck
  for (let i = 0; i < N; i++) pts[i].covered = ground[i] > y[i] + 5;
  return { pts, L, N, stations, step: L / N };
}

// position on the loop at arc length s, offset sideways by `off` (+ = right of travel)
function metroAt(M, s, off = 0, out = {}) {
  s = ((s % M.L) + M.L) % M.L;
  const f = s / M.step, i = Math.floor(f) % M.N, t = f - Math.floor(f), a = M.pts[i], b = M.pts[(i + 1) % M.N];
  const dx = U.lerp(a.dx, b.dx, t), dz = U.lerp(a.dz, b.dz, t), l = Math.hypot(dx, dz);
  out.dx = dx / l; out.dz = dz / l;
  out.x = U.lerp(a.x, b.x, t) - out.dz * off; out.z = U.lerp(a.z, b.z, t) + out.dx * off; out.y = U.lerp(a.y, b.y, t);
  out.grade = (b.y - a.y) / M.step;
  return out;
}

// ---------- building the line ----------
function buildMetro(K, M, S, F) {
  const W = K.W, B = K.B, N = M.N, hw = METRO.deckW / 2;
  const deckCol = '#c9c2b4', sideCol = '#a39b8c', pillarCol = '#b8b0a2', railCol = '#5b6078';
  const shape = new THREE.Shape(); shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(hw, -0.5); shape.lineTo(hw - 1.2, -1.4); shape.lineTo(-hw + 1.2, -1.4); shape.lineTo(-hw, -0.5); shape.closePath();
  // deck: one quad strip per segment (top, sides, bottom) — cheap, follows the curve exactly
  const pos = [], q = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  const L = (p, o, dy = 0) => [p.x - p.dz * o, p.y + dy, p.z + p.dx * o];
  for (let i = 0; i < N; i++) {
    const a = M.pts[i], b = M.pts[(i + 1) % N];
    q(L(a, -hw), L(b, -hw), L(b, hw), L(a, hw));                                    // top
    q(L(a, hw), L(b, hw), L(b, hw, -0.6), L(a, hw, -0.6));                           // right side
    q(L(a, -hw, -0.6), L(b, -hw, -0.6), L(b, -hw), L(a, -hw));                       // left side
    q(L(a, hw - 1.3, -1.5), L(b, hw - 1.3, -1.5), L(b, -hw + 1.3, -1.5), L(a, -hw + 1.3, -1.5));   // underside
    q(L(a, hw, -0.6), L(b, hw, -0.6), L(b, hw - 1.3, -1.5), L(a, hw - 1.3, -1.5));
    q(L(a, -hw + 1.3, -1.5), L(b, -hw + 1.3, -1.5), L(b, -hw, -0.6), L(a, -hw, -0.6));
    // ballast + running rails, painted on top
    for (const side of [-1, 1]) {
      const c = side * METRO.trackOff;
      q(L(a, c - 1.3, 0.04), L(b, c - 1.3, 0.04), L(b, c + 1.3, 0.04), L(a, c + 1.3, 0.04));
    }
  }
  // split the deck triangles: top/sides go to concrete, ballast strips darker
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  B.add(g, null, deckCol, 'plain', { outlineT: 0, edges: false });
  // rails: thin dark strips + hidden grindable rails
  const railPos = [];
  for (let i = 0; i < N; i++) {
    const a = M.pts[i], b = M.pts[(i + 1) % N];
    for (const side of [-1, 1]) for (const r of [-0.7, 0.7]) {
      const c = side * METRO.trackOff + r;
      railPos.push(...L(a, c - 0.06, 0.2), ...L(b, c - 0.06, 0.2), ...L(b, c + 0.06, 0.2), ...L(a, c - 0.06, 0.2), ...L(b, c + 0.06, 0.2), ...L(a, c + 0.06, 0.2));
    }
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3)); rg.computeVertexNormals();
  B.add(rg, null, '#3a3a48', 'plain', { outlineT: 0, edges: false });
  const ball = []; for (let i = 0; i < N; i++) { const a = M.pts[i], b = M.pts[(i + 1) % N]; for (const side of [-1, 1]) { const c = side * METRO.trackOff; ball.push(...L(a, c - 1.2, 0.06), ...L(b, c - 1.2, 0.06), ...L(b, c + 1.2, 0.06), ...L(a, c - 1.2, 0.06), ...L(b, c + 1.2, 0.06), ...L(a, c + 1.2, 0.06)); } }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(ball, 3)); bg.computeVertexNormals();
  B.add(bg, null, '#8a8478', 'paving', { outlineT: 0, edges: false });
  // grindable running rails (in long runs, so grinding carries you far)
  const run = (side, r) => { const P = []; for (let i = 0; i <= N; i++) { const p = M.pts[i % N]; P.push(L(p, side * METRO.trackOff + r, 0.25)); } return P; };
  for (const side of [-1, 1]) for (const r of [-0.7, 0.7]) K.rail(run(side, r), { hidden: true, loop: false, round: 0 });
  // handrails along both edges (grindable; they also stop you skating off)
  const halfI = Math.ceil(METRO.platLen / 2 / M.step) + 2;
  const atStation = (i) => M.stations.some(st => { const d = Math.abs(((i - st.i) % N + N + N / 2) % N - N / 2); return d <= halfI; });
  for (const side of [-1, 1]) {
    let P = [];
    const flush = () => { if (P.length > 3) K.rail(P, { color: '#e9e4f5', postColor: '#7a7468', postMax: 1.4, round: 0, radius: 0.06 }); P = []; };
    for (let i = 0; i <= N; i++) {
      if (atStation(i % N)) { flush(); continue; }
      const p = M.pts[i % N]; P.push(L(p, side * (hw - 0.25), 1.05));
      if (P.length > 200) { const last = P[P.length - 1]; flush(); P.push(last); }
    }
    flush();
  }
  // the deck you skate on
  for (let i = 0; i < N; i++) { const a = M.pts[i], b = M.pts[(i + 1) % N]; S.add(a.x, a.y, a.z, b.x, b.y, b.z, hw - 0.3); }
  // pillars (and their far copies), arches over the gallery
  for (let i = 0; i < N; i += 9) {
    const p = M.pts[i];
    if (p.covered) continue;
    const gy = Math.min(terrainAt(p.x - p.dz * 2, p.z + p.dx * 2), terrainAt(p.x + p.dz * 2, p.z - p.dx * 2), terrainAt(p.x, p.z));
    if (p.y - 1.5 - gy < 1.2) continue;
    const m = new THREE.Matrix4().makeRotationY(Math.atan2(p.dx, p.dz)).setPosition(p.x, (gy - 1 + p.y - 1.4) / 2, p.z);
    const h = p.y - 1.4 - gy + 1;
    K.B.add(new THREE.BoxGeometry(2.6, h, 2.2), m, pillarCol, 'plain', { outlineT: 0.08 });
    W.boxes.push({ x0: p.x - 1.3, y0: gy - 1, z0: p.z - 1.3, x1: p.x + 1.3, y1: p.y - 1.4, z1: p.z + 1.3, tag: 'pillar' });
    if (i % 18 === 0) F.add(new THREE.BoxGeometry(2.2, h, 1.8), m, pillarCol);
  }
  // far deck (a simple band)
  const fp = []; for (let i = 0; i < N; i += 4) { const a = M.pts[i], b = M.pts[(i + 4) % N]; const fq = (A, Bb, C, D) => fp.push(...A, ...Bb, ...C, ...A, ...C, ...D); fq(L(a, -hw + 0.4, -0.2), L(b, -hw + 0.4, -0.2), L(b, hw - 0.4, -0.2), L(a, hw - 0.4, -0.2)); fq(L(a, hw - 0.4, -0.2), L(b, hw - 0.4, -0.2), L(b, hw - 0.4, -1.3), L(a, hw - 0.4, -1.3)); fq(L(a, -hw + 0.4, -1.3), L(b, -hw + 0.4, -1.3), L(b, -hw + 0.4, -0.2), L(a, -hw + 0.4, -0.2)); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); F.add(fg, null, sideCol);
  // the gallery: walls + roof where the line runs under the hill (and a bit either side)
  const cov = M.pts.map((p, i) => { for (let d = -8; d <= 8; d++) if (M.pts[(i + d + N) % N].covered) return true; return false; });
  for (let i = 0; i < N; i++) {
    if (!cov[i]) continue;
    const a = M.pts[i], b = M.pts[(i + 1) % N];
    const wp = [];
    for (const side of [-1, 1]) { const o = side * (hw + 0.4); wp.push(...L(a, o, -1.5), ...L(b, o, -1.5), ...L(b, o, 7.5), ...L(a, o, -1.5), ...L(b, o, 7.5), ...L(a, o, 7.5)); }
    wp.push(...L(a, -hw - 0.6, 7.5), ...L(b, -hw - 0.6, 7.5), ...L(b, hw + 0.6, 7.5), ...L(a, -hw - 0.6, 7.5), ...L(b, hw + 0.6, 7.5), ...L(a, hw + 0.6, 7.5));
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    const ng = gg.clone(); const arr = ng.attributes.position.array;
    // make both faces: walls are seen from inside and out
    const flip = []; for (let k = 0; k < arr.length; k += 9) flip.push(arr[k], arr[k + 1], arr[k + 2], arr[k + 6], arr[k + 7], arr[k + 8], arr[k + 3], arr[k + 4], arr[k + 5]);
    const both = new THREE.BufferGeometry(); both.setAttribute('position', new THREE.Float32BufferAttribute([...arr, ...flip], 3)); both.computeVertexNormals();
    B.add(both, null, '#9d968a', 'plain', { outlineT: 0, edges: false });
    if (i % 3 === 0) W.camBoxes.push({ x0: Math.min(a.x, b.x) - hw - 1, y0: a.y + 7.3, z0: Math.min(a.z, b.z) - hw - 1, x1: Math.max(a.x, b.x) + hw + 1, y1: a.y + 9, z1: Math.max(a.z, b.z) + hw + 1 });
    // gallery lights
    if (i % 10 === 0) B.box(a.x - 0.4, a.y + 7.0, a.z - 0.4, a.x + 0.4, a.y + 7.3, a.z + 0.4, '#ffe9b0', 'lamp', { outlineT: 0, edges: false });
  }
  // portals
  for (let i = 0; i < N; i++) {
    const c0 = cov[i], c1 = cov[(i + 1) % N]; if (c0 === c1) continue;
    const p = M.pts[c1 ? (i + 1) % N : i], m = new THREE.Matrix4().makeRotationY(Math.atan2(p.dx, p.dz));
    for (const side of [-1, 1]) K.B.add(new THREE.BoxGeometry(2, 11, 1.6), m.clone().setPosition(p.x - p.dz * side * (hw + 1.2), p.y + 3, p.z + p.dx * side * (hw + 1.2)), '#8a8378', 'plain', { outlineT: 0.1 });
    K.B.add(new THREE.BoxGeometry(METRO.deckW + 6, 2.4, 1.8), m.clone().setPosition(p.x, p.y + 8.6, p.z), '#8a8378', 'plain', { outlineT: 0.1 });
  }
  W.metro = M;
}

// ---------- stations ----------
function stationSign(name) {
  return canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = '#1f2a44'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2ead8'; x.font = `64px ${FONT.body}`; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.beginPath(); x.arc(64, h / 2, 34, 0, 7); x.fillStyle = '#e4572e'; x.fill();
    x.fillStyle = '#ffffff'; x.font = `bold 46px ${FONT.body}`; x.textAlign = 'center'; x.fillText('M', 64, h / 2 + 2);
    x.fillStyle = '#f2ead8'; x.textAlign = 'left'; x.font = `56px ${FONT.body}`; x.fillText(name, 120, h / 2 + 2);
  }).tex;
}
function buildStations(K, M, S, F) {
  const W = K.W, hw = METRO.deckW / 2;
  W.stations = [];
  for (const st of M.stations) {
    const p = M.pts[st.i], yaw = Math.atan2(p.dx, p.dz), half = METRO.platLen / 2;
    const fx = p.dx, fz = p.dz, rx = -p.dz, rz = p.dx;
    const at = (along, side) => [p.x + fx * along + rx * side, p.z + fz * along + rz * side];
    // side platforms, a little higher than the deck, with canopies
    for (const sd of [-1, 1]) {
      const o = sd * (hw + 2.2);
      const [x0, z0] = at(-half, o), [x1, z1] = at(half, o);
      S.add(x0, p.y + 1.2, z0, x1, p.y + 1.2, z1, 2.4);
      const m = new THREE.Matrix4().makeRotationY(yaw);
      K.B.add(new THREE.BoxGeometry(4.8, 2.6, METRO.platLen), m.clone().setPosition(p.x + rx * o, p.y - 0.1, p.z + rz * o), '#d8d0c0', 'paving', { outlineT: 0.08 });
      // canopy on posts
      K.B.add(new THREE.BoxGeometry(5.6, 0.35, METRO.platLen * 0.7), m.clone().setPosition(p.x + rx * (o + sd * 0.3), p.y + 6.6, p.z + rz * (o + sd * 0.3)), st.key === 'central' ? '#e4572e' : '#7aa6b8', 'plain', { outlineT: 0.08 });
      for (let a = -half * 0.65; a <= half * 0.65; a += 11) { const [px, pz] = at(a, o + sd * 1.8); K.cyl(px, p.y + 1.2, pz, 0.14, 5.4, '#3a3550', { outline: 0.03, seg: 6 }); W.boxes.push({ x0: px - 0.2, y0: p.y + 1.2, z0: pz - 0.2, x1: px + 0.2, y1: p.y + 6.6, z1: pz + 0.2 }); }
      // signs
      // name boards on the canopy edge: one facing the tracks, one facing the street
      const smat = W.signMats || (W.signMats = {}); const sm = smat[st.name] || (smat[st.name] = new THREE.MeshBasicMaterial({ map: stationSign(st.name) }));
      for (const face of [-1, 1]) {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), sm);
        const off = o + sd * (face < 0 ? -2.75 : 3.05);
        const [sx, sz] = at(face < 0 ? -12 : 12, off); sign.position.set(sx, p.y + 7.6, sz);
        sign.rotation.y = Math.atan2(rx * sd * face, rz * sd * face); K.scene.add(sign);
      }
      // benches
      for (const a of [-20, 20]) { const [bx, bz] = at(a, o + sd * 1.3); K.bench(bx, bz, Math.abs(fx) > Math.abs(fz), p.y + 1.2, '#c97a3c', false); }
      F.add(new THREE.BoxGeometry(4.4, 2, METRO.platLen - 2), m.clone().setPosition(p.x + rx * o, p.y - 0.3, p.z + rz * o), '#c8c0b0');
    }
    // ramps down to the street on both sides, heading away from the line
    const ramps = [];
    for (const sd of [-1, 1]) {
      const o = sd * (hw + 4.4);
      // ramp runs along the line from the platform end back down to the ground
      const startA = half - 4, [sx, sz] = at(sd > 0 ? startA : -startA, o + sd * 1.6);
      const dirA = sd > 0 ? 1 : -1;
      let len = 30, gy = 0;
      for (len = 30; len < 140; len += 4) { const [ex, ez] = at(dirA * (startA + len), o + sd * 1.6); gy = terrainAt(ex, ez); if ((p.y + 1.2 - gy) / len < 0.14) break; }
      const [ex, ez] = at(dirA * (startA + len), o + sd * 1.6);
      gy = terrainAt(ex, ez);
      S.add(sx, p.y + 1.2, sz, ex, gy, ez, 1.8);
      // its visible deck + side walls + posts
      const n = Math.ceil(len / 6);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const ax = U.lerp(sx, ex, t0), az = U.lerp(sz, ez, t0), ay = U.lerp(p.y + 1.2, gy, t0), bx = U.lerp(sx, ex, t1), bz = U.lerp(sz, ez, t1), by = U.lerp(p.y + 1.2, gy, t1);
        const mid = V3((ax + bx) / 2, (ay + by) / 2 - 0.25, (az + bz) / 2), segL = Math.hypot(bx - ax, bz - az), pitch = Math.atan2(ay - by, segL);
        const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(dirA > 0 ? pitch : -pitch, yaw, 0, 'YXZ')).setPosition(mid);
        K.B.add(new THREE.BoxGeometry(3.8, 0.5, segL + 0.05), m, '#cfc7b8', 'paving', { outlineT: 0, edges: false });
        const g2 = terrainAt(mid.x, mid.z);
        if (mid.y - g2 > 1.5 && k % 2 === 0) { K.cyl(mid.x, g2 - 0.5, mid.z, 0.5, mid.y - g2, '#b8b0a2', { outline: 0.05, seg: 8 }); W.boxes.push({ x0: mid.x - 0.5, y0: g2 - 1, z0: mid.z - 0.5, x1: mid.x + 0.5, y1: mid.y - 0.6, z1: mid.z + 0.5, tag: 'pillar' }); }
      }
      // handrail on the outer edge
      const rp = []; for (let k = 0; k <= n; k++) { const t = k / n; rp.push([U.lerp(sx, ex, t) + rx * sd * 1.75, U.lerp(p.y + 1.2, gy, t) + 1.0, U.lerp(sz, ez, t) + rz * sd * 1.75]); }
      K.rail(rp, { color: '#e9e4f5', postColor: '#7a7468', postMax: 1.3, round: 0, radius: 0.06 });
      ramps.push({ from: [sx, sz], to: [ex, ez] });
    }
    W.stations.push(Object.assign(st, { p, yaw, ramps, platY: p.y + 1.2 }));
  }
}

// ---------- sloped slabs you can skate on (viaduct deck, ramps, bridges) ----------
function makeSlabs() {
  const list = [], grid = makeGrid(24);
  const S = {
    list,
    add(ax, ay, az, bx, by, bz, half) {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1e-3, ux = dx / L, uz = dz / L, gr = (by - ay) / L;
      const s = { ax, ay, az, bx, by, bz, ux, uz, L, half, gr, hit: { slab: true, slope(x, z, out) { out[0] = gr * ux; out[1] = gr * uz; return out; } } };
      list.push(s);
      grid.add(s, Math.min(ax, bx) - half, Math.min(az, bz) - half, Math.max(ax, bx) + half, Math.max(az, bz) + half);
      return s;
    },
    query(x, z, yMax, r = 0) {
      let best = -1e9, hit = null;
      for (const s of grid.query(x, z, x, z, _slq)) {
        const t = (x - s.ax) * s.ux + (z - s.az) * s.uz;
        if (t < -0.05 || t > s.L + 0.05) continue;
        const lat = Math.abs((x - s.ax) * -s.uz + (z - s.az) * s.ux);
        if (lat > s.half + r) continue;
        const y = s.ay + (s.by - s.ay) * U.clamp(t / s.L, 0, 1);
        if (y <= yMax && y > best) { best = y; hit = s.hit; }
      }
      return hit ? { y: best, hit } : null;
    }
  };
  return S;
}
const _slq = [];

// ---------- trains ----------
// cars follow the loop exactly; each car is an oriented box for the roof you stand on and the hit you take
function trainMesh(color, n) {
  const cars = [];
  for (let c = 0; c < n; c++) {
    const parts = [
      [new THREE.BoxGeometry(2.9, 2.7, 15.4), T4(0, 1.6, 0), '#f2eee6'],
      [new THREE.BoxGeometry(2.94, 0.5, 15.42), T4(0, 1.0, 0), color],
      [new THREE.BoxGeometry(2.96, 0.95, 13.6), T4(0, 2.05, 0), '#3a4766'],
      [new THREE.BoxGeometry(2.6, 0.25, 15), T4(0, 3.07, 0), '#b8b4ac'],
      [new THREE.BoxGeometry(2.4, 0.5, 13), T4(0, 0.2, 0), '#3a3a48'],
    ];
    if (c === 0 || c === n - 1) {
      const zz = c === 0 ? 7.8 : -7.8;
      parts.push([new THREE.BoxGeometry(2.8, 2.4, 0.6), T4(0, 1.5, zz), color]);
      for (const sx of [-0.8, 0.8]) parts.push([new THREE.BoxGeometry(0.4, 0.3, 0.1), T4(sx, 0.9, zz + (c === 0 ? 0.32 : -0.32)), '#fff6d0']);
    }
    cars.push(solid(parts, 0.06));
  }
  return cars;
}
function makeTrains(W, M, scene) {
  const trains = [], CARLEN = 16, NCAR = 3;
  const specs = [{ dir: 1, s: 0, color: '#e4572e' }, { dir: 1, s: M.L / 2, color: '#e4572e' }, { dir: -1, s: M.L / 4, color: '#2f8f9d' }, { dir: -1, s: M.L * 3 / 4, color: '#2f8f9d' }];
  for (const sp of specs) {
    const cars = trainMesh(sp.color, NCAR); cars.forEach(c => scene.add(c));
    const T = { dir: sp.dir, s: sp.s, v: 14, cars, state: 'run', wait: 0, color: sp.color, boxes: cars.map(() => ({ cx: 0, cy: 0, cz: 0, fx: 0, fz: 1, vx: 0, vz: 0, top: 0, hit: { tag: 'train', vx: 0, vz: 0, train: true } })), nextStop: null };
    trains.push(T);
  }
  const off = (T) => T.dir > 0 ? METRO.trackOff : -METRO.trackOff;
  const stopS = M.stations.map(s => s.s).sort((a, b) => a - b);
  const _p = {}, _q = {};
  W.trains = trains;
  return {
    trains,
    update(dt) {
      for (const T of trains) {
        // the next station ahead, and how far
        let dist = 1e9;
        for (const ss of stopS) { const d = ((T.dir > 0 ? ss - T.s : T.s - ss) % M.L + M.L) % M.L; if (d < dist) dist = d; }
        if (T.state === 'wait') { T.wait -= dt; T.v = 0; if (T.wait <= 0) { T.state = 'leave'; } }
        else {
          const vmax = 17;
          let target = vmax;
          if (T.state !== 'leave' && dist < 140) target = Math.max(1.2, Math.sqrt(2 * 0.9 * Math.max(0, dist - 0.5)));
          if (T.state === 'leave' && dist > 30 && dist < M.L - 30) T.state = 'run';
          T.v = T.v < target ? Math.min(target, T.v + 1.1 * dt) : Math.max(target, T.v - 2.2 * dt);
          if (T.state === 'run' && dist < 0.8) { T.state = 'wait'; T.wait = 9; T.v = 0; T.arrived = true; }
        }
        T.s = ((T.s + T.dir * T.v * dt) % M.L + M.L) % M.L;
        for (let c = 0; c < T.cars.length; c++) {
          const sc = T.s - T.dir * c * CARLEN;
          const a = metroAt(M, sc + 7, off(T), _p), b = metroAt(M, sc - 7, off(T), _q);
          const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, cz = (a.z + b.z) / 2;
          const car = T.cars[c];
          car.position.set(cx, cy + 0.15, cz);
          const fx = a.x - b.x, fz = a.z - b.z, fl = Math.hypot(fx, fz);
          car.rotation.set(0, 0, 0); car.rotation.order = 'YXZ'; car.rotation.y = Math.atan2(fx, fz) + (T.dir > 0 ? 0 : Math.PI); car.rotation.x = (T.dir > 0 ? -1 : 1) * Math.atan2(a.y - b.y, fl);
          const bx = T.boxes[c];
          bx.cx = cx; bx.cy = cy; bx.cz = cz; bx.fx = fx / fl; bx.fz = fz / fl; bx.grade = (a.y - b.y) / fl;
          const spd = T.v * T.dir; bx.vx = bx.fx * spd; bx.vz = bx.fz * spd; bx.hit.vx = bx.vx; bx.hit.vz = bx.vz; bx.top = cy + 3.35;
        }
      }
    },
    // standing on a roof?
    ground(x, z, yMax) {
      let best = null;
      for (const T of trains) for (const b of T.boxes) {
        const dx = x - b.cx, dz = z - b.cz, along = dx * b.fx + dz * b.fz, lat = dx * -b.fz + dz * b.fx;
        if (Math.abs(along) > 7.7 || Math.abs(lat) > 1.45) continue;
        const y = b.top + along * b.grade;
        if (y <= yMax && (!best || y > best.y)) best = { y, hit: b.hit };
      }
      return best;
    },
    // inside a car's body (below the roof): you've been hit
    hits(p) {
      for (const T of trains) {
        if (T.v < 0.5) continue;
        for (const b of T.boxes) {
          const dx = p.x - b.cx, dz = p.z - b.cz, along = dx * b.fx + dz * b.fz, lat = dx * -b.fz + dz * b.fx;
          if (Math.abs(along) < 8.1 && Math.abs(lat) < 1.75 && p.y < b.top - 0.4 + along * b.grade && p.y + 1.7 > b.cy) return T;
        }
      }
      return null;
    }
  };
}
