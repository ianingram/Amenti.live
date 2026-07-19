/* ===========================================================================
   amenti-roster.js — THE ARENA ROSTER, GENERATED
   ---------------------------------------------------------------------------
   Builds the arena's cards from the LIVE quiz library instead of by hand.

   THE CRACK THIS CLOSES
     Cards were hand-written in Page1.html while the library lived in a table.
     Two lists, maintained separately, and they had already drifted: Lincoln's
     card read "FEDERAL ERA · 1861" while his quiz reads "AMERICAN CIVIL WAR ·
     1863", and every card claimed "5 QUESTIONS" when the real counts are 4 and
     6. Six cards stood in front of twenty-two quizzes; sixteen were unreachable
     except through the picker.

     Now there is one source. Insert a row into `topics` and a card appears.
     Nothing to remember, nothing to keep in step.

   THE CONTRACT WITH amenti-quiz.js
     Each card carries data-topic, exactly as the hand-built ones did. After
     rendering we call amentiQuiz.wireRoster() so the click handlers attach to
     cards that did not exist at DOMContentLoaded.

   THE GLASS GATE
     If the library cannot be read, the arena says so. It does not fall back to
     a stale hand-written list, and it does not show an empty grid pretending
     all is well.

   USAGE in Page1.html — replace the six static .roster-card divs with:
       <div id="amenti-roster"></div>
   and load this file after amenti-quiz.js.
   =========================================================================== */
