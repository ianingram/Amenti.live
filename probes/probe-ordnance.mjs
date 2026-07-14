/* ============================================================================
   probes/probe-ordnance.mjs   ·   THE ORDNANCE PROBE
   ----------------------------------------------------------------------------
   WHAT HAS THE FLEET ACTUALLY FIRED?

   Four tubes publish from this ship, and until tonight NOTHING COULD SEE THEM:

     ATLANTICA      a daily dispatch, in a figure's own voice   ->  atlantica:{figure}:{date}
     THE DAILY PLANET  a daily piece                            ->  (planet keys)
     THE WEEK          the VAL·HAL·LA weekly, assembled          ->  week:{sunday}
     THE PODCAST       …scheduled, and we do not know if it fires

   THE QUESTION NOBODY COULD ASK:
       What went out? What is loaded? WHAT WAS MISSED?

   A schedule that nobody checks is a promise nobody keeps. The Docket
   proclaimed itself on time, to a harbour that was not listening — and the only
   reason we know is that a human happened to look at the date.

       THE TUBE IS THE INSTRUMENT. THE FIRING LOG IS THE READING.

   This asks the Worker's own KV — /feed?prefix= lists every key it has written —
   and writes down what it found, with a timestamp. merge.js folds that into the
   manifest. The Ordnance Bay renders it. If the probe has not run, the bay says
   so: NOT A SINGLE ROUND ACCOUNTED FOR.

   Usage:  node probes/probe-ordnance.mjs > fleet-dispatch.json
   ============================================================================ */

import { readFileSync } from 'node:fs';

const PROXY = 'https://amenti-proxy.ingram-ian.workers.dev';
const H = { Origin: 'https://amenti.live' };

async function GET(path) {
  try {
    const r = await fetch(PROXY + path, { headers: H });
    let body = null;
    try { body = await r.json(); } catch (e) { body = null; }
    return { status: r.status, ok: r.ok, body };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

/* ── dates ──────────────────────────────────────────────────────────────── */
const iso   = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const sundayOf = (d) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return iso(x); };
const daysAgo  = (n) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() - n); return iso(x); };

/* ── THE FIRING LOG ─────────────────────────────────────────────────────────
   /feed?prefix=X lists every KV key under that prefix. That IS the log. Nobody
   has ever read it. */
async function listKeys(prefix) {
  const r = await GET('/feed?prefix=' + encodeURIComponent(prefix));
  if (!r.ok || !r.body || !Array.isArray(r.body.keys)) return null;
  return r.body.keys;
}

/* ── AND THE THING THAT STOPS THE PROBE GUESSING ────────────────────────────
   The first walk reported: 3 keys under `dailyplanet:` and ZERO under `week:`.

   THAT SHOULD BE IMPOSSIBLE. publishWeek() writes week:{sunday} as its FIRST
   ACT, and it is the ONLY thing that ever constructs a dailyplanet: key. If
   three of the latter exist, the former must too.

   So either the week: keys were written and later purged — or THE PROBE IS
   GUESSING PREFIXES AND READING TEA LEAVES.

   Do not guess. ASK WHAT IS ACTUALLY IN THE HOLD. An empty prefix lists every
   key the Worker has ever written. Then GROUP them, and let the shape of the
   data tell us what the tubes are — instead of a list of names I invented. */
async function everyKey() {
  const all = await listKeys('');
  if (!all) return null;
  const groups = {};
  for (const k of all) {
    const p = (k.split(':')[0] || '(no prefix)') + ':';
    (groups[p] = groups[p] || []).push(k);
  }
  return { count: all.length, groups, sample: all.slice(0, 40) };
}

