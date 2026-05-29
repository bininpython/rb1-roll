import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // 1 e 2 na Bobina"
end_marker = "  // 16, 17, 18"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // 1 e 2 na Bobina (Snubber rolls resting on the coil)
  // Coil center is (100, Y1+40=210). Radius=40. Roller radius=8. Gap=1. Dist=49.
  // 1 at 180 degrees: cx = 100 - 49*cos(0) = 51, cy = 210 - 49*sin(0) = 210
  // 2 at 100 degrees: cx = 100 - 49*cos(80) = 100 - 49*0.1736 = 91.5, cy = 210 - 49*sin(80) = 210 - 49*0.9848 = 161.7
  svg += rNr(51.0, 210.0, 8, '', 0,0,0,0,0,0);
  svg += rNr(91.5, 161.7, 8, '', 0,0,0,0,0,0);
  
  // 3, 4 (Pinch)
  let pX1 = 140;
  svg += rNr(pX1, Y1 - 13.75, 12, '', 0,0,0,0,0,0);
  svg += rNr(pX1, Y1 + 13.75, 12, '', 0,0,0,0,0,0);
  
  // 5 (Lower)
  svg += rNr(170, Y1 + 11.75, 10, '', 0,0,0,0,0,0);
  
  // 6-10 (Leveler / Straightener)
  // Upper rollers: 7, 9 (center Y1 - 6.75)
  // Lower rollers: 6, 8, 10 (center Y1 + 6.75)
  let stX1 = 210;
  svg += rNr(stX1,      Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 6
  svg += rNr(stX1 + 10, Y1 - 6.75, 5, '', 0,0,0,0,0,0); // 7
  svg += rNr(stX1 + 20, Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 8
  svg += rNr(stX1 + 30, Y1 - 6.75, 5, '', 0,0,0,0,0,0); // 9
  svg += rNr(stX1 + 40, Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 10

  // 11-15 (Inline)
  // All lower rollers
  let inX1 = 280;
  for(let i=0; i<5; i++) {
    svg += rNr(inX1 + i*15, Y1 + 6.75, 5, '', 0,0,0,0,0,0);
  }

"""
    text = part1 + new_block + "  // 16, 17, 18" + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Done")
else:
    print("Markers not found")
