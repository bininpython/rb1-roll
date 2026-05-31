import re

def main():
    with open('src/store.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the old keys and remove them.
    # The previous script might have appended them at the end.
    content = re.sub(r'  341: \{ posicao: 341.*?Escovador 2 - Inf Dir\', perimetro: 0, diametroPadrao: 200, tipo: \'Rolo\', secao: \'Químico\' \},\n', '', content, flags=re.DOTALL)

    map_code = '''
  441: { posicao: 441, nome: 'Corretor 1', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  442: { posicao: 442, nome: 'Corretor 2', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  443: { posicao: 443, nome: 'Corretor 3', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  444: { posicao: 444, nome: 'Corretor 4', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  445: { posicao: 445, nome: 'Corretor 5', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  
  450: { posicao: 450, nome: 'Escovador 1 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  451: { posicao: 451, nome: 'Escovador 1 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  452: { posicao: 452, nome: 'Escovador 1 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  453: { posicao: 453, nome: 'Escovador 1 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  
  460: { posicao: 460, nome: 'Escovador 2 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  461: { posicao: 461, nome: 'Escovador 2 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  462: { posicao: 462, nome: 'Escovador 2 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  463: { posicao: 463, nome: 'Escovador 2 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
'''

    content = content.replace('};\n\n\n// Funções Utilitárias e de Segurança', map_code + '\n};\n\n\n// Funções Utilitárias e de Segurança')

    with open('src/store.ts', 'w', encoding='utf-8') as f:
        f.write(content)


    with open('src/main.ts', 'r', encoding='utf-8') as f:
        main_content = f.read()

    main_content = main_content.replace("corretorCruz(corrX, corrY, 25, 'CORRETOR 1', 341)", "corretorCruz(corrX, corrY, 25, 'CORRETOR 1', 441)")
    main_content = main_content.replace("corretorCruz(corr2X, corr2Y, 30, 'CORRETOR 2', 342)", "corretorCruz(corr2X, corr2Y, 30, 'CORRETOR 2', 442)")
    main_content = main_content.replace("corretorCruz(5800, YM + 35, 35, '', 343)", "corretorCruz(5800, YM + 35, 35, '', 443)")
    main_content = main_content.replace("corretorCruz(8950, YM - 35, 35, '', 344)", "corretorCruz(8950, YM - 35, 35, '', 444)")
    main_content = main_content.replace("corretorCruz(C5X, LYT, 35, '', 345)", "corretorCruz(C5X, LYT, 35, '', 445)")
    main_content = main_content.replace("drawEscovador(7750, YM, 'Escovador 1', 350)", "drawEscovador(7750, YM, 'Escovador 1', 450)")
    main_content = main_content.replace("drawEscovador(8300, YM, 'Escovador 2', 360)", "drawEscovador(8300, YM, 'Escovador 2', 460)")

    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(main_content)

if __name__ == '__main__':
    main()
