#!/usr/bin/env python3
"""amenti — the whole plate pipeline in one command.

    python3 amenti.py sync                        pull the live manifest from GitHub
    python3 amenti.py audit  <file>               measure only, change nothing
    python3 amenti.py ingest <file> <key> <surf>  audit + crop + grade + stamp + manifest
                                                  + regenerate grades.css
    python3 amenti.py status                      deck state
    python3 amenti.py check                       do the sheet, the roster,
                                                  library/ and img/ agree?
    python3 amenti.py grades                      regenerate grades.css alone

    surf is card | terminal | chat

WHY THIS EXISTS. Every plate this session ran the same sequence by hand: measure,
crop to 0.571, resize to 1120, compute the saturation factor, stamp EXIF, write the
manifest record, rebuild grades.css. Doing it by hand is how a set got compared to a
dict and the run died halfway. It is also how grades.css fell four figures behind
the manifest without anyone noticing — nine plates rendered ungraded for a day.

WHAT THE AUDIT MEASURES, and what to distrust.
  key_strength  LATERAL separation of bright and dark centroids. It is x-only, so it
                reads near zero for an overhead key, a backlight, or a frontal one.
                Six plates this session "failed" it while being correctly lit. Use
                key_radial instead; key_strength is kept only for continuity with the
                fourteen records that predate this file.
  accent_sat    the enforced ceiling is 0.18, but the deck ships plates from 0.003
                (douglass terminal) to 0.492 (plato card). Treat it as a grading input
                rather than a gate.
  head_room     reads 0.000 on almost every plate because any bright pixel in the top
                row zeroes it — dust motes, a lit sky, a bright wall. One plate in the
                deck has ever measured non-zero.
"""
import sys, os, json, datetime, urllib.request, urllib.error, re, csv, io
import numpy as np
from PIL import Image

MANIFEST = "img/MANIFEST.json"
RAW = "https://raw.githubusercontent.com/ianingram/Amenti.live/main/img/MANIFEST.json"
SLOT, TALL, TARGET = 320/560, 1120, 0.105
SURFACES = ("card", "terminal", "chat")
ENFORCE = {"aspect": (0.545, 0.60), "key_strength": (0.06, 1.0),
           "value_span": (170, 255), "accent_sat": (0.0, 0.18)}


def load():
    return json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else \
        {"deck": "Amenti", "updated": None, "images": {}}


def save(m):
    m["updated"] = datetime.date.today().isoformat()
    os.makedirs("img", exist_ok=True)
    json.dump(m, open(MANIFEST, "w"), indent=2, ensure_ascii=False)


def sat_of(im):
    a = np.asarray(im.convert("RGB"), float)
    return float(np.mean((a.max(2) - a.min(2)) / np.maximum(a.max(2), 1e-6)))


def measure(path):
    im = Image.open(path)
    a = np.asarray(im.convert("RGB"), float); g = a.mean(2); H, W = g.shape
    m = g > np.percentile(g, 12) + 14
    ys, xs = np.nonzero(m); v = g[m]
    hi = v >= np.percentile(v, 88); lo = v <= np.percentile(v, 30)
    fw = max(xs.max() - xs.min(), 1); fh = max(ys.max() - ys.min(), 1)
    dx = (xs[lo].mean() - xs[hi].mean()) / fw
    dy = (ys[lo].mean() - ys[hi].mean()) / fh
    t = np.asarray(im.resize((198, 160)).convert("L"), float)
    b = np.percentile(t, 8); sel = t > b + 12
    L = np.asarray(im.convert("L"), float)
    return dict(
        width=W, height=H,
        aspect=round(W / H, 3),
        key_strength=round(abs(float(dx)), 3),
        key_radial=round(float((dx*dx + dy*dy) ** .5), 3),
        key_side="LEFT" if dx > 0 else "RIGHT",
        value_span=round(float(v.max() - v.min()), 3),
        accent_sat=round(sat_of(im), 3),
        tile_contrast=round(float(t[sel].mean() - b), 3),
        shadow_frac=round(float((L < 40).mean()), 3),
        blown_frac=round(float((L > 250).mean()), 4),
        head_room=round(float(ys.min() / H), 3),
        mean_lum=round(float(L.mean()), 1),
    )


