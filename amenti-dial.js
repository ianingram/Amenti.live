/* ============================================================================
   amenti-dial.js  ·  THE DIAL SEQUENCE
   ----------------------------------------------------------------------------
   Pressing TALK does not drop a reader into a conversation. It places a call.

       1 · a voice      "Amenti Interface"     the building answers first
       2 · a brief tone                        the handoff
       3 · the phone rings                     the connection is live
       4 · the soul speaks                     "hello"

   NO UI. NO ASSETS. One object that runs the sequence and stops when the
   figure's audio arrives.

       var call = AmentiDial.open();     // press talk
       ...                               // the reply is fetched
       call.answered();                  // the ring stops, mid-ring

   ── WHY THIS EXISTS AT ALL ────────────────────────────────────────────────
   The first utterance of any conversation is a cache MISS. Measured 16 July:
   6,103 ms against 1,936 ms for a hit. Today that gap is dead air, and dead
   air reads as broken — the commonest reason a person decides a thing does not
   work is that it said nothing while it was working.

   The sequence does not hide the wait. It NARRATES it. Every beat tells the
   reader where they are in the connection, so six seconds becomes a call being
   put through rather than a page that has stopped.

   ── THE RING ENDS WHEN THE AUDIO ARRIVES, NOT AFTER N RINGS ───────────────
   A fixed two-ring loop finishes early on a slow miss and hands the reader
   silence again — the exact fault this was built to cover. Steps 1 and 2 are
   fixed length; step 3 is elastic and rings until `answered()` is called.
   If nobody ever calls it, MAX_RING stops the ringing rather than letting a
   failed fetch ring forever — and it reports that it timed out rather than
   ending quietly, because a sequence that fails silently is the fault again.

   ── SYNTHESISED, NOT FETCHED ──────────────────────────────────────────────
   A ring is two sine waves. Hosting it as a file would add two requests that
   can 404, two paths to cache-bust, and a wait before the sound that covers a
   wait. WebAudio has no such problem: it makes sound before the network has
   answered anything, which is precisely when this needs to be heard.

   The ANNOUNCEMENT is different — it is speech, and it is the hall's own
   voice, so it goes through the one door like every other utterance. One
   fixed line, spoken by the building, identical on every soul: generated once,
   a cache hit forever after. If the speaker is absent the sequence carries on
   without it and says so in the console. Empty glass: it never pretends to
   have said something it did not say.
   ========================================================================== */

(function () {
  'use strict';

  var ANNOUNCEMENT = 'Amenti Interface';

  /* North American ring cadence: two tones together, two seconds on, four off.
     The pair is what makes it read as a telephone rather than a beep. */
  var RING_A = 440, RING_B = 480;
  var RING_ON = 2.0, RING_OFF = 4.0;

  var TONE_HZ = 950, TONE_LEN = 0.18, TONE_GAP = 0.35;

  /* A cache miss ran ~6.1s on 16 July. Thirty seconds is far beyond that and
     is a backstop against a fetch that never lands, not a normal path. */
  var MAX_RING = 30000;

  function ctx() {
    var C = window.AudioContext || window.webkitAudioContext;
    return C ? new C() : null;
  }

  /* Every note is enveloped. A bare gain switch clicks, and a click at the
     start of a ring sounds like a fault rather than a phone. */
  function note(ac, hz, at, dur, peak) {
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.02);
    g.gain.setValueAtTime(peak, at + dur - 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g); g.connect(ac.destination);
    osc.start(at); osc.stop(at + dur + 0.02);
    return osc;
  }

  function open(opts) {
    opts = opts || {};
    var ac      = ctx();
    var live    = true;
    var ringing = false;
    var timers  = [];
    var stopAt  = null;
    var onEnd   = typeof opts.onEnd === 'function' ? opts.onEnd : function () {};
    var state   = 'announcing';

    function after(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function clear() { timers.forEach(clearTimeout); timers = []; }

    function ringOnce() {
      if (!live || !ac) return;
      var t = ac.currentTime;
      note(ac, RING_A, t, RING_ON, 0.09);
      note(ac, RING_B, t, RING_ON, 0.09);
    }

    function startRinging() {
      if (!live) return;
      state = 'ringing';
      ringing = true;
      ringOnce();
      var loop = setInterval(function () {
        if (!live) { clearInterval(loop); return; }
        ringOnce();
      }, (RING_ON + RING_OFF) * 1000);
      timers.push(loop);

      /* The backstop SAYS it fired. A sequence that gives up quietly is the
         same dead air it was built to cover. */
      stopAt = setTimeout(function () {
        if (!live) return;
        state = 'timedout';
        finish('timeout');
      }, MAX_RING);
      timers.push(stopAt);
    }

    function tone() {
      if (!live) return;
      state = 'tone';
      if (ac) note(ac, TONE_HZ, ac.currentTime + 0.02, TONE_LEN, 0.06);
      after((TONE_LEN + TONE_GAP) * 1000, startRinging);
    }

    function finish(why) {
      if (!live) return;
      live = false; ringing = false;
      clear();
      if (ac && ac.close) { try { ac.close(); } catch (e) {} }
      onEnd(why || 'answered');
    }

    /* Step 1. The building speaks through the one door, like everything else.
       If that door is missing the call still goes through — it simply is not
       announced, and the console says which part did not happen. */
    var speak = opts.speak ||
      (window.Amenti && window.Amenti.throttle && window.Amenti.throttle.speak);

    if (typeof speak === 'function') {
      var said;
      try { said = speak(ANNOUNCEMENT, null, 'Amenti'); }
      catch (e) { said = null; console.warn('amenti-dial: the announcement could not be spoken —', e); }

      if (said && typeof said.then === 'function') said.then(tone, tone);
      else after(1100, tone);          /* no promise to wait on — give it a beat */
    } else {
      console.warn('amenti-dial: no speaker present, so the hall did not announce itself. Ringing anyway.');
      after(120, tone);
    }

    return {
      answered: function () { finish('answered'); },
      cancel:   function () { finish('cancelled'); },
      get state()   { return state; },
      get ringing() { return ringing; },
      get live()    { return live; }
    };
  }

  window.AmentiDial = { open: open, ANNOUNCEMENT: ANNOUNCEMENT, MAX_RING: MAX_RING };
})();
