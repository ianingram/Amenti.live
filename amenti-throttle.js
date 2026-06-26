/* ==========================================================================
   amenti-throttle.js  —  The shared "throttle": Amenti's chunked-streaming
   recitation engine, lifted verbatim from the reading-room library.js so every
   surface (Reading Room, Atlantica, Terminal, Page 2 / Emerald Tablets) speaks
   through the SAME code.

   WHY A SHARED MODULE (read before editing):
   The Worker stores each measure of audio in a content-addressed R2 cache whose
   key is sha256(model + voice + style + TEXT-OF-THE-MEASURE). Two surfaces share
   that cache ONLY if they cut the text into byte-identical measures and compose
   byte-identical style strings. The instant a surface chunks differently — a
   different CHUNK_MAX, a different strip, an extra space — its hashes diverge and
   it silently re-renders everything instead of recalling what another surface
   already paid to generate.

   Therefore: chunkText, splitSentences, hardSplit, plainText, CHUNK_MAX, the
   cadence constants, VOICE_REGISTER, PACE_DIRECTION and composeStyle below are a
   LOCKED CONVENTION. They are copied unchanged from the deployed reading room.
   Do not "improve" them here without re-deriving the reading room from the same
   module — changing them orphans the entire cached archive across all surfaces.

   USAGE (per surface):
     <script src="amenti-throttle.js"></script>
     Amenti.throttle.attach(buttonEl, {
       text:   "...the document markdown or prose...",   // or () => string
       figure: "Ian Ingram"                               // display name; optional
     });
   That single call makes the button a Read aloud / Stop / Retry toggle wired to
   the streaming engine, exactly like the reading room's raBtn.

   Lower-level API (if you need it):
     Amenti.throttle.speak(text, btn, figureName)   // same as library's speakReading
     Amenti.throttle.stop()                          // stop the active reading
     Amenti.throttle.chunk(plainTextString)          // -> [{text, rest, rate}] (cache-key view)
     Amenti.throttle.plainText(md)                   // the canonical strip
   ========================================================================== */
