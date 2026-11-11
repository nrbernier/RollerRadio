// run every recipe for 70 bars against a fake audio context; report exceptions and bad notes
const fs = require('fs');
let now = 0;
const P = new Proxy(function () {}, { get: (t, k) => k === 'currentTime' ? now : k === 'state' ? 'running' : k === Symbol.toPrimitive ? () => NaN : P, apply: () => P, construct: () => P, set: () => true });
globalThis.window = { AudioContext: function () { return P; } };
globalThis.performance = { now: () => 0 };
globalThis.ERR = [];
globalThis.setInterval = () => 1;
const U = { rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }, clamp: (x, a, b) => Math.max(a, Math.min(b, x)), lerp: (a, b, t) => a + (b - a) * t };
const Sound = new Function('U', fs.readFileSync(__dirname + '/engine_test.js', 'utf8') + '\nreturn Sound;')(U);
Sound.init();
for (const night of [0, 1]) for (const k of Object.keys(Sound.REC)) {
  Sound.update(0.1, { night }); Sound.jump(k);
  const rc = Sound.REC[k], barTicks = 12 * rc.beats, n0 = ERR.length;
  for (const mood of [0, 1, 2, 3]) { rc.moodI = mood; for (let T = 0; T < barTicks * 34; T++) { rc.e = [0.2, 0.5, 0.95][T % 3 === 0 ? (Math.floor(T / barTicks / 8) % 3) : 2]; now += 0.01; Sound.tick(T, now + 0.1, 60 / rc.bpm / 12); } }
  console.log(k.padEnd(10), night ? 'night' : 'day  ', ERR.length - n0 ? 'ERRORS ' + (ERR.length - n0) : 'ok');
}
console.log([...new Set(ERR.map(e => e.replace(/@.*/, '')))].slice(0, 20).join('\n'));
