// ============================================================
//  INPUT, PARTICLES, PLAYER CONTROLLER, CAMERA
// ============================================================
const Input = {
  move: { x: 0, y: 0 }, keys: {}, jumpQ: [], trickQ: [], camDX: 0, camDY: 0, lastCamInput: -10, enabled: false,
  stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, camPtr: null,
  frame: null,                 // stick reference yaw, frozen while the thumb is down
  kb: { fwd: 0, turn: 0 }, kbActive: false,
  init() {
    const K = this.keys;
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      K[e.code] = true;
      if (!this.enabled) return;
      if (e.code === 'Space') { this.jumpQ.push(e.timeStamp); e.preventDefault(); }
      if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Enter') this.trickQ.push(e.timeStamp);
    });
    window.addEventListener('keyup', e => { K[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in K) K[k] = false; this.stick.id = null; this.move.x = this.move.y = 0; });
    const zone = document.getElementById('touch');
    const knob = document.getElementById('knob'), base = document.getElementById('stickbase');
    const R = 56;
    zone.addEventListener('pointerdown', e => {
      if (!this.enabled) return;
      const left = e.clientX < window.innerWidth * 0.45;
      if (left && this.stick.id === null && e.pointerType !== 'mouse') {
        this.stick.id = e.pointerId; this.stick.ox = e.clientX; this.stick.oy = e.clientY;
        base.classList.add('live'); base.style.transform = `translate(${e.clientX - 64}px, ${e.clientY - 64}px)`;
        knob.style.transform = 'translate(0px,0px)'; this.frame = null;
      } else if (this.camPtr === null) { this.camPtr = { id: e.pointerId, x: e.clientX, y: e.clientY }; }
      zone.setPointerCapture?.(e.pointerId);
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId === this.stick.id) {
        let dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
        const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
        this.stick.x = dx / R; this.stick.y = -dy / R;
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      } else if (this.camPtr && e.pointerId === this.camPtr.id) {
        this.camDX += e.clientX - this.camPtr.x; this.camDY += e.clientY - this.camPtr.y;
        this.camPtr.x = e.clientX; this.camPtr.y = e.clientY; this.lastCamInput = performance.now() / 1000;
      }
    });
    const up = e => {
      if (e.pointerId === this.stick.id) { this.stick.id = null; this.stick.x = this.stick.y = 0; this.frame = null; base.classList.remove('live'); base.style.transform = ''; knob.style.transform = 'translate(0px,0px)'; }
      if (this.camPtr && e.pointerId === this.camPtr.id) this.camPtr = null;
    };
    zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up);
    const btn = (id, q) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (this.enabled) q.push(e.timeStamp); el.classList.add('down'); });
      const rel = () => el.classList.remove('down');
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel); el.addEventListener('pointerleave', rel);
    };
    btn('btnJump', this.jumpQ); btn('btnTrick', this.trickQ);
  },
  poll() {
    const K = this.keys;
    // keyboard = skater steering: W push, S brake, A/D carve
    const turn = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0);
    const fwd = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0);
    this.kbActive = this.enabled && this.stick.id === null && (turn !== 0 || fwd !== 0);
    this.kb.fwd = this.enabled ? fwd : 0; this.kb.turn = this.enabled ? turn : 0;
    // touch stick = go where you point
    let x = 0, y = 0;
    if (this.stick.id !== null) { x = this.stick.x; y = this.stick.y; }
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    this.move.x = this.enabled ? x : 0; this.move.y = this.enabled ? y : 0;
    if (K.KeyQ) { this.camDX -= 6; this.lastCamInput = performance.now() / 1000; }
    if (K.KeyE) { this.camDX += 6; this.lastCamInput = performance.now() / 1000; }
  },
  flush() { this.jumpQ.length = 0; this.trickQ.length = 0; this.camDX = 0; this.camDY = 0; }
};

