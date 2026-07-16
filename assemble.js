/* ============================================================================
 * VALL-HALLA · THE ASSEMBLER
 * ----------------------------------------------------------------------------
 * THE HERALD HAD NO VOICE. scripts/vallhalla/send.js is a SEND PIPE — it reads a
 * finished HTML file off the disk and mails it. NOTHING EVER PRODUCED THAT FILE.
 * That is why THE WEEK has never fired, and why the cron sat commented with the
 * honest note "uncomment when ready."
 *
 * This is the thing that makes it ready.
 *
 * WHAT IT READS  — all PUBLIC. No secret. Only what any seeker could read.
 *
 *   THE DOCKET        MINT  /quiz/topics                    the future
 *   ATLANTICA         PROXY /feed?prefix=atlantica:         the week's dispatches
 *   THE DAILY PLANET  PROXY /feed?prefix=dailyplanet:       the headline articles
 *   THE SCALE         MINT  /pool/leaderboard               the present tally
 *
 * The firing log (fleet-dispatch.json) says what is actually in the hold:
 *     atlantica: 41   ·   dailyplanet: 3   ·   week: ZERO
 *
 * THE WEEK MANIFEST HAS NEVER BEEN WRITTEN. publishWeek() has never run — the
 * first edition was seeded BY HAND through the incremental /week/publish, which
 * writes the articles WITHOUT writing week:{sunday}. So this assembler does NOT
 * read week: — it reads the articles themselves. It reports what EXISTS, not
 * what a manifest claims exists. That distinction is the whole fleet.
 *
 * THE PODCAST — and the one promise it will not make.
 *   Amenti Studios: "The podcast is NOT separate content. It is the spoken
 *   edition of Atlantica." There is no RSS feed. There are no podcast: keys —
 *   the ordnance probe walked the tubes and found none. So this issue DOES NOT
 *   LINK TO A FEED THAT DOES NOT EXIST. It links to the dispatch, on the page
 *   that reads it aloud in the figure's own voice. That is the spoken edition,
 *   and it is real today.
 *
 * ⚠ IT REFUSES TO ASSEMBLE AN EMPTY ISSUE.
 *   If every source is silent it exits 2, and the send step NEVER RUNS.
 *   A herald that speaks with nothing to say spends the only thing it owns:
 *   the right to be opened next week.
 *
 * OUTPUT
 *   vallhalla/issue.html   the finished document, with {{UNSUB_URL}}
 *   vallhalla/meta.json    { week_of, subject, counts } — the send pipe reads this
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

/* ── THE ORDNANCE BAY IS THE HERALD'S EYES ──────────────────────────────────
   probe-ordnance.mjs already walked the tubes and wrote down every key the
   Worker has ever published. That reading is fleet-dispatch.json — THE FIRING
   LOG — and it is the fleet's ground truth for WHAT FIRED.

   Two readers of one hold, with nothing reconciling them, is exactly the shape
   the Glass Gate exists to catch. So:

       THE FIRING LOG says WHAT FIRED.     (the keys, the dates)
       THE WORKER says WHAT IT SAYS.       (the titles, the teasers, the words)
       AND IF THEY DISAGREE, THE HERALD SAYS SO OUT LOUD.

   If the log is absent or stale, the herald falls back to asking the Worker
   directly — degrade, never break. But it will tell you it did. */
const fsx = require('fs');
function firingLog() {
  try {
    const d = JSON.parse(fsx.readFileSync('fleet-dispatch.json', 'utf8'));
    const ageH = (Date.now() - Date.parse(d.at)) / 36e5;
    return { ...d, ageH, stale: !(ageH < 26) };
  } catch (e) { return null; }
}

const MINT  = process.env.MINT_URL  || 'https://amenti-mint.ingram-ian.workers.dev';
const PROXY = process.env.PROXY_URL || 'https://amenti-proxy.ingram-ian.workers.dev';

/* ⚠ VERIFY THIS BEFORE THE FIRST REAL SEND. Every link in the newsletter hangs
   off it. Set SITE_BASE in the workflow if the public site is not here. */
const SITE  = (process.env.SITE_BASE || 'https://amenti.live').replace(/\/+$/, '');
const FLEET = (process.env.FLEET_BASE || 'https://ianingram.github.io/Fleet-Documents').replace(/\/+$/, '');
const OUT   = 'vallhalla';

