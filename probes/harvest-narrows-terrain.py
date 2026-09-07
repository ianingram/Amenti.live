#!/usr/bin/env python3
"""
============================================================================
harvest-narrows-terrain.py  ·  MEASURE THE GROUND                  SLIP #74
----------------------------------------------------------------------------
NARROWS.csv is authored. Every coordinate in it was typed from knowledge, and
probe-narrows says plainly that it cannot check whether Thermopylae is where
the file puts it, because cities15000 holds cities and not passes.

THIS CAN. It reads the Copernicus GLO-30 digital surface model — 30 m radar
elevation, free, on AWS Open Data with no key — and measures the ground under
each entry. It does not move a coordinate and it does not add one. It reports
what the terrain says, so a human can confirm or correct.

    a machine may verify a place and must never invent one

── HOW IT READS 44 DEGREES OF THE EARTH WITHOUT DOWNLOADING THEM ───────────
The tiles are Cloud Optimized GeoTIFFs, so only the bytes for the requested
window travel. A 12 km box comes back in about a second. Fetching all 44 whole
tiles would be 1.5 GB; this is a few megabytes.

── WHAT IT MEASURES, AND WHAT IT CANNOT ────────────────────────────────────
FOR A FUNNEL, THE NARROWEST CROSSING. From the coordinate it walks outward in
36 directions until the ground rises past a threshold or falls into the sea,
and takes the smallest opposite-pair sum. That is the width of passable ground
at its tightest — the number that makes a pass a pass.

FOR A FORBIDDING PLACE, THE RELIEF. A bog is flat and low, and the DEM can say
whether ground is flat and low. IT CANNOT SAY WHETHER GROUND IS WET. Flat and
near sea level is CONSISTENT WITH a marsh and is not evidence of one; a dry
coastal plain reads identically. Reported as corroboration, never as proof.

AND IT IS A SURFACE MODEL, NOT A TERRAIN MODEL. Copernicus GLO-30 includes
buildings and vegetation. Over forest the "ground" is the canopy. That matters
least at a mountain pass and most in a river delta.

AND IT IS THE MODERN SURFACE. Thermopylae's shore has silted kilometres since
480 BC; the flat ground north of the cliff was seabed then. The DEM shows what
is there now and cannot show what was there then. Where that matters, the
`why` sentence in the register already says so.
============================================================================
"""
import csv, io, math, os, sys, time

os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')
os.environ.setdefault('GDAL_HTTP_UNSAFESSL', 'YES')   # container proxy, self-signed chain

import numpy as np
import rasterio
from rasterio.windows import from_bounds

S3 = ('https://copernicus-dem-30m.s3.amazonaws.com/'
      'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM/'
      'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM.tif')

# ── ONE BOX SIZE COULD NOT FIT THE EARTH · measured 7 Sep ──────────────────
# The first runs read a 12 km window for everything. Gibraltar's narrowest is
# about 13 km, so the walk reached the edge of the box before it reached
# Morocco and reported 9,630 m — a number that is really "wider than what I was
# allowed to look at". Bab-el-Mandeb, Hormuz and Malacca did the same.
#
# A DEFILE IS MEASURED IN HUNDREDS OF METRES AND A STRAIT IN TENS OF
# KILOMETRES. So the window follows the kind of thing being measured, and when
# a walk still reaches the edge THE RESULT SAYS SO rather than passing the box
# width off as a crossing.
BOX_KM = {
    'defile': 6.0, 'gate': 12.0, 'pass': 12.0, 'ford': 8.0,
    'strait': 45.0, 'isthmus': 60.0,
    'bog': 40.0, 'marsh': 40.0, 'fen': 40.0, 'forest': 40.0,
    'sand': 60.0, 'ice': 60.0,
}
BOX_DEFAULT = 12.0
RISE_M   = 150.0   # ground this far above the floor blocks a march
SAMPLES  = 36      # directions walked outward

# ── SEA IS NOT NEGATIVE IN THIS MODEL · measured 7 Sep ─────────────────────
# The first run tested `v < 0` for water and Thermopylae came back as a 4.5 km
# crossing — against a transect, read an hour earlier off the same tile, that
# showed 400 m of level ground between the cliff and the shore. Copernicus
# flattens water bodies to ABOUT zero, not below it: the Malian Gulf reads
# 0.0 and -0.0, so the walk north never met a blocker and ran to the edge of
# the box. The sea was there and the test could not see it.
SEA_M    = 0.5     # at or under this is water, and water stops a march


def tile_url(lat, lon):
    la = math.floor(lat); lo = math.floor(lon)
    return S3.format(ns='N' if la >= 0 else 'S', la=abs(la),
                     ew='E' if lo >= 0 else 'W', lo=abs(lo))


