// ============================================================
//  WORLD 5 — THE DEEP BEAT (the sewers)
//  Districts: the Overflow Canals (west) · the Pipe Cathedral (centre) ·
//  the Waterfall Terraces (north) · the Pumping Station (south) ·
//  the Mood Engine (east). Deep water everywhere at y -2.6, walkways at y 0.
// ============================================================
function buildSewers() {
  const K = makeKit({ key: 'sewers', name: 'THE DEEP BEAT', night: true, spawn: V3(-163, 0, 11.5), spawnYaw: Math.PI / 2, killY: -24,
    objName: 'VALVES', deepMsg: '<b>FISHED OUT</b><span>Something in the water pushed you back up. It hummed at sixty beats per minute.</span>',
    env: { fog: [0x0b1c18, 45, 260], clear: 0x050a08, hemi: [0x9affd0, 0x0a1a10, 0.75], sun: [0xd8ffe8, 0.35, [0, 80, 20]] },
    intro: { A: V3(-163, 0, 11.5) }, bolt: null, lull: { pos: V3(-155.5, 0, 13), yaw: -1.6, sign: 'OPEN 5 VALVES ON THE BEAT' },
    orbit: { x: 150, y: 20, z: 0, r: 40, h: 12, look: 8 } });
  const { W, B, box, cyl, rod, rail } = K;
  const scene = W.group;
  const BRK = '#9a8a78', WALK = '#8a8070', flat = { outlineT: 0, edges: false };
  const wall = (x0, y0, z0, x1, y1, z1, c = BRK) => box(x0, y0, z0, x1, y1, z1, c, 'brick', { outlineT: 0.08, uvScale: 4 });
  const roof = (x0, y0, z0, x1, y1, z1, c = '#6a5e52') => box(x0, y0, z0, x1, y1, z1, c, 'brick', { outlineT: 0, uvScale: 4, nocam: true });
  const walk = (x0, z0, x1, z1, top = 0, c = WALK) => box(x0, -4.5, z0, x1, top, z1, c, 'paving', { outlineT: 0.06 });
  const glow = (x, y, z, c, w = 2, d = 0.6) => B.box(x - w / 2, y - 0.12, z - d / 2, x + w / 2, y, z + d / 2, c, 'glow', flat);
  const grate = (x0, z0, x1, z1) => { box(x0, -0.3, z0, x1, 0, z1, '#5b6078', 'plain', { outlineT: 0.04 }); };
  const outlet = (x, y, z, dz) => rod(V3(x, y, z), V3(x, y, z + dz), 2.2, '#8a8fa8', 0.06);
  const PIPE = { kind: 'pipe', color: '#8a8fa8', collar: '#5b6078', round: 5, radius: 0.42 };
  const COPPER = { kind: 'pipe', color: '#c9844a', collar: '#8a5a3a', round: 5, radius: 0.42 };

  // ---------- the water and the sludge floor under it ----------
  box(-212, -7, -142, 252, -4.5, 142, '#1a2a24', 'plain', flat);
  K.water(-212, -142, 252, 142, -2.6, '#2fd38a', true);

  // =====================================================================
  //  THE OVERFLOW CANALS (west): a long brick canal with walkways each side
  // =====================================================================
  walk(-200, -16, -10, -6); walk(-200, 6, -10, 16);
  wall(-202, -4.5, -18, -128, 12, -16); wall(-104, -4.5, -18, -11, 12, -16); wall(-128, 8, -18, -104, 12, -16);
  wall(-202, -4.5, 16, -88, 12, 18); wall(-64, -4.5, 16, -11, 12, 18); wall(-88, 8, 16, -64, 12, 18);
  wall(-204, -4.5, -18, -200, 12, 18);
  roof(-204, 12, -18, -11, 14, 18);
  for (const x of [-170, -116, -60]) { grate(x - 2, -6, x + 2, 6); for (let z = -5; z < 6; z += 1) B.box(x - 2, 0, z, x + 2, 0.02, z + 0.12, '#2a2a3a', 'plain', flat); }
  for (let x = -196; x < -14; x += 12) { glow(x, 11.9, -11, '#7affb0', 3); glow(x, 11.9, 11, '#7affb0', 3); }
  // north branch (a dead end with a waterfall)
  walk(-128, -60, -122, -16); walk(-110, -60, -104, -16);
  wall(-130, -4.5, -62, -128, 12, -18); wall(-104, -4.5, -62, -102, 12, -18); wall(-130, -4.5, -64, -102, 12, -62);
  roof(-130, 12, -64, -102, 14, -18);
  grate(-122, -42, -110, -38);
  outlet(-116, 7.4, -63, 2.6); K.waterfall(-118.5, -113.5, -60.5, 7.4, -2.6);
  // south branch (the first valve waits at the end)
  walk(-88, 16, -82, 60); walk(-70, 16, -64, 60);
  wall(-90, -4.5, 18, -88, 12, 62); wall(-64, -4.5, 18, -62, 12, 62); wall(-90, -4.5, 62, -62, 12, 64);
  roof(-90, 12, 18, -62, 14, 64);
  grate(-82, 38, -70, 42);
  outlet(-76, 7.4, 63, -2.6); K.waterfall(-78.5, -73.5, 60.5, 7.4, -2.6);
  for (let z = -56; z < -18; z += 10) glow(-116, 11.9, z, '#7affb0', 3);
  for (let z = 22; z < 60; z += 10) glow(-76, 11.9, z, '#7affb0', 3);
  // pipes along both walls (rippling up and down), stopping at the branch mouths
  rail(pWave([-198, 2.8, -15], [-133, 2.8, -15], 0.9, 3), { ...PIPE, round: 0 });
  rail(pWave([-99, 2.8, -15], [-16, 2.8, -15], 0.9, 3), { ...PIPE, round: 0 });
  rail(pWave([-198, 3.0, 15], [-93, 3.0, 15], 1.0, 4), { ...COPPER, round: 0 });
  rail(pWave([-59, 3.0, 15], [-16, 3.0, 15], 1.0, 2), { ...COPPER, round: 0 });
  // the branch loops: up one side, across the waterfall, back down the other, and out along the main canal
  rail([[-150, 2.2, -10], [-136, 2.6, -10], [-126, 4.4, -16], [-127, 2.6, -36], [-127, 2.6, -58], [-105, 2.6, -58.8], [-105, 2.6, -36], [-106, 4.4, -16], [-96, 2.6, -10], [-84, 2.2, -10]], { ...PIPE, round: 4 });
  rail([[-104, 2.2, 10], [-96, 2.6, 10], [-86, 4.4, 16], [-87, 2.6, 36], [-87, 2.6, 58], [-65, 2.6, 58.8], [-65, 2.6, 36], [-66, 4.4, 16], [-56, 2.6, 10], [-44, 2.2, 10]], { ...PIPE, round: 4 });
  // the high copper snake, weaving over the water from the start to the cathedral corridor
  rail([[-196, 1.2, 10.4], [-180, 4, 5], [-160, 7, 0], [-130, 6, -3], [-100, 7.5, 2], [-74, 6.5, 0], [-52, 4.5, 4], [-32, 2.4, 10.5], [-16, 2.2, 11]], { ...COPPER, round: 8 });
  K.poster(['THE MINISTRY OF GOOD VIBES', 'THANKS YOU FOR FLUSHING'], -150, 7, 15.9, 14, 3.5, Math.PI, { bg: PAL.mint, smiley: false });
  K.poster(['NOTHING DOWN HERE', 'PLEASE GO BACK UP'], -40, 7, -15.9, 14, 3.5, 0, { bg: '#ffe08a', smiley: false });
  K.sticker('HUSH', -125, 3, -17.9, 0); K.sticker('HUSH', -66, 3, 17.9, Math.PI);

  // =====================================================================
  //  THE PIPE CATHEDRAL (centre (30, 0), radius 46)
  // =====================================================================
  const C = { x: 30, z: 0 }, CR = 46;
  K.ringDeck(C.x, C.z, 30, 46, 0, { color: WALK, kind: 'paving', thick: 4.5 });
  K.ringDeck(C.x, C.z, 0.5, 9, 0, { color: '#a89a88', kind: 'paving', thick: 4.5 });
  K.cylWall(C.x, C.z, CR, -4.5, 44, BRK, [[Math.PI - 0.36, Math.PI + 0.36], [-Math.PI / 2 - 0.14, -Math.PI / 2 + 0.14], [Math.PI / 2 - 0.14, Math.PI / 2 + 0.14], [-0.14, 0.14]]);
  wall(-17.5, 12, -17, -15.5, 44, 17); wall(23, 26, -47.5, 37, 44, -45.5); wall(23, 26, 45.5, 37, 44, 47.5);
  wall(75.5, 12, -7, 77.5, 19, 7); wall(75.5, 29, -7, 77.5, 44, 7);
  roof(-17, 44, -47, 77, 46, 47);
  cyl(C.x, 0, C.z, 4, 44, '#7a6a5a', { outline: 0.1, seg: 20 });
  W.boxes.push({ x0: C.x - 3.6, y0: 0, z0: C.z - 3.6, x1: C.x + 3.6, y1: 44, z1: C.z + 3.6 });
  for (let k = 0; k < 12; k++) {
    const a = (k + 0.5) / 12 * Math.PI * 2, x = C.x + Math.cos(a) * 30.8, z = C.z + Math.sin(a) * 30.8;
    cyl(x, -4.5, z, 1.3, 48.5, '#8a7a68', { outline: 0.07, seg: 12 }); W.boxes.push({ x0: x - 1.2, y0: -4.5, z0: z - 1.2, x1: x + 1.2, y1: 44, z1: z + 1.2 });
    glow(x, 12, z, '#ffc87a', 1.6, 1.6);
  }
  // bridges to the central island, with copper railings to grind
  box(-0.5, -1, -2, 21.5, 0, 2, '#6a5e52', 'paving', { outlineT: 0.05 }); box(38.5, -1, -2, 60.5, 0, 2, '#6a5e52', 'paving', { outlineT: 0.05 });
  box(28, -1, -30.5, 32, 0, -8.5, '#6a5e52', 'paving', { outlineT: 0.05 }); box(28, -1, 8.5, 32, 0, 30.5, '#6a5e52', 'paving', { outlineT: 0.05 });
  for (const s of [-2.2, 2.2]) { rail([[0, 0.9, s], [21, 0.9, s]], { color: '#c9844a' }); rail([[39, 0.9, s], [60, 0.9, s]], { color: '#c9844a' }); rail([[C.x + s, 0.9, -30], [C.x + s, 0.9, -9]], { color: '#c9844a' }); rail([[C.x + s, 0.9, 9], [C.x + s, 0.9, 30]], { color: '#c9844a' }); }
  // the great spiral: a pipe winding 3.5 times around the central column up to the top platform.
  // It starts at the end of the west bridge, heading east, and comes off the top tangent onto the platform.
  {
    const r = 6.5, a0 = -Math.PI / 2, turns = 3.5, aEnd = a0 + turns * Math.PI * 2;
    const ex = C.x + Math.cos(aEnd) * r, ez = C.z + Math.sin(aEnd) * r, tx = -Math.sin(aEnd), tz = Math.cos(aEnd);
    rail([[21.6, 1.0, -2.5], [26, 1.1, -6.2], ...pHelix(C.x, C.z, r, a0, turns, 1.2, 31.9).slice(1), [ex + tx * 5, 31.9, ez + tz * 5]], { ...COPPER, round: 2, minSpeed: 12 });
  }
  K.ringDeck(C.x, C.z, 8, 14, 31, { color: '#6a5e52', kind: 'paving', thick: 0.6 });
  {   // a low parapet round the top platform, open where the pipes leave
    const pg = []; for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) pg.push([a - 0.16, a + 0.16]);
    K.cylWall(C.x, C.z, 14, 31, 32.1, '#8a7a68', pg, 'brick');
    rail(pArc(C.x, C.z, 13.6, 0.2, Math.PI / 2 - 0.2, 32.2, 32.2, 1), { color: '#ffc87a', posts: false }); rail(pArc(C.x, C.z, 13.6, Math.PI / 2 + 0.2, Math.PI - 0.2, 32.2, 32.2, 1), { color: '#ffc87a', posts: false });
    rail(pArc(C.x, C.z, 13.6, Math.PI + 0.2, Math.PI * 1.5 - 0.2, 32.2, 32.2, 1), { color: '#ffc87a', posts: false }); rail(pArc(C.x, C.z, 13.6, -Math.PI / 2 + 0.2, -0.2, 32.2, 32.2, 1), { color: '#ffc87a', posts: false });
  }
  for (let k = 0; k < 6; k++) { const a = (k + 0.5) / 6 * Math.PI * 2; rod(V3(C.x + Math.cos(a) * 13.4, 30.5, C.z + Math.sin(a) * 13.4), V3(C.x + Math.cos(a) * 13.4, 44, C.z + Math.sin(a) * 13.4), 0.14, '#5a4e42', 0.03); }
  // the gallery ring at y 20 (it runs straight into the high corridor to the Mood Engine), and a beat lift up to it
  K.ringDeck(C.x, C.z, 39, 45.5, 20, { color: '#7a6e62', kind: 'paving', thick: 0.8 });
  rail(pArc(C.x, C.z, 39.4, 0, Math.PI * 2, 20.9, 20.9, 1.2), { color: '#ffc87a', loop: true, round: 0, posts: false });
  K.lift({ x0: 59.2, z0: 16, x1: 63.2, z1: 20, y0: 0, y1: 20, postBase: 0, phase: 0 });
  // pipes radiating down from the top platform: east to the Mood Engine, north to the terraces,
  // south to the pumps, west back down into the canals
  rail([[41.8, 31.8, -1.6], [56, 27.6, -1.6], [70, 23.4, -0.8], [80, 21.2, 0], [112, 20.9, 0]], { ...PIPE, round: 6 });
  rail([[C.x - 1.6, 31.8, -11.8], [C.x - 1.6, 27.2, -30], [C.x, 22.2, -50], [32, 19, -82], [34, 17.6, -106], [44, 16.9, -121], [58.4, 16.9, -128.6]], { ...PIPE, round: 8 });
  rail([[C.x + 1.6, 31.8, 11.8], [C.x + 1.6, 27.2, 30], [C.x, 22.2, 50], [30, 19.6, 70], [26, 16.9, 116]], { ...PIPE, round: 8 });
  rail([[18.2, 31.8, 1.6], [4, 24, 1.6], [-14, 10.5, 1], [-26, 6.5, -4], [-40, 3, -10.5], [-62, 2.2, -10.5]], { ...COPPER, round: 6 });
  K.poster(['OBEY THE BEAT', 'THE BEAT IS SIXTY'], C.x, 38, -45.3, 22, 6, 0, { bg: '#ffe08a', smiley: false });
  K.poster(['RELAX.', 'THE ENGINE IS LISTENING.'], C.x, 38, 45.3, 22, 6, Math.PI, { bg: PAL.mint, smiley: false });

  // =====================================================================
  //  THE WATERFALL TERRACES (north): three ledges, falls between them
  // =====================================================================
  walk(24, -60, 36, -44); wall(22, -4.5, -60, 24, 34, -45.4); wall(36, -4.5, -60, 38, 34, -45.4); roof(22, 34, -60, 38, 36, -45.4);
  walk(0, -75, 70, -60, 0, '#7a8a80'); walk(0, -102, 70, -80, 8, '#7a8a80'); walk(0, -137, 70, -107, 16, '#7a8a80');
  wall(-2, -4.5, -137, 0, 34, -60); wall(70, -4.5, -137, 72, 34, -60); wall(-2, -4.5, -139, 72, 34, -137);
  wall(-2, -4.5, -62, 22, 34, -60); wall(38, -4.5, -62, 72, 34, -60); wall(22, 26, -62, 38, 34, -60);
  roof(-2, 34, -139, 72, 36, -60);
  K.waterfall(4, 28, -80.3, 8, -2.6); K.waterfall(42, 66, -80.3, 8, -2.6);
  K.waterfall(8, 30, -107.3, 16, -2.6); K.waterfall(40, 62, -107.3, 16, -2.6);
  outlet(18, 30, -137, 2); outlet(52, 30, -137, 2); K.waterfall(15.5, 20.5, -135.2, 30, 16); K.waterfall(49.5, 54.5, -135.2, 30, 16);
  for (let x = 6; x < 70; x += 12) { glow(x, 33.9, -70, '#9ff8ff', 3); glow(x, 33.9, -92, '#9ff8ff', 3); glow(x, 33.9, -120, '#9ff8ff', 3); }
  // a long pipe that zigzags down all three terraces (the way back after the valve)
  rail([[66, 16.9, -131], [40, 16.9, -127], [8, 16.9, -123], [5, 16.9, -110], [5, 11, -99], [14, 8.9, -93], [40, 8.9, -89], [62, 8.9, -86], [66, 8.9, -81], [64, 3, -74], [46, 0.9, -69], [30, 0.9, -66], [30, 0.9, -54]], { ...COPPER, round: 6 });
  // ledge railings to grind along the falls
  rail([[2, 8.9, -80.6], [33, 8.9, -80.6]], { color: '#9ff8ff' }); rail([[37, 8.9, -80.6], [68, 8.9, -80.6]], { color: '#9ff8ff' });
  rail([[2, 16.9, -107.6], [68, 16.9, -107.6]], { color: '#9ff8ff' });
  K.poster(['WATER IS CALM.', 'BE LIKE WATER.'], 35, 26, -136.9, 20, 6, 0, { bg: PAL.mint });

  // =====================================================================
  //  THE PUMPING STATION (south): a staircase of pistons rising on the beat
  // =====================================================================
  walk(24, 44, 36, 60); wall(22, -4.5, 45.4, 24, 34, 60); wall(36, -4.5, 45.4, 38, 34, 60); roof(22, 34, 45.4, 38, 36, 60);
  walk(-4, 60, 94, 132, 0, '#8a7a6a');
  wall(-6, -4.5, 58, -4, 34, 134); wall(94, -4.5, 58, 96, 34, 134); wall(-6, -4.5, 132, 96, 34, 134);
  wall(-4, -4.5, 58, 22, 34, 60); wall(38, -4.5, 58, 94, 34, 60); wall(22, 26, 58, 38, 34, 60);
  roof(-6, 34, 58, 96, 36, 134);
  box(-4, 15.4, 117, 94, 16, 132, '#5b5048', 'paving', { outlineT: 0.06 });
  for (let x = 2; x < 94; x += 14) cyl(x, 0, 117.6, 0.35, 15.4, '#5b6078', { outline: 0.03, seg: 8 });
  rail([[-3, 16.9, 117.4], [93, 16.9, 117.4]], { color: '#ffc87a', posts: false });
  // the pistons: each one tops out just as the next one bottoms. Jump across on the beat.
  const pistons = [[0, 92, 0, 6, 0], [12.5, 96, 4, 10, 2], [25, 100, 8, 14, 4], [37.5, 104, 12, 18, 6]];
  for (const [x, z, y0, y1, ph] of pistons) {
    if (y0 > 0) box(x + 0.3, 0, z + 0.3, x + 9.7, y0 - 0.5, z + 9.7, '#5b5048', 'plain', { outlineT: 0.06 });
    else cyl(x + 5, -4.5, z + 5, 4.4, 4.5, '#5b5048', { outline: 0.05, seg: 16 });
    K.lift({ x0: x, z0: z, x1: x + 10, z1: z + 10, y0, y1, phase: ph, piston: true, color: '#8a3a5a' });
  }
  K.floorArrow(5, 0, 88, Math.PI, '#ffd23f', 3);
  // big pump tanks
  for (const [x, z, h] of [[62, 100, 10], [78, 100, 12], [70, 84, 8]]) { cyl(x, 0, z, 5, h, '#7a8a9a', { outline: 0.1, seg: 20 }); cyl(x, h, z, 3.5, 0.6, '#5b6078', { outline: 0.05, seg: 16 }); W.boxes.push({ x0: x - 4.3, y0: 0, z0: z - 4.3, x1: x + 4.3, y1: h, z1: z + 4.3 }); }
  // the pressure pipe: from the catwalk's east end, down round the tanks and out the door
  rail([[90, 16.9, 121], [90, 14, 106], [86, 11, 90], [74, 7.5, 76], [50, 4.5, 72], [30, 1.4, 67], [30, 1.2, 54]], { ...COPPER, round: 7 });
  rail(pWave([-2, 2.6, 64], [20, 2.6, 64], 0.6, 1), { ...PIPE, round: 0 });
  rail(pWave([40, 2.6, 64], [92, 2.6, 64], 0.9, 2), { ...PIPE, round: 0 });
  for (let x = 6; x < 94; x += 14) { glow(x, 33.9, 80, '#ffc87a', 3); glow(x, 33.9, 110, '#ffc87a', 3); }
  K.neon(['PUMP STATION 88', 'PRESSURE: MANDATORY'], 45, 24, 131.9, 16, 4, Math.PI, { colors: ['#ffc87a', '#ffffff'] });

  // =====================================================================
  //  THE MOOD ENGINE (east): a colossal metronome in a flooded pit
  // =====================================================================
  walk(74, -4, 92, 4); wall(75.6, -4.5, -6, 92, 12, -4); wall(75.6, -4.5, 4, 92, 12, 6); roof(75.6, 12, -6, 92, 14, 6);
  box(76, 19.2, -3, 133, 20, 3, '#5b5048', 'paving', { outlineT: 0.05 });
  wall(76, 20, -4.5, 92, 28, -3); wall(76, 20, 3, 92, 28, 4.5); roof(76, 28, -4.5, 92, 29, 4.5);
  walk(92, -60, 208, -25, 0, '#6a5a5a'); walk(92, 25, 208, 60, 0, '#6a5a5a'); walk(92, -25, 125, 25, 0, '#6a5a5a'); walk(175, -25, 208, 25, 0, '#6a5a5a');
  wall(90, -4.5, -62, 92, 66, -6); wall(90, -4.5, 6, 92, 66, 62); wall(90, 12, -6, 92, 19.2, 6); wall(90, 29, -6, 92, 66, 6);
  wall(208, -4.5, -62, 210, 66, 62); wall(90, -4.5, -62, 210, 66, -60); wall(90, -4.5, 60, 210, 66, 62);
  roof(90, 64, -62, 210, 66, 62);
  const EX = 150, EZ = 0;
  box(140, -4.5, -10, 160, 12, 10, '#5a3a4a', 'plain', { outlineT: 0.1 });
  box(141, 12, -9, 159, 26, 9, '#8a3a5a', 'plain', { outlineT: 0.1 });
  box(143, 26, -7, 157, 40, 7, '#a84a6a', 'plain', { outlineT: 0.1 });
  box(145, 40, -5, 155, 52, 5, '#c85a7a', 'plain', { outlineT: 0.1 });
  box(147, 52, -3, 153, 60, 3, '#ffd23f', 'plain', { outlineT: 0.1 });
  K.neon(['60'], 140.9, 32, 0, 9, 7, -Math.PI / 2, { colors: ['#ff2e88'], flicker: false, bg: '#200810' });
  K.neon(['MOOD ENGINE', 'CITY TEMPO REGULATOR'], 150, 18.5, 9.05, 14, 3, 0, { colors: ['#ffd23f', '#ffffff'], flicker: false });
  K.ringDeck(EX, EZ, 15.5, 20, 20, { color: '#5b5048', kind: 'paving', thick: 0.8 });
  rail(pArc(EX, EZ, 19.6, 0, Math.PI * 2, 20.9, 20.9, 1.2), { color: '#ff2e88', loop: true, round: 0, posts: false });
  K.cylWall(EX, EZ, 15.5, 20, 21.1, '#5b5048', [], 'plain', true);
  box(148, 19.2, 20, 152, 20, 58, '#5b5048', 'paving', { outlineT: 0.05 });
  K.lift({ x0: 142.8, z0: 52, x1: 148, z1: 58, y0: 0, y1: 20, postBase: 0, phase: 4 });
  for (const [x, z] of [[136, -14], [164, -14], [136, 14], [164, 14]]) cyl(x, -4.5, z, 0.5, 24.5, '#5b6078', { outline: 0.04, seg: 8 });
  // the pendulum swings across the north side of the catwalk: down on every beat
  {
    const piv = new THREE.Group(); piv.position.set(EX, 52, -18); scene.add(piv);
    box(EX - 1, 50.5, -19, EX + 1, 52, -5, '#5a3a4a', 'plain', { outlineT: 0.06, collide: false });
    const arm = part(new THREE.BoxGeometry(0.6, 30, 0.6), '#ffd23f', 0.05); arm.position.y = -15; piv.add(arm);
    const bob = part(new THREE.BoxGeometry(3.4, 3.4, 3.4), '#ff2e88', 0.08); bob.position.y = -30; piv.add(bob);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ map: droneFaces().sus })); face.position.set(0, -30, 1.72); piv.add(face);
    const col = W.addDyn({ x0: 0, y0: -100, z0: 0, x1: 0, y1: -99, z1: 0, hazard: true, tag: 'pendulum', msg: '<b>TICK.</b><span>The Mood Engine does not like being interrupted.</span>' });
    let lastSide = 0;
    W.dyn.push({ update(dt, bi) {
      const th = 0.62 * Math.sin(bi.b * Math.PI);
      piv.rotation.z = th;
      const bx = EX - Math.sin(th) * 30, by = 52 - Math.cos(th) * 30;
      col.x0 = bx - 1.7; col.x1 = bx + 1.7; col.y0 = by - 1.7; col.y1 = by + 1.7; col.z0 = -19.7; col.z1 = -16.3;
      const side = Math.sign(th);
      if (side !== lastSide && Game.state === 'play' && Game.player && Math.abs(Game.player.pos.x - EX) < 40 && Math.abs(Game.player.pos.z) < 40) Sound.sfx.blip(1800);
      lastSide = side;
    } });
  }
  // steam vents on the south side of the catwalk: they blow on beats 3 and 4
  for (const ang of [Math.PI * 0.35, Math.PI * 0.65]) {
    const x = EX + Math.cos(ang) * 17.75, z = EZ + Math.sin(ang) * 17.75;
    cyl(x, 20, z, 1.1, 0.3, '#3a3550', { outline: 0.03, seg: 12 });
    const col = W.addDyn({ x0: x - 1.2, y0: -100, z0: z - 1.2, x1: x + 1.2, y1: -99, z1: z + 1.2, hazard: true, tag: 'steam', msg: '<b>STEAMED</b><span>The vents blow on beats three and four. The Ministry loves a pattern.</span>' });
    W.dyn.push({ update(dt, bi) {
      const on = bi.playing && (bi.inBar === 2 || bi.inBar === 3);
      col.y0 = on ? 20 : -100; col.y1 = on ? 24 : -99;
      if (on && Game.fx && Math.random() < 0.9) for (let k = 0; k < 2; k++) Game.fx.emit(_wv3.set(x + (Math.random() - 0.5), 20.4, z + (Math.random() - 0.5)), _wv4.set((Math.random() - 0.5) * 1.5, 9 + Math.random() * 4, (Math.random() - 0.5) * 1.5), '#e8f0f0', 0.5, 2);
    } });
  }
  // a long pipe that climbs all the way round the hall walls and onto the south bridge
  rail([[95, 1.2, 40], [95, 4, -57], [205, 9, -57], [205, 14, 57], [158, 19.2, 57], [149, 20.9, 50], [149, 20.9, 26]], { ...COPPER, round: 7 });
  // the giant screen at the back
  K.screen(V3(207.3, 34, 0), 48, 27, -Math.PI / 2);
  W.screen.st.caption = 'PLEASE STOP OPENING VALVES';
  box(207.4, 19, -26, 208, 49, 26, '#14101f', 'plain', { outlineT: 0.08 });
  for (let z = -50; z <= 50; z += 20) { glow(100, 63.9, z, '#ff6b9a', 4); glow(200, 63.9, z, '#ff6b9a', 4); }
  // gears on the walls, ticking round with the beat
  {
    const gears = [];
    for (const [x, y, z, r, ry] of [[92.2, 40, -30, 7, Math.PI / 2], [92.2, 44, 32, 9, Math.PI / 2], [150, 44, -59.8, 10, 0], [150, 40, 59.8, 8, Math.PI]]) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
      const disc = part(new THREE.CylinderGeometry(r, r, 0.8, 24), '#6a5a4a', 0.08); disc.rotation.x = Math.PI / 2; g.add(disc);
      for (let k = 0; k < 12; k++) { const t = part(new THREE.BoxGeometry(1.4, 1.4, 0.8), '#6a5a4a', 0.05); const a = k / 12 * Math.PI * 2; t.position.set(Math.cos(a) * (r + 0.6), Math.sin(a) * (r + 0.6), 0); g.add(t); }
      gears.push({ g, s: (gears.length % 2 ? -1 : 1) / r * 6 });
    }
    W.dyn.push({ update(dt, bi) { for (const k of gears) k.g.rotation.z = k.s * (Math.floor(bi.b) + U.smooth(Math.min(1, bi.phase * 4))) * 0.1; } });
  }

  // ---------- valves, tapes, pads, drones ----------
  K.relays([
    { id: 1, pos: V3(-85, 0, 56), hint: 'First valve: the side canal off the south wall of the Overflow, right at the end by the waterfall.' },
    { id: 2, pos: V3(21.4, 31, 7.4), hint: 'Second valve: top of the Pipe Cathedral. Grind a railing on the west bridge straight into the spiral pipe and ride it all the way up.' },
    { id: 3, pos: V3(60, 16, -129), hint: 'Third valve: the top ledge of the Waterfall Terraces, north. The speakers launch you up a level — on the beat.' },
    { id: 4, pos: V3(80, 16, 126), hint: 'Fourth valve: the high catwalk in the Pumping Station, south. Hop up the pistons as each one peaks — on the beat.' },
    { id: 5, pos: V3(EX + 17.75, 20, EZ), hint: 'The last valve is on the Mood Engine catwalk itself. Mind the pendulum, mind the steam.' },
  ].map(r => Object.assign(r, { style: 'valve' })));
  K.tapes([
    { id: 1, pos: V3(-116, 3.4, -58.4), text: 'TAPE — City engineer, 1999: “We installed the Mood Engine to calm traffic. Then they asked us to calm… everything else.”' },
    { id: 2, pos: V3(C.x, 32, -10.5), text: 'TAPE — Static, alone: “If I play my master tape, the Engine runs MY tempo. Then nobody tells me what to play. Ever again.”', dj: 'You weren’t supposed to hear that one. It’s… a metaphor.' },
    { id: 3, pos: V3(35, 17.6, -127.5), text: 'TAPE — Lull, years ago: “They took my voice to make the city quiet. Fine. If I can’t sing, nobody sings.”' },
    { id: 4, pos: V3(78, 12.8, 100), text: 'TAPE — Minister Glee, off-air, tired: “Do you know how hard it is to smile for twenty years? Somebody has to keep the beat.”' },
    { id: 5, pos: V3(150, 7.3, -57), text: 'TAPE — Bolt’s real voice: “It’s me. Actually me. They’ve got me in a pump room. Whatever you choose down there… choose it yourself.”' },
  ]);
  K.pads([
    { pos: V3(20, 0, -71), aim: V3(0, 0, -10), vy: 23 },
    { pos: V3(50, 8, -98), aim: V3(0, 0, -10), vy: 23 },
    { pos: V3(-150, 0, 12), aim: V3(0, 0, -14), vy: 21 },
  ]);
  K.drones([
    { path: [[-190, 8, 0], [-30, 8, 0]], speed: 3.6, phase: 0 },
    { path: [[C.x - 36, 10, 0], [C.x, 10, -36], [C.x + 36, 10, 0], [C.x, 10, 36]], speed: 3.4, phase: 0.3 },
    { path: [[8, 22, -126], [62, 22, -126], [62, 22, -112], [8, 22, -112]], speed: 3, phase: 0.6 },
    { path: [[100, 8, -50], [200, 8, -50], [200, 8, 50], [100, 8, 50]], speed: 4, phase: 0.1 },
  ]);
  K.finish();
  W.engine = V3(EX, 20, EZ);
  W.sky = skyDome({ top: [0.01, 0.03, 0.02], mid: [0.03, 0.06, 0.05], hor: [0.05, 0.1, 0.08], low: [0.01, 0.02, 0.02], cloudAmt: 0, sun: [0.3, 0.9, 0.2], sunC: [0.8, 1, 0.9], stripes: false });
  scene.add(W.sky);
  // mist drifting over the water near the camera
  {
    const N = 260, g = new THREE.BufferGeometry(), arr = new Float32Array(N * 3), ds = [];
    for (let i = 0; i < N; i++) ds.push({ x: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60, y: Math.random() * 3, s: Math.random() });
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfffe0, size: 0.5, transparent: true, opacity: 0.25, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
    W.dyn.push({ update(dt) { const c = G.camera.position; for (let i = 0; i < N; i++) { const d = ds[i]; d.x += dt * (0.3 + d.s * 0.5); if (d.x > 30) d.x = -30; arr[i * 3] = c.x + d.x; arr[i * 3 + 1] = -2.2 + d.y; arr[i * 3 + 2] = c.z + d.z; } g.attributes.position.needsUpdate = true; } });
  }
  return W;
}
const _wv3 = V3(), _wv4 = V3();
