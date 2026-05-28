import os
import re

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

# We will replace the entire HELPER FUNCTIONS section.
start_marker = "  // ====================================================================\n  // HELPER FUNCTIONS"
end_marker = "  // ====================================================================\n  // PASS-LINE PATH TRACKING"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_helpers = """  // ====================================================================
  // HELPER FUNCTIONS (Text Only)
  // ====================================================================
  
  function dot(cx: number, cy: number, r: number = 4.5): string {
    return '';
  }
  function solidCoilE1(cx: number, cy: number, r: number): string {
    return '';
  }
  function solidCoilE2(cx: number, cy: number, r: number, label: string): string {
    return `<text x="${cx}" y="${cy + r + 25}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
  }
  function oVertBars(x: number, cy: number, count: number, h: number = 24, spacing: number = 14, w: number = 6): string {
    return '';
  }
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 16, w: number = 8): string {
    return '';
  }
  function tesoura1(cx: number, cy: number, label: string): string {
    return `<text x="${cx}" y="${cy - 52}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
  }
  function tesoura2(cx: number, cy: number, label: string): string {
    return `<text x="${cx}" y="${cy - 25}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
  }
  function enroladorTrapezoid(cx: number, cy: number, label: string): string {
    return `<text x="${cx}" y="${cy - 22}" text-anchor="middle" ${FSL} font-size="9" font-weight="800" fill="${BK}">${label}</text>`;
  }
  function tesouraTable(x: number, y: number, length: number): string {
    return '';
  }
  function solidCoil(cx: number, cy: number, r: number, label: string): string {
    return `<text x="${cx}" y="${cy + r + 20}" text-anchor="middle" ${FSL} font-size="9" font-weight="700" fill="${BK}">${label}</text>`;
  }
  function donutCoil(cx: number, cy: number, r: number, label: string): string {
    return solidCoilE2(cx, cy, r, label);
  }
  function enroladorCrescent(cx: number, cy: number, label: string): string {
    return enroladorTrapezoid(cx, cy, label);
  }
  function startPlatform(x: number, y: number, w: number, h: number): string {
    return '';
  }
  function maqSolda(cx: number, cy: number): string {
    return `<text x="${cx}" y="${cy - 48}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">MÁQUINA DE SOLDA</text>`;
  }
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string {
    return `<text x="${cx}" y="${cy - h/2 - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
  }
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string {
    return `<text x="${cx}" y="${cy - r - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
  }
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string {
    return `<text x="${x + w/2}" y="${y - 10}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">${label}</text>`;
  }
  function blocoQuad(cx: number, cy: number, size: number, label: string): string {
    return `<text x="${cx}" y="${cy - size/2 - 10}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
  }
  function mesaInspecao(x: number, y: number, w: number): string {
    return `<text x="${x + w/2}" y="${y - 15}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">MESA DE INSPEÇÃO</text>`;
  }
  function tesoura3(cx: number, cy: number, label: string): string {
    return `<text x="${cx}" y="${cy - 58}" text-anchor="middle" ${FSL} font-size="10" font-weight="700" fill="${BK}">${label}</text>`;
  }

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_helpers + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced all helper functions with text-only versions.")
else:
    print("Could not find markers.")
