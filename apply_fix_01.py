#!/usr/bin/env python3
"""
AMENTI — FIX 01  ·  musashi key + terminal resolver
====================================================
Run from the repo root, or via the Apply-art-session workflow with
`script: apply_fix_01.py`. Idempotent; safe to run twice.

TWO BUGS, BOTH MINE.

FIX A — THE MUSASHI KEY WAS GUESSED, AND GUESSED WRONG.
    The plates were named miyamoto-musashi-*.jpg. His roster record says
    key:'musashi'. He is the one figure with no library/ file, so instead of
    reading the key I inferred it from the frederick-douglass pattern. The
    loader probed a path that does not exist, got a 404, and fell back to his
    SVG mark — which is why he alone showed a puppet in the codex.
    Renames to musashi-card.jpg / musashi-terminal.jpg.

FIX B — THE TERMINAL RESOLVED BY DISPLAY NAME INSTEAD OF BY KEY.
    passTerminal() slugged the visible name. That works only where name and key
    happen to agree. "MIYAMOTO MUSASHI" slugs to miyamoto-musashi, key musashi.
    "MOHANDAS GANDHI" slugs to mohandas-gandhi, key gandhi. Every mismatch
    404s silently, and the terminal rendered nothing at all.
    Now resolves from data-id against AMENTI_CHARS, exactly as the codex does.

It also verifies invariants before writing, and aborts rather than compound a
broken page — the guard added after the last run took the architecture out.
"""
import os, sys, re, json, base64, zlib, subprocess, shutil, datetime

BLOB = "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"
DRY = "--dry-run" in sys.argv
def say(*a): print(*a)
def act(m): say(("  would " if DRY else "  ") + m)

if not os.path.exists("Page1.html"):
    sys.exit("Page1.html not found — run from the repo root.")
P = json.loads(zlib.decompress(base64.b64decode(BLOB)).decode())

say("\n[1] FIX A — rename the musashi plates")
done = 0
for suf in ("card", "terminal"):
    old, new = f"img/miyamoto-musashi-{suf}.jpg", f"img/musashi-{suf}.jpg"
    if os.path.exists(new) and not os.path.exists(old):
        say(f"  {new} already correct"); continue
    if not os.path.exists(old):
        say(f"  [warn] neither {old} nor {new} present"); continue
    act(f"git mv {old} {new}")
    if not DRY:
        if subprocess.run(["git","mv",old,new], capture_output=True).returncode:
            shutil.move(old, new)
    done += 1
say(f"  {done} renamed")

say("\n[2] FIX B — write the corrected files")
INVARIANTS = [".page-section{display:none;}", ".page-section.active{display:block;}",
              ".term-ctx{display:none;}", "populateMiniPortraits"]
page = open("Page1.html").read()
lost = [i for i in INVARIANTS if i not in page]
if lost:
    say("  *** ABORTING — Page1.html is already missing load-bearing CSS ***")
    for i in lost: say(f"      lost: {i}")
    say("  Restore Page1.html from a good commit first. Nothing written.")
    sys.exit(1)
say(f"  invariants intact ({len(INVARIANTS)} checked) — Page1.html is not touched by this fix")

for path, body in P.items():
    d = os.path.dirname(path)
    if d and not os.path.isdir(d) and not DRY: os.makedirs(d, exist_ok=True)
    if os.path.exists(path) and open(path).read() == body:
        say(f"  {path:26s} unchanged")
    else:
        act(f"write {path}  ({len(body)//1024 or 1} KB)")
        if not DRY: open(path, "w").write(body)

say("\n[3] VERIFY")
ok = True
js = P.get("amenti-art-photo.js", "")
for lab, t in (
  ("musashi plates renamed", os.path.exists("img/musashi-terminal.jpg")
                             and not os.path.exists("img/miyamoto-musashi-terminal.jpg")),
  ("terminal resolves by data-id", "AMENTI_CHARS[+row" in js),
  ("terminal no longer slugs names", "term-char-name" not in js),
  ("grades.css knows musashi", 'data-fig="musashi"' in P.get("img/grades.css","")),
  ("14 plates present", len([f for f in os.listdir("img")
                             if f.endswith(("-card.jpg","-terminal.jpg"))]) == 14),
):
    say(f"  [{'ok ' if t else 'FAIL'}] {lab}"); ok &= t

say("\n" + ("DONE — commit, then check the TERMINAL. It should now paint a plate "
            "behind the chat stream when a legend is selected."
            if ok and not DRY else "DRY RUN — nothing written." if DRY else
            "COMPLETED WITH FAILURES — read the report above."))
