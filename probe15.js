/* ============================================================================
   probe15 — THE TERMINAL IS ON THE CORE

   THE BUG THIS EXISTS TO CATCH, AND WHY NOTHING CAUGHT IT:

   Page1's Terminal is an IIFE. It runs at PARSE TIME and asks for the
   conversation core. amenti-chat.js was loaded EIGHT HUNDRED LINES LATER.
   So window.Amenti.chat did not exist, the guard failed, and termChat was NULL —
   and every call site quietly took the INLINE FALLBACK.

   THE TERMINAL HAS NEVER RUN amenti-chat.js.

   And FOURTEEN HARNESSES reported green, because every one of them did this:

       const c = window.Amenti.chat.create({...});   // <- creates its OWN object
       is(typeof c._payload === 'function', 'the anchored window is live');

   THAT TESTS THE FILE. IT DOES NOT TEST THE TERMINAL.

   The probe was standing next to the ship, describing the engine, without ever
   asking whether the engine was connected to the propeller.

   So this harness does the only thing that could have caught it: it EXECUTES
   THE PAGE'S ACTUAL SCRIPT SEQUENCE, in document order, and then asks the one
   question nobody asked — IS termChat NULL?
   ============================================================================ */
const fs = require('fs');
const path = process.argv[2] || 'Page1.html';

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);

/* ---- a browser, enough of one ------------------------------------------- */
function makeWindow() {
  const win = {};
  win.window = win;
  win.AMENTI_CONFIG = { AI_PROXY_URL: 'https://proxy.test' };
  win.claude = { complete: () => Promise.resolve('[move: reflect] ok') };
  win.AMENTI_CHARS = [{ key: 'caesar', name: 'Caesar', bio: 'x' }];
  win.navigator = { mediaDevices: {}, userAgent: 'test' };
  win.location = { search: '', href: 'https://amenti.live/Page1.html', pathname: '/Page1.html' };
  /* A DOM thin enough to be a stub, thick enough to be honest.

     The first version returned null from getElementById — so the Terminal threw
     on line 62, its own try{} swallowed the error, and termChat was never
     reached. WHICH IS EXACTLY HOW THIS BUG STAYED INVISIBLE FOR THE LIFE OF THE
     SYSTEM: a silent catch around the thing that never ran.

     Every element must exist, or the test measures the stub instead of the page. */
  const el = () => {
    const e = {
      style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
      children: [], value: '', textContent: '', innerHTML: '', disabled: false,
      appendChild(){}, removeChild(){}, insertBefore(){}, remove(){}, click(){}, focus(){},
      addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute: () => null,
      querySelector: () => el(), querySelectorAll: () => [],
      scrollTo(){}, scrollIntoView(){},
    };
    return e;
  };
  win.document = {
    readyState: 'loading',
    body: Object.assign(el(), { dataset: {} }),
    head: el(),
    createElement: () => el(),
    createTextNode: () => el(),
    getElementById: () => el(),
    querySelector: () => el(),
    querySelectorAll: () => [],
    addEventListener(){},
  };
  win.addEventListener = () => {};
  win.fetch = () => Promise.reject(new Error('offline'));
  win.console = console;
  win.setTimeout = setTimeout; win.clearTimeout = clearTimeout;
  win.AudioContext = function(){ this.sampleRate=16000; this.createMediaStreamSource=()=>({connect(){},disconnect(){}}); this.createScriptProcessor=()=>({connect(){},disconnect(){}}); this.close=()=>{}; };
  win.Blob = function(){}; win.URL = { createObjectURL:()=>'', revokeObjectURL(){} };
  return win;
}

/* Run a script IN the fake window's global scope, the way a browser does. */
function run(win, src, label) {
  const fn = new Function('window','document','navigator','location','console','fetch',
                          'setTimeout','clearTimeout','AudioContext','Blob','URL','addEventListener',
                          'with (window) { ' + src + '\n }');
  try {
    fn(win, win.document, win.navigator, win.location, console, win.fetch,
       win.setTimeout, win.clearTimeout, win.AudioContext, win.Blob, win.URL, win.addEventListener);
  } catch (e) {
    console.log('     (' + label + ' threw: ' + e.message.slice(0, 60) + ')');
  }
}

