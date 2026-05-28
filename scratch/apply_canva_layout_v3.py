import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_str = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)\n  // ===================================================================="
end_str = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_str in text and end_str in text:
    part1 = text.split(start_str)[0]
    part2 = text.split(end_str)[1]

    new_secao2 = """  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)
  // ====================================================================
  
  // 1. Group 1: 7 Rollers ALL BOTTOM, NO LABELS
  let ax = 1510;
  for(let i=0; i<7; i++) {
    // cy = YM + 6 (bottom rollers)
    svg += rNrForno(ax, YM + 6, 6, '', ax, YM + 22);
    ax += 14; // Tight spacing
  }

  // 2. Hydraulic Table: 3 Rollers ALL BOTTOM, NO LABELS
  let tbX = ax + 15;
  
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
  // First one is slightly larger
  svg += rNrForno(tbX + 15, YM + 10, 10, '', tbX + 15, YM - 15);
  svg += rNrForno(tbX + 45, YM + 6, 6, '', tbX + 45, YM - 15);
  svg += rNrForno(tbX + 75, YM + 6, 6, '', tbX + 75, YM - 15);

  // 3. Group 2: 10 Rollers ALL BOTTOM, NO LABELS
  let bx = tbX + 105;
  for(let i=0; i<10; i++) {
    svg += rNrForno(bx, YM + 6, 6, '', bx, YM + 22);
    bx += 14; // Tight spacing
  }

  // MÁQUINA DE SOLDA 1 Text
  let sn1 = bx + 25;
  svg += `<text x="${sn1 + 30}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">MÁQUINA DE SOLDA 1</text>`;

  // 4. Sensor 1: Box, line passing through, NO LABELS
  svg += `<rect x="${sn1 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn1}" y1="${YM - 25}" x2="${sn1}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;

  // 5. Cross Mark
  let cx = sn1 + 45;
  svg += `<line x1="${cx - 10}" y1="${YM - 20}" x2="${cx + 10}" y2="${YM - 20}" stroke="#22c55e" stroke-width="2"/>`; 
  svg += `<line x1="${cx}" y1="${YM - 30}" x2="${cx}" y2="${YM - 10}" stroke="#22c55e" stroke-width="1.5"/>`;

  // 6. Group 3: 2 Rollers ALL BOTTOM, NO LABELS
  let rx = cx + 35;
  svg += rNrForno(rx, YM + 8, 8, '', rx, YM + 30);
  svg += rNrForno(rx + 25, YM + 8, 8, '', rx + 25, YM + 30);

  // 7. Pinch Rollers: Top small, Bottom large, NO LABELS
  let px = rx + 45;
  svg += rNrForno(px, YM - 8, 8, '', px, YM - 25);
  svg += rNrForno(px, YM + 12, 12, '', px, YM + 40);

  // 8. Sensor 2 & Scrap Bucket: Box, line passing through, NO LABELS
  let sn2 = px + 45;
  svg += `<rect x="${sn2 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn2}" y1="${YM - 25}" x2="${sn2}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;
  
  // Dotted drop line
  svg += `<line x1="${sn2}" y1="${YM + 15}" x2="${sn2}" y2="${YM + 80}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>`; 

  // Bucket (Trapezoid)
  let bkY = YM + 80;
  svg += `<polygon points="${sn2 - 40},${bkY} ${sn2 + 40},${bkY} ${sn2 + 25},${bkY + 35} ${sn2 - 25},${bkY + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Re-sync lineTo position
  lineTo(sn2 + 60, YM);

"""
    text = part1 + new_secao2 + end_str + part2

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Secao 2 updated: Continuous bottom rollers, all numbers removed, layout matched exactly!")
else:
    print("Could not find the markers to replace the text!")
