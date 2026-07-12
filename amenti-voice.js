/* ============================================================================
   amenti-voice.js  ·  Ingram Manor LLC
   THE VOICE PLATFORM — one TTS engine, one chunker, one cache key.
   ----------------------------------------------------------------------------
   WHAT THIS REPLACES, AND WHY IT HAD TO

   Four copies of one engine were running, all POSTing the same { text, style,
   voice } to the same /speak:

     library.js (~494)       reading room        chunk 320   own VOICE_WORKER
     amenti-throttle.js      Page1 buttons       chunk 320   the "mother ship"
     AMENTI_VOICE (Page1)    THE COUNSEL         no chunking, NO stop()
     Page2.html (~16893)     Gabriel             chunk 700/1100

   The Worker keys every clip:

       audioKey = sha256(TTS_MODEL + voice + STYLE + TEXT)

   TEXT is in the key. So the chunk boundaries ARE the cache key — and a 320-char
   chunk and a 700-char chunk of the same essay hash differently. The reading
   room and Page2 share NOTHING. The archive is being rendered more than once
   and no invoice ever says so.

   STYLE is in the key too. Which is why composeStyle / VOICE_REGISTER /
   PACE_DIRECTION / chunkText / plainText below are copied BYTE-FOR-BYTE from the
   deployed reading room. Not improved. Not tidied. Not reformatted. A prettier
   string re-renders the whole archive and re-bills it.

   TWO REGISTERS, AND THEY MUST NOT MIX
     RECITAL        composeStyle(). The archive. CACHED. Never varies. Locked.
     CONVERSATIONAL The counsel. Unique text every turn, so it never hits the
                    cache anyway — which is exactly why the per-move instrument
                    panel (warm/cool/sharp/grave/danger/humour) is FREE here and
                    FORBIDDEN on the recital path.

   MIGRATION IS OPT-IN, PER SURFACE, BECAUSE IT HAS A BILL ATTACHED
   Changing a surface's chunk size orphans that surface's cached audio. So the
   chunker is a PROFILE, and each surface keeps its own until you decide to
   re-render on purpose. Consolidating the CODE is free; consolidating the CACHE
   KEY is not, and the two are separable. Do the free one now.

   FACADES: Amenti.throttle.* and window.AMENTI_VOICE.* keep working, unchanged,
   over this core. Nothing is renamed until every caller has been grepped.
   ============================================================================ */
