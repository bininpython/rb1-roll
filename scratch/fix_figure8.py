import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // Extend strip path to touch CORRETOR 1"
end_marker = "  // LOOP ENTRADA"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // Extend strip path to touch CORRETOR 1
  lineTo(corrX, YM); // Hits exact bottom (2646, 450)
  
  // Arc slightly around Corretor 1 to reach the exact outer tangent point towards 173
  stripPath += `A 25 25 0 0 0 2654 448 `;

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
  // 174: Bottom-Right of 173
  svg += rNrForno(r173x + 28, r173y + 28, 10, '', 0, 0); 
  // 175: Top-Left of 176
  svg += rNrForno(r176x - 25, r176y - 25, 10, '', 0, 0); 

  // S-Wrap Path for BS1 (THE PERFECT FIGURE-8 BRIDLE)
  // 1. Tangent line from Corretor 1 to bottom-right of 173
  lineTo(2870, 378); 
  
  // 2. Arc around 173 (Bottom-Right -> Right -> Top -> Top-Left)
  // Counter-Clockwise (sweep=0), Large Arc (large=1)
  stripPath += `A 30 30 0 1 0 2839 329 `; 
  
  // 3. Inner tangent diagonal line from 173 (Top-Left) to 176 (Bottom-Right)
  lineTo(2791, 271); 
  
  // 4. Arc around 176 (Bottom-Right -> Bottom -> Left -> Top)
  // Clockwise (sweep=1), Large Arc (large=1)
  stripPath += `A 30 30 0 1 1 2770 220 `; 
  
  // 177, 178 (Support rollers on the horizontal exit line)
  // Horizontal line is at Y = 220.
  // 177 is on TOP of the line, between 176 and 173. Let's place at X = 2815
  svg += rNrForno(2815, 210, 10, '', 0, 0); // 177 (Top)
  
  // 178 is BELOW the line, right after 173. Let's place at X = 2930
  svg += rNrForno(2930, 230, 10, '', 0, 0); // 178 (Bottom)

"""
    
    text = part1 + start_marker + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Figure-8 bridle path applied successfully!")
else:
    print("Markers not found")
