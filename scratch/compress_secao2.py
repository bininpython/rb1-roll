import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // CONTINUAÇÃO: ROLOS 152 A 165"
end_marker = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // ====================================================================
  // CONTINUAÇÃO: ROLOS 152 A 172 (COMPRESSED TO FIT BEFORE LOOP)
  // ====================================================================
  
  let nx = sn2 + 40;

  // 4 Bottom Rollers (152-155)
  let rx1 = nx;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx1, YM + 6, 6, '', rx1, YM);
    rx1 += 14;
  }

  // Pinch (156, 157)
  let px2 = rx1 + 10;
  svg += rNrForno(px2, YM - 8, 8, '', px2, YM); // Top
  svg += rNrForno(px2, YM + 8, 8, '', px2, YM); // Bottom

  // Hydraulic Table (158, 159)
  let tb2X = px2 + 20;
  
  // Cylinder Support & Floor
  let cylX1 = tb2X + 25;
  let cylY1 = YM + 27;
  let cylX2 = tb2X - 25;
  let cylY2 = YM + 90;
  
  svg += `<line x1="${cylX1}" y1="${cylY1}" x2="${cylX2}" y2="${cylY2}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${cylX1 - 5}" y1="${cylY1 - 10}" x2="${cylX1}" y2="${cylY1}" stroke="#94a3b8" stroke-width="4"/>`;
  
  svg += `<line x1="${cylX2 - 20}" y1="${cylY2}" x2="${cylX2 + 20}" y2="${cylY2}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<5; i++) {
    let hx = (cylX2 - 15) + i*8;
    svg += `<line x1="${hx}" y1="${cylY2}" x2="${hx - 8}" y2="${cylY2 + 10}" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Table Box
  svg += `<rect x="${tb2X - 5}" y="${YM + 2}" width="60" height="25" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers 158 (large bottom), 159 (small bottom)
  svg += rNrForno(tb2X + 15, YM + 12, 12, '', tb2X + 15, YM); // 158
  svg += rNrForno(tb2X + 45, YM + 6, 6, '', tb2X + 45, YM); // 159

  // 4 Bottom Rollers (160-163)
  let rx2 = tb2X + 70;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx2, YM + 6, 6, '', rx2, YM);
    rx2 += 14;
  }

  // Top Block (Thickness gauge / Wiper)
  let wblockX = rx2 + 15;
  svg += `<rect x="${wblockX}" y="${YM - 12}" width="35" height="12" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Large Deflector Pinch (164, 165)
  let dfX = wblockX + 50;
  svg += rNrForno(dfX, YM - 10, 10, '', dfX, YM); // 164 (Top)
  svg += rNrForno(dfX, YM + 25, 25, '', dfX, YM); // 165 (Bottom, very large)

  // ====================================================================
  // CONTINUAÇÃO: ROLOS 166 A 172 (Tanque, Secador, Corretor)
  // ====================================================================
  
  let tankStart = dfX + 50;
  let tankW = 140;
  let tankH = 60; // 30 up, 30 down from YM

  // Tank brackets `[` and `]`
  // Left bracket
  svg += `<polyline points="${tankStart+15},${YM-tankH/2} ${tankStart},${YM-tankH/2} ${tankStart},${YM+tankH/2} ${tankStart+15},${YM+tankH/2}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Right bracket
  svg += `<polyline points="${tankStart+tankW-15},${YM-tankH/2} ${tankStart+tankW},${YM-tankH/2} ${tankStart+tankW},${YM+tankH/2} ${tankStart+tankW-15},${YM+tankH/2}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Roller 166 (bottom) inside tank
  let r166X = tankStart + 40;
  svg += rNrForno(r166X, YM + 15, 15, '', r166X, YM);

  // SECADOR
  let secX = tankStart + tankW + 30;
  
  // Text "SECADOR"
  svg += `<text x="${secX + 25}" y="${YM - 60}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // Pinch left (167, 169)
  svg += rNrForno(secX, YM - 8, 8, '', secX, YM); // 167 Top
  svg += rNrForno(secX, YM + 8, 8, '', secX, YM); // 169 Bottom
  
  // V-Shapes (Chevrons) - Air Nozzles
  let chevronCenter = secX + 25;
  
  // Top Nozzles (pointing DOWN)
  svg += `<polyline points="${chevronCenter - 15},${YM - 35} ${chevronCenter},${YM - 15} ${chevronCenter + 15},${YM - 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM - 50} ${chevronCenter},${YM - 30} ${chevronCenter + 15},${YM - 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Bottom Nozzles (pointing UP)
  svg += `<polyline points="${chevronCenter - 15},${YM + 35} ${chevronCenter},${YM + 15} ${chevronCenter + 15},${YM + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM + 50} ${chevronCenter},${YM + 30} ${chevronCenter + 15},${YM + 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Vertical center line (dashed)
  svg += `<line x1="${chevronCenter}" y1="${YM - 65}" x2="${chevronCenter}" y2="${YM + 65}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  
  // Pinch right (168, 170)
  let secRx = secX + 50;
  svg += rNrForno(secRx, YM - 8, 8, '', secRx, YM); // 168 Top
  svg += rNrForno(secRx, YM + 8, 8, '', secRx, YM); // 170 Bottom

  // Roller 171
  let r171X = secRx + 40;
  svg += rNrForno(r171X, YM + 8, 8, '', r171X, YM);

  // CORRETOR 1 (172)
  let corrX = r171X + 50;
  let corrY = YM - 25; // Top roller
  
  // Quadrant Pattern
  svg += `<circle cx="${corrX}" cy="${corrY}" r="25" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
  // Quadrant top-right (0 to 90)
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY - 25} A 25 25 0 0 1 ${corrX + 25} ${corrY} Z" fill="#4ade80"/>`;
  // Quadrant bottom-left (180 to 270)
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY + 25} A 25 25 0 0 1 ${corrX - 25} ${corrY} Z" fill="#4ade80"/>`;
  
  // Center dot
  svg += `<circle cx="${corrX}" cy="${corrY}" r="2" fill="#ffffff"/>`;

  // Text CORRETOR 1 below
  svg += `<text x="${corrX}" y="${YM + 35}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 1</text>`;

  // Extend strip path to touch CORRETOR 1 and slant upwards towards Loop
  lineTo(corrX, YM);
  // Slant upwards to touch the entrance bridle of the next section cleanly
  lineTo(corrX + 80, YM - 25);

"""
    
    text = part1 + start_marker + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Block compressed successfully!")
else:
    print("Markers not found")
