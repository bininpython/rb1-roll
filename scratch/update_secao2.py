import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# We need to replace the SEÇÃO 2 block up to before the loop or tanque.
# Let's see what's currently in SEÇÃO 2.
old_secao2 = """  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO
  // ====================================================================
  // Pista central
  svg += dot(1400, YM, 5); svg += dot(1400, YM - 12, 5);
  for (let i=0; i<12; i++) svg += dot(1430 + i*15, YM, 4);
  // Guia vert e rolos
  svg += vertBars(1640, YM, 1, 30, 0, 5);
  svg += dot(1680, YM, 5); svg += dot(1710, YM, 5);
  svg += dot(1750, YM-6, 4); svg += dot(1750, YM+6, 4);
  svg += vertBars(1790, YM, 1, 30, 0, 5);
  
  // Solda
  svg += maqSolda(1860, YM);
  
  // Conjunto 5 rolos
  svg += dot(1960, YM+5, 4); svg += dot(1980, YM+5, 4); svg += dot(2000, YM+5, 4);
  svg += dot(1970, YM-5, 4); svg += dot(1990, YM-5, 4);
  svg += dot(2040, YM, 5);
  svg += dot(2080, YM+5, 4); svg += dot(2100, YM+5, 4); svg += dot(2120, YM+5, 4);
  svg += dot(2090, YM-5, 4); svg += dot(2110, YM-5, 4);
  // Sensor
  svg += `<rect x="2160" y="${YM-8}" width="25" height="16" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += dot(2220, YM, 5);"""

new_secao2 = """  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)
  // ====================================================================
  
  // 84, 85 (Large Pinch - Merge Point)
  let mX = 1420;
  svg += rNrForno(mX, YM - 25, 25, '84', mX, YM - 60);
  svg += rNrForno(mX, YM + 25, 25, '85', mX, YM + 65);

  // 126 to 132 (Inline alternating)
  let ax = 1500;
  let s_alt = [126, 127, 128, 129, 130, 131, 132];
  for(let i=0; i<7; i++) {
    let isTop = (i % 2 === 0);
    let cy = isTop ? YM - 6 : YM + 6;
    let ny = isTop ? cy - 15 : cy + 20;
    svg += rNrForno(ax, cy, 6, s_alt[i].toString(), ax, ny);
    ax += 22;
  }

  // Hydraulic Table (133, 134, 135)
  let tbX = ax + 20;
  // Hydraulic Cylinder Support
  svg += `<line x1="${tbX + 20}" y1="${YM + 25}" x2="${tbX - 40}" y2="${YM + 140}" stroke="#475569" stroke-width="6"/>`;
  svg += `<rect x="${tbX - 45}" y="${YM + 140}" width="40" height="10" fill="#334155"/>`; // Floor mount
  // Table Box
  svg += `<rect x="${tbX - 10}" y="${YM - 10}" width="100" height="30" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Rollers on table
  svg += rNrForno(tbX + 10, YM + 4, 10, '133', tbX + 10, YM - 18);
  svg += rNrForno(tbX + 45, YM + 6, 6, '134', tbX + 45, YM - 15);
  svg += rNrForno(tbX + 70, YM + 6, 6, '135', tbX + 70, YM - 15);

  // 136 to 145 (Inline alternating)
  let bx = tbX + 120;
  let s_alt2 = [136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
  for(let i=0; i<10; i++) {
    let isTop = (i % 2 === 0);
    let cy = isTop ? YM - 6 : YM + 6;
    let ny = isTop ? cy - 15 : cy + 20;
    svg += rNrForno(bx, cy, 6, s_alt2[i].toString(), bx, ny);
    bx += 22;
  }

  // 146 Sensor (Top)
  let sn1 = bx + 30;
  svg += `<rect x="${sn1 - 10}" y="${YM - 40}" width="20" height="35" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn1}" y1="${YM - 5}" x2="${sn1}" y2="${YM + 20}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="2 2"/>`;
  svg += `<text x="${sn1}" y="${YM - 48}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">146</text>`;

  // Cross Mark / Centering
  let cx = sn1 + 60;
  svg += `<line x1="${cx - 15}" y1="${YM - 20}" x2="${cx + 15}" y2="${YM - 20}" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${cx}" y1="${YM - 40}" x2="${cx}" y2="${YM + 20}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4"/>`;

  // 147, 148 (Bottom)
  let rx = cx + 40;
  svg += rNrForno(rx, YM + 8, 8, '147', rx, YM + 30);
  svg += rNrForno(rx + 30, YM + 8, 8, '148', rx + 30, YM + 30);

  // 149, 150 (Pinch)
  let px = rx + 80;
  svg += rNrForno(px, YM - 12, 12, '149', px, YM - 30);
  svg += rNrForno(px, YM + 12, 12, '150', px, YM + 38);

  // 151 Sensor & Scrap Bucket
  let sn2 = px + 40;
  svg += `<rect x="${sn2 - 10}" y="${YM - 40}" width="20" height="35" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<line x1="${sn2}" y1="${YM - 5}" x2="${sn2}" y2="${YM + 70}" stroke="#f97316" stroke-width="1.5" stroke-dasharray="2 2"/>`; // dotted drop line
  svg += `<text x="${sn2}" y="${YM - 48}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">151</text>`;

  // Bucket (Trapezoid)
  let bkY = YM + 80;
  svg += `<polygon points="${sn2 - 40},${bkY} ${sn2 + 40},${bkY} ${sn2 + 25},${bkY + 40} ${sn2 - 25},${bkY + 40}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<text x="${sn2}" y="${bkY + 25}" font-family="Montserrat, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">SUCATA</text>`;
  
  // Overwrite stripPath connecting line from 1350 to this section
  // Actually, stripPath already draws M 100 Y2 L 1350 Y2. We don't have to change that.
  // We just need to make sure the main stripPath connects through here.
  // The strip is straight at YM=450! So it naturally passes exactly through all these.
  
  // Re-sync lineTo position
  lineTo(${sn2 + 60}, YM);"""

# Let's perform the replacement
text = text.replace(old_secao2, new_secao2)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Secao 2 updated successfully!")
