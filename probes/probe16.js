/* ============================================================================
   probe16 — HANDS-FREE

   THE CONVERSATION THIS PROJECT EXISTS TO HAVE HAS NEVER HAPPENED.

   Two things were missing, and only one of them was a flag:

     mic.auto = false          the mic never re-armed after the figure spoke
     armMic() had no autoStop  the mic never CLOSED ITSELF — silence did nothing,
                               and a TAP was the only thing that could end a turn

   Endpointing existed ONLY on the barge path. So tap-to-talk was not a choice.
   IT WAS THE ONLY THING THAT COULD WORK — and a comment in the page called it
   "push-to-talk: deliberate", describing a limitation as a design.

   This harness runs the loop with no hands in it:
     the figure speaks → the mic re-arms → the seeker speaks → THEY FALL SILENT
     → the turn closes itself → the figure answers → the mic re-arms → …

   And it attacks the loop, because a loop with no human in it is a loop that
   can run all night on your key.
   ============================================================================ */
global.window = global;
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop(){} }] }) } },
  configurable: true, writable: true
});
let processor = null, srBuilt = 0;
global.AudioContext = function () {
  this.sampleRate = 16000;
  this.createMediaStreamSource = () => ({ connect(){}, disconnect(){} });
  this.createScriptProcessor = () => (processor = { connect(){}, disconnect(){}, onaudioprocess: null });
  this.close = () => {}; this.destination = {};
};
global.SpeechRecognition = function () { srBuilt++; this.start=()=>{}; this.stop=()=>{};
  Object.defineProperty(this,'onresult',{set(){},configurable:true}); };
let TRANSCRIPT = '', listenCalls = 0;
global.fetch = () => { listenCalls++; return Promise.resolve({ ok: true, json: () => Promise.resolve({ text: TRANSCRIPT }) }); };
global.Blob = function () {};

require('./amenti-doctrine.js');
require('./amenti-listen.js');
require('./amenti-chat.js');

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);
const tick = () => new Promise(r => setImmediate(r));
const settle = async () => { for (let i=0;i<8;i++) { await tick(); await new Promise(r=>setTimeout(r,3)); } };
const frame = a => { const f=new Float32Array(4096); for(let i=0;i<4096;i++) f[i]=(i%2?a:-a); return f; };
const push  = f => processor && processor.onaudioprocess({ inputBuffer:{ getChannelData: () => f } });
const L = () => window.Amenti.listen;

let spoken=null, completions=0, notices=[];
const LINE = 'The die is cast, and I have never been certain I was right.';
window.claude = { complete: () => { completions++; return Promise.resolve('[move: reflect] ' + LINE); } };

/* EXACTLY the config Page1 now ships. */
const HANDS_FREE = { auto: true, barge: false, arrest: false, room: false };

function mk(mic) {
  spoken=null; completions=0; notices=[]; listenCalls=0; srBuilt=0;
  return window.Amenti.chat.create({
    figure: { name:'Caesar', bio:'x' },
    render: { user(){}, bot: () => ({ setText(){}, setHTML(){} }) },
    speak: (t,onDone) => { spoken=t; setTimeout(onDone, 0); },   // the figure finishes speaking
    onNotice: t => notices.push(t),
    mic: mic || HANDS_FREE
  });
}
/* the seeker speaks, then FALLS SILENT. No tap. Nothing touched. */
async function speakThenFallSilent(words) {
  TRANSCRIPT = words;
  push(frame(0.0004));
  push(frame(0.5)); push(frame(0.5));            // them, speaking
  L()._lastVoice = Date.now() - 3000;            // …and then they stop, and stay stopped
  push(frame(0.0004));                           // the silence that ends the turn
  await settle();
}

