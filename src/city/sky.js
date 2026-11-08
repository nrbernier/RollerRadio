// ============================================================
//  SKY — a slow day and night (about 20 minutes), mountains across the
//  lake, stars, lit windows and street lamps after dark
// ============================================================
// the city's sky: a soft gradient, a sun with a glow, and clouds drifting on a high plane
function cityDome() {
  const c3 = (h) => new THREE.Color(h);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: 0 }, uSun: { value: V3(0, 0.3, 0.9).normalize() }, uTop: { value: c3('#2f6fc8') }, uMid: { value: c3('#6aa8e8') }, uHor: { value: c3('#c8e2f2') }, uLow: { value: c3('#8a9ab0') }, uCloud: { value: c3('#ffffff') }, uSunC: { value: c3('#fff2d0') }, uNight: { value: 0 }, uDisk: { value: 0.035 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; uniform float uT, uNight, uDisk; uniform vec3 uSun, uTop, uMid, uHor, uLow, uCloud, uSunC;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
      void main(){
        float h = vP.y;
        vec3 c = h > 0.0 ? mix(uMid, uTop, smoothstep(0.04, 0.6, h)) : uLow;
        c = mix(c, uHor, (1.0 - smoothstep(0.0, 0.2, abs(h))) * 0.92);
        float d = distance(vP, uSun);
        c += uSunC * 0.22 * exp(-d * 5.0);
        c = mix(c, uSunC, 1.0 - smoothstep(uDisk, uDisk + 0.004, d));
        if (h > 0.0) {
          vec2 uv = vP.xz / (h + 0.12) * 1.4 + vec2(uT * 0.006, uT * 0.003);
          float n = fbm(uv);
          float cl = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.12, h);
          vec3 cc = mix(uCloud, uHor, 0.25) * (0.85 + 0.25 * smoothstep(0.5, 0.9, n));
          cc += uSunC * 0.25 * exp(-d * 3.0);
          c = mix(c, cc, cl * (0.85 - uNight * 0.55));
        }
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return mesh;
}
const Sky = (() => {
  const DAY = 1200;                 // seconds for a whole day
  const S = { phase: 0.6, t: 0, night: 0, sun: V3(), dome: null };
  // keyframes by sun height (-1..1): colours for the dome, fog, light
  const K = [
    { h: -0.35, top: '#101840', mid: '#22305e', hor: '#3a4a7a', low: '#1a2240', fog: '#2c3864', hemi: ['#8a9ad0', '#2c2c4c', 0.66], sun: ['#a8b8f0', 0.36], cloud: '#3a4878' },
    { h: -0.06, top: '#2a2a62', mid: '#7a4a88', hor: '#ff9a6a', low: '#3a2a50', fog: '#8a6a8a', hemi: ['#b89ac0', '#3a2a50', 0.6], sun: ['#ffa070', 0.48], cloud: '#e08a8a' },
    { h: 0.08, top: '#4a6ab0', mid: '#e89a8a', hor: '#ffc88a', low: '#6a5a7a', fog: '#e8b098', hemi: ['#ffe0c8', '#6a5a7a', 0.6], sun: ['#ffc890', 0.75], cloud: '#ffd0b0' },
    { h: 0.3, top: '#3f7fd0', mid: '#7fb2e8', hor: '#cfe4f0', low: '#8a9ab0', fog: '#b8d0e0', hemi: ['#f4f8ff', '#6a7a5a', 0.56], sun: ['#fff2dc', 0.72], cloud: '#ffffff' },
    { h: 1.0, top: '#2f6fc8', mid: '#6aa8e8', hor: '#c8e2f2', low: '#8a9ab0', fog: '#b0cce0', hemi: ['#ffffff', '#6a7a5a', 0.6], sun: ['#fffaf0', 0.76], cloud: '#ffffff' },
  ];
  const c = (h) => new THREE.Color(h);
  const KC = K.map(k => ({ h: k.h, top: c(k.top), mid: c(k.mid), hor: c(k.hor), low: c(k.low), fog: c(k.fog), hemiC: c(k.hemi[0]), hemiG: c(k.hemi[1]), hemiI: k.hemi[2], sunC: c(k.sun[0]), sunI: k.sun[1], cloud: c(k.cloud) }));
  const tmp = { top: new THREE.Color(), mid: new THREE.Color(), hor: new THREE.Color(), low: new THREE.Color(), fog: new THREE.Color(), hemiC: new THREE.Color(), hemiG: new THREE.Color(), sunC: new THREE.Color(), cloud: new THREE.Color() };
  function sample(h) {
    let i = 0; while (i < KC.length - 2 && h > KC[i + 1].h) i++;
    const a = KC[i], b = KC[i + 1], t = U.smooth(U.clamp((h - a.h) / (b.h - a.h), 0, 1));
    for (const k of ['top', 'mid', 'hor', 'low', 'fog', 'hemiC', 'hemiG', 'sunC', 'cloud']) tmp[k].copy(a[k]).lerp(b[k], t);
    tmp.hemiI = U.lerp(a.hemiI, b.hemiI, t); tmp.sunI = U.lerp(a.sunI, b.sunI, t);
    return tmp;
  }
  let mountains, stars, starMat, mtnMat, W;
  // each place has its own light: [light multiplier, tint of the light, tint of the air, how much]
  const AMB = {
    park: [0.72, '#cfe8b0', '#8fae86', 0.45], obs: [1.05, '#ffffff', '#c8dcf0', 0.1], oldtown: [1.0, '#ffe8c8', '#e8d0b0', 0.2],
    business: [1.0, '#f0f6ff', '#c0d4e8', 0.15], market: [1.02, '#ffe0b0', '#f0c890', 0.35], canals: [0.92, '#e0ecf0', '#a8c4cc', 0.3],
    docks: [0.9, '#f0e0d0', '#c8b8a8', 0.4], lake: [1.06, '#ffffff', '#c8e4f4', 0.15]
  };
  const ambC = new THREE.Color(), airC = new THREE.Color(), _a = new THREE.Color();
  S.weights = null;
  function init(world, phase = 0.6) {
    W = world; S.phase = phase;
    S.dome = cityDome(); G.scene.add(S.dome);
    // mountains across the lake: a jagged ring in the south, snow on top
    const pos = [], col = [], seg = 160, R0 = 5200;
    const ridge = (a) => 260 + Math.sin(a * 7) * 120 + Math.sin(a * 17 + 1) * 90 + Math.sin(a * 41) * 40 + Math.max(0, Math.sin(a * 3 - 0.6)) * 380;
    const cS = c('#f2f4f8'), cR = c('#7a8aa8'), cB = c('#5a6a88');
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * 0.08 + i / seg * Math.PI * 0.84, a1 = Math.PI * 0.08 + (i + 1) / seg * Math.PI * 0.84;
      const p = (a, y) => [Math.cos(a) * R0, y, 1100 + Math.sin(a) * R0 * 0.75];
      const h0 = ridge(a0), h1 = ridge(a1);
      // three bands: blue foot, rock, and snow only above the snow line
      const snow = 470, m0 = Math.min(h0, snow), m1 = Math.min(h1, snow);
      const quad = (ya0, ya1, yb0, yb1, ca0, ca1, cb0, cb1) => {
        const A = p(a0, ya0), Bv = p(a1, ya1), C = p(a1, yb1), D = p(a0, yb0);
        pos.push(...A, ...C, ...Bv, ...A, ...D, ...C);
        col.push(ca0.r, ca0.g, ca0.b, cb1.r, cb1.g, cb1.b, ca1.r, ca1.g, ca1.b, ca0.r, ca0.g, ca0.b, cb0.r, cb0.g, cb0.b, cb1.r, cb1.g, cb1.b);
      };
      quad(-40, -40, m0, m1, cB, cB, cR, cR);
      if (h0 > snow || h1 > snow) quad(m0, m1, Math.max(h0, m0), Math.max(h1, m1), cR, cR, h0 > snow ? cS : cR, h1 > snow ? cS : cR);
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    mtnMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 1, side: THREE.DoubleSide });
    mountains = new THREE.Mesh(mg, mtnMat); mountains.renderOrder = -5; mountains.frustumCulled = false; G.scene.add(mountains);
    mtnMat.onBeforeCompile = (sh) => { sh.uniforms.uHaze = { value: new THREE.Color('#b0cce0') }; sh.uniforms.uK = { value: 0.55 }; mtnMat.userData.sh = sh;
      sh.fragmentShader = 'uniform vec3 uHaze; uniform float uK;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, uK);\n#include <dithering_fragment>'); };
    // stars
    const sp = []; const r = U.rng(77);
    for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, e = Math.asin(0.05 + r() * 0.95), R = 880; sp.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    stars = new THREE.Points(sg, starMat); stars.renderOrder = -9; stars.frustumCulled = false; G.scene.add(stars);
    G.scene.fog.near = 260; G.scene.fog.far = 2900;
    G.camera.far = 9000; G.camera.updateProjectionMatrix();
    update(0);
  }
  const lampDay = c('#e8e2d4'), lampNight = c('#ffd98a'), _l = new THREE.Color();
  function update(dt, camPos) {
    S.t += dt;
    // night passes a little faster than day
    const ang = S.phase * Math.PI * 2, nightish = Math.sin(ang - Math.PI / 2) < -0.1;
    S.phase = (S.phase + dt / DAY * (nightish ? 1.5 : 1)) % 1;
    const a = S.phase * Math.PI * 2 - Math.PI / 2;            // 0.25 → sunrise, 0.5 → noon, 0.75 → sunset
    const sh = Math.sin(a), sx = Math.cos(a);
    // rises in the south-east (+x), arcs over the lake (+z is south), sets south-west: to your right as you face the water
    S.sun.set(sx * 0.75, sh, 0.95).normalize();
    const k = sample(sh);
    const u = S.dome.material.uniforms;
    u.uTop.value.copy(k.top); u.uMid.value.copy(k.mid); u.uHor.value.copy(k.hor); u.uLow.value.copy(k.low);
    u.uCloud.value.copy(k.cloud); u.uT.value += dt;
    const sun = sh > -0.15 ? S.sun : V3(-S.sun.x, Math.max(0.2, -S.sun.y), S.sun.z).normalize();   // the moon takes over at night
    u.uSun.value.copy(sun); u.uSunC.value.setRGB(sh > -0.15 ? 1 : 0.85, sh > -0.15 ? 0.95 : 0.88, sh > -0.15 ? 0.78 : 0.95);
    u.uNight.value = S.night || 0; u.uDisk.value = sh > -0.15 ? 0.035 : 0.022;
    // the place you're in leans the light and the air its own way
    let lm = 0, wsum = 0; ambC.setRGB(0, 0, 0); airC.setRGB(0, 0, 0); let air = 0;
    const wts = S.weights || { obs: 1 };
    for (const key in wts) { const A = AMB[key], w = wts[key]; if (!A || w < 0.001) continue; lm += A[0] * w; ambC.r += _a.set(A[1]).r * w; ambC.g += _a.g * w; ambC.b += _a.b * w; airC.r += _a.set(A[2]).r * w * A[3]; airC.g += _a.g * w * A[3]; airC.b += _a.b * w * A[3]; air += A[3] * w; wsum += w; }
    if (wsum > 0) { lm /= wsum; ambC.multiplyScalar(1 / wsum); } else { lm = 1; ambC.setRGB(1, 1, 1); }
    lm = U.lerp(lm, 1, (S.night || 0) * 0.7);       // after dark the places dim less (it's dark enough)
    S.lm = U.damp(S.lm ?? lm, lm, 1.2, dt || 1);
    const fogC = _l.copy(k.fog); if (air > 0) fogC.lerp(airC.multiplyScalar(1 / air), Math.min(0.5, air) * (1 - S.night * 0.7));
    G.scene.fog.color.copy(fogC); G.renderer.setClearColor(fogC);
    G.hemi.color.copy(k.hemiC).multiply(ambC); G.hemi.groundColor.copy(k.hemiG); G.hemi.intensity = k.hemiI * S.lm;
    G.sun.color.copy(k.sunC).multiply(ambC); G.sun.intensity = k.sunI * S.lm; G.sun.position.copy(sun).multiplyScalar(200);
    S.night = U.clamp((0.05 - sh) / 0.25, 0, 1);
    starMat.opacity = U.clamp((-0.05 - sh) / 0.2, 0, 1) * 0.9;
    if (mtnMat.userData.sh) { mtnMat.userData.sh.uniforms.uHaze.value.copy(G.scene.fog.color); mtnMat.userData.sh.uniforms.uK.value = 0.45 + S.night * 0.3; }
    if (camPos) { S.dome.position.copy(camPos); stars.position.copy(camPos); }
    // windows and lamps
    const M = W.mats;
    M.wall.emissiveIntensity = S.night * 0.95;
    const wantMap = S.night > 0.55 ? M.wallNight : M.wallDay; if (M.wall.map !== wantMap) { M.wall.map = wantMap; M.wall.needsUpdate = true; }
    if (M.house) M.house.emissiveIntensity = S.night * 0.9;
    if (M.pool) { M.pool.opacity = S.night * 0.9; M.pool.visible = S.night > 0.02; }
    if (M.tower) M.tower.emissiveIntensity = S.night * 0.85;
    if (M.grid) M.grid.emissiveIntensity = S.night * 0.85;
    if (M.deco) M.deco.emissiveIntensity = S.night * 0.85;
    if (W.lighthouse) { W.lighthouse.piv.rotation.y += dt * 0.5; W.lighthouse.beam.material.opacity = S.night * 0.22; }
    M.lamp.color.copy(_a.copy(lampDay).lerp(lampNight, S.night)).multiplyScalar(0.75 + S.night * 0.5);
    if (W.lakeMat) W.lakeMat.color.copy(_a.set('#6fb0c8').lerp(k.fog, 0.35).multiplyScalar(1 - S.night * 0.45));
    if (W.canalWaterMat) W.canalWaterMat.color.copy(_a.set('#5f9fa0').multiplyScalar(1 - S.night * 0.5));
    return S;
  }
  return { init, update, S, get night() { return S.night; }, get phase() { return S.phase; }, set phase(v) { S.phase = v; } };
})();
