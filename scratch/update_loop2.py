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

  // Title
  svg += `<text x="3300" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="20" font-weight="800" fill="${BK}">Loop Entrada</text>`;

  // 1. Entrance Roller (E1)
  let e1x = 2800, e1y = YM - LR; // 2800, 420
  drawHollowRoller(e1x, e1y);
  
  // Line comes from left, meets bottom of E1
  lineTo(e1x, YM);
  // Wraps bottom-right quadrant of E1
  stripPath += `A ${LR} ${LR} 0 0 0 ${e1x + LR} ${e1y} `;
  
  // 2. Top Roller 1 (T1)
  let t1x = 2950, t1y = LYT + LR; // 2950, 150
  drawHollowRoller(t1x, t1y);
  
  // Line goes up to left side of T1
  lineTo(t1x - LR, t1y);
  // Wraps top-left quadrant of T1
  stripPath += `A ${LR} ${LR} 0 0 1 ${t1x} ${LYT} `;
  
  // 3. Top Roller 2 (T2)
  let t2x = 3050, t2y = LYT + LR;
  drawHollowRoller(t2x, t2y);
  
  // Horizontal line connecting T1 and T2 top
  lineTo(t2x, LYT);
  // Wraps top-right quadrant of T2
  stripPath += `A ${LR} ${LR} 0 0 1 ${t2x + LR} ${t2y} `;

  // Remaining rollers: 3 Bottom (B1,B2,B3), 3 Top (T3,T4,T5)
  const bxs = [3150, 3350, 3550];
  const txs = [3250, 3450, 3650];

  for (let i = 0; i < 3; i++) {
    // Bottom roller Bi
    let bx = bxs[i], by = LYB - LR;
    drawHollowRoller(bx, by);
    
    // Line down diagonally to left side of Bi
    lineTo(bx - LR, by);
    // Wrap under Bi (full bottom half)
    stripPath += `A ${LR} ${LR} 0 0 0 ${bx + LR} ${by} `;
    
    // Top roller Ti+2
    let tx = txs[i], ty = LYT + LR;
    drawHollowRoller(tx, ty);
    
    // Line up diagonally to left side of Ti+2
    lineTo(tx - LR, ty);
    // Wrap over Ti+2 (full top half)
    stripPath += `A ${LR} ${LR} 0 0 1 ${tx + LR} ${ty} `;
  }

  // Exit: drop down diagonally to YM and continue horizontal
  lineTo(3750, YM);
  lineTo(3860, YM);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced section successfully.")
else:
    print("Could not find markers.")
