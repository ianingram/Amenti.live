#!/usr/bin/env python3
"""
============================================================================
harvest-frame.py  ->  Amenti.live/tools/harvest-frame.py
----------------------------------------------------------------------------
Harvests one frame from FRAMES.csv, or all of them.

    python3 tools/harvest-frame.py pleiades-places.csv           # every frame
    python3 tools/harvest-frame.py pleiades-places.csv sicilia   # just one

    source   Pleiades · pleiades.stoa.org · CC BY 3.0
             https://atlantides.org/downloads/pleiades/dumps/
             pleiades-places-latest.csv.gz — gunzip it first

Writes, per frame KEY:
    <KEY>.csv            the places · same columns as ATTICA.csv
    <KEY>-EXTENTS.csv    the ones that are an area · as ATTICA-EXTENTS.csv

-- WHY THIS REPLACES harvest-attica.py -----------------------------------
That tool had the Acropolis and 160 km written into it, because when it was
written there was one surface and it was Attica. THE BOX WAS NEVER GOING TO
STAY A CONSTANT. Marathon outgrew it on its first real use, and
ATTICA-EXTENTS.csv then said the same thing from the data side — the Aegean's
own bounding box is 768 x 817 km inside a 320 km frame.

So the frame is a row in FRAMES.csv and this reads it. Nothing else changes:
the same filters, the same pin-and-wash law, the same span logic. A tool that
did the work differently per frame would make fifteen registers that could not
be compared.

-- THE ONE LAW, CARRIED NOT RE-DERIVED ------------------------------------
    locationPrecision = precise    a specific position on the earth      PIN
    locationPrecision = rough      the bounds within which the feature
                                   should be sought                     WASH
    locationPrecision = related    the bound is assembled from CONNECTED
                                   PLACES, not from this one            WASH

Classicists arrived at the first two independently and they are carried
through. `related` is a third thing this ship met on 9 September when the
extents were harvested: it is not a weaker `rough`, it is a claim about other
features, and it is recorded rather than flattened.

-- AND A FALLBACK IS NOT A LOCATION ---------------------------------------
Pleiades falls back to a coarse grid when it cannot place or bound a feature.
Two signatures, and this tool marks both rather than letting a surface
re-derive them from decimal places:

    the coordinate   a representative point on a 1/8-degree intersection.
                     91 of Attica's 1,746 rows. 37.5,22.5 carries Crete,
                     Thessaly, Hellas, Epirus and two more at once.
    the box          every corner an exact multiple of 0.25 degrees. The same
                     seven provinces share 20,35,25,40 — a 455 x 556 km cell
                     WHOSE CENTRE IS EXACTLY 37.5,22.5.

THE PLACEHOLDER COORDINATE WAS THE CENTROID OF A PLACEHOLDER BOX. Neither is
a location and the register says so in a column, so that no surface has to
guess and no two surfaces guess differently.

-- WHAT IS DELIBERATELY DROPPED -------------------------------------------
    unlocated · label · unlabeled · unknown — Pleiades saying it does not
    know where this is, or that the row is a cartographic artifact.
Nothing else is filtered. A quarry and a tomb are as real as a temple.
============================================================================
"""
import csv, math, os, sys

csv.field_size_limit(10 ** 8)

SRC = sys.argv[1] if len(sys.argv) > 1 else 'pleiades-places.csv'
ONLY = sys.argv[2] if len(sys.argv) > 2 else None
FRAMES = 'FRAMES.csv'
GRID_DEG = 0.125          # the representative-point fallback
BOX_GRID = 0.25           # the bounding-box fallback
DROP = {'unlocated', 'label', 'unlabeled', 'unknown'}


def num(v):
    try:
        return float(v)
    except Exception:
        return None


def km(la1, lo1, la2, lo2):
    a1, o1, a2, o2 = map(math.radians, (la1, lo1, la2, lo2))
    return 6371 * 2 * math.asin(math.sqrt(
        math.sin((a2 - a1) / 2) ** 2 +
        math.cos(a1) * math.cos(a2) * math.sin((o2 - o1) / 2) ** 2))


def on_grid(v, step):
    return abs(v / step - round(v / step)) < 1e-9


def frames():
    out = []
    for r in csv.DictReader(l for l in open(FRAMES, encoding='utf-8')
                            if not l.startswith('#')):
        if r.get('key'):
            out.append(r)
    return out


def tier(precision):
    return 'pin' if precision == 'precise' else 'wash'


