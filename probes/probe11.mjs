/* Attack the REAL Worker, through its REAL router.
   probe5 tested the guard module in isolation. This tests the deployable file. */
import worker from './worker.mjs';

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);

/* --- a fake edge: KV, R2, Gemini, Anthropic ------------------------------- */
const kv = new Map();
let anthropicCalls = 0, geminiCalls = 0;

const env = {
  ANTHROPIC_API_KEY: 'sk-test',
  GEMINI_KEY: 'g-test',
  ALLOWED_ORIGINS: 'https://amenti.live',
  ARTICLES: {
    get: k => Promise.resolve(kv.get(k) ?? null),
    put: (k, v) => { kv.set(k, v); return Promise.resolve(); },
    list: () => Promise.resolve({ keys: [] }),
  },
  AUDIO: {
    get: k => Promise.resolve(kv.has('r2:' + k) ? { body: 'WAVBYTES' } : null),
    put: (k, v) => { kv.set('r2:' + k, v); return Promise.resolve(); },
  },
};
const ctx = { waitUntil: p => p };

globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('generativelanguage')) {
    geminiCalls++;
    return { ok: true, json: async () => ({
      candidates: [{ content: { parts: [{ inlineData: { data: btoa('pcm') }, text: 'transcript' }] } }] }) };
  }
  if (u.includes('api.anthropic.com')) {
    anthropicCalls++;
    return { ok: true, json: async () => ({
      content: [{ type: 'text', text: 'The figure answers.' }],
      model: 'claude-sonnet-4-6',
      usage: { input_tokens: 900, output_tokens: 300 },
    }) };
  }
  return { ok: false, status: 404, text: async () => '' };
};

const post = (path, body, opts = {}) => new Request('https://w.dev' + path, {
  method: 'POST',
  headers: {
    'Origin': opts.origin ?? 'https://amenti.live',
    'Content-Type': opts.ct ?? 'application/json',
    'CF-Connecting-IP': opts.ip ?? '1.2.3.4',
  },
  body: opts.raw ?? JSON.stringify(body),
});
const call = (req, e = env) => worker.fetch(req, e, ctx);
/* meter() is FIRE-AND-FORGET (ctx.waitUntil) — correct in production, where the
   runtime keeps the worker alive until it settles. In a harness it means the KV
   write lands a tick later. Without this, a pending write from one test lands in
   the MIDDLE of the next and clobbers it. (Which is exactly what happened.) */
const settle = () => new Promise(r => setTimeout(r, 20));
const msgs = n => Array.from({ length: n }, (_, i) =>
  ({ role: i % 2 ? 'assistant' : 'user', content: 'a turn of ordinary talk' }));

