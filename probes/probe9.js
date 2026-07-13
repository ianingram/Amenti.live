/* THE THRESHOLD · THE EAR · THE BRIDGE
   The first two minutes belong to an audience, not a seeker. */
global.window = global;
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop(){} }] }) } },
  configurable: true, writable: true
});
let processor = null;
global.AudioContext = function () {
  this.sampleRate = 16000;
  this.createMediaStreamSource = () => ({ connect(){}, disconnect(){} });
  this.createScriptProcessor = () => (processor = { connect(){}, disconnect(){}, onaudioprocess: null });
  this.close = () => {}; this.destination = {};
};
global.SpeechRecognition = function () { this.start=()=>{}; this.stop=()=>{};
  Object.defineProperty(this,'onresult',{set(fn){ global.partialCb = fn; },configurable:true}); };
let TRANSCRIPT = '';
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ text: TRANSCRIPT }) });
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

const frame = amp => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?amp:-amp); return f; };
const push  = f => processor.onaudioprocess({ inputBuffer: { getChannelData: () => f } });
const tick  = () => new Promise(r => setImmediate(r));
/* The speaker's onDone is a real setTimeout. Under CPU contention (several
   harnesses back to back) a 1ms window can be missed, and the machine is still
   'speaking' when the next assertion runs — an intermittent failure, which is
   worse than a consistent one. Give the timers room. */
const settle = async () => { for (let i=0;i<8;i++) { await tick(); await new Promise(r=>setTimeout(r,3)); } };

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);

let spoken=null, cut=0, notices=[], REPLY='[move: reflect] Speak on.';
/* setTimeout(0) vs setImmediate ordering is NONDETERMINISTIC in Node. With the
   speaker auto-ending on a timer, the speech sometimes FINISHED before the test
   could assert it had STARTED — a 1-in-10 flake, which is worse than a failure
   because it teaches you to ignore red. The speech now ends when the test says
   so, not when the event loop feels like it. */
let autoEnd = true, endSpeech = () => {};
window.claude = { complete: () => Promise.resolve(REPLY) };
function mk() {
  spoken=null; cut=0; notices=[];
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText(t){}, setHTML(h){} }) },
    speak: (t,onDone,m) => { spoken=t; endSpeech = onDone; if (autoEnd) setTimeout(onDone,0); },
    stopSpeaking: () => { cut++; },
    onNotice: t => notices.push(t),
    onDisconnect: () => { notices.push('DISCONNECTED'); },
    mic: { auto:false, barge:true, arrest:true, room:true }
  });
}
async function turn(c, words) { REPLY='[move: reflect] Speak on.'; await c.send(words); await settle(); }
/* a noisy room: quiet frames are LOUD (the TV), speech barely rises above it */
async function heard(c, words, { noise = 0.0005, speech = 0.5 } = {}) {
  TRANSCRIPT = words;
  c.armMic(); await tick();
  for (let i=0;i<6;i++) push(frame(noise));          // the room, between words
  push(frame(speech)); push(frame(speech));          // them, speaking
  window.Amenti.listen.stop();
  await settle();
}

