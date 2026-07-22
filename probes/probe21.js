/* ===========================================================================
   PROBE 21 · THE COMPLETE CARD
   ---------------------------------------------------------------------------
   Paste into the browser console ON PAGE1. Signed in or out.

   ── WHY THIS ONE EXISTS, AND WHY THE FIRST VERSION DID NOT DESERVE TO ──

   The first draft of this probe answered a question: "why do the cards have no
   stat bars." It would have answered it once, saved perhaps ten minutes, and
   been deleted the next day. That is a diagnostic, not an instrument, and the
   Corps does not keep diagnostics.

   A probe earns its place when it catches a CLASS rather than an instance,
   runs forever at no cost, becomes MORE useful as the library grows, and
   stops something false reaching a person.

   The missing bars are an instance. The class is this:

        A CARD CAN CLAIM SOMETHING IT CANNOT SHOW.

   A card asserts, silently, that a figure exists, has a face, has a reading,
   has gates that can be opened and marks that can be earned. Every one of
   those is a promise made to a stranger before they have clicked anything.
   This probe checks every promise on every card, every time it is run, and
   it will still be doing that when the library holds eight hundred.

   ── WHAT MAKES A CARD COMPLETE ──────────────────────────────────────────
     1  A FIGURE          it names somebody
     2  A FACE            the portrait panel is not an empty frame
     3  A READING         four stat bars, because a card with a name and no
                          numbers is a placeholder wearing a border
     4  AN ERA            when and where — a figure with no era is unplaceable
     5  A GATE            at least one quiz, reachable
     6  AN HONEST COUNT   the gate count matches the gates that exist

   Any card missing 2 or 3 is not broken — it is INCOMPLETE, and the difference
   matters. Incomplete is a fact about the library. Broken is a fault in the
   code. This probe separates them, because they need different people.

   IT CHANGES NOTHING. Every line reads.
   =========================================================================== */
