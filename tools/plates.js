#!/usr/bin/env node
/* ============================================================================
   tools/plates.js — the plate register, and the scene register
   ----------------------------------------------------------------------------
   Walks img/ and emits img/PLATES.json: every plate, what is known about it,
   and a per-key index of which variants each figure has.

   NEW IN THIS CUT: img/scene/. A scene is a MOMENT a figure was in. It is not
   a figure, it does not hold variants, and its absence is not a gap.

   IT DOES NOT WRITE img/MANIFEST.json. That file belongs to the Python art
   pipeline and is read at runtime by amenti-diagnose.js. This one reads it for
   provenance and publishes a DERIVED register beside it. Provenance has one
   owner; the index is a reflection of it.

     node tools/plates.js            # write the register
     node tools/plates.js --check    # report only, write nothing, exit 1 on gaps

   ── WHY THE SCENE REGISTER EXISTS ─────────────────────────────────────────
   gw-winter-card.jpg and gw-winter-thumb.jpg sat in img/ and were registered
   as a FIGURE named `gw-winter` holding two of three required variants. The
   register duly reported a missing terminal plate and counted it against
   49 of 51. It was George Washington at Valley Forge.

   The checker was not wrong. The grammar had no room for the sentence.
   `^(.*?)-(card|thumb|terminal|chat)` must parse a filename as key + variant,
   so ANY scene dropped in img/ becomes a figure whose name is a moment. That
   is not a bug to be caught — it is a category the naming convention could
   not express.

   ── THE ASYMMETRY THAT MATTERS ────────────────────────────────────────────
   A figure key can be WRONG, because names.csv and library/ say what right is.
   A scene tag COULD NOT BE WRONG, because nothing said what right was. That is
   why scene keys drift silently while wd-gann was caught at one character.

   Authority is what makes error possible. So a scene inherits the authority of
   the figure it belongs to, and the grammar forbids a scene without one:

       img/scene/{figure-key}--{scene-tag}[-{variant}].{ext}

   The SUBDIRECTORY keeps scenes out of the figure grammar entirely. The DOUBLE
   HYPHEN splits owner from moment unambiguously, which a single hyphen cannot
   do because nearly every figure key already contains one.

   ── THE FIGURE NEED NOT BE IN THE FRAME ───────────────────────────────────
   Valley Forge without Washington in it is still his scene. The empty Senate
   after Caesar leaves is still his. Ownership is EDITORIAL, not photographic —
   a scene belongs to the figure whose story it serves, and depiction has
   nothing to do with it. Nothing here checks what is in the picture, because
   nothing could.

   ── WHAT IS CHECKABLE, AND WHAT IS NOT ────────────────────────────────────
   CHECKABLE   the owner is a real figure          → scenesWithoutFigure, fails --check
   NOT         the tag names the right moment      → free text, never validated
   NOT         a figure has any scenes at all      → absence is normal, never a gap

   A register that reports what cannot be acted on teaches its reader to stop
   reading it. Every article without a scene would be a row nobody can fix.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT     = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const IMG      = path.join(ROOT, 'img');
const SCENES   = path.join(IMG, 'scene');
const LIBRARY  = path.join(ROOT, 'library');
const ROSTER   = path.join(ROOT, 'names.csv');
/* NOT img/MANIFEST.json. That file is a WRITE TARGET for the Python art
   pipeline — provenance.py, seed.py, seeds_scan.py, ingest.py and
   apply_art_session.py all write to it, and amenti-diagnose.js reads it at
   runtime. Adding a sixth hand to a shared file to publish a DERIVED index is
   how provenance gets lost. This reads MANIFEST and never writes it. */
const SRC      = path.join(IMG, 'MANIFEST.json');
const OUT      = path.join(IMG, 'PLATES.json');
const CHECK    = process.argv.includes('--check');

