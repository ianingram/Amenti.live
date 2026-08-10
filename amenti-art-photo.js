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

   NEVER SLUG A DISPLAYED NAME INTO A KEY
     The key space is short and deliberately inconsistent with display names:
     `lincoln` not `abraham-lincoln`, `musashi` not `miyamoto-musashi`,
     `gandhi` not `mohandas-gandhi` — but `flavius-josephus` IS the full form.
     There is no derivable rule. Every key resolves from AMENTI_CHARS, and a
     failure to resolve returns '' so the caller can decline. A wrong key is
     worse than no key: it produces two 404s and paints nothing either way.
   =========================================================================== */
(function () {
  'use strict';

  var BASE = (window.AMENTI_ART && window.AMENTI_ART.photoBase) || 'img/';
  var known = {};   /* key -> true | false, so each CARD file is probed once */
  var plate = {};   /* "key-surface" -> true | false, same for codex plates   */
  var done  = 0;

  function norm(k) {
    return String(k || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  }

  /* ---- KEY RESOLUTION ----------------------------------------------------
     Single path for every surface. Takes the row that carries data-id and
     returns the figure's key, or '' if it cannot be resolved with certainty.

     AMENTI_CHARS is index-addressed because the CSV loader in Page1.html
     reindexes the merged array (`merged.forEach(function(c,i){ c.id = i; })`)
     so id and position agree. The find() is a cheap guard in case that
     invariant is ever broken by a future reorder — it costs one linear scan
     only on the path where the index has already disagreed. */
  function keyFromRow(row) {
    if (!row || !window.AMENTI_CHARS) return '';
    var id = +row.getAttribute('data-id');
    if (!isFinite(id)) return '';
    var list = window.AMENTI_CHARS;
    var rec = list[id];
    if (!rec || rec.id !== id) {
      rec = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) { rec = list[i]; break; }
      }
    }
    return (rec && rec.key) ? norm(rec.key) : '';
  }

  /* ---- THE PUPPET/RENDERING SWEEP ---------------------------------------
     THREE painters write into .rc-img and none of them know about each other:

       amenti-roster.js  fitArt()  appends <svg>, class stripped
       amenti-art-3.js   inject()  appends <svg> with an INLINE style.display
       this file         decorate() sets the background, and alone sets data-fig

     A stylesheet rule cannot suppress art-3's overlay, because art-3 writes
     display:block as an inline style and inline beats any selector. So the
     photograph-over-drawing precedence has to be enforced from script.

     Removal is terminal rather than a running battle: art-3 marks the card
     data-art3="done" as it injects and its own pass matches
     [data-figure]:not([data-art3]), so it will not come back for that card.

     Scoped to tiles carrying data-fig — i.e. tiles where a photograph
     actually loaded. A figure with no plate keeps its drawing, which is the
     whole point. This is precedence, not retirement. */
  function strip(host) {
    if (!host || !host.hasAttribute('data-fig')) return;
    var svgs = host.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) svgs[i].parentNode.removeChild(svgs[i]);
  }

  /* art-3 and paintPortraits are async and may land after decorate() has run,
     so the sweep repeats on every pass rather than only at paint time. */
  function sweep() {
    var tiles = document.querySelectorAll(
      '.rc-img[data-fig], .nc-thumb[data-fig], .mkt-thumb[data-fig]');
    for (var i = 0; i < tiles.length; i++) strip(tiles[i]);
  }

  /* ---- THUMBNAILS -------------------------------------------------------
     A card plate is 640x1120 and the card box is 198x160. Even at 2x that is
     5.7x more pixels than the surface can show, and background-position
     50% 18% throws away everything outside roughly 10-56% of the height. The
     24 plates on the arena came to 3.6 MB — ten times the weight of all the
     JavaScript on the page.

     {key}-thumb.jpg is the same picture pre-cropped to the card window at 2x:
     480x420, ~43 KB instead of ~151 KB. Same image on screen, 71% less data.

     The plate is kept as the fallback, so a figure with no thumbnail yet
     still paints exactly as before. Nothing regresses if the thumbs are only
     half generated. */
  function cardSrc(key) { return BASE + key + '-thumb.jpg'; }
  function cardFallback(key) { return BASE + key + '-card.jpg'; }

  function decorate(el, key) {
    var host = el.querySelector('.rc-img, .nc-thumb, .mkt-thumb');
    if (!host) return;
    var src = (known[key] === 'thumb') ? cardSrc(key) : cardFallback(key);
    host.style.backgroundImage    = 'url("' + src + '")';
    host.style.backgroundSize     = 'cover';
    host.style.backgroundPosition = '50% 18%';
    host.setAttribute('data-fig', key);          /* grades.css hooks this */
    strip(host);                                 /* photograph wins the tile */
    el.setAttribute('data-art3', 'done');        /* art-3 skips it hereafter */
    el.setAttribute('data-art-photo', 'done');
    done++;
  }

  /* Probe the thumbnail first, fall back to the full plate. Each key is
     probed at most once either way — the cache holds 'thumb', true (plate
     only) or false (no art), so a miss never repeats. */
  function tryKey(el, key) {
    if (known[key] === false) return;
    if (known[key]) { decorate(el, key); return; }
    var thumb = new Image();
    thumb.onload  = function () { known[key] = 'thumb'; decorate(el, key); };
    thumb.onerror = function () {
      var full = new Image();
      full.onload  = function () { known[key] = true;  decorate(el, key); };
      full.onerror = function () { known[key] = false; };
      full.src = cardFallback(key);
    };
    thumb.src = cardSrc(key);
  }

  /* ---- ROSTER / NEWS / MARKETPLACE — cards carry data-char-key ----------
     LAZY. Roughly six of the twenty-four roster cards are above the fold on
     a landing view; the rest were fetching their art immediately because
     decorate() sets background-image the moment the card exists. With the
     thumbnails that is still ~1.1 MB requested before anyone scrolls.

     Cards are now observed and decorated when they come near the viewport.
     rootMargin gives 500px of lead so the plate is already there by the time
     the card is actually looked at — the point is to stop fetching art for
     figures nobody scrolls to, not to make scrolling feel unpainted.

     No IntersectionObserver (or no observer for some reason) falls straight
     through to the old immediate path, so nothing depends on it. */
  var seen = null;
  try {
    if (window.IntersectionObserver) {
      seen = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          var el = entries[i].target;
          seen.unobserve(el);
          var key = norm(el.getAttribute('data-char-key'));
          if (key) tryKey(el, key);
        }
      }, { rootMargin: '500px 0px', threshold: 0 });
    }
  } catch (e) { seen = null; }

  function passCards() {
    document.querySelectorAll('[data-char-key]:not([data-art-photo])')
      .forEach(function (el) {
        var key = norm(el.getAttribute('data-char-key'));
        if (!key) return;
        /* Already probed and present? Paint immediately — no reason to wait
           for a scroll to reuse something the cache already holds. */
        if (known[key]) { decorate(el, key); return; }
        if (known[key] === false) return;
        if (!seen) { tryKey(el, key); return; }
        if (el.getAttribute('data-art-watch')) return;   /* observed once */
        el.setAttribute('data-art-watch', '1');
        seen.observe(el);
      });
  }

  /* ---- CODEX DETAIL ------------------------------------------------------
     .cdx-art is 560px tall and is the largest single display of a figure
     anywhere in the product. It is rebuilt by renderDetail() every time the
     selection changes and carries NO key of its own — the key lives on
     AMENTI_CHARS[active]. So it is resolved from the active list row, which
     carries data-id.

     There is NO name fallback. See the header note. The previous version
     slugged .cdx-name, so "ABRAHAM LINCOLN" became abraham-lincoln when the
     key is lincoln — probing abraham-lincoln-terminal.jpg, then falling back
     to abraham-lincoln-card.jpg, and 404ing on both. passTerminal() below was
     already fixed for exactly this and the fix was never carried across.

     The codex gets the TERMINAL plate, not the card. It has the room for one,
     and a 560px container wants an absorbed figure with air around it rather
     than a card face cropped to a portrait window. Falls back to the card if
     no terminal plate exists. */
  function codexKey() {
    return keyFromRow(document.querySelector('.cdx-row.active'));
  }

  /* Probes are cached per key+surface. Without this, every codex repaint costs
     a network round trip, and a MISS costs one on every single pass — and pass
     is driven by a subtree MutationObserver, so an active terminal stream
     retriggers it continuously. A figure with no plate would emit 404s for as
     long as the page stayed open. */
  function paintCodex(key, surface) {
    var art = document.querySelector('.cdx-art');
    if (!art) return;
    var slot = key + '-' + surface;
    if (plate[slot] === false) {
      if (surface === 'terminal') paintCodex(key, 'card');
      return;
    }
    var src = BASE + slot + '.jpg';

    function apply() {
      art.style.backgroundImage = 'url("' + src + '"), ' +
        'radial-gradient(ellipse at 50% 70%,rgba(212,160,23,0.12),transparent 70%)';
      art.style.backgroundSize = 'cover';
      art.style.backgroundPosition = '50% 22%';
      art.setAttribute('data-fig', key);
      art.setAttribute('data-art-photo', surface);
      /* the hand-built SVG portrait would sit on top of the photograph */
      var svg = art.querySelector('svg'); if (svg) svg.style.display = 'none';
    }

    if (plate[slot] === true) { apply(); return; }

    var probe = new Image();
    probe.onload  = function () { plate[slot] = true;  apply(); };
    probe.onerror = function () {
      plate[slot] = false;
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
    /* The codex shows the TERMINAL plate, so it must show the SAME one the
       terminal chose this session — otherwise the two largest displays of a
       figure disagree with each other on the same page. If the terminal has
       not resolved yet, fall through to the plain probe below, which lands on
       the unnumbered original. */
    var sel = chosen[key];
    if (sel) { paintCodexSlot(key, sel, 'terminal'); return; }
    paintCodex(key, 'terminal');
  }

  /* paint a NAMED slot, used when the session has already chosen a variant */
  function paintCodexSlot(key, slot, surface) {
    var art = document.querySelector('.cdx-art');
    if (!art) return;
    var src = BASE + slot + '.jpg';
    art.style.backgroundImage = 'url("' + src + '"), ' +
      'radial-gradient(ellipse at 50% 70%,rgba(212,160,23,0.12),transparent 70%)';
    art.style.backgroundSize = 'cover';
    art.style.backgroundPosition = '50% 22%';
    art.setAttribute('data-fig', key);
    art.setAttribute('data-art-photo', surface);
    var svg = art.querySelector('svg'); if (svg) svg.style.display = 'none';
  }

  /* ---- TERMINAL ---------------------------------------------------------
     The centre chat panel is the largest canvas in the product, so the terminal
     plate goes behind the whole stream. The terminal tracks its selection with
     .term-char.active in the left roster. grades.css carries the per-plate
     opacity, keyed off data-fig. This surface does not paint itself — it only
     publishes data-fig, and the inline plate-v2 script in Page1.html does the
     rendering. */
  /* ---- ROTATION ---------------------------------------------------------
     A figure may have more than one terminal plate, and the site should not
     look the same every visit. The variants are numbered:

         img/{key}-terminal.jpg     the original, always tried first
         img/{key}-terminal-2.jpg
         img/{key}-terminal-3.jpg   ... and so on

     NO MANIFEST, for the reason in the header: a hand-maintained list of who
     has how many plates is the thing that drifts. Availability is DISCOVERED —
     the loader probes upward until one 404s, and the 404 IS the answer.

     ONE PLATE PER SESSION, NOT PER REPAINT. passTerminal() is driven by a
     subtree MutationObserver, so picking at random on every call would swap
     the background mid-conversation every time the stream mutated. The choice
     is made once per figure per session and remembered in `chosen`.

     COST. Discovery costs ONE extra 404 per figure with plates, once, ever —
     the probe results are cached in `plate` exactly like the single-plate
     path. A figure with one plate behaves as it always did: probe
     {key}-terminal.jpg, probe {key}-terminal-2.jpg once, get a 404, stop.
     Nothing changes for the fourteen figures that have one.

     WHY sessionStorage AND NOT localStorage. "Fresh next session" is the
     requirement. sessionStorage clears when the tab closes, which is exactly
     a session; localStorage would pin one plate for months. If storage is
     unavailable the pick falls back to in-memory and the page still works. */
  var MAX_TERMINAL = 6;          /* stop probing after this many */
  var chosen = {};               /* key -> resolved slot name, per session   */

  function sessionPick(key, n) {
    var k = 'amenti.term.' + key;
    try {
      var v = window.sessionStorage.getItem(k);
      if (v !== null) {
        var i = parseInt(v, 10);
        if (i >= 0 && i < n) return i;      /* still in range after a change */
      }
      var pick = Math.floor(Math.random() * n);
      window.sessionStorage.setItem(k, String(pick));
      return pick;
    } catch (e) {
      return Math.floor(Math.random() * n);  /* private mode, storage denied */
    }
  }

  function slotName(key, i) {
    return key + '-terminal' + (i === 0 ? '' : '-' + (i + 1));
  }

  /* Probe {key}-terminal, -2, -3 ... until one is missing, then choose. */
  function discoverTerminals(key, cb) {
    var found = [];
    (function step(i) {
      if (i >= MAX_TERMINAL) return cb(found);
      var slot = slotName(key, i);
      if (plate[slot] === true)  { found.push(i); return step(i + 1); }
      if (plate[slot] === false) { return cb(found); }   /* the 404 ends it */
      var probe = new Image();
      probe.onload  = function () { plate[slot] = true;  found.push(i); step(i + 1); };
      probe.onerror = function () { plate[slot] = false; cb(found); };
      probe.src = BASE + slot + '.jpg';
    })(0);
  }

  function passTerminal() {
    var main = document.querySelector('.term-main');
    if (!main) return;
    var key = keyFromRow(document.querySelector('.term-char.active'));
    if (!key) { main.removeAttribute('data-fig'); return; }
    if (main.getAttribute('data-fig') === key) return;

    /* already resolved this session — no probing, no flicker */
    if (chosen[key] !== undefined) {
      if (chosen[key] === null) { main.removeAttribute('data-fig'); return; }
      main.setAttribute('data-fig', key);
      main.setAttribute('data-term-plate', chosen[key]);
      return;
    }

    discoverTerminals(key, function (found) {
      if (!found.length) {
        chosen[key] = null;
        main.removeAttribute('data-fig');
        return;
      }
      var pick = found[sessionPick(key, found.length)];
      chosen[key] = slotName(key, pick);
      /* data-fig drives grades.css exactly as before; data-term-plate names
         the chosen file so the inline plate-v2 renderer in Page1.html can use
         it, and so the choice is visible in the DOM for debugging. */
      main.setAttribute('data-fig', key);
      main.setAttribute('data-term-plate', chosen[key]);
    });
  }

  function pass() { passCards(); sweep(); passCodex(); passTerminal(); }

  new MutationObserver(pass).observe(document.documentElement,
    { childList: true, subtree: true });
  window.addEventListener('hashchange', pass);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', pass);
  else pass();

  window.AmentiArtPhoto = { pass: pass, count: function () { return done; },
                            known: known, plate: plate, sweep: sweep };
})();
