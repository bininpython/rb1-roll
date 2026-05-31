import re

def main():
    with open('src/store.ts', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Append the metadata logic to the end of the file
    metadata_logic = """

// ===== Gestão de Metadados Editáveis =====
export function loadMetadataOverrides() {
  try {
    const saved = localStorage.getItem('RB1_METADATA_OVERRIDES');
    if (saved) {
      const overrides = JSON.parse(saved);
      for (const pos in overrides) {
        const numPos = parseInt(pos, 10);
        if (DECAPAGEM_MAP[numPos]) {
          Object.assign(DECAPAGEM_MAP[numPos], overrides[numPos]);
        } else if (RB1_COMPLETA_MAP[numPos]) {
          Object.assign(RB1_COMPLETA_MAP[numPos], overrides[numPos]);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao carregar metadados:', err);
  }
}

export function salvarMetadados(posicao: number, novosDados: Partial<RollerInfo>) {
  if (DECAPAGEM_MAP[posicao]) {
    Object.assign(DECAPAGEM_MAP[posicao], novosDados);
  } else if (RB1_COMPLETA_MAP[posicao]) {
    Object.assign(RB1_COMPLETA_MAP[posicao], novosDados);
  } else {
    throw new Error('Roller metadata not found');
  }

  try {
    const saved = localStorage.getItem('RB1_METADATA_OVERRIDES');
    const overrides = saved ? JSON.parse(saved) : {};
    if (!overrides[posicao]) overrides[posicao] = {};
    Object.assign(overrides[posicao], novosDados);
    localStorage.setItem('RB1_METADATA_OVERRIDES', JSON.stringify(overrides));
  } catch (err) {
    console.error('Erro ao salvar metadados:', err);
    throw new Error('Falha ao salvar no armazenamento local');
  }
}

// Chamar na inicialização
loadMetadataOverrides();
"""
    if "loadMetadataOverrides" not in content:
        content += metadata_logic

    with open('src/store.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
