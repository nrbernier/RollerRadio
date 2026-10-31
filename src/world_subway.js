// ============================================================
//  WORLD 4 — UNDERGLEAM (the subway)
//  Districts: Grand Central (centre) · the East Tunnel ·
//  Old Gleam Central, abandoned and overgrown (far east) ·
//  the Ministry Server Hall & train depot (west)
//  Track bed at y -1.2, platforms at y 0. Trains run on both lines.
// ============================================================
function buildSubway() {
  const K = makeKit({ key: 'subway', name: 'UNDERGLEAM', night: true, spawn: V3(0, 0, -28), spawnYaw: Math.PI / 2, killY: -24,
    objName: 'JUNCTIONS', deepMsg: '<b>FISHED OUT</b><span>A maintenance drone dragged you out of the flood. It seemed disappointed.</span>',
    env: { fog: [0x0c1224, 40, 230], clear: 0x05070d, hemi: [0x9aaaff, 0x141428, 0.72], sun: [0xfff0d0, 0.35, [20, 60, 10]] },
    intro: { A: V3(0, 0, -30) }, bolt: { pos: V3(6, 0, -30), yaw: -1.2 } });
  const { W, B, box, ramp, cyl, rod, rail, sphere } = K;
  const scene = W.group;
  const TILE = '#e6e1f2', BED = '#2a2840', PLAT = '#b8b0cc', flat = { outlineT: 0, edges: false };
  const BEDY = -1.2, TA = -11, TB = 11;
  const wall = (x0, y0, z0, x1, y1, z1, c = TILE) => box(x0, y0, z0, x1, y1, z1, c, 'tile', { outlineT: 0.08, uvScale: 4 });
  const lamp = (x, y, z, c = '#fff3c4', w = 3) => B.box(x - w / 2, y - 0.15, z - 0.4, x + w / 2, y, z + 0.4, c, 'glow', flat);

  // ---------- the base: track bed level everywhere ----------
  box(-272, -4, -64, 376, BEDY, 64, BED, 'plain', flat);
  // platform-edge stripes and ties along the lines
  const stripe = (x0, x1, z) => B.box(x0, 0, z - 0.25, x1, 0.02, z + 0.25, '#ffd23f', 'glow', flat);
  for (let x = -258; x < 352; x += 2.4) for (const tz of [TA, TB]) if (tz === TA || x < 288) B.box(x, BEDY, tz - 1.3, x + 0.6, BEDY + 0.1, tz + 1.3, '#4a3a3a', 'plain', flat);

  // =====================================================================
  //  GRAND CENTRAL (x -60..60)
  // =====================================================================
  box(-60, BEDY, -42, 60, 0, -14, PLAT, 'paving', { outlineT: 0.06 });
  box(-60, BEDY, -8, 60, 0, 8, PLAT, 'paving', { outlineT: 0.06 });
  box(-60, BEDY, 14, 60, 0, 42, PLAT, 'paving', { outlineT: 0.06 });
  stripe(-60, 60, -14.3); stripe(-60, 60, -7.7); stripe(-60, 60, 7.7); stripe(-60, 60, 14.3);
  wall(-62, BEDY, -44, 62, 24, -42); wall(-62, BEDY, 42, 62, 24, 44);
  for (const x0 of [-62, 60]) { wall(x0, BEDY, -42, x0 + 2, 24, -18); wall(x0, BEDY, 18, x0 + 2, 24, 42); wall(x0, 6, -18, x0 + 2, 24, 18); }
  box(-62, 22, -44, 62, 24, 44, '#c9c3dc', 'tile', { outlineT: 0, nocam: true });
  for (let x = -50; x <= 50; x += 20) for (let z = -36; z <= 36; z += 18) lamp(x, 21.9, z, '#fff3c4', 6);
  // mezzanines with railings, and escalators up to them (their handrails are long sloping rails)
  box(-58, 7.4, -42, 58, 8, -34, '#9a92b8', 'paving', { outlineT: 0.06 });
  box(-58, 7.4, 34, 58, 8, 42, '#9a92b8', 'paving', { outlineT: 0.06 });
  rail([[-55, 8.9, -33.6], [55, 8.9, -33.6]], { color: '#c9a46b', posts: false });
  rail([[-55, 8.9, 33.6], [55, 8.9, 33.6]], { color: '#c9a46b', posts: false });
  for (const xc of [-22, 22]) {
    ramp(xc - 2, -34, xc + 2, -17, 'z', 8, 0, '#6a6490', false, 0, 'plain');
    ramp(xc - 2, 17, xc + 2, 34, 'z', 0, 8, '#6a6490', false, 0, 'plain');
    for (const sx of [-2.3, 2.3]) {
      rail([[xc + sx, 0.95, -16.4], [xc + sx, 8.95, -34.2]], { color: '#14101f', posts: false, radius: 0.12 });
      rail([[xc + sx, 0.95, 16.4], [xc + sx, 8.95, 34.2]], { color: '#14101f', posts: false, radius: 0.12 });
    }
  }
  // columns, benches, ticket gates, kiosks
  for (let x = -45; x <= 45; x += 15) for (const z of [-24, 24]) { cyl(x, 0, z, 0.9, 22, '#d9d4ea', { outline: 0.06, seg: 12 }); W.boxes.push({ x0: x - 0.9, y0: 0, z0: z - 0.9, x1: x + 0.9, y1: 22, z1: z + 0.9 }); }
  for (let x = -40; x <= 40; x += 20) { cyl(x, 0, 0, 0.7, 22, '#d9d4ea', { outline: 0.05, seg: 10 }); W.boxes.push({ x0: x - 0.7, y0: 0, z0: -0.7, x1: x + 0.7, y1: 22, z1: 0.7 }); }
  for (const x of [-50, -30, -10, 10, 30, 50]) { K.bench(x, -3.5, true, 0); K.bench(x + 8, 3.5, true, 0); }
  for (let x = -16; x <= 16; x += 4) box(x - 0.3, 0, -21, x + 0.3, 1.1, -19, '#5b6078', 'plain', { outlineT: 0.03 });
  rail([[-16.3, 1.5, -20], [16.3, 1.5, -20]], { color: '#ff2e88', posts: false });
  box(40, 0, -40, 48, 3, -34, '#ff7a2f', 'plain', { outlineT: 0.05 }); K.neon(['SMILE', 'SNACKS'], 44, 4, -33.9, 6, 1.6, 0, { colors: ['#ffd23f', '#ffffff'] });
  box(-48, 0, 34, -40, 3, 40, '#19d3ff', 'plain', { outlineT: 0.05 }); K.neon(['LOST &', 'FOUND'], -44, 4, 33.9, 6, 1.6, Math.PI, { colors: ['#19d3ff', '#ffffff'] });
  // the station screen (the Minister will call from here)
  K.screen(V3(0, 15, 41.45), 24, 13.5, Math.PI);
  box(-13, 7.9, 41.6, 13, 22.1, 42, '#14101f', 'plain', { outlineT: 0.06 });
  K.poster(['SMILE!', 'YOU’RE ON CAMERA'], 0, 15, -41.9, 30, 10, 0, { bg: PAL.mint });
  K.poster(['MIND THE GAP', 'BETWEEN WHAT YOU HEAR AND WHAT IS TRUE'], -40, 4.5, -41.95, 14, 3, 0, { bg: '#ffe08a', smiley: false });
  K.neon(['GRAND CENTRAL', 'GLEAM METRO · LINE 88'], 0, 4.8, -14.05, 14, 3, Math.PI, { colors: ['#ffd23f', '#ffffff'], double: true, flicker: false });

  // =====================================================================
  //  TUNNELS (east to the old station, west to the server hall)
  // =====================================================================
  const tunnel = (x0, x1, door) => {
    box(x0, BEDY, -8, x1, 0, 8, PLAT, 'paving', { outlineT: 0.05 });
    box(x0, BEDY, -18, x1, 0, -14, PLAT, 'paving', { outlineT: 0.05 });
    box(x0, BEDY, 14, x1, 0, 18, PLAT, 'paving', { outlineT: 0.05 });
    if (door) { wall(x0, BEDY, -20, door[0], 8, -18, '#b8b0cc'); wall(door[1], BEDY, -20, x1, 8, -18, '#b8b0cc'); wall(door[0], 4.4, -20, door[1], 8, -18, '#b8b0cc'); }
    else wall(x0, BEDY, -20, x1, 8, -18, '#b8b0cc');
    wall(x0, BEDY, 18, x1, 8, 20, '#b8b0cc');
    box(x0, 6, -20, x1, 8, 20, '#8a84a8', 'tile', { outlineT: 0, nocam: true });
    for (let x = x0 + 8; x < x1; x += 16) { cyl(x, 0, 0, 0.55, 6, '#9a96b8', { outline: 0.04, seg: 8 }); W.boxes.push({ x0: x - 0.55, y0: 0, z0: -0.55, x1: x + 0.55, y1: 6, z1: 0.55 }); }
    for (let x = x0 + 4; x < x1; x += 10) { lamp(x, 5.95, -11, '#cfe0ff', 2); lamp(x, 5.95, 11, '#cfe0ff', 2); }
    stripe(x0, x1, -14.3); stripe(x0, x1, -7.7); stripe(x0, x1, 7.7); stripe(x0, x1, 14.3);
  };
  tunnel(62, 262, [156, 168]); tunnel(-100, -62);
  // a cable tray high on the north wall of the east tunnel: a 200 m alternative to the tracks
  rail(pWave([64, 3.3, -16.9], [258, 3.3, -16.9], 0.5, 9), { color: '#5b6078', round: 0, posts: false, radius: 0.12 });
  // the signal room (an alcove off the east tunnel)
  box(154, BEDY, -30, 170, 0, -18, PLAT, 'paving', flat);
  wall(152, BEDY, -32, 172, 8, -30); wall(152, BEDY, -30, 154, 8, -20); wall(170, BEDY, -30, 172, 8, -20);
  box(152, 6, -32, 172, 8, -18, '#8a84a8', 'tile', { outlineT: 0, nocam: true });
  lamp(162, 5.9, -25, '#ff6b7a', 4);
  K.neon(['SIGNAL ROOM', 'AUTHORISED EARS ONLY'], 162, 5.2, -17.95, 8, 1.4, 0, { colors: ['#ff2e88', '#ffffff'] });

  // =====================================================================
  //  THE MINISTRY SERVER HALL + DEPOT (west)
  // =====================================================================
  box(-262, BEDY, -60, -100, 0, -14, '#9a96c0', 'paving', { outlineT: 0.05 });
  box(-262, BEDY, 14, -100, 0, 60, '#9a96c0', 'paving', { outlineT: 0.05 });
  box(-262, BEDY, -8, -100, 0, 8, '#9a96c0', 'paving', { outlineT: 0.05 });
  stripe(-262, -100, -14.3); stripe(-262, -100, -7.7); stripe(-262, -100, 7.7); stripe(-262, -100, 14.3);
  wall(-264, BEDY, -62, -98, 18, -60, '#9aa6d8'); wall(-264, BEDY, 60, -98, 18, 62, '#9aa6d8');
  wall(-266, BEDY, -60, -262, 18, 60, '#9aa6d8');
  wall(-100, BEDY, -60, -98, 18, -20); wall(-100, BEDY, 20, -98, 18, 60); wall(-100, 8, -20, -98, 18, 20);
  box(-264, 16, -62, -98, 18, 62, '#6a74a8', 'tile', { outlineT: 0, nocam: true });
  for (let x = -250; x < -105; x += 22) for (const z of [-40, 40]) lamp(x, 15.9, z, '#9fd8ff', 8);
  // rows of server racks with blinking LED strips (you can stand on top of them)
  const racks = [];
  for (const z of [-54, -46, -38, -30, 30, 38, 46, 54]) for (let x = z > 0 ? -240 : -252; x < -112; x += 24) {
    box(x, 0, z - 0.7, x + 18, 2.7, z + 0.7, '#2b2d42', 'plain', { outlineT: 0.05 });
    B.box(x + 0.5, 1.6, z - 0.72, x + 17.5, 1.75, z - 0.7, '#19d3ff', 'glow', flat);
    B.box(x + 0.5, 0.8, z + 0.7, x + 17.5, 0.95, z + 0.72, '#8ff0c8', 'glow', flat);
    racks.push([x, z]);
  }
  // cable trays: long snaking rails above the aisles, rising and dipping
  rail([[-103, 2.6, -21], [-130, 5.4, -26], [-160, 4.4, -34], [-190, 6.2, -42], [-222, 4.8, -50], [-246, 7.2, -46], [-258.5, 10.9, -34], [-258.5, 10.9, -27]], { color: '#5b6078', round: 7, posts: false, radius: 0.12 });
  rail([[-107, 2.6, 25], [-140, 6.0, 27], [-172, 4.6, 34], [-204, 6.0, 42], [-226, 5.6, 47], [-237.5, 4.0, 36.5]], { color: '#5b6078', round: 7, posts: false, radius: 0.12 });
  for (let x = -250; x < -105; x += 18) { rod(V3(x, 16, -36), V3(x, 6.4, -36), 0.03, '#5b6078', 0.01); rod(V3(x, 16, 36), V3(x, 6.4, 36), 0.03, '#5b6078', 0.01); }
  // the uplink gantry at the west end
  box(-262, 9.4, -30, -254, 10, -10, '#3a3550', 'plain', { outlineT: 0.05 });
  for (const z of [-29, -11]) cyl(-255, 0, z, 0.2, 9.4, '#5b6078', { outline: 0.03, seg: 8 });
  cyl(-258, 10, -20, 1.4, 6, '#19d3ff', { outline: 0.08, seg: 16 });
  W.boxes.push({ x0: -259.4, y0: 10, z0: -21.4, x1: -256.6, y1: 16, z1: -18.6 });
  // parked trains in the depot, and the buffers at the end of the line
  for (const z of [TA, TB]) box(-262, BEDY, z - 1.6, -260, 0.4, z + 1.6, '#ff2e88', 'plain', { outlineT: 0.04 });
  // the vault: a beat shutter guards a junction
  wall(-262, 0, 24, -244, 6, 26); wall(-246, 0, 26, -244, 6, 34); wall(-246, 0, 38, -244, 6, 46); wall(-262, 0, 44, -244, 6, 46);
  box(-262, 6, 24, -244, 6.6, 46, '#3a3550', 'plain', { outlineT: 0.05 });
  wall(-246, 3.4, 34, -244, 6, 38);
  K.shutter({ face: 'x', c: -245, a0: 34, a1: 38, y0: 0, h: 3.4 });
  K.neon(['DATA VAULT', 'OPENS ON 1 & 2'], -243.9, 5, 30, 6, 1.6, Math.PI / 2, { colors: ['#19d3ff', '#ffffff'] });
  K.poster(['EVERY DANCE', 'IS A DATA POINT'], -180, 10, -59.9, 26, 8, 0, { bg: PAL.mint });
  K.poster(['THANK YOU', 'FOR YOUR SERVICE'], -180, 10, 59.9, 26, 8, Math.PI, { bg: PAL.pink });

  // =====================================================================
  //  OLD GLEAM CENTRAL (far east): abandoned, overgrown, flooded
  // =====================================================================
  box(262, BEDY, -42, 300, 0, -14, '#7a8a6a', 'paving', { outlineT: 0.06 });
  box(306, BEDY, -42, 372, 0, -14, '#7a8a6a', 'paving', { outlineT: 0.06 });
  box(264, BEDY, -8, 288, 0, 8, '#7a8a6a', 'paving', { outlineT: 0.06 });
  box(298, BEDY, -8, 316, 0, 8, '#7a8a6a', 'paving', { outlineT: 0.06 });
  box(328, BEDY, -8, 350, 0, 8, '#7a8a6a', 'paving', { outlineT: 0.06 });
  box(262, BEDY, 14, 372, 0, 42, '#7a8a6a', 'paving', { outlineT: 0.06 });
  K.water(288, 8, 372, 14, -0.5, '#3a8a6a', true);
  wall(262, BEDY, -44, 374, 24, -42, '#a8b89a'); wall(262, BEDY, 42, 374, 24, 44, '#a8b89a'); wall(372, BEDY, -42, 374, 24, 42, '#a8b89a');
  wall(262, BEDY, -42, 264, 24, -18, '#a8b89a'); wall(262, BEDY, 18, 264, 24, 42, '#a8b89a'); wall(262, 6, -18, 264, 24, 18, '#a8b89a');
  // ceiling with two collapsed holes (light falls through)
  box(264, 22, -42, 290, 24, 42, '#8a9a7a', 'tile', { outlineT: 0, nocam: true }); box(290, 22, -42, 300, 24, -36, '#8a9a7a', 'tile', { outlineT: 0, nocam: true });
  box(290, 22, -24, 300, 24, 42, '#8a9a7a', 'tile', { outlineT: 0, nocam: true }); box(300, 22, -42, 336, 24, 42, '#8a9a7a', 'tile', { outlineT: 0, nocam: true });
  box(336, 22, -42, 348, 24, 12, '#8a9a7a', 'tile', { outlineT: 0, nocam: true }); box(348, 22, -42, 372, 24, 42, '#8a9a7a', 'tile', { outlineT: 0, nocam: true });
  box(336, 22, 24, 348, 24, 42, '#8a9a7a', 'tile', { outlineT: 0, nocam: true });
  for (const [x, z] of [[295, -30], [342, 18]]) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 23, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xd8ffb0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); sh.position.set(x, 10.5, z); scene.add(sh); }
  for (let x = 270; x < 370; x += 14) lamp(x, 21.9, -28, '#9fffb0', 4);
  // rubble and moss
  for (const [x, z, s] of [[292, -30, 2.4], [318, -20, 1.6], [352, -36, 2], [276, 30, 1.8], [330, 34, 1.4]]) sphere(x, s * 0.5, z, s, '#6a6a5a', { outline: 0.06, seg: 8 });
  for (let i = 0; i < 26; i++) { const x = 266 + (i * 37) % 104, z = -40 + (i * 53) % 80; if (Math.abs(z) < 16) continue; sphere(x, 0.15, z, 1.2 + (i % 3) * 0.4, '#4f9a5a', { kind: 'leaf', outline: 0.03, seg: 8, sy: 0.3 }); }
  // giant roots growing through the station: grindable, up and down, over the flood
  rail([[296, 20, -30], [300, 11, -23], [308, 3.6, -14], [320, 2.4, -3], [332, 4.6, 6], [342, 3.4, 15], [350, 1.4, 17.5]], { kind: 'pipe', color: '#5a4a3a', collar: '#4a3a2a', round: 5, radius: 0.5 });
  rail([[268, 1.4, -34], [282, 4.2, -26], [296, 6.2, -12], [308, 4.4, 2], [318, 2.0, 16], [326, 1.4, 26]], { kind: 'pipe', color: '#5a4a3a', collar: '#4a3a2a', round: 5, radius: 0.45 });
  rail([[358, 1.4, -36], [360, 6.5, -20], [352, 9.5, -6], [338, 7.5, 2]], { kind: 'pipe', color: '#5a4a3a', collar: '#4a3a2a', round: 4, radius: 0.4 });
  K.poster(['OLD GLEAM CENTRAL', 'CLOSED FOR YOUR SAFETY · 2009'], 318, 6, -41.9, 18, 5, 0, { bg: '#b8c8a8', smiley: false });
  // Static's "studio": the old station master's office
  wall(338, 0, 22, 341, 6, 40, '#a8b89a'); wall(359, 0, 22, 362, 6, 40, '#a8b89a'); wall(338, 0, 40, 362, 6, 42, '#a8b89a');
  wall(338, 0, 20, 346, 6, 22, '#a8b89a'); wall(352, 0, 20, 362, 6, 22, '#a8b89a'); wall(346, 4.2, 20, 352, 6, 22, '#a8b89a');
  box(338, 6, 20, 362, 6.6, 42, '#5a6a4a', 'plain', { outlineT: 0.05 });
  box(344, 0, 34, 356, 1.1, 38, '#6a4a3a', 'wood', { outlineT: 0.05 });
  K.neon(['ON AIR'], 349, 5.2, 20.95, 3, 1, Math.PI, { colors: ['#ff2e88'], bg: '#200810' });
  {
    const crt = canvasTex(128, 96, (x, w, h, t = 0) => { drawDJ(x, w, h, t, { mini: true, talking: Math.sin(t * 3) > 0.6 }); });
    const scr = new THREE.MeshBasicMaterial({ map: crt.tex });
    for (const [x, y, z] of [[346, 1.6, 37], [349, 1.6, 37.4], [352, 1.6, 37], [347.5, 2.9, 37.4], [350.5, 2.9, 37.4]]) {
      box(x - 1.1, y - 0.6, z - 0.7, x + 1.1, y + 0.6, z + 0.7, '#d9d2c3', 'plain', { outlineT: 0.04, collide: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.95), scr); m.position.set(x, y, z - 0.72); m.rotation.y = Math.PI; scene.add(m);
    }
    let t = 0, acc = 0; W.dyn.push({ update(dt) { t += dt; acc += dt; if (acc > 0.12) { acc = 0; crt.redraw(t); } } });
    for (const x of [341.6, 358.4]) for (const z of [24, 30]) { cyl(x, 0, z, 0.45, 0.2, '#14101f', { outline: 0.02 }); cyl(x, 0.2, z, 0.06, 1.2, '#5b6078', { outline: 0.01, seg: 6 }); sphere(x, 1.5, z, 0.32, '#3a3550', { outline: 0.02, seg: 8 }); }
    W.studio = V3(349, 0, 30);
    const ss = K.screen(V3(349, 4.62, 39.85), 4.2, 2.36, Math.PI, 'studio'); ss.st.mode = 'dj'; ss.st.mini = true;
    box(346.6, 3.3, 39.9, 351.4, 5.94, 40, '#14101f', 'plain', { outlineT: 0.03, collide: false });
  }

  // ---------- the tracks: four long running rails (grind them... and watch for trains) ----------
  for (const [z, x1] of [[TA - 0.7, 350], [TA + 0.7, 350], [TB - 0.7, 288], [TB + 0.7, 288]]) rail([[-258, BEDY + 0.18, z], [x1, BEDY + 0.18, z]], { color: '#c9c3dc', posts: false, radius: 0.07 });
  // the data cable: a fat glowing pipe from the server hall to Static's studio. Follow it.
  rail([[-250, 1.3, 58.4], [-102, 1.3, 58.4], [-101, 1.3, 17.4], [-58.6, 1.3, 17.4], [-58.6, 1.3, 41.4], [58.6, 1.3, 41.4], [58.6, 1.3, 17.4],
        [262, 1.3, 17.4], [265.4, 1.3, 22], [265.4, 1.3, 41.4], [336.6, 1.3, 41.4], [336.6, 1.3, 19.2], [345, 1.3, 19.2]],
       { kind: 'pipe', color: '#19d3ff', collar: '#0e6a8a', round: 3, radius: 0.42, mat: 'glow' });

  // ---------- trains: ride on the roof, hop off before the platform ends ----------
  const trainMesh = (c) => {
    const g = new THREE.Group();
    for (const zz of [-10, 0, 10]) {
      g.add(at(part(new THREE.BoxGeometry(2.8, 3.1, 9.4), c, 0.06), 0, 1.75, zz));
      g.add(at(part(new THREE.BoxGeometry(2.9, 0.9, 8.6), '#14101f', 0.02), 0, 2.2, zz));
      g.add(at(part(new THREE.BoxGeometry(2.6, 0.25, 9), '#e9e4f5', 0.03), 0, 3.35, zz));
    }
    for (const s of [-1, 1]) { g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), basic('#fff3c4')), 0.85 * s, 1.1, 14.72)); g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), basic('#ff2244')), 0.85 * s, 1.1, -14.72)); }
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), new THREE.MeshBasicMaterial({ map: droneFaces().happy })); face.position.set(0, 2.4, 14.73); g.add(face);
    return g;
  };
  const warn = (M, x, z) => {
    const p = Game.player; if (!p || Game.state !== 'play') return;
    const onBed = p.pos.y < -0.3 && Math.abs(p.pos.z - z) < 3;
    const ahead = (x - p.pos.x) * Math.sign(M.col.vx || 1) < 0, d = Math.abs(x - p.pos.x);
    if (onBed && ahead && d < 70 && !(M.warned > 0)) { M.warned = 6; Sound.sfx.train(); Sound.sfx.rumble(0.8); pop('TRAIN COMING!', 'bad'); }
    if (M.warned > 0) M.warned -= 1 / 60;
  };
  const msg = '<b>MIND THE GAP</b><span>You have been hit by the 88 Express. Please do not lick the third rail.</span>';
  K.mover({ path: [[-240, TA], [344, TA]], size: [2.8, 3.4, 30], y: BEDY, speed: 15, loop: false, visual: trainMesh('#8ff0c8'), msg, phase: 0.15, onPass: warn });
  K.mover({ path: [[-240, TB], [270, TB]], size: [2.8, 3.4, 30], y: BEDY, speed: 13, loop: false, visual: trainMesh('#ffd23f'), msg, phase: 0.65, onPass: warn });

  // ---------- junctions, tapes, pads, drones ----------
  K.relays([
    { id: 1, pos: V3(0, 8, -38), hint: 'First junction box: up on the north mezzanine in Grand Central. The escalator handrails go all the way up.' },
    { id: 2, pos: V3(162, 0, -25), hint: 'There’s one in the signal room, an alcove off the east tunnel. Ride the cable tray or the tracks. Mind the trains.' },
    { id: 3, pos: V3(-172, 2.7, -38), hint: 'The Ministry server hall, west. One junction sits on top of a server rack. The cable trays drop you right onto them.' },
    { id: 4, pos: V3(-254, 0, 35), hint: 'The data vault in the server hall. Its door opens on beats one and two.' },
    { id: 5, pos: V3(349, 0, 28), hint: 'Follow the glowing cable east, past the flood in Old Gleam Central. It ends in a little office. Static’s office.' },
  ].map(r => Object.assign(r, { style: 'junction' })));
  K.tapes([
    { id: 1, pos: V3(-44, 3.8, 37), text: 'TAPE — Platform announcement: “Smiling is now mandatory on platform two. Platform one remains smile-optional. For now.”' },
    { id: 2, pos: V3(-256, 11, -27), text: 'TAPE — Server log: “Dance data from relay #4471: twelve thousand heads bobbing. Classifier says 97% rebellious. Excellent harvest.”' },
    { id: 3, pos: V3(166, 1.2, -29), text: 'TAPE — A maintenance worker: “The pirate signal comes from down here. Always has. The Ministry built that studio in ’09.”' },
    { id: 4, pos: V3(338, 8.4, 2), text: 'TAPE — Static, rehearsing: “Yo yo yo, it’s your pirate friend— no. Ugh. Again. Make it sound more… rebellious.”', dj: '…That was a bad take. Everybody has bad takes.' },
    { id: 5, pos: V3(356, 1.6, 26), text: 'TAPE — Bolt’s voice, scared: “Juno, if you hear this — that wasn’t me on the radio earlier. Check the frequency. Don’t trust my voice.”' },
  ]);
  K.pads([
    { pos: V3(312, 0, -2), aim: V3(2, 0, 16), vy: 17 },
  ]);
  K.drones([
    { path: [[-50, 14, -28], [50, 14, -28], [50, 14, 28], [-50, 14, 28]], speed: 3.4, phase: 0 },
    { path: [[70, 4.6, 0], [258, 4.6, 0]], speed: 4, phase: 0.3 },
    { path: [[-240, 9, -26], [-110, 9, -26], [-110, 9, 26], [-240, 9, 26]], speed: 3.6, phase: 0.5 },
    { path: [[-240, 9, -48], [-120, 9, -48]], speed: 3, phase: 0.2 },
  ]);
  K.finish();
  W.sky = skyDome({ top: [0.02, 0.03, 0.06], mid: [0.05, 0.06, 0.1], hor: [0.1, 0.12, 0.16], low: [0.02, 0.02, 0.04], cloudAmt: 0, sun: [0.3, 0.9, 0.2], sunC: [0.9, 0.95, 1], stripes: false });
  scene.add(W.sky);
  // dust in the lamp light
  {
    const N = 200, g = new THREE.BufferGeometry(), arr = new Float32Array(N * 3), ds = [];
    for (let i = 0; i < N; i++) ds.push({ x: (Math.random() - 0.5) * 40, y: Math.random() * 10, z: (Math.random() - 0.5) * 40, s: Math.random() });
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff3c4, size: 0.08, transparent: true, opacity: 0.6 })); pts.frustumCulled = false; scene.add(pts);
    W.dyn.push({ update(dt) { const c = G.camera.position; for (let i = 0; i < N; i++) { const d = ds[i]; d.y -= dt * 0.2 * (0.5 + d.s); if (d.y < -1) d.y = 10; arr[i * 3] = c.x + d.x; arr[i * 3 + 1] = c.y - 3 + d.y; arr[i * 3 + 2] = c.z + d.z; } g.attributes.position.needsUpdate = true; } });
  }
  return W;
}
