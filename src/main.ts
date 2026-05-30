/** RB1 System v3 — Main Application (Clean, No Exports) */
import './style.css';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate, sanitize,
  registrarSubstituicao, editarHistorico, adicionarEstoque, removerEstoque, initDemo, DECAPAGEM_MAP, DECAPAGEM_ORDER } from './store';
import type { Posicao, Turno, KanbanStatus } from './types';

const $ = (id: string) => document.getElementById(id)!;

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
const TABS = ['Forno','Decapagem','Rb1Completa'] as const;
function switchTab(active: typeof TABS[number]) {
  TABS.forEach(t => {
    const tab = $(`tab${t}`), view = $(`view${t}`);
    if (t === active) { tab.classList.add('active'); view.classList.remove('view-hidden'); view.classList.add('view-active'); }
    else { tab.classList.remove('active'); view.classList.remove('view-active'); view.classList.add('view-hidden'); }
  });
}
$('tabForno').addEventListener('click', () => switchTab('Forno'));
$('tabDecapagem').addEventListener('click', () => switchTab('Decapagem'));
$('tabRb1Completa').addEventListener('click', () => switchTab('Rb1Completa'));

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
    let c = `<g class="decapagem-interactive-roll" data-pos="${pos}">`;
    c += baseBlock(x, y + 30); // Base starts at bottom of cylinder (350 + 30 = 380)
    
    // Backing circle to hide the pedestal underneath
    c += `<circle cx="${x}" cy="${y}" r="30" fill="#11141a" />`;
    
    // Rotating group for shifting metallic gradient, spokes and dashed ring
    c += `<g>`;
    const rotVal = dir === 'cw' ? `0 ${x} ${y};360 ${x} ${y}` : `360 ${x} ${y};0 ${x} ${y}`;
    c += `<animateTransform attributeName="transform" type="rotate" values="${rotVal}" dur="12s" repeatCount="indefinite" />`;
    
    // Shifting metal reflection fill
    c += `<circle cx="${x}" cy="${y}" r="29.5" fill="url(#metalRoll)" />`;
    
    // Multi-spoke mechanical crosshairs (8 lines)
    c += `<line x1="${x - 24}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#f8fafc" stroke-width="0.8" opacity="0.3" />`;
    c += `<line x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" stroke="#f8fafc" stroke-width="0.8" opacity="0.3" />`;
    c += `<line x1="${x - 17}" y1="${y - 17}" x2="${x + 17}" y2="${y + 17}" stroke="#f8fafc" stroke-width="0.8" opacity="0.2" />`;
    c += `<line x1="${x - 17}" y1="${y + 17}" x2="${x + 17}" y2="${y - 17}" stroke="#f8fafc" stroke-width="0.8" opacity="0.2" />`;
    
    // Inner dashed indicator circle
    c += `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="#f8fafc" stroke-width="1" stroke-dasharray="2 3" opacity="0.35" />`;
    c += `</g>`;
    
    // Static crisp casing ring on top
    c += `<circle cx="${x}" cy="${y}" r="30" fill="none" stroke="#e2e8f0" stroke-width="2" />`;
    c += `<circle cx="${x}" cy="${y}" r="4.5" fill="#11141a" stroke="#e2e8f0" stroke-width="1.5" />`;
    c += `<circle cx="${x}" cy="${y}" r="1.5" fill="#e2e8f0" />`;
    c += `</g>`;
    return c;
  }
  
  // Small wave rollers (Radius = 10)
  function smallRoll(x: number, y: number, dir: 'cw' | 'ccw', pos: number) {
    let s = `<g class="decapagem-interactive-roll" data-pos="${pos}">`;
    s += `<circle cx="${x}" cy="${y}" r="10" fill="#11141a" />`; // Backing
    s += `<g>`;
    const rotVal = dir === 'cw' ? `0 ${x} ${y};360 ${x} ${y}` : `360 ${x} ${y};0 ${x} ${y}`;
    s += `<animateTransform attributeName="transform" type="rotate" values="${rotVal}" dur="5s" repeatCount="indefinite" />`;
    
    // Shifting metal reflection fill
    s += `<circle cx="${x}" cy="${y}" r="9.5" fill="url(#metalRoll)" />`;
    
    // Inner crosshairs
    s += `<line x1="${x - 7}" y1="${y}" x2="${x + 7}" y2="${y}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    s += `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    s += `</g>`;
    
    // Outer crisp ring
    s += `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#e2e8f0" stroke-width="1.8" />`;
    s += `<circle cx="${x}" cy="${y}" r="1.5" fill="#e2e8f0" />`;
    s += `</g>`;
    return s;
  }
  
  // Vertical pinch pair (Radius = 8)
  function pinchRolls(x: number, y: number, pos: number) {
    let p = `<g class="decapagem-interactive-roll" data-pos="${pos}">`;
    const cyTop = y - 10;
    const cyBottom = y + 10;
    const r = 8;
    const dur = '4s';
    
    // Top roller (CCW)
    p += `<circle cx="${x}" cy="${cyTop}" r="${r}" fill="#11141a" />`;
    p += `<g>`;
    p += `<animateTransform attributeName="transform" type="rotate" values="360 ${x} ${cyTop};0 ${x} ${cyTop}" dur="${dur}" repeatCount="indefinite" />`;
    p += `<circle cx="${x}" cy="${cyTop}" r="${r - 0.5}" fill="url(#metalRoll)" />`;
    p += `<line x1="${x - 5}" y1="${cyTop}" x2="${x + 5}" y2="${cyTop}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    p += `<line x1="${x}" y1="${cyTop - 5}" x2="${x}" y2="${cyTop + 5}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    p += `</g>`;
    p += `<circle cx="${x}" cy="${cyTop}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1.8" />`;
    p += `<circle cx="${x}" cy="${cyTop}" r="1.5" fill="#e2e8f0" />`;
    
    // Bottom roller (CW)
    p += `<circle cx="${x}" cy="${cyBottom}" r="${r}" fill="#11141a" />`;
    p += `<g>`;
    p += `<animateTransform attributeName="transform" type="rotate" values="0 ${x} ${cyBottom};360 ${x} ${cyBottom}" dur="${dur}" repeatCount="indefinite" />`;
    p += `<circle cx="${x}" cy="${cyBottom}" r="${r - 0.5}" fill="url(#metalRoll)" />`;
    p += `<line x1="${x - 5}" y1="${cyBottom}" x2="${x + 5}" y2="${cyBottom}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    p += `<line x1="${x}" y1="${cyBottom - 5}" x2="${x}" y2="${cyBottom + 5}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    p += `</g>`;
    p += `<circle cx="${x}" cy="${cyBottom}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1.8" />`;
    p += `<circle cx="${x}" cy="${cyBottom}" r="1.5" fill="#e2e8f0" />`;
    p += `</g>`;
    
    return p;
  }
  
  // 2x2 Station (with 2 yellow and 2 white rollers)
  function brushStation(x: number, y: number, pos: number) {
    let b = `<g class="decapagem-interactive-roll" data-pos="${pos}">`;
    b += tallBaseBlock(x, y + 30); // Stand starts at bottom of station box (320 + 30 = 350)
    // Outer station housing box
    b += `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" rx="4" fill="none" stroke="#9ca3af" stroke-width="1.5" />`;
    
    const r = 8;
    const dur = '4s';
    
    // Roller top-left: White, CCW
    const cxTL = x - 15, cyTL = y - 15;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="${r}" fill="#11141a" />`;
    b += `<g>`;
    b += `<animateTransform attributeName="transform" type="rotate" values="360 ${cxTL} ${cyTL};0 ${cxTL} ${cyTL}" dur="${dur}" repeatCount="indefinite" />`;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="${r - 0.5}" fill="url(#metalRoll)" />`;
    b += `<line x1="${cxTL - 5}" y1="${cyTL}" x2="${cxTL + 5}" y2="${cyTL}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    b += `<line x1="${cxTL}" y1="${cyTL - 5}" x2="${cxTL}" y2="${cyTL + 5}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    b += `</g>`;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1.8" />`;
    b += `<circle cx="${cxTL}" cy="${cyTL}" r="1.5" fill="#e2e8f0" />`;
    
    // Roller top-right: Yellow, CCW
    const cxTR = x + 15, cyTR = y - 15;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="${r}" fill="#11141a" />`;
    b += `<g>`;
    b += `<animateTransform attributeName="transform" type="rotate" values="360 ${cxTR} ${cyTR};0 ${cxTR} ${cyTR}" dur="${dur}" repeatCount="indefinite" />`;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="${r - 0.5}" fill="url(#yellowMetalRoll)" />`;
    b += `<line x1="${cxTR - 5}" y1="${cyTR}" x2="${cxTR + 5}" y2="${cyTR}" stroke="#78350f" stroke-width="0.8" opacity="0.45" />`;
    b += `<line x1="${cxTR}" y1="${cyTR - 5}" x2="${cxTR}" y2="${cyTR + 5}" stroke="#78350f" stroke-width="0.8" opacity="0.45" />`;
    b += `</g>`;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="${r}" fill="none" stroke="#eab308" stroke-width="1.8" />`;
    b += `<circle cx="${cxTR}" cy="${cyTR}" r="1.5" fill="#78350f" />`;
    
    // Roller bottom-left: Yellow, CW
    const cxBL = x - 15, cyBL = y + 15;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="${r}" fill="#11141a" />`;
    b += `<g>`;
    b += `<animateTransform attributeName="transform" type="rotate" values="0 ${cxBL} ${cyBL};360 ${cxBL} ${cyBL}" dur="${dur}" repeatCount="indefinite" />`;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="${r - 0.5}" fill="url(#yellowMetalRoll)" />`;
    b += `<line x1="${cxBL - 5}" y1="${cyBL}" x2="${cxBL + 5}" y2="${cyBL}" stroke="#78350f" stroke-width="0.8" opacity="0.45" />`;
    b += `<line x1="${cxBL}" y1="${cyBL - 5}" x2="${cxBL}" y2="${cyBL + 5}" stroke="#78350f" stroke-width="0.8" opacity="0.45" />`;
    b += `</g>`;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="${r}" fill="none" stroke="#eab308" stroke-width="1.8" />`;
    b += `<circle cx="${cxBL}" cy="${cyBL}" r="1.5" fill="#78350f" />`;
    
    // Roller bottom-right: White, CW
    const cxBR = x + 15, cyBR = y + 15;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="${r}" fill="#11141a" />`;
    b += `<g>`;
    b += `<animateTransform attributeName="transform" type="rotate" values="0 ${cxBR} ${cyBR};360 ${cxBR} ${cyBR}" dur="${dur}" repeatCount="indefinite" />`;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="${r - 0.5}" fill="url(#metalRoll)" />`;
    b += `<line x1="${cxBR - 5}" y1="${cyBR}" x2="${cxBR + 5}" y2="${cyBR}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    b += `<line x1="${cxBR}" y1="${cyBR - 5}" x2="${cxBR}" y2="${cyBR + 5}" stroke="#f8fafc" stroke-width="0.8" opacity="0.35" />`;
    b += `</g>`;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1.8" />`;
    b += `<circle cx="${cxBR}" cy="${cyBR}" r="1.5" fill="#e2e8f0" />`;
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
          <button class="text-orange-600 hover:text-orange-800 border border-orange-300 hover:bg-orange-50 px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-all" onclick="window.openSubModalForDecapagem(${p})">
            🔄 Substituir
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  body.innerHTML = rowsHtml;
}