(async () => {

console.log('\n1 \u00b7 THE FIRST SENTENCE SURVIVES');
{
  autoEnd = false;                       // hold the figure mid-sentence, deterministically
  const c = mk();
  await c.send('hello?');
  await tick();
  is(c.state === 'speaking', 'the figure begins to speak');
  is(window.Amenti.listen.isRecording() === false,
     'barge-in is NOT armed \u2014 "no way\u2014" cannot cut the figure off mid-word on its FIRST LINE');
  endSpeech();                           // …and now it finishes
  autoEnd = true;
  await settle();
  is(c._crossed === true, 'one exchange \u2192 they have crossed. The sharp instruments wake up now.');
  await c.send('and again');
  await tick();
  is(window.Amenti.listen.isMonitoring() === true, 'and NOW barge-in arms. Conversation, not spectacle.');
  window.Amenti.listen.cancel();
}

console.log('\n2 \u00b7 The delighted user is NOT thrown out of the hall');
{
  const c = mk();
  TRANSCRIPT = '';
  for (let i = 0; i < 5; i++) {                        // five gasps, laughs, wordless whoops
    c.armMic(); await tick();
    push(frame(0.0004)); push(frame(0.5)); push(frame(0.5)); push(frame(0.0004));   // a gasp in a quiet room
    window.Amenti.listen.stop(); await settle();
    c._setState('idle');
  }
  is(!notices.includes('DISCONNECTED'), 'five wordless exclamations \u2192 NOT disconnected');
  is(c._breakdowns === 0, 'and not one breakdown counted against them');
  is(spoken === null, 'and the figure did NOT ask if their gasp was a dog');
}

console.log('\n3 \u00b7 THE EAR \u2014 a loud room is OUR failure, not theirs');
{
  const c = mk();
  await turn(c, 'tell me of the Rubicon');            // cross the threshold
  spoken = null;
  await heard(c, '', { noise: 0.05, speech: 0.09 });  // TV blaring; speech barely above it
  const ch = c._lastChannel || { clean: true, snr: 0, noise: 0 };
  is(ch.clean === false, `the channel is dirty (snr ${ch.snr.toFixed(1)}, floor ${ch.noise.toFixed(3)})`);
  is(/cannot hear you|faint against the room/.test(spoken || ''),
     'the figure says the EAR failed: ' + JSON.stringify(spoken));
  is(!/what is that|who is|what\u2019s that/i.test(spoken || ''),
     'and it does NOT ask what the noise is. It reports ITS difficulty; it does not investigate THEIRS.');
  is(c._breakdowns === 0, 'and it is NOT counted against them as incoherence');
}

console.log('\n4 \u00b7 THE BRIDGE \u2014 one request, then move house');
{
  const c = mk();
  await turn(c, 'speak to me');
  await heard(c, '', { noise: 0.05, speech: 0.09 });   // repair 1: "quiet it"
  spoken = null;
  await heard(c, '', { noise: 0.05, speech: 0.09 });   // still bad
  is(/Write to me/.test(spoken || ''), 'second failure \u2192 the keyboard is offered: ' + JSON.stringify(spoken));
  is(c.modality === 'text', 'and the modality actually switches');
  is(c._textInvited === true, 'once. It will never ask again.');

  spoken = null;
  await heard(c, '', { noise: 0.05, speech: 0.09 });   // they keep speaking anyway
  is(!/Write to me/.test(spoken || ''), 'they keep speaking \u2192 the figure does NOT nag. No second offer, ever.');
  is(notices.some(n => /straining to hear/.test(n)), 'it struggles on, gracefully');
  is(!notices.includes('DISCONNECTED'), 'and it NEVER throws out a person who lives in a noisy world');
}

console.log('\n5 \u00b7 The keyboard is not a lesser mode \u2014 it is the SAME engine');
{
  const c = mk();
  c.setModality('text');
  REPLY = '[move: nearmiss] So it is the money that is the crux of it.';
  await c.send('I typed this');
  await settle();
  is(c.history.length === 2, 'a typed turn is a turn: recorded');
  is(c._expecting === true, 'move tags work');
  is(c._move === 'nearmiss', 'the Matrix runs unchanged');
  is(spoken !== null, 'and the figure still SPEAKS the reply \u2014 they can hear us; we could not hear them');
}

console.log('\n6 \u00b7 The bridge runs BOTH ways \u2014 and the answer is a probe');
{
  const c = mk();
  c.setModality('text');
  for (let i = 0; i < 7; i++) await turn(c, 'a typed turn ' + i);
  spoken = null;
  const invited = c._maybeInviteVoice();
  is(invited === true, 'after warmth, the figure asks for their actual voice: ' + JSON.stringify(spoken));
  is(c._maybeInviteVoice() === false, 'once. Never twice.');

  const d = mk();
  d.setModality('text');
  d._textInvited = true;                                // they came here because their ear failed
  for (let i = 0; i < 7; i++) await turn(d, 'typed ' + i);
  is(d._maybeInviteVoice() === false,
     'and it NEVER asks someone to speak whose room we already failed to hear. That would be cruelty.');
}

console.log('\n7 \u00b7 The Arrest will not fire on a hallucination');
{
  const c = mk();
  await turn(c, 'one'); await turn(c, 'two'); await turn(c, 'three'); await turn(c, 'four');
  c.armMic(); await tick();
  for (let i=0;i<6;i++) push(frame(0.05));            // a filthy channel
  push(frame(0.09));
  spoken = null;
  global.partialCb({ results: [[{ transcript: "anyway it doesn't matter that my brother won't speak to me but the money" }]] });
  is(spoken === null,
     'a garbled partial that LOOKS arrestable \u2192 NO arrest. The sharpest move must never fire on noise.');
  window.Amenti.listen.cancel();
}

console.log('\n8 \u00b7 The prompt knows what a threshold is');
{
  const c = mk();
  let sys = '';
  window.claude = { complete: r => { sys = r.system; return Promise.resolve('[move: reflect] ok'); } };
  await turn(c, 'hi');
  is(/THE THRESHOLD/.test(sys), 'the figure is told about the astonishment phase');
  is(/no way|marvelling|MARVELLING/i.test(sys), 'and that an exclamation is not a question');
  is(/come see|MA! come here/i.test(sys), 'and that someone may be CALLED INTO the room');
  is(/ANSWER HONESTLY AND AT ONCE/.test(sys),
     '\u2026and that "is this real?" gets a straight answer. \u00a76B \u2014 they must never be confused about what they are talking to.');
  window.claude = { complete: () => Promise.resolve(REPLY) };
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
process.exit(F ? 1 : 0);      // _say() leaves a 30s safety timer pending
})();
