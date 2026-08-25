#!/usr/bin/env node
/* ============================================================================
   probe-library.mjs — THE LIBRARIAN
   ---------------------------------------------------------------------------
   Walks library/ and reads what is really there. The library is a living
   subsystem and until now no instrument watched it — the Codex said "9 ENTRIES
   UNLOCKED" while the shelves held far more. This probe is that instrument.

   It reads the per-figure manifests (library/{key}.json), each of which carries
   a works[] array, and it CONFIRMS each work's file actually exists on disk.
   It writes LIBRARY.json — the reading — the way probe-ordnance writes the
   firing log. A register is a reading, regenerated; never hand-edited.

   EMPTY-GLASS RULE: a manifest with zero present works is an EMPTY room wearing
   a folder — reported as a fact, not hidden. A room counts as "unlocked" only
   if it has at least one work whose file is actually on disk.

   Runs in GitHub Actions (the only runtime; the captain's Mac has no tooling).
   Report what is there, not what should be there. Look first.
   ========================================================================== */

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// LIBRARY dir: default to ../library relative to this script (script lives in probes/);
// override with LIBRARY_DIR env if run from elsewhere.
const LIBRARY_DIR = process.env.LIBRARY_DIR || join(HERE, '..', 'library');
const OUT = process.env.LIBRARY_OUT || join(LIBRARY_DIR, '..', 'LIBRARY.json');

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return { __error: String(e && e.message || e) }; }
}

function main() {
  if (!existsSync(LIBRARY_DIR)) {
    console.error('LIBRARY: no library/ directory at ' + LIBRARY_DIR);
    // still write an honest empty reading rather than crash
    writeFileSync(OUT, JSON.stringify(emptyReading('no library/ directory'), null, 2));
    return;
  }

  // every top-level *.json in library/ is a figure manifest
  const entries = readdirSync(LIBRARY_DIR, { withFileTypes: true });
  const manifests = entries
    .filter(e => e.isFile() && e.name.endsWith('.json') && e.name !== 'LIBRARY.json')
    .map(e => e.name);

  const rooms = [];
  for (const fname of manifests.sort()) {
    const key = fname.replace(/\.json$/, '');
    const m = readJSON(join(LIBRARY_DIR, fname));
    if (m.__error) {
      rooms.push({ key, status: 'error', error: m.__error, works: 0, present: 0 });
      continue;
    }
    const works = Array.isArray(m.works) ? m.works : [];

    // CONFIRM each work's file actually exists on disk (empty-glass discipline:
    // a manifest that lists works whose files are missing is not a full room)
    let present = 0, bytes = 0, missing = [];
    const worksData = [];
    for (const w of works) {
      const rel = w.file || (w.id ? `${key}/${w.id}.md` : null);
      let isPresent = false;
      if (rel) {
        const abs = join(LIBRARY_DIR, rel);
        if (existsSync(abs) && statSync(abs).isFile()) { present++; bytes += statSync(abs).size; isPresent = true; }
        else missing.push(rel);
      } else { missing.push(w.id || '(unnamed)'); }
      // keep the citation data for the bibliography (present works only)
      if (isPresent) worksData.push({
        title: w.title || w.id || '', section: w.section || '', source: w.source || ''
      });
    }

    // does a room FOLDER exist too? (some rooms may be manifest-only or folder-only)
    const folder = join(LIBRARY_DIR, key);
    const hasFolder = existsSync(folder) && statSync(folder).isDirectory();
    let folderFiles = 0;
    if (hasFolder) {
      try {
        folderFiles = readdirSync(folder)
          .filter(n => n.endsWith('.md') && n.toLowerCase() !== 'placeholder.md').length;
      } catch { folderFiles = 0; }
    }

    // CHARACTER IMAGES — does this figure have a deck card and/or terminal plate?
    // (img/{key}-card.jpg, img/{key}-terminal.jpg — checked on disk, the real signal)
    const imgDir = join(LIBRARY_DIR, '..', 'img');
    const hasCard = existsSync(join(imgDir, key + '-card.jpg'));
    const hasTerminal = existsSync(join(imgDir, key + '-terminal.jpg'));

    // STATUS — the empty-glass verdict:
    //   full        : manifest lists works AND at least one file is present
    //   empty       : manifest exists but no present works (a room wearing a folder)
    //   placeholder : only a placeholder / no real .md files on disk
    let status;
    if (present > 0) status = 'full';
    else if (works.length > 0) status = 'empty';      // listed but files missing
    else if (folderFiles > 0) status = 'full';         // folder has works, manifest thin
    else status = 'placeholder';

    rooms.push({
      key,
      name: m.name || key,
      status,
      worksListed: works.length,
      worksPresent: present,
      bytes,
      sizeKB: Math.round(bytes/1024*10)/10,
      folderFiles,
      hasCard,
      hasTerminal,
      works: worksData,
      ...(missing.length ? { missing } : {})
    });
  }

  const unlocked = rooms.filter(r => r.status === 'full');
  const reading = {
    _what: 'THE LIBRARY, READ. What reading rooms exist and which actually hold works. A reading, regenerated by probe-library.mjs — never hand-edited.',
    generatedAt: new Date().toISOString(),
    totals: {
      manifests: rooms.length,
      unlocked: unlocked.length,          // <-- the number the Codex label should show
      empty: rooms.filter(r => r.status === 'empty').length,
      placeholder: rooms.filter(r => r.status === 'placeholder').length,
      error: rooms.filter(r => r.status === 'error').length,
      totalWorksPresent: rooms.reduce((n, r) => n + (r.worksPresent || 0), 0),
      totalKB: Math.round(rooms.reduce((n, r) => n + (r.bytes || 0), 0)/1024*10)/10,
      withCard: rooms.filter(r => r.hasCard).length,
      withTerminal: rooms.filter(r => r.hasTerminal).length
    },
    // the list the Codex should use for AMENTI_LIBRARY_KEYS (real rooms only)
    unlockedKeys: unlocked.map(r => r.key),
    rooms
  };

  writeFileSync(OUT, JSON.stringify(reading, null, 2));
  console.log(`LIBRARY: ${reading.totals.unlocked} unlocked · ` +
              `${reading.totals.empty} empty · ${reading.totals.placeholder} placeholder · ` +
              `${reading.totals.manifests} manifests → ${OUT}`);
}

function emptyReading(reason) {
  return {
    _what: 'THE LIBRARY, READ.',
    generatedAt: new Date().toISOString(),
    totals: { manifests: 0, unlocked: 0, empty: 0, placeholder: 0, error: 0, totalWorksPresent: 0 },
    unlockedKeys: [],
    rooms: [],
    note: reason
  };
}

main();
