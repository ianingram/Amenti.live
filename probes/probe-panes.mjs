#!/usr/bin/env node
/* ============================================================================
   probes/probe-panes.mjs  ·  THE PANE WATCH
   ----------------------------------------------------------------------------
   Walks every pane in fleet-nav.js, reads it off disk, fetches it live, and
   writes PANES.json. Read-only: it observes and does not act.

     node probes/probe-panes.mjs > PANES.json

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   Every register in this fleet watches something.

       tools/plates.js        walks img/
       tools/keyring.js       walks the roster and the keys
       tools/scan.js          walks the wiring
       probes/probe-watches   walks the watches
       mirror.yml             walks the six Workers
       probe-spells.mjs       walks the specification

   NOTHING WATCHED THE PANES.

   On 17 August index.html — the Harbor, the way in — was replaced by a commit
   reading "Update fmt.Println message from 'Hello' to 'Goodbye'". Go. A
   hello-world. Not a subtle failure: THE ENTRANCE WAS REPLACED BY AN
   UNRELATED FILE and sat that way for twelve hours.

   No instrument noticed, in a fleet built entirely out of instruments. It was
   found by clicking a link.

   The same night turned up three more, all found by eye: the Plate Deck with
   no nav mount, so a reader could arrive and not leave; nine panes rendering
   in the fallback face; amenti.css pointing at fonts that never resolved.

   THE SURFACE A READER ARRIVES ON FIRST WAS THE ONE SURFACE
   WITH NOTHING POINTED AT IT.

   ── DISK AND WORLD, AND WHERE THEY DISAGREE ───────────────────────────────
   Each pane is checked twice, because the two answer different questions.

     ON DISK    is the file structurally a pane — nav mount, stylesheet,
                title, and the reading it needs?
     IN THE WORLD  does the URL actually serve it?

   A pane correct on disk and 404 in the world is a DEPLOY failure. A pane that
   serves but is structurally wrong is the Harbor case. A pane wrong in both is
   simply broken. THREE DIFFERENT REPAIRS, and a probe that checked only one
   side would call two of them the same.

   ── WHAT THIS CANNOT DO, STATED RATHER THAN IMPLIED ───────────────────────
   IT CANNOT TELL YOU A PANE IS TELLING THE TRUTH. It can confirm a pane
   fetches a reading and has an empty-glass state; it cannot distinguish a
   hand-typed number from a read one without reading every line. That is
   `the-reading-is-never-typed`, and it is UNPROVEN in the specification for
   exactly this reason.

   So this reports STRUCTURE and REACHABILITY, and says plainly that it does
   not report honesty. A CONFIRMED that overstates itself is a green lamp with
   nothing behind it, and this fleet has eight of those on record.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const BASE = process.env.PANE_BASE || 'https://ianingram.github.io/Fleet-Documents/';
const NAV  = path.join(ROOT, 'fleet-nav.js');

const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

/* ── THE REGISTRY IS THE AUTHORITY ────────────────────────────────────────
   fleet-nav.js holds the single list of every pane, and its own header says
   so: "TO ADD A PANE: add one line to PANES. Every page updates."

   So this probe reads THAT rather than a list of its own. A second list would
   be two copies of one truth — the fault this fleet keeps finding, and the
   reason the Harbor grid and the nav bar disagreed about how many panes exist
   until somebody counted by hand. */
const nav = read('fleet-nav.js');
if (!nav) { console.error('REFUSES: no fleet-nav.js. There is no registry to walk.'); process.exit(2); }

