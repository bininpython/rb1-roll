/** RB1 System v3 — Main Application (Clean, No Exports) */
import './style.css';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate, sanitize,
  registrarSubstituicao, editarHistorico, adicionarEstoque, removerEstoque, initDemo, salvarMetadados, DECAPAGEM_MAP, DECAPAGEM_ORDER, RB1_COMPLETA_MAP, RollerInfo, precosFinanceiro, savePrecos } from './store';
import type { Posicao, Turno, KanbanStatus } from './types';
import panzoom from 'panzoom';
import { initAuth, currentUserRole } from './auth';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const $ = (id: string) => document.getElementById(id)!;

// ===== RBAC & Admin Logic =====
let chartSetorLifeInstance: Chart | null = null;
let chartTrendInstance: Chart | null = null;
let chartMotivosInstance: Chart | null = null;

export function applyCurrentRole() {
  const isEditorOrAdmin = currentUserRole === 'editor' || currentUserRole === 'admin';
  const isAdmin = currentUserRole === 'admin';
  document.querySelectorAll('.require-edit').forEach(el => {
    (el as HTMLElement).style.display = isEditorOrAdmin ? '' : 'none';
  });
  document.querySelectorAll('.require-admin').forEach(el => {
    (el as HTMLElement).style.display = isAdmin ? '' : 'none';
  });
}

export function updateAdminMetrics() {
  const monthInput = $('adminCsvMonth') as HTMLInputElement;
  if (monthInput && !monthInput.value) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${today.getFullYear()}-${mm}`;
  }

  const [selYear, selMonth] = monthInput ? monthInput.value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

  const monthSwaps = historico.filter(h => {
    const d = new Date(h.data_troca);
    return d.getMonth() + 1 === selMonth && d.getFullYear() === selYear;
  });

  if ($('adminTotalSwaps')) $('adminTotalSwaps').textContent = monthSwaps.length.toString();

  updateWalletMetrics(monthSwaps);
  renderAdminCharts(selYear, selMonth, monthSwaps);
}

export function updateWalletMetrics(monthSwaps: any[]) {
  const inRolo = $('inPriceRolo') as HTMLInputElement;
  const inEscova = $('inPriceEscova') as HTMLInputElement;
  const inArrForno = $('inPriceArruelaForno') as HTMLInputElement;
  const inRoloForno = $('inPriceRoloForno') as HTMLInputElement;
  
  // Hydrate inputs
  if (inRolo && !inRolo.value && precosFinanceiro.rolo > 0) inRolo.value = precosFinanceiro.rolo.toString();
  if (inEscova && !inEscova.value && precosFinanceiro.escova > 0) inEscova.value = precosFinanceiro.escova.toString();
  if (inArrForno && !inArrForno.value && precosFinanceiro.arruelaForno > 0) inArrForno.value = precosFinanceiro.arruelaForno.toString();
  if (inRoloForno && !inRoloForno.value && precosFinanceiro.roloForno > 0) inRoloForno.value = precosFinanceiro.roloForno.toString();

  let sumRolos = 0;
  let sumEscovas = 0;
  let sumRolosForno = 0;
  let sumArruelas = 0;

  monthSwaps.forEach(h => {
    const meta = DECAPAGEM_MAP[h.posicao] || RB1_COMPLETA_MAP[h.posicao];
    if (!meta) return;

    if (meta.secao.includes('Forno')) {
      sumRolosForno += precosFinanceiro.roloForno || 0;
      sumArruelas += precosFinanceiro.arruelaForno || 0;
    } else if (meta.tipo.toLowerCase().includes('escova')) {
      sumEscovas += precosFinanceiro.escova || 0;
    } else {
      sumRolos += precosFinanceiro.rolo || 0;
    }
  });

  const total = sumRolos + sumEscovas + sumRolosForno + sumArruelas;
  
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits:2})}`;
  
  if ($('walletTotalGasto')) $('walletTotalGasto').textContent = fmt(total);
  if ($('walletCostRolos')) $('walletCostRolos').textContent = fmt(sumRolos);
  if ($('walletCostEscovas')) $('walletCostEscovas').textContent = fmt(sumEscovas);
  if ($('walletCostRolosForno')) $('walletCostRolosForno').textContent = fmt(sumRolosForno);
  if ($('walletCostArruelas')) $('walletCostArruelas').textContent = fmt(sumArruelas);
}

