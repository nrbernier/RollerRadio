// ============================================================
//  CORE — utils, renderer, toon materials, outlines, textures
// ============================================================
const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  smooth: t => t * t * (3 - 2 * t),
  ease: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  damp: (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt)),
  angDamp(a, b, k, dt) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * (1 - Math.exp(-k * dt)); },
  wrapAng(a) { return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; },
  rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; },
  isTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
};
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const FONT = {
  display: '"Dela Gothic One", "Arial Black", Impact, sans-serif',
  body: '"M PLUS Rounded 1c", "Trebuchet MS", system-ui, sans-serif',
  dot: '"DotGothic16", "Courier New", monospace'
};

const G = {};
function initRenderer() {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  G.dprMax = Math.min(window.devicePixelRatio || 1, U.isTouch ? 1.75 : 2);
  G.dpr = G.dprMax;
  renderer.setPixelRatio(G.dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0xff9d6b);
  G.renderer = renderer;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffa27a, 70, 330);
  G.scene = scene;
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 1400);
  G.camera = camera;
  scene.add(camera);

  // lights — low sunset sun from the west
  const hemi = new THREE.HemisphereLight(0xffe7d6, 0x6b4fa0, 0.62); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd7a8, 0.78); sun.position.set(-60, 45, 30); scene.add(sun);
  G.sun = sun; G.hemi = hemi;

  // toon ramp
  const ramp = new Uint8Array([90, 90, 110, 255, 175, 165, 185, 255, 255, 255, 255, 255]);
  const grad = new THREE.DataTexture(ramp, 3, 1, THREE.RGBAFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
  G.grad = grad;
  G.outlineMat = new THREE.MeshBasicMaterial({ color: 0x14101f, side: THREE.BackSide, fog: true });
  G.lineMat = new THREE.LineBasicMaterial({ color: 0x14101f, fog: true, transparent: true, opacity: 0.85 });
  G.toonCache = {};
  window.addEventListener('resize', onResize);
  onResize();
}
function onResize() {
  if (!G.renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  G.renderer.setSize(w, h, false);
  G.camera.aspect = w / h;
  G.camera.fov = w < h ? 80 : 66;
  G.camera.updateProjectionMatrix();
}
function toon(color, opts = {}) {
  const { noCache, ...rest } = opts || {};
  const key = color + JSON.stringify(rest);
  if (!noCache && G.toonCache[key]) return G.toonCache[key];
  const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: G.grad }, rest));
  if (!noCache) G.toonCache[key] = m;
  return m;
}
function basic(color, opts = {}) { return new THREE.MeshBasicMaterial(Object.assign({ color }, opts)); }

// inverted-hull outline: a back-faced, slightly inflated copy behind the mesh
function outline(mesh, t = 0.04) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox, size = bb.getSize(V3()), c = bb.getCenter(V3());
  const s = V3(size.x > 1e-4 ? (size.x + 2 * t) / size.x : 1, size.y > 1e-4 ? (size.y + 2 * t) / size.y : 1, size.z > 1e-4 ? (size.z + 2 * t) / size.z : 1);
  const o = new THREE.Mesh(g, G.outlineMat);
  o.scale.copy(s);
  o.position.set(c.x * (1 - s.x), c.y * (1 - s.y), c.z * (1 - s.z));
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}
// convenience: toon mesh + outline
function part(geo, color, t = 0.04, opts) {
  const m = new THREE.Mesh(geo, typeof color === 'object' ? color : toon(color, opts));
  if (t > 0) outline(m, t);
  return m;
}

