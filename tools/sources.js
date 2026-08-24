#!/usr/bin/env node
/* ============================================================================
   tools/sources.js  ·  THE SOURCE INDEX
   ----------------------------------------------------------------------------
   Walks the repositories, verifies every path by raw HTTP status, merges the
   authored semantics, and writes SOURCES.json.

     node tools/sources.js            # write SOURCES.json
     node tools/sources.js --check    # report only, exit 1 on drift
     node tools/sources.js --split    # ONE TIME: derive SOURCES.semantics.json
                                      # from the existing hand-made SOURCES.json

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   Every register on this ship has an instrument. plates.js writes PLATES.json.
   keyring.js writes KEYS.json. probe-panes.mjs writes PANES.json.

   SOURCES.json had none. It was the one register maintained BY HAND, in a
   project whose law is that registers are never edited by hand — and its own
   traps block says `a register read from this file is a memory, fetch it`.

   Read 23 August: tools/sources.js 404. probes/probe-sources.mjs 404.
   BRIEFS.txt — asked for by the 13 July handoff — 404. Nothing wrote it, so
   it went stale the way hand-made things do: on that date the index still
   pointed the prologue at book/00-the-beach.md, which had become
   book/preamble-02-the-beach.md. Sixty-three of sixty-four paths were right.
   The sixty-fourth was a 404 nothing could see.

   ── THE THREE SOURCES ─────────────────────────────────────────────────────
   The shape the self-sourcing manifest specified, applied to the index:

     STRUCTURE   GENERATED — walk the repos, list what is there
     SEMANTICS   AUTHORED  — SOURCES.semantics.json. What a document IS, its
                             authority, its warnings. No walk can know these.
     LIVE STATE  PROBED    — every path fetched, judged by raw HTTP status

   …merged, with a drift report naming what appeared and what vanished.

   ── §4, AND WHY THE VERIFY IS SEPARATE FROM THE WALK ──────────────────────
   The unauthenticated GitHub API returns an ERROR OBJECT, not data:

     403 {"message":"API rate limit exceeded for 34.24.99.5. ..."}

   A walk that reads that as a listing reports every document missing, with
   complete confidence. It has produced false negatives twice.

   So the API is used ONLY to enumerate, and never to decide. Every path is
   then judged by fetching the raw file and reading its HTTP status. If the
   enumeration fails, this REFUSES rather than writing a register that says
   everything is gone.

       AN ABSENCE FROM A SOURCE THAT WAS NEVER ASKED IS NOT AN ABSENCE.

   ── WHAT IT CANNOT DO ─────────────────────────────────────────────────────
   It cannot name what is on somebody's laptop. The pose brief was found by
   looking, not by any index, and no walk would have found it. This closes the
   gap between the repos and the index. It does not close the gap between the
   index and the world.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT      = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const OUT       = path.join(ROOT, 'SOURCES.json');
const SEMANTICS = path.join(ROOT, 'SOURCES.semantics.json');
const CHECK     = process.argv.includes('--check');
const SPLIT     = process.argv.includes('--split');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const RAW   = 'https://raw.githubusercontent.com/';

function die(m) { console.error('REFUSES: ' + m); process.exit(2); }

/* A path may be written encoded in the semantics and plain by the walk.
   `The%20Siege.html` and `The Siege.html` are ONE file. Compared raw, the
   walk reports a phantom appearing and the index reports nothing gone —
   both true of the strings, both false of the repository. Compare decoded. */
function norm(p) { try { return decodeURIComponent(p); } catch (e) { return p; } }
const say = m => console.log(m);

/* ── ONE TIME: split the hand-made index into its authored half ──────────── */
if (SPLIT) {
  if (!fs.existsSync(OUT)) die('no SOURCES.json to split at ' + path.resolve(OUT));
  if (fs.existsSync(SEMANTICS)) die('SOURCES.semantics.json already exists. Refusing to overwrite it.');
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const meaning = {};
  for (const [group, items] of Object.entries(old.sources || {}))
    for (const it of items) {
      const { path: p, ...rest } = it;
      meaning[p] = { section: group, ...rest };  // items carry their own `group`; do not clobber it
    }
  fs.writeFileSync(SEMANTICS, JSON.stringify({
    _: 'AUTHORED BY HAND. What each document IS — its meaning, authority and warnings. No walk can know these. tools/sources.js merges this with a repo walk to write SOURCES.json.',
    _law: 'A source that cannot be reached is not a source. It is a thing somebody remembers.',
    _howToEdit: 'Add a path here when a document acquires meaning. Never edit SOURCES.json.',
    preamble: {
      _: old._, _why: old._why, _law: old._law, _howToRead: old._howToRead,
      raw: old.raw, behindTheCaptain: old.behindTheCaptain,
      branches: old.branches, traps: old.traps, _finding: old._finding,
    },
    walk: [
      { repo: 'Amenti-Technical-Briefs', branch: 'main', dir: '', group: 'the briefs', match: '\\.(md|html|pdf)$' },
    ],
    meaning,
  }, null, 2) + '\n');
  say('wrote ' + SEMANTICS + '  (' + Object.keys(meaning).length + ' paths)');
  say('\nNow: read it, add a `walk` entry per repo you want enumerated, then');
  say('run without --split. SOURCES.json becomes generated from that point on.');
  process.exit(0);
}

if (!fs.existsSync(SEMANTICS))
  die('no SOURCES.semantics.json. Run once with --split to derive it from the\n'
    + '         existing hand-made SOURCES.json, then read what it produced.');

