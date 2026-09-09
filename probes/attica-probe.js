/* ============================================================================
   ATTICA PROBE  ·  probes/attica-probe.js  →  Amenti.live/probes/attica-probe.js
   ----------------------------------------------------------------------------
   Paste into the browser console on hall.html with ATTICA OPEN.

   WHAT THIS IS FOR. probe-attica.mjs reads the five registers and cross-
   examines them, and its own Section 0 says what it cannot see:

       A REGISTER CAN BE PERFECT AND THE SURFACE STILL SHOW NOTHING.

   On 9 September that happened twice in one evening. The washes ignored their
   own switch, so turning `ground` off hid its pins and left 89 areas drawn —
   and the legend's census summed to 1,566 when the register held 1,655,
   because the washes were never counted either. Then the tour reader opened on
   a bare-terrain frame, was closed, and left every switch off; the panes went
   on describing a healthy register behind an empty screen.

   BOTH WERE DRAWING FAULTS AND NO FILE PROBE COULD HAVE CAUGHT EITHER. The
   world map has map-probe.js and the hall has hall-probe.js. This surface —
   three modules, twelve switches, two clocks, a camera and a tour reader — had
   nothing reading its DOM. This is that.

   ── IT IS WRITTEN TO THE DOCTRINE ────────────────────────────────────────
   1 · REAL DATA. Every number is read off the live DOM in the state you are
       standing in. Nothing is simulated and nothing is assumed from the source.
   2 · ATTRIBUTE, NEVER INFER. Where a measurement disagrees with an intention,
       it names WHICH MECHANISM WON, not merely that something is wrong.
   3 · A MISSING SIGNAL IS NOT A RED LIGHT. Anything it cannot measure is
       reported UNREAD, with the reason. Blindness never becomes a fault.
   4 · RETURN TEN TIMES WHAT IT COST. It reports findings and not
       confirmations. A test that passes says one short line.

   ── AND IT IS THE ONE PROBE HERE THAT TOUCHES THE SURFACE ────────────────
   Section 3 cannot be measured by watching. To know whether a switch governs
   its marks, the switch has to be moved and the marks counted. So this probe
   FLIPS SWITCHES, and it is honest about it: it records the reader's state
   first, drives the switches, and puts the state back before it returns. That
   is the same borrow-and-give-back rule the tour reader had to learn.

   IF IT IS INTERRUPTED MID-RUN the surface may be left switched off. The pane
   will say so — `EVERY PLACE SWITCH IS OFF` — and `AmentiAttica.marks('*')`
   restores it. Stated here rather than glossed, because the line is real and
   this is standing on it.
   ========================================================================== */
