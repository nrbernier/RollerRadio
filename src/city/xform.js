// ============================================================
//  XFORM — the compact city reuses the old districts' builders, each moved as a block.
//  A builder runs in its own frame (the coordinates it was written in). What it makes is
//  shifted by its group's offset on the way out, and trimmed to its district's new outline.
//  Questions it asks about the world (ground height, the canal, the shore, other places)
//  are answered from the real map, shifted into its frame. Offsets are in steps of 8 m,
//  so things laid on terrain grid lines stay on them.
// ============================================================
const XF_GROUPS = {
  // key: [dx, dz], keep: district outline to trim to (null: none), margin: metres allowed past it
  park:     { d: [464, 304],   keep: 'park', margin: 12 },          // the pond lands where the pond is
  obs:      { d: [-152, 616],  keep: 'obs', margin: 60 },            // the observatory on the summit, its terrace looking down the main street
  oldtown:  { d: [-408, 408],  keep: 'oldtown', margin: 12 },        // the bell tower's square at the south edge (phase 4 relays the old town)
  market:   { d: [-344, 96],   keep: 'market', margin: 30 },        // the hall just south of the cross street
  cellar:   { d: [-368, -8],   keep: null },                         // the record shop, in the market's south corner
  business: { d: [-56, 480],   keep: 'business', margin: 24 },       // the sunken street down the middle
  site:     { d: [24, 224],    keep: null },
  tower:    { d: [96, 304],    keep: null },                        // the Needle, where downtown, old town and market meet
  canals:   { d: [0, -152],    keep: 'canals', margin: 8 },
  docks:    { d: [-320, -696], keep: 'docks', margin: 20 },
  lake:     { d: [0, -688],    keep: 'lake', margin: 30 },
  skate:    { d: [288, -40],   keep: null },
  vine:     { d: [-456, 888],  keep: null },
  mouth:    { d: [-224, -696], keep: null },
  carousel: { d: [0, -104],    keep: null },
  garden:   { d: [200, -432],  keep: null },
};

// ---------- named places the old builders share: kept in the current frame ----------
const _xpt = (p, dx, dz) => { p[0] += dx; p[1] += dz; };
const _xrc = (r, dx, dz) => { r[0] += dx; r[1] += dz; r[2] += dx; r[3] += dz; };
const XF_CONSTS = [
  [() => VALLEY, 'business', (o, dx, dz) => { o.x += dx; o.z0 += dz; o.z1 += dz; o.z2 += dz; o.z3 += dz; for (let i = 0; i < o.bridges.length; i++) o.bridges[i] += dz; }],
  [() => VALLEY_RAMP, 'business', (o, dx, dz) => { o[0] += dz; o[1] += dz; }],
  [() => CRAG, 'park', (o, dx, dz) => { for (const p of o.spine) _xpt(p, dx, dz); }],
  [() => CRAG_LINK, 'park', (o, dx, dz) => { for (const p of o) _xpt(p, dx, dz); }],
  [() => SITE, 'site', _xrc],
  [() => TOWER, 'tower', (o, dx, dz) => { o.x += dx; o.z += dz; _xrc(o.block, dx, dz); }],
  [() => OLD_PADS, 'oldtown', (o, dx, dz) => { for (const p of o) _xpt(p, dx, dz); }],
  [() => OLD_Q, 'oldtown', (o, dx, dz) => { for (const q of o) _xpt(q.at, dx, dz); }],
  [() => MKT, 'market', (o, dx, dz) => { _xrc(o.hall, dx, dz); _xrc(o.field, dx, dz); _xpt(o.tower, dx, dz); for (let i = 0; i < o.cross.length; i++) o.cross[i] += dx; for (let i = 0; i < o.lanes.length; i++) o.lanes[i] += dz; for (const n of o.inns) _xrc(n, dx, dz); _xrc(o.dyers, dx, dz); }],
  [() => CELLAR, 'cellar', _xrc],
  [() => SKATE, 'skate', _xrc],
  [() => OBS_T, 'obs', _xpt],
].map(([get, home, shift]) => ({ get, home, shift, off: [0, 0] }));     // off: what has been added to the written values

const XF = { g: null, dx: 0, dz: 0, keep: null, margin: 0 };
function xfFrame(g) {
  const F = g ? XF_GROUPS[g].d : [0, 0];
  for (const c of XF_CONSTS) {
    const H = XF_GROUPS[c.home].d, tx = H[0] - F[0], tz = H[1] - F[1];
    if (tx !== c.off[0] || tz !== c.off[1]) { c.shift(c.get(), tx - c.off[0], tz - c.off[1]); c.off = [tx, tz]; }
  }
}
xfFrame(null);        // at load: everything where it really is