/* ── ATLANTICA ───────────────────────────────────────────────────────────── */
async function atlantica() {
  const keys = await listKeys('atlantica:');
  if (keys === null) return { id: 'ATLANTICA', status: 'WARN', note: 'the feed did not answer — cannot see the tube' };

  /* atlantica:{figure}:{YYYY-MM-DD} — pull the dates out. */
  const rounds = [];
  for (const k of keys) {
    const m = /^atlantica:([^:]+):(\d{4}-\d{2}-\d{2})$/.exec(k);
    if (m) rounds.push({ figure: m[1], date: m[2], key: k });
  }
  rounds.sort((a, b) => b.date.localeCompare(a.date));

  /* A daily tube should have fired every day. Which days are EMPTY? */
  const fired = new Set(rounds.map(r => r.date));
  const misses = [];
  for (let i = 1; i <= 14; i++) { const d = daysAgo(i); if (!fired.has(d)) misses.push(d); }

  const last = rounds[0] || null;
  const lastAgeD = last ? Math.round((Date.parse(iso(today)) - Date.parse(last.date)) / 864e5) : null;

  return {
    id: 'ATLANTICA', cadence: 'daily',
    status: !rounds.length ? 'FAIL' : (lastAgeD > 2 ? 'WARN' : 'OK'),
    fired: rounds.length,
    last: last ? { date: last.date, figure: last.figure } : null,
    lastAgeDays: lastAgeD,
    missedLast14: misses,
    recent: rounds.slice(0, 14),
    note: !rounds.length ? 'NOTHING HAS EVER FIRED FROM THIS TUBE.'
        : `${rounds.length} dispatch(es) in the hold · last ${last.date} (${last.figure})` +
          (misses.length ? ` · MISSED ${misses.length} of the last 14 days` : ' · no gaps in 14 days'),
  };
}

/* ── THE WEEK · VAL·HAL·LA ────────────────────────────────────────────────
   THE TUBE HAS TWO HALVES AND THEY WERE NEVER CONNECTED.

     ASSEMBLED  the issue is built            vallhalla/meta.json
     DELIVERED  the mail actually went out    vallhalla/sent.json

   This probe used to judge the tube by looking for week:{sunday} keys in the
   Worker's KV. THE HERALD DOES NOT WRITE THOSE KEYS. It writes a ledger in the
   repo. So VAL·HAL·LA could have gone out to every subscriber on Sunday and on
   Monday this bay would still have reported:

       "NOTHING HAS EVER FIRED FROM THIS TUBE."

   The instrument would have been looking in the wrong hold. It looks in both now.

   ⚠ THE LOAD IS A COUNT, NEVER A ROLL.
   The Fleet-Documents mirror is a PUBLIC page. DATA WATCH exists precisely to
   prove the subscribers table is sealed from the anon key — so rendering an
   address into the bay would be the exact breach that watch was built to catch,
   committed by the instrument that reports on it.

   So the count is taken with a HEAD request and Prefer: count=exact. It returns
   a NUMBER AND NO ROWS. Not "we are careful not to print the emails" —
   THE REQUEST CANNOT RETURN THEM. Make the wrong thing impossible, not merely
   discouraged. */
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return null; }
}

/* Is the schedule armed, or still commented out with "uncomment when ready"? */
function cronArmed() {
  try {
    const y = readFileSync('.github/workflows/vallhalla-send.yml', 'utf8');
    const m = /^\s*schedule:/m.test(y) && /^\s*-\s*cron:/m.test(y);
    return !!m;
  } catch (e) { return null; }
}

/* THE LOAD. A number. Never a roll. */
async function inboxesArmed() {
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return { count: null, why: 'no service key in this run' };
  try {
    const r = await fetch(URL + '/rest/v1/subscribers?select=id&status=eq.active', {
      method: 'HEAD',                                  /* <- no body. no rows. no emails. */
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Prefer: 'count=exact' },
    });
    if (!r.ok) return { count: null, why: 'supabase ' + r.status };
    const cr = r.headers.get('content-range') || '';   /* "0-11/12" */
    const n = parseInt((cr.split('/')[1] || ''), 10);
    return { count: isNaN(n) ? null : n, why: null };
  } catch (e) { return { count: null, why: 'unreachable' }; }
}

