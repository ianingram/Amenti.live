#!/usr/bin/env node
/* ============================================================================
   probes/probe-engine.mjs  ·  Amenti.live
   THE ENGINE GUARD — is the voice platform still the voice platform?
   ----------------------------------------------------------------------------
   WHY THIS EXISTS

   At approximately 02:05 on 20 August 2026, amenti-voice.js was replaced with
   the contents of VOICE.json. 644 lines of engine became 1,624 lines of JSON.
   The commit was signed and Verified, and its message read:

       "Update print statement from 'Hello' to 'Goodbye'"

   — describing work with no relation to either file. The signature attested
   that the captain made the change. It did not attest that the change was what
   the message said. Nothing else noticed. It was found by opening the file.

   The file already carried one of the best headers in the fleet: a rule, an
   ownership line, and forty lines on why the engine exists and what changing it
   costs. All of it was overwritten. A WARNING ONLY WORKS ON SOMEBODY WHO IS
   READING, and at two in the morning the captain was pasting.

   So this probe does the part a banner cannot.

   WHAT IT CHECKS — SHAPE, NOT CONTENT

   Not "did anything change". These files are edited legitimately and often, and
   a guard that goes red on honest work is a guard that gets ignored — the same
   disease as a register that cries fault on a documented ruling. It asks only
   whether each file is STILL ITSELF:

     · does it still parse as JavaScript
     · does it still declare the profile table
     · does it still define the brake
     · does it still compose the locked style
     · is it still roughly the size it was

   Any one of those failing means the file has stopped being the voice platform,
   whatever its name still says.

   WHAT IT MUST NOT CLAIM

     · That the engine WORKS. It reads shape. It does not run a single line.
     · That an edit is WRONG. A file can pass every check here and still be a
       bad change. This is a smoke alarm, not a reviewer.
     · ANYTHING about a file it could not open. A missing watched file is a
       FAULT and is named as one — never silence.

   USAGE
     node probes/probe-engine.mjs
     node probes/probe-engine.mjs --out ENGINE.json

   Exit 1 when a watched file has stopped being itself, so the run goes red and
   the damage is impossible to miss. Exit 0 otherwise.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const PROBE = 'probe-engine.mjs';
const VERSION = '1.0.0';

/* ── THE WATCH LIST ──────────────────────────────────────────────────────────
   Only the platform. Page1.html and Page2.html are DELIBERATELY ABSENT: the
   captain edits both continuously, and a guard that fires on active work is
   noise. They are read by probe-voice.mjs instead, which reports their wiring
   without objecting to their changing.

   `floor` is a line count, not a size in bytes — a floor low enough that real
   edits never reach it and a truncation or a wholesale replacement always does.
   amenti-voice.js stood at 644 lines when this was written. */
