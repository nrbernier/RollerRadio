// ============================================================
//  DEBUG PAGE (city_debug.html only) — jump straight to every place
//  with something to see or hear, set the time of day, watch the music
// ============================================================
(() => {
  const css = `#dbg{position:fixed;left:8px;top:8px;bottom:8px;width:230px;z-index:20;overflow:auto;background:rgba(246,241,231,.93);border-radius:12px;padding:8px 10px;font:12px/1.35 system-ui,sans-serif;color:#1b1a24;box-shadow:0 8px 30px rgba(0,0,0,.25)}
#dbg h4{margin:10px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.6}
#dbg button{display:block;width:100%;text-align:left;margin:2px 0;padding:5px 7px;border:1px solid rgba(0,0,0,.15);border-radius:7px;background:#fff;font:inherit;cursor:pointer}
#dbg button:hover{background:#ffe9b0}#dbg .row{display:flex;gap:4px}#dbg .row button{text-align:center}
#dbg pre{margin:6px 0 0;white-space:pre-wrap;font:11px/1.35 ui-monospace,monospace}
#dbg.min{width:auto;bottom:auto}#dbg.min>*:not(.top){display:none}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'dbg'; document.body.appendChild(box);

  // stand the player at (x, z), facing (fx, fz) if given, on whatever ground is there
  function go(x, z, fx, fz, y) {
    if (Game.state === 'title') document.getElementById('title').dispatchEvent(new PointerEvent('pointerdown'));
    const W = Game.W, p = Game.player;
    const gy = y != null ? y : W.groundAt(x, z, (y ?? terrainAt(x, z)) + 40).y;
    p.pos.set(x, gy + 0.05, z); p.vel.set(0, 0, 0); p.mode = 'ground';
    if (fx != null) p.yaw = Math.atan2(fx - x, fz - z);
    Game.cam.snap(p); Game.cam.yaw = p.yaw; W.updateCells(x, z, 360);
  }
  const near = (x, z, d = 14) => {      // a free spot a little way off, looking at (x, z)
    for (let r = d; r < d + 40; r += 4) for (let a = 0; a < 16; a++) {
      const xx = x + Math.cos(a / 16 * 6.283) * r, zz = z + Math.sin(a / 16 * 6.283) * r, t = terrainAt(xx, zz);
      if (!Game.W.boxes.some(b => xx > b.x0 - 1 && xx < b.x1 + 1 && zz > b.z0 - 1 && zz < b.z1 + 1 && b.y1 > t + 0.3 && b.y0 < t + 2.5)) return [xx, zz];
    }
    return [x + d, z];
  };
  const look = (x, z, d) => { const [a, b] = near(x, z, d); go(a, b, x, z); };

  function build() {
    const W = Game.W, groups = [];
    const add = (g, name, fn) => { let G = groups.find(e => e[0] === g); if (!G) groups.push(G = [g, []]); G[1].push([name, fn]); };
    for (const d of PLAN.districts) { const [a, b, c, e] = d.rect; add('Districts', d.name, () => look((a + c) / 2, (b + e) / 2, 6)); }
    for (const s of (W.stations || [])) add('Metro', s.name + (s.under ? ' (underground)' : ''), () => go(s.p.x - s.p.dz * s.platOff, s.p.z + s.p.dx * s.platOff, s.p.x, s.p.z, s.platY));
    const cen = (W.stations || []).find(s => s.under);
    if (cen) cen.exits.forEach((e, i) => add('Metro', `${cen.name} exit ${i + 1} (street)`, () => go(e.x1 + e.nx * 4, e.z1 + e.nz * 4, e.x0, e.z0)));
    if (W.metro) add('Metro', 'In the ridge tunnel', () => { const M = W.metro, i = M.pts.findIndex(q => q.bored && q.x < -300), p = M.pts[(Math.max(0, i) + 25) % M.N]; go(p.x - p.dz * 4.6, p.z + p.dx * 4.6, null, null, p.y + 0.4); });
    for (const s of PLAN.spots) add('Landmarks', s.key, () => look(s.at[0], s.at[1], 22));
    const seen = new Set();
    for (const s of (W.spots || [])) { const k = s.key; if (seen.has(k) && !k.startsWith('busk')) continue; seen.add(k); add(s.busker ? 'Buskers' : 'Music spots', k.replace('busk_', ''), () => look(s.x, s.z, Math.min(10, (s.r || 10) * 0.5))); }
    if (W.ferris) add('Rides', 'Ferris wheel', () => look(W.ferris.x, W.ferris.z, 24));
    if (W.carousel) add('Rides', 'Carousel', () => look(W.carousel.x, W.carousel.z, 12));
    if (W.cable) { add('Rides', 'Cable car — lake end', () => look(W.cable.A.x, W.cable.A.z, 16)); add('Rides', 'Cable car — top end', () => look(W.cable.B.x, W.cable.B.z, 16)); }
    for (const [i, d] of (W.dishes || []).entries()) add('Rides', 'Radio dish ' + (i + 1), () => look(d.x, d.z, d.r + 6));
    add('New places', 'Forest crag — foot of the path', () => go(CRAG_LINK[2][0], CRAG_LINK[2][1], CRAG.spine[1][0], CRAG.spine[1][1]));
    add('New places', 'Forest crag — summit', () => { const s = cragAt(0.97), e = cragZip().end; go(s[0], s[1], e[0], e[1]); });
    add('New places', 'Building site — gate', () => go(SITE[2] + 6, (SITE[1] + SITE[3]) / 2 + 14, SITE[0], (SITE[1] + SITE[3]) / 2));
    add('New places', 'Building site — crane jib', () => go(SITE[0] + 60, SITE[1] + 23, SITE[0], SITE[1] + 23, SITE.y + 27.3));
    add('New places', 'Tower — lift door', () => go(TOWER.x, TOWER.z + 24, TOWER.x, TOWER.z));
    add('New places', 'Tower — sky deck', () => go(TOWER.x + 8, TOWER.z + 12, TOWER.x + 30, TOWER.z - 4, TOWER.deckY));
    add('New places', 'Sunken street', () => go(VALLEY.x, -560, VALLEY.x, -480));
    add('New places', 'Bridge over the sunken street', () => go(VALLEY.x - 40, -492, VALLEY.x, -492));
    add('New places', 'Vineyards', () => go(345, -1180, 345, -1260));
    add('Places', 'Music garden', () => look(-500, 905, 12));
    add('Places', 'Canal basin', () => look(PLAN.canal.bendX, canalEndZ() - 10, 18));
    add('Places', 'Skatepark', () => look(-545, 256, 16));
    add('Places', 'Beach huts', () => look(-800, shoreZ(-800) - 24, 16));
    add('Places', 'Pond', () => look(PLAN.pond.x, PLAN.pond.z, PLAN.pond.r + 8));
    const F = typeof Fauna !== 'undefined' ? Fauna : null;
    if (F) {
      add('Animals', 'Deer', () => { const d = F.deer && F.deer[0]; if (d) look(d.x, d.z, 16); });
      add('Animals', 'Rabbits', () => { const d = F.rabbits && F.rabbits[0]; if (d) look(d.x, d.z, 8); });
      add('Animals', 'Heron', () => { const d = F.heron; if (d) look(d.x, d.z, 10); });
      add('Animals', 'Kites', () => { const d = F.kites && F.kites[0]; if (d) look(d.x ?? d.ax, d.z ?? d.az, 18); });
    }
    if (W.hatChase) add('Scenes', 'Hat chase', () => look(W.hatChase.x0 ?? W.hatChase.x, W.hatChase.z0 ?? W.hatChase.z, 10));
    if (W.oldLanes && W.oldLanes[0]) add('Scenes', 'Tour group lane', () => { const q = W.oldLanes[0][0]; look(q[0], q[1], 6); });

    box.innerHTML = `<div class="top row"><button id="dbgMin">Debug ▾</button></div>
      <h4>Time</h4><div class="row">${[['dawn', 0.255], ['noon', 0.45], ['dusk', 0.7], ['night', 0.92]].map(([n, v]) => `<button data-t="${v}">${n}</button>`).join('')}</div>
      <pre id="dbgInfo"></pre>` + groups.map(([g, list], gi) => `<h4>${g}</h4>` + list.map(([n], i) => `<button data-g="${gi}" data-i="${i}">${n}</button>`).join('')).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'dbgMin') { box.classList.toggle('min'); return; }
      if (b.dataset.t) { Sky.phase = +b.dataset.t; return; }
      if (b.dataset.g) groups[+b.dataset.g][1][+b.dataset.i][1]();
      b.blur();
    });
    // live readout
    setInterval(() => {
      const p = Game.player, el = document.getElementById('dbgInfo'); if (!el || !p) return;
      el.textContent = `x ${p.pos.x.toFixed(0)}  z ${p.pos.z.toFixed(0)}  y ${p.pos.y.toFixed(1)}\n${Sound.place || '-'} · ${Sound.modeName || ''} · ${Math.round(Sound.bpm || 0)} bpm\ntime ${Sky.phase.toFixed(2)} · ${p.mode}`;
    }, 300);
  }
  const wait = setInterval(() => { if (typeof Game !== 'undefined' && Game.W && Game.player && (Game.state === 'title' || Game.state === 'play')) { clearInterval(wait); build(); } }, 300);
})();
