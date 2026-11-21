// ============================================================
//  CITY PLAN — the map, in metres
//  x runs east, z runs south (towards the lake). North is uphill.
//  The compact city (Nov 2026): about 1.2 × 1.4 km, curved district edges,
//  landmarks where districts meet. Shapes are drawn with a few control
//  points and smoothed; `rect` is each shape's bounding box (for old code).
// ============================================================

// ---------- curves ----------
// closed Catmull-Rom through control points, `per` samples per span
function smoothLoop(P, per = 8) {
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < per; k++) out.push(crPoint(p0, p1, p2, p3, k / per));
  }
  return out;
}
// open Catmull-Rom (ends repeated), resampled every `step` metres
function smoothPath(P, step = 4) {
  const n = P.length, dense = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 24; k++) dense.push(crPoint(p0, p1, p2, p3, k / 24));
  }
  dense.push(P[n - 1].slice());
  const out = [dense[0]]; let acc = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1], b = dense[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = step - acc;
    while (t <= L) { out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; }
    acc = L - (t - step);
  }
  const last = dense[dense.length - 1], pl = out[out.length - 1];
  if (Math.hypot(last[0] - pl[0], last[1] - pl[1]) > step * 0.3) out.push(last.slice()); else out[out.length - 1] = last.slice();
  return out;
}
function crPoint(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}
const circlePts = (cx, cz, r, n = 10, wob = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, rr = r * (1 + wob * Math.sin(a * 3 + 1)); return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]; });

// a closed shape: smoothed outline, bounding box, segments filed in a grid for fast distance queries
function makeShape(ctrl, per = 8) {
  const poly = smoothLoop(ctrl, per);
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const [x, z] of poly) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
  return { ctrl, poly, rect: [x0, z0, x1, z1] };
}
// signed distance to a shape's outline: negative inside
function shapeDist(S, x, z) {
  const r = S.rect, bx = Math.max(r[0] - x, 0, x - r[2]), bz = Math.max(r[1] - z, 0, z - r[3]), bd = Math.hypot(bx, bz);
  if (bd > 240) return bd;                      // far outside: the box is close enough
  const P = S.poly, n = P.length; let best = 1e18, inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [ax, az] = P[j], [cx, cz] = P[i], dx = cx - ax, dz = cz - az, L2 = dx * dx + dz * dz || 1;
    const t = U.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), ex = ax + dx * t - x, ez = az + dz * t - z, d2 = ex * ex + ez * ez;
    if (d2 < best) best = d2;
    if ((az > z) !== (cz > z) && x < ax + (z - az) * dx / (cz - az)) inside = !inside;
  }
  return inside ? -Math.sqrt(best) : Math.sqrt(best);
}
function inShape(S, x, z) { return shapeDist(S, x, z) < 0; }

// a path (open polyline) with a grid of its segments, for distances along roads and the canal
function makePath(ctrl, step = 4, cellSize = 32, loop = false) {
  const pts = loop ? smoothPath(smoothLoop(ctrl, 12).concat([smoothLoop(ctrl, 12)[0]]), step) : smoothPath(ctrl, step), grid = new Map(), key = (i, j) => i + ',' + j;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    for (let i = Math.floor(Math.min(ax, bx) / cellSize); i <= Math.floor(Math.max(ax, bx) / cellSize); i++)
      for (let j = Math.floor(Math.min(az, bz) / cellSize); j <= Math.floor(Math.max(az, bz) / cellSize); j++) { const kk = key(i, j); (grid.get(kk) || grid.set(kk, []).get(kk)).push(k); }
  }
  const acc = [0]; for (let k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return { ctrl, pts, grid, cellSize, acc, len: acc[acc.length - 1] };
}
// distance to a path within `reach` metres (else Infinity); out = { d, k, t, s } (segment, fraction, arc length)
const _pd = { d: 0, k: 0, t: 0, s: 0 };
function pathDist(Pa, x, z, reach = 64, out = _pd) {
  const cs = Pa.cellSize, r = Math.ceil(reach / cs), ci = Math.floor(x / cs), cj = Math.floor(z / cs);
  let best = Infinity, bk = -1, bt = 0; const seen = pathDist.seen || (pathDist.seen = new Set()); seen.clear();
  for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) {
    const L = Pa.grid.get(i + ',' + j); if (!L) continue;
    for (const k of L) {
      if (seen.has(k)) continue; seen.add(k);
      const [ax, az] = Pa.pts[k], [bx, bz] = Pa.pts[k + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
      const t = U.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), d = Math.hypot(ax + dx * t - x, az + dz * t - z);
      if (d < best) { best = d; bk = k; bt = t; }
    }
  }
  out.d = best; out.k = bk; out.t = bt; out.s = bk < 0 ? 0 : Pa.acc[bk] + (Pa.acc[bk + 1] - Pa.acc[bk]) * bt;
  return out;
}

