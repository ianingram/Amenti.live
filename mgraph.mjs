#!/usr/bin/env node
/* ============================================================================
   mgraph.mjs · MENTION-GRAPH HARVESTER · Slip #47 #58 #59
   ----------------------------------------------------------------------------
   Bounces a historian's text off the roster constellation and returns the names
   that RESOLVE to a dated point. A match is a CANDIDATE; four mechanical filters
   clear the certain-false, and a short human review settles the rest.

   THE FOUR FILTERS, strongest first:
   1. BORN-AFTER-DEATH — an author cannot name someone born after he died. This
      is the keystone: on Josephus it rejects 1,216 of 1,501 souls, killing every
      anachronistic wrong-name bounce (a later figure sharing a name).
   2. MYTHIC — a reference to a god or patriarch dated before ~3000 BC is a
      citation of scripture/myth, not a person-to-person edge. (Kept separate so
      a project that WANTS scripture-edges can switch it off.)
   3. APPARATUS — a name found only (or mostly) in the translator's footnotes is
      the editor's, not the author's. Detected by editorial phrasing in-window.
   4. COMMON-NAME — a bare first name (John, Marcus) or one usually followed by a
      foreign surname (Ptolemy Menneus) is flagged for review, not auto-drawn.

   Usage:  node mgraph.mjs <authorName> <birthYear> <deathYear> file1.md file2.md ...
   Output: confirmed edges, a short review pile, and the reject tally.

   WHERE THE EDGES LIVE:  mentions/<author>-mentions.json  — one file per author,
   named <author>-mentions.json — NEVER the same name as the room file (library/<slug>.json),
   so an upload can never put one in the wrong folder and overwrite the other. The room links to it via a "mentions" pointer; the graph reads the whole mentions/ folder. This
   keeps the root clean as the harvest grows to every historian aboard.
   ========================================================================== */
import fs from 'fs';

const roster = JSON.parse(fs.readFileSync('RI.json','utf8')).souls;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const EDITOR = /\(return\)|Dr\.\s|Hudson|Reland|Spanheim|Whiston|as we shall learn|taken notice of by|best illustrated|the translator/i;
const COMMON = new Set(['John','Marcus','Joseph','Cornelius','James','Simon','Judas','Mary','Philip','Antonius','Julius','Titus','Mark','Paul','Peter']);

const [authorName, aB, aD, ...files] = process.argv.slice(2);
const AB = Number(aB), AD = Number(aD);
if (!authorName || !files.length) {
  console.error('usage: node mgraph.mjs "Author Name" birth death file.md ...'); process.exit(1);
}

let raw=''; for (const f of files){ try{ raw+=fs.readFileSync(f,'utf8')+' '; }catch{} }
const flat = raw.replace(/\s+/g,' ');

const edges=[], review=[];
let rejDate=0, rejMyth=0, rejAppar=0;
for (const s of roster){
  const n=s.n, b=s.b, d=s.d;
  if (b==null||d==null) continue;
  if (n===authorName || n.endsWith(authorName.split(' ').pop())) { if (n===authorName) continue; }
  if (b > AD) { rejDate++; continue; }               // FILTER 1
  if (b < -3000) { rejMyth++; continue; }            // FILTER 2
  const re = new RegExp('\\b'+esc(n)+'\\b','g');
  let m, clean=0, appar=0, first=-1;
  while((m=re.exec(flat))){
    const w = flat.slice(Math.max(0,m.index-70), m.index+40);
    if (EDITOR.test(w)) appar++;
    else { clean++; if(first<0) first=m.index; }
  }
  if (clean===0) continue;
  if (appar>=clean) { rejAppar++; continue; }        // FILTER 3
  const compound = (flat.match(new RegExp('\\b'+esc(n)+'\\s+[A-Z][a-z]+','g'))||[]).length;
  if (!n.includes(' ') && (COMMON.has(n) || compound >= Math.max(2, clean*0.6))) {  // FILTER 4
    review.push({name:n, key:s.k, clean, ctx: flat.slice(Math.max(0,first-38), first+n.length+38)});
    continue;
  }
  edges.push({from: authorName, to: s.k, named:n, dates:b+'..'+d, count:clean, room:!!s.r});
}
edges.sort((a,b)=>b.count-a.count);

console.log('# mention graph :: '+authorName+' ('+AB+'..'+AD+')');
console.log('# '+edges.length+' auto-confirmed · '+review.length+' to review · rejected '+
            rejDate+' born-after-death, '+rejMyth+' mythic, '+rejAppar+' apparatus\n');
for (const e of edges) console.log('  '+authorName.split(' ').pop().toLowerCase()+' -> '+e.named.padEnd(24)+' '+String(e.count).padStart(4)+'x'+(e.room?'  [room]':''));
if (review.length){ console.log('\n  REVIEW (shared/common name):'); for(const r of review) console.log('    '+r.name.padEnd(18)+' '+r.clean+'x  '+r.ctx.slice(0,44)); }
