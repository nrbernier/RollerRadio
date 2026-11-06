// ============================================================
//  TERRAIN — the city's heightfield: one grid for drawing and collision
//  Grid lines fall exactly on the canal quays and the docks quay, so their
//  walls can be straight boxes. Collision reads the same triangles the mesh draws.
// ============================================================
const TER = { x0: -1098, z0: -1514, cell: 8, nx: 276, nz: 376 };
TER.x1 = TER.x0 + TER.nx * TER.cell; TER.z1 = TER.z0 + TER.nz * TER.cell;

function buildHeights() {
  const { nx, nz, x0, z0, cell } = TER;
  const H = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) H[j * (nx + 1) + i] = cityHeight(x0 + i * cell, z0 + j * cell);
  TER.H = H;
  // the canal: vertices strictly inside the channel drop to the bed (edges stay at quay height)
  const C = PLAN.canal;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + i * cell, z = z0 + j * cell;
    const inside = (x > C.x0 && x < C.bendX + C.half - 0.1 && Math.abs(z - C.z) < C.half - 0.1) || (Math.abs(x - C.bendX) < C.half - 0.1 && z > C.z && z < shoreZ(x) + 4);
    if (inside) H[j * (nx + 1) + i] = C.bedY;
  }
}
// lower the ground along a corridor (centreline points [x, y, z]) to floorY(t) + off
function carveCorridor(pts, half, off = -0.6) {
  const { nx, nz, x0, z0, cell, H } = TER;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    const minX = Math.min(a[0], b[0]) - half - cell, maxX = Math.max(a[0], b[0]) + half + cell;
    const minZ = Math.min(a[2], b[2]) - half - cell, maxZ = Math.max(a[2], b[2]) + half + cell;
    const dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz || 1;
    for (let j = Math.max(0, Math.floor((minZ - z0) / cell)); j <= Math.min(nz, Math.ceil((maxZ - z0) / cell)); j++)
      for (let i = Math.max(0, Math.floor((minX - x0) / cell)); i <= Math.min(nx, Math.ceil((maxX - x0) / cell)); i++) {
        const x = x0 + i * cell, z = z0 + j * cell;
        const t = U.clamp(((x - a[0]) * dx + (z - a[2]) * dz) / L2, 0, 1);
        const d = Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t);
        if (d > half) continue;
        const y = a[1] + (b[1] - a[1]) * t + off, idx = j * (nx + 1) + i;
        if (H[idx] > y) H[idx] = y;
      }
  }
}
// raise/lower the ground to a plateau (rect, target, soft edge)
function flattenRect(r, y, soft = 12, mode = 'set') {
  const { nx, nz, x0, z0, cell, H } = TER;
  for (let j = Math.max(0, Math.floor((r[1] - soft - z0) / cell)); j <= Math.min(nz, Math.ceil((r[3] + soft - z0) / cell)); j++)
    for (let i = Math.max(0, Math.floor((r[0] - soft - x0) / cell)); i <= Math.min(nx, Math.ceil((r[2] + soft - x0) / cell)); i++) {
      const x = x0 + i * cell, z = z0 + j * cell, d = rectDist(r, x, z);
      if (d > soft) continue;
      const w = d <= 0 ? 1 : U.smooth(1 - d / soft), idx = j * (nx + 1) + i;
      const nv = U.lerp(H[idx], y, w);
      if (mode === 'set' || (mode === 'min' && nv < H[idx]) || (mode === 'max' && nv > H[idx])) H[idx] = nv;
    }
}

// a bowl for a pond: deep in the middle, banks rising to `level + bank` at radius r
function pondBowl(x0p, z0p, r, level, bank = 2.5) {
  const { nx, nz, x0, z0, cell, H } = TER, R2 = r * 1.6;
  for (let j = Math.max(0, Math.floor((z0p - R2 - z0) / cell)); j <= Math.min(nz, Math.ceil((z0p + R2 - z0) / cell)); j++)
    for (let i = Math.max(0, Math.floor((x0p - R2 - x0) / cell)); i <= Math.min(nx, Math.ceil((x0p + R2 - x0) / cell)); i++) {
      const x = x0 + i * cell, z = z0 + j * cell, d = Math.hypot(x - x0p, z - z0p), idx = j * (nx + 1) + i;
      const bowl = level - 3.2 + (3.2 + bank) * Math.pow(Math.min(1, d / r), 2);
      if (d <= r) H[idx] = bowl;
      else if (d < R2) H[idx] = U.lerp(Math.max(bowl, level + bank), H[idx], U.smooth((d - r) / (R2 - r)));
    }
}

// holes in the ground (grid-aligned rects): not drawn, and not solid — whatever is built inside carries you
TER.holes = [];
function inHole(x, z) { for (const h of TER.holes) if (x > h[0] && x < h[2] && z > h[1] && z < h[3]) return true; return false; }

