#!/usr/bin/env node
/* mention-graph harvest — the three-filter version. Slip #47/#58.
   A substring match is a CANDIDATE; these filters decide which become edges. */
import fs from 'fs';

const roster = JSON.parse(fs.readFileSync('RI.json','utf8')).souls;
const byName = {}; roster.forEach(s => { byName[s.n]=s; });

/* ── FILTER 1 · strip the translator's apparatus ────────────────────────────
   Whiston's footnotes are the editor's, not Josephus's. A name that appears
   ONLY in a note is not an edge. Notes are bracketed spans containing (return)
   or a leading footnote number, plus the numbered note bodies at section ends. */
function stripApparatus(t){
  return t
    .replace(/\[[^\]]*?\(return\)[^\]]*?\]/g,' ')      // [ N (return) ... ]
    .replace(/\(return\)/g,' ')
    .replace(/\[\s*\d+\s*\][^.]*?(?:says|notes?|observes|Dr\.|Reland|Spanheim|Hudson)[^.]*?\./g,' ')
    .replace(/\bSuetonius says\b[^.]*\./g,' ');          // explicit editor citations
}

/* ── FILTER 2 · a bare first name followed by a FOREIGN surname is not ours ──
   "Ptolemy Menneus" is not Ptolemy-the-astronomer. If a single-word roster name
   is immediately followed by a capitalized word that is NOT part of that roster
   name, it is a different person sharing the first name. */
function countClean(name, flat){
  if (name.includes(' ')) {                              // multiword: trust the full match
    return (flat.match(new RegExp('\\b'+esc(name)+'\\b','g'))||[]).length;
  }
  const all = (flat.match(new RegExp('\\b'+esc(name)+'\\b','g'))||[]).length;
  /* occurrences that are "Name Surname" with a surname not equal to any roster
     full-name for this person */
  const compounded = (flat.match(new RegExp('\\b'+esc(name)+'\\s+[A-Z][a-z]+','g'))||[]).length;
  return all - compounded;                               // keep only bare/standalone uses
}

/* ── FILTER 3 · consult the room-note for shared names ──────────────────────
   If a roster figure has a room whose note says "NOT <other>", and the text's
   usage matches the excluded person, it is the wrong one. Brutus's note names
   the exclusion explicitly. Applied as a flag for human review, not an auto-cut,
   because notes are prose. */
function noteExclusion(name){
  try{
    const room = JSON.parse(fs.readFileSync('library/'+slug(name)+'.json','utf8'));
    const note = (room.note||'');
    const m = note.match(/not\s+([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+\s+[A-Z][a-z]+)/);
    return m ? m[1] : null;
  }catch{ return null; }
}

const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ── run ── */
const JB=37, JD=100;
let raw='';
for(const b of ['14','15','17','18','19']){ try{ raw+=fs.readFileSync('fj-'+b+'.md','utf8')+' ';}catch{} }
const flat = stripApparatus(raw).replace(/\s+/g,' ');

const edges=[], rejected=[];
for(const s of roster){
  const n=s.n, b=s.b, d=s.d;
  if(b==null||d==null) continue;
  if(n==='Flavius Josephus') continue;
  if(b>JD || d<JB-700) continue;
  const c = countClean(n, flat);
  if(c<=0){ continue; }
  const excl = noteExclusion(n);
  edges.push({name:n,dates:b+'..'+d,count:c,room:!!s.r,noteExcludes:excl});
}
edges.sort((a,b)=>b.count-a.count);
console.log('candidate edges after 3 filters:', edges.length);
console.log('%-24s %-12s %5s %s','named','dates','x','flags');
for(const e of edges.slice(0,20)){
  console.log('  %-22s %-12s %4dx %s%s', e.name.slice(0,22), e.dates, e.count,
    e.room?'[room] ':'', e.noteExcludes?('[note: not '+e.noteExcludes+']'):'');
}
