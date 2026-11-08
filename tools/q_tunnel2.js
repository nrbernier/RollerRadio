(() => {
  const W = Game.W, M = W.metro, N = M.N;
  const cov = M.pts.map((p, i) => { for (let d = -8; d <= 8; d++) if (M.pts[(i + d + N) % N].covered) return true; return false; });
  const found = new Map();
  for (let i = 0; i < N; i++) {
    const p = M.pts[i]; if (!(cov[i] || p.down)) continue;
    for (const o of [-5.4, -3, 0, 3, 5.4]) {
      const x = p.x - p.dz * o, z = p.z + p.dx * o; if (inHole(x, z)) continue;
      const roof = cov[i] ? p.y + 6.9 : p.y + 30;     // open cut: anything above the deck is in the way
      for (const b of W.near(x - 0.1, z - 0.1, x + 0.1, z + 0.1, [])) {
        if (b.dyn || b.tag === 'canopy') continue;
        if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.y1 > p.y + 0.8 && b.y0 < roof) {
          const k = [b.tag || '-', b.x0, b.z0, b.x1, b.z1, b.y0, b.y1].map(v => typeof v === 'number' ? +v.toFixed(0) : v).join(',');
          const e = found.get(k) || { n: 0, i, cov: cov[i], gy: +(p.g - p.y).toFixed(1), rel: [+(b.y0 - p.y).toFixed(1), +(b.y1 - p.y).toFixed(1)] }; e.n++; found.set(k, e);
        }
      }
    }
  }
  return JSON.stringify([...found.entries()].sort((a, b) => a[1].i - b[1].i).map(([k, e]) => [k, e.n, e.i, e.cov ? 'tunnel' : 'cut', 'ground+' + e.gy, e.rel]));
})()
