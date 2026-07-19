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

/* ===========================================================================
   AMENTI · CHARACTER ART — batch 3
   GILGAMESH  ·  KING ARTHUR  ·  LYCURGUS OF SPARTA
   ---------------------------------------------------------------------------
   WHERE THIS GOES — in Page1.html:
     Paste immediately after the closing  `;  of batch 2 (the Odysseus
     portrait). Same script block.

   HOUSE STYLE: viewBox 0 0 320 560 · class="char-art" · ${defs(prefix,glow,bg)}
   bg ellipse 160,340 · head 160,116 rx29 ry33 · neck x150 y142 w20 h26
   ground glow at the foot · accents taken from each codex record.

   WHAT EACH ONE IS DRAWN AS
     GILGAMESH  96 combat, 66 foresight — the highest fighter in the set and
       one of the lowest for seeing ahead. So: enormous, armoured, and standing
       in front of the wall. The epic offers the wall as his true monument, not
       his strength. He is drawn with his back to the thing that outlived him.
     ARTHUR     93 charisma. Drawn as the ideal rather than the man, because
       that is what survived — the sword held point-down like a cross, and
       behind him the table with no head, seen edge-on so no seat leads.
     LYCURGUS   A lawgiver, not a soldier. He carries the rhetra, not a spear.
       The shield is at his feet, and the iron spits are on his belt — money
       too heavy to hoard, which was the point. The helots are the shadow the
       drawing does not pretend away.
   =========================================================================== */

