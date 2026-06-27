/* ============================================================================
   amenti-raphael.js  ·  Ingram Manor LLC
   AMENTI.LIVE — Raphael, the guardian. Health watch for every surface.
   ----------------------------------------------------------------------------
   In the tradition Raphael is the healer; here he watches over the system's
   wellness. Include this file on EVERY page (splash, Terminal, reading vault,
   game room, dispatches). On each page load he runs a SILENT, network-free,
   surface-appropriate presence-and-wiring check.

   TWO AUDIENCES, NEVER CROSSED:
     • A real visitor sees NOTHING. No banner, no dot, no console spam, no network
       call. Failures are logged to console only (harmless, invisible unless looked
       for).
     • A developer adds ?debug (or #debug) to the URL and gets a small corner
       HEALTH DOT — green (whole) / amber (warnings) / red (a check failed) — that
       is clickable to dump details and run the full, loud diagnostic kit on demand.

   The always-on check is cheap and safe. The expensive deep scan (AmentiChatTest)
   and any real network calls happen ONLY when the developer clicks / calls
   Raphael.diagnose(). The watchman walks the rounds quietly and raises a lantern
   only when you walk them with him.

   API (window.Amenti.raphael, also Sovereign.Angels.Raphael where present)
     watch()      run the silent check now; (re)render the dot if in debug mode
     check()      -> [{name, ok, severity:'error'|'warn', detail}]  (no UI, no net)
     status()     -> 'ok' | 'warn' | 'error'
     diagnose()   run the loud deep scan (AmentiChatTest) on demand
     debug()      true if ?debug/#debug is present
   ============================================================================ */
