// ============================================================
//  RUBATO — the city game: wander, listen, play the city
// ============================================================
const $ = (id) => document.getElementById(id);
const Game = { t: 0, state: 'loading', fx: null, still: 0, listen: 0, hazardCD: 0, dprAcc: 0, dprN: 0, sit: null, down: 0, waitResume: false, swim: 0, placeT: 0, lastPlace: null, hintI: 0, hintT: 0, hintShown: false };

// the quiet one: soft knit, wide trousers, cream skates, a scarf
function makeNao() {
  return new Rig({
    colors: { skin: '#d9a07a', jacket: '#6f9a92', pants: '#3b3f4f', boot: '#efe6d2', bootCuff: '#c98a4a', wheels: '#c9b48a' },
    sleeve: '#6f9a92', gloves: '#d9a07a', legs: '#3b3f4f', collar: '#d9a441', stripe: '#d9a441',
    // the body, knee pads and buckled skates of the model sheet, in her colours (no radio, no headphones: she keeps her own hair)
    kit: KIT.SKATER, kitOpts: [],
    kitColors: { jacket: '#6f9a92', jacket2: '#5d857e', sleeve: '#6f9a92', accent: '#d9a441', shirt: '#efe6d2', pants: '#3b3f4f', pants2: '#474b5c',
      boot: '#efe6d2', boot2: '#c98a4a', frame: '#3a3550', wheels: '#c9b48a', skin: '#d9a07a', glove: '#d9a07a', ink: '#1d1a26', hair: '#2d2522' },
    hair(head, R, T) {
      const hair = part(new THREE.SphereGeometry(R * 1.08, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), '#2d2522', T); hair.position.y = R * 0.05; hair.scale.set(1.04, 1.04, 1.06); head.add(hair);
      const back = part(new THREE.SphereGeometry(R * 1.08, 14, 10, Math.PI * 1.1, Math.PI * 0.8, 0, Math.PI * 0.7), '#2d2522', T); head.add(back);
      const bun = part(new THREE.SphereGeometry(R * 0.42, 12, 8), '#2d2522', T); bun.position.set(0, R * 0.55, -R * 0.85); head.add(bun);
      const clip = part(new THREE.BoxGeometry(R * 0.5, R * 0.12, R * 0.12), '#d9a441', 0.01); clip.position.set(R * 0.55, R * 0.7, R * 0.55); clip.rotation.z = -0.5; head.add(clip);
      // a scarf, one end trailing
      const sc = part(new THREE.TorusGeometry(R * 0.85, R * 0.22, 6, 14), '#d9a441', T); sc.rotation.x = Math.PI / 2; sc.position.y = -R * 1.05; head.add(sc);
      const tail = part(new THREE.BoxGeometry(R * 0.4, R * 1.3, R * 0.14), '#d9a441', T); tail.position.set(R * 0.3, -R * 1.7, -R * 0.75); tail.rotation.x = 0.4; head.add(tail);
    }
  });
}

