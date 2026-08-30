#!/usr/bin/env node
/* ============================================================================
   probe-works.mjs  ·  THE WORKS, VERIFIED
   ----------------------------------------------------------------------------
       node probes/probe-works.mjs [--write]

   Reads WORKS.semantics.json — the authored claim about what each figure wrote —
   fetches every url, and writes WORKS.json: the reading.

   IT INHERITS THE SOURCE INDEX'S LAW. A source that cannot be reached is not a
   source; it is a thing somebody remembers. A citation with a null url is not a
   failure of this probe, it is an honest gap, and it is counted as one rather
   than hidden.

   AND IT CHECKS THE ROSTER BACK. A works entry for a figure who is not in
   names.csv is a citation for somebody this system cannot speak as — which is
   how a corpus quietly drifts away from the cast it exists to serve.

   WHAT IT DOES NOT DO. It cannot tell you whether a quotation is really in the
   work it is attributed to. Nothing here can, short of holding the text. It
   tells you the work exists, that the figure wrote it, and that the page can be
   opened — which is three of the four things a citation claims.
   ========================================================================== */

import fs from 'node:fs';

const SEMANTICS = 'WORKS.semantics.json';
const OUT       = 'WORKS.json';
const LEDGER_LOCAL = 'names.csv';
const LEDGER_RAW   = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/names.csv';

const write = process.argv.includes('--write');

/* ── the roster, local first ───────────────────────────────────────────── */
function splitRow(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map(s => s.replace(/^"|"$/g, ''));
}

async function loadRoster() {
  let text = null, via = null;
  if (fs.existsSync(LEDGER_LOCAL)) {
    text = fs.readFileSync(LEDGER_LOCAL, 'utf8'); via = LEDGER_LOCAL;
  } else {
    try {
      const r = await fetch(LEDGER_RAW, { cache: 'no-store' });
      if (r.ok) { text = await r.text(); via = 'the repo'; }
    } catch (e) { /* named below */ }
  }
  if (!text) return { names: null, via: null };

  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim());
  const head = splitRow(lines[0]);
  const iName = head.indexOf('Full Name');
  if (iName < 0) return { names: null, via: 'the header has no Full Name column' };

  const names = new Set();
  for (let i = 1; i < lines.length; i++) {
    const n = (splitRow(lines[i])[iName] || '').trim();
    if (n) names.add(n.toLowerCase());
  }
  return { names, via };
}

/* ── reachability ──────────────────────────────────────────────────────── */
async function reach(url) {
  try {
    /* HEAD first — a corpus is mostly large scans and there is no reason to
       pull a megabyte to learn a page exists. Some archives refuse HEAD, so a
       405 or 501 falls through to GET rather than being reported as dead. */
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (r.status === 405 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return { status: r.status, ok: r.ok };
  } catch (e) {
    return { status: null, ok: false, why: (e && e.message) || 'fetch threw' };
  }
}

/* ── the run ───────────────────────────────────────────────────────────── */
if (!fs.existsSync(SEMANTICS)) {
  console.error('probe-works: ' + SEMANTICS + ' is not here. Nothing to verify.');
  process.exit(2);
}
const sem = JSON.parse(fs.readFileSync(SEMANTICS, 'utf8'));
const authored = sem.works || {};
const { names: roster, via: rosterVia } = await loadRoster();

console.log('');
console.log('╔' + '═'.repeat(72) + '╗');
console.log('  THE WORKS · what each figure wrote, and whether it can be read');
console.log('╚' + '═'.repeat(72) + '╝');
console.log('');
console.log('  figures authored : ' + Object.keys(authored).length);
console.log('  roster           : ' + (roster ? roster.size + ' via ' + rosterVia
                                              : 'NOT LOADED — the cast check is blind'));
console.log('');

const reading = { generated: new Date().toISOString(), figures: {},
                  counts: { figures: 0, works: 0, reachable: 0, unsourced: 0, dead: 0 },
                  notOnRoster: [], unsourced: [], dead: [] };

for (const [key, entry] of Object.entries(authored)) {
  const corpus = entry.corpus || [];
  reading.counts.figures++;

  const onRoster = roster ? roster.has(key) : null;
  if (onRoster === false) reading.notOnRoster.push(key);

  const works = [];
  for (const w of corpus) {
    reading.counts.works++;
    let state, status = null;

    if (!w.url) {
      state = 'UNSOURCED';
      reading.counts.unsourced++;
      reading.unsourced.push(key + ' · ' + w.title);
    } else {
      const r = await reach(w.url);
      status = r.status;
      if (r.ok) { state = 'REACHABLE'; reading.counts.reachable++; }
      else {
        state = 'DEAD';
        reading.counts.dead++;
        reading.dead.push(key + ' · ' + w.title + ' → ' +
                          (r.status ? 'HTTP ' + r.status : r.why));
      }
    }
    works.push({ ...w, state, status });
  }

  reading.figures[key] = {
    wrote: entry.wrote === true,
    onRoster,
    note: entry.note || null,
    works
  };

  const bad = works.filter(w => w.state !== 'REACHABLE').length;
  console.log('  ' + (bad ? '·' : '✓') + ' ' + key +
              '   ' + works.length + ' work' + (works.length === 1 ? '' : 's') +
              (bad ? '   ' + bad + ' not yet readable' : '') +
              (onRoster === false ? '   ⚠ NOT ON THE ROSTER' : '') +
              (entry.wrote === false ? '   (reported, not written)' : ''));
}

const c = reading.counts;
console.log('');
console.log('  ' + '─'.repeat(72));
console.log('  works ' + c.works + '   reachable ' + c.reachable +
            '   unsourced ' + c.unsourced + '   dead ' + c.dead);
console.log('');

if (c.unsourced) {
  console.log('  UNSOURCED — a citation with no url. Not a failure of this probe: the');
  console.log('  work is named and nobody has said where it can be read. A GUESSED URL');
  console.log('  WOULD BE WORSE, because it would read as verified.');
  reading.unsourced.slice(0, 12).forEach(s => console.log('     ' + s));
  if (reading.unsourced.length > 12) console.log('     … and ' + (reading.unsourced.length - 12) + ' more');
  console.log('');
}
if (c.dead) {
  console.log('  DEAD — a url that was authored and does not answer.');
  reading.dead.forEach(s => console.log('     ' + s));
  console.log('');
}
if (reading.notOnRoster.length) {
  console.log('  NOT ON THE ROSTER — a corpus for somebody this system cannot speak as.');
  reading.notOnRoster.forEach(s => console.log('     ' + s));
  console.log('');
}

const covered = roster ? (c.figures / roster.size * 100).toFixed(1) : '?';
console.log('  THE HONEST NUMBER: ' + c.figures + ' figures of ' +
            (roster ? roster.size : '?') + ' have a corpus — ' + covered + '%.');
console.log('  A register that covers six of a thousand should say six, not look full.');
console.log('');

if (write) {
  fs.writeFileSync(OUT, JSON.stringify(reading, null, 2));
  console.log('  wrote ' + OUT);
} else {
  console.log('  (report only — pass --write to update ' + OUT + ')');
}
console.log('');

/* A dead link is a fault. An unsourced work is honest. Only the first fails. */
process.exit(c.dead ? 1 : 0);
