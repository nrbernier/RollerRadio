// ============================================================
//  WORLD KIT — shared building blocks for every level
// ============================================================
const STREET = -42;

// stylised sky: colours come from the world's ambiance
function skyDome(p = {}) {
  const c = (a) => new THREE.Vector3(...a);
  const g = new THREE.SphereGeometry(900, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uT: { value: 0 }, uSun: { value: V3(...(p.sun || [-0.7, 0.16, 0.45])).normalize() },
      uTop: { value: c(p.top || [0.24, 0.17, 0.62]) }, uMid: { value: c(p.mid || [1.0, 0.38, 0.62]) },
      uHor: { value: c(p.hor || [1.0, 0.66, 0.42]) }, uLow: { value: c(p.low || [0.55, 0.33, 0.6]) },
      uCloud: { value: c(p.cloud || [1.0, 0.82, 0.76]) }, uSunC: { value: c(p.sunC || [1.0, 0.95, 0.7]) },
      uStripe: { value: p.stripes === false ? 0 : 1 }, uCloudAmt: { value: p.cloudAmt ?? 0.55 }
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; uniform float uT, uStripe, uCloudAmt; uniform vec3 uSun, uTop, uMid, uHor, uLow, uCloud, uSunC;
      void main(){
        float h = vP.y;
        vec3 c = h > 0.0 ? mix(uMid, uTop, smoothstep(0.08, 0.6, h)) : uLow;
        c = mix(c, uHor, (1.0 - smoothstep(0.0, 0.16, abs(h))) * 0.9);
        float n = sin(vP.x*9.0 + uT*0.03) * sin(vP.z*7.0 - uT*0.02) + sin(vP.x*23.0 + vP.z*11.0)*0.3;
        float band = smoothstep(0.25, 0.3, n) * smoothstep(0.05, 0.12, h) * (1.0 - smoothstep(0.22, 0.45, h));
        c = mix(c, uCloud, band*uCloudAmt);
        float d = distance(vP, uSun);
        c = mix(c, uSunC, 1.0 - smoothstep(0.075, 0.08, d));
        c = mix(c, uSunC*0.9, (1.0 - smoothstep(0.11, 0.115, d)) * step(0.08, d) * 0.45);
        float st = step(0.5, fract(vP.y*90.0)) * step(d, 0.08) * step(vP.y, uSun.y) * uStripe;
        c = mix(c, vec3(1.0,0.5,0.55), st*0.7);
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return mesh;
}

function wedgeGeo(x0, z0, x1, z1, axis, h0, h1, base, plank) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = axis === 'x' ? x + 0.5 : z + 0.5;
    const top = U.lerp(h0, h1, t);
    p.setXYZ(i, U.lerp(x0, x1, x + 0.5), y > 0 ? top : (plank ? top - 0.35 : base), U.lerp(z0, z1, z + 0.5));
  }
  g.computeVertexNormals();
  return g;
}
function at(m, x, y, z) { m.position.set(x, y, z); return m; }
function rampH(rp, x, z) {
  const t = rp.axis === 'x' ? (x - rp.x0) / (rp.x1 - rp.x0) : (z - rp.z0) / (rp.z1 - rp.z0);
  return U.lerp(rp.h0, rp.h1, U.clamp(t, 0, 1));
}
function railSeg(r, s) {
  const S = r.segs; let lo = 0, hi = S.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m].s0 <= s) lo = m; else hi = m - 1; }
  return S[lo];
}
function railPoint(r, s, out = V3()) {
  s = r.loop ? ((s % r.len) + r.len) % r.len : U.clamp(s, 0, r.len);
  const g = railSeg(r, s);
  return out.copy(g.a).addScaledVector(g.dir, Math.min(g.len, s - g.s0));
}
function railDir(r, s) {
  s = r.loop ? ((s % r.len) + r.len) % r.len : U.clamp(s, 0, r.len);
  return railSeg(r, s).dir;
}

// ---- rail path helpers (return arrays of [x,y,z]) ----
// arc around (cx,cz), angles in radians (x = cx + cos a * r, z = cz + sin a * r)
function pArc(cx, cz, r, a0, a1, y0, y1 = y0, step = 0.8) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r / step)), out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = U.lerp(a0, a1, t); out.push([cx + Math.cos(a) * r, U.lerp(y0, y1, U.smooth(t)), cz + Math.sin(a) * r]); }
  return out;
}
function pHelix(cx, cz, r, a0, turns, y0, y1) {
  const a1 = a0 + turns * Math.PI * 2, n = Math.ceil(Math.abs(a1 - a0) * r / 0.8), out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = U.lerp(a0, a1, t); out.push([cx + Math.cos(a) * r, U.lerp(y0, y1, t), cz + Math.sin(a) * r]); }
  return out;
}
// straight run from a to b with a sine ripple in height (roller-coaster humps)
function pWave(a, b, amp, waves, step = 0.8) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.ceil(L / step)), out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push([U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t) + Math.sin(t * Math.PI * waves) * amp, U.lerp(a[2], b[2], t)]); }
  return out;
}
// round the corners of a polyline with arcs of radius R
function fillet(P, R, loop) {
  const n = P.length, out = [];
  if (n < 3 || R <= 0) { const o = P.map(p => p.clone()); if (loop) o.push(P[0].clone()); return o; }
  for (let i = 0; i < n; i++) {
    const p = P[i];
    if (!loop && (i === 0 || i === n - 1)) { out.push(p.clone()); continue; }
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n];
    const d1 = V3().subVectors(p, a), d2 = V3().subVectors(b, p);
    const l1 = d1.length(), l2 = d2.length(); d1.normalize(); d2.normalize();
    const dot = d1.dot(d2);
    if (dot > 0.9995 || l1 < 1e-4 || l2 < 1e-4) { out.push(p.clone()); continue; }
    const t = Math.min(R, l1 * 0.48, l2 * 0.48);
    const s0 = V3().copy(p).addScaledVector(d1, -t), e0 = V3().copy(p).addScaledVector(d2, t);
    const ang = Math.acos(U.clamp(dot, -1, 1)), steps = Math.max(2, Math.ceil(ang * t / 0.45));
    for (let k = 0; k <= steps; k++) {
      const u = k / steps, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      out.push(V3(s0.x * w0 + p.x * w1 + e0.x * w2, s0.y * w0 + p.y * w1 + e0.y * w2, s0.z * w0 + p.z * w1 + e0.z * w2));
    }
  }
  if (loop) out.push(out[0].clone());
  return out;
}

// simple uniform grid for broad-phase queries
function makeGrid(cell) {
  const map = new Map(); let stamp = 1;
  return {
    add(o, x0, z0, x1, z1) {
      for (let ix = Math.floor(x0 / cell); ix <= Math.floor(x1 / cell); ix++)
        for (let iz = Math.floor(z0 / cell); iz <= Math.floor(z1 / cell); iz++) {
          const k = ix * 100003 + iz; let a = map.get(k); if (!a) map.set(k, a = []); a.push(o);
        }
    },
    query(x0, z0, x1, z1, out) {
      stamp++; out.length = 0;
      for (let ix = Math.floor(x0 / cell); ix <= Math.floor(x1 / cell); ix++)
        for (let iz = Math.floor(z0 / cell); iz <= Math.floor(z1 / cell); iz++) {
          const a = map.get(ix * 100003 + iz); if (!a) continue;
          for (const o of a) if (o._g !== stamp) { o._g = stamp; out.push(o); }
        }
      return out;
    }
  };
}

