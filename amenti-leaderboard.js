/* ===========================================================================
   amenti-leaderboard.js — "This Week's Pool" standings + the spiral-names coin
   ---------------------------------------------------------------------------
   Reads GET /pool/leaderboard and shows: the fixed pool, a countdown to
   settlement, a live coin with the top contributors spiralling into the well
   (rank 1 brightest at the mouth), and a ranked list with each argument's
   endorsements and PROJECTED payout (its current share of the pool).

   Open it:
     • window.amentiLeaderboard.open()   (wire a nav button to this)
     • any element with [data-leaderboard] or class .amenti-pool is auto-wired
     • the arguments feed shows a "This week's pool" link

   Load AFTER amenti-auth.js (uses window.amentiAuth.sb for the token).
   Projected ET is a live estimate of the current split — it moves as votes come
   in and finalises only at weekly settlement.
   =========================================================================== */
(function () {
  'use strict';
  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL) || 'https://amenti-mint.ingram-ian.workers.dev';
  var GLYPH = '\u25C8';

  var css = ''
    + '.lb-ov{position:fixed;inset:0;z-index:3400;display:none;align-items:center;justify-content:center;padding:24px;'
    +   'background:rgba(5,5,10,.93);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:"Share Tech Mono",ui-monospace,monospace}'
    + '.lb-ov.on{display:flex}'
    + '.lb-box{position:relative;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;background:#0e0e15;color:#e8e8ea;'
    +   'border:1px solid #d4a017;clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);padding:28px 30px}'
    + '.lb-x{position:absolute;top:10px;right:16px;background:none;border:none;color:#9a9aa6;font-size:22px;cursor:pointer;line-height:1}'
    + '.lb-x:hover{color:#fff}'
    + '.lb-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#00ffe0;margin:0 0 4px;text-align:center}'
    + '.lb-title{font-size:24px;letter-spacing:.04em;color:#d4a017;margin:0 0 2px;text-align:center}'
    + '.lb-sub{font-size:12px;letter-spacing:.14em;color:#9a9aa6;text-transform:uppercase;margin:0 0 16px;text-align:center}'
    + '.lb-coin{display:flex;justify-content:center;margin:0 0 18px}'
    + '.lb-coin svg{width:100%;max-width:360px;height:auto}'
    + '.lb-row{display:flex;align-items:center;gap:12px;border:1px solid #1b2230;border-left:2px solid #2a3444;padding:10px 12px;margin:0 0 8px;background:#0a0a0f}'
    + '.lb-row.mine{border-left-color:#d4a017;background:#12100a}'
    + '.lb-rank{font-family:"Orbitron","Share Tech Mono",monospace;font-size:18px;font-weight:700;color:#00ffe0;min-width:28px;text-align:center}'
    + '.lb-mid{flex:1;min-width:0}'
    + '.lb-who{font-size:12px;color:#d4a017;letter-spacing:.06em;margin:0 0 2px}'
    + '.lb-who .you{color:#00ffe0}'
    + '.lb-ex{font-size:12px;color:#cfcfd6;line-height:1.45;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
    + '.lb-right{text-align:right;white-space:nowrap}'
    + '.lb-et{font-size:14px;color:#d4a017}'
    + '.lb-v{font-size:11px;color:#6c6c78}'
    + '.lb-msg{font-size:14px;line-height:1.6;color:#cfcfd6;text-align:center;padding:18px 0}'
    + '.lb-foot{text-align:center;margin-top:14px}'
    + '.lb-btn{font-family:inherit;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#9a9aa6;background:transparent;border:1px solid #2a3444;padding:11px 22px;cursor:pointer}'
    + '.lb-btn:hover{color:#fff;border-color:#d4a017}'
    + '.lb-note{font-size:11px;color:#6c6c78;margin:10px 0 0;text-align:center;line-height:1.5}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

  var ov = document.createElement('div');
  ov.className = 'lb-ov';
  ov.innerHTML = '<div class="lb-box"><button class="lb-x" aria-label="Close">\u2715</button><div class="lb-body"></div></div>';
  document.body.appendChild(ov);
  var body = ov.querySelector('.lb-body');
  ov.querySelector('.lb-x').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  function show() { ov.classList.add('on'); } function close() { ov.classList.remove('on'); }
  function esc(x) { return String(x == null ? '' : x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function token() { try { var a = window.amentiAuth; if (!a || !a.sb) return null; var r = await a.sb.auth.getSession(); return r && r.data && r.data.session ? r.data.session.access_token : null; } catch (e) { return null; } }

  async function open() {
    show();
    body.innerHTML = '<div class="lb-msg" style="color:#00ffe0;letter-spacing:.2em">READING THE POOL \u2026</div>';
    var headers = {}; var t = await token(); if (t) headers.Authorization = 'Bearer ' + t;
    var data = null;
    try { var r = await fetch(MINT + '/pool/leaderboard', { headers: headers }); data = await r.json(); } catch (e) {}
    if (!data || !data.ok) { body.innerHTML = '<div class="lb-msg">Could not load the pool right now.</div><div class="lb-foot"><button class="lb-btn" id="lbClose">Close</button></div>'; wireClose(); return; }
    render(data);
  }

  function countdown(iso) {
    var ms = new Date(iso).getTime() - Date.now(); if (ms < 0) ms = 0;
    var d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
    return d + 'd ' + h + 'h';
  }

  function render(data) {
    var ranked = data.ranked || [];
    var coin = coinSVG(ranked);
    var rows = ranked.length ? ranked.map(function (a) {
      return '<div class="lb-row' + (a.mine ? ' mine' : '') + '">'
        + '<div class="lb-rank">' + a.rank + '</div>'
        + '<div class="lb-mid"><div class="lb-who">' + (a.mine ? '<span class="you">You</span>' : esc(a.handle)) + '</div>'
        + '<div class="lb-ex">' + esc(a.body) + '</div></div>'
        + '<div class="lb-right"><div class="lb-et">' + GLYPH + ' ' + a.projected + '</div><div class="lb-v">' + a.votes + ' endorsement' + (a.votes === 1 ? '' : 's') + '</div></div>'
        + '</div>';
    }).join('') : '<div class="lb-msg">No endorsements yet this week.<br>Endorse a strong argument to set the pool in motion.</div>';

    body.innerHTML =
      '<p class="lb-eyebrow">This week\u2019s pool</p>'
      + '<h2 class="lb-title">' + GLYPH + ' ' + data.pool + ' ET</h2>'
      + '<p class="lb-sub">' + (data.totalVotes || 0) + ' endorsement' + (data.totalVotes === 1 ? '' : 's') + ' \u00b7 settles in ' + countdown(data.settlesAt) + '</p>'
      + '<div class="lb-coin">' + coin + '</div>'
      + rows
      + '<p class="lb-note">Projected \u25C8 ET is each argument\u2019s current share of the fixed pool \u2014 it shifts as endorsements come in and finalises at settlement.</p>'
      + '<div class="lb-foot"><button class="lb-btn" id="lbClose">Close</button></div>';
    wireClose();
  }
  function wireClose() { var b = body.querySelector('#lbClose'); if (b) b.addEventListener('click', close); }

  /* ---- the spiral-names coin, driven by live standings ------------------- */
  function coinSVG(ranked) {
    var G = '#d9b24a', LG = '#e8c877', W = '#f6f2e6', FAINT = '#5f7a6b', DEEP = '#052e22';
    var cx = 210, cy = 200, s = '';
    function poly(r, n, rot) { var p = []; for (var k = 0; k < n; k++) { var a = (rot + k * 360 / n) * Math.PI / 180; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="150" fill="#b5872a"/>';
    s += '<path d="M ' + (cx - 106) + ' ' + (cy - 106) + ' A 150 150 0 0 1 ' + (cx + 106) + ' ' + (cy - 106) + '" fill="none" stroke="#e6c766" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M ' + (cx + 106) + ' ' + (cy + 106) + ' A 150 150 0 0 1 ' + (cx - 106) + ' ' + (cy + 106) + '" fill="none" stroke="#8a6316" stroke-width="5" stroke-linecap="round"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="142" fill="#0a4a34"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="132" fill="none" stroke="#0a5c42" stroke-width="1.3" stroke-dasharray="1.5 5"/>';
    s += '<polygon points="' + cx + ',' + (cy - 140) + ' ' + (cx + 140) + ',' + cy + ' ' + cx + ',' + (cy + 140) + ' ' + (cx - 140) + ',' + cy + '" fill="none" stroke="' + G + '" stroke-width="1.1" opacity="0.5"/>';
    var dr = [108, 80, 54, 30];
    for (var i = 0; i < dr.length; i++) s += '<polygon points="' + poly(dr[i], 8, i * 8) + '" fill="none" stroke="' + FAINT + '" stroke-width="0.5" opacity="' + (0.28 - i * 0.05).toFixed(2) + '"/>';

    var names = (ranked || []).slice(0, 8).map(function (a) { return a.mine ? 'You' : a.handle; });
    if (names.length) {
      var maxR = 118, turns = 1.85, decay = 0.8, start = -90, N = Math.max(1, names.length - 1), d = '';
      for (var j = 0; j <= 180; j++) { var f = j / 180, ang = (start + f * turns * 360) * Math.PI / 180, r = maxR * (1 - f * decay), x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang); d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; }
      s += '<path d="' + d + '" fill="none" stroke="' + LG + '" stroke-width="0.9" opacity="0.34"/>';
      for (var n = 0; n < names.length; n++) {
        var ff = names.length === 1 ? 0 : n / N, aa = (start + ff * turns * 360) * Math.PI / 180, rr = maxR * (1 - ff * decay);
        var xx = cx + rr * Math.cos(aa), yy = cy + rr * Math.sin(aa), fs = (15 - ff * 4).toFixed(1), op = (1 - ff * 0.5).toFixed(2);
        s += '<circle cx="' + xx.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="2.2" fill="' + G + '" opacity="' + op + '"/>';
        s += '<text x="' + xx.toFixed(1) + '" y="' + (yy - 5).toFixed(1) + '" text-anchor="middle" font-family="\u0027Share Tech Mono\u0027,monospace" font-size="' + fs + '" fill="' + W + '" opacity="' + op + '">' + esc(names[n]) + '</text>';
      }
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="' + DEEP + '"/><circle cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + G + '"/>';
    return '<svg width="100%" viewBox="0 0 420 400" role="img" aria-label="This week\u0027s pool, top contributors spiralling toward the well"><title>This week\u2019s pool</title>' + s + '</svg>';
  }

  /* ---- entry points ------------------------------------------------------ */
  function wire() {
    var els = document.querySelectorAll('[data-leaderboard], .amenti-pool');
    Array.prototype.forEach.call(els, function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.amentiLeaderboard = { open: open, close: close };
})();
