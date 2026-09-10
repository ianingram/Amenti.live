/* ============================================================================
   THE WALL PROBE  ·  probes/hall-wall-probe.js
                      →  Amenti.live/probes/hall-wall-probe.js
   ----------------------------------------------------------------------------
   HOW CLOSE THE HALL'S PROMPT RUNS TO THE PROXY'S CEILING, ON EVERY BRANCH.

   Paste into the console on hall.html. IT SPENDS NOTHING — it builds the
   prompt the way amenti-hall.js builds it and counts characters. No ask, no
   model, no door opened.

   ── WHY IT EXISTS ────────────────────────────────────────────────────────
   On 9 September the bench asked five questions and the fifth came back

       proxy 413 · {"error":"system_too_long"}

   A question the library does not cover FAILED HARD instead of being answered
   honestly. The four the hall could answer all passed.

   amenti-hall.js has seen this exact failure before and records it: on 31
   August the catalogue grew to 191 documents, the prompt reached 24,138
   against the proxy's SYSTEM_CHARS of 20,000, and THE HALL WAS SILENT ON
   EVERY QUESTION. It was fixed by declaring doors instead of leaves.

   IT IS BACK, ON ONE BRANCH. Line ~1112:

       (opened.length || ship) ? null : doorsText(items, lib, true)

   When nothing opens \u2014 no room, no section \u2014 the whole door list is ADDED to a
   prompt already near the wall. So the only questions that trip it are the
   ones where retrieval found nothing, WHICH IS EXACTLY THE HONEST-REFUSAL
   PATH: the branch the hall most needs, failing in the way the hall least
   wants, on the questions nobody thinks to test with.

   ── AND NO BENCH BUILT FROM GOOD QUESTIONS WILL FIND IT ──────────────────
   Four of five passed. Any test written from questions the library covers
   reports the hall healthy. A WALL IS NOT MEASURED BY THE CASES THAT FIT
   THROUGH IT.

   ── WHAT THIS CANNOT SEE ─────────────────────────────────────────────────
   \u00b7 The proxy's real ceiling. 20,000 is what amenti-hall.js records as
     SYSTEM_CHARS; the Worker's source is not in this repository, so that
     number is READ FROM A COMMENT and not from the thing enforcing it.
   \u00b7 What the router adds. This measures call two, the answer call, which is
     the one that 413'd.
   \u00b7 Whether an answer is good. Only whether it can be asked for at all.
   ========================================================================== */
