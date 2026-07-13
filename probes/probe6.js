/* D2 — the Arrest. Tested for RESTRAINT at least as hard as for the catch. */
global.window = global;
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop(){} }] }) } },
  configurable: true, writable: true
});
let processor = null, partialCb = null;
global.AudioContext = function () {
  this.sampleRate = 16000;
  this.createMediaStreamSource = () => ({ connect(){}, disconnect(){} });
  this.createScriptProcessor = () => (processor = { connect(){}, disconnect(){}, onaudioprocess: null });
  this.close = () => {}; this.destination = {};
};
/* a fake browser recogniser that streams interim results */
global.SpeechRecognition = function () {
  this.start = () => {}; this.stop = () => {};
  Object.defineProperty(this, 'onresult', { set(fn) { partialCb = fn; }, configurable: true });
};
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ text: '' }) });
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);
const tick = () => new Promise(r => setImmediate(r));

let spoken = null, spokenMeta = null, REPLY = '[move: reflect] I hear you.';
window.claude = { complete: () => Promise.resolve(REPLY) };

function mk() {
  spoken = null; spokenMeta = null;
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText(t){}, setHTML(h){} }) },
    // The real speaker calls onDone at the speech's natural end. The old harness
    // never did — so the machine stuck in 'speaking', send() short-circuited on
    // its own guard, and warm() advanced zero turns. Deferred, so the state is
    // still 'speaking' for the assertion immediately after an arrest fires.
    speak: (t, onDone, meta) => { spoken = t; spokenMeta = meta; setTimeout(onDone, 0); },
    stopSpeaking: () => {},
    mic: { auto: false, barge: true, arrest: true }
  });
}
// fast-forward past the rapport floor + cooldown
async function warm(c, n = 8) {
  for (let i = 0; i < n; i++) {
    await c.send('turn ' + i);
    await tick(); await tick();
    await new Promise(r => setTimeout(r, 0));   // let the speech 'end'
  }
  spoken = null; spokenMeta = null;             // clear the warm-up chatter
}

