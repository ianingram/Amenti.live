/* ===========================================================================
   amenti-dispatch-art.js — a banner for every dispatch, chosen by its own data
   ---------------------------------------------------------------------------
   THE PROBLEM
     Generated articles arrive with a headline and nothing else. The five
     hardcoded cards borrowed puppet SVGs from the hero slides, which is the
     drawn FALLBACK tier doing a job it was never meant to do, and it looks
     exactly as cheap as that sounds.

   WHY NOT GENERATE A PICTURE
     Cost per article, a wait on a render, and a picture that is about nothing
     in particular. The Metropolitan Museum's Open Access collection is
     406,000 images under CC0 — free, no key, no attribution required,
     commercial use permitted — and it is full of the actual objects that
     survive from the periods this site is about.

   WHY NOT CALL THE MET AT RUNTIME
     Because a fresh DNS lookup and TLS handshake to a third-party CDN is
     exactly the latency this site spent a night removing. The plates are
     harvested once and self-hosted, so a banner is one lazy request to an
     origin the browser already has open. These are objects from 400 BC; they
     are not going to update.

   HOW A BANNER IS CHOSEN — no AI, no search, no judgement at runtime
     A dispatch record already carries what is needed:

         rec.eventYear   a SIGNED integer — negative for BCE
         rec.figure      the figure key

     The Met's own search takes dateBegin and dateEnd as signed integers, so
     the harvest is period-banded. At runtime this file does the same match
     against the manifest: an object from within a century or so of the event,
     from a department that suits the figure's world.

     THAT IS DELIBERATELY *PERIOD* MATCHING, NOT SUBJECT MATCHING. An Attic
     lekythos from Caesar's lifetime is not a picture of Caesar, and the
     caption says so. That is the honest version and it is the better one:
     this is what survives from that world. The Met's keyword search cannot be
     trusted for subject — a live test for "astrolabe" returned an Egyptian
     funerary stela — but its dates are exact.

   THE CAPTION IS NOT OPTIONAL
     Without it the image is wallpaper that happens to be old. With it, it is
     evidence, which is the same move the reading rooms make. Every banner
     carries title, date and a link into the Met.

   IF THERE IS NO PLATE
     A typographic banner: the glyph, the eyebrow, the dateline, rules. That
     was always the decent floor and broadsheets ran on it for two centuries.
     This file works with an EMPTY manifest, and the articles look better than
     they do today.
   =========================================================================== */