// the player's own sounds come from moves.js (a written lick per district for grinds, a figure per trick…)
function useMoves() { if (typeof MOVES === 'undefined' || !Sound.ready || Sound._E.moves) return; MOVES.install(Sound._E); Sound._E.moves = MOVES; MOVES.useLeads(true); }
// ---------- hooks: the player's moves, answered softly by the music ----------
const hooks = {
  jump(q) { Sound.sfx.jump(q !== 'miss'); Game.usedJump = true; },
  push(q) { Sound.sfx.push(q !== 'miss'); },
  trick(q, name, where) {
    const b = Game.W.bell, p = Game.player.pos;
    if (b && Math.hypot(b.x - p.x, b.z - p.z) < 12 && Game.bellCD <= 0) { Sound.sfx.ringBell(); Game.bellCD = 20; }
    Game.combo = (Game.combo || 0) + 1;
    Sound.sfx.trick(Game.combo, q, name, where); Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 1.2, 0)), 6, ['#f6f1e7', '#ffe9b0'], 3, 0.6, 3);
  },
  land(impact, airTime, spinLeft) {
    const p = Game.player, g = p.ground;
    if (g && g.tag === 'bounce' && impact > (g.kick ? 0.8 : 2.5)) {
      // a canvas awning: back up you go, a little higher each time you keep it going
      Game.bounceN = Game.t - (Game.bounceT || 0) < 2.5 ? (Game.bounceN || 0) + 1 : 0; Game.bounceT = Game.t;
      // keep steering (or jumping) to keep it going; let go and the bounces die down
      const driving = Math.hypot(Input.move.x, Input.move.y) > 0.15 || Input.kbActive || Input.jumpHeld;
      // (the shades set out as steps up a wall always throw you high enough to reach the next one)
      const vy = driving || g.kick ? U.clamp(impact * 0.82 + 2, g.kick || 9, 15.5) : impact * 0.55;
      if (vy < 3) { Sound.sfx.land(0.3); return; }
      p.mode = 'air'; p.vel.y = vy; p.pos.y += 0.05; p.airTime = 0; p.ground = null;
      Sound.sfx.touch(g.drum !== undefined ? 'drum' : 'bounce', g.drum ?? Game.bounceN);
      Game.fx.burst(V3().copy(p.pos).add(V3(0, 0.1, 0)), 5, ['#ffffff', '#ffd23f'], 2, 0.3, 3);
      return;
    }
    // landing a run of tricks in front of people: they clap
    if ((Game.combo || 0) >= 2 && Game.t > (Game.clapCD || 0)) { const n = Life.applaud(p.pos.x, p.pos.z, Game.combo >= 4); if (n >= 2) { Sound.sfx.applause(n); Game.clapCD = Game.t + 6; } }
    Sound.sfx.land(Math.min(1.4, impact / 18), { combo: Game.combo || 0, clean: !(spinLeft > 0.5) }); if (impact > 10) Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 0.1, 0)), 6, ['#ffffff', '#e9e4f5'], 2.5, 0.4, 4); if (impact > 24) Game.cam.shake = 0.4; },
  grindStart(r) {
    Sound.sfx.land(0.4); Game.combo = (Game.combo || 0) + 1;
    const p0 = r && r.pts[0], pp = Game.player.pos;
    Sound.sfx.grindStart({ voice: r ? (r.voice || (r.kind === 'cable' ? 'cable' : r.kind === 'pipe' ? 'pipe' : r.hidden ? 'ledge' : 'rail')) : 'rail', seed: p0 ? Math.floor(p0.x * 7.3 + p0.z * 13.1) : 1, h: pp.y - terrainAt(pp.x, pp.z) });
  },
  grinding() {}, grindEnd(q) { Sound.sfx.grindEnd(q || 'good'); }, railHop() { Sound.sfx.jump(true); },
  padLaunch() {},
  bonk() { Game.cam.shake = 0.25; Sound.sfx.land(0.6); },
  fell() { knockDown(null, true); },
  hazard(b) { knockDown(b); },
};

// corners with their own mood (the music engine knows which mode each one wants)
let ZONE_LIST = null;
function zoneAt(x, z) {
  if (!ZONE_LIST) {
    const W = Game.W, cs = PLAN.stations.find(s => s.key === 'central').at, cel = PLAN.spots.find(s => s.key === 'cellar').at;
    ZONE_LIST = [
      ['pond', PLAN.pond.x, PLAN.pond.z, PLAN.pond.r + 25], ['deepwood', -640, -760, 130], ['plaza', cs[0], cs[1], 75],
      ['cellar', cel[0], cel[1], 22], ['pier', -480, 1420, 70], ['yard', 760, 880, 130],
    ];
    if (W.bell) ZONE_LIST.push(['square', W.bell.x, W.bell.z, 45]);
  }
  for (const [k, zx, zz, r] of ZONE_LIST) if ((x - zx) * (x - zx) + (z - zz) * (z - zz) < r * r) return k;
  return null;
}
// a knock: the record scratches, you tumble, and the music waits for you
function knockDown(b, quiet = false) {
  if (Game.state !== 'play' || Game.hazardCD > 0 || Game.down > 0) return;
  Game.hazardCD = 2.5; Game.down = 1.4; Game.waitResume = true;
  const p = Game.player;
  if (!quiet) { Sound.knock(); Game.cam.shake = 0.6; }
  if (b && b.vx !== undefined) { p.vel.set(b.vx * 0.6, 6, b.vz * 0.6); } else p.vel.set(-p.vel.x * 0.3, 5, -p.vel.z * 0.3);
  p.mode = 'air'; p.rail = null; p.spinX += Math.PI * 2;
}
// back on your feet somewhere safe (on the metro that means the nearest platform)
let _liftEl = null;
function liftFade(k) {
  if (!_liftEl) { _liftEl = document.createElement('div'); _liftEl.style.cssText = 'position:fixed;inset:0;background:#14101f;opacity:0;pointer-events:none;z-index:5'; document.body.appendChild(_liftEl); }
  _liftEl.style.opacity = U.clamp(k, 0, 1).toFixed(2);
}
function getUp() {
  const p = Game.player, W = Game.W;
  let onLine = false;
  for (let i = 0; i < W.metro.N; i += 3) { const q = W.metro.pts[i]; if (Math.hypot(q.x - p.pos.x, q.z - p.pos.z) < 7 && Math.abs(q.y - p.pos.y) < 6) { onLine = true; break; } }
  if (onLine || Game.hitByTrain) {
    let best = null, bd = 1e9; for (const st of W.stations) { const d = Math.hypot(st.p.x - p.pos.x, st.p.z - p.pos.z); if (d < bd) { bd = d; best = st; } }
    const sd = 1, o = best.platOff;
    p.pos.set(best.p.x - best.p.dz * o * sd, best.platY, best.p.z + best.p.dx * o * sd); p.yaw = best.yaw;
  } else p.respawn(false);
  p.vel.set(0, 0, 0); p.mode = 'ground'; p.spinX = p.spinY = p.spinZ = 0;
  Game.cam.snap(p); Game.hitByTrain = false;
}

