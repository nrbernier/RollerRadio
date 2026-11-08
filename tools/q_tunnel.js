(() => {
  const W = Game.W, M = W.metro, N = M.N;
  const cov = M.pts.map((p, i) => { for (let d = -8; d <= 8; d++) if (M.pts[(i + d + N) % N].covered) return true; return false; });
  const grid = new Map(), C = 8, key = (x, z) => Math.floor(x / C) + ',' + Math.floor(z / C);
  M.pts.forEach((p, i) => { if (!cov[i]) return; const k = key(p.x, p.z); (grid.get(k) || grid.set(k, []).get(k)).push(i); });
  const ranges = []; let s = -1; for (let i = 0; i <= N; i++) { const c = i < N && cov[i]; if (c && s < 0) s = i; if (!c && s >= 0) { ranges.push([s, i - 1, M.pts[s].x | 0, M.pts[s].z | 0, M.pts[i - 1].x | 0, M.pts[i - 1].z | 0]); s = -1; } }
  const hits = new Map(), v = new THREE.Vector3();
  const test = (x, y, z) => {
    let best = null, bd = 1e9; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of (grid.get((Math.floor(x / C) + a) + ',' + (Math.floor(z / C) + b)) || [])) { const p = M.pts[i]; const d = (x - p.x) ** 2 + (z - p.z) ** 2; if (d < bd) { bd = d; best = i; } }
    if (best === null) return null; const p = M.pts[best]; const lat = Math.abs((x - p.x) * -p.dz + (z - p.z) * p.dx), h = y - p.y;
    if (lat < 5.5 && h > 0.7 && h < 6.95 && !inHole(x, z)) return best; return null;
  };
  for (const [ck, g] of W.cells) g.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.position || o.material === G.outlineMat) return;
    const P = o.geometry.attributes.position.array, col = o.geometry.attributes.color ? o.geometry.attributes.color.array : null;
    o.updateMatrixWorld(true);
    for (let k = 0; k < P.length; k += 3) { v.set(P[k], P[k + 1], P[k + 2]).applyMatrix4(o.matrixWorld); const i = test(v.x, v.y, v.z); if (i === null) continue;
      const c = col ? '#' + [col[k], col[k + 1], col[k + 2]].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('') : '-';
      const hk = Math.round(v.x / 6) * 6 + ',' + Math.round(v.z / 6) * 6 + ' ' + (o.material.name || o.material.type) + ' ' + c;
      const e = hits.get(hk) || { n: 0, y0: 1e9, y1: -1e9, i }; e.n++; e.y0 = Math.min(e.y0, v.y - M.pts[i].y); e.y1 = Math.max(e.y1, v.y - M.pts[i].y); hits.set(hk, e); }
  });
  // boxes too
  const bx = []; for (const b of W.boxes) { if (b.dyn) continue; for (const [x, z] of [[(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2], [b.x0, b.z0], [b.x1, b.z1], [b.x0, b.z1], [b.x1, b.z0]]) { const i = test(x, Math.min(b.y1, M.pts[0].y), z); let hit = null; for (let yy = b.y0; yy <= b.y1; yy += 0.5) { const t = test(x, yy, z); if (t !== null) { hit = t; break; } } if (hit !== null) { bx.push([b.tag || '-', +b.x0.toFixed(0), +b.z0.toFixed(0), +b.x1.toFixed(0), +b.z1.toFixed(0), +(b.y0 - M.pts[hit].y).toFixed(1), +(b.y1 - M.pts[hit].y).toFixed(1)]); break; } } }
  const list = [...hits.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, e]) => [k, e.n, +e.y0.toFixed(1), +e.y1.toFixed(1), e.i]);
  return JSON.stringify({ ranges, nHits: list.length, list: list.slice(0, 60), boxes: bx.slice(0, 40), nBoxes: bx.length });
})()
