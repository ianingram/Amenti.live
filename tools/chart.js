#!/usr/bin/env node
/* ============================================================================
   tools/chart.js  ·  THE CHART OF THE ARCHIPELAGO
   ----------------------------------------------------------------------------
   Walks every repo the system is made of and writes CHART.json: every file,
   which island it is on, how big it is, and — the part that does not exist
   anywhere today — WHETHER ANY REGISTER CLAIMS IT.

     node tools/chart.js                    # this repo only
     node tools/chart.js --gh <token>       # all five, via the GitHub API
     node tools/chart.js --check            # report only, exit 1 on unclaimed

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   The ship is well inventoried. The FLEET is not.

       PLATES.json    covers img/
       KEYS.json      covers the keys
       WORKERS.json   covers the six Workers
       PANES.json     covers the fifteen panes
       SOURCES.json   covers the forty-one briefs
       fleet-structure covers 49 files of ship code

   Six registers, each perfect about its own island, and NOTHING ABOVE THEM.
   Five repos that do not know the others exist.

   ── AND EVERY FAULT THIS WEEK LIVED IN THE WATER BETWEEN THEM ─────────────
     gw-winter        a SCENE that the PLATE register counted as a figure
     julius-caesar    one man across two keys, and no single register could
                      see both halves
     the Harbor       replaced by a Go hello-world; no register watched panes
     the briefs       8 of 41 linked; no register watched briefs

   NOT ONE of those was an error inside a register. Every one of them was
   reporting truthfully about its own island. The faults were in the water.

   So this is not a convenience. It is the instrument aimed at where the faults
   actually live.

   ── THE SECOND REASON ─────────────────────────────────────────────────────
   The Amenti Key: a thing that exists in one place, in plain text, under
   version control, is a thing that survives. It has always been read PER FILE.

   Five repos with no chart means THE SHAPE OF THE SYSTEM EXISTS ONLY IN ONE
   PERSON'S HEAD — which is the one place it is not written down.

   ── WHAT IT RECORDS, AND WHAT IT REFUSES TO ───────────────────────────────
   Existence and ownership. Not contents. It says a file is aboard and which
   register speaks for it; it does not say what is in it, because six other
   registers already do that better and a second opinion is a second truth.

   UNCLAIMED IS THE FINDING. A file aboard that no register names is not
   necessarily wrong — but nobody is watching it, and this week established
   what that costs.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT  = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const CHECK = process.argv.includes('--check');
const GH    = (() => { const i = process.argv.indexOf('--gh'); return i > -1 ? process.argv[i+1] : null; })();

/* ── THE ARCHIPELAGO ──────────────────────────────────────────────────────
   Five islands. Two are private and are recorded as unreachable rather than
   omitted — an island left off a chart is not a small island, it is a wreck
   waiting to happen. */
const ISLANDS = [
  { repo: 'Amenti.live',             branch: 'main',   what: 'the ship — roster, library, img, tools, probes, surfaces' },
  { repo: 'Fleet-Documents',         branch: 'branch', what: 'the mirror — fifteen panes and the readings they show',
    note: 'the default branch is literally named `branch`. A URL built with `main` 404s, and that 404 looks exactly like a missing file.' },
  { repo: 'Amenti-Technical-Briefs', branch: 'main',   what: 'the briefs — 41 shop-floor accounts of the building' },
  { repo: 'Amenti-Workers',          branch: 'main',   what: 'the mirror of six Cloudflare Workers', private: true },
  { repo: 'Admin',                   branch: 'main',   what: 'the hub at amenti.live', private: true },
];

/* ── WHO SPEAKS FOR WHAT ──────────────────────────────────────────────────
   A file is CLAIMED when a register names it. These are the six registers
   that exist, and the rule each one covers. Order matters only for reporting;
   a file may be claimed by more than one. */
const CLAIMS = [
  { by: 'PLATES.json',      rule: /^img\/(?!scene\/).+\.(jpg|jpeg|png|webp)$/i, what: 'a plate' },
  { by: 'PLATES.json',      rule: /^img\/scene\/.+$/i,                          what: 'a scene' },
  { by: 'KEYS.json',        rule: /^library\/[^/]+\.json$/i,                    what: 'a room catalog' },
  { by: 'the rooms',        rule: /^library\/[^/]+\/.+\.md$/i,                  what: 'a primary text' },
  { by: 'names.csv',        rule: /^names\.csv$/i,                              what: 'the roster' },
  { by: 'spec/spells.json', rule: /^spec\/spells\.json$/i,                      what: 'the specification' },
  { by: 'the weighing',     rule: /^probes\/.+\.mjs$/i,                         what: 'a probe' },
  { by: 'the registers',    rule: /^tools\/.+\.js$/i,                           what: 'an instrument' },
  { by: 'PANES.json',       rule: /^[^/]+\.html$/i,                             what: 'a pane', only: 'Fleet-Documents' },
  { by: 'SOURCES.json',     rule: /\.(html|pdf)$/i,                             what: 'a brief', only: 'Amenti-Technical-Briefs' },
  { by: 'WORKERS.json',     rule: /^(mint|proxy|workers)\/.+$/i,                what: 'a Worker', only: 'Amenti-Workers' },
  { by: 'the gate',         rule: /^\.github\/workflows\/.+\.ya?ml$/i,          what: 'a workflow' },
  { by: 'the register',     rule: /^(img\/(PLATES|MANIFEST|KEYS)\.json|KEYS\.json|PANES\.json|WORKERS\.json|SOURCES\.json|BOOK\.json|spell-conformance\.json|fleet-manifest\.js|fleet-structure\.json)$/i,
    what: 'a reading' },
  { by: 'BOOK.json',        rule: /^book\/.+\.md$/i,                            what: 'a chapter' },
  { by: 'fleet-nav.js',     rule: /^fleet-nav\.js$/i,                           what: 'the pane registry' },
];