(function atticaProbe() {
  var L = [], UNREAD = [];
  var say   = function (m) { L.push(m == null ? '' : String(m)); };
  var head  = function (m) { L.push(''); L.push('\u2500\u2500 ' + m + ' ' +
                 '\u2500'.repeat(Math.max(0, 62 - m.length))); };
  var blind = function (what, why) { UNREAD.push(what + '  \u2014 ' + why); };
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var n2 = function (v) { return Math.round(v * 100) / 100; };

  var el = $('#amenti-attica');
  if (!el) {
    return '\n  UNREAD \u2014 no #amenti-attica on this page. Open hall.html.\n';
  }
  if (!document.body.classList.contains('scene-attica')) {
    return '\n  UNREAD \u2014 Attica is CLOSED. Press its button in the faculty rail, then ' +
           'run this again.\n  Nothing below can be measured on a surface that is not ' +
           'rendering.\n';
  }
  var A = window.AmentiAttica;
  var svg = $('svg', el);
  if (!svg) { return '\n  UNREAD \u2014 no <svg>. The surface mounted but did not build.\n'; }

  say('='.repeat(66));
  say('  ATTICA PROBE \u00b7 the drawing, not the registers');
  say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
  say('='.repeat(66));

  /* ── 0 · WHAT THIS CANNOT SEE ─────────────────────────────────────────── */
  head('0 \u00b7 WHAT THIS CANNOT SEE \u2014 read before weighing anything below');
  say('  \u00b7 Whether a coordinate is RIGHT. It checks that what is drawn matches');
  say('    what the register holds. Pleiades could put Marathon in Boeotia and');
  say('    every test here would pass. That is probe-attica.mjs\u2019 question.');
  say('  \u00b7 Whether a `why` sentence or a caption is TRUE. Both files say in');
  say('    their own headers that they are unverified drafts.');
  say('  \u00b7 Whether the ground image is correct. It measures marks and panes,');
  say('    not pixels.');
  say('  \u00b7 Anything at a zoom or year other than the one you are standing in.');

  /* ── 1 · THE STATE YOU ARE STANDING IN ────────────────────────────────── */
  head('1 \u00b7 THE STATE THIS WAS MEASURED IN');
  var tf = ($('.at-view', el) || svg).getAttribute('transform') || '';
  var K  = parseFloat((tf.match(/scale\(([-\d.]+)\)/) || [])[1] || '1');
  var lit = $('.at-ctl button[data-p][aria-pressed="true"]', el);
  var scrub = $('.at-scrub', el);
  var clockOff = $('.at-clockoff', el);
  var periodKey = lit ? lit.getAttribute('data-p') : '(none lit)';
  var clockOn = clockOff ? clockOff.getAttribute('aria-pressed') !== 'true' : null;
  say('  zoom K            ' + n2(K));
  say('  period            ' + periodKey);
  say('  clock             ' + (clockOn === null ? 'UNREAD'
        : clockOn ? 'on, year ' + (scrub ? scrub.value : '?') : 'off \u2014 the whole period'));
  if (!lit) { blind('which period is lit', 'no .at-ctl button carries aria-pressed="true"'); }

  var keyRows = $$('.at-key [data-m]', el);
  var onKeys = [], offKeys = [];
  keyRows.forEach(function (d) {
    (d.getAttribute('aria-pressed') === 'false' ? offKeys : onKeys)
      .push(d.getAttribute('data-m'));
  });
  say('  switches on       ' + (onKeys.length ? onKeys.join(' ') : 'NONE'));
  say('  switches off      ' + (offKeys.length ? offKeys.join(' ') : 'none'));
  if (!keyRows.length) { blind('the legend switches', 'no [data-m] rows in .at-key'); }

  /* ── 2 · WHAT IS ON SCREEN AGAINST WHAT THE PANES CLAIM ───────────────── */
  head('2 \u00b7 THE PANES AGAINST THE DRAWING');
  var pins = $$('.at-pin', el).length;
  var washes = $$('.at-wash', el).length;
  var evs = $$('.at-events [data-k], .at-events g', el).length;
  var mvs = $$('.at-moves path, .at-moves g', el).length;
  say('  drawn: ' + pins + ' pins \u00b7 ' + washes + ' washes \u00b7 ' +
      evs + ' event nodes \u00b7 ' + mvs + ' move nodes');

  var census = {}, censusSum = 0;
  $$('.at-key b[data-n]', el).forEach(function (b) {
    var k = b.getAttribute('data-n'), n = parseInt(b.textContent, 10) || 0;
    census[k] = n;
    if (k !== 'events' && k !== 'moves') { censusSum += n; }
  });
  var cnt = A && A.count ? A.count() : null;
  say('  legend census sums to  ' + censusSum);
  if (cnt && typeof cnt.shown === 'number') {
    say('  count().shown          ' + cnt.shown +
        (censusSum === cnt.shown ? '   agree'
          : '   \u2716 THE CENSUS AND THE REGISTER DISAGREE BY ' +
            Math.abs(censusSum - cnt.shown) + ' \u2014 something alive is in no row ' +
            'of the key. This is the shape of the wash-tally fault of 9 Sep.'));
    say('  count(): ' + JSON.stringify(cnt));
  } else {
    blind('count()', 'AmentiAttica.count() unavailable or returned null');
  }

  /* THE FAULT THAT COST TWENTY MINUTES. A surface drawing nothing with every
     pane describing a healthy register. The note now carries a sentence for
     it; this checks that the sentence is actually there when it should be. */
  var noteTxt = ($('.at-note', el) || {}).textContent || '';
  var allOff = keyRows.length > 0 && onKeys.length === 0;
  var nothingDrawn = (pins + washes) === 0;
  if (allOff || nothingDrawn) {
    var admits = /SWITCH(ES)? IS OFF|SWITCHES OFF|switch is off|switches off/i.test(noteTxt);
    say('  surface is EMPTY (' + (allOff ? 'every switch off' : 'no marks drawn') + ')');
    say('  does .at-note admit it?  ' + (admits ? 'yes'
        : '\u2716 NO \u2014 an empty surface with no sentence explaining it. This is ' +
          'exactly the 9 Sep fault: the panes described the register and not ' +
          'the state, and a switched-off map read as a broken one.'));
  } else {
    say('  surface is drawing \u2014 the empty-state sentence is not expected');
  }

  /* ── 3 · DOES A SWITCH ACTUALLY GOVERN ITS MARKS ──────────────────────── */
  head('3 \u00b7 THE SWITCHES, DRIVEN AND MEASURED');
  if (!A || typeof A.marks !== 'function') {
    blind('the switch test', 'AmentiAttica.marks() is not exported \u2014 needs the 8 Sep build');
    say('  not run.');
  } else {
    var restore = onKeys.length ? onKeys.join('|') : '-';
    var drawn = function () { return $$('.at-pin', el).length + $$('.at-wash', el).length; };
    var faults = 0;

    A.marks('*');
    var all = { pin: $$('.at-pin', el).length, wash: $$('.at-wash', el).length };
    A.marks('-');
    var none = { pin: $$('.at-pin', el).length, wash: $$('.at-wash', el).length };
    say('  all switches on   ' + all.pin + ' pins, ' + all.wash + ' washes');
    say('  all switches off  ' + none.pin + ' pins, ' + none.wash + ' washes');
    if (none.pin || none.wash) {
      faults++;
      say('  \u2716 A MARK IS ESCAPING THE LEGEND. ' + none.pin + ' pins and ' +
          none.wash + ' washes draw with every switch off. The switch is not the');
      say('    thing that governs them, whatever the legend implies.');
    }

    /* each key alone — the per-mark version of the same question */
    var perKey = [];
    (A.switches ? A.switches() : []).forEach(function (k) {
      if (k === 'events' || k === 'moves') { return; }
      A.marks(k);
      var d = drawn();
      perKey.push(k + '=' + d);
      if (d === 0 && (census[k] || 0) > 0) {
        faults++;
        say('  \u2716 ' + k + ': the census says ' + census[k] +
            ' and NOTHING DRAWS with only that switch on.');
      }
      if (d > (census[k] || 0) && (census[k] || 0) > 0) {
        faults++;
        say('  \u2716 ' + k + ': ' + d + ' drawn against a census of ' + census[k] +
            ' \u2014 more on screen than the key admits to.');
      }
    });
    say('  per switch: ' + perKey.join('  '));
    A.marks(restore);
    say('  restored to: ' + restore);
    if (!faults) { say('  no switch fault \u2014 every mark answers to its own row.'); }
  }

  /* -- 3b . DOES EVERY CONTROL AGREE WITH THE STATE IT CONTROLS ----------
     Found 9 September BY EYE, in a screenshot: the heading read CLASSICAL
     550-330 BC while the lit period button read HELLENISTIC, because a tour
     frame had set the period and aria-pressed was only ever written by the
     click handler.

     A CONTROL THAT DISAGREES WITH ITS OWN STATE IS WORSE THAN A MISSING ONE.
     A reader trusts the lit button over the heading, and both were on screen
     saying different things. This drives each period in turn and checks that
     the button and the register move together. */
  head('3b \u00b7 THE CONTROLS AGAINST THE STATE');
  if (!A || typeof A.period !== 'function' || !A.periods) {
    blind('the control test', 'AmentiAttica.period() or periods() unavailable');
    say('  not run.');
  } else {
    var back = (periodKey === '(none lit)') ? 'all' : periodKey;
    var wrong = 0;
    A.periods().forEach(function (p) {
      var got = A.period(p);
      var b = $('.at-ctl button[data-p="' + p + '"]', el);
      var litNow = $('.at-ctl button[data-p][aria-pressed="true"]', el);
      if (!b || b.getAttribute('aria-pressed') !== 'true' ||
          !litNow || litNow.getAttribute('data-p') !== p) {
        wrong++;
        say('  \u2716 period(' + p + '): the register moved to ' +
            (got && got.key) + ' and the lit button says ' +
            (litNow ? litNow.getAttribute('data-p') : 'NONE'));
      }
    });
    A.period(back);
    say(wrong ? '  ' + wrong + ' period(s) leave their button behind.'
              : '  every period moves its button and the register together.');
    say('  restored to: ' + back);
  }

  /* ── 4 · EVERY MARK RESOLVES TO A ROW ─────────────────────────────────── */
  head('4 \u00b7 MARKS WITHOUT KEYS');
  var noKey = $$('.at-pin, .at-wash', el).filter(function (n) {
    var k = n.getAttribute('data-k');
    return !k || !k.trim();
  }).length;
  say(noKey ? '  \u2716 ' + noKey + ' marks carry no data-k \u2014 they cannot be hovered, ' +
              'and nothing they show can be traced to a row.'
            : '  every mark carries a data-k.');

  /* ── 5 · THE PANES, AND WHETHER THEY OVERLAP ──────────────────────────── */
  head('5 \u00b7 THE PANES, AND WHETHER ANY OVERLAPS ANOTHER');
  /* .at-frames joined the left edge on 9 September and immediately ran down
     over the note on a tall window. A PANE THAT CAN MOVE MUST BE IN THIS TEST,
     or the test only covers the panes that have already misbehaved. */
  var stack = ['.at-ctl', '.at-clock', '.at-note', '.att-band', '.at-frames',
               '.at-key', '.at-list'];
  var boxes = [];
  stack.forEach(function (s) {
    var n = $(s, el);
    if (!n || n.offsetParent === null) { return; }
    var r = n.getBoundingClientRect();
    if (!r.height) { return; }
    boxes.push({ s: s, top: r.top, bot: r.bottom, l: r.left, rt: r.right });
    say('  ' + (s + '            ').slice(0, 12) + ' y ' + Math.round(r.top) +
        '\u2013' + Math.round(r.bottom) + '   x ' + Math.round(r.left) +
        '\u2013' + Math.round(r.right));
  });
  var clash = 0;
  for (var i = 0; i < boxes.length; i++) {
    for (var j = i + 1; j < boxes.length; j++) {
      var a = boxes[i], b = boxes[j];
      if (a.top < b.bot && b.top < a.bot && a.l < b.rt && b.l < a.rt) {
        clash++;
        say('  \u2716 ' + a.s + ' OVERLAPS ' + b.s +
            ' \u2014 one of them is being read over the other.');
      }
    }
  }
  if (!clash && boxes.length > 1) { say('  no overlap \u2014 the stack is clear.'); }
  if (boxes.length < 2) { blind('the bottom stack', 'fewer than two panes are visible'); }

  /* ── 6 · DOES THE TOUR GIVE THE SURFACE BACK ────────────────────
     THE FIRST VERSION OF THIS SECTION FAILED A CORRECT RESTORE. It read the
     switches while a tour frame was showing — every switch off, because frame
     1 of `ground-first` is bare terrain — then closed the panel and found them
     all on again, and called that state being spent. It was the opposite: the
     tour was giving back exactly what it borrowed. THE PROBE HAD SAMPLED THE
     MIDDLE OF A CYCLE AND JUDGED IT AS THOUGH IT WERE THE START.

     So it drives the whole cycle instead. Close, record, open, confirm the
     frame actually took the surface, close, compare. Only the round trip can
     answer the question, and anything less measures the tour's own frame. */
  head('6 · THE TOUR READER');
  var T = window.AmentiAtticaTours;
  if (!T || typeof T.show !== 'function') {
    blind('the tour reader', 'AmentiAtticaTours is not loaded on this page');
    say('  not run.');
  } else {
    var readState = function () {
      var on = $$('.at-key [data-m]', el).filter(function (d) {
        return d.getAttribute('aria-pressed') !== 'false';
      }).map(function (d) { return d.getAttribute('data-m'); }).sort().join('|');
      var p = $('.at-ctl button[data-p][aria-pressed="true"]', el);
      return { marks: on || 'NONE', period: p ? p.getAttribute('data-p') : '(none)' };
    };
    var wasOpen = T.isOpen();

    if (wasOpen) { T.hide(); }
    var R = readState();                       /* the reader's own state */

    T.show();
    var F = readState();                       /* what the first frame set */

    T.hide();
    var B = readState();                       /* what came back */

    say('  reader state before   ' + R.marks + '   period ' + R.period);
    say('  tour frame applied    ' + F.marks + '   period ' + F.period);
    say('  state after close     ' + B.marks + '   period ' + B.period);

    if (F.marks === R.marks && F.period === R.period) {
      blind('whether the tour restores',
            'the first frame set the same state the reader already had, so a ' +
            'restore and a no-op look alike. Open a different tour and re-run.');
      say('  UNREAD — the frame changed nothing, so nothing can be concluded.');
    } else if (B.marks === R.marks && B.period === R.period) {
      say('  the tour borrowed the surface and gave it back.');
    } else {
      say('  ✖ THE TOUR DID NOT GIVE THE SURFACE BACK. The reader\u2019s state is not');
      say('    the tour\u2019s to spend, and closing the panel left it spent.');
    }

    if (wasOpen) { T.show(); say('  (reopened — the panel is as you found it)'); }
    say('  tours on file: ' + JSON.stringify(T.list ? T.list() : null));
  }

  /* ── PRINT ────────────────────────────────────────────────────────────── */
  var out = ['', '='.repeat(66), L.join('\n')];
  out.push('');
  out.push('\u2500\u2500 UNREAD ' + '\u2500'.repeat(55));
  out.push(UNREAD.length
    ? '  ' + UNREAD.join('\n  ') +
      '\n  \u2014 these are things this probe COULD NOT SEE. None of them is a fault.'
    : '  nothing \u2014 every test above had something real to measure.');
  out.push('');
  out.push('='.repeat(66));
  var report = out.join('\n');

  /* A probe whose output must be scrolled, selected and copied out of a console
     costs the captain a minute every run, and by Rule 4 it does not get to spend
     them. It writes a .txt and downloads it. RULE 3: a refused download is the
     instrument being prevented, not a fault \u2014 the text is returned anyway. */
  try {
    var stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
    var blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a2 = document.createElement('a');
    a2.href = url;
    a2.download = 'attica-probe-' + stamp + '-K' + n2(K) + '.txt';
    a2.style.display = 'none';
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    report += '\n  \u2193 written to ' + a2.download + ' in your downloads folder.\n';
  } catch (e) {
    report += '\n  UNREAD \u2014 could not write the .txt (' +
              String(e.message || e).slice(0, 60) + ').\n' +
              '  The report above is complete; only the download was refused.\n';
  }
  return report;
})();
