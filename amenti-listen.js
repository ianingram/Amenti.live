/* ============================================================================
   amenti-listen.js  ·  Ingram Manor LLC
   AMENTI.LIVE — the voice-IN engine (speech-to-text), mirror of the throttle.
   ----------------------------------------------------------------------------
   The throttle carries the figure's voice OUT; this carries the seeker's voice
   IN. It captures microphone audio as PCM, encodes WAV (16 kHz mono — a format
   Gemini accepts directly), POSTs it to the Worker /listen endpoint, and hands
   back the transcript. One mic at a time (one conversation), so this is a
   singleton: window.Amenti.listen.

   PUBLIC API (window.Amenti.listen)
     start({ onText, onState, button })   begin recording
     stop()                               end recording -> transcribe -> onText
     toggle({ onText, onState, button })  start if idle, else stop
     cancel()                             abort without transcribing
     isRecording()                        true while the mic is open

   CALLBACKS
     onText(text)     fires once with the transcript (or '' if empty/failed)
     onState(state)   'recording' | 'transcribing' | 'idle' | 'error'

   CONTRACT (matches the Worker /listen endpoint)
     POST <LISTEN_URL>  Content-Type: audio/wav   body: raw WAV bytes
     200 { text }  |  4xx/5xx { error }
   ============================================================================ */
