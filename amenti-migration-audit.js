/* ===========================================================================
   amenti-migration-audit.js  ·  Ingram Manor LLC
   THE COMPLETION AUDIT — what did we break that nobody has looked at yet.
   ---------------------------------------------------------------------------
   The earlier probes each asked a question we already suspected. This one goes
   looking where nobody has been, because the migration touched IDENTITY — and
   identity is consumed by surfaces, pages and files that were never part of
   the conversation.

   THE THREE PLACES A REPAIR LIKE THIS HIDES ITS DAMAGE

     1 · OTHER PAGES.  Page1 has been audited to death. The repository also
         holds Page2, Page3, court, docket, game01, quizzard-bridge and
         weighing. Every one of them may load config.js or not, hardcode a
         ledger gid or not, carry its own copy of the character list or not.
         The gid changed tonight. Any page still holding the old one is
         quietly reading a tab that no longer publishes.

     2 · POSITIONAL REFERENCES.  Page1 contains eight hardcoded index arrays
         — chars:[4], chars:[2,6] — and five positional reads of the form
         AMENTI_CHARS[cid]. An index is a promise about ARRAY ORDER, and the
         array was rebuilt tonight: 1,102 rows became 1,000, three twins
         collapsed, engine characters append at the end. If any of those
         indices moved, a timeline era now names the wrong human and NOTHING
         WILL EVER SAY SO.

     3 · THE END OF THE PIPE.  We measured that a quiz can find its character.
         We never measured that a character can find its VOICE — which is the
         whole reason the ledger was defended rather than retired.

   READ-ONLY. Fetches only what a signed-out visitor could fetch. Writes
   nothing, changes nothing, needs no credential. Emits one .txt.

   USE
       <script src="amenti-migration-audit.js"></script>
   or paste into the console on Page1. Either way a report downloads.
   =========================================================================== */
