import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // SEÇÃO 1: ENTRADAS DUPLAS"
end_marker = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_section = """  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS (Fully Detailed Blueprint 1-73)
  // ====================================================================
  
  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="${fs}" font-weight="700" fill="${BK}" text-anchor="middle">${n}</text>`;
    out += `<line x1="${lx}" y1="${ly}" x2="${ltx}" y2="${lty}" stroke="${BK}" stroke-width="0.8"/>`;
    return out;
  }

  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="${BK}" stroke-width="1.5"/>`;
    out += `<text x="${cx}" y="${Y1-24}" font-family="sans-serif" font-size="9" font-weight="700" fill="${BK}" text-anchor="middle">${num}</text>`;
    return out;
  }

  // === ENTRADA 1 ===
  svg += `<text x="90" y="${Y1 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 1</text>`;
  
  // Bobina Principal (Outer 40, Inner 15)
  svg += `<circle cx="100" cy="${Y1 + 40}" r="40" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y1 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  
  // 1 e 2 na Bobina
  svg += rNr(60, Y1+20, 6, '1', 50, Y1+10, 52, Y1+12, 57, Y1+17);
  svg += rNr(90, Y1-6, 6, '2', 90, Y1-25, 90, Y1-23, 90, Y1-12);
  
  // 3, 4 (Pinch)
  svg += rNr(140, Y1-12, 12, '3', 140, Y1-32, 140, Y1-30, 140, Y1-24);
  svg += rNr(140, Y1+12, 12, '4', 125, Y1-5, 128, Y1-3, 133, Y1+5);
  
  // 5
  svg += rNr(165, Y1+10, 10, '5', 180, Y1-5, 176, Y1-3, 171, Y1+4);
  
  // 6-10 (Leveler)
  svg += rNr(185, Y1+5, 5, '6', 179, Y1-12, 181, Y1-10, 183, Y1);
  svg += rNr(197, Y1-5, 5, '7', 197, Y1-18, 197, Y1-16, 197, Y1-10);
  svg += rNr(209, Y1+5, 5, '8', 209, Y1-14, 209, Y1-12, 209, Y1);
  svg += rNr(221, Y1-5, 5, '9', 221, Y1-18, 221, Y1-16, 221, Y1-10);
  svg += rNr(233, Y1+5, 5, '10', 233, Y1-14, 233, Y1-12, 233, Y1);

  // 11, 12
  svg += rNr(255, Y1+5.5, 5.5, '11', 255, Y1-14, 255, Y1-12, 255, Y1);
  svg += rNr(267, Y1+5.5, 5.5, '12', 267, Y1-14, 267, Y1-12, 267, Y1);

  // 13, 14, 15
  svg += rNr(295, Y1+5.5, 5.5, '13', 295, Y1-14, 295, Y1-12, 295, Y1);
  svg += rNr(307, Y1+5.5, 5.5, '14', 307, Y1-14, 307, Y1-12, 307, Y1);
  svg += rNr(319, Y1+5.5, 5.5, '15', 319, Y1-14, 319, Y1-12, 319, Y1);

  // 16, 17, 18
  svg += rectSens(350, '16');
  svg += rectSens(370, '17');
  svg += rectSens(390, '18');

  // 19, 20 (Pinch)
  svg += rNr(430, Y1-14, 14, '19', 430, Y1-36, 430, Y1-34, 430, Y1-28);
  svg += rNr(430, Y1+14, 14, '20', 430, Y1+36, 430, Y1+34, 430, Y1+28);

  // TESOURA 1
  svg += `<text x="475" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="${BK}" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="455" y="${Y1-25}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Top
  svg += `<rect x="470" y="${Y1}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bottom
  svg += `<polygon points="470,${Y1+25} 485,${Y1+25} 515,${Y1+40} 500,${Y1+40}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Chute
  svg += `<rect x="490" y="${Y1+45}" width="35" height="50" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bin
  svg += `<path d="M 495 ${Y1+55} Q 507 ${Y1+50} 520 ${Y1+55} M 495 ${Y1+65} Q 507 ${Y1+60} 520 ${Y1+65} M 495 ${Y1+75} Q 507 ${Y1+70} 520 ${Y1+75} M 495 ${Y1+85} Q 507 ${Y1+80} 520 ${Y1+85}" fill="none" stroke="${BK}" stroke-width="0.8"/>`; // Scrap
  svg += `<polygon points="510,${Y1+70} 540,${Y1+35} 544,${Y1+39} 514,${Y1+74}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Cylinder
  svg += `<line x1="505" y1="${Y1+75}" x2="515" y2="${Y1+65}" stroke="${BK}" stroke-width="1.5"/>`; // Rod
  svg += `<line x1="505" y1="${Y1+60}" x2="505" y2="${Y1+85}" stroke="${BK}" stroke-width="1.5"/>`; // Plate

  // Table 21-26
  svg += `<rect x="535" y="${Y1}" width="85" height="16" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
  svg += `<line x1="544" y1="${Y1+39}" x2="570" y2="${Y1+16}" stroke="${BK}" stroke-width="1.2"/>`; // Connector
  let tbx = 546;
  for(let i=21; i<=26; i++) {
    svg += rNr(tbx, Y1+5.5, 5.5, i.toString(), tbx, Y1-12, tbx, Y1-10, tbx, Y1);
    tbx += 12;
  }

  // 27-31
  let brx = 630;
  for(let i=27; i<=31; i++) {
    svg += rNr(brx, Y1+5.5, 5.5, i.toString(), brx, Y1-12, brx, Y1-10, brx, Y1);
    brx += 12;
  }

  // ENROLADOR TIRAS
  svg += `<text x="718" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="718" y="${Y1-25}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">TIRAS</text>`;
  svg += `<path d="M 695 ${Y1-15} Q 718 ${Y1+2} 741 ${Y1-15}" fill="none" stroke="${BK}" stroke-width="2"/>`;
  svg += rNr(710, Y1+6, 6, '32', 710, Y1+25, 710, Y1+23, 710, Y1+12);
  svg += rNr(726, Y1+6, 6, '35', 726, Y1+25, 726, Y1+23, 726, Y1+12);
  svg += rNr(710, Y1-6, 6, '33', 698, Y1-28, 700, Y1-26, 706, Y1-10);
  svg += rNr(726, Y1-6, 6, '34', 738, Y1-28, 736, Y1-26, 730, Y1-10);

  // 36
  svg += rNr(750, Y1+5.5, 5.5, '36', 750, Y1+20, 750, Y1+18, 750, Y1+11);

  // 37-42
  let srx = 770;
  for(let i=37; i<=42; i++) {
    svg += rNr(srx, Y1+5.5, 5.5, i.toString(), srx, Y1-12, srx, Y1-10, srx, Y1, 8);
    srx += 12;
  }

  // 43 Sensor
  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<text x="${srx}" y="${Y1-15}" font-family="sans-serif" font-size="8" font-weight="700" fill="${BK}" text-anchor="middle">43</text>`;
  svg += `<line x1="${srx}" y1="${Y1-13}" x2="${srx}" y2="${Y1-6}" stroke="${BK}" stroke-width="0.8"/>`;
  srx += 12;

  // 44-72
  for(let i=44; i<=72; i++) {
    // Alternating text height slightly to avoid overlaps and mimic the angled leader lines
    let th = (i % 2 === 0) ? Y1-15 : Y1-22;
    svg += rNr(srx, Y1+5.5, 5.5, i.toString(), srx-3, th, srx-2, th+2, srx, Y1, 8);
    srx += 12;
  }

  // 73 (Large Pinch & Small Follower)
  svg += rNr(1150, Y1-18, 18, '73', 1150, Y1-45, 1150, Y1-43, 1150, Y1-36);
  svg += `<circle cx="1150" cy="${Y1+30}" r="30" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  // Small Follower
  svg += `<circle cx="1185" cy="${Y1+50}" r="6" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
  svg += `<line x1="1178" y1="${Y1+55}" x2="1170" y2="${Y1+65}" stroke="${BK}" stroke-width="1"/>`; // Spring/mount

  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 2</text>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(1150, Y1); // Go horizontally through all 73 rollers
  // Wraps between 73 rollers and slants down
  lineTo(1350, Y2); 

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
    print("Replaced SEÇÃO 1 completely successfully.")
else:
    print("Could not find markers.")