def harvest(rows, f):
    la, lo, R = float(f['lat']), float(f['lon']), float(f['radius_km'])
    dla = R / 111.0
    dlo = R / (111.0 * math.cos(math.radians(la)))
    a0, a1, o0, o1 = la - dla, la + dla, lo - dlo, lo + dlo

    places, extents = [], []
    boxes = {}

    for r in rows:
        pla, plo = num(r.get('reprLat')), num(r.get('reprLong'))
        if pla is None or plo is None:
            continue
        if not (a0 <= pla <= a1 and o0 <= plo <= o1):
            continue
        kinds = [k.strip() for k in (r.get('featureTypes') or '').split(',') if k.strip()]
        if kinds and all(k in DROP for k in kinds):
            continue

        prec = (r.get('locationPrecision') or '').strip()
        # THE FALLBACK COORDINATE, MARKED RATHER THAN INFERRED
        unplaced = 1 if (on_grid(pla, GRID_DEG) and on_grid(plo, GRID_DEG)) else 0

        places.append({
            'key': 'pl-' + r['id'].strip(),
            'name': (r.get('title') or '').strip(),
            'kind': '|'.join(kinds),
            'tier': tier(prec),
            'precision': prec,
            'lat': pla, 'lon': plo,
            'from': r.get('minDate', ''), 'until': r.get('maxDate', ''),
            'km': round(km(la, lo, pla, plo), 1),
            'unplaced': unplaced,
            'uri': 'https://pleiades.stoa.org/places/' + r['id'].strip(),
            'why': '',
        })

        box = (r.get('bbox') or '').strip()
        if not box:
            continue
        try:
            p = [float(x) for x in box.split(',')]
        except Exception:
            continue
        if len(p) != 4 or (p[0] == p[2] and p[1] == p[3]):
            continue                       # a point; the places file holds it
        kind = 'grid' if all(on_grid(v, BOX_GRID) for v in p) else 'extent'
        boxes[box] = boxes.get(box, 0) + 1
        extents.append({
            'key': 'pl-' + r['id'].strip(),
            'name': (r.get('title') or '').strip(),
            'box': kind, 'precision': prec,
            'lon0': p[0], 'lat0': p[1], 'lon1': p[2], 'lat1': p[3],
            'width_km': round(km(p[1], p[0], p[1], p[2]), 1),
            'height_km': round(km(p[1], p[0], p[3], p[0]), 1),
            'repr_lat': pla, 'repr_lon': plo,
            'shares_box': 0,
            'uri': 'https://pleiades.stoa.org/places/' + r['id'].strip(),
        })

    for e in extents:
        e['shares_box'] = boxes.get('%s, %s, %s, %s' %
                                    (e['lon0'], e['lat0'], e['lon1'], e['lat1']), 1)

    places.sort(key=lambda r: r['km'])
    extents.sort(key=lambda r: -(r['width_km'] * r['height_km']))
    return places, extents


def write(path, head, rows, banner):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        for line in banner:
            f.write('# ' + line + '\n')
        w = csv.DictWriter(f, fieldnames=head)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def main():
    if not os.path.exists(SRC):
        sys.exit('no such file: ' + SRC)
    if not os.path.exists(FRAMES):
        sys.exit('no FRAMES.csv here — run from the repository root.')

    rows = list(csv.DictReader(open(SRC, encoding='utf-8')))
    todo = [f for f in frames() if ONLY is None or f['key'] == ONLY]
    if not todo:
        sys.exit('no such frame in FRAMES.csv: ' + str(ONLY))

    ph = ['key', 'name', 'kind', 'tier', 'precision', 'lat', 'lon', 'from',
          'until', 'km', 'unplaced', 'uri', 'why']
    eh = ['key', 'name', 'box', 'precision', 'lon0', 'lat0', 'lon1', 'lat1',
          'width_km', 'height_km', 'repr_lat', 'repr_lon', 'shares_box', 'uri']

    print('%-13s %7s %7s %7s %8s %8s' %
          ('frame', 'places', 'pin', 'unplaced', 'extents', 'gridbox'))
    for f in todo:
        K = f['key'].upper()
        places, extents = harvest(rows, f)
        write(K + '.csv', ph, places, [
            '=' * 74,
            K + '.csv  ->  Amenti.live/' + K + '.csv',
            'GENERATED by tools/harvest-frame.py from Pleiades · CC BY 3.0',
            'DO NOT HAND-EDIT except the `why` column. Re-run the tool.',
            '',
            'frame  ' + f['key'] + ' · ' + f['name'] + ' · ' +
            f['lat'] + ',' + f['lon'] + ' · ' + f['radius_km'] + ' km',
            'detail ' + f['detail'] +
            ('   NOTHING HAS BEEN AUTHORED ON THIS FRAME.'
             if f['detail'] != 'full' else ''),
            '',
            'tier       pin = a specific position · wash = bounds to seek within',
            'precision  precise | rough | related — `related` means the bound is',
            '           assembled from CONNECTED PLACES, not from this one',
            'unplaced   1 = the coordinate is a 1/8-degree FALLBACK, not a location.',
            '           Such a row must not draw: a wash would claim bounds it',
            '           does not have. See GEO.json — unplaced = NO MARK.',
            'why        the only authored column. Pleiades holds none of it.',
            '=' * 74])
        write(K + '-EXTENTS.csv', eh, extents, [
            '=' * 74,
            K + '-EXTENTS.csv  ->  Amenti.live/' + K + '-EXTENTS.csv',
            'GENERATED by tools/harvest-frame.py from Pleiades · CC BY 3.0',
            '',
            'The places in this frame that ARE AN AREA. Points are omitted —',
            K + '.csv holds those correctly.',
            '',
            'box=extent  a real bound, full-precision corners',
            'box=grid    a 0.25-degree fallback CELL, not a shape. A GRID CELL IS',
            '            NOT AN EXTENT AND MUST NOT DRAW AS ONE.',
            'shares_box  how many places carry this identical box. More than one',
            '            on a grid cell is the fallback showing.',
            '=' * 74])
        print('%-13s %7d %7d %7d %8d %8d' % (
            f['key'], len(places),
            sum(1 for r in places if r['tier'] == 'pin'),
            sum(1 for r in places if r['unplaced']),
            sum(1 for r in extents if r['box'] == 'extent'),
            sum(1 for r in extents if r['box'] == 'grid')))


if __name__ == '__main__':
    main()
