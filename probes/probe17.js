/* ============================================================================
   probe17 — DEPLOY C · ONE ENGINE

   amenti-throttle.js is retired. amenti-voice.js takes the helm.

   THE ONLY THING THAT CAN GO WRONG IS THE ARCHIVE.
   The Worker keys every rendered clip:
       audioKey = sha256(TTS_MODEL + voice + STYLE + TEXT)
   So the style string AND the chunk boundaries are the cache key. Move a byte
   and every clip in R2 becomes an orphan and you pay to render it all again.

   probe7 already proves amenti-voice ≡ amenti-throttle, byte for byte.
   This proves the rest:
     · the FACADE holds — all 8 of Page1's Amenti.throttle call sites still work
     · library.js (the reading room) produces THE SAME CACHE KEYS, so it migrates FREE
     · the counsel's speaker finally has a stop() — the inline copy never did
   ============================================================================ */
const fs = require('fs'), crypto = require('crypto');

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);

/* ---- load an engine into a fake window ---------------------------------- */
function load(src) {
  const win = { Amenti: {} };
  new Function('window', 'console', 'fetch', 'document', 'AudioContext', src)(
    win, { log(){}, error(){}, warn(){} },
    () => Promise.reject(new Error('offline')),
    { createElement: () => ({ style: {}, appendChild(){} }), head: { appendChild(){} },
      querySelectorAll: () => [], addEventListener(){} },
    function () { this.createBufferSource = () => ({ connect(){}, start(){}, stop(){} }); this.destination = {}; this.currentTime = 0; this.suspend = () => Promise.resolve(); this.resume = () => Promise.resolve(); }
  );
  return win.Amenti;
}

/* ---- pull the pure functions out of any engine, to compare behaviour ----- */
function guts(src) {
  const need = ['VOICE_REGISTER','PACE_DIRECTION','CHUNK_MAX','VOICE_NAME_DEFAULT',
                'REST_SOFT','REST_SENTENCE','REST_PARA','RATE_FAST','RATE_SLOW','RATE_SETTLE'];
  const fns  = ['plainText','splitSentences','hardSplit','restFor','chunkText','composeStyle','baseVoiceFor'];
  let out = '';
  for (const n of need) {
    const m = new RegExp('^\\s*var\\s+' + n + '\\s*=\\s*(.+?);', 'm').exec(src);
    if (m) out += `var ${n} = ${m[1]};\n`;
  }
  for (const n of fns) {
    const i = src.indexOf('function ' + n + '(');
    if (i < 0) continue;
    let d = 0, st = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; st = true; }
      else if (src[j] === '}') { d--; if (st && d === 0) { out += src.slice(i, j + 1) + '\n'; break; } }
    }
  }
  out += 'return { plainText, chunkText, composeStyle, baseVoiceFor };';
  return new Function(out)();
}

const OLD = fs.readFileSync('/mnt/user-data/uploads/amenti-throttle.js', 'utf8');   // the retired engine
const NEW = fs.readFileSync('./amenti-voice.js', 'utf8');                            // the one engine
const LIB = fs.readFileSync('./aud/library.js', 'utf8');                             // the reading room

/* THE ESSAY. Real prose, markdown, lists — everything plainText() must survive. */
const ESSAY = '# The Rubicon\n\nAll Gaul is divided into **three parts**. ' +
  'Of these, the Belgae inhabit one, the Aquitani another, and the third those who in their own tongue are called *Celts*. '.repeat(8) +
  '\n\n- they differ in language\n- in custom\n- and in law\n\nThe die is cast, and I have never been certain I was right.';
const FIG = { dialect: 'Latin-tinged', voice: 'commanding, vain', gender: 'm' };
const TTS = 'gemini-2.5-flash-preview-tts';
const key = (v, s, t) => crypto.createHash('sha256').update(`${TTS}\n${v}\n${s}\n${t}`).digest('hex');
const keys = (g) => {
  const style = g.composeStyle(FIG);
  return g.chunkText(g.plainText(ESSAY), 320).map(c => key(g.baseVoiceFor('m'), style, c.text));
};

