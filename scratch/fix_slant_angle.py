import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // TESOURA 1"
end_marker = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // TESOURA 1
  let tesX = 400;
  svg += `<text x="${tesX+20}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="${BK}" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="${tesX}" y="${Y1-25}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Top
  svg += `<rect x="${tesX+15}" y="${Y1}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bottom
  svg += `<polygon points="${tesX+15},${Y1+25} ${tesX+30},${Y1+25} ${tesX+60},${Y1+40} ${tesX+45},${Y1+40}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Chute
  svg += `<rect x="${tesX+35}" y="${Y1+45}" width="35" height="50" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bin
  svg += `<path d="M ${tesX+40} ${Y1+55} Q ${tesX+52} ${Y1+50} ${tesX+65} ${Y1+55} M ${tesX+40} ${Y1+65} Q ${tesX+52} ${Y1+60} ${tesX+65} ${Y1+65} M ${tesX+40} ${Y1+75} Q ${tesX+52} ${Y1+70} ${tesX+65} ${Y1+75} M ${tesX+40} ${Y1+85} Q ${tesX+52} ${Y1+80} ${tesX+65} ${Y1+85}" fill="none" stroke="${BK}" stroke-width="0.8"/>`; // Scrap
  svg += `<polygon points="${tesX+55},${Y1+70} ${tesX+85},${Y1+35} ${tesX+89},${Y1+39} ${tesX+59},${Y1+74}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Cylinder
  svg += `<line x1="${tesX+50}" y1="${Y1+75}" x2="${tesX+60}" y2="${Y1+65}" stroke="${BK}" stroke-width="1.5"/>`; // Rod
  svg += `<line x1="${tesX+50}" y1="${Y1+60}" x2="${tesX+50}" y2="${Y1+85}" stroke="${BK}" stroke-width="1.5"/>`; // Plate

  // Table 21-26
  let tabX = 490;
  svg += `<rect x="${tabX-10}" y="${Y1}" width="70" height="16" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
  svg += `<line x1="${tesX+89}" y1="${Y1+39}" x2="${tabX+20}" y2="${Y1+16}" stroke="${BK}" stroke-width="1.2"/>`; // Connector
  let tbx = tabX;
  for(let i=21; i<=26; i++) {
    svg += rNr(tbx, Y1+5, 5, i.toString(), tbx, Y1-12, tbx, Y1-10, tbx, Y1);
    tbx += 10;
  }

  // 27-31
  let brx = 570;
  for(let i=27; i<=31; i++) {
    svg += rNr(brx, Y1+5, 5, i.toString(), brx, Y1-12, brx, Y1-10, brx, Y1);
    brx += 10;
  }

  // ENROLADOR TIRAS
  let enrX = 640;
  svg += `<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="${enrX+8}" y="${Y1-25}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">TIRAS</text>`;
  svg += `<path d="M ${enrX-15} ${Y1-15} Q ${enrX+8} ${Y1+2} ${enrX+31} ${Y1-15}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  svg += rNr(enrX, Y1+6, 6, '32', enrX, Y1+25, enrX, Y1+23, enrX, Y1+12);
  svg += rNr(enrX+16, Y1+6, 6, '35', enrX+16, Y1+25, enrX+16, Y1+23, enrX+16, Y1+12);
  svg += rNr(enrX, Y1-6, 6, '33', enrX-12, Y1-28, enrX-10, Y1-26, enrX-4, Y1-10);
  svg += rNr(enrX+16, Y1-6, 6, '34', enrX+28, Y1-28, enrX+26, Y1-26, enrX+20, Y1-10);

  // 36
  svg += rNr(680, Y1+5, 5, '36', 680, Y1+20, 680, Y1+18, 680, Y1+10);

  // 37-42
  let srx = 700;
  for(let i=37; i<=42; i++) {
    svg += rNr(srx, Y1+5, 5, i.toString(), srx, Y1-12, srx, Y1-10, srx, Y1, 8);
    srx += 10;
  }

  // 43 Sensor
  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<text x="${srx}" y="${Y1-15}" font-family="sans-serif" font-size="8" font-weight="700" fill="${BK}" text-anchor="middle">43</text>`;
  svg += `<line x1="${srx}" y1="${Y1-13}" x2="${srx}" y2="${Y1-6}" stroke="${BK}" stroke-width="0.8"/>`;
  srx += 10;

  // 44-72
  for(let i=44; i<=72; i++) {
    let th = (i % 2 === 0) ? Y1-15 : Y1-22;
    svg += rNr(srx, Y1+5, 5, i.toString(), srx-3, th, srx-2, th+2, srx, Y1, 8);
    srx += 10;
  }
  // Now srx is at 700 + 6*10 + 10 + 29*10 = 1060 (actually, loop runs 29 times, adds 10 at the end, so srx=1060, roller 72 is at 1050).
  // So roller 72 is at 1050.

  // 73 and 74 (Large Pinch)
  let pX = 1090; // perfectly spaced after roller 72 at 1050
  svg += rNr(pX, Y1-18, 18, '73', pX, Y1-45, pX, Y1-43, pX, Y1-36);
  svg += rNr(pX, Y1+30, 30, '74', pX, Y1+70, pX, Y1+68, pX, Y1+60);

  // Slant geometry
  // C1 = 1090, 200, R=30. Dest = 1350, 450.
  // Tangent point on C1 right side:
  // dx = 1350 - 1090 = 260
  // dy = 450 - 200 = 250
  // L = sqrt(260^2 + 250^2) = sqrt(67600 + 62500) = sqrt(130100) = 360.7
  // Angle = atan2(250, 260) = 43.88 degrees! (PERFECT 40-45 degree natural slant!)
  // Tangent offset: 
  // R^2*dx = 900*260 = 234000
  // R*dy*sqrt(L^2-R^2) = 30 * 250 * sqrt(130100-900) = 7500 * 359.4 = 2695829
  // R^2*dy = 900*250 = 225000
  // R*dx*sqrt = 30 * 260 * 359.4 = 2803664
  // tx = 1090 + (234000 + 2695829)/130100 = 1090 + 22.5 = 1112.5
  // ty = 200 + (225000 - 2803664)/130100 = 200 - 19.8 = 180.2
  // Let's use 1112.5, 180.2
  
  // 75-83 (Rollers on slant)
  let ds = 25;
  for (let i=75; i<=83; i++) {
    // ux = 260/360.7 = 0.720, uy = 250/360.7 = 0.693
    // px = 1112.5 + ds * 0.720
    // py = 180.2 + ds * 0.693
    let px = 1112.5 + ds * 0.720; 
    let py = 180.2 + ds * 0.693; 
    // Normal down-left is (-0.693, 0.720)
    let cx = px - 5.5 * 0.693;
    let cy = py + 5.5 * 0.720;
    svg += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    let tx = px + 12;
    let ty = py - 12;
    svg += `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="8" font-weight="700" fill="${BK}" text-anchor="middle">${i}</text>`;
    svg += `<line x1="${px+8}" y1="${py-8}" x2="${px+2}" y2="${py-2}" stroke="${BK}" stroke-width="0.8"/>`;
    ds += 35; // increased spacing because slant is longer
  }

  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 2</text>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  // Merge Bridle (top roller large, bottom small as per drawing)
  svg += `<circle cx="1350" cy="${Y2-30}" r="30" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="1350" cy="${Y2+15}" r="15" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(pX, Y1); 
  // Wrap around 74 to tangent point
  stripPath += `A 30 30 0 0 1 1112.5 180.2 `; 
  // Slant down over rollers 75-83
  lineTo(1350, Y2); 

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 1350 ${Y2} `; 
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  
  // After merging at 1350, Y2, stripPath continues along Y2 (which is YM)
  lineTo(1400, YM);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_section + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced SEÇÃO 1 completely successfully.")
else:
    print("Could not find markers.")
