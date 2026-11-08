// ============================================================
//  METRO — a two-track loop on viaducts, seven stations, a gallery
//  through the ridge between Park and Hilltop. Trains you can ride on
//  (roof) and that knock you off the rails.
// ============================================================
// the loop, as drawn on the sketch (cubic Béziers in map units), starting at Hilltop
// (the joints are smooth: each segment leaves a station the way the last one arrived)
const METRO_SVG = [
  [[235, 115], [260, 129], [270, 200], [280, 262]],
  [[280, 262], [290, 320], [302, 360], [295, 400]],
  [[295, 400], [290, 428], [240, 445], [205, 440]],
  [[205, 440], [165, 435], [130, 400], [125, 350]],
  [[125, 350], [122, 310], [195, 320], [195, 265]],     // north into Central, straight through it…
  [[195, 265], [195, 215], [80, 230], [80, 175]],       // …then west under downtown, and north into Park
  [[80, 175], [80, 125], [190, 90], [235, 115]],        // north out of Park, round through the ridge to Hilltop
];
// downtown: inside this rect the line runs underground; Central is a sunken station open to the sky
const DOWNTOWN = [-250, -700, 370, 250];
const STN = { hw: 8.6, ceil: 7.5 };      // underground hall: half width, ceiling over the deck
const METRO = { deckW: 11, trackOff: 2.3, step: 3, clear: 9, platLen: 96, bore: 9 };   // bore: least cover for a real tunnel (less: an open cutting)

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
  const inDown = (p) => p.x > DOWNTOWN[0] && p.x < DOWNTOWN[2] && p.z > DOWNTOWN[1] && p.z < DOWNTOWN[3];
  const under = pts.map(inDown);
  for (const st of stations) {
    st.under = under[st.i];
    let g = st.under ? 1e9 : -1e9; for (let d = -half; d <= half; d++) g = st.under ? Math.min(g, ground[(st.i + d + N) % N]) : Math.max(g, ground[(st.i + d + N) % N]);
    st.y = st.under ? g - 10 : g + METRO.clear - 1;
    for (let d = -half; d <= half; d++) fixed[(st.i + d + N) % N] = st.y;
  }
  // the approaches: free to dip below the ground for a few hundred metres either side of downtown
  const free = new Array(N).fill(false), reach = Math.round(330 / METRO.step);
  for (let i = 0; i < N; i++) if (under[i]) for (let d = -reach; d <= reach; d++) { const j = (i + d + N) % N; if (!under[j]) free[j] = true; }
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
    for (let i = 0; i < N; i++) {
      if (fixed[i] !== null) continue;
      if (under[i]) y[i] = Math.min(y[i], ground[i] - 10);
      else if (!inTunnelSpan(i) && !free[i]) y[i] = Math.max(y[i], ground[i] + 6);
    }
    // smooth (never touching the platforms)
    const y2 = y.slice();
    for (let i = 0; i < N; i++) { if (fixed[i] !== null) continue; let s = 0, c = 0; for (let d = -12; d <= 12; d++) { s += y[(i + d + N) % N]; c++; } y2[i] = s / c; }
    for (let i = 0; i < N; i++) y[i] = y2[i];
  }
  for (let i = 0; i < N; i++) { pts[i].y = y[i]; pts[i].g = ground[i]; }
  // directions
  for (let i = 0; i < N; i++) { const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N]; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); pts[i].dx = dx / l; pts[i].dz = dz / l; }
  for (const st of stations) {
    if (st.under) {
      // a real underground station: a hall round the platforms, and four stairways up to the street,
      // two off each platform, each in an open well (a terrain hole on the grid's lines)
      const sn = (v, o, c, up) => o + (up ? Math.ceil((v - o) / c - 1e-6) : Math.floor((v - o) / c + 1e-6)) * c;
      st.exits = [];
      for (const k of [-9, 9]) for (const sd of [-1, 1]) {
        const e = pts[(st.i + k + N) % N], nx = -e.dz * sd, nz = e.dx * sd;          // straight out sideways
        const ax = Math.abs(nx) > Math.abs(nz) ? 'x' : 'z';
        const x0 = e.x + nx * STN.hw, z0 = e.z + nz * STN.hw, y0 = st.y + 1.2;
        let run = 22; for (let it = 0; it < 3; it++) { const g = terrainAt(x0 + nx * (run + 6), z0 + nz * (run + 6)); run = U.clamp((g - y0) / 0.45, 12, 30); }
        const L = 3 + run + 3, x1 = x0 + nx * L, z1 = z0 + nz * L, w = 2.4, gTop = terrainAt(x1, z1);
        // the well opens a few metres out from the hall (the first steps run under a slab)
        const o0x = x0 + nx * 7, o0z = z0 + nz * 7;
        const rx0 = Math.min(o0x, x1) - (ax === 'z' ? w : 0), rx1 = Math.max(o0x, x1) + (ax === 'z' ? w : 0), rz0 = Math.min(o0z, z1) - (ax === 'x' ? w : 0), rz1 = Math.max(o0z, z1) + (ax === 'x' ? w : 0);
        const hole = [sn(rx0, TER.x0, TER.cell, nx < 0 && ax === 'x' ? 0 : ax === 'x' ? 1 : 0), sn(rz0, TER.z0, TER.cell, nz < 0 && ax === 'z' ? 0 : ax === 'z' ? 1 : 0), sn(rx1, TER.x0, TER.cell, ax === 'x' && nx < 0 ? 0 : 1), sn(rz1, TER.z0, TER.cell, ax === 'z' && nz < 0 ? 0 : 1)];
        // keep the hole's hall-side edge outside the hall
        if (ax === 'x') { if (nx > 0) hole[0] = Math.max(hole[0], sn(x0 + 1, TER.x0, TER.cell, 1)); else hole[2] = Math.min(hole[2], sn(x0 - 1, TER.x0, TER.cell, 0)); }
        else { if (nz > 0) hole[1] = Math.max(hole[1], sn(z0 + 1, TER.z0, TER.cell, 1)); else hole[3] = Math.min(hole[3], sn(z0 - 1, TER.z0, TER.cell, 0)); }
        let top = -1e9; for (let x = hole[0]; x <= hole[2]; x += TER.cell) for (let z = hole[1]; z <= hole[3]; z += TER.cell) top = Math.max(top, terrainAt(x, z));
        TER.holes.push(hole);
        st.exits.push({ k, sd, nx, nz, ax, x0, z0, y0, run, L, w, x1, z1, gTop, hole, top });
      }
    }
  }
  // covered parts: the ground is well above the deck
  for (let i = 0; i < N; i++) { pts[i].covered = ground[i] > y[i] + 5 && !inHole(pts[i].x, pts[i].z); pts[i].down = under[i] || free[i]; pts[i].bored = ground[i] - y[i] >= METRO.bore && !inHole(pts[i].x, pts[i].z); }
  // portals: where the bored tunnel meets the cutting the heightfield can't overhang, so the ground
  // there is cut away (a terrain hole) and rebuilt as a concrete portal block in buildMetro
  const portals = [];
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N]; if (a.bored === b.bored) continue;
    const m = a.bored ? b : a, inner = a.bored ? a : b;
    const sn = (v, o, c, up) => o + (up ? Math.ceil((v - o) / c) : Math.floor((v - o) / c)) * c;
    const hole = [sn(m.x - 11, TER.x0, TER.cell, 0), sn(m.z - 11, TER.z0, TER.cell, 0), sn(m.x + 11, TER.x0, TER.cell, 1), sn(m.z + 11, TER.z0, TER.cell, 1)];
    let top = -1e9; for (let x = hole[0]; x <= hole[2]; x += TER.cell) for (let z = hole[1]; z <= hole[3]; z += TER.cell) top = Math.max(top, terrainAt(x, z));
    TER.holes.push(hole); portals.push({ i, hole, top, y: inner.y });
  }
  return { pts, L, N, stations, step: L / N, portals };
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
  }
  // split the deck triangles: top/sides go to concrete, ballast strips darker
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  B.add(g, null, deckCol, 'plain', { outlineT: 0, edges: false });
  // the track bed: ballast with sleepers (textured along the line, in chunks so cells can cull it)
  const tex = canvasTex(128, 128, (x, w, h) => {
    const r = U.rng(3); x.fillStyle = '#8f877a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${40 + r() * 60},${40 + r() * 50},${35 + r() * 40},${0.25 + r() * 0.3})`; x.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
    for (const y of [10, 74]) { x.fillStyle = '#5a4636'; x.fillRect(6, y, w - 12, 40); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(6, y, w - 12, 5); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(6, y + 36, w - 12, 4); }
  }, { repeat: true }).tex;
  const bedMat = new THREE.MeshToonMaterial({ map: tex, gradientMap: G.grad, color: 0xffffff });
  for (let c0 = 0; c0 < N; c0 += 40) {
    const pos2 = [], uv2 = [];
    for (let i = c0; i < Math.min(N, c0 + 40); i++) {
      const a = M.pts[i], b = M.pts[(i + 1) % N], va = i * M.step / 1.2, vb = (i + 1) * M.step / 1.2;
      for (const side of [-1, 1]) {
        const c = side * METRO.trackOff;
        pos2.push(...L(a, c - 1.35, 0.12), ...L(b, c - 1.35, 0.12), ...L(b, c + 1.35, 0.12), ...L(a, c - 1.35, 0.12), ...L(b, c + 1.35, 0.12), ...L(a, c + 1.35, 0.12));
        uv2.push(0, va, 0, vb, 1, vb, 0, va, 1, vb, 1, va);
      }
    }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(uv2, 2)); g2.computeVertexNormals();
    const mid = M.pts[Math.min(N - 1, c0 + 20)];
    (W.cellExtras || (W.cellExtras = [])).push({ mesh: new THREE.Mesh(g2, bedMat), x: mid.x, z: mid.z });
  }
  // the running rails: shiny heads on dark webs, standing proud of the sleepers
  const top = [], web = [];
  for (let i = 0; i < N; i++) {
    const a = M.pts[i], b = M.pts[(i + 1) % N];
    for (const side of [-1, 1]) for (const r of [-0.72, 0.72]) {
      const c = side * METRO.trackOff + r, h = 0.36, f = 0.16;
      top.push(...L(a, c - 0.07, h), ...L(b, c - 0.07, h), ...L(b, c + 0.07, h), ...L(a, c - 0.07, h), ...L(b, c + 0.07, h), ...L(a, c + 0.07, h));
      web.push(...L(a, c + 0.07, h), ...L(b, c + 0.07, h), ...L(b, c + 0.07, f), ...L(a, c + 0.07, h), ...L(b, c + 0.07, f), ...L(a, c + 0.07, f));
      web.push(...L(a, c - 0.07, f), ...L(b, c - 0.07, f), ...L(b, c - 0.07, h), ...L(a, c - 0.07, f), ...L(b, c - 0.07, h), ...L(a, c - 0.07, h));
    }
  }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); tg.computeVertexNormals();
  B.add(tg, null, '#e6e9ef', 'plain', { outlineT: 0, edges: false });
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(web, 3)); wg.computeVertexNormals();
  B.add(wg, null, '#4a4e58', 'plain', { outlineT: 0, edges: false });
  // grindable running rails (in long runs, so grinding carries you far)
  const run = (side, r) => { const P = []; for (let i = 0; i <= N; i++) { const p = M.pts[i % N]; P.push(L(p, side * METRO.trackOff + r, 0.38)); } return P; };
  for (const side of [-1, 1]) for (const r of [-0.72, 0.72]) K.rail(run(side, r), { hidden: true, loop: false, round: 0, voice: 'metro' });
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
  // (never in a traffic lane: where the line crosses a road, the pillar steps to the kerb or the span grows)
  const onRoad = (x, z) => { for (const k in (W.roads || {})) { const rd = W.roads[k], P = rd.pts; for (let j = 0; j < P.length - 1; j++) { const [ax, az] = P[j], [bx, bz] = P[j + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, u = U.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); if (Math.hypot(ax + dx * u - x, az + dz * u - z) < rd.width / 2 + 1.6) return true; } } return false; };
  for (let i0 = 0; i0 < N; i0 += 9) {
    let i = i0; if (onRoad(M.pts[i].x, M.pts[i].z)) { i = -1; for (const o of [3, -3, 5, -5, 7, -7]) { const k = i0 + o; if (k >= 0 && k < N && !onRoad(M.pts[k].x, M.pts[k].z)) { i = k; break; } } if (i < 0) continue; }
    const p = M.pts[i];
    if (p.covered || inHole(p.x, p.z)) continue;
    const gy = Math.min(terrainAt(p.x - p.dz * 2, p.z + p.dx * 2), terrainAt(p.x + p.dz * 2, p.z - p.dx * 2), terrainAt(p.x, p.z));
    if (p.y - 1.5 - gy < 1.2) continue;
    const m = new THREE.Matrix4().makeRotationY(Math.atan2(p.dx, p.dz)).setPosition(p.x, (gy - 1 + p.y - 1.4) / 2, p.z);
    const h = p.y - 1.4 - gy + 1;
    K.B.add(new THREE.BoxGeometry(2.6, h, 2.2), m, pillarCol, 'plain', { outlineT: 0.08 });
    W.boxes.push({ x0: p.x - 1.3, y0: gy - 1, z0: p.z - 1.3, x1: p.x + 1.3, y1: p.y - 1.4, z1: p.z + 1.3, tag: 'pillar' });
    if (i0 % 18 === 0) F.add(new THREE.BoxGeometry(2.2, h, 1.8), m, pillarCol);
  }
  // far deck (a simple band)
  const fp = []; for (let i = 0; i < N; i += 4) { const a = M.pts[i], b = M.pts[(i + 4) % N]; const fq = (A, Bb, C, D) => fp.push(...A, ...Bb, ...C, ...A, ...C, ...D); fq(L(a, -hw + 0.4, -0.2), L(b, -hw + 0.4, -0.2), L(b, hw - 0.4, -0.2), L(a, hw - 0.4, -0.2)); fq(L(a, hw - 0.4, -0.2), L(b, hw - 0.4, -0.2), L(b, hw - 0.4, -1.3), L(a, hw - 0.4, -1.3)); fq(L(a, -hw + 0.4, -1.3), L(b, -hw + 0.4, -1.3), L(b, -hw + 0.4, -0.2), L(a, -hw + 0.4, -0.2)); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); F.add(fg, null, sideCol);
  // the gallery: walls + roof where the line runs under the hill (and a bit either side)
  // (only where the line is properly bored: the hill stays whole above it; elsewhere it runs in an open cutting)
  const inPortal = (p) => (M.portals || []).some(q => p.x > q.hole[0] - 2 && p.x < q.hole[2] + 2 && p.z > q.hole[1] - 2 && p.z < q.hole[3] + 2);
  const cov = M.pts.map((p, i) => { if (inPortal(p)) return true; for (let d = -1; d <= 1; d++) if (M.pts[(i + d + N) % N].bored) return true; return false; });
  const inHall = (i) => M.stations.some(st => st.under && Math.abs(((i - st.i) % N + N + N / 2) % N - N / 2) <= Math.round(METRO.platLen / 2 / M.step) + 1);
  for (let i = 0; i < N; i++) {
    if (!cov[i] || inHall(i)) continue;
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
  // portal blocks: fill each portal hole with concrete up to the hillside, leaving the line's corridor open
  for (const q of (M.portals || [])) {
    const [hx0, hz0, hx1, hz1] = q.hole, roof = q.y + 7.5, wc = '#9d968a';
    K.box(hx0, roof, hz0, hx1, q.top + 0.3, hz1, wc, 'paving', { outlineT: 0.06 });
    const near = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const p = M.pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } } const p = M.pts[bi]; return Math.abs((x - p.x) * -p.dz + (z - p.z) * p.dx); };
    for (let x = hx0; x < hx1; x += 3) for (let z = hz0; z < hz1; z += 3) if (near(x + 1.5, z + 1.5) > 7.4) K.box(x, q.y - 2, z, x + 3, roof + 0.05, z + 3, wc, 'paving', { outlineT: 0.04 });
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
  const W = K.W, B = K.B, N = M.N;
  W.stations = [];
  const IN = 3.95, WIDTH = 4.6, PH = 1.2, CAN = 6.6;      // platform starts right where the train ends
  const L = (p, o, dy = 0) => [p.x - p.dz * o, p.y + dy, p.z + p.dx * o];
  const quads = { plat: [], edge: [], side: [], can: [] };
  const q = (arr, a, b, c, d) => arr.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (const st of M.stations) {
    const p = M.pts[st.i], yaw = Math.atan2(p.dx, p.dz), hn = Math.round(METRO.platLen / 2 / M.step);
    const idx = (k) => (st.i + k + N) % N;
    for (const sd of [-1, 1]) {
      const oi = sd * IN, oo = sd * (IN + WIDTH), om = sd * (IN + WIDTH / 2);
      for (let k = -hn; k < hn; k++) {
        const a = M.pts[idx(k)], b = M.pts[idx(k + 1)];
        const A = sd > 0 ? [oi, oo] : [oo, oi];
        q(quads.plat, L(a, A[0], PH), L(b, A[0], PH), L(b, A[1], PH), L(a, A[1], PH));
        // the yellow line along the edge, the face down to the track, the back wall
        const e0 = sd * (IN + 0.05), e1 = sd * (IN + 0.45), E = sd > 0 ? [e0, e1] : [e1, e0];
        q(quads.edge, L(a, E[0], PH + 0.02), L(b, E[0], PH + 0.02), L(b, E[1], PH + 0.02), L(a, E[1], PH + 0.02));
        if (sd > 0) { q(quads.side, L(a, oi, 0), L(b, oi, 0), L(b, oi, PH), L(a, oi, PH)); q(quads.side, L(a, oo, PH), L(b, oo, PH), L(b, oo, -2.2), L(a, oo, -2.2)); }
        else { q(quads.side, L(a, oi, PH), L(b, oi, PH), L(b, oi, 0), L(a, oi, 0)); q(quads.side, L(a, oo, -2.2), L(b, oo, -2.2), L(b, oo, PH), L(a, oo, PH)); }
        S.add(...L(a, om, PH), ...L(b, om, PH), WIDTH / 2);
        // canopy over the middle two thirds
        if (!st.under && Math.abs(k) < hn * 0.7) {
          const c0 = sd * (IN + 0.3), c1 = sd * (IN + WIDTH + 0.6), C = sd > 0 ? [c0, c1] : [c1, c0];
          q(quads.can, L(a, C[0], CAN), L(b, C[0], CAN), L(b, C[1], CAN), L(a, C[1], CAN));
          q(quads.can, L(a, C[1], CAN - 0.3), L(b, C[1], CAN - 0.3), L(b, C[0], CAN - 0.3), L(a, C[0], CAN - 0.3));
          if (k % 4 === 0) { const [px, , pz] = L(a, sd * (IN + WIDTH - 0.6)); K.cyl(px, p.y + PH, pz, 0.14, CAN - PH, '#3a3550', { outline: 0.03, seg: 6 }); W.boxes.push({ x0: px - 0.2, y0: p.y + PH, z0: pz - 0.2, x1: px + 0.2, y1: p.y + CAN, z1: pz + 0.2 }); }
        }
        if (k % 3 === 0) { const [fx, , fz] = L(a, om); F.add(new THREE.BoxGeometry(WIDTH - 0.4, 2, M.step * 3), new THREE.Matrix4().makeRotationY(Math.atan2(a.dx, a.dz)).setPosition(fx, p.y - 0.2, fz), '#c8c0b0'); }
      }
      // name boards and benches along the platform
      const smat = W.signMats || (W.signMats = {}); const sm = smat[st.name] || (smat[st.name] = new THREE.MeshBasicMaterial({ map: stationSign(st.name) }));
      for (const [k, face] of [[-4, -1], [4, 1]]) {
        const a = M.pts[idx(k)], under = st.under, [sx, , sz] = L(a, under ? sd * (STN.hw - 0.08) : sd * (face < 0 ? IN + 0.35 : IN + WIDTH + 0.65), CAN + 0.9);
        if (under && face > 0) continue;
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), sm); sign.position.set(sx, p.y + (under ? PH + 2.8 : CAN + 0.9), sz);
        if (under) { sign.rotation.y = Math.atan2(a.dz * sd, -a.dx * sd); K.scene.add(sign); continue; }
        const nx = a.dz * sd * face, nz = -a.dx * sd * face; sign.rotation.y = Math.atan2(nx, nz); K.scene.add(sign);
      }
      for (const k of [-8, 8]) { const a = M.pts[idx(k)], [bx, , bz] = L(a, sd * (IN + WIDTH - 1.3)); K.bench(bx, bz, Math.abs(a.dx) > Math.abs(a.dz), p.y + PH, '#c97a3c', false); W.benches.push({ x: bx, y: p.y + PH, z: bz, alongX: Math.abs(a.dx) > Math.abs(a.dz) }); }
    }
    const ramps = [];
    if (st.under) { undergroundHall(K, S, M, st, p, ramps, hn, PH); W.stations.push(Object.assign(st, { p, yaw, ramps, platY: p.y + PH, platOff: IN + WIDTH / 2 })); continue; }
    // ramps down to the street, leaving each platform end at an angle, away from the line
    for (const sd of [-1, 1]) {
      const kEnd = sd > 0 ? hn : -hn, e = M.pts[idx(kEnd)], dirA = sd > 0 ? 1 : -1;
      const tx = e.dx * dirA, tz = e.dz * dirA, ox = -e.dz * sd, oz = e.dx * sd;
      const ux = tx * 0.86 + ox * 0.5, uz = tz * 0.86 + oz * 0.5;
      const [sx, , sz] = L(e, sd * (IN + WIDTH / 2), PH);
      let len = 30, gy = 0;
      for (len = 30; len < 150; len += 4) { gy = terrainAt(sx + ux * len, sz + uz * len); if ((p.y + PH - gy) / len < 0.13) break; }
      const ex = sx + ux * len, ez = sz + uz * len; gy = terrainAt(ex, ez);
      S.add(sx, p.y + PH, sz, ex, gy, ez, 1.9);
      const ryaw = Math.atan2(ux, uz), n = Math.ceil(len / 6);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, ay = U.lerp(p.y + PH, gy, t0), by = U.lerp(p.y + PH, gy, t1);
        const mid = V3(sx + ux * len * (t0 + t1) / 2, (ay + by) / 2 - 0.25, sz + uz * len * (t0 + t1) / 2), segL = len / n;
        B.add(new THREE.BoxGeometry(3.9, 0.5, segL + 0.05), new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.atan2(ay - by, segL), ryaw, 0, 'YXZ')).setPosition(mid), '#cfc7b8', 'paving', { outlineT: 0.05, edges: false });
        const g2 = terrainAt(mid.x, mid.z);
        if (mid.y - g2 > 1.5 && k % 2 === 0) { K.cyl(mid.x, g2 - 0.5, mid.z, 0.45, mid.y - g2, '#b8b0a2', { outline: 0.05, seg: 8 }); W.boxes.push({ x0: mid.x - 0.45, y0: g2 - 1, z0: mid.z - 0.45, x1: mid.x + 0.45, y1: mid.y - 0.6, z1: mid.z + 0.45, tag: 'pillar' }); }
      }
      for (const side of [-1, 1]) {
        const rx = -uz * side * 1.8, rz = ux * side * 1.8, rp = [];
        for (let k = 0; k <= n; k++) { const t = k / n; rp.push([sx + ux * len * t + rx, U.lerp(p.y + PH, gy, t) + 1.0, sz + uz * len * t + rz]); }
        K.rail(rp, { color: '#e9e4f5', postColor: '#7a7468', postMax: 1.3, round: 0, radius: 0.06 });
      }
      ramps.push({ from: [sx, sz], to: [ex, ez] });
    }
    W.stations.push(Object.assign(st, { p, yaw, ramps, platY: p.y + PH, platOff: IN + WIDTH / 2 }));
  }
  const mk = (arr, col, kind) => { if (!arr.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); B.add(g, null, col, kind, { outlineT: 0, edges: false }); };
  mk(quads.plat, '#d8d0c0', 'paving'); mk(quads.edge, '#e8c84a', 'paint'); mk(quads.side, '#b9b1a2', 'plain'); mk(quads.can, '#7aa6b8', 'plain');
}

