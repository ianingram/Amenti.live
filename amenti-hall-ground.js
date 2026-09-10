/* ============================================================================
   amenti-hall-ground.js  →  Amenti.live/amenti-hall-ground.js
   ----------------------------------------------------------------------------
   THE HALL LEARNS TO SEARCH THE GROUND

   Until now the hall could search PEOPLE and DOCUMENTS. Type `Thermopylae`
   and it matched the word inside a register's description; the pass itself
   was invisible to it. Fifteen frames, twenty-one thousand places and four
   registers of authored ground sat behind a front door that could not see
   them.

   This gives the door a fifth source: the ground.

   ── OFFER BY DEFAULT. ANSWER ONLY WHEN THE REGISTER PLAINLY HOLDS IT ─────
   A hit becomes an OFFER \u2014 two to five readings of the place, each built from
   a register row and each a question the hall answers well. The reader picks,
   and the paid call happens AFTER the intent is settled rather than as a
   guess at it.

   It ANSWERS outright only where a register contains the answer as written
   prose: a `why` sentence, or a told moment from ATTICA-TOLD.csv. Those were
   authored to be read. Handing one over costs nothing and reads better than
   a model writing around it.

   > EVERYTHING ELSE IS AN OFFER, BECAUSE A LOOKUP THAT GUESSES WHICH OF FOUR
   > READINGS YOU WANTED IS THE THING THIS REPLACES.

   ── AND AN OFFER NAMES ONLY WHAT IS ON DISK ──────────────────────────────
   Thermopylae has a kind, a why, five rooms and an event: four offers.
   Skambonidai is a deme named in one document and has nothing else: ONE
   offer, and no invitation to spend on what the ground cannot answer. The
   shape was checked against a rich place, a thin one, and an unplaced one
   before it was written, because the lives schema was designed off a single
   rich example on 9 September and broke on the second.

   ── WHAT IT SAVES ────────────────────────────────────────────────────────
   A ground question answered from files never opens the paid door. `where is
   Thermopylae`, `what happened there`, `who writes about it` are all lookups
   today costing about two and a half cents each, to say what a CSV holds.

   ── AND IT REACHES WHAT THE MAP CANNOT ───────────────────────────────────
   Krete is named in thirty-three reading rooms, carries four written moments,
   and is `unplaced` \u2014 Pleiades gives its province a five-degree cell, so the
   surface holds it and does not draw it. THE PROSE EXISTS AND HAS NO DOOR.
   Through here it has one.

   ── THE NAME ─────────────────────────────────────────────────────────────
   window.AmentiHallGround. NOT AmentiGround — that belongs to
   amenti-ground.js, which draws GROUND.jpg under the world map and has owned
   the name since it was written.

   ── WHAT IT CANNOT DO ────────────────────────────────────────────────────
   \u00b7 Search frames that have no authored registers. Fourteen of fifteen are
     harvested and unread; a hit there can offer a place and a kind and
     nothing else, and says so.
   \u00b7 Judge whether a `why` sentence is TRUE. ATTICA-WHY.csv says in its own
     header that every line is an unverified draft, and an answer built from
     one carries that.
   \u00b7 Match a name the gazetteer spells differently. That is what
     ATTICA-NAMES.csv and the Latinised forms are for, and this reads the
     mentions register\u2019s `matched_as` rather than re-deriving it.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var FKEY = 'ATTICA';

  var G = null, err = null, loading = null;

  function split(line) {
    var c = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
      cur += ch;
    }
    c.push(cur);
    return c;
  }
  function parse(t) {
    var lines = String(t).replace(/\r\n/g, '\n').split('\n');
    var cols = split(lines[0]).map(function (h) { return h.trim(); });
    var out = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim() || lines[i].charAt(0) === '#') { continue; }
      var c = split(lines[i]), o = {};
      for (var j = 0; j < cols.length; j++) { o[cols[j]] = (c[j] == null ? '' : c[j]).trim(); }
      out.push(o);
    }
    return out;
  }
  function grab(name) {
    return fetch(RAW + name + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) { return t ? parse(t) : null; })
      .catch(function () { return null; });
  }

  /* ── LOADED ONCE, NOT PER KEYSTROKE ──────────────────────────────────────
     The box searches as the visitor types. Five CSV fetches on every letter
     would be a cost of a different kind \u2014 bandwidth rather than dollars, and
     just as real. One load, cached for the page. */
  function load() {
    if (G || err) { return Promise.resolve(); }
    if (loading) { return loading; }
    loading = Promise.all([
      grab(FKEY + '.csv'), grab(FKEY + '-WHY.csv'), grab(FKEY + '-MENTIONS.csv'),
      grab(FKEY + '-EVENTS.csv'), grab(FKEY + '-LIVES.csv'), grab(FKEY + '-TOLD.csv'),
      grab('NARROWS.csv')
    ]).then(function (r) {
      if (!r[0]) { err = FKEY + '.csv could not be read'; return; }
      var by = {};
      r[0].forEach(function (p) {
        if (!p.key) { return; }
        by[p.key] = { key: p.key, name: p.name, kind: p.kind, tier: p.tier,
                      lat: p.lat, lon: p.lon, unplaced: p.unplaced === '1',
                      why: null, rooms: 0, form: '', origin: '',
                      events: [], ore: [], told: [], narrow: null };
      });
      (r[1] || []).forEach(function (w) { if (by[w.key] && w.why) { by[w.key].why = w.why; } });
      (r[2] || []).forEach(function (m) {
        if (!by[m.key] || !(+m.sources > 0)) { return; }
        by[m.key].rooms = +m.sources;
        by[m.key].form = m.matched_as || '';
        by[m.key].origin = m.matched_origin || '';
        by[m.key]['in'] = m['in'] || '';
      });
      (r[3] || []).forEach(function (e) { if (by[e.at]) { by[e.at].events.push(e); } });
      (r[4] || []).forEach(function (o) { if (by[o.key]) { by[o.key].ore.push(o); } });
      (r[5] || []).forEach(function (t) { if (by[t.key]) { by[t.key].told.push(t); } });
      (r[6] || []).forEach(function (n) {
        var nm = (n.name || '').toLowerCase();
        Object.keys(by).forEach(function (k) {
          if (by[k].name && by[k].name.toLowerCase() === nm) { by[k].narrow = n; }
        });
      });
      G = by;
    });
    return loading;
  }

  /* ── MATCHING ────────────────────────────────────────────────────────────
     Exact name first, then a prefix, then the attested forms the mentions
     harvest already matched on. IT DOES NOT RE-DERIVE THE LATIN FORMS \u2014
     tools/latinise-names.py did that and marked every one `derived`, and a
     second guess at the same problem would disagree with the first sooner or
     later. */
  function look(word) {
    var q = String(word || '').trim().toLowerCase();
    if (!q || !G) { return []; }
    var exact = [], starts = [], formed = [];
    Object.keys(G).forEach(function (k) {
      var p = G[k], n = (p.name || '').toLowerCase();
      if (!n) { return; }
      if (n === q) { exact.push(p); return; }
      if (n.indexOf(q) === 0 || n.split('/').some(function (x) { return x === q; })) { starts.push(p); return; }
      if (p.form && p.form.toLowerCase().split('|').indexOf(q) >= 0) { formed.push(p); }
    });
    /* the corpus decides the order among equals: a place named in more rooms
       is the one a reader more likely meant */
    var by = function (a, b) { return (b.rooms || 0) - (a.rooms || 0); };
    return exact.sort(by).concat(starts.sort(by)).concat(formed.sort(by)).slice(0, 4);
  }

  /* ── WHAT A PLACE CAN BE ASKED ───────────────────────────────────────────
     Each offer is a real sentence, so what reaches the model is a question it
     is good at rather than a fragment. `answer` on an offer means the
     register plainly holds it and NO CALL IS NEEDED. */
  function offers(p) {
    var o = [];
    if (p.why) {
      o.push({ ask: 'why did ' + p.name + ' matter?', answer: plain(p.why),
               from: FKEY + '-WHY.csv',
               caveat: 'authored and unverified \u2014 the register says so of every line in it' });
    }
    (p.told || []).slice(0, 4).forEach(function (t) {
      var y = Math.abs(+t.from) + (+t.from < 0 ? ' BC' : '');
      o.push({ ask: 'what was ' + p.name + ' in ' + y + '?', answer: plain(t.prose),
               from: FKEY + '-TOLD.csv',
               caveat: 'written from the dated lines in ' + FKEY + '-LIVES.csv' });
    });
    (p.events || []).slice(0, 3).forEach(function (e) {
      o.push({ ask: 'what happened at ' + p.name + ' in ' +
                    Math.abs(+e.year) + (+e.year < 0 ? ' BC' : '') + '?',
               hint: plain(e.name) + (e.where ? ' \u2014 ' + plain(e.where) : ''),
               from: FKEY + '-EVENTS.csv' });
    });
    if (p.rooms) {
      o.push({ ask: 'what do the sources say about ' + p.name + '?',
               hint: plural(p.rooms, 'reading room') +
                     (p.rooms === 1 ? ' names it' : ' name it') +
                     (p.origin === 'derived' ? ', on a DERIVED form \u2014 the corpus names ' +
                      'something that transliterates to this' : ''),
               from: FKEY + '-MENTIONS.csv' });
    }
    if (p.narrow && p.narrow.why) {
      var nw = plain(p.narrow.why);
      var twin = o.filter(function (x) { return x.answer && sameish(x.answer, nw) > 0.6; })[0];
      if (twin) {
        twin.from += ' and NARROWS.csv';
        if (nw !== twin.answer) {
          twin.caveat = (twin.caveat ? twin.caveat + ' \u00b7 ' : '') +
            'NARROWS.csv states this slightly differently \u2014 both are authored ' +
            'drafts and they have drifted';
          twin.also = nw;
        }
      } else {
        o.push({ ask: 'what does the ground at ' + p.name + ' force?',
                 answer: nw, from: 'NARROWS.csv',
                 hint: p.narrow['class'] === 'funnel'
                   ? 'a funnel \u2014 the ground everyone came through'
                   : (p.narrow['class'] === 'forbid'
                      ? 'forbidding ground \u2014 what an army went around' : '') });
      }
    }
    return o;
  }

  /* ── THE ASTERISKS BELONG TO THE MAP PANE, NOT HERE · 10 Sep ────────────
     ATTICA-TOLD.csv marks proper names and dates with **asterisks** so
     amenti-attica-hall.js can render them in terminal blue. THE HALL IS NOT
     THAT PANE. It got the raw markup and a reader saw `**Minoan** **Crete**`.

     A register written for one surface arrives at the next one carrying that
     surface's conventions, and the second surface has to say what it does
     with them. This one strips: the box renders its own prose and has its own
     way of colouring a proper noun, and two markup systems in one sentence is
     worse than none. */
  function plain(t) {
    return String(t == null ? '' : t).replace(/\*\*([^*]+)\*\*/g, '$1');
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /* ── TWO REGISTERS AGREEING MUST NOT BECOME TWO OFFERS · 10 Sep ──────────
     ATTICA-WHY.csv and NARROWS.csv both describe Thermopylae, in nearly the
     same sentence, and the reader was offered it twice under two different
     questions. One place out of thirty-three, so it is not a pattern — but it
     is the right KIND of fault to handle once, because the second one will
     turn up in a register nobody is looking at.

     AND WHERE THEY DISAGREE, THAT IS A FINDING AND NOT A CHOICE. One says the
     coast has silted SIX KILOMETRES and the other SEVERAL. Both are authored
     drafts, and the offer says so rather than picking a winner: a surface that
     silently prefers one register over another has decided something on the
     captain's behalf and left no trace. */
  function sameish(a, b) {
    var norm = function (t) {
      return String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ').trim().split(' ');
    };
    var x = norm(a), y = norm(b);
    if (!x.length || !y.length) { return 0; }
    var seen = {}, hit = 0;
    x.forEach(function (w) { seen[w] = (seen[w] || 0) + 1; });
    y.forEach(function (w) { if (seen[w]) { seen[w]--; hit++; } });
    return hit / Math.max(x.length, y.length);
  }

  function describe(p) {
    var bits = [];
    if (p.kind) { bits.push(p.kind.replace(/\|/g, ' \u00b7 ')); }
    if (p.unplaced) {
      bits.push('HELD AND NOT DRAWN \u2014 the gazetteer gives a fallback coordinate, ' +
                'not a location, so the map cannot show it');
    } else if (p.tier === 'wash') {
      bits.push('somewhere in an area, not a point');
    }
    return bits.join(' \u00b7 ');
  }

  /* ── AmentiHallGround, NOT AmentiGround · 10 Sep ────────────────────────
     amenti-ground.js HAS OWNED window.AmentiGround SINCE IT WAS WRITTEN — it
     is the terrain under the world map, and it loads after this one, so it
     overwrote the whole object and `look` came back undefined on the first
     try. Two modules with `ground` in the name doing different things.

     The name says which ground: this is the HALL searching the ground, not
     the ground itself. */
  window.AmentiHallGround = {
    /* the one call the box needs: what do I hold on this word? */
    look: function (word) {
      return load().then(function () {
        if (err) { return { error: err }; }
        /* ── A HIT WITH NOTHING BEHIND IT IS NOT AN OFFER · 10 Sep ─────────
           `Marathonian Pedion` came back as `what is Marathonian Pedion? —
           plain`, which is the register reading its own `kind` column back at
           the visitor and calling it a question. AN OFFER THAT DOES NOT EARN
           ITS LINE TEACHES A READER TO SKIP THE LIST.

           A place with no `why`, no told moment, no event and no room is real
           and is in the register, and the honest thing is to SAY IT IS THERE
           without inviting a question the ground cannot answer. */
        var hits = look(word), rich = [], thin = [];
        hits.forEach(function (p) {
          var o = offers(p);
          (o.length ? rich : thin).push({ key: p.key, name: p.name,
            what: describe(p), rooms: p.rooms,
            /* the count as a phrase, so no surface has to get the plural right
               a second time \u2014 `1 rooms` shipped once already */
            roomsSaid: p.rooms ? plural(p.rooms, 'reading room') : 'no reading room',
            unplaced: p.unplaced, offers: o });
        });
        return { word: String(word || ''), places: rich, also: thin };
      });
    },
    /* the whole row, for the console */
    place: function (key) { return load().then(function () { return G ? (G[key] || null) : { error: err }; }); },
    ready: function () { return !!G; },
    count: function () { return G ? Object.keys(G).length : (err ? { error: err } : null); }
  };
})();
