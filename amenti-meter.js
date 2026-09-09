/* ============================================================================
   amenti-meter.js  →  Amenti.live/amenti-meter.js
   ----------------------------------------------------------------------------
   WHAT AN ANSWER COSTS  ·  a dial on the counter that was already turning

   hall.html has recorded `window.AmentiCost` on every proxy reply since it was
   written — turns, input tokens, output tokens, and the model that answered.
   NOTHING HAS EVER READ IT. A counter with no dial: written on every ask,
   displayed nowhere, and lost on reload.

   This is the dial. It reads what the door already records, prices it, and
   puts the number where the person spending it can see it.

   ── WHY IT MATTERS THAT THIS IS ON THE PAGE ───────────────────────────────
   The hall's prompt is budgeted to the character in amenti-hall.js — 8,600
   fixed, four passages of 780, 5,800 of sections — and every one of those
   numbers was chosen by somebody weighing evidence against wall. THEY WERE
   CHOSEN WITHOUT A PRICE IN VIEW. A slice is 780 characters; nobody could see
   what the four of them cost until the bill arrived a month later.

   ── AND IT IS HONEST ABOUT WHAT IT CANNOT SEE ─────────────────────────────
   THIS IS THIS BROWSER, THIS PAGE LOAD, AND NOBODY ELSE. It cannot see what
   visitors cost, because the visitor's tokens are counted in the visitor's
   browser and never come here. THE PROXY IS THE ONLY PLACE THAT SEES EVERY
   REQUEST, and a Worker-side tally is a different instrument that this one
   does not pretend to be.

   It also cannot see a cached read, a batch discount, or a failed call that
   burned input and returned nothing. It prices `usage` as the proxy reports
   it and no further.

   ── THE RATES ARE A REGISTER, NOT A CONSTANT ──────────────────────────────
   RATES.json at the repository root, so a price change is an edit and not a
   deploy. When it cannot be read the meter shows tokens and NO DOLLARS at
   all, and says why — a price quoted from a stale hard-coded number is worse
   than no price, because it looks like a measurement.

   ── AND IT COSTS NOTHING TO RUN ───────────────────────────────────────────
   No model call, no network beyond one small JSON, no timer when the panel is
   shut. It polls only while open, and only to notice that the counter moved.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  var panel = null, open = false, timer = null, seen = -1;
  var rates = null, ratesErr = null;

  /* the door's own default, so the meter names the right model before the
     first answer has come back */
  function modelNow() {
    var c = window.AmentiCost;
    if (c && c.last && c.last.model) { return c.last.model; }
    if (window.AmentiModel && window.AmentiModel.get) { return window.AmentiModel.get(); }
    return null;
  }

  function loadRates(then) {
    if (rates !== null || ratesErr !== null) { then(); return; }
    fetch(RAW + 'RATES.json?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.rates) { ratesErr = 'RATES.json not in the repo yet'; return; }
        rates = j;
      })
      .catch(function (e) { ratesErr = e.message; })
      .then(then);
  }

  /* A MODEL THIS FILE DOES NOT KNOW IS NOT PRICED AT ZERO. It is reported
     unpriced, by name, so the answer is `add it to RATES.json` and not a
     silently wrong total. */
  function rateFor(model) {
    if (!rates || !model) { return null; }
    if (rates.rates[model]) { return rates.rates[model]; }
    var keys = Object.keys(rates.rates);
    for (var i = 0; i < keys.length; i++) {
      if (model.indexOf(keys[i]) === 0) { return rates.rates[keys[i]]; }
    }
    return null;
  }

  function money(n) {
    if (n === null) { return '\u2014'; }
    if (n < 0.01) { return '$' + n.toFixed(5); }
    if (n < 1) { return '$' + n.toFixed(4); }
    return '$' + n.toFixed(2);
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function style() {
    if (document.getElementById('meter-css')) { return; }
    var s = document.createElement('style');
    s.id = 'meter-css';
    s.textContent = [
      '#amenti-meter{position:fixed;right:14px;bottom:14px;z-index:9999;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#7d8ea6}',
      '#amenti-meter .m-tab{background:rgba(5,8,14,.86);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:3px;padding:3px 9px;cursor:pointer;color:#5d6e84;',
      '  letter-spacing:.05em;font:inherit;display:block;margin-left:auto}',
      '#amenti-meter .m-tab:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-meter .m-tab b{color:#e0913f;font-weight:400}',
      '#amenti-meter .m-body{background:rgba(5,8,14,.94);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:4px;padding:10px 12px;',
      '  margin-bottom:6px;width:264px;box-sizing:border-box}',
      '#amenti-meter .m-h{color:#5d6e84;letter-spacing:.08em;font-size:9.5px;',
      '  padding-bottom:5px;margin-bottom:6px;',
      '  border-bottom:1px solid rgba(43,58,80,.6)}',
      '#amenti-meter .m-r{display:flex;justify-content:space-between;gap:10px}',
      '#amenti-meter .m-r span:last-child{color:#c3d3e6}',
      '#amenti-meter .m-big span:last-child{color:#e0913f;font-size:13px}',
      '#amenti-meter .m-sub{color:#4d5c70;font-size:9px;margin-top:7px;',
      '  padding-top:6px;border-top:1px solid rgba(43,58,80,.4);line-height:1.5}',
      '#amenti-meter .m-warn{color:#c99a4e}',
      '#amenti-meter .m-model{color:#7fd8f0}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function mount() {
    if (panel) { return panel; }
    style();
    panel = document.createElement('div');
    panel.id = 'amenti-meter';
    panel.innerHTML = '<div class="m-body" style="display:none"></div>' +
                      '<button type="button" class="m-tab">meter</button>';
    document.body.appendChild(panel);
    panel.querySelector('.m-tab').addEventListener('click', function () {
      open = !open;
      panel.querySelector('.m-body').style.display = open ? '' : 'none';
      if (open) { seen = -1; tick(); watch(); } else { unwatch(); }
    });
    return panel;
  }

  function reading() {
    var c = window.AmentiCost || { turns: 0, inputTokens: 0, outputTokens: 0, last: null };
    var m = modelNow();
    var r = rateFor(m);
    var cost = r ? (c.inputTokens / 1e6) * r.in + (c.outputTokens / 1e6) * r.out : null;
    var last = null;
    if (c.last && c.last.usage && r) {
      last = (c.last.usage.input_tokens / 1e6) * r.in +
             (c.last.usage.output_tokens / 1e6) * r.out;
    }
    return { c: c, m: m, r: r, cost: cost, last: last,
             per: (cost !== null && c.turns) ? cost / c.turns : null };
  }

  function tick() {
    if (!panel || !open) { return; }
    var d = reading(), b = panel.querySelector('.m-body');
    if (d.c.turns === seen && seen !== -1) { return; }
    seen = d.c.turns;

    panel.querySelector('.m-tab').innerHTML = d.c.turns
      ? 'meter \u00b7 <b>' + (d.cost === null ? d.c.turns + ' asks' : money(d.cost)) + '</b>'
      : 'meter';

    b.innerHTML =
      '<div class="m-h">this page load \u00b7 this browser</div>' +
      row('asks', num(d.c.turns)) +
      row('input tokens', num(d.c.inputTokens)) +
      row('output tokens', num(d.c.outputTokens)) +
      (d.m ? '<div class="m-r"><span>model</span><span class="m-model">' +
             esc(d.m) + '</span></div>' : '') +
      (d.r
        ? '<div class="m-sub" style="border:0;padding:0;margin:4px 0 0">$' +
          d.r['in'] + ' in / $' + d.r.out + ' out per million</div>' +
          '<div class="m-h" style="margin-top:8px"></div>' +
          rowBig('spent', money(d.cost)) +
          row('last ask', money(d.last)) +
          row('average', money(d.per))
        : '<div class="m-sub m-warn">' +
          (ratesErr ? esc(ratesErr) + '. '
                    : (d.m ? 'no rate on file for <b>' + esc(d.m) + '</b>. Add it to ' +
                             'RATES.json. ' : 'no answer yet, so no model to price. ')) +
          'TOKENS ARE REAL AND DOLLARS ARE NOT SHOWN \u2014 a price from a stale ' +
          'number looks like a measurement.</div>') +
      '<div class="m-sub">THIS BROWSER AND THIS PAGE LOAD ONLY. A visitor\u2019s ' +
      'tokens are counted in the visitor\u2019s browser and never arrive here; the ' +
      'proxy is the only place that sees every request. Cached reads and batch ' +
      'discounts are not modelled.</div>';
  }
  function row(k, v) {
    return '<div class="m-r"><span>' + k + '</span><span>' + v + '</span></div>';
  }
  function rowBig(k, v) {
    return '<div class="m-r m-big"><span>' + k + '</span><span>' + v + '</span></div>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* THE COUNTER IS A PLAIN OBJECT AND FIRES NO EVENT, so the only way to
     notice it moved is to look. Polls at 1 Hz WHILE OPEN and not at all when
     shut, and redraws only when the turn count actually changes. */
  function watch() { if (!timer) { timer = setInterval(tick, 1000); } }
  function unwatch() { if (timer) { clearInterval(timer); timer = null; } }

  function arrive() {
    if (!document.body) { setTimeout(arrive, 200); return; }
    mount();
    loadRates(function () { tick(); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrive);
  } else {
    arrive();
  }

  window.AmentiMeter = {
    open: function () { if (!open) { panel.querySelector('.m-tab').click(); } return true; },
    close: function () { if (open) { panel.querySelector('.m-tab').click(); } return false; },
    /* the whole reading, for the console */
    read: function () {
      var d = reading();
      return { asks: d.c.turns, input: d.c.inputTokens, output: d.c.outputTokens,
               model: d.m, rate: d.r, spent: d.cost, perAsk: d.per,
               note: 'this browser, this page load. The proxy sees everyone.' };
    },
    /* what a given number of asks would cost at the current rate */
    project: function (n) {
      var d = reading();
      if (d.per === null) { return { error: 'nothing priced yet' }; }
      return { asks: n, at: d.m, cost: d.per * n };
    }
  };
})();
