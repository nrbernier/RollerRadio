// ============================================================
//  CUTSCENES — click to advance; camera & actors move between
//  lines, then hold still (gentle rocking) while you read.
// ============================================================
const SPEAKERS = {
  JUNO: { cls: 'juno', pitch: 720, actor: 'juno' },
  BOLT: { cls: 'bolt', pitch: 430, actor: 'bolt' },
  'BOLT · RADIO': { cls: 'bolt radio', pitch: 430 },
  'DJ STATIC': { cls: 'dj', pitch: 300, screen: true },
  'DJ STATIC · RADIO': { cls: 'dj radio', pitch: 300 },
  'MINISTER GLEE': { cls: 'ministry', pitch: 520, screen: true },
  'SMILE DRONE': { cls: 'drone', pitch: 980, actor: 'drone' },
  SCREEN: { cls: 'screen', pitch: 160 },
  '': { cls: 'narr', pitch: 600 }
};

class Cutscene {
  constructor(shots, cast, world, { onEnd, onShot } = {}) {
    this.shots = shots; this.cast = cast; this.W = world; this.onEnd = onEnd; this.onShot = onShot;
    this.i = -1; this.phase = 'idle'; this.t = 0; this.typed = 0; this.done = false;
    this.camFrom = V3(); this.camTo = V3(); this.lookFrom = V3(); this.lookTo = V3(); this.look = V3();
    this.actorFrom = {};
    this.dlg = document.getElementById('dlg'); this.who = document.getElementById('dlgWho'); this.txt = document.getElementById('dlgText');
  }
  start() {
    const cam = G.camera;
    this.look.copy(cam.position).add(cam.getWorldDirection(V3()).multiplyScalar(10));
    this.next(true);
  }
  actorState(name) {
    const a = this.cast[name]; return { pos: a.root.position.clone(), yaw: a.root.rotation.y };
  }
  next(first = false) {
    this.i++;
    if (this.i >= this.shots.length) return this.finish();
    const s = this.shots[this.i];
    this.phase = 'move'; this.t = 0; this.dur = first && s.cut ? 0 : (s.move ?? 1.15);
    if (s.cut) this.dur = 0;
    this.camFrom.copy(G.camera.position); this.lookFrom.copy(this.look);
    this.camTo.set(...s.cam); this.lookTo.set(...s.look);
    this.actorFrom = {};
    for (const n in (s.actors || {})) this.actorFrom[n] = this.actorState(n);
    this.hideBox();
    // side effects at the start of the transition
    if (s.music) { if (s.music === 'stop') Sound.stop(); else if (Sound.song !== s.music) Sound.play(s.music); }
    if (s.sfx) [].concat(s.sfx).forEach(k => Sound.sfx[k] && Sound.sfx[k]());
    if (s.screen) Object.assign(this.W.screen.st, { talking: false, wink: false }, s.screen);
    if (s.flash) flash(s.flash);
    for (const n in (s.actors || {})) {
      const a = s.actors[n], A = this.cast[n];
      if (a.visible !== undefined) A.root.visible = a.visible;
      if (A.setMood && a.mood) A.setMood(a.mood);
      A._pose = a.pose || A._pose || 'stand';
      A._skate = !!a.skate;
    }
    this.onShot && this.onShot(s, this.i);
  }
  showBox() {
    const s = this.shots[this.i];
    if (!s.text) { this.phase = 'read'; this.typed = 1e9; return; }
    const sp = SPEAKERS[s.who || ''] || SPEAKERS[''];
    this.dlg.className = 'dlg show ' + sp.cls;
    this.dlg.hidden = false;
    this.who.textContent = s.who || '';
    this.who.parentElement.hidden = !s.who;
    this.full = s.text; this.typed = 0; this.txt.textContent = '';
    this.phase = 'type'; this.blipAcc = 0;
    this.pitch = sp.pitch;
    this.speaker = sp;
  }
  hideBox() { this.dlg.className = 'dlg'; this.setTalking(false); }
  setTalking(on) {
    for (const n in this.cast) if ('talking' in this.cast[n]) this.cast[n].talking = false;
    this.W.screen.st.talking = false;
    if (!on || !this.speaker) return;
    if (this.speaker.actor && this.cast[this.speaker.actor]) this.cast[this.speaker.actor].talking = true;
    if (this.speaker.screen) this.W.screen.st.talking = true;
  }
  advance() {
    if (this.done) return;
    if (this.phase === 'move') { this.t = this.dur; return; }
    if (this.phase === 'type') { this.typed = this.full.length; this.txt.textContent = this.full; this.phase = 'read'; this.setTalking(false); return; }
    if (this.phase === 'read') { Sound.sfx.click(); this.next(); }
  }
  skip() { if (this.done) return; this.i = this.shots.length - 1; this.phase = 'read'; this.next(); }
  finish() { this.done = true; this.hideBox(); this.dlg.hidden = true; this.onEnd && this.onEnd(); }
  update(dt) {
    if (this.done || this.i < 0) return;
    const s = this.shots[this.i];
    const cam = G.camera;
    if (this.phase === 'move') {
      this.t += dt;
      const k = this.dur > 0 ? U.ease(U.clamp(this.t / this.dur, 0, 1)) : 1;
      cam.position.lerpVectors(this.camFrom, this.camTo, k);
      this.look.lerpVectors(this.lookFrom, this.lookTo, k);
      for (const n in (s.actors || {})) {
        const a = s.actors[n], A = this.cast[n], f = this.actorFrom[n];
        if (a.pos) A.root.position.lerpVectors(f.pos, _cs.set(...a.pos), k);
        if (a.yaw !== undefined) A.root.rotation.y = f.yaw + U.wrapAng(a.yaw - f.yaw) * k;
      }
      if (k >= 1) this.showBox();
    } else {
      // reading: mostly static, the faintest breathing on camera
      const tt = performance.now() / 1000;
      cam.position.set(this.camTo.x + Math.sin(tt * 0.5) * 0.02, this.camTo.y + Math.sin(tt * 0.7) * 0.015, this.camTo.z);
      this.look.copy(this.lookTo);
      if (this.phase === 'type') {
        const before = Math.floor(this.typed);
        this.typed = Math.min(this.full.length, this.typed + dt * (s.speed || 42));
        const n = Math.floor(this.typed);
        if (n !== before) {
          this.txt.textContent = this.full.slice(0, n);
          this.blipAcc += n - before;
          if (this.blipAcc >= 2) { this.blipAcc = 0; const ch = this.full[n - 1]; if (ch && ch !== ' ') Sound.sfx.blip(this.pitch); }
        }
        this.setTalking(n < this.full.length);
        if (n >= this.full.length) { this.phase = 'read'; this.setTalking(false); }
      }
    }
    cam.up.set(0, 1, 0);
    cam.lookAt(this.look);
    if (s.roll) cam.rotateZ(s.roll);
    // actors
    const moving = this.phase === 'move';
    for (const n in this.cast) {
      const A = this.cast[n];
      if (!A.root.visible) continue;
      if (A instanceof Rig) {
        let tgt;
        if (A._skate && moving) { A.stride += dt * 3.2; tgt = A.skateTarget({ mode: 'ground', speed: 9, beatPhase: 0 }, dt); }
        else tgt = A.poseTarget(A._pose || 'stand');
        A.update(dt, tgt, { rock: moving ? 0 : 0.035 });
        if (A.shadow) { const g = this.W.groundAt(A.root.position.x, A.root.position.z, A.root.position.y + 0.3, 0); A.shadow.visible = g.y > -1e8; A.shadow.position.set(A.root.position.x, g.y + 0.03, A.root.position.z); A.shadow.scale.setScalar(1); }
      } else if (A.update) A.update(dt);
    }
  }
}
const _cs = V3();

