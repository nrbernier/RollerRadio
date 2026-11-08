# Test tools (headless Chrome + Playwright)

Run from this folder after `python3 build.py`. All use `dist/city_test.html` (local three.js).
Chrome path is `/usr/bin/google-chrome` with SwiftShader; change it in the script if needed.

| script | what it does |
|---|---|
| `shot.py steps.json W H` | runs a list of `{eval}` / `{wait}` / `{shot: file.png}` steps and takes screenshots |
| `tour.py prefix phase n` | n random street-level shots per district at a time of day (0..1), saved as 2x2 grids |
| `geom.py` | pedestrians' paths through buildings, cars through obstacles, trees in boxes, rails buried in boxes or terrain |
| `q_now.py page.html query.js` | starts the game and prints the result of a JS expression (e.g. `q_tunnel.js`: anything inside the metro tunnels, `q_pipes.js`: pipes through boxes and walkers inside walls) |
| `bot.py secs seeds` | a bot skates each district at random: logs stuck spots, falls through the ground, camera inside boxes or foliage |
| `audio.py scenario.json` | records the master output (`aud/all.wav`) plus every note (time, pitch, instrument, key, mode) and sfx call (`aud/meta.json`) |
| `aud_an.py` | levels per segment, notes outside the current scale by instrument, highest notes |
| `aud_bal.py` | spectral balance per segment (sub-bass vs what a phone speaker plays) |
| `aud_sfxan.py` | loudness of each interaction sound vs the music (with `audio_sfx.json`) |
| `aud_spec.py seg…` | spectrograms with the loudness curve |
| `errs.py page.html` | page errors and console errors while loading |

Scenarios: `audio_districts.json` (each district by day and night, a key change), `audio_sfx.json` (each sound alone, then the music).
