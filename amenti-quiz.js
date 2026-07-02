/* ===========================================================================
   amenti-quiz.js — the new quiz client (drives the amenti-mint v2 Worker)
   ---------------------------------------------------------------------------
   Self-contained, like amenti-auth.js. Drop two script tags before </body>
   (supabase-js + amenti-auth.js already load the auth client), then this file.

   It:
     • reads the signed-in user's token via window.amentiAuth.sb.auth.getSession()
     • POST /quiz/start -> gateway (intro + ~100-word read) + questions (no answers)
       + a server-signed session
     • renders the mixed question spectrum: timed MC (live countdown), cloze,
       untimed comprehension MC, and the philosophical closer (textarea)
     • tracks per-question timing in the browser (the Worker validates it)
     • POST /quiz/submit -> shows the real result: points per question, mastery
       bonus, credited ◈ ET, new balance; then refreshes the balance pill
     • takes over the roster cards, retiring the old inline 5/5 quiz

   Wiring topics to cards: a card may carry  data-topic="caesar-rubicon".
   Cards with no data-topic open the default topic. Add more topics to the
   Worker, then set data-topic on the matching cards — no change here needed.

   TO RETIRE THE OLD QUIZ: this file intercepts roster-card clicks in the
   capture phase, so it wins over the old handler. You can also delete the old
   quiz <script>/markup from page1.html when convenient.
   =========================================================================== */
