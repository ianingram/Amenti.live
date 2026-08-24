/* ============================================================================
   amenti-hall.js  ·  ASK AMENTI — THE ANSWER PATH
   ----------------------------------------------------------------------------
   Step 3 of BRIEF-ASK-AMENTI (revision B). NO UI. One function that takes a
   question and returns an answer with citations.

     window.AmentiHall.ask('what is a spell?')
       -> { answer, cited, counts, sources, degraded }

     window.AmentiHall.find('caesar')          // fragment search, no model call
       -> [ {kind:'soul'|'doc', id, what, path}, ... ]

   ── WHY THIS IS NOT A SECOND CHAT ENGINE ──────────────────────────────────
   It calls window.claude.complete, the one door, exactly as amenti-chat.js
   does. Different system prompt, different sources, same plumbing. Every
   duplicated path in this system has cost a night somewhere — two roster
   loaders, two engines, a name changed on a wrong inference.

   ── WHERE AN ANSWER COMES FROM ────────────────────────────────────────────
     MEANING   HALL.md          authored. What Amenti IS. Holds NO numbers.
     FACTS     HALL-STATE.json  a probe's counts. Every number comes from here.
     THE MAP   SOURCES.json     all 106 documents. ~4,000 tokens — the WHOLE
                                catalogue goes in, so there is no retrieval
                                pass to tune and none to fail quietly.
     DEPTH     up to 2 briefs   fetched live, only when the question needs one.
     SOULS     ROSTER-INDEX.json  1,011 names, 57 KB. SEARCH ONLY — it is never
                                  sent to the model. Read 24 Aug: searching the
                                  document catalogue alone, find('caesar')
                                  returned ZERO. A search over the documents is
                                  not a search over the library.

   A retrieval pass can miss the right brief and never say it missed. The whole
   catalogue cannot miss.

   ── EMPTY GLASS ───────────────────────────────────────────────────────────
   Every source that fails to load is named in `degraded` AND told to the model,
   which is instructed to say so. A hall that answers confidently from nothing
   is the Silent Signature with a friendlier face.

   ── THE CACHE TRAP, READ 23 AUGUST ────────────────────────────────────────
   raw.githubusercontent.com serves through a CDN that caches for minutes. A
   fetch taken after a commit returns OLD bytes with a 200 and nothing to say
   it is stale. It produced three false readings in one session. Every fetch
   here is cache-busted.
   ========================================================================== */