// the old plan's numbers the builders were written against
const PLAN0 = {
  districts: [
    { key: 'park', name: 'Forest park', rect: [-1032, -1440, -276, 180] },
    { key: 'obs', name: 'Observatory', rect: [-240, -1440, 420, -1044] },
    { key: 'oldtown', name: 'Old town', rect: [456, -1440, 1032, -372] },
    { key: 'business', name: 'Business', rect: [-240, -996, 396, 240] },
    { key: 'market', name: 'Market', rect: [468, -324, 1032, 288] },
    { key: 'canals', name: 'Canals', rect: [-1032, 240, 396, 792] },
    { key: 'docks', name: 'Docks', rect: [468, 396, 1032, 1200] },
    { key: 'lake', name: 'Lakeshore', rect: [-1032, 840, 252, 1236] },
  ],
  canal: { z: 474, half: 12, x0: -1072, bendX: 306, waterY: 1.4, bedY: -2.2, quayY: 4.6 },
  docksQuayZ: 1198, boulevardX: 432, avenueZ: 336, shoreZ: 1236,
};
PLAN0.byKey = Object.fromEntries(PLAN0.districts.map(d => [d.key, d]));
const shoreZ0 = (x) => PLAN0.shoreZ + Math.sin(x / 170) * 14 + Math.sin(x / 61 + 1.3) * 5;
PLAN0.canalEnd = shoreZ0(PLAN0.canal.bendX) - 48;
const OLD_STATIONS = ['hilltop', 'market', 'docks', 'harbour', 'canal', 'central', 'park'], STATION_ALIAS = { park: 'forest', docks: 'harbour' };

// ---------- running a builder in its frame ----------
// (the real versions of the questions a builder asks)
const XF_REAL = {};
function xfKeepPoint(x, z) {
  if (x < TER.x0 + 4 || x > TER.x0 + TER.nx * TER.cell - 4 || z < TER.z0 + 4 || z > TER.z0 + TER.nz * TER.cell - 4) return false;
  if (XF.keep && shapeDist(PLAN_REAL.byKey[XF.keep].shape, x, z) > XF.margin) return false;
  if (XF_REAL.inCanal(x, z)) return false;
  return true;
}
// shift a registry value into the real map, in place (coordinates: x/z keys, [x, z], [x, y, z], [x0, z0, x1, z1])
function xfShift(v, dx, dz, seen, depth = 0) {
  if (!v || typeof v !== 'object' || depth > 6 || seen.has(v)) return;
  seen.add(v);
  if (v.isVector3) { v.x += dx; v.z += dz; return; }
  if (v.isObject3D) { v.position.x += dx; v.position.z += dz; return; }
  if (v.isMaterial || v.isTexture || v.isBufferGeometry || v.isColor) return;
  if (Array.isArray(v)) {
    if (v.length >= 2 && v.length <= 4 && v.every(n => typeof n === 'number')) {
      if (v.length === 2) { v[0] += dx; v[1] += dz; } else if (v.length === 3) { v[0] += dx; v[2] += dz; } else { v[0] += dx; v[1] += dz; v[2] += dx; v[3] += dz; }
      return;
    }
    for (const e of v) xfShift(e, dx, dz, seen, depth + 1);
    return;
  }
  for (const k of Object.keys(v)) {
    const e = v[k];
    if (typeof e === 'number') { if (k === 'x' || k === 'x0' || k === 'x1' || k === 'cx' || k === 'ax' || k === 'bx') v[k] = e + dx; else if (k === 'z' || k === 'z0' || k === 'z1' || k === 'cz' || k === 'az' || k === 'bz') v[k] = e + dz; }
    else if (e && typeof e === 'object') xfShift(e, dx, dz, seen, depth + 1);
  }
}
// where a registry item stands (after shifting), for trimming
function xfCentre(v) {
  if (Array.isArray(v)) return typeof v[0] === 'number' ? (v.length === 3 ? [v[0], v[2]] : v.length === 4 ? [(v[0] + v[2]) / 2, (v[1] + v[3]) / 2] : [v[0], v[1]]) : null;
  if (v.x0 !== undefined && v.x1 !== undefined) return [(v.x0 + v.x1) / 2, (v.z0 + v.z1) / 2];
  if (v.x !== undefined && v.z !== undefined) return [v.x, v.z];
  if (v.ax !== undefined) return [(v.ax + v.bx) / 2, (v.az + v.bz) / 2];
  return null;
}
// lists whose items are trimmed with the district; the rest of W is only shifted
const XF_TRIM = new Set(['boxes', 'camBoxes', 'ramps', 'treeList', 'lamps', 'benches', 'sounds', 'spots', 'pigeonSpots', 'gullSpots', 'fountains', 'dishes']);
const XF_SKIP = new Set(['group', 'cells', 'metro', 'stations', 'roads', 'far', 'slabs', 'mats', 'grid', 'spawn', 'waters', 'canal', 'canalWaterMat', 'lakeMat', 'dynBoxes', 'addDyn']);

