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
  if (Amenti.probe && Amenti.probe.__v) return;

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

  function Report() {
    this.pass = 0; this.fail = 0; this.warn = 0;
  }
  Report.prototype.ok   = function (m) { console.log('%c  PASS  %c' + m, OK, ''); this.pass++; };
  Report.prototype.bad  = function (m) { console.log('%c  FAIL  %c' + m, NO, ''); this.fail++; };
  Report.prototype.hm   = function (m) { console.log('%c  WARN  %c' + m, WN, ''); this.warn++; };
  Report.prototype.note = function (m) { console.log('%c  ----  %c' + m, DIM, DIM); };
  Report.prototype.verdict = function () {
    console.log('%c' + Array(61).join('\u2500'), DIM);
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
    console.log('%c\nWHAT THIS PAGE IS ACTUALLY RUNNING', H);
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
    if (bounded) R.ok('THE ANCHORED WINDOW IS LIVE \u2014 the payload is bounded no matter how long the talk runs');
    else if (A.chat) R.hm('THE ANCHORED WINDOW IS NOT LIVE \u2014 this page sends the WHOLE history every turn. Cost grows quadratically, and the Worker will refuse it past ~30 exchanges.');

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
    console.log('%c\nTHE WALL  (a FAIL here means a LEGITIMATE request was refused)', H);

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
    console.log('%c\nTHE HISTORY CAP  (only matters while the anchored window is NOT deployed)', H);

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

    console.log('%c\nTHE MUSTER  (manifest ' + M.__v + ')', H);

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

  Amenti.probe = {
    __v: '2026.07',
    state: function () { var R = state(new Report()); return R.verdict(); },
    muster: function () { var R = muster(new Report()); return R.verdict(); },
    wall:  function () { return wall(new Report()).then(function (R) { return R.verdict(); }); },
    history: function () { return history(new Report()).then(function (R) { return R.verdict(); }); },
    full: full,
    PROXY: BASE
  };

  // ?probe=1 prints the FREE state check only. Nothing that costs money ever
  // runs without being asked for by name.
  try {
    if (/[?&]probe=1(&|$)/.test(location.search)) {
      if (document.readyState === 'complete') Amenti.probe.state();
      else window.addEventListener('load', function () { Amenti.probe.state(); });
    }
  } catch (e) {}

  console.log('%cAmenti.probe ready \u2014 .state() \u00b7 .muster() free \u00b7 .wall() ~1\u00a2 \u00b7 .full() ~3\u00a2', DIM);
})();
