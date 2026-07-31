#!/usr/bin/env python3
"""amenti seeds_scan — look for the seed in the ORIGINAL downloads.

    python3 seeds_scan.py ~/Downloads
    python3 seeds_scan.py ~/Downloads /Volumes/backup/openart

Run it BEFORE opening OpenArt's history. Many generators write their
parameters into the file itself — PNG text chunks, JPEG EXIF UserComment,
or XMP. If OpenArt did, the seed is sitting on your disk right now and the
whole set comes back in one pass.

It reads the `source` field of every record in img/MANIFEST.json, hunts for
that exact filename in the folders you name, and reports what metadata it
finds. It WRITES NOTHING. Use seed.py to record what it turns up.

The repo's own img/*.jpg are useless for this: ingest.py re-saves through
PIL, which does not carry PNG text chunks across to JPEG. The original
download is the only copy that can still hold it.
"""
import sys, os, json, re

SEED_KEYS = ("seed", "noise_seed", "sampler_seed")
INTERESTING = ("parameters", "prompt", "comment", "usercomment", "description",
               "software", "xmp", "generation", "workflow") + SEED_KEYS


def manifest():
    for p in ("img/MANIFEST.json", "MANIFEST.json"):
        if os.path.exists(p):
            return p, json.load(open(p))
    sys.exit("no MANIFEST.json here — run from the repo root")


def index(roots):
    """Every file in the search folders, by basename."""
    found = {}
    for root in roots:
        root = os.path.expanduser(root)
        if not os.path.isdir(root):
            print(f"  ! not a folder, skipped: {root}")
            continue
        for dirpath, _, names in os.walk(root):
            for n in names:
                found.setdefault(n, os.path.join(dirpath, n))
    return found


def png_text(path):
    """PNG tEXt / zTXt / iTXt chunks."""
    out = {}
    try:
        from PIL import Image
        im = Image.open(path)
        for k, v in (getattr(im, "text", None) or {}).items():
            out[k] = v
        for k, v in (im.info or {}).items():
            if isinstance(v, (str, bytes)) and k not in out:
                out[k] = v
    except Exception as e:
        out["_error"] = str(e)
    return out


def jpeg_meta(path):
    """EXIF UserComment / ImageDescription / Software, plus any XMP packet."""
    out = {}
    try:
        from PIL import Image, ExifTags
        im = Image.open(path)
        ex = im.getexif()
        names = {v: k for k, v in ExifTags.TAGS.items()}
        for tag in ("UserComment", "ImageDescription", "Software", "XPComment", "Artist"):
            tid = names.get(tag)
            if tid and tid in ex:
                out[tag] = ex[tid]
        ifd = ex.get_ifd(0x8769) if hasattr(ex, "get_ifd") else {}
        for tid, val in (ifd or {}).items():
            out[ExifTags.TAGS.get(tid, str(tid))] = val
    except Exception as e:
        out["_error"] = str(e)
    # raw XMP packet, wherever it sits in the file
    try:
        blob = open(path, "rb").read()
        m = re.search(rb"<x:xmpmeta.*?</x:xmpmeta>", blob, re.S)
        if m:
            out["XMP"] = m.group(0).decode("utf-8", "replace")
    except Exception:
        pass
    return out


def find_seed(meta):
    """Pull a seed out of whatever we got, if one is in there."""
    hay = " ".join(f"{k}={v}" for k, v in meta.items() if not k.startswith("_"))
    for pat in (r'"?seed"?\s*[:=]\s*"?(-?\d{1,20})',
                r'\bSeed:\s*(-?\d{1,20})',
                r'\bnoise_seed\s*[:=]\s*(-?\d{1,20})'):
        m = re.search(pat, hay, re.I)
        if m:
            return m.group(1)
    return None


def main(roots):
    mpath, m = manifest()
    files = index(roots)
    print(f"\n  manifest  {mpath}   {len(m['images'])} records")
    print(f"  scanned   {len(files)} files in {len(roots)} folder(s)\n")

    hits = misses = seeds = 0
    for name, rec in sorted(m["images"].items()):
        src = rec.get("source") or ""
        path = files.get(src)
        if not path:
            print(f"  {name:32s}  ORIGINAL NOT FOUND   ({src})")
            misses += 1
            continue
        hits += 1
        meta = png_text(path) if path.lower().endswith(".png") else jpeg_meta(path)
        meta = {k: v for k, v in meta.items() if not k.startswith("_")}
        seed = find_seed(meta)
        if seed:
            seeds += 1
            print(f"  {name:32s}  SEED {seed}")
            print(f"      python3 seed.py {name} {seed}")
        elif meta:
            keys = ", ".join(sorted(meta)[:6])
            print(f"  {name:32s}  no seed; carries: {keys}")
        else:
            print(f"  {name:32s}  no metadata at all (stripped on download)")

    print(f"\n  originals found {hits}   missing {misses}   SEEDS RECOVERED {seeds}")
    if seeds == 0 and hits:
        print("""
  OpenArt strips generation metadata on download. Nothing is lost that was
  not already lost — go to the history route instead. Every source filename
  carries a Unix millisecond timestamp:

      openart-sample_1785281582839_19e2dea1.png
                     ^^^^^^^^^^^^^

  Sort your OpenArt history by date and match on that. Then seed.py.""")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1:])