// world-space textures (white-ish so vertex colour tints them)
// Night windows: one 16×16-window sheet (1024 px), so the pattern only repeats every 16 windows.
// Each window gets its own state — dark, lit warm/cool/pink, TV flicker colour, blinds half down, a plant —
// and some floors use split or wide windows.
const NIGHT_WIN = (() => {
  const r = U.rng(31), cells = [];
  for (let f = 0; f < 16; f++) {
    const style = r() < 0.18 ? 'wide' : r() < 0.35 ? 'split' : 'std';
    for (let c = 0; c < 16; c++) {
      const v = r();
      cells.push({ style, lit: v < 0.42, col: v < 0.08 ? '#ff6fb5' : v < 0.17 ? '#7fe8ff' : v < 0.21 ? '#b6ff8a' : r() < 0.5 ? '#ffd98a' : '#ffe9c4',
        blind: r() < 0.3 ? 0.2 + r() * 0.6 : 0, plant: r() < 0.08, dim: 0.55 + r() * 0.45 });
    }
  }
  return cells;
})();
function nightWinRect(c, col, row) {
  const X = col * 64, Y = row * 64;
  return c.style === 'wide' ? [X + 4, Y + 12, 56, 30] : c.style === 'split' ? [X + 14, Y + 8, 36, 38] : [X + 12, Y + 10, 40, 34];
}
function nightWindowTex() {
  const t = canvasTex(1024, 1024, (x, w, h) => {
    const r = U.rng(19);
    x.fillStyle = '#9a96b8'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,50,100,${r() * 0.08})`; x.fillRect(r() * w, r() * h, 3 + r() * 30, 2 + r() * 8); }
    for (let f = 0; f < 16; f++) { x.fillStyle = '#6a6690'; x.fillRect(0, f * 64 + 54, w, 10); }
    NIGHT_WIN.forEach((c, i) => {
      const [X, Y, W2, H2] = nightWinRect(c, i % 16, Math.floor(i / 16));
      x.fillStyle = '#1d1838'; x.fillRect(X - 3, Y - 3, W2 + 6, H2 + 6);
      x.fillStyle = '#2a2850'; x.fillRect(X, Y, W2, H2);
      x.fillStyle = '#1d1838'; if (c.style !== 'wide') x.fillRect(X + W2 / 2 - 1.5, Y, 3, H2); else { x.fillRect(X + W2 / 3, Y, 2, H2); x.fillRect(X + 2 * W2 / 3, Y, 2, H2); }
      if (c.blind) { x.fillStyle = '#4a4670'; x.fillRect(X, Y, W2, H2 * c.blind); x.fillStyle = '#3a3660'; for (let k = 3; k < H2 * c.blind; k += 4) x.fillRect(X, Y + k, W2, 1); }
      if (c.plant) { x.fillStyle = '#1a3a22'; x.beginPath(); x.ellipse(X + 9, Y + H2 - 7, 7, 9, 0, 0, 7); x.fill(); }
    });
  }, { repeat: true }).tex;
  t.repeat.set(0.25, 0.25); return t;
}
function nightGlowTex() {
  const t = canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    NIGHT_WIN.forEach((c, i) => {
      if (!c.lit) return;
      const [X, Y, W2, H2] = nightWinRect(c, i % 16, Math.floor(i / 16));
      const g = x.createLinearGradient(X, Y, X, Y + H2); g.addColorStop(0, c.col); g.addColorStop(1, '#000');
      x.globalAlpha = c.dim; x.fillStyle = c.col; x.fillRect(X, Y, W2, H2); x.globalAlpha = 0.35 * c.dim; x.fillStyle = g; x.fillRect(X, Y, W2, H2); x.globalAlpha = 1;
      x.fillStyle = '#000'; if (c.style !== 'wide') x.fillRect(X + W2 / 2 - 1.5, Y, 3, H2); else { x.fillRect(X + W2 / 3, Y, 2, H2); x.fillRect(X + 2 * W2 / 3, Y, 2, H2); }
      if (c.blind) { x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(X, Y, W2, H2 * c.blind); }
      if (c.plant) { x.fillStyle = '#000'; x.beginPath(); x.ellipse(X + 9, Y + H2 - 7, 7, 9, 0, 0, 7); x.fill(); }
    });
  }, { repeat: true }).tex;
  t.repeat.set(0.25, 0.25); return t;
}
function worldMaterials(night) {
  if (night) {
    if (G.worldMatsNight) return G.worldMatsNight;
    const base = worldMaterials(false), M2 = Object.assign({}, base);
    M2.wall = new THREE.MeshToonMaterial({ vertexColors: true, map: nightWindowTex(), emissiveMap: nightGlowTex(), emissive: 0xffffff, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    G.worldMatsNight = M2; return M2;
  }
  if (G.worldMats) return G.worldMats;
  const T = (draw) => canvasTex(256, 256, draw, { repeat: true }).tex;
  const grass = T((x, w, h) => {
    const r = U.rng(21);
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#e6efe0' : '#ffffff'; x.fillRect(i * 64, 0, 64, h); }
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(30,70,20,${r() * 0.12})`; x.fillRect(r() * w, r() * h, 2, 5 + r() * 5); }
  });
  const leaf = T((x, w, h) => {
    const r = U.rng(9); x.fillStyle = '#f2f7ee'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? 'rgba(20,60,30,.22)' : 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(r() * w, r() * h, 6 + r() * 10, 4 + r() * 6, r() * 3, 0, 7); x.fill(); }
  });
  const paving = T((x, w, h) => {
    const r = U.rng(4); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(80,60,110,${0.04 + r() * 0.07})`; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
    x.strokeStyle = 'rgba(40,30,70,.28)'; x.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); }
  });
  const wood = T((x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? 'rgba(90,50,20,.08)' : 'rgba(90,50,20,.02)'; x.fillRect(0, i * 32, w, 32); x.fillStyle = 'rgba(60,30,10,.35)'; x.fillRect(0, i * 32 + 30, w, 2); }
  });
  const sand = T((x, w, h) => { const r = U.rng(2); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(120,90,40,${r() * 0.15})`; x.fillRect(r() * w, r() * h, 2, 2); } });
  const water = T((x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 4; x.fillStyle = 'rgba(30,120,200,.25)'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { x.beginPath(); const y = i * 26 + 8; x.moveTo(10 + (i % 3) * 40, y); x.quadraticCurveTo(40 + (i % 3) * 40, y - 8, 70 + (i % 3) * 40, y); x.stroke(); }
  });
  const tile = T((x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 7 === 0 ? 'rgba(80,90,140,.12)' : 'rgba(255,255,255,1)'; x.fillRect(i * 32 + 2, j * 16 + 2, 28, 12); }
    x.strokeStyle = 'rgba(40,40,70,.25)'; x.lineWidth = 2; for (let j = 0; j <= 16; j++) { x.beginPath(); x.moveTo(0, j * 16); x.lineTo(w, j * 16); x.stroke(); }
    for (let j = 0; j < 16; j++) for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32 + (j % 2) * 16, j * 16); x.lineTo(i * 32 + (j % 2) * 16, j * 16 + 16); x.stroke(); }
  });
  const brick = T((x, w, h) => {
    const r = U.rng(13); x.fillStyle = '#d8d0c8'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(${120 + r() * 40},${60 + r() * 30},${50 + r() * 20},.35)`; x.fillRect(i * 64 + (j % 2) * 32 + 3, j * 32 + 3, 58, 26); }
    for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(20,40,20,.08)'; x.fillRect(r() * w, r() * h, 3, 3); }
  });
  const asphalt = T((x, w, h) => {
    const r = U.rng(17); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.12})`; x.fillRect(r() * w, r() * h, 2, 2); }
    for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2; x.beginPath(); const a = r() * w, b = r() * h; x.moveTo(a, b); x.lineTo(a + r() * 60 - 30, b + r() * 60 - 30); x.stroke(); }
  });
  const tWin = makeWindowTex().tex, tRoof = makeRoofTex().tex;
  const M = (map, extra = {}) => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, map, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }, extra));
  G.worldMats = {
    wall: M(tWin), roof: M(tRoof), plain: M(null), grass: M(grass), leaf: M(leaf), paving: M(paving), wood: M(wood), sand: M(sand),
    tile: M(tile), brick: M(brick), asphalt: M(asphalt),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    glass: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshBasicMaterial({ vertexColors: true, map: water, transparent: true, opacity: 0.72, depthWrite: false }),
    waterTex: water
  };
  return G.worldMats;
}