function flash(color = '#fff') {
  const f = document.getElementById('flash');
  f.style.background = color; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}

// ---------------- INTRO ----------------
// Shots are placed relative to the world's anchor (where Juno sits, A) and its giant screen (S),
// so the same scene can play in any world.
function introShots(W) {
  const A = W.intro.A, sitY = W.intro.sitY, S = W.screen.pos;
  const a = (x, y, z) => [A.x + x, A.y + y, A.z + z];
  const sc = (x, y, z) => [S.x + x, S.y + y, S.z + z];
  const r0 = W.relays[0].pos;
  const toRelay = Math.atan2(r0.x - (A.x + 0.2), r0.z - (A.z + 1.25));
  return [
    { cut: true, cam: W.intro.wide.cam, look: W.intro.wide.look, music: 'anthem', screen: { mode: 'minister', caption: 'GOOD MORNING, GLEAM CITY!' },
      actors: { juno: { pos: a(0, sitY, 0), yaw: Math.PI, pose: 'sit', mood: 'neutral', visible: true }, bolt: { pos: a(-3.4, 0, 2.65), yaw: 2.3, pose: 'armsCross', mood: 'neutral', visible: true }, drone: { pos: a(34, 14, 42), visible: true, mood: 'happy' } },
      who: 'MINISTER GLEE', text: 'Good morning, Gleam City! Today’s mood: DELIGHTED. Tomorrow’s mood: also delighted. It’s mandatory!' },
    { cam: sc(3, -5, 25.35), look: sc(0, -0.3, 0.35), move: 2.2, screen: { mode: 'minister', caption: 'DECREE 88 IS IN EFFECT' },
      who: 'MINISTER GLEE', text: 'A friendly reminder: under Decree 88, music faster than a resting heartbeat is illegal. Fast music causes running. Running causes thinking.' },
    { cam: a(2.2, 1.7 + sitY, 3.25), look: sc(0, -7.5, 9.35), move: 1.6, actors: { juno: { pose: 'sit', mood: 'smug' } },
      who: 'JUNO', text: 'Sixty beats per minute. My grandma’s toaster has more groove than this city.' },
    { cam: a(-0.8, 1.65, 0.45), look: a(-3.4, 1.5, 2.65), move: 1.1, actors: { bolt: { pose: 'nervous', mood: 'worried', yaw: 2.2 } },
      who: 'BOLT', text: 'Shhh! The Smile Drones hear everything. Last week they re-educated Kevin for HUMMING.' },
    { cam: a(4.5, 2.2, 3.05), look: a(-1.5, 0.9 + sitY, 1.05), move: 1.2, actors: { juno: { pose: 'sit', mood: 'smug', yaw: Math.PI - 0.5 }, bolt: { pose: 'armsCross', mood: 'neutral' } },
      who: 'JUNO', text: 'Kevin hums like a broken fridge. Honestly? Public service.' },
    { cam: a(-0.8, 0.7, 5.25), look: sc(0, -1.5, 0.35), move: 0.6, sfx: 'glitch', music: 'stop', screen: { mode: 'static' }, flash: '#ff2e88',
      actors: { juno: { pose: 'sit', mood: 'shock', yaw: Math.PI }, bolt: { pose: 'lookup', mood: 'shock', yaw: Math.PI - 0.15 } },
      who: 'SCREEN', text: '▓▓▒░ KZZZRRT ░▒▓▓  — signal interrupted —', speed: 30 },
    { cam: sc(1, -7, 22.35), look: sc(0, -0.1, 0.35), move: 1.4, music: W.song, screen: { mode: 'dj' },
      who: 'DJ STATIC', text: 'Yo yo YO, Gleam City! You’re tuned to Radio Static — the frequency they can’t find!' },
    { cam: sc(-1.5, -4, 15.35), look: sc(0, -0.1, 0.35), move: 1.0,
      who: 'DJ STATIC', text: 'The Ministry jams our rhythm with their antennas. But my relays are still out there. Switched off. Hidden. Starting right here in the park.' },
    { cam: sc(-6, -5.5, 18.35), look: sc(0, -0.3, 0.35), move: 1.0,
      who: 'DJ STATIC', text: 'So! Anybody with fast feet: switch ’em back on, and this whole city gets its groove back. Static out!' },
    { cam: a(2.5, 2.6, 6.15), look: sc(0, -8.5, 17.35), move: 1.3, sfx: 'glitch', music: 'anthem', screen: { mode: 'minister', caption: 'PLEASE DISREGARD THAT', mood: 'open' },
      actors: { juno: { pose: 'sit', mood: 'grin' }, bolt: { pose: 'lookup', mood: 'worried' } },
      who: 'MINISTER GLEE', text: 'Please disregard that broadcast. It was weather.' },
    { cam: a(-1.1, 1.7, 0.05), look: a(-3.4, 1.5, 2.65), move: 1.2,
      actors: { juno: { pos: a(0.2, 0, 1.25), yaw: Math.PI / 2 + 0.3, pose: 'crouch', mood: 'neutral' }, bolt: { pose: 'shrug', mood: 'worried', yaw: 2.0 } },
      who: 'BOLT', text: 'Okay. That was SUPER illegal. We should definitely not— wait. Why are you tightening your skates?' },
    { cam: a(-1.5, 0.8, -0.3), look: a(0.2, 1.45, 1.25), move: 1.2, actors: { juno: { pose: 'stretch', mood: 'grin', yaw: -2.4 } },
      who: 'JUNO', text: 'Officially? I’m exercising. Very calm. Very legal. Exercising.' },
    { cam: a(-1.4, 1.9, 0.35), look: a(-3.4, 1.6, 2.65), move: 1.0, actors: { bolt: { pose: 'think', mood: 'worried' }, juno: { pose: 'stand', mood: 'neutral', yaw: -2.2 } },
      who: 'BOLT', text: 'Weird though… how does a pirate DJ get onto the Ministry’s OWN screen?' },
    { cam: a(-5.6, 2.4, 6.85), look: a(-1.4, 2, 1.65), move: 1.6, sfx: ['whoosh'],
      actors: { drone: { pos: a(-1.6, 2.7, 2.05), yaw: Math.PI / 2 + 0.4, mood: 'sus' }, bolt: { pose: 'nervous', mood: 'shock', yaw: 1.7 }, juno: { pose: 'stand', mood: 'shock', yaw: -1.4 } },
      who: 'SMILE DRONE', text: 'CITIZEN. YOU ARE NOT SMILING.' },
    { cam: a(-1, 1.75, 1.55), look: a(0.2, 1.55, 1.25), move: 0.8, actors: { juno: { pose: 'hype', mood: 'mega' } },
      who: 'JUNO', text: '(the single biggest smile in the history of smiles)' },
    { cam: a(-4.2, 2.5, 5.35), look: a(-1.6, 2.5, 2.05), move: 0.9, actors: { drone: { mood: 'happy' }, juno: { pose: 'stand', mood: 'grin' } },
      who: 'SMILE DRONE', text: '…SMILE VERIFIED. HAVE A COMPLIANT DAY! ♪' },
    { cam: a(-3.4 - Math.sin(toRelay) * 3, 2.3, 1.25 - Math.cos(toRelay) * 3), look: [r0.x, r0.y + 2, r0.z], move: 1.8, music: W.song,
      actors: { drone: { pos: a(4, 22, -28), mood: 'happy' }, juno: { pose: 'ready', mood: 'smug', yaw: toRelay }, bolt: { pos: a(-2.2, 0, 5.45), pose: 'wave', mood: 'neutral', yaw: toRelay + 1.2, skate: true } },
      who: 'JUNO', text: 'Keep your radio on, Bolt. Let’s wake this city up.' },
  ];
}