def read_box(lat, lon, km=BOX_DEFAULT):
    d_lat = km / 111.0 / 2
    d_lon = d_lat / max(0.2, math.cos(math.radians(lat)))
    try:
        with rasterio.open('/vsicurl/' + tile_url(lat, lon)) as s:
            w = from_bounds(lon - d_lon, lat - d_lat, lon + d_lon, lat + d_lat, s.transform)
            a = s.read(1, window=w, boundless=True, fill_value=np.nan).astype('float32')
    except Exception as e:
        return None, str(e)[:60], None
    if a.size == 0 or np.all(np.isnan(a)):
        return None, 'window empty', None
    m_per_px_y = (2 * d_lat * 111000.0) / a.shape[0]
    m_per_px_x = (2 * d_lon * 111000.0 * math.cos(math.radians(lat))) / a.shape[1]
    return a, None, (m_per_px_x, m_per_px_y)


def narrowest(a, px):
    """THE WIDTH OF PASSABLE GROUND AT ITS TIGHTEST.
       Walk out in 36 directions from the centre until the ground rises RISE_M
       above the floor or drops below the sea; the smallest opposite-pair sum
       is the crossing at its narrowest. A number, not an impression."""
    h, w = a.shape
    cy, cx = h // 2, w // 2
    floor = a[cy, cx]
    if np.isnan(floor):
        return None, None, None, False
    reach = min(h, w) // 2 - 1
    d = np.full(SAMPLES * 2, np.nan)
    hit_edge = np.zeros(SAMPLES * 2, dtype=bool)
    for k in range(SAMPLES * 2):
        th = math.pi * k / SAMPLES
        dx, dy = math.cos(th), -math.sin(th)
        blocked = reach
        for r in range(1, reach):
            y, x = int(round(cy + dy * r)), int(round(cx + dx * r))
            v = a[y, x]
            if np.isnan(v) or v > floor + RISE_M or v <= SEA_M:
                blocked = r
                break
        d[k] = blocked * math.hypot(dx * px[0], dy * px[1])
        hit_edge[k] = (blocked >= reach - 1)
    pairs = [(d[k] + d[k + SAMPLES], k) for k in range(SAMPLES)]
    gap, k = min(pairs)
    bearing = (90 - 180.0 * k / SAMPLES) % 360
    # BOTH ARMS RAN OUT OF BOX: this is not a crossing, it is the window.
    open_ended = bool(hit_edge[k] or hit_edge[k + SAMPLES])
    return gap, bearing, float(floor), open_ended


def narrowest_water(a, px):
    """A STRAIT IS A CONSTRICTION OF WATER, WHICH IS THE OPPOSITE MEASUREMENT.

       The land function walks until the ground RISES and calls that a blocker.
       Run over Gibraltar it starts in the sea, meets the sea test on step one,
       and reports a 50 m crossing — a number that means nothing at all. Seven
       entries came back that way before this existed.

       So this walks until the ground CLIMBS OUT OF THE WATER. The smallest
       opposite-pair sum is the width of the channel at its tightest: how far a
       ship has, and how far an army has not."""
    h, w = a.shape
    cy, cx = h // 2, w // 2
    reach = min(h, w) // 2 - 1
    d = np.full(SAMPLES * 2, np.nan)
    hit_edge = np.zeros(SAMPLES * 2, dtype=bool)
    for k in range(SAMPLES * 2):
        th = math.pi * k / SAMPLES
        dx, dy = math.cos(th), -math.sin(th)
        shore = reach
        for r in range(1, reach):
            y, x = int(round(cy + dy * r)), int(round(cx + dx * r))
            v = a[y, x]
            if np.isnan(v) or v > SEA_M:        # land
                shore = r
                break
        d[k] = shore * math.hypot(dx * px[0], dy * px[1])
        hit_edge[k] = (shore >= reach - 1)
    pairs = [(d[k] + d[k + SAMPLES], k) for k in range(SAMPLES)]
    gap, k = min(pairs)
    return gap, (90 - 180.0 * k / SAMPLES) % 360, bool(hit_edge[k] or hit_edge[k + SAMPLES])


