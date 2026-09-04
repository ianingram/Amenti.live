/* geo-tier classifier — city / country / region / mythic / none */
import fs from 'fs';
export function cut(line){const out=[];let f='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){f+='"';i++;}else if(c==='"')q=false;else f+=c;}else if(c==='"')q=true;else if(c===','){out.push(f);f='';}else f+=c;}out.push(f);return out;}

const REGIONS=new Set(['southern europe','western europe','eastern europe','central europe','northern europe','southeast europe','southwestern europe','europe','east asia','south asia','southeast asia','central asia','western asia','asia','north africa','east africa','west africa','africa','north america','central america','south america','mesoamerica','middle east','eastern mediterranean','mediterranean','anatolia','oceania','caribbean','andes','pacific islands','mesopotamia','the beyond','great plains','levant','scandinavia','balkans','the west']);
const COUNTRIES=new Set(['china','egypt','japan','india','germany','ethiopia','arabia','persia','mali','greece','italy','france','england','spain','russia','ireland','wales','scotland','britain','albania','iceland','korea','mexico','peru','turkey','israel','judea','judaea','galilee','canaan','thrace','cappadocia','phrygia','sumer','akkad','assyria','babylonia','nubia','carthage','sicily','cyprus','zanzibar','netherlands','austria','poland','portugal','sweden','norway','denmark','switzerland','hungary','bohemia','burgundy','normandy','swabia','ruthenia','prussia','usa','united states','ohio country','iroquois confederacy','mali empire','mongol empire','frankish gaul','roman britain','han china','tang china','sui china','ancient china','ancient india','ancient persia','antediluvian world']);
const MYTHIC=new Set(['asgard','jotunheim','eden','the cosmic egg','the deep sea','the primordial sea','olympus','valhalla','atlantis','the underworld','duat','elysium','niflheim','midgard']);
const NULLISH=new Set(['','unknown','n/a','na','none','-','?','various','itinerant']);

/* strip a trailing parenthetical: "Naissus (modern Serbia)" / "Paris (German family)" */
const dropParen = s => s.replace(/\s*\([^)]*\)\s*$/,'').trim();

export function geoTier(raw){
  const v0=String(raw==null?'':raw).trim();
  if(NULLISH.has(v0.toLowerCase())) return {tier:'none',place:'',note:''};

  /* compound: "Troy / Latium", "Patavium and Rome" — principal place = the FIRST */
  let compound=false, v=v0;
  const parts=v0.split(/\s*\/\s*|\s+and\s+/i).map(s=>s.trim()).filter(Boolean);
  if(parts.length>1){compound=true; v=parts[0];}

  v=dropParen(v);
  const low=v.toLowerCase();
  if(NULLISH.has(low)) return {tier:'none',place:'',note:''};
  if(MYTHIC.has(low))  return {tier:'mythic',place:v,note:compound?'compound':''};

  /* comma = "City, Country" — unless the head itself is a region */
  if(v.includes(',')){
    const head=dropParen(v.split(',')[0]).trim();
    const hl=head.toLowerCase();
    if(REGIONS.has(hl)) return {tier:'region',place:head,note:'comma-but-region'};
    if(MYTHIC.has(hl))  return {tier:'mythic',place:head,note:''};
    return {tier:'city',place:head,full:v,note:compound?'compound':''};
  }
  if(REGIONS.has(low))   return {tier:'region', place:v,note:compound?'compound':''};
  if(COUNTRIES.has(low)) return {tier:'country',place:v,note:compound?'compound':''};
  /* bare, unlisted → city, but SPOT-VERIFY */
  return {tier:'city',place:v,note:'city?'+(compound?' compound':'')};
}

/* ---- run ---- */
const lines=fs.readFileSync('names.csv','utf8').split(/\r?\n/).filter(l=>l.trim());
const head=cut(lines[0]).map(s=>s.trim().toLowerCase());
const L=head.indexOf('location'), N=head.indexOf('full name');
const rows=lines.slice(1).map(cut);
const tag=rows.map(r=>({n:r[N],raw:(r[L]||'').trim(),...geoTier(r[L])}));
const count=t=>tag.filter(x=>x.tier===t).length;
console.log('── GEO-TIER ────────────────────────────────');
console.log('souls        ',tag.length);
for(const t of ['city','country','region','mythic','none'])
  console.log((t+'         ').slice(0,9),String(count(t)).padStart(5),
    '  '+Math.round(count(t)/tag.length*100)+'%');
console.log('\nPINNABLE (city)   ',count('city'));
console.log('TERRITORY (c+r)   ',count('country')+count('region'));
console.log('NO MARK (myth+none)',count('mythic')+count('none'));
console.log('\ncompound (took first place):',tag.filter(x=>/compound/.test(x.note)).length);
const q=tag.filter(x=>/city\?/.test(x.note));
console.log('\n── city? bucket — '+q.length+' rows, needs spot-check ──');
const qc={};q.forEach(x=>qc[x.place]=(qc[x.place]||0)+1);
Object.entries(qc).sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,v])=>console.log(String(v).padStart(4),k));
console.log('\n── mythic ──');
tag.filter(x=>x.tier==='mythic').forEach(x=>console.log('   ',x.n,'·',x.raw));