def report(a):
    print(f"    {a['width']}x{a['height']}   aspect {a['aspect']}")
    for k, (lo, hi) in ENFORCE.items():
        ok = lo <= a[k] <= hi
        print(f"    {'PASS' if ok else 'FAIL'}  {k:14s} {a[k]}")
    print(f"    ....  key_radial     {a['key_radial']} ({a['key_side']})   "
          f"<- trust this one, not key_strength")
    print(f"    ....  shadow_frac    {a['shadow_frac']}   blown {a['blown_frac']}   "
          f"mean {a['mean_lum']}")
    print(f"    ....  tile_contrast  {a['tile_contrast']}   head_room {a['head_room']}")
    if a["height"] < 2000:
        print(f"    !!!!  SUB-SPEC: {a['height']}px tall. The deck standard is 2048 "
              f"downsampled to 1120; this must be UPSAMPLED.")


def grades(m=None):
    m = m or load()
    figs = {}
    for k, r in m["images"].items():
        figs.setdefault(r["key"], {})[r["surface_slug"]] = r
    L = ['/* GENERATED by amenti.py — do not edit by hand.',
         '   One CSS multiplier per image. A single global value would SCALE saturation,',
         '   not EQUALISE it: at 0.32 a plate stored at 0.10 lands at 0.03 while one',
         '   stored at 0.31 lands at 0.10, and they stay three times apart. Each plate',
         '   carries its own factor to 0.105.', '',
         '   opacity and --pool-x are NOT written here. The moon key is gone from',
         '   Page1.html and the reader-controlled PLATE slider owns terminal opacity.',
         '   The terminal grade hangs on .plate-stack, because the terminal cycles',
         '   through every plate a figure has and there is no single image to grade.', '']
    for key in sorted(figs):
        s = figs[key]
        card, term, chat = s.get("card"), s.get("terminal"), s.get("chat")
        if card:
            L.append(f'.rc-img[data-fig="{key}"],.nc-thumb[data-fig="{key}"],'
                     f'.mkt-thumb[data-fig="{key}"],'
                     f'.cdx-art[data-fig="{key}"][data-art-photo="card"]'
                     f'{{filter:saturate({card["art_sat"]});}}')
        if term:
            L.append(f'.cdx-art[data-fig="{key}"][data-art-photo="terminal"]'
                     f'{{filter:saturate({term["art_sat"]});}}')
        plate = term or chat or card
        if plate:
            L.append(f'.term-main[data-fig="{key}"] .plate-stack'
                     f'{{--plate-sat:{plate["art_sat"]};}}')
    open("img/grades.css", "w").write("\n".join(L) + "\n")
    return len(figs)


def status(m=None):
    m = m or load()
    figs = {}
    for k, r in m["images"].items():
        figs.setdefault(r["key"], {})[r["surface_slug"]] = r
    complete = [k for k, v in figs.items() if {"card", "terminal"} <= set(v)]
    print(f"\n  records {len(m['images'])}   figures {len(figs)}   "
          f"complete {len(complete)}   updated {m['updated']}")
    for k in sorted(figs):
        gap = "" if k in complete else "   <- incomplete"
        print(f"    {k:22s} {sorted(figs[k])}{gap}")
    print()


def ingest(src, key, surface, note=""):
    if surface not in SURFACES:
        sys.exit(f"surface must be one of {SURFACES}")
    a = measure(src)
    print(f"\n  {os.path.basename(src)}  ->  img/{key}-{surface}.jpg")
    report(a)

    im = Image.open(src).convert("RGB"); W, H = im.size
    crop = "none"
    nh = int(round(W / SLOT))
    if nh <= H:
        im = im.crop((0, 0, W, nh)); crop = f"trimmed {H-nh}px of height to 0.571"
    if im.height != TALL:
        crop += (f" | source {W}x{H}, "
                 + ("downsampled" if im.height > TALL else "UPSAMPLED")
                 + " to 1120 tall")
        im = im.resize((int(im.width * TALL / im.height), TALL), Image.LANCZOS)

    out = f"img/{key}-{surface}.jpg"
    im.save(out, quality=86, optimize=True, progressive=True)
    stored = sat_of(Image.open(out))
    factor = round(min(TARGET / stored, 1.0), 3) if stored > 0 else 1.0

    # display name, not the key — every record before this file carried one.
    # A key of john-milton must not become a figure of "john-milton".
    prior = next((r["figure"] for r in load()["images"].values()
                  if r["key"] == key and r.get("figure")
                  and r["figure"] != key), None)
    if not prior:
        # library/<key>.json is authoritative for the display name. Title-casing
        # the key gives "Seneca" where the library says "Seneca the Younger".
        try:
            import urllib.request
            u = ("https://raw.githubusercontent.com/ianingram/Amenti.live/"
                 f"main/library/{key}.json")
            prior = json.loads(urllib.request.urlopen(u, timeout=8).read())["name"]
        except Exception:
            pass
    rec = dict(
        figure=prior or key.replace("-", " ").title(),
        key=key, file=os.path.basename(out), surface_slug=surface,
        surface={"card": "hero/arena", "terminal": "terminal",
                 "chat": "terminal chat panel (alternate)"}[surface],
        grammar="presented" if surface == "card" else "absorbed",
        source=os.path.basename(src), crop=crop, seed=None, note=note,
        model="flux.2-pro", service="OpenArt", aspect="9:16",
        resolution="2K" if a["height"] >= 2000 else "1K — SUB-SPEC",
        polish=True, date=datetime.date.today().isoformat(),
        colour_note="stored at full colour; graded in CSS via --art-sat",
        audit=measure(out), art_sat=factor, stored_saturation=round(stored, 3))

    m = load(); m["images"][os.path.basename(out)] = rec; save(m)
    try:
        import provenance; provenance.stamp(out, rec)
    except Exception as e:
        print(f"    (EXIF stamp skipped: {e})")
    n = grades(m)
    print(f"\n    written  {os.path.getsize(out)//1024} KB   "
          f"stored_sat {stored:.3f} -> art_sat {factor}")
    print(f"    grades.css regenerated for {n} figures")
    return rec



