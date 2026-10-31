// ============================================================
//  WORLD 2 — UPPER GLEAM ROOFTOPS (sunset, long drops)
// ============================================================
function buildRooftops() {
  const K = makeKit({ key: 'roof', name: 'UPPER GLEAM ROOFTOPS', spawn: V3(3, 0, 3), spawnYaw: Math.PI, killY: -24,
    env: { fog: [0xffa27a, 70, 330], clear: 0xff9d6b, hemi: [0xffe7d6, 0x6b4fa0, 0.62], sun: [0xffd7a8, 0.78, [-60, 45, 30]] },
    intro: { A: V3(6, 0, -11.65), sitY: 0, wide: { cam: [24, 7.5, 18], look: [3, 10, -40] } },
    bolt: { pos: V3(3.8, 0, -6.2), yaw: 2.2 } });
  const { W, B, box, bld, ramp, cyl, rod, rail, ac } = K;
  const scene = W.group;

  // ---------- the rooftops ----------
  bld(-12, -12, 12, 12, 0, '#ff8fab', '#b9a7d9', '#6a3df0');      // A — Bolt's roof (start)
  bld(18, -10, 42, 14, 1, '#4fc9c0', '#9fc2c8', '#ffd23f');       // B — east
  bld(-14, -50, 16, -22, 4, '#ffcf3a', '#c9b8a4', '#ff2e88');     // C — broadcast roof
  bld(-46, -24, -20, 10, -2, '#9b8cff', '#a9a2c9', '#ff7a2f');    // D — laundry roof
  bld(-38, -38, -28, -28, 14, '#ff7a2f', '#d6b3a0', '#14101f');   // E — the tall tower
  bld(-10, 22, 30, 46, 1, '#7bd389', '#b7cfb3', '#ff2e88');       // F — noodle roof
  bld(48, -36, 70, -8, 9, '#6a7bff', '#a7aee0', '#c6ff3d');       // H — ministry antenna roof
  bld(46, 24, 64, 50, -5, '#ffb3d1', '#e3c2cf', '#6a3df0');       // G — hidden courtyard
  bld(64, 18, 72, 56, 7, '#e86f9a', '#b3a0c6', '#14101f');
  bld(40, 18, 64, 24, 7, '#f08bb0', '#b3a0c6', '#14101f');
  bld(40, 50, 64, 56, 7, '#f08bb0', '#b3a0c6', '#14101f');
  bld(40, 24, 46, 29.5, 7, '#e86f9a', '#b3a0c6', '#14101f');
  bld(40, 34.5, 46, 50, 7, '#e86f9a', '#b3a0c6', '#14101f');
  box(40, STREET, 29.5, 46, 0.7, 34.5, '#e86f9a', 'building');
  box(40, 3.9, 29.5, 46, 7, 34.5, '#e86f9a', 'building', { roofColor: '#b3a0c6' });
  // B's secret balcony
  box(42, STREET, 2, 46, -4, 10, '#4fc9c0', 'building', { roofColor: '#9fc2c8' });
  box(46, -4, 1.5, 46.5, -2.8, 10.5, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(42, -4, 1.5, 46, -2.8, 2, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(42, -4, 10, 46, -2.8, 10.5, '#ffd23f', 'plain', { outlineT: 0.06 });
  box(46.5, STREET, 1.5, 47, -4, 10.5, '#4fc9c0', 'building');

  // ---------- bridges & kickers ----------
  ramp(7, -2, 11, 2, 'x', 0, 2.2, '#ffd23f', false, 0);
  ramp(-2.5, -22, 2.5, -12, 'z', 4, 0, '#c9a46b', true);
  ramp(3, 12, 8, 22, 'z', 0, 1, '#c9a46b', true);
  ramp(-24, -6, -20, -2, 'x', -2, -0.2, '#ff7a2f', false, -2);
  ramp(26, -6, 30, -1, 'x', 1, 2.4, '#ff2e88', false, 1);
  ramp(-6, -36, -2, -32, 'z', 5.6, 4, '#ff2e88', false, 4);
  for (const [x, z, y] of [[-2.2, -17, 2], [2.2, -17, 2], [3.3, 17, 0.5], [7.7, 17, 0.5]]) cyl(x, STREET + 30, z, 0.12, y - 0.4 - (STREET + 30), '#6b5a7a', { outline: 0.03 });

  // ---------- A: water tower, AC units ----------
  const waterTower = (x, z, base, col) => {
    for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) cyl(x + dx, base, z + dz, 0.13, 3, '#5b4a6b', { outline: 0.03 });
    cyl(x, base + 3, z, 2.2, 3, col, { seg: 16, outline: 0.1 });
    cyl(x, base + 5.95, z, 2.3, 0.2, '#14101f', { seg: 16, outline: 0.02 });
    for (let i = 0; i < 3; i++) cyl(x, base + 3.6 + i * 0.9, z, 2.24, 0.12, '#14101f', { seg: 16, outline: 0 });
    W.boxes.push({ x0: x - 1.9, y0: base + 3, z0: z - 1.9, x1: x + 1.9, y1: base + 6.1, z1: z + 1.9 });
  };
  waterTower(-7, -7, 0, '#8ff0c8');
  ac(5, -8, 0); ac(8, -8, 0); ac(-8, 6, 0, 3, 1.4, 2);
  ac(24, 8, 1); ac(33, -7.5, 1, 2, 1.2, 2, '#ffd23f'); ac(36, 10, 1);

  // ---------- C: giant screen + the holographic kiosk ----------
  for (const x of [-4, 12]) box(x - 0.5, 4, -49.6, x + 0.5, 9, -48.6, '#3a3550', 'plain', { outlineT: 0.06 });
  box(-6.6, 8.6, -50.2, 14.6, 20.4, -49.4, '#14101f', 'plain', { outlineT: 0.1 });
  box(-13, 4, -46, -12.5, 8, -38, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13, 4, -46, -7, 8, -45.5, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13, 4, -38.5, -7, 8, -38, '#ff2e88', 'plain', { outlineT: 0.07 });
  box(-13.3, 8, -46.3, -6.7, 8.5, -37.7, '#14101f', 'plain', { outlineT: 0.06 });
  ac(8, -30, 4, 3, 1.4, 2); ac(12, -40, 4); ac(-8, -26, 4, 2, 1, 2, '#ffd23f');
  K.screen(V3(4, 14.5, -49.35), 20.4, 11.5);

  // ---------- D: laundry + the storage shed (beat shutter) ----------
  box(-42, -2, -6, -32, 2, -5.6, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-42, -2, 3.6, -32, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-42, -2, -6, -41.6, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, -2, -6, -32, 2, -2, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, -2, 1.5, -32, 2, 4, '#c6ff3d', 'plain', { outlineT: 0.07 });
  box(-32.4, 1.15, -2, -32, 2, 1.5, '#c6ff3d', 'plain', { outlineT: 0.05 });
  box(-42.3, 2, -6.3, -31.7, 2.4, 4.3, '#14101f', 'plain', { outlineT: 0.05 });
  for (const [x, z] of [[-44, 8], [-22, 8], [-44, -12], [-36, -12]]) cyl(x, -2, z, 0.1, 1.6, '#5b4a6b', { outline: 0.03 });
  ac(-26, 4, -2, 2, 1.2, 2.5);
  K.shutter({ face: 'x', c: -32.2, a0: -2, a1: 1.5, y0: -2, h: 3.15 });

  // ---------- E: antenna mast platform ----------
  box(-31.5, 14, -36.5, -29.5, 16.5, -34.5, '#14101f', 'plain', { outlineT: 0.06 });
  cyl(-30.5, 16.5, -35.5, 0.12, 6, '#d9d4ea', { outline: 0.03 });

  // ---------- F: AC cluster hiding the vent; the duct into G ----------
  ac(17.5, 29, 1, 2, 1.6, 2.2); ac(17.5, 35.5, 1, 2, 1.6, 2.2); ac(19.7, 37.6, 1, 2.4, 1.2, 1.8);
  ac(4, 30, 1, 3, 1.3, 2); ac(-4, 40, 1);
  box(30, 0.7, 29.5, 40, 1, 34.5, '#b8b3c9', 'plain', { outlineT: 0.05 });
  box(22, 1, 29.5, 40, 3.6, 30, '#b8b3c9', 'plain', { outlineT: 0.06 });
  box(22, 1, 34, 40, 3.6, 34.5, '#b8b3c9', 'plain', { outlineT: 0.06 });
  box(22, 3.6, 29.5, 40, 3.9, 34.5, '#b8b3c9', 'plain', { outlineT: 0.06 });
  for (let x = 24; x < 40; x += 3) {
    B.box(x, 3.9, 29.35, x + 0.3, 4.05, 34.65, '#7a7590', 'plain', { outlineT: 0, edges: false });
    B.box(x, 1, 29.35, x + 0.3, 3.9, 29.5, '#7a7590', 'plain', { outlineT: 0, edges: false });
    B.box(x, 1, 34.5, x + 0.3, 3.9, 34.65, '#7a7590', 'plain', { outlineT: 0, edges: false });
  }
  for (const x of [27, 33, 39]) B.box(x, 3.5, 31.4, x + 1.2, 3.6, 32.6, '#fff3c4', 'plain', { outlineT: 0, edges: false });
  box(40, 0.7, 29.5, 46, 1, 34.5, '#b8b3c9', 'plain', { outlineT: 0 });
  box(40, 1, 29.5, 46, 3.9, 30, '#b8b3c9', 'plain', { outlineT: 0 });
  box(40, 1, 34, 46, 3.9, 34.5, '#b8b3c9', 'plain', { outlineT: 0 });

  // ---------- H: water tank, AC, propaganda board ----------
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) cyl(54 + dx, 9, -30 + dz, 0.13, 2, '#5b4a6b', { outline: 0.03 });
  cyl(54, 11, -30, 2.1, 1.8, '#ffd23f', { seg: 16, outline: 0.1 });
  W.boxes.push({ x0: 52.1, y0: 11, z0: -31.9, x1: 55.9, y1: 12.8, z1: -28.1 });
  ac(57.5, -30, 9, 2, 1.5, 2, '#e9e4f5'); ac(60, -14, 9, 3, 1.3, 2); ac(66, -20, 9);
  box(50, 9, -35.6, 62, 15.5, -35, '#14101f', 'plain', { outlineT: 0.08 });

  // ministry "jammer" antennas
  for (const [x, y, z] of [[9, 0, 9], [-10, 4, -48], [40, 1, -8], [-44, -2, -22], [28, 1, 44], [68, 9, -10], [62, 7, 20], [-33, 14, -37]]) {
    cyl(x, y, z, 0.25, 0.4, '#3a3550', { outline: 0.03 });
    cyl(x, y + 0.4, z, 0.08, 4.5, '#d9d4ea', { outline: 0.025, r2: 0.05 });
    for (let i = 0; i < 3; i++) rod(V3(x - 0.6 + i * 0.05, y + 2 + i * 0.9, z), V3(x + 0.6 - i * 0.05, y + 2 + i * 0.9, z), 0.03, '#d9d4ea', 0.02);
  }

  // ---------- rails: long ledge runs that wrap around building corners ----------
  const RL = { round: 2.2 };
  // roof A: two runs around the edges (a gap at the kicker), the north one aims at the plank to C
  rail([[-11.4, 0.9, -4], [-11.4, 0.9, 11.4], [11.4, 0.9, 11.4], [11.4, 0.9, 4]], { color: '#19d3ff', ...RL });
  rail([[11.5, 1.15, 7], [18.5, 2.1, 7]], { kind: 'cable', color: '#14101f', sag: 0.4 });           // A → B power line
  rail([[-11.5, 1.05, 2], [-20.5, -0.85, 2]], { kind: 'cable', color: '#14101f', sag: 0.4 });       // A → D
  rail([[2.7, 0.95, 12.5], [2.7, 1.95, 21.5]], { color: '#ffd23f' });                                 // plank A → F
  rail([[-2.85, 0.95, -12.5], [-2.85, 4.95, -21.5]], { color: '#ffd23f' });                           // plank A → C
  // roof B: a U around three sides, then a bridge over the street onto A's north edge, aimed at the plank to C
  rail([[19, 1.9, 13.4], [41.4, 1.9, 13.4], [41.4, 1.9, -9.4], [19, 1.9, -9.4], [11.4, 0.9, -11.4], [3.4, 0.9, -11.4]], { color: '#ff2e88', ...RL });
  // roof C: along the south ledge, round the corner and up the east side, then in front of the screen
  rail([[-13.4, 5.0, -22.6], [15.4, 5.0, -22.6], [15.4, 5.0, -46.6], [8, 5.0, -46.6]], { color: '#19d3ff', ...RL });
  rail([[-13.5, 4.95, -28], [-24, -1.05, -18]], { kind: 'cable', color: '#14101f', sag: 0.5 });      // C → D long slide
  // roof D: west edge, round the corner along the south edge; laundry lines in the middle
  rail([[-21.6, -1, -23.4], [-45.4, -1, -23.4], [-45.4, -1, 9.4], [-30, -1, 9.4]], { color: '#ff7a2f', ...RL });
  rail([[-44, -0.55, 5.5], [-24, -0.55, 5.5]], { kind: 'cable', color: '#f4f1ff', laundry: true, sag: 0.3 });
  rail([[-44, -0.55, -12], [-36, -0.55, -12]], { kind: 'cable', color: '#f4f1ff', laundry: true, sag: 0.3 });
  // tower E: a loop around the top, and the zipline down to A
  rail([[-37.4, 14.9, -37.4], [-28.6, 14.9, -37.4], [-28.6, 14.9, -29.4], [-37.4, 14.9, -29.4]], { color: '#ffd23f', loop: true, round: 1.4 });
  rail([[-28.6, 15.8, -28.2], [-2, 1.3, -4]], { kind: 'cable', color: '#14101f', sag: 0.25 });
  // roof F: neon run along the south edge, round the corner, along the west and back east
  rail([[26, 2.8, 45.4], [-9.4, 2.8, 45.4], [-9.4, 1.9, 22.6], [2, 1.9, 22.6]], { color: '#ff2e88', ...RL });
  // the courtyard rim: a square loop on top of the walls
  rail([[46.6, 7.9, 24.6], [63.4, 7.9, 24.6], [63.4, 7.9, 49.4], [46.6, 7.9, 49.4]], { color: '#ffd23f', loop: true, round: 2 });
  // roof H: along the south and east edges, then the "dive" — a rail bridge down to Billboard Row
  rail([[49, 10, -9.4], [69.4, 10, -9.4], [69.4, 10, -33], [70.2, 8.4, -42], [71, 6.9, -50.5]], { color: '#c6ff3d', round: 4 });
  rail([[-37.5, 15, -29], [-37.5, 15, -37]], { hidden: true });

  // ---------- the BEAT LIFT (B → H) ----------
  K.lift({ x0: 42, z0: -13, x1: 48, z1: -7, y0: 1, y1: 9, postBase: STREET });
  K.poster(['BEAT LIFT', 'HOP ON — IT RIDES THE BEAT'], 40, 3.2, -9.9, 4.2, 1.3, 0, { bg: PAL.yellow, smiley: false, w: 512, h: 160 });
  cyl(38.4, 1, -10.1, 0.08, 2.6, '#5b4a6b', { outline: 0.02 }); cyl(41.6, 1, -10.1, 0.08, 2.6, '#5b4a6b', { outline: 0.02 });

  // =====================================================================
  //  BILLBOARD ROW (north-east): giant ads on scaffolds, reached by the dive from H
  // =====================================================================
  bld(52, -66, 80, -48, 6, '#9b8cff', '#a9a2c9', '#ffd23f');        // BR1
  bld(86, -78, 110, -52, 3, '#4fc9c0', '#9fc2c8', '#ff2e88');       // BR2 (lower)
  bld(58, -106, 84, -82, 12, '#ff7a2f', '#d6b3a0', '#14101f');      // BR3 (tall, the antenna roof)
  bld(22, -122, 50, -84, 8, '#ffcf3a', '#c9b8a4', '#6a3df0');       // BR4 (billboard alley)
  // BR1: an east ledge rail that becomes a bridge down to BR2
  rail([[53, 6.9, -48.6], [79.4, 6.9, -48.6], [79.4, 6.9, -64], [84.5, 5.0, -66], [88.5, 3.9, -66]], { color: '#ff2e88', round: 3 });
  // BR2: a ring rail and the launch pad up to BR3
  rail([[86.6, 3.9, -77.4], [109.4, 3.9, -77.4], [109.4, 3.9, -52.6], [92, 3.9, -52.6]], { color: '#19d3ff', ...RL });
  ac(98, -60, 3); ac(104, -70, 3, 3, 1.4, 2, '#ffd23f');
  // BR3: antenna mast, catwalk ring, and a long zipline home to H
  box(68, 12, -96, 74, 14.5, -90, '#14101f', 'plain', { outlineT: 0.06 });
  cyl(71, 14.5, -93, 0.3, 14, '#d9d4ea', { outline: 0.04, r2: 0.12 });
  for (let i = 0; i < 4; i++) rod(V3(69 + i * 0.1, 18 + i * 3, -93), V3(73 - i * 0.1, 18 + i * 3, -93), 0.05, '#d9d4ea', 0.02);
  rail([[58.6, 12.9, -82.6], [83.4, 12.9, -82.6], [83.4, 12.9, -105.4], [58.6, 12.9, -105.4]], { color: '#c6ff3d', loop: true, round: 2.5 });
  rail([[71, 15.4, -89.4], [66, 10.9, -29]], { kind: 'cable', color: '#14101f', sag: 0.3 });   // zipline home to H
  // BR4: three giant billboards on scaffolds with a catwalk running along their tops
  for (const [x0, x1, lines, bg] of [[24, 30, ['YOUR FEED', 'LOVES YOU'], PAL.mint], [33, 39, ['DANCING IS', 'A GATEWAY'], PAL.pink], [42, 48, ['THE HUSH', 'WANTS YOUR EARS'], '#ffe08a']]) {
    for (const x of [x0, x1]) for (const z of [-104, -102]) cyl(x, 8, z, 0.15, 10, '#5b4a6b', { outline: 0.03, seg: 6 });
    box(x0 - 1, 12, -103.6, x1 + 1, 18, -103.2, '#14101f', 'plain', { outlineT: 0.06 });
    K.poster(lines, (x0 + x1) / 2, 15, -103.15, x1 - x0 + 1.6, 5.6, 0, { bg, double: true });
  }
  box(23, 17.9, -103.8, 49, 18.2, -102.6, '#3a3550', 'plain', { outlineT: 0.04 });
  rail([[23.2, 18.9, -103.2], [48.8, 18.9, -103.2]], { color: '#ffd23f', posts: false });
  rail([[49.5, 18.6, -103.2], [58.6, 13.6, -95]], { kind: 'cable', color: '#14101f', sag: 0.3 });   // catwalk → BR3
  rail([[58.4, 13.4, -105.2], [49, 8.9, -112]], { kind: 'cable', color: '#14101f', sag: 0.3 });        // BR3 → BR4 roof
  ramp(24, -88, 34, -84, 'z', 8, 9.6, '#ff2e88', false, 8);
  ac(30, -114, 8); ac(44, -116, 8, 3, 1.4, 2);
  K.lift({ x0: 36, z0: -100, x1: 40, z1: -96, y0: 8, y1: 17.9, postBase: 8, phase: 4 });

  // ---------- relays, tapes, pads, drones ----------
  K.relays([
    { id: 1, pos: V3(34, 1, 4), hint: 'One’s right out in the open on the teal roof east. Kick off the yellow ramp!' },
    { id: 2, pos: V3(-37.5, -2, -1), hint: 'The Ministry locked one in their storage shed on the purple roof. That door moves to the beat. Count it…' },
    { id: 3, pos: V3(-33, 14, -32.5), hint: 'Top of the orange tower. Those speaker pads launch you higher if you jump ON the beat.' },
    { id: 4, pos: V3(57, -5, 43), hint: 'My signal says one is boxed in somewhere south-east. No doors. Maybe… a vent?' },
    { id: 5, pos: V3(76, 12, -100), hint: 'The last one is way out on Billboard Row, on the antenna roof. Ride the beat lift up to the blue Ministry roof, then take the green dive rail off its corner.' },
  ]);
  K.tapes([
    { id: 1, pos: V3(-10, 4.9, -42), text: 'TAPE — “Grandma’s Jazz Hour, 1987.” Confiscated for excessive saxophone.' },
    { id: 2, pos: V3(35, 1.9, 32), text: 'TAPE — Minister Glee singing in the shower. Classified. Extremely off-key.' },
    { id: 3, pos: V3(-30.5, 17.4, -35.5), text: 'TAPE — Ministry memo: “Pirate broadcasts up 300%. Excellent. Proceed as planned.” …Excellent?', dj: 'Ministry memos? Pfft. They write those to confuse us. Don’t overthink it.' },
    { id: 4, pos: V3(44, -3.1, 8.5), text: 'TAPE — A voice that sounds a LOT like DJ Static saying “Yes, Minister.” Probably a coincidence.', dj: 'Uh. Where’d you find THAT? That’s a… remix. Satire! Very edgy satire. Moving on.' },
    { id: 5, pos: V3(54, 13.7, -30), text: 'TAPE — Bolt’s demo tape, labelled “DO NOT LISTEN”. It’s… actually really good.' },
  ]);
  K.pads([
    { pos: V3(-33, -2, -19.5), aim: V3(0, 0, -6.6), vy: 30.5 },
    { pos: V3(44, -4, 6), aim: V3(-5.2, 0, 0), vy: 20.5 },
    { pos: V3(51, -5, 32), aim: V3(-5.4, 0, 0), vy: 26.8 },
    { pos: V3(94, 3, -72), aim: V3(-10.2, 0, -10.2), vy: 25.5 },
  ]);
  K.drones([
    { path: [[52, 13, -13], [66, 13, -13], [66, 13, -33], [52, 13, -33]], speed: 3.2, phase: 0 },
    { path: [[66, 13, -24], [52, 13, -24], [52, 13, -16], [66, 13, -16]], speed: 2.6, phase: 0.5 },
    { path: [[-4, 10, -27], [12, 10, -27], [12, 10, -44], [-4, 10, -44]], speed: 3, phase: 0.2 },
    { path: [[-6, 5.5, 26], [24, 5.5, 26], [24, 5.5, 42], [-6, 5.5, 42]], speed: 2.6, phase: 0.7 },
    { path: [[60, 17, -84], [82, 17, -84], [82, 17, -104], [60, 17, -104]], speed: 3.4, phase: 0.1 },
  ]);
  K.finish();

  // ---------- environment ----------
  W.sky = skyDome({}); scene.add(W.sky);
  K.cityRing(30, -40, 150, 420, 260, STREET, 11);
  K.smileTower(V3(220, STREET, -300));
  K.blimp(15, -10, 95, 34);
  {
    const st = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#3a2a55'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a1f40'; x.fillRect(0, 200, w, 112); x.fillRect(200, 0, 112, h);
      x.fillStyle = '#ffd23f'; for (let i = 0; i < w; i += 40) { x.fillRect(i, 254, 22, 4); x.fillRect(254, i, 4, 22); }
    }, { repeat: true }).tex;
    st.repeat.set(12, 12);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshBasicMaterial({ map: st }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = STREET; scene.add(plane);
    const N = 60; const pg = new THREE.BufferGeometry(); const arr = new Float32Array(N * 3);
    pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe9a0, size: 1.6, sizeAttenuation: true })));
    const cars = []; const rr = U.rng(5);
    for (let i = 0; i < N; i++) cars.push({ lane: Math.floor(rr() * 6), t: rr() * 600, sp: 8 + rr() * 10, dir: rr() < 0.5 ? 1 : -1 });
    W.dyn.push({ update(dt) {
      for (let i = 0; i < N; i++) {
        const c = cars[i]; c.t += c.sp * dt * c.dir;
        const lane = (c.lane % 3) * 40 - 40 + 15, tt = ((c.t % 600) + 600) % 600 - 300;
        if (c.lane < 3) { arr[i * 3] = tt; arr[i * 3 + 1] = STREET + 0.5; arr[i * 3 + 2] = lane; }
        else { arr[i * 3] = lane - 10; arr[i * 3 + 1] = STREET + 0.5; arr[i * 3 + 2] = tt; }
      }
      pg.attributes.position.needsUpdate = true;
    } });
  }
  // posters & stickers
  K.poster(['SMILE!', "IT'S THE LAW"], 9, 0, -21.9, 12, 6, 0, { bg: PAL.mint });
  K.poster(['REPORT', 'UNSMILING NEIGHBORS'], 17.9, -4, 2, 12, 6, -Math.PI / 2, { bg: PAL.pink, accent: PAL.mint });
  K.poster(['CURIOSITY:', 'NOT EVEN ONCE'], -19.9, -6, -6, 12, 6, Math.PI / 2, { bg: '#ffe08a' });
  K.poster(['NAP FOR', 'THE NATION'], 10, -3, 21.9, 12, 6, Math.PI, { bg: PAL.mint });
  K.poster(['TRUST THE NEWS.', 'THE NEWS TRUSTS YOU.'], 47.9, 4, -22, 14, 7, -Math.PI / 2, { bg: PAL.pink });
  K.poster(['DECREE 88', 'KEEP IT SLOW ♪=60'], 56, 12.4, -34.9, 11.4, 6, 0, { bg: '#ffe08a', accent: PAL.mint });
  K.poster(['MINISTRY STORAGE', 'ABSOLUTELY NO DANCING'], -31.95, 1.55, -0.25, 3.4, 0.75, Math.PI / 2, { bg: PAL.mint, smiley: false, w: 512, h: 112 });
  K.sticker('DROP IN', 41.9, 0.2, 6, Math.PI / 2, 2.2);
  K.sticker('1-2!', -31.9, 0.5, 2.6, Math.PI / 2, 1.4);
  K.sticker('PSST!', 16.45, 1.9, 29, -Math.PI / 2, 1.5);
  K.sticker('LOOK!', -6.9, 7.2, -37.4, Math.PI / 2 + 0.4, 1.4);
  K.floorArrow(39, 1, 6, -Math.PI / 2);
  K.floorArrow(14, 1, 32, -Math.PI / 2, PAL.cyan);
  K.floorArrow(-28, -2, -12, Math.PI, PAL.yellow);
  // the kiosk front is a hologram
  {
    const hc = canvasTex(512, 384, (x, w, h, t = 0) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = 'rgba(25,211,255,.55)'; x.fillRect(0, 0, w, h);
      drawSmiley(x, w / 2, h * 0.36, 80, 'rgba(255,210,63,.95)');
      x.fillStyle = '#fff'; x.font = `44px ${FONT.display}`; x.textAlign = 'center'; x.fillText('NOTHING TO SEE', w / 2, h * 0.74); x.fillText('HERE. MOVE ALONG.', w / 2, h * 0.88);
      x.fillStyle = 'rgba(255,255,255,.22)'; for (let y = (t * 60) % 8; y < h; y += 8) x.fillRect(0, y, w, 3);
    });
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.8), new THREE.MeshBasicMaterial({ map: hc.tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false }));
    holo.position.set(-7, 6, -42); holo.rotation.y = Math.PI / 2; scene.add(holo);
    let t = 0, acc = 0;
    W.dyn.push({ update(dt) {
      t += dt; acc += dt;
      if (acc > 0.08) { acc = 0; hc.redraw(t); }
      const glitch = Math.sin(t * 3.1) > 0.97 || Math.random() < 0.01;
      holo.material.opacity = glitch ? 0.25 : 0.82 + Math.sin(t * 40) * 0.06;
      holo.position.z = -42 + (glitch ? (Math.random() - 0.5) * 0.4 : 0);
    } });
  }
  // neon noodle sign
  {
    const nc = canvasTex(512, 160, (x, w, h, on = 1) => {
      x.fillStyle = '#1b0f2e'; x.fillRect(0, 0, w, h);
      x.font = `62px ${FONT.display}`; x.textBaseline = 'middle';
      x.shadowColor = on ? PAL.magenta : 'transparent'; x.shadowBlur = 24;
      x.fillStyle = on ? '#ffb3d1' : '#5a3a55'; x.fillText('GLEAM', 24, 80);
      x.shadowColor = on ? PAL.cyan : 'transparent'; x.fillStyle = on ? '#bff4ff' : '#3a5560'; x.fillText('NOODLES', 236, 80);
      x.shadowBlur = 0; x.fillStyle = PAL.yellow; x.font = `18px ${FONT.dot}`; x.fillText('APPROVED FLAVOR™ — MILD ONLY', 120, 140);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.75), new THREE.MeshBasicMaterial({ map: nc.tex }));
    sign.position.set(9, 4.2, 45.95); sign.rotation.y = Math.PI; scene.add(sign);
    const back = part(new THREE.BoxGeometry(12.4, 4.1, 0.3), '#14101f', 0.05); back.position.set(9, 4.2, 46.15); scene.add(back);
    let lastOn = 1;
    W.dyn.push({ update(dt, bi) { const on = (bi.inBar === 0 && bi.phase < 0.12) ? 0 : 1; if (on !== lastOn) { lastOn = on; nc.redraw(on); } } });
  }
  return W;
}
