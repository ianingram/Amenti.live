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

  var L = {
    LISTEN_URL: DEFAULT_LISTEN,
    recording: false,
    _ctx: null, _stream: null, _node: null, _src: null,
    _chunks: null, _cb: null, _onState: null, _btn: null, _cancelled: false,

    isRecording: function () { return this.recording; },

    toggle: function (opts) { if (this.recording) this.stop(); else this.start(opts); },

    start: function (opts) {
      var self = this;
      if (this.recording) return;
      opts = opts || {};
      this._cb = (typeof opts.onText === 'function') ? opts.onText : null;
      this._onState = (typeof opts.onState === 'function') ? opts.onState : null;
      this._btn = opts.button || null;
      this._cancelled = false;
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
          self._chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
        };
        self._src.connect(self._node);
        self._node.connect(self._ctx.destination);
        self.recording = true;
        self._emit('recording');
      }).catch(function (e) {
        console.error('[listen] mic denied:', e && e.message);
        self._emit('error');
      });
    },

    cancel: function () {
      this._cancelled = true;
      this._teardown();
      this.recording = false;
      this._chunks = null;
      this._emit('idle');
    },

    stop: function () {
      var self = this;
      if (!this.recording) return;
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
          var text = (data && data.text ? String(data.text) : '').trim();
          self._emit('idle'); self._fire(text);
        })
        .catch(function (e) {
          console.error('[listen] transcribe failed:', e && e.message);
          self._emit('error'); self._fire('');
        });
    },

    _teardown: function () {
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
