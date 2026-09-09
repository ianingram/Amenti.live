#!/usr/bin/env node
/* ============================================================================
   probes/probe-hall.mjs  ·  THE HALL'S COUNTS
   ----------------------------------------------------------------------------
   Reads the registers and writes HALL-STATE.json: every number the hall is
   allowed to say, ~600 bytes, taken at the hour of writing.

     node probes/probe-hall.mjs            # write HALL-STATE.json
     node probes/probe-hall.mjs --check    # report only

   ── WHY A FILE AND NOT FIVE FETCHES AT QUERY TIME ─────────────────────────
   names.csv is 548 KB and PLATES.json is 127 KB. Counting them per question is
   seconds of latency for numbers that change weekly. This counts once; the
   hall reads ~600 bytes.

   ── EMPTY GLASS ───────────────────────────────────────────────────────────
   HALL.md holds the meaning and NO numbers. This file holds the numbers and
   no meaning. If a register cannot be read, its count is NULL and the hall
   says the count could not be read — it does not quote the last good number.
   A count that is silently stale is the fault this place was built to refuse.

   ── AND THE HALL MUST KNOW WHAT IS HAPPENING IN THE MAP ROOM ──────────────
   Added 9 September 2026. The hall could say how many souls and how many
   reading rooms and knew NOTHING of the ground — not that there are fifteen
   frames, not that Attica holds 1,655 drawable places, not that 91 of them
   are unplaced, not that three tours exist.

   That was not an oversight in the hall. IT IS THE ONLY WAY THE HALL CAN KNOW
   ANYTHING: HALL.md holds the meaning and no numbers, this file holds the
   numbers and no meaning, and a number that is in neither cannot be spoken.
   The map room existed for three days outside that arrangement.

   The frame counts below are read from the registers themselves rather than
   from FRAMES.csv's `places` column, WHICH IS A NOTE AND NOT A COUNT — it was
   measured on 9 September and will drift the first time the gazetteer is
   re-harvested. The hall states what is on disk now.

   THIS WRITES NOTHING BUT HALL-STATE.json. It is a reading.
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const OUT   = path.join(ROOT, 'HALL-STATE.json');
const CHECK = process.argv.includes('--check');

const say = m => console.log(m);
const failed = [];

function read(rel, asJson) {
  const p = path.join(ROOT, rel);
  try {
    const t = fs.readFileSync(p, 'utf8');
    return asJson ? JSON.parse(t) : t;
  } catch (e) {
    failed.push(rel + ' — ' + (e.code || e.message));
    return null;
  }
}

/* Every count individually guarded: one unreadable register nulls ITS counts,
   not the whole file. */
function count(fn) { try { const v = fn(); return Number.isFinite(v) ? v : null; } catch (e) { return null; } }

const roster = read('ROSTER-INDEX.json', true);
const keys   = read('img/KEYS.json', true);
const book   = read('PRODUCTION.json', true);
const spells = read('spec/spells.json', true);
const conf   = read('spell-conformance.json', true);
const schema = read('db/SCHEMA.json', true);
const srcs   = read('SOURCES.json', true);
const briefsSection = 'the briefs';

/* ── THE MAP ROOM ─────────────────────────────────────────────────────────
   Counted off the registers, not off FRAMES.csv's own `places` note. Each is
   guarded on its own: a missing frame register nulls ITS count and not the
   rest, which is the same rule every count above keeps. */
const frames = read('FRAMES.csv');
const attica = read('ATTICA.csv');
const whys   = read('ATTICA-WHY.csv');
const tours  = read('TOURS.csv');

/* rows that are neither blank nor a `#` comment, minus the header */
function rows(text) {
  if (!text) { return null; }
  const ls = text.replace(/\r/g, '').split('\n')
    .filter(l => l.trim() && l.charAt(0) !== '#');
  return Math.max(0, ls.length - 1);
}
/* QUOTES PROTECT COMMAS, AND A NAIVE SPLIT LOSES ROWS TO THEM. The first
   version of this used String.split(',') and reported 47 unplaced places where
   the surface and two independent signals both say 91 — because `kind` fields
   like "gate (of a city), city gate" gained a column and shifted lat and lon
   out from under it. THE SAME FAULT SEATS.csv LOST 25 ROWS TO on 6 September,
   and harvest-attica.py warns about it in its own header. */
