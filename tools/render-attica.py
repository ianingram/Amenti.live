#!/usr/bin/env python3
"""
============================================================================
render-attica.py  ·  THE GROUND AROUND ATHENS, LAND AND SEA
----------------------------------------------------------------------------
A 100-mile radius from the Acropolis, at 30 m on land and the best available
under water. Produces ATTICA.jpg.

── WHY 100 MILES ──────────────────────────────────────────────────────────
Measured, not chosen. What falls inside each radius from 37.9838N 23.7275E:

     25 mi   Piraeus, Salamis, Marathon, Eleusis, Aegina, Megara
     50 mi   + Corinth, Thebes, Sounion, Plataea, Euboea, Epidaurus
    100 mi   + Delphi, Sparta, Argos, Mycenae, THERMOPYLAE, Delos
    150 mi   + Olympia and one island, for four times the area

At 100 miles the entire Persian Wars are in one frame — Marathon, Salamis,
Thermopylae, Plataea — with Delphi, Sparta and Mycenae. That is the natural
edge of classical Greece and the next step out buys almost nothing.

── AND WHY TWO SOURCES ────────────────────────────────────────────────────
COPERNICUS GLO-30 IS LAND ONLY. It flattens water to about zero, so on its own
the Saronic Gulf is a blank sheet — and Salamis is a naval battle in a strait,
the Piraeus is a harbour, and the sea here is not scenery but the subject.

GEBCO/ETOPO carries the seabed. It is coarser — 1.8 km against 30 m — and that
asymmetry is real and worth stating rather than hiding: THE LAND IS SIXTY TIMES
FINER THAN THE WATER in this image. A reader looking at the shape of a bay is
reading 30 m data; a reader looking at the channel floor is reading something
much softer, upsampled.

The two are blended on the waterline: Copernicus where it says land, ETOPO
where Copernicus says water.

── THE COASTLINE IS MODERN, AND THAT IS A CLAIM ───────────────────────────
Every shore here is today's. Thermopylae's has moved six kilometres since 480
BC — measured this same session — and the Piraeus, Eleusis and Marathon are all
silted. The terrain is the baseline BECAUSE it is complete and free, not
because it is contemporary with anything in the register. What was seabed then
and is farmland now shows as flat ground at sea level, and it is the flatness
rather than the colour that says so.
============================================================================
"""
import os, math, sys
os.environ.setdefault('GDAL_HTTP_UNSAFESSL', 'YES')
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')

import numpy as np
import rasterio
from rasterio.windows import from_bounds
import netCDF4 as nc
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ACROPOLIS = (37.9838, 23.7275)
RADIUS_KM = 160.0
OUT_PX    = 8192          # ~39 m a pixel across the box; land data is 30 m
OUT       = 'ATTICA.jpg'
# ── THE SEA NEEDED ITS OWN SOURCE · found by looking, 7 Sep ───────────────
# The first render used ETOPO at 60 arc-second — 1.8 km — because that is
# finer than the WORLD map can display. This is a REGIONAL render at 39 m a
# pixel, and the argument does not carry: 1.8 km stretched forty-five times
# came out as visible squares across half the frame. The Salamis strait, which
# is the reason to look at this region at all, was four pixels of blur.
#
# 15 arc-second is 462 m, four times finer, same source, public domain. It is
# still coarser than the land by an order of magnitude, and that asymmetry is
# real: A READER LOOKING AT A BAY IS READING 30 m DATA AND A READER LOOKING AT
# THE CHANNEL FLOOR IS READING 462 m. But it stops being squares.
ETOPO     = 'etopo15.nc'

COP = ('https://copernicus-dem-30m.s3.amazonaws.com/'
       'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM/'
       'Copernicus_DSM_COG_10_{ns}{la:02d}_00_{ew}{lo:03d}_00_DEM.tif')

SEA_DEEP    = np.array([  5,   9,  20], np.float32)
SEA_SHALLOW = np.array([ 30,  64,  96], np.float32)
LAND_LOW    = np.array([ 26,  28,  30], np.float32)
LAND_HIGH   = np.array([132, 134, 132], np.float32)
AZ, ALT = 315.0, 45.0


def box():
    dlat = RADIUS_KM / 111.0
    dlon = RADIUS_KM / (111.0 * math.cos(math.radians(ACROPOLIS[0])))
    return (ACROPOLIS[0] - dlat, ACROPOLIS[0] + dlat,
            ACROPOLIS[1] - dlon, ACROPOLIS[1] + dlon)


