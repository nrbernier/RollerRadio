// ============================================================
//  CITY BATCHING — near detail in cells you can see around you,
//  plus a cheap "far" copy of everything big that is always drawn.
//  The far copy is a little smaller than the real thing, so up close
//  it hides inside it; far away it is the skyline.
// ============================================================
const CELL = 128;
class CellBatch extends StaticBatch {
  constructor() { super(); this.cellLines = {}; this.split = { house: ['roof', 'house'], shed: ['roof', 'brick'], tower: ['roof', 'tower'], grid: ['roof', 'grid'], deco: ['roof', 'deco'] }; }
  bucket(name, x, z) {
    const key = name + '|' + Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
    return this.buckets[key] || (this.buckets[key] = { name, pos: [], nor: [], col: [], uv: [], cx: Math.floor(x / CELL), cz: Math.floor(z / CELL) });
  }
  // same as StaticBatch.add, but edges are filed by cell
  add(geo, matrix, color, kind = 'plain', o = {}) {
    super.add(geo, matrix, color, kind, Object.assign({}, o, { edges: false }));
    if (o.edges === false) return;
    const eg = new THREE.EdgesGeometry(geo, 30); if (matrix) eg.applyMatrix4(matrix);
    const a = eg.attributes.position.array;
    for (let i = 0; i < a.length; i += 6) {
      const key = Math.floor((a[i] + a[i + 3]) / 2 / CELL) + ',' + Math.floor((a[i + 2] + a[i + 5]) / 2 / CELL);
      const L = this.cellLines[key] || (this.cellLines[key] = []);
      for (let k = 0; k < 6; k++) L.push(a[i + k]);
    }
  }
  // fast path for shapes used thousands of times (trees): no cloning, no edges
  addShape(sh, m, color, kind, outlineT = 0) {
    const e = m.elements, P = sh.pos, Nn = sh.nor, n = P.length / 3;
    const nm = _nm3.getNormalMatrix(m).elements, c = _sc.set(color);
    const tp = _tp.length >= P.length ? _tp : (_tp = new Float32Array(P.length)), tn = _tn.length >= P.length ? _tn : (_tn = new Float32Array(P.length));
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      tp[i * 3] = X; tp[i * 3 + 1] = Y; tp[i * 3 + 2] = Z;
      if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z;
      const a = Nn[i * 3], b = Nn[i * 3 + 1], cc = Nn[i * 3 + 2];
      let nx = nm[0] * a + nm[3] * b + nm[6] * cc, ny = nm[1] * a + nm[4] * b + nm[7] * cc, nz = nm[2] * a + nm[5] * b + nm[8] * cc; const l = Math.hypot(nx, ny, nz) || 1;
      tn[i * 3] = nx / l; tn[i * 3 + 1] = ny / l; tn[i * 3 + 2] = nz / l;
    }
    for (let i = 0; i < n * 3; i += 9) {
      const b = this.bucket(kind, (tp[i] + tp[i + 3] + tp[i + 6]) / 3, (tp[i + 2] + tp[i + 5] + tp[i + 8]) / 3);
      const shade = (tn[i + 1] + tn[i + 4] + tn[i + 7]) / 3 < -0.5 ? 0.55 : 1;
      for (let k = 0; k < 9; k += 3) { b.pos.push(tp[i + k], tp[i + k + 1], tp[i + k + 2]); b.nor.push(tn[i + k], tn[i + k + 1], tn[i + k + 2]); b.col.push(c.r * shade, c.g * shade, c.b * shade); b.uv.push(tp[i + k] / 8, tp[i + k + 2] / 8); }
    }
    if (outlineT > 0) {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
      const sx = (x1 - x0 + 2 * outlineT) / Math.max(1e-4, x1 - x0), sy = (y1 - y0 + 2 * outlineT) / Math.max(1e-4, y1 - y0), sz = (z1 - z0 + 2 * outlineT) / Math.max(1e-4, z1 - z0);
      for (let i = 0; i < n * 3; i += 9) {
        const b = this.bucket('outline', (tp[i] + tp[i + 3] + tp[i + 6]) / 3, (tp[i + 2] + tp[i + 5] + tp[i + 8]) / 3);
        for (let k = 0; k < 9; k += 3) b.pos.push(cx + (tp[i + k] - cx) * sx, cy + (tp[i + k + 1] - cy) * sy, cz + (tp[i + k + 2] - cz) * sz);
      }
    }
  }
  // → Map "cx,cz" → Group
  buildCells(materials) {
    const cells = new Map();
    const cellOf = (key) => { let g = cells.get(key); if (!g) { g = new THREE.Group(); const [cx, cz] = key.split(',').map(Number); g.userData = { cx: (cx + 0.5) * CELL, cz: (cz + 0.5) * CELL }; cells.set(key, g); } return g; };
    for (const key in this.buckets) {
      const b = this.buckets[key], name = b.name;
      if (!b.pos.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      const ck = key.split('|')[1];
      if (name === 'outline') { cellOf(ck).add(new THREE.Mesh(g, G.outlineMat)); continue; }
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      const mesh = new THREE.Mesh(g, materials[name] || materials.plain);
      if (name === 'water' || name === 'glow' || name === 'lamp' || name === 'pool') mesh.renderOrder = 3;
      cellOf(ck).add(mesh);
    }
    for (const key in this.cellLines) {
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(this.cellLines[key], 3));
      cellOf(key).add(new THREE.LineSegments(lg, G.lineMat));
    }
    return cells;
  }
}

