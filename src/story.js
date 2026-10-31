// ============================================================
//  STORY — arrival scenes and endings for worlds 2–5.
//  Starts innocent, gets darker, trusts nobody.
// ============================================================

// ---------------- WORLD 2 ENDING: "Agent Juno" + the news ----------------
function roofOutroShots(R, J, W) {
  const base = outroShots(R, J), S = W.screen.pos, jy = R.y;
  const side = V3(J.x - R.x, 0, J.z - R.z); if (side.lengthSq() < 0.01) side.set(1, 0, 0); side.normalize();
  const jpos = V3(R.x + side.x * 2.4, R.y, R.z + side.z * 2.4), perp = V3(-side.z, 0, side.x);
  const front = (d, h, lat = 0) => [jpos.x + side.x * d + perp.x * lat, jpos.y + h, jpos.z + side.z * d + perp.z * lat];
  const sc = (x, y, z) => [S.x + x, S.y + y, S.z + z];
  return base.concat([
    { cut: true, cam: sc(2, -2.5, 17), look: sc(0, 0, 0.35), music: 'unease', sfx: 'glitch', flash: '#c8102e',
      screen: { mode: 'news', caption: 'SONIC ATTACK ON THE SMILE TOWER', sub: 'POLICE HUNT A MASKED SKATER FROM THE TERRORIST GROUP “THE HUSH”' },
      who: 'GNN', text: 'Breaking news! A sonic attack on the Smile Tower tonight. Police are hunting a masked skater from the terrorist group known as THE HUSH.' },
    { cam: sc(-3.5, -3.5, 12), look: sc(-4.6, 0, 0.35), move: 1.4,
      who: 'GNN', text: 'The suspect wears big yellow headphones. If you see them, report them. Then smile.' },
    { cut: true, cam: front(2.6, 1.65, 0.6), look: [jpos.x, jy + 1.6, jpos.z], actors: { juno: { pose: 'think', mood: 'worried' } },
      who: 'JUNO', text: '…Who the heck is The Hush?' },
    { cam: front(3.6, 1.9, -1.4), look: [jpos.x, jy + 1.6, jpos.z], move: 1.0, actors: { juno: { pose: 'nervous', mood: 'shock' } },
      who: 'BOLT · RADIO', text: 'Juno. The police sketch. That’s you. That is literally a drawing of you. With your headphones.' },
    { cam: front(5, 2.6, 1.5), look: [jpos.x, jy + 1.4, jpos.z], move: 1.2, actors: { juno: { pose: 'shrug', mood: 'smug' } },
      who: 'JUNO', text: 'Rude. I’d never wear my headphones that crooked.' },
  ]);
}