function renderAdminCharts(selYear: number, selMonth: number, monthSwaps: any[]) {
  const ctxSetor = $('chartSetorLife') as HTMLCanvasElement;
  const ctxTrend = $('chartTrend') as HTMLCanvasElement;
  const ctxMotivos = $('chartMotivos') as HTMLCanvasElement;
  if (!ctxSetor || !ctxTrend || !ctxMotivos) return;

  // Aggregate Data for Sector Life
  const sectorData: Record<string, { totalDays: number; count: number }> = {
    'Forno': { totalDays: 0, count: 0 },
    'Eletrolítico': { totalDays: 0, count: 0 },
    'Químico': { totalDays: 0, count: 0 },
    'Geral': { totalDays: 0, count: 0 }
  };

  monthSwaps.forEach(h => {
    const meta = DECAPAGEM_MAP[h.posicao] || RB1_COMPLETA_MAP[h.posicao];
    const sec = meta ? meta.secao : 'Geral';
    let key = sec;
    if (sec.includes('Eletrolítico')) key = 'Eletrolítico';
    else if (sec.includes('Químico')) key = 'Químico';
    else if (sec.includes('Forno')) key = 'Forno';
    else key = 'Geral';

    if (sectorData[key]) {
      sectorData[key].totalDays += (h.idade_dias || 0);
      sectorData[key].count++;
    }
  });

  const sectorLabels = Object.keys(sectorData);
  const sectorAverages = sectorLabels.map(k => sectorData[k].count > 0 ? Math.round(sectorData[k].totalDays / sectorData[k].count) : 0);

  if (chartSetorLifeInstance) chartSetorLifeInstance.destroy();
  chartSetorLifeInstance = new Chart(ctxSetor, {
    type: 'bar',
    data: {
      labels: sectorLabels,
      datasets: [{
        label: 'Média de Vida Útil (Dias)',
        data: sectorAverages,
        backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#6b7280'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // Aggregate Data for 6-Month Trend
  const months: string[] = [];
  const trendCounts: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(selYear, (selMonth - 1) - i, 1);
    months.push(d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }));
    
    const count = historico.filter(h => {
      const hd = new Date(h.data_troca);
      return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).length;
    trendCounts.push(count);
  }

  if (chartTrendInstance) chartTrendInstance.destroy();
  chartTrendInstance = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Nº de Trocas',
        data: trendCounts,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // Aggregate Data for Reasons
  const reasonData: Record<string, number> = {};
  monthSwaps.forEach(h => {
    let rawMotivo = h.obs_motivo ? sanitize(h.obs_motivo).trim() : '';
    if (!rawMotivo || rawMotivo === '-') rawMotivo = 'Não informado';
    rawMotivo = rawMotivo.charAt(0).toUpperCase() + rawMotivo.slice(1);
    
    reasonData[rawMotivo] = (reasonData[rawMotivo] || 0) + 1;
  });

  const sortedReasons = Object.entries(reasonData).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const reasonLabels = sortedReasons.map(r => r[0].length > 20 ? r[0].substring(0,20)+'...' : r[0]);
  const reasonCounts = sortedReasons.map(r => r[1]);

  if (chartMotivosInstance) chartMotivosInstance.destroy();
  chartMotivosInstance = new Chart(ctxMotivos, {
    type: 'doughnut',
    data: {
      labels: reasonLabels,
      datasets: [{
        data: reasonCounts,
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
      }
    }
  });
}

window.addEventListener('authRoleChanged', (e: any) => {
  applyCurrentRole();
  if (e.detail !== 'admin' && $('tabAdmin')?.classList.contains('active')) {
    switchTab('Forno');
  }
});
// ==============================

$('btnSavePrices')?.addEventListener('click', () => {
  const inRolo = parseFloat(($('inPriceRolo') as HTMLInputElement).value) || 0;
  const inEscova = parseFloat(($('inPriceEscova') as HTMLInputElement).value) || 0;
  const inArrForno = parseFloat(($('inPriceArruelaForno') as HTMLInputElement).value) || 0;
  const inRoloForno = parseFloat(($('inPriceRoloForno') as HTMLInputElement).value) || 0;
  
  savePrecos({ rolo: inRolo, escova: inEscova, arruelaForno: inArrForno, roloForno: inRoloForno });
  toast('Preços atualizados com sucesso!', 'success');
  updateAdminMetrics();
});

// CSV Download listener
$('btnDownloadCSV')?.addEventListener('click', () => {
  const monthInput = $('adminCsvMonth') as HTMLInputElement;
  const [selYear, selMonth] = monthInput ? monthInput.value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

  const filtered = historico.filter(h => {
    const d = new Date(h.data_troca);
    return d.getMonth() + 1 === selMonth && d.getFullYear() === selYear;
  });

  if (filtered.length === 0) {
    // @ts-ignore
    return toast('Nenhuma troca encontrada neste mês.', 'error');
  }

  const headers = ['Setor', 'Recurso', 'Posicao', 'Tipo', 'Data da Troca', 'Turno', 'Diametro (mm)', 'Vida Util (Dias)', 'Observacao'];
  
  const rows = filtered.map(h => {
    const meta = DECAPAGEM_MAP[h.posicao] || RB1_COMPLETA_MAP[h.posicao];
    const setor = meta ? meta.secao : 'Geral';
    const recurso = meta?.recurso || '';
    const tipo = meta?.tipo || 'Rolo';
    return [
      `"${setor}"`,
      `"${recurso}"`,
      h.posicao,
      `"${tipo}"`,
      `"${fmtDate(h.data_troca)}"`,
      h.turno,
      h.diametro,
      h.idade_dias,
      `"${sanitize(h.obs_motivo)}"`
    ];
  });
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RB1_Relatorio_${monthInput?.value || 'all'}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

$('adminCsvMonth')?.addEventListener('change', updateAdminMetrics);

initAuth();
let rb1PanZoomInstance: any = null;
let globalAnimTime = 0;
let globalAnimLastTime = performance.now();
let globalIsPaused = false;

function toast(msg: string, type: 'success'|'error'|'info' = 'info') {
  const c = $('toastContainer'), t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = `${{success:'✓',error:'✕',info:'ℹ'}[type]} ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

// Clock
function tickClock() {
  $('liveClock').textContent = new Date().toLocaleString('pt-BR',
    { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
setInterval(tickClock, 1000); tickClock();

// Tabs
const TABS = ['Forno','Decapagem','Rb1Completa','Kpi','Admin'] as const;
function switchTab(active: typeof TABS[number]) {
  TABS.forEach(t => {
    const tab = $(`tab${t}`), view = $(`view${t}`);
    if (t === active) { 
      if(tab) tab.classList.add('active'); 
      if(view) { view.classList.remove('view-hidden'); view.classList.add('view-active'); }
    } else { 
      if(tab) tab.classList.remove('active'); 
      if(view) { view.classList.remove('view-active'); view.classList.add('view-hidden'); }
    }
  });
}
$('tabForno')?.addEventListener('click', () => switchTab('Forno'));
$('tabDecapagem')?.addEventListener('click', () => switchTab('Decapagem'));
$('tabRb1Completa')?.addEventListener('click', () => switchTab('Rb1Completa'));
$('tabKpi')?.addEventListener('click', () => switchTab('Kpi'));
$('tabAdmin')?.addEventListener('click', () => switchTab('Admin'));

// Stats
function renderStats() {
  const alertas = [0,1,2,3,4].filter(pos => {
    const r = getRolo(pos);
    return r && getStatus(calcDays(r.data_troca)) === 'red';
  }).length;
  const trocas30 = historico.filter(h => h.posicao < 100 && (Date.now() - new Date(h.created_at).getTime()) < 30*864e5).length;
  
  const fornoEstoque = estoque.filter(e => !e.obs.startsWith('[Decapagem]'));
  const estRetifica = fornoEstoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica')).length;
  const estRb1 = fornoEstoque.length - estRetifica;

  const icons: Record<string,string> = {
    'si-stock': 'bg-purple-50 text-purple-600',
    'si-alert': 'bg-red-50 text-red-600',
    'si-swaps': 'bg-amber-50 text-amber-600'
  };
  $('statsBar').innerHTML = [
    {i:'🛠️',v:estRetifica,l:'Estoque Retífica',c:'si-stock'},
    {i:'📦',v:estRb1,l:'Estoque RB1',c:'si-stock'},
    {i:'⚠️',v:alertas,l:'Em Alerta',c:'si-alert'},
    {i:'📊',v:trocas30,l:'Trocas (30d)',c:'si-swaps'}
  ].map(s=>`<div class="bg-white border border-outline-variant/60 rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div class="w-10 h-10 rounded-lg ${icons[s.c]} flex items-center justify-center text-lg flex-shrink-0">${s.i}</div>
    <div><div class="font-display text-xl font-extrabold text-on-surface">${s.v}</div>
    <div class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">${s.l}</div></div></div>`).join('');
  
  updateAdminMetrics();
}

function renderDecapagemStats() {
  const alertas = DECAPAGEM_ORDER.filter(pos => {
    const r = getRolo(pos);
    return r && getStatus(calcDays(r.data_troca)) === 'red';
  }).length;
  const trocas30 = historico.filter(h => h.posicao >= 100 && (Date.now() - new Date(h.created_at).getTime()) < 30*864e5).length;
  
  const decapagemEstoque = estoque.filter(e => e.obs.startsWith('[Decapagem]'));
  const estRetifica = decapagemEstoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica')).length;
  const estRb1 = decapagemEstoque.length - estRetifica;

  const bar = $('statsDecapagemBar');
  if (bar) {
    const ic2: Record<string,string> = {
      'si-stock': 'bg-purple-50 text-purple-600',
      'si-alert': 'bg-red-50 text-red-600',
      'si-swaps': 'bg-amber-50 text-amber-600'
    };
    bar.innerHTML = [
      {i:'🛠️',v:estRetifica,l:'Estoque Retífica',c:'si-stock'},
      {i:'📦',v:estRb1,l:'Estoque RB1',c:'si-stock'},
      {i:'⚠️',v:alertas,l:'Em Alerta',c:'si-alert'},
      {i:'📊',v:trocas30,l:'Trocas (30d)',c:'si-swaps'}
    ].map(s=>`<div class="bg-white border border-outline-variant/60 rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div class="w-10 h-10 rounded-lg ${ic2[s.c]} flex items-center justify-center text-lg flex-shrink-0">${s.i}</div>
      <div><div class="font-display text-xl font-extrabold text-on-surface">${s.v}</div>
      <div class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">${s.l}</div></div></div>`).join('');
  }
}

// Furnace SVG (Roll 0 OUTSIDE, Rolls 1-4 INSIDE)
function renderFurnace() {
  const cMap: Record<KanbanStatus,string> = {green:'#16a34a',yellow:'#ca8a04',red:'#dc2626',empty:'#555'};
  const bgMap: Record<KanbanStatus,string> = {green:'rgba(22,163,74,.15)',yellow:'rgba(202,138,4,.15)',red:'rgba(220,38,38,.15)',empty:'rgba(85,85,85,.08)'};
  const rollData = [0,1,2,3,4].map(i => { const r = getRolo(i); const days = r ? calcDays(r.data_troca) : null; return {pos:i as Posicao, days, status:getStatus(days), rolo:r}; });
  const svgW=960,svgH=300,furnaceX=160,furnaceW=svgW-furnaceX-40,rollY=180,rollR=24,roll0X=75;
  const innerX=[280,430,580,730];
  function rollSVG(cx:number,cy:number,idx:number,st:KanbanStatus){
    const c=cMap[st],bg=bgMap[st]; let s='';
    s+=`<rect x="${cx-15}" y="${cy+rollR}" width="30" height="28" rx="3" fill="#4a4a4a" stroke="#5a5a5a" stroke-width=".8"/>`;
    s+=`<rect x="${cx-22}" y="${cy+rollR+24}" width="44" height="10" rx="2" fill="#3a3a3a"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="${rollR+5}" fill="none" stroke="${c}" stroke-width="1" opacity=".2" stroke-dasharray="4 3"><animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="20s" repeatCount="indefinite"/></circle>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="${rollR}" fill="${bg}" stroke="${c}" stroke-width="2.5"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity=".5"/>`;
    s+=`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14">${idx}</text>`;
    const ly=cy+rollR+50;
    s+=`<text x="${cx}" y="${ly}" text-anchor="middle" fill="#ffffff" font-family="Inter,sans-serif" font-size="9" font-weight="600" letter-spacing="1">ROLO ${idx}</text>`;
    s+=`<text x="${cx}" y="${ly+13}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">${rollData[idx].days!==null?rollData[idx].days+'d':'—'}</text>`;
    s+=`<text x="${cx}" y="${ly+26}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="JetBrains Mono,monospace" font-size="9" font-weight="500">${rollData[idx].rolo?rollData[idx].rolo.diametro+'mm':'—'}</text>`;
    if(st==='red') s+=`<circle cx="${cx}" cy="${cy}" r="${rollR}" fill="none" stroke="${c}" stroke-width="1" opacity=".3"><animate attributeName="r" values="${rollR};${rollR+8};${rollR}" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".3;0;.3" dur="2s" repeatCount="indefinite"/></circle>`;
    return s;
  }
  const stripY=rollY-rollR-4;
  let strip=`M 10 ${rollY} L ${roll0X} ${stripY}`;
  innerX.forEach(x=>{strip+=` L ${x} ${stripY}`;}); strip+=` L ${svgW-20} ${rollY}`;
  $('furnaceDiagram').innerHTML=`<svg viewBox="0 0 ${svgW} ${svgH+60}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6a00" stop-opacity=".22"/><stop offset="50%" stop-color="#ff4500" stop-opacity=".06"/><stop offset="100%" stop-color="transparent"/></linearGradient><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a4a52"/><stop offset="100%" stop-color="#2a2a30"/></linearGradient><pattern id="bp" width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#6B4F10"/><rect x="0" y="0" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".4"/><rect x="16" y="0" width="15" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".4"/><rect x="8" y="8" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".4"/></pattern><filter id="gl"><feGaussianBlur stdDeviation="6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="${roll0X-30}" y="${rollY+rollR+24}" width="60" height="22" rx="3" fill="#2a2a30" stroke="#4a4a52"/><text x="${roll0X}" y="${rollY-rollR-18}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="8" font-weight="600" letter-spacing="1.5">EXTERNO</text>${rollSVG(roll0X,rollY,0,rollData[0].status)}<rect x="${furnaceX}" y="28" width="${furnaceW}" height="215" rx="8" fill="url(#fg)" stroke="#5a5a62" stroke-width="2"/><rect x="${furnaceX+12}" y="36" width="${furnaceW-24}" height="26" rx="3" fill="url(#bp)"/><rect x="${furnaceX+12}" y="205" width="${furnaceW-24}" height="26" rx="3" fill="url(#bp)"/><rect x="${furnaceX+12}" y="36" width="16" height="195" rx="3" fill="url(#bp)"/><rect x="${furnaceX+furnaceW-28}" y="36" width="16" height="195" rx="3" fill="url(#bp)"/><rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="143" rx="4" fill="#1a0a00"/><rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="143" rx="4" fill="url(#hg)" opacity=".85"/><rect x="${furnaceX+28}" y="62" width="${furnaceW-56}" height="65" rx="4" fill="url(#hg)" opacity=".4"><animate attributeName="opacity" values=".25;.55;.25" dur="3.5s" repeatCount="indefinite"/></rect>${innerX.map((x,i)=>rollSVG(x,rollY,i+1,rollData[i+1].status)).join('')}<path d="${strip}" fill="none" stroke="#c0c0c8" stroke-width="2.5" stroke-linecap="round" opacity=".65" filter="url(#gl)"/><line x1="${roll0X+rollR+6}" y1="${stripY}" x2="${furnaceX+28}" y2="${stripY}" stroke="#c0c0c8" stroke-width="2" opacity=".4" stroke-dasharray="6 4"/><text x="${roll0X}" y="${svgH+45}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">ENTRADA</text><text x="${svgW-50}" y="${svgH+45}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">SAÍDA</text><text x="${furnaceX+furnaceW/2}" y="22" text-anchor="middle" fill="rgba(255,255,255,.25)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">FORNO DE RECOZIMENTO</text></svg>`;
  // Roll cards
  $('rollCards').innerHTML = rollData.map(rd => {
    if(!rd.rolo) return `<div class="roll-card" style="opacity:.4"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span></div><div class="roll-card-row"><span>Status</span><span>Vazio</span></div></div>`;
    const df = new Date(rd.rolo.data_troca).toLocaleDateString('pt-BR');
    return `<div class="roll-card"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span><span class="roll-card-dot dot-${rd.status}"></span></div><div class="roll-card-row"><span>Diâmetro</span><span>${rd.rolo.diametro} mm</span></div><div class="roll-card-row"><span>Tempo</span><span>${rd.days}d</span></div><div class="roll-card-row"><span>Troca</span><span>${df}</span></div><div class="roll-card-row"><span>Turno</span><span class="turno-badge turno-${rd.rolo.turno}">${rd.rolo.turno}</span></div></div>`;
  }).join('');
}

// Decapagem SVG
function renderDecapagem() {
  const svgW = 1700, svgH = 500;
  let s = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background-color:#11141a;">`;
  
  s += `<defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#11141a" />
      <stop offset="100%" stop-color="#181c25" />
    </linearGradient>
    <pattern id="verticalTexture" width="8" height="500" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="500" stroke="rgba(255,255,255,0.015)" stroke-width="1.2" />
    </pattern>
    <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <!-- Shifting metallic reflection gradient for white/grey steel rollers -->
    <linearGradient id="metalRoll" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="25%" stop-color="#334155" />
      <stop offset="50%" stop-color="#f8fafc" />
      <stop offset="75%" stop-color="#334155" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    
    <!-- Shifting metallic reflection gradient for yellow brass rollers -->
    <linearGradient id="yellowMetalRoll" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#854d0e" />
      <stop offset="25%" stop-color="#ca8a04" />
      <stop offset="50%" stop-color="#fef08a" />
      <stop offset="75%" stop-color="#ca8a04" />
      <stop offset="100%" stop-color="#854d0e" />
    </linearGradient>
    <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="yellowGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>`;
  
  // Background
  s += `<rect width="${svgW}" height="${svgH}" fill="url(#bgGradient)" />`;
  s += `<rect width="${svgW}" height="${svgH}" fill="url(#verticalTexture)" />`;
  
  // Custom base pedestal for large cylinders and stations
  function baseBlock(x: number, y: number) {
    let b = '';
    // Top flat mounting plate
    b += `<rect x="${x - 20}" y="${y}" width="40" height="8" rx="1" fill="#444852" />`;
    // Vertical main column
    b += `<rect x="${x - 14}" y="${y + 8}" width="28" height="24" rx="1" fill="#2d3038" />`;
    // Stepped bottom base plate
    b += `<rect x="${x - 24}" y="${y + 32}" width="48" height="13" rx="2" fill="#1e2026" />`;
    return b;
  }

  // Base for 2x2 station (taller column to match the higher mounting point)
  function tallBaseBlock(x: number, y: number) {
    let b = '';
    b += `<rect x="${x - 20}" y="${y}" width="40" height="8" rx="1" fill="#444852" />`;
    b += `<rect x="${x - 14}" y="${y + 8}" width="28" height="54" rx="1" fill="#2d3038" />`;
    b += `<rect x="${x - 24}" y="${y + 62}" width="48" height="13" rx="2" fill="#1e2026" />`;
    return b;
  }
  
  // Large Cylinders (Center y = 350, Radius = 30)
  function largeCylinder(x: number, y: number, dir: 'cw' | 'ccw' = 'cw', pos: number) {
    let s = `<g class="decapagem-interactive-roll" data-pos="${pos}" style="cursor:pointer">`;
    // Stand
    s += `<rect x="${x - 15}" y="${y + 30}" width="30" height="25" fill="#374151" rx="2"/>`;
    s += `<rect x="${x - 20}" y="${y + 50}" width="40" height="8" fill="#4b5563" rx="2"/>`;
    // Core (Dark) + Outer Glow (Green)
    s += `<circle cx="${x}" cy="${y}" r="30" fill="#052e16" stroke="#22c55e" stroke-width="3" filter="url(#greenGlow)"/>`;
    // Animated Inner Dashed Ring
    s += `<circle cx="${x}" cy="${y}" r="22.5" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" class="spin-slow" style="transform-origin: ${x}px ${y}px"/>`;
    // Center Text (Number / Dot)
    s += `<circle cx="${x}" cy="${y}" r="3" fill="#22c55e"/>`;
    // Hitbox
    s += `<circle cx="${x}" cy="${y}" r="35" fill="transparent" />`;
    s += `</g>`;
    return s;
  }
  
  // Small wave rollers (Radius = 10)
  function smallRoll(x: number, y: number, dir: 'cw' | 'ccw', pos: number) {
    let s = `<g class="decapagem-interactive-roll" data-pos="${pos}" style="cursor:pointer">`;
    s += `<circle cx="${x}" cy="${y}" r="15" fill="transparent" />`; // Hitbox
    s += `<circle cx="${x}" cy="${y}" r="10" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    s += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${x}px ${y}px"/>`;
    s += `</g>`;
    return s;
  }
  
  // Vertical pinch pair (Radius = 8)
  function pinchRolls(x: number, y: number, pos: number) {
    let p = `<g class="decapagem-interactive-roll" data-pos="${pos}" style="cursor:pointer">`;
    const cyTop = y - 10;
    const cyBottom = y + 10;
    const r = 8;
    p += `<circle cx="${x}" cy="${y}" r="25" fill="transparent" />`; // Hitbox
    // Top
    p += `<circle cx="${x}" cy="${cyTop}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    p += `<circle cx="${x}" cy="${cyTop}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${x}px ${cyTop}px"/>`;
    // Bottom
    p += `<circle cx="${x}" cy="${cyBottom}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    p += `<circle cx="${x}" cy="${cyBottom}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${x}px ${cyBottom}px"/>`;
    p += `</g>`;
    return p;
  }
  
  // 2x2 Station (with 2 yellow and 2 white rollers)
  function brushStation(x: number, y: number, pos: number) {
    let b = `<g class="decapagem-interactive-roll" data-pos="${pos}" style="cursor:pointer">`;
    // Outer station housing box
    b += `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="4"/>`;
    b += `<rect x="${x - 12}" y="${y + 30}" width="24" height="25" fill="#0f172a" rx="2"/>`; // Stand
    b += `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" fill="transparent"/>`; // Hitbox
    
    const r = 8;
    // Roller top-left: White
    const cxTL = x - 15, cyTL = y - 15;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cxTL}px ${cyTL}px"/>`;
    // Roller top-right: Yellow
    const cxTR = x + 15, cyTR = y - 15;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="${r}" fill="#ca8a04" stroke="#facc15" stroke-width="1.5" filter="url(#yellowGlow)"/>`;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="${r*0.6}" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8" class="spin-fast" style="transform-origin: ${cxTR}px ${cyTR}px"/>`;
    // Roller bottom-left: Yellow
    const cxBL = x - 15, cyBL = y + 15;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="${r}" fill="#ca8a04" stroke="#facc15" stroke-width="1.5" filter="url(#yellowGlow)"/>`;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="${r*0.6}" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8" class="spin-fast" style="transform-origin: ${cxBL}px ${cyBL}px"/>`;
    // Roller bottom-right: White
    const cxBR = x + 15, cyBR = y + 15;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cxBR}px ${cyBR}px"/>`;
    
    b += `</g>`;
    return b;
  }

  // Draw layers chronologically to ensure proper SVG layering
  let behind = '';
  let front = '';
  
  // 1. Far Left Cylinder (outside orange box)
  behind += largeCylinder(120, 350, 'cw', 100);
  
  // 2. First Wave of 5 Rollers (left side, alternating directions)
  front += smallRoll(220, 338, 'ccw', 101); // Above
  front += smallRoll(280, 362, 'cw', 102);  // Below
  front += smallRoll(340, 338, 'ccw', 103); // Above
  front += smallRoll(400, 362, 'cw', 104);  // Below
  front += smallRoll(460, 338, 'ccw', 105); // Above
  
  // 3. Middle Cylinder
  behind += largeCylinder(540, 350, 'cw', 106);
  
  // 4. Second Wave of 5 Rollers (right side, alternating directions)
  front += smallRoll(640, 338, 'ccw', 107); // Above
  front += smallRoll(700, 362, 'cw', 108);  // Below
  front += smallRoll(760, 338, 'ccw', 109); // Above
  front += smallRoll(820, 362, 'cw', 110);  // Below
  front += smallRoll(880, 338, 'ccw', 111); // Above
  
  // 5. Orange Box Station (Left Pinch, 2x2 Unit, Right Pinch)
  front += pinchRolls(925, 335, 112); // Centered at y=335 on slope up
  behind += brushStation(980, 320, 113);
  front += pinchRolls(1035, 335, 114); // Centered at y=335 on slope down
  
  // 6. Grey Box Cylinders (Chemical pickling)
  behind += largeCylinder(1140, 350, 'cw', 115);
  behind += largeCylinder(1320, 350, 'cw', 116);
  
  // 7. Right Station (Left Pinch, 2x2 Unit, Flanking Pinch)
  front += pinchRolls(1465, 335, 117); // Centered at y=335 on slope up
  behind += brushStation(1520, 320, 118);
  front += pinchRolls(1605, 342.5, 119); // Centered at y=342.5 on slope down
  
  // 8. Mathematically Rounded and Connected Process Line Path
  let pathStr = '';
  pathStr += 'M 40 380 '; // Start far left
  pathStr += 'L 90 350 '; // Approach Cylinder 1
  pathStr += 'A 30 30 0 0 1 150 350 '; // Wrap over Cylinder 1
  pathStr += 'L 510 350 '; // Straight through first wave of rollers
  pathStr += 'A 30 30 0 0 1 570 350 '; // Wrap over Cylinder 2
  pathStr += 'L 910 350 '; // Straight to slope
  pathStr += 'L 940 320 '; // Slope up to Station 1 (Left pinch at x=925, y=335)
  pathStr += 'L 1020 320 '; // Through Station 1
  pathStr += 'L 1050 350 '; // Slope down from Station 1 (Right pinch at x=1035, y=335)
  pathStr += 'L 1110 350 '; // Approach Cylinder 3
  pathStr += 'A 30 30 0 0 1 1170 350 '; // Wrap over Cylinder 3
  pathStr += 'L 1290 350 '; // Gap between Cylinder 3 and 4
  pathStr += 'A 30 30 0 0 1 1350 350 '; // Wrap over Cylinder 4
  pathStr += 'L 1420 350 '; // Exit Cylinder 4
  pathStr += 'L 1450 350 '; // Gap before Station 2
  pathStr += 'L 1480 320 '; // Slope up to Station 2 (Left pinch at x=1465, y=335)
  pathStr += 'L 1560 320 '; // Through Station 2
  pathStr += 'L 1620 350 '; // Slope down from Station 2 (Pinches at x=1575, y=327.5 and x=1605, y=342.5)
  pathStr += 'L 1665 350'; // Exit to right
  
  // High-fidelity double-layer process line:
  // Layer 1: Solid base white sheet
  let processLine = `<path d="${pathStr}" fill="none" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />`;
  // Layer 2: Glowing sliding pulse in orange to represent physical flow/movement
  processLine += `<path d="${pathStr}" fill="none" stroke="#e27b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 24" filter="url(#subtleGlow)">
    <animate attributeName="stroke-dashoffset" values="96;0" dur="2.5s" repeatCount="indefinite" />
  </path>`;
  
  // Assemble the Layers
  s += behind;
  s += processLine;
  s += front;
  
  // 9. Section Headings (Eletrolítico and Químico)
  s += `<text x="540" y="190" text-anchor="middle" fill="#f1511b" font-family="'Inter', sans-serif" font-size="24" font-weight="700" letter-spacing="0.5">Eletrolítico</text>`;
  s += `<text x="1230" y="190" text-anchor="middle" fill="#f8fafc" font-family="'Inter', sans-serif" font-size="24" font-weight="700" letter-spacing="0.5">Quimico</text>`;
  
  // 10. Boundary Texts
  s += `<text x="70" y="280" text-anchor="middle" fill="#6b7280" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="3">ENTRADA</text>`;
  s += `<text x="1640" y="280" text-anchor="middle" fill="#6b7280" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="3">SAÍDA</text>`;
  
  // 11. Custom Technical Labels overlay exactly as in annotated blueprint (White text for high visibility, larger SCADA layout)
  s += `<g font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5" pointer-events="none">`;
  
  // Defletor Entrada (Large Left Cylinder)
  s += `<text x="120" y="296">Defletor Entrada<tspan x="120" dy="12" font-size="8" fill="#fed330">3140 mm</tspan></text>`;

  // First Wave
  s += `<text x="220" y="308">Defletor 1<tspan x="220" dy="12" font-size="8" fill="#fed330">1884 mm</tspan></text>`;
  s += `<text x="280" y="394">Fundo Tanque 1<tspan x="280" dy="12" font-size="8" fill="#fed330">320 mm</tspan></text>`;
  s += `<text x="340" y="308">Mergulhador ELE 1<tspan x="340" dy="12" font-size="8" fill="#fed330">3925 mm</tspan></text>`;
  s += `<text x="400" y="394">Fundo tanque 2<tspan x="400" dy="12" font-size="8" fill="#fed330">320 mm</tspan></text>`;
  s += `<text x="460" y="308">Defletor 2<tspan x="460" dy="12" font-size="8" fill="#fed330">1884 mm</tspan></text>`;
  
  // Large Center
  s += `<text x="540" y="296">Centragem<tspan x="540" dy="12" font-size="8" fill="#fed330">3140 mm</tspan></text>`;
  
  // Second Wave
  s += `<text x="640" y="308">Defletor 3<tspan x="640" dy="12" font-size="8" fill="#fed330">1884 mm</tspan></text>`;
  s += `<text x="700" y="394">Fundo tanque 3<tspan x="700" dy="12" font-size="8" fill="#fed330">320 mm</tspan></text>`;
  s += `<text x="760" y="308">Mergulhador ELE 2<tspan x="760" dy="12" font-size="8" fill="#fed330">3925 mm</tspan></text>`;
  s += `<text x="820" y="394">Fundo tanque 4<tspan x="820" dy="12" font-size="8" fill="#fed330">320 mm</tspan></text>`;
  s += `<text x="880" y="308">Defletor 4<tspan x="880" dy="12" font-size="8" fill="#fed330">1884 mm</tspan></text>`;
  
  // Station 1 Block
  s += `<text x="925" y="370" font-size="9">Espremedor 1<tspan x="925" dy="11" font-size="7.5" fill="#fed330">800 mm</tspan></text>`;
  s += `<text x="980" y="268" fill="#ff7a30" font-size="10">Escovador 1<tspan x="980" dy="12" font-size="8" fill="#fed330">1036 / 785 mm</tspan></text>`;
  s += `<text x="1035" y="370" font-size="9">Espremedor 2<tspan x="1035" dy="11" font-size="7.5" fill="#fed330">800 mm</tspan></text>`;
  
  // Chemical Cylinders
  s += `<text x="1140" y="296">Mergulhador QUIM 1<tspan x="1140" dy="12" font-size="8" fill="#fed330">3140 mm</tspan></text>`;
  s += `<text x="1320" y="296">Mergulhador QUIM 2<tspan x="1320" dy="12" font-size="8" fill="#fed330">3140 mm</tspan></text>`;
  
  // Station 2 Block
  s += `<text x="1465" y="370" font-size="9">Espremedor 3<tspan x="1465" dy="11" font-size="7.5" fill="#fed330">800 mm</tspan></text>`;
  s += `<text x="1520" y="268" fill="#ffffff" font-size="10">Escovador 2<tspan x="1520" dy="12" font-size="8" fill="#fed330">1036 / 785 mm</tspan></text>`;
  s += `<text x="1605" y="376" font-size="9">Espremedor 4<tspan x="1605" dy="11" font-size="7.5" fill="#fed330">800 mm</tspan></text>`;
  
  s += `</g>`;
  
  s += `</svg>`;
  $('decapagemDiagram').innerHTML = s;
  
  // Click handler on Decapagem diagram for SVG interactive rollers selection
  const diag = $('decapagemDiagram');
  diag.onclick = (e) => {
    const interactive = (e.target as Element).closest('.decapagem-interactive-roll');
    if (interactive) {
      const posStr = interactive.getAttribute('data-pos');
      if (posStr) {
        const pos = parseInt(posStr);
        (window as any).openSubModalForDecapagem(pos);
      }
    }
  };
}

// Global active rollers & brushes table rendering for Decapagem
function renderDecapagemTable() {
  const body = $('decapagemTableBody') as HTMLTableSectionElement;
  if (!body) return;
  
  const rowsHtml = DECAPAGEM_ORDER.map(p => {
    const meta = DECAPAGEM_MAP[p];
    if (!meta) return '';
    const rolo = getRolo(p);
    if (!rolo) return '';
    
    const days = calcDays(rolo.data_troca);
    const st = getStatus(days);
    const formattedDate = fmtDate(rolo.data_troca);
    
    const typeBadge = meta.tipo === 'Escova' 
      ? `<span class="bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">🧹 Escova</span>`
      : `<span class="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">⚙️ Rolo</span>`;
      
    return `
      <tr class="border-b border-outline-variant/20 hover:bg-surface-bright/80 transition-colors">
        <td class="px-4 py-3 font-semibold text-on-surface">${meta.nome}</td>
        <td class="px-4 py-3">${typeBadge}</td>
        <td class="px-4 py-3 text-on-surface-variant font-mono text-sm">${rolo.diametro} mm</td>
        <td class="px-4 py-3 text-on-surface-variant font-mono text-sm">${meta.perimetro} mm</td>
        <td class="px-4 py-3 text-on-surface-variant font-mono text-xs">${formattedDate}</td>
        <td class="px-4 py-3"><span class="turno-badge turno-${rolo.turno} text-[10px] font-bold px-2 py-0.5 rounded inline-block">${rolo.turno}</span></td>
        <td class="px-4 py-3"><span class="age-badge age-${st} text-xs font-bold px-2 py-0.5 rounded inline-block">${days}d</span></td>
        <td class="px-4 py-3 text-on-surface-variant text-sm truncate max-w-[160px]" title="${sanitize(rolo.obs_motivo)}">${sanitize(rolo.obs_motivo) || '—'}</td>
        <td class="px-4 py-3">
          <button class="require-edit text-orange-600 hover:text-orange-800 border border-orange-300 hover:bg-orange-50 px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-all" onclick="window.openSubModalForDecapagem(${p})">
            🔄 Substituir
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  body.innerHTML = rowsHtml;
  applyCurrentRole(); // ensure visibility
}

// Expose openSubModalForPos globally so inline onclick works cleanly
(window as any).openSubModalForPos = (pos: number) => {
  openSubModal();
  const selPos = $('inPos') as HTMLSelectElement;
  
  // Inject option dynamically if it doesn't exist
  if (!Array.from(selPos.options).some(o => o.value === String(pos))) {
    const meta = DECAPAGEM_MAP[pos] || RB1_COMPLETA_MAP[pos];
    const label = meta ? `${meta.nome} (Pos ${pos})` : `Posição ${pos}`;
    const newOpt = new Option(label, String(pos));
    
    // Create a new optgroup for dynamically added ones if it doesn't exist
    let dynGroup = Array.from(selPos.querySelectorAll('optgroup')).find(g => g.label === '— Outros Rolos (RB1) —');
    if (!dynGroup) {
      dynGroup = document.createElement('optgroup');
      dynGroup.label = '— Outros Rolos (RB1) —';
      selPos.appendChild(dynGroup);
    }
    dynGroup.appendChild(newOpt);
  }

  selPos.value = String(pos);
  if (typeof (window as any).updateSubModalFields === 'function') {
    (window as any).updateSubModalFields();
  }
  // Trigger diameter sync based on selected position
  const estSelect = $('inEstoqueRolo') as HTMLSelectElement;
  estSelect.value = '';
  ($('inDiam') as HTMLInputElement).value = '';
};

(window as any).openSubModalForDecapagem = (window as any).openSubModalForPos;

// Inventory
let currentInvView: 'retifica' | 'rb1' = 'retifica';
let currentDecapagemInvView: 'retifica' | 'rb1' = 'retifica';

function renderInventory() {
  const list=$('inventoryList'), empty=$('inventoryEmpty');
  const fornoEstoque = estoque.filter(e => !e.obs.startsWith('[Decapagem]'));
  const estRetifica = fornoEstoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica'));
  const estRb1 = fornoEstoque.filter(e => !e.obs.toLowerCase().includes('retifica') && !e.obs.toLowerCase().includes('retífica'));
  
  $('countRetifica').textContent = estRetifica.length.toString();
  $('countRb1').textContent = estRb1.length.toString();

  const currentList = currentInvView === 'retifica' ? estRetifica : estRb1;

  if(!currentList.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=currentList.map(e=>{
    const cleaned = e.obs.replace(/^\[Forno\]\s*/, '');
    return `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${sanitize(cleaned)||'Sem obs.'}</span></div><div class="inv-item-actions"><button class="require-edit" data-remove-est="${e.id}" title="Remover">✕</button></div></div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-remove-est]').forEach(btn=>{
    btn.addEventListener('click',()=>{removerEstoque(btn.dataset.removeEst!);renderAll();toast('Rolo removido','info');});
  });
  applyCurrentRole();
}

function renderDecapagemInventory() {
  const list=$('inventoryDecapagemList'), empty=$('inventoryDecapagemEmpty');
  const decapagemEstoque = estoque.filter(e => e.obs.startsWith('[Decapagem]'));
  const estRetifica = decapagemEstoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica'));
  const estRb1 = decapagemEstoque.filter(e => !e.obs.toLowerCase().includes('retifica') && !e.obs.toLowerCase().includes('retífica'));
  
  $('countDecapagemRetifica').textContent = estRetifica.length.toString();
  $('countDecapagemRb1').textContent = estRb1.length.toString();

  const currentList = currentDecapagemInvView === 'retifica' ? estRetifica : estRb1;

  if(!currentList.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=currentList.map(e=>{
    const cleaned = e.obs.replace(/^\[Decapagem\]\s*/, '');
    return `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${sanitize(cleaned)||'Sem obs.'}</span></div><div class="inv-item-actions"><button class="require-edit" data-remove-est="${e.id}" title="Remover">✕</button></div></div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-remove-est]').forEach(btn=>{
    btn.addEventListener('click',()=>{removerEstoque(btn.dataset.removeEst!);renderAll();toast('Rolo removido','info');});
  });
  applyCurrentRole();
}

// History
function renderHistory() {
  const body=$('histBody') as HTMLTableSectionElement, empty=$('histEmpty');
  const fp=($('filterPos') as HTMLSelectElement).value, ft=($('filterTurno') as HTMLSelectElement).value;
  let data=[...historico].sort((a,b)=>new Date(b.data_troca).getTime()-new Date(a.data_troca).getTime());
  if(fp) data=data.filter(h=>String(h.posicao)===fp);
  if(ft) data=data.filter(h=>h.turno===ft);
  if(!data.length){body.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  body.innerHTML=data.map(h=>{const st=getStatus(h.idade_dias);
    const posLabel = h.posicao >= 100 ? (DECAPAGEM_MAP[h.posicao]?.nome || `Pos ${h.posicao}`) : `Rolo ${h.posicao}`;
    return `<tr class="border-b border-outline-variant/20 hover:bg-surface-bright/80 transition-colors"><td class="px-4 py-3 font-mono text-xs text-on-surface-variant">${fmtDate(h.data_troca)}</td><td class="px-4 py-3 font-semibold text-on-surface">${posLabel}</td><td class="px-4 py-3"><span class="turno-badge turno-${h.turno} text-[10px] font-bold px-2 py-0.5 rounded inline-block">${h.turno}</span></td><td class="px-4 py-3 font-mono">${h.diametro} mm</td><td class="px-4 py-3 text-on-surface-variant max-w-[180px] truncate">${sanitize(h.obs_motivo) || '—'}</td><td class="px-4 py-3"><span class="age-badge age-${st} text-xs font-bold px-2 py-0.5 rounded inline-block">${h.idade_dias}d</span></td><td class="px-4 py-3"><button class="require-edit text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1.5 rounded-md transition-all" data-edit="${h.id}">✏️</button></td></tr>`;
  }).join('');
  body.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(btn=>{
    btn.addEventListener('click',()=>openEditModal(btn.dataset.edit!));
  });
  applyCurrentRole();
}

// Modal: Substituição
function populateEstoqueSelect(){
  const sel=$('inEstoqueRolo') as HTMLSelectElement;
  sel.innerHTML='<option value="">Selecione um rolo do estoque...</option>';
  const posVal = parseInt(($('inPos') as HTMLSelectElement).value);
  const isDecapagem = !isNaN(posVal) && posVal >= 100 && posVal < 200;
  
  const filteredEstoque = isDecapagem 
    ? estoque.filter(e => e.obs.startsWith('[Decapagem]'))
    : estoque.filter(e => !e.obs.startsWith('[Decapagem]'));
    
  filteredEstoque.forEach(e=>{
    const cleaned = e.obs.replace(/^\[Forno\]\s*|^\[Decapagem\]\s*/, '');
    sel.innerHTML+=`<option value="${e.id}">⊘ ${e.diametro} mm — ${sanitize(cleaned)||'Sem obs.'}</option>`;
  });
  if (!isNaN(posVal) && posVal >= 200) {
    sel.innerHTML += `<option value="DIRECT">⚡ Sem Estoque (Manter Diâmetro Atual)</option>`;
  }
}

function updateSubModalFields() {
    populateEstoqueSelect();
  const posVal = parseInt(($('inPos') as HTMLSelectElement).value);
  const isDecapagem = !isNaN(posVal) && posVal >= 100 && posVal < 200;
  
  const inTurno = $('inTurno') as HTMLSelectElement;
  const inMotivo = $('inMotivo') as HTMLTextAreaElement;
  const labelMotivo = inMotivo.previousElementSibling as HTMLElement;
  
  if (isDecapagem) {
    inTurno.innerHTML = '<option value="TT" selected>TT — Tarde</option>';
    inMotivo.removeAttribute('required');
    if (labelMotivo) {
      labelMotivo.innerHTML = 'Motivo da Troca <span style="opacity:0.5; font-size:0.75rem;">(Opcional)</span>';
    }
  } else {
    inTurno.innerHTML = `
      <option value="">Selecione...</option>
      <option value="TN">TN — Noite</option>
      <option value="TM">TM — Manhã</option>
      <option value="TT">TT — Tarde</option>
    `;
    inMotivo.setAttribute('required', 'required');
    if (labelMotivo) {
      labelMotivo.innerHTML = 'Motivo da Troca *';
    }
  }
}
(window as any).updateSubModalFields = updateSubModalFields;
$('inPos').addEventListener('change', updateSubModalFields);

function openSubModal(){
  const now=new Date(); now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  ($('inData') as HTMLInputElement).value=now.toISOString().slice(0,16);
  populateEstoqueSelect(); $('modalSub').classList.add('active');
  updateSubModalFields();
}
function closeSubModal(){$('modalSub').classList.remove('active');($('formSub') as HTMLFormElement).reset();document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));($('inDiam') as HTMLInputElement).value='';}

$('inEstoqueRolo').addEventListener('change',()=>{
  const sel=($('inEstoqueRolo') as HTMLSelectElement).value;
  if (sel === 'DIRECT') {
    const pos = parseInt(($('inPos') as HTMLSelectElement).value);
    const r = getRolo(pos);
    const meta = DECAPAGEM_MAP[pos] || RB1_COMPLETA_MAP[pos];
    const diametro = r && !r.id.startsWith('virtual') ? r.diametro : (meta ? meta.diametroPadrao : '');
    ($('inDiam') as HTMLInputElement).value = String(diametro);
  } else {
    const item=estoque.find(e=>e.id===sel);
    ($('inDiam') as HTMLInputElement).value=item?String(item.diametro):'';
  }
});
$('btnNovaSub').addEventListener('click',openSubModal);
$('modalSubClose').addEventListener('click',closeSubModal);
$('btnCancelSub').addEventListener('click',closeSubModal);
$('modalSub').addEventListener('click',e=>{if(e.target===$('modalSub'))closeSubModal();});

document.querySelectorAll<HTMLButtonElement>('#motivoChips .chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    document.querySelectorAll('#motivoChips .chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const m=chip.dataset.m!,ta=$('inMotivo') as HTMLTextAreaElement;
    if(m==='Outro'){ta.value='';ta.focus();}else ta.value=m;
  });
});

($('formSub') as HTMLFormElement).addEventListener('submit',e=>{
  e.preventDefault();
  const pos=parseInt(($('inPos') as HTMLSelectElement).value) as Posicao;
  const turno=($('inTurno') as HTMLSelectElement).value as Turno;
  const estId=($('inEstoqueRolo') as HTMLSelectElement).value;
  const dt=($('inData') as HTMLInputElement).value;
  const mot=($('inMotivo') as HTMLTextAreaElement).value.trim();
  const isDecapagem = pos >= 100 && pos < 200;
  if(isNaN(pos)||!turno||!estId||!dt||(!isDecapagem && !mot)){toast('Preencha todos os campos!','error');return;}
  try{registrarSubstituicao(pos,turno,estId,dt,mot);closeSubModal();renderAll();toast(`Rolo ${pos} substituído!`,'success');}catch(err:any){toast(err.message,'error');}
});

// Modal: Estoque
function openEstoqueModal(defaultObs: string) {
  $('modalEst').classList.add('active');
  ($('inEstObs') as HTMLInputElement).value = defaultObs;
}
$('btnAddEstRetifica').addEventListener('click',()=>openEstoqueModal('Retífica'));
$('btnAddEstRb1').addEventListener('click',()=>openEstoqueModal(''));

$('toggleRetifica').addEventListener('click', () => {
  currentInvView = 'retifica';
  $('toggleRetifica').classList.add('active');
  $('toggleRb1').classList.remove('active');
  renderInventory();
});
$('toggleRb1').addEventListener('click', () => {
  currentInvView = 'rb1';
  $('toggleRb1').classList.add('active');
  $('toggleRetifica').classList.remove('active');
  renderInventory();
});
$('toggleDecapagemRetifica').addEventListener('click', () => {
  currentDecapagemInvView = 'retifica';
  $('toggleDecapagemRetifica').classList.add('active');
  $('toggleDecapagemRb1').classList.remove('active');
  renderDecapagemInventory();
});
$('toggleDecapagemRb1').addEventListener('click', () => {
  currentDecapagemInvView = 'rb1';
  $('toggleDecapagemRb1').classList.add('active');
  $('toggleDecapagemRetifica').classList.remove('active');
  renderDecapagemInventory();
});
$('modalEstClose').addEventListener('click',()=>{$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();});
$('btnCancelEst').addEventListener('click',()=>{$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();});
$('modalEst').addEventListener('click',e=>{if(e.target===$('modalEst')){$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();}});
($('formEst') as HTMLFormElement).addEventListener('submit',e=>{
  e.preventDefault();
  const d=parseFloat(($('inEstDiam') as HTMLInputElement).value);
  const obs=($('inEstObs') as HTMLInputElement).value.trim();
  if(!d){toast('Informe o diâmetro!','error');return;}
  try{
    const isDecTab = $('tabDecapagem').classList.contains('active');
    const part1 = String(Math.floor(Math.random() * 90000) + 10000);
    const part2 = String(Math.floor(Math.random() * 90) + 10);
    const code = `RB1 ${part1}-${part2}`;
    const taggedObs = (isDecTab ? '[Decapagem] ' : '[Forno] ') + obs + ` [Cód: ${code}]`;
    adicionarEstoque(d,taggedObs);
    $('modalEst').classList.remove('active');
    ($('formEst') as HTMLFormElement).reset();
    renderAll();
    toast('Rolo adicionado!','success');
  }catch(err:any){toast(err.message,'error');}
});

// Modal: Edit History
function openEditModal(id:string){
  const rec=historico.find(h=>h.id===id); if(!rec) return;
  ($('editId') as HTMLInputElement).value=rec.id;
  ($('editPos') as HTMLInputElement).value=`Rolo ${rec.posicao}`;
  ($('editDiam') as HTMLInputElement).value=String(rec.diametro);
  const dt=new Date(rec.data_troca);dt.setMinutes(dt.getMinutes()-dt.getTimezoneOffset());
  ($('editData') as HTMLInputElement).value=dt.toISOString().slice(0,16);
  ($('editMotivo') as HTMLTextAreaElement).value=rec.obs_motivo;
  
  const editTurno = $('editTurno') as HTMLSelectElement;
  const editMotivo = $('editMotivo') as HTMLTextAreaElement;
  const labelEditMotivo = editMotivo.previousElementSibling as HTMLElement;
  const isDecapagem = rec.posicao >= 100;
  
  if (isDecapagem) {
    editTurno.innerHTML = '<option value="TT" selected>TT — Tarde</option>';
    editMotivo.removeAttribute('required');
    if (labelEditMotivo) {
      labelEditMotivo.innerHTML = 'Motivo da Troca <span style="opacity:0.5; font-size:0.75rem;">(Opcional)</span>';
    }
  } else {
    editTurno.innerHTML = `
      <option value="TN">TN — Noite</option>
      <option value="TM">TM — Manhã</option>
      <option value="TT">TT — Tarde</option>
    `;
    editTurno.value = rec.turno;
    editMotivo.setAttribute('required', 'required');
    if (labelEditMotivo) {
      labelEditMotivo.innerHTML = 'Motivo da Troca';
    }
  }
  
  $('modalEdit').classList.add('active');
}
function closeEditModal(){$('modalEdit').classList.remove('active');}
$('modalEditClose').addEventListener('click',closeEditModal);
$('btnCancelEdit').addEventListener('click',closeEditModal);
$('modalEdit').addEventListener('click',e=>{if(e.target===$('modalEdit'))closeEditModal();});
($('formEdit') as HTMLFormElement).addEventListener('submit',e=>{
  e.preventDefault();
  const id=($('editId') as HTMLInputElement).value;
  const turno=($('editTurno') as HTMLSelectElement).value as Turno;
  const dt=($('editData') as HTMLInputElement).value;
  const mot=($('editMotivo') as HTMLTextAreaElement).value.trim();
  const rec=historico.find(h=>h.id===id);
  const pos = rec ? rec.posicao : 0;
  const isDecapagem = pos >= 100 && pos < 200;
  if(!isDecapagem && !mot){toast('Motivo obrigatório!','error');return;}
  try{editarHistorico(id,turno,dt,mot);closeEditModal();renderAll();toast('Registro atualizado!','success');}catch(err:any){toast(err.message,'error');}
});

// Filters
$('filterPos').addEventListener('change',renderHistory);
$('filterTurno').addEventListener('change',renderHistory);

// Monthly Tab
const MN=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MF=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let selYear=new Date().getFullYear(), selMonth=new Date().getMonth();
let selDecapagemYear=new Date().getFullYear(), selDecapagemMonth=new Date().getMonth();

function renderMonthly(){
  $('yearLabel').textContent=String(selYear);
  $('monthTabs').innerHTML=MN.map((m,i)=>{
    const cnt=historico.filter(h=>{const d=new Date(h.data_troca);return h.posicao < 100 && d.getFullYear()===selYear&&d.getMonth()===i;}).length;
    return `<button class="month-tab flex flex-col items-center gap-1 px-2 py-2 border rounded-md text-[11px] font-semibold ${i===selMonth?'active border-primary-container bg-purple-50/50 text-primary-container':'border-outline-variant/40 bg-surface-container-low text-on-surface-variant'} ${cnt>0?'':''}" data-month="${i}"><span>${m}</span>${cnt>0?`<span class="month-tab-count">${cnt}</span>`:''}</button>`;
  }).join('');
  $('monthTabs').querySelectorAll<HTMLButtonElement>('.month-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{selMonth=parseInt(btn.dataset.month!);renderMonthly();});
  });
  // Content
  const body=$('monthBody') as HTMLTableSectionElement, empty=$('monthEmpty'), summary=$('monthSummary');
  const data=historico.filter(h=>{const d=new Date(h.data_troca);return h.posicao < 100 && d.getFullYear()===selYear&&d.getMonth()===selMonth;}).sort((a,b)=>new Date(b.data_troca).getTime()-new Date(a.data_troca).getTime());
  if(!data.length){body.innerHTML='';empty.style.display='block';summary.innerHTML='';return;}
  empty.style.display='none';
  body.innerHTML=data.map(h=>{const st=getStatus(h.idade_dias);return `<tr class="border-b border-outline-variant/20 hover:bg-surface-bright/80 transition-colors"><td class="px-4 py-3 font-mono text-xs text-on-surface-variant">${fmtDate(h.data_troca)}</td><td class="px-4 py-3 font-semibold text-on-surface">Rolo ${h.posicao}</td><td class="px-4 py-3"><span class="turno-badge turno-${h.turno} text-[10px] font-bold px-2 py-0.5 rounded inline-block">${h.turno}</span></td><td class="px-4 py-3 font-mono">${h.diametro} mm</td><td class="px-4 py-3 text-on-surface-variant">${sanitize(h.obs_motivo) || '—'}</td><td class="px-4 py-3"><span class="age-badge age-${st} text-xs font-bold px-2 py-0.5 rounded inline-block">${h.idade_dias}d</span></td></tr>`;}).join('');
  const byPos:Record<number,number>={};data.forEach(h=>{byPos[h.posicao]=(byPos[h.posicao]||0)+1;});
  const avg=data.length?Math.round(data.reduce((s,h)=>s+h.idade_dias,0)/data.length):0;
  summary.innerHTML=`<div class="summary-row"><div class="summary-card"><span class="summary-val">${data.length}</span><span class="summary-lbl">Trocas em ${MF[selMonth]}</span></div><div class="summary-card"><span class="summary-val">${avg}d</span><span class="summary-lbl">Tempo Médio</span></div>${Object.entries(byPos).map(([p,c])=>`<div class="summary-card"><span class="summary-val">${c}</span><span class="summary-lbl">Rolo ${p}</span></div>`).join('')}</div>`;
}

function renderDecapagemMonthly(){
  $('yearDecapagemLabel').textContent=String(selDecapagemYear);
  $('monthDecapagemTabs').innerHTML=MN.map((m,i)=>{
    const cnt=historico.filter(h=>{const d=new Date(h.data_troca);return h.posicao >= 100 && d.getFullYear()===selDecapagemYear&&d.getMonth()===i;}).length;
    return `<button class="month-tab flex flex-col items-center gap-1 px-2 py-2 border rounded-md text-[11px] font-semibold ${i===selDecapagemMonth?'active border-primary-container bg-purple-50/50 text-primary-container':'border-outline-variant/40 bg-surface-container-low text-on-surface-variant'}" data-month="${i}"><span>${m}</span>${cnt>0?`<span class="month-tab-count">${cnt}</span>`:''}</button>`;
  }).join('');
  $('monthDecapagemTabs').querySelectorAll<HTMLButtonElement>('.month-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{selDecapagemMonth=parseInt(btn.dataset.month!);renderDecapagemMonthly();});
  });
  // Content
  const body=$('monthDecapagemBody') as HTMLTableSectionElement, empty=$('monthDecapagemEmpty'), summary=$('monthDecapagemSummary');
  const data=historico.filter(h=>{const d=new Date(h.data_troca);return h.posicao >= 100 && d.getFullYear()===selDecapagemYear&&d.getMonth()===selDecapagemMonth;}).sort((a,b)=>new Date(b.data_troca).getTime()-new Date(a.data_troca).getTime());
  if(!data.length){body.innerHTML='';empty.style.display='block';summary.innerHTML='';return;}
  empty.style.display='none';
  body.innerHTML=data.map(h=>{
    const st=getStatus(h.idade_dias);
    const meta = DECAPAGEM_MAP[h.posicao];
    const name = meta ? meta.nome : `Rolo ${h.posicao}`;
    return `<tr class="border-b border-outline-variant/20 hover:bg-surface-bright/80 transition-colors"><td class="px-4 py-3 font-mono text-xs text-on-surface-variant">${fmtDate(h.data_troca)}</td><td class="px-4 py-3 font-semibold text-on-surface">${name}</td><td class="px-4 py-3"><span class="turno-badge turno-${h.turno} text-[10px] font-bold px-2 py-0.5 rounded inline-block">${h.turno}</span></td><td class="px-4 py-3 font-mono">${h.diametro} mm</td><td class="px-4 py-3 text-on-surface-variant">${sanitize(h.obs_motivo) || '—'}</td><td class="px-4 py-3"><span class="age-badge age-${st} text-xs font-bold px-2 py-0.5 rounded inline-block">${h.idade_dias}d</span></td></tr>`;
  }).join('');
  const byPos:Record<number,number>={};data.forEach(h=>{byPos[h.posicao]=(byPos[h.posicao]||0)+1;});
  const avg=data.length?Math.round(data.reduce((s,h)=>s+h.idade_dias,0)/data.length):0;
  summary.innerHTML=`<div class="summary-row"><div class="summary-card"><span class="summary-val">${data.length}</span><span class="summary-lbl">Trocas em ${MF[selDecapagemMonth]}</span></div><div class="summary-card"><span class="summary-val">${avg}d</span><span class="summary-lbl">Tempo Médio</span></div>${Object.entries(byPos).map(([p,c])=>{
    const meta = DECAPAGEM_MAP[parseInt(p)];
    const name = meta ? meta.nome : `Rolo ${p}`;
    return `<div class="summary-card"><span class="summary-val">${c}</span><span class="summary-lbl">${name}</span></div>`;
  }).join('')}</div>`;
}

$('prevYear').addEventListener('click',()=>{selYear--;renderMonthly();});
$('nextYear').addEventListener('click',()=>{selYear++;renderMonthly();});
$('prevDecapagemYear').addEventListener('click',()=>{selDecapagemYear--;renderDecapagemMonthly();});
$('nextDecapagemYear').addEventListener('click',()=>{selDecapagemYear++;renderDecapagemMonthly();});

// ===== RB1 COMPLETA — Stats =====
function renderRb1CompletaStats() {
  const bar = $('statsRb1CompletaBar');
  if (!bar) return;
  const totalRolosForno = [0,1,2,3,4].filter(p => getRolo(p)).length;
  const totalRolosDecap = DECAPAGEM_ORDER.filter(p => getRolo(p)).length;
  const totalEstoque = estoque.length;
  const totalTrocas = historico.length;
  const ic: Record<string,string> = {
    'si-stock': 'bg-purple-50 text-purple-600',
    'si-alert': 'bg-red-50 text-red-600',
    'si-swaps': 'bg-amber-50 text-amber-600',
    'si-total': 'bg-blue-50 text-blue-600'
  };
  bar.innerHTML = [
    {i:'🔥',v:totalRolosForno,l:'Rolos Forno',c:'si-alert'},
    {i:'⚡',v:totalRolosDecap,l:'Rolos Decapagem',c:'si-swaps'},
    {i:'📦',v:totalEstoque,l:'Estoque Total',c:'si-stock'},
    {i:'📊',v:totalTrocas,l:'Trocas Totais',c:'si-total'}
  ].map(s=>`<div class="bg-white border border-outline-variant/60 rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div class="w-10 h-10 rounded-lg ${ic[s.c]} flex items-center justify-center text-lg flex-shrink-0">${s.i}</div>
    <div><div class="font-display text-xl font-extrabold text-on-surface">${s.v}</div>
    <div class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">${s.l}</div></div></div>`).join('');
}

// ===== RB1 COMPLETA — Technical Industrial Diagram =====
function renderRb1Completa() {
  const W = 12000, H = 900;
  const BK = '#cbd5e1'; // light slate for lines
  const BG = '#161925'; // dark background
  const LK = '#1a1a1a'; // line color
  const SW = '1.2';      // stroke-width
  const FS = 'font-family="JetBrains Mono, monospace"';
  const FSL = 'font-family="Montserrat, sans-serif"';
  
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:${W}px;height:auto;display:block;background:#050816;">
  <defs>
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
    </filter>
    <filter id="yellowGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="mistBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
    </filter>
    <linearGradient id="waterJetGradDown" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="waterJetGradUp" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="metalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="25%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="75%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <radialGradient id="metalInner" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="80%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="smallMetal" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="fireCore" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#fffbe6" stop-opacity="1"/>
      <stop offset="8%" stop-color="#fff176" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#ffcc02" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#ff8f00" stop-opacity="0.6"/>
      <stop offset="80%" stop-color="#e65100" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#bf360c" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="fireMid" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ffab00" stop-opacity="0.9"/>
      <stop offset="20%" stop-color="#ff8f00" stop-opacity="0.75"/>
      <stop offset="50%" stop-color="#ff6d00" stop-opacity="0.5"/>
      <stop offset="80%" stop-color="#dd2c00" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#870000" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="fireOuter" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ff6d00" stop-opacity="0.7"/>
      <stop offset="30%" stop-color="#e65100" stop-opacity="0.45"/>
      <stop offset="65%" stop-color="#bf360c" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#4e0000" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="fireBase" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ff8f00" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#e65100" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#bf360c" stop-opacity="0.1"/>
    </linearGradient>
    <radialGradient id="emberGlow" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#ff6d00" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#e65100" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#4e0000" stop-opacity="0.0"/>
    </radialGradient>
    <filter id="fireGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="fireGlowSoft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>`;

  function rolerDecap(cx: number, cy: number, r: number, label: string = '', sub: string = '', hasStand: boolean = true, posId?: number, isLarge: boolean = false) {
    let fill = "#052e16", stroke = "#22c55e", filter = "url(#greenGlow)";
    if (posId !== undefined) {
      const rolo = getRolo(posId as any);
      if (rolo) {
        const st = getStatus(calcDays(rolo.data_troca));
        if (st === 'yellow') { fill = "#422006"; stroke = "#facc15"; filter = "url(#yellowGlow)"; }
        else if (st === 'red') { fill = "#450a0a"; stroke = "#f87171"; filter = "url(#redGlow)"; }
      }
    }
    let s = '';
    if (posId !== undefined) {
      s += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
      s += `<circle cx="${cx}" cy="${cy}" r="${Math.max(r + 10, 25)}" fill="transparent" />`; // Invisible hit area
    }
    // Stand Forno Style
    let sh = 30;
    if (hasStand) {
      let sw = r * 1.2;
      s += `<rect x="${cx - sw/2}" y="${cy + r - 2}" width="${sw}" height="${sh}" fill="#374151" rx="2"/>`;
      s += `<rect x="${cx - sw/2 - 5}" y="${cy + r + sh - 8}" width="${sw + 10}" height="8" fill="#4b5563" rx="2"/>`;
    }
    
    // Core (Dark) + Outer Glow
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="${filter}"/>`;
    
    // Animated Inner Dashed Ring
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" class="spin-slow" style="transform-origin: ${cx}px ${cy}px"/>`;
    
    // Center Text (Number / Dot)
    s += `<circle cx="${cx}" cy="${cy}" r="3" fill="${stroke}"/>`;

    // Typography (Stacked Below)
    if (label) {
      let textY = hasStand ? cy + r + sh + 15 : cy + r + 15;
      let fSize = isLarge ? '13' : '10';
      let fWeight = isLarge ? '900' : 'bold';
      s += `<text x="${cx}" y="${textY}" font-family="JetBrains Mono, monospace" font-size="${fSize}" font-weight="${fWeight}" fill="#ffffff" text-anchor="middle">${label.toUpperCase()}</text>`;
      if (sub) {
        s += `<text x="${cx}" y="${textY + 12}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="bold" fill="#22c55e" text-anchor="middle">${sub}</text>`;
        s += `<text x="${cx}" y="${textY + 23}" font-family="JetBrains Mono, monospace" font-size="8" fill="#9ca3af" text-anchor="middle">2140mm</text>`;
      }
    }
    if (posId !== undefined) {
      s += `</g>`;
    }
    return s;
  }

  
  // ====================================================================
  // HELPER FUNCTIONS (Absolutely Empty)
  // ====================================================================
  
  function dot(cx: number, cy: number, r: number = 4.5, posId?: number): string { 
    let fill = "#052e16", stroke = "#22c55e", filter = "url(#greenGlow)";
    if (posId !== undefined) {
      const rolo = getRolo(posId as any);
      if (rolo) {
        const st = getStatus(calcDays(rolo.data_troca));
        if (st === 'yellow') { fill = "#422006"; stroke = "#facc15"; filter = "url(#yellowGlow)"; }
        else if (st === 'red') { fill = "#450a0a"; stroke = "#f87171"; filter = "url(#redGlow)"; }
      }
    }
    let s = '';
    if (posId !== undefined) {
      s += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
      s += `<circle cx="${cx}" cy="${cy}" r="${Math.max(r + 10, 20)}" fill="transparent" />`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="${filter}"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="${stroke}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    if (posId !== undefined) s += `</g>`;
    return s;
  }
  
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 16, w: number = 8): string { 
    let s=''; for(let i=0; i<count; i++) s += `<rect x="${x + i*spacing}" y="${cy - h/2}" width="${w}" height="${h}" fill="#1e293b" rx="2"/>`; return s;
  }
  function solidCoil(cx: number, cy: number, r: number, label: string): string { 
    return rolerDecap(cx, cy, r, label, '', true, 200);
  }
  
  function maqSolda(cx: number, cy: number): string { 
    return `<rect x="${cx-20}" y="${cy-30}" width="40" height="60" fill="#1e293b" stroke="#050816" stroke-width="2" rx="4"/>
            <text x="${cx}" y="${cy-40}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">MÁQUINA SOLDA</text>
            <circle cx="${cx}" cy="${cy}" r="10" fill="#f97316" filter="url(#blueGlow)"/>`; 
  }
  
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string { 
    let s = `<polygon points="${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += dot(cx - w/2, cy, 6, 201) + dot(cx + w/2, cy, 6, 202);
    s += `<text x="${cx}" y="${cy - h/2 - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string, posId?: number): string { 
    let fill = "#052e16", stroke = "#22c55e", filter = "url(#greenGlow)", inner = "#4ade80";
    if (posId !== undefined) {
      const rolo = getRolo(posId as any);
      if (rolo) {
        const st = getStatus(calcDays(rolo.data_troca));
        if (st === 'yellow') { fill = "#422006"; stroke = "#facc15"; filter = "url(#yellowGlow)"; inner = "#facc15"; }
        else if (st === 'red') { fill = "#450a0a"; stroke = "#f87171"; filter = "url(#redGlow)"; inner = "#f87171"; }
      }
    }
    let s = '';
    if (posId !== undefined) {
      s += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r + 15}" fill="transparent" />`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" filter="${filter}"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="${inner}"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="${inner}"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    if (posId !== undefined) s += `</g>`;
    return s;
  }
  
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string { 
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
    // Liquid
    s += `<rect x="${x+2}" y="${y+h/2}" width="${w-4}" height="${h/2-2}" fill="#0ea5e9" opacity="0.2"/>`;
    s += `<text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    rollers.forEach(rx => {
      s += rolerDecap(x + rx, y + h - 25, 20, '', '', false, 203);
    });
    return s;
  }
  
  function blocoQuad(cx: number, cy: number, size: number, label: string): string { 
    // Espremedor Style
    let s = `<rect x="${cx - size/2}" y="${cy - size/2}" width="${size}" height="${size}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
    s += `<circle cx="${cx - 15}" cy="${cy - 15}" r="10" fill="#fbbf24" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx-15}px ${cy-15}px"/>`;
    s += `<circle cx="${cx + 15}" cy="${cy - 15}" r="10" fill="url(#metalOuter)" stroke="#050816" stroke-width="1" class="spin-fast" style="transform-origin: ${cx+15}px ${cy-15}px"/>`;
    s += `<text x="${cx}" y="${cy - size/2 - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    s += `<text x="${cx}" y="${cy - size/2 + 2}" font-family="Montserrat, sans-serif" font-size="9" font-weight="800" fill="#fbbf24" text-anchor="middle">800 mm</text>`;
    return s;
  }
  
  function tesoura3(cx: number, cy: number, label: string): string { 
    // Left blade (pointing up)
    let s = `<rect x="${cx - 10}" y="${cy - 25}" width="10" height="25" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    // Right blade (pointing down)
    s += `<rect x="${cx}" y="${cy}" width="10" height="25" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += `<text x="${cx}" y="${cy - 35}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  function mesaInspecao(x: number, y: number, w: number): string { 
    return `<rect x="${x}" y="${y+1}" width="${w}" height="60" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/>
            <text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">MESA INSPEÇÃO</text>`;
  }

  // ====================================================================
  // PASS-LINE PATH TRACKING
  // ====================================================================
  let stripPath = "M 100 170 ";
  function lineTo(x: number, y: number) { stripPath += `L ${x} ${y} `; }
  function curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    stripPath += `C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y} `;
  }

  const Y1 = 170;
  const Y2 = 450;
  const YM = 450; // Main line continues at Y2 level

  // ====================================================================
  // SEÇÃO 1: ENTRADAS DUPLAS (Fully Detailed Blueprint 1-73)
  // ====================================================================
  
  function rNr(cx: number, cy: number, r: number, n: string, tx: number, ty: number, lx: number, ly: number, ltx: number, lty: number, fs: number = 9) {
    let g = '';
    g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    if (r >= 3) {
      g += `<circle cx="${cx}" cy="${cy}" r="${r - 1.5}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" class="spin-slow" style="transform-origin: ${cx}px ${cy}px"/>`;
    }
    g += `<circle cx="${cx}" cy="${cy}" r="1" fill="#4ade80"/>`;
    return g;
  }

  function rectSens(cx: number, num: string) {
    let out = `<rect x="${cx-5}" y="${Y1-20}" width="10" height="20" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
    out += `<line x1="${cx}" y1="${Y1}" x2="${cx}" y2="${Y1+6}" stroke="#0f172a" stroke-width="1.5"/>`;
    return out;
  }

  // === ENTRADA 1 ===
  svg += `<text x="90" y="${Y1 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 1</text>`;
  
  // Bobina Principal (Premium CAD)
  svg += rolerDecap(100, Y1 + 40, 40, 'Desbobinadeira 1', '', true, 204, true);
  
  // 1 e 2 na Bobina (Snubber rolls resting on the coil)
  // Coil center is (100, Y1+40=210). Radius=40. Roller radius=8. Gap=1. Dist=49.
  // 1 at 180 degrees: cx = 100 - 49*cos(0) = 51, cy = 210 - 49*sin(0) = 210
  // 2 at 100 degrees: cx = 100 - 49*cos(80) = 100 - 49*0.1736 = 91.5, cy = 210 - 49*sin(80) = 210 - 49*0.9848 = 161.7
  svg += rNrForno(51.0, 210.0, 8, '', 0, 0, 205);
  svg += rNrForno(91.5, 161.7, 8, '', 0, 0, 206);
  
  // 3, 4 (Pinch)
  let pX1 = 158;
  svg += rNrForno(pX1, Y1 - 13.75, 12, '', 0, 0, 207);
  svg += rNrForno(pX1, Y1 + 13.75, 12, '', 0, 0, 208);
  
  // 5 (Lower)
  svg += rNrForno(185, Y1 + 11.75, 10, '', 0, 0, 209);
  
  // 6-10 (Leveler / Straightener)
  // Upper rollers: 7, 9 (center Y1 - 6.75)
  // Lower rollers: 6, 8, 10 (center Y1 + 6.75)
  let stX1 = 215;
  svg += rNrForno(stX1,      Y1 + 6.75, 5, '', 0, 0, 210); // 6
  svg += rNrForno(stX1 + 10, Y1 - 6.75, 5, '', 0, 0, 211); // 7
  svg += rNrForno(stX1 + 20, Y1 + 6.75, 5, '', 0, 0, 212); // 8
  svg += rNrForno(stX1 + 30, Y1 - 6.75, 5, '', 0, 0, 213); // 9
  svg += rNrForno(stX1 + 40, Y1 + 6.75, 5, '', 0, 0, 214); // 10

  // 11-15 (Inline)
  // All lower rollers
  let inX1 = 275;
  for(let i=0; i<5; i++) {
    svg += rNrForno(inX1 + i*15, Y1 + 6.75, 5, '', 0, 0, 215);
  }

  // 19, 20 (Pinch)
  svg += rNrForno(370, Y1-14, 14, '', 0, 0, 216);
  svg += rNrForno(370, Y1+14, 14, '', 0, 0, 217);

  // TESOURA 1
  let tesX = 430;
  svg += `<text x="${tesX+20}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="${tesX}" y="${Y1-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tesX+15}" y="${Y1}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 

  // Table 21-26
  let tabX = 490;
  // Rectangle and connector removed per user request
  let tbx = tabX;
  for(let i=21; i<=26; i++) {
    svg += rNrForno(tbx, Y1+5, 5, '', 0, 0, 218);
    tbx += 10;
  }

  // 27-31
  let brx = 570;
  for(let i=27; i<=31; i++) {
    svg += rNrForno(brx, Y1+5, 5, '', 0, 0, 219);
    brx += 10;
  }

  // ENROLADOR TIRAS
  let enrX = 640;
  svg += `<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle" style="pointer-events:none;">ENROLADOR DE TIRAS</text>`;
  
  // Bracket arms
  svg += `<path d="M ${enrX-10} ${Y1-12} L ${enrX} ${Y1-6} L ${enrX+16} ${Y1-6} L ${enrX+26} ${Y1-12}" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round" style="pointer-events:none;"/>`;
  
  // Top rollers (green glowing design)
  svg += rNrForno(enrX, Y1-8, 8, '', 0, 0, 220);
  svg += rNrForno(enrX+16, Y1-8, 8, '', 0, 0, 221);
  
  // Bottom rollers (green glowing design)
  svg += rNrForno(enrX, Y1+8, 8, '', 0, 0, 222);
  svg += rNrForno(enrX+16, Y1+8, 8, '', 0, 0, 223);

  // 36
  svg += rNrForno(680, Y1+5, 5, '', 0, 0, 224);

  // 37-42
  let srx = 700;
  for(let i=37; i<=42; i++) {
    svg += rNrForno(srx, Y1+5, 5, '', 0, 0, 225);
    srx += 10;
  }

  // 43 Sensor
  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="#64748b" stroke-width="2"/>`;
  srx += 10;

  // 44-72
  for(let i=44; i<=72; i++) {
    svg += rNrForno(srx, Y1+5, 5, '', 0, 0, 226);
    srx += 10;
  }
  // Now srx is at 700 + 6*10 + 10 + 29*10 = 1060 (actually, loop runs 29 times, adds 10 at the end, so srx=1060, roller 72 is at 1050).
  // So roller 72 is at 1050.

  // 73 and 74 (Large Pinch)
  let pX = 1090; // perfectly spaced after roller 72 at 1050
  svg += rNr(pX, Y1-18, 18, '73', pX, Y1-45, pX, Y1-43, pX, Y1-36);
  svg += rNr(pX, Y1+30, 30, '74', pX, Y1+70, pX, Y1+68, pX, Y1+60);

  // Slant geometry
  // C1 = 1090, 200, R=30. Dest C2 = 1350, 420, R=30.
  // Internal tangent from right side of C1 to bottom side of C2.
  // Tangent point T1 on C1: (1113.11, 180.87)
  // Tangent point T2 on C2: (1326.89, 439.13)
  // Normal of line pointing down-left is (-0.770, 0.638)
  // Normal of line pointing up-right is (0.770, -0.638)
  
  // 75-83 (Rollers on slant)
  let ds = 35; // start offset along line
  for (let i=75; i<=83; i++) {
    let px = 1113.11 + ds * 0.6376; 
    let py = 180.87 + ds * 0.7703; 
    
    // Normal down-left is (-0.770, 0.638)
    // Distance from center of line to center of roller:
    // Line thickness is 1.5 (half is 0.75) + 1px gap + 6 (roller radius) = 7.75
    let dist = 7.75;
    let cx = px - dist * 0.770;
    let cy = py + dist * 0.638;
    let r = 6;
    
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    
    ds += 31.5; // spacing to fit exactly 9 rollers over ~335 length
  }

  // === ENTRADA 2 ===
  svg += `<text x="60" y="${Y2 - 50}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#94a3b8">ENTRADA 2</text>`;
  
  // Helper for small numbered rollers
  function rNrForno(cx: number, cy: number, r: number, num: string, nx: number, ny: number, posId?: number) {
    let fill = "#052e16", stroke = "#22c55e", filter = "url(#greenGlow)";
    if (posId !== undefined) {
      const rolo = getRolo(posId as any);
      if (rolo) {
        const st = getStatus(calcDays(rolo.data_troca));
        if (st === 'yellow') { fill = "#422006"; stroke = "#facc15"; filter = "url(#yellowGlow)"; }
        else if (st === 'red') { fill = "#450a0a"; stroke = "#f87171"; filter = "url(#redGlow)"; }
      }
    }
    let s = '';
    if (posId !== undefined) {
      s += `<g data-rolo-pos="${posId}" class="rolo-clickable" style="cursor: pointer;">`;
      s += `<circle cx="${cx}" cy="${cy}" r="${Math.max(r + 10, 20)}" fill="transparent" />`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="${filter}"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="${stroke}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    s += `<text x="${nx}" y="${ny}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${num}</text>`;
    if (posId !== undefined) s += `</g>`;
    return s;
  }

  // Bobina Principal (Defletor)
  svg += rolerDecap(100, Y2 + 40, 40, 'Desbobinadeira 2', '', true, 227, true);
  
  // 86, 87 (Snubber rolls resting on the coil)
  // Coil center is (100, Y2+40=490). Radius=40. Roller radius=8. Gap=1. Dist=49.
  // 86 at ~140 degrees: cx = 100 - 49*cos(40) = 62.5, cy = 490 - 49*sin(40) = 458.5
  // 87 at ~110 degrees: cx = 100 - 49*cos(70) = 83.2, cy = 490 - 49*sin(70) = 444.0
  svg += rNrForno(62.5, 458.5, 8, '', 0, 0, 228);
  svg += rNrForno(83.2, 444.0, 8, '', 0, 0, 229);

  // 88, 89 (Pinch)
  let p88X = 160;
  svg += rNrForno(p88X, Y2 - 13.75, 12, '', 0, 0, 230);
  svg += rNrForno(p88X, Y2 + 13.75, 12, '', 0, 0, 231);

  // 90 (Lower)
  svg += rNrForno(200, Y2 + 11.75, 10, '', 0, 0, 232);

  // 91-95 (Leveler / Straightener)
  // Lower: 91, 95, 94. Upper: 92, 93.
  let l91X = 240;
  svg += rNrForno(l91X,      Y2 + 7.75, 6, '', 0, 0, 233); // 91 (Lower)
  svg += rNrForno(l91X + 12, Y2 - 7.75, 6, '', 0, 0, 234); // 92 (Upper)
  svg += rNrForno(l91X + 24, Y2 + 7.75, 6, '', 0, 0, 235); // 95 (Lower)
  svg += rNrForno(l91X + 36, Y2 - 7.75, 6, '', 0, 0, 236); // 93 (Upper)
  svg += rNrForno(l91X + 48, Y2 + 7.75, 6, '', 0, 0, 237); // 94 (Lower)

  // 96-100 (Inline lower)
  let i96X = 310;
  for(let i=0; i<5; i++) {
    svg += rNrForno(i96X + i*15, Y2 + 7.75, 6, '', 0, 0, 238);
  }

  // 104, 105 (Pinch)
  let pX2 = 460;
  svg += rNrForno(pX2, Y2 - 13.75, 12, '', 0, 0, 239);
  svg += rNrForno(pX2, Y2 + 13.75, 12, '', 0, 0, 240);

  // TESOURA 2
  let tes2X = 550;
  svg += `<text x="${tes2X+20}" y="${Y2-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 2</text>`;
  svg += `<rect x="${tes2X}" y="${Y2-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tes2X+15}" y="${Y2}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 

  // 106-109 Hydraulic Table
  let tbE2X = 700;
  // Table Box
  svg += `<rect x="${tbE2X - 10}" y="${Y2 + 2}" width="120" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Rollers (106 to 109)
  svg += rNrForno(tbE2X + 10, Y2 + 7.75, 6, '', 0, 0, 241);
  svg += rNrForno(tbE2X + 40, Y2 + 7.75, 6, '', 0, 0, 242);
  svg += rNrForno(tbE2X + 70, Y2 + 7.75, 6, '', 0, 0, 243);
  svg += rNrForno(tbE2X + 100, Y2 + 7.75, 6, '', 0, 0, 244);

  // 110-116 Inline bottom rollers
  let inE2X = 860;
  for(let i=0; i<7; i++) {
    svg += rNrForno(inE2X + i*25, Y2 + 7.75, 6, '', 0, 0, 245);
  }

  // ENROLADOR DE TIRAS
  let enrE2X = 1080;
  svg += `<text x="${enrE2X+37}" y="${Y2-45}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle" style="pointer-events:none;">ENROLADOR DE TIRAS</text>`;
  // Curved Top Guide (Crescent shape)
  svg += `<path d="M ${enrE2X+15} ${Y2-25} Q ${enrE2X+37} ${Y2-5} ${enrE2X+60} ${Y2-25} Q ${enrE2X+37} ${Y2-15} ${enrE2X+15} ${Y2-25}" fill="#1e293b" stroke="#94a3b8" stroke-width="2" style="pointer-events:none;"/>`;
  
  // Upper rollers (117, 119, 120, 122)
  svg += rNrForno(enrE2X, Y2 - 7.75, 6, '', 0, 0, 246); // 117
  svg += rNrForno(enrE2X + 25, Y2 - 7.75, 6, '', 0, 0, 247); // 119
  svg += rNrForno(enrE2X + 50, Y2 - 7.75, 6, '', 0, 0, 248); // 120
  svg += rNrForno(enrE2X + 75, Y2 - 7.75, 6, '', 0, 0, 249); // 122
  
  // Lower rollers (118, 121)
  svg += rNrForno(enrE2X + 25, Y2 + 7.75, 6, '', 0, 0, 250); // 118
  svg += rNrForno(enrE2X + 50, Y2 + 7.75, 6, '', 0, 0, 251); // 121

  // 123-125 Bottom rollers
  let trE2X = 1240;
  svg += rNrForno(trE2X, Y2 + 7.75, 6, '', 0, 0, 252);
  svg += rNrForno(trE2X + 30, Y2 + 7.75, 6, '', 0, 0, 253);
  svg += rNrForno(trE2X + 60, Y2 + 7.75, 6, '', 0, 0, 254);

  // Merge Bridle  // Merge Bridle (Restored Mergulhador)
  svg += rolerDecap(1350, Y2-30, 30, '', '', true, 255);
  svg += dot(1350, Y2+15, 15, 256);

  // Path 1 (Entrada 1)
  stripPath = `M 100 ${Y1} `;
  lineTo(pX, Y1); 
  stripPath += `A 30 30 0 0 1 1113.11 180.87 `; 
  lineTo(1326.89, 439.13); 
  stripPath += `A 30 30 0 0 0 1350 450 `;

  // Path 2 (Entrada 2)
  let p2 = `M 100 ${Y2} `;
  p2 += `L 1350 ${Y2} `; 
  svg += `<path d="${p2}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>`;
  svg += `<path d="${p2}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;

  // ====================================================================
  // SEÇÃO 2: SOLDA E PREPARAÇÃO (Layout Atualizado)
  // ====================================================================
  
  // 1. Group 1: 7 Rollers ALL BOTTOM, NO LABELS
  let ax = 1510;
  for(let i=0; i<7; i++) {
    // cy = YM + 6 (bottom rollers)
    svg += rNrForno(ax, YM + 6, 6, '', ax, YM + 22, 257);
    ax += 14; // Tight spacing
  }

  // 2. Hydraulic Table: 3 Rollers ALL BOTTOM, NO LABELS
  let tbX = ax + 15;
  
  // Hydraulic Cylinder Support (Removido a pedido)
  // Floor mount with hatching (Removido a pedido)
  
  // Table Box (Snug fit)
  svg += `<rect x="${tbX - 5}" y="${YM + 2}" width="95" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers on table (Bottom rollers, NO LABELS)
  // First one is slightly larger
  svg += rNrForno(tbX + 15, YM + 10, 10, '', tbX + 15, YM - 15, 258);
  svg += rNrForno(tbX + 45, YM + 6, 6, '', tbX + 45, YM - 15, 259);
  svg += rNrForno(tbX + 75, YM + 6, 6, '', tbX + 75, YM - 15, 260);

  // 3. Group 2: 10 Rollers ALL BOTTOM, NO LABELS
  let bx = tbX + 105;
  for(let i=0; i<10; i++) {
    svg += rNrForno(bx, YM + 6, 6, '', bx, YM + 22, 261);
    bx += 14; // Tight spacing
  }

  // MÁQUINA DE SOLDA Text
  let sn1 = bx + 25;
  svg += `<text x="${sn1 + 30}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">MÁQUINA DE SOLDA</text>`;

  // 4. Sensor 1: Box, line passing through, NO LABELS
  svg += `<rect x="${sn1 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Downward line
  svg += `<line x1="${sn1}" y1="${YM + 15}" x2="${sn1}" y2="${YM + 25}" stroke="#22c55e" stroke-width="1.5"/>`;

  // 5. Cross Mark
  let cx = sn1 + 35; // D1
  svg += `<line x1="${cx - 10}" y1="${YM - 20}" x2="${cx + 10}" y2="${YM - 20}" stroke="#22c55e" stroke-width="2"/>`; // Horizontal
  svg += `<line x1="${cx}" y1="${YM - 35}" x2="${cx}" y2="${YM + 5}" stroke="#22c55e" stroke-width="1.5"/>`; // Vertical (taller)

  // 6. Group 3: 2 Rollers ALL BOTTOM, NO LABELS
  let r147 = cx + 45; // D2
  let r148 = r147 + 35; // D3
  svg += rNrForno(r147, YM + 8, 8, '', r147, YM + 30, 262);
  svg += rNrForno(r148, YM + 8, 8, '', r148, YM + 30, 263);

  // 7. Pinch Rollers (149/150): BOTH EXACTLY SAME SIZE (r=8), NO LABELS
  let px = r148 + 55; // D4 (wider gap)
  svg += rNrForno(px, YM - 8, 8, '', px, YM - 25, 264); // Top
  svg += rNrForno(px, YM + 8, 8, '', px, YM + 25, 265); // Bottom

  // 8. Sensor 2 & Scrap Bucket: Box, line passing through, NO LABELS
  let sn2 = px + 40; // D5
  svg += `<rect x="${sn2 - 10}" y="${YM - 25}" width="20" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Dotted drop line
  svg += `<line x1="${sn2}" y1="${YM + 15}" x2="${sn2}" y2="${YM + 80}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>`; 

  // Bucket (Trapezoid)
  let bkY = YM + 80;
  svg += `<polygon points="${sn2 - 40},${bkY} ${sn2 + 40},${bkY} ${sn2 + 25},${bkY + 35} ${sn2 - 25},${bkY + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Re-sync lineTo position
  lineTo(sn2 + 60, YM);

  // ====================================================================
  // CONTINUAÇÃO: ROLOS 152 A 165  // ====================================================================
  // CONTINUAÇÃO: ROLOS 152 A 172 (COMPRESSED TO FIT BEFORE LOOP)
  // ====================================================================
  
  let nx = sn2 + 40;

  // 4 Bottom Rollers (152-155)
  let rx1 = nx;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx1, YM + 6, 6, '', rx1, YM, 266);
    rx1 += 14;
  }

  // Pinch (156, 157)
  let px2 = rx1 + 10;
  svg += rNrForno(px2, YM - 8, 8, '', px2, YM, 267); // Top
  svg += rNrForno(px2, YM + 8, 8, '', px2, YM, 268); // Bottom

  // Hydraulic Table (158, 159)
  let tb2X = px2 + 20;
  
  // Cylinder Support & Floor (Removido a pedido)
  let cylX1 = tb2X + 25;
  let cylY1 = YM + 27;
  let cylX2 = tb2X - 25;
  let cylY2 = YM + 90;
  
  // Table Box
  svg += `<rect x="${tb2X - 5}" y="${YM + 2}" width="60" height="25" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers 158 (large bottom), 159 (small bottom)
  svg += rNrForno(tb2X + 15, YM + 12, 12, '', tb2X + 15, YM, 269); // 158
  svg += rNrForno(tb2X + 45, YM + 6, 6, '', tb2X + 45, YM, 270); // 159

  // 4 Bottom Rollers (160-163)
  let rx2 = tb2X + 70;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx2, YM + 6, 6, '', rx2, YM, 271);
    rx2 += 14;
  }

  // Top Block (Thickness gauge / Wiper)
  let wblockX = rx2 + 15;
  svg += `<rect x="${wblockX}" y="${YM - 12}" width="35" height="12" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Large Deflector Pinch (164, 165)
  let dfX = wblockX + 50;
  svg += rNrForno(dfX, YM - 10, 10, '', dfX, YM, 272); // 164 (Top)
  svg += rNrForno(dfX, YM + 25, 25, '', dfX, YM, 273); // 165 (Bottom, very large)

  // ====================================================================
  // CONTINUAÇÃO: ROLOS 166 A 172 (Tanque, Secador, Corretor)
  // ====================================================================
  
  let tankStart = dfX + 50;
  let tankW = 140;
  let tankH = 60; // 30 up, 30 down from YM

  // Tank brackets `[` and `]`
  // Left bracket
  svg += `<polyline points="${tankStart+15},${YM-tankH/2} ${tankStart},${YM-tankH/2} ${tankStart},${YM+tankH/2} ${tankStart+15},${YM+tankH/2}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Right bracket
  svg += `<polyline points="${tankStart+tankW-15},${YM-tankH/2} ${tankStart+tankW},${YM-tankH/2} ${tankStart+tankW},${YM+tankH/2} ${tankStart+tankW-15},${YM+tankH/2}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Roller 166 (bottom) inside tank
  let r166X = tankStart + 40;
  svg += rNrForno(r166X, YM + 15, 15, '', r166X, YM, 274);

  // SECADOR
  let secX = tankStart + tankW + 30;
  
  // Text "SECADOR"
  svg += `<text x="${secX + 25}" y="${YM - 60}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // Pinch left (167, 169)
  svg += rNrForno(secX, YM - 8, 8, '', secX, YM, 275); // 167 Top
  svg += rNrForno(secX, YM + 8, 8, '', secX, YM, 276); // 169 Bottom
  
  // V-Shapes (Chevrons) - Air Nozzles
  let chevronCenter = secX + 25;
  
  // Top Nozzles (pointing DOWN)
  svg += `<polyline points="${chevronCenter - 15},${YM - 35} ${chevronCenter},${YM - 15} ${chevronCenter + 15},${YM - 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM - 50} ${chevronCenter},${YM - 30} ${chevronCenter + 15},${YM - 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Bottom Nozzles (pointing UP)
  svg += `<polyline points="${chevronCenter - 15},${YM + 35} ${chevronCenter},${YM + 15} ${chevronCenter + 15},${YM + 35}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  svg += `<polyline points="${chevronCenter - 15},${YM + 50} ${chevronCenter},${YM + 30} ${chevronCenter + 15},${YM + 50}" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Vertical center line (dashed)
  svg += `<line x1="${chevronCenter}" y1="${YM - 65}" x2="${chevronCenter}" y2="${YM + 65}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  
  // Pinch right (168, 170)
  let secRx = secX + 50;
  svg += rNrForno(secRx, YM - 8, 8, '', secRx, YM, 277); // 168 Top
  svg += rNrForno(secRx, YM + 8, 8, '', secRx, YM, 278); // 170 Bottom

  // Roller 171 (Strip passes OVER it)
  let r171X = secRx + 40; // 2596
  svg += rNrForno(r171X, YM + 8, 8, '', r171X, YM + 22, 279);

  // CORRETOR 1 (172) (Strip passes UNDER it)
  let corrX = r171X + 150; // Shifted right by 100px
  let corrY = YM - 25; // 425
  
  // Quadrant Pattern
  svg += `<circle cx="${corrX}" cy="${corrY}" r="25" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY - 25} A 25 25 0 0 1 ${corrX + 25} ${corrY} Z" fill="#4ade80"/>`;
  svg += `<path d="M ${corrX} ${corrY} L ${corrX} ${corrY + 25} A 25 25 0 0 1 ${corrX - 25} ${corrY} Z" fill="#4ade80"/>`;
  svg += `<circle cx="${corrX}" cy="${corrY}" r="2" fill="#ffffff"/>`;
  svg += `<text x="${corrX}" y="${YM + 35}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 1</text>`;

  // Extend strip path horizontally through Secador and 171, hitting EXACT bottom of Corretor 1
  lineTo(corrX, YM); 

  // ====================================================================
  // SEÇÃO 3: ACUMULADOR DE ENTRADA (LOOP)
  // ====================================================================

  console.log("Rendering BS1 with Perfect Geometric Inner Tangents v4 (R=36)");

  // Grupo BS1 (Bridle de Entrada do Loop - Figure-8 S-Wrap Diagonal)
  let bs1_L_X = corrX + 40, bs1_L_Y = 250, rL = 36; // Left-Top large roller (increased to 36 to touch the strip)
  let bs1_R_X = corrX + 140, bs1_R_Y = 350; // Right-Bottom large roller
  
  // Text BS1
  svg += `<text x="${bs1_L_X}" y="${bs1_L_Y - 60}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS1</text>`;

  svg += rNrForno(bs1_L_X, bs1_L_Y, rL, '', bs1_L_X, bs1_L_Y, 280); 
  svg += rNrForno(bs1_R_X, bs1_R_Y, rL, '', bs1_R_X, bs1_R_Y, 281); 
  
  // Pinches e Guias
  svg += rNrForno(bs1_R_X + 46, bs1_R_Y, 10, '', 0, 0, 282); // Pinch Right of BS1_R (moved from 40 to 46)
  svg += rNrForno(bs1_L_X - 10.6, bs1_L_Y - 44.8, 10, '', 0, 0, 283); // Pinch Top of BS1_L (moved to avoid cut)
  
  // Support rollers on horizontal exit (fita passa por CIMA deles agora)
  svg += rNrForno(bs1_L_X + 70, 225, 8, '', 0, 0, 284); // Moved to avoid overlap
  svg += rNrForno(bs1_L_X + 110, 227.8, 8, '', 0, 0, 285); // Moved OUT of txs[0]

  // Path from Corretor 1 to BS1
  // 1. Arco sob o Corretor 1
  stripPath += `A 25 25 0 0 0 ${corrX + 10.8} 447.5 `;
  
  // 2. Chegada no BS1_R (Bottom-Right, R=36 para folga perfeita do brilho)
  lineTo(bs1_R_X + 15.2, bs1_R_Y + 32.6); 
  
  // 3. Arco contornando a DIREITA do BS1_R até o ponto exato da tangente interna
  // Ponto de tangente: ângulo -75.61 deg -> dx = 8.95, dy = -34.87
  stripPath += `A 36 36 0 0 0 ${bs1_R_X + 8.95} ${bs1_R_Y - 34.87} `; 
  
  // 4. Linha RETA diagonal perfeitamente tangente até o BS1_L
  // Ponto de tangente: ângulo 104.39 deg -> dx = -8.95, dy = 34.87
  stripPath += `L ${bs1_L_X - 8.95} ${bs1_L_Y + 34.87} `;
  
  // 5. Arco perfeito abraçando o lado ESQUERDO do BS1_L até o Topo (R=36)
  stripPath += `A 36 36 0 0 1 ${bs1_L_X} ${bs1_L_Y - 36} `;   
  
  // 6. Transição suave horizontal para Y=220 (Curva mais curta para não invadir o Loop)
  stripPath += `L ${bs1_L_X + 20} ${bs1_L_Y - 36} `;
  stripPath += `C ${bs1_L_X + 50} ${bs1_L_Y - 36} ${bs1_L_X + 80} 220 ${bs1_L_X + 120} 220 `;

  // LOOP ENTRADA
  let txs = [3100, 3220, 3340]; // 179, 181, 183
  let bxs = [3160, 3280, 3400]; // 180, 182, 184
  let r185x = 3460;
  let TY = 250;
  let BY = 650;
  
  // Strip enters horizontally at TY - 30
  lineTo(txs[0], TY - 30); // Connect from BS1 horizontally to the first loop roller

  svg += `<text x="3280" y="150" font-family="Montserrat, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">LOOP ENTRADA</text>`;


  for (let x of txs) {
    svg += rNrForno(x, TY, 30, '', x, TY, 286);
  }
  for (let x of bxs) {
    svg += rNrForno(x, BY, 30, '', x, BY, 287);
  }
  
  // Draw Corretor (185) at r185x, TY
  let corr2X = r185x, corr2Y = TY;
  svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="30" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
  svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y - 30} A 30 30 0 0 1 ${corr2X + 30} ${corr2Y} Z" fill="#4ade80"/>`;
  svg += `<path d="M ${corr2X} ${corr2Y} L ${corr2X} ${corr2Y + 30} A 30 30 0 0 1 ${corr2X - 30} ${corr2Y} Z" fill="#4ade80"/>`;
  svg += `<circle cx="${corr2X}" cy="${corr2Y}" r="2" fill="#ffffff"/>`;
  svg += `<text x="${corr2X + 50}" y="${TY + 50}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 2</text>`;
  
  // Trace Loop Path
  // We are at top of 179 (txs[0], TY - 30)
  for (let i = 0; i < 3; i++) {
    let topX = txs[i];
    let botX = bxs[i];
    
    // Line to Top Roller (in case of gaps, but they are exactly vertical)
    lineTo(topX, TY - 30);
    
    // Arc Top to Right (Clockwise = 1)
    stripPath += `A 30 30 0 0 1 ${topX + 30} ${TY} `;
    
    // Down to Left of Bottom roller
    lineTo(botX - 30, BY);
    
    // Arc Left to Bottom (Counter-Clockwise = 0)
    stripPath += `A 30 30 0 0 0 ${botX} ${BY + 30} `;
    
    // Arc Bottom to Right (Counter-Clockwise = 0)
    stripPath += `A 30 30 0 0 0 ${botX + 30} ${BY} `;
    
    // Up to Left of Next Top roller
    if (i < 2) {
      lineTo(txs[i+1] - 30, TY);
      // Arc Left to Top (Clockwise = 1)
      stripPath += `A 30 30 0 0 1 ${txs[i+1]} ${TY - 30} `;
    } else {
      lineTo(r185x - 30, TY);
      // Arc Left to Top for Corretor 2
      stripPath += `A 30 30 0 0 1 ${r185x} ${TY - 30} `;
    }
  }
  
  // ====================================================================
  // BS2 (Bridle de Saída do Loop) e Rolos de Apoio
  // ====================================================================
  
  // 186 to 189 (Restored to perfectly match the Blueprint)
  // Strip is at Y = 220. Thickness is 2. 
  // Under rollers center = 220 + 1 (strip half) + 1 (gap) + 8 (radius) = 230
  // Over rollers center = 220 - 1 - 1 - 8 = 210

  // The vertical pit line is at X = 3510, so we leave a gap around it
  let x186 = 3505;
  svg += rNrForno(x186, 230, 8, '', x186, 230 - 15, 288); // 186 (Under strip)
  
  let x187 = 3535;
  svg += rNrForno(x187, 210, 8, '', x187, 210 - 15, 289); // 187 (Over strip)
  
  let x188 = 3535;
  svg += rNrForno(x188, 230, 8, '', x188, 230 - 15, 290); // 188 (Under strip)
  
  let x189 = 3575;
  svg += rNrForno(x189, 230, 8, '', x189, 230 - 15, 291); // 189 (Under strip)

  // BS2 Text
  svg += `<text x="3655" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS2</text>`;

  // Left Large Roller (192) - Lower position
  let r192x = 3610, r192y = 350;
  svg += rNrForno(r192x, r192y, 30, '', r192x, r192y, 292);

  // Right Large Roller (191) - Higher position
  let r191x = 3700, r191y = 250;
  svg += rNrForno(r191x, r191y, 30, '', r191x, r191y, 293);

  // Pinches 190, 193 (Perfectly positioned as per blueprint)
  svg += rNrForno(r191x - 17, 210, 8, '', 0, 0, 294); // 190 (Top-Left of 191, pinching horizontal strip)
  svg += rNrForno(r192x - 28.3, r192y + 28.3, 8, '', 0, 0, 295); // 193 (Bottom-Left of 192)

  // Removed old Roller 194 (at 3800) per user request (red X).
  // Adding two new support rolls. First is UNDER the sag curve, second is OVER the sag curve.
  svg += rNrForno(3680, 433, 8, '', 0, 0, 296); // Under the strip
  svg += rNrForno(3730, 431, 8, '', 0, 0, 297); // Over the strip
  // --- BS2 PATH TRACING ---
  // Extend strip horizontally to Top of 191
  lineTo(r191x, r191y - 30);
  
  // Wrap 191 (Top -> Right -> Bottom-Left)
  stripPath += `A 30 30 0 1 1 3692.2 278.8 `;
  
  // Diagonal inner tangent line from 191 to 192 (Bottom-Left to Top-Right)
  lineTo(3617.8, 321.2);
  
  // Wrap 192 (Top-Right -> Top -> Left -> Bottom)
  stripPath += `A 30 30 0 1 0 3610 380 `;
  
  // Smooth Catenary Sag Curve to Roller 194 (using Quadratic Bezier)
  stripPath += `Q 3700 450 3800 450 `;
  

  // ====================================================================
  // SEÇÃO 4: FORNO E RESFRIAMENTO
  // ====================================================================
  // Forno
  let fX = 3950, fY = YM - 40, fW = 600, fH = 140;
  svg += `<rect x="${fX}" y="${fY}" width="${fW}" height="${fH}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="4"/>`;
  svg += `<text x="${fX + fW/2}" y="${fY - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">FORNO DE RECOZIMENTO</text>`;
  
  // ── Realistic wispy fire animation ──
  const flameBottomY = fY + fH;
  
  // Clip flames to furnace interior
  svg += `<clipPath id="furnaceClip"><rect x="${fX+1}" y="${fY+1}" width="${fW-2}" height="${fH-2}" rx="3"/></clipPath>`;
  svg += `<g clip-path="url(#furnaceClip)">`;
  
  // Ambient heat glow (continuous warm base)
  svg += `<rect x="${fX}" y="${flameBottomY - 50}" width="${fW}" height="50" fill="url(#emberGlow)">
    <animate attributeName="opacity" values="0.6;0.9;0.7;1;0.6" dur="1.5s" repeatCount="indefinite"/>
  </rect>`;
  // Secondary glow higher up
  svg += `<rect x="${fX}" y="${flameBottomY - 90}" width="${fW}" height="90" fill="url(#fireBase)" opacity="0.15">
    <animate attributeName="opacity" values="0.1;0.2;0.15;0.25;0.1" dur="2s" repeatCount="indefinite"/>
  </rect>`;
  
  // Helper: thin wispy S-curve flame tongue
  function wispyFlame(bx: number, by: number, h: number, sway: number, w: number, grad: string, filt: string, dur: string, opRange: string) {
    // S-curve flame: base at (bx, by), tip at (bx + sway, by - h)
    // Path 1
    const m1x = bx + sway * 0.3;
    const m1y = by - h * 0.5;
    const t1x = bx + sway;
    const t1y = by - h;
    const p1 = `M ${bx - w} ${by} C ${bx - w*0.8} ${by - h*0.2} ${m1x - w*0.4} ${m1y} ${t1x} ${t1y} C ${m1x + w*0.4} ${m1y} ${bx + w*0.8} ${by - h*0.2} ${bx + w} ${by} Z`;
    // Path 2 (different sway for morphing)
    const sw2 = sway * (0.5 + Math.random() * 1.0) * (Math.random() > 0.5 ? 1 : -0.6);
    const h2 = h * (0.8 + Math.random() * 0.35);
    const w2 = w * (0.7 + Math.random() * 0.5);
    const m2x = bx + sw2 * 0.4;
    const m2y = by - h2 * 0.45;
    const t2x = bx + sw2;
    const t2y = by - h2;
    const p2 = `M ${bx - w2} ${by} C ${bx - w2*0.7} ${by - h2*0.25} ${m2x - w2*0.35} ${m2y} ${t2x} ${t2y} C ${m2x + w2*0.35} ${m2y} ${bx + w2*0.7} ${by - h2*0.25} ${bx + w2} ${by} Z`;
    return `<path fill="url(#${grad})" filter="url(#${filt})">
      <animate attributeName="d" values="${p1};${p2};${p1}" dur="${dur}" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0.05 0.55 0.95;0.45 0.05 0.55 0.95"/>
      <animate attributeName="opacity" values="${opRange}" dur="${dur}" repeatCount="indefinite"/>
    </path>`;
  }

  // --- Layer 1: Background glow flames (wide, dim, red-orange) ---
  const n1 = 20;
  for (let i = 0; i < n1; i++) {
    const fx = fX + 10 + (fW - 20) * (i / (n1 - 1)) + (Math.random() - 0.5) * 15;
    const h = 60 + Math.random() * 50;
    const sway = (Math.random() - 0.5) * 20;
    const w = 8 + Math.random() * 6;
    const dur = (1.5 + Math.random() * 1.2).toFixed(2) + 's';
    svg += wispyFlame(fx, flameBottomY, h, sway, w, 'fireOuter', 'fireGlowSoft', dur, '0.25;0.45;0.3;0.5;0.25');
  }
  
  // --- Layer 2: Mid flames (orange, medium) ---
  const n2 = 25;
  for (let i = 0; i < n2; i++) {
    const fx = fX + 8 + (fW - 16) * (i / (n2 - 1)) + (Math.random() - 0.5) * 10;
    const h = 45 + Math.random() * 45;
    const sway = (Math.random() - 0.5) * 16;
    const w = 4 + Math.random() * 5;
    const dur = (0.8 + Math.random() * 1.0).toFixed(2) + 's';
    svg += wispyFlame(fx, flameBottomY, h, sway, w, 'fireMid', 'fireGlow', dur, '0.4;0.7;0.45;0.65;0.4');
  }
  
  // --- Layer 3: Bright core flames (yellow-white, thin, tall) ---
  const n3 = 30;
  for (let i = 0; i < n3; i++) {
    const fx = fX + 12 + (fW - 24) * (i / (n3 - 1)) + (Math.random() - 0.5) * 8;
    const h = 30 + Math.random() * 55;
    const sway = (Math.random() - 0.5) * 12;
    const w = 2 + Math.random() * 3;
    const dur = (0.6 + Math.random() * 0.8).toFixed(2) + 's';
    svg += wispyFlame(fx, flameBottomY, h, sway, w, 'fireCore', 'fireGlow', dur, '0.5;0.9;0.6;0.85;0.5');
  }
  
  // --- Layer 4: Sparkling tips (very thin, very tall, flickering) ---
  const n4 = 15;
  for (let i = 0; i < n4; i++) {
    const fx = fX + 20 + (fW - 40) * (i / (n4 - 1)) + (Math.random() - 0.5) * 12;
    const h = 70 + Math.random() * 50;
    const sway = (Math.random() - 0.5) * 25;
    const w = 1.5 + Math.random() * 2;
    const dur = (0.5 + Math.random() * 0.6).toFixed(2) + 's';
    svg += wispyFlame(fx, flameBottomY, h, sway, w, 'fireCore', 'fireGlow', dur, '0.2;0.7;0.1;0.6;0.2');
  }
  
  svg += `</g>`;
  
  // 5 Support Rolls (Rolo 0 outside, Rolo 1-4 inside)
  let rx0 = 3875;
  for (let i = 0; i < 5; i++) {
    let cx = rx0 + i * 150;
    let r = 26; 
    let cy = YM + r; 
    svg += rNrForno(cx, cy, r, '', 0, 0, i);
    svg += `<text x="${cx}" y="${cy + r + 20}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">Rolo ${i}</text>`;
  }

  lineTo(4550, YM);
  
  // Helper for realistic Neblina mist
  function animateMist(bx: number, by: number, w: number, h: number, count: number) {
    const cpId = `cpMist-${Math.floor(bx)}-${Math.floor(by)}`;
    let m = `<clipPath id="${cpId}"><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="2"/></clipPath>`;
    m += `<g clip-path="url(#${cpId})">`;
    for (let i = 0; i < count; i++) {
      const rx = 40 + Math.random() * 40; 
      const ry = 10 + Math.random() * 15;
      const cy = by + h * 0.1 + Math.random() * h * 0.8;
      
      const dur = (3 + Math.random() * 4).toFixed(1);
      const startX = bx - rx;
      const endX = bx + w + rx;
      const leftToRight = Math.random() > 0.5;
      const val = leftToRight ? `${startX};${endX}` : `${endX};${startX}`;
      
      const opMax = (0.25 + Math.random() * 0.35).toFixed(2);
      
      m += `<ellipse cy="${cy}" rx="${rx}" ry="${ry}" fill="#f1f5f9" opacity="0" filter="url(#mistBlur)">
        <animate attributeName="cx" values="${val}" dur="${dur}s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;${opMax};${opMax};0" keyTimes="0;0.2;0.8;1" dur="${dur}s" repeatCount="indefinite" />
      </ellipse>`;
    }
    m += `</g>`;
    return m;
  }

  // ====================================================================
  // AR NEBLINA 1 (UND. RESF. ARNEBLINA 1)
  // Two rectangular boxes: one above strip, one below strip, roll at exit
  // ====================================================================
  let an1X = 4580, an1W = 140, an1H = 45;
  // Top box (above strip)
  svg += `<rect x="${an1X}" y="${YM - an1H - 5}" width="${an1W}" height="${an1H}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="2"/>`;
  svg += animateMist(an1X, YM - an1H - 5, an1W, an1H, 15);
  // Bottom box (below strip)
  svg += `<rect x="${an1X}" y="${YM + 5}" width="${an1W}" height="${an1H}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="2"/>`;
  svg += animateMist(an1X, YM + 5, an1W, an1H, 15);
  // Title
  svg += `<text x="${an1X + an1W/2}" y="${YM - an1H - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">AR NEBLINA 1</text>`;
  // Exit roll (202) - Strip goes OVER it
  svg += rNrForno(an1X + an1W + 10, YM + 8, 8, '', 0, 0, 298);
  lineTo(an1X + an1W + 10 + 8, YM);

  // ====================================================================
  // AR NEBLINA 2 (UNID. RESF. ARNEBLINA 2)
  // Wider split boxes with large gap. Strip dips down inside.
  // Rolls 203, 204 support the dip. Roll 205 at exit.
  // ====================================================================
  let an2X = 4790, an2W = 280, an2H = 50;
  // Top box
  svg += `<rect x="${an2X}" y="${YM - an2H - 10}" width="${an2W}" height="${an2H}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="2"/>`;
  svg += animateMist(an2X, YM - an2H - 10, an2W, an2H, 30);
  // Bottom box
  svg += `<rect x="${an2X}" y="${YM + 25}" width="${an2W}" height="${an2H}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="2"/>`;
  svg += animateMist(an2X, YM + 25, an2W, an2H, 30);
  // Title
  svg += `<text x="${an2X + an2W/2}" y="${YM - an2H - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">AR NEBLINA 2</text>`;
  
  // Nozzles removed as per user request

  // 3 support rolls (203, 204 inside supporting the dip; 205 outside)
  let r203x = an2X + 70, r203y = YM + 25; // Strip at YM+15, so center is YM+15+10=25
  let r204x = an2X + 190, r204y = YM + 25;
  let r205x = an2X + an2W + 35, r205y = YM + 10; // Strip back at YM, center YM+10
  
  svg += rNrForno(r203x, r203y, 10, '', r203x, r203y + 25, 299);
  svg += rNrForno(r204x, r204y, 10, '', r204x, r204y + 25, 300);
  svg += rNrForno(r205x, r205y, 10, '', r205x, r205y + 25, 301);
  
  // Tracing the dipped strip path
  lineTo(r203x, YM + 15);
  lineTo(r204x, YM + 15);
  lineTo(r205x, YM);

  // ====================================================================
  // DIP TANQUE
  // Trapezoidal tank where strip dips down, large roll submerged,
  // two small rolls stacked at exit
  // ====================================================================
  let dtX = 5120, dtW = 300, dtTopY = YM - 20, dtBotY = YM + 120;
  // Trapezoidal body (wider at top, narrower at bottom-left)
  const dtTankPath = `M ${dtX} ${dtTopY} L ${dtX + dtW} ${dtTopY} L ${dtX + dtW} ${dtBotY} L ${dtX + 60} ${dtBotY} Z`;
  svg += `<path d="${dtTankPath}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/>`;
  // Title
  svg += `<text x="${dtX + dtW/2}" y="${dtTopY - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">DIP TANQUE</text>`;
  // Large submerged roll
  let dtRollX = dtX + dtW - 100, dtRollY = dtBotY - 45;
  svg += rNrForno(dtRollX, dtRollY, 28, '', 0, 0, 302);
  
  // Water Animation
  svg += `<clipPath id="dipWaterClip"><path d="${dtTankPath}"/></clipPath>`;
  svg += `<g clip-path="url(#dipWaterClip)">`;
  let w1 = `M ${dtX} 0 `;
  for(let i=0; i<12; i++) w1 += `Q ${dtX + i*40 + 20} -8, ${dtX + i*40 + 40} 0 T ${dtX + i*40 + 80} 0 `;
  w1 += `L ${dtX + 1000} ${dtBotY - dtTopY + 20} L ${dtX} ${dtBotY - dtTopY + 20} Z`;

  let w2 = `M ${dtX} 5 `;
  for(let i=0; i<12; i++) w2 += `Q ${dtX + i*50 + 25} -5, ${dtX + i*50 + 50} 5 T ${dtX + i*50 + 100} 5 `;
  w2 += `L ${dtX + 1200} ${dtBotY - dtTopY + 20} L ${dtX} ${dtBotY - dtTopY + 20} Z`;

  let w3 = `M ${dtX} 10 `;
  for(let i=0; i<12; i++) w3 += `Q ${dtX + i*60 + 30} 0, ${dtX + i*60 + 60} 10 T ${dtX + i*60 + 120} 10 `;
  w3 += `L ${dtX + 1500} ${dtBotY - dtTopY + 20} L ${dtX} ${dtBotY - dtTopY + 20} Z`;

  svg += `<g opacity="0.65" pointer-events="none">
    <path d="${w3}" fill="#0284c7">
      <animateTransform attributeName="transform" type="translate" values="0,${dtTopY + 25}; -240,${dtTopY + 25}" dur="6s" repeatCount="indefinite" />
    </path>
    <path d="${w1}" fill="#0ea5e9">
      <animateTransform attributeName="transform" type="translate" values="0,${dtTopY + 30}; -160,${dtTopY + 30}" dur="3.5s" repeatCount="indefinite" />
    </path>
    <path d="${w2}" fill="#38bdf8">
      <animateTransform attributeName="transform" type="translate" values="-200,${dtTopY + 35}; 0,${dtTopY + 35}" dur="5s" repeatCount="indefinite" />
    </path>
  </g>`;
  svg += `</g>`;
  // Two small exit rolls (stacked vertically at exit)
  let dtExitX = dtX + dtW + 15; // Moved outside to the right
  svg += rNrForno(dtExitX, YM - 8, 8, '', 0, 0, 303);
  svg += rNrForno(dtExitX, YM + 8, 8, '', 0, 0, 304);
  // Strip path: dip down into tank, wrap around large roll, come back up
  lineTo(dtX + 20, YM);
  lineTo(dtRollX - 28, dtRollY);
  stripPath += `A 28 28 0 0 0 ${dtRollX + 28} ${dtRollY} `;
  lineTo(dtExitX, YM);
  lineTo(dtX + dtW + 10, YM);

  // Helper for solid green rolls
  const greenRoll = (cx: number, cy: number, r: number) => 
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#10b981" stroke="#0f172a" stroke-width="2"/>`;

  // ====================================================================
  // SECADOR 2 (Vertical Dashed Line with Green V Shapes)
  // ====================================================================
  let sec2X = dtX + dtW + 30, sec2W = 140;
  let sec2CX = sec2X + sec2W/2; // Center of the secador
  
  // Title
  svg += `<text x="${sec2CX}" y="${YM - 75}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;

  // Dashed vertical line
  svg += `<line x1="${sec2CX}" y1="${YM - 60}" x2="${sec2CX}" y2="${YM + 60}" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="6,6" stroke-linecap="round"/>`;

  // Top V shapes (pointing down)
  // V1 (inner)
  svg += `<path d="M ${sec2CX - 25} ${YM - 40} L ${sec2CX} ${YM - 15} L ${sec2CX + 25} ${YM - 40}" fill="none" stroke="#22c55e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  // V2 (outer)
  svg += `<path d="M ${sec2CX - 25} ${YM - 55} L ${sec2CX} ${YM - 30} L ${sec2CX + 25} ${YM - 55}" fill="none" stroke="#22c55e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Bottom V shapes (pointing up)
  // ^1 (inner)
  svg += `<path d="M ${sec2CX - 25} ${YM + 40} L ${sec2CX} ${YM + 15} L ${sec2CX + 25} ${YM + 40}" fill="none" stroke="#22c55e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  // ^2 (outer)
  svg += `<path d="M ${sec2CX - 25} ${YM + 55} L ${sec2CX} ${YM + 30} L ${sec2CX + 25} ${YM + 55}" fill="none" stroke="#22c55e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;

  // r1 = Exit roll (small green at secador exit) - updated to match other rollers
  let sec2Rx = sec2X + sec2W + 20;
  svg += rNrForno(sec2Rx, YM + 8, 8, '', 0, 0, 305);

  lineTo(sec2Rx + 8, YM);
  
  // r2 = CORRETOR 3 (cross/quadrant pattern — as in sketch)
  svg += corretorCruz(5800, YM + 35, 35, '', 443);
  svg += `<text x="5800" y="${YM + 90}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 3</text>`;
  
  // Strip arrives at top of r2, small clockwise wrap
  lineTo(5800, YM);
  stripPath += `A 35 35 0 0 1 5820 ${YM + 6} `;

  // ---- BS 3 SECTION (Upper-right and Lower-left large rolls) ----
  
  // 1. bs3Top (Upper-Right Large Roll)
  let bs3TopX = 6060, bs3TopY = YM + 95, bs3R = 38;
  svg += dot(bs3TopX, bs3TopY, bs3R, 306);
  // Pinch roll at ~2 o'clock (perfectly touching the core white line)
  svg += dot(bs3TopX + 34.5, bs3TopY - 34.5, 10, 307);
  // Text to the right
  svg += `<text x="${bs3TopX + 55}" y="${bs3TopY - 25}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="start">BS 3</text>`;

  // 2. bs3Bot (Lower-Left Large Roll)
  let bs3BotX = 5900, bs3BotY = YM + 180;
  svg += dot(bs3BotX, bs3BotY, bs3R, 308);
  // Pinch roll at ~8 o'clock (perfectly touching the core white line)
  svg += dot(bs3BotX - 34.5, bs3BotY + 34.5, 10, 309);

  // ---- Strip Path through BS 3 ----
  // Line to bs3Top top-left (~11:30)
  lineTo(bs3TopX - 15, bs3TopY - 35);
  // Wrap CLOCKWISE over bs3Top, around right, to bottom-left (~7:30)
  stripPath += `A ${bs3R} ${bs3R} 0 1 1 ${bs3TopX - 25} ${bs3TopY + 28} `;
  
  // Line to bs3Bot top-right (~1:30) -> DOWN-LEFT diagonal backwards
  lineTo(bs3BotX + 25, bs3BotY - 28);
  // Wrap COUNTER-CLOCKWISE over bs3Bot, around left, to bottom-right (~4:30)
  stripPath += `A ${bs3R} ${bs3R} 0 1 0 ${bs3BotX + 25} ${bs3BotY + 28} `;

  // ---- Medium Roll and Exit ----
  let medX = 6140, medY = YM + 250, medR = 20;
  svg += dot(medX, medY, medR, 310);
  
  // Line from bs3Bot to med top-left (~10 o'clock) -> DOWN-RIGHT diagonal
  lineTo(medX - 15, medY - 13);
  // Wrap COUNTER-CLOCKWISE under med to bottom (6 o'clock)
  stripPath += `A ${medR} ${medR} 0 0 0 ${medX} ${medY + medR} `;

  // Three small green rolls at bottom with stands
  const YD = medY + medR + 8; // YM + 278
  for (let i = 0; i < 3; i++) {
    let rx = 6220 + i * 40;
    svg += dot(rx, YD, 8, 311);
    svg += `<line x1="${rx}" y1="${YD + 8}" x2="${rx}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
    svg += `<line x1="${rx - 5}" y1="${YD + 22}" x2="${rx + 5}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
  }
  
  // Horizontal line over the rollers
  lineTo(6220 + 2 * 40 + 20, medY + medR);
  
  // Long gap, then 11 small rollers with stands
  for (let i = 0; i < 11; i++) {
    let rx = 6380 + i * 35;
    svg += dot(rx, YD, 8, 312);
    svg += `<line x1="${rx}" y1="${YD + 8}" x2="${rx}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
    svg += `<line x1="${rx - 5}" y1="${YD + 22}" x2="${rx + 5}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
  }
  
  // Line extending over the 11 small rollers to the bottom of the medium climb roller
  let climbMedX = 6840, climbMedY = YM + 245, climbMedR = 25; // 450 + 245 = 695
  lineTo(climbMedX, YM + 270); // YM + 270 = 720
  
  // Medium roll (bottom of the climb)
  svg += dot(climbMedX, climbMedY, climbMedR, 313);
  // Wrap UNDER and up the right side (Counter-Clockwise)
  stripPath += `A ${climbMedR} ${climbMedR} 0 0 0 ${climbMedX + climbMedR} ${climbMedY} `;
  
  // Right pinch roll (touching vertical strip from the right side)
  svg += dot(climbMedX + climbMedR + 10, YM + 140, 10, 314);
  
  // Large roll (top of the climb)
  let climbTopX = climbMedX + climbMedR + 40; // 6865 + 40 = 6905
  let climbTopY = YM + 40; // 450 + 40 = 490
  let climbTopR = 40;
  svg += dot(climbTopX, climbTopY, climbTopR, 315);
  
  // Top pinch roll (touching top of large roll)
  svg += dot(climbTopX, YM - 12, 12, 316);
  
  // Vertical line up to large roll left edge
  lineTo(climbTopX - climbTopR, climbTopY);
  
  // Wrap OVER the large roll (Clockwise)
  stripPath += `A ${climbTopR} ${climbTopR} 0 0 1 ${climbTopX} ${YM} `;
  
  // ====================================================================
  // SEÇÃO 6: DETALHADA - TANQUE ELETROLÍTICO
  // ====================================================================
  // The entire section is a straight horizontal line!
  lineTo(7690, YM); 
  
  // Title
  svg += `<text x="7325" y="${YM - 80}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">Tanque Eletrolitico</text>`;
  
  // Tank outline
  svg += `<rect x="6960" y="${YM - 60}" width="730" height="150" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="4"/>`;
  
  // ── Animated orange liquid inside the tank ──
  const etankX = 6960, etankW = 730, etankRx = 4;
  const liquidTopY = YM - 15; // liquid level (upper surface)
  const liquidBotY = YM + 88; // bottom of tank interior
  
  // Liquid body (clipped inside the tank)
  svg += `<clipPath id="tankClip"><rect x="${etankX + 2}" y="${YM - 58}" width="${etankW - 4}" height="146" rx="${etankRx}"/></clipPath>`;
  svg += `<g clip-path="url(#tankClip)">`;
  
  // Main liquid fill (gradient from darker orange at bottom to lighter at surface)
  const lx = etankX + 2;
  const lw = etankW - 4;
  // Static liquid body below the wave
  svg += `<rect x="${lx}" y="${liquidTopY + 8}" width="${lw}" height="${liquidBotY - liquidTopY}" fill="#c2410c" opacity="0.45"/>`;
  svg += `<rect x="${lx}" y="${liquidTopY + 25}" width="${lw}" height="${liquidBotY - liquidTopY - 15}" fill="#ea580c" opacity="0.25"/>`;
  
  // Animated wave surface (top of liquid) — 2 overlapping waves for realism
  const wY = liquidTopY;
  const wA = 5; // wave amplitude
  // Wave 1 (main surface)
  const wave1a = `M ${lx} ${wY + wA} Q ${lx + lw*0.1} ${wY - wA} ${lx + lw*0.2} ${wY + wA*0.5} T ${lx + lw*0.4} ${wY + wA} T ${lx + lw*0.6} ${wY - wA*0.3} T ${lx + lw*0.8} ${wY + wA*0.7} T ${lx + lw} ${wY + wA*0.2} L ${lx + lw} ${liquidBotY} L ${lx} ${liquidBotY} Z`;
  const wave1b = `M ${lx} ${wY - wA*0.3} Q ${lx + lw*0.1} ${wY + wA} ${lx + lw*0.2} ${wY - wA*0.5} T ${lx + lw*0.4} ${wY - wA*0.3} T ${lx + lw*0.6} ${wY + wA*0.8} T ${lx + lw*0.8} ${wY - wA*0.5} T ${lx + lw} ${wY + wA*0.6} L ${lx + lw} ${liquidBotY} L ${lx} ${liquidBotY} Z`;
  svg += `<path fill="#ea580c" opacity="0.35">
    <animate attributeName="d" values="${wave1a};${wave1b};${wave1a}" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
  </path>`;
  
  // Wave 2 (secondary, lighter, offset timing)
  const wave2a = `M ${lx} ${wY + wA*0.6} Q ${lx + lw*0.15} ${wY - wA*0.8} ${lx + lw*0.25} ${wY + wA*0.3} T ${lx + lw*0.5} ${wY - wA*0.5} T ${lx + lw*0.75} ${wY + wA*0.9} T ${lx + lw} ${wY - wA*0.2} L ${lx + lw} ${liquidBotY} L ${lx} ${liquidBotY} Z`;
  const wave2b = `M ${lx} ${wY - wA*0.5} Q ${lx + lw*0.15} ${wY + wA*0.7} ${lx + lw*0.25} ${wY - wA*0.6} T ${lx + lw*0.5} ${wY + wA*0.7} T ${lx + lw*0.75} ${wY - wA*0.4} T ${lx + lw} ${wY + wA*0.8} L ${lx + lw} ${liquidBotY} L ${lx} ${liquidBotY} Z`;
  svg += `<path fill="#fb923c" opacity="0.2">
    <animate attributeName="d" values="${wave2a};${wave2b};${wave2a}" dur="2.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
  </path>`;
  
  // Subtle bubbles (small circles that float up)
  for (let i = 0; i < 8; i++) {
    const bx = etankX + 40 + Math.random() * (etankW - 80);
    const br = 2 + Math.random() * 3;
    const bdur = (2 + Math.random() * 3).toFixed(1);
    const bdelay = (Math.random() * 3).toFixed(1);
    svg += `<circle cx="${bx}" cy="${liquidBotY}" r="${br}" fill="#fdba74" opacity="0.4">
      <animate attributeName="cy" values="${liquidBotY};${liquidTopY - 5};${liquidTopY - 5}" dur="${bdur}s" begin="${bdelay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.3;0" dur="${bdur}s" begin="${bdelay}s" repeatCount="indefinite"/>
    </circle>`;
  }
  
  svg += `</g>`;
  

  // Roll 0: Large 1 (Defletor Entrada)
  svg += `<rect x="6980" y="${YM + 45}" width="40" height="25" fill="#1e293b" rx="2"/>`;
  svg += `<rect x="6975" y="${YM + 40}" width="50" height="10" fill="#334155" rx="2"/>`;
  svg += dot(7000, YM + 30, 30, 317);
  
  // 1. Top 1
  svg += dot(7055, YM - 15, 15, 318);
  // 2. Bottom 1
  svg += dot(7110, YM + 12, 12, 319);
  // 3. Top 2
  svg += dot(7165, YM - 15, 15, 320);
  // 4. Bottom 2
  svg += dot(7220, YM + 12, 12, 321);
  // 5. Top 3 (Roll you drew on the left!)
  svg += dot(7275, YM - 15, 15, 322);
  
  // 6. Large 2 (Centragem)
  svg += `<rect x="7310" y="${YM + 45}" width="40" height="25" fill="#1e293b" rx="2"/>`;
  svg += `<rect x="7305" y="${YM + 40}" width="50" height="10" fill="#334155" rx="2"/>`;
  svg += dot(7330, YM + 30, 30, 323);
  
  // 7. Top 4 (Roll you drew on the right!)
  svg += dot(7385, YM - 15, 15, 324);
  // 8. Bottom 3
  svg += dot(7440, YM + 12, 12, 325);
  // 9. Top 5
  svg += dot(7495, YM - 15, 15, 326);
  // 10. Bottom 4
  svg += dot(7550, YM + 12, 12, 327);
  // 11. Top 6
  svg += dot(7605, YM - 15, 15, 328);
  
  // 12. Pinch rolls
  svg += dot(7660, YM - 10, 10, 329);
  svg += dot(7660, YM + 10, 10, 330);
  
  // Helper for Escovador
  const drawEscovador = (cx: number, cy: number, label: string, baseId: number) => {
    let s = `<rect x="${cx - 50}" y="${cy - 40}" width="100" height="80" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="6"/>`;
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
  };

  const Y_quim = YM + 40; // 490

  // Escovador 1
  svg += drawEscovador(7750, YM, 'Escovador 1', 450);
  lineTo(7800, YM);
  
  // To Espremedor 2 (Straight horizontal)
  lineTo(7840, YM);
  svg += dot(7860, YM - 10, 10, 333);
  svg += dot(7860, YM + 10, 10, 334);
  lineTo(7860, YM);
  
  // Tanque Químico Outline and Text
  svg += `<text x="8020" y="${YM - 80}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">Tanque Quimico</text>`;
  svg += `<rect x="7880" y="${YM - 60}" width="280" height="150" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" rx="4"/>`;

  // ── Animated green liquid inside the Tanque Químico ──
  const qtX = 7880, qtW = 280, qtRx = 4;
  const qlTopY = YM - 10; // liquid surface level
  const qlBotY = YM + 88; // bottom of tank interior
  
  svg += `<clipPath id="qtClip"><rect x="${qtX + 2}" y="${YM - 58}" width="${qtW - 4}" height="146" rx="${qtRx}"/></clipPath>`;
  svg += `<g clip-path="url(#qtClip)">`;
  
  const qlx = qtX + 2;
  const qlw = qtW - 4;
  // Static liquid body
  svg += `<rect x="${qlx}" y="${qlTopY + 8}" width="${qlw}" height="${qlBotY - qlTopY}" fill="#065f46" opacity="0.5"/>`;
  svg += `<rect x="${qlx}" y="${qlTopY + 20}" width="${qlw}" height="${qlBotY - qlTopY - 10}" fill="#059669" opacity="0.25"/>`;
  
  // Wave 1
  const qwY = qlTopY;
  const qwA = 4;
  const qw1a = `M ${qlx} ${qwY + qwA} Q ${qlx + qlw*0.12} ${qwY - qwA} ${qlx + qlw*0.25} ${qwY + qwA*0.4} T ${qlx + qlw*0.5} ${qwY + qwA*0.8} T ${qlx + qlw*0.75} ${qwY - qwA*0.3} T ${qlx + qlw} ${qwY + qwA*0.5} L ${qlx + qlw} ${qlBotY} L ${qlx} ${qlBotY} Z`;
  const qw1b = `M ${qlx} ${qwY - qwA*0.4} Q ${qlx + qlw*0.12} ${qwY + qwA*0.8} ${qlx + qlw*0.25} ${qwY - qwA*0.5} T ${qlx + qlw*0.5} ${qwY - qwA*0.2} T ${qlx + qlw*0.75} ${qwY + qwA*0.7} T ${qlx + qlw} ${qwY - qwA*0.3} L ${qlx + qlw} ${qlBotY} L ${qlx} ${qlBotY} Z`;
  svg += `<path fill="#10b981" opacity="0.35">
    <animate attributeName="d" values="${qw1a};${qw1b};${qw1a}" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
  </path>`;
  
  // Wave 2
  const qw2a = `M ${qlx} ${qwY + qwA*0.3} Q ${qlx + qlw*0.18} ${qwY - qwA*0.6} ${qlx + qlw*0.3} ${qwY + qwA*0.6} T ${qlx + qlw*0.55} ${qwY - qwA*0.4} T ${qlx + qlw*0.8} ${qwY + qwA*0.5} T ${qlx + qlw} ${qwY - qwA*0.1} L ${qlx + qlw} ${qlBotY} L ${qlx} ${qlBotY} Z`;
  const qw2b = `M ${qlx} ${qwY - qwA*0.3} Q ${qlx + qlw*0.18} ${qwY + qwA*0.5} ${qlx + qlw*0.3} ${qwY - qwA*0.4} T ${qlx + qlw*0.55} ${qwY + qwA*0.6} T ${qlx + qlw*0.8} ${qwY - qwA*0.5} T ${qlx + qlw} ${qwY + qwA*0.7} L ${qlx + qlw} ${qlBotY} L ${qlx} ${qlBotY} Z`;
  svg += `<path fill="#34d399" opacity="0.2">
    <animate attributeName="d" values="${qw2a};${qw2b};${qw2a}" dur="2.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
  </path>`;
  
  // Bubbles
  for (let i = 0; i < 6; i++) {
    const bx = qtX + 30 + Math.random() * (qtW - 60);
    const br = 1.5 + Math.random() * 2.5;
    const bdur = (2.5 + Math.random() * 2.5).toFixed(1);
    const bdelay = (Math.random() * 3).toFixed(1);
    svg += `<circle cx="${bx}" cy="${qlBotY}" r="${br}" fill="#6ee7b7" opacity="0.45">
      <animate attributeName="cy" values="${qlBotY};${qlTopY - 5};${qlTopY - 5}" dur="${bdur}s" begin="${bdelay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.45;0.3;0" dur="${bdur}s" begin="${bdelay}s" repeatCount="indefinite"/>
    </circle>`;
  }
  
  svg += `</g>`;

  let tq_Y_bot = YM + 50; // Profundidade da tira dentro do tanque
  
  // Tanque Químico (Mergulhadores rebaixados para mergulhar a tira)
  svg += dot(7950, tq_Y_bot - 30, 30, 335);
  svg += dot(8090, tq_Y_bot - 30, 30, 336);
  
  // Caminho da tira (Dip Tank)
  lineTo(7880, YM); // Segue reto até a borda do tanque
  stripPath += `C 7900 ${YM} 7900 ${tq_Y_bot} 7950 ${tq_Y_bot} `; // Curva mais ampla para abraçar o 1º rolo sem cortar
  lineTo(8090, tq_Y_bot); // Segue por baixo até o 2º rolo
  stripPath += `C 8140 ${tq_Y_bot} 8140 ${YM} 8160 ${YM} `; // Curva mais ampla para subir após o 2º rolo sem cortar
  
  // Espremedor 3 (Straight horizontal)
  lineTo(8180, YM);
  svg += dot(8200, YM - 10, 10, 337);
  svg += dot(8200, YM + 10, 10, 338);
  lineTo(8200, YM);
  
  // Novo Rolo (entre Espremedor 3 e Escovador 2)
  svg += dot(8235, YM + 10, 10, 339);
  
  // Straight to Escovador 2
  lineTo(8250, YM); // left edge of Escovador 2 is 8250
  
  // Escovador 2
  svg += drawEscovador(8300, YM, 'Escovador 2', 460);
  lineTo(8350, YM);
  
  // Novo rolo no lugar do Espremedor 4
  svg += dot(8400, YM + 10, 10, 340);
  
  // ENXAGUADOR
  let enxX = 8460;
  let enxW = 140;
  
  // Title
  svg += `<text x="${enxX + enxW/2}" y="${YM - 55}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">ENXAGUADOR</text>`;
  
  // Top cover
  svg += `<polyline points="${enxX},${YM - 12} ${enxX},${YM - 45} ${enxX + enxW},${YM - 45} ${enxX + enxW},${YM - 12}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/>`;
  // Top caps
  svg += `<line x1="${enxX - 6}" y1="${YM - 12}" x2="${enxX + 6}" y2="${YM - 12}" stroke="#94a3b8" stroke-width="2.5"/>`;
  svg += `<line x1="${enxX + enxW - 6}" y1="${YM - 12}" x2="${enxX + enxW + 6}" y2="${YM - 12}" stroke="#94a3b8" stroke-width="2.5"/>`;

  // Bottom cover
  svg += `<polyline points="${enxX},${YM + 12} ${enxX},${YM + 45} ${enxX + enxW},${YM + 45} ${enxX + enxW},${YM + 12}" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/>`;
  // Bottom caps
  svg += `<line x1="${enxX - 6}" y1="${YM + 12}" x2="${enxX + 6}" y2="${YM + 12}" stroke="#94a3b8" stroke-width="2.5"/>`;
  svg += `<line x1="${enxX + enxW - 6}" y1="${YM + 12}" x2="${enxX + enxW + 6}" y2="${YM + 12}" stroke="#94a3b8" stroke-width="2.5"/>`;

  // Helper for water jets
  function animateWaterJet(nx: number, ny: number, direction: 'down' | 'up', height: number) {
    let w = '';
    const endY = direction === 'down' ? ny + height : ny - height;
    const grad = direction === 'down' ? 'url(#waterJetGradDown)' : 'url(#waterJetGradUp)';
    
    w += `<polygon points="${nx-2},${ny} ${nx+2},${ny} ${nx+15},${endY} ${nx-15},${endY}" fill="${grad}" opacity="0.6">
      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="${0.15 + Math.random()*0.1}s" repeatCount="indefinite" />
    </polygon>`;
    
    for(let i=0; i<5; i++) {
      const offset = -12 + Math.random() * 24;
      const dur = (0.2 + Math.random() * 0.15).toFixed(2);
      const delay = (Math.random() * 0.2).toFixed(2);
      w += `<line x1="${nx}" y1="${ny}" x2="${nx + offset}" y2="${endY}" stroke="#e0f2fe" stroke-width="${1 + Math.random()}" opacity="0.8" stroke-dasharray="10 15">
        <animate attributeName="stroke-dashoffset" values="0; -25" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
      </line>`;
    }
    return w;
  }

  // Spray Nozzles (3 Top, 3 Bottom)
  for (let i = 1; i <= 3; i++) {
    let nx = enxX + (enxW / 4) * i;
    // Water jets
    svg += animateWaterJet(nx, YM - 25, 'down', 25);
    svg += animateWaterJet(nx, YM + 25, 'up', 25);
    // Nozzle dots
    svg += `<circle cx="${nx}" cy="${YM - 25}" r="3.5" fill="#cbd5e1" />`;
    svg += `<circle cx="${nx}" cy="${YM + 25}" r="3.5" fill="#cbd5e1" />`;
  }
  
  // Rolos após o Enxaguador
  // Rolo único por baixo
  svg += dot(8635, YM + 10, 10, 341);
  // Par de rolos (Pinch rollers)
  svg += dot(8680, YM - 10, 10, 342);
  svg += dot(8680, YM + 10, 10, 343);

  // SECADOR
  let secadorX = 8750;
  
  // Title
  svg += `<text x="${secadorX}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // Dashed center line
  svg += `<line x1="${secadorX}" y1="${YM - 55}" x2="${secadorX}" y2="${YM + 55}" stroke="#22c55e" stroke-width="2" stroke-dasharray="6,4" />`;
  
  // Top Chevrons (pointing down)
  svg += `<polyline points="${secadorX - 15},${YM - 45} ${secadorX},${YM - 25} ${secadorX + 15},${YM - 45}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  svg += `<polyline points="${secadorX - 15},${YM - 30} ${secadorX},${YM - 10} ${secadorX + 15},${YM - 30}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  
  // Bottom Chevrons (pointing up)
  svg += `<polyline points="${secadorX - 15},${YM + 45} ${secadorX},${YM + 25} ${secadorX + 15},${YM + 45}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  svg += `<polyline points="${secadorX - 15},${YM + 30} ${secadorX},${YM + 10} ${secadorX + 15},${YM + 30}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  
  // 4 pequenos rolos após o secador (abaixo da linha branca)
  for (let i = 0; i < 4; i++) {
    svg += dot(8820 + i*24, YM + 8, 8, 344);
  }

  // ====================================================================
  // SEÇÃO 7: SAÍDA E BOBINAMENTO
  // ====================================================================
  lineTo(8950, YM); // Segue direto até o Corretor 4
  
  // Corretor 4 (elevado para a fita passar por baixo)
  svg += corretorCruz(8950, YM - 35, 35, '', 444);
  svg += `<text x="8950" y="${YM + 25}" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">Corretor 4</text>`;
  
  // ====================================================================
  // BS4 e LOOP DE SAÍDA (Conforme Esboço Fiel)
  // ====================================================================
  
  // Rolo pequeno de apoio na subida
  svg += dot(9007.9, 318.7, 8, 345); 
  
  // BS4 (S-Roll Verticalizado: Top e Bottom)
  let bs4_1X = 9050; let bs4_1Y = 220;
  let bs4_2X = 9060; let bs4_2Y = 320; // Movido para baixo do Rolo 1 conforme novo esboço
  svg += dot(bs4_1X, bs4_1Y, 35, 346); // Rolo 1 (Top)
  svg += dot(bs4_1X, bs4_1Y - 45, 10, 347); // Pinch roller TOP
  svg += dot(bs4_2X, bs4_2Y, 35, 348); // Rolo 2 (Bottom)
  svg += dot(bs4_2X, bs4_2Y + 45, 10, 349); // Pinch roller BOTTOM
  svg += `<text x="${bs4_1X}" y="${bs4_1Y - 65}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">BS4</text>`;
  
  // Rolo pequeno de apoio na saída do BS4 (Recalculado para nova inclinação)
  svg += dot(9209.3, 276.8, 8, 350);
  
  // Loop Saída (Variáveis de Posicionamento e Texto)
  const LYT = 220; // Alinhado verticalmente com BS4_1Y
  const LYB = 580;
  
  // Rolos do Loop Saída (Serpentine vertical exata)
  // Distanciamento de 70px (2R) garante linhas perfeitamente verticais
  const loopX = [9350, 9420, 9490, 9560];
  const loopY = [LYT, LYB, LYT, LYB];
  
  // Centraliza o texto Loop Saída sobre todo o conjunto (rolo do meio é 9490) e um pouco mais para cima
  svg += `<text x="9490" y="${LYT - 70}" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff">Loop Saida</text>`;

  for (let i = 0; i < 4; i++) {
    svg += dot(loopX[i], loopY[i], 35, 351);
  }
  
  // Corretor 5
  const C5X = 9630;
  svg += corretorCruz(C5X, LYT, 35, '', 445);
  // Posiciona o texto à direita da roda (x=C5X+45) e centralizado verticalmente (y=LYT+5)
  svg += `<text x="${C5X + 45}" y="${LYT + 5}" font-family="Montserrat, sans-serif" font-size="14" font-weight="800" fill="#ffffff" text-anchor="start">CORRETOR 5</text>`;

  // ====================================================================
  // BS 5 (S-Roll: Top-Right para Bottom-Left)
  // ====================================================================
  
  // Rolo pequeno guia após Corretor 5
  let srX = 9750; let srY = 193; // Topo em 185
  svg += dot(srX, srY, 8, 352);
  
  // BS 5 Rollers
  let bs5_TR_X = 10000; let bs5_TR_Y = 220; // Rolo Superior Direito (BS 5)
  let bs5_BL_X = 9900; let bs5_BL_Y = 320;  // Rolo Inferior Esquerdo (Novo)
  
  // Rolo Top-Right
  svg += dot(bs5_TR_X, bs5_TR_Y, 35, 353);
  svg += dot(bs5_TR_X, bs5_TR_Y - 45, 10, 354); // Pinch roller TOP
  svg += `<text x="${bs5_TR_X + 45}" y="${bs5_TR_Y + 5}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="start">BS 5</text>`;

  // Rolo Bottom-Left
  svg += dot(bs5_BL_X, bs5_BL_Y, 35, 355);
  svg += dot(bs5_BL_X, bs5_BL_Y + 45, 10, 356); // Pinch roller BOTTOM

  // --- Path da Tira (Matematicamente Exato com Inner Tangents) ---
  stripPath += `A 35 35 0 0 0 8984.6 420.3 `; // Sai tangencialmente do Corretor 4 (Bottom-Right)
  lineTo(9015.4, 214.8); // Reta diagonal até BS4_1 (Top-Left)
  
  stripPath += `A 35 35 0 1 1 9077.4 241.8 `; // Abraça sobre BS4_1 (Clockwise, LARGE ARC) até Bottom-Right
  lineTo(9032.6, 298.2); // Reta diagonal descendo para a esquerda (Inner Tangent) até BS4_2 (Top-Left)
  
  stripPath += `A 35 35 0 0 0 9078.7 349.6 `; // Abraça sob BS4_2 (Counter-Clockwise) até Bottom-Right
  lineTo(9331.3, 190.4); // Reta diagonal subindo para a Loop Saida Top 1 (Top-Left)
  
  stripPath += `A 35 35 0 0 1 9385 ${LYT} `; // Sobre Top 1 até borda direita
  lineTo(9385, LYB); // Desce perfeitamente vertical
  stripPath += `A 35 35 0 0 0 9455 ${LYB} `; // Sob Bottom 1 até borda direita
  lineTo(9455, LYT); // Sobe perfeitamente vertical
  stripPath += `A 35 35 0 0 1 9525 ${LYT} `; // Sobre Top 2 até borda direita
  lineTo(9525, LYB); // Desce perfeitamente vertical
  stripPath += `A 35 35 0 0 0 9595 ${LYB} `; // Sob Bottom 2 até borda direita
  lineTo(9595, LYT); // Sobe perfeitamente vertical para Corretor 5
  
  stripPath += `A 35 35 0 0 1 9630 ${LYT - 35} `; // Abraça o topo esquerdo do Corretor 5 até o topo central
  
  // Path BS 5
  lineTo(bs5_TR_X, LYT - 35); // Horizontal do Corretor 5 até o topo do TR
  stripPath += `A 35 35 0 0 1 10009.2 253.7 `; // Abraça TR (Clockwise) até Bottom-Right
  lineTo(9890.8, 286.3); // Diagonal descendo para a esquerda (Inner Tangent) até BL
  stripPath += `A 35 35 0 0 0 9900 355 `; // Abraça BL (Counter-Clockwise) até o fundo
  
  lineTo(10150, 355); // Sai horizontalmente pela direita, passando sob o TR
  
  // Continuação horizontal para a Mesa de Inspeção
  let Y_END = 355;
  lineTo(10400, Y_END); 
  
  let shiftX = 350; // Shift para acomodar o BS 5
  
  for (let i=0; i<4; i++) {
    svg += dot(10080 + shiftX + i*40, Y_END + 8, 8, 357);
  }
  lineTo(10190 + shiftX, Y_END);
  
  // Mesa Inspecao
  svg += mesaInspecao(10250 + shiftX, Y_END, 200);
  lineTo(10450 + shiftX, Y_END);
  
  // First group of 3 rollers (under line)
  for (let i=0; i<3; i++) {
    svg += dot(10520 + shiftX + i*40, Y_END + 8, 8, 358);
  }
  
  // Second group of 3 rollers (under line)
  for (let i=0; i<3; i++) {
    svg += dot(10700 + shiftX + i*40, Y_END + 8, 8, 359);
  }
  lineTo(10800 + shiftX, Y_END);
  
  // Tesoura 3
  svg += tesoura3(10860 + shiftX, Y_END, 'TESOURA 3');
  lineTo(10860 + shiftX, Y_END);
  
  // Remove only the top large roll, keep the bottom one
  svg += dot(10940 + shiftX, Y_END + 15, 15, 360);
  lineTo(10940 + shiftX, Y_END);
  
  // Move the small support roll to the top of the line
  svg += dot(11020 + shiftX, Y_END - 8, 8, 361);
  lineTo(11020 + shiftX, Y_END);
  
  // Bobinadeira Final
  svg += solidCoil(11150 + shiftX, Y_END + 20, 60, 'Bobinadeira');
  lineTo(11150 + shiftX, Y_END + 20);
  
  // Novo rolo após a Bobinadeira (solicitado na imagem)
  let extraRollX = 11270 + shiftX;
  let extraRollY = Y_END + 60;
  svg += `<rect x="${extraRollX - 15}" y="${extraRollY + 12}" width="30" height="4" fill="#94a3b8" rx="2"/>`;
  svg += dot(extraRollX, extraRollY, 12, 362);

  // Apply the path (Forno Glowing Strip)
  svg += `<path d="${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>`;
  svg += `<path d="${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;

  // Create path for Entrada 2 arrow
  let commonPartIdx = stripPath.indexOf(" 1350 450 ");
  let commonPart = stripPath.substring(commonPartIdx + " 1350 450 ".length);
  let pathArrow2 = p2 + commonPart;

  // Add the animated red arrows!
  svg += `
    <defs>
      <path id="redArrow" d="M -20 -15 L 20 0 L -20 15 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
      <path id="trackPath1" d="${stripPath}" />
      <path id="trackPath2" d="${pathArrow2}" />
      <filter id="redGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g id="arrow1Group" style="display: none;">
      <use href="#redArrow" filter="url(#redGlow)" />
    </g>
    <g id="arrow2Group" style="display: none;">
      <use href="#redArrow" filter="url(#redGlow)" />
    </g>
  `;

  // Draw background frame again to be on top if needed, or close svg
  svg += '</svg>';
  
  // Inject into DOM
  const el = document.getElementById('rb1CompletaDiagram');
  if (el) {
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    if (svgEl) {
      try {
        if (rb1PanZoomInstance) {
          rb1PanZoomInstance.dispose();
        }
        // Initialize panzoom
        rb1PanZoomInstance = panzoom(svgEl, {
          maxZoom: 5,
          minZoom: 0.1,
          initialZoom: 0.8,
          initialX: 0,
          initialY: 0,
          bounds: true,
          boundsPadding: 0.1,
          smoothScroll: false
        });

        
        // Controls
        const btnIn = document.getElementById('btnZoomInCompleta');
        const btnOut = document.getElementById('btnZoomOutCompleta');
        const btnReset = document.getElementById('btnZoomResetCompleta');
        const btnPause = document.getElementById('btnPauseAnimation');
        const iconPause = document.getElementById('iconPauseAnimation');

        if (btnPause && iconPause) {
          if (globalIsPaused) {
             iconPause.textContent = 'play_arrow';
             btnPause.classList.add('bg-primary/50');
          }
          btnPause.onclick = () => {
            globalIsPaused = !globalIsPaused;
            if (globalIsPaused) {
              (svgEl as SVGSVGElement).pauseAnimations();
              iconPause.textContent = 'play_arrow';
              btnPause.classList.add('bg-primary/50');
            } else {
              (svgEl as SVGSVGElement).unpauseAnimations();
              iconPause.textContent = 'pause';
              btnPause.classList.remove('bg-primary/50');
            }
          };
        }

        // Camera Tracking Loop
        const track1 = document.getElementById('trackPath1') as unknown as SVGPathElement;
        const track2 = document.getElementById('trackPath2') as unknown as SVGPathElement;
        const arrow1 = document.getElementById('arrow1Group');
        const arrow2 = document.getElementById('arrow2Group');
        const totalDuration = 300; // 300 seconds per path (very slow movement)
        
        function updateCamera(now: number) {
          if (!document.body.contains(svgEl)) return;
          
          let dt = (now - globalAnimLastTime) / 1000;
          globalAnimLastTime = now;
          
          if (!globalIsPaused && rb1PanZoomInstance && track1 && track2 && arrow1 && arrow2) {
            globalAnimTime += dt;
            const time = globalAnimTime % (totalDuration * 2);
            let p, pNext, activeArrow, trackPath;
            
            if (time < totalDuration) {
              activeArrow = arrow1;
              arrow2.style.display = 'none';
              trackPath = track1;
            } else {
              activeArrow = arrow2;
              arrow1.style.display = 'none';
              trackPath = track2;
            }

            activeArrow.style.display = 'block';
            let progress = (time % totalDuration) / totalDuration;
            let len = trackPath.getTotalLength();
            let currentDist = progress * len;
            p = trackPath.getPointAtLength(currentDist);
            
            // Calculate angle
            let nextDist = Math.min(len, currentDist + 1);
            pNext = trackPath.getPointAtLength(nextDist);
            let angle = Math.atan2(pNext.y - p.y, pNext.x - p.x) * (180 / Math.PI);
            
            activeArrow.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${angle})`);

            if (p && el) {
              const container = el.parentElement;
              if (container) {
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                const zoom = rb1PanZoomInstance.getTransform().scale;
                
                const panX = (cw / 2) - p.x * zoom;
                const panY = (ch / 2) - p.y * zoom;
                
                rb1PanZoomInstance.moveTo(panX, panY);
              }
            }
          }
          requestAnimationFrame(updateCamera);
        }
        requestAnimationFrame(updateCamera);


        if (btnIn) {
          btnIn.onclick = () => {
            const cx = el.clientWidth / 2;
            const cy = el.clientHeight / 2;
            rb1PanZoomInstance.smoothZoom(cx, cy, 1.5);
          };
        }
        if (btnOut) {
          btnOut.onclick = () => {
            const cx = el.clientWidth / 2;
            const cy = el.clientHeight / 2;
            rb1PanZoomInstance.smoothZoom(cx, cy, 0.66);
          };
        }
        if (btnReset) {
          btnReset.onclick = () => {
            rb1PanZoomInstance.moveTo(0, 0);
            rb1PanZoomInstance.zoomAbs(0, 0, 0.15);
          };
        }
      } catch (err) {
        console.warn('Panzoom initialization skipped or failed:', err);
      }
    }
  }

  // Legend logic removed to replace with lists
}

