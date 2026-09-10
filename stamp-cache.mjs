#!/usr/bin/env node
/* ============================================================================
   stamp-cache.mjs  ·  END THE CACHE GREMLIN  ·  Standing Slip #26
   ----------------------------------------------------------------------------
   The problem: every <script src="x.js?v=1"> carried a FIXED version. GitHub
   Pages sends cache-control: max-age=600, so a browser holds the old file for
   ten minutes, query string or none. A changed file with an UNCHANGED ?v= is
   the same URL to the cache \u2014 so "nothing changed" even when it did.

   The cure: make ?v= the file's CONTENT HASH. Change the file, the hash
   changes, the URL changes, the cache is bypassed automatically \u2014 no
   hard-reload, no ten-minute wait, ever.

   What it does: for every HTML file given (or all *.html in cwd), find each
   local  src="NAME?v=..."  or  href="NAME?v=..."  where NAME is a file that
   exists on disk, compute that file's 8-char content hash, and rewrite the
   version to it. Idempotent: unchanged files get the same hash, so re-running
   is a no-op. External URLs (http...) and missing files are left untouched.

   Run:  node stamp-cache.mjs            # stamps every .html in the folder
         node stamp-cache.mjs hall.html  # just one
         node stamp-cache.mjs --check    # exit 1 if any stamp is stale (a probe)

   -- AND IT ONLY EVER SAW TAGS THAT ALREADY CARRIED A ?v= · 10 Sep ---------
   The pattern above matches src="NAME?v=..." . A LOCAL SCRIPT WITH NO ?v= AT
   ALL WAS INVISIBLE TO IT, and being invisible is indistinguishable from
   being fine.

   That cost an hour on 10 September. Two modules were added with plain tags,
   the stamper passed them over in silence, and the browser served a stale copy
   three times running while everybody looked for a cache bug. There was no
   cache bug. There was a tag that had never opted in.

       A TOOL THAT SILENTLY SKIPS WHAT IT CANNOT HELP WITH LOOKS EXACTLY LIKE
       A TOOL THAT FOUND NOTHING WRONG.

   So it now finds the unstamped ones too. `--check` fails on them, and a plain
   run ADDS the ?v= rather than only refreshing one, because a stamp nobody has
   to remember to type is the whole point of the file.
   ========================================================================== */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter(a => !a.startsWith('--'));
const htmls = files.length ? files
  : fs.readdirSync('.').filter(f => f.endsWith('.html'));

function hash(file) {
  try { return crypto.createHash('sha1')
    .update(fs.readFileSync(file)).digest('hex').slice(0, 8); }
  catch { return null; }
}

let changed = 0, stale = 0, stamped = 0, adopted = 0, bare = 0;

/* a local .js or .css reference with NO version at all. Same shape as the
   stamped pattern minus the query, and it must NOT match one that already has
   a ?v= — hence the negative lookahead on the quote. */
const BARE = /((?:src|href)=")([^"?]+?\.(?:js|css))(")/g;

for (const html of htmls) {
  let src;
  try { src = fs.readFileSync(html, 'utf8'); }
  catch { console.error('  skip (unreadable): ' + html); continue; }

  const out = src.replace(
    /((?:src|href)=")([^"?]+?\.(?:js|css))\?v=([^"]*)(")/g,
    (m, pre, file, ver, post) => {
      /* only stamp LOCAL files that exist on disk beside the html */
      const abs = path.join(path.dirname(html), file);
      const h = hash(abs);
      if (!h) return m;                      /* file not found \u2014 leave alone */
      stamped++;
      if (ver !== h) { changed++; if (check) { stale++;
        console.error('  STALE  ' + html + ' :: ' + file + '  ?v=' + ver + ' -> ' + h); } }
      return pre + file + '?v=' + h + post;
    }
  );

  /* ── THE ONES THAT NEVER OPTED IN ──────────────────────────────────────
     Run AFTER the stamping pass, over the already-stamped text, so a tag that
     just received a hash is not counted twice. */
  const out2 = out.replace(BARE, (m, pre, file, post) => {
    const abs = path.join(path.dirname(html), file);
    const h = hash(abs);
    if (!h) return m;                        /* not ours — leave alone */
    bare++;
    if (check) {
      console.error('  UNSTAMPED  ' + html + ' :: ' + file +
                    '  — no ?v= at all, so this tool has never touched it and ' +
                    'the browser will serve a stale copy after every edit');
      return m;
    }
    adopted++;
    return pre + file + '?v=' + h + post;
  });

  if (out2 !== src && !check) {
    fs.writeFileSync(html, out2);
    console.log('  stamped ' + html);
  }
}

if (check) {
  if (stale || bare) {
    if (stale) { console.error('\n\u2717 ' + stale + ' stale ?v= stamp(s).'); }
    if (bare) { console.error('\u2717 ' + bare + ' local script(s) with NO ?v= at all \u2014 ' +
      'invisible to this tool until now, and stale in every browser after every edit.'); }
    console.error('  Run stamp-cache.mjs and commit.');
    process.exit(1);
  }
  console.log('\u2713 all ' + stamped + ' cache stamps are current, and no tag is unstamped.');
} else {
  console.log('done \u2014 ' + stamped + ' references checked, ' + changed + ' updated, ' +
              adopted + ' newly stamped.');
}
