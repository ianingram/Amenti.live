#!/usr/bin/env node
/* ============================================================================
   probe-graph.mjs · THE DIGESTER · Slip #47 #58 #59
   ----------------------------------------------------------------------------
   Walks mentions/*.json, unifies every harvested edge into ONE graph, and
   writes GRAPH.json — the single queryable object the visualizer and the hall
   read. Also reports the analysis that makes the mention graph a research tool
   rather than a pile of files:

     · nodes and edges, counted
     · the most-NAMED figures (in-degree) \u2014 who antiquity talked about most
     · CROSS-CORROBORATED figures \u2014 named by 2+ independent historians
     · ROOM-TO-ROOM bridges \u2014 edges where BOTH ends have a library room
     · WANT-LIST \u2014 (fed separately by the harvester's misses)

   A node is a roster soul (by key). An edge is author -> named, with a kind
   (contemporary / historical / legendary / scripture) and a source citation.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const MDIR = fs.existsSync('mentions') ? 'mentions' : '.';

/* the roster gives every node its dates \u2014 without them the time-flow view
   cannot place anyone. Join birth/death onto each node by key. */
const rosterByKey = {};
try {
  const R = JSON.parse(fs.readFileSync('ROSTER-INDEX.json','utf8')).souls;
  for (const soul of R) {
    rosterByKey[soul.k] = {b:soul.b, d:soul.d};
    for (const alt of (soul.keys||[])) rosterByKey[alt] = {b:soul.b, d:soul.d};
  }
} catch { /* dates unavailable; nodes will carry null */ }
const files = fs.readdirSync(MDIR).filter(f => f.endsWith('-mentions.json'));
if (!files.length) { console.error('no mentions/*.json found'); process.exit(1); }

/* which keys have a library room? (both-ends-shelved test) */
const rooms = new Set();
try {
  for (const f of fs.readdirSync('library')) if (f.endsWith('.json')) rooms.add(f.replace('.json',''));
} catch {}

/* every harvested author has a room; collect them for the bridge test */
const harvestedAuthors = new Set(files.map(f=>{
  try { return JSON.parse(fs.readFileSync(path.join(MDIR,f),'utf8')).author; } catch { return null; }
}).filter(Boolean));
const hasRoom = key => rooms.has(key) || harvestedAuthors.has(key);

const nodes = {};   // key -> {key, named, room, inDeg, namedBy:Set}
const edges = [];   // {from, to, named, kind, count, source}
function touch(key, named){
  if(!nodes[key]) { const dt=rosterByKey[key]||{}; nodes[key]={key, named, inDeg:0, room:hasRoom(key), namedBy:new Set(), b:dt.b??null, d:dt.d??null}; }
  return nodes[key];
}

for (const f of files){
  const d = JSON.parse(fs.readFileSync(path.join(MDIR,f),'utf8'));
  const from = d.author;
  touch(from, from);                       // the author is a node too
  for (const e of (d.edges||[])){
    const ft=rosterByKey[from]||{}, tt=rosterByKey[e.to]||{};
    edges.push({from, to:e.to, named:e.named, kind:e.kind||'?', count:e.count||1, source:e.source||d.text||'',
                fromB:ft.b??null, fromD:ft.d??null, toB:tt.b??null, toD:tt.d??null});
    const n = touch(e.to, e.named);
    n.inDeg += 1;
    n.namedBy.add(from);
  }
}

/* ── analysis ── */
const list = Object.values(nodes);
const mostNamed = list.filter(n=>n.inDeg>0).sort((a,b)=>b.inDeg-a.inDeg);
const corroborated = list.filter(n=>n.namedBy.size>=2).sort((a,b)=>b.namedBy.size-a.namedBy.size);
const bridges = edges.filter(e=>hasRoom(e.from) && hasRoom(e.to) && e.from!==e.to);

/* ── write the unified graph ── */
const out = {
  built: new Date().toISOString().slice(0,10),
  authors: files.length,
  nodes: list.length,
  edges: edges.length,
  graph: {
    nodes: list.map(n=>({key:n.key, named:n.named, room:n.room, namedBy:[...n.namedBy], inDegree:n.inDeg, b:n.b, d:n.d})),
    edges
  },
  analysis: {
    most_named: mostNamed.slice(0,15).map(n=>({named:n.named, times:n.inDeg, by:[...n.namedBy]})),
    cross_corroborated: corroborated.map(n=>({named:n.named, historians:[...n.namedBy]})),
    room_to_room_bridges: bridges.map(e=>({from:e.from, to:e.to, named:e.named})),
    /* a node named by many historians ACROSS eras may be a name collision \u2014
       one key catching several people (the Brutus problem). Flag for review. */
    possible_collisions: corroborated.filter(n=>n.namedBy.size>=3).map(n=>({named:n.named,
      historians:[...n.namedBy], note:'named by 3+ sources across possibly different eras \u2014 verify it is one person'}))
  }
};
fs.writeFileSync('GRAPH.json', JSON.stringify(out,null,1));

/* ── report ── */
const R=[];
R.push('\u2500\u2500 the mention graph, digested \u2500\u2500');
R.push('  '+out.authors+' historians  \u00b7  '+out.nodes+' figures  \u00b7  '+out.edges+' edges');
R.push('');
R.push('MOST NAMED (who antiquity talked about most):');
mostNamed.slice(0,10).forEach(n=>R.push('  '+String(n.inDeg).padStart(2)+'\u00d7 sources  '+n.named+(n.room?'  [room]':'')));
R.push('');
R.push('CROSS-CORROBORATED (named by 2+ independent historians \u2014 the strongest edges):');
corroborated.forEach(n=>R.push('  '+n.named.padEnd(22)+' \u2190 '+[...n.namedBy].join(', ')));
R.push('');
R.push('ROOM-TO-ROOM BRIDGES (both ends shelved \u2014 the graph you can WALK):');
if(!bridges.length) R.push('  (none)');
bridges.forEach(e=>R.push('  '+e.from+' \u2192 '+e.to+'  ("'+e.named+'")'));
const coll = corroborated.filter(n=>n.namedBy.size>=3);
if(coll.length){ R.push(''); R.push('\u26a0 POSSIBLE COLLISIONS (one key, maybe several people):');
  coll.forEach(n=>R.push('  '+n.named+'  \u2014 '+n.namedBy.size+' sources across eras, verify')); }
R.push('');
R.push('wrote GRAPH.json  ('+Math.round(fs.statSync('GRAPH.json').size/1024)+' KB)');
console.log(R.join('\n'));