const WATCHED = [
  {
    file: 'amenti-voice.js',
    floor: 400,
    what: 'THE VOICE PLATFORM — one TTS engine, one chunker, one cache key',
    must: [
      { id: 'is javascript',    re: /^\s*\/\*|^\s*\(function|^\s*['"]use strict/m,
        why: 'the file does not begin as JavaScript. On 20 Aug it began with `{` because it had become a JSON register.' },
      { id: 'profile table',    re: /\bPROFILES\s*=\s*\{[^}]*\brecital\s*:\s*\d+/,
        why: 'PROFILES is gone. The chunk profiles ARE the cache namespace, and probe-voice measures every surface against this table. Without it every declared boundary reads as drift.' },
      { id: 'the brake',        re: /\bfunction\s+stopReading\s*\(/,
        why: 'stopReading is gone. It aborts in-flight fetches and kills scheduled sources, and all three facades hang off it. Without it the figure cannot be interrupted.' },
      { id: 'the locked style', re: /\bfunction\s+composeStyle\s*\(/,
        why: 'composeStyle is gone. STYLE is an input to the cache key; the archive is keyed on the exact string this function builds.' },
      { id: 'the entry point',  re: /\bfunction\s+speak\s*\(/,
        why: 'speak() is gone. It is the one entry point every facade calls.' },
      { id: 'the facades',      re: /Amenti\.throttle\s*=|Amenti\.conversation\s*=/,
        why: 'the facades are gone. Page1 has call sites on both, and nothing is renamed until every caller has been grepped.' }
    ]
  },
  {
    file: 'amenti-core.bundle.js',
    /* The bundle is a concatenation of the core files and runs to several
       thousand lines — Amenti.chat registers at 3473 in the copy read on
       20 Aug. The floor is set FAR below that on purpose: it is generated, so
       its length moves with every source change, and a floor set near the true
       size would fire on honest rebuilds. 1000 is low enough never to catch a
       real bundle and high enough to catch a truncation or a replacement. */
    floor: 1000,
    what: 'the generated bundle — the only file Page1 loads for the platform',
    must: [
      { id: 'is javascript',    re: /^\s*\/\*|^\s*\(function|^\s*['"]use strict/m,
        why: 'the bundle does not begin as JavaScript.' },
      { id: 'carries the platform', re: /\bPROFILES\s*=\s*\{[^}]*\brecital\s*:\s*\d+/,
        why: 'the bundle no longer carries the voice platform. Page1 loads THIS file, not amenti-voice.js — repairing the source without rebuilding the bundle changes nothing on the surface.' },
      { id: 'the brake',        re: /\bfunction\s+stopReading\s*\(/,
        why: 'the bundle carries no brake.' },
      { id: 'the entry point',  re: /\bfunction\s+speak\s*\(/,
        why: 'the bundle carries no speak().' }
    ]
  }
];

function main(argv) {
  const args = argv.slice(2);
  let outPath = 'ENGINE.json';
  for (let i = 0; i < args.length; i++) if (args[i] === '--out') outPath = args[++i];

  const reading = {
    probe: PROBE,
    version: VERSION,
    generated: new Date().toISOString(),
    watched: [],
    findings: [],
    notMeasured: [
      'whether the engine works — this reads shape and runs no line of it',
      'whether an edit is correct — a file can pass every check and still be a bad change',
      'the surfaces — Page1 and Page2 are edited continuously and are deliberately not watched here'
    ]
  };

  for (const w of WATCHED) {
    const path = resolve(process.cwd(), w.file);
    const row = { file: w.file, what: w.what, present: false, lines: null, bytes: null, sha256: null, checks: [] };

    if (!existsSync(path) || !statSync(path).isFile()) {
      row.present = false;
      reading.findings.push({
        id: 'missing', severity: 'fault', file: w.file,
        detail: `${w.file} is not on disk. This is the file Page1 loads. A watched file that vanished is a fault, never a silence.`
      });
      reading.watched.push(row);
      continue;
    }

    const raw = readFileSync(path, 'utf8');
    row.present = true;
    row.bytes = Buffer.byteLength(raw);
    row.lines = raw.split('\n').length;
    row.sha256 = createHash('sha256').update(raw).digest('hex').slice(0, 16);

    /* the floor. A real edit does not halve a file. A paste does. */
    if (row.lines < w.floor) {
      reading.findings.push({
        id: 'truncated', severity: 'fault', file: w.file,
        detail: `${row.lines} lines, below the floor of ${w.floor}. The file has been truncated or replaced wholesale. It is not an edit.`
      });
    }

    for (const m of w.must) {
      const ok = m.re.test(raw);
      row.checks.push({ id: m.id, ok });
      if (!ok) reading.findings.push({
        id: 'shape', severity: 'fault', file: w.file, check: m.id,
        detail: `${w.file} no longer has ${m.id}. ${m.why}`
      });
    }

    if (row.checks.every(c => c.ok) && row.lines >= w.floor) {
      reading.findings.push({
        id: 'intact', severity: 'confirmed', file: w.file,
        detail: `${row.lines} lines, ${row.bytes} bytes, sha ${row.sha256}. Every shape check holds: ${row.checks.map(c => c.id).join(', ')}.`
      });
    }

    reading.watched.push(row);
  }

  reading.counts = {
    watched: WATCHED.length,
    intact: reading.findings.filter(f => f.id === 'intact').length,
    faults: reading.findings.filter(f => f.severity === 'fault').length
  };

  writeFileSync(outPath, JSON.stringify(reading, null, 2) + '\n');

  /* read it back — a probe that reports on a file it did not verify is the
     Silent Signature wearing a probe's coat */
  let back;
  try { back = JSON.parse(readFileSync(outPath, 'utf8')); }
  catch (e) { console.error(`${PROBE}: wrote ${outPath} and could not read it back — ${e.message}`); process.exit(1); }

  console.log(`${PROBE} ${VERSION} -> ${outPath}`);
  console.log(`  ${back.counts.watched} watched · ${back.counts.intact} intact · ${back.counts.faults} faults`);
  console.log('');
  for (const r of back.watched) {
    console.log(`  ${r.present ? String(r.lines).padStart(5) + ' lines · ' + r.sha256 : '  ABSENT'}  ${r.file}`);
    for (const c of r.checks) console.log(`        ${c.ok ? 'ok  ' : 'GONE'}  ${c.id}`);
  }
  console.log('');
  for (const f of back.findings) {
    console.log(`  [${f.severity}] ${f.id} · ${f.file}`);
    console.log(`      ${f.detail}`);
  }

  if (back.counts.faults) {
    console.log('');
    console.log('  A WATCHED FILE HAS STOPPED BEING ITSELF.');
    console.log('  Recover it from history rather than retyping it: open the last good');
    console.log('  commit, use the BLOB view (not the diff view — a diff cannot produce a');
    console.log('  usable file), Raw, then paste over the current contents.');
    process.exit(1);
  }
}

main(process.argv);
