/* ============================================================================
 *  amenti-mascot.js — the floating "SIGN UP & FLY" box
 * ----------------------------------------------------------------------------
 *  A small wireframe box that drifts across the screen (bottom-left -> top-
 *  right, fading in and out), inviting people to the newsletter. Clicking it
 *  smooth-scrolls to the signup form at the bottom of the page and gives the
 *  email field a brief glow so it's obvious where they landed.
 *
 *  Simple by design: it's a DOOR to the one signup portal, not its own form.
 *  Appears periodically, one pass at a time, then rests. Dismissible per pass.
 *
 *  Drop this <script> on any page that has the #nl-form signup section.
 * ========================================================================== */
(function () {
  'use strict';

  // ---- timing (single pass, then rest) ----
  var PASS_MS      = 22000;   // one drift takes ~22s
  var FIRST_DELAY  = 8000;    // wait a bit after load before the first pass
  var REST_MIN     = 90000;   // rest 1.5–3 min between passes
  var REST_MAX     = 180000;
  var MAX_PASSES   = 4;       // per session, then stop (don't nag)
  var passCount    = 0;

  function injectStyles() {
    if (document.getElementById('amenti-mascot-styles')) return;
    var s = document.createElement('style');
    s.id = 'amenti-mascot-styles';
    s.textContent = [
      '.amenti-mascot{position:fixed;left:6%;bottom:10%;z-index:9000;',
      '  border:1px solid #d9a93a;border-radius:5px;background:rgba(10,20,34,.28);',
      '  padding:6px 10px;box-shadow:0 0 8px rgba(217,169,58,.2);text-align:center;',
      '  backdrop-filter:blur(1px);cursor:pointer;opacity:0;pointer-events:none;',
      '  font-family:"SFMono-Regular",Menlo,Consolas,monospace;user-select:none}',
      '.amenti-mascot.live{pointer-events:auto}',
      '.amenti-mascot.drift{animation:amasc-drift 22s ease-in-out forwards}',
      '.amenti-mascot .l1{font-size:10px;letter-spacing:.08em;color:#7CFFC4;font-weight:600}',
      '.amenti-mascot .l2{font-size:9px;letter-spacing:.06em;color:#d9a93a;margin-top:1px}',
      '.amenti-mascot:hover{box-shadow:0 0 14px rgba(217,169,58,.5);background:rgba(10,20,34,.5)}',
      '@keyframes amasc-drift{',
      '  0%{transform:translate(0,0);opacity:0}',
      '  15%{opacity:.9}',
      '  50%{transform:translate(44vw,-40vh);opacity:.9}',
      '  85%{opacity:0}',
      '  100%{transform:translate(80vw,-72vh);opacity:0}}',
      /* the brief glow on the signup field after arrival */
      '@keyframes amasc-fieldglow{0%,100%{box-shadow:0 0 0 rgba(217,169,58,0)}',
      '  50%{box-shadow:0 0 0 3px rgba(217,169,58,.55)}}',
      '.amenti-field-glow{animation:amasc-fieldglow 1.1s ease-in-out 2}',
      '@media (prefers-reduced-motion:reduce){',
      '  .amenti-mascot.drift{animation:none;opacity:.85;pointer-events:auto}}'
    ].join('');
    document.head.appendChild(s);
  }

  var el = null;

  // scroll to the signup portal and glow the field
  function goToSignup() {
    var form = document.getElementById('nl-form');
    var input = document.getElementById('nl-input');
    var target = form || input ||
      document.querySelector('.newsletter');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (input) {
      // glow after the scroll settles, and focus for instant typing
      setTimeout(function () {
        input.classList.add('amenti-field-glow');
        try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
        setTimeout(function () { input.classList.remove('amenti-field-glow'); }, 2600);
      }, 650);
    }
    endPass();  // clicking ends this pass immediately
  }

  function startPass() {
    if (passCount >= MAX_PASSES) return;
    injectStyles();
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = document.createElement('div');
    el.className = 'amenti-mascot live drift';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Sign up for the Valhalla Chronicles newsletter');
    el.innerHTML = '<div class="l1">SIGN UP &amp; FLY</div><div class="l2">◈ join the roster</div>';
    el.addEventListener('click', goToSignup);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToSignup(); }
    });
    document.body.appendChild(el);
    passCount++;
    // when the drift animation finishes, clean up and schedule the next pass
    el.addEventListener('animationend', function (ev) {
      if (ev.animationName === 'amasc-drift') endPass();
    });
    // safety: also end after PASS_MS in case animationend doesn't fire
    el._t = setTimeout(endPass, PASS_MS + 500);
  }

  function endPass() {
    if (el) {
      if (el._t) clearTimeout(el._t);
      if (el.parentNode) el.parentNode.removeChild(el);
      el = null;
    }
    if (passCount < MAX_PASSES) {
      var rest = REST_MIN + Math.random() * (REST_MAX - REST_MIN);
      setTimeout(startPass, rest);
    }
  }

  // ---- start: only run where the signup portal exists ----
  function boot() {
    if (!document.getElementById('nl-form') && !document.querySelector('.newsletter')) return;
    setTimeout(startPass, FIRST_DELAY);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);

  // expose for manual testing:  window.amentiMascot.show()
  window.amentiMascot = { show: startPass, hide: endPass };
})();
