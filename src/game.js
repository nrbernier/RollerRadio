// ============================================================
//  GAME — state machine, HUD, scoring, triggers, main loop
// ============================================================
const $ = (id) => document.getElementById(id);
const Game = {
  state: 'boot', score: 0, combo: { pts: 0, mult: 1, idle: 0, best: 0 }, t: 0, playT: 0,
  hint: { i: 0, t: 0, shown: false }, firsts: {}, sus: 0, lastRelayT: 0, idleHintT: 0, outroPending: -1,
  freeRoam: false, dprAcc: 0, dprN: 0
};
const HINTS = [
  { touch: 'MOVE — drag the left side of the screen', key: 'MOVE — WASD or arrow keys. Q / E or drag to look around.', done: g => g.firsts.moved },
  { touch: 'JUMP — tap ⤒ exactly ON THE BEAT to jump higher', key: 'JUMP — SPACE. Jump ON THE BEAT to jump higher.', done: g => g.firsts.beatJump },
  { touch: 'TRICK on the ground = a PUSH. Hit it on the beat for a speed boost!', key: 'TRICK (K / SHIFT) on the ground = a PUSH. On the beat = speed boost!', done: g => g.firsts.beatPush },
  { touch: 'In the air or on a rail, TRICK does a trick. Watch the ring close in — that’s the beat.', key: 'In the air or on a rail, TRICK does a trick. Watch the ring — that’s the beat.', done: g => g.firsts.trick },
  { touch: 'Jump onto any rail or cable to GRIND. The music follows you.', key: 'Jump onto any rail or cable to GRIND. The music follows you.', done: g => g.firsts.grind },
  { touch: 'Find DJ Static’s 5 relays (the pale light beams). Secrets hide everywhere.', key: 'Find DJ Static’s 5 relays (the pale light beams). Secrets hide everywhere.', done: g => Game.hint.t > 7 },
];
const RELAY_LINES = [
  ['KEYS', 'Ohhh, there it is! Hear those keys? The Ministry calls that “unauthorized vibration.”'],
  ['PERCUSSION', 'Congas! Shakers! They banned percussion in ’09 for being “too knock-knock.”'],
  ['HORNS', 'HORNS! Real horns! Three down. And smile at the drones — they love that.'],
  ['LEAD MELODY', 'The hook is back! Man, I almost forgot how it went. One more, kid!'],
  ['EVERYTHING', 'That’s all of them…'],
];
const DRONE_LINES = ['LOITERING IS A PRIVILEGE.', 'HAVE YOU REPORTED A NEIGHBOR TODAY?', 'SMILE CHECK IN PROGRESS.', 'YOUR POSTURE HAS BEEN NOTED.', 'FUN DETECTED. ANALYZING…'];

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function pop(text, cls = '') {
  const box = $('pops');
  while (box.children.length > 3) box.firstChild.remove();
  const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text;
  d.style.setProperty('--r', (Math.random() * 8 - 4).toFixed(1) + 'deg');
  box.appendChild(d); setTimeout(() => d.remove(), 1150);
}
let toastTimer = 0;
function toast(html, cls = '', dur = 3.6) {
  const t = $('toast'); t.className = 'toast show ' + cls; t.innerHTML = html; toastTimer = dur;
}
let radioTimer = 0, radioTalk = 0;
function radio(text, who = 'DJ STATIC') {
  $('radio').hidden = false; $('radioWho').textContent = who; $('radioText').textContent = text;
  radioTimer = Math.max(4.5, text.length * 0.065); radioTalk = Math.min(3, text.length * 0.035);
  $('radio').classList.remove('in'); void $('radio').offsetWidth; $('radio').classList.add('in');
}

// ---------- combo / scoring ----------
function addStyle(points, perfect) {
  const c = Game.combo;
  c.pts += points * c.mult; c.idle = 0;
  if (perfect) c.mult = Math.min(9, c.mult + 1);
  c.best = Math.max(c.best, c.mult);
}
function bankCombo() {
  const c = Game.combo;
  if (c.pts > 0) { Game.score += c.pts; if (c.pts > 400) pop('+' + fmt(c.pts), 'bank'); }
  c.pts = 0; c.mult = 1; c.idle = 0;
}
function dropCombo(msg) { const c = Game.combo; if (c.pts > 0 && msg) pop(msg, 'bad'); c.pts = 0; c.mult = 1; }

