/* ============================================================================
   METER PROBE  ·  probes/meter-probe.js  →  Amenti.live/probes/meter-probe.js
   ----------------------------------------------------------------------------
   Paste into the browser console on hall.html.

   THE METER IS THE ONE INSTRUMENT ON THIS SHIP THAT REPORTS MONEY, and money
   is the reading a person will act on without checking. A map that draws a
   pin in the wrong bay is caught by eye. A meter that reads $0.008 when the
   bill says $0.025 is believed until the invoice arrives a month later.

   So this probe does not ask whether the meter runs. It asks WHETHER ITS
   ARITHMETIC IS RIGHT, and it recomputes every figure independently from the
   same two inputs — window.AmentiCost and RATES.json — rather than reading the
   number the meter printed and agreeing with it.

   ── AND IT CHECKS THE REFUSALS, NOT ONLY THE SUMS ─────────────────────────
   RATES.json states three things the meter must refuse to do, and a refusal
   that is never tested is a comment:

       a model with no rate is UNPRICED BY NAME, never priced at zero
       cached reads and batch discounts are NOT modelled, so it reads HIGH
       it is THIS BROWSER AND THIS PAGE LOAD and must say so on its face

   Section 4 drives an unknown model through the pricing path and fails the
   probe if a dollar figure comes back.

   ── WHAT IT CANNOT SEE ────────────────────────────────────────────────────
   Whether the rates are TRUE. RATES.json says in its own header that they were
   read from third-party trackers and not from an invoice, and that if the
   meter and the invoice disagree THE INVOICE IS RIGHT. This probe checks that
   the meter multiplies correctly by the numbers on file. It cannot check the
   numbers on file.

   ── DOCTRINE ─────────────────────────────────────────────────────────────
   1 · REAL DATA. Every figure read off the live page in the state you are in.
   2 · ATTRIBUTE, NEVER INFER. Where the meter and this disagree, name which
       input the difference came from.
   3 · A MISSING SIGNAL IS NOT A RED LIGHT. No ask yet means UNREAD, not fault.
   4 · RETURN TEN TIMES WHAT IT COST. Findings, not confirmations.

   OUTPUT: writes meter-probe.txt and downloads it. One paste.
   ========================================================================== */
