<!doctype html>
<!-- ==========================================================================
  hall.html · ASK AMENTI — THE HALL'S OWN DOOR
  ---------------------------------------------------------------------------
  A standalone surface in Amenti.live. Page1 is NOT touched: this page carries
  its own proxy client (the same thirty lines, the same Worker, the same one
  door) and loads the hall scripts itself.

  Ruled 24 Aug: the hall lives with the ship, on its own page. It earns a link
  from the flagship's nav by proving itself here first — a link is one line;
  an injection is a graft.

  Serves at:  https://ianingram.github.io/Amenti.live/hall.html

  Needs, in this repo:
    HALL.md                 the meaning (authored)
    HALL-STATE.json         the counts (probes/probe-hall.mjs)
    ROSTER-INDEX.json       the souls  (probes/probe-roster.mjs)
    SOURCES.json            the catalogue (tools/sources.js — already live)
    amenti-hall.js          the answer path
    amenti-hall-box.js      the box
=========================================================================== -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ask Amenti · The Hall</title>
<meta name="description" content="Speak to the hall. Search the library of Amenti, and ask the building itself.">
<style>
  :root { color-scheme: dark light; }
  body {
    margin: 0; min-height: 100vh;
    color: #e8e4d8;
    font: 16px/1.6 Georgia, 'Times New Roman', serif;
    display: flex; flex-direction: column; align-items: center;
    position: relative;
  }
  /* THE PYRAMID AND THE PLANET — drawn, not fetched.
     Lifted from Brief XII (Amenti_Separation_of_Power.html), where the hero is
     pure CSS: a gold-lit planet (stacked radial gradients) with the near-black
     CSS-triangle pyramid in front of it. No image file — it renders on first
     paint, in a preview, and inside an iframe on any wall, with nothing to
     404. The house visual, reusable the way this project trusts: as code. */
  #hero-bg { position: fixed; inset: 0; z-index: 0; background: #06060e; overflow: hidden; }
  #hero-bg .planet {
    position: absolute; left: 50%; bottom: 20%; transform: translateX(-50%);
    width: min(74vw,760px); height: min(74vw,760px); border-radius: 50%;
    background:
      radial-gradient(circle at 38% 34%, rgba(217,169,58,.30), rgba(217,169,58,.10) 40%, transparent 62%),
      radial-gradient(circle at 62% 66%, #2a3342, #141c28 70%);
    box-shadow: 0 0 120px 24px rgba(217,169,58,.14), inset -40px -30px 90px rgba(0,0,0,.6);
  }
  #hero-bg .pyramid {
    position: absolute; left: 50%; bottom: 20%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: min(42vw,440px) solid transparent;
    border-right: min(42vw,440px) solid transparent;
    border-bottom: min(40vw,420px) solid #060b12;
    filter: drop-shadow(0 -2px 30px rgba(0,0,0,.7));
  }
  #hero-bg::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 55%,
      transparent 0%, rgba(6,6,14,.35) 60%, rgba(6,6,14,.65) 100%);
  }
  header { text-align: center; padding: 4.5rem 1rem 0.5rem; text-shadow: 0 2px 24px rgba(0,0,0,.7); }
  header h1 { font-size: 1.9rem; font-weight: normal; letter-spacing: .12em; margin: 0; }
  header p  { opacity: .6; font-size: .95rem; margin: .4rem 0 0; font-style: italic; }
  main { width: 100%; }
  footer { margin-top: auto; padding: 2rem 1rem; opacity: .45; font-size: .8rem; text-align: center; }
  footer .aa-links { display: flex; flex-direction: column; align-items: center; gap: .55rem; }
  footer .aa-llc { margin-top: 1rem; }
  footer a { color: inherit; }
  /* the box styles itself; #roster is absent here by design — it mounts at top of main */
  #ask-amenti { margin-top: 1rem; }
  header, main, footer { position: relative; z-index: 1; }

</style>
</head>
<body>

<div id="hero-bg" aria-hidden="true"><div class="planet"></div><div class="pyramid"></div></div>

<header>
  <h1>ASK&nbsp;AMENTI</h1>
</header>

<main id="hall-main"></main>

<footer>
  <div class="aa-links">
    <a href="Page1.html">enter the Living Library</a>
    <a href="Amenti_Separation_of_Power.html">The Separation of Power</a>
  </div>
  <div class="aa-llc">Ingram Manor LLC</div>
</footer>

<script>
/* The one door, carried by this page. Same Worker, same shape as Page1's
   client — duplicated DELIBERATELY so this page depends on nothing Page1
   loads. If the proxy contract changes, both clients change; that is the
   accepted cost of the flagship staying untouched. */
(function(){
  var PROXY = 'https://amenti-proxy.ingram-ian.workers.dev';
  var MODELS = ['claude-haiku-4-5-20251001','claude-sonnet-4-6'];
  var MODEL  = 'claude-sonnet-4-6';
  window.AmentiModel = { options: MODELS, DEFAULT: MODEL, get: function(){ return MODEL; }, set: function(){} };
  window.claude = {
    complete: async function(opts){
      opts = opts || {};
      var res = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: opts.system || '',
          messages: opts.messages || [],
          model: opts.model || MODEL
        })
      });
      if (!res.ok) {
        var t = await res.text().catch(function(){ return ''; });
        throw new Error('proxy ' + res.status + (t ? ' \u00b7 ' + t.slice(0,140) : ''));
      }
      var data = await res.json();
      if (data && data.usage) {
        window.AmentiCost = window.AmentiCost || { turns:0, inputTokens:0, outputTokens:0, last:null };
        window.AmentiCost.turns++;
        window.AmentiCost.inputTokens  += (data.usage.input_tokens  || 0);
        window.AmentiCost.outputTokens += (data.usage.output_tokens || 0);
        window.AmentiCost.last = { model: data.model, usage: data.usage, at: Date.now() };
      }
      return (data && data.reply ? String(data.reply) : '').trim();
    }
  };
})();
</script>
<script src="amenti-hall.js" defer></script>
<script src="amenti-hall-box.js" defer></script>

</body>
</html>