// ---------- particles ----------
class Particles {
  constructor(scene, N = 360) {
    this.N = N; this.i = 0;
    this.p = new Float32Array(N * 3); this.c = new Float32Array(N * 3); this.v = new Float32Array(N * 3); this.life = new Float32Array(N); this.g = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.c, 3));
    const dot = canvasTex(32, 32, (x) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 13, 0, 7); x.fill(); }).tex;
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.26, map: dot, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.3 }));
    this.pts.frustumCulled = false;
    for (let i = 0; i < N; i++) this.p[i * 3 + 1] = -999;
    scene.add(this.pts);
  }
  emit(pos, vel, color, life = 0.6, grav = 10) {
    const i = this.i; this.i = (this.i + 1) % this.N;
    this.p[i * 3] = pos.x; this.p[i * 3 + 1] = pos.y; this.p[i * 3 + 2] = pos.z;
    this.v[i * 3] = vel.x; this.v[i * 3 + 1] = vel.y; this.v[i * 3 + 2] = vel.z;
    const c = _pc.set(color); this.c[i * 3] = c.r; this.c[i * 3 + 1] = c.g; this.c[i * 3 + 2] = c.b;
    this.life[i] = life; this.g[i] = grav;
  }
  burst(pos, n, colors, speed = 5, life = 0.7, grav = 8) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 - 0.2;
      this.emit(pos, _pv.set(Math.cos(a) * Math.cos(e) * speed * (0.5 + Math.random()), Math.sin(e) * speed + 2, Math.sin(a) * Math.cos(e) * speed * (0.5 + Math.random())), colors[k % colors.length], life * (0.6 + Math.random() * 0.6), grav);
    }
  }
  update(dt) {
    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.p[i * 3 + 1] = -999; continue; }
      this.v[i * 3 + 1] -= this.g[i] * dt;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
const _pc = new THREE.Color(), _pv = V3();

// ---------- player ----------
const PH = { GRAV: 26, JUMP: 10, BEATJUMP: 12.6, RUN: 13, MAXSP: 25, ACC: 13, AIRACC: 8, STEP: 0.45, R: 0.42, H: 1.7, SNAP: 0.4 };
const TRICKS_AIR = [
  { name: '360 SPIN', axis: 'y', amt: 1 }, { name: 'BACKFLIP', axis: 'x', amt: -1 }, { name: 'FLATSPIN 540', axis: 'y', amt: 1.5 },
  { name: 'CORKSCREW', axis: 'z', amt: 1 }, { name: 'FRONTFLIP', axis: 'x', amt: 1 }, { name: 'MISTY 720', axis: 'y', amt: 2 }
];

class Player {
  constructor(world, rig, fx, hooks) {
    this.W = world; this.rig = rig; this.fx = fx; this.hooks = hooks;
    this.pos = world.spawn.clone(); this.vel = V3(); this.yaw = world.spawnYaw;
    this.mode = 'ground'; this.ground = null; this.coyote = 0; this.airTime = 0;
    this.rail = null; this.railS = 0; this.railSD = 1; this.gs = 0; this.grindCD = 0; this.grindT = 0;
    this.lastSafe = this.pos.clone(); this.lastSafeYaw = this.yaw; this.safeT = 0; this.checkpoint = { pos: this.pos.clone(), yaw: this.yaw };
    this.trick = null; this.trickQueue = 0; this.spinX = 0; this.spinY = 0; this.spinZ = 0;
    this.landT = 0; this.pushT = 0; this.turn = 0; this.fallY = 0; this.balance = 0;
    rig.root.position.copy(this.pos); rig.root.rotation.y = this.yaw;
  }
  get speed() { return Math.hypot(this.vel.x, this.vel.z); }
  respawn(toCheckpoint = false) {
    const t = toCheckpoint ? this.checkpoint : { pos: this.lastSafe, yaw: this.lastSafeYaw };
    this.pos.copy(t.pos); this.vel.set(0, 0, 0); this.yaw = t.yaw; this.mode = 'ground'; this.rail = null; this.trick = null;
    this.spinX = this.spinY = this.spinZ = 0; this.airTime = 0; this.grindCD = 0.3;
  }
  setCheckpoint(pos, yaw) { this.checkpoint = { pos: pos.clone(), yaw }; }

