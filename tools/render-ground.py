#!/usr/bin/env python3
"""
============================================================================
render-ground.py  ·  THE GROUND, COMPUTED                          SLIP #65
----------------------------------------------------------------------------
Makes GROUND.jpg: a global relief and bathymetry image in the map's own
equirectangular projection, tinted into the map's own palette.

── WHY THIS AND NOT THE RELIEF ALREADY THERE ───────────────────────────────
RELIEF.jpg is Natural Earth's shaded relief, a picture. It works only because
it happens to share the map's projection, it is CLIPPED TO WORLD.json's baked
land path so it cannot follow the map anywhere else, and IT STOPS AT THE
COASTLINE. In a zoomed view of the Aegean the sea is one flat colour across
most of the screen.

This is computed from ETOPO 2022, which is a CONTINUOUS model of land and sea
in one grid: negative is depth, positive is height. So the sea gets a floor —
the shelf around the islands, the deep basin, the trench south of Crete — and
that is most of what a reader is looking at in any Mediterranean view.

And because it is GENERATED, it comes out in whatever projection is asked for.
The current relief matches the map by luck. This matches by construction, and
the same script produces the globe's version when the globe needs one.

── HOW BIG, AND WHY NOT TILES ──────────────────────────────────────────────
    viewBox 1000 wide  ·  K_MAX 14  ·  the svg is about 930 px on screen
    → at full zoom the world spans roughly 13,000 screen pixels

A single 16384-wide image covers the map's maximum zoom with margin. NO TILE
PYRAMID, no streaming, no viewport culling — all of which were proposed and
none of which are needed. One file, loaded once, panned and zoomed by the
transform that already exists.

ETOPO at 60 arc-second is 21600 across, so this DOWNSAMPLES. That is not a
loss: at the map's closest view one screen pixel is about 3 km, and 60
arc-second is 1.8 km. The source is already finer than the surface can draw.

── THE PALETTE IS THE MAP'S, NOT AN ATLAS'S ────────────────────────────────
Atlas brown and ocean blue would fight everything drawn on top. Sea #080d16,
land #0e1420, shore #31435c are the map's own values; the relief is shaded
INTO them so the ground stays ground and the marks stay legible above it.

GOLD IS NOT SPENT HERE. It is a verified quote and nothing else.
============================================================================
"""
import sys, math
import numpy as np
import netCDF4 as nc
from PIL import Image

SRC   = 'etopo60.nc'
OUT   = 'GROUND.jpg'
W, H  = 16384, 8192          # covers K_MAX=14 with margin
STRIP = 512                  # output rows held at once — 4 GB of RAM, not 40

# ── SEA AND LAND MUST SEPARATE AT THE SHORE · found by looking ────────────
# The first palette used the map's literal values: sea #080d16 and land
# #0e1420. They differ by six in each channel, which is why the flat map needs
# a drawn coastline to be readable at all. Shaded, they were indistinguishable
# and the Aegean had no edge.
#
# So the two stay dark and stop being the same dark. THE SEA IS COOL AND
# BLUE-SHIFTED, THE LAND IS WARM AND GREY. Neither competes with a cyan pin,
# an amber sky mark or an ember event, and gold is not spent here.
SEA_DEEP    = np.array([  5,   9,  20], np.float32)   # abyss
SEA_SHALLOW = np.array([ 26,  56,  84], np.float32)   # the shelf, plainly water
LAND_LOW    = np.array([ 26,  28,  30], np.float32)   # coastal ground, warm grey
LAND_HIGH   = np.array([116, 118, 116], np.float32)   # summits

AZ, ALT = 315.0, 45.0        # light from the north-west, the cartographic default


