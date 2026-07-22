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

  function say(text, kind) {
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
    console.warn  = function () { real.warn.apply(console, arguments);
      say(Array.prototype.slice.call(arguments).map(stringify).join(' '), 'warn'); };
    console.error = function () { real.error.apply(console, arguments);
      say(Array.prototype.slice.call(arguments).map(stringify).join(' '), 'fail'); };
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
      var names = txt.match(/probe[\w.-]*\.(?:js|mjs)/g) || [];
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
      var s = document.createElement('script');
      s.src = BASE + file + '?t=' + Date.now();
      s.onload  = function () { s.remove(); resolve(); };
      s.onerror = function () {
        s.remove();
        say('could not load ' + BASE + file + ' — it is catalogued but not reachable. '
          + 'That is a finding about the ship, not about the probe.', 'fail');
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  /* ---- go ---------------------------------------------------------------- */
  (async function () {
    mount(); capture();
    say('reading the catalogue…', 'dim');

    var list = await catalogue();
    if (!list) {
      say('COULD NOT READ ' + INDEX + '. The Corps cannot be enumerated, so nothing was '
        + 'run — rather than running a guess.', 'fail');
      restore(); return;
    }
    say(list.length + ' probe(s) in the ship', 'dim');

    var want = (q === 'all') ? list.filter(function (f) { return /\.js$/.test(f); }) : match(list, q);
    if (!want.length) {
      say('no probe matches "' + q + '". The ship holds: ' + list.join(', '), 'warn');
      restore(); return;
    }

    panel.querySelector('#probe-n').textContent = want.length + ' to fire';
    for (var i = 0; i < want.length; i++) {
      panel.querySelector('#probe-n').textContent = (i + 1) + ' of ' + want.length;
      await run(want[i]);
    }
    say('', ''); say('── ' + want.length + ' probe(s) fired ' + '─'.repeat(22), 'head');
    say('A probe that could not look says so. Read the warns as carefully as the fails.', 'dim');
    restore();
  })();

  window.amentiProbes = { run: run, catalogue: catalogue };
})();