(function () {
  'use strict';

  var MANIFEST = 'img/dispatch/manifest.json';
  var plates = null;          // null = not loaded, [] = loaded and empty
  var loading = null;

  /* Which Met department suits which world. The figure key decides, and where
     it does not, the event's year does. Department IDs are the Met's own. */
  var DEPT_BY_FIGURE = {
    'caesar':13,'julius-caesar':13,'cleopatra':13,'apollo':13,'lycurgus':13,
    'hannibal':13,'hannibal-barca':13,'odysseus':13,'prometheus':13,'minerva':13,
    'socrates':13,'plato':13,'aristotle':13,'alexander':13,'homer':13,'sappho':13,
    'akhenaten':10,'isis':10,'imhotep':10,'hatshepsut':10,'ramesses':10,
    'gilgamesh':3,'enki':3,'hammurabi':3,'ashurbanipal':3,
    'gutenberg':9,'charles-martel':17,'joan-of-arc':17,'aquinas':17,
    'leif-erikson':17,'king-arthur':17,'beowulf':17
  };

  /* And where the figure is unknown, the century is not. */
  function deptByYear(y) {
    if (y == null || isNaN(y)) return null;
    if (y < -1000) return 3;          // Ancient Near Eastern
    if (y < -30)   return 13;         // Greek and Roman
    if (y < 400)   return 13;
    if (y < 1400)  return 17;         // Medieval
    return 9;                          // Drawings and Prints — engravings
  }

  function norm(s) {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* A stable pick: the same dispatch always gets the same banner, and two
     dispatches in a row do not collide unless the pool is tiny. */
  function hash(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function load() {
    if (plates) return Promise.resolve(plates);
    if (loading) return loading;
    loading = fetch(MANIFEST, { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { plates = (d && d.plates) || []; return plates; })
      .catch(function () {
        /* No manifest yet is a NORMAL state, not an error. The typographic
           banner takes over and nothing looks broken. */
        plates = [];
        return plates;
      });
    return loading;
  }

  /* ---- THE SELECTOR ------------------------------------------------------
     Narrow by department, then by period, then fall back outward. Each step
     widens rather than failing, so there is always an answer or an honest
     nothing. */
  function choose(rec, pool) {
    if (!pool || !pool.length) return null;
    var y = (rec && typeof rec.eventYear === 'number') ? rec.eventYear : null;
    var dept = DEPT_BY_FIGURE[norm(rec && rec.figure)] || deptByYear(y);
    var seed = hash((rec && (rec.key || rec.headline)) || 'dispatch');

    function pick(list) { return list.length ? list[seed % list.length] : null; }

    var byDept = dept ? pool.filter(function (p) { return p.deptId === dept; }) : [];

    /* 1 — same department AND within 150 years of the event */
    if (y != null && byDept.length) {
      var close = byDept.filter(function (p) {
        return p.yearFrom != null && p.yearTo != null &&
               p.yearTo >= y - 150 && p.yearFrom <= y + 150;
      });
      if (close.length) return pick(close);
    }
    /* 2 — THE RIGHT CENTURY BEATS THE RIGHT DEPARTMENT.
           This order was the other way round at first and it put a 1756
           engraving on a dispatch about 1455 — the correct department and
           three centuries adrift. A Book of Hours leaf from 1450 was sitting
           in the pool, five years away, in a different department.

           Period is the claim the caption actually makes: this is what
           survives from that world. Department is only a proxy for period.
           When they disagree, the proxy loses. */
    if (y != null) {
      var era = pool.filter(function (p) {
        return p.yearFrom != null && p.yearTo != null &&
               p.yearTo >= y - 150 && p.yearFrom <= y + 150;
      });
      if (era.length) return pick(era);
      /* widen once before giving up on period entirely */
      var wider = pool.filter(function (p) {
        return p.yearFrom != null && p.yearTo != null &&
               p.yearTo >= y - 400 && p.yearFrom <= y + 400;
      });
      if (wider.length) return pick(wider);
    }
    /* 3 — same department, any period. Only now, and only because an object
           from the right WORLD is still better than one picked at random. */
    if (byDept.length) return pick(byDept);
    /* 4 — anything at all, still deterministic */
    return pick(pool);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- THE TYPOGRAPHIC FLOOR --------------------------------------------
     No image, and it should not look like a missing one. Rules, the glyph and
     the dateline — which is what a broadsheet does. */
  function typographic(rec) {
    var when = '';
    if (rec && typeof rec.eventYear === 'number') {
      when = rec.eventYear < 0 ? (Math.abs(rec.eventYear) + ' BCE')
                               : (rec.eventYear + ' CE');
    }
    return '<div class="dp-banner dp-banner-type">' +
             '<div class="dp-banner-rule"></div>' +
             '<div class="dp-banner-glyph">\u2248</div>' +
             '<div class="dp-banner-line">' +
               esc((rec && rec.name) || 'The Daily Planet') +
               (when ? ' <span class="dp-banner-sep">\u00b7</span> ' + esc(when) : '') +
             '</div>' +
             '<div class="dp-banner-rule"></div>' +
           '</div>';
  }

  /* ---- THE PICTURE ------------------------------------------------------- */
  function pictorial(p) {
    var cap = [p.title, p.date].filter(Boolean).join(', ');
    var credit = 'The Metropolitan Museum of Art';
    return '<figure class="dp-banner dp-banner-img">' +
             '<img src="' + esc(p.file) + '" alt="' + esc(p.title || 'Museum object') + '" ' +
                  'loading="lazy" decoding="async" width="1200" height="500">' +
             '<figcaption class="dp-banner-cap">' +
               esc(cap) +
               (p.url ? ' \u00b7 <a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
                        credit + '</a>'
                      : ' \u00b7 ' + credit) +
             '</figcaption>' +
           '</figure>';
  }

  /* ---- PUBLIC ------------------------------------------------------------
     bannerFor(rec) resolves to an HTML string. It never rejects: the worst
     case is the typographic banner, which is a perfectly good answer. */
  function bannerFor(rec) {
    return load().then(function (pool) {
      var p = choose(rec, pool);
      return p ? pictorial(p) : typographic(rec);
    }).catch(function () { return typographic(rec); });
  }

  /* Insert AFTER the article body exists, never before — the text is the
     thing the reader came for and must not wait on a picture. */
  function attach(container, rec) {
    if (!container) return;
    if (container.querySelector('.dp-banner')) return;
    bannerFor(rec).then(function (html) {
      if (!container || container.querySelector('.dp-banner')) return;
      var d = document.createElement('div');
      d.innerHTML = html;
      var node = d.firstChild;
      if (node) container.insertBefore(node, container.firstChild);
    });
  }

  window.AmentiDispatchArt = {
    bannerFor: bannerFor,
    attach: attach,
    /* so it can be inspected without opening an article */
    _pool: function () { return plates; },
    _choose: choose
  };
})();