const IGNORE = /(^|\/)(\.git|node_modules|\.DS_Store|_scratch)(\/|$)/;

function claimFor(repo, rel) {
  const hits = [];
  for (const c of CLAIMS) {
    if (c.only && c.only !== repo) continue;
    if (c.rule.test(rel)) hits.push({ by: c.by, what: c.what });
  }
  return hits;
}

/* ── WALK ─────────────────────────────────────────────────────────────── */
function walkLocal(root, repo) {
  const out = [];
  (function rec(dir) {
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (IGNORE.test(rel)) continue;
      if (e.isDirectory()) { rec(full); continue; }
      let kb = null;
      try { kb = Math.round(fs.statSync(full).size / 102.4) / 10; } catch {}
      out.push({ repo, path: rel, kb, claims: claimFor(repo, rel) });
    }
  })(root);
  return out;
}

/* The API path. Needs a token for the private islands; without one they are
   recorded as UNREACHABLE, which is a different answer from EMPTY and the
   chart says so. */
async function walkRemote(island, token) {
  const url = `https://api.github.com/repos/ianingram/${island.repo}/git/trees/${island.branch}?recursive=1`;
  const res = await fetch(url, {
    headers: Object.assign({ accept: 'application/vnd.github+json' },
      token ? { authorization: 'Bearer ' + token } : {}),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (j.truncated) console.error('::warning::' + island.repo + ' tree was TRUNCATED by the API — the chart is incomplete for it');
  return (j.tree || []).filter(n => n.type === 'blob' && !IGNORE.test(n.path))
    .map(n => ({ repo: island.repo, path: n.path,
                 kb: n.size != null ? Math.round(n.size / 102.4) / 10 : null,
                 claims: claimFor(island.repo, n.path) }));
}

(async () => {
  const files = [], islands = [];

  for (const isl of ISLANDS) {
    const here = path.basename(path.resolve(ROOT)) === isl.repo;
    let got = null, how = null, why = null;

    if (here) { got = walkLocal(ROOT, isl.repo); how = 'local'; }
    else {
      try { got = await walkRemote(isl, GH); how = GH ? 'api' : 'api (anonymous)'; }
      catch (e) { why = String(e.message || e); }
    }

    if (got) { files.push(...got); islands.push({ ...isl, read: how, files: got.length }); }
    else {
      /* AN ISLAND THAT COULD NOT BE READ IS NOT AN EMPTY ISLAND. */
      islands.push({ ...isl, read: null, unreachable: why,
        note: (isl.note ? isl.note + ' ' : '') +
              (isl.private ? 'Private — needs a token. Recorded, not omitted.'
                           : 'Could not be read this run. This is UNKNOWN, not empty.') });
    }
  }

  const unclaimed = files.filter(f => !f.claims.length);
  const byRepo = {};
  files.forEach(f => {
    byRepo[f.repo] = byRepo[f.repo] || { files: 0, kb: 0, unclaimed: 0 };
    byRepo[f.repo].files++;
    byRepo[f.repo].kb += (f.kb || 0);
    if (!f.claims.length) byRepo[f.repo].unclaimed++;
  });
  Object.values(byRepo).forEach(r => { r.kb = Math.round(r.kb); });

  /* ── REPORT ─────────────────────────────────────────────────────────── */
  console.error('');
  islands.forEach(i => {
    console.error('  ' + i.repo.padEnd(24) +
      (i.read ? String(i.files).padStart(5) + ' files · ' + i.read
              : '    — UNREACHABLE' + (i.private ? ' (private)' : '')));
  });
  console.error('');
  console.error('  charted   ' + files.length + ' files across ' +
                islands.filter(i => i.read).length + ' of ' + ISLANDS.length + ' islands');
  console.error('  unclaimed ' + unclaimed.length +
                '   no register names these');
  if (unclaimed.length) {
    console.error('');
    unclaimed.slice(0, 40).forEach(f => console.error('    ' + f.repo + '/' + f.path));
    if (unclaimed.length > 40) console.error('    … and ' + (unclaimed.length - 40) + ' more');
  }

  const out = {
    _: 'GENERATED by tools/chart.js — do not edit. Every file in the system, and which register speaks for it.',
    _law: 'EVERY FAULT THIS WEEK LIVED IN THE WATER BETWEEN TWO REGISTERS. This is the chart of the water.',
    _what: 'Existence and ownership. NOT contents — six other registers do that better, and a second opinion is a second truth.',
    generated: new Date().toISOString(),
    islands,
    totals: {
      files: files.length,
      unclaimed: unclaimed.length,
      islandsRead: islands.filter(i => i.read).length,
      islandsTotal: ISLANDS.length,
      byRepo,
    },
    unclaimed: unclaimed.map(f => ({ repo: f.repo, path: f.path, kb: f.kb })),
    files,
  };

  if (CHECK) {
    console.error('\n--check: nothing written');
    process.exit(unclaimed.length ? 1 : 0);
  }
  fs.writeFileSync(path.join(ROOT, 'CHART.json'), JSON.stringify(out, null, 2) + '\n');
  console.error('\nwrote CHART.json');
})();
