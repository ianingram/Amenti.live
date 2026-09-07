#!/usr/bin/env python3
"""
============================================================================
harvest-attica.py  ·  THE ATTICA REGISTER, FROM PLEIADES
----------------------------------------------------------------------------
Builds ATTICA.csv: every ancient place inside 100 miles of the Acropolis, with
its coordinate, its kind, whether that coordinate is a pin or a wash, and the
years it is attested.

    source   Pleiades · pleiades.stoa.org · CC BY 3.0
             derived from the Barrington Atlas of the Greek and Roman World
    box      37.9838N 23.7275E, 160 km — Marathon, Salamis, Thermopylae,
             Plataea, Delphi, Corinth, Sparta, Mycenae, all in one frame

── WHY THIS IS A HARVEST AND NOT AN AUTHORING JOB ─────────────────────────
NARROWS.csv was 33 places typed from knowledge, and the terrain harvest found
three of them wrong. THIS IS 1,783 PLACES AND NOBODY SHOULD TYPE THEM. What a
gazetteer holds — where, what kind, when attested — it holds better than
memory does, and it holds a citation with it.

What Pleiades does NOT hold is why any of it mattered. That sentence is the
only part worth writing by hand, and it is wanted for perhaps fifty of these,
not all 1,783. The register carries the rest.

── PLEIADES ALREADY KEEPS THIS MAP'S ONE LAW ──────────────────────────────
    location_precision = "precise"   a specific position on the earth
    location_precision = "rough"     the bounds within which the feature
                                     should be sought or might lie

That is A PIN AND A WASH, arrived at independently by classicists, and it is
carried straight through rather than re-derived. 1,573 precise and 210 rough
inside this box. A rough location drawn as a dot would be the same lie the
world map refuses 334 times over with "Southern Europe".

── AND THE DATES ARE PER LOCATION, NOT PER PLACE ──────────────────────────
Which is the right model and not the obvious one: a place can be attested at
several locations across different centuries. 1,190 of 1,273 locations carry a
span. Modern identifications are dated AD 2000-2099 and therefore vanish when
the map is scrubbed to 400 BC, which is exactly what should happen \u2014 a
twentieth-century survey point is not where the ancients put anything.

Where a place has several dated locations this takes the WIDEST span across
them and records how many there were, because collapsing them silently would
hide the disagreement the register is recording.

── WHAT IS DELIBERATELY DROPPED ───────────────────────────────────────────
    unlocated         41   Pleiades says it does not know where this is
    map label location 71  a cartographic artifact, not a place
    settlement-modern  52  a modern town, unless it is also an ancient one

Nothing else is filtered. A quarry and a tomb are as real as a temple.
============================================================================
"""
import csv, math, os, sys
csv.field_size_limit(10 ** 8)

GIS       = sys.argv[1] if len(sys.argv) > 1 else 'pl/data/gis'
OUT       = 'ATTICA.csv'
ACROPOLIS = (37.9838, 23.7275)
RADIUS_KM = 160.0

DROP_TYPES = {'unlocated', 'label', 'unlabeled', 'unknown'}


def num(v):
    try:
        return float(v)
    except Exception:
        return None


def km(la, lo):
    la1, lo1 = map(math.radians, ACROPOLIS)
    la2, lo2 = math.radians(la), math.radians(lo)
    return 6371 * 2 * math.asin(math.sqrt(
        math.sin((la2 - la1) / 2) ** 2 +
        math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2))


def rd(name):
    return list(csv.DictReader(open(os.path.join(GIS, name), encoding='utf-8-sig')))


def main():
    dlat = RADIUS_KM / 111.0
    dlon = RADIUS_KM / (111.0 * math.cos(math.radians(ACROPOLIS[0])))
    la0, la1 = ACROPOLIS[0] - dlat, ACROPOLIS[0] + dlat
    lo0, lo1 = ACROPOLIS[1] - dlon, ACROPOLIS[1] + dlon

    places = {}
    for r in rd('places.csv'):
        la, lo = num(r.get('representative_latitude')), num(r.get('representative_longitude'))
        if la is None or lo is None:
            continue
        if la0 <= la <= la1 and lo0 <= lo <= lo1:
            places[r['id'].strip()] = r

    terms = {r['key']: r['term'] for r in rd('place_types.csv')}
    kinds = {}
    for r in rd('places_place_types.csv'):
        pid = r['place_id'].strip()
        if pid in places:
            kinds.setdefault(pid, []).append(r['place_type'])

    # ── THE SPAN, TAKEN ACROSS EVERY DATED LOCATION ──────────────────────
    spans = {}
    for r in rd('location_points.csv'):
        pid = r['place_id'].strip()
        if pid not in places:
            continue
        a, b = num(r.get('year_after_which')), num(r.get('year_before_which'))
        if a is None and b is None:
            continue
        s = spans.setdefault(pid, {'from': None, 'until': None, 'n': 0})
        s['n'] += 1
        if a is not None:
            s['from'] = a if s['from'] is None else min(s['from'], a)
        if b is not None:
            s['until'] = b if s['until'] is None else max(s['until'], b)

    rows, dropped = [], 0
    for pid, p in places.items():
        ks = kinds.get(pid, [])
        if ks and all(k in DROP_TYPES for k in ks):
            dropped += 1
            continue
        la = float(p['representative_latitude'])
        lo = float(p['representative_longitude'])
        s = spans.get(pid, {})
        rows.append({
            'key':       'pl-' + pid,
            'name':      (p.get('title') or '').strip(),
            'kind':      '|'.join(terms.get(k, k) for k in ks),
            'tier':      'pin' if p.get('location_precision') == 'precise' else 'wash',
            'lat':       round(la, 5),
            'lon':       round(lo, 5),
            'from':      int(s['from']) if s.get('from') is not None else '',
            'until':     int(s['until']) if s.get('until') is not None else '',
            'locations': s.get('n', 0),
            'km':        round(km(la, lo), 1),
            'uri':       p.get('uri', ''),
            'why':       '',          # AUTHORED. Pleiades cannot hold this.
        })

    rows.sort(key=lambda r: r['km'])
    cols = ['key', 'name', 'kind', 'tier', 'lat', 'lon', 'from', 'until',
            'locations', 'km', 'uri', 'why']
    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    pins = sum(1 for r in rows if r['tier'] == 'pin')
    dated = sum(1 for r in rows if r['from'] != '' or r['until'] != '')
    print('=' * 66)
    print('  ATTICA \u00b7 harvested from Pleiades')
    print('=' * 66)
    print('  %d places within %.0f km of the Acropolis' % (len(rows), RADIUS_KM))
    print('  %d pin \u00b7 %d wash        (Pleiades precise / rough, carried through)' %
          (pins, len(rows) - pins))
    print('  %d dated (%.0f%%) \u00b7 %d dropped as unlocated or label-only' %
          (dated, 100.0 * dated / max(1, len(rows)), dropped))
    print()
    print('  nearest twelve:')
    for r in rows[:12]:
        print('    %5.1f km  %-30s %-8s %s' %
              (r['km'], r['name'][:30], r['tier'], (r['kind'] or '')[:26]))
    print()
    print('  \u2014 the `why` column is EMPTY and is the only part worth writing by')
    print('    hand. Perhaps fifty of these carry the story; the register carries')
    print('    the rest. Pleiades \u00b7 CC BY 3.0 \u00b7 cite the uri column.')
    print('=' * 66)


if __name__ == '__main__':
    main()
