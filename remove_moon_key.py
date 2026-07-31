#!/usr/bin/env python3
"""AMENTI — remove the moon key.

    python3 remove_moon_key.py            # dry run, shows what it would cut
    python3 remove_moon_key.py --apply    # writes, after a .bak

WHY IT GOES. The mask existed to solve one problem: the terminal plate was
capped at 31% opacity so body text would clear WCAG 4.5:1, which made the
picture invisible. Raising opacity globally could not work, because every
pixel brightened including the ones under text, so the worst case still
governed. The pool solved it geometrically — light where the text is thin.

The slider makes that unnecessary. Legibility is the reader's call now, so
nothing has to be guaranteed, so nothing has to be masked. And the plate
already carries a key baked in by the generator; a CSS radial pool on top is
a second light source arguing with the first, which is the failure the moon
key was itself designed to avoid.

WHAT IT REMOVES: every <style> and <script> tagged data-amenti="art-term".
WHAT IT KEEPS:   the plate-v1 block, which is self-sufficient — it carries
                 its own isolation, stacking, scrim and text-shadow.
WHAT IT IGNORES: the --pool-x rules in img/grades.css. With art-term gone
                 nothing reads them. Dead, harmless, and ingest.py will keep
                 regenerating them until that is stripped out separately.
"""
import sys, os, re, shutil, datetime

PAGE  = "Page1.html"
MARK  = 'data-amenti="art-term"'
APPLY = "--apply" in sys.argv


def blocks(s, mark):
    """Find whole <style ...mark...>…</style> and <script ...mark...>…</script>."""
    out = []
    for tag in ("style", "script"):
        for m in re.finditer(rf"<{tag}\b[^>]*>", s):
            if mark not in m.group(0):
                continue
            close = s.find(f"</{tag}>", m.end())
            if close == -1:
                sys.exit(f"  ABORT: <{tag}> at {m.start()} carrying the marker is unclosed.")
            out.append((m.start(), close + len(f"</{tag}>"), tag))
    return sorted(out)


def count(s):
    return dict(
        term_before = len(re.findall(r"\.term-main[^{]*::before", s)),
        pool_x      = s.count("--pool-x"),
        mask_image  = s.count("mask-image"),
        art_term    = s.count(MARK),
        plate_v1    = s.count('data-amenti="plate-v1"'),
    )


def main():
    if not os.path.exists(PAGE):
        sys.exit(f"  no {PAGE} here — run from the repo root")
    s = open(PAGE, encoding="utf-8").read()
    before = count(s)

    print(f"\n  {PAGE}  {len(s)//1024} KB")
    for k, v in before.items():
        print(f"    {k:14s} {v}")

    if before["plate_v1"] < 2:
        sys.exit("\n  ABORT: the plate-v1 block is not present (expected 2 occurrences,\n"
                 "  one style and one script). Removing the moon key would leave the\n"
                 "  terminal with no plate system at all. Paste plate-v1 first.")

    found = blocks(s, MARK)
    if not found:
        print("\n  Nothing tagged art-term. Already removed, or it carries a different\n"
              "  marker — grep Page1.html for 'MOON KEY' and remove it by hand.")
        return 0

    print(f"\n  {len(found)} block(s) to remove:")
    for a, b, tag in found:
        head = s[a:a+90].replace("\n", " ")
        line = s[:a].count("\n") + 1
        print(f"    line {line:>5}  <{tag}>  {b-a:>6} bytes   {head[:72]}…")

    new = s
    for a, b, _ in reversed(found):
        new = new[:a] + new[b:]
    new = re.sub(r"\n{4,}", "\n\n\n", new)
    after = count(new)

    print("\n  AFTER:")
    for k in before:
        arrow = "->" if before[k] != after[k] else "  "
        print(f"    {k:14s} {before[k]} {arrow} {after[k]}")

    if after["pool_x"] or after["mask_image"] or after["art_term"]:
        print("\n  NOTE: some pool-x / mask-image / marker text survives outside the\n"
              "  tagged blocks. Inspect before trusting this as complete.")
    if after["term_before"] != 2:
        print(f"\n  NOTE: expected 2 .term-main::before rules left (plate-v1's own plate\n"
              f"  and its contain variant); found {after['term_before']}.")

    if not APPLY:
        print("\n  DRY RUN — nothing written. Re-run with --apply\n")
        return 0

    bak = f"{PAGE}.bak-{datetime.datetime.now():%Y%m%d-%H%M%S}"
    shutil.copy2(PAGE, bak)
    open(PAGE, "w", encoding="utf-8").write(new)
    print(f"\n  backup  {bak}")
    print(f"  wrote   {PAGE}   {len(s)//1024} KB -> {len(new)//1024} KB\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
