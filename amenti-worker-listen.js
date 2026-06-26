/* ============================================================================
   AMENTI.LIVE — Worker /listen endpoint  ·  Speech-to-Text (the return path)
   ----------------------------------------------------------------------------
   Mirror image of /speak: audio goes UP, text comes BACK. The browser records
   the seeker's voice as WAV (16 kHz mono) and POSTs the raw bytes here; this
   endpoint hands the audio to Gemini and returns the transcript as JSON.

   This is a DROP-IN ROUTE for your existing amenti-proxy Worker — the same one
   that already serves /speak. It reuses the same GEMINI_API_KEY. Add the route
   to your fetch handler (see "WIRING" at the bottom); it does not replace
   anything you already have.

   CONTRACT (matches the client in Page2 / Page1):
     Request : POST /listen
               Content-Type: audio/wav   (also accepts audio/mp3, audio/ogg,
                                           audio/flac, audio/aac, audio/aiff)
               Body: raw audio bytes
     Response: 200  { "text": "..." }            transcript (may be "")
               4xx/5xx { "error": "..." }         client retries
     CORS    : permissive, like /speak (browser is on a different origin).

   NOTES
     - Gemini accepts WAV/MP3/OGG/FLAC/AAC/AIFF for audio input. It does NOT
       accept WebM, which is why the browser sends WAV — a Worker can't transcode.
     - Inline request cap is 20 MB total. A 16 kHz mono WAV is ~32 KB/sec, so
       even a couple of minutes of speech is well within budget.
     - Transcription is English-only on Gemini today; fine for this use case.
   ============================================================================ */

// The model used for transcription. The TTS side uses a 2.5 TTS model; this is
// the matching understanding model on the same key. Bump to a newer flash model
// (e.g. 'gemini-3.5-flash') if it's enabled on your account for better accuracy.
const LISTEN_MODEL = 'gemini-2.5-flash';

// A tight transcribe instruction: spoken words only, no commentary or labels.
const TRANSCRIBE_PROMPT =
  'Transcribe the speech in this audio to plain text. Output ONLY the words that ' +
  'were spoken, in English, with normal punctuation. Do not add commentary, ' +
  'speaker labels, timestamps, quotation marks, or any text that was not spoken. ' +
  'If there is no clear speech, output nothing at all.';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Base64-encode an ArrayBuffer in chunks (btoa over a huge binary string can
// blow the call stack; 0x8000-byte windows are safe).
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}

/**
 * Handle POST /listen. `env` must carry GEMINI_API_KEY (same as /speak).
 */
export async function handleListen(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const mime = request.headers.get('Content-Type') || 'audio/wav';
    const audio = await request.arrayBuffer();
    if (!audio || audio.byteLength < 1024) return json({ error: 'no_audio' }, 400);
    if (audio.byteLength > 20 * 1024 * 1024) return json({ error: 'too_large' }, 413);

    const body = {
      contents: [{
        parts: [
          { text: TRANSCRIBE_PROMPT },
          { inline_data: { mime_type: mime, data: bufToBase64(audio) } },
        ],
      }],
      generationConfig: { temperature: 0 },
    };

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      LISTEN_MODEL + ':generateContent?key=' + env.GEMINI_API_KEY;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('[listen] gemini', r.status, detail.slice(0, 300));
      return json({ error: 'transcribe_failed', status: r.status }, 502);
    }

    const data = await r.json();
    const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    const text = parts.map((p) => p.text || '').join('').trim();
    return json({ text });
  } catch (err) {
    console.error('[listen] error', err && err.message);
    return json({ error: 'listen_exception' }, 500);
  }
}

/* ============================================================================
   WIRING — add the /listen route to your existing Worker
   ----------------------------------------------------------------------------
   Your Worker already has a fetch handler that routes /speak. Add /listen
   beside it. The shape is roughly:

     import { handleListen } from './amenti-worker-listen.js';   // or inline it

     export default {
       async fetch(request, env, ctx) {
         const { pathname } = new URL(request.url);

         if (pathname === '/speak')  return handleSpeak(request, env);   // existing
         if (pathname === '/listen') return handleListen(request, env);  // NEW

         return new Response('Not found', { status: 404 });
       }
     };

   If your Worker is a single file, paste the constants + bufToBase64 +
   handleListen above into it and add the one /listen line to the router.

   ENV: handleListen reads env.GEMINI_API_KEY — the same secret /speak already
   uses. Nothing new to provision. Deploy as usual (wrangler deploy / dashboard).

   VERIFY (after deploy), from a terminal:
     # record or grab a short WAV, then:
     curl -s -X POST https://amenti-proxy.ingram-ian.workers.dev/listen \
       -H "Content-Type: audio/wav" --data-binary @sample.wav
     # expect: {"text":"...what the clip said..."}
   ============================================================================ */
