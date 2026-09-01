#!/usr/bin/env node
/* ============================================================================
   probes/probe-interrupt.mjs  ·  CAN THE FIGURE BE INTERRUPTED?

     node probes/probe-interrupt.mjs            # from the repository root

   THIS WRITES NOTHING. It is a reading.

   ── WHY IT EXISTS, AND WHY IT IS NOT probe3 ───────────────────────────────
   THE SPEECH DOCTRINE'S CLAIM IS AN INTENT, NOT A FUNCTION. It says the figure
   can be interrupted — that a seeker may speak over the counsel and the counsel
   will stop. Everything else about barge-in and the Arrest stands on that one
   behaviour, and the doctrine records what happened when it was absent:

     "The counsel did not speak through amenti-throttle.js. It spoke through
      AMENTI_VOICE — a fourth speech engine, inline in Page1.html, on no
      manifest, listed nowhere, a stowaway — and it had no stop() at all.
      Every grand claim in the Matrix about barge-in and the Arrest was
      standing on a speaker with no brakes."

   That was fixed the right way: the engine moved into amenti-core.bundle.js as
   Amenti.conversation — chunked, streaming, cancellable — and what remains
   inline in Page1 is a FAÇADE that forwards to it.

   probe3 was written before that move. It tests Page1's object for machinery
   the repair deliberately relocated, so it reports seven failures that are its
   own and not the ship's. THAT IS THE LESSON THIS FILE IS NAMED FOR:

     probe3 tested an IMPLEMENTATION, so it broke when the implementation moved.
     A TEST WRITTEN AGAINST THE INTENT WOULD HAVE SURVIVED THE EXTRACTION
     UNTOUCHED. The engine moved. The intent did not.

   ── THE JOINT NOBODY WATCHES ──────────────────────────────────────────────
   Page1's stop() does not stop anything. It calls the bundle's stop and lets
   that do the work. So there are two ways the intent can fail, and only one of
   them throws:

     the bundle's stop is missing   -> the call errors. Loud. Findable.
     the façade never calls it      -> stop() exists, runs, returns, and NOTHING
                                       HALTS. Every existence check passes.

   The second is the doctrine's own last law wearing a new coat: BEING LOADED IS
   NOT BEING USED. A method that exists and quietly does nothing is worse than a
   missing one, because a missing one announces itself.

   So this probe does not ask whether stop() exists. It marks the bundle's real
   stop, calls the door the PAGE actually calls, and checks the mark moved.

   ── WHAT IT CANNOT SEE, STATED PLAINLY ────────────────────────────────────
   It proves the CALL reaches the engine. It cannot prove audio stopped in a
   browser — there is no browser here, and stopReading's own effect on a live
   AudioContext is beyond a static run. What it establishes is the thing that
   silently rots: that the two halves are still joined. If that holds and the
   figure still talks over you, the fault is inside stopReading and this probe
   will say so by passing, which is the honest limit of it.
   ========================================================================== */

import fs from 'fs';
import path from 'path';
import vm from 'vm';

const ROOT = process.argv.slice(2).find(a => !a.startsWith('--')) || '.';

let pass = 0, fail = 0, unread = 0;
const say   = m => console.log(m);
const ok    = m => { pass++;   say('  PASS    ' + m); };
const bad   = m => { fail++;   say('  FAIL    ' + m); };
const blind = m => { unread++; say('  UNREAD  ' + m); };
const note  = m => say('  ----    ' + m);

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
  catch (e) { blind('could not read ' + rel + ' — ' + (e.code || e.message)); return null; }
}

