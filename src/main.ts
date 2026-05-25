/** RB1 Roll v3 — Main Application (Clean, No Exports) */
import './style.css';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate, sanitize,
  registrarSubstituicao, editarHistorico, adicionarEstoque, removerEstoque, initDemo } from './store';
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
  let s = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background-color:#13161c;">`;
  
  s += `<defs>
    <pattern id="verticalTexture" width="6" height="500" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="500" stroke="rgba(255,255,255,0.015)" stroke-width="1.5" />
    </pattern>
  </defs>`;
  
  s += `<rect width="1700" height="500" fill="#13161c" />`;
  s += `<rect width="1700" height="500" fill="url(#verticalTexture)" />`;
  
  function baseBlock(x: number, y: number) {
    let b = '';
    b += `<rect x="${x - 18}" y="${y}" width="36" height="8" rx="2" fill="#3a3d46" />`;
    b += `<rect x="${x - 24}" y="${y + 8}" width="48" height="14" rx="2" fill="#2c2e35" />`;
    b += `<rect x="${x - 30}" y="${y + 22}" width="60" height="10" rx="2" fill="#1e2025" />`;
    return b;
  }
  
  function largeCylinder(x: number, y: number) {
    let c = '';
    c += baseBlock(x, y + 28);
    c += `<circle cx="${x}" cy="${y}" r="28" fill="#161a22" stroke="#e2e8f0" stroke-width="1.5" />`;
    c += `<circle cx="${x}" cy="${y}" r="3" fill="#e2e8f0" opacity="0.3" />`;
    return c;
  }
  
  function smallRoll(x: number, y: number) {
    return `<circle cx="${x}" cy="${y}" r="10" fill="#13161c" stroke="#e2e8f0" stroke-width="1.5" />`;
  }
  
  function pinchRolls(x: number, y: number) {
    let p = '';
    p += `<circle cx="${x}" cy="${y - 10}" r="10" fill="#13161c" stroke="#e2e8f0" stroke-width="1.5" />`;
    p += `<circle cx="${x}" cy="${y + 10}" r="10" fill="#13161c" stroke="#e2e8f0" stroke-width="1.5" />`;
    return p;
  }
  
  function brushStation(x: number, y: number) {
    let b = '';
    b += baseBlock(x, y + 28);
    b += `<rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="4" fill="#161a22" stroke="#6b7280" stroke-width="1.5" />`;
    b += `<circle cx="${x - 13}" cy="${y - 13}" r="9" fill="#161a22" stroke="#e2e8f0" stroke-width="1.5" />`;
    b += `<circle cx="${x + 13}" cy="${y - 13}" r="9" fill="#161a22" stroke="#eab308" stroke-width="1.5" />`;
    b += `<circle cx="${x - 13}" cy="${y + 13}" r="9" fill="#161a22" stroke="#eab308" stroke-width="1.5" />`;
    b += `<circle cx="${x + 13}" cy="${y + 13}" r="9" fill="#161a22" stroke="#e2e8f0" stroke-width="1.5" />`;
    return b;
  }

  let behind = '';
  let front = '';
  
  behind += largeCylinder(140, 320);
  
  front += smallRoll(220, 282);
  front += smallRoll(270, 302);
  front += smallRoll(320, 282);
  front += smallRoll(370, 302);
  front += smallRoll(420, 282);
  
  behind += largeCylinder(540, 320);
  
  front += smallRoll(660, 282);
  front += smallRoll(710, 302);
  front += smallRoll(760, 282);
  front += smallRoll(810, 302);
  front += smallRoll(860, 282);
  
  front += pinchRolls(910, 267);
  behind += brushStation(960, 267);
  front += pinchRolls(1010, 267);
  
  // Lower pinch roll pair on a pedestal for first brush station
  behind += baseBlock(1060, 312);
  front += pinchRolls(1060, 292);
  
  behind += largeCylinder(1150, 320);
  behind += largeCylinder(1290, 320);
  
  front += pinchRolls(1390, 267);
  behind += brushStation(1440, 267);
  front += pinchRolls(1490, 267);
  
  // Lower pinch roll pair on a pedestal for second brush station
  behind += baseBlock(1540, 312);
  front += pinchRolls(1540, 292);
  
  let pathStr = `M 30 330 L 140 292 L 880 292 L 900 267 L 1025 267 L 1045 292 L 1365 292 L 1380 267 L 1505 267 L 1525 292 L 1560 292 L 1670 330`;
  let processLine = `<path d="${pathStr}" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  
  s += behind;
  s += processLine;
  s += front;
  
  s += `<rect x="180" y="200" width="812" height="180" rx="10" fill="none" stroke="#e27b38" stroke-width="2" />`;
  s += `<text x="586" y="192" text-anchor="middle" fill="#e27b38" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2">DECAPAGEM ELETROLÍTICA</text>`;
  
  s += `<rect x="1095" y="200" width="250" height="180" rx="10" fill="none" stroke="#6b7280" stroke-width="1.5" />`;
  s += `<text x="1220" y="192" text-anchor="middle" fill="#9ca3af" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2">DECAPAGEM QUÍMICA</text>`;
  
  s += `<text x="80" y="250" text-anchor="middle" fill="#9ca3af" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2">ENTRADA</text>`;
  s += `<text x="1620" y="250" text-anchor="middle" fill="#9ca3af" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2">SAÍDA</text>`;
  
  s += `</svg>`;
  $('decapagemDiagram').innerHTML = s;
}

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

function renderAll(){renderStats();renderFurnace();renderDecapagem();renderInventory();renderHistory();renderMonthly();}
window.addEventListener('dataLoaded', renderAll);
initDemo(); renderAll(); setInterval(renderAll,60000);
