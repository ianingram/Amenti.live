#!/usr/bin/env python3
"""
bake-mask.py  ->  Amenti.live/tools/bake-mask.py
================================================================================
WATER IS NOT A PROPERTY OF A PICTURE.

Until now `wet()` read REGION.jpg at draw time and tested blue minus red. That
works while the ground IS the NASA composite. It stops working the moment a
second skin exists — a wireframe, a terminal green, a black-on-white — because
the arithmetic means nothing on those and every sea route would run through
land SILENTLY, which is the worst kind of wrong.

So the mask is baked once, out of the ground that can be trusted, and every
skin reads the baked file. A skin then cannot change where the sea is.

WHAT THIS PRODUCES
    REGION-WATER.png    1452 x 748, white is water, black is land
    REGION-WATER.json   the bounds, the rule, the fixes applied, the date

AND IT CORRECTS THE RASTER. At 0.37 km per pixel a strait 1.2 km wide blurs
shut. MASK-FIXES.csv names each such place, which way it is wrong, and why —
so the correction is versioned and arguable rather than a tuned threshold
nobody can see.

    python3 tools/bake-mask.py .
================================================================================
"""
import csv, io, json, math, os, sys
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
GROUND = os.path.join(ROOT, 'REGION.jpg')
FIXES  = os.path.join(ROOT, 'MASK-FIXES.csv')
OUT_P  = os.path.join(ROOT, 'REGION-WATER.png')
OUT_J  = os.path.join(ROOT, 'REGION-WATER.json')

# the theatre, as the prologue states it
LO0, LO1, LA0, LA1 = 21.0, 37.5, 33.5, 42.0
RULE = 'blue - red > 22'
GW, GH = 1452, 748                      # about 1 km a cell

def read_fixes(path):
    if not os.path.exists(path):
        return []
    raw = open(path, encoding='utf-8').read().split('\n')
    data = '\n'.join(l for l in raw if not l.startswith('#'))
    rows = [r for r in csv.reader(io.StringIO(data)) if r]
    head = rows[0]
    return [dict(zip(head, r)) for r in rows[1:]]

def main():
    im = Image.open(GROUND)
    W, H = im.size
    a = np.asarray(im).astype(int)
    wet = (a[:, :, 2] - a[:, :, 0]) > 22
    print('  %s  %d x %d  -> %.1f%% water at full resolution'
          % (os.path.basename(GROUND), W, H, 100 * wet.mean()))

    # ── down to the grid, by majority, so a cell says what most of it is ──
    yi = np.linspace(0, H, GH + 1).astype(int)
    xi = np.linspace(0, W, GW + 1).astype(int)
    m = np.zeros((GH, GW), bool)
    for j in range(GH):
        band = wet[yi[j]:yi[j + 1], :].astype(np.int32)
        ones = np.ones_like(band)
        num = np.add.reduceat(band, xi[:-1], axis=1).sum(axis=0)
        den = np.add.reduceat(ones, xi[:-1], axis=1).sum(axis=0)
        m[j] = (num / np.maximum(1, den)) >= 0.5
    print('  baked to %d x %d  -> %.1f%% water' % (GW, GH, 100 * m.mean()))

    # ── the corrections ───────────────────────────────────────────────────
    applied = []
    km_lat = 110.57
    for fx in read_fixes(FIXES):
        pts = []
        for q in fx['path'].split('>'):
            c = q.split('|')
            pts.append((float(c[0]), float(c[1])))
        half = float(fx['width_km']) / 2.0
        val = (fx['kind'].strip() == 'open')
        touched = 0
        for k in range(len(pts) - 1):
            p, q = pts[k], pts[k + 1]
            steps = max(2, int(math.hypot((q[1] - p[1]) * 88, (q[0] - p[0]) * 111) / 0.3))
            for s in range(steps + 1):
                t = s / steps
                la = p[0] + (q[0] - p[0]) * t
                lo = p[1] + (q[1] - p[1]) * t
                km_lon = 111.32 * math.cos(math.radians(la))
                rj = int(half / km_lat / (LA1 - LA0) * GH) + 1
                ri = int(half / km_lon / (LO1 - LO0) * GW) + 1
                cj = int((LA1 - la) / (LA1 - LA0) * GH)
                ci = int((lo - LO0) / (LO1 - LO0) * GW)
                for dj in range(-rj, rj + 1):
                    for di in range(-ri, ri + 1):
                        jj, ii = cj + dj, ci + di
                        if 0 <= jj < GH and 0 <= ii < GW and m[jj, ii] != val:
                            m[jj, ii] = val
                            touched += 1
        applied.append({'name': fx['name'], 'kind': fx['kind'],
                        'cells': touched, 'note': fx['note']})
        print('  %-18s %-5s  %d cells  — %s'
              % (fx['name'], fx['kind'], touched, fx['note'][:52] + '…'))

    # ── say whether it actually opened ────────────────────────────────────
    try:
        from scipy import ndimage
        lab, n = ndimage.label(m, structure=np.ones((3, 3)))
        def comp(la, lo):
            return lab[int((LA1 - la) / (LA1 - LA0) * GH),
                       int((lo - LO0) / (LO1 - LO0) * GW)]
        main_sea = comp(37.80, 25.20)
        checks = [('Sea of Marmara', 40.70, 28.00),
                  ('inside Euboea', 38.5833, 23.4250),
                  ('the Kilikian gulf', 36.4083, 35.4833),
                  ('the Levantine', 34.60, 30.00)]
        print('  reachable by sea from the open Aegean:')
        for nm, la, lo in checks:
            c = comp(la, lo)
            print('    %-20s %s' % (nm, 'yes' if c == main_sea and c else 'NO'))
    except ImportError:
        print('  (scipy absent — connectivity not checked)')

    Image.fromarray((m * 255).astype('uint8'), 'L').convert('1').save(
        OUT_P, optimize=True)
    meta = {
        'ground': os.path.basename(GROUND),
        'bounds': {'lo0': LO0, 'lo1': LO1, 'la0': LA0, 'la1': LA1},
        'grid': {'w': GW, 'h': GH, 'about_km': round((LO1 - LO0) * 88 / GW, 2)},
        'rule': RULE,
        'water_fraction': round(float(m.mean()), 4),
        'fixes': applied,
        'baked': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        'note': 'White is water. Every skin reads this, not its own pixels.'
    }
    open(OUT_J, 'w').write(json.dumps(meta, indent=2) + '\n')
    print('  wrote %s  %.0f KB' % (os.path.basename(OUT_P),
                                   os.path.getsize(OUT_P) / 1024))
    print('  wrote %s' % os.path.basename(OUT_J))

if __name__ == '__main__':
    main()
