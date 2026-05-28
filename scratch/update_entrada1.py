import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // SEÇÃO 1: ENTRADAS DUPLAS (Ultra Minimalist)"
end_marker = "  // After merging at 800, Y2, stripPath continues along Y2 (which is YM)"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS
  // ====================================================================
  
  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number) {
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="10" font-weight="700" fill="${BK}" text-anchor="middle">${n}</text>`;
    out += `<line x1="${lx}" y1="${ly}" x2="${ltx}" y2="${lty}" stroke="${BK}" stroke-width="0.8"/>`;
    return out;
  }

  // === ENTRADA 1 (Detailed Engineering Blueprint) ===
  svg += `<text x="90" y="${Y1 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 1</text>`;
  
  // Bobina Principal (Outer 40, Inner 15)
  svg += `<circle cx="100" cy="${Y1 + 40}" r="40" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y1 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  
  // Rolos Numerados 1 a 12
  // rNr(cx, cy, r, num, textX, textY, lineX1, lineY1, lineX2, lineY2)
  
  // 1 e 2 na Bobina
  svg += rNr(60, Y1+20, 6, '1', 50, Y1+10, 52, Y1+12, 57, Y1+17);
  svg += rNr(90, Y1-6, 6, '2', 90, Y1-25, 90, Y1-23, 90, Y1-12);
  
  // 3 e 4 (Pinch rollers)
  svg += rNr(220, Y1-14, 14, '3', 220, Y1-38, 220, Y1-36, 220, Y1-28);
  svg += rNr(220, Y1+14, 14, '4', 200, Y1-5, 204, Y1-3, 210, Y1+5);
  
  // 5 (Bottom roller)
  svg += rNr(265, Y1+12, 12, '5', 285, Y1-5, 281, Y1-3, 274, Y1+4);
  
  // 6 a 10 (Leveler table, spacing=12)
  // 6 (bottom), 7 (top), 8 (bottom), 9 (top), 10 (bottom)
  svg += rNr(360, Y1+5, 5, '6', 352, Y1-15, 354, Y1-13, 358, Y1);
  svg += rNr(372, Y1-5, 5, '7', 372, Y1-22, 372, Y1-20, 372, Y1-10);
  svg += rNr(384, Y1+5, 5, '8', 384, Y1-18, 384, Y1-16, 384, Y1);
  svg += rNr(396, Y1-5, 5, '9', 396, Y1-22, 396, Y1-20, 396, Y1-10);
  svg += rNr(408, Y1+5, 5, '10', 408, Y1-18, 408, Y1-16, 408, Y1);
  
  // 11 e 12 (Bottom rollers)
  svg += rNr(490, Y1+6, 6, '11', 490, Y1-15, 490, Y1-13, 490, Y1);
  svg += rNr(520, Y1+6, 6, '12', 520, Y1-15, 520, Y1-13, 520, Y1);

  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" ${FSL} font-size="14" font-weight="800" fill="${BK}">Entrada 2</text>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="none" stroke="${BK}" stroke-width="1.5"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(600, Y1);
  lineTo(800, Y2); // Slant down to Entrada 2

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 800 ${Y2} `; // Meet Entrada 1
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  
"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced Entrada 1 section successfully.")
else:
    print("Could not find markers.")
