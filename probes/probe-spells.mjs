#!/usr/bin/env node
/* ============================================================================
   probes/probe-spells.mjs  ·  THE SHIP, MEASURED AGAINST ITS SPECIFICATION
   ----------------------------------------------------------------------------
   Reads spec/spells.json — twenty-one requirements extracted from the Book of
   the Dead and from the briefs — and checks each one against the live system.
   Writes spell-conformance.json. Writes nothing else, ever.

   THE HALLS CAME FIRST. The mythology is not a frame laid over this software;
   it is the specification the software was built to satisfy. That claim is only
   worth anything if it can be TESTED, and until now nothing tested it.

   ── THIS PROBE MAY NOT SPEND ──────────────────────────────────────────────
   GET and HEAD only. No writes, no mints, no billable generation. The cost
   wall cannot tell a load test from an attack, and a probe that can spend can
   cause the outage it measures for. That rule is itself one of the spells, and
   this file is inside its own scope.

   ── FOUR ANSWERS, AND THE THIRD IS NOT A FAILURE ──────────────────────────
     CONFIRMED     checked, and the ship holds it
     CONTRADICTED  checked, and the ship does not
     UNPROVEN      NOTHING MEASURES THIS. Not a gap in the ship — a limit of
                   what a probe can know. Four spells are permanently here and
                   they print as loudly as a pass.
     UNREACHABLE   checkable in principle; this probe cannot see the thing.
                   Worker source lives in Amenti-Workers, a different repo.

   AN UNPROVEN SPELL IS THE HONEST READING. A probe that guessed at tone, or at
   whether a summons leaned, would be inventing — which is the exact fault the
   whole specification exists to catch. It says so instead.

   ── WHY IT DOES NOT SIMPLY PASS EVERYTHING IT CANNOT SEE ──────────────────
   Because that is how `codex: 0 of 51` happened in reverse. A checker that
   answers a question it cannot answer is worse than one that declines.

   ── AND WHERE A CHECK IS WEAKER THAN THE SPELL, IT SAYS SO ────────────────
   Some checks are patterns over source text rather than analysis, and a
   pattern can be walked past. Where that is true the note carries the size of
   the claim — "no literal write method appears" rather than "no probe spends".

   A CONFIRMED THAT OVERSTATES ITSELF IS A GREEN LAMP WITH NOTHING BEHIND IT,
   and this file exists because that keeps happening.

     node probes/probe-spells.mjs > spell-conformance.json
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const SPEC = path.join(ROOT, 'spec', 'spells.json');
const HALL = process.env.HALL_URL || 'https://amenti-mint.ingram-ian.workers.dev/hall';

const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };
const json = p => { const t = read(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };
const exists = p => fs.existsSync(path.join(ROOT, p));

/* ── ACCEPTED SPENDERS, AND WHY ───────────────────────────────────────────
   A ruling the captain made, recorded beside the check so it is not re-argued
   every run. An acceptance with no reasoning is a rubber stamp, and a register
   that confirms everything means nothing — so each entry names WHAT it permits
   and WHY the spell is not violated.

   THE SPELL IS ABOUT COST AND MUTATION, NOT ABOUT VERBS. "A probe that can
   spend can cause the outage it measures for." A write that cannot mutate and
   a render that stops after one are neither. The first cut of this check
   counted write verbs, which is a different question and a worse one.

   ADDING TO THIS TABLE IS A DECISION. A new spender in a new probe still
   fires, and should. */
const SPENDERS_ACCEPTED = {
  'probes/probe-watches.mjs': {
    on: '2026-08-17',
    writes: 4,
    why: [
      'DATA WATCH · PATCH subscribers?id=eq.<nil UUID> — targets an id that CANNOT '
      + 'EXIST, so zero rows match and zero rows change whatever RLS decides. It is '
      + 'not testing whether the write works; it is testing whether RLS LETS IT TRY. '
      + 'This is the check that found `using (true)` on the unsub policy.',
      'TREASURY WATCH · POST /quiz/submit with a deliberately forged session — the '
      + 'refusal IS the reading. A probe that only sent valid sessions would prove '
      + 'nothing about the door.',
      'COST WATCH · POST /speak twice, one normal chunk and one 10,000-character '
      + 'payload. The small one costs a fraction of a cent; the large one must be '
      + 'REFUSED by the wall and costs nothing when the wall holds.',
      'ARCHIVE WATCH · POST /speak up to six times, and ABORTS ON THE FIRST MISS. '
      + 'Its own comment states the reason: six renders every six hours would be '
      + '"a cost loop with a light on it, built by the instrument that exists to '
      + 'prevent one." The abort is the guard the spell asks for.',
    ],
  },
};

