#!/usr/bin/env python3
"""Builds music/preview.html: the listening page, with src/city/music.js and src/city/moves.js inlined."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); eng = open(os.path.join(here, '..', 'src', 'city', 'music.js')).read()

page = open(os.path.join(here, 'page.src.html')).read().replace('/*ENGINE*/', eng).replace('/*MOVES*/', open(os.path.join(here, '..', 'src', 'city', 'moves.js')).read())
open(os.path.join(here, 'preview.html'), 'w').write('<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + page)
if len(sys.argv) > 1: open(sys.argv[1], 'w').write(page)
print('ok', len(page))
