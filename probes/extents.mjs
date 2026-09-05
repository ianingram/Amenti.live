/* ============================================================================
   probes/extents.mjs  ·  THE TERRITORY EXTENTS, ONCE
   ----------------------------------------------------------------------------
   [south, west, north, east] for every place that is an AREA rather than a
   point. Read by probe-geo (the souls) and probe-events (what happened).

   ── WHY IT IS ITS OWN FILE · 4 SEP ────────────────────────────────────────
   It lived inside probe-geo.mjs, and probe-events then refused twenty events
   for naming Egypt, China, Europe, France, Persia and Mesopotamia — every one
   of which was already in that table, one file away.

   The obvious fix was to copy the table across. That is how this repo got two
   geo-tier.mjs files that had ALREADY DIVERGED within nineteen hours, and two
   merge.js of different sizes, and the two roster loaders amenti-hall.js
   warns about in its opening lines. A boundary written twice is a boundary
   that will disagree with itself, and the disagreement will be silent.

   One table. Both probes read it. Neither owns it.

   ── AND AN EXTENT IS A CLAIM, NOT A DECORATION ────────────────────────────
   These boxes decide which Cordoba a soul gets: probe-geo uses them to
   arbitrate namesakes, so a box drawn wrong does not merely draw wrong — it
   REFUSES A CORRECT PIN. They are deliberately generous, because the point of
   an extent is to say "somewhere in here", and a tight box would imply a
   precision the record does not carry.
   ========================================================================== */
export const EXTENT = {
  'southern europe':[36,-10,47,29],'western europe':[41,-11,61,9],
  'central europe':[44,1,56,25],'eastern europe':[44,22,60,50],
  'northern europe':[54,-25,72,32],'southeastern europe':[38,13,48,30],
  'southeast europe':[38,13,48,30],'southwestern europe':[35,-10,44,5],
  'europe':[34,-25,72,42],'east asia':[20,100,50,146],'south asia':[6,66,35,92],
  'southeast asia':[-10,92,23,141],'central asia':[35,52,50,80],
  'western asia':[12,25,43,63],'asia':[0,30,60,146],'north africa':[20,-17,37,35],
  'east africa':[-12,29,18,52],'west africa':[4,-17,20,15],'africa':[-35,-17,37,51],
  'north america':[14,-170,72,-52],'central america':[7,-118,24,-77],
  'south america':[-56,-82,13,-34],'mesoamerica':[14,-105,22,-86],
  'middle east':[12,30,42,63],'eastern mediterranean':[29,20,42,43],
  'mediterranean':[30,-6,46,36],'anatolia':[36,26,42,45],'oceania':[-45,112,-10,180],
  'caribbean':[10,-85,25,-60],'andes':[-35,-79,10,-63],'pacific islands':[-20,140,20,-160],
  'mesopotamia':[30,40,37,48],'nile delta':[30.0,30.4,31.6,32.2],
  'yellow river':[34,100,41,119],'lake titicaca':[-16.6,-70.1,-15.2,-68.6],'great plains':[32,-104,49,-96],
  'the egyptian desert':[22,25,31,34],'the egyptian necropolis':[29.7,31.0,30.1,31.3],
  'the wilds of sumer':[30,44,33,47],'shinar':[30,42,34,47],
  'germany':[47,6,55,15],'china':[20,75,53,135],'ancient china':[25,100,41,122],
  'han china':[25,100,41,122],'tang china':[25,100,41,122],'sui china':[25,100,41,122],
  'egypt':[22,25,32,35],'japan':[31,129,46,146],'india':[8,68,35,97],
  'ancient india':[8,68,35,97],'ethiopia':[3,33,15,48],'arabia':[12,34,32,60],
  'persia':[25,44,40,63],'ancient persia':[25,44,40,63],'mali':[10,-12,25,4],
  'mali empire':[10,-12,25,4],'greece':[35,20,42,28],'cyprus':[34.5,32.2,35.7,34.6],
  'sicily':[36.6,12.4,38.3,15.7],'wales':[51.3,-5.3,53.5,-2.6],
  'ireland':[51.4,-10.5,55.4,-5.9],'britain':[50,-6,59,2],'roman britain':[50,-6,56,2],
  'england':[50,-6,55.8,1.8],'france':[42,-5,51,8],'normandy':[48.2,-1.9,50.1,1.8],
  'burgundy':[46.1,2.8,48.4,5.5],'swabia':[47.4,7.5,49.5,10.5],
  'frankish gaul':[43,-2,51,8],'albania':[39.6,19.2,42.7,21.1],
  'iceland':[63.2,-24.6,66.6,-13.5],'zanzibar':[-6.5,39.1,-4.8,39.9],
  'thrace':[40.3,24.5,42.5,29.0],'cappadocia':[37.7,33.5,39.4,36.5],
  'phrygia':[37.9,29.5,39.9,33.0],'judea':[31.0,34.7,32.0,35.6],
  'galilee':[32.6,35.0,33.3,35.7],'canaan':[30.5,34.2,34.5,36.5],
  'ancient canaan':[30.5,34.2,34.5,36.5],'ruthenia':[47.9,21.8,49.6,24.6],
  'carthage':[33,8,37,12],'akkad':[32,43,34.5,45.5],
  'mongol empire':[35,75,55,125],'ohio country':[38.4,-84.8,42.3,-80.5],
  'iroquois confederacy':[42.0,-79.8,44.5,-74.0],
  /* added 4 Sep for the events — a soul's Location never said these bare, but
     an event's Place does. They belong in the shared table, not a second one. */
  'korea':[33.1,124.6,43.0,131.0], 'russia':[41.2,19.6,77.0,180.0],
  'spain':[36.0,-9.3,43.8,3.3],    'israel':[29.5,34.2,33.3,35.9],
  'ireland':[51.4,-10.5,55.4,-5.9]
};
