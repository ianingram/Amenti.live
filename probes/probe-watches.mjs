/* ============================================================================
   probes/probe-watches.mjs   ·   THE WATCH PROBE

   DATA · TREASURY · HULL — one instrument, three watches. They are the same
   question in three costumes: DOES THE WORLD MATCH THE CLAIM?

   ── WHY THIS EXISTS ────────────────────────────────────────────────────────
   The old manifest carried  DATA WATCH: 'verified ✓ — anon reads blocked'.
   NO PROBE EXISTED. It was a memory of a manual browser check from a session
   nobody can name — an unverifiable claim rendered as a verified fact,
   MANUFACTURING CONFIDENCE THAT NOBODY HAD EARNED.

   This is the instrument that check needed and never had.

   ── AND THE THING THAT MAKES IT HONEST ─────────────────────────────────────
   A probe that EXISTS but has NEVER RUN is still a prayer. So this does not
   just check — it WRITES DOWN WHAT IT SAW, to fleet-patrol.json, with a
   timestamp. merge.js reads that record. If the patrol is stale or missing,
   the watch is UNPROVEN — amber — no matter that the probe file exists.

       THE PROBE IS THE INSTRUMENT. THE PATROL RECORD IS THE READING.

   ── HOW IT IS RUN ──────────────────────────────────────────────────────────
   In CI, on a schedule (see .github/workflows/patrol.yml):
       node probes/probe-watches.mjs > fleet-patrol.json

   It needs the network. It reads ONLY public, in-the-browser values — the
   Supabase anon key is meant to be public; the RLS wards are what protect the
   data, and THIS PROBE EXISTS TO CONFIRM THEY DO.
   ============================================================================ */

/* Public by design — these ship in every page's source. The anon key is not a
   secret; the row-level security policy is the wall, and we are testing the wall. */
const SUPABASE_URL = 'https://bhgnkfsatmcnhqksybpa.supabase.co';
const ANON_KEY = process.env.AMENTI_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';   // overridden in CI; the real one is in the page
const MINT = 'https://amenti-mint.ingram-ian.workers.dev';

const H = { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY };

