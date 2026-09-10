/* ============================================================================
   THE COST BENCH  ·  probes/cost-bench.js
                      →  Amenti.live/probes/cost-bench.js
   ----------------------------------------------------------------------------
   THE WORKING SURFACE FOR COST AND PERFORMANCE. Paste it once and it stays;
   everything after that is a one-word command.

   ── PASTING COSTS NOTHING ─────────────────────────────────────────────────
   It taps the door and reads. Only the commands that ASK spend, and each one
   prints its estimated cost before it runs.

       Cost.tap()          watch every call: system size, model, tokens, seconds
       Cost.now()          what this page load has spent, priced
       Cost.split()        where the money goes: router vs answer, in vs out
       Cost.prompt()       the last answer prompt, broken down by section
       Cost.compare(n)     ask the same question on two models and diff them
       Cost.report()       everything above, written to a .txt

   ── WHY A BENCH AND NOT A PROBE ───────────────────────────────────────────
   A probe answers a question once. THIS IS FOR SITTING WITH: change a model,
   trim a section, run the same question again, and read the delta. The numbers
   that matter are differences, not absolutes.

   ── WHAT IS ALREADY MEASURED, SO NOBODY RE-DERIVES IT ────────────────────
   Measured 9-10 September, on this hall, at this prompt size:

       an ask            ~$0.025      sonnet both calls
       with a haiku router ~$0.021    15% off, prose untouched
       the pair           ~7,900 input tokens, ~400 output
       the floor          ~6,700 input tokens EVERY ask pays whatever it asks
       the wall           20,000 system chars, enforced by the proxy with a 413
       spread             input 1.05-1.46x, output 3.4x
                          COST TRACKS HOW MUCH THE HALL SAYS more than which
                          route it took \u2014 but opening rooms does add.

   ── AND WHAT IT CANNOT SEE ───────────────────────────────────────────────
   \u00b7 What visitors cost. Their tokens are counted in their browsers. The proxy
     meters real usage into KV and has no read-out; that is the only instrument
     that can answer `what am I paying this month`.
   \u00b7 Whether an answer is GOOD. It prices and times them. Reading them is the
     half that decides, and it is a person's.
   \u00b7 Cache reads and batch discounts. Neither is in play here, and both would
     make the real bill LOWER \u2014 so this reads high, which is the safe direction.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var rates = null, ratesErr = null;
  var LOG = [];            /* every call seen since the tap */
  var tapped = false;

  fetch(RAW + 'RATES.json?_=' + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.rates) { rates = j.rates; } else { ratesErr = 'RATES.json unreadable'; } })
    .catch(function (e) { ratesErr = e.message; });

  /* UNPRICED BY NAME, NEVER ZERO \u2014 the refusal RATES.json requires. */
  function rateFor(m) {
    if (!rates || !m) { return null; }
    if (rates[m]) { return rates[m]; }
    var k = Object.keys(rates);
    for (var i = 0; i < k.length; i++) { if (m.indexOf(k[i]) === 0) { return rates[k[i]]; } }
    return null;
  }
  function money(n) { return n === null || n === undefined ? '\u2014' :
    '$' + (n < 0.01 ? n.toFixed(5) : n.toFixed(4)); }
  function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function out(lines) { var t = lines.join('\n'); console.log(t); return t; }

  /* ── THE TAP ───────────────────────────────────────────────────────────
     Wraps the one door. It records what went out and what came back, and
     PASSES EVERYTHING THROUGH UNCHANGED \u2014 a bench that altered a call would be
     measuring itself. */
  function tap() {
    if (tapped) { return 'already tapped \u00b7 ' + LOG.length + ' calls seen'; }
    if (!window.claude || typeof window.claude.complete !== 'function') {
      return 'UNREAD \u2014 window.claude.complete is absent. Not the hall.';
    }
    tapped = true;
    var real = window.claude.complete;
    window.__costReal = real;
    window.claude.complete = function (opts) {
      var sys = (opts && opts.system) ? String(opts.system) : '';
      var t0 = Date.now();
      var before = snap();
      var rec = {
        sys: sys.length,
        model: (opts && opts.model) || (window.AmentiModel && window.AmentiModel.get
                ? window.AmentiModel.get() : '(default)'),
        q: ((opts && opts.messages && opts.messages[0] && opts.messages[0].content) || '')
             .toString().slice(0, 70),
        /* the router is the small one and writes JSON; the answer is the large
           one. Told apart by size rather than by a flag, because nothing in
           the call says which it is. */
        kind: sys.length > 12000 ? 'answer' : 'router',
        text: sys
      };
      return real.apply(this, arguments).then(function (r) {
        var a = snap();
        rec.ms = Date.now() - t0;
        rec.inTok = a.i - before.i; rec.outTok = a.o - before.o;
        rec.reported = a.m;
        LOG.push(rec);
        return r;
      }, function (e) {
        rec.ms = Date.now() - t0; rec.failed = String(e.message || e);
        LOG.push(rec);
        throw e;
      });
    };
    return 'tapped. Ask something, then Cost.now() or Cost.split().';
  }
  function snap() {
    var c = window.AmentiCost || { inputTokens: 0, outputTokens: 0, last: null };
    return { i: c.inputTokens, o: c.outputTokens,
             m: c.last && c.last.model ? c.last.model : null };
  }

  function priced(rec) {
    var r = rateFor(rec.reported || rec.model);
    if (!r) { return null; }
    return (rec.inTok / 1e6) * r['in'] + (rec.outTok / 1e6) * r.out;
  }

  /* ── WHAT THIS PAGE LOAD HAS SPENT ─────────────────────────────────────── */
  function now() {
    var c = window.AmentiCost;
    if (!c || !c.turns) { return out(['nothing asked yet on this page load.']); }
    var r = rateFor(c.last && c.last.model);
    var cost = r ? (c.inputTokens / 1e6) * r['in'] + (c.outputTokens / 1e6) * r.out : null;
    return out([
      '  asks            ' + c.turns,
      '  input tokens    ' + num(c.inputTokens),
      '  output tokens   ' + num(c.outputTokens),
      '  model           ' + ((c.last && c.last.model) || '\u2014'),
      '  rate            ' + (r ? '$' + r['in'] + ' / $' + r.out + ' per million'
                                : 'UNPRICED \u2014 add it to RATES.json' +
                                  (ratesErr ? ' (' + ratesErr + ')' : '')),
      '  spent           ' + money(cost),
      '  per ask         ' + (cost === null ? '\u2014' : money(cost / c.turns)),
      '',
      '  1,000 asks      ' + (cost === null ? '\u2014' : money(cost / c.turns * 1000)),
      '  10,000 asks     ' + (cost === null ? '\u2014' : money(cost / c.turns * 10000))
    ]);
  }

  /* ── WHERE THE MONEY GOES ──────────────────────────────────────────────
     THE ONLY VIEW THAT TELLS YOU WHAT TO CHANGE. A total says how much; this
     says which half, and which direction. */
  function split() {
    if (!LOG.length) { return out(['nothing seen. Cost.tap() first, then ask.']); }
    var g = { router: { n: 0, i: 0, o: 0, ms: 0, c: 0, priced: 0 },
              answer: { n: 0, i: 0, o: 0, ms: 0, c: 0, priced: 0 } };
    LOG.forEach(function (r) {
      var b = g[r.kind]; if (!b) { return; }
      b.n++; b.i += r.inTok || 0; b.o += r.outTok || 0; b.ms += r.ms || 0;
      var p = priced(r); if (p !== null) { b.c += p; b.priced++; }
    });
    var tot = g.router.c + g.answer.c;
    var L = ['  call     n   input    output   seconds   cost      share'];
    ['router', 'answer'].forEach(function (k) {
      var b = g[k];
      if (!b.n) { return; }
      L.push('  ' + k.padEnd(8) + String(b.n).padStart(2) + '  ' +
             num(b.i).padStart(7) + '  ' + num(b.o).padStart(7) + '   ' +
             (b.ms / 1000 / b.n).toFixed(1).padStart(6) + '   ' +
             money(b.c).padStart(8) + '   ' +
             (tot ? (b.c / tot * 100).toFixed(0) + '%' : '\u2014'));
    });
    L.push('');
    var ti = g.router.i + g.answer.i, to = g.router.o + g.answer.o;
    var r = rateFor(LOG[LOG.length - 1].reported || LOG[LOG.length - 1].model);
    if (r && ti) {
      var ci = (ti / 1e6) * r['in'], co = (to / 1e6) * r.out;
      L.push('  input  ' + num(ti) + ' tokens \u00b7 ' + money(ci) + '   (' +
             (ci / (ci + co) * 100).toFixed(0) + '% of spend)');
      L.push('  output ' + num(to) + ' tokens \u00b7 ' + money(co) + '   (' +
             (co / (ci + co) * 100).toFixed(0) + '% of spend)');
      L.push('');
      L.push('  OUTPUT COSTS FIVE TIMES INPUT PER TOKEN and there is far less of');
      L.push('  it. If input dominates, the lever is the PROMPT. If output does,');
      L.push('  the lever is asking the hall to say less.');
    }
    return out(L);
  }

  /* ── THE LAST PROMPT, BY SECTION ───────────────────────────────────────
     What is actually being paid for. On 9 September this showed HALL.md at
     8,453 of 20,286 \u2014 42% of the wall spent saying what Amenti is, in a
     question about Polynesian navigation. THAT IS THE KIND OF THING ONLY THIS
     VIEW SHOWS. */
  function prompt() {
    var a = LOG.filter(function (r) { return r.kind === 'answer'; }).pop();
    if (!a) { return out(['no answer call seen yet. Cost.tap(), then ask.']); }
    var parts = a.text.split(/^=== /m);
    var L = ['  the last answer prompt \u00b7 ' + num(a.sys) + ' chars of a 20,000 wall',
             '  "' + a.q + '"', ''];
    parts.forEach(function (p, i) {
      var name = i === 0 ? '(preamble)' : p.split('\n')[0].replace(/ ===.*$/, '');
      L.push('  ' + num(p.length).padStart(6) + '  ' +
             (a.sys ? (p.length / a.sys * 100).toFixed(0) + '%' : '').padStart(4) +
             '  ' + name.slice(0, 54));
    });
    L.push('');
    L.push('  every ask pays this whether or not it needs it. A section that is');
    L.push('  large AND not always needed is a candidate for the same treatment');
    L.push('  HALL.md got on 10 September: sent only when the question reaches it.');
    return out(L);
  }

  /* ── THE SAME QUESTION, TWO MODELS ─────────────────────────────────────
     IT SPENDS, AND IT SAYS SO FIRST. The cost is the easy half; whether the
     cheaper answer still quotes a real passage and still refuses honestly is
     the half that decides, so it prints both answers in full. */
  function compare(q, a, b) {
    q = q || 'what does Thucydides say about the plague at Athens?';
    a = a || 'claude-sonnet-4-6';
    b = b || 'claude-haiku-4-5-20251001';
    if (!window.AmentiHall || !window.AmentiHall.ask) {
      return Promise.resolve(out(['UNREAD \u2014 AmentiHall.ask absent.']));
    }
    console.log('  asking the same question on ' + a + ' and ' + b + '.');
    console.log('  TWO ASKS, ABOUT FIVE CENTS. Read the answers, not the prices.');
    var res = [];
    var run = function (m) {
      var i0 = LOG.length;
      if (window.AmentiModel && window.AmentiModel.set) {
        try { window.AmentiModel.set(m); } catch (e) {}
      }
      var t0 = Date.now();
      return window.AmentiHall.ask(q).then(function (r) {
        var mine = LOG.slice(i0);
        var cost = mine.reduce(function (s, x) { var p = priced(x); return s + (p || 0); }, 0);
        res.push({ model: m, ms: Date.now() - t0, cost: cost,
                   inTok: mine.reduce(function (s, x) { return s + (x.inTok || 0); }, 0),
                   outTok: mine.reduce(function (s, x) { return s + (x.outTok || 0); }, 0),
                   opened: ((r && r.opened) || []).map(function (o) { return o.title; }),
                   answer: (r && r.answer) || '' });
      }).catch(function (e) { res.push({ model: m, err: String(e.message || e) }); });
    };
    return run(a).then(function () { return run(b); }).then(function () {
      var L = ['', '  "' + q + '"', ''];
      res.forEach(function (x) {
        L.push('\u2500'.repeat(72));
        L.push('  ' + x.model);
        if (x.err) { L.push('     FAILED \u2014 ' + x.err); return; }
        L.push('     ' + money(x.cost) + '  \u00b7  ' + (x.ms / 1000).toFixed(1) + 's  \u00b7  ' +
               num(x.inTok) + ' in / ' + num(x.outTok) + ' out');
        L.push('     opened: ' + (x.opened.length ? x.opened.join(' \u00b7 ') : 'no room'));
        L.push('');
        L.push('     ' + x.answer.replace(/\s+/g, ' ').slice(0, 700) +
               (x.answer.length > 700 ? '\u2026' : ''));
      });
      if (res.length === 2 && !res[0].err && !res[1].err && res[0].cost) {
        L.push('\u2500'.repeat(72));
        L.push('  ' + res[1].model + ' is ' +
               (100 - res[1].cost / res[0].cost * 100).toFixed(0) + '% cheaper and ' +
               (res[0].ms / res[1].ms).toFixed(1) + '\u00d7 the speed.');
        L.push('');
        L.push('  DID IT OPEN THE SAME ROOMS? If not, the router or the reading');
        L.push('  changed and the saving is not free. THAT IS THE WHOLE TEST.');
      }
      return out(L);
    });
  }

  function report() {
    var L = ['THE COST BENCH \u00b7 ' + new Date().toISOString().slice(0, 16),
             '', '\u2500\u2500 THIS PAGE LOAD ' + '\u2500'.repeat(50), now(),
             '', '\u2500\u2500 WHERE THE MONEY GOES ' + '\u2500'.repeat(45), split(),
             '', '\u2500\u2500 THE LAST PROMPT ' + '\u2500'.repeat(50), prompt(),
             '', '\u2500\u2500 WHAT THIS CANNOT SEE ' + '\u2500'.repeat(45),
             '  visitors \u2014 their tokens are counted in their browsers and never',
             '  arrive here. The proxy meters real usage into KV and has no',
             '  read-out. That is the only instrument that can answer',
             '  `what am I paying this month`.'];
    var t = L.join('\n');
    try {
      var b = new Blob([t], { type: 'text/plain' });
      var el = document.createElement('a');
      el.href = URL.createObjectURL(b);
      el.download = 'cost-bench-' + new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '') + '.txt';
      el.click();
    } catch (e) {}
    return t;
  }

  window.Cost = {
    tap: tap, now: now, split: split, prompt: prompt,
    compare: compare, report: report,
    calls: function () { return LOG.map(function (r) {
      return { kind: r.kind, model: r.reported || r.model, sys: r.sys,
               inTok: r.inTok, outTok: r.outTok, ms: r.ms, cost: priced(r) };
    }); },
    reset: function () { LOG = []; return 'cleared'; }
  };

  console.log([
    'THE COST BENCH is loaded. Pasting cost nothing.',
    '',
    '   Cost.tap()        watch every call \u2014 do this first',
    '   Cost.now()        what this page load has spent',
    '   Cost.split()      router vs answer, input vs output',
    '   Cost.prompt()     the last prompt, section by section',
    '   Cost.compare()    same question, two models  (SPENDS ~5c)',
    '   Cost.report()     all of it, written to a .txt',
    '',
    '   measured 9-10 Sep: ~$0.025 an ask \u00b7 ~6,700 token floor \u00b7 20,000 char wall'
  ].join('\n'));
})();