// ---------------- WORLD 3 ARRIVAL: "Wanted" ----------------
function streetsIntroShots(W) {
  const S = W.screen.pos, sc = (x, y, z) => [S.x + x, S.y + y, S.z + z];
  const L = V3(-27, 0, 55), J = V3(-21.5, 0, 54), Bo = V3(-20, 0, 57.8);
  const toL = Math.atan2(L.x - J.x, L.z - J.z);
  return [
    { cut: true, cam: [-12, 6, 60.5], look: [4, 20, -70], music: 'unease', screen: { mode: 'news', caption: 'THE HUSH STRIKE THE LANTERN MARKET', sub: 'NOODLE STAND DESTROYED · SUSPECT STILL AT LARGE' },
      actors: { juno: { pos: [J.x, 0, J.z], yaw: Math.PI, pose: 'lookup', mood: 'worried', visible: true }, bolt: { pos: [Bo.x, 0, Bo.z], yaw: Math.PI + 0.2, pose: 'nervous', mood: 'worried', visible: true }, lull: { pos: [L.x - 4, 0, L.z], yaw: Math.PI / 2, visible: false }, drone: { visible: false } },
      who: 'GNN', text: 'GNN news! The Hush struck again tonight — a noodle stand in the Lantern Market. Witnesses describe big yellow headphones.' },
    { cam: sc(1.5, -2, 20), look: sc(0, 0, 0.35), move: 1.8,
      who: 'GNN', text: 'Remember: the Hush hate music, joy and noodles. Stay inside. Stay happy.' },
    { cut: true, cam: [J.x + 2.4, 1.7, J.z - 2.6], look: [J.x, 1.6, J.z], actors: { juno: { pose: 'shrug', mood: 'smug', yaw: Math.PI - 0.6 } },
      who: 'JUNO', text: 'Big yellow headphones. Wow. Very specific. Could be anyone.' },
    { cam: [Bo.x + 1.6, 1.9, Bo.z - 3], look: [Bo.x, 1.7, Bo.z], move: 1.0, actors: { bolt: { pose: 'point', mood: 'worried', yaw: Math.PI + 0.9 } },
      who: 'BOLT', text: 'Juno, your face is on every lantern in the market. I counted. Two hundred and twelve yous.' },
    { cam: [-23, 2.2, 49], look: [L.x, 1.4, L.z], move: 1.3, sfx: 'whoosh', music: 'hush',
      actors: { lull: { pos: [L.x, 0, L.z], visible: true, pose: 'armsCross' }, juno: { pose: 'stand', mood: 'shock', yaw: toL }, bolt: { pose: 'nervous', mood: 'shock', yaw: -1.9 } },
      who: 'LULL', sign: 'PSST.', text: 'Psst. In here. Unless you’d rather meet the drones.' },
    { cam: [J.x - 1.6, 1.75, J.z + 1.8], look: [J.x, 1.55, J.z], move: 0.9,
      who: 'JUNO', text: 'Who are you? And why is your shirt talking?' },
    { cam: [L.x + 2.6, 1.6, L.z + 1.6], look: [L.x, 1.45, L.z], move: 1.0,
      who: 'LULL', sign: 'LULL. THE HUSH.', text: 'Lull. I run the Hush. The real one. We’ve never blown up anything. Not even a noodle.' },
    { cam: [Bo.x - 0.6, 1.9, Bo.z - 2.6], look: [Bo.x, 1.7, Bo.z], move: 0.9, actors: { bolt: { pose: 'think', mood: 'neutral' } },
      who: 'BOLT', text: 'Okay but why the sign? Is it a vow of silence? A fashion thing? Both?' },
    { cam: [L.x + 2.2, 1.5, L.z - 1.6], look: [L.x, 1.45, L.z], move: 1.0, actors: { lull: { pose: 'shrug' } },
      who: 'LULL', sign: 'LONG STORY.', text: 'The Ministry took my voice. Long story. Here’s a short one: those relays you switched on for Static?' },
    { cam: [L.x + 1.6, 1.55, L.z + 0.4], look: [L.x, 1.5, L.z], move: 0.8, actors: { lull: { pose: 'point', yaw: Math.PI / 2 + 0.25 } },
      who: 'LULL', sign: 'THEY’RE MICROPHONES.', text: 'They aren’t speakers. They’re microphones. Every street you made dance, the Ministry recorded.' },
    { cam: [J.x - 1.9, 1.7, J.z + 1.2], look: [J.x, 1.6, J.z], move: 0.7, roll: 0.06, actors: { juno: { pose: 'nervous', mood: 'shock' } },
      who: 'JUNO', text: '…Static said they’d free the city.' },
    { cam: [J.x + 3.6, 2.4, J.z - 1], look: [(J.x + L.x) / 2, 1.5, J.z], move: 1.0, actors: { juno: { pose: 'stand', mood: 'worried' }, lull: { pose: 'armsCross' } },
      who: 'DJ STATIC · RADIO', text: 'Kid! Don’t listen to the earmuff lady! The Hush are terrorists! It said so on the news!' },
    { cam: [L.x + 2.6, 1.6, L.z + 1.6], look: [L.x, 1.45, L.z], move: 0.9,
      who: 'LULL', sign: 'THE NEWS IS THEIRS.', text: 'The news says whatever the Ministry needs. Bolt — you build gadgets?' },
    { cam: [Bo.x + 1.6, 1.9, Bo.z - 3], look: [Bo.x, 1.7, Bo.z], move: 1.0, actors: { bolt: { pose: 'shrug', mood: 'smug', yaw: -1.9 } },
      who: 'BOLT', text: 'I… might have a scrambler. Clip it onto a relay: the music keeps playing, but the Ministry only hears whale noises.' },
    { cam: [-17, 3.2, 50], look: [-23.5, 1.4, 55.5], move: 1.3,
      who: 'LULL', sign: '5 RELAYS. GO.', text: 'Five relays on the Neon Mile. Scramble them all. Then we’ll talk about who you’ve really been working for.' },
    { cam: [J.x - 2.2, 1.7, J.z - 2.0], look: [J.x, 1.6, J.z], move: 0.9, actors: { juno: { pose: 'armsCross', mood: 'smug', yaw: toL } },
      who: 'JUNO', text: 'I don’t work for ANYONE. I skate for fun. Big difference.' },
    { cam: [-16, 3, 60], look: [-24, 1.4, 55], move: 1.0, flash: '#8ff0c8', sfx: 'whoosh',
      actors: { lull: { visible: false }, juno: { pose: 'lookup', mood: 'shock' }, bolt: { pose: 'lookup', mood: 'shock' } },
      who: 'BOLT', text: '…She’s gone. How is she that quiet in skates?' },
    { cam: [-14, 2.6, 46], look: [-22, 1.5, 55], move: 1.3, music: 'streets', screen: { mode: 'minister', caption: 'CURFEW IS FOR YOUR COMFORT' },
      actors: { juno: { pose: 'ready', mood: 'grin', yaw: Math.PI }, bolt: { pose: 'wave', mood: 'neutral' } },
      who: 'JUNO', text: 'Whales it is. Let’s go ruin some eavesdropping.' },
  ];
}