async function GET(url, opts = {}) {
  try {
    const r = await fetch(url, { headers: H, ...opts });
    let body = null;
    try { body = await r.json(); } catch (e) { body = await r.text().catch(() => null); }
    return { status: r.status, ok: r.ok, body };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

const rows = (b) => Array.isArray(b) ? b.length : (b && b.length) || 0;

/* ── DATA WATCH ─────────────────────────────────────────────────────────────
   THE THREAT: the public anon key reading private subscriber data.
   THE TEST:   ask, as anon, for the protected tables. RLS must return NOTHING.
               A table that hands back rows to a bare anon key is an OPEN DOOR. */
async function dataWatch() {
  const findings = { ok: 0, warn: [], fail: [] };
  const notes = [];

  /* Tables that MUST be sealed to anon. If any returns rows, that is a leak. */
  const SEALED = ['subscribers', 'emerald_balance', 'argument_reports'];
  for (const t of SEALED) {
    const r = await GET(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=5`);
    if (r.status === 0) { findings.warn.push(`${t}: unreachable (${r.error})`); continue; }
    /* 401/403, or 200 with an empty array, both mean the ward holds. */
    const sealed = r.status === 401 || r.status === 403 || (r.ok && rows(r.body) === 0);
    if (sealed) { findings.ok++; notes.push(`${t}: sealed (${r.status}${r.ok ? ', 0 rows' : ''})`); }
    else {
      findings.fail.push(`${t}: LEAKED ${rows(r.body)} row(s) to the anon key — RLS is not blocking anon reads`);
    }
  }

  const status = findings.fail.length ? 'FAIL' : (findings.warn.length ? 'WARN' : 'OK');
  return { id: 'DATA WATCH', status, ...findings,
    note: findings.fail.length
      ? 'ANON CAN READ PRIVATE DATA. ' + findings.fail.join('; ')
      : (findings.warn.length ? notes.concat(findings.warn).join(' · ')
                              : 'every sealed table returned nothing to the anon key: ' + notes.join(' · ')) };
}

/* ── TREASURY WATCH ─────────────────────────────────────────────────────────
   THE THREAT: a forged /quiz/submit minting emeralds without earning them.
   THE TEST:   /quiz/start must NOT leak the answer key; a submit with no valid
               signed session must be REFUSED. */
async function treasuryWatch() {
  const findings = { ok: 0, warn: [], fail: [] };
  const notes = [];

  const start = await GET(`${MINT}/quiz/start?topic=caesar`);
  if (start.status === 0) findings.warn.push('/quiz/start unreachable (' + start.error + ')');
  else {
    const blob = JSON.stringify(start.body || '').toLowerCase();
    const leaks = /"answer"|"correct"|"correctindex"|"solution"|answerkey/.test(blob);
    if (leaks) findings.fail.push('/quiz/start LEAKS the answer key in its response');
    else { findings.ok++; notes.push('/quiz/start returns no answer key'); }
  }

  /* A submit with a bogus session must be rejected — not minted. */
  const forged = await GET(`${MINT}/quiz/submit`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: 'forged-' + Date.now(), answers: [0, 0, 0, 0, 0] }),
  });
  if (forged.status === 0) findings.warn.push('/quiz/submit unreachable');
  else if (forged.status === 200 && /mint|emerald|award|granted/i.test(JSON.stringify(forged.body || ''))) {
    findings.fail.push('/quiz/submit MINTED on a forged session — the ledger is open');
  } else { findings.ok++; notes.push('/quiz/submit refused a forged session (' + forged.status + ')'); }

  const status = findings.fail.length ? 'FAIL' : (findings.warn.length ? 'WARN' : 'OK');
  return { id: 'TREASURY WATCH', status, ...findings,
    note: findings.fail.length ? findings.fail.join('; ')
        : (findings.warn.length ? notes.concat(findings.warn).join(' · ') : notes.join(' · ')) };
}

/* ── HULL WATCH ─────────────────────────────────────────────────────────────
   THE THREAT: tampering, defacement, a malicious commit.
   THE TEST:   this cannot be verified from outside — it is a check of the
               repo's own files against a baseline of hashes. The SCANNER
               already records a sha256 per file in fleet-structure.json; a real
               Hull Watch compares this run's hashes against the last.

   Honest until built: this reports WARN — "instrument stub" — so the watch
   shows amber, not green. A stub that returned OK would be the exact lie DATA
   WATCH was. */
async function hullWatch() {
  return {
    id: 'HULL WATCH', status: 'WARN', ok: 0, warn: ['instrument is a stub'], fail: [],
    note: 'Hull integrity is checked by comparing fleet-structure.json file hashes against a ' +
          'committed baseline. That comparison is not yet wired. Reporting WARN, not OK — ' +
          'a stub that returned green would be the very lie this whole system exists to kill.',
  };
}

/* ── COST WATCH ─────────────────────────────────────────────────────────────
   THE THREAT: looping the open AI endpoints to run up the bill. A curl at
               /speak with a megabyte of text. And the one nobody saw — THE
               FIGURE HEARING ITSELF THROUGH THE SPEAKERS AND REPLYING TO
               ITSELF, ALL NIGHT.
   THE TEST:   the wall must refuse a 10,000-character payload — AND GEMINI
               MUST NEVER BE CALLED. The wall sits in front of the money, not
               behind it. */
async function costWatch() {
  const PROXY = 'https://amenti-proxy.ingram-ian.workers.dev';
  const findings = { ok: 0, warn: [], fail: [] };
  const notes = [];

  const wall = async (body) => {
    try {
      const r = await fetch(PROXY + '/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://amenti.live' },
        body: JSON.stringify(body),
      });
      let j = {}; try { j = await r.json(); } catch (e) {}
      return { status: r.status, reason: r.headers.get('X-Amenti-Wall') || j.error || '' };
    } catch (e) { return { status: 0, reason: 'network: ' + e.message }; }
  };

  /* A normal chunk must still SPEAK. A cap that breaks the voice is worse than none. */
  const good = await wall({ text: 'All Gaul is divided into three parts.', voice: 'Charon',
                            style: 'Read clearly, in a measured, dignified tone' });
  if (good.status === 0) findings.warn.push('/speak unreachable');
  else if (good.status === 413) findings.fail.push('THE CAP REFUSED A NORMAL CHUNK — the voice is broken');
  else if (good.status < 400) { findings.ok++; notes.push('a normal chunk still speaks (' + good.status + ')'); }
  else findings.warn.push('/speak returned ' + good.status + ' on a normal chunk (upstream, not the cap)');

  /* Ten thousand characters of palm tree must be REFUSED. */
  const bad = await wall({ text: 'palm tree '.repeat(1000) });
  if (bad.status === 0) findings.warn.push('/speak unreachable');
  else if (bad.status === 413) { findings.ok++; notes.push('10,000 chars REFUSED by the wall (' + bad.reason + ')'); }
  else findings.fail.push('10,000 CHARS WERE NOT REFUSED (' + bad.status + ') — THE WALL IS NOT UP. ' +
                          'A curl can run up the bill.');

  const status = findings.fail.length ? 'FAIL' : (findings.warn.length ? 'WARN' : 'OK');
  return { id: 'COST WATCH', status, ...findings,
    note: findings.fail.length ? findings.fail.join('; ')
        : (findings.warn.length ? notes.concat(findings.warn).join(' · ') : notes.join(' · ')) };
}

/* ── PATROL ─────────────────────────────────────────────────────────────────
   Make the rounds. Write down what was seen. Timestamp it. */
const watches = {};
for (const w of [await costWatch(), await dataWatch(), await treasuryWatch(), await hullWatch()]) {
  watches[w.id] = w;
}

const patrol = {
  at: new Date().toISOString(),
  by: 'probes/probe-watches.mjs',
  note: 'THE READING for the watches. merge.js reads this. If it is stale or absent, ' +
        'the watch is UNPROVEN — amber — no matter that the probe file exists. ' +
        'A probe that has never run is a prayer.',
  watches,
};

process.stdout.write(JSON.stringify(patrol, null, 2) + '\n');

/* Loud on the log; a FAIL is a real security finding and should fail the patrol. */
const anyFail = Object.values(watches).some(w => w.status === 'FAIL');
for (const w of Object.values(watches)) {
  const mark = w.status === 'OK' ? '✓' : (w.status === 'FAIL' ? '✗' : '⚠');
  process.stderr.write(`  ${mark} ${w.id.padEnd(16)} ${w.status}  — ${w.note}\n`);
}
if (anyFail) {
  process.stderr.write('\n  ✗ A WATCH FAILED. This is a real finding, not a drift. Read it.\n');
  process.exit(1);
}