// exact height on the drawn triangles (split along the i+j diagonal, as the mesh is)
const TERRAIN_HIT = { terrain: true, slope(x, z, out) { terrainAt(x, z, out); return out; } };
const _ts = [0, 0];
function terrainAt(x, z, slopeOut) {
  const { nx, nz, x0, z0, cell, H } = TER;
  let fx = (x - x0) / cell, fz = (z - z0) / cell;
  if (fx < 0 || fz < 0 || fx >= nx || fz >= nz) { if (slopeOut) { slopeOut[0] = slopeOut[1] = 0; } return cityHeight(x, z); }
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, W1 = nx + 1;
  const h00 = H[j * W1 + i], h10 = H[j * W1 + i + 1], h01 = H[(j + 1) * W1 + i], h11 = H[(j + 1) * W1 + i + 1];
  let y, sx, sz;
  if (u + v <= 1) { sx = h10 - h00; sz = h01 - h00; y = h00 + sx * u + sz * v; }
  else { sx = h11 - h01; sz = h11 - h10; y = h11 + sx * (u - 1) + sz * (v - 1); }
  if (slopeOut) { slopeOut[0] = sx / cell; slopeOut[1] = sz / cell; }
  return y;
}

// ---------- drawing ----------
// ground colour comes from a painter function (x, z, y, steep) → THREE.Color, set per vertex
const TILE = 50;   // cells per mesh tile (400 m)
function terrainMeshes(paint, mat) {
  const { nx, nz, x0, z0, cell, H } = TER, W1 = nx + 1;
  const group = new THREE.Group(), col = new THREE.Color();
  const C = PLAN.canal;
  const hole = (i, j) => {   // a cell that lies inside the canal (or a dug-out hole) is not drawn
    const cx = x0 + (i + 0.5) * cell, cz = z0 + (j + 0.5) * cell;
    if (inHole(cx, cz)) return true;
    return (cx > C.x0 && cx < C.bendX + C.half && Math.abs(cz - C.z) < C.half) || (Math.abs(cx - C.bendX) < C.half && cz > C.z && cz < shoreZ(cx) + 4);
  };
  for (let tj = 0; tj < nz; tj += TILE) for (let ti = 0; ti < nx; ti += TILE) {
    const ni = Math.min(TILE, nx - ti), nj = Math.min(TILE, nz - tj), NG = (ni + 1) * (nj + 1);
    // the grid, then a skirt: the tile's border again, 4 m lower (hides cracks next to finer tiles)
    const ring = [];
    for (let i = 0; i < ni; i++) ring.push([i, 0]); for (let j = 0; j < nj; j++) ring.push([ni, j]);
    for (let i = ni; i > 0; i--) ring.push([i, nj]); for (let j = nj; j > 0; j--) ring.push([0, j]);
    const NV = NG + ring.length;
    const pos = new Float32Array(NV * 3), cols = new Float32Array(NV * 3), uv = new Float32Array(NV * 2);
    for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) {
      const gi = ti + i, gj = tj + j, k = j * (ni + 1) + i, x = x0 + gi * cell, z = z0 + gj * cell, y = H[gj * W1 + gi];
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      uv[k * 2] = x / 24; uv[k * 2 + 1] = z / 24;
      const gx = gi < nx ? H[gj * W1 + gi + 1] - y : y - H[gj * W1 + gi - 1], gz = gj < nz ? H[(gj + 1) * W1 + gi] - y : y - H[(gj - 1) * W1 + gi];
      paint(x, z, y, Math.hypot(gx, gz) / cell, col);
      cols[k * 3] = col.r; cols[k * 3 + 1] = col.g; cols[k * 3 + 2] = col.b;
    }
    const V = (i, j) => j * (ni + 1) + i, skirtOf = new Map();
    ring.forEach(([i, j], r) => { const a = V(i, j), k = NG + r; skirtOf.set(a, k); pos[k * 3] = pos[a * 3]; pos[k * 3 + 1] = pos[a * 3 + 1] - 4; pos[k * 3 + 2] = pos[a * 3 + 2]; uv[k * 2] = uv[a * 2]; uv[k * 2 + 1] = uv[a * 2 + 1]; cols[k * 3] = cols[a * 3] * 0.9; cols[k * 3 + 1] = cols[a * 3 + 1] * 0.9; cols[k * 3 + 2] = cols[a * 3 + 2] * 0.9; });
    // index sets: full detail, every 2nd vertex, every 5th (blocks touching a hole stay full detail)
    const levels = [];
    for (const st of [1, 2, 5]) {
      const idx = [];
      for (let j = 0; j < nj; j += st) for (let i = 0; i < ni; i += st) {
        const i2 = Math.min(ni, i + st), j2 = Math.min(nj, j + st);
        let anyHole = false;
        if (st > 1) for (let jj = j; jj < j2 && !anyHole; jj++) for (let ii = i; ii < i2; ii++) if (hole(ti + ii, tj + jj)) { anyHole = true; break; }
        if (st === 1 || anyHole) {
          for (let jj = j; jj < j2; jj++) for (let ii = i; ii < i2; ii++) { if (hole(ti + ii, tj + jj)) continue; const a = V(ii, jj), b = a + 1, c = a + ni + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        } else { const a = V(i, j), b = V(i2, j), c = V(i, j2), d = V(i2, j2); idx.push(a, c, b, b, c, d); }
      }
      if (st > 1) {
        // skirts along the four edges, between this level's edge vertices
        const edge = (pts) => { for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], a2 = skirtOf.get(a), b2 = skirtOf.get(b); if (a2 === undefined || b2 === undefined) continue; idx.push(a, b, a2, b, b2, a2, a, a2, b, b, a2, b2); } };
        const xs = [], zs = []; for (let i = 0; i < ni; i += st) xs.push(i); xs.push(ni); for (let j = 0; j < nj; j += st) zs.push(j); zs.push(nj);
        edge(xs.map(i => V(i, 0))); edge(xs.map(i => V(i, nj))); edge(zs.map(j => V(0, j))); edge(zs.map(j => V(ni, j)));
      }
      levels.push(new THREE.BufferAttribute(NV > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(levels[0]); g.computeVertexNormals();
    // skirt normals: copy the edge's (computeVertexNormals gave them odd ones)
    const nrm = g.attributes.normal.array; for (const [a, k] of skirtOf) { nrm[k * 3] = nrm[a * 3]; nrm[k * 3 + 1] = nrm[a * 3 + 1]; nrm[k * 3 + 2] = nrm[a * 3 + 2]; }
    const m = new THREE.Mesh(g, mat); m.receiveShadow = false;
    m.userData = { cx: x0 + (ti + ni / 2) * cell, cz: z0 + (tj + nj / 2) * cell, levels, lod: 0 };
    group.add(m);
  }
  // pick each tile's detail from the camera distance
  group.userData.lod = (cx, cz) => {
    for (const m of group.children) {
      const u = m.userData, d = Math.max(0, Math.hypot(u.cx - cx, u.cz - cz) - TILE * cell * 0.7);
      const want = d < 260 ? 0 : d < 640 ? 1 : 2;
      if (want !== u.lod) { u.lod = want; m.geometry.setIndex(u.levels[want]); }
    }
  };
  return group;
}
// the hills around the city, coarse, for the views (no collision: you can't get there)
// patchwork outside the city: woods, meadows, a few fields; rolling bumps further out
const hillFbm = (x, z) => Math.sin(x * 0.0031 + Math.sin(z * 0.0023) * 2) * 0.5 + Math.sin(z * 0.0042 - x * 0.0017 + 1.7) * 0.35 + Math.sin((x + z) * 0.009) * 0.15;
const hillWood = (x, z) => hillFbm(x * 1.7 + 300, z * 1.7 - 200) > 0.25;
function hillY(x, z) {
  const out = Math.max(0, Math.abs(x) - 1250, -1650 - z);
  let y = landH(x, z) - 0.4 + U.smooth(U.clamp(out / 600, 0, 1)) * (hillFbm(x, z) * 55 + Math.sin(x * 0.0013 + 2) * 25);
  if (z > 1100) y = Math.min(y, U.lerp(y, -8, U.clamp((z - 1100) / 200, 0, 1)));
  return y;
}
function outerHills(mat) {
  // vertices line up with the terrain grid (every 6th), so the seam at the edge is clean
  const step = 48, X0 = TER.x0 - step * 40, X1 = TER.x1 + step * 40, Z0 = TER.z0 - step * 44, Z1 = TER.z0 + step * 58;
  const nx = (X1 - X0) / step, nz = (Z1 - Z0) / step, pos = [], cols = [], idx = [], col = new THREE.Color(), c2 = new THREE.Color();
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = X0 + i * step, z = Z0 + j * step;
    const inside = x > TER.x0 + 1 && x < TER.x1 - 1 && z > TER.z0 + 1;
    let y = hillY(x, z);
    if (inside) y -= 30;                                   // tucked under the real terrain
    pos.push(x, y, z);
    const wood = hillWood(x, z), field = !wood && Math.sin(x * 0.02) * Math.sin(z * 0.017) > 0.55;
    col.set(wood ? '#3f6a3a' : field ? '#b8b06a' : '#6f9a4e');
    c2.set('#8aa07a'); col.lerp(c2, U.clamp((y - 180) / 120, 0, 0.6));
    cols.push(col.r, col.g, col.b);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// clumps of trees on the wooded patches of the hills (far batch only: they're never close)
function hillTrees(F) {
  const r = U.rng(77), m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = V3(), sc = V3();
  const ICO = prepShape(new THREE.IcosahedronGeometry(1, 0));
  let n = 0;
  for (let i = 0; i < 9000 && n < 2600; i++) {
    const x = TER.x0 - 1700 + r() * (TER.x1 - TER.x0 + 3400), z = TER.z0 - 1900 + r() * 3200;
    if (x > TER.x0 - 30 && x < TER.x1 + 30 && z > TER.z0 - 30) continue;
    if (!hillWood(x, z) && r() > 0.08) continue;
    const y = hillY(x, z), s = 7 + r() * 7;
    m.compose(v.set(x, y + s * 0.7, z), q.identity(), sc.set(s, s * 1.1, s));
    F.addShape(ICO, m, r() < 0.5 ? '#3a6436' : '#2f5a34'); n++;
  }
}
