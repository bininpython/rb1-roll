import os
import re

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update <defs> to include greenGlow filter
old_defs_start = """  <defs>
    <style>"""

new_defs_start = """  <defs>
    <style>
      .spin-slow { animation: spin 4s linear infinite; }
      .spin-fast { animation: spin 1.5s linear infinite; }
      .strip-anim { animation: dashMove 0.8s linear infinite; }
      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes dashMove { to { stroke-dashoffset: -20; } }
    </style>
    <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>"""

parts = text.split("function renderRb1Completa()")
if len(parts) > 1:
    parts[1] = parts[1].replace(old_defs_start, new_defs_start, 1)

# 2. Update rolerDecap
old_roler = """  function rolerDecap(cx: number, cy: number, r: number, label: string = '', sub: string = '', hasStand: boolean = true) {
    let s = '';
    // Stand
    if (hasStand) {
      let sw = r * 1.5;
      let sh = r * 2.5;
      s += `<rect x="${cx - sw/2}" y="${cy + r - 5}" width="${sw}" height="${sh}" fill="#222733" rx="4"/>`;
      s += `<rect x="${cx - sw/2 - 5}" y="${cy + r - 5}" width="${sw + 10}" height="8" fill="#3b4151" rx="2"/>`;
    }
    // Animated Core
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
    // Pin
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#e2e8f0"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.08}" fill="#111"/>`;
    // Label
    if (label) s += `<text x="${cx}" y="${cy - r - 22}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">${label}</text>`;
    if (sub) s += `<text x="${cx}" y="${cy - r - 8}" font-family="Montserrat, sans-serif" font-size="10" font-weight="800" fill="#fbbf24" text-anchor="middle">${sub}</text>`;
    return s;
  }"""

new_roler = """  function rolerDecap(cx: number, cy: number, r: number, label: string = '', sub: string = '', hasStand: boolean = true) {
    let s = '';
    // Stand Forno Style
    let sh = 30;
    if (hasStand) {
      let sw = r * 1.2;
      s += `<rect x="${cx - sw/2}" y="${cy + r - 2}" width="${sw}" height="${sh}" fill="#374151" rx="2"/>`;
      s += `<rect x="${cx - sw/2 - 5}" y="${cy + r + sh - 8}" width="${sw + 10}" height="8" fill="#4b5563" rx="2"/>`;
    }
    
    // Core (Dark) + Outer Glow (Green)
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="3" filter="url(#greenGlow)"/>`;
    
    // Animated Inner Dashed Ring
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" class="spin-slow" style="transform-origin: ${cx}px ${cy}px"/>`;
    
    // Center Text (Number / Dot)
    s += `<circle cx="${cx}" cy="${cy}" r="3" fill="#22c55e"/>`;

    // Typography (Stacked Below)
    if (label) {
      let textY = hasStand ? cy + r + sh + 15 : cy + r + 15;
      s += `<text x="${cx}" y="${textY}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>`;
      if (sub) {
        s += `<text x="${cx}" y="${textY + 12}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="bold" fill="#22c55e" text-anchor="middle">${sub}</text>`;
        s += `<text x="${cx}" y="${textY + 23}" font-family="JetBrains Mono, monospace" font-size="8" fill="#9ca3af" text-anchor="middle">2140mm</text>`;
      }
    }
    return s;
  }"""

if len(parts) > 1:
    parts[1] = parts[1].replace(old_roler, new_roler, 1)

# 3. Update dot function (Small Rollers)
old_dot = """  function dot(cx: number, cy: number, r: number = 4.5): string { 
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#smallMetal)" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`; 
  }"""

new_dot = """  function dot(cx: number, cy: number, r: number = 4.5): string { 
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    return s;
  }"""

if len(parts) > 1:
    parts[1] = parts[1].replace(old_dot, new_dot, 1)

# 4. Update the stripPath to the Forno style (Translucent white/grey glowing line)
old_strip = """  // Apply the path
  svg += `<path d="${stripPath}" fill="none" stroke="#f97316" stroke-width="3"/>`;
  svg += `<path d="${stripPath}" fill="none" stroke="#ffffff" stroke-dasharray="4 16" stroke-width="2" class="strip-anim"/>`;"""

new_strip = """  // Apply the path (Forno Glowing Strip)
  svg += `<path d="${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>`;
  svg += `<path d="${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;"""

if len(parts) > 1:
    parts[1] = parts[1].replace(old_strip, new_strip, 1)
    
    # Rejoin parts
    text = "function renderRb1Completa()".join(parts)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Forno aesthetic applied to RB1 GERAL successfully!")
