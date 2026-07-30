#!/usr/bin/env python3
"""
AMENTI — APPLY ART SESSION  (29 July 2026)
==========================================
Run this ONCE from the repo root. It does every file operation from the art
session in one pass, and it is SAFE TO RUN TWICE — every step checks its own
state first.

    python3 apply_art_session.py --dry-run     # show what would change
    python3 apply_art_session.py               # do it

WHAT IT DOES

  1. RENAMES the seven plates from -reading.jpg to -terminal.jpg using `git mv`
     so history follows. Those plates go behind the terminal chat stream; the
     reading room takes no image, because it is for primary sources and the
     text is the artefact.

  2. PATCHES Page1.html in place:
       - removes the six photographic hero images (the carousel goes back to
         SVG puppets: a photograph is a rectangle carrying its own background
         and sits ON the arena page as a foreign object)
       - lifts the display:none that hid the carousel SVGs
       - removes the arrival / sweep / breath / ember animations with them
       - removes the reading-room banner CSS and its injector
       - adds the terminal plate CSS
       - adds <script src="amenti-art-photo.js"> BEFORE amenti-art-3.js
       - links img/grades.css

  3. WRITES the new and updated files: amenti-art-photo.js, ingest.py,
     audit2.py, provenance.py, goldleaf2.py, img/grades.css, img/MANIFEST.json,
     HANDOFF.md, PIPELINE.md

  4. VERIFIES the result and prints a report. Nothing is committed — review the
     diff, then commit yourself.

A timestamped backup of Page1.html is written before it is touched.
"""
import os, sys, re, json, base64, zlib, subprocess, shutil, datetime

BLOB = "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"

DRY = "--dry-run" in sys.argv
def say(*a): print(*a)
def act(msg): say(("  would " if DRY else "  ") + msg)

if not os.path.exists("Page1.html"):
    sys.exit("Page1.html not found — run this from the repo root.")

PAYLOAD = json.loads(zlib.decompress(base64.b64decode(BLOB)).decode())

# ── 1. RENAMES ────────────────────────────────────────────────────────────
say("\n[1] RENAME -reading -> -terminal")
KEYS = ["lincoln","caesar","frederick-douglass","miyamoto-musashi",
        "sun-tzu","tesla","marcus-aurelius"]
renamed = skipped = 0
for k in KEYS:
    old, new = f"img/{k}-reading.jpg", f"img/{k}-terminal.jpg"
    if os.path.exists(new) and not os.path.exists(old):
        skipped += 1; continue
    if not os.path.exists(old):
        say(f"  [warn] {old} not found and {new} absent — skipping"); continue
    act(f"git mv {old} {new}")
    if not DRY:
        r = subprocess.run(["git","mv",old,new], capture_output=True, text=True)
        if r.returncode: shutil.move(old,new)   # not a git repo, or untracked
    renamed += 1
say(f"  {renamed} renamed, {skipped} already done")

# ── 2. PATCH Page1.html ───────────────────────────────────────────────────
say("\n[2] PATCH Page1.html")
s = open("Page1.html").read()
orig = s

if not DRY:
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copy("Page1.html", f"Page1.html.bak-{stamp}")
    say(f"  backup -> Page1.html.bak-{stamp}")

n = len(re.findall(r'<img class="char-photo"[^>]*>\n?', s))
if n:
    s = re.sub(r'<img class="char-photo"[^>]*>\n?', '', s); act(f"remove {n} hero photo tags")
if re.search(r'\.char-slide\[data-idx="\d"\] svg\.char-art', s):
    s = re.sub(r'\.char-slide\[data-idx="\d"\] svg\.char-art,?\n?', '', s)
    s = re.sub(r'\n?\{display:none;\}', '', s); act("un-hide the carousel SVGs")
