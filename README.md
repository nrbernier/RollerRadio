# Offbeat — Roller Radio

A mobile-friendly rollerblading game in three.js, inspired by Jet Set Radio: cel-shaded rooftops, grinding, and a soundtrack that plays *with* you.

Gleam City is perfectly happy — it says so on every screen. The Ministry of Good Vibes has outlawed music faster than a resting heartbeat (Decree 88). A pirate DJ called **Static** hijacks the city's giant screen and asks anyone with fast feet to switch his hidden relays back on. Juno laces up her skates. What could go wrong?

This repo contains the **demo**: the intro cutscene, **World 1 — Gleam Civic Park** (walled in, nowhere to fall: the place to learn the controls) and **World 2 — Upper Gleam Rooftops** (long drops, unlocked by finishing the park).

## Play

Open `index.html` in a browser (or enable GitHub Pages on the `main` branch, root folder). Landscape works best on phones. Headphones on.

| | Touch | Keyboard |
|---|---|---|
| Skate | drag on the left side | WASD / arrows |
| Look around | drag on the right side | Q / E, or mouse drag |
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

**World 1 — Gleam Civic Park.** Daytime, sunny shuffle soundtrack in G with a whistled hook. A fountain with a statue of Minister Glee, a skate zone with a big quarter pipe, a pond with an island, a bandstand, a playground and a grassy hill. Secrets: a hedge that dances on the beat (it's a hologram), a tunnel behind the bushes, a catwalk behind the giant screen, the statue's hat and the tallest tree.

**World 2 — Upper Gleam Rooftops.** Sunset, funk in D dorian. Hidden passages include a holographic kiosk, a vent duct into a sealed courtyard, a balcony below a roof edge, a beat-locked shed, a beat lift and a zipline.

Each world has five relays and five golden tapes. The tapes, and the endings, carry the first hints that the story isn't quite what Static says it is.

## Code

Plain JavaScript, no build tooling beyond a tiny concatenation script.

```
src/core.js        renderer, toon materials, inverted-hull outlines, static geometry batching, canvas textures
src/audio.js       sequencer, synthesized instruments, reactive mix, beat clock & timing judge, SFX
src/characters.js  procedural rigs with IK legs, poses, faces; Smile Drone
src/kit.js         shared level building blocks: colliders, rails, pads, shutter, lift, relays, tapes, drones, sky
src/world_park.js  World 1, the park
src/world_roofs.js World 2, the rooftops
src/player.js      input (touch joystick + buttons, keyboard), physics, grinding, tricks, chase camera
src/cutscene.js    click-to-advance 3D cutscenes: intro, park ending, rooftop ending
src/game.js        state machine, HUD, scoring, triggers, main loop
src/shell.html     page markup and styles
build.py           assembles everything into index.html
```

Rebuild after editing: `python3 build.py`. three.js r149 loads from jsDelivr.

## Roadmap

World 3 The Streets, then the subway and the sewers — each with its own soundtrack, and a story that gets darker and less trustworthy as it goes.