// ---------- static geometry merger ----------
// Everything static is merged into a few big meshes per material, split into
// spatial chunks so the camera can skip what it can't see.
const CHUNK = 48;
class StaticBatch {
  constructor() { this.buckets = {}; this.lines = {}; }
  bucket(name, x, z) {
    const key = name + '|' + Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK);
    return this.buckets[key] || (this.buckets[key] = { name, pos: [], nor: [], col: [], uv: [] });
  }
  // kind: 'building' (windows on sides, roof on top), 'plain', 'roofonly' and any material name
  add(geo, matrix, color, kind = 'plain', { outlineT = 0.12, edges = true, uvScale = 8, roofColor = null } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const col = new THREE.Color(color), rcol = new THREE.Color(roofColor || color);
    for (let i = 0; i < p.length; i += 9) {
      const ny = (n[i + 1] + n[i + 4] + n[i + 7]) / 3, nx = (n[i] + n[i + 3] + n[i + 6]) / 3, nz = (n[i + 2] + n[i + 5] + n[i + 8]) / 3;
      let bn = kind;
      if (kind === 'building') bn = Math.abs(ny) > 0.5 ? 'roof' : 'wall';
      else if (kind === 'roofonly') bn = 'roof';
      else if (kind === 'metal') bn = 'plain';
      const cx = (p[i] + p[i + 3] + p[i + 6]) / 3, cz = (p[i + 2] + p[i + 5] + p[i + 8]) / 3;
      const b = this.bucket(bn, cx, cz);
      const shade = ny < -0.5 ? 0.55 : 1;
      const cc = bn === 'roof' && roofColor ? rcol : col;
      for (let k = 0; k < 3; k++) {
        const j = i + k * 3;
        b.pos.push(p[j], p[j + 1], p[j + 2]);
        b.nor.push(n[j], n[j + 1], n[j + 2]);
        b.col.push(cc.r * shade, cc.g * shade, cc.b * shade);
        let u, v;
        const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        if (ay >= ax && ay >= az) { u = p[j]; v = p[j + 2]; }
        else if (ax >= az) { u = p[j + 2] * Math.sign(nx || 1); v = p[j + 1]; }
        else { u = -p[j] * Math.sign(nz || 1); v = p[j + 1]; }
        b.uv.push(u / uvScale, v / uvScale);
      }
    }
    if (outlineT > 0) {
      g.computeBoundingBox();
      const bb = g.boundingBox, size = bb.getSize(V3()), c = bb.getCenter(V3());
      const og = g.clone();
      const sx = size.x > 1e-4 ? (size.x + 2 * outlineT) / size.x : 1, sy = size.y > 1e-4 ? (size.y + 2 * outlineT) / size.y : 1, sz = size.z > 1e-4 ? (size.z + 2 * outlineT) / size.z : 1;
      og.applyMatrix4(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z).multiply(new THREE.Matrix4().makeScale(sx, sy, sz)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z)));
      this.addOutline(og);
    }
    if (edges) {
      const eg = new THREE.EdgesGeometry(geo, 30); if (matrix) eg.applyMatrix4(matrix);
      const a = eg.attributes.position.array;
      for (let i = 0; i < a.length; i += 6) {
        const key = Math.floor((a[i] + a[i + 3]) / 2 / CHUNK) + ',' + Math.floor((a[i + 2] + a[i + 5]) / 2 / CHUNK);
        const L = this.lines[key] || (this.lines[key] = []);
        for (let k = 0; k < 6; k++) L.push(a[i + k]);
      }
    }
  }
  // back-faced hull geometry already shaped as an outline (e.g. a fatter tube)
  addOutline(geo) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const op = g.attributes.position.array;
    for (let i = 0; i < op.length; i += 9) {
      const b = this.bucket('outline', (op[i] + op[i + 3] + op[i + 6]) / 3, (op[i + 2] + op[i + 5] + op[i + 8]) / 3);
      for (let k = 0; k < 9; k++) b.pos.push(op[i + k]);
    }
  }
  box(x0, y0, z0, x1, y1, z1, color, kind = 'plain', opts) {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const m = new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(geo, m, color, kind, opts);
  }
  build(materials) {
    const group = new THREE.Group();
    for (const key in this.buckets) {
      const b = this.buckets[key], name = b.name;
      if (!b.pos.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      if (name === 'outline') { group.add(new THREE.Mesh(g, G.outlineMat)); continue; }
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      const mesh = new THREE.Mesh(g, materials[name] || materials.plain);
      if (name === 'water' || name === 'glow') mesh.renderOrder = 3;
      group.add(mesh);
    }
    for (const key in this.lines) {
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(this.lines[key], 3));
      group.add(new THREE.LineSegments(lg, G.lineMat));
    }
    return group;
  }
}

