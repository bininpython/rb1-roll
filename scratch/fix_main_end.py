import os

filepath = r"c:\Users\Usuario\Desktop\forno\src\main.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of the formMeta event listener
start_idx = content.rfind("$('formMeta')?.addEventListener('submit', e => {")

if start_idx != -1:
    content = content[:start_idx] + """$('formMeta')?.addEventListener('submit', e => {
  e.preventDefault();
  const pos = parseInt(($('inMetaPos') as HTMLInputElement).value);
  const nome = ($('inMetaNome') as HTMLInputElement).value.trim();
  const tipo = ($('inMetaTipo') as HTMLInputElement).value.trim();
  const diametroPadrao = parseFloat(($('inMetaDiam') as HTMLInputElement).value);
  const secao = ($('inMetaSecao') as HTMLInputElement).value.trim();
  const rolamentoPadrao = ($('inMetaRolamento') as HTMLInputElement).value.trim();
  const recurso = ($('inMetaRecurso') as HTMLInputElement).value.trim();
  const situacao = ($('inMetaSituacao') as HTMLSelectElement).value;
  const diametroInicialStr = ($('inMetaDiamInicial') as HTMLInputElement).value;
  const diametroInicial = diametroInicialStr ? parseFloat(diametroInicialStr) : undefined;
  const diametroFinalStr = ($('inMetaDiamFinal') as HTMLInputElement).value;
  const diametroFinal = diametroFinalStr ? parseFloat(diametroFinalStr) : undefined;
  
  if (isNaN(pos) || !nome || !tipo || isNaN(diametroPadrao) || !secao) {
    return toast('Preencha os campos obrigatórios', 'error');
  }
  
  try {
    salvarMetadados(pos, { nome, tipo, diametroPadrao, secao, rolamentoPadrao, recurso, situacao, diametroInicial, diametroFinal });
    closeMetaModal();
    renderAll();
    toast('Propriedades atualizadas com sucesso!', 'success');
  } catch (err: any) {
    toast(err.message, 'error');
  }
});

// ===== KPI KANBAN DASHBOARD =====
function renderKpiDashboard() {
  const fornoData = [
    { label: 'Velocidade', value: '--', unit: '', status: 'gray' },
    { label: 'Oxigenio', value: '--', unit: '', status: 'gray' },
    { label: 'PCI', value: '--', unit: '', status: 'gray' },
    { label: 'Emissividade', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 1', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 2', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 3', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 4', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 5', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 6', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 7', value: '--', unit: '', status: 'gray' },
    { label: 'Zona 8', value: '--', unit: '', status: 'gray' },
    { label: 'Pirometro 01', value: '--', unit: '', status: 'gray' },
    { label: 'Pirometro 02', value: '--', unit: '', status: 'gray' },
    { label: 'Vazao total de ar', value: '--', unit: '', status: 'gray' }
  ];

  const eleData = [
    { label: 'Retificador 01', value: '--', unit: '', status: 'gray' },
    { label: 'Retificador 02', value: '--', unit: '', status: 'gray' },
    { label: 'Retificador 03', value: '--', unit: '', status: 'gray' },
    { label: 'Retificador 04', value: '--', unit: '', status: 'gray' },
    { label: 'Tanque 01', value: '--', unit: '', status: 'gray' },
    { label: 'Tanque 02', value: '--', unit: '', status: 'gray' },
    { label: 'PH', value: '--', unit: '', status: 'gray' },
    { label: 'Teor Fe', value: '--', unit: '', status: 'gray' },
    { label: 'Condutividade', value: '--', unit: '', status: 'gray' },
    { label: 'Corrente Esc. 01', value: '--', unit: '', status: 'gray' },
    { label: 'Corrente Esc. 02', value: '--', unit: '', status: 'gray' },
    { label: 'Corrente Esc. 03', value: '--', unit: '', status: 'gray' },
    { label: 'Corrente Esc. 04', value: '--', unit: '', status: 'gray' },
    { label: 'Concentr. Sulf. Sodio', value: '--', unit: '', status: 'gray' }
  ];

  const quiData = [
    { label: 'HNO3', value: '--', unit: '', status: 'green' },
    { label: 'HF', value: '--', unit: '', status: 'red' },
    { label: 'Teor Ferro', value: '--', unit: '', status: 'red' },
    { label: 'Temperatura', value: '--', unit: '', status: 'green' }
  ];

  const desData = [
    { label: 'Produtividade', value: '--', unit: '', status: 'gray' },
    { label: 'TV', value: '--', unit: '', status: 'gray' },
    { label: 'Cons de GN/ton', value: '--', unit: '', status: 'gray' }
  ];

  function getCardHtml(item: any) {
    let bg = 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/40 hover:border-primary/40 text-on-surface';
    let text = 'text-primary';
    let labelColor = 'text-on-surface-variant';
    
    if (item.status === 'green') {
      bg = 'bg-green-600 hover:bg-green-500 border-green-500 shadow-[0_0_12px_rgba(22,163,74,0.35)] text-white';
      text = 'text-white font-extrabold';
      labelColor = 'text-green-50';
    } else if (item.status === 'red') {
      bg = 'bg-red-600 hover:bg-red-500 border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.35)] text-white';
      text = 'text-white font-extrabold';
      labelColor = 'text-red-50';
    } else if (item.status === 'yellow') {
      bg = 'bg-yellow-500 hover:bg-yellow-400 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.35)] text-gray-900';
      text = 'text-gray-900 font-extrabold';
      labelColor = 'text-yellow-900/80';
    }

    return `
      <div class="flex flex-col items-center justify-center text-center border rounded-lg p-3 transition-all cursor-default select-none shadow-sm hover:shadow-md hover:-translate-y-0.5 min-h-[70px] ${bg}">
        <span class="text-[9px] font-bold uppercase tracking-widest ${labelColor} mb-1.5 leading-[1.1] break-words w-full px-1">${item.label}</span>
        <div class="flex items-baseline justify-center gap-1">
          <span class="font-mono text-[13px] sm:text-[14px] font-bold ${text} tracking-tight">${item.value}</span>
          ${item.unit ? `<span class="text-[9px] font-semibold ${labelColor} opacity-90">${item.unit}</span>` : ''}
        </div>
      </div>
    `;
  }

  const kpiColForno = document.getElementById('kpiColForno');
  if (kpiColForno) kpiColForno.innerHTML = fornoData.map(getCardHtml).join('');
  
  const kpiColEle = document.getElementById('kpiColEle');
  if (kpiColEle) kpiColEle.innerHTML = eleData.map(getCardHtml).join('');
  
  const kpiColQui = document.getElementById('kpiColQui');
  if (kpiColQui) kpiColQui.innerHTML = quiData.map(getCardHtml).join('');
  
  const kpiColDes = document.getElementById('kpiColDes');
  if (kpiColDes) kpiColDes.innerHTML = desData.map(getCardHtml).join('');
}

document.getElementById('tabKpi')?.addEventListener('click', renderKpiDashboard);
renderKpiDashboard();
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Fix applied successfully.")
