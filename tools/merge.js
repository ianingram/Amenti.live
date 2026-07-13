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

const win = {};
new Function('window', fs.readFileSync(SEM_PATH, 'utf8'))(win);
const S = win.FLEET_SEMANTICS;
if (!S) { console.error('MERGE REFUSES: fleet-semantics.js did not set window.FLEET_SEMANTICS'); process.exit(2); }

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
  if (!w.probe) {
    out.stamp = 'UNPROVEN';
    push(row('UNPROVEN', w.id,
      `guards: ${w.guards}`,
      'NO PROBE EXISTS',
      'The old manifest showed DATA WATCH green for months with nothing behind it. ' +
      'It was manufacturing confidence that nobody had earned. ' +
      'A watch that reports green with no instrument is worse than no watch at all.'));
  } else if (!fs.existsSync(w.probe)) {
    out.stamp = 'CONTRADICTED';
    push(row('CONTRADICTED', w.id,
      `probe: ${w.probe}`,
      'THAT PROBE FILE IS NOT IN THE TREE',
      'The instrument is named and absent. That is worse than naming none.'));
  } else {
    out.stamp = 'CONFIRMED';
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
