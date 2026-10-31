// ============================================================
//  WORLD 3 — NEON MILE (the streets, night, rain)
//  Districts: Lantern Market (west) · Plaza of Truth (centre) ·
//  the Loop Overpass around the Media Tower (north) ·
//  Broadcast Avenue with trams (east) · Canal Quay (south)
// ============================================================
function buildStreets() {
  const K = makeKit({ key: 'streets', name: 'NEON MILE', night: true, spawn: V3(-21, 0, 51.5), spawnYaw: Math.PI, killY: -24,
    objName: 'SCRAMBLERS',
    env: { fog: [0x26143f, 70, 340], clear: 0x150b2b, hemi: [0xa496ff, 0x2a1640, 0.62], sun: [0xc2ccff, 0.45, [-30, 80, 40]] },
    intro: { A: V3(-100, 0, 30) }, bolt: { pos: V3(-18.5, 0, 58.5), yaw: -2.4 },
    lull: { pos: V3(-26.4, 0, 55), yaw: Math.PI / 2, sign: 'SCRAMBLE 5 RELAYS' } });
  const { W, B, box, ramp, cyl, rod, rail, sphere } = K;
  const scene = W.group;
  const ASPH = '#4a4466', WALK = '#7c7698', flat = { outlineT: 0, edges: false };
  const bld = (x0, z0, x1, z1, top, c, r, trim = '#14101f') => K.bld(x0, z0, x1, z1, top, c, r, trim, -1);

  // ---------- ground, canal cut ----------
  box(-150, -4, -150, 150, 0, 96, ASPH, 'asphalt', flat);
  box(-150, -4, 112, 150, 0, 150, ASPH, 'asphalt', flat);
  box(-150, -4.2, 96, 150, -3.6, 112, '#24304a', 'plain', flat);
  K.water(-150, 96, 150, 112, -1.2, '#3a7fd0', true);
  // lane markings
  for (let z = -146; z < 146; z += 8) { B.box(95.8, 0, z, 96.2, 0.03, z + 4, '#ffd23f', 'plain', flat); }
  for (let x = -40; x < 60; x += 8) B.box(x, 0, 5.8, x + 4, 0.03, 6.2, '#e9e4f5', 'plain', flat);

  // ---------- outer ring of the city ----------
  bld(-200, -200, 200, -150, 60, '#3b3f8a', '#2a2d5a'); bld(-200, 150, 200, 200, 50, '#5b2b6a', '#3a2a55');
  bld(-200, -150, -150, 150, 55, '#3a4a8a', '#2a2d5a'); bld(150, -150, 200, 150, 65, '#4a2b7a', '#2a2d5a');

  // =====================================================================
  //  LANTERN MARKET (west)
  // =====================================================================
  const MKT = [['#c2415a', '#7a3a4a'], ['#d0703a', '#7a4a3a'], ['#b0407a', '#6a3a5a'], ['#c8584a', '#7a3a3a'], ['#a8487a', '#5a3a5a'], ['#d0603a', '#7a4a3a']];
  bld(-150, -70, -108, -30, 10, ...MKT[0]); bld(-92, -70, -56, -30, 8, ...MKT[1]);
  bld(-150, -22, -108, 20, 12, ...MKT[2]); bld(-92, -22, -56, 20, 9, ...MKT[3]);
  bld(-150, 28, -108, 70, 10, ...MKT[4]); bld(-92, 28, -56, 70, 11, ...MKT[5]);
  bld(-150, 78, -56, 86, 8, '#8a3a6a', '#5a3a5a');
  // shop awnings along the lane (you can land on them) + neon shop signs
  const shops = [['NOODLE REGIME', 'MILD BROTH ONLY'], ['QUIET KARAOKE', 'LIP SYNC ONLY'], ['DUMPLING DECREE', 'EAT CALMLY'], ['LEGAL TEMPO', 'RECORDS ♪=60'],
    ['SMILE CLINIC', 'WALK-INS WELCOME'], ['THE MUTE BUTTON', 'BAR'], ['LUCKY CAT', 'SURVEILLANCE CO.'], ['TEA & TRANQUILITY', 'NO REFILLS']];
  let si = 0;
  for (const [z0, z1] of [[-68, -32], [-20, 18], [30, 68]]) for (const side of [-1, 1]) {
    const fx = side < 0 ? -108 : -92, out = side < 0 ? 2.2 : -2.2;
    for (let z = z0 + 2; z < z1 - 6; z += 12) {
      const col = ['#ff2e88', '#19d3ff', '#ffd23f', '#c6ff3d'][si % 4];
      box(Math.min(fx, fx + out), 3, z, Math.max(fx, fx + out), 3.35, z + 8, col, 'plain', { outlineT: 0.05 });
      const sh = shops[si++ % shops.length];
      K.neon(sh, fx + side * -0.05, 5.6, z + 4, 7, 2.2, side < 0 ? Math.PI / 2 : -Math.PI / 2, { colors: [col, '#ffffff'] });
    }
  }
  // stalls in the lane
  for (let z = -64; z < 66; z += 14) {
    if (Math.abs(z - 24) < 8 || Math.abs(z + 26) < 8) continue;
    for (const [x0, x1] of [[-107, -104], [-96, -93]]) {
      box(x0, 0, z, x1, 1.1, z + 5, '#8a5a3c', 'wood', { outlineT: 0.05 });
      box(x0 - 0.3, 2.5, z - 0.3, x1 + 0.3, 2.8, z + 5.3, ['#ff2e88', '#ffd23f', '#19d3ff'][(z / 14 | 0) & 1 ? 0 : 1], 'plain', { outlineT: 0.05 });
      for (const [px, pz] of [[x0, z], [x1, z], [x0, z + 5], [x1, z + 5]]) cyl(px, 1.1, pz, 0.07, 1.4, '#3a3550', { outline: 0.02, seg: 6 });
    }
  }
  // the burnt noodle stand — "the Hush did it", says the news
  box(-103, 0, -40, -97, 2.2, -35, '#2a2228', 'plain', { outlineT: 0.06 });
  box(-104, 2.2, -41, -96, 2.4, -34, '#1a1418', 'plain', { outlineT: 0.04 });
  for (const z of [-43, -32]) rail([[-106, 0.9, z], [-94, 0.9, z]], { hidden: true });
  for (const z of [-43, -32]) B.box(-106, 0.85, z - 0.05, -94, 0.95, z + 0.05, '#ffd23f', 'plain', { outlineT: 0, edges: false });
  box(-96.5, 0, -54, -93.5, 2.8, -47, '#e9e4f5', 'plain', { outlineT: 0.06 });         // the GNN news van
  K.neon(['GNN', 'NEWS 24/7'], -96.45, 2.0, -50.5, 4, 1.4, -Math.PI / 2, { colors: ['#19d3ff', '#ffffff'], flicker: false });
  W.dyn.push({ update(dt) { if (Game.fx && Math.random() < 0.35) Game.fx.emit(_sv.set(-100 + Math.random() * 3 - 1.5, 2.6, -37.5 + Math.random() * 2), _sv2.set((Math.random() - 0.5) * 0.6, 2 + Math.random(), (Math.random() - 0.5) * 0.6), Math.random() < 0.5 ? '#5a5060' : '#8a8090', 2.4, -0.4); } });
  // the Lantern Slalom: a long string of lanterns snaking down the whole lane
  {
    const pts = [];
    for (let z = 66; z >= -68; z -= 1) {
      const u = (66 - z);
      const x = -100 + 6.2 * Math.sin(u / 16 * Math.PI);
      const y = U.lerp(3.9, 5.6, U.smooth(U.clamp(u / 14, 0, 1))) + 0.6 * Math.sin(u / 11);
      pts.push([x, y, z]);
    }
    rail(pts, { kind: 'cable', color: '#14101f', lanterns: true, sag: 0, round: 0, posts: false });
    for (let k = 0; k * 16 + 8 <= 134; k++) {
      const z = 66 - (k * 16 + 8), side = k % 2 ? -1 : 1, fx = side > 0 ? -92 : -108;
      const pt = pts[Math.round(66 - z)];
      if (pt) rod(V3(fx, pt[1] + 0.6, z), V3(pt[0], pt[1] - 0.05, z), 0.03, '#14101f', 0.01);
    }
    cyl(-100, 0, 66.2, 0.12, 4.1, '#5b4a6b', { outline: 0.03, seg: 8 });
    box(-102, 0, 64, -98, 2.4, 66, '#8a5a3c', 'wood', { outlineT: 0.05 });            // a crate stack to jump from
  }
  // cross-lane lantern strings (short hops between the awnings)
  for (const z of [-26, 24]) rail([[-107.5, 4.6, z], [-92.5, 4.6, z]], { kind: 'cable', color: '#14101f', lanterns: ['#ffd23f', '#ff7a2f'], sag: 0.6 });
  K.poster(['REPORT', 'ANYONE HUMMING'], -108.05, 9, -50, 8, 4, Math.PI / 2, { bg: PAL.mint });
  K.poster(['WANTED', 'SONIC TERRORIST — THE HUSH'], -91.95, 7.2, 0, 7, 3.5, -Math.PI / 2, { bg: '#ffe08a', smiley: false });

  // =====================================================================
  //  PLAZA OF TRUTH (centre)
  // =====================================================================
  bld(-48, -40, -4, -18, 14, '#6a4a9a', '#4a3a6a'); bld(24, -40, 56, -18, 18, '#4a5aaa', '#3a3a6a');
  bld(-48, 66, -6, 90, 12, '#7a3a7a', '#4a2a5a'); bld(10, 66, 56, 90, 14, '#5a3a8a', '#3a2a5a');
  B.box(-48, 0, -16, 56, 0.12, 64, '#5e5880', 'paving', flat);
  // the statue: Minister Glee with a megaphone
  box(-1, 0, 21, 9, 1.2, 31, '#c9c3dc', 'paving', { outlineT: 0.06 });
  box(1, 1.2, 23, 7, 3.0, 29, '#d9d4ea', 'paving', { outlineT: 0.06 });
  cyl(4, 3, 26, 1.2, 3.2, '#3b3f8a', { outline: 0.06, r2: 0.9 });
  sphere(4, 7.1, 26, 1.3, '#ffc9a8', { outline: 0.06, seg: 16 });
  cyl(4, 8.0, 26, 1.4, 0.9, '#2a2140', { outline: 0.05, seg: 14 });
  rod(V3(4.8, 6.8, 26.6), V3(6.6, 7.6, 28.2), 0.4, '#ffd23f', 0.05);
  W.boxes.push({ x0: 2.6, y0: 3, z0: 24.6, x1: 5.4, y1: 8.9, z1: 27.4 });
  rail([[-0.6, 1.6, 20.4], [8.6, 1.6, 20.4], [8.6, 1.6, 31.6], [-0.6, 1.6, 31.6]], { hidden: true, loop: true, round: 0.5 });
  // benches, planters, kickers, lamps
  for (const [x, z] of [[-30, 6], [-30, 44], [36, 6], [36, 44]]) { box(x - 3, 0, z - 3, x + 3, 0.9, z + 3, '#3a3550', 'plain', { outlineT: 0.05 }); sphere(x, 1.7, z, 2, '#2f8f6e', { kind: 'leaf', outline: 0.06 }); rail([[x - 3.3, 1.2, z - 3.3], [x + 3.3, 1.2, z - 3.3], [x + 3.3, 1.2, z + 3.3], [x - 3.3, 1.2, z + 3.3]], { hidden: true, loop: true, round: 0.4 }); }
  K.bench(-14, 12, true, 0.12); K.bench(22, 12, true, 0.12); K.bench(-14, 40, true, 0.12); K.bench(22, 40, true, 0.12);
  ramp(-20, 22, -16, 30, 'x', 0, 1.6, '#ff2e88'); ramp(24, 22, 28, 30, 'x', 1.6, 0, '#19d3ff');
  for (const [x, z] of [[-44, -12], [52, -12], [-44, 60], [52, 60], [-10, -12], [18, -12]]) K.lamp(x, z);
  // the Hush hideout: the Quiet Laundromat
  bld(-48, 46, -28, 64, 7, '#2b2d42', '#1d1e2c', '#8ff0c8');
  box(-28.6, 0, 50, -28, 2.6, 60, '#8ff0c8', 'glow', { outlineT: 0.03, collide: false });
  K.neon(['QUIET', 'LAUNDROMAT'], -27.9, 4.4, 55, 7, 2.4, Math.PI / 2, { colors: ['#8ff0c8', '#ffffff'] });
  K.neon(['SILENCE IS', 'FREEDOM'], -38, 9.5, 63.9, 8, 3, Math.PI, { colors: ['#ffffff', '#8ff0c8'], bg: '#0b0b14' });
  // a long rail around the plaza's edge, with a dip down at the corners
  rail([[-46, 1.0, -14], [-20, 2.0, -14], [-4, 1.0, -14], [26, 1.0, -14], [54, 2.0, -14], [54, 1.0, 20], [54, 2.0, 62], [10, 1.0, 62], [-22, 1.0, 62]], { color: '#c6ff3d', round: 6 });

  // =====================================================================
  //  THE LOOP OVERPASS + MEDIA TOWER (north)
  // =====================================================================
  const OC = { x: 10, z: -95 }, OR = 46, DECK = 9;
  const circ = (r, a0 = 0, a1 = Math.PI * 2, y = DECK, step = 1.2) => { const n = Math.ceil(Math.abs(a1 - a0) * r / step), out = []; for (let i = 0; i <= n; i++) { const a = U.lerp(a0, a1, i / n); out.push([OC.x + Math.cos(a) * r, y, OC.z + Math.sin(a) * r]); } return out; };
  K.deck(circ(OR, 0, Math.PI * 2, DECK, 2).map(p => [p[0], p[2]]), 12, DECK, { thick: 1.2, color: '#4a4466', loop: true });
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
    const x = OC.x + Math.cos(a) * OR, z = OC.z + Math.sin(a) * OR;
    if (Math.abs(Math.cos(a)) > 0.97 || Math.sin(a) > 0.97) continue;
    cyl(x, 0, z, 1.1, DECK - 1.2, '#6a6490', { outline: 0.06, seg: 12 }); W.boxes.push({ x0: x - 1.1, y0: 0, z0: z - 1.1, x1: x + 1.1, y1: DECK - 1.2, z1: z + 1.1 });
  }
  // ramps: south on-ramp from the plaza, west on-ramp from the market, east off-ramp to Broadcast Ave
  ramp(4, -45, 16, -17, 'z', DECK, 0, '#4a4466', false, 0, 'asphalt');
  ramp(-68, -101, -40, -89, 'x', 0, DECK, '#4a4466', false, 0, 'asphalt');
  ramp(60, -101, 88, -89, 'x', DECK, 0, '#4a4466', false, 0, 'asphalt');
  // guardrails: three long runs, each one goes up a ramp, around a third of the loop and down the next ramp
  const ROUT = 51.4, dg = (deg) => deg * Math.PI / 180;
  rail([[87, 0.9, -89.6], [61.5, DECK + 0.9, -89.6], ...circ(ROUT, dg(8), dg(82), DECK + 0.9).slice(1), [15.4, DECK + 0.9, -44], [15.4, 0.9, -18]], { color: '#ffd23f', round: 3 });
  rail([[4.6, 0.9, -18], [4.6, DECK + 0.9, -44], ...circ(ROUT, dg(98), dg(172), DECK + 0.9).slice(1), [-41.5, DECK + 0.9, -89.6], [-67, 0.9, -89.6]], { color: '#ffd23f', round: 3 });
  rail([[-67, 0.9, -100.4], [-41.5, DECK + 0.9, -100.4], ...circ(ROUT, dg(188), dg(352), DECK + 0.9).slice(1), [61.5, DECK + 0.9, -100.4], [87, 0.9, -100.4]], { color: '#ffd23f', round: 3 });
  rail(circ(40.6, 0, Math.PI * 2, DECK + 0.9, 1.2), { color: '#ff2e88', loop: true, round: 0 });
  // Decree-88 gridlock: abandoned cars on the deck
  for (const [deg, off, c] of [[210, -2, '#ff7a2f'], [228, 2.5, '#19d3ff'], [250, -1, '#e9e4f5'], [300, 2, '#ffd23f'], [320, -2.5, '#c6ff3d'], [140, 2, '#ff2e88'], [40, -2, '#9b8cff']]) {
    const ang = dg(deg), x = OC.x + Math.cos(ang) * (OR + off), z = OC.z + Math.sin(ang) * (OR + off);
    box(x - 1.1, DECK, z - 1.1, x + 1.1, DECK + 1.5, z + 1.1, c, 'plain', { outlineT: 0.05 });
    box(x - 0.9, DECK + 1.5, z - 0.9, x + 0.9, DECK + 2.1, z + 0.9, '#2a2850', 'plain', { outlineT: 0.04 });
  }
  K.neon(['SPEED LIMIT', '60'], OC.x + 52.5, DECK + 3, OC.z - 14, 4, 3, -Math.PI / 2, { colors: ['#ffffff', '#ff2e88'], bg: '#202040', flicker: false });
  // the Media Tower in the middle, with a balcony on its north face
  bld(-6, -111, 26, -79, 72, '#3b3f8a', '#2a2d5a', '#19d3ff');
  K.screen(V3(10, 30, -78.5), 28, 15.75);
  box(-7, 21.6, -79.6, 27, 38.4, -78.6, '#14101f', 'plain', { outlineT: 0.08 });
  box(-1, 20, -116, 21, 21, -111, '#6a6490', 'plain', { outlineT: 0.06 });
  rail([[-0.6, 21.9, -115.6], [20.6, 21.9, -115.6]], { color: '#19d3ff', posts: false });
  K.neon(['GNN', 'ALWAYS ON'], 10, 46, -110.9, 18, 8, Math.PI, { colors: ['#19d3ff', '#ffffff'], flicker: false });

  // =====================================================================
  //  BROADCAST AVENUE (east): trams, overhead wires, giant ads
  // =====================================================================
  B.box(78, 0, -150, 84, 0.2, 96, WALK, 'paving', flat); B.box(108, 0, -150, 114, 0.2, 150, WALK, 'paving', flat);
  bld(56, -80, 78, 0, 20, '#4a6aaa', '#3a4a7a'); bld(56, 12, 78, 66, 22, '#5a5aaa', '#3a3a7a');
  bld(114, -150, 150, -60, 48, '#3a5a9a', '#2a3a6a'); bld(114, -52, 150, 30, 56, '#4a4a9a', '#2a2a6a'); bld(114, 38, 150, 150, 44, '#5a4a9a', '#3a2a6a');
  K.poster(['TRUST THE NEWS.', 'THE NEWS TRUSTS YOU.'], 113.9, 22, -100, 28, 12, -Math.PI / 2, { bg: PAL.pink });
  K.poster(['THE HUSH', 'IS LISTENING'], 113.9, 26, -10, 26, 11, -Math.PI / 2, { bg: '#ffe08a' });
  K.poster(['DANCE RESPONSIBLY', '60 BPM IS PLENTY'], 113.9, 20, 80, 26, 11, -Math.PI / 2, { bg: PAL.mint });
  K.poster(['SEEN THIS SKATER?', 'CALL 0800-SNITCH'], 77.9, 12, 40, 16, 7, Math.PI / 2, { bg: '#ffe08a' });
  // tram tracks, poles and the overhead wires (two pairs, 2.8 m apart: hop between them)
  for (const x of [91.3, 92.7, 99.3, 100.7]) B.box(x - 0.06, 0, -150, x + 0.06, 0.08, 150, '#9a96b8', 'plain', flat);
  for (let z = -144; z <= 144; z += 24) {
    for (const x of [87.6, 104.4]) cyl(x, 0, z, 0.14, 7.2, '#5b6078', { outline: 0.03, seg: 8 });
    rod(V3(87.6, 6.95, z), V3(104.4, 6.95, z), 0.06, '#5b6078', 0.02);
  }
  for (const x of [90.6, 93.4, 98.6, 101.4]) {
    const pts = []; for (let z = -146; z <= 146; z += 24) pts.push([x, 6.5, z]);
    rail(pts, { kind: 'cable', color: '#14101f', sag: 0.12, posts: false });
  }
  // the gantry over the avenue
  for (const x of [83, 109]) cyl(x, 0, -60, 0.3, 9.6, '#5b6078', { outline: 0.04, seg: 10 });
  box(82.6, 9, -61, 109.4, 9.6, -59, '#3a3550', 'plain', { outlineT: 0.05 });
  K.neon(['BROADCAST AVE', 'NEXT EXIT: COMPLIANCE'], 96, 11.3, -59, 14, 3, 0, { colors: ['#19d3ff', '#ffffff'], double: true });
  rail([[83, 10.5, -60.8], [109, 10.5, -60.8]], { color: '#c6ff3d', posts: false });
  // tram shelters
  for (const z of [-20, 50]) { box(79, 2.9, z - 5, 83.6, 3.2, z + 5, '#8ff0c8', 'plain', { outlineT: 0.05 }); for (const zz of [z - 4.6, z + 4.6]) cyl(79.4, 0.2, zz, 0.08, 2.7, '#3a3550', { outline: 0.02, seg: 6 }); }
  // the avenue bridge over the canal
  box(84, -1, 96, 108, 0, 112, '#6a6490', 'paving', { outlineT: 0.05 });
  // trams: ride on the roof; don't stand in front of one
  const tramMesh = (c) => {
    const g = new THREE.Group();
    g.add(at(part(new THREE.BoxGeometry(2.8, 2.7, 13), c, 0.06), 0, 1.75, 0));
    g.add(at(part(new THREE.BoxGeometry(2.9, 0.9, 12.6), '#14101f', 0.02), 0, 2.2, 0));
    g.add(at(part(new THREE.BoxGeometry(2.6, 0.3, 12.4), '#e9e4f5', 0.03), 0, 3.25, 0));
    const pan = part(new THREE.BoxGeometry(0.1, 2.6, 0.1), '#3a3550', 0); pan.position.set(0, 4.6, -2); pan.rotation.x = 0.5; g.add(pan);
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), basic('#fff3c4')), 0.8 * s, 1.3, 6.52));
    return g;
  };
  K.mover({ path: [[92, -146], [92, 146], [100, 146], [100, -146]], size: [2.8, 3.4, 13], y: 0, speed: 9, visual: tramMesh('#ff2e88'), msg: '<b>HIT BY A TRAM</b><span>The 7:15 to Compliance waits for no one.</span>', phase: 0 });
  K.mover({ path: [[92, -146], [92, 146], [100, 146], [100, -146]], size: [2.8, 3.4, 13], y: 0, speed: 9, visual: tramMesh('#19d3ff'), msg: '<b>HIT BY A TRAM</b><span>The 7:15 to Compliance waits for no one.</span>', phase: 0.5 });

  // =====================================================================
  //  CANAL QUAY (south)
  // =====================================================================
  bld(-150, 124, -60, 150, 10, '#4a3a6a', '#3a2a55'); bld(-50, 128, 20, 150, 12, '#3a3a7a', '#2a2a55'); bld(60, 128, 78, 150, 9, '#5a3a6a', '#3a2a55');
  bld(-56, 78, -6, 90, 7, '#6a3a6a', '#4a2a4a'); bld(10, 78, 56, 90, 8, '#5a3a7a', '#3a2a5a');
  // bridges: a little arched footbridge, a stone bridge and (east) the avenue bridge
  ramp(-103, 90, -97, 104, 'z', 0, 2.6, '#c9a46b', false, -1, 'wood'); ramp(-103, 104, -97, 118, 'z', 2.6, 0, '#c9a46b', false, -1, 'wood');
  for (const x of [-102.6, -97.4]) rail([[x, 0.9, 89], [x, 3.5, 104], [x, 0.9, 119]], { color: '#c97a3c', round: 9 });
  ramp(-6, 90, 6, 104, 'z', 0, 1.8, '#9a96b8', false, -1, 'paving'); ramp(-6, 104, 6, 118, 'z', 1.8, 0, '#9a96b8', false, -1, 'paving');
  for (const x of [-5.6, 5.6]) rail([[x, 0.9, 89], [x, 2.7, 104], [x, 0.9, 119]], { color: '#e9e4f5', round: 9 });
  // quay railings: long runs along both banks, broken only at the bridges
  for (const [z, c] of [[95.2, '#19d3ff'], [112.8, '#19d3ff']]) for (const [x0, x1] of [[-146, -105], [-95, -8.5], [8.5, 82]]) rail([[x0, 0.95, z], [x1, 0.95, z]], { color: c });
  // barges
  box(-64, -1.6, 99, -44, 0.3, 109, '#6a4a3a', 'wood', { outlineT: 0.06 });
  box(-60, 0.3, 101, -54, 2.2, 107, '#c2415a', 'plain', { outlineT: 0.05 });
  box(24, -1.6, 99, 40, 0.3, 109, '#3a5a6a', 'plain', { outlineT: 0.06 });
  // the crane, its beat lift, the jib rail, and a cable out to the avenue wires
  box(28, 0, 114, 32, 18, 118, '#ffd23f', 'plain', { outlineT: 0.08 });
  for (let y = 2; y < 18; y += 2.5) B.box(27.9, y, 113.9, 32.1, y + 0.25, 118.1, '#14101f', 'plain', { outlineT: 0, edges: false });
  box(12, 18, 115.4, 58, 18.6, 116.6, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(52, 18, 113.5, 58, 18.6, 118.5, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(12, 15.6, 114.6, 17, 18, 117.4, '#3a3550', 'plain', { outlineT: 0.05 });
  rail([[12.6, 19.5, 116], [51.4, 19.5, 116]], { color: '#ff2e88', posts: false });
  rod(V3(44, 18, 116), V3(44, 6, 116), 0.04, '#14101f', 0.01); box(43.4, 5.2, 115.4, 44.6, 6, 116.6, '#ff7a2f', 'plain', { outlineT: 0.03 });
  K.lift({ x0: 32.2, z0: 118.2, x1: 36.2, z1: 122.2, y0: 0, y1: 18, postBase: 0, phase: 2 });
  rail([[57.8, 19.4, 116], [89.8, 6.9, 102]], { kind: 'cable', color: '#14101f', sag: 0.3, posts: false });
  K.neon(['GLEAM PORT', 'AUTHORITY'], 30, 9, 113.9, 4, 1.6, Math.PI, { colors: ['#ffd23f', '#ffffff'], flicker: false });

  // ---------- scramblers (relay sites), tapes, pads, drones ----------
  K.relays([
    { id: 1, pos: V3(-100, 0, 24), hint: 'First relay is in the Lantern Market, right where the lanes cross. Plug Bolt’s scrambler into it.' },
    { id: 2, pos: V3(-22.5, DECK, -127.5), hint: 'One is up on the loop overpass, stuck in the traffic jam on the north side. Take a ramp up.' },
    { id: 3, pos: V3(96, 9.6, -60), hint: 'There’s one on the sign gantry over Broadcast Avenue. Jump up from the tram wires, or use the speaker by the kerb.' },
    { id: 4, pos: V3(55, 18.6, 116), hint: 'The port crane by the canal. Its lift rides the beat. The relay’s at the far end of the arm.' },
    { id: 5, pos: V3(10, 21, -114.6), hint: 'Last one: the balcony on the back of the Media Tower. There’s a speaker on the overpass deck right behind it.' },
  ].map(r => Object.assign(r, { style: 'scrambler' })));
  K.tapes([
    { id: 1, pos: V3(-100, 1.2, -45), text: 'TAPE — GNN raw footage: “Okay… ACTION. Blow up the noodle stand. Make sure the Hush logo is in frame. Lovely. Again, with more smoke.”' },
    { id: 2, pos: V3(-94.2, 6.2, -70.5), text: 'TAPE — A lantern seller, whispering: “They pay us to keep the lanterns lit. Cameras inside every one.”' },
    { id: 3, pos: V3(OC.x + Math.cos(dg(320)) * (OR - 2.5), DECK + 2.9, OC.z + Math.sin(dg(320)) * (OR - 2.5)), text: 'TAPE — Traffic report: “All lanes closed for your safety. Forever. Please enjoy the view of the Media Tower.”' },
    { id: 4, pos: V3(-50, 1.2, 104), text: 'TAPE — An old recording of Lull. She’s singing. Her voice is beautiful. Then a door slams, and there is only silence.', dj: 'Hey. Don’t trust the earmuff lady, kid. Just saying.' },
    { id: 5, pos: V3(93.4, 7.2, 134), text: 'TAPE — Bolt, muttering to himself: “Note: the scrambler code has a back door in it. I didn’t put it there. Who put it there?”' },
  ]);
  K.pads([
    { pos: V3(111, 0.2, -66), aim: V3(-11.1, 0, 4.4), vy: 24.5 },
    { pos: V3(10, DECK, -138), aim: V3(0, 0, 15.6), vy: 28 },
  ]);
  K.drones([
    { path: [[-104, 9, 60], [-96, 9, 60], [-96, 9, -60], [-104, 9, -60]], speed: 3.4, phase: 0 },
    { path: [[-14, 7, 10], [24, 7, 10], [24, 7, 42], [-14, 7, 42]], speed: 3, phase: 0.3 },
    { path: [[96, 10, -120], [96, 10, 80]], speed: 3.5, phase: 0.5 },
    { path: [[-30, 13, -130], [50, 13, -130], [50, 13, -60], [-30, 13, -60]], speed: 3.2, phase: 0.6 },
  ]);
  // neon glow pools on the wet ground under the market signs
  for (let z = -64; z < 66; z += 12) for (const x of [-105.5, -94.5]) B.box(x - 1.4, 0.01, z, x + 1.4, 0.02, z + 6, ['#ff2e88', '#19d3ff', '#ffd23f'][Math.abs(z / 12 | 0) % 3], 'glow', flat);
  K.finish();

  // ---------- environment ----------
  W.sky = skyDome({ top: [0.05, 0.03, 0.14], mid: [0.18, 0.08, 0.3], hor: [0.62, 0.2, 0.48], low: [0.12, 0.06, 0.2], cloud: [0.32, 0.2, 0.42], cloudAmt: 0.5, sun: [0.4, 0.35, -0.6], sunC: [0.95, 0.95, 1.0], stripes: false });
  scene.add(W.sky);
  K.cityRing(0, 0, 230, 480, 220, -1, 41);
  K.smileTower(V3(260, -1, -320));
  K.blimp(0, 0, 150, 70, ['STAY INSIDE', 'STAY HAPPY']);
  K.rain(440);
  return W;
}
const _sv = V3(), _sv2 = V3();
