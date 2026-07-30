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
