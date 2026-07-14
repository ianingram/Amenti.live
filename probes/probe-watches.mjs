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
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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

  /* ── THE WRITE DOOR ──────────────────────────────────────────────────────
     DATA WATCH TESTED THE READ DOOR FOR MONTHS. IT NEVER TESTED THE WRITE DOOR.

     "subscribers: sealed (200, 0 rows)" is TRUE — and it is guarding a door
     nobody was trying. That is the Signed-Out Phantom in a new costume: zero
     rows looked exactly like safety.

     The table ships with this policy:

         create policy "unsub by token" on public.subscribers
           for update to anon
           using (true)                                    <- ANY ROW
           with check (status in ('active','unsubscribed'))  <- constrains STATUS ONLY

     USING gates which rows you may touch. WITH CHECK gates what the row may
     become. That check says NOTHING about `email`. If this policy is live, the
     anon key — WHICH SHIPS IN EVERY PAGE'S SOURCE — can rewrite the email
     address of every subscriber on the list, and the next VAL·HAL·LA goes to
     whoever they choose.

     I READ THAT IN A FILE AND CALLED IT A HOLE. That is inferring intent from
     code, which is the error this entire fleet exists to prevent. So this does
     not assume. IT KNOCKS.

     ⚠ NON-DESTRUCTIVE BY CONSTRUCTION.
     The filter targets an id that CANNOT EXIST — the nil UUID. Zero rows match,
     so zero rows change, no matter what RLS decides. We are not testing whether
     the update WORKS. We are testing whether RLS LETS US TRY.

         401 / 403  -> RLS refused the write. The door is shut.
         204 / 200  -> RLS PERMITTED IT. Nothing changed (no row matched) —
                       BUT A REAL FILTER WOULD HAVE GONE THROUGH.
     ──────────────────────────────────────────────────────────────────────── */
  const NIL = '00000000-0000-0000-0000-000000000000';
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/subscribers?id=eq.${NIL}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'active' }),   /* a no-op value, on a row that cannot exist */
    });

    if (r.status === 401 || r.status === 403 || r.status === 404) {
      findings.ok++;
      notes.push(`subscribers: WRITE-SEALED (${r.status})`);
    } else if (r.status === 204 || r.status === 200) {
      findings.fail.push(
        'THE ANON KEY MAY WRITE TO `subscribers` (' + r.status + '). ' +
        'The "unsub by token" policy uses `using (true)` and never checks the token. ' +
        'Nothing was changed by this probe — the nil UUID matches no row — BUT A REAL ' +
        'FILTER WOULD HAVE GONE THROUGH. With the public key alone, anyone can ' +
        'unsubscribe your entire list, or REWRITE EVERY SUBSCRIBER EMAIL and redirect ' +
        'the newsletter. DROP THAT POLICY. Do the unsubscribe through a SECURITY ' +
        'DEFINER function that takes the token and can do nothing else.');
    } else {
      findings.warn.push(`subscribers: write door returned ${r.status} — cannot judge`);
    }
  } catch (e) {
    findings.warn.push('subscribers: write door unreachable (' + e.message + ')');
  }

  const status = findings.fail.length ? 'FAIL' : (findings.warn.length ? 'WARN' : 'OK');
  return { id: 'DATA WATCH', status, ...findings,
    note: findings.fail.length
      ? 'AN OPEN DOOR. ' + findings.fail.join('; ')
      : (findings.warn.length ? notes.concat(findings.warn).join(' · ')
                              : 'the anon key can neither READ nor WRITE the sealed tables: ' + notes.join(' · ')) };
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

/* ── ARCHIVE WATCH ──────────────────────────────────────────────────────────
   THE WORKER LIVES IN CLOUDFLARE. It is not in this repository. No scanner can
   read its source, and the audio cache key

       audioKey = sha256(TTS_MODEL + voice + STYLE + TEXT)

   therefore CANNOT BE VERIFIED BY LOOKING. It can only be verified by SPEAKING
   A KNOWN THING AND ASKING WHETHER THE ENGINE REMEMBERS IT.

   That is the canonical passage. 933 chars, frozen, sha 27e9c5af. Fired through
   both live chunk profiles — six measures, six keys, six wires:

       recital  320  ->  4 measures   the reading room, Page1, the archive
       gabriel  700  ->  2 measures   Page2's profile

   THE MISS PATTERN IS THE DIAGNOSIS
       all six ......... TTS_MODEL or VOICE_REGISTER moved
       the four 320s ... the recital chunker moved
       the two 700s .... Page2's profile moved
       one measure ..... splitSentences or plainText moved

   IT USES THE REAL ENGINE. amenti-voice.js is loaded and asked to chunk. A
   second copy of the chunker in this file is EXACTLY how an archive forks.

   THE COST CIRCUIT BREAKER — read this before you touch it:
     Every hit is free. But a MISS RENDERS. If the archive ever drifts and this
     probe fired all six wires every six hours, it would re-render six clips,
     four times a day, forever — a cost loop with a light on it, built by the
     instrument that exists to prevent one.

         SO IT ABORTS ON THE FIRST MISS. One render, then it stops and screams.

   FAILS SAFE: unreachable is WARN (amber), never FAIL. Only a CONFIRMED miss is
   a FAIL. A network hiccup must not turn the manifest red.
   ─────────────────────────────────────────────────────────────────────────── */