(function () {
  'use strict';
  window.Amenti = window.Amenti || {};
  if (window.Amenti.raphael) return;

  var COLORS = { ok: '#1c7c3a', warn: '#d9a93a', error: '#a01818' };

  function $(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }
  function present(path) {
    var parts = path.split('.'), o = window;
    for (var i = 0; i < parts.length; i++) { if (o == null) return false; o = o[parts[i]]; }
    return o != null;
  }

  var R = {
    _checks: [],

    debug: function () {
      var s = (location.search || '') + ' ' + (location.hash || '');
      return /[?#&]debug\b/.test(s) || /\bdebug\b/.test(location.hash || '');
    },

    /* Which surfaces are present on THIS page? Feature detection, not filenames. */
    _surfaces: function () {
      return {
        terminal:   !!(present('AmentiTerminal') || ($('#stream') && $('#input'))),
        sovChat:    !!(present('Sovereign.Angels.Gabriel') || $('#chat-input')),
        readAloud:  !!$('[class*="readaloud"], .amlib-readaloud, .dispatch-readaloud, .cns-card-readaloud, .atlantica-readaloud'),
        mic:        !!$('#term-mic-toggle, #mic-toggle'),
        anyVoice:   !!(present('Amenti.throttle') || present('AMENTI_VOICE') || present('Sovereign.Voice'))
      };
    },

    /* The silent check. Pure inspection — no UI, no network. Returns results. */
    check: function () {
      var s = this._surfaces();
      var out = [];
      function add(name, ok, severity, detail) { out.push({ name: name, ok: !!ok, severity: severity, detail: detail || '' }); }

      // Shared modules — present is INFO; absent is an ERROR only when a surface
      // on THIS page actually depends on it. Absent-and-not-needed is fine (info),
      // so a splash that loads none of them still reads healthy.
      var hasThrottle = present('Amenti.throttle');
      var hasListen   = present('Amenti.listen');
      var hasChat     = present('Amenti.chat');

      if (hasThrottle)       add('module: Amenti.throttle (voice out)', true, 'info', '');
      else if (s.readAloud)  add('module: Amenti.throttle (voice out)', false, 'error', 'read-aloud present but throttle missing — audio will not play');
      else                   add('module: Amenti.throttle (voice out)', true, 'info', 'not loaded here (not needed)');

      if (hasChat)           add('module: Amenti.chat (conversation core)', true, 'info', '');
      else if (s.terminal)   add('module: Amenti.chat (conversation core)', false, 'error', 'chat surface present but chat core missing');
      else                   add('module: Amenti.chat (conversation core)', true, 'info', 'not loaded here (not needed)');

      if (hasListen)         add('module: Amenti.listen (voice in)', true, 'info', '');
      else if (s.mic)        add('module: Amenti.listen (voice in)', false, 'error', 'mic button present but listen module missing — mic is dead');
      else                   add('module: Amenti.listen (voice in)', true, 'info', 'not loaded here (not needed)');

      // Surface wiring.
      if (s.terminal) {
        var mounted = present('AmentiTerminal.chat');
        add('Terminal mounted the chat core', mounted, 'warn',
            mounted ? '' : 'AmentiTerminal.chat is null — running the keyboard fallback path, not the core');
        add('Terminal has a voice (AMENTI_VOICE)', present('AMENTI_VOICE'), 'warn',
            present('AMENTI_VOICE') ? '' : 'no AMENTI_VOICE — replies will be text-only');
      }
      if (s.sovChat) {
        add('Page2 chat wired (Gabriel.transmit)', present('Sovereign.Angels.Gabriel.transmit'), 'error',
            present('Sovereign.Angels.Gabriel.transmit') ? '' : 'chat input present but transmit() missing');
        add('Page2 voice-in (Amenti.listen or Sovereign.Listen)', hasListen || present('Sovereign.Listen'), 'warn', '');
      }

      // Worker URL — only relevant where there's a voice surface. Not pinged (that
      // would cost); just confirm the endpoint looks configured.
      if (s.anyVoice || s.readAloud || s.mic) {
        var worker = (present('Amenti.throttle') && window.Amenti.throttle.VOICE_WORKER) ||
                     (present('Amenti.listen') && window.Amenti.listen.LISTEN_URL) || '';
        add('Worker URL configured', /^https?:\/\/.+/.test(String(worker)), 'warn',
            worker ? String(worker) : 'no worker URL visible from throttle/listen');
      }

      this._checks = out;
      return out;
    },

    status: function () {
      var c = this._checks.length ? this._checks : this.check();
      var err = false, warn = false;
      for (var i = 0; i < c.length; i++) { if (!c[i].ok && c[i].severity !== 'info') { if (c[i].severity === 'error') err = true; else warn = true; } }
      return err ? 'error' : (warn ? 'warn' : 'ok');
    },

    /* Silent run. Logs to console ONLY on a real failure, and never anything a
       user would notice. Renders the dot only in debug mode. */
    watch: function () {
      this.check();
      var st = this.status();
      // Quiet console note on genuine errors, even for non-debug — but errors only,
      // and only console (invisible to anyone not looking).
      if (st === 'error') {
        try {
          var fails = this._checks.filter(function (c) { return !c.ok && c.severity === 'error'; });
          console.warn('[Raphael] system check found ' + fails.length + ' issue(s):',
            fails.map(function (f) { return f.name + ' — ' + f.detail; }));
        } catch (e) {}
      }
      if (this.debug()) this._renderDot();
      return st;
    },

    /* The deep scan: loud, thorough, on demand only. Hands off to AmentiChatTest
       if it's loaded; otherwise dumps Raphael's own check table. */
    diagnose: function () {
      console.log('%c Raphael · deep scan ', 'background:#d9a93a;color:#000;font-weight:700;padding:2px 6px');
      this.check();
      try { console.table(this._checks.map(function (c) { return { check: c.name, ok: c.ok, severity: c.severity, detail: c.detail }; })); } catch (e) { console.log(this._checks); }
      if (window.AmentiChatTest && typeof window.AmentiChatTest.check === 'function') {
        console.log('%c → running AmentiChatTest.check() ', 'color:#888');
        try { window.AmentiChatTest.check(); } catch (e) { console.warn('AmentiChatTest failed:', e); }
      } else {
        console.log('%c (AmentiChatTest not loaded on this page — skipping deep chat scan) ', 'color:#888');
      }
      return this._checks;
    },

    /* ---- the developer-visible signal (debug mode only) -------------------- */
    _renderDot: function () {
      var self = this;
      var st = this.status();
      var dot = document.getElementById('raphael-dot');
      if (!dot) {
        dot = document.createElement('div');
        dot.id = 'raphael-dot';
        dot.style.cssText = 'position:fixed;bottom:14px;right:14px;width:12px;height:12px;border-radius:50%;' +
          'z-index:2147483646;cursor:pointer;box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 10px 1px currentColor;' +
          'transition:background .2s;opacity:.9;';
        dot.title = 'Raphael — system health (click for details)';
        dot.addEventListener('click', function () { self._togglePanel(); });
        (document.body || document.documentElement).appendChild(dot);
      }
      dot.style.background = COLORS[st];
      dot.style.color = COLORS[st];
      dot.title = 'Raphael — ' + st.toUpperCase() + ' (click for details)';
    },

    _togglePanel: function () {
      var self = this;
      var p = document.getElementById('raphael-panel');
      if (p) { p.parentNode.removeChild(p); return; }
      this.check();
      p = document.createElement('div');
      p.id = 'raphael-panel';
      p.style.cssText = 'position:fixed;bottom:34px;right:14px;z-index:2147483646;max-width:360px;' +
        'background:#0d0f18;color:#cdd6e0;border:1px solid #26323f;border-radius:8px;padding:12px 14px;' +
        'font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 8px 30px rgba(0,0,0,.5);';
      var rows = this._checks.map(function (c) {
        var col = c.ok ? COLORS.ok : COLORS[c.severity];
        var mark = c.ok ? '✓' : (c.severity === 'error' ? '✕' : '!');
        return '<div style="display:flex;gap:8px;padding:2px 0;">' +
          '<span style="color:' + col + ';font-weight:700;">' + mark + '</span>' +
          '<span>' + c.name + (c.detail ? ' <span style="color:#7c8896;">— ' + c.detail + '</span>' : '') + '</span></div>';
      }).join('');
      p.innerHTML = '<div style="color:#d9a93a;font-weight:700;letter-spacing:.04em;margin-bottom:8px;">RAPHAEL · ' +
        this.status().toUpperCase() + '</div>' + rows +
        '<button id="raphael-deep" style="margin-top:10px;background:#1b2531;color:#cdd6e0;border:1px solid #26323f;' +
        'border-radius:5px;padding:6px 10px;cursor:pointer;font:inherit;">Run deep scan (console)</button>';
      (document.body || document.documentElement).appendChild(p);
      var btn = document.getElementById('raphael-deep');
      if (btn) btn.addEventListener('click', function () { self.diagnose(); });
    }
  };

  window.Amenti.raphael = R;
  // Fit into the angel host where it exists (Page2's Sovereign world).
  try { if (window.Sovereign && Sovereign.Angels) Sovereign.Angels.Raphael = R; } catch (e) {}

  // Auto-run on load. A short delay lets the page's own surfaces/modules finish
  // initialising before Raphael takes attendance.
  function go() { setTimeout(function () { try { R.watch(); } catch (e) {} }, 350); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