// ---------- boot ----------
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load('40px "Fraunces"'), document.fonts.load('20px "M PLUS Rounded 1c"')]), new Promise(r => setTimeout(r, 2000))]); } catch (e) {}
  initRenderer();
  G.dprMax = Math.min(window.devicePixelRatio || 1, U.isTouch ? 1.5 : 2); G.dpr = G.dprMax; G.renderer.setPixelRatio(G.dpr);
  Input.init();
  await new Promise(r => setTimeout(r, 30));
  const W = buildCity();
  G.scene.add(W.group);
  Game.W = W;
  const rig = makeNao(); G.scene.add(rig.root, rig.shadow); Game.rig = rig;
  Game.fx = new Particles(G.scene, 500);
  Game.player = new Player(W, rig, Game.fx, hooks);
  Game.cam = new CamRig(G.camera, W);
  Game.cam.snap(Game.player);
  Sky.init(W, 0.6);
  Fauna.init(W); Life.init(W);
  // the camera's no-go boxes (tree canopies, gallery roofs…), filed in a grid so it only checks nearby ones
  W.camGrid = makeGrid(32); for (const b of (W.camBoxes || [])) W.camGrid.add(b, b.x0, b.z0, b.x1, b.z1);
  W.soundGrid = makeGrid(32); W.sounds.forEach((s, i) => { s.i = i; W.soundGrid.add(s, s.x - s.r, s.z - s.r, s.x + s.r, s.z + s.r); });
  bindUI();
  if (U.isTouch) document.body.classList.add('touch');
  $('loading').hidden = true; $('title').hidden = false; Game.state = 'title';
  Game.last = performance.now();
  requestAnimationFrame(loop);
}

