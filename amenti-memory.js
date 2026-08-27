/* ============================================================================
   amenti-memory.js  ·  LOADING WHAT A FIGURE RECALLS
   ----------------------------------------------------------------------------
   The join between the mint's /memory routes and the chat core's
   setUserName() / setRecollection(). Nothing else.

       AmentiMemory.load(chat, 'lincoln')     before the first turn
       AmentiMemory.save('lincoln', facts)    after a conversation

   ── WHY THIS IS NOT IN amenti-chat.js ─────────────────────────────────────
   The chat core holds no token, no Worker hostname, and no knowledge of
   Supabase — and it should not start. It renders what it is handed, the same
   way it handles `context`. This file is the only place that knows where
   memory lives, which means moving the store later is one edit here.

   ── SIGNED OUT IS NOT AN ERROR ────────────────────────────────────────────
   Most readers are not signed in and never will be. That path must be
   completely silent: no console noise, no failed request, no degraded state.
   A figure with no memory is the ordinary case and behaves exactly as it did
   before any of this existed.

   ── THE NAME IS SEPARATED FROM THE FACTS ──────────────────────────────────
   A remembered name goes to setUserName(), NOT into the recollection list, so
   it reaches nameGuidance() — which already carries the doctrine's rule (§4.5:
   go big once, then hold in reserve). Memory extends that across sessions
   rather than writing a second rule beside it. A name inside the fact list
   would produce a figure who ANNOUNCES the name instead of using it.

   ── EMPTY GLASS ───────────────────────────────────────────────────────────
   Every failure leaves the figure with NO memory rather than partial memory.
   A half-loaded list is a figure who remembers your aunt and not your name,
   which reads as damage. Nothing here ever throws into the caller.
   ============================================================================ */

