#!/usr/bin/env node
/* ============================================================================
   tools/plates.js — the plate register
   ----------------------------------------------------------------------------
   Walks img/ and emits img/PLATES.json: every plate, what is known about it,
   and — the part that did not exist before — a per-key index of which variants
   each figure has.

   IT DOES NOT WRITE img/MANIFEST.json. That file belongs to the Python art
   pipeline and is read at runtime by amenti-diagnose.js. This one reads it for
   provenance and publishes a DERIVED register beside it. Provenance has one
   owner; the index is a reflection of it.

     node tools/plates.js            # write the manifest
     node tools/plates.js --check    # report only, write nothing, exit 1 on gaps

   WHY THIS EXISTS
     img/MANIFEST.json covers 46 files. There are 164. The
     other 118 have no provenance at all — no model, no seed, no crop note, no
     colour audit. Worse, the file was a flat map of FILENAMES, so the question
     any surface actually asks — "does this figure have a terminal plate?" —
     could only be answered by scanning the directory.

   WHAT IS PRESERVED, AND WHY IT MATTERS
     Every existing entry is carried forward BYTE FOR BYTE. Those records hold
     things that cannot be recovered by looking at a file: which candidate of
     four was chosen and why, the seed, the crop, whether the seed was ever
     confirmed. A generator that regenerated them from scratch would silently
     destroy the only copy. New files get a stub marked `provenance: null`,
     which is an honest "not recorded" rather than a fabricated entry.

   THE COUNTS ARE OBSERVED, NEVER ASSUMED
     A figure is not "complete" because the totals happen to match. Each variant
     is checked per key. Equal counts across two lists is not the same as the
     same fifty-one keys appearing on both, and that distinction has already
     cost this project once.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT     = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const IMG      = path.join(ROOT, 'img');
const LIBRARY  = path.join(ROOT, 'library');
/* NOT img/MANIFEST.json. That file is a WRITE TARGET for the Python art
   pipeline — provenance.py, seed.py, seeds_scan.py, ingest.py and
   apply_art_session.py all write to it, and amenti-diagnose.js reads it at
   runtime. Adding a sixth hand to a shared file to publish a DERIVED index is
   how provenance gets lost. This reads MANIFEST and never writes it. */
const SRC      = path.join(IMG, 'MANIFEST.json');
const OUT      = path.join(IMG, 'PLATES.json');
const CHECK    = process.argv.includes('--check');

/* THERE IS NO codex VARIANT, AND THERE WAS NEVER MEANT TO BE ONE.
   An earlier cut of this file listed `codex` as a required fourth variant and
   duly reported 0 of 51 — a gap that existed only because the checker had
   invented the thing it was checking for. amenti-art-photo.js settles it at
   line 213: "The codex gets the TERMINAL plate, not the card. It has the room
   for one." The codex surface reuses terminal. Three variants, not four.

   A register that measures the system against a spec nobody wrote will report
   failures that are its own. */
const VARIANTS = {
  card:     { multiple: false, required: true,  note: 'the face. roster, dispatch lead, atlantica lead' },
  thumb:    { multiple: false, required: true,  note: 'small and dense. lists, related, search' },
  terminal: { multiple: true,  required: true,  note: 'wide. also what the CODEX surface renders. grows over time.' },
  chat:     { multiple: true,  required: false, note: 'incidental' },
};

const PLATE = new RegExp(
  '^(.*?)-(' + Object.keys(VARIANTS).join('|') + ')(?:-(\\d+))?\\.(jpg|jpeg|png|webp)$', 'i');

function die(m){ console.error('REFUSES: ' + m); process.exit(2); }

/* ── READ WHAT IS ALREADY KNOWN ───────────────────────────────────────────
   If the existing manifest cannot be parsed we STOP rather than overwrite it.
   A generator that clobbers unrecoverable provenance because a brace was
   missing is worse than one that does nothing. */
let prior = {};
if (fs.existsSync(SRC)) {
  try {
    prior = (JSON.parse(fs.readFileSync(SRC, 'utf8')) || {}).images || {};
  } catch (e) {
    die('img/MANIFEST.json does not parse (' + e.message + '). It holds seeds '
      + 'and crop notes that exist nowhere else, so this script stops rather '
      + 'than publishing a register that silently drops them.');
  }
}

if (!fs.existsSync(IMG)) die('no img/ directory at ' + path.resolve(IMG));

const files = fs.readdirSync(IMG)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort();

if (!files.length) die('img/ holds no images. An empty register is not a clean one.');

