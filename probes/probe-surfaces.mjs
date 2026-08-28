#!/usr/bin/env node
/* ============================================================================
   probes/probe-surfaces.mjs  ·  THE SURFACE WALK
   ----------------------------------------------------------------------------
   Walks the public repositories for INTERACTION POINTS, merges the authored
   semantics, and writes SURFACES.json.

     node probes/probe-surfaces.mjs            # write SURFACES.json
     node probes/probe-surfaces.mjs --check    # report only, exit 1 on drift

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   Every register on this ship maps the MACHINERY. SOURCES.json maps documents,
   FLEET_MANIFEST maps files, PANES.json maps panes, KEYS.json maps keys.

   NOTHING MAPPED THE PLACES A PERSON CAN ACT.

   On 27 August 2026 the same gap was found nine times in one day — the dial and
   counsel, the lean prompt that took the memory parameter and never rendered
   it, a visit reading that measures one surface of many, a whole game in a
   seventh repository, and hall.html in no register at all. Each was found by
   tripping over it. See BRIEF-NOTHING-MAPS-THE-SURFACES.md.

   ── A SURFACE IS A USER INTERFACE POINT ───────────────────────────────────
   Somewhere a person acts on the system and it responds. NOT a file, not a
   page, not a route. hall.html is a page; the Ask box is the surface.

   That distinction is the whole value. "Does the dial fire on counsel" is a
   question about the counsel INPUT, and a page-level register could never
   answer it. SPEC-SURFACES.md §1.

   ── THE DIVISION OF LABOUR ────────────────────────────────────────────────
     WALKED     what exists — an id on an input, button or textarea
     AUTHORED   what it IS, who it serves, and what reaches it
     MERGED     with the disagreements stamped

   THE WALK MUST NOT GUESS. It finds `mp-next` and `cdx-q` and cannot tell you
   that one is chrome and the other is the codex search. A walk that guessed
   would be confidently wrong at scale, which is the fault this register exists
   to catch. Same law as SOURCES.json: the walk finds, the semantics say.

   ── §4, INHERITED FROM sources.js ─────────────────────────────────────────
   The unauthenticated GitHub API returns an ERROR OBJECT, not data:

       403 {"message":"API rate limit exceeded for 34.24.99.5. ..."}

   A walk that reads that as a listing reports every surface missing, with
   complete confidence. It has produced false negatives twice in this project.

       AN ABSENCE FROM A SOURCE THAT WAS NEVER ASKED IS NOT AN ABSENCE.

   So enumeration failing is a REFUSAL, not an empty register.

   ── WHERE IT RUNS ─────────────────────────────────────────────────────────
   IN ACTIONS. Not in a browser. Two of the seven repositories are private and
   operator surfaces live in exactly those two — a browser-side walk could map
   only half the subject and would report that half as the whole.
   ========================================================================== */

'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT      = process.argv.find(a => !a.startsWith('--') && !a.endsWith('node') && !a.endsWith('.mjs')) || '.';
const OUT       = path.join(ROOT, 'SURFACES.json');
const SEMANTICS = path.join(ROOT, 'SURFACES.semantics.json');
const CHECK     = process.argv.includes('--check');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const RAW   = 'https://raw.githubusercontent.com/';

const say = m => console.log(m);
function die(m) { console.error('REFUSES: ' + m); process.exit(2); }

if (!fs.existsSync(SEMANTICS))
  die('no SURFACES.semantics.json. The authored half is not optional: a walk\n'
    + '         alone cannot tell a surface from a close button.');

const sem      = JSON.parse(fs.readFileSync(SEMANTICS, 'utf8'));
const authored = sem.surfaces || {};
const OWNER    = sem.owner || 'ianingram';

/* ── THE FINDER ──────────────────────────────────────────────────────────
   An interaction point is a NAMED input, button or textarea. Named, because
   an unnamed control cannot be referred to, cannot be described, and cannot
   be checked against a claim — it is invisible to the register whether or not
   a person can press it.

   That is a real limit and it is stated rather than hidden: the walk sees
   fewer surfaces than exist. It reports what can be NAMED. */