/* ── THE STAGGER ────────────────────────────────────────────────────────────
   "the herald was set to TRAIL THE BELL, NOT RACE IT: the bell rings and the
    cron does its work — settle, rotate, seal — and only AFTER, a full turn
    later, does the herald read the settled state."

   The bell rings Monday at midnight. The herald speaks Sunday at noon — SIX
   DAYS BEHIND IT. It reads a hall that sealed long ago. It cannot read a
   half-open one. Two strands must never occupy one rung. */
function sundayOf(d) {
  const t = new Date(d || Date.now());
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() - t.getUTCDay());
  return t.toISOString().slice(0, 10);
}

async function get(url, label) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) { console.warn('  ' + label.padEnd(14) + r.status); return null; }
    return await r.json();
  } catch (e) {
    console.warn('  ' + label.padEnd(14) + 'unreachable (' + e.message + ')');
    return null;
  }
}

/* /feed?prefix=X&details=1 — the shape has drifted before, so accept several. */
async function feed(prefix, label) {
  const j = await get(PROXY + '/feed?prefix=' + encodeURIComponent(prefix) + '&details=1', label);
  if (!j) return [];
  const raw = Array.isArray(j) ? j : (j.items || j.entries || j.keys || []);
  return raw.map(x => (typeof x === 'string' ? { key: x } : x)).filter(Boolean);
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const titleCase = (s) => String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/* atlantica:{figure}:{YYYY-MM-DD} */
function partsOf(item) {
  const key = item.key || item.id || '';
  const bits = String(key).split(':');
  return {
    key,
    figure: item.figure || titleCase(bits[1] || ''),
    date: item.date || item.at || bits[2] || '',
    title: item.title || item.headline || '',
    teaser: item.teaser || item.hook || item.excerpt || '',
  };
}

const readLink = (key) => SITE + '/Page2.html#atlantica/' + encodeURIComponent(key);

function doorRow(color, kicker, line, cta, href) {
  return '<tr><td style="padding:0 28px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="background:#0b1420;border:1px solid #16324a;border-left:3px solid ' + color + ';border-radius:4px;margin:9px 0;">' +
      '<tr><td style="padding:15px 17px;">' +
        '<div style="font:700 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;color:' + color + ';text-transform:uppercase;">' + kicker + '</div>' +
        '<div style="font:400 14px/1.55 Georgia,serif;color:#dbeafe;margin:8px 0 11px;">' + line + '</div>' +
        '<a href="' + href + '" style="font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;color:' + color + ';text-decoration:none;">' + cta + ' &rarr;</a>' +
      '</td></tr></table></td></tr>';
}

function render({ week, docket, atlantica, planet, standings }) {
  const when = new Date(week + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  const row = (inner) => '<tr><td style="padding:0 28px;">' + inner + '</td></tr>';
  const rule = row('<div style="height:1px;background:#16324a;margin:26px 0;"></div>');
  const head = (t, c) => row('<div style="font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:' + c + ';margin:0 0 14px;">' + t + '</div>');
  const link = (href, txt, c) => '<a href="' + href + '" style="color:' + c + ';text-decoration:none;border-bottom:1px solid rgba(147,197,253,.3);">' + txt + '</a>';

  let body = '';

    body += head('THE INSTRUMENTS &middot; LIVE ON THE GLASS', '#7CFFC4');
    body += doorRow('#7CFFC4', 'THE SONAR &middot; THE GATE',
      'The gate scope swept all week. Every ping that was not the captain is a contact that should not exist.',
      '&#9654; WATCH IT SWEEP', FLEET + '/sonar.html');
    body += doorRow('#93c5fd', 'THE BROADCAST &middot; THE PODCAST',
      'A voice from the hall opens the gates &mdash; the week\'s dispatches, spoken, and a reading to close.',
      '&#9654; HEAR THIS WEEK', FLEET + '/broadcast.html');
    body += doorRow('#FFB300', 'THE OCEAN &middot; THE FLEET',
      'The fleet lay at anchor this week, the Sentry Corps ringing the harbor. The bird\'s-eye is moving now.',
      '&#9654; SEE THE FLEET', FLEET + '/ocean.html');
    body += rule;

  /* ── THE DOCKET · the future ── */
  if (docket.length) {
    body += head('THE DOCKET &middot; WHAT IS ABOUT TO BE WEIGHED', '#93c5fd');
    body += row(docket.slice(0, 13).map(d =>
      '<div style="margin:0 0 8px;font:400 15px/1.5 Georgia,serif;color:#cdd8ff;">' +
        '<span style="color:#93c5fd;">&#9670;</span>&nbsp; ' + esc(d.figure) +
        (d.title ? '<span style="color:#7f8ea3;font-size:13px;"> &mdash; ' + esc(d.title) + '</span>' : '') +
      '</div>').join('') +
      '<div style="margin:14px 0 0;font:400 13px/1.6 Georgia,serif;color:#7f8ea3;">' +
        'The heart is weighed against the feather. ' +
        link(SITE + '/docket.html', 'Enter the docket &rarr;', '#93c5fd') +
      '</div>');
    body += rule;
  }

  /* ── ATLANTICA · the week's dispatches, in the figures' own voices ── */
  if (atlantica.length) {
    body += head('ATLANTICA &middot; THE DISPATCHES OF THE WEEK', '#7CFFC4');
    body += row(atlantica.map(a =>
      '<div style="margin:0 0 15px;">' +
        '<div style="font:400 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;color:#5a6472;margin-bottom:3px;">' +
          esc(a.date) + '</div>' +
        '<div style="font:700 16px/1.4 Georgia,serif;color:#dbeafe;">' +
          link(readLink(a.key), esc(a.title || a.figure), '#dbeafe') + '</div>' +
        (a.figure && a.title ? '<div style="font:400 13px/1.5 Georgia,serif;color:#7CFFC4;margin-top:2px;">' + esc(a.figure) + '</div>' : '') +
        (a.teaser ? '<div style="font:400 14px/1.6 Georgia,serif;color:#9aa8bd;margin-top:4px;">' + esc(a.teaser) + '</div>' : '') +
        '<div style="margin-top:5px;font:400 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;">' +
          link(readLink(a.key), '&#9654; HEAR IT IN THEIR OWN VOICE', '#7CFFC4') + '</div>' +
      '</div>').join(''));
    body += rule;
  }

  /* ── THE DAILY PLANET · the headlines ── */
  if (planet.length) {
    body += head('THE DAILY PLANET &middot; FROM THE NEWSROOM', '#FFB300');
    body += row(planet.map(a =>
      '<div style="margin:0 0 14px;">' +
        '<div style="font:700 16px/1.4 Georgia,serif;color:#ffe680;">' + esc(a.title || a.figure || 'A dispatch') + '</div>' +
        (a.teaser ? '<div style="font:400 14px/1.6 Georgia,serif;color:#9aa8bd;margin-top:3px;">' + esc(a.teaser) + '</div>' : '') +
      '</div>').join(''));
    body += rule;
  }

  /* ── THE SCALE · the present tally ── */
  if (standings.length) {
    body += head('THE SCALE &middot; WHERE THE WEIGHT SITS NOW', '#FFB300');
    body += row('<div style="font:400 15px/1.8 Georgia,serif;color:#cdd8ff;">' +
      standings.slice(0, 5).map((s, i) =>
        '<div>' + (i + 1) + '. &nbsp;' + esc(s.name || s.user || s.handle || s.email || '&mdash;') +
        '<span style="color:#7f8ea3;"> &nbsp;&middot;&nbsp; ' +
        esc(s.score != null ? s.score : (s.emeralds != null ? s.emeralds : (s.votes != null ? s.votes : ''))) +
        '</span></div>').join('') + '</div>');
    body += rule;
  }

  return '<!doctype html><html><body style="margin:0;background:#06080f;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06080f;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#06080f;border:1px solid #16324a;">' +

    row('<div style="padding:34px 0 4px;font:700 23px/1 Georgia,serif;letter-spacing:.22em;color:#7CFFC4;">VALL&middot;HAL&middot;LA</div>' +
        '<div style="font:400 11px/1.7 ui-monospace,Menlo,monospace;letter-spacing:.1em;color:#7f8ea3;padding-bottom:24px;">' +
        'THE WEEKLY DISPATCH &middot; WEEK OF ' + esc(when).toUpperCase() + '</div>') +
    row('<div style="height:1px;background:#7CFFC4;opacity:.35;margin:0 0 26px;"></div>') +

    body +

    row('<div style="text-align:center;padding:10px 0 28px;">' +
        '<a href="' + SITE + '/Page1.html" style="display:inline-block;font:700 13px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#06080f;background:#d9a93a;text-decoration:none;padding:15px 32px;border-radius:3px;">ENTER THE HALL &rarr;</a>' +
      '</div>') +
    row('<div style="font:400 12px/1.8 ui-monospace,Menlo,monospace;color:#5a6472;padding:6px 0 30px;">' +
        'Every dispatch above can be heard in the figure&rsquo;s own voice.<br>' +
        'The court convenes. The heart is weighed against the feather.<br><br>' +
        '<a href="' + SITE + '" style="color:#93c5fd;text-decoration:none;">amenti.live</a>' +
        ' &nbsp;&middot;&nbsp; ' +
        '<a href="{{UNSUB_URL}}" style="color:#5a6472;text-decoration:underline;">unsubscribe</a>' +
        '</div>') +

    '</table></td></tr></table></body></html>';
}

(async function main() {
  const week = sundayOf();
  const since = Date.parse(week + 'T00:00:00Z') - 7 * 864e5;

  console.log('VALL-HALLA · assembling the week of ' + week);
  console.log('  the herald trails the bell by six days. It reads a settled hall.');
  console.log('  site base: ' + SITE + '   (every link in the issue hangs off this)');
  console.log('');

  /* ── THE LOG SPEAKS FIRST ── */
  const log = firingLog();
  if (!log) {
    console.warn('  ⚠ NO FIRING LOG. fleet-dispatch.json is absent — the ordnance probe has');
    console.warn('    not run, or did not land. Falling back to asking the Worker directly.');
  } else if (log.stale) {
    console.warn('  ⚠ THE FIRING LOG IS ' + Math.round(log.ageH) + 'h OLD. Not a current reading.');
  } else {
    const p = (log.hold && log.hold.prefixes) || {};
    console.log('  firing log   ' + Math.round(log.ageH) + 'h old · atlantica:' + (p['atlantica:'] || 0) +
                ' · dailyplanet:' + (p['dailyplanet:'] || 0) + ' · week:' + (p['week:'] || 0));
  }
  console.log('');

  const topics = await get(MINT + '/quiz/topics', 'docket');
  const docket = ((topics && topics.topics) || []).map(t => ({
    figure: ((t.facets && t.facets.figure) || [])[0] || t.id,
    title: t.title || t.name || '',
  })).filter(d => d.figure);

  const atlRaw = await feed('atlantica:', 'atlantica');
  const atl = atlRaw.map(partsOf)
    .filter(a => a.key)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .filter(a => { const d = Date.parse(a.date); return isNaN(d) || d >= since; })
    .slice(0, 7);

  const planetRaw = await feed('dailyplanet:', 'daily planet');
  const planet = planetRaw.map(partsOf).slice(0, 7);

  const board = await get(MINT + '/pool/leaderboard', 'standings');
  const standings = Array.isArray(board) ? board : ((board && (board.leaderboard || board.entries || board.top)) || []);

  /* ── RECONCILE. The log said what fired. Did the Worker agree? ── */
  if (log && !log.stale && log.hold && log.hold.prefixes) {
    const p = log.hold.prefixes;
    const claims = [
      ['atlantica:', (p['atlantica:'] || 0), atlRaw.length],
      ['dailyplanet:', (p['dailyplanet:'] || 0), planetRaw.length],
    ];
    for (const [prefix, logged, found] of claims) {
      if (logged !== found) {
        console.warn('');
        console.warn('  ⚠ THE LOG AND THE WORKER DISAGREE about ' + prefix);
        console.warn('    the firing log recorded ' + logged + ' key(s); the feed returned ' + found + '.');
        console.warn('    ONE OF THEM IS WRONG. The issue is still assembled from what the feed');
        console.warn('    actually returned — but this is a finding, and it should not be ignored.');
      }
    }
  }

  console.log('');
  console.log('  docket        ' + docket.length + ' case(s)');
  console.log('  atlantica     ' + atl.length + ' dispatch(es) this week');
  console.log('  daily planet  ' + planet.length + ' article(s)');
  console.log('  standings     ' + standings.length + ' entr(ies)');
  console.log('');

  /* ⚠ NEVER MAIL AN EMPTY ISSUE. */
  if (!docket.length && !atl.length && !planet.length && !standings.length) {
    console.error('✗ THE HALL IS SILENT. The docket is empty, no dispatch was written this week,');
    console.error('  the newsroom is quiet, and the scale is still.');
    console.error('  NO ISSUE ASSEMBLED. NO MAIL SENT. This is the correct outcome.');
    console.error('  Fix the hall, not the herald.');
    process.exit(2);
  }

  const html = render({ week, docket, atlantica: atl, planet, standings });
  const subject = 'VALL·HALLA · the week of ' +
    new Date(week + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'issue.html'), html);
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({
    week_of: week, subject,
    counts: { docket: docket.length, atlantica: atl.length, dailyplanet: planet.length, standings: standings.length },
    site: SITE,
    assembled_at: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('✓ vallhalla/issue.html   ' + html.length + ' bytes');
  console.log('✓ vallhalla/meta.json    week_of ' + week);
  console.log('  subject: ' + subject);
})().catch(e => { console.error(e); process.exit(1); });