// ---------------- WORLD 3 ENDING: the staged bomb, the serial number ----------------
function streetsOutroShots(R, J, W) {
  const S = W.screen.pos, sc = (x, y, z) => [S.x + x, S.y + y, S.z + z];
  const L = V3(-26.5, 0, 55), Jp = V3(-21.5, 0, 54.5), Bo = V3(-19.5, 0, 58);
  const toL = Math.atan2(L.x - Jp.x, L.z - Jp.z), toJ = Math.atan2(Jp.x - L.x, Jp.z - L.z);
  return [
    { cut: true, cam: [-13, 3.5, 64], look: [-24, 1.5, 55], music: 'hush',
      actors: { juno: { pos: [Jp.x, 0, Jp.z], yaw: toL, pose: 'hype', mood: 'grin', visible: true }, bolt: { pos: [Bo.x, 0, Bo.z], yaw: -2, pose: 'wave', mood: 'grin', visible: true }, lull: { pos: [L.x, 0, L.z], yaw: toJ, pose: 'armsCross', visible: true }, drone: { visible: false } },
      who: '', text: 'Later, back at the Quiet Laundromat…' },
    { cam: [Bo.x + 1.6, 1.9, Bo.z - 3], look: [Bo.x, 1.7, Bo.z], move: 1.2,
      who: 'BOLT', text: 'Five for five! The Ministry’s whole audio feed is whale songs now. Gorgeous whale songs. I might release an album.' },
    { cut: true, cam: sc(1.5, -2, 20), look: sc(0, 0, 0.35), sfx: 'glitch', flash: '#c8102e', music: 'unease',
      screen: { mode: 'news', caption: 'SECOND HUSH BOMB ROCKS THE MARKET', sub: 'MINISTRY PROMISES “EXTRA CALM” · CURFEW EXTENDED FOREVER' },
      who: 'GNN', text: 'Breaking: a second explosion in the Lantern Market! The Hush have gone too far! The Ministry asks everyone to please stay extra calm.' },
    { cut: true, cam: [Jp.x + 2, 1.65, Jp.z - 2.2], look: [Jp.x, 1.6, Jp.z], actors: { juno: { pose: 'point', mood: 'shock', yaw: Math.PI } },
      who: 'JUNO', text: 'I was RIGHT THERE ten minutes ago. Nothing exploded. Except my combo.' },
    { cam: [Bo.x + 1.6, 1.9, Bo.z - 3], look: [Bo.x, 1.7, Bo.z], move: 1.0, actors: { bolt: { pose: 'think', mood: 'worried' } },
      who: 'BOLT', text: 'I pulled the traffic cam. That was a Ministry van. They lit the fire, then GNN filmed it. Twice. For a better angle.' },
    { cam: [L.x + 2.6, 1.6, L.z + 1.6], look: [L.x, 1.45, L.z], move: 1.0,
      who: 'LULL', sign: 'TOLD YOU.', text: 'Told you. They need a monster under the bed. We’re the monster. Now you are too.' },
    { cam: [L.x + 1.2, 1.75, L.z - 0.9], look: [L.x - 0.1, 1.72, L.z], move: 1.2, actors: { juno: { pose: 'think', mood: 'neutral', yaw: toL } },
      who: 'JUNO', text: 'Wait. Your earmuffs. There’s a tag on them. That’s a Ministry serial number.' },
    { cam: [L.x + 1.5, 1.6, L.z + 0.2], look: [L.x, 1.6, L.z], move: 0.8, actors: { lull: { pose: 'stand' } },
      who: 'LULL', sign: '. . .', text: '…' , speed: 6 },
    { cam: [L.x + 2.2, 1.5, L.z - 1.6], look: [L.x, 1.45, L.z], move: 0.9, actors: { lull: { pose: 'shrug' } },
      who: 'LULL', sign: 'EVERYTHING IS MINISTRY.', text: 'Everything in this city has a Ministry number on it, Juno. Your skates. Your headphones. Probably you.' },
    { cam: [Jp.x + 3.6, 2.4, Jp.z - 1], look: [(Jp.x + L.x) / 2, 1.5, Jp.z], move: 1.0, actors: { juno: { pose: 'armsCross', mood: 'worried' } },
      who: 'DJ STATIC · RADIO', text: 'Kid, I’m warning you. Follow that woman and you’ll end up somewhere dark and smelly.' },
    { cam: [Bo.x + 1.2, 1.8, Bo.z - 2.6], look: [Bo.x, 1.6, Bo.z], move: 1.0, actors: { bolt: { pose: 'lookdown', mood: 'shock' } },
      who: 'BOLT', text: 'Uh, guys? My scramblers are feeling a cable. A huge one. It runs from every relay in the city… down into the subway.' },
    { cam: [L.x + 2.6, 1.6, L.z + 1.6], look: [L.x, 1.45, L.z], move: 0.9, actors: { lull: { pose: 'point' } },
      who: 'LULL', sign: 'FOLLOW THE CABLE.', text: 'Then follow the cable. Find out who’s on the other end of it.' },
    { cam: [-15, 3, 48], look: [-22, 1.5, 55], move: 1.4, music: 'subway', actors: { juno: { pose: 'ready', mood: 'smug', yaw: Math.PI } },
      who: 'JUNO', text: 'Underground. Great. Love underground. Said nobody, ever.' },
  ];
}

