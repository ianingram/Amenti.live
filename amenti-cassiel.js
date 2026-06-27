/* ============================================================================
   amenti-cassiel.js  ·  Ingram Manor LLC
   AMENTI.LIVE — CASSIEL :: the Terminal-integrity warden (Page1)
   ----------------------------------------------------------------------------
   Sibling to Ramiel (who guards Page2's manifold). Cassiel is the watchful
   guardian of the GLYPH TERMINAL — the surface where the figures are summoned
   and speak. He runs once at boot, walks the live DOM + JS namespace, and
   verifies the invariants the Terminal and the conversation system depend on.

   Built in Ramiel's image — same philosophy, same severity model — but Page1
   has none of Page2's scaffolding (no Sovereign, no Sovereign.Log, no Overwatch
   terminal). So Cassiel reports through a tiny self-contained log + an optional
   ?debug corner dot, and checks PAGE-1's contract: the chat core, the voice
   engines, AMENTI_CHARS, and the Terminal's own getElementById targets.

   SEVERITY MODEL (identical to Ramiel)
     OK   - counted, silent except the one-line summary
     WARN - amber; the page still works, but something is degraded
     FAIL - red; a real breakage, but Cassiel NEVER blocks boot, NEVER auto-fixes,
            NEVER throws (a bug in the warden must not break the page)

   DIAGNOSE, DON'T GATEKEEP.

   AUDIENCES
     • A real visitor sees nothing (FAILs go to console only).
     • A developer adds ?debug / #debug → a corner health dot (green/amber/red),
       clickable for the full report; and Cassiel.run()/.report() in the console.

   PUBLIC API (window.Amenti.cassiel, aliased Sovereign.Angels.Cassiel if present)
     run()         execute all enabled checks; idempotent; returns lastReport
     lastReport    { ok, warn:[], fail:[] } from the most recent run
     CHECKS        developer-toggleable category flags
     status()      'OK' | 'WARN' | 'FAIL'
     report()      console.table the findings + run the deep AmentiChatTest if present
   ============================================================================ */
