/* ===========================================================================
   amenti-resolve.js  ·  Ingram Manor LLC
   THE RESOLVER — one name, one person, no guessing.
   ---------------------------------------------------------------------------
   WHAT IT REPLACES

     Five private schemes currently answer "is this the same person?", and the
     probes proved they disagree 191 times:

       roster.js    codexFor()      last name, then containment either way
       Page1        slug(name,used) order-dependent, appends -2 on collision
       Page1        norm(name)      strips punctuation, used for curated dedupe
       library.js   name.toLowerCase()
       quizzard     slugKey(figure) server-side

     codexFor is the dangerous one, because it ANSWERS. It matched a pope to
     Cleopatra on the regnal numeral VII, seven monarchs to Constantine on the
     word "great", Lao Tzu to Sun Tzu, and Indira Gandhi to Mohandas. Each was
     confident, plausible and wrong, and the arena looked perfectly well.

   THE RULE

     EXACT MATCH ONLY. A name resolves through a table or it resolves to null.
     There is no last-name fallback and no containment. An unknown name is
     returned as unknown, and the caller decides what to do about it — which
     is the whole difference between this and what it replaces.

   THE CANONICAL KEY IS THE ONE ALREADY IN USE

     Nothing is renamed. The topic forensics settled it: 31 topic_ids embed the
     short record key, 27 a surname form, and exactly ONE the engine's slug.
     Art keys, reading rooms, CURATED_GROUP and bookmarked URLs all use the
     short key. So the short key stays canonical and every other spelling
     becomes an alias pointing at it.

   RICH WINS

     When two records claim one alias, the RICH record takes it. Without this
     rule "Julius Caesar" resolves to the thin ledger row rather than the
     hand-made card, and the figure loses its face and its bars.

   THIS FILE CHANGES NOTHING ON LOAD.
     It builds the index, runs its own adversarial tests, writes a .txt report
     and stops. Wiring it into roster.js is a separate, small step taken only
     after the report reads clean.

   USE
       <script src="amenti-resolve.js"></script>       (after the csv loader)
   or paste it into the console. Either way a report downloads.
   =========================================================================== */
