// ============================================================
//  CHARACTERS — procedural toon rigs with IK legs + poses
// ============================================================
function faceTextures(skin, style) {
  const draw = (mood) => canvasTex(128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = PAL.ink; x.fillStyle = PAL.ink; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 6;
    const eyeY = 52, ex = 26;
    const eye = (cx, kind) => {
      if (kind === 'happy') { x.beginPath(); x.arc(cx, eyeY + 6, 9, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke(); }
      else if (kind === 'closed') { x.beginPath(); x.moveTo(cx - 9, eyeY + 2); x.lineTo(cx + 9, eyeY + 2); x.stroke(); }
      else if (kind === 'wide') { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, eyeY, 10, 13, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = PAL.ink; x.beginPath(); x.arc(cx, eyeY + 1, 4, 0, 7); x.fill(); }
      else if (kind === 'smug') { x.beginPath(); x.ellipse(cx, eyeY + 2, 7, 9, 0, 0, 7); x.fill(); x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 12, eyeY - 4); x.lineTo(cx + 12, eyeY - 6); x.stroke(); x.lineWidth = 6; }
      else { x.beginPath(); x.ellipse(cx, eyeY, 6.5, 10, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + 2, eyeY - 4, 2.4, 0, 7); x.fill(); x.fillStyle = PAL.ink; }
    };
    const e = { neutral: 'dot', talk: 'dot', grin: 'happy', mega: 'happy', shock: 'wide', smug: 'smug', worried: 'dot', blink: 'closed' }[mood] || 'dot';
    eye(64 - ex, e); eye(64 + ex, e);
    if (mood === 'worried') { x.lineWidth = 4; x.beginPath(); x.moveTo(64 - ex - 10, eyeY - 18); x.lineTo(64 - ex + 8, eyeY - 22); x.moveTo(64 + ex + 10, eyeY - 18); x.lineTo(64 + ex - 8, eyeY - 22); x.stroke(); x.lineWidth = 6; }
    if (style.blush) { x.fillStyle = 'rgba(255,60,120,.35)'; x.beginPath(); x.arc(64 - 38, 74, 9, 0, 7); x.arc(64 + 38, 74, 9, 0, 7); x.fill(); x.fillStyle = PAL.ink; }
    // mouths
    x.lineWidth = 5;
    if (mood === 'grin' || mood === 'mega') {
      const s = mood === 'mega' ? 1.5 : 1;
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(64 - 22 * s, 80); x.quadraticCurveTo(64, 80 + 30 * s, 64 + 22 * s, 80); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(64 - 20 * s, 81); x.lineTo(64 + 20 * s, 81); x.stroke();
    } else if (mood === 'talk') { x.fillStyle = '#7a1f3d'; x.beginPath(); x.ellipse(64, 86, 9, 8, 0, 0, 7); x.fill(); x.stroke(); }
    else if (mood === 'shock') { x.fillStyle = '#7a1f3d'; x.beginPath(); x.ellipse(64, 90, 7, 11, 0, 0, 7); x.fill(); x.stroke(); }
    else if (mood === 'smug') { x.beginPath(); x.moveTo(52, 86); x.quadraticCurveTo(66, 92, 78, 80); x.stroke(); }
    else if (mood === 'worried') { x.beginPath(); x.moveTo(52, 90); x.quadraticCurveTo(58, 84, 64, 89); x.quadraticCurveTo(70, 94, 76, 88); x.stroke(); }
    else { x.beginPath(); x.moveTo(54, 86); x.quadraticCurveTo(64, 92, 74, 86); x.stroke(); }
    if (style.glasses) {
      x.lineWidth = 5; x.strokeStyle = PAL.ink; x.fillStyle = 'rgba(160,230,255,.35)';
      x.beginPath(); x.rect(64 - ex - 16, eyeY - 15, 32, 28); x.fill(); x.stroke();
      x.beginPath(); x.rect(64 + ex - 16, eyeY - 15, 32, 28); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(64 - ex + 16, eyeY - 4); x.lineTo(64 + ex - 16, eyeY - 4); x.stroke();
    }
  });
  const moods = ['neutral', 'talk', 'grin', 'mega', 'shock', 'smug', 'worried', 'blink'];
  const out = {}; for (const m of moods) out[m] = draw(m).tex; return out;
}