// an underground station: the hall (walls, ceiling, lights) and its four stairways up to the street
function undergroundHall(K, S, M, st, p, ramps, hn, PH) {
  const W = K.W, B = K.B, N = M.N, HW = STN.hw, CY = STN.ceil, py = p.y + PH;
  const L = (q, o, dy = 0) => [q.x - q.dz * o, q.y + dy, q.z + q.dx * o];
  const idx = (k) => (st.i + k + N) % N, wall = [], ceil = [];
  const q4 = (arr, a, b, c, d) => arr.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c);
  const doorAt = (k, sd) => st.exits.some(e => e.sd === sd && (k === e.k || k === e.k - 1));
  for (let k = -hn - 1; k <= hn; k++) {
    const a = M.pts[idx(k)], b = M.pts[idx(k + 1)];
    for (const sd of [-1, 1]) {
      const o = sd * HW;
      if (doorAt(k, sd)) q4(wall, L(a, o, PH + 3.6), L(b, o, PH + 3.6), L(b, o, CY), L(a, o, CY));   // over a doorway
      else q4(wall, L(a, o, -2), L(b, o, -2), L(b, o, CY), L(a, o, CY));
    }
    q4(ceil, L(a, -HW - 0.2, CY), L(b, -HW - 0.2, CY), L(b, HW + 0.2, CY), L(a, HW + 0.2, CY));
    W.camBoxes.push({ x0: Math.min(a.x, b.x) - HW - 1, y0: a.y + CY - 0.2, z0: Math.min(a.z, b.z) - HW - 1, x1: Math.max(a.x, b.x) + HW + 1, y1: a.y + CY + 3, z1: Math.max(a.z, b.z) + HW + 1 });
    if ((k + hn) % 3 === 1) for (const sd of [-1, 1]) { const [lx, ly, lz] = L(a, sd * 6.3, CY - 0.25); B.box(lx - 0.5, ly, lz - 0.5, lx + 0.5, ly + 0.2, lz + 0.5, '#fff2c8', 'lamp', { outlineT: 0, edges: false }); }
  }
  // end walls between the tunnel mouth and the hall's sides
  for (const k of [-hn - 1, hn + 1]) { const a = M.pts[idx(k)]; for (const sd of [-1, 1]) q4(wall, L(a, sd * 5.9, -2), L(a, sd * HW, -2), L(a, sd * HW, CY), L(a, sd * 5.9, CY)); }
  const mk = (arr, col, kind) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); B.add(g, null, col, kind, { outlineT: 0, edges: false }); };
  mk(wall, '#e6dcc4', 'plain'); mk(ceil, '#5d5a54', 'plain');
  // the stairways
  for (const e of st.exits) {
    const { nx, nz, x0, z0, y0, run, w, gTop, hole, top } = e, at = (d) => [x0 + nx * d, z0 + nz * d];
    const sx = -nz, sz = nx;            // across the stair
    const yTop = gTop + 0.05;
    // doorway landing (level), the flight, the top landing — physics: two boxes and a ramp
    const box = (d0, d1, y) => { const [ax, az] = at(d0), [bx, bz] = at(d1); K.box(Math.min(ax, bx) - Math.abs(sx) * w, p.y - 2, Math.min(az, bz) - Math.abs(sz) * w, Math.max(ax, bx) + Math.abs(sx) * w, y, Math.max(az, bz) + Math.abs(sz) * w, '#d8d0c0', 'paving', { outlineT: 0.04 }); };
    box(-0.4, 3, y0);
    { const [ax, az] = at(3), [bx, bz] = at(3 + run), axis = e.ax;
      const xa = Math.min(ax, bx) - Math.abs(sx) * w, xb = Math.max(ax, bx) + Math.abs(sx) * w, za = Math.min(az, bz) - Math.abs(sz) * w, zb = Math.max(az, bz) + Math.abs(sz) * w;
      const up = (axis === 'x' ? nx : nz) > 0;
      K.ramp(xa, za, xb, zb, axis, up ? y0 + 0.12 : yTop, up ? yTop : y0 + 0.12, '#cfc7b8', false, p.y - 2);
      // steps (look)
      const n = Math.max(8, Math.round((yTop - y0) / 0.32));
      for (let j = 0; j < n; j++) { const d0 = 3 + run * j / n, d1 = 3 + run * (j + 1) / n, y = U.lerp(y0, yTop, (j + 1) / n); const [cx0, cz0] = at(d0), [cx1, cz1] = at(d1);
        B.box(Math.min(cx0, cx1) - Math.abs(sx) * w, y - 0.32, Math.min(cz0, cz1) - Math.abs(sz) * w, Math.max(cx0, cx1) + Math.abs(sx) * w, y + 0.04, Math.max(cz0, cz1) + Math.abs(sz) * w, j % 2 ? '#dcd4c4' : '#cfc7b8', 'paving', { outlineT: 0.02, edges: false }); }
      // handrails both sides (grindable, of course)
      for (const sd2 of [-1, 1]) { const rp = []; for (let j = 0; j <= 8; j++) { const d = 3 + run * j / 8, [cx, cz] = at(d); rp.push([cx + sx * sd2 * (w - 0.25), U.lerp(y0, yTop, j / 8) + 1.0, cz + sz * sd2 * (w - 0.25)]); } K.rail(rp, { color: '#e9e4f5', postColor: '#7a7468', postMax: 1.2, round: 0, radius: 0.06 }); }
      ramps.push({ from: at(0), to: at(e.L) });
    }
    box(3 + run, e.L + 0.5, yTop);
    // the passage under the street before the well opens: walls and a slab
    // the well: everything in the hole that isn't stairway is solid up to the street
    for (let x = hole[0]; x < hole[2]; x += 2) for (let z = hole[1]; z < hole[3]; z += 2) {
      const cx = x + 1, cz = z + 1, along = (cx - x0) * nx + (cz - z0) * nz, across = Math.abs((cx - x0) * sx + (cz - z0) * sz);
      if (across < w + 0.2 && along > -1 && along < e.L + 0.6) continue;
      K.box(x, p.y - 2, z, x + 2, top + 0.15, z + 2, '#cbbfa6', 'paving', { outlineT: 0.04 });
    }
    // side walls of the stairway (inside the well and in the covered stretch), a slab over the covered part
    for (const sd2 of [-1, 1]) { const [ax, az] = at(0), [bx, bz] = at(e.L + 0.5), ox = sx * sd2 * (w + 0.3), oz = sz * sd2 * (w + 0.3);
      K.box(Math.min(ax, bx) + ox - 0.3, p.y - 2, Math.min(az, bz) + oz - 0.3, Math.max(ax, bx) + ox + 0.3, yTop + 1.0, Math.max(az, bz) + oz + 0.3, '#e6dcc4', 'plain', { outlineT: 0.04 });
      const rp = [[bx + ox * 0.95 - nx * (e.L - 6), yTop + 1.1, bz + oz * 0.95 - nz * (e.L - 6)], [bx + ox * 0.95, yTop + 1.1, bz + oz * 0.95]]; K.rail(rp, { color: '#e9e4f5', postColor: '#3a3550', round: 0 }); }
    { const [ax, az] = at(-0.4), [bx, bz] = at(Math.max(1, (e.ax === 'x' ? Math.abs((nx > 0 ? hole[0] : hole[2]) - x0) : Math.abs((nz > 0 ? hole[1] : hole[3]) - z0)))); const gy = terrainAt((ax + bx) / 2, (az + bz) / 2);
      B.box(Math.min(ax, bx) - Math.abs(sx) * (w + 0.6), p.y + CY, Math.min(az, bz) - Math.abs(sz) * (w + 0.6), Math.max(ax, bx) + Math.abs(sx) * (w + 0.6), Math.max(p.y + CY + 0.4, gy - 0.05), Math.max(az, bz) + Math.abs(sz) * (w + 0.6), '#d8d0c0', 'paving', { outlineT: 0, edges: false }); }
    // street entrance: a little glass canopy on two posts and an M sign
    { const [tx, tz] = at(e.L - 2), ty = yTop;
      for (const sd2 of [-1, 1]) K.cyl(tx + sx * sd2 * (w + 0.3), ty, tz + sz * sd2 * (w + 0.3), 0.1, 3.1, '#3a3550', { outline: 0.03, seg: 6 });
      B.box(tx - Math.abs(sx) * (w + 0.8) - Math.abs(nx) * 2, ty + 3.1, tz - Math.abs(sz) * (w + 0.8) - Math.abs(nz) * 2, tx + Math.abs(sx) * (w + 0.8) + Math.abs(nx) * 2, ty + 3.3, tz + Math.abs(sz) * (w + 0.8) + Math.abs(nz) * 2, '#7aa6b8', 'plain', { outlineT: 0.04 });
      const [mx, mz] = at(e.L + 0.8), px = mx + sx * (w + 1.2), pz = mz + sz * (w + 1.2);
      K.cyl(px, ty, pz, 0.08, 3.6, '#3a3550', { outline: 0.03, seg: 6 });
      K.sphere(px, ty + 3.9, pz, 0.45, '#e4572e', { outline: 0.05 });
    }
  }
}

