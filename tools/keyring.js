#!/usr/bin/env node
/* ============================================================================
   tools/keyring.js  ·  THE KEY REGISTER
   ----------------------------------------------------------------------------
   Walks names.csv and img/PLATES.json and writes img/KEYS.json: every key the
   ship uses, what it resolves to, and — the part that has never existed —
   WHICH KEYS ARE LOADED.

     node tools/keyring.js            # write img/KEYS.json
     node tools/keyring.js --check    # report only, exit 1 on a live collision

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   Plates, rooms, scenes and the proxy all point at each other BY KEY, and
   nothing has ever declared what a key is. There is no convention. There are
   FOUR, and none of them is written down:

       abraham-lincoln    -> lincoln              the forename dropped
       cleopatra-vii      -> cleopatra            the epithet dropped
       einstein-albert                            word order, accepted 16 Aug
       george-washington  -> george-washington    full, because two Washingtons

   Every one was a reasonable decision in the moment. Together they are a
   HABIT, and a habit cannot be checked — which is why the same conversation
   has come round every few weeks, and why every checker anyone writes is a
   guess at the habit that is approximately right.

   ── THE THING THIS FINDS THAT NOTHING ELSE DOES ───────────────────────────
   A LOADED KEY. `caesar` is not broken. The room holds the Gallic War and the
   Civil War, the plates are Julius, the manifest says so outright. It is
   correct today and it BREAKS THE DAY AUGUSTUS COMES ABOARD — because then
   two souls answer to it and neither can claim it.

   Nothing has ever listed the others. Every short key that already matches
   more than one roster name is the same trap with a different fuse length, and
   they are cheap to fix now and a migration later.

       A KEY IS NOT WRONG UNTIL A SECOND SOUL ANSWERS TO IT.
       BY THEN IT IS EXPENSIVE.

   ── FOUR STATES ───────────────────────────────────────────────────────────
     RESOLVED   exactly one soul, by exact / suffix / prefix / reversed
     LOADED     one soul today, MORE THAN ONE NAME on the roster matches it
     AMBIGUOUS  more than one soul answers to it RIGHT NOW
     ORPHAN     no soul answers to it at all — drift, or a scene filed as a
                figure. gw-winter was the last of these.

   THIS WRITES NOTHING BUT KEYS.json. It renames nothing, moves nothing, and
   touches neither the roster nor MANIFEST.json. It is a reading.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT   = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const ROSTER = path.join(ROOT, 'names.csv');
const PLATES = path.join(ROOT, 'img', 'PLATES.json');
const LIB    = path.join(ROOT, 'library');
const OUT    = path.join(ROOT, 'img', 'KEYS.json');
const CHECK  = process.argv.includes('--check');

function die(m) { console.error('REFUSES: ' + m); process.exit(2); }

/* quoted fields everywhere — every Biography carries a comma */
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

/* the one slug rule. tools/plates.js, ingest.py and probe-spells.mjs carry the
   same function; if one changes all must. */
