import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    main_content = f.read()

start_marker = "  // ====================================================================\n  // HELPER FUNCTIONS (Heavy Engineering Style)\n  // ===================================================================="
end_marker = "  // ====================================================================\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO\n  // ===================================================================="

start_idx = main_content.find(start_marker)
end_idx = main_content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers.")
else:
    new_content = """  // ====================================================================
  // HELPER FUNCTIONS (Minimalist Solid Black Style)
  // ====================================================================
  
  function dot(cx: number, cy: number, r: number = 4.5): string {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
  }
  
  // Entrada 1 Coil: Solid black with white center dot
  function solidCoilE1(cx: number, cy: number, r: number): string {
    let c = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#fff"/>`;
    return c;
  }
  
  // Entrada 2 Coil: Solid black, large white ring, black center dot
  function solidCoilE2(cx: number, cy: number, r: number, label: string): string {
    let c = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#fff"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="${BK}"/>`;
    c += `<text x="${cx}" y="${cy + r + 25}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
    return c;
  }
  
  // Vertical bars (hollow for E1)
  function oVertBars(x: number, cy: number, count: number): string {
    let b = '';
    for (let i = 0; i < count; i++) {
      b += `<rect x="${x + i * 14}" y="${cy - 12}" width="6" height="24" fill="#fff" stroke="${BK}" stroke-width="1.8"/>`;
    }
    return b;
  }

  // Vertical bars (solid for E2)
  function vertBars(x: number, cy: number, count: number): string {
    let b = '';
    for (let i = 0; i < count; i++) {
      b += `<rect x="${x + i * 16}" y="${cy - 15}" width="8" height="30" fill="${BK}"/>`;
    }
    return b;
  }
  
  // Tesoura 1 (Tower style)
  function tesoura1(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 12}" y="${cy - 35}" width="24" height="25" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Top block
    s += `<rect x="${cx - 12}" y="${cy - 10}" width="24" height="20" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Middle block
    s += `<rect x="${cx - 12}" y="${cy + 10}" width="24" height="20" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Lower block
    s += `<rect x="${cx - 18}" y="${cy + 30}" width="36" height="30" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Base block
    s += `<rect x="${cx - 4}" y="${cy - 45}" width="8" height="10" fill="${BK}"/>`; // Top pin
    s += `<text x="${cx}" y="${cy - 52}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
    return s;
  }

  // Tesoura 2 (Minimalist)
  function tesoura2(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 4}" y="${cy - 15}" width="8" height="15" fill="${BK}"/>`; // Top blade
    s += `<rect x="${cx}" y="${cy + 5}" width="6" height="15" fill="${BK}"/>`; // Bottom blade
    s += `<line x1="${cx + 3}" y1="${cy + 20}" x2="${cx + 25}" y2="${cy + 40}" stroke="${BK}" stroke-width="2"/>`; // Arm
    s += `<line x1="${cx + 9}" y1="${cy + 20}" x2="${cx + 31}" y2="${cy + 40}" stroke="${BK}" stroke-width="2"/>`; // Arm
    s += `<rect x="${cx + 20}" y="${cy + 40}" width="20" height="25" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Base
    s += `<text x="${cx}" y="${cy - 25}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
    return s;
  }
  
  // Calandra Trapezoid Base
  function enroladorTrapezoid(cx: number, cy: number, label: string): string {
    let e = '';
    e += `<path d="M ${cx - 20} ${cy - 12} Q ${cx} ${cy+8} ${cx + 20} ${cy - 12}" fill="none" stroke="${BK}" stroke-width="2"/>`; // Crescent
    e += dot(cx - 8, cy - 2, 4); // left internal roller
    e += dot(cx + 8, cy - 2, 4); // right internal roller
    e += `<polygon points="${cx - 10},${cy + 10} ${cx + 10},${cy + 10} ${cx + 25},${cy + 35} ${cx - 25},${cy + 35}" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`; // Trapezoid base
    e += `<text x="${cx}" y="${cy - 22}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
    return e;
  }

  // Tesoura Table Triangle Base
  function tesouraTable(x: number, y: number, length: number): string {
    let t = '';
    t += `<rect x="${x}" y="${y}" width="${length}" height="6" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    t += `<polygon points="${x + length/2},${y + 6} ${x + length},${y + 6} ${x + length/2},${y + 35}" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    return t;
  }

  // Other components rest of the line:
  function solidCoil(cx: number, cy: number, r: number, label: string): string {
    let c = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#fff"/>`;
    c += `<text x="${cx}" y="${cy + r + 20}" text-anchor="middle" ${FSL} font-size="9" font-weight="700" fill="${BK}">${label}</text>`;
    return c;
  }
  function donutCoil(cx: number, cy: number, r: number, label: string): string {
    return solidCoilE2(cx, cy, r, label);
  }
  function enroladorCrescent(cx: number, cy: number, label: string): string {
    return enroladorTrapezoid(cx, cy, label);
  }
  function startPlatform(x: number, y: number, w: number, h: number): string {
    return tesouraTable(x, y, w);
  }

  // Máquina de Solda
  function maqSolda(cx: number, cy: number): string {
    let m = '';
    m += `<rect x="${cx - 16}" y="${cy - 25}" width="32" height="50" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    m += `<rect x="${cx - 6}" y="${cy - 38}" width="12" height="15" fill="${BK}"/>`;
    m += `<rect x="${cx - 10}" y="${cy - 18}" width="20" height="10" fill="none" stroke="${BK}" stroke-width="0.8"/>`;
    m += dot(cx - 5, cy - 13, 2);
    m += dot(cx + 5, cy - 13, 2);
    m += `<line x1="${cx - 12}" y1="${cy + 25}" x2="${cx - 18}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${cx + 12}" y1="${cy + 25}" x2="${cx + 18}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${cx - 18}" y1="${cy + 42}" x2="${cx + 18}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<rect x="${cx - 30}" y="${cy + 42}" width="60" height="35" rx="5" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    m += `<text x="${cx}" y="${cy - 48}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">MÁQUINA DE SOLDA</text>`;
    return m;
  }

  // Secador Losango
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string {
    let s = '';
    s += `<polygon points="${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<circle cx="${cx - w/2}" cy="${cy}" r="4" fill="${BK}"/>`;
    s += `<circle cx="${cx + w/2}" cy="${cy}" r="4" fill="${BK}"/>`;
    s += `<text x="${cx}" y="${cy - h/2 - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // Corretor Cruz
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string {
    let s = '';
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="${BK}"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="${BK}"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // Tanque Retangular
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string {
    let t = '';
    t += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    rollers.forEach(rx => {
      t += dot(x + rx, y + h/2, 8);
    });
    t += `<text x="${x + w/2}" y="${y - 10}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">${label}</text>`;
    return t;
  }

  function blocoQuad(cx: number, cy: number, size: number, label: string): string {
    let b = '';
    b += `<rect x="${cx - size/2}" y="${cy - size/2}" width="${size}" height="${size}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    b += dot(cx, cy, size/4);
    b += `<text x="${cx}" y="${cy - size/2 - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return b;
  }

  function mesaInspecao(x: number, y: number, w: number): string {
    let m = '';
    m += `<rect x="${x}" y="${y}" width="${w}" height="10" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${x+10}" y1="${y+10}" x2="${x+10}" y2="${y+30}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${x+w-10}" y1="${y+10}" x2="${x+w-10}" y2="${y+30}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<text x="${x + w/2}" y="${y - 15}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">MESA DE INSPEÇÃO</text>`;
    return m;
  }
  
  function tesoura3(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 15}" y="${cy - 50}" width="30" height="90" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<rect x="${cx - 15}" y="${cy - 5}" width="30" height="10" fill="${BK}"/>`;
    s += `<rect x="${cx - 4}" y="${cy - 50}" width="8" height="45" fill="${BK}"/>`;
    s += `<text x="${cx}" y="${cy - 58}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // ====================================================================
  // PASS-LINE PATH TRACKING
  // ====================================================================
  let stripPath = "M 100 170 ";
  function lineTo(x: number, y: number) { stripPath += `L ${x} ${y} `; }
  function curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    stripPath += `C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y} `;
  }

  const Y1 = 170;
  const Y2 = 450;
  const YM = 280;

  svg += `<text x="40" y="${Y1 - 90}" ${FSL} font-size="14" font-weight="800" fill="${BK}">ENTRADA 1</text>`;
  svg += `<line x1="40" y1="${Y1 - 85}" x2="160" y2="${Y1 - 85}" stroke="${BK}" stroke-width="2"/>`;

  svg += `<text x="40" y="${Y2 - 90}" ${FSL} font-size="14" font-weight="800" fill="${BK}">ENTRADA 2</text>`;
  svg += `<line x1="40" y1="${Y2 - 85}" x2="160" y2="${Y2 - 85}" stroke="${BK}" stroke-width="2"/>`;

  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS (Minimalist Positioning from Image)
  // ====================================================================
  
  // === ENTRADA 1 ===
  svg += solidCoilE1(100, Y1, 40);
  svg += dot(100, Y1 - 45, 4); // Top roller
  
  // 1 small roller
  svg += dot(150, Y1, 4);
  
  // 2 large pinch rollers
  svg += dot(180, Y1 - 10, 10); svg += dot(180, Y1 + 10, 10);
  
  // 2 small rollers
  svg += dot(220, Y1 - 6, 4); svg += dot(220, Y1 + 6, 4);
  
  // Leveler (2 top, 3 bottom)
  svg += dot(255, Y1 - 5, 4); svg += dot(275, Y1 - 5, 4);
  svg += dot(245, Y1 + 5, 4); svg += dot(265, Y1 + 5, 4); svg += dot(285, Y1 + 5, 4);
  
  // Table (5 bottom)
  for(let i=0; i<5; i++) svg += dot(330 + i*18, Y1 + 5, 4);
  
  // 3 hollow vertical bars
  svg += oVertBars(440, Y1, 3);
  
  // 1 small bottom roller
  svg += dot(490, Y1 + 5, 4);
  
  // Tesoura 1 Tower
  svg += tesoura1(530, Y1, 'Tesouara 1');
  
  // Table attached to tesoura (6 rollers) with triangle base
  svg += tesouraTable(545, Y1 + 2, 75);
  for(let i=0; i<6; i++) svg += dot(552 + i*12, Y1, 4);
  
  // Table of 10 bottom rollers
  for(let i=0; i<10; i++) svg += dot(640 + i*16, Y1 + 5, 4);
  
  // Enrolador de tiras (trapezoid base)
  svg += enroladorTrapezoid(820, Y1 - 5, 'Enrolador de tiras');
  
  // 2 small bottom rollers
  svg += dot(870, Y1 + 5, 4); svg += dot(890, Y1 + 5, 4);
  
  // 2 large pull rollers
  svg += dot(930, Y1 - 12, 12); svg += dot(930, Y1 + 12, 12);
  lineTo(930, Y1);
  lineTo(1050, YM); // descend
  
  // 8 diagonal rollers down
  for(let i=0; i<8; i++) {
    svg += dot(945 + i*13.5, Y1 + 15 + i*(YM-Y1-30)/8, 4);
  }

  // === ENTRADA 2 ===
  let p2 = `M 100 ${Y2} `;
  svg += solidCoilE2(100, Y2, 40, 'BOBINA 2');
  // 3 rollers around coil
  svg += dot(70, Y2 - 35, 6); svg += dot(110, Y2 - 45, 6); svg += dot(145, Y2 + 30, 8);
  
  // 2 small rollers
  svg += dot(200, Y2 - 6, 4); svg += dot(200, Y2 + 6, 4);
  // 2 small rollers
  svg += dot(240, Y2 - 6, 4); svg += dot(240, Y2 + 6, 4);
  
  // Leveler (2 top, 3 bottom)
  svg += dot(285, Y2 - 5, 4); svg += dot(305, Y2 - 5, 4);
  svg += dot(275, Y2 + 5, 4); svg += dot(295, Y2 + 5, 4); svg += dot(315, Y2 + 5, 4);
  
  // Table (5 bottom)
  for(let i=0; i<5; i++) svg += dot(360 + i*18, Y2 + 5, 4);
  
  // 3 solid vertical bars
  svg += vertBars(470, Y2, 3);
  
  // 2 small rollers
  svg += dot(530, Y2 - 6, 4); svg += dot(530, Y2 + 6, 4);
  
  // Tesoura 2
  svg += tesoura2(570, Y2, 'TESOURA 2');
  
  // 4 bottom rollers
  for(let i=0; i<4; i++) svg += dot(610 + i*15, Y2 + 5, 4);
  
  // 7 hollow rollers (in the image they are hollow! wait, some are hollow, some are solid)
  // Image shows 7 solid rollers!
  for(let i=0; i<7; i++) {
    svg += dot(690 + i*15, Y2 + 5, 4);
  }
  
  // Calandra 2
  svg += enroladorTrapezoid(820, Y2 - 5, 'CALANDRA 2');
  // 3 solid rollers
  for(let i=0; i<3; i++) {
    svg += dot(870 + i*15, Y2 + 5, 4);
  }
  
  // 2 HUGE solid pull rollers
  svg += dot(950, Y2 - 16, 16); svg += dot(950, Y2 + 16, 16);
  
  // 8 small solid rollers
  for(let i=0; i<8; i++) svg += dot(1000 + i*15, Y2 + 5, 4);
  
  // 2 small pinch corner rollers
  svg += dot(1140, Y2 - 6, 4); svg += dot(1140, Y2 + 6, 4);
  
  p2 += `L 1140 ${Y2} L 1220 ${YM} `;
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  stripPath += `L 1220 ${YM} `;

"""
    final_content = main_content[:start_idx] + new_content + "\n" + main_content[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(final_content)
    print("Replaced section successfully.")
