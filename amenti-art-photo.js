/* ===========================================================================
   amenti-art-photo.js — PHOTOGRAPHIC CARD FACES
   ---------------------------------------------------------------------------
   ONE JOB. Put img/{key}-card.jpg into the .rc-img of any card whose figure
   has one, and get out of the way for the ones that do not.

   WHERE THIS SITS relative to amenti-art-3.js
     art-3 fetches SVG renderings from the mint worker and injects them into
     .rc-img, .nc-thumb and .mkt-thumb, matched on data-char-key. This file
     does the same job for RASTER art held in the repo. A card decorated here
     is marked data-art3="done" so art-3 leaves it alone — photograph wins
     where a photograph exists, worker SVG covers the rest.

   NO MAP. Art resolves by convention from the library key:
        img/{key}-card.jpg
     The key comes from data-char-key, which amenti-roster.js fills from the
     resolver's characters row — the same key space library/*.json uses. A
     second hand-maintained list is the thing that drifts.

   WHY BACKGROUND AND NOT <img>
     .rc-img is 160px tall and roughly 198 wide; the plates are 9:16 portrait.
     background-size: cover with the position biased upward keeps the head in
     frame and crops the sides, which is what a card wants. An <img> would need
     its own object-fit rules and would fight the .rc-img-grid overlay already
     in the markup.

   TIMING
     The roster is built by other scripts after load and the page routes by
     hash, so a single pass at DOMContentLoaded decorates nothing. This watches
     for mutation and hashchange, and is idempotent — a card is decorated at
     most once.
   =========================================================================== */
(function () {
  'use strict';

  var BASE = (window.AMENTI_ART && window.AMENTI_ART.photoBase) || 'img/';
  var known = {};   /* key -> true | false, so each file is probed once */
  var done  = 0;

  function norm(k) {
    return String(k || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  }

  function decorate(el, key) {
    var host = el.querySelector('.rc-img, .nc-thumb, .mkt-thumb');
    if (!host) return;
    var src = BASE + key + '-card.jpg';
    host.style.backgroundImage    = 'url("' + src + '")';
    host.style.backgroundSize     = 'cover';
    host.style.backgroundPosition = '50% 18%';
    host.setAttribute('data-fig', key);          /* grades.css hooks this */
    el.setAttribute('data-art3', 'done');        /* art-3 skips it */
    el.setAttribute('data-art-photo', 'done');
    done++;
  }

  function tryKey(el, key) {
    if (known[key] === false) return;
    if (known[key] === true) { decorate(el, key); return; }
    var probe = new Image();
    probe.onload  = function () { known[key] = true;  decorate(el, key); };
    probe.onerror = function () { known[key] = false; };
    probe.src = BASE + key + '-card.jpg';
  }

  /* ---- ROSTER / NEWS / MARKETPLACE — cards carry data-char-key ---------- */
  function passCards() {
    document.querySelectorAll('[data-char-key]:not([data-art-photo])')
      .forEach(function (el) {
        var key = norm(el.getAttribute('data-char-key'));
        if (key) tryKey(el, key);
      });
  }

  /* ---- CODEX DETAIL ------------------------------------------------------
     .cdx-art is 560px tall and is the largest single display of a figure
     anywhere in the product. It is rebuilt by renderDetail() every time the
     selection changes and carries NO key of its own — the key lives on
     AMENTI_CHARS[active]. So it is resolved from the active list row, which
     does carry data-id, falling back to slugging the displayed name.

     The codex gets the TERMINAL plate, not the card. It has the room for one,
     and a 560px container wants an absorbed figure with air around it rather
     than a card face cropped to a portrait window. Falls back to the card if
     no terminal plate exists. */
  function codexKey() {
    var row = document.querySelector('.cdx-row.active');
    if (row && window.AMENTI_CHARS) {
      var rec = window.AMENTI_CHARS[+row.getAttribute('data-id')];
      if (rec && rec.key) return norm(rec.key);
    }
    var nm = document.querySelector('.cdx-name');
    return nm ? norm(nm.textContent).replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-').replace(/^-|-$/g, '') : '';
  }

  function paintCodex(key, surface) {
    var art = document.querySelector('.cdx-art');
    if (!art) return;
    var src = BASE + key + '-' + surface + '.jpg';
    var probe = new Image();
    probe.onload = function () {
      art.style.backgroundImage = 'url("' + src + '"), ' +
        'radial-gradient(ellipse at 50% 70%,rgba(212,160,23,0.12),transparent 70%)';
      art.style.backgroundSize = 'cover';
      art.style.backgroundPosition = '50% 22%';
      art.setAttribute('data-fig', key);
      art.setAttribute('data-art-photo', surface);
      /* the hand-built SVG portrait would sit on top of the photograph */
      var svg = art.querySelector('svg'); if (svg) svg.style.display = 'none';
    };
    probe.onerror = function () {
      if (surface === 'terminal') paintCodex(key, 'card');
    };
    probe.src = src;
  }

  function passCodex() {
    var art = document.querySelector('.cdx-art');
    if (!art) return;
    var key = codexKey();
    if (!key || art.getAttribute('data-fig') === key) return;
    art.removeAttribute('data-art-photo');
    paintCodex(key, 'terminal');
  }

  /* ---- TERMINAL ---------------------------------------------------------
     The centre chat panel is the largest canvas in the product, so the terminal
     plate goes behind the whole stream. The terminal tracks its selection with
     .term-char.active in the left roster; that row has no key attribute, so
     the figure is resolved from its displayed name and matched against the
     plates we hold. grades.css carries the per-plate opacity. */
  function passTerminal() {
    var main = document.querySelector('.term-main');
    if (!main) return;
    // Resolve from data-id against AMENTI_CHARS, exactly as the codex does.
    // The previous version slugged the DISPLAYED NAME, which fails wherever the
    // name and the key differ: "MIYAMOTO MUSASHI" slugs to miyamoto-musashi but
    // the key is musashi; "MOHANDAS GANDHI" slugs to mohandas-gandhi but the key
    // is gandhi. The probe 404s and the surface stays empty, silently.
    var row = document.querySelector('.term-char.active');
    var key = '';
    if (row && window.AMENTI_CHARS) {
      var rec = window.AMENTI_CHARS[+row.getAttribute('data-id')];
      if (rec && rec.key) key = norm(rec.key);
    }
    if (!key) { main.removeAttribute('data-fig'); return; }
    if (main.getAttribute('data-fig') === key) return;
    var src = BASE + key + '-terminal.jpg';
    var probe = new Image();
    probe.onload  = function () { main.setAttribute('data-fig', key); };
    probe.onerror = function () { main.removeAttribute('data-fig'); };
    probe.src = src;
  }

  function pass() { passCards(); passCodex(); passTerminal(); }

  new MutationObserver(pass).observe(document.documentElement,
    { childList: true, subtree: true });
  window.addEventListener('hashchange', pass);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', pass);
  else pass();

  window.AmentiArtPhoto = { pass: pass, count: function () { return done; },
                            known: known };
})();