(function () {
  'use strict';

  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL) || 'https://amenti-mint.ingram-ian.workers.dev';
  var DEFAULT_TOPIC = 'caesar-rubicon';
  var GLYPH = '\u25C8'; // ◈

  /* ---- styles (scoped aq-*, matches the gold/neon register) -------------- */
  var css = ''
    + '.aq-overlay{position:fixed;inset:0;z-index:3000;display:none;align-items:center;justify-content:center;padding:24px;'
    +   'background:rgba(5,5,10,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:"Share Tech Mono",ui-monospace,monospace}'
    + '.aq-overlay.on{display:flex}'
    + '.aq-box{position:relative;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;background:#0e0e15;color:#e8e8ea;'
    +   'border:1px solid #d4a017;clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);padding:30px 32px}'
    + '.aq-x{position:absolute;top:10px;right:16px;background:none;border:none;color:#9a9aa6;font-size:22px;cursor:pointer;line-height:1}'
    + '.aq-x:hover{color:#fff}'
    + '.aq-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#00ffe0;margin:0 0 4px}'
    + '.aq-title{font-size:22px;letter-spacing:.03em;color:#d4a017;margin:0 0 4px}'
    + '.aq-sub{font-size:11px;letter-spacing:.16em;color:#6c6c78;text-transform:uppercase;margin:0 0 18px}'
    + '.aq-intro{font-size:15px;line-height:1.6;color:#cfcfd6;margin:0 0 14px}'
    + '.aq-passage{font-size:14px;line-height:1.75;color:#e8e8ea;border-left:2px solid #d4a017;padding:2px 0 2px 16px;margin:0 0 22px;background:linear-gradient(90deg,rgba(212,160,23,.06),transparent)}'
    + '.aq-progress{font-size:11px;letter-spacing:.14em;color:#00ffe0;margin:0 0 4px}'
    + '.aq-badge{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:2px 8px;border:1px solid #2a3444;border-radius:10px;color:#9a9aa6;margin:0 6px 0 0}'
    + '.aq-badge.timed{border-color:#00ffe0;color:#00ffe0}'
    + '.aq-q{font-size:18px;line-height:1.45;color:#fff;margin:10px 0 18px}'
    + '.aq-opts{display:flex;flex-direction:column;gap:10px}'
    + '.aq-opt{font-size:14px;text-align:left;color:#e8e8ea;background:#0a0a0f;border:1px solid #2a3444;padding:13px 15px;cursor:pointer;transition:.15s;font-family:inherit}'
    + '.aq-opt:hover{border-color:#d4a017;color:#fff}'
    + '.aq-input{width:100%;font-family:inherit;font-size:15px;color:#fff;background:#0a0a0f;border:1px solid #2a3444;padding:13px 15px;margin:0 0 14px}'
    + '.aq-input:focus{outline:none;border-color:#d4a017}'
    + '.aq-ta{width:100%;min-height:96px;resize:vertical;font-family:inherit;font-size:14px;line-height:1.5;color:#fff;background:#0a0a0f;border:1px solid #2a3444;padding:13px 15px;margin:0 0 6px}'
    + '.aq-ta:focus{outline:none;border-color:#d4a017}'
    + '.aq-count{font-size:11px;color:#6c6c78;margin:0 0 14px;text-align:right}'
    + '.aq-btn{font-family:inherit;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#0a0a0f;background:#d4a017;border:none;padding:12px 22px;cursor:pointer}'
    + '.aq-btn:hover{background:#e6b52a}'
    + '.aq-btn.ghost{background:transparent;color:#9a9aa6;border:1px solid #2a3444}'
    + '.aq-btn.ghost:hover{color:#fff;border-color:#d4a017}'
    + '.aq-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}'
    + '.aq-clock{height:5px;background:#1b2230;margin:0 0 18px;overflow:hidden}'
    + '.aq-clock > i{display:block;height:100%;background:#00ffe0;width:100%;transition:width .1s linear}'
    + '.aq-clock.warn > i{background:#ff5a5a}'
    + '.aq-hint{font-size:11px;letter-spacing:.1em;color:#00ffe0;margin:0 0 12px}'
    + '.aq-center{text-align:center}'
    + '.aq-credit{font-size:40px;color:#d4a017;margin:8px 0 2px;letter-spacing:.04em}'
    + '.aq-balance{font-size:12px;letter-spacing:.14em;color:#9a9aa6;text-transform:uppercase;margin:0 0 18px}'
    + '.aq-mastery{display:inline-block;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#00ffe0;border:1px dashed #00ffe0;padding:6px 12px;margin:0 0 16px}'
    + '.aq-res{text-align:left;border-top:1px solid #1b2230;margin-top:8px}'
    + '.aq-res .r{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #1b2230;font-size:13px}'
    + '.aq-res .r .lab{color:#cfcfd6}'
    + '.aq-res .r .pts{color:#d4a017;white-space:nowrap}'
    + '.aq-res .r.ok .mark{color:#4ade80}.aq-res .r.no .mark{color:#ff5a5a}.aq-res .r.pend .mark{color:#9a9aa6}'
    + '.aq-msg{font-size:15px;line-height:1.6;color:#cfcfd6;text-align:center;padding:14px 0}'
    + '.aq-load{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#00ffe0;text-align:center;padding:30px 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- overlay shell ----------------------------------------------------- */
  var overlay = document.createElement('div');
  overlay.className = 'aq-overlay';
  overlay.innerHTML = '<div class="aq-box"><button class="aq-x" aria-label="Close">\u2715</button><div class="aq-body"></div></div>';
  document.body.appendChild(overlay);
  var boxBody = overlay.querySelector('.aq-body');
  overlay.querySelector('.aq-x').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

  function open2() { overlay.classList.add('on'); }
  function close() { overlay.classList.remove('on'); clearClock(); state = null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---- auth + api -------------------------------------------------------- */
  async function getToken() {
    try {
      var a = window.amentiAuth; if (!a || !a.sb) return null;
      var res = await a.sb.auth.getSession();
      return res && res.data && res.data.session ? res.data.session.access_token : null;
    } catch (e) { return null; }
  }
  async function api(path, opts) {
    var token = await getToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var r = await fetch(MINT + path, Object.assign({ headers: headers }, opts || {}));
    var body = null; try { body = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, body: body };
  }

  /* ---- state + clock ----------------------------------------------------- */
  var state = null, clockTimer = null;
  function clearClock() { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }

  /* ---- open a topic ------------------------------------------------------ */
  async function open(topicId) {
    topicId = topicId || DEFAULT_TOPIC;
    open2(); renderLoading('Opening the gateway');
    var token = await getToken();
    if (!token) return renderSignIn();
    var res = await api('/quiz/start', { method: 'POST', body: JSON.stringify({ topicId: topicId }) });
    if (!res.ok || !res.body || !res.body.topic) return renderError((res.body && res.body.error) || 'Could not start this quiz.');
    state = { session: res.body.session, topic: res.body.topic, idx: 0, answers: {}, timings: {}, qStart: 0 };
    renderGateway();
  }

  /* ---- screens ----------------------------------------------------------- */
  function renderLoading(msg) { boxBody.innerHTML = '<div class="aq-load">' + esc(msg || 'Loading') + ' \u2026</div>'; }
  function renderError(msg) { boxBody.innerHTML = '<div class="aq-msg">' + esc(msg) + '</div><div class="aq-center"><button class="aq-btn ghost" id="aqClose">Close</button></div>'; bind('#aqClose', 'click', close); }
  function renderSignIn() {
    boxBody.innerHTML = '<p class="aq-eyebrow">Emerald Tokens</p><div class="aq-msg">Sign in to take the quiz and earn ' + GLYPH + ' ET.</div>'
      + '<div class="aq-center aq-row" style="justify-content:center"><button class="aq-btn" id="aqSignin">Sign in</button><button class="aq-btn ghost" id="aqClose">Not now</button></div>';
    bind('#aqClose', 'click', close);
    bind('#aqSignin', 'click', function () {
      close();
      var b = document.querySelector('.mn-signin, .nav-signin, .footer-signin, [data-signin]');
      if (b) b.click();
    });
  }

  function renderGateway() {
    var t = state.topic;
    boxBody.innerHTML =
      '<p class="aq-eyebrow">' + esc(t.era || 'Amenti') + '</p>'
      + '<h2 class="aq-title">' + esc(t.title) + '</h2>'
      + '<p class="aq-sub">The read \u00b7 then ' + t.questions.length + ' questions</p>'
      + (t.intro ? '<p class="aq-intro">' + esc(t.intro) + '</p>' : '')
      + (t.passage ? '<p class="aq-passage">' + esc(t.passage) + '</p>' : '')
      + '<p class="aq-hint">Read it once \u2014 the answers are in the passage.</p>'
      + '<div class="aq-center aq-row" style="justify-content:flex-start"><button class="aq-btn" id="aqBegin">Begin</button></div>';
    bind('#aqBegin', 'click', function () { state.idx = 0; renderQuestion(); });
  }

  function renderQuestion() {
    clearClock();
    var t = state.topic, q = t.questions[state.idx], n = t.questions.length;
    var head = '<p class="aq-progress">Question ' + (state.idx + 1) + ' / ' + n + '</p>'
      + '<div>' + cognBadge(q) + (q.timed ? '<span class="aq-badge timed">Timed</span>' : '') + '</div>';
    var clock = q.timed ? '<div class="aq-clock" id="aqClock"><i></i></div>' : '';
    var body = '';

    if (q.answerType === 'mc') {
      body = '<div class="aq-opts">' + q.options.map(function (o, i) {
        return '<button class="aq-opt" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else if (q.answerType === 'cloze') {
      body = '<input class="aq-input" id="aqIn" autocomplete="off" placeholder="' + esc(q.placeholder || 'type your answer') + '">'
        + '<div class="aq-center aq-row" style="justify-content:flex-start"><button class="aq-btn" id="aqNext">Submit</button></div>';
    } else { // paragraph / philosophical
      body = '<textarea class="aq-ta" id="aqTa" placeholder="Make your case\u2026"></textarea>'
        + '<div class="aq-count" id="aqCount">0' + (q.wordLimit ? ' / ' + q.wordLimit + ' words' : ' words') + '</div>'
        + '<p class="aq-hint">Judged on the strength of the argument \u2014 there is no single right answer. (Bonus, reviewed later.)</p>'
        + '<div class="aq-center aq-row" style="justify-content:flex-start"><button class="aq-btn" id="aqNext">Submit</button></div>';
    }

    boxBody.innerHTML = head + '<p class="aq-q">' + esc(q.prompt) + '</p>' + clock + body;

    // wire inputs
    if (q.answerType === 'mc') {
      Array.prototype.forEach.call(boxBody.querySelectorAll('.aq-opt'), function (btn) {
        btn.addEventListener('click', function () { answerAndAdvance(q, Number(btn.dataset.i)); });
      });
    } else if (q.answerType === 'cloze') {
      var inp = boxBody.querySelector('#aqIn'); if (inp) inp.focus();
      bind('#aqNext', 'click', function () { answerAndAdvance(q, (inp && inp.value || '').trim()); });
      if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') answerAndAdvance(q, inp.value.trim()); });
    } else {
      var ta = boxBody.querySelector('#aqTa'), cnt = boxBody.querySelector('#aqCount');
      if (ta) ta.addEventListener('input', function () {
        var w = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
        cnt.textContent = w + (q.wordLimit ? ' / ' + q.wordLimit + ' words' : ' words');
      });
      bind('#aqNext', 'click', function () { answerAndAdvance(q, (ta && ta.value || '').trim()); });
    }

    state.qStart = now();
    if (q.timed) startClock(q);
  }

  function renderResult(r) {
    clearClock();
    var credited = r.credited || 0;
    var lines = (r.results || []).map(function (x) {
      var cls = x.pending ? 'pend' : (x.correct ? 'ok' : 'no');
      var mark = x.pending ? '\u25CB' : (x.correct ? '\u2713' : '\u2717');
      var right = x.pending ? 'pending' : (GLYPH + ' ' + x.points + ' ET' + (x.tier && x.correct ? '  \u00b7 ' + x.tier : ''));
      return '<div class="r ' + cls + '"><span class="lab"><span class="mark">' + mark + '</span> ' + prettyId(x.id) + '</span><span class="pts">' + right + '</span></div>';
    }).join('');
    boxBody.innerHTML =
      '<div class="aq-center">'
      + '<p class="aq-eyebrow">' + (credited > 0 ? 'Earned' : 'Result') + '</p>'
      + '<div class="aq-credit">' + GLYPH + ' ' + credited + ' ET</div>'
      + '<p class="aq-balance">Balance ' + GLYPH + ' ' + (r.balance != null ? r.balance : '\u2014') + ' ET'
      +   ' \u00b7 ' + (r.correct || 0) + '/' + (r.autoTotal || 0) + ' correct</p>'
      + (r.mastery ? '<div class="aq-mastery">\u25C6 Mastery \u2014 clean sweep bonus</div>' : '')
      + '</div>'
      + '<div class="aq-res">' + lines + '</div>'
      + (credited === 0 && !hasNew(r) ? '<p class="aq-hint" style="margin-top:14px">Already earned on a previous run \u2014 tokens are paid once per question.</p>' : '')
      + '<div class="aq-center aq-row" style="justify-content:center;margin-top:20px"><button class="aq-btn" id="aqDone">Done</button></div>';
    bind('#aqDone', 'click', close);
    if (window.amentiAuth && typeof window.amentiAuth.refresh === 'function') { try { window.amentiAuth.refresh(); } catch (e) {} }
  }
  function hasNew(r) { return (r.results || []).some(function (x) { return x.points > 0; }); }

  /* ---- answering + timing ------------------------------------------------ */
  function answerAndAdvance(q, value) {
    clearClock();
    if (value !== undefined && value !== '' && value !== null && !(typeof value === 'number' && isNaN(value))) {
      state.answers[q.id] = value;
    }
    state.timings[q.id] = Math.round(now() - state.qStart);
    state.idx++;
    if (state.idx < state.topic.questions.length) renderQuestion();
    else submit();
  }
  async function submit() {
    renderLoading('Weighing your answers');
    var res = await api('/quiz/submit', { method: 'POST', body: JSON.stringify({ session: state.session, answers: state.answers, timings: state.timings }) });
    if (!res.ok || !res.body) return renderError((res.body && res.body.error) || 'Could not score this quiz.');
    renderResult(res.body);
  }

  /* ---- timed clock ------------------------------------------------------- */
  function startClock(q) {
    var full = (q.tiers && q.tiers.full ? q.tiers.full : 5) * 1000;
    var partial = (q.tiers && q.tiers.partial ? q.tiers.partial : 20) * 1000;
    var el = boxBody.querySelector('#aqClock'), bar = el ? el.querySelector('i') : null;
    var start = now();
    clockTimer = setInterval(function () {
      var t = now() - start, left = Math.max(0, partial - t);
      if (bar) bar.style.width = (left / partial * 100) + '%';
      if (el) { if (t > full) el.classList.add('warn'); else el.classList.remove('warn'); }
      if (left <= 0) { clearClock(); answerAndAdvance(q, undefined); } // time up -> no answer
    }, 100);
  }

  /* ---- little helpers ---------------------------------------------------- */
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function bind(sel, ev, fn) { var el = boxBody.querySelector(sel); if (el) el.addEventListener(ev, fn); }
  function cognBadge(q) {
    var map = { who:'Recall', what:'Recall', when:'Recall', where:'Recall', why:'Reasoning', how:'Reasoning', evaluate:'Judgment' };
    return '<span class="aq-badge">' + (map[q.cognitive] || 'Question') + '</span>';
  }
  function prettyId(id) { return String(id).replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  /* ---- take over the roster cards (retires the old quiz) ----------------- */
  function wireRoster() {
    var cards = document.querySelectorAll('.roster-card, .rc-cta');
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('click', function (e) {
        var host = card.closest ? (card.closest('.roster-card') || card) : card;
        var topic = host.getAttribute('data-topic') || DEFAULT_TOPIC;
        e.preventDefault(); e.stopPropagation();
        open(topic);
      }, true); // capture -> beats the old handler
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireRoster);
  else wireRoster();

  /* ---- expose ------------------------------------------------------------ */
  window.amentiQuiz = { open: open, close: close, wireRoster: wireRoster };
})();
