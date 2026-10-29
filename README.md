# Offbeat — Roller Radio

A mobile-friendly rollerblading game in three.js, inspired by Jet Set Radio: cel-shaded rooftops, grinding, and a soundtrack that plays *with* you.

Gleam City is perfectly happy — it says so on every screen. The Ministry of Good Vibes has outlawed music faster than a resting heartbeat (Decree 88). A pirate DJ called **Static** hijacks the city's giant screen and asks anyone with fast feet to switch his hidden relays back on. Juno laces up her skates. What could go wrong?

This repo contains the **demo**: the intro cutscene and **World 1 — Upper Gleam Rooftops**.

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

## World 1 secrets

Five relays and five golden tapes. Hidden passages include a holographic wall, a vent duct into a sealed courtyard, a balcony below a roof edge, a beat-locked shed, a beat lift and a zipline. The tapes also carry the first hints that the story isn't quite what Static says it is.

## Code

Plain JavaScript, no build tooling beyond a tiny concatenation script.

```
src/core.js        renderer, toon materials, inverted-hull outlines, static geometry batching, canvas textures
src/audio.js       sequencer, synthesized instruments, reactive mix, beat clock & timing judge, SFX
src/characters.js  procedural rigs with IK legs, poses, faces; Smile Drone
src/world1.js      the rooftops level: colliders, rails, pads, shutter, lift, relays, tapes, drones
src/player.js      input (touch joystick + buttons, keyboard), physics, grinding, tricks, chase camera
src/cutscene.js    click-to-advance 3D cutscenes, intro and outro scripts
src/game.js        state machine, HUD, scoring, triggers, main loop
src/shell.html     page markup and styles
build.py           assembles everything into index.html
```

Rebuild after editing: `python3 build.py`. three.js r149 loads from jsDelivr.

## Roadmap

World 2 The Streets, then the park, subway and sewers — each with its own soundtrack, and a story that gets darker and less trustworthy as it goes.
