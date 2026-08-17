#!/usr/bin/env python3
"""amenti ingest — take a raw generation and make it a repo asset.

    python3 ingest.py <file> <library-key> <card|terminal>
    python3 ingest.py <file> <figure-key> scene --tag <scene-tag>

Does everything mechanical, in one step:

  1. CROP to the card slot ratio. Generations arrive at 9:16 (0.5625); the hero
     slot is 320x560 (0.5714). A 1.6% height trim, taken off the bottom so the
     crown is never touched.
  2. RESIZE to 1120 px tall — twice the hero's 560 px render height, ample for
     retina. Raw 2K files are four times more pixels than any display uses and
     three times the bytes.
  3. MEASURE saturation and compute the per-image grade factor that lands it on
     the deck's 0.105 at rest. Stored at FULL colour, graded in CSS, so the
     arrival pulse still reveals its true colour.
  4. NAME it {library-key}-{surface}.jpg — or, for a scene,
     img/scene/{figure-key}--{scene-tag}.jpg. The library key is canonical; art
     resolves by convention and there is no map to keep in step.
  5. STAMP the provenance into the JPEG's EXIF and into img/MANIFEST.json.
  6. REWRITE img/grades.css so no HTML is ever edited to add a figure.

After this: git add, commit, push. Nothing else.

── THE SCENE GRAMMAR, ADDED 17 AUGUST 2026 ────────────────────────────────
A plate is a FIGURE. A scene is a MOMENT that figure was in. Until now this
script could only name the first, so every scene was filed by hand and named
by whatever was in mind that morning. One of them was `gw-winter`. The plate
convention parses a filename as {key}-{variant}, so it read as a figure named
`gw` holding a card and a thumb and missing its terminal plate, and the plate
register counted it as a gap against 49 of 51.

It was George Washington at Valley Forge.

The register was not wrong. The grammar had no room for the sentence. So:

    img/scene/{figure-key}--{scene-tag}[-{variant}].{ext}

The SUBDIRECTORY keeps scenes out of the plate grammar entirely — no scene can
ever be probed as a figure variant again. The DOUBLE HYPHEN splits owner from
moment unambiguously, which a single one cannot, because nearly every figure
key already contains one.

THE OWNER IS CHECKED. THE TAG IS NOT. A figure key can be wrong, because
names.csv says what right is; a scene tag could not be wrong, because nothing
says what right is. Authority is what makes error possible. So this script
refuses a scene whose owner it cannot find, and accepts any tag at all.

AND THE FIGURE NEED NOT BE IN THE FRAME. Valley Forge without Washington in it
is still his scene. Ownership is EDITORIAL — the figure whose story the image
serves — and depiction has nothing to do with it. Nothing here inspects the
picture, because nothing could.

NO GRADE IS COMPUTED FOR A SCENE. Grading belongs to the surface that renders
the image: the roster tile, the codex slot, the terminal each own theirs. No
article surface has asked for a scene grade, so this script does not invent one
on its behalf. Saturation is still MEASURED and recorded — the reading is free
and a surface may want it later — but nothing is written into grades.css.
"""
import sys, os, re, csv, json, datetime
import numpy as np
from PIL import Image
import provenance

TXT_LUM = 0.6383          # relative luminance of #c8e8d8, the terminal's body text
GND     = (3, 7, 5)       # .term-main composited over .term-shell over --ink
WCAG    = 4.5

SLOT   = 320 / 560
TALL   = 1120
TARGET = 0.105

SCENE_DIR = "img/scene"
ROSTER    = "names.csv"


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _rel(rgb):
    return 0.2126*_lin(rgb[0]) + 0.7152*_lin(rgb[1]) + 0.0722*_lin(rgb[2])


def term_opacity(path, margin=0.85):
    """Largest opacity this plate can sit behind terminal body text at.

    The terminal's own contrast is 15.4:1, so there is room — but the binding
    constraint is the plate's BRIGHT patches, not its mean. A single blown
    highlight under a line of type is what breaks legibility, so the test uses
    the 95th percentile as the worst case a line of text will land on.
    """
    a = np.asarray(Image.open(path).convert("L"), float)
    p95 = float(np.percentile(a, 95))
    lo, hi = 0.0, 1.0
    for _ in range(40):
        o = (lo + hi) / 2
        eff = [(1 - o) * g + o * p95 for g in GND]
        c = (max(TXT_LUM, _rel(eff)) + 0.05) / (min(TXT_LUM, _rel(eff)) + 0.05)
        if c >= WCAG: lo = o
        else: hi = o
    return round(lo * margin, 2)


