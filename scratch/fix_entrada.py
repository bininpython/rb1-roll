import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // PASS-LINE PATH TRACKING"
end_marker = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // ====================================================================
  // PASS-LINE PATH TRACKING
  // ====================================================================
  let stripPath = "M 100 170 ";
  function lineTo(x: number, y: number) { stripPath += `L ${x} ${y} `; }
  function curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    stripPath += `C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y} `;
  }

  const Y1 = 170;
  const Y2 = 450;
  const YM = 450; // Main line continues at Y2 level

  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS (Ultra Minimalist)
  // ====================================================================
  
  // Title ENTRADA 1
  svg += `<text x="60" y="${Y1 - 20}" ${FSL} font-size="14" font-weight="800" fill="${BK}">Entrada 1</text>`;
  // Coil 1 (Hollow circle)
  svg += `<circle cx="100" cy="${Y1 + 40}" r="40" fill="none" stroke="${BK}" stroke-width="1.5"/>`;

  // Title ENTRADA 2
  svg += `<text x="60" y="${Y2 - 20}" ${FSL} font-size="14" font-weight="800" fill="${BK}">Entrada 2</text>`;
  // Coil 2 (Hollow circle)
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="none" stroke="${BK}" stroke-width="1.5"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(600, Y1);
  lineTo(800, Y2); // Slant down to Entrada 2

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 800 ${Y2} `; // Meet Entrada 1
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  
  // After merging at 800, Y2, stripPath continues along Y2 (which is YM)
  lineTo(1400, YM);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced section successfully.")
else:
    print("Could not find markers.")
