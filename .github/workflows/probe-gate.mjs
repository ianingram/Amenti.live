#!/usr/bin/env node
/* ============================================================================
   probes/probe-gate.mjs  ·  Amenti.live
   THE GATE WATCH — does the mirror hold what the ship sent?
   ----------------------------------------------------------------------------
   WHY THIS EXISTS

   "the mirror matches the ship" is one of the eight lies in the handover, and
   the reason it is on that list is precise:

       it was said on a run where EVERY FETCH HAD FAILED.

   Nothing was compared. The absence of a difference was reported as a match.
   That is the shape of the whole disease — a verdict produced by a step that
   never happened.

   So this probe has exactly one law:

       UNREACHABLE IS NOT ABSENT, AND ABSENT IS NOT EQUAL.

   Three outcomes, never collapsed into two. If the mirror could not be read,
   this probe says so and reports NOTHING about any register. It does not fall
   back to "no differences found."

   WHAT IT COMPARES

   Every register the Glass Gate in scan.yml is supposed to carry. For each one:
   the bytes on the ship against the bytes in the mirror, by sha256. Not the
   modification time, not the size — the content. A register that is present,
   same size, and different is the worst case and the one a size check misses.

   WHAT IT DOES NOT CLAIM

   · That a pane RENDERS the register. This reads files, not surfaces.
   · That the reading INSIDE a register is correct. That is each register's own
     probe. This one only asks whether what crossed is what was sent.
   · That the gate RAN. It reports the state of the mirror, which is the result
     of every run so far, not of the last one.

   USAGE
     node probes/probe-gate.mjs --mirror ./mirror
     node probes/probe-gate.mjs --mirror ./mirror --out GATE.json

   Exit 0 when the comparison was made, whatever it found — a finding is the
   output. Exit 1 only when the comparison COULD NOT BE MADE, because a green
   run that compared nothing is the thing this file exists to prevent.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, basename } from 'node:path';

const PROBE = 'probe-gate.mjs';
const VERSION = '1.0.0';

/* ── THE MANIFEST OF THE GATE ────────────────────────────────────────────────
   What scan.yml copies, and where each lives on either side. Keep this in step
   with the Glass Gate step; a register carried but not listed here is a thing
   nobody watches, which is how the Harbor spent twelve hours as a hello-world.

   `required` marks a register whose absence is a fault rather than a note. A
   register that has never been written yet is not a fault — it is a pane
   showing empty glass, correctly. */
const CARRIED = [
  { name: 'fleet-manifest.js', ship: 'fleet-manifest.js', mirror: 'fleet-manifest.js', required: true,  pane: 'the manifest' },
  { name: 'PLATES.json',       ship: 'img/PLATES.json',   mirror: 'PLATES.json',       required: false, pane: 'the Plate Deck' },
  { name: 'VOICE.json',        ship: 'VOICE.json',        mirror: 'VOICE.json',        required: false, pane: 'the voice pane' }
];

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

function readIf(path) {
  try {
    if (!existsSync(path) || !statSync(path).isFile()) return null;
    return readFileSync(path);
  } catch (e) {
    return null;
  }
}