(function () {
  'use strict';
  var Amenti = (window.Amenti = window.Amenti || {});
  if (Amenti.throttle && Amenti.throttle.__v) return;   // include-once guard

  /* ---- config / constants (LOCKED — identical to deployed reading room) ---- */
  var VOICE_WORKER       = 'https://amenti-proxy.ingram-ian.workers.dev/speak';
  var VOICE_REGISTER     = 'Read clearly, in a measured, dignified tone';
  var VOICE_NAME_DEFAULT = 'Kore';
  var CHUNK_MAX       = 320;
  var CHUNK_LOOKAHEAD = 2;
  var CHUNK_TIMEOUT   = 60000;
  var START_TIMEOUT   = 40000;

  var RATE_FAST = 1.0;
  var RATE_SLOW = 1.0;
  var REST_SOFT     = 0.16;
  var REST_SENTENCE = 0.38;
  var REST_PARA     = 0.85;
  var PACE_DIRECTION = 'Speak at a brisk, lively, natural pace, as a person speaking energetically — not slow or ponderous';

  var READ_ALOUD = '\ud83d\udd0a Read aloud';
  var READ_STOP  = '\u23f9 Stop';
  var READ_RETRY = '\u21bb Retry';

  var voicePlayer = null;
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }

  /* ---- Embodiment: resolve a figure's voice from the published roster ------ */
  var LEDGER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSN9sBzULLi1dZrhxuoNISIz8hSniWKyLqeYRnAGZEwfp4SaUXu5mo0SHoQlQYi7M3zDzwbAjLWh1Gs/pub?gid=1225210076&single=true&output=csv';
  var rosterPromise = null;

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
  function loadRoster() {
    if (rosterPromise) return rosterPromise;
    rosterPromise = fetch(LEDGER_CSV_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('roster CSV ' + r.status); return r.text(); })
      .then(function (text) {
        var map = {};
        parseCsv(text).forEach(function (row) { var f = rowToFigure(row); if (f) map[f.key] = f; });
        return map;
      })['catch'](function (err) {
        console.warn('Throttle: roster unavailable, using neutral voice:', err && err.message);
        return {};
      });
    return rosterPromise;
  }
  function resolveVoice(name) {
    return loadRoster().then(function (map) {
      var fig = map[String(name || '').toLowerCase().trim()];
      return { voice: baseVoiceFor(fig && fig.gender), style: composeStyle(fig), figure: fig || null };
    });
  }

  function decodeAudio(ctx, bytes) {
    return new Promise(function (resolve, reject) {
      var p;
      try { p = ctx.decodeAudioData(bytes, resolve, reject); }
      catch (e) { reject(e); return; }
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  /* ---- canonical strip (LOCKED) -------------------------------------------- */
  function plainText(md) {
    return String(md || '')
      .replace(/\r\n?/g, '\n')
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .trim();
  }

  /* ---- cadence + deterministic chunker (LOCKED) ---------------------------- */
  function restFor(chunkTextStr, endsParagraph) {
    if (endsParagraph) return REST_PARA;
    var last = chunkTextStr.replace(/["')\]\u201d\u2019]+$/, '').slice(-1);
    if (last === '.' || last === '!' || last === '?') return REST_SENTENCE;
    if (last === ',' || last === ';' || last === ':' || last === '\u2014' || last === '-') return REST_SOFT;
    return REST_SENTENCE;
  }
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
      for (var k = 0; k < pieces.length; k++) {
        var endsPara = (k === pieces.length - 1);
        chunks.push({ text: pieces[k], rest: restFor(pieces[k], endsPara), rate: endsPara ? RATE_SLOW : RATE_FAST });
      }
    }
    return chunks;
  }

  /* ---- engine: fetch, schedule, watchdog (verbatim) ------------------------ */
  function fetchChunkBytes(chunk, style, voice, signal) {
    var attempts = 0;
    function go() {
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

  function startReading(text, btn, style, voice, onDone) {
    var ctx;
    try { ctx = getAudioCtx(); }
    catch (e) {
      console.error('Throttle: audio unavailable:', e && e.message);
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
      btn: btn, watchdog: null, onDone: (typeof onDone === 'function' ? onDone : null)
    };
    voicePlayer = player;

    player.watchdog = setTimeout(function () {
      if (player.cancelled || player.started) return;
      console.error('Throttle: no audio after ' + START_TIMEOUT + 'ms — offering retry.');
      failStart(player);
    }, START_TIMEOUT);

    function finish() {
      if (player.cancelled) return;
      if (player.producerDone && player.scheduled === player.total && player.sources.length === 0) {
        clearWatchdog(player);
        if (player.btn) { player.btn.textContent = player.started ? READ_ALOUD : READ_RETRY; player.btn.disabled = false; }
        if (voicePlayer === player) voicePlayer = null;
        // Natural completion only (a Stop sets cancelled=true and returns above).
        if (player.started && player.onDone) { try { player.onDone(); } catch (e) {} }
      }
    }
    function scheduleBuf(buf, rest, rate) {
      if (player.cancelled) return;
      var useRate = rate || RATE_FAST;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      try { src.playbackRate.value = useRate; } catch (e) {}
      src.connect(ctx.destination);
      var at = Math.max(player.nextStart, ctx.currentTime + 0.05);
      src.start(at);
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
                console.error('Throttle chunk ' + idx + ' failed:', err && err.message);
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

  function speakReading(text, btn, figureName, onDone) {
    try {
      var active = voicePlayer;
      if (active) {
        var sameBtn = (active.btn === btn);
        stopReading();
        if (sameBtn) return;
      }
      if (btn) { btn.textContent = '\u2026 generating'; btn.disabled = true; }
      resolveVoice(figureName).then(function (v) {
        if (btn && btn.disabled === false) return;
        startReading(text, btn, v.style, v.voice, onDone);
      }, function () {
        startReading(text, btn, composeStyle(null), VOICE_NAME_DEFAULT, onDone);
      });
    } catch (e) {
      console.error('Throttle start failed:', e && e.message);
      if (btn) { btn.textContent = READ_RETRY; btn.disabled = false; }
    }
  }

  /* ---- attach: make any existing button a Read-aloud toggle ---------------- */
  // opts.text   : string OR function returning the text/markdown to read
  // opts.figure : display name (string OR function) for embodiment; optional
  // opts.label  : initial button label (default "🔊 Read aloud")
  function attach(btn, opts) {
    if (!btn) { console.warn('Throttle.attach: no button given'); return; }
    opts = opts || {};
    if (opts.label != null) btn.textContent = opts.label;
    else if (!btn.textContent) btn.textContent = READ_ALOUD;
    function val(x) { return (typeof x === 'function') ? x() : x; }
    btn.addEventListener('click', function () {
      var text = val(opts.text);
      var figure = val(opts.figure);
      speakReading(text || '', btn, figure || '');
    });
    return btn;
  }

  Amenti.throttle = {
    __v: 1,
    attach: attach,
    speak: speakReading,
    stop: stopReading,
    isReading: function () { return !!voicePlayer; },
    chunk: function (t) { return chunkText(plainText(t), CHUNK_MAX); },
    plainText: plainText,
    resolveVoice: resolveVoice,
    CHUNK_MAX: CHUNK_MAX
  };
})();
