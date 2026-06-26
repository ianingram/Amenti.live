Built in the Mind's Image — The Amenti Neural Interface

  The Amenti Interface · A Product Thesis

# Built in the
Mind's Image

  The mind forms the thought, then gives it voice.

  Amenti.live — a Library of Legends, powered by AI

    01 The thesis

## One mind, three faculties, bound into a single act.

    A brain does not think and speak at once with a single organ. It composes a thought in one faculty, lends it words in another, and keeps what it has made in a third. These are distinct powers — sequenced, not braided — and meaning travels cleanly between them.

    The Amenti Neural Interface is built in that image. Not as metaphor for a brochure, but as architecture. Where a lesser system asks one model to think and speak in the same tangled breath, Amenti separates the faculties and lets each be itself. The result is an interface that behaves the way a mind does: it forms the meaning first, then gives it voice.

        I

### Cognition

        The mind · Claude

        Forms meaning. The figure reasons in the first person and composes the thought — the reply, the article, the dispatch.

        II

### Articulation

        The voice · Gemini

        Renders speech. The formed thought is given a voice — directed, not cloned. A timbre, an accent, a manner of delivery.

        III

### Memory

        The record · KV

        Keeps what is made. Composed content lives apart from the surface, where the page cannot corrupt it. The library remembers.

*FIG. I  The faculties mapped where a brain keeps them — cognition forward, articulation at the voice, memory held aside. The interface is drawn from anatomy, not invented against it.*

    02 The principle

## Form the meaning, then give it voice.

    This is the single idea the whole system repeats at every scale. The brain receives content, then loads speech. First the thought is formed; then it is rendered. We did not invent the sequence — we built a system in its image.

    Sequencing is what makes the interface honest. A figure cannot speak a thing it has not first meant, and so the voice is never a performance laid over emptiness — it is the delivery of a thought that genuinely exists. Each faculty improves on its own clock: the voice can deepen without disturbing cognition; the mind can grow without retuning the voice. They meet only at a clean seam.

    Cognition and articulation are different faculties. Do not braid them into one tangled pipeline. Sequence them — each served by what it is best at.

*FIG. II  Not two systems racing — one act unfolding. The thought is composed, then the same act continues into voice. Sequence is the whole design.*

  · The faculties, in detail

  What follows is each faculty as it is actually built — the task it performs, the code that performs it, and the shape of the signal as it moves. Three powers, one nervous system, one surface.

    03 Cognition · the mind

## Claude forms the thought.Claude tasks · reasons in persona

    Cognition is the figure thinking. Every spoken reply, every article, every dispatch begins here: Claude reasons in the figure's persona and composes meaning in the first person. Nothing is rendered as speech until something has been meant.

    The surface never calls Anthropic directly. It calls the nervous system, which carries the persona and the conversation to Claude and returns the formed thought. The persona lives in the system prompt; the exchange lives in messages. Cognition owns one job and does it completely — it produces text, never audio.

      CLAUDE cognition · the Worker routes thought to Anthropic

```
// THE MIND — a figure reasons in persona and forms the thought.
// Routed through the Worker; the surface never holds the key.
async function handleChat(req, env) {
  const { figure, system, messages } = await req.json();

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,   // a Worker secret
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,      // the figure's persona — it thinks as itself
      messages,    // the conversation so far
    }),
  });

  // returns text only — cognition never speaks
  return new Response(await r.text(), { headers: CORS_JSON });
}
```

*FIG. III  Cognition is a clean round trip: the surface asks, the Worker carries the persona to Claude, the formed thought returns. Text in, meaning out — speech is a later faculty.*

    04 Articulation · the voice

## Gemini gives it voice.Gemini tasks · directed, not cloned

    Articulation takes the formed thought and renders it as speech. The discovery that made this tractable: a figure's voice does not need to be cloned — it needs to be directed. Gemini is an actor that takes stage direction, and direction is prose, which is exactly what this project is made of.

    A voice is composed from the figure's own row. Gender selects the base timbre; register (the surface's mode), dialect (the accent) and voice (the manner) are braided into a single natural-language style string. That string and the base voice ride one request to the Worker's /speak route.

      GEMINI articulation · compose the voice, then render speech

```
// Base timbre is chosen by gender; everything else is direction.
const amentiVoiceForGender = g =>
  g === "male" ? "Charon" : "Kore";   // female / neutral → Kore

// register + accent (dialect) + manner (voice) → one prose direction
const composeStyle = (register, dialect, voice) =>
  `${register}. Accent: ${dialect}. Voice character: ${voice}`;

async function handleSpeak(req, env) {
  const { text, style, voice } = await req.json();

  // load-bearing: the string must be exactly this — "preview" matters
  const MODEL = "gemini-2.5-flash-preview-tts";

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}` +
    `:generateContent?key=${env.GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${style}: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      }),
    }
  );
  return new Response(await r.text(), { headers: CORS_JSON });
}
```

*FIG. IV  Composition, made literal. Gender picks the base timbre; register, dialect and voice braid into a single style direction. One call to /speak and the formed thought is rendered as speech.*

    05 Memory · the record