// far skyline: plain coloured boxes and blobs merged into a few tiles, no outlines, no textures
const _nm3 = new THREE.Matrix3(), _sc = new THREE.Color(); let _tp = new Float32Array(0), _tn = new Float32Array(0);
function prepShape(geo) { const g = geo.index ? geo.toNonIndexed() : geo; if (!g.attributes.normal) g.computeVertexNormals(); return { pos: g.attributes.position.array, nor: g.attributes.normal.array }; }
const FAR_TILE = 640;
class FarBatch {
  constructor() { this.tiles = {}; }
  tile(x, z) { const k = Math.floor(x / FAR_TILE) + ',' + Math.floor(z / FAR_TILE); return this.tiles[k] || (this.tiles[k] = { pos: [], nor: [], col: [] }); }
  add(geo, matrix, color) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = new THREE.Color(color);
    g.computeBoundingBox(); const ctr = g.boundingBox.getCenter(V3());
    const T = this.tile(ctr.x, ctr.z);
    for (let i = 0; i < p.length; i += 3) { T.pos.push(p[i], p[i + 1], p[i + 2]); T.nor.push(n[i], n[i + 1], n[i + 2]); const sh = n[i + 1] < -0.5 ? 0.6 : 1; T.col.push(c.r * sh, c.g * sh, c.b * sh); }
  }
  addShape(sh, m, color) {
    const e = m.elements, P = sh.pos, Nn = sh.nor, nm = _nm3.getNormalMatrix(m).elements, c = _sc.set(color);
    const T = this.tile(e[12], e[14]);
    for (let i = 0; i < P.length; i += 3) {
      const x = P[i], y = P[i + 1], z = P[i + 2], a = Nn[i], b = Nn[i + 1], cc = Nn[i + 2];
      T.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
      let nx = nm[0] * a + nm[3] * b + nm[6] * cc, ny = nm[1] * a + nm[4] * b + nm[7] * cc, nz = nm[2] * a + nm[5] * b + nm[8] * cc; const l = Math.hypot(nx, ny, nz) || 1;
      T.nor.push(nx / l, ny / l, nz / l); const sh2 = ny / l < -0.5 ? 0.6 : 1; T.col.push(c.r * sh2, c.g * sh2, c.b * sh2);
    }
  }
  box(x0, y0, z0, x1, y1, z1, color, inset = 0.35) {
    const geo = new THREE.BoxGeometry(Math.max(0.1, x1 - x0 - 2 * inset), Math.max(0.1, y1 - y0 - inset), Math.max(0.1, z1 - z0 - 2 * inset));
    this.add(geo, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1 - inset) / 2, (z0 + z1) / 2), color);
  }
  build(mat) {
    const group = new THREE.Group();
    for (const k in this.tiles) {
      const T = this.tiles[k]; if (!T.pos.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(T.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(T.col, 3));
      group.add(new THREE.Mesh(g, mat));
    }
    return group;
  }
}

