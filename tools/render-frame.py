#!/usr/bin/env python3
"""
============================================================================
render-frame.py  ·  A PANE OF GROUND FOR ANY FRAME, IN ANY RAMP
----------------------------------------------------------------------------
render-attica.py cut one box and painted it one way. This cuts ANY box in
FRAMES.csv and paints it either way, from the same two sources:

    Copernicus GLO-30 on land          30 m
    ETOPO 15 arc-second under water    462 m

    python3 tools/render-frame.py . attica              -> ATTICA.jpg
    python3 tools/render-frame.py . attica --ramp crust -> ATTICA-CRUST.jpg
    python3 tools/render-frame.py . macedonia --fetch

── WHY THIS EXISTS: TWO PANES OF GLASS ────────────────────────────────────
The reader wanted the hypsometric rendering laid OVER the satellite one, both
switchable, with the places and the marks unmoved. That is only possible if
the two images are the same cut.

THE FRAME ROW IS THE STAMP. `boxOf()` here is the same two lines as
amenti-attica.js and as bake-frame.py — copied rather than approximated,
because two functions computing the same box will agree until one frame
changes and then disagree by a few pixels for ever, with nothing on the
surface to show it. Anything cut to those four numbers overlays anything else
cut to them, pixel for pixel.

So a skin is not a filter and not a different projection. IT IS THE SAME
ELEVATION, PAINTED TWICE.

── AND WHY NOT GEBCO ──────────────────────────────────────────────────────
tools/bake-frame.py can produce a crust from GEBCO's 15 arc-second grid in
two minutes, at 240 pixels per degree. ATTICA.jpg is about 2,840. Stacking
those two would be fading between a photograph and a thumbnail — so the crust
pane is rendered from the SAME sources as the satellite pane, at the same
size, and the panes match.

── THE ASYMMETRY IS REAL AND IS NOT HIDDEN ────────────────────────────────
The land is sixty times finer than the water in either ramp. A reader looking
at the shape of a bay is reading 30 m data; a reader looking at the channel
floor is reading 462 m, upsampled. That was true of render-attica.py and it is
true here, and the `-GROUND.json` beside each image says so.

── THE COASTLINE IS MODERN, IN BOTH RAMPS ─────────────────────────────────
Every shore is today's. Thermopylae's has moved six kilometres since 480 BC;
Piraeus, Eleusis and Marathon are silted. What was seabed then and is farmland
now shows as flat ground at sea level, and it is the FLATNESS rather than the
colour that says so — which is one reason the crust ramp is worth having, since
it makes that flatness legible where the satellite ramp makes it green.
============================================================================
"""
import argparse, csv, io, json, math, os, sys, urllib.request
os.environ.setdefault('GDAL_HTTP_UNSAFESSL', 'YES')
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')

import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ETOPO = 'etopo15.nc'
COP_TILE = ('https://copernicus-dem-30m.s3.amazonaws.com/'
            'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM/'
            'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM.tif')
AZ, ALT = 315.0, 45.0

# ── the two ramps ─────────────────────────────────────────────────────────
# SATELLITE is render-attica.py's, unchanged, so ATTICA.jpg re-renders
# identically. CRUST is one scale through zero: the coast is not drawn, it is
# where the surface crosses sea level.
SAT = dict(
    sea_deep=(5, 9, 20), sea_shallow=(30, 64, 96),
    land_low=(26, 28, 30), land_high=(132, 134, 132),
    sea_lift=(0.80, 0.35), land_lift=(0.45, 0.95))

CRUST_STOPS = [(-5200, (7, 12, 28)), (-3000, (13, 26, 50)), (-1500, (21, 44, 72)),
               (-600, (33, 66, 94)), (-200, (50, 90, 114)), (-50, (74, 112, 130)),
               (-1, (98, 130, 142)), (1, (70, 92, 68)), (200, (100, 116, 76)),
               (700, (140, 132, 90)), (1500, (174, 160, 124)),
               (2500, (212, 206, 196)), (3800, (252, 252, 254))]


def read_frames(root):
    raw = open(os.path.join(root, 'FRAMES.csv'), encoding='utf-8').read().split('\n')
    data = '\n'.join(l for l in raw if not l.startswith('#'))
    rows = [r for r in csv.reader(io.StringIO(data)) if r and any(r)]
    head = [h.strip() for h in rows[0]]
    return [dict(zip(head, r)) for r in rows[1:] if r[0].strip()]


def box_of(f):
    """THE SAME TWO LINES AS THE SURFACE. If these ever disagree, the pane will
       be cut somewhere the frame is not looking and the stack will not align."""
    la, lo, R = float(f['lat']), float(f['lon']), float(f['radius_km'])
    dla = R / 111.0
    dlo = R / (111.0 * math.cos(math.radians(la)))
    return la - dla, la + dla, lo - dlo, lo + dlo