function makeKit(meta) {
  const W = Object.assign({ boxes: [], camBoxes: [], ramps: [], rails: [], relays: [], tapes: [], pads: [], drones: [], dyn: [], waters: [],
    group: new THREE.Group(), killY: -24 }, meta);
  const B = new StaticBatch();
  const scene = W.group;
  const railDefs = [];
  const K = { W, B, scene };
  W.addDyn = (b) => { b.dyn = true; W.boxes.push(b); return b; };

  K.box = (x0, y0, z0, x1, y1, z1, color, kind = 'plain', o = {}) => {
    B.box(x0, y0, z0, x1, y1, z1, color, kind, o);
    if (o.collide !== false) W.boxes.push({ x0, y0, z0, x1, y1, z1, tag: o.tag, nocam: o.nocam });
  };
  K.bld = (x0, z0, x1, z1, top, color, roof, trim = '#14101f', base = STREET) => {
    K.box(x0, base, z0, x1, top, z1, color, 'building', { roofColor: roof, outlineT: 0.16 });
    B.box(x0 - 0.18, top - 0.75, z0 - 0.18, x1 + 0.18, top - 0.1, z1 + 0.18, trim, 'plain', { outlineT: 0, edges: false });
  };
  K.ramp = (x0, z0, x1, z1, axis, h0, h1, color, plank = false, base = 0, kind = 'plain') => {
    const g = wedgeGeo(x0, z0, x1, z1, axis, h0, h1, base, plank);
    B.add(g, new THREE.Matrix4(), color, kind, { outlineT: 0.08 });
    W.ramps.push({ x0, z0, x1, z1, axis, h0, h1, base: plank ? null : base });
  };
  K.cyl = (x, y0, z, r, h, color, o = {}) => {
    const g = new THREE.CylinderGeometry(r, o.r2 ?? r, h, o.seg || 14);
    B.add(g, new THREE.Matrix4().makeTranslation(x, y0 + h / 2, z), color, o.kind || 'plain', { outlineT: o.outline ?? 0.07, edges: false });
  };
  K.sphere = (x, y, z, r, color, o = {}) => {
    const g = new THREE.SphereGeometry(r, o.seg || 12, o.seg ? Math.ceil(o.seg * 0.7) : 9);
    const m = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion(), V3(o.sx || 1, o.sy || 1, o.sz || 1));
    B.add(g, m, color, o.kind || 'plain', { outlineT: o.outline ?? 0.1, edges: false });
  };
  K.rod = (a, b, r, color, outlineT = 0.035) => {
    const dir = V3().subVectors(b, a), len = dir.length();
    const g = new THREE.CylinderGeometry(r, r, len, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
    const m = new THREE.Matrix4().compose(V3().addVectors(a, b).multiplyScalar(0.5), q, V3(1, 1, 1));
    B.add(g, m, color, 'plain', { outlineT, edges: false });
  };
  // rails: pts are the riding line (where the skates sit).
  // o: { color, kind: 'rail'|'cable'|'pipe', round (corner radius), sag (cable dip per 20 m), loop,
  //      posts (false = none), postMax, radius, endBoost (extra lift when you fly off an end), hidden }
  K.rail = (pts, o = {}) => { railDefs.push({ pts: pts.map(p => Array.isArray(p) ? V3(...p) : p.clone()), ...o }); };
  K.ac = (x, z, base, w = 2, h = 1.2, d = 2, col = '#e9e4f5') => {
    K.box(x - w / 2, base, z - d / 2, x + w / 2, base + h, z + d / 2, col, 'plain', { outlineT: 0.07 });
    K.cyl(x, base + h, z, Math.min(w, d) * 0.32, 0.12, '#14101f', { outline: 0 });
  };
  // a tree: trunk collider + blobby canopy
  K.tree = (x, z, base = 0, { h = 3.2, r = 2.3, color = '#3fbf6a', trunk = '#8a5a3c', collide = true, top = null } = {}) => {
    K.cyl(x, base, z, 0.35, h + 0.5, trunk, { outline: 0.05, seg: 8 });
    K.sphere(x, base + h + r * 0.55, z, r, color, { kind: 'leaf', outline: 0.12 });
    K.sphere(x + r * 0.55, base + h + r * 0.25, z + r * 0.2, r * 0.7, color, { kind: 'leaf', outline: 0.1 });
    K.sphere(x - r * 0.5, base + h + r * 0.3, z - r * 0.3, r * 0.65, color, { kind: 'leaf', outline: 0.1 });
    if (collide) W.boxes.push({ x0: x - 0.4, y0: base, z0: z - 0.4, x1: x + 0.4, y1: base + h, z1: z + 0.4, tag: 'tree' });
    W.camBoxes.push({ x0: x - r * 1.1, y0: base + h - r * 0.2, z0: z - r * 1.1, x1: x + r * 1.1, y1: base + h + r * 1.5, z1: z + r * 1.1 });
    if (top) W.boxes.push({ x0: x - top, y0: base + h + r * 0.4, z0: z - top, x1: x + top, y1: base + h + r * 1.5, z1: z + top, tag: 'canopy' });
  };
  K.bench = (x, z, alongX = true, base = 0, color = '#c97a3c', rail = true) => {
    const hw = 2, hd = 0.4;
    const [x0, x1, z0, z1] = alongX ? [x - hw, x + hw, z - hd, z + hd] : [x - hd, x + hd, z - hw, z + hw];
    K.box(x0, base + 0.38, z0, x1, base + 0.5, z1, color, 'wood', { outlineT: 0.04 });
    for (const s of [-1, 1]) {
      const lx = alongX ? x + s * (hw - 0.3) : x, lz = alongX ? z : z + s * (hw - 0.3);
      B.box(lx - 0.12, base, lz - 0.3, lx + 0.12, base + 0.38, lz + 0.3, '#3a3550', 'plain', { outlineT: 0.02, edges: false });
    }
    W.boxes.push({ x0, y0: base, z0, x1, y1: base + 0.38, z1, tag: 'benchleg' });
    if (rail) { if (alongX) K.rail([[x0 + 0.1, base + 0.52, z], [x1 - 0.1, base + 0.52, z]], { hidden: true }); else K.rail([[x, base + 0.52, z0 + 0.1], [x, base + 0.52, z1 - 0.1]], { hidden: true }); }
  };
  K.lamp = (x, z, base = 0) => {
    K.cyl(x, base, z, 0.1, 4, '#3a3550', { outline: 0.03, seg: 6 });
    K.sphere(x, base + 4.25, z, 0.4, '#fff3c4', { outline: 0.04, seg: 10 });
    W.boxes.push({ x0: x - 0.15, y0: base, z0: z - 0.15, x1: x + 0.15, y1: base + 4, z1: z + 0.15, tag: 'lamp' });
  };
  K.water = (x0, z0, x1, z1, y, color = '#7fd3ff', deep = false) => {
    B.box(x0, y - 0.02, z0, x1, y, z1, color, 'water', { outlineT: 0, edges: false });
    W.waters.push({ x0, z0, x1, z1, y, deep });
  };

  // invisible collision box
  K.collider = (x0, y0, z0, x1, y1, z1, o = {}) => { W.boxes.push({ x0, y0, z0, x1, y1, z1, tag: o.tag, nocam: o.nocam }); };
  // a deck (road, walkway) following a path: solid ribbon + tile colliders on top
  K.deck = (path, width, y, o = {}) => {
    const P = path.map(p => Array.isArray(p) ? V3(p[0], y, p[1]) : V3(p.x, y, p.z));
    if (o.loop) P.push(P[0].clone());
    const th = o.thick ?? 1, hw = width / 2, pos = [], idx = [];
    const n = P.length, side = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      side.push([-tz, tx]);
    }
    const ring = [];
    for (let i = 0; i < n; i++) {
      const p = P[i], [sx, sz] = side[i];
      ring.push([p.x + sx * hw, y, p.z + sz * hw], [p.x - sx * hw, y, p.z - sz * hw], [p.x - sx * hw, y - th, p.z - sz * hw], [p.x + sx * hw, y - th, p.z + sz * hw]);
    }
    for (const v of ring) pos.push(...v);
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = a + 4, d = b + 4;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const ng = g.toNonIndexed(); ng.computeVertexNormals();
    B.add(ng, null, o.color || '#4a4560', o.kind || 'asphalt', { outlineT: 0, edges: false });
    // outline: a slightly fatter copy, back-faced
    const op = [];
    for (let i = 0; i < n; i++) { const p = P[i], [sx, sz] = side[i], hw2 = hw + 0.12;
      op.push([p.x + sx * hw2, y + 0.06, p.z + sz * hw2], [p.x - sx * hw2, y + 0.06, p.z - sz * hw2], [p.x - sx * hw2, y - th - 0.06, p.z - sz * hw2], [p.x + sx * hw2, y - th - 0.06, p.z + sz * hw2]); }
    const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(op.flat(), 3)); og.setIndex(idx);
    B.addOutline(og.toNonIndexed());
    // tile colliders
    const T = o.tile || 2;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p.x - hw); x1 = Math.max(x1, p.x + hw); z0 = Math.min(z0, p.z - hw); z1 = Math.max(z1, p.z + hw); }
    const distTo = (x, z) => { let best = 1e9; for (let i = 0; i < n - 1; i++) { const a = P[i], b = P[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1; const t = U.clamp(((x - a.x) * dx + (z - a.z) * dz) / L2, 0, 1); best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t)); } return best; };
    for (let x = Math.floor(x0 / T) * T; x < x1; x += T) for (let z = Math.floor(z0 / T) * T; z < z1; z += T)
      if (distTo(x + T / 2, z + T / 2) <= hw - T * 0.25) W.boxes.push({ x0: x, y0: y - th, z0: z, x1: x + T, y1: y, z1: z + T, tag: o.tag, nocam: true });
  };
  // round wall seen from the inside (cisterns, halls), with gaps (angle ranges) for doorways
  K.cylWall = (cx, cz, r, y0, y1, color, gaps = [], kind = 'brick', outward = false) => {
    const inGap = (a) => gaps.some(([g0, g1]) => { let x = ((a - g0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); return x <= ((g1 - g0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); });
    const seg = Math.ceil(r * 1.2), pos = [];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      if (inGap((a0 + a1) / 2)) continue;
      const p0 = [cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r];
      // inward facing quad (or outward, for a parapet seen from outside)
      if (outward) pos.push(p0[0], y0, p0[1], p1[0], y1, p1[1], p1[0], y0, p1[1], p0[0], y0, p0[1], p0[0], y1, p0[1], p1[0], y1, p1[1]);
      else pos.push(p0[0], y0, p0[1], p1[0], y0, p1[1], p1[0], y1, p1[1], p0[0], y0, p0[1], p1[0], y1, p1[1], p0[0], y1, p0[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    B.add(g, null, color, kind, { outlineT: 0, edges: false });
    const step = 1.6 / r;
    for (let a = 0; a < Math.PI * 2; a += step) {
      if (inGap(a)) continue;
      const rr = outward ? r - 0.6 : r + 0.6, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      W.boxes.push({ x0: x - 1, y0, z0: z - 1, x1: x + 1, y1, z1: z + 1, nocam: true });
    }
  };
  // a ring or disc floor (ring of tiles) around (cx, cz)
  K.ringDeck = (cx, cz, rIn, rOut, y, o = {}) => {
    const rm = (rIn + rOut) / 2, n = Math.max(24, Math.ceil(rm * 0.8)), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * rm, cz + Math.sin(a) * rm]); }
    K.deck(pts, rOut - rIn, y, Object.assign({ loop: true, tile: 1.0 }, o));
  };
  // a curtain of falling water, scrolling, with spray at the bottom
  K.waterfall = (x0, x1, z, yTop, yBot, color = '#9fffd0') => {
    const tex = canvasTex(64, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 20 + Math.random() * 60); } }, { repeat: true }).tex;
    tex.repeat.set((x1 - x0) / 4, (yTop - yBot) / 10);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, yTop - yBot), new THREE.MeshBasicMaterial({ color, map: tex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set((x0 + x1) / 2, (yTop + yBot) / 2, z); scene.add(m);
    W.dyn.push({ update(dt) { tex.offset.y += dt * 1.6; if (Game.fx && Math.random() < 0.5) Game.fx.emit(_kv.set(U.lerp(x0, x1, Math.random()), yBot + 0.2, z + (Math.random() - 0.5)), _kv2.set((Math.random() - 0.5) * 3, 2 + Math.random() * 3, (Math.random() - 0.5) * 3), '#d8ffe8', 0.6, 9); } });
  };
  // glowing neon sign; flickers off on the downbeat now and then
  K.neon = (lines, x, y, z, w, h, rotY, o = {}) => {
    const cols = o.colors || [PAL.magenta, PAL.cyan, PAL.yellow];
    const nc = canvasTex(512, Math.round(512 * h / w), (c, cw, ch, on = 1) => {
      c.fillStyle = o.bg || '#140a26'; c.fillRect(0, 0, cw, ch);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const n = lines.length;
      lines.forEach((ln, i) => {
        let size = Math.min(ch / (n + 0.4) * 0.8, 90); c.font = `${size}px ${i === 0 ? FONT.display : FONT.dot}`;
        while (c.measureText(ln).width > cw - 30 && size > 12) { size -= 2; c.font = `${size}px ${i === 0 ? FONT.display : FONT.dot}`; }
        const col = cols[i % cols.length];
        c.shadowColor = on ? col : 'transparent'; c.shadowBlur = 22;
        c.fillStyle = on ? '#ffffff' : '#3a2a4a'; c.fillText(ln, cw / 2, ch / 2 + (i - (n - 1) / 2) * ch / (n + 0.2));
        c.shadowBlur = 0; c.strokeStyle = on ? col : '#2a1a3a'; c.lineWidth = 3; c.strokeText(ln, cw / 2, ch / 2 + (i - (n - 1) / 2) * ch / (n + 0.2));
      });
      c.strokeStyle = on ? cols[0] : '#2a1a3a'; c.lineWidth = 8; c.shadowColor = on ? cols[0] : 'transparent'; c.shadowBlur = 16; c.strokeRect(8, 8, cw - 16, ch - 16); c.shadowBlur = 0;
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: nc.tex, side: o.double ? THREE.DoubleSide : THREE.FrontSide }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m);
    if (o.flicker !== false) { let last = 1; const seed = Math.random() * 4 | 0; W.dyn.push({ update(dt, bi) { const on = (bi.inBar === seed && bi.phase < 0.1 && (bi.bar % 2 === 0)) ? 0 : 1; if (on !== last) { last = on; nc.redraw(on); } } }); }
    return m;
  };
  // something that travels a path and carries/knocks the player (trams, trains, barges)
  K.mover = ({ path, size, y, speed, loop = true, visual, hazard = true, msg, phase = 0, onPass }) => {
    const P = path.map(p => V3(p[0], y, p[1])); if (loop) P.push(P[0].clone());
    const segs = []; let L = 0; for (let i = 0; i < P.length - 1; i++) { const len = P[i].distanceTo(P[i + 1]); segs.push({ a: P[i], b: P[i + 1], len, s0: L }); L += len; }
    const [sx, sy, sz] = size;
    const col = { x0: 0, y0: y, z0: 0, x1: 0, y1: y + sy, z1: 0, tag: 'mover', vx: 0, vz: 0, hazard, msg, dyn: true };
    W.addDyn ? W.addDyn(col) : W.boxes.push(Object.assign(col, { dyn: true }));
    scene.add(visual);
    const M = { col, visual, s: phase * L, dir: 1, L };
    W.dyn.push({ update(dt) {
      let s = M.s + speed * dt * M.dir;
      if (loop) s = ((s % L) + L) % L; else if (s > L || s < 0) { M.dir *= -1; s = U.clamp(s, 0, L); }
      M.s = s;
      let g = segs[0]; for (const sg of segs) if (s >= sg.s0 && s <= sg.s0 + sg.len) g = sg;
      const t = (s - g.s0) / g.len, x = U.lerp(g.a.x, g.b.x, t), z = U.lerp(g.a.z, g.b.z, t);
      const dx = (g.b.x - g.a.x) / g.len * M.dir, dz = (g.b.z - g.a.z) / g.len * M.dir;
      const along = Math.abs(dx) > Math.abs(dz);
      const hx = (along ? sz : sx) / 2, hz = (along ? sx : sz) / 2;
      col.vx = dx * speed; col.vz = dz * speed;
      col.x0 = x - hx; col.x1 = x + hx; col.z0 = z - hz; col.z1 = z + hz;
      visual.position.set(x, y, z); visual.rotation.y = Math.atan2(dx, dz);
      if (onPass) onPass(M, x, z);
    } });
    (W.movers || (W.movers = [])).push(M);
    return M;
  };
  // rain streaks that follow the camera around
  K.rain = (n = 420, color = 0xa9b8ff) => {
    const pos = new Float32Array(n * 6), drops = [];
    for (let i = 0; i < n; i++) drops.push({ x: (Math.random() - 0.5) * 60, y: Math.random() * 30, z: (Math.random() - 0.5) * 60, v: 26 + Math.random() * 10 });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, fog: true }));
    ls.frustumCulled = false; scene.add(ls);
    W.dyn.push({ update(dt) {
      const c = G.camera.position;
      for (let i = 0; i < n; i++) {
        const d = drops[i]; d.y -= d.v * dt;
        if (d.y < -12) { d.y = 18 + Math.random() * 8; d.x = (Math.random() - 0.5) * 60; d.z = (Math.random() - 0.5) * 60; }
        const x = c.x + d.x, y = c.y + d.y, z = c.z + d.z;
        pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x - 0.05; pos[i * 6 + 4] = y - 0.9; pos[i * 6 + 5] = z;
      }
      g.attributes.position.needsUpdate = true;
    } });
  };
  K.poster = (lines, x, y, z, w, h, rotY, opts = {}) => {
    const t = posterTex(lines, opts).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: t, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: opts.double ? THREE.DoubleSide : THREE.FrontSide }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m); return m;
  };
  K.sticker = (txt, x, y, z, rotY, s = 1.6) => {
    const t = canvasTex(256, 256, (c) => {
      c.translate(128, 128); c.rotate(-0.15);
      c.fillStyle = PAL.ink; c.beginPath(); c.moveTo(-20, -110); c.lineTo(60, -110); c.lineTo(10, -10); c.lineTo(70, -10); c.lineTo(-50, 115); c.lineTo(-10, 15); c.lineTo(-60, 15); c.closePath(); c.fill();
      c.fillStyle = PAL.magenta; c.scale(0.86, 0.86); c.fill();
      c.fillStyle = PAL.yellow; c.font = `46px ${FONT.display}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8; c.strokeStyle = PAL.ink; c.strokeText(txt, 0, 0); c.fillText(txt, 0, 0);
    }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m); return m;
  };
  K.floorArrow = (x, y, z, rot, col = PAL.magenta, size = 2.4) => {
    const t = canvasTex(128, 128, (c) => { c.fillStyle = col; c.beginPath(); c.moveTo(64, 8); c.lineTo(118, 70); c.lineTo(84, 70); c.lineTo(84, 120); c.lineTo(44, 120); c.lineTo(44, 70); c.lineTo(10, 70); c.closePath(); c.fill(); }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, y + 0.03, z); scene.add(m); return m;
  };

  // giant broadcast screen (Minister / DJ Static / static)
  K.screen = (pos, w, h, rotY = 0, name = null) => {
    const st = { mode: 'minister', talking: false, wink: false, mood: 'happy', caption: 'GOOD EVENING, GLEAM CITY!', t: 0, acc: 0 };
    const sc = canvasTex(640, 360, (x, cw, ch) => {
      if (st.mode === 'dj') drawDJ(x, cw, ch, st.t, st);
      else if (st.mode === 'news') drawNews(x, cw, ch, st.t, st);
      else if (st.mode === 'project') drawDossier(x, cw, ch, st.t, st);
      else if (st.mode === 'off') { x.fillStyle = '#0b0b14'; x.fillRect(0, 0, cw, ch); }
      else if (st.mode === 'static') { drawStatic(x, cw, ch); x.fillStyle = 'rgba(255,46,136,.25)'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#fff'; x.font = `40px ${FONT.dot}`; x.textAlign = 'center'; x.fillText('SIGNAL INTERRUPTED', cw / 2, ch / 2); x.textAlign = 'left'; }
      else drawMinister(x, cw, ch, st.t, st);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sc.tex, fog: false }));
    mesh.position.copy(pos); mesh.rotation.y = rotY; scene.add(mesh);
    const S = { st, sc, mesh, pos: pos.clone(), rotY };
    if (name) (W.screens || (W.screens = {}))[name] = S; else W.screen = S;
    W.dyn.push({ update(dt) { if (!mesh.visible) return; st.t += dt; st.acc += dt; if (st.acc > 1 / 15) { st.acc = 0; sc.redraw(); } } });
    return S;
  };

  K.relays = (defs) => {
    for (const d of defs) {
      const g = new THREE.Group(); g.position.copy(d.pos); scene.add(g);
      g.add(at(part(new THREE.BoxGeometry(1.6, 0.5, 1.6), '#3a3550', 0.05), 0, 0.25, 0));
      const mast = part(new THREE.CylinderGeometry(0.12, 0.16, 3, 8), '#d9d4ea', 0.03); mast.position.y = 2; g.add(mast);
      const spk = part(new THREE.BoxGeometry(0.9, 1.1, 0.7), '#6a3df0', 0.04); spk.position.set(0, 1.05, 0); g.add(spk);
      const cone = part(new THREE.CylinderGeometry(0.32, 0.22, 0.1, 14), '#14101f', 0); cone.rotation.x = Math.PI / 2; cone.position.set(0, 1.1, 0.37); g.add(cone);
      const dishG = new THREE.Group(); dishG.position.y = 3.3; g.add(dishG);
      const dish = part(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), '#f4f1ff', 0.04, { side: THREE.DoubleSide });
      dish.rotation.x = -Math.PI / 2 + 0.5; dishG.add(dish);
      const horn = part(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), '#14101f', 0); horn.position.set(0, 0.35, 0.3); horn.rotation.x = 0.9; dishG.add(horn);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2244 })); bulb.position.y = 3.65; g.add(bulb);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, 80, 10, 1, true), beamMat); beam.position.y = 42; g.add(beam);
      const rings = [];
      for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0 })); r.rotation.x = Math.PI / 2; r.position.y = 0.2; g.add(r); rings.push(r); }
      if (d.style === 'scrambler') {   // Bolt's scrambler, clamped onto the relay
        const sc = part(new THREE.BoxGeometry(0.7, 0.5, 0.5), '#8ff0c8', 0.03); sc.position.set(0.55, 1.9, 0.1); g.add(sc);
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.02), basic('#14101f')); led.position.set(0.55, 1.95, 0.36); g.add(led); d.led = led;
        spk.material = toon('#2b2d42');
      } else if (d.style === 'junction') {
        spk.scale.set(1.3, 1.6, 1.1); spk.position.y = 1.4; spk.material = toon('#5b6078');
      } else if (d.style === 'valve') {
        dishG.visible = false; mast.visible = false; bulb.position.y = 2.6;
        const wheel = part(new THREE.TorusGeometry(0.7, 0.09, 6, 18), '#ff2e88', 0.03); wheel.position.set(0, 1.9, 0.45); g.add(wheel); d.wheel = wheel;
        for (let i = 0; i < 3; i++) { const sp = part(new THREE.BoxGeometry(1.3, 0.07, 0.07), '#ff2e88', 0); sp.rotation.z = i * Math.PI / 3; wheel.add(sp); }
        const pipe = part(new THREE.CylinderGeometry(0.35, 0.35, 2.6, 12), '#8a8fa8', 0.03); pipe.position.y = 1.3; g.add(pipe);
      }
      W.relays.push({ ...d, g, dishG, bulb, beam, rings, cone, active: false, t: Math.random() * 3 });
    }
  };
  K.tapes = (defs) => {
    const tapeTex = canvasTex(128, 80, (x, w, h) => {
      x.fillStyle = '#ffd23f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff6c8'; x.fillRect(10, 8, w - 20, 34);
      x.fillStyle = PAL.ink; x.font = `16px ${FONT.display}`; x.fillText('STATIC MIX', 18, 30);
      x.fillStyle = '#6b4b00'; x.beginPath(); x.arc(40, 58, 12, 0, 7); x.arc(88, 58, 12, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(40, 58, 5, 0, 7); x.arc(88, 58, 5, 0, 7); x.fill();
    }).tex;
    for (const d of defs) {
      const g = new THREE.Group(); g.position.copy(d.pos); scene.add(g);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.14), [toon('#ffd23f'), toon('#ffd23f'), toon('#ffd23f'), toon('#ffd23f'), new THREE.MeshBasicMaterial({ map: tapeTex }), new THREE.MeshBasicMaterial({ map: tapeTex })]);
      outline(body, 0.03); g.add(body);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
      g.add(glow);
      W.tapes.push({ ...d, g, body, glow, got: false, t: Math.random() * 6 });
    }
  };
  K.pads = (defs) => {
    for (const d of defs) {
      const g = new THREE.Group(); g.position.copy(d.pos); scene.add(g);
      g.add(at(part(new THREE.BoxGeometry(2.6, 0.25, 2.6), '#14101f', 0.04), 0, 0.125, 0));
      const rim = part(new THREE.CylinderGeometry(1.1, 1.15, 0.2, 20), '#ffd23f', 0.03); rim.position.y = 0.3; g.add(rim);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.2, 0.18, 20, 1, true), toon('#3a3550', { side: THREE.DoubleSide })); cone.position.y = 0.33; g.add(cone);
      const cap = part(new THREE.SphereGeometry(0.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#ff2e88', 0.02); cap.position.y = 0.25; g.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 6, 32), new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.45; g.add(ring);
      const ar = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), basic(PAL.yellow)); ar.rotation.x = Math.PI / 2; ar.position.set(0, 0.32, 1.65);
      const arG = new THREE.Group(); arG.add(ar); arG.rotation.y = Math.atan2(d.aim.x, d.aim.z); g.add(arG);
      W.pads.push({ ...d, g, cone, cap, ring, r: 1.4 });
      W.boxes.push({ x0: d.pos.x - 1.3, y0: d.pos.y, z0: d.pos.z - 1.3, x1: d.pos.x + 1.3, y1: d.pos.y + 0.25, z1: d.pos.z + 1.3, tag: 'pad' });
    }
  };
  K.drones = (defs) => {
    const dfaces = droneFaces();
    for (const d of defs) {
      const dr = new Drone(dfaces);
      const pts = d.path.map(p => V3(...p));
      let L = 0; const segs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; segs.push({ a, b, len: a.distanceTo(b), s0: L }); L += a.distanceTo(b); }
      const coneMat = new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 20, 1, true), coneMat); cone.position.y = -2; dr.root.add(cone);
      const spot = new THREE.Mesh(new THREE.CircleGeometry(3.2, 28), new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      spot.rotation.x = -Math.PI / 2; scene.add(spot);
      scene.add(dr.root);
      W.drones.push({ dr, segs, L, s: d.phase * L, speed: d.speed, cone, spot, alt: 4, vibe: 0, ground: 0, radius: 3.2, yaw: 0, talkT: 0 });
    }
  };
  // a shutter door that opens on beats 1–2 of each bar.
  // face 'x': door lies in a plane of constant x (spans z a0..a1); face 'z': constant z (spans x a0..a1)
  K.shutter = ({ face, c, a0, a1, y0, h }) => {
    const st = canvasTex(128, 128, (x, w, hh) => { for (let y = 0; y < hh; y += 16) { x.fillStyle = '#e9e4f5'; x.fillRect(0, y, w, 12); x.fillStyle = '#9b97ad'; x.fillRect(0, y + 12, w, 4); } }).tex;
    const span = a1 - a0, mid = (a0 + a1) / 2;
    const door = new THREE.Mesh(face === 'x' ? new THREE.BoxGeometry(0.3, h + 0.05, span) : new THREE.BoxGeometry(span, h + 0.05, 0.3), toon('#ffffff', { map: st, noCache: true }));
    outline(door, 0.04); scene.add(door);
    const col = face === 'x' ? { x0: c - 0.15, y0, z0: a0, x1: c + 0.15, y1: y0 + h, z1: a1, tag: 'door' } : { x0: a0, y0, z0: c - 0.15, x1: a1, y1: y0 + h, z1: c + 0.15, tag: 'door' };
    W.boxes.push(col);
    const light = new THREE.Mesh(new THREE.BoxGeometry(face === 'x' ? 0.2 : 0.9, 0.25, face === 'x' ? 0.9 : 0.2), basic('#ff2244'));
    if (face === 'x') light.position.set(c + 0.35, y0 + h + 0.4, mid); else light.position.set(mid, y0 + h + 0.4, c + 0.35);
    scene.add(light);
    W.shutter = { door, col, light, open: 0 };
    W.dyn.push({ update(dt, bi) {
      const ib = ((bi.b % 4) + 4) % 4;
      let o = ib < 0.2 ? ib / 0.2 : ib < 1.8 ? 1 : ib < 2.05 ? 1 - (ib - 1.8) / 0.25 : 0;
      if (!bi.playing) o = 0;
      W.shutter.open = o;
      const bottom = y0 + (h + 0.1) * o;
      col.y0 = bottom; col.y1 = Math.max(bottom + 0.05, y0 + h);
      if (face === 'x') door.position.set(c, bottom + h / 2, mid); else door.position.set(mid, bottom + h / 2, c);
      light.material.color.set(o > 0.6 ? 0x33ff88 : 0xff2244);
    } });
  };
  // a platform that rides an 8-beat cycle between y0 and y1
  // piston: true hangs a rod under the plate (sinks into a base block the world draws) and drops the guide posts
  K.lift = ({ x0, z0, x1, z1, y0, y1, postBase = y0 - 1, phase = 0, piston = false, color = '#3a3550' }) => {
    const plat = new THREE.Group(); scene.add(plat);
    const hz = canvasTex(128, 128, (x, w, h) => { x.fillStyle = PAL.yellow; x.fillRect(0, 0, w, h); x.fillStyle = PAL.ink; for (let i = -4; i < 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 16 + 128, h); x.lineTo(i * 32 + 128, h); x.fill(); } }, { repeat: true }).tex;
    const w = x1 - x0, d = z1 - z0;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), [toon(color), toon(color), toon('#ffffff', { map: hz, noCache: true }), toon(color), toon(color), toon(color)]);
    outline(top, 0.06); top.position.y = -0.25; plat.add(top);
    const spk = part(new THREE.CylinderGeometry(Math.min(w, d) * 0.25, Math.min(w, d) * 0.28, 0.6, 16), '#14101f', 0.04); spk.position.y = -0.8; plat.add(spk);
    if (piston) { const len = y1 - y0 + 0.6, rod = part(new THREE.CylinderGeometry(Math.min(w, d) * 0.18, Math.min(w, d) * 0.18, len, 12), '#d9d4ea', 0.04); rod.position.y = -0.5 - len / 2; plat.add(rod); }
    else for (const [x, z] of [[x0 + 0.3, z0 - 0.3], [x1 - 0.3, z0 - 0.3], [x0 + 0.3, z1 + 0.3], [x1 - 0.3, z1 + 0.3]]) K.cyl(x, postBase, z, 0.15, y1 + 2 - postBase, '#5b4a6b', { outline: 0.03 });
    const col = { x0, y0: y0 - 0.5, z0, x1, y1: y0, z1, tag: 'lift' };
    W.boxes.push(col);
    const L = { plat, col, y: y0 }; W.lift = L; (W.lifts || (W.lifts = [])).push(L);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    W.dyn.push({ update(dt, bi) {
      const p = (((bi.b + phase) % 8) + 8) % 8;
      let s = p < 2 ? 0 : p < 4 ? U.smooth((p - 2) / 2) : p < 6 ? 1 : 1 - U.smooth((p - 6) / 2);
      if (!bi.playing) s = 0;
      const y = U.lerp(y0, y1, s);
      col.y1 = y; col.y0 = y - 0.5; L.y = y;
      plat.position.set(cx, y, cz);
      spk.scale.setScalar(1 + Math.exp(-bi.phase * 7) * 0.08);
    } });
  };

  // ---- street life: props scattered on free pavement, cars, pedestrians with umbrellas, steam, searchlights ----
  // Call before K.finish(). Everything is checked against existing colliders, so nothing lands inside a wall
  // or blocks a path that's narrower than a car.
  K.cityLife = ({ area, props = 120, cars = [], walkers = [], steam = 8, lights = [], seed = 7, avoid = [] }) => {
    const r = U.rng(seed);
    const solid = (x0, y0, z0, x1, y1, z1) => { for (const b of W.boxes) if (x1 > b.x0 && x0 < b.x1 && z1 > b.z0 && z0 < b.z1 && y1 > b.y0 && y0 < b.y1) return true; return false; };
    const floorAt = (x, z) => { let best = -1e9; for (const b of W.boxes) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.y1 <= 0.5 && b.y1 > best) best = b.y1; return best; };
    const nearRail = (x, z, d) => railDefs.some(rd => rd.pts.some(p => Math.abs(p.x - x) < d && Math.abs(p.z - z) < d && p.y < 4));
    const avoided = (x, z) => avoid.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
    const free = (x, z, rad) => { const g = floorAt(x, z); if (g < -0.5) return null; if (solid(x - rad - 0.8, g + 0.05, z - rad - 0.8, x + rad + 0.8, g + 2.2, z + rad + 0.8)) return null; if (nearRail(x, z, rad + 1.2) || avoided(x, z) || (typeof onPath === 'function' && onPath(x, z))) return null; return g; };
    // paths are only kept if a body of the given size can travel the whole way
    const pathClear = (pts, hw, y0, y1) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); for (let t = 0; t <= L; t += 1) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (floorAt(x, z) < -0.5 || solid(x - hw, y0, z - hw, x + hw, y1, z + hw)) return false; } } return true; };
    const okCars = cars.filter(p => pathClear(p, 1.4, 0.3, 1.8) || (console.warn('car path blocked', JSON.stringify(p)), false));
    // walkers: keep every clear stretch of at least 8 m along each route
    const okWalk = [];
    for (const P of walkers) for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az); let run = null;
      for (let t = 0; t <= L + 0.01; t += 1) {
        const x = ax + (bx - ax) * Math.min(t, L) / L, z = az + (bz - az) * Math.min(t, L) / L;
        const ok = floorAt(x, z) > -0.5 && !solid(x - 0.5, 0.3, z - 0.5, x + 0.5, 1.8, z + 0.5);
        if (ok) { if (!run) run = [[x, z], [x, z]]; else run[1] = [x, z]; }
        if ((!ok || t >= L) && run) { if (Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) >= 8) okWalk.push(run); run = null; }
      }
    }
    const onPath = (x, z) => okCars.concat(okWalk).some(P => { for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = U.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 3) return true; } return false; });
    // props
    const kinds = [
      (x, g, z, a) => { K.cyl(x, g, z, 0.35, 0.9, '#3a5a4a', { outline: 0.03, seg: 10 }); K.cyl(x, g + 0.9, z, 0.38, 0.08, '#2a3a32', { outline: 0.02, seg: 10 }); return 0.4; },                  // bin
      (x, g, z, a) => { const c = ['#ff2e88', '#19d3ff', '#ffd23f'][Math.floor(r() * 3)]; K.box(x - 0.5, g, z - 0.4, x + 0.5, g + 1.9, z + 0.4, '#e9e4f5', 'plain', { outlineT: 0.04 }); B.box(x - 0.42, g + 0.7, z + 0.38, x + 0.42, g + 1.8, z + 0.42, c, 'glow', { outlineT: 0, edges: false }); B.box(x - 0.42, g + 0.7, z - 0.42, x + 0.42, g + 1.8, z - 0.38, c, 'glow', { outlineT: 0, edges: false }); return 0.6; },   // vending machine
      (x, g, z, a) => { for (let k = 0; k < 3; k++) K.cyl(x + (k - 1) * 0.7, g, z, 0.26, 0.05, '#ff7a2f', { outline: 0.01, seg: 8 }) || K.cyl(x + (k - 1) * 0.7, g, z, 0.22, 0.7, '#ff7a2f', { outline: 0.02, seg: 8, r2: 0.04 }); return 1.1; },   // cones
      (x, g, z, a) => { K.box(x - 0.3, g, z - 0.25, x + 0.3, g + 1.1, z + 0.25, ['#c2415a', '#3a6aaa', '#ffd23f'][Math.floor(r() * 3)], 'plain', { outlineT: 0.03 }); return 0.35; },   // newspaper box
      (x, g, z, a) => { K.box(x - 0.6, g, z - 0.6, x + 0.6, g + 0.8, z + 0.6, '#8a6a4a', 'wood', { outlineT: 0.04 }); K.box(x - 0.45, g + 0.8, z - 0.4, x + 0.35, g + 1.4, z + 0.4, '#9a7a5a', 'wood', { outlineT: 0.03 }); return 0.65; },   // crates
      (x, g, z, a) => { K.cyl(x, g, z, 0.45, 0.6, '#5a4a6a', { outline: 0.03, seg: 10 }); K.sphere(x, g + 1.1, z, 0.6, '#2f8f6e', { kind: 'leaf', outline: 0.05, seg: 8 }); return 0.5; },   // potted plant
      (x, g, z, a) => { K.box(x - 0.55, g, z - 0.55, x + 0.55, g + 2.5, z + 0.55, '#c2415a', 'plain', { outlineT: 0.04 }); B.box(x - 0.45, g + 0.4, z + 0.5, x + 0.45, g + 2.2, z + 0.57, '#7fe8ff', 'glow', { outlineT: 0, edges: false }); return 0.6; },   // phone booth
      (x, g, z, a) => { for (let k = 0; k < 3; k++) { const zz = z + (k - 1) * 0.6; K.rod(V3(x - 0.8, g + 0.45, zz), V3(x + 0.8, g + 0.45, zz), 0.4, '#14101f', 0.01); } B.box(x - 0.9, g, z - 0.9, x + 0.9, g + 0.1, z + 0.9, '#5b6078', 'plain', { outlineT: 0, edges: false }); W.boxes.push({ x0: x - 0.9, y0: g, z0: z - 0.9, x1: x + 0.9, y1: g + 0.8, z1: z + 0.9 }); return 0; },  // parked bikes (tyres)
    ];
    let placed = 0, tries = 0;
    while (placed < props && tries++ < props * 40) {
      const x = U.lerp(area[0], area[2], r()), z = U.lerp(area[1], area[3], r());
      const g = free(x, z, 1); if (g === null) continue;
      const rad = kinds[Math.floor(r() * kinds.length)](x, g, z);
      if (rad > 0) W.boxes.push({ x0: x - rad, y0: g, z0: z - rad, x1: x + rad, y1: g + 1.2, z1: z + rad, tag: 'prop' });
      placed++;
    }
    // neon puddles
    for (let i = 0, n = 0; i < 400 && n < 40; i++) {
      const x = U.lerp(area[0], area[2], r()), z = U.lerp(area[1], area[3], r()), g = floorAt(x, z); if (g < -0.5 || g > 0.3) continue;
      const w = 1.5 + r() * 3, d = 1 + r() * 2;
      B.box(x - w / 2, g + 0.01, z - d / 2, x + w / 2, g + 0.025, z + d / 2, ['#5a2450', '#1d4a66', '#4a4420', '#2a3f5a'][n % 4], 'glow', { outlineT: 0, edges: false }); n++;
    }
    // cars: they drive back and forth and they will knock you over
    const carMesh = (c) => {
      const g = new THREE.Group();
      g.add(at(part(new THREE.BoxGeometry(2, 0.8, 4.2), c, 0.05), 0, 0.75, 0));
      g.add(at(part(new THREE.BoxGeometry(1.8, 0.7, 2.2), c, 0.04), 0, 1.45, -0.2));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.5, 2.0), basic('#2a2850')), 0, 1.45, -0.2));
      for (const sx of [-0.7, 0.7]) { g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.2, 8), basic('#fff3c4')), sx, 0.8, 2.11)); const tl = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), basic('#ff2244')); tl.rotation.y = Math.PI; tl.position.set(sx, 0.8, -2.11); g.add(tl); }
      for (const [sx, sz] of [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]]) { const w = part(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10), '#14101f', 0.01); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.35, sz); g.add(w); }
      return g;
    };
    let ci = 0;
    for (const path of okCars) {
      K.mover({ path, size: [2.1, 1.8, 4.4], y: 0, speed: 7 + r() * 4, loop: false, phase: r(), visual: carMesh(['#ff2e88', '#19d3ff', '#ffd23f', '#c6ff3d', '#9b8cff', '#ff7a2f'][ci++ % 6]),
        msg: '<b>HONK!</b><span>Driving is a privilege. So is not being hit. Look both ways.</span>' });
    }
    // pedestrians: hooded, umbrellas up, never look at you
    const peds = [];
    for (const path of okWalk) {
      const g = new THREE.Group(); scene.add(g);
      const c = ['#3a3a5a', '#5a3a4a', '#2a4a5a', '#4a4a3a'][peds.length % 4];
      g.add(at(part(new THREE.CapsuleGeometry(0.3, 0.8, 3, 8), c, 0.03), 0, 0.9, 0));
      g.add(at(part(new THREE.SphereGeometry(0.22, 10, 8), '#d9a98a', 0.03), 0, 1.75, 0));
      const um = part(new THREE.ConeGeometry(0.9, 0.4, 10, 1, true), ['#ff2e88', '#19d3ff', '#ffd23f', '#e9e4f5', '#14101f'][peds.length % 5], 0.02, { side: THREE.DoubleSide }); um.position.y = 2.35; g.add(um);
      g.add(at(part(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5), '#14101f', 0), 0, 2.0, 0));
      const P = path.map(([x, z]) => V3(x, floorAt(x, z), z)); let L = 0; const segs = [];
      for (let i = 0; i < P.length - 1; i++) { const len = P[i].distanceTo(P[i + 1]); segs.push({ a: P[i], b: P[i + 1], len, s0: L }); L += len; }
      peds.push({ g, segs, L, s: r() * L, dir: 1, sp: 1.1 + r() * 0.5, t: r() * 6 });
    }
    if (peds.length) W.dyn.push({ update(dt) {
      for (const p of peds) {
        p.s += p.sp * dt * p.dir; p.t += dt;
        if (p.s > p.L) { p.s = p.L; p.dir = -1; } else if (p.s < 0) { p.s = 0; p.dir = 1; }
        let sg = p.segs[0]; for (const q of p.segs) if (p.s >= q.s0 && p.s <= q.s0 + q.len) sg = q;
        const k = (p.s - sg.s0) / sg.len; p.g.position.lerpVectors(sg.a, sg.b, k); p.g.position.y += Math.abs(Math.sin(p.t * 6)) * 0.06;
        p.g.rotation.y = Math.atan2((sg.b.x - sg.a.x) * p.dir, (sg.b.z - sg.a.z) * p.dir);
      }
    } });
    // steam from manholes
    for (let i = 0, n = 0; i < 300 && n < steam; i++) {
      const x = U.lerp(area[0], area[2], r()), z = U.lerp(area[1], area[3], r()), g = free(x, z, 0.6); if (g === null) continue;
      K.cyl(x, g, z, 0.55, 0.04, '#2a2840', { outline: 0.01, seg: 12 }); n++;
      W.dyn.push({ update() { if (Game.fx && Math.random() < 0.35) Game.fx.emit(_kv.set(x + (Math.random() - 0.5) * 0.6, g + 0.1, z + (Math.random() - 0.5) * 0.6), _kv2.set((Math.random() - 0.5) * 0.4, 1.2 + Math.random(), (Math.random() - 0.5) * 0.4), '#c9c4d8', 1.6, -0.3); } });
    }
    // searchlights sweeping the clouds from the rooftops
    for (const [x, y, z, ph] of lights) {
      const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 6, 120, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      beam.position.y = 60; const piv = new THREE.Group(); piv.add(beam); g.add(piv);
      let t = ph; W.dyn.push({ update(dt) { t += dt; piv.rotation.set(0.45 + Math.sin(t * 0.21) * 0.2, 0, 0); g.rotation.y = t * 0.25; } });
    }
  };

  K.cityRing = (cx, cz, r0, r1, N, base, seed = 11, avoid = null) => {
    const r = U.rng(seed);
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    const palette = ['#ff8fab', '#9b8cff', '#4fc9c0', '#ffcf3a', '#ff7a2f', '#6a7bff', '#e86f9a', '#7bd389'];
    for (let n = 0; n < N; n++) {
      const a = r() * Math.PI * 2, d = r0 + r() * (r1 - r0);
      const w = 10 + r() * 22, h = 30 + r() * 90 * (d > 200 ? 1.6 : 1), dd = 10 + r() * 22;
      m4.makeScale(w, h, dd); m4.setPosition(cx + Math.cos(a) * d, base, cz + Math.sin(a) * d);
      im.setMatrixAt(n, m4); im.setColorAt(n, col.set(palette[Math.floor(r() * palette.length)]));
    }
    scene.add(im);
  };
  K.smileTower = (pos) => {
    const tw = new THREE.Group(); tw.position.copy(pos); scene.add(tw);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(12, 20, 230, 8), new THREE.MeshBasicMaterial({ color: 0xb48fd8, fog: false }));
    shaft.position.y = 115; tw.add(shaft);
    for (let i = 0; i < 5; i++) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(22 - i, 22 - i, 3, 8), new THREE.MeshBasicMaterial({ color: 0x8f6bc4, fog: false })); ring.position.y = 40 + i * 40; tw.add(ring); }
    const faceC = canvasTex(512, 512, (x, w, h, look = [0, 0], wink = 0, beat = 0) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = PAL.yellow; x.beginPath(); x.arc(256, 256, 240 + beat * 6, 0, 7); x.fill();
      x.lineWidth = 18; x.strokeStyle = PAL.ink; x.stroke();
      for (const [ex, wk] of [[-90, 0], [90, wink]]) {
        x.fillStyle = '#fff'; x.beginPath(); x.ellipse(256 + ex, 200, 52, 64 * (1 - wk * 0.95), 0, 0, 7); x.fill(); x.lineWidth = 10; x.stroke();
        if (wk < 0.5) { x.fillStyle = PAL.ink; x.beginPath(); x.arc(256 + ex + look[0] * 24, 200 + look[1] * 28, 22, 0, 7); x.fill(); }
      }
      x.lineWidth = 20; x.lineCap = 'round'; x.beginPath(); x.arc(256, 270, 130, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(30, 40), new THREE.MeshBasicMaterial({ map: faceC.tex, transparent: true, fog: false }));
    const head = new THREE.Group(); head.position.y = 250; tw.add(head); head.add(face);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(31, 31, 4, 32), new THREE.MeshBasicMaterial({ color: 0x14101f, fog: false })); back.rotation.x = Math.PI / 2; back.position.z = -2.2; head.add(back);
    W.tower = { head, faceC, wink: 0, t: 0 };
  };
  K.blimp = (cx, cz, rad, hgt, text = ['SMILE!', "IT'S THE LAW"]) => {
    const bl = new THREE.Group();
    const env = part(new THREE.SphereGeometry(6, 18, 12), '#f4f1ff', 0.25); env.scale.set(2.4, 1, 1); bl.add(env);
    const gon = part(new THREE.BoxGeometry(4, 1.5, 2), '#6a3df0', 0.12); gon.position.y = -6.6; bl.add(gon);
    for (const s of [-1, 1]) { const fin = part(new THREE.BoxGeometry(3, 0.3, 4), '#ff2e88', 0.1); fin.position.set(-13, 0, s * 2.6); bl.add(fin); }
    const fin2 = part(new THREE.BoxGeometry(3, 4, 0.3), '#ff2e88', 0.1); fin2.position.set(-13, 2.6, 0); bl.add(fin2);
    const bt = posterTex(text, { w: 512, h: 160, bg: PAL.mint }).tex;
    for (const s of [-1, 1]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.4), new THREE.MeshBasicMaterial({ map: bt })); ban.position.set(0, -0.5, s * 6.05); if (s < 0) ban.rotation.y = Math.PI; bl.add(ban); }
    scene.add(bl);
    let a = 0;
    W.dyn.push({ update(dt) { a += dt * 0.025; bl.position.set(cx + Math.cos(a) * rad, hgt + Math.sin(a * 3) * 2, cz + Math.sin(a) * rad); bl.rotation.y = -a; } });
  };

  // ---- finish: ground queries, rail visuals, batch ----
  K.finish = () => {
    // broad-phase grids
    W.grid = makeGrid(16); W.rampGrid = makeGrid(16); W.dynBoxes = [];
    for (const b of W.boxes) { if (b.dyn) W.dynBoxes.push(b); else W.grid.add(b, b.x0, b.z0, b.x1, b.z1); }
    for (const rp of W.ramps) W.rampGrid.add(rp, rp.x0, rp.z0, rp.x1, rp.z1);
    const _q = [], _qr = [];
    W.near = (x0, z0, x1, z1, out = []) => { W.grid.query(x0, z0, x1, z1, out); for (const b of W.dynBoxes) out.push(b); return out; };
    W.addDyn = (b) => { b.dyn = true; W.boxes.push(b); W.dynBoxes.push(b); return b; };
    W.groundAt = (x, z, yMax = 1e9, r = 0.18) => {
      let best = -1e9, hit = null;
      W.near(x - r, z - r, x + r, z + r, _q);
      for (const b of _q) {
        if (x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r) continue;
        if (b.y1 <= yMax && b.y1 > best) { best = b.y1; hit = b; }
      }
      W.rampGrid.query(x, z, x, z, _qr);
      for (const rp of _qr) {
        if (x < rp.x0 || x > rp.x1 || z < rp.z0 || z > rp.z1) continue;
        const h = rampH(rp, x, z);
        if (h <= yMax && h > best) { best = h; hit = rp; }
      }
      return { y: best, hit };
    };
    // rails
    W.railGrid = makeGrid(8);
    for (const d of railDefs) {
      const kind = d.kind || 'rail';
      let P = d.pts;
      if (d.sag || (kind === 'cable' && d.sag !== 0 && P.length === 2)) {
        const sag = d.sag ?? 0.6, Q = [];
        for (let i = 0; i < P.length - 1; i++) {
          const a = P[i], b = P[i + 1], L = a.distanceTo(b), n = Math.max(6, Math.ceil(L / 1.2)), dip = sag * L / 20;
          for (let k = (i ? 1 : 0); k <= n; k++) { const t = k / n; Q.push(V3().lerpVectors(a, b, t).add(V3(0, -4 * dip * t * (1 - t), 0))); }
        }
        P = Q;
      } else {
        P = fillet(P, d.round ?? (kind === 'cable' ? 0 : 2.6), d.loop);
      }
      const r = { pts: P, segs: [], loop: !!d.loop, endBoost: d.endBoost || 0, kind, minSpeed: d.minSpeed || 0, hidden: !!d.hidden };
      let L = 0;
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], len = a.distanceTo(b);
        if (len < 1e-4) continue;
        const sg = { a, b, len, dir: V3().subVectors(b, a).normalize(), s0: L, r };
        r.segs.push(sg); L += len;
        if (!d.deco) W.railGrid.add(sg, Math.min(a.x, b.x) - 2.4, Math.min(a.z, b.z) - 2.4, Math.max(a.x, b.x) + 2.4, Math.max(a.z, b.z) + 2.4);
      }
      r.len = L; if (!d.deco) W.rails.push(r);
      if (d.hidden) continue;
      const rad = d.radius ?? (kind === 'pipe' ? 0.32 : kind === 'cable' ? 0.06 : 0.09);
      const color = d.color || (kind === 'pipe' ? '#8a8fa8' : kind === 'cable' ? '#14101f' : '#ffd23f');
      const VP = P.map(p => V3(p.x, p.y - rad * 0.7, p.z));
      const radial = kind === 'pipe' ? 10 : 6;
      B.add(tubeGeo(VP, rad, radial), null, color, d.mat || 'plain', { outlineT: 0, edges: false });
      B.addOutline(tubeGeo(VP, rad + (kind === 'pipe' ? 0.06 : 0.035), radial));
      if (kind === 'pipe' && !d.loop && d.stubs !== false) {   // pipes never just stop in mid-air: run each end into a wall, or down into the floor
        const solidAt = (x, y, z) => { for (const b of W.grid.query(x, z, x, z, _stubQ)) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > b.y0 && y < b.y1) return true; return false; };
        for (const [e, f] of [[P[0], P[1]], [P[P.length - 1], P[P.length - 2]]]) {
          const c = V3(e.x, e.y - rad * 0.7, e.z), dir = V3().subVectors(e, f).normalize();
          const flat = V3(dir.x, 0, dir.z); if (flat.lengthSq() > 1e-4) flat.normalize();
          let hit = null;
          for (const [dd, max] of [[dir, 5], [V3(-flat.z, 0, flat.x), 2.6], [V3(flat.z, 0, -flat.x), 2.6]]) {
            if (dd.lengthSq() < 0.5) continue;
            for (let t = 0.25; t <= max; t += 0.2) if (solidAt(c.x + dd.x * t, c.y + dd.y * t, c.z + dd.z * t)) { hit = c.clone().addScaledVector(dd, t + 0.2); break; }
            if (hit) break;
          }
          if (!hit) { const g = W.groundAt(c.x, c.z, c.y - 0.2, 0).y; if (g > -1e8 && c.y - g < 30) hit = V3(c.x, g - 0.2, c.z); }
          if (!hit) continue;
          B.add(tubeGeo([c, hit], rad, radial), null, color, d.mat || 'plain', { outlineT: 0, edges: false });
          B.addOutline(tubeGeo([c, hit], rad + 0.06, radial));
          const fd = V3().subVectors(hit, c).normalize();
          K.rod(hit.clone().addScaledVector(fd, -0.35), hit.clone().addScaledVector(fd, -0.1), rad + 0.16, d.collar || '#5b6078', 0.03);
          K.rod(c.clone().addScaledVector(fd, -0.12), c.clone().addScaledVector(fd, 0.12), rad + 0.07, d.collar || '#5b6078', 0.03);
        }
      }
      if (kind === 'pipe') {      // collars
        for (let s = 2; s < L - 1; s += 5) { const c = railPoint(r, s), dd = railDir(r, s); K.rod(V3(c.x, c.y - rad * 0.7, c.z).addScaledVector(dd, -0.15), V3(c.x, c.y - rad * 0.7, c.z).addScaledVector(dd, 0.15), rad + 0.07, d.collar || '#5b6078', 0.03); }
      }
      if (kind === 'rail' && d.posts !== false) {
        const n = Math.max(2, Math.ceil(L / 3.6)), pm = d.postMax ?? 7;
        for (let i = 0; i <= n; i++) {
          const pp = railPoint(r, L * i / n);
          const g = W.groundAt(pp.x, pp.z, pp.y - 0.25, 0).y;
          if (g > -1e8 && pp.y - g < pm && pp.y - g > 0.15) K.cyl(pp.x, g, pp.z, 0.06, pp.y - g - 0.05, d.postColor || '#3a3550', { outline: 0.025, seg: 6 });
        }
      } else if (kind === 'cable' && d.posts !== false) {
        for (const pp of [P[0], P[P.length - 1]]) {
          const g = W.groundAt(pp.x, pp.z, pp.y - 0.2, 0.3).y;
          if (g > -1e8 && pp.y - g < 22) K.cyl(pp.x, g, pp.z, 0.11, pp.y - g + 0.35, '#5b4a6b', { outline: 0.03, seg: 8 });
        }
      }
      if (d.laundry) {
        const cols = ['#e9e4f5', '#c9c4d8', '#e9e4f5', '#ff2e88', '#c9c4d8', '#e9e4f5', '#c9c4d8'];
        let k = 0;
        for (let t = 2; t < L - 1; t += 2.6) {
          const pp = railPoint(r, t);
          B.add(new THREE.BoxGeometry(1.1, 1.3, 0.05), new THREE.Matrix4().makeTranslation(pp.x, pp.y - 0.7, pp.z), cols[k++ % cols.length], 'plain', { outlineT: 0.03, edges: false });
        }
      }
      if (d.lanterns) {
        const cols = d.lanterns === true ? ['#ff2e88', '#ffd23f', '#ff7a2f'] : d.lanterns; let k = 0;
        for (let t = 1.5; t < L - 1; t += 2.2) {
          const pp = railPoint(r, t);
          K.sphere(pp.x, pp.y - 0.75, pp.z, 0.32, cols[k++ % cols.length], { kind: 'glow', outline: 0.03, seg: 8, sy: 1.25 });
        }
      }
    }
    scene.add(B.build(worldMaterials(W.night)));
    W.relaysOn = () => W.relays.filter(r => r.active).length;
    W.tapesGot = () => W.tapes.filter(t => t.got).length;
    return W;
  };
  return K;
}

const _kv = V3(), _kv2 = V3(), _stubQ = [];