// ────────────────────────────────────────────────────────────────────
// GILGAMESH — two parts god, and the wall behind him
F['gilgamesh'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('gm','#c8901f','#33230a')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#gm-bg)"/>

  <!-- THE WALLS OF URUK — behind him, and they are the monument -->
  <path d="M14 560 L14 300 L44 300 L44 286 L66 286 L66 300 L96 300 L96 286 L118 286 L118 300 L142 300 L142 560 Z" fill="#3a2f1c" opacity=".85"/>
  <path d="M306 560 L306 300 L276 300 L276 286 L254 286 L254 300 L224 300 L224 286 L202 286 L202 300 L178 300 L178 560 Z" fill="#3a2f1c" opacity=".85"/>
  <path d="M20 330 L136 330 M20 366 L136 366 M20 402 L136 402" stroke="#2c2415" stroke-width="1.4" opacity=".7"/>
  <path d="M184 330 L300 330 M184 366 L300 366 M184 402 L300 402" stroke="#2c2415" stroke-width="1.4" opacity=".7"/>

  <!-- BACK HAIR — heavy, squared, Mesopotamian -->
  <path d="M124 118 Q112 84 132 62 Q124 96 132 126 Q118 150 126 176 Q108 146 124 118 Z" fill="#241a10"/>
  <path d="M196 118 Q208 84 188 62 Q196 96 188 126 Q202 150 194 176 Q212 146 196 118 Z" fill="#241a10"/>

  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#gm-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#gm-skin)"/>

  <!-- HAIR + FILLET — a king, but no crown; he is two parts god already -->
  <path d="M129 100 Q130 72 160 66 Q190 72 191 100 Q184 80 160 76 Q136 80 129 100 Z" fill="#2e2114"/>
  <path d="M130 86 Q160 74 190 86" stroke="#c8901f" stroke-width="3" fill="none"/>
  <circle cx="160" cy="78" r="3.4" fill="#c8901f"/>
  <path d="M127 106 Q123 78 138 64 Q129 92 133 124 Q128 114 127 106 Z" fill="#241a10"/>
  <path d="M193 106 Q197 78 182 64 Q191 92 187 124 Q192 114 193 106 Z" fill="#241a10"/>

  <!-- BROWS · EYES — heavy, unafraid, not clever -->
  <path d="M139 108 Q149 102 158 108" stroke="#1c140c" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M162 108 Q171 102 181 108" stroke="#1c140c" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="119" rx="4.8" ry="3.2" fill="#f6ecd6" opacity=".92"/>
  <ellipse cx="171" cy="119" rx="4.8" ry="3.2" fill="#f6ecd6" opacity=".92"/>
  <circle cx="150" cy="120" r="2.3" fill="#2a2118"/><circle cx="170" cy="120" r="2.3" fill="#2a2118"/>
  <path d="M159 122 Q157 133 154 140 Q160 144 166 140 Q163 133 161 122" fill="#8a5a34" opacity=".45"/>
  <!-- BEARD — the long squared Sumerian beard, tiered -->
  <path d="M134 138 Q132 176 152 196 Q160 204 168 196 Q188 176 186 138 Q176 160 160 162 Q144 160 134 138 Z" fill="#2e2114"/>
  <path d="M138 152 Q160 160 182 152" stroke="#1c140c" stroke-width="1.6" fill="none" opacity=".8"/>
  <path d="M141 166 Q160 174 179 166" stroke="#1c140c" stroke-width="1.6" fill="none" opacity=".8"/>
  <path d="M146 180 Q160 188 174 180" stroke="#1c140c" stroke-width="1.6" fill="none" opacity=".8"/>

  <!-- BODY — enormous. 96 combat should be visible before you read a number. -->
  <path d="M160 194 Q112 208 100 250 L92 424 Q98 474 114 496 L206 496 Q222 474 228 424 L220 250 Q208 208 160 194 Z" fill="#7a5a30"/>
  <!-- fleece/kaunakes tiers -->
  <path d="M96 286 Q160 300 224 286" stroke="#5e4524" stroke-width="6" fill="none"/>
  <path d="M94 332 Q160 346 226 332" stroke="#5e4524" stroke-width="6" fill="none"/>
  <path d="M93 378 Q160 392 227 378" stroke="#5e4524" stroke-width="6" fill="none"/>
  <path d="M93 424 Q160 438 227 424" stroke="#5e4524" stroke-width="6" fill="none"/>
  <!-- bare shoulder + chest -->
  <path d="M160 194 Q130 206 122 238 L128 268 Q142 232 160 224 Z" fill="url(#gm-skin)"/>
  <path d="M160 224 L160 194" stroke="#8a6242" stroke-width="1.2" opacity=".4"/>
  <!-- ARMS — thick -->
  <path d="M112 236 L92 320" stroke="#9c6f4c" stroke-width="20" stroke-linecap="round"/>
  <path d="M208 236 L228 320" stroke="#9c6f4c" stroke-width="20" stroke-linecap="round"/>
  <ellipse cx="90" cy="334" rx="12" ry="15" fill="url(#gm-skin)"/>
  <ellipse cx="230" cy="334" rx="12" ry="15" fill="url(#gm-skin)"/>

  <!-- LEGS -->
  <path d="M132 496 L126 532 L154 532 L156 496 Z" fill="url(#gm-skin)"/>
  <path d="M188 496 L194 532 L166 532 L164 496 Z" fill="url(#gm-skin)"/>

  <!-- ARMBANDS -->
  <path d="M100 292 L112 288" stroke="#c8901f" stroke-width="4" stroke-linecap="round"/>
  <path d="M220 292 L208 288" stroke="#c8901f" stroke-width="4" stroke-linecap="round"/>

  <ellipse cx="160" cy="550" rx="104" ry="15" fill="#c8901f" opacity=".34"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// KING ARTHUR — the ideal, not the man
F['king-arthur'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('ka','#3f7fd0','#0e1c36')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#ka-bg)"/>

  <!-- THE ROUND TABLE — edge-on, so no seat is at its head -->
  <ellipse cx="160" cy="470" rx="132" ry="26" fill="none" stroke="#3f7fd0" stroke-width="2" opacity=".35"/>
  <ellipse cx="160" cy="470" rx="104" ry="20" fill="none" stroke="#3f7fd0" stroke-width="1.2" opacity=".22"/>
  <circle cx="46" cy="470" r="3" fill="#3f7fd0" opacity=".4"/><circle cx="274" cy="470" r="3" fill="#3f7fd0" opacity=".4"/>
  <circle cx="86" cy="486" r="3" fill="#3f7fd0" opacity=".35"/><circle cx="234" cy="486" r="3" fill="#3f7fd0" opacity=".35"/>
  <circle cx="86" cy="454" r="3" fill="#3f7fd0" opacity=".28"/><circle cx="234" cy="454" r="3" fill="#3f7fd0" opacity=".28"/>

  <!-- BACK HAIR -->
  <path d="M128 118 Q114 88 132 66 Q124 98 132 124 Q120 146 128 168 Q112 142 128 118 Z" fill="#4a3a24"/>
  <path d="M192 118 Q206 88 188 66 Q196 98 188 124 Q200 146 192 168 Q208 142 192 118 Z" fill="#4a3a24"/>

  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#ka-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#ka-skin)"/>

  <!-- HAIR + a plain circlet. No jewelled crown — the point was the table. -->
  <path d="M130 100 Q131 74 160 68 Q189 74 190 100 Q182 82 160 78 Q138 82 130 100 Z" fill="#5c4a2e"/>
  <path d="M130 88 Q160 78 190 88" stroke="#c8b06a" stroke-width="3.4" fill="none"/>
  <path d="M160 78 L156 70 L164 70 Z" fill="#c8b06a"/>
  <path d="M128 106 Q124 80 138 68 Q130 94 134 122 Q129 114 128 106 Z" fill="#4a3a24"/>
  <path d="M192 106 Q196 80 182 68 Q190 94 186 122 Q191 114 192 106 Z" fill="#4a3a24"/>

  <!-- BROWS · EYES — level, courteous even to enemies -->
  <path d="M141 107 Q149 102 157 107" stroke="#3a2c1a" stroke-width="2.3" fill="none" stroke-linecap="round"/>
  <path d="M163 107 Q171 102 179 107" stroke="#3a2c1a" stroke-width="2.3" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="118" rx="4.8" ry="3.2" fill="#eaf1fb" opacity=".93"/>
  <ellipse cx="171" cy="118" rx="4.8" ry="3.2" fill="#eaf1fb" opacity=".93"/>
  <circle cx="150" cy="119" r="2.2" fill="#3f7fd0"/><circle cx="170" cy="119" r="2.2" fill="#3f7fd0"/>
  <path d="M159 122 Q157 132 155 139 Q160 142 165 139 Q163 132 161 122" fill="#9c6f4c" opacity=".42"/>
  <path d="M151 150 Q160 153 169 150" stroke="#7a5a3a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <!-- SHORT BEARD -->
  <path d="M137 138 Q136 162 152 178 Q160 185 168 178 Q184 162 183 138 Q175 154 160 156 Q145 154 137 138 Z" fill="#5c4a2e"/>

  <!-- MAIL + SURCOAT -->
  <path d="M160 184 Q124 194 114 232 L106 420 Q112 466 126 486 L194 486 Q208 466 214 420 L206 232 Q196 194 160 184 Z" fill="#4a5262"/>
  <circle cx="132" cy="250" r="2" fill="#5c6474" opacity=".8"/><circle cx="146" cy="258" r="2" fill="#5c6474" opacity=".8"/>
  <circle cx="174" cy="258" r="2" fill="#5c6474" opacity=".8"/><circle cx="188" cy="250" r="2" fill="#5c6474" opacity=".8"/>
  <circle cx="132" cy="286" r="2" fill="#5c6474" opacity=".7"/><circle cx="188" cy="286" r="2" fill="#5c6474" opacity=".7"/>
  <!-- surcoat -->
  <path d="M160 190 Q136 200 130 234 L124 420 L196 420 L190 234 Q184 200 160 190 Z" fill="#e8e4dc"/>
  <path d="M160 214 L160 372 M132 292 L188 292" stroke="#b8322a" stroke-width="9"/>
  <!-- belt -->
  <path d="M124 372 L196 372" stroke="#6a4a2c" stroke-width="7"/>
  <rect x="152" y="367" width="16" height="12" rx="2" fill="#c8b06a"/>

  <!-- LEGS -->
  <path d="M132 486 L128 528 L152 528 L154 486 Z" fill="#4a5262"/>
  <path d="M188 486 L192 528 L168 528 L166 486 Z" fill="#4a5262"/>

  <!-- EXCALIBUR — held point-down, both hands. Not raised. -->
  <path d="M160 268 L160 468" stroke="#cdd6e2" stroke-width="7" stroke-linecap="round"/>
  <path d="M160 468 L154 486 L166 486 Z" fill="#cdd6e2"/>
  <path d="M132 268 L188 268" stroke="#c8b06a" stroke-width="7" stroke-linecap="round"/>
  <path d="M160 244 L160 268" stroke="#6a4a2c" stroke-width="8" stroke-linecap="round"/>
  <circle cx="160" cy="240" r="6" fill="#c8b06a"/>
  <circle cx="160" cy="240" r="2.4" fill="#3f7fd0"/>
  <ellipse cx="132" cy="286" rx="11" ry="14" fill="url(#ka-skin)"/>
  <ellipse cx="188" cy="286" rx="11" ry="14" fill="url(#ka-skin)"/>

  <ellipse cx="160" cy="548" rx="94" ry="14" fill="#3f7fd0" opacity=".34"/>
</svg>`;

// ────────────────────────────────────────────────────────────────────
// LYCURGUS OF SPARTA — the lawgiver, and the shadow under the law
F['lycurgus'] = () => `
<svg class="char-art" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  ${defs('ly','#b03030','#2e0e0e')}
  <ellipse cx="160" cy="340" rx="160" ry="240" fill="url(#ly-bg)"/>

  <!-- THE HELOTS — the order rested on them. The drawing does not pretend otherwise. -->
  <path d="M42 470 Q50 428 62 470 Z" fill="#1a1414" opacity=".55"/>
  <path d="M64 476 Q72 430 84 476 Z" fill="#1a1414" opacity=".45"/>
  <path d="M240 476 Q248 430 260 476 Z" fill="#1a1414" opacity=".45"/>
  <path d="M262 470 Q270 428 282 470 Z" fill="#1a1414" opacity=".55"/>

  <!-- BACK HAIR — long, as Spartans wore it -->
  <path d="M126 118 Q110 84 130 60 Q120 96 128 126 Q114 154 124 182 Q104 148 126 118 Z" fill="#5e5a52"/>
  <path d="M194 118 Q210 84 190 60 Q200 96 192 126 Q206 154 196 182 Q216 148 194 118 Z" fill="#5e5a52"/>

  <!-- NECK --><rect x="150" y="142" width="20" height="26" fill="url(#ly-skin)"/>
  <!-- HEAD --><ellipse cx="160" cy="116" rx="29" ry="33" fill="url(#ly-skin)"/>

  <!-- HAIR — grey, plain, no ornament of any kind -->
  <path d="M130 100 Q131 74 160 68 Q189 74 190 100 Q182 82 160 78 Q138 82 130 100 Z" fill="#6e6a60"/>
  <path d="M128 106 Q124 78 139 64 Q130 92 134 124 Q129 114 128 106 Z" fill="#5e5a52"/>
  <path d="M192 106 Q196 78 181 64 Q190 92 186 124 Q191 114 192 106 Z" fill="#5e5a52"/>

  <!-- BROWS · EYES — narrow. Spare to the point of severity. -->
  <path d="M140 108 Q149 104 157 108" stroke="#4a463e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M163 108 Q171 104 180 108" stroke="#4a463e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="149" cy="118" rx="4.7" ry="2.7" fill="#f0ece2" opacity=".9"/>
  <ellipse cx="171" cy="118" rx="4.7" ry="2.7" fill="#f0ece2" opacity=".9"/>
  <circle cx="150" cy="119" r="2.1" fill="#3a352c"/><circle cx="170" cy="119" r="2.1" fill="#3a352c"/>
  <path d="M159 122 Q157 132 155 139 Q160 142 165 139 Q163 132 161 122" fill="#9c6f4c" opacity=".42"/>
  <!-- a mouth that does not explain itself -->
  <path d="M150 151 L170 151" stroke="#7a4a2c" stroke-width="1.8" stroke-linecap="round"/>
  <!-- LONG BEARD -->
  <path d="M134 138 Q132 176 152 196 Q160 204 168 196 Q188 176 186 138 Q176 162 160 164 Q144 162 134 138 Z" fill="#6e6a60"/>
  <circle cx="144" cy="156" r="4.4" fill="#5e5a52"/><circle cx="153" cy="172" r="4.6" fill="#78736a"/>
  <circle cx="160" cy="182" r="4.8" fill="#68645b"/><circle cx="167" cy="172" r="4.6" fill="#78736a"/>
  <circle cx="176" cy="156" r="4.4" fill="#5e5a52"/>

  <!-- HIMATION — plain wool, undyed. Sparta forbade luxury. -->
  <path d="M160 194 Q124 206 114 244 L106 432 Q112 476 126 496 L194 496 Q208 476 214 432 L206 244 Q196 206 160 194 Z" fill="#8e2a26"/>
  <path d="M160 194 Q126 208 116 248 L110 436 L160 446 Z" fill="#a03330"/>
  <path d="M116 246 Q160 262 204 246" stroke="#6e1f1c" stroke-width="2.4" fill="none"/>
  <path d="M112 316 Q160 332 208 316" stroke="#6e1f1c" stroke-width="2" fill="none" opacity=".8"/>
  <path d="M110 388 Q160 404 210 388" stroke="#6e1f1c" stroke-width="2" fill="none" opacity=".7"/>
  <!-- fold over the shoulder -->
  <path d="M160 194 Q198 204 208 236 L212 300 Q200 254 184 218 Z" fill="#7a231f"/>

  <!-- LEGS -->
  <path d="M134 496 L128 530 L152 530 L154 496 Z" fill="url(#ly-skin)"/>
  <path d="M188 496 L194 530 L168 530 L166 496 Z" fill="url(#ly-skin)"/>

  <!-- THE RHETRA — he carries the law, not a spear -->
  <ellipse cx="212" cy="330" rx="11" ry="14" fill="url(#ly-skin)" transform="rotate(10 212 330)"/>
  <path d="M204 300 L232 296 L236 348 L208 352 Z" fill="#e4dcc8" opacity=".94"/>
  <path d="M210 310 L230 307 M210 318 L232 315 M210 326 L228 323 M210 334 L231 331"
        stroke="#8a7f68" stroke-width="1.1" opacity=".75"/>

  <!-- THE IRON SPITS — money too heavy to hoard, on the belt -->
  <path d="M118 372 L104 404 M126 374 L114 408 M134 376 L124 410"
        stroke="#5a5a5e" stroke-width="3" stroke-linecap="round"/>

  <!-- THE SHIELD — at his feet, not in his hand. He made the law, not the war. -->
  <ellipse cx="108" cy="470" rx="30" ry="34" fill="#7a2320" stroke="#c8901f" stroke-width="2.4"/>
  <path d="M96 452 L108 486 L120 452" stroke="#c8901f" stroke-width="3.4" fill="none" stroke-linecap="round"/>

  <ellipse cx="160" cy="550" rx="96" ry="14" fill="#b03030" opacity=".34"/>
</svg>`;
