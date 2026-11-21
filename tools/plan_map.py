#!/usr/bin/env python3
"""Top-down map of src/city/plan.js, labelled, with a 100 m grid.
   python3 tools/plan_map.py [out.png] [metres per pixel]"""
import json, subprocess, sys, pathlib
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).parent
out = sys.argv[1] if len(sys.argv) > 1 else 'plan_map.png'
mpp = sys.argv[2] if len(sys.argv) > 2 else '2'
ppm = str(pathlib.Path(out).with_suffix('.ppm'))
subprocess.run(['node', str(HERE / 'plan_map.js'), ppm, mpp], check=True)
meta = json.loads(pathlib.Path(ppm).with_suffix('.json').read_text())
im = Image.open(ppm).convert('RGB'); d = ImageDraw.Draw(im)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11); fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except OSError: f = fb = ImageFont.load_default()
m = meta['mpp']
for x in range(-700, 701, 100):
    X = (x - meta['X0']) / m; d.line([(X, 0), (X, 6)], fill=(60, 60, 60)); d.text((X + 2, 6), str(x), fill=(60, 60, 60), font=f)
for z in range(-800, 761, 100):
    Z = (z - meta['Z0']) / m; d.text((4, Z - 6), 'z' + str(z), fill=(60, 60, 60), font=f)
for l in meta['labels']:
    x, y = l['p']
    if l['kind'] == 'district': d.text((x, y), l['t'], fill=(30, 30, 30), font=fb, anchor='mm')
    elif l['kind'] == 'station':
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(228, 87, 46), outline=(255, 255, 255)); d.text((x + 9, y - 6), l['t'], fill=(150, 40, 20), font=f)
    elif l['kind'] == 'spot':
        d.rectangle([x - 4, y - 4, x + 4, y + 4], fill=(80, 60, 160)); d.text((x + 7, y + 2), l['t'], fill=(60, 40, 140), font=f)
    else:
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(20, 20, 20)); d.text((x + 7, y - 12), l['t'], fill=(20, 20, 20), font=f)
im.save(out); print('wrote', out)
