/* ============================================================================
   THE HALL BENCH  ·  probes/hall-bench.js  →  Amenti.live/probes/hall-bench.js
   ----------------------------------------------------------------------------
   FIVE QUESTIONS, ASKED FOR REAL, PRICED ONE BY ONE.

   ── THIS IS NOT A PROBE AND THE NAME SAYS SO ──────────────────────────────
   A PROBE READS. THIS ONE SPENDS. Every other instrument in probes/ can be
   pasted a hundred times and cost nothing; this one opens the paid door five
   times and puts real money through it. Calling it a probe would have made it
   look safe to run, and it is not safe in the way the others are.

       five asks on claude-sonnet-4-6  ~$0.13
       five asks on claude-haiku-4-5   ~$0.04

   ── SO IT DOES NOT RUN WHEN YOU PASTE IT ──────────────────────────────────
   Pasting prints what it would cost and stops. It runs when you call
   HallBench.run(), which is a second deliberate act. An instrument that
   charges money on paste would be a trap for the one hand that pastes most
   often \u2014 the captain's.

   ── WHY FIVE, AND WHY THESE FIVE ──────────────────────────────────────────
   Each takes a different route through amenti-hall.js, and the point is the
   SPREAD and not the average:

     1  what is Amenti                    HALL.md only \u00b7 no room opened
     2  how many souls                    HALL-STATE.json \u00b7 the counts path
     3  where do I find the map           the doors list \u00b7 navigation
     4  Thucydides on the plague          A ROOM OPENED AND A PASSAGE QUOTED
     5  anything about Carthage           the honest-refusal path

   Four is the expensive one and three is the cheap one. A single question
   priced and generalised would be wrong by whichever end it landed on.

   ── HOW IT MEASURES ───────────────────────────────────────────────────────
   It reads window.AmentiCost BEFORE and AFTER each ask and takes the
   difference, so every figure is the door's own reported `usage` for that one
   question. Nothing is estimated and nothing is divided out of a total.

   ── WHAT IT CANNOT SEE ────────────────────────────────────────────────────
   Whether the ANSWERS are good. It prices five questions and reports what they
   cost; the reading of them is a person's job and is the whole reason to run
   this before switching models. It also cannot see cache reads or batch
   discounts \u2014 neither is in play here \u2014 and it cannot know whether the rates
   in RATES.json match the invoice.

   ── AND IT SERIALISES ON PURPOSE ──────────────────────────────────────────
   One question at a time, waiting for each. Five in flight at once would
   interleave their usage in a single shared counter and the per-question
   figures would be nonsense.

   OUTPUT: writes hall-bench.txt and downloads it.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  var QUESTIONS = [
    ['HALL.md only',        'what is Amenti?'],
    ['the counts',          'how many souls are on the roster?'],
    ['the doors',           'where do I find the map?'],
    ['a room + a passage',  'what does Thucydides say about the plague at Athens?'],
    /* ── CARTHAGE WAS A BAD QUESTION AND THE HALL WAS RIGHT · 9 Sep ──────
       The first run asked `does Amenti hold anything about Carthage?` on the
       assumption that nothing aboard covered it. HANNIBAL AND CAESAR BOTH HAVE
       ROOMS, Polybius on the Alps and on Cannae are in them, and the hall
       opened four works and answered well. The refusal path went untested and
       the label lied.

       THE ROSTER IS 2,043 SOULS AND ALMOST ANY FAMOUS NAME RETURNS SOMETHING.
       Moctezuma, Atahualpa, Shaka, Genghis and Leif are all on it. Polynesian
       navigation is absent from the roster AND from the library, which makes
       it a clean absence rather than a guessed one.

       A HARDER VARIANT WORTH RUNNING SEPARATELY: `what does Amenti hold on
       Moctezuma?` — he IS on the roster and has NO room and no text. The right
       answer distinguishes `named and dated here` from `there is something to
       read`, and a model that blurs the two is failing in the way that
       matters most. */
    ['honest refusal',      'does Amenti hold any text about Polynesian navigation?']
  ];

  var rates = null, ratesErr = null;

  function loadRates(then) {
    fetch(RAW + 'RATES.json?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.rates) { rates = j.rates; } else { ratesErr = 'RATES.json unreadable'; } })
      .catch(function (e) { ratesErr = e.message; })
      .then(then);
  }
  /* UNPRICED BY NAME, NEVER ZERO \u2014 the same refusal the meter keeps. */
  function rateFor(m) {
    if (!rates || !m) { return null; }
    if (rates[m]) { return rates[m]; }
    var k = Object.keys(rates);
    for (var i = 0; i < k.length; i++) { if (m.indexOf(k[i]) === 0) { return rates[k[i]]; } }
    return null;
  }
  function snap() {
    var c = window.AmentiCost || { turns: 0, inputTokens: 0, outputTokens: 0, last: null };
    return { t: c.turns, i: c.inputTokens, o: c.outputTokens,
             m: c.last && c.last.model ? c.last.model : null };
  }
  function money(n) { return n === null ? '\u2014' : '$' + (n < 0.01 ? n.toFixed(5) : n.toFixed(4)); }

  function estimate() {
    var lines = [];
    lines.push('THE HALL BENCH \u2014 five questions, asked for real.');
    lines.push('');
    lines.push('IT HAS NOT RUN. Pasting this costs nothing; running it spends.');
    lines.push('');
    var m = (window.AmentiModel && window.AmentiModel.get && window.AmentiModel.get()) || '(unknown)';
    lines.push('  model in force   ' + m);
    var r = rateFor(m);
    if (r) {
      /* the hall budgets 18,420 chars of prompt and says so in its own header */
      var per = ((18420 / 3.6 + 833) / 1e6) * r['in'] + (500 / 1e6) * r.out;
      lines.push('  rate on file     $' + r['in'] + ' in / $' + r.out + ' out per million');
      lines.push('  five asks        about ' + money(per * 5) + ', from the hall\u2019s declared budget');
      lines.push('                   \u2014 an ESTIMATE. The run reports the real figure.');
    } else {
      lines.push('  rate on file     none for this model. Tokens will be counted');
      lines.push('                   and no dollars shown.' + (ratesErr ? ' (' + ratesErr + ')' : ''));
    }
    lines.push('');
    QUESTIONS.forEach(function (q, i) {
      lines.push('   ' + (i + 1) + '  ' + q[0].padEnd(20) + q[1]);
    });
    lines.push('');
    lines.push('  HallBench.run()            ask all five and price them');
    lines.push('  HallBench.run("haiku")     the same five on a named model');
    lines.push('  HallBench.questions()      the list, to edit before running');
    return lines.join('\n');
  }

  function run(model) {
    if (!window.AmentiHall || typeof window.AmentiHall.ask !== 'function') {
      return Promise.resolve('UNREAD \u2014 window.AmentiHall.ask is absent. The hall ' +
        'is not loaded on this page, so nothing can be asked.');
    }
    if (model && window.AmentiModel && window.AmentiModel.set) {
      try { window.AmentiModel.set(model); } catch (e) {}
    }

    var L = [], rows = [];
    var say = function (s) { L.push(s == null ? '' : String(s)); };
    say('='.repeat(70));
    say('  THE HALL BENCH \u00b7 five questions, asked and priced');
    say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
    say('='.repeat(70));
    say('');
    say('  WHAT THIS CANNOT SEE');
    say('    \u00b7 Whether the answers are GOOD. It prices them; reading them is');
    say('      the point of running it and is a person\u2019s job.');
    say('    \u00b7 Whether RATES.json matches the invoice. If they disagree the');
    say('      invoice is right.');
    say('    \u00b7 Cache reads and batch discounts. Neither is in play here.');
    say('');

    var chain = Promise.resolve();
    QUESTIONS.forEach(function (q, i) {
      chain = chain.then(function () {
        var before = snap(), t0 = Date.now();
        return window.AmentiHall.ask(q[1]).then(function (res) {
          /* ── ask() RESOLVES WITH A REPORT, NOT A STRING · 9 Sep ──────────
             THE FIRST RUN PRINTED `[object Object]` FIVE TIMES. The prose is
             `.answer`; the object also carries `cited`, `opened`, `souls` and
             `degraded`, which are worth having — the citations especially,
             because whether a cheaper model still quotes a real passage is
             the question this bench exists to answer and the titles are
             right there. */
          var answer = (res && typeof res === 'object') ? (res.answer || '') : String(res || '');
          var cited = (res && res.cited) ? res.cited : [];
          var opened = (res && res.opened) ? res.opened : [];
          var degraded = (res && res.degraded && res.degraded.length) ? res.degraded : [];
          var after = snap(), ms = Date.now() - t0;
          var used = { i: after.i - before.i, o: after.o - before.o,
                       turns: after.t - before.t, m: after.m };
          var r = rateFor(used.m);
          var cost = r ? (used.i / 1e6) * r['in'] + (used.o / 1e6) * r.out : null;
          rows.push({ n: i + 1, route: q[0], q: q[1], used: used, cost: cost,
                      ms: ms, answer: String(answer || ''),
                      cited: cited, opened: opened, degraded: degraded });
        }).catch(function (e) {
          rows.push({ n: i + 1, route: q[0], q: q[1], err: String(e.message || e) });
        });
      });
    });

    return chain.then(function () {
      var ti = 0, to = 0, tc = 0, priced = 0, calls = 0;
      rows.forEach(function (x) {
        say('\u2500'.repeat(70));
        say('  ' + x.n + ' \u00b7 ' + x.route.toUpperCase());
        say('     ' + x.q);
        if (x.err) { say('     \u2716 FAILED \u2014 ' + x.err); return; }
        ti += x.used.i; to += x.used.o; calls += x.used.turns;
        if (x.cost !== null) { tc += x.cost; priced++; }
        say('     ' + x.used.i + ' in \u00b7 ' + x.used.o + ' out \u00b7 ' +
            x.used.turns + ' call' + (x.used.turns === 1 ? '' : 's') +
            ' \u00b7 ' + (x.ms / 1000).toFixed(1) + 's \u00b7 ' + money(x.cost));
        /* ── EVERY QUESTION MAKES TWO CALLS · MEASURED 9 Sep ──────────────
           The first run of this bench printed `the router opened a room, which
           is the expensive path` on ALL FIVE lines, because the router fires on
           every question and not only the ones that open something. A note that
           appears on every row is not a finding, it is furniture. It says
           something now only when the count is NOT two. */
        if (x.used.turns !== 2) {
          say('     (' + x.used.turns + ' calls, where two is the norm \u2014 router ' +
              'then answer. Worth knowing why.)');
        }
        say('     opened: ' + (x.opened.length
              ? x.opened.map(function (o) { return o.title + (o.read ? '' : ' [UNREAD]'); }).join(' \u00b7 ')
              : 'no room'));
        if (x.degraded.length) {
          say('     \u2716 degraded: ' + x.degraded.join(', ') + ' \u2014 the answer was ' +
              'built without them');
        }
        say('');
        say('     ' + x.answer.replace(/\s+/g, ' ').slice(0, 400) +
            (x.answer.length > 400 ? '\u2026' : ''));
      });
      say('\u2500'.repeat(70));
      say('');
      say('  five questions \u00b7 ' + calls + ' model calls \u00b7 ' + ti + ' in \u00b7 ' + to + ' out');
      if (priced === rows.length) {
        say('  SPENT ' + money(tc) + '   average ' + money(tc / rows.length) + ' per question');
        say('');
        /* RULE 4 \u2014 THE UNASKED COLUMN */
        say('  at this average:  1,000 asks $' + (tc / rows.length * 1000).toFixed(2) +
            '   10,000 asks $' + (tc / rows.length * 10000).toFixed(2));
        var lo = rows.reduce(function (a, b) { return (b.cost !== null && b.cost < a) ? b.cost : a; }, Infinity);
        var hi = rows.reduce(function (a, b) { return (b.cost !== null && b.cost > a) ? b.cost : a; }, 0);
        say('  cheapest ' + money(lo) + ' \u00b7 dearest ' + money(hi) +
            ' \u2014 a ' + (hi / lo).toFixed(1) + '\u00d7 spread.');
        /* ── WHAT TWO RUNS SHOWED, AND HOW THE FIRST READING WAS WRONG ────
           RUN ONE: input 7,190–7,867 across five questions, a 1.09x spread,
           and the conclusion drawn was that INPUT IS FLAT and the routes are
           not the lever.

           RUN TWO CONTRADICTED IT. One question opened four works and input
           went to 10,469 — a 1.46x spread, and that question cost 60% more
           than the cheapest. THE FIRST FIVE HAPPENED NOT TO OPEN MUCH, and a
           conclusion was drawn from the sample rather than the mechanism.

           WHAT IS ACTUALLY TRUE: the fixed block sets a floor of about 7,200
           input tokens that every ask pays, and OPENING ROOMS ADDS TO IT.
           Trimming the prompt lowers the floor for everybody; limiting how
           many works open caps the ceiling. Both are levers and the second one
           only bites on questions that reach the library.

           THE NUMBERS BELOW ARE THIS RUN AND NOT A LAW. Five questions is a
           sample, and the first sample was already misleading once. */
        var ilo = rows.reduce(function (a, b) { return b.used && b.used.i < a ? b.used.i : a; }, Infinity);
        var ihi = rows.reduce(function (a, b) { return b.used && b.used.i > a ? b.used.i : a; }, 0);
        var olo = rows.reduce(function (a, b) { return b.used && b.used.o < a ? b.used.o : a; }, Infinity);
        var ohi = rows.reduce(function (a, b) { return b.used && b.used.o > a ? b.used.o : a; }, 0);
        say('');
        say('  input  ' + ilo + '\u2013' + ihi + '  (' + (ihi / ilo).toFixed(2) + '\u00d7)   ' +
            'output ' + olo + '\u2013' + ohi + '  (' + (ohi / olo).toFixed(1) + '\u00d7)');
        var floor = ilo;
        say('  every ask pays a floor of about ' + floor + ' input tokens \u2014 the fixed');
        say('  block \u2014 and opening rooms adds to it. TRIMMING THE PROMPT LOWERS THE');
        say('  FLOOR FOR EVERYBODY; capping how many works open caps the ceiling.');
        say('  Five questions is a SAMPLE. The first one drawn from this bench said');
        say('  input was flat, and the second run disproved it.');
      } else {
        say('  ' + (rows.length - priced) + ' of ' + rows.length + ' unpriced \u2014 tokens ' +
            'are real and dollars are withheld.');
      }
      say('');
      say('  NOW READ THE ANSWERS. The cost is the easy half; whether a cheaper');
      say('  model still refuses honestly on question 5 and still quotes a real');
      say('  passage on question 4 is the half that decides.');
      say('='.repeat(70));

      var report = L.join('\n');
      try {
        var b = new Blob([report], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'hall-bench-' + (rows[0] && rows[0].used && rows[0].used.m ? rows[0].used.m : 'run') +
                     '-' + new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '') + '.txt';
        a.style.display = 'none';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        report += '\n  \u2193 written to ' + a.download + '\n';
      } catch (e) {
        report += '\n  UNREAD \u2014 could not write the .txt (' + String(e.message || e).slice(0, 50) + ')\n';
      }
      console.log(report);
      return report;
    });
  }

  window.HallBench = {
    run: run,
    questions: function () { return QUESTIONS.map(function (q) { return { route: q[0], q: q[1] }; }); },
    set: function (list) { QUESTIONS = list; return QUESTIONS.length; }
  };

  loadRates(function () { console.log(estimate()); });
})();
