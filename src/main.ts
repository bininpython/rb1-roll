/** RB1 Roll — Main Application */
import './style.css';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate, genId,
  registrarSubstituicao, editarHistorico, adicionarEstoque, removerEstoque, initDemo } from './store';
import { exportPDF, exportExcel } from './exports';
import type { Posicao, Turno, KanbanStatus } from './types';

// ===== Helpers =====
const $ = (id: string) => document.getElementById(id)!;
function toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  const c = $('toastContainer'), t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = `${icons[type]} ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ===== Clock =====
function tickClock() {
  $('liveClock').textContent = new Date().toLocaleString('pt-BR',
    { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(tickClock, 1000); tickClock();

// ===== Stats =====
function renderStats() {
  const alertas = rolos.filter(r => getStatus(calcDays(r.data_troca)) === 'red').length;
  const trocas30 = historico.filter(h => (Date.now() - new Date(h.created_at).getTime()) < 30 * 864e5).length;
  $('statsBar').innerHTML = [
    { i: '🔄', v: rolos.length, l: 'Rolos Ativos', c: 'si-active' },
    { i: '📦', v: estoque.length, l: 'Em Estoque', c: 'si-stock' },
    { i: '⚠️', v: alertas, l: 'Em Alerta', c: 'si-alert' },
    { i: '📊', v: trocas30, l: 'Trocas (30d)', c: 'si-swaps' }
  ].map(s => `<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><span class="stat-value">${s.v}</span><span class="stat-label">${s.l}</span></div></div>`).join('');
}

// ===== Furnace SVG (Roll 0 OUTSIDE, Rolls 1-4 INSIDE) =====
function renderFurnace() {
  const cMap: Record<KanbanStatus, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444', empty: '#555' };
  const bgMap: Record<KanbanStatus, string> = { green: 'rgba(34,197,94,.12)', yellow: 'rgba(234,179,8,.12)', red: 'rgba(239,68,68,.12)', empty: 'rgba(85,85,85,.08)' };

  const rollData = [0, 1, 2, 3, 4].map(i => {
    const r = getRolo(i); const days = r ? calcDays(r.data_troca) : null;
    return { pos: i as Posicao, days, status: getStatus(days), rolo: r };
  });

  // Layout: Roll 0 at x=70 (outside), Furnace starts at x=160, Rolls 1-4 inside
  const svgW = 960, svgH = 300;
  const furnaceX = 160, furnaceW = svgW - furnaceX - 40;
  const rollY = 180, rollR = 24;
  const roll0X = 75; // Roll 0 OUTSIDE
  const innerRollXs = [280, 430, 580, 730]; // Rolls 1-4 INSIDE

  function rollSVG(cx: number, cy: number, idx: number, status: KanbanStatus): string {
    const c = cMap[status], bg = bgMap[status];
    let s = '';
    // Support pedestal
    s += `<rect x="${cx-15}" y="${cy+rollR}" width="30" height="28" rx="3" fill="#4a4a4a" stroke="#5a5a5a" stroke-width=".8"/>`;
    s += `<rect x="${cx-22}" y="${cy+rollR+24}" width="44" height="10" rx="2" fill="#3a3a3a" stroke="#4a4a4a" stroke-width=".8"/>`;
    // Outer ring (spinning)
    s += `<circle cx="${cx}" cy="${cy}" r="${rollR+5}" fill="none" stroke="${c}" stroke-width="1.2" opacity=".25" stroke-dasharray="4 3"><animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="20s" repeatCount="indefinite"/></circle>`;
    // Main roll
    s += `<circle cx="${cx}" cy="${cy}" r="${rollR}" fill="${bg}" stroke="${c}" stroke-width="2.5"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" opacity=".25"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity=".5"/>`;
    // Number
    s += `<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14">${idx}</text>`;
    // Label
    const ly = cy + rollR + 50;
    s += `<text x="${cx}" y="${ly}" text-anchor="middle" fill="rgba(255,255,255,.45)" font-family="Inter,sans-serif" font-size="9" font-weight="600" letter-spacing="1">ROLO ${idx}</text>`;
    const rd = rollData[idx];
    s += `<text x="${cx}" y="${ly+13}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">${rd.days !== null ? rd.days + 'd' : '—'}</text>`;
    if (status === 'red') {
      s += `<circle cx="${cx}" cy="${cy}" r="${rollR}" fill="none" stroke="${c}" stroke-width="1" opacity=".3"><animate attributeName="r" values="${rollR};${rollR+8};${rollR}" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".3;0;.3" dur="2s" repeatCount="indefinite"/></circle>`;
    }
    return s;
  }

  // Metal strip path: enters from left, over Roll 0, into furnace over Rolls 1-4, exits right
  const stripY = rollY - rollR - 4;
  let strip = `M 10 ${rollY} L ${roll0X} ${stripY}`;
  innerRollXs.forEach(x => { strip += ` L ${x} ${stripY}`; });
  strip += ` L ${svgW - 20} ${rollY}`;

  const svg = `<svg viewBox="0 0 ${svgW} ${svgH + 60}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6a00" stop-opacity=".22"/><stop offset="50%" stop-color="#ff4500" stop-opacity=".06"/><stop offset="100%" stop-color="transparent"/></linearGradient>
      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a4a52"/><stop offset="100%" stop-color="#2a2a30"/></linearGradient>
      <pattern id="bp" width="32" height="16" patternUnits="userSpaceOnUse">
        <rect width="32" height="16" fill="#6B4F10"/><rect x="0" y="0" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".4"/><rect x="16" y="0" width="15" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".4"/><rect x="8" y="8" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".4"/><rect x="24" y="8" width="8" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".4"/><rect x="0" y="8" width="7" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".4"/>
      </pattern>
      <filter id="gl"><feGaussianBlur stdDeviation="6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- Roll 0 - OUTSIDE FURNACE (entry mechanism) -->
    <rect x="${roll0X-30}" y="${rollY+rollR+24}" width="60" height="22" rx="3" fill="#2a2a30" stroke="#4a4a52" stroke-width="1"/>
    <text x="${roll0X}" y="${rollY - rollR - 18}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="8" font-weight="600" letter-spacing="1.5">EXTERNO</text>
    ${rollSVG(roll0X, rollY, 0, rollData[0].status)}
    <!-- FURNACE BODY -->
    <rect x="${furnaceX}" y="28" width="${furnaceW}" height="215" rx="8" fill="url(#fg)" stroke="#5a5a62" stroke-width="2"/>
    <!-- Brick walls -->
    <rect x="${furnaceX+12}" y="36" width="${furnaceW-24}" height="26" rx="3" fill="url(#bp)"/>
    <rect x="${furnaceX+12}" y="205" width="${furnaceW-24}" height="26" rx="3" fill="url(#bp)"/>
    <rect x="${furnaceX+12}" y="36" width="16" height="195" rx="3" fill="url(#bp)"/>
    <rect x="${furnaceX+furnaceW-28}" y="36" width="16" height="195" rx="3" fill="url(#bp)"/>
    <!-- Heat glow -->
    <rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="143" rx="4" fill="#1a0a00"/>
    <rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="143" rx="4" fill="url(#hg)" opacity=".85"/>
    <rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="65" rx="4" fill="url(#hg)" opacity=".4"><animate attributeName="opacity" values=".25;.55;.25" dur="3.5s" repeatCount="indefinite"/></rect>
    <!-- Heat shimmer -->
    ${[300,450,600,750].map((x,i) => `<line x1="${x}" y1="72" x2="${x}" y2="120" stroke="#ff6a00" stroke-width=".5" opacity=".1"><animate attributeName="opacity" values=".04;.18;.04" dur="${2+i*.3}s" repeatCount="indefinite" begin="${i*.4}s"/></line>`).join('')}
    <!-- Rolls 1-4 INSIDE furnace -->
    ${innerRollXs.map((x, i) => rollSVG(x, rollY, i + 1, rollData[i + 1].status)).join('')}
    <!-- Metal strip -->
    <path d="${strip}" fill="none" stroke="#c0c0c8" stroke-width="2.5" stroke-linecap="round" opacity=".65" filter="url(#gl)"/>
    <path d="${strip}" fill="none" stroke="#e8e8f0" stroke-width=".8" stroke-linecap="round" opacity=".35"/>
    <!-- Connector line from Roll 0 to furnace entrance -->
    <line x1="${roll0X+rollR+6}" y1="${stripY}" x2="${furnaceX+28}" y2="${stripY}" stroke="#c0c0c8" stroke-width="2" opacity=".4" stroke-dasharray="6 4"/>
    <!-- Labels -->
    <text x="${roll0X}" y="${svgH+45}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">ENTRADA</text>
    <text x="${svgW-50}" y="${svgH+45}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">SAÍDA</text>
    <!-- Furnace label -->
    <text x="${furnaceX + furnaceW/2}" y="22" text-anchor="middle" fill="rgba(255,255,255,.25)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">FORNO DE RECOZIMENTO</text>
  </svg>`;
  $('furnaceDiagram').innerHTML = svg;

  // Roll cards
  $('rollCards').innerHTML = rollData.map(rd => {
    if (!rd.rolo) return `<div class="roll-card" style="opacity:.4"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span><span class="roll-card-dot" style="background:var(--border)"></span></div><div class="roll-card-row"><span>Status</span><span>Vazio</span></div></div>`;
    const df = new Date(rd.rolo.data_troca).toLocaleDateString('pt-BR');
    return `<div class="roll-card"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span><span class="roll-card-dot dot-${rd.status}"></span></div><div class="roll-card-row"><span>Diâmetro</span><span>${rd.rolo.diametro} mm</span></div><div class="roll-card-row"><span>Idade</span><span>${rd.days}d</span></div><div class="roll-card-row"><span>Troca</span><span>${df}</span></div><div class="roll-card-row"><span>Turno</span><span class="turno-badge turno-${rd.rolo.turno}">${rd.rolo.turno}</span></div></div>`;
  }).join('');
}