// ---------------- PARK OUTRO (end of world 1) ----------------
function parkOutroShots(R, J) {
  const side = V3(J.x - R.x, 0, J.z - R.z); if (side.lengthSq() < 0.01) side.set(1, 0, 0); side.normalize();
  const jpos = V3(R.x + side.x * 2.4, R.y, R.z + side.z * 2.4);
  const yawToR = Math.atan2(R.x - jpos.x, R.z - jpos.z);
  const perp = V3(-side.z, 0, side.x);
  const front = (d, h, lat = 0) => [jpos.x + side.x * d + perp.x * lat, jpos.y + h, jpos.z + side.z * d + perp.z * lat];
  const dronePos = [jpos.x + perp.x * 2.2 + side.x * 1.2, jpos.y + 2.4, jpos.z + perp.z * 2.2 + side.z * 1.2];
  const droneYaw = Math.atan2(jpos.x - dronePos[0], jpos.z - dronePos[2]);
  return [
    { cut: true, cam: front(9, 5, 6), look: [jpos.x, jpos.y + 1.5, jpos.z],
      actors: { juno: { pos: [jpos.x, jpos.y, jpos.z], yaw: yawToR + Math.PI, pose: 'hype', mood: 'mega', visible: true }, drone: { pos: [jpos.x + 30, jpos.y + 20, jpos.z - 30], visible: true, mood: 'happy' } },
      who: 'DJ STATIC · RADIO', text: 'Five for five! Listen to that park, kid — even the pigeons are bobbing their heads!' },
    { cam: front(3.4, 1.7, 1.2), look: [jpos.x, jpos.y + 1.4, jpos.z], move: 1.3, actors: { juno: { pose: 'wave', mood: 'grin' } },
      who: 'BOLT · RADIO', text: 'Juno! Mrs. Okafor is dancing with the Minister’s statue. In public. I have never been so scared and so happy.' },
    { cam: front(5.5, 2.4, -3.5), look: [jpos.x + perp.x, jpos.y + 2, jpos.z + perp.z], move: 1.6, sfx: 'whoosh',
      actors: { drone: { pos: dronePos, yaw: droneYaw, mood: 'happy' }, juno: { pose: 'stand', mood: 'neutral', yaw: droneYaw + Math.PI } },
      who: 'SMILE DRONE', text: 'MUSIC DETECTED. ONE HUNDRED AND FOUR BEATS PER MINUTE. LOGGING… LOGGING…' },
    { cam: front(4.6, 2.3, 3.6), look: [dronePos[0], dronePos[1] - 0.3, dronePos[2]], move: 0.9,
      who: 'SMILE DRONE', text: '…THANK YOU FOR THE DATA, CITIZEN. ♪' },
    { cam: [jpos.x + Math.sin(droneYaw + Math.PI) * 1.8, jpos.y + 1.6, jpos.z + Math.cos(droneYaw + Math.PI) * 1.8], look: [jpos.x, jpos.y + 1.55, jpos.z], move: 0.8,
      actors: { juno: { mood: 'worried', pose: 'think' }, drone: { pos: [dronePos[0] + 6, dronePos[1] + 14, dronePos[2] - 8] } },
      who: 'JUNO', text: '…Did a drone just thank me?' },
    { cam: front(3.2, 2.6, 2), look: [jpos.x, jpos.y + 1.4, jpos.z], move: 1.0,
      who: 'DJ STATIC · RADIO', text: 'Broken. Totally broken. Forget it! The BIG Ministry antennas are up on the rooftops. That’s where the real fight is.' },
    { cam: front(6, 3.2, -1), look: [jpos.x, jpos.y + 1.6, jpos.z], move: 1.2, actors: { juno: { pose: 'ready', mood: 'smug' } },
      who: 'JUNO', text: 'Rooftops. Finally, somewhere to fall.' },
    { cam: front(6.5, 3.4, -1.4), look: [jpos.x, jpos.y + 1.6, jpos.z], move: 0.6,
      who: 'BOLT · RADIO', text: 'Please don’t say it like it’s a good thing.' },
  ];
}