// a geometry moved into place, keeping only the triangles whose centre is kept
function xfClip(geo, M) {
  const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(M), P = g.attributes.position.array, n = P.length / 9, keep = [];
  for (let t = 0; t < n; t++) { const i = t * 9; if (xfKeepPoint((P[i] + P[i + 3] + P[i + 6]) / 3, (P[i + 2] + P[i + 5] + P[i + 8]) / 3)) keep.push(t); }
  if (!keep.length) return null;
  if (keep.length === n) return g;
  const out = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(g.attributes)) {
    const s = a.itemSize, src = a.array, dst = new src.constructor(keep.length * 3 * s);
    keep.forEach((t, k) => dst.set(src.subarray(t * 3 * s, (t + 1) * 3 * s), k * 3 * s));
    out.setAttribute(name, new THREE.BufferAttribute(dst, s, a.normalized));
  }
  out.userData = Object.assign({}, geo.userData);
  return out;
}

// install the wrappers once, on the kit (they do nothing outside a frame)
function xfInstall(H) {
  const { K, B, F, S, W } = H;
  const T = new THREE.Matrix4(), _c = V3(), _b = new THREE.Box3();
  const wrapAdd = (obj) => {
    const add = obj.add.bind(obj), addShape = obj.addShape && obj.addShape.bind(obj);
    obj.add = (geo, m, ...rest) => {
      if (!XF.g) return add(geo, m, ...rest);
      const M = T.makeTranslation(XF.dx, 0, XF.dz).clone(); if (m) M.multiply(m);
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) > 36) {        // big pieces (ground patches, streets): trimmed triangle by triangle
        const g = xfClip(geo, M); if (g) add(g, new THREE.Matrix4(), ...rest); return;
      }
      _b.copy(bb).getCenter(_c).applyMatrix4(M);
      if (!xfKeepPoint(_c.x, _c.z)) return;
      return add(geo, M, ...rest);
    };
    if (addShape) obj.addShape = (sh, m, ...rest) => {
      if (!XF.g) return addShape(sh, m, ...rest);
      const M = T.makeTranslation(XF.dx, 0, XF.dz).clone().multiply(m), e = M.elements;
      if (!xfKeepPoint(e[12], e[14])) return;
      return addShape(sh, M, ...rest);
    };
  };
  wrapAdd(B); wrapAdd(F);
  { const add = S.add.bind(S); S.add = (ax, ay, az, bx, by, bz, half) => {
      if (!XF.g) return add(ax, ay, az, bx, by, bz, half);
      if (!xfKeepPoint((ax + bx) / 2 + XF.dx, (az + bz) / 2 + XF.dz)) return;
      return add(ax + XF.dx, ay, az + XF.dz, bx + XF.dx, by, bz + XF.dz, half);
    }; }
  { const rail = K.rail; K.rail = (pts, o) => {
      if (!XF.g) return rail(pts, o);
      const P = pts.map(p => Array.isArray(p) ? [p[0] + XF.dx, p[1], p[2] + XF.dz] : V3(p.x + XF.dx, p.y, p.z + XF.dz));
      const mid = P[Math.floor(P.length / 2)], mx = Array.isArray(mid) ? mid[0] : mid.x, mz = Array.isArray(mid) ? mid[2] : mid.z;
      if (!xfKeepPoint(mx, mz)) return;
      return rail(P, o);
    }; }
  // the placement grids hold real coordinates
  const sh = (fn) => (x0, z0, x1, z1, ...rest) => XF.g ? fn(x0 + XF.dx, z0 + XF.dz, x1 + XF.dx, z1 + XF.dz, ...rest) : fn(x0, z0, x1, z1, ...rest);
  H.clearOf = sh(H.clearOf); H.clearPts = sh(H.clearPts);
  { const f = H.block; H.block = (x, z, r) => XF.g ? f(x + XF.dx, z + XF.dz, r) : f(x, z, r); }
  { const f = H.reserve; H.reserve = (r) => XF.g ? f([r[0] + XF.dx, r[1] + XF.dz, r[2] + XF.dx, r[3] + XF.dz]) : f(r); }
  { const f = H.line; H.line = (P, hw) => XF.g ? f(P.map(p => [p[0] + XF.dx, p[1] + XF.dz]), hw) : f(P, hw); }
}