// ===== Inventory =====
function renderInventory() {
  const list = $('inventoryList'), empty = $('inventoryEmpty');
  if (!estoque.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.innerHTML = estoque.map(e => `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${e.obs || 'Sem obs.'}</span></div><div class="inv-item-actions"><button data-remove-est="${e.id}" title="Remover">✕</button></div></div>`).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-remove-est]').forEach(btn => {
    btn.addEventListener('click', () => { removerEstoque(btn.dataset.removeEst!); renderAll(); toast('Rolo removido do estoque', 'info'); });
  });
}

// ===== History (NO DELETE — only EDIT) =====
function renderHistory() {
  const body = $('histBody') as HTMLTableSectionElement, empty = $('histEmpty');
  const fp = ($('filterPos') as HTMLSelectElement).value;
  const ft = ($('filterTurno') as HTMLSelectElement).value;
  let data = [...historico].sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime());
  if (fp) data = data.filter(h => String(h.posicao) === fp);
  if (ft) data = data.filter(h => h.turno === ft);
  if (!data.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  body.innerHTML = data.map(h => {
    const days = h.idade_dias;
    const st = getStatus(days);
    return `<tr><td style="font-family:var(--mono);font-size:.72rem">${fmtDate(h.data_troca)}</td><td><strong>Rolo ${h.posicao}</strong></td><td><span class="turno-badge turno-${h.turno}">${h.turno}</span></td><td style="font-family:var(--mono)">${h.diametro} mm</td><td style="max-width:180px">${h.obs_motivo}</td><td><span class="age-badge age-${st}">${days}d</span></td><td><button class="btn-edit" data-edit="${h.id}" title="Editar registro">✏️</button></td></tr>`;
  }).join('');
  body.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit!));
  });
}

