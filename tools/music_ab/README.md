# Music checks

- `test_recipes.js`: runs every district recipe for 34 bars × 4 moods, day and night, against a fake
  AudioContext, and reports exceptions or impossible notes. Needs `engine_test.js` next to it: a copy of
  `src/city/music.js` with a check in `osc()` and `jump`/`tick` exported (see the git history of this folder).
- `ingame.py`: loads `dist/city_debug_test.html` headless, jumps to each district, and prints the recipe,
  mode, tempo and section heard there. Run it from the repo root.
- `page.html`: the A/B listening page (current vs proposed recipes) used to choose the new music.
