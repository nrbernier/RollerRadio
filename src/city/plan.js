// ============================================================
//  CITY PLAN — the approved map, in metres
//  x runs east, z runs south (towards the lake). North is uphill.
//  Map units from the sketch convert at 6 m per unit.
// ============================================================
const M6 = (u, v) => [(u - 190) * 6, (v - 260) * 6];

const PLAN = {
  shoreZ: 1236,                 // where the beach meets the lake (wiggles a little with x)
  canal: { z: 474, half: 12, x0: -1110, bendX: 306, waterY: 1.4, bedY: -2.2, quayY: 4.6 },
  docksQuayZ: 1198,
  // districts: rect in metres, palette, ground colour and the music recipe key
  districts: [
    { key: 'park',     name: 'Forest park',   rect: [-1032, -1440, -276, 180] },
    { key: 'obs',      name: 'Observatory',   rect: [-240, -1440, 420, -1044] },
    { key: 'oldtown',  name: 'Old town',      rect: [456, -1440, 1032, -372] },
    { key: 'business', name: 'Business',      rect: [-240, -996, 396, 240] },
    { key: 'market',   name: 'Market',        rect: [468, -324, 1032, 288] },
    { key: 'canals',   name: 'Canals',        rect: [-1032, 240, 396, 792] },
    { key: 'docks',    name: 'Docks',         rect: [468, 396, 1032, 1200] },
    { key: 'lake',     name: 'Lakeshore',     rect: [-1032, 840, 252, 1236] },
  ],
  stations: [
    { key: 'hilltop', name: 'Hilltop', at: M6(235, 115) },
    { key: 'market',  name: 'Market',  at: M6(280, 262) },
    { key: 'docks',   name: 'Docks',   at: M6(295, 400) },
    { key: 'harbour', name: 'Harbour', at: M6(205, 440) },
    { key: 'canal',   name: 'Canal',   at: M6(125, 350) },
    { key: 'central', name: 'Central', at: M6(195, 265) },
    { key: 'park',    name: 'Park',    at: M6(80, 175) },
  ],
  // hidden spots: local changes to the music, nothing to collect
  spots: [
    { key: 'glasshouse', at: M6(40, 112) },
    { key: 'belltower',  at: M6(300, 165) },
    { key: 'rooftop',    at: M6(222, 205) },
    { key: 'cellar',     at: M6(338, 288) },
    { key: 'arch',       at: [-60, 474] },
    { key: 'watertower', at: M6(340, 432) },
    { key: 'lighthouse', at: [-480, 1585] },
  ],
  pond: { x: -880, z: -180, r: 95 },
  boulevardX: 432,
  avenueZ: 336,
};
PLAN.byKey = Object.fromEntries(PLAN.districts.map(d => [d.key, d]));

// smooth district membership: 1 well inside, fading to 0 about `soft` metres outside the rect
function rectDist(r, x, z) {
  const dx = Math.max(r[0] - x, 0, x - r[2]), dz = Math.max(r[1] - z, 0, z - r[3]);
  const out = Math.hypot(dx, dz);
  if (out > 0) return out;
  return -Math.min(x - r[0], r[2] - x, z - r[1], r[3] - z);     // negative inside
}
function districtWeights(x, z, out = {}, soft = 110) {
  let sum = 0;
  for (const d of PLAN.districts) {
    const s = rectDist(d.rect, x, z);
    const w = U.smooth(U.clamp(1 - (s + soft * 0.5) / soft, 0, 1));
    out[d.key] = w; sum += w;
  }
  if (sum < 1e-4) { let best = null, bd = 1e9; for (const d of PLAN.districts) { const s = rectDist(d.rect, x, z); if (s < bd) { bd = s; best = d.key; } } for (const k in out) out[k] = 0; out[best] = 1; return out; }
  for (const k in out) out[k] /= sum;
  return out;
}
function districtAt(x, z) { let best = null, bd = 1e9; for (const d of PLAN.districts) { const s = rectDist(d.rect, x, z); if (s < bd) { bd = s; best = d; } } return best; }

