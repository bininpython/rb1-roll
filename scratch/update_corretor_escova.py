import re

def main():
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Corretor 1 replacement
    corretor1_old = """    // Quadrant Pattern
    svg += `<circle cx="${corrX}" cy="${corrY}" r="25" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
    svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY - 25} A 25 25 0 0 1 ${corrX + 25} ${corrY} Z" fill="#4ade80"/>`;
    svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY + 25} A 25 25 0 0 1 ${corrX - 25} ${corrY} Z" fill="#4ade80"/>`;
    svg += `<circle cx="${corrX}" cy="${corrY}" r="2" fill="#ffffff"/>`;
    svg += `<text x="${corrX}" y="${YM + 35}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 1</text>`;"""
    
    corretor1_new = """    // Quadrant Pattern (Refactored to corretorCruz)
    svg += corretorCruz(corrX, corrY, 25, 'CORRETOR 1', 341);"""

    content = content.replace(corretor1_old, corretor1_new)

    # Corretor 2 replacement
    corretor2_old = """    svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="30" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
    svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y - 30} A 30 30 0 0 1 ${corr2X + 30} ${corr2Y} Z" fill="#4ade80"/>`;
    svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y + 30} A 30 30 0 0 1 ${corr2X - 30} ${corr2Y} Z" fill="#4ade80"/>`;
    svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="2" fill="#ffffff"/>`;
    svg += `<text x="${corr2X + 50}" y="${TY + 50}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 2</text>`;"""

    corretor2_new = """    svg += corretorCruz(corr2X, corr2Y, 30, 'CORRETOR 2', 342);"""

    content = content.replace(corretor2_old, corretor2_new)

    # Update corretorCruz signature and implementation
    corretorCruz_old = """  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string { 
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }"""

    corretorCruz_new = """  function corretorCruz(cx: number, cy: number, r: number = 25, label: string, posId?: number): string { 
    let s = '';
    if (posId !== undefined) {
      s += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r + 15}" fill="transparent" />`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    if (posId !== undefined) s += `</g>`;
    return s;
  }"""
  
    content = content.replace(corretorCruz_old, corretorCruz_new)

    # Replace other corretorCruz calls
    content = content.replace("svg += corretorCruz(5800, YM + 35, 35, '');", "svg += corretorCruz(5800, YM + 35, 35, '', 343);")
    content = content.replace("svg += corretorCruz(8950, YM - 35, 35, '');", "svg += corretorCruz(8950, YM - 35, 35, '', 344);")
    content = content.replace("svg += corretorCruz(C5X, LYT, 35, '');", "svg += corretorCruz(C5X, LYT, 35, '', 345);")


    # Update drawEscovador
    escovador_old = """  // Helper for Escovador
  const drawEscovador = (cx: number, cy: number, label: string) => {
    let s = `<rect x="${cx - 50}" y="${cy - 40}" width="100" height="80" fill="#1e293b" stroke="#475569" stroke-width="2" rx="6"/>`;
    s += `<rect x="${cx - 20}" y="${cy + 40}" width="40" height="40" fill="#0f172a" rx="2"/>`;
    s += `<text x="${cx}" y="${cy - 55}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#f97316" text-anchor="middle">${label}</text>`;
    
    const dotYellow = (x: number, y: number, r: number) => {
      let b = `<circle cx="${x}" cy="${y}" r="${r}" fill="#ca8a04" stroke="#facc15" stroke-width="2" filter="url(#yellowGlow)"/>`;
      b += `<circle cx="${x}" cy="${y}" r="${r*0.6}" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8" class="spin-fast" style="transform-origin: ${x}px ${y}px"/>`;
      return b;
    };

    s += dot(cx - 20, cy - 15, 12, 331);       // Top-Left: Green
    s += dotYellow(cx - 20, cy + 15, 12); // Bottom-Left: Yellow (Brush)
    s += dotYellow(cx + 20, cy - 15, 12); // Top-Right: Yellow (Brush)
    s += dot(cx + 20, cy + 15, 12, 332);       // Bottom-Right: Green
    return s;
  };"""

    escovador_new = """  // Helper for Escovador
  const drawEscovador = (cx: number, cy: number, label: string, baseId: number) => {
    let s = `<rect x="${cx - 50}" y="${cy - 40}" width="100" height="80" fill="#1e293b" stroke="#475569" stroke-width="2" rx="6"/>`;
    s += `<rect x="${cx - 20}" y="${cy + 40}" width="40" height="40" fill="#0f172a" rx="2"/>`;
    s += `<text x="${cx}" y="${cy - 55}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#f97316" text-anchor="middle">${label}</text>`;
    
    const dotYellow = (x: number, y: number, r: number, posId?: number) => {
      let b = '';
      if (posId !== undefined) {
        b += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
        b += `<circle cx="${x}" cy="${y}" r="${r + 10}" fill="transparent" />`;
      }
      b += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ca8a04" stroke="#facc15" stroke-width="2" filter="url(#yellowGlow)"/>`;
      b += `<circle cx="${x}" cy="${y}" r="${r*0.6}" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8" class="spin-fast" style="transform-origin: ${x}px ${y}px"/>`;
      if (posId !== undefined) b += `</g>`;
      return b;
    };

    s += dot(cx - 20, cy - 15, 12, baseId);       // Top-Left: Green
    s += dotYellow(cx - 20, cy + 15, 12, baseId + 1); // Bottom-Left: Yellow (Brush)
    s += dotYellow(cx + 20, cy - 15, 12, baseId + 2); // Top-Right: Yellow (Brush)
    s += dot(cx + 20, cy + 15, 12, baseId + 3);       // Bottom-Right: Green
    return s;
  };"""

    content = content.replace(escovador_old, escovador_new)

    # Change drawEscovador calls
    content = content.replace("svg += drawEscovador(7750, YM, 'Escovador 1');", "svg += drawEscovador(7750, YM, 'Escovador 1', 350);")
    content = content.replace("svg += drawEscovador(8300, YM, 'Escovador 2');", "svg += drawEscovador(8300, YM, 'Escovador 2', 360);")


    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(content)
        
    map_code = """
  341: { posicao: 341, nome: 'Corretor 1', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  342: { posicao: 342, nome: 'Corretor 2', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  343: { posicao: 343, nome: 'Corretor 3', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  344: { posicao: 344, nome: 'Corretor 4', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  345: { posicao: 345, nome: 'Corretor 5', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  
  350: { posicao: 350, nome: 'Escovador 1 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  351: { posicao: 351, nome: 'Escovador 1 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  352: { posicao: 352, nome: 'Escovador 1 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  353: { posicao: 353, nome: 'Escovador 1 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  
  360: { posicao: 360, nome: 'Escovador 2 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  361: { posicao: 361, nome: 'Escovador 2 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  362: { posicao: 362, nome: 'Escovador 2 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  363: { posicao: 363, nome: 'Escovador 2 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
"""

    with open('src/store.ts', 'r', encoding='utf-8') as f:
        store_content = f.read()

    store_content = store_content.replace('};\n\n\n// Funções Utilitárias e de Segurança', map_code + '\n};\n\n\n// Funções Utilitárias e de Segurança')

    with open('src/store.ts', 'w', encoding='utf-8') as f:
        f.write(store_content)


if __name__ == '__main__':
    main()