def main():
    ds = nc.Dataset(SRC)
    z  = ds.variables['z']
    sh, sw = z.shape
    print('source %d x %d   output %d x %d' % (sw, sh, W, H))

    out = Image.new('RGB', (W, H))
    az, alt = math.radians(360 - AZ + 90), math.radians(ALT)

    for y0 in range(0, H, STRIP):
        y1 = min(H, y0 + STRIP)
        # ── ETOPO RUNS SOUTH TO NORTH · found by looking at the picture ───
        # lat[0] is -89.992 and lat[-1] is +89.992, and the first render
        # assumed the opposite. The Aegean came out as the Southern Ocean and
        # the mistake was obvious the moment a crop was opened — which is the
        # argument for cropping before shipping, not after.
        #
        # Output row 0 is the NORTH edge. So the source rows for a strip are
        # counted from the far end, and the block is flipped as it is read.
        top = 1.0 - y1 / H
        bot = 1.0 - y0 / H
        s0 = max(0, int(top * sh) - 1)
        s1 = min(sh, int(bot * sh) + 1)
        block = np.asarray(z[s0:s1, :], dtype=np.float32)[::-1]

        # resample to output width and strip height
        yi = np.linspace(s1 - bot * sh, s1 - top * sh, y1 - y0, endpoint=False)
        xi = np.linspace(0, sw, W, endpoint=False)
        yi = np.clip(yi.astype(np.int32), 0, block.shape[0] - 1)
        xi = np.clip(xi.astype(np.int32), 0, sw - 1)
        a = block[yi][:, xi]

        # ── SLOPE, IN THE UNITS THE GROUND IS IN ─────────────────────────
        # A degree of longitude shrinks with latitude; ignoring that stretches
        # the shading toward the poles and makes Scandinavia look steeper than
        # the Alps. The cell size is computed per row.
        lat = 90.0 - (np.arange(y0, y1) + 0.5) / H * 180.0
        mx = (360.0 / W) * 111320.0 * np.cos(np.radians(lat))[:, None]
        my = (180.0 / H) * 110540.0

        gx = np.gradient(a, axis=1) / np.maximum(mx, 1.0)
        gy = np.gradient(a, axis=0) / my
        slope  = np.arctan(np.hypot(gx, gy))
        aspect = np.arctan2(-gx, gy)
        shade  = (np.sin(alt) * np.cos(slope) +
                  np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
        shade  = np.clip(shade, 0.0, 1.0)

        sea  = a <= 0
        rgb  = np.empty(a.shape + (3,), np.float32)

        # ── THE SEA HAS A FLOOR ──────────────────────────────────────────
        # Depth on a square root, because the shelf is where everything
        # happened and a linear ramp spends all its range on the abyss.
        # ── THE SHELF GETS THE RANGE, NOT THE ABYSS ──────────────────────
        # Every coast this map cares about sits on a shelf 200 m deep or less,
        # and a linear ramp to 6000 m spends its whole range on open ocean
        # nobody is looking at. A cube root puts most of the contrast in the
        # first few hundred metres, so the Aegean shows its floor.
        d = np.clip(-a, 0, 6000) / 6000.0
        t = np.power(d, 0.33)[..., None]
        rgb[sea] = (SEA_SHALLOW * (1 - t) + SEA_DEEP * t)[sea]
        # the seabed is shaded too, more softly — it is ground, seen through water
        rgb[sea] *= (0.75 + 0.45 * shade[..., None])[sea]

        # ── AND THE LAND CLIMBS ──────────────────────────────────────────
        e = np.clip(a, 0, 5000) / 5000.0
        t = np.power(e, 0.55)[..., None]
        land = ~sea
        rgb[land] = (LAND_LOW * (1 - t) + LAND_HIGH * t)[land]
        rgb[land] *= (0.55 + 0.85 * shade[..., None])[land]

        out.paste(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)), (0, y0))
        if y0 % (STRIP * 8) == 0:
            print('  %5.1f%%' % (100.0 * y1 / H), flush=True)

    out.save(OUT, quality=88, optimize=True, progressive=True)
    import os
    print('wrote %s  %.1f MB' % (OUT, os.path.getsize(OUT) / 1048576))


if __name__ == '__main__':
    main()
