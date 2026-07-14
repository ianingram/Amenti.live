/* ============================================================================
   amenti-canonical.js  ·  Ingram Manor LLC
   THE CALIBRATION PASSAGE — the only instrument that can see the cache key.
   ----------------------------------------------------------------------------
   The Worker lives in Cloudflare. It is not in this repository. No scanner can
   read its source, and the audio cache key

       audioKey = sha256(TTS_MODEL + voice + STYLE + TEXT)

   therefore cannot be verified by looking. It can only be verified by SPEAKING
   A KNOWN THING AND ASKING WHETHER THE ENGINE REMEMBERS IT.

   That is what this file is. One fixed passage. Fired at /speak through both
   live chunk profiles. Six measures, six keys, six wires:

       recital  320  ->  4 measures   the reading room, Page1, the archive
       gabriel  700  ->  2 measures   Page2, as deployed

   The two profiles are a DELIBERATE FORK. They do not share a cache. Unifying
   them re-renders Page2's archive and re-bills it. See fleet-semantics.

   THE MISS PATTERN IS THE DIAGNOSIS
       all six miss ......... TTS_MODEL or VOICE_REGISTER moved
       only the four 320s ... the recital chunker moved
       only the two 700s .... Page2's profile moved
       a single measure ..... splitSentences or plainText moved

   COST
       First fire: six renders, once, ever. ~$0.05.
       Every fire after that, by anyone, forever: six cache hits. Zero.
       That property is not luck. It is the entire reason the text is frozen.

   ────────────────────────────────────────────────────────────────────────────
   DO NOT EDIT THE PASSAGE. NOT ONE BYTE.
   Not a space. Not a quote. Not a better word. Not a cleaner line.
   Editing it re-renders six clips, re-bills them, and BLINDS the only
   instrument in the fleet that can see the cache key — while it goes on
   reporting green. A lie with a light on it.
   Its sha256 is committed to fleet-semantics. A commit that moves the text and
   not the hash does not merge.
   ────────────────────────────────────────────────────────────────────────────
   ============================================================================ */
