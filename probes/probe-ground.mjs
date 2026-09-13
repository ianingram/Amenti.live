/* ============================================================================
   probe-ground.mjs  →  Amenti.live/probes/probe-ground.mjs
   ----------------------------------------------------------------------------
   WHAT THE GROUND IS WORTH, IN PIXELS

   The prologue draws REGION.jpg and frames down to six degrees of longitude,
   which is a 1.85x upscale on a retina panel. The coast goes soft exactly
   where a reader most needs it — and NOBODY COULD SAY WHETHER A BETTER FILE
   WAS ALREADY ABOARD, because the answer lived in four files nobody had
   measured.

   This measures them. It reads the JPEG headers directly — no decoding, no
   browser, no console that hangs — and reports what each image can carry at
   each frame the registers actually ask for.

   IT MEASURES; IT DOES NOT FIX. If a bigger file is aboard, it says so and
   names it. If none is, it says how big one would have to be. Either way the
   decision stays with whoever is reading.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || '.';
const OUT  = process.argv[3] || 'probe-ground.txt';

/* the theatre REGION.jpg is cut to, as the prologue states it */
const RLO0 = 21.0, RLO1 = 37.5, RLA0 = 33.5, RLA1 = 42.0;
/* the map box, in CSS pixels, and the panel a retina display really draws */
const BOX_CSS = 760, DPR = 2;

const line = [];
const say  = (s = '') => line.push(s);

/* ── a JPEG says its own size in its SOF marker, and nothing has to decode ── */
function jpegSize(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) { return null; }
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i + 1];
    /* SOF0..SOF15, skipping the four that are not frame headers */
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504E47) { return null; }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/* ── what the registers actually ask of the ground ────────────────────────── */
function frames(root) {
  const out = [{ name: 'the whole theatre', deg: RLO1 - RLO0, from: 'the default' }];
  const f = path.join(root, 'ATTICA-PROLOGUE.csv');
  if (!fs.existsSync(f)) { return out; }
  const raw = fs.readFileSync(f, 'utf8').split('\n').filter(l => l[0] !== '#');
  const head = split(raw[0]);
  const iF = head.indexOf('frame'), iI = head.indexOf('inset'), iS = head.indexOf('seq');
  raw.slice(1).filter(l => l.trim()).forEach(l => {
    const c = split(l);
    [[iF, 'frame'], [iI, 'inset']].forEach(([ix, kind]) => {
      if (ix < 0 || !c[ix]) { return; }
      const p = c[ix].split('>');
      if (p.length !== 2) { return; }
      const lo = p.map(q => parseFloat(q.split('|')[1]));
      const la = p.map(q => parseFloat(q.split('|')[0]));
      /* squared to the box the way the surface squares it */
      const asp = (RLO1 - RLO0) / (RLA1 - RLA0);
      let w = Math.abs(lo[1] - lo[0]), h = Math.abs(la[1] - la[0]);
      if (w / h <= asp) { w = h * asp; }
      out.push({ name: `slide ${c[iS]} ${kind}`, deg: w, from: kind,
                 box: kind === 'inset' ? 242 : BOX_CSS });
    });
  });
  return out;
}
function split(l) {
  const c = []; let cur = '', q = false;
  for (const ch of l) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
    cur += ch;
  }
  c.push(cur); return c;
}

/* ── read every image in the root ─────────────────────────────────────────── */
const imgs = fs.readdirSync(ROOT)
  .filter(f => /\.(jpe?g|png)$/i.test(f))
  .map(f => {
    const p = path.join(ROOT, f);
    const st = fs.statSync(p);
    const fd = fs.openSync(p, 'r');
    const buf = Buffer.alloc(Math.min(st.size, 262144));
    fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const d = /\.png$/i.test(f) ? pngSize(buf) : jpegSize(buf);
    return { f, kb: st.size / 1024, w: d && d.w, h: d && d.h };
  })
  .sort((a, b) => (b.w || 0) - (a.w || 0));

say('═══ THE GROUND, MEASURED ═══');
say('');
say(`  read ${new Date().toISOString()}`);
say(`  root ${path.resolve(ROOT)}`);
say('');

if (!imgs.length) {
  say('  NO IMAGES IN THIS ROOT. Point the probe at the repository:');
  say('      node probes/probe-ground.mjs .');
  fs.writeFileSync(OUT, line.join('\n') + '\n');
  console.log(line.join('\n'));
  process.exit(0);
}