def land_grid(la0, la1, lo0, lo1, h, w):
    """Copernicus, mosaicked from the 20 one-degree tiles this box touches.

       THEY ARE READ FROM DISK, NOT OVER THE WIRE. Strip processing calls this
       once per band, and reaching for 20 remote COGs sixteen times over is 320
       fetches for data that never changes. Downloaded once — 308 MB — and read
       locally after.

       NaN where a tile has no data, which over open sea is most of them and is
       not a fault: Copernicus has no ocean tiles at all. That absence is what
       the sea grid fills."""
    out = np.full((h, w), np.nan, np.float32)
    for la in range(math.floor(la0), math.floor(la1) + 1):
        for lo in range(math.floor(lo0), math.floor(lo1) + 1):
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
    """ETOPO, nearest-sampled up to the output grid. Coarse on purpose and
       stated as such: 1.8 km stretched to 39 m is not detail, it is a floor."""
    d = nc.Dataset(ETOPO)
    lat = d.variables['lat'][:]; lon = d.variables['lon'][:]
    y0 = int(np.searchsorted(lat, la0)) - 1
    y1 = int(np.searchsorted(lat, la1)) + 1
    x0 = int(np.searchsorted(lon, lo0)) - 1
    x1 = int(np.searchsorted(lon, lo1)) + 1
    z = np.asarray(d.variables['z'][y0:y1, x0:x1], np.float32)[::-1]   # ETOPO runs S->N
    yi = np.clip(((np.linspace(la1, la0, h) - lat[y0]) / (lat[y1 - 1] - lat[y0])
                  * (z.shape[0] - 1)), 0, z.shape[0] - 1)
    yi = (z.shape[0] - 1) - yi.astype(np.int32)
    xi = np.clip(((np.linspace(lo0, lo1, w) - lon[x0]) / (lon[x1 - 1] - lon[x0])
                  * (z.shape[1] - 1)), 0, z.shape[1] - 1).astype(np.int32)
    return z[yi][:, xi]


def main():
    la0, la1, lo0, lo1 = box()
    aspect = (la1 - la0) / ((lo1 - lo0) * math.cos(math.radians(ACROPOLIS[0])))
    W = OUT_PX
    H = int(W * aspect)
    print('box  lat %.3f..%.3f  lon %.3f..%.3f' % (la0, la1, lo0, lo1))
    print('out  %d x %d  (~%.0f m a pixel)' % (W, H, RADIUS_KM * 2000 / W))

    # ── IT IS DONE IN STRIPS · found by being killed ──────────────────────
    # The first version built every array at full size: land, sea, blend,
    # two gradients, slope, aspect, shade and three colour channels, each
    # 8192 x 8191 float32 at 268 MB. The kernel stopped it around 3 GB.
    #
    # Nothing about the computation needs the whole image at once — every
    # value depends on its own neighbourhood and nothing further. So it is
    # cut into bands with one row of overlap, which is what the world render
    # already did and what this should have done from the start.
    STRIP = 512
    out = Image.new('RGB', (W, H))
    az, alt = math.radians(360 - AZ + 90), math.radians(ALT)

    for y0 in range(0, H, STRIP):
        y1 = min(H, y0 + STRIP)
        # the band in degrees, with a row of overlap so the slope at a seam
        # is computed from real neighbours and not from the edge of a strip
        b1 = la1 - (y0 / H) * (la1 - la0)
        b0 = la1 - (y1 / H) * (la1 - la0)
        pad = (la1 - la0) / H
        land = land_grid(b0 - pad, b1 + pad, lo0, lo1, (y1 - y0) + 2, W)
        sea  = sea_grid(b0 - pad, b1 + pad, lo0, lo1, (y1 - y0) + 2, W)

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

        rgb = np.empty(a.shape + (3,), np.float32)
        water = ~is_land
        d = np.clip(-a, 0, 2500) / 2500.0
        t = np.power(d, 0.35)[..., None]
        rgb[water] = (SEA_SHALLOW * (1 - t) + SEA_DEEP * t)[water]
        rgb[water] *= (0.80 + 0.35 * shade[..., None])[water]
        e = np.clip(a, 0, 2500) / 2500.0
        t = np.power(e, 0.6)[..., None]
        rgb[is_land] = (LAND_LOW * (1 - t) + LAND_HIGH * t)[is_land]
        rgb[is_land] *= (0.45 + 0.95 * shade[..., None])[is_land]

        band = np.clip(rgb[1:-1], 0, 255).astype(np.uint8)
        out.paste(Image.fromarray(band), (0, y0))
        print('  %5.1f%%   land %.0f%%' % (100.0 * y1 / H, is_land.mean() * 100), flush=True)

    out.save(OUT, quality=90, optimize=True, progressive=True)
    print('wrote %s  %.1f MB' % (OUT, os.path.getsize(OUT) / 1048576))


if __name__ == '__main__':
    main()