// ===== Modal: Substituição =====
function populateEstoqueSelect() {
  const sel = $('inEstoqueRolo') as HTMLSelectElement;
  sel.innerHTML = '<option value="">Selecione um rolo do estoque...</option>';
  estoque.forEach(e => {
    sel.innerHTML += `<option value="${e.id}">⊘ ${e.diametro} mm — ${e.obs || 'Sem obs.'}</option>`;
  });
}

function openSubModal() {
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  ($('inData') as HTMLInputElement).value = now.toISOString().slice(0, 16);
  populateEstoqueSelect();
  $('modalSub').classList.add('active');
}
function closeSubModal() {
  $('modalSub').classList.remove('active');
  ($('formSub') as HTMLFormElement).reset();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  ($('inDiam') as HTMLInputElement).value = '';
}

// Auto-fill diameter when stock item selected
$('inEstoqueRolo').addEventListener('change', () => {
  const sel = ($('inEstoqueRolo') as HTMLSelectElement).value;
  const item = estoque.find(e => e.id === sel);
  ($('inDiam') as HTMLInputElement).value = item ? String(item.diametro) : '';
});

$('btnNovaSub').addEventListener('click', openSubModal);
$('modalSubClose').addEventListener('click', closeSubModal);
$('btnCancelSub').addEventListener('click', closeSubModal);
$('modalSub').addEventListener('click', e => { if (e.target === $('modalSub')) closeSubModal(); });

// Motivo chips
document.querySelectorAll<HTMLButtonElement>('#motivoChips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#motivoChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const m = chip.dataset.m!, ta = $('inMotivo') as HTMLTextAreaElement;
    if (m === 'Outro') { ta.value = ''; ta.focus(); } else ta.value = m;
  });
});

