/* ============================================================================
   amenti-visits.js  ·  HOW LONG IS A REAL VISIT?
   ----------------------------------------------------------------------------
   Every pricing question about this system waits on one number nobody has.

   BRIEF-WHAT-AN-HOUR-COSTS prices an hour at $1.24 and then says plainly that
   ALMOST NOBODY TALKS FOR AN HOUR — the unit is the visit, and the visit was
   MODELLED, not measured. Eleven cents for two minutes is arithmetic on a
   guess. A free tier drawn against a guess is a guess.

   window.AmentiCost has recorded the truth turn by turn ever since the usage
   field stopped being discarded. It simply dies with the tab. This catches it.

   ── WHAT IT SENDS ─────────────────────────────────────────────────────────
   The SHAPE of a visit and nothing else:

       { figure, mode, turns, inTok, outTok, seconds, via }

   NO transcript. NO reader — signed in or out, there is no identity in a
   reading and no token is sent. `via` is a CHANNEL, not a person: "qr",
   "poster", "card". It says which door somebody came through and nothing
   whatever about who they are. Which is why the route needs no auth: there is
   nothing in it belonging to anybody.

   ── A DELTA, NOT A TOTAL ──────────────────────────────────────────────────
   AmentiCost is page-wide and cumulative across every conversation in the tab.
   A visit is the difference between two snapshots. Get this wrong and the
   second conversation of a session reports the first one as well.

   ── IT NEVER BLOCKS AND NEVER SPEAKS ──────────────────────────────────────
   No console noise, no thrown errors, no awaited call in front of a reader.
   A measurement that costs a person a delay has failed at being a measurement.
   ============================================================================ */

(function () {
  'use strict';

  var PROXY_VISIT = 'https://amenti-proxy.ingram-ian.workers.dev/visit';

  var mark = null;      /* the snapshot a visit is measured from */

  /* ── WHERE THEY CAME FROM ──────────────────────────────────────────────
     A reader arriving by QR, poster, placard or card carries ?via= on the
     landing URL. It is read ONCE and remembered for the session, because the
     parameter is only ever on the first page — a reader who lands on the hall
     by QR and then walks to the flagship is still a QR arrival, and a
     per-page read would forget that at the first click.

     sessionStorage, not localStorage: it belongs to this visit and should not
     follow somebody around for weeks. A tab closed is an arrival ended.

     Deliberately coarse and non-identifying: a short token from a fixed
     alphabet, no free text, nothing that could carry an id smuggled in a URL.
     "qr" is a channel; anything longer than 24 characters is somebody trying
     something and is dropped. */
  var VIA_KEY = 'amenti.via';

  function via() {
    try {
      var q = (new URLSearchParams(location.search)).get('via');
      if (q) {
        q = String(q).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
        if (q) { try { sessionStorage.setItem(VIA_KEY, q); } catch (e) {} return q; }
      }
      return sessionStorage.getItem(VIA_KEY) || '';
    } catch (e) { return ''; }
  }

  /* Read at load so the parameter is captured even if the reader navigates
     away before speaking a word. */
  try { via(); } catch (e) {}

  function snap() {
    var c = window.AmentiCost || { turns: 0, inputTokens: 0, outputTokens: 0 };
    return { turns: c.turns || 0, inTok: c.inputTokens || 0, outTok: c.outputTokens || 0, at: Date.now() };
  }

  window.AmentiVisits = {

    /* Called when a conversation BEGINS — arriving at a figure. Cheap, and
       safe to call repeatedly; the last call before the turns start is the
       one that counts. */
    begin: function () { mark = snap(); },

    /* Called when a conversation ENDS — leaving a figure, or the page going
       away. Reports the delta and re-marks, so a second conversation in the
       same tab measures only itself.

       Returns nothing worth awaiting. A visit with no turns sends nothing:
       opening a figure and leaving is not a visit, and counting it would drag
       the median toward zero and make every conversation look shorter than it
       was. */
    end: function (figureKey, mode, useBeacon) {
      var now = new Date();
      if (!mark) { mark = snap(); return; }
      var s = snap();
      var rec = {
        figure:  String(figureKey || ''),
        mode:    mode === 'counsel' ? 'counsel' : 'character',
        turns:   s.turns  - mark.turns,
        inTok:   s.inTok  - mark.inTok,
        outTok:  s.outTok - mark.outTok,
        seconds: Math.round((s.at - mark.at) / 1000),
        via:     via(),
      };
      mark = s;
      if (rec.turns <= 0) return;

      var body = JSON.stringify(rec);
      try {
        /* On the page going away, fetch is cancelled mid-flight — sendBeacon
           is the only thing the browser promises to deliver. Without it the
           readings would be biased toward visits that ended by NAVIGATION and
           miss every visit that ended by CLOSING THE TAB, which is most of
           them. That bias would be invisible and would make every conclusion
           wrong in the same direction. */
        if (useBeacon && navigator.sendBeacon) {
          navigator.sendBeacon(PROXY_VISIT, new Blob([body], { type: 'application/json' }));
          return;
        }
        fetch(PROXY_VISIT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
        }).catch(function () {});
      } catch (e) { /* a measurement never speaks */ }
    },

    _mark: function () { return mark; },
  };

  /* THE TAB CLOSING IS THE COMMONEST ENDING and the one a page-lifecycle
     handler is for. `pagehide` fires where `unload` does not on iOS, which is
     where most phone conversations end. The host sets what is current. */
  window.addEventListener('pagehide', function () {
    var f = window.AmentiVisits._current;
    if (f) window.AmentiVisits.end(f.key, f.mode, true);
  });
})();
