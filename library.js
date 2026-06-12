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
   ========================================================================== */
(function () {
  'use strict';
  if (window.Amenti && window.Amenti.__readingRoom) return; // include-once guard

  var Amenti = (window.Amenti = window.Amenti || {});
  Amenti.__readingRoom = true;

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
      '.amlib-badge.v{color:#5fd0a0;}.amlib-badge.x{color:#7f96d4;}.amlib-badge.r{color:#d4a24a;}',
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
      'padding:8px 13px;border-radius:7px;transition:border-color .15s;}',
      '.amlib-ask:hover{border-color:var(--gold,#d4af37);}',
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
    return '';
  }

  function renderRoom(catalog) {
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
        var action;
        if (w.mode === 'link') {
          action = '<a class="amlib-work-btn" href="' + esc(w.url || '#') + '" target="_blank" rel="noopener">Open at source \u2197</a>';
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
            '<div class="amlib-work-body" hidden></div>' +
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
        '<div class="amlib-actions">' + askAction(catalog, firstName) + '</div>';
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