// ---------- the map ----------
const PLAN = {
  frame: [-600, -700, 600, 700],      // the city proper; hills rise outside it
  // districts: smoothed outlines (control points) and the music recipe key
  districts: [
    { key: 'park', name: 'Forest', ctrl: [[-760, -800], [-254, -770], [-226, -470], [-258, -266], [-318, -30], [-392, 170], [-530, 236], [-760, 236]] },
    { key: 'obs', name: 'Observatory', ctrl: circlePts(-53, -622, 96, 9, 0.08) },
    { key: 'oldtown', name: 'Old town', ctrl: [[35, -566], [212, -655], [515, -604], [588, -400], [548, -262], [388, -130], [229, -120], [53, -186], [0, -333]] },
    { key: 'business', name: 'Downtown', ctrl: [[-177, -186], [106, -182], [205, -50], [180, 106], [18, 206], [-194, 142], [-242, -50]] },
    { key: 'market', name: 'Market', ctrl: [[254, -86], [530, -80], [596, 66], [494, 206], [325, 222], [214, 100], [214, -28]] },
    { key: 'canals', name: 'Canals', ctrl: [[-640, 252], [-141, 230], [212, 268], [222, 350], [150, 462], [40, 470], [-353, 455], [-640, 402]] },
    { key: 'docks', name: 'Docks', ctrl: [[236, 286], [640, 272], [640, 505], [290, 505], [226, 402]] },
    { key: 'lake', name: 'Lakeshore', ctrl: [[-640, 430], [-200, 470], [-14, 512], [60, 524], [60, 640], [-640, 640]] },
  ],
  // the lakeshore: beach line (wiggles), a small bay where the canal comes out
  shore: { z: 548, tilt: -0.06, bayX: 80, bayR: 70, bayDepth: 16 },
  docksQuayZ: 505, docksX: [222, 660],
  // the canal: comes out of a tunnel under a knoll at the west edge, winds east under the main street,
  // turns south and ends in a basin behind the promenade (a lock gate, the lake beyond)
  canal: { ctrl: [[-662, 300], [-560, 318], [-430, 344], [-300, 298], [-160, 322], [-20, 352], [76, 386], [102, 446], [84, 0]], half: 11, waterY: 1.4, bedY: -2.2, quayY: 4.6 },
  // streets that join the districts (each district lays its own small streets)
  roads: {
    main: { width: 14, ctrl: [[-53, -560], [-20, -470], [-60, -400], [-98, -330], [-40, -232], [40, -150], [62, -40], [30, 64], [62, 160], [96, 250], [104, 340], [70, 430], [40, 500]] },   // summit to the lake, zigzag
    cross: { width: 14, ctrl: [[-620, 10], [-388, -16], [-250, 18], [-60, 6], [176, -14], [388, 50], [620, 34]] },
    ring: { width: 10, loop: true, ctrl: circlePts(292, -392, 132, 12, 0.06).map(([x, z]) => [x, -392 + (z + 392) * 0.78]) },   // the old town's ring street, on the hill's contour
  },
  // metro: four stations on a loop (order along the line: hilltop, central, harbour, market)
  stations: [
    { key: 'hilltop', name: 'Hilltop', at: [200, -300] },
    { key: 'central', name: 'Central', at: [170, 150] },
    { key: 'harbour', name: 'Harbour', at: [180, 470] },
    { key: 'market',  name: 'Market',  at: [430, 60] },
  ],
  // hidden spots: local changes to the music, nothing to collect
  spots: [
    { key: 'glasshouse', at: [-318, 86] },
    { key: 'belltower',  at: [330, -430] },
    { key: 'rooftop',    at: [-10, -30] },
    { key: 'cellar',     at: [300, -96] },
    { key: 'arch',       at: [90, 400] },       // where the main street crosses the canal (set exactly below)
    { key: 'watertower', at: [262, 322] },
    { key: 'lighthouse', at: [560, 626] },
  ],
  // landmarks, where districts meet (placed by their builders; these are their anchors)
  places: {
    summit: [-53, -622], crag: [-242, -500], vineyards: [-110, -310], glasshouse: [-318, 86], needle: [162, -128],
    site: [-150, 172], central: [170, 150], recordShop: [300, -96], ferris: [-247, 493], lido: [-480, 505],
    waterTower: [262, 322], lighthouse: [560, 626],
  },
  vineyards: [[-219, -416], [-150, -428], [-53, -400], [-8, -300], [-60, -232], [-120, -214], [-212, -240]],
  pond: { x: -416, z: 127, r: 58 },
  boulevardX: 104, avenueZ: 10,          // (old names) the main street's x near the lake, the cross street's z
};
for (const d of PLAN.districts) { d.shape = makeShape(d.ctrl); d.rect = d.shape.rect; }
PLAN.byKey = Object.fromEntries(PLAN.districts.map(d => [d.key, d]));
PLAN.vineyardShape = makeShape(PLAN.vineyards, 6);
for (const r of Object.values(PLAN.roads)) r.path = makePath(r.ctrl, 4, 32, r.loop);

