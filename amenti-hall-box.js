/* ============================================================================
   amenti-hall-box.js  ·  ASK AMENTI — THE BOX
   ----------------------------------------------------------------------------
   The surface. One box above the roster: search as you type, and when a
   question is asked, the hall answers beneath.

   INSTALL — one line in Page1.html, after amenti-hall.js:

     <script src="amenti-hall.js" defer></script>
     <script src="amenti-hall-box.js" defer></script>

   It mounts itself above #roster. If #roster is absent it mounts at the top
   of <body> and says so in the console rather than silently not appearing.

   ── RULINGS THIS BUILD FOLLOWS (24 Aug) ───────────────────────────────────
   · TEXT ONLY. No voice, no mic, no AMENTI_VOICE. "Can you hear me" is
     answered in HALL.md: this box reads, it does not listen.
   · STATELESS. Each ask stands alone — no conversation memory. A visitor who
     wants a conversation has the souls for that.
   · SEARCH FIRST. Names and fragments never reach the model. Only a genuine
     question spends, and only on Enter — never on a keystroke.

   ── THE QUESTION LOG ──────────────────────────────────────────────────────
   What people actually type is a reading worth having: after a week the four
   seeded questions should be replaced by the real four. The browser may not
   write to any register (the browser only ever reads), so v1 keeps a local
   tally the proprietor can inspect on their own machine:

       JSON.parse(localStorage.getItem('amenti.hall.log'))

   A fleet-wide question register needs a Worker tube and is deliberately NOT
   built here. Recorded as an open item, not smuggled in.
   ========================================================================== */

