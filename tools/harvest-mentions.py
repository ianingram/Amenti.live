#!/usr/bin/env python3
"""
============================================================================
harvest-mentions.py  ·  WHICH PLACES THE CORPUS ACTUALLY NAMES
----------------------------------------------------------------------------
    python3 tools/harvest-mentions.py library/

Reads every text under the given directory and records which of the 1,746
places in ATTICA.csv are named in them, by whom, and how often.

── WHY THIS AND NOT A SEARCH BOX ──────────────────────────────────────────
ATTICA.csv says the Dipylon Gate was at 37.979N 23.718E. That is a fact from a
gazetteer and a reader has to take it. Joined to the corpus it says the Dipylon
Gate was there AND THUCYDIDES AND PAUSANIAS BOTH NAME IT — which is a claim a
reader can go and check.

It is also how the fifty places worth writing a sentence about get chosen. The
register has 1,746 entries and nobody is going to author 1,746 sentences. The
corpus knows which ones carry the story.

── THE HARD PART IS NOT SEARCHING, IT IS AMBIGUITY ────────────────────────
A soul's name is distinctive. A place name is not. ATTICA-NAMES.csv holds 5,615
attested forms for these places, and 815 of them CANNOT IDENTIFY ONE PLACE:

    Untitled              41 places   Pleiades' placeholder, not a name
    Mine of Laureion      41 places   each shaft recorded separately
    Apollo, T.             7 places   every temple of Apollo in the box
    Asopos                 5 places   four rivers and a settlement

AND THOSE ARE COLLISIONS WITHIN 100 MILES OF ATHENS. A corpus ranges over the
whole ancient world, where Salamis is also in Cyprus and Alexandria is
everywhere. So an ambiguous form is not searched, it is REPORTED as unsearched,
and the place it belongs to is reported as unreachable by that form.

── WHAT A ZERO MEANS, AND IT IS NOT NOTHING ───────────────────────────────
A place with no mentions is a finding rather than an absence. Either the corpus
has a gap, or the register holds something no ancient author cared to name —
and those are different, and worth telling apart. The count is stated either
way; it is never quietly omitted.

── AND IT COUNTS SOURCES, NOT OCCURRENCES ─────────────────────────────────
A place named forty times by one author is corroborated once. A place named
once each by four authors is corroborated four times, and that is the stronger
claim. Both numbers are kept because they answer different questions.
============================================================================
"""
import csv, os, re, sys, unicodedata
from collections import defaultdict

csv.field_size_limit(10 ** 8)

CORPUS   = sys.argv[1] if len(sys.argv) > 1 else 'library'
PLACES   = 'ATTICA.csv'
NAMES    = 'ATTICA-NAMES.csv'
OUT      = 'ATTICA-MENTIONS.csv'
EXTS     = ('.md', '.txt')
SNIPPET  = 90


def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')


def load():
    places = {r['key']: r for r in csv.DictReader(open(PLACES, encoding='utf-8'))}
    forms = defaultdict(list)          # key -> [form, …]  usable ones only
    held = defaultdict(list)           # key -> [(form, why), …]
    for r in csv.DictReader(open(NAMES, encoding='utf-8')):
        if r['searchable'] == 'yes':
            forms[r['key']].append(r['form'])
        else:
            held[r['key']].append((r['form'], r['caution']))
    return places, forms, held


def texts(root):
    for dirpath, _, files in os.walk(root):
        for f in sorted(files):
            if f.lower().endswith(EXTS):
                p = os.path.join(dirpath, f)
                try:
                    yield p, open(p, encoding='utf-8', errors='replace').read()
                except Exception:
                    pass


def main():
    if not os.path.isdir(CORPUS):
        print('REFUSES \u2014 no corpus directory at "%s".' % CORPUS)
        print('  Point this at the reading rooms: python3 harvest-mentions.py library/')
        sys.exit(2)
    places, forms, held = load()

    # one regex per place, alternating its usable forms. Word boundaries on
    # both sides, so "Megara" does not fire inside "Megarian".
    pats = {}
    for key, fs in forms.items():
        fs = sorted(set(fs), key=len, reverse=True)
        pats[key] = re.compile(r'(?<!\w)(' + '|'.join(re.escape(f) for f in fs) + r')(?!\w)',
                               re.IGNORECASE)

    hits = defaultdict(lambda: {'n': 0, 'srcs': defaultdict(int), 'forms': set(),
                                'snip': None})
    nfile = nchar = 0
    for path, raw in texts(CORPUS):
        nfile += 1
        nchar += len(raw)
        flat = strip_accents(raw)
        src = os.path.relpath(path, CORPUS)
        for key, pat in pats.items():
            for m in pat.finditer(flat):
                h = hits[key]
                h['n'] += 1
                h['srcs'][src] += 1
                h['forms'].add(m.group(1))
                if h['snip'] is None:
                    a = max(0, m.start() - SNIPPET // 2)
                    h['snip'] = ' '.join(raw[a:a + SNIPPET].split())
        print('  read %-46s %7d chars' % (src[:46], len(raw)), flush=True)

    rows = []
    for key, p in places.items():
        h = hits.get(key)
        rows.append({
            'key': key, 'name': p['name'], 'kind': p['kind'], 'tier': p['tier'],
            'lat': p['lat'], 'lon': p['lon'], 'km': p['km'],
            'mentions': h['n'] if h else 0,
            'sources': len(h['srcs']) if h else 0,
            'in': '; '.join('%s(%d)' % (s, n) for s, n in
                            sorted(h['srcs'].items(), key=lambda kv: -kv[1])[:4]) if h else '',
            'matched_as': '|'.join(sorted(h['forms']))[:80] if h else '',
            'unsearchable_forms': len(held.get(key, [])),
            'uri': p['uri'],
            'first_seen': h['snip'] if h else '',
        })
    rows.sort(key=lambda r: (-r['sources'], -r['mentions'], r['name']))

    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

    named = [r for r in rows if r['mentions']]
    multi = [r for r in rows if r['sources'] > 1]
    print()
    print('=' * 70)
    print('  MENTIONS \u00b7 %d texts, %.1f M characters' % (nfile, nchar / 1e6))
    print('=' * 70)
    print('  %d of %d places are named in the corpus (%.0f%%)'
          % (len(named), len(rows), 100.0 * len(named) / len(rows)))
    print('  %d are named by MORE THAN ONE source \u2014 the corroborated ones' % len(multi))
    print()
    print('  %-32s %5s %5s' % ('most corroborated', 'srcs', 'total'))
    for r in rows[:16]:
        if not r['mentions']:
            break
        print('  %-32s %5d %5d   %s' % (r['name'][:32], r['sources'], r['mentions'],
                                        r['kind'][:22]))
    silent = len(rows) - len(named)
    print()
    print('  %d places are named by NOTHING in the corpus.' % silent)
    print('  \u2014 That is a finding, not an absence. Either the corpus has a gap or')
    print('    no ancient author cared to name the place, and those are different.')
    unreach = sum(1 for r in rows if not r['mentions'] and r['unsearchable_forms']
                  and not forms.get(r['key']))
    if unreach:
        print('  %d of them have NO SEARCHABLE FORM AT ALL \u2014 every name they carry' % unreach)
        print('    also names something else, so this probe could not look for them.')
    print('=' * 70)


if __name__ == '__main__':
    main()
