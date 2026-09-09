#!/usr/bin/env python3
"""
============================================================================
latinise-names.py  →  Amenti.live/tools/latinise-names.py
----------------------------------------------------------------------------
THE GAZETTEER'S LANGUAGE IS NOT THE CORPUS'S LANGUAGE.

    python3 tools/latinise-names.py .

── THE FAULT THIS ANSWERS ─────────────────────────────────────────────────
`ATTICA-MENTIONS.csv` reported Laureion as named by NOTHING in a library of
603 texts. The captain then found it at once, spelled LAURIUM.

The harvest was not wrong and neither was the alias table. PLEIADES ITSELF DOES
NOT HOLD THE LATIN FORM:

    Pleiades has   Laureion · Laúreion · Λαύρειον
    the corpus has Laurium

Pleiades is a Greek-and-Roman gazetteer that records Greek places in GREEK.
An English-language library of older scholarship uses LATIN — Laurium,
Thoricus, Sunium, Munychia, Decelea. Where the Latin form happens to sit in a
Pleiades title the place matched; `Corinthus/Korinthos` and `Thebai/Thebae` are
near the top of the corroborated list for exactly that reason. WHERE IT DOES
NOT, THE PLACE VANISHED.

So "1,594 places named by nothing" is inflated by an unknown amount, and the
amount is measurable only by fixing this and re-running.

── AND A DERIVED FORM IS NOT AN ATTESTED ONE ──────────────────────────────
Every form generated here is marked `derived` in its own column. It has to be,
because it is a GUESS AT A SPELLING NOBODY RECORDED — a transliteration rule
applied to an attested name, not a name anyone wrote.

    a hit on an ATTESTED form   the corpus names this place
    a hit on a DERIVED form     the corpus names something that transliterates
                                to this place, and a reader should be able to
                                see which kind of hit it was

That distinction is the whole of the honesty here. Collapse it and the register
starts claiming attestation for spellings it invented.

── THE RULES, AND WHERE THEY FAIL ─────────────────────────────────────────
Greek-to-Latin transliteration is conventional rather than regular. These are
the common conversions and they will produce nonsense on some names. THAT IS
ACCEPTABLE ONLY BECAUSE THE FORMS ARE MARKED: a nonsense form matches nothing
and costs nothing, while a missing form costs a place its entire history.

Known to work:   Korinthos→Corinthus · Thebai→Thebae · Aigina→Aegina
                 Thorikos→Thoricus · Mykenai→Mycenae · Laureion→Laurium
Known to fail:   irregular stems, and any name Latin borrowed rather than
                 transliterated. Those want authoring by hand.
============================================================================
"""
import csv, os, re, sys, unicodedata

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = os.path.join(ROOT, 'ATTICA-NAMES.csv')
OUT = os.path.join(ROOT, 'ATTICA-NAMES.csv')

GREEK = re.compile(r'[\u0370-\u03ff\u1f00-\u1fff]')


def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')