def sat_of(im):
    a = np.asarray(im.convert("RGB"), float)
    return float(np.mean((a.max(2) - a.min(2)) / np.maximum(a.max(2), 1e-6)))


# ── THE ONE SLUG RULE ─────────────────────────────────────────────────────
# Every surface that names a figure must reduce the name the same way, and
# until this week nothing said so. Three incidents trace back to that silence:
# wd-gann was one character of drift, einstein-albert is word-order drift, and
# gw-winter was a scene mistaken for a man. tools/plates.js carries the same
# function; if one changes, both must.
def slug_key(s):
    s = str(s).lower()
    s = re.sub(r"[.'\u2019]", "", s)         # W.D. Gann -> wd gann
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def roster_keys(path=ROSTER):
    """The set of legitimate figure keys, slugged.

    names.csv carries no key column — the proxy derives one at
    amenti-proxy-worker.js:468 as name.toLowerCase().trim(), which is a
    lowercased full name WITH THE SPACE IN IT. Plate and scene keys are
    hyphenated. Both sides go through slug_key() or they can never meet; a
    first cut of the equivalent check in tools/plates.js compared the two
    directly, could not match a single owner, and reported that it had.

    Returns None if the roster cannot be read — one fewer check, not a stop.
    """
    if not os.path.exists(path):
        return None
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            rows = list(csv.DictReader(fh))
        if not rows:
            return None
        head = {k.strip().lower(): k for k in rows[0].keys() if k}
        col = next((head[c] for c in ("key", "full name", "name") if c in head), None)
        if not col:
            return None
        return {slug_key(r[col]) for r in rows if r.get(col)}
    except Exception:
        return None


def scene_path(owner, tag, variant=None):
    """img/scene/{owner}--{tag}[-{variant}].jpg — the whole grammar, one place."""
    stem = f"{owner}--{tag}" + (f"-{variant}" if variant else "")
    return os.path.join(SCENE_DIR, stem + ".jpg")


def grades():
    """Rewrite img/grades.css from the manifest. No hand-edited CSS, ever."""
    m = provenance.load()
    out = ["/* GENERATED BY ingest.py — do not edit.",
           "   One CSS multiplier per image. A single global value would SCALE",
           "   saturation, not EQUALISE it: at 0.32 a plate stored at 0.10 lands",
           "   at 0.03 while one stored at 0.31 lands at 0.10, and they stay",
           f"   three times apart. Each plate carries its own factor to {TARGET}.",
           "",
           "   SCENES ARE NOT GRADED HERE. Grading belongs to the surface that",
           "   renders the image, and no article surface has asked. A scene's",
           "   measured saturation is in the manifest if one ever does. */"]
    for f, r in sorted(m["images"].items()):
        if r.get("surface_slug") == "scene":
            continue                      # see the note above — not this file's call
        key, surf = r["key"], r["surface_slug"]
        if surf == "card":
            # the card plate appears in the roster tile and the codex slot.
            # The hero carousel is SVG puppets again and takes no grade.
            out.append(f'.rc-img[data-fig="{key}"],.nc-thumb[data-fig="{key}"],'
                       f'.mkt-thumb[data-fig="{key}"],'
                       f'.cdx-art[data-fig="{key}"][data-art-photo="card"]'
                       f'{{filter:saturate({r["art_sat"]});}}')
        else:
            # the codex detail shows the READING plate at 560px, so it takes
            # the terminal grade
            out.append(f'.cdx-art[data-fig="{key}"][data-art-photo="terminal"]'
                       f'{{filter:saturate({r["art_sat"]});}}')
            # THE TERMINAL — the largest canvas in the product. The terminal
            # plate sits behind the whole chat stream at the opacity computed
            # from its own bright patches, not a guessed constant.
            if r.get("pool_op"):
                # THE MOON KEY. The plate is no longer dimmed globally — it runs
                # near full strength and a MASK decides where the light falls.
                # --pool-x comes from the plate's own measured key_side, so the
                # CSS light agrees with the light already in the photograph
                # instead of arguing with it.
                out.append(
                    f'.term-main[data-fig="{key}"]::before{{'
                    f'background-image:url("img/{key}-terminal.jpg");'
                    f'opacity:{r["pool_op"]};'
                    f'--pool-x:{r["pool_x"]}%;'
                    f'filter:saturate({r["art_sat"]});}}')
    open("img/grades.css", "w").write("\n".join(out) + "\n")
    return len(m["images"])


