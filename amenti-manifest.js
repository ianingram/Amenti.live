/* ============================================================================
   amenti-manifest.js  ·  Ingram Manor LLC
   THE MUSTER ROLL — declared. Not described.
   ----------------------------------------------------------------------------
   ships-manifest.html is the ship's COLORS: prose, character, the fleet's own
   account of itself. Keep it. It is the culture, and it is worth more than this
   file.

   THIS is the roll the PROBE reads.

   ── WHY BOTH ───────────────────────────────────────────────────────────────
   A manifest nobody can check becomes voiceprofiles.js: confident, written in
   the present tense, and quietly wrong. The prose manifest said, in good faith:

     "voiceprofiles.js holds, quietly, AMENTI_CHARS — the curated Sovereigns.
      He assigns every soul its voice."

   It holds no such thing (that line is a COMMENT pointing at Page1), and it
   assigns nothing (ZERO callers). It also said amenti-throttle.js was "the
   unified cadence for ALL speech" — there are FOUR speech engines. And it
   mustered amenti-worker-listen.js, which is not in the hold at all.

   Every one of those was written honestly and became false as the fleet sailed.
   That is not a failure of the writer. IT IS WHAT PROSE DOES.

       THE MANIFEST DECLARES.  THE PROBE VERIFIES.  THE DIFF IS THE FINDING.

   Amenti.probe.muster() reads this file, looks at what is ACTUALLY aboard, and
   reports the four things that matter:

     MISSING     declared, never sailed
     STOWAWAY    aboard, on no roll          (this is how AMENTI_VOICE hid)
     ADRIFT      aboard, zero callers        (this is voiceprofiles.js)
     TWO CAPTAINS  one station, several ships (this is FOUR TTS engines)
   ============================================================================ */
