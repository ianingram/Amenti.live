/* THE DOCTRINE FILE · THE TURN · AND THE TRAP
   The trap is the point: an UNCONFIRMED reading must never anchor. */
global.window = global;
require('./amenti-doctrine.js');
require('./amenti-chat.js');

let P=0,F=0;
const is=(c,m)=>c?(console.log('  \u2713 '+m),P++):(console.log('  \u2717 '+m),F++,process.exitCode=1);
const settle = () => new Promise(r => setImmediate(r));

let REPLY = '[move: reflect] Speak on.', spoken = null, sys = '', notices = [], sent = null;
window.claude = { complete: r => { sys = r.system; sent = r.messages; return Promise.resolve(REPLY); } };
function mk() {
  spoken = null; notices = [];
  return window.Amenti.chat.create({
    figure: { name: 'Caesar', bio: 'x' },
    render: { user(){}, bot: () => ({ setText: t => spoken = t, setHTML(){} }) },
    speak: (t, d) => { setTimeout(d, 0); },
    onNotice: t => notices.push(t),
    userName: 'Jason',
    mic: { auto: false }
  });
}
async function turn(c, t, reply) { REPLY = reply || '[move: reflect] Speak on.'; await c.send(t); await settle(); await new Promise(r=>setTimeout(r,2)); }

const TURN_READ = '[move: turnread] So, Jason \u2014 and correct me if I am wrong \u2014 you said the work was beneath you. And earlier you said your brother would never forgive you. It seems to me those are the same sentence.';