function bindUI() {
  const begin = () => {
    if (Game.state !== 'title') return;
    Sound.init(); useMoves(); Sound.start();
    $('title').hidden = true; Game.state = 'play'; Input.enabled = true; Input.flush();
    document.body.classList.add('playing');
    const p = Game.player; p.pos.copy(Game.W.spawn); p.yaw = Game.W.spawnYaw; p.vel.set(0, 0, 0); p.lastSafe.copy(p.pos);
    Game.cam.snap(p); Game.cam.yaw = p.yaw; Game.hintT = 0;
  };
  $('title').addEventListener('pointerdown', begin);
  window.addEventListener('keydown', (e) => { if (Game.state === 'title' && (e.code === 'Space' || e.code === 'Enter')) begin(); if (e.code === 'Escape' || e.code === 'KeyP') pause(Game.state === 'play'); });
  $('btnPause').onclick = () => pause(true);
  $('btnResume').onclick = () => pause(false);
  $('volMusic').oninput = (e) => Sound.setVolume(+e.target.value / 100, null);
  $('volFx').oninput = (e) => Sound.setVolume(null, +e.target.value / 100);
  $('tod').oninput = (e) => { Sky.phase = (+e.target.value / 100 + 0.0) % 1; Sky.update(0, G.camera.position); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.state === 'play') pause(true); });
}
// the pause-menu map: districts, water, roads, the metro and its stations, and you
function drawMap(cv) {
  if (!cv) return;
  const W = Game.W, c = cv.getContext('2d'), S = cv.width;
  const x0 = -1100, x1 = 1100, z0 = -1450, z1 = 1450, k = S / Math.max(x1 - x0, z1 - z0), ox = (S - (x1 - x0) * k) / 2;
  const X = (x) => ox + (x - x0) * k, Z = (z) => (z - z0) * k;
  c.fillStyle = '#e8dfcc'; c.fillRect(0, 0, S, S);
  const tint = { park: '#a9c98f', obs: '#c9cfa0', oldtown: '#e3c9a4', business: '#cfd3d8', market: '#e8c7a0', canals: '#bcd2b8', docks: '#c9c0b2', lake: '#d9e3b8' };
  for (const d of PLAN.districts) { const [a, b, e, f] = d.rect; c.fillStyle = tint[d.key] || '#ddd'; c.fillRect(X(a), Z(b), (e - a) * k, (f - b) * k); }
  // the lake
  c.fillStyle = '#8fbcd0'; c.beginPath(); c.moveTo(X(x0), Z(z1)); for (let x = x0; x <= x1; x += 20) c.lineTo(X(x), Z(shoreZ(x))); c.lineTo(X(x1), Z(z1)); c.fill();
  const C = PLAN.canal; c.fillStyle = '#8fbcd0'; c.fillRect(X(C.x0), Z(C.z - C.half), (C.bendX + C.half - C.x0) * k, C.half * 2 * k); c.fillRect(X(C.bendX - C.half), Z(C.z), C.half * 2 * k, (canalEndZ() - C.z) * k);
  if (PLAN.pond) { c.beginPath(); c.arc(X(PLAN.pond.x), Z(PLAN.pond.z), PLAN.pond.r * k, 0, 7); c.fill(); }
  // roads
  c.strokeStyle = '#8a8698'; c.lineCap = 'round';
  const line = (P, w) => { c.lineWidth = Math.max(1.5, w * k); c.beginPath(); P.forEach(([x, z], i) => i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z))); c.stroke(); };
  for (const r of Object.values(W.roads || {})) line(r.pts, r.width);
  for (const s of (W.bizStreets || [])) line([[s.x, s.z0], [s.x, s.z1]], 10);
  // metro
  const M = W.metro; if (M) { c.strokeStyle = '#e4572e'; c.lineWidth = 3; c.setLineDash([]); c.beginPath(); M.pts.forEach((p, i) => { if (i % 3) return; const sx = X(p.x), sz = Z(p.z); i ? c.lineTo(sx, sz) : c.moveTo(sx, sz); }); c.closePath(); c.stroke();
    c.font = `600 ${Math.round(S / 34)}px ${FONT.body}`; c.textBaseline = 'middle';
    for (const st of (W.stations || [])) { const sx = X(st.p.x), sz = Z(st.p.z); c.fillStyle = '#fff'; c.strokeStyle = '#1b1a24'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sz, S / 75, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#1b1a24'; c.fillText(st.name, sx + S / 55, sz); } }
  // district names
  c.font = `500 ${Math.round(S / 30)}px ${FONT.title}`; c.textAlign = 'center'; c.fillStyle = 'rgba(27,26,36,.55)';
  for (const d of PLAN.districts) { const [a, b, e, f] = d.rect; c.fillText(d.name, X((a + e) / 2), Z((b + f) / 2)); }
  c.textAlign = 'left';
  // you
  const p = Game.player, px = X(p.pos.x), pz = Z(p.pos.z), a = p.yaw;
  c.save(); c.translate(px, pz); c.rotate(-a + Math.PI); c.fillStyle = '#e4572e'; c.strokeStyle = '#fff'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(0, -S / 40); c.lineTo(S / 60, S / 60); c.lineTo(0, S / 120); c.lineTo(-S / 60, S / 60); c.closePath(); c.stroke(); c.fill(); c.restore();
}
function pause(on) {
  if (on && Game.state === 'play') {
    Game.state = 'paused'; $('pause').hidden = false; Input.enabled = false; Sound.suspend(true); $('tod').value = Math.round(Sky.phase * 100);
    const d = PLAN.byKey[Sound.place], R = Sound.REC[Sound.place];
    $('where').textContent = d ? `${d.name} · ${Math.round(Sound.bpm / (R ? R.f : 1))} bpm · ${Sound.modeName}` : '';
    drawMap($('map'));
    $('howto').innerHTML = HOWTO.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('');
  }
  else if (!on && Game.state === 'paused') { Game.state = 'play'; $('pause').hidden = true; Input.enabled = true; Input.flush(); Sound.suspend(false); Game.last = performance.now(); }
}

// ---------- no words on screen: the labels on the circles fade once you've used them ----------
function updateHints(dt) {
  if (document.body.classList.contains('quiet')) return;
  Game.hintT += dt;
  if ((Game.usedJump && Game.player.speed > 4) || Game.hintT > 30) document.body.classList.add('quiet');
}
const HOWTO = U.isTouch ? [['Skate', 'drag on the left half'], ['Look', 'drag on the right half'], ['Jump', 'big circle — on the beat goes higher'], ['Flourish', 'small circle (in the air: a trick)'], ['Grind', 'jump onto any rail, ledge or cable'], ['Listen', 'stop on a bench, or stand still']]
  : [['Skate', 'W A S D or the arrows'], ['Look', 'drag the mouse, or Q / E'], ['Jump', 'space — on the beat goes higher'], ['Flourish', 'shift (in the air: a trick)'], ['Grind', 'jump onto any rail, ledge or cable'], ['Listen', 'stop on a bench, or stand still'], ['Pause', 'Esc']];
// iOS zooms in on a quick double tap even when zoom is disabled: stop it (and pinches)
function preventZoom() {
  const stop = (e) => e.preventDefault();
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, { passive: false });
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  let lastEnd = 0;
  document.addEventListener('touchend', (e) => { const now = e.timeStamp; if (now - lastEnd < 350 && !e.target.closest('input')) e.preventDefault(); lastEnd = now; }, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });
  window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); });
}
preventZoom();