(function (root) {
  'use strict';

  /* ---- THE PASSAGE (FROZEN) ---- */
  var TEXT =
    'The fleet keeps one archive, and the archive keeps one voice. Every measure ' +
    'rendered here is rendered once \u2014 never twice, never again \u2014 and the key that ' +
    'finds it is the key that made it: the model, the voice, the style, and the text ' +
    'itself, hashed together and set down in the dark. Move one byte of any of them ' +
    'and the archive forgets what it said; the clips remain, orphaned, and no invoice ' +
    'ever mentions the loss. So this passage does not change. Not for a better word, ' +
    'not for a cleaner line \u2014 not ever.\n\n' +
    'Why speak it at all? Because a claim that nothing tests is not a claim; it is a ' +
    'wish with a light on it. This is the heartbeat: fired at the engine every six ' +
    'hours, asking one question \u2014 do you still know your own voice? If the answer ' +
    'comes back a hit, the wards hold. If it comes back a miss, something moved, and ' +
    'the fleet will say so before the bill does. Probe first; never guess. Verify, or ' +
    'the silence will lie to you.';

  /* The lock. 933 chars. 4 em-dashes. 2 paragraphs. Verified against the real
     chunker: 4 measures at 320, 2 at 700. */
  var TEXT_SHA256 = '27e9c5afcdc4dffc66d84de233913407c1241a677767f342e95d58cd6c0ef897';
  var TEXT_CHARS  = 933;

  /* The wires. Each profile is a separate cache namespace. */
  var WIRES = ['recital', 'gabriel'];

  /* Where the engine posts. Read from the engine if present; this is only the
     fallback, and it must stay byte-identical to amenti-voice.js. */
  var VOICE_WORKER = 'https://amenti-proxy.ingram-ian.workers.dev/speak';

  /* A hit is served from R2 and is fast. A miss renders with Gemini and is not.
     The Header Ghost: X-Amenti-Cache may be set and still be unreadable by JS
     unless the Worker exposes it via Access-Control-Expose-Headers. Headers lie
     to JS; behaviour does not. So we read the header if we can and fall back to
     latency if we cannot — and we always report WHICH signal we used. */
  var HIT_MS = 1500;

  function api() { return (root.Amenti && root.Amenti.voice) || null; }

  /* The measures, cut by the REAL engine. Never re-implemented here — a second
     copy of the chunker is exactly how the archive forks. */
  function measures(profile) {
    var v = api();
    if (!v || typeof v.chunk !== 'function') return null;
    return v.chunk(TEXT, profile);
  }

  /* ---- THE WARD: fetch only. No audio. No AudioContext. ---- */
  function calibrate(onLine) {
    var v = api();
    if (!v) return Promise.reject(new Error('engine absent: Amenti.voice not loaded'));

    var report = { passage: TEXT_SHA256, chars: TEXT.length, wires: [], renders: 0, hits: 0, signal: null };
    var jobs = [];

    WIRES.forEach(function (profile) {
      var ms = measures(profile);
      if (!ms) return;
      ms.forEach(function (text, i) {
        jobs.push({ profile: profile, max: v.PROFILES[profile], i: i + 1, n: ms.length, text: text });
      });
    });

    return v.resolveVoice('').then(function (res) {
      var voice = (res && res.voice) || 'Kore';
      var style = (res && res.style) || '';

      return jobs.reduce(function (chain, job) {
        return chain.then(function () {
          var t0 = (root.performance && performance.now) ? performance.now() : Date.now();
          return fetch(VOICE_WORKER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: job.text, style: style, voice: voice })
          }).then(function (r) {
            var t1 = (root.performance && performance.now) ? performance.now() : Date.now();
            var ms = Math.round(t1 - t0);
            var hdr = null;
            try { hdr = r.headers.get('x-amenti-cache'); } catch (e) { hdr = null; }
            var signal = hdr ? 'header' : 'latency';
            var hit = hdr ? (hdr.toLowerCase() === 'hit') : (ms < HIT_MS);
            report.signal = report.signal || signal;
            if (hit) report.hits++; else report.renders++;
            var line = {
              profile: job.profile, max: job.max, m: job.i + '/' + job.n,
              chars: job.text.length, ms: ms, hit: hit, via: signal, ok: r.ok, status: r.status
            };
            report.wires.push(line);
            if (typeof onLine === 'function') { try { onLine(line); } catch (e) {} }
            return r.arrayBuffer().then(function () {}, function () {});
          });
        });
      }, Promise.resolve()).then(function () {
        report.intact = (report.wires.length > 0) && report.wires.every(function (w) { return w.ok && w.hit; });
        report.total = report.wires.length;
        return report;
      });
    });
  }

  /* ---- THE EAR: play it, and let the captain time it. The machine cannot
     hear. He can. First sound is stamped by a human, on real hardware, through
     real speakers — which is the only place that number has ever been true. ---- */
  function say(profile, opts) {
    var v = api();
    if (!v) return null;
    opts = opts || {};
    v.speak(TEXT, {
      figure: '',
      register: 'recital',
      profile: profile || 'recital',
      btn: opts.btn || null,
      onDone: opts.onDone || null
    });
    return true;
  }

  var API = {
    __v: 1,
    TEXT: TEXT,
    SHA256: TEXT_SHA256,
    CHARS: TEXT_CHARS,
    WIRES: WIRES,
    VOICE_WORKER: VOICE_WORKER,
    measures: measures,
    calibrate: calibrate,
    say: say,
    stop: function () { var v = api(); if (v) v.stop(); }
  };

  if (root.Amenti) { root.Amenti.canonical = root.Amenti.canonical || API; }
  else if (typeof window !== 'undefined') { (window.Amenti = window.Amenti || {}).canonical = API; }

  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }

  /* ==========================================================================
     THE PANEL — debug only. A real visitor sees nothing, ever.
     Same law as Ramiel and Cassiel: diagnose, never gatekeep, never block boot.
     ========================================================================== */
  if (typeof document === 'undefined') return;

  function isDebug() {
    var s = (location.search || '') + (location.hash || '');
    return /[?#&]debug\b/.test(s);
  }

  function mount() {
    if (!isDebug() || document.getElementById('amCal')) return;

    var box = document.createElement('div');
    box.id = 'amCal';
    box.setAttribute('style',
      'position:fixed;right:12px;bottom:12px;z-index:99999;width:340px;' +
      'font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;' +
      'background:#06080f;color:#9fe1cb;border:1px solid #1d9e75;border-radius:6px;padding:10px;');

    var head = document.createElement('div');
    head.setAttribute('style', 'color:#5dcaa5;letter-spacing:.08em;margin-bottom:8px;');
    head.textContent = 'CALIBRATION \u00b7 ' + TEXT_SHA256.slice(0, 8);
    box.appendChild(head);

    var log = document.createElement('pre');
    log.setAttribute('style', 'margin:8px 0 0;white-space:pre-wrap;color:#9fe1cb;max-height:240px;overflow:auto;');
    log.textContent = 'idle.';

    function line(s) { log.textContent += '\n' + s; }

    var bWard = document.createElement('button');
    bWard.textContent = 'CALIBRATE';
    bWard.setAttribute('style', 'margin-right:6px;background:#0f6e56;color:#e1f5ee;border:0;border-radius:4px;padding:5px 9px;cursor:pointer;font:inherit;');
    bWard.onclick = function () {
      bWard.disabled = true;
      log.textContent = 'firing six wires \u2014 fetch only, no audio \u2026';
      calibrate(function (w) {
        line('  ' + w.profile.padEnd(8) + String(w.max).padStart(3) + '  m' + w.m +
             '  ' + String(w.chars).padStart(3) + 'ch  ' + (w.hit ? 'HIT ' : 'MISS') +
             '  ' + String(w.ms).padStart(6) + 'ms  via:' + w.via);
      }).then(function (r) {
        line('');
        line(r.intact
          ? 'ARCHIVE INTACT \u00b7 ' + r.hits + '/' + r.total + ' \u00b7 ' + r.renders + ' renders'
          : 'DRIFT \u00b7 ' + r.hits + '/' + r.total + ' hit \u00b7 ' + r.renders + ' RENDERED');
        if (r.signal === 'latency') line('note: header unreadable (CORS) \u2014 judged on latency.');
        line('report: Amenti.canonical.calibrate() for the object.');
        console.log('[calibration]', r);
        bWard.disabled = false;
      }, function (e) {
        line('FAILED \u00b7 ' + (e && e.message));
        bWard.disabled = false;
      });
    };

    var bSay = document.createElement('button');
    bSay.textContent = 'SPEAK';
    bSay.setAttribute('style', 'margin-right:6px;background:#185fa5;color:#e6f1fb;border:0;border-radius:4px;padding:5px 9px;cursor:pointer;font:inherit;');

    var bHeard = document.createElement('button');
    bHeard.textContent = 'FIRST SOUND';
    bHeard.disabled = true;
    bHeard.setBaseTime = 0;
    bHeard.setAttribute('style', 'background:#854f0b;color:#faeeda;border:0;border-radius:4px;padding:5px 9px;cursor:pointer;font:inherit;');

    var t0 = 0;
    bSay.onclick = function () {
      var v = api();
      if (!v) { line('engine absent.'); return; }
      log.textContent = 'speaking \u00b7 recital 320 \u00b7 press FIRST SOUND when you hear it.';
      t0 = Date.now();
      bHeard.disabled = false;
      say('recital', { btn: null, onDone: function () { line('  playback ended.'); bHeard.disabled = true; } });
    };
    bHeard.onclick = function () {
      if (!t0) return;
      line('  FIRST SOUND \u00b7 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's  (captain\u2019s ear)');
      bHeard.disabled = true;
    };

    box.appendChild(bWard);
    box.appendChild(bSay);
    box.appendChild(bHeard);
    box.appendChild(log);
    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

})(typeof window !== 'undefined' ? window : globalThis);
