#!/usr/bin/env node
/* ============================================================================
   tools/bundle-briefs.js  ·  THE BUNDLE
   ----------------------------------------------------------------------------
   Concatenates every brief in this repository into one plain-text file,
   BRIEFS.txt, with a table of contents and clean separators.

     node tools/bundle-briefs.js            # writes BRIEFS.txt
     node tools/bundle-briefs.js --check    # report only

   ── WHY ───────────────────────────────────────────────────────────────────
   Forty-one briefs. Six weeks of accounts written on the shop floor, and the
   only reader they have ever had is the person who wrote them.

   THE AUTHOR OF THE BOOK CANNOT REACH THEM. Not for want of permission —
   they are public — but because a session begins with nothing and its fetch
   only accepts URLs it has already seen. So every session has begun with an
   hour of the captain pasting files by hand, and on 18 August a whole working
   night was spent that way.

   ONE FILE CAN BE HANDED OVER IN ONE ACTION. That is the entire idea.

   ── WHY PLAIN TEXT, AND WHY GENERATED ─────────────────────────────────────
   HTML tags are noise to a reader that only wants the prose, and forty-one
   files of markup would crowd out the thing being read. So the tags come out
   and the words stay.

   And it is GENERATED, never typed. A hand-kept list of forty-one files goes
   stale the moment a forty-second is written — which is exactly how the hub's
   Engineering tab came to show eight of forty-one and say nothing about it.

   ── WHAT IT DOES NOT DO ───────────────────────────────────────────────────
   It does not summarise, rewrite, or update anything. A brief is a shop-floor
   account of one Tuesday, and its value is that it was written that Tuesday.
   This copies the words and records the date. Nothing else.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT  = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const CHECK = process.argv.includes('--check');
const OUT   = path.join(ROOT, 'BRIEFS.txt');

/* ── HTML TO PROSE ────────────────────────────────────────────────────────
   Deliberately small. Scripts and styles go entirely — they are the machinery
   of the page, not the account. Block elements become line breaks so the
   paragraphs survive. Everything else is unwrapped. */
function prose(html) {
  let t = html;
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  t = t.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, '');
  t = t.replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote|pre)>/gi, '\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/t[dh]>/gi, '  ');
  t = t.replace(/<li[^>]*>/gi, '  · ');
  t = t.replace(/<h([1-3])[^>]*>/gi, '\n\n');
  t = t.replace(/<[^>]+>/g, '');
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
       .replace(/&mdash;/g, '—').replace(/&middot;/g, '·').replace(/&rsquo;/g, '\u2019');
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n[ \t]+/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/* WHEN was it written. The value of a shop-floor account is the Tuesday it
   describes, so the date is not decoration — it is the reader's only way to
   know which Tuesday they are standing in. Taken from git, not from the file. */
function firstCommit(rel) {
  try {
    const d = cp.execSync(
      'git log --diff-filter=A --follow --format=%ad --date=short -1 -- ' + JSON.stringify(rel),
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString().trim();
    return d || null;
  } catch { return null; }
}
function lastCommit(rel) {
  try {
    const d = cp.execSync(
      'git log --format=%ad --date=short -1 -- ' + JSON.stringify(rel),
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString().trim();
    return d || null;
  } catch { return null; }
}
function titleOf(html, fallback) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
         || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return fallback;
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || fallback;
}

/* ── WALK ─────────────────────────────────────────────────────────────── */
const files = fs.readdirSync(ROOT)
  .filter(f => /\.html?$/i.test(f))
  .filter(f => f.toLowerCase() !== 'index.html')
  .sort();

if (!files.length) { console.error('REFUSES: no briefs found in ' + path.resolve(ROOT)); process.exit(2); }

const briefs = files.map(f => {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const body = prose(html);
  return {
    file: f,
    title: titleOf(html, f.replace(/\.html?$/i, '').replace(/[_-]+/g, ' ')),
    written: firstCommit(f),
    touched: lastCommit(f),
    words: body.split(/\s+/).filter(Boolean).length,
    body,
  };
});

const totalWords = briefs.reduce((n, b) => n + b.words, 0);
const RULE = '='.repeat(78);

const out = [];
out.push(RULE);
out.push('  THE AMENTI TECHNICAL BRIEFS');
out.push('  ' + briefs.length + ' accounts · ' + totalWords.toLocaleString() + ' words · bundled ' +
         new Date().toISOString().slice(0, 10));
out.push(RULE);
out.push('');
out.push('  GENERATED by tools/bundle-briefs.js. Do not edit this file — edit the');
out.push('  briefs. Every word below was copied, not written; the markup was removed');
out.push('  and nothing else was changed.');
out.push('');
out.push('  THESE ARE SHOP-FLOOR ACCOUNTS, NOT MANUALS. Each one is correct about the');
out.push('  day it was written and makes no claim about today. The WRITTEN date on each');
out.push('  is the reader\u2019s only way to know which day they are standing in — a brief');
out.push('  from July describing an architecture that has since moved is not wrong, it');
out.push('  is evidence.');
out.push('');
out.push(RULE);
out.push('  CONTENTS');
out.push(RULE);
out.push('');
briefs.forEach((b, i) => {
  out.push('  ' + String(i + 1).padStart(2) + '. ' + b.title);
  out.push('      ' + b.file + '   ' + (b.written || 'undated') +
           '   ' + b.words.toLocaleString() + ' words');
});
out.push('');

briefs.forEach((b, i) => {
  out.push('');
  out.push(RULE);
  out.push('  BRIEF ' + (i + 1) + ' OF ' + briefs.length + '  ·  ' + b.title.toUpperCase());
  out.push(RULE);
  out.push('  file     ' + b.file);
  out.push('  written  ' + (b.written || 'unknown'));
  if (b.touched && b.touched !== b.written) out.push('  touched  ' + b.touched);
  out.push('  words    ' + b.words.toLocaleString());
  out.push(RULE);
  out.push('');
  out.push(b.body);
  out.push('');
});

out.push('');
out.push(RULE);
out.push('  END · ' + briefs.length + ' briefs · ' + totalWords.toLocaleString() + ' words');
out.push(RULE);

const text = out.join('\n') + '\n';

/* ── REPORT ─────────────────────────────────────────────────────────────
   Undated briefs are named. A brief with no first-commit date has lost the
   one thing that makes a shop-floor account readable — WHEN. */
console.error('');
briefs.forEach(b => {
  console.error('  ' + (b.written || '  ????  ') + '  ' +
    String(b.words).padStart(6) + 'w  ' + b.file);
});
const undated = briefs.filter(b => !b.written);
console.error('');
console.error('  ' + briefs.length + ' briefs · ' + totalWords.toLocaleString() +
              ' words · ' + Math.round(text.length / 1024) + ' KB');
if (undated.length) {
  console.error('  ' + undated.length + ' UNDATED — git could not say when these were written:');
  undated.forEach(b => console.error('      ' + b.file));
}

if (CHECK) { console.error('\n--check: nothing written'); process.exit(0); }
fs.writeFileSync(OUT, text);
console.error('\nwrote BRIEFS.txt');
