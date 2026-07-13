/* THE WATCHLIST — the model arms the fast path; the trigger stays instant. */
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
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ text: '' }) });
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);
const tick = () => new Promise(r => setImmediate(r));
const settle = async () => { for (let i=0;i<5;i++) { await tick(); await new Promise(r=>setTimeout(r,1)); } };

let REPLY = '[move: reflect] Speak on.';
let spoken=null, rendered=null, sysSeen='';
window.claude = { complete: r => { sysSeen = r.system; return Promise.resolve(REPLY); } };
function mk() {
  spoken=null; rendered=null;
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText: t => rendered = t, setHTML(){} }) },
    speak: (t,onDone,m) => { spoken=t; setTimeout(onDone,0); },
    stopSpeaking: () => {},
    mic: { auto:false, barge:true, arrest:true }
  });
}
async function turn(c, words, reply) { REPLY = reply || '[move: reflect] Speak on.'; await c.send(words); await settle(); }
const partial = t => global.partialCb({ results: [[{ transcript: t }]] });

(async () => {

console.log('\n1 \u00b7 The tags are stripped. The audience never sees the prompt book.');
{
  const c = mk();
  await turn(c, 'my brother and I do not speak',
    '[move: reflect]\n[watch: brother | the money]\n[catch: Wait. Your brother. You have set him down twice now and walked away.]\nSo there is a distance there.');
  is(rendered === 'So there is a distance there.', 'the screen shows ONLY the words: ' + JSON.stringify(rendered));
  is(spoken === 'So there is a distance there.', 'the mouth speaks ONLY the words \u2014 no tag is ever uttered');
  // (JSON.stringify() of an array OPENS with "[" — the first version of this
  //  test matched its own wrapper. Check the CONTENT.)
  const contents = c.history.map(h => h.content).join(' || ');
  is(!/\[(move|watch|catch)/i.test(contents), 'and no stage direction reaches the transcript: ' + JSON.stringify(contents));
  is(c._watchlist.join('|') === 'the money|brother' || c._watchlist.includes('brother'),
     'but the figure is now ARMED: [' + c._watchlist.join(', ') + ']');
  is(/walked away/.test(c._catchLine), 'and it has pre-written its own arrest, in its own voice');
}

console.log('\n2 \u00b7 THE CATCH \u2014 the figure says ITS line, not my mangled window');
{
  const c = mk();
  await turn(c, 'one'); await turn(c, 'two');
  await turn(c, 'my brother and I do not speak',
    '[move: reflect]\n[watch: brother]\n[catch: Wait. Your brother. You have set him down twice now and walked straight past him.]\nGo on.');
  await turn(c, 'four'); await turn(c, 'five'); await turn(c, 'six'); await turn(c, 'seven');

  c.armMic(); await tick();
  spoken = null;
  const t0 = process.hrtime.bigint();
  partial('anyway the brother thing is whatever, it does not matter, the real issue is the timeline');
  const us = Number(process.hrtime.bigint() - t0) / 1000;

  is(spoken !== null, 'they skirt it again \u2192 the figure CUTS IN');
  is(/set him down twice/.test(spoken), 'and it says the line IT wrote: ' + JSON.stringify(spoken));
  is(!/^Wait\. "/.test(spoken), 'NOT my \u00b16-word clipped window. No mumbling, no comma-seam tuning.');
  is(us < 5000, 'and it still fires in ' + us.toFixed(0) + '\u00b5s. The MODEL armed it; the TRIGGER is local.');
  window.Amenti.listen.cancel();
}

console.log('\n3 \u00b7 The watchlist catches what my word list CANNOT');
{
  const c = mk();
  const plain = 'he does not call anymore but anyway that is not what I came to ask about';
  is(c._arrestable(plain) === null,
     'my hand-made list misses "he does not call anymore" \u2014 no heavy word in it, and it is the whole conversation');
  c._watchlist = ['does not call'];
  c._catchLine = 'Wait. He does not call. You said it and kept walking.';
  const found = c._arrestable(plain);
  is(found !== null && found.source === 'watch', 'the FIGURE\u2019s watchlist catches it instantly');
  is(found.heavy === 'does not call', 'because it named THIS seeker\u2019s buried thing, not a dictionary of sadness');
}

console.log('\n4 \u00b7 The word list still works when the model forgets \u2014 degrade, never break');
{
  const c = mk();
  await turn(c, 'one'); await turn(c, 'two'); await turn(c, 'three'); await turn(c, 'four');
  is(c._watchlist === null, 'the model armed nothing');
  c.armMic(); await tick();
  spoken = null;
  partial("anyway it does not matter that I failed, whatever, the point is the timeline");
  is(spoken !== null && /^Wait\. "/.test(spoken), 'the crude fallback still fires: ' + JSON.stringify(spoken));
  is(c._listArrests === 1, 'and it is booked against the LIST budget');
  window.Amenti.listen.cancel();
}

console.log('\n5 \u00b7 THE CAP, LABELLED HONESTLY \u2014 my detector gets ONE strike');
{
  const c = mk();
  for (let i=0;i<5;i++) await turn(c, 'turn ' + i);
  c.armMic(); await tick();
  partial("anyway it does not matter that I failed, whatever, the point is the timeline");
  is(c._listArrests === 1, 'the list fires once');
  await settle();

  for (let i=0;i<8;i++) await turn(c, 'later ' + i);      // cooldown fully clear
  window.Amenti.listen.cancel();
  c._setState('idle'); c.armMic(); await tick();
  spoken = null;
  partial("anyway it does not matter that she left me, whatever, forget it");
  is(spoken === null, 'the list NEVER fires twice. I do not trust it, and the code now says so.');

  // …but the model-armed trigger is trusted further, because it is a better trigger.
  c._watchlist = ['she left me'];
  c._catchLine = 'Wait. She left you. You have said it twice and walked past it twice.';
  partial("anyway it does not matter that she left me, whatever, forget it");
  is(/walked past it twice/.test(spoken || ''),
     'the WATCHLIST still fires: ' + JSON.stringify(spoken));
  is(c._arrests === 2 && c._listArrests === 1,
     'two arrests \u2014 one crude, one armed. The ceiling tracks WHO PULLED THE TRIGGER.');
  window.Amenti.listen.cancel();
}

console.log('\n6 \u00b7 The watchlist ACCUMULATES \u2014 a thing once buried stays buried');
{
  const c = mk();
  await turn(c, 'a', '[move: reflect]\n[watch: brother]\nI see.');
  await turn(c, 'b', '[move: reflect]\n[watch: the money]\nGo on.');
  is(c._watchlist.length === 2, 'two turns, two things watched: [' + c._watchlist.join(', ') + ']');
  is(c._watchlist[0] === 'the money', 'most recent first');
  await turn(c, 'c', '[move: reflect]\nNothing buried here.');
  is(c._watchlist.length === 2, 'a turn that arms nothing does not DISARM what came before');
}

console.log('\n7 \u00b7 The figure is told how to arm itself');
{
  const c = mk();
  await turn(c, 'hi');
  is(/ARM THE ARREST/.test(sysSeen), 'the protocol is in the prompt');
  is(/\[watch:/.test(sysSeen) && /\[catch:/.test(sysSeen), 'both tags are taught');
  is(/THINK NOW, one turn early/.test(sysSeen), 'and WHY: there is no time to think when the moment arrives');
  is(/Omit both when nothing is being buried/.test(sysSeen), 'and that most turns arm nothing at all');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
process.exit(F ? 1 : 0);
})();
