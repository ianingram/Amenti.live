#!/usr/bin/env node
/* ============================================================================
   probes/probe-voice.mjs · Amenti.live
   Writes VOICE.json. Reads surfaces. Types nothing.

   WHAT THIS IS FOR
   ----------------
   Seven briefs describe the audio architecture and every one of them is correct
   about the day it was written. None of them describes today, because a brief is
   a shop-floor account and not a manual. What did not exist is a MAP: what is
   wired to what, right now.

   The gap has a price and it has been paid three times:

     · amenti-chat.js was documented as THE PRIMARY PATH, in capitals, and the
       Terminal never loaded it. An IIFE at line 5989 asked for a core that
       registered at 6925 — 936 lines too late. The guard evaluated false and
       every call site took the inline fallback without a word.
     · Fourteen harnesses reported green across 316 assertions, each creating its
       own object and testing that.
     · AMENTI_VOICE was a stowaway: a fourth engine inline in Page1, on no
       manifest, with no stop() at all.

         BEING LOADED IS NOT BEING USED.
         — the last law of the Speech Doctrine

   THE TEST THAT WOULD HAVE CAUGHT ALL THREE is mechanical and it is the spine of
   this probe: for every global, the line it is REGISTERED on against the line it
   is first ASKED FOR, and whether that asking happens at PARSE TIME.

   WHAT IT MUST NOT CLAIM
   ----------------------
   · That a path WORKS. Source order proves a global exists when it is asked for.
     It does not prove a reply is voiced. Every reading here is a reading of
     source and is labelled as one.
   · That the ARCHIVE is intact. That is the ARCHIVE WATCH's job — six wires, a
     frozen 933-character passage, every six hours. This probe reports the SHAPE
     of the cache key, never its health.
   · Anything about intent. Whether a doctrine leaned is unmeasurable and stays
     in the briefs.
   · ANYTHING AT ALL about a file it could not open. Unread files are listed by
     name under `unread` and are excluded from every verdict. A probe that ran on
     eight of nine files and did not say so would be committing the exact fault
     this pane exists to catch.

   USAGE
     node probes/probe-voice.mjs                 # sweeps *.html in cwd
     node probes/probe-voice.mjs Page1.html ...  # explicit surfaces
     node probes/probe-voice.mjs --out VOICE.json

   Exit code is 0 unless the probe itself failed. A finding is not an error;
   findings are the output. CI reads VOICE.json, not the exit code.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';

const PROBE = 'probe-voice.mjs';
const VERSION = '1.0.0';

/* ── the vocabulary of speech ───────────────────────────────────────────────
   A global is speech-relevant if its NAME or its BODY carries one of these.
   Widen this list rather than hard-coding engine names: a fifth engine that
   arrives under a name nobody predicted must still be caught. */
const SPEECH_WORDS = /\b(speak|voice|audio|tts|utterance|speech|recital|listen|chat|conversation|throttle|mic|doctrine|terminal)\b|\/speak/i;

/* Method names that make an object a speech engine rather than a helper. */
const ENGINE_METHODS = ['speak', 'play', 'stop', 'toggle', 'isSpeaking', 'isPlaying', 'isBusy', 'cancel', 'styleFor', 'composeFor'];

/* ========================================================================== */
/* 1 · STRIPPING                                                              */
/* Comments and string bodies are replaced with spaces, newlines preserved, so */
/* every offset and every line number in the stripped text still matches the  */
/* file on disk. A line number that has drifted is worse than no line number. */
/* ========================================================================== */

function stripCode(src, keepLiterals, hazards) {
  /* Comments are blanked. String and regex BODIES are blanked (unless
     keepLiterals). Template interpolations are NOT blanked, because `${expr}`
     is code and blanking it hides call sites — the codex block on Page1 nests
     templates three deep inside .map() callbacks.

     Newlines are preserved throughout, so every offset and every line number
     in the result still matches the file on disk. A line number that has
     drifted is worse than no line number. */
  const out = src.split('');
  const n = src.length;
  const note = (offset, kind) => { if (hazards) hazards.push({ offset, kind }); };
  const blank = (a, b) => {
    if (keepLiterals) return;
    for (let k = Math.max(0, a); k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' ';
  };

  /* i points at the opening quote. Returns the index just past the close. */
  function skipString(i) {
    const q = src[i];
    let j = i + 1, lit = i + 1;
    while (j < n) {
      const ch = src[j];
      if (ch === '\\') { j += 2; continue; }
      if (ch === q) { blank(lit, j); return j + 1; }
      if (q === '`' && ch === '$' && src[j + 1] === '{') {
        blank(lit, j);                 // the literal run before the hole
        j = skipBraces(j + 1);         // the hole itself stays as code
        lit = j;
        continue;
      }
      if (q !== '`' && ch === '\n') { note(i, 'unterminated string'); blank(lit, j); return j; }
      j++;
    }
    note(i, q === '`' ? 'unterminated template' : 'unterminated string');
    blank(lit, n);
    return n;
  }

  /* i points at '{'. Returns the index just past the matching '}'. */
  function skipBraces(i) {
    let depth = 0, j = i;
    while (j < n) {
      const ch = src[j], nx = src[j + 1];
      if (ch === '"' || ch === "'" || ch === '`') { j = skipString(j); continue; }
      if (ch === '/' && nx === '/') { while (j < n && src[j] !== '\n') j++; blankRun(j); continue; }
      if (ch === '/' && nx === '*') { const k = src.indexOf('*/', j + 2); const e = k === -1 ? n : k + 2; blankAlways(j, e); j = e; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return j + 1; }
      j++;
    }
    return j;
  }

  /* comments are blanked whatever keepLiterals says — they are never data */
  function blankAlways(a, b) { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; }
  let lineCommentStart = -1;
  function blankRun(j) { if (lineCommentStart >= 0) { blankAlways(lineCommentStart, j); lineCommentStart = -1; } }

  let i = 0;
  let prevSignificant = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { let j = i; while (j < n && src[j] !== '\n') j++; blankAlways(i, j); i = j; continue; }
    if (c === '/' && d === '*') {
      const k = src.indexOf('*/', i + 2);
      if (k === -1) note(i, 'unterminated block comment');
      const e = k === -1 ? n : k + 2;
      blankAlways(i, e); i = e; continue;
    }
    if (c === '"' || c === "'" || c === '`') { i = skipString(i); prevSignificant = 'x'; continue; }
    if (c === '/' && !/[A-Za-z0-9_$)\]]/.test(prevSignificant)) {
      let j = i + 1, cls = false, closed = false;
      while (j < n) {
        const e = src[j];
        if (e === '\\') { j += 2; continue; }
        if (e === '\n') break;
        if (e === '[') cls = true;
        else if (e === ']') cls = false;
        else if (e === '/' && !cls) { j++; closed = true; break; }
        j++;
      }
      if (closed) { blank(i + 1, j - 1); i = j; prevSignificant = 'x'; continue; }
    }
    if (!/\s/.test(c)) prevSignificant = c;
    i++;
  }
  return out.join('');
}

