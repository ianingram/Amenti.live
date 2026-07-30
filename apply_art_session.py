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