// Expose openSubModalForDecapagem globally so inline onclick works cleanly
(window as any).openSubModalForDecapagem = (pos: number) => {
  openSubModal();
  const selPos = $('inPos') as HTMLSelectElement;
  selPos.value = String(pos);
  if (typeof (window as any).updateSubModalFields === 'function') {
    (window as any).updateSubModalFields();
  }
  // Trigger diameter sync based on selected position
  const estSelect = $('inEstoqueRolo') as HTMLSelectElement;
  estSelect.value = '';
  ($('inDiam') as HTMLInputElement).value = '';
};

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
    return `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${sanitize(cleaned)||'Sem obs.'}</span></div><div class="inv-item-actions"><button data-remove-est="${e.id}" title="Remover">✕</button></div></div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-remove-est]').forEach(btn=>{
    btn.addEventListener('click',()=>{removerEstoque(btn.dataset.removeEst!);renderAll();toast('Rolo removido','info');});
  });
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
    return `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${sanitize(cleaned)||'Sem obs.'}</span></div><div class="inv-item-actions"><button data-remove-est="${e.id}" title="Remover">✕</button></div></div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-remove-est]').forEach(btn=>{
    btn.addEventListener('click',()=>{removerEstoque(btn.dataset.removeEst!);renderAll();toast('Rolo removido','info');});
  });
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
    return `<tr class="border-b border-outline-variant/20 hover:bg-surface-bright/80 transition-colors"><td class="px-4 py-3 font-mono text-xs text-on-surface-variant">${fmtDate(h.data_troca)}</td><td class="px-4 py-3 font-semibold text-on-surface">${posLabel}</td><td class="px-4 py-3"><span class="turno-badge turno-${h.turno} text-[10px] font-bold px-2 py-0.5 rounded inline-block">${h.turno}</span></td><td class="px-4 py-3 font-mono">${h.diametro} mm</td><td class="px-4 py-3 text-on-surface-variant max-w-[180px] truncate">${sanitize(h.obs_motivo) || '—'}</td><td class="px-4 py-3"><span class="age-badge age-${st} text-xs font-bold px-2 py-0.5 rounded inline-block">${h.idade_dias}d</span></td><td class="px-4 py-3"><button class="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1.5 rounded-md transition-all" data-edit="${h.id}">✏️</button></td></tr>`;
  }).join('');
  body.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(btn=>{
    btn.addEventListener('click',()=>openEditModal(btn.dataset.edit!));
  });
}

// Modal: Substituição
function populateEstoqueSelect(){
  const sel=$('inEstoqueRolo') as HTMLSelectElement;
  sel.innerHTML='<option value="">Selecione um rolo do estoque...</option>';
  const posVal = parseInt(($('inPos') as HTMLSelectElement).value);
  const isDecapagem = !isNaN(posVal) && posVal >= 100;
  
  const filteredEstoque = isDecapagem 
    ? estoque.filter(e => e.obs.startsWith('[Decapagem]'))
    : estoque.filter(e => !e.obs.startsWith('[Decapagem]'));
    
  filteredEstoque.forEach(e=>{
    const cleaned = e.obs.replace(/^\[Forno\]\s*|^\[Decapagem\]\s*/, '');
    sel.innerHTML+=`<option value="${e.id}">⊘ ${e.diametro} mm — ${sanitize(cleaned)||'Sem obs.'}</option>`;
  });
}