function droneVibeCheck(q) {
  if (q === 'miss') return;
  for (const d of Game.W.drones) {
    if (d.inLight && d.vibe <= 0) {
      d.vibe = 7; d.dr.setMood('vibe'); Sound.sfx.drone('vibe'); pop('DRONE VIBING ♪', 'vibe');
      addStyle(400, true); Game.sus = Math.max(0, Game.sus - 0.6);
      if (!Game.firsts.vibe) { Game.firsts.vibe = true; radio('Ha! You made it dance. Drones can’t file reports while they’re grooving.'); }
    }
  }
}

const hooks = {
  jump(q, fromRail) {
    Sound.sfx.jump(q !== 'miss');
    if (q !== 'miss') { pop(q === 'perfect' ? 'PERFECT JUMP' : 'ON BEAT', q); addStyle(q === 'perfect' ? 120 : 60, q === 'perfect'); Game.firsts.beatJump = true; beatRing(); }
  },
  push(q) {
    Sound.sfx.push(q !== 'miss');
    if (q === 'miss') { pop('OFF BEAT', 'bad'); Game.combo.mult = 1; }
    else { pop(q === 'perfect' ? 'PERFECT PUSH' : 'BEAT PUSH', q); addStyle(q === 'perfect' ? 100 : 50, q === 'perfect'); Game.firsts.beatPush = true; Game.cam.fovKick = 5; beatRing(); }
    droneVibeCheck(q);
  },
  trick(q, name, kind) {
    if (q === 'miss') { Sound.sfx.offbeat(); pop('OFF BEAT…', 'bad'); Game.combo.mult = 1; addStyle(20, false); return; }
    Sound.sfx.perfect(Game.combo.mult);
    pop((q === 'perfect' ? '★ ' : '') + name, q);
    addStyle(q === 'perfect' ? 300 : 150, q === 'perfect');
    Game.firsts.trick = true; beatRing();
    Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 1.2, 0)), q === 'perfect' ? 18 : 8, ['#ff2e88', '#ffd23f', '#19d3ff'], 5, 0.6, 6);
    droneVibeCheck(q);
  },
  land(impact, airT, spinLeft) {
    Sound.sfx.land(Math.min(1.4, impact / 18));
    if (impact > 8) Game.fx.burst(V3().copy(Game.player.pos).add(V3(0, 0.1, 0)), 8, ['#ffffff', '#e9e4f5'], 3, 0.4, 4);
    if (spinLeft > 1.3) { pop('SKETCHY!', 'bad'); Game.combo.mult = 1; }
    else if (airT > 0.8) addStyle(Math.round(airT * 60), false);
    if (impact > 22) Game.cam.shake = 0.6;
  },
  grindStart() { Game.firsts.grind = true; Game.combo.idle = 0; Sound.sfx.land(0.5); },
  grinding(dt, gs) { addStyle(dt * (40 + gs * 3), false); },
  grindEnd() {},
  padLaunch(pad, ok, q) {
    Sound.sfx.bounce(ok);
    if (ok) { pop(q === 'perfect' ? '★ BEAT LAUNCH!' : 'BEAT LAUNCH!', 'perfect'); addStyle(250, true); Game.cam.shake = 0.5; Game.fx.burst(V3().copy(pad.pos).add(V3(0, 0.6, 0)), 24, ['#ff2e88', '#ffd23f', '#19d3ff', '#ffffff'], 7, 0.8, 5); }
    else { pop('OFF BEAT — tap JUMP on the beat!', 'bad'); }
  },
  fell() {
    if (Game.state !== 'play') return;
    dropCombo('COMBO DROPPED');
    Game.player.respawn(false); Game.cam.snap(Game.player);
    Sound.sfx.drone('chime'); flash('#8ff0c8');
    toast('<b>SAFETY NET DEPLOYED</b><span>Gravity is a privilege. Privilege restored. Smile!</span>', 'ministry');
  },
  bonk() { Game.cam.shake = 0.35; Sound.sfx.land(0.8); }
};
function beatRing() { const r = $('beatring'); r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); }