($('formSub') as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  const pos = parseInt(($('inPos') as HTMLSelectElement).value) as Posicao;
  const turno = ($('inTurno') as HTMLSelectElement).value as Turno;
  const estId = ($('inEstoqueRolo') as HTMLSelectElement).value;
  const dt = ($('inData') as HTMLInputElement).value;
  const mot = ($('inMotivo') as HTMLTextAreaElement).value.trim();
  if (isNaN(pos) || !turno || !estId || !dt || !mot) { toast('Preencha todos os campos!', 'error'); return; }
  try {
    registrarSubstituicao(pos, turno, estId, dt, mot);
    closeSubModal(); renderAll(); toast(`Rolo ${pos} substituído com sucesso!`, 'success');
  } catch (err: any) { toast(err.message, 'error'); }
});

// ===== Modal: Estoque =====
$('btnAddEstoque').addEventListener('click', () => $('modalEst').classList.add('active'));
$('modalEstClose').addEventListener('click', () => { $('modalEst').classList.remove('active'); ($('formEst') as HTMLFormElement).reset(); });
$('btnCancelEst').addEventListener('click', () => { $('modalEst').classList.remove('active'); ($('formEst') as HTMLFormElement).reset(); });
$('modalEst').addEventListener('click', e => { if (e.target === $('modalEst')) { $('modalEst').classList.remove('active'); ($('formEst') as HTMLFormElement).reset(); } });
($('formEst') as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  const d = parseFloat(($('inEstDiam') as HTMLInputElement).value);
  const obs = ($('inEstObs') as HTMLInputElement).value.trim();
  if (!d) { toast('Informe o diâmetro!', 'error'); return; }
  adicionarEstoque(d, obs);
  $('modalEst').classList.remove('active'); ($('formEst') as HTMLFormElement).reset();
  renderAll(); toast('Rolo adicionado ao estoque!', 'success');
});

// ===== Modal: Edit History =====
function openEditModal(id: string) {
  const rec = historico.find(h => h.id === id);
  if (!rec) return;
  ($('editId') as HTMLInputElement).value = rec.id;
  ($('editPos') as HTMLInputElement).value = `Rolo ${rec.posicao}`;
  ($('editTurno') as HTMLSelectElement).value = rec.turno;
  ($('editDiam') as HTMLInputElement).value = String(rec.diametro);
  const dt = new Date(rec.data_troca); dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  ($('editData') as HTMLInputElement).value = dt.toISOString().slice(0, 16);
  ($('editMotivo') as HTMLTextAreaElement).value = rec.obs_motivo;
  $('modalEdit').classList.add('active');
}
function closeEditModal() { $('modalEdit').classList.remove('active'); }
$('modalEditClose').addEventListener('click', closeEditModal);
$('btnCancelEdit').addEventListener('click', closeEditModal);
$('modalEdit').addEventListener('click', e => { if (e.target === $('modalEdit')) closeEditModal(); });
($('formEdit') as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  const id = ($('editId') as HTMLInputElement).value;
  const turno = ($('editTurno') as HTMLSelectElement).value as Turno;
  const dt = ($('editData') as HTMLInputElement).value;
  const mot = ($('editMotivo') as HTMLTextAreaElement).value.trim();
  if (!mot) { toast('Motivo é obrigatório!', 'error'); return; }
  editarHistorico(id, turno, dt, mot);
  closeEditModal(); renderAll(); toast('Registro atualizado!', 'success');
});

// ===== Filters =====
$('filterPos').addEventListener('change', renderHistory);
$('filterTurno').addEventListener('change', renderHistory);

// ===== Export Dropdown =====
$('btnExportMenu').addEventListener('click', e => { e.stopPropagation(); $('exportDropdown').classList.toggle('open'); });
document.addEventListener('click', () => $('exportDropdown').classList.remove('open'));
$('expPdfFull').addEventListener('click', () => exportPDF('completo'));
$('expPdfTrocas').addEventListener('click', () => exportPDF('trocas'));
$('expPdfKanban').addEventListener('click', () => exportPDF('kanban'));
$('expExcel').addEventListener('click', () => exportExcel());

// ===== Render All =====
function renderAll() { renderStats(); renderFurnace(); renderInventory(); renderHistory(); }

// ===== Init =====
initDemo();
renderAll();
setInterval(renderAll, 60000);

// Expose toast globally for exports
(window as any).__rb1Toast = toast;
