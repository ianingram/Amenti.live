#!/usr/bin/env node
/* ============================================================================
   probe-post.mjs  ·  THE POSTING GATE
   ----------------------------------------------------------------------------
   Reads a queue of proposed posts and REFUSES the ones that would put words in
   a real person's mouth. Exits non-zero if any post is refused, so it can gate
   a workflow.

       node probes/probe-post.mjs posts/queue.json

   WHY THIS EXISTS. Everything else in this fleet is protected by CONTEXT. A
   seeker talking to Lincoln knows they are talking to Lincoln, and if they ask
   whether he is real he tells them the truth at once.

   A POST HAS NO CONTEXT. It is screenshotted, cropped, and travels without the
   account attached. In five years somebody quotes it in an essay. So the one
   rule that governs the conversation — never invent a quotation — has to be
   enforced MECHANICALLY here, because there is no reader present to ask.

   WHAT IT CANNOT DO, AND SAYS SO. There is no machine-readable corpus of what
   these figures actually wrote. This gate therefore CANNOT verify that a quote
   is real. It can only refuse a quote that carries no source — which forces a
   human to write the citation down, and makes a fabrication a deliberate act
   rather than an accident.

       A GATE THAT CANNOT CHECK A CLAIM CAN STILL REFUSE AN UNCHECKABLE ONE.

   PROBE CORPS RULE 2 · ATTRIBUTE, NEVER INFER. Every refusal names the rule it
   broke and quotes the text that broke it. "REFUSED" on its own is a verdict
   nobody can act on.
   ========================================================================= */

import fs from 'node:fs';

const LEDGER_LOCAL = 'names.csv';
const LEDGER_RAW   = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/names.csv';

/* ── THE LIVING-MEMORY LINE ───────────────────────────────────────────────
   A figure dead four hundred years and a figure dead sixty are not the same
   kind of risk. The second has relatives who remember them, an estate, and
   often a community with strong and legitimate feelings about how they are
   used. Helen Keller died in 1968; Caesar did not.

   Seventy years is not a legal number and is not claimed as one. It is the
   distance at which somebody who knew the person is unlikely to read the post
   and recognise a voice that is not theirs. THE LINE IS A JUDGMENT AND IS
   WRITTEN HERE SO IT CAN BE ARGUED WITH. */
const LIVING_MEMORY_YEARS = 70;

const RULES = {
  ROSTER:    'THE FIGURE IS NOT ON THE ROSTER',
  UNSOURCED: 'A QUOTATION WITH NO SOURCE',
  VOICE:     'THE COMMENTARY SPEAKS AS THE FIGURE',
  RECENT:    'WITHIN LIVING MEMORY',
  SPEECH:    'INVENTED SPEECH OUTSIDE THE QUOTATION',
  EMPTY:     'NOTHING TO POST',
  LENGTH:    'TOO LONG FOR THE SURFACE',
  LABEL:     'THE ACCOUNT DOES NOT DECLARE ITSELF'
};

/* ── the roster ────────────────────────────────────────────────────────── */
function parseCsv(text) {
  const rows = [];
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const head = splitRow(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = splitRow(lines[i]);
    const row = {};
    head.forEach((h, n) => { row[h.trim()] = (cells[n] || '').trim(); });
    rows.push(row);
  }
  return rows;
}
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
    text = fs.readFileSync(LEDGER_LOCAL, 'utf8'); via = LEDGER_LOCAL + ' (local)';
  } else {
    try {
      const r = await fetch(LEDGER_RAW, { cache: 'no-store' });
      if (r.ok) { text = await r.text(); via = 'the repo'; }
    } catch (e) { /* named below */ }
  }
  if (!text) return { map: null, via: null };

  const map = new Map();
  for (const row of parseCsv(text)) {
    const name = row['Full Name'] || row['Name'] || '';
    if (!name) continue;
    map.set(name.toLowerCase().trim(), {
      name,
      died: yearOf(row['Death-Date'] || row['Death Date'] || '')
    });
  }
  return { map, via };
}

