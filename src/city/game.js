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

// ---------- hooks: the player's moves, answered softly by the music ----------
const hooks = {
  jump(q) { Sound.sfx.jump(q !== 'miss'); Game.usedJump = true; },
  push(q) { Sound.sfx.push(q !== 'miss'); },
  trick(q) {
    const b = Game.W.bell, p = Game.player.pos;
    if (b && Math.hypot(b.x - p.x, b.z - p.z) < 12 && Game.bellCD <= 0) { Sound.sfx.ringBell(); Game.bellCD = 20; }
    Sound.sfx.trick(); Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 1.2, 0)), 6, ['#f6f1e7', '#ffe9b0'], 3, 0.6, 3);
  },
  land(impact) {
    const p = Game.player, g = p.ground;
    if (g && g.tag === 'bounce' && impact > 2.5) {
      // a canvas awning: back up you go, a little higher each time you keep it going
      Game.bounceN = Game.t - (Game.bounceT || 0) < 2.5 ? (Game.bounceN || 0) + 1 : 0; Game.bounceT = Game.t;
      p.mode = 'air'; p.vel.y = U.clamp(impact * 0.82 + 2, 9, 15.5); p.pos.y += 0.05; p.airTime = 0; p.ground = null;
      Sound.sfx.touch('bounce', Game.bounceN);
      Game.fx.burst(V3().copy(p.pos).add(V3(0, 0.1, 0)), 5, ['#ffffff', '#ffd23f'], 2, 0.3, 3);
      return;
    }
    Sound.sfx.land(Math.min(1.4, impact / 18)); if (impact > 10) Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 0.1, 0)), 6, ['#ffffff', '#e9e4f5'], 2.5, 0.4, 4); if (impact > 24) Game.cam.shake = 0.4; },
  grindStart() { Sound.sfx.land(0.4); },
  grinding() {}, grindEnd() {}, railHop() { Sound.sfx.jump(true); },
  padLaunch() {},
  bonk() { Game.cam.shake = 0.25; Sound.sfx.land(0.6); },
  fell() { knockDown(null, true); },
  hazard(b) { knockDown(b); },
};

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
  Life.init(W);
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
    Sound.init(); Sound.start();
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
function pause(on) {
  if (on && Game.state === 'play') {
    Game.state = 'paused'; $('pause').hidden = false; Input.enabled = false; Sound.suspend(true); $('tod').value = Math.round(Sky.phase * 100);
    const d = PLAN.byKey[Sound.place], R = Sound.REC[Sound.place];
    $('where').textContent = d ? `${d.name} · ${Math.round(Sound.bpm / (R ? R.f : 1))} bpm` : '';
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

// ---------- the world reacting to you ----------
const _sq = [], _dw = {};
function updateWorld(dt, bi) {
  const W = Game.W, p = Game.player, pos = p.pos;
  // things that ring as you pass
  for (const s of W.soundGrid.query(pos.x - 2, pos.z - 2, pos.x + 2, pos.z + 2, _sq)) {
    s.cd -= dt;
    const d = Math.hypot(s.x - pos.x, s.z - pos.z);
    if (d < s.r && Math.abs(s.y - pos.y) < 4 && s.cd <= 0 && (p.speed > 2.5 || s.kind === 'fountain' || s.kind === 'pond')) {
      s.cd = s.kind === 'fountain' || s.kind === 'pond' ? 2.4 : 1.4;
      Sound.sfx.touch(s.kind === 'pond' ? 'chime' : s.kind, Game.touchN = (Game.touchN || 0) + 1);
    }
  }
  // hidden spots: proximity → a local change in the music
  const spots = {};
  for (const sp of W.spots) {
    const d = Math.hypot(sp.x - pos.x, sp.z - pos.z), dy = Math.abs(sp.y - pos.y);
    let w = U.clamp(1 - d / sp.r, 0, 1); if (dy > 6) w *= U.clamp(1 - (dy - 6) / 6, 0, 1);
    sp.w = U.damp(sp.w, U.smooth(w), 2, dt);
    if (sp.w > 0.01) spots[sp.key] = sp.w;
  }
  for (const k in spots) if (k.startsWith('busk_')) spots[k] *= 0.55 + Game.listen * 0.45;
  Game.spots = spots;
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
    Sound.setPlace(_dw, dt); Sky.S.weights = _dw;
    const ground = p.ground;
    Sound.update(dt, { speed: p.speed, grinding: p.mode === 'grind', air: p.mode === 'air' && p.airTime > 0.25, airTime: p.airTime, grounded: p.mode === 'ground', listen: Game.listen, night: Sky.night, train: ground && ground.train ? 1 : 0, under: (W.metro && p.ground && p.ground.slab && isCovered(p.pos)) ? 1 : 0, water: Game.swim > 0 ? 1 : 0, spots: Game.spots || {}, crowd: Life.crowdNear });
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
    Life.update(dt, bi, Game.state === 'play' ? p.pos : G.camera.position);
    if (Game.state === 'play') updateWorld(dt, bi);
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