# ── the check ───────────────────────────────────────────────────────────────
# Four places carry a figure's key and NOTHING VERIFIES THEY AGREE:
#   1. the Google Sheet name, slugged at runtime by the CSV loader
#   2. the curated AMENTI_CHARS record in Page1.html
#   3. library/<key>.json
#   4. img/<key>-card.jpg and img/<key>-terminal.jpg
#
# Every key incident in this repo was the same bug in different clothes.
# Musashi's plates were built as miyamoto-musashi-* when the roster said
# musashi. Caesar, Gandhi and Moses each stood in the codex twice, because a
# ceremonial curated name never met the ledger's common one. The codex resolved
# by array index after the CSV merge had made the index meaningless.
#
# The bug was never the mismatch. The bug was that a mismatch was INVISIBLE.
# amenti-art-photo.js probes with new Image(); the probe 404s; onerror does
# nothing by design; amenti-art-3.js quietly paints worker SVG over the hole.
# Silence on failure is deliberate there — it is why 21 figures without plates
# show no broken images — and it is also why every one of these took a human
# noticing that something looked slightly off.
#
# This does not prevent the mistake. It makes the mistake impossible to miss.

REPO = "https://raw.githubusercontent.com/ianingram/Amenti.live/main"
API = "https://api.github.com/repos/ianingram/Amenti.live/contents"


def _get(url):
    return urllib.request.urlopen(url, timeout=20).read().decode("utf-8", "replace")


