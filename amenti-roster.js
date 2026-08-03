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

   REQUIRED, AND IT MUST LOAD FIRST:  amenti-resolve.js
     This file no longer decides for itself whether two names are the same
     person. It asks the resolver. Load order is
         config.js -> csv-loader -> amenti-resolve.js -> amenti-roster.js
     so the ledger is in AMENTI_CHARS before the resolver builds its index.
     If the resolver is absent, cards render with a badge and no stat bars
     rather than with a guess. See codexFor below.
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

  /* ── THE ATTRIBUTES ───────────────────────────────────────────────────
     window.AMENTI_CHARS holds a codex record per character: a bio, abilities,
     a voice, and four scores — strategy, charisma, foresight, combat. Some of
     the quiz figures have one; the rest do not, and NOTHING IS INVENTED for
     them. A card with no record simply carries no bars.

     WHAT USED TO BE HERE, AND WHY IT IS GONE

     This file carried its own matcher. It resolved a figure by LAST NAME, and
     failing that by CONTAINMENT either way. It was written to be strict — the
     comment said so, and named the Marcus Manlius / Marcus Aurelius trap it
     was meant to prevent. It did prevent that one. It caused seventeen others.

     Measured on the live page, against every person in the roster:
       191 of 319 people sharing a surname resolved to the WRONG human.
       Pope Clement VII      -> cleopatra        (matched on the numeral VII)
       Lao Tzu               -> sun-tzu          (matched on "tzu")
       Indira Gandhi         -> gandhi           (Mohandas)
       Augustus Caesar       -> caesar           (Julius)
       Marshall McLuhan      -> mars             (contained "Mars")
       Alexander the Great   -> constantine-the-great
       Catherine the Great   -> constantine-the-great   ...and five more Greats
       Enkidu                -> enki
       Jupiter               -> diana-daughter-of-jupiter

     Every one was confident, plausible, and wrong, and the arena looked
     perfectly well the entire time. A matcher that GUESSES will eventually
     hand a card another person's face and another person's stat line.

     So the question "are these the same person?" is no longer answered here.
     It is answered once, in amenti-resolve.js, by exact match against a table
     of names and aliases — or not answered at all. An unknown figure returns
     null and the card shows its badge, which is the honest outcome.

     THE FUNCTION KEEPS ITS NAME so that every call site below is unchanged. */
  function codexFor(figure) {
    var R = window.AmentiResolve;
    if (!R) {
      /* The arena shows what is real or it shows nothing. Rather than fall
         back to the matcher that was just removed, say so once and render
         badges. A missing script is a deploy problem and should look like one. */
      if (!codexFor._warned) {
        codexFor._warned = true;
        try {
          console.warn('[Amenti] amenti-resolve.js is not loaded — cards will '
            + 'render without portraits or stat bars. Load it BEFORE amenti-roster.js.');
        } catch (e) {}
      }
      return null;
    }
    return R.record(figure);
  }

  /* ── THE GATES · the marks on a card ──────────────────────────────────
     Four emerald hearts for questions answered correctly, two quills for
     cases filed. Six slots, two kinds of mark, and the gate opens when all
     six are struck.

     They are two kinds because a six-question quiz is only FOUR auto-scored;
     the two philosophical questions are never marked right or wrong, they are
     filed to the docket. Calling all six hearts would claim the cases had been
     marked correct, and nothing marks them at all.

     A SIGNED-OUT VISITOR SEES THE SLOTS, HOLLOW. Hiding them would make the
     arena look emptier to a stranger than to the captain — and the stranger is
     the one being persuaded. An empty set of slots is an invitation; nothing
     at all is just a card. */
  var PROGRESS = null;      // topic -> { hearts, heartsOf, quills, quillsOf, gateOpen }
  var SIGNED_IN = false;

  /* THE MARKS.
     Two faults in the first version, both worth recording.

     The SVGs carried no width or height — only a CSS class, and the CSS never
     injected because the rule I tried to append to begins the string rather
     than continuing it. An unsized inline SVG defaults to roughly 300x150, so
     the cards showed enormous hearts. The size is now ON THE ELEMENT: a style
     attribute cannot fail to load.

     And the heart was the wrong object. The ship's token is not a green heart —
     it is a FACETED emerald with red at its core, the same jewel that sits on
     the scale in the weighing hall and at Ingram's throat. Eighteen light
     emerald facets, fourteen deep, and eight of salmon where the red shows
     through. Drawn small, but drawn as itself. */
  var MARK_PX = 12;

  function markSvg(inner) {
    return '<svg class="rc-mark" viewBox="0 0 24 26" width="' + MARK_PX + '" height="'
      + Math.round(MARK_PX * 26 / 24) + '" style="width:' + MARK_PX + 'px;height:'
      + Math.round(MARK_PX * 26 / 24) + 'px;display:block;flex:0 0 auto;background:none;overflow:visible" '
      + 'aria-hidden="true">' + inner + '</svg>';
  }

  function heartMark(filled) {
    if (!filled) {
      return markSvg(
        '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
        + ' fill="none" stroke="#39434f" stroke-width="1.4" stroke-dasharray="2 2.4"/>');
    }
    /* the token, faceted — deep emerald body, light emerald crown, red core */
    return markSvg(
        '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
      +   ' fill="#0c4a2e" stroke="#d4a017" stroke-width="1.1" stroke-linejoin="round"/>'
      + '<path d="M12 7 C11 4.5 8 3 5 6 L12 11 Z" fill="#57c98a"/>'
      + '<path d="M12 7 C13 4.5 16 3 19 6 L12 11 Z" fill="#4ab77c"/>'
      + '<path d="M5 6 C1 10 3 16 12 24 L12 11 Z" fill="#0f5c39"/>'
      + '<path d="M19 6 C23 10 21 16 12 24 L12 11 Z" fill="#0a4128"/>'
      + '<path d="M12 11 L16 15 L12 20 L8 15 Z" fill="#e0563a"/>'
      + '<path d="M12 11 L16 15 L12 20 Z" fill="#f2896a"/>'
      + '<path d="M12 13.5 L14 15 L12 17.5 L10 15 Z" fill="#6e140f" opacity=".55"/>');
  }

  function quillMark(filled) {
    if (!filled) {
      return markSvg(
        '<path d="M19 4 C12 6 7 11 5 18 C10 16 15 12 18 8"'
        + ' fill="none" stroke="#39434f" stroke-width="1.4" stroke-dasharray="2 2.4"/>'
        + '<path d="M5 18 L3 23" stroke="#39434f" stroke-width="1.3" stroke-linecap="round" fill="none"/>');
    }
    return markSvg(
        '<path d="M19 4 C12 6 7 11 5 18 C10 16 15 12 18 8 Z" fill="#c4a5ff" fill-opacity=".22"'
      +   ' stroke="#c4a5ff" stroke-width="1.3" stroke-linejoin="round"/>'
      + '<path d="M17 6 C12 9 8.5 13 6.6 17.4" stroke="#c4a5ff" stroke-width=".8" fill="none" opacity=".7"/>'
      + '<path d="M5 18 L3 23" stroke="#c4a5ff" stroke-width="1.4" stroke-linecap="round" fill="none"/>');
  }

  function marksFor(topicId, questionCount) {
    var p = PROGRESS && PROGRESS[topicId];
    /* slot counts come from the quiz when we know them, and from a sensible
       reading of the question count when we do not — never from an assumption
       that every quiz has six. */
    var hOf = p ? p.heartsOf : Math.max(0, (questionCount || 0) - 2);
    var wOf = p ? p.quillsOf : (questionCount >= 6 ? 2 : 0);
    if (!hOf && !wOf) return '';
    var h = p ? p.hearts.length : 0;
    var w = p ? p.quills.length : 0;
    var out = '';
    for (var i = 0; i < hOf; i++) out += heartMark(i < h);
    for (var j = 0; j < wOf; j++) out += quillMark(j < w);
    var cls = 'rc-marks' + (p && p.gateOpen ? ' open' : '') + (SIGNED_IN ? '' : ' out');
    var note = !SIGNED_IN ? 'sign in to begin'
             : (p && p.gateOpen ? 'gate open' : (h + w) + ' of ' + (hOf + wOf));
    return '<div class="' + cls + '">' + out + '<span class="rc-marks-n">' + note + '</span></div>';
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

     The library is window.AMENTI_SVG: hand-drawn character SVGs keyed by codex
     key (lincoln, musashi, sun-tzu, marcus-aurelius, akhenaten ...). So the
     card asks the library directly rather than borrowing from the carousel.

     Figures with no drawing keep the gradient panel and their badge. Nothing
     is substituted — a stand-in face would be a lie about who this is. And
     since codexFor is now exact, a face can no longer be borrowed by accident:
     before the resolver, asking for Augustus Caesar returned Julius, and the
     card would have worn the wrong man's portrait. */
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
     from the roster CSV, so the library may not be ready on the first pass.
     The resolver rebuilds with it — see the retry note in amenti-resolve.js. */
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

  /* ── THE STACK · one card per FIGURE, several gates behind it ──────────
     The roster used to build a card per quiz. The moment a figure held two,
     the arena showed the same man twice — same face, same stat line, standing
     beside himself. Caesar has two now: the Rubicon at depth 1 and the
     disputed last words at depth 3.

     So a card takes a LIST. The face, era and stat bars belong to the figure
     and never varied across a stack anyway. What changes is beneath them: a
     row per gate, each with its own marks and its own state.

     LOCKED GATES ARE SHOWN, NEVER HIDDEN. A seeker should be able to see that
     Caesar holds a second charge before they have earned the right to open it.
     That is the invitation. A hidden gate persuades nobody. */

  var DEPTH_NAME = { 1: 'the entry', 2: 'another charge', 3: 'the contested' };

  function deriveLabel(title, figure) {
    var t = String(title || '').trim();
    var f = String(figure || '').trim();
    t = t.replace(/^the\s+/i, '');
    if (f) {
      var esc2 = function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
      var parts = f.split(/\s+/);
      /* whole name, then LAST word, then FIRST — Frederick Douglass is titled
         "Douglass", Galileo Galilei is titled "Galileo". Both must strip. */
      [f, parts[parts.length - 1], parts[0]].forEach(function (cand) {
        if (cand && cand.length > 2)
          t = t.replace(new RegExp('^' + esc2(cand) + '\\b', 'i'), '');
      });
    }
    t = t.replace(/^\s*(and|at|on|in|before|against|of|with)\s+/i, '');
    t = t.split(':')[0].trim();
    return t || String(title || '');
  }

  function gateRow(t, state) {
    var p = PROGRESS && PROGRESS[t.id];
    var hOf = p ? p.heartsOf : Math.max(0, (t.questions || 0) - 2);
    var wOf = p ? p.quillsOf : ((t.questions || 0) >= 6 ? 2 : 0);
    var h = p ? p.hearts.length : 0;
    var w = p ? p.quills.length : 0;
    var marks = '';
    for (var i = 0; i < hOf; i++) marks += heartMark(i < h);
    for (var j = 0; j < wOf; j++) marks += quillMark(j < w);
    /* THE ROW NAMES THE MOMENT, NOT THE QUIZ.
       A card already says "JULIUS CAESAR" above the portrait. A row that
       repeats it and adds the title reads as a duplicate; a row that says
       "the Rubicon" and "the last words" reads as a stack.

       The engine now writes a label. Fifty-four quizzes predate it, so one is
       derived — and the derivation is only sound because it knows the FIGURE.
       The first attempt did not: it stripped a leading "and|at|the" from the
       title and turned "the War of the Currents" into "Currents", left
       "Tesla on Brush Discharge" untouched, and carried a colon subtitle
       across the whole row. */
    var label = t.label || deriveLabel(t.title || t.id, t.figure);
    /* THE ESSENTIALS ARE INLINE, NOT ONLY IN THE STYLESHEET.
       A <button> with no CSS gets the browser's default chrome — light grey,
       raised, system font. Several per card and the whole arena washes white,
       which is exactly what happened when the stylesheet failed to inject.

       A card must never depend on a stylesheet arriving to avoid looking
       broken. The class still carries hover, transitions and the state colours;
       these four properties carry the difference between a dark card and a
       page full of grey boxes. */
    var base = 'background:#0a0b11;border:1px solid ' +
      (state === 'passed' ? '#2f6b4c' : state === 'current' ? '#8a6510' : '#232838') +
      ';color:#8f95ab;font-family:inherit';
    return '<button class="rc-gate ' + state + '" data-topic="' + esc(t.id) + '"'
         + ' style="' + base + '"'
         + (state === 'locked' ? ' disabled' : '')
         + ' title="' + esc(t.title || t.id) + '">'
         +   '<span class="rc-gate-d">d' + (t.depth || 1) + '</span>'
         +   '<span class="rc-gate-m">' + marks + '</span>'
         +   '<span class="rc-gate-t">' + esc(label) + '</span>'
         +   '<span class="rc-gate-s">'
         +     (state === 'passed' ? 'passed' : state === 'locked' ? 'locked'
                : (h + w) + '/' + (hOf + wOf))
         +   '</span>'
         + '</button>';
  }

  /* ONE LINE INSTEAD OF SEVEN ROWS.
     It carries the same three facts the rows carried — how many gates, how
     many are passed, and whether there is anything to do — without growing
     with the stack. A figure with twelve quizzes takes exactly the same space
     as a figure with one. */
  function gateSummary(stack) {
    var passed = 0, marks = 0, slots = 0;
    stack.forEach(function (t) {
      var p = PROGRESS && PROGRESS[t.id];
      if (p) {
        if (p.gateOpen) passed++;
        marks += p.hearts.length + p.quills.length;
        slots += p.heartsOf + p.quillsOf;
      } else {
        slots += (t.questions || 0);
      }
    });
    var n = stack.length;
    var pct = slots ? Math.round(marks / slots * 100) : 0;
    var word = passed === n && n > 0 ? 'all weighed'
             : passed ? passed + ' of ' + n + ' passed'
             : (n > 1 ? n + ' charges' : 'not yet weighed');
    return '<div class="rc-sum" style="display:flex;align-items:center;gap:7px;margin:7px 0 5px">'
      +   '<span class="rc-sum-bar" style="flex:1;height:3px;border-radius:2px;background:#161c27;'
      +     'overflow:hidden"><i style="display:block;height:100%;width:' + pct + '%;'
      +     'background:linear-gradient(90deg,#2f6b4c,#57c98a)"></i></span>'
      +   '<span class="rc-sum-n" style="font-family:var(--mono,monospace);font-size:8px;'
      +     'letter-spacing:.1em;text-transform:uppercase;color:'
      +     (passed === n && n > 0 ? '#57c98a' : '#6b7180') + '">' + word + '</span>'
      + '</div>';
  }

  function card(stack) {
    /* the shallowest quiz speaks for the figure: its era, its icon, its face */
    var lead = stack[0];
    var fig  = lead.figure || (lead.facets && lead.facets.figure && lead.facets.figure[0]) || lead.title;
    var era  = lead.era || ((lead.facets && lead.facets.era && lead.facets.era[0]) || '');
    var rec  = codexFor(fig);

    /* a gate opens when the one before it does. The first is always open. */
    var rows = '', firstOpen = null, opened = true;
    stack.forEach(function (t, i) {
      var p = PROGRESS && PROGRESS[t.id];
      var passed = !!(p && p.gateOpen);
      var state = passed ? 'passed' : (opened ? 'current' : 'locked');
      if (state === 'current' && !firstOpen) firstOpen = t.id;
      rows += gateRow(t, state);
      /* the next gate is reachable only once this one is complete */
      if (!passed) opened = false;
    });
    var cta = firstOpen ? firstOpen : stack[0].id;

    return '<div class="roster-card"'
      + (rec && rec.id !== undefined ? ' data-char="' + rec.id + '"' : '')
      + (rec && rec.key ? ' data-char-key="' + esc(rec.key) + '"' : '')
      + ' data-figure="' + esc(fig) + '"'
      + ' data-topic="' + esc(cta) + '">'
      + '<div class="rc-prize">EARN \u25C8</div>'
      + '<div class="rc-img"><div class="rc-img-grid"></div>'
      +   '<div class="rc-icon-badge">' + iconFor(lead) + '</div></div>'
      + '<div class="rc-info">'
      +   '<div class="rc-name">' + esc(fig) + '</div>'
      +   '<div class="rc-era">' + esc(era) + '</div>'
      +   statBars(rec)
      /* THE CARD STAYS A CARD.
         Gate rows lived here and were right when a figure held two. At five
         they are two hundred pixels of list on a tile that was two hundred
         tall, and the arena becomes a column of cards at wildly different
         heights — the one thing a grid cannot survive.

         So the depth moves off the card and into a bay behind it. What stays
         is the COUNT, which is what a seeker needs to know before deciding to
         open anything: how much of this life is here. */
      +   gateSummary(stack)
      +   '<div class="rc-stats"><span class="rc-stat">'
      +     (stack.length > 1
              ? stack.length + ' GATES'
              : ((lead.questions || 0) ? lead.questions + ' QUESTIONS' : 'QUIZ'))
      +   '</span><span class="rc-stat">BIO REWARD</span></div>'
      + '</div>'
      + '<div class="rc-cta">\u25B6 '
      +   (stack.length > 1 ? 'OPEN THE BAY' : (firstOpen ? 'START QUIZ' : 'REVIEW'))
      + '</div></div>';
  }

  function render(host, list) {
    /* GROUP BY FIGURE. This is the change: the list arrives as one entry per
       quiz, and leaves as one entry per person. Without it Caesar appears
       twice — the Rubicon and the last words, side by side, identical faces.

       STILL KEYED BY THE FIGURE STRING, DELIBERATELY. Grouping through the
       resolver would be more robust — two spellings of one man would collapse
       into one card — but window.AMENTI_STACKS is published from here and the
       bay reads it by figure name. Changing the key shape is a separate move
       with its own probe run. Measured today: 53 figure strings resolve to 53
       distinct people, so nothing is currently split. */
    var byFigure = {}, order = [];
    list.forEach(function (t) {
      var f = t.figure || (t.facets && t.facets.figure && t.facets.figure[0]) || t.title;
      if (!byFigure[f]) { byFigure[f] = []; order.push(f); }
      byFigure[f].push(t);
    });
    /* within a figure, shallow first — the entry before the contested */
    order.forEach(function (f) {
      byFigure[f].sort(function (a, b) {
        return (a.depth || 1) - (b.depth || 1) || String(a.id).localeCompare(String(b.id));
      });
    });

    /* the six that had hand-built cards still lead the arena */
    var FIRST = ['Abraham Lincoln', 'Miyamoto Musashi', 'Julius Caesar',
                 'Mahatma Gandhi', 'Moses', 'Hannibal Barca'];
    var head = [], tail = [];
    order.forEach(function (f) { (FIRST.indexOf(f) === -1 ? tail : head).push(f); });
    head.sort(function (a, b) { return FIRST.indexOf(a) - FIRST.indexOf(b); });

    host.innerHTML = head.concat(tail).map(function (f) { return card(byFigure[f]); }).join('');
    host.classList.add('in');
    paintPortraits(host, 0);
    try { if (window.amentiQuiz && window.amentiQuiz.wireRoster) window.amentiQuiz.wireRoster(); } catch (e) {}

    /* a gate button opens ITS quiz, not the card's default */
    Array.prototype.forEach.call(host.querySelectorAll('.rc-gate[data-topic]'), function (b) {
      b.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var id = b.getAttribute('data-topic');
        try { if (window.amentiQuiz && window.amentiQuiz.open) window.amentiQuiz.open(id); } catch (e) {}
      });
    });

    host.setAttribute('data-count', order.length);
    host.setAttribute('data-quizzes', list.length);

    /* THE BAY READS FROM HERE.
       The roster has already done the grouping, the depth ordering and the
       progress lookup. A second surface that re-derived any of that would be a
       second source of truth for the same fact — the fault this build keeps
       finding. It gets the same objects. */
    window.AMENTI_STACKS = byFigure;
    window.AMENTI_PROGRESS = PROGRESS;
    try { document.dispatchEvent(new CustomEvent('amenti:stacks')); } catch (e) {}
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
      '.rc-gates{display:flex;flex-direction:column;gap:3px;margin:7px 0 5px}'
    + '.rc-gate{display:grid;grid-template-columns:15px auto 1fr auto;align-items:center;gap:6px;'
    +   'background:#0a0b11;border:1px solid #232838;border-radius:4px;padding:4px 7px;'
    +   'cursor:pointer;text-align:left;font-family:inherit;width:100%;transition:.15s}'
    + '.rc-gate:hover:not(:disabled){border-color:#d4a017;background:#12141d}'
    + '.rc-gate:disabled{cursor:default;opacity:.4}'
    + '.rc-gate.passed{border-color:#2f6b4c}'
    + '.rc-gate.current{border-color:#8a6510}'
    + '.rc-gate-d{font-family:var(--mono,monospace);font-size:7.5px;color:#6b7180}'
    + '.rc-gate-m{display:flex;gap:2px;align-items:center;line-height:0}'
    + '.rc-gate-t{font-size:10.5px;color:#8f95ab;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.rc-gate.current .rc-gate-t{color:#c8ccdc}'
    + '.rc-gate-s{font-family:var(--mono,monospace);font-size:7.5px;letter-spacing:.06em;'
    +   'text-transform:uppercase;color:#6b7180}'
    + '.rc-gate.passed .rc-gate-s{color:#57c98a}'
    + '.rc-gate.current .rc-gate-s{color:#f5c542}'
    + '.rc-mark{display:block;flex:0 0 auto;background:none}'
    + '.rc-marks{display:flex;align-items:center;gap:2px;margin:7px 0 4px;flex-wrap:wrap;line-height:0}'
    + '.rc-marks.out{opacity:.45}'
    + '.rc-marks-n{font-family:var(--mono,monospace);font-size:7.5px;letter-spacing:.1em;'
    +   'text-transform:uppercase;color:#6b7180;margin-left:5px;line-height:1}'
    + '.rc-marks.open .rc-marks-n{color:#57c98a}'
    + '.rc-attrs{margin:7px 0 2px;display:flex;flex-direction:column;gap:3px}'
    + '.rc-attr{display:grid;grid-template-columns:26px 1fr 22px;align-items:center;gap:6px}'
    + '.rc-attr-k{font-family:var(--mono,monospace);font-size:8px;letter-spacing:.1em;color:#6b7180}'
    + '.rc-attr-v{font-family:var(--mono,monospace);font-size:8.5px;color:#8f95ab;text-align:right}'
    + '.rc-attr-bar{position:relative;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}'
    + '.rc-attr-bar > i{position:absolute;left:0;top:0;bottom:0;display:block;'
    +   'background:linear-gradient(90deg,#8a6510,#d4a017);border-radius:2px}';
    document.head.appendChild(st);
  }

  /* the seeker's own marks. Read-only, and it fails quietly: a card with no
     progress is a card with hollow slots, which is exactly what a new seeker
     should see anyway. */
  async function loadProgress() {
    try {
      var a = window.amentiAuth;
      if (!a || !a.sb) return;
      var res = await a.sb.auth.getSession();
      var token = res && res.data && res.data.session ? res.data.session.access_token : null;
      if (!token) return;
      SIGNED_IN = true;
      var r = await fetch(MINT + '/quiz/progress', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) return;
      var d = await r.json();
      if (d && d.ok && d.progress) PROGRESS = d.progress;
    } catch (e) { /* hollow slots are a correct answer to not knowing */ }
  }

  /* ── THE THIRD SOURCE ─────────────────────────────────────────────────
     Page1 built AMENTI_CHARS and AMENTI_SVG by hand. amenti-art-2.js already
     merges twelve more portraits into the same library at runtime, and nothing
     downstream cares which file a face came from.

     This is a third file that happens to arrive over the network.

     THE HAND-MADE ONE ALWAYS WINS. A row whose key already exists is IGNORED,
     not applied — no configuration, no precedence rules, no flag. It was made
     deliberately; this was not.

     And it fails to nothing. If the endpoint is unreachable the arena is
     exactly what it is today, which is why this could be added without putting
     a single existing card at risk. */
  async function mergeCharacters() {
    let rows = [];
    try {
      const r = await fetch(MINT + '/characters', { cache: 'no-store' });
      if (!r.ok) return 0;
      const d = await r.json();
      if (!d || !d.ok || !Array.isArray(d.characters)) return 0;
      rows = d.characters;
    } catch (e) { return 0; }
    if (!rows.length) return 0;

    const chars = window.AMENTI_CHARS = window.AMENTI_CHARS || [];
    const art   = window.AMENTI_SVG   = window.AMENTI_SVG   || {};

    /* THE COLLISION TEST IS NOW THE RESOLVER, AND THAT IS A REAL FIX.
       Three earlier attempts were wrong. Comparing KEYS missed it, because the
       hand-made records use shortened keys — 'caesar' against 'julius-caesar'.
       Comparing NAMES exactly missed it too, because the hand-made names are
       full forms: "GAIUS JULIUS CAESAR" against a queue that says "Julius
       Caesar". The third was codexFor's surname match, which caught those but
       ALSO reported a clash that did not exist: an engine sheet for AUGUSTUS
       Caesar was discarded as a duplicate of JULIUS, and a researched
       character was thrown away with the tokens that paid for it.

       The resolver answers exactly. Julius resolves to the hand-made record
       and is correctly skipped; Augustus resolves to himself and is correctly
       added. */
    let added = 0, skipped = 0;

    rows.forEach(function (row) {
      if (!row || !row.key) return;

      /* THE COLLISION IS WITH A CHARACTER, NOT WITH A NAME.
         A thin ledger row of the same name is not a clash — it is a name on a
         list. Only a RICH record means the person is already held. */
      var existing = codexFor(row.name) || codexFor(row.figure || row.name);
      var clash = existing && (existing.rich || existing.stats);
      if (row.sheet && !clash) {
        const rec = Object.assign({ key: row.key, name: row.name }, row.sheet);
        rec.rich = true;          /* it is a character, not a name on a list */
        rec.id = chars.length;
        chars.push(rec);      // pushed BEFORE the next row is tested, so two
        added++;              // rows for the same person cannot both land
      } else if (row.sheet) { skipped++; }

      /* the portrait — same rule, and the art library is the arbiter */
      if (row.portrait && !art[row.key]) {
        const svg = row.portrait;
        art[row.key] = function () { return svg; };
      }
    });
    /* the roster grew, so the resolver's index is stale — rebuild it before
       the first card asks a question of it */
    if (added) {
      try { window.AMENTI_CHARS = chars; } catch (e) {}
      try { if (window.AmentiResolve) window.AmentiResolve.build(chars); } catch (e) {}
    }
    return added;
  }

  /* ── RE-KEY · THE LEDGER LANDS AFTER THE CARDS ─────────────────────────
     A card gets data-char-key only if codexFor() answered at BUILD time:

         (rec && rec.key ? ' data-char-key="' + esc(rec.key) + '"' : '')

     boot() already rebuilds the resolver at the top of its .then() so the
     index is fresh before render(). That is not enough. The csv-loader in
     Page1.html fetches a 517 KB ledger and replaces AMENTI_CHARS wholesale
     when it lands, which can be after the cards are already in the DOM. Those
     cards keep an empty key forever, because nothing re-renders them.

     Measured on the live page: the resolver answers PERFECTLY afterwards —
     resolve("Isaac Newton") -> isaac-newton, record.key -> isaac-newton,
     zero collisions — while the card still carries no key. All sixteen blank
     cards were ledger-only figures. Newton's two plates sit in img/ unused
     for want of one attribute, as do Josephus's and Shaka's.

     So: watch for the roster growing, rebuild the index, and fill in the
     attribute on cards that are still missing it. Attribute-only. No
     re-render, and cards that already resolved are never touched.

     paintPortraits solves the same race with six retries and says so in its
     own comment. This is that guard, for the key rather than the drawing. */
  function rekey(tries) {
    tries = tries || 0;
    var pending = document.querySelectorAll('.roster-card[data-figure]:not([data-char-key])');
    if (!pending.length) return;

    /* AMENTI_CHARS may have been REPLACED since the index was built, so
       rebuild before asking it anything. Cheap and idempotent. */
    var n = (window.AMENTI_CHARS || []).length;
    if (n !== rekey._seen) {
      rekey._seen = n;
      try { if (window.AmentiResolve) window.AmentiResolve.build(); } catch (e) {}
    }

    var fixed = 0;
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      var rec = codexFor(el.getAttribute('data-figure'));
      if (rec && rec.key) { el.setAttribute('data-char-key', rec.key); fixed++; }
    }

    if (fixed) {
      /* amenti-art-photo observes childList only, so an attribute write does
         not wake it. Ask it directly, or the plate never lands. */
      try { if (window.AmentiArtPhoto) window.AmentiArtPhoto.pass(); } catch (e) {}
      try { paintPortraits(document.getElementById('amenti-roster') || document, 0); } catch (e) {}
      try { console.log('[Amenti] re-keyed ' + fixed + ' card(s) after the ledger landed'); } catch (e) {}
    }

    /* Keep looking while cards remain unkeyed. 1.2s x 20 = 24s, which covers
       a slow fetch of the ledger without polling forever. A figure that is
       genuinely not in the roster simply stays unkeyed and shows its badge —
       the honest outcome, same as codexFor's own contract. */
    if (tries < 20) setTimeout(function () { rekey(tries + 1); }, 1200);
  }
  rekey._seen = -1;

  function boot() {
    injectCss();
    var host = document.getElementById('amenti-roster');
    if (!host) return;
    Promise.all([
      fetch(MINT + '/quiz/topics').then(function (r) { return r.ok ? r.json() : Promise.reject('http ' + r.status); }),
      loadProgress(),
      /* the third source, merged before the first card is drawn so a machine-made
         figure arrives with its face and its bars rather than acquiring them a
         moment later */
      mergeCharacters()
    ])
      .then(function (both) { return both[0]; })
      .then(function (d) {
        /* the ledger may have landed after the resolver built its index — the
           csv-loader replaces AMENTI_CHARS wholesale on arrival. Rebuild once
           here so every card resolves against the full roster. */
        try { if (window.AmentiResolve) window.AmentiResolve.build(); } catch (e) {}
        var list = (d && d.topics) || [];
        if (!list.length) return empty(host, 'The library returned no quizzes.');
        render(host, list);
        rekey(0);   /* the ledger may still be in flight — see rekey() above */
      })
      .catch(function (e) { empty(host, 'Could not read the quiz library. ' + esc(e)); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.amentiRoster = { refresh: boot };
})();