// ---------- hints: a shimmer along the rail you could reach with a jump, and a soft note ----------
const _hq = [], _hp = V3();
function railPointAt(r, sg, s, out) {
  if (sg.i === undefined) r.segs.forEach((q, i) => { q.i = i; });
  let q = sg, k = sg.i;
  while (s < q.s0 && k > 0) q = r.segs[--k];
  while (s > q.s0 + q.len && k < r.segs.length - 1) q = r.segs[++k];
  const t = U.clamp((s - q.s0) / q.len, 0, 1);
  return out.copy(q.a).lerp(q.b, t);
}
function updateGrindHint(dt, bi) {
  const W = Game.W, p = Game.player, pos = p.pos;
  if (!Game.hintPts) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(15 * 3), 3));
    const dot = canvasTex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,214,90,.95)'); gr.addColorStop(0.6, 'rgba(255,170,60,.35)'); gr.addColorStop(1, 'rgba(255,150,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }).tex;
    Game.hintPts = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, color: 0xffffff, size: 0.6, transparent: true, opacity: 0, depthWrite: false }));
    Game.hintPts.frustumCulled = false; G.scene.add(Game.hintPts); Game.hintA = 0;
  }
  let best = null, bd = 7;
  const sp = Math.hypot(p.vel.x, p.vel.z);
  if (p.mode !== 'grind' && sp > 3 && !(Game.down > 0)) {
    const vx = p.vel.x / sp, vz = p.vel.z / sp;
    for (const sg of W.railGrid.query(pos.x - 7, pos.z - 7, pos.x + 7, pos.z + 7, _hq)) {
      const a = sg.a, d = sg.dir, len = sg.len;
      let t = (pos.x - a.x) * d.x + (pos.y - a.y) * d.y + (pos.z - a.z) * d.z; t = U.clamp(t, 0, len);
      const cx = a.x + d.x * t, cy = a.y + d.y * t, cz = a.z + d.z * t, rx = cx - pos.x, rz = cz - pos.z, dh = Math.hypot(rx, rz), dy = cy - pos.y;
      if (dh > bd || dy < -1.5 || dy > 3.2 || dh < 0.4) continue;
      if (dh > 1.5 && (rx * vx + rz * vz) / dh < 0.25) continue;
      if (sg.r.kind === 'cable' && dy > 2) continue;
      bd = dh; best = { sg, s: sg.s0 + t };
    }
  }
  const want = best ? 1 : 0;
  Game.hintA = U.damp(Game.hintA, want, best ? 6 : 3, dt);
  const m = Game.hintPts.material;
  m.opacity = Game.hintA * (0.35 + 0.55 * Math.pow(1 - (bi.phase || 0), 2));
  if (best) {
    const arr = Game.hintPts.geometry.attributes.position.array, r = best.sg.r;
    for (let i = 0; i < 15; i++) {
      const s = U.clamp(best.s + (i - 7) * 0.55 + ((Game.t * 1.1) % 0.55), 0, r.len);
      railPointAt(r, best.sg, s, _hp); arr[i * 3] = _hp.x; arr[i * 3 + 1] = _hp.y + 0.12; arr[i * 3 + 2] = _hp.z;
    }
    Game.hintPts.geometry.attributes.position.needsUpdate = true;
    if (r !== Game.hintRail && Game.t > (Game.hintCD || 0)) { Sound.sfx.hint(); Game.hintCD = Game.t + 1.5; }
    Game.hintRail = r;
  } else if (Game.hintA < 0.05) Game.hintRail = null;
}