function updateSubModalFields() {
  const posVal = parseInt(($('inPos') as HTMLSelectElement).value);
  const isDecapagem = !isNaN(posVal) && posVal >= 100;
  
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
  const item=estoque.find(e=>e.id===sel);
  ($('inDiam') as HTMLInputElement).value=item?String(item.diametro):'';
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
  const isDecapagem = pos >= 100;
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
    const taggedObs = isDecTab ? '[Decapagem] ' + obs : '[Forno] ' + obs;
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
  const isDecapagem = pos >= 100;
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
  </defs>`;

  function rolerDecap(cx: number, cy: number, r: number, label: string = '', sub: string = '', hasStand: boolean = true) {
    let s = '';
    // Stand Forno Style
    let sh = 30;
    if (hasStand) {
      let sw = r * 1.2;
      s += `<rect x="${cx - sw/2}" y="${cy + r - 2}" width="${sw}" height="${sh}" fill="#374151" rx="2"/>`;
      s += `<rect x="${cx - sw/2 - 5}" y="${cy + r + sh - 8}" width="${sw + 10}" height="8" fill="#4b5563" rx="2"/>`;
    }
    
    // Core (Dark) + Outer Glow (Green)
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="3" filter="url(#greenGlow)"/>`;
    
    // Animated Inner Dashed Ring
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" class="spin-slow" style="transform-origin: ${cx}px ${cy}px"/>`;
    
    // Center Text (Number / Dot)
    s += `<circle cx="${cx}" cy="${cy}" r="3" fill="#22c55e"/>`;

    // Typography (Stacked Below)
    if (label) {
      let textY = hasStand ? cy + r + sh + 15 : cy + r + 15;
      s += `<text x="${cx}" y="${textY}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>`;
      if (sub) {
        s += `<text x="${cx}" y="${textY + 12}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="bold" fill="#22c55e" text-anchor="middle">${sub}</text>`;
        s += `<text x="${cx}" y="${textY + 23}" font-family="JetBrains Mono, monospace" font-size="8" fill="#9ca3af" text-anchor="middle">2140mm</text>`;
      }
    }
    return s;
  }

  
  // ====================================================================
  // HELPER FUNCTIONS (Absolutely Empty)
  // ====================================================================
  
  function dot(cx: number, cy: number, r: number = 4.5): string { 
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    return s;
  }
  
  function vertBars(x: number, cy: number, count: number, h: number = 30, spacing: number = 16, w: number = 8): string { 
    let s=''; for(let i=0; i<count; i++) s += `<rect x="${x + i*spacing}" y="${cy - h/2}" width="${w}" height="${h}" fill="#1e293b" rx="2"/>`; return s;
  }
  function solidCoil(cx: number, cy: number, r: number, label: string): string { 
    return rolerDecap(cx, cy, r, label, '1334 mm');
  }
  
  function maqSolda(cx: number, cy: number): string { 
    return `<rect x="${cx-20}" y="${cy-30}" width="40" height="60" fill="#1e293b" stroke="#050816" stroke-width="2" rx="4"/>
            <text x="${cx}" y="${cy-40}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">MÁQUINA SOLDA</text>
            <circle cx="${cx}" cy="${cy}" r="10" fill="#f97316" filter="url(#blueGlow)"/>`; 
  }
  
  function secadorLosango(cx: number, cy: number, w: number = 80, h: number = 80, label: string): string { 
    let s = `<polygon points="${cx},${cy - h/2} ${cx + w/2},${cy} ${cx},${cy + h/2} ${cx - w/2},${cy}" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += dot(cx - w/2, cy, 6) + dot(cx + w/2, cy, 6);
    s += `<text x="${cx}" y="${cy - h/2 - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  
  function corretorCruz(cx: number, cy: number, r: number = 25, label: string): string { 
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="2" filter="url(#greenGlow)"/>`;
    s += `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<path d="M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} L ${cx} ${cy} Z" fill="#4ade80"/>`;
    s += `<text x="${cx}" y="${cy - r - 10}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  
  function tanque(x: number, y: number, w: number, h: number, label: string, rollers: number[] = []): string { 
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
    // Liquid
    s += `<rect x="${x+2}" y="${y+h/2}" width="${w-4}" height="${h/2-2}" fill="#0ea5e9" opacity="0.2"/>`;
    s += `<text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    rollers.forEach(rx => {
      s += rolerDecap(x + rx, y + h - 25, 20, '', '', false);
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
    let s = `<rect x="${cx - 10}" y="${cy - 20}" width="20" height="40" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
    s += `<polygon points="${cx+10},${cy} ${cx+30},${cy-10} ${cx+30},${cy+10}" fill="#334155"/>`;
    s += `<text x="${cx}" y="${cy - 30}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${label}</text>`;
    return s;
  }
  function mesaInspecao(x: number, y: number, w: number): string { 
    return `<rect x="${x}" y="${y+5}" width="${w}" height="10" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="${x + w/2}" y="${y - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">MESA DE INSPEÇÃO</text>`;
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
  svg += rolerDecap(100, Y1 + 40, 40, 'Bobinadeira 1', '');
  
  // 1 e 2 na Bobina (Snubber rolls resting on the coil)
  // Coil center is (100, Y1+40=210). Radius=40. Roller radius=8. Gap=1. Dist=49.
  // 1 at 180 degrees: cx = 100 - 49*cos(0) = 51, cy = 210 - 49*sin(0) = 210
  // 2 at 100 degrees: cx = 100 - 49*cos(80) = 100 - 49*0.1736 = 91.5, cy = 210 - 49*sin(80) = 210 - 49*0.9848 = 161.7
  svg += rNr(51.0, 210.0, 8, '', 0,0,0,0,0,0);
  svg += rNr(91.5, 161.7, 8, '', 0,0,0,0,0,0);
  
  // 3, 4 (Pinch)
  let pX1 = 158;
  svg += rNr(pX1, Y1 - 13.75, 12, '', 0,0,0,0,0,0);
  svg += rNr(pX1, Y1 + 13.75, 12, '', 0,0,0,0,0,0);
  
  // 5 (Lower)
  svg += rNr(185, Y1 + 11.75, 10, '', 0,0,0,0,0,0);
  
  // 6-10 (Leveler / Straightener)
  // Upper rollers: 7, 9 (center Y1 - 6.75)
  // Lower rollers: 6, 8, 10 (center Y1 + 6.75)
  let stX1 = 215;
  svg += rNr(stX1,      Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 6
  svg += rNr(stX1 + 10, Y1 - 6.75, 5, '', 0,0,0,0,0,0); // 7
  svg += rNr(stX1 + 20, Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 8
  svg += rNr(stX1 + 30, Y1 - 6.75, 5, '', 0,0,0,0,0,0); // 9
  svg += rNr(stX1 + 40, Y1 + 6.75, 5, '', 0,0,0,0,0,0); // 10

  // 11-15 (Inline)
  // All lower rollers
  let inX1 = 275;
  for(let i=0; i<5; i++) {
    svg += rNr(inX1 + i*15, Y1 + 6.75, 5, '', 0,0,0,0,0,0);
  }

  // 16, 17, 18
  svg += rectSens(350, '16');
  svg += rectSens(370, '17');
  svg += rectSens(390, '18');

  // 19, 20 (Pinch)
  svg += rNr(430, Y1-14, 14, '19', 430, Y1-36, 430, Y1-34, 430, Y1-28);
  svg += rNr(430, Y1+14, 14, '20', 430, Y1+36, 430, Y1+34, 430, Y1+28);

  // TESOURA 1
  let tesX = 400;
  svg += `<text x="${tesX+20}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 1</text>`;
  svg += `<rect x="${tesX}" y="${Y1-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tesX+15}" y="${Y1}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<polygon points="${tesX+15},${Y1+25} ${tesX+30},${Y1+25} ${tesX+60},${Y1+40} ${tesX+45},${Y1+40}" fill="#334155" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tesX+35}" y="${Y1+45}" width="35" height="50" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<path d="M ${tesX+40} ${Y1+55} Q ${tesX+52} ${Y1+50} ${tesX+65} ${Y1+55} M ${tesX+40} ${Y1+65} Q ${tesX+52} ${Y1+60} ${tesX+65} ${Y1+65} M ${tesX+40} ${Y1+75} Q ${tesX+52} ${Y1+70} ${tesX+65} ${Y1+75} M ${tesX+40} ${Y1+85} Q ${tesX+52} ${Y1+80} ${tesX+65} ${Y1+85}" fill="none" stroke="#64748b" stroke-width="1"/>`; 
  svg += `<polygon points="${tesX+55},${Y1+70} ${tesX+85},${Y1+35} ${tesX+89},${Y1+39} ${tesX+59},${Y1+74}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
  svg += `<line x1="${tesX+50}" y1="${Y1+75}" x2="${tesX+60}" y2="${Y1+65}" stroke="${BK}" stroke-width="1.5"/>`; // Rod
  svg += `<line x1="${tesX+50}" y1="${Y1+60}" x2="${tesX+50}" y2="${Y1+85}" stroke="${BK}" stroke-width="1.5"/>`; // Plate

  // Table 21-26
  let tabX = 490;
  svg += `<rect x="${tabX-10}" y="${Y1}" width="70" height="16" fill="#fff" stroke="${BK}" stroke-width="1.2"/>`;
  svg += `<line x1="${tesX+89}" y1="${Y1+39}" x2="${tabX+20}" y2="${Y1+16}" stroke="${BK}" stroke-width="1.2"/>`; // Connector
  let tbx = tabX;
  for(let i=21; i<=26; i++) {
    svg += rNr(tbx, Y1+5, 5, i.toString(), tbx, Y1-12, tbx, Y1-10, tbx, Y1);
    tbx += 10;
  }

  // 27-31
  let brx = 570;
  for(let i=27; i<=31; i++) {
    svg += rNr(brx, Y1+5, 5, i.toString(), brx, Y1-12, brx, Y1-10, brx, Y1);
    brx += 10;
  }

  // ENROLADOR TIRAS
  let enrX = 640;
  svg += `<text x="${enrX+8}" y="${Y1-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR</text>`;
  svg += `<text x="${enrX+8}" y="${Y1-23}" font-family="Montserrat, sans-serif" font-size="10" font-weight="800" fill="#fbbf24" text-anchor="middle">1334 mm</text>`;
  svg += `<path d="M ${enrX-15} ${Y1-15} Q ${enrX+8} ${Y1+2} ${enrX+31} ${Y1-15}" fill="none" stroke="#64748b" stroke-width="3"/>`;
  svg += rNr(enrX, Y1+6, 6, '32', enrX, Y1+25, enrX, Y1+23, enrX, Y1+12);
  svg += rNr(enrX+16, Y1+6, 6, '35', enrX+16, Y1+25, enrX+16, Y1+23, enrX+16, Y1+12);
  svg += rNr(enrX, Y1-6, 6, '33', enrX-12, Y1-28, enrX-10, Y1-26, enrX-4, Y1-10);
  svg += rNr(enrX+16, Y1-6, 6, '34', enrX+28, Y1-28, enrX+26, Y1-26, enrX+20, Y1-10);

  // 36
  svg += rNr(680, Y1+5, 5, '36', 680, Y1+20, 680, Y1+18, 680, Y1+10);

  // 37-42
  let srx = 700;
  for(let i=37; i<=42; i++) {
    svg += rNr(srx, Y1+5, 5, i.toString(), srx, Y1-12, srx, Y1-10, srx, Y1, 8);
    srx += 10;
  }

  // 43 Sensor
  svg += `<line x1="${srx}" y1="${Y1-4}" x2="${srx}" y2="${Y1+4}" stroke="#64748b" stroke-width="2"/>`;
  srx += 10;

  // 44-72
  for(let i=44; i<=72; i++) {
    let th = (i % 2 === 0) ? Y1-15 : Y1-22;
    svg += rNr(srx, Y1+5, 5, i.toString(), srx-3, th, srx-2, th+2, srx, Y1, 8);
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
  function rNrForno(cx: number, cy: number, r: number, num: string, nx: number, ny: number) {
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#052e16" stroke="#22c55e" stroke-width="1.5" filter="url(#greenGlow)"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" class="spin-fast" style="transform-origin: ${cx}px ${cy}px"/>`;
    s += `<text x="${nx}" y="${ny}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${num}</text>`;
    return s;
  }

  // Bobina Principal (Defletor)
  svg += rolerDecap(100, Y2 + 40, 40, 'Bobinadeira 2', '');
  
  // 86, 87 (Snubber rolls resting on the coil)
  // Coil center is (100, Y2+40=490). Radius=40. Roller radius=8. Gap=1. Dist=49.
  // 86 at ~140 degrees: cx = 100 - 49*cos(40) = 62.5, cy = 490 - 49*sin(40) = 458.5
  // 87 at ~110 degrees: cx = 100 - 49*cos(70) = 83.2, cy = 490 - 49*sin(70) = 444.0
  svg += rNrForno(62.5, 458.5, 8, '', 0, 0);
  svg += rNrForno(83.2, 444.0, 8, '', 0, 0);

  // 88, 89 (Pinch)
  let p88X = 160;
  svg += rNrForno(p88X, Y2 - 13.75, 12, '', 0, 0);
  svg += rNrForno(p88X, Y2 + 13.75, 12, '', 0, 0);

  // 90 (Lower)
  svg += rNrForno(200, Y2 + 11.75, 10, '', 0, 0);

  // 91-95 (Leveler / Straightener)
  // Lower: 91, 95, 94. Upper: 92, 93.
  let l91X = 240;
  svg += rNrForno(l91X,      Y2 + 7.75, 6, '', 0, 0); // 91 (Lower)
  svg += rNrForno(l91X + 12, Y2 - 7.75, 6, '', 0, 0); // 92 (Upper)
  svg += rNrForno(l91X + 24, Y2 + 7.75, 6, '', 0, 0); // 95 (Lower)
  svg += rNrForno(l91X + 36, Y2 - 7.75, 6, '', 0, 0); // 93 (Upper)
  svg += rNrForno(l91X + 48, Y2 + 7.75, 6, '', 0, 0); // 94 (Lower)

  // 96-100 (Inline lower)
  let i96X = 310;
  for(let i=0; i<5; i++) {
    svg += rNrForno(i96X + i*15, Y2 + 7.75, 6, '', 0, 0);
  }

  // 101, 102, 103 (Sensors)
  // Rectangles above the line, with a probe touching the line
  let s101X = 390;
  for(let i=0; i<3; i++) {
    let sx = s101X + i*20;
    svg += `<rect x="${sx-5}" y="${Y2-20}" width="10" height="20" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
    svg += `<line x1="${sx}" y1="${Y2}" x2="${sx}" y2="${Y2+6}" stroke="#0f172a" stroke-width="1.5"/>`;
  }

  // 104, 105 (Pinch)
  let pX2 = 460;
  svg += rNrForno(pX2, Y2 - 13.75, 12, '', 0, 0);
  svg += rNrForno(pX2, Y2 + 13.75, 12, '', 0, 0);

  // TESOURA 2
  let tes2X = 550;
  svg += `<text x="${tes2X+20}" y="${Y2-35}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">TESOURA 2</text>`;
  svg += `<rect x="${tes2X}" y="${Y2-25}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tes2X+15}" y="${Y2}" width="15" height="25" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<polygon points="${tes2X+15},${Y2+25} ${tes2X+30},${Y2+25} ${tes2X+60},${Y2+40} ${tes2X+45},${Y2+40}" fill="#334155" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<rect x="${tes2X+35}" y="${Y2+45}" width="35" height="50" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>`; 
  svg += `<path d="M ${tes2X+40} ${Y2+55} Q ${tes2X+52} ${Y2+50} ${tes2X+65} ${Y2+55} M ${tes2X+40} ${Y2+65} Q ${tes2X+52} ${Y2+60} ${tes2X+65} ${Y2+65} M ${tes2X+40} ${Y2+75} Q ${tes2X+52} ${Y2+70} ${tes2X+65} ${Y2+75} M ${tes2X+40} ${Y2+85} Q ${tes2X+52} ${Y2+80} ${tes2X+65} ${Y2+85}" fill="none" stroke="#64748b" stroke-width="1"/>`; 
  svg += `<polygon points="${tes2X+55},${Y2+70} ${tes2X+85},${Y2+35} ${tes2X+89},${Y2+39} ${tes2X+59},${Y2+74}" fill="url(#smallMetal)" stroke="#0f172a" stroke-width="1.2"/>`;
  svg += `<line x1="${tes2X+50}" y1="${Y2+75}" x2="${tes2X+60}" y2="${Y2+65}" stroke="${BK}" stroke-width="1.5"/>`; // Rod
  svg += `<line x1="${tes2X+50}" y1="${Y2+60}" x2="${tes2X+50}" y2="${Y2+85}" stroke="${BK}" stroke-width="1.5"/>`; // Plate

  // 106-109 Hydraulic Table
  let tbE2X = 700;
  // Hydraulic Cylinder
  svg += `<line x1="${tbE2X + 45}" y1="${Y2 + 25}" x2="${tbE2X - 5}" y2="${Y2 + 100}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${tbE2X + 55}" y1="${Y2 + 5}" x2="${tbE2X + 45}" y2="${Y2 + 25}" stroke="#94a3b8" stroke-width="4"/>`;
  // Floor mount
  svg += `<line x1="${tbE2X - 25}" y1="${Y2 + 100}" x2="${tbE2X + 15}" y2="${Y2 + 100}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<6; i++) {
    let hx = (tbE2X - 20) + i*6;
    svg += `<line x1="${hx}" y1="${Y2 + 100}" x2="${hx - 8}" y2="${Y2 + 110}" stroke="#475569" stroke-width="1.5"/>`;
  }
  // Table Box
  svg += `<rect x="${tbE2X - 10}" y="${Y2 + 2}" width="120" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  // Rollers (106 to 109)
  svg += rNrForno(tbE2X + 10, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 40, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 70, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(tbE2X + 100, Y2 + 7.75, 6, '', 0, 0);

  // 110-116 Inline bottom rollers
  let inE2X = 860;
  for(let i=0; i<7; i++) {
    svg += rNrForno(inE2X + i*25, Y2 + 7.75, 6, '', 0, 0);
  }

  // ENROLADOR DE TIRAS
  let enrE2X = 1080;
  svg += `<text x="${enrE2X+37}" y="${Y2-45}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">ENROLADOR DE TIRAS</text>`;
  // Curved Top Guide (Crescent shape)
  svg += `<path d="M ${enrE2X+15} ${Y2-25} Q ${enrE2X+37} ${Y2-5} ${enrE2X+60} ${Y2-25} Q ${enrE2X+37} ${Y2-15} ${enrE2X+15} ${Y2-25}" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>`;
  
  // Upper rollers (117, 119, 120, 122)
  svg += rNrForno(enrE2X, Y2 - 7.75, 6, '', 0, 0); // 117
  svg += rNrForno(enrE2X + 25, Y2 - 7.75, 6, '', 0, 0); // 119
  svg += rNrForno(enrE2X + 50, Y2 - 7.75, 6, '', 0, 0); // 120
  svg += rNrForno(enrE2X + 75, Y2 - 7.75, 6, '', 0, 0); // 122
  
  // Lower rollers (118, 121)
  svg += rNrForno(enrE2X + 25, Y2 + 7.75, 6, '', 0, 0); // 118
  svg += rNrForno(enrE2X + 50, Y2 + 7.75, 6, '', 0, 0); // 121

  // 123-125 Bottom rollers
  let trE2X = 1240;
  svg += rNrForno(trE2X, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(trE2X + 30, Y2 + 7.75, 6, '', 0, 0);
  svg += rNrForno(trE2X + 60, Y2 + 7.75, 6, '', 0, 0);

  // Merge Bridle  // Merge Bridle (Restored Mergulhador)
  svg += rolerDecap(1350, Y2-30, 30, 'Mergulhador QUIM 1', '2140 mm');
  svg += dot(1350, Y2+15, 15);

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
    svg += rNrForno(ax, YM + 6, 6, '', ax, YM + 22);
    ax += 14; // Tight spacing
  }

  // 2. Hydraulic Table: 3 Rollers ALL BOTTOM, NO LABELS
  let tbX = ax + 15;
  
  // Hydraulic Cylinder Support
  svg += `<line x1="${tbX + 30}" y1="${YM + 25}" x2="${tbX - 10}" y2="${YM + 100}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${tbX + 40}" y1="${YM + 5}" x2="${tbX + 30}" y2="${YM + 25}" stroke="#94a3b8" stroke-width="4"/>`;
  
  // Floor mount with hatching
  svg += `<line x1="${tbX - 30}" y1="${YM + 100}" x2="${tbX + 10}" y2="${YM + 100}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<6; i++) {
    let hx = (tbX - 25) + i*6;
    svg += `<line x1="${hx}" y1="${YM + 100}" x2="${hx - 8}" y2="${YM + 110}" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Table Box (Snug fit)
  svg += `<rect x="${tbX - 5}" y="${YM + 2}" width="95" height="15" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers on table (Bottom rollers, NO LABELS)
  // First one is slightly larger
  svg += rNrForno(tbX + 15, YM + 10, 10, '', tbX + 15, YM - 15);
  svg += rNrForno(tbX + 45, YM + 6, 6, '', tbX + 45, YM - 15);
  svg += rNrForno(tbX + 75, YM + 6, 6, '', tbX + 75, YM - 15);

  // 3. Group 2: 10 Rollers ALL BOTTOM, NO LABELS
  let bx = tbX + 105;
  for(let i=0; i<10; i++) {
    svg += rNrForno(bx, YM + 6, 6, '', bx, YM + 22);
    bx += 14; // Tight spacing
  }

  // MÁQUINA DE SOLDA 1 Text
  let sn1 = bx + 25;
  svg += `<text x="${sn1 + 30}" y="${YM - 70}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">MÁQUINA DE SOLDA 1</text>`;

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
  svg += rNrForno(r147, YM + 8, 8, '', r147, YM + 30);
  svg += rNrForno(r148, YM + 8, 8, '', r148, YM + 30);

  // 7. Pinch Rollers (149/150): BOTH EXACTLY SAME SIZE (r=8), NO LABELS
  let px = r148 + 55; // D4 (wider gap)
  svg += rNrForno(px, YM - 8, 8, '', px, YM - 25); // Top
  svg += rNrForno(px, YM + 8, 8, '', px, YM + 25); // Bottom

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
    svg += rNrForno(rx1, YM + 6, 6, '', rx1, YM);
    rx1 += 14;
  }

  // Pinch (156, 157)
  let px2 = rx1 + 10;
  svg += rNrForno(px2, YM - 8, 8, '', px2, YM); // Top
  svg += rNrForno(px2, YM + 8, 8, '', px2, YM); // Bottom

  // Hydraulic Table (158, 159)
  let tb2X = px2 + 20;
  
  // Cylinder Support & Floor
  let cylX1 = tb2X + 25;
  let cylY1 = YM + 27;
  let cylX2 = tb2X - 25;
  let cylY2 = YM + 90;
  
  svg += `<line x1="${cylX1}" y1="${cylY1}" x2="${cylX2}" y2="${cylY2}" stroke="#475569" stroke-width="12"/>`;
  svg += `<line x1="${cylX1 - 5}" y1="${cylY1 - 10}" x2="${cylX1}" y2="${cylY1}" stroke="#94a3b8" stroke-width="4"/>`;
  
  svg += `<line x1="${cylX2 - 20}" y1="${cylY2}" x2="${cylX2 + 20}" y2="${cylY2}" stroke="#475569" stroke-width="2"/>`;
  for(let i=0; i<5; i++) {
    let hx = (cylX2 - 15) + i*8;
    svg += `<line x1="${hx}" y1="${cylY2}" x2="${hx - 8}" y2="${cylY2 + 10}" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Table Box
  svg += `<rect x="${tb2X - 5}" y="${YM + 2}" width="60" height="25" fill="none" stroke="#22c55e" stroke-width="2"/>`;
  
  // Rollers 158 (large bottom), 159 (small bottom)
  svg += rNrForno(tb2X + 15, YM + 12, 12, '', tb2X + 15, YM); // 158
  svg += rNrForno(tb2X + 45, YM + 6, 6, '', tb2X + 45, YM); // 159

  // 4 Bottom Rollers (160-163)
  let rx2 = tb2X + 70;
  for(let i=0; i<4; i++) {
    svg += rNrForno(rx2, YM + 6, 6, '', rx2, YM);
    rx2 += 14;
  }

  // Top Block (Thickness gauge / Wiper)
  let wblockX = rx2 + 15;
  svg += `<rect x="${wblockX}" y="${YM - 12}" width="35" height="12" fill="none" stroke="#22c55e" stroke-width="2"/>`;

  // Large Deflector Pinch (164, 165)
  let dfX = wblockX + 50;
  svg += rNrForno(dfX, YM - 10, 10, '', dfX, YM); // 164 (Top)
  svg += rNrForno(dfX, YM + 25, 25, '', dfX, YM); // 165 (Bottom, very large)

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
  svg += rNrForno(r166X, YM + 15, 15, '', r166X, YM);

  // SECADOR
  let secX = tankStart + tankW + 30;
  
  // Text "SECADOR"
  svg += `<text x="${secX + 25}" y="${YM - 60}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // Pinch left (167, 169)
  svg += rNrForno(secX, YM - 8, 8, '', secX, YM); // 167 Top
  svg += rNrForno(secX, YM + 8, 8, '', secX, YM); // 169 Bottom
  
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
  svg += rNrForno(secRx, YM - 8, 8, '', secRx, YM); // 168 Top
  svg += rNrForno(secRx, YM + 8, 8, '', secRx, YM); // 170 Bottom

  // Roller 171 (Strip passes OVER it)
  let r171X = secRx + 40; // 2596
  svg += rNrForno(r171X, YM + 8, 8, '', r171X, YM + 22);

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

  // Grupo BS1 (Bridle de Entrada do Loop - Figure-8 S-Wrap)
  let r173x = 2860, r173y = 350, rL = 30; // Right large roller
  let r176x = 2770, r176y = 250; // Left large roller
  
  // Text BS1
  svg += `<text x="2815" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS1</text>`;

  svg += rNrForno(r176x, r176y, rL, '', r176x, r176y); // 176
  svg += rNrForno(r173x, r173y, rL, '', r173x, r173y); // 173
  
  // Pinches 174, 175
  svg += rNrForno(r173x + 40, r173y, 10, '', 0, 0); // 174: Perfectly pinching Right edge of 173 (3 o'clock position)
  svg += rNrForno(r176x - 28.3, r176y - 28.3, 10, '', 0, 0); // 175: Perfectly pinching Top-Left of 176

  // S-Wrap Path for BS1 (THE PERFECT FIGURE-8 BRIDLE)
  // 1. Arc perfectly around the bottom-right quadrant of Corretor 1, then smooth line to BS1
  stripPath += `A 25 25 0 0 0 ${corrX + 25} ${corrY} `;
  stripPath += `Q ${corrX + 25} ${corrY - 20} 2872.8 377.1 `;
  
  // 2. Arc around 173 (Right -> Top -> Top-Left)
  // Counter-Clockwise (sweep=0), Large Arc (large=1)
  stripPath += `A 30 30 0 1 0 2832.1 339.0 `; 
  
  // 3. Inner tangent diagonal line from 173 (Top-Left) to 176 (Bottom-Right)
  lineTo(2797.9, 261.0); 
  
  // 4. Arc around 176 (Bottom-Right -> Bottom -> Left -> Top)
  // Clockwise (sweep=1), Large Arc (large=1)
  stripPath += `A 30 30 0 1 1 2770 220 `;   
  
  // 177, 178 (Support rollers on the horizontal exit line)
  // Horizontal line is at Y = 220.
  // 177 was removed. Adding a new support roller BELOW the line per user drawing
  svg += rNrForno(2850, 230, 10, '', 0, 0); // New roll (Bottom)
  
  // 178 is BELOW the line, right after 173. Let's place at X = 2930
  svg += rNrForno(2930, 230, 10, '', 0, 0); // 178 (Bottom)

  // LOOP ENTRADA
  let txs = [3100, 3220, 3340]; // 179, 181, 183
  let bxs = [3160, 3280, 3400]; // 180, 182, 184
  let r185x = 3460;
  let TY = 250;
  let BY = 650;
  
  // Strip enters horizontally at TY - 30
  lineTo(txs[0], TY - 30); // Connect from BS1 horizontally to the first loop roller

  svg += `<text x="3280" y="150" font-family="Montserrat, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">LOOP ENTRADA</text>`;

  // Draw Pit lines
  svg += `<line x1="3050" y1="180" x2="3050" y2="720" stroke="#475569" stroke-width="4"/>`;
  svg += `<line x1="3050" y1="720" x2="3510" y2="720" stroke="#475569" stroke-width="4"/>`;
  svg += `<line x1="3510" y1="720" x2="3510" y2="180" stroke="#475569" stroke-width="4"/>`;

  for (let x of txs) {
    svg += rNrForno(x, TY, 30, '', x, TY);
  }
  for (let x of bxs) {
    svg += rNrForno(x, BY, 30, '', x, BY);
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
  svg += rNrForno(x186, 230, 8, '', x186, 230 - 15); // 186 (Under strip)
  
  let x187 = 3535;
  svg += rNrForno(x187, 210, 8, '', x187, 210 - 15); // 187 (Over strip)
  
  let x188 = 3535;
  svg += rNrForno(x188, 230, 8, '', x188, 230 - 15); // 188 (Under strip)
  
  let x189 = 3575;
  svg += rNrForno(x189, 230, 8, '', x189, 230 - 15); // 189 (Under strip)

  // BS2 Text
  svg += `<text x="3655" y="190" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">BS2</text>`;

  // Left Large Roller (192) - Lower position
  let r192x = 3610, r192y = 350;
  svg += rNrForno(r192x, r192y, 30, '', r192x, r192y);

  // Right Large Roller (191) - Higher position
  let r191x = 3700, r191y = 250;
  svg += rNrForno(r191x, r191y, 30, '', r191x, r191y);

  // Pinches 190, 193 (Perfectly positioned as per blueprint)
  svg += rNrForno(r191x - 17, 210, 8, '', 0, 0); // 190 (Top-Left of 191, pinching horizontal strip)
  svg += rNrForno(r192x - 28.3, r192y + 28.3, 8, '', 0, 0); // 193 (Bottom-Left of 192)

  // Removed old Roller 194 (at 3800) per user request (red X).
  // Adding two new support rolls. First is UNDER the sag curve, second is OVER the sag curve.
  svg += rNrForno(3680, 433, 8, '', 0, 0); // Under the strip
  svg += rNrForno(3730, 431, 8, '', 0, 0); // Over the strip
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
  svg += `<rect x="${fX}" y="${fY}" width="${fW}" height="${fH}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>`;
  svg += `<text x="${fX + fW/2}" y="${fY - 15}" font-family="Montserrat, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">FORNO DE RECOZIMENTO</text>`;
  
  // 5 Support Rolls (Rolo 0 outside, Rolo 1-4 inside)
  let rx0 = 3875;
  for (let i = 0; i < 5; i++) {
    let cx = rx0 + i * 150;
    let r = 26; 
    let cy = YM + r; 
    svg += rNrForno(cx, cy, r, '', 0, 0);
    svg += `<text x="${cx}" y="${cy + r + 20}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">Rolo ${i}</text>`;
  }

  lineTo(4550, YM);
  
  // ====================================================================
  // AR NEBLINA 1 (UND. RESF. ARNEBLINA 1)
  // Two rectangular boxes: one above strip, one below strip, roll at exit
  // ====================================================================
  let an1X = 4580, an1W = 140, an1H = 45;
  // Top box (above strip)
  svg += `<rect x="${an1X}" y="${YM - an1H - 5}" width="${an1W}" height="${an1H}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="2"/>`;
  // Bottom box (below strip)
  svg += `<rect x="${an1X}" y="${YM + 5}" width="${an1W}" height="${an1H}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="2"/>`;
  // Title
  svg += `<text x="${an1X + an1W/2}" y="${YM - an1H - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">AR NEBLINA 1</text>`;
  // Exit roll (202) - Strip goes OVER it
  svg += rNrForno(an1X + an1W + 10, YM + 8, 8, '', 0, 0);
  lineTo(an1X + an1W + 10 + 8, YM);

  // ====================================================================
  // AR NEBLINA 2 (UNID. RESF. ARNEBLINA 2)
  // Wider split boxes with large gap. Strip dips down inside.
  // Rolls 203, 204 support the dip. Roll 205 at exit.
  // Nozzle dots above and below the strip.
  // ====================================================================
  let an2X = 4790, an2W = 280, an2H = 50;
  // Top box
  svg += `<rect x="${an2X}" y="${YM - an2H - 10}" width="${an2W}" height="${an2H}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="2"/>`;
  // Bottom box
  svg += `<rect x="${an2X}" y="${YM + 25}" width="${an2W}" height="${an2H}" fill="#1e293b" stroke="#334155" stroke-width="2" rx="2"/>`;
  // Title
  svg += `<text x="${an2X + an2W/2}" y="${YM - an2H - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">AR NEBLINA 2</text>`;
  
  // Nozzles (Top row, following the dip curve)
  for (let i = 0; i < 7; i++) {
    let nx = an2X + 20 + i * 40;
    let ny = (i === 0 || i === 6) ? YM - 15 : YM - 5; 
    svg += `<circle cx="${nx}" cy="${ny}" r="2.5" fill="#94a3b8" />`;
  }
  // Nozzles (Bottom row)
  for (let i = 0; i < 7; i++) {
    let nx = an2X + 20 + i * 40;
    let ny = (i === 0 || i === 6) ? YM + 40 : YM + 50; 
    // Skip where rolls are (roughly i=1,2 and i=4,5)
    if (i !== 1 && i !== 5) {
      svg += `<circle cx="${nx}" cy="${ny}" r="2.5" fill="#94a3b8" />`;
    }
  }

  // 3 support rolls (203, 204 inside supporting the dip; 205 outside)
  let r203x = an2X + 70, r203y = YM + 25; // Strip at YM+15, so center is YM+15+10=25
  let r204x = an2X + 190, r204y = YM + 25;
  let r205x = an2X + an2W + 35, r205y = YM + 10; // Strip back at YM, center YM+10
  
  svg += rNrForno(r203x, r203y, 10, '203', r203x, r203y + 25);
  svg += rNrForno(r204x, r204y, 10, '204', r204x, r204y + 25);
  svg += rNrForno(r205x, r205y, 10, '205', r205x, r205y + 25);
  
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
  svg += `<path d="M ${dtX} ${dtTopY} L ${dtX + dtW} ${dtTopY} L ${dtX + dtW} ${dtBotY} L ${dtX + 60} ${dtBotY} Z" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
  // Title
  svg += `<text x="${dtX + dtW/2}" y="${dtTopY - 15}" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">DIP TANQUE</text>`;
  // Large submerged roll
  let dtRollX = dtX + dtW - 100, dtRollY = dtBotY - 45;
  svg += rNrForno(dtRollX, dtRollY, 28, '', 0, 0);
  // Two small exit rolls (stacked vertically at exit)
  let dtExitX = dtX + dtW - 30;
  svg += rNrForno(dtExitX, YM - 8, 8, '', 0, 0);
  svg += rNrForno(dtExitX, YM + 8, 8, '', 0, 0);
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
  // SECADOR 2 (Chevron arrow shape pointing left)
  // ====================================================================
  let sec2X = dtX + dtW + 30, sec2W = 140, sec2H = 70;
  let sec2CY = YM;
  
  // Chevron body
  svg += `<path d="M ${sec2X} ${sec2CY} L ${sec2X + 30} ${sec2CY - sec2H/2} L ${sec2X + sec2W} ${sec2CY - sec2H/2} L ${sec2X + sec2W} ${sec2CY + sec2H/2} L ${sec2X + 30} ${sec2CY + sec2H/2} Z" fill="#1e293b" stroke="#334155" stroke-width="2"/>`;
  
  // Internal chevron V-lines
  for (let v = 0; v < 4; v++) {
    let vx = sec2X + 50 + v * 22;
    svg += `<path d="M ${vx} ${sec2CY - sec2H/2 + 8} L ${vx - 12} ${sec2CY} L ${vx} ${sec2CY + sec2H/2 - 8}" fill="none" stroke="#475569" stroke-width="1.5"/>`;
  }
  
  // Title
  svg += `<text x="${sec2X + sec2W/2 + 15}" y="${sec2CY - sec2H/2 - 15}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SECADOR</text>`;
  
  // r1 = Exit roll (small green at secador exit)
  let sec2Rx = sec2X + sec2W + 20;
  svg += `<circle cx="${sec2Rx}" cy="${YM + 8}" r="8" fill="#10b981" stroke="#0f172a" stroke-width="2"/>`;

  lineTo(sec2Rx + 8, YM);
  
  // r2 = CORRETOR 3 (cross/quadrant pattern — as in sketch)
  svg += corretorCruz(5800, YM + 35, 35, '');
  svg += `<text x="5800" y="${YM + 90}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">CORRETOR 3</text>`;
  
  // Strip arrives at top of r2, small clockwise wrap
  lineTo(5800, YM);
  stripPath += `A 35 35 0 0 1 5820 ${YM + 6} `;

  // ---- BS 3 SECTION (Upper-right and Lower-left large rolls) ----
  
  // 1. bs3Top (Upper-Right Large Roll)
  let bs3TopX = 6060, bs3TopY = YM + 95, bs3R = 38;
  svg += dot(bs3TopX, bs3TopY, bs3R);
  // Pinch roll at ~2 o'clock
  svg += dot(bs3TopX + 32, bs3TopY - 32, 10);
  // Text to the right
  svg += `<text x="${bs3TopX + 55}" y="${bs3TopY - 25}" font-family="Montserrat, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="start">BS 3</text>`;

  // 2. bs3Bot (Lower-Left Large Roll)
  let bs3BotX = 5900, bs3BotY = YM + 180;
  svg += dot(bs3BotX, bs3BotY, bs3R);
  // Pinch roll at ~8 o'clock
  svg += dot(bs3BotX - 32, bs3BotY + 32, 10);

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
  svg += dot(medX, medY, medR);
  
  // Line from bs3Bot to med top-left (~10 o'clock) -> DOWN-RIGHT diagonal
  lineTo(medX - 15, medY - 13);
  // Wrap COUNTER-CLOCKWISE under med to bottom (6 o'clock)
  stripPath += `A ${medR} ${medR} 0 0 0 ${medX} ${medY + medR} `;

  // Three small green rolls at bottom with stands
  const YD = medY + medR + 8; // YM + 278
  for (let i = 0; i < 3; i++) {
    let rx = 6220 + i * 40;
    svg += dot(rx, YD, 8);
    svg += `<line x1="${rx}" y1="${YD + 8}" x2="${rx}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
    svg += `<line x1="${rx - 5}" y1="${YD + 22}" x2="${rx + 5}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
  }
  
  // Horizontal line over the rollers
  lineTo(6220 + 2 * 40 + 20, medY + medR);
  
  // Long gap, then 11 small rollers with stands
  for (let i = 0; i < 11; i++) {
    let rx = 6380 + i * 35;
    svg += dot(rx, YD, 8);
    svg += `<line x1="${rx}" y1="${YD + 8}" x2="${rx}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
    svg += `<line x1="${rx - 5}" y1="${YD + 22}" x2="${rx + 5}" y2="${YD + 22}" stroke="#475569" stroke-width="2"/>`;
  }
  
  // Line extending over the 11 small rollers to the bottom of the medium climb roller
  let climbMedX = 6840, climbMedY = YM + 245, climbMedR = 25; // 450 + 245 = 695
  lineTo(climbMedX, YM + 270); // YM + 270 = 720
  
  // Medium roll (bottom of the climb)
  svg += dot(climbMedX, climbMedY, climbMedR);
  // Wrap UNDER and up the right side (Counter-Clockwise)
  stripPath += `A ${climbMedR} ${climbMedR} 0 0 0 ${climbMedX + climbMedR} ${climbMedY} `;
  
  // Left pinch roll (touching vertical strip)
  svg += dot(climbMedX + climbMedR - 10, YM + 140, 10);
  
  // Large roll (top of the climb)
  let climbTopX = climbMedX + climbMedR + 40; // 6865 + 40 = 6905
  let climbTopY = YM + 40; // 450 + 40 = 490
  let climbTopR = 40;
  svg += dot(climbTopX, climbTopY, climbTopR);
  
  // Top pinch roll (touching top of large roll)
  svg += dot(climbTopX, YM - 12, 12);
  
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
  svg += `<rect x="6960" y="${YM - 60}" width="730" height="150" fill="none" stroke="#ffffff" stroke-width="2" rx="4"/>`;
  
  // Roll 0: Large 1 (Defletor Entrada)
  svg += `<rect x="6980" y="${YM + 45}" width="40" height="25" fill="#1e293b" rx="2"/>`;
  svg += `<rect x="6975" y="${YM + 40}" width="50" height="10" fill="#334155" rx="2"/>`;
  svg += dot(7000, YM + 30, 30);
  
  // 1. Top 1
  svg += dot(7055, YM - 15, 15);
  // 2. Bottom 1
  svg += dot(7110, YM + 12, 12);
  // 3. Top 2
  svg += dot(7165, YM - 15, 15);
  // 4. Bottom 2
  svg += dot(7220, YM + 12, 12);
  // 5. Top 3 (Roll you drew on the left!)
  svg += dot(7275, YM - 15, 15);
  
  // 6. Large 2 (Centragem)
  svg += `<rect x="7310" y="${YM + 45}" width="40" height="25" fill="#1e293b" rx="2"/>`;
  svg += `<rect x="7305" y="${YM + 40}" width="50" height="10" fill="#334155" rx="2"/>`;
  svg += dot(7330, YM + 30, 30);
  
  // 7. Top 4 (Roll you drew on the right!)
  svg += dot(7385, YM - 15, 15);
  // 8. Bottom 3
  svg += dot(7440, YM + 12, 12);
  // 9. Top 5
  svg += dot(7495, YM - 15, 15);
  // 10. Bottom 4
  svg += dot(7550, YM + 12, 12);
  // 11. Top 6
  svg += dot(7605, YM - 15, 15);
  
  // 12. Pinch rolls
  svg += dot(7660, YM - 10, 10);
  svg += dot(7660, YM + 10, 10);
  
  // Helper for Escovador
  const drawEscovador = (cx: number, cy: number, label: string) => {
    let s = `<rect x="${cx - 50}" y="${cy - 40}" width="100" height="80" fill="#1e293b" stroke="#475569" stroke-width="2" rx="6"/>`;
    s += `<rect x="${cx - 20}" y="${cy + 40}" width="40" height="40" fill="#0f172a" rx="2"/>`;
    s += `<text x="${cx}" y="${cy - 55}" font-family="Montserrat, sans-serif" font-size="14" font-weight="900" fill="#f97316" text-anchor="middle">${label}</text>`;
    
    const dotYellow = (x: number, y: number, r: number) => {
      let b = `<circle cx="${x}" cy="${y}" r="${r}" fill="#ca8a04" stroke="#facc15" stroke-width="2" filter="url(#yellowGlow)"/>`;
      b += `<circle cx="${x}" cy="${y}" r="${r*0.6}" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8" class="spin-fast" style="transform-origin: ${x}px ${y}px"/>`;
      return b;
    };

    s += dot(cx - 20, cy - 15, 12);       // Top-Left: Green
    s += dotYellow(cx - 20, cy + 15, 12); // Bottom-Left: Yellow (Brush)
    s += dotYellow(cx + 20, cy - 15, 12); // Top-Right: Yellow (Brush)
    s += dot(cx + 20, cy + 15, 12);       // Bottom-Right: Green
    return s;
  };

  const Y_quim = YM + 40; // 490

  // Escovador 1
  svg += drawEscovador(7750, YM, 'Escovador 1');
  lineTo(7800, YM);
  
  // To Espremedor 2 (Straight horizontal)
  lineTo(7840, YM);
  svg += dot(7860, YM - 10, 10);
  svg += dot(7860, YM + 10, 10);
  lineTo(7860, YM);
  
  // Tanque Químico Outline and Text
  svg += `<text x="8020" y="345" font-family="Montserrat, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">Tanque Quimico</text>`;
  svg += `<rect x="7880" y="360" width="280" height="130" fill="none" stroke="#ffffff" stroke-width="1.5" />`;

  // Tanque Químico (Mergulhadores sitting on the straight line)
  svg += dot(7950, YM - 30, 30);
  
  svg += dot(8090, YM - 30, 30);
  
  // Espremedor 3 (Straight horizontal)
  lineTo(8180, YM);
  svg += dot(8200, YM - 10, 10);
  svg += dot(8200, YM + 10, 10);
  lineTo(8200, YM);
  
  // Novo Rolo (entre Espremedor 3 e Escovador 2)
  svg += dot(8235, YM + 10, 10);
  
  // Straight to Escovador 2
  lineTo(8250, YM); // left edge of Escovador 2 is 8250
  
  // Escovador 2
  svg += drawEscovador(8300, YM, 'Escovador 2');
  lineTo(8350, YM);
  
  // Novo rolo no lugar do Espremedor 4
  svg += dot(8400, YM + 10, 10);
  
  // ====================================================================
  // SEÇÃO 7: SAÍDA E BOBINAMENTO
  // ====================================================================
  lineTo(8660, YM);
  
  // Corretor 4
  svg += corretorCruz(8750, YM, 35, 'CORRETOR 4');
  lineTo(8750, YM);
  
  // Zigue Zague pre-loop
  svg += dot(8850, YM-20, 8);
  svg += dot(8900, YM+20, 25);
  svg += dot(8960, YM-20, 8);
  svg += dot(9020, YM+30, 8);
  svg += dot(9080, YM-30, 30);
  lineTo(8850, YM-20); lineTo(8900, YM+20); lineTo(8960, YM-20); lineTo(9020, YM+30); lineTo(9080, YM-30);
  
  // Fosso Saída
  const LYT = 120;
  const LYB = 580;
  svg += `<line x1="9150" y1="${LYT}" x2="9150" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="9150" y1="${LYB+20}" x2="9550" y2="${LYB+20}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<line x1="9550" y1="${LYB+20}" x2="9550" y2="${LYT}" stroke="${BK}" stroke-width="2"/>`;
  svg += `<text x="9350" y="${LYT - 40}" text-anchor="middle" ${FSL} font-size="12" font-weight="800" fill="${BK}">LOOP DE SAÍDA</text>`;
  
  const oxs = [9200, 9300, 9400, 9500];
  const oys = [LYB, LYT, LYB, LYT];
  for (let i=0; i<4; i++) {
    if (i === 3) {
      svg += corretorCruz(oxs[i], oys[i], 35, 'CORRETOR 5');
    } else {
      svg += dot(oxs[i], oys[i], 25);
    }
    lineTo(oxs[i], oys[i]);
  }
  
  // Pós loop
  svg += dot(9620, YM, 8);
  // S-Roll Saida
  svg += dot(9720, YM+30, 35);
  svg += dot(9800, YM-30, 35);
  svg += dot(9880, YM, 8);
  lineTo(9620, YM); lineTo(9720, YM+30); lineTo(9800, YM-30); lineTo(9880, YM);
  
  for (let i=0; i<4; i++) {
    svg += dot(9930 + i*20, YM, 6);
  }
  lineTo(9990, YM);
  
  // Mesa Inspecao
  svg += mesaInspecao(10050, YM, 200);
  lineTo(10250, YM);
  
  for (let i=0; i<3; i++) {
    svg += dot(10300 + i*20, YM, 6);
  }
  lineTo(10340, YM);
  
  // Tesoura 3
  svg += tesoura3(10430, YM, 'TESOURA 3');
  lineTo(10430, YM);
  
  svg += dot(10510, YM-15, 15); svg += dot(10510, YM+15, 15);
  svg += dot(10580, YM, 8);
  lineTo(10510, YM); lineTo(10580, YM);
  
  // Bobinadeira Final
  svg += solidCoil(10700, YM + 20, 60, 'BOBINADEIRA (RECOILER)');
  lineTo(10700, YM + 20);

  // Apply the path (Forno Glowing Strip)
  svg += `<path d="${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>`;
  svg += `<path d="${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;

  // Draw background frame again to be on top if needed, or close svg
  svg += '</svg>';
  
  // Inject into DOM
  const el = document.getElementById('rb1CompletaDiagram');
  if (el) el.innerHTML = svg;

  // Legend
  const legend = document.getElementById('rb1CompletaLegend');
  if (legend) {
    legend.innerHTML = `
      <div class="legend-item">
        <div class="legend-icon"><svg width="24" height="14"><circle cx="7" cy="7" r="5" fill="#000"/></svg></div>
        <span>Rolo guia mecânico</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="16"><circle cx="14" cy="8" r="7" fill="#000"/><circle cx="14" cy="8" r="3.5" fill="url(#metalRoll)"/><circle cx="14" cy="8" r="1.5" fill="#000"/></svg></div>
        <span>Bobina / Mandril</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><rect x="4" y="1" width="12" height="12" fill="none" stroke="#000" stroke-width="1.5"/></svg></div>
        <span>Estrutura / Tesoura</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><path d="M 4 10 Q 14 -2 24 10" fill="none" stroke="#000" stroke-width="2"/></svg></div>
        <span>Calandra / Enrolador</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><polygon points="14,1 24,13 4,13" fill="none" stroke="#000" stroke-width="1.5"/></svg></div>
        <span>Secador / Forno Térmico</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon"><svg width="28" height="14"><circle cx="14" cy="7" r="6" fill="none" stroke="#000" stroke-width="1.5"/><path d="M 14 1 A 6 6 0 0 1 20 7 L 14 7 Z" fill="#000"/><path d="M 14 13 A 6 6 0 0 1 8 7 L 14 7 Z" fill="#000"/></svg></div>
        <span>Corretor de Alinhamento</span>
      </div>
    `;
  }
}

function renderAll(){
  renderStats();
  renderDecapagemStats();
  renderRb1CompletaStats();
  renderFurnace();
  renderDecapagem();
  renderDecapagemTable();
  renderRb1Completa();
  renderInventory();
  renderDecapagemInventory();
  renderHistory();
  renderMonthly();
  renderDecapagemMonthly();
}
window.addEventListener('dataLoaded', renderAll);
initDemo(); renderAll(); setInterval(renderAll,60000);


// FORCE VITE RELOAD
