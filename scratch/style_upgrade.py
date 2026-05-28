import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update BK and SVG background
text = text.replace(
    "const BK = '#1a1a1a'; // solid black fill",
    "const BK = '#cbd5e1'; // light slate for lines\n  const BG = '#161925'; // dark background"
)
text = text.replace(
    "<svg viewBox=\"0 0 ${W} ${H}\" xmlns=\"http://www.w3.org/2000/svg\" style=\"width:${W}px;height:auto;display:block;background:#fff;\">",
    "<svg viewBox=\"0 0 ${W} ${H}\" xmlns=\"http://www.w3.org/2000/svg\" style=\"width:${W}px;height:auto;display:block;background:${BG};\">\n  <defs>\n    <radialGradient id=\"metalRoll\" cx=\"50%\" cy=\"50%\" r=\"50%\" fx=\"35%\" fy=\"35%\">\n      <stop offset=\"0%\" stop-color=\"#ffffff\"/>\n      <stop offset=\"30%\" stop-color=\"#94a3b8\"/>\n      <stop offset=\"70%\" stop-color=\"#334155\"/>\n      <stop offset=\"100%\" stop-color=\"#0f172a\"/>\n    </radialGradient>\n  </defs>"
)

# 2. Update rNr
old_rNr = """  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="${fs}" font-weight="700" fill="${BK}" text-anchor="middle">${n}</text>`;
    out += `<line x1="${lx}" y1="${ly}" x2="${ltx}" y2="${lty}" stroke="${BK}" stroke-width="0.8"/>`;
    return out;
  }"""
new_rNr = """  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#metalRoll)" stroke="${BK}" stroke-width="0.8"/>`;
  }"""
text = text.replace(old_rNr, new_rNr)

# 3. Strip numbers and leader lines from 75-83 (which I added via fix_slant_angle.py)
# Also apply url(#metalRoll) to them and to 73, 74 and the merge bridles
import re

# Replace fill="#fff" with fill="url(#metalRoll)" for circles in ENTRADA 1/2 area
# It's easier to just replace all fill="#fff" inside circles to metalRoll
text = re.sub(r'<circle([^>]+)fill="#fff"([^>]*)>', r'<circle\1fill="url(#metalRoll)"\2>', text)

# Remove the text and leader line for rollers 75-83
# Let's find the loop body
old_slant_loop = """    svg += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.2"/>`;
    
    // Normal up-right for text is (0.770, -0.638)
    let tx = px + 14 * 0.770;
    let ty = py - 14 * 0.638;
    svg += `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="8" font-weight="700" fill="${BK}" text-anchor="middle">${i}</text>`;
    
    // Leader line from line to text
    let lx1 = px + 2 * 0.770;
    let ly1 = py - 2 * 0.638;
    let lx2 = px + 10 * 0.770;
    let ly2 = py - 10 * 0.638;
    svg += `<line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="${BK}" stroke-width="0.8"/>`;"""

new_slant_loop = """    svg += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#metalRoll)" stroke="${BK}" stroke-width="0.8"/>`;"""
text = text.replace(old_slant_loop, new_slant_loop)

# 4. Strip numbers from rectSens (16, 17, 18)
old_rectSens = """  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="${BK}" stroke-width="1.5"/>`;
    out += `<text x="${cx}" y="${Y1-24}" font-family="sans-serif" font-size="9" font-weight="700" fill="${BK}" text-anchor="middle">${num}</text>`;
    return out;
  }"""
new_rectSens = """  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="url(#metalRoll)" stroke="${BK}" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="${BK}" stroke-width="1.5"/>`;
    return out;
  }"""
text = text.replace(old_rectSens, new_rectSens)
# Replace fill="#fff" in rectSens if it was missed
text = text.replace('<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="#fff"', '<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="url(#metalRoll)"')


# 5. Apply orange dashed stripPath
old_strip = "svg += `<path d=\"${stripPath}\" fill=\"none\" stroke=\"${BK}\" stroke-width=\"1.8\"/>`;"
new_strip = """svg += `<path d="${stripPath}" fill="none" stroke="#f97316" stroke-width="3"/>`;
  svg += `<path d="${stripPath}" fill="none" stroke="#fff" stroke-dasharray="8 12" stroke-width="1.5"/>`;"""
text = text.replace(old_strip, new_strip)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Visual upgrade complete.")
