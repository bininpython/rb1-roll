/** RB1 Roll v3 — Main Application (Clean, No Exports) */
import './style.css';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate, sanitize,
  registrarSubstituicao, editarHistorico, adicionarEstoque, removerEstoque, initDemo, DECAPAGEM_MAP } from './store';
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
$('tabForno').addEventListener('click', () => {
  $('tabForno').classList.add('active');
  $('tabDecapagem').classList.remove('active');
  $('viewForno').classList.remove('view-hidden');
  $('viewForno').classList.add('view-active');
  $('viewDecapagem').classList.remove('view-active');
  $('viewDecapagem').classList.add('view-hidden');
});
$('tabDecapagem').addEventListener('click', () => {
  $('tabDecapagem').classList.add('active');
  $('tabForno').classList.remove('active');
  $('viewDecapagem').classList.remove('view-hidden');
  $('viewDecapagem').classList.add('view-active');
  $('viewForno').classList.remove('view-active');
  $('viewForno').classList.add('view-hidden');
});

// Stats
function renderStats() {
  const alertas = rolos.filter(r => getStatus(calcDays(r.data_troca)) === 'red').length;
  const trocas30 = historico.filter(h => (Date.now() - new Date(h.created_at).getTime()) < 30*864e5).length;
  
  const estRetifica = estoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica')).length;
  const estRb1 = estoque.length - estRetifica;

  $('statsBar').innerHTML = [
    {i:'🛠️',v:estRetifica,l:'Estoque Retífica',c:'si-stock'},
    {i:'📦',v:estRb1,l:'Estoque RB1',c:'si-stock'},
    {i:'⚠️',v:alertas,l:'Em Alerta',c:'si-alert'},
    {i:'📊',v:trocas30,l:'Trocas (30d)',c:'si-swaps'}
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s.c}">${s.i}</div><div><span class="stat-value">${s.v}</span><span class="stat-label">${s.l}</span></div></div>`).join('');
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
    s+=`<text x="${cx}" y="${ly}" text-anchor="middle" fill="rgba(255,255,255,.45)" font-family="Inter,sans-serif" font-size="9" font-weight="600" letter-spacing="1">ROLO ${idx}</text>`;
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
  s += `<text x="540" y="190" text-anchor="middle" fill="#ff7a30" font-family="'Inter', sans-serif" font-size="24" font-weight="700" letter-spacing="0.5">Eletrolítico</text>`;
  s += `<text x="1230" y="190" text-anchor="middle" fill="#f8fafc" font-family="'Inter', sans-serif" font-size="24" font-weight="700" letter-spacing="0.5">Quimico</text>`;
  
  // 10. Boundary Texts
  s += `<text x="70" y="280" text-anchor="middle" fill="#6b7280" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="3">ENTRADA</text>`;
  s += `<text x="1640" y="280" text-anchor="middle" fill="#6b7280" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="3">SAÍDA</text>`;
  
  // 11. Custom Technical Labels overlay exactly as in annotated blueprint
  s += `<g font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="0.5" pointer-events="none">`;
  
  // First Wave
  s += `<text x="220" y="322">Deflector</text>`;
  s += `<text x="280" y="385">Fundo Tanque</text>`;
  s += `<text x="340" y="322">Mergulhador ELE</text>`;
  s += `<text x="400" y="385">Fundo tanque</text>`;
  s += `<text x="460" y="322">Deflector</text>`;
  
  // Large Center
  s += `<text x="540" y="308">Centragem</text>`;
  
  // Second Wave
  s += `<text x="640" y="322">Deflector</text>`;
  s += `<text x="700" y="385">Fundo tanque</text>`;
  s += `<text x="760" y="322">Mergulhador ELE</text>`;
  s += `<text x="820" y="385">Fundo tanque</text>`;
  s += `<text x="880" y="322">Deflector</text>`;
  
  // Station 1 Block
  s += `<text x="925" y="365" font-size="8">Espremedor</text>`;
  s += `<text x="980" y="278" fill="#ff7a30" font-size="9">Escovador 1</text>`;
  s += `<text x="1035" y="365" font-size="8">Espremedor</text>`;
  
  // Chemical Cylinders
  s += `<text x="1140" y="308">Mergulhador QUIM</text>`;
  s += `<text x="1320" y="308">Mergulhador QUIM</text>`;
  
  // Station 2 Block
  s += `<text x="1465" y="365" font-size="8">Espremedor</text>`;
  s += `<text x="1520" y="278" fill="#f8fafc" font-size="9">Escovador 2</text>`;
  s += `<text x="1605" y="372" font-size="8">Espremedor</text>`;
  
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
  
  const rowsHtml = Object.entries(DECAPAGEM_MAP).map(([pStr, meta]) => {
    const p = parseInt(pStr);
    const rolo = getRolo(p);
    if (!rolo) return '';
    
    const days = calcDays(rolo.data_troca);
    const st = getStatus(days);
    const formattedDate = fmtDate(rolo.data_troca);
    
    const typeBadge = meta.tipo === 'Escova' 
      ? `<span class="turno-badge" style="background-color:#78350f;color:#fef08a;border:1px solid #eab308;padding:2px 6px;">🧹 Escova</span>`
      : `<span class="turno-badge" style="background-color:#1e293b;color:#f8fafc;border:1px solid #475569;padding:2px 6px;">⚙️ Rolo</span>`;
      
    return `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--text);font-size:0.85rem;">Pos. ${p}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:500;">${meta.nome}</div>
        </td>
        <td>${typeBadge}</td>
        <td style="font-family:var(--mono);font-weight:600;font-size:0.82rem;">${rolo.diametro} mm</td>
        <td style="font-family:var(--mono);color:var(--text-secondary);font-size:0.82rem;">${meta.perimetro} mm</td>
        <td style="font-family:var(--mono);font-size:0.72rem;color:var(--text-secondary);">${formattedDate}</td>
        <td><span class="turno-badge turno-${rolo.turno}">${rolo.turno}</span></td>
        <td><span class="age-badge age-${st}">${days}d</span></td>
        <td style="font-size:0.75rem;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted);" title="${sanitize(rolo.obs_motivo)}">${sanitize(rolo.obs_motivo) || '—'}</td>
        <td>
          <button class="btn-edit" style="color:var(--accent);border-color:var(--accent);font-weight:600;font-size:0.7rem;padding:0.25rem 0.5rem;" onclick="window.openSubModalForDecapagem(${p})">
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
  // Trigger diameter sync based on selected position
  const estSelect = $('inEstoqueRolo') as HTMLSelectElement;
  estSelect.value = '';
  ($('inDiam') as HTMLInputElement).value = '';
};

// Inventory
let currentInvView: 'retifica' | 'rb1' = 'retifica';
function renderInventory() {
  const list=$('inventoryList'), empty=$('inventoryEmpty');
  const estRetifica = estoque.filter(e => e.obs.toLowerCase().includes('retifica') || e.obs.toLowerCase().includes('retífica'));
  const estRb1 = estoque.filter(e => !e.obs.toLowerCase().includes('retifica') && !e.obs.toLowerCase().includes('retífica'));
  
  $('countRetifica').textContent = estRetifica.length.toString();
  $('countRb1').textContent = estRb1.length.toString();

  const currentList = currentInvView === 'retifica' ? estRetifica : estRb1;

  if(!currentList.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=currentList.map(e=>`<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${sanitize(e.obs)||'Sem obs.'}</span></div><div class="inv-item-actions"><button data-remove-est="${e.id}" title="Remover">✕</button></div></div>`).join('');
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
    return `<tr><td style="font-family:var(--mono);font-size:.7rem">${fmtDate(h.data_troca)}</td><td><strong>Rolo ${h.posicao}</strong></td><td><span class="turno-badge turno-${h.turno}">${h.turno}</span></td><td style="font-family:var(--mono)">${h.diametro} mm</td><td style="max-width:180px">${sanitize(h.obs_motivo)}</td><td><span class="age-badge age-${st}">${h.idade_dias}d</span></td><td><button class="btn-edit" data-edit="${h.id}">✏️</button></td></tr>`;
  }).join('');
  body.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(btn=>{
    btn.addEventListener('click',()=>openEditModal(btn.dataset.edit!));
  });
}

// Modal: Substituição
function populateEstoqueSelect(){
  const sel=$('inEstoqueRolo') as HTMLSelectElement;
  sel.innerHTML='<option value="">Selecione um rolo do estoque...</option>';
  estoque.forEach(e=>{sel.innerHTML+=`<option value="${e.id}">⊘ ${e.diametro} mm — ${sanitize(e.obs)||'Sem obs.'}</option>`;});
}
function openSubModal(){
  const now=new Date(); now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  ($('inData') as HTMLInputElement).value=now.toISOString().slice(0,16);
  populateEstoqueSelect(); $('modalSub').classList.add('active');
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
  if(isNaN(pos)||!turno||!estId||!dt||!mot){toast('Preencha todos os campos!','error');return;}
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
$('modalEstClose').addEventListener('click',()=>{$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();});
$('btnCancelEst').addEventListener('click',()=>{$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();});
$('modalEst').addEventListener('click',e=>{if(e.target===$('modalEst')){$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();}});
($('formEst') as HTMLFormElement).addEventListener('submit',e=>{
  e.preventDefault();
  const d=parseFloat(($('inEstDiam') as HTMLInputElement).value);
  const obs=($('inEstObs') as HTMLInputElement).value.trim();
  if(!d){toast('Informe o diâmetro!','error');return;}
  try{adicionarEstoque(d,obs);$('modalEst').classList.remove('active');($('formEst') as HTMLFormElement).reset();renderAll();toast('Rolo adicionado!','success');}catch(err:any){toast(err.message,'error');}
});

// Modal: Edit History
function openEditModal(id:string){
  const rec=historico.find(h=>h.id===id); if(!rec) return;
  ($('editId') as HTMLInputElement).value=rec.id;
  ($('editPos') as HTMLInputElement).value=`Rolo ${rec.posicao}`;
  ($('editTurno') as HTMLSelectElement).value=rec.turno;
  ($('editDiam') as HTMLInputElement).value=String(rec.diametro);
  const dt=new Date(rec.data_troca);dt.setMinutes(dt.getMinutes()-dt.getTimezoneOffset());
  ($('editData') as HTMLInputElement).value=dt.toISOString().slice(0,16);
  ($('editMotivo') as HTMLTextAreaElement).value=rec.obs_motivo;
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
  if(!mot){toast('Motivo obrigatório!','error');return;}
  try{editarHistorico(id,turno,dt,mot);closeEditModal();renderAll();toast('Registro atualizado!','success');}catch(err:any){toast(err.message,'error');}
});

// Filters
$('filterPos').addEventListener('change',renderHistory);
$('filterTurno').addEventListener('change',renderHistory);

// Monthly Tab
const MN=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MF=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let selYear=new Date().getFullYear(), selMonth=new Date().getMonth();

function renderMonthly(){
  $('yearLabel').textContent=String(selYear);
  $('monthTabs').innerHTML=MN.map((m,i)=>{
    const cnt=historico.filter(h=>{const d=new Date(h.data_troca);return d.getFullYear()===selYear&&d.getMonth()===i;}).length;
    return `<button class="month-tab ${i===selMonth?'active':''} ${cnt>0?'has-data':''}" data-month="${i}"><span class="month-tab-name">${m}</span>${cnt>0?`<span class="month-tab-count">${cnt}</span>`:''}</button>`;
  }).join('');
  $('monthTabs').querySelectorAll<HTMLButtonElement>('.month-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{selMonth=parseInt(btn.dataset.month!);renderMonthly();});
  });
  // Content
  const body=$('monthBody') as HTMLTableSectionElement, empty=$('monthEmpty'), summary=$('monthSummary');
  const data=historico.filter(h=>{const d=new Date(h.data_troca);return d.getFullYear()===selYear&&d.getMonth()===selMonth;}).sort((a,b)=>new Date(b.data_troca).getTime()-new Date(a.data_troca).getTime());
  if(!data.length){body.innerHTML='';empty.style.display='block';summary.innerHTML='';return;}
  empty.style.display='none';
  body.innerHTML=data.map(h=>{const st=getStatus(h.idade_dias);return `<tr><td style="font-family:var(--mono);font-size:.7rem">${fmtDate(h.data_troca)}</td><td><strong>Rolo ${h.posicao}</strong></td><td><span class="turno-badge turno-${h.turno}">${h.turno}</span></td><td style="font-family:var(--mono)">${h.diametro} mm</td><td>${sanitize(h.obs_motivo)}</td><td><span class="age-badge age-${st}">${h.idade_dias}d</span></td></tr>`;}).join('');
  const byPos:Record<number,number>={};data.forEach(h=>{byPos[h.posicao]=(byPos[h.posicao]||0)+1;});
  const avg=data.length?Math.round(data.reduce((s,h)=>s+h.idade_dias,0)/data.length):0;
  summary.innerHTML=`<div class="summary-row"><div class="summary-card"><span class="summary-val">${data.length}</span><span class="summary-lbl">Trocas em ${MF[selMonth]}</span></div><div class="summary-card"><span class="summary-val">${avg}d</span><span class="summary-lbl">Tempo Médio</span></div>${Object.entries(byPos).map(([p,c])=>`<div class="summary-card"><span class="summary-val">${c}</span><span class="summary-lbl">Rolo ${p}</span></div>`).join('')}</div>`;
}
$('prevYear').addEventListener('click',()=>{selYear--;renderMonthly();});
$('nextYear').addEventListener('click',()=>{selYear++;renderMonthly();});

function renderAll(){renderStats();renderFurnace();renderDecapagem();renderDecapagemTable();renderInventory();renderHistory();renderMonthly();}
window.addEventListener('dataLoaded', renderAll);
initDemo(); renderAll(); setInterval(renderAll,60000);
