import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // After 185, strip exits horizontally and slants back to main level YM\n  lineTo(r185x + 100, TY - 30);\n  lineTo(3860, YM);"
end_marker = "  // ====================================================================\n  // SEÇÃO 4: FORNO E RESFRIAMENTO"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // ====================================================================
  // BS2 (Bridle de Saída do Loop) e Rolos de Apoio
  // ====================================================================
  
  // 186 to 189
  let x186 = 3490;
  svg += rNrForno(x186, TY - 22, 8, '', x186, TY - 10); // 186 (Under strip)
  
  let x187 = 3520;
  svg += rNrForno(x187, TY - 38, 8, '', x187, TY - 50); // 187 (Over strip)
  svg += rNrForno(x187, TY - 22, 8, '', x187, TY - 10); // 188 (Under strip)
  
  let x189 = 3550;
  svg += rNrForno(x189, TY - 22, 8, '', x189, TY - 10); // 189 (Under strip)

  // BS2 Text
  svg += `<text x="3655" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS2</text>`;

  // Left Large Roller (192) - Lower position
  let r192x = 3610, r192y = 350;
  svg += rNrForno(r192x, r192y, 30, '', r192x, r192y);

  // Right Large Roller (191) - Higher position
  let r191x = 3700, r191y = 250;
  svg += rNrForno(r191x, r191y, 30, '', r191x, r191y);

  // Pinches 190, 193
  svg += rNrForno(r191x + 25, r191y - 25, 10, '', 0, 0); // 190 (Top-Right of 191)
  svg += rNrForno(r192x - 25, r192y + 25, 10, '', 0, 0); // 193 (Bottom-Left of 192)

  // Roller 194 (Sag curve bottom point)
  let r194x = 3800;
  svg += rNrForno(r194x, YM + 8, 8, '', r194x, YM + 25);

  // --- BS2 PATH TRACING ---
  // Extend strip horizontally to Top of 191
  lineTo(r191x, r191y - 30);
  
  // Wrap 191 (Top -> Right -> Bottom-Left)
  stripPath += `A 30 30 0 1 1 3692.2 278.8 `;
  
  // Diagonal inner tangent line from 191 to 192 (Bottom-Left to Top-Right)
  lineTo(3617.8, 321.2);
  
  // Wrap 192 (Top-Right -> Top -> Left -> Bottom)
  stripPath += `A 30 30 0 1 0 3610 380 `;
  
  // Smooth Catenary Sag Curve to Roller 194 (using Quadratic Bezier)
  stripPath += `Q 3700 450 3800 450 `;
  
"""
    
    text = part1 + new_block + "\n  // ====================================================================\n  // SEÇÃO 4: FORNO E RESFRIAMENTO" + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("BS2 inserted successfully!")
else:
    print("Markers not found")
