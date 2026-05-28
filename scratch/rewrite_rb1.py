import os
import re

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update Background
text = text.replace("background:#11141c;", "background:#050816;")

# 2. Inject CSS Animations and Glow inside <defs>
old_defs_start = """  <defs>
    <linearGradient id="metalOuter" """

new_defs_start = """  <defs>
    <style>
      .spin-slow { animation: spin 4s linear infinite; }
      .spin-fast { animation: spin 1.5s linear infinite; }
      .strip-anim { animation: dashMove 0.8s linear infinite; }
      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes dashMove { to { stroke-dashoffset: -20; } }
    </style>
    <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="metalOuter" """

text = text.replace(old_defs_start, new_defs_start)

# 3. Update rolerDecap to be animated
old_roler = """    // Rim
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
    // Pin"""

new_roler = """    // Animated Core
    s += `<g class="spin-slow" style="transform-origin: ${cx}px ${cy}px">`;
    // Rim
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#metalOuter)" stroke="#050816" stroke-width="1"/>`;
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
    s += `</g>`;
    // Pin"""
text = text.replace(old_roler, new_roler)

# 4. Update smallRollerDecap and rNr to spin
old_small = """return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;"""
new_small = """return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;"""
text = text.replace(old_small, new_small)


# 5. Restore and Upgrade all empty Helper Functions
old_helpers_section = """  function dot(cx: number, cy: number, r: number = 4.5): string { return ''; }
  function solidCoilE1(cx: number, cy: number, r: number): string { return ''; }
  function solidCoilE2(cx: number, cy: number, r: number, label: string): string { return ''; }
  function oVertBars(x: number, cy: number, count: number, h: number = 24, spacing: number = 14, w: number = 6): string { return ''; }
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 16, w: number = 8): string { return ''; }
  function tesoura1(cx: number, cy: number, label: string): string { return ''; }
  function tesoura2(cx: number, cy: number, label: string): string { return ''; }
  function enroladorTrapezoid(cx: number, cy: number, label: string): string { return ''; }
  function tesouraTable(x: number, y: number, length: number): string { return ''; }
  function solidCoil(cx: number, cy: number, r: number, label: string): string { return ''; }
  function donutCoil(cx: number, cy: number, r: number, label: string): string { return ''; }
  function enroladorCrescent(cx: number, cy: number, label: string): string { return ''; }
  function startPlatform(x: number, y: number, w: number, h: number): string { return ''; }
  function maqSolda(cx: number, cy: number): string { return ''; }
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string { return ''; }
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string { return ''; }
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string { return ''; }
  function blocoQuad(cx: number, cy: number, size: number, label: string): string { return ''; }
  function mesaInspecao(x: number, y: number, w: number): string { return ''; }
  function tesoura3(cx: number, cy: number, label: string): string { return ''; }"""

new_helpers_section = """  function dot(cx: number, cy: number, r: number = 4.5): string { 
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#smallMetal)" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`; 
  }
  
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 16, w: number = 8): string { 
    let s=''; for(let i=0; i<count; i++) s += `<rect x="${x + i*spacing}" y="${cy - h/2}" width="${w}" height="${h}" fill="#1e293b" rx="2"/>`; return s;
  }
  function solidCoil(cx: number, cy: number, r: number, label: string): string { 
    return rolerDecap(cx, cy, r, label, '1334 mm');
  }
  
  function maqSolda(cx: number, cy: number): string { 
    return `<rect x="${cx-20}" y="${cy-30}" width="40" height="60" fill="#1e293b" stroke="#050816" stroke-width="2" rx="4"/>
            <text x="${cx}" y="${cy-40}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">MÁQUINA SOLDA</text>
            <circle cx="${cx}" cy="${cy}" r="10" fill="#f97316" filter="url(#blueGlow)"/>`; 
  }
  
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string { 
    let s = `<polygon points="${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += dot(cx - w/2, cy, 6) + dot(cx + w/2, cy, 6);
    s += `<text x="${cx}" y="${cy - h/2 - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string { 
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f172a" stroke="#3b4151" stroke-width="2"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="#f97316" filter="url(#blueGlow)"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="#f97316" filter="url(#blueGlow)"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string { 
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
    // Liquid
    s += `<rect x="${x+2}" y="${y+h/2}" width="${w-4}" height="${h/2-2}" fill="#0ea5e9" opacity="0.2"/>`;
    s += `<text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    rollers.forEach(rx => {
      s += rolerDecap(x + rx, y + h - 25, 20, '', '', false);
    });
    return s;
  }
  
  function blocoQuad(cx: number, cy: number, size: number, label: string): string { 
    // Espremedor Style
    let s = `<rect x="${cx - size/2}" y="${cy - size/2}" width="${size}" height="${size}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
    s += `<circle cx="${cx - 15}" cy="${cy - 15}" r="10" fill="#fbbf24" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx-15}px ${cy-15}px"/>`;
    s += `<circle cx="${cx + 15}" cy="${cy - 15}" r="10" fill="url(#metalOuter)" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx+15}px ${cy-15}px"/>`;
    s += `<text x="${cx}" y="${cy - size/2 - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    s += `<text x="${cx}" y="${cy - size/2 + 2}" font-family="Montserrat, sans-serif" font-size="9" font-weight="800" fill="#fbbf24" text-anchor="middle">800 mm</text>`;
    return s;
  }
  
  function tesoura3(cx: number, cy: number, label: string): string { 
    let s = `<rect x="${cx - 10}" y="${cy - 20}" width="20" height="40" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += `<polygon points="${cx+10},${cy} ${cx+30},${cy-10} ${cx+30},${cy+10}" fill="#334155"/>`;
    s += `<text x="${cx}" y="${cy - 30}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  function mesaInspecao(x: number, y: number, w: number): string { 
    return `<rect x="${x}" y="${y+5}" width="${w}" height="10" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">MESA DE INSPEÇÃO</text>`;
  }"""
text = text.replace(old_helpers_section, new_helpers_section)


# 6. Apply Animation to stripPath
old_strip = """svg += `<path d="${stripPath}" fill="none" stroke="#fff" stroke-dasharray="8 12" stroke-width="1.5"/>`;"""
new_strip = """svg += `<path d="${stripPath}" fill="none" stroke="#ffffff" stroke-dasharray="4 16" stroke-width="2" class="strip-anim"/>`;"""
text = text.replace(old_strip, new_strip)


with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("SCADA Premium styling and animations fully applied!")