// ---------- the land ----------
// monotone cubic through the north–south profile (z → height)
const PROFILE = [[-1700, 150], [-1440, 134], [-1200, 104], [-996, 78], [-720, 56], [-324, 25], [0, 12], [150, 7], [300, 5], [700, 4.6], [900, 3.6], [1180, 2.6], [1236, 2.0]];
const _pm = (() => {
  const P = PROFILE, n = P.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return m;
})();
function profileH(z) {
  const P = PROFILE;
  if (z <= P[0][0]) return P[0][1];
  if (z >= P[P.length - 1][0]) return P[P.length - 1][1];
  let i = 0; while (z > P[i + 1][0]) i++;
  const h = P[i + 1][0] - P[i][0], t = (z - P[i][0]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * h * _pm[i] + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * h * _pm[i + 1];
}
const gauss = (d, r) => Math.exp(-(d * d) / (r * r));
function shoreZ(x) { return PLAN.shoreZ + Math.sin(x / 170) * 14 + Math.sin(x / 61 + 1.3) * 5; }
// the raw land before carving
function landH(x, z) {
  let h = profileH(z);
  // the forest ridge runs up the west side and joins the observatory hill
  const rx = U.lerp(-640, -560, U.clamp((180 - z) / 1600, 0, 1));
  const ridgeUp = U.clamp((300 - z) / 1700, 0, 1);
  h += gauss(x - rx, 230) * (6 + 34 * ridgeUp);
  h -= gauss(Math.hypot(x + 880, z + 180), 130) * 9;                     // the pond hollow
  h += gauss(Math.hypot(x + 900, z + 900), 160) * 10;                    // glasshouse knoll
  // the hill under the old town and the observatory summit
  h += gauss(Math.hypot(x - 760, z + 1200), 520) * 26;
  const sd = Math.hypot(x - 90, z + 1290);
  h += Math.min(22, gauss(sd, 330) * 30);
  // a ridge spur between park and hilltop (the metro tunnels through it)
  h += gauss(Math.hypot(x + 300, z + 860), 240) * 22;
  // the edge of the world: hills all round (outside the city)
  const ex = Math.max(0, Math.abs(x) - 1060), en = Math.max(0, -1490 - z);
  h += ex * ex * 0.0007 + ex * 0.12 + en * en * 0.0009 + en * 0.2;
  // a little ground swell
  h += Math.sin(x * 0.011 + z * 0.004) * 1.1 + Math.sin(z * 0.017 - x * 0.006) * 0.8;
  return h;
}
// flat places: docks, the canal quays, the lakeshore promenade, plazas
function cityHeight(x, z) {
  let h = landH(x, z);
  const C = PLAN.canal;
  // canal quarter: a flat, slightly raised bank
  const inCanals = U.smooth(U.clamp(1 - rectDist([-1060, 300, 430, 760], x, z) / 60, 0, 1));
  h = U.lerp(h, C.quayY + Math.sin(x * 0.01) * 0.2, inCanals);
  // docks: flat hardstanding
  const inDocks = U.smooth(U.clamp(1 - rectDist([460, 380, 1060, PLAN.docksQuayZ], x, z) / 50, 0, 1));
  h = U.lerp(h, 3.8, inDocks);
  // lake: beach then the lake bed
  const sz = shoreZ(x), dz = z - sz;
  if (dz > -60) {
    const beach = U.clamp((dz + 60) / 60, 0, 1);
    h = U.lerp(h, 2.0, U.smooth(beach) * (inDocks > 0.5 ? 0 : 1));
    if (dz > 0 && inDocks < 0.5) h = 2.0 - dz * 0.09 - Math.max(0, dz - 40) * 0.06;
  }
  if (z > PLAN.docksQuayZ + 4 && x > 452 && x < 1076) h = Math.min(h, -6);
  return h;
}
// is (x, z) open water? (canal or lake; the lake is anything past the shore)
function inCanal(x, z) {
  const C = PLAN.canal;
  if (x > C.x0 && x < C.bendX + C.half && Math.abs(z - C.z) < C.half) return true;
  if (Math.abs(x - C.bendX) < C.half && z > C.z && z < shoreZ(x) + 4) return true;
  return false;
}