async function theWeek() {
  const thisWeek = sundayOf(today);

  const meta = readJSON('vallhalla/meta.json');
  const sent = readJSON('vallhalla/sent.json');
  const rows = ((sent && sent.weeks) || []).filter(Boolean)
    .map(w => (typeof w === 'string' ? { week_of: w } : w));

  const weeks = rows.map(r => r.week_of).filter(Boolean).sort().reverse();

  /* ── THE ORDNANCE. Rounds loaded, rounds fired. ──────────────────────────
     THIS IS THE WHOLE ANSWER TO "who is on the list", AND IT NEVER ASKS.

       LOADED    how many inboxes are armed and waiting     (a count)
       FIRED     how many weeks have gone out               (a count)
       PACKAGES  how many pieces of mail have been delivered, ever
                 = the sum of the inboxes of every week fired

     A god-view of the subscriber ROLL would have meant editing amenti-mint —
     the one component with no diff, no history and no rollback. It is not
     needed. A tube reports its LOAD and its ROUNDS FIRED. It does not read the
     names off the shells. */
  const packages = rows.reduce((n, r) => n + (Number(r.inboxes) || 0), 0);
  const last = rows.length ? rows[rows.length - 1] : null;

  const assembled = !!(meta && meta.week_of === thisWeek);
  const delivered = weeks.includes(thisWeek);
  const armed = cronArmed();
  const load = await inboxesArmed();

  const missed = [];
  for (let i = 1; i <= 8; i++) {
    const w = sundayOf(new Date(Date.parse(thisWeek) - i * 7 * 864e5));
    if (!weeks.includes(w)) missed.push(w);
  }

  const loaded = load.count;
  const loadedTxt = loaded == null ? 'load unknown' : loaded + ' inbox(es) LOADED';

  let status, note;
  if (delivered) {
    status = 'OK';
    note = 'DELIVERED ' + thisWeek +
           (last && last.inboxes != null ? ' to ' + last.inboxes + ' inbox(es)' : '') +
           ' · ' + weeks.length + ' round(s) fired · ' + packages + ' package(s) delivered, all time' +
           ' · ' + loadedTxt + ' · a re-fire CANNOT double-mail';
  } else if (!weeks.length) {
    status = 'FAIL';
    note = 'NOTHING HAS EVER BEEN DELIVERED FROM THIS TUBE. ' + loadedTxt + ' AND WAITING. ' +
           (armed === false ? 'THE CRON IS COMMENTED OUT — IT WILL NOT FIRE.' : '');
  } else {
    status = 'WARN';
    note = 'THIS WEEK (' + thisWeek + ') IS NOT DELIVERED' +
           (assembled ? ' — but it IS assembled and ready to fire' : ' and is NOT assembled') +
           ' · last round ' + weeks[0] +
           ' · ' + weeks.length + ' fired · ' + packages + ' package(s), all time · ' + loadedTxt +
           (missed.length ? ' · missed ' + missed.length + ' of the last 8' : '');
  }

  return {
    id: 'THE WEEK', cadence: 'weekly (Sunday 12:00 UTC)',
    status,

    /* ── THE BAY, IN THREE NUMBERS. Tangible, and it cannot leak. ── */
    ordnance: {
      loaded: loaded,                 // inboxes armed and waiting
      rounds: weeks.length,           // weeks fired
      packages: packages,             // pieces of mail delivered, all time
      summary: (loaded == null ? 'LOAD UNKNOWN' : loaded + ' LOADED') +
               ' · ' + weeks.length + ' FIRED · ' + packages + ' DELIVERED',
      privacy: 'COUNTS ONLY. The load is taken by HEAD + count=exact — the request returns a ' +
               'number and NO ROWS. No address can reach this file, and this file is PUBLIC. ' +
               'A tube reports its load and its rounds fired. It does not read the names off the shells.',
    },

    fired: weeks.length,
    thisWeek,
    assembled,
    delivered,
    schedule: {
      armed,
      cron: '0 12 * * 0',
      note: armed === null ? 'could not read the workflow'
          : (armed ? 'ARMED — Sunday 12:00 UTC, six days behind the bell'
                   : 'COMMENTED OUT. IT WILL NOT FIRE. Dry-run it, send once by hand, confirm the ledger, THEN uncomment.'),
    },
    lastDelivery: last,
    recent: weeks.slice(0, 8),
    missedLast8: missed,
    note,
  };
}