const CONTROL = /<(input|textarea|button)\b([^>]*)>/gi;
const ID_ATTR = /\bid\s*=\s*"([^"]*)"/i;

/* A page can declare sections; a control's section is the nearest one BEFORE
   it in the source. That is approximate — a control inside a modal is filed
   under whichever section the modal happens to follow — so it is reported as
   `sectionGuess` and the authored value always wins. Naming it a guess is the
   difference between a reading and a claim. */
const SECTION = /data-page\s*=\s*"([a-z0-9-]+)"/gi;

/* A surface built at runtime — `id="'+co.id+'"` — is not an id. Reporting it
   as one would put a string that can never be found into the register and
   invite somebody to go looking for it. */
const UNRESOLVED = /[+`${}]/;

function findControls(html, file) {
  const sections = [];
  let m;
  SECTION.lastIndex = 0;
  while ((m = SECTION.exec(html))) sections.push([m.index, m[1]]);
  const sectionAt = (pos) => {
    let cur = '';
    for (const [p, n] of sections) { if (p <= pos) cur = n; else break; }
    return cur;
  };

  /* EVERY id in the file, not only the controls'. A surface may declare a
     MOUNT POINT rather than a control — the QR panel is #amenti-handover, a
     div the widget draws into — and a claim about location is verifiable
     against any element. Checking only controls reported the hand-over code
     as ADRIFT when it was sitting in hall.html the whole time. */
  const allIds = new Set();
  const ANY_ID = /\bid\s*=\s*"([^"]*)"/gi;
  let a;
  while ((a = ANY_ID.exec(html))) allIds.add(a[1]);

  const found = [];
  CONTROL.lastIndex = 0;
  while ((m = CONTROL.exec(html))) {
    const idm = ID_ATTR.exec(m[2] || '');
    if (!idm) continue;                       // unnamed: real, but unnameable
    const id = idm[1];
    found.push({
      id, kind: m[1].toLowerCase(), file,
      sectionGuess: sectionAt(m.index),
      unresolved: UNRESOLVED.test(id) || undefined,
    });
  }
  return { found, allIds };
}

/* ── ENUMERATE. The API lists and decides nothing. ───────────────────────── */
async function listRepo(w) {
  const url = `https://api.github.com/repos/${OWNER}/${w.repo}/git/trees/${w.branch}?recursive=1`;
  const headers = { 'User-Agent': 'amenti-surfaces', Accept: 'application/vnd.github+json' };
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body || !Array.isArray(body.tree)) {
    die(`could not enumerate ${w.repo}@${w.branch} — HTTP ${r.status}`
      + (body && body.message ? `: ${body.message}` : '')
      + '\n         §4: an error object read as data reports everything missing.'
      + '\n         Nothing written. Set GITHUB_TOKEN.');
  }
  const re = new RegExp(w.files || '\\.html$');
  return body.tree.filter(n => n.type === 'blob').map(n => n.path).filter(p => re.test(p));
}

/* ── READ. Cache-busted, because raw is served through a CDN that returns
   OLD bytes with a 200 and nothing to say they are stale. It produced three
   false readings in one session on 23 Aug. The instrument is not exempt. ── */
const BUST = Date.now() + '-' + Math.random().toString(36).slice(2);
async function readFile(repo, branch, p) {
  const url = `${RAW}${OWNER}/${repo}/${branch}/${p}?_=${BUST}`;
  try {
    const r = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    return r.ok ? await r.text() : null;
  } catch (e) { return null; }
}

