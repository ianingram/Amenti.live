/* ===========================================================================
   amenti-probe-loader.js — THE CORPS, MADE FIREABLE
   ---------------------------------------------------------------------------
   BUILT      2026-07-20 · 15:10 UTC
   AMENTI.LIVE · Ingram Manor LLC

   In Page1.html, last of the scripts:
       <script src="amenti-probe-loader.js" defer></script>

   WHAT THIS IS
     Twenty probes sit in probes/. The scan catalogues them, the Corps pane
     lists them, and fleet-structure.json names every one. They are part of the
     ship in every sense except the one that matters: RUNNING one still means
     copying text out of a document and pasting it into a console.

     This closes that. A probe becomes a URL.

         Page1.html?probe=21
         Page1.html?probe=complete-card
         Page1.html?probe=all

   WHY THE LOADER LIVES HERE AND NOT ON THE CORPS PANE
     A browser probe must run on the page it probes. Probe 21 counts cards in
     the arena; fired from the Corps pane it would find none and report a
     truthful, useless zero. So the Corps LISTS and DISPATCHES, and the loader
     sits on the target and does the firing.

   WHAT IT DOES NOT DO
     It does not run anything unasked. With no ?probe= in the address this file
     costs one string comparison and then does nothing at all. A seeker never
     meets it, and no probe fires because a page was visited.

     That is deliberate beyond politeness. A probe that runs unattended and
     reports green while blind is worse than no probe — probe19 exists because
     of exactly that. Automatic firing raises the stakes on the WARN
     discipline, and until every probe is audited for it, firing stays an act.

   ON EXPOSURE
     The address is public and anyone may append ?probe=21. That is acceptable
     because THE CORPS IS READ-ONLY BY DOCTRINE: a probe changes nothing and
     reveals nothing a signed-out visitor could not already see. Any probe that
     needs a seeker's session gets a null token and reports that it could not
     look — which is the correct answer rather than a leak.
   =========================================================================== */
