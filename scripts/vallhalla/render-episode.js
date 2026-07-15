/* ============================================================================
   render-episode.js · THE USHER'S VOICE · Layer B
   ----------------------------------------------------------------------------
   Turns the episode SCRIPT (from compose-episode.js) into AUDIO.

   Reads  vallhalla/episode-script.json
   Writes vallhalla/audio/<tag>/<segment>.mp3   (one file per usher segment)
          vallhalla/episode-manifest.json        (the play order, for stitching)

   ── THE ONE DECISION THAT KEEPS THE ARCHIVE SAFE ────────────────────────────
   /speak has TWO registers, and they live in SEPARATE cache spaces:

     RECITAL         the archive. LOCKED, cached, never varies. The Atlantica
                     readings live here. TOUCHING IT WRONG ORPHANS EVERYTHING.
     CONVERSATIONAL  "a place where prosody may vary per utterance at no cost."
                     Unique text every turn, its own cache space.

   The usher's lines are unique every week (different host, different data,
   floating epithet) — they would never hit the recital cache anyway. So we
   render them in the CONVERSATIONAL register. This means:

     · the usher's audio CANNOT collide with or orphan the recital archive
     · the two cache spaces stay cleanly separate
     · the writer's READING is NOT re-rendered here — it already exists in the
       recital archive as the Atlantica spoken edition. We reference it; we do
       not touch it.

   THE /speak CONTRACT (read from amenti-voice.js, not guessed):
     POST /speak  { text, style, voice }  ->  arrayBuffer (audio) on ok,
                                              JSON {error} otherwise.
     "no_audio" is transient — retry up to 2x.

   NO TALK-BACK. This is a batch job. Latency is irrelevant. Run it overnight.
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const SPEAK = (process.env.PROXY_URL || 'https://amenti-proxy.ingram-ian.workers.dev').replace(/\/+$/, '') + '/speak';
const OUT   = process.env.OUT_DIR || path.join(process.cwd(), 'vallhalla');

/* ── THE USHER'S VOICE, per figure ──────────────────────────────────────────
   baseVoiceFor + a conversational style, replicated from amenti-voice.js so the
   usher sounds like a member of the hall. Because this is the CONVERSATIONAL
   register, the exact string is NOT cache-locked to the archive — but we keep it
   faithful so the voice is consistent and recognizable. */
function baseVoiceFor(gender) {
  const g = String(gender || '').toLowerCase();
  if (g.charAt(0) === 'm') return 'Charon';
  if (g.charAt(0) === 'f') return 'Kore';
  return 'Charon';                       // VOICE_NAME_DEFAULT
}

const CONV_REGISTER = 'Say the following in a clear, natural, conversational voice';
const PACE = 'Speak at a measured, unhurried pace.';

/* the usher is a host: warm, wry, aware of the absurdity. That colouring lives
   in the register line, since conversational prosody may vary at no cost. */
function usherStyle(fig) {
  let s = CONV_REGISTER;
  if (fig && fig.dialect) s += '. Accent and dialect: ' + String(fig.dialect).trim();
  if (fig && fig.voice)   s += '. Voice character: ' + String(fig.voice).trim();
  s += '. ' + PACE;
  s += ' Let there be warmth and dry humour in the voice — a host who knows how ' +
       'strange it is to be here, and is glad to be here anyway.';
  return s;
}

/* the roster's voice data — gender/dialect/voice per figure. In production this
   comes from the same CSV ledger amenti-voice.js reads; here we accept it via
   episode-script.json if present, else fall back to a neutral host voice. */
function voiceFor(usherName, roster) {
  const fig = (roster || []).find(r =>
    (r.name || '').toLowerCase() === String(usherName).toLowerCase());
  return {
    voice: baseVoiceFor(fig && fig.gender),
    style: usherStyle(fig || null),
  };
}

async function speakOnce(text, style, voice) {
  let attempts = 0;
  while (true) {
    let r;
    try {
      r = await fetch(SPEAK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style, voice }),
      });
    } catch (e) {
      throw new Error('network: ' + e.message);
    }
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) throw new Error('empty audio');
      return buf;
    }
    let j = null; try { j = await r.json(); } catch (e) {}
    const msg = (j && j.error) || ('voice ' + r.status);
    if (msg === 'no_audio' && attempts < 2) { attempts++; continue; }   // transient
    throw new Error(msg);
  }
}

async function render() {
  const scriptPath = path.join(OUT, 'episode-script.json');
  if (!fs.existsSync(scriptPath)) {
    console.error('No episode-script.json. Run compose-episode.js first.');
    process.exit(1);
  }
  const ep = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  console.log('THE USHER speaks · episode ' + ep.tag + ' · host ' + ep.usher);
  console.log('  register: CONVERSATIONAL (the archive is not touched)');
  console.log('');

  const v = voiceFor(ep.usher, ep.roster);
  const dir = path.join(OUT, 'audio', ep.tag);
  fs.mkdirSync(dir, { recursive: true });

  const manifest = { tag: ep.tag, usher: ep.usher, writer: ep.writer,
                     rendered_at: new Date().toISOString(), order: [] };

  /* render each usher segment that has text (open/tour/handoff/closing) */
  for (const seg of ep.segments) {
    if (!seg.text) {
      /* the reading — reference the archived edition, do NOT render it here */
      if (seg.id === 'reading' && seg.key) {
        manifest.order.push({ id: 'reading', role: seg.role,
          source: 'recital-archive', key: seg.key,
          note: 'the writer\'s already-archived Atlantica edition — appended at stitch time' });
        console.log('  · reading   → referenced from archive (' + seg.key + '), not re-rendered');
      }
      continue;
    }
    process.stdout.write('  · ' + seg.id.padEnd(9) + '→ rendering ' + seg.text.length + ' chars … ');
    try {
      const audio = await speakOnce(seg.text, v.style, v.voice);
      const file = seg.id + '.mp3';
      fs.writeFileSync(path.join(dir, file), audio);
      manifest.order.push({ id: seg.id, role: seg.role, file: 'audio/' + ep.tag + '/' + file,
                            bytes: audio.length });
      console.log('ok (' + Math.round(audio.length / 1024) + ' KB)');
    } catch (e) {
      console.log('FAILED · ' + e.message);
      manifest.order.push({ id: seg.id, role: seg.role, error: e.message });
    }
  }

  fs.writeFileSync(path.join(OUT, 'episode-manifest.json'), JSON.stringify(manifest, null, 2));
  const ok = manifest.order.filter(o => o.file).length;
  const failed = manifest.order.filter(o => o.error).length;
  console.log('');
  console.log('  ✓ vallhalla/episode-manifest.json');
  console.log('  ' + ok + ' segment(s) voiced · ' + failed + ' failed · reading referenced from archive');
  console.log('');
  console.log('  NEXT (stitch): concatenate the manifest order into one episode file,');
  console.log('  appending the archived reading last. Then store as edition ' + ep.tag + '.');
  if (failed) process.exit(1);
}

if (require.main === module) {
  render().catch(e => { console.error('THE USHER LOST HIS VOICE:', e.message); process.exit(1); });
}

module.exports = { render, voiceFor, usherStyle };