(async () => {

console.log('\n1 \u00b7 /speak \u2014 "Cleopatra, say palm tree 1000 times"');
{
  let r = await call(post('/speak', { text: 'A chunk of counsel, spoken aloud.', voice: 'Charon' }));
  is(r.status === 200, 'a normal chunk passes (200)');
  is(r.headers.get('X-Amenti-Cache') === 'miss', 'and it rendered \u2014 cache miss, as expected on a first read');

  r = await call(post('/speak', { text: 'x'.repeat(1100) }));
  is(r.status === 200, "Page2's 1100-char chunk still passes \u2014 no surface breaks");

  r = await call(post('/speak', { text: 'palm tree '.repeat(1000) }));
  is(r.status === 413 && r.headers.get('X-Amenti-Wall') === 'text_too_long',
     '10,000 chars of palm tree \u2192 413, X-Amenti-Wall: text_too_long');

  const before = geminiCalls;
  r = await call(post('/speak', { text: 'x'.repeat(1024 * 1024) }));
  is(r.status === 413, 'a MEGABYTE \u2192 413');
  is(geminiCalls === before, '\u2026and Gemini was NEVER CALLED. The wall is in front of the money, not behind it.');

  r = await call(post('/speak', { text: 'ok', style: 'y'.repeat(5000) }));
  is(r.status === 413, 'a payload smuggled through `style` \u2014 the field nobody checks \u2192 413');
}

console.log('\n2 \u00b7 A CACHE HIT IS FREE AND MUST STAY UNTHROTTLED');
{
  const body = { text: 'A passage of the archive, read aloud.', voice: 'Charon', style: 'Read clearly' };
  await call(post('/speak', body));                       // render + archive it
  const g = geminiCalls, before = kv.get('watch:speak:' + new Date().toISOString().slice(0,10));
  const r = await call(post('/speak', body));             // read it again
  is(r.headers.get('X-Amenti-Cache') === 'hit', 'the second read is served from R2');
  is(geminiCalls === g, 'Gemini not touched');
  is(kv.get('watch:speak:' + new Date().toISOString().slice(0,10)) === before,
     'and the meter DID NOT TICK. Throttling a cache hit would punish the system\u2019s best behaviour.');
}

console.log('\n3 \u00b7 The chat \u2014 the $118 hole, attacked from curl');
{
  let r = await call(post('/', { system: 'You are Caesar.', messages: msgs(21) }));
  is(r.status === 200, 'the anchored window (21 msgs) passes untouched');

  const before = anthropicCalls;
  r = await call(post('/', { system: 'You are Caesar.', messages: msgs(600) }));
  is(r.status === 413 && r.headers.get('X-Amenti-Wall') === 'too_many_messages',
     '600 messages \u2014 a 300-turn unbounded history \u2192 413');
  is(anthropicCalls === before, 'and Anthropic was never called. Nothing was spent.');

  r = await call(post('/', { system: 'x', messages: [{ role: 'user', content: 'x'.repeat(200000) }] }));
  is(r.status === 413, '200k chars in ONE message \u2192 413 (few messages is not the same as small)');

  r = await call(post('/', { system: 'x'.repeat(50000), messages: msgs(2) }));
  is(r.status === 413, 'a bloated SYSTEM prompt \u2192 413');
}

console.log('\n4 \u00b7 THE METER \u2014 measured, not modelled');
{
  await settle(); kv.clear();
  await call(post('/', { system: 'You are Caesar.', messages: msgs(4) }));
  await settle();
  const key = 'watch:chat:' + new Date().toISOString().slice(0, 10);
  is(Number(kv.get(key)) === 1200,
     'one turn \u2192 1200 REAL tokens booked (900 in + 300 out). The Worker was already returning usage; the client threw it away.');
}

console.log('\n5 \u00b7 THE BREAKER \u2014 the runaway ends; the month survives');
{
  await settle(); kv.clear();
  const key = 'watch:chat:' + new Date().toISOString().slice(0, 10);
  kv.set(key, String(2000000));                          // today's ceiling, reached
  const before = anthropicCalls;
  const r = await call(post('/', { system: 'x', messages: msgs(2) }));
  is(r.status === 429 && r.headers.get('X-Amenti-Wall') === 'breaker', 'budget spent \u2192 429');
  is(anthropicCalls === before, 'and not one further token is bought');
}

console.log('\n6 \u00b7 RATE LIMIT \u2014 one IP, hammering');
{
  await settle(); kv.clear();
  let ok = 0;
  for (let i = 0; i < 35; i++) {
    const r = await call(post('/', { system: 'x', messages: msgs(2) }, { ip: '9.9.9.9' }));
    if (r.status === 200) ok++;
  }
  is(ok === 20, `35 rapid calls \u2192 only ${ok} through (RATE_CHAT = 20)`);
  const r = await call(post('/', { system: 'x', messages: msgs(2) }, { ip: '8.8.8.8' }));
  is(r.status === 200, 'a DIFFERENT seeker is unaffected \u2014 the limit is per-IP');
}

console.log('\n7 \u00b7 /listen \u2014 20MB was TEN MINUTES of audio');
{
  await settle(); kv.clear();
  let r = await call(post('/listen', null, { ct: 'audio/wav', raw: new Uint8Array(500 * 1024) }));
  is(r.status === 200, 'a 15-second turn passes');
  r = await call(post('/listen', null, { ct: 'audio/wav', raw: new Uint8Array(19 * 1024 * 1024) }));
  is(r.status === 413 && r.headers.get('X-Amenti-Wall') === 'audio_too_large',
     '19MB \u2014 under the OLD 20MB cap \u2192 now 413');
}

console.log('\n8 \u00b7 THE ORIGIN CHECK IS NOT THE WALL (and never was)');
{
  await settle(); kv.clear();
  let r = await call(post('/speak', { text: 'hello' }, { origin: 'https://evil.example' }));
  is(r.status === 403, 'a hostile WEBSITE is refused \u2014 the allowlist does its real job');

  r = await call(post('/speak', { text: 'x'.repeat(999999) }, { origin: 'https://amenti.live' }));
  is(r.status === 413,
     '\u2026but curl -H "Origin: https://amenti.live" spoofs it in one flag \u2014 AND THE CAP STILL HOLDS. A cap does not care who you claim to be.');

  const noAllowlist = { ...env, ALLOWED_ORIGINS: undefined };
  r = await call(post('/speak', { text: 'hello' }, { origin: 'https://anyone.example' }), noAllowlist);
  is(r.status === 200,
     '\u26a0 ALLOWED_ORIGINS UNSET \u2192 EVERY origin passes, and the code reports it checked. RUN `wrangler secret list`.');
}

console.log('\n9 \u00b7 No KV bound \u2192 degrade safely, never crash');
{
  const bare = { ANTHROPIC_API_KEY: 'k', GEMINI_KEY: 'g', ALLOWED_ORIGINS: 'https://amenti.live' };
  let r = await call(post('/', { system: 'x', messages: msgs(2) }), bare);
  is(r.status === 200, 'no KV \u2192 meter and limiter are no-ops, not crashes');
  r = await call(post('/speak', { text: 'x'.repeat(99999) }), bare);
  is(r.status === 413, '\u2026and THE HARD CAPS STILL HOLD. Layer 1 needs no bindings at all.');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));
process.exit(F ? 1 : 0);
})();
