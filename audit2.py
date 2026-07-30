"""amenti.audit v2 — measures a returned plate against the direction.

    python3 -c "import audit2; \
      print(audit2.verdict(audit2.audit('img/lincoln-card.jpg')))"

Run it on a raw generation BEFORE ingesting, not after. A plate that fails
should be re-rolled rather than committed and then regretted.

TWO METRIC FIXES, both found by being wrong about the anchor:

1. KEY DIRECTION was measured as left-half mean vs right-half mean. On a man in
   a black frock coat both halves average dark and the metric returns noise --
   it read 1.081 on a plate that is obviously and strongly keyed. Replaced with
   the separation between the CENTROID OF THE BRIGHTEST pixels and the centroid
   of the darkest. That is what a key actually does to an image.

2. NO FIXED SIDE. Any key serves as long as there is ONE dominant source. The
   marker exists so the direction can be AGREED, not prescribed. The audit now
   reports which way and how strongly, and only fails a plate for having no
   dominant key at all.
"""
import numpy as np
from PIL import Image

# ENFORCE: only what makes forty images ONE DECK. Kept deliberately short --
# every rule added here is a degree of freedom taken away from the picture, and
# an over-specified deck is one card rendered forty times.
ENFORCE = dict(aspect=(0.545, 0.60),         # 9:16 = 0.5625, the card slot 0.5714
               key_strength=(0.06, 1.0),      # ONE dominant source, any direction
               value_span=(170, 255),         # full range, true blacks
               accent_sat=(0.0, 0.18))        # monochrome plus one accent

# OBSERVE: reported, never failed. These SHOULD vary. Some figures want a deep
# blurred ground, some want the architecture sharp behind them; some want a
# tight crop, some want air. Recorded so the deck can be looked at as a whole,
# not so any single card can be rejected for it.
OBSERVE = ("key_side", "shadow_frac", "tile_contrast", "dof_ratio", "head_room")

TARGET = ENFORCE


def audit(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im, float)
    g = a.mean(2)
    H, W = g.shape
    m = g > np.percentile(g, 12) + 14
    ys, xs = np.nonzero(m)
    x0, x1 = xs.min(), xs.max()
    fw = max(x1 - x0, 1)

    v = g[m]
    hi = v >= np.percentile(v, 88)
    lo = v <= np.percentile(v, 30)
    hx = xs[hi].mean(); lx = xs[lo].mean()
    dx = (lx - hx) / fw                       # >0 : bright sits left of dark

    return dict(
        aspect=W / H,
        key_side=("LEFT" if dx > 0 else "RIGHT"),
        key_strength=abs(float(dx)),
        shadow_frac=float((v < np.percentile(v, 94) * 0.40).mean()),
        value_span=float(v.max() - v.min()),
        tile_contrast=_tile(im),
        accent_sat=float(np.mean((a.max(2) - a.min(2)) / np.maximum(a.max(2), 1e-6))),
        head_room=float(ys.min() / H),
        dof_ratio=_dof(g, m),
    )


def _dof(g, m):
    """Background detail relative to figure detail. Low = shallow focus.
    Reported, never enforced: a blurred ground suits some figures and a sharp
    architectural one suits others."""
    from scipy import ndimage
    hf = np.abs(g - ndimage.gaussian_filter(g, 2.0))
    bg = ~ndimage.binary_dilation(m, np.ones((15, 15)))
    if bg.sum() < 200 or m.sum() < 200:
        return float("nan")
    return float(hf[bg].mean() / max(hf[m].mean(), 1e-6))


def _tile(im):
    t = np.asarray(im.resize((198, 160)).convert("L"), float)
    b = np.percentile(t, 8)
    sel = t > b + 12
    return float(t[sel].mean() - b) if sel.any() else 0.0


LABEL = dict(aspect="fits the card slot", key_strength="ONE dominant key",
             value_span="full value range", accent_sat="monochrome + one accent",
             key_side="key direction", shadow_frac="shadow area",
             tile_contrast="legibility at 198x160", dof_ratio="focus falloff",
             head_room="space above the head")


def verdict(r):
    rows, ok = [], True
    for k, (lo, hi) in ENFORCE.items():
        good = lo <= r[k] <= hi
        ok &= good
        rows.append(("PASS" if good else "FAIL", LABEL[k], r[k]))
    for k in OBSERVE:
        if k in r:
            rows.append(("....", LABEL.get(k, k), r[k]))
    return ok, rows