// RBAC was moved to top

function renderRb1CompletaLists() {
  const allMetadata = new Map<number, RollerInfo>();
  Object.values(RB1_COMPLETA_MAP).forEach(m => allMetadata.set(m.posicao, m));
  Object.values(DECAPAGEM_MAP).forEach(m => allMetadata.set(m.posicao, m));
  const sortedMetadata = Array.from(allMetadata.values()).sort((a,b) => a.posicao - b.posicao);
  
  const listAll = $('listAllRollers');
  if (listAll) {
    listAll.innerHTML = sortedMetadata.map(m => `
      <tr class="hover:bg-surface-bright/50 transition-colors">
        <td class="px-4 py-3 font-medium text-on-surface">${m.posicao}</td>
        <td class="px-4 py-3 font-mono text-primary">${m.recurso || '<span class="text-gray-400">Sem código</span>'}</td>
        <td class="px-4 py-3">${m.nome}</td>
        <td class="px-4 py-3">${m.tipo}</td>
        <td class="px-4 py-3">
          <button class="btn btn-sm btn-outline" onclick="window.openEditMetaModal(${m.posicao})">✏️ Editar</button>
        </td>
      </tr>
    `).join('');
  }

  const listStock = $('listGeneralStock');
  if (listStock) {
    if (!estoque.length) {
      listStock.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-on-surface-variant italic">Nenhum rolo no estoque geral.</td></tr>`;
    } else {
      listStock.innerHTML = estoque.map(e => `
        <tr class="hover:bg-surface-bright/50 transition-colors">
          <td class="px-4 py-3 font-medium text-on-surface">⌀ ${e.diametro} mm</td>
          <td class="px-4 py-3">${sanitize(e.obs) || '—'}</td>
          <td class="px-4 py-3">${new Date(e.data_entrada).toLocaleDateString('pt-BR')}</td>
        </tr>
      `).join('');
    }
  }
}

