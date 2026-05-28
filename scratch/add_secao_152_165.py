import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // Re-sync lineTo position\n  lineTo(sn2 + 60, YM);\n"
end_marker = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // Re-sync lineTo position
  lineTo(sn2 + 60, YM);

  // ====================================================================
  // CONTINUAÇÃO: ROLOS 152 A 165
  // ====================================================================
  
  let nx = sn2 + 80;

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
  let tb2X = px2 + 30;
  
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
  let rx2 = tb2X + 75;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx2, YM + 6, 6, '', rx2, YM);
    rx2 += 14;
  }

  // Top Block (Thickness gauge / Wiper)
  let wblockX = rx2 + 20;
  svg += `<rect x="${wblockX}" y="${YM - 12}" width="35" height="12" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Large Deflector Pinch (164, 165)
  let dfX = wblockX + 65;
  svg += rNrForno(dfX, YM - 10, 10, '', dfX, YM); // 164 (Top)
  svg += rNrForno(dfX, YM + 25, 25, '', dfX, YM); // 165 (Bottom, very large)

  // Extend strip path to the entrance of the loop
  lineTo(dfX + 80, YM);

"""
    
    text = part1 + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Rollers 152-165 added!")
else:
    print("Markers not found")