for pat, label in (
    (r'\.char-slide img\.char-photo\{[^}]*\}\n?', "hero photo CSS"),
    (r'\.char-slide\.active(\[data-pass="[a-z]+"\])? img\.char-photo\{[^}]*\}\n?', "arrival rules"),
    (r'\.char-slide\.active\[data-pass="sweep"\] \.char-visual::after\{[^}]*\}\n?', "sweep rule"),
    (r'@keyframes amenti-(arrive|breath|ember|sweep)\{[^@]*?\n\}\n?', "animations"),
    (r'<script data-amenti="art-v3">.*?</script>', "art-v3 script"),
    (r'<style data-amenti=.art-v3.>.*?</style>', "art-v3 style"),
    (r'/\* reading room banner \*/.*?\.dp-reader-hero\[data-empty="1"\]\{display:none;\}\n?', "reader banner CSS"),
    (r'\.dp-reader-hero(\[[^\]]*\])?(::after)?\{[^}]*\}\n?', "reader hero rules"),
    (r'\(function\(\)\{\s*//\s*NO MAP\..*?\}\)\(\);', "reader banner injector"),
    (r'\.char-slide img\.char-photo\[data-fig="[a-z-]+"\]\{--art-sat:[\d.]+;\}\n?', "inline carousel grades"),
    (r'\.dp-reader-hero\[data-fig="[a-z-]+"\]\{--art-sat:[\d.]+;\}\n?', "inline banner grades"),
    (r'\.rc-img\[data-fig=[^\n]*\n?', "inline card grades"),
    # cleanup — earlier removals can leave an orphaned selector, an empty
    # @media block or an empty script/style tag behind. Harmless but untidy,
    # and an incomplete CSS rule before </style> is the kind of thing that
    # makes the next person wonder what broke.
    (r'/\* reading room banner \*/\s*', "orphaned banner comment"),
    (r'\.dp-reader-hero[^{\n]*(?=\s*</style>)', "dangling reader selector"),
    (r'@media \(prefers-reduced-motion: reduce\)\{\s*\}\n?', "empty media block"),
    (r'<script data-amenti="art-v1">\s*</script>\n?', "empty art-v1 script"),
    (r'<style data-amenti="art-v1">\s*</style>\n?', "empty art-v1 style"),
    (r'\n{3,}', "excess blank lines"),
):
    if re.search(pat, s, re.S):
        rep = "\n\n" if label == "excess blank lines" else ""
        s = re.sub(pat, rep, s, flags=re.S); act(f"remove {label}")

TERM_CSS = """
<style data-amenti="art-term">
/* AMENTI ART · TERMINAL PLATE
   The centre chat panel is the largest canvas in the product. The terminal
   plate sits BEHIND the whole stream and the text runs over it.

   Terminal body text is #c8e8d8 on a composited ground of rgb(3,7,5) — 15.4:1,
   enormous headroom. The binding constraint is not the plate's average but its
   BRIGHT patches, since one blown highlight under a line of type is what breaks
   legibility. ingest.py solves for the 95th percentile per plate and writes the
   opacity into img/grades.css; it lands between 0.31 and 0.40.

   The scrim darkens top and bottom so the message bar and input row stay clean
   while the middle of the stream reads. */
.term-main{position:relative;isolation:isolate;}
.term-main::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background-repeat:no-repeat;background-size:cover;background-position:72% 18%;
  opacity:0;transition:opacity 1.2s ease;
}
.term-main::after{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(2,6,4,.92) 0%,rgba(2,6,4,.35) 18%,
             rgba(2,6,4,.28) 74%,rgba(2,6,4,.90) 100%);
}
.term-main>*{position:relative;z-index:1;}
@media (prefers-reduced-motion: reduce){.term-main::before{transition:none;}}
</style>
"""
if "TERMINAL PLATE" not in s:
    s = s.replace("</body>", TERM_CSS + "</body>"); act("add terminal plate CSS")
if 'href="img/grades.css"' not in s:
    s = s.replace("</head>", '<link rel="stylesheet" href="img/grades.css">\n</head>')
    if 'href="img/grades.css"' not in s:
        s = s.replace(TERM_CSS, '<link rel="stylesheet" href="img/grades.css">\n' + TERM_CSS)
    act("link img/grades.css")