(async function AmentiCompleteCardProbe() {
  'use strict';

  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL)
          || 'https://amenti-mint.ingram-ian.workers.dev';

  var R = [], INCOMPLETE = [], BROKEN = [];
  var pass = function (n, d) { R.push(['PASS', n, d]); };
  var fail = function (n, d) { R.push(['FAIL', n, d]); };
  var warn = function (n, d) { R.push(['WARN', n, d]); };

  var cards = document.querySelectorAll('.roster-card');
  if (!cards.length) {
    console.log('%c PROBE 21 · no cards on this page ',
      'background:#fbbf24;color:#000;font-weight:700');
    console.log('The arena has not rendered. That is either a page still loading or a fault '
      + 'earlier than anything this probe can see — which is worth knowing, and is not a '
      + 'result this probe may report as a pass.');
    return;
  }

  /* ── WHAT THE SHIP SAYS IT HOLDS ─────────────────────────────────────
     Read from the source rather than from the page, so the page can be
     checked AGAINST something instead of only against itself. */
  var says = { topics: null, characters: null };
  try {
    var tr = await fetch(MINT + '/quiz/topics', { cache: 'no-store' });
    if (tr.ok) { var td = await tr.json(); if (td && td.ok) says.topics = td.topics || []; }
  } catch (e) {}
  try {
    var cr = await fetch(MINT + '/characters', { cache: 'no-store' });
    if (cr.ok) { var cd = await cr.json(); if (cd && cd.ok) says.characters = cd.characters || []; }
  } catch (e) {}

  /* ── EVERY CARD, EVERY PROMISE ───────────────────────────────────── */
  var byFigure = {};
  if (says.topics) says.topics.forEach(function (t) {
    var f = t.figure || (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
    (byFigure[f] = byFigure[f] || []).push(t);
  });

  Array.prototype.forEach.call(cards, function (c) {
    var fig    = c.getAttribute('data-figure');
    var topic  = c.getAttribute('data-topic');
    var face   = !!c.querySelector('.rc-img svg');
    var bars   = !!c.querySelector('.rc-attrs');
    var era    = (c.querySelector('.rc-era') || {}).textContent || '';
    var name   = (c.querySelector('.rc-name') || {}).textContent || '';
    var stated = (c.querySelector('.rc-stat') || {}).textContent || '';

    var miss = [];
    if (!fig)          BROKEN.push({ figure: '(none)', why: 'card has no data-figure — nothing can be looked up' });
    if (!name.trim())  BROKEN.push({ figure: fig, why: 'card renders no name' });
    if (!topic)        BROKEN.push({ figure: fig, why: 'card has no data-topic — clicking it can open nothing' });

    if (!face) miss.push('face');
    if (!bars) miss.push('reading');
    if (!era.trim()) miss.push('era');

    /* THE COUNT MUST BE HONEST. A card saying "4 GATES" when the library holds
       two is the same class of fault as a brief saying the library holds eight
       quizzes when it holds thirteen — a confident number nobody checked. */
    var real = (byFigure[fig] || []).length;
    var m = stated.match(/^(\d+)\s+GATES?$/i);
    if (m && real && parseInt(m[1], 10) !== real)
      BROKEN.push({ figure: fig, why: 'card says ' + m[1] + ' gates; the library holds ' + real });
    if (says.topics && real === 0)
      BROKEN.push({ figure: fig, why: 'card exists for a figure with NO quiz in the library' });

    if (miss.length) INCOMPLETE.push({ figure: fig, missing: miss.join(' + '), gates: real || '?' });
  });

  /* ── THE READING ─────────────────────────────────────────────────── */
  var n = cards.length;
  var complete = n - INCOMPLETE.length;
  pass('cards', n + ' card(s) rendered');

  if (says.topics === null) warn('library', 'could not read /quiz/topics — the gate counts on '
    + 'these cards could not be checked against anything. THAT IS A GAP IN THIS PROBE, not a pass.');
  else pass('library', says.topics.length + ' live quiz(zes) across '
    + Object.keys(byFigure).length + ' figure(s)');

  if (says.characters === null) warn('characters', 'could not read /characters — machine-made '
    + 'faces could not be accounted for.');
  else pass('characters', says.characters.length + ' machine-made character(s) offered');

  if (BROKEN.length) {
    fail('broken', BROKEN.length + ' card(s) assert something the library contradicts. '
       + 'This is a FAULT IN THE CODE, not a gap in the library.');
  } else {
    pass('broken', 'no card claims anything the library contradicts');
  }

  var pct = Math.round(complete / n * 100);
  if (INCOMPLETE.length) {
    (pct >= 80 ? warn : fail)('complete',
      complete + ' of ' + n + ' cards complete (' + pct + '%). '
      + INCOMPLETE.length + ' card(s) show a name to a stranger and little else.');
  } else {
    pass('complete', 'every card carries a face, a reading and an era');
  }

  /* WHAT IS MISSING, GROUPED — because "21 cards are incomplete" is a number
     and "21 cards have no face and no reading" is a job. */
  var kinds = {};
  INCOMPLETE.forEach(function (x) { kinds[x.missing] = (kinds[x.missing] || 0) + 1; });

  var f = R.filter(function (x) { return x[0] === 'FAIL'; }).length;
  var w = R.filter(function (x) { return x[0] === 'WARN'; }).length;
  var hue = f ? '#f87171' : (w ? '#fbbf24' : '#80ffc0');

  console.log('%c PROBE 21 · THE COMPLETE CARD ',
    'background:' + hue + ';color:#08090e;font-weight:700;padding:2px 6px');
  R.forEach(function (x) {
    console.log('%c' + x[0] + '%c ' + x[1].padEnd(12) + ' ' + x[2],
      'color:' + (x[0] === 'PASS' ? '#80ffc0' : x[0] === 'WARN' ? '#fbbf24' : '#f87171')
      + ';font-weight:700', 'color:inherit');
  });

  if (Object.keys(kinds).length) {
    console.log('%cwhat is missing, and how many:', 'color:#8f95ab;font-style:italic');
    Object.keys(kinds).sort(function (a, b) { return kinds[b] - kinds[a]; })
      .forEach(function (k) { console.log('   ' + String(kinds[k]).padStart(3) + '  ' + k); });
  }
  if (BROKEN.length) { console.log('%cBROKEN — the code is wrong:', 'color:#f87171;font-weight:700');
    console.table(BROKEN); }
  if (INCOMPLETE.length) { console.log('%cINCOMPLETE — the library is thin here:',
    'color:#fbbf24;font-weight:700'); console.table(INCOMPLETE); }

  console.log('%c' + R.filter(function (x) { return x[0] === 'PASS'; }).length
    + ' pass · ' + w + ' warn · ' + f + ' fail   ·   ' + pct + '% complete',
    'color:' + hue + ';font-weight:700');
  console.log('%cIncomplete is a fact about the library. Broken is a fault in the code. '
    + 'They need different people.', 'color:#8f95ab;font-style:italic');
})();
