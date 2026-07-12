/* ============================================================================
   amenti-probe.js  ·  Ingram Manor LLC
   THE INSTRUMENT — a permanent diagnostic, safe to ship, never runs by itself.
   ----------------------------------------------------------------------------
   Ship this. Load it on every surface. It costs nothing until you call it.

       Amenti.probe.state()    FREE. Instant. What is this page actually running?
       Amenti.probe.wall()     ~1¢. Is the Worker's wall up, and does it let real
                               traffic through?
       Amenti.probe.full()     ~3¢. Both, plus the history-cap walk.

   Or append ?probe=1 to the URL and it prints state() on load. Nothing else
   auto-runs, ever — a diagnostic that spends money without being asked is not a
   diagnostic, it is a leak.

   ── WHY THIS FILE EXISTS AND WHY IT IS WRITTEN THE WAY IT IS ────────────────
   Three earlier versions of this probe LIED, and each lie is now a rule:

   1. IT SENT GARBAGE AND BLAMED THE SERVER.
      It tested the 1100-char cap with 1100 literal letter-x's. Gemini cannot
      speak that, returned 500, and the probe reported "read-aloud is BROKEN —
      REVERT". Garbage in, garbage verdict.
      >>> RULE: test with REAL DATA. prose(), not 'x'.repeat().

   2. IT ASSUMED THE CAUSE INSTEAD OF READING IT.
      Any non-200 became "the cap refused it" — so a 400 from Anthropic (caused
      by the probe's own malformed message array) was reported as the wall
      breaking conversations at 10 exchanges. It was terrifying and it was false.
      >>> RULE: ATTRIBUTE, never infer. Read the body. Name the actual cause.

   3. IT TRUSTED A HEADER THE BROWSER WAS NOT ALLOWED TO READ.
      The wall labels itself with X-Amenti-Wall — but a browser cannot see a
      custom response header unless the server exposes it, and it did not. So
      every 413 the wall correctly threw came back as "THE CAP IS NOT LIVE".
      The probe reported the wall's SUCCESS as its FAILURE.
      >>> RULE: the BODY always arrives. Prefer it. Never let a missing signal
          become a false verdict. (The Worker now exposes the header too.)

   A probe that reports red without looking is worse than no probe. A lie with a
   light on it.
   ============================================================================ */
