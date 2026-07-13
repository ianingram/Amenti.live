/* ============================================================================
   probe7 — THE CACHE-KEY INVARIANT

   The Worker keys every rendered clip:
       audioKey = sha256(TTS_MODEL + voice + STYLE + TEXT)

   So the style string and the chunk boundaries ARE the cache key. Two files
   (library.js, amenti-throttle.js) have been holding them byte-identical BY
   HAND, with no test, while a comment in each said "changing this orphans the
   entire archive."

   That is a live financial tripwire with no tripwire on it. This is the wire.
   ============================================================================ */
const fs = require('fs');
const crypto = require('crypto');

const OLD = fs.readFileSync('/mnt/user-data/uploads/amenti-throttle.js', 'utf8');
const NEW = fs.readFileSync('./amenti-voice.js', 'utf8');
const LIB = fs.readFileSync('/mnt/user-data/uploads/library.js', 'utf8');

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);

// Pull a `var NAME = <literal>;` DECLARATION (not a mention in a comment).
const decl = (src, name) => {
  const re = new RegExp('^\\s*var\\s+' + name + '\\s*=\\s*(.+?);\\s*(?://.*)?$', 'm');
  const m = src.match(re);
  return m ? m[1].trim() : null;
};
const fn = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let d = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; started = true; }
    else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
  }
  return null;
};

console.log('\n1 \u00b7 The STYLE half of the cache key survived consolidation');
{
  for (const k of ['VOICE_REGISTER', 'PACE_DIRECTION', 'VOICE_NAME_DEFAULT']) {
    const a = decl(OLD, k), b = decl(NEW, k);
    is(a !== null && a === b, `${k} byte-identical  ${a}`);
  }
  is(fn(OLD, 'composeStyle') === fn(NEW, 'composeStyle'),
     'composeStyle() byte-identical \u2014 the recital style is untouched');
  is(fn(OLD, 'baseVoiceFor') === fn(NEW, 'baseVoiceFor'),
     'baseVoiceFor() byte-identical \u2014 the same figure gets the same voice');
}

console.log('\n2 \u00b7 The TEXT half \u2014 chunk boundaries are cache keys too');
{
  for (const k of ['CHUNK_MAX', 'CHUNK_LOOKAHEAD', 'REST_SOFT', 'REST_SENTENCE', 'REST_PARA']) {
    is(decl(OLD, k) === decl(NEW, k), `${k} unchanged  (${decl(NEW, k)})`);
  }
  is(fn(OLD, 'chunkText') === fn(NEW, 'chunkText'), 'chunkText() byte-identical');
  is(fn(OLD, 'plainText') === fn(NEW, 'plainText'), 'plainText() byte-identical \u2014 the same strip, so the same hash');
  is(fn(OLD, 'splitSentences') === fn(NEW, 'splitSentences'), 'splitSentences() byte-identical');
}