// the canal path ends a little behind the shore: the basin
{ const C = PLAN.canal, e = C.ctrl[C.ctrl.length - 1]; e[1] = shoreZ(e[0]) - 30;
  C.path = makePath(C.ctrl, 4);
  // (old fields, for code not yet moved to the path)
  C.x0 = C.ctrl[0][0]; C.z = C.ctrl[0][1]; C.bendX = e[0];
  // where the main street crosses it: the stone bridge with the echo
  const M = PLAN.roads.main.path; let best = 1e9, at = null;
  for (const [x, z] of M.pts) { const d = pathDist(C.path, x, z, 40).d; if (d < best) { best = d; at = [x, z]; } }
  if (at) PLAN.spots.find(s => s.key === 'arch').at = at;
}

// smooth district membership: 1 well inside, fading to 0 about `soft` metres outside the outline
function rectDist(r, x, z) {
  const dx = Math.max(r[0] - x, 0, x - r[2]), dz = Math.max(r[1] - z, 0, z - r[3]);
  const out = Math.hypot(dx, dz);
  if (out > 0) return out;
  return -Math.min(x - r[0], r[2] - x, z - r[1], r[3] - z);     // negative inside
}
function districtDist(d, x, z) { return shapeDist(d.shape, x, z); }
function districtWeights(x, z, out = {}, soft = 70) {
  let sum = 0, best = null, bd = 1e9;
  for (const d of PLAN.districts) {
    const s = districtDist(d, x, z);
    if (s < bd) { bd = s; best = d.key; }
    const w = U.smooth(U.clamp(1 - (s + soft * 0.5) / soft, 0, 1));
    out[d.key] = w; sum += w;
  }
  if (sum < 1e-4) { for (const k in out) out[k] = 0; out[best] = 1; return out; }
  for (const k in out) out[k] /= sum;
  return out;
}
function districtAt(x, z) { let best = null, bd = 1e9; for (const d of PLAN.districts) { const s = districtDist(d, x, z); if (s < bd) { bd = s; best = d; } } return best; }

