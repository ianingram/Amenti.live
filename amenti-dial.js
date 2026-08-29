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

  /* ── THE CONTEXT MUST BE RESUMED · FOUND ON GLASS 28 AUG 2026 ────────────
     This returned `new C()` and nothing else, and the dial was SILENT on real
     hardware while every stub reported it firing.

     A browser creates an AudioContext SUSPENDED and keeps it suspended until a
     user gesture resumes it. Notes scheduled into a suspended context do not
     play, do not queue, and DO NOT THROW — osc.start() succeeds and no sound
     is made. There is nothing in a console to see.

     The announcement was audible because the TTS engine has its own context,
     already resumed by an earlier press. The dial's was brand new and asleep.

     resume() returns a promise and the notes are scheduled against ac.currentTime,
     which does not advance while suspended — so the schedule is built AFTER the
     resume settles, never before.

     A NOTE THAT IS SCHEDULED AND SILENT IS THE HARDEST KIND OF FAULT: it looks
     exactly like success from the inside. */
  function ctx() {
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    var ac = new C();
    if (ac.state === 'suspended' && ac.resume) {
      try { ac.resume(); } catch (e) {}
    }
    return ac;
  }

  /* Wait for the context to actually be running before scheduling against its
     clock. Resolves immediately when it already is. If a browser refuses to
     resume — no gesture in the stack — this still resolves, and the caller
     proceeds: a dial that hangs is worse than a dial that is quiet. */
  function ready(ac) {
    return new Promise(function (res) {
      if (!ac || ac.state === 'running') return res(ac);
      var done = false;
      var go = function () { if (!done) { done = true; res(ac); } };
      if (ac.resume) { try { ac.resume().then(go, go); } catch (e) { go(); } }
      else go();
      setTimeout(go, 400);
    });
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

    /* ── THE ANSWER IS PLACED HERE, NOT BY THE CALLER ────────────────────
       Page1 used to do this, on two consecutive lines with nothing between:

           AmentiDial.place();
           this.speak("I am here.");

       Both fired at once. The engine's stopReading() does not save it either,
       because each call waits on resolveVoice() before it schedules — so both
       resolve, both schedule onto the AudioContext, and BOTH PLAY. The hall
       announced itself while the figure was already answering, over the top of
       it.

       THE GREETING IS THE ANSWER TO THE RING, NOT A SECOND ANNOUNCEMENT. So
       the dial fires it, at the one moment that is correct: the line is open,
       the phone is ringing, and there is something for the ring to end on.

       It is optional. A caller that passes no onRinging gets exactly the old
       behaviour minus the collision — an unanswered ring that times out and
       says so. */
    function startRinging() {
      if (!live) return;
      state = 'ringing';
      ringing = true;
      ringOnce();
      if (typeof opts.onRinging === 'function') {
        try { opts.onRinging(); }
        catch (e) { console.warn('amenti-dial: the answer could not be placed —', e); }
      }
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

    /* THE FIRST SOUND THIS SEQUENCE MAKES ITSELF, so the resume is waited on
       here and nowhere else. The announcement above goes through the TTS
       engine, whose context is already running; only these notes need a
       context of our own.

       ac.currentTime DOES NOT ADVANCE while a context is suspended, so
       scheduling before the resume settles puts every note at a timestamp
       already in the past — which is silently dropped. Schedule after. */
    function tone() {
      if (!live) return;
      state = 'tone';
      if (!ac) { after((TONE_LEN + TONE_GAP) * 1000, startRinging); return; }
      ready(ac).then(function () {
        if (!live) return;
        note(ac, TONE_HZ, ac.currentTime + 0.02, TONE_LEN, 0.06);
        after((TONE_LEN + TONE_GAP) * 1000, startRinging);
      });
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

  /* ── WIRING ────────────────────────────────────────────────────────────
     The engine dispatches `amenti:voice-started` at the instant the first
     buffer is scheduled — the only moment that means "the soul is speaking".
     It is NOT isSpeaking(): that goes true when the player is created, which
     is before the fetch, so it is already true for the whole wait this
     sequence exists to cover.

     One call is live at a time, so a single listener is enough. It is
     registered once, at load, and simply finds nothing to answer when no
     call is open. */
  var current = null;

  window.addEventListener('amenti:voice-started', function () {
    if (current && current.live) current.answered();
    current = null;
  });

  /* auto: opened by press, closed by the first sound, with no caller in
     between having to remember to do it. */
  function place(opts) {
    if (current && current.live) current.cancel();
    current = open(opts);
    return current;
  }

  window.AmentiDial = {
    open: open,            /* manual — the caller ends it */
    place: place,          /* wired — the first sound ends it */
    get current() { return current; },
    ANNOUNCEMENT: ANNOUNCEMENT,
    MAX_RING: MAX_RING
  };
})();
