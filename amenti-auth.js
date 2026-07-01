/* ===========================================================================
   amenti-auth.js — Phase 1: sign-in + Emerald Token balance pill
   ---------------------------------------------------------------------------
   Include AFTER the Supabase library, once, on every page:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="amenti-auth.js"></script>

   It finds the existing sign-in buttons (.mn-signin, .nav-signin, .footer-signin),
   opens a sign-in modal when signed out, and turns them into a live "◈ N ET"
   balance pill (reading emerald_balance) when signed in. Re-renders on every
   auth change. Reads only — the pill can never write the ledger.
   =========================================================================== */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://bhgnkfsatmcnhqksybpa.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_XtrpSVYl4f5Q6kjtaZGf5A_H2gG_QtK'; // publishable = safe in the browser

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[amenti-auth] Supabase library not found. Add its <script> tag BEFORE amenti-auth.js.');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.amentiAuth = { sb: sb, refresh: render };  // exposed for later phases (Phase 2 reuses sb)

  var SIGNIN_SELECTOR = '.mn-signin, .nav-signin, .footer-signin';

  /* ---- styling (injected so this stays a single file) -------------------- */
  function injectStyles() {
    if (document.getElementById('amenti-auth-styles')) return;
    var css = ''
      + '.amenti-signed-in{display:inline-flex;align-items:center;gap:9px;}'
      + '.amenti-et{font-weight:600;letter-spacing:.08em;white-space:nowrap;}'
      + '.amenti-ava{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;'
      +   'border-radius:50%;background:#d4a017;color:#0a0a0f;font-size:10px;font-weight:700;letter-spacing:0;}'
      + '.amenti-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;'
      +   'background:rgba(5,5,10,.9);backdrop-filter:blur(8px);padding:24px;}'
      + '.amenti-overlay.open{display:flex;}'
      + '.amenti-card{width:100%;max-width:380px;background:#1a1a22;border:1px solid #d4a017;padding:28px;'
      +   "font-family:'Share Tech Mono',monospace;color:#c8c8d8;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);}"
      + '.amenti-card h3{color:#d4a017;font-size:16px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 4px;}'
      + '.amenti-card p.sub{font-size:12px;opacity:.6;margin:0 0 18px;letter-spacing:.04em;}'
      + '.amenti-card label{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin:12px 0 5px;}'
      + '.amenti-card input{width:100%;background:#0a0a0f;border:1px solid #3a3a52;color:#fff;padding:11px 12px;'
      +   "font-family:inherit;font-size:13px;letter-spacing:.03em;outline:none;}"
      + '.amenti-card input:focus{border-color:#d4a017;}'
      + '.amenti-row{display:flex;gap:10px;margin-top:18px;}'
      + '.amenti-btn{flex:1;background:#d4a017;color:#0a0a0f;border:none;padding:11px;font-family:inherit;'
      +   "font-size:11px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;"
      +   'clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);}'
      + '.amenti-btn.ghost{background:transparent;border:1.5px solid #d4a017;color:#d4a017;}'
      + '.amenti-alt{margin-top:14px;font-size:11px;letter-spacing:.04em;opacity:.6;cursor:pointer;text-align:center;}'
      + '.amenti-alt:hover{opacity:1;color:#00ffe0;}'
      + '.amenti-msg{margin-top:14px;font-size:11px;letter-spacing:.03em;min-height:14px;}'
      + '.amenti-msg.err{color:#f87171;} .amenti-msg.ok{color:#00ffe0;}'
      + '.amenti-close{float:right;background:none;border:none;color:#c8c8d8;font-size:18px;cursor:pointer;opacity:.6;margin:-8px -6px 0 0;}'
      + '.amenti-menu{position:fixed;z-index:99999;background:#1a1a22;border:1px solid #d4a017;min-width:180px;'
      +   "font-family:'Share Tech Mono',monospace;display:none;}"
      + '.amenti-menu.open{display:block;}'
      + '.amenti-menu button{display:block;width:100%;text-align:left;background:none;border:none;color:#c8c8d8;'
      +   'padding:11px 14px;font-family:inherit;font-size:11px;letter-spacing:.08em;cursor:pointer;}'
      + '.amenti-menu button:hover{background:rgba(212,160,23,.12);color:#d4a017;}'
      + '.amenti-menu .muted{opacity:.4;cursor:default;} .amenti-menu .muted:hover{background:none;color:#c8c8d8;}';
    var el = document.createElement('style');
    el.id = 'amenti-auth-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ---- helpers ----------------------------------------------------------- */
  function initials(email) {
    if (!email) return '★';
    var name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    var parts = name.split(/\s+/);
    return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || email[0].toUpperCase();
  }

  async function fetchBalance() {
    try {
      var res = await sb.from('emerald_balance').select('balance').maybeSingle();
      if (res.error) { console.warn('[amenti-auth] balance read:', res.error.message); return 0; }
      return res.data ? Number(res.data.balance) : 0;
    } catch (e) { console.warn('[amenti-auth]', e); return 0; }
  }

  /* ---- render nav state -------------------------------------------------- */
  async function render() {
    var session = (await sb.auth.getSession()).data.session;
    var btns = document.querySelectorAll(SIGNIN_SELECTOR);
    if (!btns.length) return;

    if (session) {
      var bal = await fetchBalance();
      var ini = initials(session.user.email);
      btns.forEach(function (btn) {
        if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.innerHTML;
        btn.classList.add('amenti-signed-in');
        btn.innerHTML = '<span class="amenti-et">◈ ' + bal.toLocaleString() + ' ET</span>'
                      + '<span class="amenti-ava">' + ini + '</span>';
        btn.onclick = function (e) { openMenu(e, btn); };
      });
    } else {
      btns.forEach(function (btn) {
        btn.classList.remove('amenti-signed-in');
        if (btn.dataset.origLabel) btn.innerHTML = btn.dataset.origLabel;
        btn.onclick = openModal;
      });
      closeMenu();
    }
  }

  /* ---- signed-in dropdown menu ------------------------------------------ */
  var menuEl;
  function openMenu(e, btn) {
    e.stopPropagation();
    if (!menuEl) {
      menuEl = document.createElement('div');
      menuEl.className = 'amenti-menu';
      menuEl.innerHTML =
          '<button class="muted">⬡ Connect Wallet · soon</button>'
        + '<button data-act="signout">↩ Sign out</button>';
      document.body.appendChild(menuEl);
      menuEl.querySelector('[data-act="signout"]').onclick = async function () {
        closeMenu(); await sb.auth.signOut();
      };
    }
    var r = btn.getBoundingClientRect();
    menuEl.style.top = (r.bottom + 6) + 'px';
    menuEl.style.left = Math.max(8, r.right - 180) + 'px';
    menuEl.classList.add('open');
  }
  function closeMenu() { if (menuEl) menuEl.classList.remove('open'); }
  document.addEventListener('click', closeMenu);

  /* ---- sign-in modal ----------------------------------------------------- */
  var overlay, msgEl, emailEl, passEl, magic = false;
  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'amenti-overlay';
    overlay.innerHTML =
      '<div class="amenti-card">'
      + '<button class="amenti-close">✕</button>'
      + '<h3>Enter Amenti</h3>'
      + '<p class="sub">Sign in to earn and spend Emerald Tokens.</p>'
      + '<label>Email</label><input type="email" autocomplete="email" id="amenti-email">'
      + '<div id="amenti-passwrap"><label>Password</label><input type="password" autocomplete="current-password" id="amenti-pass"></div>'
      + '<div class="amenti-row">'
      +   '<button class="amenti-btn" data-act="signin">Sign In</button>'
      +   '<button class="amenti-btn ghost" data-act="signup">Create</button>'
      + '</div>'
      + '<div class="amenti-alt" data-act="magic">or email me a magic link instead</div>'
      + '<div class="amenti-msg" id="amenti-msg"></div>'
      + '</div>';
    document.body.appendChild(overlay);
    emailEl = overlay.querySelector('#amenti-email');
    passEl  = overlay.querySelector('#amenti-pass');
    msgEl   = overlay.querySelector('#amenti-msg');
    overlay.querySelector('.amenti-close').onclick = closeModal;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('[data-act="signin"]').onclick = doSignIn;
    overlay.querySelector('[data-act="signup"]').onclick = doSignUp;
    overlay.querySelector('[data-act="magic"]').onclick = toggleMagic;
  }
  function openModal() { if (!overlay) buildModal(); setMsg(''); overlay.classList.add('open'); emailEl.focus(); }
  function closeModal() { if (overlay) overlay.classList.remove('open'); }
  function setMsg(t, kind) { msgEl.textContent = t || ''; msgEl.className = 'amenti-msg' + (kind ? ' ' + kind : ''); }

  function toggleMagic() {
    magic = !magic;
    overlay.querySelector('#amenti-passwrap').style.display = magic ? 'none' : '';
    overlay.querySelector('[data-act="signup"]').style.display = magic ? 'none' : '';
    overlay.querySelector('[data-act="signin"]').textContent = magic ? 'Send Link' : 'Sign In';
    overlay.querySelector('[data-act="magic"]').textContent =
      magic ? 'use a password instead' : 'or email me a magic link instead';
    overlay.querySelector('[data-act="signin"]').onclick = magic ? doMagic : doSignIn;
    setMsg('');
  }

  async function doSignIn() {
    setMsg('Signing in…');
    var res = await sb.auth.signInWithPassword({ email: emailEl.value.trim(), password: passEl.value });
    if (res.error) return setMsg(res.error.message, 'err');
    closeModal();
  }
  async function doSignUp() {
    setMsg('Creating account…');
    var res = await sb.auth.signUp({ email: emailEl.value.trim(), password: passEl.value });
    if (res.error) return setMsg(res.error.message, 'err');
    if (res.data.session) { closeModal(); }
    else setMsg('Account made — check your email to confirm, then sign in.', 'ok');
  }
  async function doMagic() {
    setMsg('Sending link…');
    var res = await sb.auth.signInWithOtp({ email: emailEl.value.trim() });
    if (res.error) return setMsg(res.error.message, 'err');
    setMsg('Check your email for the sign-in link.', 'ok');
  }

  /* ---- boot -------------------------------------------------------------- */
  function boot() {
    injectStyles();
    render();
    sb.auth.onAuthStateChange(function () { render(); });  // reactive: login / logout / token refresh
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
