/* ===========================================================================
   amenti-art-3.js - THE DISPLAY LAYER
   ---------------------------------------------------------------------------
   ONE JOB. Fetch live renderings from the mint worker and put them where
   card art belongs. This is the file whose absence meant the Art Director
   drew 38 figures no user ever saw.

   HOW IT DECIDES WHAT TO SHOW

     A card declares its figure with  data-figure="caesar"  (preferred)
     or is matched by  [data-char]  legacy index -> figure key, below.
     For each figure this script asks the mint worker for the PRIMARY
     scene's rendering in the site's display style, and injects the SVG.

     LIVE ONLY. The worker's style-level list already filters to live;
     this script adds nothing staged. Promotion stays a deliberate act
     done in Supabase, and the moment a row goes live it appears here
     on the next load with no further work.

   WHAT IT NEVER DOES

     - never writes anything, anywhere
     - never renders a staged or draft artifact
     - never replaces art that is already present unless the fetch
       succeeded and validated  (no blanking cards on a failed network)
     - never injects an artifact carrying script/foreignObject/on*=
       even though the Art Director validator already refuses these -
       defense does not trust upstream

   SETUP
     <script src="amenti-art-3.js"></script>   after the DOM it decorates.
     Optional:  window.AMENTI_ART = { style:'puppet', workerBase:'...' }
     before the tag to override defaults.
   =========================================================================== */
(function () {
  'use strict';

  var CFG = window.AMENTI_ART || {};
  var BASE  = CFG.workerBase || 'https://amenti-mint.ingram-ian.workers.dev';
  var STYLE = CFG.style || 'puppet';

  /* legacy hero cards: [data-char] index -> figure key. The six hero slides
     are legacy art and stay untouched; this map only lets their ROSTER
     cards upgrade to library art when a live rendering exists. */
  var LEGACY_INDEX = ['lincoln', 'musashi', 'caesar', 'gandhi', 'moses', 'hannibal'];

  function safe(svg) {
    if (!svg || svg.indexOf('<svg') === -1) return false;
    return !(/<script\b|<foreignObject\b|<iframe\b|<image\b|javascript:|<!ENTITY/i.test(svg)
             || /<[a-z][^>]*\son[a-z]+\s*=/i.test(svg));
  }

  function inject(el, svg, sceneKey) {
    var host = el.querySelector('.rc-img, .nc-thumb, .mkt-thumb') || el;
    var wrap = document.createElement('div');
    wrap.innerHTML = svg;
    var node = wrap.querySelector('svg');
    if (!node) return false;
    node.setAttribute('data-scene', sceneKey);
    node.setAttribute('data-source', 'renderings');
    node.style.width = '100%';
    node.style.height = '100%';
    node.style.display = 'block';
    /* replace only the previous art, not the card chrome */
    var old = host.querySelector('svg');
    if (old) host.replaceChild(node, old); else host.appendChild(node);
    return true;
  }

  async function fetchRenderings() {
    var r = await fetch(BASE + '/renderings?style=' + encodeURIComponent(STYLE)
                        + '&artifacts=true', { cache: 'no-store' });
    if (!r.ok) throw new Error('renderings http ' + r.status);
    var d = await r.json();
    var rows = (d && d.renderings) || [];
    /* index by figure: scene_key convention is <figure>-primary / -<variant> */
    var byFigure = {};
    rows.forEach(function (row) {
      if (row.status && row.status !== 'live') return;   /* belt and braces */
      var fig = String(row.scene_key || '').replace(/-[a-z0-9]+$/, '');
      var isPrimary = /-primary$/.test(row.scene_key || '');
      if (!byFigure[fig] || isPrimary) byFigure[fig] = row;
    });
    return byFigure;
  }

  async function run() {
    var byFigure;
    try { byFigure = await fetchRenderings(); }
    catch (e) { console.warn('[amenti-art-3] renderings unavailable:', e.message); return; }

    var cards = [];
    document.querySelectorAll('[data-figure]').forEach(function (el) {
      cards.push({ el: el, fig: el.getAttribute('data-figure') });
    });
    document.querySelectorAll('[data-char]').forEach(function (el) {
      var fig = LEGACY_INDEX[+el.getAttribute('data-char')];
      if (fig) cards.push({ el: el, fig: fig });
    });

    var shown = 0, skipped = 0;
    cards.forEach(function (c) {
      var row = byFigure[c.fig];
      if (!row || !row.artifact) { skipped++; return; }
      if (!safe(row.artifact)) {
        console.warn('[amenti-art-3] refused unsafe artifact for', c.fig);
        skipped++; return;
      }
      if (inject(c.el, row.artifact, row.scene_key)) shown++;
    });
    console.log('[amenti-art-3] style=' + STYLE
      + '  live figures=' + Object.keys(byFigure).length
      + '  cards updated=' + shown + '  left as-is=' + skipped);
  }

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
