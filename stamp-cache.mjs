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

let changed = 0, stale = 0, stamped = 0;

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

  if (out !== src && !check) {
    fs.writeFileSync(html, out);
    console.log('  stamped ' + html);
  }
}

if (check) {
  if (stale) { console.error('\n\u2717 ' + stale + ' stale ?v= stamp(s). Run stamp-cache.mjs and commit.'); process.exit(1); }
  console.log('\u2713 all ' + stamped + ' cache stamps are current.');
} else {
  console.log('done \u2014 ' + stamped + ' references checked, ' + changed + ' updated.');
}