(function () {
  'use strict';

  var T0 = Date.now(), L = [], FIND = [], UNMEASURED = [];
  function out(s) { L.push(s == null ? '' : String(s)); }
  function rule(c) { out(new Array(79).join(c || '-')); }
  function head(n, t) { out(''); rule('='); out(n + ' \u00b7 ' + t.toUpperCase()); rule('='); }
  function pad(s, n) {
    s = String(s == null ? '' : s);
    return s.length >= n ? s.slice(0, Math.max(0, n - 1)) + '\u2026'
                         : s + new Array(n - s.length + 1).join(' ');
  }
  function find(sev, code, line) { FIND.push({ sev: sev, code: code, line: line }); }
  function pct(a, b) { return b ? (Math.round(a / b * 1000) / 10) + '%' : 'n/a'; }
  function syntaxOf(t) { try { new Function(t); return 'ok'; } catch (e) { return 'FAILS: ' + (e.message || e); } }

  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL)
          || 'https://amenti-mint.ingram-ian.workers.dev';
  var CFG_URL = window.AMENTI_CONFIG && window.AMENTI_CONFIG.LEDGER_CSV_URL;
  var CFG_GID = CFG_URL && (CFG_URL.match(/gid=(\d+)/) || [])[1];

  function R(name) { return (name || '').toLowerCase(); }
  function resolve(s) {
    try { return (window.AmentiResolve && window.AmentiResolve.resolve(s)) || null; }
    catch (e) { return null; }
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  /* ── 1 · THE OTHER PAGES ─────────────────────────────────────────── */
  var PAGES = ['Page1.html', 'Page2.html', 'Page3.html', 'court.html', 'docket.html',
               'game01.html', 'quizzard-bridge.html', 'weighing.html',
               'Terminal.html', 'Codex.html'];

  function auditPage(file) {
    return fetch(file + '?cb=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return { file: file, http: r.status, missing: true };
        return r.text().then(function (t) {
          var gids = {}, m, re = /gid=(\d+)/g;
          while ((m = re.exec(t))) gids[m[1]] = (gids[m[1]] || 0) + 1;
          /* TWO WAYS THIS CHECK LIED, BOTH FOUND ON ITS FIRST RUN.

             1 · A <script> MENTIONED INSIDE AN HTML COMMENT. Page1 carries a
                 comment reading "opens and closes its own <script>". The regex
                 took that for an opening tag and captured prose as code. The
                 browser's parser does not: inside <!-- --> nothing is a tag.
                 So comments are stripped before anything is matched.

             2 · SCRIPT BLOCKS THAT ARE NOT JAVASCRIPT. game01 declares an
                 importmap, which is JSON. Compiling it as JS fails by design.
                 Only real script types are checked now.

             Both were reported as BREAK against files that are correct. An
             instrument that cries wolf is worse than no instrument, because
             the next real finding is read as another false one. */
          var stripped = t.replace(/<!--[\s\S]*?-->/g, '');
          var inline = stripped.match(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi) || [];
          var bad = 0, skipped = 0;
          inline.forEach(function (blk) {
            var openTag = (blk.match(/^<script[^>]*>/i) || [''])[0];
            var body = blk.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
            if (!body.trim()) return;
            var ty = (openTag.match(/type\s*=\s*["']?([^"'\s>]+)/i) || [null, ''])[1].toLowerCase();
            if (ty && !/^(text\/javascript|application\/javascript|module)$/.test(ty)) { skipped++; return; }
            if (syntaxOf(body) !== 'ok') bad++;
          });
          return {
            file: file, http: r.status, bytes: t.length,
            config:   /<script[^>]*src=["']config\.js/.test(t),
            resolver: /<script[^>]*src=["']amenti-resolve\.js/.test(t),
            library:  /<script[^>]*src=["']library\.js/.test(t),
            chars:    /window\.AMENTI_CHARS\s*=\s*\[/.test(t),
            gids: Object.keys(gids),
            scripts: (t.match(/<script[^>]*\ssrc=/gi) || []).length,
            inlineBad: bad, inlineTotal: inline.length, inlineSkipped: skipped
          };
        });
      })
      .catch(function (e) { return { file: file, http: '-', error: String(e) }; });
  }

  /* ── 2 · POSITIONAL REFERENCES ───────────────────────────────────── */
  function positional() {
    var html = document.documentElement.outerHTML;
    var chars = window.AMENTI_CHARS || [];
    var hits = [], m, re = /chars\s*:\s*\[([0-9,\s]+)\]/g;
    while ((m = re.exec(html))) {
      var idx = m[1].split(',').map(function (x) { return parseInt(x, 10); })
                    .filter(function (x) { return !isNaN(x); });
      hits.push({ raw: m[0], idx: idx });
    }
    var reads = {}, m2, re2 = /AMENTI_CHARS\[([a-z0-9._]+)\]/gi;
    while ((m2 = re2.exec(html))) reads[m2[1]] = (reads[m2[1]] || 0) + 1;
    return { hits: hits, reads: reads, chars: chars };
  }

  /* ── 3 · THE VOICE JOIN ──────────────────────────────────────────── */
  function voiceJoin(topics, ledgerNames) {
    var byName = {};
    ledgerNames.forEach(function (n) { byName[R(n)] = n; byName['#' + norm(n)] = n; });
    var byKey = {};
    ledgerNames.forEach(function (n) { var k = resolve(n); if (k && !byKey[k]) byKey[k] = n; });

    var figs = {};
    topics.forEach(function (t) {
      var f = t.figure || (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
      if (f) figs[f] = 1;
    });
    var names = Object.keys(figs), direct = [], viaKey = [], neutral = [];
    names.forEach(function (f) {
      if (byName[R(f)] || byName['#' + norm(f)]) { direct.push(f); return; }
      var k = resolve(f);
      if (k && byKey[k]) { viaKey.push({ f: f, row: byKey[k], k: k }); return; }
      neutral.push(f);
    });
    return { names: names, direct: direct, viaKey: viaKey, neutral: neutral };
  }

  /* ── run ─────────────────────────────────────────────────────────── */
  function run() {
    var chars = window.AMENTI_CHARS || [];
    var art = window.AMENTI_SVG || {};
    var artKeys = Object.keys(art).filter(function (k) { return typeof art[k] === 'function'; });
    var libKeys = window.AMENTI_LIBRARY_KEYS || [];

    out('AMENTI \u00b7 MIGRATION COMPLETION AUDIT');
    out('generated  ' + new Date().toISOString());
    out('page       ' + location.href);
    out('');
    out('The earlier probes asked questions we already suspected. This one goes');
    out('looking where nobody has been: the other pages, the positional');
    out('references, and the far end of the pipe.');

    return Promise.all([
      Promise.all(PAGES.map(auditPage)),
      fetch(MINT + '/quiz/topics').then(function (r) { return r.ok ? r.json() : { topics: [] }; })
        .catch(function () { return { topics: [] }; }),
      fetch(MINT + '/characters', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; }),
      CFG_URL ? fetch(CFG_URL, { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; })
                  .catch(function () { return null; })
              : Promise.resolve(null)
    ]).then(function (res) {
      var pages = res[0];
      var topics = (res[1] && res[1].topics) || [];
      var engine = (res[2] && res[2].ok && res[2].characters) || [];
      var csv = res[3];

      /* ============ 1 · THE FLEET, PAGE BY PAGE ============ */
      head('1', 'the other pages \u00b7 seven surfaces nobody audited');
      out('Page1 has been examined all night. These share the same repository,');
      out('the same ledger and the same figures \u2014 and the ledger gid CHANGED');
      out('tonight. A page still holding the old one reads a dead tab in silence.');
      out('');
      out(pad('PAGE', 24) + pad('HTTP', 6) + pad('BYTES', 9) + pad('cfg', 5)
        + pad('rslv', 6) + pad('lib', 5) + pad('CHARS', 7) + 'GID(S) FOUND');
      rule('-');
      var otherGid = [], noCfg = [], inlineChars = [], badInline = [];
      pages.forEach(function (p) {
        if (p.missing) { out(pad(p.file, 24) + pad(p.http, 6) + '(not in this deployment)'); return; }
        if (p.error) { out(pad(p.file, 24) + pad('-', 6) + p.error); return; }
        var g = p.gids.length ? p.gids.join(',') : '\u2014';
        out(pad(p.file, 24) + pad(p.http, 6) + pad(p.bytes, 9)
          + pad(p.config ? 'yes' : 'NO', 5) + pad(p.resolver ? 'yes' : 'no', 6)
          + pad(p.library ? 'yes' : 'no', 5) + pad(p.chars ? 'inline' : '\u2014', 7) + g);
        p.gids.forEach(function (x) { if (CFG_GID && x !== CFG_GID) otherGid.push(p.file + ' \u2192 gid=' + x); });
        if (!p.config && p.gids.length) noCfg.push(p.file);
        if (p.chars) inlineChars.push(p.file);
        if (p.inlineBad) badInline.push(p.file + ' (' + p.inlineBad + ' of ' + p.inlineTotal + ')');
      });
      out('');
      out('config gid in use : ' + (CFG_GID || 'unknown'));
      if (otherGid.length) {
        out('');
        out('*** PAGES POINTING AT A DIFFERENT LEDGER TAB ***');
        otherGid.forEach(function (x) { out('   ' + x); });
        find('BREAK', 'STALE-GID', otherGid.length + ' page(s) reference a gid other than the live one.');
      } else {
        out('\u2713 no page references a gid other than the live one');
      }
      if (noCfg.length) {
        out('');
        out('PAGES WITH A LEDGER URL BUT NO config.js (' + noCfg.length + '):');
        noCfg.forEach(function (x) { out('   ' + x); });
        find('RISK', 'PAGE-NO-CONFIG',
          noCfg.join(', ') + ' hold a ledger address but do not load config.js \u2014 they cannot follow a gid change.');
      }
      if (inlineChars.length) {
        out('');
        out('PAGES CARRYING THEIR OWN INLINE AMENTI_CHARS (' + inlineChars.length + '):');
        inlineChars.forEach(function (x) { out('   ' + x); });
        out('A second declaration of the cast is a second source of truth. If it');
        out('predates tonight it still holds the pre-migration keys.');
        if (inlineChars.length > 1) find('RISK', 'INLINE-CHARS',
          inlineChars.length + ' pages declare AMENTI_CHARS inline.');
      }
      if (badInline.length) {
        out('');
        out('*** PAGES WITH AN INLINE SCRIPT THAT DOES NOT PARSE ***');
        badInline.forEach(function (x) { out('   ' + x); });
        find('BREAK', 'INLINE-SYNTAX', badInline.join('; '));
      }

      /* ============ 2 · POSITIONAL REFERENCES ============ */
      head('2', 'positional references \u00b7 promises about array order');
      out('An index is a promise that the array will not move. The array moved:');
      out('1,102 ledger rows became 1,000, three twins collapsed, and engine');
      out('characters append at the end. These are the places Page1 still points');
      out('by POSITION rather than by key \u2014 and each one now names whoever');
      out('happens to sit there.');
      out('');
      var P = positional();
      out('roster length now : ' + P.chars.length);
      out('');
      if (!P.hits.length) out('no hardcoded index arrays found');
      else {
        out(pad('SOURCE', 20) + pad('IDX', 6) + pad('KEY AT THAT INDEX', 26) + 'NAME');
        rule('-');
        var oob = 0, drift = [];
        P.hits.forEach(function (h) {
          h.idx.forEach(function (i) {
            var c = P.chars[i];
            if (!c) { oob++; out(pad(h.raw, 20) + pad(i, 6) + '*** OUT OF RANGE ***'); return; }
            var rich = !!(c.rich || c.stats);
            out(pad(h.raw, 20) + pad(i, 6) + pad(c.key + (rich ? '' : '  [thin]'), 26) + (c.name || ''));
            if (!rich) drift.push(h.raw + ' \u2192 ' + c.key);
          });
        });
        out('');
        out('Every index above should land on a CURATED figure. mergeCuratedOver');
        out('places the curated set first, so 0..32 are stable by construction \u2014');
        out('but that is a property of the merge, not a guarantee, and nothing');
        out('anywhere enforces it.');
        if (oob) find('BREAK', 'INDEX-OUT-OF-RANGE', oob + ' hardcoded index/indices point past the end of the roster.');
        if (drift.length) find('BREAK', 'INDEX-DRIFT',
          drift.length + ' hardcoded index/indices now land on a thin ledger row: ' + drift.slice(0, 4).join(', '));
        if (!oob && !drift.length) out('\u2713 all hardcoded indices still land on curated figures');
      }
      out('');
      out('POSITIONAL READS IN SOURCE:');
      Object.keys(P.reads).forEach(function (k) {
        out('   AMENTI_CHARS[' + k + ']  \u00d7' + P.reads[k]);
      });
      out('');
      out('Each is a lookup by array position. They work today because ids are');
      out('reassigned to match position on every load \u2014 which is also why an id');
      out('must never be persisted anywhere.');

      /* ============ 3 · IDENTITY ============ */
      head('3', 'identity \u00b7 one person, one record');
      var rich = chars.filter(function (c) { return c && (c.rich || c.stats); });
      out('records        ' + chars.length + '   (' + rich.length + ' rich)');
      out('resolver       ' + (window.AmentiResolve ? '\u2713 live' : '\u2717 NOT LOADED'));
      if (!window.AmentiResolve) {
        find('BREAK', 'RESOLVER-ABSENT', 'window.AmentiResolve is not defined on this page.');
      } else {
        var byKey = {}, dupKey = [];
        chars.forEach(function (c) {
          if (!c || !c.key) return;
          (byKey[c.key] = byKey[c.key] || []).push(c);
        });
        Object.keys(byKey).forEach(function (k) { if (byKey[k].length > 1) dupKey.push(k); });
        out('duplicate KEYS ' + dupKey.length + (dupKey.length ? '  ' + dupKey.slice(0, 8).join(', ') : ''));
        if (dupKey.length) find('BREAK', 'DUPLICATE-KEYS',
          dupKey.length + ' key(s) held by more than one record: ' + dupKey.slice(0, 6).join(', '));

        var byRes = {}, twins = [];
        chars.forEach(function (c) {
          if (!c || !c.name) return;
          var k = resolve(c.name) || resolve(c.key); if (!k) return;
          (byRes[k] = byRes[k] || []).push(c.key);
        });
        Object.keys(byRes).forEach(function (k) { if (byRes[k].length > 1) twins.push(k + ': ' + byRes[k].join(' + ')); });
        out('canonical people ' + Object.keys(byRes).length);
        out('uncollapsed twins ' + twins.length);
        twins.slice(0, 10).forEach(function (t) { out('   ' + t); });
        if (twins.length) find('BREAK', 'TWINS', twins.length + ' person(s) hold more than one record.');
        else out('\u2713 every person holds exactly one record');
      }

      /* ============ 4 · THE VOICE ============ */
      head('4', 'the voice \u00b7 the far end of the pipe');
      out('The ledger was defended rather than retired because it carries gender,');
      out('dialect and voice. We proved a quiz can reach a CHARACTER. This is the');
      out('first measurement that a figure can reach a VOICE.');
      out('');
      if (!csv) {
        out('ledger not readable \u2014 skipped');
        UNMEASURED.push('Voice join \u2014 the ledger CSV did not load.');
      } else {
        var rows = csv.split('\n'), hdr = rows[0].split(','), ni = 1;
        hdr.forEach(function (h, i) { if (/full ?name/i.test(h)) ni = i; });
        var names = [];
        for (var i = 1; i < rows.length; i++) {
          var cells = rows[i].split(',');
          if (cells[ni] && cells[ni].trim()) names.push(cells[ni].trim().replace(/^"|"$/g, ''));
        }
        var V = voiceJoin(topics, names);
        out(pad('OUTCOME', 46) + 'COUNT');
        rule('-');
        out(pad('speaks as themselves \u2014 matched by name', 46) + V.direct.length);
        out(pad('speaks as themselves \u2014 matched by KEY', 46) + V.viaKey.length + '   \u2190 the new path');
        out(pad('falls back to the NEUTRAL voice', 46) + V.neutral.length);
        out(pad('total quiz figures', 46) + V.names.length);
        out('');
        if (V.viaKey.length) {
          out('RESCUED BY THE KEY LOOKUP \u2014 these read in the neutral default before');
          out('library.js learned to resolve:');
          V.viaKey.forEach(function (x) { out('   ' + pad(x.f, 28) + '\u2192 ' + pad(x.k, 22) + 'ledger: ' + x.row); });
          out('');
        }
        if (V.neutral.length) {
          out('STILL NEUTRAL (' + V.neutral.length + ') \u2014 no ledger row reachable:');
          V.neutral.slice(0, 30).forEach(function (f) { out('   ' + f); });
          if (V.neutral.length > 30) out('   (' + (V.neutral.length - 30) + ' more)');
          out('');
          out('Each is a figure who speaks in the house default rather than as');
          out('themselves. Not an error \u2014 but it is the gap, named.');
          find('NOTE', 'NEUTRAL-VOICE',
            V.neutral.length + ' of ' + V.names.length + ' quiz figures have no ledger row and read in the neutral voice.');
        } else {
          out('\u2713 every quiz figure reaches a ledger row');
        }
      }

      /* ============ 5 · ORPHANS ============ */
      head('5', 'orphans \u00b7 things nothing can reach');
      var recKeys = {}; chars.forEach(function (c) { if (c && c.key) recKeys[c.key] = c; });
      var unreachable = artKeys.filter(function (k) { return !recKeys[k]; });
      out('portrait keys        ' + artKeys.length);
      out('with no record       ' + unreachable.length);
      unreachable.slice(0, 20).forEach(function (k) { out('   ' + k); });
      if (unreachable.length) find('RISK', 'ORPHAN-ART',
        unreachable.length + ' portrait(s) are keyed to no record and can never be drawn.');
      out('');
      var suffixed = Object.keys(recKeys).filter(function (k) { return /-\d+$/.test(k); });
      out('keys ending in a COLLISION SUFFIX (-2, -3): ' + suffixed.length);
      suffixed.slice(0, 15).forEach(function (k) { out('   ' + k + '   ' + (recKeys[k].name || '')); });
      out('');
      out('Before the dedupe the ledger produced these by row order. Any that');
      out('survive are keys nothing should ever have persisted.');
      if (suffixed.length) find('RISK', 'SUFFIX-KEYS',
        suffixed.length + ' record(s) still carry an order-dependent -N key.');
      out('');
      var roomOrphan = libKeys.filter(function (k) { return !recKeys[k]; });
      out('reading rooms        ' + libKeys.length + '   with no record: ' + roomOrphan.length);
      roomOrphan.forEach(function (k) { out('   ' + k); });
      if (roomOrphan.length) find('RISK', 'ORPHAN-ROOM', roomOrphan.length + ' reading room(s) resolve to no character.');

      /* ============ 6 · THE ENGINE ============ */
      head('6', 'the engine \u00b7 what it has written');
      out('rows at /characters  ' + engine.length);
      if (engine.length) {
        var shadow = [], selfless = [];
        engine.forEach(function (row) {
          if (!row || !row.key) return;
          var k = resolve(row.name || row.figure || row.key);
          if (!k) { selfless.push(row.key); return; }
          if (k !== row.key && recKeys[k] && (recKeys[k].rich || recKeys[k].stats) && recKeys[row.key]) {
            shadow.push(row.key + ' \u2192 ' + k);
          }
        });
        out('rows whose name resolves nowhere : ' + selfless.length);
        selfless.slice(0, 12).forEach(function (k) { out('   ' + k); });
        out('rows shadowing an existing person: ' + shadow.length);
        shadow.slice(0, 12).forEach(function (k) { out('   ' + k); });
        if (selfless.length) find('RISK', 'ENGINE-UNRESOLVED',
          selfless.length + ' engine character(s) resolve to no canonical key \u2014 their sheets may never be found.');
        if (shadow.length) find('RISK', 'ENGINE-SHADOW',
          shadow.length + ' engine row(s) describe someone who already has a record under another key.');
      } else {
        UNMEASURED.push('/characters returned nothing \u2014 engine rows not audited.');
      }

      /* ============ 7 · THE SURFACES ============ */
      head('7', 'the surfaces \u00b7 did anything stop rendering');
      var S = [
        ['arena cards', '.roster-card'],
        ['cards with a portrait', '.roster-card [data-art="1"], .roster-card .rc-img svg'],
        ['cards with stat bars', '.roster-card .rc-attrs'],
        ['codex rows', '#cdx-list > *, .cdx-row'],
        ['browse tiles', '#brw-grid > *'],
        ['timeline entries', '.tl-item, .timeline-item, [data-era]'],
        ['counsel options', '#counsel-select option, .counsel-opt'],
        ['hero slides', '.char-slide']
      ];
      out(pad('SURFACE', 30) + 'COUNT');
      rule('-');
      S.forEach(function (s) {
        var n = 0; try { n = document.querySelectorAll(s[1]).length; } catch (e) {}
        out(pad(s[0], 30) + n);
      });
      var cards = document.querySelectorAll('.roster-card').length;
      var withArt = document.querySelectorAll('.roster-card[data-art="1"]').length;
      var withBars = document.querySelectorAll('.roster-card .rc-attrs').length;
      out('');
      out('face but no reading : ' + Math.max(0, withArt - withBars));
      if (cards && withArt === 0) find('BREAK', 'NO-PORTRAITS',
        cards + ' cards rendered and not one carries a portrait \u2014 the resolver or the art library is not reaching them.');

      /* ============ 8 · THE JOIN ============ */
      head('8', 'the join \u00b7 quiz to character, once more');
      var figs = {};
      topics.forEach(function (t) {
        var f = t.figure || (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
        if (f) (figs[f] = figs[f] || []).push(t.id || t.topic_id);
      });
      var fn = Object.keys(figs), hit = 0, miss = [];
      fn.forEach(function (f) { var k = resolve(f); if (k) hit++; else miss.push(f); });
      out('quizzes            ' + topics.length);
      out('distinct figures   ' + fn.length);
      out('resolve to a key   ' + hit + '  (' + pct(hit, fn.length) + ')');
      if (miss.length) {
        out('');
        out('NO CANONICAL KEY (' + miss.length + '):');
        miss.forEach(function (f) { out('   ' + f + '   [' + figs[f].join(', ') + ']'); });
        find('BREAK', 'UNRESOLVED-FIGURE', miss.length + ' quiz figure(s) resolve to nothing.');
      } else out('\u2713 every quiz figure resolves');

      /* ============ 9 · FINDINGS ============ */
      head('9', 'findings');
      var order = { BREAK: 0, RISK: 1, NOTE: 2 };
      FIND.sort(function (a, b) { return order[a.sev] - order[b.sev]; });
      if (!FIND.length) out('none.');
      FIND.forEach(function (f, i) {
        out(pad((i + 1) + '.', 4) + pad(f.sev, 7) + pad(f.code, 24) + f.line);
      });
      out('');
      out('UNMEASURED:');
      if (!UNMEASURED.length) out('  (nothing)');
      UNMEASURED.forEach(function (u) { out('  \u00b7 ' + u); });
      out('');
      out('STILL NEEDS THE ADMIN SECRET:');
      out('  select figure_name, count(*) from quizzard_queue group by 1 having count(*) > 1;');
      out('  The queue was seeded from a ledger that held 94 duplicated people.');

      /* ============ 10 · VERDICT ============ */
      head('10', 'verdict');
      var br = FIND.filter(function (f) { return f.sev === 'BREAK'; }).length;
      var rk = FIND.filter(function (f) { return f.sev === 'RISK'; }).length;
      out(br + ' BREAK \u00b7 ' + rk + ' RISK \u00b7 ' + UNMEASURED.length + ' unmeasured');
      out('');
      if (!br) {
        out('MIGRATION COMPLETE as far as this instrument can see. One name, one');
        out('person, one table \u2014 across every page, every surface, and the far');
        out('end of the pipe.');
      } else {
        out('NOT DONE. The BREAK lines above are the part of the migration that');
        out('was never in the conversation, which is exactly where a repair of');
        out('this kind leaves its damage.');
      }
      out('');
      rule('=');
      out('end \u00b7 nothing was written \u00b7 ' + (Date.now() - T0) + 'ms');
      return L.join('\n');
    });
  }

  function emit(text) {
    try { console.log(text); } catch (e) {}
    var name = 'amenti-migration-audit-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
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
      link.textContent = '\u25BC migration audit (.txt)';
      link.setAttribute('style', 'color:#f5c542;text-decoration:none');
      box.appendChild(link);
      var x = document.createElement('span');
      x.textContent = '  \u2715';
      x.setAttribute('style', 'cursor:pointer;opacity:.6');
      x.onclick = function () { box.remove(); };
      box.appendChild(x);
      document.body.appendChild(box);
    } catch (e) {}
    window.AmentiMigrationAudit.text = text;
  }

  window.AmentiMigrationAudit = {
    run: function () { L = []; FIND = []; UNMEASURED = []; return run().then(function (t) { emit(t); return t; }); },
    text: null
  };

  function boot() {
    setTimeout(function () {
      run().then(emit, function (e) {
        out(''); out('AUDIT ERROR: ' + (e && e.stack || e)); emit(L.join('\n'));
      });
    }, 3000);
  }
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
