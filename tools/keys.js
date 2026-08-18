#!/usr/bin/env node
/* ============================================================================
   tools/keys.js  ·  THE KEY COLUMN
   ----------------------------------------------------------------------------
   Adds a `key` column to names.csv, derived from what the ship ALREADY uses,
   so that nothing ever has to guess again.

     node tools/keys.js            # report only. writes nothing.
     node tools/keys.js --write    # write names.csv with the key column

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   THERE IS NO KEY CONVENTION. THERE ARE FOUR, AND NONE IS WRITTEN DOWN.

       abraham-lincoln    -> lincoln              drop the forename
       cleopatra-vii      -> cleopatra            drop the epithet
       george-washington  -> george-washington    full — `washington` is ambiguous
       einstein-albert                            reversed, accepted 16 Aug
       shakespeare-william                        reversed, unruled

   Every one of those was a reasonable decision in the moment. Together they
   are not a rule, they are a HABIT — and a habit cannot be checked. That is
   why the same conversation has happened every few weeks: every checker anyone
   writes is a guess at the habit, every guess is approximately right, and
   approximately right is how wd-gann hid behind one character and gw-winter
   hid behind a hyphen.

   THE COST OF LEAVING IT
   Plates, rooms, scenes and the proxy all point at each other BY KEY. Nothing
   declares what a key is. The next thousand souls each get one by somebody's
   judgement at the time, and every register downstream infers rather than
   reads. That is not a naming problem. It is an AUTHORITY problem, and this
   system already knows what to do about those: put it in a file.

   THE ROSTER IS ALREADY THE AUTHORITY FOR WHO EXISTS.
   IT BECOMES THE AUTHORITY FOR WHAT THEY ARE CALLED.

   ── WHAT THIS TOOL DOES NOT DO ────────────────────────────────────────────
   It does not RENAME anything. Not one file on disk moves. It reads the keys
   the ship is already using and writes them down beside the names they belong
   to. Every existing plate, room and scene keeps working exactly as it does
   now, because the column records reality rather than imposing on it.

   A migration that changes behaviour on the same day it changes structure is
   two findings tangled into one. This one changes structure only.

   ── HOW A KEY IS CHOSEN ───────────────────────────────────────────────────
   In this order, and the order is the whole design:

     1. THE PLATE KEY, if one exists and resolves to exactly one roster row.
        The ship's own usage wins. If art already says `lincoln`, the answer is
        `lincoln`, whatever any rule would have produced.

     2. THE ROOM KEY, on the same terms.

     3. THE SLUG, for a figure with neither. Predictable, and never in conflict
        with anything, because nothing points at them yet.

   AMBIGUITY IS NOT RESOLVED. It is REPORTED. Two Washingtons on the roster
   means a bare `washington` belongs to neither, and a tool that picked one
   would be inventing an answer to a question the captain has not been asked.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT   = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const ROSTER = path.join(ROOT, 'names.csv');
const PLATES = path.join(ROOT, 'img', 'PLATES.json');
const LIB    = path.join(ROOT, 'library');
const WRITE  = process.argv.includes('--write');

function die(m) { console.error('REFUSES: ' + m); process.exit(2); }

/* ── CSV, PROPERLY ────────────────────────────────────────────────────────
   Quoted fields containing commas are everywhere in this roster — every
   Biography has one. A naive split puts half a life story in the wrong column,
   and a tool that mangles the roster while adding a column to it would be a
   poor trade. */
