/* ===========================================================================
   amenti-art-3.js  v2 - THE DISPLAY LAYER
   ---------------------------------------------------------------------------
   ONE JOB. Fetch live renderings from the mint worker and put them where
   card art belongs.

   WHAT v2 FIXES - the three ways v1 could deliver nothing

   1. TIMING. The roster is built by other scripts after load, and this page
      routes by hash (#arena/...). v1 ran once at DOMContentLoaded and
      decorated a page whose cards did not exist yet. v2 watches: it re-runs
      on DOM mutation and on hashchange, idempotently - a card is decorated
      at most once, whenever it appears.

   2. ARTIFACT DELIVERY. artifacts=true is proven on the per-scene query;
      the style-level list may return metadata only. v2 uses the list for
      inventory, and if a row arrives without its artifact, fetches that
      scene individually - only for figures that actually have a card.

   3. KEY MATCHING. Card keys and scene keys are matched case-insensitively
      with whitespace and underscores normalized. Whatever still fails to
      match is NAMED in the report rather than silently skipped.

   SELF-REPORT - no console required
      Load the page with  ?artreport=1  in the URL (before the #hash), e.g.
        Page1.html?artreport=1#arena/hero
      and the script downloads amenti-art3-report.txt after its first pass:
      what matched, what did not, and why. Normal visitors never see this.

   UNCHANGED FROM v1
      - live renderings only; staged is never shown
      - never writes anywhere; never blanks a card on a failed fetch
      - refuses artifacts carrying script/foreignObject/on*= regardless
        of upstream validation
   =========================================================================== */
(function () {
  'use strict';

  var CFG   = window.AMENTI_ART || {};
  var BASE  = CFG.workerBase || 'https://amenti-mint.ingram-ian.workers.dev';
  var STYLE = CFG.style || 'puppet';
  var WANT_REPORT = /[?&]artreport=1/.test(location.search);

  var state = {
    rows: null,          /* figure -> rendering row */
    done: {},            /* scene_key -> true, cards already decorated */
    matched: [],
    unmatchedCards: {},  /* card key -> count */
    noArtifact: [],
    refused: [],
    passes: 0,
    reported: false
  };

  function norm(k) {
    return String(k || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  }

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
    node.style.width = '100%'; node.style.height = '100%'; node.style.display = 'block';
    var old = host.querySelector('svg');
    if (old) host.replaceChild(node, old); else host.appendChild(node);
    el.setAttribute('data-art3', 'done');
    return true;
  }

  async function loadInventory() {
    if (state.rows) return state.rows;
    var r = await fetch(BASE + '/renderings?style=' + encodeURIComponent(STYLE)
                        + '&artifacts=true', { cache: 'no-store' });
    if (!r.ok) throw new Error('renderings http ' + r.status);
    var d = await r.json();
    var byFigure = {};
    ((d && d.renderings) || []).forEach(function (row) {
      if (row.status && row.status !== 'live') return;
      var fig = norm(row.scene_key).replace(/-[a-z0-9]+$/, '');
      var isPrimary = /-primary$/.test(row.scene_key || '');
      if (!byFigure[fig] || isPrimary) byFigure[fig] = row;
    });
    state.rows = byFigure;
    return byFigure;
  }

  async function ensureArtifact(row) {
    if (row.artifact) return row;
    /* the list came back metadata-only; fetch this scene alone */
    try {
      var r = await fetch(BASE + '/renderings?scene=' + encodeURIComponent(row.scene_key)
                          + '&style=' + encodeURIComponent(STYLE) + '&artifacts=true',
                          { cache: 'no-store' });
      if (!r.ok) return row;
      var d = await r.json();
      var full = ((d && d.renderings) || [])[0];
      if (full && full.artifact && (!full.status || full.status === 'live')) {
        row.artifact = full.artifact;
      }
    } catch (e) {}
    return row;
  }

  async function pass() {
    state.passes++;
    var byFigure;
    try { byFigure = await loadInventory(); }
    catch (e) { console.warn('[amenti-art-3] renderings unavailable:', e.message); return; }

    var cards = [];
    document.querySelectorAll('[data-figure]:not([data-art3])').forEach(function (el) {
      cards.push({ el: el, key: norm(el.getAttribute('data-figure')) });
    });

    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var row = byFigure[c.key];
      if (!row) {
        state.unmatchedCards[c.key] = (state.unmatchedCards[c.key] || 0) + 1;
        continue;
      }
      row = await ensureArtifact(row);
      if (!row.artifact) {
        if (state.noArtifact.indexOf(row.scene_key) === -1) state.noArtifact.push(row.scene_key);
        continue;
      }
      if (!safe(row.artifact)) {
        if (state.refused.indexOf(row.scene_key) === -1) state.refused.push(row.scene_key);
        continue;
      }
      if (inject(c.el, row.artifact, row.scene_key)) {
        state.done[row.scene_key] = true;
        state.matched.push(c.key + ' <- ' + row.scene_key);
      }
    }

    var shown = Object.keys(state.done).length;
    console.log('[amenti-art-3] pass ' + state.passes + '  style=' + STYLE
      + '  live=' + Object.keys(byFigure).length
      + '  decorated=' + shown
      + '  unmatched-keys=' + Object.keys(state.unmatchedCards).length);

    if (WANT_REPORT && !state.reported && (shown > 0 || state.passes >= 3)) {
      state.reported = true;
      report(byFigure);
    }
  }

  function report(byFigure) {
    var L = [];
    L.push('AMENTI ART-3 v2 SELF-REPORT');
    L.push(new Date().toISOString() + '  style=' + STYLE + '  passes=' + state.passes);
    L.push('================================================================');
    L.push('');
    L.push('live figures offered by worker: ' + Object.keys(byFigure).length);
    L.push('cards decorated: ' + Object.keys(state.done).length);
    state.matched.forEach(function (m) { L.push('  ' + m); });
    L.push('');
    var un = Object.keys(state.unmatchedCards).sort();
    L.push('card keys with NO matching figure (' + un.length + '):');
    un.forEach(function (k) { L.push('  ' + k + '  (x' + state.unmatchedCards[k] + ')'); });
    L.push('');
    L.push('rows with no artifact even after per-scene fetch (' + state.noArtifact.length + '):');
    state.noArtifact.forEach(function (k) { L.push('  ' + k); });
    L.push('');
    L.push('artifacts refused as unsafe (' + state.refused.length + '):');
    state.refused.forEach(function (k) { L.push('  ' + k); });
    L.push('');
    L.push('HOW TO READ THIS:');
    L.push('  decorated > 0 and unmatched small  -> wired; fix the named keys.');
    L.push('  decorated = 0, unmatched = all     -> card keys differ from scene');
    L.push('     keys; the list above shows exactly what the cards call their');
    L.push('     figures. Send this file back and the map gets built from it.');
    L.push('  no-artifact list is long           -> the worker list and the');
    L.push('     per-scene route both withheld svgs; the worker needs a look.');
    try {
      var blob = new Blob([L.join('\n')], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'amenti-art3-report.txt';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
  }

  /* ---- run now, on future DOM growth, and on route changes -------------- */
  function boot() {
    pass();
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1 &&
              (n.hasAttribute && n.hasAttribute('data-figure')
               || (n.querySelector && n.querySelector('[data-figure]')))) {
            pass();
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { setTimeout(pass, 300); });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
