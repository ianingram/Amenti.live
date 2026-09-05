/* ============================================================================
   probes/events-gaz.mjs  ·  WHERE THE EVENTS HAPPENED
   ----------------------------------------------------------------------------
   The souls' gazetteer cannot place the events, and the reason is structural:
   GeoNames lists POPULATED PLACES, and a battlefield is not one. Measured on
   4 Sep against the real file, the naive path produced:

       Marathon   -> Saint-Maximin-la-Sainte-Baume, France
       Waterloo   -> Austin, Texas
       Carthage   -> Carthage, Ohio

   and roughly forty-five fields — Kadesh, Thermopylae, Actium, Manzikert,
   Agincourt, Bannockburn, the Somme — resolved to NOTHING AT ALL and would
   have vanished silently while the register looked full.

   So the events carry their own tables, and one rule the souls did not need.

   ── THE COUNTRY MUST AGREE ────────────────────────────────────────────────
   The roster has a Region column that arbitrates between namesakes. The
   events have none, so the arbitration is the country written into the Place
   string itself: "Carthage, Tunisia" must resolve inside TN or it is REFUSED.
   That check caught Carthage-in-Ohio on its first run.

   ── AND A BATTLEFIELD IS NOT A CITY ───────────────────────────────────────
   Every coordinate below is hand-placed. Where a site is genuinely disputed
   the note says so — Zama is not certainly identified, Bosworth was moved by
   survey in 2009, the Alpine pass Hannibal used is still argued. A note is
   not a disclaimer; it is the part of the record the map cannot draw.
   ========================================================================== */

/* battlefields, wrecks, monuments and vents — places the record names and a
   population gazetteer does not hold */
export const BATTLEFIELDS = {
  'abbottabad':              [  34.1500,    73.2100],
  'actium':                  [  38.9340,    20.7620]   /* the promontory at the mouth of the Ambracian Gulf */,
  'agincourt':               [  50.4640,     2.1300]   /* Azincourt */,
  'angkor':                  [  13.4125,   103.8670],
  'bannockburn':             [  56.0900,    -3.9200],
  'bhopal':                  [  23.2600,    77.4100],
  'bosworth':                [  52.5900,    -1.4100]   /* Ambion Hill; the field was relocated by survey in 2009 */,
  'cajamarca':               [  -7.1600,   -78.5100],
  'cannae':                  [  41.3060,    16.1320]   /* the Ofanto plain, Apulia */,
  'cape canaveral':          [  28.3920,   -80.6050],
  'carthage':                [  36.8530,    10.3230]   /* the Punic city on the Gulf of Tunis — NOT Carthage, Ohio */,
  'catalhoyuk':              [  37.6664,    32.8283],
  'chalons':                 [  48.9500,     4.3600]   /* the Catalaunian Plains; exact field unknown */,
  'chalons-en-champagne':    [  48.9500,     4.3600],
  'chernobyl':               [  51.3890,    30.0990],
  'compiegne':               [  49.4180,     2.8260]   /* the armistice carriage, Forest of Compiegne */,
  'crecy':                   [  50.2530,     1.8930]   /* Crecy-en-Ponthieu */,
  'fukushima':               [  37.4210,   141.0330]   /* the Daiichi plant, not the city */,
  'gaugamela':               [  36.3600,    43.2500]   /* Tel Gomel, near Mosul — site debated within a few km */,
  'gibraltar':               [  36.1400,    -5.3500],
  'giza':                    [  29.9773,    31.1325],
  'gobekli tepe':            [  37.2231,    38.9225],
  'harrisburg':              [  40.2730,   -76.8860]   /* Three Mile Island */,
  'hastings':                [  50.9110,     0.4870]   /* Battle, six miles inland from Hastings town */,
  'jamestown':               [  37.2100,   -76.7770],
  'kadesh':                  [  34.5680,    36.5150]   /* Tell Nebi Mend, on the Orontes */,
  'kalkriese':               [  52.4100,     8.1300]   /* the Teutoburg site as identified since 1987 */,
  'krakatoa':                [  -6.1020,   105.4230],
  'lakehurst':               [  40.0330,   -74.3530],
  'lepanto':                 [  38.3300,    21.3300]   /* the gulf off Naupactus — a sea battle */,
  'lexington':               [  42.4470,   -71.2240]   /* Lexington, Massachusetts — NOT Lexington, Kentucky */,
  'lindisfarne':             [  55.6800,    -1.8000]   /* Holy Island */,
  'little bighorn':          [  45.5700,  -107.4300],
  'littleton':               [  39.6130,  -105.0170]   /* Littleton, Colorado */,
  'machu picchu':            [ -13.1631,   -72.5450],
  'manzikert':               [  39.1430,    42.5400]   /* Malazgirt, eastern Anatolia */,
  'marathon':                [  38.1550,    23.9630]   /* the plain, Attica — NOT Marathon in Provence */,
  'midway atoll':            [  28.2100,  -177.3800]   /* a sea and air battle around the atoll */,
  'pella':                   [  40.7620,    22.5240],
  'plymouth':                [  41.9580,   -70.6670]   /* Plymouth, Massachusetts */,
  'poitiers':                [  46.5800,     0.3400]   /* the 1356 field, south of the city */,
  'richborough':             [  51.2930,     1.3320]   /* Rutupiae, the Claudian landing */,
  'sacramento':              [  38.5820,  -121.4940]   /* Sutter's Mill is at Coloma, 60 km east */,
  'salamis':                 [  37.9640,    23.4970]   /* the strait, not the Cypriot city */,
  'santorini':               [  36.4000,    25.4000]   /* Thera; the caldera */,
  'saqqara':                 [  29.8710,    31.2160],
  'sarajevo':                [  43.8560,    18.4130],
  'somme':                   [  49.9800,     2.7000]   /* the 1916 front, near Albert */,
  'stonehenge':              [  51.1789,    -1.8262],
  'tambora':                 [  -8.2500,   118.0000],
  'the alps':                [  46.5000,     9.0000]   /* a crossing, not a point — the pass is disputed */,
  'thermopylae':             [  38.7960,    22.5360]   /* the pass; the coastline has since moved */,
  'trafalgar':               [  36.1800,    -6.0300]   /* Cape Trafalgar — a sea battle */,
  'waterloo':                [  50.6800,     4.4100]   /* Waterloo, Belgium — NOT Waterloo/Austin, Texas */,
  'yarmouk':                 [  32.7500,    35.9000]   /* the Yarmouk river valley */,
  'yorktown':                [  37.2390,   -76.5100],
  'zama':                    [  36.3000,     9.4000]   /* site not certainly identified; this is the traditional area */
};

