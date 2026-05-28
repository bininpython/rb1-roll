import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // === ENTRADA 2 ==="
end_marker = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // 13, 14, 15 (Bottom rollers)
  svg += rNr(550, Y1+6, 6, '13', 550, Y1-15, 550, Y1-13, 550, Y1);
  svg += rNr(580, Y1+6, 6, '14', 580, Y1-15, 580, Y1-13, 580, Y1);
  svg += rNr(610, Y1+6, 6, '15', 610, Y1-15, 610, Y1-13, 610, Y1);

  // 16, 17, 18 (Vertical Rectangles ON the line)
  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-6}" y="${Y1-24}" width="12" height="24" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+8}" stroke="${BK}" stroke-width="2"/>`;
    out += `<text x="${cx}" y="${Y1-30}" font-family="sans-serif" font-size="10" font-weight="700" fill="${BK}" text-anchor="middle">${num}</text>`;
    return out;
  }
  svg += rectSens(670, '16');
  svg += rectSens(700, '17');
  svg += rectSens(730, '18');

  // 19, 20 (Large Pinch Rollers)
  svg += rNr(780, Y1-14, 14, '19', 780, Y1-38, 780, Y1-36, 780, Y1-28);
  svg += rNr(780, Y1+14, 14, '20', 780, Y1+38, 780, Y1+36, 780, Y1+28);

  // TESOURA 1 (Shear & Scrap Bin)
  svg += `<text x="850" y="${Y1-40}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="${BK}" text-anchor="middle">TESOURA 1</text>`;
  // Top Blade
  svg += `<rect x="830" y="${Y1-30}" width="20" height="30" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Bottom Blade
  svg += `<rect x="850" y="${Y1}" width="20" height="30" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Scrap Chute
  svg += `<polygon points="850,${Y1+30} 870,${Y1+30} 910,${Y1+50} 890,${Y1+50}" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Scrap Bin
  svg += `<rect x="870" y="${Y1+60}" width="50" height="70" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Scrap metal lines inside bin
  svg += `<path d="M 880 ${Y1+70} Q 895 ${Y1+65} 910 ${Y1+70} M 880 ${Y1+80} Q 895 ${Y1+85} 910 ${Y1+80} M 880 ${Y1+90} Q 895 ${Y1+85} 910 ${Y1+90} M 880 ${Y1+100} Q 895 ${Y1+105} 910 ${Y1+100} M 880 ${Y1+110} Q 895 ${Y1+105} 910 ${Y1+110} M 880 ${Y1+120} Q 895 ${Y1+125} 910 ${Y1+120}" fill="none" stroke="${BK}" stroke-width="1"/>`;
  // Hydraulic Cylinder
  svg += `<polygon points="900,${Y1+90} 940,${Y1+40} 945,${Y1+45} 905,${Y1+95}" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<line x1="890" y1="${Y1+100}" x2="905" y2="${Y1+95}" stroke="${BK}" stroke-width="2"/>`; // Rod pushing
  svg += `<line x1="890" y1="${Y1+80}" x2="890" y2="${Y1+110}" stroke="${BK}" stroke-width="2"/>`; // Pusher plate
  
  // Roller Table Frame (21-26)
  svg += `<rect x="940" y="${Y1}" width="130" height="20" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Connecting rod from cylinder to table
  svg += `<line x1="945" y1="${Y1+45}" x2="980" y2="${Y1+20}" stroke="${BK}" stroke-width="1.5"/>`;

  // 21 to 26 (Inside the table)
  let tbx = 950;
  for(let i=21; i<=26; i++) {
    svg += rNr(tbx, Y1+6, 6, i.toString(), tbx, Y1-15, tbx, Y1-13, tbx, Y1);
    tbx += 20;
  }

  // 27 to 31 (Bottom rollers)
  let brx = 1080;
  for(let i=27; i<=31; i++) {
    svg += rNr(brx, Y1+6, 6, i.toString(), brx, Y1-15, brx, Y1-13, brx, Y1);
    brx += 20;
  }

  // ENROLADOR TIRAS (32, 33, 34, 35)
  svg += `<text x="1205" y="${Y1-45}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="${BK}" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="1205" y="${Y1-32}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="${BK}" text-anchor="middle">TIRAS</text>`;
  // Crescent wrapper
  svg += `<path d="M 1175 ${Y1-20} Q 1205 ${Y1} 1235 ${Y1-20}" fill="none" stroke="${BK}" stroke-width="2.5"/>`;
  
  // Rollers 32, 35 (Bottom)
  svg += rNr(1190, Y1+7, 7, '32', 1190, Y1+30, 1190, Y1+28, 1190, Y1+14);
  svg += rNr(1220, Y1+7, 7, '35', 1220, Y1+30, 1220, Y1+28, 1220, Y1+14);
  // Rollers 33, 34 (Top, sitting on the bottom ones)
  svg += rNr(1190, Y1-7, 7, '33', 1175, Y1-35, 1175, Y1-33, 1185, Y1-12);
  svg += rNr(1220, Y1-7, 7, '34', 1235, Y1-35, 1235, Y1-33, 1225, Y1-12);
  
  // Roller 36 (Bottom)
  svg += rNr(1250, Y1+6, 6, '36', 1250, Y1+25, 1250, Y1+23, 1250, Y1+12);

  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 2</text>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(1300, Y1); // Go horizontally through all new rollers
  lineTo(1350, Y2); // Slant down to Entrada 2

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 1350 ${Y2} `; // Meet Entrada 1
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  
  // After merging at 1350, Y2, stripPath continues along Y2 (which is YM)
  lineTo(1400, YM);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Appended second half of Entrada 1 successfully.")
else:
    print("Could not find markers.")
