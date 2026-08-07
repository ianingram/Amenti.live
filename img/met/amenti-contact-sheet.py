#!/usr/bin/env python3
"""
===========================================================================
AMENTI — CONTACT SHEET
---------------------------------------------------------------------------
Reads img/dispatch/manifest.json and lays every plate out one above the next
with its number, title, date, signed year range and department, so the whole
take can be judged in one scroll.

The number in the caption is the plate number. Note the ones to kill and
run the culler at the bottom of this file.

  python3 amenti-contact-sheet.py            # writes contact-sheet.jpg
  python3 amenti-contact-sheet.py --cull 2,3,6,11
        deletes those plates, renumbers the rest from 01, rewrites the
        manifest, and rebuilds the sheet. Keeps a backup first.

Renumbering matters: the selector reads files by the names in the manifest,
so a gap is fine but a manifest pointing at a deleted file is not. This
keeps the two in step.
===========================================================================
"""
import json, os, shutil, sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("This needs pillow:  pip install pillow")

DIR = "img/dispatch"
MAN = f"{DIR}/manifest.json"
TW, TH, CAP = 620, 258, 34


def load():
    if not os.path.exists(MAN):
        sys.exit(f"No manifest at {MAN}. Run the harvester first.")
    return json.load(open(MAN, encoding="utf-8"))


def sheet(doc, out="contact-sheet.jpg"):
    plates = doc["plates"]
    if not plates:
        sys.exit("Manifest has no plates.")
    img = Image.new("RGB", (TW, (TH + CAP) * len(plates)), (8, 11, 20))
    d = ImageDraw.Draw(img)
    for i, p in enumerate(plates):
        path = os.path.join("img", p["file"])
        y = i * (TH + CAP)
        if os.path.exists(path):
            img.paste(Image.open(path).resize((TW, TH), Image.LANCZOS), (0, y))
        else:
            d.text((10, y + TH // 2), f"MISSING: {path}", fill=(255, 90, 90))
        cap = (f"{i+1:02d}  {p.get('title','')[:48]}  ·  {p.get('date','')[:22]}"
               f"  ·  {p.get('yearFrom')}..{p.get('yearTo')}"
               f"  ·  {p.get('dept','')[:22]}")
        d.text((8, y + TH + 8), cap, fill=(245, 197, 66))
    img.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"  {out}  ({len(plates)} plates, {os.path.getsize(out)//1024} KB)")

    seen = {}
    for p in plates:
        seen[p.get("dept", "?")] = seen.get(p.get("dept", "?"), 0) + 1
    print("\n  by department:")
    for k, v in sorted(seen.items(), key=lambda x: -x[1]):
        print(f"    {k:<34} {v}")


def cull(doc, kill):
    """Delete the named plate numbers, renumber the survivors from 01."""
    plates = doc["plates"]
    bad = {int(x) for x in kill.replace(" ", "").split(",") if x}
    keep = [p for i, p in enumerate(plates, 1) if i not in bad]
    if len(keep) == len(plates):
        print("  nothing matched — check the numbers")
        return

    shutil.copy(MAN, MAN + ".bak")
    os.makedirs(f"{DIR}/_culled", exist_ok=True)
    for i, p in enumerate(plates, 1):
        if i in bad:
            src = os.path.join("img", p["file"])
            if os.path.exists(src):
                shutil.move(src, f"{DIR}/_culled/{os.path.basename(src)}")

    # renumber via a temp pass so a rename never lands on a live file
    for n, p in enumerate(keep, 1):
        old = os.path.join("img", p["file"])
        tmp = os.path.join(DIR, f"tmp-{n:02d}.jpg")
        if os.path.exists(old):
            shutil.move(old, tmp)
        p["_tmp"] = tmp
    for n, p in enumerate(keep, 1):
        new = f"plate-{n:02d}.jpg"
        if os.path.exists(p["_tmp"]):
            shutil.move(p["_tmp"], os.path.join(DIR, new))
        p["file"] = f"dispatch/{new}"
        del p["_tmp"]

    doc["plates"] = keep
    doc["count"] = len(keep)
    json.dump(doc, open(MAN, "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)
    print(f"  culled {len(bad)}, kept {len(keep)}. Originals in {DIR}/_culled/")
    print(f"  manifest backed up to {MAN}.bak")


if __name__ == "__main__":
    doc = load()
    if "--cull" in sys.argv:
        cull(doc, sys.argv[sys.argv.index("--cull") + 1])
        doc = load()
    sheet(doc)
