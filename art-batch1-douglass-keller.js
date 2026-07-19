/* ===========================================================================
   AMENTI · CHARACTER ART — batch 1 of 6
   FREDERICK DOUGLASS  ·  HELEN KELLER
   ---------------------------------------------------------------------------
   WHERE THIS GOES — in Page1.html:

     Search for:   F['akhenaten'] = () =>

     Scroll to the END of that portrait — the line reading  `;
     Paste this whole file on the blank line just AFTER it, still inside the
     same script block (before  window.AMENTI_SVG = F;  if that is nearby).

   HOUSE STYLE, followed exactly:
     · viewBox 0 0 320 560, class="char-art"
     · ${defs(prefix, glowColour, bgColour)} then the background ellipse
     · head centred at (160,116) rx 29 ry 33 · neck rect x150 y142 w20 h26
     · layers back to front: hair mass -> neck -> head -> hair -> features
       -> garment -> props -> ground glow
     · accent colours taken from each codex record, not invented

   ON DRAWING DOUGLASS
     He was the most photographed American of the nineteenth century, and he
     chose it deliberately — sitting for portraits so the country could not
     picture an enslaved man as anything less than a man. Every image was an
     argument. So this one is drawn upright, formal, and unsmiling, which is
     how he sat: the frock coat, the high collar, the leonine hair. The pen is
     his, not a prop — the Narrative and the North Star.

   ON DRAWING KELLER
     The temptation is the pump, and the pump is the trap: it fixes her at
     seven years old, which is precisely the erasure her own quiz argues about.
     So she is drawn as an adult — the writer, hand raised mid-sign, water
     falling behind her rather than beneath her. The droplet is a memory in
     the background, not the subject.
   =========================================================================== */