## The library keeps what it makes.KV tasks · content apart from display

    A library of legends needs things for the legends to say beyond live chat — daily writings, a newsroom, a periodical. Rather than author this by hand, Amenti became a publisher: an engine that writes once, keeps the result, and serves it forever. The keeping happens in memory — a key-value store the display code cannot reach.

    This yields a property worth more than its elegance: content lives apart from display. A surface can break entirely while every composed article sits untouched and safe. You cannot lose the content by breaking the page. Memory is addressed by a locked scheme, and it answers before the mind is ever troubled to compose again.

      KV memory · generate once, cache forever

```
// THE MEMORY — namespace: amenti-articles (env.ARTICLES)
//   <publication>:<figure>:<slug>      planet:lincoln:emancipation-memo
//   atlantica:<figure>:<YYYY-MM-DD>     atlantica:ingram:2026-01-15

async function articleGenerate(req, env) {
  const { key, figure, topic, register } = await req.json();

  const cached = await env.ARTICLES.get(key);   // memory answers first
  if (cached) return json({ key, body: cached, cached: true });

  // a miss — only now is the mind asked to compose
  const body = await claudeWrite(env, figure, topic, register);
  await env.ARTICLES.put(key, body);            // commit to memory
  return json({ key, body, cached: false });    // every future reader gets the cache
}

// a plain read — one article, no generation
const articleGet = (key, env) => env.ARTICLES.get(key);   // GET /article?key=…
```

*FIG. V  Memory answers before the mind. A keyed request checks the store; a hit serves instantly, a miss composes once and commits. Because the record lives apart, a broken page costs an afternoon — never the content.*

    06 The nervous system

## One endpoint routes the three.Worker tasks · the spinal cord

    The principle is not a slogan; it is the shape of the build. Every surface of Amenti speaks to a single Cloudflare Worker — the nervous system — which routes each signal to the faculty it belongs to. Thought to the mind, voice to the voice, the record to memory. Two API keys live here as secrets, and nowhere else.

      WORKER the nervous system · one fetch handler routes every signal

```
// THE NERVOUS SYSTEM — one Worker, one entry point, the secrets held here.
// amenti-proxy.ingram-ian.workers.dev
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // every surface is a browser — answer the preflight first
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    switch (url.pathname) {
      // cognition → the mind
      case "/v1/messages":      return handleChat(req, env);
      // articulation → the voice
      case "/speak":            return handleSpeak(req, env);
      // memory → write (generate-once-cache-forever)
      case "/article/generate": return articleGenerate(req, env);
      case "/atlantica/daily":  return atlanticaDaily(req, env);
      // memory → read
      case "/article":          return articleRead(url, env);
      case "/feed":             return feed(url, env);
      default:                    return new Response("not found", { status: 404 });
    }
  },
};

// bound to the Worker, never shipped to a surface:
//   env.ANTHROPIC_API_KEY   · cognition
//   env.GEMINI_KEY          · articulation
//   env.ARTICLES (KV)       · memory
```

    The handler is short on purpose. The nervous system carries signals; it does not think or speak. Each route hands off to the one faculty that owns the work, and the secrets that unlock the mind and the voice live only here — the surface that calls in never sees them.

      POST /v1/messagescognition → Claude, in-figure reply
      POST /speakarticulation → Gemini TTS  { text, style, voice }
      POST /article/generategenerate-once-cache-forever (Daily Planet)
      POST /atlantica/dailydate-keyed dispatch, generate-on-read
      GET  /article?key=…read one cached record from memory
      GET  /feed?details=1newest-first records · date / name / headline / teaser

*FIG. VI  The whole library speaks to one nervous system, which sends thought to the mind, voice to the voice, and the record to memory — each faculty improvable on its own, meeting only at a clean seam.*

    07 Serving the surface

## The surface never knows which faculty answered.Terminal · Tablet · Atlantica · Planet

    Amenti speaks in four places, and they are not built the same way — two different roster loaders, distinct readers — yet they share one composition and one endpoint. A surface asks the nervous system; behind it, the mind composes, the voice renders, and memory remembers. To the surface, it is a single conversation.

    Here is the whole act from the surface's side: form the thought, compose the voice from the figure's row, then continue the same act into speech. The sequence the brain uses, in code.

      SURFACE any surface · form the meaning, then give it voice

```
// One endpoint serves every surface — the figure never leaks its keys.
const PROXY = "https://amenti-proxy.ingram-ian.workers.dev";

async function speakAs(figure, messages, register) {
  // 1 · the mind forms the thought
  const { text } = await fetch(`${PROXY}/v1/messages`, {
    method: "POST",
    body: JSON.stringify({ figure: figure.key, system: persona(figure), messages }),
  }).then(r => r.json());

  // 2 · compose the voice from this figure's own row
  const voice = amentiVoiceForGender(figure.gender);
  const style = composeStyle(register, figure.dialect, figure.voice);

  // 3 · the same act continues into speech
  const audio = await fetch(`${PROXY}/speak`, {
    method: "POST",
    body: JSON.stringify({ text, style, voice }),
  }).then(r => r.arrayBuffer());

  playGapless(audio);   // the figure is heard, in its own voice
}
```

    Long-form read-aloud — a full dispatch — is the same act one layer down: the brain does not finish a whole thought before it begins to speak. So the surface splits the text, asks /speak per chunk, and plays the buffers gap-free as they arrive. Speech is streamed because thought is chunked. The principle holds at every scale.

    The library thinks — and then it speaks. The whole system is one idea repeated at every scale: form the meaning, then give it voice.

    AMENTI · THE HALLS
    © 2026 Ingram Manor LLC · All Rights Reserved
