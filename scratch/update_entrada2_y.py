import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // 104, 105 (Pinch)"
end_marker = "  // Merge Bridle  // Merge Bridle (Restored Mergulhador)"

if start_marker in text and end_marker in text:
    part1 = text.split(start_marker)[0]
    part2 = text.split(end_marker)[1]
    
    new_block = """  // 104, 105 (Pinch)
  let pX2 = 350;
  svg += rNrForno(pX2, Y2 - 13.75, 12, '', 0, 0);
  svg += rNrForno(pX2, Y2 + 13.75, 12, '', 0, 0);

  // TESOURA 2
  let tes2X = 450;
  svg += `<text x="${tes2X+20}" y="${Y2-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 2</text>`;
  svg += `<rect x="${tes2X}" y="${Y2-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tes2X+15}" y="${Y2}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<polygon points="${tes2X+15},${Y2+25} ${tes2X+30},${Y2+25} ${tes2X+60},${Y2+40} ${tes2X+45},${Y2+40}" fill="#334155" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tes2X+35}" y="${Y2+45}" width="35" height="50" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<path d="M ${tes2X+40} ${Y2+55} Q ${tes2X+52} ${Y2+50} ${tes2X+65} ${Y2+55} M ${tes2X+40} ${Y2+65} Q ${tes2X+52} ${Y2+60} ${tes2X+65} ${Y2+65} M ${tes2X+40} ${Y2+75} Q ${tes2X+52} ${Y2+70} ${tes2X+65} ${Y2+75} M ${tes2X+40} ${Y2+85} Q ${tes2X+52} ${Y2+80} ${tes2X+65} ${Y2+85}" fill="none" stroke="#64748b" stroke-width="1"/>`; 
  svg += `<polygon points="${tes2X+55},${Y2+70} ${tes2X+85},${Y2+35} ${tes2X+89},${Y2+39} ${tes2X+59},${Y2+74}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
  svg += `<line x1="${tes2X+50}" y1="${Y2+75}" x2="${tes2X+60}" y2="${Y2+65}" stroke="${BK}" stroke-width="1.5"/>`; // Rod
  svg += `<line x1="${tes2X+50}" y1="${Y2+60}" x2="${tes2X+50}" y2="${Y2+85}" stroke="${BK}" stroke-width="1.5"/>`; // Plate

  // 106-109 Hydraulic Table
  let tbE2X = 600;
  // Hydraulic Cylinder
  svg += `<line x1="${tbE2X + 45}" y1="${Y2 + 25}" x2="${tbE2X - 5}" y2="${Y2 + 100}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${tbE2X + 55}" y1="${Y2 + 5}" x2="${tbE2X + 45}" y2="${Y2 + 25}" stroke="#94a3b8" stroke-width="4"/>`;
  // Floor mount
  svg += `<line x1="${tbE2X - 25}" y1="${Y2 + 100}" x2="${tbE2X + 15}" y2="${Y2 + 100}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<6; i++) {
    let hx = (tbE2X - 20) + i*6;
    svg += `<line x1="${hx}" y1="${Y2 + 100}" x2="${hx - 8}" y2="${Y2 + 110}" stroke="#475569" stroke-width="1.5"/>`;
  }
  // Table Box
  svg += `<rect x="${tbE2X - 10}" y="${Y2 + 2}" width="120" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Rollers (106 to 109)
  svg += rNrForno(tbE2X + 10, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 40, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 70, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 100, Y2 + 7.75, 6, '', 0, 0);

  // 110-116 Inline bottom rollers
  let inE2X = 780;
  for(let i=0; i<7; i++) {
    svg += rNrForno(inE2X + i*25, Y2 + 7.75, 6, '', 0, 0);
  }

  // ENROLADOR DE TIRAS
  let enrE2X = 1020;
  svg += `<text x="${enrE2X+37}" y="${Y2-45}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR DE TIRAS</text>`;
  // Curved Top Guide (Crescent shape)
  svg += `<path d="M ${enrE2X+15} ${Y2-25} Q ${enrE2X+37} ${Y2-5} ${enrE2X+60} ${Y2-25} Q ${enrE2X+37} ${Y2-15} ${enrE2X+15} ${Y2-25}" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>`;
  
  // Upper rollers (117, 119, 120, 122)
  svg += rNrForno(enrE2X, Y2 - 7.75, 6, '', 0, 0); // 117
  svg += rNrForno(enrE2X + 25, Y2 - 7.75, 6, '', 0, 0); // 119
  svg += rNrForno(enrE2X + 50, Y2 - 7.75, 6, '', 0, 0); // 120
  svg += rNrForno(enrE2X + 75, Y2 - 7.75, 6, '', 0, 0); // 122
  
  // Lower rollers (118, 121)
  svg += rNrForno(enrE2X + 25, Y2 + 7.75, 6, '', 0, 0); // 118
  svg += rNrForno(enrE2X + 50, Y2 + 7.75, 6, '', 0, 0); // 121

  // 123-125 Bottom rollers
  let trE2X = 1200;
  svg += rNrForno(trE2X, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(trE2X + 30, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(trE2X + 60, Y2 + 7.75, 6, '', 0, 0);

"""
    text = part1 + new_block + "  // Merge Bridle  // Merge Bridle (Restored Mergulhador)" + part2
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Done")
else:
    print("Markers not found")
