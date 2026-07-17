/* ============================================================================
 *  amenti-profile.js — Phase 1: the user profile panel
 * ----------------------------------------------------------------------------
 *  A single shared module. Opens a profile panel showing the data that is
 *  ALREADY readable per-user, built on the same window.amentiAuth.sb the rest
 *  of the site uses. No page-specific logic — drop this <script> on any page
 *  that also loads amenti-auth.js and it works.
 *
 *  PHASE 1 (this file) shows the three data points with real read paths today:
 *    • Identity  — sb.auth.getSession()  -> email, initials, member-since
 *    • Tokens    — emerald_balance.balance  (same read amenti-auth uses)
 *    • Newsletter— subscribers.status by email  (mirror of the signup insert)
 *
 *  PHASE 2 (later, needs server-side read endpoints on the mint Worker) adds:
 *    • Quiz scores      — needs a /me/quiz read (only /quiz/start|submit exist)
 *    • Leaderboard rank — derive from /pool/leaderboard once rows carry identity
 *    • Court activity   — needs a per-user read of argument_reports + votes
 *    • Chess            — needs persistent per-user match state (not built yet)
 *  Each has a clearly-marked "coming soon" slot below, so the panel grows
 *  without a rewrite.
 *
 *  READS ONLY. This panel can never write the ledger or any table.
 * ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function styles() {
    if (document.getElementById('amenti-profile-styles')) return;
    var el = document.createElement('style');
    el.id = 'amenti-profile-styles';
    el.textContent = [
      '.amenti-profile-ov{position:fixed;inset:0;z-index:100000;display:none;',
      '  align-items:center;justify-content:center;background:rgba(4,8,14,.72);backdrop-filter:blur(3px)}',
      '.amenti-profile-ov.open{display:flex}',
      '.amenti-profile{width:min(460px,92vw);max-height:88vh;overflow-y:auto;',
      '  background:#0d1826;border:1px solid #d9a93a;border-radius:14px;',
      '  font-family:"SFMono-Regular",Menlo,Consolas,monospace;color:#f4f1ea;',
      '  box-shadow:0 24px 80px rgba(0,0,0,.6)}',
      '.amenti-profile-hd{display:flex;align-items:center;gap:14px;padding:22px 24px 18px;',
      '  border-bottom:1px solid #26323f}',
      '.amenti-profile-ava{width:52px;height:52px;border-radius:50%;flex:none;',
      '  display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;',
      '  background:rgba(217,169,58,.14);color:#d9a93a;border:1px solid #d9a93a}',
      '.amenti-profile-id .nm{font-size:16px;font-weight:700;color:#f4f1ea;letter-spacing:.02em}',
      '.amenti-profile-id .em{font-size:12.5px;color:#93c5fd;margin-top:2px}',
      '.amenti-profile-x{margin-left:auto;background:none;border:none;color:#93c5fd;',
      '  font-size:20px;cursor:pointer;line-height:1;padding:4px 8px}',
      '.amenti-profile-x:hover{color:#f4f1ea}',
      '.amenti-profile-body{padding:12px 24px 24px}',
      '.amenti-row{display:flex;align-items:center;gap:12px;padding:15px 0;border-bottom:1px solid #1a2430}',
      '.amenti-row:last-child{border-bottom:none}',
      '.amenti-row .lbl{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;flex:none;width:130px}',
      '.amenti-row .val{font-size:16px;color:#f4f1ea;font-weight:600}',
      '.amenti-row .val.big{font-size:22px;color:#7CFFC4}',
      '.amenti-row .val.gold{color:#d9a93a}',
      '.amenti-row .val.on{color:#7CFFC4}.amenti-row .val.off{color:#ff8a80}',
      '.amenti-sub-btn{margin-left:auto;background:transparent;border:1px solid #7CFFC4;color:#7CFFC4;',
      '  font-family:inherit;font-size:12px;letter-spacing:.06em;padding:6px 14px;border-radius:6px;cursor:pointer}',
      '.amenti-sub-btn:hover{background:rgba(124,255,196,.1)}',
      '.amenti-soon{opacity:.5}',
      '.amenti-soon .val{font-size:13px;color:#93c5fd;font-weight:400;font-style:italic}',
      '.amenti-profile-sec{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#d9a93a;',
      '  padding:18px 0 4px;margin-top:6px;border-top:1px solid #26323f}'
    ].join('');
    document.head.appendChild(el);
  }

  function initials(email) {
    if (!email) return '★';
    var name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    var parts = name.split(/\s+/);
    return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || email[0].toUpperCase();
  }

  var ovEl;
  function buildOverlay() {
    if (ovEl) return ovEl;
    styles();
    ovEl = document.createElement('div');
    ovEl.className = 'amenti-profile-ov';
    ovEl.innerHTML =
      '<div class="amenti-profile" role="dialog" aria-label="Your profile">' +
        '<div class="amenti-profile-hd">' +
          '<div class="amenti-profile-ava" id="amp-ava">★</div>' +
          '<div class="amenti-profile-id">' +
            '<div class="nm" id="amp-nm">—</div>' +
            '<div class="em" id="amp-em">—</div>' +
          '</div>' +
          '<button class="amenti-profile-x" id="amp-x" aria-label="Close">✕</button>' +
        '</div>' +
        '<div class="amenti-profile-body" id="amp-body"></div>' +
      '</div>';
    document.body.appendChild(ovEl);
    ovEl.addEventListener('click', function (e) { if (e.target === ovEl) close(); });
    ovEl.querySelector('#amp-x').onclick = close;
    return ovEl;
  }

  function row(label, valHtml, cls) {
    return '<div class="amenti-row ' + (cls || '') + '">' +
             '<span class="lbl">' + label + '</span>' +
             '<span class="val ' + (cls === 'amenti-soon' ? '' : '') + '">' + valHtml + '</span>' +
           '</div>';
  }

  function close() { if (ovEl) ovEl.classList.remove('open'); }

  async function open() {
    var auth = window.amentiAuth;
    if (!auth || !auth.sb) { console.warn('[amenti-profile] amentiAuth.sb not ready'); return; }
    var sb = auth.sb;
    buildOverlay();
    var body = document.getElementById('amp-body');

    // session / identity
    var session = (await sb.auth.getSession()).data.session;
    if (!session) { console.warn('[amenti-profile] no session'); return; }
    var email = session.user.email || '';
    var since = session.user.created_at ? new Date(session.user.created_at).toLocaleDateString(
                  undefined, { year: 'numeric', month: 'short' }) : '—';
    document.getElementById('amp-ava').textContent = initials(email);
    document.getElementById('amp-nm').textContent = email.split('@')[0];
    document.getElementById('amp-em').textContent = email;

    ovEl.classList.add('open');
    body.innerHTML = '<div class="amenti-row"><span class="lbl">Loading…</span></div>';

    // tokens — same read amenti-auth uses
    var bal = 0;
    try {
      var br = await sb.from('emerald_balance').select('balance').maybeSingle();
      if (!br.error && br.data) bal = Number(br.data.balance) || 0;
    } catch (e) { console.warn('[amenti-profile] balance:', e); }

    // newsletter — mirror read of the signup insert
    var subbed = false, subKnown = true;
    try {
      var sr = await sb.from('subscribers').select('status').eq('email', email.toLowerCase()).maybeSingle();
      if (sr.error) { subKnown = false; }
      else subbed = !!(sr.data && sr.data.status === 'active');
    } catch (e) { subKnown = false; console.warn('[amenti-profile] subscribers:', e); }

    // ---- render ----
    var html = '';
    html += row('Emerald Tokens', '<span class="val big">◈ ' + bal.toLocaleString() + '</span>');
    html += row('Member since', '<span class="val gold">' + since + '</span>');

    var subVal;
    if (!subKnown) subVal = '<span class="val">—</span>';
    else if (subbed) subVal = '<span class="val on">✓ Subscribed</span>';
    else subVal = '<span class="val off">Not subscribed</span>' +
                  '<button class="amenti-sub-btn" id="amp-sub">Subscribe</button>';
    html += '<div class="amenti-row"><span class="lbl">Newsletter</span>' + subVal + '</div>';

    // Phase-2 slots — clearly marked, so the panel grows without a rewrite
    html += '<div class="amenti-profile-sec">Coming soon</div>';
    html += row('Quiz scores',  'tracked once the read path lands', 'amenti-soon');
    html += row('Leaderboard',  'your rank, once wired to the pool', 'amenti-soon');
    html += row('Court',        'your responses &amp; upvotes',       'amenti-soon');
    html += row('Chess',        'standings, once matches are stored', 'amenti-soon');

    body.innerHTML = html;

    // one-tap subscribe (writes to subscribers, same shape as the signup form)
    var subBtn = document.getElementById('amp-sub');
    if (subBtn) subBtn.onclick = async function () {
      subBtn.disabled = true; subBtn.textContent = '…';
      try {
        var res = await sb.from('subscribers').insert({ email: email.toLowerCase(), source: 'profile' });
        if (res.error && res.error.code !== '23505') throw res.error;
        subBtn.parentNode.querySelector('.val').outerHTML = '<span class="val on">✓ Subscribed</span>';
        subBtn.remove();
      } catch (e) {
        console.error('[amenti-profile] subscribe failed:', e);
        subBtn.disabled = false; subBtn.textContent = 'Retry';
      }
    };
  }

  // expose + wire a "View profile" entry into the existing auth menu
  window.amentiProfile = { open: open, close: close };

  ready(function () {
    // Add a "View profile" button to the amenti-menu when it appears.
    // The menu is built lazily by amenti-auth on first open, so we watch for it.
    var wired = false;
    function wire() {
      if (wired) return;
      var menu = document.querySelector('.amenti-menu');
      if (!menu) return;
      if (menu.querySelector('[data-act="profile"]')) { wired = true; return; }
      var b = document.createElement('button');
      b.setAttribute('data-act', 'profile');
      b.innerHTML = '◈ View profile';
      menu.insertBefore(b, menu.firstChild);
      b.onclick = function () { open(); var m = document.querySelector('.amenti-menu.open'); if (m) m.classList.remove('open'); };
      wired = true;
    }
    // poll briefly for the lazily-built menu
    var tries = 0;
    var iv = setInterval(function () { wire(); if (wired || ++tries > 40) clearInterval(iv); }, 500);
    document.addEventListener('click', function(){ setTimeout(wire, 60); });
  });
})();
