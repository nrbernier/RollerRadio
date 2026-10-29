// ============================================================
//  WORLD 1 — UPPER GLEAM ROOFTOPS
// ============================================================
const STREET = -42;

function skyDome() {
  const g = new THREE.SphereGeometry(900, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: 0 }, uSun: { value: V3(-0.7, 0.16, 0.45).normalize() } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; uniform float uT; uniform vec3 uSun;
      void main(){
        float h = vP.y;
        vec3 top = vec3(0.24,0.17,0.62), mid = vec3(1.0,0.38,0.62), hor = vec3(1.0,0.66,0.42), low = vec3(0.55,0.33,0.6);
        vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.08, 0.6, h)) : low;
        c = mix(c, hor, (1.0 - smoothstep(0.0, 0.16, abs(h))) * 0.9);
        // banded toon clouds
        float n = sin(vP.x*9.0 + uT*0.03) * sin(vP.z*7.0 - uT*0.02) + sin(vP.x*23.0 + vP.z*11.0)*0.3;
        float band = smoothstep(0.25, 0.3, n) * smoothstep(0.05, 0.12, h) * (1.0 - smoothstep(0.22, 0.4, h));
        c = mix(c, vec3(1.0,0.82,0.76), band*0.55);
        // the sun: flat disc with rings
        float d = distance(vP, uSun);
        c = mix(c, vec3(1.0,0.95,0.7), 1.0 - smoothstep(0.075, 0.08, d));
        c = mix(c, vec3(1.0,0.78,0.5), (1.0 - smoothstep(0.11, 0.115, d)) * step(0.08, d) * 0.6);
        // stripes over the sun (retro)
        float st = step(0.5, fract(vP.y*90.0)) * step(d, 0.08) * step(vP.y, uSun.y);
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
function buildWorld1(env) {
  const W = { boxes: [], ramps: [], rails: [], relays: [], tapes: [], pads: [], drones: [], dyn: [], posters: [],
    group: new THREE.Group(), spawn: V3(3, 0, 3), spawnYaw: Math.PI, name: 'UPPER GLEAM ROOFTOPS', killY: -24 };
  const B = new StaticBatch();
  const scene = W.group;

  // ---------- helpers ----------
  const box = (x0, y0, z0, x1, y1, z1, color, kind = 'plain', opts = {}) => {
    B.box(x0, y0, z0, x1, y1, z1, color, kind, opts);
    if (opts.collide !== false) W.boxes.push({ x0, y0, z0, x1, y1, z1, tag: opts.tag });
  };
  const bld = (x0, z0, x1, z1, top, color, roof, trim = '#14101f') => {
    box(x0, STREET, z0, x1, top, z1, color, 'building', { roofColor: roof, outlineT: 0.16 });
    B.box(x0 - 0.18, top - 0.75, z0 - 0.18, x1 + 0.18, top - 0.1, z1 + 0.18, trim, 'plain', { outlineT: 0, edges: false });
  };
  const ramp = (x0, z0, x1, z1, axis, h0, h1, color, plank = false, base = 0) => {
    const g = wedgeGeo(x0, z0, x1, z1, axis, h0, h1, base, plank);
    B.add(g, new THREE.Matrix4(), color, 'plain', { outlineT: 0.08 });
    W.ramps.push({ x0, z0, x1, z1, axis, h0, h1, base: plank ? null : base });
  };
  const cyl = (x, y0, z, r, h, color, opts = {}) => {
    const g = new THREE.CylinderGeometry(r, opts.r2 ?? r, h, opts.seg || 14);
    B.add(g, new THREE.Matrix4().makeTranslation(x, y0 + h / 2, z), color, 'plain', { outlineT: opts.outline ?? 0.07, edges: false });
  };
  const rod = (a, b, r, color, outlineT = 0.035) => {
    const dir = V3().subVectors(b, a), len = dir.length();
    const g = new THREE.CylinderGeometry(r, r, len, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
    const m = new THREE.Matrix4().compose(V3().addVectors(a, b).multiplyScalar(0.5), q, V3(1, 1, 1));
    B.add(g, m, color, 'plain', { outlineT, edges: false });
  };
  const railDefs = [];
  const rail = (pts, opts = {}) => railDefs.push({ pts: pts.map(p => V3(...p)), ...opts });

  // ---------- the rooftops ----------
  // A — Bolt's roof (start)
  bld(-12, -12, 12, 12, 0, '#ff8fab', '#b9a7d9', '#6a3df0');
  // B — east
  bld(18, -10, 42, 14, 1, '#4fc9c0', '#9fc2c8', '#ffd23f');
  // C — the broadcast roof (north)
  bld(-14, -50, 16, -22, 4, '#ffcf3a', '#c9b8a4', '#ff2e88');
  // D — laundry roof (west, lower)
  bld(-46, -24, -20, 10, -2, '#9b8cff', '#a9a2c9', '#ff7a2f');
  // E — the tall tower
  bld(-38, -38, -28, -28, 14, '#ff7a2f', '#d6b3a0', '#14101f');
  // F — noodle roof (south)
  bld(-10, 22, 30, 46, 1, '#7bd389', '#b7cfb3', '#ff2e88');
  // H — ministry antenna roof (far east, high)
  bld(48, -36, 70, -8, 9, '#6a7bff', '#a7aee0', '#c6ff3d');
  // G — hidden courtyard, enclosed by buildings
  bld(46, 24, 64, 50, -5, '#ffb3d1', '#e3c2cf', '#6a3df0');
  bld(64, 18, 72, 56, 7, '#e86f9a', '#b3a0c6', '#14101f');
  bld(40, 18, 64, 24, 7, '#f08bb0', '#b3a0c6', '#14101f');
  bld(40, 50, 64, 56, 7, '#f08bb0', '#b3a0c6', '#14101f');
  // west wall of courtyard with a hole for the vent duct
  bld(40, 24, 46, 29.5, 7, '#e86f9a', '#b3a0c6', '#14101f');
  bld(40, 34.5, 46, 50, 7, '#e86f9a', '#b3a0c6', '#14101f');
  box(40, STREET, 29.5, 46, 0.7, 34.5, '#e86f9a', 'building');
  box(40, 3.9, 29.5, 46, 7, 34.5, '#e86f9a', 'building', { roofColor: '#b3a0c6' });
  // B's secret balcony (hidden below the east edge)
  box(42, STREET, 2, 46, -4, 10, '#4fc9c0', 'building', { roofColor: '#9fc2c8' });
  box(46, -4, 1.5, 46.5, -2.8, 10.5, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(42, -4, 1.5, 46, -2.8, 2, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(42, -4, 10, 46, -2.8, 10.5, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(46.5, STREET, 1.5, 47, -4, 10.5, '#4fc9c0', 'building');

  // ---------- bridges & kickers ----------
  ramp(7, -2, 11, 2, 'x', 0, 2.2, '#ffd23f', false, 0);          // A kicker → B
  ramp(-2.5, -22, 2.5, -12, 'z', 4, 0, '#c9a46b', true);          // plank A → C
  ramp(3, 12, 8, 22, 'z', 0, 1, '#c9a46b', true);                 // plank A → F
  ramp(-24, -6, -20, -2, 'x', -2, -0.2, '#ff7a2f', false, -2);    // D kicker → A
  ramp(26, -6, 30, -1, 'x', 1, 2.4, '#ff2e88', false, 1);         // B kicker (fun)
  ramp(-6, -36, -2, -32, 'z', 5.6, 4, '#ff2e88', false, 4);       // C kicker
  // plank supports
  for (const [x, z, y] of [[-2.2, -17, 2], [2.2, -17, 2], [3.3, 17, 0.5], [7.7, 17, 0.5]]) cyl(x, STREET + 30, z, 0.12, y - 0.4 - (STREET + 30), '#6b5a7a', { outline: 0.03 });

  // ---------- A decor: water tower, AC units, satellite ----------
  const waterTower = (x, z, base, col, tag) => {
    for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) cyl(x + dx, base, z + dz, 0.13, 3, '#5b4a6b', { outline: 0.03 });
    cyl(x, base + 3, z, 2.2, 3, col, { seg: 16, outline: 0.1 });
    cyl(x, base + 5.95, z, 2.3, 0.2, '#14101f', { seg: 16, outline: 0.02 });
    for (let i = 0; i < 3; i++) cyl(x, base + 3.6 + i * 0.9, z, 2.24, 0.12, '#14101f', { seg: 16, outline: 0 });
    W.boxes.push({ x0: x - 1.9, y0: base + 3, z0: z - 1.9, x1: x + 1.9, y1: base + 6.1, z1: z + 1.9, tag });
  };
  waterTower(-7, -7, 0, '#8ff0c8');
  const ac = (x, z, base, w = 2, h = 1.2, d = 2, col = '#e9e4f5') => {
    box(x - w / 2, base, z - d / 2, x + w / 2, base + h, z + d / 2, col, 'plain', { outlineT: 0.07 });
    cyl(x, base + h, z, Math.min(w, d) * 0.32, 0.12, '#14101f', { outline: 0 });
  };
  ac(5, -8, 0); ac(8, -8, 0); ac(-8, 6, 0, 3, 1.4, 2);
  ac(24, 8, 1); ac(33, -7.5, 1, 2, 1.2, 2, '#ffd23f'); ac(36, 10, 1);
  // ---------- B → H: the BEAT LIFT ----------
  // (dynamic, see below)

  // ---------- C decor: the giant screen + the "info kiosk" (hologram!) ----------
  for (const x of [-4, 12]) { box(x - 0.5, 4, -49.6, x + 0.5, 9, -48.6, '#3a3550', 'plain', { outlineT: 0.06 }); }
  box(-6.6, 8.6, -50.2, 14.6, 20.4, -49.4, '#14101f', 'plain', { outlineT: 0.1 });
  // kiosk: U-shaped room with a fake (holographic) front
  box(-13, 4, -46, -12.5, 8, -38, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13, 4, -46, -7, 8, -45.5, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13, 4, -38.5, -7, 8, -38, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13.3, 8, -46.3, -6.7, 8.5, -37.7, '#14101f', 'plain', { outlineT: 0.06 });
  ac(8, -30, 4, 3, 1.4, 2); ac(12, -40, 4); ac(-8, -26, 4, 2, 1, 2, '#ffd23f');

  // ---------- D decor: laundry, the shed with the beat shutter ----------
  // shed walls (x[-42,-32] z[-6,4], floor -2, roof 2)
  box(-42, -2, -6, -32, 2, -5.6, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-42, -2, 3.6, -32, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-42, -2, -6, -41.6, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, -2, -6, -32, 2, -2, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, -2, 1.5, -32, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, 1.15, -2, -32, 2, 1.5, '#c6ff3d', 'plain', { outlineT: 0.05 });
  box(-42.3, 2, -6.3, -31.7, 2.4, 4.3, '#14101f', 'plain', { outlineT: 0.05 });
  for (const [x, z] of [[-44, 8], [-22, 8], [-44, -12], [-36, -12]]) cyl(x, -2, z, 0.1, 1.6, '#5b4a6b', { outline: 0.03 });
  ac(-26, 4, -2, 2, 1.2, 2.5);

  // ---------- E: antenna mast platform on the tower top ----------
  box(-31.5, 14, -36.5, -29.5, 16.5, -34.5, '#14101f', 'plain', { outlineT: 0.06 });
  cyl(-30.5, 16.5, -35.5, 0.12, 6, '#d9d4ea', { outline: 0.03 });

  // ---------- F decor: noodle neon, AC cluster hiding the vent ----------
  ac(17.5, 29, 1, 2, 1.6, 2.2); ac(17.5, 35.5, 1, 2, 1.6, 2.2); ac(19.7, 37.6, 1, 2.4, 1.2, 1.8);
  ac(4, 30, 1, 3, 1.3, 2); ac(-4, 40, 1);
  // the vent duct F → G (x 22→46, z 29.5→34.5, floor 1, ceiling 3.6)
  box(30, 0.7, 29.5, 40, 1, 34.5, '#b8b3c9', 'plain', { outlineT: 0.05 });
  box(22, 1, 29.5, 40, 3.6, 30, '#b8b3c9', 'plain', { outlineT: 0.06 });
  box(22, 1, 34, 40, 3.6, 34.5, '#b8b3c9', 'plain', { outlineT: 0.06 });
  box(22, 3.6, 29.5, 40, 3.9, 34.5, '#b8b3c9', 'plain', { outlineT: 0.06 });
  for (let x = 24; x < 40; x += 3) {
    B.box(x, 3.9, 29.35, x + 0.3, 4.05, 34.65, '#7a7590', 'plain', { outlineT: 0, edges: false });
    B.box(x, 1, 29.35, x + 0.3, 3.9, 29.5, '#7a7590', 'plain', { outlineT: 0, edges: false });
    B.box(x, 1, 34.5, x + 0.3, 3.9, 34.65, '#7a7590', 'plain', { outlineT: 0, edges: false });
  }
  // a few lamps inside the duct
  for (const x of [27, 33, 39]) B.box(x, 3.5, 31.4, x + 1.2, 3.6, 32.6, '#fff3c4', 'plain', { outlineT: 0, edges: false });
  // inside-wall of courtyard tunnel lining
  box(40, 0.7, 29.5, 46, 1, 34.5, '#b8b3c9', 'plain', { outlineT: 0 });
  box(40, 1, 29.5, 46, 3.9, 30, '#b8b3c9', 'plain', { outlineT: 0, collide: false });
  box(40, 1, 34, 46, 3.9, 34.5, '#b8b3c9', 'plain', { outlineT: 0, collide: false });
  W.boxes.push({ x0: 40, y0: 1, z0: 29.5, x1: 46, y1: 3.9, z1: 30 }, { x0: 40, y0: 1, z0: 34, x1: 46, y1: 3.9, z1: 34.5 });

  // ---------- H decor: water tank (tape on top), AC, antennas ----------
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) cyl(54 + dx, 9, -30 + dz, 0.13, 2, '#5b4a6b', { outline: 0.03 });
  cyl(54, 11, -30, 2.1, 1.8, '#ffd23f', { seg: 16, outline: 0.1 });
  W.boxes.push({ x0: 52.1, y0: 11, z0: -31.9, x1: 55.9, y1: 12.8, z1: -28.1 });
  ac(57.5, -30, 9, 2, 1.5, 2, '#e9e4f5');
  ac(60, -14, 9, 3, 1.3, 2); ac(66, -20, 9);
  box(52, 9, -35.6, 68, 15.5, -35, '#14101f', 'plain', { outlineT: 0.08 });     // big propaganda board frame (back)

  // ministry "jammer" antennas (decor)
  const jammers = [[9, 0, 9], [-10, 4, -48], [40, 1, -8], [-44, -2, -22], [28, 1, 44], [68, 9, -10], [62, 7, 20], [-33, 14, -37]];
  for (const [x, y, z] of jammers) {
    cyl(x, y, z, 0.25, 0.4, '#3a3550', { outline: 0.03 });
    cyl(x, y + 0.4, z, 0.08, 4.5, '#d9d4ea', { outline: 0.025, r2: 0.05 });
    for (let i = 0; i < 3; i++) rod(V3(x - 0.6 + i * 0.05, y + 2 + i * 0.9, z), V3(x + 0.6 - i * 0.05, y + 2 + i * 0.9, z), 0.03, '#d9d4ea', 0.02);
  }

  // ---------- rails ----------
  rail([[11.5, 1.15, 8], [18.5, 2.1, 8]], { kind: 'cable', color: '#14101f' });          // A → B power line
  rail([[-11.5, 1.05, 4], [-20.5, -0.85, 4]], { kind: 'cable', color: '#14101f' });      // A ↔ D
  rail([[2.7, 0.95, 12.5], [2.7, 1.95, 21.5]], { color: '#ffd23f' });                     // plank A → F
  rail([[-2.85, 0.95, -12.5], [-2.85, 4.95, -21.5]], { color: '#ffd23f' });               // plank A → C
  rail([[-11, 0.9, 11.4], [-1, 0.9, 11.4]], { color: '#19d3ff' });                        // A south ledge
  rail([[11.4, 0.9, -10], [11.4, 0.9, -4]], { color: '#19d3ff' });
  rail([[-13.5, 4.95, -28], [-24, -1.05, -18]], { kind: 'cable', color: '#14101f' });     // C → D long slide
  rail([[-28.6, 15.6, -28.6], [-2, 1.3, -4]], { kind: 'cable', color: '#14101f', zip: true }); // E → A zipline
  rail([[-44, -0.55, 8], [-22, -0.55, 8]], { kind: 'cable', color: '#f4f1ff', laundry: true });
  rail([[-44, -0.55, -12], [-36, -0.55, -12]], { kind: 'cable', color: '#f4f1ff', laundry: true });
  rail([[19, 1.9, 13.4], [41, 1.9, 13.4]], { color: '#ff2e88' });                         // B south ledge
  rail([[19, 1.9, -9.4], [36, 1.9, -9.4]], { color: '#ff2e88' });
  rail([[-13, 5.0, -22.6], [-3.6, 5.0, -22.6]], { color: '#19d3ff' });                     // C south ledge
  rail([[3.6, 5.0, -22.6], [15, 5.0, -22.6]], { color: '#19d3ff' });
  rail([[15.4, 5.0, -24], [15.4, 5.0, -48]], { color: '#19d3ff' });
  rail([[-8, 2.8, 45.4], [26, 2.8, 45.4]], { color: '#ff2e88' });                         // F south (neon)
  rail([[-9.4, 1.9, 24], [-9.4, 1.9, 44]], { color: '#ffd23f' });
  rail([[49, 10, -9.4], [69, 10, -9.4]], { color: '#c6ff3d' });                           // H edges
  rail([[69.4, 10, -10], [69.4, 10, -34]], { color: '#c6ff3d' });
  rail([[-45.4, -1, -22], [-45.4, -1, 8]], { color: '#ff7a2f' });                         // D west
  rail([[-37.5, 15, -29], [-37.5, 15, -37]], { color: '#ffd23f' });                      // E edge

  // ---------- ground queries (used by builders + physics) ----------
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
  // build rail visuals now that we can find the ground
  for (const d of railDefs) {
    if (d.hidden) continue;
    const r = { pts: d.pts, zip: !!d.zip };
    r.segs = []; let L = 0;
    for (let i = 0; i < d.pts.length - 1; i++) { const a = d.pts[i], b = d.pts[i + 1]; const len = a.distanceTo(b); r.segs.push({ a, b, len, dir: V3().subVectors(b, a).normalize(), s0: L }); L += len; }
    r.len = L; W.rails.push(r);
    for (const s of r.segs) rod(s.a, s.b, d.kind === 'cable' ? 0.06 : 0.085, d.color, 0.035);
    if (d.kind !== 'cable') {
      const n = Math.max(2, Math.ceil(r.len / 3));
      for (let i = 0; i <= n; i++) {
        const p = railPoint(r, r.len * i / n);
        const g = W.groundAt(p.x, p.z, p.y - 0.2, 0).y;
        if (g > -1e8 && p.y - g < 6) cyl(p.x, g, p.z, 0.06, p.y - g, '#3a3550', { outline: 0.025 });
      }
    } else {
      for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) {
        const g = W.groundAt(p.x, p.z, p.y - 0.2, 0.3).y;
        if (g > -1e8 && p.y - g < 18) cyl(p.x, g, p.z, 0.11, p.y - g + 0.3, '#5b4a6b', { outline: 0.03 });
      }
    }
    if (d.laundry) {
      const cols = ['#e9e4f5', '#c9c4d8', '#e9e4f5', '#ff2e88', '#c9c4d8', '#e9e4f5', '#c9c4d8'];
      let k = 0;
      for (let t = 2; t < r.len - 1; t += 2.6) {
        const p = railPoint(r, t);
        const g = new THREE.BoxGeometry(1.1, 1.3, 0.05);
        const m = new THREE.Matrix4().makeTranslation(p.x, p.y - 0.7, p.z);
        B.add(g, m, cols[k++ % cols.length], 'plain', { outlineT: 0.03, edges: false });
      }
    }
  }

  // ---------- build static batch ----------
  const tWin = makeWindowTex().tex, tRoof = makeRoofTex().tex;
  const mats = {
    wall: new THREE.MeshToonMaterial({ vertexColors: true, map: tWin, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    roof: new THREE.MeshToonMaterial({ vertexColors: true, map: tRoof, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    plain: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  };
  scene.add(B.build(mats));

  // ---------- environment: sky, distant city, street, smile tower, blimp ----------
  const sky = skyDome(); scene.add(sky); W.sky = sky;
  // distant buildings
  {
    const N = 240, r = U.rng(11);
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const im = new THREE.InstancedMesh(geo, mat, N);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    const palette = ['#ff8fab', '#9b8cff', '#4fc9c0', '#ffcf3a', '#ff7a2f', '#6a7bff', '#e86f9a', '#7bd389'];
    let n = 0;
    while (n < N) {
      const a = r() * Math.PI * 2, d = 105 + r() * 260;
      const x = 10 + Math.cos(a) * d, z = -5 + Math.sin(a) * d;
      const w = 10 + r() * 22, h = 30 + r() * 90 * (d > 200 ? 1.6 : 1), dd = 10 + r() * 22;
      m4.makeScale(w, h, dd); m4.setPosition(x, STREET, z);
      im.setMatrixAt(n, m4); im.setColorAt(n, col.set(palette[Math.floor(r() * palette.length)])); n++;
    }
    scene.add(im);
  }
  // street far below
  {
    const st = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#3a2a55'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a1f40'; x.fillRect(0, 200, w, 112); x.fillRect(200, 0, 112, h);
      x.fillStyle = '#ffd23f'; for (let i = 0; i < w; i += 40) { x.fillRect(i, 254, 22, 4); x.fillRect(254, i, 4, 22); }
    }, { repeat: true }).tex;
    st.repeat.set(12, 12);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshBasicMaterial({ map: st }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = STREET; scene.add(plane);
    // car lights
    const N = 60; const pg = new THREE.BufferGeometry(); const arr = new Float32Array(N * 3);
    pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe9a0, size: 1.6, sizeAttenuation: true }));
    scene.add(pts);
    const cars = []; const rr = U.rng(5);
    for (let i = 0; i < N; i++) cars.push({ lane: Math.floor(rr() * 6), t: rr() * 600, sp: 8 + rr() * 10, dir: rr() < 0.5 ? 1 : -1 });
    W.dyn.push({ update(dt) {
      for (let i = 0; i < N; i++) {
        const c = cars[i]; c.t += c.sp * dt * c.dir;
        const lane = (c.lane % 3) * 40 - 40 + 15;
        const tt = ((c.t % 600) + 600) % 600 - 300;
        if (c.lane < 3) { arr[i * 3] = tt; arr[i * 3 + 1] = STREET + 0.5; arr[i * 3 + 2] = lane; }
        else { arr[i * 3] = lane - 10; arr[i * 3 + 1] = STREET + 0.5; arr[i * 3 + 2] = tt; }
      }
      pg.attributes.position.needsUpdate = true;
    } });
  }
  // the Smile Tower — the Ministry watches, cheerfully
  {
    const tw = new THREE.Group(); tw.position.set(150, STREET, -250); scene.add(tw);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(12, 20, 230, 8), new THREE.MeshBasicMaterial({ color: 0xb48fd8, fog: false }));
    shaft.position.y = 115; tw.add(shaft);
    for (let i = 0; i < 5; i++) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(22 - i, 22 - i, 3, 8), new THREE.MeshBasicMaterial({ color: 0x8f6bc4, fog: false })); ring.position.y = 40 + i * 40; tw.add(ring); }
    const faceC = canvasTex(512, 512, (x, w, h, look = [0, 0], wink = 0, beat = 0) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = PAL.yellow; x.beginPath(); x.arc(256, 256, 240 + beat * 6, 0, 7); x.fill();
      x.lineWidth = 18; x.strokeStyle = PAL.ink; x.stroke();
      // eyes that follow you
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
  }
  // propaganda blimp
  {
    const bl = new THREE.Group();
    const env = part(new THREE.SphereGeometry(6, 18, 12), '#f4f1ff', 0.25); env.scale.set(2.4, 1, 1); bl.add(env);
    const gon = part(new THREE.BoxGeometry(4, 1.5, 2), '#6a3df0', 0.12); gon.position.y = -6.6; bl.add(gon);
    for (const s of [-1, 1]) { const fin = part(new THREE.BoxGeometry(3, 0.3, 4), '#ff2e88', 0.1); fin.position.set(-13, 0, s * 2.6); bl.add(fin); }
    const fin2 = part(new THREE.BoxGeometry(3, 4, 0.3), '#ff2e88', 0.1); fin2.position.set(-13, 2.6, 0); bl.add(fin2);
    const bt = posterTex(['SMILE!', "IT'S THE LAW"], { w: 512, h: 160, bg: PAL.mint }).tex;
    for (const s of [-1, 1]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.4), new THREE.MeshBasicMaterial({ map: bt, side: THREE.FrontSide })); ban.position.set(0, -0.5, s * 6.05); if (s < 0) ban.rotation.y = Math.PI; bl.add(ban); }
    scene.add(bl);
    let a = 0;
    W.dyn.push({ update(dt) { a += dt * 0.025; bl.position.set(15 + Math.cos(a) * 95, 34 + Math.sin(a * 3) * 2, -10 + Math.sin(a) * 95); bl.rotation.y = -a - Math.PI / 2 + Math.PI; } });
  }

  // ---------- posters & stickers ----------
  const poster = (lines, x, y, z, w, h, rotY, opts = {}) => {
    const t = posterTex(lines, opts).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: t, gradientMap: G.grad, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m); return m;
  };
  poster(['SMILE!', "IT'S THE LAW"], 9, 0, -21.9, 12, 6, 0, { bg: PAL.mint });
  poster(['REPORT', 'UNSMILING NEIGHBORS'], 17.9, -4, 2, 12, 6, -Math.PI / 2, { bg: PAL.pink, accent: PAL.mint });
  poster(['CURIOSITY:', 'NOT EVEN ONCE'], -19.9, -6, -6, 12, 6, Math.PI / 2, { bg: '#ffe08a' });
  poster(['NAP FOR', 'THE NATION'], 10, -3, 21.9, 12, 6, Math.PI, { bg: PAL.mint });
  poster(['TRUST THE NEWS.', 'THE NEWS TRUSTS YOU.'], 47.9, 4, -22, 14, 7, -Math.PI / 2, { bg: PAL.pink });
  poster(['DECREE 88', 'KEEP IT SLOW ♪=60'], 60, 12.4, -34.9, 15, 6.2, 0, { bg: '#ffe08a', accent: PAL.mint });
  poster(['MINISTRY STORAGE', 'ABSOLUTELY NO DANCING'], -31.95, 1.55, -0.25, 3.4, 0.75, Math.PI / 2, { bg: PAL.mint, smiley: false, w: 512, h: 112 });
  const sticker = (txt, x, y, z, rotY, s = 1.6) => {
    const t = canvasTex(256, 256, (c, w, h) => {
      c.translate(128, 128); c.rotate(-0.15);
      c.fillStyle = PAL.ink; c.beginPath(); c.moveTo(-20, -110); c.lineTo(60, -110); c.lineTo(10, -10); c.lineTo(70, -10); c.lineTo(-50, 115); c.lineTo(-10, 15); c.lineTo(-60, 15); c.closePath(); c.fill();
      c.fillStyle = PAL.magenta; c.scale(0.86, 0.86); c.fill();
      c.fillStyle = PAL.yellow; c.font = `46px ${FONT.display}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8; c.strokeStyle = PAL.ink; c.strokeText(txt, 0, 0); c.fillText(txt, 0, 0);
    }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m);
  };
  sticker('DROP IN', 41.9, 0.2, 6, -Math.PI / 2 + Math.PI, 2.2);
  sticker('1-2!', -31.9, 0.5, 2.6, Math.PI / 2, 1.4);
  sticker('PSST!', 16.45, 1.9, 29, -Math.PI / 2, 1.5);
  sticker('LOOK!', -6.9, 7.2, -37.4, Math.PI / 2 + 0.4, 1.4);
  // painted roof arrows
  const roofArrow = (x, y, z, rot, col = PAL.magenta) => {
    const t = canvasTex(128, 128, (c) => { c.fillStyle = col; c.beginPath(); c.moveTo(64, 8); c.lineTo(118, 70); c.lineTo(84, 70); c.lineTo(84, 120); c.lineTo(44, 120); c.lineTo(44, 70); c.lineTo(10, 70); c.closePath(); c.fill(); }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, y + 0.02, z); scene.add(m);
  };
  roofArrow(39, 1, 6, -Math.PI / 2);
  roofArrow(14, 1, 32, -Math.PI / 2, PAL.cyan);
  roofArrow(-28, -2, -12, Math.PI, PAL.yellow);

  // ---------- giant screen (Minister / DJ Static) ----------
  {
    const st = { mode: 'minister', talking: false, wink: false, mood: 'happy', caption: 'GOOD EVENING, GLEAM CITY!', t: 0, acc: 0 };
    const sc = canvasTex(640, 360, (x, w, h) => {
      if (st.mode === 'dj') drawDJ(x, w, h, st.t, st);
      else if (st.mode === 'static') { drawStatic(x, w, h); x.fillStyle = 'rgba(255,46,136,.25)'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = `40px ${FONT.dot}`; x.textAlign = 'center'; x.fillText('SIGNAL INTERRUPTED', w / 2, h / 2); x.textAlign = 'left'; }
      else drawMinister(x, w, h, st.t, st);
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(20.4, 11.5), new THREE.MeshBasicMaterial({ map: sc.tex, fog: false }));
    screen.position.set(4, 14.5, -49.35); scene.add(screen);
    W.screen = { st, sc, mesh: screen, pos: V3(4, 14.5, -49.35) };
    W.dyn.push({ update(dt) { st.t += dt; st.acc += dt; if (st.acc > 1 / 15) { st.acc = 0; sc.redraw(); } } });
  }
  // ---------- hologram: the kiosk front is fake ----------
  {
    const hc = canvasTex(512, 384, (x, w, h, t = 0) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = 'rgba(25,211,255,.55)'; x.fillRect(0, 0, w, h);
      drawSmiley(x, w / 2, h * 0.36, 80, 'rgba(255,210,63,.95)');
      x.fillStyle = '#fff'; x.font = `44px ${FONT.display}`; x.textAlign = 'center'; x.fillText('NOTHING TO SEE', w / 2, h * 0.74); x.fillText('HERE. MOVE ALONG.', w / 2, h * 0.88);
      x.fillStyle = 'rgba(255,255,255,.22)'; for (let y = (t * 60) % 8; y < h; y += 8) x.fillRect(0, y, w, 3);
    });
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.8), new THREE.MeshBasicMaterial({ map: hc.tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false }));
    holo.position.set(-7, 6, -42); holo.rotation.y = Math.PI / 2; scene.add(holo);
    let t = 0, acc = 0;
    W.holo = holo;
    W.dyn.push({ update(dt, bi) {
      t += dt; acc += dt;
      if (acc > 0.08) { acc = 0; hc.redraw(t); }
      const glitch = Math.sin(t * 3.1) > 0.97 || Math.random() < 0.01;
      holo.material.opacity = glitch ? 0.25 : 0.82 + Math.sin(t * 40) * 0.06;
      holo.position.z = -42 + (glitch ? (Math.random() - 0.5) * 0.4 : 0);
    } });
  }
  // ---------- neon noodle sign on F ----------
  {
    const nc = canvasTex(512, 160, (x, w, h, on = 1) => {
      x.fillStyle = '#1b0f2e'; x.fillRect(0, 0, w, h);
      x.font = `62px ${FONT.display}`; x.textBaseline = 'middle';
      x.shadowColor = on ? PAL.magenta : 'transparent'; x.shadowBlur = 24;
      x.fillStyle = on ? '#ffb3d1' : '#5a3a55'; x.fillText('GLEAM', 24, 80);
      x.shadowColor = on ? PAL.cyan : 'transparent'; x.fillStyle = on ? '#bff4ff' : '#3a5560'; x.fillText('NOODLES', 236, 80);
      x.shadowBlur = 0; x.fillStyle = PAL.yellow; x.font = `18px ${FONT.dot}`; x.fillText('APPROVED FLAVOR™ — MILD ONLY', 120, 140);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.75), new THREE.MeshBasicMaterial({ map: nc.tex }));
    sign.position.set(9, 4.2, 45.95); sign.rotation.y = Math.PI; scene.add(sign);
    const back = part(new THREE.BoxGeometry(12.4, 4.1, 0.3), '#14101f', 0.05); back.position.set(9, 4.2, 46.15); scene.add(back);
    let lastOn = 1;
    W.dyn.push({ update(dt, bi) { const on = (bi.inBar === 0 && bi.phase < 0.12) ? 0 : 1; if (on !== lastOn) { lastOn = on; nc.redraw(on); } } });
  }

  // ---------- relays ----------
  const relayDefs = [
    { id: 1, pos: V3(34, 1, 4), hint: 'One’s right out in the open on the teal roof east. Kick off the yellow ramp!' },
    { id: 2, pos: V3(-37.5, -2, -1), hint: 'The Ministry locked one in their storage shed on the purple roof. That door moves to the beat. Count it…' },
    { id: 3, pos: V3(-33, 14, -32.5), hint: 'Top of the orange tower. Those speaker pads launch you higher if you jump ON the beat.' },
    { id: 4, pos: V3(57, -5, 43), hint: 'My signal says one is boxed in somewhere south-east. No doors. Maybe… a vent?' },
    { id: 5, pos: V3(64, 9, -29), hint: 'Last one is on the blue Ministry roof. That lift on the teal roof rides the beat. Drones everywhere, smile big.' },
  ];
  for (const d of relayDefs) {
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
  // ---------- golden tapes (secrets) ----------
  const tapeDefs = [
    { id: 1, pos: V3(-10, 4.9, -42), text: 'TAPE #1 — “Grandma’s Jazz Hour, 1987.” Confiscated for excessive saxophone.' },
    { id: 2, pos: V3(35, 1.9, 32), text: 'TAPE #2 — Minister Glee singing in the shower. Classified. Extremely off-key.' },
    { id: 3, pos: V3(-30.5, 17.4, -35.5), text: 'TAPE #3 — Ministry memo: “Pirate broadcasts up 300%. Excellent. Proceed as planned.” …Excellent?' },
    { id: 4, pos: V3(44, -3.1, 8.5), text: 'TAPE #4 — A voice that sounds a LOT like DJ Static saying “Yes, Minister.” Probably a coincidence.' },
    { id: 5, pos: V3(54, 13.7, -30), text: 'TAPE #5 — Bolt’s demo tape, labelled “DO NOT LISTEN”. It’s… actually really good.' },
  ];
  const tapeTex = canvasTex(128, 80, (x, w, h) => {
    x.fillStyle = '#ffd23f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff6c8'; x.fillRect(10, 8, w - 20, 34);
    x.fillStyle = PAL.ink; x.font = `16px ${FONT.display}`; x.fillText('STATIC MIX', 18, 30);
    x.fillStyle = '#6b4b00'; x.beginPath(); x.arc(40, 58, 12, 0, 7); x.arc(88, 58, 12, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(40, 58, 5, 0, 7); x.arc(88, 58, 5, 0, 7); x.fill();
  }).tex;
  for (const d of tapeDefs) {
    const g = new THREE.Group(); g.position.copy(d.pos); scene.add(g);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.14), [toon('#ffd23f'), toon('#ffd23f'), toon('#ffd23f'), toon('#ffd23f'), new THREE.MeshBasicMaterial({ map: tapeTex }), new THREE.MeshBasicMaterial({ map: tapeTex })]);
    outline(body, 0.03); g.add(body);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(glow);
    W.tapes.push({ ...d, g, body, glow, got: false, t: Math.random() * 6 });
  }
  // ---------- speaker pads ----------
  const padDefs = [
    { pos: V3(-33, -2, -19.5), aim: V3(0, 0, -6.6), vy: 30.5, label: 'tower' },
    { pos: V3(44, -4, 6), aim: V3(-5.2, 0, 0), vy: 20.5, label: 'balcony' },
    { pos: V3(51, -5, 32), aim: V3(-5.4, 0, 0), vy: 26.8, label: 'courtyard' },
  ];
  for (const d of padDefs) {
    const g = new THREE.Group(); g.position.copy(d.pos); scene.add(g);
    g.add(at(part(new THREE.BoxGeometry(2.6, 0.25, 2.6), '#14101f', 0.04), 0, 0.125, 0));
    const rim = part(new THREE.CylinderGeometry(1.1, 1.15, 0.2, 20), '#ffd23f', 0.03); rim.position.y = 0.3; g.add(rim);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.2, 0.18, 20, 1, true), toon('#3a3550', { side: THREE.DoubleSide })); cone.position.y = 0.33; g.add(cone);
    const cap = part(new THREE.SphereGeometry(0.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#ff2e88', 0.02); cap.position.y = 0.25; g.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 6, 32), new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.45; g.add(ring);
    // aim arrow
    const ar = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), basic(PAL.yellow)); ar.rotation.x = Math.PI / 2; ar.position.set(0, 0.32, 1.65);
    const arG = new THREE.Group(); arG.add(ar); arG.rotation.y = Math.atan2(d.aim.x, d.aim.z); g.add(arG);
    W.pads.push({ ...d, g, cone, cap, ring, r: 1.4 });
    W.boxes.push({ x0: d.pos.x - 1.3, y0: d.pos.y, z0: d.pos.z - 1.3, x1: d.pos.x + 1.3, y1: d.pos.y + 0.25, z1: d.pos.z + 1.3, tag: 'pad' });
  }
  // ---------- the beat shutter (D shed) ----------
  {
    const st = canvasTex(128, 128, (x, w, h) => { for (let y = 0; y < h; y += 16) { x.fillStyle = '#e9e4f5'; x.fillRect(0, y, w, 12); x.fillStyle = '#9b97ad'; x.fillRect(0, y + 12, w, 4); } }).tex;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.15, 3.5), toon('#ffffff', { map: st, noCache: true }));
    outline(door, 0.04); scene.add(door);
    const col = { x0: -32.35, y0: -2, z0: -2, x1: -32.05, y1: 1.15, z1: 1.5, tag: 'door' };
    W.boxes.push(col);
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.9), basic('#ff2244')); light.position.set(-31.85, 1.55, -0.25); scene.add(light);
    W.shutter = { door, col, light, open: 0 };
    W.dyn.push({ update(dt, bi) {
      const ib = ((bi.b % 4) + 4) % 4;
      let o = ib < 0.2 ? ib / 0.2 : ib < 1.8 ? 1 : ib < 2.05 ? 1 - (ib - 1.8) / 0.25 : 0;
      if (!bi.playing) o = 0;
      W.shutter.open = o;
      const bottom = -2 + 3.1 * o;
      col.y0 = bottom; col.y1 = Math.max(bottom + 0.05, 1.15);
      door.position.set(-32.2, bottom + 1.575, -0.25);
      light.material.color.set(o > 0.6 ? 0x33ff88 : 0xff2244);
    } });
  }
  // ---------- the BEAT LIFT (B → H) ----------
  {
    const plat = new THREE.Group(); scene.add(plat);
    const hz = canvasTex(128, 128, (x, w, h) => { x.fillStyle = PAL.yellow; x.fillRect(0, 0, w, h); x.fillStyle = PAL.ink; for (let i = -4; i < 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 16 + 128, h); x.lineTo(i * 32 + 128, h); x.fill(); } }, { repeat: true }).tex;
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 6), [toon('#3a3550'), toon('#3a3550'), toon('#ffffff', { map: hz, noCache: true }), toon('#3a3550'), toon('#3a3550'), toon('#3a3550')]);
    outline(top, 0.06); top.position.y = -0.25; plat.add(top);
    const spk = part(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 16), '#14101f', 0.04); spk.position.y = -0.8; plat.add(spk);
    for (const [x, z] of [[42.3, -13.3], [47.7, -13.3], [42.3, -6.7], [47.7, -6.7]]) cyl(x, STREET, z, 0.15, 11 - STREET, '#5b4a6b', { outline: 0.03 });
    const col = { x0: 42, y0: 0.5, z0: -13, x1: 48, y1: 1, z1: -7, tag: 'lift' };
    W.boxes.push(col);
    poster(['BEAT LIFT', 'HOP ON — IT RIDES THE BEAT'], 40, 3.2, -9.9, 4.2, 1.3, 0, { bg: PAL.yellow, smiley: false, w: 512, h: 160 });
    cyl(38.4, 1, -10.1, 0.08, 2.6, '#5b4a6b', { outline: 0.02 }); cyl(41.6, 1, -10.1, 0.08, 2.6, '#5b4a6b', { outline: 0.02 });
    W.lift = { plat, col, y: 1 };
    W.dyn.push({ update(dt, bi) {
      const p = ((bi.b % 8) + 8) % 8;
      let s = p < 2 ? 0 : p < 4 ? U.smooth((p - 2) / 2) : p < 6 ? 1 : 1 - U.smooth((p - 6) / 2);
      if (!bi.playing) s = 0;
      const y = U.lerp(1, 9, s);
      col.y1 = y; col.y0 = y - 0.5; W.lift.y = y;
      plat.position.set(45, y, -10);
      spk.scale.setScalar(1 + Math.exp(-bi.phase * 7) * 0.08);
    } });
  }
  // ---------- drones ----------
  const dfaces = droneFaces();
  const droneDefs = [
    { path: [[52, 13, -13], [66, 13, -13], [66, 13, -33], [52, 13, -33]], speed: 3.2, phase: 0 },
    { path: [[66, 13, -24], [52, 13, -24], [52, 13, -16], [66, 13, -16]], speed: 2.6, phase: 0.5 },
    { path: [[-4, 10, -27], [12, 10, -27], [12, 10, -44], [-4, 10, -44]], speed: 3, phase: 0.2 },
    { path: [[-6, 5.5, 26], [24, 5.5, 26], [24, 5.5, 42], [-6, 5.5, 42]], speed: 2.6, phase: 0.7 },
  ];
  for (const d of droneDefs) {
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

  W.relaysOn = () => W.relays.filter(r => r.active).length;
  W.tapesGot = () => W.tapes.filter(t => t.got).length;
  return W;
}

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