def tiles_for(la0, la1, lo0, lo1):
    out = []
    for la in range(math.floor(la0), math.floor(la1) + 1):
        for lo in range(math.floor(lo0), math.floor(lo1) + 1):
            out.append((la, lo))
    return out


def fetch_tiles(la0, la1, lo0, lo1):
    """Copernicus has NO OCEAN TILES AT ALL, so a 404 over water is the
       expected answer and not a failure. The absence is what the sea grid
       fills, and a frame that is mostly sea will fetch very few."""
    os.makedirs('cop', exist_ok=True)
    got = miss = 0
    for la, lo in tiles_for(la0, la1, lo0, lo1):
        dst = 'cop/N%02dE%03d.tif' % (la, lo)
        if os.path.exists(dst):
            got += 1
            continue
        url = COP_TILE.format(ns='N' if la >= 0 else 'S', la=abs(la),
                              ew='E' if lo >= 0 else 'W', lo=abs(lo))
        try:
            with urllib.request.urlopen(url, timeout=300) as r:
                open(dst, 'wb').write(r.read())
            got += 1
            print('    fetched %s' % os.path.basename(dst))
        except Exception:
            miss += 1
    print('  %d land tiles on disk, %d absent (open sea)' % (got, miss))


def land_grid(la0, la1, lo0, lo1, h, w):
    import rasterio
    from rasterio.windows import from_bounds
    out = np.full((h, w), np.nan, np.float32)
    for la, lo in tiles_for(la0, la1, lo0, lo1):
        f = 'cop/N%02dE%03d.tif' % (la, lo)
        if not os.path.exists(f):
            continue
        try:
            with rasterio.open(f) as s:
                a = s.read(1, window=from_bounds(lo0, la0, lo1, la1, s.transform),
                           out_shape=(h, w), boundless=True,
                           fill_value=np.nan).astype(np.float32)
            out = np.where(np.isnan(out), a, out)
        except Exception:
            pass
    return out


def sea_grid(la0, la1, lo0, lo1, h, w):
    import netCDF4 as nc
    d = nc.Dataset(ETOPO)
    lat = d.variables['lat'][:]; lon = d.variables['lon'][:]
    y0 = int(np.searchsorted(lat, la0)) - 1
    y1 = int(np.searchsorted(lat, la1)) + 1
    x0 = int(np.searchsorted(lon, lo0)) - 1
    x1 = int(np.searchsorted(lon, lo1)) + 1
    z = np.asarray(d.variables['z'][y0:y1, x0:x1], np.float32)[::-1]
    yi = np.clip(((np.linspace(la1, la0, h) - lat[y0]) / (lat[y1 - 1] - lat[y0])
                  * (z.shape[0] - 1)), 0, z.shape[0] - 1)
    yi = (z.shape[0] - 1) - yi.astype(np.int32)
    xi = np.clip(((np.linspace(lo0, lo1, w) - lon[x0]) / (lon[x1 - 1] - lon[x0])
                  * (z.shape[1] - 1)), 0, z.shape[1] - 1).astype(np.int32)
    return z[yi][:, xi]


def crust_rgb(a):
    out = np.zeros(a.shape + (3,), np.float32)
    for k in range(len(CRUST_STOPS) - 1):
        lo, ca = CRUST_STOPS[k]
        hi, cb = CRUST_STOPS[k + 1]
        m = (a >= lo) & (a <= hi)
        t = np.zeros_like(a, np.float32)
        t[m] = ((a[m] - lo) / (hi - lo)).astype(np.float32)
        for c in range(3):
            out[..., c][m] = ca[c] + (cb[c] - ca[c]) * t[m]
    out[a < CRUST_STOPS[0][0]] = CRUST_STOPS[0][1]
    out[a > CRUST_STOPS[-1][0]] = CRUST_STOPS[-1][1]
    return out


