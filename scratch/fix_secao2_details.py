import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Remove Mergulhador QUIM 1 from Entrada 2
old_mergulhador = """  // Merge Bridle
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += dot(1350, Y2+15, 15); // Replaced with new dot function (green style)"""

new_mergulhador = """  // Merge Bridle (Removed Mergulhador QUIM 1 to match blueprint 2)
  // The lines from Entrada 1 and 2 just merge directly into 84/85"""
text = text.replace(old_mergulhador, new_mergulhador)

# Also fix the stripPath for Entrada 1 and 2.
# Entrada 1 stripPath:
#   lineTo(1326.89, 439.13); 
#   stripPath += `A 30 30 0 0 0 1350 450 `;
# We can leave this, it's just path drawing.

# 2. Fix SEÇÃO 2
start_str = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)\n  // ===================================================================="
end_str = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"

if start_str in text and end_str in text:
    part1 = text.split(start_str)[0]
    part2 = text.split(end_str)[1]

    new_secao2 = """  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)
  // ====================================================================
  
  // 84, 85 (Large Pinch - Merge Point)
  let mX = 1450;
  // 84 is larger than 85 in blueprint
  svg += rNrForno(mX, YM - 20, 20, '84', mX, YM - 45); // Top
  svg += rNrForno(mX, YM + 12, 12, '85', mX, YM + 40); // Bottom

  // 126 to 132 (Inline alternating)
  let ax = 1510;
  let s_alt = [126, 127, 128, 129, 130, 131, 132];
  for(let i=0; i<7; i++) {
    let isTop = (i % 2 === 0);
    let cy = isTop ? YM - 6 : YM + 6;
    let ny = isTop ? cy - 18 : cy + 22;
    svg += rNrForno(ax, cy, 6, s_alt[i].toString(), ax, ny);
    ax += 16; // Tighter spacing
  }

  // Hydraulic Table (133, 134, 135)
  let tbX = ax + 10;
  
  // Hydraulic Cylinder Support
  svg += `<line x1="${tbX + 30}" y1="${YM + 25}" x2="${tbX - 10}" y2="${YM + 100}" stroke="#475569" stroke-width="12"/>`; // Thick Cylinder body
  svg += `<line x1="${tbX + 40}" y1="${YM + 5}" x2="${tbX + 30}" y2="${YM + 25}" stroke="#94a3b8" stroke-width="4"/>`; // Rod
  
  // Floor mount with hatching
  svg += `<line x1="${tbX - 30}" y1="${YM + 100}" x2="${tbX + 10}" y2="${YM + 100}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<6; i++) {
    let hx = (tbX - 25) + i*6;
    svg += `<line x1="${hx}" y1="${YM + 100}" x2="${hx - 8}" y2="${YM + 110}" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Table Box (Snug fit)
  svg += `<rect x="${tbX - 5}" y="${YM + 2}" width="95" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers on table (Bottom rollers, line passes over them)
  svg += rNrForno(tbX + 15, YM + 10, 10, '133', tbX + 15, YM - 15); // Large
  svg += rNrForno(tbX + 45, YM + 6, 6, '134', tbX + 45, YM - 15);  // Small
  svg += rNrForno(tbX + 75, YM + 6, 6, '135', tbX + 75, YM - 15);  // Small

  // 136 to 145 (Inline alternating)
  let bx = tbX + 105;
  let s_alt2 = [136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
  for(let i=0; i<10; i++) {
    let isTop = (i % 2 === 0);
    let cy = isTop ? YM - 6 : YM + 6;
    let ny = isTop ? cy - 18 : cy + 22;
    svg += rNrForno(bx, cy, 6, s_alt2[i].toString(), bx, ny);
    bx += 16; // Tighter spacing
  }

  // 146 Sensor (Top)
  let sn1 = bx + 25;
  svg += `<rect x="${sn1 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`; // fill=none so strip shows through
  svg += `<line x1="${sn1}" y1="${YM - 25}" x2="${sn1}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;
  svg += `<text x="${sn1}" y="${YM - 45}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">146</text>`;

  // Cross Mark / Centering (Floating above line)
  let cx = sn1 + 45;
  svg += `<line x1="${cx - 10}" y1="${YM - 20}" x2="${cx + 10}" y2="${YM - 20}" stroke="#22c55e" stroke-width="2"/>`; // Horizontal (shorter)
  svg += `<line x1="${cx}" y1="${YM - 30}" x2="${cx}" y2="${YM - 10}" stroke="#22c55e" stroke-width="1.5"/>`; // Vertical

  // 147, 148 (Bottom)
  let rx = cx + 35;
  svg += rNrForno(rx, YM + 8, 8, '147', rx, YM + 30);
  svg += rNrForno(rx + 25, YM + 8, 8, '148', rx + 25, YM + 30);

  // 149, 150 (Pinch)
  // Blueprint: 149 (top) is smaller, 150 (bot) is larger
  let px = rx + 45;
  svg += rNrForno(px, YM - 8, 8, '149', px, YM - 25);
  svg += rNrForno(px, YM + 12, 12, '150', px, YM + 40);

  // 151 Sensor & Scrap Bucket
  let sn2 = px + 45;
  svg += `<rect x="${sn2 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`; // fill=none
  svg += `<line x1="${sn2}" y1="${YM - 25}" x2="${sn2}" y2="${YM - 40}" stroke="#22c55e" stroke-width="1.5"/>`;
  svg += `<text x="${sn2}" y="${YM - 45}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">151</text>`;
  
  // Dotted drop line
  svg += `<line x1="${sn2}" y1="${YM + 15}" x2="${sn2}" y2="${YM + 80}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>`; 

  // Bucket (Trapezoid) - wider, slightly shallower
  let bkY = YM + 80;
  svg += `<polygon points="${sn2 - 40},${bkY} ${sn2 + 40},${bkY} ${sn2 + 25},${bkY + 35} ${sn2 - 25},${bkY + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // MÁQUINA DE SOLDA 1 Text (Aligned correctly)
  svg += `<text x="${sn2 + 20}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="end">MÁQUINA DE SOLDA 1</text>`;

  // Re-sync lineTo position
  lineTo(sn2 + 60, YM);

"""
    text = part1 + new_secao2 + end_str + part2

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Secao 2 precise fixes applied!")
else:
    print("Could not find the markers to replace the text!")
