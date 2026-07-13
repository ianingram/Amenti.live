/* D1 — barge-in. Simulate a real microphone: frames of PCM, some loud, some not. */
global.window = global;

/* --- a fake AudioContext that lets us push frames by hand --------------- */
let processor = null;
// Node 21+ ships a read-only `navigator` global that shadows a plain assignment.
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop(){} }] }) } },
  configurable: true, writable: true
});
global.AudioContext = function () {
  this.sampleRate = 16000;
  this.createMediaStreamSource = () => ({ connect(){}, disconnect(){} });
  this.createScriptProcessor = () => (processor = { connect(){}, disconnect(){}, onaudioprocess: null });
  this.close = () => {};
  this.destination = {};
};
let posted = null;
global.fetch = (url, o) => { posted = o; return Promise.resolve({ ok: true, json: () => Promise.resolve({ text: 'no, that is not it' }) }); };
global.Blob = function (parts, o) { this.parts = parts; };

require('./amenti-listen.js');
require('./amenti-chat.js');

const LOUD  = () => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?0.5:-0.5); return f; };  // rms .5
const QUIET = () => new Float32Array(4096);                                                                          // rms 0
const push = f => processor.onaudioprocess({ inputBuffer: { getChannelData: () => f } });

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);
const tick = () => new Promise(r => setImmediate(r));

let spoken=null, stopped=0, notices=[];
window.claude = { complete: () => Promise.resolve('[move: render] The counsel, at length, unhurried and heavy.') };

function mk(barge) {
  spoken=null; stopped=0; notices=[];
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText(t){}, setHTML(h){} }) },
    speak: (text, onDone, meta) => { spoken = text; /* NEVER calls onDone — the figure is mid-speech */ },
    stopSpeaking: barge ? () => { stopped++; } : undefined,
    mic: { auto: false, barge: barge },
    onNotice: t => notices.push(t)
  });
}

(async () => {

console.log('\n0 \u00b7 THE THRESHOLD GATE (new contract)');
{
  const c = mk(true);
  await c.send('hello?');
  await tick();
  is(window.Amenti.listen.isRecording() === false,
     'barge-in does NOT arm on the figure\'s FIRST sentence \u2014 "no way\u2014" must not cut it off');
  c._afterSpeech();                        // the figure finishes its first sentence
  is(c._crossed === true, 'the first exchange completes \u2192 they have crossed');
  window.Amenti.listen.cancel();
}

console.log('\n1 \u00b7 The mic now opens WHILE the figure speaks');
{
  const c = mk(true);
  c._crossed = true;                       // past the astonishment; this is conversation now
  await c.send('advise me');
  await tick();
  is(c.state === 'speaking', 'figure is speaking');
  is(window.Amenti.listen.isMonitoring() === true, 'the mic is MONITORING mid-speech (the old code forbade this)');
  is(spoken !== null, 'and the figure is actually saying something');
}

console.log('\n2 \u00b7 The seeker speaks \u2014 the mouth is CUT, mid-sentence');
{
  push(QUIET()); push(QUIET());
  is(stopped === 0 && window.Amenti.listen.isMonitoring(), 'silence alone does not trigger \u2014 no false barge');
  push(LOUD());
  is(stopped === 0, 'one loud frame is not enough (a cough, a door)');
  push(LOUD()); push(LOUD());                       // 3 consecutive → onset
  is(stopped === 1, 'sustained voice \u2192 stopSpeaking() FIRED. The figure is cut off.');
  const chat = window.__c;
  is(window.Amenti.listen.isMonitoring() === false, 'monitor ends \u2014 we are now RECORDING them');
}

console.log('\n3 \u00b7 The pre-roll survives \u2014 their first syllable is not eaten');
{
  const L = window.Amenti.listen;
  is(L._chunks.length >= 3, 'captured ' + L._chunks.length + ' frames, including pre-onset ring (first word kept)');
}

console.log('\n4 \u00b7 Endpointing \u2014 they stop, the turn closes itself');
{
  const L = window.Amenti.listen;
  L._lastVoice = Date.now() - 2000;                 // pretend 2s of quiet has passed
  push(QUIET());
  is(L.recording === false, 'silence \u2192 stop() fired. No button. Hands-free.');
  await tick(); await tick(); await tick();
  is(posted && posted.method === 'POST', 'the audio went to /listen for transcription');
}

console.log('\n5 \u00b7 Echo guard \u2014 the figure must not interrupt ITSELF');
{
  const L = window.Amenti.listen;
  L._echoy = true;  L._loud = 0;  L._monitor = true;  L._ring = [];
  const MID = () => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?0.03:-0.03); return f; }; // rms .03
  push(MID()); push(MID()); push(MID()); push(MID());
  is(L._monitor === true, 'bleed-through at .03 rms does NOT trigger while the figure is audible (bar is .045)');
  L.setEchoRisk(false);
  push(MID()); push(MID()); push(MID());
  is(L._monitor === false, '\u2026but the same voice DOES trigger once the figure is silent (bar drops to .020)');
}

console.log('\n6 \u00b7 Barge-in stays OFF when the host cannot cut the mouth');
{
  window.Amenti.listen.cancel();
  const c = mk(false);                               // no stopSpeaking supplied
  c._crossed = true;
  await c.send('advise me');
  await tick();
  is(window.Amenti.listen.isRecording() === false, 'no stopSpeaking \u2192 no monitor. Inert, not half-working.');
  is(c.state === 'speaking', 'and the old turn-taking behaviour is untouched');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
})();
