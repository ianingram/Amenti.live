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

    /* exposed for probes and for the writer, which needs the same split */
    _splitName: splitName,
    _signedIn: function () { return !!token(); },
  };
})();
