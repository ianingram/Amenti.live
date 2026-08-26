#!/usr/bin/env node
/* ============================================================================
   probe-page1.mjs · THE FLAGSHIP PROBE · Amenti.live/probes
   ----------------------------------------------------------------------------
   The library has a librarian. The panes have a probe. The ark verifies itself
   daily. The flagship — 519 KB, 8,500 lines, the artifact all of them exist to
   serve — was read by nobody.

   This walks Page1.html and reports WHAT IS ACTUALLY THERE. It does not lint,
   it does not have opinions about style, and it does not rewrite anything. It
   reads, the way probe-library.mjs reads: it opens the file, and for every
   local asset the page references IT LOOKS ON DISK to see whether the file
   exists. A reference is a claim; the probe checks the claim.

   ── WHAT IT READS ─────────────────────────────────────────────────────────
     missingAssets     referenced local src/href with no file on disk
     duplicateIds      the same id on two elements — getElementById takes the
                       first and the second is silently dead
     unversioned       local css/js with no ?v= — the cache-bust rule, counted
     globalBlocks      inline <script> not wrapped in an IIFE
     uncaughtFetches   fetch() with no .catch in reach
     frozenNumbers     bare numerals in visible text that look like counts
     size/blocks       bytes, lines, script and style block counts

   ── THE LAW IT OBEYS ──────────────────────────────────────────────────────
   EMPTY GLASS. If the page cannot be read, this writes NOTHING and exits
   non-zero. A PAGE1.json from yesterday is worse than no PAGE1.json, because
   the pane will render it as today.

   ── HOW IT FAILS ──────────────────────────────────────────────────────────
   Exit 0 always, unless the page itself could not be read or --strict was
   passed and a RED finding exists. A probe that fails the build on a finding
   it just started reporting turns a new instrument into an outage; the counts
   are the point, and --strict is how you opt into enforcement once they are
   at zero.

   ── USAGE ─────────────────────────────────────────────────────────────────
     node probes/probe-page1.mjs
     node probes/probe-page1.mjs --page Page1.html --out PAGE1.json
     node probes/probe-page1.mjs --strict     # exit 1 on any RED finding
     node probes/probe-page1.mjs --quiet      # no stdout, just write

   No dependencies. Node 18+.
   ========================================================================= */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

/* ── arguments ───────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (flag) => argv.includes(flag);

const PAGE   = arg('--page', 'Page1.html');
const OUT    = arg('--out', 'PAGE1.json');
const STRICT = has('--strict');
const QUIET  = has('--quiet');

/* ── read the real thing, or write nothing ───────────────────────────────── */
const pagePath = resolve(process.cwd(), PAGE);
if (!existsSync(pagePath)) {
  console.error(`probe-page1: ${PAGE} not found at ${pagePath}.`);
  console.error('probe-page1: EMPTY GLASS — writing nothing. The pane will say so.');
  process.exit(2);
}

let src;
try {
  src = readFileSync(pagePath, 'utf8');
} catch (e) {
  console.error(`probe-page1: could not read ${PAGE}: ${e.message}`);
  console.error('probe-page1: EMPTY GLASS — writing nothing.');
  process.exit(2);
}

const root  = dirname(pagePath);
const lines = src.split('\n');
const lineAt = (i) => src.slice(0, i).split('\n').length;

/* ── a version of the source with comments blanked, same length ──────────────
   Same length so every offset still maps to the true line number. Findings
   inside an HTML comment are not findings — THE-STANDING-SLIP mentions
   `<section id="bookstore">` inside a comment in this very file, and an
   instrument that reports it has cried wolf on its first run. */
const blank = (s, re) => s.replace(re, (m) => ' '.repeat(m.length));
const noComments = blank(src, /<!--[\s\S]*?-->/g);

/* ── carve out the blocks ────────────────────────────────────────────────── */
const inlineScripts = [];   // { line, len, iife, body }
const externScripts = [];   // { line, src, defer, async, versioned, external }
const styleBlocks   = [];

const blockRanges = [];     // [start, end] of every script/style block