// an underground station's court: retaining walls (ledges on top), ramps from the street down to
// each platform along the long walls, railings round the edge (grindable), lights
function sunkenCourt(K, S, st, p, ramps, platOut, PH) {
  const W = K.W, B = K.B, [hx0, hz0, hx1, hz1] = st.hole, py = p.y + PH;
  const edgeY = (x, z) => terrainAt(x, z);
  const top = Math.max(edgeY(hx0, hz0), edgeY(hx1, hz0), edgeY(hx0, hz1), edgeY(hx1, hz1)) + 0.4;
  // walls: from below the deck up to just above the street; their tops are ledges
  const wc = '#cbbfa6';
  K.box(hx0 - 1.2, p.y - 3, hz0 - 1.2, hx0, top, hz1 + 1.2, wc, 'paving', { outlineT: 0.06 });
  K.box(hx1, p.y - 3, hz0 - 1.2, hx1 + 1.2, top, hz1 + 1.2, wc, 'paving', { outlineT: 0.06 });
  // the end walls open where each ramp comes up from the street
  const gw = (sd) => { const a = p.x + sd * (platOut - 0.1), b = p.x + sd * (platOut + 4.3); return [Math.min(a, b), Math.max(a, b)]; };
  const [wa, wb] = gw(-1), [ea, eb] = gw(1);
  K.box(hx0, p.y - 3, hz0 - 1.2, wa, top, hz0, wc, 'paving', { outlineT: 0.06 }); K.box(wb, p.y - 3, hz0 - 1.2, hx1, top, hz0, wc, 'paving', { outlineT: 0.06 });
  K.box(hx0, p.y - 3, hz1, ea, top, hz1 + 1.2, wc, 'paving', { outlineT: 0.06 }); K.box(eb, p.y - 3, hz1, hx1, top, hz1 + 1.2, wc, 'paving', { outlineT: 0.06 });
  // the floor of the court (outside the platforms)
  B.box(hx0, p.y - 2.2, hz0, hx1, p.y - 1.6, hz1, '#9a9488', 'paving', { outlineT: 0, edges: false });
  // a ramp along each long wall: down from the street at one end to the platform at the other
  const drop = top - py, len = Math.min(hz1 - hz0 - 8, Math.max(40, drop / 0.13));
  for (const sd of [-1, 1]) {
    const x0 = p.x + sd * (platOut - 0.1), x1 = p.x + sd * (platOut + 4.3), xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const zTop = sd < 0 ? hz0 - 1.2 : hz1 + 1.2, zBot = (sd < 0 ? hz0 : hz1) - sd * len;   // west ramp starts at the north end, east at the south
    const za = Math.min(zTop, zBot), zb = Math.max(zTop, zBot), rt = terrainAt((xa + xb) / 2, zTop + (sd < 0 ? -1 : 1)) + 0.03;
    K.ramp(xa, za, xb, zb, 'z', sd < 0 ? rt : py, sd < 0 ? py : rt, '#d8d0c0', false, p.y - 2);
    // and a level landing from the ramp foot to the far end of the platform
    const zl0 = sd < 0 ? zBot : hz0 + 2, zl1 = sd < 0 ? hz1 - 2 : zBot;
    if (zl1 - zl0 > 1) K.box(xa, p.y - 2, Math.min(zl0, zl1), xb, py, Math.max(zl0, zl1), '#d8d0c0', 'paving', { outlineT: 0.04 });
    const rx = sd < 0 ? xa + 0.2 : xb - 0.2, rp = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12, z = U.lerp(za, zb, t), y = U.lerp(sd < 0 ? rt : py, sd < 0 ? py : rt, t); rp.push([rx, y + 1.0, z]); }
    K.rail(rp, { color: '#e9e4f5', postColor: '#7a7468', postMax: 1.3, round: 0, radius: 0.06 });
    ramps.push({ from: [(xa + xb) / 2, zTop], to: [(xa + xb) / 2, zBot] });
  }
  // railings round the court (gaps where the ramps come up)
  const ry = top + 1.0;
  const rampGapW = (x) => Math.abs(x - (p.x - platOut - 2.3)) < 2.4 || Math.abs(x - (p.x + platOut + 2.3)) < 2.4;
  for (const [z, gapX] of [[hz0 - 0.6, p.x - platOut - 2.3], [hz1 + 0.6, p.x + platOut + 2.3]]) {
    const seg1 = [[hx0 - 0.6, ry, z], [gapX - 2.6, ry, z]], seg2 = [[gapX + 2.6, ry, z], [hx1 + 0.6, ry, z]];
    for (const sg of [seg1, seg2]) if (Math.abs(sg[1][0] - sg[0][0]) > 2) K.rail(sg, { color: '#e9e4f5', postColor: '#3a3550', round: 0 });
  }
  for (const x of [hx0 - 0.6, hx1 + 0.6]) K.rail([[x, ry, hz0 - 0.6], [x, ry, hz1 + 0.6]], { color: '#e9e4f5', postColor: '#3a3550', round: 0 });
  // lights along the walls
  for (let z = hz0 + 6; z < hz1 - 4; z += 12) for (const x of [hx0 + 0.15, hx1 - 0.15]) B.box(x - 0.15, py + 3, z - 0.6, x + 0.15, py + 3.4, z + 0.6, '#ffe9b0', 'lamp', { outlineT: 0, edges: false });
  W.camBoxes = W.camBoxes || [];
  st.court = { x0: hx0, z0: hz0, x1: hx1, z1: hz1, top };
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
          if (Math.abs(along) < 8.1 && Math.abs(lat) < 1.62 && p.y < b.top - 0.4 + along * b.grade && p.y + 1.7 > b.cy) return T;
        }
      }
      return null;
    }
  };
}
