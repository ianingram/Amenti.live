/* ===========================================================================
   amenti-dispatch-feed.js — the Amenti Dispatch section reads the real feed
   ---------------------------------------------------------------------------
   WHAT WAS THERE BEFORE

     Five hardcoded .news-card divs: Lincoln, Musashi, Caesar, Gandhi,
     Hannibal — with invented headlines and invented read counts ("12.4k
     reads", "2h ago"). Clicking one derived a slug from the mock headline and
     asked the Worker to WRITE THAT ARTICLE ON DEMAND.

     Meanwhile publishWeek() has been writing real, finished dispatches into
     KV under dailyplanet: — seven a week, each with a headline, a written
     teaser and a scene tag — and NOTHING ON THE SITE READ THEM.

     So the section advertised five articles that did not exist and hid the
     ones that did.

   WHAT THIS DOES

     Reads /feed?prefix=dailyplanet:&details=1, takes the current issue, and
     renders the same five-card grid from real records. First card featured,
     four beside it — the layout is unchanged, only the source is.

     Clicking a card opens the article that ALREADY EXISTS, by key, through
     the reader that is already built. No generation, no wait, no cost.

   WHY IT DOES NOT GENERATE

     Generate-on-click made sense when the cards were mock: there was nothing
     to open, so something had to be written. Now there is. A click that
     silently spends a Claude call and 30 seconds — for an article sitting
     finished in KV — is the same mistake as /atlantica/daily, which is a
     known 34-second cost on first page load.

     The click-to-generate path is LEFT INTACT and untouched. It is still
     reachable, still works, and is the correct fallback for a card whose
     record has no body. It is simply no longer the default for a published
     article.

   THE BANNER

     Each record carries sceneTag — one of 64 situations chosen by the model
     in the same call that wrote the article. When the scene images exist,
     paintBanner() below turns that into a picture. Until they do it does
     nothing, and the card looks exactly as it does now.

     THIS DELIBERATELY DOES NOT USE amenti-dispatch-art.js. That file selects
     Met museum plates by period band from a manifest that was never
     harvested. The approach was sidelined: period-matched objects need an
     expert voice to mean anything, and the Met's own subject tagging
     collapses outside Greek and Roman (0 of 45 sampled objects tagged in both
     Medieval and Ancient West Asian). The scene tag replaces it.

   IF THE FEED IS EMPTY OR UNREACHABLE

     The existing hardcoded cards are LEFT EXACTLY WHERE THEY ARE. Nothing is
     removed until there is something to put in its place. A reader who loads
     this page while the Worker is down sees the page as it is today, not a
     hole where a section used to be.
   =========================================================================== */