// run builders in a group's frame, then move what they registered into the real map
function xfRun(H, g, ...fns) {
  const G = XF_GROUPS[g], W = H.W, dx = G.d[0], dz = G.d[1];
  // what's there before
  const before = new Map(); for (const k of Object.keys(W)) before.set(k, Array.isArray(W[k]) ? W[k].length : W[k]);
  const nKids = W.group.children.length, nDecks = DECKS.length, nHoles = TER.holes.length;
  // the frame: queries answered from the real map, the old plan's numbers, shared places shifted
  if (!XF_REAL.terrainAt) Object.assign(XF_REAL, { terrainAt, cityHeight, landH, inCanal, shoreZ, canalEndZ, districtAt, districtWeights, inHole });
  const R = XF_REAL;
  terrainAt = (x, z, out) => R.terrainAt(x + dx, z + dz, out);
  cityHeight = (x, z) => R.cityHeight(x + dx, z + dz);
  landH = (x, z) => R.landH(x + dx, z + dz);
  inCanal = (x, z) => R.inCanal(x + dx, z + dz);
  shoreZ = (x) => R.shoreZ(x + dx) - dz;
  canalEndZ = () => PLAN0.canalEnd;
  districtAt = (x, z) => R.districtAt(x + dx, z + dz);
  districtWeights = (x, z, out, soft) => R.districtWeights(x + dx, z + dz, out, soft);
  inHole = (x, z) => R.inHole(x + dx, z + dz);
  const saved = { districts: PLAN.districts, byKey: PLAN.byKey, stations: PLAN.stations, spots: PLAN.spots, canal: PLAN.canal, pond: PLAN.pond, docksQuayZ: PLAN.docksQuayZ, boulevardX: PLAN.boulevardX, avenueZ: PLAN.avenueZ };
  PLAN.districts = PLAN0.districts; PLAN.byKey = PLAN0.byKey; PLAN.canal = PLAN0.canal;
  PLAN.docksQuayZ = PLAN0.docksQuayZ; PLAN.boulevardX = PLAN0.boulevardX; PLAN.avenueZ = PLAN0.avenueZ;
  PLAN.stations = OLD_STATIONS.map(key => { const s = saved.stations.find(t => t.key === key) || saved.stations.find(t => t.key === STATION_ALIAS[key]); return { key, name: s ? s.name : key, at: s ? [s.at[0] - dx, s.at[1] - dz] : [1e6, 1e6] }; });
  PLAN.spots = saved.spots.map(s => ({ key: s.key, at: [s.at[0] - dx, s.at[1] - dz] }));
  PLAN.pond = Object.assign({}, saved.pond, { x: saved.pond.x - dx, z: saved.pond.z - dz });
  xfFrame(g);
  Object.assign(XF, { g, dx, dz, keep: G.keep, margin: G.margin || 0 });
  try { for (const f of fns) f(H); }
  finally {
    Object.assign(XF, { g: null, dx: 0, dz: 0, keep: null, margin: 0 });
    xfFrame(null);
    Object.assign(PLAN, saved);
    ({ terrainAt, cityHeight, landH, inCanal, shoreZ, canalEndZ, districtAt, districtWeights, inHole } = XF_REAL);
  }
  // move what was registered: new lists and items, new or replaced objects
  const seen = new WeakSet(), keep = (v) => { const c = xfCentre(v); if (!c) return true; Object.assign(XF, { g, keep: G.keep, margin: G.margin || 0 }); const ok = xfKeepPoint(c[0], c[1]); XF.g = null; return ok; };
  for (const k of Object.keys(W)) {
    if (XF_SKIP.has(k) || typeof W[k] === 'function') continue;
    const v = W[k], b = before.get(k);
    if (Array.isArray(v)) {
      const from = before.has(k) && Array.isArray(b) ? b : 0;
      if (v.length <= from) continue;
      const fresh = v.splice(from);
      for (const e of fresh) xfShift(e, dx, dz, seen);
      v.push(...(XF_TRIM.has(k) ? fresh.filter(keep) : fresh));
    } else if (v && typeof v === 'object' && (!before.has(k) || b !== v)) xfShift(v, dx, dz, seen);
  }
  // the harbour's water and the like: shifted, not trimmed
  for (let i = W.waters.length - 1; i >= 0 && W.waters[i]._xf === undefined; i--) { W.waters[i]._xf = g; if (!W.waters[i].lake && !W.waters[i].canal) xfShift(W.waters[i], dx, dz, seen); }
  for (let i = nKids; i < W.group.children.length; i++) { const o = W.group.children[i]; o.position.x += dx; o.position.z += dz; }
  for (let i = nDecks; i < DECKS.length; i++) xfShift(DECKS[i], dx, dz, seen);
  for (let i = nHoles; i < TER.holes.length; i++) xfShift(TER.holes[i], dx, dz, seen);
}