(function () {
  'use strict';
  var Amenti = (window.Amenti = window.Amenti || {});
  if (Amenti.voice && Amenti.voice.__v) return;   // include-once guard

  /* ---- config / constants (LOCKED — identical to deployed reading room) ---- */
  var VOICE_WORKER       = 'https://amenti-proxy.ingram-ian.workers.dev/speak';
  var VOICE_REGISTER     = 'Read clearly, in a measured, dignified tone';
  var VOICE_NAME_DEFAULT = 'Kore';
  var CHUNK_MAX       = 320;   // LOCKED — the reading room + Page1. Do not change.

  /* Chunk PROFILES. Each surface's boundaries are part of its cache key, so a
     surface keeps its own profile until it is deliberately re-rendered.
       recital : 320   — the reading room, Page1, and the existing archive
       gabriel : 700   — Page2's engine, as deployed
     Unify these ONLY when you are willing to pay to regenerate the audio. */
  var PROFILES = { recital: 320, gabriel: 700, counsel: 320 };
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
  /* ── THE CONVERSATIONAL REGISTER ─────────────────────────────────────────
     The Terminal talks WITH you; it does not recite AT you. Separate register,
     separate cache space, and — because its text is unique every turn — a place
     where prosody may vary per utterance at no cost.

     THE INSTRUMENT PANEL. Tone is not decoration; a shift in temperature is a
     PROBE. Bound to the figure and not the utterance, every register collapses
     into one voice and the probe returns nothing.
     ──────────────────────────────────────────────────────────────────────── */
  var CONV_REGISTER = 'Say the following in a clear, natural, conversational voice';

  /* THE REGISTERS LIVE IN amenti-doctrine.js. ONE COPY.
     They were duplicated here AND in Page1's AMENTI_VOICE — byte-identical, kept
     in step BY HAND, with nothing enforcing it. That is composeStyle again, and
     it is the exact disease probe7 exists to prevent. The fallback below is for
     a surface that has not loaded the doctrine; it is not a second source. */
  function REG() {
    var d = window.Amenti && window.Amenti.doctrine;
    return (d && d.REGISTERS) || {
      warm:   'Speak gently, unhurried, with evident care.',
      cool:   'Speak with clinical distance, level and unhurried.',
      sharp:  'Speak with sudden edge — clipped, direct, harder than before.',
      grave:  'Speak slowly and heavily, as one who has paid for what he says.',
      danger: 'Speak quietly, and let the quiet be worse than shouting.',
      humour: 'Let there be dry amusement in the voice, and something rueful under it.'
    };
  }

  /* The conversational style. NEVER call this for the archive. */
  function composeConversational(fig, move) {
    var s = CONV_REGISTER;
    if (fig && fig.dialect) s += '. Accent and dialect: ' + String(fig.dialect).trim();
    if (fig && fig.voice)   s += '. Voice character: ' + String(fig.voice).trim();
    s += '. ' + PACE_DIRECTION;
    var reg = move && REG()[move];
    if (reg) s += ' ' + reg;
    return s;
  }

  /* ⚠ LOCKED — byte-for-byte from the deployed reading room. This string is
     part of the /speak cache key. Changing it orphans the entire archive. */
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

  function startReading(text, btn, style, voice, onDone, max) {
    max = max || CHUNK_MAX;      // the surface's chunk PROFILE — part of its cache key
    var ctx;
    try { ctx = getAudioCtx(); }
    catch (e) {
      console.error('Throttle: audio unavailable:', e && e.message);
      if (btn) { btn.textContent = READ_RETRY; btn.disabled = false; }
      return;
    }
    var chunks = chunkText(plainText(text), max);
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

  /* speakReading() is retired — Amenti.throttle.speak is now a facade over speak(). */

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
      speak(text || '', { btn: btn, figure: figure || '', register: 'recital' });
    });
    return btn;
  }

  /* ── THE ONE ENTRY POINT ─────────────────────────────────────────────────
     speak(text, opts)
       opts.figure    display name — resolves dialect/voice from the roster
       opts.register  'recital' (archive, cached, locked) | 'conversational'
       opts.move      warm|cool|sharp|grave|danger|humour — conversational ONLY
       opts.profile   'recital' | 'gabriel' | 'counsel' — the chunker
       opts.btn       optional button to drive (Read aloud / Stop / Retry)
       opts.onDone    natural end of speech
     ──────────────────────────────────────────────────────────────────────── */
  function speak(text, opts) {
    opts = opts || {};
    var conversational = (opts.register === 'conversational');
    var max = PROFILES[opts.profile] || (conversational ? PROFILES.counsel : CHUNK_MAX);
    var btn = opts.btn || null;

    try {
      var active = voicePlayer;
      if (active) {
        var sameBtn = (active.btn === btn);
        stopReading();
        if (sameBtn && btn) return;          // a second tap on the same button = Stop
      }
      if (btn) { btn.textContent = '\u2026 generating'; btn.disabled = true; }

      resolveVoice(opts.figure).then(function (v) {
        if (btn && btn.disabled === false) return;
        var style = conversational
          ? composeConversational(v && v.figure, opts.move)     // varies freely — never cached
          : (v && v.style);                                     // LOCKED — the archive
        startReading(text, btn, style, (v && v.voice) || VOICE_NAME_DEFAULT, opts.onDone, max);
      }, function () {
        var style = conversational ? composeConversational(null, opts.move) : composeStyle(null);
        startReading(text, btn, style, VOICE_NAME_DEFAULT, opts.onDone, max);
      });
    } catch (e) {
      console.error('Voice start failed:', e && e.message);
      if (btn) { btn.textContent = READ_RETRY; btn.disabled = false; }
      if (typeof opts.onDone === 'function') { try { opts.onDone(); } catch (e2) {} }
    }
  }

  Amenti.voice = {
    __v: 1,
    speak: speak,
    stop: stopReading,
    isSpeaking: function () { return !!voicePlayer; },
    attach: attach,
    chunk: function (t, profile) { return chunkText(plainText(t), PROFILES[profile] || CHUNK_MAX); },
    plainText: plainText,
    resolveVoice: resolveVoice,
    REGISTERS: REG(),
    PROFILES: PROFILES,
    CHUNK_MAX: CHUNK_MAX
  };

  /* ── FACADES ─────────────────────────────────────────────────────────────
     Amenti.throttle has EIGHT call sites in Page1 alone, and library.js and
     Page2 have engines of their own that will be retired one at a time. Nothing
     is renamed until every caller has been grepped — that assumption is exactly
     what burned the last session. These are the old doors, opening onto the new
     room. Identical behaviour, byte-identical cache keys.
     ──────────────────────────────────────────────────────────────────────── */
  Amenti.throttle = {
    __v: 1,
    attach: attach,
    speak: function (text, btn, figureName, onDone) {
      return speak(text, { btn: btn, figure: figureName, onDone: onDone, register: 'recital' });
    },
    stop: stopReading,
    isReading: function () { return !!voicePlayer; },
    chunk: function (t) { return chunkText(plainText(t), CHUNK_MAX); },
    plainText: plainText,
    resolveVoice: resolveVoice,
    CHUNK_MAX: CHUNK_MAX
  };

  /* The counsel's speaker. Was an inline half-copy in Page1 with no chunking and
     — critically — NO stop(), which is why the figure could not be interrupted.
     Now it is the real engine: chunked, streaming, and cancellable. */
  Amenti.conversation = {
    on: false,
    speak: function (text, figureName, onDone, meta) {
      if (!this.on) { if (typeof onDone === 'function') onDone(); return; }
      speak(text, {
        figure: figureName,
        register: 'conversational',
        move: meta && meta.register,          // the DECLARED move's register
        profile: 'counsel',
        onDone: onDone
      });
    },
    stop: stopReading,
    isSpeaking: function () { return !!voicePlayer; },
    styleFor: composeConversational
  };
})();
