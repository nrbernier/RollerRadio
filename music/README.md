# Move sounds: a proposal

`src/city/moves.js` redesigns what the player's own moves sound like: grinds, tricks, landings, pushes, jumps, and the extra
groove of a run without touching the ground. The district music (`REC` in `src/city/music.js`) is not touched.

**Status: in the game** (since Nov 13). `preview.html` plays it on the game's own synth, over the real district music, with a
switch between the present code and the proposal. Rebuild it after changing `moves.js` or `music.js`:

    python3 music/build_preview.py

The levels were set by reading the code, not by ear: rebalance them after listening on a phone.

## What is wrong today (the reasons for each change)

| Today | Proposed |
|---|---|
| A grind is a random walk of even notes; its rate doubles with speed (a stream of sixteenths at 10 m/s). The same in every district, only the instrument differs | A written two-bar lick per district (three each), in that district's idiom. Speed brings in ornament notes (level 1 from 5 m/s, level 2 from 10 m/s); the rhythm stays |
| Everything is on a grid of sixteenths, also where the band plays triplets (old town, observatory) | The district's grid: `sub: 3` there, 20 steps to the bar in the park's 5/4, the band's swing |
| The grind's instrument is often the one that has the district's tune (melodica on the canals, steel pan at the lake, vibes downtown) | An instrument the recipe does not use |
| A grind grows by adding a second voice after four bars | Every two bars: the lick · with a second voice · a third higher · with bass and stabs. Then the next lick |
| A trick is the same rising arpeggio whatever the trick; a missed trick sounds like a good one | One figure per trick (`FIG`). A run climbs the chord. Third trick on: harmonised. Perfect: an echo an octave up. Miss: two notes, the second a semitone off, and a rim |
| The grind switch (a trick on the rail) is not heard in the tune | It turns the lick upside down (`p → 8 − p`, which keeps chord tones chord tones) |
| Leaving a rail: one note, if at all | A cadence of one, two or three notes by length of grind; on the beat (`perfect`) the band hits it with you |
| Landing sounds the same after a run of five tricks as after a hop | Clean after two or more: the band's chord and bass, with a falling tag after four. Sloppy: rim and a wrong note |
| A run: percussion and a bass note on the beat | The district's bass riff (`riff`), then its stabs (`comp`) |
| No sound from the rail itself | A quiet band of noise tuned to the chord root, brighter and louder with speed |
| Pushes on the beat: one percussion hit | The hits count up (`k`), and the district's `push` uses the count |
| Long jumps are silent | Chord tones climb on the beat until you land (only if no trick was done in that jump) |
| Crag, building site and sky deck use the district's kit | `PLACE`: their own lead and trick voices when `R.spots[k] > 0.5` |
| At a border two kits play at once | The leading district only (licks are tied to its meter) |

## The data

Pitches `p` are scale steps above the root of the current chord: 0, 2, 4, 6 are chord tones, 7 is the root an octave
up. `x.5` is the semitone below the next step (an approach note). So licks follow the harmony by themselves.

`STYLE[district]`:

- `sub` steps per beat (4 or 3), `oct` / `toct` octave of the grind and trick voices, `harm` the second voice's interval in scale steps
- `lead(t, m, v, dur, accent)`, `trick(t, m, v, dur)`, `stab(t, v)`, `bass(t, m, dur, v)`, `perc(c, v)`, `land(t, v)`, `push(t, v, k)`: all call the instruments `I` of `music.js`
- `licks`: three of them, each `[[step, p, lengthInSteps, level]]` over two bars
- `riff`: one bar of bass, `[[step, p, length]]`; `comp`: the steps the stabs fall on

## How it is wired (done; kept as a reference)

1. Add `music/moves.js` to the build after `music.js` (`CITY_ORDER` in `build.py`; move the file to `src/city/`).
2. In `music.js`, make the three changes `build_preview.py` makes to the engine (it is the reference; each is one line):
   - export the internals as `Sound._E` (leave out `jump`, which is for the listening page);
   - in `tick()`, call `_E.moves.tick(T, t, td)` after the harmony is set and before the recipes play;
   - do not call `grindStep` and `comboStep` when `_E.moves` is set.
   After `Sound.init()`: `MOVES.install(Sound._E); Sound._E.moves = MOVES; MOVES.useLeads(true);`
3. Point `sfx` at it: `trick`, `land`, `push`, `jump`, `grindStart`, `grindEnd` call the `MOVES` functions of the same
   name. Keep the busker's answer, applause, `touch`, `hint` and `ripple` as they are (`useLeads` gives the last
   three the new lead voices).
4. Pass what the game already knows (`hooks` in `src/city/game.js`; the player already supplies all of it):
   - `trick(q, name, where)` → `MOVES.trick(Game.combo, q, name, where)`. Today `q`, `name` and `where` are dropped
   - `land(impact, airTime, spinLeft)` → `MOVES.land(h, { combo: Game.combo, clean: spinLeft < 0.5 })`. The 0.5 is a guess: look at what `spinLeft()` returns for a landing that looks wrong
   - `grindEnd` → `MOVES.grindEnd(q)` with the timing of the jump that left the rail, when there was one (`player.js` line 329 has it)
   - `railHop` can stay a `jump(true)`
5. `R.grinding`, `R.speed`, `R.grindH`, `R.air`, `R.airTime`, `R.combo` and `R.spots` are read as before.
6. Then delete `KIT[*].perc`, `KIT[*].trick`, `grindStep`, `comboStep` and the `G` of `music.js`.

## To check by ear

- Volumes of everything against the band, on a phone speaker (`tools/aud_sfxan.py` measures this).
- Old town and observatory: do the triplet licks sit on the band's triplets?
- Downtown bars 8 to 12 are the band's vibes solo, and tricks there are vibes too: if that is crowded, give `business.trick` the muted trumpet.
- Docks: the acid lick an octave down (`oct: -1`) against the band's bass.
- The scrape: too much, too little, or annoying on long rails.
- A long run in the market: riff, stabs, clave and the band's two guitars may be too many things at once.