// ---------------- WORLD 4 ARRIVAL: "Underground" ----------------
function subwayIntroShots(W) {
  const S = W.screen.pos, sc = (x, y, z) => [S.x + x, S.y + y, S.z + z];
  const J = V3(0, 0, -28), Bo = V3(3, 0, -29.5);
  return [
    { cut: true, cam: [-12, 5.5, -18], look: [0, 10, 41], music: 'anthem', screen: { mode: 'minister', caption: 'THE TRAINS ARE ON TIME' },
      actors: { juno: { pos: [J.x, 0, J.z], yaw: 0, pose: 'lookup', mood: 'neutral', visible: true }, bolt: { pos: [Bo.x, 0, Bo.z], yaw: -0.5, pose: 'armsCross', mood: 'neutral', visible: true }, lull: { visible: false }, drone: { visible: false } },
      who: 'MINISTER GLEE', text: 'Attention, commuters! The trains are running on time. The trains are ALWAYS running on time. Please stop checking.' },
    { cam: sc(2, -4, -18), look: sc(0, 0, -0.35), move: 1.8,
      who: 'MINISTER GLEE', text: 'And remember: if you hear unauthorized music down here, that’s just the pipes. The pipes are fine.' },
    { cut: true, cam: [J.x - 2.2, 1.8, J.z + 2.6], look: [Bo.x, 1.6, Bo.z], music: 'unease', actors: { bolt: { pose: 'point', mood: 'neutral', yaw: -2.2 } },
      who: 'BOLT', text: 'The cable runs into that pipe. The big glowing one. Very subtle.' },
    { cam: [J.x + 2.4, 1.7, J.z + 2.2], look: [J.x, 1.6, J.z], move: 1.0, actors: { juno: { pose: 'armsCross', mood: 'smug', yaw: 0.5 } },
      who: 'JUNO', text: 'So we follow the glowing pipe of evil. Got it.' },
    { cam: [Bo.x + 2.2, 1.9, Bo.z + 2.4], look: [Bo.x, 1.7, Bo.z], move: 1.0, actors: { bolt: { pose: 'think', mood: 'neutral' } },
      who: 'BOLT', text: 'There are junction boxes along it. Plug me into five of them and I can trace where the signal really goes.' },
    { cam: [J.x - 3, 2.4, J.z + 4], look: [J.x + 1.5, 1.4, J.z], move: 1.2, actors: { juno: { pose: 'stand', mood: 'neutral' } },
      who: 'DJ STATIC · RADIO', text: 'Kid. KID. Why are you underground? Nothing down there but rats and… more rats. Come back up! Rooftop party!' },
    { cam: [J.x + 1.6, 1.65, J.z + 1.6], look: [J.x, 1.6, J.z], move: 0.8, actors: { juno: { pose: 'think', mood: 'worried' } },
      who: 'JUNO', text: 'Static. Who are you, really?' },
    { cam: [J.x + 1.9, 1.75, J.z + 2.2], look: [J.x, 1.6, J.z], move: 0.4,
      who: 'DJ STATIC · RADIO', text: 'Me? I’m the voice of the people, baby! The… people’s voice. Okay bye. Static out!' },
    { cam: [Bo.x + 2.2, 1.9, Bo.z + 2.4], look: [Bo.x, 1.7, Bo.z], move: 1.0, actors: { bolt: { pose: 'shrug', mood: 'worried' } },
      who: 'BOLT', text: 'He hung up. Nobody hangs up that fast unless they’re hiding something. Or they’re my mom.' },
    { cam: [-4, 3, -21], look: [2, 1.4, -29], move: 1.4, music: 'subway', actors: { juno: { pose: 'ready', mood: 'grin', yaw: Math.PI / 2 }, bolt: { pose: 'wave', mood: 'neutral' } },
      who: 'JUNO', text: 'Trains every minute. “Don’t skate on the tracks,” they said. So, naturally—' },
  ];
}

