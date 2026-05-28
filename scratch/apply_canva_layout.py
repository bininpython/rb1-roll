import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# We need to replace the entire SEÇÃO 2 block and restore the Mergulhador.
# But wait, in the last script I already removed Mergulhador. Let's see if it's there.
# I will replace from `// Merge Bridle` to `// SEÇÃO 3`

start_str = "  // Merge Bridle"
end_str = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_str in text and end_str in text:
    part1 = text.split(start_str)[0]
    part2 = text.split(end_str)[1]

    new_block = """  // Merge Bridle (Restored Mergulhador)
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += dot(1350, Y2+15, 15);

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(pX, Y1); 
  stripPath += `A 30 30 0 0 1 1113.11 180.87 `; 
  lineTo(1326.89, 439.13); 
  stripPath += `A 30 30 0 0 0 1350 450 `;

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 1350 ${Y2} `; 
  svg += `<path d="${p2}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>`;
  svg += `<path d="${p2}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;

  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)
  // ====================================================================
  
  // Removed 84 and 85 entirely per Canva image

  // 126 to 132 (Only bottom rollers: 127, 129, 131)
  let ax = 1510;
  // Based on the previous spacing, 127 is the second position, 129 is fourth, 131 is sixth.
  // Wait, let's just place them directly to match the image visually.
  // We'll use the exact positions but only draw the bottom ones.
  let s_alt = [126, 127, 128, 129, 130, 131, 132];
  for(let i=0; i<7; i++) {
    let isTop = (i % 2 === 0);
    if (!isTop) {
      let cy = YM + 6;
      let ny = cy + 22;
      svg += rNrForno(ax, cy, 6, s_alt[i].toString(), ax, ny);
    }
    ax += 16;
  }

  // Hydraulic Table (133, 134, 135) - NO NUMBERS
  let tbX = ax + 10;
  
  // Hydraulic Cylinder Support
  svg += `<line x1="${tbX + 30}" y1="${YM + 25}" x2="${tbX - 10}" y2="${YM + 100}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${tbX + 40}" y1="${YM + 5}" x2="${tbX + 30}" y2="${YM + 25}" stroke="#94a3b8" stroke-width="4"/>`;
  
  // Floor mount with hatching
  svg += `<line x1="${tbX - 30}" y1="${YM + 100}" x2="${tbX + 10}" y2="${YM + 100}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<6; i++) {
    let hx = (tbX - 25) + i*6;
    svg += `<line x1="${hx}" y1="${YM + 100}" x2="${hx - 8}" y2="${YM + 110}" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Table Box (Snug fit)
  svg += `<rect x="${tbX - 5}" y="${YM + 2}" width="95" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers on table (Bottom rollers, NO LABELS)
  // We can pass empty strings to rNrForno to not draw labels, but wait!
  // rNrForno draws the text. If we pass empty string, it draws an empty string. That works!
  svg += rNrForno(tbX + 15, YM + 10, 10, '', tbX + 15, YM - 15);
  svg += rNrForno(tbX + 45, YM + 6, 6, '', tbX + 45, YM - 15);
  svg += rNrForno(tbX + 75, YM + 6, 6, '', tbX + 75, YM - 15);

  // 136 to 145 (Only bottom rollers: 137, 139, 141, 143, 145)
  let bx = tbX + 105;
  let s_alt2 = [136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
  for(let i=0; i<10; i++) {
    let isTop = (i % 2 === 0);
    if (!isTop) {
      let cy = YM + 6;
      let ny = cy + 22;
      svg += rNrForno(bx, cy, 6, s_alt2[i].toString(), bx, ny);
    }
    bx += 16;
  }

  // MÁQUINA DE SOLDA 1 Text (Moved to above 146)
  let sn1 = bx + 25;
  svg += `<text x="${sn1 + 30}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">MÁQUINA DE SOLDA 1</text>`;

  // 146 Sensor (Top)
  svg += `<rect x="${sn1 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn1}" y1="${YM - 25}" x2="${sn1}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;
  svg += `<text x="${sn1}" y="${YM - 45}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">146</text>`;

  // Cross Mark / Centering
  let cx = sn1 + 45;
  svg += `<line x1="${cx - 10}" y1="${YM - 20}" x2="${cx + 10}" y2="${YM - 20}" stroke="#22c55e" stroke-width="2"/>`; 
  svg += `<line x1="${cx}" y1="${YM - 30}" x2="${cx}" y2="${YM - 10}" stroke="#22c55e" stroke-width="1.5"/>`;

  // 147, 148 (Bottom)
  let rx = cx + 35;
  svg += rNrForno(rx, YM + 8, 8, '147', rx, YM + 30);
  svg += rNrForno(rx + 25, YM + 8, 8, '148', rx + 25, YM + 30);

  // 149, 150 (Pinch)
  let px = rx + 45;
  svg += rNrForno(px, YM - 8, 8, '149', px, YM - 25);
  svg += rNrForno(px, YM + 12, 12, '150', px, YM + 40);

  // 151 Sensor & Scrap Bucket
  let sn2 = px + 45;
  svg += `<rect x="${sn2 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn2}" y1="${YM - 25}" x2="${sn2}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;
  svg += `<text x="${sn2}" y="${YM - 45}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">151</text>`;
  
  // Dotted drop line
  svg += `<line x1="${sn2}" y1="${YM + 15}" x2="${sn2}" y2="${YM + 80}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>`; 

  // Bucket (Trapezoid)
  let bkY = YM + 80;
  svg += `<polygon points="${sn2 - 40},${bkY} ${sn2 + 40},${bkY} ${sn2 + 25},${bkY + 35} ${sn2 - 25},${bkY + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Re-sync lineTo position
  lineTo(sn2 + 60, YM);
"""
    
    # We must ensure we remove up to the correct point.
    text = part1 + start_str + new_block + end_str + part2
    
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Secao 2 updated to match Canva image exactly!")
else:
    print("Could not find the markers to replace the text!")