(async () => {
  say('── the surface walk ───────────────────────────────────────');

  const walked = [];
  const everyId = new Map();   /* id -> files, for verifying a declared mount point */
  const unread = [];
  for (const w of (sem.walk || [])) {
    const files = await listRepo(w);
    let n = 0;
    for (const f of files) {
      const html = await readFile(w.repo, w.branch, f);
      /* EMPTY GLASS. A file that could not be read is NAMED, never silently
         skipped — otherwise a network blip reads as a repo with no surfaces. */
      if (html === null) { unread.push(`${w.repo}/${f}`); continue; }
      const { found: got, allIds } = findControls(html, `${w.repo}/${f}`);
      got.forEach(g => { g.repo = w.repo; walked.push(g); });
      allIds.forEach(x => { if (!everyId.has(x)) everyId.set(x, []); everyId.get(x).push(`${w.repo}/${f}`); });
      n += got.length;
    }
    say(`walked        ${w.repo}@${w.branch}  ${files.length} files, ${n} named controls`);
  }
  if (unread.length) say(`UNREAD        ${unread.length} file(s) could not be fetched — see \`unread\``);

  /* ── MERGE, and stamp the disagreements ────────────────────────────────
     CONFIRMED    authored, and the walk found it
     UNDECLARED   the walk found it and nobody has said what it is
     ADRIFT       described, and the walk cannot find it
     UNRESOLVED   built at runtime; there is no id to find
     OFF-WALK     authored, and NOT FINDABLE BY THIS WALK — no #id was
                  declared, or the control is built at runtime, or it is a
                  scan, a route or a whole page. NOT adrift: absent from the
                  walk is not absent from the ship. */
  const byId = new Map();
  for (const w of walked) {
    if (!byId.has(w.id)) byId.set(w.id, []);
    byId.get(w.id).push(w);
  }

  const surfaces = [];
  const drift = [];

  for (const [id, rec] of Object.entries(authored)) {
    const el = (rec.where && rec.where.element) || '';
    const key = el.startsWith('#') ? el.slice(1) : id;
    const hits = byId.get(key) || [];
    /* ADRIFT MEANS A CLAIM THE WALK CONTRADICTS — an id WAS declared and the
       walk could not find it. It must not mean "the walk cannot see this",
       which is a fact about the walk and not about the surface.

       The first version got this wrong and accused six real surfaces of being
       adrift: the hall's Ask box (built at runtime by amenti-hall-box.js —
       hall.html contains no <input> at all), the microphone, the speaker
       toggle, TALK TO (a class, not an id), and the quiz. All of them exist
       and a person uses them daily.

       A register that reports a working surface as missing is worse than no
       register, and it is precisely the "confidently wrong" failure this
       instrument was built to catch. It caught itself. */
    const declaresAnId = el.startsWith('#');
    const asAnyElement  = declaresAnId ? (everyId.get(key) || []) : [];
    let stamp;
    if (hits.length) stamp = 'CONFIRMED';
    else if (asAnyElement.length) stamp = 'CONFIRMED';    /* a mount point, not a control */
    else if (declaresAnId) stamp = 'ADRIFT';
    else stamp = 'OFF-WALK';

    if (stamp === 'ADRIFT')
      drift.push({ stamp, id, claim: rec.name,
        reading: `declares ${el} and no element carries that id` });

    surfaces.push({ ...rec, id, stamp,
      walked: hits.length ? hits.map(h => ({ file: h.file, kind: h.kind, sectionGuess: h.sectionGuess }))
              : (asAnyElement.length ? asAnyElement.map(f => ({ file: f, kind: 'mount' })) : undefined),
      duplicated: hits.length > 1 ? hits.length : undefined });

    if (hits.length > 1)
      drift.push({ stamp: 'DUPLICATE', id: key, claim: rec.name,
        reading: `${hits.length} elements carry this id`,
        note: 'One id, several elements: getElementById returns the first and the rest are unreachable.' });
  }

  const claimed = new Set(Object.entries(authored).map(([id, r]) =>
    (r.where && r.where.element || '').startsWith('#') ? r.where.element.slice(1) : id));

  for (const [id, hits] of byId) {
    if (claimed.has(id)) continue;
    const stamp = UNRESOLVED.test(id) ? 'UNRESOLVED' : 'UNDECLARED';
    drift.push({ stamp, id, claim: '— nothing claims it —',
      reading: hits.map(h => h.file + (h.sectionGuess ? ' · ' + h.sectionGuess : '')).join(', ') });
    /* A DUPLICATE IS A DUPLICATE WHETHER OR NOT ANYBODY DESCRIBED IT. The
       first version checked only authored ids and therefore missed
       `quiz-close`, which is STANDING SLIP #3 and the very fault that proved
       this walk worth building. */
    if (hits.length > 1)
      drift.push({ stamp: 'DUPLICATE', id, claim: '— nothing claims it —',
        reading: `${hits.length} elements carry this id`,
        note: 'getElementById returns the first; every later one is unreachable.' });
  }

  const counts = {
    authored: Object.keys(authored).length,
    walkedControls: walked.length,
    confirmed:  surfaces.filter(s => s.stamp === 'CONFIRMED').length,
    offWalk:    surfaces.filter(s => s.stamp === 'OFF-WALK').length,
    adrift:     drift.filter(d => d.stamp === 'ADRIFT').length,
    undeclared: drift.filter(d => d.stamp === 'UNDECLARED').length,
    unresolved: drift.filter(d => d.stamp === 'UNRESOLVED').length,
    duplicate:  drift.filter(d => d.stamp === 'DUPLICATE').length,
  };

  /* THE FOUR QUESTIONS, ANSWERED AS A TALLY. This is the reason the register
     exists: on 27 Aug each of these was an argument, six times in one day. */
  const conv = surfaces.filter(s => (s.costs || []).includes('anthropic'));
  const reach = {
    conversationSurfaces: conv.length,
    countedOfThose:  conv.filter(s => s.reaches && s.reaches.counted).length,
    uncounted:       conv.filter(s => s.reaches && !s.reaches.counted).map(s => s.id),
    memoryReaches:   surfaces.filter(s => s.reaches && s.reaches.memory === true).map(s => s.id),
    dialReaches:     surfaces.filter(s => s.reaches && s.reaches.dial === true).map(s => s.id),
    unknown:         surfaces.filter(s => s.reaches && Object.values(s.reaches).some(v => v === null)).map(s => s.id),
  };

  say('');
  say(`  authored      ${counts.authored}`);
  say(`  confirmed     ${counts.confirmed}`);
  say(`  off-walk      ${counts.offWalk}   (a scan, a route, a page — correctly not findable)`);
  say(`  undeclared    ${counts.undeclared}   (found, and nobody has said what it is)`);
  say(`  adrift        ${counts.adrift}`);
  say(`  unresolved    ${counts.unresolved}   (built at runtime)`);
  say(`  duplicate ids ${counts.duplicate}`);
  say('');
  say(`  conversation surfaces  ${reach.conversationSurfaces}, of which counted: ${reach.countedOfThose}`);
  if (reach.uncounted.length) say(`  NOT COUNTED            ${reach.uncounted.join(', ')}`);
  if (reach.unknown.length)   say(`  NOT KNOWN              ${reach.unknown.join(', ')}`);
  say('');
  drift.forEach(d => say(`  ${d.stamp.padEnd(11)} ${d.id.padEnd(20)} ${d.reading}`));
  say('');

  if (CHECK) {
    const bad = counts.adrift + counts.undeclared + counts.duplicate;
    say('--check: ' + (bad ? bad + ' drift(s)' : 'the register matches the ship') + ', nothing written');
    process.exit(bad ? 1 : 0);
  }

  fs.writeFileSync(OUT, JSON.stringify({
    _: 'THE SURFACE REGISTER. Every place a person can act on this system.',
    _generated: 'GENERATED by probes/probe-surfaces.mjs — DO NOT EDIT. Meaning is authored in SURFACES.semantics.json; existence is walked.',
    _law: sem._law,
    _reaches: 'The four booleans are why this register exists. On 27 Aug 2026 each was an argument, six times in one day, because nothing could be looked up.',
    _honesty: 'null in `reaches` means NOT CHECKED. It is not false. False is a claim.',
    generated: new Date().toISOString(),
    generator: 'probes/probe-surfaces.mjs',
    counts, reach,
    unread: unread.length ? unread : undefined,
    drift,
    surfaces,
  }, null, 2) + '\n');

  say('wrote         ' + OUT);
  say('───────────────────────────────────────────────────────────');
})();