(function () {
  'use strict';
  window.Amenti = window.Amenti || {};
  if (window.Amenti.listen) return;   // singleton

  // Worker base: same host as the throttle's /speak, with /listen. Override via
  // Amenti.listen.LISTEN_URL = '...' before first use if your host differs.
  var DEFAULT_LISTEN =
    (window.Amenti.throttle && window.Amenti.throttle.VOICE_WORKER)
      ? String(window.Amenti.throttle.VOICE_WORKER).replace(/\/speak$/, '/listen')
      : 'https://amenti-proxy.ingram-ian.workers.dev/listen';

  var TARGET_RATE = 16000;   // mono 16 kHz — small, speech-grade
  var MIN_SECONDS = 0.25;    // ignore sub-quarter-second blips

  /* ── VOICE ACTIVITY ────────────────────────────────────────────────────
     The frames were always here. `onaudioprocess` has been handing us live
     PCM every 4096 samples since the day this file was written — we merely
     stacked them in a bucket and looked at none of them.

     Reading their ENERGY costs nothing and buys two things the conversation
     could not have without it:

       ONSET   — the seeker has started speaking. If the figure is talking,
                 CUT IT OFF. A figure that cannot be interrupted is not in a
                 conversation, it is delivering a lecture.
       OFFSET  — the seeker has stopped. Send, without them having to tap a
                 button to tell us what the microphone already knew.

     MONITOR MODE keeps a short PRE-ROLL ring. Voice detection needs ~250ms of
     evidence, and without a pre-roll those 250ms — the seeker's first syllable
     — would be thrown away. We keep them.

     ⚠ ECHO: while the figure speaks, the mic hears the FIGURE. getUserMedia
     already requests echoCancellation, which handles headphones and mostly
     handles speakers. "Mostly" is how a figure interrupts itself, so the
     onset threshold in monitor mode is deliberately higher than a whisper.
     ──────────────────────────────────────────────────────────────────── */
  var VAD_RMS       = 0.020;  // energy floor that counts as speech
  var VAD_RMS_ECHO  = 0.045;  // higher bar while the figure is audible
  var VAD_ONSET     = 3;      // consecutive loud frames (~250ms) → they ARE speaking
  var VAD_SILENCE   = 1200;   // ms of quiet after speech → they have finished
  var PREROLL       = 5;      // frames of ring buffer (~450ms) kept before onset

  /* ── THE MIC MUST CLOSE ITSELF ─────────────────────────────────────────
     A forgotten tab listens forever. Hands-free plus auto-stop is a loop with
     no natural end: a background tab, a mic indicator nobody notices, and the
     daily budget quietly draining into an empty room.

     A MICROPHONE THAT NEVER CLOSES ITSELF IS A BUG WEARING A FEATURE'S COAT.

     Two hard stops, and neither is negotiable:
       IDLE    — nothing was said for this long. Nobody is there. Close.
       SESSION — one continuous recording cannot run past this, ever, for any
                 reason. Not a policy. A ceiling.
     ─────────────────────────────────────────────────────────────────────── */
  var IDLE_MS    = 45000;     // 45s of nothing → nobody is there
  var SESSION_MS = 5 * 60000; // 5 minutes → one turn is not five minutes

  /* ── THE CHANNEL ───────────────────────────────────────────────────────
     We already compute RMS every frame for the VAD. The NOISE FLOOR is just
     that same number when nobody is speaking — and speech-over-noise is SNR.
     It costs nothing. It was always there.

     Which means we can know the transcript will be MUSH *before* we pay for it.
     Today the system uploads the WAV, pays /listen, receives mush, feeds the
     mush to Claude, pays for a completion, produces a confused reply — and THEN
     blames the seeker for it. One bad room costs three calls and a bad turn.

     Hearing the room first costs zero.
     ─────────────────────────────────────────────────────────────────────── */
  var SNR_CLEAN = 3.0;     // speech peak : noise floor. Below this, the ear fails.
  var NOISE_LOUD = 0.018;  // a room that is simply loud, speech or not

  function rmsOf(f) {
    var s = 0;
    for (var i = 0; i < f.length; i++) s += f[i] * f[i];
    return Math.sqrt(s / f.length);
  }

  var L = {
    __v: '2026.07-vad',        // VAD · barge monitor · partials · the channel ·
                               // the session guard
    LISTEN_URL: DEFAULT_LISTEN,
    recording: false,
    _ctx: null, _stream: null, _node: null, _src: null,
    _chunks: null, _cb: null, _onState: null, _btn: null, _cancelled: false,
    _monitor: false, _echoy: false, _onVoice: null, _autoStop: false,
    _ring: null, _loud: 0, _lastVoice: 0,
    _rec: null,            // the browser recogniser — live partials, free, Chrome/Edge
    _sawVoice: false,      // did ANYTHING in the room make a sound this turn?
    _openedAt: 0,          // when this ear opened. It does not stay open forever.

    /* ── THE SESSION GUARD ─────────────────────────────────────────────────
       This is a SINGLETON, and /listen is slow. Nothing stopped a PREVIOUS
       turn's response from landing AFTER the next mic session had already
       opened — and then clobbering its callbacks. Symptom in the wild: the
       seeker speaks, and nothing happens at all, once, unreproducibly.

       Every start() takes a ticket. A response that comes back holding an old
       ticket is a ghost: it is dropped, and it touches nothing.
       ───────────────────────────────────────────────────────────────────── */
    _seq: 0,
    /* THE FLOOR is the QUIETEST thing we hear this turn — not "frames below the
       speech threshold". That definition was blind to the exact case it was
       built for: a television is LOUDER than the speech threshold, so the floor
       never rose, and a blaring room reported itself as pristine.

       The floor is the room's own voice, whatever volume it happens to be. */
    _floor: 1,             // min RMS this turn
    _peak: 0,              // max RMS this turn

    isRecording: function () { return this.recording; },
    isMonitoring: function () { return this.recording && this._monitor; },

    toggle: function (opts) { if (this.recording) this.stop(); else this.start(opts); },

    /* ── PARTIALS — the stream that makes the Arrest possible ──────────────
       The WAV path above is BATCH: nothing leaves the browser until stop().
       By the time /listen answers, the seeker has finished their paragraph and
       moved on, and an arrest that lands there is not an arrest — it is a
       delayed reaction.

       The browser's own recogniser streams INTERIM results, live, mid-sentence,
       for free. amenti-readaloud.js has been using exactly this for the Mint's
       coverage check. Same stream, different purpose: there it measures whether
       you read the passage; here it lets the figure hear you THINK.

       It runs ALONGSIDE the WAV capture — Gemini still produces the real,
       accurate transcript for the turn. This is a fast, sloppy, free ear whose
       only job is to notice something worth interrupting.

       Chrome/Edge only. Where it is absent, the Arrest simply does not exist —
       the conversation degrades to the batch path and nothing breaks.
       ────────────────────────────────────────────────────────────────────── */
    hasPartials: function () {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    _startPartials: function (onPartial) {
      var self = this;
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR || !onPartial) return;
      try { self._rec = new SR(); } catch (e) { self._rec = null; return; }
      self._rec.lang = 'en-US';
      self._rec.continuous = true;
      self._rec.interimResults = true;      // ← the whole point
      self._rec.onresult = function (ev) {
        var txt = '';
        for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + ' ';
        try { onPartial(txt.trim()); } catch (e) {}
      };
      // A recogniser error must never take the turn down with it — the WAV path
      // is the source of truth. Fail quiet, lose only the arrest.
      self._rec.onerror = function () {};
      self._rec.onend   = function () {};
      try { self._rec.start(); } catch (e) { self._rec = null; }
    },

    _stopPartials: function () {
      if (!this._rec) return;
      try { this._rec.onresult = this._rec.onerror = this._rec.onend = null; this._rec.stop(); } catch (e) {}
      this._rec = null;
    },

    start: function (opts) {
      var self = this;
      if (this.recording) return;
      opts = opts || {};
      this._cb = (typeof opts.onText === 'function') ? opts.onText : null;
      this._onState = (typeof opts.onState === 'function') ? opts.onState : null;
      this._btn = opts.button || null;
      this._cancelled = false;

      // VAD wiring. monitor:true  → listen but discard until the seeker SPEAKS
      //             onVoice       → fires once, at onset (the barge-in trigger)
      //             autoStop:true → end the turn on silence, no button needed
      this._monitor  = !!opts.monitor;
      this._echoy    = !!opts.echoRisk;      // the figure is audible right now
      this._onVoice  = (typeof opts.onVoice === 'function') ? opts.onVoice : null;
      this._autoStop = !!opts.autoStop;
      this._ring = [];
      this._loud = 0;
      this._lastVoice = 0;
      this._onPartial = (typeof opts.onPartial === 'function') ? opts.onPartial : null;
      this._onRoom = (typeof opts.onRoom === 'function') ? opts.onRoom : null;
      this._sawVoice = false;
      this._peak = 0;
      this._floor = 1;
      this._openedAt = Date.now();
      var myTurn = ++this._seq;
      this._myTurn = myTurn;
      if (this._onPartial) this._startPartials(this._onPartial);

      navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      }).then(function (stream) {
        if (self._cancelled) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        self._stream = stream;
        var AC = window.AudioContext || window.webkitAudioContext;
        self._ctx = new AC();
        self._src = self._ctx.createMediaStreamSource(stream);
        self._node = self._ctx.createScriptProcessor(4096, 1, 1);
        self._chunks = [];
        self._node.onaudioprocess = function (ev) {
          var frame = new Float32Array(ev.inputBuffer.getChannelData(0));
          var r = rmsOf(frame);
          var loud = r >= (self._echoy ? VAD_RMS_ECHO : VAD_RMS);

          // The room's own voice is the quietest thing in it.
          if (r < self._floor) self._floor = r;
          if (r > self._peak)  self._peak  = r;

          var openFor = Date.now() - self._openedAt;

          /* HARD CEILING. Nothing runs past this. Not a monitor waiting for a
             voice that never comes, not a turn, not anything. */
          if (openFor > SESSION_MS) {
            self._emit('timeout');
            self.cancel();
            return;
          }

          /* IDLE — AND IT APPLIES TO BOTH DOORS.

             This check first lived only inside the monitor branch, which guarded
             barge-in and NOTHING ELSE. Push-to-talk opens the mic in RECORDING
             mode, and autoStop can only fire once a first voice has been heard —
             so a mic that is opened and never spoken into never closed itself at
             all. Tap the button, walk away: five minutes of open microphone.

             THE FORGOTTEN TAB WAS THROUGH THE OTHER DOOR. */
          if (openFor > IDLE_MS && !self._sawVoice) {
            self._emit('timeout');
            self.cancel();
            return;
          }

          if (self._monitor) {
            // Not yet their turn — hold a pre-roll and watch for onset.
            self._ring.push(frame);
            if (self._ring.length > PREROLL) self._ring.shift();
            self._loud = loud ? self._loud + 1 : 0;
            if (self._loud >= VAD_ONSET) {
              self._monitor = false;
              self._chunks = self._ring.slice();   // keep the first syllable
              self._ring = [];
              self._lastVoice = Date.now();
              if (self._onVoice) { try { self._onVoice(); } catch (e) {} }
            }
            return;
          }

          self._chunks.push(frame);
          if (loud) { self._lastVoice = Date.now(); self._sawVoice = true; }
          // A single turn cannot be five minutes long. Close it.
          if (openFor > SESSION_MS) { self._autoStop = false; self.stop(); return; }
          // Endpointing: they have stopped. Close the turn ourselves.
          if (self._autoStop && self._lastVoice && (Date.now() - self._lastVoice) > VAD_SILENCE) {
            self._autoStop = false;                // fire once
            self.stop();
          }
        };
        self._src.connect(self._node);
        self._node.connect(self._ctx.destination);
        self.recording = true;
        self._emit(self._monitor ? 'monitoring' : 'recording');
      }).catch(function (e) {
        console.error('[listen] mic denied:', e && e.message);
        self._emit('error');
      });
    },

    /* The figure has stopped speaking (or been cut off) — the echo risk is over,
       so drop the threshold back to a normal speaking voice. */
    setEchoRisk: function (risky) { this._echoy = !!risky; },

    /* How is the ear doing? Free — we already have every number this needs. */
    channel: function () {
      var noise = (this._floor < 1) ? Math.max(this._floor, 0.0002) : 0.0005;
      var snr = this._peak > 0 ? (this._peak / noise) : 0;
      return {
        noise: noise,
        peak: this._peak,
        snr: snr,
        loudRoom: noise >= NOISE_LOUD,
        /* "clean" means: we can trust what comes back.

           A LOW SNR ALONE IS NOT ENOUGH TO CONDEMN THE CHANNEL. A shout in a
           silent room, captured with no gap around it, has floor == peak and
           an SNR of 1 — and there is nothing whatever wrong with it. Judging on
           SNR alone would have told a delighted user in a quiet room to turn
           their television down.

           The room must ACTUALLY BE LOUD before we blame it. */
        clean: this._peak === 0 || !(noise >= NOISE_LOUD && snr < SNR_CLEAN)
      };
    },

    cancel: function () {
      this._seq++;                          // orphan anything already in flight
      this._cancelled = true;
      this._teardown();
      this.recording = false;
      this._chunks = null;
      this._emit('idle');
    },

    stop: function () {
      var self = this;
      if (!this.recording) return;
      var myTurn = this._seq;              // the ticket this transcription belongs to
      this.recording = false;
      var rate = this._ctx ? this._ctx.sampleRate : 44100;
      this._teardown();
      var pcm = this._merge(this._chunks, rate, TARGET_RATE);
      this._chunks = null;
      if (!pcm || pcm.length < TARGET_RATE * MIN_SECONDS) { this._emit('idle'); this._fire(''); return; }
      var wav = this._wav(pcm, TARGET_RATE);
      this._emit('transcribing');
      fetch(this.LISTEN_URL, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav })
        .then(function (r) { if (!r.ok) throw new Error('listen ' + r.status); return r.json(); })
        .then(function (data) {
          if (myTurn !== self._seq) return;          // a ghost from a previous turn. Drop it.
          var text = (data && data.text ? String(data.text) : '').trim();
          self._emit('idle');

          /* ── THE ROOM ────────────────────────────────────────────────────
             Something was LOUD, and the transcriber found no words in it.

             That is not a failure. That is a DOG. Or a door, or a chair, or a
             child. The stream was always carrying the room and we were reading
             one field of it — and worse, the old code fed this straight into
             _isTurn(), which called it "a blip", incremented a breakdown
             counter, and after three of them DISCONNECTED THE HUMAN for the
             crime of having a life happening around them.

             "Most systems discard this as noise. Ours actively does."

             Acknowledge what announces itself. Never investigate what does not.
             ─────────────────────────────────────────────────────────────── */
          // A wordless sound in a CLEAN room announced itself: that is a dog, a
          // door, a child. A wordless sound in a DIRTY room is just the room —
          // and "is that a dog?" is the wrong answer to a broken microphone.
          if (!text && self._sawVoice && self._onRoom && self.channel().clean) {
            try { self._onRoom({ kind: 'sound' }); } catch (e) {}
            self._cb = null;                // it was not a turn; do not judge them for it
            return;
          }
          self._fire(text);
        })
        .catch(function (e) {
          if (myTurn !== self._seq) return;          // ghost
          console.error('[listen] transcribe failed:', e && e.message);
          self._emit('error'); self._fire('');
        });
    },

    _teardown: function () {
      this._stopPartials();
      try { this._node && this._node.disconnect(); } catch (e) {}
      try { this._src && this._src.disconnect(); } catch (e) {}
      try { this._stream && this._stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      try { this._ctx && this._ctx.close(); } catch (e) {}
      this._node = this._src = this._stream = this._ctx = null;
    },

    _emit: function (state) { if (this._onState) { try { this._onState(state); } catch (e) {} } },
    _fire: function (text) { var cb = this._cb; this._cb = null; if (cb) { try { cb(text); } catch (e) {} } },

    _merge: function (chunks, inRate, outRate) {
      if (!chunks || !chunks.length) return null;
      var total = 0, i;
      for (i = 0; i < chunks.length; i++) total += chunks[i].length;
      var merged = new Float32Array(total), off = 0;
      for (i = 0; i < chunks.length; i++) { merged.set(chunks[i], off); off += chunks[i].length; }
      if (inRate === outRate) return merged;
      var ratio = inRate / outRate, outLen = Math.floor(merged.length / ratio), out = new Float32Array(outLen);
      for (i = 0; i < outLen; i++) {
        var idx = i * ratio, i0 = Math.floor(idx), i1 = Math.min(i0 + 1, merged.length - 1), f = idx - i0;
        out[i] = merged[i0] * (1 - f) + merged[i1] * f;
      }
      return out;
    },

    _wav: function (samples, rate) {
      var n = samples.length, buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
      function ws(o, s) { for (var i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); }
      ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
      ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
      ws(36, 'data'); dv.setUint32(40, n * 2, true);
      var off = 44;
      for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, samples[i])); dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2; }
      return new Blob([buf], { type: 'audio/wav' });
    }
  };

  window.Amenti.listen = L;
})();
