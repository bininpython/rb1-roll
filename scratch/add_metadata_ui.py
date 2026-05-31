import re

def main():
    # 1. Update index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # The HTML for the modal
    modal_meta_html = """
    <div class="modal-overlay" id="modalMeta">
        <div class="modal">
            <div class="modal-header">
                <h3>Editar Propriedades do Rolo</h3>
                <button class="modal-close" id="modalMetaClose">&times;</button>
            </div>
            <form id="formMeta" class="modal-form">
                <input type="hidden" id="inMetaPos">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome do Rolo *</label>
                        <input type="text" id="inMetaNome" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo *</label>
                        <input type="text" id="inMetaTipo" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Diâmetro Padrão (mm) *</label>
                        <input type="number" id="inMetaDiam" required>
                    </div>
                    <div class="form-group">
                        <label>Seção *</label>
                        <input type="text" id="inMetaSecao" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="width:100%">
                        <label>Rolamento Utilizado</label>
                        <input type="text" id="inMetaRolamento" placeholder="Ex: 6204">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outline" id="btnCancelMeta">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Propriedades</button>
                </div>
            </form>
        </div>
    </div>
"""
    if 'id="modalMeta"' not in html_content:
        # Insert before closing body
        html_content = html_content.replace('</body>', f"{modal_meta_html}\n</body>")
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(html_content)

    # 2. Update main.ts
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        ts_content = f.read()
        
    # Import salvarMetadados
    if 'salvarMetadados' not in ts_content:
        ts_content = ts_content.replace(
            "import { DECAPAGEM_MAP", 
            "import { salvarMetadados, DECAPAGEM_MAP"
        )

    # Add button to showRoloModal
    old_button_html = """<button class="btn btn-primary text-sm py-1.5 px-4 rounded shadow hover:shadow-md transition-all flex items-center gap-2" onclick="closeRoloModal(); window.openSubModalForPos(${pos})">
          <span class="material-symbols-outlined text-[18px]">edit_document</span>
          Registrar Troca / Editar
        </button>"""
        
    new_button_html = """<button class="btn btn-outline text-sm py-1.5 px-4 rounded shadow hover:shadow-md transition-all flex items-center gap-2 mr-2" onclick="closeRoloModal(); window.openEditMetaModal(${pos})">
          <span class="material-symbols-outlined text-[18px]">settings</span>
          Propriedades
        </button>
        <button class="btn btn-primary text-sm py-1.5 px-4 rounded shadow hover:shadow-md transition-all flex items-center gap-2" onclick="closeRoloModal(); window.openSubModalForPos(${pos})">
          <span class="material-symbols-outlined text-[18px]">edit_document</span>
          Registrar Troca
        </button>"""
        
    ts_content = ts_content.replace(old_button_html, new_button_html)
    
    # Add modal logic to main.ts
    modal_meta_logic = """
// Modal Meta Logic
(window as any).openEditMetaModal = (pos: number) => {
  const meta = DECAPAGEM_MAP[pos] || RB1_COMPLETA_MAP[pos];
  if (!meta) return toast('Roller metadata not found', 'error');

  ($('inMetaPos') as HTMLInputElement).value = String(pos);
  ($('inMetaNome') as HTMLInputElement).value = meta.nome;
  ($('inMetaTipo') as HTMLInputElement).value = meta.tipo;
  ($('inMetaDiam') as HTMLInputElement).value = String(meta.diametroPadrao);
  ($('inMetaSecao') as HTMLInputElement).value = meta.secao;
  ($('inMetaRolamento') as HTMLInputElement).value = meta.rolamentoPadrao || '';
  
  $('modalMeta').classList.add('active');
};

function closeMetaModal() {
  $('modalMeta').classList.remove('active');
}
$('modalMetaClose')?.addEventListener('click', closeMetaModal);
$('btnCancelMeta')?.addEventListener('click', closeMetaModal);
$('modalMeta')?.addEventListener('click', e => { if (e.target === $('modalMeta')) closeMetaModal(); });

$('formMeta')?.addEventListener('submit', e => {
  e.preventDefault();
  const pos = parseInt(($('inMetaPos') as HTMLInputElement).value);
  const nome = ($('inMetaNome') as HTMLInputElement).value.trim();
  const tipo = ($('inMetaTipo') as HTMLInputElement).value.trim();
  const diametroPadrao = parseFloat(($('inMetaDiam') as HTMLInputElement).value);
  const secao = ($('inMetaSecao') as HTMLInputElement).value.trim();
  const rolamentoPadrao = ($('inMetaRolamento') as HTMLInputElement).value.trim();
  
  if (isNaN(pos) || !nome || !tipo || isNaN(diametroPadrao) || !secao) {
    return toast('Preencha os campos obrigatórios', 'error');
  }
  
  try {
    salvarMetadados(pos, { nome, tipo, diametroPadrao, secao, rolamentoPadrao });
    closeMetaModal();
    renderAll();
    toast('Propriedades atualizadas com sucesso!', 'success');
  } catch (err: any) {
    toast(err.message, 'error');
  }
});
"""
    if 'openEditMetaModal' not in ts_content:
        ts_content += modal_meta_logic

    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)

if __name__ == '__main__':
    main()
