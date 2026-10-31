# Offbeat — Roller Radio

A mobile-friendly rollerblading game in three.js, inspired by Jet Set Radio: cel-shaded rooftops, grinding, and a soundtrack that plays *with* you.

Gleam City is perfectly happy — it says so on every screen. The Ministry of Good Vibes has outlawed music faster than a resting heartbeat (Decree 88). A pirate DJ called **Static** hijacks the city's giant screen and asks anyone with fast feet to switch his hidden relays back on. Juno laces up her skates. What could go wrong?

The full story runs across **five worlds**. It starts sunny and silly, then gets darker and much less trustworthy: who is Static really, who is the masked Hush, and why do the drones keep thanking Juno for the data?

## Play

Open `index.html` in a browser (or enable GitHub Pages on the `main` branch, root folder). Landscape works best on phones. Headphones on.

| | Touch | Keyboard |
|---|---|---|
| Skate | thumb on the left half, point where you want to go | W (or ↑) |
| Steer / brake | — | A / D steer, S brake |
| Look around | drag on the right half | Q / E, or mouse drag |
| Jump | JUMP | Space |
| Trick / push | TRICK | K or Shift |
| Pause | II | Esc / P |

## Music ↔ gameplay

The soundtrack is generated live with WebAudio (no audio files) and reacts both ways.

**Your actions change the music**
- Speed opens the master filter: stand still and the city sounds muffled, skate and it comes alive.
- Grinding adds an arpeggio layer; being airborne thins out the drums until you land (with a crash).
- On-beat tricks fire scratches, horn stabs and vocal shouts; a high multiplier brings in the lead melody early.
- Each relay you switch on unlocks an instrument for good: keys → percussion → horns → lead → everything.

**The music changes the world**
- Every action is judged against the beat: jumps go higher, ground pushes give a speed boost, air tricks score more.
- Speaker pads only launch you sky-high if you jump on the beat.
- The Ministry storage shutter opens on beats 1–2 of each bar; the Beat Lift rides an 8-beat cycle.
- Smile Drones sweep with spotlights; do an on-beat trick in their light and they start vibing instead of reporting you.

## Worlds

Every world is big and split into districts with their own mood, linked by long rails that bend round corners, climb, dive and hand you on to the next rail. Rail ends point somewhere worth going.

**World 1 — Gleam Civic Park, “Wake Up”.** Sunny shuffle in G with a whistled hook. Walled in, nowhere to fall: the place to learn the controls. Plaza and fountain, skate zone, pond with the Pond Snake rail, bandstand loop, beat-locked shed, a hill-ridge rail, the Hedge Rail lap and the Greenhouse Gardens with a spiral rail round the old tree.

**World 2 — Upper Gleam Rooftops, “Higher Ground”.** Sunset funk in D dorian. Rails that wrap round building corners, Billboard Row, a zipline, a vent duct into a sealed courtyard, a beat lift. Ending: Agent Juno — and the news has a police sketch with very familiar headphones.

**World 3 — The Neon Mile, “Wanted”.** Night, rain, boom bap in F minor. Lantern Market, the Loop Overpass round the Media Tower, Broadcast Avenue with trams to ride, the canal quay and a port crane. Meet **Lull**, leader of the Hush, who talks through an LED sign. Clip Bolt's scramblers onto the relays.

**World 4 — Undergleam, “Underground”.** Drum & bass in D minor. Grand Central, the East Tunnel, the Ministry server hall and abandoned Old Gleam Central. Trains run on both lines (and hit you on the rails, too). Follow the glowing cable through five junctions to a tiny office with an ON AIR sign.

**World 5 — The Deep Beat, “The Beat Below”.** Dub techno in C minor. The Overflow Canals, the Pipe Cathedral with its 3½-turn spiral pipe, the Waterfall Terraces, a Pumping Station whose pistons rise on the beat, and the Mood Engine: a colossal metronome with a pendulum and steam vents that fire on beats 3 and 4. Open five valves on the beat. Then everyone wants to tell you what to play.

Each world has five objectives (relays, scramblers, junctions, valves) and five golden tapes. The tapes are where the real story hides.

## Code

Plain JavaScript, no build tooling beyond a tiny concatenation script.

```
src/core.js        renderer, toon materials, inverted-hull outlines, static geometry batching, canvas textures
src/audio.js       sequencer, synthesized instruments, reactive mix, beat clock & timing judge, SFX
src/characters.js  procedural rigs with IK legs, poses, faces; Smile Drone
src/kit.js         shared level building blocks: colliders, rails, pads, shutter, lift, relays, tapes, drones, sky
src/world_park.js    World 1, the park
src/world_roofs.js   World 2, the rooftops
src/world_streets.js World 3, the streets
src/world_subway.js  World 4, the subway
src/world_sewers.js  World 5, the sewers
src/player.js      input (touch joystick + buttons, keyboard), physics, grinding, tricks, chase camera
src/cutscene.js    click-to-advance 3D cutscenes, the intro and the first ending
src/story.js       arrival scenes and endings for worlds 2–5, and the finale
src/game.js        state machine, HUD, scoring, triggers, main loop
src/shell.html     page markup and styles
build.py           assembles everything into index.html
```

Rebuild after editing: `python3 build.py`. three.js r149 loads from jsDelivr.
