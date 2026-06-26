/* ============================================================================
   library.js — Amenti shared Reading Room renderer
   ----------------------------------------------------------------------------
   A single shared script that any page (Page1, Page2, future pages) includes.
   It is NOT a page itself and is never visited directly. It opens a primary-
   source "reading room" as an in-page overlay, sourced from the /library/
   repository (catalog JSON + .md body files).

   USE FROM ANY PAGE:
     <script src="library.js"></script>
     ...
     <button data-reading-room="lincoln">Open Lincoln's file</button>
     // or programmatically:
     Amenti.openReadingRoom('lincoln');

   OPTIONAL CONFIG (set before this script loads, or any time):
     window.AMENTI_LIBRARY_BASE  = 'library/';        // where the repo lives
     window.AMENTI_TERMINAL_URL  = 'Terminal.html';   // "ask about this" target
     window.AMENTI_ASK_ENABLED   = true;              // show the "ask" action

   The source texts NEVER live in this file — they are fetched at runtime,
   which is the whole point of the library architecture.

   VOICE (Recitation register): each stored primary-source document gets a
   "Read aloud" control that speaks it via Gemini TTS through the Amenti Worker.
   The room is EMBODIED — it resolves the figure in the published roster (by
   name) and speaks in that figure's own voice + dialect, exactly the way the
   Atlantica/Daily Planet surfaces do. If a figure isn't found, it falls back to
   the neutral recitation voice so nothing ever breaks.

   WORK MODES (catalog "mode" field):
     stored    — fetch the .md body, render inline, offer Read aloud   (speaks)
     recall    — reconstruct a public-domain passage via the AI bridge
     link      — external source; a button opens the URL in a new tab
     designed  — an in-repo designed document (its own layout, type, diagrams);
                 a button opens it full-bleed in its own tab, and the note is
                 shown on the card. This is the "show" domain — the Stage Three
                 artifact layer — and it is presented in its own frame, not in
                 the 760px recitation overlay.
   ========================================================================== */