def main(root='.'):
    raw = open(os.path.join(root, 'NARROWS.csv'), encoding='utf-8').read().split('\n')
    body = [l for l in raw[1:] if l.strip() and not l.lstrip().startswith('#')]
    rd = list(csv.reader(io.StringIO('\n'.join([raw[0]] + body))))
    cols, rows = rd[0], [dict(zip(rd[0], r)) for r in rd[1:]]

    print('=' * 74)
    print('  HARVEST \u00b7 THE GROUND UNDER NARROWS.csv     Copernicus GLO-30, 30 m')
    print('=' * 74)
    print()
    print('  %-22s %8s %8s %9s %8s  %s' %
          ('place', 'floor', 'rise', 'crossing', 'bearing', 'reads as'))
    print('  ' + '-' * 70)

    out, blind = [], []
    for r in rows:
        lat, lon = float(r['lat']), float(r['lon'])
        if r['lat2']:                       # a line: measure at its midpoint
            lat = (lat + float(r['lat2'])) / 2
            lon = (lon + float(r['lon2'])) / 2
        km = BOX_KM.get(r['kind'], BOX_DEFAULT)
        a, err, px = read_box(lat, lon, km)
        if a is None:
            blind.append('%s \u2014 %s' % (r['key'], err))
            print('  %-22s %s' % (r['name'][:22], 'UNREAD \u2014 ' + err))
            continue
        finite = a[np.isfinite(a)]
        # ── MAX MINUS MIN IS THE WRONG STATISTIC OVER A BIG WINDOW ────────
        # Widening the box to fit a sand sea also let one hill in, and the Rub
        # al Khali came back with 71 m of relief and a verdict of "not flat".
        # A single outlier decides max-minus-min, so the measure said more about
        # the largest dune in 60 km than about the ground.
        #
        # The 5th-to-95th percentile spread describes the GROUND rather than its
        # extremes. The true min and max are still reported — they are real —
        # but the flatness verdict is taken from the body of the distribution.
        lo_m, hi_m = float(finite.min()), float(finite.max())
        p5, p95 = (float(np.percentile(finite, 5)), float(np.percentile(finite, 95)))
        spread = p95 - p5
        gap, bearing, floor, edge = narrowest(a, px)
        # A STRAIT AND A FORD ARE MEASURED IN WATER, NOT IN GROUND.
        if r['kind'] in ('strait', 'ford'):
            gap, bearing, edge = narrowest_water(a, px)
        relief = hi_m - lo_m
        sea = float((finite <= 0).mean())

        if r['class'] == 'funnel':
            if gap is None:
                reads = 'no crossing found'
            elif edge:
                reads = 'WIDER THAN THE %d km WINDOW \u2014 this is the box, not a crossing' % km
            elif gap < 4000:
                reads = 'a constriction'
            else:
                reads = 'open ground \u2014 %0.1f km, no constriction here' % (gap / 1000)
        else:
            # ── `lo_m < 120` WAS A THRESHOLD WITH NOTHING BEHIND IT ────────
            # The Pripet Marshes sit at 175 m. They are flat and they are not
            # low, and the first run therefore reported the largest wetland in
            # Europe as "not marsh ground". ABSOLUTE ELEVATION SAYS NOTHING
            # ABOUT WHETHER GROUND IS WET. A plateau marsh is still a marsh.
            #
            # Flatness is the only thing a surface model can speak to here, and
            # even that is CORROBORATION AND NEVER PROOF: a dry coastal plain
            # reads identically to a fen. So it reports the relief and says
            # what that is worth.
            # ── A SAND SEA IS FLAT TOO \u00b7 found 7 Sep ─────────────────────
            # The first version called every `forbid` a wetland candidate, so
            # the Rub al Khali and the Taklamakan came back as "consistent with
            # wetland". Flatness is shared by a marsh and a desert; what the
            # kind column already says is which one is claimed. The DEM tests
            # the claim it was given, and never guesses the claim.
            expect_flat = r['kind'] in ('bog', 'marsh', 'fen', 'sand')
            word = {'sand': 'sand sea', 'forest': 'forest'}.get(r['kind'], 'wetland')
            if not expect_flat:
                reads = 'spread %d m \u2014 nothing here tests a %s' % (spread, r['kind'])
            elif spread < 60:
                reads = 'flat (%d m across the middle 90%%) \u2014 consistent with %s, ' \
                        'and not evidence of it' % (spread, word)
            else:
                reads = 'NOT FLAT \u2014 %d m across the middle 90%%; %s is unlikely here' % (spread, word)

        print('  %-22s %7.0fm %7.0fm %8s %7s  %s' %
              (r['name'][:22], floor if floor is not None else 0, relief,
               ('%.0f m' % gap) if gap is not None else '\u2014',
               ('%03.0f\u00b0' % bearing) if bearing is not None else '\u2014', reads))
        out.append({'key': r['key'], 'floor_m': round(floor or 0),
                    'relief_m': round(relief), 'spread_m': round(spread), 'crossing_m': round(gap) if gap else '',
                    'crossing_bearing': round(bearing) if bearing is not None else '',
                    'sea_fraction': round(sea, 3), 'reads': reads})
        time.sleep(0.15)

    with open(os.path.join(root, 'NARROWS-terrain.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['key', 'floor_m', 'relief_m', 'spread_m', 'crossing_m',
                                          'crossing_bearing', 'sea_fraction', 'reads'])
        w.writeheader(); w.writerows(out)

    print()
    print('  measured %d of %d \u00b7 written to NARROWS-terrain.csv' % (len(out), len(rows)))
    if blind:
        print()
        print('  UNREAD \u2014 things this could not see, none of them a fault:')
        for b in blind:
            print('    ' + b)
    print()
    print('  \u2014 THIS MOVES NO COORDINATE. Where the terrain disagrees with the')
    print('    register, the register is what needs a human, not the other way round.')
    print('=' * 74)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
