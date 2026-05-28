import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# We need to replace from Roller 171 down to the S-Wrap Path for BS1

start_marker = "  // Roller 171"
end_marker = "  // 2. Arc around 173"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // Roller 171 (Tangent to diagonal line)
  let r171X = secRx + 40; // 2596
  // Diagonal line starts at (2556, 450) and goes to (2866.6, 379.2)
  // Slope = -0.2279
  let r171YLine = 450 - 0.2279 * (r171X - secRx); // 440.89
  let r171YCenter = r171YLine - (8 / 0.975); // 432.69
  svg += rNrForno(r171X, r171YCenter, 8, '', r171X, r171YCenter - 15);

  // CORRETOR 1 (172) (Tangent to diagonal line)
  let corrX = r171X + 50; // 2646
  let corrYLine = 450 - 0.2279 * (corrX - secRx); // 429.49
  let corrY = corrYLine - (25 / 0.975); // 403.85
  
  // Quadrant Pattern
  svg += `<circle cx="${corrX}" cy="${corrY}" r="25" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY - 25} A 25 25 0 0 1 ${corrX + 25} ${corrY} Z" fill="#4ade80"/>`;
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY + 25} A 25 25 0 0 1 ${corrX - 25} ${corrY} Z" fill="#4ade80"/>`;
  svg += `<circle cx="${corrX}" cy="${corrY}" r="2" fill="#ffffff"/>`;
  svg += `<text x="${corrX}" y="${YM + 35}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 1</text>`;

  // Extend strip path horizontally through Secador until its exit (secRx)
  lineTo(secRx, YM); 
  
  // ====================================================================
  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)
  // ====================================================================

  // Grupo BS1 (Bridle de Entrada do Loop - Figure-8 S-Wrap)
  let r173x = 2860, r173y = 350, rL = 30; // Right large roller
  let r176x = 2770, r176y = 250; // Left large roller
  
  // Text BS1
  svg += `<text x="2815" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS1</text>`;

  svg += rNrForno(r176x, r176y, rL, '', r176x, r176y); // 176
  svg += rNrForno(r173x, r173y, rL, '', r173x, r173y); // 173
  
  // Pinches 174, 175
  svg += rNrForno(r173x + 28, r173y + 28, 10, '', 0, 0); // 174: Bottom-Right of 173
  svg += rNrForno(r176x - 25, r176y - 25, 10, '', 0, 0); // 175: Top-Left of 176

  // S-Wrap Path for BS1 (THE PERFECT FIGURE-8 BRIDLE)
  // 1. Tangent diagonal line from Secador exit to bottom tangent of 173
  lineTo(2866.6, 379.2); 
  
"""
    
    text = part1 + start_marker + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Diagonal fix applied successfully!")
else:
    print("Markers not found")
