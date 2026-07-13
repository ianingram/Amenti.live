/* ============================================================================
   fleet-semantics.js  ·  THE CLAIMS
   ----------------------------------------------------------------------------
   THE AUTHORED HALF. A human writes this. No machine can.

   Names. Roles. Board coordinates. Colours. Threat models. Engine definitions.
   The poetry — "Cassiel, Reader of Names", "The Boatswain of the Voice" — which
   no grep will ever produce, and which nothing can falsify.

   ── WHAT MUST *NOT* BE IN THIS FILE ────────────────────────────────────────
   ANY FACT THE SCANNER COULD CHECK.

     who calls whom · what loads what · which endpoints exist · file sizes ·
     whether a thing is wired · whether a thing is used

   All of that was WRONG in every document this fleet has ever had, and all of
   it is a grep. It belongs in fleet-structure.json, which nobody types.

       CLAIM AS LITTLE AS POSSIBLE.
       EVERY FACT YOU TYPE HERE IS A FACT THAT CAN ROT.

   ── EVERY LINE HERE IS A HYPOTHESIS SUBMITTED FOR FALSIFICATION ────────────
   tools/merge.js reconciles this against the reading and stamps each row:

       CONFIRMED     the claim and the reading agree
       AUTHORED      no probe can check it — and that is fine
       CONTRADICTED  the reading says otherwise
       UNPROVEN      a fact with NO PROBE BEHIND IT.  The colour of a lie in waiting.
       UNDECLARED    the reading found something nobody claimed

   ── THE `probe` FIELD IS THE WHOLE POINT ───────────────────────────────────
   If a claim asserts a STATE OF THE WORLD ("anon reads are blocked"), it MUST
   name the probe that proves it. No probe -> UNPROVEN -> RED.

   "DATA WATCH: verified ✓" was green in the old manifest for months.
   NO PROBE EXISTED. It was manufacturing confidence that nobody had earned.
   It is now `status: null` and it will render RED until an instrument exists.

   THAT IS NOT A REGRESSION. THAT IS THE INSTRUMENT WORKING.
   ============================================================================ */
