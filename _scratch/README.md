[amenti-chat-diagnostic.js](https://github.com/user-attachments/files/29399931/amenti-chat-diagnostic.js)

/* ============================================================================
 * amenti-chat-diagnostic.js  —  the conversation core + voice-in + state machine
 * ----------------------------------------------------------------------------
 * Paste into the console on amenti.live (a page that loads amenti-chat.js and
 * amenti-listen.js — e.g. the Terminal on Page1). It checks, without spending a
 * single brain call by default, that:
 *   • the shared modules are loaded (Amenti.chat / Amenti.listen)
 *   • the Terminal mounted the core (AmentiTerminal.chat exists)
 *   • the turn-taking STATE MACHINE runs idle→thinking→speaking→idle
 *   • NO-BARGE-IN holds (a turn sent while speaking is dropped)
 *   • the GATE accepts answers-while-expecting and rejects blips
 *   • the NOISE track escalates and disconnects after 3 breakdowns
 *   • the persona prompt carries the doctrine (drift / lead / distress / name riff)
 *   • the Worker /listen endpoint answers (only when you ask it to)
 *
 * The state tests run on a THROWAWAY chat instance with a fake brain/voice, so
 * they touch nothing real and cost nothing. The live checks (mount, prompt) read
 * the actual page. /listen is only hit by AmentiChatTest.listen().
 *
 * USE:
 *   AmentiChatTest.check()      // everything safe & free (recommended first run)
 *   AmentiChatTest.machine()    // just the state-machine + barge-in + gate tests
 *   AmentiChatTest.prompt()     // dump + verify the live persona/doctrine prompt
 *   AmentiChatTest.mount()      // is the Terminal wired to the core?
 *   AmentiChatTest.listen()     // POST a tiny silent WAV to /listen (1 real call)
 * ==========================================================================*/
(function () {
  'use strict';

  function ok(label, pass)  { console.log((pass ? '%c PASS ' : '%c FAIL '),
    'background:' + (pass ? '#1c7c3a' : '#a01818') + ';color:#fff;font-weight:700', label); return !!pass; }
  function info(label, val) { console.log('%c INFO ', 'background:#33414f;color:#fff', label, val); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var FIG = { name: 'Nikola Tesla', key: 'tesla', era: 'Gilded Age', bio: 'Inventor of alternating current.', abilities: ['electricity', 'invention'] };

  // A throwaway instance with a fake brain + fake voice that "ends" after a beat,
  // so the machine can be exercised without real network or audio.
  function makeProbe(opts) {
    opts = opts || {};
    var spoke = { text: null, ended: false };
    var states = [];
    var inst = window.Amenti.chat.create({
      figure: FIG, mode: 'character',
      render: { user: function () {}, sys: function () {}, bot: function () { var b = { t: '' }; return { el: {}, setText: function (x) { b.t = x; }, setHTML: function (x) { b.t = x; } }; } },
      speak: function (text, onDone) { spoke.text = text; setTimeout(function () { spoke.ended = true; onDone && onDone(); }, opts.speakMs || 10); },
      onState: function (s) { states.push(s); },
      onNotice: function (t) { (inst.__notices = inst.__notices || []).push(t); },
      onDisconnect: function () { inst.__disconnected = true; }
    });
    inst.__spoke = spoke; inst.__states = states;
    return inst;
  }

  var T = {
    loaded: function () {
      var a = !!(window.Amenti && window.Amenti.chat && typeof window.Amenti.chat.create === 'function');
      var b = !!(window.Amenti && window.Amenti.listen && typeof window.Amenti.listen.start === 'function');
      ok('Amenti.chat loaded', a);
      ok('Amenti.listen loaded', b);
      return a && b;
    },

    mount: function () {
      var c = window.AmentiTerminal && window.AmentiTerminal.chat;
      var has = !!(c && typeof c.send === 'function');
      ok('Terminal mounted the chat core (AmentiTerminal.chat)', has);
      if (has) info('current state', c.state);
      return has;
    },

    prompt: function () {
      if (!T.loaded()) return false;
      var sys = window.Amenti.chat._defaultBuildSystem(FIG, 'character', '', '');
      var checks = [
        ['drift welcome (go WITH them)', /go WITH them/],
        ['lead toward depth', /toward depth as an invitation/],
        ['distress → real human support', /real human support/],
        ['icebreaker is an offering', /offering OF YOURSELF/],
        ['name: do not ask up front', /do NOT ask up front/],
        ['name riff (Peter the Great)', /Peter the Great/],
        ['hold name afterward', /HOLD it afterward/],
        ['never expand identity', /no surname, no age, no location/]
      ];
      var all = true;
      checks.forEach(function (c) { all = ok('prompt · ' + c[0], c[1].test(sys)) && all; });
      info('prompt length (chars)', sys.length);
      return all;
    },

    machine: async function () {
      if (!T.loaded()) return false;
      var pass = true;

      // 1) idle -> thinking -> speaking -> idle, with a question reply setting expectation
      var p = makeProbe();
      window.__realComplete = window.claude && window.claude.complete;
      var fakeComplete = function () { return Promise.resolve('I have seen the aether shimmer. Have you felt it?'); };
      // temporarily borrow a fake brain on the probe path: the core calls window.claude.complete
      var prev = window.claude; window.claude = { complete: fakeComplete };
      p.send('Tell me about light.');
      await sleep(80);
      pass = ok('state sequence idle→thinking→speaking→idle', p.__states.join('>') === 'thinking>speaking>idle') && pass;
      pass = ok('spoke the reply', p.__spoke.text && /aether/.test(p.__spoke.text)) && pass;
      pass = ok('expectation set (reply ended in “?”)', p._expecting === true) && pass;

      // 2) no-barge-in: a send while speaking is ignored
      var q = makeProbe({ speakMs: 120 });
      window.claude = { complete: function () { return Promise.resolve('first'); } };
      var speaks = 0; q._speak = q._speak; // (kept via closure in makeProbe)
      q.send('one');
      await sleep(30);                       // now in 'speaking'
      var before = q.history.length;
      q.send('two-while-speaking');          // should be dropped
      await sleep(20);
      pass = ok('no-barge-in (turn dropped while speaking)', q.history.length === before) && pass;
      await sleep(140);

      // 3) gate: short answer counts while expecting; blip rejected otherwise
      var g = makeProbe();
      g._expecting = true;
      pass = ok('gate: “no” is a turn while expecting', g._isTurn('no') === true) && pass;
      g._expecting = false;
      pass = ok('gate: single blip rejected when not expecting', g._isTurn('a') === false) && pass;
      pass = ok('gate: real sentence accepted', g._isTurn('what did you mean by that') === true) && pass;

      window.claude = prev;
      return pass;
    },

    noise: async function () {
      if (!T.loaded()) return false;
      // Fake the mic to always return noise, and watch the escalation→disconnect.
      var realListen = window.Amenti.listen;
      window.Amenti.listen = { isRecording: function () { return false; },
        start: function (o) { setTimeout(function () { o.onText(''); }, 3); }, stop: function () {}, cancel: function () {} };
      var p = makeProbe();
      var prev = window.claude; window.claude = { complete: function () { return Promise.resolve('ok'); } };
      function arm(cb) { p.armMic(); setTimeout(cb, 18); }
      await new Promise(function (res) { arm(function () { arm(function () { arm(res); }); }); });
      var pass = true;
      pass = ok('noise track gave 3 escalating notices', (p.__notices || []).length === 3) && pass;
      pass = ok('disconnected after 3rd breakdown', p.__disconnected === true) && pass;
      info('notices', p.__notices);
      window.Amenti.listen = realListen; window.claude = prev;
      return pass;
    },

    listen: async function () {
      // One real call: post a 0.4s silent WAV to /listen; expect JSON {text:...}.
      var url = (window.Amenti && window.Amenti.listen && window.Amenti.listen.LISTEN_URL) || 'https://amenti-proxy.ingram-ian.workers.dev/listen';
      info('POST', url);
      var rate = 16000, n = Math.floor(rate * 0.4), buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
      function ws(o, s) { for (var i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); }
      ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
      ws(36, 'data'); dv.setUint32(40, n * 2, true);
      try {
        var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: new Blob([buf], { type: 'audio/wav' }) });
        var okStatus = r.ok; info('HTTP', r.status);
        var data = await r.json().catch(function () { return null; });
        info('response', data);
        return ok('/listen answered with JSON', okStatus && data && typeof data.text !== 'undefined');
      } catch (e) {
        return ok('/listen reachable', false), console.warn(e), false;
      }
    },

    check: async function () {
      console.log('%c AMENTI · chat/listen/state diagnostic ', 'background:#d9a93a;color:#000;font-weight:700;padding:2px 6px');
      var a = T.loaded();
      var b = T.mount();
      var c = T.prompt();
      var d = await T.machine();
      var e = await T.noise();
      console.log('%c — — — — — ', 'color:#888');
      ok('ALL SAFE CHECKS PASSED', a && c && d && e);
      info('note', 'mount may be FALSE if you ran this off a page without the Terminal. Run AmentiChatTest.listen() to test the Worker (1 real call).');
    }
  };

  window.AmentiChatTest = T;
  console.log('%c AmentiChatTest ready ', 'background:#1c7c3a;color:#fff;font-weight:700',
    '— run AmentiChatTest.check()  (safe & free).  .listen() makes 1 real /listen call.');
})();