(async () => {

console.log('\n1 \u00b7 THE DETECTOR \u2014 what it catches');
{
  const c = mk();
  const hit = s => !!c._arrestable(s);
  is(hit("anyway it doesn't matter that my brother won't speak to me but the money is really the thing"),
     'the load-bearing thing, thrown away mid-sentence \u2192 CAUGHT');
  is(hit("I mean I failed but whatever, that's not the point, the point is the timeline"),
     '"I failed \u2026 but whatever" \u2192 CAUGHT');
  is(hit("she left me last spring, anyway what I actually wanted to ask you about was the job"),
     '"she left me \u2026 anyway" \u2192 CAUGHT \u2014 the classic subordinate-clause abandonment');
}

console.log('\n2 \u00b7 THE DETECTOR \u2014 what it must NOT catch (restraint is the feature)');
{
  const c = mk();
  const hit = s => !!c._arrestable(s);
  is(!hit('my father died in 2019 and I have thought about it every day since then'),
     'a heavy thing said DELIBERATELY and dwelt on \u2192 NOT arrested. They are not throwing it away.');
  is(!hit("anyway I don't much mind either way, whatever you think is best for the project"),
     'a shrug with nothing heavy under it \u2192 NOT arrested');
  is(!hit('I am afraid'),
     'too short to know anything \u2192 NOT arrested');
  is(!hit("the quarterly numbers don't matter as much as the hiring plan does, honestly"),
     'business dismissal, no wound \u2192 NOT arrested');
  is(!hit('I failed the exam in June. Then in September I sat it again and I passed it, at last.'),
     'a heavy thing far from any shrug \u2192 NOT arrested (the gap window holds)');
}

console.log('\n3 \u00b7 IT FIRES \u2014 and it fires FAST (no model, no network)');
{
  const c = mk();
  await warm(c);
  c.armMic();
  await tick();
  const t0 = process.hrtime.bigint();
  partialCb({ results: [[{ transcript: "anyway it doesn't matter that my brother won't speak to me but the money" }]] });
  const us = Number(process.hrtime.bigint() - t0) / 1000;
  is(spoken !== null, 'the figure CUT IN while the seeker was still talking');
  is(/^Wait\./.test(spoken), 'and it opened with the arrest: ' + JSON.stringify(spoken));
  is(/brother/.test(spoken), 'it quotes back the CLAUSE THEY WALKED PAST, not the shrug');
  is(us < 5000, 'detected + spoken in ' + us.toFixed(0) + '\u00b5s \u2014 local. No round trip. THIS IS THE WHOLE POINT.');
  is(spokenMeta.register === 'sharp' && spokenMeta.move === 'catch', 'delivered SHARP \u2014 and flagged as an arrest, not a gotcha');
  is(c._expecting === true, 'the figure is now absolutely waiting');
  is(c.state === 'speaking', 'and it holds the floor to say it');
}

console.log('\n4 \u00b7 RARITY \u2014 "Must be rare." §7');
{
  const c = mk();
  const arrestable = "anyway it doesn't matter that my brother won't speak to me but the money";

  c.armMic(); await tick();
  partialCb({ results: [[{ transcript: arrestable }]] });
  is(spoken === null, 'turn 1: NO arrest. Rapport has not been earned \u2014 it would be a gotcha.');

  await warm(c);
  c.armMic(); await tick();
  partialCb({ results: [[{ transcript: arrestable }]] });
  is(spoken !== null && c._arrests === 1, 'once warmed: the first arrest lands');

  spoken = null;
  await new Promise(r => setTimeout(r, 0));
  c.armMic(); await tick();
  partialCb({ results: [[{ transcript: arrestable }]] });
  is(spoken === null, 'immediately again \u2192 REFUSED. The cooldown holds; twitchy is not attentive.');

  // NEW CONTRACT. The old ceiling was ARREST_MAX: 2, applied blindly. That was
  // never a design principle — it was a limit on MY word list's error rate,
  // wearing the costume of restraint. The ceiling now tracks WHO PULLED THE
  // TRIGGER: the crude list gets ONE strike, ever. The model-armed watchlist,
  // which named THIS seeker's own buried thing, is trusted further.
  spoken = null;
  await warm(c, 7);
  c.armMic(); await tick();
  partialCb({ results: [[{ transcript: arrestable }]] });
  is(spoken === null && c._listArrests === 1,
     'the CRUDE LIST never fires twice. One strike. The code now says out loud that I do not trust it.');

  c._watchlist = ['brother would never forgive'];
  c._catchLine = 'Wait. Your brother would never forgive you. You have walked past that twice.';
  partialCb({ results: [[{ transcript: 'anyway my brother would never forgive me but whatever, it does not matter' }]] });
  is(/walked past that twice/.test(spoken || ''),
     'but the WATCHLIST still fires \u2014 because it is a better trigger, not because we became braver');
  is(c._arrests === 2 && c._listArrests === 1, 'two arrests: one crude, one armed');
}

console.log('\n5 \u00b7 It costs nothing, and the transcript stays honest');
{
  const c = mk();
  await warm(c);
  const before = c.history.length;
  c.armMic(); await tick();
  partialCb({ results: [[{ transcript: "I mean I failed but whatever, that's not the point at all" }]] });
  is(window.Amenti.listen.isRecording() === false, 'the /listen call is CANCELLED \u2014 an arrest costs zero STT');
  is(c.history.length === before + 2, 'both halves recorded: what they got out, and the interruption');
  is(/\u2014$/.test(c.history[before].content), 'their turn is marked as CUT OFF (trailing em-dash), not as a finished thought');
  is(/^Wait\./.test(c.history[before + 1].content), 'and the figure\u2019s arrest sits under it');
}

console.log('\n6 \u00b7 No recogniser \u2192 no Arrest, and nothing breaks');
{
  delete global.SpeechRecognition;
  is(window.Amenti.listen.hasPartials() === false, 'Safari/Firefox: no partial stream');
  const c = mk();
  await warm(c);
  c.armMic(); await tick();
  is(c.state === 'listening', 'the mic still works \u2014 the batch path is untouched');
  is(spoken === null, 'the Arrest is simply ABSENT. Degraded, not broken.');
  global.SpeechRecognition = function () { this.start=()=>{}; this.stop=()=>{};
    Object.defineProperty(this,'onresult',{set(fn){partialCb=fn;},configurable:true}); };
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
})();