def ingest(src, key, surface, note="", tag=None, variant=None):
    assert surface in ("card", "terminal", "scene"), \
        "surface must be card, terminal or scene"

    is_scene = surface == "scene"

    if is_scene:
        # ── REFUSE RATHER THAN GUESS ───────────────────────────────────────
        # A scene without an owner is the thing that cannot be verified, so the
        # grammar forbids it. A scene without a tag is a moment with no name.
        if not tag:
            sys.exit("REFUSES: a scene needs --tag. img/scene/{owner}--{tag}.jpg")
        owner, tag = slug_key(key), slug_key(tag)
        if not owner or not tag:
            sys.exit("REFUSES: owner and tag must slug to something.")

        known = roster_keys()
        if known is None:
            # Say it. A check that quietly did not run is worse than no check.
            print("  [warn] names.csv unreadable — the owner was NOT verified")
        elif owner not in known:
            near = sorted(k for k in known if owner.split('-')[-1] in k)[:5]
            sys.exit(f"REFUSES: no figure `{owner}` on the roster.\n"
                     f"         A scene inherits its figure's authority or it has none.\n"
                     + (f"         Did you mean: {', '.join(near)}\n" if near else "")
                     + "         Onboard the figure first, or fix the key.")

        os.makedirs(SCENE_DIR, exist_ok=True)
        out = scene_path(owner, tag, variant)
    else:
        owner = key
        out = f"img/{key}-{surface}.jpg"

    im = Image.open(src).convert("RGB")
    W, H = im.size
    # A scene is an editorial image in an article, not a figure in the hero
    # slot. Cropping it to the card ratio would trim a composition that was
    # framed for a different container.
    if not is_scene:
        nh = int(round(W / SLOT))
        if nh <= H:
            im = im.crop((0, 0, W, nh))      # trim the bottom, protect the crown
    if im.height > TALL:
        im = im.resize((int(im.width * TALL / im.height), TALL), Image.LANCZOS)

    im.save(out, quality=86, optimize=True, progressive=True)

    s = sat_of(Image.open(out))
    factor = round(min(TARGET / s, 1.0), 3) if s > 0 else 1.0

    m = provenance.load()
    if is_scene:
        rec = dict(file=os.path.relpath(out, "img"), key=owner, scene=tag,
                   surface="article/scene", surface_slug="scene",
                   scene_variant=variant or "lead",
                   grammar="witnessed",
                   source=os.path.basename(src), note=note,
                   model="flux.2-pro", service="OpenArt", aspect="9:16",
                   resolution="2K", polish=True, seed=None,
                   date=datetime.date.today().isoformat(),
                   stored_saturation=round(s, 3),
                   # measured and kept, but NOT written into grades.css —
                   # no article surface has asked for a scene grade
                   art_sat=None, term_opacity=None,
                   colour_note="stored at full colour; ungraded — the rendering "
                               "surface owns the grade, and none has claimed it")
    else:
        rec = dict(file=os.path.basename(out), key=key,
                   surface="hero/arena" if surface == "card" else "terminal",
                   surface_slug=surface,
                   grammar="presented" if surface == "card" else "absorbed",
                   source=os.path.basename(src), note=note,
                   model="flux.2-pro", service="OpenArt", aspect="9:16",
                   resolution="2K", polish=True, seed=None,
                   date=datetime.date.today().isoformat(),
                   stored_saturation=round(s, 3), art_sat=factor,
                   term_opacity=(term_opacity(out) if surface == "terminal" else None),
                   colour_note="stored at full colour; graded in CSS via --art-sat")

    m["images"][rec["file"]] = rec
    provenance.save(m)
    provenance.stamp(out, rec)
    n = grades()
    return out, im.size, s, (None if is_scene else factor), n


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    tag = variant = None
    for i, a in enumerate(sys.argv):
        if a == "--tag" and i + 1 < len(sys.argv):     tag = sys.argv[i + 1]
        if a == "--variant" and i + 1 < len(sys.argv): variant = sys.argv[i + 1]
    args = [a for a in args if a not in (tag, variant)]

    if len(args) < 3:
        print(__doc__); sys.exit(1)
    src, key, surface = args[0], args[1], args[2]
    note = args[3] if len(args) > 3 else ""

    f, size, s, fac, n = ingest(src, key, surface, note, tag=tag, variant=variant)
    print(f"  wrote      {f}  {size[0]}x{size[1]}  {os.path.getsize(f)//1024} KB")
    if fac is None:
        print(f"  saturation {s:.3f} stored, measured and kept — NOT graded.")
        print(f"             the rendering surface owns the grade; none has claimed it.")
    else:
        print(f"  saturation {s:.3f} stored -> {s*fac:.3f} at rest (factor {fac})")
    print(f"  manifest   {n} images   grades.css rewritten")
    print(f"\n  SEED IS NULL. Put it in img/MANIFEST.json now, or it is gone.")
