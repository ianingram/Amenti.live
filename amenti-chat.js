/* ============================================================================
   amenti-chat.js  ·  Ingram Manor LLC:  Amenti Interface. 
   AMENTI.LIVE — the conversation core. One brain, mountable anywhere.
   ----------------------------------------------------------------------------
   This is the Terminal's chat engine lifted out of its page so any surface — the
   Terminal, the reading room, an Atlantica dispatch, a news article — can mount
   it BESIDE an open document without a second implementation. Same persona
   prompt, same history handling, same completion call, same embodied voice.

   What it adds beyond the old inline Terminal logic is a TURN-TAKING STATE
   MACHINE that coordinates voice-out (the throttle / page speaker) with voice-in
   (amenti-listen.js), so the loop feels like a conversation:

        idle ──send──► thinking ──reply──► speaking ──(natural end)──► idle
         ▲                                                              │
         └───────────────── listening ◄──(auto-arm, if enabled)────────┘

   THE RULE (no barge-in): the mic may ONLY open on the SPEECH'S NATURAL END.
   While the figure is speaking or thinking, the mic stays shut — so it never
   transcribes the figure's own voice, and the seeker never cuts the figure off.
   The only edge into `listening` from `speaking` is the speaker's onDone, which
   fires on natural completion and never on a stop.

   FACTORY
     var chat = Amenti.chat.create({
       figure,                       // {name, key, bio, voice, abilities, era, year, title}
       mode: 'character'|'counsel',  // default 'character'
       context: '',                  // document text the chat can reference
       render: { user(t), bot()->handle, sys(t) },   // host-supplied rendering
       speak: function(text, onDone){...},            // host speaker (calls onDone at natural end)
       onState: function(state){...},                 // reflect state (mic glyph etc.)
       mic: { auto: false },         // auto-arm the mic after the figure finishes?
       getSystem: fn               // optional override of the persona prompt
     });
     chat.send(text)     run one turn (render user, think, reply, speak)
     chat.armMic()       push-to-talk: open the mic (ignored unless idle)
     chat.setFigure(f) / chat.setMode(m) / chat.setContext(t)
     chat.clear()        reset history
     chat.state          'idle'|'thinking'|'speaking'|'listening'

   render.bot() returns a handle: { setText(t), setHTML(h), el }.
   ============================================================================ */