(function () {
  'use strict';

  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL)
          || 'https://amenti-mint.ingram-ian.workers.dev';

  /* The card art. Hand-chosen for the figures that had cards; everything else
     falls back by domain so a new quiz always arrives wearing something. */
  var ICON = {
    'Abraham Lincoln': '\uD83C\uDFA9',           // top hat
    'Miyamoto Musashi': '\u2694\uFE0F',          // crossed swords
    'Julius Caesar': '\uD83E\uDD85',             // eagle
    'Mahatma Gandhi': '\u262E\uFE0F',            // peace
    'Moses': '\uD83D\uDCDC',                     // scroll
    'Hannibal Barca': '\uD83D\uDC18',            // elephant
    'Oliver Cromwell': '\uD83D\uDC51',           // crown
    'Akhenaten': '\u2600\uFE0F',                 // sun
    'Marcus Aurelius': '\uD83C\uDFDB\uFE0F',     // classical building
    'Seneca the Younger': '\uD83C\uDF77',        // wine
    'Prometheus': '\uD83D\uDD25',                // fire
    'King Arthur': '\uD83D\uDDE1\uFE0F',         // dagger
    'Sun Tzu': '\uD83C\uDF8B',                   // tanzaku
    'Lycurgus of Sparta': '\uD83D\uDEE1\uFE0F',  // shield
    'Odysseus': '\u26F5',                        // sailboat
    'Loki': '\uD83D\uDC0D',                      // serpent
    'Gilgamesh': '\uD83C\uDFF0',                 // castle
    'Confucius': '\uD83C\uDF8F',                 // carp streamer
    'Marcus Manlius Capitolinus': '\uD83E\uDDA2',// swan (the geese)
    'Helen Keller': '\uD83D\uDCA7',              // droplet (the pump)
    'Ayn Rand': '\uD83C\uDFD7\uFE0F',            // construction
    'Leif Erikson': '\uD83E\uDDED',              // compass
    'Albert Einstein': '\u269B\uFE0F'            // atom
  };
  var DOMAIN_ICON = {
    'War & Strategy': '\u2694\uFE0F',
    'Statecraft & Governance': '\uD83C\uDFDB\uFE0F',
    'Wisdom & Philosophy': '\uD83D\uDCD6',
    'Letters & Ideas': '\uD83D\uDD8B\uFE0F',
    'Faith & Prophecy': '\uD83D\uDD4A\uFE0F',
    'Cunning & Craft': '\uD83C\uDFAD',
    'Reform & Justice': '\u2696\uFE0F',
    'Exploration & Discovery': '\uD83E\uDDED',
    'Science & Invention': '\u269B\uFE0F'
  };

  /* THE ATTRIBUTES.
     window.AMENTI_CHARS holds a codex record per character: a bio, abilities,
     a voice, and four scores — strategy, charisma, foresight, combat. Twelve of
     the quiz figures have one; the rest do not, and NOTHING IS INVENTED for
     them. A card with no record simply carries no bars.

     Matching is deliberately strict. A loose first-name match would hand
     Marcus MANLIUS the stats of Marcus AURELIUS — a quiet, plausible lie of
     exactly the kind this whole system exists to prevent. So a record is
     claimed only when the LAST name agrees, or one full name contains the
     other ("Moses" inside "Moses ben Amram"). */
  function words(x) {
    return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  }
  function codexFor(figure) {
    var chars = window.AMENTI_CHARS;
    if (!Array.isArray(chars) || !figure) return null;
    var f = words(figure); if (!f.length) return null;
    var fs = f.join(' ');
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i]; if (!c || !c.name) continue;
      var n = words(c.name); if (!n.length) continue;
      var ns = n.join(' ');
      if (f[f.length - 1] === n[n.length - 1]) return c;
      if (fs.indexOf(ns) !== -1 || ns.indexOf(fs) !== -1) return c;
    }
    return null;
  }

  var STAT_LABEL = { strategy: 'STR', charisma: 'CHA', foresight: 'FOR', combat: 'CBT' };
  function statBars(c) {
    if (!c || !c.stats) return '';
    var rows = ['strategy', 'charisma', 'foresight', 'combat'].map(function (k) {
      var v = Number(c.stats[k]);
      if (!isFinite(v)) return '';
      return '<div class="rc-attr">'
        + '<span class="rc-attr-k">' + STAT_LABEL[k] + '</span>'
        + '<span class="rc-attr-bar"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></span>'
        + '<span class="rc-attr-v">' + v + '</span></div>';
    }).join('');
    return rows ? '<div class="rc-attrs">' + rows + '</div>' : '';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function iconFor(t) {
    var fig = (t.facets && t.facets.figure && t.facets.figure[0]) || '';
    if (ICON[fig]) return ICON[fig];
    var dom = (t.facets && t.facets.domain && t.facets.domain[0]) || '';
    return DOMAIN_ICON[dom] || '\u25C8';
  }

  /* THE PORTRAITS.
     I first believed only six figures were drawn, because populateMiniPortraits()
     reads .char-slide .char-art — the six hero-carousel slides. That is one
     shelf, not the library.

     The library is window.AMENTI_SVG: twenty-one hand-drawn character SVGs
     keyed by codex key (lincoln, musashi, sun-tzu, marcus-aurelius, akhenaten
     ...). Twelve of the current quiz figures have one. So the card asks the
     library directly rather than borrowing from the carousel.

     Figures with no drawing keep the gradient panel and their badge. Nothing
     is substituted — a stand-in face would be a lie about who this is. */
  function artFor(figure) {
    var lib = window.AMENTI_SVG;
    if (!lib) return null;
    var rec = codexFor(figure);
    var key = rec && rec.key;
    if (!key || typeof lib[key] !== 'function') return null;
    try { return lib[key](); } catch (e) { return null; }
  }

  /* The hero art is drawn for a 320x560 stage; the card panel is 160px tall.
     Strip the backdrop rects so it sits on the card's own gradient, exactly as
     populateMiniPortraits does for the six it knows about. */
  function fitArt(html) {
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var svg = wrap.querySelector('svg');
    if (!svg) return null;
    svg.removeAttribute('class');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    svg.setAttribute('style', 'position:absolute;left:50%;bottom:0;transform:translateX(-50%);'
      + 'height:100%;width:auto;pointer-events:none');
    var rects = svg.querySelectorAll('rect');
    for (var i = 0; i < rects.length; i++) {
      if (rects[i].getAttribute('width') === '320') { rects[i].remove(); }
    }
    return svg;
  }

  /* Applied after render, and retried: AMENTI_CHARS is rebuilt asynchronously
     from the roster CSV, so the library may not be ready on the first pass. */
  function paintPortraits(host, tries) {
    tries = tries || 0;
    var painted = 0;
    var cards = host.querySelectorAll('.roster-card');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.getAttribute('data-art') === '1') { painted++; continue; }
      var fig = c.getAttribute('data-figure');
      var html = artFor(fig);
      if (!html) continue;
      var svg = fitArt(html);
      if (!svg) continue;
      var panel = c.querySelector('.rc-img');
      if (!panel) continue;
      panel.appendChild(svg);
      c.setAttribute('data-art', '1');
      painted++;
    }
    if (painted < cards.length && tries < 6) {
      setTimeout(function () { paintPortraits(host, tries + 1); }, 400);
    }
  }

  function card(t) {
    var fig = (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
    var era = t.era || ((t.facets && t.facets.era && t.facets.era[0]) || '');
    var n = t.questions || 0;
    var rec = codexFor(fig);
    return '<div class="roster-card"'
      + (rec && rec.id !== undefined ? ' data-char="' + rec.id + '"' : '')
      + ' data-figure="' + esc(fig) + '"'
      + ' data-topic="' + esc(t.id) + '">'
      + '<div class="rc-prize">EARN \u25C8</div>'
      + '<div class="rc-img"><div class="rc-img-grid"></div>'
      +   '<div class="rc-icon-badge">' + iconFor(t) + '</div></div>'
      + '<div class="rc-info">'
      +   '<div class="rc-name">' + esc(fig) + '</div>'
      +   '<div class="rc-era">' + esc(era) + '</div>'
      +   statBars(codexFor(fig))
      +   '<div class="rc-stats">'
      +     '<span class="rc-stat">' + (n ? n + ' QUESTIONS' : 'QUIZ') + '</span>'
      +     '<span class="rc-stat">BIO REWARD</span>'
      +   '</div>'
      + '</div>'
      + '<div class="rc-cta">\u25B6 START QUIZ</div></div>';
  }

  function render(host, list) {
    /* Figures that already have a card in the arena lead; the rest follow in
       library order. Nothing is hidden — every quiz gets a door. */
    var FIRST = ['lincoln-emancipation', 'musashi-ganryu', 'caesar-rubicon',
                 'gandhi-salt', 'moses-calf', 'hannibal-cannae'];
    var head = [], tail = [];
    list.forEach(function (t) { (FIRST.indexOf(t.id) === -1 ? tail : head).push(t); });
    head.sort(function (a, b) { return FIRST.indexOf(a.id) - FIRST.indexOf(b.id); });
    host.innerHTML = head.concat(tail).map(card).join('');
    /* The grid carries .reveal-stagger, whose children sit at opacity:0 until the
       parent gains .in from a scroll observer. An EMPTY grid has no height, so
       that observer may never fire and the cards would never appear. We do not
       depend on it: having rendered, we reveal our own host. */
    host.classList.add('in');
    /* Draw the faces from the art library — twelve of the current figures have
       one. Retried, because the character list rebuilds asynchronously. */
    paintPortraits(host, 0);
    try { if (window.amentiQuiz && window.amentiQuiz.wireRoster) window.amentiQuiz.wireRoster(); } catch (e) {}
    host.setAttribute('data-count', head.length + tail.length);
  }

  function empty(host, msg) {
    host.classList.add('in');
    host.innerHTML = '<div class="roster-empty" style="grid-column:1/-1;border:1px solid #3a3a52;'
      + 'border-radius:8px;padding:26px;text-align:center;color:#8f95ab">'
      + '<div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#f87171">Library unreachable</div>'
      + '<div style="margin-top:8px;font-size:15px">' + esc(msg) + '</div>'
      + '<div style="margin-top:6px;font-size:13px;opacity:.7">The arena shows what is real or it shows nothing.</div></div>';
  }

  /* Injected here rather than added to Page1, so the roster stays one file. */
  function injectCss() {
    if (document.getElementById('amenti-roster-css')) return;
    var st = document.createElement('style');
    st.id = 'amenti-roster-css';
    st.textContent =
      '.rc-attrs{margin:7px 0 2px;display:flex;flex-direction:column;gap:3px}'
    + '.rc-attr{display:grid;grid-template-columns:26px 1fr 22px;align-items:center;gap:6px}'
    + '.rc-attr-k{font-family:var(--mono,monospace);font-size:8px;letter-spacing:.1em;color:#6b7180}'
    + '.rc-attr-v{font-family:var(--mono,monospace);font-size:8.5px;color:#8f95ab;text-align:right}'
    + '.rc-attr-bar{position:relative;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}'
    + '.rc-attr-bar > i{position:absolute;left:0;top:0;bottom:0;display:block;'
    +   'background:linear-gradient(90deg,#8a6510,#d4a017);border-radius:2px}';
    document.head.appendChild(st);
  }

  function boot() {
    injectCss();
    var host = document.getElementById('amenti-roster');
    if (!host) return;
    fetch(MINT + '/quiz/topics')
      .then(function (r) { return r.ok ? r.json() : Promise.reject('http ' + r.status); })
      .then(function (d) {
        var list = (d && d.topics) || [];
        if (!list.length) return empty(host, 'The library returned no quizzes.');
        render(host, list);
      })
      .catch(function (e) { empty(host, 'Could not read the quiz library. ' + esc(e)); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.amentiRoster = { refresh: boot };
})();