/* ── SOURCE, WITH THE COMMENTARY TAKEN OUT ────────────────────────────────
   Every check that scans source text must read the CODE, not the prose about
   the code. Found the hard way: the spend-check flagged THIS FILE, three
   times, because the block explaining what the check catches wrote its own
   examples out literally —

       method: "POST"        FLAGGED
       method: 'PATCH'       FLAGGED

   The file was clean. Then I documented the check, and the documentation
   tripped it. A comment added to make an instrument honest made it report a
   violation that did not exist.

   That is the fault in its purest form: not a wrong answer, a CONFIDENT one,
   about a thing nobody had looked at. So comments come out before any grep. */
function code(t) {
  return String(t || '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   /* block comments */
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 '); /* line comments, not :// in a URL */
}

/* the one slug rule, carried in three languages now — tools/plates.js,
   ingest.py, and here. If one changes all three must. */
const slug = s => String(s).toLowerCase()
  .replace(/[.'\u2019]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ── THE HALL, READ ONCE ─────────────────────────────────────────────────
   One GET. If it fails, every spell that depends on it comes back UNREACHABLE
   rather than CONFIRMED — an absence must never read as an agreement. That is
   the Signed-Out Phantom, and it has been committed in this codebase four
   times by four different hands. */
let hall = null, hallErr = null;
try {
  const r = await fetch(HALL, { headers: { accept: 'application/json' } });
  if (!r.ok) hallErr = 'HTTP ' + r.status;
  else hall = await r.json();
} catch (e) { hallErr = String(e && e.message || e); }

const results = [];
const add = (id, stamp, saw, note) => results.push({ id, stamp, saw, note: note || null });

/* ══ THE CHECKS ═══════════════════════════════════════════════════════════ */

/* no-prosecutor — the filing is a locator, and a locator has no finite verb.
   Three sentences about Caesar can all be true, describe one act, and take
   opposite sides. So the docket carries fields, not prose. */
(() => {
  if (!hall) return add('no-prosecutor', 'UNREACHABLE', hallErr,
    '/hall could not be read, so the filings could not be inspected');
  const cases = (hall.docket && hall.docket.cases) || [];
  if (!cases.length) return add('no-prosecutor', 'UNPROVEN', '0 cases on the docket',
    'nothing to inspect — an empty docket cannot demonstrate the rule either way');
  /* a locator is key · title · era · domain · motif. A VERB in the title is the
     tell: "Caesar at the Rubicon" passes; "Caesar crossed the Rubicon" does not. */
  const VERBS = /\b(crossed|killed|betrayed|saved|destroyed|founded|abandoned|seized|refused|chose|broke|led|defied|burned|conquered|surrendered|murdered|freed|stole|lied)\b/i;
  const bad = cases.filter(c => VERBS.test(String(c.title || '')));
  add('no-prosecutor',
      bad.length ? 'CONTRADICTED' : 'CONFIRMED',
      cases.length + ' filings inspected, ' + bad.length + ' carrying a finite verb',
      bad.length ? bad.slice(0, 5).map(c => c.id + ': ' + c.title).join(' · ')
                 : 'every filing reads as a locator — key, title, era, domain, motif');
})();

/* ammit-is-a-boundary — the roster answers ONE question. In or out. It may
   carry identity and craft; it may not carry a judgement. */
(() => {
  const csv = read('names.csv');
  if (!csv) return add('ammit-is-a-boundary', 'UNREACHABLE', 'names.csv not found');
  const head = (csv.split(/\r?\n/)[0] || '').toLowerCase();
  /* ── RANK IS AN ORDERING, NOT A VERDICT ──────────────────────────────────
     The roster carries a `rank` column holding 1 to ~1000. The first cut of
     this check called it a judgement and contradicted the spell.

     It is not one. It is BUILD ORDER — where a row landed while the list was
     being assembled. Row 47 is not better than row 900. Ammit's rule forbids
     the roster from JUDGING, and a sort key does not judge; it sorts. Same
     distinction the ocean view needed for its crew ring: an ordering, not a
     station.

     Accepted 17 August 2026 by the captain, and recorded here so the check
     stops raising a settled question. A register that re-asks what has been
     answered teaches its reader to skim, and skimming is how a live finding
     gets lost among the closed ones. */
  const JUDGE = ['score', 'grade', 'tier', 'verdict', 'rating', 'moral', 'worth'];
  const found = JUDGE.filter(w => new RegExp('(^|,)\\s*"?' + w).test(head));
  const hasRank = /(^|,)\s*"?rank/.test(head);
  add('ammit-is-a-boundary',
      found.length ? 'CONTRADICTED' : 'CONFIRMED',
      'header: ' + head.slice(0, 120),
      found.length ? 'judgement columns present: ' + found.join(', ')
                   : 'identity and craft only. Being off the list is not damnation and being on it is not approval.'
                     + (hasRank ? ' `rank` is present and ACCEPTED: build order, not a verdict — an ordering, not a station.' : ''));
})();

/* one-slug-rule — every surface reduces a name the same way. wd-gann was one
   character; einstein-albert is word order; gw-winter was a scene mistaken for
   a man. Three incidents, one missing rule. */
(() => {
  const csv = read('names.csv');
  const plates = json('img/PLATES.json');
  if (!csv || !plates) return add('one-slug-rule', 'UNREACHABLE', 'names.csv or PLATES.json not found');

  const lines = csv.split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',').map(s => s.trim().toLowerCase());
  const col = ['key', 'full name', 'name'].map(w => head.indexOf(w)).find(i => i > -1);
  if (col === undefined) return add('one-slug-rule', 'UNREACHABLE', 'no identity column in names.csv');

  const roster = new Set(lines.slice(1).map(l => slug((l.split(',')[col] || ''))).filter(Boolean));
  const keys = Object.keys(plates.keys || {}).filter(k => Object.keys(plates.keys[k].variants || {}).length);
  const orphan = keys.filter(k => !roster.has(slug(k)));

  /* an ACCEPTED entry in PLATES.json is a ruling the captain already made.
     A register that re-raises a settled question teaches its reader to skim. */
  const accepted = new Set(((plates.gaps && plates.gaps.accepted) || []).map(a => a.key));
  const open = orphan.filter(k => !accepted.has(k));

  /* ── THE ALIAS MAP IS THE CONVENTION, NOT DRIFT ─────────────────────────
     caesar · lincoln · tesla · musashi · gandhi · seneca · shaka · hannibal ·
     cleopatra · gutenberg · lycurgus · cromwell — every one of these is a
     SHORT-FORM plate key against a full-name roster row, and the proxy carries
     an alias map for exactly that: gaius-julius-caesar -> caesar,
     abraham-lincoln -> lincoln, miyamoto-musashi -> musashi.

     The first cut of this check called all twelve drift. They are not. A
     single-word key for a figure the world knows by one word is the rule the
     ship actually uses, and a check that condemns the convention is measuring
     against a spec nobody wrote — the third time this file has done that.

     So a plate key resolves if the roster holds it OR holds a name ENDING in
     it. `caesar` matches `gaius-julius-caesar`. `washington` does not match
     `george-washington` cleanly enough to be safe — two Washingtons are on the
     roster — and that ambiguity is worth reporting rather than resolving. */
  const suffix = k => [...roster].some(r => r === k || r.endsWith('-' + k));
  const ambiguous = k => [...roster].filter(r => r.endsWith('-' + k)).length > 1;
  const aliased = open.filter(k => suffix(k) && !ambiguous(k));
  const real = open.filter(k => !suffix(k) || ambiguous(k));

  add('one-slug-rule',
      real.length ? 'CONTRADICTED' : 'CONFIRMED',
      keys.length + ' plate keys against ' + roster.size + ' roster keys, both slugged'
        + (aliased.length ? ' · ' + aliased.length + ' resolved by short form' : ''),
      real.length
        ? 'unmatched: ' + real.join(' · ')
          + '. A key that matches NO roster row, or matches more than one, cannot be '
          + 'resolved by convention — that is drift, or a scene filed as a figure.'
        : (aliased.length
            ? 'every plate key resolves. ' + aliased.length + ' by short form '
              + '(' + aliased.slice(0, 6).join(', ') + (aliased.length > 6 ? ' …' : '') + ') '
              + '— the alias map is the convention, not drift.'
            : 'every plate key resolves to a roster row'));
})();

/* scene-inherits-authority — a scene belongs to a figure or it has none.
   Already enforced by tools/plates.js; this reads its report. */
(() => {
  const p = json('img/PLATES.json');
  if (!p) return add('scene-inherits-authority', 'UNREACHABLE', 'PLATES.json not found');
  const g = p.gaps || {};
  const noFig = (g.scenesWithoutFigure || []).length;
  const bad = (g.scenesMalformed || []).length;
  const sceneInGaps = Object.values(g.missingByVariant || {}).flat().filter(k => String(k).includes('--')).length;
  const total = noFig + bad + sceneInGaps;
  add('scene-inherits-authority',
      total ? 'CONTRADICTED' : 'CONFIRMED',
      (p.totals && p.totals.scenes || 0) + ' scenes · ' + noFig + ' without a figure · ' + bad + ' malformed',
      total ? 'a scene with no owner cannot be verified, and the grammar forbids it'
            : 'every scene resolves to a roster figure; no scene counted as an incomplete figure');
})();

/* amenti-cannot-be-lost — the authorities exist as files, and MANIFEST.json
   has exactly one owner. */
(() => {
  const want = ['names.csv', 'library', 'img/MANIFEST.json', 'img/PLATES.json', 'spec/spells.json'];
  const missing = want.filter(p => !exists(p));
  /* tools/plates.js must READ the manifest and never WRITE it */
  const gen = read('tools/plates.js') || '';
  const writesManifest = /writeFileSync\([^)]*MANIFEST\.json/.test(gen);
  add('amenti-cannot-be-lost',
      (missing.length || writesManifest) ? 'CONTRADICTED' : 'CONFIRMED',
      (want.length - missing.length) + ' of ' + want.length + ' authorities present',
      missing.length ? 'missing: ' + missing.join(', ')
        : writesManifest ? 'tools/plates.js writes MANIFEST.json — that file has one owner and it is the Python pipeline'
        : 'every authority is a file in the repo; the manifest is read and never written here');
})();

/* the-fiction-stays-downstream — every room names its source and its problems.
   Budge is 1890s and superseded. Livy writes seven centuries after. */
(() => {
  const dir = path.join(ROOT, 'library');
  if (!fs.existsSync(dir)) return add('the-fiction-stays-downstream', 'UNREACHABLE', 'no library/');
  const cats = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (!cats.length) return add('the-fiction-stays-downstream', 'UNREACHABLE', 'no catalogs in library/');
  const NOTE = /(source|provenance|translat|edition|problem|caveat|superseded|note)/i;
  const silent = cats.filter(f => {
    const t = read(path.join('library', f));
    return !t || !NOTE.test(t);
  });
  add('the-fiction-stays-downstream',
      silent.length ? 'CONTRADICTED' : 'CONFIRMED',
      cats.length + ' room catalogs, ' + silent.length + ' with no source note',
      silent.length ? 'no source note: ' + silent.slice(0, 8).join(', ') + (silent.length > 8 ? ' …' : '')
                    : 'every room names where its texts come from');
})();

/* the-probe-may-not-spend — probes and tools are GET/HEAD only. The proxy's
   fifteen POSTs to Anthropic are the GENERATOR and are out of scope; a rule
   scoped wide enough to condemn the engine teaches its reader to ignore it.

   ── THIS CHECK IS A PATTERN, AND A PATTERN CAN BE WALKED PAST ────────────
   Found by probing this file before it shipped. The detector matches the
   literal form:

       method: "POST"        FLAGGED
       method: 'PATCH'       FLAGGED
       method:  "DELETE"     FLAGGED

   and does not match a method held in a variable:

       const m = "POST"; fetch(u, { method: m });      PASSES

   Nobody writes that by accident, and every probe in this fleet uses the
   literal form. But the spell says a probe MAY NOT SPEND, and a check that can
   be evaded while returning CONFIRMED is the exact shape this specification
   exists to catch — `sealed: 1` over a freeze that 400'd, a cron registered
   for the wrong day, a font named and never loaded.

   SO THE READING SAYS WHAT IT IS. A CONFIRMED here means "no literal write
   appears in these files", which is a smaller claim than "no probe spends",
   and the difference is stated rather than left for a reader to assume.

   A grep that admits it is a grep is worth more than an analysis that
   overstates itself. */
(() => {
  const dirs = ['probes', 'tools'].filter(d => exists(d));
  if (!dirs.length) return add('the-probe-may-not-spend', 'UNREACHABLE', 'no probes/ or tools/');
  const offenders = [], harnesses = [], accepted = [];
  let files = 0;
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (!/\.(mjs|js|cjs)$/.test(f)) continue;
      files++;
      const raw = read(path.join(d, f)) || '';
      const t = code(raw);

      /* ── A HARNESS IS NOT A PROBE ──────────────────────────────────────
         probe11.mjs POSTs four times — to a FAKE worker, through a stubbed
         globalThis.fetch, with a Map standing in for KV. Nothing leaves the
         process and nothing is billed. It was flagged as a spender because
         the check counted the SHAPE of a request rather than asking where it
         goes.

         A file that replaces globalThis.fetch, or imports a worker module to
         call directly, is testing. The spell governs probes that reach the
         live system; it says nothing about a simulation. */
      const isHarness = /globalThis\.fetch\s*=/.test(t)
                     || /import\s+worker\s+from/.test(t)
                     || /worker\.fetch\s*\(/.test(t);

      const m = t.match(/method:\s*['"](POST|PATCH|PUT|DELETE)['"]/g);
      if (!m) continue;
      const rel = d + '/' + f;
      const ruled = SPENDERS_ACCEPTED[rel];
      if (isHarness) harnesses.push(rel + ' (' + m.length + ' simulated)');
      else if (ruled) accepted.push({ file: rel, found: m.length, ...ruled });
      else offenders.push(rel + ' (' + m.length + ')');
    }
  }
  /* AN ACCEPTED SPENDER IS STILL COUNTED. It is not hidden from the reading —
     hiding it would make this file a claim rather than a register. It simply
     does not contradict, because a ruling was made and written down. */
  add('the-probe-may-not-spend',
      offenders.length ? 'CONTRADICTED' : 'CONFIRMED',
      files + ' files scanned in ' + dirs.join(', ') + ', comments excluded'
        + (harnesses.length ? ' · ' + harnesses.length + ' harness set aside' : '')
        + (accepted.length ? ' · ' + accepted.length + ' accepted spender'
            + (accepted.length === 1 ? '' : 's') : ''),
      offenders.length
        ? 'unruled writes in: ' + offenders.join(' · ')
          + '. Either the probe should not write, or the write is bounded and belongs '
          + 'in SPENDERS_ACCEPTED with its reasoning.'
        : 'no unruled write in any probe.'
          + (harnesses.length ? ' Simulated, against a stubbed fetch: ' + harnesses.join(' · ') + '.' : '')
          + (accepted.length ? ' Accepted ' + accepted.map(a => a.file + ' (' + a.found + ', ruled ' + a.on + ')').join(' · ')
              + ' — bounded writes, each named: ' + accepted.flatMap(a => a.why).length + ' reasons on record.' : '')
          + ' NOTE THE SIZE OF THIS CLAIM: the check is a pattern over source with '
          + 'comments stripped, so a method held in a variable would pass it. '
          + 'A known limit of the instrument, stated rather than assumed.');
})();

/* the-bell-leaves-a-mark — /hall carries lastBell beside settlesAt. settlesAt
   is a PROMISE computed from today and will assert a confident next Monday
   forever, rung or not. lastBell is what actually happened. null means never. */
(() => {
  if (!hall) return add('the-bell-leaves-a-mark', 'UNREACHABLE', hallErr);
  const hasPromise = 'settlesAt' in hall;
  const hasRecord = 'lastBell' in hall;
  add('the-bell-leaves-a-mark',
      (hasPromise && hasRecord) ? 'CONFIRMED' : 'CONTRADICTED',
      'settlesAt: ' + (hasPromise ? 'present' : 'ABSENT') + ' · lastBell: ' + (hasRecord ? (hall.lastBell === null ? 'null — never rung' : 'present') : 'ABSENT'),
      hasRecord ? 'the promise and the record are distinguishable from outside'
                : 'without lastBell, a cron that fired and one that never existed look identical');
})();

/* unheard-is-not-hung — zero votes writes no verdict. A case does not leave
   the docket by being ignored. Readable from /hall's own unheard list. */
(() => {
  if (!hall) return add('unheard-is-not-hung', 'UNREACHABLE', hallErr);
  const unheard = hall.unheard || [];
  const verdicts = hall.verdicts || [];
  const zeroVote = verdicts.filter(v => Number(v.votes) === 0);
  add('unheard-is-not-hung',
      zeroVote.length ? 'CONTRADICTED' : 'CONFIRMED',
      verdicts.length + ' verdicts · ' + unheard.length + ' cases recorded unheard · ' + zeroVote.length + ' verdicts on zero votes',
      zeroVote.length ? 'a verdict exists where nobody staked anything: ' + zeroVote.map(v => v.topicId).join(', ')
        : (unheard.length ? 'passed-over cases are recorded as sittings and return to the docket'
                          : 'no verdict rests on zero votes; nothing has yet been passed over'));
})();

/* ── THE SPELLS NO PROBE CAN ANSWER ───────────────────────────────────────
   Stated, not skipped. A probe that guessed at these would be inventing, and a
   register that invents is the fault the whole specification exists to catch.
   These print UNPROVEN forever and that is the correct reading. */
const MANUAL = {
  'two-voices': 'Nothing can measure whether a summons leaned. A probe could confirm the summons and the register are generated by separate code paths; it cannot read tone.',
  'valhalla-opens-outward': 'A probe can confirm the herald contains no write to the register. It cannot prove the absence of a path it does not know to look for.',
  'the-reading-is-never-typed': 'A probe can confirm a pane fetches a reading and has an empty-glass state. It cannot tell a hand-typed number from a read one without reading every line.',
  'the-feather-and-the-vote': 'Not a failure and not a pass. Ma\u2019at\u2019s feather does not care how many are watching; the pool settles by vote. Carried deliberately, printed so it cannot be quietly forgotten or quietly resolved.',
};

/* ── THE SPELLS THAT LIVE IN THE WORKER SOURCE ────────────────────────────
   Amenti-Workers is a different repo and this probe runs in Amenti.live. Said
   plainly rather than passed. */
const OFFSHIP = {
  'silenced-not-damned':      'DENY lives in amenti-proxy',
  'staff-take-no-byline':     'COURT_STAFF lives in amenti-proxy',
  'declaration-once':         'the confession key lives in amenti-proxy',
  'declaration-not-defence':  'the confession record lives in amenti-proxy',
  'the-seal-verifies':        'sealCharges lives in amenti-mint',
  'the-manifest-gate':        'the herald\u2019s gate lives outside this repo',
  'hades-keeps-nothing':      'the KV writes live in amenti-proxy',
  'an-incomplete-reading-is-refused': 'getTopics lives in amenti-mint',
};

/* ── ASSEMBLE ─────────────────────────────────────────────────────────────
   Every spell in the spec gets a row. A spell the probe forgot would otherwise
   vanish silently, and a specification with a hole in it looks complete. */
const spec = json('spec/spells.json');
if (!spec || !Array.isArray(spec.spells)) {
  console.error('REFUSES: spec/spells.json could not be read. There is nothing to measure against.');
  process.exit(2);
}

const byId = Object.fromEntries(results.map(r => [r.id, r]));
const rows = spec.spells.map(s => {
  if (byId[s.id]) return { ...byId[s.id], title: s.title, source: s.source };
  if (MANUAL[s.id]) return { id: s.id, title: s.title, source: s.source, stamp: 'UNPROVEN', saw: 'not measurable', note: MANUAL[s.id] };
  if (OFFSHIP[s.id]) return { id: s.id, title: s.title, source: s.source, stamp: 'UNREACHABLE', saw: 'off-ship', note: OFFSHIP[s.id] + ' — mirrored in Amenti-Workers, not readable from here' };
  return { id: s.id, title: s.title, source: s.source, stamp: 'UNPROVEN', saw: 'no check written',
           note: 'This spell is in the specification and NOTHING IN THIS PROBE LOOKS AT IT. Not a pass.' };
});

const tally = rows.reduce((t, r) => (t[r.stamp] = (t[r.stamp] || 0) + 1, t), {});

console.log(JSON.stringify({
  _: 'GENERATED by probes/probe-spells.mjs — do not edit. The ship, measured against spec/spells.json.',
  _law: 'An UNPROVEN spell is the honest reading, not a gap. A probe that guessed would be inventing.',
  generated: new Date().toISOString(),
  spec: spec.version || null,
  hall: hall ? 'read' : ('UNREACHABLE: ' + hallErr),
  totals: {
    spells: rows.length,
    confirmed: tally.CONFIRMED || 0,
    contradicted: tally.CONTRADICTED || 0,
    unproven: tally.UNPROVEN || 0,
    unreachable: tally.UNREACHABLE || 0,
  },
  spells: rows,
}, null, 2));

/* A CONTRADICTION FAILS THE RUN. Unproven and unreachable do not — they are
   states of the instrument, not of the ship. */
if ((tally.CONTRADICTED || 0) > 0) process.exitCode = 1;