say('  FILE                      PIXELS            SIZE     DEG/PX at 16.5°');
say('  ' + '─'.repeat(68));
imgs.forEach(i => {
  const pd = i.w ? (i.w / (RLO1 - RLO0)).toFixed(0) + ' px/deg' : '—';
  say('  ' + i.f.padEnd(25) +
      (i.w ? `${i.w} x ${i.h}`.padEnd(18) : 'unreadable'.padEnd(18)) +
      (i.kb > 1024 ? (i.kb / 1024).toFixed(2) + ' MB' : i.kb.toFixed(0) + ' KB').padEnd(9) +
      pd);
});
say('');

/* ── the one the prologue actually draws ──────────────────────────────────── */
const region = imgs.find(i => /^REGION\.jpe?g$/i.test(i.f));
if (!region || !region.w) {
  say('  REGION.jpg IS NOT HERE, or its header could not be read.');
  say('  It is the file the prologue draws — everything below assumes it.');
} else {
  const fr = frames(ROOT);
  say('  WHAT REGION.jpg CAN CARRY, AT THE FRAMES THE REGISTER ASKS FOR');
  say('  ' + '─'.repeat(68));
  say('  FRAME                     DEG     SOURCE PX   DEVICE PX   SCALE');
  let worst = null;
  fr.forEach(f => {
    const src = region.w * (f.deg / (RLO1 - RLO0));
    const dev = (f.box || BOX_CSS) * DPR;
    const k   = dev / src;
    if (!worst || k > worst.k) { worst = { ...f, k, src }; }
    say('  ' + f.name.padEnd(25) +
        f.deg.toFixed(1).padEnd(8) +
        src.toFixed(0).padEnd(12) +
        dev.toFixed(0).padEnd(12) +
        (k > 1 ? k.toFixed(2) + 'x UP' : k.toFixed(2) + 'x'));
  });
  say('');

  /* is a better file already aboard? */
  const better = imgs.filter(i => i.w && i.w > region.w * 1.3 &&
                                  !/^RELIEF/i.test(i.f));
  if (better.length) {
    say('  ── A BIGGER FILE IS ABOARD ─────────────────────────────────────');
    better.forEach(b => {
      /* if it is the world, only a slice of it is the theatre */
      const isWorld = Math.abs(b.w / b.h - 2) < 0.08;
      const across  = isWorld ? b.w * ((RLO1 - RLO0) / 360) : b.w;
      say(`  ${b.f}: ${b.w} x ${b.h}` +
          (isWorld ? '  — the whole world, so the theatre is only '
                   + across.toFixed(0) + ' px of it' : ''));
      say('      ' + (across > region.w
        ? `WORTH RE-CUTTING: ${(across / region.w).toFixed(2)}x what REGION.jpg holds.`
        : `NOT WORTH IT: ${(across / region.w).toFixed(2)}x — smaller than REGION.jpg already is.`));
    });
  } else {
    say('  ── NOTHING BIGGER IS ABOARD ────────────────────────────────────');
    say('  No image in this root holds more of the theatre than REGION.jpg.');
  }
  say('');

  if (worst && worst.k > 1) {
    const need = Math.ceil(region.w * worst.k / 100) * 100;
    say('  ── WHAT WOULD CLEAR IT ─────────────────────────────────────────');
    say(`  The tightest frame is ${worst.name} at ${worst.deg.toFixed(1)}°,`);
    say(`  upscaling ${worst.k.toFixed(2)}x. A REGION.jpg of about ${need} px`);
    say('  across would draw it at 1:1 on a retina panel.');
    say('');
    say('  THE BOUNDS DO NOT CHANGE: lon 21.0 to 37.5, lat 33.5 to 42.0.');
    say('  Same crop, same filename, more pixels — and no code changes.');
  } else {
    say('  Every frame the register asks for is drawn at or below 1:1.');
    say('  THE SOFTNESS, IF ANY, IS NOT RESOLUTION.');
  }
}

say('');
say('  ── WHAT THIS PROBE DOES NOT KNOW ───────────────────────────────────');
say('  Whether a file is SHARP, only whether it is LARGE. An upscaled export');
say('  measures as big and draws as soft, and nothing here can tell them');
say('  apart. If REGION.jpg is already large and still mushy, it was grown');
say('  from something smaller and the pixels were never there.');

const text = line.join('\n') + '\n';
fs.writeFileSync(OUT, text);
console.log(text);