(function () {
  'use strict';

  var MINT = 'https://amenti-mint.ingram-ian.workers.dev';

  /* The name is stored as a fact like any other — the writer keeps it in the
     form the reader gave it — and lifted back out here. Deliberately strict:
     anything that is not plainly "Name: X" stays in the list as an ordinary
     fact rather than being guessed at. A wrong name is worse than none. */
  var NAME_LINE = /^(?:name|called|goes by)\s*[:\u2014-]\s*(.{1,40})$/i;

  function splitName(facts) {
    var name = '', rest = [];
    (facts || []).forEach(function (f) {
      var m = NAME_LINE.exec(String(f || '').trim());
      if (m && !name) name = m[1].trim();
      else rest.push(f);
    });
    return { name: name, facts: rest };
  }

  /* The reader's session token, found rather than hardcoded so this keeps
     working if the Supabase project ref changes. Absent means signed out,
     which is not a failure. */
  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-.*-auth-token$/.test(k)) continue;
        var v = JSON.parse(localStorage.getItem(k));
        var t = v && (v.access_token || (v.currentSession && v.currentSession.access_token));
        if (t) return t;
      }
    } catch (e) {}
    return null;
  }

  function read(figureKey) {
    var tok = token();
    if (!tok) return Promise.resolve(null);          /* signed out: silent */
    var key = String(figureKey || '').trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(key)) return Promise.resolve(null);

    /* try/catch AND .catch. A fetch that throws SYNCHRONOUSLY — offline, a
       blocked request, no fetch at all — never returns a promise, so .catch
       alone does not see it and the error escapes into the caller. Caught 27
       Aug by the offline test; it would otherwise have surfaced as a broken
       page the first time somebody lost signal. */
    try {
      return fetch(MINT + '/memory?figure=' + encodeURIComponent(key),
        { headers: { Authorization: 'Bearer ' + tok } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return (d && Array.isArray(d.facts)) ? d.facts : null; })
        .catch(function () { return null; });        /* empty glass */
    } catch (e) { return Promise.resolve(null); }
  }


  /* ══ THE WRITER ═════════════════════════════════════════════════════════
     At the end of a conversation, one model call decides what was worth
     keeping. BRIEF-THE-FIGURE-REMEMBERS §5 calls this the place the quality of
     the whole feature lives, and it is right: get this wrong and the list
     fills with noise that a figure then recites back at people.

     ── IT SPEAKS THROUGH THE ONE DOOR ────────────────────────────────────
     window.claude.complete — the same proxy every other call uses. Not a new
     route, not a new credential. The alternative was giving the mint an
     Anthropic key so it could do this server-side, which would put the same
     secret in two Workers and undo the separation the architecture rests on.
     It also means the spend lands in window.AmentiCost with everything else,
     rather than being a cost nobody counted.

     ── IT READS THE TRANSCRIPT, NOT A SUMMARY ────────────────────────────
     The chat core's rolling summary is the confirmed Turn, and the Turn is
     COUNSEL ONLY. In character mode there is nothing to read but the turns
     themselves, so that is what goes in — bounded, and the visitor's half
     weighted, because the facts are about them.

     ── IT IS GIVEN THE OLD LIST ──────────────────────────────────────────
     So a correction REPLACES rather than accumulating. "My aunt is May, and I
     live in Portland now" has to overwrite, or the figure ends up holding two
     aunts and two cities. The merge happens HERE and only here: the route does
     not merge, deliberately, because two places deciding the same thing is how
     they come to disagree.
     ═══════════════════════════════════════════════════════════════════════ */

  /* Enough conversation to have learned anything. Below this, a call would
     mostly return nothing and always cost something. */
  var MIN_TURNS = 4;
  /* The transcript is unbounded; this is not. Recent turns matter more — a
     person says who they are early and then talks. */
  var MAX_CHARS = 12000;

  function transcript(history) {
    var h = (history || []).slice(-40);
    var lines = h.map(function (m) {
      return (m.role === 'user' ? 'VISITOR: ' : 'FIGURE: ') + String(m.content || '');
    });
    var out = lines.join('\n');
    if (out.length > MAX_CHARS) out = out.slice(-MAX_CHARS);
    return out;
  }

  function writerSystem(figureName, known) {
    var lines = [
      'You are reading one conversation between a visitor and ' + (figureName || 'a figure') +
        ' in the library of Amenti. Your only job is to note what a person would naturally remember about THE VISITOR afterwards.',
      '',
      'ALREADY REMEMBERED about this visitor:',
      (known && known.length) ? known.map(function (f) { return '  \u00b7 ' + f; }).join('\n')
                              : '  (nothing yet — this is the first time)',
      '',
      'Where something in the conversation covers the same ground as one of those, REPLACE it. Do not accumulate. If they say they have moved, the old place is gone.',
      '',
      'Return the WHOLE list as it should now stand, one fact per line, nothing else. No numbering, no preamble, no commentary. At most 8 lines, each under twelve words.',
      'Returning the list unchanged is a correct answer. So is returning fewer lines than you were given, if something was corrected away.',
      '',
      'KEEP only what is about the visitor and still true in a year: people in their life, what kind of work they do, what part of the world they are in, what they care about, something they said they would do.',
      '',
      'KEEP IT COARSE. A region or a state, NEVER a town or an address. A kind of work, never an employer or a rank. "Virginia" is a talking point; "Richmond" is an address — keep the first and drop the second, EVEN IF the visitor volunteered both. Never an age, a birthday, a school, or a surname.',
      '',
      'A TITLE IS NOT A NAME. If they say they are a senator or a doctor, keep the work. The figure will ask how the session went; it will never call them Senator.',
      '',
      'THE NAME. If they gave a first name, keep it as the FIRST line, in exactly this form:  Name: Roger',
      'Use the form they used — Roger, not Roger Whitfield. If no name was given, no Name line.',
      '',
      'DO NOT KEEP: anything the figure said; what the conversation was about; questions the visitor asked; their mood or circumstances that day; anything they seem to regret saying.',
      '',
      'Keep only what a reasonable person would take at face value. If the visitor is clearly playing, testing you, or being absurd, keep nothing from it. A PERSON WHO IS JOKING HAS TOLD YOU NOTHING ABOUT THEMSELVES.',
      '',
      'Write each fact as a plain statement, not a quote. "Has an aunt, Jane" — not "said his aunt Jane is unwell".',
    ];
    return lines.join('\n');
  }

  /* Every bound is enforced here as well as in the prompt. A model that
     decides to return twenty lines is a model that changed; the caps should
     not depend on it having behaved. */
  function clean(raw) {
    return String(raw || '')
      .split('\n')
      .map(function (l) { return l.replace(/^[\s\-\u2022\u00b7*\d.)]+/, '').trim(); })
      .filter(Boolean)
      .filter(function (l) { return l.length <= 140; })
      .filter(function (l) { return !/^\(?nothing/i.test(l); })
      .slice(0, 8);
  }

  window.AmentiMemory = {

    /* Load this figure's memory of this reader into a live chat.
       ALWAYS clears first: tuning from Lincoln to Caesar must never leave
       Lincoln's memory in the prompt, and a failed fetch must not either.
       Resolves to the number of facts loaded, so a caller can log or ignore. */
    load: function (chat, figureKey) {
      if (!chat || typeof chat.setRecollection !== 'function') return Promise.resolve(0);
      chat.setRecollection([]);
      if (typeof chat.setUserName === 'function') chat.setUserName('');

      return read(figureKey).then(function (facts) {
        if (!facts || !facts.length) return 0;
        var split = splitName(facts);
        if (split.name && typeof chat.setUserName === 'function') chat.setUserName(split.name);
        chat.setRecollection(split.facts);
        return split.facts.length + (split.name ? 1 : 0);
      });
    },

    /* Write the list back. The caller sends the WHOLE list as it should now
       stand — the writer has already merged corrections into it. This does not
       merge, because a merge here and a merge in the writer would be two places
       deciding the same thing. Resolves true/false; never throws. */
    save: function (figureKey, facts) {
      var tok = token();
      if (!tok) return Promise.resolve(false);
      var key = String(figureKey || '').trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(key) || !Array.isArray(facts)) return Promise.resolve(false);

      try {
        return fetch(MINT + '/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
          body: JSON.stringify({ figure: key, facts: facts }),
        }).then(function (r) { return r.ok; }).catch(function () { return false; });
      } catch (e) { return Promise.resolve(false); }
    },

    /* Read a finished conversation and write back what is worth keeping.
       Returns the list written, or null if nothing was (signed out, too short,
       the door missing, or the model returning nothing usable).

       CALL IT WHEN A CONVERSATION ENDS — on leaving a figure, or explicitly.
       It never throws, and a failure simply leaves the previous list standing,
       which is the correct outcome: an old memory is better than a lost one. */
    remember: function (figureKey, figureName, history, known) {
      var tok = token();
      if (!tok) return Promise.resolve(null);                     /* signed out */
      if (!window.claude || typeof window.claude.complete !== 'function') return Promise.resolve(null);
      var h = history || [];
      if (h.length < MIN_TURNS) return Promise.resolve(null);      /* too little said */

      var self = this;
      var body = transcript(h);
      if (!body.trim()) return Promise.resolve(null);

      try {
        return window.claude.complete({
          system: writerSystem(figureName, known || []),
          messages: [{ role: 'user', content: body }],
        }).then(function (raw) {
          var facts = clean(raw);
          /* An empty result is a REFUSAL, not a failure — most conversations
             contain nothing worth keeping, and the prompt says so. But it must
             not wipe a list that already exists. */
          if (!facts.length) return null;
          return self.save(figureKey, facts).then(function (ok) { return ok ? facts : null; });
        }).catch(function () { return null; });
      } catch (e) { return Promise.resolve(null); }
    },

    /* exposed for probes and for the writer, which needs the same split */
    _splitName: splitName,
    _signedIn: function () { return !!token(); },
    _writerSystem: writerSystem,
    _clean: clean,
    _transcript: transcript,
    MIN_TURNS: MIN_TURNS,
  };
})();
