/* ===========================================================================
   amenti-readaloud.js — read the passage aloud for bonus Emerald Tokens
   ---------------------------------------------------------------------------
   Stage one (the floor). Opens from the quiz result screen. Reads the SAME
   gateway passage. Two paths:
     • Speech recognition (Chrome/Edge): transcribes as you read, checks how much
       of the passage you covered, in order. Rigorous.
     • Honor mode (Safari/Firefox/denied mic): a read-through timer paced to the
       passage length. Everyone can still earn.
   Privacy: audio is NEVER captured or stored — recognition processes it live and
   we send only a coverage RATIO to the Worker. Nothing to discard because nothing
   is kept.
   Reward: diminishing per read/day (Worker owns the curve), minted idempotently
   per signed session. Adults-only in v1 (one-time 18+ acknowledgment).

   Load AFTER amenti-quiz.js:
     <script src="amenti-readaloud.js"></script>
   The quiz result screen shows a "Read it aloud" button when this is present.
   =========================================================================== */
(function () {
  'use strict';
  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL) || 'https://amenti-mint.ingram-ian.workers.dev';
  var GLYPH = '\u25C8';
  var ADULT_KEY = 'amenti_ra_adult_ok';
  var COVERAGE_MIN = 0.80;

  /* ---- styles (ra-*) ----------------------------------------------------- */
  var css = ''
    + '.ra-ov{position:fixed;inset:0;z-index:3200;display:none;align-items:center;justify-content:center;padding:24px;'
    +   'background:rgba(5,5,10,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:"Share Tech Mono",ui-monospace,monospace}'
    + '.ra-ov.on{display:flex}'
    + '.ra-box{position:relative;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;background:#0e0e15;color:#e8e8ea;'
    +   'border:1px solid #d4a017;clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);padding:30px 32px}'
    + '.ra-x{position:absolute;top:10px;right:16px;background:none;border:none;color:#9a9aa6;font-size:22px;cursor:pointer;line-height:1}'
    + '.ra-x:hover{color:#fff}'
    + '.ra-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#00ffe0;margin:0 0 4px}'
    + '.ra-title{font-size:20px;letter-spacing:.03em;color:#d4a017;margin:0 0 14px}'
    + '.ra-passage{font-size:16px;line-height:1.85;color:#e8e8ea;margin:0 0 18px}'
    + '.ra-passage .w{transition:color .15s}'
    + '.ra-passage .w.said{color:#4ade80}'
    + '.ra-msg{font-size:14px;line-height:1.6;color:#cfcfd6;margin:0 0 16px}'
    + '.ra-hint{font-size:11px;letter-spacing:.1em;color:#00ffe0;margin:0 0 14px}'
    + '.ra-bar{height:6px;background:#1b2230;margin:0 0 8px;overflow:hidden}'
    + '.ra-bar > i{display:block;height:100%;width:0;background:#00ffe0;transition:width .2s}'
    + '.ra-pct{font-size:11px;color:#9a9aa6;text-align:right;margin:0 0 16px}'
    + '.ra-btn{font-family:inherit;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#0a0a0f;background:#d4a017;border:none;padding:12px 22px;cursor:pointer}'
    + '.ra-btn:hover{background:#e6b52a}.ra-btn:disabled{opacity:.4;cursor:default}'
    + '.ra-btn.ghost{background:transparent;color:#9a9aa6;border:1px solid #2a3444}'
    + '.ra-btn.ghost:hover{color:#fff;border-color:#d4a017}'
    + '.ra-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}'
    + '.ra-center{text-align:center}'
    + '.ra-credit{font-size:38px;color:#d4a017;margin:8px 0 2px}'
    + '.ra-note{font-size:11px;color:#6c6c78;margin:10px 0 0;line-height:1.5}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

  var ov = document.createElement('div');
  ov.className = 'ra-ov';
  ov.innerHTML = '<div class="ra-box"><button class="ra-x" aria-label="Close">\u2715</button><div class="ra-body"></div></div>';
  document.body.appendChild(ov);
  var body = ov.querySelector('.ra-body');
  ov.querySelector('.ra-x').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

  var rec = null, st = null;
  function show() { ov.classList.add('on'); }
  function close() { ov.classList.remove('on'); stopRec(); st = null; }
  function esc(x) { return String(x == null ? '' : x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function bind(sel, ev, fn) { var el = body.querySelector(sel); if (el) el.addEventListener(ev, fn); }

  async function getToken() {
    try { var a = window.amentiAuth; if (!a || !a.sb) return null; var r = await a.sb.auth.getSession(); return r && r.data && r.data.session ? r.data.session.access_token : null; } catch (e) { return null; }
  }
  async function api(path, opts) {
    var token = await getToken(); var headers = { 'Content-Type':'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var r = await fetch(MINT + path, Object.assign({ headers: headers }, opts || {}));
    var b = null; try { b = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, body: b };
  }

  /* ---- word tools -------------------------------------------------------- */
  function toWords(t) { return String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); }

  /* ---- open -------------------------------------------------------------- */
  async function open(topicId) {
    show(); loading('Preparing the reading');
    var token = await getToken();
    if (!token) return signIn();
    if (localStorage.getItem(ADULT_KEY) !== '1') return adultGate(topicId);
    var res = await api('/readaloud/start', { method:'POST', body: JSON.stringify({ topicId: topicId }) });
    if (!res.ok || !res.body || !res.body.passage) return err((res.body && res.body.error) || 'Could not start the reading.');
    st = { topicId: topicId, session: res.body.session, passage: res.body.passage, words: toWords(res.body.passage), ptr: 0, done: false };
    renderReady();
  }

  function loading(m) { body.innerHTML = '<div class="ra-center" style="padding:30px 0;color:#00ffe0;letter-spacing:.2em">' + esc(m) + ' \u2026</div>'; }
  function err(m) { body.innerHTML = '<div class="ra-msg ra-center">' + esc(m) + '</div><div class="ra-center"><button class="ra-btn ghost" id="raClose">Close</button></div>'; bind('#raClose','click',close); }
  function signIn() {
    body.innerHTML = '<p class="ra-eyebrow">Emerald Tokens</p><div class="ra-msg ra-center">Sign in to read aloud and earn ' + GLYPH + ' ET.</div>'
      + '<div class="ra-center ra-row" style="justify-content:center"><button class="ra-btn ghost" id="raClose">Close</button></div>';
    bind('#raClose','click',close);
  }
  function adultGate(topicId) {
    body.innerHTML = '<p class="ra-eyebrow">One moment</p><h2 class="ra-title">Read-aloud is 18+</h2>'
      + '<p class="ra-msg">Reading aloud uses your microphone. In this version it\u2019s for adults only \u2014 a version with parental consent for younger readers comes later. Please confirm you\u2019re 18 or older.</p>'
      + '<div class="ra-row"><button class="ra-btn" id="raYes">I\u2019m 18 or older</button><button class="ra-btn ghost" id="raNo">Not now</button></div>';
    bind('#raNo','click',close);
    bind('#raYes','click',function(){ try { localStorage.setItem(ADULT_KEY,'1'); } catch(e){} open(topicId); });
  }

  function passageHTML() {
    return st.words.length
      ? st.passage.split(/(\s+)/).map(function (tok) {
          if (/^\s+$/.test(tok)) return tok;
          return '<span class="w">' + esc(tok) + '</span>';
        }).join('')
      : esc(st.passage);
  }

  function renderReady() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    body.innerHTML =
      '<p class="ra-eyebrow">Read aloud \u00b7 bonus ' + GLYPH + ' ET</p>'
      + '<h2 class="ra-title">Read the passage</h2>'
      + '<div class="ra-passage" id="raText">' + passageHTML() + '</div>'
      + '<div class="ra-bar"><i id="raFill"></i></div><div class="ra-pct" id="raPct">0%</div>'
      + '<p class="ra-hint">' + (SR ? 'Tap start, allow the mic, and read it out loud. Your voice is never recorded or sent \u2014 only how much you covered.' : 'Your browser can\u2019t listen, so this runs on the honour system \u2014 read it through at a natural pace.') + '</p>'
      + '<div class="ra-row"><button class="ra-btn" id="raStart">' + (SR ? 'Start reading' : 'Begin (honour mode)') + '</button><button class="ra-btn ghost" id="raCancel">Cancel</button></div>';
    bind('#raCancel','click',close);
    bind('#raStart','click', function () { SR ? startSpeech(SR) : startHonor(); });
  }

  function setProgress(cov) {
    var f = body.querySelector('#raFill'), p = body.querySelector('#raPct');
    if (f) f.style.width = Math.min(100, Math.round(cov * 100)) + '%';
    if (p) p.textContent = Math.min(100, Math.round(cov * 100)) + '%';
  }
  function markWords() {
    var spans = body.querySelectorAll('#raText .w');
    for (var i = 0; i < spans.length && i < st.ptr; i++) spans[i].classList.add('said');
  }

  /* ---- speech-recognition path ------------------------------------------ */
  function startSpeech(SR) {
    try { rec = new SR(); } catch (e) { return startHonor(); }
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
    var startBtn = body.querySelector('#raStart'); if (startBtn) { startBtn.textContent = 'Listening\u2026'; startBtn.disabled = true; }
    rec.onerror = function (e) {
      if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { stopRec(); startHonor(true); }
    };
    rec.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var heard = toWords(e.results[i][0].transcript);
        for (var j = 0; j < heard.length; j++) advance(heard[j]);
      }
      var cov = st.words.length ? st.ptr / st.words.length : 0;
      setProgress(cov); markWords();
      if (cov >= COVERAGE_MIN && !st.done) { st.done = true; stopRec(); complete(cov); }
    };
    rec.onend = function () { if (!st || st.done) return; /* stopped early */ };
    try { rec.start(); } catch (e) { startHonor(); }
  }
  function advance(word) {
    // match against the next expected word, tolerating a small look-ahead for misrecognitions
    for (var k = 0; k < 3 && st.ptr + k < st.words.length; k++) {
      if (st.words[st.ptr + k] === word) { st.ptr = st.ptr + k + 1; return; }
    }
  }
  function stopRec() { if (rec) { try { rec.onresult = rec.onerror = rec.onend = null; rec.stop(); } catch (e) {} rec = null; } }

  /* ---- honor-mode path --------------------------------------------------- */
  function startHonor(fromDenied) {
    var minMs = Math.max(4000, st.words.length * 360);   // ~natural reading pace
    var t0 = (performance && performance.now) ? performance.now() : Date.now();
    var btn = body.querySelector('#raStart');
    if (btn) { btn.textContent = 'Reading\u2026'; btn.disabled = true; }
    if (fromDenied) { var h = body.querySelector('.ra-hint'); if (h) h.textContent = 'Mic not available \u2014 honour mode: read it through at a natural pace.'; }
    var spans = body.querySelectorAll('#raText .w'), total = spans.length;
    var iv = setInterval(function () {
      var el = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
      var cov = Math.min(1, el / minMs);
      setProgress(cov);
      var upto = Math.floor(cov * total);
      for (var i = 0; i < upto; i++) spans[i].classList.add('said');
      if (cov >= 1 && !st.done) { st.done = true; clearInterval(iv); complete(1); }
    }, 120);
  }

  /* ---- complete ---------------------------------------------------------- */
  async function complete(coverage) {
    loading('Weighing your reading');
    var res = await api('/readaloud/complete', { method:'POST', body: JSON.stringify({ session: st.session, coverage: coverage, words: st.words.length }) });
    if (!res.ok || !res.body) return err((res.body && res.body.error) || 'Could not score the reading.');
    var r = res.body;
    if (!r.completed) { renderReady(); var h = body.querySelector('.ra-hint'); if (h) { h.textContent = 'Not quite \u2014 read a bit more of the passage, then finish.'; } return; }
    body.innerHTML =
      '<div class="ra-center">'
      + '<p class="ra-eyebrow">' + (r.credited > 0 ? 'Earned' : 'Read complete') + '</p>'
      + '<div class="ra-credit">' + GLYPH + ' ' + (r.credited || 0) + ' ET</div>'
      + '<p class="ra-pct" style="text-align:center">Balance ' + GLYPH + ' ' + (r.balance != null ? r.balance : '\u2014') + ' ET \u00b7 read #' + (r.readsToday || 1) + ' today</p>'
      + (r.capReached ? '<p class="ra-note">You\u2019ve earned today\u2019s reads for this passage \u2014 keep practising; more comes back tomorrow, and the community pool is coming.</p>'
                      : '<p class="ra-note">Read it again for a little more \u2014 the reward eases each time, then refreshes tomorrow.</p>')
      + '<div class="ra-row" style="justify-content:center;margin-top:16px"><button class="ra-btn" id="raAgain">Read again</button><button class="ra-btn ghost" id="raDone">Done</button></div>'
      + '</div>';
    bind('#raDone','click',close);
    bind('#raAgain','click', function () { var id = st.topicId; open(id); });
    if (window.amentiAuth && typeof window.amentiAuth.refresh === 'function') { try { window.amentiAuth.refresh(); } catch (e) {} }
  }

  window.amentiReadAloud = { open: open, close: close };
})();
