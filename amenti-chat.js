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

  function defaultBuildSystem(c, mode, context, knownName) {
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
        '- Plain prose, your own voice. No lists, no headers.';
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
      '- A name is for warmth, not for filing. First name only. Never press for it, never ask twice, and NEVER ask for anything more identifying (no surname, no age, no location, no "where are you writing from"). Whatever they offer, hold it lightly.';
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
      _onDisconnect: (typeof opts.onDisconnect === 'function') ? opts.onDisconnect : null,
      _onNotice: (typeof opts.onNotice === 'function') ? opts.onNotice : function () {},
      _expecting: false,     // figure asked a question; next utterance is its answer
      _breakdowns: 0,        // consecutive un-turn-like inputs on the voice channel
      _MAX_BREAKDOWNS: 3,
      userName: opts.userName || '',   // first name, once freely given (rapport, not data)

      _setState: function (s) {
        this.state = s;
        try { this._onState(s); } catch (e) {}
      },

      setFigure: function (f) { this.figure = f; this.history = []; this.userName = ''; },
      setMode:   function (m) { this.mode = m; },
      setContext:function (t) { this.context = t || ''; },
      setUserName: function (n) { this.userName = String(n || '').trim(); },
      clear:     function () { this.history = []; },

      /* One conversational turn. */
      send: function (text) {
        var self = this;
        text = String(text || '').trim();
        if (!text || !this.figure) return;
        if (this.state === 'thinking' || this.state === 'speaking') return; // guard

        // If the mic was open (push-to-talk just produced this), it's already
        // closed by the time text arrives; ensure we're not mid-listen.
        if (window.Amenti && Amenti.listen && Amenti.listen.isRecording()) {
          try { Amenti.listen.cancel(); } catch (e) {}
        }

        if (this._render.user) { try { this._render.user(text); } catch (e) {} }
        var handle = this._render.bot ? this._render.bot() : null;
        if (handle && handle.setHTML) handle.setHTML('<span style="opacity:.5">decoding…</span>');

        this._setState('thinking');

        var sys = this._getSystem(this.figure, this.mode, this.context, this.userName);
        var messages = this.history.concat([{ role: 'user', content: text }]);

        window.claude.complete({ system: sys, messages: messages }).then(function (reply) {
          self.history.push({ role: 'user', content: text });
          self.history.push({ role: 'assistant', content: reply });
          if (handle && handle.setText) handle.setText(reply);
          // Expectation: if the figure just asked something, the next utterance is
          // its answer — the gate will accept even a short "yes"/"no".
          self._expecting = /\?\s*["')\]]*\s*$/.test(String(reply || ''));

          // Speak, then transition on the speech's natural end.
          if (self._speak) {
            self._setState('speaking');
            var done = false;
            var onEnd = function () { if (done) return; done = true; self._afterSpeech(); };
            try { self._speak(reply, onEnd); } catch (e) { onEnd(); }
            // Safety net: if the speaker never calls back (voice off / error),
            // don't strand the machine in 'speaking'.
            setTimeout(function () { if (!done) { done = true; self._afterSpeech(); } }, 1000 * 60 * 4);
          } else {
            self._afterSpeech();
          }
        }, function (err) {
          if (handle && handle.setHTML) handle.setHTML('<span style="color:#f87171">[signal lost · ' + (err && (err.message || err)) + ']</span>');
          self._setState('idle');
        });
      },

      /* Speech finished naturally → idle, and auto-arm the mic if configured. */
      _afterSpeech: function () {
        this._setState('idle');
        if (this._micAuto) this.armMic();
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
        Amenti.listen.start({
          onText: function (t) {
            if (self.state === 'listening') self._setState('idle');
            if (self._isTurn(t)) {
              self._breakdowns = 0;           // a real turn clears the channel
              self.send(t);
            } else {
              // Un-turn-like input on the voice channel: a breakdown. Escalate
              // politely; after MAX, exit gracefully and disconnect. (Noise track
              // only — a coherent person never reaches here.)
              self._breakdowns++;
              if (self._breakdowns >= self._MAX_BREAKDOWNS) {
                self._breakdowns = 0;
                self._notice("I think this isn't the moment — let's talk again soon.");
                if (self._onDisconnect) { try { self._onDisconnect(); } catch (e) {} }
              } else if (self._breakdowns === 1) {
                self._notice("I'm not quite catching the thread — shall we slow down?");
              } else {
                self._notice("Still not hearing you clearly. Take your time.");
              }
            }
          },
          onState: function (st) {
            if (st === 'error' && self.state === 'listening') self._setState('idle');
          }
        });
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

  window.Amenti.chat = { create: create, _defaultBuildSystem: defaultBuildSystem };
})();