class Rig {
  constructor(spec) {
    this.spec = spec;
    const s = spec.scale || 1;
    this.L1 = 0.42 * s; this.L2 = 0.4 * s; this.ankle = 0.245 * s; this.hipW = 0.12 * s;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    this.piv = 0.95 * s;
    this.spin = new THREE.Group(); this.spin.position.y = this.piv; this.body.add(this.spin);   // trick rotations pivot at the hips
    this.hips = new THREE.Group(); this.spin.add(this.hips);
    const T = 0.03 * s, c = spec.colors;
    // pelvis
    this.hips.add(part(new THREE.SphereGeometry(0.2 * s, 12, 8), c.pants, T));
    // torso
    this.torso = new THREE.Group(); this.torso.position.y = 0.04 * s; this.hips.add(this.torso);
    const chest = part(new THREE.CapsuleGeometry(0.24 * s, 0.26 * s, 4, 10), c.jacket, T); chest.position.y = 0.3 * s; chest.scale.set(1.08, 1, 0.82); this.torso.add(chest);
    if (spec.stripe) { const st = part(new THREE.CylinderGeometry(0.255 * s, 0.255 * s, 0.07 * s, 14), spec.stripe, 0); st.position.y = 0.26 * s; st.scale.set(1.08, 1, 0.82); this.torso.add(st); }
    if (spec.backpack) {
      const bp = part(new THREE.BoxGeometry(0.42 * s, 0.48 * s, 0.22 * s), spec.backpack, T); bp.position.set(0, 0.34 * s, -0.27 * s); this.torso.add(bp);
      const ant = part(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.6 * s, 5), PAL.ink, 0); ant.position.set(0.14 * s, 0.82 * s, -0.3 * s); ant.rotation.z = -0.25; this.torso.add(ant);
      const tip = part(new THREE.SphereGeometry(0.04 * s, 8, 6), toon(PAL.magenta, { noCache: true }), 0.01); tip.position.set(0.21 * s, 1.1 * s, -0.3 * s); this.torso.add(tip); this.antTip = tip;
    }
    // collar
    const collar = part(new THREE.TorusGeometry(0.17 * s, 0.06 * s, 6, 14), spec.collar || c.jacket, T); collar.rotation.x = Math.PI / 2; collar.position.y = 0.58 * s; this.torso.add(collar);
    // head
    this.head = new THREE.Group(); this.head.position.y = 0.78 * s; this.torso.add(this.head);
    const R = 0.21 * s;
    const skull = part(new THREE.SphereGeometry(R, 18, 14), c.skin, T); skull.scale.set(1, 1.05, 0.98); this.head.add(skull);
    this.faces = faceTextures(c.skin, spec);
    this.faceMat = new THREE.MeshBasicMaterial({ map: this.faces.neutral, transparent: true, depthWrite: false });
    const face = new THREE.Mesh(new THREE.SphereGeometry(R * 1.015, 20, 14, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.8, 1.6), this.faceMat);
    face.scale.set(1, 1.05, 0.98); face.renderOrder = 2; this.head.add(face);
    spec.hair && spec.hair(this.head, R, T, s);
    // neck
    const neck = part(new THREE.CylinderGeometry(0.07 * s, 0.08 * s, 0.14 * s, 8), c.skin, 0); neck.position.y = 0.66 * s; this.torso.add(neck);
    // arms
    const mkArm = (side) => {
      const g = new THREE.Group(); g.position.set(side * 0.31 * s, 0.5 * s, 0); this.torso.add(g);
      const up = part(new THREE.CapsuleGeometry(0.075 * s, 0.2 * s, 3, 8), c.jacket, T); up.position.y = -0.15 * s; g.add(up);
      const fore = new THREE.Group(); fore.position.y = -0.31 * s; g.add(fore);
      const fm = part(new THREE.CapsuleGeometry(0.065 * s, 0.18 * s, 3, 8), spec.sleeve || c.jacket, T); fm.position.y = -0.13 * s; fore.add(fm);
      const hand = part(new THREE.SphereGeometry(0.075 * s, 10, 8), spec.gloves || c.skin, T); hand.position.y = -0.3 * s; fore.add(hand);
      return { g, fore };
    };
    this.armL = mkArm(1); this.armR = mkArm(-1);
    // legs
    const mkLeg = (side) => {
      const g = new THREE.Group(); g.position.set(side * this.hipW, -0.05 * s, 0); this.hips.add(g);
      const th = part(new THREE.CapsuleGeometry(0.1 * s, this.L1 - 0.1 * s, 3, 8), c.pants, T); th.position.y = -this.L1 / 2; g.add(th);
      const shin = new THREE.Group(); shin.position.y = -this.L1; g.add(shin);
      const sh = part(new THREE.CapsuleGeometry(0.09 * s, this.L2 - 0.08 * s, 3, 8), spec.legs || c.pants, T); sh.position.y = -this.L2 / 2; shin.add(sh);
      const skate = new THREE.Group(); skate.position.y = -this.L2; shin.add(skate);
      const boot = part(new THREE.BoxGeometry(0.17 * s, 0.2 * s, 0.32 * s), c.boot, T); boot.position.set(0, -0.05 * s, 0.04 * s); skate.add(boot);
      const cuff = part(new THREE.CylinderGeometry(0.1 * s, 0.11 * s, 0.1 * s, 10), c.bootCuff || c.boot, T); cuff.position.y = 0.04 * s; skate.add(cuff);
      if (spec.skates !== false) {
        const fr = part(new THREE.BoxGeometry(0.05 * s, 0.05 * s, 0.34 * s), '#3a3550', 0); fr.position.set(0, -0.17 * s, 0.04 * s); skate.add(fr);
        for (let i = 0; i < 4; i++) { const w = part(new THREE.CylinderGeometry(0.045 * s, 0.045 * s, 0.04 * s, 10), c.wheels, 0.012); w.rotation.z = Math.PI / 2; w.position.set(0, -0.2 * s, -0.09 * s + i * 0.09 * s); skate.add(w); }
      }
      return { g, shin, skate };
    };
    this.legL = mkLeg(1); this.legR = mkLeg(-1);
    // blob shadow (added to scene by owner)
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55 * s, 20), new THREE.MeshBasicMaterial({ color: 0x2a1640, transparent: true, opacity: 0.35, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 1;

    // pose state
    this.p = this.blankPose();
    this.t = 0; this.stride = 0; this.mood = 'neutral'; this.talking = false; this.blinkT = 2;
    this.rockPhase = Math.random() * 6;
  }
  blankPose() {
    const s = this.spec.scale || 1;
    return { hipY: 1.07 * s, hipZ: 0, lean: 0.05, twist: 0, roll: 0,
      fL: [0.15 * s, 0, 0.02], fR: [-0.15 * s, 0, -0.02],
      aL: [0.1, 0, 0.18, 0.3], aR: [0.1, 0, -0.18, 0.3], head: [0, 0, 0] };
  }
  setMood(m) { if (this.mood !== m) { this.mood = m; } }
  // named poses for cutscenes
  poseTarget(name) {
    const s = this.spec.scale || 1, b = this.blankPose();
    const P = {
      stand: b,
      idle: b,
      sit: Object.assign(b, { hipY: 0.2 * s, hipZ: 0, lean: -0.08, fL: [0.17 * s, -0.5 * s, 0.48 * s], fR: [-0.17 * s, -0.56 * s, 0.4 * s], aL: [0.75, 0, 0.32, 0.15], aR: [0.75, 0, -0.32, 0.15] }),
      crouch: Object.assign(b, { hipY: 0.78 * s, lean: 0.35, fL: [0.22 * s, 0, 0.18], fR: [-0.22 * s, 0, -0.12], aL: [-0.6, 0, 0.3, 1.2], aR: [-0.6, 0, -0.3, 1.2] }),
      lookup: Object.assign(b, { lean: -0.2, head: [-0.5, 0, 0], aL: [0.1, 0, 0.25, 0.3], aR: [0.1, 0, -0.25, 0.3] }),
      point: Object.assign(b, { lean: -0.05, head: [-0.25, 0.2, 0], aR: [-1.9, 0.2, -0.25, 0.05], aL: [0.15, 0, 0.2, 0.3] }),
      shrug: Object.assign(b, { aL: [-0.2, 0, 0.9, 1.6], aR: [-0.2, 0, -0.9, 1.6], head: [0.05, 0, 0.18] }),
      think: Object.assign(b, { aR: [-0.5, 0, -0.15, 2.3], aL: [-0.4, 0, 0.25, 1.9], head: [0.15, -0.2, 0.1] }),
      nervous: Object.assign(b, { hipY: 1.03 * s, lean: 0.15, aL: [-0.9, 0, 0.1, 2.1], aR: [-0.9, 0, -0.1, 2.1], head: [0.2, 0, 0], fL: [0.1 * s, 0, 0], fR: [-0.1 * s, 0, 0] }),
      armsCross: Object.assign(b, { aL: [-0.7, 0, -0.15, 2.0], aR: [-0.75, 0, 0.15, 2.0], lean: -0.05 }),
      hype: Object.assign(b, { aL: [-2.8, 0, 0.3, 0.2], aR: [-0.1, 0, -0.4, 0.4], lean: -0.1, head: [-0.2, 0, 0] }),
      wave: Object.assign(b, { aR: [-2.6, 0, -0.5, 0.6], head: [0, 0, -0.1] }),
      stretch: Object.assign(b, { hipY: 1.0 * s, lean: 0.3, fL: [0.35 * s, 0, 0.3], fR: [-0.3 * s, 0, -0.2], aL: [-1.4, 0, 0.2, 0.1], aR: [-1.4, 0, -0.2, 0.1] }),
      ready: Object.assign(b, { hipY: 0.97 * s, lean: 0.3, fL: [0.2 * s, 0, 0.22], fR: [-0.2 * s, 0, -0.2], aL: [0.4, 0, 0.35, 0.9], aR: [-0.6, 0, -0.35, 1.1] }),
      tuck: Object.assign(b, { hipY: 0.98 * s, lean: 0.4, fL: [0.18 * s, 0.38 * s, 0.25], fR: [-0.18 * s, 0.32 * s, 0.05], aL: [-1.0, 0, 0.6, 0.6], aR: [-1.0, 0, -0.6, 0.6] }),
    };
    return P[name] || b;
  }
  // gameplay pose from controller state
  skateTarget(st, dt) {
    const s = this.spec.scale || 1, b = this.blankPose();
    const sp = st.speed || 0;
    if (st.mode === 'grind') {
      return Object.assign(b, { hipY: 0.93 * s, lean: 0.25, twist: 0, roll: st.balance * 0.25,
        fL: [0.02, 0, 0.28 * s], fR: [-0.02, 0, -0.26 * s], aL: [-0.3, 0, 1.25 + Math.sin(this.t * 7) * 0.12, 0.3], aR: [-0.3, 0, -1.25 + Math.sin(this.t * 7 + 1) * 0.12, 0.3], head: [0.1, 0, 0] });
    }
    if (st.mode === 'air') {
      const up = st.vy > 2;
      return Object.assign(this.poseTarget('tuck'), up ? { aL: [-1.8, 0, 0.7, 0.4], aR: [-1.6, 0, -0.7, 0.4] } : {});
    }
    // ground skating: stride cycle
    const amp = U.clamp(sp / 12, 0, 1);
    const ph = this.stride;
    const sw = Math.sin(ph), sw2 = Math.cos(ph);
    const crouch = U.clamp(sp / 22, 0, 1) * 0.12 + (st.landT > 0 ? st.landT * 0.6 : 0) + (st.push > 0 ? st.push * 0.25 : 0);
    Object.assign(b, {
      hipY: (1.05 - crouch) * s - Math.abs(sw) * 0.03 * amp,
      lean: 0.12 + amp * 0.32 + (st.push || 0) * 0.3,
      roll: -sw * 0.08 * amp + (st.turn || 0) * 0.25,
      twist: sw * 0.12 * amp,
      fL: [(0.16 + Math.max(0, sw) * 0.22 * amp) * s, Math.max(0, -sw2) * 0.12 * amp, -Math.max(0, sw) * 0.25 * amp + 0.05],
      fR: [-(0.16 + Math.max(0, -sw) * 0.22 * amp) * s, Math.max(0, sw2) * 0.12 * amp, -Math.max(0, -sw) * 0.25 * amp + 0.05],
      aL: [sw * 0.9 * amp + 0.1, 0, 0.25 + amp * 0.1, 0.4 + amp * 0.3],
      aR: [-sw * 0.9 * amp + 0.1, 0, -0.25 - amp * 0.1, 0.4 + amp * 0.3],
      head: [-0.1 * amp, 0, -sw * 0.05 * amp]
    });
    if (sp < 0.5) { // idle bounce to the beat
      const bb = st.beatPhase != null ? Math.sin(st.beatPhase * Math.PI * 2) : 0;
      b.hipY -= 0.025 * (bb * 0.5 + 0.5); b.head[0] += 0.06 * bb;
      b.aL = [0.05, 0, 0.18, 0.5]; b.aR = [0.05, 0, -0.18, 0.5];
    }
    return b;
  }
  update(dt, target, { rock = 0 } = {}) {
    this.t += dt;
    const p = this.p, k = 12;
    const d = (a, b2) => U.damp(a, b2, k, dt);
    p.hipY = d(p.hipY, target.hipY); p.hipZ = d(p.hipZ, target.hipZ || 0); p.lean = d(p.lean, target.lean); p.twist = d(p.twist, target.twist || 0); p.roll = d(p.roll, target.roll || 0);
    for (const key of ['fL', 'fR', 'aL', 'aR', 'head']) for (let i = 0; i < p[key].length; i++) p[key][i] = d(p[key][i], target[key][i]);
    // gentle rocking while reading dialogue
    const rk = rock ? Math.sin(this.t * 1.7 + this.rockPhase) * rock : 0;
    this.hips.position.set(0, p.hipY - this.piv + (rock ? Math.abs(Math.sin(this.t * 1.7 + this.rockPhase)) * rock * 0.4 : 0), p.hipZ);
    this.torso.rotation.set(p.lean, p.twist, p.roll + rk);
    this.head.rotation.set(p.head[0] - p.lean * 0.6, p.head[1], p.head[2] - rk * 0.5);
    const arm = (A, a, side) => { A.g.rotation.set(a[0], a[1], a[2]); A.fore.rotation.set(-a[3], 0, 0); };
    arm(this.armL, p.aL, 1); arm(this.armR, p.aR, -1);
    // IK legs: foot targets in root space → hip-local
    const leg = (Lg, f, side) => {
      const hx = side * this.hipW, hy = p.hipY - 0.05 * (this.spec.scale || 1);
      let tx = f[0] - hx, ty = (f[1] + this.ankle) - hy, tz = f[2] - p.hipZ;
      // rotate target into the torso-free hip frame (hips don't rotate, fine)
      const splay = Math.atan2(tx, -ty);
      const dy = Math.hypot(tx, ty) * Math.sign(-ty || 1);
      let dd = Math.hypot(dy, tz);
      const max = this.L1 + this.L2 - 0.001; if (dd > max) dd = max;
      const phi = Math.atan2(tz, dy);
      const alpha = Math.acos(U.clamp((this.L1 * this.L1 + dd * dd - this.L2 * this.L2) / (2 * this.L1 * dd), -1, 1));
      const beta = Math.acos(U.clamp((this.L1 * this.L1 + this.L2 * this.L2 - dd * dd) / (2 * this.L1 * this.L2), -1, 1));
      const bend = Math.PI - beta;
      Lg.g.rotation.set(-(phi + alpha), 0, splay, 'ZXY');
      Lg.shin.rotation.set(bend, 0, 0);
      Lg.skate.rotation.set((phi + alpha) - bend, 0, -splay);
    };
    leg(this.legL, p.fL, 1); leg(this.legR, p.fR, -1);
    // face
    this.blinkT -= dt;
    let m = this.mood;
    if (this.talking && (m === 'neutral' || m === 'worried' || m === 'smug')) m = (Math.floor(this.t * 9) % 2) ? 'talk' : m;
    if (this.blinkT < 0) { if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3; else if (m === 'neutral' || m === 'talk') m = 'blink'; }
    const tex = this.faces[m] || this.faces.neutral;
    if (this.faceMat.map !== tex) { this.faceMat.map = tex; this.faceMat.needsUpdate = true; }
    if (this.antTip) this.antTip.material.color.setHSL((this.t * 0.5) % 1, 1, 0.6);
  }
}