/* THERE IS NO codex VARIANT, AND THERE WAS NEVER MEANT TO BE ONE.
   An earlier cut of this file listed `codex` as a required fourth variant and
   duly reported 0 of 51 — a gap that existed only because the checker had
   invented the thing it was checking for. amenti-art-photo.js settles it at
   line 213: "The codex gets the TERMINAL plate, not the card. It has the room
   for one." The codex surface reuses terminal. Three variants, not four.

   A register that measures the system against a spec nobody wrote will report
   failures that are its own. */
const VARIANTS = {
  card:     { multiple: false, required: true,  note: 'the face. roster, dispatch lead, atlantica lead' },
  thumb:    { multiple: false, required: true,  note: 'small and dense. lists, related, search' },
  terminal: { multiple: true,  required: true,  note: 'wide. also what the CODEX surface renders. grows over time.' },
  chat:     { multiple: true,  required: false, note: 'incidental' },
};

/* Scene variants are a SHORT list and none of them is required. A scene may be
   a single file. The bare form — owner--tag.jpg with no variant suffix — is
   the lead image and is the common case. */
const SCENE_VARIANTS = ['card', 'thumb', 'terminal', 'wide'];

/* ── ACCEPTED, AND WHY ─────────────────────────────────────────────────────
   A known mismatch that is not written down looks exactly like one nobody has
   noticed. The report then asks the same question every run and the reader
   learns to skim past it — which is how a live finding gets missed among the
   settled ones.

   So a decision the CAPTAIN made lives here, beside the reading, and the
   register sails it instead of re-raising it. Entries are annotated in the
   report and in the JSON; they are NOT removed from the counts, because an
   accepted mismatch is still a mismatch and hiding it would make this file a
   claim rather than a reading.

   `fails` decides only whether --check exits non-zero. Set it true for
   something that is accepted FOR NOW and must not be forgotten. */
const ACCEPTED = {
  'einstein-albert': {
    on:    '2026-08-16',
    fails: false,
    note:  'same figure as albert-einstein — word-order drift, the third instance '
         + 'after wd-gann and gw-winter. Renaming means touching the catalog and '
         + '10+ ingested texts by hand; the room resolves and the plates resolve, '
         + 'so the cost is two lines of report rather than a broken surface.',
  },
  'albert-einstein': {
    on:    '2026-08-16',
    fails: false,
    note:  'the plate side of the einstein-albert drift. Same figure, other spelling.',
  },
  'ingram': {
    on:    '2026-08-16',
    fails: false,
    note:  'the captain. A room and no portrait, by choice.',
  },
};

function accepted(key){ return Object.prototype.hasOwnProperty.call(ACCEPTED, key) ? ACCEPTED[key] : null; }

/* wrap a list for the report, annotating what has been ruled on */
function annotate(list, indent){
  const pad = ' '.repeat(indent);
  return list.map(k => {
    const a = accepted(k);
    if (!a) return pad + k;
    const words = a.note.split(/\s+/);
    const lines = []; let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 66) { lines.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) lines.push(line);
    return pad + k + '   [accepted ' + a.on + ']\n'
         + lines.map(l => pad + '    ' + l).join('\n');
  }).join('\n');
}

const PLATE = new RegExp(
  '^(.*?)-(' + Object.keys(VARIANTS).join('|') + ')(?:-(\\d+))?\\.(jpg|jpeg|png|webp)$', 'i');

/* owner -- tag [ - variant ] . ext
   The tag is non-greedy and the variant group is anchored to the end, so
   `caesar--rubicon-dawn.jpg` reads as tag `rubicon-dawn` (no variant) while
   `caesar--rubicon-thumb.jpg` reads as tag `rubicon`, variant `thumb`. Tags
   may contain hyphens; only the closed variant list is special. */
const SCENE = new RegExp(
  '^(.+?)--(.+?)(?:-(' + SCENE_VARIANTS.join('|') + '))?\\.(jpg|jpeg|png|webp)$', 'i');

function die(m){ console.error('REFUSES: ' + m); process.exit(2); }

/* ── READ WHAT IS ALREADY KNOWN ───────────────────────────────────────────
   If the existing manifest cannot be parsed we STOP rather than overwrite it.
   A generator that clobbers unrecoverable provenance because a brace was
   missing is worse than one that does nothing. */