if "amenti-art-photo.js" not in s:
    m = re.search(r'<script src="amenti-art-3\.js"[^>]*></script>', s)
    if m:
        s = s[:m.start()] + '<script src="amenti-art-photo.js" defer></script>\n    ' + s[m.start():]
        act("insert amenti-art-photo.js before amenti-art-3.js")
    else:
        s = s.replace("</body>", '<script src="amenti-art-photo.js" defer></script>\n</body>')
        act("append amenti-art-photo.js (art-3 tag not found)")

if s != orig:
    if not DRY: open("Page1.html","w").write(s)
    say(f"  Page1.html {len(orig)//1024} KB -> {len(s)//1024} KB")
else:
    say("  no changes needed")

# ── 3. WRITE FILES ────────────────────────────────────────────────────────
say("\n[3] WRITE FILES")
for path, body in PAYLOAD.items():
    d = os.path.dirname(path)
    if d and not os.path.isdir(d):
        act(f"mkdir {d}")
        if not DRY: os.makedirs(d, exist_ok=True)
    same = os.path.exists(path) and open(path).read() == body
    if same:
        say(f"  {path:26s} unchanged")
    else:
        act(f"write {path}  ({len(body)//1024 or 1} KB)")
        if not DRY: open(path,"w").write(body)

# ── 4. VERIFY ─────────────────────────────────────────────────────────────
say("\n[4] VERIFY")
s = open("Page1.html").read()
plates = [f for f in os.listdir("img") if f.endswith(('-card.jpg','-terminal.jpg'))] if os.path.isdir("img") else []
checks = [
 ("carousel is SVG (no char-photo)",   s.count('class="char-photo"') == 0),
 ("carousel SVGs present",             s.count('<svg class="char-art"') > 20),
 ("reading-room banner gone",          "dp-reader-hero" not in s),
 ("terminal plate CSS present",        "TERMINAL PLATE" in s),
 ("grades.css linked",                 'href="img/grades.css"' in s),
 ("art-photo loaded",                  "amenti-art-photo.js" in s),
 ("art-photo before art-3",            s.find("amenti-art-photo.js") < s.find("amenti-art-3.js")
                                        if "amenti-art-3.js" in s else True),
 ("roster cloner intact",              "populateMiniPortraits" in s),
 ("no orphaned animations",            "amenti-arrive" not in s and "amenti-sweep" not in s),
 ("all manifest plates on disk",
   not (os.path.exists("img/MANIFEST.json") and
        [f for f in json.load(open("img/MANIFEST.json"))["images"]
         if not os.path.exists("img/"+f)])),
 ("no -reading.jpg left",              not any("-reading.jpg" in f for f in plates)),
]
ok = True
for lab, t in checks:
    say(f"  [{'ok ' if t else 'FAIL'}] {lab}"); ok &= t

if os.path.exists("img/MANIFEST.json"):
    m = json.load(open("img/MANIFEST.json"))
    miss = [f for f in m["images"] if not os.path.exists("img/"+f)]
    say(f"\n  manifest {len(m['images'])} records")
    if miss:
        say("\n  *** TWO BINARY FILES THIS SCRIPT CANNOT CREATE ***")
        for f in miss: say(f"      img/{f}")
        say("  They are JPEGs and cannot be embedded in a text script. Copy them")
        say("  into img/ by hand — they are the only manual step. Everything else")
        say("  is done.")
    ns = sum(1 for r in m["images"].values() if r.get("seed") is None)
    if ns: say(f"  SEEDS NULL on {ns} records — only you can fill these. Without a")
    say(  "  seed an image is a history, not a recipe.")

say("\n" + ("DONE — review `git status` and `git diff`, then commit."
            if ok and not DRY else
            "DRY RUN — nothing written." if DRY else
            "COMPLETED WITH FAILURES — read the report above before committing."))