// --- cast ---
function makeJuno() {
  return new Rig({
    colors: { skin: '#b9774c', jacket: '#ff7a2f', pants: '#2b2f6b', boot: '#f4f1ff', bootCuff: '#19d3ff', wheels: '#ff2e88' },
    stripe: '#8ff0c8', sleeve: '#ff7a2f', gloves: '#14101f', legs: '#2b2f6b', collar: '#8ff0c8', blush: true,
    hair(head, R, T) {
      const hair = part(new THREE.SphereGeometry(R * 1.1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.36), PAL.magenta, T);
      hair.position.y = R * 0.06; hair.scale.set(1.05, 1.08, 1.06); head.add(hair);
      const backHair = part(new THREE.SphereGeometry(R * 1.1, 14, 10, Math.PI * 1.15, Math.PI * 0.7, 0, Math.PI * 0.62), PAL.magenta, T); backHair.position.y = R * 0.04; head.add(backHair);
      // bob sides
      for (const sd of [-1, 1]) { const b = part(new THREE.BoxGeometry(R * 0.42, R * 1.05, R * 1.1), PAL.magenta, T); b.position.set(sd * R * 0.9, -R * 0.12, -R * 0.3); b.rotation.z = sd * 0.08; head.add(b); }
      const back = part(new THREE.BoxGeometry(R * 1.8, R * 1.0, R * 0.45), PAL.magenta, T); back.position.set(0, -R * 0.2, -R * 0.82); head.add(back);
      // spiky bangs
      for (let i = 0; i < 4; i++) { const c = part(new THREE.ConeGeometry(R * 0.2, R * 0.5, 5), PAL.magenta, 0.015); c.position.set((i - 1.5) * R * 0.36, R * 0.78, R * 0.66); c.rotation.x = 2.2; c.rotation.z = (i - 1.5) * -0.25; head.add(c); }
      // headphones
      const band = part(new THREE.TorusGeometry(R * 1.2, R * 0.1, 6, 20, Math.PI), PAL.yellow, T); band.position.y = R * 0.05; head.add(band);
      for (const sd of [-1, 1]) { const cup = part(new THREE.CylinderGeometry(R * 0.42, R * 0.42, R * 0.32, 14), PAL.yellow, T); cup.rotation.z = Math.PI / 2; cup.position.set(sd * R * 1.1, -R * 0.05, 0); head.add(cup);
        const dot = part(new THREE.CylinderGeometry(R * 0.2, R * 0.2, R * 0.05, 10), PAL.magenta, 0); dot.rotation.z = Math.PI / 2; dot.position.set(sd * R * 1.28, -R * 0.05, 0); head.add(dot); }
    }
  });
}
function makeBolt() {
  return new Rig({
    scale: 1.1,
    colors: { skin: '#f2c49a', jacket: '#6a3df0', pants: '#3a3a44', boot: '#c6ff3d', bootCuff: '#14101f', wheels: '#19d3ff' },
    sleeve: '#6a3df0', glasses: true, backpack: '#ffd23f', collar: '#c6ff3d',
    hair(head, R, T) {
      const beanie = part(new THREE.SphereGeometry(R * 1.08, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), PAL.lime, T); beanie.position.y = R * 0.2; beanie.scale.set(1.02, 1.25, 1.02); head.add(beanie);
      const rim = part(new THREE.TorusGeometry(R * 1.0, R * 0.13, 6, 18), '#9fd12a', 0.02); rim.rotation.x = Math.PI / 2; rim.position.y = R * 0.5; head.add(rim);
      const pom = part(new THREE.SphereGeometry(R * 0.25, 8, 6), PAL.magenta, 0.02); pom.position.y = R * 1.55; head.add(pom);
      for (const sd of [-1, 1]) { const tuft = part(new THREE.ConeGeometry(R * 0.2, R * 0.5, 4), PAL.orange, 0.015); tuft.position.set(sd * R * 0.95, 0, -R * 0.2); tuft.rotation.z = sd * -2.2; head.add(tuft); }
    }
  });
}

