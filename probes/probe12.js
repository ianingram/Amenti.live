/* DEPLOY A — the claim is: "the microphone behaves EXACTLY as it does today."
   That claim is worth nothing unless it is tested. */
global.window = global;
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop(){} }] }) } },
  configurable: true, writable: true
});
let processor = null, srStarted = 0;
global.AudioContext = function () {
  this.sampleRate = 16000;
  this.createMediaStreamSource = () => ({ connect(){}, disconnect(){} });
  this.createScriptProcessor = () => (processor = { connect(){}, disconnect(){}, onaudioprocess: null });
  this.close = () => {}; this.destination = {};
};
/* THE SECOND CONSUMER. Count every time it is constructed. */
global.SpeechRecognition = function () {
  srStarted++;
  this.start = () => {}; this.stop = () => {};
  Object.defineProperty(this, 'onresult', { set(fn) { global.partialCb = fn; }, configurable: true });
};
let TRANSCRIPT = '';
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ text: TRANSCRIPT }) });
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);
const tick = () => new Promise(r => setImmediate(r));
const settle = async () => { for (let i=0;i<6;i++) { await tick(); await new Promise(r=>setTimeout(r,2)); } };
const frame = a => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?a:-a); return f; };
const push = f => processor.onaudioprocess({ inputBuffer: { getChannelData: () => f } });

let spoken = null, stopped = 0;
window.claude = { complete: () => Promise.resolve('[move: reflect] I hear you.') };

/* EXACTLY the config Page1 now ships. */
const DEPLOY_A = { auto: false, barge: false, arrest: false, room: false };

function mk(mic) {
  spoken = null; stopped = 0; srStarted = 0;
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText(){}, setHTML(){} }) },
    speak: (t, onDone) => { spoken = t; setTimeout(onDone, 0); },
    stopSpeaking: () => { stopped++; },
    mic: mic
  });
}

(async () => {

console.log('\nDEPLOY A \u00b7 THE MICROPHONE MUST BE UNCHANGED');

console.log('\n1 \u00b7 SpeechRecognition is NEVER constructed');
{
  const c = mk(DEPLOY_A);
  c.armMic(); await tick();
  is(srStarted === 0, 'push-to-talk opens the mic and does NOT start the browser recogniser');
  is(c.state === 'listening', 'and push-to-talk still works, exactly as today');
  window.Amenti.listen.cancel();

  // and it must stay off while the figure speaks, too
  await c.send('hello'); await tick();
  is(srStarted === 0, 'the figure speaks \u2192 STILL no recogniser. No second consumer on the mic. Ever.');
  await settle();
}

console.log('\n2 \u00b7 The mic does NOT open while the figure is speaking');
{
  const c = mk(DEPLOY_A);
  await c.send('advise me'); await tick();
  is(c.state === 'speaking', 'the figure is speaking');
  is(window.Amenti.listen.isRecording() === false,
     'the mic is SHUT \u2014 no barge monitor. One party holds the floor, exactly as the live site does today.');
  is(stopped === 0, 'and nothing can cut the figure off');
  await settle();
}

console.log('\n3 \u00b7 With the flags ON, all of it wakes up (the code is not deleted \u2014 it is DARK)');
{
  const c = mk({ auto: false, barge: true, arrest: true, room: true });
  c._crossed = true;
  await c.send('advise me'); await tick();
  is(srStarted === 1, 'arrest:true \u2192 the recogniser starts');
  is(window.Amenti.listen.isMonitoring() === true, 'barge:true \u2192 the mic monitors while the figure speaks');
  push(frame(0.5)); push(frame(0.5)); push(frame(0.5));
  is(stopped === 1, 'and the seeker can cut the figure off. DEPLOY B works \u2014 it is just switched off.');
  window.Amenti.listen.cancel();
  await settle();
}

console.log('\n4 \u00b7 What DEPLOY A actually ships (all of this is payload, not microphone)');
{
  const c = mk(DEPLOY_A);
  is(typeof c._payload === 'function', 'THE ANCHORED WINDOW \u2014 the 30-exchange break is gone, cost goes flat');
  for (let i = 0; i < 60; i++) { await c.send('turn ' + i); await settle(); }
  is(c.history.length === 120, 'transcript whole: 120 messages');

  let sent = 0;
  window.claude = { complete: r => { sent = r.messages.length; return Promise.resolve('[move: reflect] ok'); } };
  await c.send('one more'); await settle();
  is(sent <= 15, 'and the payload sent to the model is ' + sent + ' messages \u2014 the Worker cap (60) is now UNREACHABLE');

  const c2 = mk(DEPLOY_A);
  window.claude = { complete: () => Promise.resolve('[move: catch] Wait. Say that again.') };
  await c2.send('hello'); await settle();
  is(c2._move === 'catch', 'MOVE TAGS \u2014 the figure declares its move');
  is(spoken === 'Wait. Say that again.', 'and the tag never reaches the mouth');

  const c3 = mk(DEPLOY_A);
  window.claude = { complete: () => Promise.resolve('[move: render] ' + 'word '.repeat(400)) };
  spoken = null;
  await c3.send('read me this'); await settle();
  is(spoken === null, 'THE MOUTH GUARD \u2014 an over-long reply renders but is NOT spoken');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED \u2014 DO NOT SHIP' : '\u2713 all ' + P + ' passed \u2014 the microphone is untouched'));
process.exit(F ? 1 : 0);
})();
