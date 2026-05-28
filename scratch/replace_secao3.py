import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"
end_marker = "  // ====================================================================\n  // SEÇÃO 4: FORNO E RESFRIAMENTO"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // ====================================================================
  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)
  // ====================================================================

  // Grupo BS1 (Bridle de Entrada do Loop)
  let r173x = 2860, r173y = 350, rL = 30;
  let r176x = 2770, r176y = 250;
  
  svg += `<text x="2770" y="200" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS1</text>`;

  svg += rNrForno(r173x, r173y, rL, '', r173x, r173y); // 173
  svg += rNrForno(r176x, r176y, rL, '', r176x, r176y); // 176
  
  // Pinches 174, 175
  svg += rNrForno(r173x + 25, r173y + 25, 10, '', 0, 0); // 174
  svg += rNrForno(r176x - 25, r176y - 25, 10, '', 0, 0); // 175

  // S-Wrap Path for BS1
  lineTo(r173x, r173y + rL); // Bottom of 173
  stripPath += `A ${rL} ${rL} 0 0 0 ${r173x + rL} ${r173y} `; // Right of 173
  stripPath += `A ${rL} ${rL} 0 0 0 ${r173x} ${r173y - rL} `; // Top of 173
  
  lineTo(r176x + rL, r176y); // Right of 176
  stripPath += `A ${rL} ${rL} 0 0 0 ${r176x} ${r176y - rL} `; // Top of 176
  
  // 177, 178
  let r177x = 2860;
  svg += rNrForno(r177x, r176y - rL - 10, 10, '', 0, 0); // 177 (Top)
  
  let r178x = 2960;
  svg += rNrForno(r178x, r176y - rL + 10, 10, '', 0, 0); // 178 (Bottom)

  // Extend strip to Loop Entrada
  lineTo(3000, r176y - rL);

  // LOOP ENTRADA
  let txs = [3100, 3220, 3340]; // 179, 181, 183
  let bxs = [3160, 3280, 3400]; // 180, 182, 184
  let r185x = 3460;
  let TY = 250;
  let BY = 650;
  
  svg += `<text x="3280" y="150" font-family="Montserrat, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">LOOP ENTRADA</text>`;

  // Draw Pit lines
  svg += `<line x1="3050" y1="180" x2="3050" y2="720" stroke="#475569" stroke-width="4"/>`;
  svg += `<line x1="3050" y1="720" x2="3510" y2="720" stroke="#475569" stroke-width="4"/>`;
  svg += `<line x1="3510" y1="720" x2="3510" y2="180" stroke="#475569" stroke-width="4"/>`;

  for (let x of txs) {
    svg += rNrForno(x, TY, 30, '', x, TY);
  }
  for (let x of bxs) {
    svg += rNrForno(x, BY, 30, '', x, BY);
  }
  
  // Draw Corretor (185) at r185x, TY
  let corr2X = r185x, corr2Y = TY;
  svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="30" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
  svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y - 30} A 30 30 0 0 1 ${corr2X + 30} ${corr2Y} Z" fill="#4ade80"/>`;
  svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y + 30} A 30 30 0 0 1 ${corr2X - 30} ${corr2Y} Z" fill="#4ade80"/>`;
  svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="2" fill="#ffffff"/>`;
  svg += `<text x="${corr2X + 50}" y="${TY + 50}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 2</text>`;
  
  // Trace Loop Path
  // Incoming strip is at Y = TY - 30 = 220.
  lineTo(txs[0] - 30, TY - 30); // Reach 179
  
  for (let i = 0; i < 3; i++) {
    let topX = txs[i];
    let botX = bxs[i];
    
    // Strip wraps right side of Top roller
    stripPath += `A 30 30 0 0 1 ${topX + 30} ${TY} `;
    
    // Down to left side of Bottom roller
    lineTo(botX - 30, BY);
    
    // Strip wraps bottom side of Bottom roller
    stripPath += `A 30 30 0 0 0 ${botX + 30} ${BY} `;
    
    // Up to left side of next Top roller
    if (i < 2) {
      lineTo(txs[i+1] - 30, TY);
      stripPath += `A 30 30 0 0 1 ${txs[i+1]} ${TY - 30} `; // Top of next
    } else {
      lineTo(r185x - 30, TY);
      stripPath += `A 30 30 0 0 1 ${r185x} ${TY - 30} `; // Top of 185
    }
  }
  
  // After 185, strip exits horizontally and slants back to main level YM
  lineTo(r185x + 100, TY - 30);
  lineTo(3860, YM);

"""
    
    text = part1 + start_marker + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("SECAO 3 replaced successfully!")
else:
    print("Markers not found")
