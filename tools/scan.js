#!/usr/bin/env node
/* ============================================================================
   tools/scan.js  ·  THE SCANNER
   ----------------------------------------------------------------------------
   IT OBSERVES. IT DOES NOT VERIFY, AND IT DOES NOT DECLARE.

   It reads the repo and reports what is ACTUALLY THERE — files, globals, who
   loads whom, WHO CALLS WHOM, endpoints, and load order. It has no opinion about
   what any of it means. It emits fleet-structure.json and stops.

   THE VERIFICATION IS THE DIFF.
     fleet-semantics.js   a human DECLARES   ("the Boatswain of the Voice")
     fleet-structure.json the scanner OBSERVES ("amenti-voice.js declares Amenti.voice")
     the two disagreeing  IS the finding      ("you said /generate. There is no /generate.")

   ── WHY IT EXISTS ──────────────────────────────────────────────────────────
   Every document in this fleet has lied, and every one was written in good faith:

     "amenti-chat.js is the PRIMARY PATH"     the Terminal never loaded it
     "voiceprofiles assigns every soul"       zero callers
     "keys map 1:1 to AMENTI_CHARS"           23 sovereigns, 20 voices
     "historyCap — max chat turns"            it counts MESSAGES
     "push-to-talk: deliberate"               it was a limitation, not a choice
     "grep -> amenti-chat.js calls /generate" there is no /generate route

   None of those was careless. THEY WERE ALL TRUE WHEN WRITTEN, AND THE FLEET
   SAILED. A document is a snapshot, and a snapshot of a moving system becomes a
   lie at a rate nobody can see.

   Every one of them was a grep. NOT ONE required insight — only looking.

   ── THE CHECK THAT WOULD HAVE SAVED A SESSION ──────────────────────────────
   Loading a file is not using it, and USING it is not the question either.
   The question is:

       IS IT LOADED BEFORE THE THING THAT CALLS IT?

   Page1's Terminal is an IIFE. It runs AT PARSE TIME and asks for Amenti.chat.
   amenti-chat.js was loaded 936 lines later. The guard failed silently, the
   Terminal ran an inline fallback, and FOURTEEN HARNESSES REPORTED GREEN —
   because they created their own object and tested THE FILE, not THE TERMINAL.

   scanLoadOrder() is that check. Run once, it finds it in milliseconds.

   ── AND THE LESSON THAT COST FOUR HOURS ────────────────────────────────────
   STRIP COMMENTS BEFORE YOU SCAN. FOUR separate checks were broken today by
   prose: a comment containing the word <script>, a comment containing the exact
   line being searched for, a comment saying "script src", a comment naming a
   retired engine. A scanner that reads comments is reading fiction.

   Usage:   node tools/scan.js [repoDir] > fleet-structure.json
   ============================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.argv[2] || '.';

/* ── STRIP. Nothing is scanned until the prose is gone. ───────────────────── */
function strip(src, kind) {
  let s = src;
  if (kind === 'html') s = s.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  // block comments — blank them out but KEEP the newlines, so line numbers survive
  s = s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  // line comments — but never inside a URL (https://…) and never inside a string
  s = s.split('\n').map(line => {
    let out = '', q = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i], n = line[i + 1];
      if (q) { out += c; if (c === q && line[i - 1] !== '\\') q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; out += c; continue; }
      if (c === '/' && n === '/' && line[i - 1] !== ':') break;   // ':' guards http://
      out += c;
    }
    return out;
  }).join('\n');
  return s;
}

const lineOf = (s, i) => s.slice(0, i).split('\n').length;

/* ── WHAT ENCLOSES THIS REFERENCE? ────────────────────────────────────────────
   The whole Terminal bug lives in this function.

     inside a NAMED FUNCTION  -> LAZY. It runs when something calls it. Fine.
     inside an IIFE           -> PARSE TIME. It runs the instant the parser
                                 reaches it — and if the file it needs has not
                                 loaded yet, IT SILENTLY GETS undefined.
     at TOP LEVEL             -> PARSE TIME.
   ──────────────────────────────────────────────────────────────────────────── */