(function () {
  'use strict';
  var Amenti = (window.Amenti = window.Amenti || {});
  var VERSION = '2026.07c';

  /* ── A GUARD THAT PREVENTS ITS OWN UPGRADE IS A LOCK ON THE INSIDE ─────
     This used to read:  if (Amenti.probe && Amenti.probe.__v) return;

     Which meant: the page loads the probe from the server, and then PASTING A
     NEWER PROBE INTO THE CONSOLE DOES NOTHING. The guard sees a probe already
     aboard and bails. You paste, you see "ready", and you are still running the
     old one. Silently. Forever.

     An include-once guard is for a DOUBLE <script> TAG. It must never block a
     deliberate upgrade from the console — that is the captain's own hand.

     Same version: bail (a duplicate tag). Different version: TAKE THE HELM. */
  if (Amenti.probe && Amenti.probe.__v === VERSION) return;
  if (Amenti.probe && Amenti.probe.__v) {
    console.log('%cAmenti.probe ' + Amenti.probe.__v + ' \u2192 ' + VERSION + '  (upgraded from the console)', 'color:#185FA5;font-weight:600');
  }

  var PROXY = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.AI_PROXY_URL)
    || 'https://amenti-proxy.ingram-ian.workers.dev';
  var BASE  = String(PROXY).replace(/\/$/, '');
  var SPEAK = BASE + '/speak';

  /* The wall's vocabulary. If the body says one of these, the CAP refused us —
     and we know that whether or not the browser was permitted to read a header. */
  var WALL_REASONS = [
    'text_too_long', 'style_too_long', 'too_many_messages', 'payload_too_long',
    'system_too_long', 'audio_too_large', 'rate_limited', 'budget_reached',
    'bad_text', 'bad_system', 'bad_messages', 'bad_message'
  ];

  var OK = 'color:#16a34a;font-weight:600';
  var NO = 'color:#dc2626;font-weight:600';
  var WN = 'color:#d97706;font-weight:600';
  var DIM = 'color:#999';
  var H = 'font-weight:700';
  function head(t) { console.log('%c\n' + t, H); say('', ''); say('', t); }

  /* ── THE CAPTAIN DOES NOT USE A MOUSE ──────────────────────────────────
     "Probes are spent; the captain is not."

     Reading this report meant selecting console text with a mouse, copying it,
     and pasting it somewhere. That is a CAPTAIN DOING A PROBE'S JOB.

     So every line is captured as plain text as it prints, and the probe hands
     back a FILE. One click. Nothing to select. Nothing to drag.
     ────────────────────────────────────────────────────────────────────── */
  var LOG = [];
  function say(kind, m) { LOG.push((kind ? '  ' + kind + '  ' : '') + m); }

  function Report() {
    this.pass = 0; this.fail = 0; this.warn = 0;
  }
  Report.prototype.ok   = function (m) { console.log('%c  PASS  %c' + m, OK, ''); say('PASS', m); this.pass++; };
  Report.prototype.bad  = function (m) { console.log('%c  FAIL  %c' + m, NO, ''); say('FAIL', m); this.fail++; };
  Report.prototype.hm   = function (m) { console.log('%c  WARN  %c' + m, WN, ''); say('WARN', m); this.warn++; };
  Report.prototype.note = function (m) { console.log('%c  ----  %c' + m, DIM, DIM); say('----', m); };
  Report.prototype.verdict = function () {
    console.log('%c' + Array(61).join('\u2500'), DIM);
    say('', Array(61).join('-'));
    if (this.fail) {
      console.log('%c\u2717 ' + this.fail + ' FAILURE(S). Read them — a FAIL means a LEGITIMATE request was refused.',
        'font-size:14px;color:#dc2626;font-weight:700');
    } else if (this.warn) {
      console.log('%c\u2713 ' + this.pass + ' passed, ' + this.warn + ' warning(s).',
        'font-size:14px;color:#16a34a;font-weight:700');
      console.log('%c  A WARN is not a failure. It is something true you should know.', WN);
    } else {
      console.log('%c\u2713 all clear (' + this.pass + ' checks).', 'font-size:14px;color:#16a34a;font-weight:700');
    }
    say('', (this.fail ? 'VERDICT: ' + this.fail + ' FAILURE(S)' :
             this.warn ? 'VERDICT: ' + this.pass + ' passed, ' + this.warn + ' warning(s)' :
                         'VERDICT: all clear (' + this.pass + ' checks)'));
    return { pass: this.pass, fail: this.fail, warn: this.warn };
  };

  /* Real prose. Never 'x'.repeat() — a TTS engine is entitled to refuse gibberish. */
  function prose(n) {
    var s = 'All Gaul is divided into three parts, of which the Belgae inhabit one, the ' +
            'Aquitani another, and the third those who in their own tongue are called Celts. ';
    var out = '';
    while (out.length < n) out += s;
    return out.slice(0, n);
  }

  /* Anthropic requires strict alternation ENDING ON A USER TURN. Getting this
     wrong is what produced the false "conversations break at 10 exchanges". */
  function msgs(n) {
    var out = [];
    for (var i = 0; i < n - 1; i++) {
      out.push({ role: i % 2 ? 'assistant' : 'user', content: 'a turn of ordinary talk' });
    }
    out.push({ role: 'user', content: 'and one more thing' });
    return out;
  }

  /* ATTRIBUTE. Do not infer. */
  function send(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      var hdr = r.headers.get('X-Amenti-Wall');
      var cache = r.headers.get('X-Amenti-Cache');
      if (r.ok) return { status: r.status, ok: true, cache: cache, isWall: false, reason: '' };
      return r.clone().json().catch(function () { return {}; }).then(function (j) {
        var reason = (j && (j.error || j.detail)) || '';
        var isWall = !!hdr || WALL_REASONS.indexOf(reason) !== -1;
        return {
          status: r.status, ok: false, cache: cache,
          isWall: isWall,                       // OUR cap said no
          reason: hdr || reason,
          upstream: !isWall ? (r.status + ' ' + reason) : null   // somebody ELSE said no
        };
      });
    }, function (e) {
      return { status: 0, ok: false, isWall: false, reason: 'network', upstream: 'network: ' + e.message };
    });
  }
  var speak = function (b) { return send(SPEAK, b); };
  var chat  = function (b) { return send(BASE, b); };

  /* ── STATE — free, instant, no network ─────────────────────────────────── */
  function state(R) {
    R = R || new Report();
    head('WHAT THIS PAGE IS ACTUALLY RUNNING');
    console.log('%c  page: ' + (document.body && document.body.dataset.page || location.pathname), DIM);
    console.log('%c  proxy: ' + BASE, DIM);

    var A = window.Amenti || {};
    function mod(o, name, want) {
      if (o) {
        var v = o.__v ? ' (' + o.__v + ')' : '';
        R.ok(name + v);
      } else if (want === 'absent') {
        R.ok(name + ' \u2014 correctly ABSENT');
      } else {
        R.note(name + ' \u2014 not on this page');
      }
    }
    mod(A.chat, 'Amenti.chat        the conversation core');
    mod(A.listen, 'Amenti.listen      voice-in');
    mod(A.throttle, 'Amenti.throttle    TTS (old engine or facade)');
    mod(A.voice, 'Amenti.voice       the CONSOLIDATED engine');
    mod(window.AMENTI_VOICE, 'AMENTI_VOICE       the counsel speaker');

    if (window.AMENTI_VOICE_PROFILES) {
      R.hm('AMENTI_VOICE_PROFILES is LOADED \u2014 it is a SPEC for unbuilt Parler work, has ZERO callers, and reads as live infrastructure. Remove the <script> tag.');
    } else {
      R.ok('AMENTI_VOICE_PROFILES  correctly not loaded (it is a spec, not code)');
    }

    /* The two things that decide whether the money is actually bounded. */
    var bounded = false;
    try {
      if (A.chat && typeof A.chat.create === 'function') {
        bounded = typeof A.chat.create({ figure: { name: 'x' } })._payload === 'function';
      }
    } catch (e) {}
    if (bounded) R.ok('the conversation core HAS the anchored window');
    else if (A.chat) R.hm('the conversation core does NOT have the anchored window');

    /* ── THE QUESTION NOBODY ASKED ──────────────────────────────────────────
       Every check above tests THE FILE. None of them tests THE TERMINAL.

       Page1's Terminal is an IIFE that runs at parse time and asks for
       Amenti.chat. For the life of this system the core was loaded EIGHT HUNDRED
       LINES LATER — so it did not exist, the guard failed, and the Terminal ran
       an INLINE FALLBACK instead. No move tags. No registers. No Turn. No
       doctrine. NOT ONE LINE of the conversation core.

       And fourteen harnesses reported green, because every one of them did this:

           const c = Amenti.chat.create({...});   // <- its OWN object
           is(typeof c._payload === 'function', 'the anchored window is live');

       THAT TESTS THE FILE. IT DOES NOT TEST THE TERMINAL.

       The probe stood next to the ship describing the engine, and never asked
       whether the engine was connected to the propeller. So now it asks. */
    if (A.terminal) {
      var tv = A.terminal.MOVES && A.terminal.MOVES.turnhold ? ' + the Turn' : '';
      R.ok('THE TERMINAL IS ON THE CORE \u2014 move tags, registers, doctrine' + tv +
           (typeof A.terminal._payload === 'function' ? ', anchored window' : '') + ' all LIVE');
    } else if (A.terminalPath === 'inline-fallback') {
      R.bad('THE TERMINAL IS ON THE INLINE FALLBACK. amenti-chat.js is LOADED and NEVER USED. ' +
            'No move tags, no registers, no Turn, no doctrine. The modules must load BEFORE the Terminal IIFE.');
    } else if (A.chat) {
      R.hm('cannot tell which path the Terminal is on \u2014 Amenti.terminal is not exposed. ' +
           'Page1 must publish it, or this bug can hide again.');
    }

    if (window.AmentiCost) {
      var c = window.AmentiCost;
      R.ok('cost telemetry live \u2014 ' + c.turns + ' turns, ' + c.inputTokens + ' in / ' + c.outputTokens + ' out (MEASURED, not estimated)');
    } else {
      R.note('window.AmentiCost \u2014 not present (telemetry ships with the new Page1)');
    }
    return R;
  }

  /* ── WALL — does the Worker refuse the bad and pass the good? ───────────── */
  function wall(R) {
    R = R || new Report();
    head('THE WALL  (a FAIL here means a LEGITIMATE request was refused)');

    return speak({ text: 'All Gaul is divided into three parts.', voice: 'Charon',
                   style: 'Read clearly, in a measured, dignified tone' })
      .then(function (r) {
        if (r.ok) R.ok('the site can SPEAK \u2014 ' + r.status + ' \u00b7 cache: ' + (r.cache || 'n/a'));
        else if (r.isWall) R.bad('THE CAP REFUSED A NORMAL CHUNK (' + r.reason + ') \u2014 the voice is broken. REVERT THE WORKER.');
        else R.hm('upstream, NOT the cap: ' + r.upstream);

        return speak({ text: prose(1100), voice: 'Kore', style: 'Read clearly, in a measured, dignified tone' });
      })
      .then(function (r) {
        if (r.ok) R.ok("Page2's largest legitimate chunk (1100 chars) passes \u00b7 cache: " + (r.cache || 'n/a'));
        else if (r.isWall) R.bad('THE CAP REFUSED 1100 CHARS (' + r.reason + ') \u2014 Page2 read-aloud is broken. REVERT.');
        else R.hm('upstream, NOT the cap: ' + r.upstream);

        return speak({ text: 'palm tree '.repeat(1000) });         // 10,000 chars
      })
      .then(function (r) {
        if (r.isWall) R.ok('10,000 chars REFUSED by the wall \u2014 ' + r.reason);
        else R.bad('10,000 chars NOT refused (' + r.status + ') \u2014 the cap is not live. Did the deploy take?');

        return speak({ text: 'ok', style: 'y'.repeat(5000) });     // smuggled through `style`
      })
      .then(function (r) {
        if (r.isWall) R.ok('a payload smuggled through `style` REFUSED \u2014 ' + r.reason);
        else R.hm('the style field was not capped (' + r.status + ')');
        return R;
      });
  }

  /* ── HISTORY — where does a real conversation break? ────────────────────── */
  function history(R) {
    R = R || new Report();
    head('THE HISTORY CAP');

    return chat({ system: 'Reply with the single word: ok.', messages: [{ role: 'user', content: 'say ok' }] })
      .then(function (r) {
        if (r.ok) R.ok('a normal turn works \u2014 ' + r.status);
        else if (r.isWall) R.bad('A NORMAL TURN WAS REFUSED (' + r.reason + ') \u2014 the chat is broken. REVERT.');
        else R.hm('upstream, NOT the cap: ' + r.upstream);

        var sizes = [21, 41, 59, 61, 81], i = 0, hit = 0, up = null;
        function next() {
          if (i >= sizes.length) return;
          var n = sizes[i++];
          return chat({ system: 'Reply with: ok.', messages: msgs(n) }).then(function (rr) {
            if (rr.isWall) { hit = n; return; }
            if (!rr.ok)   { up = n + ' msgs \u2192 ' + rr.upstream; return; }
            return next();
          });
        }
        return Promise.resolve(next()).then(function () {
          if (up) R.hm('an upstream error, NOT the cap: ' + up);
          var bounded = false;
          try {
            bounded = window.Amenti && window.Amenti.chat &&
                      typeof window.Amenti.chat.create({ figure: { name: 'x' } })._payload === 'function';
          } catch (e) {}

          if (hit && bounded) {
            R.ok('the cap bites at ' + hit + ' messages \u2014 but the anchored window keeps this page at ~21. UNREACHABLE. Good.');
          } else if (hit) {
            var ex = Math.floor(hit / 2);
            R.hm('the cap bites at ' + hit + ' messages \u2248 ' + ex + ' EXCHANGES \u2014 and this page sends the WHOLE history.');
            R.hm('So a conversation past ~' + ex + ' back-and-forths will fail with "[signal lost]".');
            R.hm('This is the WALL WORKING on a frontend that has not shipped yet.');
            R.hm('THE FIX IS amenti-chat.js (the anchored window), not a bigger cap.');
          } else if (!up) {
            R.ok('no history size up to 81 messages was refused');
          }
          return R;
        });
      });
  }


  /* ── MUSTER — the manifest DECLARES; this VERIFIES; the diff is the finding ─
     Four questions, and each one has already burned this fleet once:

       MISSING       declared, never sailed
       STOWAWAY      aboard, on no roll       <- this is how AMENTI_VOICE hid, a
                                                 FOURTH speech engine nobody listed
       ADRIFT        aboard, zero callers     <- this is voiceprofiles.js, which
                                                 cost an entire design session
       TWO CAPTAINS  one station, several ships <- FOUR TTS engines on one endpoint,
                                                 and the chunk boundaries are the
                                                 cache key, so the archive renders twice
     ─────────────────────────────────────────────────────────────────────── */
  function get(path) {
    try {
      return path.split('.').reduce(function (o, k) { return o && o[k]; }, window);
    } catch (e) { return undefined; }
  }

  function muster(R) {
    R = R || new Report();
    var M = window.Amenti && window.Amenti.manifest;
    if (!M) { R.bad('NO MANIFEST ABOARD — load amenti-manifest.js. The probe has nothing to check against.'); return R; }

    head('THE MUSTER  (manifest ' + M.__v + ')');

    /* --- who answered the roll? --- */
    var aboard = 0, missing = [];
    M.crew.forEach(function (c) {
      if (!c.global) return;                       // no colours to hoist; cannot be sighted
      var live = get(c.global) !== undefined && get(c.global) !== null;
      if (live) {
        aboard++;
        var v = get(c.global + '.__v');
        if (c.adrift) {
          R.hm('ADRIFT \u2014 ' + c.file + ' (' + c.name + ') is ABOARD but has ZERO CALLERS. ' + (c.warn || ''));
        } else {
          R.ok(c.file + '  ' + c.name + (v ? '  (' + v + ')' : ''));
          if (c.warn) R.hm('   \u2514 ' + c.warn);
        }
      } else if (c.adrift) {
        R.ok(c.file + ' correctly NOT aboard (it is a spec, not crew)');
      } else if (c.optional) {
        R.note(c.file + ' \u2014 ' + c.name + ' (optional; not on this surface)');
      } else {
        missing.push(c);
      }
    });
    missing.forEach(function (c) {
      R.note('not on this surface: ' + c.file + ' \u2014 ' + c.name);
    });

    /* --- STOWAWAYS: aboard, on no roll --- */
    var declared = {};
    M.crew.forEach(function (c) { if (c.global) declared[c.global.split('.')[0] + '|' + c.global] = 1; });
    var KNOWN_STOWAWAYS = [
      { g: 'AMENTI_VOICE', what: 'a FOURTH speech engine, inline in Page1, on no roll. It had no stop() at all, ' +
                                 'which is why the figure could not be interrupted.' }
    ];
    KNOWN_STOWAWAYS.forEach(function (s) {
      if (get(s.g) && !declared['|' + s.g]) {
        R.hm('STOWAWAY \u2014 ' + s.g + ': ' + s.what);
      }
    });

    /* --- TWO CAPTAINS: one station, several ships --- */
    Object.keys(M.stations || {}).forEach(function (name) {
      var st = M.stations[name];
      if (st.ok) return;
      R.hm('TWO CAPTAINS at "' + name + '" \u2014 should be ' + st.should + ', but the fleet carries ' +
           st.actual.length + ': ' + st.actual.join(' \u00b7 '));
      if (st.finding) R.hm('   \u2514 ' + st.finding);
    });

    /* --- THE ROLL OF SOVEREIGNS: does it agree with itself? --- */
    var S = M.sovereigns;
    if (S) {
      var roll = get(S.roll);
      if (Array.isArray(roll)) {
        R.ok(S.roll + ' aboard \u2014 ' + roll.length + ' Sovereigns');
        var profiles = get('AMENTI_VOICE_PROFILES');
        if (profiles) {
          var keys = roll.map(function (c) { return c.key; }).filter(Boolean);
          var voiced = Object.keys(profiles);
          var mute = keys.filter(function (k) { return voiced.indexOf(k) === -1; });
          if (mute.length) {
            R.hm('the choir does NOT map 1:1 \u2014 ' + mute.length + ' Sovereign(s) have NO voice: ' + mute.join(', '));
          } else R.ok('every Sovereign has a voice profile');
        }
        if (S.warn) R.hm(S.warn);
      } else {
        R.note(S.roll + ' not on this surface (Page2 sails from the CSV roster)');
      }
    }
    return R;
  }

  function full() {
    var R = new Report();
    console.log('%c\nAMENTI \u00b7 PROBE  ' + Amenti.probe.__v, 'font-size:15px;font-weight:700');
    state(R);
    muster(R);
    return wall(R).then(function () { return history(R); }).then(function () { return R.verdict(); });
  }


  /* ── THE PROBE HANDS BACK A FILE ────────────────────────────────────────
     No selecting. No copying. No mouse. A .txt lands in Downloads, and the
     captain drags one file into the chat.

     It also lands on the clipboard, because sometimes even a drag is too much.
     ────────────────────────────────────────────────────────────────────── */
  function stamp() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function download(text, name) {
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) { return false; }
  }

  function header() {
    return [
      'AMENTI · PROBE REPORT',
      'probe    ' + Amenti.probe.__v,
      'when     ' + new Date().toISOString(),
      'page     ' + location.href,
      'agent    ' + navigator.userAgent,
      'proxy    ' + BASE,
      Array(61).join('=')
    ].join('\n');
  }

  /* THE ONE THE CAPTAIN CALLS. Runs everything, writes a file, copies it too. */
  function report() {
    LOG = [];
    return full().then(function (v) {
      var text = header() + '\n' + LOG.join('\n') + '\n';
      var name = 'amenti-probe-' + stamp() + '.txt';

      var wrote = download(text, name);
      try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}

      console.log('%c\n\u2b07 ' + (wrote ? name + ' is in your Downloads' : 'download blocked — the text is on your clipboard'),
        'font-size:14px;font-weight:700;color:#185FA5');
      console.log('%c   (and it is on the clipboard either way \u2014 no mouse required)', DIM);
      return v;
    });
  }

  Amenti.probe = {
    __v: VERSION,
    state: function () { var R = state(new Report()); return R.verdict(); },
    muster: function () { var R = muster(new Report()); return R.verdict(); },
    wall:  function () { return wall(new Report()).then(function (R) { return R.verdict(); }); },
    history: function () { return history(new Report()).then(function (R) { return R.verdict(); }); },
    full: full,
    report: report,        // <- THE ONE TO CALL. Runs everything, downloads a .txt.
    text: function () { return header() + '\n' + LOG.join('\n') + '\n'; },
    PROXY: BASE
  };

  // ?probe=1 prints the FREE state check only. Nothing that costs money ever
  // runs without being asked for by name.
  /* NO TYPING AT ALL:
       ?probe=1        free   · state + muster, printed
       ?probe=report   ~3c    · everything, and a .txt lands in Downloads
     Nothing that costs money runs unless the URL asks for it BY NAME. */
  try {
    var q = location.search;
    var go = function (fn) {
      if (document.readyState === 'complete') fn();
      else window.addEventListener('load', fn);
    };
    if (/[?&]probe=report(&|$)/.test(q))      go(function () { Amenti.probe.report(); });
    else if (/[?&]probe=1(&|$)/.test(q))      go(function () { Amenti.probe.state(); Amenti.probe.muster(); });
  } catch (e) {}

  console.log('%cAmenti.probe ready \u2014 call Amenti.probe.report()  (runs everything, downloads a .txt)', DIM);
  console.log('%c  or: ?probe=report in the URL. No typing, no mouse.', DIM);
})();
