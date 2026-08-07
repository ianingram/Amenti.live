#!/usr/bin/env python3
"""
===========================================================================
AMENTI — DISPATCH PLATE HARVESTER
---------------------------------------------------------------------------
Pulls a curated set of CC0 images from The Metropolitan Museum of Art's Open
Access collection and cuts them to the size the Daily Planet needs.

WHY THE MET RATHER THAN A STOCK SITE
  406,000+ images under Creative Commons Zero. No API key, no registration,
  no attribution legally required, commercial use permitted. And the
  collection is right for this site in a way stock photography never is:
  engravings, manuscripts, astronomical instruments, antiquities, maps.

  The Met asks for no more than 80 requests per second. This script sleeps
  between calls and stays far under that.

WHAT IT PRODUCES
  img/dispatch/plate-01.jpg ... plate-NN.jpg   1200x500, the article banner
  img/dispatch/manifest.json                   titles, dates, object URLs

  The manifest carries each object's title, artist, date and Met URL. CC0
  does not require attribution, but recording where a thing came from costs
  nothing and is the difference between a library and a pile.

USAGE
  pip install requests pillow
  python3 amenti-plates-harvest.py            # default: 48 plates
  python3 amenti-plates-harvest.py 24         # fewer

  Then copy img/dispatch/ into the repo.
===========================================================================
"""
import io, json, os, sys, time, hashlib

try:
    import requests
    from PIL import Image
except ImportError:
    sys.exit("This needs two packages:  pip install requests pillow")

API = "https://collectionapi.metmuseum.org/public/collection/v1"
OUT = "img/dispatch"
W, H = 1200, 500          # the article banner: wide, shallow, sits under the headline

# Curated queries. Each is a search the Met answers well, chosen to match the
# register of the site — dark, engraved, instrumental, antique. Department IDs:
#   3 Ancient Near Eastern · 9 Drawings and Prints · 10 Egyptian
#   13 Greek and Roman · 16 The Libraries · 17 Medieval
QUERIES = [
    ("astrolabe",            None),
    ("armillary sphere",     None),
    ("celestial map",        9),
    ("star chart",           9),
    ("printing press",       9),
    ("manuscript page",      17),
    ("illuminated manuscript", 17),
    ("cuneiform tablet",     3),
    ("papyrus",              10),
    ("Roman relief",         13),
    ("Greek vase",           13),
    ("architectural engraving", 9),
    ("ruins engraving",      9),
    ("map",                  9),
    ("globe",                None),
    ("sundial",              None),
    ("scientific instrument", None),
    ("library interior",     9),
    ("scribe",               None),
    ("ancient coin",         13),
]

def get(url, params=None, tries=3):
    for k in range(tries):
        try:
            r = requests.get(url, params=params, timeout=25)
            if r.status_code == 200:
                return r
        except Exception:
            pass
        time.sleep(1.2 * (k + 1))
    return None

def search(q, dept):
    p = {"q": q, "hasImages": "true", "isPublicDomain": "true"}
    if dept:
        p["departmentId"] = dept
    r = get(f"{API}/search", p)
    if not r:
        return []
    try:
        return (r.json().get("objectIDs") or [])[:40]
    except Exception:
        return []

def obj(oid):
    r = get(f"{API}/objects/{oid}")
    if not r:
        return None
    try:
        return r.json()
    except Exception:
        return None

def usable(d):
    """A plate must be wide enough to crop, public domain, and have an image."""
    if not d or not d.get("isPublicDomain"):
        return False
    if not d.get("primaryImageSmall"):
        return False
    # skip portraits of identifiable modern people and anything with a person's
    # name as the whole subject — these are scene plates, not biography
    cls = (d.get("classification") or "").lower()
    return "photograph" not in cls

def plate(d):
    """Fetch, crop to the banner shape, darken slightly so headline text sits on it."""
    r = get(d["primaryImageSmall"])
    if not r:
        return None
    try:
        im = Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception:
        return None
    if im.width < W * 0.6 or im.height < 200:
        return None
    # cover-crop to the banner, taking from the upper-middle where subjects sit
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    ox = (im.width - W) // 2
    oy = int((im.height - H) * 0.35)
    im = im.crop((ox, oy, ox + W, oy + H))
    # a slight darkening so gold text reads over it, matching the site's register
    im = Image.blend(Image.new("RGB", (W, H), (8, 11, 20)), im, 0.82)
    return im

def main():
    want = int(sys.argv[1]) if len(sys.argv) > 1 else 48
    os.makedirs(OUT, exist_ok=True)
    seen, manifest, n = set(), [], 0

    print(f"  harvesting {want} plates from The Met (CC0)\n")
    per = max(2, want // len(QUERIES) + 1)

    for q, dept in QUERIES:
        if n >= want:
            break
        ids = search(q, dept)
        time.sleep(0.35)
        got = 0
        for oid in ids:
            if n >= want or got >= per or oid in seen:
                continue
            seen.add(oid)
            d = obj(oid)
            time.sleep(0.35)
            if not usable(d):
                continue
            im = plate(d)
            if im is None:
                continue
            n += 1
            got += 1
            name = f"plate-{n:02d}.jpg"
            for qual in (86, 82, 78):
                im.save(f"{OUT}/{name}", "JPEG", quality=qual,
                        optimize=True, progressive=True)
                if os.path.getsize(f"{OUT}/{name}") <= 180 * 1024:
                    break
            manifest.append({
                "file":   f"dispatch/{name}",
                "title":  d.get("title") or "",
                "artist": d.get("artistDisplayName") or "",
                "date":   d.get("objectDate") or "",
                "dept":   d.get("department") or "",
                "url":    d.get("objectURL") or "",
                "query":  q,
            })
            print(f"    {name}  {os.path.getsize(f'{OUT}/{name}')//1024:>4} KB  "
                  f"{(d.get('title') or '')[:52]}")

    with open(f"{OUT}/manifest.json", "w", encoding="utf-8") as f:
        json.dump({
            "source":  "The Metropolitan Museum of Art, Open Access (CC0)",
            "note":    "CC0 requires no attribution. Recorded anyway.",
            "count":   len(manifest),
            "plates":  manifest,
        }, f, indent=2, ensure_ascii=False)

    print(f"\n  {len(manifest)} plates written to {OUT}/")
    print(f"  manifest.json records title, artist, date and Met URL for each.")
    print(f"\n  LOOK AT THEM BEFORE SHIPPING. The Met's search is good but not")
    print(f"  perfect; delete any that are dull, badly cropped or off-register,")
    print(f"  and renumber. Twelve good plates beat forty indifferent ones.")

if __name__ == "__main__":
    main()
