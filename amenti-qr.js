/* ============================================================================
   amenti-qr.js · THE HAND-OVER · Ingram Manor LLC
   ----------------------------------------------------------------------------
   A QR code for the page you are standing on, so one reader can hand Amenti to
   the next by holding up a phone.

   ── WHY THIS IS NOT ONE LINE ──────────────────────────────────────────────
   The one-line version is an <img src="https://api.qrserver.com/?data=...">.
   It was not used, for four reasons, in order of how much they matter:

     1. IT SENDS EVERY URL TO A STRANGER. The whole point of this widget is to
        encode the reader's CURRENT location — which tab, which figure, which
        reading room. That is a log of what your readers read, handed to a free
        service with no agreement, on every page view.
     2. IT IS AN UNPINNED THIRD-PARTY DEPENDENCY on the critical path of a
        feature. The flagship audit already flagged one of those. Adding a
        second, for something this small, would be hard to defend.
     3. IT FAILS WITHOUT NETWORK, which is the one moment a QR code is most
        useful — a room with bad signal and two people holding phones.
     4. IT CAN DISAPPEAR. Free QR endpoints have a habit of turning into a
        402, and it would fail as a broken image with nothing reporting it.

   So this encodes locally. No network, no dependency, no build step, ~9 KB.

   ── IT WAS VERIFIED, NOT ASSUMED ──────────────────────────────────────────
   A QR encoder that is subtly wrong produces a beautiful square that no phone
   can read, and you find out from a person holding a phone, not from a test.
   Every matrix this file produces for versions 1–10 was compared MODULE BY
   MODULE against an independent reference implementation before it shipped.
   That is the same law as the ark: a backup that was never read back is not a
   backup, and an encoder that was never decoded is a picture.

   ── USE ───────────────────────────────────────────────────────────────────
     <script src="amenti-qr.js?v=1" defer></script>
     <div id="amenti-handover"></div>

   Or call it yourself:
     AmentiQR.svg('https://amenti.live/hall.html', { size: 220 })  -> SVG string
     AmentiQR.withVia(url, 'qr')                                 -> the tagged URL
     AmentiQR.matrix('...')                                        -> [[0|1]]

   Byte mode, error correction M (~15% recoverable — survives a thumb over a
   corner and a bad camera). Versions 1–10, chosen automatically: up to 213
   bytes, which is far more URL than anyone should be handing over.
   ========================================================================= */