(function () {
  'use strict';

  var PROXY = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.PROXY_URL)
            || 'https://amenti-proxy.ingram-ian.workers.dev';
  var FEED  = PROXY + '/feed?prefix=dailyplanet:&details=1';
  var CARDS = 5;                       /* one featured + four */
  var SCENE_BASE = 'img/scenes/';      /* {sceneTag}.jpg — none exist yet */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* The roster gives the glyph and the display name. It is loaded by the same
     page, so this reads it rather than fetching the CSV a second time. */
  function figureOf(key) {
    var chars = window.AMENTI_CHARS || [];
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] && chars[i].key === key) return chars[i];
    }
    return null;
  }

  /* "2026-09-07" -> "7 Sep". The mock cards said "2h ago" and "8h ago", which
     was fiction, and would be a lie on a WEEKLY publication even if it were
     computed — six of seven days it would read "6d ago" and look abandoned.
     An issue date is the honest unit for a weekly. */
  function when(d) {
    if (!d) return '';
    var t = Date.parse(d + 'T00:00:00Z');
    if (isNaN(t)) return esc(d);
    var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dt = new Date(t);
    return dt.getUTCDate() + ' ' + M[dt.getUTCMonth()];
  }

  /* The current issue = the highest weekStart present. Records within one
     issue share it, so this groups rather than slicing by date — which is
     what the "today" lookup got wrong elsewhere on the site: on a weekly
     cadence, matching an exact date is false six days in seven. */
  function currentIssue(items) {
    if (!items.length) return [];
    var weeks = items.map(function (it) { return it.weekStart || it.date || ''; })
                     .filter(Boolean).sort();
    var latest = weeks[weeks.length - 1];
    var issue = items.filter(function (it) {
      return (it.weekStart || it.date || '') === latest;
    });
    /* A record with no weekStart predates the weekly publisher. Rather than
       drop it, fall back to newest-first across everything. */
    return issue.length ? issue : items;
  }

  function paintBanner(el, rec) {
    if (!rec.sceneTag) return;
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = 'url(' + SCENE_BASE + rec.sceneTag + '.jpg)';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.classList.add('nc-thumb-scene');
    };
    /* No onerror handler on purpose: a missing scene is the NORMAL state until
       the pool is generated. Failing silently leaves the existing thumb grid,
       which is a perfectly good placeholder. */
    img.src = SCENE_BASE + rec.sceneTag + '.jpg';
  }

  function card(rec, featured) {
    var fig = figureOf(rec.figure) || {};
    var glyph = fig.glyph || '\u2248';
    var name = rec.name || fig.name || rec.figure || '';
    var d = document.createElement('div');
    d.className = 'news-card' + (featured ? ' featured' : '');
    d.setAttribute('data-char-key', rec.figure || '');
    d.setAttribute('data-key', rec.key || '');
    d.style.cursor = 'pointer';

    var thumbStyle = featured ? ' style="height:280px"' : '';
    d.innerHTML =
      '<div class="nc-thumb"' + thumbStyle + '><div class="nc-thumb-grid"></div>' +
        '<span class="nc-glyph">' + esc(glyph) + '</span></div>' +
      '<div class="nc-cat dp-cat"><span class="dp-glyph">' + esc(glyph) + '</span> ' +
        esc(rec.epithet || 'Dispatch') + ' \u00b7 ' + esc(name) + '</div>' +
      '<div class="nc-title dp-headline">' + esc(rec.headline || '') + '</div>' +
      (featured && rec.teaser
        ? '<div class="nc-body dp-body">' + esc(rec.teaser) + '</div>' : '') +
      '<div class="nc-footer"><span class="nc-meta">' +
        '<span class="nc-time">' + when(rec.date) + '</span>' +
        (rec.theme ? '<span class="nc-dot">\u00b7</span><span class="nc-tag">' +
                     esc(rec.theme) + '</span>' : '') +
      '</span><span class="nc-arrow">\u2192</span></div>';

    var thumb = d.querySelector('.nc-thumb');
    if (thumb) paintBanner(thumb, rec);

    /* OPEN, do not GENERATE. The article is already written. */
    d.addEventListener('click', function () { open(rec); });
    return d;
  }

  /* Reuse whatever reader the page already has. Page1 builds one for the
     click-to-generate path; if a hook is exposed, use it. Otherwise fetch the
     record and hand it to the same renderer. Adding a SECOND reader to this
     page would be two things to keep in step, and the site has been bitten by
     duplicate copies before. */
  function open(rec) {
    if (window.AmentiDispatchReader && window.AmentiDispatchReader.openKey) {
      window.AmentiDispatchReader.openKey(rec.key, rec);
      return;
    }
    /* No reader hook exposed — fall back to the article URL so a click is
       never a dead end. */
    window.location.hash = 'dispatch/' + encodeURIComponent(rec.key);
  }

  function render(items) {
    var grid = document.querySelector('#news .news-grid');
    if (!grid || !items.length) return;              /* keep what is there */

    var issue = currentIssue(items).slice(0, CARDS);

    /* DO NOT TRADE FIVE CARDS FOR ONE.
       Right now KV holds a single usable dailyplanet: record — the rest were
       dev seeds. Replacing a full grid with one card would make the section
       look broken rather than new, and "the real data is thin" is not a reason
       to show the reader less than they see today.

       Below MIN_CARDS the static markup stays exactly as it is. Once a week
       publishes, seven records arrive at once and this clears on its own. */
    var MIN_CARDS = 3;
    if (issue.length < MIN_CARDS) {
      try {
        console.log('[dispatch] only ' + issue.length + ' record(s) in the current ' +
                    'issue; keeping static cards until there are ' + MIN_CARDS + '.');
      } catch (e) {}
      return;
    }

    grid.innerHTML = '';
    issue.forEach(function (rec, i) { grid.appendChild(card(rec, i === 0)); });

    var head = document.querySelector('#news .section-date');
    if (head && issue[0]) {
      head.textContent = 'Issue of ' + when(issue[0].weekStart || issue[0].date);
    }
    try { console.log('[dispatch] rendered ' + issue.length + ' of ' + items.length + ' records'); }
    catch (e) {}
  }

  function load() {
    fetch(FEED, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var items = (d && d.items) || [];
        /* Test and stub records were seeded during development and are still
           in KV. They must never reach a reader. */
        items = items.filter(function (it) {
          return it.headline && !/^test\b/i.test(it.headline);
        });
        /* Dev seeding left two records with the SAME headline under different
           slugs (dailyplanet:lincoln:90-minutes-made-president and
           dailyplanet:lincoln:lincoln-s-cooper-union-speech-90-minutes). The
           grid would have shown one article twice. publishWeek keys by figure
           and week so it cannot produce this, but the old click-to-generate
           path could — slug came from the headline, and two phrasings of one
           headline slugged differently. Keep the first, drop the rest. */
        var byHeadline = {};
        items = items.filter(function (it) {
          var h = String(it.headline).toLowerCase().trim();
          if (byHeadline[h]) return false;
          byHeadline[h] = 1;
          return true;
        });
        render(items);
      })
      .catch(function (e) {
        /* The hardcoded cards stay. Say so in the console rather than on the
           page — a reader should not be told the plumbing failed. */
        try { console.warn('[dispatch] feed unavailable, keeping static cards:', e.message); }
        catch (x) {}
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

  window.AmentiDispatchFeed = { reload: load, _render: render };
})();
