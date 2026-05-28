import os
import re

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update <defs>
old_defs = """  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:${W}px;height:auto;display:block;background:${BG};">
  <defs>
    <radialGradient id="metalRoll" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#94a3b8"/>
      <stop offset="70%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
  </defs>`;"""

new_defs = """  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:${W}px;height:auto;display:block;background:#11141c;">
  <defs>
    <linearGradient id="metalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="25%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="75%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <radialGradient id="metalInner" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="80%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="smallMetal" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
  </defs>`;

  function rolerDecap(cx: number, cy: number, r: number, label: string = '', sub: string = '', hasStand: boolean = true) {
    let s = '';
    // Stand
    if (hasStand) {
      let sw = r * 1.5;
      let sh = r * 2.5;
      s += `<rect x="${cx - sw/2}" y="${cy + r - 5}" width="${sw}" height="${sh}" fill="#222733" rx="4"/>`;
      s += `<rect x="${cx - sw/2 - 5}" y="${cy + r - 5}" width="${sw + 10}" height="8" fill="#3b4151" rx="2"/>`;
    }
    // Rim
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#metalOuter)" stroke="#111" stroke-width="1"/>`;
    // Core
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="url(#metalInner)"/>`;
    // Ticks
    for(let i=0; i<12; i++) {
      let a = (i * 30) * Math.PI / 180;
      let x1 = cx + (r * 0.82) * Math.cos(a);
      let y1 = cy + (r * 0.82) * Math.sin(a);
      let x2 = cx + (r * 0.95) * Math.cos(a);
      let y2 = cy + (r * 0.95) * Math.sin(a);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f97316" stroke-width="2"/>`;
    }
    // Pin
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#e2e8f0"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.08}" fill="#111"/>`;
    // Label
    if (label) s += `<text x="${cx}" y="${cy - r - 22}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">${label}</text>`;
    if (sub) s += `<text x="${cx}" y="${cy - r - 8}" font-family="Montserrat, sans-serif" font-size="10" font-weight="800" fill="#fbbf24" text-anchor="middle">${sub}</text>`;
    return s;
  }
"""

text = text.replace(old_defs, new_defs)


# 2. Update rNr
old_rNr = """  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#metalRoll)" stroke="${BK}" stroke-width="0.8"/>`;
  }"""
new_rNr = """  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
  }"""
text = text.replace(old_rNr, new_rNr)


# 3. Update rectSens
old_rectSens = """  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="${BK}" stroke-width="1.5"/>`;
    return out;
  }"""
new_rectSens = """  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="#0f172a" stroke-width="1.5"/>`;
    return out;
  }"""
text = text.replace(old_rectSens, new_rectSens)


# 4. Replace Bobina 1
old_bobina1 = """  // Bobina Principal (Outer 40, Inner 15)
  svg += `<circle cx="100" cy="${Y1 + 40}" r="40" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y1 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;"""
new_bobina1 = """  // Bobina Principal (Premium CAD)
  svg += rolerDecap(100, Y1 + 40, 40, 'Defletor Entrada', '2140 mm');"""
text = text.replace(old_bobina1, new_bobina1)


# 5. Replace Tesoura 1 typography and styling to match theme
old_tesoura1 = """  let tesX = 400;
  svg += `<text x="${tesX+20}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="${BK}" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="${tesX}" y="${Y1-25}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Top
  svg += `<rect x="${tesX+15}" y="${Y1}" width="15" height="25" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bottom
  svg += `<polygon points="${tesX+15},${Y1+25} ${tesX+30},${Y1+25} ${tesX+60},${Y1+40} ${tesX+45},${Y1+40}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Chute
  svg += `<rect x="${tesX+35}" y="${Y1+45}" width="35" height="50" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Bin
  svg += `<path d="M ${tesX+40} ${Y1+55} Q ${tesX+52} ${Y1+50} ${tesX+65} ${Y1+55} M ${tesX+40} ${Y1+65} Q ${tesX+52} ${Y1+60} ${tesX+65} ${Y1+65} M ${tesX+40} ${Y1+75} Q ${tesX+52} ${Y1+70} ${tesX+65} ${Y1+75} M ${tesX+40} ${Y1+85} Q ${tesX+52} ${Y1+80} ${tesX+65} ${Y1+85}" fill="none" stroke="${BK}" stroke-width="0.8"/>`; // Scrap
  svg += `<polygon points="${tesX+55},${Y1+70} ${tesX+85},${Y1+35} ${tesX+89},${Y1+39} ${tesX+59},${Y1+74}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`; // Cylinder"""
