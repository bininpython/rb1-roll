import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. We replace the ENTRADA 2 block
old_block = """  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 2</text>`;
  svg += rolerDecap(100, Y2 + 40, 40, 'Defletor Entrada', '2140 mm');
  
  // Merge Bridle (top roller large, bottom small as per drawing)
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += `<circle cx="1350" cy="${Y2+15}" r="15" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(pX, Y1); 
  // Wrap around 74 to tangent point T1
  stripPath += `A 30 30 0 0 1 1113.11 180.87 `; 
  // Slant down over rollers 75-83 to tangent point T2
  lineTo(1326.89, 439.13); 
  // Wrap around bottom of merge roller C2 to horizontal Y2
  stripPath += `A 30 30 0 0 0 1350 450 `;

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 1350 ${Y2} `; 
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="2"/>`;"""

# Let's write the new block.
new_block = """  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 2</text>`;
  
  // Helper for small numbered rollers
  function rNrForno(cx: number, cy: number, r: number, num: string, nx: number, ny: number) {
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    s += `<text x="${nx}" y="${ny}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${num}</text>`;
    return s;
  }

  // Bobina Principal (Defletor)
  svg += rolerDecap(100, Y2 + 40, 40, 'Defletor Entrada 2', '2140 mm');
  
  // 86, 87
  svg += rNrForno(45, Y2 + 10, 8, '86', 45, Y2 - 2);
  svg += rNrForno(80, Y2 - 12, 8, '87', 80, Y2 - 24);

  // 88, 89 (Pinch)
  svg += rNrForno(400, Y2 - 12, 12, '88', 400, Y2 - 28);
  svg += rNrForno(400, Y2 + 12, 12, '89', 400, Y2 + 34);

  // 90
  svg += rNrForno(450, Y2 + 10, 10, '90', 450, Y2 - 4);

  // 91-95 (Straightener)
  let stX = 700;
  svg += rNrForno(stX, Y2 + 6, 6, '91', stX, Y2 + 20);
  svg += rNrForno(stX+12, Y2 - 6, 6, '92', stX+12, Y2 - 15);
  svg += rNrForno(stX+24, Y2 + 6, 6, '95', stX+24, Y2 + 20);
  svg += rNrForno(stX+36, Y2 - 6, 6, '93', stX+36, Y2 - 15);
  svg += rNrForno(stX+48, Y2 + 6, 6, '94', stX+48, Y2 + 20);

  // 96-100 (Inline)
  let inX = 850;
  svg += rNrForno(inX, Y2 + 5, 5, '96', inX, Y2 - 5);
  svg += rNrForno(inX+25, Y2 + 5, 5, '97', inX+25, Y2 - 5);
  svg += rNrForno(inX+50, Y2 + 5, 5, '98', inX+50, Y2 - 5);
  svg += rNrForno(inX+75, Y2 + 5, 5, '99', inX+75, Y2 - 5);
  svg += rNrForno(inX+100, Y2 + 5, 5, '100', inX+100, Y2 - 5);

  // Merge Bridle
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += dot(1350, Y2+15, 15); // Replaced with new dot function (green style)

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
  svg += `<path d="${p2}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;"""

text = text.replace(old_block, new_block)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Entrada 2 updated perfectly!")
