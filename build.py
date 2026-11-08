#!/usr/bin/env python3
"""Assemble the pages.
Offbeat (the story game):
  dist/offbeat.html      -> artifact body (three.js from jsDelivr)
  dist/test.html         -> full document using the local three.js copy (for headless tests)
  index.html             -> standalone page (GitHub Pages serves this)
Downtone (the city to wander, same engine):
  city.html              -> standalone page
  dist/city_test.html    -> local three.js copy, for headless tests
"""
import pathlib
ROOT = pathlib.Path(__file__).parent
ORDER = ['core.js', 'audio.js', 'characters.js', 'kit.js', 'world_park.js', 'world_roofs.js', 'world_streets.js', 'world_subway.js', 'world_sewers.js', 'player.js', 'cutscene.js', 'story.js', 'game.js']
CDN = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'

shell = (ROOT / 'src/shell.html').read_text()
js = '\n'.join((ROOT / 'src' / f).read_text() for f in ORDER)
body = lambda three: f'{shell}\n<script src="{three}"></script>\n<script>\n"use strict";\n{js}\n</script>\n'
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
pwa = ('<link rel="manifest" href="manifest.webmanifest">\n'
       '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">\n'
       '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
       '<meta name="apple-mobile-web-app-capable" content="yes">\n'
       '<meta name="mobile-web-app-capable" content="yes">\n'
       '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
       '<meta name="apple-mobile-web-app-title" content="Offbeat">\n'
       '<meta name="theme-color" content="#2a1748">\n')
(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist/offbeat.html').write_text(body(CDN))
(ROOT / 'dist/test.html').write_text(head + body('../vendor/three.min.js').replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
(ROOT / 'index.html').write_text(head + pwa + body(CDN).replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
print('built', len(body(CDN)) // 1024, 'KB')

# ---------- Downtone: the city ----------
CITY_SHARED = ['core.js', 'characters.js', 'kit.js', 'player.js']
CITY_ORDER = ['plan.js', 'terrain.js', 'batch.js', 'music.js', 'metro.js', 'world.js', 'districts.js', 'districts2.js', 'fill.js', 'sky.js', 'life.js', 'fauna.js', 'game.js']
cshell = (ROOT / 'src/city/shell.html').read_text()
cjs = '\n'.join([(ROOT / 'src' / f).read_text() for f in CITY_SHARED] + [(ROOT / 'src/city' / f).read_text() for f in CITY_ORDER if (ROOT / 'src/city' / f).exists()])
cbody = lambda three: f'{cshell}\n<script src="{three}"></script>\n<script>\n"use strict";\n{cjs}\n</script>\n'
cpwa = ('<link rel="manifest" href="city.webmanifest">\n'
        '<link rel="icon" type="image/png" sizes="32x32" href="icons/city-32.png">\n'
        '<link rel="apple-touch-icon" href="icons/city-apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        '<meta name="apple-mobile-web-app-title" content="Downtone">\n'
        '<meta name="theme-color" content="#b0cce0">\n')
(ROOT / 'city.html').write_text(head + cpwa + cbody(CDN).replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
(ROOT / 'dist/city_test.html').write_text(head + cbody('../vendor/three.min.js').replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
# the debug page: the same city plus a panel to jump to every place worth checking
dbg = (ROOT / 'src/city/debug.js').read_text()
(ROOT / 'city_debug.html').write_text(head + cbody(CDN).replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + f'<script>\n{dbg}\n</script>\n</body></html>\n')
(ROOT / 'dist/city_debug_test.html').write_text(head + cbody('../vendor/three.min.js').replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + f'<script>\n{dbg}\n</script>\n</body></html>\n')
print('built city', len(cbody(CDN)) // 1024, 'KB')