// --- Smile Drone (Ministry surveillance) ---
function droneFaces() {
  const mk = (mood) => canvasTex(128, 128, (x, w, h) => {
    const bg = { happy: '#b6f5dc', sus: '#ffe08a', alert: '#ff6b7a', vibe: '#ffb3d1', proud: '#c6ff3d' }[mood];
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = PAL.ink; x.strokeStyle = PAL.ink; x.lineWidth = 9; x.lineCap = 'round';
    if (mood === 'happy' || mood === 'proud') {
      x.beginPath(); x.arc(42, 56, 12, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke(); x.beginPath(); x.arc(86, 56, 12, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke();
      x.beginPath(); x.arc(64, 70, 28, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
    } else if (mood === 'sus') {
      x.fillRect(28, 48, 28, 8); x.fillRect(72, 48, 28, 8);
      x.beginPath(); x.moveTo(44, 92); x.lineTo(84, 92); x.stroke();
    } else if (mood === 'alert') {
      x.font = `86px ${FONT.display}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 64, 70);
    } else if (mood === 'vibe') {
      const heart = (cx, cy) => { x.beginPath(); x.moveTo(cx, cy + 10); x.bezierCurveTo(cx - 22, cy - 6, cx - 8, cy - 22, cx, cy - 8); x.bezierCurveTo(cx + 8, cy - 22, cx + 22, cy - 6, cx, cy + 10); x.fill(); };
      x.fillStyle = PAL.magenta; heart(42, 56); heart(86, 56); x.fillStyle = PAL.ink;
      x.beginPath(); x.arc(64, 78, 18, 0, Math.PI); x.fill();
    }
    for (let y = 0; y < h; y += 6) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, y, w, 3); }
  }).tex;
  return { happy: mk('happy'), sus: mk('sus'), alert: mk('alert'), vibe: mk('vibe'), proud: mk('proud') };
}
class Drone {
  constructor(faces) {
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    const shell = part(new THREE.SphereGeometry(0.55, 18, 14), '#f7f5ff', 0.05); shell.scale.set(1, 0.82, 1); this.body.add(shell);
    const ring = part(new THREE.TorusGeometry(0.58, 0.07, 6, 24), PAL.mint, 0.03); ring.rotation.x = Math.PI / 2; this.body.add(ring);
    this.faceMat = new THREE.MeshBasicMaterial({ map: faces.happy });
    const screen = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), this.faceMat); screen.position.set(0, 0.02, 0.5); this.body.add(screen);
    const bez = part(new THREE.TorusGeometry(0.35, 0.04, 6, 24), PAL.ink, 0); bez.position.copy(screen.position); this.body.add(bez);
    this.rotors = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const arm = part(new THREE.BoxGeometry(0.7, 0.06, 0.08), '#d9d4ea', 0.02); arm.position.set(Math.cos(a) * 0.65, 0.28, Math.sin(a) * 0.65); arm.rotation.y = -a; this.body.add(arm);
      const rot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: 0x14101f, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      rot.rotation.x = -Math.PI / 2; rot.position.set(Math.cos(a) * 0.98, 0.34, Math.sin(a) * 0.98); this.body.add(rot); this.rotors.push(rot);
    }
    const ant = part(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 5), PAL.ink, 0); ant.position.y = 0.6; this.body.add(ant);
    this.bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2e88 })); this.bulb.position.y = 0.8; this.body.add(this.bulb);
    this.faces = faces; this.mood = 'happy'; this.t = Math.random() * 5;
  }
  setMood(m) { if (m !== this.mood) { this.mood = m; this.faceMat.map = this.faces[m]; this.faceMat.needsUpdate = true; } }
  update(dt) {
    this.t += dt;
    for (const r of this.rotors) r.rotation.z += dt * 30;
    this.body.position.y = Math.sin(this.t * 2.2) * 0.12;
    if (this.mood === 'vibe') { this.body.rotation.z = Math.sin(this.t * Math.PI * 2 * 116 / 60 / 2) * 0.35; }
    else this.body.rotation.z = U.damp(this.body.rotation.z, 0, 6, dt);
    this.bulb.material.color.set(this.mood === 'alert' ? (Math.floor(this.t * 8) % 2 ? 0xff2244 : 0x330000) : this.mood === 'vibe' ? 0xff2e88 : 0x19d3ff);
  }
}
