/* ============================================================================
   amenti-guide.js  →  Amenti.live/amenti-guide.js
   ----------------------------------------------------------------------------
   A DOOR TO THE MANUAL, BOTTOM RIGHT.

   AMENTI-HOW-TO-USE-IT.html explains the hall and the ground to a visitor \u2014
   what a pin means, what a wash means, why some places are held and not drawn,
   what the temporal toggle does, and which of the sentences are drafts.

   IT IS A REAL PAGE AND THIS IS A REAL LINK. No overlay, no model, no cost. It
   opens in a new tab so a reader who was mid-question does not lose it.

   ── AND IT SITS BESIDE THE METER, WHICH IS A DIFFERENT KIND OF THING ─────
   The meter reports what an answer cost. This points at a document. They are
   neighbours because both are small, quiet and about how the place works \u2014 but
   THEY ARE FOR DIFFERENT QUESTIONS and neither should be mistaken for the
   other.

   ── IT CHECKS THE DOOR BEFORE IT OFFERS IT ───────────────────────────────
   A link to a page that is not there is worse than no link: it reads as the
   ship being broken rather than the file being absent. This asks for the
   manual once, quietly, and MOUNTS NOTHING IF IT IS MISSING. Nobody is told
   about a door that does not open.
   ========================================================================== */
(function () {
  'use strict';

  var DOC = 'AMENTI-HOW-TO-USE-IT.html';
  var tab = null;

  function style() {
    if (document.getElementById('guide-css')) { return; }
    var s = document.createElement('style');
    s.id = 'guide-css';
    s.textContent = [
      /* left of the meter, same line, same weight — the meter reserves the
         right edge and this must not land on top of it. Measured at mount
         rather than offset by a guess. */
      '#amenti-guide{position:fixed;bottom:14px;z-index:9998;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace}',
      '#amenti-guide a{display:block;background:rgba(5,8,14,.86);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:3px;padding:3px 9px;',
      '  color:#5d6e84;text-decoration:none;letter-spacing:.05em}',
      '#amenti-guide a:hover{color:#dbe8f5;border-color:#4b647d}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* THE METER OWNS THE RIGHT EDGE. Its width is not a constant here \u2014 it is
     read off the element, because a number typed in this file would be right
     until the day the meter's tab text changes, and the two would overlap with
     nothing to say why. */
  function place() {
    if (!tab) { return; }
    var m = document.getElementById('amenti-meter');
    var right = 14;
    if (m) { right = 14 + m.getBoundingClientRect().width + 8; }
    tab.style.right = right + 'px';
  }

  function mount() {
    style();
    tab = document.createElement('div');
    tab.id = 'amenti-guide';
    tab.innerHTML = '<a href="' + DOC + '" target="_blank" rel="noopener" ' +
                    'title="what a pin means, what a wash means, and which of ' +
                    'the sentences here are drafts">how to read this</a>';
    document.body.appendChild(tab);
    place();
    /* the meter's tab grows once an answer has been priced */
    window.addEventListener('resize', place);
    setTimeout(place, 1200);
    setInterval(place, 4000);
  }

  function arrive() {
    if (!document.body) { setTimeout(arrive, 200); return; }
    /* HEAD, not GET: the manual is a page and this only needs to know it is
       there. A missing file mounts nothing and says nothing. */
    fetch(DOC, { method: 'HEAD' })
      .then(function (r) {
        if (r.ok) { mount(); }
        else { console.log('THE GUIDE: ' + DOC + ' is not on this host, so no ' +
                           'link was offered. A door that does not open is ' +
                           'worse than no door.'); }
      })
      .catch(function () { /* offline or blocked \u2014 say nothing, offer nothing */ });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrive);
  } else {
    arrive();
  }

  window.AmentiGuide = {
    doc: function () { return DOC; },
    shown: function () { return !!tab; }
  };
})();
