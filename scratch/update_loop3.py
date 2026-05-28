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
  svg += `<line x1="3100" y1="${LYT}" x2="3100" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3100" y1="${LYB+20}" x2="3700" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3700" y1="${LYB+20}" x2="3700" y2="${LYT}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<text x="3400" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="20" font-weight="800" fill="${BK}">Loop Entrada</text>`;

  // 1. Entrance Bridle (E1, E2, E3)
  let e1x = 2800, e1y = 450;
  let e2x = 2900, e2y = 300;
  let e3x = 3000, e3y = 150;
  
  drawHollowRoller(e1x, e1y);
  drawHollowRoller(e2x, e2y);
  drawHollowRoller(e3x, e3y);
  
  // Path for Entrance
  lineTo(e1x - LR, e1y); // Hit left of E1
  stripPath += `A ${LR} ${LR} 0 0 1 ${e1x + LR} ${e1y} `; // Over E1
  
  lineTo(e2x - LR, e2y); // Hit left of E2
  stripPath += `A ${LR} ${LR} 0 0 0 ${e2x + LR} ${e2y} `; // Under E2
  
  lineTo(e3x - LR, e3y); // Hit left of E3
  stripPath += `A ${LR} ${LR} 0 0 1 ${e3x} ${e3y - LR} `; // Top-left quarter over E3
  
  // 2. Top connection to Pit
  let t1x = 3150;
  lineTo(t1x, LYT); // Flat line to T1
  
  // 3. Pit Loops (T1..T3, B1..B3)
  const txs = [3150, 3350, 3550]; // T1, T2, T3
  const bxs = [3250, 3450, 3650]; // B1, B2, B3
  
  for (let x of txs) drawHollowRoller(x, LYT + LR); // cy = 150
  for (let x of bxs) drawHollowRoller(x, LYB - LR); // cy = 550
  
  // Trace Pit
  for (let i = 0; i < 3; i++) {
    let tx = txs[i], ty = LYT + LR;
    // Wrap right half of Tx
    stripPath += `A ${LR} ${LR} 0 0 1 ${tx + LR} ${ty} `;
    
    let bx = bxs[i], by = LYB - LR;
    // Line to left side of Bx
    lineTo(bx - LR, by);
    // Wrap bottom half of Bx
    stripPath += `A ${LR} ${LR} 0 0 0 ${bx + LR} ${by} `;
    
    if (i < 2) {
      let next_tx = txs[i+1], next_ty = LYT + LR;
      // Line to left side of next Tx
      lineTo(next_tx - LR, next_ty);
      // Wrap top-left quadrant of next Tx
      stripPath += `A ${LR} ${LR} 0 0 1 ${next_tx} ${LYT} `;
    }
  }
  
  // 4. Exit Bridle (T_out, B_out)
  let tox = 3750, toy = 150;
  let box = 3750, boy = 420;
  
  drawHollowRoller(tox, toy);
  drawHollowRoller(box, boy);
  
  // Line from B3 to right side of T_out
  lineTo(tox + LR, toy); 
  
  // Wrap OVER T_out (right to left)
  stripPath += `A ${LR} ${LR} 0 0 0 ${tox - LR} ${toy} `; 
  
  // Line DOWN to left side of B_out
  lineTo(box - LR, boy); 
  
  // Wrap UNDER B_out (left to bottom)
  stripPath += `A ${LR} ${LR} 0 0 0 ${box} ${boy + LR} `; 
  
  // Continue horizontal
  lineTo(3860, YM); 

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced section successfully.")
else:
    print("Could not find markers.")
