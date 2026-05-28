import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // 186 to 188 (Staggered as requested)"
end_marker = "  // Roller 194 (Sag curve bottom point)"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // 186 to 188 (Perfectly tangent to the white strip, NO overlap)
  // Strip is at Y = 220. Thickness is 2. 
  // Under rollers center = 220 + 1 (strip half) + 1 (gap) + 8 (radius) = 230
  // Over rollers center = 220 - 1 - 1 - 8 = 210

  let x186 = 3485;
  svg += rNrForno(x186, 230, 8, '', x186, 230 - 15); // 186 (Under strip)
  
  let x187 = 3515;
  svg += rNrForno(x187, 210, 8, '', x187, 210 - 15); // 187 (Over strip)
  
  let x188 = 3545;
  svg += rNrForno(x188, 230, 8, '', x188, 230 - 15); // 188 (Under strip)

  // BS2 Text
  svg += `<text x="3655" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS2</text>`;

  // Left Large Roller (192) - Lower position
  let r192x = 3610, r192y = 350;
  svg += rNrForno(r192x, r192y, 30, '', r192x, r192y);

  // Right Large Roller (191) - Higher position
  let r191x = 3700, r191y = 250;
  svg += rNrForno(r191x, r191y, 30, '', r191x, r191y);

  // Pinches 190, 193 (Perfectly tangent to the outer edge of the strip wrap)
  // Distance from large roller center to pinch center = 30 (roller) + 1 (strip) + 1 (gap) + 8 (pinch) = 40
  // 40 * cos(45) = 28.3
  svg += rNrForno(r191x + 28.3, r191y - 28.3, 8, '', 0, 0); // 190 (Top-Right of 191)
  svg += rNrForno(r192x - 28.3, r192y + 28.3, 8, '', 0, 0); // 193 (Bottom-Left of 192)

"""
    
    text = part1 + start_marker + "\n" + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Small rollers alignment fixed successfully!")
else:
    print("Markers not found")