// ---------- the land ----------
// monotone cubic through the north–south profile (z → height): about 70 m from the top of the city to the shore
const PROFILE = [[-822, 77.5], [-700, 69.5], [-588, 54.5], [-492, 41.5], [-363, 30.5], [-177, 15], [-26, 8.5], [44, 6], [114, 5], [301, 4.6], [394, 3.6], [525, 2.6], [551, 2.0]];
const _pm = (() => {
  const P = PROFILE, n = P.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return m;
})();
function profileH(z) {
  const P = PROFILE;
  if (z <= P[0][0]) return P[0][1] + (P[0][0] - z) * 0.06;
  if (z >= P[P.length - 1][0]) return P[P.length - 1][1];
  let i = 0; while (z > P[i + 1][0]) i++;
  const h = P[i + 1][0] - P[i][0], t = (z - P[i][0]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * h * _pm[i] + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * h * _pm[i + 1];
}
function gauss(d, r) { return Math.exp(-(d * d) / (r * r)); }
// a hill that starts gently at the city edge and levels off at `top` metres
const edgeRise = (e, top, w) => e <= 0 ? 0 : top * (1 - Math.exp(-(e / w) * (e / w))) + Math.min(e, 200) * 0.04;
// the canal's basin end (just behind the promenade)
function canalEndZ() { const P = PLAN.canal.path.pts; return P[P.length - 1][1]; }
function shoreZ(x) {
  const S = PLAN.shore;
  return S.z + x * S.tilt + Math.sin(x / 90) * 8 + Math.sin(x / 37 + 1.3) * 3 - gauss(x - S.bayX, S.bayR) * S.bayDepth;
}
// the raw land before carving
function landH(x, z) {
  let h = profileH(z);
  // the forest ridge runs down the west side and joins the summit
  const rx = U.lerp(-470, -400, U.clamp((150 - z) / 900, 0, 1)), ridgeUp = U.clamp((220 - z) / 850, 0, 1);
  h += gauss(x - rx, 120) * (3 + 17 * ridgeUp);
  h -= gauss(Math.hypot(x - PLAN.pond.x, z - PLAN.pond.z), 70) * 5;              // the pond hollow
  h += gauss(Math.hypot(x + 330, z - 50), 70) * 5;                                // glasshouse knoll
  h += gauss(Math.hypot(x - 292, z + 392), 240) * 13;                             // the old town's hill
  h += Math.min(11, gauss(Math.hypot(x + 53, z + 622), 155) * 15);                 // the summit
  h += gauss(Math.hypot(x + 130, z + 330), 120) * 9;                              // the vineyard spur (sunny side faces south)
  h += gauss(Math.hypot(x + 720, z - 300), 55) * 15;                              // the knoll the canal tunnels under
  // the edge of the world: hills all round (outside the city); they rise, then roll
  const ex = Math.max(0, Math.abs(x) - 620), en = Math.max(0, -730 - z);
  h += edgeRise(ex, 110, 320) + edgeRise(en, 120, 310);
  // a little ground swell
  h += Math.sin(x * 0.022 + z * 0.008) * 0.6 + Math.sin(z * 0.034 - x * 0.012) * 0.45;
  return h;
}
// flat places: docks, the canal quays, the lakeshore promenade
function cityHeight(x, z) {
  let h = landH(x, z);
  const C = PLAN.canal;
  // canal quarter and the canal's banks: a flat, slightly raised quay level
  const dq = districtDist(PLAN.byKey.canals, x, z), dc = pathDist(C.path, x, z, 80).d;
  const inCanals = Math.max(U.smooth(U.clamp(1 - dq / 50, 0, 1)), U.smooth(U.clamp(1 - (dc - C.half - 24) / 30, 0, 1)));
  h = U.lerp(h, C.quayY + Math.sin(x * 0.02) * 0.2, inCanals);
  // docks: flat hardstanding
  const inDocks = U.smooth(U.clamp(1 - districtDist(PLAN.byKey.docks, x, z) / 40, 0, 1));
  h = U.lerp(h, 3.8, inDocks);
  // lake: beach then the lake bed
  const sz = shoreZ(x), dz = z - sz;
  if (dz > -50) {
    const beach = U.clamp((dz + 50) / 50, 0, 1);
    h = U.lerp(h, 2.0, U.smooth(beach) * (inDocks > 0.5 ? 0 : 1));
    if (dz > 0 && inDocks < 0.5) h = 2.0 - dz * 0.09 - Math.max(0, dz - 40) * 0.06;
  }
  if (z > PLAN.docksQuayZ + 4 && x > PLAN.docksX[0] && x < PLAN.docksX[1]) h = Math.min(h, -6);
  return h;
}
// is (x, z) open water in the canal? (the lake is anything past the shore)
function inCanal(x, z) { return pathDist(PLAN.canal.path, x, z, 16).d < PLAN.canal.half; }
