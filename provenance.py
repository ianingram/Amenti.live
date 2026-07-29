"""amenti — write provenance INTO the images and beside them.

Two copies on purpose, because they fail differently:

  MANIFEST.json   greppable, diffable, reviewable in a pull request. Survives
                  re-encoding. Lost if the file is moved out of the folder.
  EXIF UserComment   travels inside the JPEG itself. Survives being emailed,
                  dropped on a desktop, or found on a drive in two years.
                  Lost if something strips metadata on upload.

Neither alone is enough. Together, an image is very hard to orphan.

WHAT MAKES AN IMAGE REGENERABLE: prompt + seed + model + settings. Of those,
the SEED is the one nobody but the operator can supply, and it is not in the
file. Leave it blank and the record is a history, not a recipe.
"""
import json, os, sys, datetime
import piexif
from PIL import Image

MANIFEST = "img/MANIFEST.json"


def load():
    if os.path.exists(MANIFEST):
        return json.load(open(MANIFEST))
    return {"deck": "Amenti", "updated": None, "images": {}}


def save(m):
    m["updated"] = datetime.date.today().isoformat()
    json.dump(m, open(MANIFEST, "w"), indent=2)


def stamp(path, rec):
    """Embed a compact record in EXIF UserComment + ImageDescription."""
    im = Image.open(path)
    exif = piexif.load(im.info.get("exif", b"")) if "exif" in im.info else \
        {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
    compact = {k: rec.get(k) for k in
               ("figure", "surface", "model", "seed", "aspect", "resolution",
                "polish", "date", "prompt_file")}
    ucode = b"ASCII\x00\x00\x00" + json.dumps(compact).encode("ascii", "replace")
    exif["Exif"][piexif.ExifIFD.UserComment] = ucode
    exif["0th"][piexif.ImageIFD.ImageDescription] = \
        f"{rec.get('figure','')} — {rec.get('surface','')}".encode("ascii", "replace")
    exif["0th"][piexif.ImageIFD.Artist] = b"Amenti / generated"
    exif["0th"][piexif.ImageIFD.Software] = str(rec.get("model", "")).encode("ascii", "replace")
    im.save(path, quality=86, optimize=True, progressive=True,
            exif=piexif.dump(exif))


def read(path):
    """Recover the record from a JPEG that has lost its manifest."""
    ex = piexif.load(path)
    uc = ex["Exif"].get(piexif.ExifIFD.UserComment, b"")
    if uc.startswith(b"ASCII\x00\x00\x00"):
        return json.loads(uc[8:].decode("ascii"))
    return None