(function () {
  'use strict';

  var RAW  = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var BUST = function () { return '?_=' + Date.now() + '-' + Math.random().toString(36).slice(2); };

  var MAX_BRIEFS   = 2;      // fetched per answer. They run 20-30 KB.
  var BRIEF_SLICE  = 6000;   // chars taken from each
  var CACHE_MS     = 5 * 60 * 1000;

  var cache = {};            // url -> { at, body }

  /* ── fetching ─────────────────────────────────────────────────────────── */

  function get(url, asJson) {
    var hit = cache[url];
    if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.body);
    return fetch(url + BUST(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return asJson ? r.json() : r.text();
    }).then(function (body) {
      cache[url] = { at: Date.now(), body: body };
      return body;
    });
  }

  /* A source that fails is NAMED, never silently skipped. */
  function attempt(name, p) {
    return p.then(
      function (v) { return { name: name, ok: true,  value: v }; },
      function (e) { return { name: name, ok: false, error: String(e.message || e) }; }
    );
  }

  /* ── the catalogue ────────────────────────────────────────────────────── */

  function flatten(sources) {
    var out = [];
    Object.keys(sources || {}).forEach(function (section) {
      (sources[section] || []).forEach(function (it) {
        out.push({
          id: it.id, section: section, what: it.what || '',
          path: it.path, authority: it.authority || '',
          unreachable: it.unreachable || null
        });
      });
    });
    return out;
  }

  /* Every document, one line each. ~4,000 tokens for the lot. */
  function catalogueText(items) {
    return items.filter(function (i) { return !i.unreachable; })
      .map(function (i) { return '· ' + i.id + ' — ' + i.what; })
      .join('\n');
  }

  /* ── fragment search · no model call, no cost ─────────────────────────── */

  function score(item, q) {
    var hay = (item.id + ' ' + item.what).toLowerCase();
    if (item.id && item.id.toLowerCase() === q) return 100;
    if (hay.indexOf(q) === -1) return 0;
    return (item.id || '').toLowerCase().indexOf(q) > -1 ? 40 : 10;
  }

  /* A soul outranks a document. Somebody typing a name wants the figure. */
  function scoreSoul(s, q) {
    var n = s.n.toLowerCase();
    if (n === q || s.k === q) return 200;
    if ((s.keys || []).indexOf(q) > -1) return 190;
    if (n.indexOf(q) === 0 || s.k.indexOf(q) === 0) return 150;
    if (n.indexOf(q) > -1) return 120;
    return 0;
  }

  function find(fragment, items, souls) {
    var q = String(fragment || '').trim().toLowerCase();
    if (!q) return [];
    var out = [];

    (souls || []).forEach(function (s) {
      var sc = scoreSoul(s, q);
      if (sc) out.push({ s: sc, r: {
        kind: 'soul', id: s.k, name: s.n, what: s.t || '',
        hasPlate: !!s.p, hasRoom: !!s.r
      } });
    });

    (items || []).forEach(function (i) {
      var sc = score(i, q);
      if (sc) out.push({ s: sc, r: {
        kind: 'doc', id: i.id, what: i.what, path: i.path, section: i.section
      } });
    });

    return out.sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12).map(function (x) { return x.r; });
  }

  /* ── is it a question? ────────────────────────────────────────────────── */

  function isQuestion(text) {
    var t = String(text || '').trim();
    if (!t) return false;
    if (/\?\s*$/.test(t)) return true;
    if (/^(who|what|why|how|where|which|when|is|are|does|do|can|should|tell)\b/i.test(t)) return true;
    return t.split(/\s+/).length > 6;
  }

  /* ── the prompt ───────────────────────────────────────────────────────── */

  function buildSystem(hall, state, catalogue, slices, degraded) {
    var p = [];

    p.push('You are the hall of Amenti answering a visitor who has typed a question into ASK AMENTI on the arena page.');
    p.push('You are NOT a figure. You do not have a historical persona. You speak for the building.');
    p.push('');
    p.push('=== WHAT AMENTI IS (authored — this is your meaning) ===');
    p.push(hall || '[HALL.md could not be read. Say so. Do NOT describe Amenti from your own training — you would be inventing a project that is not this one.]');
    p.push('');
    p.push('=== THE COUNTS, READ THIS HOUR (the only numbers you may state) ===');
    p.push(state ? JSON.stringify(state, null, 1) : '[HALL-STATE.json could not be read. State NO numbers at all. Say the counts could not be read.]');
    p.push('');
    p.push('=== EVERY DOCUMENT THAT EXISTS (cite by name from this list only) ===');
    p.push(catalogue || '[the catalogue could not be read]');

    if (slices && slices.length) {
      p.push('');
      p.push('=== PASSAGES FETCHED FOR THIS QUESTION ===');
      slices.forEach(function (s) {
        p.push('--- ' + s.id + ' (' + s.path + ') ---');
        p.push(s.text);
      });
    }

    if (degraded && degraded.length) {
      p.push('');
      p.push('=== COULD NOT BE READ THIS TURN ===');
      p.push(degraded.join('\n'));
      p.push('You MUST tell the visitor which of these could not be read, in one short sentence, rather than answering as though it had been.');
    }

    p.push('');
    p.push('=== HOW TO ANSWER ===');
    p.push('1. ANSWER FIRST, THEN POINT. Do not make the visitor read four briefs to learn what a spell is. Tell them, then name where the whole argument lives.');
    p.push('2. Every number you state comes from THE COUNTS above. If it is not there, do not state it.');
    p.push('3. Cite only documents in the catalogue above, by their plain title. Never invent one. If nothing aboard covers the question, say plainly that nothing aboard does.');
    p.push('4. Be brief. Two or three short paragraphs. This is a doorway, not a lecture.');
    p.push('5. Do not speculate about unbuilt things. Unbuilt is not "coming soon".');
    p.push('6. Amenti-Workers and Admin are private. Their existence is public; their contents are not.');
    p.push('7. Never state costs, tokens, credentials or provider accounts.');
    p.push('8. The figures are the thing; you are the doorway. Asked what a particular soul thought or felt, do not summarise them — say they can be asked directly.');
    p.push('9. Refuse as yourself, in your own voice. A refusal is a character move, not a system notice.');

    return p.join('\n');
  }

  /* ── choosing what to fetch in full ───────────────────────────────────── */

  function pickBriefs(question, items) {
    var stop = /^(what|who|why|how|where|which|when|is|are|the|a|an|of|to|in|on|and|or|does|do|it|its|this|that|for|about|amenti)$/i;
    var words = String(question).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/).filter(function (w) { return w.length > 2 && !stop.test(w); });
    if (!words.length) return [];
    return items.map(function (i) {
      var hay = (i.id + ' ' + i.what).toLowerCase();
      var n = 0;
      words.forEach(function (w) { if (hay.indexOf(w) > -1) n++; });
      return { i: i, n: n };
    }).filter(function (x) { return x.n > 0 && x.i.path && !x.i.unreachable; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, MAX_BRIEFS)
      .map(function (x) { return x.i; });
  }

  function stripMarkup(s) {
    return String(s)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ── ask ──────────────────────────────────────────────────────────────── */

  function ask(question) {
    if (!window.claude || typeof window.claude.complete !== 'function')
      return Promise.reject(new Error('window.claude.complete is not present. The hall speaks through the one door and the door is missing.'));

    var degraded = [];

    return Promise.all([
      attempt('HALL.md',        get(RAW + 'HALL.md', false)),
      attempt('HALL-STATE.json', get(RAW + 'HALL-STATE.json', true)),
      attempt('SOURCES.json',   get(RAW + 'SOURCES.json', true))
    ]).then(function (r) {
      var hall  = r[0].ok ? r[0].value : null;
      var state = r[1].ok ? r[1].value : null;
      var src   = r[2].ok ? r[2].value : null;

      r.forEach(function (x) { if (!x.ok) degraded.push(x.name + ' — ' + x.error); });

      var items = src ? flatten(src.sources) : [];
      var cat   = catalogueText(items);
      var picks = items.length ? pickBriefs(question, items) : [];

      return Promise.all(picks.map(function (p) {
        return attempt(p.id, get('https://raw.githubusercontent.com/ianingram/' + p.path, false));
      })).then(function (fetched) {
        var slices = [];
        fetched.forEach(function (f, n) {
          if (f.ok) slices.push({ id: picks[n].id, path: picks[n].path, text: stripMarkup(f.value).slice(0, BRIEF_SLICE) });
          else degraded.push(picks[n].id + ' — ' + f.error);
        });

        var system = buildSystem(hall, state, cat, slices, degraded);

        return window.claude.complete({
          system: system,
          messages: [{ role: 'user', content: String(question) }]
        }).then(function (answer) {
          return {
            answer: answer,
            cited: slices.map(function (s) { return s.id; }),
            counts: state,
            sources: items.length,
            degraded: degraded
          };
        });
      });
    });
  }

  window.AmentiHall = {
    ask: ask,

    /* Both halves. The roster is optional — if ROSTER-INDEX.json is absent the
       search still works over documents and says so, rather than silently
       returning nothing for every figure name typed into it. */
    find: function (fragment) {
      return Promise.all([
        attempt('SOURCES.json',      get(RAW + 'SOURCES.json', true)),
        attempt('ROSTER-INDEX.json', get(RAW + 'ROSTER-INDEX.json', true))
      ]).then(function (r) {
        var items = r[0].ok ? flatten(r[0].value.sources) : [];
        var souls = r[1].ok ? (r[1].value.souls || []) : [];
        var out = find(fragment, items, souls);
        if (!r[1].ok) out.degraded = 'the roster could not be read — figures are not in these results';
        if (!r[0].ok) out.degraded = (out.degraded ? out.degraded + '; ' : '') + 'the document index could not be read';
        return out;
      });
    },

    isQuestion: isQuestion,
    _flatten: flatten,
    _pickBriefs: pickBriefs
  };
})();
