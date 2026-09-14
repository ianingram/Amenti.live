#!/usr/bin/env python3
"""
============================================================================
probe-registration.py  ->  Amenti.live/tools/probe-registration.py
----------------------------------------------------------------------------
THREE COPIES OF THREE LINES, AND WHETHER THEY ARE STILL THE SAME

A frame's box is derived from its row by three lines of arithmetic. Those three
lines exist in three places and one of them is JavaScript, so none of them can
import the others:

    amenti-attica.js        boxOf(f)          what the surface projects through
    tools/render-frame.py   box_of(f)         what a plate is cut to
    tools/bake-frame.py     box_of(f)         what a mask is baked to

While they agree, every plate of a frame registers with every other and the
places land in the same pixel on all of them. THE DAY ONE IS EDITED AND THE
OTHERS ARE NOT, plates stop matching — and nothing on the surface says so. A
place would sit in the sea, months later, with slides already built on it.

So this reads the arithmetic OUT OF ALL THREE FILES, runs each against every
frame in FRAMES.csv, and asserts the boxes agree to the metre.

    python3 tools/probe-registration.py .

IT IS NOT A TEST OF THE CODE. It is a test that three copies of the same three
lines are still the same three lines. Run it before cutting a plate and after
touching any of the three files.
============================================================================
"""
import csv, io, math, os, re, sys

TOL_M = 1.0          # a metre. Anything looser and a plate can drift unseen.


def read_frames(root):
    raw = open(os.path.join(root, 'FRAMES.csv'), encoding='utf-8').read().split('\n')
    data = '\n'.join(l for l in raw if not l.startswith('#'))
    rows = [r for r in csv.reader(io.StringIO(data)) if r and any(r)]
    head = [h.strip() for h in rows[0]]
    return [dict(zip(head, r)) for r in rows[1:] if r[0].strip()]


# ── the reference, written out once here so the probe has something to be
#    right about. If this ever needs changing, all four change together. ──
def reference(la, lo, R):
    dla = R / 111.0
    dlo = R / (111.0 * math.cos(math.radians(la)))
    return (la - dla, la + dla, lo - dlo, lo + dlo)


def js_boxof(path):
    """Pull the three lines out of amenti-attica.js and run them as arithmetic.

       It reads the SOURCE rather than trusting a copy, because a copy is the
       thing being tested for."""
    src = open(path, encoding='utf-8').read()
    m = re.search(r'function\s+boxOf\s*\(f\)\s*\{(.*?)\n\s*\}', src, re.S)
    if not m:
        return None, 'boxOf(f) not found in ' + os.path.basename(path)
    body = m.group(1)
    dla = re.search(r'dla\s*=\s*R\s*/\s*([0-9.]+)', body)
    dlo = re.search(r'dlo\s*=\s*R\s*/\s*\(\s*([0-9.]+)\s*\*\s*Math\.cos', body)
    if not (dla and dlo):
        return None, 'the two divisors could not be read from boxOf'
    a, b = float(dla.group(1)), float(dlo.group(1))
    if not re.search(r'la0:\s*la\s*-\s*dla', body) or \
       not re.search(r'lo1:\s*lo\s*\+\s*dlo', body):
        return None, 'boxOf no longer builds the box the same way'
    return (lambda la, lo, R: (la - R / a, la + R / a,
                               lo - R / (b * math.cos(math.radians(la))),
                               lo + R / (b * math.cos(math.radians(la))))), None


def py_boxof(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'def\s+box_of\s*\(f\):(.*?)\n\n', src, re.S)
    if not m:
        return None, 'box_of(f) not found in ' + os.path.basename(path)
    body = m.group(1)
    dla = re.search(r'dla\s*=\s*R\s*/\s*([0-9.]+)', body)
    dlo = re.search(r'dlo\s*=\s*R\s*/\s*\(\s*([0-9.]+)\s*\*\s*math\.cos', body)
    if not (dla and dlo):
        return None, 'the two divisors could not be read from box_of'
    a, b = float(dla.group(1)), float(dlo.group(1))
    return (lambda la, lo, R: (la - R / a, la + R / a,
                               lo - R / (b * math.cos(math.radians(la))),
                               lo + R / (b * math.cos(math.radians(la))))), None


def metres(d_deg, lat, is_lon):
    return abs(d_deg) * (111320.0 * math.cos(math.radians(lat)) if is_lon else 110540.0)


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    frames = read_frames(root)
    print('FRAMES.csv holds %d frames\n' % len(frames))

    sources = [
        ('amenti-attica.js', os.path.join(root, 'amenti-attica.js'), js_boxof),
        ('render-frame.py', os.path.join(root, 'tools', 'render-frame.py'), py_boxof),
        ('bake-frame.py', os.path.join(root, 'tools', 'bake-frame.py'), py_boxof),
    ]

    fns, absent = [], []
    for name, path, reader in sources:
        if not os.path.exists(path):
            absent.append((name, 'not in the repository'))
            continue
        fn, err = reader(path)
        if err:
            absent.append((name, err))
        else:
            fns.append((name, fn))

    for name, why in absent:
        print('  %-20s COULD NOT BE READ — %s' % (name, why))
    if absent:
        print()
    if len(fns) < 2:
        print('  FEWER THAN TWO COPIES COULD BE READ, so nothing can be compared.')
        print('  That is not a pass. Fix the readers or the files.')
        sys.exit(1)

    print('  comparing %s\n' % ', '.join(n for n, _ in fns))
    worst = 0.0
    bad = []
    for f in frames:
        la, lo, R = float(f['lat']), float(f['lon']), float(f['radius_km'])
        ref = reference(la, lo, R)
        row = []
        for name, fn in fns:
            got = fn(la, lo, R)
            d = max(metres(got[0] - ref[0], la, False),
                    metres(got[1] - ref[1], la, False),
                    metres(got[2] - ref[2], la, True),
                    metres(got[3] - ref[3], la, True))
            row.append((name, d))
            worst = max(worst, d)
        off = [n for n, d in row if d > TOL_M]
        flag = '' if not off else '   OUT BY MORE THAN A METRE: ' + ', '.join(off)
        if off:
            bad.append(f['key'])
        print('  %-13s %8.4fN %8.4fE  r=%-5s  worst %6.2f m%s'
              % (f['key'], la, lo, f['radius_km'],
                 max(d for _, d in row), flag))

    print()
    if bad:
        print('  %d FRAME(S) DO NOT REGISTER: %s' % (len(bad), ', '.join(bad)))
        print('  Plates cut now will not overlay. Reconcile the three copies')
        print('  before cutting anything.')
        sys.exit(1)

    print('  ALL %d FRAMES AGREE to within %.2f m (tolerance %.1f m).'
          % (len(frames), worst, TOL_M))
    print('  Every plate cut from these rows will register with every other.')

    # ── and the plates that exist should say what they hold ──────────────
    print()
    missing = [f['key'] for f in frames
               if f.get('ground') and not (f.get('ground_px') and f.get('m_per_px'))]
    if missing:
        print('  %d plate(s) do not state their resolution: %s'
              % (len(missing), ', '.join(missing)))
        print('  A GLASS THAT MAGNIFIES PAST ITS SOURCE IS LYING QUIETLY —')
        print('  fill ground_px and m_per_px, or the glass cannot warn.')
    else:
        have = [f['key'] for f in frames if f.get('ground')]
        print('  %d frame(s) have a plate, and each states what it holds: %s'
              % (len(have), ', '.join(have) if have else '(none)'))


if __name__ == '__main__':
    main()