/* ── THE DAILY PLANET ───────────────────────────────────────────────────── */
async function planet() {
  for (const p of ['planet:', 'dailyplanet:', 'article:']) {
    const keys = await listKeys(p);
    if (keys && keys.length) {
      const dated = keys.map(k => (/(\d{4}-\d{2}-\d{2})/.exec(k) || [])[1]).filter(Boolean).sort().reverse();
      const last = dated[0] || null;
      const ageD = last ? Math.round((Date.parse(iso(today)) - Date.parse(last)) / 864e5) : null;
      return { id: 'THE DAILY PLANET', cadence: 'daily', prefix: p,
        status: ageD !== null && ageD <= 2 ? 'OK' : 'WARN',
        fired: keys.length, last, lastAgeDays: ageD, recent: keys.slice(0, 10),
        note: `${keys.length} piece(s) under "${p}"` + (last ? ` · last ${last}` : '') };
    }
  }
  return { id: 'THE DAILY PLANET', cadence: 'daily', status: 'FAIL', fired: 0,
    note: 'NO KEYS FOUND under planet:, dailyplanet: or article:. Either nothing has ever fired, ' +
          'or it saves under a prefix this probe does not know. BOTH ARE FINDINGS.' };
}

/* ── THE PODCAST ────────────────────────────────────────────────────────── */
async function podcast() {
  for (const p of ['podcast:', 'pod:', 'audio:']) {
    const keys = await listKeys(p);
    if (keys && keys.length) {
      return { id: 'THE PODCAST', cadence: 'weekly', prefix: p, status: 'OK',
        fired: keys.length, recent: keys.slice(0, 8),
        note: `${keys.length} episode(s) under "${p}"` };
    }
  }
  return { id: 'THE PODCAST', cadence: 'weekly', status: 'FAIL', fired: 0,
    note: 'NOTHING. No podcast keys under podcast:, pod: or audio:. ' +
          'It is scheduled and it has never fired — or it fires somewhere nothing can see.' };
}

/* ── THE DOCKET ─────────────────────────────────────────────────────────── */
async function docket() {
  /* The docket is the Mint's, not the proxy's. It is off this probe's rounds —
     say so, rather than draw an empty tube and let anyone assume. */
  return { id: 'THE DOCKET', cadence: 'per case', status: 'WARN', fired: null,
    note: 'The docket lives in the MINT worker (/quiz/topics), not the proxy. This probe does not ' +
          'walk that tube yet. The first set of cases closed on 13 July 2026 WITH ZERO ARGUMENTS ' +
          'SUBMITTED — a fact learned because a human looked at a date, not because anything watched.' };
}

/* ── FIRE THE ROUNDS ────────────────────────────────────────────────────── */
const tubes = {};
for (const t of [await atlantica(), await theWeek(), await planet(), await podcast(), await docket()]) {
  tubes[t.id] = t;
}

const hold = await everyKey();

const dispatch = {
  at: new Date().toISOString(),
  by: 'probes/probe-ordnance.mjs',
  /* THE HOLD. Every key the Worker has ever written, grouped by prefix. This is
     the ground truth. If a tube below disagrees with this, THE TUBE IS WRONG. */
  hold: hold ? { count: hold.count, prefixes: Object.fromEntries(
      Object.entries(hold.groups).map(([p, ks]) => [p, ks.length])) } : null,
  today: iso(today),
  thisWeek: sundayOf(today),
  note: 'THE FIRING LOG. What the fleet has actually published, read from the Worker\'s own KV. ' +
        'A schedule that nobody checks is a promise nobody keeps.',
  tubes,
};

process.stdout.write(JSON.stringify(dispatch, null, 2) + '\n');

for (const t of Object.values(tubes)) {
  const m = t.status === 'OK' ? '✓' : (t.status === 'FAIL' ? '✗' : '⚠');
  process.stderr.write(`  ${m} ${t.id.padEnd(18)} ${String(t.status).padEnd(5)} ${t.note}\n`);
}