/* A surface is not a JavaScript file. Running the stripper over the whole
   document treats `don't` in a paragraph as an unterminated string and
   `https://` in an href as a line comment, and the damage runs FORWARD — a
   quote opened in the HTML swallows the script block below it whole. That is
   how the first run of this probe reported a live engine as unregistered: the
   engine was there, and the instrument had blanked it.

   So: blank the document, then strip each SCRIPT BODY in place. Offsets and
   line numbers still match the file on disk, and no HTML is ever read as code. */
function strippedMirror(raw, tags, keepLiterals, hazards) {
  const arr = new Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw[i] === '\n' ? '\n' : ' ';
  for (const t of tags) {
    if (t.external || t.bodyEnd <= t.bodyStart) continue;
    const local = [];
    const piece = stripCode(raw.slice(t.bodyStart, t.bodyEnd), keepLiterals, local);
    if (hazards) for (const h of local) hazards.push({ line: lineOf(raw, t.bodyStart + h.offset), kind: h.kind, block: lineOf(raw, t.line ? t.bodyStart : t.bodyStart) });
    for (let k = 0; k < piece.length; k++) arr[t.bodyStart + k] = piece[k];
  }
  return arr.join('');
}

const lineOf = (text, index) => {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
};

/* ========================================================================== */
/* 2 · SCOPES — parse-time or deferred                                        */
/* The whole 936-line fault turns on this distinction. A global read INSIDE a  */
/* function is read whenever that function runs, which is usually after every  */
/* script has parsed, and load order does not bind it. A global read at TOP    */
/* LEVEL, or inside a function that is invoked the moment it is defined, is    */
/* read AT PARSE TIME, and load order is the whole story.                      */
/* ========================================================================== */

function buildScopes(code, lineBase) {
  const scopes = [];               // { id, parent, kind, iife, openLine }
  const stack = [];
  let i = 0;
  const n = code.length;

  // does the text ending at position p look like a function header?
  const looksFunction = (p) => {
    const back = code.slice(Math.max(0, p - 200), p);
    return /(?:function\b[^{}]*\)\s*|=>\s*|\b(?:async\s+)?(?:get|set)?\s*[A-Za-z0-9_$]+\s*\([^()]*\)\s*)$/.test(back);
  };

  while (i < n) {
    const c = code[i];
    if (c === '{') {
      const kind = looksFunction(i) ? 'function' : 'block';
      const scope = {
        id: scopes.length,
        parent: stack.length ? stack[stack.length - 1].id : null,
        kind, iife: false, openLine: lineBase + lineOf(code, i) - 1, open: i
      };
      scopes.push(scope); stack.push(scope); i++; continue;
    }
    if (c === '}') {
      const scope = stack.pop();
      if (scope && scope.kind === 'function') {
        // immediately invoked? look for  })()  or  }()  after the brace
        const ahead = code.slice(i + 1, i + 24).replace(/\s+/g, '');
        if (/^\)\s*\(/.test(ahead) || /^\(/.test(ahead)) scope.iife = true;
      }
      i++; continue;
    }
    i++;
  }
  return scopes;
}

/* Replay the brace stack once and record, for every character offset we care
   about, the enclosing scope chain. Cheaper and more correct than scopeAt. */
function chainIndex(code, scopes) {
  const marks = [];                // sorted [offset, chain[]]
  const stack = [];
  let i = 0; const n = code.length; let si = 0;
  const byOpen = new Map(scopes.map(s => [s.open, s]));
  while (i < n) {
    const c = code[i];
    if (c === '{') { const s = byOpen.get(i); if (s) stack.push(s); marks.push([i, stack.slice()]); }
    else if (c === '}') { stack.pop(); marks.push([i, stack.slice()]); }
    i++;
  }
  return (offset) => {
    let lo = 0, hi = marks.length - 1, ans = null;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (marks[mid][0] <= offset) { ans = marks[mid][1]; lo = mid + 1; } else hi = mid - 1; }
    return ans || [];
  };
}

function evaluationOf(chain) {
  const fns = chain.filter(s => s.kind === 'function');
  if (!fns.length) return 'parse-time';
  if (fns.every(s => s.iife)) return 'parse-time';
  return 'deferred';
}

/* ========================================================================== */
/* 3 · SURFACES — script tags and inline blocks                               */
/* ========================================================================== */

function readSurface(path) {
  const raw = readFileSync(path, 'utf8');
  return {
    file: basename(path),
    path,
    bytes: Buffer.byteLength(raw),
    lines: raw.split('\n').length,
    sha256: createHash('sha256').update(raw).digest('hex').slice(0, 16),
    raw
  };
}

function scriptTags(raw) {
  const tags = [];
  const lower = raw.toLowerCase();
  let cursor = 0;
  while (cursor < raw.length) {
    const open = lower.indexOf('<script', cursor);
    if (open === -1) break;
    const gt = raw.indexOf('>', open);
    if (gt === -1) break;
    const attrs = raw.slice(open + 7, gt).replace(/\/$/, '');
    const src = (attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1] || null;
    const bodyStart = gt + 1;
    const close = lower.indexOf('</script>', bodyStart);
    const bodyEnd = close === -1 ? raw.length : close;
    tags.push({
      line: lineOf(raw, open),
      src,
      loading: src ? (/\bdefer\b/i.test(attrs) ? 'defer' : /\basync\b/i.test(attrs) ? 'async' : 'blocking') : 'inline',
      external: !!src,
      remote: !!src && /^https?:\/\//i.test(src),
      bodyStart,
      bodyEnd: src ? bodyStart : bodyEnd
    });
    cursor = close === -1 ? raw.length : close + 9;
  }
  return tags;
}

/* ========================================================================== */
/* 4 · REGISTRATIONS AND REFERENCES                                           */
/* ========================================================================== */

