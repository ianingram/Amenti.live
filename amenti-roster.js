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

  /* Where a figure also exists as a summonable character, keep the index so the
     voice and chat systems still recognise the card. Absent is fine. */
  function charIndexFor(figure) {
    var chars = window.AMENTI_CHARS;
    if (!Array.isArray(chars)) return null;
    for (var i = 0; i < chars.length; i++) {
      var n = chars[i] && (chars[i].name || chars[i].fullName);
      if (n && String(n).toLowerCase() === String(figure).toLowerCase()) return i;
    }
    return null;
  }

  function card(t) {
    var fig = (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
    var era = t.era || ((t.facets && t.facets.era && t.facets.era[0]) || '');
    var n = t.questions || 0;
    var ci = charIndexFor(fig);
    return '<div class="roster-card"'
      + (ci !== null ? ' data-char="' + ci + '"' : '')
      + ' data-topic="' + esc(t.id) + '">'
      + '<div class="rc-prize">EARN \u25C8</div>'
      + '<div class="rc-img"><div class="rc-img-grid"></div>'
      +   '<div class="rc-icon-badge">' + iconFor(t) + '</div></div>'
      + '<div class="rc-info">'
      +   '<div class="rc-name">' + esc(fig) + '</div>'
      +   '<div class="rc-era">' + esc(era) + '</div>'
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
    try { if (window.amentiQuiz && window.amentiQuiz.wireRoster) window.amentiQuiz.wireRoster(); } catch (e) {}
    host.setAttribute('data-count', head.length + tail.length);
  }

  function empty(host, msg) {
    host.innerHTML = '<div class="roster-empty" style="grid-column:1/-1;border:1px solid #3a3a52;'
      + 'border-radius:8px;padding:26px;text-align:center;color:#8f95ab">'
      + '<div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#f87171">Library unreachable</div>'
      + '<div style="margin-top:8px;font-size:15px">' + esc(msg) + '</div>'
      + '<div style="margin-top:6px;font-size:13px;opacity:.7">The arena shows what is real or it shows nothing.</div></div>';
  }

  function boot() {
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
