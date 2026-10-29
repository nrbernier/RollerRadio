// ============================================================
//  WORLD 1 — GLEAM CIVIC PARK (daytime, walled in, nowhere to fall)
// ============================================================
function buildPark() {
  const K = makeKit({ key: 'park', name: 'GLEAM CIVIC PARK', spawn: V3(0, 0, 16), spawnYaw: Math.PI, killY: -24,
    env: { fog: [0xcfeeff, 90, 420], clear: 0xbfe6ff, hemi: [0xffffff, 0x7fae6a, 0.66], sun: [0xfff1d6, 0.82, [40, 80, 30]] },
    intro: { A: V3(8.6, 0, -12), sitY: 0.55, wide: { cam: [34, 14, 26], look: [0, 9, -40] } },
    bolt: { pos: V3(6.4, 0, -6.55), yaw: 2.2 } });
  const { W, B, box, ramp, cyl, rod, rail, sphere } = K;
  const scene = W.group;
  const GRASS = '#86d36b', HEDGE = '#2f8f4e', PAVE = '#efe6ff', CONC = '#c9c3dc';
  const flat = { outlineT: 0, edges: false };

  // ---------- ground (with a dip for the pond) ----------
  box(-64, -2, -30, 64, 0, 64, GRASS, 'grass', flat);
  box(-64, -2, -64, 64, 0, -52, GRASS, 'grass', flat);
  box(-64, -2, -52, -54, 0, -30, GRASS, 'grass', flat);
  box(-28, -2, -52, 64, 0, -30, GRASS, 'grass', flat);
  box(-54, -2, -52, -28, -1, -30, '#3f8fb0', 'sand', flat);           // pond floor
  // paths & plaza (visual only, flush with the lawn)
  const pave = (x0, z0, x1, z1, c = PAVE) => B.box(x0, -0.05, z0, x1, 0.03, z1, c, 'paving', { outlineT: 0, edges: false });
  pave(-18, -18, 18, 18);
  pave(-3, -52, 3, -18); pave(-3, 18, 3, 60); pave(18, -3, 60, 3); pave(-60, -3, -18, 3);
  pave(-58, 0, -22, 26, CONC);

  // ---------- perimeter: hedges, then city blocks ----------
  const hedge = (x0, z0, x1, z1, h = 3.5) => box(x0, 0, z0, x1, h, z1, HEDGE, 'leaf', { outlineT: 0.12 });
  hedge(-64, -64, -34, -60); hedge(-26, -64, 64, -60);                 // north (gap = fake hedge)
  hedge(-64, 60, 64, 64); hedge(-64, -60, -60, 60); hedge(60, -60, 64, 60);
  const blk = (x0, z0, x1, z1, top, c, r) => K.bld(x0, z0, x1, z1, top, c, r, '#14101f', -2);
  blk(-100, -100, -38, -64, 24, '#9b8cff', '#a9a2c9'); blk(-38, -100, -22, -74, 30, '#ff8fab', '#b9a7d9');
  blk(-22, -100, 40, -64, 36, '#4fc9c0', '#9fc2c8'); blk(40, -100, 100, -64, 22, '#ffcf3a', '#c9b8a4');
  blk(-100, 64, -20, 100, 20, '#ff7a2f', '#d6b3a0'); blk(-20, 64, 30, 100, 28, '#6a7bff', '#a7aee0'); blk(30, 64, 100, 100, 18, '#e86f9a', '#b3a0c6');
  blk(-100, -64, -64, 0, 30, '#7bd389', '#b7cfb3'); blk(-100, 0, -64, 64, 22, '#ffb3d1', '#e3c2cf');
  blk(64, -64, 100, -10, 26, '#f08bb0', '#b3a0c6'); blk(64, -10, 100, 64, 32, '#9b8cff', '#a9a2c9');

  // ---------- secret garden behind the fake hedge ----------
  box(-38, -2, -74, -22, 0, -64, GRASS, 'grass', flat);
  hedge(-38, -74, -34, -64); hedge(-26, -74, -22, -64); hedge(-34, -74, -26, -70);
  for (const [x, z, c] of [[-32.5, -68.5, '#ff2e88'], [-29.5, -69, '#ffd23f'], [-27.5, -66, '#19d3ff']]) sphere(x, 0.35, z, 0.5, c, { outline: 0.04, seg: 8 });
  // a tiny gnome of the Minister, guarding nothing
  cyl(-27.6, 0, -68.6, 0.35, 0.7, '#3b3f8a', { outline: 0.03 }); sphere(-27.6, 1.0, -68.6, 0.35, '#ffc9a8', { outline: 0.03 }); cyl(-27.6, 1.25, -68.6, 0.3, 0.5, '#ff2e88', { r2: 0.02, outline: 0.03, seg: 8 });

  // ---------- the giant screen (north) + a hidden catwalk behind it ----------
  for (const x of [-11, 10]) box(x, 0, -58.3, x + 1, 6.6, -57.7, '#3a3550', 'plain', { outlineT: 0.06 });
  box(-15, 6.6, -58.4, 15, 23.4, -57.6, '#14101f', 'plain', { outlineT: 0.1 });
  K.screen(V3(0, 15, -57.45), 28.4, 16);
  box(-14, 4.6, -60, 12, 5, -58.4, '#3a3550', 'plain', { outlineT: 0.05 });           // catwalk (reach it from the hedge top)
  rail([[-13.8, 5.9, -59.85], [11.8, 5.9, -59.85]], { color: '#ffd23f' });
  box(13, 0, -59.8, 15, 1.2, -57.8, '#c97a3c', 'wood', { outlineT: 0.05 });           // crates
  box(13.4, 1.2, -59.6, 14.6, 2.2, -58.4, '#c97a3c', 'wood', { outlineT: 0.05 });

  // ---------- central plaza: fountain + statue of Minister Glee ----------
  box(-5, 0, -5, 5, 0.7, -4.4, '#e9e4f5', 'paving', { outlineT: 0.06 });
  box(-5, 0, 4.4, 5, 0.7, 5, '#e9e4f5', 'paving', { outlineT: 0.06 });
  box(-5, 0, -4.4, -4.4, 0.7, 4.4, '#e9e4f5', 'paving', { outlineT: 0.06 });
  box(4.4, 0, -4.4, 5, 0.7, 4.4, '#e9e4f5', 'paving', { outlineT: 0.06 });
  B.box(-4.4, -0.05, -4.4, 4.4, 0.04, 4.4, '#5fb8e0', 'paving', { outlineT: 0, edges: false });
  K.water(-4.4, -4.4, 4.4, 4.4, 0.35);
  rail([[-4.7, 0.72, -4.7], [4.7, 0.72, -4.7], [4.7, 0.72, 4.7], [-4.7, 0.72, 4.7], [-4.7, 0.72, -4.65]], { hidden: true });
  box(-1.3, 0, -1.3, 1.3, 2.2, 1.3, '#d9d4ea', 'paving', { outlineT: 0.06 });
  cyl(0, 2.2, 0, 0.95, 2.2, '#3b3f8a', { outline: 0.06, r2: 0.7 });
  sphere(0, 5.05, 0, 1.1, '#ffc9a8', { outline: 0.06, seg: 16 });
  cyl(0, 5.85, 0, 1.6, 0.12, '#14101f', { outline: 0.03, seg: 18 });
  cyl(0, 5.95, 0, 1.15, 0.85, '#14101f', { outline: 0.05, seg: 18 });
  W.boxes.push({ x0: -1.3, y0: 2.2, z0: -1.3, x1: 1.3, y1: 6.8, z1: 1.3 });
  {
    const ft = canvasTex(128, 128, (x) => {
      x.clearRect(0, 0, 128, 128); x.strokeStyle = PAL.ink; x.lineWidth = 7; x.lineCap = 'round';
      x.beginPath(); x.arc(42, 56, 12, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke(); x.beginPath(); x.arc(86, 56, 12, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke();
      x.fillStyle = '#7a1f3d'; x.beginPath(); x.ellipse(64, 82, 26, 14, 0, 0, Math.PI); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,90,140,.4)'; x.beginPath(); x.arc(28, 74, 9, 0, 7); x.arc(100, 74, 9, 0, 7); x.fill();
    }).tex;
    const face = new THREE.Mesh(new THREE.SphereGeometry(1.115, 16, 12, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.8, 1.6), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false }));
    face.position.set(0, 5.05, 0); scene.add(face);
  }
  W.fountain = { jets: [V3(-1.6, 0.4, -1.6), V3(1.6, 0.4, -1.6), V3(-1.6, 0.4, 1.6), V3(1.6, 0.4, 1.6)] };
  // benches, lamps, trees around the plaza
  K.bench(8.6, -12, true); K.bench(-8.6, -12, true); K.bench(8.6, 12, true); K.bench(-8.6, 12, true);
  K.bench(12.2, 8.6, false); K.bench(-12.2, -8.6, false);
  for (const [x, z] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) K.lamp(x, z);
  for (const [x, z] of [[-22, -22], [22, -22], [-22, 22], [22, 22], [-24, -8], [24, 10], [10, -26], [-10, 26], [8, 30], [-12, -34], [12, -40], [-6, 44], [16, 50], [-14, 54]]) K.tree(x, z, 0, { h: 3 + (Math.abs(x * z) % 3) * 0.4, r: 2.1 + (Math.abs(x + z) % 3) * 0.2, color: ['#3fbf6a', '#55c95a', '#2fae6a'][Math.abs(x + 2 * z) % 3] });
  K.poster(['PARK RULES', 'NO RUNNING · NO SINGING · NO SKATING · SMILE'], -9, 1.7, -18.4, 5, 1.6, 0, { bg: PAL.mint, smiley: false, w: 512, h: 160 });
  cyl(-11.2, 0, -18.45, 0.07, 1.2, '#3a3550', { outline: 0.02 }); cyl(-6.8, 0, -18.45, 0.07, 1.2, '#3a3550', { outline: 0.02 });

  // ---------- EAST: the bandstand + BEAT LIFT to its roof ----------
  box(33, 0, -7, 47, 1.2, 7, '#c97a3c', 'wood', { outlineT: 0.08 });
  ramp(29, -3, 33, 3, 'x', 0, 1.2, '#c97a3c', false, 0, 'wood');
  for (const [x, z] of [[33.5, -6.5], [46.5, -6.5], [33.5, 6.5], [46.5, 6.5]]) { cyl(x, 1.2, z, 0.3, 5.8, '#f4f1ff', { outline: 0.05 }); W.boxes.push({ x0: x - 0.32, y0: 1.2, z0: z - 0.32, x1: x + 0.32, y1: 7, z1: z + 0.32 }); }
  box(32, 7, -8, 48, 7.5, 8, '#ff2e88', 'plain', { outlineT: 0.1 });
  B.box(31.8, 6.75, -8.2, 48.2, 7.05, 8.2, '#ffd23f', 'plain', { outlineT: 0, edges: false });
  box(34, 1.2, -6, 35.6, 3.6, -4, '#14101f', 'plain', { outlineT: 0.05 });
  box(34, 1.2, 4, 35.6, 3.6, 6, '#14101f', 'plain', { outlineT: 0.05 });
  rail([[32.3, 8.1, -7.7], [47.7, 8.1, -7.7], [47.7, 8.1, 7.7], [32.3, 8.1, 7.7], [32.3, 8.1, -7.65]], { color: '#ffd23f' });
  K.lift({ x0: 48.2, z0: -2, x1: 52.2, z1: 2, y0: 0, y1: 7.5, postBase: 0 });
  K.poster(['BEAT LIFT', 'HOP ON — IT RIDES THE BEAT'], 53.4, 3.1, 0, 4.2, 1.3, -Math.PI / 2, { bg: PAL.yellow, smiley: false, w: 512, h: 160 });
  cyl(53.5, 0, -2, 0.08, 3.6, '#5b4a6b', { outline: 0.02 }); cyl(53.5, 0, 2, 0.08, 3.6, '#5b4a6b', { outline: 0.02 });
  K.tree(52, -16, 0, { h: 3.4 }); K.tree(56, 18, 0, { h: 3 }); K.tree(26, -14, 0, { h: 3.2, color: '#55c95a' });

  // ---------- WEST: skate zone ----------
  box(-60, 0, 2, -54, 3, 22, '#b8b3c9', 'paving', { outlineT: 0.08 });                 // deck
  ramp(-54, 2, -48, 22, 'x', 3, 0, '#9b8cff');                                          // big quarter pipe
  rail([[-54.05, 3.05, 2.6], [-54.05, 3.05, 21.4]], { color: '#ffd23f', posts: false }); // coping
  box(-41, 0, 8, -35, 1, 16, '#ff7a2f', 'paving', { outlineT: 0.07 });                 // funbox
  ramp(-45, 8, -41, 16, 'x', 0, 1, '#ff7a2f'); ramp(-35, 8, -31, 16, 'x', 1, 0, '#ff7a2f');
  rail([[-41, 1.55, 12], [-35, 1.55, 12]], { color: '#19d3ff' });
  rail([[-48, 0.75, 24.5], [-28, 0.75, 24.5]], { color: '#19d3ff' });
  rail([[-46, 0.75, 4.5], [-32, 0.75, 4.5]], { color: '#ff2e88' });
  ramp(-30, 18, -26, 22, 'x', 1.6, 0, '#ffd23f');                                       // kicker → west
  K.poster(['SKATING IS PROHIBITED', 'IN THE SKATE PARK'], -40, 2.2, 0.6, 6, 1.7, 0, { bg: '#ffe08a', smiley: false, w: 512, h: 150 });
  cyl(-42.8, 0, 0.55, 0.07, 1.4, '#3a3550', { outline: 0.02 }); cyl(-37.2, 0, 0.55, 0.07, 1.4, '#3a3550', { outline: 0.02 });

  // ---------- NORTH-WEST: the pond + island ----------
  K.water(-54, -52, -28, -30, -0.35);
  box(-47, -1, -46, -36, 0.6, -36, GRASS, 'grass', { outlineT: 0.06 });
  rail([[-27, 0.95, -41], [-36.4, 1.25, -41]], { color: '#c97a3c' });                   // boardwalk rail
  ramp(-31, -36, -28, -32, 'x', -1, 0, '#c9a46b', false, -1, 'wood');
  ramp(-50, -33, -46, -30, 'z', -1, 0, '#c9a46b', false, -1, 'wood');
  K.tree(-44, -43.5, 0.6, { h: 2.4, r: 1.6, color: '#55c95a' });
  for (const [x, z] of [[-48, -46], [-34, -48], [-50, -36], [-32, -34]]) cyl(x, -0.33, z, 0.9, 0.04, '#4fae6a', { outline: 0.02, seg: 10 });
  K.poster(['SWIMMING IS', 'A PRIVILEGE'], -25.7, 1.6, -46, 4.4, 1.6, Math.PI / 2, { bg: PAL.mint, w: 512, h: 180 });
  cyl(-25.8, 0, -47.9, 0.07, 1.6, '#3a3550', { outline: 0.02 }); cyl(-25.8, 0, -44.1, 0.07, 1.6, '#3a3550', { outline: 0.02 });

  // ---------- NORTH-EAST: the gardening shed (beat shutter) ----------
  box(34, 0, -46, 46, 4, -45.6, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(34, 0, -46, 34.4, 4, -36, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(45.6, 0, -46, 46, 4, -36, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(34, 0, -36.4, 38.25, 4, -36, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(41.75, 0, -36.4, 46, 4, -36, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(38.25, 3.1, -36.4, 41.75, 4, -36, '#c6ff3d', 'plain', { outlineT: 0.05 });
  box(33.7, 4, -46.3, 46.3, 4.4, -35.7, '#14101f', 'plain', { outlineT: 0.05 });
  K.shutter({ face: 'z', c: -36.2, a0: 38.25, a1: 41.75, y0: 0, h: 3.1 });
  K.poster(['MINISTRY GARDENING', 'NO FUN BEYOND THIS POINT'], 43.9, 2.2, -35.95, 3.4, 0.75, 0, { bg: PAL.mint, smiley: false, w: 512, h: 112 });
  box(28, 0, -30, 50, 0.3, -27, '#ff8fab', 'plain', { outlineT: 0.04 });
  box(50.5, 0, -46, 54, 0.3, -32, '#ffd23f', 'plain', { outlineT: 0.04 });
  for (let i = 0; i < 9; i++) sphere(29.5 + i * 2.4, 0.55, -28.5, 0.45, ['#ff2e88', '#ffd23f', '#19d3ff', '#ffffff'][i % 4], { outline: 0.03, seg: 8 });
  K.tree(56, -50, 0, { h: 3.6 }); K.tree(28, -50, 0, { h: 3 });

  // ---------- SOUTH-WEST: grassy hill with a tunnel ----------
  box(-50, -2, 32, -26, 3.5, 40, GRASS, 'grass', { outlineT: 0.08 });
  box(-50, -2, 44, -26, 3.5, 52, GRASS, 'grass', { outlineT: 0.08 });
  box(-50, 2.6, 40, -26, 3.5, 44, GRASS, 'grass', { outlineT: 0.04 });
  for (const x of [-46, -38, -30]) B.box(x, 2.5, 41.4, x + 1.2, 2.6, 42.6, '#fff3c4', 'plain', { outlineT: 0, edges: false });
  ramp(-50, 26, -26, 32, 'z', 0, 3.5, GRASS, false, 0, 'grass');
  ramp(-26, 32, -20, 40, 'x', 3.5, 0, GRASS, false, 0, 'grass');
  ramp(-26, 44, -20, 52, 'x', 3.5, 0, GRASS, false, 0, 'grass');
  sphere(-23.2, 0.9, 41.1, 1.5, HEDGE, { kind: 'leaf', outline: 0.08 });                 // bushes you can push through
  sphere(-23.6, 0.8, 43.1, 1.3, HEDGE, { kind: 'leaf', outline: 0.08 });
  rail([[-48.6, 4.4, 32.2], [-48.6, 0.9, 26.4]], { color: '#ff2e88' });
  K.tree(-38, 36, 3.5, { h: 3 }); K.tree(-31, 48, 3.5, { h: 2.6, color: '#55c95a' }); K.tree(-46, 48, 3.5, { h: 3.2 });

  // ---------- SOUTH-EAST: playground ----------
  box(28, 0, 32, 38, 0.3, 42, '#ffe08a', 'sand', { outlineT: 0.05 });
  box(42, 0, 32, 44, 1.2, 34, '#19d3ff', 'plain', { outlineT: 0.05 });
  box(44, 0, 32, 46.5, 2.5, 34, '#ff2e88', 'plain', { outlineT: 0.05 });
  ramp(46.5, 32, 53, 34, 'x', 2.5, 0, '#ffd23f');
  rail([[46.5, 3.0, 32.1], [53, 0.55, 32.1]], { color: '#ff2e88', posts: false });
  rail([[46.5, 3.0, 33.9], [53, 0.55, 33.9]], { color: '#ff2e88', posts: false });
  for (const x of [36, 46]) for (const dz of [-1.2, 1.2]) rod(V3(x, 0, 50 + dz), V3(x, 3.05, 50), 0.09, '#6a3df0', 0.03);
  rail([[36, 3.05, 50], [46, 3.05, 50]], { color: '#ff2e88', posts: false });           // swing bar: grind it!
  box(46.6, 0, 49.3, 48, 1.5, 50.7, '#19d3ff', 'plain', { outlineT: 0.05 });             // step up to the bar
  K.bench(41, 53, true);
  box(30.5, 0, 49.5, 35.5, 0.3, 54.5, '#9b8cff', 'plain', { outlineT: 0.05 });          // merry-go-round base
  K.tree(54, 54, 0, { h: 7, r: 3, top: 2, color: '#2fae6a' });                          // the tallest tree
  K.tree(24, 56, 0, { h: 3 }); K.tree(56, 30, 0, { h: 3.4 });

  // ---------- relays, tapes, pads, drones ----------
  K.relays([
    { id: 1, pos: V3(14, 0, -4), hint: 'There’s one right by the fountain, kid. Just skate into it!' },
    { id: 2, pos: V3(-57, 3, 12), hint: 'One is up on the skate deck, west side. Ride the big purple ramp straight up onto it.' },
    { id: 3, pos: V3(40, 0, -42), hint: 'The Ministry locked one in the gardening shed, north-east. That door opens on beats ONE and TWO. Count it.' },
    { id: 4, pos: V3(-41, 0.6, -41), hint: 'One’s on the little island in the pond. Jump onto the boardwalk rail and grind across.' },
    { id: 5, pos: V3(40, 7.5, 0), hint: 'Last one’s on top of the bandstand. The beat lift behind it rides the music. Smile at the drones!' },
  ]);
  K.tapes([
    { id: 1, pos: V3(-30, 0.9, -67), text: 'TAPE — Park Rules, 1974 edition. Rule 1: “Have fun.” Rule 1 has been crossed out in red pen.' },
    { id: 2, pos: V3(-38, 0.9, 42), text: 'TAPE — Birdsong. The birds are singing at 104 BPM. The birds are under investigation.' },
    { id: 3, pos: V3(0, 7.6, 0), text: 'TAPE — Minister Glee’s inauguration: “I will make every citizen happy. Whether they like it or not.”' },
    { id: 4, pos: V3(10.5, 5.9, -59.2), text: 'TAPE — Screen maintenance log: “Pirate signal came through again. Left the back door open, as instructed.” …Instructed by whom?', dj: 'Back door? Ha! Those techs are SO sloppy. Lucky us.' },
    { id: 5, pos: V3(54, 12.3, 54), text: 'TAPE — Bolt’s first mixtape: “Beats To Not Get Arrested To”. Side B is him whispering “sorry” over a drum loop.' },
  ]);
  K.pads([
    { pos: V3(0, 0, 2.9), aim: V3(0, 0, -2.6), vy: 20.5 },
    { pos: V3(52, 0, 46), aim: V3(1.55, 0, 6.2), vy: 25.5 },
  ]);
  K.drones([
    { path: [[-14, 6, -14], [14, 6, -14], [14, 6, 14], [-14, 6, 14]], speed: 3, phase: 0 },
    { path: [[34, 11.5, -6], [46, 11.5, -6], [46, 11.5, 6], [34, 11.5, 6]], speed: 2.6, phase: 0.4 },
    { path: [[-50, 6.5, 4], [-30, 6.5, 4], [-30, 6.5, 22], [-50, 6.5, 22]], speed: 2.4, phase: 0.7 },
  ]);
  K.finish();

  // ---------- environment ----------
  W.sky = skyDome({ top: [0.22, 0.5, 0.95], mid: [0.55, 0.82, 1.0], hor: [1.0, 0.93, 0.78], low: [0.62, 0.75, 0.88], cloud: [1, 1, 1], cloudAmt: 0.85, sun: [0.35, 0.55, -0.6], sunC: [1, 0.97, 0.82], stripes: false });
  scene.add(W.sky);
  K.cityRing(0, 0, 130, 380, 220, -2, 31);
  K.smileTower(V3(150, -2, -250));
  K.blimp(0, -10, 90, 40, ['PARKS ARE', 'FOR SITTING']);
  K.poster(['SMILE!', "IT'S THE LAW"], 0, 12, 63.95, 16, 8, Math.PI, { bg: PAL.mint });
  K.poster(['TRUST THE NEWS.', 'THE NEWS TRUSTS YOU.'], 63.95, 12, -30, 16, 8, -Math.PI / 2, { bg: PAL.pink });
  K.poster(['CURIOSITY:', 'NOT EVEN ONCE'], -63.95, 12, 30, 16, 8, Math.PI / 2, { bg: '#ffe08a' });
  K.poster(['REPORT', 'UNSMILING NEIGHBORS'], 63.95, 12, 34, 16, 8, -Math.PI / 2, { bg: PAL.mint, accent: PAL.pink });
  K.poster(['NOTHING BEHIND', 'THIS HEDGE'], -30, 1.6, -59.85, 4.6, 1.6, 0, { bg: PAL.mint, smiley: false, w: 512, h: 170 });
  K.sticker('1-2!', 37, 1.6, -35.95, 0, 1.3);
  K.sticker('UP!', 14.2, 1.7, -57.75, 0, 1.2);
  K.floorArrow(-50, 0, 12, Math.PI / 2, PAL.yellow, 3);
  K.floorArrow(-18.6, 0, 42, Math.PI / 2, PAL.cyan, 2);
  K.floorArrow(56.5, 0, 0, Math.PI / 2, PAL.magenta, 2.4);

  // ---------- the fake hedge: it dances, because it's a hologram ----------
  {
    const fake = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 4), new THREE.MeshToonMaterial({ color: HEDGE, map: worldMaterials().leaf.map, gradientMap: G.grad, transparent: true, opacity: 0.96 }));
    fake.position.set(-30, 1.75, -62); scene.add(fake);
    W.dyn.push({ update(dt, bi) {
      const k = Math.exp(-bi.phase * 6);
      fake.scale.set(1 + k * 0.035, 1 + k * 0.06, 1); fake.position.y = 1.75 + k * 0.1;
      fake.material.opacity = Math.random() < 0.01 ? 0.45 : 0.96;
    } });
  }
  // ---------- swings that swing to the beat, a merry-go-round, ducks, stage speakers ----------
  {
    const swings = [];
    for (const x of [38.5, 41, 43.5]) {
      const pv = new THREE.Group(); pv.position.set(x, 3.0, 50); scene.add(pv);
      for (const dx of [-0.35, 0.35]) { const r = part(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 4), '#3a3550', 0); r.position.set(dx, -1.1, 0); pv.add(r); }
      pv.add(at(part(new THREE.BoxGeometry(0.9, 0.1, 0.45), '#ffd23f', 0.03), 0, -2.2, 0));
      swings.push(pv);
    }
    const mgr = new THREE.Group(); mgr.position.set(33, 0.3, 52); scene.add(mgr);
    mgr.add(at(part(new THREE.CylinderGeometry(2.3, 2.3, 0.2, 20), '#ff2e88', 0.04), 0, 0.1, 0));
    for (let i = 0; i < 4; i++) { const b = part(new THREE.BoxGeometry(0.08, 1, 0.08), '#ffd23f', 0.02); b.position.set(Math.cos(i * Math.PI / 2) * 1.8, 0.7, Math.sin(i * Math.PI / 2) * 1.8); mgr.add(b); }
    const ducks = [];
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Group(); scene.add(d);
      d.add(at(part(new THREE.SphereGeometry(0.35, 10, 8), '#ffd23f', 0.03), 0, 0, 0));
      d.add(at(part(new THREE.SphereGeometry(0.22, 10, 8), '#ffd23f', 0.03), 0.25, 0.3, 0));
      d.add(at(part(new THREE.ConeGeometry(0.08, 0.2, 6), '#ff7a2f', 0), 0.48, 0.28, 0));
      d.children[2].rotation.z = -Math.PI / 2;
      ducks.push({ d, a: i * 1.6, r: 4 + i * 1.3, cx: -46 + (i % 2) * 10, cz: -36 - Math.floor(i / 2) * 8 });
    }
    const cones = [];
    for (const z of [-5, 5]) { const c = part(new THREE.CylinderGeometry(0.55, 0.35, 0.12, 14), '#ffd23f', 0.02); c.rotation.z = Math.PI / 2; c.position.set(35.65, 2.4, z); scene.add(c); cones.push(c); }
    W.dyn.push({ update(dt, bi) {
      const sw = Math.sin((bi.b % 2) / 2 * Math.PI * 2);
      swings.forEach((s, i) => { s.rotation.z = sw * (0.5 + i * 0.1) * (i % 2 ? -1 : 1); });
      mgr.rotation.y += dt * (0.4 + W.relaysOn() * 0.35);
      for (const k of ducks) { k.a += dt * 0.25; k.d.position.set(k.cx + Math.cos(k.a) * k.r * 0.4, -0.3 + Math.sin(bi.b * Math.PI) * 0.05, k.cz + Math.sin(k.a) * k.r * 0.3); k.d.rotation.y = -k.a; }
      const kick = Math.exp(-bi.phase * 7);
      for (const c of cones) c.scale.set(1 + kick * 0.3, 1, 1 + kick * 0.3);
    } });
  }
  return W;
}