(function (global) {
  'use strict';

  /* ── the tables ───────────────────────────────────────────────────────────
     Level M only. Per version: total codewords, EC codewords per block, and
     the block structure [ [count, dataCodewords], ... ]. */
  var VERSIONS = {
    1:  { total: 26,  ecPerBlock: 10, blocks: [[1, 16]],           align: [] },
    2:  { total: 44,  ecPerBlock: 16, blocks: [[1, 28]],           align: [6, 18] },
    3:  { total: 70,  ecPerBlock: 26, blocks: [[1, 44]],           align: [6, 22] },
    4:  { total: 100, ecPerBlock: 18, blocks: [[2, 32]],           align: [6, 26] },
    5:  { total: 134, ecPerBlock: 24, blocks: [[2, 43]],           align: [6, 30] },
    6:  { total: 172, ecPerBlock: 16, blocks: [[4, 27]],           align: [6, 34] },
    7:  { total: 196, ecPerBlock: 18, blocks: [[4, 31]],           align: [6, 22, 38] },
    8:  { total: 242, ecPerBlock: 22, blocks: [[2, 38], [2, 39]],  align: [6, 24, 42] },
    9:  { total: 292, ecPerBlock: 22, blocks: [[3, 36], [2, 37]],  align: [6, 26, 46] },
    10: { total: 346, ecPerBlock: 26, blocks: [[4, 43], [1, 44]],  align: [6, 28, 50] }
  };

  /* ── GF(256), the field Reed-Solomon lives in ─────────────────────────── */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;           /* the QR primitive polynomial */
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* generator polynomial for n EC codewords */
  function generator(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        next[j] ^= g[j];
        next[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = next;
    }
    return g;
  }

  function ecFor(data, n) {
    var g = generator(n), rem = data.slice().concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) {
      var f = rem[i];
      if (f === 0) continue;
      for (var j = 0; j < g.length; j++) rem[i + j] ^= gmul(g[j], f);
    }
    return rem.slice(data.length);
  }

  /* ── UTF-8, because a URL can carry one ───────────────────────────────── */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) {
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63),
                 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /* ── the bit stream ───────────────────────────────────────────────────── */
  function BitBuf() { this.bits = []; }
  BitBuf.prototype.put = function (val, len) {
    for (var i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1);
  };

  function chooseVersion(len) {
    for (var v = 1; v <= 10; v++) {
      var spec = VERSIONS[v];
      var ecTotal = spec.blocks.reduce(function (n, b) { return n + b[0]; }, 0) * spec.ecPerBlock;
      var capacity = spec.total - ecTotal;
      var header = 4 + (v < 10 ? 8 : 16);          /* mode + length field */
      if (len + Math.ceil(header / 8) <= capacity) return v;
    }
    throw new Error('AmentiQR: ' + len + ' bytes is more than version 10 holds (213).');
  }

  function codewords(bytes, version) {
    var spec = VERSIONS[version];
    var ecTotal = spec.blocks.reduce(function (n, b) { return n + b[0]; }, 0) * spec.ecPerBlock;
    var dataCap = spec.total - ecTotal;

    var buf = new BitBuf();
    buf.put(4, 4);                                   /* byte mode */
    buf.put(bytes.length, version < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) buf.put(bytes[i], 8);

    /* terminator, then pad to a byte, then the alternating pad bytes */
    var room = dataCap * 8;
    for (var t = 0; t < 4 && buf.bits.length < room; t++) buf.bits.push(0);
    while (buf.bits.length % 8) buf.bits.push(0);

    var data = [];
    for (var b = 0; b < buf.bits.length; b += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | buf.bits[b + k];
      data.push(byte);
    }
    var pads = [0xec, 0x11], p = 0;
    while (data.length < dataCap) data.push(pads[p++ % 2]);

    /* split into blocks, compute EC per block, then INTERLEAVE */
    var dBlocks = [], eBlocks = [], at = 0;
    spec.blocks.forEach(function (grp) {
      for (var n = 0; n < grp[0]; n++) {
        var chunk = data.slice(at, at + grp[1]); at += grp[1];
        dBlocks.push(chunk);
        eBlocks.push(ecFor(chunk, spec.ecPerBlock));
      }
    });

    var out = [], maxD = Math.max.apply(null, dBlocks.map(function (x) { return x.length; }));
    for (var c = 0; c < maxD; c++)
      for (var bi = 0; bi < dBlocks.length; bi++)
        if (c < dBlocks[bi].length) out.push(dBlocks[bi][c]);
    for (var c2 = 0; c2 < spec.ecPerBlock; c2++)
      for (var bj = 0; bj < eBlocks.length; bj++) out.push(eBlocks[bj][c2]);

    return out;
  }

  /* ── the matrix ───────────────────────────────────────────────────────── */
  function blank(size) {
    var m = [], r;
    for (r = 0; r < size; r++) m.push(new Array(size).fill(null));
    return m;
  }

  function placeFinder(m, res, row, col) {
    for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
      var rr = row + r, cc = col + c;
      if (rr < 0 || cc < 0 || rr >= m.length || cc >= m.length) continue;
      var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
               (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
               (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      m[rr][cc] = on ? 1 : 0;
      res[rr][cc] = true;
    }
  }

  function build(version, cw) {
    var size = version * 4 + 17;
    var m = blank(size), res = blank(size);
    for (var i = 0; i < size; i++) res[i].fill(false);

    placeFinder(m, res, 0, 0);
    placeFinder(m, res, 0, size - 7);
    placeFinder(m, res, size - 7, 0);

    /* timing */
    for (var t = 8; t < size - 8; t++) {
      m[6][t] = m[t][6] = (t % 2 === 0) ? 1 : 0;
      res[6][t] = res[t][6] = true;
    }

    /* alignment, skipping the three finder corners */
    var A = VERSIONS[version].align;
    for (var a = 0; a < A.length; a++) for (var b = 0; b < A.length; b++) {
      var ar = A[a], ac = A[b];
      if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 9) || (ar >= size - 9 && ac <= 8)) continue;
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
        m[ar + dr][ac + dc] = (Math.max(Math.abs(dr), Math.abs(dc)) !== 1) ? 1 : 0;
        res[ar + dr][ac + dc] = true;
      }
    }

    /* the dark module, and reserve the format areas */
    m[size - 8][8] = 1; res[size - 8][8] = true;
    for (var f = 0; f < 9; f++) {
      if (m[8][f] === null) { m[8][f] = 0; } res[8][f] = true;
      if (m[f][8] === null) { m[f][8] = 0; } res[f][8] = true;
    }
    for (var g = 0; g < 8; g++) {
      res[8][size - 1 - g] = true; if (m[8][size - 1 - g] === null) m[8][size - 1 - g] = 0;
      res[size - 1 - g][8] = true; if (m[size - 1 - g][8] === null) m[size - 1 - g][8] = 0;
    }

    /* version information, versions 7 and up */
    if (version >= 7) {
      var vd = version << 12, vv = version << 12;
      for (var vi = 0; vi < 6; vi++) if (vv & (1 << (17 - vi))) vv ^= 0x1f25 << (5 - vi);
      var vbits = vd | (vv & 0xfff);
      for (var p = 0; p < 18; p++) {
        var bit = (vbits >> p) & 1;
        var rr = Math.floor(p / 3), cc = p % 3;
        m[rr][size - 11 + cc] = bit; res[rr][size - 11 + cc] = true;
        m[size - 11 + cc][rr] = bit; res[size - 11 + cc][rr] = true;
      }
    }

    /* the data, snaking up and down in two-column strips */
    var bits = [];
    for (var ci = 0; ci < cw.length; ci++) for (var k = 7; k >= 0; k--) bits.push((cw[ci] >> k) & 1);

    var idx = 0, upward = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;                       /* skip the timing column */
      for (var n = 0; n < size; n++) {
        var row = upward ? size - 1 - n : n;
        for (var s = 0; s < 2; s++) {
          var c3 = col - s;
          if (res[row][c3]) continue;
          m[row][c3] = idx < bits.length ? bits[idx++] : 0;
        }
      }
      upward = !upward;
    }
    return { m: m, res: res, size: size };
  }

  var MASKS = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r)    { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return ((r * c) % 2) + ((r * c) % 3) === 0; },
    function (r, c) { return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; },
    function (r, c) { return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; }
  ];

  function formatBits(mask) {
    var data = (0x00 << 3) | mask;               /* 00 = level M */
    var rem = data << 10;
    for (var i = 14; i >= 10; i--) if (rem & (1 << i)) rem ^= 0x537 << (i - 10);
    return ((data << 10) | rem) ^ 0x5412;
  }

  /* The 15 format bits are written TWICE, so a damaged corner still yields the
     mask and EC level. Bit 0 is the LSB.

     THE TWO COPIES ARE NOT MIRROR IMAGES OF EACH OTHER, and writing them as if
     they were is the bug this comment exists to prevent. The first version of
     this function transposed them — LSB into the horizontal run instead of the
     vertical — and produced a code that differed from a reference encoder by
     exactly 8 modules. Eight. The square looked perfect. Some phones would
     have read it and some would not, and there would have been no way to tell
     which from looking.

       vertical   (column 8, reading down the left):
         i 0–5  -> [i][8]        i 6–7 -> [i+1][8]     (skips the timing row)
         i 8–14 -> [size-15+i][8]
       horizontal (row 8, reading in from the right):
         i 0–7  -> [8][size-1-i]  i = 8 -> [8][7]      (skips the timing col)
         i 9–14 -> [8][14-i]                                                 */
  function applyFormat(m, size, mask) {
    var f = formatBits(mask), i, bit;

    for (i = 0; i < 15; i++) {
      bit = (f >> i) & 1;
      if (i < 6) m[i][8] = bit;
      else if (i < 8) m[i + 1][8] = bit;
      else m[size - 15 + i][8] = bit;
    }
    for (i = 0; i < 15; i++) {
      bit = (f >> i) & 1;
      if (i < 8) m[8][size - 1 - i] = bit;
      else if (i < 9) m[8][7] = bit;
      else m[8][14 - i] = bit;
    }
    m[size - 8][8] = 1;                     /* the dark module, always set */
  }

  /* the four penalty rules — the standard's own definition of "readable" */
  function penalty(m, size) {
    var p = 0, r, c, i, run, dark = 0;
    for (r = 0; r < size; r++) {
      run = 1;
      for (c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) { run++; } else { if (run >= 5) p += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (c = 0; c < size; c++) {
      run = 1;
      for (r = 1; r < size; r++) {
        if (m[r][c] === m[r - 1][c]) { run++; } else { if (run >= 5) p += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) {
      var v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
    }
    var PAT1 = [1,0,1,1,1,0,1,0,0,0,0], PAT2 = [0,0,0,0,1,0,1,1,1,0,1];
    function scan(get, n) {
      for (var s = 0; s + 11 <= n; s++) {
        var a = true, b = true;
        for (i = 0; i < 11; i++) { var x = get(s + i); if (x !== PAT1[i]) a = false; if (x !== PAT2[i]) b = false; }
        if (a) p += 40; if (b) p += 40;
      }
    }
    for (r = 0; r < size; r++) scan(function (i2) { return m[r][i2]; }, size);
    for (c = 0; c < size; c++) scan(function (i2) { return m[i2][c]; }, size);
    for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r][c]) dark++;
    p += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
    return p;
  }

  function matrix(text) {
    var bytes = utf8(String(text));
    var version = chooseVersion(bytes.length);
    var cw = codewords(bytes, version);
    var built = build(version, cw), size = built.size;

    var best = null, bestScore = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      var cand = built.m.map(function (row) { return row.slice(); });
      for (var r = 0; r < size; r++) for (var c = 0; c < size; c++)
        if (!built.res[r][c] && MASKS[mk](r, c)) cand[r][c] ^= 1;
      applyFormat(cand, size, mk);
      var s = penalty(cand, size);
      if (s < bestScore) { bestScore = s; best = cand; }
    }
    return best;
  }

  /* ── the picture ──────────────────────────────────────────────────────── */
  function svg(text, opts) {
    opts = opts || {};
    var m = matrix(text), n = m.length;
    var quiet = opts.quiet == null ? 4 : opts.quiet;      /* the standard's margin */
    var total = n + quiet * 2;
    var px = opts.size || 220;
    var dark = opts.dark || '#08090e';
    var light = opts.light || '#ffffff';

    /* one <path> of runs, not n² <rect>s — a v10 code would be 3,000 elements */
    var d = '';
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (!m[r][c]) { c++; continue; }
        var start = c;
        while (c < n && m[r][c]) c++;
        d += 'M' + (start + quiet) + ' ' + (r + quiet) + 'h' + (c - start) + 'v1h-' + (c - start) + 'z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px +
           '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img" ' +
           'aria-label="QR code linking to this page">' +
           '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
           '<path d="' + d + '" fill="' + dark + '"/></svg>';
  }

  /* ── the panel ────────────────────────────────────────────────────────────
     Renders into #amenti-handover if it exists. Encodes location.href, so the
     code carries whichever tab, figure or reading room the reader is on.

     THE QUIET ZONE AND THE WHITE BACKGROUND ARE NOT DECORATION. A QR on a dark
     background with no margin is the single most common reason a code does not
     scan. The site is near-black; the code stays on white. */
  /* ── THE PANEL ────────────────────────────────────────────────────────────
     Two shapes, because the right one depends on the page.

     'full'  — plate, heading, copy, share. For a page with room for it.
     'quiet' — ONE SMALL LINE. The code appears only when someone asks. This is
               the default, and it is the default because the first version was
               not: a 200px plate with a paragraph and two buttons went onto a
               page that is a title and a question over a slow pyramid, and it
               ate the page. A hand-over is a thing you reach for once, at the
               end. It should not outweigh the reason anyone came.

     Encodes location.href at draw time, so it survives a move of domain. */
  /* ── TAGGING THE ARRIVAL ───────────────────────────────────────────────
     A scan is a SURFACE — a place a person acts on the system, and the only
     one that begins entirely off it. SPEC-SURFACES §4.

     ?via=qr makes a scan countable: the visit reading already carries a `via`
     field, so every arrival by code separates from a typed one, and a poster,
     a placard and a card can each carry their own value later. The page
     ignores an unknown parameter, so nothing changes for a reader.

     WHY IT IS DONE HERE AND NOT IN THE PRINTED URL: this widget encodes
     location.href at draw time — it hands over whatever the reader is
     currently looking at. There is no fixed printed URL to tag. So the tag is
     added to the current address as the code is drawn.

     Never doubled: an address that already carries a via is left alone, so a
     reader who arrived by QR and hands the page on does not become qr twice.
     The hash is preserved and kept last, because a query after a fragment is
     not a query. */
  function withVia(u, tag) {
    try {
      var hash = '', i = u.indexOf('#');
      if (i > -1) { hash = u.slice(i); u = u.slice(0, i); }
      if (/[?&]via=/.test(u)) return u + hash;
      return u + (u.indexOf('?') > -1 ? '&' : '?') + 'via=' + encodeURIComponent(tag) + hash;
    } catch (e) { return u; }
  }

  function mount(el, url, label, mode) {
    url = withVia(url || global.location.href, el.getAttribute('data-via') || 'qr');
    label = label || 'Hand it over';
    mode = mode || el.getAttribute('data-mode') || 'quiet';

    var s;
    try { s = svg(url, { size: mode === 'quiet' ? 148 : 200 }); }
    catch (e) {
      /* EMPTY GLASS: say there is no code rather than showing a broken one */
      el.innerHTML = '<div class="aqr-none">No code — this address is too long to encode.</div>';
      return;
    }

    if (mode === 'quiet') {
      el.innerHTML =
        '<div class="aqr-q">' +
          '<button type="button" class="aqr-toggle" aria-expanded="false">' +
            '<span class="aqr-glyph" aria-hidden="true">▚</span>' + esc(label) +
          '</button>' +
          '<div class="aqr-drop" hidden>' +
            '<div class="aqr-plate">' + s + '</div>' +
            '<button type="button" class="aqr-mini" data-aqr="copy">copy link</button>' +
          '</div>' +
        '</div>';
      var tog = el.querySelector('.aqr-toggle'), drop = el.querySelector('.aqr-drop');
      tog.addEventListener('click', function () {
        var open = drop.hasAttribute('hidden');
        if (open) drop.removeAttribute('hidden'); else drop.setAttribute('hidden', '');
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    } else {
      el.innerHTML =
        '<div class="aqr">' +
          '<div class="aqr-plate">' + s + '</div>' +
          '<div class="aqr-side">' +
            '<div class="aqr-k">' + esc(label) + '</div>' +
            '<div class="aqr-v">Point a camera at this and Amenti opens where you are standing.</div>' +
            '<div class="aqr-row">' +
              '<button type="button" class="aqr-btn" data-aqr="copy">Copy link</button>' +
              (global.navigator && global.navigator.share
                ? '<button type="button" class="aqr-btn ghost" data-aqr="share">Share</button>' : '') +
            '</div>' +
            '<div class="aqr-url"></div>' +
          '</div>' +
        '</div>';
      el.querySelector('.aqr-url').textContent = url;
    }

    var copy = el.querySelector('[data-aqr="copy"]');
    if (copy) {
      var was = copy.textContent;
      copy.addEventListener('click', function () {
        var done = function () { copy.textContent = 'copied'; setTimeout(function () { copy.textContent = was; }, 1600); };
        if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { copy.textContent = 'copy failed'; });
        } else {
          /* older iOS Safari has no clipboard API in some contexts */
          var ta = document.createElement('textarea');
          ta.value = url; ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:absolute;left:-9999px';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e2) { copy.textContent = 'copy failed'; }
          ta.remove();
        }
      });
    }

    var share = el.querySelector('[data-aqr="share"]');
    if (share) share.addEventListener('click', function () {
      navigator.share({ title: document.title, url: url }).catch(function () {});
    });
  }

  function esc(s2) {
    return String(s2 == null ? '' : s2).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var CSS =
    /* quiet: a line of text that opens a small code. The default. */
    '.aqr-q{display:inline-flex;flex-direction:column;align-items:center;gap:10px}' +
    '.aqr-toggle{background:none;border:0;padding:0;cursor:pointer;font:inherit;' +
      'color:inherit;opacity:.55;letter-spacing:.08em;transition:opacity .2s}' +
    '.aqr-toggle:hover,.aqr-toggle[aria-expanded="true"]{opacity:.95}' +
    '.aqr-glyph{margin-right:.5em;font-size:.9em}' +
    '.aqr-drop{display:flex;flex-direction:column;align-items:center;gap:8px}' +
    '.aqr-mini{background:none;border:0;padding:0;cursor:pointer;font:inherit;' +
      'font-size:.8em;color:inherit;opacity:.45;letter-spacing:.06em}' +
    '.aqr-mini:hover{opacity:.8}' +
    /* the plate is white in both modes, always. see the note in mount(). */
    '.aqr-plate{background:#fff;padding:10px;border-radius:8px;line-height:0;flex:0 0 auto}' +
    '.aqr-plate svg{display:block}' +
    /* full: the larger panel, for pages with room */
    '.aqr{display:flex;gap:22px;align-items:center;flex-wrap:wrap;' +
      'background:var(--granite,#11131c);border:1px solid var(--slate,#232838);' +
      'border-radius:12px;padding:20px 22px}' +
    '.aqr-side{flex:1 1 240px;min-width:0}' +
    '.aqr-k{font-family:var(--disp,serif);letter-spacing:.16em;text-transform:uppercase;' +
      'font-size:15px;color:var(--gold-b,#f5c542)}' +
    '.aqr-v{font-size:15px;color:var(--text,#c8ccdc);margin-top:6px;max-width:44ch}' +
    '.aqr-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}' +
    '.aqr-btn{font-family:var(--disp,serif);font-size:14px;letter-spacing:.12em;' +
      'text-transform:uppercase;color:#08090e;background:var(--gold-b,#f5c542);' +
      'border:0;border-radius:6px;padding:10px 18px;cursor:pointer}' +
    '.aqr-btn.ghost{background:transparent;color:var(--gold-b,#f5c542);' +
      'border:1px solid var(--slate,#232838)}' +
    '.aqr-btn:hover{opacity:.88}' +
    '.aqr-url{font-family:var(--mono,monospace);font-size:12px;color:var(--dim,#8f95ab);' +
      'margin-top:12px;overflow-wrap:anywhere}' +
    '.aqr-none{font-family:var(--mono,monospace);font-size:13px;color:var(--dim,#8f95ab)}' +
    '@media(max-width:560px){.aqr{gap:16px;padding:16px}.aqr-side{flex-basis:100%}}';

  function autoMount() {
    var el = document.getElementById('amenti-handover');
    if (!el) return;
    if (!document.getElementById('amenti-qr-css')) {
      var st = document.createElement('style');
      st.id = 'amenti-qr-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    mount(el, el.getAttribute('data-url') || null,
              el.getAttribute('data-label') || null,
              el.getAttribute('data-mode') || null);
  }

  global.AmentiQR = { matrix: matrix, svg: svg, mount: mount, css: CSS, withVia: withVia };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
    else autoMount();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = global.AmentiQR;

})(typeof window !== 'undefined' ? window : globalThis);
