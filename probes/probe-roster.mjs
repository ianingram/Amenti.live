#!/usr/bin/env node
/* ============================================================================
   probes/probe-roster.mjs  ·  THE ROSTER INDEX
   ----------------------------------------------------------------------------
   Walks names.csv and img/KEYS.json and writes ROSTER-INDEX.json: every soul,
   its slug, its title, and whether the ship has art or a room for it.

     node probes/probe-roster.mjs            # write ROSTER-INDEX.json
     node probes/probe-roster.mjs --check    # report only, exit 1 on trouble

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   ASK AMENTI's fragment search was tested on 24 August against the live
   SOURCES.json. `find('caesar')` returned ZERO.

   SOURCES.json indexes DOCUMENTS. It has no entry for a soul. So the most
   obvious thing a visitor can type into a box on the arena — the name of a
   figure — matched nothing at all.

       A SEARCH OVER THE DOCUMENTS IS NOT A SEARCH OVER THE LIBRARY.

   names.csv is 548 KB. It cannot be loaded by a surface on every keystroke and
   it must NEVER be sent to the model. This writes the compact form: name, slug,
   title, and two flags. ~57 KB for 1,011 souls — fine for a browser to hold,
   still far too large for a prompt.

   ── THE COLUMN TRAP ───────────────────────────────────────────────────────
   names.csv column zero is `Rank`, a number. Find the name column BY HEADER.
   A probe that fell back to position searched integers for "cleopatra" and
   reported eight empty lists with complete confidence.

   ── THE ONE SLUG RULE ─────────────────────────────────────────────────────
   tools/keyring.js, tools/plates.js, ingest.py and probe-spells.mjs carry the
   same function. If one changes, all must.

   THIS WRITES NOTHING BUT ROSTER-INDEX.json. It is a reading.
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT   = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const ROSTER = path.join(ROOT, 'names.csv');
const KEYS   = path.join(ROOT, 'img', 'KEYS.json');
const OUT    = path.join(ROOT, 'ROSTER-INDEX.json');
const CHECK  = process.argv.includes('--check');

const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

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

const slug = s => String(s).toLowerCase()
  .replace(/[.'\u2019]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ── the roster ─────────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER, 'utf8').split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) die('names.csv holds no rows. An empty roster is not an empty library — treat it as a failed reading.');

const head  = cut(lines[0]);
const lower = head.map(s => s.trim().toLowerCase());
const nameCol = ['full name', 'name'].map(w => lower.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" or "Name" column. Header: ' + head.join(', '));
const titleCol = lower.indexOf('title');

const souls = lines.slice(1).map(cut).map(r => ({
  n: (r[nameCol] || '').trim(),
  t: titleCol > -1 ? (r[titleCol] || '').trim().slice(0, 60) : ''
})).filter(s => s.n);

souls.forEach(s => { s.k = slug(s.n); });

/* ── what the ship has for them ─────────────────────────────────────────── */
let keys = [];
try { keys = (JSON.parse(fs.readFileSync(KEYS, 'utf8')).keys) || []; }
catch (e) { console.error('  note: img/KEYS.json unread (' + e.message + ') — art flags will all be false'); }

const art = new Map();
keys.forEach(k => art.set(k.key, { p: !!k.hasPlates, r: !!k.hasRoom }));

/* A key may be a shortening — lincoln for abraham-lincoln. Match the soul the
   register says it resolves to, never by guessing the shape here. */
/* A SOUL MAY HAVE MORE THAN ONE KEY. Read 24 Aug: Albert Einstein answers to
   both `albert-einstein` (exact) and `einstein-albert` (reversed) — 53 keys
   reaching 52 souls. KEYS.json calls both RESOLVED and is right; there is no
   ambiguity, one soul answers. But an assignment that overwrites loses one,
   and any count assuming one key per soul is off by one. Collect them. */
const byName = new Map(souls.map(s => [s.n, s]));
keys.forEach(k => (k.resolvesTo || []).forEach(n => {
  const s = byName.get(n);
  if (!s) return;
  s.p = s.p || !!k.hasPlates;
  s.r = s.r || !!k.hasRoom;
  (s.keys ||= []).push(k.key);
}));
souls.forEach(s => { if (s.keys) s.keys.sort(); });

const withArt  = souls.filter(s => s.p).length;
const withRoom = souls.filter(s => s.r).length;
const dupes = (() => {
  const seen = new Map(); const out = [];
  souls.forEach(s => { if (seen.has(s.k)) out.push(s.k); else seen.set(s.k, 1); });
  return [...new Set(out)];
})();

console.log('── the roster index ───────────────────────────────────────');
console.log('souls         ' + souls.length);
console.log('with plates   ' + withArt);
console.log('with a room   ' + withRoom);
console.log('keyed         ' + souls.filter(s => s.keys).length + '  (of ' + keys.length + ' keys in the register)');
const multi = souls.filter(s => s.keys && s.keys.length > 1);
multi.forEach(s => console.log('  TWO KEYS:     ' + s.n + '  ' + s.keys.join(' ')));
if (dupes.length) {
  console.log('');
  console.log('  COLLIDING SLUGS: ' + dupes.join(' '));
  console.log('  Two souls reduce to one slug. A key is not wrong until a second');
  console.log('  soul answers to it — these already do.');
}

if (CHECK) {
  console.log('\n--check: ' + (dupes.length ? dupes.length + ' colliding slug(s)' : 'no collisions') + ', nothing written');
  process.exit(dupes.length ? 1 : 0);
}

const payload = {
  _: 'GENERATED by probes/probe-roster.mjs — do not edit. The compact roster, for search. names.csv is 548 KB and is never loaded by a surface; this is.',
  _law: 'NEVER send this to a model. It is 57 KB of names — the hall states counts from HALL-STATE.json and speaks of souls it was asked about, not of a list it was handed.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-roster.mjs',
  totals: { souls: souls.length, withPlates: withArt, withRoom: withRoom, collisions: dupes.length, soulsWithTwoKeys: multi.length },
  souls: souls.map(s => {
    const o = { n: s.n, k: s.k };
    if (s.t) o.t = s.t;
    const extra = (s.keys || []).filter(k => k !== s.k);
    if (extra.length) o.keys = extra;
    if (s.p) o.p = 1;
    if (s.r) o.r = 1;
    return o;
  })
};

fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)');
console.log('───────────────────────────────────────────────────────────');