  // --- collision helpers
  pushWalls() {
    const W = this.W, p = this.pos, R = PH.R;
    for (const b of W.boxes) {
      if (b.y1 <= p.y + PH.STEP || b.y0 >= p.y + PH.H) continue;
      if (p.x < b.x0 - R || p.x > b.x1 + R || p.z < b.z0 - R || p.z > b.z1 + R) continue;
      const cx = U.clamp(p.x, b.x0, b.x1), cz = U.clamp(p.z, b.z0, b.z1);
      let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
      let nx, nz, pen;
      if (d2 > 1e-9) { const d = Math.sqrt(d2); if (d >= R) continue; nx = dx / d; nz = dz / d; pen = R - d; }
      else {
        const opts = [[p.x - b.x0, -1, 0], [b.x1 - p.x, 1, 0], [p.z - b.z0, 0, -1], [b.z1 - p.z, 0, 1]];
        opts.sort((a, c) => a[0] - c[0]); nx = opts[0][1]; nz = opts[0][2]; pen = opts[0][0] + R;
      }
      p.x += nx * pen; p.z += nz * pen;
      const vn = this.vel.x * nx + this.vel.z * nz;
      if (vn < 0) { this.vel.x -= nx * vn * 1.05; this.vel.z -= nz * vn * 1.05; if (vn < -9) this.hooks.bonk?.(); }
    }
    for (const rp of W.ramps) {
      if (p.x < rp.x0 - R || p.x > rp.x1 + R || p.z < rp.z0 - R || p.z > rp.z1 + R) continue;
      if (p.x >= rp.x0 && p.x <= rp.x1 && p.z >= rp.z0 && p.z <= rp.z1) continue;
      const cx = U.clamp(p.x, rp.x0, rp.x1), cz = U.clamp(p.z, rp.z0, rp.z1);
      const h = rampH(rp, cx, cz), bottom = rp.base == null ? h - 0.35 : rp.base;
      if (h <= p.y + PH.STEP || bottom >= p.y + PH.H) continue;
      let dx = p.x - cx, dz = p.z - cz; const d = Math.hypot(dx, dz); if (d >= R || d < 1e-6) continue;
      const nx = dx / d, nz = dz / d; p.x += nx * (R - d); p.z += nz * (R - d);
      const vn = this.vel.x * nx + this.vel.z * nz; if (vn < 0) { this.vel.x -= nx * vn; this.vel.z -= nz * vn; }
    }
  }
  ceiling() {
    if (this.vel.y <= 0) return;
    const p = this.pos;
    for (const b of this.W.boxes) {
      if (p.x < b.x0 - 0.2 || p.x > b.x1 + 0.2 || p.z < b.z0 - 0.2 || p.z > b.z1 + 0.2) continue;
      if (b.y0 > p.y + 0.6 && b.y0 < p.y + PH.H) { p.y = b.y0 - PH.H; this.vel.y = 0; }
    }
  }
  tryGrind() {
    if (this.grindCD > 0 || this.vel.y > 6) return false;
    const p = this.pos;
    let best = null, bd = 1e9;
    for (const r of this.W.rails) for (const s of r.segs) {
      const t = U.clamp(_v1.subVectors(p, s.a).dot(s.dir), 0, s.len);
      _v2.copy(s.a).addScaledVector(s.dir, t);
      const dxz = Math.hypot(p.x - _v2.x, p.z - _v2.z), dy = p.y - _v2.y;
      if (dxz < 1.05 && dy > -0.6 && dy < 1.1 && dxz < bd) { bd = dxz; best = { r, s: s.s0 + t, seg: s }; }
    }
    if (!best) return false;
    const seg = best.seg;
    const along = this.vel.x * seg.dir.x + this.vel.z * seg.dir.z + this.vel.y * seg.dir.y;
    let sd = Math.sign(along);
    if (Math.abs(along) < 1) sd = (Math.sin(this.yaw) * seg.dir.x + Math.cos(this.yaw) * seg.dir.z) >= 0 ? 1 : -1;
    // don't latch at the very end of the rail heading off
    if ((sd > 0 && best.s > best.r.len - 0.4) || (sd < 0 && best.s < 0.4)) return false;
    this.rail = best.r; this.railS = best.s; this.railSD = sd || 1;
    this.gs = Math.max(9, Math.hypot(this.vel.x, this.vel.z) * 0.95 + 1);
    this.mode = 'grind'; this.grindT = 0; this.trick = null; this.spinX = this.spinZ = 0;
    this.hooks.grindStart?.(this.rail);
    return true;
  }
  leaveRail(jump, beatQ) {
    const d = railDir(this.rail, this.railS);
    this.vel.copy(d).multiplyScalar(this.railSD * this.gs);
    if (jump) { this.vel.y = Math.max(this.vel.y, 0) + (beatQ !== 'miss' ? PH.BEATJUMP : PH.JUMP); }
    else this.vel.y = Math.max(this.vel.y, 0) + 2.5;
    this.mode = 'air'; this.airTime = 0; this.rail = null; this.grindCD = 0.32;
    this.hooks.grindEnd?.();
  }
  doJump(tStamp) {
    const q = Sound.judge(tStamp);
    // speaker pads
    const pad = this.onPad();
    if (pad) {
      if (q !== 'miss') {
        this.vel.set(pad.aim.x, pad.vy, pad.aim.z);
        this.hooks.padLaunch?.(pad, true, q);
      } else { this.vel.y = 13; this.hooks.padLaunch?.(pad, false, q); }
      this.mode = 'air'; this.airTime = 0; this.coyote = 0; this.grindCD = 0.4;
      return;
    }
    this.vel.y = q !== 'miss' ? PH.BEATJUMP : PH.JUMP;
    this.mode = 'air'; this.airTime = 0; this.coyote = 0;
    this.hooks.jump?.(q);
  }
  onPad() {
    if (this.mode !== 'ground' && this.coyote <= 0) return null;
    for (const pd of this.W.pads) {
      if (Math.hypot(this.pos.x - pd.pos.x, this.pos.z - pd.pos.z) < pd.r && Math.abs(this.pos.y - (pd.pos.y + 0.25)) < 0.5) return pd;
    }
    return null;
  }
  doTrick(tStamp) {
    const q = Sound.judge(tStamp);
    if (this.mode === 'ground') {
      const sp = this.speed;
      const add = q === 'perfect' ? 7 : q === 'good' ? 5 : 1.2;
      const h = sp > 0.5 ? Math.atan2(this.vel.x, this.vel.z) : this.yaw;
      const ns = Math.min(PH.MAXSP, sp + add);
      this.vel.x = Math.sin(h) * ns; this.vel.z = Math.cos(h) * ns;
      this.pushT = 1;
      this.hooks.push?.(q);
      return;
    }
    if (this.mode === 'grind') {
      this.spinY += Math.PI; this.railSwitch = !this.railSwitch;
      if (q !== 'miss') this.gs = Math.min(28, this.gs + 2.5);
      this.hooks.trick?.(q, 'GRIND SWITCH', 'grind');
      return;
    }
    // air
    this.trickQueue++;
    const tr = TRICKS_AIR[(this.trickQueue - 1) % TRICKS_AIR.length];
    if (q === 'miss') { this.spinY += Math.PI * 0.5; this.hooks.trick?.(q, 'FLAIL', 'air'); return; }
    if (tr.axis === 'y') this.spinY += Math.PI * 2 * tr.amt;
    else if (tr.axis === 'x') this.spinX += Math.PI * 2 * tr.amt;
    else this.spinZ += Math.PI * 2 * tr.amt;
    if (this.vel.y < 4) this.vel.y = Math.max(this.vel.y, 3.5);   // a little float on a good trick
    this.hooks.trick?.(q, tr.name, 'air');
  }