(function () {
  'use strict';
  if (window.Amenti && window.Amenti.__readingRoom) return; // include-once guard

  var Amenti = (window.Amenti = window.Amenti || {});
  Amenti.__readingRoom = true;

  // ---- Recitation voice (Gemini TTS via the Amenti Worker) ------------------
  // Stage I — the long voice that carries. A whole document spoken in one /speak
  // call 524s (Cloudflare's ~100s edge timeout), so the reading is split into
  // small chunks; each is its own fast /speak call, and the returned WAV clips
  // are decoded and scheduled back-to-back on the Web Audio clock so they play
  // in order, gap-free, as they arrive. The first chunk sounds almost at once
  // while the rest generate behind it. The Worker is unchanged.
  //
  // The chunker is deterministic: identical prose yields identical chunks, so the
  // Worker's content-addressed R2 audio archive returns cache hits on re-reads.
  // CHUNK_MAX and the split rule are a LOCKED convention — changing them silently
  // orphans every cached clip. plainText() is the canonical strip; keep it the
  // same across surfaces so /speak cache keys align.
  var VOICE_WORKER = 'https://amenti-proxy.ingram-ian.workers.dev/speak';
  var VOICE_REGISTER = 'Read clearly, in a measured, dignified tone';
  var VOICE_NAME_DEFAULT = 'Kore';   // neutral fallback voice when no figure is resolved
  var CHUNK_MAX       = 320;   // chars per chunk — comfortably under the edge timeout
  var CHUNK_LOOKAHEAD = 2;     // chunks fetched ahead of playback (1 + this in flight)
  var CHUNK_TIMEOUT   = 60000; // ms — abort a hung chunk so it can never stall the reading
  var START_TIMEOUT   = 40000; // ms — if no audio has begun by now, declare a failed start

  // ---- Cadence (deterministic, derived from the text — no tuning) -----------
  // The seams between chunks are where the voice re-rolls; rather than hide that,
  // we phrase around it. A small rest at each boundary turns a voice change into
  // a breath between thoughts, and a slight speed lift gives a human pace (TTS
  // defaults read slowly). All values come from the text's own punctuation, so
  // every reading is rhythmic the same way, with zero auditioning.
  //   RATE_FAST/SLOW: words inside a chunk, compressed (fast body, slow ending)
  //   REST_SOFT     : after a chunk ending on a comma / dash / colon  (half beat)
  //   REST_SENTENCE : after a chunk ending a sentence ( . ! ? )       (one beat)
  //   REST_PARA     : after a chunk that ends a paragraph             (a measure)
  // "A little goes a long way" — kept restrained on purpose.
  //
  // Fast/slow: the body of a paragraph runs quick (RATE_FAST); the chunk that
  // CLOSES a paragraph settles and lands (RATE_SLOW). Rush the thought, settle the
  // ending — keyed to meaning, not a word count. Pace overall is well above TTS
  // default, which reads too slowly for natural speech.
  // Speed is NO LONGER done via playbackRate — resampling a buffer pitches the
  // voice up (the "chipmunk"), because buffer-source playbackRate is not pitch-
  // preserving. Both rates are held at 1.0 (true voice, no resampling). Faster
  // delivery is instead requested from the model in the style direction (see
  // PACE_DIRECTION below), which changes how it speaks, not the sample rate.
  var RATE_FAST = 1.0;   // true voice — no pitch shift
  var RATE_SLOW = 1.0;   // true voice — no pitch shift
  var REST_SOFT     = 0.16;  // seconds — comma / colon / dash
  var REST_SENTENCE = 0.38;  // seconds — sentence end
  var REST_PARA     = 0.85;  // seconds — paragraph end

  // Pace asked of the model itself (no pitch shift). Folded into every /speak
  // style string so the voice is delivered briskly rather than the default slow
  // TTS cadence. This is a model-side direction, so it complies unevenly and it
  // is part of the /speak cache key — changing the wording re-renders the archive.
  var PACE_DIRECTION = 'Speak at a brisk, lively, natural pace, as a person speaking energetically — not slow or ponderous';
  var READ_ALOUD = '\ud83d\udd0a Read aloud';
  var READ_STOP  = '\u23f9 Stop';
  var READ_RETRY = '\u21bb Retry';

  var voicePlayer = null;     // the one active streaming reader (one voice at a time)
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }

  // ---- Embodiment: resolve a figure's voice from the published roster -------
  // The roster CSV is the one source of truth shared with Atlantica/Daily Planet.
  // We fetch it once (cached), key figures by lowercased Full Name, and compose
  // voice + style the same way the Worker does:
  //   gender -> base voice (male:Charon, female:Kore, default Kore)
  //   style  = register + ". Accent and dialect: <dialect>. Voice character: <voice>"
  // A room resolves its figure by catalog.name (NOT catalog.key — the catalog key
  // is a short slug like "ingram", but the roster keys by full name "ian ingram").
  var LEDGER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSN9sBzULLi1dZrhxuoNISIz8hSniWKyLqeYRnAGZEwfp4SaUXu5mo0SHoQlQYi7M3zDzwbAjLWh1Gs/pub?gid=1225210076&single=true&output=csv';
  var rosterPromise = null;   // Promise -> { lowercasedName: figure }

  function baseVoiceFor(gender) {
    var g = String(gender || '').toLowerCase();
    if (g.charAt(0) === 'm') return 'Charon';
    if (g.charAt(0) === 'f') return 'Kore';
    return VOICE_NAME_DEFAULT;
  }
  function composeStyle(fig) {
    var s = VOICE_REGISTER;
    if (fig && fig.dialect) s += '. Accent and dialect: ' + fig.dialect;
    if (fig && fig.voice)   s += '. Voice character: ' + fig.voice;
    s += '. ' + PACE_DIRECTION;
    return s;
  }

  // RFC-4180-ish CSV parser (same shape as the Worker's): quoted fields, embedded
  // commas/newlines, doubled "" escapes, CRLF.
  function parseCsv(text) {
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* ignore */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    var header = rows[0].map(function (h) { return h.trim(); });
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      if (rows[r].length === 1 && rows[r][0] === '') continue;
      var obj = {};
      for (var k = 0; k < header.length; k++) obj[header[k]] = (rows[r][k] || '').trim();
      out.push(obj);
    }
    return out;
  }
  function rowToFigure(row) {
    var name = row['Full Name'] || row['Name'] || '';
    if (!name) return null;
    return {
      key: name.toLowerCase().trim(),
      name: name,
      gender: row['Gender'] || '',
      dialect: row['Dialect'] || '',
      voice: row['Voice'] || ''
    };
  }
  // Fetch + index the roster once. Never rejects to the caller: on any failure it
  // resolves to an empty map so readings fall back to the neutral voice.
  function loadRoster() {
    if (rosterPromise) return rosterPromise;
    rosterPromise = fetch(LEDGER_CSV_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('roster CSV ' + r.status); return r.text(); })
      .then(function (text) {
        var map = {};
        parseCsv(text).forEach(function (row) { var f = rowToFigure(row); if (f) map[f.key] = f; });
        return map;
      })['catch'](function (err) {
        console.warn('Reading voice: roster unavailable, using neutral voice:', err && err.message);
        return {};
      });
    return rosterPromise;
  }
  // Resolve a figure by display name -> { voice, style }. Always resolves.
  function resolveVoice(name) {
    return loadRoster().then(function (map) {
      var fig = map[String(name || '').toLowerCase().trim()];
      return { voice: baseVoiceFor(fig && fig.gender), style: composeStyle(fig), figure: fig || null };
    });
  }

  // decodeAudioData, normalized to a Promise (supports both the modern promise
  // form and the older callback form Safari shipped first).
  function decodeAudio(ctx, bytes) {
    return new Promise(function (resolve, reject) {
      var p;
      try { p = ctx.decodeAudioData(bytes, resolve, reject); }
      catch (e) { reject(e); return; }
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  // Strip markdown to clean prose so the model reads words, not symbols. Unlike a
  // teaser strip, this PRESERVES paragraph breaks (blank lines) — the cadence uses
  // them for the long rest. Inline whitespace is still collapsed.
  function plainText(md) {
    return String(md || '')
      .replace(/\r\n?/g, '\n')
      .replace(/^#+\s*/gm, '')            // headings
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // bold
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')      // italic
      .replace(/_([^_]+)_/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '')       // list bullets
      .replace(/[ \t]+/g, ' ')            // collapse inline whitespace, keep newlines
      .replace(/\n{3,}/g, '\n\n')         // normalize blank runs to a single break
      .replace(/[ \t]*\n[ \t]*/g, '\n')   // trim spaces around newlines
      .trim();
  }

  // Choose the rest that follows a chunk, from the punctuation it ended on.
  function restFor(chunkText, endsParagraph) {
    if (endsParagraph) return REST_PARA;
    var last = chunkText.replace(/["')\]\u201d\u2019]+$/, '').slice(-1);
    if (last === '.' || last === '!' || last === '?') return REST_SENTENCE;
    if (last === ',' || last === ';' || last === ':' || last === '\u2014' || last === '-') return REST_SOFT;
    return REST_SENTENCE; // default to a full beat at any other boundary
  }

  // Deterministic chunker. Splits on PARAGRAPHS first (each paragraph's last chunk
  // carries the long rest), then packs whole sentences up to CHUNK_MAX within each
  // paragraph — so short sentences ride together (no stutter of tiny clips, which
  // would multiply voice re-rolls) while a seam still lands on a real boundary.
  // Returns [{ text, rest }] — rest is seconds of silence to follow the chunk.
  function splitSentences(text) {
    var parts = String(text).match(/[^.!?]+[.!?]+[)\]"'\u201d\u2019]*\s*|[^.!?]+$/g);
    if (!parts) { var t = String(text).trim(); return t ? [t] : []; }
    var out = [];
    for (var i = 0; i < parts.length; i++) { var s = parts[i].trim(); if (s) out.push(s); }
    return out;
  }
  function hardSplit(sentence, maxChars) {
    var words = sentence.split(/\s+/), out = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (cur && cur.length + 1 + w.length > maxChars) { out.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) out.push(cur);
    return out;
  }
  function chunkText(text, maxChars) {
    var paragraphs = String(text).split(/\n{2,}/);
    var chunks = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var para = paragraphs[p].replace(/\n/g, ' ').trim();
      if (!para) continue;
      var sentences = splitSentences(para), pieces = [], cur = '';
      for (var i = 0; i < sentences.length; i++) {
        var s = sentences[i];
        if (s.length > maxChars) {
          if (cur) { pieces.push(cur); cur = ''; }
          var hs = hardSplit(s, maxChars);
          for (var j = 0; j < hs.length; j++) pieces.push(hs[j]);
          continue;
        }
        if (cur && cur.length + 1 + s.length > maxChars) { pieces.push(cur); cur = s; }
        else cur = cur ? cur + ' ' + s : s;
      }
      if (cur) pieces.push(cur);
      // tag each piece with its rest + rate; only the paragraph's last piece gets
      // the long rest and the slow, settling rate — the rest run fast.
      for (var k = 0; k < pieces.length; k++) {
        var endsPara = (k === pieces.length - 1);
        chunks.push({ text: pieces[k], rest: restFor(pieces[k], endsPara), rate: endsPara ? RATE_SLOW : RATE_FAST });
      }
    }
    return chunks;
  }

  // Fetch one chunk's WAV bytes from the Worker, in the given voice + style.
  // Retries the known transient where Gemini returns text instead of audio
  // (/speak -> 502 {error:"no_audio"}), so a single flaky chunk doesn't leave a
  // silent gap in the reading.
  function fetchChunkBytes(chunk, style, voice, signal) {
    var attempts = 0;
    function go() {
      // Each attempt gets its own controller so a hung request can be aborted by
      // CHUNK_TIMEOUT without touching the others; the room-wide `signal` is
      // bridged in so closing the room still cancels an in-flight chunk.
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = null, onAbort = null;
      function cleanup() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (signal && onAbort) { try { signal.removeEventListener('abort', onAbort); } catch (e) {} onAbort = null; }
      }
      if (ctrl) {
        timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, CHUNK_TIMEOUT);
        if (signal) {
          if (signal.aborted) { try { ctrl.abort(); } catch (e) {} }
          else { onAbort = function () { try { ctrl.abort(); } catch (e) {} }; try { signal.addEventListener('abort', onAbort); } catch (e) {} }
        }
      }
      return fetch(VOICE_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: (chunk && chunk.text != null) ? chunk.text : chunk, style: style, voice: voice }),
        signal: ctrl ? ctrl.signal : signal
      }).then(function (r) {
        if (r.ok) return r.arrayBuffer();
        return r.json().then(function (j) { return j; }, function () { return null; })
          .then(function (j) {
            var msg = (j && j.error) || ('voice ' + r.status);
            if (msg === 'no_audio' && attempts < 2) { attempts++; cleanup(); return go(); }
            throw new Error(msg);
          });
      }).then(
        function (out) { cleanup(); return out; },
        function (err) { cleanup(); throw err; }
      );
    }
    return go();
  }

  function clearWatchdog(p) { if (p && p.watchdog) { clearTimeout(p.watchdog); p.watchdog = null; } }

  // Stop whatever is currently reading: cancel pending fetches, stop scheduled
  // audio, reset the button. Safe to call when nothing is playing.
  function stopReading() {
    var p = voicePlayer;
    voicePlayer = null;
    if (!p) return;
    p.cancelled = true;
    clearWatchdog(p);
    if (p.abort) { try { p.abort.abort(); } catch (e) {} }
    for (var i = 0; i < p.sources.length; i++) {
      try { p.sources[i].onended = null; p.sources[i].stop(); } catch (e) {}
    }
    p.sources = [];
    if (p.btn) { p.btn.textContent = READ_ALOUD; p.btn.disabled = false; }
  }

  // Same teardown as stopReading, but leaves the button on Retry — used when a
  // reading never managed to start, so the click is never a silent dead end.
  function failStart(p) {
    if (!p || p.cancelled) return;
    p.cancelled = true;
    clearWatchdog(p);
    if (p.abort) { try { p.abort.abort(); } catch (e) {} }
    for (var i = 0; i < p.sources.length; i++) {
      try { p.sources[i].onended = null; p.sources[i].stop(); } catch (e) {}
    }
    p.sources = [];
    if (voicePlayer === p) voicePlayer = null;
    if (p.btn) { p.btn.textContent = READ_RETRY; p.btn.disabled = false; }
  }

  // Begin a chunked, gap-free reading of `text` on `btn`, in the resolved voice +
  // style. Assigns voicePlayer.
  function startReading(text, btn, style, voice) {
    var ctx;
    try { ctx = getAudioCtx(); }
    catch (e) {
      // No Web Audio, or the context was blocked — surface Retry, never hang.
      console.error('Reading voice: audio unavailable:', e && e.message);
      if (btn) { btn.textContent = READ_RETRY; btn.disabled = false; }
      return;
    }
    var chunks = chunkText(plainText(text), CHUNK_MAX);
    if (!chunks.length) { if (btn) { btn.textContent = READ_ALOUD; btn.disabled = false; } return; }

    var useStyle = style || composeStyle(null);
    var useVoice = voice || VOICE_NAME_DEFAULT;

    var player = {
      cancelled: false,
      abort: (typeof AbortController !== 'undefined') ? new AbortController() : null,
      sources: [], nextStart: 0, ready: {}, toSchedule: 0,
      scheduled: 0, total: chunks.length, producerDone: false, started: false,
      btn: btn, watchdog: null
    };
    voicePlayer = player;

    // Failsafe: if not one chunk has begun playing within START_TIMEOUT, treat the
    // start as failed — cancel and leave the button on Retry so the click is never
    // a dead end. A visible Retry, not a blind auto-retry: re-firing the same call
    // behind a slow-but-alive first one would double-render and overlap audio.
    player.watchdog = setTimeout(function () {
      if (player.cancelled || player.started) return;
      console.error('Reading voice: no audio after ' + START_TIMEOUT + 'ms — offering retry.');
      failStart(player);
    }, START_TIMEOUT);

    function finish() {
      if (player.cancelled) return;
      if (player.producerDone && player.scheduled === player.total && player.sources.length === 0) {
        clearWatchdog(player);
        // started === false means every chunk failed — show Retry, not a silent reset.
        if (player.btn) { player.btn.textContent = player.started ? READ_ALOUD : READ_RETRY; player.btn.disabled = false; }
        if (voicePlayer === player) voicePlayer = null;
      }
    }
    function scheduleBuf(buf, rest, rate) {
      if (player.cancelled) return;
      var useRate = rate || RATE_FAST;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      // Compress the words inside the chunk for a human pace (pitch-preserving on
      // browsers that honor it; rate varies fast/slow by position, not randomly,
      // so it reads as phrasing rather than drift).
      try { src.playbackRate.value = useRate; } catch (e) {}
      src.connect(ctx.destination);
      var at = Math.max(player.nextStart, ctx.currentTime + 0.05);
      src.start(at);
      // played duration shrinks by the playback rate; then add this chunk's rest
      // (the cadence breath, chosen from its ending punctuation) before the next.
      var played = buf.duration / (useRate || 1);
      player.nextStart = at + played + (rest || 0);
      player.scheduled++;
      player.sources.push(src);
      if (!player.started) {
        player.started = true;
        clearWatchdog(player);
        if (player.btn) { player.btn.textContent = READ_STOP; player.btn.disabled = false; }
      }
      src.onended = function () {
        var k = player.sources.indexOf(src);
        if (k >= 0) player.sources.splice(k, 1);
        finish();
      };
    }
    // schedule decoded buffers strictly in order; a failed chunk is recorded as
    // null and skipped (still counted) so it never stalls the queue.
    function drain() {
      while (Object.prototype.hasOwnProperty.call(player.ready, player.toSchedule)) {
        var entry = player.ready[player.toSchedule];
        delete player.ready[player.toSchedule];
        player.toSchedule++;
        if (entry && entry.buf) scheduleBuf(entry.buf, entry.rest, entry.rate);
        else { player.scheduled++; finish(); }
      }
    }

    var cap = CHUNK_LOOKAHEAD + 1, next = 0, inflight = 0;
    function done() {
      inflight--;
      if (player.cancelled) return;
      if (next >= chunks.length && inflight === 0) { player.producerDone = true; finish(); }
      else pump();
    }
    function pump() {
      while (!player.cancelled && inflight < cap && next < chunks.length) {
        (function (idx) {
          inflight++;
          fetchChunkBytes(chunks[idx], useStyle, useVoice, player.abort ? player.abort.signal : null)
            .then(function (bytes) {
              if (player.cancelled) return null;
              return decodeAudio(ctx, bytes);
            })
            .then(function (buf) {
              if (!player.cancelled) { player.ready[idx] = buf ? { buf: buf, rest: chunks[idx].rest, rate: chunks[idx].rate } : null; drain(); }
              done();
            }, function (err) {
              if (!player.cancelled) {
                console.error('Reading voice chunk ' + idx + ' failed:', err && err.message);
                player.ready[idx] = null; drain();
              }
              done();
            });
        })(next);
        next++;
      }
    }
    pump();
  }

  // Read-aloud button handler: toggles. Click the active button to stop; click a
  // different one to switch readings. `figureName` resolves the embodied voice;
  // it falls back to the neutral voice if the figure isn't in the roster.
  function speakReading(text, btn, figureName) {
    try {
      var active = voicePlayer;
      if (active) {
        var sameBtn = (active.btn === btn);
        stopReading();
        if (sameBtn) return;
      }
      if (btn) { btn.textContent = '\u2026 generating'; btn.disabled = true; }
      resolveVoice(figureName).then(function (v) {
        // If the user cancelled (or started another) while the roster loaded, bail.
        if (btn && btn.disabled === false) return;
        startReading(text, btn, v.style, v.voice);
      }, function () {
        startReading(text, btn, composeStyle(null), VOICE_NAME_DEFAULT);
      });
    } catch (e) {
      console.error('Reading voice start failed:', e && e.message);
      if (btn) { btn.textContent = READ_RETRY; btn.disabled = false; }
    }
  }

  // ---- config ---------------------------------------------------------------
  function base() {
    var b = window.AMENTI_LIBRARY_BASE || 'library/';
    return b.charAt(b.length - 1) === '/' ? b : b + '/';
  }
  function terminalUrl() { return window.AMENTI_TERMINAL_URL || 'Terminal.html'; }
  function askEnabled() { return window.AMENTI_ASK_ENABLED !== false; }

  // ---- tiny utilities -------------------------------------------------------
  var catalogCache = {};   // key -> catalog object
  var bodyCache = {};      // file path -> markdown string
  var lastFocus = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Minimal, safe markdown: escapes first, then paragraphs / lists / inline.
  function renderMarkdown(src) {
    var text = String(src || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    var blocks = text.split(/\n\s*\n/);
    var html = '';
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var lines = block.split('\n');
      var isList = lines.every(function (l) { return /^\s*[-*]\s+/.test(l); }) && lines.length > 0;
      if (isList) {
        html += '<ul class="amlib-ul">';
        for (var j = 0; j < lines.length; j++) {
          html += '<li>' + inline(esc(lines[j].replace(/^\s*[-*]\s+/, ''))) + '</li>';
        }
        html += '</ul>';
      } else {
        html += '<p>' + inline(esc(block.replace(/\n/g, ' '))) + '</p>';
      }
    }
    return html || '<p></p>';
  }
  // inline runs on already-escaped text, so no markup can be injected
  function inline(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
  }

  function fetchText(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.text();
    });
  }
  function fetchCatalog(key) {
    if (catalogCache[key]) return Promise.resolve(catalogCache[key]);
    return fetchText(base() + key + '.json').then(function (t) {
      var c = JSON.parse(t);
      catalogCache[key] = c;
      return c;
    });
  }
  function fetchBody(file) {
    if (bodyCache[file]) return Promise.resolve(bodyCache[file]);
    return fetchText(base() + file).then(function (t) { bodyCache[file] = t; return t; });
  }
  // Atlantica dispatches live in atlantica.json at the site root (the same file the
  // Page 1 band and Page 2 tablet read). Fetched once, cached, and never blocks the room.
  var atlanticaCache = null, currentRoomKey = null;
  function fetchAtlantica() {
    if (atlanticaCache) return atlanticaCache;
    atlanticaCache = fetch('atlantica.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    return atlanticaCache;
  }

  // ---- styles (injected once) ----------------------------------------------
  function injectStyles() {
    if (document.getElementById('amlib-styles')) return;
    var css = [
      '.amlib-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-start;',
      'justify-content:center;padding:6vh 16px 16px;background:rgba(6,8,16,.74);',
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .22s ease;overflow-y:auto;}',
      '.amlib-overlay.amlib-on{opacity:1;}',
      '.amlib-panel{position:relative;width:100%;max-width:760px;margin:auto 0;',
      'background:linear-gradient(180deg,#12141f,#0d0f18);border:1px solid var(--wire,#2a2f45);',
      'border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:translateY(14px);',
      'transition:transform .24s ease;overflow:hidden;}',
      '.amlib-overlay.amlib-on .amlib-panel{transform:translateY(0);}',
      '.amlib-top{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;gap:14px;',
      'padding:22px 24px 18px;background:linear-gradient(180deg,#12141f,rgba(18,20,31,.86));',
      'border-bottom:1px solid var(--wire,#2a2f45);}',
      '.amlib-eyebrow{font-family:var(--font-mono,ui-monospace,monospace);font-size:10px;letter-spacing:.22em;',
      'text-transform:uppercase;color:var(--gold,#d4af37);opacity:.85;margin-bottom:6px;}',
      '.amlib-figure{font-family:var(--font-script,Georgia,serif);font-size:25px;line-height:1.1;color:#fff;}',
      '.amlib-close{margin-left:auto;flex-shrink:0;width:34px;height:34px;border-radius:8px;',
      'border:1px solid var(--wire,#2a2f45);background:transparent;color:var(--text,#cdd3e0);',
      'font-size:17px;cursor:pointer;transition:background .15s,border-color .15s;}',
      '.amlib-close:hover{background:rgba(255,255,255,.05);border-color:var(--gold,#d4af37);}',
      '.amlib-scroll{padding:8px 24px 26px;}',
      '.amlib-sec{font-family:var(--font-mono,ui-monospace,monospace);font-size:10px;letter-spacing:.16em;',
      'text-transform:uppercase;color:var(--gold,#d4af37);opacity:.7;margin:24px 0 4px;}',
      '.amlib-sec:first-child{margin-top:10px;}',
      '.amlib-work{border:1px solid var(--wire,#2a2f45);border-radius:10px;margin-top:10px;',
      'overflow:hidden;background:rgba(255,255,255,.012);}',
      '.amlib-work-head{display:flex;align-items:center;gap:12px;padding:13px 14px;}',
      '.amlib-work-meta{display:flex;flex-direction:column;gap:3px;min-width:0;}',
      '.amlib-work-title{font-family:var(--font-script,Georgia,serif);font-size:16px;color:#fff;line-height:1.2;}',
      '.amlib-work-sub{font-family:var(--font-mono,ui-monospace,monospace);font-size:10px;letter-spacing:.06em;',
      'text-transform:uppercase;color:var(--text,#cdd3e0);opacity:.5;}',
      '.amlib-badge{display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:1px 7px;border-radius:20px;',
      'font-size:9px;letter-spacing:.08em;border:1px solid currentColor;vertical-align:middle;}',
      '.amlib-badge.v{color:#5fd0a0;}.amlib-badge.x{color:#7f96d4;}.amlib-badge.r{color:#d4a24a;}.amlib-badge.d{color:#6fd0c0;}',
      '.amlib-work-btn{margin-left:auto;flex-shrink:0;padding:8px 14px;border:1px solid var(--gold,#d4af37);',
      'border-radius:7px;background:rgba(212,175,55,.08);color:var(--gold,#d4af37);',
      'font-family:var(--font-mono,ui-monospace,monospace);font-size:11px;letter-spacing:.06em;',
      'cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-block;transition:background .15s;}',
      '.amlib-work-btn:hover{background:rgba(212,175,55,.18);}',
      '.amlib-work-btn:disabled{opacity:.55;cursor:default;}',
      '.amlib-work-body{padding:0 16px 16px;}',
      '.amlib-cite{font-family:var(--font-mono,ui-monospace,monospace);font-size:11px;letter-spacing:.03em;',
      'color:var(--text,#cdd3e0);opacity:.55;margin:2px 0 14px;}',
      '.amlib-doc{font-family:Iowan Old Style,Palatino,Georgia,serif;font-size:16.5px;line-height:1.72;',
      'color:#e7e9f0;max-width:62ch;}',
      '.amlib-doc p{margin:0 0 1.05em;}',
      '.amlib-doc p:last-child{margin-bottom:0;}',
      '.amlib-doc em{font-style:italic;}.amlib-doc strong{font-weight:600;color:#fff;}',
      '.amlib-ul{margin:0 0 1.05em;padding-left:1.25em;}.amlib-ul li{margin:.2em 0;}',
      '.amlib-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}',
      '.amlib-ask{font-family:var(--font-mono,ui-monospace,monospace);font-size:11px;letter-spacing:.05em;',
      'color:var(--gold,#d4af37);text-decoration:none;border:1px solid var(--wire,#2a2f45);',
      'padding:8px 13px;border-radius:7px;transition:border-color .15s;cursor:pointer;background:transparent;}',
      '.amlib-ask:hover{border-color:var(--gold,#d4af37);}',
      '.amlib-ask:disabled{opacity:.55;cursor:default;}',
      '.amlib-msg{font-family:var(--font-mono,ui-monospace,monospace);font-size:12.5px;line-height:1.55;',
      'color:var(--text,#cdd3e0);opacity:.8;padding:18px 4px;}',
      '.amlib-msg a{color:var(--gold,#d4af37);}',
      '.amlib-err{font-family:var(--font-mono,ui-monospace,monospace);font-size:12.5px;line-height:1.55;',
      'color:#e7a; padding:6px 0;}.amlib-err a{color:var(--gold,#d4af37);}',
      '@media (max-width:560px){.amlib-overlay{padding:0;}.amlib-panel{border-radius:0;min-height:100%;}',
      '.amlib-figure{font-size:22px;}.amlib-doc{font-size:16px;}}',
      '@media (prefers-reduced-motion:reduce){.amlib-overlay,.amlib-panel{transition:none;}}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'amlib-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---- overlay shell --------------------------------------------------------
  var overlay = null, panel = null, scrollEl = null, figureEl = null;

  function ensureShell() {
    if (overlay) return;
    injectStyles();
    overlay = document.createElement('div');
    overlay.className = 'amlib-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Reading room');
    overlay.innerHTML =
      '<div class="amlib-panel">' +
        '<div class="amlib-top">' +
          '<div><div class="amlib-eyebrow">Reading Room</div>' +
          '<div class="amlib-figure" id="amlib-figure"></div></div>' +
          '<button class="amlib-close" id="amlib-close" aria-label="Close reading room">\u2715</button>' +
        '</div>' +
        '<div class="amlib-scroll" id="amlib-scroll"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    panel = overlay.querySelector('.amlib-panel');
    scrollEl = overlay.querySelector('#amlib-scroll');
    figureEl = overlay.querySelector('#amlib-figure');

    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) Amenti.closeReadingRoom(); });
    overlay.querySelector('#amlib-close').addEventListener('click', function () { Amenti.closeReadingRoom(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('amlib-on')) Amenti.closeReadingRoom();
    });
  }

  // ---- rendering ------------------------------------------------------------
  function badge(mode) {
    if (mode === 'stored') return '<span class="amlib-badge v">\u2713 Verified</span>';
    if (mode === 'link') return '<span class="amlib-badge x">\u2197 External</span>';
    if (mode === 'recall') return '<span class="amlib-badge r">\u25f7 Recalled</span>';
    if (mode === 'designed') return '<span class="amlib-badge d">\u25c6 Designed</span>';
    return '';
  }

  function renderRoom(catalog) {
    currentRoomKey = catalog.key;
    var name = catalog.name || (catalog.key || '').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    figureEl.textContent = name;
    overlay.setAttribute('aria-label', 'Reading room — ' + name);

    var works = catalog.works || [];
    if (!works.length) {
      scrollEl.innerHTML = '<div class="amlib-msg">No documents in this file yet.</div>';
      return;
    }
    // group by section, preserving first-seen order
    var order = [], groups = {};
    works.forEach(function (w) {
      var s = w.section || '\u2014';
      if (!groups[s]) { groups[s] = []; order.push(s); }
      groups[s].push(w);
    });

    var firstName = name.split(/\s+/)[0];
    var html = '';
    order.forEach(function (sec) {
      html += '<div class="amlib-sec">' + esc(sec) + '</div>';
      groups[sec].forEach(function (w) {
        var idx = works.indexOf(w);
        var sub = [w.year, w.type].filter(Boolean).join(' \u00b7 ');
        var action, bodyInner = '', bodyHidden = ' hidden';
        if (w.mode === 'link') {
          action = '<a class="amlib-work-btn" href="' + esc(w.url || '#') + '" target="_blank" rel="noopener">Open at source \u2197</a>';
        } else if (w.mode === 'designed') {
          // "Show" domain: open the designed document in its own full-bleed tab.
          // The note/source is shown on the card, since there is no inline body.
          action = '<a class="amlib-work-btn" href="' + esc(w.url || '#') + '" target="_blank" rel="noopener">Open document \u2192</a>';
          bodyInner = citeLine(w);
          bodyHidden = '';
        } else if (w.mode === 'recall') {
          action = '<button class="amlib-work-btn" data-act="recall" data-wi="' + idx + '">Recall \u25be</button>';
        } else {
          action = '<button class="amlib-work-btn" data-act="read" data-wi="' + idx + '">Read \u25be</button>';
        }
        html +=
          '<div class="amlib-work" data-wi="' + idx + '">' +
            '<div class="amlib-work-head"><div class="amlib-work-meta">' +
              '<span class="amlib-work-title">' + esc(w.title || 'Untitled') + badge(w.mode) + '</span>' +
              (sub ? '<span class="amlib-work-sub">' + esc(sub) + '</span>' : '') +
            '</div>' + action + '</div>' +
            '<div class="amlib-work-body"' + bodyHidden + '>' + bodyInner + '</div>' +
          '</div>';
      });
    });
    scrollEl.innerHTML = html;

    // wire expandable actions
    scrollEl.querySelectorAll('.amlib-work-btn[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wi = +btn.getAttribute('data-wi');
        var w = works[wi];
        var bodyEl = scrollEl.querySelector('.amlib-work[data-wi="' + wi + '"] .amlib-work-body');
        if (!bodyEl.hidden) { bodyEl.hidden = true; btn.textContent = (w.mode === 'recall' ? 'Recall' : 'Read') + ' \u25be'; return; }
        openWork(w, catalog, firstName, bodyEl, btn);
      });
    });

    appendAtlanticaLink(catalog.key);
  }

  // Lean Atlantica surfacing :: if this figure has a dispatch in atlantica.json
  // (sourced[].figureKey === key), append a clearly-labeled deep-link to it.
  // Never a saved copy, never under "Verified" — one source of truth, two surfaces.
  function appendAtlanticaLink(key) {
    fetchAtlantica().then(function (data) {
      if (!data || !Array.isArray(data.sourced)) return;
      if (currentRoomKey !== key) return;                      // room changed while loading
      if (scrollEl.querySelector('.amlib-atlantica')) return;  // already appended
      var hits = data.sourced.filter(function (s) { return s.figureKey === key; });
      if (!hits.length) return;
      var html = '<div class="amlib-sec amlib-atlantica">\u2726 Atlantica</div>';
      hits.forEach(function (s) {
        html +=
          '<div class="amlib-work">' +
            '<div class="amlib-work-head"><div class="amlib-work-meta">' +
              '<span class="amlib-work-title">' + esc(s.title || 'Dispatch') +
                '<span class="amlib-badge" style="color:#c9a6ff;">\u2726 in their own voice</span></span>' +
              '<span class="amlib-work-sub">An AI reflection on ' + esc(s.eventTitle || '') + ' \u2014 not a primary source</span>' +
            '</div>' +
            '<a class="amlib-work-btn" href="Page2.html#atlantica/' + encodeURIComponent(s.id) + '">Read the dispatch \u2192</a>' +
          '</div>' +
        '</div>';
      });
      scrollEl.insertAdjacentHTML('beforeend', html);
    });
  }

  function citeLine(w) {
    var bits = [];
    if (w.source) bits.push(w.source);
    if (w.note) bits.push('<i>' + esc(w.note) + '</i>');
    return bits.length ? '<div class="amlib-cite">' + (w.source ? esc(w.source) : '') +
      (w.source && w.note ? ' \u2014 ' : '') + (w.note ? '<i>' + esc(w.note) + '</i>' : '') + '</div>' : '';
  }

  function askAction(catalog, firstName) {
    if (!askEnabled()) return '';
    var url = terminalUrl() + '?char=' + encodeURIComponent(catalog.key || '');
    return '<a class="amlib-ask" href="' + esc(url) + '">Ask ' + esc(firstName) + ' about this \u2192</a>';
  }

  function openWork(w, catalog, firstName, bodyEl, btn) {
    btn.disabled = true;
    btn.textContent = '\u2026';
    if (w.mode === 'recall') {
      // recall depends on the AI bridge; degrade gracefully if absent
      if (window.claude && typeof window.claude.complete === 'function') {
        var sys = 'You are reproducing a short, well-known public-domain passage for a reading room. ' +
          'Output only the passage text, no preamble.';
        var ask = 'Provide ' + (w.recallHint || 'a representative public-domain passage') +
          ' from "' + (w.title || '') + '"' + (w.year ? ' (' + w.year + ')' : '') + '.';
        window.claude.complete({ system: sys, messages: [{ role: 'user', content: ask }] })
          .then(function (txt) {
            bodyEl.innerHTML = citeLine(w) +
              '<div class="amlib-doc">' + renderMarkdown(txt) + '</div>' +
              '<div class="amlib-actions">' +
              (w.readUrl ? '<a class="amlib-ask" href="' + esc(w.readUrl) + '" target="_blank" rel="noopener">Full text at source \u2197</a>' : '') +
              askAction(catalog, firstName) + '</div>';
            reveal(bodyEl, btn, w);
          })['catch'](function () { workError(bodyEl, btn, w, 'Recall is unavailable right now.'); });
      } else {
        bodyEl.innerHTML = '<div class="amlib-msg">Recalled reading isn\u2019t available on this page. ' +
          (w.readUrl ? 'Read the full text <a href="' + esc(w.readUrl) + '" target="_blank" rel="noopener">at the source \u2197</a>.' : '') +
          '</div>';
        reveal(bodyEl, btn, w);
      }
      return;
    }
    // stored: fetch the .md body
    fetchBody(w.file).then(function (md) {
      bodyEl.innerHTML = citeLine(w) +
        '<div class="amlib-doc">' + renderMarkdown(md) + '</div>' +
        '<div class="amlib-actions">' +
          '<button class="amlib-ask amlib-readaloud" type="button">\ud83d\udd0a Read aloud</button>' +
          askAction(catalog, firstName) +
        '</div>';
      var raBtn = bodyEl.querySelector('.amlib-readaloud');
      // Embody the reading in the figure's own voice (resolved from the roster by
      // the room's display name); falls back to the neutral voice if not found.
      var figureName = catalog.name || firstName;
      if (raBtn) raBtn.addEventListener('click', function () { speakReading(md, raBtn, figureName); });
      reveal(bodyEl, btn, w);
    })['catch'](function (err) {
      var link = w.url ? ' <a href="' + esc(w.url) + '" target="_blank" rel="noopener">Read at the source \u2197</a>' : '';
      workError(bodyEl, btn, w, 'Couldn\u2019t load this document (' + esc(err.message) + ').' + link);
    });
  }
  function reveal(bodyEl, btn, w) {
    bodyEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Hide \u25b4';
  }
  function workError(bodyEl, btn, w, msg) {
    bodyEl.innerHTML = '<div class="amlib-err">' + msg + '</div>';
    bodyEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Retry';
  }

  // ---- open / close ---------------------------------------------------------
  Amenti.openReadingRoom = function (key, opts) {
    if (!key) return;
    ensureShell();
    lastFocus = document.activeElement;
    overlay.style.display = 'flex';
    figureEl.textContent = '';
    scrollEl.innerHTML = '<div class="amlib-msg">Opening the file\u2026</div>';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { overlay.classList.add('amlib-on'); });
    overlay.querySelector('#amlib-close').focus();

    // Warm the roster early so the figure's voice is ready by the time the reader
    // hits Read aloud (best-effort; never blocks the room).
    loadRoster();

    fetchCatalog(key).then(function (cat) {
      if (!cat.key) cat.key = key;
      renderRoom(cat);
    })['catch'](function (err) {
      scrollEl.innerHTML = '<div class="amlib-err">Couldn\u2019t open this file (' + esc(err.message) +
        '). Check that <code>' + esc(base() + key + '.json') + '</code> exists.</div>';
    });
  };

  Amenti.closeReadingRoom = function () {
    if (!overlay) return;
    overlay.classList.remove('amlib-on');
    document.documentElement.style.overflow = '';
    var ov = overlay;
    setTimeout(function () { if (!ov.classList.contains('amlib-on')) ov.style.display = 'none'; }, 240);
    stopReading();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  };

  // ---- declarative triggers: [data-reading-room="key"] ----------------------
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-reading-room]');
    if (!t) return;
    e.preventDefault();
    Amenti.openReadingRoom(t.getAttribute('data-reading-room'));
  });
})();
