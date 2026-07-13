/* Probe the anchored window. Never trust an edit you haven't run. */
global.window = global;   // in a browser, window.Amenti IS the global Amenti
require('./amenti-chat.js');

let lastPayload = null;
window.claude = {
  complete: function (req) {
    lastPayload = req.messages;
    return Promise.resolve('The figure answers. Some prose of a plausible length, here.');
  }
};

function fail(m) { console.log('  ✗ ' + m); process.exitCode = 1; }
function pass(m) { console.log('  ✓ ' + m); }

/* Every payload must be a legal conversation: starts 'user', strictly alternating,
   ends 'user'. If the seam breaks this, the transport will choke or the API will
   silently merge turns — and we would never see it. */
function checkShape(msgs, label) {
  if (!msgs.length) return fail(label + ': empty payload');
  if (msgs[0].role !== 'user') return fail(label + ': starts with ' + msgs[0].role);
  if (msgs[msgs.length - 1].role !== 'user') return fail(label + ': ends with assistant');
  for (var i = 1; i < msgs.length; i++) {
    if (msgs[i].role === msgs[i - 1].role) {
      return fail(label + ': two ' + msgs[i].role + ' in a row at index ' + i);
    }
  }
  return true;
}

async function run(label, capSetting, turns) {
  console.log('\n' + label);
  if (capSetting === null) {
    delete window.Sovereign;
  } else {
    window.Sovereign = { Angels: { Origin: { _state: { historyCap: capSetting } } } };
  }

  const chat = window.Amenti.chat.create({ figure: { name: 'Caesar', bio: 'x' } });

  let maxPayload = 0, shapeOk = true;
  for (let i = 1; i <= turns; i++) {
    await chat.send('Seeker utterance number ' + i + ', of ordinary length and substance.');
    maxPayload = Math.max(maxPayload, lastPayload.length);
    if (!checkShape(lastPayload, 'turn ' + i)) shapeOk = false;
  }

  console.log('  transcript (this.history): ' + chat.history.length + ' messages');
  console.log('  max payload ever sent:     ' + maxPayload + ' messages');
  if (chat.history.length === turns * 2) pass('transcript is COMPLETE — nothing lost');
  else fail('transcript wrong: expected ' + turns * 2);

  const cap = chat._cap();
  if (maxPayload <= cap + 1) pass('payload BOUNDED at ' + maxPayload + ' (cap ' + cap + ')');
  else fail('payload exceeded cap: ' + maxPayload + ' > ' + cap);
  if (shapeOk) pass('role alternation intact across the elision seam');

  const marker = lastPayload.find(m => m.content.indexOf('further exchange') === 0 + m.content.indexOf('further exchange') && m.content.startsWith('[…'));
  if (turns > 20) {
    if (marker) pass('honest elision marker present: ' + marker.content);
    else fail('no elision marker — the figure forgets silently');
  }
  const anchorHeld = lastPayload[0].content.indexOf('number 1,') !== -1;
  if (turns > 20) (anchorHeld ? pass('ANCHOR held: turn 1 still in the payload') : fail('anchor lost'));
}

(async () => {
  await run('DEFAULT (no Origin panel on the page) · 300 turns', null, 300);
  await run('ORIGIN historyCap = 20 (Page2 convention) · 300 turns', 20, 300);
  await run('ORIGIN historyCap = 1 (the inversion case — old code sent EVERYTHING)', 1, 60);
  await run('SHORT TALK · 3 turns — must send the lot, no marker', null, 3);
})();
