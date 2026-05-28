import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)"
end_marker = "  // ====================================================================\n  // SEÇÃO 4: FORNO E RESFRIAMENTO"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // ====================================================================
  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)
  // ====================================================================
  const LYT = 120; // Top level
  const LYB = 580; // Bottom level
  const LR = 30;   // Loop roller radius

  function drawHollowRoller(cx: number, cy: number) {
    svg += `<circle cx="${cx}" cy="${cy}" r="${LR}" fill="none" stroke="${BK}" stroke-width="1.8"/>`;
  }

  // Fosso (Pit) lines
  svg += `<line x1="3000" y1="${LYT}" x2="3000" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3000" y1="${LYB+20}" x2="3750" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3750" y1="${LYB+20}" x2="3750" y2="${LYT}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<text x="3300" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="20" font-weight="800" fill="${BK}">Loop Entrada</text>`;

  // Bridle Entrance
  // Line comes from X=2750 at YM=450.
  let b1x = 2800, b1y = YM - LR; // 2800, 420
  let b2x = 2950, b2y = LYT + LR; // 2950, 150

  drawHollowRoller(b1x, b1y);
  drawHollowRoller(b2x, b2y);

  // Line wraps under b1
  lineTo(b1x, YM); // 2800, 450
  stripPath += `A ${LR} ${LR} 0 0 0 ${b1x + LR} ${b1y} `; // Arcs to 2830, 420
  
  // Line goes to left of b2
  lineTo(b2x - LR, b2y); // 2920, 150
  
  // Wraps over b2 to its top
  stripPath += `A ${LR} ${LR} 0 0 1 ${b2x} ${b2y - LR} `; // Arcs to 2950, 120

  // 7 Loop Rollers (4 Top, 3 Bottom)
  const txs = [3050, 3250, 3450, 3650];
  const bxs = [3150, 3350, 3550];

  for (let x of txs) drawHollowRoller(x, LYT + LR);
  for (let x of bxs) drawHollowRoller(x, LYB - LR);

  // Trace S-wraps between them
  lineTo(txs[0], LYT);
  
  for (let i = 0; i < 3; i++) {
    // Top to Bottom
    // We are at the top of txs[i]. Wrap over to right side.
    stripPath += `A ${LR} ${LR} 0 0 1 ${txs[i] + LR} ${LYT + LR} `;
    
    // Line to left side of bxs[i]
    lineTo(bxs[i] - LR, LYB - LR);
    
    // Wrap under bottom to its right side
    stripPath += `A ${LR} ${LR} 0 0 0 ${bxs[i] + LR} ${LYB - LR} `;
    
    // Line to left side of txs[i+1]
    lineTo(txs[i+1] - LR, LYT + LR);
    
    // Wrap over top to its top center
    stripPath += `A ${LR} ${LR} 0 0 1 ${txs[i+1]} ${LYT} `;
  }

  // Exit Loop from Top 4
  // We are at top of Top 4 (txs[3], LYT).
  // Wrap over Top 4 right side
  stripPath += `A ${LR} ${LR} 0 0 1 ${txs[3] + LR} ${LYT + LR} `;
  
  // Go back to YM (450)
  lineTo(3800, YM);
  lineTo(3860, YM);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced section successfully.")
else:
    print("Could not find markers.")