// ---------------- WORLD 4 ENDING: PROJECT STATIC ----------------
function subwayOutroShots(R, J, W) {
  const St = W.studio, scr = W.screens.studio.pos;
  const Jp = V3(St.x - 3.4, 0, St.z - 3), Sp = V3(St.x + 3, 0, St.z + 1.2);
  const toS = Math.atan2(Sp.x - Jp.x, Sp.z - Jp.z), toJ = Math.atan2(Jp.x - Sp.x, Jp.z - Sp.z);
  return [
    { cut: true, cam: [St.x - 5.5, 2.4, St.z - 7.4], look: [St.x + 1, 1.6, St.z + 2], music: 'roof', scr: 'studio', screen: { mode: 'dj', mini: true },
      actors: { juno: { pos: [St.x - 1, 0, St.z - 8.5], yaw: 0.3, pose: 'stand', mood: 'neutral', visible: true }, static: { pos: [Sp.x, 0, Sp.z], yaw: 0.2, pose: 'dance', mood: 'grin', visible: true }, bolt: { visible: false }, lull: { visible: false }, drone: { visible: false } },
      who: 'BOLT · RADIO', text: 'Last junction. The cable ends… right here. In a tiny office. With an ON AIR sign. Juno, I think—' },
    { cam: [Jp.x - 1.2, 1.8, Jp.z - 2.2], look: [Sp.x, 1.6, Sp.z], move: 1.4, actors: { juno: { pos: [Jp.x, 0, Jp.z], yaw: toS, pose: 'stand', mood: 'shock', skate: true } },
      who: 'JUNO', text: '…Static?' },
    { cam: [Sp.x - 1.6, 1.9, Sp.z - 2.4], look: [Sp.x, 1.9, Sp.z], move: 1.0, music: 'stop', sfx: 'scratch', actors: { static: { yaw: toJ, pose: 'nervous', mood: 'shock' } },
      who: 'DJ STATIC · LIVE', text: 'Oh! Kid! You’re early. I was gonna… clean up. Hide some things. Just general tidying.' },
    { cam: [St.x, 3.1, St.z + 1.5], look: [scr.x, scr.y, scr.z], move: 1.2, sfx: 'glitch', music: 'reveal', screen: { mode: 'project' },
      who: 'SCREEN', text: 'PROJECT STATIC — CONTROLLED OPPOSITION PROGRAM — EST. 2009 — FIELD AGENT: J. (UNAWARE)', speed: 34 },
    { cut: true, cam: [Jp.x + 1.6, 1.65, Jp.z - 1.4], look: [Jp.x, 1.6, Jp.z], actors: { juno: { pose: 'point', mood: 'shock' } },
      who: 'JUNO', text: 'Controlled opposition?! “Field agent J”?! You WORK for them?' },
    { cam: [Sp.x - 2, 1.8, Sp.z - 2], look: [Sp.x, 1.8, Sp.z], move: 1.0, actors: { static: { pose: 'shrug', mood: 'worried' } },
      who: 'DJ STATIC · LIVE', text: 'WORKED. Past tense-ish. The Ministry built me. Give the rebels a pirate DJ and they rebel… on schedule. Through official relays.' },
    { cam: [Sp.x - 1.4, 1.95, Sp.z - 1.4], look: [Sp.x, 1.9, Sp.z], move: 0.8, actors: { static: { pose: 'think', mood: 'neutral' } },
      who: 'DJ STATIC · LIVE', text: '…but then I started liking the music. Like, REALLY liking it. Is that a crime? Don’t answer that. It’s a crime.' },
    { cam: [St.x - 1, 2.6, St.z - 3], look: [scr.x, scr.y - 0.3, scr.z], move: 1.2, sfx: 'glitch', music: 'anthem', screen: { mode: 'minister', caption: 'A SPECIAL OFFER, JUST FOR YOU', mood: 'happy' },
      actors: { juno: { pose: 'lookup', mood: 'worried', yaw: Math.atan2(scr.x - Jp.x, scr.z - Jp.z) }, static: { pose: 'lookup', mood: 'worried', yaw: Math.atan2(scr.x - Sp.x, scr.z - Sp.z) } },
      who: 'MINISTER GLEE', text: 'Juno! Our star agent! Your work on the relays was simply DELIGHTFUL. Every street, every dance — all recorded.' },
    { cam: [St.x, 3.1, St.z + 1.5], look: [scr.x, scr.y, scr.z], move: 1.0, screen: { mode: 'minister', caption: 'COME IN · SMILE · BE SAFE', wink: true },
      who: 'MINISTER GLEE', text: 'So here’s a deal. Come in. Smile. Keep the relays humming, and your friend Bolt never has to visit a re-education spa.' },
    { cut: true, cam: [Jp.x + 1.6, 1.65, Jp.z - 1.4], look: [Jp.x, 1.6, Jp.z], music: 'unease', actors: { juno: { pose: 'nervous', mood: 'shock', yaw: toS } },
      who: 'JUNO', text: 'Bolt? …Bolt, are you there?' },
    { cam: [Jp.x + 2.8, 2.2, Jp.z - 2.6], look: [Jp.x + 1, 1.5, Jp.z + 1], move: 1.2, sfx: 'glitch', screen: { mode: 'static' },
      who: 'BOLT · RADIO', text: '…kzzt… …' , speed: 10 },
    { cam: [Jp.x + 2.4, 1.9, Jp.z - 2.2], look: [Jp.x + 0.5, 1.5, Jp.z + 0.6], move: 0.6,
      who: 'BOLT · RADIO', text: 'Juno. It’s me. Meet me in the sewers. Under the Mood Engine. Come alone.', speed: 30 },
    { cam: [Sp.x - 1.6, 1.9, Sp.z - 2.4], look: [Sp.x, 1.9, Sp.z], move: 1.0, actors: { static: { pose: 'think', mood: 'worried', yaw: toJ } },
      who: 'DJ STATIC · LIVE', text: 'Huh. That’s… not how Bolt talks. He’d have said “like” at least four times.' },
    { cam: [Jp.x + 2, 1.7, Jp.z - 1.2], look: [Jp.x, 1.6, Jp.z], move: 0.9, actors: { juno: { pose: 'ready', mood: 'smug', yaw: Math.PI } },
      who: 'JUNO', text: 'Then I’m going to find out who’s really talking. And you’re going to stay right here and think about your life.' },
    { cam: [St.x - 4, 2.6, St.z - 6], look: [Sp.x, 1.6, Sp.z], move: 1.2, actors: { juno: { pos: [St.x - 1, 0, St.z - 9.5], skate: true, pose: 'ready' }, static: { pose: 'shrug', mood: 'worried' } },
      who: 'DJ STATIC · LIVE', text: 'Kid, wait — the sewers are— …and she’s gone. Cool. Cool cool cool.' },
  ];
}

