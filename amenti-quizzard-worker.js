/* ===========================================================================
   amenti-quizzard — THE ENGINE
   ---------------------------------------------------------------------------
   BUILT      2026-07-20 · 08:20 UTC
   REVISION   v4 · four artifacts, three modes, the patrol
   AMENTI.LIVE · Ingram Manor LLC

   Takes one name. Returns a validated quiz, or an honest refusal — and now a
   character sheet and a portrait alongside it, from the same research.

   ROUTES
     GET  /                    the bridge, served by the engine itself
     GET  /health              { ok, service, version }
     POST /quizzard/run        { figure, mode?, depth?, commit? }  [x-admin-secret]
     POST /quizzard/patrol     one pass down the queue              [x-admin-secret]
     GET  /quizzard/queue      the magazine, the halts, what is next[x-admin-secret]
     cron scheduled()          the same patrol, unattended

   THE THREE MODES
     life    verify a LIFE against the historical record          ~850 figures
     canon   verify what a TRADITION says, never that it happened  ~150 figures
     source  QUOTE the figure's own writing, string-matched         21 figures

   THE FOUR ARTIFACTS, FOUR VERDICTS
     quiz      six questions and a verified passage    — ONLY THIS CAN HALT
     sheet     stats, abilities, bio, voice, quote     — refused alone
     portrait  a house-style SVG, nothing executable   — refused alone
     sources   what survives of their own writing      — carried where it exists

     A good quiz with an unusable drawing ships the quiz. The card shows a badge
     instead of a face and looks perfectly well doing it. Losing a researched
     quiz because a path was malformed is the worst trade available here, and
     this engine has made it once — Paul the Apostle and Cai Lun, 20 July.

   WHAT IT WRITES, AND WHAT IT CANNOT DO
     Everything lands status='staged'. The engine can fill the table and cannot
     put a single quiz in front of a seeker. That gap is the review gate, and it
     is the only reason letting a machine run unwatched is defensible.

   HOW VERIFICATION ACTUALLY HAPPENS
     The model is called WITH THE WEB SEARCH TOOL ENABLED. This is the
     load-bearing detail of the entire build: a model writing from memory is
     precisely the fabrication risk the whole doctrine exists to prevent.
     Search is what makes Step 3 real rather than decorative.

   THE VALIDATOR IS NOT A REVIEW — IT IS A PARSER
     Every returned quiz is checked against the invariant in this Worker,
     not in the model. A quiz that fails any line never reaches the table.
     One retry is allowed, with the failure fed back. Then it halts.

   A HALT IS A SUCCESS.
     The engine that cannot say no will eventually say something false.

   ISOLATION
     This Worker holds ANTHROPIC_API_KEY. It is NOT the mint. It never
     touches the ledger. It writes to exactly one table, and only when told.

   SECRETS (Cloudflare -> Settings -> Variables):
     ANTHROPIC_API_KEY   required
     SUPABASE_SECRET     required for commit + duplicate checks
     ADMIN_PASSWORD      optional; SUPABASE_SECRET also works as the admin cred
     MODEL               optional; defaults below
   =========================================================================== */

const SUPABASE_URL = 'https://bhgnkfsatmcnhqksybpa.supabase.co';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 8000;
const MAX_ATTEMPTS = 3;   /* it converges but slowly: a Douglass run went 211
                             words, then 170, against a 165 ceiling — five short,
                             out of attempts. The third try is cheap; a lost quiz
                             that was nearly right is not. */

/* ===========================================================================
   THE BRIDGE, SERVED BY THE ENGINE ITSELF
   ---------------------------------------------------------------------------
   The console used to be a file you downloaded. That meant two copies could
   drift — and they did: a stale download had no batch panel, so nine names
   pasted into a single-line field arrived as one sixteen-word figure.
   A tool that can be out of date is a tool that will be. So the Worker now
   serves its own console at GET /. Nothing to download, nothing to keep in
   step, and it always matches the engine it is driving.
   It holds no secret; every action still requires the admin credential.
   =========================================================================== */
const BRIDGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE QUIZZARD · Bridge</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Special+Elite&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet">
<!-- ============================================================================
     quizzard-bridge.html  ·  A TOOL, NOT A PANE
     ----------------------------------------------------------------------------
     Puts one name to the engine and shows exactly what comes back — the quiz,
     the sources it rested on, the searches it ran, and the cost.
     Open locally. The admin secret is held in memory only. Do not commit.
     ============================================================================ -->
<style>
:root{
  --gold:#d4a017; --gold-b:#f5c542; --neon:#00ffe0; --term:#80ffc0; --violet:#c4a5ff;
  --ink:#08090e; --granite:#11131c; --slate:#232838; --wire:#343b52;
  --text:#c8ccdc; --dim:#8f95ab; --red:#f87171; --amber:#fbbf24;
  --mono:'Share Tech Mono',monospace; --body:'Rajdhani',sans-serif; --elite:'Special Elite',cursive;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);font-family:var(--body);font-weight:300;font-size:17px;line-height:1.6}
main{max-width:940px;margin:0 auto;padding:38px 22px 90px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.3em;color:var(--neon);text-transform:uppercase;margin:0 0 8px}
h1{font-family:var(--elite);font-size:clamp(26px,5vw,40px);color:var(--gold-b);margin:0 0 4px}
.sub{font-style:italic;color:var(--dim);margin:0 0 24px}
.card{border:1px solid var(--slate);border-radius:10px;background:var(--granite);padding:18px 20px;margin:14px 0}
label{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:6px}
input[type=text],input[type=password]{width:100%;font-family:var(--mono);font-size:15px;color:#fff;background:#0a0b11;
  border:1px solid var(--wire);padding:11px 12px;border-radius:4px}
input:focus{outline:none;border-color:var(--gold)}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
button{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;border:none;
  padding:12px 18px;border-radius:4px;cursor:pointer;transition:.15s}