def _slug(name):
    """Exactly what the CSV loader in Page1.html does."""
    s = re.sub(r"[^a-z0-9]+", "-", (name or "").lower().strip()).strip("-")
    return s or "figure"


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def check():
    print("\n  reading the live repo and the ledger...")
    problems, notes = [], []

    cfg = _get(REPO + "/config.js")
    m = re.search(r'LEDGER_CSV_URL\s*:\s*.([^"\']+).', cfg)
    ledger = {}
    if not m:
        notes.append("config.js has no LEDGER_CSV_URL - ledger not checked")
    else:
        try:
            rows = list(csv.reader(io.StringIO(_get(m.group(1)))))
            hdr = [_norm(h) for h in rows[0]]
            ni = next((i for i, h in enumerate(hdr)
                       if h in ("fullname", "name", "figure", "person")), -1)
            ki = next((i for i, h in enumerate(hdr) if h == "key"), -1)
            for r in rows[1:]:
                if ni < 0 or ni >= len(r) or not r[ni].strip():
                    continue
                nm = r[ni].strip()
                ex = r[ki].strip() if 0 <= ki < len(r) and r[ki].strip() else None
                ledger[_norm(nm)] = {"name": nm, "key": ex or _slug(nm),
                                     "explicit": bool(ex)}
            notes.append("ledger: %d rows%s" % (
                len(ledger),
                "" if ki >= 0 else "   <- NO key COLUMN; keys are slugged from names"))
        except Exception as e:
            notes.append("ledger unreadable: %s" % e)

    page = _get(REPO + "/Page1.html")
    i = page.find("window.AMENTI_CHARS = [")
    block = page[i:page.find("\n];", i)] if i >= 0 else ""
    curated = dict(re.findall(r"key:\s*'([^']+)'\s*,\s*name:\s*\"([^\"]+)\"", block))
    notes.append("curated roster: %d records" % len(curated))

    man = json.loads(_get(REPO + "/img/MANIFEST.json"))["images"]
    plates = {}
    for r in man.values():
        plates.setdefault(r["key"], set()).add(r["surface_slug"])
    notes.append("manifest: %d plates across %d keys" % (len(man), len(plates)))

    # Probe library/<key>.json one at a time on raw.githubusercontent rather
    # than listing the folder through the API. The API rate-limits hard and an
    # empty listing is indistinguishable from an empty folder — on the first
    # run of this check that produced twenty false alarms, which is worse than
    # having no check at all. A per-key probe either answers or admits it did
    # not, and never silently reports absence.
    library, lib_known = set(), True
    probe = sorted(set(plates) | set(curated))
    for k in probe:
        try:
            urllib.request.urlopen(REPO + "/library/%s.json" % k, timeout=10).read(1)
            library.add(k)
        except urllib.error.HTTPError as e:
            if e.code != 404:
                lib_known = False
                notes.append("library/%s.json probe failed (%s) - LIBRARY CHECK SKIPPED" % (k, e.code))
                break
        except Exception as e:
            lib_known = False
            notes.append("library probe failed (%s) - LIBRARY CHECK SKIPPED" % e)
            break
    if lib_known:
        notes.append("library: %d of %d probed keys have a room" % (len(library), len(probe)))

    # DEAD WORK RECORDS. A room can exist and still open onto nothing: the JSON
    # lists work files that were never uploaded, or were uploaded to a path that
    # differs by CASE. raw.githubusercontent is case-sensitive, so a folder
    # committed as library/Musashi/ serves nothing to a JSON pointing at
    # library/musashi/ — the six texts are live and unreachable at once. Same
    # bug as every key incident here, wearing case instead of spelling.
    for k in sorted(library):
        try:
            works = json.loads(_get(REPO + "/library/%s.json" % k)).get("works", [])
        except Exception:
            continue
        dead = []
        for w in works:
            f = w.get("file")
            if not f:
                continue
            try:
                urllib.request.urlopen(REPO + "/library/" + f, timeout=10).read(1)
            except Exception:
                dead.append(f)
        if dead:
            problems.append("%-22s room lists %d work file(s) that 404: %s%s"
                            % (k, len(dead), dead[:3],
                               " (CHECK THE CASE OF THE FOLDER)" if any(
                                   d.split("/")[0] != k for d in dead) else ""))

    keys = set(library) | set(plates) | set(curated)

    for k in sorted(keys):
        lib, plt, cur = k in library, k in plates, curated.get(k)
        led = ledger.get(_norm(cur)) if cur else None
        if not led:
            led = next((v for v in ledger.values() if v["key"] == k), None)

        if plt and not lib and lib_known:
            problems.append("%-22s HAS PLATES, NO library/%s.json - the art paints, "
                            "the room never opens" % (k, k))
        if lib and not plt and lib_known:
            notes.append("%-22s room, no plates yet" % k)
        if cur and ledger and not ledger.get(_norm(cur)):   # ledger empty = skipped
            near = [v["name"] for v in ledger.values()
                    if k.split("-")[0] in _norm(v["name"])][:3]
            problems.append("%-22s curated name %r matches NO ledger row - the codex "
                            "will show him TWICE%s"
                            % (k, cur, ("; ledger has %s" % near) if near else ""))
        if led and led["key"] != k and not cur:
            problems.append("%-22s ledger says %r -> key %r, but library and img use "
                            "%r - nothing resolves" % (k, led["name"], led["key"], k))

    print()
    for n in notes:
        print("    .", n)
    if not ledger:
        notes.append("LEDGER CHECK SKIPPED - the Google Sheet is not reachable from here. "
                     "Duplicate-name and slugged-key faults CANNOT be detected without it.")
    print("\n  %d figures with a room, plates or a dossier" % len(keys))
    print("  checks run: library %s | ledger %s | roster yes\n"
          % ("yes" if lib_known else "SKIPPED", "yes" if ledger else "SKIPPED"))
    if problems:
        print("  %d PROBLEM(S):\n" % len(problems))
        for p in problems:
            print("    !!", p)
    else:
        print("  no key disagreements found")
    print()
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "sync":
        os.makedirs("img", exist_ok=True)
        urllib.request.urlretrieve(RAW, MANIFEST)
        print(f"  pulled {MANIFEST} from the live repo"); status()
    elif cmd == "audit":
        print(f"\n  {sys.argv[2]}"); report(measure(sys.argv[2])); print()
    elif cmd == "ingest":
        ingest(sys.argv[2], sys.argv[3], sys.argv[4],
               sys.argv[5] if len(sys.argv) > 5 else "")
    elif cmd == "grades":
        print(f"  grades.css regenerated for {grades()} figures")
    elif cmd == "check":
        sys.exit(check())
    elif cmd == "status":
        status()
    else:
        print(__doc__)