say('');
say('\u2500\u2500 can the figure be interrupted? \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
say('');

const page   = read('Page1.html');
const bundle = read('amenti-core.bundle.js');
if (unread) { say(''); note('nothing is claimed about interruption.'); say(''); process.exit(1); }

/* ── 1 · the page loads the engine at all ─────────────────────────────────
   The doctrine's most emphatic line is about a rewrite that was written,
   tested by three hundred assertions, and NOT RUNNING, because the Terminal
   had never loaded the conversation core. Check the script tag before
   checking anything it provides. */
if (!/<script src="amenti-core\.bundle\.js"/.test(page))
  bad('Page1 does not load amenti-core.bundle.js \u2014 the conversation core is not on the page');
else
  ok('Page1 loads amenti-core.bundle.js');

/* ── 2 · the engine really provides the door ─────────────────────────────── */
const sandbox = { window: {}, document: { getElementById: () => null, addEventListener() {} },
                  console: { log() {}, warn() {}, error() {} },
                  setTimeout, clearTimeout, fetch: () => Promise.reject(new Error('no network in a probe')) };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
try { vm.runInContext(bundle, sandbox, { timeout: 8000 }); }
catch (e) { blind('amenti-core.bundle.js would not load in isolation \u2014 ' + e.message); }

const conv = sandbox.window.Amenti && sandbox.window.Amenti.conversation;
if (!conv) {
  blind('window.Amenti.conversation is absent after loading the bundle');
  note('the fa\u00e7ade has nothing to forward to. No verdict on interruption.');
  say(''); process.exit(1);
}
ok('the bundle provides Amenti.conversation with ' +
   ['stop', 'isSpeaking', 'speak'].filter(k => typeof conv[k] === 'function').length + ' of its 3 doors');

const engineBrakes = typeof conv.stop === 'function';
if (!engineBrakes) bad('Amenti.conversation.stop is not a function \u2014 the engine has no brakes');
else ok('Amenti.conversation.stop() is a function \u2014 the engine can be told to halt');

/* ── 3 · THE JOINT. Does the page's door reach the engine's? ──────────────
   Lift Page1's inline AMENTI_VOICE and run it over the SAME window the bundle
   just populated, exactly as a browser would: the bundle first, the inline
   block second. Then mark the real stop and call the fa\u00e7ade's. */
const at = page.indexOf('window.AMENTI_VOICE = {');
if (at === -1) {
  blind('Page1 no longer declares window.AMENTI_VOICE \u2014 the fa\u00e7ade is gone or renamed');
  note('that may be correct, but this probe can no longer test the joint.');
  say(''); process.exit(1);
}
/* Balanced-brace read, not "to the first \n};" — that is a coincidence that has
   held so far and would truncate the day a nested one appears. */
function block(src, from) {
  const o = src.indexOf('{', from);
  let d = 0, i = o, m = null, q = '';
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (m === 'line')  { if (c === '\n') m = null; continue; }
    if (m === 'block') { if (c === '*' && n === '/') { m = null; i++; } continue; }
    if (m === 'str')   { if (c === '\\') { i++; continue; } if (c === q) m = null; continue; }
    if (c === '/' && n === '/') { m = 'line';  i++; continue; }
    if (c === '/' && n === '*') { m = 'block'; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { m = 'str'; q = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) return src.slice(from, i + 1) + ';'; }
  }
  return null;
}
const facade = block(page, at);
if (!facade) { blind('could not read the AMENTI_VOICE block out of Page1'); say(''); process.exit(1); }
try { vm.runInContext(facade, sandbox); }
catch (e) { blind('Page1\u2019s AMENTI_VOICE block would not run over the bundle \u2014 ' + e.message); }

const voice = sandbox.window.AMENTI_VOICE;
if (!voice || typeof voice.stop !== 'function') {
  bad('Page1 declares AMENTI_VOICE but it has no stop() \u2014 the stowaway\u2019s original fault, returned');
} else if (!engineBrakes) {
  /* FOUND BY ATTACKING THIS PROBE. Removing the engine's stop and running this
     still reported THE JOINT HOLDS \u2014 because the wrapper below ASSIGNS a
     function to conversation.stop, so the fa\u00e7ade found one where there had been
     none and called it. THE INSTRUMENT WAS MANUFACTURING THE THING IT MEASURES.
     Do not test a joint into a door that is not there; say so instead. */
  blind('the joint cannot be tested \u2014 there is no engine stop() to forward TO');
  note('wrapping an absent method would create it, and this probe would then');
  note('report a joint it had built itself.');
} else {
  /* THE ASSERTION THE WHOLE FILE IS FOR. Not "does stop exist" — does calling
     the page's stop reach the engine's. Mark it, call the fa\u00e7ade, read the mark. */
  let reached = false;
  const real = conv.stop;
  sandbox.window.Amenti.conversation.stop = function () { reached = true; return real.apply(this, arguments); };
  try { voice.stop(); } catch (e) { note('the fa\u00e7ade\u2019s stop() threw: ' + e.message); }
  sandbox.window.Amenti.conversation.stop = real;

  if (reached)
    ok('THE JOINT HOLDS \u2014 calling the page\u2019s stop() reaches Amenti.conversation.stop()');
  else
    bad('THE FA\u00c7ADE DOES NOT FORWARD \u2014 Page1\u2019s stop() runs, returns, and never reaches the engine. ' +
        'The figure cannot be interrupted, and every existence check passes.');
}

/* ── 4 · and the page has not quietly grown a second engine ───────────────
   The stowaway got aboard once by being declared inline and listed nowhere.
   One declaration is the fa\u00e7ade; two is the fault returning. */
const decls = (page.match(/window\.AMENTI_VOICE\s*=\s*\{/g) || []).length;
if (decls === 1) ok('exactly one AMENTI_VOICE declaration in Page1 \u2014 no second stowaway');
else bad(decls + ' AMENTI_VOICE declarations in Page1 \u2014 the last one silently wins');

say('');
say('\u2500'.repeat(60));
if (unread)    say('\u2717 ' + unread + ' thing(s) the instrument could not see. No verdict.');
else if (fail) say('\u2717 ' + fail + ' FAILURE(S). The figure cannot be relied on to stop.');
else           say('\u2713 all clear (' + pass + ' checks). The figure can be interrupted.');
say('');
process.exit(unread || fail ? 1 : 0);