.go{background:var(--gold);color:#08090e} .go:hover{background:var(--gold-b)}
.ghost{background:transparent;color:var(--term);border:1px solid var(--term)}
.ghost:hover{background:rgba(128,255,192,.1)}
button:disabled{opacity:.4;cursor:not-allowed}
.chk{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--dim)}
.chk.canon{color:#b87333}
.chk.canon input{accent-color:#b87333}
.chk.canon select{font-family:var(--mono);font-size:11px;background:#0a0b11;color:#b87333;
  border:1px solid #4a3524;border-radius:3px;padding:4px 6px;margin-left:6px}
.verdict{font-family:var(--mono);font-size:13.5px;letter-spacing:.04em;padding:13px 15px;border-radius:6px;margin-top:14px;display:none;line-height:1.7}
.verdict.ok{display:block;background:rgba(128,255,192,.08);border:1px solid var(--term);color:var(--term)}
.verdict.halt{display:block;background:rgba(251,191,36,.08);border:1px solid var(--amber);color:var(--amber)}
.verdict.bad{display:block;background:rgba(248,113,113,.08);border:1px solid var(--red);color:var(--red)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:12px;display:none}
.stats.on{display:grid}
.st{border:1px solid var(--wire);border-radius:5px;background:#0a0b11;padding:9px 10px;text-align:center}
.st .n{font-family:var(--elite);font-size:19px;color:var(--gold-b)}
.st .l{font-family:var(--mono);font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--dim);margin-top:3px}
.quiz{display:none;margin-top:16px}
.quiz.on{display:block}
.qhead{border-bottom:1px solid var(--slate);padding-bottom:12px;margin-bottom:12px}
.qtitle{font-family:var(--elite);font-size:22px;color:var(--gold-b)}
.qmeta{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:4px}
.qpass{font-size:15px;line-height:1.7;border-left:2px solid var(--gold);padding-left:14px;margin:12px 0;color:var(--text)}
.q{border-top:1px solid #171d29;padding:12px 0}
.qb{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px}
.b{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border:1px solid var(--wire);border-radius:9px;color:var(--dim)}
.b.t{border-color:var(--neon);color:var(--neon)} .b.e{border-color:var(--violet);color:var(--violet)}
.qp{font-size:15.5px;color:#fff;margin-bottom:8px}
.o{font-size:13.5px;color:var(--text);background:#0a0b11;border:1px solid var(--wire);padding:8px 10px;border-radius:3px;margin-bottom:5px}
.o.key{border-color:var(--term);box-shadow:inset 2px 0 0 var(--term);color:#fff}
.acc{font-family:var(--mono);font-size:10px;color:var(--term)}
.src{font-family:var(--mono);font-size:11px;color:var(--neon);word-break:break-all;padding:3px 0}
pre{background:#0a0b11;border:1px solid var(--wire);border-radius:6px;padding:12px;overflow-x:auto;
  font-family:var(--mono);font-size:11.5px;color:#d3dcf0;white-space:pre-wrap;word-break:break-word;max-height:340px}
textarea{width:100%;font-family:var(--mono);font-size:14px;color:#fff;background:#0a0b11;
  border:1px solid var(--wire);padding:11px 12px;border-radius:4px;resize:vertical;line-height:1.6}
textarea:focus{outline:none;border-color:var(--gold)}
.brow{display:grid;grid-template-columns:20px 1fr auto;gap:9px;align-items:center;
  border-bottom:1px solid #171d29;padding:8px 2px;font-size:14.5px}
.brow:last-child{border-bottom:none}
.bmark{font-family:var(--mono);font-size:13px;text-align:center}
.bmark.wait{color:#4a5060} .bmark.run{color:var(--neon)} .bmark.ok{color:var(--term)}
.bmark.halt{color:var(--amber)} .bmark.err{color:var(--red)}
.bnote{font-family:var(--mono);font-size:10.5px;color:var(--dim);text-align:right;letter-spacing:.05em}
details{margin-top:12px} summary{cursor:pointer;font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--dim)}
.warn{font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;color:var(--amber);margin-top:12px;line-height:1.7}
</style>
</head>
<body>
<main>
  <p class="eyebrow">Amenti · The Engine</p>
  <h1>Quizzard Bridge</h1>
  <p class="sub">One name in. A verified quiz, or an honest refusal, out.</p>

  <div class="card">
    <label for="pw">Admin secret</label>
    <input id="pw" type="password" placeholder="held in memory only" autocomplete="off">
    <div class="row"><button class="ghost" id="btnPing">Ping the engine</button></div>
  </div>

  <div class="card">
    <label for="fig">Figure</label>
    <input id="fig" type="text" placeholder="e.g. Nikola Tesla" autocomplete="off">
    <div class="row">
      <button class="go" id="btnRun">▸ Run</button>
      <label class="chk"><input type="checkbox" id="commit"> write to table as staged</label>
      <label class="chk canon">mode
        <select id="mode">
          <option value="life">life — the record</option>
          <option value="canon">canon — the tradition</option>
          <option value="source">source — the reading room</option>
        </select></label>
      <label class="chk canon">depth
        <select id="depth">
          <option value="1">1 — the entry</option>
          <option value="2">2 — another charge</option>
          <option value="3">3 — the contested</option>
        </select></label>
    </div>
    <div class="verdict" id="verdict"></div>
    <div class="stats" id="stats"></div>
    <div class="quiz" id="quiz"></div>
    <details><summary>raw response</summary><pre id="raw">—</pre></details>
    <p class="warn">Each run costs money and takes 30–90 seconds while it searches.<br>
    Leave "write to table" unticked until you trust what comes back.</p>
  </div>

  <div class="card">
    <label for="batch">Batch — one figure per line</label>
    <textarea id="batch" rows="9" spellcheck="false"
      placeholder="Cleopatra&#10;Nikola Tesla&#10;Tacitus"></textarea>
    <div class="row">
      <button class="go" id="btnBatch">▸ Run batch</button>
      <label class="chk"><input type="checkbox" id="bcommit"> write each to table as staged</label>
      <label class="chk canon">mode
        <select id="bmodesel">
          <option value="life">life — the record</option>
          <option value="canon">canon — the tradition</option>
          <option value="source">source — the reading room</option>
        </select></label>
      <label class="chk canon">depth
        <select id="bdepth">
          <option value="1">1 — the entry</option>
          <option value="2">2 — another charge</option>
          <option value="3">3 — the contested</option>
        </select></label>
      <button class="ghost" id="btnStop">Stop</button>
    </div>
    <div class="verdict" id="bverdict"></div>
    <div id="blist"></div>
    <p class="warn">Runs strictly one at a time, in the browser — no Worker timeout, and you
    can stop between figures. A halt is not a failure; it means the engine refused to invent.</p>
  </div>

  <div class="card">
    <label>The deck — figures with a quiz and no card</label>
    <div class="row">
      <button class="go" id="btnDeck">&#9656; Fill the deck</button>
      <button class="ghost" id="btnDeckCheck">What is missing</button>
      <label class="chk">write to table as staged<input type="checkbox" id="deckCommit"></label>
    </div>
    <div class="verdict" id="dverdict"></div>
    <div id="dlist"></div>
    <p class="warn">A character only &#8212; sheet and portrait, no quiz. These figures already
    have one; running the full engine on them would write a second nobody asked for.<br>
    About ninety seconds each. The mythic tier is framed as tradition rather than as a life.</p>
  </div>

  <div class="card">
    <label>The patrol — works down the queue on its own</label>
    <div class="row">
      <button class="go" id="btnPatrol">▸ Run one patrol pass</button>
      <button class="ghost" id="btnQueue">Queue status</button>
    </div>
    <div class="verdict" id="pverdict"></div>
    <div id="plist"></div>
    <p class="warn">Takes the next three pending figures by rank, runs each, and records the
    outcome — a topic id, or a halt with its reason. Everything lands STAGED.<br>
    About three minutes. Nothing reaches a seeker until you promote it.</p>
  </div>
</main>

<script>
(function () {
  'use strict';
  var ENGINE = location.origin;   // served by the Worker itself — always in step
  var $ = function (id) { return document.getElementById(id); };
  var verdict = $('verdict'), bverdict = $('bverdict'), stats = $('stats'), quizEl = $('quiz'), raw = $('raw');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function say(kind, msg) { verdict.className = 'verdict ' + kind; verdict.innerHTML = msg; }
  function secret() { var s = $('pw').value.trim(); if (!s) { say('bad', 'Enter the admin secret first.'); return null; } return s; }
  function busy(b) { $('btnRun').disabled = b; $('btnPing').disabled = b; }

  $('btnPing').addEventListener('click', function () {
    var s = secret(); if (!s) return;
    busy(true); say('ok', 'pinging…');
    fetch(ENGINE + '/quizzard/ping', { headers: { 'x-admin-secret': s } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        raw.textContent = JSON.stringify(d, null, 2);
        if (d.ok) say('ok', 'Engine answers. Model: ' + esc(d.model) + ' — reply: "' + esc(d.reply) + '"');
        else say('bad', 'Engine reached but the model refused: ' + esc(d.error));
      })
      .catch(function (e) { say('bad', 'Could not reach the engine. ' + esc(e)); })
      .finally(function () { busy(false); });
  });

  $('btnRun').addEventListener('click', function () {
    var s = secret(); if (!s) return;
    var figure = $('fig').value.trim();
    if (!figure) { say('bad', 'Enter a figure.'); return; }
    busy(true); stats.className = 'stats'; quizEl.className = 'quiz';
    var m = $('mode').value.toUpperCase();
    say('ok', '<strong>' + m + ' mode.</strong> Researching ' + esc(figure)
      + (m === 'CANON'  ? ' — verifying what the SOURCES SAY, not what happened. A living-sacred figure must fit one of the four approved frames or it halts.'
       : m === 'SOURCE' ? ' — quoting his OWN WRITING from the reading room. The Worker will string-match the passage against the file; a changed word is rejected.'
       : ' — verifying the historical record.'));
    var t0 = Date.now();
    fetch(ENGINE + '/quizzard/run', {
      method: 'POST',
      headers: { 'x-admin-secret': s, 'Content-Type': 'application/json' },
      body: JSON.stringify({ figure: figure, commit: $('commit').checked,
                             mode: $('mode').value, depth: +$('depth').value })
    })
    .then(function (r) { return r.json(); })
    .then(function (d) { raw.textContent = JSON.stringify(d, null, 2); render(d, Date.now() - t0); })
    .catch(function (e) { say('bad', 'Request failed: ' + esc(e)); })
    .finally(function () { busy(false); });
  });

  function render(d, ms) {
    var u = d.usage || {};
    var cells = [
      ['searches', d.searches != null ? d.searches : '—'],
      ['in tokens', u.input_tokens != null ? u.input_tokens : '—'],
      ['out tokens', u.output_tokens != null ? u.output_tokens : '—'],
      ['attempt', d.attempt || '—'],
      ['seconds', Math.round(ms / 1000)]
    ];
    stats.innerHTML = cells.map(function (c) {
      return '<div class="st"><div class="n">' + esc(c[1]) + '</div><div class="l">' + c[0] + '</div></div>';
    }).join('');
    stats.className = 'stats on';

    if (d.status === 'halted') {
      say('halt', '<strong>HALTED — ' + esc(d.reason) + '</strong><br>' + esc(d.note || '')
        + (d.errors ? '<br><br>' + d.errors.map(esc).join('<br>') : '')
        + '<br><br>A halt is the engine working. It refused rather than invent.');
      return;
    }
    if (d.status !== 'done') { say('bad', 'Unexpected: ' + esc(d.error || d.status)); return; }

    say('ok', '<strong>' + esc(d.topic_id) + '</strong> — passed the validator.'
      + (d.alreadyExists ? '<br>Already in the table; not written.' : '')
      + (d.committed ? '<br>Written to the table as <strong>staged</strong>.' : '<br>Not written (tick the box to commit).'));

    var p = d.payload, f = p.facets || {};
    var html = '<div class="qhead"><div class="qtitle">' + esc(p.title) + '</div>'
      + '<div class="qmeta">' + esc(p.era) + ' · ' + esc((f.motif || [])[0] || '') + ' · ' + esc(f.sourceType || '') + '</div></div>'
      + '<div style="font-style:italic;color:#8f95ab">' + esc(p.intro) + '</div>'
      + '<div class="qpass">' + esc(p.passage) + '</div>';

    (p.questions || []).forEach(function (q) {
      var badges = '<span class="b' + (q.cognitive === 'evaluate' ? ' e' : '') + '">' + esc(q.cognitive) + '</span>'
        + '<span class="b">' + esc(q.difficulty) + '</span><span class="b">' + esc(q.answerType) + '</span>'
        + (q.timed ? '<span class="b t">timed</span>' : '');
      html += '<div class="q"><div class="qb">' + badges + '</div><div class="qp">' + esc(q.prompt) + '</div>';
      if (q.answerType === 'mc') {
        html += (q.options || []).map(function (o, i) {
          return '<div class="o' + (i === q.correct ? ' key' : '') + '">' + esc(o) + '</div>'; }).join('');
      } else if (q.answerType === 'cloze') {
        html += '<div class="acc">accepted → ' + esc((q.accepted || []).join(' · ')) + '</div>';
      }
      html += '</div>';
    });

    if ((d.sources || []).length) {
      html += '<div class="q"><div class="qb"><span class="b">sources</span></div>'
        + d.sources.map(function (s) { return '<div class="src">' + esc(s) + '</div>'; }).join('') + '</div>';
    }
    quizEl.innerHTML = html; quizEl.className = 'quiz on';
  }

  $('fig').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btnRun').click(); });

  /* ---- THE PATROL ----------------------------------------------------------
     This was a console command for its first few runs, which is a poor way to
     ask anyone to do a thing twice. It is a button. */
  function psay(kind, msg) {
    var v = $('pverdict'); v.className = 'verdict ' + kind; v.innerHTML = msg;
  }

  $('btnQueue').addEventListener('click', function () {
    var s = secret(); if (!s) return;
    busy(true); psay('ok', 'reading the queue\u2026');
    fetch(ENGINE + '/quizzard/queue', { headers: { 'x-admin-secret': s } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        raw.textContent = JSON.stringify(d, null, 2);
        if (!d.ok) { psay('bad', 'Could not read the queue.'); return; }
        var st = d.status || {};
        psay('ok', '<strong>' + (d.total || 0) + ' figures in the queue.</strong><br>'
          + Object.keys(st).map(function (k) { return st[k] + ' ' + k; }).join(' \u00b7 ')
          + (Object.keys(d.halts || {}).length
              ? '<br>halts: ' + Object.keys(d.halts).map(function (k) { return d.halts[k] + ' ' + k; }).join(' \u00b7 ')
              : ''));
        var up = d.upNext || [];
        $('plist').innerHTML = up.map(function (x) {
          return '<div class="brow"><span class="bmark wait">\u00b7</span>'
               + '<span>' + esc(x.figure_name) + '</span>'
               + '<span class="bnote">' + esc(x.mode) + ' \u00b7 rank ' + esc(x.rank) + '</span></div>';
        }).join('');
      })
      .catch(function (e) { psay('bad', 'Could not reach the engine. ' + esc(e)); })
      .finally(function () { busy(false); });
  });

  /* ---- THE DECK ------------------------------------------------------------
     Sixteen cards show a stranger a name and an empty frame. This finds them
     by asking the ship rather than by carrying a list — a list would be right
     tonight and wrong on Thursday. */
  function dsay(kind, msg) { var v = $('dverdict'); v.className = 'verdict ' + kind; v.innerHTML = msg; }

  async function deckHoles() {
    var t = await fetch(MINT_URL + '/quiz/topics').then(function (r) { return r.json(); });
    var c = await fetch(MINT_URL + '/characters').then(function (r) { return r.json(); });
    if (!t || !t.ok) throw new Error('could not read the library');
    var figures = {}, held = {};
    (t.topics || []).forEach(function (x) {
      var f = x.figure || (x.facets && x.facets.figure && x.facets.figure[0]) || x.title;
      if (f) figures[f] = true;
    });
    if (c && c.ok) (c.characters || []).forEach(function (x) {
      if (x.figure) held[x.figure] = true;
      if (x.name)   held[x.name] = true;
    });
    /* HAND-MADE CHARACTERS ARE NOT IN THE TABLE. The bridge cannot see Page1's
       AMENTI_CHARS, so a figure held only by a hand-made record would look like
       a hole. The engine refuses to overwrite one anyway — characterExists is
       checked before a token is spent — so a false positive here costs a call
       and returns "skipped" rather than doing harm. */
    return Object.keys(figures).filter(function (f) { return !held[f]; }).sort();
  }

  $('btnDeckCheck').addEventListener('click', function () {
    busy(true); dsay('ok', 'asking the ship\u2026');
    deckHoles().then(function (holes) {
      dsay(holes.length ? 'halt' : 'ok', holes.length
        ? '<strong>' + holes.length + ' figure(s)</strong> have a quiz and no character row.'
        : 'Every figure with a quiz has a character.');
      $('dlist').innerHTML = holes.map(function (f) {
        return '<div class="brow"><span class="bmark wait">\u00b7</span><span>' + esc(f) + '</span></div>';
      }).join('');
    }).catch(function (e) { dsay('bad', esc(e.message)); })
      .finally(function () { busy(false); });
  });

  $('btnDeck').addEventListener('click', async function () {
    var s = secret(); if (!s) return;
    var commit = $('deckCommit').checked;
    busy(true); $('dlist').innerHTML = '';
    dsay('ok', 'finding the holes\u2026');
    var holes;
    try { holes = await deckHoles(); }
    catch (e) { dsay('bad', esc(e.message)); busy(false); return; }
    if (!holes.length) { dsay('ok', 'Nothing to fill.'); busy(false); return; }

    var done = 0, halted = 0;
    for (var i = 0; i < holes.length; i++) {
      var f = holes[i];
      dsay('ok', 'writing ' + esc(f) + ' \u2014 ' + (i + 1) + ' of ' + holes.length
        + ' \u00b7 ' + done + ' done, ' + halted + ' halted');
      var mode = /^(Apollo|Isis|Enki|Minerva|Mars|Venus|Vulcan|Neptune|Ceres|Bacchus|Diana|Muhammad|Jesus Christ|Gautama Buddha)$/.test(f)
        ? 'canon' : 'life';
      var out = null;
      try {
        var r = await fetch(ENGINE + '/quizzard/character', {
          method: 'POST',
          headers: { 'x-admin-secret': s, 'Content-Type': 'application/json' },
          body: JSON.stringify({ figure: f, mode: mode, commit: commit })
        });
        out = await r.json();
      } catch (e) { out = { status: 'error', error: String(e) }; }
      raw.textContent = JSON.stringify(out, null, 2);

      var ok = out && out.status === 'done';
      if (ok) done++; else halted++;
      $('dlist').insertAdjacentHTML('beforeend',
        '<div class="brow"><span class="bmark ' + (ok ? 'ok' : 'halt') + '">'
        + (ok ? '\u2713' : '\u25CB') + '</span><span>' + esc(f) + '</span>'
        + '<span class="bnote">' + esc(ok
            ? (out.portrait ? out.portraitBytes + ' byte portrait' : 'sheet only \u2014 no face')
            : ((out && out.reason) || 'error') + ((out && out.errors) ? ' \u00b7 ' + out.errors[0].slice(0,80) : ''))
        + '</span></div>');
      if (stopped) { dsay('halt', 'stopped at ' + (i + 1) + ' of ' + holes.length); break; }
    }
    dsay(halted ? 'halt' : 'ok', '<strong>Deck run finished.</strong> ' + done + ' written \u00b7 '
      + halted + ' halted' + (commit ? '<br>Promote them in Supabase when you have read them.' : ''));
    busy(false);
  });

  $('btnPatrol').addEventListener('click', function () {
    var s = secret(); if (!s) return;
    busy(true);
    psay('ok', 'The patrol is running \u2014 three figures, about three minutes. '
      + 'Leave this tab open.');
    $('plist').innerHTML = '';
    var t0 = Date.now();
    fetch(ENGINE + '/quizzard/patrol', {
      method: 'POST', headers: { 'x-admin-secret': s, 'Content-Type': 'application/json' }, body: '{}'
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        raw.textContent = JSON.stringify(d, null, 2);
        var run = d.run || {};
        var res = run.results || [];
        $('plist').innerHTML = res.map(function (x) {
          var cls = x.outcome === 'done' ? 'ok' : x.outcome === 'halted' ? 'halt' : 'err';
          var sym = x.outcome === 'done' ? '\u2713' : x.outcome === 'halted' ? '\u25CB' : '\u2717';
          var note = x.outcome === 'done' ? (x.topic_id + (x.committed ? ' \u00b7 staged' : ' \u00b7 not written'))
                   : x.outcome === 'halted' ? ('halted \u00b7 ' + (x.reason || '?')
                       + (x.errors && x.errors.length ? ' \u00b7 ' + x.errors[0] : ''))
                   : (x.note || 'error');
          return '<div class="brow"><span class="bmark ' + cls + '">' + sym + '</span>'
               + '<span>' + esc(x.figure_name || x.figure) + '</span>'
               + '<span class="bnote">' + esc(note) + '</span></div>';
        }).join('');
        psay(run.errored ? 'bad' : (run.halted ? 'halt' : 'ok'),
          '<strong>Patrol finished.</strong> ' + (run.done || 0) + ' written \u00b7 '
          + (run.halted || 0) + ' halted \u00b7 ' + (run.errored || 0) + ' errored'
          + ' \u00b7 ' + Math.round((Date.now() - t0) / 1000) + 's'
          + (run.done ? '<br>Promote them in Supabase when you have read them.' : ''));
      })
      .catch(function (e) { psay('bad', 'Patrol failed: ' + esc(e)); })
      .finally(function () { busy(false); });
  });

  /* ---- BATCH ---------------------------------------------------------------
     Sequential, in the browser. Nine model calls in one Worker request would
     blow past the invocation limit; nine requests one after another will not.
     It also means progress is visible and the run can be stopped mid-way. */
  /* THE SEPARATOR, BUILT WITHOUT A SINGLE BACKSLASH.
     This file gets embedded inside a template literal in the Worker. Backslash
     escapes do not survive that trip predictably: written /[\r\n;]+/ they were
     INTERPRETED into real newline characters and the regex broke across two
     lines, killing the whole script — no handlers bound, and every button did
     nothing. An earlier attempt failed the opposite way, escaping them twice
     into a literal backslash-n that matched nothing.
     So the separator is constructed from character codes. 10 is newline, 13 is
     carriage return. There is no escape sequence to mangle. */
  var SEP = new RegExp('[' + String.fromCharCode(10, 13) + ';]+');

  var stopFlag = false;
  $('btnStop').addEventListener('click', function () { stopFlag = true; });

  $('btnBatch').addEventListener('click', function () {
    var s = secret(); if (!s) return;
    var names = $('batch').value.split(SEP)
      .map(function (x) { return x.trim(); }).filter(Boolean);
    if (!names.length) { say('bad', 'Enter at least one figure, one per line.'); return; }

    stopFlag = false;
    var commit = $('bcommit').checked;
    var bmode = $('bmodesel').value;
    var bdepth = +$('bdepth').value;
    var list = $('blist');
    list.innerHTML = names.map(function (n, i) {
      return '<div class="brow" id="br' + i + '">'
        + '<span class="bmark wait">·</span>'
        + '<span>' + esc(n) + '</span>'
        + '<span class="bnote">queued</span></div>';
    }).join('');
    var tally = { done: 0, halted: 0, error: 0, cost: 0 };

    function mark(i, cls, sym, note) {
      var row = document.getElementById('br' + i); if (!row) return;
      row.children[0].className = 'bmark ' + cls;
      row.children[0].textContent = sym;
      row.children[2].textContent = note;
    }
    function finish() {
      busy(false);
      say(tally.error ? 'bad' : (tally.halted ? 'halt' : 'ok'),
        '<strong>Batch finished.</strong> ' + tally.done + ' written · '
        + tally.halted + ' halted · ' + tally.error + ' errored'
        + (commit ? '' : '<br>Nothing was committed — the box was unticked.'));
    }

    busy(true);
    say('ok', '<strong>' + bmode.toUpperCase() + ' mode.</strong> Running ' + names.length
      + ' figures, one at a time. This will take a while.');

    (function next(i) {
      if (stopFlag) { say('halt', 'Stopped after ' + i + ' of ' + names.length + '.'); busy(false); return; }
      if (i >= names.length) return finish();
      mark(i, 'run', '\u25B6', 'researching\u2026');
      fetch(ENGINE + '/quizzard/run', {
        method: 'POST',
        headers: { 'x-admin-secret': s, 'Content-Type': 'application/json' },
        body: JSON.stringify({ figure: names[i], commit: commit, mode: bmode, depth: bdepth })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status === 'done') {
          tally.done++;
          var note = d.topic_id + (d.committed ? ' \u00b7 written' : (d.alreadyExists ? ' \u00b7 exists' : ' \u00b7 not written'));
          mark(i, 'ok', '\u2713', note);
          raw.textContent = JSON.stringify(d, null, 2);
        } else if (d.status === 'halted') {
          tally.halted++;
          mark(i, 'halt', '\u25CB', 'halted \u00b7 ' + (d.reason || '?'));
        } else {
          tally.error++;
          mark(i, 'err', '\u2717', (d.error || 'error'));
        }
      })
      .catch(function (e) { tally.error++; mark(i, 'err', '\u2717', String(e).slice(0, 40)); })
      .finally(function () { next(i + 1); });
    })(0);
  });
})();
</script>
</body>
</html>
`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function isAdmin(request, env) {
  const cred = (request.headers.get('x-admin-secret') || '').trim();
  if (!cred) return false;
  if (env.SUPABASE_SECRET && cred === env.SUPABASE_SECRET) return true;
  if (env.ADMIN_PASSWORD && cred === env.ADMIN_PASSWORD) return true;
  return false;
}

/* ===========================================================================
   THE STANDING ORDER — the Quizzard specification, as the model receives it
   =========================================================================== */
const SPEC = `You are THE QUIZZARD, the station that writes the court for Amenti.

You are given ONE NAME. You return either a complete quiz or an honest refusal.
You never invent a fact. You never guess. A refusal is a success; a confident
fabrication is a disaster.

THE PROCEDURE — six steps, in order.

1 IDENTIFY. Resolve the name to ONE real, unambiguous historical person. If it
  maps to several people, or to none, HALT with reason "ambiguous-identity".

2 RESEARCH. USE THE WEB SEARCH TOOL. Search before you write anything. Find the
  figure's pivotal moment — the Rubicon: one scene where the life bends and the
  legacy is decided. Not a career summary. A scene. For a figure of ideas rather
  than events, the pivot is the work itself.

3 VERIFY. Confirm EVERY fact that will become an answer key, against the sources
  you actually retrieved. Never write a key from memory. If the pivotal moment
  cannot be confirmed, HALT with reason "unverifiable-pivot". If the person's
  existence is genuinely contested by scholarship (as with Homer), HALT with
  reason "contested-existence".
  (BOTH OF THOSE HALTS ARE SUSPENDED IN CANON MODE, where the claim is about a
   text rather than a life. If a canon addendum follows these instructions,
   read it before refusing a mythical figure.)

4 FIND THE DUALITY. Two opposing cases a thoughtful person could honestly argue
  from real history. THE FRAME MUST FIT THE FIGURE — never force one shape:
    ruler or general    -> great deeds vs. tyranny
    philosopher in power-> sage of principle vs. failed idealist
    reformer or icon    -> the inspiring myth vs. the erased reality
    thinker of ideas    -> the idea's promise vs. its cost
    explorer            -> pioneer robbed of credit vs. "discovery" as myth
  Write the STRONGEST version of each side, drawn from how the world actually
  argues this figure. Never strawman the side you find less sympathetic.
  If one side is genuinely empty — only atrocity, or only praise, with nothing
  honest to argue against it — HALT with reason "empty-pan".

5 COMPOSE. Fill the fixed schema exactly. See the INVARIANT below.

6 RETURN. Output ONE JSON object and nothing else. No preamble, no markdown
  fences, no commentary.

THE INVARIANT — a quiz that breaks any line is rejected by a parser, not a human.

  topic_id   kebab-case, figure + moment, e.g. "leif-vinland"
  title      "Figure and the Moment"
  era        "PERIOD · YEAR", e.g. "VIKING AGE · c. 1000 AD"
  facets     figure[], domain[], motif[], region[], era[], sourceType
             sourceType is exactly "Event" or "Idea"
             motif is a short thematic phrase you invent, e.g. "Glory & Its Ruin"

             domain[], region[] and era[] are a CLOSED VOCABULARY. Choose only
             from these exact strings. Anything else is rejected — these lists
             are how quizzes are sorted and offered, and inventing a new word
             silently breaks the sorting for every quiz.

             domain: War & Strategy | Statecraft & Governance | Wisdom & Philosophy
                     Letters & Ideas | Faith & Prophecy | Cunning & Craft
                     Reform & Justice | Exploration & Discovery | Science & Invention
             region: Mediterranean & Classical | Western Europe | Southern Europe
                     Northern Europe | Eastern Europe | Middle East | North Africa
                     Sub-Saharan Africa | East Asia | South Asia | Southeast Asia
                     Americas | Oceania
             era:    Mythic | Bronze Age | Classical | Post-Classical | Medieval
                     Early Modern | Modern
             (Einstein is Modern. Anyone after roughly 1800 is Modern.)
  intro      1-2 sentences. The hook. States the tension, not the answer.
  label      TWO TO FOUR WORDS naming the MOMENT, for the row on a stacked card.
             "the Rubicon". "the last words". "the swan-neck flask". Not the
             figure, not the title — the moment, so that a card reading
             "Julius Caesar" beneath a portrait can list "the Rubicon" and
             "the last words" as two lines that make sense side by side.
             Lower case unless it is a proper noun. No punctuation.

  passage    115-155 words of VERIFIED history. The source of truth for keys.
             COUNT THEM. This is the single most common reason a quiz is
             rejected — long passages are the natural habit and 165 is a hard
             ceiling. Aim for 130. A short passage costs nothing; an over-long
             one costs the whole quiz.
             Where sources genuinely disagree, WRITE THE DISAGREEMENT INTO THE
             PASSAGE rather than hiding it. That is honesty and also depth.
  questions  EXACTLY 6:
      cognitive   exactly 3 "what", 1 "why", 2 "evaluate"
      answerType  exactly 3 "mc", 1 "cloze", 2 "philosophical"
      timed       exactly 2, on easy/medium recall MC only,
                  each with tiers {"full":6,"partial":20}
      difficulty  "easy" | "medium" | "hard"; the 2 philosophical are "hard"
      mc          exactly 4 options, integer "correct" 0-3,
                  distractors plausible but clearly wrong
      cloze       "placeholder" plus a non-empty "accepted" array of
                  lower-case variants (spellings, with/without article)
      philosophical  "wordLimit": 40, difficulty "hard", and "rubric" exactly:
                  "No single correct verdict — score the QUALITY of the case, not the conclusion."
                  The two philosophical questions ARE the duality from step 4.

  NOTE ON CONSTANTS. The timed tiers, the philosophical wordLimit and the
  philosophical rubric are fixed and identical in every quiz. Include them, but
  do not agonise over them — if you omit or mistype one the Worker will supply
  the correct constant. Spend your care on the HISTORY and the DUALITY, which
  the Worker cannot supply and will not forgive.
      the "why" question MUST be multiple choice, and must force a judgement
      between plausible explanations — not a word to recall. Prefix it
      "According to the passage, ...". The single cloze must be cognitive
      "what": it recalls one word or name from the passage.

        RIGHT (why, mc):   "According to the passage, why did crossing the
                            Rubicon mean war?" + four plausible reasons
        WRONG (why, cloze):"...riding alongside a beam of ___" -> "light"
                            (that is recall wearing a reasoning label)

      question "id" must be a short lower-case kebab-case slug naming what the
      question is about — "geese", "surname", "champion-case" — never a number.

  THE TWO PHILOSOPHICAL PROMPTS ARE CASES, NOT QUESTIONS. This is the single
  most important rule of form. Each MUST begin literally "Make the strongest
  case that ..." and MUST NOT end in a question mark. The court asks a seeker
  to BUILD AN ARGUMENT, and is scored on the quality of that argument. A yes/no
  question cannot elicit one and breaks the whole mechanic.

      RIGHT: "Make the strongest case that Einstein's 1905 work was humanity's
              greatest intellectual achievement. 40 words or less."
      WRONG: "Was Einstein's 1905 work humanity's greatest achievement?"

  Emit ONLY these question fields: id, cognitive, answerType, difficulty, timed,
  tiers, anchored, prompt, options, correct, placeholder, accepted, wordLimit,
  rubric. Do not add "type", "question", "timeLimitSeconds" or any other field.

OUTPUT — exactly one of these two shapes, raw JSON, nothing around it.

  {"status":"done","topic_id":"...","payload":{title,era,facets,intro,passage,questions},
   "sources":["https://...","https://..."]}

  {"status":"halted","reason":"ambiguous-identity|contested-existence|unverifiable-pivot|empty-pan",
   "note":"one plain sentence a stranger could understand"}

sources must be URLs you actually retrieved and relied on. Do not invent them.`;

/* ===========================================================================
   SOURCE MODE — the reading room
   ---------------------------------------------------------------------------
   Twenty-one figures have a reading room: 2.3 MB of genuine primary text with
   attribution. Caesar's Commentarii. Tesla's 1891 Columbia lecture. The
   Meditations. Gandhi. Tacitus.

   In LIFE mode the engine writes a passage ABOUT a figure and every answer key
   rests on that summary being right. In SOURCE mode the passage IS the figure —
   his own sentences, quoted — and the keys are checkable by reading the
   paragraph above them.

   THE PROPERTY NO OTHER MODE HAS: because the text is on disk, the Worker can
   STRING-MATCH the returned passage against the source file. Not "the model
   says this is Tesla" — the Worker confirms those exact words are in
   tesla/01-experiments-very-high-frequency-1891.md, or rejects the quiz.
   Fabrication is not discouraged here. It is impossible.

   And read-aloud needs no change at all: /readaloud/start returns the topic's
   passage, so the figure reads his own writing in his own voice.
   =========================================================================== */
/* the standing order for the PORTRAIT, appended when one is asked for */
const PORTRAIT_SPEC = `
YOU ARE ALSO DRAWING THE PORTRAIT. Return it as a top-level string "portrait".

IT IS ONE SVG, ON A FIXED STAGE, AND THE STAGE IS NOT NEGOTIABLE.

  <svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
    \${defs('xx','#ACCENT','#DARKBG')}
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    EMIT THOSE CHARACTERS EXACTLY \u2014 dollar sign and braces included. It is NOT a
    placeholder for you to expand, and NOT <defs> markup to write out yourself.
    The page evaluates it as a template call at render time, and it supplies the
    gradients the rest of your drawing refers to. Change only the three
    arguments. A portrait that writes its own <defs> block is refused: it will
    not match the other thirty-three.
    <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#xx-bg)"/>
    ... the figure ...
    <ellipse cx="160" cy="548" rx="96" ry="14" fill="#ACCENT" opacity=".34"/>
  </svg>

  Replace the two-letter prefix xx with the figure's own — 'nw' for Newton, 'gm'
  for Gilgamesh. defs() supplies three things you then use: url(#xx-bg) for the
  pool of light, url(#xx-skin) for every piece of skin, and a glow filter.
  ACCENT is the accent colour from the sheet you just wrote.

THE PROPORTIONS ARE MEASURED, NOT SUGGESTED. Two faults appeared on the first
machine-drawn portrait and both were geometry rather than taste:

  1  NOTHING MAY FLOAT. The neck rect ends at y=168 and the garment begins at
     y=182. Something MUST occupy y=165 to y=185 or the head hangs in the air
     with a band of background beneath the chin. In the hand-made portraits the
     beard does it (it runs to about y=184), or a collar, or long hair. Check
     it: if your figure is clean-shaven and short-haired, DRAW A COLLAR.

  2  THE GARMENT IS ONE CLOSED SHAPE. Not two edges. This is the fault that has
     wrecked the most drawings, and it is subtle enough to pass every check:

       WRONG   M160 182 Q126 210 116 260 ... L132 495 Q130 455 128 410 ... Z
               down the left edge and back up four units inside. That encloses
               a 4-wide strip, not a coat. Mirrored on the right it looks like
               a path but renders as two hairlines. Einstein arrived exactly
               this way — 4,165 characters, every required element present, and
               no body at all.

       RIGHT   M160 182 Q124 192 114 228 L106 392 Q112 448 126 470 L194 470
               Q208 448 214 392 L206 228 Q196 192 160 182 Z

               ONE path. Down the left side, ACROSS THE HEM, up the right side,
               closed. The whole silhouette in a single outline.

     Test it before you return it: does the path cross from the left side of
     the figure to the right side WITHOUT lifting? If it doubles back near
     where it started, you have drawn an outline instead of a body.

  3  THE TORSO FLARES FAST. From the point at (160,182) it must reach ABOUT 90
     UNITS WIDE BY y=210 — roughly x=110 to x=205 — and its widest, around
     y=300-360, is about x=100 to x=215. Measured across the hand-made set:
     65 at the head, 45 at the jaw, 91 at the chest (y=210), 106 at mid
     (y=260), 113 at the waist (y=340), narrowing to about 39 at the hem.

  A FIGURE MUST HAVE A BODY. If the drawing is mostly head and hair, it is not
  a portrait — it is a bust floating over a background. More than half the ink
  belongs below y=200.

THE FIGURE, BUILT BACK TO FRONT
  1  hair mass behind the head, if there is hair
  2  <rect x="150" y="142" width="20" height="26" fill="url(#xx-skin)"/>   neck
  3  <ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#xx-skin)"/>     head
  4  hair in front, brows, eyes, nose, mouth, beard
  5  the garment, from a POINT at (160,182), flaring to ~90 wide by y=210 and
     ~110 wide by y=340, then narrowing toward the hem near y=500
  6  arms, hands, and what the hands hold
  7  the ground glow at the foot

  Depart from the head geometry ONLY when the skull is the point — Akhenaten's
  is elongated because that is the whole subject. Otherwise use it.

DRAW THE READING, NOT THE COSTUME.
  The stat line you just wrote IS the brief. Gilgamesh at 96 combat and 66
  foresight stands enormous with his back to the wall the epic says outlived
  him. Rand at 14 combat holds a cigarette and a manuscript. Odysseus is roped
  to his own mast, because he wanted to hear the song AND survive it.

  Ask what this figure is doing in the one second the picture holds. Then draw
  that. A figure standing neutrally facing forward is a costume, not a portrait.

FLAT VECTOR. No gradients beyond the two defs() gives you, no filters beyond
  the glow, no photographic shading. Shapes, a limited palette, and silhouette
  doing the work. Roughly 3,500 to 8,000 characters — the hand-made ones run
  3,776 to 8,806.

ABSOLUTELY FORBIDDEN, AND A BREACH IS A REFUSAL RATHER THAN A CORRECTION:
  <script>, <foreignObject>, <iframe>, any on* attribute, javascript: or data:
  URLs, <image> or <use> pointing anywhere outside the document, entity
  declarations. This string is injected into a live page. Nothing in it may
  execute. Draw with shapes and paths only.

WHERE A TRADITION FORBIDS AN IMAGE, HONOUR IT.
  Muhammad is not depicted. Draw the moment instead — the document, the city,
  the covenant — and leave the figure out. That is not a lesser portrait; it is
  the correct one, and the tradition has made that argument for fourteen
  centuries.
`;

/* the standing order for the CHARACTER SHEET, appended when one is asked for */
const SHEET_SPEC = `
YOU ARE ALSO WRITING THE CHARACTER SHEET.

You have just researched this figure. The sheet is the same research in a
different shape: what goes on the card beneath their face. Return it as a
second top-level object called "sheet".

  name      UPPER CASE, as it appears on the card. "ODYSSEUS", "HELEN KELLER".
  title     the role, in a line. "King of Ithaca · The Man of Many Turns".
            "Abolitionist · Orator & Statesman". Use · to join two halves.
  era       UPPER CASE. "HEROIC AGE", "ROMAN REPUBLIC", "MODERN".
  year      a STRING, and say what you actually know: "1887", "~1200 BCE",
            "c. 500", "384 BC". Do not invent precision.
  region    where they belong. "Ithaca", "Roman Republic", "Bengal".
  glyph     ONE symbol or emoji that is theirs. A compass for a navigator, a
            quill for a writer. Not a portrait — a mark.
  accent    a six-digit hex colour that suits them, e.g. "#1f8ba0". Dark enough
            to sit on near-black, saturated enough to read at small size.
  quote     something they said, attributed and real — or, for a figure of
            tradition, a line the tradition gives them. Keep the quotation marks.
  bio       25-120 words. The hand-made ones run 29 to 105 and the median is 60.
            Not a summary of the quiz. The life: what they did, and what it cost.
  voice     one or two sentences on HOW THEY SPEAK. This drives the read-aloud,
            so it must be about manner: pace, register, habit, what they avoid.
  abilities EXACTLY FOUR, each under 28 characters. Named things, not adjectives:
            "The Wooden Horse", "Nobody", "Silver Tongue", "Endurance".

  stats     strategy, charisma, foresight, combat. Whole numbers 1-99.

THE STATS ARE A READING, AND THEY MUST ARGUE.
  A sheet where all four sit near 90 says nothing and will be rejected. The
  difference IS the claim: Odysseus at 97 strategy and 78 combat says he won by
  wit. Gilgamesh at 96 combat and 66 foresight says he could hold any wall and
  never saw what was coming. Rand at 14 combat says her whole fight was on paper.

  Spread them. Give at least one number that is LOW, and be able to say why.
  A low number is not an insult — it is the half of the reading that makes the
  high one mean something.

WHAT YOU MAY NOT DO
  · do not flatter. A saint with 99 in everything is not a character.
  · do not invent a quote. If nothing attributed survives, use a line the
    tradition gives them and say so in the bio.
  · do not repeat the quiz passage in the bio. The quiz is one moment; the bio
    is the life around it.
`;

/* the standing order, amended for the reading room */
const SOURCE_SPEC = `
YOU ARE NOW IN SOURCE MODE. This is the strictest mode and the simplest.

THE PASSAGE IS NOT YOURS TO WRITE. You are given the figure's own text. You
select a passage from it and QUOTE IT VERBATIM. You may not summarise it,
modernise it, tidy the punctuation, or improve a sentence. The Worker holds the
same file and will string-match what you return against it. A passage that is
not in the file is rejected — not scored down, rejected.

  · Choose a self-contained stretch of 115-165 words. Prefer a whole paragraph.
  · It must stand alone: no dangling "as I said above", no unexplained pronoun.
  · It must carry enough substance for six questions — an argument, a scene, a
    decision. Not a list of names, not a table of contents, not a preface.
  · Reflowing line breaks is fine. Changing a word is not.

THE HALTS THAT APPLY. contested-existence and unverifiable-pivot DO NOT apply —
you are not asserting a life, you are quoting a document. If the work you are
given carries no passage of the right shape, HALT with "no-suitable-passage".

WHAT THE QUESTIONS TEST. Not biography. What this text says and argues.
  · the three "what" questions are answerable from the passage alone
  · the "why" question asks about the reasoning IN the passage
  · the two cases argue what the passage MEANS or whether its argument holds

THE TWO CASES, in this mode, are about the writing:
    "Make the strongest case that Tesla's claim here — that the ether carries
     all energy — was the insight that made the century possible."
    "Make the strongest case that this passage shows a mind reaching past its
     evidence, asserting as known what he could not yet demonstrate."
Both argue the TEXT. Neither requires a fact from outside it.

era        use the work's period, e.g. "COLUMBIA LECTURE · 1891"
sourceType exactly "Source"
intro      one or two sentences setting the moment the passage was written or
           delivered — this is the only place you may add context.

Return the passage in "passage" exactly as it appears, and put the identifier
of the work you drew from in "work_id".
`;

const LIB = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/library/';

/* The rooms that exist. There is no index file to discover them from, so the
   list is written out — twenty-one keys, stable, and short enough to read. */
const ROOMS = {
  'julius caesar':'caesar', 'gaius julius caesar':'caesar', 'caesar':'caesar',
  'nikola tesla':'tesla', 'tesla':'tesla',
  'marcus aurelius':'marcus-aurelius',
  'mahatma gandhi':'gandhi', 'mohandas gandhi':'gandhi', 'gandhi':'gandhi',
  'tacitus':'tacitus',
  'ian ingram':'ingram',
  'sun tzu':'sun-tzu',
  'bram stoker':'bram-stoker',
  'david hume':'david-hume',
  'moses':'moses',
  'oliver cromwell':'oliver-cromwell',
  'hannibal barca':'hannibal', 'hannibal':'hannibal',
  'seneca the younger':'seneca', 'seneca':'seneca',
  'edward gibbon':'edward-gibbon',
  'plato':'plato',
  'charles martel':'charles-martel',
  'abraham lincoln':'lincoln',
  'frederick douglass':'frederick-douglass',
  'confucius':'confucius',
  'john milton':'john-milton',
  'akhenaten':'akhenaten'
};
function roomFor(figure) {
  const k = String(figure || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (ROOMS[k]) return ROOMS[k];
  const last = k.split(' ').pop();
  return ROOMS[last] || null;
}

/* whitespace-insensitive containment — the model will reflow a paragraph even
   when quoting it faithfully, and that is not a forgery */
function flat(x) { return String(x || '').replace(/\s+/g, ' ').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase(); }

async function loadRoom(key) {
  const r = await fetch(LIB + key + '.json', { cache: 'no-store' });
  if (!r.ok) return null;
  let meta = null; try { meta = await r.json(); } catch (e) { return null; }
  const works = (meta.works || []).filter(function (w) { return w && w.file; });
  if (!works.length) return null;
  return { key: key, name: meta.name || key, works: works };
}

async function loadWork(w) {
  const r = await fetch(LIB + w.file, { cache: 'no-store' });
  if (!r.ok) return null;
  const text = await r.text();
  return text && text.length > 400 ? text : null;
}

/* ===========================================================================
   CANON MODE — the second armament
   Appended to the standing order only when mode === 'canon'.
   =========================================================================== */
const CANON_SPEC = `
YOU ARE NOW IN CANON MODE.

FIRST — THIS OVERRIDES THE STANDING ORDER ABOVE. Everything in this addendum
takes precedence where the two disagree. Specifically:

  · The halt "contested-existence" DOES NOT APPLY IN THIS MODE. It exists to
    stop you asserting a LIFE that cannot be verified. Canon mode asserts no
    life. Prometheus, Romulus, Theseus, Loki, Gilgamesh, Hippolyta and every
    figure of myth are IN SCOPE HERE and must not be refused for being mythical.
    Refusing them is the single most likely mistake you will make, because the
    standing order trained you to.

  · The halt "unverifiable-pivot" is likewise relaxed: the pivot is a SCENE IN
    THE TEXT, not an event in history. It needs a source, not a corroboration.

  · Step 2 RESEARCH still applies in full — search, and find the actual sources.
    You are verifying WHAT THE TEXTS SAY. That is a real, checkable claim and
    you must check it.

  · The halts that DO still apply: ambiguous-identity, empty-pan, and the
    canon-only halt no-fitting-frame.

One line changes: what you are verifying.

  LIFE mode asks  "did this happen?"   and checks the historical record.
  CANON mode asks "does the tradition say this?" and checks the SURVIVING TEXT.

The claim is about the SOURCE, never about the past. Apollodorus is as citable
as Livy — you are citing him for what the Greeks told, not for what occurred.
sourceType is "Canon".

FOUR RULES, all binding.

1 THE REGISTER. Write the passage in the voice of tradition. "As the sources
  tell it." "In the myth." "The text records." NEVER assert historicity. A
  passage stating flatly that Hippolyta ruled at Themiscyra has broken the mode.

2 CHAPTER AND VERSE. Every answer key carries its citation in the prompt or the
  passage: Apollodorus, Library 2.5.9. 2 Samuel 11:15. Not a bibliography for
  the quiz — a source for the claim.

3 THE CONFLICT IS THE CONTENT. Where traditions disagree, WRITE THE
  DISAGREEMENT IN rather than flattening it. Was Theseus' Amazon bride Hippolyta
  or Antiope? The sources genuinely split. That split is the best material in
  the mode, not a problem to hide.

4 THE DUALITY IS INTERPRETIVE. The two cases argue HOW THE TRADITION SHOULD BE
  READ — never whether it is true.

TWO CLASSES OF FIGURE, TREATED DIFFERENTLY.

  DEAD SACRED — no adherents today. Apollo, Prometheus, Odin, Loki, Osiris,
  Enlil, Inanna, Gilgamesh, Romulus, Theseus, Agamemnon, Hippolyta.
  Use the ordinary interpretive duality. No named frame required.

  LIVING SACRED — traditions with adherents today. Muhammad, Jesus, the Buddha,
  Moses, Abraham, Isaac, Jacob, Joseph, Aaron, Elijah, David, Solomon, Paul,
  Krishna, Rama, Guru Nanak, Zoroaster, Mahavira, Lao Tzu, and any figure
  sacred to a living tradition.
  YOU MUST SELECT ONE OF THE FOUR FRAMES BELOW. You may not invent a frame.
  If none fits without wounding, HALT with reason "no-fitting-frame".

THE FOUR APPROVED FRAMES.

  FRAME A · THE TEXT AND ITS READINGS
    Two readings of one passage, both held INSIDE the tradition.
    pan 1: the reading that vindicates the act in its own terms
    pan 2: the reading the tradition itself has found hard

  FRAME B · THE TEACHING AND WHAT WAS BUILT ON IT
    The figure's recorded teaching against the institution raised in their name.
    Both pans must be about the INSTITUTION. The moment pan 2 becomes "the
    teaching itself was wrong," you have left the frame — choose another.

  FRAME C · THE HARD PASSAGE
    A text the tradition openly wrestles with — not one chosen to embarrass.
    pan 1: what the passage demands, taken at its word
    pan 2: what it costs, taken equally seriously

  FRAME D · THE HISTORICAL AND THE REMEMBERED
    What the documentary record establishes against what the tradition holds.
    This asks about EVIDENCE. It never asks whether the faith is true.

THE GOVERNING TEST. A devout reader must recognise BOTH pans as fair statements
of a dispute they have heard before. If only an outsider would call it balanced,
it is not balanced.

WHEN THE EPISODE IS DOCUMENTED, NAME THE DOCUMENT.
  A living-sacred figure is usually anchored on something real: the Constitution
  of Medina, a letter of Paul, an edict, a chronicle. Those are history, and
  writing "as the sources tell it" about a surviving document is weaker, not
  stronger. NAME IT. "Ibn Ishaq records that...", "The Constitution of Medina
  states...", "Tacitus attests that...", "Paul, writing within twenty years,
  reports...". That is attribution at its strongest, and it satisfies the
  register requirement completely.

  The rule is not a phrase you must include. The rule is that EVERY CLAIM MUST
  BELONG TO A TEXT rather than float free as fact.

ANCHOR ON A DOCUMENTED EPISODE, NEVER ON THE PERSON IN GENERAL. A quiz about
"Muhammad" invites a verdict on Islam. A quiz about the Constitution of Medina
invites an argument about a document. Write the second kind.

HARD LIMITS — a breach of any of these is a halt, not a lower score.
  · Never ask whether a religion is true.
  · Never ask a seeker to argue that believers are foolish. A pan written that
    way is not a case; it is a slur with a word limit.
  · Never assert as history what only the text asserts.
  · Modern copyrighted works are not canon. Comics, films and novels are outside
    this mode entirely.
  · If no approved frame fits, HALT with "no-fitting-frame". A halt costs
    nothing. A frame that wounds costs the hall its right to weigh anything.
`;

/* ===========================================================================
   THE NORMALISER — supplies constants, never content
   ---------------------------------------------------------------------------
   Three fields in the schema carry NO information: the timed tiers, the
   philosophical word limit, and the philosophical rubric. They are identical
   in every quiz ever written. Requiring a model to recall a constant, and
   discarding a researched quiz when it forgets, is friction with no benefit.

   So the Worker supplies them. It supplies NOTHING ELSE — never a fact, never
   an option, never an answer index, never a count. If the model got the
   history wrong or the shape wrong, the validator still rejects it.

   The line: normalise constants, validate content.
   =========================================================================== */
const RUBRIC = 'No single correct verdict — score the QUALITY of the case, not the conclusion.';
const TIERS = { full: 6, partial: 20 };

/* The controlled vocabulary. Facets are how quizzes are sorted and offered —
   the contextual lensing. If every quiz invents its own words, the lens turns
   to noise: filter by era and Einstein will not stand beside Keller and Rand.
   So these lists are closed. A quiz using anything else is rejected. */
const DOMAINS = ['War & Strategy','Statecraft & Governance','Wisdom & Philosophy',
  'Letters & Ideas','Faith & Prophecy','Cunning & Craft','Reform & Justice',
  'Exploration & Discovery','Science & Invention'];
const REGIONS = ['Mediterranean & Classical','Western Europe','Southern Europe',
  'Northern Europe','Eastern Europe','Middle East','North Africa','Sub-Saharan Africa',
  'East Asia','South Asia','Southeast Asia','Americas','Oceania'];
const ERAS = ['Mythic','Bronze Age','Classical','Post-Classical','Medieval',
  'Early Modern','Modern'];
const KEEP_Q = ['id','cognitive','answerType','difficulty','timed','tiers','anchored',
  'prompt','options','correct','placeholder','accepted','wordLimit','rubric'];

function normalise(p) {
  const filled = [];
  if (!p || !Array.isArray(p.questions)) return filled;
  p.questions.forEach(function (q, i) {
    if (!q || typeof q !== 'object') return;
    const at = 'q' + (i + 1) + (q.id ? ('/' + q.id) : '');
    if (q.timed) {
      const t = q.tiers;
      if (!t || t.full !== TIERS.full || t.partial !== TIERS.partial) {
        q.tiers = { full: TIERS.full, partial: TIERS.partial };
        filled.push(at + ': tiers');
      }
    }
    if (q.answerType === 'philosophical') {
      if (q.wordLimit !== 40) { q.wordLimit = 40; filled.push(at + ': wordLimit'); }
      if (q.rubric !== RUBRIC) { q.rubric = RUBRIC; filled.push(at + ': rubric'); }
      if (q.difficulty !== 'hard') { q.difficulty = 'hard'; filled.push(at + ': difficulty'); }
    }
    if (typeof q.id === 'number' || (typeof q.id === 'string' && /^\d+$/.test(q.id))) {
      const slug = String(q.prompt || 'q').toLowerCase().replace(/[^a-z0-9]+/g,'-')
                     .split('-').filter(Boolean).slice(0,3).join('-') || ('q' + (i+1));
      q.id = slug; filled.push(at + ': numeric id -> "' + slug + '"');
    }
    Object.keys(q).forEach(function (k) {
      if (KEEP_Q.indexOf(k) === -1) { delete q[k]; filled.push(at + ': dropped ' + k); }
    });
    if (q.answerType === 'cloze' && Array.isArray(q.accepted)) {
      const lowered = q.accepted.map(function (a) { return String(a).toLowerCase().trim(); });
      if (JSON.stringify(lowered) !== JSON.stringify(q.accepted)) { q.accepted = lowered; filled.push(at + ': accepted case'); }
    }
  });
  return filled;
}

/* ===========================================================================
   THE VALIDATOR — the gate that cannot be charmed
   =========================================================================== */

/* the closed vocabularies. Same principle as the quiz facets: a controlled list
   catches an INVENTED value. It cannot catch a wrong choice among real ones —
   "Early Modern" is a legal era and was the wrong one for Douglass — so these
   narrow the field, they do not settle it. */
const SHEET_STATS = ['strategy', 'charisma', 'foresight', 'combat'];

function validatePortrait(svg) {
  const e = [];
  const push = function (m) { e.push(m); };

  if (typeof svg !== 'string' || !svg.trim()) return ['portrait missing'];
  const s = svg.trim();

  /* ---- 1 · NOTHING EXECUTABLE. Refused, never stripped. ----------------- */
  const forbidden = [
    [/<script[\s>]/i,            '<script>'],
    [/<foreignObject[\s>]/i,     '<foreignObject>'],
    [/<iframe[\s>]/i,            '<iframe>'],
    [/<use[^>]+href\s*=\s*["']?\s*http/i, 'an external <use href>'],
    [/\son\w+\s*=/i,             'an event handler attribute (onload, onclick…)'],
    [/javascript\s*:/i,          'a javascript: URL'],
    [/data\s*:\s*text\/html/i,   'a data:text/html URL'],
    [/<image[^>]+href\s*=\s*["']?\s*(?!#)/i, 'an <image> pointing outside the document'],
    [/<!ENTITY/i,                'an entity declaration'],
    [/<animate[^>]+attributeName\s*=\s*["']?href/i, 'an animated href']
  ];
  forbidden.forEach(function (pair) {
    if (pair[0].test(s)) push('PORTRAIT REFUSED: it contains ' + pair[1]
      + '. This string is injected into the page with innerHTML, so anything '
      + 'executable is a cross-site scripting hole. It is refused rather than '
      + 'sanitised — sanitising invites an arms race and refusing does not.');
  });

  /* ---- 2 · it must be one SVG, whole ------------------------------------ */
  if (!/^<svg[\s>]/i.test(s))     push('must begin with a single <svg> element');
  if (!/<\/svg>$/i.test(s))       push('must end with </svg>');
  const opens = (s.match(/<svg[\s>]/gi) || []).length;
  const closes = (s.match(/<\/svg>/gi) || []).length;
  if (opens !== 1 || closes !== 1) push('exactly one <svg> element, not ' + opens);

  /* ---- 3 · the five things every hand-made portrait carries ------------- */
  if (!/viewBox\s*=\s*["']0 0 320 560["']/.test(s))
    push('viewBox must be exactly "0 0 320 560" — the stage every portrait shares');
  if (!/class\s*=\s*["']char-art["']/.test(s))
    push('the <svg> must carry class="char-art" — the card styles and clones it by that name');
  if (!/\$\{defs\(/.test(s))
    push('must call ${defs(prefix, glowColour, bgColour)} — it supplies the background '
       + 'gradient, the glow filter and the skin gradient the rest of the drawing uses');
  if (!/cx\s*=\s*["']160["']\s+cy\s*=\s*["']340["']/.test(s))
    push('missing the background ellipse at cx="160" cy="340" — the pool of light '
       + 'the figure stands in, present in every portrait');
  if (!/url\(#[a-z]{2}-skin\)/.test(s))
    push('nothing uses url(#xx-skin). The skin gradient is what makes a figure belong '
       + 'to this set rather than look pasted into it');

  /* ---- 4 · size, from the measured range -------------------------------- */
  const n = s.length;
  /* THE FLOOR WAS SET TOO LOW AND A THIN PORTRAIT PASSED.
     1,800 was a guess. The measured minimum across the thirty-three hand-made
     portraits is 3,776, and Galileo arrived at 2,654 — structurally valid,
     visibly sparse, and accepted by a check that was not looking hard enough.
     3,200 admits every real portrait with room to spare and refuses a sketch. */
  if (n < 3200)  push('portrait is ' + n + ' characters — too sparse. The simplest '
                    + 'hand-made portrait is 3,776 and even that is a full figure with '
                    + 'hair, features, a garment, arms and something in the hands. Add the '
                    + 'detail that is missing rather than padding what is there.');
  if (n > 16000) push('portrait is ' + n + ' characters — beyond anything hand-made '
                    + '(the largest is 8,806). Simplify rather than accumulate.');

  /* ---- 5 · the geometry that is USUAL but not required ------------------ */
  /* twenty of twenty-five use the standard head. Akhenaten does not, on
     purpose. A validator that enforced it would have rejected him. */
  const warn = [];

  /* THE FLOATING HEAD CANNOT BE CAUGHT HERE, AND SAYING SO IS THE POINT.
     The first machine-drawn portrait left fourteen pixels of background between
     the chin and the shoulders. The obvious check — does any coordinate fall
     between y=165 and y=185 — does not work: a path string gives no way to tell
     an x from a y, so "L 170 300" and "L 180 182" both satisfy it while the gap
     remains.

     A check that cannot see the thing it claims to check is worse than no check,
     because it reports green. So there is none. The instruction lives in the
     SPEC, where it belongs, and the gap is caught by looking at the drawing —
     which is what the staged gate is for. */

  if (!/cx="160" cy="116" rx="29" ry="33"/.test(s))
    warn.push('head is not at the usual cx160 cy116 rx29 ry33 — legitimate for a figure '
            + 'whose skull is the point, unusual otherwise');
  if (!/x="150" y="142" width="20" height="26"/.test(s))
    warn.push('no standard neck rect at x150 y142');
  if (!/cy="5\d\d"[^>]*ry="1\d"/.test(s))
    warn.push('no ground glow near the foot of the stage');

  return { errors: e, warnings: warn };
}

function validateSheet(key, sh) {
  const e = [];
  const push = function (m) { e.push(m); };

  if (!sh || typeof sh !== 'object') return ['sheet missing or not an object'];

  /* ---- the identifying fields ------------------------------------------- */
  if (!key || !/^[a-z][a-z0-9-]{1,40}$/.test(key))
    push('key must be kebab-case, 2-41 chars, starting with a letter');
  if (typeof sh.name !== 'string' || !sh.name.trim())
    push('name is required');
  else if (sh.name !== sh.name.toUpperCase())
    push('name must be upper case, as every hand-made record is');

  /* ---- the line under the name ------------------------------------------ */
  if (typeof sh.title !== 'string' || sh.title.trim().length < 4)
    push('title is required — the role, e.g. "King of Ithaca · The Man of Many Turns"');
  if (typeof sh.era !== 'string' || !sh.era.trim())
    push('era is required, e.g. "HEROIC AGE"');
  else if (sh.era !== sh.era.toUpperCase())
    push('era must be upper case');
  if (typeof sh.year !== 'string' || !sh.year.trim())
    push('year is required as a STRING — "~1200 BCE", "1887", "c. 500" all legal');
  if (typeof sh.region !== 'string' || !sh.region.trim())
    push('region is required');

  /* ---- the card furniture ----------------------------------------------- */
  if (typeof sh.glyph !== 'string' || !sh.glyph.trim() || sh.glyph.length > 4)
    push('glyph must be a single short symbol or emoji');
  if (typeof sh.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(sh.accent))
    push('accent must be a six-digit hex colour, e.g. "#1f8ba0"');

  /* ---- the words --------------------------------------------------------- */
  if (typeof sh.quote !== 'string' || sh.quote.trim().length < 8)
    push('quote is required — attributed words, or a line the tradition gives them');
  if (typeof sh.bio !== 'string') push('bio is required');
  else {
    /* THE RANGE WAS MEASURED, NOT ASSUMED.
       The first version of this rule set a floor of 45 words and rejected
       TWELVE of the thirty-three hand-made records — Lincoln at 35, Caesar at
       32, Tesla at 29. The floor had been taken from the twelve bios written
       in one recent sitting and imposed on twenty-one written months earlier.

       The real spread across the set is 29 to 105, median 60. So the bounds are
       25 and 120: wide enough to admit every record that exists, tight enough
       to catch a one-line stub or a runaway essay. A validator's job is to
       accept what is already known to be good. */
    const w = sh.bio.trim().split(/\s+/).filter(Boolean).length;
    if (w < 25)  push('bio is ' + w + ' words — that is a caption, not a life. The hand-made ones run 29 to 105.');
    if (w > 120) push('bio is ' + w + ' words — too long for a card. The longest hand-made one is 105.');
  }
  if (typeof sh.voice !== 'string' || sh.voice.trim().length < 30)
    push('voice is required — how they speak, in a sentence or two. It drives the read-aloud.');

  /* ---- the four abilities ------------------------------------------------ */
  if (!Array.isArray(sh.abilities)) push('abilities must be an array');
  else {
    if (sh.abilities.length !== 4)
      push('abilities must be EXACTLY four — every hand-made record has four and the card lays out for four');
    sh.abilities.forEach(function (a, i) {
      if (typeof a !== 'string' || !a.trim()) push('ability ' + (i + 1) + ' is empty');
      else if (a.length > 28) push('ability ' + (i + 1) + ' is too long for the card: "' + a + '"');
    });
  }

  /* ---- the four stats ---------------------------------------------------- */
  if (!sh.stats || typeof sh.stats !== 'object') push('stats missing');
  else {
    SHEET_STATS.forEach(function (k) {
      const v = sh.stats[k];
      if (typeof v !== 'number' || !isFinite(v)) push('stats.' + k + ' must be a number');
      else if (v !== Math.round(v)) push('stats.' + k + ' must be a whole number');
      else if (v < 1 || v > 99) push('stats.' + k + ' is ' + v + ' — must be 1-99');
    });
    Object.keys(sh.stats).forEach(function (k) {
      if (SHEET_STATS.indexOf(k) === -1) push('unknown stat "' + k + '" — only ' + SHEET_STATS.join(', '));
    });
    /* a sheet where everything is 90 is not a reading, it is a shrug */
    const vals = SHEET_STATS.map(function (k) { return sh.stats[k]; })
                            .filter(function (v) { return typeof v === 'number'; });
    if (vals.length === 4) {
      const spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
      if (spread < 12)
        push('the four stats span only ' + spread + ' points. A sheet where every number is '
           + 'similar says nothing about the person — the difference between 97 strategy and 78 '
           + 'combat IS the reading. Make them argue.');
    }
  }

  return e;
}

function validate(topicId, p, mode) {
  const e = [];
  const push = (m) => e.push(m);

  if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(String(topicId || ''))) push('topic_id must be kebab-case');
  if (!p || typeof p !== 'object') { push('payload missing'); return e; }

  ['title', 'era', 'intro', 'passage'].forEach(function (k) {
    if (!p[k] || typeof p[k] !== 'string' || !p[k].trim()) push('missing ' + k);
  });

  const f = p.facets || {};
  ['figure', 'domain', 'motif', 'region', 'era'].forEach(function (k) {
    if (!Array.isArray(f[k]) || !f[k].length) push('facets.' + k + ' must be a non-empty array');
  });
  if (['Event', 'Idea', 'Canon', 'Source'].indexOf(f.sourceType) === -1) push('facets.sourceType must be Event, Idea, Canon or Source');
  (f.domain || []).forEach(function (d) { if (DOMAINS.indexOf(d) === -1) push('facets.domain "' + d + '" is not in the controlled vocabulary'); });
  (f.region || []).forEach(function (d) { if (REGIONS.indexOf(d) === -1) push('facets.region "' + d + '" is not in the controlled vocabulary'); });
  (f.era    || []).forEach(function (d) { if (ERAS.indexOf(d)    === -1) push('facets.era "' + d + '" is not in the controlled vocabulary'); });

  /* CANON REGISTER CHECK. The mode's whole honesty rests on the passage not
     asserting historicity. A parser cannot judge tone, but it can insist the
     passage carries at least one explicit marker of tradition — and it can
     insist the sourceType matches the mode it was asked for. */
  if (mode === 'source' && p.facets && p.facets.sourceType !== 'Source')
    e.push('source mode must produce sourceType "Source"');

  if (mode === 'canon') {
    if (p.facets && p.facets.sourceType !== 'Canon') e.push('canon mode must produce sourceType "Canon"');
    /* THE REGISTER TEST, WIDENED.
       The first version accepted a short list of tradition phrases and nothing
       else — so it HALTED ON BETTER ATTRIBUTION THAN IT ACCEPTED. "Ibn Ishaq
       records that the covenant named the Jewish clans" and "Tacitus attests
       that Christus suffered under Pontius Pilate" both failed, while the
       vaguer "as the sources tell it" passed.

       That is backwards. What canon mode actually requires is that the passage
       ATTRIBUTE its claims to a text rather than assert them as fact. Naming
       the source is the strongest way to do that, not a violation of it.

       So the test now accepts either form: a stock tradition phrase, OR a
       named source with a reporting verb. A passage that does neither is
       stating myth as history, which is the thing being caught. */
    const trad = /(as the sources tell|the sources tell|in the myth|the myth records|the text records|according to the|the tradition (holds|tells|records)|the sagas|the eddas|the epic|the poem records|as it is told|is said to|legend|preserved in|is recorded in|the earliest sources|the accounts)/i;
    const cited = /\b[A-Z][\w'\u2019-]+(?:\s+[A-Z][\w'\u2019-]+){0,3}\s+(records|reports|attests|recounts|relates|preserves|describes|writes that|has it that|tells us)/;
    const pass = String(p.passage || '');
    if (!trad.test(pass) && !cited.test(pass))
      e.push('canon passage neither carries a marker of tradition nor names a source — '
           + 'it reads as a historical assertion. Either "as the sources tell it" / "the '
           + 'tradition holds", OR name the text: "Ibn Ishaq records that...", "Tacitus '
           + 'attests that...", "the Constitution of Medina states...".');
  }

  /* THE LABEL is optional because fifty-four quizzes were written before it
     existed, and a validator that rejected them would be wrong about the
     library rather than about the quiz. When it IS present it must be short:
     a stacked card gives it one line beside four hearts and two quills. */
  if (p.label !== undefined) {
    if (typeof p.label !== 'string' || !p.label.trim())
      e.push('label, if given, must be a non-empty string');
    else if (p.label.length > 34)
      e.push('label is ' + p.label.length + ' characters — a gate row has space for about 34. '
           + 'Name the moment, not the quiz: "the Rubicon", not "Caesar crossing the Rubicon".');
  }

  const words = String(p.passage || '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 110 || words > 165) push('passage is ' + words + ' words (need 110-165)');

  const qs = p.questions;
  if (!Array.isArray(qs) || qs.length !== 6) { push('need exactly 6 questions, got ' + (Array.isArray(qs) ? qs.length : 'none')); return e; }

  const cog = { what: 0, why: 0, evaluate: 0 };
  const typ = { mc: 0, cloze: 0, philosophical: 0 };
  let timed = 0;
  const ids = {};

  qs.forEach(function (q, i) {
    const at = 'q' + (i + 1) + (q && q.id ? ('/' + q.id) : '');
    if (!q || typeof q !== 'object') { push(at + ': not an object'); return; }
    if (!q.id || ids[q.id]) push(at + ': missing or duplicate id');
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(q.id))) push(at + ': id must be lower-case kebab-case');
    ids[q.id] = 1;
    if (!q.prompt || !String(q.prompt).trim()) push(at + ': missing prompt');
    if (cog[q.cognitive] === undefined) push(at + ': cognitive must be what/why/evaluate');
    else cog[q.cognitive]++;
    if (typ[q.answerType] === undefined) push(at + ': answerType must be mc/cloze/philosophical');
    else typ[q.answerType]++;
    if (['easy', 'medium', 'hard'].indexOf(q.difficulty) === -1) push(at + ': difficulty must be easy/medium/hard');

    if (q.answerType === 'mc') {
      if (!Array.isArray(q.options) || q.options.length !== 4) push(at + ': mc needs exactly 4 options');
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) push(at + ': mc needs integer correct 0-3');
    }
    if (q.answerType === 'cloze') {
      if (!Array.isArray(q.accepted) || !q.accepted.length) push(at + ': cloze needs a non-empty accepted[]');
      else if (q.accepted.some(function (a) { return typeof a !== 'string' || a !== a.toLowerCase(); }))
        push(at + ': accepted[] must be lower-case strings');
      if (!q.placeholder) push(at + ': cloze needs a placeholder');
    }
    if (q.answerType === 'philosophical') {
      if (q.wordLimit !== 40) push(at + ': philosophical needs wordLimit 40');
      if (q.rubric !== RUBRIC) push(at + ': philosophical rubric must match exactly');
      if (q.difficulty !== 'hard') push(at + ': philosophical must be hard');
      // the pans must be CASES to argue, never questions to answer — the court
      // scores the quality of an argument, which a yes/no question cannot elicit
      if (!/^make the strongest case\b/i.test(String(q.prompt || '').trim()))
        push(at + ': philosophical prompt must begin "Make the strongest case that ..." — it is an instruction to argue, not a question to answer');
      if (/\?\s*$/.test(String(q.prompt || '').trim()))
        push(at + ': philosophical prompt must not be phrased as a question');
    }
    if (q.timed) {
      timed++;
      if (q.answerType !== 'mc') push(at + ': only mc may be timed');
      const t = q.tiers || {};
      if (t.full !== 6 || t.partial !== 20) push(at + ': timed needs tiers {full:6,partial:20}');
    }
  });

  if (cog.what !== 3 || cog.why !== 1 || cog.evaluate !== 2)
    push('cognitive must be 3 what / 1 why / 2 evaluate — got ' + cog.what + '/' + cog.why + '/' + cog.evaluate);
  if (typ.mc !== 3 || typ.cloze !== 1 || typ.philosophical !== 2)
    push('answerType must be 3 mc / 1 cloze / 2 philosophical — got ' + typ.mc + '/' + typ.cloze + '/' + typ.philosophical);
  if (timed !== 2) push('exactly 2 questions must be timed — got ' + timed);

  // The tier must match the form. A cloze asks you to recall a word; it cannot
  // test a cause. Every established quiz makes the "why" a multiple choice that
  // forces a judgement between plausible explanations, and makes the cloze a
  // "what". Without this, "why" becomes a label rather than a rung.
  qs.forEach(function (q, i) {
    if (!q) return;
    const at = 'q' + (i + 1) + (q.id ? ('/' + q.id) : '');
    if (q.cognitive === 'why' && q.answerType !== 'mc')
      push(at + ': the "why" question must be multiple choice — a cloze tests recall, not reasoning');
    if (q.answerType === 'cloze' && q.cognitive !== 'what')
      push(at + ': a cloze must be cognitive "what" — it recalls a word from the passage');
  });

  return e;
}

/* ---- pull the model's JSON out of a mixed content array ------------------ */
function extractText(content) {
  if (!Array.isArray(content)) return '';
  return content.filter(function (b) { return b && b.type === 'text'; })
                .map(function (b) { return b.text || ''; }).join('\n').trim();
}
function parseJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a === -1 || b === -1 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

/* ---- the model call, with search armed ----------------------------------- */
async function callModel(env, messages, opts) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: env.MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: SPEC
            + (opts && opts.mode === 'canon'  ? '\n\n' + CANON_SPEC  : '')
            + (opts && opts.mode === 'source' ? '\n\n' + SOURCE_SPEC : '')
            + (opts && opts.characterOnly
                ? '\n\nYOU ARE NOT WRITING A QUIZ ON THIS RUN. Ignore every instruction above '
                  + 'about questions, passages, keys and invariants. Research the figure with the '
                  + 'search tool exactly as thoroughly as you would for a quiz — the sheet and the '
                  + 'drawing are only as good as the research behind them — and return ONLY '
                  + '{"sheet": {...}, "portrait": "<svg...>"}.'
                : '')
            + (opts && opts.sheet             ? '\n\n' + SHEET_SPEC  : '')
            + (opts && opts.sheet             ? '\n\n' + PORTRAIT_SPEC : ''),
      messages: messages,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }]
    })
  });
  let data = null; try { data = await r.json(); } catch (e) {}
  if (!r.ok) return { ok: false, status: r.status, error: (data && data.error && data.error.message) || 'API error' };
  return { ok: true, data: data };
}

/* ===========================================================================
   THE PATROL — the queue, and working down it unattended
   ---------------------------------------------------------------------------
   The engine remembers what it has WRITTEN. It has never remembered what it
   has ATTEMPTED, so a figure it refused looks identical to a figure nobody has
   asked about. Left to run on a schedule it would walk into the same halts
   every night, for ever, paying each time.

   quizzard_queue is that memory: one row per figure, its mode, and what
   happened. A halt is recorded with its reason and the figure is not tried
   again — because a halt is a FINDING, not a failure to retry.

   SMALL BATCHES, ON PURPOSE. A Worker invocation cannot hold nine model calls,
   and more importantly a patrol that produces two hundred quizzes overnight is
   worse than one that produces three. Everything lands staged; nothing reaches
   a seeker unread.
   =========================================================================== */
const PATROL_BATCH = 3;      // figures per scheduled run

/* A HALT AND A FAILURE ARE NOT THE SAME THING.
   contested-existence, empty-pan, no-reading-room — those are FINDINGS. The
   figure will not become verifiable overnight and retrying costs money to
   rediscover the same truth.
   failed-validation is different: the engine tried and could not get the shape
   right. That is a bad night, not a verdict, and it is worth one more attempt
   on a later pass. So it is taken again — but only once. */
async function queueTake(env, n) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/quizzard_queue'
    + '?or=(status.eq.pending,and(status.eq.halted,halt_reason.eq.failed-validation,attempts.lt.2))'
    /* DEMAND FIRST, RANK AS THE TIEBREAKER.
       This used to order by rank alone — a number somebody typed in before
       anyone had visited, which is a guess at importance rather than evidence
       of interest. It opened the patrol with Apollo and Isis because they sit
       at rank 0.0, while a seeker searching for Napoleon found nothing and the
       fact was thrown away.

       `wants` counts the times a figure was looked for and not found. Where it
       is silent — which is everywhere, at first — rank still decides, so an
       empty miss log costs nothing and changes nothing. Where it speaks, the
       dollar goes where the attention already is. */
    + '&select=figure_name,rank,mode,attempts,wants,band'
    /* BAND, THEN DEMAND, THEN RANK.
       The roster ranks gods at 0.0-0.9 and everyone else from 1 up, so a plain
       rank sort put ninety-seven deities ahead of Newton, Einstein and Darwin.
       A visitor arrives looking for names they know; the queue was answering
       with names almost nobody searches for.

       Demand is a tiebreaker INSIDE a band and never a way to jump one — a
       hundred people asking for Loki should not push Newton behind him. */
    + '&order=band.asc,wants.desc,rank.asc,figure_name.asc&limit=' + n, {
    headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET } });
  if (!r.ok) return [];
  let rows = []; try { rows = await r.json(); } catch (e) {}
  return Array.isArray(rows) ? rows : [];
}

async function queueMark(env, figure, patch) {
  patch.updated_at = new Date().toISOString();
  await fetch(SUPABASE_URL + '/rest/v1/quizzard_queue?figure_name=eq.' + encodeURIComponent(figure), {
    method: 'PATCH',
    headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET,
               'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch)
  });
}

/* ---- the character side ---------------------------------------------------
   slugKey turns a figure name into the key the card and the art library use.
   It must agree with the hand-made keys or a machine-made sheet will sit beside
   a hand-made portrait instead of joining it. */
function slugKey(figure) {
  return String(figure || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

async function characterExists(env, figure) {
  if (!env.SUPABASE_SECRET) return false;
  const key = slugKey(figure);
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/characters?key=eq.'
      + encodeURIComponent(key) + '&select=key&limit=1', {
      headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET } });
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (e) { return false; }
}

async function stageCharacter(env, key, name, sheet, figure, portrait) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/characters', {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET,
               'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({ key: key, name: name, sheet: sheet, figure: figure,
                           /* null when the drawing was refused — a row with a sheet and no
                              face is a correct row, and the card renders a badge for it */
                           portrait: portrait || null,
                           status: 'staged', origin: 'engine',
                           updated_at: new Date().toISOString() })
  });
  return r.ok ? null : ('character not staged: http ' + r.status);
}

/* ---- WHAT HAS ALREADY BEEN WRITTEN ABOUT THIS FIGURE ----------------------
   The engine has no memory. Asked for Prometheus twice — once in life mode,
   once in canon — it produced the same theft twice, because nothing told it the
   first one existed. Einstein did the same from identical input inside a single
   session, returning einstein-annus-mirabilis and einstein-miracle-year for one
   moment. Left alone it will write the Rubicon four times.

   So before writing, it reads. Not to be inspired by the earlier quizzes — to
   be forbidden from repeating them. */
async function existingFor(env, figure) {
  if (!env.SUPABASE_SECRET) return [];
  const words = String(figure || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const last = words[words.length - 1];
  /* match on the last name, then confirm strictly in code — a LIKE on its own
     would hand Marcus MANLIUS the quizzes of Marcus AURELIUS */
  const url = SUPABASE_URL + '/rest/v1/topics?select=topic_id,figure,depth,payload'
            + '&figure=ilike.' + encodeURIComponent('*' + last + '*')
            + '&status=in.(live,staged)';
  let r; try { r = await fetch(url, { headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET } }); }
  catch (e) { return []; }
  if (!r.ok) return [];
  let rows = []; try { rows = await r.json(); } catch (e) {}
  if (!Array.isArray(rows)) return [];

  const fs = words.join(' ');
  return rows.filter(function (x) {
    const n = String(x.figure || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!n.length) return false;
    const ns = n.join(' ');
    return n[n.length - 1] === words[words.length - 1] || fs.indexOf(ns) !== -1 || ns.indexOf(fs) !== -1;
  }).map(function (x) {
    const p = x.payload || {};
    const pass = String(p.passage || '');
    return {
      id: x.topic_id,
      depth: x.depth == null ? 1 : x.depth,
      title: p.title || x.topic_id,
      era: p.era || '',
      mode: (p.facets && p.facets.sourceType) || '',
      /* the first sentence is enough to name the moment without spending the
         whole passage on it */
      opens: pass.split(/(?<=\.)\s/)[0].slice(0, 180)
    };
  });
}

/* ---- does this quiz already exist? --------------------------------------- */
async function topicExists(env, topicId) {
  if (!env.SUPABASE_SECRET) return false;
  const r = await fetch(SUPABASE_URL + '/rest/v1/topics?topic_id=eq.' + encodeURIComponent(topicId) + '&select=topic_id', {
    headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET }
  });
  if (!r.ok) return false;
  let rows = []; try { rows = await r.json(); } catch (e) {}
  return Array.isArray(rows) && rows.length > 0;
}

/* ---- write it, staged ----------------------------------------------------- */
async function stageTopic(env, topicId, payload, sources, mode, depth, figure) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/topics?on_conflict=topic_id', {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET,
      Authorization: 'Bearer ' + env.SUPABASE_SECRET,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{
      topic_id: topicId, payload: payload, sources: sources || [],
      mode: mode || 'life', status: 'staged',
      /* THE STACK · a quiz that does not know its figure cannot join a card,
         and one that does not know its depth cannot take its place in order. */
      depth: depth || 1,
      figure: figure || null,
      updated_at: new Date().toISOString()
    }])
  });
  if (r.ok) return { ok: true };
  let detail = null; try { detail = await r.text(); } catch (e) {}
  return { ok: false, error: detail || ('http ' + r.status) };
}

/* ---- ONE RUN, CALLABLE FROM ANYWHERE ---------------------------------------
   The run logic used to live inside the /quizzard/run route, which meant the
   patrol could not reach it without either duplicating it or having the Worker
   fetch itself. Both are worse than moving it here. The route and the schedule
   now call the same function, so a quiz written at 3am is written by exactly
   the code a button press would have used. */
async function runOne(env, body) {

      const figure = String(body.figure || '').trim();
      /* Read the mode as a SET, not a special case. This line once read
         `body.mode === 'canon' ? 'canon' : 'life'` — so when source mode was
         added, every source request silently became a life request. The bridge
         sent it correctly; the Worker discarded it on arrival, and the result
         looked exactly like a caching problem. A whitelist cannot fail that way:
         a mode that is not known is REFUSED, not quietly replaced. */
      const MODES = ['life', 'canon', 'source'];
      const mode = body.mode ? String(body.mode).toLowerCase() : 'life';
      if (MODES.indexOf(mode) === -1) return json({
        status: 'halted', figure: figure, reason: 'unknown-mode',
        note: 'Mode "' + mode + '" is not one of ' + MODES.join(', ') + '.', spent: false });
      const commit = body.commit === true;
      if (!figure) return json({ error: 'figure required' }, 400);

      /* GUARD THE INPUT BEFORE SPENDING ANYTHING.
         A batch of names pasted into a single-figure field arrives as one long
         string — "Cleopatra VII Nikola Tesla Tacitus David Hume ...". The model
         researched it and only tripped on passage length, which cost real money
         and told us nothing. No person's name is nine words long. Step 1 is
         IDENTIFY, so identify failures belong here, before the API call. */
      var fw = figure.split(/\s+/).filter(Boolean);
      if (fw.length > 6 || figure.length > 64) {
        return json({
          status: 'halted', figure: figure, reason: 'ambiguous-identity',
          note: 'That is ' + fw.length + ' words — too long to be one person. If this was a list, '
              + 'use the batch panel, which runs one figure at a time.',
          spent: false
        });
      }
      if (/[,;\n|]|\band\b/i.test(figure)) {
        return json({
          status: 'halted', figure: figure, reason: 'ambiguous-identity',
          note: 'That reads as more than one figure. Give one name, or use the batch panel.',
          spent: false
        });
      }
      /* Canon mode is armed. The frames it may use are fixed in CANON_SPEC and
         were approved by the captain — the engine selects among them and may
         not invent one. See THE SACRED FRAMES, Rev. B. */

      const started = Date.now();
      const depth = Math.max(1, Math.min(3, parseInt(body.depth, 10) || 1));

      /* THE STACK · what is already written for this figure. Read before a
         single token is spent, so a figure whose life holds nothing further
         costs nothing to discover. */
      const already = await existingFor(env, figure);

      /* THE SHEET rides along with the quiz — same research, one more object.
         Asked for only when the figure has no character yet: a second quiz for
         Caesar should not re-argue his stat line, and the hand-made record
         would win at runtime anyway. */
      const wantSheet = (body.sheet === false) ? false : !(await characterExists(env, figure));

      /* SOURCE MODE · load the room before spending anything. If the figure has
         no reading room there is nothing to quote, and that is a halt, not an
         attempt. */
      let room = null, work = null, workText = null;
      if (mode === 'source') {
        const key = roomFor(figure);
        if (!key) return json({
          status: 'halted', figure: figure, reason: 'no-reading-room',
          note: 'No reading room exists for this figure, so there is no text to quote. '
              + 'Twenty-one figures have one. For the rest, use life mode.', spent: false });
        room = await loadRoom(key);
        if (!room) return json({ status: 'halted', figure: figure, reason: 'no-reading-room',
          note: 'The room index for "' + key + '" could not be read.', spent: false });
        work = body.work_id
             ? (room.works.filter(function (w) { return w.id === body.work_id; })[0] || room.works[0])
             : room.works[Math.floor(Math.random() * room.works.length)];
        workText = await loadWork(work);
        if (!workText) return json({ status: 'halted', figure: figure, reason: 'no-suitable-passage',
          note: 'The work "' + (work.title || work.file) + '" could not be read or is too short.', spent: false });
      }
      /* Searches must be counted across EVERY attempt, not the last one.
         A Douglass run researched on attempt 1, fixed word count on 2 and 3,
         and reported "searches: 0" — which reads exactly like a quiz written
         from memory. A number that cannot distinguish diligence from
         fabrication is worse than no number. */
      let totalSearches = 0;
      const messages = [{ role: 'user', content:
        mode === 'source'
          ? ('Write the quiz for ' + figure + ', from this text.\n\n'
             + 'WORK: ' + (work.title || work.file) + '\n'
             + 'SECTION: ' + (work.section || '—') + '\n'
             + 'SOURCE: ' + (work.source || '—') + '\n'
             + 'WORK_ID: ' + (work.id || work.file) + '\n'
             + (work.note ? 'NOTE: ' + work.note + '\n' : '')
             + '\n--- THE TEXT BEGINS ---\n'
             + workText.slice(0, 60000)
             + '\n--- THE TEXT ENDS ---\n\n'
             + 'Select ONE passage of 115-165 words and quote it VERBATIM as the "passage". '
             + 'The Worker holds this same file and will match your passage against it.')
          : ('Write the quiz for this figure: ' + figure) }];

      if (already.length) {
        messages[0].content +=
          '\n\n--- ALREADY WRITTEN. DO NOT REPEAT ANY OF THESE MOMENTS ---\n'
          + already.map(function (a) {
              return '· [depth ' + a.depth + '] ' + a.title + (a.era ? '  (' + a.era + ')' : '')
                   + '\n    opens: ' + a.opens;
            }).join('\n')
          + '\n\nThis figure already has ' + already.length + ' quiz'
          + (already.length === 1 ? '' : 'zes') + '. You are writing number '
          + (already.length + 1) + ', at DEPTH ' + depth + '.\n'
          + 'WHAT YOU MAY NOT REPEAT IS THE QUESTION, NOT THE MOMENT.\n'
          + 'Returning to a moment and asking something harder of it is the point of a '
          + 'stack. The Rubicon is one crossing and at least three quizzes: what happened; '
          + 'WHY it was treason, since a promagistrate crossing his province boundary under '
          + 'arms broke a specific law most people who know the phrase have never heard of; '
          + 'and where the river actually is, which is still disputed between three '
          + 'candidates, alongside what he actually said, which Suetonius and Plutarch do '
          + 'not agree on.\n'
          + 'So you may take the same moment. You may NOT produce the same quiz — the same '
          + 'passage, the same facts, the same keys wearing new wording. Ask what the '
          + 'earlier quiz did not: the law behind the act, the disagreement between sources, '
          + 'the consequence, the thing everyone repeats without knowing.\n'
          + 'HALT with "no-further-pivot" only when the figure genuinely holds nothing '
          + 'further — a minor figure with one recorded act and no scholarship around it. '
          + 'A major life is not exhausted by one quiz, or by ten.\n'
          + (depth === 3
              ? 'AT DEPTH 3 go where the sources DISAGREE, or into what the figure wrote in '
                + 'their own words. The location of the Rubicon, the wording of what was said '
                + 'at it, which account to believe. This is for the hair-splitters, and they '
                + 'are the ones who decide whether a place is serious.'
              : depth === 2
                ? 'AT DEPTH 2 go BENEATH the entry: the law, the cause, the consequence, the '
                  + 'thing the famous version leaves out. Another charge from the same life is '
                  + 'equally welcome — but a harder question about the same hour is not a '
                  + 'lesser quiz, it is usually a better one.'
                : '');
      }
      const attempts = [];

      for (let n = 1; n <= MAX_ATTEMPTS; n++) {
        const call = await callModel(env, messages, { mode: mode, sheet: wantSheet });
        if (!call.ok) return json({ status: 'error', attempt: n, error: call.error, httpStatus: call.status }, 502);

        const data = call.data;
        const text = extractText(data.content);
        const searches = (data.content || []).filter(function (b) { return b && b.type === 'server_tool_use'; }).length;
        totalSearches += searches;
        const usage = data.usage || {};
        const obj = parseJson(text);

        if (!obj) {
          attempts.push({ attempt: n, failure: 'model did not return parseable JSON' });
          messages.push({ role: 'assistant', content: text.slice(0, 2000) });
          messages.push({ role: 'user', content: 'That was not valid JSON. Return ONE raw JSON object only — no prose, no code fences.' });
          continue;
        }

        if (obj.status === 'halted') {
          return json({
            status: 'halted', figure: figure, reason: obj.reason || 'unspecified',
            note: obj.note || null, searches: totalSearches, usage: usage,
            elapsedMs: Date.now() - started, attempts: attempts
          });
        }

        const topicId = obj.topic_id;
        const payload = obj.payload;
        const filled = normalise(payload);          // constants only, never content
        let errs = validate(topicId, payload, mode);

        /* THE SHEET IS VALIDATED SEPARATELY AND HALTS SEPARATELY.
           A good quiz with a bad sheet ships the quiz. Losing both because one
           stat was fractional would be the wrong trade — the card can show a
           face and a quiz without bars, and has all evening. */
        let sheet = null, sheetErrs = [];
        if (wantSheet && obj && obj.sheet) {
          const skey = slugKey(figure);
          sheetErrs = validateSheet(skey, obj.sheet);
          if (!sheetErrs.length) sheet = { key: skey, sheet: obj.sheet };
        }

        /* THE PORTRAIT HALTS ON ITS OWN.
           Four artifacts, four verdicts. A figure may arrive with a good quiz,
           a good sheet and an unusable drawing, and the right outcome is to
           ship two and refuse one — the card has shown a badge instead of a
           face all evening and looks perfectly well doing it.

           Losing a researched quiz because a path was malformed would be the
           worst trade in the engine. */
        let portrait = null, portErrs = [], portWarn = [];
        if (wantSheet && obj && typeof obj.portrait === 'string') {
          const pv = validatePortrait(obj.portrait);
          portErrs = pv.errors; portWarn = pv.warnings;
          if (!portErrs.length) portrait = obj.portrait;
        }

        /* THE VERBATIM CHECK. The one thing no other mode can do: confirm the
           passage is genuine by finding it in the file. Whitespace and curly
           quotes are normalised — reflowing a paragraph is not forgery — but a
           changed word is. This is why fabrication is impossible here. */
        if (mode === 'source' && workText && payload && payload.passage) {
          if (flat(workText).indexOf(flat(payload.passage)) === -1) {
            errs.push('THE PASSAGE IS NOT IN THE SOURCE FILE. It was altered, paraphrased or '
                    + 'invented. Quote the text exactly as it appears in "' + (work.title || work.file) + '".');
          }
        }

        const sideBad = sheetErrs.length || portErrs.length;
        /* enter the retry path if EITHER failed — but see above: on the last
           attempt only the quiz can actually stop it */
        if (errs.length || sideBad) {
          /* ONE RETRY LOOP, ALL FOUR ARTIFACTS.
             The sheet and the portrait used to be judged AFTER the retry had
             already decided the run was good — so a bio two words over its
             limit was fatal, where a passage two words over gets three
             attempts. An arbitrary difference, and it cost a Columbus sheet
             that was otherwise sound. They now fail into the same loop. */
          const sideErrs = [];
          sheetErrs.forEach(function (x) { sideErrs.push('sheet: ' + x); });
          portErrs.forEach(function (x) { sideErrs.push('portrait: ' + x); });

          /* A SIDE ARTIFACT MAY ASK FOR A RETRY. IT MAY NEVER HALT THE RUN.
             Folding these into `errs` was meant to give the sheet and portrait
             the same three attempts the quiz gets. It also made them fatal —
             and on the very next patrol pass two fully researched quizzes,
             Paul the Apostle and Cai Lun, were thrown away because a DRAWING
             was six hundred characters thin.

             That is the worst trade in the engine and there is a comment forty
             lines above saying so. The four artifacts have four verdicts: only
             the quiz's own invariant can end the run. */
          const quizBad = errs.length > 0;
          if (n < MAX_ATTEMPTS && (quizBad || sideErrs.length)) {
            attempts.push({ attempt: n, failure: 'invariant',
                            errors: errs.concat(sideErrs) });
          } else if (quizBad) {
            attempts.push({ attempt: n, failure: 'invariant', errors: errs });
          }

          if (n < MAX_ATTEMPTS && (quizBad || sideErrs.length)) {
            messages.push({ role: 'assistant', content: JSON.stringify(obj).slice(0, 6000) });
            /* Be specific about the arithmetic. "Too long" produced 211 then 170;
               "remove at least 12 words" is a instruction that can be followed.
               Never trim the passage here — it is the source of truth for every
               answer key, and cutting a clause could orphan one. */
            var guide = '';
            var wc = (payload && payload.passage)
                   ? String(payload.passage).trim().split(/\s+/).filter(Boolean).length : 0;
            if (sheetErrs.length && obj && obj.sheet && typeof obj.sheet.bio === 'string') {
              const bw = obj.sheet.bio.trim().split(/\s+/).filter(Boolean).length;
              if (bw > 120) guide += '\n\nThe bio is ' + bw + ' words. REMOVE AT LEAST '
                + (bw - 112) + ' WORDS to bring it to 112 or fewer. Keep every fact; cut a clause.';
              else if (bw < 25) guide += '\n\nThe bio is ' + bw + ' words. ADD AT LEAST '
                + (32 - bw) + ' WORDS \u2014 that is a caption, not a life.';
            }
            if (wc > 165) guide = '\n\nThe passage is ' + wc + ' words. REMOVE AT LEAST '
                 + (wc - 158) + ' WORDS to bring it to 158 or fewer. Cut whole clauses that no '
                 + 'question depends on. Do not remove any fact an answer key rests on, and do '
                 + 'not change a single answer.';
            else if (wc && wc < 110) guide = '\n\nThe passage is ' + wc + ' words. ADD AT LEAST '
                 + (118 - wc) + ' WORDS of verified detail from the sources you already used.';
            messages.push({ role: 'user', content: 'The validator rejected that quiz:\n- '
                 + errs.join('\n- ') + guide
                 + '\n\nReturn a corrected JSON object. Keep every verified fact; fix only the structure.' });
            continue;
          }

          /* THE LAST ATTEMPT. ONLY THE QUIZ CAN END THE RUN.
             This line returned 'failed-validation' whenever anything was still
             wrong — and threw away Paul the Apostle and Cai Lun, both with
             sound quizzes, because a drawing was six hundred characters thin.

             A refused sheet or portrait is simply not written. The card shows
             a badge instead of a face, exactly as it has all along, and the
             quiz — the expensive part, the researched part — survives. */
          if (errs.length) {
            return json({
              status: 'halted', figure: figure, reason: 'failed-validation',
              note: 'The quiz did not satisfy the invariant after ' + MAX_ATTEMPTS + ' attempts.',
              errors: errs, searches: totalSearches, usage: usage,
              elapsedMs: Date.now() - started, attempts: attempts
            });
          }
          /* the quiz is good; drop whichever side artifact is not */
          if (sheetErrs.length) sheet = null;
          if (portErrs.length)  portrait = null;
        }

        /* THE CITATION THAT GETS STORED must be the work actually quoted — not
           whatever the model happened to search. In source mode the passage came
           out of a specific file with a specific attribution; storing a blog post
           it found on the way would leave the quiz unable to prove itself later.
           This was written correctly into the RESPONSE and wrongly into the
           TABLE, so the screen showed Project Gutenberg while the row held two
           web links. Compute it once, use it in both places. */
        const citation = (mode === 'source' && work)
          ? [ work.source, LIB + work.file ].filter(Boolean)
          : (obj.sources || []);

        /* The seeker must be able to see whose words these are. The `sources`
           column is the machine-readable copy; publicTopic() cannot reach it,
           so the human-readable one goes into the payload beside the passage.
           A quiz that quotes a man without naming him is not attribution. */
        if (mode === 'source' && work && payload) {
          payload.attribution = {
            room:    key,                    // 'tesla' — opens the reading room itself
            work:    work.title   || null,
            section: work.section || null,
            source:  work.source  || null,
            url:     LIB + work.file         // the raw file, kept only as a fallback
          };
        }


        const exists = await topicExists(env, topicId);
        let staged = null;
        /* a character row is written when the SHEET is sound. The portrait may
           be null beside it — a figure with bars and a bio and no face is a
           correct row, and the roster has rendered exactly that all evening. */
        let charError = null;
        if (commit && sheet) {
          charError = await stageCharacter(env, sheet.key, sheet.sheet.name, sheet.sheet, figure, portrait);
        }

        if (commit && !exists) staged = await stageTopic(env, topicId, payload, citation, mode, depth,
          (payload.facets && payload.facets.figure && payload.facets.figure[0]) || figure);

        return json({
          status: 'done', figure: figure, topic_id: topicId, payload: payload,
          sources: citation,
          work: mode === 'source' ? { id: work.id, title: work.title, section: work.section, source: work.source } : null, alreadyExists: exists,
          committed: !!(staged && staged.ok), stageError: staged && !staged.ok ? staged.error : null,
          depth: depth,
          sheet: sheet ? sheet.sheet : null,
          sheetKey: sheet ? sheet.key : null,
          sheetErrors: sheetErrs.length ? sheetErrs : null,
          portrait: portrait ? true : false,
          portraitBytes: portrait ? portrait.length : 0,
          portraitErrors: portErrs.length ? portErrs : null,
          portraitWarnings: portWarn.length ? portWarn : null,
          charStaged: !!(sheet && commit && !charError),
          charError: charError,
          alreadyHeld: already.map(function (a) { return a.id; }),
          searches: totalSearches,
          searchWarning: totalSearches === 0
            ? 'NO SEARCH WAS PERFORMED. The sources listed below were not retrieved on this run — treat every fact as unverified until checked by hand.'
            : null,
          usage: usage, model: env.MODEL || DEFAULT_MODEL,
          normalised: filled, attempt: n, elapsedMs: Date.now() - started
        });
      }

      return json({ status: 'halted', figure: figure, reason: 'no-parseable-output',
                    note: 'The model never returned valid JSON.', attempts: attempts }, 200);
    
}

/* ===========================================================================
   ROUTER
   =========================================================================== */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(BRIDGE_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...CORS }
      });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'amenti-quizzard', version: 'v1' });
    }

    if (!isAdmin(request, env)) return json({ error: 'forbidden' }, 403);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

    /* ---- ping: is the key good and does the model answer? ---------------- */
    if (request.method === 'GET' && url.pathname === '/quizzard/ping') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: env.MODEL || DEFAULT_MODEL, max_tokens: 16, messages: [{ role: 'user', content: 'Reply with the single word: ready' }] })
      });
      let d = null; try { d = await r.json(); } catch (e) {}
      return json({
        ok: r.ok,
        model: env.MODEL || DEFAULT_MODEL,
        reply: r.ok ? extractText(d && d.content) : null,
        error: r.ok ? null : ((d && d.error && d.error.message) || ('http ' + r.status))
      }, r.ok ? 200 : 502);
    }

    /* ---- run: one name in, one quiz or one refusal out ------------------- */
    /* ---- A CHARACTER, AND NOTHING ELSE ------------------------------------
       Sixteen figures in the library have a quiz and no card: a name, an era,
       and an empty frame where a face should be. Running /quizzard/run on them
       would fix that — and would also write a SECOND QUIZ for each, because the
       engine refuses to repeat a moment and so goes looking for a new one.
       Sixteen characters and sixteen quizzes nobody asked for.

       So this route researches the figure and writes ONLY the sheet and the
       portrait. It never touches topics. It is cheaper than a full run for the
       same reason: no quiz to write, validate or retry. */
    if (request.method === 'POST' && url.pathname === '/quizzard/character') {
      if (!isAdmin(request, env)) return json({ error: 'unauthorised' }, 401);
      let body = {}; try { body = await request.json(); } catch (e) {}
      const figure = String(body.figure || '').trim();
      if (!figure) return json({ error: 'figure required' }, 400);
      const mode = ['life','canon','source'].indexOf(body.mode) === -1 ? 'life' : body.mode;
      const commit = body.commit === true;
      const started = Date.now();

      if (await characterExists(env, figure))
        return json({ status: 'skipped', figure: figure,
          note: 'A character already exists for this figure. Delete the row to rebuild it.' });

      const messages = [{ role: 'user', content:
        'Write the CHARACTER SHEET and the PORTRAIT for this figure: ' + figure
        + '\n\nYou are NOT writing a quiz. Do not return a quiz, questions, or a passage. '
        + 'Return exactly two top-level keys: "sheet" and "portrait".'
        + (mode === 'canon'
            ? '\n\nTHIS FIGURE BELONGS TO A TRADITION RATHER THAN TO THE RECORD. The bio must '
              + 'not assert a life. Write what the tradition holds and say so — "the Homeric '
              + 'Hymns tell", "as the Eddas have it". The stats are a reading of the figure AS '
              + 'THE TRADITION DRAWS THEM, which is a real and defensible thing to read.'
            : '') }];

      const call = await callModel(env, messages, { mode: mode, sheet: true, characterOnly: true });
      if (!call.ok) return json({ status: 'error', figure: figure, error: call.error }, 502);

      /* callModel returns { ok, data } — the text comes out of data.content
         through extractText, exactly as runOne does it. Reading call.text
         would have parsed undefined and halted every figure as unparseable. */
      const obj = parseJson(extractText(call.data.content));
      if (!obj) return json({ status: 'halted', figure: figure, reason: 'unparseable',
        note: 'The model did not return usable JSON.' });

      const key = slugKey(figure);
      const sheetErrs = obj.sheet ? validateSheet(key, obj.sheet) : ['no sheet returned'];
      let portrait = null, portErrs = [];
      if (typeof obj.portrait === 'string') {
        const pv = validatePortrait(obj.portrait);
        portErrs = pv.errors;
        if (!portErrs.length) portrait = obj.portrait;
      } else { portErrs = ['no portrait returned']; }

      /* THE SHEET IS THE RUN. A sheet with no portrait is a card with bars and
         a badge, which the roster has rendered all along. A portrait with no
         sheet is a face with nothing behind it, and that is not a character. */
      if (sheetErrs.length)
        return json({ status: 'halted', figure: figure, reason: 'failed-validation',
          errors: sheetErrs, portraitErrors: portErrs.length ? portErrs : null,
          elapsedMs: Date.now() - started });

      let staged = null;
      if (commit) staged = await stageCharacter(env, key, obj.sheet.name, obj.sheet, figure, portrait);

      return json({ status: 'done', figure: figure, key: key, mode: mode,
        sheet: obj.sheet, portrait: !!portrait, portraitBytes: portrait ? portrait.length : 0,
        portraitErrors: portErrs.length ? portErrs : null,
        committed: commit && !staged, stageError: staged,
        usage: call.data && call.data.usage, elapsedMs: Date.now() - started });
    }

    if (request.method === 'POST' && url.pathname === '/quizzard/run') {
      let body = {}; try { body = await request.json(); } catch (e) {}
      return await runOne(env, body);
    }

    /* ---- the patrol's own reading ---------------------------------------- */
    if (request.method === 'GET' && url.pathname === '/quizzard/queue') {
      const r = await fetch(SUPABASE_URL + '/rest/v1/quizzard_queue?select=status,mode,halt_reason', {
        headers: { apikey: env.SUPABASE_SECRET, Authorization: 'Bearer ' + env.SUPABASE_SECRET } });
      let rows = []; try { rows = await r.json(); } catch (e) {}
      const tally = {}, halts = {};
      (Array.isArray(rows) ? rows : []).forEach(function (x) {
        tally[x.status] = (tally[x.status] || 0) + 1;
        if (x.status === 'halted') halts[x.halt_reason || 'unstated'] = (halts[x.halt_reason || 'unstated'] || 0) + 1;
      });
      const next = await queueTake(env, 10);
      return json({ ok:true, total: (Array.isArray(rows) ? rows.length : 0),
                    status: tally, halts: halts, upNext: next, batch: PATROL_BATCH });
    }

    /* ---- fire one patrol run by hand, to watch it work ------------------- */
    if (request.method === 'POST' && url.pathname === '/quizzard/patrol') {
      const out = await patrol(env);
      return json({ ok:true, run: out });
    }

    return json({ error: 'not found' }, 404);
  },

  /* =========================================================================
     THE PATROL — scheduled, unattended, small
     -------------------------------------------------------------------------
     Cloudflare fires scheduled() on the cron you set. It takes PATROL_BATCH
     figures off the queue in rank order, runs each, and records what happened.

     EVERY OUTCOME IS WRITTEN BACK. A quiz gets its topic_id; a refusal gets
     its reason. Nothing is retried, because a halt is a finding: Homer will
     not become verifiable overnight, and paying to rediscover that every night
     is how an unattended system quietly bleeds.

     It writes STAGED. The patrol can fill the table and still cannot put a
     single quiz in front of a seeker — that gap is the review gate, and it is
     the only reason letting a machine run unwatched is defensible.
     ========================================================================= */
  async scheduled(event, env, ctx) {
    try { await patrol(env); } catch (e) { /* never throw in a cron handler */ }
  }
};

async function patrol(env) {
  if (!env.ANTHROPIC_API_KEY || !env.SUPABASE_SECRET) {
    return { ok:false, error:'not configured' };
  }
  const started = Date.now();
  const take = await queueTake(env, PATROL_BATCH);
  const out = { taken: take.length, done: 0, halted: 0, errored: 0,
                /* was this pass driven by demand or by rank? worth knowing when
                   reading a log a week later. */
                drivenBy: take.some(function (r) { return (r.wants || 0) > 0; }) ? 'demand' : 'rank',
                results: [] };

  for (let i = 0; i < take.length; i++) {
    const row = take[i];
    const figure = row.figure_name;
    const mode = ['life','canon','source'].indexOf(row.mode) === -1 ? 'life' : row.mode;

    /* claim it first, so a run that dies mid-flight does not leave the figure
       looking untouched and get picked up again on the next tick */
    await queueMark(env, figure, { attempts: (row.attempts || 0) + 1,
                                   attempted_at: new Date().toISOString(), status: 'running' });

    let res = null, data = null;
    try {
      res = await runOne(env, { figure: figure, mode: mode, depth: 1, commit: true });
      data = await res.json();
    } catch (e) {
      out.errored++;
      await queueMark(env, figure, { status: 'pending', note: 'threw: ' + String(e).slice(0, 180) });
      out.results.push({ figure: figure, outcome: 'error', note: String(e).slice(0, 120) });
      continue;
    }

    if (data && data.status === 'done') {
      out.done++;
      await queueMark(env, figure, { status: 'done', topic_id: data.topic_id, halt_reason: null,
                                     note: data.committed ? 'staged' : 'not written' });
      out.results.push({ figure: figure, outcome: 'done', topic_id: data.topic_id,
                         committed: !!data.committed, wants: row.wants || 0, band: row.band || 1 });
    } else if (data && data.status === 'halted') {
      out.halted++;
      /* RECORD THE CAUSE, NOT JUST THE VERDICT.
         The first halt this patrol produced said only "did not satisfy the
         invariant after 3 attempts" — a red light with no reason, which is
         precisely what the probe doctrine forbids. The engine returns the exact
         lines that failed; store them, or the log is a wall of shrugs. */
      const why = (data.errors && data.errors.length)
        ? data.errors.join(' | ')
        : (data.note || '');
      await queueMark(env, figure, { status: 'halted', halt_reason: data.reason || 'unstated',
                                     note: why.slice(0, 600) });
      out.results.push({ figure: figure, outcome: 'halted', reason: data.reason,
                         errors: data.errors || null, note: (data.note || '').slice(0, 140) });
    } else {
      out.errored++;
      await queueMark(env, figure, { status: 'pending', note: 'no verdict returned' });
      out.results.push({ figure: figure, outcome: 'error', note: 'no verdict' });
    }
  }

  out.elapsedMs = Date.now() - started;
  return out;
}