window.FLEET_SEMANTICS = {

  __v: '2026.07',

  meta: {
    repo:   'ianingram/Amenti.live',
    live:   'https://ianingram.github.io/Amenti.live/',
    mirror: 'ianingram/Fleet-Documents',
    domain: 'amenti.ai',
    law:    'The truth lives in the ship. The documents are a reflection. ' +
            'You cannot correct a ship by painting the mirror.',
  },

  /* ── THE SHIPS ──────────────────────────────────────────────────────────
     The pages you can walk aboard. Names and berths are AUTHORED. Whether the
     file exists, and what it loads, is OBSERVED — and is not stated here.
     ──────────────────────────────────────────────────────────────────────── */
  ships: [
    { file: 'Page1.html',    name: 'The Stardust Engine',      flag: true, color: 0x00ff66,
      role: 'The flagship. The Codex hub — where the Sovereigns are mustered, the Terminal speaks, and the reading rooms open.',
      board: { col: 4, row: 0 }, grid: { gx: 0, gy: -1.2 } },

    { file: 'Page2.html',    name: 'The Sovereign Instrument', color: 0xf5d76e,
      role: 'The precision-calibration console — the helical temporal search engine at full trim. The Emerald Tablet and its four pages.',
      board: { col: 3, row: 0 }, grid: { gx: 1.6, gy: 0 } },

    { file: 'Page3.html',    name: 'Orbital HD',               color: 0xf5d76e,
      role: 'The modular command OS — the bridge display, rebuilt.',
      board: { col: 5, row: 0 }, grid: { gx: 2.7, gy: 0.9 } },

    { file: 'court.html',    name: 'The Cosmic Courtroom',     color: 0xf5d76e,
      role: 'Where the heart is weighed against the feather — the hall of the Weighing.',
      board: { col: 0, row: 0 }, grid: { gx: -1.6, gy: 0 } },

    { file: 'weighing.html', name: 'The Weighing of Caesar',   color: 0xf5d76e,
      role: 'The first trial staged in full — the ghost on the stage, awaiting its verdict.',
      board: { col: 2, row: 0 }, grid: { gx: -2.7, gy: 0.9 } },

    { file: 'docket.html',   name: 'The Docket',               color: 0xf5d76e,
      role: 'The living register of trials — the schedule that proclaims itself to a harbor not yet listening.',
      board: { col: 1, row: 0 }, grid: { gx: -1.1, gy: 1.4 } },

    { file: 'game01.html',   name: 'The War-Games Table',      color: 0xf5d76e,
      role: 'Historical 3D chess and checkers — strategy rehearsed in miniature.',
      board: { col: 6, row: 0 }, grid: { gx: 1.1, gy: 1.4 } },
  ],

  /* ── THE CREW ───────────────────────────────────────────────────────────
     Named by the station each one keeps.

     NOTE WHAT IS *NOT* HERE: no `calls`, no `loads`, no `size`, no `status`.
     The old manifest declared `amenti-chat.js calls: ['/generate']`. THERE IS
     NO /generate ROUTE. It was typed in good faith and it was never true.
     ──────────────────────────────────────────────────────────────────────── */
  crew: [
    { file: 'config.js',             name: 'The Harbormaster',        color: 0xffaa00,
      role: 'Holds the orders every hand sails from — the proxy URL, the ledger, the keys.',
      board: { col: 0, row: 2 } },

    { file: 'library.js',            name: 'The Librarian',           color: 0xffaa00,
      role: 'Opens the reading rooms, renders every stored work, and reads them aloud.',
      board: { col: 2, row: 2 } },

    { file: 'amenti-voice.js',       name: 'The Boatswain of the Voice', color: 0x00ccff,
      role: 'THE MOUTH. One engine: strip, chunk, cadence, style, schedule. Not a throttle and never was — ' +
            'the rests are the point. 0.16s at a comma, 0.38s at a sentence, 0.85s at a paragraph: a person taking breath.',
      board: { col: 5, row: 2 },
      note: 'Consolidated from four copies. The name "throttle" misled everyone, including the machines.' },

    { file: 'amenti-throttle.js',    name: 'The Retired Boatswain',   color: 0x556677,
      role: 'The former mouth. Superseded by amenti-voice.js. KEPT AS THE ROLLBACK — ' +
            'nothing is deleted on the same commit that makes it unnecessary.',
      board: { col: 5, row: 3 }, retired: true },

    { file: 'amenti-listen.js',      name: 'The Ear on Deck',         color: 0xffaa00,
      role: 'The browser-side listener — takes what is spoken and carries it below. VAD, capture, the channel, the pause.',
      board: { col: 6, row: 3 } },

    { file: 'amenti-chat.js',        name: 'The Herald of Converse',  color: 0xffaa00,
      role: 'THE CONVERSATION CORE. The state machine, the anchored window, the move tags, the Turn.',
      board: { col: 6, row: 2 } },

    { file: 'amenti-doctrine.js',    name: 'The Standing Orders',     color: 0xffaa00,
      role: 'Every conversational JUDGMENT, in one place. Registers, moves, detectors, dials, the law of the exchange. ' +
            'The mechanism should be hard to change; the judgment must be trivial to change.',
      board: { col: 7, row: 3 } },

    { file: 'amenti-probe.js',       name: 'The Probe Corps',         color: 0x57b6ff,
      role: 'Reconnaissance. Costs nothing until called. Never send a human where a probe can go — ' +
            'but the best probe in the fleet is a captain who refuses to say yes to everything.',
      board: { col: 4, row: 3 } },

    { file: 'amenti-cassiel.js',     name: 'Cassiel, Reader of Names', color: 0xffaa00,
      role: 'Reads the roster — knows every soul aboard by name, dialect and voice.',
      board: { col: 1, row: 3 } },

    { file: 'amenti-readaloud.js',   name: 'The Reciter',             color: 0xffaa00,
      role: 'The SEEKER reads the passage aloud, for Emeralds. The browser listens — free, streaming — and scores coverage. ' +
            'Its partial transcripts are the ear the Arrest was built on, and nobody knew they were there.',
      board: { col: 3, row: 3 } },

    { file: 'amenti-auth.js',        name: 'The Gatekeeper',          color: 0xffaa00,
      role: 'The sign-in ward — Supabase at the door, checking who may come aboard.',
      board: { col: 1, row: 2 } },

    { file: 'amenti-quiz.js',        name: 'The Trial-Master',        color: 0xffcc00,
      role: 'Drives the trials against the Mint.',
      board: { col: 3, row: 2 } },

    { file: 'amenti-leaderboard.js', name: 'The Purser',              color: 0xffaa00,
      role: "Keeps the weekly pool and the standings.",
      board: { col: 4, row: 2 } },

    { file: 'voiceprofiles.js',      name: 'The Choir-Master',        color: 0x556677,
      role: 'A SPEC, NOT CREW. Twenty hand-built acoustic profiles for the Parler / wave-file work, which is not built. ' +
            'It assigns no voice to anyone — the roster CSV does that. It is not loaded, and it must not be.',
      board: { col: 7, row: 2 }, spec: true,
      note: 'Written in the present tense with zero callers, it cost an entire design session. The sign is now on it.' },
  ],

  /* ── THE FLEET BEYOND THE HARBOR ────────────────────────────────────────
     Deployed straight to Cloudflare and Supabase. Off-repo — the scanner
     cannot see them, so every claim here is AUTHORED and needs a probe.
     ──────────────────────────────────────────────────────────────────────── */
  satellites: [
    { id: 'Proxy',    name: 'The Proxy',        color: 0x2bff77, type: 'worker',
      url: 'amenti-proxy.ingram-ian.workers.dev',
      role: 'The AI proxy — the chat, the voice, the transcription. THE ONLY WALL AN ATTACKER CANNOT EDIT. ' +
            'Cost Watch lives here. Every rendered clip is content-addressed in R2.',
      sky: { x: 0, y: 78, z: -46 }, grid: { gx: 0, gy: -3.2 } },

    { id: 'Mint',     name: 'The Mint · Treasury Ship', color: 0x2bff77, type: 'worker',
      url: 'amenti-mint.ingram-ian.workers.dev',
      role: 'The economy itself. Answer keys never leave the Worker; sessions are HMAC-signed; ' +
            'the clock is server-authoritative; minting is idempotent.',
      sky: { x: -34, y: 70, z: -34 }, grid: { gx: -3.4, gy: -2.2 } },

    { id: 'Supabase', name: 'The Deep Charts · Sea Floor', color: 0x2bff77, type: 'db',
      url: 'bhgnkfsatmcnhqksybpa.supabase.co',
      role: 'The bedrock beneath everything — the arguments table, the pools and ledgers, the row-level wards.',
      sky: { x: 34, y: 70, z: -34 }, grid: { gx: 3.4, gy: -2.2 } },

    { id: 'CF Email', name: 'The Dispatch Pipe', color: 0x2bff77, type: 'email',
      url: '(Workers Paid)',
      role: 'Newsletter delivery — VAL·HAL·LA / the Valhalla Chronicles.',
      sky: { x: 0, y: 64, z: 46 }, grid: { gx: 0, gy: 3.4 } },
  ],

  /* ── THE WATCHES ────────────────────────────────────────────────────────
     A THREAT is a CLAIM ABOUT THE WORLD, and a claim about the world needs an
     INSTRUMENT. `status` is NOT authored. It is DERIVED from whether the probe
     exists and what it last reported.

       probe: null   ->  UNPROVEN  ->  RED
                         Not because the watch has failed. Because NOTHING IS
                         WATCHING, and the manifest will no longer pretend it is.

     The old manifest carried  DATA WATCH: 'verified ✓ — anon reads blocked'.
     NO PROBE EXISTED. That green tick was a memory of a manual browser check
     from a session nobody can name — an unverifiable claim rendered as a
     verified fact, MANUFACTURING CONFIDENCE THAT NOBODY HAD EARNED.

     It is red now. That is the instrument working.
     ──────────────────────────────────────────────────────────────────────── */
  watches: [
    { id: 'COST WATCH',     color: 0x57b6ff, corner: 'tr',
      board: { edge: 'right' },
      guards: 'The Proxy Worker — /speak, /listen, and the chat',
      threat: 'Looping the open AI endpoints to run up the bill. A curl at /speak with a megabyte of text. ' +
              'And the one nobody saw: THE FIGURE HEARING ITSELF THROUGH THE SPEAKERS AND REPLYING TO ITSELF, ALL NIGHT.',
      probe:  'probes/probe11.mjs',
      note:   'Hard caps, a spend meter and a rate limiter, wired into the Worker. 27 attacks repelled. ' +
              'The wall sits IN FRONT of the money: a megabyte 413s and Gemini is never called.' },

    { id: 'TREASURY WATCH', color: 0x57b6ff, corner: 'tl',
      board: { edge: 'front' },
      guards: 'The Mint Worker and the emerald ledger',
      threat: 'A forged /quiz/submit minting emeralds without earning them.',
      probe:  null,
      note:   'READ AND JUDGED SOUND BY HAND: the answer keys never leave the Worker, the session is HMAC-signed, ' +
              'the clock is server-authoritative, minting is idempotent per (user, topic, question). ' +
              'ONE SOFT SPOT: /readaloud/complete TRUSTS the client\'s coverage number — bounded by a decaying ' +
              'curve and a verified identity, so low severity. ' +
              'BUT A HAND-READING IS NOT A PROBE. This is UNPROVEN until an instrument exists.' },

    { id: 'DATA WATCH',     color: 0x57b6ff, corner: 'bl',
      board: { edge: 'left' },
      guards: 'The Supabase tables and their row-level wards',
      threat: 'The public key reading private subscriber data.',
      probe:  null,
      note:   'THIS SHOWED GREEN FOR MONTHS WITH NOTHING BEHIND IT. The tick was a memory of a manual check. ' +
              'It may well be true. NOBODY HAS LOOKED. It stays red until an instrument does.' },

    { id: 'HULL WATCH',     color: 0x57b6ff, corner: 'br',
      board: { edge: 'far' },
      guards: 'File integrity across the fleet',
      threat: 'Tampering, defacement, a malicious commit.',
      probe:  null,
      note:   'A baseline of file hashes was claimed. No probe file has been found in the tree.' },
  ],

  /* ── THE ENGINES ────────────────────────────────────────────────────────
     AN ENGINE IS NOT A FILE. It is a CAPABILITY that spans files, surfaces and
     workers — and that is precisely why nobody noticed the Terminal was not
     wired for the entire life of this system:

         THERE WAS NO OBJECT IN THE MODEL WHOSE JOB IT WAS TO BE WHOLE.

     amenti-chat.js was present, correct, versioned, and tested by three hundred
     assertions. And the Terminal called it at line 6104 while the script tag sat
     at line 6865 — SEVEN HUNDRED AND SIXTY-ONE LINES TOO LATE. The guard failed
     silently. The Terminal ran an inline fallback. Every harness reported green,
     because every harness built its own object and tested THE FILE, NOT THE SYSTEM.

         BEING LOADED IS NOT BEING USED.
     ──────────────────────────────────────────────────────────────────────── */
  engines: [
    {
      id: 'conversation',
      name: 'The Conversation Engine',
      color: 0x00ccff,
      role: 'The figure hears you, thinks, and speaks. Everything else in this fleet is scaffolding for it.',

      members: ['amenti-chat.js', 'amenti-listen.js', 'amenti-voice.js', 'amenti-doctrine.js'],
      workers: ['Proxy'],

      /* The chain, end to end. AUTHORED — this is the shape of the thing, not a
         fact about the tree. The scanner confirms the MEMBERS exist and are
         wired; it cannot know what they are FOR. */
      chain: {
        out:  ['text', 'strip (plainText)', 'chunk (320)', 'cadence (the rests)',
               'style (dialect + voice + register)', 'POST /speak', 'schedule (WebAudio)', 'sound'],
        in:   ['mic (getUserMedia)', 'VAD (RMS per frame)', 'capture (WAV 16k)',
               'POST /listen', 'transcript', 'is it a turn?', 'send'],
        turn: ['payload (the anchored window)', 'the move tag', 'parse + STRIP the tag',
               'render', 'speak', 'the mic re-arms'],
      },

      contracts: [
        'Amenti.chat.create({ figure, context, mic, render, speak, stopSpeaking })',
        'Amenti.listen.start({ onText, onState, onPartial, onRoom, monitor, autoStop })',
        'Amenti.voice.speak(text, { figure, register, move, profile, onDone })',
        'Amenti.doctrine.{ REGISTERS, MOVES, DETECT, DIALS, LAW }',
      ],

      /* An INVARIANT is a claim that must hold or something breaks. Each one
         names the probe that holds it. AN INVARIANT WITH NO PROBE IS A PRAYER. */
      invariants: [
        { claim: 'The load order: every module is loaded BEFORE the code that calls it at parse time.',
          probe: 'tools/scan.js  +  probes/probe15.js',
          cost:  'THE TERMINAL BUG. The core loads and nothing calls it. Silent. Total.' },

        { claim: 'The /speak cache key is sha256(model + voice + STYLE + TEXT). ' +
                 'composeStyle, chunkText and plainText are byte-identical across every engine.',
          probe: 'probes/probe7.js  +  probes/probe17.js',
          cost:  'Move a byte and EVERY CLIP IN R2 BECOMES AN ORPHAN. You pay to render the archive again.' },

        { claim: 'The payload is bounded. The transcript is whole; the bill is not.',
          probe: 'probes/probe.js  +  probes/probe2.js',
          cost:  '$118.84 for a 500-turn conversation — the entire monthly cap, in one session.' },

        { claim: 'The mic flags gate the HARDWARE, not merely the reaction to it. ' +
                 'With arrest:false, SpeechRecognition is never constructed.',
          probe: 'probes/probe12.js',
          cost:  'A switch that does not switch anything is worse than no switch: it makes you believe you are safe.' },

        { claim: 'The figure will not reply to its own voice.',
          probe: 'probes/probe13.js  +  probes/probe16.js',
          cost:  'An unbounded, hands-free, overnight cost loop with no human in it. ' +
                 'Precisely the curl attack — except the attacker is the product.' },
      ],

      guards: [
        { name: 'The mouth cap',        against: 'The seeker choosing the text. A figure that will say anything you give it is a deepfake engine wearing Caesar\'s name.' },
        { name: 'The recite whitelist', against: 'Reading the seeker\'s words back. It may read from the DOCUMENT; never from the seeker.' },
        { name: 'The loop-breaker',     against: 'The figure hearing itself and replying to itself. All night. On your key.' },
        { name: 'The hands-free budget', against: 'A conversation with no natural end. Twelve voice turns, and the audience closes. §10.' },
        { name: 'The self-closing ear', against: 'A forgotten tab listening forever. 45s idle; a 5-minute hard ceiling.' },
        { name: 'The repair loop',      against: 'Blaming the seeker for OUR deafness. The old ladder EJECTED a human for owning a television.' },
        { name: 'The Threshold',        against: 'Cutting the figure off mid-word on the FIRST SENTENCE ANYONE EVER HEARS.' },
        { name: 'Cost Watch',           against: 'Everything above living in the browser — which is the attacker\'s machine.' },
      ],

      /* The findings that have already been paid for. Do not rediscover them. */
      traps: [
        'BEING LOADED IS NOT BEING USED. termChat was null for the life of the system.',
        'A test that creates its own object tests the object — NOT the system. Fourteen harnesses, all green, all blind.',
        'historyCap says "turns" and counts MESSAGES. Read the CODE, not the comment.',
        '"push-to-talk: deliberate" was a LIMITATION described as a design. armMic never passed autoStop.',
        'The microphone is not a keyboard. A keyboard is DELIBERATE; a microphone is AMBIENT, and it is untrusted.',
        'Base TTS latency is ~16-18s REGARDLESS OF CHUNK SIZE. The archive is why the reading room feels instant. THE COUNSEL IS NEVER CACHED.',
      ],
    },

    /* Declared so the fleet can SEE that they are undeclared. An engine with no
       definition is a capability nobody has taken responsibility for. */
    { id: 'game',    name: 'The Game Engine',    color: 0xf5d76e, members: ['game01.html'],
      role: 'Historical 3D chess and checkers. NOT YET DEFINED.', undefined: true },

    { id: 'economy', name: 'The Economy Engine', color: 0x2bff77, members: ['amenti-quiz.js', 'amenti-leaderboard.js', 'amenti-readaloud.js'],
      workers: ['Mint', 'Supabase'],
      role: 'Trials, emeralds, the pool, the verdicts. NOT YET DEFINED.', undefined: true },

    { id: 'court',   name: 'The Court Engine',   color: 0xf5d76e, members: ['court.html', 'weighing.html', 'docket.html'],
      role: 'The Weighing. NOT YET DEFINED — and it must NOT reuse the Conversation Engine. ' +
            'A trial is adversarial: it is nothing but questions, nothing but "why", and it IS a gotcha. ' +
            'The Speech Doctrine would make a catastrophic prosecutor. Not badly implemented — INVERTED.',
      undefined: true },
  ],

  /* ── THE DOCTRINE ───────────────────────────────────────────────────────
     Unfalsifiable by construction. AUTHORED, and safe.
     ──────────────────────────────────────────────────────────────────────── */
  doctrine: [
    'The truth lives in the ship. The documents are a reflection.',
    'You cannot correct a ship by painting the mirror.',
    'A mirror with a memory is a portrait.',
    'Probe first. Never guess. Guessing added work. Looking removed it. Every single time.',
    'The probe that reports green without looking is worse than no probe. A lie with a light on it.',
    'BEING LOADED IS NOT BEING USED.',
    'A test that creates its own object tests the object. It does not test the system.',
    'A document cannot report its own falsity. That is what a document IS.',
    'Read the CODE, not the comment. The prose was written honestly and became false as the fleet sailed.',
    'A test that mocks the environment can only confirm what you already believed about it.',
    'node --check catches syntax, not runtime.',
    'A switch that does not switch anything is worse than no switch. It makes you believe you are safe.',
    'A guard that prevents its own upgrade is a lock on the inside.',
    'Mechanism and judgment are different substances. Consolidate one and you will scatter the other.',
    'Learning a lesson is not the same as installing it.',
    'Nothing is deleted on the same commit that makes it unnecessary.',
    'A flaky test teaches you to ignore red.',
    'VERIFY, OR THE SILENCE WILL LIE TO YOU.',
    'The finding you were not looking for is the finding.',
    'A commit that makes the manifest lie does not merge.',
    'Claim as little as possible. Every fact you type is a fact that can rot.',
    'Probes are spent; the captain is not — and the best probe in the fleet is a captain who refuses to say yes to everything.',
  ],
};
