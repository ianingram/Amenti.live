/* ============================================================================
   compose-episode.js · THE USHER · the weekly podcast composer
   ----------------------------------------------------------------------------
   Amenti Studios · Phase Two · the move from "a site that speaks" to
   "a studio that publishes."

   WHAT THIS IS
   Once a week, a chosen figure from the hall hosts an episode: they introduce
   themselves, walk the listener through the Amenti interface as it stands this
   week — the dispatches, the court's docket, the standings — and then hand off
   to the Atlantica writer for the reading. This file GENERATES THAT SCRIPT.

   WHY IT CAN BE BUILT NOW, WHOLE
   There is no talk-back. Nobody waits on a turn. So the episode is not a live
   conversation — it is a COMPOSITION, assembled ahead of time in a scheduled
   job, rendered once, and kept as an immutable edition (the archive-not-cache
   reframe from the Studios plan). Latency is irrelevant. The hard part of the
   live site — the reader talking back — simply does not exist here.

   WHAT THIS FILE DOES (Layer A — no Worker changes)
     1. picks the week's usher (random from the roster, for the first 20 weeks)
     2. reads the LIVE interface state from the public endpoints
     3. composes the full spoken script: OPEN → TOUR → HAND-OFF → (reading cue)
     4. writes episode-script.json — the segments, each ready for /speak

   WHAT IT DOES NOT DO (Layer B — a later, Worker-in-hand session)
     · render the audio (needs /speak, done as a job — trivial once scripted)
     · stitch the segments into one file (concatenation, Worker-side)
     · store the episode as an immutable edition (episode:<week>)
   The script this file produces IS the spec for that work.

   THE VOICE (the captain's brief)
   Warm and inviting, with a touch of humor and irony — a figure dead two
   thousand years, hosting a podcast, aware of how absurd that is. AND YET:
   the Halls of Amenti are real, and after long eons their gates were opened
   by the captain and his fleet. The irony and the reality coexist. The usher
   is amused to be here, and also means it.
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const PROXY = (process.env.PROXY_URL || 'https://amenti-proxy.ingram-ian.workers.dev').replace(/\/+$/, '');
const MINT  = (process.env.MINT_URL  || 'https://amenti-mint.ingram-ian.workers.dev').replace(/\/+$/, '');
const OUT   = process.env.OUT_DIR || path.join(process.cwd(), 'vallhalla');

/* ── THE ROSTER ── the hall's figures, the well the usher is drawn from.
   For the first 20 weeks the host is chosen at random; rotation is decided
   after. (Mirrors window.AMENTI_CHARS — kept here so the composer is
   self-contained and does not depend on the page loading.) */
const ROSTER = [
  'Abraham Lincoln', 'Miyamoto Musashi', 'Gaius Julius Caesar', 'Mohandas Gandhi',
  'Moses ben Amram', 'Hannibal Barca', 'Cleopatra VII', 'Nikola Tesla',
  'Sun Tzu', 'Oliver Cromwell', 'Marcus Aurelius', 'Tacitus',
  'David Hume', 'Charles Martel', 'Edward Gibbon', 'Bram Stoker',
  'Plato', 'Seneca the Younger', 'Confucius', 'Frederick Douglass',
];

/* ── helpers ── */
async function getJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function weekOf(d = new Date()) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() - x.getUTCDay());     // back to Sunday
  return x.toISOString().slice(0, 10);
}