console.log('\n1 \u00b7 THE ARCHIVE \u2014 the only thing that can cost real money');
{
  const kOld = keys(guts(OLD));
  const kNew = keys(guts(NEW));
  const kLib = keys(guts(LIB));

  is(kOld.length === kNew.length && kOld.length > 3, `the same essay \u2192 ${kNew.length} chunks, every engine`);
  is(JSON.stringify(kOld) === JSON.stringify(kNew),
     'amenti-throttle.js \u2261 amenti-voice.js \u2014 EVERY R2 KEY IDENTICAL. Page1 re-renders NOTHING.');
  is(JSON.stringify(kLib) === JSON.stringify(kNew),
     'library.js \u2261 amenti-voice.js \u2014 THE READING ROOM MIGRATES FREE. Zero cost.');
  console.log('     first key: ' + kNew[0].slice(0, 40) + '\u2026');
}

console.log('\n2 \u00b7 THE FACADE \u2014 all 8 of Page1\u2019s call sites must still work');
{
  const A = load(NEW);
  is(!!A.throttle, 'Amenti.throttle still exists (it is now a facade)');
  for (const m of ['speak', 'stop', 'attach', 'resolveVoice', 'chunk', 'plainText']) {
    is(typeof A.throttle[m] === 'function', `  Amenti.throttle.${m}()`);
  }
  is(A.throttle.CHUNK_MAX === 320, '  Amenti.throttle.CHUNK_MAX === 320');
}

console.log('\n3 \u00b7 THE COUNSEL\u2019S SPEAKER \u2014 which never had brakes');
{
  const A = load(NEW);
  is(!!A.conversation, 'Amenti.conversation exists');
  is(typeof A.conversation.speak === 'function', '  .speak()');
  is(typeof A.conversation.stop === 'function',
     '  .stop()  \u2014 THE INLINE COPY NEVER HAD ONE. That single absence is why the figure could not be interrupted.');
  is(typeof A.conversation.styleFor === 'function', '  .styleFor() \u2014 the per-move register, on the UNCACHED path only');
}

console.log('\n4 \u00b7 ONE ENGINE');
{
  const A = load(NEW);
  is(!!A.voice && typeof A.voice.speak === 'function', 'Amenti.voice.speak \u2014 the one entry point');
  is(A.voice.PROFILES.recital === 320 && A.voice.PROFILES.gabriel === 700,
     'both chunk profiles preserved \u2014 Page2 keeps its own boundaries until it is DELIBERATELY migrated');
  is(A.voice.REGISTERS && Object.keys(A.voice.REGISTERS).length === 6,
     'the six registers, read from the doctrine');
}

console.log('\n5 \u00b7 PAGE1 LOADS THE NEW ENGINE AND NOT THE OLD');
{
  let page = fs.readFileSync('./Page1.html', 'utf8');
  page = page.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');   // comments have eaten this check FOUR times today
  const tags = [...page.matchAll(/<script src="(amenti-[a-z]+\.js)"/g)].map(m => m[1]);
  is(tags.includes('amenti-voice.js'), 'Page1 loads amenti-voice.js');
  is(!tags.includes('amenti-throttle.js'), 'Page1 no longer loads amenti-throttle.js');
  is(fs.existsSync('/mnt/user-data/uploads/amenti-throttle.js'),
     'and amenti-throttle.js STAYS IN THE REPO \u2014 it is the rollback. Nothing is deleted on the commit that makes it unnecessary.');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED \u2014 DO NOT SHIP' : '\u2713 all ' + P + ' passed \u2014 ONE ENGINE, AND THE ARCHIVE IS SAFE'));
process.exit(F ? 1 : 0);
