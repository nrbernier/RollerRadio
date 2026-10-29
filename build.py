#!/usr/bin/env python3
"""Assemble Offbeat into one self-contained page.
dist/offbeat.html      -> artifact body (three.js from jsDelivr)
dist/test.html         -> full document using the local three.js copy (for headless tests)
index.html             -> standalone page (GitHub Pages serves this)
"""
import pathlib
ROOT = pathlib.Path(__file__).parent
ORDER = ['core.js', 'audio.js', 'characters.js', 'kit.js', 'world_park.js', 'world_roofs.js', 'player.js', 'cutscene.js', 'game.js']
CDN = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'

shell = (ROOT / 'src/shell.html').read_text()
js = '\n'.join((ROOT / 'src' / f).read_text() for f in ORDER)
body = lambda three: f'{shell}\n<script src="{three}"></script>\n<script>\n"use strict";\n{js}\n</script>\n'
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist/offbeat.html').write_text(body(CDN))
(ROOT / 'dist/test.html').write_text(head + body('../vendor/three.min.js').replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
(ROOT / 'index.html').write_text(head + body(CDN).replace('<canvas id="gl">', '</head><body><canvas id="gl">', 1) + '</body></html>\n')
print('built', len(body(CDN)) // 1024, 'KB')