/* seats no modern gazetteer holds, specific to the events */
export const EVENT_SEATS = {
  'pompeii':         [  40.7500,    14.4860]   /* buried 79 AD */,
  'tenochtitlan':    [  19.4350,   -99.1410]   /* beneath Mexico City */
};

/* Extents SPECIFIC to the events — everything else comes from the shared
   probes/extents.mjs, which the souls use too. Only names that table does not
   already carry belong here. [south, west, north, east] */
export const EVENT_EXTENTS = {
  'haiti':            [18.0, -74.5, 20.1, -71.6],
  'cuba':             [19.8, -85.0, 23.3, -74.1],
  'crimea':           [44.3,  32.4, 46.3,  36.7],
  'south africa':     [-35.0, 16.4, -22.1, 32.9],
  'vietnam':          [8.4,  102.1, 23.4, 109.5],
  'afghanistan':      [29.4,  60.5, 38.5,  74.9],
  'syria':            [32.3,  35.7, 37.3,  42.4],
  'ukraine':          [44.4,  22.1, 52.4,  40.2],
  'mongolia':         [41.6,  87.7, 52.2, 119.9],
  'rwanda':           [-2.8,  28.9, -1.0,  30.9],
  'falkland islands': [-52.5, -61.4, -51.0, -57.7],
  'roman empire':     [30.0, -10.0, 56.0,  45.0],
  'kuwait':           [28.5,  46.5, 30.1,  48.4],
  'the alps':         [44.0,   5.5, 48.0,  16.0]
};

/* the country written in a Place string, to the ISO code the gazetteer uses */
export const COUNTRY_CODE = {
  'france':'FR','england':'GB','scotland':'GB','wales':'GB','ireland':'IE',
  'greece':'GR','italy':'IT','spain':'ES','portugal':'PT','germany':'DE',
  'austria':'AT','belgium':'BE','netherlands':'NL','denmark':'DK','poland':'PL',
  'czechia':'CZ','hungary':'HU','russia':'RU','ukraine':'UA','turkey':'TR',
  'syria':'SY','israel':'IL','iraq':'IQ','iran':'IR','india':'IN','china':'CN',
  'japan':'JP','korea':'KR','vietnam':'VN','cambodia':'KH','indonesia':'ID',
  'pakistan':'PK','afghanistan':'AF','saudi arabia':'SA','egypt':'EG',
  'tunisia':'TN','rwanda':'RW','kosovo':'XK','bosnia and herzegovina':'BA',
  'mongolia':'MN','peru':'PE','mexico':'MX','haiti':'HT','cuba':'CU',
  'united states':'US','canada':'CA','brazil':'BR','argentina':'AR'
};