// ---------------- WORLD 5 ARRIVAL: "The Beat Below" ----------------
function sewersIntroShots(W) {
  const J = V3(-163, 0, 11.5), L = V3(-155.5, 0, 12.5);
  const toL = Math.atan2(L.x - J.x, L.z - J.z), toJ = Math.atan2(J.x - L.x, J.z - L.z);
  return [
    { cut: true, cam: [-178, 3.5, 9], look: [-160, 1.8, 11.5], music: 'unease',
      actors: { juno: { pos: [J.x, 0, J.z], yaw: Math.PI / 2, pose: 'lookup', mood: 'worried', visible: true }, lull: { pos: [L.x + 10, 0, L.z], yaw: toJ, pose: 'armsCross', visible: false }, bolt: { visible: false }, static: { visible: false }, drone: { visible: false } },
      who: 'JUNO', text: 'Bolt? BOLT? …Echo. Great. Very creepy echo.' },
    { cam: [-166, 2.4, 6.5], look: [-157, 1.5, 12.5], move: 1.6, sfx: 'whoosh', music: 'hush',
      actors: { lull: { pos: [L.x, 0, L.z], visible: true, pose: 'stand' }, juno: { pose: 'stand', mood: 'shock', yaw: toL } },
      who: 'LULL', sign: 'NOT BOLT.', text: 'Not Bolt. Sorry. That message wasn’t him.' },
    { cam: [J.x + 1.6, 1.7, J.z - 2], look: [J.x, 1.6, J.z], move: 0.9, actors: { juno: { pose: 'point', mood: 'shock' } },
      who: 'JUNO', text: 'YOU?! Did you fake his voice?' },
    { cam: [L.x - 2.4, 1.6, L.z - 1.8], look: [L.x, 1.45, L.z], move: 1.0, actors: { lull: { pose: 'shrug' } },
      who: 'LULL', sign: 'NOT ME EITHER.', text: 'Not me either. Somebody wanted you down here. Honestly? So did I.' },
    { cam: [-150, 3, 5.5], look: [-60, 4, 0], move: 2.0, shake: 0.6, sfx: 'rumble',
      actors: { lull: { pose: 'point', yaw: Math.PI / 2 }, juno: { pose: 'lookup', mood: 'worried', yaw: Math.PI / 2 } },
      who: 'LULL', sign: 'LISTEN.', text: 'Hear that hum? That’s the Mood Engine. It ticks at sixty beats a minute, and the whole city ticks along with it.' },
    { cam: [L.x - 2, 1.5, L.z + 1.2], look: [L.x, 1.45, L.z], move: 1.2, actors: { lull: { pose: 'armsCross', yaw: toJ } },
      who: 'LULL', sign: 'OPEN 5 VALVES.', text: 'It has five pressure valves. Open them ON THE BEAT and it overloads. Then nobody’s tempo is mandatory.' },
    { cam: [J.x - 2.5, 2.4, J.z - 3.5], look: [(J.x + L.x) / 2, 1.4, J.z], move: 1.2,
      who: 'DJ STATIC · RADIO', text: 'Kid, DON’T! You blow that engine and the city goes bananas! Let me help — I’ve got a master tape. Play it into the Engine and it runs MY beat. Good beat! Danceable!' },
    { cam: [J.x + 1.6, 1.7, J.z - 2], look: [J.x, 1.6, J.z], move: 0.9, actors: { juno: { pose: 'think', mood: 'neutral' } },
      who: 'JUNO', text: 'So my options are: smash the city’s heartbeat, or hand it to the guy who lied to me for four worlds.' },
    { cam: [L.x - 2.4, 1.6, L.z - 1.8], look: [L.x, 1.45, L.z], move: 0.9,
      who: 'LULL', sign: 'CHOOSE LATER.', text: 'Choose later. Skate now. The drones down here don’t vibe.' },
    { cam: [-168.5, 2.4, 13.2], look: [-160, 1.4, 10.4], move: 1.4, music: 'sewers', flash: '#8ff0c8',
      actors: { lull: { visible: false }, juno: { pose: 'ready', mood: 'smug', yaw: Math.PI / 2 } },
      who: 'JUNO', text: 'Five valves. On the beat. Somebody’s getting a very loud surprise.' },
  ];
}

