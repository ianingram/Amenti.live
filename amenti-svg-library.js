/* ============================================================================
   amenti-svg-library.js  ·  the Stardust Engine
   ----------------------------------------------------------------------------
   The hand-drawn character portraits — 654 vector paths, each function
   returning an inline <svg> string at viewBox 0 0 320 560.

   WHY IT LEFT Page1.html
     143,747 characters of INLINE script: 39% of all the JavaScript on the
     page, and every byte parsed and executed before the browser would paint
     or answer a hover. It is not logic. It is artwork stored as code, and it
     is the FALLBACK tier — the drawing a card shows when a figure has no
     photograph. Twenty-nine figures now have photographs.

   DEFERRED, AND SAFE
     Every consumer reads it from inside a function, after boot:
       Page1.html codex  window.AMENTI_SVG?.[c.key]?.()   optional-chained
       amenti-roster.js  var lib = window.AMENTI_SVG      inside artFor()
       amenti-art-2.js   merges into it, does not require it first
     Nothing touches it at parse time.

   THE BODY BELOW IS VERBATIM. Not tidied, not corrected.
     It contains three sub-libraries, each ending `window.AMENTI_SVG = F` —
     a plain assignment, so each REPLACES the one before it. Run as-is the
     page ends up with exactly 21 figures. That is the behaviour today and
     this file reproduces it exactly. Merging them instead would surface
     drawings that currently never appear, which is a change nobody asked
     for and would be invisible until someone noticed a new picture.

   THE ONLY ADDITION is the guard at the bottom: amenti-art-2.js may already
   have put drawings on window.AMENTI_SVG before this file runs, and a plain
   assignment would throw them away silently. The guard puts them back.
   ============================================================================ */
