/* §11 THE ROOM. The privacy rules are tested harder than the feature. */
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
let TRANSCRIPT = '';
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ text: TRANSCRIPT }) });
global.Blob = function () {};

require('./amenti-listen.js');
require('./amenti-chat.js');

const LOUD  = () => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?0.5:-0.5); return f; };
const push  = f => processor.onaudioprocess({ inputBuffer: { getChannelData: () => f } });
const tick  = () => new Promise(r => setImmediate(r));
// The speaker's onDone is a setTimeout (a MACROtask). setImmediate ticks flush
// microtasks only, so the machine stayed stuck in 'speaking', armMic() bailed,
// and the next push() hit a torn-down processor. Flush real timers.
const settle = async () => { for (let i=0;i<6;i++) { await tick(); await new Promise(r => setTimeout(r, 1)); } };

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);

let spoken=null, meta=null, notices=[], userRendered=[];
window.claude = { complete: () => Promise.resolve('[move: reflect] I hear you.') };
function mk() {
  spoken=null; meta=null; notices=[]; userRendered=[];
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user: t => userRendered.push(t), bot: () => ({ setText(t){}, setHTML(h){} }) },
    speak: (t,onDone,m) => { spoken=t; meta=m; setTimeout(onDone,0); },
    stopSpeaking: () => {},
    onNotice: t => notices.push(t),
    mic: { auto:false, barge:true, arrest:true, room:true }
  });
}
/* the seeker's dog barks: loud audio, and the transcriber finds no words in it */
/* THE THRESHOLD GATE (new contract): before one real exchange has landed, a
   loud wordless sound is far likelier to be a LAUGH OF ASTONISHMENT than a
   labrador — so the room stays quiet. Every room test must cross first. */
async function cross(c) { TRANSCRIPT = ''; await c.send('hello'); await settle(); }

const QUIET = () => { const f = new Float32Array(4096); for (let i=0;i<4096;i++) f[i] = (i%2?0.0004:-0.0004); return f; };
async function bark(c) {
  TRANSCRIPT = '';
  c.armMic(); await tick();
  push(QUIET()); push(LOUD()); push(LOUD()); push(QUIET());   // a bark IN A ROOM, not a wall of noise
  window.Amenti.listen.stop();
  await settle();
}
async function say(c, words) {
  TRANSCRIPT = words;
  c.armMic(); await tick();
  push(QUIET()); push(LOUD()); push(LOUD()); push(QUIET());
  window.Amenti.listen.stop();
  await settle();
}

(async () => {

console.log('\n1 \u00b7 A blip might be a dog');
{
  const c = mk();
  await cross(c);
  await bark(c);
  is(spoken !== null, 'a loud sound with no words \u2192 the figure NOTICES: ' + JSON.stringify(spoken));
  is(/dog/i.test(spoken), 'and it offers a NEAR-MISS \u2014 warm, zero-risk, invites a correction');
  is(meta.room === true && meta.register === 'humour', 'delivered with humour, flagged as a room event');
  is(c._breakdowns === 0, 'AND it does not count as a breakdown \u2014 the old code punished them for owning a dog');
}

console.log('\n2 \u00b7 Three barks used to DISCONNECT the human. Now they do not.');
{
  const c = mk();
  await cross(c);
  for (let i = 0; i < 4; i++) { await bark(c); c._setState('idle'); }
  is(c._breakdowns === 0, 'four sounds in the room \u2192 breakdowns still 0. Nobody is thrown out of the hall.');
  is(c._roomAcks === 2, 'and the figure remarked TWICE, then stopped. Presence, not commentary.');
}

console.log('\n3 \u00b7 A voice not for us \u2014 the figure YIELDS THE FLOOR');
{
  const c = mk();
  await cross(c);
  await say(c, 'no not now honey');
  is(/You are needed/.test(spoken || ''), 'the figure stands aside: ' + JSON.stringify(spoken));
  is(!/who/i.test(spoken || '') && !/\?/.test((spoken||'').replace('am I wrong?','')),
     'and it does NOT ask who it was. It acknowledged; it did not investigate.');
}

console.log('\n4 \u00b7 RULE 3 \u2014 notice, do not record. THE DOSSIER TEST.');
{
  const c = mk();
  await cross(c);
  await say(c, 'no not now honey I said put that down');
  const stored = JSON.stringify(c.history);
  is(!/honey/.test(stored), 'the overheard words are NOT in the transcript');
  is(!/put that down/.test(stored), 'nothing the seeker said to their CHILD is recorded');
  is(!userRendered.some(t => /honey/.test(t)), 'and it is not rendered to the screen either');
  is(/You are needed/.test(stored), "only the figure's own line is kept. Care, not a dossier.");
}

console.log('\n5 \u00b7 RULE 2 \u2014 "just us" ends it. Permanently.');
{
  const c = mk();
  await cross(c);
  await bark(c);
  is(c._roomAcks === 1, 'the figure remarks on the sound');
  await say(c, "it's nothing, just us");
  is(c._roomOff === true, 'the seeker declines \u2192 _roomOff. PERMANENT.');
  spoken = null;
  await bark(c);
  is(spoken === null, 'the dog barks again \u2192 the figure says NOTHING. No second attempt. Ever.');
}

console.log('\n6 \u00b7 RULE 1 \u2014 the newcomer did not consent');
{
  const c = mk();
  await cross(c);
  await say(c, 'hang on, come here a second');
  is(/I will keep/.test(spoken || ''), 'the figure yields, warmly');
  is(!/name|who|call you|tell me about/i.test(spoken || ''),
     'and gathers NOTHING about whoever walked in. They are a guest, not a subject.');
}

console.log('\n7 \u00b7 The line: acknowledge what announces itself; never investigate what does not');
{
  const c = mk();
  is(c._isAside('no not now honey') === true, 'a short aside with a vocative \u2192 announced itself');
  is(c._isAside('I think the honey of my ambition has curdled, and I will tell you why that is so') === false,
     'a long turn ABOUT honey \u2192 that is for us. Not an aside.');
  is(c._isAside('what would you have done at the Rubicon') === false, 'a real question \u2192 not an aside');
  is(c._roomDeclined('no one, ignore that') === true, 'a decline is heard');
  is(c._roomDeclined('my brother is here and I want to talk about him') === false,
     'and a real disclosure is NOT mistaken for a decline');
}

console.log('\n8 \u00b7 THE LEAK \u2014 the mic must not stay open after the figure finishes');
{
  const c = mk();
  await c.send('speak to me');
  await settle();
  is(c.state === 'idle', 'the figure finished speaking, nobody interrupted');
  is(window.Amenti.listen.isRecording() === false,
     'the barge monitor is CLOSED. It was leaking the mic open, and the next armMic() silently did nothing \u2014 a dead push-to-talk button with no error anywhere.');
  c.armMic(); await tick();
  is(c.state === 'listening', 'and push-to-talk still works on the very next turn');
  window.Amenti.listen.cancel();
}

console.log('\n9 \u00b7 Room off by default \u2014 nothing changes for a surface that does not ask for it');
{
  const c = window.Amenti.chat.create({
    figure: { name: 'Caesar' },
    render: { user(){}, bot: () => ({ setText(){}, setHTML(){} }) },
    speak: (t,d) => { spoken = t; setTimeout(d,0); },
    mic: { auto: false }                       // no room
  });
  c._crossed = true;
  spoken = null;
  await bark(c);
  is(spoken === null, 'no room flag \u2192 the figure notices nothing, exactly as before');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
})();
