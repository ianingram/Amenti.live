/* ===========================================================================
   amenti-art-3.js  v3 - THE DISPLAY LAYER
   ---------------------------------------------------------------------------
   ONE JOB. Fetch live renderings from the mint worker and put them where
   card art belongs.

   WHAT v3 FIXES over v2
      v2 matched on data-figure, which amenti-roster.js fills with the card's
      DISPLAY NAME (rc-name uses the same string). The key lives in
      data-char-key, written from the resolver's characters row - the same
      key space scene_key uses. v3 matches data-char-key first and falls
      back to the normalized display name.

   WHAT v2 FIXED - the three ways v1 could deliver nothing

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
    /* Tell the browser this insertion cannot affect anything outside the
       card. Without it, appending a ~95-node SVG makes the whole 53-card
       grid a layout question — thirty-eight times over. The CSS carries the
       same rule; this is here so the file stands on its own. */
    try { if (host.style && !host.style.contain) host.style.contain = 'layout paint style'; } catch (e) {}
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
    document.querySelectorAll('[data-char-key]:not([data-art3]), [data-figure]:not([data-art3])')
      .forEach(function (el) {
        /* data-char-key is the resolver's key - the same key space the scenes
           use. data-figure is the DISPLAY NAME printed on the card; it is only
           a fallback, and names like "Julius Caesar" will not match "caesar".
           That mismatch is exactly why v2 decorated nothing. */
        var key = el.getAttribute('data-char-key') || el.getAttribute('data-figure');
        cards.push({ el: el, key: norm(key),
                     alt: norm(el.getAttribute('data-figure')) });
      });

    /* ── FETCH TOGETHER, PAINT ONE AT A TIME ────────────────────────────
       This was:
           for (...) { row = await ensureArtifact(row); inject(...); }
       — a fetch awaited inside a loop, so thirty-eight round trips ran in
       series. Measured on the live site: renderings come back in 118-154 ms
       each, so the network was never slow; it was simply never asked twice
       at once.

       And every inject() was followed immediately by the next fetch, so the
       browser had a fresh ~95-node SVG to lay out while nothing else could
       proceed. The click profile caught the result exactly: frames of
       1,280 / 2,592 / 2,819 / 2,808 / 1,344 ms, with 97% of eleven seconds
       spent inside them and NO long task and NO slow request to blame.

       So: ask for everything at once, then paint them a few per frame. The
       fetches overlap, and the browser gets a breath between insertions
       instead of a queue of them. */
    var pending = [];
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var row = byFigure[c.key] || (c.alt && byFigure[c.alt]);
      if (!row) {
        state.unmatchedCards[c.key] = (state.unmatchedCards[c.key] || 0) + 1;
        continue;
      }
      pending.push({ c: c, row: row });
    }

    /* all the fetches at once. allSettled, so one failure does not take the
       rest with it — the old loop would have thrown and stopped. */
    var resolved = await Promise.all(pending.map(function (p) {
      return ensureArtifact(p.row).then(
        function (r) { return { c: p.c, row: r }; },
        function ()  { return { c: p.c, row: p.row }; }
      );
    }));

    /* paint in small batches, yielding a frame between each, so no single
       frame carries more than a couple of insertions */
    var BATCH = 3;
    for (var b = 0; b < resolved.length; b += BATCH) {
      var slice = resolved.slice(b, b + BATCH);
      for (var k = 0; k < slice.length; k++) {
        var it = slice[k], r2 = it.row;
        if (!r2 || !r2.artifact) {
          if (r2 && state.noArtifact.indexOf(r2.scene_key) === -1) state.noArtifact.push(r2.scene_key);
          continue;
        }
        if (!safe(r2.artifact)) {
          if (state.refused.indexOf(r2.scene_key) === -1) state.refused.push(r2.scene_key);
          continue;
        }
        if (inject(it.c.el, r2.artifact, r2.scene_key)) {
          state.done[r2.scene_key] = true;
          state.matched.push(it.c.key + ' <- ' + r2.scene_key);
        }
      }
      if (b + BATCH < resolved.length) {
        await new Promise(function (res) {
          (window.requestAnimationFrame || setTimeout)(function () { setTimeout(res, 0); });
        });
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
              (n.hasAttribute && (n.hasAttribute('data-figure') || n.hasAttribute('data-char-key'))
               || (n.querySelector && n.querySelector('[data-figure],[data-char-key]')))) {
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