new_tesoura1 = """  let tesX = 400;
  svg += `<text x="${tesX+20}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="${tesX}" y="${Y1-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tesX+15}" y="${Y1}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<polygon points="${tesX+15},${Y1+25} ${tesX+30},${Y1+25} ${tesX+60},${Y1+40} ${tesX+45},${Y1+40}" fill="#334155" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tesX+35}" y="${Y1+45}" width="35" height="50" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<path d="M ${tesX+40} ${Y1+55} Q ${tesX+52} ${Y1+50} ${tesX+65} ${Y1+55} M ${tesX+40} ${Y1+65} Q ${tesX+52} ${Y1+60} ${tesX+65} ${Y1+65} M ${tesX+40} ${Y1+75} Q ${tesX+52} ${Y1+70} ${tesX+65} ${Y1+75} M ${tesX+40} ${Y1+85} Q ${tesX+52} ${Y1+80} ${tesX+65} ${Y1+85}" fill="none" stroke="#64748b" stroke-width="1"/>`; 
  svg += `<polygon points="${tesX+55},${Y1+70} ${tesX+85},${Y1+35} ${tesX+89},${Y1+39} ${tesX+59},${Y1+74}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;"""
text = text.replace(old_tesoura1, new_tesoura1)


# 6. ENROLADOR TIRAS typography update
old_enrolador = """  // ENROLADOR TIRAS
  let enrX = 640;
  svg += `<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="${enrX+8}" y="${Y1-25}" font-family="Montserrat, sans-serif" font-size="10" font-weight="900" fill="${BK}" text-anchor="middle">TIRAS</text>`;
  svg += `<path d="M ${enrX-15} ${Y1-15} Q ${enrX+8} ${Y1+2} ${enrX+31} ${Y1-15}" fill="none" stroke="${BK}" stroke-width="2"/>`;"""
new_enrolador = """  // ENROLADOR TIRAS
  let enrX = 640;
  svg += `<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="${enrX+8}" y="${Y1-23}" font-family="Montserrat, sans-serif" font-size="10" font-weight="800" fill="#fbbf24" text-anchor="middle">1334 mm</text>`;
  svg += `<path d="M ${enrX-15} ${Y1-15} Q ${enrX+8} ${Y1+2} ${enrX+31} ${Y1-15}" fill="none" stroke="#64748b" stroke-width="3"/>`;"""
text = text.replace(old_enrolador, new_enrolador)

# Remove the text 43 (leftover)
old_sensor_text = """  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<text x="${srx}" y="${Y1-15}" font-family="sans-serif" font-size="8" font-weight="700" fill="${BK}" text-anchor="middle">43</text>`;
  svg += `<line x1="${srx}" y1="${Y1-13}" x2="${srx}" y2="${Y1-6}" stroke="${BK}" stroke-width="0.8"/>`;"""
new_sensor_text = """  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="#64748b" stroke-width="2"/>`;"""
text = text.replace(old_sensor_text, new_sensor_text)

# Fix fill="url(#metalRoll)" in 75-83
old_75 = """svg += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#metalRoll)" stroke="${BK}" stroke-width="0.8"/>`;"""
new_75 = """svg += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;"""
text = text.replace(old_75, new_75)


# 7. Bobina Entrada 2 and Merge Bridle
old_bobina2 = """  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 2</text>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="40" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="100" cy="${Y2 + 40}" r="15" fill="none" stroke="${BK}" stroke-width="1.5"/>`;
  // Merge Bridle (top roller large, bottom small as per drawing)
  svg += `<circle cx="1350" cy="${Y2-30}" r="30" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.5"/>`;
  svg += `<circle cx="1350" cy="${Y2+15}" r="15" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.5"/>`;"""

new_bobina2 = """  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 20}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 2</text>`;
  svg += rolerDecap(100, Y2 + 40, 40, 'Defletor Entrada', '2140 mm');
  
  // Merge Bridle (top roller large, bottom small as per drawing)
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += `<circle cx="1350" cy="${Y2+15}" r="15" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;"""
text = text.replace(old_bobina2, new_bobina2)


# Replace text ENTRADA 1
text = text.replace(
    """<text x="90" y="${Y1 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="${BK}">ENTRADA 1</text>""",
    """<text x="90" y="${Y1 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 1</text>"""
)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Premium style applied!")
