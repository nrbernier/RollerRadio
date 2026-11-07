// ============================================================
//  FAUNA & LITTLE SCENES — deer in the clearings, rabbits on the
//  meadows, squirrels up the trunks, a heron at the pond, fireflies
//  at night; kites over the beach, a fish on the pier, a balloon
//  that gets away, a hat blowing down the promenade
// ============================================================
const Fauna = (() => {
  let W, deer = [], rabbits = [], squirrels = [], heron = null, flies = null, kites = [], kiteLines = null, fish = null, balloon = null, hat = null;
  const IM = {};
  const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = V3(), _s = V3(), _e = new THREE.Euler(), _c = new THREE.Color();
  const Y = V3(0, 1, 0);
  const mkIM = (geo, n, mat) => { const im = new THREE.InstancedMesh(geo, mat || toon('#ffffff', { noCache: true }), Math.max(1, n)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.setColorAt(0, _c.set('#ffffff')); W.group.add(im); return im; };
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);

  function init(world) {
    W = world;
    const r = U.rng(9090);
    // ---- deer: a body with legs, and a neck+head that dips to graze ----
    const body = mergeParts([
      [new THREE.BoxGeometry(0.42, 0.5, 1.15), T4(0, 1.05, 0), '#ffffff'],
      ...[[-0.14, 0.42], [0.14, 0.42], [-0.14, -0.42], [0.14, -0.42]].map(([x, z]) => [new THREE.BoxGeometry(0.08, 0.85, 0.08), T4(x, 0.42, z), '#ffffff']),
      [new THREE.BoxGeometry(0.12, 0.16, 0.08), T4(0, 1.2, -0.6, 0.5, 0, 0), '#ffffff'],
    ]);
    const neck = mergeParts([
      [new THREE.BoxGeometry(0.16, 0.6, 0.18), T4(0, 0.28, 0.06, 0.35, 0, 0), '#ffffff'],
      [new THREE.BoxGeometry(0.2, 0.2, 0.42), T4(0, 0.6, 0.24), '#ffffff'],
      [new THREE.BoxGeometry(0.05, 0.16, 0.08), T4(-0.1, 0.76, 0.1, 0, 0, 0.4), '#ffffff'], [new THREE.BoxGeometry(0.05, 0.16, 0.08), T4(0.1, 0.76, 0.1, 0, 0, -0.4), '#ffffff'],
    ]);
    const herds = [[-860, -560], [-700, -60], [-560, -1300], [-440, -1000], [-150, -1250], [300, -1420], [-950, -1250]];
    for (const [hx, hz] of herds) { const n = 2 + Math.floor(r() * 3); for (let i = 0; i < n; i++) deer.push({ hx, hz, x: hx + (r() - 0.5) * 20, z: hz + (r() - 0.5) * 20, yaw: r() * 6, st: 'graze', t: r() * 5, sp: 0, head: 0, col: pick(r, ['#9a6a42', '#8a5a3a', '#a87a4a']), sc: 0.8 + r() * 0.35 }); }
    IM.deerB = mkIM(body, deer.length); IM.deerN = mkIM(neck, deer.length);
    deer.forEach((d, i) => { IM.deerB.setColorAt(i, _c.set(d.col)); IM.deerN.setColorAt(i, _c); });
    // ---- rabbits ----
    const rab = mergeParts([[new THREE.SphereGeometry(0.16, 6, 5), new THREE.Matrix4().makeScale(1, 0.85, 1.3).setPosition(0, 0.15, 0), '#ffffff'], [new THREE.SphereGeometry(0.1, 5, 4), T4(0, 0.28, 0.17), '#ffffff'], [new THREE.BoxGeometry(0.04, 0.16, 0.05), T4(-0.04, 0.42, 0.14, -0.2, 0, 0), '#ffffff'], [new THREE.BoxGeometry(0.04, 0.16, 0.05), T4(0.04, 0.42, 0.14, -0.2, 0, 0), '#ffffff'], [new THREE.SphereGeometry(0.06, 4, 3), T4(0, 0.2, -0.2), '#ffffff']]);
    const meadows = [[150, -1300, 200], [-400, 1000, 300], [-850, 260, 120], [-680, -460, 50], [700, -1380, 120]];
    for (let i = 0; i < 46; i++) { const [mx, mz, mr] = meadows[i % meadows.length], a = r() * 6.28, dd = Math.sqrt(r()) * mr; rabbits.push({ hx: mx + Math.cos(a) * dd, hz: mz + Math.sin(a) * dd, x: 0, z: 0, yaw: r() * 6, hop: 0, flee: 0, t: r() * 9, col: pick(r, ['#8a7a6a', '#a89a8a', '#6a5a4a', '#e8e2d4']) }); }
    for (const b of rabbits) { b.x = b.hx; b.z = b.hz; }
    IM.rab = mkIM(rab, rabbits.length); rabbits.forEach((b, i) => IM.rab.setColorAt(i, _c.set(b.col)));
    // ---- squirrels on the park's trees ----
    const sq = mergeParts([[new THREE.BoxGeometry(0.1, 0.12, 0.22), T4(0, 0.08, 0), '#ffffff'], [new THREE.SphereGeometry(0.06, 4, 3), T4(0, 0.15, 0.12), '#ffffff'], [new THREE.BoxGeometry(0.1, 0.26, 0.08), T4(0, 0.2, -0.14, -0.5, 0, 0), '#ffffff']]);
    const trees = (W.treeList || []).filter(t => t[0] < -280 && t[2] < 150);
    for (let i = 0; i < 28 && trees.length; i++) { const t = trees[Math.floor(r() * trees.length)]; squirrels.push({ tx: t[0], ty: t[1], tz: t[2], th: t[3], a: r() * 6, x: t[0], y: t[1], z: t[2], st: 'ground', t: r() * 9, yaw: 0 }); }
    IM.sq = mkIM(sq, squirrels.length); squirrels.forEach((s, i) => IM.sq.setColorAt(i, _c.set('#a0522d')));
    // ---- a heron at the pond ----
    const P = PLAN.pond;
    if (W.pond) {
      const hb = solid([
        [new THREE.BoxGeometry(0.3, 0.32, 0.7), T4(0, 1.05, 0, -0.3, 0, 0), '#9aa0a8'], [new THREE.BoxGeometry(0.08, 0.6, 0.08), T4(0, 1.45, 0.32, 0.25, 0, 0), '#c9ccd2'],
        [new THREE.BoxGeometry(0.12, 0.12, 0.2), T4(0, 1.78, 0.42), '#f2efe6'], [new THREE.ConeGeometry(0.035, 0.3, 4), T4(0, 1.78, 0.66, Math.PI / 2, 0, 0), '#e8b84a'],
        [new THREE.BoxGeometry(0.03, 0.85, 0.03), T4(-0.06, 0.45, 0), '#c9a24a'], [new THREE.BoxGeometry(0.03, 0.85, 0.03), T4(0.06, 0.45, 0), '#c9a24a'],
      ], 0.03);
      const wings = solid([[new THREE.BoxGeometry(1.0, 0.03, 0.45), T4(-0.6, 1.12, 0), '#7a808a'], [new THREE.BoxGeometry(1.0, 0.03, 0.45), T4(0.6, 1.12, 0), '#7a808a']], 0.02);
      const g = new THREE.Group(); g.add(hb, wings); W.group.add(g);
      const a = 0.4; heron = { g, wings, x: P.x + Math.cos(a) * P.r * 0.82, z: P.z + Math.sin(a) * P.r * 0.82, y: W.pond.y - 0.2, st: 'stand', t: 0, from: null, to: null, a };
    }
    // ---- fireflies: points that glow at night over the clearings, the pond and the lawn ----
    const nF = 360, fp = new Float32Array(nF * 3), fc = new Float32Array(nF * 3), base = [];
    const fz = [[P.x, P.z, P.r + 30], [-760, -100, 40], [-900, -888, 46], [-660, -510, 60], [-400, 980, 260], [-560, -1300, 50], [-850, 260, 120]];
    for (let i = 0; i < nF; i++) { const [cx, cz, cr] = fz[i % fz.length], a = r() * 6.28, dd = Math.sqrt(r()) * cr, x = cx + Math.cos(a) * dd, z = cz + Math.sin(a) * dd; base.push([x, terrainAt(x, z) + 0.6 + r() * 2.2, z, r() * 9, 0.3 + r() * 0.7]); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('color', new THREE.BufferAttribute(fc, 3));
    const dot = canvasTex(32, 32, (x, w, h) => { const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }).tex;
    flies = new THREE.Points(fg, new THREE.PointsMaterial({ map: dot, size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    flies.frustumCulled = false; flies.userData.base = base; W.group.add(flies);
    // ---- kites over the beach, held by kids ----
    const kg = new THREE.BufferGeometry();
    kg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.9, 0, -0.6, 0, 0, 0, -1.1, 0, 0, 0.9, 0, 0, -1.1, 0, 0.6, 0, 0, 0, -1.1, 0, -0.08, -2.6, 0, 0.08, -2.6, 0], 3)); kg.computeVertexNormals();
    IM.kite = mkIM(kg, 4, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: true }));
    const kitePos = [[-780, 'lake'], [-360, 'lake'], [-60, 'lake'], [160, 'lake']];
    kitePos.forEach(([kx], i) => { const kz = shoreZ(kx) - 20, y = terrainAt(kx, kz); kites.push({ hx: kx, hz: kz, hy: y + 1.1, ph: r() * 6, col: ['#e4572e', '#f2c14e', '#2f8f9d', '#d9779a'][i] }); IM.kite.setColorAt(i, _c.set(kites[i].col)); W.npcs.push({ kind: 'stand', pts: [[kx, kz, 0, y]], style: 'lake', kids: true }); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(kites.length * 6), 3));
    kiteLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x3a3550, transparent: true, opacity: 0.6 })); kiteLines.frustumCulled = false; W.group.add(kiteLines);
    // ---- a fisherman at the end of the pier; now and then a fish ----
    const fx = -480 + 2.0, fzP = 1585 - 9;
    W.npcs.push({ kind: 'stand', pts: [[fx - 0.6, fzP, Math.PI / 2, 2.7]], style: 'lake' });
    W.fisher = { x: fx - 0.6, z: fzP };
    const rod = solid([[new THREE.CylinderGeometry(0.02, 0.03, 3.2, 4), T4(0, 0, 0), '#3a3550']], 0.0);
    rod.position.set(fx + 0.6, 2.7 + 2.3, fzP); rod.rotation.z = -0.9; W.group.add(rod);
    const tip = V3(fx + 0.6 + Math.sin(0.9) * 1.6, 2.7 + 2.3 + Math.cos(0.9) * 1.6, fzP);
    const fl = new THREE.BufferGeometry(); fl.setAttribute('position', new THREE.Float32BufferAttribute([tip.x, tip.y, tip.z, tip.x + 1.2, 0.1, fzP], 3));
    W.group.add(new THREE.LineSegments(fl, new THREE.LineBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.6 })));
    const fishM = solid([[new THREE.SphereGeometry(0.18, 6, 4), new THREE.Matrix4().makeScale(1.6, 0.8, 0.5), '#ff8a3a'], [new THREE.ConeGeometry(0.12, 0.2, 4), T4(-0.32, 0, 0, 0, 0, Math.PI / 2), '#ff8a3a']], 0.02);
    fishM.visible = false; W.group.add(fishM);
    fish = { m: fishM, tip, water: V3(tip.x + 1.2, 0.1, fzP), t: 0, next: 20 + r() * 20 };
    // ---- a balloon that gets away in the market ----
    const bm = solid([[new THREE.SphereGeometry(0.35, 10, 8), new THREE.Matrix4().makeScale(1, 1.15, 1), '#e4572e'], [new THREE.CylinderGeometry(0.006, 0.006, 1.2, 3), T4(0, -0.95, 0), '#3a3550']], 0.03);
    bm.visible = false; W.group.add(bm);
    balloon = { m: bm, x: 760, z: -150, t: 0, next: 15, on: false };
    // ---- a hat blowing down the lakeshore promenade, and its owner running after it ----
    const hm = solid([[new THREE.CylinderGeometry(0.17, 0.19, 0.16, 10), T4(0, 0.1, 0), '#3a3550'], [new THREE.CylinderGeometry(0.3, 0.3, 0.02, 12), T4(0, 0.02, 0), '#3a3550'], [new THREE.CylinderGeometry(0.175, 0.175, 0.04, 10), T4(0, 0.08, 0), '#c4523a']], 0.03);
    W.group.add(hm);
    hat = { m: hm, x0: -900, x1: -560, s: 0, st: 'blow', t: 0 };
    W.hatChase = hat;
    // ---- the carousel: a turning deck you can ride, horses rising and falling ----
    const cr = W.carousel;
    if (cr) {
      const parts = [
        [new THREE.CylinderGeometry(cr.R, cr.R, 0.3, 28), T4(0, 0.15, 0), '#e8dcc0'], [new THREE.CylinderGeometry(cr.R + 0.05, cr.R + 0.05, 0.12, 28), T4(0, 0.31, 0), '#c4523a'],
        [new THREE.CylinderGeometry(0.7, 0.9, 4.4, 10), T4(0, 2.5, 0), '#f2c14e'],
        [new THREE.ConeGeometry(cr.R + 0.6, 2.4, 16), T4(0, 5.9, 0), '#c4523a'], [new THREE.CylinderGeometry(cr.R + 0.6, cr.R + 0.6, 0.6, 16), T4(0, 4.5, 0), '#f2efe6'],
        [new THREE.SphereGeometry(0.4, 8, 6), T4(0, 7.3, 0), '#f2c14e'],
      ];
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = i % 2 ? 3.6 : 5.6; parts.push([new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), T4(Math.cos(a) * rr, 2.4, Math.sin(a) * rr), '#e9e4f5']); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; parts.push([new THREE.BoxGeometry(2.6, 0.6, 0.06), T4(Math.cos(a) * (cr.R + 0.62), 4.5, Math.sin(a) * (cr.R + 0.62), 0, -a + Math.PI / 2, 0), i % 2 ? '#c4523a' : '#f2c14e']); }
      const rot = solid(parts, 0.05); rot.position.set(cr.x, cr.y, cr.z); W.group.add(rot);
      // bulbs round the canopy (they glow at night)
      const bl = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; bl.push([new THREE.SphereGeometry(0.12, 5, 4), T4(Math.cos(a) * (cr.R + 0.7), 4.2, Math.sin(a) * (cr.R + 0.7)), i % 2 ? '#ffe9b0' : '#ffd0a0']); }
      rot.add(new THREE.Mesh(mergeParts(bl), W.mats.lamp));
      const horse = mergeParts([
        [new THREE.BoxGeometry(0.34, 0.5, 1.1), T4(0, 0, 0), '#ffffff'], [new THREE.BoxGeometry(0.2, 0.6, 0.22), T4(0, 0.4, 0.45, 0.5, 0, 0), '#ffffff'], [new THREE.BoxGeometry(0.22, 0.24, 0.46), T4(0, 0.7, 0.66), '#ffffff'],
        ...[[-0.11, 0.38], [0.11, 0.38], [-0.11, -0.38], [0.11, -0.38]].map(([hx, hz]) => [new THREE.BoxGeometry(0.08, 0.55, 0.08), T4(hx, -0.45, hz, hz > 0 ? -0.5 : 0.5, 0, 0), '#ffffff']),
        [new THREE.BoxGeometry(0.36, 0.08, 0.5), T4(0, 0.27, -0.05), '#c4523a'],
      ]);
      IM.horse = mkIM(horse, 12);
      for (let i = 0; i < 12; i++) IM.horse.setColorAt(i, _c.set(['#f2efe6', '#e8c070', '#c9d2dc', '#f2efe6', '#d9a0a0', '#b8d0b0'][i % 6]));
      cr.rot = rot; cr.hit = { vx: 0, vz: 0, carousel: true };
      const prev = W.groundExtra;
      W.groundExtra = (x, z, yMax, rr2) => {
        const a2 = prev(x, z, yMax, rr2), dx = x - cr.x, dz = z - cr.z, top = cr.y + 0.32;
        if (dx * dx + dz * dz < cr.R * cr.R && top <= yMax && (!a2 || top > a2.y)) { cr.hit.vx = cr.w * dz; cr.hit.vz = -cr.w * dx; return { y: top, hit: cr.hit }; }
        return a2;
      };
    }
  }

  function update(dt, bi, focus) {
    if (!W) return;
    const pl = Game.player, px = pl.pos.x, pz = pl.pos.z, sp = pl.speed, t = Game.t, night = Sky.night;
    // deer
    let k = 0;
    for (const d of deer) {
      const i = k++, near = Math.abs(d.x - focus.x) < 260 && Math.abs(d.z - focus.z) < 260;
      if (!near) { IM.deerB.setMatrixAt(i, zero); IM.deerN.setMatrixAt(i, zero); continue; }
      d.t += dt;
      const dx = d.x - px, dz = d.z - pz, dist = Math.hypot(dx, dz);
      if (d.st !== 'flee' && (dist < 13 || (dist < 22 && sp > 6))) { d.st = 'flee'; d.t = 0; d.yaw = Math.atan2(dx, dz) + (Math.random() - 0.5) * 0.6; if (t > (Fauna.deerCD || 0)) { Sound.sfx.touch('deer'); Fauna.deerCD = t + 3; } }
      else if (d.st === 'graze' && dist < 26) { d.st = 'alert'; d.t = 0; }
      else if (d.st === 'alert' && dist > 32) { d.st = 'graze'; }
      if (d.st === 'flee') { d.sp = U.damp(d.sp, 9, 4, dt); if (d.t > 3.5) { d.st = 'graze'; } }
      else if (d.st === 'graze') { d.sp = U.damp(d.sp, Math.sin(d.t * 0.3) > 0.6 ? 0.4 : 0, 2, dt); if (Math.random() < dt * 0.1) d.yaw += (Math.random() - 0.5) * 1.5; const hd = Math.hypot(d.x - d.hx, d.z - d.hz); if (hd > 45) d.yaw = Math.atan2(d.hx - d.x, d.hz - d.z); }
      else { d.sp = U.damp(d.sp, 0, 4, dt); d.yaw = U.lerp(d.yaw, Math.atan2(-dx, -dz), 0.03); }
      const nx = d.x + Math.sin(d.yaw) * d.sp * dt, nz = d.z + Math.cos(d.yaw) * d.sp * dt;
      if (!inCanal(nx, nz) && Math.abs(nx) < 1080) { d.x = nx; d.z = nz; } else d.yaw += Math.PI;
      const y = terrainAt(d.x, d.z) + (d.st === 'flee' ? Math.abs(Math.sin(d.t * 7)) * 0.5 : 0);
      d.head = U.damp(d.head, d.st === 'graze' && d.sp < 0.2 ? 1 : 0, 3, dt);
      _q.setFromAxisAngle(Y, d.yaw); _m.compose(_v.set(d.x, y, d.z), _q, _s.setScalar(d.sc)); IM.deerB.setMatrixAt(i, _m);
      _e.set(d.head * 1.25, 0, 0); _m2.makeRotationFromEuler(_e).setPosition(0, 1.25, 0.5); IM.deerN.setMatrixAt(i, _m.multiply(_m2));
    }
    IM.deerB.instanceMatrix.needsUpdate = true; IM.deerN.instanceMatrix.needsUpdate = true;
    // rabbits
    k = 0;
    for (const b of rabbits) {
      const i = k++;
      if (Math.abs(b.x - focus.x) > 200 || Math.abs(b.z - focus.z) > 200) { IM.rab.setMatrixAt(i, zero); continue; }
      b.t += dt;
      const dx = b.x - px, dz = b.z - pz, dist = Math.hypot(dx, dz);
      if (dist < 8 && b.flee <= 0) { b.flee = 1.6; b.yaw = Math.atan2(dx, dz) + (Math.random() - 0.5); }
      let v = 0;
      if (b.flee > 0) { b.flee -= dt; v = 4.5; } else if (Math.random() < dt * 0.25) { b.hop = 0.5; b.yaw += (Math.random() - 0.5) * 2; }
      if (b.hop > 0) { b.hop -= dt; v = 1.4; }
      if (Math.hypot(b.x - b.hx, b.z - b.hz) > 30 && b.flee <= 0) { b.yaw = Math.atan2(b.hx - b.x, b.hz - b.z); v = 1.4; }
      b.x += Math.sin(b.yaw) * v * dt; b.z += Math.cos(b.yaw) * v * dt;
      const y = terrainAt(b.x, b.z) + (v > 0 ? Math.abs(Math.sin(b.t * 11)) * 0.22 : 0);
      _q.setFromAxisAngle(Y, b.yaw); _m.compose(_v.set(b.x, y, b.z), _q, _s.setScalar(1)); IM.rab.setMatrixAt(i, _m);
    }
    IM.rab.instanceMatrix.needsUpdate = true;
    // squirrels: dart to the trunk and up it when you come by; back down a while later
    k = 0;
    for (const s of squirrels) {
      const i = k++;
      if (Math.abs(s.tx - focus.x) > 160 || Math.abs(s.tz - focus.z) > 160) { IM.sq.setMatrixAt(i, zero); continue; }
      s.t += dt;
      const dist = Math.hypot(s.x - px, s.z - pz);
      if (s.st === 'ground') {
        if (dist < 10) { s.st = 'climb'; s.t = 0; }
        s.a += dt * (Math.sin(s.t * 0.7) > 0.3 ? 1.6 : 0); const rr = 1.5 + Math.sin(s.t * 0.4) * 0.8;
        s.x = s.tx + Math.cos(s.a) * rr; s.z = s.tz + Math.sin(s.a) * rr; s.y = s.ty + Math.abs(Math.sin(s.t * 9)) * 0.06 * (Math.sin(s.t * 0.7) > 0.3 ? 1 : 0); s.yaw = s.a + Math.PI;
      } else if (s.st === 'climb') {
        s.x = U.damp(s.x, s.tx + 0.42, 10, dt); s.z = U.damp(s.z, s.tz, 10, dt); s.y += dt * 3.2; s.yaw = -Math.PI / 2;
        if (s.y > s.ty + s.th) { s.st = 'hide'; s.t = 0; }
      } else if (s.t > 18 && dist > 20) { s.st = 'ground'; s.y = s.ty; }
      if (s.st === 'hide') { IM.sq.setMatrixAt(i, zero); continue; }
      _e.set(s.st === 'climb' ? -Math.PI / 2 : 0, s.yaw, 0, 'YXZ'); _q.setFromEuler(_e); _m.compose(_v.set(s.x, s.y, s.z), _q, _s.setScalar(1.2)); IM.sq.setMatrixAt(i, _m);
      _e.order = 'XYZ';
    }
    IM.sq.instanceMatrix.needsUpdate = true;
    // the heron: lifts off when you come close and glides to the far side of the pond
    if (heron) {
      const h = heron, P = PLAN.pond;
      if (h.st === 'stand' && Math.hypot(h.x - px, h.z - pz) < 14) { h.st = 'fly'; h.t = 0; h.from = [h.x, h.z]; h.a += Math.PI * (0.7 + Math.random() * 0.6); h.to = [P.x + Math.cos(h.a) * P.r * 0.82, P.z + Math.sin(h.a) * P.r * 0.82]; Sound.sfx.touch('heron'); }
      if (h.st === 'fly') {
        h.t += dt; const u = Math.min(1, h.t / 7);
        h.x = U.lerp(h.from[0], h.to[0], u); h.z = U.lerp(h.from[1], h.to[1], u);
        h.g.position.set(h.x, h.y + Math.sin(u * Math.PI) * 9, h.z); h.g.rotation.y = Math.atan2(h.to[0] - h.from[0], h.to[1] - h.from[1]);
        h.wings.scale.y = 1; h.wings.rotation.z = 0; h.wings.children; h.wings.position.y = Math.sin(t * 5) * 0.25; h.wings.scale.x = 1 + Math.sin(t * 5) * 0.1;
        if (u >= 1) h.st = 'stand';
      } else { h.g.position.set(h.x, h.y, h.z); h.wings.position.y = -0.35; h.wings.scale.x = 0.25; }
    }
    // fireflies
    if (flies) {
      flies.visible = night > 0.25;
      if (flies.visible) {
        const pos = flies.geometry.attributes.position.array, col = flies.geometry.attributes.color.array, base = flies.userData.base;
        for (let i = 0; i < base.length; i++) {
          const b = base[i], ph = t * 0.4 + b[3];
          pos[i * 3] = b[0] + Math.sin(ph * 1.3) * 1.5; pos[i * 3 + 1] = b[1] + Math.sin(ph * 0.9) * 0.6; pos[i * 3 + 2] = b[2] + Math.cos(ph * 1.1) * 1.5;
          const blink = Math.max(0, Math.sin(t * (1.5 + b[4]) + b[3] * 3)) ** 3 * night * b[4];
          col[i * 3] = 0.85 * blink; col[i * 3 + 1] = 1.0 * blink; col[i * 3 + 2] = 0.35 * blink;
        }
        flies.geometry.attributes.position.needsUpdate = true; flies.geometry.attributes.color.needsUpdate = true;
      }
    }
    // kites
    const la = kiteLines.geometry.attributes.position.array;
    kites.forEach((kt, i) => {
      const sw = Math.sin(t * 0.5 + kt.ph), x = kt.hx + sw * 6, y = kt.hy + 24 + Math.sin(t * 0.7 + kt.ph) * 2.5, z = kt.hz + 18;
      _e.set(-0.4, Math.PI, sw * 0.4); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.setScalar(1.4)); IM.kite.setMatrixAt(i, _m);
      la.set([kt.hx + 0.3, kt.hy + 0.2, kt.hz + 0.2, x, y - 1.2, z], i * 6);
    });
    IM.kite.instanceMatrix.needsUpdate = true; kiteLines.geometry.attributes.position.needsUpdate = true;
    // the fish
    if (fish) {
      fish.t += dt;
      if (!fish.m.visible && fish.t > fish.next) { fish.m.visible = true; fish.t = 0; if (Math.hypot(W.fisher.x - px, W.fisher.z - pz) < 60) Sound.sfx.touch('catch'); }
      if (fish.m.visible) { const u = Math.min(1, fish.t / 1.6); fish.m.position.lerpVectors(fish.water, fish.tip, u).y += Math.sin(u * Math.PI) * 1.2 - 0.4; fish.m.rotation.z = Math.sin(t * 20) * 0.5; if (fish.t > 4) { fish.m.visible = false; fish.t = 0; fish.next = 25 + Math.random() * 30; } }
    }
    // the balloon
    if (balloon) {
      const b = balloon; b.t += dt;
      if (!b.on && b.t > b.next) { b.on = true; b.t = 0; b.m.visible = true; }
      if (b.on) { b.m.position.set(b.x + Math.sin(b.t * 0.6) * 1.5 + b.t * 0.4, terrainAt(b.x, b.z) + 1.4 + b.t * 1.4, b.z + Math.cos(b.t * 0.5) * 1.2); b.m.rotation.z = Math.sin(b.t) * 0.15; if (b.t > 70) { b.on = false; b.m.visible = false; b.t = 0; b.next = 40 + Math.random() * 30; } }
    }
    // the carousel turns; its horses rise and fall
    const cr = W.carousel;
    if (cr && cr.rot) {
      cr.a += cr.w * dt; cr.rot.rotation.y = cr.a;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 - cr.a, rr = i % 2 ? 3.6 : 5.6, x = cr.x + Math.cos(a) * rr, z = cr.z + Math.sin(a) * rr;
        _q.setFromAxisAngle(Y, Math.PI - i / 12 * Math.PI * 2 + cr.a); _m.compose(_v.set(x, cr.y + 1.6 + Math.sin(t * 2.2 + i * 1.3) * 0.35, z), _q, _s.setScalar(1)); IM.horse.setMatrixAt(i, _m);
      }
      IM.horse.instanceMatrix.needsUpdate = true;
    }
    // the hat (its owner is a walker scripted in Life)
    if (hat) {
      const h = hat; h.t += dt;
      if (h.st === 'blow') { h.s += dt * (3.2 + Math.sin(h.t * 3) * 1.2); if (h.s > h.x1 - h.x0) { h.st = 'rest'; h.t = 0; } }
      else if (h.st === 'rest' && h.t > 6) { h.st = 'carried'; h.t = 0; }
      else if (h.st === 'carried' && h.t > 2) { h.st = 'walkback'; h.t = 0; }
      else if (h.st === 'walkback') { h.s -= dt * 1.3; if (h.s <= 0) { h.s = 0; h.st = 'wait'; h.t = 0; } }
      else if (h.st === 'wait' && h.t > 10) { h.st = 'blow'; h.t = 0; }
      const x = h.x0 + h.s, z = shoreZ(x) - 34 - 2;
      h.z = z; h.x = x;
      if (h.st === 'blow') { h.m.position.set(x, terrainAt(x, z) + 0.3 + Math.abs(Math.sin(h.t * 6)) * 0.6, z); h.m.rotation.set(Math.sin(h.t * 7) * 0.8, h.t * 4, Math.cos(h.t * 5) * 0.6); h.m.visible = true; }
      else if (h.st === 'rest') { h.m.position.set(x, terrainAt(x, z) + 0.03, z); h.m.rotation.set(0, 0, 0); h.m.visible = true; }
      else h.m.visible = false;
    }
  }
  return { init, update, get deer() { return deer; }, get rabbits() { return rabbits; }, get heron() { return heron; }, get kites() { return kites; } };
})();