def latinise(name):
    """Return the Latin form, or None if the rules change nothing."""
    if GREEK.search(name):
        return None                      # Greek script: a different job
    s = strip_accents(name)
    # ── A SLASH IS A TITLE, NOT A NAME · found by reading the output ──────
    # "Academy/Akademeia/Akademia" and "Bronze Athena/Athena Promachus" are
    # Pleiades TITLES listing several names at once. Transliterating one
    # produces a string no text contains, and forty of them came through on the
    # first run. A name is one name.
    if '/' in s:
        return None
    if not re.match(r'^[A-Za-z][A-Za-z \-\'()]*$', s):
        return None
    # a form this short cannot be searched for whatever language it is in —
    # the same rule the attested table already keeps
    if len(re.sub(r'[^A-Za-z]', '', s)) < 5:
        return None
    out = s

    # diphthongs first, before the single letters they contain
    out = re.sub(r'\bAi', 'Ae', out)
    out = re.sub(r'ai\b', 'ae', out)
    out = re.sub(r'\bOi', 'Oe', out)
    out = re.sub(r'oi\b', 'oe', out)
    out = re.sub(r'ei', 'i', out)        # Peiraieus → Piraius → Piraeus below
    out = re.sub(r'ou', 'u', out)

    # consonants
    out = out.replace('kh', 'ch').replace('Kh', 'Ch')
    out = out.replace('k', 'c').replace('K', 'C')

    # ── TERMINATIONS, AND THE ONE THAT OVER-FIRES ────────────────────────
    # `-on → -um` is right for Sounion→Sunium and WRONG for Marathon, which
    # Latin keeps whole. Latin borrowed some Greek names and transliterated
    # others, and no rule separates the two.
    #
    # So `-on` is only converted after `-i`, which is the productive case
    # (-ion → -ium). A bare `-on` is left alone: MARATHON STAYS MARATHON, and
    # the handful of names that should have changed are missed rather than
    # mangled. A missed form finds nothing; a mangled one finds nothing AND
    # occupies a row claiming to be a spelling.
    out = re.sub(r'os\b', 'us', out)
    out = re.sub(r'ion\b', 'ium', out)

    # a few names Latin took whole rather than transliterating
    FIXED = {
        'Piraius': 'Piraeus', 'Piraiius': 'Piraeus', 'Piraeus': 'Piraeus',
        'Athinai': 'Athenae', 'Athenai': 'Athenae',
        'Sunium': 'Sunium', 'Sunion': 'Sunium',
    }
    out = FIXED.get(out, out)

    if out == s:
        return None
    return out


def main():
    if not os.path.exists(SRC):
        print('REFUSES — no ATTICA-NAMES.csv at ' + ROOT)
        sys.exit(2)

    rows = list(csv.DictReader(open(SRC, encoding='utf-8')))
    cols = list(rows[0].keys())
    if 'origin' not in cols:
        cols.append('origin')
    for r in rows:
        r.setdefault('origin', 'attested')
        if not r['origin']:
            r['origin'] = 'attested'

    # every form already present, so a derived one that duplicates is dropped
    have = {r['form'].lower() for r in rows}
    by_place = {}
    for r in rows:
        by_place.setdefault(r['key'], r)

    made, samples = [], []
    for r in list(rows):
        if r.get('origin') != 'attested':
            continue
        lat = latinise(r['form'])
        if not lat or lat.lower() in have:
            continue
        have.add(lat.lower())
        made.append({
            'key': r['key'], 'place': r['place'], 'form': lat,
            'script': 'latin', 'searchable': 'yes',
            'caution': 'DERIVED from ' + r['form'] + ' — a transliteration, not an attestation',
            'names_n_places': '', 'origin': 'derived'
        })
        if len(samples) < 18:
            samples.append((r['place'][:26], r['form'], lat))

    # a derived form that names more than one place is no better than an
    # attested one that does — the ambiguity rule applies to both
    from collections import Counter
    tally = Counter(m['form'].lower() for m in made)
    for m in made:
        n = tally[m['form'].lower()]
        m['names_n_places'] = n
        if n > 1:
            m['searchable'] = ''
            m['caution'] = 'DERIVED, and names %d places — not searched' % n

    allrows = rows + made
    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in allrows:
            w.writerow({c: r.get(c, '') for c in cols})

    usable = sum(1 for m in made if m['searchable'] == 'yes')
    print('=' * 70)
    print('  LATINISE · derived forms for a corpus that does not speak Greek')
    print('=' * 70)
    print('  attested forms in       %5d' % len(rows))
    print('  derived forms added     %5d   (%d searchable, %d too ambiguous)'
          % (len(made), usable, len(made) - usable))
    print('  total                   %5d' % len(allrows))
    print()
    print('  a sample, so the rules can be judged rather than trusted:')
    for place, was, now in samples:
        print('    %-26s %-22s \u2192 %s' % (place, was, now))
    print()
    print('  EVERY ONE OF THESE IS MARKED `derived`. A hit on one says the corpus')
    print('  names something that TRANSLITERATES to this place — not that anyone')
    print('  wrote this spelling. Re-run the mentions harvest and the change in')
    print('  the count is the measurement of what was being missed.')
    print('=' * 70)


if __name__ == '__main__':
    main()
