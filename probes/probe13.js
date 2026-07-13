/* THE MICROPHONE IS NOT A KEYBOARD.
   Attack it as the loop, the television, and the forgotten tab. */
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
let TRANSCRIPT = '', listenCalls = 0;
global.fetch = () => { listenCalls++; return Promise.resolve({ ok: true, json: () => Promise.resolve({ text: TRANSCRIPT }) }); };
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);
const tick = () => new Promise(r => setImmediate(r));
const settle = async () => { for (let i=0;i<6;i++) { await tick(); await new Promise(r=>setTimeout(r,2)); } };
const frame = a => { const f=new Float32Array(4096); for(let i=0;i<4096;i++) f[i]=(i%2?a:-a); return f; };
const push = f => processor.onaudioprocess({ inputBuffer:{ getChannelData: () => f } });

let spoken=null, completions=0, notices=[];
const FIGURE_LINE = 'The die is cast, and I will not pretend the crossing was easy for me.';
window.claude = { complete: () => { completions++; return Promise.resolve('[move: reflect] ' + FIGURE_LINE); } };

function mk() {
  spoken=null; completions=0; notices=[]; listenCalls=0;
  return window.Amenti.chat.create({
    figure: { name:'Caesar', bio:'x' },
    render: { user(){}, bot: () => ({ setText(){}, setHTML(){} }) },
    speak: (t,onDone) => { spoken=t; setTimeout(onDone,0); },
    stopSpeaking: () => {},
    onNotice: t => notices.push(t),
    mic: { auto:true, barge:true, arrest:false, room:false }   // HANDS-FREE. The dangerous config.
  });
}
/* the room speaks (or the figure's own voice comes back through the speakers) */
async function heard(c, words) {
  TRANSCRIPT = words;
  if (c.state !== 'listening') { c._setState('idle'); c.armMic(); }
  await tick();
  push(frame(0.0004)); push(frame(0.5)); push(frame(0.5)); push(frame(0.0004));
  window.Amenti.listen.stop();
  await settle();
}

(async () => {

console.log('\n1 \u00b7 THE NIGHT-LONG LOOP \u2014 the figure hears ITSELF and replies to it');
{
  const c = mk();
  await c.send('speak to me'); await settle();       // the figure speaks FIGURE_LINE
  is(c._lastSpoken === FIGURE_LINE, 'the figure remembers what it said aloud');

  const before = completions;
  // echo cancellation fails; the mic hears the figure's own sentence
  await heard(c, FIGURE_LINE);
  is(completions === before, 'THE LOOP IS BROKEN \u2014 the figure does NOT reply to its own voice. No completion. No cost.');
  is(notices.some(n => /own voice/.test(n)), 'and it says so: ' + JSON.stringify(notices[notices.length-1]));

  // it happens again — now the ear closes for good
  await heard(c, FIGURE_LINE + ' and more of it besides');
  is(c._barge === false && c._micAuto === false,
     'twice \u2192 THE EAR IS CLOSED FOR THE SESSION. It cannot loop all night on your key.');
  is(completions === before, 'still zero completions bought by the echo');
  window.Amenti.listen.cancel();
}

console.log('\n2 \u00b7 A PARTIAL echo still breaks the loop (echo cancellation is never total)');
{
  const c = mk();
  await c.send('advise me'); await settle();
  const before = completions;
  await heard(c, 'the die is cast and I will not pretend the crossing was');   // clipped bleed-through
  is(completions === before, 'a HALF-heard echo is still an echo. Not sent. Not paid for.');
  window.Amenti.listen.cancel();
}

console.log('\n3 \u00b7 A REAL seeker is not mistaken for an echo');
{
  const c = mk();
  await c.send('advise me'); await settle();
  const before = completions;
  await heard(c, 'but the crossing was not easy for me either, and I want to tell you why');
  is(completions === before + 1, 'they used some of the figure\u2019s words \u2014 and they STILL get a reply. Not a false positive.');
  is(c._selfEchoes === 0, 'and no echo is counted against them');
  window.Amenti.listen.cancel();
}

console.log('\n4 \u00b7 THE FORGOTTEN TAB \u2014 hands-free has no natural end. Give it one.');
{
  const c = mk();
  for (let i = 0; i < 14; i++) {
    await heard(c, 'a genuine spoken turn number ' + i + ' from a real person');
    if (c._micAuto === false) break;
  }
  is(c._voiceTurns <= c.HANDS_FREE_MAX + 1, 'the voice loop is BOUNDED at ' + c.HANDS_FREE_MAX + ' turns');
  is(c._micAuto === false, 'and then the audience ENDS \u2014 the mic will not re-arm itself');
  is(notices.some(n => /hour grows late/.test(n)),
     '\u00a710, enforced against a machine talking to itself: ' + JSON.stringify(notices[notices.length-1]));
  window.Amenti.listen.cancel();
}

console.log('\n5 \u00b7 A HUMAN AT THE KEYS RESETS THE CLOCK');
{
  const c = mk();
  for (let i = 0; i < 8; i++) await heard(c, 'spoken turn ' + i + ' from a person in the room');
  is(c._voiceTurns === 8, '8 voice turns counted');
  await c.send('and now I type'); await settle();       // default source is 'text'
  is(c._voiceTurns === 0, 'a TYPED turn resets it to zero \u2014 a human touched the machine');
  window.Amenti.listen.cancel();
}

console.log('\n6 \u00b7 THE EAR CLOSES ITSELF \u2014 an empty room, and nobody there');
{
  const c = mk();
  c._setState('idle');
  c.armMic(); await tick();
  const L = window.Amenti.listen;
  is(L.isRecording() === true, 'the mic is open');
  L._openedAt = Date.now() - 60000;                    // 60s ago, and nothing was said
  push(frame(0.0004));
  is(L.isRecording() === false, 'silence for 45s \u2192 THE EAR CLOSES ITSELF. A forgotten tab does not listen forever.');
  is(c._micAuto === false, 'and it will NOT auto-arm back into an empty room');
  is(notices.some(n => /ear has closed/.test(n)), 'and the seeker is told');
}

console.log('\n7 \u00b7 THE HARD CEILING \u2014 one turn cannot be five minutes');
{
  const c = mk();
  c._setState('idle'); c.armMic(); await tick();
  const L = window.Amenti.listen;
  push(frame(0.5));                                    // they ARE speaking
  L._openedAt = Date.now() - (6 * 60000);              // …and have been for six minutes
  push(frame(0.5));
  is(L.isRecording() === false, 'a 5-minute ceiling on ONE recording. Not a policy \u2014 a ceiling.');
}

console.log('\n8 \u00b7 STT text is UNTRUSTED \u2014 the microphone is not the seeker');
{
  const c = mk();
  await c.send('hello'); await settle();               // source defaults to 'text'
  is(c._voiceTurns === 0, 'the keyboard is DELIBERATE \u2014 it costs nothing against the voice budget');
  const before = c._voiceTurns;
  await heard(c, 'this came out of a television across the room and nobody chose it');
  is(c._voiceTurns === before + 1, 'the microphone is AMBIENT \u2014 every word it hears is counted and bounded');
  window.Amenti.listen.cancel();
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED' : '\u2713 all ' + P + ' passed'));
process.exit(F ? 1 : 0);
})();