// ---------- the world reacting to you ----------
const _sq = [], _dw = {};
function updateWorld(dt, bi) {
  const W = Game.W, p = Game.player, pos = p.pos;
  // things that ring as you pass
  for (const s of W.soundGrid.query(pos.x - 2, pos.z - 2, pos.x + 2, pos.z + 2, _sq)) {
    s.cd -= dt;
    const d = Math.hypot(s.x - pos.x, s.z - pos.z);
    // (the fountain rings while you stand by it; the pond — a big place — only chimes as you skate along it)
    if (d < s.r && Math.abs(s.y - pos.y) < 4 && s.cd <= 0 && (p.speed > 2.5 || s.kind === 'fountain')) {
      s.cd = s.kind === 'fountain' ? 2.4 : s.kind === 'pond' ? 4.8 : 1.4;
      Sound.sfx.touch(s.kind === 'pond' ? 'chime' : s.kind, s.deg ?? (Game.touchN = (Game.touchN || 0) + 1));
    }
  }
  // hidden spots: proximity → a local change in the music
  const spots = {};
  for (const sp of W.spots) {
    const d = Math.hypot(sp.x - pos.x, sp.z - pos.z), dy = Math.abs(sp.y - pos.y);
    let w = U.clamp(1 - d / sp.r, 0, 1); if (dy > 6 && !sp.tall) w *= U.clamp(1 - (dy - 6) / 6, 0, 1);
    sp.w = U.damp(sp.w, U.smooth(w), 2, dt);
    if (sp.w > 0.01) spots[sp.key] = sp.w;
  }
  for (const k in spots) if (k.startsWith('busk_')) spots[k] *= 0.55 + Game.listen * 0.45;
  // riding the wheel or a gondola brings its own layer
  const g = p.ground;
  Game.ride = U.damp(Game.ride || 0, g && g.ferris && p.mode === 'ground' ? 1 : 0, 1.5, dt); if (Game.ride > 0.02) spots.ferrisride = Game.ride;
  Game.rideG = U.damp(Game.rideG || 0, g && g.gondola && p.mode === 'ground' ? 1 : 0, 1.5, dt); if (Game.rideG > 0.02) spots.gondolaride = Game.rideG;
  // a radio dish tunes you in to somewhere else
  Game.radio = null; let rk = 0;
  for (const dsh of (W.dishes || [])) { const k = U.clamp(1 - (Math.hypot(dsh.x - pos.x, dsh.z - pos.z) - dsh.r) / 10, 0, 1); if (k > rk) { rk = k; Game.radio = dsh.remote; } }
  Game.radioK = U.damp(Game.radioK || 0, rk, 1.2, dt); if (Game.radioK > 0.02) spots.radio = Game.radioK;
  Game.spots = spots;
  // lifts: step into the doorway and you come out of the other one (the doors chime)
  for (const L of (W.lifts || [])) {
    const da = Math.hypot(L.ax - pos.x, L.az - pos.z) + Math.abs(L.ay - pos.y) * 0.5, db = Math.hypot(L.bx - pos.x, L.bz - pos.z) + Math.abs(L.by - pos.y) * 0.5;
    if (L.t > 0) {
      const t0 = L.t; L.t -= dt;
      if (t0 > 0.45 && L.t <= 0.45) { const up = L.to === 'b'; p.pos.set(up ? L.bx : L.ax, (up ? L.by : L.ay) + 0.05, (up ? L.bz : L.az) + 1.2); p.vel.set(0, 0, 0); p.mode = 'ground'; p.yaw = 0; Game.cam.snap(p); Game.cam.yaw = Math.PI; W.updateCells(p.pos.x, p.pos.z, 360); Sound.sfx.touch('chime'); }
      liftFade(L.t > 0.45 ? (0.9 - L.t) / 0.4 : L.t / 0.45);
      if (L.t <= 0) liftFade(0);
    } else if (!L.armed) { if (da > 3.2 && db > 3.2) L.armed = true; }
    else if ((da < L.r || db < L.r) && p.mode === 'ground') { L.to = da < L.r ? 'b' : 'a'; L.t = 0.9; L.armed = false; Sound.sfx.touch('lamp'); }
  }
  // a little chime when a train pulls in near you
  for (const T of W.trains) if (T.arrived) { T.arrived = false; const f = metroAt(W.metro, T.s, 0); if (Math.hypot(f.x - pos.x, f.z - pos.z) < 220) Sound.sfx.touch('chime'); }
  Game.bellCD = (Game.bellCD || 0) - dt;
  // fountains
  for (const f of (W.fountains || [])) {
    if (Math.hypot(f.x - G.camera.position.x, f.z - G.camera.position.z) > 220) continue;
    Game.fAcc = (Game.fAcc || 0) + dt;
    if (Game.fAcc > 0.04) { Game.fAcc = 0; for (let k = 0; k < 3; k++) Game.fx.emit(_wv.set(f.x, f.y, f.z), _wv2.set((Math.random() - 0.5) * 3, 6 + Math.random() * 2 + (bi.phase < 0.1 ? 3 : 0), (Math.random() - 0.5) * 3), Math.random() < 0.5 ? '#d8f0ff' : '#ffffff', 1.1, 11); }
  }
  // water
  let wet = null, deep = null;
  for (const w of W.waters) {
    if (!(pos.x > w.x0 && pos.x < w.x1 && pos.z > w.z0 && pos.z < w.z1)) continue;
    if (w.pond && Math.hypot(pos.x - W.pond.x, pos.z - W.pond.z) > W.pond.r * 0.72) continue;
    if (w.lake && pos.z < shoreZ(pos.x)) continue;
    if (pos.y < w.y - 0.6) { deep = w; break; }
    if (pos.y <= w.y + 0.05 && p.mode === 'ground') wet = w;
  }
  if (deep && Game.swim <= 0 && Game.state === 'play') {
    Game.swim = 1.6; Sound.sfx.splash(1.3); Sound.sfx.bubbles();
    Game.fx.burst(V3(pos.x, deep.y + 0.1, pos.z), 24, ['#bfe9ff', '#ffffff'], 6, 0.8, 10); $('fade').classList.add('on');
  }
  if (wet) {
    const sp = p.speed; if (sp > 8) { p.vel.x *= 8 / sp; p.vel.z *= 8 / sp; }
    if (sp > 1 && Math.random() < 0.6) Game.fx.emit(_wv2.set(pos.x, wet.y + 0.05, pos.z), _wv.set((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3), '#d8f0ff', 0.5, 12);
    if (!Game.inWater) Sound.sfx.splash(Math.min(1, 0.3 + sp / 14));
  }
  Game.inWater = !!wet;
  // light shafts in the park sway a little
}
const _wv = V3(), _wv2 = V3();

// ---------- sitting and listening ----------
function updateListening(dt) {
  const p = Game.player, W = Game.W, moving = Math.hypot(Input.move.x, Input.move.y) > 0.15 || Input.kbActive || Input.jumpQ.length || Input.trickQ.length;
  if (Game.sit) {
    if (moving) { Game.sit = null; p.pos.y += 0.05; }
  } else if (p.mode === 'ground' && p.speed < 0.4 && !moving) {
    Game.still += dt;
    if (Game.still > 1.2) {
      let best = null, bd = 2.2; for (const b of W.benches) { const d = Math.hypot(b.x - p.pos.x, b.z - p.pos.z); if (d < bd && Math.abs(b.y - p.pos.y) < 1.2) { bd = d; best = b; } }
      if (best) {
        Game.sit = best;
        // face away from the bench, towards the view (downhill, or the lake)
        const ax = best.alongX ? 0 : 1, az = best.alongX ? 1 : 0;
        const down = terrainAt(best.x + ax * 6, best.z + az * 6) < terrainAt(best.x - ax * 6, best.z - az * 6) ? 1 : -1;
        p.yaw = Math.atan2(ax * down, az * down); const h = best.half ? -best.half : 0; p.pos.set(best.x + (best.alongX ? h : 0), best.y, best.z + (best.alongX ? 0 : h));
      }
    }
  } else Game.still = 0;
  const target = Game.sit ? 1 : U.clamp((Game.still - 3.5) / 3, 0, 1);
  Game.listen = U.damp(Game.listen, target, Game.listen < target ? 0.6 : 3, dt);
  // the camera drifts back and up to take in the view
  const cam = Game.cam;
  cam.dist = 7 + Game.listen * 13;
  cam.basePitch = 0.33 + Game.listen * 0.12;
  if (Game.listen > 0.2) cam.yaw += dt * 0.035 * Game.listen;
}

// ---------- main loop ----------
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - Game.last) / 1000; Game.last = now;
  if (dt > 0.1) dt = 0.1; if (dt <= 0) dt = 0.001;
  Game.t += dt;
  const W = Game.W, p = Game.player;
  const bi = Sound.beat();
  if (Game.state === 'play') {
    Game.hazardCD = Math.max(0, Game.hazardCD - dt);
    Input.poll();
    const moving = Math.hypot(Input.move.x, Input.move.y) > 0.15 || Input.kbActive || Input.jumpQ.length > 0;
    // safety net: nobody falls out of the world
    Game.cam.indoor = (W.indoor || []).some(r => p.pos.x > r[0] && p.pos.x < r[2] && p.pos.z > r[1] && p.pos.z < r[3] && p.pos.y < r[4]) || p.pos.y < terrainAt(p.pos.x, p.pos.z) - 3.5 && !!(W.metro && W.metro.pts.some((q, i) => i % 4 === 0 && Math.abs(q.x - p.pos.x) < 60 && Math.abs(q.z - p.pos.z) < 60 && q.y < p.pos.y + 3 && (q.bored)));
    if (p.pos.y < -40 || p.pos.y < terrainAt(p.pos.x, p.pos.z) - 70 || !isFinite(p.pos.y)) { getUp(); Game.cam.snap(p); }
    if (Game.swim > 0) {
      Game.swim -= dt; Input.flush(); p.vel.multiplyScalar(0.9);
      if (Game.swim <= 0.6 && !Game.swimDone) { Game.swimDone = true; p.respawn(false); Game.cam.snap(p); }
      if (Game.swim <= 0) { Game.swimDone = false; $('fade').classList.remove('on'); }
    } else if (Game.down > 0) {
      Game.down -= dt; Input.flush();
      p.update(dt, Game.cam.yaw, now);
      if (Game.down <= 0) getUp();
    } else {
      if (Game.waitResume && moving) { Game.waitResume = false; Sound.resume(); }
      p.update(dt, Game.cam.yaw, now);
      // trains
      const T = W.trainsys.hits(p.pos);
      if (T && Game.hazardCD <= 0) { Game.hitByTrain = true; const b = T.boxes[0]; knockDown({ vx: b.vx, vz: b.vz }); }
      // cars and boats
      const v = Life.hits(p.pos); if (v && Game.hazardCD <= 0) knockDown(v);
    }
    updateListening(dt);
    if (Game.sit) { p.vel.set(0, 0, 0); p.pos.set(Game.sit.x, Game.sit.y, Game.sit.z); }
    Game.cam.update(dt, p);
    if (Game.sit) { Game.rig.root.position.set(Game.sit.x, Game.sit.y + 0.12, Game.sit.z); Game.rig.root.rotation.y = p.yaw; Game.rig.update(dt, Game.rig.poseTarget('sit'), { rock: 0.02 }); }
    else p.syncRig(dt, bi.phase);
    // what the music needs to know
    districtWeights(p.pos.x, p.pos.z, _dw, 140);
    if (Game.radio && Game.radioK > 0.02) { const k = Game.radioK * 0.75; for (const key in _dw) _dw[key] *= 1 - k; _dw[Game.radio] = (_dw[Game.radio] || 0) + k; }
    Sound.setPlace(_dw, dt); Sky.S.weights = _dw;
    const ground = p.ground;
    // a run of tricks and grinds lasts until you've been back on the ground for a moment
    Game.groundT = p.mode === 'ground' ? (Game.groundT || 0) + dt : 0;
    if (Game.groundT > 0.9) Game.combo = 0;
    Sound.update(dt, { alt: p.pos.y - terrainAt(p.pos.x, p.pos.z), combo: Game.combo || 0, grindH: p.mode === 'grind' ? p.pos.y - terrainAt(p.pos.x, p.pos.z) : 0, zone: zoneAt(p.pos.x, p.pos.z), dawn: Math.max(0, 1 - Math.abs(Sky.phase - 0.27) / 0.07), speed: p.speed, grinding: p.mode === 'grind', air: p.mode === 'air' && p.airTime > 0.25, airTime: p.airTime, grounded: p.mode === 'ground', listen: Game.listen, night: Sky.night, train: ground && ground.train ? 1 : 0, under: (W.metro && p.ground && p.ground.slab && isCovered(p.pos)) ? 1 : 0, water: Game.swim > 0 ? 1 : 0, spots: Game.spots || {}, crowd: Life.crowdNear });
    updateHints(dt);
  } else if (Game.state === 'title') {
    // a slow flight over the city
    // a slow glide high above the old town and the observatory, looking down the slope to the lake
    const a = Game.t * 0.025;
    G.camera.position.set(Math.sin(a) * 520 + 120, 230 + Math.sin(Game.t * 0.1) * 8, -1250 + Math.cos(a * 0.7) * 120);
    G.camera.lookAt(Math.sin(a) * 200, 20, 700);
  }
  if (Game.state !== 'paused') {
    for (const d of W.dyn) d.update(dt, bi);
    Life.update(dt, bi, Game.state === 'play' ? p.pos : G.camera.position); Fauna.update(dt, bi, Game.state === 'play' ? p.pos : G.camera.position);
    if (Game.state === 'play') { updateWorld(dt, bi); updateGrindHint(dt, bi); }
    Game.fx.update(dt);
    Sky.update(dt, G.camera.position);
  }
  Game.cellT = (Game.cellT || 0) - dt;
  if (Game.cellT <= 0) { Game.cellT = 0.25; W.updateCells(G.camera.position.x, G.camera.position.z, Game.cellR || 360); }
  if (!Game.noRender) G.renderer.render(G.scene, G.camera);
  // adaptive resolution
  Game.dprAcc += dt; Game.dprN++;
  if (Game.dprN >= 90) {
    const avg = Game.dprAcc / Game.dprN; Game.dprAcc = 0; Game.dprN = 0;
    // quality steps: sharpness first down to 1x, then how far the detailed city reaches, then a little blur
    const Q = [[G.dprMax, 360], [Math.min(G.dprMax, 1.25), 340], [1, 320], [1, 280], [1, 250], [0.85, 230]];
    Game.q = Game.q ?? 0;
    const q0 = Game.q;
    if (avg > 0.026 && Game.q < Q.length - 1) Game.q++;
    else if (avg < 0.0145 && Game.q > 0) Game.q--;
    if (Game.q !== q0) { const [d, R] = Q[Game.q]; Game.cellR = R; if (d !== G.dpr) { G.dpr = d; G.renderer.setPixelRatio(G.dpr); onResize(); } }
  }
}
function isCovered(pos) { const M = Game.W.metro; for (let i = 0; i < M.N; i += 4) { const q = M.pts[i]; if (q.covered && Math.hypot(q.x - pos.x, q.z - pos.z) < 8) return true; } return false; }

function start() { boot().catch(e => { console.error(e); const l = $('loading'); l.hidden = false; l.textContent = 'Something broke while building the city: ' + e.message; }); }
start();

// debug helper for tests: render a region from straight above
window.debugTopDown = (x0, z0, x1, z1, px = 1600) => {
  const cam = new THREE.OrthographicCamera(x0, x1, -z0, -z1, 1, 4000);
  cam.position.set(0, 1500, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  for (const g of Game.W.cells.values()) g.visible = true;
  const fog = G.scene.fog; G.scene.fog = null;
  const w = px, h = Math.round(px * (z1 - z0) / (x1 - x0));
  G.renderer.setPixelRatio(1); G.renderer.setSize(w, h, false);
  G.renderer.render(G.scene, cam);
  const url = G.renderer.domElement.toDataURL('image/png');
  G.scene.fog = fog; onResize();
  return url;
};
