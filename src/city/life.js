// ============================================================
//  LIFE — people, cars, boats, birds
// ============================================================
const Life = (() => {
  let W, cars = [], boats = [], flocks = [], pigeons = [], ducks = [], gulls = [];
  let birdIM, duckIM, dogIM;
  const walkers = [], standers = [], all = [], dogs = [], actors = [];
  const L = { crowdNear: 0 };
  const STYLE = {
    business: ['#2a2f45', '#3e4a6a', '#6a6a72', '#1f2433', '#8a5a4a', '#c9c2b4', '#2f5f8a', '#e8e2d4', '#7a2f3a'],
    park: ['#6f8a5a', '#b8743a', '#d9a441', '#7a6a9a', '#4a6a8a', '#c4523a', '#e8dcc0'],
    market: ['#e8b84a', '#c4523a', '#3e8f86', '#d9779a', '#f2efe6', '#8a5a9e', '#2f8f9d', '#e4572e'],
    canals: ['#5a7a8a', '#9a6a4a', '#d9c9a8', '#3a4a5a', '#a03a3a', '#e8dcc0', '#4a6a5a'],
    oldtown: ['#c46a4a', '#e8d4a0', '#6a8aa0', '#a0a07a', '#7a4a6a', '#f2efe6'],
    lake: ['#f2efe6', '#4aa0c8', '#e88a6a', '#e8c84a', '#2f8f9d', '#e4572e', '#ffffff'],
    docks: ['#ff8a3a', '#3a4a5a', '#e8c84a', '#5a5a62', '#2f5f8a'],
    obs: ['#7a6a9a', '#3a4a6a', '#c9c2b4', '#5a6a4a', '#b8743a'],
  };
  const PANTS = ['#2a2f45', '#3a3a42', '#4a5a7a', '#6a5a4a', '#1f1f28', '#c9c2b4', '#5a4a3a', '#2f4a6a'];
  const SKIN = ['#f0c8a0', '#d9a07a', '#a8704a', '#7a4a32', '#e8b890', '#c68c5a'];
  const HAIR = ['#1f1a18', '#3a2a20', '#5a3a24', '#8a5a30', '#c8a060', '#9a9a9a', '#2a1f1a', '#7a2f1f', '#e8e2d4'];
  const HATS = ['#c4523a', '#2f5f8a', '#e8c84a', '#3e8f86', '#f2efe6'];
  const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color(), _v = V3(), _s = V3(), _e = new THREE.Euler();
  const Y = V3(0, 1, 0);

  // ---------- people: six instanced meshes (torso+arms, two legs, bent legs, head, hair) ----------
  // everyone near the camera is packed into the first slots each frame, so far people cost nothing
  const PM = {};
  function personMeshes(n) {
    const merge = (parts) => mergeParts(parts.map(([g, m]) => [g, m, '#ffffff']));
    const torso = merge([
      [new THREE.CylinderGeometry(0.2, 0.25, 0.62, 8), T4(0, 1.12, 0)],
      [new THREE.SphereGeometry(0.235, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeScale(1, 0.55, 0.8).setPosition(0, 1.42, 0)],
    ]);
    // an arm hangs from the shoulder (pivot at the origin); the hand is skin-ish at the end
    const arm = merge([[new THREE.CylinderGeometry(0.065, 0.055, 0.56, 5), T4(0, -0.28, 0)], [new THREE.SphereGeometry(0.06, 5, 4), T4(0, -0.6, 0)]]);
    // props in hand: a phone, a tour guide's flag on a pole
    const phone = merge([[new THREE.BoxGeometry(0.08, 0.15, 0.02), T4(0, -0.64, 0.04)]]);
    const head = merge([[new THREE.SphereGeometry(0.17, 10, 8), T4(0, 1.66, 0)], [new THREE.CylinderGeometry(0.07, 0.08, 0.14, 6), T4(0, 1.5, 0)]]);
    const hair = merge([[new THREE.SphereGeometry(0.182, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.Matrix4().makeScale(1, 0.92, 1.05).setPosition(0, 1.67, -0.015)]]);
    // a leg hangs from the hip (pivot at the origin)
    const leg = merge([[new THREE.CylinderGeometry(0.085, 0.068, 0.8, 6), T4(0, -0.4, 0)], [new THREE.BoxGeometry(0.13, 0.08, 0.24), T4(0, -0.78, 0.05)]]);
    // sitting: thighs forward, shins down (both legs)
    const sit = merge([
      [new THREE.CylinderGeometry(0.09, 0.08, 0.44, 6), T4(-0.11, 0, 0.2, Math.PI / 2, 0, 0)], [new THREE.CylinderGeometry(0.09, 0.08, 0.44, 6), T4(0.11, 0, 0.2, Math.PI / 2, 0, 0)],
      [new THREE.CylinderGeometry(0.075, 0.065, 0.46, 6), T4(-0.11, -0.22, 0.43)], [new THREE.CylinderGeometry(0.075, 0.065, 0.46, 6), T4(0.11, -0.22, 0.43)],
      [new THREE.BoxGeometry(0.13, 0.08, 0.24), T4(-0.11, -0.43, 0.49)], [new THREE.BoxGeometry(0.13, 0.08, 0.24), T4(0.11, -0.43, 0.49)],
    ]);
    const mk = (g, cnt = n) => { const im = new THREE.InstancedMesh(g, toon('#ffffff', { noCache: true }), cnt); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; im.setColorAt(0, _c.set('#ffffff')); W.group.add(im); return im; };
    PM.torso = mk(torso); PM.legL = mk(leg); PM.legR = mk(leg); PM.head = mk(head); PM.hair = mk(hair); PM.sit = mk(sit);
    PM.armL = mk(arm); PM.armR = mk(arm); PM.prop = mk(phone);
    const flag = mergeParts([[new THREE.CylinderGeometry(0.02, 0.02, 1.7, 4), T4(0, -0.2, 0), '#3a3550'], [new THREE.BoxGeometry(0.02, 0.32, 0.48), T4(0, 0.5, 0.25), '#ffffff']]);
    PM.flag = mk(flag, 8);
  }
  function person(style, r, o = {}) {
    const pal = STYLE[style] || STYLE.business;
    const kid = !o.sit && r() < 0.08;
    const p = {
      top: _c.set(pal[Math.floor(r() * pal.length)]).getHex(), pants: _c.set(PANTS[Math.floor(r() * PANTS.length)]).getHex(),
      skin: _c.set(SKIN[Math.floor(r() * SKIN.length)]).getHex(),
      hair: _c.set(r() < 0.12 ? HATS[Math.floor(r() * HATS.length)] : HAIR[Math.floor(r() * HAIR.length)]).getHex(),
      sc: kid ? 0.62 + r() * 0.1 : 0.9 + r() * 0.16, wide: 0.92 + r() * 0.2, t: r() * 9, x: 0, y: 0, z: 0, yaw: 0, ph: r() * 6, style,
    };
    all.push(p);
    return Object.assign(p, o);
  }
  // the hat owner: runs after it, catches up, puts it on, strolls back, waits for the next gust
  function hatScript(a, dt) {
    const h = W.hatChase, x0 = h.x0;
    let tx = h.x - 2.2, run = 0;
    if (h.st === 'blow') run = 1;
    else if (h.st === 'rest') { tx = h.x - 0.6; run = Math.abs(a.x - tx) > 0.3 ? 1 : 0; }
    else if (h.st === 'carried') { tx = h.x - 0.6; a.gest = a.gest && a.gest.kind === 'cheer' ? a.gest : { kind: 'cheer', t0: Game.t, until: Game.t + 1.6 }; }
    else if (h.st === 'walkback') { tx = h.x; run = 0.4; }
    else tx = x0;
    const dx = tx - a.x; a.x += U.clamp(dx, -dt * 6, dt * 6); a.z = shoreZ(a.x) - 34 - 2.2; a.y = terrainAt(a.x, a.z);
    a.yaw = Math.abs(dx) > 0.05 ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : a.yaw;
    a.t += dt; return run;
  }
  const pickStyle = (x, z) => { const d = districtAt(x, z); return d ? d.key : 'business'; };
  let slot = 0, flagN = 0;
  // arm angles (about x: negative is forward/up; about z: out to the side) for a pose or a gesture
  const _arm = { lx: 0, lz: 0, rx: 0, rz: 0, prop: false };
  function arms(p, swing, pose) {
    const a = _arm; a.prop = false;
    if (pose === 'walk') { a.lx = -swing * 0.9; a.rx = swing * 0.9; a.lz = -0.1; a.rz = 0.1; }
    else if (pose === 'sit') { a.lx = a.rx = -0.75; a.lz = -0.05; a.rz = 0.05; }
    else if (pose === 'ground') { a.lx = a.rx = -0.25; a.lz = -0.5; a.rz = 0.5; }
    else { a.lx = a.rx = 0.04; a.lz = -0.1; a.rz = 0.1; }
    const g = p.gest, t = Game.t;
    if (p.flag) { a.rx = -2.75; a.rz = 0.15; }
    if (p.phone && pose !== 'walk') { a.rx = -1.9; a.rz = 0.35; a.prop = true; if (pose !== 'sit') { a.lx = -0.7; a.lz = -0.3; } }
    if (g && t < g.until) {
      const k = Math.min(1, (t - g.t0) * 5, (g.until - t) * 5);
      if (g.kind === 'wave') { a.rx = U.lerp(a.rx, -2.9, k); a.rz = U.lerp(a.rz, 0.25 + Math.sin(t * 12) * 0.35, k); }
      else if (g.kind === 'point') { a.rx = U.lerp(a.rx, -1.55, k); a.rz = U.lerp(a.rz, 0.05, k); }
      else if (g.kind === 'clap') { const c = Math.abs(Math.sin(t * 9)) * 0.3; a.lx = a.rx = U.lerp(a.lx, -1.25, k); a.lz = U.lerp(a.lz, 0.35 - c, k); a.rz = U.lerp(a.rz, -0.35 + c, k); }
      else if (g.kind === 'cheer') { a.lx = a.rx = U.lerp(a.lx, -2.9, k); a.lz = U.lerp(a.lz, -0.35, k); a.rz = U.lerp(a.rz, 0.35, k); }
      else if (g.kind === 'taichi') { const u = Math.sin(t * 0.8 + p.ph * 0.1); a.lx = a.rx = -0.4 - (u * 0.5 + 0.5) * 1.3; a.lz = -0.3 - u * 0.4; a.rz = 0.3 + u * 0.4; }
    }
    return a;
  }
  function emit(p, swing, bob, pose) {
    const k = slot++;
    _q.setFromAxisAngle(Y, p.yaw);
    _m.compose(_v.set(p.x, p.y + bob, p.z), _q, _s.set(p.sc * p.wide, p.sc, p.sc * p.wide));
    PM.torso.setMatrixAt(k, _m); PM.head.setMatrixAt(k, _m); PM.hair.setMatrixAt(k, _m);
    PM.torso.setColorAt(k, _c.setHex(p.top)); PM.head.setColorAt(k, _c.setHex(p.skin)); PM.hair.setColorAt(k, _c.setHex(p.hair));
    PM.legL.setColorAt(k, _c.setHex(p.pants)); PM.legR.setColorAt(k, _c); PM.sit.setColorAt(k, _c);
    if (pose === 'sit') {
      _m2.makeTranslation(0, 0.8, 0.02); PM.sit.setMatrixAt(k, _m3.multiplyMatrices(_m, _m2));
      _m2.makeScale(0, 0, 0); PM.legL.setMatrixAt(k, _m2); PM.legR.setMatrixAt(k, _m2);
    } else {
      const lift = pose === 'ground' ? -Math.PI / 2 : 0;
      for (const [im, sx, sw] of [[PM.legL, -0.11, swing], [PM.legR, 0.11, -swing]]) {
        _m2.makeRotationX(sw + lift).setPosition(sx, 0.82, 0); im.setMatrixAt(k, _m3.multiplyMatrices(_m, _m2));
      }
      _m2.makeScale(0, 0, 0); PM.sit.setMatrixAt(k, _m2);
    }
    // arms from the shoulders
    const a = arms(p, swing, pose);
    PM.armL.setColorAt(k, _c.setHex(p.top)); PM.armR.setColorAt(k, _c);
    _e.set(a.lx, 0, a.lz); _m2.makeRotationFromEuler(_e).setPosition(-0.27, 1.38, 0); PM.armL.setMatrixAt(k, _m3.multiplyMatrices(_m, _m2));
    _e.set(a.rx, 0, a.rz); _m2.makeRotationFromEuler(_e).setPosition(0.27, 1.38, 0); _m3.multiplyMatrices(_m, _m2); PM.armR.setMatrixAt(k, _m3);
    if (a.prop) { PM.prop.setMatrixAt(k, _m3); PM.prop.setColorAt(k, _c.set('#1b1a24')); } else { _m2.makeScale(0, 0, 0); PM.prop.setMatrixAt(k, _m2); }
    if (p.flag && flagN < 8) { _m2.makeTranslation(0, -0.62, 0); PM.flag.setMatrixAt(flagN, _m3.multiply(_m2)); PM.flag.setColorAt(flagN++, _c.set(p.flag)); }
  }

  function init(world) {
    W = world;
    const r = U.rng(4242);
    let n = 0; for (const e of W.npcs) n += e.kind === 'walk' ? e.n : e.kind === 'group' ? e.n : e.pts.length;
    // sitters on about half the benches (one end each, so there's room for you too)
    const benchSit = [];
    for (const b of W.benches) if (r() < 0.45) { benchSit.push(b); n++; }
    personMeshes(Math.min(1500, n + 60));
    for (const e of W.npcs) {
      if (e.kind === 'walk') {
        const paths = e.paths.filter(p => p.length > 1);
        for (let i = 0; i < e.n && paths.length; i++) {
          const P = paths[Math.floor(r() * paths.length)];
          const segs = []; let len = 0; for (let j = 0; j < P.length - 1; j++) { const l = Math.hypot(P[j + 1][0] - P[j][0], P[j + 1][1] - P[j][1]); if (l < 0.01) continue; segs.push({ a: P[j], b: P[j + 1], l, s0: len }); len += l; }
          if (len < 5) continue;
          const jog = e.style === 'park' || e.style === 'lake' ? r() < 0.15 : false;
          const w = person(e.style, r, { segs, len, s: r() * len, dir: r() < 0.5 ? 1 : -1, sp: jog ? 2.6 + r() * 0.6 : 0.95 + r() * 0.6, jog, off: (r() - 0.5) * (e.width || 2.2), dodge: 0, y0: e.y });
          walkers.push(w);
          if (!jog && r() < (e.dogs ?? 0.07)) dogs.push({ owner: w, side: r() < 0.5 ? -1 : 1, col: pick(r, ['#8a5a30', '#1f1a18', '#e8e2d4', '#c8a060', '#5a4a3a']), sc: 0.7 + r() * 0.6, x: 0, z: 0, y: 0, yaw: 0 });
        }
      } else if (e.kind === 'group') {
        // a few people chatting in a ring
        for (let i = 0; i < e.n; i++) {
          const a = (i / e.n) * Math.PI * 2 + r() * 0.4, rr = 0.75 + e.n * 0.12, x = e.x + Math.cos(a) * rr, z = e.z + Math.sin(a) * rr;
          standers.push(person(e.style, r, { x, z, y: e.y ?? terrainAt(x, z), yaw0: Math.atan2(e.x - x, e.z - z), talk: true }));
        }
      } else {
        // pts: [x, z, yaw, y, pose]; for 'sit' y is the seat, for 'ground' it's the ground
        for (const pt of e.pts) {
          const pose = pt[4] || e.pose, y = pt[3] ?? terrainAt(pt[0], pt[1]);
          const s = person(e.style, r, { x: pt[0], z: pt[1], yaw0: pt[2] || 0, pose, sit: pose === 'sit' || pose === 'ground' });
          s.y = pose === 'sit' ? y - 0.8 * s.sc : pose === 'ground' ? y - 0.82 * s.sc + 0.12 : y;
          standers.push(s);
        }
      }
    }
    for (const b of benchSit) {
      const end = r() < 0.5 ? -1.1 : 1.1, side = r() < 0.5 ? -1 : 1;
      const x = b.alongX ? b.x + end : b.x, z = b.alongX ? b.z : b.z + end;
      const yaw = b.alongX ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      const st = person(pickStyle(x, z), r, { x: x - Math.sin(yaw) * 0.1, z: z - Math.cos(yaw) * 0.1, yaw0: yaw, pose: 'sit', sit: true });
      st.y = b.y + 0.5 - 0.8 * st.sc; standers.push(st); b.half = end;
    }
    for (const s of standers) { s.yaw = s.yaw0; if (!s.talk && !s.sit && r() < 0.18) s.phone = true; if (s.sit && r() < 0.2) s.phone = true; }
    const busks = (W.spots || []).filter(sp => sp.key.startsWith('busk_'));
    for (const s of standers) s.nearBusk = busks.some(b => Math.hypot(b.x - s.x, b.z - s.z) < 18 && Math.hypot(b.x - s.x, b.z - s.z) > 1.5);
    // a few extra listeners round each busker
    for (const b of busks) for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = 4 + r() * 4, x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d; const s = person(pickStyle(x, z), r, { x, z, y: terrainAt(x, z), yaw0: Math.atan2(b.x - x, b.z - z), nearBusk: true }); s.yaw = s.yaw0; standers.push(s); }
    // ---- little scenes ----
    // a tour group following a flag up and down the old town's main lane
    const lane = (W.oldLanes || [])[0];
    if (lane) {
      const segs = []; let len = 0; for (let j = 0; j < lane.length - 1; j++) { const l = Math.hypot(lane[j + 1][0] - lane[j][0], lane[j + 1][1] - lane[j][1]); if (l < 0.01) continue; segs.push({ a: lane[j], b: lane[j + 1], l, s0: len }); len += l; }
      const s0 = len * 0.3;
      const lead = person('oldtown', r, { segs, len, s: s0, dir: 1, sp: 0.9, off: 0.4, dodge: 0, flag: '#e4572e' }); walkers.push(lead);
      for (let k = 0; k < 10; k++) walkers.push(person(pick(r, ['lake', 'market', 'park']), r, { segs, len, s: s0 - 1.6 - k * 0.7 - r() * 0.5, dir: 1, sp: 0.9, off: (r() - 0.5) * 2.6, dodge: 0, phone: r() < 0.3 }));
    }
    // tai chi at dawn in the park clearing
    for (let k = 0; k < 8; k++) { const x = -770 + (k % 4) * 2.6, z = -104 + Math.floor(k / 4) * 2.8; const s = person('park', r, { x, z, y: terrainAt(x, z), yaw0: 0.2, gest: { kind: 'taichi', t0: -1, until: 1e9 }, when: () => Sky.phase > 0.2 && Sky.phase < 0.42 }); s.yaw = s.yaw0; standers.push(s); }
    // a man whose hat blew off, chasing it down the promenade
    if (W.hatChase) actors.push(Object.assign(person('lake', r, { sp: 0 }), { script: hatScript, x: W.hatChase.x0 - 2 }));
    // a dog that chases the old-town square's pigeons now and then
    if (W.bell) { const sq = (W.pigeonSpots || []).reduce((b, p) => Math.hypot(p[0] - W.bell.x, p[1] - W.bell.z) < Math.hypot(b[0] - W.bell.x, b[1] - W.bell.z) ? p : b, [W.bell.x + 10, W.bell.z]); dogs.push({ chase: { x: sq[0], z: sq[1] }, col: '#c8a060', sc: 0.8, x: sq[0] + 8, z: sq[1], y: 0, yaw: 0, t: r() * 20 }); }
    // dogs (one instanced mesh)
    const dogG = mergeParts([
      [new THREE.BoxGeometry(0.26, 0.26, 0.62), T4(0, 0.42, 0), '#ffffff'], [new THREE.BoxGeometry(0.22, 0.22, 0.26), T4(0, 0.6, 0.38), '#ffffff'],
      [new THREE.BoxGeometry(0.12, 0.1, 0.14), T4(0, 0.56, 0.54), '#ffffff'], [new THREE.BoxGeometry(0.06, 0.12, 0.06), T4(-0.08, 0.76, 0.34), '#ffffff'], [new THREE.BoxGeometry(0.06, 0.12, 0.06), T4(0.08, 0.76, 0.34), '#ffffff'],
      [new THREE.BoxGeometry(0.05, 0.05, 0.26), T4(0, 0.6, -0.4, -0.7, 0, 0), '#ffffff'],
      ...[[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]].map(([lx, lz]) => [new THREE.BoxGeometry(0.07, 0.32, 0.07), T4(lx, 0.16, lz), '#ffffff']),
    ]);
    dogIM = new THREE.InstancedMesh(dogG, toon('#ffffff', { noCache: true }), Math.max(1, dogs.length)); dogIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); dogIM.frustumCulled = false; dogIM.count = 0; dogIM.setColorAt(0, _c.set('#ffffff')); W.group.add(dogIM);
    // cars on the big roads: two lanes each way, U-turn at the ends
    const carCols = ['#c4523a', '#2f5f8a', '#e8b84a', '#f2efe6', '#3e8f86', '#2a2838', '#8a5a9e', '#d9779a'];
    for (const [key, n2] of [['boulevard', 8], ['avenue', 8], ['hill', 3], ['oblique', 3]]) {
      const road = W.roads[key]; if (!road) continue;
      const P = road.pts; const segs = []; let len = 0; for (let j = 0; j < P.length - 1; j++) { const l = Math.hypot(P[j + 1][0] - P[j][0], P[j + 1][1] - P[j][1]); segs.push({ a: P[j], b: P[j + 1], l, s0: len }); len += l; }
      for (let i = 0; i < n2; i++) {
        const g = carMesh(carCols[(i * 3 + key.length) % carCols.length]);
        cars.push({ g, segs, len, s: (i / n2) * len * 2, v: key === 'hill' ? 7 : 10 + r() * 3, lane: key === 'hill' ? 2.6 : 3.2, x: 0, z: 0, y: 0, fx: 0, fz: 1, vx: 0, vz: 0, slope: 0 });
      }
    }
    // long boats on the canal: slow, low, you can ride on them (and fall off)
    const C = PLAN.canal;
    for (let i = 0; i < 4; i++) {
      const g = boatMesh(['#2f5f6a', '#8a3a2a', '#3a4a6a', '#5a6a3a'][i]);
      const route = i < 3 ? { a: [C.x0 + 40, C.z + (i % 2 ? 4 : -4)], b: [C.bendX - 30, C.z + (i % 2 ? 4 : -4)] } : { a: [C.bendX + (i % 2 ? 4 : -4), C.z + 40], b: [C.bendX + (i % 2 ? 4 : -4), shoreZ(C.bendX) - 30] };
      const len = Math.hypot(route.b[0] - route.a[0], route.b[1] - route.a[1]);
      boats.push({ g, route, len, s: (i * 0.37 % 1) * len, dir: i % 2 ? 1 : -1, v: 2.2, wait: 0, x: 0, z: 0, fx: 1, fz: 0, vx: 0, vz: 0, y: C.waterY + 0.75, hit: { tag: 'boat', vx: 0, vz: 0, boat: true } });
    }
    // sailboats on the lake, drifting
    for (let i = 0; i < 9; i++) { const g = sailMesh(r()); g.position.set(-900 + r() * 1700, 0, 1300 + r() * 500); Object.assign(g.userData, { a: r() * 6, sp: 0.05 + r() * 0.08, cx: g.position.x, cz: g.position.z, r: 30 + r() * 80 }); boats.push({ sail: g }); }
    // birds: flocks circling high, gulls gliding over the water, pigeons on the plazas that scatter
    const birdG = new THREE.BufferGeometry(); birdG.setAttribute('position', new THREE.Float32BufferAttribute([-0.6, 0, -0.2, 0, 0, 0.2, 0, 0.05, -0.1, 0, 0.05, -0.1, 0, 0, 0.2, 0.6, 0, -0.2], 3)); birdG.computeVertexNormals();
    const flockDefs = [[-700, -400, 70, 12], [600, -900, 140, 9], [-300, 1150, 30, 14], [700, 800, 50, 10], [100, -300, 110, 8], [-850, -1100, 60, 10], [300, 600, 45, 9], [900, -300, 60, 8], [-500, 600, 40, 10]];
    const gullDefs = [[-600, 1320, 22, 7], [-100, 1400, 30, 6], [700, 1250, 26, 8], [300, 1300, 18, 5], [850, 1000, 34, 5]];
    const perches = (W.gullSpots || []);
    let nb = 0; for (const f of flockDefs) nb += f[3]; for (const f of gullDefs) nb += f[3]; for (const p of (W.pigeonSpots || [])) nb += p[2]; for (const p of perches) nb += p[2];
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
    for (const [cx, cz, h, nB] of gullDefs) {
      const fl = { cx, cz, h, gull: true, birds: [] };
      for (let i = 0; i < nB; i++) { const m = mk('#f4f4f0'); m.scale.set(2.4, 1, 1.6); fl.birds.push({ m, a: r() * 6, r: 20 + r() * 50, sp: (0.08 + r() * 0.08) * (r() < 0.5 ? -1 : 1), dh: r() * 8, ph: r() * 6 }); }
      flocks.push(fl);
    }
    const perch = (cx, cz, nP, col, sc, y0, spread) => {
      for (let i = 0; i < nP; i++) { const m = mk(col); const x = cx + (r() - 0.5) * spread, z = cz + (r() - 0.5) * spread; const y = y0 ?? terrainAt(x, z); m.position.set(x, y + 0.15, z); m.scale.setScalar(sc); pigeons.push({ m, x, z, y0, sc, home: [x, z], fly: 0, vy: 0, a: r() * 6 }); }
    };
    for (const [cx, cz, nP] of (W.pigeonSpots || [])) perch(cx, cz, nP, '#6a6a7a', 0.6, undefined, 16);
    for (const [cx, cz, nP, y0] of perches) perch(cx, cz, nP, '#f4f4f0', 0.9, y0, 6);
    if (birdIM.instanceColor) birdIM.instanceColor.needsUpdate = true;
    // ducks on the pond and the canal, swans by the shore: they paddle about and drift away from you
    const duckG = mergeParts([
      [new THREE.SphereGeometry(0.3, 8, 5), new THREE.Matrix4().makeScale(0.8, 0.55, 1.2), '#ffffff'],
      [new THREE.SphereGeometry(0.14, 6, 5), T4(0, 0.3, 0.3), '#ffffff'], [new THREE.ConeGeometry(0.06, 0.16, 4), T4(0, 0.28, 0.48, Math.PI / 2, 0, 0), '#e8a040'],
    ]);
    const swimSpots = [];
    const pond = PLAN.pond;
    if (W.pond) for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = r() * pond.r * 0.6; swimSpots.push({ x: pond.x + Math.cos(a) * d, z: pond.z + Math.sin(a) * d, y: W.pond.y, ok: (x, z) => Math.hypot(x - pond.x, z - pond.z) < pond.r * 0.78, col: pick(r, ['#6a5a3a', '#6a5a3a', '#f2efe6', '#3a5a3a']), sc: 1 }); }
    for (let i = 0; i < 26; i++) { const x = C.x0 + 60 + r() * (C.bendX - C.x0 - 100), z = C.z + (r() - 0.5) * C.half * 1.2; swimSpots.push({ x, z, y: C.waterY, ok: (x, z) => inCanal(x, z) && Math.abs(z - C.z) < C.half - 2 || (Math.abs(x - C.bendX) < C.half - 2 && z > C.z), col: pick(r, ['#6a5a3a', '#7a6a4a', '#f2efe6']), sc: 1 }); }
    for (let i = 0; i < 14; i++) { const x = -1000 + r() * 1200, z = shoreZ(x) + 14 + r() * 40; swimSpots.push({ x, z, y: 0.05, ok: (x, z) => z > shoreZ(x) + 8 && z < shoreZ(x) + 80 && x > -1050 && x < 260, col: '#ffffff', sc: 1.9 }); }
    duckIM = new THREE.InstancedMesh(duckG, toon('#ffffff', { noCache: true }), swimSpots.length); duckIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); duckIM.frustumCulled = false; W.group.add(duckIM);
    swimSpots.forEach((d, i) => { duckIM.setColorAt(i, _c.set(d.col)); ducks.push(Object.assign(d, { i, yaw: r() * 6, sp: 0.3 + r() * 0.3, turn: 0, flee: 0, t: r() * 9 })); });
    if (duckIM.instanceColor) duckIM.instanceColor.needsUpdate = true;
    // gondolas on the cable car
    if (W.cable) {
      const cb = W.cable;
      const gG = mergeParts([
        [new THREE.CylinderGeometry(0.06, 0.06, 1.2, 4), T4(0, -0.6, 0), '#2a2838'], [new THREE.BoxGeometry(0.5, 0.3, 0.9), T4(0, -0.08, 0), '#2a2838'],
        [new THREE.BoxGeometry(2.3, 0.2, 2.5), T4(0, -1.3, 0), '#ffffff'], [new THREE.BoxGeometry(2.0, 2.0, 2.2), T4(0, -2.4, 0), '#ffffff'],
        [new THREE.BoxGeometry(2.04, 0.8, 1.7), T4(0, -2.0, 0), '#bfe0f0'], [new THREE.BoxGeometry(1.5, 0.8, 2.24), T4(0, -2.0, 0), '#bfe0f0'],
      ]);
      cb.im = new THREE.InstancedMesh(gG, toon('#ffffff', { noCache: true }), cb.n); cb.im.frustumCulled = false; cb.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      cb.g = []; for (let i = 0; i < cb.n; i++) { cb.im.setColorAt(i, _c.set(['#e4572e', '#f2c14e', '#2f8f9d', '#f2efe6', '#3e8f86'][i % 5])); cb.g.push({ x: 0, y: 0, z: 0, vx: 0, vz: 0, yaw: 0 }); }
      cb.hit = { tag: 'lift', vx: 0, vz: 0, gondola: true }; cb.s = 0;
      W.group.add(cb.im);
    }
    W.lifeGround = ground;
    const prev = W.groundExtra;
    W.groundExtra = (x, z, yMax, rr) => { const a = prev(x, z, yMax, rr), b = ground(x, z, yMax); return b && (!a || b.y > a.y) ? b : a; };
  }
  // vehicles are instanced: one draw for the painted parts (tinted per instance), one for the fixed
  // colours, one for the outline. A plain Object3D stands in for each vehicle.
  function instKit(parts, n, outlineT) {
    const mat = G.solidMat || (G.solidMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: G.grad }));
    const mk = (geo, m) => { const im = new THREE.InstancedMesh(geo, m, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; W.group.add(im); return im; };
    const paint = parts.filter(p => !p[2]).map(([g, m]) => [g, m, '#ffffff']), fixed = parts.filter(p => p[2]);
    const A = paint.length ? mk(mergeParts(paint), mat) : null, Bm = fixed.length ? mk(mergeParts(fixed), mat) : null;
    const all = mergeParts(parts.map(([g, m, c]) => [g, m, c || '#ffffff']));
    all.computeBoundingBox(); const bb = all.boundingBox, size = bb.getSize(V3()), ctr = bb.getCenter(V3());
    const sc = V3((size.x + 2 * outlineT) / size.x, (size.y + 2 * outlineT) / size.y, (size.z + 2 * outlineT) / size.z);
    all.applyMatrix4(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z).multiply(new THREE.Matrix4().makeScale(sc.x, sc.y, sc.z)).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z)));
    const O = mk(all, G.outlineMat);
    let k = 0; const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    if (A) A.setColorAt(0, _c.set('#ffffff'));
    return {
      add(col) { const o = new THREE.Object3D(); o.userData.i = k; if (A) A.setColorAt(k, _c.set(col)); k++; if (A && A.instanceColor) A.instanceColor.needsUpdate = true; return o; },
      write(o) { const i = o.userData.i; let m = zero; if (o.visible) { o.updateMatrix(); m = o.matrix; } if (A) A.setMatrixAt(i, m); if (Bm) Bm.setMatrixAt(i, m); O.setMatrixAt(i, m); },
      flush() { for (const im of [A, Bm, O]) if (im) { im.count = k; im.instanceMatrix.needsUpdate = true; } },
    };
  }
  let carKit, boatKit, sailKit;
  function carMesh(c) {
    if (!carKit) {
      const parts = [
        [new THREE.BoxGeometry(1.9, 0.75, 4.1), T4(0, 0.7, 0), null],
        [new THREE.BoxGeometry(1.7, 0.65, 2.1), T4(0, 1.38, -0.2), null],
        [new THREE.BoxGeometry(1.74, 0.45, 1.92), T4(0, 1.38, -0.2), '#2a3550'],
        [new THREE.BoxGeometry(0.4, 0.2, 0.08), T4(-0.6, 0.78, 2.07), '#fff3c4'], [new THREE.BoxGeometry(0.4, 0.2, 0.08), T4(0.6, 0.78, 2.07), '#fff3c4'],
        [new THREE.BoxGeometry(0.4, 0.18, 0.08), T4(-0.6, 0.78, -2.07), '#ff3a3a'], [new THREE.BoxGeometry(0.4, 0.18, 0.08), T4(0.6, 0.78, -2.07), '#ff3a3a'],
      ];
      for (const [sx, sz] of [[-0.95, 1.25], [0.95, 1.25], [-0.95, -1.25], [0.95, -1.25]]) parts.push([new THREE.CylinderGeometry(0.33, 0.33, 0.22, 8), T4(sx, 0.33, sz, 0, 0, Math.PI / 2), '#1b1a24']);
      carKit = instKit(parts, 24, 0.05);
    }
    const o = carKit.add(c); o.kit = carKit; return o;
  }
  function boatMesh(c) {
    if (!boatKit) {
      const parts = [
        [new THREE.BoxGeometry(2.6, 1.0, 15), T4(0, -0.2, 0), null],
        [new THREE.CylinderGeometry(1.3, 1.3, 1.0, 10, 1, false, 0, Math.PI), T4(0, -0.2, 7.5), null],
        [new THREE.BoxGeometry(2.3, 0.12, 15), T4(0, 0.32, 0), '#a0805a'],
        [new THREE.BoxGeometry(2.0, 1.2, 4.5), T4(0, 0.95, -3.5), '#e8dcc0'],
      ];
      for (let i = 0; i < 4; i++) parts.push([new THREE.CylinderGeometry(0.25, 0.3, 0.4, 8), T4(i % 2 ? 0.6 : -0.6, 0.55, 2 + i * 1.2), ['#c4523a', '#3e8f86', '#e8b84a', '#f2efe6'][i]]);
      boatKit = instKit(parts, 6, 0.05);
    }
    const o = boatKit.add(c); o.kit = boatKit; return o;
  }
  function sailMesh(r) {
    if (!sailKit) {
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.8, 0.5, 0, 8, 0.6, 0, 0.8, -2.6, 0, 0.8, 0.5, 0, 0.8, -2.6, 0, 8, 0.6], 3));
      sailKit = instKit([[new THREE.BoxGeometry(1.8, 0.7, 6), T4(0, 0.2, 0), '#f2efe6'], [new THREE.CylinderGeometry(0.06, 0.06, 8, 5), T4(0, 4.4, 0.6), '#c9c2b4'], [sg, null, null]], 10, 0.04);
    }
    const o = sailKit.add(r < 0.3 ? '#e4572e' : '#ffffff'); o.kit = sailKit; return o;
  }
  // stand on a long boat (or a cabin of the big wheel)
  function ground(x, z, yMax) {
    let best = null;
    const cb = W.cable;
    if (cb && cb.g) for (const g of cb.g) {
      if (Math.abs(x - g.x) > 1.3 || Math.abs(z - g.z) > 1.3) continue;
      const y = g.y - 1.2; if (y <= yMax && (!best || y > best.y)) best = { y, hit: cb.hit };
    }
    const fw = W.ferris;
    if (fw && Math.abs(x - fw.x) < fw.R + 3 && Math.abs(z - fw.z) < 1.4) {
      for (const c of fw.cab) { if (Math.abs(x - c.x) < 1.25 && c.y - 0.6 <= yMax && (!best || c.y - 0.6 > best.y)) best = { y: c.y - 0.62, hit: fw.hit }; }
    }
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
    // people: everyone within reach is animated and packed into the instanced meshes
    let crowd = 0; slot = 0; flagN = 0;
    const R = Math.min(230, (Game.cellR || 360) * 0.64), cap = PM.torso.instanceMatrix.count;
    for (const w of walkers) {
      w.s += w.sp * dt * w.dir; if (w.s > w.len) { w.s = w.len; w.dir = -1; } else if (w.s < 0) { w.s = 0; w.dir = 1; }
      if (Math.abs(w.x - fx) > R || Math.abs(w.z - fz) > R) { if (!w.y || Math.random() < 0.02) { pathPos(w.segs, w.s, _pp); w.x = _pp.x; w.z = _pp.z; w.y = w.y0 ?? terrainAt(w.x, w.z); } continue; }
      w.t += dt;
      pathPos(w.segs, w.s, _pp);
      // step aside when you come through
      const dxp = pl.pos.x - w.x, dzp = pl.pos.z - w.z, dp = Math.hypot(dxp, dzp);
      w.dodge = U.damp(w.dodge, dp < 3.2 ? (dxp * -_pp.fz + dzp * _pp.fx > 0 ? -1.8 : 1.8) : 0, 4, dt);
      // stepping aside, they make a little sound (a hum, a whistle, a ringtone…); several in a row ripple
      if (dp < 2.6 && pl.speed > 3 && Game.t > (w.cd || 0) && Math.abs(pl.pos.y - w.y) < 2.5) {
        w.cd = Game.t + 12; if (Math.random() < 0.25) w.gest = { kind: 'wave', t0: Game.t, until: Game.t + 1.4 };
        if (Game.t > (L.voiceCD || 0)) { Sound.sfx.person(w.style || 'business', (w.ph * 7) | 0); L.voiceCD = Game.t + 0.5; }
        L.passes = (L.passes || []).filter(tt => Game.t - tt < 2.5); L.passes.push(Game.t);
        if (L.passes.length >= 3 && Game.t > (L.rippleCD || 0)) { Sound.sfx.ripple(); L.rippleCD = Game.t + 4; L.passes = []; }
      }
      const ox = -_pp.fz * (w.off + w.dodge), oz = _pp.fx * (w.off + w.dodge);
      w.x = _pp.x + ox; w.z = _pp.z + oz; w.y = w.y0 ?? terrainAt(w.x, w.z);
      w.yaw = Math.atan2(_pp.fx * w.dir, _pp.fz * w.dir);
      if (slot >= cap) continue;
      const f = w.sp * (w.jog ? 2.4 : 3.6) / w.sc, ph = w.t * f;
      emit(w, Math.sin(ph) * (w.jog ? 0.7 : 0.42), Math.abs(Math.cos(ph)) * (w.jog ? 0.09 : 0.035), 'walk');
      if (dp < 12) crowd++;
    }
    for (const a of actors) {
      const run = a.script(a, dt);
      if (Math.abs(a.x - fx) > R || Math.abs(a.z - fz) > R || slot >= cap) continue;
      const ph = a.t * (run > 0.6 ? 9 : 4);
      emit(a, run > 0 ? Math.sin(ph) * (run > 0.6 ? 0.75 : 0.4) : 0, run > 0 ? Math.abs(Math.cos(ph)) * 0.08 * run : 0, run > 0 ? 'walk' : 'stand');
    }
    for (const s of standers) {
      if (Math.abs(s.x - fx) > R || Math.abs(s.z - fz) > R || slot >= cap) continue;
      if (s.when && !s.when()) continue;
      s.t += dt;
      const ds = Math.hypot(pl.pos.x - s.x, pl.pos.z - s.z);
      if (s.talk) s.yaw = s.yaw0 + Math.sin(s.t * 0.7 + s.ph) * 0.25;
      else if (!s.sit) s.yaw = s.yaw0 + Math.sin(s.t * 0.23 + s.ph) * 0.35;
      if (s.talk && ds < 5 && Game.t > (L.murmurCD || 0)) { Sound.sfx.murmur(); L.murmurCD = Game.t + 7; }
      // some wave as you go by, and turn to watch you
      if (ds < 7 && pl.speed > 3 && !s.phone && Game.t > (s.waveCD || 0)) { s.waveCD = Game.t + 20; if (Math.random() < 0.35) s.gest = { kind: 'wave', t0: Game.t, until: Game.t + 1.6 }; }
      if (s.gest && Game.t < s.gest.until && s.gest.kind !== 'taichi') s.yaw = U.lerp(s.yaw, Math.atan2(pl.pos.x - s.x, pl.pos.z - s.z), 0.1);
      // the music moves them: near a busker they dance, near you (when you stop to listen) they nod along
      let bob = s.talk ? Math.max(0, Math.sin(s.t * 3.1 + s.ph)) * 0.02 : 0;
      const groove = s.nearBusk ? 1 : (Game.listen > 0.4 && ds < 22 ? Game.listen : 0);
      if (groove > 0 && bi) {
        const ph = bi.phase * Math.PI * 2;
        if (s.sit || s.pose === 'ground') bob += Math.max(0, Math.cos(ph)) * 0.025 * groove;
        else { bob += Math.abs(Math.cos(ph)) * 0.06 * groove; if (s.nearBusk && !s.talk) s.yaw = s.yaw0 + Math.sin(ph * 0.5 + s.ph) * 0.5; }
      }
      emit(s, s.nearBusk && !s.sit && bi ? Math.sin(bi.phase * Math.PI * 2) * 0.15 : 0, bob, s.pose === 'sit' ? 'sit' : s.pose === 'ground' ? 'ground' : 'stand');
      if (ds < 12) crowd++;
    }
    for (const k in PM) { const im = PM[k]; im.count = k === 'flag' ? flagN : slot; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    L.crowdNear = U.damp(L.crowdNear, Math.min(1, crowd / 8), 2, dt);
    // dogs trot beside their people
    let nd = 0;
    L.scarers = L.scarers || []; L.scarers.length = 0;
    for (const d of dogs) {
      if (d.chase) {
        // every twenty seconds or so: a mad dash round the square, straight through the pigeons
        if (Math.abs(d.x - fx) > R * 0.7 || Math.abs(d.z - fz) > R * 0.7) continue;
        d.t += dt; const cyc = d.t % 22, dash = cyc > 16;
        const a = d.t * (dash ? 1.4 : 0.15), rr = dash ? 7 : 9;
        const tx = d.chase.x + Math.cos(a) * rr, tz = d.chase.z + Math.sin(a) * rr;
        const ox = d.x, oz = d.z; d.x = U.damp(d.x, tx, dash ? 6 : 1, dt); d.z = U.damp(d.z, tz, dash ? 6 : 1, dt);
        if (Math.hypot(d.x - ox, d.z - oz) > 1e-3) d.yaw = Math.atan2(d.x - ox, d.z - oz);
        d.y = terrainAt(d.x, d.z);
        if (dash) { L.scarers.push(d); if (cyc < 16.1 && Game.t > (d.cd || 0) && Math.hypot(pl.pos.x - d.x, pl.pos.z - d.z) < 60) { d.cd = Game.t + 15; Sound.sfx.bark(); } }
        _q.setFromAxisAngle(Y, d.yaw); _m.compose(_v.set(d.x, d.y + (dash ? Math.abs(Math.sin(d.t * 14)) * 0.12 : 0), d.z), _q, _s.setScalar(d.sc));
        dogIM.setMatrixAt(nd, _m); dogIM.setColorAt(nd, _c.set(d.col)); nd++;
        continue;
      }
      const o = d.owner; if (Math.abs(o.x - fx) > R * 0.7 || Math.abs(o.z - fz) > R * 0.7) continue;
      if (Math.hypot(pl.pos.x - d.x, pl.pos.z - d.z) < 4.5 && pl.speed > 2 && Game.t > (d.cd || 0)) { d.cd = Game.t + 9; Sound.sfx.bark(); }
      const fx2 = Math.sin(o.yaw), fz2 = Math.cos(o.yaw);
      const tx = o.x + fz2 * d.side * 0.9 + fx2 * 1.1, tz = o.z - fx2 * d.side * 0.9 + fz2 * 1.1;
      if (!d.x) { d.x = tx; d.z = tz; }
      d.x = U.damp(d.x, tx, 3, dt); d.z = U.damp(d.z, tz, 3, dt); d.yaw = o.yaw;
      d.y = o.y0 ?? terrainAt(d.x, d.z);
      _q.setFromAxisAngle(Y, d.yaw); _m.compose(_v.set(d.x, d.y + Math.abs(Math.sin(o.t * 9)) * 0.05, d.z), _q, _s.setScalar(d.sc));
      dogIM.setMatrixAt(nd, _m); dogIM.setColorAt(nd, _c.set(d.col)); nd++;
    }
    dogIM.count = nd; dogIM.instanceMatrix.needsUpdate = true; if (dogIM.instanceColor) dogIM.instanceColor.needsUpdate = true;
    // ducks: lazy circles, a little wake of fear around you
    for (const d of ducks) {
      d.t += dt;
      const near = Math.abs(d.x - fx) < 300 && Math.abs(d.z - fz) < 300;
      if (!near) continue;
      const dx = d.x - pl.pos.x, dz = d.z - pl.pos.z, dd = Math.hypot(dx, dz);
      if (dd < 7) { if (d.flee <= 0 && Game.t > (L.quackCD || 0)) { Sound.sfx.touch('quack', d.i); L.quackCD = Game.t + 1.2; } d.yaw = U.lerp(d.yaw, Math.atan2(dx, dz), 0.1); d.flee = 1.5; }
      else if (Math.random() < dt * 0.3) d.turn = (Math.random() - 0.5) * 0.8;
      d.yaw += d.turn * dt; d.flee = Math.max(0, d.flee - dt);
      const v = d.sp * (1 + d.flee * 2) * (0.6 + Math.sin(d.t * 0.5) * 0.4);
      const nx = d.x + Math.sin(d.yaw) * v * dt, nz = d.z + Math.cos(d.yaw) * v * dt;
      if (d.ok(nx, nz)) { d.x = nx; d.z = nz; } else d.yaw += Math.PI * (0.5 + Math.random() * 0.5);
      _q.setFromAxisAngle(Y, d.yaw); _m.compose(_v.set(d.x, d.y + 0.08 + Math.sin(d.t * 2) * 0.02, d.z), _q, _s.setScalar(d.sc));
      duckIM.setMatrixAt(d.i, _m);
    }
    duckIM.instanceMatrix.needsUpdate = true;
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
      carKit.write(c.g);
      // a friendly toot (in key) if you're on the road in front of it
      { const dx = pl.pos.x - c.x, dz = pl.pos.z - c.z, al = dx * c.fx + dz * c.fz, lat = Math.abs(dx * -c.fz + dz * c.fx);
        if (al > 2 && al < 14 && lat < 2.5 && Math.abs(pl.pos.y - c.y) < 2 && Game.t > (c.hornCD || 0)) { c.hornCD = Game.t + 10; Sound.sfx.touch('horn'); } }
    }
    if (carKit) carKit.flush();
    // the big wheel
    const fw = W.ferris;
    if (fw) {
      fw.a += fw.w * dt; fw.rot.rotation.z = fw.a;
      for (let i = 0; i < fw.n; i++) {
        const a = fw.a + i / fw.n * Math.PI * 2, c = fw.cab[i];
        c.x = fw.x + Math.cos(a) * fw.R; c.y = fw.y + Math.sin(a) * fw.R;
        _m.makeRotationZ(Math.sin(Game.t * 0.7 + i) * 0.03).setPosition(c.x, c.y, fw.z); fw.cabs.setMatrixAt(i, _m);
      }
      fw.cabs.instanceMatrix.needsUpdate = true;
      // the cabin under you (if any) sets the carry speed
      const pp = Game.player.pos; let bc = null, bd = 2;
      for (const c of fw.cab) { const d = Math.abs(pp.x - c.x) + Math.abs(pp.y - (c.y - 0.62)); if (d < bd) { bd = d; bc = c; } }
      if (bc) { const a = Math.atan2(bc.y - fw.y, bc.x - fw.x); fw.hit.vx = -Math.sin(a) * fw.R * fw.w; fw.hit.vz = 0; }
    }
    // cabins and gondolas are solid from the side too (their roofs are ground, see ground())
    const pl2 = Game.player;
    const pushOut = (cx, cy0, cy1, cz, yaw, hx, hz) => {
      const pp = pl2.pos, R0 = 0.38;
      if (pp.y > cy1 - 0.08 || pp.y + 1.7 < cy0) return;
      const s0 = Math.sin(yaw), c0 = Math.cos(yaw), dx = pp.x - cx, dz = pp.z - cz;
      const lx = dx * c0 - dz * s0, lz = dx * s0 + dz * c0;          // into the cabin's frame
      const ox = hx + R0 - Math.abs(lx), oz = hz + R0 - Math.abs(lz);
      if (ox <= 0 || oz <= 0) return;
      let nx = 0, nz = 0;
      if (ox < oz) nx = Math.sign(lx) * ox; else nz = Math.sign(lz) * oz;
      const wx = nx * c0 + nz * s0, wz = -nx * s0 + nz * c0;           // back to the world
      pp.x += wx; pp.z += wz;
      const l = Math.hypot(wx, wz) || 1, vn = (pl2.vel.x * wx + pl2.vel.z * wz) / l;
      if (vn < 0) { pl2.vel.x -= vn * wx / l; pl2.vel.z -= vn * wz / l; }
    };
    if (W.ferris) for (const c of W.ferris.cab) if (Math.abs(c.x - pl2.pos.x) < 4 && Math.abs(c.y - pl2.pos.y) < 6) pushOut(c.x, c.y - 2.85, c.y - 0.64, W.ferris.z, 0, 1.25, 1.35);
    if (W.cable && W.cable.g) for (const g of W.cable.g) if (Math.abs(g.x - pl2.pos.x) < 4 && Math.abs(g.z - pl2.pos.z) < 4) pushOut(g.x, g.y - 3.4, g.y - 1.2, g.z, g.yaw, 1.15, 1.25);
    // the cable car
    const cb = W.cable;
    if (cb && cb.g) {
      cb.s += cb.speed * dt;
      const pp = Game.player.pos; let near = null, nd = 2.5;
      for (let i = 0; i < cb.n; i++) {
        const g = cb.g[i], ox = g.x, oz = g.z;
        cableAt(cb, cb.s + i * (cb.loop / cb.n), g);
        g.vx = (g.x - ox) / Math.max(dt, 1e-3); g.vz = (g.z - oz) / Math.max(dt, 1e-3);
        _q.setFromAxisAngle(Y, g.yaw); _m.compose(_v.set(g.x, g.y, g.z), _q, _s.set(1, 1, 1)); cb.im.setMatrixAt(i, _m);
        const d = Math.abs(pp.x - g.x) + Math.abs(pp.z - g.z) + Math.abs(pp.y - (g.y - 1.2)); if (d < nd) { nd = d; near = g; }
      }
      cb.im.instanceMatrix.needsUpdate = true;
      if (near && Math.abs(near.vx) < 30) { cb.hit.vx = near.vx; cb.hit.vz = near.vz; }
    }
    // canal boats: glide, pause at the ends, turn around
    for (const b of boats) {
      if (b.sail) { const u = b.sail.userData; u.a += dt * u.sp * 0.2; b.sail.position.set(u.cx + Math.cos(u.a) * u.r, Math.sin(Game.t * 0.8 + u.a) * 0.15, u.cz + Math.sin(u.a) * u.r * 0.5); b.sail.rotation.y = -u.a + Math.PI; b.sail.rotation.z = Math.sin(Game.t * 0.6 + u.a) * 0.05; sailKit.write(b.sail); continue; }
      if (b.wait > 0) { b.wait -= dt; b.vx = b.vz = 0; }
      else { b.s += b.v * dt * b.dir; if (b.s > b.len) { b.s = b.len; b.dir = -1; b.wait = 6; } else if (b.s < 0) { b.s = 0; b.dir = 1; b.wait = 6; } }
      const ux = (b.route.b[0] - b.route.a[0]) / b.len, uz = (b.route.b[1] - b.route.a[1]) / b.len;
      b.x = b.route.a[0] + ux * b.s; b.z = b.route.a[1] + uz * b.s;
      b.fx = ux * b.dir; b.fz = uz * b.dir;
      if (!b.wait || b.wait <= 0) { b.vx = b.fx * b.v; b.vz = b.fz * b.v; }
      b.hit.vx = b.vx; b.hit.vz = b.vz;
      b.y = PLAN.canal.waterY + 0.75 + Math.sin(Game.t * 1.3 + b.s) * 0.04;
      b.g.position.set(b.x, b.y - 0.4, b.z); b.g.rotation.y = Math.atan2(b.fx, b.fz); boatKit.write(b.g);
    }
    if (boatKit) boatKit.flush(); if (sailKit) sailKit.flush();
    // flocks
    for (const fl of flocks) for (const b of fl.birds) {
      b.a += b.sp * dt; b.ph += dt * 9;
      b.m.position.set(fl.cx + Math.cos(b.a) * b.r, fl.h + b.dh + Math.sin(b.a * 2) * 4, fl.cz + Math.sin(b.a) * b.r);
      b.m.rotation.set(0, -b.a + (b.sp < 0 ? Math.PI : 0), fl.gull ? Math.sin(b.a * 3) * 0.25 : 0);
      b.m.scale.y = fl.gull ? 1 + Math.max(0, Math.sin(b.ph * 0.4)) * Math.sin(b.ph) * 0.5 : 1 + Math.sin(b.ph) * 0.6;
    }
    // pigeons scatter as you come through, into a little run of notes
    for (const pg of pigeons) {
      const d = Math.hypot(pl.pos.x - pg.x, pl.pos.z - pg.z);
      let scared = d < 5 && pl.speed > 3;
      for (const sc of (L.scarers || [])) if (Math.hypot(sc.x - pg.x, sc.z - pg.z) < 3.5) scared = true;
      if (pg.fly <= 0 && scared) { pg.fly = 5 + Math.random() * 3; pg.vy = 4 + Math.random() * 2; pg.a = Math.atan2(pg.x - pl.pos.x, pg.z - pl.pos.z) + (Math.random() - 0.5); if (Game.t > (L.flutterCD || 0)) { Sound.sfx.touch('flutter'); L.flutterCD = Game.t + 2.5; } else if (Math.random() < 0.3) Sound.sfx.touch('bird', Math.floor(Math.random() * 5)); }
      if (pg.fly > 0) {
        pg.fly -= dt; pg.vy = Math.max(-1, pg.vy - dt * 1.2);
        pg.x += Math.sin(pg.a) * 6 * dt; pg.z += Math.cos(pg.a) * 6 * dt; pg.m.position.set(pg.x, pg.m.position.y + pg.vy * dt, pg.z); pg.m.scale.y = pg.sc + Math.sin(Game.t * 20) * pg.sc * 0.66;
        if (pg.fly <= 0) { pg.x = pg.home[0] + (Math.random() - 0.5) * 6; pg.z = pg.home[1] + (Math.random() - 0.5) * 6; pg.m.position.set(pg.x, (pg.y0 ?? terrainAt(pg.x, pg.z)) + 0.15, pg.z); pg.m.scale.y = pg.sc; }
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
  // you landed something: the people nearby clap (kids point and cheer)
  function applaud(x, z, big) {
    let n = 0;
    for (const s of standers) {
      const d = Math.hypot(s.x - x, s.z - z); if (d > 16 || s.sit && Math.random() < 0.5) continue;
      s.gest = { kind: s.sc < 0.8 ? 'cheer' : big && Math.random() < 0.3 ? 'cheer' : 'clap', t0: Game.t + Math.random() * 0.2, until: Game.t + 1.8 + Math.random() * 0.8 }; n++;
    }
    for (const w of walkers) { if (Math.abs(w.x - x) > 12 || Math.abs(w.z - z) > 12) continue; if (Math.random() < 0.5) w.gest = { kind: w.sc < 0.8 ? 'point' : 'clap', t0: Game.t, until: Game.t + 1.4 }; n++; }
    return n;
  }
  return Object.assign(L, { init, update, hits, walkers, standers, applaud });
})();
