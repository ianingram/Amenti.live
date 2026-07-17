/* ============================================================================
 * VALL-HALLA · signup form wiring
 * ----------------------------------------------------------------------------
 * Drop-in handler for the existing #nl-form on Page1.html. Writes the email to
 * the Supabase `subscribers` table via the already-exposed window.amentiAuth.sb
 * client. Shows the existing #nl-success message on success.
 *
 * INSTALL: paste this <script> block just before </body> on Page1.html, AFTER
 * amenti-auth.js has loaded (it needs window.amentiAuth.sb).
 * ==========================================================================*/
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var form    = document.getElementById('nl-form');
    var input   = document.getElementById('nl-input');
    var success = document.getElementById('nl-success');
    if (!form || !input) return;                 // form not on this page — no-op

    form.addEventListener('submit', async function (e) {
      e.preventDefault();                        // never let it reload the page

      var email = (input.value || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.focus();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Signing on…'; }

      try {
        var sb = window.amentiAuth && window.amentiAuth.sb;
        if (!sb) throw new Error('Supabase client not ready');

        var res = await sb.from('subscribers').insert({ email: email, source: 'site' });

        // 23505 = unique_violation => already subscribed. Treat as success, not error.
        if (res.error && res.error.code !== '23505') throw res.error;

        form.style.display = 'none';
        if (success) success.style.display = 'block';
        // Fire the one-time on-boarding flourish (guarded to play once per user).
        if (window.amentiFlourish && typeof window.amentiFlourish.play === 'function') {
          window.amentiFlourish.play();
        }
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        // soft, non-alarming inline failure
        input.setAttribute('placeholder', 'Something went wrong — try again');
        input.value = '';
        console.error('[vallhalla] signup failed:', err);
      }
    });
  });
})();