(function () {
  'use strict';
  var Amenti = (window.Amenti = window.Amenti || {});
  if (Amenti.manifest && Amenti.manifest.__v) return;

  Amenti.manifest = {
    __v: '2026.07',

    /* ── THE SHIPS OF THE LINE ─────────────────────────────────────────── */
    ships: [
      { file: 'Page1.html', name: 'The Stardust Engine',      station: 'flagship · the Codex, the Terminal, the reading rooms' },
      { file: 'Page2.html', name: 'The Sovereign Instrument', station: 'precision console · the helical temporal search' },
      { file: 'Page3.html', name: 'Orbital HD',               station: 'the modular command OS' },
      { file: 'court.html', name: 'The Cosmic Courtroom',     station: 'the Weighing' },
      { file: 'weighing.html', name: 'The Weighing of Caesar', station: 'the first trial staged in full' },
      { file: 'docket.html', name: 'The Docket',              station: 'the living register of trials' },
      { file: 'game01.html', name: 'The War-Games Table',     station: 'strategy in miniature' }
    ],

    /* ── THE CREW ──────────────────────────────────────────────────────────
       global   the name it hoists on deck — how the probe knows it is aboard
       station  the duty it actually stands
       needs    what must already be aboard, or it cannot sail
       surfaces where it is expected. '*' = wherever it is loaded.
       ────────────────────────────────────────────────────────────────────── */
    crew: [
      { file: 'config.js',           name: 'The Harbormaster',      global: 'AMENTI_CONFIG',
        station: 'holds the proxy URL and the ledger. Every hand sails from her orders.' },

      { file: 'amenti-chat.js',      name: 'The Herald of Converse', global: 'Amenti.chat',
        station: 'THE CONVERSATION CORE. One brain, two surfaces — the Terminal AND the Figures.',
        provides: ['create', '__v'], needs: [] },

      { file: 'amenti-listen.js',    name: 'The Ear on Deck',        global: 'Amenti.listen',
        station: 'voice-in. Capture, VAD, partials, the channel.',
        provides: ['start', 'stop', 'cancel', 'channel', '__v'], needs: [] },

      { file: 'amenti-throttle.js',  name: 'Boatswain of the Voice', global: 'Amenti.throttle',
        station: 'TTS. Chunked, streaming, cancellable. THE CACHE KEY LIVES HERE.',
        provides: ['speak', 'stop', 'resolveVoice'],
        warn: 'NOT the only speech engine. library.js, Page2 and AMENTI_VOICE each carry their own.' },

      { file: 'amenti-voice.js',     name: 'The Consolidated Voice', global: 'Amenti.voice',
        station: 'ONE TTS engine. Facades over Amenti.throttle and the counsel speaker.',
        provides: ['speak', 'stop', 'chunk', 'REGISTERS', '__v'],
        optional: true, note: 'Replaces amenti-throttle.js. Ship only when X-Amenti-Cache says hit.' },

      { file: 'amenti-probe.js',     name: 'The Probe Corps',        global: 'Amenti.probe',
        station: 'reconnaissance. Costs nothing until called. Never send a human where a probe can go.',
        provides: ['state', 'wall', 'muster', 'full'] },

      { file: 'library.js',          name: 'The Librarian',          global: 'Amenti.openReadingRoom',
        station: 'the reading rooms.',
        warn: 'Carries its OWN copy of the speech engine. Not a caller of Amenti.throttle — a DUPLICATE of it.' },

      { file: 'amenti-cassiel.js',   name: 'Cassiel, Reader of Names', global: null,
        station: 'reads the CSV roster — knows every soul aboard by name.' },

      { file: 'amenti-auth.js',      name: 'The Gatekeeper',         global: 'amentiAuth',
        station: 'Supabase at the door.' },

      { file: 'amenti-quiz.js',      name: 'The Trial-Master',       global: null,
        station: 'the trials, against amenti-mint.' },

      { file: 'amenti-readaloud.js', name: 'The Reciter',            global: 'amentiReadAloud',
        station: 'the seeker reads ALOUD for emeralds. Uses the browser recogniser — FREE, and it streams partials.',
        note: 'This is where the Arrest found its ear. It was here the whole time.' },

      { file: 'amenti-leaderboard.js', name: 'The Purser',           global: 'amentiLeaderboard',
        station: 'the weekly pool.' },

      { file: 'voiceprofiles.js',    name: 'The Choir-Master',       global: 'AMENTI_VOICE_PROFILES',
        station: 'A SPEC. Not infrastructure. Target state for the Parler / wave-file work.',
        adrift: true,
        warn: 'ZERO CALLERS, and it must NOT be loaded. It assigns no voice to anyone — the CSV roster does that. ' +
              'Loaded in the present tense with no callers, it cost a whole design session, which built a prosody ' +
              'architecture for a TTS engine this fleet does not run.' }
    ],

    /* ── THE FLEET BEYOND THE HARBOR ───────────────────────────────────── */
    beyond: [
      { file: 'amenti-proxy (Cloudflare)', name: 'The Proxy',
        station: '/ (chat) · /speak (Gemini TTS) · /listen (Gemini STT) · /atlantica · /week',
        note: 'THE ONLY WALL AN ATTACKER CANNOT EDIT. Cost Watch lives here. Cache key = sha256(model+voice+style+text).' },
      { file: 'amenti-mint (Cloudflare)', name: 'The Mint · Treasury Ship',
        station: 'the economy. /quiz/* · /readaloud/* · /arguments/* · /pool/*',
        note: 'Sound. Answer keys never leave the Worker; sessions are HMAC-signed; the clock is server-authoritative; ' +
              'minting is idempotent. One soft spot: /readaloud/complete TRUSTS the client\'s coverage number — ' +
              'bounded by a decaying curve and a verified identity, so low severity.' },
      { file: 'Supabase migrations', name: 'The Deep Charts',
        station: 'arguments, pools, ledgers, row-level wards.' }
    ],

    /* ── STATIONS THAT MUST HAVE EXACTLY ONE CAPTAIN ────────────────────── */
    stations: {
      'speech-out': {
        should: 'amenti-voice.js',
        actual: ['library.js', 'amenti-throttle.js', 'Page2.html (inline)', 'AMENTI_VOICE (inline in Page1)'],
        finding: 'FOUR ENGINES on one endpoint. And the chunk boundaries ARE the cache key — 320 here, 700 on ' +
                 'Page2 — so the same essay hashes differently on different surfaces and the archive is rendered ' +
                 'more than once. Nobody was ever billed a line item for it.'
      },
      'conversation': { should: 'amenti-chat.js', actual: ['amenti-chat.js', 'Page1.html (inline fallback)'], ok: true },
      'speech-in':    { should: 'amenti-listen.js',
        actual: ['amenti-listen.js (paid, batch)', 'amenti-readaloud.js (FREE, streaming)'],
        finding: 'Two ears, and that is CORRECT — but nobody knew the free one streamed partials, which is the ' +
                 'only thing that makes the Arrest possible.' }
    },

    /* ── THE ROLL OF SOVEREIGNS ────────────────────────────────────────── */
    sovereigns: {
      roll: 'AMENTI_CHARS',
      declaredIn: 'Page1.html',
      warn: 'AMENTI_CHARS is defined THREE TIMES in Page1.html (lines 3277, 5464, 5795). Byte-identical today — ' +
            '~61KB of the same roster shipped three times — but the LAST one silently wins. Edit one and the fleet ' +
            'sails out of step with itself. The prose manifest warned of exactly this and named the wrong holds.',
      voicesClaim: 'voiceprofiles.js: "Keys map 1:1 to window.AMENTI_CHARS[].key"',
      voicesTruth: 'FALSE. 23 Sovereigns, 20 voices. cleopatra, musashi and ingram have NO voice profile at all.',
      note: 'Leif Erikson is not on this roll. He sails from the CSV roster on Page2 — which is why he sounds like ' +
            'a Norseman. The file you thought gave him his voice has never been read by anything.'
    },

    /* ── STANDING ORDERS ───────────────────────────────────────────────── */
    doctrine: [
      'Probe first. Never guess.',
      'The probe that reports green without looking is worse than no probe. A lie with a light on it.',
      'Every probe returns one hundred times the datum it was sent for.',
      'The finding you were not looking for is the finding.',
      'Never send a human where a probe can go. Probes are spent; the captain is not.',
      'A probe that corrects itself is worth more than one that is never wrong.',
      'Honour existing conventions. Read the CODE, not the comment — historyCap said "turns" and meant messages.',
      'Verify, or the silence will lie to you.',
      'Never fake data. Where a thing is not yet built, say so.',
      'node --check catches syntax, not runtime. Ian renders and reports.'
    ]
  };

  console.log('%cAmenti.manifest ready — Amenti.probe.muster() to check it against the fleet', 'color:#999');
})();