(function wallProbe() {
  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var WALL = 20000;            /* SYSTEM_CHARS, per amenti-hall.js */
  var L = [], UNREAD = [], FAULT = 0;
  var say = function (m) { L.push(m == null ? '' : String(m)); };
  var head = function (m) { L.push(''); L.push('\u2500\u2500 ' + m + ' ' +
                 '\u2500'.repeat(Math.max(0, 60 - m.length))); };
  var bad = function (m) { FAULT++; say('  \u2716 ' + m); };

  function get(u, json) {
    return fetch(RAW + u + '?_=' + Date.now())
      .then(function (r) { return r.ok ? (json ? r.json() : r.text()) : null; })
      .catch(function () { return null; });
  }

  say('='.repeat(64));
  say('  WALL PROBE \u00b7 how close the prompt runs, on every branch');
  say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
  say('='.repeat(64));
  say('');
  say('  0 \u00b7 WHAT THIS CANNOT SEE');
  say('    \u00b7 The proxy\u2019s real ceiling. ' + WALL + ' is READ FROM A COMMENT in');
  say('      amenti-hall.js, not from the Worker. Its source is not in this');
  say('      repository, so the number enforcing the 413 is unverified here.');
  say('    \u00b7 What the router call adds. This measures the ANSWER call, which');
  say('      is the one that failed.');
  say('    \u00b7 Whether an answer is good \u2014 only whether it can be asked for.');

  return Promise.all([
    get('HALL.md'), get('HALL-STATE.json', true),
    get('SOURCES.json', true), get('LIBRARY.json', true)
  ]).then(function (r) {
    var hall = r[0], state = r[1], sources = r[2], lib = r[3];

    head('1 · THE PIECES, MEASURED');
    var pieces = [
      ['HALL.md', hall ? hall.length : null],
      ['HALL-STATE.json', state ? JSON.stringify(state, null, 1).length : null]
    ];
    pieces.forEach(function (p) {
      if (p[1] === null) { UNREAD.push(p[0] + '  \u2014 could not be read'); return; }
      say('  ' + (p[0] + '                  ').slice(0, 20) + String(p[1]).padStart(6) + ' chars');
    });

    /* ── THE DOOR LIST, REBUILT THE WAY doorsText DOES ──────────────────
       Sections with their counts, then every room with up to three of its
       section titles. This is the block that goes in ONLY when nothing was
       found, and it is the whole of the finding. */
    var items = (sources && (sources.items || sources.documents || sources)) || [];
    if (!Array.isArray(items)) { items = []; }
    var rooms = (lib && (lib.rooms || lib)) || [];
    if (!Array.isArray(rooms)) { rooms = Object.keys(rooms).map(function (k) { return rooms[k]; }); }

    var secs = {};
    items.forEach(function (i) { if (i && !i.unreachable && i.section) { secs[i.section] = (secs[i.section] || 0) + 1; } });

    var doorLines = [];
    doorLines.push('-- THE ARCHITECTURE: ' + Object.keys(secs).length + ' sections --');
    Object.keys(secs).forEach(function (n) { doorLines.push('\u00b7 ' + n + ' \u2014 ' + secs[n] + ' documents'); });
    rooms.forEach(function (rm) {
      if (!rm) { return; }
      var name = rm.name || rm.room || rm.key || '';
      var titles = (rm.works || rm.sections || []).slice(0, 3).map(function (w) {
        return (w && (w.title || w.name)) || '';
      }).filter(Boolean);
      doorLines.push('\u00b7 ' + name + (titles.length ? ': ' + titles.join('; ') : ''));
    });
    var doors = doorLines.join('\n');
    say('  ' + 'the door list      '.slice(0, 20) + String(doors.length).padStart(6) +
        ' chars   (' + Object.keys(secs).length + ' sections, ' + rooms.length + ' rooms)');
    if (!items.length || !rooms.length) {
      UNREAD.push('the door list  \u2014 SOURCES.json or LIBRARY.json did not parse into ' +
                  'the shape doorsText reads, so its size is a FLOOR and not the figure');
    }

    /* the fixed rules and scaffolding amenti-hall.js declares as ~8,600 with
       HALL.md inside it; the remainder is the rules text this probe cannot see */
    var rules = Math.max(0, 8600 - (hall ? hall.length : 0));
    say('  ' + 'the rules          '.slice(0, 20) + String(rules).padStart(6) +
        ' chars   (8,600 declared, less HALL.md)');
    say('  ' + 'sections budget    '.slice(0, 20) + '  5800 chars   (SECTION_BUDGET)');
    say('  ' + '4 works x 780      '.slice(0, 20) + '  3120 chars   (MAX_WORKS x WORK_SLICE)');
    say('  ' + 'notes              '.slice(0, 20) + '   900 chars   (NOTE_BUDGET)');

    head('2 · THE BRANCHES');
    var base = (hall ? hall.length : 0) + rules +
               (state ? JSON.stringify(state, null, 1).length : 0);
    var B = [
      ['a room opened, 4 works', base + 3120 + 900],
      ['a section picked',       base + 5800 + 900],
      ['NOTHING FOUND \u2014 doors go in', base + doors.length + 900]
    ];
    B.forEach(function (b) {
      var pct = (b[1] / WALL * 100);
      var over = b[1] > WALL;
      say('  ' + (b[0] + '                            ').slice(0, 30) +
          String(b[1]).padStart(6) + ' / ' + WALL +
          '   ' + pct.toFixed(0) + '%' + (over ? '   \u2716 OVER THE WALL' : ''));
      if (over) {
        bad(b[0] + ' exceeds SYSTEM_CHARS by ' + (b[1] - WALL) + ' chars. The ' +
            'proxy refuses this with a 413 and the visitor gets NOTHING \u2014 not a ' +
            'shorter answer, not an honest refusal.');
      } else if (pct > 90) {
        say('      margin is under a tenth of the wall. amenti-hall.js warns that a ' +
            'warning which fires every run becomes wallpaper \u2014 this one does not.');
      }
    });

    head('3 · THE BRANCH THAT MATTERS');
    say('  The door list goes in ONLY when nothing was opened \u2014 no room and no');
    say('  section. So the prompt is at its LONGEST on exactly the questions the');
    say('  hall cannot answer from its library.');
    say('');
    say('  THE HONEST REFUSAL IS THE MOST EXPENSIVE ANSWER THE HALL CAN GIVE,');
    say('  AND IT IS THE ONE IT IS LEAST ABLE TO AFFORD.');
    say('');
    var head3 = base + doors.length + 900;
    if (head3 > WALL) {
      say('  to bring it under, one of these must give ' + (head3 - WALL) + ' chars:');
      say('     \u00b7 the door list          ' + doors.length + '  \u2014 trim to sections only');
      say('       when it IS the fallback: rooms without their titles saves most');
      say('     \u00b7 HALL.md                ' + (hall ? hall.length : '?') +
          '  \u2014 29% of the wall carrying');
      say('       the ship\u2019s architecture into a question about Livy (SLIP #13 F)');
      say('     \u00b7 the notes                900  \u2014 nothing is opened on this');
      say('       branch, so the note budget is being reserved for nothing');
      say('');
      say('  THE LAST ONE IS FREE. A branch where no room opened cannot have room');
      say('  notes, and it is holding budget for them anyway.');
    } else {
      say('  it fits, with ' + (WALL - head3) + ' chars to spare \u2014 but the bench saw a');
      say('  413 on this branch, so either the wall is lower than ' + WALL + ' or a');
      say('  piece this probe cannot see is going in with it. MEASURE THE WORKER.');
    }

    head('4 · WHAT NO GOOD QUESTION WILL SHOW YOU');
    say('  Four of the bench\u2019s five questions passed. Every one of them was a');
    say('  question the library covers. A WALL IS NOT MEASURED BY THE CASES THAT');
    say('  FIT THROUGH IT, and a bench written from answerable questions reports');
    say('  a healthy hall.');

    var out = ['', '='.repeat(64), L.join('\n'), ''];
    out.push('\u2500\u2500 UNREAD ' + '\u2500'.repeat(53));
    out.push(UNREAD.length ? '  ' + UNREAD.join('\n  ') : '  nothing');
    out.push('');
    out.push(FAULT ? '  ' + FAULT + ' FINDING' + (FAULT === 1 ? '' : 'S') + '.'
                   : '  no branch over the wall in this reading.');
    out.push('='.repeat(64));
    var report = out.join('\n');
    try {
      var b = new Blob([report], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'hall-wall-' + new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '') + '.txt';
      a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      report += '\n  \u2193 written to ' + a.download + '\n';
    } catch (e) {
      report += '\n  UNREAD \u2014 download refused; the report above is complete.\n';
    }
    console.log(report);
    return report;
  });
})();
