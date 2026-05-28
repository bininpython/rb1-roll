// ===== RB1 COMPLETA — Technical Industrial Diagram =====
function renderRb1Completa() {
  const W = 12000, H = 700;
  const BK = '#1a1a1a'; // solid black fill
  const LK = '#1a1a1a'; // line color
  const SW = '1.2';      // stroke-width
  const FS = 'font-family="JetBrains Mono, monospace"';
  const FSL = 'font-family="Montserrat, sans-serif"';
  
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:${W}px;height:auto;display:block;background:#fff;">`;
  
  // ====================================================================
  // HELPER FUNCTIONS (Heavy Engineering Style)
  // ====================================================================
  
  // Solid filled roller
  function dot(cx: number, cy: number, r: number = 5): string {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
  }
  
  // Large input coil — solid style
  function solidCoil(cx: number, cy: number, r: number, label: string): string {
    let c = '';
    c += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#fff"/>`;
    c += `<text x="${cx}" y="${cy + r + 20}" text-anchor="middle" ${FSL} font-size="9" font-weight="700" fill="${BK}">${label}</text>`;
    return c;
  }
  
  // Large input coil — hollow "donut" style
  function donutCoil(cx: number, cy: number, r: number, label: string): string {
    let c = '';
    c += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BK}"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="#fff"/>`;
    c += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="${BK}"/>`;
    c += `<text x="${cx}" y="${cy + r + 20}" text-anchor="middle" ${FSL} font-size="9" font-weight="700" fill="${BK}">${label}</text>`;
    return c;
  }
  
  // Solid vertical bars group
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 5, w: number = 3): string {
    let b = '';
    for (let i = 0; i < count; i++) {
      b += `<rect x="${x + i * spacing}" y="${cy - h/2}" width="${w}" height="${h}" fill="${BK}"/>`;
    }
    return b;
  }

  // Unfilled vertical bars group
  function oVertBars(x: number, cy: number, count: number, h: number = 25, spacing: number = 10, w: number = 5): string {
    let b = '';
    for (let i = 0; i < count; i++) {
      b += `<rect x="${x + i * spacing}" y="${cy - h/2}" width="${w}" height="${h}" fill="#fff" stroke="${BK}" stroke-width="1.8"/>`;
    }
    return b;
  }
  
  // Tesoura 1
  function tesoura1(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 10}" y="${cy - 30}" width="20" height="55" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<line x1="${cx - 10}" y1="${cy - 10}" x2="${cx + 10}" y2="${cy - 10}" stroke="${BK}" stroke-width="2.5"/>`;
    s += `<line x1="${cx - 10}" y1="${cy + 10}" x2="${cx + 10}" y2="${cy + 10}" stroke="${BK}" stroke-width="2.5"/>`;
    s += `<rect x="${cx - 3}" y="${cy - 42}" width="6" height="14" fill="${BK}"/>`;
    s += `<line x1="${cx - 6}" y1="${cy + 25}" x2="${cx - 12}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    s += `<line x1="${cx + 6}" y1="${cy + 25}" x2="${cx + 12}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    s += `<line x1="${cx - 12}" y1="${cy + 42}" x2="${cx + 12}" y2="${cy + 42}" stroke="${BK}" stroke-width="1.5"/>`;
    s += `<rect x="${cx - 15}" y="${cy + 42}" width="30" height="35" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<text x="${cx}" y="${cy - 48}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // Tesoura 2
  function tesoura2(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 6}" y="${cy - 20}" width="12" height="20" fill="${BK}"/>`;
    s += `<rect x="${cx}" y="${cy + 5}" width="10" height="15" fill="${BK}"/>`;
    s += `<line x1="${cx + 5}" y1="${cy + 20}" x2="${cx + 30}" y2="${cy + 40}" stroke="${BK}" stroke-width="1.5"/>`;
    s += `<line x1="${cx + 10}" y1="${cy + 20}" x2="${cx + 35}" y2="${cy + 40}" stroke="${BK}" stroke-width="1.5"/>`;
    s += `<rect x="${cx + 25}" y="${cy + 40}" width="20" height="25" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<text x="${cx}" y="${cy - 30}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // Tesoura 3 (Guilhotina Saida)
  function tesoura3(cx: number, cy: number, label: string): string {
    let s = '';
    s += `<rect x="${cx - 15}" y="${cy - 50}" width="30" height="90" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<rect x="${cx - 15}" y="${cy - 5}" width="30" height="10" fill="${BK}"/>`;
    s += `<rect x="${cx - 4}" y="${cy - 50}" width="8" height="45" fill="${BK}"/>`;
    s += `<text x="${cx}" y="${cy - 58}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }
  
  // Enrolador de Tiras (Crescent shape)
  function enroladorCrescent(cx: number, cy: number, label: string): string {
    let e = '';
    e += `<path d="M ${cx - 20} ${cy - 15} Q ${cx} ${cy+5} ${cx + 20} ${cy - 15}" fill="none" stroke="${BK}" stroke-width="2"/>`;
    e += dot(cx - 6, cy - 2, 4);
    e += dot(cx + 6, cy - 2, 4);
    e += `<path d="M ${cx - 10} ${cy + 5} L ${cx - 20} ${cy + 25} L ${cx + 20} ${cy + 25} L ${cx + 10} ${cy + 5} Z" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
    e += `<text x="${cx}" y="${cy - 25}" text-anchor="middle" ${FSL} font-size="9" font-weight="700" fill="${BK}">${label}</text>`;
    return e;
  }

  // Platform structure
  function startPlatform(x: number, y: number, w: number, h: number): string {
    let p = '';
    p += `<rect x="${x}" y="${y}" width="${w}" height="5" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    p += `<line x1="${x + w/2}" y1="${y+5}" x2="${x + w/2}" y2="${y + h}" stroke="${BK}" stroke-width="1.5"/>`;
    p += `<line x1="${x + w/2}" y1="${y + h}" x2="${x + w}" y2="${y + 5}" stroke="${BK}" stroke-width="1.5"/>`;
    return p;
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

  // Corretor Cruz (Cross-mark roller)
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string {
    let s = '';
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="${BK}"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="${BK}"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return s;
  }

  // Tanque Retangular (Dip Tanque, Ar Neblina, Eletrolitico, Forno)
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string {
    let t = '';
    t += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    rollers.forEach(rx => {
      t += dot(x + rx, y + h/2, 8);
    });
    t += `<text x="${x + w/2}" y="${y - 10}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">${label}</text>`;
    return t;
  }

  // Escovadeira / Espremedor Quadrado
  function blocoQuad(cx: number, cy: number, size: number, label: string): string {
    let b = '';
    b += `<rect x="${cx - size/2}" y="${cy - size/2}" width="${size}" height="${size}" fill="#fff" stroke="${BK}" stroke-width="2"/>`;
    b += dot(cx, cy, size/4);
    b += `<text x="${cx}" y="${cy - size/2 - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
    return b;
  }

  // Mesa de Inspecao
  function mesaInspecao(x: number, y: number, w: number): string {
    let m = '';
    m += `<rect x="${x}" y="${y}" width="${w}" height="10" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${x+10}" y1="${y+10}" x2="${x+10}" y2="${y+30}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<line x1="${x+w-10}" y1="${y+10}" x2="${x+w-10}" y2="${y+30}" stroke="${BK}" stroke-width="1.5"/>`;
    m += `<text x="${x + w/2}" y="${y - 15}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">MESA DE INSPEÇÃO</text>`;
    return m;
  }

  // ====================================================================
  // PASS-LINE PATH TRACKING
  // ====================================================================
  // We will trace a path connecting major nodes to represent the metal strip.
  let stripPath = "M 100 170 "; // Starts at bobina 1

  // Function to add path points easily
  function lineTo(x: number, y: number) {
    stripPath += `L ${x} ${y} `;
  }
  function curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    stripPath += `C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y} `;
  }

  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS
  // ====================================================================
  const Y1 = 170;
  const Y2 = 450;
  const YM = 280;

  // Title ENTRADA 1
  svg += `<text x="40" y="${Y1 - 90}" ${FSL} font-size="14" font-weight="800" fill="${BK}">ENTRADA 1</text>`;
  svg += `<line x1="40" y1="${Y1 - 85}" x2="160" y2="${Y1 - 85}" stroke="${BK}" stroke-width="1.5"/>`;

  // Title ENTRADA 2
  svg += `<text x="40" y="${Y2 - 90}" ${FSL} font-size="14" font-weight="800" fill="${BK}">ENTRADA 2</text>`;
  svg += `<line x1="40" y1="${Y2 - 85}" x2="160" y2="${Y2 - 85}" stroke="${BK}" stroke-width="1.5"/>`;

  // === ENTRADA 1 COMPONENTS ===
  svg += solidCoil(100, Y1, 40, 'BOBINA 1');
  svg += dot(170, Y1 - 5, 4); svg += dot(170, Y1 + 5, 4); // Par guia
  svg += dot(230, Y1 - 6, 6); svg += dot(230, Y1 + 6, 6); // Par tensor
  // Nivelador
  svg += dot(300, Y1 - 4, 3); svg += dot(320, Y1 - 4, 3); svg += dot(340, Y1 - 4, 3);
  svg += dot(310, Y1 + 4, 3); svg += dot(330, Y1 + 4, 3); svg += dot(350, Y1 + 4, 3);
  // Mesa
  for (let i=0; i<5; i++) svg += dot(420 + i*18, Y1, 4);
  // Guias vert
  svg += oVertBars(540, Y1, 3, 25, 12, 6);
  svg += dot(600, Y1, 5); svg += dot(600, Y1-10, 5);
  // Tesoura 1
  svg += tesoura1(660, Y1, 'TESOURA 1');
  svg += startPlatform(680, Y1, 60, 40);
  // Mesa após tesoura
  for (let i=0; i<8; i++) svg += dot(700 + i*14, Y1, 4);
  // Esteira contínua
  for (let i=0; i<19; i++) svg += dot(850 + i*14, Y1, 3.5);
  // Calandra 1 (Enrolador 1)
  svg += enroladorCrescent(1150, Y1, 'CALANDRA 1');
  // Final da Entrada 1 e Descida diagonal
  svg += dot(1250, Y1, 8); svg += dot(1250, Y1 - 18, 8);
  lineTo(1250, Y1);
  lineTo(1400, YM); // Descida
  // Rampa de rolos
  for (let i=0; i<9; i++) svg += dot(1265 + i*16, Y1 + 10 + i*12.2, 4);

  // === ENTRADA 2 COMPONENTS ===
  let p2 = `M 100 ${Y2} `; // Strip for line 2
  svg += donutCoil(100, Y2, 40, 'BOBINA 2');
  svg += dot(200, Y2 - 6, 5); svg += dot(200, Y2 + 6, 5);
  svg += dot(240, Y2 - 6, 5); svg += dot(240, Y2 + 6, 5);
  // Nivelador
  svg += dot(320, Y2 - 5, 4); svg += dot(340, Y2 - 5, 4);
  svg += dot(310, Y2 + 5, 4); svg += dot(330, Y2 + 5, 4); svg += dot(350, Y2 + 5, 4);
  // Mesa
  for (let i=0; i<5; i++) svg += dot(420 + i*18, Y2, 4);
  // Guias Vert
  svg += vertBars(550, Y2, 3, 40, 15, 10);
  svg += dot(620, Y2 - 6, 5); svg += dot(620, Y2 + 6, 5);
  // Tesoura 2
  svg += tesoura2(680, Y2, 'TESOURA 2');
  // Rolos pós tesoura
  for (let i=0; i<4; i++) svg += dot(730 + i*14, Y2, 4);
  for (let i=0; i<7; i++) svg += dot(820 + i*14, Y2, 4);
  // Calandra 2
  svg += enroladorCrescent(950, Y2, 'CALANDRA 2');
  for (let i=0; i<3; i++) svg += dot(1020 + i*18, Y2, 4);
  // Pinch rolls subida
  svg += dot(1100, Y2, 12); svg += dot(1100, Y2 - 26, 12);
  for (let i=0; i<8; i++) svg += dot(1160 + i*16, Y2, 4);
  svg += dot(1320, Y2, 6); svg += dot(1320, Y2 - 14, 6);
  // P2 line construction
  p2 += `L 1100 ${Y2} L 1320 ${Y2} L 1400 ${YM}`;

  // Merge lines
  svg += `<path d="${p2}" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  stripPath += `L 1400 ${YM} `;

  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO
  // ====================================================================
  // Pista central
  svg += dot(1400, YM, 5); svg += dot(1400, YM - 12, 5);
  for (let i=0; i<12; i++) svg += dot(1430 + i*15, YM, 4);
  // Guia vert e rolos
  svg += vertBars(1640, YM, 1, 30, 0, 5);
  svg += dot(1680, YM, 5); svg += dot(1710, YM, 5);
  svg += dot(1750, YM-6, 4); svg += dot(1750, YM+6, 4);
  svg += vertBars(1790, YM, 1, 30, 0, 5);
  
  // Solda
  svg += maqSolda(1860, YM);
  
  // Conjunto 5 rolos
  svg += dot(1960, YM+5, 4); svg += dot(1980, YM+5, 4); svg += dot(2000, YM+5, 4);
  svg += dot(1970, YM-5, 4); svg += dot(1990, YM-5, 4);
  svg += dot(2040, YM, 5);
  svg += dot(2080, YM+5, 4); svg += dot(2100, YM+5, 4); svg += dot(2120, YM+5, 4);
  svg += dot(2090, YM-5, 4); svg += dot(2110, YM-5, 4);
  // Sensor
  svg += `<rect x="2160" y="${YM-8}" width="25" height="16" fill="#fff" stroke="${BK}" stroke-width="1.5"/>`;
  svg += dot(2220, YM, 5);
  // Grande estrutura processamento
  svg += tanque(2260, YM-40, 140, 80, '', [70]); // Tambor interno
  svg += dot(2430, YM-6, 5); svg += dot(2430, YM+6, 5);
  
  // Secador 1
  svg += secadorLosango(2530, YM, 100, 100, 'SECADOR 1');
  
  svg += dot(2620, YM-6, 5); svg += dot(2620, YM+6, 5);
  svg += dot(2670, YM, 5);
  // Corretor 1
  svg += corretorCruz(2750, YM, 35, 'CORRETOR 1');
  
  lineTo(2750, YM);

  // ====================================================================
  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)
  // ====================================================================
  const LYT = 120; // Loop Y Top
  const LYB = 580; // Loop Y Bottom

  svg += dot(2830, YM, 5);
  svg += dot(2880, LYT+10, 15); // Defletor
  svg += dot(2920, LYT, 6);
  svg += dot(2980, LYT, 6);
  
  lineTo(2830, YM); lineTo(2880, LYT+10); lineTo(2920, LYT); lineTo(2980, LYT);
  
  // Fosso (Pit) lines
  svg += `<line x1="3000" y1="${LYT}" x2="3000" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3000" y1="${LYB+20}" x2="3600" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="3600" y1="${LYB+20}" x2="3600" y2="${LYT}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<text x="3300" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">LOOP DE ENTRADA</text>`;
  
  // 7 grandes rolos (4 bottom, 3 top)
  const lxs = [3050, 3130, 3210, 3290, 3370, 3450, 3530];
  const lys = [LYB, LYT, LYB, LYT, LYB, LYT, LYB];
  for (let i=0; i<7; i++) {
    svg += dot(lxs[i], lys[i], 25);
    lineTo(lxs[i], lys[i]);
  }
  
  // Saída loop
  svg += dot(3650, LYT, 6);
  svg += dot(3700, LYT-10, 6); svg += dot(3700, LYT+10, 6);
  svg += dot(3750, LYT-15, 8);
  svg += dot(3800, LYT, 18); // defletor
  svg += dot(3860, YM, 8);
  
  lineTo(3650, LYT); lineTo(3700, LYT); lineTo(3750, LYT-15); lineTo(3800, LYT); lineTo(3860, YM);
  
  // ====================================================================
  // SEÇÃO 4: FORNO E RESFRIAMENTO
  // ====================================================================
  // Forno
  svg += tanque(3950, YM - 50, 600, 100, 'FORNO DE RECOZIMENTO', []);
  lineTo(4550, YM);
  
  // Ar Neblina 1
  svg += tanque(4600, YM - 40, 120, 80, 'AR NEBLINA 1', []);
  svg += dot(4760, YM, 8);
  lineTo(4760, YM);
  
  // Ar Neblina 2
  svg += tanque(4800, YM - 45, 250, 90, 'AR NEBLINA 2', [60, 190]);
  svg += dot(5090, YM, 8);
  lineTo(5090, YM);
  
  // Dip Tanque
  svg += tanque(5150, YM - 35, 300, 70, 'DIP TANQUE', []);
  lineTo(5450, YM);

  // ====================================================================
  // SEÇÃO 5: SECAGEM E LOOP INTERMEDIÁRIO
  // ====================================================================
  svg += dot(5500, YM, 6);
  svg += dot(5550, YM-8, 6); svg += dot(5550, YM+8, 6);
  lineTo(5550, YM);
  
  // Secador 2
  svg += secadorLosango(5650, YM, 90, 90, 'SECADOR 2');
  lineTo(5650, YM);
  
  // Corretor 3
  svg += corretorCruz(5800, YM, 35, 'CORRETOR 3');
  lineTo(5800, YM);
  
  // S-Roll
  svg += dot(5920, YM-30, 8);
  svg += dot(5980, YM+20, 35);
  svg += dot(6060, YM-40, 35);
  svg += dot(6140, YM, 8);
  lineTo(5920, YM-30); lineTo(5980, YM+20); lineTo(6060, YM-40); lineTo(6140, YM);
  
  // Descida para mesa
  const YD = 550; // Deep horizontal
  svg += dot(6250, YD-20, 25); // deflector
  lineTo(6250, YD-20);
  
  for (let i=0; i<3; i++) {
    svg += dot(6330 + i*30, YD, 8);
    lineTo(6330 + i*30, YD);
  }
  
  // Long gap, then 11 rollers
  lineTo(6550, YD);
  for (let i=0; i<11; i++) {
    svg += dot(6550 + i*20, YD, 6);
  }
  lineTo(6550 + 10*20, YD);
  
  // Subida
  svg += dot(6850, YD-30, 25);
  svg += dot(6950, YM, 25);
  lineTo(6850, YD-30); lineTo(6950, YM);
  
  // ====================================================================
  // SEÇÃO 6: ELETROLÍTICO E DECAPAGEM
  // ====================================================================
  svg += dot(7000, YM, 8);
  svg += dot(7080, YM-40, 30); // Deflector superior
  lineTo(7000, YM); lineTo(7080, YM-40);
  
  // Tanque Eletrolítico
  svg += tanque(7150, YM-30, 500, 60, 'TANQUE ELETROLÍTICO', [100, 250, 400]);
  lineTo(7650, YM);
  
  // Escovadeira 1
  svg += blocoQuad(7720, YM, 60, 'ESCOV. 1');
  lineTo(7720, YM);
  
  // Tanque Químico
  svg += tanque(7800, YM-30, 400, 60, 'TANQUE QUÍMICO', [150, 250]);
  lineTo(8200, YM);
  
  // Escovadeira 2
  svg += blocoQuad(8270, YM, 60, 'ESCOV. 2');
  lineTo(8270, YM);
  
  // Espremedor 4
  svg += dot(8350, YM-15, 15); svg += dot(8350, YM+15, 15);
  svg += `<text x="8350" y="${YM-40}" text-anchor="middle" ${FSL} font-size="8" font-weight="700" fill="${BK}">ESPREMEDOR 4</text>`;
  lineTo(8350, YM);
  
  // Secador 3
  svg += secadorLosango(8480, YM, 100, 100, 'SECADOR 3');
  lineTo(8480, YM);
  
  // ====================================================================
  // SEÇÃO 7: SAÍDA E BOBINAMENTO
  // ====================================================================
  for (let i=0; i<4; i++) {
    svg += dot(8600 + i*20, YM, 6);
  }
  lineTo(8660, YM);
  
  // Corretor 4
  svg += corretorCruz(8750, YM, 35, 'CORRETOR 4');
  lineTo(8750, YM);
  
  // Zigue Zague pre-loop
  svg += dot(8850, YM-20, 8);
  svg += dot(8900, YM+20, 25);
  svg += dot(8960, YM-20, 8);
  svg += dot(9020, YM+30, 8);
  svg += dot(9080, YM-30, 30);
  lineTo(8850, YM-20); lineTo(8900, YM+20); lineTo(8960, YM-20); lineTo(9020, YM+30); lineTo(9080, YM-30);
  
  // Fosso Saída
  svg += `<line x1="9150" y1="${LYT}" x2="9150" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="9150" y1="${LYB+20}" x2="9550" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="9550" y1="${LYB+20}" x2="9550" y2="${LYT}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<text x="9350" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">LOOP DE SAÍDA</text>`;
  
  const oxs = [9200, 9300, 9400, 9500];
  const oys = [LYB, LYT, LYB, LYT];
  for (let i=0; i<4; i++) {
    if (i === 3) {
      svg += corretorCruz(oxs[i], oys[i], 35, 'CORRETOR 5');
    } else {
      svg += dot(oxs[i], oys[i], 25);
    }
    lineTo(oxs[i], oys[i]);
  }
  
  // Pós loop
  svg += dot(9620, YM, 8);
  // S-Roll Saida
  svg += dot(9720, YM+30, 35);
  svg += dot(9800, YM-30, 35);
  svg += dot(9880, YM, 8);
  lineTo(9620, YM); lineTo(9720, YM+30); lineTo(9800, YM-30); lineTo(9880, YM);
  
  for (let i=0; i<4; i++) {
    svg += dot(9930 + i*20, YM, 6);
  }
  lineTo(9990, YM);
  
  // Mesa Inspecao
  svg += mesaInspecao(10050, YM, 200);
  lineTo(10250, YM);
  
  for (let i=0; i<3; i++) {
    svg += dot(10300 + i*20, YM, 6);
  }
  lineTo(10340, YM);
  
  // Tesoura 3
  svg += tesoura3(10430, YM, 'TESOURA 3');
  lineTo(10430, YM);
  
  svg += dot(10510, YM-15, 15); svg += dot(10510, YM+15, 15);
  svg += dot(10580, YM, 8);
  lineTo(10510, YM); lineTo(10580, YM);
  
  // Bobinadeira Final
  svg += solidCoil(10700, YM + 20, 60, 'BOBINADEIRA (RECOILER)');
  lineTo(10700, YM + 20);

  // Apply the path
  svg += `<path d="${stripPath}" fill="none" stroke="${BK}" stroke-width="1.8"/>`;

  // Draw background frame again to be on top if needed, or close svg
  svg += '</svg>';
  
  // Inject into DOM
  const el = document.getElementById('rb1CompletaDiagram');
  if (el) el.innerHTML = svg;

  // Legend
  const legend = document.getElementById('rb1CompletaLegend');
  if (legend) {
    legend.innerHTML = `
      <div class="legend-item">
        <div class="legend-icon"><svg width="24" height="14"><circle cx="7" cy="7" r="5" fill="#000"/></svg></div>
        <span>Rolo guia mecânico</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="16"><circle cx="14" cy="8" r="7" fill="#000"/><circle cx="14" cy="8" r="3.5" fill="#fff"/><circle cx="14" cy="8" r="1.5" fill="#000"/></svg></div>
        <span>Bobina / Mandril</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><rect x="4" y="1" width="12" height="12" fill="none" stroke="#000" stroke-width="1.5"/></svg></div>
        <span>Estrutura / Tesoura</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><path d="M 4 10 Q 14 -2 24 10" fill="none" stroke="#000" stroke-width="2"/></svg></div>
        <span>Calandra / Enrolador</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><polygon points="14,1 24,13 4,13" fill="none" stroke="#000" stroke-width="1.5"/></svg></div>
        <span>Secador / Forno Térmico</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><circle cx="14" cy="7" r="6" fill="none" stroke="#000" stroke-width="1.5"/><path d="M 14 1 A 6 6 0 0 1 20 7 L 14 7 Z" fill="#000"/><path d="M 14 13 A 6 6 0 0 1 8 7 L 14 7 Z" fill="#000"/></svg></div>
        <span>Corretor de Alinhamento</span>
      </div>
    `;
  }
}
