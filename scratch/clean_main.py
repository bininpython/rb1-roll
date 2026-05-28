import os

fpath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "  // ====================================================================\n  // HELPER FUNCTIONS"
end_marker = "  // ====================================================================\n  // PASS-LINE PATH TRACKING"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

new_helpers = """  // ====================================================================
  // HELPER FUNCTIONS (Absolutely Empty)
  // ====================================================================
  
  function dot(cx: number, cy: number, r: number = 4.5): string { return ''; }
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
  function tesoura3(cx: number, cy: number, label: string): string { return ''; }

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_helpers + text[end_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced all helper functions with empty versions.")
else:
    print("Could not find markers.")
