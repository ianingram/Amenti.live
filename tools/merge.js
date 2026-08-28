#!/usr/bin/env node
/* ============================================================================
   tools/merge.js  ·  THE RECONCILIATION
   ----------------------------------------------------------------------------
   THE CLAIM meets THE READING. The DIFF is the finding.

       fleet-semantics.js    a human DECLARES     "the Boatswain of the Voice"
       fleet-structure.json  the scanner OBSERVES  "amenti-voice.js declares
                                                    Amenti.voice, loaded at 6036"
                        ↓
       fleet-manifest.js  +  THE DRIFT REPORT

   It does NOT choose a winner. It reports the disagreement.

   ── EVERY ROW CARRIES EXACTLY ONE STAMP ────────────────────────────────────
     CONFIRMED     the claim and the reading agree
     AUTHORED      no probe can check it — and that is fine
     CONTRADICTED  THE READING SAYS OTHERWISE
     UNPROVEN      a fact with NO PROBE BEHIND IT.  The colour of a lie in waiting.
     UNDECLARED    the reading found something NOBODY CLAIMED

   ── AND THE FRONT PAGE IS NOT THE FLEET. IT IS THE DRIFT. ──────────────────
   A manifest that shows itself broken IS NOT BROKEN. IT IS WORKING.
     Green means "I looked, and the claims held."
     Red   means "I LOOKED."
     Silence means nothing was looked at at all — AND SILENCE IS WHAT WE HAD.

   exit 1 on a CONTRADICTION.
   A COMMIT THAT MAKES THE MANIFEST LIE DOES NOT MERGE.

   Usage:  node tools/merge.js [fleet-semantics.js] [fleet-structure.json]
   ============================================================================ */
'use strict';
const fs = require('fs');

const SEM_PATH = process.argv[2] || 'fleet-semantics.js';
const STR_PATH = process.argv[3] || 'fleet-structure.json';

/* ── load ─────────────────────────────────────────────────────────────────── */
if (!fs.existsSync(STR_PATH)) {
  console.error(`MERGE REFUSES: no reading at ${STR_PATH}.\n` +
                `  There is nothing to reconcile the claims AGAINST.\n` +
                `  Run tools/scan.js first. A merge with no reading is just the claims,\n` +
                `  and the claims are exactly what has lied to us every time.`);
  process.exit(2);
}
const structure = JSON.parse(fs.readFileSync(STR_PATH, 'utf8'));

/* THE PATROL READING. What the watch probe last SAW, and when.
   A probe file that exists but has never run is a prayer — so the watches are
   judged on THIS, not on whether probe-watches.mjs is present. Absent or stale
   -> the watch is UNPROVEN, amber, honestly. */
let patrol = null;
try { patrol = JSON.parse(fs.readFileSync('fleet-patrol.json', 'utf8')); } catch (e) {}

/* THE FIRING LOG. What the fleet has actually PUBLISHED — read from the Worker's
   own KV by probes/probe-ordnance.mjs.

   A schedule that nobody checks is a promise nobody keeps. The Docket proclaimed
   itself on time, to a harbour that was not listening — and the only reason
   anybody knows is that a human happened to look at the date. */
let dispatch = null;
try { dispatch = JSON.parse(fs.readFileSync('fleet-dispatch.json', 'utf8')); } catch (e) {}
const PATROL_MAX_H = 26;   // a reading older than this is not a current reading
function patrolFor(id) {
  if (!patrol || !patrol.watches || !patrol.watches[id]) return null;
  const ageH = (Date.now() - Date.parse(patrol.at)) / 36e5;
  return { ...patrol.watches[id], ageH, stale: !(ageH < PATROL_MAX_H) };
}

