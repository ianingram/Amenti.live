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

  const subject = VALLHALLA_SUBJECT || 'VALL-HALLA';
  const html = fs.readFileSync(VALLHALLA_HTML_PATH, 'utf8');
  if (!/{{UNSUB_URL}}/.test(html)) {
    console.warn('⚠ newsletter HTML has no {{UNSUB_URL}} placeholder — unsubscribe link will be missing.');
  }

  const list = await sbSelect();
  console.log(`Active subscribers: ${list.length}`);
  if (list.length === 0) { console.log('Nobody to send to. Done.'); return; }

  if (dry) {
    console.log('DRY_RUN — would send to:');
    list.forEach(s => console.log('  ' + s.email));
    return;
  }

  let sent = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    const res = await sendBatch(chunk, html, subject);
    sent += chunk.length;
    console.log(`  batch ${i / BATCH + 1}: ${chunk.length} sent (${sent}/${list.length})`);
  }
  console.log(`✅ VALL-HALLA delivered to ${sent} inboxes.`);
})().catch(e => { console.error(e); process.exit(1); });