(async () => {

console.log('\n1 \u00b7 THE MIC CLOSES ITSELF \u2014 which it never did');
{
  const c = mk();
  c.armMic(); await tick();
  is(L().isRecording() === true, 'the mic is open');
  is(L()._autoStop === true, 'AND autoStop is set \u2014 armMic never passed it before, so a tap was the ONLY way to end a turn');
  L().cancel();
}

console.log('\n2 \u00b7 THE LOOP, WITH NO HANDS IN IT');
{
  const c = mk();
  await c.send('speak to me');                   // the human begins. Once.
  await settle();
  is(spoken === LINE, 'the figure speaks');
  is(L().isRecording() === true, 'and THE MIC RE-ARMS ITSELF the moment it stops. Nobody tapped.');

  const before = completions;
  await speakThenFallSilent('and what did it cost you, to cross');
  is(completions === before + 1, 'the seeker speaks, FALLS SILENT \u2014 and the turn SENDS ITSELF');
  is(L().isRecording() === true, 'and the mic is open again for the next turn');

  await speakThenFallSilent('go on');
  is(completions === before + 2, 'and again. THE CONVERSATION RUNS WITH NO HANDS.');
  L().cancel();
}

console.log('\n3 \u00b7 ONE MICROPHONE. No SpeechRecognition. No collision.');
{
  const c = mk();
  await c.send('hello'); await settle();
  is(srBuilt === 0, 'SpeechRecognition is NEVER constructed \u2014 hands-free needs only getUserMedia');
  is(L().isRecording() === true, 'one consumer, one mic, one indicator');
  L().cancel();
}

console.log('\n4 \u00b7 THE FIRST TURN IS STILL A HUMAN\u2019S');
{
  const c = mk();
  is(L().isRecording() === false, 'the mic does NOT open on page load. Ever.');
  is(c.state === 'idle', 'it waits');
  c.armMic(); await tick();
  is(L().isRecording() === true, 'a human asks \u2014 one tap, which is also the browser\u2019s permission gesture');
  L().cancel();
}

console.log('\n5 \u00b7 THE NIGHT-LONG LOOP \u2014 attacked, because a loop with no human in it can run all night');
{
  const c = mk();
  await c.send('advise me'); await settle();
  const before = completions;
  await speakThenFallSilent(LINE);              // echo cancellation fails: the mic hears the FIGURE
  is(completions === before, 'the figure hears ITSELF \u2192 NOT sent. NO completion. NO cost.');
  is(notices.some(n => /own voice/.test(n)), 'and it says so: ' + JSON.stringify(notices[notices.length-1]));
  L().cancel();
}

console.log('\n6 \u00b7 THE AUDIENCE ENDS \u2014 \u00a710, enforced against a machine talking to itself');
{
  const c = mk();
  await c.send('begin'); await settle();
  for (let i = 0; i < 14 && c._micAuto; i++) await speakThenFallSilent('a real spoken turn number ' + i);
  is(c._voiceTurns <= c.HANDS_FREE_MAX + 1, 'the hands-free loop is BOUNDED at ' + c.HANDS_FREE_MAX + ' turns');
  is(c._micAuto === false, 'and then it ENDS. The mic will not re-arm itself.');
  is(notices.some(n => /hour grows late/.test(n)), JSON.stringify(notices[notices.length-1]));
  L().cancel();
}

console.log('\n7 \u00b7 THE FORGOTTEN TAB \u2014 nobody is there');
{
  const c = mk();
  c.armMic(); await tick();
  L()._openedAt = Date.now() - 60000;            // 60s, and not a sound
  push(frame(0.0004));
  is(L().isRecording() === false, '45s of nothing \u2192 THE EAR CLOSES ITSELF');
  is(c._micAuto === false, 'and will NOT re-arm into an empty room');
}

console.log('\n8 \u00b7 THE PAUSE IS A JUDGMENT, and it lives in the doctrine');
{
  const D = window.Amenti.doctrine;
  is(D.DIALS.silenceMs === 1600,
     'silenceMs = ' + D.DIALS.silenceMs + 'ms \u2014 people PAUSE before they say the true thing. Too short and you cut them off.');
  is(D.DIALS.idleMs === 45000, 'idleMs lives there too');
  D.DIALS.silenceMs = 3000;
  const c = mk(); c.armMic(); await tick();
  push(frame(0.5)); L()._lastVoice = Date.now() - 2000;   // 2s of silence
  push(frame(0.0004));
  is(L().isRecording() === true, 'raise it to 3000ms \u2192 a 2-second pause NO LONGER ends the turn. One edit. No engine change.');
  D.DIALS.silenceMs = 1600;
  L().cancel();
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED' : '\u2713 all ' + P + ' passed \u2014 THE CONVERSATION RUNS WITH NO HANDS'));
process.exit(F ? 1 : 0);
})();