(function () {
  'use strict';
  window.Amenti = window.Amenti || {};
  if (window.Amenti.cassiel) return;

  var TAG = 'CAS';
  var COLORS = { OK: '#1c7c3a', WARN: '#d9a93a', FAIL: '#a01818' };

  // Tiny self-contained log — Page1 has no Sovereign.Log. Quiet by default;
  // mirrors Ramiel's [RAM] tagging with [CAS].
  function emit(severity, msg) {
    if (severity === 'FAIL') console.warn('%c[' + TAG + '] ' + severity + ' :: ' + msg, 'color:' + COLORS.FAIL);
    else if (window.__cassielVerbose) console.log('[' + TAG + '] ' + severity + ' :: ' + msg);
  }

  function debugMode() {
    var s = (location.search || '') + ' ' + (location.hash || '');
    return /[?#&]debug\b/.test(s) || /\bdebug\b/.test(location.hash || '');
  }

  function resolvePath(path) {
    var parts = path.split('.'), cur = window;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur[parts[i]] === 'undefined') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  var Cassiel = {
    // Run order = declaration order; cheap checks first.
    CHECKS: {
      config:   true,   // 1. AMENTI_CONFIG / proxy + ledger sanity (cheap)
      modules:  true,   // 2. shared engines present where the Terminal needs them
      terminal: true,   // 3. the Terminal mounted the chat core + has a voice
      dom:      true,   // 4. getElementById targets resolve (medium)
      roster:   true    // 5. AMENTI_CHARS present and shaped
    },

    lastReport: null,

    run: function () {
      var findings = { ok: 0, warn: [], fail: [] };
      var startedAt = (window.performance && performance.now) ? performance.now() : Date.now();
      try {
        if (this.CHECKS.config)   this._checkConfig(findings);
        if (this.CHECKS.modules)  this._checkModules(findings);
        if (this.CHECKS.terminal) this._checkTerminal(findings);
        if (this.CHECKS.dom)      this._checkDom(findings);
        if (this.CHECKS.roster)   this._checkRoster(findings);
      } catch (err) {
        emit('FAIL', 'internal error :: ' + (err && err.message));
        console.error('Cassiel internal error:', err);
      }
      var elapsed = Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - startedAt);
      this.lastReport = findings;

      for (var i = 0; i < findings.warn.length; i++) emit('WARN', findings.warn[i]);
      for (var j = 0; j < findings.fail.length; j++) emit('FAIL', findings.fail[j]);

      var status = findings.fail.length ? 'FAIL' : (findings.warn.length ? 'WARN' : 'OK');
      if (window.__cassielVerbose || status === 'FAIL') {
        console.log('%c[' + TAG + '] integrity ' + status + ' :: ' + findings.ok + ' pass, ' +
          findings.warn.length + ' warn, ' + findings.fail.length + ' fail (' + elapsed + 'ms)',
          'color:' + COLORS[status] + ';font-weight:700');
      }
      if (debugMode()) this._renderDot(status);
      return findings;
    },

    status: function () {
      var f = this.lastReport || this.run();
      return f.fail.length ? 'FAIL' : (f.warn.length ? 'WARN' : 'OK');
    },

    /* ---- 1. Config sanity --------------------------------------------------
       AMENTI_CONFIG is optional on Page1 (it falls back to ./names.csv and a
       default proxy), so absence is a WARN, not a FAIL — but a placeholder or a
       malformed URL that IS set is worth flagging. */
    _checkConfig: function (findings) {
      var cfg = window.AMENTI_CONFIG;
      if (!cfg || typeof cfg !== 'object') {
        findings.warn.push('AMENTI_CONFIG not present — using built-in fallbacks (./names.csv, default proxy)');
        return;
      }
      var proxy = cfg.AI_PROXY_URL || '';
      if (proxy && proxy.indexOf('PASTE_') === 0) findings.fail.push('AMENTI_CONFIG.AI_PROXY_URL is still a placeholder');
      else if (proxy && !/^https?:\/\//i.test(proxy)) findings.warn.push('AMENTI_CONFIG.AI_PROXY_URL doesn\'t look like a URL :: ' + proxy.slice(0, 60));
      else if (proxy) findings.ok++;

      var ledger = cfg.LEDGER_CSV_URL || '';
      if (ledger && ledger.indexOf('PASTE_') === 0) findings.fail.push('AMENTI_CONFIG.LEDGER_CSV_URL is still a placeholder');
      else if (ledger && !/^https?:\/\//i.test(ledger) && ledger.indexOf('./') !== 0) findings.warn.push('AMENTI_CONFIG.LEDGER_CSV_URL looks malformed :: ' + ledger.slice(0, 60));
      else if (ledger) findings.ok++;
    },

    /* ---- 2. Shared engines -------------------------------------------------
       Present is a pass; absent is a FAIL only when a surface on this page needs
       it (read-aloud → throttle; mic → listen; chat surface → chat core). */
    _checkModules: function (findings) {
      var hasReadAloud = !!document.querySelector('[class*="readaloud"], .amlib-readaloud, .cns-card-readaloud, .dispatch-readaloud');
      var hasMic       = !!document.getElementById('term-mic-toggle');
      var hasChatSurf  = !!(document.getElementById('stream') && document.getElementById('input'));

      this._mod(findings, 'Amenti.throttle', hasReadAloud, 'read-aloud present but throttle missing — audio will not play');
      this._mod(findings, 'Amenti.chat',     hasChatSurf,  'Terminal present but chat core missing');
      this._mod(findings, 'Amenti.listen',   hasMic,       'mic button present but listen module missing — mic is dead');
    },
    _mod: function (findings, path, needed, failMsg) {
      if (resolvePath(path)) findings.ok++;
      else if (needed) findings.fail.push(failMsg);
      // absent + not needed on this page = fine, silent.
    },

    /* ---- 3. Terminal wiring ------------------------------------------------ */
    _checkTerminal: function (findings) {
      var hasChatSurf = !!(document.getElementById('stream') && document.getElementById('input'));
      if (!hasChatSurf) return;   // not a Terminal page; nothing to assert
      if (resolvePath('AmentiTerminal')) findings.ok++;
      else findings.fail.push('AmentiTerminal global missing — Terminal script did not initialise');

      if (resolvePath('AmentiTerminal.chat')) findings.ok++;
      else findings.warn.push('AmentiTerminal.chat not mounted — Terminal is on the keyboard fallback path, not the shared chat core');

      if (resolvePath('AMENTI_VOICE')) findings.ok++;
      else findings.warn.push('AMENTI_VOICE missing — figure replies will be text-only');
    },

    /* ---- 4. DOM presence (Ramiel's signature check) ------------------------
       Read our own inline source, find every getElementById('x'), verify each x
       exists. Catches "renamed a node, missed a JS reference" bugs. Caps noise. */
    _checkDom: function (findings) {
      var scripts = document.querySelectorAll('script:not([src])');
      var source = '';
      for (var i = 0; i < scripts.length; i++) source += scripts[i].textContent + '\n';

      var ids = {}, re = /getElementById\(\s*['"]([a-zA-Z0-9_\-]+)['"]\s*\)/g, m;
      while ((m = re.exec(source)) !== null) ids[m[1]] = true;

      // Tolerate IDs that are only created at runtime (built by code after boot).
      var RUNTIME_ONLY = { 'amenti-voice-glow-css': 1, 'raphael-dot': 1, 'cassiel-dot': 1, 'raphael-panel': 1, 'cassiel-panel': 1 };

      var missing = 0;
      for (var id in ids) {
        if (RUNTIME_ONLY[id]) continue;
        if (document.getElementById(id)) { findings.ok++; }
        else {
          missing++;
          if (missing <= 5) findings.fail.push("getElementById('" + id + "') target missing from DOM");
          else { findings.warn.push('(more missing IDs may exist; first 5 reported)'); break; }
        }
      }
    },

    /* ---- 5. Roster --------------------------------------------------------- */
    _checkRoster: function (findings) {
      var chars = window.AMENTI_CHARS;
      if (!Array.isArray(chars)) { findings.fail.push('AMENTI_CHARS missing or not an array — the roster failed to load'); return; }
      if (!chars.length) { findings.fail.push('AMENTI_CHARS is empty — no figures to summon'); return; }
      findings.ok++;
      var first = chars[0] || {};
      if (typeof first.name === 'undefined' || typeof first.key === 'undefined')
        findings.warn.push('AMENTI_CHARS entries missing expected name/key fields');
      else findings.ok++;
    },

    report: function () {
      console.log('%c Cassiel · integrity report ', 'background:#33414f;color:#fff;font-weight:700;padding:2px 6px');
      var f = this.run();
      var rows = [];
      f.fail.forEach(function (x) { rows.push({ severity: 'FAIL', finding: x }); });
      f.warn.forEach(function (x) { rows.push({ severity: 'WARN', finding: x }); });
      rows.push({ severity: 'OK', finding: f.ok + ' checks passed' });
      try { console.table(rows); } catch (e) { console.log(rows); }
      if (window.AmentiChatTest && typeof window.AmentiChatTest.check === 'function') {
        console.log('%c → running AmentiChatTest deep scan ', 'color:#888');
        try { window.AmentiChatTest.check(); } catch (e) {}
      }
      return f;
    },

    /* ---- developer-visible dot (debug only) -------------------------------- */
    _renderDot: function (status) {
      var self = this;
      var dot = document.getElementById('cassiel-dot');
      if (!dot) {
        dot = document.createElement('div');
        dot.id = 'cassiel-dot';
        dot.style.cssText = 'position:fixed;bottom:14px;left:14px;width:12px;height:12px;border-radius:50%;' +
          'z-index:2147483646;cursor:pointer;box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 10px 1px currentColor;opacity:.9;';
        dot.addEventListener('click', function () { self._togglePanel(); });
        (document.body || document.documentElement).appendChild(dot);
      }
      dot.style.background = COLORS[status]; dot.style.color = COLORS[status];
      dot.title = 'Cassiel — Terminal integrity: ' + status + ' (click for report)';
    },

    _togglePanel: function () {
      var self = this;
      var p = document.getElementById('cassiel-panel');
      if (p) { p.parentNode.removeChild(p); return; }
      var f = this.lastReport || this.run();
      p = document.createElement('div');
      p.id = 'cassiel-panel';
      p.style.cssText = 'position:fixed;bottom:34px;left:14px;z-index:2147483646;max-width:380px;background:#0d0f18;' +
        'color:#cdd6e0;border:1px solid #26323f;border-radius:8px;padding:12px 14px;font:12px/1.5 ui-monospace,Menlo,monospace;box-shadow:0 8px 30px rgba(0,0,0,.5);';
      var line = function (sev, txt) {
        return '<div style="display:flex;gap:8px;padding:2px 0;"><span style="color:' + COLORS[sev] +
          ';font-weight:700;">' + (sev === 'FAIL' ? '✕' : sev === 'WARN' ? '!' : '✓') + '</span><span>' + txt + '</span></div>';
      };
      var body = f.fail.map(function (x) { return line('FAIL', x); }).join('') +
                 f.warn.map(function (x) { return line('WARN', x); }).join('') +
                 line('OK', f.ok + ' checks passed');
      p.innerHTML = '<div style="color:#d9a93a;font-weight:700;letter-spacing:.04em;margin-bottom:8px;">CASSIEL · ' +
        this.status() + '</div>' + body +
        '<button id="cassiel-deep" style="margin-top:10px;background:#1b2531;color:#cdd6e0;border:1px solid #26323f;border-radius:5px;padding:6px 10px;cursor:pointer;font:inherit;">Run deep scan (console)</button>';
      (document.body || document.documentElement).appendChild(p);
      var btn = document.getElementById('cassiel-deep');
      if (btn) btn.addEventListener('click', function () { self.report(); });
    }
  };

  window.Amenti.cassiel = Cassiel;
  // Take a seat in the angel system where it exists.
  try { if (window.Sovereign && Sovereign.Angels) Sovereign.Angels.Cassiel = Cassiel; } catch (e) {}

  // Run once at boot, after a short delay so the Terminal + modules have settled.
  function go() { setTimeout(function () { try { Cassiel.run(); } catch (e) {} }, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