(function () {
  'use strict';

  var SEEDED = [
    'What is Amenti?',
    'Who is in the library?',
    'What is a spell?',
    'How does the emerald economy work?'
  ];
  var LOG_KEY = 'amenti.hall.log';
  var LOG_MAX = 200;

  /* ── mount ────────────────────────────────────────────────────────────── */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var css = document.createElement('style');
  css.textContent = [
    '#ask-amenti{max-width:720px;margin:1.5rem auto;padding:0 1rem;font-family:inherit}',
    '#ask-amenti .aa-box{display:flex;align-items:center;gap:.5rem;border:1px solid rgba(127,127,127,.45);border-radius:10px;padding:.65rem .9rem;background:rgba(127,127,127,.08)}',
    '#ask-amenti input{flex:1;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:1rem}',
    '#ask-amenti .aa-seeds{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0 0}',
    '#ask-amenti .aa-seed{border:1px solid rgba(127,127,127,.4);border-radius:999px;padding:.25rem .7rem;font-size:.85rem;cursor:pointer;background:transparent;color:inherit;opacity:.85}',
    '#ask-amenti .aa-seed:hover{opacity:1}',
    '#ask-amenti .aa-results{margin:.7rem 0 0;padding:0;list-style:none}',
    '#ask-amenti .aa-results li{padding:.45rem .2rem;border-bottom:1px solid rgba(127,127,127,.2);cursor:pointer;font-size:.95rem}',
    '#ask-amenti .aa-kind{opacity:.55;font-size:.78rem;margin-right:.5rem;text-transform:uppercase;letter-spacing:.04em}',
    '#ask-amenti .aa-answer{margin:.9rem 0 0;padding:.9rem 1rem;border-left:3px solid rgba(127,127,127,.5);white-space:pre-wrap;font-size:.97rem;line-height:1.55}',
    '#ask-amenti .aa-note{margin:.5rem 0 0;font-size:.82rem;opacity:.65}',
    '#ask-amenti .aa-busy{opacity:.6;font-style:italic}',
    '#ask-amenti .aa-cite{color:inherit;text-decoration:underline;text-underline-offset:2px;opacity:.9}',
    '#ask-amenti .aa-cite:hover{opacity:1}',
    '#ask-amenti .aa-answer strong{font-weight:600}',
    '#ask-amenti .aa-answer code{font-family:ui-monospace,Menlo,monospace;font-size:.9em;opacity:.9}',
    /* READ FROM — the works this answer was built on, under the answer rather
       than behind a tab. Amenti's claim is that it SHOWS where the words came
       from; a provenance a reader must click to see is a provenance most
       readers never see. Present beats available. */
    '#ask-amenti .aa-read{margin:.9rem 0 0;padding:.75rem 0 0;border-top:1px solid rgba(127,127,127,.25)}',
    '#ask-amenti .aa-read h4{margin:0 0 .5rem;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;opacity:.55;font-weight:600}',
    '#ask-amenti .aa-work{margin:0 0 .55rem;font-size:.86rem;line-height:1.45}',
    '#ask-amenti .aa-work-t{font-weight:600}',
    '#ask-amenti .aa-work-r{opacity:.6}',
    '#ask-amenti .aa-src{display:block;opacity:.62;font-size:.79rem;margin-top:.1rem}',
    '#ask-amenti .aa-unread{opacity:.45;font-style:italic}',
    '#ask-amenti .aa-scope{margin:.6rem 0 0;font-size:.78rem;opacity:.5}',
    /* THE COLOUR IS EARNED. A quotation is only tinted once this page has
       matched it, character for character, against the passage the engine
       actually fetched. Anything unmatched stays in the body colour and makes
       no claim at all. */
    '#ask-amenti .aa-q-verified{color:#c9a227;font-style:normal}',
    '#ask-amenti .aa-q-note{color:inherit;opacity:.92;border-bottom:1px dotted rgba(127,127,127,.55)}',
    '#ask-amenti .aa-verify{margin:.55rem 0 0;font-size:.79rem;opacity:.62}'
  ].join('\n');
  css.textContent += [
    '#ask-amenti .aa-conn{margin-top:14px}',
    '#ask-amenti .aa-conn-block{margin:0 0 14px}',
    '#ask-amenti .aa-conn h4{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#7d6618;margin:0 0 8px}',
    '#ask-amenti .aa-conn-lead{font-size:12.5px;color:#8c93a4;margin:0 0 8px}',
    '#ask-amenti .aa-conn-row{display:flex;align-items:baseline;gap:8px;padding:2px 0;font-size:13.5px}',
    '#ask-amenti .aa-conn-name{color:#b8c4d8}',
    '#ask-amenti .aa-conn-door{color:#7fb4f0;text-decoration:none;border-bottom:1px dotted #4a6d8f}',
    '#ask-amenti .aa-conn-door:hover{border-bottom-style:solid}',
    '#ask-amenti .aa-conn-kind{font-family:ui-monospace,Menlo,monospace;font-size:10px;opacity:.7}',
    '#ask-amenti .aa-conn-kind.contemporary{color:#7fb4f0}',
    '#ask-amenti .aa-conn-kind.historical{color:#ecd493}',
    '#ask-amenti .aa-conn-kind.legendary{color:#b39ddb}',
    '#ask-amenti .aa-conn-kind.scripture{color:#7fdce8}',
    '#ask-amenti .aa-conn-ct{font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#5a6472}'
  ].join('');
  document.head.appendChild(css);

  var root  = el('div'); root.id = 'ask-amenti';
  var box   = el('div', 'aa-box');
  var input = el('input');
  input.type = 'text';
  input.placeholder = 'Ask Amenti\u2026';
  input.setAttribute('aria-label', 'Ask Amenti');
  box.appendChild(el('span', null, '\u2315'));
  box.appendChild(input);

  var seeds = el('div', 'aa-seeds');
  SEEDED.forEach(function (q) {
    var b = el('button', 'aa-seed', q);
    b.type = 'button';
    b.addEventListener('click', function () { input.value = q; ask(q); });
    seeds.appendChild(b);
  });

  var results = el('ul', 'aa-results');
  var answer  = el('div', 'aa-answer'); answer.style.display = 'none';
  var note    = el('div', 'aa-note');   note.style.display = 'none';
  var read    = el('div', 'aa-read');   read.style.display = 'none';
  var conn    = el('div', 'aa-conn');   conn.style.display = 'none';

  root.appendChild(box);
  root.appendChild(seeds);
  root.appendChild(results);
  root.appendChild(answer);
  root.appendChild(read);
  root.appendChild(conn);
  root.appendChild(note);

  /* Mount order: the hall's own page (#hall-main), else above the roster if a
     future ruling ever links it into a surface that has one, else body top.
     hall.html is the home; the others are contingencies, not plans. */
  var home   = document.getElementById('hall-main');
  var roster = document.getElementById('roster');
  if (home) home.appendChild(root);
  else if (roster && roster.parentNode) roster.parentNode.insertBefore(root, roster);
  else {
    document.body.insertBefore(root, document.body.firstChild);
    console.warn('ask-amenti: neither #hall-main nor #roster found — mounted at top of body');
  }

  /* ── the local tally ──────────────────────────────────────────────────── */

  function log(q, kind) {
    try {
      var l = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      l.push({ q: String(q).slice(0, 200), k: kind, at: Date.now() });
      if (l.length > LOG_MAX) l = l.slice(-LOG_MAX);
      localStorage.setItem(LOG_KEY, JSON.stringify(l));
    } catch (e) { /* storage may be unavailable; the tally is a courtesy */ }
  }

  /* ── search as you type ───────────────────────────────────────────────── */

  var t = null;
  input.addEventListener('input', function () {
    clearTimeout(t);
    var q = input.value.trim();
    answer.style.display = 'none'; note.style.display = 'none'; read.style.display = 'none';
    if (!q) { results.innerHTML = ''; return; }
    /* A question is for answering, not for document-matching. Once the text
       reads as a question, stop live-searching its fragments — otherwise a
       half-typed question matches no document and prints a false "nothing
       aboard" under a box that is about to answer perfectly. */
    if (window.AmentiHall.isQuestion(q)) { results.innerHTML = ''; return; }
    t = setTimeout(function () { search(q); }, 160);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var q = input.value.trim();
      if (!q) return;
      if (window.AmentiHall.isQuestion(q)) { results.innerHTML = ''; ask(q); }
      else search(q, true);
    }
  });

  function search(q, logged) {
    if (!window.AmentiHall) return;
    window.AmentiHall.find(q).then(function (r) {
      results.innerHTML = '';
      /* A deliberate search that finds nothing is not an answer. If there was
         more than one word the visitor was probably ASKING and the router
         missed — escalate rather than print a false "nothing aboard". This is
         the second half of the 26 Aug "whom made amenti" fix: the first half
         widens isQuestion(), this half stops a router miss from ever being
         terminal. A single word is a name or a fragment: if it is not aboard,
         say so plainly and spend nothing.
         ask() does its own logging, so the tally below is skipped on escalate
         or the same text is counted twice under two different kinds. */
      if (!r.length && logged && q.split(/\s+/).length > 1) { ask(q); return; }
      if (logged) log(q, 'search');
      /* Only say "nothing matches" for a deliberate search (Enter on a
         non-question). A live keystroke that finds nothing stays silent. */
      if (!r.length && logged) {
        var li = el('li', null, 'nothing aboard matches \u201c' + q + '\u201d');
        li.style.cursor = 'default'; li.style.opacity = '.6';
        results.appendChild(li);
      }
      r.forEach(function (x) {
        var li = el('li');
        li.appendChild(el('span', 'aa-kind', x.kind === 'soul' ? 'soul' : 'doc'));
        li.appendChild(document.createTextNode(
          x.kind === 'soul'
            ? x.name + (x.what ? ' \u00b7 ' + x.what : '')
            : x.id + (x.what ? ' \u2014 ' + String(x.what).slice(0, 90) : '')
        ));
        li.addEventListener('click', function () {
          if (x.kind === 'soul' && typeof window.AmentiCodexOpen === 'function') {
            /* the codex is the existing door to a soul; use it if it is there */
            try { window.AmentiCodexOpen(x.id); return; } catch (e) {}
          }
          input.value = x.kind === 'soul' ? ('who is ' + x.name + '?') : ('what is ' + x.id + '?');
          ask(input.value);
        });
        results.appendChild(li);
      });
      if (r.degraded) {
        note.textContent = r.degraded;
        note.style.display = '';
      }
    });
  }

  /* ── turning a cited id into a door ───────────────────────────────────── */

  /* The answer is MODEL OUTPUT. It has been written into the page with
     textContent until now, which is why nothing here has ever had to think
     about markup. Linking means innerHTML, so the text is escaped FIRST and
     the anchors are added second — in ONE pass, so a replacement can never be
     rescanned and an id sitting inside another document's filename cannot be
     linkified a second time inside an href. */
  var COLOUR_CSS = '.aa-who{color:#7fb4f0}.aa-where{color:#d9b98a}.aa-when{color:#9ec8b0}';
  (function () {
    try {
      var st = document.createElement('style');
      st.textContent = COLOUR_CSS; document.head.appendChild(st);
    } catch (e) {}
  })();

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── THE CONNECTIONS · the harvester, expressed at the front desk ──────────
     When the hall opens a room, that figure's harvested edges become available:
     whom they named, in their own text, and \u2014 where the named figure ALSO has a
     room \u2014 a door the reader can walk through. This reads mentions/<key>-mentions
     .json, which the room's own key indexes. Additive and separate: it touches
     neither the answer prose nor the quote guard. A connection is shown only
     because a source bears it. */
  var _mentCache = {};
  var _roomSet = null;   /* keys that have a library room \u2014 for walkable doors */
  function roomSet() {
    if (_roomSet) return Promise.resolve(_roomSet);
    /* prefer a global if the page provides one; else derive from LIBRARY.json */
    if (window.AMENTI_ROOMS) { _roomSet = window.AMENTI_ROOMS; return Promise.resolve(_roomSet); }
    var base = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.RAW_BASE) ||
               'https://ianingram.github.io/Amenti.live/';
    return fetch(base + 'LIBRARY.json', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        _roomSet = {};
        if (d && d.rooms) d.rooms.forEach(function (rm) { _roomSet[rm.key] = 1; });
        return _roomSet;
      })
      .catch(function () { _roomSet = {}; return _roomSet; });
  }
  function loadMentions(key) {
    if (_mentCache[key] !== undefined) return Promise.resolve(_mentCache[key]);
    var base = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.RAW_BASE) ||
               'https://ianingram.github.io/Amenti.live/';
    return fetch(base + 'mentions/' + key + '-mentions.json', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { _mentCache[key] = d; return d; })
      .catch(function () { _mentCache[key] = null; return null; });
  }

  function renderConnections(opened) {
    conn.innerHTML = ''; conn.style.display = 'none';
    if (!opened || !opened.length) return;
    Promise.all([roomSet()].concat(opened.map(function (o) {
      return loadMentions(o.room).then(function (d) { return { room: o.room, data: d }; });
    }))).then(function (all) {
      var rooms = all[0] || {};
      var sets = all.slice(1);
      var any = false;
      sets.forEach(function (set) {
        if (!set.data || !set.data.edges || !set.data.edges.length) return;
        any = true;
        var block = el('div', 'aa-conn-block');
        block.appendChild(el('h4', null, 'the connections'));
        var lead = el('div', 'aa-conn-lead');
        lead.textContent = (set.data.author ? set.data.author.replace(/-/g,' ') : set.room) +
          ' names, in their own text:';
        block.appendChild(lead);
        /* group: figures that ALSO have a room become walkable doors */
        set.data.edges.forEach(function (e) {
          var row = el('div', 'aa-conn-row');
          var isDoor = !!rooms[e.to];
          if (isDoor) {
            var a = el('a', 'aa-conn-door');
            a.textContent = '\u2192 ' + e.named;
            a.href = '#' + e.to;
            a.setAttribute('data-room', e.to);
            row.appendChild(a);
          } else {
            row.appendChild(el('span', 'aa-conn-name', e.named));
          }
          if (e.kind) row.appendChild(el('span', 'aa-conn-kind ' + e.kind, e.kind));
          if (e.count && e.count > 1) row.appendChild(el('span', 'aa-conn-ct', e.count + '\u00d7'));
          block.appendChild(row);
        });
        conn.appendChild(block);
      });
      conn.style.display = any ? '' : 'none';
    });
  }

  function linkify(text, links) {
    var ids = Object.keys(links || {});
    if (!ids.length) return esc(text);
    /* Longest first, so 'amenti-brief-the-docket' wins over any shorter id
       that is a prefix of it. */
    ids.sort(function (a, b) { return b.length - a.length; });
    var alt = ids.map(function (id) {
      return id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|');
    /* Not \b — ids contain hyphens and underscores, which \b treats as
       boundaries and would match the middle of a longer name. */
    var re = new RegExp('(^|[^A-Za-z0-9_-])(' + alt + ')(?![A-Za-z0-9_-])', 'g');
    return esc(text).replace(re, function (m, pre, hit) {
      return pre + '<a class="aa-cite" href="' + links[hit] +
             '" target="_blank" rel="noopener">' + hit + '</a>';
    });
  }


  /* The model writes markdown whether or not it is asked not to, and until now
     it reached the page as literal asterisks: **The Hall**. Rather than spend
     system characters telling it to stop — and lose the emphasis, which is
     worth keeping — the surface renders the little of it that actually shows
     up. Deliberately tiny: bold, italic, inline code. Nothing block-level.

     ASTERISKS ONLY. Underscore emphasis is NOT supported and must not be
     added: 'amenti_foundation_sovereignty' is a real catalogue id, and a
     renderer that treats _x_ as italic would eat citations alive.

     Runs AFTER linkify, on already-escaped text. The only markup present at
     that point is anchors whose hrefs come from the register, and no path in
     it contains an asterisk or a backtick — so these patterns cannot reach
     inside a tag. Bold runs before italic so '**' is consumed first.
     Known limit: markdown inside a code span is still rendered. */
  function mdLite(html) {
    return String(html)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^\s*][^*]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^\s*][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  }

  /* ── THE QUOTE GUARD ──────────────────────────────────────────────────────
     THE ENGINE TELLS THE MODEL TO QUOTE ONLY FROM THE TEXT IT WAS HANDED.
     NOTHING CHECKED THAT IT DID. That was the largest gap in the citation
     policy: every other rule aboard has an instrument, and this one had a
     sentence. BRIEF-WHAT-A-SOURCE-MUST-BE §7, THE STANDING SLIP #13 move E.

     Why it matters here and not elsewhere: the model knows famous passages from
     these authors in translations that are NOT the edition aboard. A remembered
     line printed under a real SOURCE line attaches a genuine citation to words
     the library does not contain. That makes the edition a lie — which is the
     exact thing the citation campaign was fought to prevent.

     THREE STATES, BECAUSE TWO WOULD BE DISHONEST.
       verified   the span is verbatim in the TEXT that was fetched this turn.
       from note  it is verbatim in a LIBRARIAN'S NOTE instead. Not a fault —
                  the notes quote the sources accurately — but it is a claim one
                  layer removed, and on 31 Aug the hall said "as the text puts
                  it" about a line that was in the note and not in the slice.
       unmarked   no match. NOT branded false: a quote may be legitimately
                  elided, or drawn from something not returned to this surface.
                  It gets no colour, which is the whole point — THE COLOUR IS
                  EARNED, NEVER CLAIMED.

     A false quotation painted as verified would be worse than no colour at all,
     because the colour asserts provenance the model cannot vouch for. So the
     page only ever colours what it has matched itself. */

  function norm(t) {
    return String(t)
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      /* ── EDITORIAL APPARATUS IS NOT THE AUTHOR'S WORDS ──────────────────
         Found live on 1 Sep, on the first question the guard was asked in
         anger. The hall quoted Josephus — "the first of the twenty-four
         courses" — and it was reported UNMATCHED. It was not invented. The
         Whiston edition carries a footnote marker mid-phrase:

             from the first of the twenty-four [1] courses

         The hall quoted it cleanly, as any editor would. The guard compared
         against the raw text and correctly found no exact match.

         A FALSE NEGATIVE, AND THE GUARD BEHAVED WELL: three states exist so an
         unmatched quote is never branded false — it got no colour and the
         tally said "not matched to anything fetched", not "invented".

         So strip the apparatus, which is the SOURCE's, not the author's.
         Gutenberg's convention is a bracketed number, and no run of prose
         contains one. A remembered quotation still fails; a correctly quoted
         one with a footnote inside it now passes. This LOOSENS NOTHING about
         what counts as verbatim — it removes marks the printer added. */
      .replace(/\[\s*\d+\s*\]/g, ' ')
      /* the .md bodies are hard-wrapped at ~72 chars, so a quotation spanning
         a line break has newlines the answer does not. Collapse both sides. */
      .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim().toLowerCase();
  }

  /* ── THE PUNCTUATION AT THE EDGES IS THE QUOTER'S ────────────────────────
     Found live on 1 Sep, the second time the guard was asked in anger. The
     hall quoted Josephus word for word and it came back UNMATCHED:

         source   ...descended all along from the priests; and as nobility
         quoted   ...descended all along from the priests.

     Every word identical. Only the terminal mark differs — the source runs on
     with a semicolon and the hall closed the clause with a full stop, which is
     what any editor does when lifting a clause out of a sentence.

     Same category as the footnote marker above: THE WORDS ARE THE AUTHOR'S,
     THE PUNCTUATION AT THE BOUNDARY IS THE QUOTER'S. So trim terminal marks
     from BOTH ends of the compared span before matching. This changes nothing
     about the words — a substituted word, an elision, or a remembered line
     still fails, because the interior must still match exactly. */
  function core(t) {
    return norm(t).replace(/^[\s.,;:!?\u2014-]+/, '').replace(/[\s.,;:!?\u2014-]+$/, '');
  }

  /* ── WHO / WHEN / WHERE \u00b7 the answer's three axes \u00b7 2 Sep ─────────────────
     A history text is scanned along three axes: who, when, where. Colouring
     those three \u2014 and ONLY those three, three is the ceiling \u2014 turns a
     paragraph into something searchable by eye. Applied HERE, in the box, not
     asked of the model: a name is blue because the box recognised it, not
     because the model remembered to colour it \u2014 the same discipline as the
     quote guard. GOLD IS RESERVED for verified quotes and never used here, so
     the earned colour is never faked. The pass runs LAST and refuses to touch
     anything already inside a quote span or a link, so it can never recolour a
     verified quotation or break an anchor. */
  var MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
  function colourProse(html) {
    /* Split on the tags we must NOT enter \u2014 quote spans (with their content)
       and anchors \u2014 colour only the plain runs between them. */
    var GUARD = /(<span class="aa-q[\s\S]*?<\/span>|<a [\s\S]*?<\/a>|<[^>]+>)/g;
    var parts = html.split(GUARD);
    for (var i = 0; i < parts.length; i++) {
      /* even indices are plain text between guarded chunks; odd are the guards */
      if (i % 2 === 1) continue;
      var t = parts[i];
      if (!t) continue;

      /* WHEN \u2014 years, centuries, and dated eras. Numbers that are clearly
         temporal, not counts. Placed first so a year is not eaten by a name. */
      t = t.replace(/\b(\d{1,4}\s?(?:BC|BCE|AD|CE)|(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first)-century|(?:'+MONTHS+')\s+\d{1,2}|\b\d{4}s?)\b/g,
        '<span class="aa-when">$1</span>');

      /* WHO / WHERE \u2014 both are proper nouns; we cannot always tell a person
         from a place by shape alone, so we colour PROPER NOUNS as one class
         (who-or-where) in blue, EXCEPT a short list of clear place-words which
         take the where-tint. This keeps the triad honest: names are reliably
         blue; places are best-effort sand, and never wrong enough to mislead.
         A proper noun = a capitalised word not at the very start of a sentence,
         allowing multi-word names (Marcus Tullius Cicero). */
      /* A stop-list keeps sentence-openers and common capitalised
         non-nouns out. Better to MISS a name than to paint 'He', 'The' or a
         demonym blue \u2014 a false colour is worse than none, the same rule the
         quote guard follows. */
      var STOP = /^(He|She|It|They|We|I|You|The|A|An|This|That|These|Those|His|Her|Their|In|On|At|By|For|From|To|With|And|But|Or|So|Then|When|Where|What|Who|Why|How|As|If|Of|After|Before|During|Later|Now|Here|There|Jewish|Roman|Greek|Egyptian|Persian|Christian|Latin|English|French|German|Italian|Spanish)$/;
      t = t.replace(/(^|[.!?\u201C"]\s+|\u2014\s|,\s|\s)([A-Z][a-z]+(?:\s+(?:of|the|de|von|van)\s+[A-Z][a-z]+|\s+[A-Z][a-z]+)*)/g,
        function (m, pre, noun) {
          /* if the run STARTS a sentence (pre ends a sentence or is line start),
             the first word is a mere capital \u2014 skip the whole run only if that
             single word is in the stop-list; otherwise a real name that happens
             to open a sentence still gets coloured on its SECOND word onward is
             too clever, so: skip if the first word alone is a stop word. */
          var first = noun.split(/\s+/)[0];
          if (STOP.test(first)) return m;
          var sentenceStart = /[.!?\u201C"]\s+$/.test(pre) || pre === '';
          if (sentenceStart && !/\s/.test(noun) && STOP.test(noun)) return m;
          var placey = /\b(Rome|Egypt|Greece|Judea|Judaea|Galilee|Jerusalem|Alexandria|Athens|Babylon|Carthage|Giza|Gaul|Britain|Persia|China|India|Sparta|Macedon|Anatolia|Mesopotamia|Nile|Jordan|Sinai|Temple|Italy|Judah|Israel|Constantinople)\b/.test(noun);
          var cls = placey ? 'aa-where' : 'aa-who';
          return pre + '<span class="' + cls + '">' + noun + '</span>';
        });
      parts[i] = t;
    }
    return parts.join('');
  }

  function verifyQuotes(html, opened) {
    var tally = { verified: 0, note: 0, unmatched: 0 };
    if (!opened || !opened.length) return { html: html, tally: tally };

    var texts = [], notes = [];
    opened.forEach(function (o) {
      if (o.text) texts.push({ hay: core(o.text), title: o.title });
      if (o.note) notes.push({ hay: core(o.note), title: o.title });
    });
    if (!texts.length && !notes.length) return { html: html, tally: tally };

    /* `&quot;` because esc() has already run; the curly pair survives it. A
       floor of 12 chars keeps a stray "yes" out of the count. */
    var re = /(&quot;)([\s\S]{12,600}?)(&quot;)|(\u201C)([\s\S]{12,600}?)(\u201D)/g;

    var out = html.replace(re, function (m, dq1, dqBody, dq2, cq1, cqBody) {
      var body = dqBody !== undefined ? dqBody : cqBody;
      var open = dq1 !== undefined ? '&quot;' : '\u201C';
      var close = dq1 !== undefined ? '&quot;' : '\u201D';
      var needle = core(body);
      if (!needle) return m;

      var hit = null, where = null;
      for (var i = 0; i < texts.length; i++)
        if (texts[i].hay.indexOf(needle) !== -1) { hit = texts[i]; where = 'verified'; break; }
      if (!hit) for (var j = 0; j < notes.length; j++)
        if (notes[j].hay.indexOf(needle) !== -1) { hit = notes[j]; where = 'note'; break; }

      if (!hit) { tally.unmatched++; return m; }
      tally[where === 'verified' ? 'verified' : 'note']++;
      return '<span class="aa-q aa-q-' + where + '" title="' +
        (where === 'verified' ? 'verbatim in ' : 'verbatim in the note for ') +
        String(hit.title).replace(/"/g, '') + '">' + open + body + close + '</span>';
    });

    return { html: out, tally: tally };
  }

  /* ── the hall answers ─────────────────────────────────────────────────── */

  var busy = false;
  function ask(q) {
    if (busy || !window.AmentiHall) return;
    busy = true;
    log(q, 'ask');
    answer.style.display = '';
    answer.className = 'aa-answer aa-busy';
    answer.textContent = 'the hall is reading\u2026';
    note.style.display = 'none';
    read.style.display = 'none'; read.innerHTML = '';

    var done = function () { busy = false; };

    window.AmentiHall.ask(q).then(function (r) {
      answer.className = 'aa-answer';
      /* A citation the reader cannot open is half a citation. */
      /* Order matters: escape, then link, then markdown, then verify. The
         guard runs LAST and on already-escaped text, so the only markup it can
         see is anchors and emphasis whose contents it strips before comparing.
         It never introduces markup a previous pass could rescan. */
      var checked = verifyQuotes(mdLite(linkify(r.answer, r.links)), r.opened);
      /* who/when/where colouring, LAST, after the quote guard has claimed its
         gold \u2014 skips quote spans and links so nothing earned is recoloured. */
      answer.innerHTML = colourProse(checked.html);
      renderConnections(r.opened);   /* the harvester speaks at the desk */
      /* ── READ FROM ────────────────────────────────────────────────────
         The engine returns `opened`: every work whose room was opened for
         this question, with its title, its room and its full SOURCE line.

         THE ANSWER NAMES THE WORK; THIS BLOCK CARRIES THE EDITION. Splitting
         them is the arrangement scholarship settled on long ago, and it is
         forced here by size — Livy's source line alone is 145 characters, and
         one of those after every quotation would drown the prose.

         A WORK OPENED AND NOT QUOTED IS STILL LISTED, marked so. The hall may
         read four works and use one; saying which is the coverage principle at
         the scale of a single answer, and listing only what was drawn on would
         quietly overstate how much of the reading bore fruit. */
      read.innerHTML = '';
      if (r.opened && r.opened.length) {
        read.appendChild(el('h4', null, 'read from'));
        r.opened.forEach(function (o) {
          var d = el('div', 'aa-work');
          d.appendChild(el('span', 'aa-work-t', o.title));
          if (o.room) d.appendChild(el('span', 'aa-work-r', '  \u00b7  ' + o.room));
          if (o.read === false) d.appendChild(el('span', 'aa-unread', '  \u00b7  in the room, not read this turn'));
          d.appendChild(el('span', 'aa-src', o.source || '[no source recorded]'));
          read.appendChild(d);
        });
        if (r.searched) {
          read.appendChild(el('div', 'aa-scope',
            'searched ' + r.searched.rooms + ' rooms holding ' + r.searched.works +
            ' works \u00b7 opened ' + r.opened.length + ' \u00b7 the rest were not read'));
        }
        read.style.display = '';
      } else if (r.register) {
        /* THE SHIP'S OWN FILES ARE A THING THAT WAS OPENED. Added 1 Sep: the
           engine returned `register` and this block ignored it, so a question
           answered from ten document descriptions rendered as "none read" —
           the coverage line contradicting what had just happened, which is the
           one failure this block exists to prevent. */
        read.appendChild(el('h4', null, 'read from'));
        var d = el('div', 'aa-work');
        d.appendChild(el('span', 'aa-work-t', 'the ship\u2019s own register'));
        d.appendChild(el('span', 'aa-work-r', '  \u00b7  ' + r.register.sections.join(', ')));
        d.appendChild(el('span', 'aa-src', r.register.shown +
          ' document descriptions' + (r.register.held ? ', and ' + r.register.held + ' not shown' : '') +
          ' \u00b7 SOURCES.json, authored by hand'));
        read.appendChild(d);
        if (r.searched) {
          read.appendChild(el('div', 'aa-scope',
            'the register describes ' + r.searched.documents + ' documents \u00b7 ' +
            r.register.shown + ' shown \u00b7 no library room was opened'));
        }
        read.style.display = '';
      } else if (r.searched) {
        /* Zero rooms means the register could not be read, not that a search
           found nothing — see the same correction in amenti-hall.js. Saying
           "0 rooms were searched" would tell the visitor the library is empty. */
        read.appendChild(el('div', 'aa-scope', r.searched.rooms
          ? ('no rooms were opened \u00b7 ' + r.searched.rooms + ' rooms holding ' +
             r.searched.works + ' works were searched and none read')
          : 'the library register could not be read this turn \u00b7 no room was searched'));
        read.style.display = '';
      }

      /* The tally is stated even when everything passed — a guard that only
         speaks on failure leaves a reader unable to tell it ran. */
      var t = checked.tally, seen = t.verified + t.note + t.unmatched;
      if (seen) {
        var said = [];
        if (t.verified) said.push(t.verified + ' checked against the text');
        if (t.note) said.push(t.note + ' found in the librarian\u2019s note');
        if (t.unmatched) said.push(t.unmatched + ' not matched to anything fetched');
        var v = el('div', 'aa-verify', seen + (seen === 1 ? ' quotation \u00b7 ' : ' quotations \u00b7 ') + said.join(' \u00b7 '));
        read.appendChild(v);
        read.style.display = '';
      }

      /* ── WHERE THE READER IS IN TIME ──────────────────────────────────
         Built NOW, while the answer is being read — never on the click. The
         timeline lives in the bare state, so when a reader clicks the image
         away the position is REVEALED rather than loaded. That is the whole
         difference between a panel that appears and a scene that was always
         there: you were reading Josephus at AD 37–100 the entire time.

         The FIRST opened room wins. The router ranks by relevance, so room
         one is the question's subject; rooms in other centuries fall
         off-screen, which the answer's own coverage line already states.

         Fails quietly and completely: no rooms opened, an unplaceable key, a
         register that will not load — the timeline simply is not there, and
         the bare state is what it was before. Nothing about the reading
         depends on it. */
      if (window.AmentiTimeline) {
        if (r.opened && r.opened.length) {
          try { window.AmentiTimeline.place(r.opened.map(function (o) { return o.room; })); }
          catch (e) { /* a timeline is a courtesy, never a dependency */ }
        } else {
          try { window.AmentiTimeline.clear(); } catch (e) {}
        }
      }

      if (r.degraded && r.degraded.length) {
        note.textContent = 'could not be read this turn: ' + r.degraded.join('; ');
        note.style.display = '';
      }
      done();
    }, function (e) {
      answer.className = 'aa-answer';
      /* 429 and outages are a sentence, not a broken box */
      answer.textContent = /429/.test(String(e))
        ? 'The hall has answered a great many questions this hour and must catch its breath. The search above still works \u2014 and the souls are still receiving.'
        : 'The hall could not answer just now: ' + (e && e.message ? e.message : e);
      done();
    });
  }
})();
