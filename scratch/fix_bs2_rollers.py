import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // 186 to 189"
end_marker = "  // BS2 Text"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // 186 to 188 (Staggered as requested)
  let x186 = 3490;
  svg += rNrForno(x186, TY - 22, 8, '', x186, TY - 10); // 186 (Under strip)
  
  let x187 = 3525;
  svg += rNrForno(x187, TY - 38, 8, '', x187, TY - 50); // 187 (Over strip)
  
  let x188 = 3560;
  svg += rNrForno(x188, TY - 22, 8, '', x188, TY - 10); // 188 (Under strip)

"""
    
    text = part1 + start_marker + "\n" + new_block + end_marker + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("BS2 rollers fixed successfully!")
else:
    print("Markers not found")