function enclosing(src, idx) {
  let depth = 0;
  for (let j = idx; j >= 0; j--) {
    const c = src[j];
    if (c === '}') depth++;
    else if (c === '{') {
      if (depth === 0) {
        // found the opening brace of the enclosing block — what kind is it?
        const head = src.slice(Math.max(0, j - 220), j);
        const last = head.split('\n').pop() + head.split('\n').slice(-2, -1);
        if (/\(\s*function\s*\(|\(\s*\(\s*\)\s*=>|\(\s*async\s+function/.test(head.slice(-90))) return 'iife';
        if (/\bfunction\s+[\w$]+\s*\(|[\w$]+\s*:\s*(async\s+)?function|\bfunction\s*\(|=>\s*$/.test(head.slice(-90))) return 'function';
        // an ordinary block (if / try / for) — keep walking out
        depth = 0;
        continue;
      }
      depth--;
    }
  }
  return 'toplevel';
}

/* ── OBSERVE ─────────────────────────────────────────────────────────────── */
const GLOBAL_DECL = [
  /window\.([A-Za-z_$][\w$]*)\s*=/g,                                 // window.AMENTI_VOICE = {
  /\b((?:Amenti|Sovereign)\.[A-Za-z][\w$]*)\s*=\s*[\{A-Za-z_$]/g,      // Amenti.chat = {  ·  Sovereign.UI = {
];
const ENDPOINT = /['"`](\/(?:speak|listen|generate|quiz|readaloud|arguments|pool|atlantica|article|week|feed|bridge|fleet)[a-z/]*)['"`]/g;
const TABLE    = /\/rest\/v1\/([a-z_]+)/g;

function scanFile(file) {
  const abs = path.join(ROOT, file);
  const raw = fs.readFileSync(abs, 'utf8');
  const kind = file.endsWith('.html') ? 'html' : 'js';
  const code = strip(raw, kind);

  const rec = {
    file,
    bytes: fs.statSync(abs).size,
    sha256: crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16),
    type: kind,
    declares: [],     // globals this file creates
    loads: [],        // <script src> — IN ORDER, with line numbers
    calls: [],        // globals it reaches for, and WHEN
    endpoints: [],
    tables: [],
  };

  /* what it DECLARES */
  const decl = new Set();
  for (const re of GLOBAL_DECL) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(code))) {
      const g = m[1];
      if (/^(location|onload|onerror|addEventListener|scrollTo|innerWidth|innerHeight)$/.test(g)) continue;
      decl.add(g);
      // Sovereign.UI = {…} also proves `Sovereign` itself exists on this surface.
      if (g.includes('.')) decl.add(g.split('.')[0]);
    }
  }
  rec.declares = [...decl].sort();

  /* what it LOADS — in document order. This is the spine of the wiring check. */
  if (kind === 'html') {
    const re = /<script[^>]*\ssrc="([^"]+)"/g;
    let m;
    while ((m = re.exec(code))) {
      if (/^https?:/.test(m[1])) continue;                   // CDN, not ours
      rec.loads.push({ file: m[1], line: lineOf(code, m.index) });
    }
  }

  /* what it CALLS — and, critically, WHEN */
  const seen = new Map();

  /* USAGE vs DECLARATION — and getting this wrong makes the scanner useless.

       a DECLARATION is   G = …
       a USAGE       is   G.method(…)  ·  G(…)  ·  G[key]

     The previous version's URL guard `(?<![\\w/.])` also blocked `window.amentiQuiz`,
     because `window.` puts a DOT in front. So four files that ARE used came back
     ADRIFT. A scanner reporting seven adrift files when one is adrift is worse than
     no scanner: THE REAL FINDING DIES AMONG THE FALSE ONES. */
  const NAMES = 'Amenti\\.[a-z][\\w$]*|Sovereign\\.[A-Z][\\w$]*|AMENTI_[A-Z_]+|' +
                'amentiAuth|amentiQuiz|amentiReadAloud|amentiLeaderboard|' +
                'AmentiTerminal|AmentiAudio|AmentiCost';
  //  (?<![\w/])      never inside a URL — 'Amenti.live' is a DOMAIN, and the first
  //                   version read the repo's own web address as a missing global.
  //  (?:window\.)?   …but DO allow window.amentiQuiz. Blocking the dot broke that.
  //  (?=\s*[.([])    a USAGE reads or calls it.
  const re = new RegExp('(?<![\\w/])(?:window\\.)?(' + NAMES + ')\\b(?=\\s*[.([])', 'g');
  let m;
  while ((m = re.exec(code))) {
    const g = m[1];
    const tail = code.slice(m.index + m[0].length, m.index + m[0].length + 4);
    if (/^\s*=[^=]/.test(tail)) continue;                    // an assignment, not a use
    const when = enclosing(code, m.index);
    const line = lineOf(code, m.index);
    const own  = rec.declares.includes(g);
    const prev = seen.get(g);
    // keep the EARLIEST parse-time reference — that is the one that can break
    if (!prev || (when !== 'function' && prev.when === 'function') ||
        (when === prev.when && line < prev.line)) {
      seen.set(g, { global: g, line, when, own });
    }
  }
  rec.calls = [...seen.values()].sort((a, b) => a.line - b.line);

  ENDPOINT.lastIndex = 0;
  const eps = new Set(); while ((m = ENDPOINT.exec(code))) eps.add(m[1]);
  rec.endpoints = [...eps].sort();

  TABLE.lastIndex = 0;
  const tbl = new Set(); while ((m = TABLE.exec(code))) tbl.add(m[1]);
  rec.tables = [...tbl].sort();

  return rec;
}

/* ── THE WIRING CHECK ─────────────────────────────────────────────────────────
   For every page, for every global it reaches for AT PARSE TIME:
   was the file that declares it loaded BEFORE that line?

   If not:  NOT WIRED. The guard fails silently and the caller gets undefined.
   ──────────────────────────────────────────────────────────────────────────── */
function wiring(files) {
  const declaredBy = {};
  for (const f of files) for (const g of f.declares) (declaredBy[g] ||= []).push(f.file);

  const findings = [];
  for (const page of files.filter(f => f.type === 'html')) {
    const loadedAt = {};
    for (const l of page.loads) {
      const src = files.find(f => f.file === l.file);
      if (src) for (const g of src.declares) {
        if (loadedAt[g] === undefined || l.line < loadedAt[g]) loadedAt[g] = l.line;
      }
    }
    for (const c of page.calls) {
      if (c.when === 'function') continue;              // lazy — runs on an event. Fine.
      if (c.own) continue;                              // the page uses what it made
      const owners = declaredBy[c.global] || [];
      // The page makes it itself — either the exact global, or the namespace it
      // hangs off (Page2 builds `Sovereign` inline; Sovereign.UI is not a stowaway).
      const ns = c.global.split('.')[0];
      if (page.declares.includes(c.global) || page.declares.includes(ns)) continue;
      if (!owners.length) {
        findings.push({ kind: 'STOWAWAY', page: page.file, global: c.global, line: c.line,
          note: 'used at parse time, and NO FILE IN THE REPO DECLARES IT' });
        continue;
      }
      const at = loadedAt[c.global];
      if (at === undefined) {
        findings.push({ kind: 'NOT LOADED', page: page.file, global: c.global, line: c.line,
          declaredIn: owners, note: 'called at parse time, and the page never loads its file' });
      } else if (at > c.line) {
        findings.push({ kind: 'NOT WIRED', page: page.file, global: c.global,
          calledAtLine: c.line, loadedAtLine: at, declaredIn: owners, gap: at - c.line,
          note: `called at line ${c.line}, LOADED at line ${at} — ${at - c.line} lines TOO LATE. ` +
                'The guard fails silently and the caller gets undefined.' });
      }
    }
  }
  return findings;
}

/* ── ADRIFT: declared, loaded, and called by nobody ───────────────────────── */
function adrift(files) {
  const called = new Set();
  for (const f of files) for (const c of f.calls) called.add(c.global);
  const NAMESPACE = /^(Amenti|Sovereign|window)$/;   // plumbing, not a capability
  const out = [];
  for (const f of files.filter(x => x.type === 'js')) {
    const orphans = f.declares.filter(g => !called.has(g) && !NAMESPACE.test(g));
    if (orphans.length) {
      const loaded = files.some(p => p.type === 'html' && p.loads.some(l => l.file === f.file));
      out.push({ file: f.file, declares: orphans, loadedByAPage: loaded,
        note: loaded ? 'LOADED BY A PAGE AND CALLED BY NOBODY — shipped weight, and it will mislead the next reader'
                     : 'declares globals that nothing calls' });
    }
  }
  return out;
}

/* ── RUN ──────────────────────────────────────────────────────────────────── */
const files = fs.readdirSync(ROOT)
  .filter(f => /\.(html|js)$/.test(f))
  .filter(f => !/^probe|^cmp|^build-|^tools/.test(f))
  .sort();

/* A SCANNER THAT REPORTS GREEN ON AN EMPTY ROOM IS THE THING THIS FILE EXISTS
   TO PREVENT. It just did it to me: a shell that does not do brace expansion
   copied no HTML pages, and the scanner cheerfully reported ZERO FINDINGS.
   Say what you looked at, or the silence will lie. */
const pages = files.filter(f => f.endsWith('.html'));
if (!pages.length) {
  console.error('SCANNER REFUSES: no .html pages in ' + path.resolve(ROOT) +
                '. There is nothing to check the wiring of. This is not a clean bill of health.');
  process.exit(2);
}
console.error(`scanning ${files.length} files (${pages.length} pages) in ${path.resolve(ROOT)}`);

const scanned = files.map(scanFile);
const out = {
  meta: {
    generated: new Date().toISOString(),
    scanner: 'tools/scan.js',
    root: path.resolve(ROOT),
    note: 'OBSERVED. Nothing here was typed by a human. If it disagrees with a document, THE DOCUMENT IS WRONG.',
  },
  files: scanned,
  findings: {
    wiring: wiring(scanned),
    adrift: adrift(scanned),
  },
};

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
