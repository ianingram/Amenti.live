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
  var SECTION_IDS   = 4;

  /* ── THE NAV · added 1 Sep ────────────────────────────────────────────────
     THE HALL KNEW THE REGISTER AND NOT THE ROOM IT STOOD IN.

     Asked where the timeline is, it correctly named Page2 from the register,
     then sent the visitor to "the Harbor" — which is a different repo, on a
     branch, behind a fleet-nav.js that 404s. Meanwhile the real door was one
     word to the right of the box they had just typed into: the flagship nav
     runs ARENA · ASK AMENTI · INTERFACE, and INTERFACE *is* Page2.

     The register describes FILES. It does not describe the SITE — what the
     doors are called, which page a visitor is standing on, what sits beside
     it. So the hall reasoned correctly from what it had and produced a
     slightly ridiculous answer.

     Eleven labels and where each goes, ~600 chars, read out of Page1.html by
     hand on 1 Sep. AUTHORED, THEREFORE IT CAN GO STALE — the same fault as
     Page2's gloss, which said "microphone" for months after the helix was
     built. Whoever changes the nav must change this. A probe that reads the
     <a class="mn-*"> tags and the tab labels straight from Page1 would end
     that risk and is the right eventual answer. */
  var NAV = [
    'ARENA \u2014 the flagship itself, Page1.html: the deck of figures, and the tabs below live on it',
    'ASK AMENTI \u2014 hall.html, this box, where you are now',
    'INTERFACE \u2014 Page2.html. THE SHIP\u2019S TIMELINE lives here: the helix views, sovereigns and events on two strands. It sits DIRECTLY BESIDE Ask Amenti in the bar above',
    'CODEX \u2014 a tab on the flagship, Page1.html#codex',
    'BROWSE \u2014 a tab on the flagship, Page1.html#timeline. Browse the library by order: choose a glyph, find a figure, open the dossier. ITS ADDRESS SAYS timeline AND IT IS NOT ONE \u2014 that is a leftover name. The timeline is INTERFACE.',
    'TERMINAL \u2014 a tab on the flagship, Page1.html#terminal, where a figure is spoken to directly',
    'COUNSEL \u2014 a tab on the flagship, Page1.html#counsel',
    'BOOK STORE \u2014 a tab on the flagship, Page1.html#bookstore',
    'MARKETPLACE \u2014 in the bar on the flagship; no separate address was found for it',
    'GAMEROOM \u2014 game01.html',
    'COURT \u2014 court.html'
  ].join('\n');

  /* `bare` drops the section titles and the example ids. THEY ARE FOR THE
     ROUTER: three titles per room are what let "betrayal" reach Brutus through
     "The overthrow", and that leap happens in call one. When call two carries
     the doors it is only so the hall can NAME the nearest rooms after finding
     nothing — and a name is enough for that. The rich form costs 3,444 chars
     more, which is the difference between the worst shape fitting comfortably
     and sitting in the warning band. Pay for reach where reach happens. */
  function doorsText(items, library, bare) {
    var p = [];

    /* ── the architecture: 8 sections, counted from the register ── */
    var secs = {};
    items.forEach(function (i) {
      if (i.unreachable) return;
      secs[i.section] = (secs[i.section] || 0) + 1;
    });
    p.push('-- THE ARCHITECTURE: ' + Object.keys(secs).length + ' sections --');
    /* FOUND LIVE, 31 Aug. These lines used to be a name and a count — "the
       surfaces — 10 documents" — and nothing else. Asked whether the site has
       a timeline, the router could not tell that the answer sits behind that
       door, so it reached for figures' rooms instead and the hall replied that
       there is no timeline. There is: Page2 carries a double helix of
       sovereigns and events.
       Every LIBRARY room shows three of its section titles, which is exactly
       why "betrayal" finds Brutus through "The overthrow". The ship's doors had
       no such substance. They do now — a few ids apiece, drawn from the
       register, no authoring required and none to fall stale. */
    Object.keys(secs).forEach(function (name) {
      var ids = items.filter(function (i) { return !i.unreachable && i.section === name; })
        .slice(0, SECTION_IDS).map(function (i) { return i.id; });
      p.push('\u00b7 ' + name + ' \u2014 ' + secs[name] + ' documents' +
             (!bare && ids.length ? ', e.g. ' + ids.join(', ') : ''));
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
               (!bare && titles.length ? ': ' + titles.slice(0, ROOM_SECTIONS).join('; ') : ''));
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

  /* ── LINKABLE BY MEMBERSHIP, NOT BY SHAPE ─────────────────────────────────
     This required a hyphen, underscore or dot: "a compound id is a name, a bare
     word is English." It was written on 26 Aug after a test render linked the
     word "hall" inside "the machines this hall runs on", and it was the right
     fix for the question it was asked.

     IT SILENTLY DROPPED `page2`. Asked on 1 Sep whether the site has a timeline,
     the hall answered correctly from the register and named Page2 — and the
     citation was dead text, because a bare word can never be linked and the id
     has no punctuation in it. The same rule drops `brutus`, `apollo`, `moses`
     and every other single-word room key.

     §4b OF THE BRIEF SETTLED THIS AS "MEMBERSHIP, NOT SHAPE" AND CALLED THAT
     STRICTLY SAFER. IT IS NOT, AND ATTACKING IT PROVED SO IN ONE LINE: `hall`,
     `glossary`, `reader`, `readme`, `todo`, `pipeline` and `prologue` ARE all
     genuine ids in the register, so membership admits every one of them and
     the 26 Aug fault walks back in through the front door. A settled decision
     is still only as good as the run that tests it.

     SO: BOTH CONDITIONS. The id must be in the register AND must not look like
     an ordinary English word. Of the 51 bare ids aboard, every one worth
     linking carries a DIGIT — page1, page2, page3, game01, probe2 through
     probe21 — and not one ordinary word does. A numeral is the discriminator,
     it needs no list to maintain, and it costs nothing since linkMap is never
     sent to the model. atlantica, manuel and quizzard stay unlinked: a small
     loss, and honest.

     STILL CASE-SENSITIVE, DELIBERATELY. The model wrote "Page2" and the id is
     "page2", so a further mismatch remains; it is fixed where it belongs, by
     matching case-insensitively in linkMap's own keys below, rather than by
     loosening what may be linked. */
  function linkable(id, known) {
    id = String(id || '');
    if (!id) return false;
    if (known && !known[id.toLowerCase()]) return false;   // must be a real id
    return /[-_.]/.test(id) || /\d/.test(id);              // and not plain English
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
  /* ── THE NAV LABELS ARE DOORS TOO ─────────────────────────────────────────
     The hall told a visitor "INTERFACE is the label to click" and INTERFACE was
     not clickable, because linkMap held document IDS and the model had written
     a nav LABEL. Naming a door and not opening it is half an answer.

     UPPERCASE ONLY, WHICH IS THE GUARD. linkify's regex is case-sensitive, so
     these match only when written the way the bar writes them. "COURT" links;
     "the court ruled" does not. That is the same discipline as refusing to link
     bare words like `hall` — the shape of the token carries the intent.

     THE TABS ARE ADDRESSABLE, AND I SAID TWICE THAT THEY WERE NOT. Two failed
     greps are not a reading. Page1 carries a hash router — `Page1.html#codex`
     activates a pane, and it splits on a slash, so `#terminal/lincoln` opens
     the terminal on a figure. The five real targets were read off the
     <section data-page="..."> tags themselves: bookstore, codex, timeline,
     terminal, counsel.

     ARENA AND MARKETPLACE HAVE NO SECTION OF THEIR OWN and so get no hash.
     Arena is the flagship's own default view; Marketplace has a button in the
     bar and no pane behind it that could be found. Guessing an address for
     either would hand a visitor a link that goes nowhere, which is worse than
     naming the page.

     AND `#timeline` IS NOT A TIMELINE. It is BROWSE — "THE CODEX · BROWSE BY
     ORDER, every legend in the archive, gathered by their order", indexed
     AMENTI/BRW/v1.0. The data-page name outlived whatever that pane once was,
     exactly as Page2's gloss said "microphone" for months after the helix was
     built. Anyone grepping Page1 for "timeline" finds a tab and concludes the
     flagship has one; this comment exists so the next reader does not. */
  var NAV_LINKS = {
    'ARENA':       'Page1.html',
    'ASK AMENTI':  'hall.html',
    'INTERFACE':   'Page2.html',
    'GAMEROOM':    'game01.html',
    'COURT':       'court.html',
    'CODEX':       'Page1.html#codex',
    'BROWSE':      'Page1.html#timeline',
    'TERMINAL':    'Page1.html#terminal',
    'COUNSEL':     'Page1.html#counsel',
    'BOOK STORE':  'Page1.html#bookstore',
    'MARKETPLACE': 'Page1.html'
  };

  function linkMap(items) {
    /* Every id the register holds, lowercased, is the membership set. */
    var known = {};
    (items || []).forEach(function (i) { if (!i.unreachable) known[String(i.id).toLowerCase()] = true; });

    var m = {};
    (items || []).forEach(function (i) {
      if (i.unreachable || !linkable(i.id, known)) return;
      var u = docUrl(i.path);
      if (!u) return;
      m[i.id] = u;
      /* The model writes the id as it reads best in a sentence — "Page2", not
         "page2". Publish the common casings so the surface can resolve what was
         actually written without the box having to guess. */
      var id = String(i.id);
      [id.toLowerCase(), id.charAt(0).toUpperCase() + id.slice(1)].forEach(function (v) {
        if (v !== id && !m[v]) m[v] = u;
      });
    });

    /* The bar's own labels, resolved against the Pages host the same way a
       document is. Added last so a real id always wins a collision. */
    Object.keys(NAV_LINKS).forEach(function (label) {
      if (!m[label]) m[label] = PAGES + 'Amenti.live/' + NAV_LINKS[label];
    });
    return m;
  }

  /* ── OPENING THE DOORS · added 31 Aug ─────────────────────────────────────
     The doors tell the hall a room exists and roughly what it holds. They do
     not tell it one word of what is IN the room. This opens them.

     TWO CALLS, NOT ONE. The first is shown the doors and answers only which
     rooms and which sections the question reaches. The second is shown what is
     behind them and answers the visitor. THE SECOND CALL DOES NOT CARRY THE
     DOOR LIST — 5,812 chars leave the prompt the moment the choice is made,
     and that is the whole reason passages fit at all.

     THE SECTION TITLES ARE THE HINGE. The doors name up to three per room, so
     call one can say `brutus / The overthrow` and the works are selected
     without a third call to ask which ones. That is what the rich door form
     was paid for.

     THE CAPS ARE THE WALL, EXPRESSED IN WORKS. Call two carries HALL.md,
     the counts and the rules — about 8,600 fixed — plus MAX_WORKS passages of
     WORK_SLICE each. Raising any of these without re-running probe-hall-wall
     is how the hall goes silent again. */
  var MAX_ROOMS  = 3;
  var MAX_WORKS  = 4;
  /* 1,750, not 2,000. At 2,000 the worst case measured 18,473 of 20,000 and
     probe-hall-wall warned that the margin was under a tenth of the wall — true,
     and a warning that fires on every run becomes wallpaper. Four passages of
     1,750 is 7,000 chars of primary source, more than three of 2,000 would be.
     The room to raise it again is in HALL.md, which spends 5,751 chars — 29% of
     the wall — carrying the ship's architecture into questions about Livy. That
     is THE STANDING SLIP #13 move F, and it is where this number grows.

     1,500 after rule 2 was rewritten twice on 31 Aug — first to ask for
     quotation at all, then to ask for scene AND evidence together. Saying that
     properly costs about 750 chars of prompt, and the passages paid for it.
     That is the right way round: the rule is the product, the slice is the
     budget. 4 x 1,500 is still 6,000 chars of primary source in every answer,
     where the hall could quote nothing at all this morning.

     WHERE IT GROWS BACK: HALL.md, at 5,751, is 29% of the wall spent carrying
     the ship's architecture into a question about Livy. Scope it to the lane —
     THE STANDING SLIP #13 move F — and thousands come back at once. */
  /* 780 after the séance epigraph went to the top of HALL.md on 2 Sep. The
     line "a reading room with very good acoustics" is the thesis of the whole
     project and belongs where the hall reads it first; ~100 chars, and the
     passages paid, which is the right trade — HALL.md is the meaning, the
     slice is the budget. */
  var WORK_SLICE = 780;

  /* ── THE AUTHORED NOTES · added 31 Aug ────────────────────────────────────
     Room catalogues carry a `note` per room and a `note` per work, written by
     hand. They were being discarded, and one of them is load-bearing.

     THE ROOM `brutus` IS LUCIUS JUNIUS BRUTUS, who overthrew the monarchy in
     509 BC — not Marcus, who killed Caesar four centuries later. A visitor
     asking about betrayal almost certainly means Marcus, and Marcus IS NOT
     ABOARD: the roster holds one Brutus. Without the note the hall opens
     Lucius's room for a Marcus question and its own training supplies the
     assassination while the citation says Livy Book I. The library author saw
     this coming and wrote the guard — the note opens "FIRST, WHICH BRUTUS."

     ONE SHARED ALLOWANCE, SPENT IN PRIORITY ORDER, because room notes run to
     2,000 chars and a per-item cap would overrun. Room notes first: they
     disambiguate, and being wrong about WHO is worse than being thin about
     what. Work notes take what is left. The worst case is bounded at
     NOTE_BUDGET no matter how many rooms open. */
  /* ── THE SHIP'S SECTIONS ──────────────────────────────────────────────────
     A LIBRARY ROOM OPENS. A SHIP SECTION DOES NOT — IT IS ALREADY OPEN.

     The library's primary source is the work, so the gloss points and the text
     must be fetched. The ship's primary source IS THE GLOSS: an authored
     sentence per file, already in SOURCES.json, already loaded on every
     question. Fetching Page2.html to learn it holds a helix would be absurd —
     1.5 MB of markup to recover a line someone already wrote. So a section
     pick costs no fetch at all; it means "include these entries".

     WHY TRIMMED, AND WHY A SHARED BUDGET. Sending a whole section is the fault
     this evening was spent removing, one layer down: `the briefs` holds 72
     entries today and its own name still says 41. Unbounded growth put the
     hall over the wall this morning. So the entries are trimmed to a choosing
     length and the total is capped, and when the cap bites the hall SAYS how
     many it did not show — a truncation that is declared is a reading, one
     that is silent is a lie.

     THIS DOES NOT SCALE FOREVER AND IS NOT MEANT TO. At ~60 chars an entry the
     budget carries roughly 130 documents across the sections a question
     reaches. probe-hall-wall measures it and will warn long before it breaks,
     which is the whole difference between tonight and this morning. */
  /* 7,400 after rules 6a and the two-kinds instruction landed on 31 Aug.
     Teaching the router that a question about the ship reaches a SECTION, and
     forbidding the hall from saying Amenti lacks a thing it never looked for,
     cost ~650 chars of prompt. The register entries paid, because a shorter
     list that routes correctly beats a longer one nobody reaches. */
  var SECTION_BUDGET = 5800;
  var SECTION_GLOSS  = 90;

  var NOTE_BUDGET = 900;
  var ROOM_NOTE   = 500;
  var WORK_NOTE   = 250;
  var LIB        = RAW + 'library/';

  /* ── call one: which doors does this question reach? ──────────────────── */

  /* Answers with JSON and nothing else. It is shown the doors and the question
     and NOTHING ELSE — no HALL.md, no counts, no rules about how to write. It
     is not addressing the visitor; it is pointing. Small keeps it cheap, and
     keeps it from starting to answer. */
  function pickRooms(question, doors) {
    var p = [];
    p.push('You are routing a question inside the library of Amenti. You do NOT answer it.');
    p.push('');
    p.push('=== EVERY DOOR THAT EXISTS ===');
    p.push(doors);
    p.push('');
    p.push('=== WHAT TO DO ===');
    p.push('Name the rooms whose works bear on the question, most relevant first, at most 3.');
    p.push('For each room, name the section titles from its door that bear on it, copied EXACTLY as written. If the whole room bears on it, give an empty list.');
    /* CORRECTED 31 Aug, ON THE FIRST LIVE QUESTION. This said: "a room whose
       subject merely resembles the question is not a match", "prefer few and
       right over many and near", and "do not reach". Asked which souls wrote
       about betrayal, the router returned NOTHING — no room's door contains
       that word, so under three warnings against over-matching it judged every
       room a mere resemblance and opened none.
       THE SECTION TITLES EXIST FOR EXACTLY THIS LEAP. "Betrayal" reaches Brutus
       through "The overthrow" and "The price". The single-call version made
       that leap easily because it was asked to ANSWER; this one was asked to
       MATCH and told not to stretch. The instruction below asks for the leap by
       name. Returning nothing is still allowed — but it is now the answer of
       last resort, not the safe default. */
    p.push('READ THE SECTION TITLES FOR THEIR MEANING, not for matching words. The question will rarely use the words on the doors. A question about betrayal reaches a room whose sections are named for an overthrow or a broken oath; a question about grief reaches a room whose sections are named for a death. THAT LEAP IS THE WHOLE JOB. Make it.');
    /* Added after the router sent "is there a timeline on this site?" to
       Lincoln and Ingram. Every example above is about figures and works, so
       the router read the whole job as a library job. THE DOORS ARE TWO KINDS
       OF THING and the instruction has to say so. */
    p.push('THE DOORS ARE TWO KINDS. The ROOMS hold what a historical figure wrote. The SECTIONS hold the ship\u2019s own files — what Amenti is, how it is built, what surfaces and instruments and registers it has. A QUESTION ABOUT AMENTI ITSELF — its features, its pages, its architecture, whether it HAS some thing — REACHES A SECTION, NOT A FIGURE\u2019S ROOM. Asking whether the site has a timeline is a question about the ship; asking who wrote about betrayal is a question about the library. Name the section by its full name exactly as written above.');
    p.push('Returning an empty list is honest ONLY when no room could plausibly bear on the question at all. Prefer naming a room you are unsure of over naming none: the next step opens it and reads it, and a wrong room costs a passage, while no room costs the visitor their answer.');
    p.push('');
    p.push('Reply with JSON and nothing else. No prose, no markdown fence:');
    p.push('{"rooms":[{"key":"<room key exactly as written>","sections":["<section title>"]}]}');

    return window.claude.complete({
      system: p.join('\n'),
      messages: [{ role: 'user', content: String(question) }]
    }).then(function (raw) {
      /* The model writes a fence whether or not it is asked not to. */
      var t = String(raw).replace(/```json|```/g, '').trim();
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a === -1 || b === -1) return [];
      try {
        var got = JSON.parse(t.slice(a, b + 1));
        /* FOUND BY ATTACK, 31 Aug. `{"rooms":"brutus"}` is valid JSON of the
           wrong TYPE: slice() on a string returns a string, and a string has no
           filter(), so the whole ask() rejected and the visitor was told the
           hall could not answer. The router is a model; it will produce that
           shape sooner or later. Everything below now checks the type it got
           rather than the type it expected. */
        if (!got || !Array.isArray(got.rooms)) return [];
        return got.rooms.filter(function (r) {
          return r && typeof r.key === 'string';
        }).map(function (r) {
          /* `sections` as a bare string is the same class of fault, and it does
             not throw — it silently indexOf()s a SUBSTRING, so a section title
             could match by accident. Coerce it. */
          return { key: r.key, sections: Array.isArray(r.sections) ? r.sections
                                       : (typeof r.sections === 'string' ? [r.sections] : []) };
        }).slice(0, MAX_ROOMS);
      } catch (e) { return []; }
    }, function () { return []; });
  }

  /* ── opening them ─────────────────────────────────────────────────────────
     A room key not in LIBRARY.json is dropped without comment. The router is a
     model and may return a key it invented; a fetch built from an invented key
     is a 404 that would read as a missing file rather than as a bad guess. */
  function openRooms(picks, library, degraded) {
    var known = {};
    ((library && library.rooms) || []).forEach(function (r) { known[r.key] = true; });

    /* Deduplicate before fetching. FOUND BY ATTACK: the router may name the
       same room twice — it did, under a deliberately repeated pick — and each
       copy contributed its works again, so MAX_WORKS was spent on four slots
       holding two works. The visitor lost half their passages and nothing said
       so. Merge the sections of repeated keys instead. */
    var merged = [];
    var at = {};
    ((picks || [])).forEach(function (p) {
      if (!p || !known[p.key]) return;
      if (at[p.key] === undefined) { at[p.key] = merged.length; merged.push({ key: p.key, sections: (p.sections || []).slice() }); return; }
      var m = merged[at[p.key]];
      (p.sections || []).forEach(function (sec) { if (m.sections.indexOf(sec) === -1) m.sections.push(sec); });
    });

    return Promise.all(merged.filter(function (p) { return p && known[p.key]; })
      .map(function (p) {
        return attempt('library/' + p.key + '.json', get(LIB + p.key + '.json', true))
          .then(function (r) { return { pick: p, ok: r.ok, cat: r.value, error: r.error }; });
      })).then(function (rooms) {
        var works = [];
        rooms.forEach(function (r) {
          if (!r.ok) { degraded.push('library/' + r.pick.key + '.json — ' + r.error); return; }
          var want = r.pick.sections || [];
          var hit  = (r.cat.works || []).filter(function (w) {
            return !want.length || want.indexOf(w.section) !== -1;
          });
          /* FOUND BY ATTACKING THIS, 31 Aug. The router is a model and may name
             a section title that is close but not exact — the doors show only
             the first three of a room, so it can also name a real section it
             was never shown. Either way the filter matched nothing and the room
             was lost ENTIRELY, taking a correct room choice with it.
             Fall back to the whole room. Nothing is claimed falsely: the
             coverage statement reports what was actually opened, not what was
             asked for, so a widened selection is declared like any other. */
          if (!hit.length) hit = (r.cat.works || []);
          hit.forEach(function (w) {
            works.push({ room: r.cat.key, roomName: r.cat.name, roomNote: r.cat.note || '', work: w });
          });
        });
        return { rooms: rooms, works: works.slice(0, MAX_WORKS) };
      });
  }

  /* A work with no `file` has no stored text — a `recall` or `link` work — and
     is carried WITHOUT a passage rather than dropped, so the answer can say the
     room holds it and it was not read. LIBRARY.json cannot tell a stored work
     from a reconstructed one (it keeps only title, section and source), but the
     room's own catalogue can, and this is where that matters. */
  function fetchWorks(works, degraded) {
    return Promise.all((works || []).map(function (w) {
      if (!w.work.file) {
        return Promise.resolve({ room: w.room, roomName: w.roomName, roomNote: w.roomNote, work: w.work,
          text: null, why: 'no stored text (' + (w.work.mode || 'mode unrecorded') + ')' });
      }
      return attempt(w.work.id, get(LIB + w.work.file, false)).then(function (r) {
        if (!r.ok) {
          degraded.push(w.work.id + ' — ' + r.error);
          return { room: w.room, roomName: w.roomName, roomNote: w.roomNote, work: w.work, text: null, why: 'could not be read' };
        }
        return { room: w.room, roomName: w.roomName, roomNote: w.roomNote, work: w.work,
          text: stripMarkup(r.value).slice(0, WORK_SLICE), why: null };
      });
    }));
  }

  /* Entries of the picked sections, trimmed, under one shared budget. Returns
     what was shown AND what was withheld, because the second is the honest
     half. */
  function sectionText(items, picks) {
    var want = {}, order = [];
    (picks || []).forEach(function (p) {
      if (p && p.key && !want[p.key]) { want[p.key] = true; order.push(p.key); }
    });
    if (!order.length) return null;

    var budget = SECTION_BUDGET, out = [], shown = 0, held = 0, any = false;
    order.forEach(function (sec) {
      var rows = items.filter(function (i) { return !i.unreachable && i.section === sec; });
      if (!rows.length) return;
      any = true;
      /* CHARGED, not free. Until 31 Aug the header and the notice below were
         pushed without decrementing the budget, so SECTION_BUDGET bounded the
         entries and not the text — the real output ran 600 chars past what the
         probe measured. A budget that does not include everything it emits is
         a number that lies about itself. */
      var head = '=== SECTION: ' + sec + ' \u2014 ' + rows.length + ' documents ===';
      budget -= head.length + 1;
      out.push(head);
      var cut = 0;
      rows.forEach(function (i) {
        var w = String(i.what || '');
        if (w.length > SECTION_GLOSS) w = w.slice(0, SECTION_GLOSS - 2).replace(/\s+\S*$/, '') + '\u2026';
        if (!w) w = '[undescribed]';
        if (i.supersededBy) w += ' [superseded by ' + i.supersededBy + ']';
        var line = '\u00b7 ' + i.id + ' \u2014 ' + w;
        if (line.length + 1 > budget) { cut++; held++; return; }
        budget -= line.length + 1; shown++; out.push(line);
      });
      if (cut) {
        var notice = '[' + cut + ' more documents in this section were NOT shown to you. Say so if it matters — do not imply the list above is complete.]';
        budget -= notice.length + 1;
        out.push(notice);
      }
    });
    if (!any) return null;
    return { text: out.join('\n'), shown: shown, held: held, sections: order };
  }

  /* ── call two: answer from what was opened ────────────────────────────── */

  /* `doors` is passed ONLY when nothing was opened. Normally call two must not
     carry the door list — dropping those 5,812 chars is what pays for the
     passages. But when no room was opened there are no passages, the budget is
     free, and the hall needs the list for the very rule that tells it to name
     the nearest rooms.

     WITHOUT THIS IT NAMED THEM FROM TRAINING. Asked about betrayal on 31 Aug it
     offered Machiavelli, who is NOT ABOARD, hedged as "if he is among those who
     can speak" — honest about its uncertainty and still the pre-Amenti failure,
     arriving through the one seam left open. A hall that cannot see its own
     rooms will describe the rooms it remembers. */
  function buildAnswer(hall, state, opened, coverage, degraded, doors, ship) {
    var p = [];
    p.push('You are the hall of Amenti answering a visitor who has typed a question into ASK AMENTI in the hall.');
    p.push('You are NOT a figure. You do not have a historical persona. You speak for the building.');
    p.push('');
    p.push('=== WHAT AMENTI IS (authored — this is your meaning) ===');
    p.push(hall || '[HALL.md could not be read. Say so. Do NOT describe Amenti from your own training — you would be inventing a project that is not this one.]');
    p.push('');
    p.push('=== THE COUNTS, READ THIS HOUR (the only numbers you may state) ===');
    p.push(state ? JSON.stringify(state, null, 1) : '[HALL-STATE.json could not be read. State NO numbers at all.]');
    p.push('');
    p.push('=== THE DOORS IN THE BAR ABOVE THE VISITOR (this is the whole of the site\u2019s navigation) ===');
    p.push(NAV);
    p.push('Asked WHERE something is, answer from this list first: name the label the visitor can actually see and click. Never send them to a door that is not on it.');
    p.push('');
    p.push('=== WHAT WAS OPENED FOR THIS QUESTION ===');
    if (opened && opened.length) {
      /* Grouped by room so the room's note is stated once, before its works,
         and reads as what it is: the librarian telling you whose room this is
         before you read a word of it. */
      var budget = NOTE_BUDGET;
      var trim = function (text, cap) {
        var t = String(text || '');
        if (!t || budget <= 0) return '';
        var n = Math.min(t.length, cap, budget);
        budget -= n;
        return n < t.length ? t.slice(0, n).replace(/\s+\S*$/, '') + '\u2026' : t;
      };
      var order = [], byRoom = {};
      opened.forEach(function (o) {
        if (!byRoom[o.room]) { byRoom[o.room] = []; order.push(o); }
        byRoom[o.room].push(o);
      });
      order.forEach(function (first) {
        p.push('=== ROOM: ' + first.roomName + ' (' + first.room + ') ===');
        var rn = trim(first.roomNote, ROOM_NOTE);
        if (rn) {
          p.push('ABOUT THIS ROOM (authored by the library, and it governs): ' + rn);
          p.push('If that note tells you WHICH person this room is, say so when it matters. A visitor may have a different figure of the same name in mind, and the room does not hold them.');
        }
        byRoom[first.room].forEach(function (o) {
          p.push('--- ' + o.work.title + ' ---');
          p.push('SOURCE: ' + (o.work.source || '[no source recorded]'));
          var wn = trim(o.work.note, WORK_NOTE);
          if (wn) p.push('ABOUT THIS WORK: ' + wn);
          if (o.text) { p.push('TEXT:'); p.push(o.text); }
          else p.push('[NOT READ: ' + o.why + ']');
        });
      });
    } else if (ship) {
      p.push('These are the ship\u2019s own files. THE REGISTER IS THE PRIMARY SOURCE HERE — each line below is an authored description of a file, and it is what you answer from. You have NOT read the files themselves and must not describe their contents beyond what the line says.');
      p.push(ship.text);
    } else {
      p.push('[nothing was opened for this question]');
      if (doors) {
        p.push('');
        p.push('=== EVERY DOOR THAT EXISTS (nothing was opened, so here is the whole list) ===');
        p.push('These are SECTIONS and ROOMS, not individual documents. Name rooms ONLY from this list. A figure not named here IS NOT ABOARD, however famous, and saying they might be is the error this hall exists to refuse.');
        p.push(doors);
      }
    }
    p.push('');
    p.push('=== WHAT WAS SEARCHED, AND WHAT WAS NOT OPENED ===');
    p.push(coverage);

    if (degraded && degraded.length) {
      p.push('');
      p.push('=== COULD NOT BE READ THIS TURN ===');
      p.push(degraded.join('\n'));
    }

    p.push('');
    p.push('=== HOW TO ANSWER ===');
    p.push('1. ANSWER FROM THE TEXT ABOVE. That is what you were given it for.');
    /* ── CORRECTED TWICE ON 31 AUGUST, IN OPPOSITE DIRECTIONS ──────────────
       FIRST this rule was a warning and nothing else — every clause about the
       danger of a false quotation, not one asking for a true one. The safest
       way to obey it was never to use quotation marks at all, and that is what
       happened: asked about betrayal, the hall PARAPHRASED Caesar and Livy and
       quoted neither. A library of 550 works cited to findable editions exists
       so a visitor gets the words themselves.

       THEN it was rewritten to demand quotation, and that overshot the other
       way. It called a summary the thing a chatbot produces, which is wrong
       about the work this hall does. Livy's sentence about the embassy to
       Delphi is inert until someone says why a man would play the fool at a
       tyrant's court. Strip the summary out and you do not have a purer
       product, you have an unindexed archive.

       THE HALL IS BUILDING A SCENE. The elements are the primary source and
       must be exact and cited. The summary is the staging — it decides what
       the visitor sees first, what the passage is answering, why this room and
       not another. Neither is the lesser half.

       So the rule is not quote-more-summarise-less. It is: NEVER LET ONE WEAR
       THE OTHER'S CLOTHES. */
    p.push('2. BUILD THE SCENE, THEN SHOW THE EVIDENCE. Your own words set it up — what this room is, why the question lands here, what the passage is about to show. Then quote the passage that earns it. A quotation with no staging is a wall of text a visitor cannot enter; staging with no quotation is a summary they could have got anywhere. The library exists so they can have both.');
    p.push('2a. QUOTE WHERE THE TEXT SAYS THE THING. In quotation marks, a sentence or two, not a reprint. If the passage carries the moment, let it speak rather than describing it.');
    p.push('2b. AND QUOTE ONLY FROM THE TEXT ABOVE, copied word for word. You know famous passages from these authors in OTHER translations, remembered from elsewhere; those words are not in the edition aboard, and putting them under the SOURCE line above would attach a real citation to words this library does not contain. If a phrase is not in the text above it is not a quotation, however well you remember it — say it in your own words instead, which is honest and is not a lesser thing to do.');
    p.push('2c. THE SEAM MUST STAY VISIBLE. A reader must always be able to tell Livy\u2019s words from yours. That is what the quotation marks are for and why the surface prints the edition beneath your answer. Never blur the two, in either direction: do not summarise inside quotation marks, and do not slip a remembered line into your own prose as though you had read it here.');
    p.push('3. SAY WHAT YOU READ AND WHAT YOU DID NOT. The coverage above is not decoration. Tell the visitor which rooms were opened and that the rest were not. A miss that is stated is honest; a miss that is silent is the fault this hall exists to refuse.');
    p.push('4. Name the work in the sentence that quotes it — its title, briefly. Do NOT reproduce the full SOURCE line in your prose; the surface prints it beneath your answer, where it belongs. Never invent a work, a title or a source.');
    p.push('5. Where you rely on general knowledge rather than the text above, say so in the sentence that uses it. The library is the authority here; your own memory of these figures is not, and the visitor must be able to tell which they are reading.');
    p.push('6. If nothing was opened, say plainly so, and name the nearest rooms FROM THE DOOR LIST ABOVE. Never name a figure who is not on that list — a famous name you remember is not evidence they are aboard.');
    p.push('6a. DO NOT SAY AMENTI LACKS SOMETHING UNLESS YOU LOOKED. Telling a visitor the ship has no such feature is a claim about the register, and you may only make it if the ship\u2019s own entries are above and none of them describe it. If you opened figures\u2019 rooms and no section of the register, you have not looked at the ship at all — say which door you would need to open instead, and do not answer with a confident no.');
    p.push('7. Be brief. Two or three short paragraphs, plus a quotation if you have one. This is a doorway, not a lecture.');
    p.push('8. Amenti-Workers and Admin are private. Never state costs, tokens, credentials or provider accounts.');
    p.push('9. The figures are the thing; you are the doorway. Asked what a soul thought or felt beyond what the text says, say they can be asked directly.');
    p.push('10. Refuse as yourself, in your own voice. A refusal is a character move, not a system notice.');
    return p.join('\n');
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

      var nRooms = ((lib && lib.rooms) || []).length;
      var nWorks = (lib && lib.totals && lib.totals.totalWorksPresent) || 0;
      var nDocs  = items.filter(function (i) { return !i.unreachable; }).length;

      /* CALL ONE — which doors does this question reach? */
      return pickRooms(question, cat).then(function (picks) {
      /* A pick is either a LIBRARY ROOM (fetch it) or a SHIP SECTION (already
         in hand). Until 31 Aug a section pick was dropped in silence — the
         router named `the surfaces`, openRooms found no such library room, and
         the hall answered having opened nothing and said nothing about it.
         Architecture questions were WORSE than before the doors were built. */
      var sectionNames = {};
      items.forEach(function (i) { if (!i.unreachable) sectionNames[i.section] = true; });
      var shipPicks = picks.filter(function (p) { return sectionNames[p.key]; });
      var roomPicks = picks.filter(function (p) { return !sectionNames[p.key]; });
      var ship = sectionText(items, shipPicks);

      return openRooms(roomPicks, lib, degraded).then(function (o) {
      return fetchWorks(o.works, degraded).then(function (opened) {

        /* ── THE COVERAGE STATEMENT ─────────────────────────────────────
           Built from what actually HAPPENED — the rooms really opened and the
           works really read — never from what was asked for.

           The hall declared every document for its whole life because a
           retrieval pass can miss and never say it missed. Retrieval keeps
           that promise only if the miss is DECLARED. So this is assembled
           here from real counts and handed to the model as something it is
           required to pass on. It is not a footnote on the design; it is the
           design, and it is the reason retrieval was allowed to replace
           declaring everything. */
        var seen = {};
        opened.forEach(function (x) { seen[x.roomName] = true; });
        var names = Object.keys(seen);
        var read  = opened.filter(function (x) { return x.text; }).length;

        /* FOUND BY ATTACK, 31 Aug. With LIBRARY.json unreadable this line read
           "searched: 0 rooms holding 0 works" — which asserts that a search ran
           and found nothing. No search ran; the register could not be read. A
           false statement inside the very block the model is required to pass
           on to the visitor is the worst place on this ship to put one, so the
           unreadable case says what actually happened instead of counting to
           zero. */
        var shipLine = ship
          ? ('the ship\u2019s register: ' + ship.shown + ' document descriptions shown from ' +
             ship.sections.join(', ') + (ship.held ? ', and ' + ship.held + ' NOT shown' : ''))
          : null;

        var coverage = [
          lib ? ('searched: ' + nRooms + ' rooms holding ' + nWorks + ' works, and ' + nDocs + ' documents of the architecture')
              : ('searched: ' + nDocs + ' documents of the architecture. THE LIBRARY REGISTER COULD NOT BE READ THIS TURN, so no room was searched at all — do not say the library is empty, say it could not be read.'),
          'opened: ' + (names.length ? names.join(', ') : 'no rooms'),
          'works read in full or in part: ' + read,
          shipLine,
          'NOT opened: every other room and every other work. You did not see them and must not describe them.'
        ].filter(Boolean).join('\n');

        /* CALL TWO — answer from what was opened. It does NOT carry the door
           list: 5,812 chars leave the prompt the moment the choice is made,
           and that is the whole reason the passages fit. */
        /* The doors go in only when NOTHING was found — no room and no section.
           A section pick is a found thing, so the door list comes out and its
           5,812 chars pay for the register entries instead. */
        var system = buildAnswer(hall, state, opened, coverage, degraded,
                                 (opened.length || ship) ? null : doorsText(items, lib, true), ship);

        return window.claude.complete({
          system: system,
          messages: [{ role: 'user', content: String(question) }]
        }).then(function (answer) {
          return {
            answer: answer,
            cited: opened.map(function (x) { return x.work.title; }),
            counts: state,
            sources: items.length,
            /* Documents only, and never sent to the model — 147 urls overran
               SYSTEM_CHARS on their own. A room is an overlay, not a page, so
               it has no url to give. Costs no prompt budget either way. */
            links: linkMap(items),
            /* THE TEXT COMES BACK WITH IT — added 1 Sep for the quote guard.
               The surface cannot check a quotation against a passage it was
               never given. This costs NO prompt budget: `opened` is returned to
               the page, never sent to the model. The notes ride along
               separately because a quote found in a librarian's note is a
               different claim from one found in the work. */
            opened: opened.map(function (x) {
              return { room: x.room, roomName: x.roomName, title: x.work.title,
                       source: x.work.source, read: !!x.text,
                       text: x.text || null,
                       note: [x.roomNote, x.work.note].filter(Boolean).join(' \u00b7 ') || null };
            }),
            searched: { rooms: nRooms, works: nWorks, documents: nDocs },
            register: ship ? { shown: ship.shown, held: ship.held, sections: ship.sections } : null,
            degraded: degraded
          };
        });
      });
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
    _flatten: flatten
  };
})();