// ============================================================================
// ROLO MODAL LOGIC
// ============================================================================

function showRoloModal(pos: number) {
  const r = getRolo(pos);
  const meta = DECAPAGEM_MAP[pos] || RB1_COMPLETA_MAP[pos];
  
  if (!meta) {
    toast(`Metadados não encontrados para a posição ${pos}`, 'error');
    return;
  }

  $('roloModalTitle').innerText = `${meta.nome} (Pos ${pos})`;
  $('roloModalSecao').innerText = meta.secao;

  let bodyHtml = '';
  
  if (r && !r.id.startsWith('virtual')) {
    const days = calcDays(r.data_troca);
    const st = getStatus(days);
    const bg = st === 'green' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : st === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200';
    
    bodyHtml += `
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-surface-container-low p-3 rounded-md border border-outline-variant/50">
          <span class="text-[10px] uppercase font-bold text-outline">Status Kanban</span>
          <div class="mt-1 font-mono font-bold text-sm px-2 py-1 rounded border inline-block ${bg}">${st.toUpperCase()}</div>
        </div>
        <div class="bg-surface-container-low p-3 rounded-md border border-outline-variant/50">
          <span class="text-[10px] uppercase font-bold text-outline">Diâmetro Atual</span>
          <div class="mt-1 font-mono font-bold text-sm text-primary-container">${r.diametro} mm</div>
        </div>
        <div class="bg-surface-container-low p-3 rounded-md border border-outline-variant/50">
          <span class="text-[10px] uppercase font-bold text-outline">Rolamento Utilizado</span>
          <div class="mt-1 font-bold text-sm text-on-surface">${r.rolamento || meta.rolamentoPadrao || 'Padrão'}</div>
        </div>
        <div class="bg-surface-container-low p-3 rounded-md border border-outline-variant/50">
          <span class="text-[10px] uppercase font-bold text-outline">Tempo de Uso</span>
          <div class="mt-1 font-mono font-bold text-sm text-on-surface">${days} dias</div>
        </div>
        <div class="bg-surface-container-low p-3 rounded-md border border-outline-variant/50 col-span-2 flex justify-between items-center">
          <div>
            <span class="text-[10px] uppercase font-bold text-outline">Última Troca</span>
            <div class="mt-1 text-sm text-on-surface">${new Date(r.data_troca).toLocaleDateString('pt-BR')} (Turno ${r.turno})</div>
          </div>
          <div class="text-right">
             <span class="text-[10px] uppercase font-bold text-outline">Motivo</span>
             <div class="mt-1 text-sm text-on-surface max-w-[200px] truncate" title="${r.obs_motivo || 'Não informado'}">${r.obs_motivo || 'Não informado'}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    bodyHtml += `
      <div class="bg-surface-container-low p-4 rounded-md border border-outline-variant/50 text-center">
        <span class="material-symbols-outlined text-outline text-3xl mb-2">info</span>
        <h4 class="font-bold text-on-surface">Sem dados registrados</h4>
        <p class="text-sm text-on-surface-variant mt-1">Este rolo ainda não possui registros de troca no sistema.</p>
        <div class="mt-3 grid grid-cols-2 gap-2 text-left">
          <div class="bg-white p-2 rounded border border-outline-variant/30">
            <span class="text-[9px] uppercase font-bold text-outline">Tipo</span>
            <div class="font-mono text-xs">${meta.tipo}</div>
          </div>
          <div class="bg-white p-2 rounded border border-outline-variant/30">
            <span class="text-[9px] uppercase font-bold text-outline">Diâmetro Padrão</span>
            <div class="font-mono text-xs">${meta.diametroPadrao} mm</div>
          </div>
        </div>
      </div>
    `;
  }

  // Histórico Table
  const hist = historico.filter(h => h.posicao === pos).sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime()).slice(0, 5);
  
  if (hist.length > 0) {
    bodyHtml += `
      <div class="mt-2">
        <h4 class="text-xs font-bold uppercase text-outline mb-2">Últimas 5 Trocas</h4>
        <div class="overflow-x-auto border border-outline-variant/50 rounded-md">
          <table class="w-full text-left border-collapse text-[11px]">
            <thead class="bg-surface-container text-on-surface-variant uppercase">
              <tr>
                <th class="px-2 py-1.5">Data</th>
                <th class="px-2 py-1.5">Turno</th>
                <th class="px-2 py-1.5">Motivo</th>
                <th class="px-2 py-1.5">Diâmetro</th>
              </tr>
            </thead>
            <tbody>
              ${hist.map(h => `
                <tr class="border-t border-outline-variant/30">
                  <td class="px-2 py-1.5">${new Date(h.data_troca).toLocaleDateString('pt-BR')}</td>
                  <td class="px-2 py-1.5"><span class="turno-badge turno-${h.turno} scale-75 origin-left inline-block">${h.turno}</span></td>
                  <td class="px-2 py-1.5 truncate max-w-[120px]" title="${h.obs_motivo}">${h.obs_motivo}</td>
                  <td class="px-2 py-1.5 font-mono">${h.diametro}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  bodyHtml += `
    <div class="mt-4 pt-4 border-t border-outline-variant/30 flex justify-end gap-2">
      <button class="btn btn-ghost text-sm py-1.5 px-4 rounded shadow hover:shadow-md transition-all flex items-center gap-2" onclick="closeRoloModal(); window.openEditMetaModal(${pos})">
        <span class="material-symbols-outlined text-[18px]">settings</span>
        Editar Propriedades
      </button>
      <button class="btn btn-primary text-sm py-1.5 px-4 rounded shadow hover:shadow-md transition-all flex items-center gap-2" onclick="closeRoloModal(); window.openSubModalForPos(${pos})">
        <span class="material-symbols-outlined text-[18px]">edit_document</span>
        Registrar Troca / Editar
      </button>
    </div>
  `;

  $('roloModalBody').innerHTML = bodyHtml;
  $('roloModal').classList.add('active');
}

function closeRoloModal() {
  $('roloModal').classList.remove('active');
}
(window as any).closeRoloModal = closeRoloModal;

$('roloModalClose').addEventListener('click', closeRoloModal);
$('roloModal').addEventListener('click', e => { if (e.target === $('roloModal')) closeRoloModal(); });

// Event Delegation for RB1 Completa Diagram
$('rb1CompletaDiagram').addEventListener('click', (e) => {
  const target = e.target as SVGElement;
  const g = target.closest('.rolo-clickable');
  if (g) {
    const posId = g.getAttribute('data-rolo-pos');
    if (posId) {
      showRoloModal(parseInt(posId, 10));
    }
  }
});


function renderAll(){
  renderStats();
  renderDecapagemStats();
  renderRb1CompletaStats();
  renderFurnace();
  renderDecapagem();
  renderDecapagemTable();
  renderRb1Completa();
  renderRb1CompletaLists();
  renderInventory();
  renderDecapagemInventory();
  renderHistory();
  renderMonthly();
  renderDecapagemMonthly();
}

function setupHoverTooltips() {
  let tooltip = document.getElementById('roloHoverTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'roloHoverTooltip';
    tooltip.className = 'fixed z-[9999] bg-surface text-on-surface p-4 rounded-xl shadow-2xl border border-outline-variant pointer-events-none opacity-0 transition-opacity duration-150 transform -translate-x-1/2 -translate-y-full';
    tooltip.style.minWidth = '240px';
    tooltip.style.marginTop = '-15px'; // offset above cursor
    tooltip.innerHTML = '';
    document.body.appendChild(tooltip);
  }

  const handleMouseOver = (e: MouseEvent) => {
    const target = e.target as Element;
    const g = target.closest('.rolo-clickable') || target.closest('.decapagem-interactive-roll');
    if (!g) return;
    
    const posStr = g.getAttribute('data-rolo-pos') || g.getAttribute('data-pos');
    if (!posStr) return;
    const pos = parseInt(posStr, 10);
    const meta = DECAPAGEM_MAP[pos] || RB1_COMPLETA_MAP[pos];
    const rolo = getRolo(pos as any);
    
    if (!meta || !rolo) return;

    const days = calcDays(rolo.data_troca);
    const st = getStatus(days);
    const dateStr = new Date(rolo.data_troca).toLocaleDateString('pt-BR');
    
    let statusBadge = '';
    if (st === 'green') statusBadge = '<span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded ml-auto">NORMAL</span>';
    else if (st === 'yellow') statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded ml-auto">ATENÇÃO</span>';
    else if (st === 'red') statusBadge = '<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded ml-auto">TROCAR</span>';

    tooltip!.innerHTML = `
      <div class="mb-2 pb-2 border-b border-outline-variant/30">
        <div class="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">${meta.tipo}</div>
        <div class="font-bold text-base flex items-center">${meta.nome} ${statusBadge}</div>
      </div>
      <div class="space-y-1.5 text-sm">
        <div class="flex justify-between"><span class="text-on-surface-variant text-xs font-semibold">Diâmetro:</span><span class="font-mono font-bold text-primary">${rolo.diametro} mm</span></div>
        <div class="flex justify-between"><span class="text-on-surface-variant text-xs font-semibold">Tempo de Uso:</span><span class="font-bold">${days !== null ? days + ' dias' : '—'}</span></div>
        <div class="flex justify-between"><span class="text-on-surface-variant text-xs font-semibold">Última Troca:</span><span class="text-xs font-medium">${dateStr} (T ${rolo.turno})</span></div>
      </div>
    `;

    tooltip!.style.opacity = '1';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (tooltip!.style.opacity === '1') {
      tooltip!.style.left = e.clientX + 'px';
      tooltip!.style.top = e.clientY + 'px';
    }
  };

  const handleMouseOut = (e: MouseEvent) => {
    tooltip!.style.opacity = '0';
  };

  const attachEvents = (diagId: string) => {
    const diag = document.getElementById(diagId);
    if (diag) {
      diag.addEventListener('mouseover', handleMouseOver);
      diag.addEventListener('mousemove', handleMouseMove);
      diag.addEventListener('mouseout', handleMouseOut);
    }
  };

  attachEvents('rb1CompletaDiagram');
  attachEvents('decapagemDiagram');
}

window.addEventListener('dataLoaded', renderAll);
initDemo(); renderAll(); setupHoverTooltips(); setInterval(renderAll,60000);


// FORCE VITE RELOAD

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
  
  // Logic for 'Recurso' (roller code)
  let recursoValue = meta.recurso;
  if (!recursoValue) {
    // Generate a code: RB1 xxxxx-xx
    const part1 = String(Math.floor(Math.random() * 90000) + 10000);
    const part2 = String(Math.floor(Math.random() * 90) + 10);
    recursoValue = `RB1 ${part1}-${part2}`;
  }
  ($('inMetaRecurso') as HTMLInputElement).value = recursoValue;
  ($('inMetaSituacao') as HTMLSelectElement).value = meta.situacao || 'Em Uso';
  ($('inMetaDiamInicial') as HTMLInputElement).value = meta.diametroInicial != null ? String(meta.diametroInicial) : '';
  ($('inMetaDiamFinal') as HTMLInputElement).value = meta.diametroFinal != null ? String(meta.diametroFinal) : '';
  
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
