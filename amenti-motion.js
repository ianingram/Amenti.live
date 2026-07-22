/* ===========================================================================
   amenti-motion.js — THE MOTION LAYER
   ---------------------------------------------------------------------------
   BUILT      2026-07-20 · 14:00 UTC
   AMENTI.LIVE · Ingram Manor LLC

   In Page1.html, after amenti-roster.js:
       <script src="amenti-motion.js" defer></script>

   WHAT THIS IS
     Phase one of THE STYLE ROADMAP, and the cheapest thing in that document.
     No tables, no renderer, no provider — the thirty-three portraits that
     exist are already rigged. Arms are separate strokes, hands carry their own
     transforms, held objects have their own paths. Nothing needs redrawing to
     move.

     This file supplies the vocabulary. A portrait opts in by putting a class
     on a part; the animation fires when a seeker's cursor is on the card.

   THREE RULES, AND THEY ARE NOT NEGOTIABLE

     1  IT DEPARTS FROM THE STILL AND RETURNS TO IT.
        A card is at rest almost all the time, so the resting pose IS the
        portrait. Tolkien holding a pipe, not Tolkien mid-tamp with his hands
        in the wrong place. Every animation here ends where it began.

     2  IT MUST END WHERE IT BEGAN, or hovering twice looks broken.
        Every keyframe below returns to its start. The one exception is
        deliberate and reset: a thing that cannot un-happen — tablets breaking —
        plays once and restores, so a seeker can do it again.

     3  TOUCH HAS NO HOVER.
        On a phone a tap goes to the bay and the animation is simply a desktop
        grace. Nothing is lost that a seeker knows they are missing. The media
        query below turns the whole thing off where hover does not exist,
        rather than leaving it half-firing on a long press.

   AND ONE THING THIS IS NOT
     It is not a style. A style says how a figure is DRAWN; motion says whether
     it MOVES. A puppet can be still or moving and so can a manga. They are
     independent dimensions and the tables, when they come, must keep them so.
   =========================================================================== */
