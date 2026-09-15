/* ============================================================================
   amenti-frame-card.js  →  Amenti.live/amenti-frame-card.js
   ----------------------------------------------------------------------------
   THE FRAME'S OWN PAPERWORK, BEHIND A DOOR.

   Two things were printed across the bottom of the ground, full width, under
   the map and under the register:

     .at-note    THIS IS A REFERENCE FRAME. Its places are harvested from
                 Pleiades and nothing has been authored on it.
     .at-clock   4314 of 7215 places · 4119 pinned · 195 somewhere in an area ·
                 1576 named · 2543 with no room · 594 with no ancient date

   Both are true and both are worth reading ONCE. Neither is worth reading
   over the top of the terrain on every slide of a story, which is what they
   were doing — amber prose running across the Aegean.

   So they move behind a pill, beside the manual and the meter, on the terms
   amenti-guide.js already set: small, quiet, bottom right, and about how the
   place works rather than about the story.

   ── IT READS THE BANDS RATHER THAN RECOMPUTING THEM ──────────────────────
   The census is the ground's own arithmetic and the notice is the ground's
   own judgement of the frame. This asks THOSE ELEMENTS what they say, at the
   moment the card is opened, so there is exactly one place where either
   sentence is decided. A second implementation of the same count would drift
   from the first and nothing would say which was right.

   They are hidden, not removed. `display:none` keeps `textContent` readable,
   so the ground goes on writing them and this goes on quoting them.

   ── AND IT DOES NOT GUESS AT THE RIGHT EDGE ──────────────────────────────
   The meter owns the right edge and the guide sits to ITS left. This sits to
   the left of both, measured off the elements, for the reason amenti-guide.js
   gives: a number typed here would be correct until the day one of them
   changes its text.
   ========================================================================== */
(function () {
  'use strict';

  var tab = null, card = null, open = false;

  function style() {
    if (document.getElementById('frame-card-css')) { return; }
    var s = document.createElement('style');
    s.id = 'frame-card-css';
    s.textContent = [
      /* the bottom band stands down — the ground still writes it, and this
         card still reads it */
      '#amenti-attica .at-note,#amenti-attica .at-clock{display:none}',

      '#amenti-frame-card{position:fixed;bottom:14px;z-index:9998;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace}',
      '#amenti-frame-card button{display:block;background:rgba(5,8,14,.86);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:3px;padding:3px 9px;',
      '  color:#5d6e84;letter-spacing:.05em;font:inherit;cursor:pointer}',
      '#amenti-frame-card button:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-frame-card button[aria-expanded="true"]{color:#e0913f;',
      '  border-color:#7a5a2e}',

      '#amenti-frame-sheet{position:fixed;bottom:44px;z-index:9998;',
      '  width:min(420px,calc(100vw - 40px));max-height:60vh;overflow-y:auto;',
      '  background:rgba(5,8,14,.96);border:1px solid rgba(43,58,80,.75);',
      '  border-radius:4px;padding:15px 17px 14px;display:none;',
      '  font:400 11.5px/1.7 ui-monospace,Menlo,monospace;color:#b8c4d8;',
      '  box-shadow:0 10px 34px rgba(0,0,0,.55)}',
      '#amenti-frame-sheet.on{display:block}',
      '#amenti-frame-sheet h5{margin:0 0 9px;font-weight:400;font-size:9px;',
      '  letter-spacing:.16em;text-transform:uppercase;color:#5d6e84}',
      '#amenti-frame-sheet .nm{color:#e0913f;font-size:13px;line-height:1.35;',
      '  margin-bottom:2px}',
      '#amenti-frame-sheet .sub{color:#8fa0b6;margin-bottom:11px}',
      '#amenti-frame-sheet .warn{color:#e0913f;border-left:2px solid #7a5a2e;',
      '  padding:5px 0 5px 11px;margin:0 0 12px}',
      '#amenti-frame-sheet .cen{color:#8fa0b6;border-top:1px solid #16202e;',
      '  padding-top:10px;margin:0}',
      '#amenti-frame-sheet .none{color:#4d5c70}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* THE METER OWNS THE RIGHT EDGE, THE GUIDE SITS LEFT OF IT, THIS SITS LEFT
     OF BOTH. Every width read off the element, none of them typed here. */
  function place() {
    if (!tab) { return; }
    var right = 14;
    ['amenti-meter', 'amenti-guide'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) {
        var b = e.getBoundingClientRect();
        if (b.width) { right += b.width + 8; }
      }
    });
    tab.style.right = right + 'px';
    if (card) { card.style.right = right + 'px'; }
  }

  function text(sel) {
    var host = document.getElementById('amenti-attica');
    var e = host && host.querySelector(sel);
    var t = e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return t;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* built at OPEN, not at mount: the frame changes under the story and a card
     written once would describe whichever frame happened to be standing when
     the page loaded */
  function fill() {
    var title = text('.at-title');
    var warn = text('.at-note');
    var cen = text('.at-clock');
    var html = '<h5>about this frame</h5>';

    if (title) {
      var bits = title.split('\u00b7');
      html += '<div class="nm">' + esc(bits.shift().trim()) + '</div>';
      if (bits.length) {
        html += '<div class="sub">' + esc(bits.join('\u00b7').trim()) + '</div>';
      }
    }
    if (warn) { html += '<p class="warn">' + esc(warn) + '</p>'; }
    html += cen
      ? '<p class="cen">' + esc(cen) + '</p>'
      : '<p class="cen none">no census for this frame yet.</p>';
    card.innerHTML = html;
  }

  function show(on) {
    open = !!on;
    if (open) { fill(); place(); }
    card.classList.toggle('on', open);
    tab.firstChild.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function mount() {
    style();

    card = document.createElement('div');
    card.id = 'amenti-frame-sheet';
    document.body.appendChild(card);

    tab = document.createElement('div');
    tab.id = 'amenti-frame-card';
    tab.innerHTML = '<button type="button" aria-expanded="false" ' +
      'title="what this frame is, and how much of it has been authored">' +
      'about this frame</button>';
    document.body.appendChild(tab);

    tab.addEventListener('click', function (e) {
      e.stopPropagation();
      show(!open);
    });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { if (open) { show(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { show(false); }
    });

    place();
    window.addEventListener('resize', place);
    /* the meter's tab grows once an answer has been priced, and the guide
       mounts only after its HEAD request returns */
    setTimeout(place, 1200);
    setInterval(place, 4000);
  }

  function arrive() {
    if (!document.body) { setTimeout(arrive, 200); return; }
    /* nothing to offer if the ground is not on this page */
    if (!document.getElementById('amenti-attica')) {
      setTimeout(arrive, 600);
      return;
    }
    mount();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrive);
  } else {
    arrive();
  }

  window.AmentiFrameCard = {
    open: function () { if (tab) { show(true); } },
    close: function () { if (tab) { show(false); } },
    shown: function () { return !!tab; }
  };
})();