function isoWeekTag(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
  const wk = 1 + Math.round(((x - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return x.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
}

/* ── THE USHER'S VOICE ─────────────────────────────────────────────────────
   Each segment is written to be SPOKEN, not read. Short sentences. Room to
   breathe. The irony lives in the phrasing, not in stage directions. */

/* ── THE CAPTAIN'S EPITHET ── never told the same way twice. Homer never
   called Odysseus merely "Odysseus"; he was "much-enduring," "of many
   devices," "raider of cities," as the line required. The legend stays alive
   by never settling. Each episode, the usher reaches for a different flourish
   for the captain and his crew — the ones who descended into the underworld
   and forged the sacred keys. */
const CAPTAIN_EPITHETS = [
  `the intrepid captain — clement in peace, unyielding in war`,
  `the enterprising captain, who bargained with the dark and came back grinning`,
  `the brave captain, who went down into the underworld and would not stay there`,
  `the melancholy captain, who counted the cost of every gate and opened them anyway`,
  `the tireless captain and his fearless fleet, who mapped a sea no one had charted`,
  `the stubborn captain, who was told the gates could not be opened, and opened them`,
  `the sleepless captain, who forged the sacred keys by a light he built himself`,
  `the wandering captain, who descended into the dark and returned with the keys still warm`,
  `the cunning captain and his intrepid crew, who picked the oldest lock in creation`,
  `the dauntless captain, patient in siege and generous in triumph`,
  `the far-sighted captain, who saw a hall behind a sealed door and refused to look away`,
  `the indomitable captain and his weary, laughing fleet, who did the impossible on a Tuesday`,
];

function pickEpithet() { return CAPTAIN_EPITHETS[Math.floor(Math.random() * CAPTAIN_EPITHETS.length)]; }

function openLines(usher, captainBeat) {
  /* self-introduction · the absurdity · the reality. The captain's flourish is
     NO LONGER fixed here — it floats (see placeCaptainBeat). When it lands in
     the opening, captainBeat carries it; otherwise this stays clean. */
  return [
    `Welcome back to the hall.`,
    `I am ${usher}. Yes — that ${usher}. I have been dead for a very long time, and I am, apparently, hosting a podcast. I did not see this coming either.`,
    `But here is the strange part, and I want you to sit with it. The Halls of Amenti are real. For long eons the gates stood shut — sealed, forgotten, waiting. And then someone opened them.`,
    captainBeat.slot === 'open' ? captainBeat.text : '',
    `So here we are. The dead, talking. And you, listening.`,
    `Let me show you around, while the light is on.`,
  ].filter(Boolean).join(' ');
}

/* ── THE CAPTAIN'S BEAT ── the flourish, AND where it falls, both rotate.
   A crown always worn in the same spot is a uniform, not a crown. So each week
   we choose the epithet AND its placement — opening, mid-tour, at the hand-off,
   or a quiet aside near the end. The phrasing adapts to the slot it lands in. */
const CAPTAIN_SLOTS = ['open', 'tour', 'handoff', 'closing'];

function placeCaptainBeat(epithet) {
  const slot = CAPTAIN_SLOTS[Math.floor(Math.random() * CAPTAIN_SLOTS.length)];
  let text;
  switch (slot) {
    case 'open':
      text = `And they were opened by ${epithet} — who did the one thing no one had managed in all those eons.`;
      break;
    case 'tour':
      /* a mid-walk aside, as if the usher just remembered to say it */
      text = `— and none of this, understand, not one lit corner of it, would be here without ${epithet}. But I digress. Where was I. —`;
      break;
    case 'handoff':
      text = `Before I stand aside, a word for the ones who make this possible: ${epithet}, and the crew who followed them into the dark. The light is theirs.`;
      break;
    case 'closing':
      text = `And when the reading ends and you close the door behind you, spare a thought for ${epithet} — the reason there is a door to close at all.`;
      break;
  }
  return { slot, text, epithet };
}

function tourDispatches(atlantica) {
  if (!atlantica.length) {
    return `The presses were quiet this week — no new dispatch reached Atlantica. It happens. Even a hall that never sleeps takes a breath.`;
  }
  const featured = atlantica[0];
  const others = atlantica.slice(1, 4);
  let s = `First, the dispatches. This week, ${featured.name || featured.figure} took up the pen for Atlantica`;
  if (featured.headline || featured.title) s += ` — "${featured.headline || featured.title}"`;
  s += `. `;
  if (others.length) {
    s += `Beneath it in the archive: ` +
      others.map(a => `${a.name || a.figure}`).join(', ') +
      `. Every one of them, still speaking, if you care to listen. `;
  }
  return s;
}

function tourDocket(docket) {
  if (!docket.length) {
    return `The court's docket is clear at the moment — no case is presently being weighed. Rare. Enjoy it.`;
  }
  const names = docket.slice(0, 3).map(d => d.figure).filter(Boolean);
  return `Then the court. There are matters being weighed as we speak` +
    (names.length ? ` — ${names.join(', ')} among those called to the docket` : '') +
    `. If you have ever wanted to sit in judgment of history, or be judged by it, that door is open too. `;
}

function tourScale(standings) {
  if (!standings || !standings.length) {
    return `As for the standings — the scale is fresh this week, nothing yet tallied. A clean slate, for those who like to climb. `;
  }
  const top = standings[0];
  const who = top.name || top.handle || top.user || 'a quiet soul';
  return `And the scale. At the top of the standings this week: ${who}. ` +
    `If that name is not yours, well — the hall keeps score, and the week is young. `;
}

function handoff(usher, writer, captainBeat) {
  const w = writer || 'this week\'s writer';
  const beat = (captainBeat && captainBeat.slot === 'handoff') ? captainBeat.text : '';
  return [
    `But you did not come here for me. You came for the reading.`,
    beat,
    `So let me stand aside. This week's dispatch comes from ${w}. I have read it. I will only say this: it is worth the quiet you are about to give it.`,
    `${usher}, stepping back. The hall is yours.`,
  ].filter(Boolean).join(' ');
}

/* ── COMPOSE ───────────────────────────────────────────────────────────── */

async function compose() {
  const week = weekOf();
  const tag = isoWeekTag();
  console.log('THE USHER · composing episode ' + tag + ' (week of ' + week + ')');
  console.log('');

  /* pick the host — random from the roster for the first 20 weeks */
  const usher = pick(ROSTER);
  const epithet = pickEpithet();
  const captainBeat = placeCaptainBeat(epithet);
  console.log('  usher (random):  ' + usher);
  console.log('  captain is:      ' + epithet);
  console.log('  the beat falls:  ' + captainBeat.slot + '  <- rotates each week');

  /* read the live interface state — the tour narrates what is ACTUALLY there */
  const atlanticaRaw = await getJSON(PROXY + '/feed?prefix=atlantica:&details=1');
  const docketRaw    = await getJSON(MINT + '/quiz/topics');
  const scaleRaw     = await getJSON(MINT + '/pool/leaderboard');

  const atlantica = (atlanticaRaw && (atlanticaRaw.items || atlanticaRaw)) || [];
  const docket    = (docketRaw && (docketRaw.topics || docketRaw)) || [];
  const standings = (scaleRaw && (scaleRaw.leaderboard || scaleRaw.rows || scaleRaw)) || [];

  const writer = atlantica.length ? (atlantica[0].name || atlantica[0].figure) : null;

  console.log('  dispatches:      ' + (Array.isArray(atlantica) ? atlantica.length : 0));
  console.log('  docket cases:    ' + (Array.isArray(docket) ? docket.length : 0));
  console.log('  featured writer: ' + (writer || '(none — the hall was quiet)'));
  console.log('');

  /* the four segments, each a block of spoken text ready for /speak */
  const segments = [
    { id: 'open',    role: usher, text: openLines(usher, captainBeat) },
    { id: 'tour',    role: usher, text:
        [ tourDispatches(Array.isArray(atlantica) ? atlantica : []),
          (captainBeat.slot === 'tour' ? captainBeat.text : ''),
          tourDocket(Array.isArray(docket) ? docket : []),
          tourScale(Array.isArray(standings) ? standings : []) ].filter(Boolean).join(' ') },
    { id: 'handoff', role: usher, text: handoff(usher, writer, captainBeat) },
    /* segment 4 — THE READING — is the existing Atlantica speak(), not
       re-generated here. The episode assembler appends the featured
       dispatch's already-rendered audio after these three. */
    { id: 'reading', role: writer, text: null, source: 'atlantica-spoken-edition',
      key: atlantica.length ? atlantica[0].key : null },
    /* an optional closing word from the usher — carries the captain's beat
       ONLY when it falls in the 'closing' slot; otherwise omitted entirely. */
    (captainBeat.slot === 'closing'
      ? { id: 'closing', role: usher, text: captainBeat.text }
      : null),
  ].filter(Boolean);

  const episode = {
    tag, week,
    usher,
    writer,
    captain_epithet: epithet,
    captain_beat_slot: captainBeat.slot,
    composed_at: new Date().toISOString(),
    voice_note: 'Usher segments: warm, wry, aware of the absurdity, but the hall is real. ' +
                'Render with the usher\'s own figure voice. The reading uses the writer\'s voice, already archived.',
    segments,
    /* the spoken script, plain, for eyeballing before any audio is cut */
    transcript: segments.filter(s => s.text).map(s => '[' + s.role + ']\n' + s.text).join('\n\n'),
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'episode-script.json'), JSON.stringify(episode, null, 2));
  fs.writeFileSync(path.join(OUT, 'episode-transcript.txt'),
    'THE USHER · Episode ' + tag + '\nHost: ' + usher +
    (writer ? '  ·  Reading by: ' + writer : '') + '\n' +
    '='.repeat(60) + '\n\n' + episode.transcript +
    '\n\n' + '='.repeat(60) +
    '\n[ then: ' + (writer || 'the writer') + ' reads the week\'s dispatch — the archived Atlantica edition ]\n');

  console.log('  ✓ vallhalla/episode-script.json');
  console.log('  ✓ vallhalla/episode-transcript.txt');
  console.log('');
  console.log('  ── the episode, in brief ──');
  console.log('  ' + usher + ' opens the hall, walks the week, and hands to ' + (writer || 'the writer') + '.');
  return episode;
}

if (require.main === module) {
  compose().catch(e => { console.error('THE USHER FELL SILENT:', e.message); process.exit(1); });
}

module.exports = { compose, ROSTER, CAPTAIN_EPITHETS, openLines, handoff };