/* A death date can be "1865", "15 April 1865", "c. 1865", "44 BC", or blank.
   BC is unambiguous and safe; a blank is NOT — it is unknown, and unknown must
   not be read as ancient. */
function yearOf(s) {
  const t = String(s).trim();
  if (!t) return null;
  /* THE ROSTER STORES BC AS A NEGATIVE NUMBER, NOT AS LETTERS.
     Found 29 Aug 2026 by running this against the live 1,011 rather than a
     fixture: Caesar's Death-Date is "-44". The first version of this function
     looked for "BC" and found none, read -44 as the year 44, and would have
     held EVERY PRE-CHRISTIAN FIGURE IN THE ROSTER as within living memory —
     the whole classical half of the cast, refused for being too recent.
     A fixture I wrote myself would never have caught it, because I would have
     written "44 BC" in it. */
  const neg = t.match(/^-\s*(\d+)/);
  if (neg) return -parseInt(neg[1], 10);
  if (/\bB\.?C\.?E?\b/i.test(t)) return -Math.abs(parseInt(t.replace(/\D+/g, ''), 10) || 0);
  const m = t.match(/\b(\d{3,4})\b/);
  return m ? parseInt(m[1], 10) : null;
}

/* ── the rules ─────────────────────────────────────────────────────────── */
function judge(post, roster, thisYear) {
  const faults = [];
  const add = (rule, why, text) => faults.push({ rule, why, text });

  const figure = (post.figure || '').trim();
  const says   = (post.says || '').trim();
  const source = (post.source || '').trim();
  const note   = (post.note || '').trim();

  if (!says && !note) { add(RULES.EMPTY, 'The post has neither a quotation nor a note.', ''); return faults; }

  /* 1 · THE FIGURE MUST EXIST. A post attributed to somebody not on the
        roster is not a mistake in casting; it is a person this system has
        never read and cannot speak for. */
  if (figure && roster) {
    if (!roster.has(figure.toLowerCase())) {
      add(RULES.ROSTER, 'No row in names.csv matches this name, so nothing is known ' +
          'about what they wrote, when they died, or how they spoke.', figure);
    }
  }

  /* 2 · EVERY QUOTATION CARRIES A SOURCE. The rule from the daily rotation
        addendum, applied where nobody is present to ask. */
  if (says && !source) {
    add(RULES.UNSOURCED, 'The figure is quoted and no source is given. This gate cannot ' +
        'check whether a quotation is real — there is no corpus — so it refuses ' +
        'every quotation that does not carry its own citation.', says.slice(0, 90));
  }
  if (source && /^(unknown|attributed|various|n\/a|-+)$/i.test(source)) {
    add(RULES.UNSOURCED, 'The source field is a placeholder, not a citation.', source);
  }

  /* 3 · THE NOTE IS THE SITE'S VOICE, NOT THE FIGURE'S. The quotation is what
        they said; the note is what we say about it. If the note speaks as the
        figure, the whole post becomes an invented utterance with a real name
        on it — and it is the note, not the quote, that will be screenshotted. */
  if (note && /\b(I|my|me|mine)\b/.test(note) && !/["“]/.test(note)) {
    add(RULES.VOICE, 'The note uses the first person. The note is the site speaking ' +
        'ABOUT the figure; a note in their voice is an invented utterance with a ' +
        'real name attached.', note.slice(0, 90));
  }

  /* 4 · NO SPEECH OUTSIDE THE QUOTATION. Quotation marks in the note mean
        somebody is being quoted in a field that has no source attached to it. */
  const stray = note.match(/["“][^"”]{12,}["”]/);
  if (stray) {
    add(RULES.SPEECH, 'The note contains quoted speech. Quotations belong in `says`, ' +
        'where the gate can require a source for them.', stray[0].slice(0, 90));
  }

  /* 5 · THE LIVING-MEMORY LINE. */
  if (figure && roster && roster.has(figure.toLowerCase())) {
    const died = roster.get(figure.toLowerCase()).died;
    if (died === null) {
      add(RULES.RECENT, 'The roster has no death date for this figure, so the ' +
          'living-memory line cannot be applied. UNKNOWN IS NOT ANCIENT — fill the ' +
          'column or leave them off the account.', figure);
    } else if (died > 0 && (thisYear - died) < LIVING_MEMORY_YEARS) {
      add(RULES.RECENT, `Died ${died}, which is ${thisYear - died} years ago — inside ` +
          `the ${LIVING_MEMORY_YEARS}-year line. Somebody who knew them may read this. ` +
          'A human decides this one; the gate will not wave it through.', figure);
    }
  }

  /* 6 · IT MUST FIT. A post cut off mid-sentence by the platform is a
        fabrication of a different kind. */
  const whole = [says && `"${says}"`, source && `— ${source}`, note].filter(Boolean).join(' ');
  if (whole.length > 280) {
    add(RULES.LENGTH, `${whole.length} characters. Over 280 the platform truncates, ` +
        'and a truncated quotation is a misquotation.', whole.slice(0, 60) + '…');
  }

  return faults;
}

/* ── the run ───────────────────────────────────────────────────────────── */
const file = process.argv[2];
if (!file) {
  console.error('usage: node probes/probe-post.mjs <queue.json>');
  process.exit(2);
}
if (!fs.existsSync(file)) {
  console.error('probe-post: no such file — ' + file);
  process.exit(2);
}

const queue = JSON.parse(fs.readFileSync(file, 'utf8'));
const posts = Array.isArray(queue) ? queue : (queue.posts || []);
const { map: roster, via } = await loadRoster();
const thisYear = new Date().getUTCFullYear();

const line = (n = 74) => '─'.repeat(n);
console.log('');
console.log('╔' + '═'.repeat(72) + '╗');
console.log('  THE POSTING GATE · ' + posts.length + ' proposed');
console.log('╚' + '═'.repeat(72) + '╝');
console.log('');

if (!roster) {
  /* EMPTY GLASS. Without the roster the figure check and the living-memory
     line are both blind, and a gate that cannot see is not a gate. */
  console.log('  ✕ THE ROSTER DID NOT LOAD.');
  console.log('    Neither ' + LEDGER_LOCAL + ' nor the repo answered, so this gate cannot');
  console.log('    tell a real figure from an invented one, or a figure dead four');
  console.log('    hundred years from one dead sixty.');
  console.log('');
  console.log('    NOTHING IS APPROVED. A gate that fails open is not a gate.');
  process.exit(1);
}
console.log('  roster   ' + roster.size + ' figures via ' + via);
console.log('  line     ' + LIVING_MEMORY_YEARS + ' years (anyone who died after ' +
            (thisYear - LIVING_MEMORY_YEARS) + ' is held)');
console.log('');

let refused = 0;
posts.forEach((post, i) => {
  const faults = judge(post, roster, thisYear);
  const who = post.figure || '(no figure)';
  if (!faults.length) {
    console.log('  ✓ ' + String(i + 1).padStart(2) + '  ' + who);
    return;
  }
  refused++;
  console.log('  ✕ ' + String(i + 1).padStart(2) + '  ' + who);
  faults.forEach(f => {
    console.log('        ' + f.rule);
    console.log('        ' + f.why.replace(/\s+/g, ' '));
    if (f.text) console.log('        ↳ ' + JSON.stringify(f.text));
    console.log('');
  });
});

console.log('');
console.log('  ' + line());
console.log('  approved ' + (posts.length - refused) + '   refused ' + refused);
console.log('');
if (refused) {
  console.log('  A REFUSAL IS NOT A BUG IN THE POST. It is the gate doing the one thing');
  console.log('  it exists for: keeping an invented sentence with a real name on it off');
  console.log('  a surface where nobody is present to ask whether it is true.');
  console.log('');
}
process.exit(refused ? 1 : 0);