// tube along a polyline, with parallel-transport frames (rails, pipes, cables)
function tubeGeo(pts, r, radial = 6) {
  const n = pts.length, pos = [], nor = [], idx = [];
  const T = [], N = [], Bn = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(V3().subVectors(b, a).normalize());
  }
  let nn = Math.abs(T[0].y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  nn = V3().crossVectors(T[0], nn).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) { const bb = V3().crossVectors(T[i - 1], T[i]); if (bb.length() > 1e-6) { bb.normalize(); const ang = Math.acos(U.clamp(T[i - 1].dot(T[i]), -1, 1)); nn.applyAxisAngle(bb, ang); } }
    N.push(nn.clone()); Bn.push(V3().crossVectors(T[i], nn).normalize());
  }
  for (let i = 0; i < n; i++) for (let k = 0; k <= radial; k++) {
    const a = k / radial * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const nx = N[i].x * c + Bn[i].x * s, ny = N[i].y * c + Bn[i].y * s, nz = N[i].z * c + Bn[i].z * s;
    pos.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r); nor.push(nx, ny, nz);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < radial; k++) {
    const a = i * (radial + 1) + k, b = a + radial + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// ---------- canvas textures ----------
function canvasTex(w, h, draw, { repeat = false, nearest = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
  if (nearest) { tex.magFilter = THREE.NearestFilter; }
  tex.anisotropy = 4;
  const o = { c, x, tex, draw, redraw(...a) { draw(x, w, h, ...a); tex.needsUpdate = true; } };
  o.redraw();
  return o;
}

const PAL = {
  ink: '#14101f', yellow: '#ffd23f', magenta: '#ff2e88', cyan: '#19d3ff', mint: '#8ff0c8', mintDark: '#2e9b7a',
  pink: '#ffb3d1', orange: '#ff7a2f', violet: '#6a3df0', lime: '#c6ff3d', cream: '#fff6e8'
};

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

function makeWindowTex() {
  return canvasTex(256, 256, (x, w, h) => {
    const r = U.rng(7);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    // floor bands
    for (let f = 0; f < 4; f++) { x.fillStyle = '#e2dcef'; x.fillRect(0, f * 64 + 54, w, 10); }
    for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) {
      const lit = r() < 0.28;
      const X = c * 64 + 12, Y = f * 64 + 10;
      x.fillStyle = '#1d1838'; x.fillRect(X - 3, Y - 3, 46, 40);
      x.fillStyle = lit ? '#ffe9a0' : '#4b4f8f'; x.fillRect(X, Y, 40, 34);
      if (!lit) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(X, Y + 34); x.lineTo(X + 16, Y); x.lineTo(X + 24, Y); x.lineTo(X + 8, Y + 34); x.fill(); }
      x.fillStyle = '#1d1838'; x.fillRect(X + 19, Y, 3, 34);
    }
  }, { repeat: true });
}
function makeRoofTex() {
  return canvasTex(256, 256, (x, w, h) => {
    const r = U.rng(3);
    x.fillStyle = '#f2eef8'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(60,40,90,${r() * 0.07})`; x.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4); }
    x.strokeStyle = 'rgba(40,30,70,.22)'; x.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); }
    // a few painted skate-scuffs
    x.strokeStyle = 'rgba(20,16,31,.12)'; x.lineWidth = 2;
    for (let i = 0; i < 6; i++) { x.beginPath(); const a = r() * w, b = r() * h; x.moveTo(a, b); x.quadraticCurveTo(a + 40, b + r() * 40 - 20, a + 90, b + r() * 30); x.stroke(); }
  }, { repeat: true });
}

// propaganda poster
function posterTex(lines, { bg = PAL.mint, fg = PAL.ink, accent = PAL.pink, w = 512, h = 256, smiley = true } = {}) {
  return canvasTex(w, h, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    // sunburst
    x.save(); x.translate(smiley ? h * 0.5 : w / 2, h / 2);
    for (let i = 0; i < 18; i++) { x.rotate(Math.PI / 9); x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, -30); x.lineTo(w, 30); x.fill(); }
    x.restore();
    if (smiley) drawSmiley(x, h * 0.5, h * 0.5, h * 0.33, accent);
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    const tx = smiley ? (h + (w - h) / 2) - 10 : w / 2;
    const maxW = smiley ? w - h - 10 : w - 40;
    const n = lines.length;
    lines.forEach((ln, i) => {
      let size = i === 0 ? 46 : 26;
      x.font = `${size}px ${i === 0 ? FONT.display : FONT.dot}`;
      while (x.measureText(ln).width > maxW && size > 14) { size -= 2; x.font = `${size}px ${i === 0 ? FONT.display : FONT.dot}`; }
      x.fillText(ln, tx, h / 2 + (i - (n - 1) / 2) * (n > 2 ? 52 : 64));
    });
    x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  });
}
function drawSmiley(x, cx, cy, r, col = PAL.yellow, mood = 'happy') {
  x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  x.lineWidth = r * 0.09; x.strokeStyle = PAL.ink; x.stroke();
  x.fillStyle = PAL.ink;
  x.beginPath(); x.ellipse(cx - r * 0.33, cy - r * 0.2, r * 0.09, r * 0.17, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(cx + r * 0.33, cy - r * 0.2, r * 0.09, r * 0.17, 0, 0, Math.PI * 2); x.fill();
  x.lineWidth = r * 0.1; x.lineCap = 'round';
  x.beginPath(); x.arc(cx, cy + r * 0.05, r * 0.52, 0.18 * Math.PI, 0.82 * Math.PI); x.stroke();
}

// static noise into a small canvas then scaled
const _noiseC = document.createElement('canvas'); _noiseC.width = 96; _noiseC.height = 54;
const _noiseX = _noiseC.getContext('2d');
function drawStatic(x, w, h, alpha = 1) {
  const id = _noiseX.createImageData(96, 54);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = v; id.data[i + 1] = v * 0.9; id.data[i + 2] = v; id.data[i + 3] = 255 * alpha; }
  _noiseX.putImageData(id, 0, 0);
  x.imageSmoothingEnabled = false; x.drawImage(_noiseC, 0, 0, w, h); x.imageSmoothingEnabled = true;
}

// --- the big screen: Minister Glee / DJ Static / static
function drawMinister(x, w, h, t, { talking = false, wink = false, mood = 'happy', caption = 'GOOD EVENING, GLEAM CITY!' } = {}) {
  x.fillStyle = '#b6f5dc'; x.fillRect(0, 0, w, h);
  x.save(); x.translate(w / 2, h * 0.62);
  for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.fillStyle = i % 2 ? 'rgba(255,255,255,.55)' : 'rgba(255,179,209,.35)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, -60); x.lineTo(w, 60); x.fill(); }
  x.restore();
  const cx = w / 2, cy = h * 0.5 + Math.sin(t * 2.2) * 3, R = h * 0.31;
  // suit + medals
  x.fillStyle = '#3b3f8a'; roundRect(x, cx - R * 1.35, cy + R * 0.75, R * 2.7, R * 1.4, R * 0.4); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - R * 0.35, cy + R * 0.78); x.lineTo(cx, cy + R * 1.3); x.lineTo(cx + R * 0.35, cy + R * 0.78); x.fill();
  x.fillStyle = PAL.magenta; x.beginPath(); x.moveTo(cx, cy + R * 0.95); x.lineTo(cx - R * 0.3, cy + R * 0.8); x.lineTo(cx - R * 0.3, cy + R * 1.1); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(cx, cy + R * 0.95); x.lineTo(cx + R * 0.3, cy + R * 0.8); x.lineTo(cx + R * 0.3, cy + R * 1.1); x.closePath(); x.fill();
  for (let i = 0; i < 4; i++) { x.fillStyle = [PAL.yellow, PAL.cyan, PAL.yellow, PAL.pink][i]; x.beginPath(); x.arc(cx + R * 0.55 + (i % 2) * R * 0.25, cy + R * 1.05 + Math.floor(i / 2) * R * 0.22, R * 0.09, 0, 7); x.fill(); x.strokeStyle = PAL.ink; x.lineWidth = 3; x.stroke(); }
  // head
  x.fillStyle = '#ffc9a8'; x.beginPath(); x.ellipse(cx, cy, R * 0.92, R, 0, 0, 7); x.fill(); x.strokeStyle = PAL.ink; x.lineWidth = 6; x.stroke();
  // hair: magnificent side part
  x.fillStyle = '#2a2140'; x.beginPath(); x.moveTo(cx - R * 0.95, cy - R * 0.15); x.quadraticCurveTo(cx - R * 0.9, cy - R * 1.25, cx + R * 0.2, cy - R * 1.08); x.quadraticCurveTo(cx + R * 1.05, cy - R * 0.95, cx + R * 0.92, cy - R * 0.2); x.quadraticCurveTo(cx + R * 0.4, cy - R * 0.85, cx - R * 0.95, cy - R * 0.15); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - R * 0.5, cy - R * 0.85); x.quadraticCurveTo(cx, cy - R * 1.05, cx + R * 0.5, cy - R * 0.85); x.stroke();
  // eyes ^ ^
  x.strokeStyle = PAL.ink; x.lineWidth = 7; x.lineCap = 'round';
  const ey = cy - R * 0.12;
  x.beginPath(); x.arc(cx - R * 0.35, ey + R * 0.08, R * 0.16, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke();
  if (wink) { x.beginPath(); x.moveTo(cx + R * 0.2, ey); x.lineTo(cx + R * 0.5, ey); x.stroke(); }
  else if (mood === 'open') { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + R * 0.35, ey, R * 0.15, 0, 7); x.fill(); x.stroke(); x.fillStyle = PAL.ink; x.beginPath(); x.arc(cx + R * 0.35, ey, R * 0.06, 0, 7); x.fill(); }
  else { x.beginPath(); x.arc(cx + R * 0.35, ey + R * 0.08, R * 0.16, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke(); }
  // cheeks
  x.fillStyle = 'rgba(255,90,140,.4)'; x.beginPath(); x.arc(cx - R * 0.55, cy + R * 0.2, R * 0.14, 0, 7); x.arc(cx + R * 0.55, cy + R * 0.2, R * 0.14, 0, 7); x.fill();
  // the smile
  const open = talking ? (0.25 + 0.75 * Math.abs(Math.sin(t * 13))) : 0.2;
  x.fillStyle = '#7a1f3d'; x.beginPath(); x.ellipse(cx, cy + R * 0.35, R * 0.48, R * 0.28 * open + R * 0.05, 0, 0, Math.PI); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.fillRect(cx - R * 0.4, cy + R * 0.35, R * 0.8, R * 0.07 + R * 0.05 * open);
  // ticker
  x.fillStyle = PAL.ink; x.fillRect(0, h - 46, w, 46);
  x.fillStyle = PAL.yellow; x.font = `26px ${FONT.dot}`; x.textBaseline = 'middle';
  const msg = `★ ${caption} ★ TODAY'S MOOD: DELIGHTED ★ DECREE 88: KEEP IT SLOW ★ REPORT UNSMILING NEIGHBORS ★ `;
  const mw = x.measureText(msg).width; const off = (t * 90) % mw;
  x.fillText(msg + msg, -off, h - 22);
  x.fillStyle = PAL.magenta; x.fillRect(16, 16, 92, 34); x.fillStyle = '#fff'; x.font = `20px ${FONT.display}`; x.fillText('LIVE', 30, 34);
  x.fillStyle = PAL.ink; x.font = `22px ${FONT.dot}`; x.textAlign = 'right'; x.fillText('MINISTRY OF GOOD VIBES', w - 18, 34); x.textAlign = 'left';
}
function drawDJ(x, w, h, t, o = {}) {
  const talking = !!o.talking;
  x.fillStyle = '#1b0f2e'; x.fillRect(0, 0, w, h);
  // checker floor + speaker stacks
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#ff2e88' : '#2a1748'; x.fillRect(i * w / 12, h * 0.72 + j * h * 0.07, w / 12, h * 0.07); }
  const bob = Math.sin(t * Math.PI * 2 * (116 / 60)) * 4;
  const cx = w / 2, cy = (o.mini ? h * 0.5 : h * 0.46) + bob, S = h * (o.mini ? 0.3 : 0.24);
  // hoodie
  x.fillStyle = '#5b2bd6'; roundRect(x, cx - S * 1.5, cy + S * 0.8, S * 3, S * 1.6, S * 0.5); x.fill(); x.strokeStyle = PAL.ink; x.lineWidth = 6; x.stroke();
  // headphones band
  x.strokeStyle = PAL.ink; x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, S * 1.15, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
  x.strokeStyle = PAL.yellow; x.lineWidth = 9; x.stroke();
  // CRT head
  x.fillStyle = '#d9d2c3'; roundRect(x, cx - S, cy - S * 0.8, S * 2, S * 1.6, S * 0.25); x.fill(); x.strokeStyle = PAL.ink; x.lineWidth = 6; x.stroke();
  x.save(); roundRect(x, cx - S * 0.8, cy - S * 0.62, S * 1.6, S * 1.24, S * 0.18); x.clip();
  x.fillStyle = '#0e2a3a'; x.fillRect(cx - S, cy - S, S * 2, S * 2);
  x.globalAlpha = 0.35; drawStatic(x, w, h); x.globalAlpha = 1;
  // pixel face
  x.fillStyle = PAL.cyan;
  const px = S * 0.13;
  const eyeOpen = (Math.sin(t * 1.3) > -0.95);
  if (eyeOpen) { x.fillRect(cx - S * 0.45, cy - S * 0.25, px * 2, px * 2); x.fillRect(cx + S * 0.2, cy - S * 0.25, px * 2, px * 2); }
  else { x.fillRect(cx - S * 0.45, cy - S * 0.15, px * 2, px * 0.6); x.fillRect(cx + S * 0.2, cy - S * 0.15, px * 2, px * 0.6); }
  const mo = talking ? Math.abs(Math.sin(t * 14)) : 0.1;
  x.fillRect(cx - S * 0.35, cy + S * 0.18, S * 0.7, px * (0.6 + mo * 1.8));
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(cx - S, cy - S * 0.62 + i * S * 0.22, S * 2, 3); }
  x.restore();
  // ear cups
  x.fillStyle = PAL.yellow; x.strokeStyle = PAL.ink; x.lineWidth = 6;
  roundRect(x, cx - S * 1.32, cy - S * 0.35, S * 0.4, S * 0.8, 12); x.fill(); x.stroke();
  roundRect(x, cx + S * 0.92, cy - S * 0.35, S * 0.4, S * 0.8, 12); x.fill(); x.stroke();
  // antennas
  x.lineWidth = 5; x.beginPath(); x.moveTo(cx - S * 0.3, cy - S * 0.8); x.lineTo(cx - S * 0.8, cy - S * 1.5); x.moveTo(cx + S * 0.3, cy - S * 0.8); x.lineTo(cx + S * 0.6, cy - S * 1.6); x.stroke();
  x.fillStyle = PAL.magenta; x.beginPath(); x.arc(cx - S * 0.8, cy - S * 1.5, 8, 0, 7); x.arc(cx + S * 0.6, cy - S * 1.6, 8, 0, 7); x.fill();
  // headline
  if (o.gov) {   // Static, broadcasting from the Ministry's own studio
    x.fillStyle = PAL.mint; x.fillRect(0, 0, w, 58); x.fillStyle = PAL.ink; x.font = `24px ${FONT.dot}`; x.textBaseline = 'middle';
    x.fillText('MINISTRY OF GOOD VIBES', 22, 30); x.textAlign = 'right'; x.fillStyle = PAL.magenta; x.fillText('★ NEW MANAGEMENT ★', w - 22, 30); x.textAlign = 'left';
    x.fillStyle = PAL.ink; x.fillRect(0, h - 46, w, 46); x.fillStyle = PAL.yellow; x.font = `26px ${FONT.dot}`;
    const msg = `★ ${o.caption || 'TODAY’S MOOD: FREE'} ★ IT’S MANDATORY ★ ALL MUSIC MUST BE 116 BPM ★ REPORT UNDANCING NEIGHBORS ★ `;
    const mw = x.measureText(msg).width, off = (t * 90) % mw; x.fillText(msg + msg, -off, h - 22);
  } else if (!o.mini) {
    x.fillStyle = PAL.yellow; x.font = `34px ${FONT.display}`; x.textBaseline = 'middle';
    x.save(); x.translate(24, 40); x.rotate(-0.05); x.fillText('RADIO STATIC', 0, 0); x.restore();
    x.fillStyle = '#fff'; x.font = `22px ${FONT.dot}`; x.fillText('108.??? FM  ● ON AIR', 26, 80);
  }
  // glitch slices
  if (Math.random() < 0.25) { const y = Math.random() * h; const sh = 6 + Math.random() * 20; const img = x.getImageData(0, y, w, sh); x.putImageData(img, (Math.random() - 0.5) * 40, y); }
  // scanlines
  x.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2);
}