/* ── THE CLAIMS ARE GUARDED THE WAY THE READING IS ────────────────────────
   The structure file above gets a clear MERGE REFUSES if it is missing. The
   semantics file used to go straight into new Function(), and that asymmetry
   cost four days.

   ON 24 AUGUST 2026 fleet-semantics.js was overwritten wholesale with the
   contents of SOURCES.semantics.json — two registers, similar names, one paste
   into the wrong editor tab. From then on this line threw a raw Node
   SyntaxError:

       SyntaxError: Unexpected token ':'
         at new Function (<anonymous>)
         at merge.js:72

   and because the workflow runs this step with continue-on-error, the message
   was collapsed in the UI. The gate downstream fires on `notwired != 0 OR
   merge failed` and prints ONLY the NOT WIRED text — so for four days every
   run reported a script-tag ordering bug that did not exist, while the real
   fault sat one collapsed section away. The manifest froze at 90 hours old and
   every pane showed the last good reading from the 25th.

   THAT IS RULE 2 OF THE PROBE CORPS — attribute, never infer — broken by the
   instrument that exists to enforce it.

   So: the file must exist, it must parse, and it must set the global. Each
   failure says which, and each says it in this tool's own voice rather than
   Node's. */
if (!fs.existsSync(SEM_PATH)) {
  console.error(`MERGE REFUSES: no claims at ${SEM_PATH}.\n` +
                `  There is nothing to reconcile AGAINST the reading.\n` +
                `  This is the AUTHORED half — a human writes it and no machine can.`);
  process.exit(2);
}

