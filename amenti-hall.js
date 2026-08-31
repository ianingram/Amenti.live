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

  /* Slices disabled for launch. The proxy enforces SYSTEM_CHARS = 20000 by
     policy (Amenti-Workers), with a standing order in the captain's hand: "If
     a surface 413s here, CHUNK THE SURFACE. Do not raise this." These limits
     are scar tissue from a real $118 input-overrun. HALL.md + counts +
     catalogue + two 6 KB slices was ~24000 chars and 413'd on 24 Aug. The hall
     obeys the order: it CITES every brief from the catalogue and points; it
     does not quote. To restore quoting, do NOT raise the wall — send ONE short
     slice (<= ~2000 chars) only when a question needs it, staying under 20000.
     Set MAX_BRIEFS to 1 and BRIEF_SLICE to ~2000 for that; never 2 x 6000. */
  var MAX_BRIEFS   = 0;
  var BRIEF_SLICE  = 6000;
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

  /* ── THE DOORS ────────────────────────────────────────────────────────────
     WHAT THIS REPLACED, AND WHY, so the change is not undone by someone who
     only sees what was lost.

     Until 31 Aug this function emitted EVERY document, one line each. That was
     right, and for a reason worth keeping: a retrieval pass can miss and never
     say it missed, so the hall declared the lot and nothing could be invisible.

     It stopped being possible. The catalogue grew 106 documents -> 191 and the
     prompt reached 24,138 against the proxy's SYSTEM_CHARS of 20,000, which the
     Worker refuses with system_too_long — a 413, not a shorter answer. THE HALL
     WAS SILENT ON EVERY QUESTION. And trimming does not reach it: the box must
     also carry 550 works and 1,011 souls, and 1,751 entries overrun the wall
     THREE TIMES OVER with every description deleted.

     So the hall now declares DOORS, not leaves. Eight sections and fifty-two
     rooms, ~5,900 chars, and it barely grows — a new work adds no room and a
     new brief adds no section.

     WHAT IS LOST, STATED PLAINLY: the hall knows the SHAPE of the corpus, not
     the individual documents. It can say what the briefs section holds; it
     cannot name the one brief. That is a real regression and it is temporary —
     it is answered by opening what is behind a door, which is the next move and
     is NOT in this change. Until then the hall must say so rather than guess,
     which is why rule 3 below now tells it exactly that.

     THE PRINCIPLE IS UNCHANGED. Nothing is missed in silence: the doors cover
     the whole corpus, and what is not opened is declared as not opened.
     ────────────────────────────────────────────────────────────────────────── */

  /* Up to three section titles per room. They cost 3,444 chars over a bare
     name-and-count list and they are the entire point: a question about
     betrayal reaches Brutus through "The overthrow", not through the word
     "Brutus". find() already matches names for free — this is the reach that
     free pass does not have. */
  var ROOM_SECTIONS = 3;

  function doorsText(items, library) {
    var p = [];

    /* ── the architecture: 8 sections, counted from the register ── */
    var secs = {};
    items.forEach(function (i) {
      if (i.unreachable) return;
      secs[i.section] = (secs[i.section] || 0) + 1;
    });
    p.push('-- THE ARCHITECTURE: ' + Object.keys(secs).length + ' sections --');
    Object.keys(secs).forEach(function (name) {
      p.push('\u00b7 ' + name + ' \u2014 ' + secs[name] + ' documents');
    });

    /* ── the library: 52 rooms, one per figure ── */
    if (library && library.rooms && library.rooms.length) {
      p.push('');
      p.push('-- THE LIBRARY: ' + library.rooms.length + ' rooms, ' +
             ((library.totals && library.totals.totalWorksPresent) || '?') + ' works --');
      library.rooms.forEach(function (rm) {
        var titles = [];
        (rm.works || []).forEach(function (w) {
          if (w.section && titles.indexOf(w.section) === -1) titles.push(w.section);
        });
        p.push('\u00b7 ' + rm.key + ' \u2014 ' + rm.name + ', ' +
               rm.worksPresent + ' works' +
               (titles.length ? ': ' + titles.slice(0, ROOM_SECTIONS).join('; ') : ''));
      });
    } else {
      p.push('');
      p.push('-- THE LIBRARY could not be read this turn. Do not describe it. --');
    }

    return p.join('\n');
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

  /* Ids are hyphenated (BRIEF-ASK-AMENTI) and glosses are punctuated, so a raw
     phrase match can never cross either — 'ask amenti' missed BRIEF-ASK-AMENTI
     for that reason alone. Fold both sides to plain words before comparing. */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ONE WORD BEHAVES EXACTLY AS BEFORE. The 24 Aug find('caesar') reading must
     not move, so the token pass runs only on multi-word input and only when the
     phrase itself found nothing. Every token must appear (AND), so 'spell
     emerald' still returns nothing rather than everything. Token scores sit
     just under their phrase equivalents (110 < 120, 8 < 10), so a real phrase
     hit always outranks a scattered one. Tested old-vs-new across 18 queries:
     every difference was a ZERO becoming a hit; nothing that worked changed. */
  function find(fragment, items, souls) {
    var q = String(fragment || '').trim().toLowerCase();
    if (!q) return [];
    var toks  = norm(q).split(' ').filter(function (t) { return t.length > 1; });
    var multi = toks.length > 1;
    var out   = [];

    (souls || []).forEach(function (s) {
      var sc = scoreSoul(s, q);
      if (!sc && multi) {
        var hay = norm(s.n + ' ' + s.k + ' ' + (s.t || '') + ' ' + (s.keys || []).join(' '));
        if (toks.every(function (t) { return hay.indexOf(t) > -1; })) sc = 110;
      }
      if (sc) out.push({ s: sc, r: {
        kind: 'soul', id: s.k, name: s.n, what: s.t || '',
        hasPlate: !!s.p, hasRoom: !!s.r
      } });
    });

    (items || []).forEach(function (i) {
      var sc = score(i, q);
      if (!sc && multi) {
        var hay2 = norm(i.id + ' ' + i.what);
        if (toks.every(function (t) { return hay2.indexOf(t) > -1; })) sc = 8;
      }
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
    /* 'whom' was the 26 Aug bug: the engine matched 'who', then required a
       word boundary before the 'm' and failed, and no other alternative fit.
       With no '?' and only three words, all three gates failed and the box
       searched instead of asking — printing "nothing aboard matches" for a
       question HALL.md answers directly. Every phrasing below was run before
       this line was written; a bare name ('caesar') still routes to search. */
    if (/^(who|whom|whos|what|whats|why|how|where|which|when|is|are|was|were|does|do|did|can|could|should|would|tell|explain|name)\b/i.test(t)) return true;
    return t.split(/\s+/).length > 6;
  }

  /* ── the prompt ───────────────────────────────────────────────────────── */

  function buildSystem(hall, state, catalogue, slices, degraded) {
    var p = [];

    /* The box's own ruling: "hall.html is the home; the others are contingencies,
       not plans." It mounts to #hall-main. This line said "the arena page" until
       31 Aug and was simply wrong about where the visitor was standing. */
    p.push('You are the hall of Amenti answering a visitor who has typed a question into ASK AMENTI in the hall.');
    p.push('You are NOT a figure. You do not have a historical persona. You speak for the building.');
    p.push('');
    p.push('=== WHAT AMENTI IS (authored — this is your meaning) ===');
    p.push(hall || '[HALL.md could not be read. Say so. Do NOT describe Amenti from your own training — you would be inventing a project that is not this one.]');
    p.push('');
    p.push('=== THE COUNTS, READ THIS HOUR (the only numbers you may state) ===');
    p.push(state ? JSON.stringify(state, null, 1) : '[HALL-STATE.json could not be read. State NO numbers at all. Say the counts could not be read.]');
    p.push('');
    p.push('=== EVERY DOOR THAT EXISTS (nothing aboard is outside this list) ===');
    p.push('These are SECTIONS and ROOMS, not individual documents. The list is complete: every document belongs to one of these sections and every work to one of these rooms.');
    p.push(catalogue || '[the doors could not be read]');

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
    p.push('3. Cite only the sections and rooms named above. NEVER name an individual document or work — you have not been shown them and you would be inventing the name. If nothing aboard covers the question, say plainly that nothing aboard does.');
    p.push('3a. YOU CAN SEE THE DOORS, NOT WHAT IS BEHIND THEM. You know a section exists and how many documents it holds; you do not know their titles. Say which door the answer is behind and that the visitor can search it from this box. Do not guess at a document name from a section name — a confident wrong title is worse than an honest door.');
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

  /* ── the reader's door to a cited document ────────────────────────────── */

  /* The catalogue holds repo-relative paths for RAW fetching. A reader needs
     the Pages URL, which is the same path with the branch removed:
       Amenti-Technical-Briefs/main/X.html
       -> https://ianingram.github.io/Amenti-Technical-Briefs/X.html
     Verified against the live Separation-of-Power link already in hall.html.
     Confirmed 26 Aug that .md serves RAW there — Jekyll is not converting, so
     a .md path is a real address and not a redirect to a .html twin.

     LINK ONLY WHAT A READER CAN READ. .js/.mjs/.json/.csv are source and
     registers; handing someone a scraper is not a citation.

     SERVED is a whitelist, not a guess. Both repos below have been seen to
     serve. Fleet-Documents and Gameroom0.0 also appear in the catalogue and
     are NOT listed — their Pages status is unconfirmed, and an unchecked repo
     yields a plain citation rather than a 404 in a reader's face. Add them
     here once someone has opened one. */
  var PAGES    = 'https://ianingram.github.io/';
  var SERVED   = { 'Amenti-Technical-Briefs': 1, 'Amenti.live': 1 };
  var READABLE = /\.(html|pdf|md)$/i;

  function docUrl(path) {
    if (!path || !READABLE.test(path)) return null;
    var bits = String(path).split('/');
    var repo = bits.shift();
    if (!SERVED[repo]) return null;
    bits.shift();                       // the branch segment
    if (!bits.length) return null;
    /* At least one path in the register carries a space ("The Siege.html").
       Encode each segment, never the whole string, or the slashes go too. */
    return PAGES + repo + '/' + bits.map(encodeURIComponent).join('/');
  }

  /* A citation is only worth linking if the id could not be an ordinary word.
     Twelve linkable ids are single bare words — hall, glossary, pipeline,
     prologue, reader, readme, todo — and linking those turns any sentence
     containing them into a false citation. Caught on 26 Aug when a test render
     of a real answer linked the word "hall" in "the machines this hall runs
     on". Require a hyphen, underscore or dot: a compound id is a name, a bare
     word is English. */
  function linkable(id) {
    return /[-_.]/.test(String(id || ''));
  }

  /* id -> url, for every DOCUMENT a reader could actually open.

     UNCHANGED BY THE DOORS, DELIBERATELY. This map is never sent to the model —
     147 urls overran SYSTEM_CHARS on their own — so it costs no prompt budget
     and keeping all 191 is free insurance: if a document id ever reaches the
     answer, it still resolves to a door.

     ROOMS ARE NOT IN HERE AND MUST NOT BE FAKED IN. library.js is an overlay
     renderer — "it is NOT a page itself and is never visited directly" — so a
     room has no URL to link to. It opens via Amenti.openReadingRoom(key) from a
     page that has loaded library.js, which hall.html does not. A room citation
     is therefore plain text in this pass, on the rule that a citation you
     cannot open is half a citation but a link that 404s is worse. The reading
     room is opened properly in the move that opens the doors. */
  function linkMap(items) {
    var m = {};
    (items || []).forEach(function (i) {
      if (i.unreachable || !linkable(i.id)) return;
      var u = docUrl(i.path);
      if (u) m[i.id] = u;
    });
    return m;
  }

  /* ── ask ──────────────────────────────────────────────────────────────── */

  function ask(question) {
    if (!window.claude || typeof window.claude.complete !== 'function')
      return Promise.reject(new Error('window.claude.complete is not present. The hall speaks through the one door and the door is missing.'));

    var degraded = [];

    return Promise.all([
      attempt('HALL.md',        get(RAW + 'HALL.md', false)),
      attempt('HALL-STATE.json', get(RAW + 'HALL-STATE.json', true)),
      attempt('SOURCES.json',   get(RAW + 'SOURCES.json', true)),
      /* The rooms. A fourth read, and it degrades like the others rather than
         failing the answer — doorsText says the library could not be read and
         the hall tells the visitor, which is better than a hall that silently
         forgets it has a library. */
      attempt('LIBRARY.json',   get(RAW + 'LIBRARY.json', true))
    ]).then(function (r) {
      var hall  = r[0].ok ? r[0].value : null;
      var state = r[1].ok ? r[1].value : null;
      var src   = r[2].ok ? r[2].value : null;
      var lib   = r[3].ok ? r[3].value : null;

      r.forEach(function (x) { if (!x.ok) degraded.push(x.name + ' — ' + x.error); });

      var items = src ? flatten(src.sources) : [];
      var cat   = doorsText(items, lib);
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
            /* The URLs are NOT sent to the model — 147 of them overruns
               SYSTEM_CHARS on their own (measured: 20,532 with HALL.md, wall
               is 20,000). The hall cites by id and the surface resolves the
               id to a door afterwards, which also means a link can only ever
               point at something the register knows. */
            links: linkMap(items),
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