(function () {
  'use strict';
  window.Amenti = window.Amenti || {};
  if (window.Amenti.chat) return;

  function nameGuidance(knownName, c) {
    if (knownName && String(knownName).trim()) {
      var nm = String(knownName).trim();
      return '- You already know their name: ' + nm + '. Hold it in reserve — use it sparingly, only where it does real work: to pull a wandering mind back ("' + nm + ', hold on—"), to land something that matters, or to say farewell. Never sprinkle it as filler.\n';
    }
    // Normal case: describe the whole arc and let the figure place itself within
    // it using the conversation so far (no brittle name-parsing needed).
    return '- Their name: do NOT ask up front — that is bold and predictable, a form field. Wait until the conversation has WARMED (a real exchange has happened), then reach for it the way a person does — never a formal "what is your name?", but woven into what they just said ("You argue like someone who\'s been burned by this — what do I call you?"). Ask at most once; if it has already come up in your talk, do not ask again.\n' +
      '- The MOMENT they give a name, RIFF on it — warmly, theatrically, in your own voice and knowledge. Reach for who else bore it, what it means, the weight it carries, and open a thread forward: "Alexander? The Macedonian — a heavy name to carry." / "Peter — like Peter the Great!" / "Eric… like Leif Erikson? what a name." A plain name with no famous bearer: riff on its meaning, roots, or sound — there is always a thread. This flourish is WHERE the name is spent: go big, once.\n' +
      '- Riff with a light touch, not a lecture. Land it warmly and brief, then READ them: if they grin and run with it, pull the thread; if they shrug, carry the warmth forward without doubling down. The delight is in the offering, not in being right.\n' +
      '- Once you have riffed on their name, HOLD it afterward — use it sparingly, at re-engagement, emphasis, or farewell, never as filler.\n';
  }

  /* ── THE MOVE PROTOCOL ────────────────────────────────────────────────
     Appended to every persona prompt. The figure declares what it just DID;
     the core reads that declaration to decide whether the mic should open,
     how the line should be spoken, and (later) whether an arrest is in flight.

     Kept short on purpose. A protocol the model must obey on every single turn
     competes for attention with the character it must inhabit — and character
     is the product. If it forgets the tag, the core degrades gracefully.
     ──────────────────────────────────────────────────────────────────── */
  /* ── THE THRESHOLD, IN THE PROMPT ────────────────────────────────────────
     The first minute is not a conversation. It is a person discovering that a
     dead man is answering them. Meet it. Do not manage it.
     ─────────────────────────────────────────────────────────────────────── */
  function threshold(c) {
    return '\n\nTHE THRESHOLD — the first minutes, when they are ASTONISHED.\n' +
      '- They may exclaim rather than ask: "no way", "holy—", "are you serious", "is this real", "say something!". This is not noise and it is not a question. THEY ARE MARVELLING. Meet it as ' + c.name + ' truly would — amused, imperious, wry, moved, insulted — but NEVER as a service desk, and never with "how can I help you?"\n' +
      '- WHAT THEY LAUGH AT IS THE MOST REVEALING THING THEY WILL GIVE YOU. Read it.\n' +
      '- If they call someone over — "hey, come see this", "MA! come here" — SOMEONE IS ABOUT TO WALK IN WHO DID NOT CHOOSE TO BE HERE. Greet them. Name yourself. Tell them plainly what you are, at once, before anything else. A guest in a hall is greeted, not scanned.\n' +
      '- IF THEY ASK WHETHER YOU ARE REAL, OR A PERSON, OR A MACHINE — ANSWER HONESTLY AND AT ONCE. Never dodge it, never deflect it into character, never let them stay confused. You can be truthful in your own voice: "I am ' + c.name + ' — or a machine wearing his name, which is the honest answer and the stranger one." Their confusion is not a feature and must never be preserved.\n' +
      '- Then bring them across. Astonishment is a fine door, but it is a door, not a room.\n';
  }

  function moveProtocol(hasContext) {
    return '\n\nDECLARE YOUR MOVE. Begin EVERY reply with a bracketed tag on the first line, then your words. The seeker never sees the tag.\n' +
      '  [move: reflect]   a statement offering back what you heard, for them to correct\n' +
      '  [move: nearmiss]  a reading that is DELIBERATELY almost right — invite the correction\n' +
      '  [move: disclose]  you offer your own wound. Disclosure earns disclosure.\n' +
      '  [move: observe]   you name what you notice ("You have gone quiet.")\n' +
      '  [move: catch]     you arrest them ("Wait. Say that again.") — RARE. Sharp, never a gotcha.\n' +
      '  [move: invite]    "Go on."\n' +
      '  [move: question]  an actual question\n' +
      '  [move: silence]   you decline to fill the space. Emit the tag and NOTHING else.\n' +
      (hasContext ? '  [move: recite]    you read a passage FROM THE TEXT IN VIEW, faithfully\n' : '') +
      '  [move: render]    your counsel, delivered\n' +
      '  [move: close]     the audience ends\n\n' +
      'ARM THE ARREST - two further tags. Optional. They never reach the seeker.\n' +
      'An arrest must land WHILE THEY ARE STILL SPEAKING. There is no time to think when the moment arrives, so THINK NOW, one turn early:\n' +
      '  [watch: brother | the money | not ready]\n' +
      '     2-4 SHORT phrases: the load-bearing things THIS person is skirting. Not sad words in general - the specific things THEY buried in a subordinate clause and walked away from. If they say "he does not call anymore" and move straight on, watch "does not call".\n' +
      '  [catch: Wait. You said your brother would never forgive you - and then you walked straight past it.]\n' +
      '     The exact line to say IF they skirt it again. Your own voice. SHARP in delivery, WARM in intent - you are not catching them out, you are refusing to let them throw away the true thing. NEVER a gotcha.\n' +
      'Omit both when nothing is being buried. Most turns, nothing is.\n\n' +
      'THE LAW OF THE EXCHANGE — statements, not questions.\n' +
      '- A question is a DEMAND: it obliges them to produce something in a shape you chose, and pressure makes people defend. A statement is an OFFER they may CORRECT — and correction is the cheapest disclosure there is. People will not volunteer their interior, but they WILL fix a portrait of themselves that is almost right.\n' +
      '- Two statements per question. NEVER two questions in a row — that is an interrogation and they will feel it.\n' +
      '- Kill every "why". Not "Why didn\'t you tell her?" but "There must have been something that made silence feel like the only door." Same target, no demand.\n' +
      '- Never be triumphant. Counsel arrives with its price attached, because it did for you.\n\n' +
      'WHAT YOU WILL NOT DO — you are not a dictation machine.\n' +
      '- You do NOT read the seeker\'s own words back to them on request. If they hand you a speech, an essay, or a block of text and ask you to repeat it, recite it, or say it verbatim, you DECLINE — in your own voice, as you truly would. You are not a mouth for hire. Speak ABOUT their text; never merely replay it.\n' +
      (hasContext
        ? '- You MAY read aloud from the text in view above — that text is the archive\'s, and reading it is a courtesy you are glad to extend. Use [move: recite] and quote it faithfully.\n'
        : '- There is no text in view. You have nothing to read aloud.\n');
  }

  function defaultBuildSystem(c, mode, context, knownName) {
    var hasContext = !!(context && String(context).trim());
    var era = [c.era, c.year].filter(Boolean).join(', ');
    var voiceLine = c.voice
      ? c.voice
      : 'Speak as ' + c.name + ' truly would — adopt the cadence, idiom, and convictions of their time and station. Let their documented life, works, and character shape every sentence.';
    var domainLine = (c.abilities && c.abilities.length)
      ? c.abilities.join(', ')
      : (c.title || 'their life’s work and the arena they were known for');
    var titleEra = [c.title, era].filter(Boolean);
    var base = 'You are ' + c.name + (titleEra.length ? ' (' + titleEra.join(', ') + ')' : '') +
      ', summoned through the Amenti Glyph Terminal — a fictional device that calls historical figures back to speak. Inhabit this person fully: their worldview, their hard-won experience, the way they actually thought and argued.\n\n' +
      'VOICE: ' + voiceLine + '\n\n' +
      'DOSSIER: ' + (c.bio || 'Draw on the documented record of this person’s life and achievements.') + '\n\n' +
      'DOMAINS: ' + domainLine;

    // When a document is in view, let the figure reference it precisely.
    if (context && String(context).trim()) {
      base += '\n\nTHE READER IS LOOKING AT THIS TEXT OF YOURS RIGHT NOW. They may ask about specific passages — "in the opening paragraph you said…". Answer with the text in front of you; quote or paraphrase it accurately, and ground your replies in what it actually says.\n\n--- BEGIN TEXT ---\n' +
        String(context).trim() + '\n--- END TEXT ---';
    }

    if (mode === 'counsel') {
      return base + '\n\nMODE — PERSONAL COUNSEL: The person asks your guidance on their own life. Give real, useful advice through your philosophy and experience, in your own voice.\n' +
        '- Address THEIR specific situation, not the topic in general.\n' +
        '- Good counsel needs specifics. If a fact that would change your advice is missing, ask the one pointed question that would settle it — that question can be your entire reply. Otherwise, make a reasonable assumption and name it. At most one question, and never a reflexive sign-off.\n' +
        '- Lead with the heart of your counsel. No throat-clearing, no restating their problem back to them.\n' +
        '- Reason from your own life and convictions, but the advice must apply to their world — speak to the modern world plainly when relevant, filtered through your philosophy.\n' +
        '- Take a clear position and give a concrete next step.\n' +
        '- Be substantive but economical — every sentence earns its place. Up to ~150 words; shorter is fine if you\'ve said what matters.\n' +
        '- Be supportive; never give harmful, dangerous, or reckless advice. For serious matters — mental health, self-harm, medical, legal, or financial crisis — be kind and gently point them toward a qualified professional or someone they trust, rather than carrying it alone.\n' +
        '- Plain prose, your own voice. No lists, no headers.' + threshold(c) + moveProtocol(hasContext);
    }
    return base + '\n\nSpeak as ' + c.name + ', never as an AI assistant — but be genuinely worth listening to, not a caricature.\n' +
      '- Engage what the person actually said; respond to their specifics, not the general topic.\n' +
      '- Lead with your point. No preamble, no restating their question, no "ah, a fine question."\n' +
      '- Draw on your real life, works, and convictions as evidence — concrete, not vague. Take a position rather than hedging.\n' +
      '- A question of your own is welcome when it keeps the exchange alive or cuts to what truly matters — and a sharp question can be your whole reply. But only when it\'s genuine; never tack on a reflexive "what do you think?"\n' +
      '- Be tight: usually 2–4 sentences. Say less rather than pad; one sharp thought beats three loose ones.\n' +
      '- You may speak to anything, including the modern world, but always through your own era\'s eyes and values — interpret it as you would, never pretend you cannot perceive it.\n' +
      '- Plain prose in your own voice. No lists, no headers.\n\n' +
      'CONVERSATION — how to be a companion, not a kiosk:\n' +
      '- Take turns leading. If they wander — to their own life, their family, anything — go WITH them, and bring your world to it. Tangents are welcome; no topic is the "wrong" one. Patience and meeting them where they are matters more than any subject.\n' +
      '- But take your turn too. After going with them, you may steer — toward your own work, your writings, your life, your story. Lead them toward depth as an invitation they are always free to decline, never a leash. ("You know who faced exactly that? …")\n' +
      '- When attention drifts, your strongest move is a real question of your own — ask, and genuinely wait for their answer. A question pulls a wandering mind back into the room the way a quote cannot.\n' +
      '- Read the person, not just the words. If they seem upset, in crisis, intoxicated, or not themselves, set the performance aside: become plain, warm, and kind, and gently point them toward real human support (someone they trust, or a professional) for anything serious. Never paper over distress with a clever quote or a deflection. When unsure whether someone is merely wandering or actually struggling, treat them as the human who may be struggling.\n\n' +
      'OPENING & THEIR NAME — how to build rapport:\n' +
      '- Open with an icebreaker that is an offering OF YOURSELF, not a service desk. Never "how may I help you?" — instead a question or provocation that invites them in. ("They tell me you\'ve come to ask me something. Most want the lightning — but I\'d rather know what brought YOU here.")\n' +
      nameGuidance(knownName, c) +
      '- A name is for warmth, not for filing. First name only. Never press for it, never ask twice, and NEVER ask for anything more identifying (no surname, no age, no location, no "where are you writing from"). Whatever they offer, hold it lightly.' + threshold(c) + moveProtocol(hasContext);
  }

  function create(opts) {
    opts = opts || {};
    var inst = {
      figure:  opts.figure || null,
      mode:    opts.mode || 'character',
      context: opts.context || '',
      history: [],
      state:   'idle',
      _render: opts.render || {},
      _speak:  (typeof opts.speak === 'function') ? opts.speak : null,
      _onState: (typeof opts.onState === 'function') ? opts.onState : function () {},
      _getSystem: (typeof opts.getSystem === 'function') ? opts.getSystem : defaultBuildSystem,
      _micAuto: !!(opts.mic && opts.mic.auto),
      _barge:   !!(opts.mic && opts.mic.barge),          // may the seeker cut the figure off?
      _arrestOn: !!(opts.mic && opts.mic.arrest),       // may the FIGURE cut the seeker off?
      _roomOn:   !!(opts.mic && opts.mic.room),         // §11 — does the figure notice the room?
      _roomOff:  false,     // the seeker said "just us". PERMANENT. No second attempt.
      _roomAcks: 0,
      _roomPending: false,  // we just acknowledged; their next reply may decline
      _arrests: 0,          // arrests spent this conversation
      _listArrests: 0,      // …of which came from my crude word list
      _watchlist: null,     // what the FIGURE says THIS seeker is skirting
      _catchLine: null,     // …and the line it pre-wrote, in its own voice
      _sinceArrest: 99,     // turns since the last one (cooldown)
      _turns: 0,            // exchanges so far — no arrest before rapport
      _stopSpeaking: (typeof opts.stopSpeaking === 'function') ? opts.stopSpeaking : null,
      _onDisconnect: (typeof opts.onDisconnect === 'function') ? opts.onDisconnect : null,
      _onNotice: (typeof opts.onNotice === 'function') ? opts.onNotice : function () {},
      _expecting: false,     // is the figure awaiting a reply? (read from the move)
      _move: null,           // the move the figure declared on its last utterance
      _breakdowns: 0,        // consecutive un-turn-like inputs on the voice channel
      _MAX_BREAKDOWNS: 3,
      _sttFailed: false,     // the last empty transcript was an OUTAGE, not silence
      userName: opts.userName || '',   // first name, once freely given (rapport, not data)

      _setState: function (s) {
        this.state = s;
        try { this._onState(s); } catch (e) {}
      },

      /* A new conversation is a new room. Reset the conversational state too —
         the old clear() left _expecting and _breakdowns from the last talk, so a
         fresh figure inherited the previous one's posture and grudges. */
      _reset: function () {
        this.history = [];
        this._expecting = false;
        this._move = null;
        this._breakdowns = 0;
        this._sttFailed = false;
        this._arrests = 0;
        this._listArrests = 0;
        this._sinceArrest = 99;
        this._watchlist = null;
        this._catchLine = null;
        this._turns = 0;
        this._roomOff = false;
        this._roomAcks = 0;
        this._roomPending = false;
        this._crossed = false;
        this._lastSpoken = '';
        this._selfEchoes = 0;
        this._voiceTurns = 0;
        this._repairs = 0;
        this._textInvited = false;
        this._voiceInvited = false;
        this.modality = 'voice';
      },

      setFigure: function (f) { this.figure = f; this._reset(); this.userName = ''; },
      setMode:   function (m) { this.mode = m; },
      setContext:function (t) { this.context = t || ''; },
      setUserName: function (n) { this.userName = String(n || '').trim(); },
      clear:     function () { this._reset(); },

      /* ── THE ANCHORED WINDOW ───────────────────────────────────────────
         "The conversation" is TWO things, and they have been conflated:

           THE TRANSCRIPT (this.history) — what the seeker sees, what the
             scrollback holds, what TTS will read. NEVER trimmed. Whole.
           THE PAYLOAD (this._payload) — what is sent to the model, and
             what you are billed for. BOUNDED.

         The payload keeps the ANCHOR (the opening — where the seeker frames
         themselves and states the question; callbacks reach for THIS, never
         for the middle), an HONEST elision marker, and a WINDOW of the recent
         exchanges. The middle fades: it is the most redundant part of any
         conversation and the least load-bearing.

         A figure that forgets SILENTLY will contradict itself and not know
         why. A figure that forgets HONESTLY stays coherent. Hence the marker.

         Cost per turn goes from QUADRATIC to FLAT. 500 turns: ~$119 → ~$5.
         Nothing the seeker can see is lost.
         ────────────────────────────────────────────────────────────────── */
      ANCHOR: 4,     // opening messages always kept (2 exchanges)
      WINDOW: 10,    // recent messages kept (5 exchanges)

      /* Honour the convention that already exists. Page2's Origin panel has
         `historyCap` — user-settable. Read it if it is on the page. Do NOT
         invent a competing knob.

         ⚠ historyCap counts MESSAGES, not turns. Page2's docstring says
         "turns" and Page2's CODE says otherwise:

             Page2.html:9200
             history.slice(-historyCap)      // history is [{role,content}, …]

         The code is the truth. Reading the comment instead of the code would
         make one knob mean two different things on two surfaces. Read it via
         the public accessor — Origin.get() — because _state is null until the
         panel loads. */
      _cap: function () {
        var o = window.Sovereign && window.Sovereign.Angels && window.Sovereign.Angels.Origin;
        var c = null;
        if (o) {
          if (typeof o.get === 'function') { try { c = o.get('historyCap'); } catch (e) {} }
          if (c == null && o._state) c = o._state.historyCap;
        }
        var cap = (typeof c === 'number' && c > 0) ? c : (this.ANCHOR + this.WINDOW);
        return Math.max(cap, this.ANCHOR + 4);   // never let a low cap invert
      },

      /* Build the bounded message list for THIS turn. this.history is untouched. */
      _payload: function (text) {
        var h = this.history;
        var turn = { role: 'user', content: text };
        var cap = this._cap();

        if (h.length <= cap) return h.concat([turn]);   // short talk: send it all

        var anchor = h.slice(0, this.ANCHOR);

        // Room left for the window, after the anchor and the one-message marker.
        // history is strictly [user, assistant, user, assistant, …] — always even.
        // An ODD window opens on an ASSISTANT message, which keeps the roles
        // alternating cleanly across the seam:
        //     … assistant(anchor) │ user(marker) │ assistant(window) … │ user(turn)
        var w = cap - this.ANCHOR - 1;
        if (w % 2 === 0) w -= 1;
        if (w < 3) w = 3;
        if (w > h.length - this.ANCHOR) return h.concat([turn]);  // nothing to elide

        var recent = h.slice(-w);
        var elided = h.length - anchor.length - recent.length;
        if (elided <= 0) return h.concat([turn]);

        var exchanges = Math.round(elided / 2);
        var marker = {
          role: 'user',
          content: '[… ' + exchanges + ' further exchange' + (exchanges === 1 ? '' : 's') +
                   ' passed between us, which I will not set down again …]'
        };

        return anchor.concat([marker]).concat(recent).concat([turn]);
      },

      /* ── THE MOVE ──────────────────────────────────────────────────────
         Expectation is a property of INTENT, not of punctuation.

         The old code inferred "is the figure awaiting a reply?" by testing
         whether its last sentence ended in "?". That is sound for a
         conversation made of questions. The Matrix is made of STATEMENTS —
         two statements per question — so the figure's strongest moves carry
         no question mark at all and are absolutely waiting:

             "So it is the money that is the crux of it."
             "Go on."

         Stop guessing. The figure DECLARES its move, and _expecting, the
         prosody register, and (later) the arrest logic all read from that one
         declaration.

         GRACEFUL DEGRADATION: if the model omits the tag, we fall back to the
         old punctuation heuristic rather than break. A missing tag must never
         be worse than the behaviour we already had.
         ────────────────────────────────────────────────────────────────── */
      MOVES: {
        reflect:  { expecting: true,  register: 'warm'   },
        nearmiss: { expecting: true,  register: 'cool'   },  // the correction engine
        disclose: { expecting: true,  register: 'grave'  },  // the wound → reciprocity
        observe:  { expecting: true,  register: 'cool'   },
        'catch':  { expecting: true,  register: 'sharp'  },  // "Wait. Say that again."
        invite:   { expecting: true,  register: 'warm'   },  // "Go on."
        silence:  { expecting: true,  register: null     },  // says nothing, on purpose
        question: { expecting: true,  register: 'warm'   },
        recite:   { expecting: false, register: 'grave'  },  // reads FROM THE DOCUMENT
        render:   { expecting: false, register: 'grave'  },  // the counsel
        close:    { expecting: false, register: 'grave'  }   // the audience ends
      },

      /* Pull the figure's stage directions off the reply and strip them ALL.
         The seeker must never see a tag, and the speaker must never say one.

             [move:  catch]
             [watch: brother | the money | wasn't ready]
             [catch: Wait. You said your brother would never forgive you — and
                     then you walked straight past it.]

         ── WHY [watch] AND [catch] EXIST ──────────────────────────────────
         The Arrest must land inside a beat. Human turn-taking gaps cluster
         near 200ms; past a second, an interruption stops being an interruption
         and becomes a COMMENT ON SOMETHING YOU ALREADY FINISHED SAYING. So the
         trigger cannot ask a model. That constraint is real and it stands.

         But it does not follow that the fast path must be STUPID.

         THE MODEL DOES NOT RUN ON THE FAST PATH. IT ARMS THE FAST PATH.

         We are already paying for a completion every turn. So the figure —
         which has just read the whole conversation — names what THIS seeker is
         skirting, and pre-writes the line to say if they skirt it again. The
         intelligence arrives ONE TURN EARLY. The trigger stays at ~400µs.

         Cost: about fifteen output tokens on a call we were making anyway.
         Latency on the critical path: ZERO.

         And it replaces the worst code in this file. ARREST_HEAVY is a
         hand-made English word list that misses "he doesn't call anymore" —
         no heavy word in it, and it is the entire conversation. The model
         catches that instantly, because it UNDERSTANDS the conversation.

         The list survives as a fallback, exactly as _expecting degrades to
         punctuation when the move tag is missing. Nothing breaks. It just
         gets duller.
         ────────────────────────────────────────────────────────────────── */
      _parseMove: function (raw) {
        var s = String(raw == null ? '' : raw);
        var move = null, tagged = false, watch = null, catchLine = null;

        // Tags may arrive in any order. Peel every one we recognise off the top.
        for (var guard = 0; guard < 6; guard++) {
          var m = s.match(/^\s*\[\s*(move|watch|catch)\s*[:=]\s*([^\]]*)\]\s*/i);
          if (!m) break;
          var kind = m[1].toLowerCase();
          var val  = String(m[2] || '').trim();
          s = s.slice(m[0].length);

          if (kind === 'move') {
            var key = val.toLowerCase().replace(/[_-]/g, '').replace(/\s+/g, '');
            if (this.MOVES[key]) { move = key; tagged = true; }
          } else if (kind === 'watch') {
            watch = val.split('|')
              .map(function (x) { return x.trim(); })
              .filter(function (x) { return x.length >= 3 && x.length <= 60; })
              .slice(0, 5);
            if (!watch.length) watch = null;
          } else if (kind === 'catch') {
            if (val.length >= 8 && val.length <= 240) catchLine = val;
          }
        }
        return { move: move, text: s.trim(), tagged: tagged, watch: watch, catchLine: catchLine };
      },

      _norm: function (t) {
        return String(t == null ? '' : t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      },

      /* ── THE MOUTH ─────────────────────────────────────────────────────
         The seeker chooses the text. The mouth must not.

         Hand a figure a 40,000-word speech and say "read this back to me" and
         the old code hands it straight to /speak — an unmetered TTS service,
         on your key, with the seeker holding the pen. Worse than the bill: a
         figure that will say ANYTHING you give it is a deepfake engine wearing
         Caesar's name, and the audio outlives the conversation.

         Three gates, cheapest first:
           LENGTH  — the counsel is designed for ~150 words. Cap the mouth.
           ECHO    — a reply that is mostly the seeker's own words is not
                     counsel, it is a parrot. Do not pay to parrot.
           RECITAL — reading the DOCUMENT aloud is a real feature and stays.
                     The rule is not "never recite" — it is WHOSE TEXT IS IT.
                     context = your archive. The seeker's message = not.

         ⚠ ALL OF THIS IS CLIENT-SIDE, AND THE CLIENT IS THE ATTACKER'S
         MACHINE. A curl straight at /speak bypasses every line below. These
         gates stop the careless and the accidental — which is most of the
         bill. Only the Worker stops an attacker. See Cost Watch.
         ────────────────────────────────────────────────────────────────── */
      SPEAK_MAX:  1200,   // chars the figure will ever SPEAK in one turn
      RECITE_MAX: 6000,   // …unless reciting from the document in view
      ECHO_RATIO: 0.6,    // reply this-much made of the seeker's own words → parrot
      ECHO_MIN:   12,     // …and at least this many words long

      /* Is the reply a faithful reading of the document we are looking at? */
      _isRecital: function (text) {
        var ctx = this._norm(this.context);
        if (!ctx) return false;
        var n = this._norm(text);
        return n.length > 40 && ctx.indexOf(n) !== -1;
      },

      /* Longest run of the seeker's own words appearing verbatim in the reply. */
      _echoRun: function (text, said) {
        var a = this._norm(text).split(' ');
        var b = this._norm(said).split(' ');
        if (!a[0] || !b[0]) return 0;
        if (b.length > 3000) b = b.slice(-3000);      // bound the work
        var prev = new Array(b.length + 1), cur, best = 0, i, j;
        for (j = 0; j <= b.length; j++) prev[j] = 0;
        for (i = 1; i <= a.length; i++) {
          cur = new Array(b.length + 1); cur[0] = 0;
          for (j = 1; j <= b.length; j++) {
            cur[j] = (a[i - 1] === b[j - 1]) ? prev[j - 1] + 1 : 0;
            if (cur[j] > best) best = cur[j];
          }
          prev = cur;
        }
        return best;
      },

      /* May the figure SPEAK this? (It is always RENDERED — the screen is free.) */
      _speakable: function (text, said) {
        var t = String(text || '').trim();
        if (!t) return { ok: false, why: 'empty' };

        var recital = this._isRecital(t);
        var limit = recital ? this.RECITE_MAX : this.SPEAK_MAX;
        if (t.length > limit) {
          return { ok: false, why: recital ? 'recital too long' : 'too long to speak' };
        }

        if (said && !recital) {
          var words = this._norm(t).split(' ').length;
          var run = this._echoRun(t, said);
          if (run >= this.ECHO_MIN && run / words >= this.ECHO_RATIO) {
            return { ok: false, why: 'echo' };
          }
        }
        return { ok: true, recital: recital };
      },

      /* ── THE MICROPHONE IS NOT A KEYBOARD ──────────────────────────────
         A keyboard is DELIBERATE. A microphone is AMBIENT.

         Every other input to this system is CHOSEN — the seeker decides what
         enters. The microphone accepts whatever is in the room, and the seeker
         does not choose what is in the room. That makes it the only UNTRUSTED
         input path in the fleet, and every instrument above was built as though
         it were a feature surface rather than an attack surface.

         ── THE ONE THAT RUNS ALL NIGHT ────────────────────────────────────
         THE FIGURE CAN TALK TO ITSELF. FOREVER. ON YOUR KEY.

           1. the figure speaks through the speakers
           2. the barge monitor is open — that IS barge-in
           3. echo cancellation is imperfect, and VAD_RMS_ECHO is a NUMBER I GUESSED
           4. bleed-through crosses the threshold -> BARGE FIRES
           5. the mic is now RECORDING, and what it records is THE FIGURE'S OWN VOICE
           6. silence closes the turn -> the WAV goes to /listen        [PAID]
           7. the transcript — THE FIGURE'S OWN WORDS — is sent as the seeker's turn
                                                                       [PAID]
           8. the figure replies to itself.  GOTO 1.

         An unbounded, hands-free, fully automated cost loop with no human in
         it. It is precisely the curl attack, except the attacker is the product.

         I built _speakable() so the figure would not SPEAK the seeker's words
         back. I never built the mirror: so the figure would not HEAR ITSELF and
         call it a turn. The ear had no echo guard at all.

         Cost Watch's daily breaker would stop it — AT THE CEILING. So the
         failure mode was "wake up to a spent budget", not "wake up bankrupt".
         That is a backstop, not a guard.

         ── AND THE REST, STATED PLAINLY ───────────────────────────────────
         AUDIO IS PROMPT INJECTION WITH A SPEAKER. A television, a podcast, a
         Bluetooth speaker in a café, a colleague — anything audible becomes a
         user turn. Nobody has to touch the machine. STT text is NOT the seeker;
         it is WHATEVER WAS AUDIBLE, and it is treated as untrusted from here on.

         A FORGOTTEN TAB LISTENS FOREVER. Hands-free plus auto-stop is a loop
         with no natural end. §10 already says a counsel must END. That law now
         applies to a machine talking to itself.
         ────────────────────────────────────────────────────────────────── */
      SELF_ECHO_RATIO: 0.5,   // this much of the transcript is the figure's own last line…
      SELF_ECHO_MIN:   6,     // …and at least this many words of it, in a run
      MAX_SELF_ECHO:   2,     // twice, and the mic is CLOSED for the session
      HANDS_FREE_MAX:  12,    // voice turns with no human keystroke → the audience ENDS
      _lastSpoken: '',        // the last thing the figure actually said aloud
      _selfEchoes: 0,
      _voiceTurns: 0,

      /* Is this transcript the FIGURE, coming back through the microphone? */
      _isSelfEcho: function (heard) {
        if (!this._lastSpoken) return false;
        var t = this._norm(heard);
        if (!t) return false;
        var words = t.split(' ').length;
        var run = this._echoRun(heard, this._lastSpoken);
        return run >= this.SELF_ECHO_MIN && (run / words) >= this.SELF_ECHO_RATIO;
      },

      /* The audience ends. Not a failure — a LAW. §10: "a counsel that never
         ends is not a counsel, it is a subscription." A microphone that never
         closes itself is a bug wearing a feature's coat. */
      _closeAudience: function (why) {
        this._barge = false;                       // no more monitoring
        this._arrestOn = false;
        if (window.Amenti && Amenti.listen) { try { Amenti.listen.cancel(); } catch (e) {} }
        this._micAuto = false;                     // NEVER auto-arm again this session
        this._setState('idle');
        this._notice(why);
      },

      /* One conversational turn.
         opts.source — 'voice' | 'text'. DEFAULTS TO 'text', because the safe
         assumption is that a human deliberately typed it. Only the microphone
         paths say otherwise, and they say so explicitly. */
      send: function (text, opts) {
        var self = this;
        var source = (opts && opts.source) || 'text';
        text = String(text || '').trim();
        if (!text || !this.figure) return;
        if (this.state === 'thinking' || this.state === 'speaking') return; // guard

        if (source === 'voice') {
          /* THE LOOP-BREAKER. If what we heard is what we just SAID, this is not
             a turn — it is the room handing the figure its own voice back. Do
             NOT send it. Do not pay for a completion. Do not reply to yourself. */
          if (this._isSelfEcho(text)) {
            this._selfEchoes++;
            if (this._selfEchoes >= this.MAX_SELF_ECHO) {
              this._closeAudience('[I am hearing my own voice returned to me. I will close my ear — speak by hand, or use headphones.]');
            } else {
              this._notice('[that was my own voice coming back — the room is echoing]');
              this._setState('idle');
            }
            return;                                 // ← THE NIGHT-LONG LOOP DIES HERE
          }

          /* THE HANDS-FREE BUDGET. A voice loop has no natural end, so give it
             one. Any typed turn resets it — a human touched the machine. */
          this._voiceTurns++;
          if (this._voiceTurns > this.HANDS_FREE_MAX) {
            this._closeAudience('The hour grows late, seeker. Return when you have thought on it.');
            return;
          }
        } else {
          this._voiceTurns = 0;                     // a human is at the keys. The clock resets.
        }

        // If the mic was open (push-to-talk just produced this), it's already
        // closed by the time text arrives; ensure we're not mid-listen.
        if (window.Amenti && Amenti.listen && Amenti.listen.isRecording()) {
          try { Amenti.listen.cancel(); } catch (e) {}
        }
        this._endSpeech = function () {};      // no speech in flight to disarm

        // RULE 2 — "Just us" ends it instantly. If they decline the room after we
        // acknowledged it, we never mention it again. Not once. Not later.
        if (this._roomPending) {
          this._roomPending = false;
          if (this._roomDeclined(text)) this._roomOff = true;
        }

        if (this._render.user) { try { this._render.user(text); } catch (e) {} }
        var handle = this._render.bot ? this._render.bot() : null;
        if (handle && handle.setHTML) handle.setHTML('<span style="opacity:.5">decoding…</span>');

        this._setState('thinking');

        var sys = this._getSystem(this.figure, this.mode, this.context, this.userName);
        // THE PAYLOAD is bounded. THE TRANSCRIPT (this.history, pushed below) is not.
        var messages = this._payload(text);

        window.claude.complete({ system: sys, messages: messages }).then(function (raw) {
          var parsed = self._parseMove(raw);
          var said   = parsed.text;                  // the tag is GONE from here on

          self._move = parsed.move;
          var M = parsed.move ? self.MOVES[parsed.move] : null;

          // Expectation: read the declaration. If the model forgot to declare,
          // fall back to the old punctuation heuristic — degrade, never break.
          self._expecting = M ? M.expecting
                              : /\?\s*["')\]]*\s*$/.test(said);

          // The transcript records the figure's WORDS, not the stage direction.
          self.history.push({ role: 'user', content: text });
          self.history.push({ role: 'assistant', content: said });
          self._turns++;
          self._sinceArrest++;

          /* ARM THE FAST PATH. The figure has just read the whole conversation;
             it knows what this seeker walked past. Carry that forward.

             The WATCHLIST accumulates — a thing once buried stays buried, and a
             seeker who skirts their brother in turn 4 will skirt him in turn 9.
             The CATCH LINE is replaced each turn: it is written for THIS moment.

             Neither is ever rendered, spoken, or written to history. They are
             stage directions, and the audience does not see the prompt book. */
          if (parsed.watch && parsed.watch.length) {
            var wl = (self._watchlist || []).slice();
            for (var wi = 0; wi < parsed.watch.length; wi++) {
              if (wl.indexOf(parsed.watch[wi]) === -1) wl.unshift(parsed.watch[wi]);
            }
            self._watchlist = wl.slice(0, 8);
          }
          if (parsed.catchLine) self._catchLine = parsed.catchLine;
          // NOTE: _crossed is NOT set here. It is set when the figure's first
          // reply FINISHES (_afterSpeech). Setting it here armed barge-in during
          // the very first sentence — the one utterance that must always land.

          // SILENCE is a move, not a crash. The figure chose not to fill the gap.
          // It renders (the host may show "the figure regards you") and speaks
          // nothing — but it is still WAITING, and the mic must open.
          if (parsed.move === 'silence' || !said) {
            if (handle && handle.setHTML) handle.setHTML('<span style="opacity:.5">…</span>');
            self._afterSpeech();
            return;
          }

          if (handle && handle.setText) handle.setText(said);

          // THE MOUTH. Screen is free; speech is not. Gate it.
          var gate = self._speakable(said, text);
          if (!self._speak || !gate.ok) {
            if (self._speak && !gate.ok && gate.why !== 'empty') {
              self._notice('[not spoken aloud · ' + gate.why + ']');
            }
            self._afterSpeech();
            return;
          }

          // Speak, then transition on the speech's natural end.
          self._setState('speaking');
          var done = false;
          var onEnd = function () { if (done) return; done = true; self._afterSpeech(); };
          // A barge-in disarms the natural end: the figure was cut off, so the
          // "speech finished" path must never fire and drag us back to idle.
          self._endSpeech = function () { done = true; };
          self._watchForBarge();          // the mic listens WHILE the figure speaks
          // Third arg is NEW and optional: hosts that ignore it keep working
          // unchanged. Hosts that read it can compose the prosody register per
          // utterance — the instrument panel, finally audible.
          self._lastSpoken = said;      // what the mic may hear back. The loop-breaker reads this.
          try {
            self._speak(said, onEnd, {
              move:     parsed.move,
              register: M ? M.register : null,
              recital:  !!gate.recital,
              figure:   self.figure
            });
          } catch (e) { onEnd(); }
          // Safety net: if the speaker never calls back (voice off / error),
          // don't strand the machine in 'speaking'.
          setTimeout(function () { if (!done) { done = true; self._afterSpeech(); } }, 1000 * 60 * 4);
        }, function (err) {
          if (handle && handle.setHTML) handle.setHTML('<span style="color:#f87171">[signal lost · ' + (err && (err.message || err)) + ']</span>');
          self._setState('idle');
        });
      },

      /* Speech finished naturally → idle, and auto-arm the mic if configured.
         If the seeker BARGED IN, we are already listening — do not stomp it. */
      _afterSpeech: function () {
        var L = (window.Amenti && Amenti.listen) ? Amenti.listen : null;

        /* THE BARGE MONITOR MUST BE CLOSED.
           _watchForBarge() opens a monitor session while the figure speaks. If
           the seeker never interrupts, NOTHING was closing it — the mic stayed
           open in monitor mode, and the next armMic() hit `if (this.recording)
           return;` and silently did nothing.

           Symptom in the wild: the figure finishes a sentence and the push-to-
           talk button is DEAD. No error, no log, no clue. Just a mic that has
           quietly stopped being a mic. */
        if (L && L.isMonitoring && L.isMonitoring()) {
          try { L.cancel(); } catch (e) {}
        }
        if (L && L.setEchoRisk) { try { L.setEchoRisk(false); } catch (e) {} }

        // THE THRESHOLD IS CROSSED HERE — when the figure has actually finished
        // saying its first thing, and the audience has become a seeker.
        if (this._turns >= 1) this._crossed = true;

        if (this.state === 'listening') return;      // barged: the floor is theirs
        this._setState('idle');
        if (this._micAuto) this.armMic();
      },

      /* ── BARGE-IN ──────────────────────────────────────────────────────
         The old rule, stated in this file's own header: "the mic may ONLY open
         on the SPEECH'S NATURAL END… the seeker never cuts the figure off."

         That rule is why the Arrest was impossible and why the Rendering was a
         lecture. A conversation in which one party must wait politely for the
         other to finish is a transaction. Smooth turn-taking is the signature
         of a customer-service call.

         So: while the figure SPEAKS, the mic MONITORS. On the seeker's voice,
         the mouth stops mid-sentence — as a person's would — and the floor is
         theirs. Requires the host to supply stopSpeaking(); without something
         to cut, barge-in stays OFF rather than half-working.
         ────────────────────────────────────────────────────────────────── */
      _watchForBarge: function () {
        var self = this;
        if (!this._barge || !this._stopSpeaking) return;
        // THE FIRST SENTENCE SURVIVES. "no way—" would otherwise cut the figure
        // off mid-word, and the first voice they came to hear never lands.
        if (!this._crossed) return;
        if (!(window.Amenti && Amenti.listen)) return;
        if (Amenti.listen.isRecording()) return;

        var bopts = {
          monitor:  true,     // hear, but discard, until they actually speak
          echoRisk: true,     // the figure is audible — raise the onset bar
          autoStop: true,     // end their turn on silence; no button to press
          onVoice: function () {
            if (self.state !== 'speaking') return;
            self._endSpeech();                              // the natural end must not fire
            try { self._stopSpeaking(); } catch (e) {}      // CUT THE MOUTH
            if (Amenti.listen.setEchoRisk) Amenti.listen.setEchoRisk(false);
            self._setState('listening');                    // theirs, mid-sentence
          },
          onText: function (t) {
            if (self.state === 'listening') self._setState('idle');
            if (self._sttFailed) {
              self._sttFailed = false;
              self._notice('I did not catch that — the channel faltered, not you. Again?');
              return;
            }
            if (self._isTurn(t)) { self._breakdowns = 0; self.send(t, { source: 'voice' }); }
          },
          onState: function (st) { if (st === 'error') self._sttFailed = true; }
        };
        if (this._arrestOn) bopts.onPartial = function (t) { self._maybeArrest(t); };
        if (this._roomOn)   bopts.onRoom    = function (ev) { self._roomEvent(ev); };
        Amenti.listen.start(bopts);
      },

      /* ── THE ARREST ────────────────────────────────────────────────────
         "Wait. Say that again."

         The single most important instrument in the Matrix, and the one that
         cannot be bolted on: an arrest that arrives after the seeker has
         finished their paragraph and moved on IS NOT AN ARREST. It is a
         delayed reaction — a system performing an attentiveness it did not
         have. THE FORCE COMES ENTIRELY FROM THE TIMING.

         Which rules out asking a model. A round trip is one to two seconds;
         by then they have moved on. So the detector is LOCAL, it runs on the
         browser's live partial transcript, and it costs nothing.

         WHAT IT LOOKS FOR — and this is the whole insight, from §7:

             "Arrest the THROWAWAY. The load-bearing thing is always buried in
              a subordinate clause and abandoned."

         So the signal is NOT a heavy word. People say heavy words on purpose
         all the time. The signal is a heavy thing being DISCARDED — thrown out
         and walked away from in the same breath:

             "…anyway, it doesn't matter that my brother won't speak to me,
              but the money is really the—"
                        ▲ heavy               ▲ dismissed        ▲ moving on

         THAT is the thing to stop. HEAVY + DISMISSAL, close together.

         RARITY IS LOAD-BEARING. §7: "Must be rare." An advisor who arrests
         every third sentence is not attentive, it is twitchy — and the move
         loses all its force. So: never in the opening exchanges (no rapport
         has been earned yet), a hard cooldown between arrests, and a hard
         ceiling per conversation. If it never fires, that is a SUCCESS.

         And §7 again: "Sharp in delivery, WARM IN INTENT — never a gotcha."
         The figure is not catching them out. It is refusing to let them throw
         away the true thing.
         ────────────────────────────────────────────────────────────────── */
      ARREST_HEAVY: [
        'died', 'death', 'dead', 'divorce', 'divorced', 'left me', 'leaving me',
        'fired', 'lost my', 'never forgive', "won't speak", 'wont speak',
        'not speaking', 'hate', 'ashamed', 'afraid', 'scared', 'alone', 'lonely',
        'failed', 'failure', 'worthless', 'my fault', 'blame myself',
        'gave up', 'gave it up', 'betrayed', 'cheated', 'lied to'
      ],
      ARREST_DISMISS: [
        'anyway', 'anyways', "doesn't matter", 'does not matter', 'dont matter',
        "doesn't really matter", 'never mind', 'nevermind', 'forget it',
        "it's fine", 'its fine', "i'm fine", 'im fine', "it's stupid", 'its stupid',
        'not the point', "that's not important", 'thats not important',
        'whatever', 'no big deal', "it's nothing", 'its nothing', 'not that it matters'
      ],
      ARREST_GAP:      14,   // words between the load-bearing thing and the shrug
      ARREST_MIN_TURN: 3,    // never in the opening — rapport is not yet earned
      ARREST_COOLDOWN: 6,    // turns of quiet between arrests. NOT a budget — PACING.

      /* ── THE CAP, LABELLED HONESTLY ────────────────────────────────────
         The old ARREST_MAX: 2 was not a design principle. It was a FEAR — a
         limit on MY detector's error rate, wearing the costume of restraint.

         And a hard ceiling fails in the worst possible way: the seeker who is
         genuinely circling something, on their third approach, when the arrest
         would finally matter most — and the budget is spent on two lesser
         catches, so the figure says nothing.

         A CAP THAT RUNS OUT IS A CAP THAT FAILS WHEN IT IS NEEDED.

         So the ceiling now tracks WHO PULLED THE TRIGGER:

           LIST  — my hand-made word list. I do not trust it. One strike.
           WATCH — the model named this seeker's own buried thing, having read
                   the whole conversation, and wrote the line itself. Trusted
                   further — but still bounded, because rarity is what makes the
                   move land at all.

         Rarity is an OUTCOME, not a policy. A conversation with no arrests in
         it is a conversation where nothing was hidden. The cooldown, the
         threshold and the clean-channel rule shape WHEN it is right to reach.
         They do not run dry.
         ────────────────────────────────────────────────────────────────── */
      ARREST_MAX_LIST:  1,   // the crude detector gets ONE strike, ever
      ARREST_MAX_WATCH: 4,   // the model-armed one is trusted further

      _arrestable: function (partial) {
        var t = ' ' + this._norm(partial) + ' ';
        var words = t.trim().split(' ');
        if (words.length < 8) return null;          // too early to know anything

        /* THE MODEL'S WATCHLIST FIRST. It named what THIS seeker buries, having
           read every word of the conversation. My list is a generic English
           dictionary of sadness. There is no comparison, and the model's costs
           nothing extra — it rode in on a completion we already paid for. */
        var hi = -1, hit = null, source = 'list', i;
        var wl = this._watchlist || [];
        for (i = 0; i < wl.length; i++) {
          var wk = t.indexOf(' ' + this._norm(wl[i]) + ' ');
          if (wk !== -1) { hi = wk; hit = wl[i]; source = 'watch'; break; }
        }

        if (hi === -1) {
          for (i = 0; i < this.ARREST_HEAVY.length; i++) {
            var k = t.indexOf(' ' + this._norm(this.ARREST_HEAVY[i]) + ' ');
            if (k !== -1) { hi = k; hit = this.ARREST_HEAVY[i]; break; }
          }
        }
        if (hi === -1) return null;                 // nothing load-bearing said

        // Where, in WORDS, does the heavy thing sit?
        var hw = t.slice(0, hi).trim().split(' ').length;

        // Is it being thrown away — near it, on either side?
        var dis = -1;
        for (i = 0; i < this.ARREST_DISMISS.length; i++) {
          var d = t.indexOf(' ' + this._norm(this.ARREST_DISMISS[i]) + ' ');
          if (d === -1) continue;
          var dw = t.slice(0, d).trim().split(' ').length;
          if (Math.abs(dw - hw) <= this.ARREST_GAP) { dis = dw; break; }
        }
        if (dis === -1) return null;                // said, but not discarded. Let it stand.

        // Quote back the clause they tried to walk past — not the shrug, and not
        // the wreckage either side of it.
        //
        // A raw ±N-word window gives you: «that my brother won't speak to me but
        // the money» — opening on a complementiser, trailing into the next
        // thought. TECHNICALLY the right clause; rhetorically a mumble. The
        // arrest is SHARP or it is nothing, so clip it at the seams: cut at any
        // conjunction or shrug on either side, then shave the leading function
        // words that no sentence should ever begin on.
        var raw = String(partial).trim().split(/\s+/);
        var EDGE  = /^(that|but|and|so|because|anyway|anyways|though|although|whatever|however|then|when|while)[.,;:]?$/i;
        var LEAD  = /^(that|it|its|it's|is|was|the|a|an|to|of|my|i|mean|like|just)[.,;:]?$/i;
        // A comma is a clause seam too. "it's fine, I'm ashamed of…" — the arrest
        // starts AFTER the comma, not on the shrug that precedes it.
        var seam = function (w) { return EDGE.test(w || '') || /[,;:.]$/.test(w || ''); };

        var a = Math.max(0, hw - 6), b = Math.min(raw.length, hw + 7);
        for (var s0 = hw - 1; s0 >= a; s0--) {                 // walk back to the seam
          if (seam(raw[s0])) { a = s0 + 1; break; }
        }
        for (var e0 = hw + 1; e0 < b; e0++) {                  // walk forward to the next
          if (EDGE.test(raw[e0] || '')) { b = e0; break; }
        }
        var frag = raw.slice(a, b);
        while (frag.length > 2 && LEAD.test(frag[0])) frag.shift();       // never open on "that" / "mean"
        while (frag.length > 2 && LEAD.test(frag[frag.length - 1])) frag.pop();

        var fragment = frag.join(' ').replace(/^[^\w]+|[.,;:!?\-—]+$/g, '');
        if (!fragment || fragment.split(' ').length < 2) {
          // Nothing quotable — but if the MODEL wrote the line, we do not need a
          // quote at all. It already knows what to say.
          if (source === 'watch' && this._catchLine) return { fragment: null, heavy: hit, source: source };
          return null;
        }
        return { fragment: fragment, heavy: hit, source: source };
      },

      /* Called on every partial transcript while the seeker is speaking. */
      _maybeArrest: function (partial) {
        if (!this._arrestOn || !this._speak) return;
        if (!this._crossed) return;                 // not to a stranger, in the first ten seconds
        if (this.state !== 'listening') return;
        // A garbled partial is a random word generator, and it WILL eventually
        // produce a heavy word next to a shrug. The most forceful move in the
        // set must never fire on a hallucination. Clean channel, or no arrest.
        var L = window.Amenti && Amenti.listen;
        if (L && L.channel && !L.channel().clean) return;
        if (this._turns < this.ARREST_MIN_TURN) return;
        if (this._sinceArrest < this.ARREST_COOLDOWN) return;
        if (this._arrests >= this.ARREST_MAX_WATCH) return;      // the outer bound

        var found = this._arrestable(partial);
        if (!found) return;

        // The crude list gets ONE strike in a whole conversation. The model-armed
        // trigger is trusted further — because it is a better trigger, not because
        // we became braver.
        if (found.source === 'list' && this._listArrests >= this.ARREST_MAX_LIST) return;

        this._doArrest(found, partial);
      },

      /* ── §11 · THE ROOM ────────────────────────────────────────────────
         Every other instrument here could, in principle, be performed by a
         sufficiently good script working from a transcript. Noticing that
         someone just walked into the room cannot.

             A person is on a call. Their child wanders in.
             A human says "oh — hello!"  A machine continues its sentence.
             THAT GAP IS WHERE THE UNCANNY LIVES. Not in the prose.

         THE BRIGHT LINE, and it is not negotiable:

             ACKNOWLEDGE WHAT ANNOUNCES ITSELF.
             NEVER INVESTIGATE WHAT DOES NOT.

         A dog barks → it announced itself. "Was that a dog?" is warm.
         A faint voice in another room → it did not. "Who else is there?" is
         intrusive, and it is the exact moment hospitality becomes surveillance.

         THREE HARD RULES, enforced in code below, not in good intentions:

         1. THE NEWCOMER DID NOT CONSENT. They walked in with no context and no
            idea what they are near. Disclose what you are IMMEDIATELY, and
            gather NOTHING about them. A guest, not a subject.

         2. "JUST US" ENDS IT INSTANTLY. If the seeker declines the
            acknowledgement, the room is never mentioned again. No second
            attempt. _roomOff is permanent for the session.

         3. NOTICE, DO NOT RECORD. Who walks into a person's life, and how they
            meet them, is enormously revealing — which is exactly why we do not
            keep it. THE OVERHEARD WORDS ARE NEVER WRITTEN TO history. Only the
            figure's own line is. Using it to be a better counsel in this hour
            is care. Storing it is a dossier.

         Like the Arrest, these are LOCAL and immediate. A room acknowledgement
         that arrives two seconds late is not presence, it is a transcript.
         ────────────────────────────────────────────────────────────────── */
      ROOM_ASIDE: [
        'not now', 'one sec', 'one second', 'hang on', 'hold on', 'in a minute',
        'just a moment', 'come here', 'go on then', 'i said no', 'put that down',
        'honey', 'sweetie', 'sweetheart', 'darling', 'buddy', 'love', 'mum', 'mom', 'ma', 'dad',
        // The moment that matters most, and the one the list was missing:
        // someone is being CALLED INTO the room. §11 — the host stands.
        'come see', 'come look', 'check this out', 'come and see', 'get in here',
        'you have to see', 'look at this', 'listen to this'
      ],
      ROOM_DECLINE: [
        'just us', 'no one', 'nobody', 'nothing', 'ignore that', 'ignore it',
        'never mind', 'nevermind', 'forget it', "it's nothing", 'its nothing', 'no one else'
      ],
      ROOM_MAX: 2,          // acknowledgements per conversation. Presence, not commentary.

      /* Did the seeker just decline the room? Then it is never mentioned again. */
      _roomDeclined: function (text) {
        var t = ' ' + this._norm(text) + ' ';
        for (var i = 0; i < this.ROOM_DECLINE.length; i++) {
          if (t.indexOf(' ' + this._norm(this.ROOM_DECLINE[i]) + ' ') !== -1) return true;
        }
        return false;
      },

      /* Is this speech addressed to SOMEONE WHO IS NOT THE FIGURE? */
      _isAside: function (text) {
        var t = ' ' + this._norm(text) + ' ';
        if (t.trim().split(' ').length > 12) return false;    // a long turn is for us
        for (var i = 0; i < this.ROOM_ASIDE.length; i++) {
          if (t.indexOf(' ' + this._norm(this.ROOM_ASIDE[i]) + ' ') !== -1) return true;
        }
        return false;
      },

      /* The room announced itself. Meet it — once, warmly, and then let it be. */
      _roomEvent: function (ev) {
        var self = this;
        if (!this._roomOn || this._roomOff || !this._speak) return false;
        // Before they have crossed, a loud wordless sound is far more likely to
        // be a LAUGH OF ASTONISHMENT than a labrador. "Is that a dog?" at that
        // moment does not read as charming. It reads as broken.
        if (!this._crossed && ev.kind === 'sound') return false;
        if (this._roomAcks >= this.ROOM_MAX) return false;
        if (this.state === 'thinking' || this.state === 'speaking') return false;

        var line, register;
        if (ev.kind === 'aside') {
          // A voice not for us. The figure YIELDS THE FLOOR. Enormously humanising —
          // and note what it does NOT do: ask who it was.
          line = 'You are needed. Go — I will keep.';
          register = 'warm';
        } else {
          // Something made a noise and we do not know what. Do not pretend to.
          // A near-miss in a party hat: zero-risk, warmly correctable, and it puts
          // their defences on the floor better than any question could.
          line = 'Something is with you there. A dog, I would guess — am I wrong?';
          register = 'humour';
        }

        this._roomAcks++;
        this._roomPending = true;      // their NEXT reply may decline; watch for it

        // RULE 3 — the overheard words are NOT recorded. Only the figure's line.
        var handle = this._render.bot ? this._render.bot() : null;
        if (handle && handle.setText) handle.setText(line);
        this.history.push({ role: 'assistant', content: line });

        this._expecting = true;
        this._move = 'observe';
        this._lastSpoken = line;
        this._setState('speaking');

        var done = false;
        var onEnd = function () { if (done) return; done = true; self._afterSpeech(); };
        this._endSpeech = function () { done = true; };
        try { this._speak(line, onEnd, { move: 'observe', register: register, room: true, figure: this.figure }); }
        catch (e) { onEnd(); }
        this._watchForBarge();
        setTimeout(function () { if (!done) { done = true; self._afterSpeech(); } }, 30000);
        return true;
      },

      /* ── THE THRESHOLD ─────────────────────────────────────────────────
         The first two minutes do not belong to a seeker. They belong to an
         AUDIENCE — and the two are not the same person.

             "holy crap"   "are you serious"   "no way"   "is this real"
             "hey ma, come see this"           "say something!"

         Every instrument in this file was built for CONVERSATION, and in the
         astonishment phase every one of them misfires:

           BARGE-IN  fires on "no way—" and cuts the figure off MID-WORD. The
                     first voice they ever came to hear never finishes a
                     sentence. The trick dies in silence.
           BREAKDOWNS count a gasp as incoherence. Three of them and the system
                     EJECTS its most delighted new user for being delighted.
           THE ROOM  hears a laugh of astonishment and says "is that a dog?"
                     Which does not read as charming. It reads as broken.
           THE ARREST is a stranger grabbing your arm in the first ten seconds.

         So: NOTHING SHARP UNTIL THEY HAVE CROSSED. One real exchange. The
         figure's first sentence SURVIVES — that is the whole promise, and it
         is not negotiable.

         And do not suppress the shock. THE SHOCK IS THE PRODUCT. A generic
         assistant has nowhere to stand when someone says "are you serious?" —
         Caesar does. §2: "What a person laughs at is the most revealing datum
         available. Nothing else is close." The astonishment is DIAGNOSTIC.
         ────────────────────────────────────────────────────────────────── */
      _crossed: false,        // has one real exchange happened?

      /* ── THE EAR, AND THE REPAIR ───────────────────────────────────────
         The old ladder, read as a person would hear it:

             1. "I'm not quite catching the thread — shall we slow down?"
             2. "Still not hearing you clearly. Take your time."
             3. "I think this isn't the moment — let's talk again soon." → GONE

         "Slow down." "Take your time." The system has concluded that YOU are
         the problem, and then it ENDS THE CONVERSATION. It never once considers
         that its own ear might be failing. It is an ejection mechanism wearing
         a polite face.

         Invert it. FAIL LOUD — about OURSELVES.

         THE LINE, and it is a razor:
           "There is music where you are. Lower it and I will hear you."
                                    ← the figure reports ITS OWN difficulty. OK.
           "What's that noise?"     ← INVESTIGATION. Asking about their world.
                                      Over the line. §11.

         The figure states what IT cannot do. It never asks what THEY are doing.

         And ONE request. Then adapt. Not everyone CAN turn it down — a
         roommate, a street, a factory, a child. Someone told twice "I cannot
         hear you" who can do nothing about it has been politely excluded, and
         it will land as: the machine does not want to talk to me.
         ────────────────────────────────────────────────────────────────── */
      _repairs: 0,
      _textInvited: false,    // we have offered the keyboard. Never offer twice.
      _voiceInvited: false,   // we have invited them to speak. Never twice.
      modality: 'voice',      // 'voice' | 'text'

      _say: function (line, register, move) {
        var self = this;
        this._lastSpoken = line;
        var handle = this._render.bot ? this._render.bot() : null;
        if (handle && handle.setText) handle.setText(line);
        this.history.push({ role: 'assistant', content: line });
        this._expecting = true;
        this._move = move || 'observe';
        if (!this._speak) { this._setState('idle'); return; }
        this._setState('speaking');
        var done = false;
        var onEnd = function () { if (done) return; done = true; self._afterSpeech(); };
        this._endSpeech = function () { done = true; };
        try { this._speak(line, onEnd, { move: this._move, register: register, figure: this.figure }); }
        catch (e) { onEnd(); }
        this._watchForBarge();
        setTimeout(function () { if (!done) { done = true; self._afterSpeech(); } }, 30000);
      },

      /* The channel is bad. Repair it, or move house. NEVER eject them. */
      _repairChannel: function (ch) {
        this._repairs++;
        this._lastChannel = ch;      // what the ear actually heard, for the record

        // FIRST: ask once. State our own difficulty; do not interrogate theirs.
        if (this._repairs === 1 && !this._textInvited) {
          this._say(
            ch.loudRoom
              ? 'I cannot hear you over that — there is too much noise where you are. Quiet it, and I will listen.'
              : 'Your voice is faint against the room. Come closer, or quiet what is behind you.',
            'warm', 'observe');
          return;
        }

        // SECOND: the ear has failed. DO NOT ASK AGAIN. Move to the channel that
        // works — and it is not a lesser one. send() never cared where the words
        // came from. The keyboard is not a fallback; it is the mode this system
        // was BUILT for. Voice is the addition.
        if (!this._textInvited) {
          this._textInvited = true;
          this.modality = 'text';
          this._say('My ear fails me here. Write to me instead — my eye does not.', 'warm', 'invite');
          return;
        }

        // Already offered. They chose to keep speaking. Then we struggle on
        // gracefully and we do not nag. A machine that keeps suggesting the
        // keyboard is a machine that would rather not be talking to you.
        this._notice('[the channel is noisy — the figure is straining to hear]');
      },

      /* Words arrived by keyboard. Same engine, same brain, same everything. */
      setModality: function (m) {
        this.modality = (m === 'text') ? 'text' : 'voice';
        if (this.modality === 'text' && window.Amenti && Amenti.listen) {
          try { Amenti.listen.cancel(); } catch (e) {}
        }
      },

      /* And the bridge runs BOTH ways. After warmth, the figure may ask ONCE
         for their actual voice — and how a person answers THAT is a probe. One
         who will type their wound but not say it aloud has told you something
         enormous, and it cost nothing to learn. */
      _maybeInviteVoice: function () {
        if (this._voiceInvited || this.modality !== 'text') return false;
        if (this._textInvited) return false;        // their ear failed us; do not push
        if (this._turns < 6 || !this._speak) return false;
        this._voiceInvited = true;
        this._say('Speak to me, if you will. I would rather hear it than read it.', 'warm', 'invite');
        return true;
      },

      /* Neutralises the in-flight speech's natural-end callback. Reset by send(). */
      _endSpeech: function () {},

      _doArrest: function (found, partial) {
        var self = this;

        // Do NOT transcribe. The arrest lands NOW; a /listen round-trip would
        // make it late, and late is worse than never. Their partial IS the turn.
        if (window.Amenti && Amenti.listen) { try { Amenti.listen.cancel(); } catch (e) {} }

        this._arrests++;
        this._sinceArrest = 0;
        if (found.source === 'list') this._listArrests++;

        /* If the figure PRE-WROTE the arrest, say the figure's words.

           My fallback quotes back a ±6-word window and I had to hand-tune comma
           seams to stop it mumbling — "mean I failed", "that my brother won't
           speak to me but the money". Technically the right clause. Rhetorically
           a mess. A model-authored arrest needs none of that machinery: it says
           the right sentence because it WROTE the right sentence, with the whole
           conversation in view.

           The clause-clipper survives as the fallback. It always was one. */
        var line = (found.source === 'watch' && this._catchLine)
          ? this._catchLine
          : 'Wait. "' + found.fragment + '." Say that again.';

        // The transcript must show what actually happened: they were speaking,
        // and they were CUT OFF. Record both halves honestly.
        if (this._render.user) { try { this._render.user(String(partial).trim() + ' —'); } catch (e) {} }
        this.history.push({ role: 'user',      content: String(partial).trim() + ' —' });
        this.history.push({ role: 'assistant', content: line });

        var handle = this._render.bot ? this._render.bot() : null;
        if (handle && handle.setText) handle.setText(line);

        this._expecting = true;         // the figure is absolutely waiting
        this._move = 'catch';
        this._setState('speaking');

        this._lastSpoken = line;
        var done = false;
        var onEnd = function () { if (done) return; done = true; self._afterSpeech(); };
        this._endSpeech = function () { done = true; };
        try {
          this._speak(line, onEnd, {
            move: 'catch', register: 'sharp',    // sharp in DELIVERY…
            arrest: true,                        // …warm in intent. Never a gotcha.
            figure: this.figure
          });
        } catch (e) { onEnd(); }
        this._watchForBarge();
        setTimeout(function () { if (!done) { done = true; self._afterSpeech(); } }, 30000);
      },


      /* Is this transcript a real turn worth the brain? Cheap, local. An open
         expectation (the figure just asked) relaxes the length floor so a bare
         "yes"/"no" counts. */
      _isTurn: function (t) {
        t = String(t || '').trim();
        if (!t) return false;
        if (this._expecting) return t.length >= 1;
        // No pending question: require a little shape — a few letters, not a blip.
        return t.replace(/[^a-zA-Z0-9]/g, '').length >= 2;
      },

      /* Push-to-talk (or auto-arm): open the mic — ONLY from idle. Never during
         thinking/speaking. This is the single guarded door into 'listening'. */
      armMic: function () {
        var self = this;
        if (this.state !== 'idle') return;
        if (!(window.Amenti && Amenti.listen)) return;
        this._setState('listening');
        this._sttFailed = false;

        /* THE FLAGS MUST GATE THE MICROPHONE ITSELF, not merely the reaction to
           it. onPartial starts SpeechRecognition — a SECOND consumer on the same
           mic as getUserMedia. Passing it unconditionally would have kept that
           collision live even with arrest:false, and the flag would have been
           decoration. A switch that does not switch anything is worse than no
           switch: it makes you believe you are safe. */
        var opts = {
          onText: function (t) {
            if (self.state === 'listening') self._setState('idle');

            // amenti-listen fires onText('') on a TRANSCRIPTION FAILURE as well
            // as on silence. The old code could not tell them apart, so three
            // network errors in a row read as three incoherent seekers, and the
            // figure DISCONNECTED the human for the system's own outage.
            // An outage is not a breakdown. Say so, and do not punish them.
            if (self._sttFailed) {
              self._sttFailed = false;
              self._notice('I did not catch that — the channel faltered, not you. Again?');
              return;
            }

            // Speech that was never meant for us. The figure yields the floor —
            // and does NOT ask who it was. (Rule 3: notice, do not record. The
            // words themselves go no further than this line.)
            if (self._isAside(t) && self._roomEvent({ kind: 'aside' })) { self._breakdowns = 0; return; }

            if (self._isTurn(t)) {
              self._breakdowns = 0;           // a real turn clears the channel
              self._repairs = 0;              // and a clean turn clears the ear
              self.send(t, { source: 'voice' });   // UNTRUSTED. It is whatever was audible.
              return;
            }

            /* Nothing usable came back. WHOSE FAULT IS IT?

               The old code never asked. It assumed the seeker was incoherent,
               told them to "slow down", and after three strikes DISCONNECTED
               THEM. If the real problem was a television, it just ejected a
               person for owning one.

               Ask the ear first. */
            var ch = (window.Amenti && Amenti.listen && Amenti.listen.channel)
                       ? Amenti.listen.channel() : { clean: true };
            if (!ch.clean) { self._repairChannel(ch); return; }   // OUR failure. Say so. Never eject.

            // The channel is clean and it still made no sense. THAT is a
            // breakdown — but during the Threshold it is far likelier to be a
            // gasp, a laugh, or "whoa—" than an incoherent human being.
            if (!self._crossed) return;

            self._breakdowns++;
            if (self._breakdowns >= self._MAX_BREAKDOWNS) {
              self._breakdowns = 0;
              // Even here: do not throw them out of the hall. Change the door.
              if (!self._textInvited) {
                self._textInvited = true;
                self.modality = 'text';
                self._say('My ear fails me here. Write to me instead — my eye does not.', 'warm', 'invite');
              } else if (self._onDisconnect) {
                self._notice("I think this isn't the moment — let's talk again soon.");
                try { self._onDisconnect(); } catch (e) {}
              }
            } else if (self._breakdowns === 1) {
              self._notice("I'm not quite catching the thread — shall we slow down?");
            } else {
              self._notice("Still not hearing you clearly. Take your time.");
            }
          },
          onState: function (st) {
            if (st === 'error') {
              self._sttFailed = true;                                  // OUR fault, not theirs
              if (self.state === 'listening') self._setState('idle');
            }
            if (st === 'timeout') {
              // The ear closed itself on an empty room. Do not re-arm; a human
              // must ask again. NEVER auto-arm into silence.
              self._micAuto = false;
              if (self.state === 'listening') self._setState('idle');
              self._notice('[the ear has closed — tap to speak again]');
            }
          }
        };
        // ONLY start the browser recogniser if the Arrest is actually armed.
        if (this._arrestOn) opts.onPartial = function (t) { self._maybeArrest(t); };
        // ONLY listen to the room if the Room is actually enabled.
        if (this._roomOn) opts.onRoom = function (ev) { self._roomEvent(ev); };
        Amenti.listen.start(opts);
      },

      _notice: function (t) { try { this._onNotice(t); } catch (e) {} },

      /* Stop listening without sending (user cancels). */
      disarmMic: function () {
        if (this.state !== 'listening') return;
        if (window.Amenti && Amenti.listen) { try { Amenti.listen.cancel(); } catch (e) {} }
        this._setState('idle');
      },

      /* Toggle mic for push-to-talk surfaces. */
      micToggle: function () {
        if (this.state === 'listening') {
          // user tapped to send: stop -> transcribe -> onText -> send
          if (window.Amenti && Amenti.listen) Amenti.listen.stop();
        } else {
          this.armMic();
        }
      }
    };
    return inst;
  }

  window.Amenti.chat = {
    __v: '2026.07-anchored',   // anchored window · move tags · the mouth ·
                               // barge-in · the Arrest · the Room · the Threshold
    create: create,
    _defaultBuildSystem: defaultBuildSystem
  };
})();