const win = {};
try {
  new Function('window', fs.readFileSync(SEM_PATH, 'utf8'))(win);
} catch (e) {
  const head = fs.readFileSync(SEM_PATH, 'utf8').slice(0, 80).replace(/\s+/g, ' ');
  console.error(`MERGE REFUSES: ${SEM_PATH} would not parse as JavaScript.\n` +
                `  ${e && e.message}\n` +
                `  it begins: ${head}\n` +
                (/^\s*\{\s*"/.test(fs.readFileSync(SEM_PATH, 'utf8'))
                  ? `  THAT IS JSON, NOT JAVASCRIPT. This file must be a SCRIPT that sets\n` +
                    `  window.FLEET_SEMANTICS. A bare JSON object is almost certainly\n` +
                    `  SOURCES.semantics.json pasted over the wrong file — it happened on\n` +
                    `  24 Aug 2026 and cost four days of stale manifest.\n`
                  : '') +
                `  Restore it from git history; the last good copy is one commit back.`);
  process.exit(2);
}

const S = win.FLEET_SEMANTICS;
if (!S) {
  console.error(`MERGE REFUSES: ${SEM_PATH} parsed but did not set window.FLEET_SEMANTICS.\n` +
                `  The file ran and claimed nothing. Check that it still ends with the\n` +
                `  assignment, and that nothing above it threw first.`);
  process.exit(2);
}

/* ── index the reading ────────────────────────────────────────────────────── */
const seen       = new Map(structure.files.map(f => [f.file, f]));
const loadedBy   = {};                       // file -> [pages that load it]
const declaredBy = {};                       // global -> [files that declare it]
const usedGlobal = new Set();

for (const f of structure.files) {
  for (const g of f.declares) (declaredBy[g] ||= []).push(f.file);
  for (const c of f.calls)    usedGlobal.add(c.global);
  for (const l of (f.loads || [])) (loadedBy[l.file] ||= []).push(f.file);
}

const drift = [];
const row = (stamp, subject, claim, reading, note) =>
  ({ stamp, subject, claim, reading, note });

const push = (r) => { drift.push(r); return r; };

/* ── SHIPS + CREW: does the file exist? is it loaded? is anything calling it? ─ */
function reconcileFile(entry, group) {
  const f = seen.get(entry.file);
  const out = { ...entry, group, stamps: [] };

  if (!f) {
    out.stamps.push('CONTRADICTED');
    push(row('CONTRADICTED', entry.file,
      `declared as "${entry.name}"`,
      'NOT IN THE REPO',
      'A ship on the roll that never sailed. amenti-worker-listen.js was on the old manifest for months.'));
    return out;
  }

  out.bytes = f.bytes;
  out.sha256 = f.sha256;
  out.declares = f.declares;
  out.loadedBy = loadedBy[entry.file] || [];

  /* SPEC files must NOT be loaded. */
  if (entry.spec) {
    if (out.loadedBy.length) {
      out.stamps.push('CONTRADICTED');
      push(row('CONTRADICTED', entry.file,
        'a SPEC — it must not be loaded',
        `LOADED BY ${out.loadedBy.join(', ')}`,
        'A spec written in the present tense, shipped to every visitor, with zero callers. ' +
        'That is how it cost an entire design session.'));
    } else {
      out.stamps.push('CONFIRMED');
    }
    return out;
  }

  /* RETIRED files should be in the repo (the rollback) but NOT loaded. */
  if (entry.retired) {
    out.stamps.push(out.loadedBy.length ? 'CONTRADICTED' : 'CONFIRMED');
    if (out.loadedBy.length) {
      push(row('CONTRADICTED', entry.file,
        'retired — kept as the rollback, not loaded',
        `STILL LOADED BY ${out.loadedBy.join(', ')}`, ''));
    }
    return out;
  }

  /* Crew that is loaded but whose globals NOTHING calls. */
  if (group === 'crew') {
    const NS = /^(Amenti|Sovereign|window)$/;
    const orphans = (f.declares || []).filter(g => !NS.test(g) && !usedGlobal.has(g));
    if (out.loadedBy.length && orphans.length) {
      out.stamps.push('ADRIFT');
      push(row('ADRIFT', entry.file,
        `"${entry.name}" — crew`,
        `loaded, and NOTHING CALLS ${orphans.join(', ')}`,
        'Shipped weight — and it will mislead the next reader into thinking it does something.'));
    } else {
      out.stamps.push('CONFIRMED');
    }
  } else {
    out.stamps.push('CONFIRMED');
  }
  return out;
}

const ships = S.ships.map(s => reconcileFile(s, 'ships'));
const crew  = S.crew.map(c  => reconcileFile(c, 'crew'));

/* ── UNDECLARED: the reading found something nobody claimed ────────────────── */
const claimed = new Set([...S.ships, ...S.crew].map(x => x.file));
for (const f of structure.files) {
  if (claimed.has(f.file)) continue;
  if (/^(fleet-|tools\/|probe)/.test(f.file)) continue;     // the instruments describe themselves
  push(row('UNDECLARED', f.file,
    '— nothing claims it —',
    `in the repo${(loadedBy[f.file] || []).length ? ', LOADED by ' + loadedBy[f.file].join(', ') : ''}`,
    'A file aboard that no manifest names. Six of these were invisible to every view.'));
}

/* ── THE WIRING. THIS IS THE ONE THAT COST US THE MOST. ────────────────────── */
for (const f of (structure.findings.wiring || [])) {
  if (f.kind === 'NOT WIRED') {
    push(row('CONTRADICTED', f.page,
      `${f.global} is available to this page`,
      `CALLED at line ${f.calledAtLine}, LOADED at line ${f.loadedAtLine} — ${f.gap} LINES TOO LATE`,
      'THE TERMINAL BUG. The guard fails silently, the caller gets undefined, and the code ' +
      'quietly takes a fallback nobody is watching. Move the script tag ABOVE the caller.'));
  } else {
    push(row('CONTRADICTED', f.page,
      `${f.global} is provided by something`,
      f.kind === 'STOWAWAY' ? 'NO FILE IN THE REPO DECLARES IT' : 'the page never loads its file',
      'A call into the void. It has been failing silently.'));
  }
}

/* ── THE WATCHES. A THREAT NEEDS AN INSTRUMENT. ────────────────────────────── */
const watches = S.watches.map(w => {
  const out = { ...w };
  const p = patrolFor(w.id);

  if (p && !p.stale && p.status === 'OK') {
    /* A recent patrol looked, and the ward held. THIS is a proven watch. */
    out.stamp = 'CONFIRMED';
    out.patrol = { at: patrol.at, status: p.status, note: p.note };
  } else if (p && !p.stale && p.status === 'FAIL') {
    /* A recent patrol looked, and found a HOLE. Not drift — a real finding. */
    out.stamp = 'CONTRADICTED';
    out.patrol = { at: patrol.at, status: p.status, note: p.note };
    push(row('CONTRADICTED', w.id,
      `guards: ${w.guards}`,
      'THE PATROL FOUND A HOLE: ' + p.note,
      'This is not a documentation drift. It is a live security finding. Close it in the ship.'));
  } else if (p && p.stale) {
    out.stamp = 'UNPROVEN';
    push(row('UNPROVEN', w.id,
      `last patrol: ${Math.round(p.ageH)}h ago (status ${p.status})`,
      'THE PATROL IS STALE',
      'A reading older than ' + PATROL_MAX_H + 'h is not a current reading. ' +
      '"I have a reading" and "I have a CURRENT reading" are not the same claim.'));
  } else if (p && p.status === 'WARN') {
    out.stamp = 'UNPROVEN';
    push(row('UNPROVEN', w.id,
      `guards: ${w.guards}`,
      'THE PATROL COULD NOT PROVE IT: ' + p.note,
      'The instrument ran but returned WARN — it could not reach, or is a stub. Amber, honestly.'));
  } else {
    /* No patrol record at all for this watch. */
    out.stamp = 'UNPROVEN';
    push(row('UNPROVEN', w.id,
      `guards: ${w.guards}`,
      w.probe ? 'the probe exists, but NO PATROL HAS RUN' : 'NO PROBE, NO PATROL',
      'A probe that has never run is a prayer. The old manifest showed this GREEN for months ' +
      'with nothing behind it — manufacturing confidence that nobody had earned.'));
  }
  return out;
});

/* ── THE ENGINES. IS THE CAPABILITY WHOLE? ─────────────────────────────────── */
const engines = S.engines.map(e => {
  const out = { ...e, stamps: [] };
  if (e.undefined) { out.stamp = 'UNDEFINED'; return out; }

  const missing = (e.members || []).filter(m => !seen.has(m));
  if (missing.length) {
    out.stamp = 'CONTRADICTED';
    push(row('CONTRADICTED', e.name,
      `members: ${(e.members || []).join(', ')}`,
      `MISSING FROM THE REPO: ${missing.join(', ')}`, ''));
    return out;
  }

  /* An invariant with no probe is a prayer. */
  const prayers = (e.invariants || []).filter(i => !i.probe || !fs.existsSync(i.probe.split(/\s+\+\s+/)[0].trim()));
  out.invariants = (e.invariants || []).map(i => {
    const first = i.probe ? i.probe.split(/\s+\+\s+/)[0].trim() : null;
    const ok = first && fs.existsSync(first);
    if (!ok) {
      push(row('UNPROVEN', e.name,
        i.claim,
        i.probe ? `probe named but NOT IN THE TREE: ${i.probe}` : 'NO PROBE',
        'AN INVARIANT WITH NO PROBE IS A PRAYER. ' + (i.cost || '')));
    }
    return { ...i, stamp: ok ? 'CONFIRMED' : 'UNPROVEN' };
  });

  out.stamp = prayers.length ? 'UNPROVEN' : 'CONFIRMED';
  return out;
});

/* ── THE TUBES. A schedule that never fires is a promise nobody keeps. ─────── */
if (dispatch && dispatch.tubes) {
  for (const t of Object.values(dispatch.tubes)) {
    if (t.status === 'FAIL') {
      push(row('UNPROVEN', t.id,
        `a ${t.cadence || 'scheduled'} dispatch`,
        'NOTHING HAS EVER FIRED FROM THIS TUBE',
        t.note || ''));
    } else if (t.missedLast14 && t.missedLast14.length) {
      push(row('UNPROVEN', t.id,
        `fires ${t.cadence}`,
        `MISSED ${t.missedLast14.length} of the last 14 days`,
        'The tube is loaded and the schedule is set. It simply did not fire.'));
    } else if (t.missedLast8 && t.missedLast8.length) {
      push(row('UNPROVEN', t.id,
        `fires ${t.cadence}`,
        `MISSED ${t.missedLast8.length} of the last 8 weeks`, ''));
    }
  }
} else {
  push(row('UNPROVEN', 'THE ORDNANCE BAY',
    'four tubes publish from this ship',
    'NOBODY HAS WALKED THE TUBES',
    'No firing log. What went out, what is loaded, and what was MISSED — all unknown. ' +
    'Run probes/probe-ordnance.mjs.'));
}

/* ── EMIT ─────────────────────────────────────────────────────────────────── */
const counts = drift.reduce((a, d) => (a[d.stamp] = (a[d.stamp] || 0) + 1, a), {});
const contradicted = counts.CONTRADICTED || 0;

const manifest = {
  meta: {
    ...S.meta,
    merged:   new Date().toISOString(),
    reading:  structure.meta.generated,
    scanner:  structure.meta.scanner,
    semantics: S.__v,
    note: 'THE RECONCILIATION. Claims from fleet-semantics.js, reading from fleet-structure.json. ' +
          'NOTHING HERE WAS TYPED BY HAND. If a pane disagrees with this file, the pane is broken.',
  },
  health: {
    contradicted,
    unproven:   counts.UNPROVEN || 0,
    undeclared: counts.UNDECLARED || 0,
    adrift:     counts.ADRIFT || 0,
    clean:      contradicted === 0,
  },
  drift,
  dispatch,                       // the firing log — null if nothing has walked the tubes
  ships, crew, watches, engines,
  satellites: S.satellites,
  doctrine: S.doctrine,
};

fs.writeFileSync('fleet-manifest.js',
  '/* GENERATED by tools/merge.js. DO NOT EDIT.\n' +
  '   The truth lives in the ship. This is a reflection.\n' +
  '   Edit fleet-semantics.js (the claims) or fix the code (the truth). */\n' +
  'window.FLEET_MANIFEST = ' + JSON.stringify(manifest, null, 2) + ';\n');

/* ── SAY IT ALOUD ─────────────────────────────────────────────────────────── */
const C = { CONTRADICTED: '\x1b[31m', UNPROVEN: '\x1b[33m', UNDECLARED: '\x1b[33m', ADRIFT: '\x1b[33m' };
const O = '\x1b[0m';

console.log('');
console.log(`  reading taken  ${structure.meta.generated}`);
console.log(`  claims         fleet-semantics.js ${S.__v}`);
console.log('');
console.log('  ═══ THE DRIFT ═══');
console.log('');
if (!drift.length) {
  console.log('  \x1b[32m✓ NO DRIFT. Every claim held.\x1b[0m');
} else {
  for (const d of drift) {
    console.log(`  ${C[d.stamp] || ''}${d.stamp}${O}  ${d.subject}`);
    console.log(`      claimed : ${d.claim}`);
    console.log(`      observed: ${C[d.stamp] || ''}${d.reading}${O}`);
    if (d.note) console.log(`      ${'\x1b[2m'}${d.note}${O}`);
    console.log('');
  }
}
console.log(`  CONTRADICTED ${contradicted}  ·  UNPROVEN ${counts.UNPROVEN || 0}  ·  ` +
            `UNDECLARED ${counts.UNDECLARED || 0}  ·  ADRIFT ${counts.ADRIFT || 0}`);
console.log('');
console.log('  fleet-manifest.js written.');

if (contradicted) {
  console.log('');
  console.log('  \x1b[31m══════════════════════════════════════════════════════\x1b[0m');
  console.log('  \x1b[31m   THE MANIFEST CONTRADICTS THE SHIP.\x1b[0m');
  console.log('');
  console.log('     Either the code is wrong, or the claim is.');
  console.log('     FIX ONE. Do not paint the mirror.');
  console.log('  \x1b[31m══════════════════════════════════════════════════════\x1b[0m');
  console.log('');
  process.exit(1);
}