for (const m of noComments.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = m[1], body = m[2], line = lineAt(m.index);
  blockRanges.push([m.index, m.index + m[0].length]);
  const srcAttr = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
  if (srcAttr) {
    const url = srcAttr[1];
    externScripts.push({
      line,
      src: url,
      defer: /\bdefer\b/i.test(attrs),
      async: /\basync\b/i.test(attrs),
      versioned: /[?&]v=/.test(url),
      external: /^(https?:)?\/\//.test(url),
      integrity: /\bintegrity\s*=/i.test(attrs)
    });
  } else {
    // An IIFE, an arrow-IIFE, a module, or a bare data island are all fine.
    const iife = /^\s*[;(]*\s*(\(\s*function|\(\s*\(\s*\)\s*=>|!function|void\s+function)/.test(body)
              || /\btype\s*=\s*["']application\/json["']/i.test(attrs)
              || /\btype\s*=\s*["']module["']/i.test(attrs);
    inlineScripts.push({ line, len: body.length, iife, body });
  }
}

for (const m of noComments.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  styleBlocks.push({ line: lineAt(m.index), len: m[1].length });
  blockRanges.push([m.index, m.index + m[0].length]);
}

/* markup = the page with script and style blocks blanked, so anything found in
   it is really in the DOM and not in a string a script happens to contain.
   ── DO NOT do this with a second, independent regex pass. ──────────────────
   The first version did, and a stray `<script` inside a JS documentation
   comment — with no real closer — swallowed thousands of lines, so the probe
   reported ONE markup id on a page with 156 of them and found no duplicate at
   all when one was deliberately planted. It failed silently and looked healthy,
   which is the exact failure this whole ship is built to catch, committed by
   the instrument built to catch it.
   The block boundaries were already resolved above. Blank THOSE ranges. */
const chars = noComments.split('');
for (const [a, b] of blockRanges) {
  for (let i = a; i < b; i++) if (chars[i] !== '\n') chars[i] = ' ';
}
const markup = chars.join('');

/* ── 1 · duplicate ids ───────────────────────────────────────────────────────
   Counted in markup AND in ids that scripts write via innerHTML, because a
   static element and an injected one colliding is exactly the dispatch-card
   case and it is invisible if you only look at one of the two. */
const idHits = new Map();  // id -> [{line, where}]
const noteId = (id, line, where, block) => {
  if (!id || id.includes('${') || id.includes('{{')) return;  // template slot
  if (!idHits.has(id)) idHits.set(id, []);
  idHits.get(id).push({ line, where, block });
};
for (const m of markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) {
  noteId(m[1], lineAt(m.index), 'markup');
}
for (const s of inlineScripts) {
  const base = src.indexOf(s.body);
  for (const m of s.body.matchAll(/\bid=\\?["']([^"'\\]+)\\?["']/g)) {
    noteId(m[1], base >= 0 ? lineAt(base + m.index) : s.line, 'injected', s.line);
  }
}
const duplicateIds = [...idHits.entries()]
  .filter(([, hits]) => hits.length > 1)
  .map(([id, hits]) => ({
    id,
    count: hits.length,
    lines: hits.map((h) => h.line),
    where: [...new Set(hits.map((h) => h.where))].join('+'),
    blocks: [...new Set(hits.map((h) => h.block).filter(Boolean))],
    /* RED  — every copy is in static markup, or every copy is injected by the
              SAME script block, so both are certainly in the DOM together and
              getElementById will silently take the first.
       CHECK — copies come from different sources (static + injected, or two
              different blocks). A bug only if both render at once, which the
              file alone cannot say. A human decides; the probe points. */
    severity: (() => {
      if (hits.every((h) => h.where === 'markup')) return 'red';
      const blocks = new Set(hits.map((h) => h.block ?? 'markup'));
      return blocks.size === 1 ? 'red' : 'check';
    })()
  }))
  .sort((a, b) => b.count - a.count);

/* ── 2 · every local reference, checked against disk ─────────────────────── */
const IGNORE_REF = /^(#|data:|mailto:|tel:|javascript:|about:)/i;
const refs = new Map();  // path -> { line, kind }

/* THE SCRIPT TAGS FIRST. `markup` has every <script> blanked, so scanning it
   alone finds the stylesheets and misses all 21 deferred scripts — the exact
   files the cache-bust rule is about. Caught by running the probe against the
   real page before shipping it, which is the only reason this line exists. */
for (const s of externScripts) {
  if (s.external || s.src.includes('${')) continue;
  refs.set(s.src, {
    ref: s.src, path: s.src.split('?')[0].split('#')[0], line: s.line,
    versioned: s.versioned, kind: 'js'
  });
}

for (const m of markup.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  const raw = m[1];
  if (IGNORE_REF.test(raw) || /^(https?:)?\/\//.test(raw)) continue;
  if (raw.includes('${') || raw.includes('{{')) continue;   // built at runtime
  const clean = raw.split('#')[0];
  const path  = clean.split('?')[0];
  if (!path || path === '/' || path.endsWith('/')) continue;
  if (!refs.has(raw)) {
    refs.set(raw, {
      ref: raw,
      path,
      line: lineAt(m.index),
      versioned: /[?&]v=/.test(raw),
      kind: /\.(css)$/i.test(path) ? 'css' : /\.(m?js)$/i.test(path) ? 'js' : 'asset'
    });
  }
}
/* scripts that build their own <script src> — amenti-diagnose does this */
for (const s of inlineScripts) {
  for (const m of s.body.matchAll(/\.src\s*=\s*['"]([^'"]+)['"]/g)) {
    const raw = m[1];
    if (/^(https?:)?\/\//.test(raw) || raw.includes('${')) continue;
    if (!refs.has(raw)) {
      refs.set(raw, {
        ref: raw, path: raw.split('?')[0], line: s.line,
        versioned: /[?&]v=/.test(raw),
        kind: /\.(m?js)$/i.test(raw.split('?')[0]) ? 'js' : 'asset'
      });
    }
  }
}

const assets = [...refs.values()].map((r) => {
  const onDisk = join(root, r.path);
  const present = existsSync(onDisk);
  return {
    ...r,
    present,
    bytes: present ? statSync(onDisk).size : null
  };
});

const missingAssets = assets.filter((a) => !a.present)
  .map(({ ref, path, line, kind }) => ({ ref, path, line, kind }));

/* the cache-bust rule applies to code, not to images and fonts: a stale .webp
   is a stale picture, a stale .js is a different program */
const codeAssets  = assets.filter((a) => a.kind === 'js' || a.kind === 'css');
const unversioned = codeAssets.filter((a) => !a.versioned)
  .map(({ ref, line, kind }) => ({ ref, line, kind }));

/* ── 3 · inline blocks in shared global scope ────────────────────────────── */
const globalBlocks = inlineScripts.filter((s) => !s.iife)
  .map((s) => ({ line: s.line, chars: s.len }))
  .sort((a, b) => b.chars - a.chars);

/* ── 4 · fetch() with no .catch in reach ─────────────────────────────────────
   Deliberately crude: it looks forward for a .catch or a surrounding try. It
   will occasionally be wrong. It is right often enough to be worth the noise,
   and a false positive costs one glance. */
const uncaughtFetches = [];
for (const s of inlineScripts) {
  const base = src.indexOf(s.body);
  for (const m of s.body.matchAll(/\bfetch\s*\(/g)) {
    const window_ = s.body.slice(m.index, m.index + 2500);
    if (/\.catch\s*\(/.test(window_)) continue;
    const before = s.body.slice(Math.max(0, m.index - 600), m.index);
    if (/\btry\s*\{/.test(before) || /\bawait\b/.test(before)) continue;
    uncaughtFetches.push({
      line: base >= 0 ? lineAt(base + m.index) : s.line,
      snippet: window_.slice(0, 90).replace(/\s+/g, ' ').trim()
    });
  }
}

/* ── 5 · frozen numbers ──────────────────────────────────────────────────────
   A count typed into the markup is a memory. It was right once. This finds the
   shapes the ship has already been bitten by: "9 ENTRIES", "9 / 9",
   "LAST SYNC 04:22 UTC", a pinned version string. It reads visible text only. */
const text = markup.replace(/<[^>]+>/g, (m) => ' '.repeat(m.length));
const FROZEN = [
  { name: 'count-noun',  re: /\b\d{1,4}\s+(?:ENTRIES|ENTRY|SOULS|WORKS|ROOMS|PANES|REPOS|SOURCES|FIGURES|TABLETS)\b/gi },
  { name: 'ratio',       re: /(?<![\w.\/])\d{1,4}\s*\/\s*\d{1,4}(?![\w.\/])/g },
  { name: 'last-sync',   re: /LAST\s+SYNC[^<\n]{0,40}/gi },
  { name: 'version-tag', re: /\bv\d+\.\d+\.\d+\b/g }
];
const frozenNumbers = [];
for (const { name, re } of FROZEN) {
  for (const m of text.matchAll(re)) {
    /* the tag-blanking leaves runs of spaces inside the match — collapse them
       so the pane shows "9 ENTRIES" and not "9        ENTRIES" */
    const shown = m[0].replace(/\s+/g, ' ').trim().slice(0, 60);
    frozenNumbers.push({ kind: name, line: lineAt(m.index), text: shown });
  }
}
frozenNumbers.sort((a, b) => a.line - b.line);

/* ── 6 · third-party scripts, pinned and verified? ───────────────────────── */
const thirdParty = externScripts.filter((s) => s.external).map((s) => ({
  line: s.line,
  src: s.src,
  integrity: s.integrity,
  /* @2 is a moving target; @2.39.7 is a decision */
  pinned: /@\d+\.\d+\.\d+/.test(s.src) || /\d+\.\d+\.\d+/.test(s.src)
}));

/* ── 7 · render-blocking local scripts ───────────────────────────────────── */
const blocking = externScripts
  .filter((s) => !s.defer && !s.async && !s.external)
  .map(({ line, src: url }) => ({ line, src: url }));

/* ── the reading ─────────────────────────────────────────────────────────── */
const red = duplicateIds.filter((d) => d.severity === 'red').length + missingAssets.length;

const reading = {
  _: 'GENERATED by probes/probe-page1.mjs — do not edit. A reading, not a memory.',
  _law: 'A reference is a claim. Every local asset below was looked for ON DISK.',
  generatedAt: new Date().toISOString(),
  page: PAGE,

  size: {
    bytes: Buffer.byteLength(src, 'utf8'),
    lines: lines.length,
    inlineScriptBlocks: inlineScripts.length,
    inlineScriptChars: inlineScripts.reduce((n, s) => n + s.len, 0),
    externalScripts: externScripts.length,
    inlineStyleBlocks: styleBlocks.length,
    inlineStyleChars: styleBlocks.reduce((n, s) => n + s.len, 0),
    ids: [...idHits.values()].reduce((n, h) => n + h.length, 0)
  },

  totals: {
    assetsReferenced: assets.length,
    assetsMissing:    missingAssets.length,
    codeAssets:       codeAssets.length,
    unversioned:      unversioned.length,
    duplicateIds:     duplicateIds.length,
    duplicateIdsRed:  duplicateIds.filter((d) => d.severity === 'red').length,
    globalScopeBlocks: globalBlocks.length,
    uncaughtFetches:  uncaughtFetches.length,
    frozenNumbers:    frozenNumbers.length,
    renderBlocking:   blocking.length,
    thirdPartyUnpinned: thirdParty.filter((t) => !t.pinned || !t.integrity).length
  },

  missingAssets,
  duplicateIds,
  unversioned,
  globalScopeBlocks: globalBlocks,
  uncaughtFetches,
  frozenNumbers,
  thirdParty,
  renderBlocking: blocking,

  /* every asset, present or not — so a pane can show the whole reference list
     and not only the failures */
  assets: assets.map(({ ref, path, line, kind, present, bytes, versioned }) =>
    ({ ref, path, line, kind, present, bytes, versioned })),

  staleAfterDays: 2
};

writeFileSync(resolve(process.cwd(), OUT), JSON.stringify(reading, null, 2) + '\n');

/* ── say it out loud ─────────────────────────────────────────────────────── */
if (!QUIET) {
  const t = reading.totals;
  const kb = Math.round(reading.size.bytes / 1024);
  const line = (label, n, bad) =>
    `  ${bad && n ? '✗' : n ? '·' : '✓'} ${String(n).padStart(4)}  ${label}`;

  console.log('');
  console.log(`  THE FLAGSHIP · ${PAGE} · ${kb} KB · ${reading.size.lines} lines`);
  console.log(`  ${reading.size.inlineScriptBlocks} inline blocks · ${reading.size.externalScripts} external scripts · ${reading.size.inlineStyleBlocks} style blocks`);
  console.log('');
  console.log(line('assets referenced but MISSING ON DISK', t.assetsMissing, true));
  console.log(line('duplicate ids (both in markup)',        t.duplicateIdsRed, true));
  console.log(line('duplicate ids (markup + injected)',     t.duplicateIds - t.duplicateIdsRed, false));
  console.log(line(`unversioned css/js (of ${t.codeAssets})`, t.unversioned, false));
  console.log(line('inline blocks in global scope',         t.globalScopeBlocks, false));
  console.log(line('fetch() with no .catch in reach',       t.uncaughtFetches, false));
  console.log(line('frozen numbers in visible text',        t.frozenNumbers, false));
  console.log(line('render-blocking local scripts',         t.renderBlocking, false));
  console.log(line('third-party unpinned or unverified',    t.thirdPartyUnpinned, false));
  console.log('');

  for (const a of missingAssets) console.log(`  MISSING  ${a.ref}  (line ${a.line})`);
  for (const d of duplicateIds)  console.log(`  DUP ID   #${d.id} ×${d.count} at ${d.lines.join(', ')} [${d.where}]`);
  if (missingAssets.length || duplicateIds.length) console.log('');
  console.log(`  wrote ${OUT}`);
  console.log('');
}

/* GitHub Actions summary, if we are in one */
if (process.env.GITHUB_STEP_SUMMARY) {
  const t = reading.totals;
  const rows = [
    ['assets missing on disk', t.assetsMissing],
    ['duplicate ids (red)', t.duplicateIdsRed],
    ['duplicate ids (check)', t.duplicateIds - t.duplicateIdsRed],
    [`unversioned css/js (of ${t.codeAssets})`, t.unversioned],
    ['global-scope inline blocks', t.globalScopeBlocks],
    ['uncaught fetches', t.uncaughtFetches],
    ['frozen numbers', t.frozenNumbers],
    ['third-party unpinned/unverified', t.thirdPartyUnpinned]
  ];
  const md = [
    '## The Flagship',
    '',
    `\`${PAGE}\` · ${Math.round(reading.size.bytes / 1024)} KB · ${reading.size.lines} lines`,
    '',
    '| reading | count |', '|---|---:|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
    ...(missingAssets.length
      ? ['**Missing on disk:**', '', ...missingAssets.map((a) => `- \`${a.ref}\` (line ${a.line})`), '']
      : []),
    ...(duplicateIds.length
      ? ['**Duplicate ids:**', '', ...duplicateIds.map((d) => `- \`#${d.id}\` ×${d.count} — lines ${d.lines.join(', ')} (${d.where})`), '']
      : [])
  ].join('\n');
  try { writeFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n', { flag: 'a' }); } catch {}
}

/* ── how it exits ────────────────────────────────────────────────────────────
   Zero by default. The counts are the instrument; failing the build on the day
   the instrument is installed is how a good instrument gets uninstalled.
   Turn on --strict once the reds are at zero, and they stay at zero. */
if (STRICT && red > 0) {
  console.error(`probe-page1: --strict and ${red} RED finding(s). Failing.`);
  process.exit(1);
}
process.exit(0);
