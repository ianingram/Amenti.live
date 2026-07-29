"""Metallic accent pass — gold and silver, sharpened.

The first version tinted broadly and bloomed softly, which reads as *warm
light*. Metal does something different: it returns a very tight, very bright
core with a fast falloff, and it raises local contrast rather than lowering it.
Three changes make it read as metal instead of as glow:

  HARDER KEY      higher gamma, so only the top of the luminance range takes
                  the accent and the mid-tones stay grey. This is what keeps
                  it on the etched line and off the surface beside it.
  TIGHT CORE      a second pass on the brightest pixels only, bloomed at a
                  small radius. A big soft bloom is haze; a small hard one is
                  a specular.
  LOCAL CONTRAST  unsharp within the mask, so the etching cuts rather than
                  sits. Metal is legible because of its EDGES.

Two accents, assigned per region: gold on the gilt and the cord, silver on the
plate fittings and the blade furniture.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

GOLD   = np.array([255, 190,  86], float)
SILVER = np.array([232, 240, 255], float)


def _region(shape, boxes, feather=22):
    H, W = shape
    m = np.zeros((H, W), float)
    yy, xx = np.mgrid[0:H, 0:W]
    for (x0, y0, x1, y1) in boxes:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        rx, ry = max((x1 - x0) / 2, 1), max((y1 - y0) / 2, 1)
        m = np.maximum(m, np.clip(1.6 - (((xx - cx) / rx) ** 2
                                         + ((yy - cy) / ry) ** 2), 0, 1))
    return ndimage.gaussian_filter(m, feather)


def metal(path, out, specs, sharpen=0.55, core_sigma=2.6, core_gain=64.0):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im, float)
    lum = a.mean(2)
    H, W = lum.shape
    result = a.copy()
    accum_core = np.zeros((H, W, 3), float)

    for boxes, colour, p in specs:
        mask = _region((H, W), boxes)
        sel = mask > 0.12
        if not sel.any():
            continue
        lo, hi = np.percentile(lum[sel], (p.get("lo_pct", 62),
                                          p.get("hi_pct", 99.3)))
        k = np.clip((lum - lo) / max(hi - lo, 1e-6), 0, 1) ** p.get("gamma", 2.6)
        w = (k * mask * p.get("strength", 0.95))[..., None]
        tone = (colour[None, None, :] / colour.max()) * lum[..., None] \
            * p.get("lift", 1.10)
        result = result * (1 - w) + tone * w
        # tight specular core on the very brightest only
        core = np.clip((lum - np.percentile(lum[sel], p.get("core_pct", 97)))
                       / 40.0, 0, 1) * mask
        accum_core += (colour[None, None, :] / 255.0) * \
            ndimage.gaussian_filter(core, core_sigma)[..., None] * \
            p.get("core", 1.0) * core_gain

    result = result + accum_core
    # local contrast so the etching cuts rather than sits
    if sharpen > 0:
        blur = ndimage.gaussian_filter(result, (2.2, 2.2, 0))
        result = result + (result - blur) * sharpen
    Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).save(
        out, quality=95, optimize=True, progressive=True)
    return out