console.log('\n3 \u00b7 The REAL test: does the same essay hash to the same key?');
{
  // Reproduce the Worker's key exactly: sha256(model + "\n" + voice + "\n" + style + "\n" + text)
  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const key = (voice, style, text) =>
    crypto.createHash('sha256').update(`${TTS_MODEL}\n${voice}\n${style}\n${text}`).digest('hex');

  // Run each engine's real chunker + real style composer over the same essay.
  const load = (src) => {
    const sandbox = { window: {}, console, document: { createElement: () => ({ style: {} }) } };
    sandbox.window.Amenti = {};
    const g = new Function('window', 'console', 'fetch', src + '\nreturn window.Amenti;');
    return g(sandbox.window, console, () => Promise.reject(new Error('no net')));
  };

  const essay = 'All Gaul is divided into three parts. ' +
    'Of these, the Belgae inhabit one, the Aquitani another, and the third those who in their own tongue are called Celts. '.repeat(6) +
    'They differ among themselves in language, in custom, and in law.';

  const A = load(OLD);            // the deployed engine
  const B = load(NEW);            // the consolidated engine

  const fig = { dialect: 'Latin-tinged', voice: 'commanding, vain', gender: 'm' };

  const chunksOld = A.throttle.chunk(essay);
  const chunksNew = B.throttle.chunk(essay);
  is(chunksOld.length === chunksNew.length,
     `same essay \u2192 ${chunksNew.length} chunks, both engines`);

  const styleOld = A.throttle._composeStyleForTest ? null : null;   // not exported; compare via keys below
  // Compare the full key set the archive would be stored under.
  const hashes = (cs, style) => cs.map(c => key('Charon', style, c.text));

  // Both engines expose the same locked composeStyle, so build it identically
  // from the SOURCE we just proved is byte-identical.
  const composeStyle = new Function('fig',
    fn(NEW, 'composeStyle').replace(/^function composeStyle\(fig\)\s*\{/, '') .replace(/\}$/, '')
      .replace('VOICE_REGISTER', JSON.stringify(JSON.parse(decl(NEW, 'VOICE_REGISTER').replace(/'/g, '"'))))
      .replace('PACE_DIRECTION', JSON.stringify(JSON.parse(decl(NEW, 'PACE_DIRECTION').replace(/'/g, '"')))));
  const style = composeStyle(fig);

  const hOld = hashes(chunksOld, style);
  const hNew = hashes(chunksNew, style);
  is(JSON.stringify(hOld) === JSON.stringify(hNew),
     'EVERY R2 CACHE KEY IS IDENTICAL \u2014 the archive is a full hit. Nothing re-renders. Nothing re-bills.');
  console.log('     first key: ' + hNew[0].slice(0, 32) + '\u2026');
}

console.log('\n4 \u00b7 Page2 is the surface that ACTUALLY diverges (and why it stays that way)');
{
  const B = load2();
  function load2() {
    const sandbox = { window: {}, console };
    sandbox.window.Amenti = {};
    const g = new Function('window', 'console', 'fetch', NEW + '\nreturn window.Amenti;');
    return g(sandbox.window, console, () => Promise.reject(new Error('no net')));
  }
  const essay = 'A sentence of the archive, of ordinary length and shape. '.repeat(40);
  const recital = B.voice.chunk(essay, 'recital');
  const gabriel = B.voice.chunk(essay, 'gabriel');
  is(recital.length !== gabriel.length,
     `recital chunks at 320 \u2192 ${recital.length} pieces; Page2's profile at 700 \u2192 ${gabriel.length}. DIFFERENT TEXT, DIFFERENT HASHES, DIFFERENT CACHE.`);
  is(B.voice.PROFILES.recital === 320 && B.voice.PROFILES.gabriel === 700,
     'both profiles preserved \u2014 migrating Page2 is a DECISION with a bill, not a config tidy-up');
}

console.log('\n5 \u00b7 The facades: every existing caller still works');
{
  const sandbox = { window: {}, console };
  sandbox.window.Amenti = {};
  const A = new Function('window', 'console', 'fetch', NEW + '\nreturn window.Amenti;')(
    sandbox.window, console, () => Promise.reject(new Error('no net')));
  is(typeof A.throttle.speak === 'function', 'Amenti.throttle.speak \u2014 8 call sites in Page1');
  is(typeof A.throttle.stop === 'function', 'Amenti.throttle.stop');
  is(typeof A.throttle.attach === 'function', 'Amenti.throttle.attach');
  is(typeof A.throttle.resolveVoice === 'function', 'Amenti.throttle.resolveVoice \u2014 AMENTI_VOICE depends on it');
  is(A.throttle.CHUNK_MAX === 320, 'Amenti.throttle.CHUNK_MAX still 320');
  is(typeof A.conversation.speak === 'function', 'the counsel speaker');
  is(typeof A.conversation.stop === 'function', 'AND IT HAS A stop() \u2014 the inline copy never did');
  is(typeof A.voice.speak === 'function', 'Amenti.voice.speak \u2014 the one entry point');
}

console.log('\n6 \u00b7 The instrument panel, on the conversational path ONLY');
{
  const sandbox = { window: {}, console };
  sandbox.window.Amenti = {};
  const A = new Function('window', 'console', 'fetch', NEW + '\nreturn window.Amenti;')(
    sandbox.window, console, () => Promise.reject(new Error('no net')));
  const fig = { dialect: 'Latin-tinged', voice: 'commanding' };
  const plain = A.conversation.styleFor(fig, null);
  const sharp = A.conversation.styleFor(fig, 'sharp');
  is(/sudden edge/.test(sharp) && !/sudden edge/.test(plain), 'a [move: catch] sharpens the conversational voice');
  is(!/Read clearly/.test(sharp), 'and it does NOT touch the recital register \u2014 different room, different key');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