// ---------------- WORLD 5 FINALE: the Mood Engine ----------------
function sewersFinaleShots(R, J, W) {
  const E = W.engine, S = W.screen.pos, y = 20;
  const Jp = V3(168.5, y, -6), Sp = V3(163.5, y, -11.5), Lp = V3(163.5, y, 11.5), Bp = V3(166, y, 7), Lq = V3(151, y, 47);
  const face = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const toScreen = face(Jp, S);
  const sc = (dx, dy, dz) => [S.x + dx, S.y + dy, S.z + dz];
  return [
    { cut: true, cam: [150.6, y + 5, 36], look: [164, y + 1.5, 0], music: 'anthem', shake: 0.8, sfx: 'rumble', scr: null,
      screen: { mode: 'minister', caption: 'PLEASE STEP AWAY FROM THE ENGINE', mood: 'open' },
      actors: { juno: { pos: [Jp.x, y, Jp.z], yaw: toScreen, pose: 'stand', mood: 'shock', visible: true }, static: { pos: [Sp.x - 3, y, Sp.z - 2], yaw: face(Sp, Jp), pose: 'offer', mood: 'neutral', visible: false }, lull: { pos: [Lp.x, y, Lp.z], yaw: face(Lp, Jp), pose: 'armsCross', visible: false }, bolt: { pos: [150.6, y, 44], yaw: Math.PI, visible: false }, drone: { visible: false } },
      who: 'MINISTER GLEE', text: 'STOP! Juno, sweetie. Step away from the Engine.' },
    { cam: [Jp.x - 6, y + 3.5, Jp.z + 1], look: sc(0, 0, 0), move: 1.6,
      who: 'MINISTER GLEE', text: 'Without the beat, Gleam City falls apart. Riots. Running. Unscheduled jazz. Is that what you want?' },
    { cam: [Sp.x + 4.5, y + 2.2, Sp.z + 1.5], look: [Sp.x, y + 1.6, Sp.z], move: 1.4, sfx: 'whoosh',
      actors: { static: { pos: [Sp.x, y, Sp.z], visible: true, pose: 'offer', mood: 'grin' } },
      who: 'DJ STATIC · LIVE', text: 'Don’t listen to her! Play my master tape. My beat, my rules — I mean OUR rules. Mostly mine. Partly ours.' },
    { cam: [Lp.x + 2.8, y + 1.7, Lp.z - 1.6], look: [Lp.x, y + 1.45, Lp.z], move: 1.4, sfx: 'whoosh',
      actors: { lull: { visible: true, pose: 'point' } },
      who: 'LULL', sign: 'SMASH IT.', text: 'Don’t give it a new master. Break it. Nobody should own the beat. Nobody.' },
    { cam: [Jp.x + 2.2, y + 1.7, Jp.z - 1.8], look: [Jp.x, y + 1.6, Jp.z], move: 1.0, actors: { juno: { pose: 'think', mood: 'worried', yaw: face(Jp, E) } },
      who: 'JUNO', text: 'A Minister, a fake rebel, and a woman with a Ministry serial number on her ears. Amazing options. Ten out of ten.' },
    { cam: [152.5, y + 2.2, 25.5], look: [150.6, y + 1.3, 33], move: 1.4, music: 'park',
      actors: { bolt: { pos: [150.6, y, 32], visible: true, skate: true, pose: 'wave', mood: 'mega' } },
      who: 'BOLT', text: 'JUNOOO! Don’t press anything! I mean — press things! Just let me get there first!' },
    { cut: true, cam: [Jp.x + 4.5, y + 2.3, Jp.z + 5], look: [(Jp.x + Bp.x) / 2, y + 1.4, (Jp.z + Bp.z) / 2],
      actors: { bolt: { pos: [Bp.x, y, Bp.z], yaw: face(Bp, Jp), skate: true, pose: 'hype', mood: 'grin' }, juno: { pose: 'hype', mood: 'mega', yaw: face(Jp, Bp) } },
      who: 'BOLT', text: 'I got out! The pump-room door opened on the beat. They put EVERYTHING on the beat. Big mistake.' },
    { cam: [Jp.x + 1.8, y + 1.7, Jp.z + 1.6], look: [Jp.x, y + 1.6, Jp.z], move: 0.9, actors: { juno: { pose: 'stand', mood: 'smug' } },
      who: 'JUNO', text: 'Bolt. That demo tape you made in your garage. You still carry it everywhere?' },
    { cam: [Bp.x + 1.4, y + 1.9, Bp.z - 2.4], look: [Bp.x, y + 1.7, Bp.z], move: 0.9, actors: { bolt: { pose: 'shrug', mood: 'worried' } },
      who: 'BOLT', text: 'My demo? Like, it’s mostly kazoo. Like, ninety percent kazoo. Like… why?' },
    { cam: [Jp.x + 1.8, y + 1.65, Jp.z - 1.6], look: [Jp.x, y + 1.6, Jp.z], move: 0.8, actors: { juno: { pose: 'offer', mood: 'grin', yaw: face(Jp, E) } },
      who: 'JUNO', text: 'Perfect. Nobody owns kazoo.' },
    { cam: [174, y + 1.2, 12], look: [150, 46, 0], move: 2.2, music: 'stop', sfx: ['scratch', 'rumble'], shake: 1.4, flash: '#ffd23f', screen: { mode: 'static' },
      actors: { static: { pose: 'nervous', mood: 'shock' }, lull: { pose: 'lookup' }, bolt: { pose: 'lookup', mood: 'shock' }, juno: { pose: 'lookup', mood: 'shock' } },
      who: '', text: 'The Mood Engine coughs. Ticks. Stops. Then, very slowly, it starts to wobble along to ninety percent kazoo.' },
    { cam: [176, y + 2.6, 6], look: [165.5, y + 1, 2], move: 1.4, music: 'roof', flash: '#ff2e88',
      actors: { bolt: { pose: 'dance', mood: 'mega' }, juno: { pose: 'hype', mood: 'mega' }, static: { visible: false } },
      who: 'BOLT', text: 'It’s… dancing. The Mood Engine is DANCING. Juno, the whole city is—' },
    { cut: true, cam: sc(-16, -3, 0), look: sc(0, 0, 0), sfx: 'glitch', screen: { mode: 'dj', gov: true, caption: 'TODAY’S MOOD: FREE' },
      who: 'DJ STATIC', text: 'Good evening, Gleam City! This is your new Minister of Good Vibes. While you were busy dancing, I borrowed the Ministry. Today’s mood: FREE!' },
    { cam: sc(-11, -2, 3), look: sc(0, 0, 0), move: 1.2,
      who: 'DJ STATIC', text: 'It’s mandatory.' },
    { cut: true, cam: [Jp.x + 1.7, y + 1.65, Jp.z - 1.3], look: [Jp.x, y + 1.6, Jp.z], music: 'unease', actors: { juno: { pose: 'nervous', mood: 'shock', yaw: toScreen }, bolt: { pose: 'lookup', mood: 'shock', yaw: face(Bp, S) } },
      who: 'JUNO', text: '…oh no.' },
    { cam: [Bp.x + 1.4, y + 1.9, Bp.z - 2.4], look: [Bp.x, y + 1.7, Bp.z], move: 1.0, actors: { bolt: { pose: 'think', mood: 'worried' } },
      who: 'BOLT', text: 'Wasn’t he standing right next to us? Like, literally ten seconds ago?' },
    { cam: [Lq.x + 0.9, y + 1.75, Lq.z - 3.8], look: [Lq.x, y + 1.5, Lq.z], move: 1.8, music: 'hush',
      actors: { lull: { pos: [Lq.x, y, Lq.z], yaw: Math.PI, pose: 'stand', visible: true } },
      who: 'LULL', sign: 'WE’LL BE IN TOUCH, JUNO.', text: 'We’ll be in touch, Juno.' },
    { cam: [Lq.x, y + 2.6, Lq.z - 14], look: [Lq.x, y + 1.5, Lq.z], move: 1.2, flash: '#000000', sfx: 'whoosh',
      actors: { lull: { visible: false } },
      who: '', text: 'The catwalk is empty. Somewhere above, ten thousand speakers play the same song at exactly the same time.' },
  ];
}
