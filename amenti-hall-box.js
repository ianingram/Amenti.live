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
    '#ask-amenti .aa-busy{opacity:.6;font-style:italic}'
  ].join('\n');
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

  root.appendChild(box);
  root.appendChild(seeds);
  root.appendChild(results);
  root.appendChild(answer);
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
    answer.style.display = 'none'; note.style.display = 'none';
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

    var done = function () { busy = false; };

    window.AmentiHall.ask(q).then(function (r) {
      answer.className = 'aa-answer';
      answer.textContent = r.answer;
      var bits = [];
      if (r.cited && r.cited.length) bits.push('drawn from: ' + r.cited.join(', '));
      if (r.degraded && r.degraded.length) bits.push('could not be read this turn: ' + r.degraded.join('; '));
      if (bits.length) { note.textContent = bits.join('  \u00b7  '); note.style.display = ''; }
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