const PANES = [...nav.matchAll(/\{\s*file:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'/g)]
  .map(m => ({ file: m[1], label: m[2].trim() }));
if (!PANES.length) { console.error('REFUSES: fleet-nav.js holds no PANES entries.'); process.exit(2); }

/* which reading each pane depends on. A pane whose file is absent shows empty
   glass — correct behaviour, and still worth reporting. */
const NEEDS = {
  'plate-deck.html': 'PLATES.json',
  'keyring.html':    'KEYS.json',
  'workers.html':    'WORKERS.json',
  'index.html':      'fleet-manifest.js',
  'engine-room.html':'fleet-manifest.js',
  'ships-manifest.html': 'fleet-manifest.js',
  'ocean.html':      'fleet-manifest.js',
  'command.html':    'fleet-manifest.js',
  'watch.html':      'fleet-manifest.js',
};

const rows = [];
for (const p of PANES) {
  const src = read(p.file);
  const r = { file: p.file, label: p.label, onDisk: !!src };

  if (src) {
    r.bytes      = src.length;
    r.navMount   = src.includes('id="fleet-nav"') && src.includes('fleet-nav.js');
    r.stylesheet = /href=["']amenti\.css["']/.test(src);
    r.title      = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || null;
    r.isHtml     = /<html/i.test(src);
    /* THE HARBOR CASE. A file that is present, committed, and NOT A PANE.
       Twelve hours of Go hello-world behind the front door. */
    r.looksLikeAPane = r.isHtml && !!r.title;
    const need = NEEDS[p.file];
    if (need) {
      r.needs = need;
      r.readingPresent = fs.existsSync(path.join(ROOT, need));
      r.emptyGlass = /empty.?glass|NO READING/i.test(src);
    }
  }

  /* ── IN THE WORLD ─────────────────────────────────────────────────────
     A pane can be perfect on disk and unreachable. Pages can fail to build,
     a commit can land without deploying, a path can be right in the repo and
     wrong in the URL. The disk cannot see any of that. */
  try {
    const res = await fetch(BASE + p.file, { cache: 'no-store' });
    r.status = res.status;
    if (res.ok) {
      const body = await res.text();
      r.servedBytes = body.length;
      r.servedIsHtml = /<html/i.test(body);
      /* GitHub Pages answers a missing file with a STYLED 404 PAGE, not an
         empty body. A probe that only checked for content would pass it. */
      r.servedIs404Page = /Page not found|File not found/i.test(body) && body.length < 20000;
    }
  } catch (e) { r.status = null; r.fetchError = String(e && e.message || e); }

  r.served = r.status === 200 && !r.servedIs404Page;
  rows.push(r);
}

/* ── WAS THE WORLD REACHABLE AT ALL? ──────────────────────────────────────
   FOUND BY TESTING THIS PROBE BEFORE IT SHIPPED. With no network, every fetch
   failed and every pane came back UNREACHABLE — and the DISK findings, the
   stranding and the unstyled, were masked behind it. Fifteen simultaneous
   deploy failures is not fifteen findings. It is one, and it is not about the
   panes.

   A probe that reports the same word for "this pane did not deploy" and "the
   probe could not reach the internet" is answering two questions with one
   answer, which is how a real finding gets lost inside a false alarm.

   So: if NOTHING served, the world is declared unreachable, the fetch half is
   set aside, and the disk half is reported on its own — with the limit stated
   rather than the silence implied. */
const anyServed = rows.some(r => r.served);
const worldReachable = anyServed;

for (const r of rows) {
  if (!r.onDisk && !r.served && worldReachable) { r.state = 'MISSING'; continue; }
  if (!r.onDisk && !worldReachable)             { r.state = 'MISSING'; continue; }
  if (!r.onDisk)                                { r.state = 'GHOST'; continue; }
  if (!r.looksLikeAPane)                        { r.state = 'NOT A PANE'; continue; }
  /* only call it unreachable when the world was otherwise answering */
  if (!r.served && worldReachable)              { r.state = 'UNREACHABLE'; continue; }
  if (!r.navMount)                              { r.state = 'STRANDING'; continue; }
  if (!r.stylesheet)                            { r.state = 'UNSTYLED'; continue; }
  if (r.needs && !r.readingPresent)             { r.state = 'NO READING'; continue; }
  r.state = worldReachable ? 'GOOD' : 'GOOD ON DISK';
}

const by = s => rows.filter(r => r.state === s);
const totals = {
  panes: rows.length,
  worldReachable,
  good: by('GOOD').length + by('GOOD ON DISK').length,
  stranding: by('STRANDING').length,
  unstyled: by('UNSTYLED').length,
  unreachable: by('UNREACHABLE').length,
  notAPane: by('NOT A PANE').length,
  noReading: by('NO READING').length,
  ghost: by('GHOST').length,
  missing: by('MISSING').length,
};

const WHY = {
  GOOD:        'on disk, served, navigable, styled, and its reading is present',
  'GOOD ON DISK': 'structurally sound — BUT THE WORLD WAS NOT REACHABLE, so nothing confirms it serves',
  STRANDING:   'serves, but mounts no nav — A READER CAN ARRIVE AND NOT LEAVE',
  UNSTYLED:    'no amenti.css — it will render in the fallback face and look merely plain',
  UNREACHABLE: 'correct on disk and absent in the world. A DEPLOY failure, not a file failure',
  'NOT A PANE':'present and committed and NOT A PANE. This is the Harbor case',
  'NO READING':'the file it displays is not in this repo — it will show empty glass, correctly',
  GHOST:       'serves but is not in the repo. Something is deployed that nobody can edit',
  MISSING:     'in the registry, nowhere else. The nav points at nothing',
};

console.log(JSON.stringify({
  _: 'GENERATED by probes/probe-panes.mjs — do not edit. Every pane, on disk and in the world.',
  _law: 'It reports STRUCTURE and REACHABILITY. It cannot tell you a pane is telling the truth.',
  _why: 'The Harbor was a Go hello-world for twelve hours and nothing in a fleet built out of instruments noticed.',
  generated: new Date().toISOString(),
  base: BASE,
  worldReachable,
  _worldNote: worldReachable ? null
    : 'NOT ONE PANE SERVED. That is a network or Pages failure, not fifteen broken panes — '
    + 'so the fetch half of every check is SET ASIDE and only the disk half is reported. '
    + 'Reachability is UNKNOWN this run, which is a different answer from BAD.',
  registry: 'fleet-nav.js',
  states: WHY,
  totals,
  panes: rows,
}, null, 2));

/* ── WHAT FAILS THE RUN ───────────────────────────────────────────────────
   A pane that is missing, a pane that is not a pane, a pane that strands its
   reader. UNSTYLED does not fail — it is cosmetic and nine panes carry it
   today; failing on it would make every run red and teach its reader to stop
   looking, which is how a live finding gets lost among the settled ones.
   NO READING does not fail either: empty glass is correct behaviour. */
const bad = totals.missing + totals.notAPane + totals.stranding + totals.unreachable + totals.ghost;
if (!worldReachable) {
  console.error('::warning::not one pane served — reachability UNKNOWN this run, disk checks only');
}
if (bad) process.exitCode = 1;
