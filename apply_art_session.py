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
# Remove the WHOLE rule in one match — selector list AND body together.
# The earlier version deleted the selectors first and then stripped
# `{display:none;}` with an unanchored pattern, which removed it from EVERY
# rule in the file: .page-section, .term-ctx, .term-roster, .mn-signin. That
# is what took the page architecture out. Never strip a declaration block
# without anchoring it to its own selector.
HIDE = (r'\.char-slide\[data-idx="\d"\] svg\.char-art'
        r'(?:,\s*\.char-slide\[data-idx="\d"\] svg\.char-art)*'
        r'\s*\{\s*display:\s*none;?\s*\}\n?')
if re.search(HIDE, s):
    s = re.sub(HIDE, '', s); act("un-hide the carousel SVGs (whole rule)")
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
    # was `\.rc-img\[data-fig=[^\n]*` — an open-ended line eater that would
    # swallow any neighbouring CSS sharing the line. Bounded to the rule now.
    (r'\.rc-img\[data-fig="[a-z-]+"\][^{]*\{[^}]*\}\n?', "inline card grades"),
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


# ── SAFETY: INVARIANTS THAT MUST SURVIVE ─────────────────────────────────
# A patch script must verify it did NOT break things, not merely that it did
# what it intended. These strings are load-bearing; if a regex eats one, the
# page loses its structure and the failure is not obvious in a diff summary.
INVARIANTS = [
    ".page-section{display:none;}",          # hides every section until active
    ".page-section.active{display:block;}",
    "@media (max-width:1100px){.term-shell",  # terminal responsive layout
    "@media (max-width:780px){.term-shell",
    ".term-ctx{display:none;}",
    ".term-roster{display:none;}",
    ".mn-signin{display:none;}",             # nav
    'class="char-slide',
    "populateMiniPortraits",
]
lost = [inv for inv in INVARIANTS if inv in orig and inv not in s]
if lost:
    say("\n  *** ABORTING — the patch destroyed load-bearing CSS ***")
    for inv in lost: say(f"      lost: {inv}")
    say("  Page1.html has NOT been written. Nothing else will run.")
    sys.exit(1)
# a patch that removes more than 3% of the file is doing something unintended
shrink = 1 - len(s)/max(len(orig),1)
if shrink > 0.03:
    say(f"\n  *** ABORTING — patch removed {shrink*100:.1f}% of Page1.html ***")
    say("  That is far more than this patch should touch. Nothing written.")
    sys.exit(1)
say(f"  invariants intact ({len(INVARIANTS)} checked), size change {-shrink*100:+.2f}%")

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
