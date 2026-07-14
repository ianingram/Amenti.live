/* ============================================================================
 * VALL-HALLA · the send pipe
 * ----------------------------------------------------------------------------
 * Reads the subscriber list from Supabase (service key — bypasses RLS), then
 * sends a finished HTML document to every active subscriber via Resend, in
 * batches, with a per-recipient unsubscribe link.
 *
 * ENV (set as GitHub Action secrets, or a local .env):
 *   SUPABASE_URL           your project url
 *   SUPABASE_SERVICE_KEY   service_role key  (NEVER commit — server-side only)
 *   RESEND_API_KEY         from resend.com
 *   VALLHALLA_FROM         e.g. "VALL-HALLA <herald@amenti.live>"  (verified domain)
 *   VALLHALLA_SUBJECT      e.g. "VALL-HALLA · Issue #1"
 *   VALLHALLA_HTML_PATH    path to the finished newsletter .html  (default: ./issue.html)
 *   UNSUB_BASE             unsubscribe endpoint, e.g. "https://amenti.live/unsub"
 *   DRY_RUN                "1" => log recipients, send nothing
 * ==========================================================================*/
'use strict';
const fs = require('fs');

const {
  SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY,
  VALLHALLA_FROM, VALLHALLA_SUBJECT,
  VALLHALLA_HTML_PATH = './issue.html',
  UNSUB_BASE = 'https://amenti.live/unsub',
  DRY_RUN,
} = process.env;

const BATCH = 100;                 // Resend batch API: up to 100 per call
const dry = DRY_RUN === '1';

/* ── THE RIVET ──────────────────────────────────────────────────────────────
   THIS PIPE HAD NO IDEMPOTENCY. It read every active subscriber and mailed
   them. Fire it twice — a retry, a re-run, a hand on the dispatch button — and
   EVERY SUBSCRIBER GETS IT TWICE.

   The Siege put a rivet of iron law through the Seal for exactly this:

       "UNIQUE(topic_id, week_of)  =>  a re-fired cron CANNOT double-seal."

   The herald never got one. It has one now.

       IDEMPOTENCY IS A CONSTRAINT, NOT A PROMISE.

   vallhalla/sent.json is the ledger. It is committed by the workflow. A week
   already in it is NEVER sent again — and that is not an error. It is the
   correct outcome, and it exits 0 so a double-fire is quiet, not alarming.
   ────────────────────────────────────────────────────────────────────────── */
const SENT_PATH = 'vallhalla/sent.json';
const META_PATH = 'vallhalla/meta.json';

function readSent() {
  try { return JSON.parse(fs.readFileSync(SENT_PATH, 'utf8')); }
  catch (e) { return { note: 'Weeks VALL-HALLA has been delivered. A week in this list is NEVER sent again.', weeks: [] }; }
}
function markSent(week, count) {
  const led = readSent();
  led.weeks = led.weeks || [];
  if (!led.weeks.some(w => (w.week_of || w) === week)) {
    led.weeks.push({ week_of: week, at: new Date().toISOString(), inboxes: count });
  }
  fs.writeFileSync(SENT_PATH, JSON.stringify(led, null, 2) + '\n');
}

function need(name, val) { if (!val) { console.error('Missing env: ' + name); process.exit(1); } }

async function sbSelect() {
  // read active subscribers via PostgREST with the service key (bypasses RLS)
  const url = `${SUPABASE_URL}/rest/v1/subscribers?select=email,unsub_token&status=eq.active`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!r.ok) throw new Error('Supabase read failed: ' + r.status + ' ' + (await r.text()));
  return r.json();
}

async function sendBatch(items, html, subject) {
  // Resend batch endpoint: array of individual messages (each gets its own unsub link)
  const payload = items.map(s => ({
    from: VALLHALLA_FROM,
    to: [s.email],
    subject,
    html: html.replace(/{{UNSUB_URL}}/g, `${UNSUB_BASE}?t=${s.unsub_token}`),
    headers: { 'List-Unsubscribe': `<${UNSUB_BASE}?t=${s.unsub_token}>` },
  }));
  const r = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Resend batch failed: ' + r.status + ' ' + (await r.text()));
  return r.json();
}

(async function main() {
  need('SUPABASE_URL', SUPABASE_URL);
  need('SUPABASE_SERVICE_KEY', SUPABASE_SERVICE_KEY);
  if (!dry) { need('RESEND_API_KEY', RESEND_API_KEY); need('VALLHALLA_FROM', VALLHALLA_FROM); }

  /* THE ASSEMBLER WROTE THIS. If it is not here, nothing was assembled — and a
     send pipe with nothing to send must not invent something. */
  let meta;
  try { meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8')); }
  catch (e) {
    console.error('✗ NO ISSUE WAS ASSEMBLED. vallhalla/meta.json is absent.');
    console.error('  Run scripts/vallhalla/assemble.js first. NOTHING WAS SENT.');
    process.exit(1);
  }
  const week = meta.week_of;
  const subject = VALLHALLA_SUBJECT || meta.subject || 'VALL-HALLA';

  /* ── THE RIVET HOLDS HERE ─────────────────────────────────────────────── */
  const led = readSent();
  if ((led.weeks || []).some(w => (w.week_of || w) === week)) {
    console.log('✓ The week of ' + week + ' HAS ALREADY BEEN DELIVERED.');
    console.log('  Nothing sent. This is not an error — it is the rivet doing its job.');
    console.log('  A re-fired cron CANNOT double-mail. See vallhalla/sent.json.');
    return;
  }

  const html = fs.readFileSync(VALLHALLA_HTML_PATH, 'utf8');
  if (!/{{UNSUB_URL}}/.test(html)) {
    console.warn('⚠ newsletter HTML has no {{UNSUB_URL}} placeholder — unsubscribe link will be missing.');
  }

  const list = await sbSelect();
  console.log(`Active subscribers: ${list.length}`);
  if (list.length === 0) { console.log('Nobody to send to. Done.'); return; }

  if (dry) {
    console.log('');
    console.log('DRY_RUN — NOTHING WILL BE SENT.');
    console.log('  week_of : ' + week);
    console.log('  subject : ' + subject);
    console.log('  issue   : ' + VALLHALLA_HTML_PATH + ' (' + html.length + ' bytes)');
    console.log('  unsub   : ' + (/{{UNSUB_URL}}/.test(html) ? 'placeholder present ✓' : 'MISSING <<<'));
    console.log('  would send to ' + list.length + ' inbox(es):');
    list.forEach(s => console.log('    ' + s.email));
    console.log('');
    console.log('  The ledger would then record ' + week + ' and REFUSE to send it again.');
    return;
  }

  let sent = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    const res = await sendBatch(chunk, html, subject);
    sent += chunk.length;
    console.log(`  batch ${i / BATCH + 1}: ${chunk.length} sent (${sent}/${list.length})`);
  }
  markSent(week, sent);
  console.log(`✅ VALL-HALLA delivered to ${sent} inboxes.`);
  console.log(`   ${week} written to ${SENT_PATH}. IT WILL NEVER BE SENT AGAIN.`);
})().catch(e => { console.error(e); process.exit(1); });
