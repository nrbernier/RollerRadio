// Draws src/city/plan.js from above, with no browser: districts, height shading, water, roads,
// stations, spots and landmarks. Writes a PPM; plan_map.py turns it into a labelled PNG.
//   node tools/plan_map.js out.ppm [metresPerPixel=2]
const fs = require('fs'), path = require('path');
const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  smooth: t => t * t * (3 - 2 * t),
};
const src = fs.readFileSync(path.join(__dirname, '../src/city/plan.js'), 'utf8');
const api = new Function('U', src + '\nreturn { PLAN, cityHeight, districtWeights, inCanal, shoreZ, pathDist, inShape };')(U);
const { PLAN, cityHeight, districtWeights, inCanal, shoreZ, pathDist, inShape } = api;

const out = process.argv[2] || 'plan.ppm', mpp = +(process.argv[3] || 2);
const X0 = -720, X1 = 720, Z0 = -820, Z1 = 760, W = Math.round((X1 - X0) / mpp), H = Math.round((Z1 - Z0) / mpp);
const COL = { park: [120, 170, 105], obs: [200, 205, 150], oldtown: [228, 196, 160], business: [200, 202, 206], market: [236, 205, 140], canals: [176, 206, 186], docks: [186, 180, 168], lake: [232, 220, 176] };
const img = Buffer.alloc(W * H * 3), w = {};
const hgt = new Float32Array(W * H);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) hgt[j * W + i] = cityHeight(X0 + (i + 0.5) * mpp, Z0 + (j + 0.5) * mpp);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
  const x = X0 + (i + 0.5) * mpp, z = Z0 + (j + 0.5) * mpp, k = (j * W + i) * 3, y = hgt[j * W + i];
  let c = [0, 0, 0];
  districtWeights(x, z, w);
  for (const d in w) for (let q = 0; q < 3; q++) c[q] += COL[d][q] * w[d];
  // hill shading + contour every 5 m
  const yl = i > 0 ? hgt[j * W + i - 1] : y, yu = j > 0 ? hgt[(j - 1) * W + i] : y, sh = U.clamp(1 + ((yl - y) + (yu - y)) * 0.35 / mpp, 0.6, 1.25);
  c = c.map(v => v * sh);
  if (Math.floor(y / 5) !== Math.floor(yl / 5) || Math.floor(y / 5) !== Math.floor(yu / 5)) c = c.map(v => v * 0.82);
  if (inShape(PLAN.vineyardShape, x, z) && Math.sin((z + x * 0.25) * 0.6) > 0.3) c = [150, 160, 80];
  if (z > shoreZ(x) && y < 2.05) c = [143, 188, 208];
  if (Math.hypot(x - PLAN.pond.x, z - PLAN.pond.z) < PLAN.pond.r * 0.72) c = [143, 188, 208];
  if (inCanal(x, z)) c = [110, 160, 190];
  for (const r of Object.values(PLAN.roads)) if (pathDist(r.path, x, z, 16).d < r.width / 2) c = [240, 236, 226];
  if (x < PLAN.frame[0] || x > PLAN.frame[2] || z < PLAN.frame[1] || z > PLAN.frame[3]) c = c.map(v => v * 0.75 + 30);
  img[k] = U.clamp(c[0], 0, 255); img[k + 1] = U.clamp(c[1], 0, 255); img[k + 2] = U.clamp(c[2], 0, 255);
}
fs.writeFileSync(out, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), img]));
// labels for the PNG step
const lab = [];
const px = (x, z) => [Math.round((x - X0) / mpp), Math.round((z - Z0) / mpp)];
for (const d of PLAN.districts) { const r = d.rect, c = d.ctrl.reduce((a, p) => [a[0] + p[0] / d.ctrl.length, a[1] + p[1] / d.ctrl.length], [0, 0]); lab.push({ t: d.name, p: px(c[0], c[1]), kind: 'district' }); }
for (const s of PLAN.stations) lab.push({ t: 'M ' + s.name, p: px(...s.at), kind: 'station' });
for (const s of PLAN.spots) lab.push({ t: s.key, p: px(...s.at), kind: 'spot' });
for (const [k, v] of Object.entries(PLAN.places)) lab.push({ t: k, p: px(...v), kind: 'place' });
fs.writeFileSync(out.replace(/\.ppm$/, '.json'), JSON.stringify({ W, H, mpp, X0, Z0, labels: lab }));
console.log('map', W, 'x', H, 'px,', mpp, 'm/px; height range', hgt.reduce((a, b) => Math.min(a, b)).toFixed(1), hgt.reduce((a, b) => Math.max(a, b)).toFixed(1));
