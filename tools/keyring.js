<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Keyring · Amenti Fleet</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Special+Elite&family=Rajdhani:wght@300;400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="amenti.css">
<!--
  ==========================================================================
   THE KEYRING  ·  keyring.html  ·  Fleet-Documents
  --------------------------------------------------------------------------
   THIS PANE TYPES NOTHING. It reads KEYS.json, written by tools/keyring.js
   walking names.csv and PLATES.json, and carried here by the Glass Gate.

   WHY IT EXISTS
   Plates, rooms, scenes and the proxy all point at each other BY KEY, and
   nothing ever declared what a key is. Not one convention — FOUR, none of
   them written down. Every checker anyone wrote was a guess at the habit,
   every guess was approximately right, and the same conversation came round
   every few weeks.

   THE STATE THIS PANE EXISTS FOR IS `LOADED`.
   A key is not wrong until a second soul answers to it. `caesar` was correct
   for months — one room, one set of plates, one man — and became ambiguous
   the moment Augustus came aboard. Nothing warned anybody, because nothing
   was watching the shape of the names.

   EMPTY GLASS: if KEYS.json cannot be read, this pane says so and shows
   nothing else.
  ==========================================================================
-->
<style>
:root{
  --gold:#d4a017; --gold-b:#f5c542; --gold-bright:#f5c542; --gold-light:#f0c040;
  --neon:#00ffe0; --term:#57c98a; --violet:#c4a5ff; --tblue:#57b6ff;
  --amber:#fbbf24; --red:#f87171;
  --ink:#08090e; --granite:#11131c; --slate:#232838; --wire:#343b52;
  --text:#c8ccdc; --dim:#8f95ab;
  --mono:'Share Tech Mono',monospace; --body:'Rajdhani',sans-serif;
  --disp:'Amenti Display','Special Elite',serif;
}
*{box-sizing:border-box}
html,body{margin:0;background:var(--ink)}
body{font-family:var(--body);font-weight:300;font-size:18px;line-height:1.62;color:var(--text);
  padding:0 0 90px;background-image:radial-gradient(ellipse at 50% -8%,rgba(212,160,23,.10),transparent 60%)}
main{max-width:1120px;margin:0 auto;padding:26px 30px 0}

.stamp{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px 18px;
  padding:0 2px 12px;border-bottom:1px solid var(--slate);
  font-family:var(--disp);font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.stamp .doc{color:var(--gold)}.stamp .live{color:var(--term)}.stamp .sep{opacity:.35;margin:0 5px}
.stamp .sm{flex-basis:100%;order:3;color:var(--gold);opacity:.75}
@media(min-width:760px){.stamp .sm{flex-basis:auto;order:0}}

header{padding:34px 0 6px}
.eyebrow{font-family:var(--disp);font-size:15px;letter-spacing:.26em;text-transform:uppercase;color:var(--neon);margin:0 0 14px}
h1{font-family:var(--disp);font-weight:700;font-size:clamp(34px,5.6vw,58px);color:var(--gold-b);line-height:1;margin:0;
  text-shadow:0 0 34px rgba(245,197,66,.24)}
h1 .the{display:block;font-size:.27em;letter-spacing:.34em;color:var(--gold);opacity:.85;text-shadow:none;margin-bottom:.04em}
.tag{font-family:var(--disp);font-weight:500;font-size:clamp(16px,2.1vw,21px);color:#e6e9f2;letter-spacing:.18em;text-transform:uppercase;margin:14px 0 0}
.rule{width:170px;height:1px;margin:22px 0 26px;background:linear-gradient(90deg,var(--gold),transparent)}

h2{font-family:var(--disp);font-weight:600;font-size:clamp(23px,3vw,31px);letter-spacing:.06em;color:var(--gold);
  margin:48px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--slate)}
p{max-width:80ch;margin:12px 0}
em{color:var(--gold-b);font-style:italic}b{font-weight:600;color:#e6e9f2}
code{font-family:var(--mono);font-size:15px;color:var(--neon);background:rgba(0,255,224,.07);padding:1px 6px;border-radius:3px}

#glass{display:none;border:1px solid rgba(248,113,113,.34);border-radius:8px;
  background:rgba(248,113,113,.05);padding:26px 24px;margin:26px 0}
#glass .gk{font-family:var(--disp);font-size:19px;letter-spacing:.16em;text-transform:uppercase;color:var(--red)}
#glass .gv{margin-top:10px;font-size:17px;max-width:76ch}

.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;
  background:var(--slate);border:1px solid var(--slate);border-radius:8px;overflow:hidden;margin:22px 0}