(function () {
  'use strict';

  var VERSION = 2;

  /* ── THE SAME PERSON, TWICE ────────────────────────────────────────────
     mergeCuratedOver() dedupes the curated set against the ledger by
     norm(name). The curated names are ceremonial and the ledger's are common,
     so they never meet: "GAIUS JULIUS CAESAR" does not equal "Julius Caesar",
     and BOTH RECORDS SURVIVE. Three figures are currently in the codex twice.

     This table says they are one person. Left is the ledger/alternate key,
     right is the canonical record it belongs to. Adding a pair here does not
     delete a row — it makes every lookup agree, which is the part that
     matters. Removing the duplicate row is a separate job in the ledger. */
  var SAME_PERSON = {
    'julius-caesar'   : 'caesar',
    'mahatma-gandhi'  : 'gandhi'
    /* 'moses' collides with itself — the ledger row slugs to the same key as
       the curated record, so no mapping is needed. It is the reason probe one
       saw a record "move" from index 139 to 4: not a race, a duplicate key. */
  };

  /* ── HAND-SEEDED ALIASES ───────────────────────────────────────────────
     Everything derivable from a record's own name is generated automatically
     below. This table is only for spellings a machine cannot infer: the forms
     the world actually uses, and the ones quizzes were written with. */
  var ALIASES = {
    'caesar'      : ['julius caesar', 'gaius julius caesar', 'julius-caesar', 'gaius-julius-caesar'],
    'gandhi'      : ['mahatma gandhi', 'mohandas gandhi', 'mohandas karamchand gandhi', 'mahatma-gandhi'],
    'moses'       : ['moses ben amram', 'moses-ben-amram'],
    'seneca'      : ['seneca the younger', 'lucius annaeus seneca', 'seneca-the-younger'],
    'lycurgus'    : ['lycurgus of sparta', 'lycurgus-of-sparta'],
    'manlius'     : ['marcus manlius capitolinus', 'marcus-manlius-capitolinus'],
    'cleopatra'   : ['cleopatra vii', 'cleopatra-vii'],
    'hannibal'    : ['hannibal barca', 'hannibal-barca'],
    'musashi'     : ['miyamoto musashi', 'miyamoto-musashi'],
    'lincoln'     : ['abraham lincoln', 'abraham-lincoln'],
    'tesla'       : ['nikola tesla', 'nikola-tesla'],
    'ingram'      : ['ian ingram', 'ian-ingram'],
    'sun-tzu'     : ['sun tzu', 'sunzi', 'suntzu'],
    'king-arthur' : ['arthur', 'king arthur'],

    /* The ledger records the goddess as "Diana Daughter of Jupiter" while the
       quiz names her "Diana". Checked before adding: there is exactly one
       Diana in the roster — no Princess of Wales — so the short form is
       unambiguous. It is also the name that produced codexFor's worst kind of
       error in the other direction: "Jupiter" is CONTAINED in "Diana Daughter
       of Jupiter", so the god of the sky resolved to the goddess of the hunt.
       Exact matching ends that, and the guard below holds it ended. */
    'diana-daughter-of-jupiter' : ['diana']
  };

  /* ── THE GUARDS ────────────────────────────────────────────────────────
     Pairs that codexFor confused and that MUST stay apart. These are not
     configuration — they are the test suite. Every one of them was a real
     wrong answer taken from the live page, and if the resolver ever merges a
     pair the report says FAIL and the migration stops.

     Exact matching makes these safe by construction. The guards exist so that
     stays true after somebody edits the alias table. */
  var GUARDS = [
    ['Julius Caesar', 'Augustus Caesar'],
    ['Mahatma Gandhi', 'Indira Gandhi'],
    ['Cleopatra VII', 'Pope Clement VII'],
    ['Sun Tzu', 'Lao Tzu'],
    ['George Washington', 'Denzel Washington'],
    ['Genghis Khan', 'Kublai Khan'],
    ['Qin Shi Huang', 'Jensen Huang'],
    ['Paul the Apostle', 'Andrew the Apostle'],
    ['Orville Wright', 'Richard Wright'],
    ['Adam Smith', 'Joseph Smith'],
    ['Constantine the Great', 'Alexander the Great'],
    ['Constantine the Great', 'Catherine the Great'],
    ['Marcus Aurelius', 'Marcus Manlius Capitolinus'],
    ['Francis Bacon', 'Francis Bacon (Painter)'],
    ['Jupiter', 'Diana Daughter of Jupiter'],
    ['Enki', 'Enkidu'],
    ['Mars', 'Marshall McLuhan']
  ];

  /* ── forms ─────────────────────────────────────────────────────────────
     The four ways a name gets written down anywhere in this fleet. All four
     are indexed so any of them resolves; none of them is used to GUESS. */
  function fSlug(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function fNorm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function fLower(s) { return String(s || '').toLowerCase().trim().replace(/\s+/g, ' '); }

  var INDEX = {};        /* form -> canonical key */
  var OWNER = {};        /* form -> 'rich' | 'thin' | 'seed' */
  var RECORDS = {};      /* canonical key -> record */
  var COLLISIONS = [];
  var BUILT = false;

  function claim(form, key, rank) {
    if (!form || !key) return;
    var held = INDEX[form];
    if (held === undefined) { INDEX[form] = key; OWNER[form] = rank; return; }
    if (held === key) return;
    /* rich beats thin; a hand-seeded alias beats both */
    var order = { seed: 3, rich: 2, thin: 1 };
    if (order[rank] > order[OWNER[form]]) {
      COLLISIONS.push({ form: form, was: held, now: key, why: rank + ' outranks ' + OWNER[form] });
      INDEX[form] = key; OWNER[form] = rank;
    } else {
      COLLISIONS.push({ form: form, was: held, now: null, why: key + ' refused (' + rank + ' under ' + OWNER[form] + ')' });
    }
  }

  function build(chars) {
    INDEX = {}; OWNER = {}; RECORDS = {}; COLLISIONS = [];
    chars = chars || window.AMENTI_CHARS || [];

    /* rich first, so a thin ledger row can never take a curated figure's name */
    [true, false].forEach(function (wantRich) {
      chars.forEach(function (c) {
        if (!c || !c.key) return;
        var isRich = !!(c.rich || c.stats);
        if (isRich !== wantRich) return;
        var key = SAME_PERSON[c.key] || c.key;
        var rank = isRich ? 'rich' : 'thin';
        if (!RECORDS[key] || (isRich && !(RECORDS[key].rich || RECORDS[key].stats))) RECORDS[key] = c;
        claim(c.key, key, rank);
        claim(fSlug(c.key), key, rank);
        if (c.name) {
          claim(fLower(c.name), key, rank);
          claim(fSlug(c.name), key, rank);
          claim(fNorm(c.name), key, rank);
        }
      });
    });

    /* the hand-seeded table last and highest — it is the human decision */
    Object.keys(ALIASES).forEach(function (key) {
      ALIASES[key].forEach(function (a) {
        claim(fLower(a), key, 'seed');
        claim(fSlug(a), key, 'seed');
        claim(fNorm(a), key, 'seed');
      });
    });
    Object.keys(SAME_PERSON).forEach(function (from) {
      claim(from, SAME_PERSON[from], 'seed');
      claim(fSlug(from), SAME_PERSON[from], 'seed');
    });

    BUILT = true;
    return Object.keys(INDEX).length;
  }

  /* ── resolve · four exact lookups, then null. No fallback. ───────────── */
  function resolve(s) {
    if (!BUILT) build();
    if (!s) return null;
    var t = String(s).trim();
    return INDEX[t] || INDEX[fLower(t)] || INDEX[fSlug(t)] || INDEX[fNorm(t)] || null;
  }
  function record(s) { var k = resolve(s); return k ? (RECORDS[k] || null) : null; }

  /* the matcher being retired, kept ONLY to diff against */
  function words(x) {
    return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  }
  function codexFor(figure, chars) {
    chars = chars || window.AMENTI_CHARS || [];
    var f = words(figure); if (!f.length) return null;
    var fs = f.join(' ');
    function hunt(richOnly) {
      for (var i = 0; i < chars.length; i++) {
        var c = chars[i]; if (!c || !c.name) continue;
        if (richOnly && !(c.rich || c.stats)) continue;
        var n = words(c.name); if (!n.length) continue;
        var ns = n.join(' ');
        if (f[f.length - 1] === n[n.length - 1]) return c;
        if (fs.indexOf(ns) !== -1 || ns.indexOf(fs) !== -1) return c;
      }
      return null;
    }
    return hunt(true) || hunt(false);
  }

  /* ── the report ────────────────────────────────────────────────────── */
  var L = [];
  function out(s) { L.push(s == null ? '' : String(s)); }
  function rule(c) { out(new Array(76).join(c || '-')); }
  function head(t) { out(''); rule('='); out(t.toUpperCase()); rule('='); }
  function pad(s, n) {
    s = String(s == null ? '' : s);
    return s.length >= n ? s.slice(0, Math.max(0, n - 1)) + '\u2026'
                         : s + new Array(n - s.length + 1).join(' ');
  }

  function verify() {
    L = [];
    var chars = window.AMENTI_CHARS || [];
    var n = build(chars);
    var rich = chars.filter(function (c) { return c && (c.rich || c.stats); });

    out('AMENTI \u00b7 THE RESOLVER \u2014 DRY RUN');
    out('generated  ' + new Date().toISOString());
    out('page       ' + location.href);
    out('resolver   v' + VERSION + '  \u00b7  nothing was patched');

    head('1 \u00b7 the index');
    out('records seen        ' + chars.length + '   (' + rich.length + ' rich)');
    out('canonical people    ' + Object.keys(RECORDS).length);
    out('forms indexed       ' + n);
    out('hand-seeded aliases ' + Object.keys(ALIASES).length + ' figures');
    out('same-person merges  ' + Object.keys(SAME_PERSON).length);

    head('2 \u00b7 contested forms');
    var real = COLLISIONS.filter(function (c) { return c.now !== null; });
    var refused = COLLISIONS.filter(function (c) { return c.now === null; });
    out('resolved by rank (rich/seed won) : ' + real.length);
    out('refused (lower rank turned away) : ' + refused.length);
    if (real.length) {
      out('');
      out(pad('FORM', 30) + pad('WAS', 20) + pad('NOW', 20) + 'WHY');
      rule('-');
      real.slice(0, 25).forEach(function (c) {
        out(pad(c.form, 30) + pad(c.was, 20) + pad(c.now, 20) + c.why);
      });
      if (real.length > 25) out('(' + (real.length - 25) + ' more)');
    }
    out('');
    out('A contested form is not a fault here \u2014 it is the rank rule doing its');
    out('job. It IS a fault if a rich record loses one, which cannot happen:');
    out('only seed outranks rich, and seed is written by hand.');

    head('3 \u00b7 the guards');
    out('Every pair below was a real wrong answer from codexFor on the live');
    out('page. The resolver must keep them apart.');
    out('');
    out(pad('A', 30) + pad('B', 30) + 'VERDICT');
    rule('-');
    var failed = 0;
    GUARDS.forEach(function (g) {
      var a = resolve(g[0]), b = resolve(g[1]);
      var ok = !(a && b && a === b);
      if (!ok) failed++;
      out(pad(g[0], 30) + pad(g[1], 30)
        + (ok ? 'kept apart  (' + (a || 'null') + ' / ' + (b || 'null') + ')'
              : '*** MERGED \u2014 FAIL *** both -> ' + a));
    });
    out('');
    out(failed ? ('*** ' + failed + ' GUARD(S) FAILED \u2014 DO NOT WIRE THIS IN ***')
               : '\u2713 all ' + GUARDS.length + ' pairs kept apart');

    head('4 \u00b7 the same pairs, under the matcher being retired');
    out(pad('ASKED', 34) + pad('codexFor GAVE', 26) + 'RESOLVER GIVES');
    rule('-');
    var wrongOld = 0;
    GUARDS.forEach(function (g) {
      g.forEach(function (name) {
        var old = codexFor(name, chars);
        var oldK = old ? old.key : null;
        var neu = resolve(name);
        var bad = oldK && neu && oldK !== neu;
        if (bad) wrongOld++;
        out(pad(name, 34) + pad((oldK || 'null') + (bad ? '  \u2717' : ''), 26) + (neu || 'null'));
      });
    });
    out('');
    out(wrongOld + ' of those lookups were answered WRONG by codexFor today.');

    head('5 \u00b7 the join, replayed');
    out('Every quiz figure, resolved both ways.');
    out('');
    var topics = (window.__AMENTI_TOPICS__ && window.__AMENTI_TOPICS__.topics) || null;
    if (!topics) {
      out('(topics not preloaded on this page \u2014 fetching)');
    }
    return (topics ? Promise.resolve({ topics: topics })
      : fetch(((window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL)
          || 'https://amenti-mint.ingram-ian.workers.dev') + '/quiz/topics')
        .then(function (r) { return r.ok ? r.json() : { topics: [] }; })
        .catch(function () { return { topics: [] }; })
    ).then(function (d) {
      var list = (d && d.topics) || [];
      var figs = {};
      list.forEach(function (t) {
        var f = t.figure || (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
        if (f) (figs[f] = figs[f] || []).push(t.id || t.topic_id);
      });
      var names = Object.keys(figs);
      var same = 0, diff = [], lost = [], gained = [], miss = [];
      names.forEach(function (f) {
        var old = codexFor(f, chars); var oldK = old ? old.key : null;
        var neu = resolve(f);
        if (oldK === neu) { same++; if (!neu) miss.push(f); return; }
        if (oldK && !neu) lost.push({ f: f, was: oldK });
        else if (!oldK && neu) gained.push({ f: f, now: neu });
        else diff.push({ f: f, was: oldK, now: neu });
      });
      out(pad('OUTCOME', 44) + 'COUNT');
      rule('-');
      out(pad('identical to today', 44) + same + ' of ' + names.length);
      out(pad('resolver finds NOBODY (today: someone)', 44) + lost.length);
      out(pad('resolver finds someone (today: nobody)', 44) + gained.length);
      out(pad('resolves to a DIFFERENT record', 44) + diff.length);

      if (diff.length) {
        out('');
        out('DIFFERENT RECORD \u2014 read every line before wiring in:');
        diff.forEach(function (x) { out('   ' + pad(x.f, 32) + x.was + '  ->  ' + x.now); });
        out('');
        out('If a line reads  julius-caesar -> caesar  that is the FIX, not a');
        out('regression: the thin ledger row is being handed to the hand-made');
        out('card it always belonged to.');
      }
      if (lost.length) {
        out('');
        out('WOULD LOSE ITS RECORD (' + lost.length + ') \u2014 each needs one alias line:');
        lost.forEach(function (x) {
          out('   ' + pad(x.f, 32) + 'today -> ' + x.was);
          out('       ALIASES[\'' + x.was + '\'].push(\'' + fLower(x.f) + '\');');
        });
        out('');
        out('This is the whole to-do list. Paste those lines into ALIASES and');
        out('re-run until the section is empty.');
      }
      if (gained.length) {
        out('');
        out('NEWLY RESOLVED (' + gained.length + '):');
        gained.forEach(function (x) { out('   ' + pad(x.f, 32) + '-> ' + x.now); });
      }

      head('6 \u00b7 verdict');
      var blockers = failed + lost.length;
      out('guards failed        ' + failed);
      out('figures losing a record ' + lost.length);
      out('');
      if (!blockers) {
        out('CLEAR. The resolver keeps every known-hard pair apart and no quiz');
        out('figure loses its character. Wire it in:');
        out('');
        out('  amenti-roster.js  \u2014 replace codexFor(figure) with');
        out('                      window.AmentiResolve.record(figure)');
        out('  library.js        \u2014 resolve by key instead of lowercased name');
        out('  Page1 csv-loader  \u2014 dedupe curated vs ledger through resolve()');
        out('                      instead of norm(name)');
        out('');
        out('Change ONE consumer, re-run the probes, then the next.');
      } else {
        out('HOLD. ' + blockers + ' blocker(s) above. Add the alias lines, re-run.');
      }
      out('');
      rule('=');
      out('end \u00b7 nothing was patched \u00b7 window.AmentiResolve is live for testing');
      return L.join('\n');
    });
  }

  function emit(text) {
    try { console.log(text); } catch (e) {}
    var name = 'amenti-resolver-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
    var url = null;
    try {
      url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} }, 100);
    } catch (e) {}
    try {
      var box = document.createElement('div');
      box.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:99999;background:#06080f;'
        + 'border:1px solid #d4a017;border-radius:6px;padding:9px 12px;'
        + 'font:12px/1.5 ui-monospace,Menlo,monospace;color:#f5c542');
      var link = document.createElement('a');
      link.href = url; link.download = name;
      link.textContent = '\u25BC resolver report (.txt)';
      link.setAttribute('style', 'color:#f5c542;text-decoration:none');
      box.appendChild(link);
      var x = document.createElement('span');
      x.textContent = '  \u2715';
      x.setAttribute('style', 'cursor:pointer;opacity:.6');
      x.onclick = function () { box.remove(); };
      box.appendChild(x);
      document.body.appendChild(box);
    } catch (e) {}
    window.AmentiResolve.report = text;
  }

  window.AmentiResolve = {
    version: VERSION,
    build: build,
    resolve: resolve,
    record: record,
    index: function () { return INDEX; },
    records: function () { return RECORDS; },
    collisions: function () { return COLLISIONS; },
    aliases: ALIASES,
    samePerson: SAME_PERSON,
    verify: function () { return verify().then(function (t) { emit(t); return t; }); },
    report: null
  };

  function boot() { setTimeout(function () { verify().then(emit); }, 2500); }
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
