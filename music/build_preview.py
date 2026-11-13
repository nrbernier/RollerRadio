#!/usr/bin/env python3
"""Builds music/preview.html: the listening page, with src/city/music.js (given the hooks README.md describes) and moves.js inlined."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); eng = open(os.path.join(here, '..', 'src', 'city', 'music.js')).read()
def rep(a, b):
    global eng
    assert eng.count(a) == 1, a; eng = eng.replace(a, b)
rep("      grindStep(gc); comboStep(gc); birdsong(gc);", "      if (!_E.moves) { grindStep(gc); comboStep(gc); } birdsong(gc);")
rep("    // each audible recipe plays its own steps", "    if (_E.moves) _E.moves.tick(T, t, td);\n    // each audible recipe plays its own steps")
rep("  return { init, start, beat,", """  const _E = { moves: null, I, deg, chord, nearest, fold, H, R, REC, KIT, clk, TPB, midiF, buskAnswer, env, osc, noise, gain, filt,
    get dom() { return dom; }, get ctx() { return ctx; }, get musicOut() { return musicOut; }, get sfxOut() { return sfxOut; }, get noiseBuf() { return noiseBuf; } };
  // (listening page only) be in a district at once
  function jump(k) { for (const q in REC) { REC[q].w = REC[q].wt = q === k ? 1 : 0; } dom = REC[k]; dom.f = 1; H.next = null; H.root = dom.root; H.modeName = moodOf(dom); H.mode = MODES[H.modeName]; clk.bpm = clk.target = dom.bpm; }
  return { _E, jump, init, start, beat,""")
page = open(os.path.join(here, 'page.src.html')).read().replace('/*ENGINE*/', eng).replace('/*MOVES*/', open(os.path.join(here, 'moves.js')).read())
open(os.path.join(here, 'preview.html'), 'w').write('<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + page)
if len(sys.argv) > 1: open(sys.argv[1], 'w').write(page)
print('ok', len(page))