// ---------- boot ----------
async function boot(data = {}) {
  try { await Promise.race([Promise.all([document.fonts.load(`40px "Dela Gothic One"`), document.fonts.load(`20px "DotGothic16"`), document.fonts.load(`20px "M PLUS Rounded 1c"`)]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  initRenderer();
  Input.init();
  const W = buildWorld1();
  G.scene.add(W.group);
  Game.W = W;
  const juno = makeJuno(), bolt = makeBolt();
  const csDrone = new Drone(droneFaces());
  G.scene.add(juno.root, juno.shadow, bolt.root, bolt.shadow, csDrone.root);
  Game.cast = { juno, bolt, drone: csDrone };
  Game.fx = new Particles(G.scene);
  Game.player = new Player(W, juno, Game.fx, hooks);
  Game.cam = new CamRig(G.camera, W);
  // title tableau
  juno.root.position.set(6, 0, -11.65); juno.root.rotation.y = Math.PI; juno._pose = 'sit';
  bolt.root.position.set(2.6, 0, -9); bolt.root.rotation.y = 2.3; bolt._pose = 'armsCross';
  csDrone.root.position.set(14, 6, -16);
  // restore progress after a live update
  if (data.relays) Game.restore = data;
  bindUI();
  Game.state = 'title';
  $('loading').hidden = true; $('title').hidden = false;
  try { if (localStorage.getItem('offbeat.introSeen')) $('btnSkipIntro').hidden = false; } catch (e) {}
  if (Game.restore && Game.restore.state === 'play') { $('btnContinue').hidden = false; }
  Game.last = performance.now();
  requestAnimationFrame(loop);
  window.claude?.hot?.snapshot?.(() => ({ state: Game.state === 'play' ? 'play' : 'title', relays: W.relays.filter(r => r.active).map(r => r.id), tapes: W.tapes.filter(t => t.got).map(t => t.id), score: Game.score, pos: Game.player.pos.toArray(), yaw: Game.player.yaw }));
}

function bindUI() {
  const start = (skip) => {
    Sound.init(); Sound.sfx.click();
    $('title').hidden = true;
    if (skip) startPlay(true); else startIntro();
  };
  $('btnPlay').onclick = () => start(false);
  $('btnSkipIntro').onclick = () => start(true);
  $('btnContinue').onclick = () => { applyRestore(Game.restore); start(true); };
  $('csLayer').addEventListener('pointerdown', (e) => { if (e.target.id === 'skipBtn') return; Game.cs && Game.cs.advance(); });
  $('skipBtn').addEventListener('pointerdown', (e) => { e.stopPropagation(); Game.cs && Game.cs.skip(); });
  window.addEventListener('keydown', (e) => {
    if ((Game.state === 'intro' || Game.state === 'outro') && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); Game.cs && Game.cs.advance(); }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (Game.state === 'play') pause(true); else if (Game.state === 'paused') pause(false); }
  });
  $('btnPause').onclick = () => pause(true);
  $('btnResume').onclick = () => pause(false);
  $('btnRestart').onclick = () => { pause(false); resetWorld(); startPlay(true); };
  $('btnReplayIntro').onclick = () => { pause(false); resetWorld(); startIntro(); };
  $('vol').oninput = (e) => Sound.setVolume(+e.target.value / 100, null);
  $('btnKeep').onclick = () => { $('end').hidden = true; Game.freeRoam = true; startPlay(true, true); };
  $('btnAgain').onclick = () => { $('end').hidden = true; resetWorld(); startIntro(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.state === 'play') pause(true); });
  if (U.isTouch) document.body.classList.add('touch');
}

function applyRestore(d) {
  if (!d) return;
  for (const r of Game.W.relays) if (d.relays.includes(r.id)) activateRelay(r, true);
  for (const t of Game.W.tapes) if (d.tapes.includes(t.id)) { t.got = true; t.g.visible = false; }
  Game.score = d.score || 0;
  if (d.pos) { Game.player.pos.fromArray(d.pos); Game.player.yaw = d.yaw || 0; Game.player.lastSafe.copy(Game.player.pos); }
  Game.restored = true;
}
function resetWorld() {
  const W = Game.W;
  for (const r of W.relays) { r.active = false; }
  for (const t of W.tapes) { t.got = false; t.g.visible = true; }
  Game.score = 0; Game.combo = { pts: 0, mult: 1, idle: 0, best: 0 }; Game.freeRoam = false; Game.outroPending = -1; Game.playT = 0;
  Sound.R.unlocks = 0; Game.firsts = {}; Game.hint = { i: 0, t: 0, shown: false };
  const p = Game.player; p.pos.copy(W.spawn); p.vel.set(0, 0, 0); p.yaw = W.spawnYaw; p.lastSafe.copy(W.spawn); p.setCheckpoint(W.spawn, W.spawnYaw);
}

function startIntro() {
  Game.state = 'intro';
  $('hud').hidden = true; Input.enabled = false; Input.flush();
  const { juno, bolt, drone } = Game.cast;
  bolt.root.visible = true; drone.root.visible = true; juno.root.visible = true;
  juno.spin.rotation.set(0, 0, 0);
  $('csLayer').hidden = false;
  Game.cs = new Cutscene(introShots(), Game.cast, Game.W, { onEnd: () => { try { localStorage.setItem('offbeat.introSeen', '1'); } catch (e) {} startPlay(false); } });
  Game.cs.start();
}

function startPlay(skipped, keepState) {
  const { juno, bolt, drone } = Game.cast;
  $('csLayer').hidden = true; $('dlg').hidden = true; Game.cs = null;
  drone.root.visible = false;
  bolt.root.visible = true; bolt.root.position.set(3.8, 0, -6.2); bolt.root.rotation.y = 2.2; bolt._pose = 'wave'; bolt.setMood('neutral'); juno.setMood('neutral');
  const p = Game.player;
  if (!keepState && !Game.restored) {
    if (!skipped) { p.pos.set(6.2, 0, -10.4); p.yaw = Math.PI / 2; }
    else { p.pos.copy(Game.W.spawn); p.yaw = Game.W.spawnYaw; }
    p.vel.set(0, 0, 0); p.mode = 'ground'; p.lastSafe.copy(p.pos); p.setCheckpoint(p.pos, p.yaw);
  }
  Game.restored = false;
  Game.state = 'play'; Input.enabled = true; Input.flush();
  $('hud').hidden = false;
  if (Sound.song !== 'roof') Sound.play('roof');
  Sound.R.unlocks = Game.W.relaysOn();
  Game.cam.snap(p); Game.cam.yaw = p.yaw;
  Game.lastRelayT = Game.playT;
  if (!keepState) titleCard('WORLD 1', Game.W.name);
  updateCounters();
}
function titleCard(a, b) {
  const c = $('card'); c.hidden = false; $('cardA').textContent = a; $('cardB').textContent = b;
  c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
  setTimeout(() => { c.hidden = true; }, 3200);
}
function pause(on) {
  if (on && Game.state === 'play') { Game.state = 'paused'; $('pause').hidden = false; Input.enabled = false; Sound.suspend(true); $('vol').value = Math.round(Sound.vol * 100); }
  else if (!on && Game.state === 'paused') { Game.state = 'play'; $('pause').hidden = true; Input.enabled = true; Input.flush(); Sound.suspend(false); Game.last = performance.now(); }
}

function activateRelay(r, silent = false) {
  if (r.active) return;
  r.active = true;
  const n = Game.W.relaysOn();
  Sound.R.unlocks = n;
  r.beam.material.color.set(0xff2e88); r.beam.material.opacity = 0.35;
  if (silent) return;
  Sound.sfx.relay();
  Game.fx.burst(V3().copy(r.pos).add(V3(0, 3.5, 0)), 40, ['#ff2e88', '#ffd23f', '#19d3ff', '#c6ff3d', '#ffffff'], 9, 1.2, 6);
  flash('#ffd23f');
  Game.player.setCheckpoint(V3().copy(r.pos).add(V3(1.8, 0, 1.8)), Game.player.yaw);
  addStyle(1000, true);
  const [inst, line] = RELAY_LINES[n - 1];
  toast(`<b>RELAY ${n}/5 ONLINE</b><span>${n < 5 ? 'UNLOCKED: ' + inst : 'THE WHOLE CITY CAN HEAR IT'}</span>`, 'relay');
  if (n < 5) setTimeout(() => radio(line), 1300);
  Game.lastRelayT = Game.playT;
  if (n === 5 && !Game.freeRoam) Game.outroPending = 2.6;
  updateCounters();
}
function collectTape(t) {
  t.got = true; t.g.visible = false;
  Sound.sfx.tape(); addStyle(500, true);
  Game.fx.burst(t.pos.clone(), 26, ['#ffd23f', '#fff6c8', '#ff7a2f'], 6, 0.9, 5);
  toast(`<b>GOLDEN TAPE ${Game.W.tapesGot()}/5</b><span>${t.text}</span>`, 'tape', 6.5);
  if (t.id === 4) setTimeout(() => radio('Uh. Where’d you find THAT? That’s a… remix. Satire! Very edgy satire. Moving on.'), 6000);
  if (t.id === 3) setTimeout(() => radio('Ministry memos? Pfft. They write those to confuse us. Don’t overthink it.'), 6000);
  updateCounters();
}
function updateCounters() {
  const n = Game.W.relaysOn();
  [...$('relayIcons').children].forEach((el, i) => el.classList.toggle('on', i < n));
  $('relayN').textContent = `${n}/5`;
  $('tapeN').textContent = `${Game.W.tapesGot()}/5`;
}

function startOutro() {
  Game.state = 'outro'; Input.enabled = false; Input.flush();
  $('hud').hidden = true;
  const p = Game.player, { juno, drone } = Game.cast;
  p.vel.set(0, 0, 0); p.mode = 'ground'; juno.spin.rotation.set(0, 0, 0);
  // nearest relay = the one just activated
  let R = Game.W.relays[0].pos, bd = 1e9;
  for (const r of Game.W.relays) { const d = r.pos.distanceTo(p.pos); if (d < bd) { bd = d; R = r.pos; } }
  drone.root.visible = true; drone.setMood('proud');
  $('csLayer').hidden = false;
  Game.cs = new Cutscene(outroShots(R, p.pos), Game.cast, Game.W, {
    onEnd: showEnd,
    onShot: (s) => { if (s.onEnter === 'wink') Game.W.tower.winkT = 0; }
  });
  Game.cs.start();
}
function showEnd() {
  Game.state = 'end'; $('csLayer').hidden = true; $('dlg').hidden = true;
  Sound.play('roof');
  const mins = Math.floor(Game.playT / 60), secs = Math.floor(Game.playT % 60);
  bankCombo();
  $('endStats').innerHTML = `
    <div><dt>RELAYS</dt><dd>5/5</dd></div>
    <div><dt>GOLDEN TAPES</dt><dd>${Game.W.tapesGot()}/5</dd></div>
    <div><dt>BEST MULTIPLIER</dt><dd>×${Game.combo.best}</dd></div>
    <div><dt>STYLE</dt><dd>${fmt(Game.score)}</dd></div>
    <div><dt>TIME</dt><dd>${mins}:${String(secs).padStart(2, '0')}</dd></div>`;
  $('end').hidden = false;
}

// ---------- per-frame world logic ----------
function updateWorld(dt, bi) {
  const W = Game.W, p = Game.player;
  const kick = Math.exp(-bi.phase * 7);
  // relays
  for (const r of W.relays) {
    r.t += dt;
    if (r.active) {
      r.dishG.rotation.y += dt * 1.6;
      r.bulb.material.color.setHSL((r.t * 0.4) % 1, 1, 0.6);
      r.beam.material.color.set(bi.inBar % 2 ? 0xff2e88 : 0xffd23f);
      r.beam.material.opacity = 0.18 + kick * 0.25;
      r.beam.scale.set(1 + kick * 0.5, 1, 1 + kick * 0.5);
      r.cone.scale.setScalar(1 + kick * 0.25);
      r.rings.forEach((ring, i) => { const ph = (bi.phase + i * 0.5) % 1; ring.scale.setScalar(1 + ph * 4); ring.material.opacity = (1 - ph) * 0.8; });
    } else {
      r.dishG.rotation.y = Math.sin(r.t * 0.7) * 0.4;
      r.bulb.material.color.set(bi.phase < 0.2 ? 0xff2244 : 0x441018);
      r.beam.material.color.set(0xbfe9ff);
      r.beam.material.opacity = 0.1 + (Math.random() < 0.06 ? 0 : 0.08) + Math.sin(r.t * 3) * 0.03;
      r.rings.forEach(ring => ring.material.opacity = 0);
      if (Game.state === 'play' && Math.hypot(p.pos.x - r.pos.x, p.pos.z - r.pos.z) < 1.9 && Math.abs(p.pos.y - r.pos.y) < 2.6) activateRelay(r);
    }
  }
  // tapes
  for (const t of W.tapes) {
    if (t.got) continue;
    t.t += dt; t.g.rotation.y += dt * 2.2; t.body.position.y = Math.sin(t.t * 2) * 0.12;
    t.glow.scale.setScalar(1 + kick * 0.3);
    if (Game.state === 'play' && p.pos.distanceTo(t.pos) < 1.45 || (Game.state === 'play' && V3(p.pos.x, p.pos.y + 0.9, p.pos.z).distanceTo(t.pos) < 1.3)) collectTape(t);
  }
  // pads
  for (const pd of W.pads) {
    pd.cone.scale.set(1, 1 + kick * 1.6, 1); pd.cap.position.y = 0.25 + kick * 0.18;
    const s = 1 + (1 - bi.phase) * 0.9; pd.ring.scale.setScalar(s);
    pd.ring.material.opacity = 0.35 + bi.phase * 0.65;
    pd.ring.material.color.set(bi.phase > 0.75 || bi.phase < 0.12 ? 0xffd23f : 0xff2e88);
  }
  // drones
  let inAny = false;
  for (const d of W.drones) {
    d.dr.update(dt);
    d.s = (d.s + d.speed * dt) % d.L;
    let seg = d.segs[0]; for (const sg of d.segs) if (d.s >= sg.s0 && d.s < sg.s0 + sg.len) seg = sg;
    const pos = V3().copy(seg.a).lerp(seg.b, (d.s - seg.s0) / seg.len);
    d.dr.root.position.copy(pos);
    const g = W.groundAt(pos.x, pos.z, pos.y - 1.2, 0).y;
    d.ground = g;
    const rad = d.radius * (1 + kick * 0.18);
    d.spot.position.set(pos.x, g + 0.05, pos.z); d.spot.scale.setScalar(rad / d.radius);
    d.cone.scale.set(rad / d.radius, (pos.y - g) / 4, rad / d.radius); d.cone.position.y = -(pos.y - g) / 2;
    const dx = p.pos.x - pos.x, dz = p.pos.z - pos.z, dist = Math.hypot(dx, dz);
    d.inLight = Game.state === 'play' && dist < rad && p.pos.y > g - 1 && p.pos.y < g + 3.5;
    if (d.vibe > 0) {
      d.vibe -= dt; d.spot.material.color.set(0xff8fc8); d.cone.material.color.set(0xff8fc8);
      d.dr.root.rotation.y += dt * 4;
      if (d.vibe <= 0) d.dr.setMood('happy');
    } else {
      const faceYaw = dist < 14 ? Math.atan2(dx, dz) : Math.atan2(seg.b.x - seg.a.x, seg.b.z - seg.a.z);
      d.dr.root.rotation.y = U.angDamp(d.dr.root.rotation.y, faceYaw, 4, dt);
      if (d.inLight) {
        inAny = true;
        d.dr.setMood(Game.sus > 0.55 ? 'alert' : 'sus');
        d.spot.material.color.set(0xff6b7a); d.cone.material.color.set(0xff6b7a);
        d.talkT -= dt;
        if (d.talkT <= 0) { d.talkT = 6; Sound.sfx.drone('alert'); if (!Game.firsts.spotted) { Game.firsts.spotted = true; radio('Spotted! Do an ON-BEAT trick (or push) in the light — drones can’t resist a groove.'); } else pop(DRONE_LINES[Math.floor(Math.random() * DRONE_LINES.length)], 'ministry'); }
      } else {
        d.dr.setMood('happy'); d.talkT = Math.min(d.talkT, 0.5);
        d.spot.material.color.set(0xbff4ff); d.cone.material.color.set(0xbff4ff);
      }
    }
  }
  if (Game.state === 'play') {
    Game.sus = inAny ? Math.min(1, Game.sus + dt * 0.5) : Math.max(0, Game.sus - dt * 0.35);
    if (Game.sus >= 1) {
      Game.sus = 0; dropCombo('COMBO CONFISCATED');
      p.respawn(true); Game.cam.snap(p); flash('#8ff0c8'); Sound.sfx.drone('chime');
      toast('<b>RE-EDUCATION COMPLETE</b><span>You have been returned to an approved location. Have a compliant evening!</span>', 'ministry', 4.5);
    }
  }
  // Smile Tower watches
  const T = W.tower;
  if (T) {
    T.t += dt;
    const hp = V3(); T.head.getWorldPosition(hp);
    const tgt = Game.state === 'title' ? G.camera.position : p.pos;
    T.head.rotation.y = U.angDamp(T.head.rotation.y, Math.atan2(tgt.x - hp.x, tgt.z - hp.z), 1.5, dt);
    T.acc = (T.acc || 0) + dt;
    if (T.winkT !== undefined) { T.winkT += dt; T.wink = T.winkT < 1.6 ? 0 : T.winkT < 2.0 ? (T.winkT - 1.6) / 0.4 : T.winkT < 2.5 ? 1 : Math.max(0, 1 - (T.winkT - 2.5) / 0.3); if (T.winkT > 3) T.winkT = undefined; }
    if (T.acc > 0.1) { T.acc = 0; const look = [Math.sin(T.t * 0.5) * 0.3, U.clamp((tgt.y - hp.y) / 300, -1, 1) * -0.8 + 0.4]; T.faceC.redraw(look, T.wink || 0, kick); }
  }
  W.sky.material.uniforms.uT.value += dt;
}

// ---------- HUD per frame ----------
function updateHUD(dt, bi) {
  const c = Game.combo;
  const cb = $('combo');
  if (c.pts > 0) { cb.hidden = false; $('comboMult').textContent = '×' + c.mult; $('comboPts').textContent = fmt(c.pts); cb.classList.toggle('hot', c.mult >= 5); }
  else cb.hidden = true;
  $('score').textContent = fmt(Game.score);
  // beat ring on trick button + dots
  const s = 1 + (1 - bi.phase) * 0.85;
  const ring = $('trickRing'); ring.style.transform = `scale(${s.toFixed(3)})`; ring.style.opacity = (0.25 + bi.phase * 0.75).toFixed(2);
  const ring2 = $('jumpRing'); ring2.style.transform = `scale(${s.toFixed(3)})`; ring2.style.opacity = (0.15 + bi.phase * 0.6).toFixed(2);
  const onb = bi.phase < 0.12 || bi.phase > 0.9;
  $('btnTrick').classList.toggle('beat', onb); $('btnJump').classList.toggle('beat', onb);
  const dots = $('beatdots').children;
  for (let i = 0; i < 4; i++) dots[i].classList.toggle('on', i === bi.inBar && bi.phase < 0.5);
  $('deskRing').style.transform = `scale(${s.toFixed(3)})`;
  $('vignette').style.opacity = (bi.inBar === 0 ? 1 : 0.45) * Math.exp(-bi.phase * 6) * (0.3 + Game.W.relaysOn() * 0.1);
  // suspicion
  const sus = $('sus'); sus.hidden = Game.sus < 0.02; $('susFill').style.width = (Game.sus * 100).toFixed(0) + '%';
  // toast / radio timers
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').className = 'toast'; }
  if (radioTimer > 0) {
    radioTimer -= dt; radioTalk -= dt;
    Game.radioAcc = (Game.radioAcc || 0) + dt;
    if (Game.radioAcc > 1 / 12) { Game.radioAcc = 0; const cx = $('radioFace').getContext('2d'); drawDJ(cx, 160, 120, performance.now() / 1000, { talking: radioTalk > 0, mini: true }); }
    if (radioTimer <= 0) $('radio').hidden = true;
  }
  // tutorial hints
  const H = Game.hint;
  if (H.i < HINTS.length) {
    H.t += dt;
    const h = HINTS[H.i];
    if (!H.shown && H.t > (H.i === 0 ? 3.2 : 0.8)) { H.shown = true; $('hint').textContent = U.isTouch ? h.touch : h.key; $('hint').classList.add('show'); H.t = 0; }
    if (H.shown && (h.done(Game) || H.t > 11)) { $('hint').classList.remove('show'); H.i++; H.shown = false; H.t = 0; }
  }
}

// ---------- main loop ----------
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - Game.last) / 1000; Game.last = now;
  if (dt > 0.1) dt = 0.1; if (dt <= 0) dt = 0.001;
  Game.t += dt;
  const bi = Sound.beat();
  const p = Game.player;
  if (Game.state === 'play') {
    Game.playT += dt;
    Input.poll();
    if (Math.abs(Input.move.x) + Math.abs(Input.move.y) > 0.2) Game.firsts.moved = true;
    p.update(dt, Game.cam.yaw, now);
    Game.cam.update(dt, p);
    p.syncRig(dt, bi.phase);
    // combo banking: settle after a calm moment on the ground
    const c = Game.combo;
    if (p.mode === 'ground') { c.idle += dt; if (c.idle > 2.2) bankCombo(); } else c.idle = 0;
    // DJ nudges if stuck
    Game.idleHintT += dt;
    if (Game.playT - Game.lastRelayT > 80 && Game.idleHintT > 80) {
      Game.idleHintT = 0;
      let best = null, bd = 1e9; for (const r of Game.W.relays) if (!r.active) { const d = r.pos.distanceTo(p.pos); if (d < bd) { bd = d; best = r; } }
      if (best) radio(best.hint);
    }
    if (Game.outroPending > 0) { Game.outroPending -= dt; if (Game.outroPending <= 0) { Game.outroPending = -1; bankCombo(); startOutro(); } }
    Sound.update(dt, { speed: p.speed, grinding: p.mode === 'grind', air: p.mode === 'air' && p.airTime > 0.25, airTime: p.airTime, combo: Game.combo.mult - 1, hype: Game.combo.mult >= 4 ? 1 : 0, grounded: p.mode === 'ground', muffle: 0 });
    { const bo = Game.cast.bolt, near = Math.hypot(p.pos.x - bo.root.position.x, p.pos.z - bo.root.position.z) < 7; if (near) bo.root.rotation.y = U.angDamp(bo.root.rotation.y, Math.atan2(p.pos.x - bo.root.position.x, p.pos.z - bo.root.position.z), 3, dt); bo.update(dt, bo.poseTarget(near ? 'wave' : 'armsCross'), { rock: 0.03 }); }
    updateHUD(dt, bi);
  } else if (Game.state === 'intro' || Game.state === 'outro') {
    Game.cs && Game.cs.update(dt);
    Sound.update(dt, { speed: 16, grinding: false, air: false, airTime: 0, grounded: false, combo: 0, hype: 0 });
  } else if (Game.state === 'title' || Game.state === 'end') {
    const a = Game.t * 0.05;
    G.camera.position.set(4 + Math.cos(a) * 34, 15 + Math.sin(Game.t * 0.2) * 2, -6 + Math.sin(a) * 34);
    G.camera.lookAt(4, 3, -14);
    const { juno, bolt, drone } = Game.cast;
    if (Game.state === 'title') { juno.update(dt, juno.poseTarget('sit'), { rock: 0.03 }); bolt.update(dt, bolt.poseTarget('armsCross'), { rock: 0.03 }); drone.update(dt); drone.root.position.y = 6 + Math.sin(Game.t) * 0.3; }
    if (Game.state === 'end') { Sound.update(dt, { speed: 16, grinding: false, air: false, airTime: 0, grounded: false, combo: 0, hype: 0 }); }
  }
  if (Game.state !== 'paused') {
    for (const d of Game.W.dyn) d.update(dt, bi);
    updateWorld(dt, bi);
    Game.fx.update(dt);
  }
  // keep the shadow + rig in sync while cutscene drives the player rig
  G.renderer.render(G.scene, G.camera);
  // adaptive resolution
  Game.dprAcc += dt; Game.dprN++;
  if (Game.dprN >= 90) {
    const avg = Game.dprAcc / Game.dprN; Game.dprAcc = 0; Game.dprN = 0;
    if (avg > 0.024 && G.dpr > 1) { G.dpr = Math.max(1, G.dpr - 0.25); G.renderer.setPixelRatio(G.dpr); onResize(); }
    else if (avg < 0.0135 && G.dpr < G.dprMax) { G.dpr = Math.min(G.dprMax, G.dpr + 0.25); G.renderer.setPixelRatio(G.dpr); onResize(); }
  }
}

function start(data) { boot(data || {}).catch(e => { console.error(e); const l = $('loading'); l.hidden = false; l.textContent = 'Something broke while loading: ' + e.message; }); }
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