(async () => {

console.log('\n1 \u00b7 THE DOCTRINE IS THE ONE PLACE');
{
  const D = window.Amenti.doctrine;
  is(!!D, 'Amenti.doctrine aboard (' + D.__v + ')');
  is(Object.keys(D.REGISTERS).length === 6, 'the SIX registers live here \u2014 and nowhere else');
  is(D.DETECT.arrestHeavy.length > 20 && D.DETECT.roomAside.length > 20,
     'the word lists live here \u2014 the weakest code in the fleet, and now editable in ten seconds');
  is(typeof D.DIALS.arrestCooldown === 'number' && typeof D.DIALS.handsFreeMax === 'number',
     'every dial lives here');
  is(!!D.MOVES.turnhold && !!D.MOVES.turnread, 'and THE TURN is a move \u2014 added as DATA, no engine edit');
}

console.log('\n2 \u00b7 THE ENGINE READS IT (and the prompt teaches from it)');
{
  const c = mk();
  await turn(c, 'hello');
  is(c.MOVES.turnhold !== undefined, 'the engine picked up the new move from the doctrine');
  is(/\[move: turnhold\]/.test(sys), 'and the FIGURE was taught it \u2014 with no prompt edit');
  is(/\[move: turnread\]/.test(sys), 'both beats taught');
  is(/THE NAME IS THE LEVER/.test(sys), 'and WHY: the name is spent HERE');
  is(/correct me if I am wrong/.test(sys), 'and the confirmation protocol is in the prompt');
  is(/Two statements per question/.test(sys), 'the LAW still travels');
}

console.log('\n3 \u00b7 THE TURN IS TWO BEATS \u2014 and the first does not gate');
{
  const c = mk();
  const D = window.Amenti.doctrine;
  is(D.MOVES.turnhold.gate === false,
     'BEAT ONE does not hold the floor \u2014 "if one is given continue, and if one is not, continue"');
  is(D.MOVES.turnhold.expecting === true, '\u2026but it IS waiting. The pause is a probe.');
  is(D.MOVES.turnhold.register === 'grave' && D.MOVES.turnread.register === 'grave',
     'both beats delivered GRAVE \u2014 the conversation has stopped');
}

console.log('\n4 \u00b7 THE TRAP \u2014 an UNCONFIRMED reading must NEVER anchor');
{
  const c = mk();
  for (let i = 0; i < 5; i++) await turn(c, 'exchange ' + i);
  await turn(c, 'it was the money, mostly', TURN_READ);

  is(c._turnOffered !== null, 'the Turn is SPOKEN \u2014 and held PROVISIONALLY');
  is(c._turnAnchor === null,
     'and it has NOT anchored. It is an OFFER. It may be wrong. THAT IS THE POINT.');
}

console.log('\n5 \u00b7 THEY CORRECT IT \u2014 the CORRECTION becomes the anchor');
{
  const c = mk();
  for (let i = 0; i < 5; i++) await turn(c, 'exchange ' + i);
  await turn(c, 'it was the money', TURN_READ);
  await turn(c, 'No \u2014 it is not my brother. It is that I told everyone I had made it.');

  is(c._turnAnchor !== null, 'the Turn resolves');
  is(/told everyone I had made it/.test(c._turnAnchor),
     'and THE CORRECTION IS THE ANCHOR: ' + JSON.stringify(c._turnAnchor.slice(0, 90) + '\u2026'));
  is(!/brother would never forgive/.test(c._turnAnchor),
     'THE FIGURE\u2019S MISREADING NEVER ENTERS THE PAYLOAD. It would have carried it forever.');
  is(notices.some(n => /corrected/.test(n)), 'and it is recorded honestly');
}

console.log('\n6 \u00b7 THEY LET IT STAND \u2014 silence is assent');
{
  const c = mk();
  for (let i = 0; i < 5; i++) await turn(c, 'exchange ' + i);
  await turn(c, 'it was the money', TURN_READ);
  await turn(c, 'Yes. That is exactly it.');
  is(/same sentence/.test(c._turnAnchor || ''), 'confirmed \u2192 THE TURN is the anchor');
  is(notices.some(n => /Turn stands/.test(n)), 'and it says so');
}

console.log('\n7 \u00b7 THE CONVERGENCE \u2014 the Turn REPLACES the opening in the payload');
{
  const c = mk();
  for (let i = 0; i < 5; i++) await turn(c, 'opening chatter number ' + i);
  await turn(c, 'the money', TURN_READ);
  await turn(c, 'Yes, that is it exactly.');
  for (let i = 0; i < 20; i++) await turn(c, 'a later exchange ' + i);

  const head = sent.slice(0, 2);
  is(/same sentence/.test(head[1].content),
     'the payload now OPENS with the confirmed Turn, not with "opening chatter number 0"');
  is(!/opening chatter number 0/.test(JSON.stringify(sent)),
     'the raw opening is GONE from the payload \u2014 replaced by the distillation of it');
  is(sent.length <= 15, 'and the payload is still bounded (' + sent.length + ' messages)');
  is(c.history.length === 54, 'while the transcript stays WHOLE (' + c.history.length + ' messages)');
  console.log('       anchor now reads: ' + JSON.stringify(head[1].content.slice(0, 70) + '\u2026'));
}

console.log('\n8 \u00b7 NO DOCTRINE ABOARD \u2192 the engine behaves EXACTLY as before');
{
  const saved = window.Amenti.doctrine;
  delete window.Amenti.doctrine;
  const c = mk();
  is(c.MOVES.reflect.expecting === true, 'built-in MOVES still work');
  is(c.ARREST_HEAVY.length > 20 && c.ROOM_ASIDE.length > 10, 'built-in word lists still work');
  is(c.ARREST_COOLDOWN === 6 && c.HANDS_FREE_MAX === 12, 'built-in dials still work');
  await turn(c, 'hi');
  is(/DECLARE YOUR MOVE/.test(sys), 'and the prompt still builds');
  is(c.MOVES.turnhold === undefined, 'the Turn is simply ABSENT \u2014 degraded, not broken');
  window.Amenti.doctrine = saved;
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED' : '\u2713 all ' + P + ' passed'));
process.exit(F ? 1 : 0);
})();