/* rooms, so a plate with no room and a room with no plate both surface */
let rooms = [];
if (fs.existsSync(LIBRARY)) {
  rooms = fs.readdirSync(LIBRARY)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

/* ── WALK ─────────────────────────────────────────────────────────────── */
const images = {};
const keys   = {};
const loose  = [];   // hero-bg, counsel-bg, book covers — not figure plates

for (const file of files) {
  const m = PLATE.exec(file);
  if (!m) { loose.push(file); continue; }

  const key = m[1], variant = m[2].toLowerCase(), n = m[3] ? Number(m[3]) : 1;
  const stat = fs.statSync(path.join(IMG, file));

  /* CARRY THE OLD RECORD FORWARD UNTOUCHED. Only size and mtime are refreshed,
     because those are facts about the file rather than about the making of it. */
  const was = prior[file];
  images[file] = was
    ? Object.assign({}, was, { key, surface_slug: variant, bytes: stat.size })
    : { key, surface_slug: variant, file, bytes: stat.size,
        /* null, not {} — "nobody recorded this" reads differently from
           "recorded as empty", and only one of them is true */
        provenance: null };

  if (!keys[key]) keys[key] = { key, variants: {}, room: false, complete: false };
  if (!keys[key].variants[variant]) keys[key].variants[variant] = [];
  keys[key].variants[variant].push({ file, n });
}

/* ── RECONCILE AGAINST THE LIBRARY ────────────────────────────────────── */
for (const k of Object.keys(keys)) keys[k].room = rooms.indexOf(k) > -1;
const roomsNoPlate = rooms.filter(r => !keys[r]);
const platesNoRoom = Object.keys(keys).filter(k => !keys[k].room).sort();

/* a figure is complete when it holds every REQUIRED variant — checked one key
   at a time. Totals matching across variants proves nothing about whether the
   same figures appear in each. */
const required = Object.keys(VARIANTS).filter(v => VARIANTS[v].required);
const gaps = {};
for (const k of Object.keys(keys)) {
  const missing = required.filter(v => !keys[k].variants[v]);
  keys[k].complete = missing.length === 0;
  keys[k].missing  = missing;
  missing.forEach(v => { (gaps[v] = gaps[v] || []).push(k); });
}

const tally = {};
for (const v of Object.keys(VARIANTS)) {
  tally[v] = Object.keys(keys).filter(k => keys[k].variants[v]).length;
}

const out = {
  deck: 'Amenti',
  generated: new Date().toISOString(),
  generator: 'tools/plates.js',
  /* the schema, stated in the file, so a reader need not infer it */
  variants: VARIANTS,
  totals: {
    files: files.length,
    plates: Object.keys(images).length,
    keys: Object.keys(keys).length,
    rooms: rooms.length,
    byVariant: tally,
    complete: Object.keys(keys).filter(k => keys[k].complete).length,
    provenanced: Object.keys(images).filter(f => images[f].provenance !== null
                                             || images[f].model).length,
  },
  gaps: {
    missingByVariant: gaps,
    roomsWithoutPlates: roomsNoPlate,
    platesWithoutRooms: platesNoRoom,
    notPlates: loose,
  },
  keys,
  images,
};

/* ── REPORT ───────────────────────────────────────────────────────────── */
const T = out.totals;
console.log('plates    ' + T.plates + ' across ' + T.keys + ' keys  ('
          + loose.length + ' non-plate files ignored)');
console.log('provenance ' + T.provenanced + ' of ' + T.plates
          + ' — the rest carry provenance:null, which is honest, not empty');
console.log('');
for (const v of Object.keys(VARIANTS)) {
  console.log('  ' + v.padEnd(9) + String(tally[v]).padStart(3) + ' / ' + T.keys
            + (VARIANTS[v].required ? '' : '   (optional)'));
}
console.log('');
console.log('complete  ' + T.complete + ' of ' + T.keys + ' keys hold every required variant');
for (const v of Object.keys(gaps)) {
  console.log('  no ' + v + ': ' + gaps[v].length
            + (gaps[v].length <= 8 ? '  ' + gaps[v].join(', ') : ''));
}
if (roomsNoPlate.length) console.log('room, no plate : ' + roomsNoPlate.join(', '));
if (platesNoRoom.length) console.log('plate, no room : ' + platesNoRoom.join(', '));

if (CHECK) {
  const bad = T.complete !== T.keys || roomsNoPlate.length || platesNoRoom.length;
  console.log('\n--check: ' + (bad ? 'GAPS ABOVE' : 'clean') + ', nothing written');
  process.exit(bad ? 1 : 0);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log('\nwrote ' + OUT);