// GNN news bulletin with a police sketch (of someone in big yellow headphones)
function wrapText(x, txt, maxW) {
  const words = txt.split(' '), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function drawNews(x, w, h, t, o = {}) {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2a6b'); g.addColorStop(1, '#0c1238'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(25,211,255,${0.04 + 0.03 * Math.sin(t * 2 + i)})`; x.fillRect(0, 60 + i * 34, w, 14); }
  // the sketch
  const px = 26, py = 70, pw = 210, ph = 238;
  x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate(-0.03); x.translate(-pw / 2, -ph / 2);
  x.fillStyle = '#f4efe3'; x.fillRect(0, 0, pw, ph); x.strokeStyle = PAL.ink; x.lineWidth = 4; x.strokeRect(0, 0, pw, ph);
  const jit = () => (Math.random() - 0.5) * 2.2;
  x.strokeStyle = '#3a3a44'; x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round';
  const cx = pw / 2, cy = 128;
  x.beginPath(); x.ellipse(cx + jit(), cy + jit(), 50, 60, 0, 0, 7); x.stroke();                         // face
  x.beginPath(); x.moveTo(cx - 58, cy + 26); x.quadraticCurveTo(cx - 70 + jit(), cy - 80, cx, cy - 74); x.quadraticCurveTo(cx + 70 + jit(), cy - 80, cx + 58, cy + 26); x.stroke();   // bob
  x.beginPath(); for (let i = 0; i <= 6; i++) x.lineTo(cx - 40 + i * 13.3 + jit(), cy - 40 + (i % 2 ? 14 : 0) + jit()); x.stroke();    // spiky bangs
  for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx - 44 + k * 6, cy - 64 + jit()); x.lineTo(cx - 54 + k * 5, cy + 18 + jit()); x.stroke(); }  // shading
  x.beginPath(); x.arc(cx - 18, cy - 4, 4, 0, 7); x.arc(cx + 18, cy - 4, 4, 0, 7); x.fill();
  x.beginPath(); x.moveTo(cx - 14, cy + 30); x.lineTo(cx + 14 + jit(), cy + 28); x.stroke();
  x.lineWidth = 7; x.strokeStyle = '#3a3a44'; x.beginPath(); x.arc(cx, cy - 6, 68, Math.PI * 1.08, Math.PI * 1.92); x.stroke();      // headphone band
  x.fillStyle = PAL.yellow; x.lineWidth = 3;
  for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(cx + sd * 66, cy - 2, 16, 26, 0, 0, 7); x.fill(); x.stroke(); }            // BIG YELLOW HEADPHONES
  x.fillStyle = '#c8102e'; x.font = `22px ${FONT.display}`; x.textAlign = 'center'; x.fillText('SUSPECT', cx, ph - 18); x.textAlign = 'left';
  x.restore();
  // headline
  x.fillStyle = '#c8102e'; x.fillRect(0, 0, w, 52); x.fillStyle = '#fff'; x.font = `30px ${FONT.display}`; x.textBaseline = 'middle';
  x.fillText('GNN', 18, 27); x.font = `22px ${FONT.dot}`; x.fillText(Math.floor(t * 2) % 2 ? '● BREAKING' : '  BREAKING', 104, 27);
  x.textAlign = 'right'; x.fillText('GLEAM NEWS NETWORK', w - 18, 27); x.textAlign = 'left';
  x.fillStyle = '#fff'; x.font = `34px ${FONT.display}`;
  const lines = wrapText(x, o.caption || 'SONIC ATTACK ON SMILE TOWER', w - 280);
  lines.slice(0, 3).forEach((ln, i) => x.fillText(ln, 258, 100 + i * 42));
  x.fillStyle = PAL.yellow; x.font = `20px ${FONT.dot}`;
  const sub = wrapText(x, o.sub || 'POLICE HUNT MASKED SKATER FROM TERRORIST GROUP “THE HUSH”', w - 280);
  sub.slice(0, 4).forEach((ln, i) => x.fillText(ln, 258, 104 + Math.min(3, lines.length) * 42 + i * 28));
  x.fillStyle = '#fff'; x.fillRect(0, h - 46, w, 46); x.fillStyle = PAL.ink; x.font = `24px ${FONT.dot}`;
  const msg = `▲ ${o.ticker || 'DISTINGUISHING FEATURES: BIG YELLOW HEADPHONES'} ▲ IF YOU SEE THEM, REPORT THEM ▲ THEN SMILE ▲ `;
  const mw = x.measureText(msg).width, off = (t * 100) % mw; x.fillText(msg + msg, -off, h - 22);
  x.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2);
}
// a classified dossier, glowing on a monitor
function drawDossier(x, w, h, t, o = {}) {
  x.fillStyle = '#3a3550'; x.fillRect(0, 0, w, h);
  x.save(); x.translate(w / 2, h / 2); x.rotate(-0.02); x.translate(-w / 2, -h / 2);
  x.fillStyle = '#e8d9a8'; x.fillRect(22, 22, w - 44, h - 36); x.fillRect(40, 10, 150, 20);
  x.strokeStyle = '#b8a878'; x.lineWidth = 2; x.strokeRect(22, 22, w - 44, h - 36);
  x.fillStyle = PAL.ink; x.font = `40px ${FONT.display}`; x.textBaseline = 'middle'; x.fillText('PROJECT STATIC', 44, 66);
  x.font = `20px ${FONT.dot}`; x.fillStyle = '#5a4a2a'; x.fillText('CONTROLLED OPPOSITION PROGRAM', 46, 100);
  const L = o.lines || ['EST. 2009 · MINISTRY OF GOOD VIBES', 'ASSET: “DJ STATIC” (PIRATE PERSONA)', 'PURPOSE: GIVE REBELS SOMEWHERE SAFE TO REBEL', 'RELAY NETWORK = AUDIO COLLECTION', 'FIELD AGENT: J. — UNAWARE ☺', 'STATUS: ACTIVE'];
  x.fillStyle = PAL.ink; x.font = `18px ${FONT.dot}`;
  L.forEach((ln, i) => { x.fillText(ln, 46, 138 + i * 30); if (i === 4) { x.fillStyle = '#14101f'; x.fillRect(44 + x.measureText('FIELD AGENT: ').width, 128 + i * 30, 26, 20); x.fillStyle = PAL.ink; } });
  // a photo, paper-clipped
  x.save(); x.translate(w - 214, 120); x.rotate(0.06); x.fillStyle = '#fff'; x.fillRect(-8, -8, 176, 116);
  x.beginPath(); x.rect(0, 0, 160, 90); x.clip(); x.scale(0.25, 0.25); drawDJ(x, 640, 360, t, { mini: true }); x.restore();
  x.strokeStyle = '#8a8fa8'; x.lineWidth = 4; x.beginPath(); x.moveTo(w - 150, 106); x.lineTo(w - 150, 136); x.stroke();
  // stamp
  x.save(); x.translate(w - 150, h - 70); x.rotate(-0.22); x.strokeStyle = '#c8102e'; x.fillStyle = '#c8102e'; x.lineWidth = 5; x.globalAlpha = 0.85;
  x.strokeRect(-110, -26, 220, 52); x.font = `30px ${FONT.display}`; x.textAlign = 'center'; x.fillText('CLASSIFIED', 0, 2); x.textAlign = 'left'; x.restore();
  x.restore();
  if (Math.random() < 0.2) { const y = Math.random() * h; const sh = 4 + Math.random() * 12; const img = x.getImageData(0, y, w, sh); x.putImageData(img, (Math.random() - 0.5) * 24, y); }
  x.fillStyle = 'rgba(0,0,0,.15)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2);
}