  update(dt, camYaw, now) {
    const W = this.W, p = this.pos, v = this.vel;
    this.grindCD -= dt; this.coyote -= dt; this.landT = Math.max(0, this.landT - dt * 3); this.pushT = Math.max(0, this.pushT - dt * 3);
    // input
    const ix = Input.move.x, iy = Input.move.y; const im = Math.hypot(ix, iy);
    // the stick's frame of reference is captured when the thumb lands (or re-centres),
    // so holding "right" keeps going right instead of spiralling as the camera swings round
    if (Input.stick.id !== null && (Input.frame === null || im < 0.2)) Input.frame = camYaw;
    const ref = Input.stick.id !== null && Input.frame !== null ? Input.frame : camYaw;
    const fx = Math.sin(ref), fz = Math.cos(ref);
    const rx = -fz, rz = fx;
    const dx = fx * iy + rx * ix, dz = fz * iy + rz * ix;   // stick right → screen right
    const ctl = Input.kbActive ? { tank: true, fwd: Input.kb.fwd, turn: Input.kb.turn } : { tank: false, dx, dz, im };
    // queued buttons
    const jumps = Input.jumpQ.splice(0), tricks = Input.trickQ.splice(0);
    for (const t of jumps) {
      if (this.mode === 'grind') { const q = Sound.judge(t); this.leaveRail(true, q); this.hooks.jump?.(q, true); }
      else if (this.mode === 'ground' || this.coyote > 0) this.doJump(t);
    }
    for (const t of tricks) this.doTrick(t);

    if (this.mode === 'grind') this.updateGrind(dt);
    else {
      const sub = 2, h = dt / sub;
      for (let i = 0; i < sub; i++) this.step(h, ctl);
    }
    // safety net
    if (p.y < W.killY) this.hooks.fell?.();
    // remember safe ground
    if (this.mode === 'ground' && this.ground && !this.ground.tag && this.ground.y1 !== undefined) {
      this.safeT -= dt;
      if (this.safeT < 0) {
        this.safeT = 0.35;
        let ok = true;
        for (const [ox, oz] of [[0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8]]) { const g = W.groundAt(p.x + ox, p.z + oz, p.y + 0.3, 0); if (Math.abs(g.y - p.y) > 0.05) { ok = false; break; } }
        if (ok) { this.lastSafe.copy(p); this.lastSafeYaw = this.yaw; }
      }
    }
    // facing
    const sp = this.speed;
    if (this.mode !== 'grind') {
      if (sp > 0.6) { const target = Math.atan2(v.x, v.z); const old = this.yaw; this.yaw = U.angDamp(this.yaw, target, 14, dt); this.turn = U.damp(this.turn, U.clamp(U.wrapAng(target - old) / dt * 0.12, -1, 1), 8, dt); }
      else if (ctl.tank) this.yaw -= ctl.turn * 3.2 * dt;
      else if (im > 0.2) this.yaw = U.angDamp(this.yaw, Math.atan2(dx, dz), 10, dt);
    }
    this.updateRigSpin(dt);
    // particles: grind sparks, speed streaks
    if (this.mode === 'grind') {
      for (let k = 0; k < 2; k++) this.fx.emit(_v1.set(p.x, p.y + 0.05, p.z), _v2.set((Math.random() - 0.5) * 3 - v.x * 0.1, 2 + Math.random() * 3, (Math.random() - 0.5) * 3 - v.z * 0.1), Math.random() < 0.5 ? '#ffd23f' : '#ff7a2f', 0.35, 14);
    } else if (this.mode === 'ground' && sp > 15 && Math.random() < 0.6) {
      this.fx.emit(_v1.set(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.1, p.z + (Math.random() - 0.5) * 0.6), _v2.set(-v.x * 0.15, 0.6, -v.z * 0.15), '#ffffff', 0.3, 0);
    }
  }
  step(dt, ctl) {
    const W = this.W, p = this.pos, v = this.vel;
    const { dx = 0, dz = 0, im = 0 } = ctl;
    if (this.mode === 'ground') {
      let sp = Math.hypot(v.x, v.z);
      let head = sp > 0.3 ? Math.atan2(v.x, v.z) : this.yaw;
      if (ctl.tank) {
        // skater steering: A/D carve, W pushes, S brakes
        const rate = U.lerp(3.4, 2.3, U.clamp(sp / 20, 0, 1));
        head -= ctl.turn * rate * dt;            // yaw decreases = turning right
        if (ctl.fwd > 0) { if (sp < PH.RUN) sp = Math.min(PH.RUN, sp + PH.ACC * dt); else sp = Math.max(PH.RUN, sp - 4 * dt); }
        else if (ctl.fwd < 0) sp = Math.max(0, sp - 20 * dt);
        else sp = Math.max(0, sp - (sp > PH.RUN ? 6 : 2.6) * dt);
      } else if (im > 0.08) {
        const tgt = Math.atan2(dx, dz);
        const diff = U.wrapAng(tgt - head);
        if (Math.abs(diff) > 2.5 && sp > 4) sp = Math.max(0, sp - 26 * dt);       // hard brake
        else {
          const rate = U.lerp(9, 3.6, U.clamp(sp / 20, 0, 1));
          head += U.clamp(diff, -rate * dt, rate * dt);
          const tsp = PH.RUN * Math.min(1, im);
          if (sp < tsp) sp = Math.min(tsp, sp + PH.ACC * dt * (0.4 + im * 0.6));
          else sp = Math.max(tsp, sp - 4 * dt);       // boosts fade: keep pushing on the beat
        }
      } else sp = Math.max(0, sp - (sp > PH.RUN ? 6 : 2.6) * dt);
      v.x = Math.sin(head) * sp; v.z = Math.cos(head) * sp;
      // slope pull on ramps
      if (this.ground && this.ground.axis) {
        const rp = this.ground, gr = (rp.h1 - rp.h0) / (rp.axis === 'x' ? rp.x1 - rp.x0 : rp.z1 - rp.z0);
        const a = -PH.GRAV * 0.32 * gr * dt;
        if (rp.axis === 'x') v.x += a; else v.z += a;
      }
      const oy = p.y;
      p.x += v.x * dt; p.z += v.z * dt;
      this.pushWalls();
      const g = W.groundAt(p.x, p.z, p.y + PH.STEP);
      if (g.y >= p.y - PH.SNAP && g.y > -1e8) {
        p.y = g.y; this.ground = g.hit;
        // vertical speed only from slopes (launch off kickers) or the moving lift
        if (g.hit && g.hit.axis) { const rp = g.hit, gr = (rp.h1 - rp.h0) / (rp.axis === 'x' ? rp.x1 - rp.x0 : rp.z1 - rp.z0); v.y = gr * (rp.axis === 'x' ? v.x : v.z); }
        else if (g.hit && g.hit.tag === 'lift') v.y = U.clamp((p.y - oy) / dt, 0, 10) * 0.6;
        else v.y = 0;
      } else {
        this.mode = 'air'; this.coyote = 0.12; this.airTime = 0; this.ground = null;
        if (v.y < 0) v.y = 0;
      }
    } else { // air
      this.airTime += dt;
      v.y = Math.max(-42, v.y - PH.GRAV * dt);
      if (ctl.tank) {
        // gentle air steering: rotate the flight path
        const a = -ctl.turn * 1.9 * dt, c = Math.cos(a), s = Math.sin(a);
        const nx = v.x * c + v.z * s, nz = -v.x * s + v.z * c; v.x = nx; v.z = nz;
      } else if (im > 0.08) {
        const before = Math.hypot(v.x, v.z);
        v.x += dx * PH.AIRACC * dt * im; v.z += dz * PH.AIRACC * dt * im;
        const after = Math.hypot(v.x, v.z), cap = Math.max(before, PH.RUN);
        if (after > cap) { v.x *= cap / after; v.z *= cap / after; }
      }
      const oy = p.y;
      p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
      this.pushWalls(); this.ceiling();
      if (this.tryGrind()) return;
      if (v.y <= 0) {
        const g = W.groundAt(p.x, p.z, oy + 0.05);
        if (g.y > -1e8 && p.y <= g.y) {
          p.y = g.y; this.ground = g.hit;
          const impact = -v.y; v.y = 0;
          if (impact > 14) { const k = U.clamp(1 - (impact - 14) / 40, 0.6, 1); v.x *= k; v.z *= k; }
          this.mode = 'ground'; this.landT = U.clamp(impact / 25, 0.2, 1);
          this.hooks.land?.(impact, this.airTime, this.spinLeft());
          this.airTime = 0; this.trickQueue = 0;
        }
      }
    }
  }
  spinLeft() { const r = (a) => Math.abs(a - Math.round(a / (Math.PI * 2)) * Math.PI * 2); return r(this.spinX) + r(this.spinZ); }
  updateGrind(dt) {
    const r = this.rail; const p = this.pos;
    this.grindT += dt;
    const d = railDir(r, this.railS);
    this.gs += -PH.GRAV * d.y * this.railSD * 0.6 * dt;
    this.gs = U.clamp(this.gs, 5, 29);
    this.railS += this.railSD * this.gs * dt;
    if (this.railS <= 0 || this.railS >= r.len) { this.railS = U.clamp(this.railS, 0, r.len); p.copy(railPoint(r, this.railS)); this.leaveRail(false); return; }
    p.copy(railPoint(r, this.railS));
    const dd = railDir(r, this.railS);
    this.yaw = U.angDamp(this.yaw, Math.atan2(dd.x * this.railSD, dd.z * this.railSD), 18, dt);
    this.vel.copy(dd).multiplyScalar(this.railSD * this.gs);
    this.balance = Math.sin(this.grindT * 5.3) * 0.6 + Math.sin(this.grindT * 2.1) * 0.4;
    this.hooks.grinding?.(dt, this.gs);
  }
  updateRigSpin(dt) {
    // spins resolve toward the nearest full turn quickly once over
    const k = this.mode === 'air' ? 9 : 22;
    const rig = this.rig;
    // visible spin chases accumulated target
    this._vx = U.damp(this._vx || 0, this.spinX, k, dt);
    this._vy = U.damp(this._vy || 0, this.spinY, k, dt);
    this._vz = U.damp(this._vz || 0, this.spinZ, k, dt);
    if (this.mode !== 'air') {
      // on landing, normalise spins
      const n = (a) => Math.round(a / (Math.PI * 2)) * Math.PI * 2;
      if (this.mode === 'ground') { this.spinX = n(this.spinX); this.spinZ = n(this.spinZ); if (!this.railSwitch) this.spinY = n(this.spinY); }
    }
    if (this.mode === 'ground' && this.railSwitch) { this.railSwitch = false; this.spinY = Math.round(this.spinY / (Math.PI * 2)) * Math.PI * 2; }
    rig.spin.rotation.set(this._vx, this._vy, this._vz);
  }
  syncRig(dt, beatPhase) {
    const rig = this.rig;
    rig.root.position.copy(this.pos);
    rig.root.rotation.y = this.yaw;
    const st = { mode: this.mode, speed: this.speed, vy: this.vel.y, landT: this.landT, push: this.pushT, turn: this.turn, balance: this.balance, beatPhase };
    if (this.mode === 'ground') rig.stride += dt * (this.speed / 3.6);
    rig.update(dt, rig.skateTarget(st, dt));
    // shadow
    const g = this.W.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.2, 0);
    if (g.y > -1e8) {
      const hgt = this.pos.y - g.y;
      rig.shadow.visible = true; rig.shadow.position.set(this.pos.x, g.y + 0.03, this.pos.z);
      const s = U.clamp(1 - hgt / 12, 0.3, 1); rig.shadow.scale.setScalar(s); rig.shadow.material.opacity = 0.38 * s;
    } else rig.shadow.visible = false;
  }
}
const _v1 = V3(), _v2 = V3(), _v3 = V3();