// ---------------- OUTRO ----------------
function outroShots(R, J) {
  // R: final relay position, J: Juno's position. Drone & camera placed around them.
  const side = V3(J.x - R.x, 0, J.z - R.z); if (side.lengthSq() < 0.01) side.set(1, 0, 0); side.normalize();
  const jpos = V3(R.x + side.x * 2.4, R.y, R.z + side.z * 2.4);
  const yawToR = Math.atan2(R.x - jpos.x, R.z - jpos.z);
  const perp = V3(-side.z, 0, side.x);
  const c = (dx, dy, dz) => [jpos.x + dx, jpos.y + dy, jpos.z + dz];
  const front = (d, h, lat = 0) => [jpos.x + side.x * d + perp.x * lat, jpos.y + h, jpos.z + side.z * d + perp.z * lat];
  const dronePos = [jpos.x + perp.x * 2.2 + side.x * 1.2, jpos.y + 2.4, jpos.z + perp.z * 2.2 + side.z * 1.2];
  const droneYaw = Math.atan2(jpos.x - dronePos[0], jpos.z - dronePos[2]);
  const tower = V3(150, STREET + 250, -250);
  return [
    { cut: true, cam: front(9, 5, 6), look: [jpos.x, jpos.y + 1.5, jpos.z],
      actors: { juno: { pos: [jpos.x, jpos.y, jpos.z], yaw: yawToR + Math.PI, pose: 'hype', mood: 'mega', visible: true }, drone: { pos: [jpos.x + 30, jpos.y + 20, jpos.z - 30], visible: true, mood: 'proud' } },
      who: 'DJ STATIC · RADIO', text: 'THAT’S IT! All five relays! Listen to that, Gleam City — that’s the sound of freedom, baby!' },
    { cam: front(3.4, 1.7, 1.2), look: [jpos.x, jpos.y + 1.4, jpos.z], move: 1.3, actors: { juno: { pose: 'wave', mood: 'grin' } },
      who: 'BOLT · RADIO', text: 'Juno!! The whole block is dancing! Mrs. Okafor is doing the worm! On a TUESDAY!' },
    { cam: front(5.5, 2.4, -3.5), look: [jpos.x + perp.x, jpos.y + 2, jpos.z + perp.z], move: 1.6, sfx: 'whoosh',
      actors: { drone: { pos: dronePos, yaw: droneYaw, mood: 'proud' }, juno: { pose: 'stand', mood: 'neutral', yaw: droneYaw + Math.PI } },
      who: 'SMILE DRONE', text: 'RELAY NETWORK: ONLINE. CITY COVERAGE: ONE HUNDRED PERCENT. ♪' },
    { cam: front(4.6, 2.3, 3.6), look: [dronePos[0], dronePos[1] - 0.3, dronePos[2]], move: 0.9, music: 'unease',
      who: 'SMILE DRONE', text: 'THE MINISTRY THANKS YOU FOR YOUR SERVICE, AGENT JUNO.' },
    { cam: [jpos.x + Math.sin(droneYaw + Math.PI) * 1.7, jpos.y + 1.6, jpos.z + Math.cos(droneYaw + Math.PI) * 1.7], look: [jpos.x, jpos.y + 1.55, jpos.z], move: 0.7, actors: { juno: { mood: 'shock', pose: 'nervous' } },
      who: 'JUNO', text: '…Agent?' },
    { cam: front(4, 1.2, -2), look: [jpos.x, jpos.y + 1.7, jpos.z], move: 0.5, roll: 0.12,
      who: 'BOLT · RADIO', text: 'AGENT?!' },
    { cam: front(3.2, 2.6, 2), look: [jpos.x, jpos.y + 1.4, jpos.z], move: 1.0, actors: { juno: { mood: 'worried', pose: 'think' } },
      who: 'DJ STATIC · RADIO', text: 'Ha! Ha ha. Glitchy little drone. Funny guy. Ignore it. Totally normal drone stuff.' },
    { cam: front(6, 3.2, 0), look: [jpos.x, jpos.y + 1.6, jpos.z], move: 1.2, actors: { drone: { pos: [dronePos[0] + 6, dronePos[1] + 14, dronePos[2] - 8] } },
      who: 'DJ STATIC · RADIO', text: 'Anyway! Next stop: the streets. Big things, kid. Big things. Static out!' },
    { cam: [jpos.x, jpos.y + 3.5, jpos.z], look: [tower.x, tower.y, tower.z], move: 2.6, onEnter: 'wink',
      actors: { juno: { pose: 'lookup', mood: 'worried' } },
      who: 'MINISTER GLEE', text: 'Sleep well, Gleam City. We’re listening. Better than ever. ♥' },
  ];
}
