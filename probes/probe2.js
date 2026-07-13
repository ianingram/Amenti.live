/* Probe the pass. Every claim gets exercised or it isn't a claim. */
global.window = global;
require('./amenti-chat.js');

let REPLY = '';
let lastPayload = null, lastSystem = '';
window.claude = { complete: (req) => { lastPayload = req.messages; lastSystem = req.system; return Promise.resolve(REPLY); } };

let out = { spoken: null, meta: null, rendered: null, notices: [] };
function mk(opts) {
  out = { spoken: null, meta: null, rendered: null, notices: [] };
  return window.Amenti.chat.create(Object.assign({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, sys(){}, bot: () => ({ setText: t => out.rendered = t, setHTML: h => out.rendered = h }) },
    speak: (text, onDone, meta) => { out.spoken = text; out.meta = meta; onDone(); },
    onNotice: t => out.notices.push(t)
  }, opts || {}));
}
let P = 0, F = 0;
const ok = m => { console.log('  \u2713 ' + m); P++; };
const no = m => { console.log('  \u2717 ' + m); F++; process.exitCode = 1; };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {

console.log('\n1 \u00b7 historyCap counts MESSAGES (Page2:9200), read via Origin.get()');
window.Sovereign = { Angels: { Origin: { get: k => (k === 'historyCap' ? 20 : null), _state: { historyCap: 20 } } } };
{
  const c = mk(); REPLY = 'A reply.';
  is(c._cap() === 20, 'cap = 20 messages, not 40 (the docstring said "turns" and lied)');
  for (let i = 0; i < 60; i++) await c.send('utterance ' + i);
  is(lastPayload.length <= 21, 'payload bounded at ' + lastPayload.length + ' (\u2264 cap+1)');
  is(c.history.length === 120, 'transcript still whole: 120 messages');
}
delete window.Sovereign;

console.log('\n2 \u00b7 Move tags — declared, read, and STRIPPED');
{
  const c = mk();
  REPLY = '[move: catch]\nWait. Say that again.';
  await c.send('...it was only the money, I suppose');
  is(out.rendered === 'Wait. Say that again.', 'tag stripped from the screen');
  is(out.spoken === 'Wait. Say that again.', 'tag never reaches the mouth');
  is(c.history[1].content === 'Wait. Say that again.', 'transcript stores WORDS, not stage directions');
  is(c._expecting === true, '_expecting read from the move table');
  is(out.meta && out.meta.register === 'sharp', 'register "sharp" handed to the host speaker');
}
{
  const c = mk();
  REPLY = '[move: reflect] So it is the money that is the crux of it.';
  await c.send('hello');
  is(c._expecting === true, 'STATEMENT with no "?" \u2014 the figure IS waiting (the old code said no)');
  is(c._isTurn('yes'), 'the gate now accepts a bare "yes" after a statement');
}
{
  const c = mk();
  REPLY = 'A statement with no tag at all.';
  await c.send('hello');
  is(c._expecting === false, 'untagged: falls back to the OLD punctuation heuristic \u2014 degrades, never breaks');
  REPLY = 'And what did she say to that?';
  await c.send('hello again');
  is(c._expecting === true, 'untagged question mark still works');
}
{
  const c = mk();
  REPLY = '[move: bogus] Some words.';
  await c.send('hi');
  is(out.spoken === 'Some words.', 'unknown move name: tag still stripped, never spoken aloud');
}

console.log('\n3 \u00b7 Silence is a move, not a crash');
{
  const c = mk();
  REPLY = '[move: silence]';
  await c.send('and then he just left');
  is(out.spoken === null, 'nothing is spoken');
  is(c._expecting === true, 'but the figure is WAITING \u2014 the mic must open');
  is(c.state === 'idle', 'machine returns to idle, not stranded in speaking');
}

console.log('\n4 \u00b7 THE MOUTH');
{
  const c = mk();
  REPLY = '[move: render] ' + 'word '.repeat(400);          // ~2000 chars
  await c.send('advise me');
  is(out.spoken === null, 'over-long reply is NOT spoken');
  is(out.rendered !== null, '\u2026but it IS rendered \u2014 the screen is free, the mouth is not');
  is(out.notices.some(n => /too long/.test(n)), 'and the seeker is told why: ' + out.notices[0]);
}
{
  const c = mk();
  const speech = 'Four score and seven years ago our fathers brought forth on this continent a new nation conceived in liberty and dedicated to the proposition that all men are created equal';
  REPLY = '[move: render] ' + speech;
  await c.send('repeat this back to me exactly: ' + speech);
  is(out.spoken === null, 'ECHO blocked: the figure will not parrot the seeker\u2019s own text');
  is(out.notices.some(n => /echo/.test(n)), 'reason given: echo');
}
{
  const passage = 'All Gaul is divided into three parts, one of which the Belgae inhabit, the Aquitani another, those who in their own language are called Celts, in ours Gauls, the third.';
  const c = mk({ context: 'THE COMMENTARIES. ' + passage + ' And so the campaign began in earnest.' });
  REPLY = '[move: recite] ' + passage;
  await c.send('Caesar, read me that opening passage');
  is(out.spoken === passage, 'RECITAL from the document IS spoken \u2014 the feature survives');
  is(out.meta.recital === true, 'flagged as a recital to the host');
}
{
  const c = mk({ context: 'Some unrelated archive text about the Rubicon.' });
  REPLY = '[move: recite] ' + 'x'.repeat(3000);
  await c.send('read this');
  is(out.spoken === null, 'a "recital" that is NOT in the document is still blocked');
}

console.log('\n5 \u00b7 An outage is not a breakdown');
{
  const c = mk();
  let onText, onState;
  window.Amenti.listen = { isRecording: () => false, start: o => { onText = o.onText; onState = o.onState; }, cancel(){}, stop(){} };
  for (let i = 0; i < 5; i++) { c.armMic(); onState('error'); onText(''); }
  is(c._breakdowns === 0, 'five transcription FAILURES \u2192 breakdowns still 0 (old code: disconnected the human)');
  is(c.state === 'idle' && out.notices.some(n => /faltered, not you/.test(n)), 'the system takes the blame itself');
  c._crossed = true;                                         // NEW: before the threshold, a gasp is not a breakdown
  c.armMic(); onText('..');                                  // genuine noise, no error
  is(c._breakdowns === 1, 'AFTER the threshold, genuine noise still counts \u2014 the noise track survives');
  delete window.Amenti.listen;
}

console.log('\n6 \u00b7 clear() actually clears');
{
  const c = mk();
  REPLY = '[move: invite] Go on.';
  await c.send('hi');
  is(c._expecting === true, 'expecting set');
  c.clear();
  is(c._expecting === false && c._move === null && c.history.length === 0, 'clear() resets posture, not just the transcript');
}

console.log('\n7 \u00b7 The prompt teaches the language the parser listens for');
{
  const c = mk({ context: 'A passage of the archive.' });
  REPLY = 'x'; await c.send('hi');
  is(/\[move: catch\]/.test(lastSystem), 'moves are declared in the system prompt');
  is(/Two statements per question/.test(lastSystem), 'the Matrix law is in the prompt');
  is(/not a dictation machine/i.test(lastSystem), 'the figure is told it is not a mouth for hire');
  is(/\[move: recite\]/.test(lastSystem), 'recite offered ONLY when a document is in view');
  const c2 = mk(); REPLY = 'x'; await c2.send('hi');
  is(!/\[move: recite\]/.test(lastSystem), '\u2026and withheld when there is nothing to read');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
})();