function cells(line) {
  const out = []; let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
function col(text, name) {
  if (!text) { return null; }
  const ls = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const head = cells(ls[0]).map(h => h.trim());
  const i = head.indexOf(name);
  if (i < 0) { return null; }
  return ls.slice(1).filter(l => l.charAt(0) !== '#')
           .map(l => (cells(l)[i] || '').trim());
}

const state = {
  _: 'GENERATED by probes/probe-hall.mjs — do not edit. Every number the hall may state, read at the hour below. A null means the register could not be read THIS RUN; the hall says so rather than quoting a stale count.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-hall.mjs',

  souls:            count(() => roster.totals.souls),
  souls_with_plates: count(() => roster.totals.withPlates),
  souls_with_rooms:  count(() => roster.totals.withRoom),
  keys:             count(() => keys.totals.keys),

  chapters_written: count(() => (book.chapters || []).filter(c => c.file).length),
  chapters_planned: count(() => (book.chapters || []).length),

  spells:            count(() => spells.spells.length),
  /* The conformance register carries its own totals and its field is `stamp`,
     not `state` — read 24 Aug after a guessed field name counted 0 of 8. Use
     the register's own arithmetic rather than redoing it wrong. */
  spells_confirmed:    count(() => conf.totals.confirmed),
  spells_contradicted: count(() => conf.totals.contradicted),
  spells_unproven:     count(() => conf.totals.unproven + conf.totals.unreachable),

  tables:            count(() => schema.counts.tables),
  functions:         count(() => schema.counts.functions),

  documents_indexed: count(() => srcs.counts.reachable),
  briefs: count(() => {
    let n = 0;
    for (const [g, items] of Object.entries(srcs.sources || {}))
      if (g.toLowerCase().startsWith(briefsSection)) n += items.length;
    return n || null;
  }),

  /* ── WHAT THE MAP ROOM HOLDS ────────────────────────────────────────
     `frames_read` is the count the hall should lead with when asked what the
     map covers, because FOURTEEN OF FIFTEEN ARE HARVESTED AND UNAUTHORED and
     a bare `fifteen frames` would overstate the ship. */
  frames:           count(() => rows(frames)),
  frames_read:      count(() => (col(frames, 'detail') || []).filter(d => d === 'full').length),
  frames_reference: count(() => (col(frames, 'detail') || []).filter(d => d && d !== 'full').length),
  frames_with_ground: count(() => (col(frames, 'ground') || []).filter(g => g).length),

  attica_places:    count(() => rows(attica)),
  attica_unplaced:  count(() => {
    /* ATTICA.csv predates the `unplaced` column; the 1/8-degree fallback is
       detected the way the surface detects it. Both signals were checked
       against each other on 9 Sep and agree on 91 of 92 rows. */
    const c = col(attica, 'unplaced');
    if (c) { return c.filter(v => v === '1').length; }
    const la = col(attica, 'lat'), lo = col(attica, 'lon');
    if (!la || !lo) { return null; }
    const on = v => Math.abs((+v) * 8 - Math.round((+v) * 8)) < 1e-9;
    return la.filter((v, i) => on(v) && on(lo[i])).length;
  }),
  attica_why:       count(() => rows(whys)),
  tours:            count(() => {
    const t = col(tours, 'tour');
    return t ? new Set(t.filter(Boolean)).size : null;
  }),
  tour_frames:      count(() => rows(tours)),

  could_not_read: failed.length ? failed : undefined,
};

say('── the hall, counted ──────────────────────────────────────');
for (const [k, v] of Object.entries(state)) {
  if (k.startsWith('_') || k === 'generated' || k === 'generator' || k === 'could_not_read') continue;
  say('  ' + k.padEnd(18) + (v === null ? 'NULL — register unread' : v));
}
if (failed.length) { say(''); failed.forEach(f => say('  UNREAD  ' + f)); }

if (CHECK) {
  const nulls = Object.values(state).filter(v => v === null).length;
  say('\n--check: ' + (nulls ? nulls + ' count(s) unreadable' : 'every count read') + ', nothing written');
  process.exit(nulls ? 1 : 0);
}

fs.writeFileSync(OUT, JSON.stringify(state, null, 1) + '\n');
say('\nwrote         ' + OUT + '  (' + fs.statSync(OUT).size + ' bytes)');
say('───────────────────────────────────────────────────────────');