const sem = JSON.parse(fs.readFileSync(SEMANTICS, 'utf8'));
const authored = sem.meaning || {};
/* keyed by decoded path; the value keeps whatever path was authored */
const meaning = {};
for (const [k, v] of Object.entries(authored)) meaning[norm(k)] = { ...v, _authoredAs: k };
const pre = sem.preamble || {};

/* ── ENUMERATE. The API is used to LIST and for nothing else. ────────────── */
async function listRepo(w) {
  const url = `https://api.github.com/repos/${sem.owner || 'ianingram'}/${w.repo}/git/trees/${w.branch}?recursive=1`;
  const headers = { 'User-Agent': 'amenti-sources', 'Accept': 'application/vnd.github+json' };
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body || !Array.isArray(body.tree)) {
    /* §4. An error object is not a listing. Do not write a register from it. */
    die(`could not enumerate ${w.repo}@${w.branch} — HTTP ${r.status}`
      + (body && body.message ? `: ${body.message}` : '')
      + '\n         This is the §4 trap: an error object read as data reports'
      + '\n         everything missing. Nothing written. Set GITHUB_TOKEN.');
  }
  const re = new RegExp(w.match || '.');
  return body.tree
    .filter(n => n.type === 'blob')
    .map(n => n.path)
    .filter(p => (!w.dir || p.startsWith(w.dir)) && re.test(p))
    .map(p => `${w.repo}/${w.branch}/${p}`);
}

/* ── VERIFY. Judge by raw file HTTP status, never by the API. ────────────── */
/* raw.githubusercontent.com is served through a CDN that caches for minutes.
   A fetch taken shortly after a commit returns the OLD bytes with a 200 and
   nothing to say it is stale. On 23 Aug this produced three consecutive false
   readings of this very file — reported as "the upload did not land" when it
   had landed every time.

   A cache buster and a no-store header cost nothing and make the reading a
   reading. The instrument is not exempt. */
const BUST = Date.now() + '-' + Math.random().toString(36).slice(2);

async function statusOf(p) {
  const url = RAW + (sem.owner || 'ianingram') + '/' + p + '?_=' + BUST;
  try {
    const r = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    return r.status;
  } catch (e) { return 0; }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

(async () => {
  say('── the source index ───────────────────────────────────────');

  /* walked */
  const walked = new Set();
  for (const w of (sem.walk || [])) {
    const found = await listRepo(w);
    found.forEach(p => walked.add(p));
    say(`walked        ${w.repo}@${w.branch}  ${found.length} files`);
  }
  if (!sem.walk || !sem.walk.length)
    say('walked        nothing — SOURCES.semantics.json declares no `walk` entries');

  /* every path we know of, from either side */
  const all = [...new Set([...Object.keys(meaning), ...[...walked].map(norm)])].sort();
  say(`verifying     ${all.length} paths by raw HTTP status …`);

  const codes = await pool(all, 12, p => statusOf((meaning[p] && meaning[p]._authoredAs) || p));
  const status = Object.fromEntries(all.map((p, i) => [p, codes[i]]));

  const gone     = all.filter(p => meaning[p] && status[p] !== 200);
  const appeared = [...walked].map(norm).filter(p => !meaning[p]).sort();
  const live     = all.filter(p => status[p] === 200);

  say('');
  say(`  reachable     ${live.length}`);
  say(`  unreachable   ${gone.length}`);
  say(`  unindexed     ${appeared.length}   (in a repo, no entry in semantics)`);
  say('');
  gone.forEach(p => say(`  ${status[p]}  GONE       ${p}`));
  appeared.forEach(p => say(`       APPEARED   ${p}`));
  if (gone.length || appeared.length) say('');

  if (CHECK) {
    const bad = gone.length + appeared.length;
    say('--check: ' + (bad ? bad + ' drift(s)' : 'index matches the repos') + ', nothing written');
    process.exit(bad ? 1 : 0);
  }

  /* ── merge ─────────────────────────────────────────────────────────────── */
  const groups = {};
  for (const p of all) {
    const m = meaning[p];
    const g = m ? m.section : (sem.walk.find(w => p.startsWith(w.repo + '/' + w.branch + '/')) || {}).group || 'unindexed';
    (groups[g] ||= []).push({
      ...(m ? (({ section, _authoredAs, ...r }) => r)(m) : { id: path.basename(p).replace(/\.[^.]+$/, '').toLowerCase() }),
      path: p,
      ...(status[p] === 200 ? {} : { unreachable: status[p] }),
      ...(m ? {} : { authority: 'UNDESCRIBED — walked, not yet authored' }),
    });
  }

  fs.writeFileSync(OUT, JSON.stringify({
    _: pre._ || 'THE SOURCE INDEX.',
    _generated: 'GENERATED by tools/sources.js — DO NOT EDIT. Meaning is authored in SOURCES.semantics.json; structure is walked; every path below was fetched and returned 200 unless marked otherwise.',
    _why: pre._why,
    _law: pre._law,
    _howToRead: pre._howToRead,
    generated: new Date().toISOString(),
    generator: 'tools/sources.js',
    raw: pre.raw || RAW + (sem.owner || 'ianingram') + '/',
    drift: {
      _: 'What the walk and the authored semantics disagree about, at the hour of writing.',
      unreachable: gone.map(p => ({ path: p, status: status[p] })),
      unindexed: appeared,
      _note: 'unindexed means the file is in a repo and nobody has said what it is. It is not an error. It is a document waiting for a sentence.',
    },
    counts: { reachable: live.length, unreachable: gone.length, unindexed: appeared.length },
    sources: groups,
    behindTheCaptain: pre.behindTheCaptain,
    branches: pre.branches,
    traps: pre.traps,
    _finding: pre._finding,
  }, null, 2) + '\n');

  say('wrote         ' + OUT);
  say('───────────────────────────────────────────────────────────');
})();