.cell{background:var(--granite);padding:14px 16px}
.cell .ck{font-family:var(--disp);font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.cell .cv{font-family:var(--disp);font-weight:700;font-size:34px;line-height:1.05;margin-top:6px;color:#fff}
.cv.n{color:var(--gold-b)}.cv.am{color:var(--amber)}.cv.ok{color:var(--term)}.cv.bad{color:var(--red)}
.cell .cs{font-family:var(--disp);font-size:13px;letter-spacing:.05em;color:var(--dim);margin-top:4px}

.grp{border-left:3px solid var(--wire);padding:12px 0 12px 20px;margin:18px 0}
.grp.AMBIGUOUS{border-left-color:var(--red)}
.grp.LOADED{border-left-color:var(--amber)}
.grp.ORPHAN{border-left-color:var(--violet)}
.grp.RESOLVED{border-left-color:var(--term)}
.grp .gk{font-family:var(--disp);font-size:16px;letter-spacing:.14em;text-transform:uppercase}
.grp.AMBIGUOUS .gk{color:var(--red)} .grp.LOADED .gk{color:var(--amber)}
.grp.ORPHAN .gk{color:var(--violet)} .grp.RESOLVED .gk{color:var(--term)}
.grp .gd{margin-top:5px;font-size:17px;max-width:84ch;color:var(--dim)}
.grp .rows{margin-top:12px}
.grp .r{display:grid;grid-template-columns:200px 1fr;gap:14px;padding:6px 0;align-items:baseline;
  border-top:1px solid #171d29}
.grp .r:first-child{border-top:none}
.grp .kk{font-family:var(--mono);font-size:15px;color:var(--gold-b)}
.grp .kv{font-size:16.5px}
.grp .kv .soul{color:#e6e9f2}
.grp .kv .vs{color:var(--red);font-family:var(--mono);font-size:13px;margin:0 8px}
.grp .kv .fuse{color:var(--amber);font-size:15px}
@media(max-width:620px){.grp .r{grid-template-columns:1fr;gap:2px}}

table{width:100%;border-collapse:collapse;margin:18px 0;border:1px solid var(--slate)}
th{font-family:var(--disp);font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);
  text-align:left;padding:10px 13px;background:#0d0f17;border-bottom:1px solid var(--slate)}
td{padding:10px 13px;font-size:16px;border-bottom:1px solid #171d29;vertical-align:top}
tr:last-child td{border-bottom:none}
td.m{font-family:var(--mono);font-size:14px}
td.g{font-family:var(--mono);font-size:14px;color:var(--gold-b);white-space:nowrap}
td.n{font-family:var(--mono);font-size:14px;color:var(--tblue);text-align:right}

.law{font-family:var(--disp);font-weight:500;font-size:clamp(16px,2vw,20px);letter-spacing:.05em;line-height:1.85;
  text-align:center;color:var(--gold-b);border:1px solid rgba(245,197,66,.30);border-radius:6px;
  background:rgba(245,197,66,.05);padding:18px 22px;margin:32px 0}
.law.red{color:var(--red);border-color:rgba(248,113,113,.30);background:rgba(248,113,113,.05)}
.empty{font-family:var(--disp);font-size:16px;letter-spacing:.05em;color:var(--term);padding:8px 0}

.foot{font-family:var(--disp);font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);
  text-align:center;line-height:2;border-top:1px solid var(--slate);margin-top:54px;padding-top:22px}
@media(max-width:640px){main{padding:20px 16px 0}body{font-size:17px}table{display:block;overflow-x:auto}}
</style>
</head>
<body>
<div id="fleet-nav"></div>
<script src="fleet-nav.js"></script>
<main>

<div class="stamp">
  <div><span class="doc">Fleet Pane</span><span class="sep">·</span><span>Keyring</span></div>
  <div class="sm">Ingram Manor LLC</div>
  <div><span class="live" id="stamp-read">reading KEYS.json…</span></div>
</div>

<header>
  <p class="eyebrow">One name · one key · one soul</p>
  <h1><span class="the">The</span>Keyring</h1>
  <p class="tag">What every key reaches</p>
  <div class="rule"></div>
  <p>Plates, rooms, scenes and the proxy all point at each other <b>by key</b>,
  and nothing ever declared what a key is. Not one convention — <b>four</b>, and
  none of them written down. Every checker anyone wrote was a guess at the
  habit, every guess was approximately right, and the same argument came round
  every few weeks.</p>
</header>

<div id="glass">
  <div class="gk">Empty glass</div>
  <div class="gv">This pane cannot read <code>KEYS.json</code>. Nothing below is
  shown. The file is written by <code>tools/keyring.js</code> and carried here
  by the Glass Gate — if it is missing, the register has not run or the gate is
  not publishing it.</div>
</div>

<div id="deck" hidden>

<div class="strip" id="counts"></div>
<p id="readline"></p>

<h2>What the ship calls people</h2>
<p>Four shapes, all in use, all legitimate. The register recognises each and
records which one resolved every key — so a reader can see the habit rather
than infer it.</p>
<table>
  <thead><tr><th>Shape</th><th>What it does</th><th>Keys</th></tr></thead>
  <tbody id="shapes"></tbody>
</table>

<h2>The findings</h2>
<div id="findings"></div>

<div class="law red">A KEY IS NOT WRONG UNTIL A SECOND SOUL ANSWERS TO IT.<br>
BY THEN IT IS EXPENSIVE.</div>

<p><code>caesar</code> was correct for months. One room holding the Gallic War
and the Civil War, one set of plates, one man, and the manifest naming Julius
outright. <b>It became ambiguous the moment Augustus came aboard</b> — and
nothing warned anybody, because until this register nothing was watching the
shape of the names.</p>

<h2>Every key</h2>
<table>
  <thead><tr><th>Key</th><th>State</th><th>Reaches</th><th>Shape</th><th>Plates</th></tr></thead>
  <tbody id="all"></tbody>
</table>

</div>

<p class="foot">
  Amenti Fleet<br>
  Ingram Manor LLC<br>
  Keyring · reads KEYS.json · nothing on this pane was typed
</p>

<script>
(async function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  let R;
  try {
    const res = await fetch('KEYS.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    R = await res.json();
  } catch (e) {
    $('glass').style.display = 'block';
    $('stamp-read').textContent = 'empty glass';
    $('stamp-read').style.color = 'var(--red)';
    return;
  }

  const T = R.totals || {}, keys = R.keys || [];
  $('deck').hidden = false;
  const when = R.generated ? R.generated.replace('T', ' ').slice(0, 16) + ' UTC' : 'unknown';
  $('stamp-read').textContent = 'read ' + when;

  /* ── counts ─────────────────────────────────────────────────────────── */
  const cells = [
    ['Souls',     T.souls,     'n',  'on the roster'],
    ['Keys',      T.keys,      '',   T.plates + ' plate · ' + T.rooms + ' room'],
    ['Resolved',  T.resolved,  'ok', 'one soul each'],
    ['Loaded',    T.loaded,    T.loaded ? 'am' : 'ok', 'a fuse, not a fault'],
    ['Ambiguous', T.ambiguous, T.ambiguous ? 'bad' : 'ok', 'two souls answer'],
    ['Orphan',    T.orphan,    T.orphan ? 'am' : 'ok', 'no soul answers'],
  ];
  $('counts').innerHTML = cells.map(([k, v, cls, sub]) =>
    '<div class="cell"><div class="ck">' + esc(k) + '</div>' +
    '<div class="cv ' + cls + '">' + esc(v == null ? '—' : v) + '</div>' +
    '<div class="cs">' + esc(sub) + '</div></div>').join('');

  $('readline').innerHTML = T.declaredColumn
    ? 'The roster carries a <code>key</code> column, so nothing has to infer. '
      + 'Every register reads the key rather than guessing at the habit.'
    : '<b>The roster carries no <code>key</code> column.</b> Every register '
      + 'downstream infers a key from a name, and four different conventions are '
      + 'in use. <code>tools/keys.js</code> writes that column from what the ship '
      + 'already uses — and refuses while any key below is ambiguous, because a '
      + 'key column with a guess in it is worse than none.';

  /* ── shapes ─────────────────────────────────────────────────────────── */
  const S = R.shapes || {};
  const tally = {};
  keys.forEach(k => { if (k.shape) tally[k.shape] = (tally[k.shape] || 0) + 1; });
  $('shapes').innerHTML = Object.keys(S).map(s =>
    '<tr><td class="g">' + esc(s) + '</td><td>' + esc(S[s]) + '</td>'
    + '<td class="n">' + (tally[s] || 0) + '</td></tr>').join('');

  /* ── findings, worst first ──────────────────────────────────────────── */
  const D = R.states || {};
  const NOTE = {
    AMBIGUOUS: 'Two souls answer to one key. Neither can claim it, and no tool '
      + 'will choose — picking one would invent an answer to a question the captain '
      + 'has not been asked. This is a decision, not a defect.',
    LOADED: 'Correct today. Each of these is a single soul with a short key, and '
      + 'another name on the roster already contains it. The day that figure is '
      + 'onboarded, the key becomes ambiguous — cheap to change now, a migration later.',
    ORPHAN: 'A key no soul answers to. Drift, or a scene filed as a figure. '
      + '<code>gw-winter</code> was the last of these: George Washington at Valley '
      + 'Forge, registered as a man called <em>gw</em>.',
  };
  const out = [];
  for (const st of ['AMBIGUOUS', 'LOADED', 'ORPHAN']) {
    const rows = keys.filter(k => k.state === st);
    if (!rows.length) continue;
    out.push('<div class="grp ' + st + '">'
      + '<div class="gk">' + st + ' · ' + rows.length + '</div>'
      + '<div class="gd">' + NOTE[st] + '</div>'
      + '<div class="rows">' + rows.map(k => {
          let right;
          if (st === 'AMBIGUOUS') right = k.resolvesTo.map(n => '<span class="soul">' + esc(n) + '</span>').join('<span class="vs">vs</span>');
          else if (st === 'LOADED') right = '<span class="soul">' + esc(k.resolvesTo[0]) + '</span>'
            + '<span class="fuse"> — also matches ' + k.alsoMatches.map(esc).join(', ') + '</span>';
          else right = '<span class="fuse">' + (k.hasPlates ? 'has plates' : '')
            + (k.hasRoom ? (k.hasPlates ? ' and a room' : 'has a room') : '')
            + ' — belongs to nobody the roster carries</span>';
          return '<div class="r"><div class="kk">' + esc(k.key) + '</div><div class="kv">' + right + '</div></div>';
        }).join('') + '</div></div>');
  }
  $('findings').innerHTML = out.length ? out.join('')
    : '<div class="empty">Every key reaches exactly one soul, and none is loaded.</div>';

  /* ── every key ──────────────────────────────────────────────────────── */
  const ORDER = { AMBIGUOUS: 0, ORPHAN: 1, LOADED: 2, RESOLVED: 3 };
  const sorted = keys.slice().sort((a, b) =>
    (ORDER[a.state] - ORDER[b.state]) || a.key.localeCompare(b.key));
  const COL = { AMBIGUOUS: 'var(--red)', LOADED: 'var(--amber)', ORPHAN: 'var(--violet)', RESOLVED: 'var(--term)' };
  $('all').innerHTML = sorted.map(k =>
    '<tr><td class="g">' + esc(k.key) + '</td>'
    + '<td class="m" style="color:' + COL[k.state] + '">' + esc(k.state) + '</td>'
    + '<td>' + (k.resolvesTo.length ? k.resolvesTo.map(esc).join(' · ') : '<span style="color:var(--dim)">—</span>') + '</td>'
    + '<td class="m" style="color:var(--dim)">' + esc(k.shape || '—') + '</td>'
    + '<td class="m" style="color:var(--dim)">' + (k.variants.length ? k.variants.join(' ') : '—') + '</td></tr>').join('');
})();
</script>

</main>
</body>
</html>