/* ---- extract the page's ACTUAL script sequence, in document order -------- */
function sequence(html) {
  const out = [];
  /* STRIP HTML COMMENTS FIRST.

     A comment in Page1 contains the words "script src" in a SENTENCE. The naive
     regex matched it as an opening tag and swallowed the four real script tags
     below it — so the probe reported the doctrine as "not loaded" when it was
     right there.

     This is the THIRD time today a comment has eaten the code. It was learned at
     probe3 (the word <script> written inside an HTML comment) and not applied.
     Learning a lesson is not the same as installing it. */
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  const out2 = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1], body = m[2];
    const src = /src="([^"]+)"/.exec(attrs);
    if (src) {
      if (/^https?:/.test(src[1])) continue;                 // CDN — not ours
      out.push({ kind: 'src', file: src[1] });
    } else if (body.trim()) {
      out.push({ kind: 'inline', body, terminal: /data-terminal="1"/.test(attrs) });
    }
  }
  return out;
}

/* ---- load the page and execute it, honestly ----------------------------- */
const html = fs.readFileSync(path, 'utf8');
const seq = sequence(html);
const win = makeWindow();

console.log('\nEXECUTING THE PAGE, IN DOCUMENT ORDER');
let terminalRan = false;
for (const step of seq) {
  if (step.kind === 'src') {
    if (!fs.existsSync(step.file)) continue;                 // only the modules we have
    run(win, fs.readFileSync(step.file, 'utf8'), step.file);
    console.log('   loaded  ' + step.file + (win.Amenti && win.Amenti.chat && step.file === 'amenti-chat.js' ? '   → Amenti.chat now exists' : ''));
  } else if (step.terminal) {
    console.log('   \u25b6 THE TERMINAL IIFE RUNS HERE');
    run(win, step.body, 'terminal');
    terminalRan = true;
  }
}

console.log('\nTHE QUESTION NOBODY ASKED');
is(terminalRan, 'the Terminal IIFE executed');

const term = win.Amenti && win.Amenti.terminal;
const which = win.Amenti && win.Amenti.terminalPath;

is(term !== null && term !== undefined,
   'termChat IS NOT NULL \u2014 the Terminal is on the CORE, not the inline fallback');
is(which === 'core', 'Amenti.terminalPath === "core"   (it read: ' + which + ')');

console.log('\nAND IT IS THE REAL CORE, WITH THE REAL DOCTRINE');
if (term) {
  is(typeof term._payload === 'function', 'the Terminal has the ANCHORED WINDOW');
  is(!!term.MOVES && !!term.MOVES.turnhold, 'the Terminal has THE TURN \u2014 read from the doctrine');
  is(!!(term.MOVES.turnhold && term.MOVES.turnhold.gate === false), '\u2026with gate:false. Silence is assent.');
  is(!!term.ARREST_HEAVY && term.ARREST_HEAVY.length > 20, 'the Terminal has the detectors');
  is(typeof term._isSelfEcho === 'function', 'the Terminal has the loop-breaker');
  is(typeof term._speakable === 'function', 'the Terminal has the mouth guard');
  is(term._barge === false && term._arrestOn === false, 'and the microphone is STILL dark');
} else {
  console.log('  \u2717 termChat is null \u2014 the Terminal is on the INLINE FALLBACK.');
  console.log('    Nothing built into amenti-chat.js is running. Not one line of it.');
}

console.log('\nTHE DOCTRINE LOADED FIRST');
is(!!(win.Amenti && win.Amenti.doctrine), 'Amenti.doctrine is aboard');
is(!!(win.Amenti && win.Amenti.doctrine && win.Amenti.doctrine.REGISTERS),
   'and the registers came with it \u2014 ONE copy, and the engine can see it');

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED' : '\u2713 all ' + P + ' passed \u2014 THE TERMINAL IS ON THE CORE'));
process.exit(F ? 1 : 0);