(function(){
  /* whatever is already there — amenti-art-2.js adds drawings of its own */
  var prior = window.AMENTI_SVG;


(function(){
try{

// Stardust Engine — character SVG library
// Each function returns an inline <svg> string at viewBox 0 0 320 560.
// Image-slot mode: if a tweak/global is set, returns a placeholder image-slot instead.

(function(){
'use strict';

const F = {};

// ────────────────────────────────────────────────────────────────────
// Reusable defs/glow filter generator
function defs(id, glowColor, bgColor){
  return `<defs>
    <radialGradient id="${id}-bg" cx="50%" cy="85%" r="65%">
      <stop offset="0%" stop-color="${bgColor}" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#05050f" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8a880"/>
      <stop offset="100%" stop-color="#9c6f4c"/>
    </linearGradient>
  </defs>`;
}

// ────────────────────────────────────────────────────────────────────
// LINCOLN — improved
F.lincoln = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('lg','#3060e0','#102060')}
  <!-- Aura behind -->
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#lg-bg)"/>
  <!-- STOVEPIPE HAT -->
  <rect x="110" y="6" width="100" height="104" rx="3" fill="#0b0b1c" stroke="#1c1f3c" stroke-width="1.5"/>
  <ellipse cx="160" cy="110" rx="68" ry="12" fill="#0b0b1c" stroke="#242646" stroke-width="1.4"/>
  <rect x="110" y="98" width="100" height="14" fill="#16163a"/>
  <rect x="110" y="6" width="100" height="104" rx="3" fill="none" stroke="#3060e0" stroke-width="0.8" opacity=".55" filter="url(#lg-glow)"/>
  <!-- Hat band reflection -->
  <line x1="116" y1="80" x2="204" y2="80" stroke="#3060e0" stroke-width="0.5" opacity=".3"/>
  <!-- HEAD shape — gaunt -->
  <path d="M128 130 Q128 178 138 198 Q148 210 160 210 Q172 210 182 198 Q192 178 192 130 Q188 110 160 108 Q132 110 128 130Z" fill="url(#lg-skin)"/>
  <!-- Cheekbone shading -->
  <path d="M132 156 Q128 172 138 186" fill="#a07050" opacity=".4"/>
  <path d="M188 156 Q192 172 182 186" fill="#a07050" opacity=".4"/>
  <!-- Forehead shadow under hat -->
  <path d="M128 116 Q160 122 192 116 L192 132 Q160 130 128 132Z" fill="#7c5638" opacity=".55"/>
  <!-- Heavy brows -->
  <path d="M134 138 Q146 132 156 138" stroke="#2a1808" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M164 138 Q174 132 186 138" stroke="#2a1808" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Deep-set eyes -->
  <ellipse cx="146" cy="148" rx="6" ry="4" fill="#150a04"/>
  <ellipse cx="174" cy="148" rx="6" ry="4" fill="#150a04"/>
  <circle cx="146" cy="147" r="1.6" fill="#5a78c0"/>
  <circle cx="174" cy="147" r="1.6" fill="#5a78c0"/>
  <!-- Long nose -->
  <path d="M158 152 Q156 168 154 176 Q160 180 168 176 Q166 168 164 152" fill="#9a6c48" opacity=".6"/>
  <!-- Mouth — set, line of resolve -->
  <path d="M148 188 Q160 190 172 188" stroke="#4a2810" stroke-width="1.4" fill="none"/>
  <!-- CHIN BEARD (Lincoln's signature) -->
  <path d="M128 198 Q132 218 142 230 Q160 238 178 230 Q188 218 192 198 Q188 210 175 218 Q160 224 145 218 Q132 210 128 198Z" fill="#2a1808"/>
  <path d="M138 220 Q160 232 182 220 Q172 246 160 252 Q148 246 138 220Z" fill="#1a0e04"/>
  <!-- Beard texture -->
  <line x1="146" y1="218" x2="148" y2="244" stroke="#0a0604" stroke-width="0.6" opacity=".7"/>
  <line x1="174" y1="218" x2="172" y2="244" stroke="#0a0604" stroke-width="0.6" opacity=".7"/>
  <!-- WHITE COLLAR + BOW TIE -->
  <path d="M134 246 L160 240 L186 246 L184 264 L160 270 L136 264Z" fill="#d8d4ca"/>
  <path d="M148 256 L160 264 L172 256 L168 268 L160 270 L152 268Z" fill="#0a0a18"/>
  <!-- VEST under coat (subtle pattern) -->
  <path d="M138 264 L160 268 L182 264 L182 360 L138 360Z" fill="#1a1830"/>
  <path d="M138 264 L160 268 L182 264" stroke="#3060e0" stroke-width="0.5" fill="none" opacity=".4"/>
  <!-- POCKET WATCH CHAIN -->
  <path d="M148 290 Q156 296 164 292 Q172 290 178 295" stroke="#d4a017" stroke-width="1.2" fill="none"/>
  <circle cx="178" cy="296" r="2.2" fill="#d4a017"/>
  <!-- FROCK COAT BODY (broader, more shape) -->
  <path d="M70 220 Q108 198 138 192 L136 380 Q104 388 70 402Z" fill="#0c0c1c"/>
  <path d="M250 220 Q212 198 182 192 L184 380 Q216 388 250 402Z" fill="#0a0a18"/>
  <rect x="136" y="192" width="48" height="72" fill="#10101e"/>
  <!-- LAPELS — pronounced -->
  <path d="M138 192 L154 208 L150 270 L138 274Z" fill="#1c1c30"/>
  <path d="M182 192 L166 208 L170 270 L182 274Z" fill="#1c1c30"/>
  <path d="M138 192 L154 208" stroke="#3060e0" stroke-width="0.6" opacity=".5"/>
  <path d="M182 192 L166 208" stroke="#3060e0" stroke-width="0.6" opacity=".5"/>
  <!-- Buttons -->
  <circle cx="160" cy="282" r="3" fill="#2a2440"/>
  <circle cx="160" cy="306" r="3" fill="#2a2440"/>
  <circle cx="160" cy="330" r="3" fill="#2a2440"/>
  <circle cx="160" cy="354" r="3" fill="#2a2440"/>
  <!-- ARMS -->
  <path d="M70 220 Q50 260 46 320 Q50 332 64 332 Q76 326 84 312 Q92 280 96 240Z" fill="#0e0e1e"/>
  <path d="M250 220 Q270 260 274 320 Q270 332 256 332 Q244 326 236 312 Q228 280 224 240Z" fill="#0e0e1e"/>
  <!-- Coat tail split -->
  <path d="M138 360 L122 488 L150 488 L156 360Z" fill="#0a0a18"/>
  <path d="M182 360 L198 488 L170 488 L164 360Z" fill="#0a0a18"/>
  <!-- HANDS — one resting, one holding speech roll -->
  <ellipse cx="56" cy="335" rx="12" ry="15" fill="url(#lg-skin)" transform="rotate(-12 56 335)"/>
  <g transform="translate(264,335)">
    <ellipse cx="0" cy="0" rx="12" ry="15" fill="url(#lg-skin)" transform="rotate(12)"/>
    <!-- speech scroll -->
    <rect x="-10" y="-26" width="20" height="44" rx="2" fill="#e8dcb0" stroke="#a08850" stroke-width="0.8" transform="rotate(-8)"/>
    <line x1="-6" y1="-18" x2="6" y2="-18" stroke="#806840" stroke-width="0.5"/>
    <line x1="-6" y1="-12" x2="6" y2="-12" stroke="#806840" stroke-width="0.5"/>
    <line x1="-6" y1="-6"  x2="6" y2="-6"  stroke="#806840" stroke-width="0.5"/>
    <line x1="-6" y1="0"   x2="6" y2="0"   stroke="#806840" stroke-width="0.5"/>
    <line x1="-6" y1="6"   x2="4" y2="6"   stroke="#806840" stroke-width="0.5"/>
  </g>
  <!-- TROUSERS -->
  <rect x="120" y="378" width="32" height="160" rx="2" fill="#0e0e1c"/>
  <rect x="168" y="378" width="32" height="160" rx="2" fill="#0c0c1a"/>
  <line x1="136" y1="382" x2="136" y2="536" stroke="#2a2a40" stroke-width="0.5"/>
  <line x1="184" y1="382" x2="184" y2="536" stroke="#2a2a40" stroke-width="0.5"/>
  <!-- BOOTS -->
  <path d="M114 530 Q120 548 152 550 L156 540 Z" fill="#080810"/>
  <path d="M164 540 L168 550 Q200 548 206 530 Z" fill="#080810"/>
  <line x1="116" y1="538" x2="156" y2="540" stroke="#2030a0" stroke-width="0.4" opacity=".5"/>
  <!-- NEON EDGES -->
  <path d="M70 220 Q48 260 44 320" stroke="#3060e0" stroke-width="0.9" fill="none" opacity=".7" filter="url(#lg-glow)"/>
  <path d="M250 220 Q272 260 276 320" stroke="#3060e0" stroke-width="0.9" fill="none" opacity=".55"/>
  <!-- CONSTITUTION GLYPH ON LAPEL -->
  <text x="148" y="248" font-family="Special Elite,monospace" font-size="6" fill="#d4a017" opacity=".6">⬢</text>
  <!-- Ground glow -->
  <ellipse cx="160" cy="548" rx="86" ry="14" fill="#1030c0" opacity=".4"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// MUSASHI — improved
F.musashi = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('ms','#e03030','#600010')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#ms-bg)"/>
  <!-- HAIR / TOPKNOT -->
  <path d="M132 96 Q128 70 142 56 Q160 48 178 56 Q192 70 188 96 Q170 105 160 105 Q150 105 132 96Z" fill="#1a0e06"/>
  <ellipse cx="160" cy="78" rx="14" ry="18" fill="#241408"/>
  <path d="M152 64 Q156 50 160 46 Q164 50 168 64 L165 78 L155 78Z" fill="#2c1a0a"/>
  <!-- Hair side strands -->
  <path d="M134 104 Q130 130 138 138" stroke="#0a0604" stroke-width="2.2" fill="none"/>
  <path d="M186 104 Q190 130 182 138" stroke="#0a0604" stroke-width="2.2" fill="none"/>
  <!-- HEAD -->
  <ellipse cx="160" cy="124" rx="28" ry="32" fill="url(#ms-skin)"/>
  <!-- Cheek shadow -->
  <path d="M134 124 Q130 144 138 154" fill="#a07040" opacity=".35"/>
  <path d="M186 124 Q190 144 182 154" fill="#a07040" opacity=".35"/>
  <!-- Stern eyes (narrow, intense) -->
  <path d="M142 116 Q150 113 158 116" stroke="#1a0a04" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M162 116 Q170 113 178 116" stroke="#1a0a04" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="118" rx="3.5" ry="2" fill="#0a0604"/>
  <ellipse cx="170" cy="118" rx="3.5" ry="2" fill="#0a0604"/>
  <!-- Heavy brows -->
  <path d="M140 106 Q150 102 158 106" stroke="#3a1c08" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M162 106 Q170 102 180 106" stroke="#3a1c08" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <!-- Battle SCAR on left cheek -->
  <path d="M130 130 L138 152" stroke="#7a2010" stroke-width="1.3" fill="none" opacity=".75"/>
  <!-- Nose -->
  <path d="M156 124 Q154 142 152 152 Q160 156 168 152 Q166 142 164 124" fill="#8a5c38" opacity=".55"/>
  <!-- Mouth — grim -->
  <path d="M150 162 Q160 165 170 162" stroke="#3a1808" stroke-width="1.5" fill="none"/>
  <!-- Goatee -->
  <path d="M155 168 Q160 184 165 168 Q162 178 160 180 Q158 178 155 168Z" fill="#1a0e06"/>
  <!-- WHITE GI COLLAR -->
  <path d="M138 154 L160 148 L182 154 L180 168 L160 172 L140 168Z" fill="#dcd6cc"/>
  <line x1="160" y1="150" x2="160" y2="172" stroke="#a8a4a0" stroke-width="0.6"/>
  <!-- KIMONO BODY (broad, draped) -->
  <path d="M132 168 L188 168 L194 350 L126 350Z" fill="#240a0a"/>
  <!-- Wide drape lines -->
  <path d="M150 174 Q148 260 154 348" stroke="#3a1414" stroke-width="0.8" opacity=".5" fill="none"/>
  <path d="M170 174 Q172 260 166 348" stroke="#3a1414" stroke-width="0.8" opacity=".5" fill="none"/>
  <!-- DRAMATIC SLEEVES -->
  <path d="M30 188 Q60 168 138 156 L132 290 Q80 296 50 282 Q34 260 30 218Z" fill="#1c0808"/>
  <path d="M290 188 Q260 168 182 156 L188 290 Q240 296 270 282 Q286 260 290 218Z" fill="#1c0808"/>
  <!-- Sleeve crest (mon) -->
  <circle cx="80" cy="240" r="14" fill="none" stroke="#c01828" stroke-width="1.2" opacity=".7"/>
  <path d="M74 240 L86 240 M80 234 L80 246" stroke="#c01828" stroke-width="1.2" opacity=".7"/>
  <circle cx="240" cy="240" r="14" fill="none" stroke="#c01828" stroke-width="1.2" opacity=".7"/>
  <path d="M234 240 L246 240 M240 234 L240 246" stroke="#c01828" stroke-width="1.2" opacity=".7"/>
  <!-- OBI SASH -->
  <rect x="120" y="266" width="80" height="22" rx="1" fill="#b81828"/>
  <rect x="120" y="266" width="80" height="4" fill="#e02838"/>
  <rect x="120" y="284" width="80" height="3" fill="#7a0c14"/>
  <!-- Obi knot -->
  <rect x="148" y="284" width="24" height="14" rx="2" fill="#9a1020"/>
  <!-- HAKAMA (pleated trousers) -->
  <path d="M108 320 L122 530 L154 530 L158 320Z" fill="#180606"/>
  <path d="M212 320 L198 530 L166 530 L162 320Z" fill="#160606"/>
  <line x1="138" y1="324" x2="138" y2="528" stroke="#2c1010" stroke-width="1.5"/>
  <line x1="148" y1="324" x2="148" y2="528" stroke="#241010" stroke-width="0.8"/>
  <line x1="172" y1="324" x2="172" y2="528" stroke="#241010" stroke-width="0.8"/>
  <line x1="182" y1="324" x2="182" y2="528" stroke="#2c1010" stroke-width="1.5"/>
  <!-- Hakama bottom band -->
  <rect x="106" y="520" width="108" height="14" fill="#0c0404"/>
  <!-- SWORD 1 — raised diagonal (jodan kamae) -->
  <line x1="240" y1="282" x2="304" y2="58" stroke="#dcd6c0" stroke-width="6.5" stroke-linecap="round"/>
  <line x1="241" y1="280" x2="303" y2="62" stroke="#f4ecd0" stroke-width="1.4" opacity=".7"/>
  <!-- Tsuba 1 -->
  <ellipse cx="238" cy="285" rx="13" ry="8" fill="#8a6830" stroke="#c8a040" stroke-width="0.8" transform="rotate(-58 238 285)"/>
  <rect x="231" y="280" width="11" height="40" rx="2" fill="#3a1f08" stroke="#5a3818" stroke-width="0.5" transform="rotate(-58 236 300)"/>
  <!-- SWORD 2 — held horizontal -->
  <line x1="36" y1="270" x2="222" y2="256" stroke="#cec4a8" stroke-width="5" stroke-linecap="round"/>
  <line x1="38" y1="269" x2="220" y2="255" stroke="#e8dcb8" stroke-width="1.2" opacity=".55"/>
  <ellipse cx="218" cy="257" rx="11" ry="7" fill="#8a6830" stroke="#c8a040" stroke-width="0.8" transform="rotate(-3 218 257)"/>
  <rect x="200" y="251" width="11" height="36" rx="2" fill="#3a1f08" transform="rotate(-3 205 269)"/>
  <!-- Hands -->
  <ellipse cx="248" cy="270" rx="13" ry="15" fill="url(#ms-skin)" transform="rotate(-55 248 270)"/>
  <ellipse cx="52" cy="270" rx="12" ry="15" fill="url(#ms-skin)" transform="rotate(-5 52 270)"/>
  <!-- TABI socks -->
  <path d="M104 528 L108 540 Q120 548 152 548 L156 528Z" fill="#e6e0d4"/>
  <path d="M214 528 L210 540 Q198 548 168 548 L164 528Z" fill="#e6e0d4"/>
  <!-- Sandal straps -->
  <path d="M130 542 Q140 538 150 542" stroke="#0a0604" stroke-width="0.6" fill="none"/>
  <path d="M170 542 Q180 538 190 542" stroke="#0a0604" stroke-width="0.6" fill="none"/>
  <!-- NEON GLOWS — crimson -->
  <path d="M304 58 L240 282" stroke="#e03030" stroke-width="1.4" fill="none" opacity=".75" filter="url(#ms-glow)"/>
  <path d="M30 188 Q14 215 16 260" stroke="#c02020" stroke-width="0.9" fill="none" opacity=".55"/>
  <path d="M290 188 Q306 215 304 260" stroke="#c02020" stroke-width="0.9" fill="none" opacity=".55"/>
  <!-- Petal motif (sakura at feet) -->
  <ellipse cx="92" cy="538" rx="2.5" ry="1.5" fill="#f0a0c0" opacity=".7" transform="rotate(20 92 538)"/>
  <ellipse cx="220" cy="540" rx="2.5" ry="1.5" fill="#f0a0c0" opacity=".7" transform="rotate(-20 220 540)"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="548" rx="100" ry="14" fill="#a01010" opacity=".42"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// CAESAR — improved
F.caesar = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('cs','#f0c030','#604000')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#cs-bg)"/>
  <!-- Hair (Caesar's combover, short) -->
  <path d="M126 120 Q120 92 140 78 Q160 70 180 78 Q200 92 194 120 Q188 130 178 132 Q160 134 142 132 Q132 130 126 120Z" fill="#3a2814"/>
  <path d="M132 90 Q150 86 178 92" stroke="#1a1006" stroke-width="0.6" fill="none" opacity=".7"/>
  <!-- LAUREL WREATH -->
  <ellipse cx="160" cy="92" rx="50" ry="22" fill="none" stroke="#c8a428" stroke-width="3.5"/>
  <ellipse cx="160" cy="92" rx="50" ry="22" fill="none" stroke="#f0c040" stroke-width="1" opacity=".5"/>
  <!-- Laurel leaves left -->
  <g fill="#7a9028" stroke="#a8c038" stroke-width="0.6">
    <ellipse cx="120" cy="90" rx="6" ry="3" transform="rotate(-30 120 90)"/>
    <ellipse cx="128" cy="80" rx="6" ry="3" transform="rotate(-45 128 80)"/>
    <ellipse cx="138" cy="72" rx="6" ry="3" transform="rotate(-60 138 72)"/>
    <ellipse cx="150" cy="68" rx="6" ry="3" transform="rotate(-75 150 68)"/>
    <ellipse cx="115" cy="100" rx="6" ry="3" transform="rotate(-15 115 100)"/>
  </g>
  <g fill="#7a9028" stroke="#a8c038" stroke-width="0.6">
    <ellipse cx="200" cy="90" rx="6" ry="3" transform="rotate(30 200 90)"/>
    <ellipse cx="192" cy="80" rx="6" ry="3" transform="rotate(45 192 80)"/>
    <ellipse cx="182" cy="72" rx="6" ry="3" transform="rotate(60 182 72)"/>
    <ellipse cx="170" cy="68" rx="6" ry="3" transform="rotate(75 170 68)"/>
    <ellipse cx="205" cy="100" rx="6" ry="3" transform="rotate(15 205 100)"/>
  </g>
  <!-- Wreath center bind -->
  <rect x="156" y="64" width="8" height="6" rx="1" fill="#d4a020"/>
  <!-- HEAD -->
  <ellipse cx="160" cy="138" rx="30" ry="34" fill="url(#cs-skin)"/>
  <!-- Cheek shadow -->
  <path d="M132 138 Q126 158 134 168" fill="#a07050" opacity=".4"/>
  <path d="M188 138 Q194 158 186 168" fill="#a07050" opacity=".4"/>
  <!-- Eyes commanding -->
  <ellipse cx="148" cy="132" rx="6" ry="4.5" fill="#1a0c04"/>
  <ellipse cx="172" cy="132" rx="6" ry="4.5" fill="#1a0c04"/>
  <circle cx="148" cy="131" r="1.8" fill="#5040a0"/>
  <circle cx="172" cy="131" r="1.8" fill="#5040a0"/>
  <!-- Brows -->
  <path d="M138 122 Q150 118 160 122" stroke="#3a2418" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M160 122 Q170 118 182 122" stroke="#3a2418" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Roman nose — strong -->
  <path d="M158 134 Q156 152 152 162 Q160 166 168 162 Q164 152 162 134" fill="#8a5c38" opacity=".55"/>
  <!-- Mouth -->
  <path d="M150 174 Q160 178 170 174" stroke="#4a2810" stroke-width="1.6" fill="none"/>
  <!-- Strong jaw -->
  <path d="M132 160 Q140 188 160 192 Q180 188 188 160" stroke="#7a4a28" stroke-width="0.8" fill="none" opacity=".4"/>
  <!-- TOGA — over left shoulder, draped right hip -->
  <path d="M82 210 Q70 230 64 290 Q60 340 70 380 L130 200Z" fill="#e8e0c0"/>
  <path d="M82 210 Q98 218 124 215" stroke="#c0b890" stroke-width="0.8" opacity=".7" fill="none"/>
  <!-- LORICA MUSCULATA (muscle armor) -->
  <path d="M96 200 Q128 184 152 180 L148 348 Q120 358 96 372Z" fill="#a08038"/>
  <path d="M224 200 Q192 184 168 180 L172 348 Q200 358 224 372Z" fill="#8a6e30"/>
  <rect x="148" y="180" width="24" height="170" fill="#b89040"/>
  <!-- Pectoral muscle etching -->
  <path d="M100 218 Q126 210 148 212 Q150 244 142 250 Q120 252 100 248Z" stroke="#604018" stroke-width="1.2" fill="#9a7830" opacity=".5"/>
  <path d="M220 218 Q194 210 172 212 Q170 244 178 250 Q200 252 220 248Z" stroke="#604018" stroke-width="1.2" fill="#9a7830" opacity=".5"/>
  <!-- Centerline ab etching -->
  <path d="M148 252 Q160 250 172 252" stroke="#604018" stroke-width="1" fill="none"/>
  <ellipse cx="160" cy="270" rx="10" ry="7" stroke="#604018" stroke-width="1.2" fill="none"/>
  <ellipse cx="160" cy="294" rx="11" ry="6" stroke="#604018" stroke-width="1.2" fill="none"/>
  <ellipse cx="160" cy="316" rx="9" ry="5" stroke="#604018" stroke-width="1" fill="none"/>
  <!-- SPQR insignia on chest -->
  <g transform="translate(160,234)">
    <text x="0" y="0" text-anchor="middle" font-family="Special Elite,monospace" font-size="9" fill="#3a2410" opacity=".7" font-weight="bold">SPQR</text>
  </g>
  <!-- PALUDAMENTUM (crimson cloak) -->
  <path d="M82 210 Q60 250 50 340 Q70 365 90 380 Q98 332 100 290 Q104 248 96 220Z" fill="#a82020"/>
  <path d="M84 215 Q66 250 56 340" stroke="#7a1818" stroke-width="0.6" fill="none" opacity=".5"/>
  <!-- Cloak gold clasp on right shoulder -->
  <circle cx="222" cy="205" r="6" fill="#d4a020" stroke="#806010" stroke-width="0.8"/>
  <circle cx="222" cy="205" r="2" fill="#f0c040"/>
  <!-- RIGHT ARM raising gladius -->
  <path d="M224 200 Q244 198 252 168 Q258 130 254 88 L240 92 Q244 130 240 162 Q232 188 218 198Z" fill="#a08038"/>
  <!-- GLADIUS -->
  <path d="M254 88 L260 16 Q262 8 256 4 Q250 4 248 14 L244 88Z" fill="#dcd6c0"/>
  <line x1="252" y1="60" x2="258" y2="20" stroke="#f0e8c8" stroke-width="1.4" opacity=".7"/>
  <rect x="240" y="82" width="22" height="9" rx="2" fill="#a8841c"/>
  <rect x="244" y="91" width="14" height="36" rx="3" fill="#5a3820"/>
  <!-- LEFT ARM holding scroll -->
  <path d="M96 200 Q72 230 66 296 Q70 312 84 312 Q96 304 102 282 Q106 248 106 220Z" fill="#a08038"/>
  <ellipse cx="84" cy="318" rx="13" ry="15" fill="url(#cs-skin)"/>
  <!-- Scroll in left hand -->
  <rect x="74" y="316" width="22" height="46" rx="2" fill="#e8d8a8" stroke="#806840" stroke-width="0.8" transform="rotate(-12 84 338)"/>
  <line x1="76" y1="324" x2="92" y2="320" stroke="#806840" stroke-width="0.4"/>
  <line x1="76" y1="332" x2="92" y2="328" stroke="#806840" stroke-width="0.4"/>
  <line x1="78" y1="340" x2="93" y2="336" stroke="#806840" stroke-width="0.4"/>
  <!-- PTERUGES (leather strips at waist) -->
  <g fill="#7a5e28" stroke="#5a4018" stroke-width="0.6">
    <path d="M104 348 L108 412 L120 410 L120 348Z"/>
    <path d="M124 348 L128 412 L140 410 L140 348Z"/>
    <path d="M144 348 L146 412 L156 410 L156 348Z"/>
    <path d="M164 348 L164 410 L174 412 L176 348Z"/>
    <path d="M180 348 L180 410 L192 412 L196 348Z"/>
    <path d="M200 348 L200 410 L212 412 L216 348Z"/>
  </g>
  <!-- Pteruges metal studs -->
  <circle cx="114" cy="358" r="1.4" fill="#d4a020"/>
  <circle cx="134" cy="358" r="1.4" fill="#d4a020"/>
  <circle cx="150" cy="358" r="1.4" fill="#d4a020"/>
  <circle cx="170" cy="358" r="1.4" fill="#d4a020"/>
  <circle cx="186" cy="358" r="1.4" fill="#d4a020"/>
  <circle cx="206" cy="358" r="1.4" fill="#d4a020"/>
  <!-- GREAVES (leg armor) -->
  <path d="M114 410 Q116 470 124 530 L150 530 Q150 470 150 410Z" fill="#a08038"/>
  <path d="M170 410 Q170 470 170 530 L196 530 Q204 470 206 410Z" fill="#8e6e30"/>
  <ellipse cx="132" cy="470" rx="12" ry="6" stroke="#604018" stroke-width="0.6" fill="none"/>
  <ellipse cx="188" cy="470" rx="12" ry="6" stroke="#604018" stroke-width="0.6" fill="none"/>
  <!-- SANDALS -->
  <path d="M118 532 Q124 548 152 548 L154 532Z" fill="#806020"/>
  <path d="M202 532 Q196 548 168 548 L166 532Z" fill="#806020"/>
  <path d="M126 538 L148 538 M126 542 L148 542" stroke="#3a2810" stroke-width="0.5"/>
  <path d="M170 538 L194 538 M170 542 L194 542" stroke="#3a2810" stroke-width="0.5"/>
  <!-- NEON GLOWS — gold -->
  <path d="M260 16 L254 88" stroke="#f0c030" stroke-width="1.4" fill="none" opacity=".85" filter="url(#cs-glow)"/>
  <path d="M82 210 Q60 250 50 340" stroke="#d4a020" stroke-width="0.9" fill="none" opacity=".55"/>
  <ellipse cx="160" cy="92" rx="50" ry="22" fill="none" stroke="#f0c040" stroke-width="0.6" opacity=".7" filter="url(#cs-glow)"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="546" rx="92" ry="14" fill="#c09020" opacity=".42"/>
</svg>`;

// store; remaining functions appended via separate file
window.AMENTI_SVG = F;
})();

// Stardust Engine — character SVGs (part 2)
(function(){
'use strict';
const F = window.AMENTI_SVG || {};

function defs(id, glow, bg){
  return `<defs>
    <radialGradient id="${id}-bg" cx="50%" cy="85%" r="65%"><stop offset="0%" stop-color="${bg}" stop-opacity=".55"/><stop offset="100%" stop-color="#05050f" stop-opacity="0"/></radialGradient>
    <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d8a880"/><stop offset="100%" stop-color="#9c6f4c"/></linearGradient>
  </defs>`;
}

// ────────────────────────────────────────────────────────────────────
// GANDHI — improved
F.gandhi = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('gd','#c0c8d8','#303840')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#gd-bg)"/>
  <!-- BALD HEAD -->
  <ellipse cx="160" cy="138" rx="28" ry="32" fill="url(#gd-skin)"/>
  <!-- Bald top highlight -->
  <ellipse cx="155" cy="115" rx="18" ry="11" fill="#e8c89c" opacity=".5"/>
  <!-- Side hair tuft (very small) -->
  <path d="M132 138 Q128 150 132 158" stroke="#2a1a08" stroke-width="2.5" fill="none"/>
  <path d="M188 138 Q192 150 188 158" stroke="#2a1a08" stroke-width="2.5" fill="none"/>
  <!-- LARGE EARS -->
  <ellipse cx="128" cy="142" rx="6" ry="11" fill="url(#gd-skin)"/>
  <ellipse cx="192" cy="142" rx="6" ry="11" fill="url(#gd-skin)"/>
  <path d="M128 138 Q124 144 128 150" stroke="#8a6038" stroke-width="0.6" fill="none" opacity=".7"/>
  <path d="M192 138 Q196 144 192 150" stroke="#8a6038" stroke-width="0.6" fill="none" opacity=".7"/>
  <!-- ROUND SPECTACLES -->
  <circle cx="146" cy="142" r="13" fill="rgba(160,180,200,0.12)" stroke="#c8a838" stroke-width="2.4"/>
  <circle cx="174" cy="142" r="13" fill="rgba(160,180,200,0.12)" stroke="#c8a838" stroke-width="2.4"/>
  <line x1="159" y1="142" x2="161" y2="142" stroke="#c8a838" stroke-width="2"/>
  <line x1="133" y1="142" x2="124" y2="144" stroke="#c8a838" stroke-width="1.5"/>
  <line x1="187" y1="142" x2="196" y2="144" stroke="#c8a838" stroke-width="1.5"/>
  <!-- Eyes behind glasses -->
  <circle cx="146" cy="142" r="4.5" fill="#180a04"/>
  <circle cx="174" cy="142" r="4.5" fill="#180a04"/>
  <circle cx="144" cy="141" r="1.6" fill="#5a6878"/>
  <circle cx="172" cy="141" r="1.6" fill="#5a6878"/>
  <!-- Glasses reflection -->
  <path d="M140 136 Q146 132 152 136" stroke="#fff" stroke-width="0.6" fill="none" opacity=".55"/>
  <path d="M168 136 Q174 132 180 136" stroke="#fff" stroke-width="0.6" fill="none" opacity=".55"/>
  <!-- Brow -->
  <path d="M138 130 Q146 128 154 130" stroke="#5a3818" stroke-width="1.5" fill="none"/>
  <path d="M166 130 Q174 128 182 130" stroke="#5a3818" stroke-width="1.5" fill="none"/>
  <!-- Nose -->
  <path d="M156 148 Q154 162 152 170 Q160 174 168 170 Q166 162 164 148" fill="#9a6c44" opacity=".55"/>
  <!-- Mustache -->
  <path d="M144 178 Q160 176 176 178 Q172 184 160 184 Q148 184 144 178Z" fill="#d8d4cc"/>
  <!-- Mouth (gentle smile) -->
  <path d="M148 188 Q160 192 172 188" stroke="#7a4a20" stroke-width="1.4" fill="none"/>
  <!-- WHITE SHAWL over left shoulder -->
  <path d="M100 188 Q126 174 154 170 L150 290 Q116 296 96 282 Q88 250 96 215Z" fill="#eeeae0"/>
  <path d="M100 200 Q120 208 145 200" stroke="#c8c4b8" stroke-width="0.6" fill="none" opacity=".7"/>
  <!-- DHOTI body — very thin frame -->
  <path d="M122 188 Q142 178 160 178 Q178 178 198 188 L196 440 Q178 446 160 446 Q142 446 124 440Z" fill="#f0ece2"/>
  <!-- Dhoti folds (vertical wrap lines) -->
  <line x1="160" y1="180" x2="160" y2="442" stroke="#d8d4cc" stroke-width="0.8" opacity=".55"/>
  <path d="M142 180 Q138 280 140 442" stroke="#d8d4cc" stroke-width="0.6" opacity=".5" fill="none"/>
  <path d="M178 180 Q182 280 180 442" stroke="#d8d4cc" stroke-width="0.6" opacity=".5" fill="none"/>
  <!-- Dhoti hem fold detail -->
  <path d="M124 440 Q160 446 196 440 L194 450 Q160 456 126 450Z" fill="#dcd6cc"/>
  <!-- ARMS — thin -->
  <path d="M198 188 Q216 208 222 270 Q224 296 220 312 L210 308 Q212 290 208 268 Q200 212 188 196Z" fill="#eeeae0"/>
  <path d="M122 188 Q104 208 98 270 Q96 296 100 312 L110 308 Q108 290 112 268 Q120 212 132 196Z" fill="#eeeae0"/>
  <!-- HANDS -->
  <ellipse cx="216" cy="316" rx="11" ry="14" fill="url(#gd-skin)"/>
  <ellipse cx="104" cy="318" rx="11" ry="14" fill="url(#gd-skin)"/>
  <!-- LEGS (thin) -->
  <rect x="138" y="438" width="18" height="118" fill="#e8e4d8"/>
  <rect x="164" y="438" width="18" height="118" fill="#e0dccc"/>
  <!-- KNEE shadow -->
  <ellipse cx="147" cy="490" rx="9" ry="3" fill="#c8c0b0" opacity=".4"/>
  <ellipse cx="173" cy="490" rx="9" ry="3" fill="#bcb4a4" opacity=".4"/>
  <!-- SANDALS -->
  <ellipse cx="146" cy="552" rx="22" ry="6" fill="#a08858"/>
  <ellipse cx="174" cy="552" rx="22" ry="6" fill="#90784c"/>
  <path d="M132 552 Q146 546 160 552" stroke="#5a4018" stroke-width="0.6" fill="none"/>
  <path d="M160 552 Q174 546 188 552" stroke="#5a4018" stroke-width="0.6" fill="none"/>
  <!-- WALKING STAFF -->
  <line x1="226" y1="40" x2="216" y2="540" stroke="#7a5028" stroke-width="7" stroke-linecap="round"/>
  <line x1="225" y1="40" x2="215" y2="540" stroke="#9a7038" stroke-width="2" opacity=".4"/>
  <!-- Staff knob -->
  <ellipse cx="225" cy="38" rx="7" ry="9" fill="#5a3818"/>
  <ellipse cx="225" cy="34" rx="3" ry="2" fill="#8a6028" opacity=".6"/>
  <!-- POCKET WATCH on shawl -->
  <circle cx="160" cy="248" r="6" fill="#d4a020" stroke="#806010" stroke-width="0.8"/>
  <circle cx="160" cy="248" r="3" fill="#f0c040"/>
  <line x1="160" y1="246" x2="160" y2="250" stroke="#3a2810" stroke-width="0.4"/>
  <line x1="158" y1="248" x2="162" y2="248" stroke="#3a2810" stroke-width="0.4"/>
  <path d="M160 254 Q166 264 172 270" stroke="#d4a020" stroke-width="0.8" fill="none" opacity=".7"/>
  <!-- NEON glows — silver -->
  <line x1="226" y1="40" x2="216" y2="540" stroke="#d8e0f0" stroke-width="0.8" opacity=".5" filter="url(#gd-glow)"/>
  <path d="M100 188 Q82 215 90 270" stroke="#c0c8d8" stroke-width="0.8" fill="none" opacity=".5"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="556" rx="78" ry="12" fill="#c0c8d8" opacity=".3"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// MOSES — improved
F.moses = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('mo','#d4a020','#603800')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#mo-bg)"/>
  <!-- HEAD -->
  <ellipse cx="160" cy="120" rx="30" ry="34" fill="url(#mo-skin)"/>
  <!-- WIND-BLOWN WHITE HAIR -->
  <path d="M126 102 Q108 70 118 50 Q138 40 154 50 L150 96 Z" fill="#ddd8d0"/>
  <path d="M194 102 Q220 60 232 56 Q244 64 238 88 Q224 110 200 116 Z" fill="#cdc8c0"/>
  <!-- Hair texture lines -->
  <path d="M124 88 Q116 70 124 56" stroke="#aaa494" stroke-width="0.5" fill="none"/>
  <path d="M210 84 Q224 70 230 64" stroke="#aaa494" stroke-width="0.5" fill="none"/>
  <!-- HORN-LIGHT (the iconography from Michelangelo's Moses) -->
  <path d="M138 50 L132 28 L148 38 Z" fill="#f0c040" opacity=".7" filter="url(#mo-glow)"/>
  <path d="M182 50 L188 28 L172 38 Z" fill="#f0c040" opacity=".7" filter="url(#mo-glow)"/>
  <!-- VERY LONG BEARD -->
  <path d="M130 145 Q116 180 110 220 Q112 260 124 285 Q145 305 160 308 Q175 305 196 285 Q208 260 210 220 Q204 180 190 145" fill="#dcd8d0"/>
  <!-- Beard wave texture -->
  <path d="M140 160 Q120 200 124 250 Q128 290 145 305" stroke="#bcb6ac" stroke-width="0.5" fill="none" opacity=".7"/>
  <path d="M160 158 Q160 230 160 308" stroke="#bcb6ac" stroke-width="0.5" fill="none" opacity=".5"/>
  <path d="M180 160 Q200 200 196 250 Q192 290 175 305" stroke="#bcb6ac" stroke-width="0.5" fill="none" opacity=".7"/>
  <!-- Eyes (intense, prophetic) -->
  <ellipse cx="148" cy="116" rx="6" ry="4.5" fill="#1a0c04"/>
  <ellipse cx="172" cy="116" rx="6" ry="4.5" fill="#1a0c04"/>
  <circle cx="148" cy="115" r="2" fill="#806ca8"/>
  <circle cx="172" cy="115" r="2" fill="#806ca8"/>
  <!-- Heavy white brows -->
  <path d="M138 104 Q150 100 158 104" stroke="#cdc8c0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M162 104 Q170 100 182 104" stroke="#cdc8c0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Nose (strong, aged) -->
  <path d="M158 122 Q156 138 154 148 Q160 152 168 148 Q166 138 164 122" fill="#8a5c38" opacity=".55"/>
  <!-- INNER ROBE -->
  <path d="M104 192 Q138 180 160 178 Q182 180 216 192 L212 460 Q182 470 160 470 Q138 470 108 460Z" fill="#d4c08c"/>
  <!-- Inner robe pattern -->
  <line x1="160" y1="180" x2="160" y2="468" stroke="#bca878" stroke-width="0.8" opacity=".5"/>
  <path d="M132 184 Q128 320 132 466" stroke="#bca878" stroke-width="0.6" opacity=".4" fill="none"/>
  <path d="M188 184 Q192 320 188 466" stroke="#bca878" stroke-width="0.6" opacity=".4" fill="none"/>
  <!-- OUTER ROBE (wind-swept) -->
  <path d="M76 218 Q56 250 46 348 Q60 380 84 398 Q98 350 102 295 Q106 252 100 224Z" fill="#a87830"/>
  <path d="M244 218 Q264 250 274 348 Q260 380 236 398 Q222 350 218 295 Q214 252 220 224Z" fill="#9a6e28"/>
  <!-- Robe edge embroidery -->
  <path d="M76 218 Q60 248 50 348" stroke="#d4a020" stroke-width="0.6" fill="none" opacity=".6"/>
  <path d="M244 218 Q260 248 270 348" stroke="#d4a020" stroke-width="0.6" fill="none" opacity=".6"/>
  <!-- BELT/GIRDLE -->
  <rect x="118" y="304" width="84" height="16" rx="2" fill="#7a5020"/>
  <rect x="118" y="304" width="84" height="3" fill="#a87838"/>
  <rect x="118" y="318" width="84" height="2" fill="#5a3818"/>
  <!-- Belt buckle -->
  <rect x="148" y="306" width="24" height="14" rx="1" fill="#d4a020"/>
  <text x="160" y="317" text-anchor="middle" font-family="Special Elite,monospace" font-size="9" fill="#5a3818" font-weight="bold">י</text>
  <!-- STAFF (raised diagonally) -->
  <line x1="68" y1="540" x2="92" y2="20" stroke="#7a5018" stroke-width="9" stroke-linecap="round"/>
  <line x1="69" y1="538" x2="93" y2="22" stroke="#a87830" stroke-width="2.5" opacity=".4"/>
  <!-- Gnarled staff top -->
  <path d="M92 20 Q98 6 90 2 Q82 0 80 14 L86 28 Z" stroke="#5a3818" stroke-width="6" fill="#7a5018"/>
  <circle cx="86" cy="14" r="3" fill="#d4a020" opacity=".7"/>
  <!-- LEFT HAND on staff -->
  <ellipse cx="76" cy="312" rx="13" ry="16" fill="url(#mo-skin)" transform="rotate(-10 76 312)"/>
  <!-- Knuckle detail -->
  <path d="M70 310 L82 314" stroke="#7a5028" stroke-width="0.5" fill="none"/>
  <!-- STONE TABLETS (in right arm) -->
  <g transform="translate(212,232)">
    <!-- Left tablet -->
    <path d="M0 0 L24 0 L24 100 Q24 108 16 110 L4 110 Q0 108 0 100Z" fill="#a8b0c0" stroke="#c8a020" stroke-width="2"/>
    <!-- Right tablet -->
    <path d="M28 0 L52 0 Q56 0 56 6 L56 100 Q56 110 48 110 L36 110 Q28 108 28 100Z" fill="#9aa4b8" stroke="#c8a020" stroke-width="2"/>
    <!-- Hebrew commandment markings -->
    <text x="12" y="20" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">א</text>
    <text x="12" y="36" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ב</text>
    <text x="12" y="52" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ג</text>
    <text x="12" y="68" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ד</text>
    <text x="12" y="84" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ה</text>
    <text x="42" y="20" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ו</text>
    <text x="42" y="36" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ז</text>
    <text x="42" y="52" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ח</text>
    <text x="42" y="68" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">ט</text>
    <text x="42" y="84" text-anchor="middle" font-family="Special Elite,monospace" font-size="7" fill="#d4a020" font-weight="bold">י</text>
    <!-- Tablet glow -->
    <rect x="0" y="0" width="56" height="110" rx="2" fill="none" stroke="#f0c040" stroke-width="0.8" opacity=".7" filter="url(#mo-glow)"/>
  </g>
  <!-- RIGHT ARM holding tablets -->
  <path d="M216 200 Q230 208 244 220 L246 340 Q232 342 218 332 L208 200Z" fill="#b08840" opacity=".9"/>
  <!-- Robe hem at feet -->
  <path d="M108 460 Q90 488 84 540 L236 540 Q230 488 212 460Z" fill="#c0a878"/>
  <path d="M108 460 Q90 488 84 540" stroke="#a08850" stroke-width="0.6" fill="none" opacity=".6"/>
  <!-- SANDALS visible -->
  <ellipse cx="138" cy="540" rx="26" ry="7" fill="#7a5018"/>
  <ellipse cx="182" cy="540" rx="26" ry="7" fill="#7a5018"/>
  <path d="M118 540 Q130 535 142 540" stroke="#3a2810" stroke-width="0.5" fill="none"/>
  <path d="M165 540 Q178 535 192 540" stroke="#3a2810" stroke-width="0.5" fill="none"/>
  <!-- NEON glows — amber -->
  <line x1="92" y1="20" x2="68" y2="540" stroke="#d4a020" stroke-width="1.2" opacity=".7" filter="url(#mo-glow)"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="546" rx="100" ry="14" fill="#c08020" opacity=".4"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// HANNIBAL — improved
F.hannibal = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('hb','#d07020','#502800')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#hb-bg)"/>
  <!-- PLUME (horse-hair crest, dramatic) -->
  <path d="M138 12 Q146 0 160 0 Q174 0 182 12 L176 60 L144 60 Z" fill="#c02020"/>
  <path d="M142 14 Q150 4 160 2 Q170 4 178 14 L172 56 L148 56 Z" fill="#e03030"/>
  <path d="M148 16 Q154 8 160 8 Q166 8 172 16 L168 50 L152 50 Z" fill="#f04040"/>
  <!-- Plume strands -->
  <line x1="148" y1="20" x2="146" y2="56" stroke="#8a1818" stroke-width="0.6"/>
  <line x1="160" y1="14" x2="160" y2="54" stroke="#8a1818" stroke-width="0.6"/>
  <line x1="172" y1="20" x2="174" y2="56" stroke="#8a1818" stroke-width="0.6"/>
  <!-- Plume holder -->
  <rect x="146" y="56" width="28" height="12" rx="2" fill="#7a5828"/>
  <circle cx="152" cy="62" r="1.4" fill="#a87838"/>
  <circle cx="168" cy="62" r="1.4" fill="#a87838"/>
  <!-- HELMET CROWN -->
  <path d="M104 108 Q104 70 122 56 Q140 46 160 46 Q180 46 198 56 Q216 70 216 108 L216 134 Q196 146 160 148 Q124 146 104 134Z" fill="#7a5828"/>
  <!-- Helmet rim -->
  <ellipse cx="160" cy="108" rx="56" ry="10" fill="none" stroke="#a87838" stroke-width="2"/>
  <!-- Helmet engraving (Phoenician palm motif) -->
  <path d="M160 88 L156 96 L160 92 L164 96Z" fill="#d09040" opacity=".7"/>
  <circle cx="160" cy="98" r="2" fill="#d09040" opacity=".7"/>
  <!-- Cheek guards -->
  <path d="M104 108 L100 138 Q98 152 104 162 L122 162 Q118 152 120 140 L122 108Z" fill="#5a4018"/>
  <path d="M216 108 L220 138 Q222 152 216 162 L198 162 Q202 152 200 140 L198 108Z" fill="#5a4018"/>
  <!-- Nose guard -->
  <rect x="152" y="106" width="14" height="58" rx="3" fill="#3a2810"/>
  <!-- Helmet rivets -->
  <circle cx="124" cy="118" r="2.2" fill="#a87838"/>
  <circle cx="196" cy="118" r="2.2" fill="#a87838"/>
  <circle cx="124" cy="132" r="2.2" fill="#a87838"/>
  <circle cx="196" cy="132" r="2.2" fill="#a87838"/>
  <!-- FACE visible between cheek guards -->
  <ellipse cx="160" cy="124" rx="22" ry="26" fill="url(#hb-skin)"/>
  <!-- Fierce eyes -->
  <ellipse cx="148" cy="120" rx="5" ry="3.5" fill="#1a0a04"/>
  <ellipse cx="172" cy="120" rx="5" ry="3.5" fill="#1a0a04"/>
  <circle cx="148" cy="119" r="1.6" fill="#5040a0"/>
  <circle cx="172" cy="119" r="1.6" fill="#5040a0"/>
  <!-- Determined brow -->
  <path d="M140 110 Q150 106 156 110" stroke="#5a2818" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M164 110 Q170 106 180 110" stroke="#5a2818" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- BATTLE EYE PATCH (Hannibal lost his eye crossing the Arno) -->
  <path d="M140 116 L156 120 L160 124 L160 128 L138 128Z" fill="#1a0a04"/>
  <line x1="138" y1="116" x2="118" y2="108" stroke="#3a2810" stroke-width="2"/>
  <line x1="138" y1="128" x2="118" y2="138" stroke="#3a2810" stroke-width="2"/>
  <!-- Beard -->
  <path d="M138 142 Q140 162 154 168 Q160 170 166 168 Q180 162 182 142 Q175 158 162 162 Q149 162 138 142Z" fill="#241408"/>
  <!-- PALUDAMENTUM (scarlet cloak) -->
  <path d="M86 212 Q66 244 56 332 Q70 364 90 380 Q102 336 104 282 Q108 248 102 220Z" fill="#9a1818"/>
  <path d="M86 215 Q72 245 62 332" stroke="#7a1010" stroke-width="0.6" fill="none" opacity=".5"/>
  <!-- Cloak gold clasp on shoulder -->
  <circle cx="232" cy="208" r="6" fill="#d4a020" stroke="#806010" stroke-width="0.8"/>
  <!-- MUSCLE CUIRASS -->
  <path d="M96 208 Q132 192 156 188 L152 354 Q124 366 96 376Z" fill="#7a5828"/>
  <path d="M224 208 Q188 192 164 188 L168 354 Q200 366 224 376Z" fill="#6a4820"/>
  <rect x="152" y="188" width="16" height="170" fill="#8a6830"/>
  <!-- Muscle etching -->
  <path d="M100 220 Q126 212 150 214 Q152 244 144 250 Q120 252 100 248Z" stroke="#4a2810" stroke-width="1.2" fill="#5a3818" opacity=".5"/>
  <path d="M220 220 Q194 212 170 214 Q168 244 176 250 Q200 252 220 248Z" stroke="#4a2810" stroke-width="1.2" fill="#5a3818" opacity=".5"/>
  <ellipse cx="160" cy="270" rx="11" ry="7" stroke="#4a2810" stroke-width="1.2" fill="none"/>
  <ellipse cx="160" cy="294" rx="12" ry="6" stroke="#4a2810" stroke-width="1.2" fill="none"/>
  <ellipse cx="160" cy="318" rx="10" ry="5" stroke="#4a2810" stroke-width="1" fill="none"/>
  <!-- ELEPHANT GLYPH on chest -->
  <g transform="translate(160,236)">
    <path d="M-12 0 Q-14 4 -12 8 L-8 6 L-6 8 L-4 4 L-2 8 L0 4 L2 8 L4 4 L6 6 L10 6 Q14 4 12 0 Z" fill="#d4a020" opacity=".7"/>
    <circle cx="-8" cy="-2" r="1.5" fill="#d4a020"/>
  </g>
  <!-- LEFT ARM holding shield -->
  <path d="M96 208 Q76 246 70 304 Q74 324 86 326 Q98 322 106 308 Q110 280 110 250Z" fill="#7a5828"/>
  <!-- LARGE ROUND SHIELD -->
  <ellipse cx="46" cy="308" rx="56" ry="60" fill="#5a4018" stroke="#a87838" stroke-width="3"/>
  <ellipse cx="46" cy="308" rx="48" ry="52" fill="none" stroke="#7a5828" stroke-width="1.4"/>
  <ellipse cx="46" cy="308" rx="36" ry="40" fill="none" stroke="#6a4820" stroke-width="1"/>
  <ellipse cx="46" cy="308" rx="22" ry="24" fill="none" stroke="#7a5828" stroke-width="0.8"/>
  <!-- Shield boss -->
  <circle cx="46" cy="308" r="14" fill="#8a6830" stroke="#a87838" stroke-width="1.5"/>
  <circle cx="46" cy="308" r="7" fill="#a87838"/>
  <circle cx="46" cy="308" r="3" fill="#d4a020"/>
  <!-- Shield Tanit symbol (Carthaginian goddess) -->
  <g transform="translate(46,260)" stroke="#3a2810" stroke-width="1.4" fill="none">
    <line x1="0" y1="0" x2="0" y2="-12"/>
    <circle cx="0" cy="-16" r="4"/>
    <line x1="-10" y1="0" x2="10" y2="0"/>
  </g>
  <!-- SPEAR (right side, tall) -->
  <line x1="252" y1="546" x2="276" y2="20" stroke="#7a5828" stroke-width="6.5" stroke-linecap="round"/>
  <line x1="253" y1="544" x2="277" y2="22" stroke="#a87838" stroke-width="1.5" opacity=".4"/>
  <!-- Spear tip (leaf) -->
  <path d="M276 20 Q283 4 276 -4 Q269 -2 264 8 L260 22 Z" fill="#dcd6c0"/>
  <line x1="268" y1="6" x2="276" y2="14" stroke="#f0e8c8" stroke-width="1" opacity=".7"/>
  <!-- RIGHT ARM (spear) -->
  <path d="M224 208 Q248 218 258 256 Q262 280 256 300 L242 296 Q244 276 240 256 Q230 226 214 214Z" fill="#7a5828"/>
  <!-- PTERUGES -->
  <g fill="#6a4820" stroke="#4a2810" stroke-width="0.6">
    <path d="M104 354 L108 422 L122 420 L122 354Z"/>
    <path d="M126 354 L130 422 L142 420 L144 354Z"/>
    <path d="M148 354 L150 422 L160 420 L160 354Z"/>
    <path d="M164 354 L164 420 L174 422 L176 354Z"/>
    <path d="M180 354 L182 420 L196 422 L196 354Z"/>
    <path d="M200 354 L200 420 L214 422 L218 354Z"/>
  </g>
  <circle cx="114" cy="364" r="1.4" fill="#a87838"/>
  <circle cx="134" cy="364" r="1.4" fill="#a87838"/>
  <circle cx="154" cy="364" r="1.4" fill="#a87838"/>
  <circle cx="170" cy="364" r="1.4" fill="#a87838"/>
  <circle cx="188" cy="364" r="1.4" fill="#a87838"/>
  <circle cx="208" cy="364" r="1.4" fill="#a87838"/>
  <!-- GREAVES -->
  <path d="M108 422 Q110 480 120 540 L148 540 Q150 480 150 422Z" fill="#8a6830"/>
  <path d="M170 422 Q170 480 172 540 L200 540 Q210 480 212 422Z" fill="#7a5828"/>
  <ellipse cx="130" cy="478" rx="12" ry="7" stroke="#4a2810" stroke-width="0.6" fill="none"/>
  <ellipse cx="190" cy="478" rx="12" ry="7" stroke="#4a2810" stroke-width="0.6" fill="none"/>
  <!-- BOOTS / sandaled greaves -->
  <path d="M114 542 Q120 552 152 552 L154 540Z" fill="#3a2810"/>
  <path d="M206 542 Q200 552 168 552 L166 540Z" fill="#3a2810"/>
  <!-- NEON glows — bronze/copper -->
  <path d="M276 20 L252 546" stroke="#d07020" stroke-width="1.4" fill="none" opacity=".7" filter="url(#hb-glow)"/>
  <path d="M160 0 L155 56" stroke="#ff5030" stroke-width="1.6" fill="none" opacity=".75" filter="url(#hb-glow)"/>
  <path d="M86 212 Q64 244 54 332" stroke="#b06018" stroke-width="0.9" fill="none" opacity=".55"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="552" rx="100" ry="14" fill="#c06018" opacity=".42"/>
</svg>`;

window.AMENTI_SVG = F;
})();

// Stardust Engine — character SVGs (part 3 — new figures)
(function(){
'use strict';
const F = window.AMENTI_SVG || {};

function defs(id, glow, bg){
  return `<defs>
    <radialGradient id="${id}-bg" cx="50%" cy="85%" r="65%"><stop offset="0%" stop-color="${bg}" stop-opacity=".55"/><stop offset="100%" stop-color="#05050f" stop-opacity="0"/></radialGradient>
    <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0b890"/><stop offset="100%" stop-color="#a07c54"/></linearGradient>
  </defs>`;
}

// ────────────────────────────────────────────────────────────────────
// CLEOPATRA
F.cleopatra = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('cl','#40c0c0','#106060')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#cl-bg)"/>
  <!-- NEMES HEADDRESS (royal striped cloth) -->
  <path d="M104 92 Q104 60 130 44 Q160 36 190 44 Q216 60 216 92 L222 200 Q210 220 192 222 L160 220 L128 222 Q110 220 98 200 Z" fill="#0a3060"/>
  <!-- Headdress stripes (royal blue/gold) -->
  <path d="M108 100 Q108 68 132 52 Q160 46 188 52 Q212 68 212 100" fill="none" stroke="#d4a020" stroke-width="3"/>
  <path d="M112 116 Q112 82 134 68 Q160 64 186 68 Q208 82 208 116" fill="none" stroke="#d4a020" stroke-width="2"/>
  <path d="M116 132 Q116 96 136 84 Q160 80 184 84 Q204 96 204 132" fill="none" stroke="#d4a020" stroke-width="1.5"/>
  <!-- Headdress side flaps -->
  <path d="M104 92 Q98 130 102 200 Q98 220 90 226 L90 220 Q92 180 96 130 Q100 100 104 92Z" fill="#0a3060"/>
  <path d="M216 92 Q222 130 218 200 Q222 220 230 226 L230 220 Q228 180 224 130 Q220 100 216 92Z" fill="#0a3060"/>
  <!-- URAEUS (rearing cobra) on forehead -->
  <path d="M154 38 Q150 30 152 20 Q156 12 160 14 Q164 12 168 20 Q170 30 166 38 L166 50 L154 50 Z" fill="#d4a020" stroke="#806010" stroke-width="0.8"/>
  <ellipse cx="160" cy="22" rx="6" ry="4" fill="#1a0c04"/>
  <ellipse cx="160" cy="22" rx="3" ry="2" fill="#d4a020"/>
  <!-- Cobra hood spread -->
  <path d="M148 32 Q142 26 148 22 L154 28Z" fill="#806010" opacity=".8"/>
  <path d="M172 32 Q178 26 172 22 L166 28Z" fill="#806010" opacity=".8"/>
  <!-- HEAD/FACE -->
  <ellipse cx="160" cy="148" rx="28" ry="32" fill="url(#cl-skin)"/>
  <!-- Cheek shadow -->
  <path d="M132 148 Q128 168 138 178" fill="#a07050" opacity=".4"/>
  <path d="M188 148 Q192 168 182 178" fill="#a07050" opacity=".4"/>
  <!-- KOHL EYES — heavy black liner extending past eye -->
  <path d="M138 142 L156 140 L162 144 L158 152 L142 152 L138 142Z" fill="#0a0604"/>
  <path d="M158 144 L182 142 L188 152 L162 152 L158 144Z" fill="#0a0604"/>
  <!-- Eyes proper -->
  <ellipse cx="148" cy="146" rx="5" ry="3.5" fill="#150a04"/>
  <ellipse cx="172" cy="146" rx="5" ry="3.5" fill="#150a04"/>
  <ellipse cx="148" cy="145" rx="2" ry="1.5" fill="#40a090"/>
  <ellipse cx="172" cy="145" rx="2" ry="1.5" fill="#40a090"/>
  <!-- Liner extension -->
  <path d="M138 144 L130 138" stroke="#0a0604" stroke-width="2" stroke-linecap="round"/>
  <path d="M188 144 L196 138" stroke="#0a0604" stroke-width="2" stroke-linecap="round"/>
  <!-- Brows (sharp, defined) -->
  <path d="M138 134 Q150 130 158 134" stroke="#0a0604" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M162 134 Q170 130 182 134" stroke="#0a0604" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <path d="M158 152 Q156 168 154 178 Q160 182 168 178 Q164 168 162 152" fill="#9a6c44" opacity=".55"/>
  <!-- Lips (full, painted) -->
  <path d="M148 192 Q160 188 172 192 Q170 198 160 200 Q150 198 148 192 Z" fill="#a02828"/>
  <path d="M148 192 Q160 188 172 192" stroke="#600808" stroke-width="0.4" fill="none"/>
  <!-- BROAD COLLAR (wesekh) — multi-row beaded -->
  <path d="M76 220 Q160 200 244 220 L240 264 Q160 254 80 264 Z" fill="#0a3060"/>
  <!-- Collar bead rows -->
  <path d="M82 224 Q160 206 238 224" fill="none" stroke="#d4a020" stroke-width="2"/>
  <path d="M84 232 Q160 216 236 232" fill="none" stroke="#40c0c0" stroke-width="1.5"/>
  <path d="M86 240 Q160 226 234 240" fill="none" stroke="#d4a020" stroke-width="1.5"/>
  <path d="M88 248 Q160 234 232 248" fill="none" stroke="#a02828" stroke-width="1.5"/>
  <path d="M90 256 Q160 244 230 256" fill="none" stroke="#d4a020" stroke-width="1.2"/>
  <!-- Center pendant — scarab with sun disc -->
  <ellipse cx="160" cy="262" rx="14" ry="10" fill="#40c0c0" stroke="#d4a020" stroke-width="1.5"/>
  <circle cx="160" cy="258" r="4" fill="#d4a020"/>
  <line x1="156" y1="262" x2="156" y2="270" stroke="#d4a020" stroke-width="0.8"/>
  <line x1="160" y1="262" x2="160" y2="272" stroke="#d4a020" stroke-width="0.8"/>
  <line x1="164" y1="262" x2="164" y2="270" stroke="#d4a020" stroke-width="0.8"/>
  <!-- WHITE LINEN GOWN (transparent, pleated) -->
  <path d="M104 264 Q160 258 216 264 L222 470 Q160 478 98 470 Z" fill="#f0e8d8" opacity=".95"/>
  <!-- Pleats -->
  <line x1="120" y1="270" x2="118" y2="466" stroke="#c8b890" stroke-width="0.5" opacity=".7"/>
  <line x1="138" y1="268" x2="136" y2="468" stroke="#c8b890" stroke-width="0.5" opacity=".6"/>
  <line x1="160" y1="268" x2="160" y2="468" stroke="#c8b890" stroke-width="0.5" opacity=".6"/>
  <line x1="182" y1="268" x2="184" y2="468" stroke="#c8b890" stroke-width="0.5" opacity=".6"/>
  <line x1="200" y1="270" x2="202" y2="466" stroke="#c8b890" stroke-width="0.5" opacity=".7"/>
  <!-- BELT/SASH -->
  <rect x="106" y="358" width="108" height="14" rx="1" fill="#d4a020"/>
  <rect x="106" y="358" width="108" height="3" fill="#f0c040"/>
  <text x="160" y="369" text-anchor="middle" font-family="Special Elite,monospace" font-size="9" fill="#5a3818">𓁹 𓏏 𓊪</text>
  <!-- ARMS, bare -->
  <path d="M104 264 Q86 290 80 348 Q82 366 92 366 Q104 360 110 344 Q114 312 116 282Z" fill="url(#cl-skin)"/>
  <path d="M216 264 Q234 290 240 348 Q238 366 228 366 Q216 360 210 344 Q206 312 204 282Z" fill="url(#cl-skin)"/>
  <!-- Gold armbands -->
  <rect x="84" y="320" width="22" height="8" rx="1" fill="#d4a020" stroke="#806010" stroke-width="0.5"/>
  <rect x="214" y="320" width="22" height="8" rx="1" fill="#d4a020" stroke="#806010" stroke-width="0.5"/>
  <!-- Hands -->
  <ellipse cx="86" cy="372" rx="11" ry="14" fill="url(#cl-skin)"/>
  <ellipse cx="234" cy="372" rx="11" ry="14" fill="url(#cl-skin)"/>
  <!-- ANKH in left hand -->
  <g transform="translate(86,372)">
    <ellipse cx="0" cy="-22" rx="6" ry="8" fill="none" stroke="#d4a020" stroke-width="2.5"/>
    <line x1="-7" y1="-14" x2="7" y2="-14" stroke="#d4a020" stroke-width="2.5"/>
    <line x1="0" y1="-14" x2="0" y2="2" stroke="#d4a020" stroke-width="2.5"/>
  </g>
  <!-- CROOK & FLAIL crossed at hip in right hand -->
  <g transform="translate(234,372)">
    <line x1="0" y1="-30" x2="-2" y2="20" stroke="#d4a020" stroke-width="3"/>
    <path d="M0 -30 Q4 -36 8 -32 Q10 -28 6 -26" fill="none" stroke="#d4a020" stroke-width="2.5"/>
    <line x1="6" y1="-28" x2="14" y2="20" stroke="#d4a020" stroke-width="3"/>
    <line x1="14" y1="-28" x2="10" y2="-36" stroke="#0a3060" stroke-width="2"/>
    <line x1="14" y1="-28" x2="18" y2="-36" stroke="#0a3060" stroke-width="2"/>
    <line x1="14" y1="-28" x2="14" y2="-36" stroke="#0a3060" stroke-width="2"/>
  </g>
  <!-- LEGS (under gown, slim) -->
  <rect x="142" y="468" width="16" height="78" fill="#e8e0d0"/>
  <rect x="162" y="468" width="16" height="78" fill="#dccfb8"/>
  <!-- SANDALS (gold) -->
  <ellipse cx="148" cy="548" rx="22" ry="6" fill="#d4a020"/>
  <ellipse cx="172" cy="548" rx="22" ry="6" fill="#a87838"/>
  <path d="M134 548 Q146 542 158 548" stroke="#806010" stroke-width="0.5" fill="none"/>
  <!-- NEON glows — turquoise -->
  <path d="M76 220 Q60 250 50 340" stroke="#40c0c0" stroke-width="0.9" fill="none" opacity=".55"/>
  <path d="M244 220 Q260 250 270 340" stroke="#40c0c0" stroke-width="0.9" fill="none" opacity=".55"/>
  <ellipse cx="160" cy="262" rx="14" ry="10" fill="none" stroke="#80f0e0" stroke-width="0.8" opacity=".7" filter="url(#cl-glow)"/>
  <!-- Ground glow -->
  <ellipse cx="160" cy="552" rx="90" ry="14" fill="#40c0c0" opacity=".4"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// TESLA
F.tesla = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('te','#80e0ff','#003060')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#te-bg)"/>
  <!-- HAIR (parted, slicked back) -->
  <path d="M122 100 Q116 70 132 56 Q160 44 188 56 Q204 70 198 100 Q190 108 160 110 Q130 108 122 100Z" fill="#1a0e08"/>
  <path d="M132 70 Q160 60 188 70" stroke="#0a0604" stroke-width="0.6" fill="none" opacity=".7"/>
  <line x1="160" y1="58" x2="160" y2="98" stroke="#0a0604" stroke-width="1" opacity=".5"/>
  <!-- HEAD (lean, sharp features) -->
  <ellipse cx="160" cy="136" rx="26" ry="32" fill="url(#te-skin)"/>
  <!-- Sharp cheekbone -->
  <path d="M132 144 Q128 168 138 178" fill="#a07050" opacity=".4"/>
  <path d="M188 144 Q192 168 182 178" fill="#a07050" opacity=".4"/>
  <!-- Eyes intense, slightly hooded -->
  <ellipse cx="148" cy="134" rx="5.5" ry="3.5" fill="#150a04"/>
  <ellipse cx="172" cy="134" rx="5.5" ry="3.5" fill="#150a04"/>
  <circle cx="148" cy="133" r="1.6" fill="#40a8c0"/>
  <circle cx="172" cy="133" r="1.6" fill="#40a8c0"/>
  <path d="M138 124 Q148 120 156 124" stroke="#3a2010" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M164 124 Q172 120 182 124" stroke="#3a2010" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <!-- Long nose -->
  <path d="M158 140 Q156 156 154 168 Q160 172 168 168 Q166 156 164 140" fill="#9a6c44" opacity=".55"/>
  <!-- Iconic moustache (thin, neat) -->
  <path d="M142 178 Q160 174 178 178 Q176 184 168 184 L160 182 L152 184 Q146 184 142 178Z" fill="#1a0e08"/>
  <!-- Mouth -->
  <path d="M152 192 Q160 196 168 192" stroke="#3a1808" stroke-width="1.2" fill="none"/>
  <!-- WHITE WING COLLAR + BLACK BOW TIE -->
  <path d="M138 198 L160 192 L182 198 L180 220 L160 226 L140 220 Z" fill="#ece8e0"/>
  <path d="M148 218 L160 224 L172 218 L168 232 L160 234 L152 232 Z" fill="#0a0a18"/>
  <!-- BLACK 1890s SUIT JACKET -->
  <path d="M76 230 Q108 210 138 204 L136 380 Q104 388 76 400 Z" fill="#0a0a14"/>
  <path d="M244 230 Q212 210 182 204 L184 380 Q216 388 244 400 Z" fill="#080814"/>
  <rect x="136" y="204" width="48" height="80" fill="#10101e"/>
  <!-- Lapels -->
  <path d="M138 204 L154 220 L150 280 L138 284 Z" fill="#1a1a28"/>
  <path d="M182 204 L166 220 L170 280 L182 284 Z" fill="#1a1a28"/>
  <!-- Lapel pin (Tesla coil glyph) -->
  <circle cx="148" cy="252" r="3" fill="#80e0ff" opacity=".8"/>
  <line x1="148" y1="248" x2="148" y2="256" stroke="#80e0ff" stroke-width="0.6"/>
  <!-- White shirt + waistcoat -->
  <path d="M152 230 L168 230 L168 320 L152 320 Z" fill="#ddd8ce"/>
  <line x1="160" y1="232" x2="160" y2="318" stroke="#a8a098" stroke-width="0.4"/>
  <circle cx="160" cy="252" r="1.4" fill="#1a1a28"/>
  <circle cx="160" cy="270" r="1.4" fill="#1a1a28"/>
  <circle cx="160" cy="288" r="1.4" fill="#1a1a28"/>
  <circle cx="160" cy="306" r="1.4" fill="#1a1a28"/>
  <!-- Pocket watch chain -->
  <path d="M150 304 Q156 312 162 308 Q170 305 178 312" stroke="#d4a020" stroke-width="1.2" fill="none"/>
  <circle cx="178" cy="313" r="2" fill="#d4a020"/>
  <!-- ARMS -->
  <path d="M76 230 Q56 270 50 340 Q54 354 68 354 Q80 348 88 332 Q96 296 100 250Z" fill="#0a0a14"/>
  <path d="M244 230 Q264 270 270 340 Q266 354 252 354 Q240 348 232 332 Q224 296 220 250Z" fill="#0a0a14"/>
  <!-- LEFT HAND holding spinning TESLA COIL -->
  <ellipse cx="60" cy="356" rx="12" ry="14" fill="url(#te-skin)" transform="rotate(-15 60 356)"/>
  <!-- RIGHT HAND holding glowing tube/lamp (wireless transmission) -->
  <ellipse cx="260" cy="356" rx="12" ry="14" fill="url(#te-skin)" transform="rotate(15 260 356)"/>
  <!-- The famous wireless tube lamp -->
  <g transform="translate(260,356)">
    <rect x="-3" y="-46" width="6" height="44" rx="1" fill="rgba(120,220,255,0.35)" stroke="#80e0ff" stroke-width="1.4"/>
    <ellipse cx="0" cy="-50" rx="6" ry="3" fill="#80e0ff" opacity=".7"/>
    <line x1="-2" y1="-44" x2="-2" y2="-6" stroke="#fff" stroke-width="0.5" opacity=".7"/>
    <!-- Glowing inner filament -->
    <line x1="0" y1="-44" x2="0" y2="-6" stroke="#80e0ff" stroke-width="1.5" opacity=".9" filter="url(#te-glow)"/>
  </g>
  <!-- Tesla coil in left hand -->
  <g transform="translate(60,356)">
    <ellipse cx="0" cy="-2" rx="14" ry="6" fill="#3a2810"/>
    <rect x="-4" y="-30" width="8" height="28" fill="#3a2810"/>
    <ellipse cx="0" cy="-30" rx="10" ry="4" fill="#5a4018"/>
    <!-- Spiraled wire -->
    <path d="M-4 -8 Q4 -12 -4 -16 Q4 -20 -4 -24" stroke="#d4a020" stroke-width="0.8" fill="none"/>
    <!-- LIGHTNING bolts arcing -->
    <path d="M0 -32 L-6 -42 L-2 -44 L-8 -54" stroke="#80e0ff" stroke-width="1.5" fill="none" filter="url(#te-glow)"/>
    <path d="M0 -32 L4 -40 L0 -44 L6 -52" stroke="#80e0ff" stroke-width="1.4" fill="none" filter="url(#te-glow)"/>
    <path d="M2 -32 L-2 -38 L2 -42 L-4 -48" stroke="#a0f0ff" stroke-width="1" fill="none" filter="url(#te-glow)"/>
  </g>
  <!-- TROUSERS -->
  <rect x="120" y="378" width="32" height="160" rx="2" fill="#0a0a14"/>
  <rect x="168" y="378" width="32" height="160" rx="2" fill="#080812"/>
  <line x1="136" y1="382" x2="136" y2="536" stroke="#1a1a28" stroke-width="0.5"/>
  <line x1="184" y1="382" x2="184" y2="536" stroke="#1a1a28" stroke-width="0.5"/>
  <!-- Polished shoes -->
  <path d="M114 532 Q120 548 152 550 L156 540Z" fill="#080810"/>
  <path d="M164 540 L168 550 Q200 548 206 532Z" fill="#080810"/>
  <!-- BACKGROUND ELECTRIC ARCS (decorative) -->
  <g opacity=".5" filter="url(#te-glow)">
    <path d="M40 200 Q70 220 50 240 Q80 260 60 280" stroke="#80e0ff" stroke-width="1" fill="none"/>
    <path d="M280 200 Q250 220 270 240 Q240 260 260 280" stroke="#80e0ff" stroke-width="1" fill="none"/>
  </g>
  <!-- NEON edge -->
  <path d="M76 230 Q56 270 50 340" stroke="#80e0ff" stroke-width="0.9" fill="none" opacity=".7" filter="url(#te-glow)"/>
  <path d="M244 230 Q264 270 270 340" stroke="#80e0ff" stroke-width="0.9" fill="none" opacity=".7"/>
  <!-- Ground glow (electric pool) -->
  <ellipse cx="160" cy="548" rx="92" ry="14" fill="#80e0ff" opacity=".4"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// SUN TZU
F['sun-tzu'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('st','#a0c060','#205830')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#st-bg)"/>
  <!-- TOPKNOT/hat (Chinese scholar's cap) -->
  <path d="M126 96 Q120 64 142 50 Q160 42 178 50 Q200 64 194 96 Q176 102 160 102 Q144 102 126 96Z" fill="#1a0e06"/>
  <!-- Cap topknot -->
  <ellipse cx="160" cy="48" rx="14" ry="18" fill="#241408"/>
  <ellipse cx="160" cy="40" rx="6" ry="10" fill="#3a2010"/>
  <!-- Cap band -->
  <rect x="126" y="92" width="68" height="8" fill="#0a0604"/>
  <rect x="126" y="92" width="68" height="3" fill="#d4a020" opacity=".7"/>
  <!-- Ear flaps with character -->
  <path d="M126 96 Q118 130 122 138" stroke="#1a0e06" stroke-width="2.5" fill="none"/>
  <path d="M194 96 Q202 130 198 138" stroke="#1a0e06" stroke-width="2.5" fill="none"/>
  <!-- HEAD -->
  <ellipse cx="160" cy="124" rx="28" ry="32" fill="url(#st-skin)"/>
  <!-- Cheek shadow -->
  <path d="M132 124 Q128 144 138 154" fill="#a07040" opacity=".35"/>
  <path d="M188 124 Q192 144 182 154" fill="#a07040" opacity=".35"/>
  <!-- Calm eyes (almond, half-open) -->
  <path d="M140 116 Q150 113 158 116 Q150 119 140 116Z" fill="#1a0a04"/>
  <path d="M162 116 Q170 113 180 116 Q170 119 162 116Z" fill="#1a0a04"/>
  <ellipse cx="150" cy="116" rx="2" ry="1.2" fill="#3a2810"/>
  <ellipse cx="170" cy="116" rx="2" ry="1.2" fill="#3a2810"/>
  <!-- Brows (calm horizontal) -->
  <path d="M140 106 Q150 104 158 106" stroke="#2a1808" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M162 106 Q170 104 180 106" stroke="#2a1808" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <path d="M156 130 Q154 144 152 154 Q160 158 168 154 Q166 144 164 130" fill="#8a5c38" opacity=".5"/>
  <!-- Mouth (slight, knowing) -->
  <path d="M150 168 Q160 170 170 168" stroke="#3a1808" stroke-width="1.2" fill="none"/>
  <!-- LONG MUSTACHE -->
  <path d="M140 175 Q160 172 180 175" stroke="#1a0e06" stroke-width="2" fill="none"/>
  <path d="M140 175 Q132 192 124 218" stroke="#241408" stroke-width="2" fill="none"/>
  <path d="M180 175 Q188 192 196 218" stroke="#241408" stroke-width="2" fill="none"/>
  <!-- LONG WISPY BEARD -->
  <path d="M148 184 Q146 220 144 260 Q148 280 154 282 Q160 280 166 282 Q172 280 176 260 Q174 220 172 184" stroke="#1a0e06" stroke-width="0.5" fill="#241408" opacity=".95"/>
  <line x1="152" y1="195" x2="151" y2="280" stroke="#0a0604" stroke-width="0.4" opacity=".5"/>
  <line x1="160" y1="195" x2="160" y2="282" stroke="#0a0604" stroke-width="0.4" opacity=".5"/>
  <line x1="168" y1="195" x2="169" y2="280" stroke="#0a0604" stroke-width="0.4" opacity=".5"/>
  <!-- ROBE COLLAR (cross-collared, dark teal) -->
  <path d="M104 192 L160 178 L216 192 L210 220 L160 232 L110 220Z" fill="#205830"/>
  <path d="M104 192 L160 178 L216 192" stroke="#3a8050" stroke-width="0.8" fill="none" opacity=".7"/>
  <!-- Cross-overlap -->
  <path d="M120 198 L160 220 L200 198 L200 240 L160 246 L120 240Z" fill="#1a4828"/>
  <!-- HANFU ROBE BODY (long, draping) -->
  <path d="M84 214 Q120 200 160 196 Q200 200 236 214 L232 470 Q200 480 160 480 Q120 480 88 470Z" fill="#3a8050"/>
  <!-- Robe folds -->
  <line x1="160" y1="200" x2="160" y2="478" stroke="#205830" stroke-width="0.8" opacity=".5"/>
  <path d="M124 202 Q120 320 124 478" stroke="#205830" stroke-width="0.6" opacity=".4" fill="none"/>
  <path d="M196 202 Q200 320 196 478" stroke="#205830" stroke-width="0.6" opacity=".4" fill="none"/>
  <!-- Robe edge (gold trim) -->
  <path d="M84 214 L82 472" stroke="#d4a020" stroke-width="1" opacity=".7"/>
  <path d="M236 214 L238 472" stroke="#d4a020" stroke-width="1" opacity=".7"/>
  <path d="M88 472 L232 472" stroke="#d4a020" stroke-width="1" opacity=".7"/>
  <!-- BAGUA medallion on chest -->
  <g transform="translate(160,290)">
    <circle cx="0" cy="0" r="20" fill="#0a0604" stroke="#d4a020" stroke-width="1.4"/>
    <circle cx="0" cy="0" r="14" fill="none" stroke="#d4a020" stroke-width="0.6" opacity=".6"/>
    <!-- Yin-yang dot pattern simplified -->
    <path d="M0 -14 A14 14 0 0 1 0 14 A7 7 0 0 0 0 0 A7 7 0 0 1 0 -14Z" fill="#dcd6c0"/>
    <circle cx="0" cy="-7" r="2" fill="#0a0604"/>
    <circle cx="0" cy="7" r="2" fill="#dcd6c0"/>
  </g>
  <!-- WIDE SLEEVES -->
  <path d="M40 214 Q70 200 138 198 L132 320 Q90 326 60 314 Q44 290 40 250 Z" fill="#3a8050"/>
  <path d="M280 214 Q250 200 182 198 L188 320 Q230 326 260 314 Q276 290 280 250 Z" fill="#3a8050"/>
  <!-- Sleeve trim -->
  <path d="M40 214 Q44 240 50 250" stroke="#d4a020" stroke-width="0.8" fill="none" opacity=".6"/>
  <path d="M280 214 Q276 240 270 250" stroke="#d4a020" stroke-width="0.8" fill="none" opacity=".6"/>
  <path d="M48 320 L132 320" stroke="#d4a020" stroke-width="0.8" opacity=".6"/>
  <path d="M188 320 L272 320" stroke="#d4a020" stroke-width="0.8" opacity=".6"/>
  <!-- BAMBOO STRATEGY SCROLL in left hand -->
  <g transform="translate(70,330) rotate(-8)">
    <!-- Unrolled scroll bamboo slats -->
    <rect x="-26" y="-30" width="52" height="78" fill="#a08850" stroke="#5a4018" stroke-width="1"/>
    <line x1="-22" y1="-30" x2="-22" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="-16" y1="-30" x2="-16" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="-10" y1="-30" x2="-10" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="-4" y1="-30" x2="-4" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="2" y1="-30" x2="2" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="8" y1="-30" x2="8" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="14" y1="-30" x2="14" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <line x1="20" y1="-30" x2="20" y2="48" stroke="#5a4018" stroke-width="0.4"/>
    <!-- Chinese characters -->
    <text x="-19" y="-18" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">兵</text>
    <text x="-13" y="-18" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">者</text>
    <text x="-7" y="-18" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">詭</text>
    <text x="-1" y="-18" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">道</text>
    <text x="5" y="-18" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">也</text>
    <text x="-19" y="0" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">不</text>
    <text x="-13" y="0" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">戰</text>
    <text x="-7" y="0" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">而</text>
    <text x="-1" y="0" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">屈</text>
    <text x="5" y="0" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">人</text>
    <text x="-19" y="22" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">知</text>
    <text x="-13" y="22" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">己</text>
    <text x="-7" y="22" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">知</text>
    <text x="-1" y="22" font-family="Special Elite,monospace" font-size="6" fill="#1a0e06">彼</text>
    <!-- Top/bottom roller -->
    <rect x="-30" y="-32" width="60" height="3" fill="#3a2810"/>
    <rect x="-30" y="48" width="60" height="3" fill="#3a2810"/>
  </g>
  <!-- Hands -->
  <ellipse cx="56" cy="332" rx="11" ry="13" fill="url(#st-skin)" transform="rotate(-10 56 332)"/>
  <ellipse cx="262" cy="334" rx="11" ry="13" fill="url(#st-skin)" transform="rotate(10 262 334)"/>
  <!-- BRUSH PEN in right hand -->
  <g transform="translate(262,334) rotate(15)">
    <line x1="0" y1="0" x2="0" y2="-72" stroke="#5a3818" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="0" cy="-78" rx="3" ry="8" fill="#1a0e06"/>
    <ellipse cx="0" cy="-83" rx="2" ry="5" fill="#0a0604"/>
    <!-- Drop of ink -->
    <ellipse cx="0" cy="-90" rx="1.5" ry="2" fill="#0a0604" opacity=".7"/>
  </g>
  <!-- Cloth shoes -->
  <ellipse cx="142" cy="546" rx="22" ry="6" fill="#1a0e06"/>
  <ellipse cx="178" cy="546" rx="22" ry="6" fill="#1a0e06"/>
  <path d="M126 546 Q142 540 158 546" stroke="#3a2810" stroke-width="0.5" fill="none"/>
  <!-- NEON glows — jade -->
  <path d="M84 214 Q66 246 56 340" stroke="#a0c060" stroke-width="0.9" fill="none" opacity=".55"/>
  <path d="M236 214 Q254 246 264 340" stroke="#a0c060" stroke-width="0.9" fill="none" opacity=".55"/>
  <!-- Chinese seal mark on chest -->
  <rect x="186" y="332" width="14" height="14" fill="#a02828" stroke="#600808" stroke-width="0.6"/>
  <text x="193" y="343" text-anchor="middle" font-family="Special Elite,monospace" font-size="9" fill="#dcd6c0">孙</text>
  <!-- Ground glow -->
  <ellipse cx="160" cy="552" rx="92" ry="14" fill="#a0c060" opacity=".4"/>
</svg>`;
F['oliver-cromwell'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('cw','#6d8a9c','#26323c')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#cw-bg)"/>

  <!-- BACK HAIR LOCKS (behind head, to shoulders) -->
  <path d="M134 96 Q116 130 122 192 Q131 201 140 192 Q136 144 142 104 Z" fill="#4a3826"/>
  <path d="M186 96 Q204 130 198 192 Q189 201 180 192 Q184 144 178 104 Z" fill="#42331f"/>

  <!-- NECK -->
  <rect x="150" y="140" width="20" height="28" fill="url(#cw-skin)"/>
  <!-- HEAD -->
  <ellipse cx="160" cy="116" rx="30" ry="34" fill="url(#cw-skin)"/>
  <!-- CROWN HAIR, center-parted -->
  <path d="M130 100 Q134 64 160 56 Q186 64 190 100 Q172 82 160 82 Q148 82 130 100 Z" fill="#52402c"/>
  <path d="M160 58 L160 80" stroke="#3a2c1c" stroke-width="0.8"/>
  <path d="M138 92 Q150 84 158 88" stroke="#3a2c1c" stroke-width="0.5" fill="none" opacity=".6"/>
  <path d="M182 92 Q170 84 162 88" stroke="#3a2c1c" stroke-width="0.5" fill="none" opacity=".6"/>

  <!-- BROWS -->
  <path d="M140 105 Q150 101 157 105" stroke="#3a2c1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M163 105 Q170 101 180 105" stroke="#3a2c1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <!-- EYES -->
  <ellipse cx="149" cy="114" rx="5.2" ry="3.8" fill="#efeadd" opacity=".92"/>
  <ellipse cx="171" cy="114" rx="5.2" ry="3.8" fill="#efeadd" opacity=".92"/>
  <circle cx="150" cy="114" r="2.4" fill="#3a2c18"/>
  <circle cx="170" cy="114" r="2.4" fill="#3a2c18"/>
  <!-- NOSE -->
  <path d="M158 117 Q156 131 153 139 Q160 143 167 139 Q164 131 162 117" fill="#9c6f4c" opacity=".5"/>
  <!-- WARTS (warts and all) -->
  <circle cx="137" cy="99" r="1.8" fill="#a87858"/>
  <circle cx="163" cy="150" r="1.5" fill="#a87858"/>
  <!-- MOUSTACHE + POINTED BEARD -->
  <path d="M148 144 Q160 149 172 144 Q166 151 160 151 Q154 151 148 144 Z" fill="#4a3826"/>
  <path d="M152 152 Q160 168 168 152 Q166 160 160 162 Q154 160 152 152 Z" fill="#42331f"/>
  <path d="M153 147 Q160 149 167 147" stroke="#7a4838" stroke-width="1" fill="none" stroke-linecap="round"/>

  <!-- BREECHES (behind coat) -->
  <path d="M126 396 L156 396 L153 460 L130 460 Z" fill="#39343c"/>
  <path d="M164 396 L194 396 L190 460 L167 460 Z" fill="#332e36"/>

  <!-- STEEL SHARD BOOTS -->
  <!-- left -->
  <path d="M122 450 L160 450 L158 462 L124 462 Z" fill="#9aa6b0"/>
  <path d="M126 460 L158 460 L156 532 L124 532 Z" fill="#828f9a"/>
  <polygon points="130,464 150,460 142,508 132,506" fill="#aab6c0" opacity=".55"/>
  <polygon points="142,508 156,510 154,530 146,528" fill="#6b7882"/>
  <polygon points="128,508 142,510 138,530 126,528" fill="#5e6a74"/>
  <path d="M124 530 L158 530 Q167 531 169 540 L160 552 L116 552 L114 540 Q117 531 124 530 Z" fill="#5e6b76"/>
  <polygon points="120,538 152,538 150,547 122,547" fill="#828f9a" opacity=".55"/>
  <!-- right -->
  <path d="M160 450 L198 450 L196 462 L162 462 Z" fill="#909ca6"/>
  <path d="M162 460 L196 460 L194 532 L164 532 Z" fill="#788490"/>
  <polygon points="170,460 190,464 188,506 178,508" fill="#9eaab4" opacity=".55"/>
  <polygon points="164,508 178,510 176,530 166,528" fill="#586570"/>
  <polygon points="178,508 194,506 192,528 182,530" fill="#6b7882"/>
  <path d="M162 530 L196 530 Q203 531 206 540 L204 552 L160 552 L160 540 Q161 531 162 530 Z" fill="#54616c"/>
  <polygon points="168,538 200,538 198,547 170,547" fill="#788490" opacity=".55"/>

  <!-- BUFF COAT (over breeches) -->
  <path d="M110 196 Q140 178 160 176 Q180 178 210 196 L214 408 Q160 420 106 408 Z" fill="#b9a26a"/>
  <path d="M160 178 L160 408" stroke="#9c8650" stroke-width="0.8" opacity=".4"/>
  <path d="M120 360 Q160 372 200 360 L202 408 Q160 420 118 408 Z" fill="#ad9760"/>

  <!-- PAULDRONS -->
  <path d="M106 202 Q94 214 98 242 Q118 234 126 212 Z" fill="#7e8c98"/>
  <path d="M214 202 Q226 214 222 242 Q202 234 194 212 Z" fill="#74828e"/>

  <!-- STEEL BREASTPLATE -->
  <path d="M122 200 Q160 186 198 200 L204 322 Q160 346 116 322 Z" fill="#8a98a4"/>
  <path d="M122 200 Q160 186 198 200 L201 254 Q160 272 119 254 Z" fill="#aab6c0" opacity=".7"/>
  <path d="M160 190 L160 334" stroke="#5e6e7a" stroke-width="1.2" opacity=".6"/>
  <circle cx="128" cy="210" r="2" fill="#6e7c88"/>
  <circle cx="192" cy="210" r="2" fill="#6e7c88"/>
  <circle cx="124" cy="314" r="2" fill="#6e7c88"/>
  <circle cx="196" cy="314" r="2" fill="#6e7c88"/>
  <path d="M134 210 Q142 254 138 314" stroke="#cdd6dd" stroke-width="2" fill="none" opacity=".5" filter="url(#cw-glow)"/>

  <!-- FALLING-BAND COLLAR (two squared linen panels) -->
  <path d="M158 160 L140 164 L130 198 L158 202 Z" fill="#ece8dc" stroke="#cfc8b6" stroke-width="0.8"/>
  <path d="M162 160 L180 164 L190 198 L162 202 Z" fill="#e6e1d4" stroke="#cfc8b6" stroke-width="0.8"/>
  <path d="M150 170 Q160 174 170 170" stroke="#d2ccbc" stroke-width="0.6" fill="none"/>

  <!-- SASH with ENGLISH FLAG (St George's Cross) -->
  <path d="M118 206 L206 312 L194 330 L106 224 Z" fill="#b8632a" opacity=".95"/>
  <path d="M118 206 L206 312" stroke="#dd8444" stroke-width="1" opacity=".5"/>
  <g transform="rotate(-38 158 264)">
    <rect x="128" y="242" width="60" height="44" fill="#f2efe6" stroke="#b9332a" stroke-width="1"/>
    <rect x="154" y="242" width="8" height="44" fill="#c8102e"/>
    <rect x="128" y="260" width="60" height="8" fill="#c8102e"/>
  </g>
  <path d="M194 322 Q212 326 218 342 Q204 346 194 336 Z" fill="#a85820"/>

  <!-- SWORD at side -->
  <line x1="100" y1="306" x2="88" y2="474" stroke="#4a4e54" stroke-width="5" stroke-linecap="round"/>
  <line x1="100" y1="306" x2="88" y2="474" stroke="#9aa4ac" stroke-width="1.4" opacity=".5"/>
  <line x1="86" y1="306" x2="118" y2="302" stroke="#3a3e44" stroke-width="4" stroke-linecap="round"/>
  <circle cx="102" cy="294" r="5" fill="#5e6870" stroke="#3a3e44" stroke-width="1.5"/>
  <!-- HAND on hilt -->
  <ellipse cx="106" cy="306" rx="11" ry="13" fill="url(#cw-skin)" transform="rotate(8 106 306)"/>

  <!-- accent glow + ground -->
  <line x1="88" y1="474" x2="100" y2="306" stroke="#6d8a9c" stroke-width="1" opacity=".5" filter="url(#cw-glow)"/>
  <ellipse cx="160" cy="552" rx="104" ry="14" fill="#4a6470" opacity=".4"/>
</svg>`;

F['marcus-aurelius'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('ma','#7a4fb0','#2a1f3a')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#ma-bg)"/>

  <!-- HAIR + BEARD DARK MASS -->
  <path d="M125 112 Q118 76 160 62 Q202 76 195 112 Q198 140 188 150 Q190 168 178 184 Q170 196 160 198 Q150 196 142 184 Q130 168 132 150 Q122 140 125 112 Z" fill="#2e2216"/>
  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#ma-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#ma-skin)"/>
  <!-- CURLY CROWN HAIR -->
  <path d="M130 108 Q127 70 160 60 Q193 70 190 108 Q183 92 176 96 Q180 82 169 83 Q172 75 160 77 Q148 75 151 83 Q140 82 144 96 Q137 92 130 108 Z" fill="#3a2c1c"/>
  <circle cx="137" cy="100" r="5.2" fill="#332617"/><circle cx="148" cy="89" r="5.2" fill="#42321f"/>
  <circle cx="160" cy="84" r="5.4" fill="#3a2c1c"/><circle cx="172" cy="89" r="5.2" fill="#42321f"/>
  <circle cx="183" cy="100" r="5.2" fill="#332617"/><circle cx="131" cy="112" r="4.6" fill="#2e2216"/>
  <circle cx="189" cy="112" r="4.6" fill="#2e2216"/><circle cx="129" cy="126" r="4.4" fill="#2e2216"/>
  <circle cx="191" cy="126" r="4.4" fill="#281d13"/>
  <!-- GOLD LAUREL WREATH -->
  <ellipse cx="134" cy="106" rx="4.6" ry="1.9" fill="#c9a227" transform="rotate(-52 134 106)"/>
  <ellipse cx="141" cy="96" rx="4.6" ry="1.9" fill="#b8941f" transform="rotate(-42 141 96)"/>
  <ellipse cx="149" cy="88" rx="4.6" ry="1.9" fill="#c9a227" transform="rotate(-30 149 88)"/>
  <ellipse cx="156" cy="81" rx="4.4" ry="1.8" fill="#d8b43a" transform="rotate(-18 156 81)"/>
  <ellipse cx="186" cy="106" rx="4.6" ry="1.9" fill="#c9a227" transform="rotate(52 186 106)"/>
  <ellipse cx="179" cy="96" rx="4.6" ry="1.9" fill="#b8941f" transform="rotate(42 179 96)"/>
  <ellipse cx="171" cy="88" rx="4.6" ry="1.9" fill="#c9a227" transform="rotate(30 171 88)"/>
  <ellipse cx="164" cy="81" rx="4.4" ry="1.8" fill="#d8b43a" transform="rotate(18 164 81)"/>
  <circle cx="160" cy="75" r="3.2" fill="#e0c050" stroke="#9a7a18" stroke-width="0.8"/>
  <!-- BROWS / EYES / NOSE -->
  <path d="M139 108 Q149 104 156 108" stroke="#2e2216" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M164 108 Q171 104 181 108" stroke="#2e2216" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/>
  <ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/>
  <circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/>
  <path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>
  <!-- FULL CURLY BEARD -->
  <path d="M132 132 Q128 168 150 190 Q160 200 170 190 Q192 168 188 132 Q178 160 160 162 Q142 160 132 132 Z" fill="#3a2c1c"/>
  <circle cx="140" cy="150" r="5.4" fill="#332617"/><circle cx="151" cy="162" r="5.6" fill="#42321f"/>
  <circle cx="160" cy="170" r="6" fill="#3a2c1c"/><circle cx="169" cy="162" r="5.6" fill="#42321f"/>
  <circle cx="180" cy="150" r="5.4" fill="#332617"/><circle cx="146" cy="178" r="4.8" fill="#2e2216"/>
  <circle cx="160" cy="184" r="5" fill="#332617"/><circle cx="174" cy="178" r="4.8" fill="#2e2216"/>
  <path d="M147 144 Q160 150 173 144 Q166 153 160 153 Q154 153 147 144 Z" fill="#2e2216"/>

  <!-- ============ BODY ============ -->
  <!-- LEGS (bare, below knee-length tunic) -->
  <path d="M139 396 L157 396 L155 512 L141 512 Z" fill="url(#ma-skin)"/>
  <path d="M163 396 L181 396 L179 512 L165 512 Z" fill="url(#ma-skin)"/>
  <path d="M141 404 L146 404 L145 508 L142 508 Z" fill="#9c6f4c" opacity=".3"/>
  <path d="M166 404 L171 404 L170 508 L167 508 Z" fill="#9c6f4c" opacity=".3"/>
  <ellipse cx="148" cy="430" rx="9" ry="11" fill="#d8a880" opacity=".35"/>
  <ellipse cx="172" cy="430" rx="9" ry="11" fill="#d8a880" opacity=".35"/>
  <!-- SANDALS -->
  <path d="M133 510 L158 510 L158 526 Q158 532 150 532 L130 532 Q124 532 125 524 Z" fill="url(#ma-skin)"/>
  <path d="M162 510 L187 510 L188 524 Q189 532 181 532 L162 532 Q154 532 156 526 Z" fill="url(#ma-skin)"/>
  <rect x="123" y="530" width="38" height="6" rx="3" fill="#5a3c20"/>
  <rect x="159" y="530" width="38" height="6" rx="3" fill="#523620"/>
  <path d="M137 512 L152 520 M139 520 L150 526" stroke="#6e4a2a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M167 512 L182 520 M169 520 L180 526" stroke="#5e3e22" stroke-width="2.4" stroke-linecap="round"/>

  <!-- TUNIC (knee-length, muted Roman red) -->
  <path d="M126 198 Q160 182 194 198 L202 396 Q160 410 118 396 Z" fill="#8a2f2f"/>
  <path d="M126 198 Q160 182 194 198 L198 252 Q160 266 122 252 Z" fill="#9c3a3a" opacity=".6"/>
  <path d="M118 388 Q160 402 202 388 L202 396 Q160 410 118 396 Z" fill="#c9a227" opacity=".85"/>
  <path d="M150 210 L150 392" stroke="#c9a227" stroke-width="3" opacity=".5"/>

  <!-- WHITE TOGA DRAPE (over figure's right / viewer left, swagged) -->
  <path d="M110 200 Q140 184 160 182 Q172 188 176 208 Q150 232 150 300 Q148 360 158 398 Q138 404 108 392 Z" fill="#ece6d6"/>
  <path d="M128 232 Q140 300 132 388" stroke="#d8d0bc" stroke-width="3" fill="none" opacity=".55"/>
  <path d="M150 242 Q156 320 152 392" stroke="#cfc6b0" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M118 252 Q126 332 120 388" stroke="#fbf7ec" stroke-width="1.6" fill="none" opacity=".4"/>

  <!-- PURPLE PALUDAMENTUM (cloak, figure's left shoulder, hanging behind) -->
  <path d="M168 190 Q200 198 214 234 L210 414 Q192 424 174 416 Q186 322 176 212 Z" fill="#7a4fb0"/>
  <path d="M176 212 Q186 322 174 416" stroke="#5e3a90" stroke-width="1.4" fill="none" opacity=".6"/>
  <path d="M198 226 Q207 322 202 404" stroke="#9166c8" stroke-width="2.6" fill="none" opacity=".5"/>
  <path d="M168 190 Q198 186 214 208 Q200 198 168 202 Z" fill="#8a5cc4"/>

  <!-- GOLD FIBULA -->
  <circle cx="180" cy="202" r="8.5" fill="#c9a227" stroke="#9a7a18" stroke-width="1.6"/>
  <circle cx="180" cy="202" r="3.6" fill="#e0c050"/>
  <circle cx="180" cy="202" r="8.5" fill="none" stroke="#e0c050" stroke-width="0.9" opacity=".6" filter="url(#ma-glow)"/>

  <!-- RIGHT ARM (toga-draped upper arm) + bare FOREARM holding the scroll -->
  <path d="M150 214 Q126 250 116 304 Q126 312 140 306 Q150 262 162 226 Z" fill="#e4ddcc"/>
  <path d="M150 216 Q132 250 124 300" stroke="#cfc6b0" stroke-width="1.4" fill="none" opacity=".5"/>
  <path d="M122 300 Q116 322 118 344 L134 348 Q136 322 140 304 Z" fill="url(#ma-skin)"/>
  <ellipse cx="124" cy="346" rx="11" ry="12" fill="url(#ma-skin)"/>
  <!-- SCROLL (the Meditations) -->
  <g transform="rotate(-14 118 372)">
    <rect x="106" y="338" width="22" height="74" rx="5" fill="#e6dcc2" stroke="#c8bb9a" stroke-width="1"/>
    <ellipse cx="117" cy="338" rx="11" ry="3.8" fill="#d8cca8"/>
    <ellipse cx="117" cy="412" rx="11" ry="3.8" fill="#cabd99"/>
    <path d="M111 356 H123 M111 368 H123 M111 380 H123 M111 392 H123" stroke="#9a8a66" stroke-width="0.7" opacity=".55"/>
  </g>
  <ellipse cx="123" cy="348" rx="8" ry="9" fill="url(#ma-skin)"/>

  <!-- accent glow + ground shadow -->
  <line x1="180" y1="210" x2="202" y2="404" stroke="#7a4fb0" stroke-width="1" opacity=".45" filter="url(#ma-glow)"/>
  <ellipse cx="160" cy="552" rx="104" ry="14" fill="#3a2a52" opacity=".4"/>
</svg>
`;

F['tacitus'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">${defs('tc','#9a3b3b','#3a2230')}
  
<!-- THE STAGE — oxblood on plum, the colour of a Senate he despised -->
<ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#tc-bg)"/>
<path d="M131 110 Q128 76 160 66 Q192 76 189 110 Q186 96 178 98 Q180 88 170 90 Q172 84 160 86 Q148 84 150 90 Q140 88 142 98 Q134 96 131 110 Z" 
<!-- BACK HAIR — Roman, short, combed forward -->
fill="#3a2c1c"/>

<!-- NECK -->
<rect x="150" y="142" width="20" height="26" fill="url(#tc-skin)"/>
<!-- HEAD -->
<ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#tc-skin)"/>
<path d="M131 110 Q128 76 160 66 Q192 76 189 110 Q184 100 176 102 Q178 92 168 94 Q170 86 160 88 Q150 86 152 94 Q142 92 144 102 Q136 100 131 110 Z" 
<!-- HAIR — the forward fringe every senator wore -->
fill="#42321f"/>

<!-- the fringe, cut straight across -->
<path d="M136 104 Q142 99 148 104 Q154 99 160 104 Q166 99 172 104 Q178 99 184 104" stroke="#2e2216" stroke-width="2.6" fill="none" stroke-linecap="round"/>

<!-- BROWS — level. He is not surprised by anything -->
<path d="M139 108 Q149 104 156 108" stroke="#2e2216" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M164 108 Q171 104 181 108" stroke="#2e2216" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<!-- EYES — watching, and writing it down -->
<ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/>
<!-- NOSE -->
<path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>

<!-- MOUTH — closed, and it stays closed -->
<path d="M150 150 Q160 153 170 150" stroke="#7a5038" stroke-width="2" fill="none" stroke-linecap="round"/>

<!-- LEGS, bare below the tunic -->
<path d="M139 396 L157 396 L155 512 L141 512 Z" fill="url(#tc-skin)"/><path d="M163 396 L181 396 L179 512 L165 512 Z" fill="url(#tc-skin)"/>
<path d="M141 404 L146 404 L145 508 L142 508 Z" fill="#9c6f4c" opacity=".3"/><path d="M166 404 L171 404 L170 508 L167 508 Z" fill="#9c6f4c" opacity=".3"/>

<!-- FEET -->
<path d="M133 510 L158 510 L158 526 Q158 532 150 532 L130 532 Q124 532 125 524 Z" fill="url(#tc-skin)"/><path d="M162 510 L187 510 L188 524 Q189 532 181 532 L162 532 Q154 532 156 526 Z" fill="url(#tc-skin)"/>
<!-- SANDALS -->
<rect x="123" y="530" width="38" height="6" rx="3" fill="#5a3c20"/><rect x="159" y="530" width="38" height="6" rx="3" fill="#523620"/><path d="M137 512 L152 520 M139 520 L150 526" stroke="#6e4a2a" stroke-width="2.4" stroke-linecap="round"/><path d="M167 512 L182 520 M169 520 L180 526" stroke="#5e3e22" stroke-width="2.4" stroke-linecap="round"/>

<!-- TUNIC — undyed wool -->
<path d="M126 198 Q160 182 194 198 L202 398 Q160 412 118 398 Z" fill="#e4ddca"/>

<!-- THE LATUS CLAVUS — the broad purple stripe. A senator, and the rank is the point -->
<path d="M150 198 L150 398" stroke="#6e2d63" stroke-width="11" opacity=".9"/>

<!-- TOGA, drawn over the left shoulder -->
<path d="M108 200 Q140 184 162 182 Q176 190 180 212 Q150 240 150 320 Q150 382 164 404 Q136 410 106 396 Z" fill="#ece6d6"/>
<path d="M108 200 Q140 184 162 182 Q176 190 180 212" stroke="#6e2d63" stroke-width="5" fill="none" opacity=".85"/>
<path d="M180 212 Q150 240 150 320 Q150 382 164 404" stroke="#6e2d63" stroke-width="5" fill="none" opacity=".7"/>

<!-- toga folds -->
<path d="M128 230 Q140 300 132 390" stroke="#d8d0bc" stroke-width="3" fill="none" opacity=".55"/>
<path d="M118 250 Q126 330 120 390" stroke="#fbf7ec" stroke-width="1.6" fill="none" opacity=".4"/>

<!-- the over-shoulder swag -->
<path d="M150 214 Q126 250 116 304 Q126 312 140 306 Q150 262 162 226 Z" fill="#e4ddcc"/>

<!-- RIGHT ARM, bare from the toga -->
<path d="M122 300 Q116 322 118 344 L134 348 Q136 322 140 304 Z" fill="url(#tc-skin)"/>

<!-- THE SCROLL — the Annals. He waited until the men in them were safely dead -->
<g transform="rotate(-14 118 372)"><rect x="106" y="338" width="22" height="74" rx="5" fill="#e6dcc2" stroke="#c8bb9a" stroke-width="1"/><ellipse cx="117" cy="338" rx="11" ry="3.8" fill="#d8cca8"/><ellipse cx="117" cy="412" rx="11" ry="3.8" fill="#cabd99"/><path d="M111 356 H123 M111 368 H123 M111 380 H123 M111 392 H123" stroke="#9a8a66" stroke-width="0.7" opacity=".55"/></g>

<!-- HAND on the scroll -->
<ellipse cx="123" cy="348" rx="8" ry="9" fill="url(#tc-skin)"/>
<line x1="176" y1="206" x2="196" y2="398" stroke="#9a3b3b" stroke-width="1" opacity=".45" filter="url(#tc-glow)"/>
<!-- Ground glow -->
<ellipse cx="160" cy="552" rx="104" ry="14" fill="#3a2230" opacity=".4"/></svg>
`;

F['david-hume'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">${defs('hu','#c98a3a','#3a2e1a')}
  
<!-- THE STAGE — amber on olive, an Edinburgh drawing room -->
<ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#hu-bg)"/>
<path d="M122 110 Q118 70 160 60 Q202 70 198 110 Q204 142 190 154 Q196 170 184 180 L182 150 Q186 120 178 104 Q172 92 160 90 Q148 92 142 104 Q134 120 138 150 L136 180 Q124 170 130 154 Q116 142 122 110 Z" 
<!-- THE WIG — powdered, tied at the back. Undress wig, not full-bottomed: he was a philosopher, not a judge -->
fill="#e8e6df"/>

<!-- NECK -->
<rect x="150" y="142" width="20" height="26" fill="url(#hu-skin)"/>
<!-- HEAD — broad and heavy, as everyone who met him remarked -->
<ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#hu-skin)"/>

<!-- WIG ROLL CURLS, left — two tiers above the ear -->
<ellipse cx="129" cy="126" rx="9" ry="8" fill="#dad7cc"/><ellipse cx="127" cy="142" rx="8" ry="7" fill="#e8e6df"/>

<!-- WIG ROLL CURLS, right -->
<ellipse cx="191" cy="126" rx="9" ry="8" fill="#dad7cc"/><ellipse cx="193" cy="142" rx="8" ry="7" fill="#e8e6df"/>

<!-- wig crown, swept back off the forehead -->
<path d="M130 98 Q126 74 160 66 Q194 74 190 98 Q176 86 160 86 Q144 86 130 98 Z" fill="#f0eee7"/>

<!-- crown curls -->
<circle cx="140" cy="88" r="5" fill="#dad7cc"/><circle cx="160" cy="82" r="5" fill="#e8e6df"/><circle cx="180" cy="88" r="5" fill="#dad7cc"/>

<!-- BROWS — mild. He argued the most alarming things pleasantly -->
<path d="M139 108 Q149 104 156 108" stroke="#6a6258" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M164 108 Q171 104 181 108" stroke="#6a6258" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<!-- EYES -->
<ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/>
<!-- NOSE -->
<path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>

<!-- RUDDY CHEEKS — he was stout and high-coloured and cheerful about both -->
<ellipse cx="134" cy="128" rx="6" ry="8" fill="#d8a880" opacity=".4"/><ellipse cx="186" cy="128" rx="6" ry="8" fill="#d8a880" opacity=".4"/>

<!-- MOUTH — the good humour that survived being called an atheist for forty years -->
<path d="M150 150 Q160 154 170 150 Q166 156 160 156 Q154 156 150 150 Z" fill="#b0735a" opacity=".7"/>

<!-- LEGS in white silk stockings -->
<path d="M139 396 L157 396 L155 512 L141 512 Z" fill="#e8e2d4"/><path d="M163 396 L181 396 L179 512 L165 512 Z" fill="#ded7c8"/>

<!-- BREECHES, buckled at the knee -->
<path d="M139 396 L157 396 L156 452 L140 452 Z" fill="#b07a32"/><path d="M163 396 L181 396 L180 452 L164 452 Z" fill="#a06e2c"/>

<!-- SHOES — black leather -->
<path d="M126 514 L158 514 Q166 514 166 524 L166 532 Q166 538 158 538 L124 538 Q118 538 118 530 Z" fill="#1a1712"/><path d="M162 514 L194 514 Q200 514 200 524 L200 532 Q200 538 192 538 L162 538 Q156 538 156 530 Z" fill="#141109"/>
<!-- SHOE BUCKLES, brass -->
<rect x="136" y="520" width="9" height="6" rx="1" fill="#c9a227"/><rect x="175" y="520" width="9" height="6" rx="1" fill="#c9a227"/>

<!-- COAT — tobacco brown, full-skirted -->
<path d="M120 200 Q160 184 200 200 L210 412 Q160 426 110 412 Z" fill="#c98a3a"/>

<!-- WAISTCOAT, lighter, worn long -->
<path d="M142 208 Q160 202 178 208 L182 366 Q160 378 138 366 Z" fill="#dab474"/>

<!-- THE STOCK — plain white linen at the throat -->
<path d="M150 170 Q160 182 170 170 L172 200 Q160 210 148 200 Z" fill="#f0ece0"/>
<path d="M120 200 Q136 196 150 206 L138 280 Q126 240 120 200 Z" fill="#d89a4a" opacity=".7"/>
<path d="M200 200 Q184 196 170 206 L182 280 Q194 240 200 200 Z" fill="#b87a2c" opacity=".7"/>

<!-- brass buttons down the waistcoat -->
<circle cx="158" cy="240" r="2.4" fill="#9a7a18"/><circle cx="158" cy="266" r="2.4" fill="#9a7a18"/><circle cx="158" cy="292" r="2.4" fill="#9a7a18"/><circle cx="158" cy="318" r="2.4" fill="#9a7a18"/>

<!-- RIGHT ARM -->
<path d="M196 250 Q210 300 204 360 L186 356 Q190 300 184 256 Z" fill="#b87a2c"/>

<!-- right hand -->
<ellipse cx="198" cy="360" rx="10" ry="12" fill="url(#hu-skin)"/>

<!-- THE BOOK — bound, closed, held at the side. The Treatise fell dead-born from the press and he wrote it anyway -->
<g transform="rotate(8 196 372)"><rect x="184" y="346" width="26" height="58" rx="2" fill="#6a3b3b"/><rect x="184" y="346" width="6" height="58" fill="#522c2c"/><rect x="208" y="350" width="3" height="50" fill="#e6dcc2"/></g>

<!-- LEFT ARM -->
<path d="M118 250 Q108 300 116 360 L132 356 Q126 300 130 256 Z" fill="#d89a4a"/>
<ellipse cx="120" cy="360" rx="10" ry="12" fill="url(#hu-skin)"/>
<line x1="196" y1="210" x2="204" y2="360" stroke="#c98a3a" stroke-width="1" opacity=".45" filter="url(#hu-glow)"/>
<!-- Ground glow -->
<ellipse cx="160" cy="552" rx="104" ry="14" fill="#3a2e1a" opacity=".4"/></svg>
`;

F['charles-martel'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">${defs('cm','#6b7280','#232830')}
  
<!-- THE STAGE — steel on slate -->
<ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#cm-bg)"/>

<!-- THE HAFT — a war hammer, and it is where the name came from. Martel is the Hammer -->
<line x1="100" y1="248" x2="92" y2="502" stroke="#5a3c20" stroke-width="6" stroke-linecap="round"/>

<!-- THE HAMMER HEAD -->
<rect x="82" y="232" width="38" height="24" rx="3" fill="#6e767e" stroke="#8a929c" stroke-width="1.5"/>

<!-- the striking face -->
<rect x="82" y="232" width="14" height="24" rx="2" fill="#5a626a"/>

<!-- LEGS in mail chausses -->
<path d="M139 396 L157 396 L155 512 L141 512 Z" fill="#5a5246"/><path d="M163 396 L181 396 L179 512 L165 512 Z" fill="#524a3e"/>

<!-- the rings, drawn as courses -->
<path d="M140 400 L156 408 M140 414 L156 422 M141 428 L155 436 M141 442 L155 450 M141 456 L155 464" stroke="#3e362a" stroke-width="2"/>
<path d="M164 400 L180 408 M164 414 L180 422 M165 428 L179 436 M165 442 L179 450 M165 456 L179 464" stroke="#352e24" stroke-width="2"/>

<!-- BOOTS -->
<path d="M132 466 L158 466 L158 528 Q158 536 148 536 L128 536 Q122 536 124 526 Z" fill="#4a3624"/><path d="M162 466 L188 466 L190 528 Q190 536 180 536 L162 536 Q156 536 156 528 Z" fill="#3e2d1d"/><path d="M134 474 L156 474 M134 486 L156 486" stroke="#5e4630" stroke-width="1.4" opacity=".6"/>
<path d="M168 192 Q206 200 214 240 L208 432 Q190 442 172 434 Q186 322 176 212 Z" fill="#7a3b2a"/>
<path d="M124 196 Q160 182 196 196 L200 384 Q160 398 120 384 Z" fill="#7e8690"/>
<circle cx="128" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="140" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="152" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="164" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="176" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="188" cy="210" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="134" cy="228" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="146" cy="228" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="158" cy="228" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="170" cy="228" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="182" cy="228" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="128" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="140" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="152" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="164" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="176" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="188" cy="246" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="134" cy="264" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="146" cy="264" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="158" cy="264" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="170" cy="264" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="182" cy="264" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="128" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="140" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="152" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="164" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="176" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="188" cy="282" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="134" cy="300" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="146" cy="300" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="158" cy="300" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="170" cy="300" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="182" cy="300" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="128" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="140" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="152" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="164" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="176" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="188" cy="318" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="134" cy="336" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="146" cy="336" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="158" cy="336" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="170" cy="336" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="182" cy="336" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="128" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="140" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="152" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="164" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="176" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="188" cy="354" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="134" cy="372" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="146" cy="372" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="158" cy="372" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="170" cy="372" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/><circle cx="182" cy="372" r="3.1" fill="none" stroke="#5e666e" stroke-width="1"/>
<path d="M106 200 Q96 214 100 244 Q120 236 128 212 Z" fill="#6e767e"/>
<path d="M214 200 Q224 214 220 244 Q200 236 192 212 Z" fill="#646c74"/>
<rect x="120" y="356" width="80" height="11" rx="2" fill="#4a3624"/><rect x="150" y="353" width="18" height="17" rx="2" fill="#c9a227" stroke="#9a7a18" stroke-width="1.2"/>
<rect x="150" y="142" width="20" height="26" fill="url(#cm-skin)"/><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#cm-skin)"/>
<path d="M136 138 Q134 166 152 182 Q160 190 168 182 Q186 166 184 138 Q174 158 160 160 Q146 158 136 138 Z" fill="#5a4632"/>
<circle cx="144" cy="152" r="4.6" fill="#4a3826"/><circle cx="156" cy="162" r="5" fill="#52402c"/><circle cx="168" cy="152" r="4.6" fill="#4a3826"/><circle cx="160" cy="172" r="4.4" fill="#42331f"/>

<!-- THE HELM — a plain conical Frankish helm. No crown: he was Mayor of the Palace and never took the title -->
<path d="M132 112 Q132 58 160 48 Q188 58 188 112 Z" fill="#9aa2ac"/>
<path d="M132 112 Q132 58 160 48 Q174 54 180 78 Q168 64 150 70 Q140 84 138 112 Z" fill="#b4bcc4" opacity=".6"/>

<!-- brow band -->
<path d="M130 112 L190 112" stroke="#5e666e" stroke-width="4"/>

<!-- THE NASAL — the bar down the nose that makes the face unmistakable -->
<rect x="156" y="106" width="8" height="36" rx="2" fill="#9aa2ac" stroke="#5e666e" stroke-width="1"/>

<!-- finial -->
<circle cx="160" cy="50" r="3.4" fill="#b4bcc4"/>

<!-- BROWS -->
<path d="M139 108 Q149 104 156 108" stroke="#3a2c1c" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M164 108 Q171 104 181 108" stroke="#3a2c1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<!-- EYES -->
<ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/><path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>

<!-- THE HAND ON THE HAFT — he is holding it, not displaying it -->
<ellipse cx="100" cy="296" rx="11" ry="13" fill="url(#cm-skin)" transform="rotate(6 100 296)"/>
<line x1="100" y1="248" x2="92" y2="502" stroke="#9aa4ac" stroke-width="1.4" opacity=".4"/>
<line x1="180" y1="212" x2="200" y2="420" stroke="#6b7280" stroke-width="1" opacity=".45" filter="url(#cm-glow)"/>
<!-- Ground glow -->
<ellipse cx="160" cy="552" rx="104" ry="14" fill="#232830" opacity=".4"/></svg>
`;

F['edward-gibbon'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">${defs('gb','#9a4452','#38222a')}
  
<!-- THE STAGE — claret on port, a gentleman’s library -->
<ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#gb-bg)"/>
<path d="M120 110 Q116 70 160 60 Q204 70 200 110 Q206 142 192 154 Q198 170 186 180 L184 150 Q188 120 180 104 Q173 92 160 90 Q147 92 140 104 Q132 120 136 150 L134 180 Q122 170 128 154 Q114 142 120 110 Z" 
<!-- THE WIG — powdered, tied. The uniform of the eighteenth-century man of letters -->
fill="#dcdad2"/>

<!-- NECK -->
<rect x="150" y="142" width="20" height="26" fill="url(#gb-skin)"/>
<!-- HEAD — round. He was small, stout, and knew it -->
<ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#gb-skin)"/>

<!-- WIG ROLL CURLS, left -->
<ellipse cx="127" cy="128" rx="9" ry="8" fill="#cccabf"/><ellipse cx="125" cy="144" rx="8" ry="7" fill="#dcdad2"/>

<!-- WIG ROLL CURLS, right -->
<ellipse cx="193" cy="128" rx="9" ry="8" fill="#cccabf"/><ellipse cx="195" cy="144" rx="8" ry="7" fill="#dcdad2"/>

<!-- wig crown -->
<path d="M130 98 Q126 74 160 66 Q194 74 190 98 Q176 86 160 86 Q144 86 130 98 Z" fill="#e6e4dc"/>

<!-- crown curls -->
<circle cx="140" cy="88" r="5" fill="#cccabf"/><circle cx="160" cy="82" r="5" fill="#dcdad2"/><circle cx="180" cy="88" r="5" fill="#cccabf"/>

<!-- BROWS -->
<path d="M139 108 Q149 104 156 108" stroke="#7a7268" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M164 108 Q171 104 181 108" stroke="#7a7268" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<!-- EYES — down at the page, not up at you -->
<ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/><path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>
<ellipse cx="133" cy="129" rx="7" ry="9" fill="#d8a880" opacity=".4"/><ellipse cx="187" cy="129" rx="7" ry="9" fill="#d8a880" opacity=".4"/>
<path d="M138 150 Q160 160 182 150 Q176 158 160 158 Q144 158 138 150 Z" fill="#c99078" opacity=".45"/>
<path d="M151 150 Q160 153 169 150" stroke="#b0735a" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M139 396 L157 396 L155 512 L141 512 Z" fill="#e4ded0"/><path d="M163 396 L181 396 L179 512 L165 512 Z" fill="#dad3c4"/>
<path d="M137 396 L159 396 L158 452 L138 452 Z" fill="#7a3440"/><path d="M161 396 L183 396 L182 452 L162 452 Z" fill="#6e2f3a"/>
<path d="M126 514 L158 514 Q166 514 166 524 L166 532 Q166 538 158 538 L124 538 Q118 538 118 530 Z" fill="#1a1712"/><path d="M162 514 L194 514 Q200 514 200 524 L200 532 Q200 538 192 538 L162 538 Q156 538 156 530 Z" fill="#141109"/><rect x="136" y="520" width="9" height="6" rx="1" fill="#c9a227"/><rect x="175" y="520" width="9" height="6" rx="1" fill="#c9a227"/>
<path d="M112 202 Q160 184 208 202 L218 414 Q160 430 102 414 Z" fill="#9a4452"/>
<path d="M140 210 Q160 204 180 210 L184 368 Q160 382 136 368 Z" fill="#cdbf9a"/>
<path d="M150 172 Q160 184 170 172 L172 202 Q160 212 148 202 Z" fill="#f0ece0"/>
<path d="M112 202 Q130 198 146 208 L132 290 Q120 244 112 202 Z" fill="#aa5462" opacity=".7"/>
<path d="M208 202 Q190 198 174 208 L188 290 Q200 244 208 202 Z" fill="#8a3a48" opacity=".7"/>
<circle cx="158" cy="244" r="2.4" fill="#9a7a18"/><circle cx="158" cy="272" r="2.4" fill="#9a7a18"/><circle cx="158" cy="300" r="2.4" fill="#9a7a18"/><circle cx="158" cy="328" r="2.4" fill="#9a7a18"/>

<!-- LEFT ARM -->
<path d="M116 256 Q104 312 116 372 L132 366 Q124 312 130 262 Z" fill="#aa5462"/>

<!-- RIGHT ARM -->
<path d="M204 256 Q216 312 204 372 L188 366 Q196 312 190 262 Z" fill="#8a3a48"/>

<!-- THE BOOK, OPEN — the Decline and Fall. Six volumes over twelve years, and the last page written in a summer-house at midnight -->
<path d="M114 330 L160 320 L160 388 L114 398 Z" fill="#ece4d0"/><path d="M160 320 L206 330 L206 398 L160 388 Z" fill="#ded5be"/>

<!-- binding, left board -->
<path d="M108 326 L114 330 L114 398 L108 402 Z" fill="#5a2a30"/><path d="M212 326 L206 330 L206 398 L212 402 Z" fill="#4e2228"/>

<!-- the spine, the book held open across both hands -->
<line x1="160" y1="320" x2="160" y2="388" stroke="#b0a888" stroke-width="1.2"/>

<!-- ruled text — the left page -->
<path d="M122 340 H152 M122 350 H152 M122 360 H152 M122 370 H150" stroke="#a89a78" stroke-width="0.8" opacity=".6"/>

<!-- and the right -->
<path d="M168 340 H198 M168 350 H198 M168 360 H198 M170 370 H198" stroke="#a89a78" stroke-width="0.8" opacity=".6"/>

<!-- hands, one under each board -->
<ellipse cx="116" cy="372" rx="9" ry="11" fill="url(#gb-skin)"/><ellipse cx="204" cy="372" rx="9" ry="11" fill="url(#gb-skin)"/>
<line x1="206" y1="210" x2="210" y2="360" stroke="#9a4452" stroke-width="1" opacity=".45" filter="url(#gb-glow)"/>
<!-- Ground glow -->
<ellipse cx="160" cy="552" rx="104" ry="14" fill="#38222a" opacity=".4"/></svg>
`;

F['bram-stoker'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">${defs('bs','#8a1020','#2a1015')}
  
<!-- THE STAGE — blood on near-black -->
<ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#bs-bg)"/>

<!-- THE BAT — small, upper left, and it is the only fantastical thing here. He was a theatre manager who wrote at night -->
<g transform="translate(74,126)" fill="#140609" opacity=".92"><path d="M0 0 Q-16 -12 -26 -7 Q-19 -3 -21 7 Q-12 0 -7 5 Q-2 10 0 5 Q2 10 7 5 Q12 0 21 7 Q19 -3 26 -7 Q16 -12 0 0 Z"/><ellipse cx="0" cy="3" rx="3.4" ry="4" fill="#140609"/></g>

<!-- the glow behind it -->
<circle cx="74" cy="129" r="20" fill="#8a1020" opacity=".18" filter="url(#bs-glow)"/>
<path d="M128 110 Q126 72 160 64 Q194 72 192 110 Q196 140 186 152 Q190 172 178 188 Q170 200 160 202 Q150 200 142 188 Q130 172 134 152 Q124 140 128 110 Z" 
<!-- BACK HAIR + BEARD MASS — the full beard he wore all his adult life -->
fill="#3a2014"/>

<!-- NECK -->
<rect x="150" y="142" width="20" height="26" fill="url(#bs-skin)"/>
<!-- HEAD -->
<ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#bs-skin)"/>

<!-- HAIR — centre-parted, swept back -->
<path d="M129 106 Q127 70 160 62 Q193 70 191 106 Q184 90 176 96 Q179 82 168 84 Q170 76 160 78 Q150 76 152 84 Q141 82 144 96 Q136 90 129 106 Z" fill="#4a2818"/>

<!-- the part -->
<path d="M160 64 Q150 72 146 86 M160 64 Q170 72 174 86" stroke="#3a2014" stroke-width="1" fill="none" opacity=".6"/>

<!-- BROWS -->
<path d="M139 108 Q149 104 156 108" stroke="#3a2014" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M164 108 Q171 104 181 108" stroke="#3a2014" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<!-- EYES — a manager’s eyes. Practical, and up late -->
<ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/><circle cx="150" cy="118" r="2.3" fill="#3a2c18"/><circle cx="170" cy="118" r="2.3" fill="#3a2c18"/><path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>
<path d="M130 128 Q124 168 152 192 Q160 202 168 192 Q196 168 190 128 Q178 156 160 158 Q142 156 130 128 Z" fill="#6a3a22"/>
<circle cx="140" cy="150" r="5.4" fill="#5e3220"/><circle cx="151" cy="164" r="5.8" fill="#74402a"/><circle cx="160" cy="174" r="6.2" fill="#6a3a22"/><circle cx="169" cy="164" r="5.8" fill="#74402a"/><circle cx="180" cy="150" r="5.4" fill="#5e3220"/><circle cx="148" cy="182" r="4.8" fill="#5e3220"/><circle cx="160" cy="188" r="5" fill="#6a3a22"/><circle cx="172" cy="182" r="4.8" fill="#5e3220"/>
<path d="M148 146 Q160 152 172 146 Q166 154 160 154 Q154 154 148 146 Z" fill="#4a2818"/>
<path d="M139 396 L157 396 L155 512 L141 512 Z" fill="#2a282e"/><path d="M163 396 L181 396 L179 512 L165 512 Z" fill="#222026"/>
<path d="M141 404 L146 404 L145 508 L142 508 Z" fill="#3a3840" opacity=".5"/><path d="M166 404 L171 404 L170 508 L167 508 Z" fill="#3a3840" opacity=".5"/>
<path d="M126 512 L158 512 Q166 512 166 522 L166 532 Q166 538 158 538 L124 538 Q118 538 118 530 Z" fill="#0e0c10"/><path d="M162 512 L194 512 Q200 512 200 522 L200 532 Q200 538 192 538 L162 538 Q156 538 156 530 Z" fill="#0a080c"/>

<!-- FROCK COAT — charcoal, Victorian, entirely respectable -->
<path d="M118 200 Q160 184 202 200 L210 422 Q160 436 110 422 Z" fill="#26242c"/>

<!-- LAPELS -->
<path d="M150 196 L130 212 L142 320 L150 326 Z" fill="#1c1a22"/><path d="M150 196 L190 212 L178 320 L150 326 Z" fill="#161420"/>

<!-- SHIRT FRONT, white -->
<path d="M150 196 L138 214 L150 230 L162 214 Z" fill="#ece8dc"/>

<!-- THE CRAVAT — deep red, the one place the blood shows -->
<path d="M150 214 L154 250 L160 256 L166 250 L170 214 L160 224 Z" fill="#5a1018"/>
<path d="M150 230 L150 420" stroke="#16141c" stroke-width="2" opacity=".6"/>

<!-- coat buttons -->
<circle cx="150" cy="300" r="2.2" fill="#0e0c12"/><circle cx="150" cy="330" r="2.2" fill="#0e0c12"/><circle cx="150" cy="360" r="2.2" fill="#0e0c12"/>

<!-- LEFT ARM -->
<path d="M118 230 Q108 320 118 414 L134 410 Q126 320 130 236 Z" fill="#1e1c24"/>

<!-- RIGHT ARM -->
<path d="M202 230 Q212 320 202 414 L186 410 Q194 320 190 236 Z" fill="#1a1820"/>
<ellipse cx="120" cy="414" rx="10" ry="12" fill="url(#bs-skin)"/>
<ellipse cx="200" cy="414" rx="10" ry="12" fill="url(#bs-skin)"/>
<line x1="150" y1="232" x2="150" y2="420" stroke="#8a1020" stroke-width="1" opacity=".45" filter="url(#bs-glow)"/>
<!-- Ground glow -->
<ellipse cx="160" cy="552" rx="104" ry="14" fill="#2a1015" opacity=".4"/></svg>
`;

F['plato'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('pl','#6a4fc4','#221b38')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#pl-bg)"/>

  <!-- HAIR + BEARD DARK MASS (grey elder) -->
  <path d="M125 112 Q118 76 160 62 Q202 76 195 112 Q198 140 188 150 Q190 168 178 184 Q170 196 160 198 Q150 196 142 184 Q130 168 132 150 Q122 140 125 112 Z" fill="#403c34"/>
  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#pl-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#pl-skin)"/>
  <!-- WAVY GREY CROWN HAIR -->
  <path d="M130 108 Q127 70 160 60 Q193 70 190 108 Q183 92 176 96 Q180 82 169 83 Q172 75 160 77 Q148 75 151 83 Q140 82 144 96 Q137 92 130 108 Z" fill="#5a554a"/>
  <circle cx="137" cy="100" r="5.2" fill="#524d44"/><circle cx="148" cy="89" r="5.2" fill="#625c50"/>
  <circle cx="160" cy="84" r="5.4" fill="#5a554a"/><circle cx="172" cy="89" r="5.2" fill="#625c50"/>
  <circle cx="183" cy="100" r="5.2" fill="#524d44"/><circle cx="131" cy="112" r="4.6" fill="#403c34"/>
  <circle cx="189" cy="112" r="4.6" fill="#403c34"/><circle cx="129" cy="126" r="4.4" fill="#403c34"/>
  <circle cx="191" cy="126" r="4.4" fill="#383428"/>
  <!-- FILLET (cloth band) -->
  <path d="M131 110 Q160 99 189 110" stroke="#b9a86a" stroke-width="3.4" fill="none" opacity=".85"/>
  <path d="M131 110 Q160 99 189 110" stroke="#d8c894" stroke-width="1.2" fill="none" opacity=".5"/>
  <!-- BROWS / EYES / NOSE -->
  <path d="M139 108 Q149 104 156 108" stroke="#403c34" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M164 108 Q171 104 181 108" stroke="#403c34" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/>
  <ellipse cx="171" cy="117" rx="5" ry="3.4" fill="#efeadd" opacity=".92"/>
  <circle cx="150" cy="118" r="2.3" fill="#3a3320"/><circle cx="170" cy="118" r="2.3" fill="#3a3320"/>
  <path d="M158 120 Q156 133 153 140 Q160 144 167 140 Q164 133 162 120" fill="#9c6f4c" opacity=".5"/>
  <!-- FULL WAVY GREY BEARD -->
  <path d="M132 132 Q126 170 150 192 Q160 202 170 192 Q194 170 188 132 Q178 162 160 164 Q142 162 132 132 Z" fill="#5a554a"/>
  <circle cx="140" cy="150" r="5.4" fill="#524d44"/><circle cx="151" cy="164" r="5.6" fill="#625c50"/>
  <circle cx="160" cy="172" r="6" fill="#5a554a"/><circle cx="169" cy="164" r="5.6" fill="#625c50"/>
  <circle cx="180" cy="150" r="5.4" fill="#524d44"/><circle cx="146" cy="180" r="4.8" fill="#403c34"/>
  <circle cx="160" cy="186" r="5" fill="#524d44"/><circle cx="174" cy="180" r="4.8" fill="#403c34"/>
  <path d="M147 144 Q160 150 173 144 Q166 153 160 153 Q154 153 147 144 Z" fill="#403c34"/>

  <!-- ============ BODY ============ -->
  <!-- LEGS (bare lower legs) -->
  <path d="M139 396 L157 396 L155 512 L141 512 Z" fill="url(#pl-skin)"/>
  <path d="M163 396 L181 396 L179 512 L165 512 Z" fill="url(#pl-skin)"/>
  <path d="M141 404 L146 404 L145 508 L142 508 Z" fill="#9c6f4c" opacity=".3"/>
  <path d="M166 404 L171 404 L170 508 L167 508 Z" fill="#9c6f4c" opacity=".3"/>
  <!-- SANDALS -->
  <path d="M133 510 L158 510 L158 526 Q158 532 150 532 L130 532 Q124 532 125 524 Z" fill="url(#pl-skin)"/>
  <path d="M162 510 L187 510 L188 524 Q189 532 181 532 L162 532 Q154 532 156 526 Z" fill="url(#pl-skin)"/>
  <rect x="123" y="530" width="38" height="6" rx="3" fill="#5a3c20"/>
  <rect x="159" y="530" width="38" height="6" rx="3" fill="#523620"/>
  <path d="M137 512 L152 520 M139 520 L150 526" stroke="#6e4a2a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M167 512 L182 520 M169 520 L180 526" stroke="#5e3e22" stroke-width="2.4" stroke-linecap="round"/>

  <!-- CHITON (cream under-tunic) -->
  <path d="M126 198 Q160 182 194 198 L202 400 Q160 414 118 400 Z" fill="#d8d2c0"/>
  <path d="M126 198 Q160 182 194 198 L198 252 Q160 266 122 252 Z" fill="#e4dfcf" opacity=".6"/>
  <path d="M118 392 Q160 406 202 392 L202 400 Q160 414 118 400 Z" fill="#b9a86a" opacity=".7"/>
  <path d="M150 210 L150 396" stroke="#bdb6a0" stroke-width="2" opacity=".5"/>

  <!-- HIMATION main drape (indigo, swagged over viewer-left) -->
  <path d="M110 200 Q140 184 160 182 Q172 188 176 208 Q150 232 150 300 Q148 360 158 400 Q138 406 108 394 Z" fill="#473f78"/>
  <path d="M128 232 Q140 300 132 390" stroke="#352e5e" stroke-width="3" fill="none" opacity=".55"/>
  <path d="M150 242 Q156 320 152 394" stroke="#2e2850" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M118 252 Q126 332 120 390" stroke="#6a5fb0" stroke-width="1.6" fill="none" opacity=".4"/>

  <!-- HIMATION back fold (deeper indigo, viewer-right) -->
  <path d="M168 190 Q200 198 214 234 L210 416 Q192 426 174 418 Q186 322 176 212 Z" fill="#352e64"/>
  <path d="M176 212 Q186 322 174 416" stroke="#2a244e" stroke-width="1.4" fill="none" opacity=".6"/>
  <path d="M198 226 Q207 322 202 404" stroke="#5048a0" stroke-width="2.6" fill="none" opacity=".5"/>
  <path d="M168 190 Q198 186 214 208 Q200 198 168 202 Z" fill="#43396f"/>

  <!-- diagonal himation swag across chest -->
  <path d="M122 244 Q160 272 206 252 L206 276 Q160 296 122 268 Z" fill="#564d8e"/>
  <path d="M122 244 Q160 272 206 252" stroke="#6a5fb0" stroke-width="1.6" fill="none" opacity=".5"/>

  <!-- RIGHT ARM (himation upper, bare forearm) holding the scroll -->
  <path d="M150 214 Q126 250 116 304 Q126 312 140 306 Q150 262 162 226 Z" fill="#564d8e"/>
  <path d="M150 216 Q132 250 124 300" stroke="#43396f" stroke-width="1.4" fill="none" opacity=".5"/>
  <path d="M122 300 Q116 322 118 344 L134 348 Q136 322 140 304 Z" fill="url(#pl-skin)"/>
  <ellipse cx="124" cy="346" rx="11" ry="12" fill="url(#pl-skin)"/>
  <!-- SCROLL (the dialogues) -->
  <g transform="rotate(-14 118 372)">
    <rect x="106" y="338" width="22" height="74" rx="5" fill="#e6dcc2" stroke="#c8bb9a" stroke-width="1"/>
    <ellipse cx="117" cy="338" rx="11" ry="3.8" fill="#d8cca8"/>
    <ellipse cx="117" cy="412" rx="11" ry="3.8" fill="#cabd99"/>
    <path d="M111 356 H123 M111 368 H123 M111 380 H123 M111 392 H123" stroke="#9a8a66" stroke-width="0.7" opacity=".55"/>
  </g>
  <ellipse cx="123" cy="348" rx="8" ry="9" fill="url(#pl-skin)"/>

  <!-- accent glow + ground shadow -->
  <line x1="176" y1="208" x2="200" y2="408" stroke="#6a4fc4" stroke-width="1" opacity=".45" filter="url(#pl-glow)"/>
  <ellipse cx="160" cy="552" rx="104" ry="14" fill="#2a2350" opacity=".4"/>
</svg>
`;

F['seneca'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('se','#3f8d7e','#16302b')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#se-bg)"/>

  <!-- BACK / SIDE HAIR MASS (grey, receding) -->
  <path d="M128 120 Q122 92 134 78 Q128 104 134 126 Q126 140 130 152 Q124 140 128 120 Z" fill="#54514a"/>
  <path d="M192 120 Q198 92 186 78 Q192 104 186 126 Q194 140 190 152 Q196 140 192 120 Z" fill="#54514a"/>
  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#se-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#se-skin)"/>
  <!-- RECEDING GREY HAIR (short, high forehead) -->
  <path d="M133 100 Q136 80 160 76 Q184 80 187 100 Q182 92 174 92 Q176 86 166 87 Q170 82 160 83 Q150 82 154 87 Q144 86 146 92 Q138 92 133 100 Z" fill="#615d54"/>
  <path d="M131 104 Q130 84 140 78 Q134 96 138 116 Q132 110 131 104 Z" fill="#56524a"/>
  <path d="M189 104 Q190 84 180 78 Q186 96 182 116 Q188 110 189 104 Z" fill="#56524a"/>
  <circle cx="140" cy="98" r="4.4" fill="#5a564d"/><circle cx="150" cy="90" r="4.2" fill="#67625a"/>
  <circle cx="170" cy="90" r="4.2" fill="#67625a"/><circle cx="180" cy="98" r="4.4" fill="#5a564d"/>
  <!-- forehead lines (elder) -->
  <path d="M146 99 Q160 95 174 99" stroke="#b08c6a" stroke-width="0.8" fill="none" opacity=".4"/>
  <!-- BROWS / EYES / NOSE -->
  <path d="M140 109 Q149 105 156 109" stroke="#54514a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M164 109 Q171 105 180 109" stroke="#54514a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="118" rx="4.8" ry="3.2" fill="#efeadd" opacity=".92"/>
  <ellipse cx="171" cy="118" rx="4.8" ry="3.2" fill="#efeadd" opacity=".92"/>
  <circle cx="150" cy="119" r="2.2" fill="#3a352a"/><circle cx="170" cy="119" r="2.2" fill="#3a352a"/>
  <path d="M159 121 Q157 133 154 140 Q160 143 166 140 Q163 133 161 121" fill="#9c6f4c" opacity=".5"/>
  <!-- gaunt cheek hollows (Stoic, ascetic) -->
  <path d="M137 124 Q140 138 148 148" stroke="#b88e68" stroke-width="2" fill="none" opacity=".3"/>
  <path d="M183 124 Q180 138 172 148" stroke="#b88e68" stroke-width="2" fill="none" opacity=".3"/>
  <!-- SHORT GREY BEARD (trimmed, framing jaw) -->
  <path d="M136 138 Q134 166 152 182 Q160 190 168 182 Q186 166 184 138 Q176 158 160 160 Q144 158 136 138 Z" fill="#615d54"/>
  <circle cx="143" cy="152" r="4.4" fill="#56524a"/><circle cx="152" cy="164" r="4.6" fill="#67625a"/>
  <circle cx="160" cy="170" r="4.8" fill="#5e5a51"/><circle cx="168" cy="164" r="4.6" fill="#67625a"/>
  <circle cx="177" cy="152" r="4.4" fill="#56524a"/>
  <path d="M148 146 Q160 152 172 146 Q166 154 160 154 Q154 154 148 146 Z" fill="#54514a"/>
  <!-- moustache -->
  <path d="M148 140 Q160 147 172 140 Q166 144 160 144 Q154 144 148 140 Z" fill="#5e5a51"/>

  <!-- ============ BODY ============ -->
  <!-- LEGS (bare lower legs) -->
  <path d="M139 396 L157 396 L155 512 L141 512 Z" fill="url(#se-skin)"/>
  <path d="M163 396 L181 396 L179 512 L165 512 Z" fill="url(#se-skin)"/>
  <path d="M141 404 L146 404 L145 508 L142 508 Z" fill="#9c6f4c" opacity=".3"/>
  <path d="M166 404 L171 404 L170 508 L167 508 Z" fill="#9c6f4c" opacity=".3"/>
  <!-- SANDALS -->
  <path d="M133 510 L158 510 L158 526 Q158 532 150 532 L130 532 Q124 532 125 524 Z" fill="url(#se-skin)"/>
  <path d="M162 510 L187 510 L188 524 Q189 532 181 532 L162 532 Q154 532 156 526 Z" fill="url(#se-skin)"/>
  <rect x="123" y="530" width="38" height="6" rx="3" fill="#5a3c20"/>
  <rect x="159" y="530" width="38" height="6" rx="3" fill="#523620"/>
  <path d="M137 512 L152 520 M139 520 L150 526" stroke="#6e4a2a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M167 512 L182 520 M169 520 L180 526" stroke="#5e3e22" stroke-width="2.4" stroke-linecap="round"/>

  <!-- TUNIC (cream, with teal clavus stripe) -->
  <path d="M128 198 Q160 184 192 198 L200 400 Q160 414 120 400 Z" fill="#d4cdb8"/>
  <path d="M128 198 Q160 184 192 198 L196 250 Q160 264 124 250 Z" fill="#e0d9c5" opacity=".6"/>
  <path d="M153 200 L153 398" stroke="#3f8d7e" stroke-width="4" opacity=".7"/>
  <path d="M167 200 L167 398" stroke="#3f8d7e" stroke-width="4" opacity=".55"/>
  <path d="M120 392 Q160 406 200 392 L200 400 Q160 414 120 400 Z" fill="#bdb6a0" opacity=".7"/>

  <!-- TOGA back fold (stone, viewer-right) -->
  <path d="M170 192 Q200 200 214 236 L210 416 Q192 426 176 418 Q186 322 178 212 Z" fill="#c8c2ae"/>
  <path d="M180 214 Q188 322 178 414" stroke="#aaa491" stroke-width="1.6" fill="none" opacity=".6"/>
  <path d="M200 228 Q208 322 202 406" stroke="#ded7c2" stroke-width="2.4" fill="none" opacity=".5"/>

  <!-- TOGA main drape (white, swagged over viewer-left) -->
  <path d="M108 200 Q140 184 162 182 Q176 190 180 212 Q150 236 150 304 Q148 360 158 402 Q136 408 106 394 Z" fill="#ece6d6"/>
  <path d="M126 232 Q138 304 130 392" stroke="#d4ccb8" stroke-width="3" fill="none" opacity=".55"/>
  <path d="M150 244 Q156 322 152 396" stroke="#cfc6b0" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M116 252 Q124 332 118 390" stroke="#fbf7ec" stroke-width="1.6" fill="none" opacity=".45"/>
  <!-- toga over-shoulder swag with teal edge -->
  <path d="M120 246 Q160 274 206 254 L206 272 Q160 290 120 266 Z" fill="#e4ddca"/>
  <path d="M120 246 Q160 274 206 254" stroke="#3f8d7e" stroke-width="1.6" fill="none" opacity=".5"/>

  <!-- RIGHT ARM (toga upper, bare forearm) holding the scroll -->
  <path d="M150 216 Q126 252 116 304 Q126 312 140 306 Q150 264 162 228 Z" fill="#e4ddcc"/>
  <path d="M150 218 Q132 252 124 302" stroke="#cfc6b0" stroke-width="1.4" fill="none" opacity=".5"/>
  <path d="M122 300 Q116 322 118 344 L134 348 Q136 322 140 304 Z" fill="url(#se-skin)"/>
  <ellipse cx="124" cy="346" rx="11" ry="12" fill="url(#se-skin)"/>
  <!-- SCROLL (the Moral Letters) -->
  <g transform="rotate(-14 118 372)">
    <rect x="106" y="338" width="22" height="74" rx="5" fill="#e6dcc2" stroke="#c8bb9a" stroke-width="1"/>
    <ellipse cx="117" cy="338" rx="11" ry="3.8" fill="#d8cca8"/>
    <ellipse cx="117" cy="412" rx="11" ry="3.8" fill="#cabd99"/>
    <path d="M111 356 H123 M111 368 H123 M111 380 H123 M111 392 H123" stroke="#9a8a66" stroke-width="0.7" opacity=".55"/>
  </g>
  <ellipse cx="123" cy="348" rx="8" ry="9" fill="url(#se-skin)"/>

  <!-- accent glow + ground shadow -->
  <line x1="160" y1="212" x2="158" y2="402" stroke="#3f8d7e" stroke-width="1" opacity=".4" filter="url(#se-glow)"/>
  <ellipse cx="160" cy="552" rx="104" ry="14" fill="#1c3a34" opacity=".4"/>
</svg>
`;

F['confucius'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('cf','#2f9956','#15301c')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#cf-bg)"/>

  <!-- ROBE (jade Hanfu, A-line to floor) -->
  <path d="M118 200 Q160 184 202 200 L232 514 Q160 532 88 514 Z" fill="#2f7d52"/>
  <path d="M118 200 Q160 184 202 200 L210 300 Q160 312 110 300 Z" fill="#368a5c" opacity=".6"/>
  <path d="M160 232 L160 510" stroke="#245f3f" stroke-width="2" opacity=".45"/>
  <!-- hem band -->
  <path d="M88 506 Q160 524 232 506 L232 514 Q160 532 88 514 Z" fill="#1f5036"/>
  <path d="M92 508 Q160 526 228 508" stroke="#c2a02e" stroke-width="2.2" fill="none" opacity=".7"/>

  <!-- LEFT BELL SLEEVE -->
  <path d="M122 206 Q86 236 78 318 Q76 348 94 358 Q120 354 122 318 L130 236 Z" fill="#2f7d52"/>
  <path d="M122 208 Q92 240 86 316" stroke="#245f3f" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M86 346 Q106 356 122 350" stroke="#1f5036" stroke-width="3" fill="none" opacity=".55"/>
  <!-- RIGHT BELL SLEEVE -->
  <path d="M198 206 Q234 236 242 318 Q244 348 226 358 Q200 354 198 318 L190 236 Z" fill="#2f7d52"/>
  <path d="M198 208 Q228 240 234 316" stroke="#245f3f" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M234 346 Q214 356 198 350" stroke="#1f5036" stroke-width="3" fill="none" opacity=".55"/>

  <!-- CROSSED COLLAR (right-over-left), cream inner robe -->
  <path d="M134 200 Q160 210 186 200 L168 264 L160 270 L152 264 Z" fill="#ece4d0"/>
  <path d="M134 200 L152 264 L160 270 L150 300 L120 238 Q124 210 134 200 Z" fill="#2a7048"/>
  <path d="M186 200 L168 264 L160 270 L170 300 L200 238 Q196 210 186 200 Z" fill="#34855a"/>
  <path d="M186 200 L160 270" stroke="#1f5036" stroke-width="3" fill="none"/>
  <path d="M134 200 L160 270" stroke="#1f5036" stroke-width="2.2" fill="none" opacity=".65"/>

  <!-- SASH (waist) -->
  <path d="M106 296 Q160 308 214 296 L214 318 Q160 330 106 318 Z" fill="#a83e2a"/>
  <path d="M106 296 Q160 308 214 296" stroke="#c75a40" stroke-width="1.6" fill="none" opacity=".55"/>
  <rect x="150" y="312" width="20" height="14" rx="3" fill="#963826"/>
  <path d="M153 326 L150 372 L159 372 L160 326 Z" fill="#a83e2a"/>
  <path d="M167 326 L170 368 L161 368 L160 326 Z" fill="#963826"/>

  <!-- CLASPED HANDS in sleeves (gong shou) -->
  <path d="M126 298 Q160 288 194 298 Q202 330 194 350 Q160 362 126 350 Q118 330 126 298 Z" fill="#368a5c"/>
  <path d="M126 298 Q160 288 194 298" stroke="#245f3f" stroke-width="1.6" fill="none" opacity=".45"/>
  <ellipse cx="160" cy="330" rx="14" ry="10" fill="url(#cf-skin)" opacity=".95"/>
  <path d="M160 322 L160 338" stroke="#a07c54" stroke-width="1" opacity=".5"/>

  <!-- SHOES (peeking at hem) -->
  <ellipse cx="142" cy="519" rx="16" ry="7" fill="#1c1c22"/>
  <ellipse cx="178" cy="519" rx="16" ry="7" fill="#23232a"/>

  <!-- NECK --><rect x="151" y="142" width="18" height="22" fill="url(#cf-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="118" rx="27" ry="31" fill="url(#cf-skin)"/>

  <!-- grey hair at temples (under cap) -->
  <path d="M133 112 Q132 98 138 90 Q134 106 138 126 Q134 120 133 112 Z" fill="#5a564d"/>
  <path d="M187 112 Q188 98 182 90 Q186 106 182 126 Q186 120 187 112 Z" fill="#5a564d"/>
  <!-- SCHOLAR'S CAP (dark) -->
  <path d="M129 104 Q126 74 160 66 Q194 74 191 104 Q186 92 178 90 Q182 80 160 78 Q138 80 142 90 Q134 92 129 104 Z" fill="#2b2b34"/>
  <ellipse cx="160" cy="70" rx="13" ry="7" fill="#30303a"/>
  <path d="M132 100 Q160 90 188 100" stroke="#3a3a46" stroke-width="1.2" fill="none" opacity=".5"/>

  <!-- BROWS / EYES / NOSE / gentle smile -->
  <path d="M141 112 Q149 108 156 112" stroke="#4a463e" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M164 112 Q171 108 179 112" stroke="#4a463e" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="120" rx="4.4" ry="2.6" fill="#efeadd" opacity=".9"/>
  <ellipse cx="170" cy="120" rx="4.4" ry="2.6" fill="#efeadd" opacity=".9"/>
  <circle cx="151" cy="121" r="2" fill="#3a352a"/><circle cx="169" cy="121" r="2" fill="#3a352a"/>
  <path d="M159 123 Q157 133 155 139 Q160 142 165 139 Q163 133 161 123" fill="#9c6f4c" opacity=".5"/>
  <path d="M151 146 Q160 151 169 146" stroke="#8a5a3a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/>

  <!-- LONG MOUSTACHE (drooping) -->
  <path d="M148 142 Q140 150 133 166 Q140 156 150 150 Q156 148 160 148 Q164 148 170 150 Q180 156 187 166 Q180 150 172 142 Q166 146 160 146 Q154 146 148 142 Z" fill="#5e5a51"/>
  <!-- LONG THIN GREY BEARD (flowing to chest) -->
  <path d="M150 150 Q145 202 152 252 Q156 270 160 270 Q164 270 168 252 Q175 202 170 150 Q166 168 160 170 Q154 168 150 150 Z" fill="#615d54"/>
  <path d="M156 162 Q154 212 158 258" stroke="#56524a" stroke-width="2" fill="none" opacity=".5"/>
  <path d="M164 162 Q166 212 162 258" stroke="#6a665c" stroke-width="2" fill="none" opacity=".5"/>
  <path d="M151 242 Q151 258 155 266" stroke="#56524a" stroke-width="1.3" fill="none" opacity=".5"/>
  <path d="M169 242 Q169 258 165 266" stroke="#56524a" stroke-width="1.3" fill="none" opacity=".5"/>

  <!-- accent glow + ground shadow -->
  <line x1="198" y1="208" x2="230" y2="508" stroke="#2f9956" stroke-width="1" opacity=".4" filter="url(#cf-glow)"/>
  <ellipse cx="160" cy="552" rx="108" ry="14" fill="#163024" opacity=".4"/>
</svg>
`;

F['frederick-douglass','john-milton','akhenaten'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('fd','#3f6db0','#17223a')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#fd-bg)"/>

  <!-- HAIR MANE (swept-back, voluminous, grey) -->
  <path d="M120 122 Q104 96 116 68 Q128 46 160 44 Q192 46 204 68 Q216 96 200 122 Q202 94 188 84 Q198 66 178 60 Q192 50 160 50 Q128 50 142 60 Q122 66 132 84 Q118 94 120 122 Z" fill="#cbc6bb"/>
  <path d="M118 120 Q102 102 108 78 Q110 106 124 130 Q118 126 118 120 Z" fill="#bdb8ad"/>
  <path d="M202 120 Q218 102 212 78 Q210 106 196 130 Q202 126 202 120 Z" fill="#bdb8ad"/>

  <!-- NECK --><rect x="151" y="144" width="18" height="24" fill="url(#fd-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="120" rx="27" ry="31" fill="url(#fd-skin)"/>

  <!-- HAIR over crown (swept up + back) -->
  <path d="M133 106 Q128 72 160 64 Q192 72 187 106 Q182 86 174 88 Q188 72 160 72 Q132 72 146 88 Q138 86 133 106 Z" fill="#d4cfc4"/>
  <path d="M135 100 Q160 82 185 100" stroke="#b0aba0" stroke-width="1.4" fill="none" opacity=".6"/>
  <path d="M140 90 Q160 78 180 90" stroke="#b0aba0" stroke-width="1.2" fill="none" opacity=".5"/>

  <!-- BROWS / EYES / NOSE (dignified) -->
  <path d="M140 111 Q149 107 157 111" stroke="#403828" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M163 111 Q171 107 180 111" stroke="#403828" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="120" rx="4.6" ry="3" fill="#efeadd" opacity=".9"/>
  <ellipse cx="170" cy="120" rx="4.6" ry="3" fill="#efeadd" opacity=".9"/>
  <circle cx="151" cy="121" r="2.1" fill="#2e2a20"/><circle cx="169" cy="121" r="2.1" fill="#2e2a20"/>
  <path d="M159 123 Q157 133 155 139 Q160 142 165 139 Q163 133 161 123" fill="#8a5f3e" opacity=".5"/>

  <!-- FULL BEARD (grey) -->
  <path d="M131 130 Q127 170 150 198 Q160 210 170 198 Q193 170 189 130 Q180 152 173 158 Q178 178 164 194 Q160 198 156 194 Q142 178 147 158 Q140 152 131 130 Z" fill="#cbc6bb"/>
  <path d="M138 140 Q134 174 154 196" stroke="#b0aba0" stroke-width="1.6" fill="none" opacity=".5"/>
  <path d="M182 140 Q186 174 166 196" stroke="#b0aba0" stroke-width="1.6" fill="none" opacity=".5"/>
  <path d="M146 140 Q160 148 174 140 Q168 152 160 152 Q152 152 146 140 Z" fill="#bdb8ad"/>

  <!-- ============ SUIT ============ -->
  <!-- TROUSERS -->
  <path d="M138 412 L158 412 L156 512 L141 512 Z" fill="#2a2c33"/>
  <path d="M162 412 L182 412 L179 512 L164 512 Z" fill="#26282f"/>
  <!-- SHOES -->
  <path d="M133 510 L160 510 L160 524 Q160 530 150 530 L130 530 Q124 530 125 522 Z" fill="#15151a"/>
  <path d="M160 510 L188 510 L189 522 Q190 530 182 530 L162 530 Q154 530 156 524 Z" fill="#1b1b20"/>

  <!-- FROCK COAT (dark, torso + skirt) -->
  <path d="M118 200 Q160 184 202 200 L210 432 Q160 444 110 432 Z" fill="#2f3138"/>
  <path d="M118 200 Q160 184 202 200 L206 268 Q160 256 114 268 Z" fill="#383a42" opacity=".55"/>
  <path d="M160 250 L160 430" stroke="#1f2127" stroke-width="2" opacity=".5"/>

  <!-- WAISTCOAT (center strip, blue) -->
  <path d="M150 224 L170 224 L168 330 Q160 338 152 330 Z" fill="#3f6db0"/>
  <path d="M150 224 L170 224 L169 250 Q160 256 151 250 Z" fill="#4f7dc0" opacity=".55"/>
  <circle cx="160" cy="262" r="1.7" fill="#284b80"/><circle cx="160" cy="284" r="1.7" fill="#284b80"/>
  <circle cx="160" cy="306" r="1.7" fill="#284b80"/>

  <!-- SHIRT V + COLLAR (white) -->
  <path d="M150 204 L170 204 L164 226 L160 230 L156 226 Z" fill="#ece9e0"/>
  <path d="M150 204 L160 216 L156 226 Z" fill="#e0dcd2"/>
  <path d="M170 204 L160 216 L164 226 Z" fill="#f4f1e8"/>

  <!-- CRAVAT (deep blue knot + ends) -->
  <path d="M160 216 L151 226 L159 236 L160 228 Z" fill="#2f5590"/>
  <path d="M160 216 L169 226 L161 236 L160 228 Z" fill="#36609e"/>
  <ellipse cx="160" cy="224" rx="3" ry="3.4" fill="#284b80"/>

  <!-- LAPELS (frame the V) -->
  <path d="M150 204 L139 211 L150 250 L158 230 Z" fill="#262830"/>
  <path d="M170 204 L181 211 L170 250 L162 230 Z" fill="#262830"/>

  <!-- LEFT ARM (coat sleeve) -->
  <path d="M120 206 Q100 250 100 320 Q100 350 116 356 Q130 350 128 318 Q128 256 134 218 Z" fill="#2a2c33"/>
  <path d="M100 348 Q116 356 130 350" stroke="#1f2127" stroke-width="2.4" fill="none" opacity=".55"/>
  <ellipse cx="113" cy="360" rx="11" ry="12" fill="url(#fd-skin)"/>
  <!-- RIGHT ARM (coat sleeve) holding rolled paper -->
  <path d="M200 206 Q220 250 220 320 Q220 350 204 356 Q190 350 192 318 Q192 256 186 218 Z" fill="#2a2c33"/>
  <path d="M220 348 Q204 356 190 350" stroke="#1f2127" stroke-width="2.4" fill="none" opacity=".55"/>
  <ellipse cx="207" cy="360" rx="11" ry="12" fill="url(#fd-skin)"/>
  <!-- ROLLED PAPER (his writings) -->
  <g transform="rotate(16 207 384)">
    <rect x="198" y="350" width="18" height="64" rx="4" fill="#ece4d0" stroke="#cbbf9e" stroke-width="1"/>
    <ellipse cx="207" cy="350" rx="9" ry="3.2" fill="#dcd0b0"/>
    <ellipse cx="207" cy="414" rx="9" ry="3.2" fill="#cdc09e"/>
    <path d="M202 366 H212 M202 378 H212 M202 390 H212" stroke="#9a8a66" stroke-width="0.7" opacity=".5"/>
  </g>
  <ellipse cx="206" cy="360" rx="8" ry="9" fill="url(#fd-skin)"/>

  <!-- accent glow + ground shadow -->
  <line x1="160" y1="216" x2="160" y2="430" stroke="#3f6db0" stroke-width="1" opacity=".4" filter="url(#fd-glow)"/>
  <ellipse cx="160" cy="552" rx="104" ry="14" fill="#1a2740" opacity=".4"/>
</svg>
`;

F['john-milton'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('jm','#e8c878','#5a4416')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#jm-bg)"/>

  <!-- HAIR (back): long waves falling to the shoulders -->
  <path d="M98 168 Q86 104 134 70 Q160 58 186 70 Q234 104 222 168 Q236 232 224 300 Q218 330 206 348 L204 270 Q210 214 200 172 L120 172 Q110 214 116 270 L114 348 Q102 330 96 300 Q84 232 98 168Z" fill="#6f5030"/>
  <path d="M98 168 Q92 232 112 304 Q102 268 102 214 Q102 186 110 168Z" fill="#564026" opacity=".55"/>
  <path d="M222 168 Q228 232 208 304 Q218 268 218 214 Q218 186 210 168Z" fill="#564026" opacity=".55"/>

  <!-- SHOULDERS / DARK DOUBLET -->
  <path d="M64 560 Q66 432 118 372 Q160 356 202 372 Q254 432 256 560 Z" fill="#211e28"/>
  <path d="M118 372 Q160 358 202 372 Q188 394 160 398 Q132 394 118 372Z" fill="#16141e"/>

  <!-- WHITE FALLING-BAND COLLAR -->
  <path d="M120 372 Q160 364 200 372 Q210 404 202 432 Q180 420 160 420 Q140 420 118 432 Q110 404 120 372Z" fill="#efeadc"/>
  <path d="M132 382 Q160 375 188 382 Q196 406 190 426 Q176 417 160 417 Q144 417 130 426 Q124 406 132 382Z" fill="#d6d0c0" opacity=".5"/>
  <path d="M158 418 L160 438 L162 418 Z" fill="#cdc6b4"/>

  <!-- NECK -->
  <path d="M146 206 Q144 300 150 366 L170 366 Q176 300 174 206 Z" fill="url(#jm-skin)"/>
  <path d="M146 220 Q150 290 158 360 Q150 300 148 220Z" fill="#9a7050" opacity=".4"/>

  <!-- FACE -->
  <ellipse cx="160" cy="172" rx="40" ry="48" fill="url(#jm-skin)"/>
  <path d="M124 176 Q120 202 138 220" fill="none" stroke="#a8784e" stroke-width="2" opacity=".28"/>
  <path d="M196 176 Q200 202 182 220" fill="none" stroke="#a8784e" stroke-width="2" opacity=".28"/>

  <!-- HAIR (front): center part, framing waves -->
  <path d="M120 150 Q114 102 160 90 Q206 102 200 150 Q196 118 178 108 Q168 122 160 124 Q152 122 142 108 Q124 118 120 150Z" fill="#785833"/>
  <path d="M120 150 Q110 196 118 240 Q104 200 108 162 Q110 150 120 150Z" fill="#6f5030"/>
  <path d="M200 150 Q210 196 202 240 Q216 200 212 162 Q210 150 200 150Z" fill="#6f5030"/>
  <path d="M160 90 Q158 108 160 126 Q162 108 160 90Z" fill="#5a4024" opacity=".55"/>
  <path d="M138 110 Q132 142 132 178" fill="none" stroke="#9c7c50" stroke-width="1.6" opacity=".45"/>
  <path d="M182 110 Q188 142 188 178" fill="none" stroke="#9c7c50" stroke-width="1.6" opacity=".45"/>

  <!-- BROWS -->
  <path d="M137 159 Q149 153 161 158" fill="none" stroke="#5e4226" stroke-width="2.3" stroke-linecap="round"/>
  <path d="M159 158 Q171 153 183 159" fill="none" stroke="#5e4226" stroke-width="2.3" stroke-linecap="round"/>

  <!-- EYES — sightless, soft distant gaze (pale iris, no hard pupil) -->
  <path d="M134 171 Q148 163 161 171 Q148 177 134 171Z" fill="#f2ece0"/>
  <path d="M159 171 Q172 163 186 171 Q172 177 159 171Z" fill="#f2ece0"/>
  <circle cx="148" cy="171" r="4.3" fill="#bcc6c8"/>
  <circle cx="172" cy="171" r="4.3" fill="#bcc6c8"/>
  <circle cx="148" cy="171" r="1.5" fill="#8a9498" opacity=".7"/>
  <circle cx="172" cy="171" r="1.5" fill="#8a9498" opacity=".7"/>
  <path d="M133 170 Q148 162 162 170" fill="none" stroke="#9a6e48" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M158 170 Q172 162 187 170" fill="none" stroke="#9a6e48" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M135 174 Q148 178 160 174" fill="none" stroke="#b88a60" stroke-width="1" opacity=".55"/>
  <path d="M160 174 Q172 178 185 174" fill="none" stroke="#b88a60" stroke-width="1" opacity=".55"/>

  <!-- NOSE -->
  <path d="M159 175 Q156 192 152 202 Q160 206 168 202 Q164 192 161 175" fill="none" stroke="#a8784e" stroke-width="1.2" opacity=".45"/>

  <!-- MOUTH — calm, set -->
  <path d="M146 214 Q160 218 174 214" fill="none" stroke="#8a4e3a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M150 220 Q160 223 170 220" fill="none" stroke="#a86a52" stroke-width="1" opacity=".5"/>

  <!-- faint celestial light on the brow (Hail, holy Light) -->
  <ellipse cx="160" cy="140" rx="34" ry="10" fill="#e8c878" opacity=".10"/>
</svg>`;

F['akhenaten'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('ak','#f0c850','#7a5410')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#ak-bg)"/>

  <!-- SHOULDERS / androgynous Amarna torso -->
  <path d="M70 560 Q74 430 116 380 Q160 366 204 380 Q246 430 250 560 Z" fill="#caa05a"/>
  <path d="M70 560 Q74 430 116 380 Q160 366 204 380 Q246 430 250 560 Z" fill="url(#ak-skin)" opacity=".5"/>

  <!-- BROAD USEKH COLLAR -->
  <path d="M116 380 Q160 366 204 380 Q208 410 200 432 Q160 446 120 432 Q112 410 116 380Z" fill="#1a2740"/>
  <path d="M124 384 Q160 374 196 384 Q200 404 194 420 Q160 430 126 420 Q120 404 124 384" fill="none" stroke="#e7b53a" stroke-width="3"/>
  <path d="M130 390 Q160 382 190 390 Q194 404 189 416 Q160 424 131 416 Q126 404 130 390" fill="none" stroke="#2aa6a0" stroke-width="2.4"/>
  <path d="M136 396 Q160 390 184 396 Q188 406 184 414 Q160 420 136 414 Q132 406 136 396" fill="none" stroke="#e7b53a" stroke-width="2"/>

  <!-- NECK (long, slender — Amarna) -->
  <path d="M146 286 Q144 340 152 372 L168 372 Q176 340 174 286 Z" fill="url(#ak-skin)"/>
  <path d="M146 300 Q150 340 158 368 Q150 336 148 300Z" fill="#9a7038" opacity=".4"/>

  <!-- FACE (elongated) + long Amarna chin/jaw -->
  <path d="M130 250 Q130 206 160 200 Q190 206 190 250 Q190 286 172 300 Q160 312 148 300 Q130 286 130 250Z" fill="url(#ak-skin)"/>
  <path d="M132 252 Q128 276 142 296" fill="none" stroke="#a8783e" stroke-width="2" opacity=".3"/>
  <path d="M188 252 Q192 276 178 296" fill="none" stroke="#a8783e" stroke-width="2" opacity=".3"/>

  <!-- BLUE CROWN (Khepresh) -->
  <path d="M124 224 Q116 182 160 172 Q204 182 196 224 Q180 210 160 208 Q140 210 124 224Z" fill="#2a5a9a"/>
  <path d="M124 224 Q116 182 160 172 Q188 180 192 210 Q176 198 160 198 Q138 200 124 224Z" fill="#1c3f72" opacity=".55"/>
  <circle cx="150" cy="196" r="2.4" fill="#e7b53a" opacity=".8"/>
  <circle cx="170" cy="196" r="2.4" fill="#e7b53a" opacity=".8"/>
  <circle cx="160" cy="186" r="2.4" fill="#e7b53a" opacity=".8"/>
  <circle cx="138" cy="208" r="2.4" fill="#e7b53a" opacity=".8"/>
  <circle cx="182" cy="208" r="2.4" fill="#e7b53a" opacity=".8"/>
  <path d="M118 222 Q160 214 202 222 L200 230 Q160 222 120 230 Z" fill="#e7b53a"/>
  <!-- uraeus (cobra) at brow -->
  <path d="M156 214 Q152 206 155 199 Q160 194 165 199 Q168 206 164 214 Z" fill="#e7b53a" stroke="#9a6c10" stroke-width="0.6"/>
  <ellipse cx="160" cy="201" rx="3" ry="2.4" fill="#1a1208"/>

  <!-- BROWS -->
  <path d="M138 240 Q150 234 161 239" fill="none" stroke="#241a0e" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M159 239 Q170 234 182 240" fill="none" stroke="#241a0e" stroke-width="2.2" stroke-linecap="round"/>

  <!-- EYES (almond, kohl-lined with the long Amarna extension) -->
  <path d="M136 250 Q148 244 160 250 Q148 256 136 250Z" fill="#f4efe2"/>
  <path d="M160 250 Q172 244 184 250 Q172 256 160 250Z" fill="#f4efe2"/>
  <ellipse cx="148" cy="250" rx="3.4" ry="3.4" fill="#22150a"/>
  <ellipse cx="172" cy="250" rx="3.4" ry="3.4" fill="#22150a"/>
  <path d="M135 249 Q148 243 161 249" fill="none" stroke="#1a1208" stroke-width="1.6"/>
  <path d="M159 249 Q172 243 185 249" fill="none" stroke="#1a1208" stroke-width="1.6"/>
  <line x1="135" y1="249" x2="126" y2="248" stroke="#1a1208" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="185" y1="249" x2="194" y2="248" stroke="#1a1208" stroke-width="1.6" stroke-linecap="round"/>

  <!-- NOSE (long) -->
  <path d="M159 252 Q156 270 152 280 Q160 284 168 280 Q164 270 161 252" fill="none" stroke="#a8783e" stroke-width="1.2" opacity=".5"/>

  <!-- LIPS (full — Amarna) -->
  <path d="M146 288 Q160 282 174 288 Q160 294 146 288Z" fill="#b06a52"/>
  <path d="M146 288 Q160 292 174 288" fill="none" stroke="#7a4030" stroke-width="1.2"/>

  <!-- ATON RAYS ending in hands + ankhs -->
  <line x1="153" y1="67" x2="104" y2="212" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="100" y="209" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="103" y1="215" x2="99" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="103" y1="215" x2="101" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="103" y1="215" x2="103" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="154" y1="67" x2="122" y2="182" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="118" y="179" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="121" y1="185" x2="118" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="121" y1="185" x2="120" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="121" y1="185" x2="122" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="157" y1="68" x2="142" y2="166" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="138" y="163" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="142" y1="169" x2="139" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="142" y1="169" x2="141" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="142" y1="169" x2="143" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="163" y1="68" x2="178" y2="166" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="174" y="163" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="178" y1="169" x2="177" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="178" y1="169" x2="179" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="178" y1="169" x2="181" y2="174" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="166" y1="67" x2="198" y2="182" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="194" y="179" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="199" y1="185" x2="198" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="199" y1="185" x2="200" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="199" y1="185" x2="202" y2="190" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="167" y1="67" x2="216" y2="212" stroke="#e7b53a" stroke-width="2" opacity=".75"/>
  <rect x="212" y="209" width="8" height="6" rx="2" fill="#e7b53a"/><line x1="217" y1="215" x2="217" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="217" y1="215" x2="219" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/><line x1="217" y1="215" x2="221" y2="220" stroke="#e7b53a" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="159" y1="68" x2="150" y2="244" stroke="#e7b53a" stroke-width="2" opacity=".8"/>
  <g stroke="#f0c850" stroke-width="2.2" fill="none"><ellipse cx="150" cy="238" rx="3.5" ry="4.5"/><line x1="150" y1="243" x2="150" y2="253"/><line x1="145" y1="246" x2="155" y2="246"/></g>
  <line x1="161" y1="68" x2="170" y2="244" stroke="#e7b53a" stroke-width="2" opacity=".8"/>
  <g stroke="#f0c850" stroke-width="2.2" fill="none"><ellipse cx="170" cy="238" rx="3.5" ry="4.5"/><line x1="170" y1="243" x2="170" y2="253"/><line x1="165" y1="246" x2="175" y2="246"/></g>

  <!-- ATON DISK -->
  <circle cx="160" cy="46" r="22" fill="url(#ak-bg)"/>
  <circle cx="160" cy="46" r="20" fill="#f0c850"/>
  <circle cx="160" cy="46" r="20" fill="none" stroke="#e7b53a" stroke-width="2"/>
  <path d="M156 66 Q152 58 155 51 Q160 46 165 51 Q168 58 164 66 Z" fill="#e7b53a" stroke="#9a6c10" stroke-width="0.6"/>
  <ellipse cx="160" cy="52" rx="3" ry="2.4" fill="#7a5410"/>
</svg>`;

window.AMENTI_SVG = F;
})();

}catch(e){console.error('codex script 1 error', e);}
})();


  /* put back anything that was there before, without disturbing what the
     block above decided. Order-independent now. */
  if (prior) {
    window.AMENTI_SVG = Object.assign({}, prior, window.AMENTI_SVG || {});
  }
})();