let prior = {};
if (fs.existsSync(SRC)) {
  try {
    prior = (JSON.parse(fs.readFileSync(SRC, 'utf8')) || {}).images || {};
  } catch (e) {
    die('img/MANIFEST.json does not parse (' + e.message + '). It holds seeds '
      + 'and crop notes that exist nowhere else, so this script stops rather '
      + 'than publishing a register that silently drops them.');
  }
}

if (!fs.existsSync(IMG)) die('no img/ directory at ' + path.resolve(IMG));

const files = fs.readdirSync(IMG)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort();

if (!files.length) die('img/ holds no images. An empty register is not a clean one.');

/* rooms, so a plate with no room and a room with no plate both surface */
let rooms = [];
if (fs.existsSync(LIBRARY)) {
  rooms = fs.readdirSync(LIBRARY)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

/* ── THE ROSTER, IF IT IS THERE ───────────────────────────────────────────
   Until now this register's only authority was library/ — which is why a scene
   surfaced as "plate without room" rather than as anything more specific. The
   roster is the stronger authority: most figures have no room.

   ── A CHECK THAT COULD NEVER FIRE, 17 August 2026 ────────────────────────
   The first cut of this block looked for a `key` column, fell back to column
   zero, and lowercased it. names.csv HAS NO KEY COLUMN — it carries "Full
   Name", and the proxy derives its own key at amenti-proxy-worker.js:468 as

       key: name.toLowerCase().trim()

   which is a lowercased full name WITH THE SPACE IN IT: `george washington`.
   Plate and scene keys are hyphenated: `george-washington`. So the set this
   built could not match a single owner, and the scene test

       !!keys[owner] || roster.has(owner)

   passed only on its first half. The dead second half never showed, and the
   report printed, in full confidence:

       roster    1008 keys — scene owners checked against it

   They were not checked against it. A line stating a check that structurally
   could not fire — the same shape as `sealed: 1` against two visible rows, in
   a file written hours after that fault was written down.

   THE FIX IS TO SLUG BOTH SIDES THE SAME WAY. slugKey() below is the one
   place the convention lives; a plate key and a roster name now reduce to the
   same string or the mismatch is real. The report also states which column it
   read and how many owners actually resolved through the roster ALONE — so a
   check that stops firing says so next time instead of going quiet. */
function slugKey(s) {
  return String(s)
    .toLowerCase()
    .replace(/[.'’]/g, '')        /* W.D. Gann -> wd gann  */
    .replace(/[^a-z0-9]+/g, '-')  /* spaces and punctuation -> hyphen */
    .replace(/^-+|-+$/g, '');
}

let roster    = null;
let rosterCol = null;
if (fs.existsSync(ROSTER)) {
  try {
    const lines = fs.readFileSync(ROSTER, 'utf8').split(/\r?\n/).filter(Boolean);
    /* RFC-4180-ish: fields may be quoted and contain commas. A naive split on
       comma put half a biography in the key column on any quoted row. */
    const cut = function (line) {
      const out = []; let f = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
          if (c === '"' && line[i + 1] === '"') { f += '"'; i++; }
          else if (c === '"') q = false;
          else f += c;
        } else if (c === '"') q = true;
        else if (c === ',') { out.push(f); f = ''; }
        else f += c;
      }
      out.push(f);
      return out;
    };

    const head = cut(lines[0]).map(function (s) { return s.trim().toLowerCase(); });
    /* Prefer an explicit key column if one is ever added. Otherwise use the
       name column the proxy uses, BY NAME — never by position. Column zero was
       a guess, and a guess about which column holds identity is how a register
       ends up indexing biographies. */
    const pick = ['key', 'full name', 'name'];
    for (const want of pick) {
      const i = head.indexOf(want);
      if (i > -1) { rosterCol = { name: want, index: i }; break; }
    }
    if (!rosterCol) die('names.csv has no key, "full name" or "name" column. '
      + 'Header reads: ' + head.join(', ') + '. This register will not guess '
      + 'which column holds identity.');

    roster = new Set(lines.slice(1)
      .map(function (l) { return slugKey(cut(l)[rosterCol.index] || ''); })
      .filter(Boolean));
  } catch (e) {
    roster = null;   /* unreadable roster is not fatal; it is one fewer check */
  }
}

/* ── WALK THE FIGURE PLATES ───────────────────────────────────────────── */
const images = {};
const keys   = {};
const loose  = [];   // hero-bg, counsel-bg, book covers — not figure plates

for (const file of files) {
  const m = PLATE.exec(file);
  if (!m) { loose.push(file); continue; }

  const key = m[1], variant = m[2].toLowerCase(), n = m[3] ? Number(m[3]) : 1;
  const stat = fs.statSync(path.join(IMG, file));

  /* CARRY THE OLD RECORD FORWARD UNTOUCHED. Only size and mtime are refreshed,
     because those are facts about the file rather than about the making of it. */
  const was = prior[file];
  images[file] = was
    ? Object.assign({}, was, { key, surface_slug: variant, bytes: stat.size })
    : { key, surface_slug: variant, file, bytes: stat.size,
        /* null, not {} — "nobody recorded this" reads differently from
           "recorded as empty", and only one of them is true */
        provenance: null };

  if (!keys[key]) keys[key] = { key, variants: {}, scenes: [], room: false, complete: false };
  if (!keys[key].variants[variant]) keys[key].variants[variant] = [];
  keys[key].variants[variant].push({ file, n });
}

/* ── WALK THE SCENES ──────────────────────────────────────────────────────
   Scenes attach to the figure that owns them. They are NOT keys, they never
   count toward `complete`, and they cannot create a figure — a scene whose
   owner does not exist is reported, not registered. That is the one scene
   failure worth printing, because it is the only one anybody can act on. */
const scenes            = {};   // owner -> [ { tag, files } ]
const scenesWithoutFigure = []; // owner is not a plate key and not on the roster
const sceneMalformed      = []; // in img/scene/ but does not carry `--`
let sceneFileCount = 0;
let rosterOnlyOwners = 0;   /* scenes whose owner was known ONLY via names.csv */

if (fs.existsSync(SCENES)) {
  const sf = fs.readdirSync(SCENES)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  for (const file of sf) {
    const m = SCENE.exec(file);
    if (!m) {
      /* No `--`, so owner and moment cannot be separated. Naming it MALFORMED
         rather than ORPHAN matters: an orphan has an owner who is missing, a
         malformed file never said who its owner was. Different repairs. */
      sceneMalformed.push(file);
      continue;
    }

    const owner   = m[1].toLowerCase();
    const tag     = m[2].toLowerCase();
    const variant = m[3] ? m[3].toLowerCase() : 'lead';
    const rel     = 'scene/' + file;
    const stat    = fs.statSync(path.join(SCENES, file));

    /* An owner is legitimate if it holds plates OR sits on the roster. The
       roster is the wider net — a figure may be onboarded long before art
       exists — so a scene for a plateless figure is fine and a scene for
       a figure nobody has ever heard of is not. */
    /* COUNT WHAT THE ROSTER ALONE RESOLVED. If this is 0 forever, the roster
       arm of the check is dead again and the report will say so. */
    const onPlates = !!keys[owner];
    const onRoster = roster ? roster.has(slugKey(owner)) : false;
    if (!onPlates && onRoster) rosterOnlyOwners++;
    const known = onPlates || onRoster;
    if (!known) {
      scenesWithoutFigure.push({ file: rel, owner, tag });
      continue;
    }

    const was = prior[rel] || prior[file];
    images[rel] = was
      ? Object.assign({}, was, { key: owner, scene: tag, surface_slug: variant, bytes: stat.size })
      : { key: owner, scene: tag, surface_slug: variant, file: rel, bytes: stat.size,
          provenance: null };

    if (!scenes[owner]) scenes[owner] = {};
    if (!scenes[owner][tag]) scenes[owner][tag] = { tag, files: {} };
    scenes[owner][tag].files[variant] = rel;
    sceneFileCount++;
  }
}

/* hang the scene list off the figure, so one lookup answers both questions */
for (const owner of Object.keys(scenes)) {
  const list = Object.keys(scenes[owner]).sort().map(t => scenes[owner][t]);
  if (keys[owner]) keys[owner].scenes = list;
  else keys[owner] = { key: owner, variants: {}, scenes: list,
                       room: false, complete: false, missing: [], platesOnly: false };
}

/* ── RECONCILE AGAINST THE LIBRARY ────────────────────────────────────── */
for (const k of Object.keys(keys)) keys[k].room = rooms.indexOf(k) > -1;
const roomsNoPlate = rooms.filter(r => !keys[r]);
/* a key with scenes but no card is not a "plate without room" in the old
   sense — it is a figure represented only by moments. Kept separate so the
   old report keeps meaning what it meant. */
const platesNoRoom = Object.keys(keys)
  .filter(k => !keys[k].room && Object.keys(keys[k].variants).length)
  .sort();

/* a figure is complete when it holds every REQUIRED variant — checked one key
   at a time. Totals matching across variants proves nothing about whether the
   same figures appear in each. SCENES ARE NEVER PART OF THIS. A figure with no
   scenes is not incomplete; it is a figure with no scenes. */
const required = Object.keys(VARIANTS).filter(v => VARIANTS[v].required);
const gaps = {};
for (const k of Object.keys(keys)) {
  /* a scene-only key holds no variants and must not be reported as a figure
     missing all three — it was never claiming to be a figure plate */
  if (!Object.keys(keys[k].variants).length) {
    keys[k].complete = false;
    keys[k].missing  = [];
    keys[k].sceneOnly = true;
    continue;
  }
  const missing = required.filter(v => !keys[k].variants[v]);
  keys[k].complete = missing.length === 0;
  keys[k].missing  = missing;
  missing.forEach(v => { (gaps[v] = gaps[v] || []).push(k); });
}

const plateKeys = Object.keys(keys).filter(k => Object.keys(keys[k].variants).length);
const tally = {};
for (const v of Object.keys(VARIANTS)) {
  tally[v] = plateKeys.filter(k => keys[k].variants[v]).length;
}

const out = {
  deck: 'Amenti',
  generated: new Date().toISOString(),
  generator: 'tools/plates.js',
  /* the schema, stated in the file, so a reader need not infer it */
  variants: VARIANTS,
  sceneGrammar: {
    path: 'img/scene/{figure-key}--{scene-tag}[-{variant}].{ext}',
    variants: SCENE_VARIANTS,
    bare: 'lead',
    required: false,
    note: 'a scene is a moment a figure was in. the figure need not be in the '
        + 'frame — ownership is editorial, not photographic. absence is never '
        + 'a gap. the owner is checkable; the tag is not.',
  },
  totals: {
    files: files.length + sceneFileCount,
    plates: Object.keys(images).length - sceneFileCount,
    keys: plateKeys.length,
    rooms: rooms.length,
    scenes: Object.keys(scenes).reduce((n,o) => n + Object.keys(scenes[o]).length, 0),
    sceneFiles: sceneFileCount,
    figuresWithScenes: Object.keys(scenes).length,
    rosterKnown: roster ? roster.size : null,
    rosterColumn: rosterCol ? rosterCol.name : null,
    scenesResolvedByRosterAlone: rosterOnlyOwners,
    byVariant: tally,
    complete: plateKeys.filter(k => keys[k].complete).length,
    provenanced: Object.keys(images).filter(f => images[f].provenance !== null
                                             || images[f].model).length,
  },
  gaps: {
    missingByVariant: gaps,
    roomsWithoutPlates: roomsNoPlate,
    platesWithoutRooms: platesNoRoom,
    /* the same two lists with the captain's rulings attached, so a reader of
       the JSON sees the decision and not only the discrepancy */
    accepted: Object.keys(ACCEPTED)
      .filter(k => roomsNoPlate.indexOf(k) > -1 || platesNoRoom.indexOf(k) > -1)
      .map(k => Object.assign({ key: k }, ACCEPTED[k])),
    unaccepted: roomsNoPlate.concat(platesNoRoom).filter(k => !accepted(k)),
    scenesWithoutFigure: scenesWithoutFigure,
    scenesMalformed: sceneMalformed,
    notPlates: loose,
  },
  scenes,
  keys,
  images,
};

/* ── REPORT ───────────────────────────────────────────────────────────── */
const T = out.totals;
console.log('plates    ' + T.plates + ' across ' + T.keys + ' keys  ('
          + loose.length + ' non-plate files ignored)');
console.log('scenes    ' + T.scenes + ' across ' + T.figuresWithScenes
          + ' figures  (' + T.sceneFiles + ' files)');
if (roster) {
  console.log('roster    ' + T.rosterKnown + ' keys from column "' + rosterCol.name
            + '", slugged — ' + rosterOnlyOwners + ' scene owner'
            + (rosterOnlyOwners === 1 ? '' : 's') + ' resolved by the roster alone');
  /* A sample match, so a silently-dead check cannot hide behind a big number. */
  const probe = Object.keys(keys).filter(function (k) { return keys[k].variants.card; })[0];
  if (probe) console.log('          spot check: ' + probe + ' '
    + (roster.has(slugKey(probe)) ? 'IS on the roster' : 'IS NOT on the roster — the slug rule may have drifted again'));
} else {
  console.log('roster    names.csv not read; scene owners checked against plates only');
}
console.log('provenance ' + T.provenanced + ' of ' + (T.plates + T.sceneFiles)
          + ' — the rest carry provenance:null, which is honest, not empty');
console.log('');
for (const v of Object.keys(VARIANTS)) {
  console.log('  ' + v.padEnd(9) + String(tally[v]).padStart(3) + ' / ' + T.keys
            + (VARIANTS[v].required ? '' : '   (optional)'));
}
console.log('');
console.log('complete  ' + T.complete + ' of ' + T.keys + ' keys hold every required variant');
for (const v of Object.keys(gaps)) {
  console.log('  no ' + v + ': ' + gaps[v].length
            + (gaps[v].length <= 8 ? '  ' + gaps[v].join(', ') : ''));
}
if (roomsNoPlate.length) {
  console.log('\nroom, no plate');
  console.log(annotate(roomsNoPlate, 2));
}
if (platesNoRoom.length) {
  console.log('\nplate, no room');
  console.log(annotate(platesNoRoom, 2));
}

/* LISTS, NOT COUNTS. `passed: 5` was struck from the declaration for the same
   reason: a count reconciles silently and looks quantitative. These are the
   two scene failures anybody can act on, so they are printed in full. */
if (scenesWithoutFigure.length) {
  console.log('\nscene, no figure — the owner is not a plate key and not on the roster:');
  scenesWithoutFigure.forEach(s => console.log('  ' + s.file + '   owner=' + s.owner));
}
if (sceneMalformed.length) {
  console.log('\nscene, malformed — no `--`, so owner and moment cannot be separated:');
  sceneMalformed.forEach(f => console.log('  scene/' + f));
}

if (CHECK) {
  /* an accepted mismatch does not fail the check — that is the whole point of
     writing it down. One that carries fails:true still does. */
  const openRooms  = roomsNoPlate.filter(k => { const a = accepted(k); return !a || a.fails; });
  const openPlates = platesNoRoom.filter(k => { const a = accepted(k); return !a || a.fails; });
  const bad = T.complete !== T.keys || openRooms.length || openPlates.length
            || scenesWithoutFigure.length || sceneMalformed.length;
  console.log('\n--check: ' + (bad ? 'GAPS ABOVE' : 'clean') + ', nothing written');
  process.exit(bad ? 1 : 0);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log('\nwrote ' + OUT);