def render(root, f, ramp, px):
    la0, la1, lo0, lo1 = box_of(f)
    key = f['key'].strip().upper()
    name = key + ('-CRUST.jpg' if ramp == 'crust' else '.jpg')
    aspect = (la1 - la0) / ((lo1 - lo0) * math.cos(math.radians(float(f['lat']))))
    W = px
    H = int(W * aspect)
    m_per_px = float(f['radius_km']) * 2000 / W
    print('  box  lat %.3f..%.3f  lon %.3f..%.3f' % (la0, la1, lo0, lo1))
    print('  out  %s  %d x %d  (~%.0f m a pixel)' % (name, W, H, m_per_px))

    STRIP = 512
    out = Image.new('RGB', (W, H))
    az, alt = math.radians(360 - AZ + 90), math.radians(ALT)

    for y0 in range(0, H, STRIP):
        y1 = min(H, y0 + STRIP)
        b1 = la1 - (y0 / H) * (la1 - la0)
        b0 = la1 - (y1 / H) * (la1 - la0)
        pad = (la1 - la0) / H
        land = land_grid(b0 - pad, b1 + pad, lo0, lo1, (y1 - y0) + 2, W)
        sea = sea_grid(b0 - pad, b1 + pad, lo0, lo1, (y1 - y0) + 2, W)
        is_land = np.isfinite(land) & (land > 0.5)
        a = np.where(is_land, np.nan_to_num(land), sea).astype(np.float32)

        lat = np.linspace(b1 + pad, b0 - pad, a.shape[0])
        mx = (lo1 - lo0) / W * 111320.0 * np.cos(np.radians(lat))[:, None]
        my = (la1 - la0) / H * 110540.0
        gx = np.gradient(a, axis=1) / np.maximum(mx, 1.0)
        gy = np.gradient(a, axis=0) / my
        slope = np.arctan(np.hypot(gx, gy))
        asp = np.arctan2(-gx, gy)
        shade = np.clip(np.sin(alt) * np.cos(slope) +
                        np.cos(alt) * np.sin(slope) * np.cos(az - asp), 0, 1)

        if ramp == 'crust':
            rgb = crust_rgb(a)
            # one shade over the whole crust, sea floor included: it is all
            # relief, and lighting only the land would say the seabed is flat
            rgb *= (0.62 + 0.62 * shade[..., None])
        else:
            P = SAT
            rgb = np.empty(a.shape + (3,), np.float32)
            water = ~is_land
            d = np.clip(-a, 0, 2500) / 2500.0
            t = np.power(d, 0.35)[..., None]
            rgb[water] = (np.array(P['sea_shallow'], np.float32) * (1 - t) +
                          np.array(P['sea_deep'], np.float32) * t)[water]
            rgb[water] *= (P['sea_lift'][0] + P['sea_lift'][1] * shade[..., None])[water]
            e = np.clip(a, 0, 2500) / 2500.0
            t = np.power(e, 0.6)[..., None]
            rgb[is_land] = (np.array(P['land_low'], np.float32) * (1 - t) +
                            np.array(P['land_high'], np.float32) * t)[is_land]
            rgb[is_land] *= (P['land_lift'][0] + P['land_lift'][1] * shade[..., None])[is_land]

        out.paste(Image.fromarray(np.clip(rgb[1:-1], 0, 255).astype(np.uint8)), (0, y0))
        print('    %5.1f%%   land %.0f%%' % (100.0 * y1 / H, is_land.mean() * 100),
              flush=True)

    dst = os.path.join(root, name)
    out.save(dst, quality=90, optimize=True, progressive=True)
    meta = {'key': f['key'], 'ramp': ramp, 'file': name,
            'bounds': {'la0': round(la0, 5), 'la1': round(la1, 5),
                       'lo0': round(lo0, 5), 'lo1': round(lo1, 5)},
            'ground_px': W, 'm_per_px': round(m_per_px, 1),
            'land': 'Copernicus GLO-30, 30 m',
            'sea': 'ETOPO 15 arc-second, 462 m',
            'note': ('THE LAND IS SIXTY TIMES FINER THAN THE WATER. Same cut as '
                     'every other pane of this frame, so they stack pixel for '
                     'pixel. The coastline is modern.')}
    open(os.path.join(root, key + '-GROUND.json'), 'w').write(
        json.dumps(meta, indent=2) + '\n')
    print('  wrote %s  %.1f MB' % (name, os.path.getsize(dst) / 1048576))
    print('  FRAMES.csv: ground=%s  ground_px=%d  m_per_px=%.0f'
          % (name, W, m_per_px))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('root')
    ap.add_argument('key')
    ap.add_argument('--ramp', choices=['satellite', 'crust'], default='satellite')
    ap.add_argument('--px', type=int, default=8192)
    ap.add_argument('--fetch', action='store_true',
                    help='download the Copernicus tiles this box needs')
    a = ap.parse_args()

    f = [x for x in read_frames(a.root) if x['key'].strip() == a.key]
    if not f:
        print('no frame keyed %r' % a.key); sys.exit(1)
    f = f[0]
    print('%s  %s  radius %s km' % (f['key'], f.get('name', ''), f.get('radius_km')))
    la0, la1, lo0, lo1 = box_of(f)
    if a.fetch:
        fetch_tiles(la0, la1, lo0, lo1)
    if not os.path.exists(ETOPO):
        print('  %s is not here. The sea cannot be drawn without it.' % ETOPO)
        sys.exit(1)
    render(a.root, f, a.ramp, a.px)


if __name__ == '__main__':
    main()
