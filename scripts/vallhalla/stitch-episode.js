/* ============================================================================
   stitch-episode.js · THE EDITION · Layer B, final mile
   ----------------------------------------------------------------------------
   Concatenates the rendered usher segments (and the writer's archived reading)
   into ONE episode audio file, and writes the edition's metadata.

   Reads  vallhalla/episode-manifest.json   (the play order, from render step)
          vallhalla/audio/<tag>/*.mp3        (the usher segments)
   Writes vallhalla/episodes/<tag>.mp3        (the finished episode)
          vallhalla/episodes/<tag>.json       (the edition record)

   ── NO WORKER. NO ARCHIVE RISK. ─────────────────────────────────────────────
   This runs entirely in the CI runner, like the newsletter assembler. It uses
   ffmpeg (present on GitHub's ubuntu runners) to concatenate audio. It never
   calls /speak, never touches the recital cache, never deploys anything. The
   fragile proxy Worker is not involved at any point.

   ── THE READING ─────────────────────────────────────────────────────────────
   The writer's reading lives in the recital archive (R2), addressed by its key.
   To include it we FETCH the already-rendered audio by its public URL — we do
   NOT re-synthesize it. If the reading's audio URL is not resolvable in CI, the
   episode is still built from the usher segments and the manifest records that
   the reading must be appended at serve time. Degrade, never break.

   NO TALK-BACK: this is a batch job. Run it after render-episode.js.
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = process.env.OUT_DIR || path.join(process.cwd(), 'vallhalla');
/* where a recital-archive clip can be fetched, if exposed. Optional. */
const READING_BASE = process.env.READING_BASE || '';   // e.g. https://.../audio/

function have(cmd) {
  try { execFileSync('bash', ['-lc', 'command -v ' + cmd]); return true; }
  catch (e) { return false; }
}

async function fetchReading(key) {
  if (!READING_BASE || !key) return null;
  const url = READING_BASE.replace(/\/+$/, '') + '/' + encodeURIComponent(key);
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch (e) { return null; }
}

async function stitch() {
  const manPath = path.join(OUT, 'episode-manifest.json');
  if (!fs.existsSync(manPath)) {
    console.error('No episode-manifest.json. Run render-episode.js first.');
    process.exit(1);
  }
  const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
  const tag = man.tag;
  console.log('THE EDITION · stitching episode ' + tag + ' · host ' + man.usher);
  console.log('');

  if (!have('ffmpeg')) {
    console.error('ffmpeg not found. In CI, add: sudo apt-get install -y ffmpeg');
    process.exit(1);
  }

  /* gather the segment files in order */
  const parts = [];
  const missing = [];
  for (const seg of man.order) {
    if (seg.file) {
      const p = path.join(OUT, seg.file);
      if (fs.existsSync(p)) { parts.push(p); console.log('  + ' + seg.id.padEnd(9) + seg.file); }
      else missing.push(seg.id);
    } else if (seg.source === 'recital-archive') {
      /* the writer's reading — fetch from the archive, do not re-render */
      const buf = await fetchReading(seg.key);
      if (buf) {
        const rp = path.join(OUT, 'audio', tag, 'reading.mp3');
        fs.writeFileSync(rp, buf);
        parts.push(rp);
        console.log('  + reading   fetched from archive (' + seg.key + ')');
      } else {
        console.log('  ~ reading   NOT fetched (' + (seg.key || 'no key') +
                    ') — episode built without it; append at serve time');
      }
    }
  }

  if (missing.length) {
    console.error('  missing rendered segments: ' + missing.join(', ') + ' — run render again.');
    process.exit(1);
  }
  if (!parts.length) {
    console.error('  nothing to stitch.');
    process.exit(1);
  }

  const epDir = path.join(OUT, 'episodes');
  fs.mkdirSync(epDir, { recursive: true });

  /* ffmpeg concat via a list file — re-encode to a uniform mp3 so joins are
     clean regardless of per-segment encoding (the safe path). */
  const listFile = path.join(OUT, 'audio', tag, 'concat.txt');
  fs.writeFileSync(listFile, parts.map(p => "file '" + path.resolve(p) + "'").join('\n'));

  const outFile = path.join(epDir, tag + '.mp3');
  try {
    execFileSync('ffmpeg', [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c:a', 'libmp3lame', '-b:a', '128k', outFile,
    ], { stdio: 'pipe' });
  } catch (e) {
    console.error('  ffmpeg failed: ' + (e.stderr ? e.stderr.toString().slice(-400) : e.message));
    process.exit(1);
  }

  const bytes = fs.statSync(outFile).size;

  /* the edition record — immutable, addressable */
  const edition = {
    tag,
    title: 'The Usher · ' + tag,
    host: man.usher,
    reading_by: man.writer,
    file: 'episodes/' + tag + '.mp3',
    bytes,
    segments: man.order.map(o => o.id),
    reading_included: parts.some(p => p.endsWith('reading.mp3')),
    built_at: new Date().toISOString(),
    note: 'Immutable edition. The usher speaks in the conversational register; ' +
          'the reading is the writer\'s archived recital. No Worker was touched to build this.',
  };
  fs.writeFileSync(path.join(epDir, tag + '.json'), JSON.stringify(edition, null, 2));

  /* maintain a simple episodes index so the site/email can find the latest */
  const idxPath = path.join(epDir, 'index.json');
  let idx = { episodes: [] };
  try { idx = JSON.parse(fs.readFileSync(idxPath, 'utf8')); } catch (e) {}
  idx.episodes = (idx.episodes || []).filter(e => e.tag !== tag);
  idx.episodes.push({ tag, host: man.usher, reading_by: man.writer,
                      file: edition.file, built_at: edition.built_at });
  idx.episodes.sort((a, b) => (a.tag < b.tag ? 1 : -1));   // newest first
  fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2));

  console.log('');
  console.log('  ✓ vallhalla/episodes/' + tag + '.mp3  (' + Math.round(bytes / 1024) + ' KB)');
  console.log('  ✓ vallhalla/episodes/' + tag + '.json');
  console.log('  ✓ vallhalla/episodes/index.json  (' + idx.episodes.length + ' edition(s))');
  console.log('');
  console.log('  THE EPISODE IS AN EDITION. ' + man.usher + ' hosts; ' +
              (edition.reading_included ? man.writer + ' reads.' : 'reading appended at serve time.'));
  console.log('  The email door now points at: episodes/' + tag + '.mp3');
}

if (require.main === module) {
  stitch().catch(e => { console.error('THE STITCH TORE:', e.message); process.exit(1); });
}

module.exports = { stitch };
