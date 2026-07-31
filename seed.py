#!/usr/bin/env python3
"""amenti seed — record a recovered seed against a plate.

    python3 seed.py lincoln-card.jpg 1837462910
    python3 seed.py lincoln-card                  # .jpg optional
    python3 seed.py --status                      # what is still missing
    python3 seed.py --worksheet                   # the recovery order

Writes one field into img/MANIFEST.json and nothing else. Idempotent, and
it refuses to overwrite a seed that is already recorded unless you pass
--force, because a wrong seed is worse than a null one: null is honest.

WHY THIS FIELD IS DIFFERENT FROM THE OTHERS. Every other value in a record
is a MEASUREMENT — saturation, grade factor, dimensions — and any of them
can be recomputed from the file at any time. The seed cannot be derived
from the pixels it produced. It is the only field in the manifest that is
testimony rather than observation, which is why it is the only one that can
be permanently lost, and why it is worth a script of its own.
"""
import sys, os, json, re, datetime

MANIFEST = None


def load():
    global MANIFEST
    for p in ("img/MANIFEST.json", "MANIFEST.json"):
        if os.path.exists(p):
            MANIFEST = p
            return json.load(open(p))
    sys.exit("no MANIFEST.json here — run from the repo root")


def save(m):
    m["updated"] = datetime.date.today().isoformat()
    tmp = MANIFEST + ".tmp"
    with open(tmp, "w") as f:
        json.dump(m, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, MANIFEST)


def resolve(m, name):
    """Accept lincoln-card, lincoln-card.jpg, or img/lincoln-card.jpg."""
    n = os.path.basename(name)
    if n in m["images"]:
        return n
    for ext in (".jpg", ".jpeg", ".png"):
        if n + ext in m["images"]:
            return n + ext
    near = [k for k in m["images"] if n.split(".")[0] in k]
    if len(near) == 1:
        return near[0]
    sys.exit(f"no record for {name!r}" + (f"; did you mean {near}?" if near else ""))


def status(m):
    have = [(k, r["seed"]) for k, r in sorted(m["images"].items()) if r.get("seed")]
    null = [k for k, r in sorted(m["images"].items()) if not r.get("seed")]
    print(f"\n  RECORDED {len(have)} / {len(m['images'])}\n")
    for k, s in have:
        print(f"    {k:34s} {s}")
    if null:
        print(f"\n  STILL NULL {len(null)}\n")
        for k in null:
            print(f"    {k:34s} {m['images'][k].get('source','')}")
    print()
    return 0 if not null else 1


def worksheet(m):
    """The order the plates were generated in, decoded from the source
    filenames. Match this against OpenArt's history, newest first."""
    rows = []
    for k, r in m["images"].items():
        mt = re.search(r"_(\d{13})_", r.get("source") or "")
        rows.append((int(mt.group(1)) / 1000 if mt else None, k, r))
    rows.sort(key=lambda x: (x[0] is None, x[0]))
    tz = datetime.datetime.now().astimezone().tzinfo
    print(f"\n  {'#':>2}  {'generated (local)':19s}  {'plate':32s}  seed")
    for i, (ts, k, r) in enumerate(rows, 1):
        when = (datetime.datetime.fromtimestamp(ts, tz).strftime("%Y-%m-%d %H:%M:%S")
                if ts else "— renamed, no stamp —")
        print(f"  {i:>2}  {when:19s}  {k:32s}  {r.get('seed') or '····'}")
    print("\n  The 13-digit number in each source filename is the generation")
    print("  time in Unix milliseconds. Sort OpenArt's history by date and")
    print("  the block matches straight across.\n")


def main(argv):
    m = load()
    if argv[0] == "--status":
        return status(m)
    if argv[0] == "--worksheet":
        return worksheet(m)

    force = "--force" in argv
    argv = [a for a in argv if a != "--force"]
    if len(argv) < 2:
        print(__doc__); return 1

    key = resolve(m, argv[0])
    seed = argv[1].strip()
    if not re.fullmatch(r"-?\d{1,20}", seed):
        sys.exit(f"{seed!r} is not a seed. Seeds are integers.")

    rec = m["images"][key]
    old = rec.get("seed")
    if old and str(old) != seed and not force:
        sys.exit(f"{key} already carries seed {old}. Pass --force to replace it.")

    rec["seed"] = int(seed)
    rec["seed_recovered"] = datetime.date.today().isoformat()
    save(m)

    left = sum(1 for r in m["images"].values() if not r.get("seed"))
    print(f"  {key}  seed {seed} recorded")
    print(f"  {len(m['images']) - left} of {len(m['images'])} now regenerable"
          + (f", {left} still null" if left else "  — THE SET IS COMPLETE"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or ["--status"]))