(function () {
  'use strict';

  if (document.getElementById('amenti-motion-css')) return;

  var css = document.createElement('style');
  css.id = 'amenti-motion-css';
  css.textContent = [

    /* ---- nothing moves until a cursor is on the card -------------------- */
    '.roster-card .mv, .bay-art .mv { transform-box: fill-box; transform-origin: center; }',

    /* Each part sits still by default. The animation is attached only while
       the card is hovered, so a card at rest costs nothing at all — no
       compositing, no repaint, no battery. */

    /* ── LIFT · a held object rises and lowers ─────────────────────────────
       Pasteur raising the swan-neck flask to the light. The wrist does the
       work, so the origin is the bottom of the object rather than its middle. */
    '@keyframes mv-lift {'
    + '  0%   { transform: translateY(0)    rotate(0deg); }'
    + '  30%  { transform: translateY(-9px) rotate(-7deg); }'
    + '  55%  { transform: translateY(-11px) rotate(-8deg); }'
    + '  100% { transform: translateY(0)    rotate(0deg); }'
    + '}',
    '.roster-card:hover .mv-lift, .bay-art:hover .mv-lift {'
    + '  animation: mv-lift 2.4s ease-in-out;'
    + '  transform-origin: 50% 100%;'
    + '}',

    /* ── TURN · a wheel rotates a quarter and stops ────────────────────────
       Einstein's bicycle. It does NOT spin — a spinning wheel is a loading
       spinner and reads as waiting. A quarter turn that slows and settles
       reads as a thing that was just moving. */
    '@keyframes mv-turn {'
    + '  0%   { transform: rotate(0deg); }'
    + '  100% { transform: rotate(96deg); }'
    + '}',
    '.roster-card:hover .mv-turn, .bay-art:hover .mv-turn {'
    + '  animation: mv-turn 1.9s cubic-bezier(.15,.7,.25,1) forwards;'
    + '}',

    /* ── PRESS · a lever comes down and returns ────────────────────────────
       Gutenberg's press bar. The pause at the bottom is the impression being
       taken, and it is the whole gesture: without it the bar is just waving. */
    '@keyframes mv-press {'
    + '  0%   { transform: rotate(0deg); }'
    + '  22%  { transform: rotate(26deg); }'
    + '  46%  { transform: rotate(28deg); }'
    + '  70%  { transform: rotate(26deg); }'
    + '  100% { transform: rotate(0deg); }'
    + '}',
    '.roster-card:hover .mv-press, .bay-art:hover .mv-press {'
    + '  animation: mv-press 2.6s ease-in-out;'
    + '}',

    /* ── DRIP · something falls, twice, and is gone ────────────────────────
       Water running back off Cai Lun's mould. Two drops rather than one,
       because one drop is an accident and two is a process. */
    '@keyframes mv-drip {'
    + '  0%   { opacity: 0; transform: translateY(0); }'
    + '  12%  { opacity: .8; }'
    + '  40%  { opacity: .5; transform: translateY(22px); }'
    + '  48%  { opacity: 0;  transform: translateY(26px); }'
    + '  60%  { opacity: 0;  transform: translateY(0); }'
    + '  70%  { opacity: .7; }'
    + '  95%  { opacity: 0;  transform: translateY(24px); }'
    + '  100% { opacity: 0;  transform: translateY(0); }'
    + '}',
    '.roster-card:hover .mv-drip, .bay-art:hover .mv-drip {'
    + '  animation: mv-drip 3s ease-in;'
    + '}',

    /* ── EMBER · a glow brightens and settles ──────────────────────────────
       Rand's cigarette, Churchill's cigar. A draw is not a flicker — it is a
       slow brightening on the intake and a slower fade after. */
    '@keyframes mv-ember {'
    + '  0%   { opacity: .35; }'
    + '  35%  { opacity: 1; }'
    + '  55%  { opacity: .9; }'
    + '  100% { opacity: .35; }'
    + '}',
    '.roster-card:hover .mv-ember, .bay-art:hover .mv-ember {'
    + '  animation: mv-ember 2.8s ease-in-out;'
    + '}',

    /* ── STRAIN · a pull against a restraint, and it holds ─────────────────
       Odysseus at the mast. Small. The point is that it does NOT give. */
    '@keyframes mv-strain {'
    + '  0%   { transform: translateX(0)     rotate(0deg); }'
    + '  18%  { transform: translateX(-2.5px) rotate(-1.6deg); }'
    + '  30%  { transform: translateX(-2px)  rotate(-1.2deg); }'
    + '  46%  { transform: translateX(-3px)  rotate(-2deg); }'
    + '  62%  { transform: translateX(-1px)  rotate(-.6deg); }'
    + '  100% { transform: translateX(0)     rotate(0deg); }'
    + '}',
    '.roster-card:hover .mv-strain, .bay-art:hover .mv-strain {'
    + '  animation: mv-strain 2.2s ease-in-out;'
    + '  transform-origin: 50% 100%;'
    + '}',

    /* ── DRIFT · smoke, dust, breath ───────────────────────────────────────
       Rises, spreads, thins to nothing. Never loops visibly: it must be gone
       before it restarts or it reads as a leak. */
    '@keyframes mv-drift {'
    + '  0%   { opacity: 0;  transform: translateY(0)     scale(.7); }'
    + '  25%  { opacity: .55; }'
    + '  100% { opacity: 0;  transform: translateY(-26px) scale(1.5); }'
    + '}',
    '.roster-card:hover .mv-drift, .bay-art:hover .mv-drift {'
    + '  animation: mv-drift 3.2s ease-out;'
    + '  transform-origin: 50% 100%;'
    + '}',

    /* ── BLINK · the cheapest life there is ────────────────────────────────
       Two frames of nothing. Use sparingly — a card where everything blinks
       is a card that twitches. */
    '@keyframes mv-blink {'
    + '  0%,88%,100% { transform: scaleY(1); }'
    + '  93%         { transform: scaleY(.08); }'
    + '}',
    '.roster-card:hover .mv-blink, .bay-art:hover .mv-blink {'
    + '  animation: mv-blink 3.4s ease-in-out;'
    + '  transform-origin: 50% 50%;'
    + '}',

    /* ---- RULE 3 · touch has no hover ------------------------------------- */
    '@media (hover: none) {'
    + '  .roster-card .mv, .bay-art .mv { animation: none !important; }'
    + '}',

    /* ---- and a seeker who has asked for less motion gets none ------------ */
    '@media (prefers-reduced-motion: reduce) {'
    + '  .roster-card .mv, .bay-art .mv { animation: none !important; }'
    + '}'

  ].join('\n');

  document.head.appendChild(css);

  /* nothing else to do. There is no JavaScript in the animation itself — it is
     CSS on classes that portraits carry, which means it cannot fail to fire,
     cannot leak a listener, and costs nothing on a card at rest. */
  window.amentiMotion = { version: 1, verbs:
    ['lift','turn','press','drip','ember','strain','drift','blink'] };
})();