function cut(line) {
  const out = []; let f = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(f); f = ''; }
    else f += c;
  }
  out.push(f);
  return out;
}
const quote = s => /[",\n]/.test(s) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);

/* the slug, identical in tools/plates.js and ingest.py. Three languages now;
   if one changes all three must. */
const slug = s => String(s).toLowerCase()
  .replace(/[.'\u2019]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ── READ THE ROSTER ────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER, 'utf8').split(/\r?\n/);
while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
if (lines.length < 2) die('names.csv holds no rows.');

const head = cut(lines[0]);
const lower = head.map(s => s.trim().toLowerCase());
const nameCol = ['full name', 'name'].map(w => lower.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" or "Name" column. Header: ' + head.join(', '));

const existingKeyCol = lower.indexOf('key');
const rows = lines.slice(1).map(cut);
const names = rows.map(r => (r[nameCol] || '').trim());

/* ── WHAT THE SHIP ALREADY CALLS THEM ───────────────────────────────────── */
const plateKeys = (() => {
  if (!fs.existsSync(PLATES)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(PLATES, 'utf8'));
    return Object.keys(j.keys || {}).filter(k => Object.keys(j.keys[k].variants || {}).length);
  } catch (e) { return []; }
})();

const roomKeys = fs.existsSync(LIB)
  ? fs.readdirSync(LIB).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''))
  : [];

/* ── MATCHING: THE FOUR SHAPES, NAMED ─────────────────────────────────────
   Not one rule. FOUR, because the ship uses four, and pretending otherwise is
   what has made every previous checker approximately right.

     exact     lincoln            == lincoln
     suffix    lincoln            in abraham-lincoln       forename dropped
     prefix    cleopatra          in cleopatra-vii          epithet dropped
     reversed  einstein-albert    of albert-einstein        word order

   A key that matches MORE THAN ONE roster row matches none of them. Two
   Washingtons is the case that proves it: `washington` is not George's key and
   it is not Denzel's, and choosing would be inventing. */
function shapesFor(key) {
  const k = slug(key);
  const hits = [];
  names.forEach((n, i) => {
    const s = slug(n);
    if (!s) return;
    if (s === k)                                    hits.push({ i, how: 'exact' });
    else if (s.endsWith('-' + k))                   hits.push({ i, how: 'suffix' });
    else if (s.startsWith(k + '-'))                 hits.push({ i, how: 'prefix' });
    else if (s.split('-').reverse().join('-') === k) hits.push({ i, how: 'reversed' });
  });
  return hits;
}

/* ── ASSIGN ───────────────────────────────────────────────────────────────
   The ship's usage wins over any rule this tool could invent. */
const key = new Array(rows.length).fill(null);
const source = new Array(rows.length).fill(null);
const shape = new Array(rows.length).fill(null);
const ambiguous = [];   /* a used key that names more than one soul */
const orphanKeys = [];  /* a used key that names nobody */
const collisions = [];  /* two souls landing on one key */

function claim(k, kind) {
  const hits = shapesFor(k);
  if (hits.length === 0) { orphanKeys.push({ key: k, kind }); return; }
  if (hits.length > 1) {
    ambiguous.push({ key: k, kind, rows: hits.map(h => names[h.i]) });
    return;
  }
  const { i, how } = hits[0];
  if (key[i] && key[i] !== k) {
    collisions.push({ name: names[i], had: key[i], also: k });
    return;
  }
  key[i] = k; source[i] = kind; shape[i] = how;
}

plateKeys.forEach(k => claim(k, 'plate'));
roomKeys.forEach(k => { if (!key.includes(k)) claim(k, 'room'); });

/* everyone else gets the slug of their name. Nothing points at them, so
   nothing can be broken by it. */
let slugged = 0;
const taken = new Set(key.filter(Boolean));
const dupSlug = [];
rows.forEach((r, i) => {
  if (key[i]) return;
  const s = slug(names[i]);
  if (!s) return;
  if (taken.has(s)) { dupSlug.push({ name: names[i], key: s }); return; }
  key[i] = s; source[i] = 'slug'; shape[i] = 'slug'; taken.add(s); slugged++;
});

/* ── REPORT ───────────────────────────────────────────────────────────────
   Counts, then the things a person has to decide. Lists, not numbers: a count
   reconciles silently and looks quantitative. */
const byShape = {};
shape.forEach(s => { if (s) byShape[s] = (byShape[s] || 0) + 1; });
const unkeyed = key.filter(k => !k).length;

console.log('roster    ' + rows.length + ' rows · name column "' + head[nameCol] + '"'
          + (existingKeyCol > -1 ? ' · a key column ALREADY EXISTS and will be rewritten' : ''));
console.log('art       ' + plateKeys.length + ' plate keys · ' + roomKeys.length + ' rooms');
console.log('');
console.log('keys assigned');
for (const s of ['exact', 'suffix', 'prefix', 'reversed', 'slug']) {
  if (byShape[s]) console.log('  ' + s.padEnd(10) + String(byShape[s]).padStart(5)
    + (s === 'slug' ? '   figures with no art — the slug is safe, nothing points at them' : '   taken from what the ship already uses'));
}
console.log('  ' + 'unkeyed'.padEnd(10) + String(unkeyed).padStart(5));

if (ambiguous.length) {
  console.log('\nAMBIGUOUS — a key the ship uses that names more than one soul.');
  console.log('THIS TOOL WILL NOT CHOOSE. Picking one would invent an answer to a');
  console.log('question the captain has not been asked.');
  ambiguous.forEach(a => console.log('  ' + a.key + '  (' + a.kind + ')  ->  ' + a.rows.join('  |  ')));
}
if (orphanKeys.length) {
  console.log('\nUSED BY THE SHIP, ON NO ROSTER ROW — art or a room exists for a');
  console.log('figure the roster does not carry, or the key is drift.');
  orphanKeys.forEach(o => console.log('  ' + o.key + '  (' + o.kind + ')'));
}
if (collisions.length) {
  console.log('\nTWO KEYS FOR ONE SOUL — a plate and a room disagree.');
  collisions.forEach(c => console.log('  ' + c.name + ': has "' + c.had + '", also claimed by "' + c.also + '"'));
}
if (dupSlug.length) {
  console.log('\nSLUG ALREADY TAKEN — two names reduce to one key. Needs a decision.');
  dupSlug.forEach(d => console.log('  ' + d.name + '  ->  ' + d.key + ' (already used)'));
}

const blocking = ambiguous.length + collisions.length + dupSlug.length;

/* ── WRITE ────────────────────────────────────────────────────────────────
   Only on --write, only with nothing blocking, and only after a backup. A tool
   that rewrites the one file the whole system resolves through should be hard
   to run by accident. */
if (!WRITE) {
  console.log('\nreport only — nothing written. Re-run with --write when the list above is settled.');
  process.exit(blocking ? 1 : 0);
}
if (blocking) {
  console.log('\nREFUSES TO WRITE: ' + blocking + ' row(s) need a decision first.');
  console.log('A key column with a guess in it is worse than none — every register');
  console.log('downstream would resolve through the guess and report clean.');
  process.exit(1);
}

const outHead = existingKeyCol > -1 ? head.slice() : ['key'].concat(head);
const outRows = rows.map((r, i) => {
  if (existingKeyCol > -1) { const c = r.slice(); c[existingKeyCol] = key[i] || ''; return c; }
  return [key[i] || ''].concat(r);
});

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(ROSTER, ROSTER + '.bak-' + stamp);
fs.writeFileSync(ROSTER,
  [outHead, ...outRows].map(r => r.map(quote).join(',')).join('\n') + '\n');

console.log('\nbackup   ' + path.basename(ROSTER) + '.bak-' + stamp);
console.log('wrote    ' + ROSTER + '  ·  key column ' + (existingKeyCol > -1 ? 'rewritten' : 'added as column 1'));
console.log('\nNOTHING ON DISK MOVED. Every plate, room and scene resolves exactly as');
console.log('it did — the column records what the ship already does. From here a');
console.log('register reads the key instead of inferring it, and the four shapes');
console.log('become one lookup.');