(function meterProbe() {
  var L = [], UNREAD = [], FAULT = 0;
  var say = function (m) { L.push(m == null ? '' : String(m)); };
  var head = function (m) { L.push(''); L.push('\u2500\u2500 ' + m + ' ' +
                 '\u2500'.repeat(Math.max(0, 62 - m.length))); };
  var blind = function (w, why) { UNREAD.push(w + '  \u2014 ' + why); };
  var bad = function (m) { FAULT++; say('  \u2716 ' + m); };
  var $ = function (s) { return document.querySelector(s); };

  say('='.repeat(66));
  say('  METER PROBE \u00b7 the arithmetic, not the appearance');
  say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
  say('='.repeat(66));

  /* ── 0 · WHAT THIS CANNOT SEE ──────────────────────────────────────────── */
  head('0 \u00b7 WHAT THIS CANNOT SEE \u2014 read before weighing anything below');
  say('  \u00b7 Whether the rates are TRUE. RATES.json says they came from');
  say('    third-party trackers and not an invoice. This checks the meter');
  say('    multiplies correctly BY THE NUMBERS ON FILE; the file may be wrong.');
  say('  \u00b7 What visitors cost. Their tokens are counted in their browsers and');
  say('    never arrive here. Only the proxy sees every request.');
  say('  \u00b7 Whether the proxy reported `usage` honestly. Everything below rests');
  say('    on what came back through the door.');
  say('  \u00b7 Cache reads and batch discounts. Neither is modelled, by design.');

  var M = window.AmentiMeter, C = window.AmentiCost;
  if (!M) {
    say('');
    say('  UNREAD \u2014 window.AmentiMeter is absent. Either amenti-meter.js is not');
    say('  loaded on this page, or it threw before it published. Nothing below');
    say('  can be measured.');
    return L.join('\n');
  }

  /* ── 1 · WHAT IS ON THE PAGE ───────────────────────────────────────────── */
  head('1 \u00b7 THE INSTRUMENT ITSELF');
  var panel = $('#amenti-meter'), tab = $('#amenti-meter .m-tab'),
      body = $('#amenti-meter .m-body');
  say('  panel mounted   ' + (panel ? 'yes' : 'NO'));
  say('  tab             ' + (tab ? '"' + tab.textContent.trim() + '"' : 'ABSENT'));
  say('  body            ' + (body ? (body.style.display === 'none' ? 'shut' : 'open') : 'ABSENT'));
  if (!panel) { bad('no #amenti-meter in the DOM though the module published.'); }

  var r = M.read ? M.read() : null;
  if (!r) { blind('read()', 'AmentiMeter.read() is absent'); }

  /* ── 2 · THE COUNTER, AND WHETHER THE METER READ IT WHOLE ──────────────── */
  head('2 \u00b7 THE COUNTER BEHIND IT');
  if (!C) {
    say('  window.AmentiCost is absent \u2014 NO ASK HAS BEEN ANSWERED on this page');
    say('  load. That is the starting state and not a fault.');
    blind('every arithmetic check below', 'nothing has been spent yet; ask a ' +
          'question in the box and run this again');
  } else {
    say('  turns           ' + C.turns);
    say('  input tokens    ' + C.inputTokens);
    say('  output tokens   ' + C.outputTokens);
    say('  last model      ' + (C.last && C.last.model ? C.last.model : '\u2014'));
    if (r) {
      if (r.asks !== C.turns) { bad('read().asks ' + r.asks + ' \u2260 AmentiCost.turns ' + C.turns); }
      if (r.input !== C.inputTokens) { bad('read().input \u2260 AmentiCost.inputTokens'); }
      if (r.output !== C.outputTokens) { bad('read().output \u2260 AmentiCost.outputTokens'); }
    }
    if (C.turns > 0 && C.inputTokens === 0) {
      bad('turns is ' + C.turns + ' and inputTokens is 0. THE DOOR COUNTED A ' +
          'CALL AND NOT ITS TOKENS \u2014 the proxy may not be returning `usage`.');
    }
  }

  /* ── 3 · THE ARITHMETIC, RECOMPUTED ────────────────────────────────────── */
  head('3 \u00b7 THE ARITHMETIC, DONE AGAIN FROM THE SAME INPUTS');
  var done = false;
  if (r && r.rate && C && C.turns > 0) {
    var mine = (C.inputTokens / 1e6) * r.rate['in'] + (C.outputTokens / 1e6) * r.rate.out;
    var per = mine / C.turns;
    say('  rate on file    $' + r.rate['in'] + ' in / $' + r.rate.out + ' out per million');
    say('  meter says      spent $' + (r.spent === null ? '\u2014' : r.spent.toFixed(6)) +
        '   per ask $' + (r.perAsk === null ? '\u2014' : r.perAsk.toFixed(6)));
    say('  this probe      spent $' + mine.toFixed(6) + '   per ask $' + per.toFixed(6));
    var d = Math.abs((r.spent || 0) - mine);
    if (d > 1e-9) {
      bad('the two disagree by $' + d.toFixed(8) + '. The inputs are identical, ' +
          'so the difference is in the meter\u2019s multiplication and not in the data.');
    } else {
      say('  they agree to the cent and beyond.');
    }
    done = true;

    /* RULE 4 \u2014 THE UNASKED COLUMN. What the reading implies at volume, which
       is the number a person is actually deciding with. */
    say('');
    say('  at this average:');
    [100, 1000, 10000].forEach(function (n) {
      say('     ' + String(n).padStart(6) + ' asks   $' + (per * n).toFixed(2));
    });
    if (M.project) {
      var p = M.project(1000);
      if (p && typeof p.cost === 'number' && Math.abs(p.cost - per * 1000) > 1e-6) {
        bad('project(1000) says $' + p.cost.toFixed(4) + ' and the average implies $' +
            (per * 1000).toFixed(4));
      }
    }
  } else if (r && !r.rate && r.model) {
    say('  the meter holds NO RATE for ' + r.model + ', so it shows no dollars.');
    say('  That is the refusal working. Add the model to RATES.json to price it.');
  } else {
    blind('the arithmetic', 'no priced ask yet');
    say('  not run.');
  }

  /* ── 4 · THE REFUSALS ──────────────────────────────────────────────────── */
  head('4 \u00b7 THE REFUSALS, DRIVEN');
  /* A REFUSAL THAT IS NEVER TESTED IS A COMMENT. This forges a model the file
     cannot know and checks that the meter withholds dollars rather than
     quietly pricing it at zero \u2014 which would read as `free` on a paid door. */
  if (!C) {
    blind('the unknown-model refusal', 'no AmentiCost object to work against');
  } else {
    var keep = C.last;
    C.last = { model: 'claude-not-a-real-model-9', usage: { input_tokens: 1000, output_tokens: 100 }, at: Date.now() };
    var forged = M.read();
    C.last = keep;
    say('  forged model    ' + forged.model);
    say('  rate found      ' + (forged.rate ? JSON.stringify(forged.rate) : 'none'));
    say('  dollars shown   ' + (forged.spent === null ? 'NONE \u2014 correct' : '$' + forged.spent));
    if (forged.rate) {
      bad('a model that does not exist matched a rate. The prefix match in ' +
          'rateFor() is too loose and WILL PRICE THE WRONG MODEL.');
    }
    if (forged.spent !== null) {
      bad('an unpriced model produced a dollar figure. RATES.json requires ' +
          'UNPRICED BY NAME, NEVER ZERO \u2014 a paid door reading `free` is the ' +
          'worst failure this instrument has.');
    }
    if (!forged.rate && forged.spent === null) {
      say('  the refusal holds: unknown model, tokens counted, dollars withheld.');
    }
  }

  /* the panel must say what it cannot see, on its own face */
  var txt = body ? body.textContent : '';
  if (body) {
    var admits = /this page load|this browser/i.test(txt);
    say('  admits its scope on the panel: ' + (admits ? 'yes' : 'NO'));
    if (!admits) {
      bad('the panel does not say it is one browser and one page load. A ' +
          'session total that looks like a business total is the wrong ' +
          'instrument to leave unlabelled.');
    }
  } else {
    blind('the scope sentence', 'the panel body is not open \u2014 click the tab and re-run');
  }

  /* ── 5 · WHAT NO METER CAN ANSWER ──────────────────────────────────────── */
  head('5 \u00b7 THE QUESTION THIS INSTRUMENT CANNOT ANSWER');
  say('  What every visitor has cost, all time.');
  say('  A visitor\u2019s tokens are counted in the visitor\u2019s browser and never');
  say('  arrive here. THE PROXY IS THE ONLY PLACE THAT SEES EVERY REQUEST and');
  say('  it counts nothing \u2014 GET returns 405. That is SLIP #87 and it is');
  say('  unstarted. Every ask before it begins counting is gone.');
  if (C && C.turns) {
    say('');
    say('  And this page load is not a sample of anything: it is you, testing.');
  }

  /* ── PRINT ─────────────────────────────────────────────────────────────── */
  var out = ['', '='.repeat(66), L.join('\n'), ''];
  out.push('\u2500\u2500 UNREAD ' + '\u2500'.repeat(55));
  out.push(UNREAD.length
    ? '  ' + UNREAD.join('\n  ') +
      '\n  \u2014 things this probe COULD NOT SEE. None is a fault.'
    : '  nothing \u2014 every test had something real to measure.');
  out.push('');
  out.push(FAULT ? '  ' + FAULT + ' FINDING' + (FAULT === 1 ? '' : 'S') + ' above.'
                 : '  no finding \u2014 the meter\u2019s arithmetic and its refusals both hold.');
  out.push('='.repeat(66));
  var report = out.join('\n');

  try {
    var blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'meter-probe-' + new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '') + '.txt';
    a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    report += '\n  \u2193 written to ' + a.download + '\n';
  } catch (e) {
    report += '\n  UNREAD \u2014 could not write the .txt (' + String(e.message || e).slice(0, 60) + ').\n' +
              '  The report above is complete; only the download was refused.\n';
  }
  return report;
})();