const GLOBAL_ASSIGN = /(?:^|[^.\w$])(?:window\.)?((?:[A-Z][A-Za-z0-9_$]*|[A-Z_]{2,})(?:\.[A-Za-z0-9_$]+)?)\s*=\s*(?=[{[(a-zA-Z0-9_$'"!])/g;
const WINDOW_ASSIGN = /window\.([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$]+)?)\s*=/g;

function registrations(code, lineBase, sourceName) {
  const found = new Map();
  /* A file that opens `var A = (window.Amenti = window.Amenti || {});` and then
     writes `A.chat = {...}` has registered Amenti.chat. Reading only the literal
     spelling would report the global as never registered while the callers pile
     up — the unresolved row that means nothing. Normalise the alias first. */
  const nsAlias = new Map();
  for (const m of code.matchAll(/\b(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^;\n]{0,160})/g)) {
    const rhs = m[2];
    const hit = rhs.match(/^\s*\(?\s*(?:window\.)?(Amenti|Sovereign|AMENTI)\b/);
    if (hit && hit[1] !== m[1]) nsAlias.set(m[1], hit[1]);
  }
  const normalise = (name) => {
    const head = name.split('.')[0];
    const rest = name.split('.').slice(1).join('.');
    return (rest && nsAlias.has(head)) ? nsAlias.get(head) + '.' + rest : name;
  };
  const add = (rawName, offset) => {
    const name = rawName && normalise(rawName);
    if (!name) return;
    const line = lineBase + lineOf(code, offset) - 1;
    if (!found.has(name) || found.get(name).line > line) {
      found.set(name, { global: name, line, source: sourceName, offset });
    }
  };
  let m;
  WINDOW_ASSIGN.lastIndex = 0;
  while ((m = WINDOW_ASSIGN.exec(code))) add(m[1], m.index);
  GLOBAL_ASSIGN.lastIndex = 0;
  while ((m = GLOBAL_ASSIGN.exec(code))) add(m[1], m.index + m[0].indexOf(m[1]));
  return [...found.values()];
}

function bodyRange(code, offset) {
  const eq = code.indexOf('=', offset);
  if (eq === -1) return null;
  const open = code.indexOf('{', eq);
  if (open === -1 || open - eq > 40) return null;
  let depth = 0, i = open;
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (!depth) break; }
    if (i - open > 200000) break;
  }
  return { start: open, end: Math.min(i + 1, code.length) };
}

function bodyOf(code, offset) {
  const r = bodyRange(code, offset);
  return r ? code.slice(r.start, r.end) : '';
}

/* ── CALL SITES ─────────────────────────────────────────────────────────────
   The cross-check that produced this function: an independent grep found nine
   speak/play call sites on each surface and the probe had attributed six and
   three. One of the misses was

       onclick="Sovereign.Atlantica.speak('${key}', this)"

   — a call site living inside an HTML attribute inside a template literal, and
   the stripper had blanked it along with every other string. It is the ONLY
   entry point to Atlantica read-aloud on that surface. An instrument that
   silently omits the only door is the fault it was built to catch.

   So call sites are now gathered from BOTH mirrors, receivers are resolved
   through `this` and through local aliases, and whatever is left over is
   published as `unattributedCalls`. The count reconciles: every call site on a
   surface is either attributed to a path or named as unattributed. Nothing is
   dropped quietly. */
const CALL_RE = /([A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z0-9_$]+)*)\s*\.\s*(speak|play|stop|toggle|cancel|isBusy|isPlaying|isSpeaking)\s*\(/g;

function callSitesIn(code, literalCode, lineBase) {
  const sites = [];
  const seen = new Set();
  const scan = (text, via) => {
    CALL_RE.lastIndex = 0;
    let m;
    while ((m = CALL_RE.exec(text))) {
      // when scanning the literal mirror, keep only what the code mirror blanked
      if (via === 'markup' && code[m.index] !== ' ') continue;
      const key = m.index + ':' + m[2];
      if (seen.has(key)) continue;
      seen.add(key);
      sites.push({
        offset: m.index,
        line: lineBase + lineOf(text, m.index) - 1,
        receiver: m[1].replace(/\s+/g, ''),
        method: m[2],
        via
      });
    }
  };
  scan(code, 'code');
  scan(literalCode, 'markup');
  return sites;
}

/* A handler written into static markup — onclick="X.speak(...)" — lives
   outside every script block, so both mirrors blank it. There is none on
   either surface today. There was none of the template-literal kind either,
   until there was, and it was the only door into Atlantica read-aloud. */
function htmlCallSites(raw, tags) {
  const arr = raw.split('');
  for (const t of tags) {
    if (t.external || t.bodyEnd <= t.bodyStart) continue;
    for (let k = t.bodyStart; k < t.bodyEnd; k++) if (arr[k] !== '\n') arr[k] = ' ';
  }
  const html = arr.join('');
  const sites = [];
  const re = /\bon[a-z]+\s*=\s*["']([^"']{0,400})["']/g;
  let m;
  while ((m = re.exec(html))) {
    CALL_RE.lastIndex = 0;
    let c;
    while ((c = CALL_RE.exec(m[1]))) {
      sites.push({
        offset: m.index, line: lineOf(html, m.index),
        receiver: c[1].replace(/\s+/g, ''), method: c[2], via: 'html'
      });
    }
  }
  return sites;
}

const NAMESPACES = ['Amenti', 'Sovereign', 'AMENTI'];

/* ── WHERE THE MOUTH OPENS ───────────────────────────────────────────────────
   Not which object is NAMED like an engine — where a request is actually posted
   to /speak and where an Audio is actually built. Page1 names VOICE_WORKER,
   VOICE_STYLE and VOICE_NAME at lines 2916-2918 and calls none of them: the
   local engine was removed and the tackle stayed on deck. A probe that read
   those three names as an engine would be repeating the voiceprofiles.js
   mistake, where a spec was read as live infrastructure and two documents were
   written for a system this project does not run. */
function speakEndpointNames(literalCode) {
  const names = new Set();
  const re = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]\s*([^;\n]{0,200})/g;
  let m;
  while ((m = re.exec(literalCode))) if (/["'][^"']*\/speak\b/.test(m[2])) names.add(m[1]);
  return names;
}

function synthesisSites(literalCode, lineBase) {
  const sites = [];
  const endpoints = speakEndpointNames(literalCode);
  let m;
  const audio = /new\s+Audio\s*\(|new\s+(?:window\.)?(?:webkit)?AudioContext\s*\(/g;
  while ((m = audio.exec(literalCode)))
    sites.push({ line: lineBase + lineOf(literalCode, m.index) - 1, kind: 'builds Audio', offset: m.index });
  const fetches = /\bfetch\s*\(([^)]{0,200})/g;
  while ((m = fetches.exec(literalCode))) {
    const arg = m[1];
    const hit = /\/speak\b/.test(arg) || [...endpoints].some(n => new RegExp('\\b' + n + '\\b').test(arg));
    if (hit) sites.push({ line: lineBase + lineOf(literalCode, m.index) - 1, kind: 'posts to /speak', offset: m.index });
  }
  return { sites: sites.sort((a, b) => a.offset - b.offset), endpoints: [...endpoints] };
}

function aliasMap(code, tracked) {
  /* var c = window.Amenti && window.Amenti.conversation;  then  c.speak(...)
     An alias is indirection, so it is recorded AS an alias and never presented
     as a direct call. */
  const map = new Map();
  const re = /\b(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^;\n]{0,200})/g;
  let m;
  while ((m = re.exec(code))) {
    const rhs = m[2];
    // a namespace alias only when the whole right-hand side IS the namespace.
    // `var c = window.Amenti && window.Amenti.conversation` is NOT that, and
    // reading it as one silently unattributes three live call sites.
    const clean = rhs.trim().replace(/;$/, '').trim();
    const nsm = clean.match(/^(?:window\.)?(Amenti|Sovereign|AMENTI)$/);
    if (nsm) { map.set(m[1], nsm[1]); continue; }
    for (const g of [...tracked].sort((a, b) => b.length - a.length)) {
      if (new RegExp('(?:^|[^.\\w$])(?:window\\.)?' + g.replace(/\./g, '\\.') + '\\b').test(rhs)) {
        map.set(m[1], g);
        break;
      }
    }
  }
  return map;
}

function methodsOf(code, offset) {
  // read the object literal that follows an assignment, shallowly
  const eq = code.indexOf('=', offset);
  if (eq === -1) return [];
  const open = code.indexOf('{', eq);
  if (open === -1 || open - eq > 40) return [];
  let depth = 0, i = open;
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (!depth) break; }
    if (i - open > 60000) break;
  }
  const body = code.slice(open, Math.min(i + 1, code.length));
  return ENGINE_METHODS.filter(mm =>
    new RegExp('(?:^|[\\s,{])(?:async\\s+)?(?:get\\s+|set\\s+)?' + mm + '\\s*[:(]').test(body)
  );
}

function referencesTo(code, lineBase, names, chainFor) {
  const refs = [];
  for (const name of names) {
    const esc = name.replace(/\./g, '\\.');
    // a reference is  X  or  window.X  — and NOT  foo.X  where foo is anything
    // else. Missing the window-qualified form once reported a live engine as
    // never called, which is precisely the lie this probe exists to refuse.
    const re = new RegExp('(?:^|[^.\\w$])((?:window\\.)?' + esc + ')\\b', 'g');
    let m;
    while ((m = re.exec(code))) {
      const at = m.index + m[0].length - m[1].length;
      const after = code.slice(at + m[1].length, at + m[1].length + 48);
      const isAssign = /^\s*=[^=]/.test(after);
      const callMatch = after.match(/^\s*\.\s*([A-Za-z0-9_$]+)\s*\(/) || (/^\s*\(/.test(after) ? [null, '(call)'] : null);
      refs.push({
        global: name,
        line: lineBase + lineOf(code, at) - 1,
        qualified: m[1].startsWith('window.'),
        kind: isAssign ? 'assign' : 'read',
        evaluation: (() => {
          const e = evaluationOf(chainFor(at));
          if (e !== 'parse-time') return e;
          // a concise arrow body ( x => foo() ) opens no brace, so the scope
          // walk cannot see it and would call a deferred read parse-time.
          const stmt = code.slice(Math.max(0, at - 240), at);
          const cut = Math.max(stmt.lastIndexOf(';'), stmt.lastIndexOf('{'), stmt.lastIndexOf('}'), stmt.lastIndexOf('\n'));
          return /=>\s*[^{\s]/.test(stmt.slice(cut + 1)) ? 'unknown' : 'parse-time';
        })(),
        call: callMatch ? callMatch[1] : null
      });
      re.lastIndex = at + m[1].length;
    }
  }
  return refs;
}

/* ========================================================================== */
/* 5 · THE READINGS                                                           */
/* ========================================================================== */

function chunkConstants(code, lineBase) {
  const out = {};
  const pairs = [
    ['TARGET_CHARS', /\bTARGET_CHARS\s*[:=]\s*(\d+)/],
    ['MAX_CHARS', /\bMAX_CHARS\s*[:=]\s*(\d+)/],
    ['MIN_CHARS', /\bMIN_CHARS\s*[:=]\s*(\d+)/],
    ['LOOKAHEAD', /\bLOOKAHEAD\s*[:=]\s*(\d+)/],
    ['STREAM_THRESHOLD', /\bSTREAM_THRESHOLD\s*[:=]\s*(\d+)/]
  ];
  for (const [k, re] of pairs) {
    const m = code.match(re);
    if (m) out[k] = { value: Number(m[1]), line: lineBase + lineOf(code, m.index) - 1 };
  }
  return Object.keys(out).length ? out : null;
}

/* The STYLE string is an input to the cache key. Two surfaces that compose a
   style differently cannot share an entry, however identical the Worker is. */
function styleRegisters(text) {
  const found = [];
  const re = /\b(VOICE_STYLE|STYLE|VOICE_NAME|VOICE)\s*[:=]\s*(["'])([^"'\n]{4,200})\2/g;
  let m;
  while ((m = re.exec(text))) found.push({ key: m[1], line: lineOf(text, m.index), value: m[3] });
  return found;
}

function speakPosts(raw) {
  /* Every place a body is posted to /speak, and WHAT is in that body. The cache
     key is sha256(TTS_MODEL + voice + STYLE + TEXT) and it is composed in the
     Worker, which cannot be read from here. What CAN be read is the shape of
     what each surface sends — and if two surfaces send a differently-composed
     style or a differently-stripped text for one passage, they cannot share a
     cache entry however identical the Worker is. */
  const hits = [];
  const re = /JSON\.stringify\(\s*\{([^}]{0,400})\}\s*\)/g;
  let m;
  while ((m = re.exec(raw))) {
    const body = m[1];
    if (!/\btext\b/.test(body)) continue;
    const keys = [...body.matchAll(/(?:^|[,{\s])([A-Za-z_$][A-Za-z0-9_$]*)\s*[:,}]/g)].map(x => x[1]);
    hits.push({ line: lineOf(raw, m.index), keys: [...new Set(keys)] });
  }
  return hits;
}

function stripExpressions(raw) {
  /* A text strip is part of the cache key, because the strip decides the bytes.
     Two surfaces that strip a passage differently key it differently. */
  const hits = [];
  const re = /\.replace\(\s*\/([^\n]{1,60}?)\/([gimsuy]*)\s*,/g;
  let m;
  while ((m = re.exec(raw))) hits.push({ line: lineOf(raw, m.index), pattern: '/' + m[1] + '/' + m[2] });
  return hits;
}

/* ========================================================================== */
/* 6 · WALK                                                                    */
/* ========================================================================== */

/* ── THE UNIVERSE OF A SURFACE ───────────────────────────────────────────────
   The first repo run reported six globals ADRIFT on Page2 — Amenti.voice,
   throttle, conversation, listen, chat, doctrine — on the grounds that Page2
   registers them and never calls them. Page2 does not load amenti-core.bundle.js
   at all. The probe had been handed every global from every readable file and
   was measuring each surface against a universe it does not live in. "Loaded is
   not used" about a file that was never loaded is a worse lie than the one this
   probe was built to catch, because it is confident and specific.

   And in the other direction: Page1 loads amenti-doctrine.js and never names
   Amenti.doctrine, so it read as adrift — but the platform inside the bundle
   reads it, in REG(). A reference in a file the surface loads is a reference.

   So a surface's universe is: its own inline code, plus the files it actually
   loads. Nothing wider, nothing narrower. */
function walkSurface(surface, sidecarsAll) {
  const raw = surface.raw;
  const tags = scriptTags(raw);
  const hazards = [];
  const stripped = strippedMirror(raw, tags, false, hazards);   // identifiers and scopes
  const literal = strippedMirror(raw, tags, true);     // values, still quoted

  /* only the files THIS surface loads */
  const loadedSrcs = new Set(tags.filter(t => t.external && !t.remote).map(t => t.src));
  const sidecarGlobals = (sidecarsAll.globals || sidecarsAll || []).filter(g => loadedSrcs.has(g.source));
  const loadedFiles = (sidecarsAll.read || []).filter(f => loadedSrcs.has(f.src));

  const inlineBlocks = tags.filter(t => !t.external && t.bodyEnd > t.bodyStart);
  const regs = [];
  const refs = [];

  for (const b of inlineBlocks) {
    const code = stripped.slice(b.bodyStart, b.bodyEnd);
    const lineBase = lineOf(raw, b.bodyStart);
    const scopes = buildScopes(code, lineBase);
    const chainFor = chainIndex(code, scopes);

    for (const r of registrations(code, lineBase, surface.file)) {
      r.methods = methodsOf(code, r.offset);
      r.delegatesStop = !r.methods.includes('stop') && /\.\s*stop\s*\(/.test(bodyOf(code, r.offset));
      const br = bodyRange(code, r.offset);
      r.body = br ? { start: b.bodyStart + br.start, end: b.bodyStart + br.end } : null;
      r.block = { start: b.bodyStart, end: b.bodyEnd };
      regs.push(r);
    }
    b._code = code; b._lineBase = lineBase; b._chainFor = chainFor;
    b._literal = literal.slice(b.bodyStart, b.bodyEnd);
    const syn = synthesisSites(b._literal, lineBase);
    b._synthesis = syn.sites.map(x => ({ ...x, offset: b.bodyStart + x.offset }));
    b._endpoints = syn.endpoints;
  }

  /* the candidate set: everything registered inline on this surface, plus
     everything any readable sidecar file registers, plus anything that already
     looks like speech. A name nobody registered but somebody calls is the most
     important row in the table. */
  const candidates = new Set();
  for (const r of regs) candidates.add(r.global);
  for (const g of sidecarGlobals) candidates.add(g.global);
  for (const m of stripped.matchAll(/\b(?:window\.)?([A-Z][A-Za-z0-9_$]{2,}(?:\.[A-Za-z0-9_$]+)?)\s*\.\s*(?:speak|play|stop|toggle)\s*\(/g)) {
    candidates.add(m[1]);
  }
  for (const m of stripped.matchAll(/\b(?:window\.)?((?:Amenti|Sovereign|AMENTI)\.[A-Za-z0-9_$]+)/g)) {
    if (SPEECH_WORDS.test(m[1].split('.').pop())) candidates.add(m[1]);
  }
  for (const m of stripped.matchAll(/\bwindow\.([A-Z][A-Z0-9_]{3,})\b/g)) {
    if (SPEECH_WORDS.test(m[1])) candidates.add(m[1]);
  }

  const speechCandidates = [...candidates].filter(name => {
    if (SPEECH_WORDS.test(name)) return true;
    /* a global in a loaded file that defines speak() or play() is an engine
       whatever it is called. Dropping it here because its NAME lacked the word
       is how a fifth engine arrives unnamed and unwatched. */
    const side = sidecarGlobals.find(g => g.global === name);
    if (side && (side.methods || []).some(x => ['speak', 'play'].includes(x))) return true;
    const reg = regs.find(r => r.global === name);
    if (reg && reg.methods && reg.methods.some(x => ['speak', 'play', 'isSpeaking', 'isPlaying'].includes(x))) return true;
    return new RegExp(name.replace(/\./g, '\\.') + '\\s*\\.\\s*(?:speak|play)\\s*\\(').test(stripped);
  });

  for (const b of inlineBlocks) {
    if (!b._code) continue;
    refs.push(...referencesTo(b._code, b._lineBase, speechCandidates, b._chainFor));
  }

  /* ── attribute every synthesis site ──────────────────────────────────────
     to the object whose body encloses it; failing that, to the single speech
     global registered in the same script block. Two candidates in one block is
     an ambiguity, and an ambiguity is reported, not guessed. */
  const synthesis = [];
  for (const b of inlineBlocks) {
    for (const site of (b._synthesis || [])) {
      const inBody = regs.filter(r => r.body && site.offset > r.body.start && site.offset < r.body.end)
                         .sort((a, c) => (a.body.end - a.body.start) - (c.body.end - c.body.start))[0];
      let owner = inBody ? inBody.global : null, how = inBody ? 'in body' : null;
      if (!owner) {
        const here = regs.filter(r => r.block && r.block.start === b.bodyStart &&
                                      r.methods.some(m => m === 'speak' || m === 'play'));
        if (here.length === 1) { owner = here[0].global; how = 'same script block'; }
        else if (here.length > 1) how = 'ambiguous — ' + here.length + ' candidates in block';
      }
      synthesis.push({ line: site.line, kind: site.kind, owner, attribution: how });
    }
  }
  const synthesisOwners = new Set(synthesis.filter(x => x.owner).map(x => x.owner));

  /* ── attribute every call site, or say that it could not be ─────────────── */
  const attributed = [];      // { global, line, method, via, evaluation }
  const unattributed = [];
  for (const h of htmlCallSites(raw, tags)) {
    const recv = h.receiver.replace(/^window\./, '');
    const row = { line: h.line, method: h.method, receiver: h.receiver, via: 'html', evaluation: 'deferred' };
    if (speechCandidates.includes(recv)) attributed.push({ global: recv, ...row });
    else if (h.method === 'speak' || h.method === 'play') unattributed.push(row);
  }
  for (const b of inlineBlocks) {
    if (!b._code) continue;
    const aliases = aliasMap(b._code, speechCandidates);
    for (const site of callSitesIn(b._code, b._literal, b._lineBase)) {
      const abs = b.bodyStart + site.offset;
      const recv = site.receiver.replace(/^window\./, '');
      let global = null, via = site.via === 'markup' ? 'markup' : 'direct';

      const head = recv.split('.')[0];
      const rest = recv.split('.').slice(1).join('.');

      if (speechCandidates.includes(recv)) global = recv;
      else if (aliases.has(head)) {
        const expanded = rest ? aliases.get(head) + '.' + rest : aliases.get(head);
        if (speechCandidates.includes(expanded)) { global = expanded; via = 'alias'; }
      }
      if (!global && recv === 'this') {
        const owner = regs.filter(r => r.body && abs > r.body.start && abs < r.body.end)
                          .sort((a, b2) => (b2.body.end - b2.body.start) - (a.body.end - a.body.start)).pop();
        if (owner) { global = owner.global; via = 'this'; }
      }

      /* RELEVANCE. A call is worth a row if the mouth opens — speak or play —
         or if the receiver is a path this pane tracks. classList.toggle is
         neither, and a list padded with it is a list nobody reads. */
      const relevant = site.method === 'speak' || site.method === 'play' || !!global;
      if (!relevant) continue;

      const row = {
        line: site.line, method: site.method, receiver: site.receiver, via,
        evaluation: evaluationOf(b._chainFor(site.offset))
      };
      if (global) attributed.push({ global, ...row });
      else unattributed.push(row);
    }
  }

  /* dedupe registrations down to the speech set, keeping the earliest line */
  const engines = [];
  for (const name of speechCandidates) {
    const inline = regs.filter(r => r.global === name).sort((a, b2) => a.line - b2.line)[0];
    const sidecar = sidecarGlobals.find(g => g.global === name) || null;
    const mine = refs.filter(r => r.global === name);
    const reads = mine.filter(r => r.kind === 'read').sort((a, b2) => a.line - b2.line);

    /* a reference inside a file this surface loads is a reference. Counting only
       the page's own text called amenti-doctrine.js adrift while the platform
       was reading it in REG(). */
    const esc = name.replace(/\./g, '\\.');
    const readsInFiles = [];
    for (const f of loadedFiles) {
      if (!f._code) continue;
      const re = new RegExp('(?:^|[^.\\w$])(?:window\\.)?' + esc + '\\b', 'g');
      let m;
      while ((m = re.exec(f._code))) {
        const at = m.index + m[0].length - name.length;
        if (/^\s*=[^=]/.test(f._code.slice(at + name.length, at + name.length + 8))) continue;  // its own registration
        readsInFiles.push({ file: f.src, line: lineOf(f._code, at) });
        re.lastIndex = at + name.length;
      }
    }
    const firstRead = reads[0] || null;
    const parseTimeReads = reads.filter(r => r.evaluation === 'parse-time');

    let registered = null, registeredIn = null, availableAt = null, loading = null;
    if (inline) {
      registered = inline.line; registeredIn = surface.file;
      availableAt = inline.line; loading = 'inline';
    } else if (sidecar) {
      registered = sidecar.line; registeredIn = sidecar.source;
      const tag = tags.find(t => t.external && t.src === sidecar.source);
      if (tag) {
        loading = tag.loading;
        // a blocking tag has finished executing by the line below it. A defer
        // or async tag has not run at parse time AT ALL, so nothing above it
        // is safe and nothing below it is either.
        availableAt = tag.loading === 'blocking' ? tag.line : Infinity;
      }
    }

    engines.push({
      global: name,
      registered,
      registeredIn,
      registeredBy: inline ? 'inline' : sidecar ? 'file' : null,
      loading,
      availableAt: availableAt === Infinity ? 'after parse' : availableAt,
      /* window.Amenti.terminal = termChat is not an engine and not adrift: it
         is a TELL, published so a probe can ask which path the Terminal took.
         An object with methods and no callers is dead; a scalar with no callers
         is a readout. The difference is whether a body was assigned. */
      role: inline
        ? (synthesisOwners.has(name) ? 'engine' : (inline.body ? 'facade' : 'tell'))
        : sidecar ? 'file' : 'unresolved',
      methods: inline ? inline.methods : sidecar ? sidecar.methods : [],
      hasStop: (inline ? inline.methods : sidecar ? sidecar.methods : []).includes('stop'),
      delegatesStop: !!(inline ? inline.delegatesStop : sidecar ? sidecar.delegatesStop : false),
      reads: reads.length,
      readsInLoadedFiles: readsInFiles.length,
      readsInLoadedFilesAt: readsInFiles.slice(0, 6),
      firstRead: firstRead ? firstRead.line : null,
      firstReadEvaluation: firstRead ? firstRead.evaluation : null,
      parseTimeReads: [...new Set(parseTimeReads.map(r => r.line))],
      uncertainReads: [...new Set(reads.filter(r => r.evaluation === 'unknown').map(r => r.line))],
      calls: [...new Set(attributed.filter(a => a.global === name).map(a => a.method))].sort(),
      callSites: attributed.filter(a => a.global === name)
        .map(a => ({ line: a.line, method: a.method, via: a.via, evaluation: a.evaluation }))
        .sort((x, y) => x.line - y.line)
    });
  }

  return {
    file: surface.file,
    bytes: surface.bytes,
    lines: surface.lines,
    sha256: surface.sha256,
    scripts: tags.filter(t => t.external).map(t => ({ src: t.src, line: t.line, loading: t.loading, remote: t.remote })),
    inlineBlocks: inlineBlocks.length,
    engines: engines.sort((a, b2) => (a.registered ?? 1e9) - (b2.registered ?? 1e9)),
    chunking: chunkConstants(stripped, 1),
    styles: styleRegisters(literal),
    callSites: { total: attributed.length + unattributed.length, attributed: attributed.length, unattributed },
    synthesis,
    parseHazards: hazards,
    speakEndpointsDeclared: [...new Set(inlineBlocks.flatMap(b => b._endpoints || []))],
    speakPosts: speakPosts(literal),
    strips: stripExpressions(literal).slice(0, 24)
  };
}

/* ── THE DECLARED PROFILES ───────────────────────────────────────────────────
   amenti-voice.js declares:

       var PROFILES = { recital: 320, gabriel: 700, counsel: 320 };

   and states why, on the line above it: a surface's chunk boundaries are part
   of its cache key, so changing them orphans that surface's audio. Each surface
   keeps its own profile until somebody decides to pay for a re-render.

   That makes Page2's 700 a RULING, not drift. A probe that reports a documented
   decision as a fault every run teaches its reader to skip the findings, and
   then the one real fault goes past unread. So: a chunk size that matches a
   declared profile is ACCEPTED and named. Only an UNDECLARED size is drift.

   Harvested from any amenti-*.js on disk, whether or not a surface loads it —
   the profile table is a fleet-wide declaration, not a property of one page.
   Where it was found is recorded, so nothing rests on an unnamed source. */
function declaredProfiles(root) {
  const found = { profiles: {}, sources: [], constants: {} };
  let names = [];
  try { names = readdirSync(root).filter(f => /^amenti-.*\.js$/.test(f)); } catch (e) { return found; }
  for (const f of names) {
    let raw;
    try { raw = readFileSync(resolve(root, f), 'utf8'); } catch (e) { continue; }
    const code = stripCode(raw, true);
    const m = code.match(/\bPROFILES\s*=\s*\{([^}]{0,400})\}/);
    if (!m) continue;
    let hit = false;
    for (const pair of m[1].matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(\d+)/g)) {
      found.profiles[pair[1]] = Number(pair[2]);
      hit = true;
    }
    for (const k of ['CHUNK_MAX', 'CONV_FIRST_MAX']) {
      const c = code.match(new RegExp('\\b' + k + '\\s*=\\s*(\\d+)'));
      if (c) found.constants[k] = Number(c[1]);
    }
    if (hit) found.sources.push({ file: f, line: lineOf(code, m.index) });
  }
  return found;
}

/* ── sidecar files: read what is on disk, name what is not ────────────────── */
function readSidecars(surfaceReadings, root) {
  const wanted = new Map();
  for (const s of surfaceReadings) {
    for (const t of s.scripts) {
      if (t.remote) continue;
      if (!wanted.has(t.src)) wanted.set(t.src, { src: t.src, requestedBy: [] });
      wanted.get(t.src).requestedBy.push({ surface: s.file, line: t.line, loading: t.loading });
    }
  }
  const read = [], unread = [], globals = [];
  for (const w of wanted.values()) {
    const p = resolve(root, w.src);
    if (!existsSync(p) || !statSync(p).isFile()) { unread.push({ ...w, reason: 'not on disk at probe time' }); continue; }
    const raw = readFileSync(p, 'utf8');
    const code = stripCode(raw);
    const regs = registrations(code, 1, w.src);
    for (const r of regs) {
      r.methods = methodsOf(code, r.offset);
      r.delegatesStop = !r.methods.includes('stop') && /\.\s*stop\s*\(/.test(bodyOf(code, r.offset));
      if (SPEECH_WORDS.test(r.global) || (r.methods || []).some(x => ['speak', 'play'].includes(x))) globals.push(r);
    }
    read.push({ ...w, bytes: Buffer.byteLength(raw), lines: raw.split('\n').length, registers: regs.map(r => r.global).slice(0, 40), _code: code });
  }
  return { read, unread, globals };
}

/* ========================================================================== */
/* 7 · FINDINGS                                                                */
/* Nothing here is authored. Every finding names the lines it was read from.   */
/* ========================================================================== */

function loadAccepted(root) {
  const p = resolve(root, 'spec/voice-accepted.json');
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')).accepted || []; }
  catch (e) { return []; }
}

function findings(reading, accepted) {
  const out = [];

  for (const s of reading.surfaces) {
    for (const e of s.engines) {
      /* ── THE 936-LINE TEST ──────────────────────────────────────────────
         Not registration line against read line — that comparison is
         meaningless across two files. What binds is the point on THIS surface
         at which the global becomes available: for an inline block, the line
         it is written on; for a blocking <script src>, the line of the tag;
         for defer or async, never, as far as parse time is concerned.
         A parse-time read before that point is the fault, and it is silent. */
      if (e.parseTimeReads.length && e.availableAt !== null) {
        const first = e.parseTimeReads[0];
        if (e.availableAt === 'after parse') out.push({
          id: 'load-order',
          severity: 'fault',
          surface: s.file,
          global: e.global,
          detail: `read at PARSE TIME on line ${first}; registered by ${e.registeredIn}, which is loaded ${e.loading} and has therefore not run. The guard evaluates false and the call site takes whatever fallback exists, without a word.`,
          test: 'parse-time read of a global registered by a defer/async script'
        });
        else if (first < e.availableAt) out.push({
          id: 'load-order',
          severity: 'fault',
          surface: s.file,
          global: e.global,
          detail: `read at PARSE TIME on line ${first}; available from line ${e.availableAt} (${e.registeredIn}, ${e.loading}). ${e.availableAt - first} lines too late.`,
          test: 'first parse-time read < availability line'
        });
        else out.push({
          id: 'load-order-clear',
          severity: 'confirmed',
          surface: s.file,
          global: e.global,
          detail: `read at PARSE TIME on line ${first}; available from line ${e.availableAt} (${e.registeredIn}, ${e.loading}). ${first - e.availableAt} lines of margin.`,
          test: 'first parse-time read >= availability line'
        });
      }
      if (e.uncertainReads.length && e.availableAt !== null && e.uncertainReads[0] < (e.availableAt === 'after parse' ? Infinity : e.availableAt)) out.push({
        id: 'load-order-unproven',
        severity: 'unproven',
        surface: s.file,
        global: e.global,
        detail: `read on line ${e.uncertainReads[0]} inside a concise arrow body, which the scope walk cannot classify. If that arrow runs at parse time the read precedes availability at ${e.availableAt}. Not claimed either way.`,
        test: 'unclassifiable read before availability'
      });
      /* ADRIFT — registered and never asked for */
      if (e.registered !== null && e.reads === 0 && e.readsInLoadedFiles === 0 && e.role !== 'tell') out.push({
        id: 'adrift',
        severity: 'finding',
        surface: s.file,
        global: e.global,
        detail: `registered on line ${e.registered} in ${e.registeredIn}, which this surface loads; no reference on the surface and none in any file it loads. Loaded is not used.`,
        test: 'registration with zero reads across the surface and its loaded files'
      });
      /* STOWAWAY — called and registered by nobody the probe could read */
      if (e.registered === null && e.reads) out.push({
        id: 'unresolved',
        severity: 'finding',
        surface: s.file,
        global: e.global,
        detail: `called ${e.reads}x, first at line ${e.firstRead}; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.`,
        test: 'reads with no registration'
      });
      /* NO BRAKE */
      if (e.registered !== null && e.methods.includes('speak') && !e.hasStop && !e.delegatesStop) out.push({
        id: 'no-brake',
        severity: 'finding',
        surface: s.file,
        global: e.global,
        detail: `defines speak() and no stop(). A mouth with no brake orphans an in-flight /speak fetch.`,
        test: 'speak without stop'
      });
    }
  }

  /* VESTIGIAL — a /speak endpoint named on a surface that opens no mouth.
     Harmless to run and dangerous to read: this is how a spec gets mistaken
     for infrastructure. */
  for (const s of reading.surfaces) {
    if (s.speakEndpointsDeclared.length && !s.synthesis.length) out.push({
      id: 'vestigial',
      severity: 'finding',
      surface: s.file,
      detail: `declares a /speak endpoint (${s.speakEndpointsDeclared.join(', ')}) and contains no synthesis site — no fetch to /speak, no Audio built. Tackle left on deck after the engine was moved out. Reads as live infrastructure to anyone who greps.`,
      test: 'endpoint literal declared, zero synthesis sites on the surface'
    });
  }

  /* DIVERGENCE — one capability, two implementations, two surfaces */
  const bySurface = {};
  for (const s of reading.surfaces) bySurface[s.file] = new Set(
    s.engines.filter(e => e.role === 'engine').map(e => e.global));
  const files = Object.keys(bySurface);
  if (files.length > 1) {
    for (let a = 0; a < files.length; a++) for (let b = a + 1; b < files.length; b++) {
      const onlyA = [...bySurface[files[a]]].filter(g => !bySurface[files[b]].has(g));
      const onlyB = [...bySurface[files[b]]].filter(g => !bySurface[files[a]].has(g));
      if (onlyA.length || onlyB.length) out.push({
        id: 'divergence',
        severity: 'finding',
        surface: `${files[a]} vs ${files[b]}`,
        detail: `synthesis engines defined inline on one surface and not the other — ${files[a]}: [${onlyA.join(', ') || 'none'}]; ${files[b]}: [${onlyB.join(', ') || 'none'}]. An engine composes its own style and cuts its own chunks, and chunk boundaries ARE the cache namespace.`,
        test: 'inline engines (post to /speak or build Audio), set difference across surfaces'
      });
    }
  }

  /* ── CHUNK BOUNDARIES ARE THE CACHE NAMESPACE ────────────────────────────
     But a boundary somebody chose on purpose is not drift. Measured against the
     declared profile table, not against the other surface. */
  const declared = reading.profiles && reading.profiles.profiles || {};
  const declaredValues = new Set(Object.values(declared));
  const nameFor = v => Object.keys(declared).filter(k => declared[k] === v).join(' / ');
  const where = (reading.profiles && reading.profiles.sources || []).map(x => x.file).join(', ');

  for (const s of reading.surfaces) {
    if (!s.chunking) continue;
    for (const [k, v] of Object.entries(s.chunking)) {
      if (k === 'MAX_CHARS' || k === 'LOOKAHEAD') continue;   // ceiling and depth, not boundaries
      if (!Object.keys(declared).length) {
        out.push({
          id: 'chunk-undeclared',
          severity: 'unproven',
          surface: s.file,
          detail: `${k} = ${v.value} at line ${v.line}. No profile table was readable, so whether this boundary is a ruling or a drift cannot be told from here.`,
          test: 'chunk constant with no declared profile table on disk'
        });
      } else if (declaredValues.has(v.value)) {
        out.push({
          id: 'chunk-profile',
          severity: 'accepted',
          surface: s.file,
          detail: `${k} = ${v.value} at line ${v.line} matches the declared profile '${nameFor(v.value)}' in ${where}. Each surface keeps its own boundaries until somebody pays to re-render; this one is a ruling, not a drift.`,
          test: 'chunk constant equals a declared profile value',
          accepted: { reason: 'declared in the profile table', on: null }
        });
      } else {
        out.push({
          id: 'chunk-drift',
          severity: 'fault',
          surface: s.file,
          detail: `${k} = ${v.value} at line ${v.line} matches NO declared profile (${Object.entries(declared).map(([a, b]) => a + ':' + b).join(', ')} in ${where}). The chunk boundaries ARE the cache namespace — an undeclared size renders its own archive and no invoice says so.`,
          test: 'chunk constant absent from the declared profile table'
        });
      }
    }
  }

  /* ── CODE CONSOLIDATED IS NOT CACHE CONSOLIDATED ─────────────────────────
     Two separable jobs, and amenti-voice.js says so outright: consolidating the
     CODE is free, consolidating the CACHE KEY is not. A surface can correctly
     defer the second and still owe the first. Reporting them as one finding is
     how a free repair gets postponed under cover of a priced one. */
  if (Object.keys(declared).length) {
    const platform = (reading.profiles.sources || []).map(x => x.file);
    for (const s of reading.surfaces) {
      const inlineEngines = s.engines.filter(e => e.role === 'engine').map(e => e.global);
      if (!inlineEngines.length) continue;
      const loadsPlatform = s.scripts.some(t => platform.includes(t.src));
      if (!loadsPlatform) out.push({
        id: 'code-not-consolidated',
        severity: 'finding',
        surface: s.file,
        detail: `defines its own engine(s) inline — ${inlineEngines.join(', ')} — and loads none of ${platform.join(', ')}, which exists on disk and offers the same boundaries as a profile. The CACHE consolidation is priced and may be deferred on purpose; the CODE consolidation is free and has not happened here.`,
        test: 'inline engine present, platform file on disk but not loaded by this surface'
      });
    }
  }

  for (const s of reading.surfaces) {
    if (s.parseHazards.length) out.push({
      id: 'unstrippable',
      severity: 'blocking',
      surface: s.file,
      detail: `${s.parseHazards.length} script block(s) could not be stripped cleanly — ${s.parseHazards.map(h => h.kind + ' at line ' + h.line).join('; ')}. Everything after that point in the block was read as a string, so no reading below it is reliable. A quote left open once blanked a live engine and this probe reported nothing.`,
      test: 'stripper reached end of block inside a string, template or comment'
    });
  }

  if (reading.unread.length) out.push({
    id: 'unread',
    severity: 'blocking',
    detail: `${reading.unread.length} referenced file(s) could not be opened: ${reading.unread.map(u => u.src).join(', ')}. No verdict above covers them.`,
    test: 'existsSync on every local <script src>'
  });

  /* an accepted finding is not silenced — it is marked, with the reason and the
     date somebody ruled on it, and it keeps appearing so the ruling stays
     visible. Silencing is how a register starts lying. */
  for (const f of out) {
    const a = accepted.find(x => x.id === f.id && (!x.global || x.global === f.global) && (!x.surface || x.surface === f.surface));
    if (a) { f.accepted = { reason: a.reason || null, on: a.on || null }; f.severity = 'accepted'; }
  }

  return out;
}

/* ========================================================================== */
/* 8 · MAIN                                                                    */
/* ========================================================================== */

function main(argv) {
  const args = argv.slice(2);
  let outPath = 'VOICE.json';
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') { outPath = args[++i]; continue; }
    files.push(args[i]);
  }
  const root = files.length ? dirname(resolve(files[0])) : process.cwd();
  const surfacesIn = files.length
    ? files
    : readdirSync(root).filter(f => f.toLowerCase().endsWith('.html')).map(f => join(root, f)).sort();

  if (!surfacesIn.length) {
    console.error(`${PROBE}: no surfaces to read. Nothing written.`);
    process.exit(1);
  }

  const loaded = surfacesIn.map(readSurface);
  const firstPass = loaded.map(s => walkSurface(s, { globals: [], read: [] }));
  const sidecars = readSidecars(firstPass, root);
  const profiles = declaredProfiles(root);
  const surfaces = loaded.map(s => walkSurface(s, sidecars));

  const reading = {
    probe: PROBE,
    version: VERSION,
    generated: new Date().toISOString(),
    root: basename(root),
    profiles,
    surfaces,
    files: { read: sidecars.read.map(({ _code, ...rest }) => rest), unread: sidecars.unread },
    unread: sidecars.unread,
    cacheKey: {
      composition: 'sha256(TTS_MODEL + voice + STYLE + TEXT)',
      composedIn: 'proxy worker.js — PRIVATE, NOT READ BY THIS PROBE',
      readFromSource: false,
      note: 'The inputs below are what each surface SENDS. Whether the Worker hashes them in this order is not readable from here and is not claimed.',
      posts: surfaces.map(s => ({ surface: s.file, sites: s.speakPosts })),
      chunking: surfaces.map(s => ({ surface: s.file, constants: s.chunking }))
    },
    notMeasured: [
      'whether any path produces sound — source order proves a global exists when asked for, nothing more',
      'archive health — that is the ARCHIVE WATCH, six wires, every six hours',
      'the Worker cache key composition — the Worker cannot be read, so it is asked, elsewhere',
      'intent, doctrine, register choice — those are authored and live in the briefs'
    ]
  };
  reading.accepted = loadAccepted(root);
  reading.findings = findings(reading, reading.accepted);
  reading.counts = {
    surfaces: surfaces.length,
    engines: surfaces.reduce((n, s) => n + s.engines.length, 0),
    filesRead: sidecars.read.length,
    filesUnread: sidecars.unread.length,
    faults: reading.findings.filter(f => f.severity === 'fault').length,
    confirmed: reading.findings.filter(f => f.severity === 'confirmed').length,
    unproven: reading.findings.filter(f => f.severity === 'unproven').length,
    findings: reading.findings.filter(f => f.severity === 'finding').length,
    blocking: reading.findings.filter(f => f.severity === 'blocking').length,
    accepted: reading.findings.filter(f => f.severity === 'accepted').length
  };

  writeFileSync(outPath, JSON.stringify(reading, null, 2) + '\n');

  /* read it back. A probe that reports on a file it did not verify is the
     Silent Signature wearing a probe's coat. */
  let back;
  try { back = JSON.parse(readFileSync(outPath, 'utf8')); }
  catch (e) { console.error(`${PROBE}: wrote ${outPath} and could not read it back — ${e.message}`); process.exit(1); }

  const c = back.counts;
  console.log(`${PROBE} ${VERSION} -> ${outPath}`);
  console.log(`  surfaces ${c.surfaces} · globals ${c.engines} · files read ${c.filesRead} · unread ${c.filesUnread}`);
  for (const s2 of back.surfaces) {
    const roles = {};
    for (const e of s2.engines) roles[e.role] = (roles[e.role] || 0) + 1;
    console.log(`  ${s2.file}: ${Object.entries(roles).map(([k, v]) => v + ' ' + k).join(', ') || 'nothing'}` +
      ` · synthesis ${s2.synthesis.length}` +
      ` · call sites ${s2.callSites.attributed}/${s2.callSites.total} attributed`);
  }
  console.log(`  faults ${c.faults} · findings ${c.findings} · confirmed ${c.confirmed} · unproven ${c.unproven} · accepted ${c.accepted} · blocking ${c.blocking}`);
  for (const f of back.findings) {
    console.log(`  [${f.severity}] ${f.id} ${f.surface ? '· ' + f.surface : ''}${f.global ? ' · ' + f.global : ''}`);
    console.log(`      ${f.detail}`);
  }
}

main(process.argv);
