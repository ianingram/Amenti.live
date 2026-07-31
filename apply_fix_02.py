#!/usr/bin/env python3
"""
AMENTI — FIX 02  ·  THE MOON KEY
=================================
Run from the repo root, or via the Apply-art-session workflow with
`script: apply_fix_02.py`. Idempotent; safe to run twice.

THE PROBLEM. The terminal plate was rendering and nobody could see it. It was
capped at 31% opacity so that body text would clear WCAG 4.5:1, and then a 28%
scrim was laid over the middle of the panel — exactly where a reader looks.
Lincoln's plate has a mean of 126 and arrived on screen at about 30 out of 255.
Drawn, but not lit. Optimising for legibility alone made the picture invisible,
which is a different kind of failure from a broken one.

THE FIX. The plate now runs at near full strength and a MASK decides where the
light falls — a pool, not a global dim. Inside the pool the plate reaches a mean
of about 90; outside it recedes to a floor of 14% and never to zero.

  APERTURE WIDER THAN THE PANEL, 150% x 130%. If the pool is larger than its
    container you cannot find its edge, only the falloff across the frame.
  A LONG FALLOFF, five stops. A torch is bright to a hard shoulder then dark;
    a window is bright then gradually less over a long run.
  NO FLOOR AT ZERO. The plate stays faintly present at the far side, so the
    image continues into shadow rather than ending. An edge that stops is a
    shape; an edge that fades is a form.

  --pool-x IS THE MOON, and it comes from each plate's OWN measured key_side.
    Lincoln's column is keyed from the left, so the pool sits at 26%. Tesla's
    bench is keyed from the right, so it sits at 74%. The CSS light agrees with
    the light already baked into the photograph.

The scrim is reduced to the very top and bottom only, clear of the message bar
and input row. Terminal text gains a small text-shadow — cheaper insurance than
dimming the whole plate.

WHAT IT TOUCHES: the terminal style block in Page1.html, img/grades.css,
img/MANIFEST.json, ingest.py. It checks the page's invariants first and refuses
to write if anything load-bearing is already missing.
"""
import os, sys, re, json, base64, zlib, shutil, datetime

BLOB = "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"
DRY = "--dry-run" in sys.argv
def say(*a): print(*a)
def act(m): say(("  would " if DRY else "  ") + m)

if not os.path.exists("Page1.html"):
    sys.exit("Page1.html not found — run from the repo root.")
P = json.loads(zlib.decompress(base64.b64decode(BLOB)).decode())

say("\n[1] GUARD")
page = open("Page1.html").read()
INV = [".page-section{display:none;}", ".page-section.active{display:block;}",
       ".term-ctx{display:none;}", ".term-roster{display:none;}",
       ".mn-signin{display:none;}", "populateMiniPortraits",
       '<section class="term-main">']
lost = [i for i in INV if i not in page]
if lost:
    say("  *** ABORTING — Page1.html is missing load-bearing markup ***")
    for i in lost: say(f"      lost: {i}")
    sys.exit(1)
say(f"  invariants intact ({len(INV)} checked)")

say("\n[2] REPLACE THE TERMINAL STYLE BLOCK")
orig = page
new_block = P.pop("__TERM_CSS__")
pat = r'<style data-amenti="art-term">.*?</style>\n?'
if re.search(pat, page, re.S):
    page = re.sub(pat, new_block, page, count=1, flags=re.S)
    act("replace the existing art-term block")
else:
    page = page.replace("</body>", new_block + "</body>")
    act("insert the art-term block (none was present)")

shrink = 1 - len(page)/max(len(orig),1)
if shrink > 0.03:
    say(f"  *** ABORTING — that removed {shrink*100:.1f}% of the file ***"); sys.exit(1)
lost = [i for i in INV if i not in page]
if lost:
    say("  *** ABORTING — the edit destroyed load-bearing markup ***")
    for i in lost: say(f"      lost: {i}")
    sys.exit(1)
say(f"  invariants still intact, size change {-shrink*100:+.2f}%")
if page != orig:
    if not DRY:
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        shutil.copy("Page1.html", f"Page1.html.bak-{stamp}")
        open("Page1.html","w").write(page)
    say(f"  Page1.html {len(orig)//1024} KB -> {len(page)//1024} KB")

say("\n[3] WRITE FILES")
for path, body in P.items():
    if os.path.exists(path) and open(path).read() == body:
        say(f"  {path:26s} unchanged")
    else:
        act(f"write {path}  ({len(body)//1024 or 1} KB)")
        if not DRY: open(path,"w").write(body)

say("\n[4] VERIFY")
page = open("Page1.html").read()
g = P.get("img/grades.css","")
ok = True
for lab, t in (
  ("moon-key CSS present",        "THE MOON KEY" in page),
  ("mask on the plate",           "mask-image:radial-gradient" in page),
  ("aperture wider than panel",   "150% 130%" in page),
  ("floor above zero",            "rgba(0,0,0,.14)" in page),
  ("scrim clear of the middle",   "rgba(2,6,4,0) 20%" in page),
  ("pool geometry in grades.css", "--pool-x" in g),
  ("seven plates keyed",          g.count("--pool-x") == 7),
  ("page architecture intact",    all(i in page for i in INV)),
):
    say(f"  [{'ok ' if t else 'FAIL'}] {lab}"); ok &= t

say("\n" + ("DONE — commit, then open the TERMINAL and select a legend. The plate "
            "should now read as an image lit from one side, not a black panel."
            if ok and not DRY else "DRY RUN — nothing written." if DRY else
            "COMPLETED WITH FAILURES — read the report above."))
