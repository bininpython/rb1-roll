import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // Extend strip path to the entrance of the loop\n  lineTo(dfX + 80, YM);\n"
end_marker = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // Extend strip path to the entrance of the loop
  lineTo(dfX + 80, YM);

  // ====================================================================
  // CONTINUAÇÃO: ROLOS 166 A 172 (Tanque, Secador, Corretor)
  // ====================================================================
  
  let tankStart = dfX + 110;
  let tankW = 160;
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
  let secX = tankStart + tankW + 50;
  
  // Text "SECADOR"
  svg += `<text x="${secX + 30}" y="${YM - 60}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // Pinch left (167, 169)
  svg += rNrForno(secX, YM - 8, 8, '', secX, YM); // 167 Top
  svg += rNrForno(secX, YM + 8, 8, '', secX, YM); // 169 Bottom
  
  // V-Shapes (Chevrons) - Air Nozzles
  let chevronCenter = secX + 30;
  
  // Top Nozzles (pointing DOWN)
  svg += `<polyline points="${chevronCenter - 15},${YM - 35} ${chevronCenter},${YM - 15} ${chevronCenter + 15},${YM - 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM - 50} ${chevronCenter},${YM - 30} ${chevronCenter + 15},${YM - 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Bottom Nozzles (pointing UP)
  svg += `<polyline points="${chevronCenter - 15},${YM + 35} ${chevronCenter},${YM + 15} ${chevronCenter + 15},${YM + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM + 50} ${chevronCenter},${YM + 30} ${chevronCenter + 15},${YM + 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Vertical center line (dashed)
  svg += `<line x1="${chevronCenter}" y1="${YM - 65}" x2="${chevronCenter}" y2="${YM + 65}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  
  // Pinch right (168, 170)
  let secRx = secX + 60;
  svg += rNrForno(secRx, YM - 8, 8, '', secRx, YM); // 168 Top
  svg += rNrForno(secRx, YM + 8, 8, '', secRx, YM); // 170 Bottom

  // Roller 171
  let r171X = secRx + 60;
  svg += rNrForno(r171X, YM + 8, 8, '', r171X, YM);

  // CORRETOR 1 (172)
  let corrX = r171X + 70;
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

  // Extend strip path to touch CORRETOR 1 and slant upwards
  lineTo(corrX, YM);
  lineTo(corrX + 80, YM - 15);

"""
    
    text = part1 + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Rollers 166-172 added!")
else:
    print("Markers not found")
