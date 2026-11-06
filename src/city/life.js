// ============================================================
//  LIFE — people, cars, boats, birds
// ============================================================
const Life = (() => {
  let W, people, heads, birdIM, cars = [], boats = [], flocks = [], pigeons = [];
  const walkers = [], standers = [];
  const L = { crowdNear: 0 };
  const STYLE = {
    business: ['#2a2f45', '#3e4a6a', '#6a6a72', '#1f2433', '#8a5a4a', '#c9c2b4', '#2f5f8a'],
    park: ['#6f8a5a', '#b8743a', '#d9a441', '#7a6a9a', '#4a6a8a'],
    market: ['#e8b84a', '#c4523a', '#3e8f86', '#d9779a', '#f2efe6', '#8a5a9e'],
    canals: ['#5a7a8a', '#9a6a4a', '#d9c9a8', '#3a4a5a'],
    oldtown: ['#c46a4a', '#e8d4a0', '#6a8aa0', '#a0a07a'],
    lake: ['#f2efe6', '#4aa0c8', '#e88a6a', '#e8c84a'],
    docks: ['#ff8a3a', '#3a4a5a', '#e8c84a', '#5a5a62'],
  };
  const SKIN = ['#f0c8a0', '#d9a07a', '#a8704a', '#7a4a32', '#e8b890'];
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color(), _v = V3(), _s = V3();

  function init(world) {
    W = world;
    const r = U.rng(4242);
    // people: two instanced meshes (body, head) for everyone
    let n = 0; for (const e of W.npcs) n += e.kind === 'walk' ? e.n : e.pts.length;
    n = Math.max(1, n);
    const bodyG = new THREE.CapsuleGeometry(0.28, 0.85, 3, 8); bodyG.translate(0, 0.72, 0);
    const headG = new THREE.SphereGeometry(0.21, 10, 8); headG.translate(0, 1.58, 0);
    people = new THREE.InstancedMesh(bodyG, toon('#ffffff', { noCache: true }), n); heads = new THREE.InstancedMesh(headG, toon('#ffffff', { noCache: true }), n);
    people.instanceMatrix.setUsage(THREE.DynamicDrawUsage); heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    people.frustumCulled = false; heads.frustumCulled = false;
    W.group.add(people, heads);
    let k = 0;
    for (const e of W.npcs) {
      const pal = STYLE[e.style] || STYLE.business;
      if (e.kind === 'walk') {
        const paths = e.paths.filter(p => p.length > 1);
        for (let i = 0; i < e.n && paths.length; i++) {
          const P = paths[Math.floor(r() * paths.length)];
          const segs = []; let len = 0; for (let j = 0; j < P.length - 1; j++) { const l = Math.hypot(P[j + 1][0] - P[j][0], P[j + 1][1] - P[j][1]); segs.push({ a: P[j], b: P[j + 1], l, s0: len }); len += l; }
          if (len < 5) continue;
          const w = { k: k++, segs, len, s: r() * len, dir: r() < 0.5 ? 1 : -1, sp: 1.0 + r() * 0.6, off: (r() - 0.5) * 2.2, x: 0, z: 0, y: 0, yaw: 0, t: r() * 9, dodge: 0 };
          people.setColorAt(w.k, _c.set(pal[Math.floor(r() * pal.length)])); heads.setColorAt(w.k, _c.set(SKIN[Math.floor(r() * SKIN.length)]));
          walkers.push(w);
        }
      } else {
        for (const pt of e.pts) {
          const s = { k: k++, x: pt[0], z: pt[1], yaw: pt[2] || 0, y: pt[3] ?? terrainAt(pt[0], pt[1]), t: r() * 9 };
          people.setColorAt(s.k, _c.set(pal[Math.floor(r() * pal.length)])); heads.setColorAt(s.k, _c.set(SKIN[Math.floor(r() * SKIN.length)]));
          standers.push(s);
        }
      }
    }
    for (let i = k; i < n; i++) { _m.makeScale(0, 0, 0); people.setMatrixAt(i, _m); heads.setMatrixAt(i, _m); }
    people.count = heads.count = n;
    if (people.instanceColor) people.instanceColor.needsUpdate = true; if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
    for (const s of standers) place(s.k, s.x, s.y, s.z, s.yaw, 0);
    // cars on the big roads: two lanes each way, U-turn at the ends
    const carCols = ['#c4523a', '#2f5f8a', '#e8b84a', '#f2efe6', '#3e8f86', '#2a2838', '#8a5a9e', '#d9779a'];
    for (const [key, n2] of [['boulevard', 8], ['avenue', 8], ['hill', 3]]) {
      const road = W.roads[key]; if (!road) continue;
      const P = road.pts; const segs = []; let len = 0; for (let j = 0; j < P.length - 1; j++) { const l = Math.hypot(P[j + 1][0] - P[j][0], P[j + 1][1] - P[j][1]); segs.push({ a: P[j], b: P[j + 1], l, s0: len }); len += l; }
      for (let i = 0; i < n2; i++) {
        const g = carMesh(carCols[(i * 3 + key.length) % carCols.length]); W.group.add(g);
        cars.push({ g, segs, len, s: (i / n2) * len * 2, v: key === 'hill' ? 7 : 10 + r() * 3, lane: key === 'hill' ? 2.6 : 3.2, x: 0, z: 0, y: 0, fx: 0, fz: 1, vx: 0, vz: 0, slope: 0 });
      }
    }
    // long boats on the canal: slow, low, you can ride on them (and fall off)
    const C = PLAN.canal;
    for (let i = 0; i < 4; i++) {
      const g = boatMesh(['#2f5f6a', '#8a3a2a', '#3a4a6a', '#5a6a3a'][i]); W.group.add(g);
      const route = i < 3 ? { a: [C.x0 + 40, C.z + (i % 2 ? 4 : -4)], b: [C.bendX - 30, C.z + (i % 2 ? 4 : -4)] } : { a: [C.bendX + (i % 2 ? 4 : -4), C.z + 40], b: [C.bendX + (i % 2 ? 4 : -4), shoreZ(C.bendX) - 30] };
      const len = Math.hypot(route.b[0] - route.a[0], route.b[1] - route.a[1]);
      boats.push({ g, route, len, s: (i * 0.37 % 1) * len, dir: i % 2 ? 1 : -1, v: 2.2, wait: 0, x: 0, z: 0, fx: 1, fz: 0, vx: 0, vz: 0, y: C.waterY + 0.75, hit: { tag: 'boat', vx: 0, vz: 0, boat: true } });
    }
    // sailboats on the lake, drifting
    for (let i = 0; i < 9; i++) { const g = sailMesh(r()); g.position.set(-900 + r() * 1700, 0, 1300 + r() * 500); g.userData = { a: r() * 6, sp: 0.05 + r() * 0.08, cx: g.position.x, cz: g.position.z, r: 30 + r() * 80 }; W.group.add(g); boats.push({ sail: g }); }
    // birds: flocks circling high, and pigeons on the plazas that scatter
    const birdG = new THREE.BufferGeometry(); birdG.setAttribute('position', new THREE.Float32BufferAttribute([-0.6, 0, -0.2, 0, 0, 0.2, 0, 0.05, -0.1, 0, 0.05, -0.1, 0, 0, 0.2, 0.6, 0, -0.2], 3)); birdG.computeVertexNormals();
    const flockDefs = [[-700, -400, 70, 12], [600, -900, 140, 9], [-300, 1150, 30, 14], [700, 800, 50, 10], [100, -300, 110, 8]];
    let nb = 0; for (const f of flockDefs) nb += f[3]; for (const p of (W.pigeonSpots || [])) nb += p[2];
    birdIM = new THREE.InstancedMesh(birdG, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: true }), nb);
    birdIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); birdIM.frustumCulled = false; W.group.add(birdIM);
    let bi = 0;
    // a stand-in object per bird (position/rotation/scale), written into the instanced mesh each frame
    const mk = (col) => { const o = new THREE.Object3D(); o.userData.i = bi; birdIM.setColorAt(bi, _c.set(col)); bi++; return o; };
    for (const [cx, cz, h, nB] of flockDefs) {
      const fl = { cx, cz, h, birds: [] };
      for (let i = 0; i < nB; i++) { const m = mk('#2a2a34'); m.scale.setScalar(1.6); fl.birds.push({ m, a: r() * 6, r: 30 + r() * 40, sp: 0.18 + r() * 0.1, dh: r() * 10, ph: r() * 6 }); }
      flocks.push(fl);
    }
    for (const [cx, cz, nP] of (W.pigeonSpots || [])) {
      for (let i = 0; i < nP; i++) { const m = mk('#6a6a7a'); const x = cx + (r() - 0.5) * 16, z = cz + (r() - 0.5) * 16; m.position.set(x, terrainAt(x, z) + 0.15, z); m.scale.setScalar(0.6); pigeons.push({ m, x, z, home: [x, z], fly: 0, vy: 0, a: r() * 6 }); }
    }
    if (birdIM.instanceColor) birdIM.instanceColor.needsUpdate = true;
    W.lifeGround = ground;
    const prev = W.groundExtra;
    W.groundExtra = (x, z, yMax, rr) => { const a = prev(x, z, yMax, rr), b = ground(x, z, yMax); return b && (!a || b.y > a.y) ? b : a; };
  }
  function place(k, x, y, z, yaw, bob) {
    _q.setFromAxisAngle(_v.set(0, 1, 0), yaw); _m.compose(_s.set(x, y + bob, z), _q, _v.set(1, 1, 1));
    people.setMatrixAt(k, _m); heads.setMatrixAt(k, _m);
  }
  function carMesh(c) {
    const parts = [
      [new THREE.BoxGeometry(1.9, 0.75, 4.1), T4(0, 0.7, 0), c],
      [new THREE.BoxGeometry(1.7, 0.65, 2.1), T4(0, 1.38, -0.2), c],
      [new THREE.BoxGeometry(1.74, 0.45, 1.92), T4(0, 1.38, -0.2), '#2a3550'],
      [new THREE.BoxGeometry(0.4, 0.2, 0.08), T4(-0.6, 0.78, 2.07), '#fff3c4'], [new THREE.BoxGeometry(0.4, 0.2, 0.08), T4(0.6, 0.78, 2.07), '#fff3c4'],
      [new THREE.BoxGeometry(0.4, 0.18, 0.08), T4(-0.6, 0.78, -2.07), '#ff3a3a'], [new THREE.BoxGeometry(0.4, 0.18, 0.08), T4(0.6, 0.78, -2.07), '#ff3a3a'],
    ];
    for (const [sx, sz] of [[-0.95, 1.25], [0.95, 1.25], [-0.95, -1.25], [0.95, -1.25]]) parts.push([new THREE.CylinderGeometry(0.33, 0.33, 0.22, 8), T4(sx, 0.33, sz, 0, 0, Math.PI / 2), '#1b1a24']);
    const g = new THREE.Group(); g.add(solid(parts, 0.05)); return g;
  }
  function boatMesh(c) {
    const parts = [
      [new THREE.BoxGeometry(2.6, 1.0, 15), T4(0, -0.2, 0), c],
      [new THREE.CylinderGeometry(1.3, 1.3, 1.0, 10, 1, false, 0, Math.PI), T4(0, -0.2, 7.5), c],
      [new THREE.BoxGeometry(2.3, 0.12, 15), T4(0, 0.32, 0), '#a0805a'],
      [new THREE.BoxGeometry(2.0, 1.2, 4.5), T4(0, 0.95, -3.5), '#e8dcc0'],
    ];
    for (let i = 0; i < 4; i++) parts.push([new THREE.CylinderGeometry(0.25, 0.3, 0.4, 8), T4(i % 2 ? 0.6 : -0.6, 0.55, 2 + i * 1.2), ['#c4523a', '#3e8f86', '#e8b84a', '#f2efe6'][i]]);
    const g = new THREE.Group(); g.add(solid(parts, 0.05)); return g;
  }
  function sailMesh(r) {
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.8, 0.5, 0, 8, 0.6, 0, 0.8, -2.6, 0, 0.8, 0.5, 0, 0.8, -2.6, 0, 8, 0.6], 3));
    const parts = [[new THREE.BoxGeometry(1.8, 0.7, 6), T4(0, 0.2, 0), '#f2efe6'], [new THREE.CylinderGeometry(0.06, 0.06, 8, 5), T4(0, 4.4, 0.6), '#c9c2b4'], [sg, null, r < 0.3 ? '#e4572e' : '#ffffff']];
    const g = new THREE.Group(); g.add(solid(parts, 0.04)); return g;
  }
  // stand on a long boat
  function ground(x, z, yMax) {
    let best = null;
    for (const b of boats) {
      if (!b.hit) continue;
      const dx = x - b.x, dz = z - b.z, al = dx * b.fx + dz * b.fz, lat = dx * -b.fz + dz * b.fx;
      if (Math.abs(al) > 7.4 || Math.abs(lat) > 1.2) continue;
      const y = b.y + (al < -1.2 && al > -5.8 ? 1.15 : 0);    // the cabin roof is higher
      if (y <= yMax && (!best || y > best.y)) best = { y, hit: b.hit };
    }
    return best;
  }
  function pathPos(segs, s, out) { let g = segs[0]; for (const q of segs) if (s >= q.s0 && s <= q.s0 + q.l) g = q; const t = U.clamp((s - g.s0) / g.l, 0, 1); out.x = U.lerp(g.a[0], g.b[0], t); out.z = U.lerp(g.a[1], g.b[1], t); out.fx = (g.b[0] - g.a[0]) / g.l; out.fz = (g.b[1] - g.a[1]) / g.l; return out; }
  const _pp = {};
  function update(dt, bi, focus) {
    if (!W) return;
    const fx = focus.x, fz = focus.z, pl = Game.player;
    // walkers (only the nearby ones move; far ones are hidden)
    let crowd = 0;
    for (const w of walkers) {
      const near = Math.abs(w.x - fx) < 260 && Math.abs(w.z - fz) < 260;
      if (!near && w.y) { if (!w.hidden) { _m.makeScale(0, 0, 0); people.setMatrixAt(w.k, _m); heads.setMatrixAt(w.k, _m); w.hidden = true; } w.s = (w.s + w.sp * dt * w.dir + w.len) % w.len; pathPos(w.segs, w.s, _pp); w.x = _pp.x; w.z = _pp.z; continue; }
      w.hidden = false; w.t += dt;
      w.s += w.sp * dt * w.dir; if (w.s > w.len) { w.s = w.len; w.dir = -1; } else if (w.s < 0) { w.s = 0; w.dir = 1; }
      pathPos(w.segs, w.s, _pp);
      // step aside when you come through
      const dxp = pl.pos.x - w.x, dzp = pl.pos.z - w.z, dp = Math.hypot(dxp, dzp);
      w.dodge = U.damp(w.dodge, dp < 3.2 ? (dxp * -_pp.fz + dzp * _pp.fx > 0 ? -1.8 : 1.8) : 0, 4, dt);
      const ox = -_pp.fz * (w.off + w.dodge), oz = _pp.fx * (w.off + w.dodge);
      w.x = _pp.x + ox; w.z = _pp.z + oz; w.y = terrainAt(w.x, w.z);
      w.yaw = Math.atan2(_pp.fx * w.dir, _pp.fz * w.dir);
      place(w.k, w.x, w.y, w.z, w.yaw, Math.abs(Math.sin(w.t * 6)) * 0.05);
      if (dp < 12) crowd++;
    }
    people.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    L.crowdNear = U.damp(L.crowdNear, Math.min(1, crowd / 8), 2, dt);
    // cars
    for (const c of cars) {
      // slow down behind you
      c.s = (c.s + c.v * dt) % (c.len * 2);
      const back = c.s > c.len, s = back ? c.len * 2 - c.s : c.s;
      pathPos(c.segs, s, _pp);
      const d = back ? -1 : 1, lx = -_pp.fz * d * c.lane, lz = _pp.fx * d * c.lane;
      c.x = _pp.x + lx; c.z = _pp.z + lz; c.fx = _pp.fx * d; c.fz = _pp.fz * d;
      const y = terrainAt(c.x, c.z), y2 = terrainAt(c.x + c.fx * 2, c.z + c.fz * 2);
      c.y = y; c.vx = c.fx * c.v; c.vz = c.fz * c.v;
      c.g.position.set(c.x, y, c.z); c.g.rotation.set(0, 0, 0); c.g.rotation.order = 'YXZ'; c.g.rotation.y = Math.atan2(c.fx, c.fz); c.g.rotation.x = -Math.atan2(y2 - y, 2);
      c.g.visible = Math.abs(c.x - fx) < 600 && Math.abs(c.z - fz) < 600;
    }
    // canal boats: glide, pause at the ends, turn around
    for (const b of boats) {
      if (b.sail) { const u = b.sail.userData; u.a += dt * u.sp * 0.2; b.sail.position.set(u.cx + Math.cos(u.a) * u.r, Math.sin(Game.t * 0.8 + u.a) * 0.15, u.cz + Math.sin(u.a) * u.r * 0.5); b.sail.rotation.y = -u.a + Math.PI; b.sail.rotation.z = Math.sin(Game.t * 0.6 + u.a) * 0.05; continue; }
      if (b.wait > 0) { b.wait -= dt; b.vx = b.vz = 0; }
      else { b.s += b.v * dt * b.dir; if (b.s > b.len) { b.s = b.len; b.dir = -1; b.wait = 6; } else if (b.s < 0) { b.s = 0; b.dir = 1; b.wait = 6; } }
      const ux = (b.route.b[0] - b.route.a[0]) / b.len, uz = (b.route.b[1] - b.route.a[1]) / b.len;
      b.x = b.route.a[0] + ux * b.s; b.z = b.route.a[1] + uz * b.s;
      b.fx = ux * b.dir; b.fz = uz * b.dir;
      if (!b.wait || b.wait <= 0) { b.vx = b.fx * b.v; b.vz = b.fz * b.v; }
      b.hit.vx = b.vx; b.hit.vz = b.vz;
      b.y = PLAN.canal.waterY + 0.75 + Math.sin(Game.t * 1.3 + b.s) * 0.04;
      b.g.position.set(b.x, b.y - 0.4, b.z); b.g.rotation.y = Math.atan2(b.fx, b.fz);
    }
    // flocks
    for (const fl of flocks) for (const b of fl.birds) {
      b.a += b.sp * dt; b.ph += dt * 9;
      b.m.position.set(fl.cx + Math.cos(b.a) * b.r, fl.h + b.dh + Math.sin(b.a * 2) * 4, fl.cz + Math.sin(b.a) * b.r);
      b.m.rotation.set(0, -b.a, 0); b.m.scale.y = 1 + Math.sin(b.ph) * 0.6;
    }
    // pigeons scatter as you come through, into a little run of notes
    for (const pg of pigeons) {
      const d = Math.hypot(pl.pos.x - pg.x, pl.pos.z - pg.z);
      if (pg.fly <= 0 && d < 5 && pl.speed > 3) { pg.fly = 5 + Math.random() * 3; pg.vy = 4 + Math.random() * 2; pg.a = Math.atan2(pg.x - pl.pos.x, pg.z - pl.pos.z) + (Math.random() - 0.5); if (Math.random() < 0.4) Sound.sfx.touch('bird', Math.floor(Math.random() * 5)); }
      if (pg.fly > 0) {
        pg.fly -= dt; pg.vy = Math.max(-1, pg.vy - dt * 1.2);
        pg.x += Math.sin(pg.a) * 6 * dt; pg.z += Math.cos(pg.a) * 6 * dt; pg.m.position.set(pg.x, pg.m.position.y + pg.vy * dt, pg.z); pg.m.scale.y = 0.6 + Math.sin(Game.t * 20) * 0.4;
        if (pg.fly <= 0) { pg.x = pg.home[0] + (Math.random() - 0.5) * 6; pg.z = pg.home[1] + (Math.random() - 0.5) * 6; pg.m.position.set(pg.x, terrainAt(pg.x, pg.z) + 0.15, pg.z); pg.m.scale.y = 0.6; }
      } else if (Math.random() < dt * 0.6) { pg.m.rotation.y = Math.random() * 6; }
    }
    for (const fl of flocks) for (const b of fl.birds) { b.m.updateMatrix(); birdIM.setMatrixAt(b.m.userData.i, b.m.matrix); }
    for (const pg of pigeons) { pg.m.updateMatrix(); birdIM.setMatrixAt(pg.m.userData.i, pg.m.matrix); }
    birdIM.instanceMatrix.needsUpdate = true;
  }
  // inside a car's body (cars are dangerous; boats are only slippery)
  function hits(p) {
    for (const c of cars) {
      if (!c.g.visible) continue;
      const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > 4 || Math.abs(dz) > 4) continue;
      const al = dx * c.fx + dz * c.fz, lat = dx * -c.fz + dz * c.fx;
      if (Math.abs(al) < 2.4 && Math.abs(lat) < 1.3 && p.y < c.y + 1.6) return { vx: c.vx, vz: c.vz };
    }
    return null;
  }
  return Object.assign(L, { init, update, hits });
})();