async function archiveWatch() {
  const findings = { ok: 0, warn: [], fail: [] };
  const notes = [];

  let V, C;
  try {
    /* Load the SHIP'S OWN engine. Not a re-implementation of it. */
    globalThis.window = globalThis;
    const root = new URL('../', import.meta.url);
    new Function(readFileSync(new URL('amenti-voice.js', root), 'utf8'))();
    new Function(readFileSync(new URL('amenti-canonical.js', root), 'utf8'))();
    V = globalThis.Amenti && globalThis.Amenti.voice;
    C = globalThis.Amenti && globalThis.Amenti.canonical;
    if (!V || !C) throw new Error('engine or canonical did not mount');
  } catch (e) {
    return { id: 'ARCHIVE WATCH', status: 'WARN', ok: 0, warn: ['could not load the engine: ' + e.message], fail: [],
      note: 'THE INSTRUMENT COULD NOT BE ARMED: ' + e.message + ' — amber, honestly.' };
  }

  /* The lock. If the passage moved, every key moved with it. */
  const sha = createHash('sha256').update(C.TEXT, 'utf8').digest('hex');
  if (sha !== C.SHA256) {
    return { id: 'ARCHIVE WATCH', status: 'FAIL', ok: 0, warn: [], fail: ['THE CANONICAL PASSAGE HAS BEEN EDITED'],
      note: 'THE PASSAGE MOVED. declared ' + C.SHA256.slice(0, 12) + ', actual ' + sha.slice(0, 12) + '. ' +
            'Six clips are now orphaned in R2 and the only instrument that can see the cache key is BLIND. ' +
            'Restore the text, or re-render deliberately and re-lock the hash.' };
  }

  /* The style and voice, resolved by the ENGINE. Figure '' -> Kore + the locked
     register, whether or not the roster loads — map[''] is undefined either way,
     so the key is identical in Node and in the browser. */
  const res = await V.resolveVoice('').catch(() => null);
  const voice = (res && res.voice) || 'Kore';
  const style = (res && res.style) || '';
  if (!style) findings.warn.push('the engine returned no style — the key may not match the browser');

  const textOf = (c) => (c && c.text != null) ? c.text : c;
  const jobs = [];
  for (const p of C.WIRES) {
    const ms = (C.measures(p) || []).map(textOf);
    ms.forEach((text, i) => jobs.push({ profile: p, m: (i + 1) + '/' + ms.length, text }));
  }
  if (jobs.length !== 6) findings.warn.push('expected 6 wires, the engine cut ' + jobs.length);

  let hits = 0, rendered = 0;
  for (const j of jobs) {
    let r;
    try {
      r = await fetch(C.VOICE_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://amenti.live' },
        body: JSON.stringify({ text: j.text, style, voice }),
      });
    } catch (e) {
      findings.warn.push('/speak unreachable: ' + e.message);
      break;                                   /* unreachable is amber, never red */
    }

    if (!r.ok) { findings.warn.push('/speak ' + r.status + ' on ' + j.profile + ' ' + j.m); break; }

    const hdr = (r.headers.get('x-amenti-cache') || '').toLowerCase();
    try { await r.arrayBuffer(); } catch (e) {}

    if (!hdr) { findings.warn.push('x-amenti-cache not exposed — cannot judge the archive'); break; }

    if (hdr === 'hit') { hits++; continue; }

    /* ── A MISS. THE CACHE KEY HAS MOVED. STOP. ────────────────────────────
       Do NOT fire the other wires. One render is a finding; six renders every
       six hours is a bill. */
    rendered++;
    findings.fail.push('DRIFT at ' + j.profile + ' ' + j.m + ' (' + j.text.length + 'ch) — cache said "' + hdr + '"');
    break;
  }

  if (findings.fail.length) {
    return { id: 'ARCHIVE WATCH', status: 'FAIL', ok: hits, warn: findings.warn, fail: findings.fail,
      note: 'THE ARCHIVE HAS FORKED. ' + hits + '/6 hit, then ' + findings.fail[0] + '. ' +
            'ABORTED after 1 render — the remaining wires were NOT fired, because a drifting archive ' +
            'that keeps firing is a cost loop. Something moved the cache key: the model string, ' +
            'VOICE_REGISTER, composeStyle, chunkText, or a chunk PROFILE. Find it before the next render.' };
  }

  if (hits === jobs.length && jobs.length === 6) {
    findings.ok = 6;
    notes.push('6/6 HIT · 0 renders · $0.00 · passage ' + C.SHA256.slice(0, 12));
    notes.push('the model string, the voice, the style string and BOTH chunkers are unchanged');
    return { id: 'ARCHIVE WATCH', status: 'OK', ...findings, note: notes.join(' · ') };
  }

  return { id: 'ARCHIVE WATCH', status: 'WARN', ok: hits, warn: findings.warn, fail: [],
    note: 'COULD NOT PROVE IT: ' + hits + '/6 hit — ' + (findings.warn.join(' · ') || 'incomplete') + '. Amber, honestly.' };
}

/* ── PATROL ─────────────────────────────────────────────────────────────────
   Make the rounds. Write down what was seen. Timestamp it. */
const watches = {};
for (const w of [await costWatch(), await dataWatch(), await treasuryWatch(), await hullWatch(), await archiveWatch()]) {
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