// ────────────────────────────────────────────────────────────────────
// FREDERICK DOUGLASS
F['frederick-douglass'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('fd','#3f6db0','#101c33')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#fd-bg)"/>

  <!-- BACK HAIR MASS — the famous leonine sweep, wider than the head -->
  <path d="M124 118 Q112 86 130 66 Q124 96 130 122 Q120 142 126 162 Q116 140 124 118 Z" fill="#2b2723"/>
  <path d="M196 118 Q208 86 190 66 Q196 96 190 122 Q200 142 194 162 Q204 140 196 118 Z" fill="#2b2723"/>
  <path d="M118 108 Q116 74 142 60 Q160 52 178 60 Q204 74 202 108 Q196 84 178 74 Q160 66 142 74 Q124 84 118 108 Z" fill="#332e29"/>

  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#fd-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#fd-skin)"/>

  <!-- HAIR — high, swept back and up; grey at the temples -->
  <path d="M131 102 Q130 76 160 70 Q190 76 189 102 Q184 86 174 82 Q176 76 164 78 Q168 72 160 74 Q152 72 156 78 Q144 76 146 82 Q136 86 131 102 Z" fill="#3a342e"/>
  <path d="M129 104 Q126 78 140 66 Q132 90 136 118 Q130 112 129 104 Z" fill="#2f2a25"/>
  <path d="M191 104 Q194 78 180 66 Q188 90 184 118 Q190 112 191 104 Z" fill="#2f2a25"/>
  <circle cx="136" cy="92" r="5.2" fill="#4a423a"/><circle cx="148" cy="80" r="4.8" fill="#554b42"/>
  <circle cx="172" cy="80" r="4.8" fill="#554b42"/><circle cx="184" cy="92" r="5.2" fill="#4a423a"/>
  <!-- grey at the temple — he was fifty before the country listened -->
  <path d="M132 96 Q136 88 142 86" stroke="#8d8177" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
  <path d="M188 96 Q184 88 178 86" stroke="#8d8177" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>

  <!-- BROWS · EYES · NOSE — level gaze, no softening -->
  <path d="M141 108 Q150 103 157 108" stroke="#241f1b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M163 108 Q170 103 179 108" stroke="#241f1b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="118" rx="4.9" ry="3.3" fill="#f2ece0" opacity=".93"/>
  <ellipse cx="171" cy="118" rx="4.9" ry="3.3" fill="#f2ece0" opacity=".93"/>
  <circle cx="150" cy="119" r="2.3" fill="#2a2118"/><circle cx="170" cy="119" r="2.3" fill="#2a2118"/>
  <path d="M159 122 Q156 133 153 141 Q160 145 167 141 Q164 133 161 122" fill="#7a5236" opacity=".45"/>

  <!-- BEARD — short, following the jaw -->
  <path d="M137 138 Q135 164 152 180 Q160 188 168 180 Q185 164 183 138 Q175 156 160 158 Q145 156 137 138 Z" fill="#3a342e"/>
  <circle cx="144" cy="151" r="4.2" fill="#332e29"/><circle cx="153" cy="163" r="4.4" fill="#443c35"/>
  <circle cx="160" cy="168" r="4.6" fill="#3d372f"/><circle cx="167" cy="163" r="4.4" fill="#443c35"/>
  <circle cx="176" cy="151" r="4.2" fill="#332e29"/>
  <path d="M150 143 Q160 147 170 143" stroke="#241f1b" stroke-width="1.6" fill="none" opacity=".5"/>

  <!-- COLLAR + CRAVAT — he dressed for the argument -->
  <path d="M146 168 L160 186 L174 168 L182 176 L160 196 L138 176 Z" fill="#f4f1ea"/>
  <path d="M152 182 Q160 196 168 182 Q160 214 152 182 Z" fill="#1d3a66"/>
  <path d="M156 190 Q160 198 164 190" stroke="#2d5490" stroke-width="1.2" fill="none"/>

  <!-- FROCK COAT — long, formal, deliberately unremarkable -->
  <path d="M160 186 Q120 196 108 234 L98 420 Q100 470 112 492 L208 492 Q220 470 222 420 L212 234 Q200 196 160 186 Z" fill="#22283a"/>
  <path d="M160 186 L160 492" stroke="#161b28" stroke-width="1.6"/>
  <path d="M143 194 Q132 244 130 330 Q129 420 134 486" stroke="#1a2030" stroke-width="1.4" fill="none"/>
  <path d="M177 194 Q188 244 190 330 Q191 420 186 486" stroke="#1a2030" stroke-width="1.4" fill="none"/>
  <!-- lapels -->
  <path d="M160 188 Q140 202 134 240 Q148 224 160 206 Z" fill="#2b3248"/>
  <path d="M160 188 Q180 202 186 240 Q172 224 160 206 Z" fill="#2b3248"/>
  <circle cx="160" cy="286" r="2.6" fill="#3f6db0" opacity=".8"/>
  <circle cx="160" cy="330" r="2.6" fill="#3f6db0" opacity=".8"/>
  <circle cx="160" cy="374" r="2.6" fill="#3f6db0" opacity=".8"/>

  <!-- HANDS + THE PEN — the Narrative, the North Star -->
  <ellipse cx="112" cy="356" rx="11" ry="14" fill="url(#fd-skin)" transform="rotate(-8 112 356)"/>
  <ellipse cx="208" cy="356" rx="11" ry="14" fill="url(#fd-skin)" transform="rotate(8 208 356)"/>
  <path d="M204 342 L232 296" stroke="#e8dfcb" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M232 296 Q244 276 238 262 Q230 276 226 292 Z" fill="#f0e8d6" opacity=".95"/>
  <path d="M204 342 L210 352" stroke="#2a2118" stroke-width="2.4" stroke-linecap="round"/>
  <!-- a page, held not brandished -->
  <path d="M96 342 L128 336 L132 384 L100 390 Z" fill="#efe9db" opacity=".92"/>
  <path d="M102 352 L124 348 M102 360 L126 356 M102 368 L120 364"
        stroke="#8d8177" stroke-width="1.1" opacity=".7"/>

  <!-- the word carrying — faint, behind him -->
  <path d="M236 210 Q262 196 276 208" stroke="#3f6db0" stroke-width="1.2" fill="none" opacity=".35"/>
  <path d="M240 226 Q268 212 284 226" stroke="#3f6db0" stroke-width="1" fill="none" opacity=".25"/>

  <ellipse cx="160" cy="548" rx="96" ry="14" fill="#3f6db0" opacity=".38"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// HELEN KELLER
F['helen-keller'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('hk','#3fa9c8','#0f2a34')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#hk-bg)"/>

  <!-- WATER, BEHIND HER — the pump is memory, not subject -->
  <path d="M244 120 Q250 158 244 190 Q238 158 244 120 Z" fill="#3fa9c8" opacity=".22"/>
  <circle cx="244" cy="204" r="5" fill="#3fa9c8" opacity=".30"/>
  <circle cx="252" cy="232" r="3.4" fill="#3fa9c8" opacity=".22"/>
  <circle cx="238" cy="252" r="2.6" fill="#3fa9c8" opacity=".16"/>
  <ellipse cx="244" cy="268" rx="16" ry="3" fill="#3fa9c8" opacity=".13"/>

  <!-- BACK HAIR — swept up, as she wore it -->
  <path d="M128 116 Q118 88 134 70 Q128 98 134 122 Q124 140 130 158 Q120 138 128 116 Z" fill="#5a4632"/>
  <path d="M192 116 Q202 88 186 70 Q192 98 186 122 Q196 140 190 158 Q200 138 192 116 Z" fill="#5a4632"/>
  <ellipse cx="160" cy="74" rx="24" ry="14" fill="#6b5339"/>

  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#hk-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#hk-skin)"/>

  <!-- HAIR — parted, drawn back into the knot above -->
  <path d="M132 102 Q133 78 160 72 Q187 78 188 102 Q182 86 160 82 Q138 86 132 102 Z" fill="#6b5339"/>
  <path d="M160 74 Q150 84 140 92" stroke="#5a4632" stroke-width="1.6" fill="none" opacity=".7"/>
  <path d="M160 74 Q170 84 180 92" stroke="#5a4632" stroke-width="1.6" fill="none" opacity=".7"/>
  <path d="M130 106 Q127 84 138 72 Q132 94 136 120 Q131 114 130 106 Z" fill="#5f4a35"/>
  <path d="M190 106 Q193 84 182 72 Q188 94 184 120 Q189 114 190 106 Z" fill="#5f4a35"/>

  <!-- BROWS · EYES — closed, drawn softly. She is not looking; she is listening. -->
  <path d="M142 107 Q150 103 157 107" stroke="#4a3826" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M163 107 Q170 103 178 107" stroke="#4a3826" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M143 118 Q150 122 157 118" stroke="#5a4632" stroke-width="1.9" fill="none" stroke-linecap="round"/>
  <path d="M163 118 Q170 122 177 118" stroke="#5a4632" stroke-width="1.9" fill="none" stroke-linecap="round"/>
  <path d="M144 121 Q150 124 156 121" stroke="#b58e6a" stroke-width=".9" fill="none" opacity=".5"/>
  <path d="M164 121 Q170 124 176 121" stroke="#b58e6a" stroke-width=".9" fill="none" opacity=".5"/>
  <path d="M159 122 Q157 132 155 139 Q160 142 165 139 Q163 132 161 122" fill="#9c6f4c" opacity=".42"/>
  <path d="M152 150 Q160 154 168 150" stroke="#a8724f" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>

  <!-- HIGH COLLAR — period dress, plain -->
  <path d="M144 168 Q160 178 176 168 L182 182 Q160 194 138 182 Z" fill="#efe9dd"/>
  <path d="M154 176 Q160 184 166 176" stroke="#cfc7b8" stroke-width="1.2" fill="none"/>

  <!-- DRESS — long, dark, unfussy -->
  <path d="M160 184 Q124 194 114 232 L104 424 Q106 472 118 494 L202 494 Q214 472 216 424 L206 232 Q196 194 160 184 Z" fill="#243c46"/>
  <path d="M160 184 L160 494" stroke="#1a2c34" stroke-width="1.4"/>
  <path d="M138 200 Q128 260 126 340 Q125 424 131 488" stroke="#1d323b" stroke-width="1.3" fill="none"/>
  <path d="M182 200 Q192 260 194 340 Q195 424 189 488" stroke="#1d323b" stroke-width="1.3" fill="none"/>
  <path d="M116 300 Q160 310 204 300" stroke="#2c4854" stroke-width="1.6" fill="none" opacity=".8"/>

  <!-- THE HAND, RAISED AND SPEAKING — the manual alphabet, mid-letter -->
  <ellipse cx="214" cy="292" rx="12" ry="15" fill="url(#hk-skin)" transform="rotate(14 214 292)"/>
  <path d="M212 280 L210 258" stroke="#d8a880" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M219 281 L221 261" stroke="#d8a880" stroke-width="4.4" stroke-linecap="round"/>
  <path d="M225 285 L231 270" stroke="#d8a880" stroke-width="4" stroke-linecap="round"/>
  <path d="M205 288 Q198 280 202 274" stroke="#d8a880" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- the letter leaving the hand -->
  <circle cx="232" cy="250" r="2.6" fill="#3fa9c8" opacity=".6"/>
  <circle cx="243" cy="236" r="2" fill="#3fa9c8" opacity=".42"/>
  <circle cx="252" cy="224" r="1.5" fill="#3fa9c8" opacity=".28"/>

  <!-- THE OTHER HAND ON A PAGE — she wrote for sixty years -->
  <ellipse cx="108" cy="352" rx="11" ry="14" fill="url(#hk-skin)" transform="rotate(-10 108 352)"/>
  <path d="M92 336 L126 330 L130 380 L96 386 Z" fill="#efe9db" opacity=".9"/>
  <!-- braille, not decoration: six dots, a real cell -->
  <circle cx="103" cy="345" r="1.9" fill="#6b6255"/><circle cx="112" cy="345" r="1.9" fill="#6b6255"/>
  <circle cx="103" cy="354" r="1.9" fill="#6b6255"/><circle cx="112" cy="354" r="1.9" fill="#6b6255"/>
  <circle cx="103" cy="363" r="1.9" fill="#6b6255"/><circle cx="112" cy="363" r="1.9" fill="#6b6255"/>
  <circle cx="120" cy="345" r="1.9" fill="#6b6255"/><circle cx="120" cy="363" r="1.9" fill="#6b6255"/>

  <ellipse cx="160" cy="550" rx="92" ry="14" fill="#3fa9c8" opacity=".36"/>
</svg>`;