(function () {
  'use strict';

  var q = null;
  try { q = new URLSearchParams(location.search).get('probe'); } catch (e) {}
  if (!q) return;                       /* the whole cost of this file, unasked */

  /* THIS SHIP ALREADY HAD A PROBE, AND IT OWNS TWO KEYWORDS.
     amenti-probe.js answers ?probe=report and ?probe=1 — it musters the fleet
     against its manifest and downloads a .txt. It has announced itself in the
     console on every page load for weeks, and this loader was built without
     reading it, which is the same fault as working from a stale list instead
     of from the ship.

     They are not duplicates: that one probes the FLEET, this one runs the
     twenty files in probes/ that were catalogued and unrunnable. But the
     keywords are its, and a second thing answering them is noise. */
  if (q === 'report' || q === '1') return;

  var BASE  = 'probes/';
  var INDEX = 'fleet-structure.json';   /* written by the scan; the one source */

  var panel, log, running = 0;

  /* ---- the panel ------------------------------------------------------- */
  function mount() {
    if (panel) return;
    var css = document.createElement('style');
    css.textContent =
      '#probe-panel{position:fixed;right:0;bottom:0;width:min(560px,100vw);max-height:64vh;'
    +   'z-index:99999;background:#06070b;border-top:1px solid #d4a017;border-left:1px solid #232838;'
    +   'font-family:"Share Tech Mono",monospace;font-size:11.5px;color:#c8ccdc;display:flex;'
    +   'flex-direction:column}'
    + '#probe-panel .ph{display:flex;align-items:center;gap:10px;padding:8px 12px;'
    +   'border-bottom:1px solid #232838;background:#0a0b11}'
    + '#probe-panel .pt{letter-spacing:.2em;text-transform:uppercase;color:#f5c542;font-size:10px}'
    + '#probe-panel .pn{margin-left:auto;color:#6b7180;font-size:10px}'
    + '#probe-panel .px{background:none;border:none;color:#6b7180;font-size:18px;cursor:pointer;'
    +   'line-height:1;padding:0;font-family:inherit}'
    + '#probe-panel .pb{overflow-y:auto;padding:10px 12px;line-height:1.65}'
    + '#probe-panel .l{white-space:pre-wrap;word-break:break-word}'
    + '#probe-panel .l.pass{color:#80ffc0}'
    + '#probe-panel .l.warn{color:#fbbf24}'
    + '#probe-panel .l.fail{color:#f87171}'
    + '#probe-panel .l.head{color:#f5c542;letter-spacing:.1em;margin:8px 0 4px}'
    + '#probe-panel .l.dim{color:#6b7180}';
    document.head.appendChild(css);

    panel = document.createElement('div');
    panel.id = 'probe-panel';
    panel.innerHTML =
        '<div class="ph"><span class="pt">The Probe Corps</span>'
      + '<span class="pn" id="probe-n"></span>'
      + '<button class="px" title="close">&#215;</button></div>'
      + '<div class="pb" id="probe-log"></div>';
    document.body.appendChild(panel);
    log = panel.querySelector('#probe-log');
    panel.querySelector('.px').addEventListener('click', function () {
      panel.remove(); panel = null; restore();
    });
  }

  var TRANSCRIPT = [
    'AMENTI · THE PROBE CORPS',
    'fired ' + new Date().toISOString(),
    'page  ' + (typeof location !== 'undefined' ? location.href : '?'),
    ''
  ];

  function download(text) {
    try {
      var stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      var blob = new Blob([text], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'amenti-probes-' + stamp + '.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      say('', ''); say('a .txt has landed in Downloads.', 'dim');
    } catch (e) {
      say('could not write the file — the transcript is in the console.', 'warn');
    }
  }

  function say(text, kind) {
    TRANSCRIPT.push((kind && kind !== 'dim' && kind !== 'head'
      ? kind.toUpperCase().padEnd(5) + ' ' : '') + text);
    if (!log) return;
    var d = document.createElement('div');
    d.className = 'l ' + (kind || '');
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  /* ---- catch what a probe prints, without taking it away ---------------
     The console still gets everything. This mirrors it into the panel so the
     result is visible on the page rather than only in a drawer the captain
     may not have open. */
  var real = { log: console.log, warn: console.warn, error: console.error };
  function capture() {
    console.log = function () {
      real.log.apply(console, arguments);
      var a = Array.prototype.slice.call(arguments);
      /* strip the %c formatting probes use for colour */
      var s = a.filter(function (x) { return typeof x !== 'string' || x.indexOf('color:') === -1
        && x.indexOf('background:') === -1; })
        .map(function (x) { return typeof x === 'string' ? x.replace(/%c/g, '') : stringify(x); })
        .join(' ').trim();
      if (!s) return;
      var k = /^\s*PASS/.test(s) ? 'pass' : /^\s*WARN/.test(s) ? 'warn'
            : /^\s*FAIL|✗/.test(s) ? 'fail'
            : /PROBE \d+|·\s*$/.test(s) ? 'head' : '';
      say(s, k);
    };
    /* warn and error carry %c styling too — the CAS check does — and the first
       version only stripped it from console.log, so the panel printed raw
       format strings and colour declarations. */
    console.warn  = function () { real.warn.apply(console, arguments); say(clean(arguments), 'warn'); };
    console.error = function () { real.error.apply(console, arguments); say(clean(arguments), 'fail'); };
  }
  function clean(args) {
    return Array.prototype.slice.call(args)
      .filter(function (x) { return !(typeof x === 'string'
        && (x.indexOf('color:') !== -1 || x.indexOf('background:') !== -1)); })
      .map(function (x) { return typeof x === 'string' ? x.replace(/%c/g, '') : stringify(x); })
      .join(' ').trim();
  }
  function restore() { console.log = real.log; console.warn = real.warn; console.error = real.error; }
  function stringify(x) {
    if (typeof x === 'string') return x;
    try { return JSON.stringify(x); } catch (e) { return String(x); }
  }

  /* ---- find the probes the ship actually holds -------------------------
     From fleet-structure.json, which the scan regenerates from the folder. NOT
     from a hand-written list: fleet-manifest.js names ten of the twenty that
     exist, and a loader trusting it would silently refuse half the Corps. */
  async function catalogue() {
    try {
      var r = await fetch(INDEX, { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      var txt = await r.text();
      /* TWO WRONG VERSIONS BEFORE THIS ONE, AND BOTH ARE INSTRUCTIVE.
         The first matched /probe[\w.-]*\.(js|mjs)/ anywhere, which found
         "probe-loader.js" INSIDE "amenti-probe-loader.js" and chased a file
         that does not exist.

         The second anchored to "probes/" — and fleet-structure.json lists BARE
         FILENAMES, so it matched nothing at all and the loader reported zero
         probes aboard. A fix that turns a wrong answer into no answer is not a
         fix.

         This one requires the character BEFORE the name to be a delimiter, so
         a filename embedded in a longer filename cannot match. */
      var names = [];
      var re = /(?:^|["'\s\[,:\/])(probe[\w.-]*\.(?:js|mjs))/g, mm;
      while ((mm = re.exec(txt))) names.push(mm[1]);
      var seen = {}, out = [];
      names.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } });
      return out;
    } catch (e) { return null; }
  }

  /* A NUMBER MEANS THAT NUMBER, OR NOTHING.
     The first version fell through to substring matching when a bare number
     found no exact file — so ?probe=1 fired probe10 through probe19, ten
     probes the captain did not ask for. A fuzzy fallback that quietly does
     something nobody requested is the same fault this build keeps finding.
     A number is now exact or it is a miss, and a miss says so. */
  function match(list, want) {
    var w = String(want).toLowerCase().trim();
    if (/^\d+$/.test(w)) {
      return list.filter(function (f) {
        return f.toLowerCase() === 'probe' + w + '.js'
            || f.toLowerCase() === 'probe' + w + '.mjs';
      });
    }
    return list.filter(function (f) { return f.toLowerCase().indexOf(w) !== -1; });
  }

  async function run(file) {
    return new Promise(function (resolve) {
      say('', ''); say('── ' + file + ' ' + '─'.repeat(Math.max(0, 40 - file.length)), 'head');
      if (/\.mjs$/.test(file)) {
        say('a server probe — it does not run in a browser. Run it with node, or '
          + 'let the scheduled workflow fire it.', 'dim');
        return resolve();
      }
      /* ONLOAD IS NOT DONE.
         script.onload fires when the FILE has loaded, not when an async probe
         has finished speaking. Probe 21 makes two fetches; the first version of
         this loader resolved on onload, restored the console, and moved on
         before the probe had said a word — so its findings went to the real
         console and the panel showed an empty section under its name.

         A loader that reports "1 probe fired" and shows nothing has told the
         captain something false. So it now waits for QUIET: the probe is done
         when it has stopped talking, not when its file arrived. */
      var s = document.createElement('script');
      s.src = BASE + file + '?t=' + Date.now();

      var settled = false;
      function done(why) {
        if (settled) return; settled = true;
        try { s.remove(); } catch (e) {}
        if (why) say(why, 'warn');
        resolve();
      }

      s.onerror = function () {
        done(null);
        say('could not load ' + BASE + file + ' — it is catalogued but not reachable. '
          + 'That is a finding about the ship, not about the probe.', 'fail');
      };

      s.onload = function () {
        /* A QUIET DETECTOR WITH NO FLOOR TREATS "HAS NOT STARTED" AS "HAS
           FINISHED", AND THAT IS EXACTLY WHAT THE FIRST VERSION DID.

           Probe 21 makes two fetches before it prints a word. The loader saw
           900ms of silence, concluded the probe was done, restored the console
           and reported "1 probe fired" over an empty section — a false report
           about a probe, which is the one thing a probe loader must never
           produce.

           So there are two clocks. Nothing resolves before the FLOOR, however
           silent it is. After that, quiet means done. */
        var FLOOR = 4000;               /* no probe is finished before this */
        var QUIET = 1200;               /* silence after it last spoke */
        var CEIL  = 20000;              /* and never hang */

        var mark = TRANSCRIPT.length;
        var spoke = false;
        var quiet = 0, waited = 0;

        var tick = setInterval(function () {
          waited += 150;
          if (TRANSCRIPT.length > mark) { mark = TRANSCRIPT.length; quiet = 0; spoke = true; }
          else quiet += 150;

          if (waited < FLOOR) return;                    /* the floor holds */
          if (quiet >= QUIET || waited >= CEIL) {
            clearInterval(tick);
            if (waited >= CEIL && quiet < QUIET) {
              done('gave up after ' + (CEIL / 1000) + 's — the probe may still be running, and '
                 + 'anything it says from here lands in the console rather than this panel');
            } else if (!spoke) {
              /* IT LOADED AND SAID NOTHING. That is a finding, not a pass. */
              done('the file loaded and printed nothing in ' + (waited / 1000) + 's. Either it '
                 + 'is not a self-firing probe, or it threw before speaking — check the console '
                 + 'for an error. This loader will not report a silent probe as a clean one.');
            } else {
              done(null);
            }
          }
        }, 150);
      };

      document.head.appendChild(s);
    });
  }

  /* ---- go ---------------------------------------------------------------- */
  (async function () {
    mount(); capture();
    say('reading the catalogue…', 'dim');

    /* A NAMED PROBE DOES NOT NEED THE CATALOGUE.
       ?probe=21 means probes/probe21.js. Asking the catalogue first put a
       second thing between the captain and the probe, and when the catalogue
       was misread the probe became unreachable even though the file was right
       there. Only ?probe=all needs an index, because only ?probe=all needs to
       know what exists. */
    var want = null;
    if (q !== 'all' && /^\d+$/.test(q)) {
      want = ['probe' + q + '.js'];
      say('firing probes/' + want[0] + ' directly', 'dim');
    }

    if (!want) {
      var list = await catalogue();
      if (!list || !list.length) {
        say('COULD NOT ENUMERATE THE CORPS from ' + INDEX + '. Nothing was run — rather '
          + 'than running a guess. A probe can still be fired by number: ?probe=21', 'fail');
        restore(); return;
      }
      say(list.length + ' probe(s) in the ship', 'dim');
      want = (q === 'all') ? list.filter(function (f) { return /\.js$/.test(f); }) : match(list, q);
      if (!want.length) {
        say('no probe matches "' + q + '". The ship holds: ' + list.join(', '), 'warn');
        restore(); return;
      }
    }

    panel.querySelector('#probe-n').textContent = want.length + ' to fire';
    for (var i = 0; i < want.length; i++) {
      panel.querySelector('#probe-n').textContent = (i + 1) + ' of ' + want.length;
      await run(want[i]);
    }
    say('', ''); say('── ' + want.length + ' probe(s) fired ' + '─'.repeat(22), 'head');
    say('A probe that could not look says so. Read the warns as carefully as the fails.', 'dim');
    restore();

    /* A .TXT LANDS IN DOWNLOADS.
       The captain asked for this repeatedly while being handed console
       one-liners to copy by hand. Reading a result off a screen and pasting it
       somewhere is not a workflow; a file is. amenti-probe.js has done this for
       weeks and this did not, which is the whole reason it kept being asked
       for. */
    download(TRANSCRIPT.join('\n'));
  })();

  window.amentiProbes = { run: run, catalogue: catalogue };
})();