function main(argv) {
  const args = argv.slice(2);
  let mirrorDir = null, outPath = 'GATE.json', shipDir = process.cwd();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mirror') mirrorDir = args[++i];
    else if (args[i] === '--out') outPath = args[++i];
    else if (args[i] === '--ship') shipDir = args[++i];
  }

  const reading = {
    probe: PROBE,
    version: VERSION,
    generated: new Date().toISOString(),
    mirrorDir,
    mirrorReachable: false,
    registers: [],
    findings: [],
    notMeasured: [
      'whether any pane renders these registers — this reads files, not surfaces',
      'whether the reading inside a register is correct — that is each register\'s own probe',
      'whether the gate ran on the last push — this is the state of the mirror, not of one run'
    ]
  };

  /* ── THE FIRST QUESTION, AND IF IT FAILS THERE IS NO SECOND ─────────────── */
  if (!mirrorDir) {
    console.error(`${PROBE}: no --mirror given. NOTHING WAS COMPARED.`);
    reading.findings.push({
      id: 'unreachable', severity: 'blocking',
      detail: 'no mirror directory was given. No register was compared and no verdict below covers anything.'
    });
    writeFileSync(outPath, JSON.stringify(reading, null, 2) + '\n');
    process.exit(1);
  }

  const mdir = resolve(mirrorDir);
  if (!existsSync(mdir) || !statSync(mdir).isDirectory()) {
    console.error(`${PROBE}: the mirror at ${mirrorDir} could not be read. NOTHING WAS COMPARED.`);
    console.error('  This is UNREACHABLE, which is not the same as absent. No claim is made');
    console.error('  about any register. "the mirror matches the ship" was once said on a run');
    console.error('  where every fetch had failed; this probe will not repeat it.');
    reading.findings.push({
      id: 'unreachable', severity: 'blocking',
      detail: `the mirror at ${mirrorDir} is not a readable directory — the clone failed, or the branch is wrong. Fleet-Documents' default branch is named 'branch'; a URL built with 'main' returns 404 and that 404 looks exactly like a missing file. No register was compared.`
    });
    writeFileSync(outPath, JSON.stringify(reading, null, 2) + '\n');
    process.exit(1);
  }
  reading.mirrorReachable = true;

  /* ── THE COMPARISON ─────────────────────────────────────────────────────── */
  for (const r of CARRIED) {
    const onShip = readIf(resolve(shipDir, r.ship));
    const inMirror = readIf(resolve(mdir, r.mirror));

    const row = {
      register: r.name,
      shipPath: r.ship,
      mirrorPath: r.mirror,
      onShip: !!onShip,
      inMirror: !!inMirror,
      shipBytes: onShip ? onShip.length : null,
      mirrorBytes: inMirror ? inMirror.length : null,
      shipSha: onShip ? sha(onShip).slice(0, 16) : null,
      mirrorSha: inMirror ? sha(inMirror).slice(0, 16) : null,
      state: null
    };

    if (!onShip && !inMirror) {
      row.state = 'neither';
      if (r.required) reading.findings.push({
        id: 'missing-both', severity: 'fault', register: r.name,
        detail: `absent on the ship AND in the mirror. ${r.pane} shows empty glass and there is nothing to carry.`
      });
      else reading.findings.push({
        id: 'not-yet-written', severity: 'finding', register: r.name,
        detail: `absent on both sides. Its writer has not run yet, so ${r.pane} shows empty glass — which is the correct failure, not a fault.`
      });
    } else if (onShip && !inMirror) {
      row.state = 'not carried';
      reading.findings.push({
        id: 'not-carried', severity: 'fault', register: r.name,
        detail: `present on the ship (${onShip.length} bytes) and ABSENT from the mirror. The gate has not carried it. ${r.pane} shows empty glass while the reading exists.`
      });
    } else if (!onShip && inMirror) {
      row.state = 'orphan in mirror';
      reading.findings.push({
        id: 'orphan', severity: 'finding', register: r.name,
        detail: `in the mirror (${inMirror.length} bytes) but no longer on the ship. ${r.pane} is showing a reading whose source is gone.`
      });
    } else if (row.shipSha === row.mirrorSha) {
      row.state = 'matches';
      reading.findings.push({
        id: 'matches', severity: 'confirmed', register: r.name,
        detail: `${onShip.length} bytes, sha ${row.shipSha}, identical on both sides. Compared by content, not by size or date.`
      });
    } else {
      row.state = 'differs';
      reading.findings.push({
        id: 'stale', severity: 'fault', register: r.name,
        detail: `present on both sides and DIFFERENT — ship ${onShip.length} bytes / ${row.shipSha}, mirror ${inMirror.length} bytes / ${row.mirrorSha}. ${r.pane} is showing a reading the ship no longer holds. A size check would have missed this if the sizes matched.`
      });
    }

    reading.registers.push(row);
  }

  reading.counts = {
    carried: CARRIED.length,
    matches: reading.registers.filter(r => r.state === 'matches').length,
    differs: reading.registers.filter(r => r.state === 'differs').length,
    notCarried: reading.registers.filter(r => r.state === 'not carried').length,
    faults: reading.findings.filter(f => f.severity === 'fault').length
  };

  writeFileSync(outPath, JSON.stringify(reading, null, 2) + '\n');

  /* read it back — a probe that reports on a file it did not verify is the
     Silent Signature wearing a probe's coat */
  let back;
  try { back = JSON.parse(readFileSync(outPath, 'utf8')); }
  catch (e) { console.error(`${PROBE}: wrote ${outPath} and could not read it back — ${e.message}`); process.exit(1); }

  console.log(`${PROBE} ${VERSION} -> ${outPath}`);
  console.log(`  mirror reachable · ${back.counts.carried} registers · ${back.counts.matches} match · ${back.counts.differs} differ · ${back.counts.notCarried} not carried`);
  console.log('');
  for (const r of back.registers) {
    const s = r.state.toUpperCase().padEnd(17);
    console.log(`  ${s} ${r.register}`);
    console.log(`      ship   ${r.onShip ? r.shipBytes + ' bytes · ' + r.shipSha : '—'}`);
    console.log(`      mirror ${r.inMirror ? r.mirrorBytes + ' bytes · ' + r.mirrorSha : '—'}`);
  }
  console.log('');
  for (const f of back.findings) {
    console.log(`  [${f.severity}] ${f.id}${f.register ? ' · ' + f.register : ''}`);
    console.log(`      ${f.detail}`);
  }
}

main(process.argv);
