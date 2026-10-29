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
function railPoint(r, s) {
  s = U.clamp(s, 0, r.len);
  for (const g of r.segs) if (s <= g.s0 + g.len + 1e-6) return V3().copy(g.a).addScaledVector(g.dir, s - g.s0);
  return r.pts[r.pts.length - 1].clone();
}
function railDir(r, s) {
  for (const g of r.segs) if (s <= g.s0 + g.len + 1e-6) return g.dir;
  return r.segs[r.segs.length - 1].dir;
}

// world-space textures (white-ish so vertex colour tints them)
function worldMaterials() {
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
  const tWin = makeWindowTex().tex, tRoof = makeRoofTex().tex;
  const M = (map, extra = {}) => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, map, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }, extra));
  G.worldMats = {
    wall: M(tWin), roof: M(tRoof), plain: M(null), grass: M(grass), leaf: M(leaf), paving: M(paving), wood: M(wood), sand: M(sand),
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

  K.box = (x0, y0, z0, x1, y1, z1, color, kind = 'plain', o = {}) => {
    B.box(x0, y0, z0, x1, y1, z1, color, kind, o);
    if (o.collide !== false) W.boxes.push({ x0, y0, z0, x1, y1, z1, tag: o.tag });
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
  K.rail = (pts, o = {}) => railDefs.push({ pts: pts.map(p => V3(...p)), ...o });
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
  K.water = (x0, z0, x1, z1, y, color = '#7fd3ff') => {
    B.box(x0, y - 0.02, z0, x1, y, z1, color, 'water', { outlineT: 0, edges: false });
    W.waters.push({ x0, z0, x1, z1, y });
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
  K.screen = (pos, w, h, rotY = 0) => {
    const st = { mode: 'minister', talking: false, wink: false, mood: 'happy', caption: 'GOOD EVENING, GLEAM CITY!', t: 0, acc: 0 };
    const sc = canvasTex(640, 360, (x, cw, ch) => {
      if (st.mode === 'dj') drawDJ(x, cw, ch, st.t, st);
      else if (st.mode === 'static') { drawStatic(x, cw, ch); x.fillStyle = 'rgba(255,46,136,.25)'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#fff'; x.font = `40px ${FONT.dot}`; x.textAlign = 'center'; x.fillText('SIGNAL INTERRUPTED', cw / 2, ch / 2); x.textAlign = 'left'; }
      else drawMinister(x, cw, ch, st.t, st);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sc.tex, fog: false }));
    mesh.position.copy(pos); mesh.rotation.y = rotY; scene.add(mesh);
    W.screen = { st, sc, mesh, pos: pos.clone() };
    W.dyn.push({ update(dt) { st.t += dt; st.acc += dt; if (st.acc > 1 / 15) { st.acc = 0; sc.redraw(); } } });
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
  K.lift = ({ x0, z0, x1, z1, y0, y1, postBase = y0 - 1 }) => {
    const plat = new THREE.Group(); scene.add(plat);
    const hz = canvasTex(128, 128, (x, w, h) => { x.fillStyle = PAL.yellow; x.fillRect(0, 0, w, h); x.fillStyle = PAL.ink; for (let i = -4; i < 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 16 + 128, h); x.lineTo(i * 32 + 128, h); x.fill(); } }, { repeat: true }).tex;
    const w = x1 - x0, d = z1 - z0;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), [toon('#3a3550'), toon('#3a3550'), toon('#ffffff', { map: hz, noCache: true }), toon('#3a3550'), toon('#3a3550'), toon('#3a3550')]);
    outline(top, 0.06); top.position.y = -0.25; plat.add(top);
    const spk = part(new THREE.CylinderGeometry(Math.min(w, d) * 0.25, Math.min(w, d) * 0.28, 0.6, 16), '#14101f', 0.04); spk.position.y = -0.8; plat.add(spk);
    for (const [x, z] of [[x0 + 0.3, z0 - 0.3], [x1 - 0.3, z0 - 0.3], [x0 + 0.3, z1 + 0.3], [x1 - 0.3, z1 + 0.3]]) K.cyl(x, postBase, z, 0.15, y1 + 2 - postBase, '#5b4a6b', { outline: 0.03 });
    const col = { x0, y0: y0 - 0.5, z0, x1, y1: y0, z1, tag: 'lift' };
    W.boxes.push(col);
    W.lift = { plat, col, y: y0 };
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    W.dyn.push({ update(dt, bi) {
      const p = ((bi.b % 8) + 8) % 8;
      let s = p < 2 ? 0 : p < 4 ? U.smooth((p - 2) / 2) : p < 6 ? 1 : 1 - U.smooth((p - 6) / 2);
      if (!bi.playing) s = 0;
      const y = U.lerp(y0, y1, s);
      col.y1 = y; col.y0 = y - 0.5; W.lift.y = y;
      plat.position.set(cx, y, cz);
      spk.scale.setScalar(1 + Math.exp(-bi.phase * 7) * 0.08);
    } });
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
    W.groundAt = (x, z, yMax = 1e9, r = 0.18) => {
      let best = -1e9, hit = null;
      for (const b of W.boxes) {
        if (x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r) continue;
        if (b.y1 <= yMax && b.y1 > best) { best = b.y1; hit = b; }
      }
      for (const rp of W.ramps) {
        if (x < rp.x0 || x > rp.x1 || z < rp.z0 || z > rp.z1) continue;
        const h = rampH(rp, x, z);
        if (h <= yMax && h > best) { best = h; hit = rp; }
      }
      return { y: best, hit };
    };
    for (const d of railDefs) {
      const r = { pts: d.pts, zip: !!d.zip };
      r.segs = []; let L = 0;
      for (let i = 0; i < d.pts.length - 1; i++) { const a = d.pts[i], b = d.pts[i + 1]; const len = a.distanceTo(b); r.segs.push({ a, b, len, dir: V3().subVectors(b, a).normalize(), s0: L }); L += len; }
      r.len = L; W.rails.push(r);
      if (d.hidden) continue;             // e.g. bench edges: the bench itself is the visual
      for (const s of r.segs) K.rod(s.a, s.b, d.kind === 'cable' ? 0.06 : 0.085, d.color || '#ffd23f', 0.035);
      if (d.kind !== 'cable' && d.posts !== false) {
        const n = Math.max(2, Math.ceil(r.len / 3));
        for (let i = 0; i <= n; i++) {
          const p = railPoint(r, r.len * i / n);
          const g = W.groundAt(p.x, p.z, p.y - 0.2, 0).y;
          if (g > -1e8 && p.y - g < 6) K.cyl(p.x, g, p.z, 0.06, p.y - g, '#3a3550', { outline: 0.025 });
        }
      } else if (d.kind === 'cable') {
        for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) {
          const g = W.groundAt(p.x, p.z, p.y - 0.2, 0.3).y;
          if (g > -1e8 && p.y - g < 18) K.cyl(p.x, g, p.z, 0.11, p.y - g + 0.3, '#5b4a6b', { outline: 0.03 });
        }
      }
      if (d.laundry) {
        const cols = ['#e9e4f5', '#c9c4d8', '#e9e4f5', '#ff2e88', '#c9c4d8', '#e9e4f5', '#c9c4d8'];
        let k = 0;
        for (let t = 2; t < r.len - 1; t += 2.6) {
          const p = railPoint(r, t);
          B.add(new THREE.BoxGeometry(1.1, 1.3, 0.05), new THREE.Matrix4().makeTranslation(p.x, p.y - 0.7, p.z), cols[k++ % cols.length], 'plain', { outlineT: 0.03, edges: false });
        }
      }
    }
    scene.add(B.build(worldMaterials()));
    W.relaysOn = () => W.relays.filter(r => r.active).length;
    W.tapesGot = () => W.tapes.filter(t => t.got).length;
    return W;
  };
  return K;
}