// ---------- chase camera ----------
class CamRig {
  constructor(cam, world) { this.cam = cam; this.W = world; this.yaw = Math.PI; this.pitch = 0.33; this.dist = 7; this.target = V3(); this.ty = 0; this.shake = 0; this.fovKick = 0; }
  snap(player) { this.yaw = player.yaw; this.target.copy(player.pos); this.ty = player.pos.y; this.update(1 / 60, player, true); }
  update(dt, pl, instant = false) {
    const now = performance.now() / 1000;
    // manual control
    if (Input.camDX || Input.camDY) {
      this.yaw -= Input.camDX * 0.006; this.pitch = U.clamp(this.pitch + Input.camDY * 0.003, 0.05, 0.85);
      if (Input.frame !== null) Input.frame -= Input.camDX * 0.006;
      Input.camDX = 0; Input.camDY = 0;
    }
    const manual = now - Input.lastCamInput < 1.6;
    const sp = pl.speed;
    if (!manual && (sp > 2 || pl.mode === 'grind')) {
      const vh = Math.atan2(pl.vel.x, pl.vel.z);
      const k = pl.mode === 'grind' ? 3.2 : pl.mode === 'air' ? 0.9 : (Input.kbActive ? 3 : 2.0) * U.clamp(sp / 10, 0.3, 1);
      this.yaw = U.angDamp(this.yaw, vh, k, dt);
    }
    if (!manual) this.pitch = U.damp(this.pitch, pl.mode === 'air' && pl.vel.y < -8 ? 0.48 : 0.33, 1.5, dt);
    this.ty = instant ? pl.pos.y : U.damp(this.ty, pl.pos.y, pl.mode === 'air' ? 5 : 12, dt);
    const tgt = _c1.set(pl.pos.x, this.ty + 1.45, pl.pos.z);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const dist = this.dist + U.clamp(sp - 10, 0, 12) * 0.12;
    const want = _c2.set(tgt.x - fx * dist * Math.cos(this.pitch), tgt.y + dist * Math.sin(this.pitch), tgt.z - fz * dist * Math.cos(this.pitch));
    // occlusion: pull the camera in front of walls
    const dir = _c3.subVectors(want, tgt); const len = dir.length(); dir.divideScalar(len);
    let tmin = len;
    for (const b of this.W.boxes) {
      const t = rayBox(tgt, dir, b, len); if (t !== null && t < tmin) tmin = t;
    }
    if (tmin < len) want.copy(tgt).addScaledVector(dir, Math.max(0.6, tmin - 0.35));
    if (instant) this.cam.position.copy(want); else this.cam.position.lerp(want, 1 - Math.exp(-14 * dt));
    this.shake = Math.max(0, this.shake - dt * 3);
    const sh = this.shake * 0.15;
    const look = _c4.set(tgt.x + fx * 1.6 + (Math.random() - 0.5) * sh, tgt.y + (Math.random() - 0.5) * sh, tgt.z + fz * 1.6);
    this.cam.lookAt(look);
    const baseFov = window.innerWidth < window.innerHeight ? 80 : 66;
    this.fovKick = U.damp(this.fovKick, 0, 6, dt);
    const fov = baseFov + U.clamp(sp - 8, 0, 16) * 0.45 + this.fovKick;
    if (Math.abs(this.cam.fov - fov) > 0.05) { this.cam.fov = U.damp(this.cam.fov, fov, 6, dt); this.cam.updateProjectionMatrix(); }
  }
}
const _c1 = V3(), _c2 = V3(), _c3 = V3(), _c4 = V3();
function rayBox(o, d, b, maxT) {
  let tmin = 0, tmax = maxT;
  for (const [oo, dd, lo, hi] of [[o.x, d.x, b.x0, b.x1], [o.y, d.y, b.y0, b.y1], [o.z, d.z, b.z0, b.z1]]) {
    if (Math.abs(dd) < 1e-8) { if (oo < lo || oo > hi) return null; continue; }
    let t1 = (lo - oo) / dd, t2 = (hi - oo) / dd; if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return null;
  }
  return tmin > 0 ? tmin : null;
}