const slug = s => String(s).toLowerCase()
  .replace(/[.'\u2019]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ── THE ROSTER ─────────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER, 'utf8').split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) die('names.csv holds no rows.');

const head = cut(lines[0]);
const lower = head.map(s => s.trim().toLowerCase());
/* BY NAME, NEVER BY POSITION. Column zero on this roster is `Rank`, a number,
   and a probe that fell back to it searched integers for "cleopatra" and
   reported eight empty lists with complete confidence. */
const nameCol = ['full name', 'name'].map(w => lower.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" or "Name" column. Header: ' + head.join(', '));
const keyCol = lower.indexOf('key');

const souls = lines.slice(1).map(cut).map((r, i) => ({
  row: i + 2,
  name: (r[nameCol] || '').trim(),
  declared: keyCol > -1 ? (r[keyCol] || '').trim() : null,
})).filter(s => s.name);
souls.forEach(s => { s.slug = slug(s.name); });

/* ── WHAT THE SHIP CALLS THEM ───────────────────────────────────────────── */
let plates = {};
try { plates = JSON.parse(fs.readFileSync(PLATES, 'utf8')); } catch (e) {}
const K = plates.keys || {};
const plateKeys = Object.keys(K).filter(k => Object.keys(K[k].variants || {}).length);
const roomKeys = fs.existsSync(LIB)
  ? fs.readdirSync(LIB).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''))
  : [];
const usedKeys = [...new Set(plateKeys.concat(roomKeys))].sort();

/* ── THE FOUR SHAPES ────────────────────────────────────────────────────── */
function shapeOf(key, s) {
  if (s === key) return 'exact';
  if (s.endsWith('-' + key)) return 'suffix';
  if (s.startsWith(key + '-')) return 'prefix';
  if (s.split('-').reverse().join('-') === key) return 'reversed';
  return null;
}

const entries = usedKeys.map(key => {
  const hits = [];
  souls.forEach(s => { const how = shapeOf(key, s.slug); if (how) hits.push({ name: s.name, row: s.row, how }); });

  /* RESOLVED means one soul answers. LOADED means one answers TODAY and the
     key is a substring another name would also answer to — the fuse. */
  let state;
  if (hits.length === 0) state = 'ORPHAN';
  else if (hits.length > 1) state = 'AMBIGUOUS';
  else state = 'RESOLVED';

  /* the fuse: any OTHER soul whose name contains this key as a word, even if
     no shape currently matches. `caesar` vs "Augustus Caesar" is exact-suffix
     so it is already AMBIGUOUS; but a key like `newton` would be LOADED the
     moment a second Newton arrives, and this is where that is seen coming. */
  const word = new RegExp('(^|-)' + key + '($|-)');
  const couldAlso = souls.filter(s => word.test(s.slug) && !hits.some(h => h.row === s.row))
                         .map(s => s.name);
  if (state === 'RESOLVED' && couldAlso.length) state = 'LOADED';

  return {
    key,
    state,
    hasPlates: plateKeys.includes(key),
    hasRoom: roomKeys.includes(key),
    resolvesTo: hits.map(h => h.name),
    shape: hits.length === 1 ? hits[0].how : null,
    alsoMatches: couldAlso,
    variants: Object.keys((K[key] || {}).variants || {}),
  };
});

const by = st => entries.filter(e => e.state === st);
const totals = {
  keys: entries.length,
  plates: plateKeys.length,
  rooms: roomKeys.length,
  souls: souls.length,
  resolved: by('RESOLVED').length,
  loaded: by('LOADED').length,
  ambiguous: by('AMBIGUOUS').length,
  orphan: by('ORPHAN').length,
  declaredColumn: keyCol > -1,
};

const shapes = {};
entries.forEach(e => { if (e.shape) shapes[e.shape] = (shapes[e.shape] || 0) + 1; });

/* ── REPORT ─────────────────────────────────────────────────────────────── */
console.log('roster    ' + souls.length + ' souls · name column "' + head[nameCol] + '"'
          + (keyCol > -1 ? ' · a key column EXISTS' : ' · NO key column'));
console.log('keys      ' + entries.length + ' in use (' + plateKeys.length + ' plate · ' + roomKeys.length + ' room)');
console.log('');
console.log('  resolved   ' + String(totals.resolved).padStart(4) + '   ' +
  Object.entries(shapes).map(([k, v]) => k + ' ' + v).join(' · '));
console.log('  loaded     ' + String(totals.loaded).padStart(4) + '   correct today, breaks when a second soul arrives');
console.log('  ambiguous  ' + String(totals.ambiguous).padStart(4) + '   two souls answer to it NOW');
console.log('  orphan     ' + String(totals.orphan).padStart(4) + '   no soul answers at all');

if (by('AMBIGUOUS').length) {
  console.log('\nAMBIGUOUS — a decision the captain owes. This tool will not choose;');
  console.log('picking one would invent an answer to a question nobody was asked.');
  by('AMBIGUOUS').forEach(e => console.log('  ' + e.key.padEnd(18) + e.resolvesTo.join('  |  ')));
}
if (by('LOADED').length) {
  console.log('\nLOADED — correct today. Each fires when the named soul comes aboard.');
  by('LOADED').forEach(e => console.log('  ' + e.key.padEnd(18) + 'is ' + e.resolvesTo[0]
    + '   · also matches: ' + e.alsoMatches.join(', ')));
}
if (by('ORPHAN').length) {
  console.log('\nORPHAN — a key no soul answers to. Drift, or a scene filed as a figure.');
  by('ORPHAN').forEach(e => console.log('  ' + e.key.padEnd(18)
    + (e.hasPlates ? 'plates ' : '') + (e.hasRoom ? 'room' : '')));
}

if (CHECK) {
  const bad = totals.ambiguous + totals.orphan;
  console.log('\n--check: ' + (bad ? bad + ' key(s) resolve to none or many' : 'every key resolves to one soul')
            + ', nothing written');
  process.exit(bad ? 1 : 0);
}

fs.writeFileSync(OUT, JSON.stringify({
  _: 'GENERATED by tools/keyring.js — do not edit. Every key the ship uses, and what it reaches.',
  _law: 'A key is not wrong until a second soul answers to it. By then it is expensive.',
  generated: new Date().toISOString(),
  generator: 'tools/keyring.js',
  shapes: {
    exact:    'the key IS the slugged name',
    suffix:   'the forename dropped — lincoln in abraham-lincoln',
    prefix:   'the epithet dropped — cleopatra in cleopatra-vii',
    reversed: 'word order — einstein-albert of albert-einstein',
  },
  states: {
    RESOLVED:  'exactly one soul answers',
    LOADED:    'one soul today; another name on the roster would also answer',
    AMBIGUOUS: 'more than one soul answers right now',
    ORPHAN:    'no soul answers at all',
  },
  totals,
  keys: entries,
}, null, 2) + '\n');

console.log('\nwrote ' + OUT);