// ---------- materials ----------
// one set for the whole city; the day/night cycle drives the window glow and the lamps
function cityMaterials() {
  if (G.cityMats) return G.cityMats;
  const base = worldMaterials(false);
  const M = Object.assign({}, base);
  const winTex = nightWindowTex(), glowTex = nightGlowTex();
  // daytime: pale walls, windows that read as glass (blue-grey with a sky glint), floor lines
  const dayTex = canvasTex(1024, 1024, (x, w, h) => {
    const r = U.rng(23);
    x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h);
    NIGHT_WIN.forEach((c, i) => {
      const [X, Y, W2, H2] = nightWinRect(c, i % 16, Math.floor(i / 16));
      x.fillStyle = '#5d6f86'; x.fillRect(X - 2, Y - 2, W2 + 4, H2 + 4);
      const g = x.createLinearGradient(X, Y, X + W2, Y + H2); g.addColorStop(0, '#9fb8cf'); g.addColorStop(0.55, '#7d93ab'); g.addColorStop(1, '#6a7f96');
      x.fillStyle = g; x.fillRect(X, Y, W2, H2);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(X, Y + H2); x.lineTo(X + W2 * 0.35, Y); x.lineTo(X + W2 * 0.5, Y); x.lineTo(X + W2 * 0.15, Y + H2); x.fill();
      x.fillStyle = '#4c5a6c'; if (c.style !== 'wide') x.fillRect(X + W2 / 2 - 1.5, Y, 3, H2);
      if (c.blind) { x.fillStyle = 'rgba(240,236,226,.85)'; x.fillRect(X, Y, W2, H2 * c.blind * 0.8); }
    });
    for (let f = 0; f < 16; f++) { x.fillStyle = 'rgba(80,70,60,.18)'; x.fillRect(0, f * 64 + 54, w, 6); }
  }, { repeat: true }).tex; dayTex.repeat.set(0.25, 0.25);
  M.wall = new THREE.MeshToonMaterial({ vertexColors: true, map: dayTex, emissiveMap: glowTex, emissive: 0xffffff, emissiveIntensity: 0, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  M.wallDay = dayTex; M.wallNight = winTex;
  // towers: continuous glass bands between thin spandrels, mullions every couple of metres
  const towerTex = canvasTex(256, 256, (x, w, h) => {
    for (let f = 0; f < 4; f++) {
      const y = f * 64; x.fillStyle = '#eef0ee'; x.fillRect(0, y, w, 16);
      const g = x.createLinearGradient(0, y + 16, 0, y + 64); g.addColorStop(0, '#a8c4d8'); g.addColorStop(1, '#6f8ea8'); x.fillStyle = g; x.fillRect(0, y + 16, w, 48);
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, y + 18, w, 6);
      x.fillStyle = '#5f7488'; for (let c = 0; c < 8; c++) x.fillRect(c * 32, y + 16, 2, 48);
    }
  }, { repeat: true }).tex; towerTex.repeat.set(1, 1);
  const towerGlow = canvasTex(256, 256, (x, w, h) => { const r = U.rng(61); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (let f = 0; f < 4; f++) for (let c = 0; c < 8; c++) if (r() < 0.45) { x.fillStyle = r() < 0.7 ? '#ffe6b0' : '#d8f0ff'; x.fillRect(c * 32 + 2, f * 64 + 18, 30, 44); } }, { repeat: true }).tex;
  M.tower = new THREE.MeshToonMaterial({ vertexColors: true, map: towerTex, emissiveMap: towerGlow, emissive: 0xffffff, emissiveIntensity: 0, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  // concrete grid: deep square windows in a frame (tinted by the vertex colour)
  const gridTex = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h);
    for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) {
      const X = c * 64 + 10, Y = f * 64 + 12, W2 = 44, H2 = 40;
      x.fillStyle = '#c9c4b8'; x.fillRect(X - 4, Y - 4, W2 + 8, H2 + 8);
      const g = x.createLinearGradient(X, Y, X + W2, Y + H2); g.addColorStop(0, '#8aa4bc'); g.addColorStop(1, '#4f647a'); x.fillStyle = g; x.fillRect(X, Y, W2, H2);
      x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.moveTo(X, Y + H2); x.lineTo(X + 14, Y); x.lineTo(X + 22, Y); x.lineTo(X + 8, Y + H2); x.fill();
      x.fillStyle = '#3f4a58'; x.fillRect(X, Y + H2 - 5, W2, 5);
    }
  }, { repeat: true }).tex;
  const gridGlow = canvasTex(256, 256, (x, w, h) => { const r = U.rng(71); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) if (r() < 0.5) { x.fillStyle = r() < 0.6 ? '#ffe0a0' : '#e0f0ff'; x.fillRect(c * 64 + 10, f * 64 + 12, 44, 35); } }, { repeat: true }).tex;
  M.grid = new THREE.MeshToonMaterial({ vertexColors: true, map: gridTex, emissiveMap: gridGlow, emissive: 0xffffff, emissiveIntensity: 0, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  // art deco: tall piers with narrow windows between them, a spandrel at each floor
  const decoTex = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#f4efe4'; x.fillRect(0, 0, w, h);
    for (let c = 0; c < 8; c++) {
      const X = c * 32 + 9, W2 = 14;
      const g = x.createLinearGradient(X, 0, X + W2, 0); g.addColorStop(0, '#6f8296'); g.addColorStop(1, '#9cb0c2'); x.fillStyle = g; x.fillRect(X, 0, W2, h);
      x.fillStyle = '#d8cdb8'; for (let f = 0; f < 4; f++) x.fillRect(X - 1, f * 64 + 50, W2 + 2, 14);
    }
    x.fillStyle = 'rgba(90,70,40,.18)'; for (let c = 0; c < 8; c++) x.fillRect(c * 32, 0, 3, h);
  }, { repeat: true }).tex;
  const decoGlow = canvasTex(256, 256, (x, w, h) => { const r = U.rng(73); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (let c = 0; c < 8; c++) for (let f = 0; f < 4; f++) if (r() < 0.45) { x.fillStyle = '#ffd890'; x.fillRect(c * 32 + 9, f * 64, 14, 50); } }, { repeat: true }).tex;
  M.deco = new THREE.MeshToonMaterial({ vertexColors: true, map: decoTex, emissiveMap: decoGlow, emissive: 0xffffff, emissiveIntensity: 0, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  // older houses: plaster, small windows with shutters, a lit one here and there at night
  const HW = []; { const r = U.rng(41); for (let i = 0; i < 64; i++) HW.push({ lit: r() < 0.45, col: r() < 0.5 ? '#ffd88a' : '#ffe8c0', sh: ['#3f6a5a', '#7a4a3a', '#4a5a7a', '#6a6a52'][Math.floor(r() * 4)], box: r() < 0.3, open: r() < 0.3 }); }
  const hwRect = (i) => { const c = i % 8, f = Math.floor(i / 8); return [c * 64 + 20, f * 64 + 14, 24, 32]; };
  const houseTex = canvasTex(512, 512, (x, w, h) => {
    const r = U.rng(43); x.fillStyle = '#f6efe2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(120,100,80,${r() * 0.06})`; x.fillRect(r() * w, r() * h, 2 + r() * 10, 1 + r() * 4); }
    HW.forEach((c, i) => {
      const [X, Y, W2, H2] = hwRect(i);
      x.fillStyle = '#e6dcc8'; x.fillRect(X - 4, Y - 4, W2 + 8, H2 + 8);
      x.fillStyle = '#3e4a58'; x.fillRect(X, Y, W2, H2);
      x.fillStyle = 'rgba(200,220,235,.35)'; x.fillRect(X + 2, Y + 2, W2 / 2 - 3, H2 - 4);
      x.fillStyle = '#e6dcc8'; x.fillRect(X + W2 / 2 - 1, Y, 2, H2); x.fillRect(X, Y + H2 / 2 - 1, W2, 2);
      x.fillStyle = c.sh; if (!c.open) { x.fillRect(X - 10, Y, 9, H2); x.fillRect(X + W2 + 1, Y, 9, H2); } else x.fillRect(X - 10, Y, 9, H2);
      if (c.box) { x.fillStyle = '#7a5a3a'; x.fillRect(X - 2, Y + H2 + 2, W2 + 4, 5); x.fillStyle = ['#e85a6a', '#f2c23a', '#ffffff'][i % 3]; for (let k = 0; k < 5; k++) x.fillRect(X + k * 5, Y + H2 - 2, 4, 4); }
    });
  }, { repeat: true }).tex;
  const houseGlow = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); HW.forEach((c, i) => { if (!c.lit) return; const [X, Y, W2, H2] = hwRect(i); x.fillStyle = c.col; x.fillRect(X, Y, W2, H2); x.fillStyle = '#000'; x.fillRect(X + W2 / 2 - 1, Y, 2, H2); x.fillRect(X, Y + H2 / 2 - 1, W2, 2); }); }, { repeat: true }).tex;
  houseTex.repeat.set(0.5, 0.5); houseGlow.repeat.set(0.5, 0.5);
  M.house = new THREE.MeshToonMaterial({ vertexColors: true, map: houseTex, emissiveMap: houseGlow, emissive: 0xffffff, emissiveIntensity: 0, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  M.lamp = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff });       // street lamps: colour scaled by the night amount
  const noise = canvasTex(256, 256, (x, w, h) => {
    const r = U.rng(5); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(40,60,30,${r() * 0.08})`; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 9, 1 + r() * 5, r() * 3, 0, 7); x.fill(); }
  }, { repeat: true }).tex;
  M.ground = new THREE.MeshToonMaterial({ vertexColors: true, map: noise, gradientMap: G.grad });
  M.far = new THREE.MeshLambertMaterial({ vertexColors: true });
  // pools of lamplight on the ground (only visible at night)
  M.pool = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  M.hills = new THREE.MeshLambertMaterial({ vertexColors: true });
  // things lying on the ground are pulled towards the camera so they never flicker into the terrain
  const decal = (map, f = -2) => new THREE.MeshToonMaterial({ vertexColors: true, map, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f * 2 });
  M.road = decal(base.asphalt.map, -3); M.walk = decal(base.paving.map, -2); M.gravel = decal(base.sand.map, -2); M.tiles = decal(base.tile.map, -2);
  M.paint = new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  M.flat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: G.grad });
  G.cityMats = M;
  return M;
}

// one mesh from many parts ([geometry, matrix|null, colour]) — vehicles are a single draw (plus an outline)
function mergeParts(parts) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const [geo, m, colr] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (m) g.applyMatrix4(m);
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array; c.set(colr);
    for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); col.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
function solid(parts, outline = 0.06) {
  const g = mergeParts(parts);
  const mat = G.solidMat || (G.solidMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: G.grad }));
  const m = new THREE.Mesh(g, mat);
  if (outline) {
    g.computeBoundingBox(); const bb = g.boundingBox, size = bb.getSize(V3()), ctr = bb.getCenter(V3());
    const o = new THREE.Mesh(g, G.outlineMat); const sc = V3((size.x + 2 * outline) / size.x, (size.y + 2 * outline) / size.y, (size.z + 2 * outline) / size.z);
    o.scale.copy(sc); o.position.set(ctr.x * (1 - sc.x), ctr.y * (1 - sc.y), ctr.z * (1 - sc.z)); m.add(o);
  }
  return m;
}
const T4 = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(x, y, z);
