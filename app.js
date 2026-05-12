/* RB1 Roll — Core Application Logic */
const KEYS = { R: 'rb1_rolos', E: 'rb1_estoque', H: 'rb1_historico' };
function load(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } }
function save(k, d) { localStorage.setItem(k, JSON.stringify(d)); }
let rolos = load(KEYS.R), estoque = load(KEYS.E), historico = load(KEYS.H);
function gid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function calcDays(d) { if (!d) return null; return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5)); }
function getStatus(d) { if (d === null) return 'empty'; if (d <= 5) return 'green'; if (d <= 10) return 'yellow'; return 'red'; }
function getRolo(p) { return rolos.find(r => String(r.posicao) === String(p)); }
function fmtDate(d) { return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }); }

// Clock
function tickClock() { document.getElementById('liveClock').textContent = new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
setInterval(tickClock, 1000); tickClock();

// Stats
function renderStats() {
    const al = rolos.filter(r => getStatus(calcDays(r.data_troca)) === 'red').length;
    const t30 = historico.filter(h => (Date.now() - new Date(h.data_troca).getTime()) < 30*864e5).length;
    document.getElementById('statsBar').innerHTML = [
        { icon: '🔄', val: rolos.length, lbl: 'Rolos Ativos', cls: 'si-active' },
        { icon: '📦', val: estoque.length, lbl: 'Em Estoque', cls: 'si-stock' },
        { icon: '⚠️', val: al, lbl: 'Em Alerta', cls: 'si-alert' },
        { icon: '📊', val: t30, lbl: 'Trocas (30d)', cls: 'si-swaps' }
    ].map(s => `<div class="stat-card"><div class="stat-icon ${s.cls}">${s.icon}</div><div class="stat-info"><span class="stat-value">${s.val}</span><span class="stat-label">${s.lbl}</span></div></div>`).join('');
}

// Furnace SVG Diagram
function renderFurnace() {
    const el = document.getElementById('furnaceDiagram');
    const rollData = [];
    for (let i = 0; i < 5; i++) {
        const r = getRolo(i); const days = r ? calcDays(r.data_troca) : null;
        rollData.push({ pos: i, days, status: getStatus(days), rolo: r });
    }
    // Professional furnace cross-section SVG
    const svgW = 900, svgH = 280;
    const rollY = 175, rollR = 22, rollSpacing = 130, rollStartX = 200;
    // Roll color map
    const cMap = { green: '#22c55e', yellow: '#eab308', red: '#ef4444', empty: '#555' };
    const bgMap = { green: 'rgba(34,197,94,.15)', yellow: 'rgba(234,179,8,.15)', red: 'rgba(239,68,68,.15)', empty: 'rgba(85,85,85,.1)' };

    let rollsSVG = '', overlays = '';
    rollData.forEach((rd, i) => {
        const cx = rollStartX + i * rollSpacing;
        const c = cMap[rd.status], bg = bgMap[rd.status];
        // Support pedestal
        rollsSVG += `<rect x="${cx-14}" y="${rollY+rollR-2}" width="28" height="30" rx="3" fill="#4a4a4a" stroke="#5a5a5a" stroke-width="1"/>`;
        rollsSVG += `<rect x="${cx-20}" y="${rollY+rollR+24}" width="40" height="10" rx="2" fill="#3a3a3a" stroke="#4a4a4a" stroke-width="1"/>`;
        // Roll body (outer ring)
        rollsSVG += `<circle cx="${cx}" cy="${rollY}" r="${rollR+4}" fill="none" stroke="${c}" stroke-width="1.5" opacity=".3" stroke-dasharray="4 3"><animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${rollY};360 ${cx} ${rollY}" dur="20s" repeatCount="indefinite"/></circle>`;
        // Roll main
        rollsSVG += `<circle cx="${cx}" cy="${rollY}" r="${rollR}" fill="${bg}" stroke="${c}" stroke-width="2.5"/>`;
        // Roll center detail
        rollsSVG += `<circle cx="${cx}" cy="${rollY}" r="6" fill="${c}" opacity=".3"/>`;
        rollsSVG += `<circle cx="${cx}" cy="${rollY}" r="3" fill="${c}" opacity=".6"/>`;
        // Roll number
        rollsSVG += `<text x="${cx}" y="${rollY+5}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14">${i}</text>`;
        // Label below
        rollsSVG += `<text x="${cx}" y="${rollY+rollR+50}" text-anchor="middle" fill="rgba(255,255,255,.5)" font-family="Inter,sans-serif" font-size="9" font-weight="600" letter-spacing="1">ROLO ${i}</text>`;
        rollsSVG += `<text x="${cx}" y="${rollY+rollR+62}" text-anchor="middle" fill="${c}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">${rd.days !== null ? rd.days+'d' : '—'}</text>`;
    });

    // Metal strip path across rolls
    let stripPath = `M 60 ${rollY}`;
    rollData.forEach((rd, i) => {
        const cx = rollStartX + i * rollSpacing;
        stripPath += ` L ${cx} ${rollY - rollR - 3}`;
        if (i < 4) { const mid = cx + rollSpacing / 2; stripPath += ` Q ${mid} ${rollY - rollR + 12} ${rollStartX + (i+1)*rollSpacing} ${rollY - rollR - 3}`; }
    });
    stripPath += ` L ${svgW - 40} ${rollY}`;

    const svg = `<div class="furnace-svg-wrap"><svg viewBox="0 0 ${svgW} ${svgH+50}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6a00" stop-opacity=".25"/><stop offset="50%" stop-color="#ff4500" stop-opacity=".08"/><stop offset="100%" stop-color="transparent"/></linearGradient>
            <linearGradient id="frameGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a4a52"/><stop offset="100%" stop-color="#2a2a30"/></linearGradient>
            <linearGradient id="brickGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B6914"/><stop offset="100%" stop-color="#6B4F10"/></linearGradient>
            <pattern id="brickPat" width="32" height="16" patternUnits="userSpaceOnUse">
                <rect width="32" height="16" fill="#6B4F10"/><rect x="0" y="0" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".5"/><rect x="16" y="0" width="15" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".5"/><rect x="8" y="8" width="15" height="7" rx="1" fill="#8B6914" stroke="#5a3e0a" stroke-width=".5"/><rect x="24" y="8" width="8" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".5"/><rect x="0" y="8" width="7" height="7" rx="1" fill="#7a5a12" stroke="#5a3e0a" stroke-width=".5"/>
            </pattern>
            <filter id="glow"><feGaussianBlur stdDeviation="8" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <!-- Outer steel frame -->
        <rect x="30" y="20" width="${svgW-60}" height="210" rx="8" fill="url(#frameGrad)" stroke="#5a5a62" stroke-width="2"/>
        <!-- Inner brick walls -->
        <rect x="45" y="30" width="${svgW-90}" height="28" rx="3" fill="url(#brickPat)"/>
        <rect x="45" y="195" width="${svgW-90}" height="25" rx="3" fill="url(#brickPat)"/>
        <rect x="45" y="30" width="18" height="190" rx="3" fill="url(#brickPat)"/>
        <rect x="${svgW-63}" y="30" width="18" height="190" rx="3" fill="url(#brickPat)"/>
        <!-- Heat glow interior -->
        <rect x="63" y="58" width="${svgW-126}" height="137" rx="4" fill="#1a0a00"/>
        <rect x="63" y="58" width="${svgW-126}" height="137" rx="4" fill="url(#heatGrad)" opacity=".9"/>
        <rect x="63" y="58" width="${svgW-126}" height="60" rx="4" fill="url(#heatGrad)" opacity=".5">
            <animate attributeName="opacity" values=".3;.6;.3" dur="3s" repeatCount="indefinite"/>
        </rect>
        <!-- Heat shimmer lines -->
        <line x1="100" y1="70" x2="100" y2="120" stroke="#ff6a00" stroke-width=".5" opacity=".15"><animate attributeName="opacity" values=".05;.2;.05" dur="2s" repeatCount="indefinite"/></line>
        <line x1="250" y1="75" x2="250" y2="115" stroke="#ff4500" stroke-width=".5" opacity=".1"><animate attributeName="opacity" values=".05;.18;.05" dur="2.5s" repeatCount="indefinite" begin=".5s"/></line>
        <line x1="450" y1="68" x2="450" y2="125" stroke="#ff6a00" stroke-width=".5" opacity=".12"><animate attributeName="opacity" values=".08;.22;.08" dur="1.8s" repeatCount="indefinite" begin="1s"/></line>
        <line x1="650" y1="72" x2="650" y2="118" stroke="#ff4500" stroke-width=".5" opacity=".1"><animate attributeName="opacity" values=".05;.2;.05" dur="2.2s" repeatCount="indefinite" begin=".3s"/></line>
        <!-- Entry mechanism (left) -->
        <circle cx="42" cy="${rollY}" r="18" fill="#3a3a40" stroke="#5a5a62" stroke-width="2"/>
        <circle cx="42" cy="${rollY}" r="5" fill="#5a5a62"/>
        <rect x="10" y="${rollY-6}" width="20" height="12" rx="2" fill="#3a3a40" stroke="#4a4a52" stroke-width="1"/>
        <rect x="0" y="${rollY+12}" width="50" height="20" rx="3" fill="#2a2a30" stroke="#4a4a52" stroke-width="1"/>
        <!-- Metal strip -->
        <path d="${stripPath}" fill="none" stroke="#c0c0c8" stroke-width="2.5" stroke-linecap="round" opacity=".7" filter="url(#glow)"/>
        <path d="${stripPath}" fill="none" stroke="#e8e8f0" stroke-width="1" stroke-linecap="round" opacity=".4"/>
        <!-- Rolls and supports -->
        ${rollsSVG}
        <!-- Labels -->
        <text x="42" y="${svgH+30}" text-anchor="middle" fill="rgba(255,255,255,.35)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">ENTRADA</text>
        <text x="${svgW-50}" y="${svgH+30}" text-anchor="middle" fill="rgba(255,255,255,.35)" font-family="Inter,sans-serif" font-size="9" font-weight="700" letter-spacing="2">SAÍDA</text>
    </svg></div>`;
    el.innerHTML = svg;

    // Roll detail cards
    const cards = document.getElementById('rollCards');
    cards.innerHTML = rollData.map(rd => {
        if (!rd.rolo) return `<div class="roll-card" style="opacity:.45"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span><span class="roll-card-dot" style="background:var(--border)"></span></div><div class="roll-card-row"><span>Status</span><span>Vazio</span></div></div>`;
        const df = new Date(rd.rolo.data_troca).toLocaleDateString('pt-BR');
        return `<div class="roll-card"><div class="roll-card-header"><span class="roll-card-pos">Rolo ${rd.pos}</span><span class="roll-card-dot dot-${rd.status}"></span></div><div class="roll-card-row"><span>Diâmetro</span><span>${rd.rolo.diametro} mm</span></div><div class="roll-card-row"><span>Idade</span><span>${rd.days}d</span></div><div class="roll-card-row"><span>Troca</span><span>${df}</span></div><div class="roll-card-row"><span>Turno</span><span class="turno-badge turno-${rd.rolo.turno}">${rd.rolo.turno}</span></div></div>`;
    }).join('');
}

// Inventory
function renderInventory() {
    const list = document.getElementById('inventoryList'), empty = document.getElementById('inventoryEmpty');
    if (!estoque.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    list.innerHTML = estoque.map(e => `<div class="inv-item"><div class="inv-item-info"><span class="inv-item-diam">⊘ ${e.diametro} mm</span><span class="inv-item-obs">${e.obs || 'Sem obs.'}</span></div><div class="inv-item-actions"><button onclick="removeEstoque('${e.id}')" title="Remover">✕</button></div></div>`).join('');
}
function removeEstoque(id) { estoque = estoque.filter(e => e.id !== id); save(KEYS.E, estoque); renderAll(); toast('Rolo removido do estoque', 'info'); }

// History
function renderHistory() {
    const body = document.getElementById('historyBody'), empty = document.getElementById('historyEmpty');
    const fp = document.getElementById('filterPosicao').value, ft = document.getElementById('filterTurno').value;
    let data = [...historico].sort((a, b) => new Date(b.data_troca) - new Date(a.data_troca));
    if (fp !== '') data = data.filter(h => String(h.posicao) === fp);
    if (ft) data = data.filter(h => h.turno === ft);
    if (!data.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    body.innerHTML = data.map(h => {
        const days = h.idade_dias != null ? h.idade_dias : calcDays(h.data_troca);
        const st = getStatus(days);
        return `<tr><td style="font-family:var(--mono);font-size:.72rem">${fmtDate(h.data_troca)}</td><td><strong>Rolo ${h.posicao}</strong></td><td><span class="turno-badge turno-${h.turno}">${h.turno}</span></td><td style="font-family:var(--mono)">${h.diametro} mm</td><td style="max-width:180px">${h.obs_motivo}</td><td><span class="age-badge age-${st}">${days}d</span></td><td><button class="btn-danger" onclick="removeHist('${h.id}')">✕</button></td></tr>`;
    }).join('');
}
function removeHist(id) { historico = historico.filter(h => h.id !== id); save(KEYS.H, historico); renderAll(); toast('Registro removido', 'info'); }

// Modals
const mO = document.getElementById('modalOverlay'), mE = document.getElementById('modalEstoqueOverlay');
const fS = document.getElementById('formSubstituicao'), fE = document.getElementById('formEstoque');

function openModal() {
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('inputData').value = now.toISOString().slice(0, 16);
    mO.classList.add('active');
}
function closeModal() { mO.classList.remove('active'); fS.reset(); document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); }
document.getElementById('btnNovaSubstituicao').addEventListener('click', openModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancelModal').addEventListener('click', closeModal);
mO.addEventListener('click', e => { if (e.target === mO) closeModal(); });

document.querySelectorAll('#motivoChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('#motivoChips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const m = chip.dataset.motivo, ta = document.getElementById('inputMotivo');
        if (m === 'Outro') { ta.value = ''; ta.focus(); } else ta.value = m;
    });
});

fS.addEventListener('submit', e => {
    e.preventDefault();
    const pos = document.getElementById('inputPosicao').value, turno = document.getElementById('inputTurno').value;
    const diam = parseFloat(document.getElementById('inputDiametro').value), dt = document.getElementById('inputData').value;
    const mot = document.getElementById('inputMotivo').value.trim();
    if (!pos || !turno || !diam || !dt || !mot) { toast('Preencha todos os campos!', 'error'); return; }
    const old = getRolo(pos);
    if (old) historico.push({ ...old, idade_dias: calcDays(old.data_troca), id: gid() });
    rolos = rolos.filter(r => String(r.posicao) !== String(pos));
    rolos.push({ id: gid(), posicao: parseInt(pos), data_troca: dt, turno, diametro: diam, obs_motivo: mot });
    save(KEYS.R, rolos); save(KEYS.H, historico);
    closeModal(); renderAll(); toast(`Rolo ${pos} substituído com sucesso!`, 'success');
});

// Estoque modal
document.getElementById('btnAddEstoque').addEventListener('click', () => mE.classList.add('active'));
document.getElementById('modalEstoqueClose').addEventListener('click', () => { mE.classList.remove('active'); fE.reset(); });
document.getElementById('btnCancelEstoque').addEventListener('click', () => { mE.classList.remove('active'); fE.reset(); });
mE.addEventListener('click', e => { if (e.target === mE) { mE.classList.remove('active'); fE.reset(); } });
fE.addEventListener('submit', e => {
    e.preventDefault();
    const d = parseFloat(document.getElementById('inputEstoqueDiametro').value), obs = document.getElementById('inputEstoqueObs').value.trim();
    if (!d) { toast('Informe o diâmetro!', 'error'); return; }
    estoque.push({ id: gid(), diametro: d, obs, data_entrada: new Date().toISOString() });
    save(KEYS.E, estoque); mE.classList.remove('active'); fE.reset(); renderAll(); toast('Rolo adicionado ao estoque!', 'success');
});

// Filters
document.getElementById('filterPosicao').addEventListener('change', renderHistory);
document.getElementById('filterTurno').addEventListener('change', renderHistory);

// Export dropdown
const expBtn = document.getElementById('btnExportMenu'), expDrop = document.getElementById('exportDropdown');
expBtn.addEventListener('click', e => { e.stopPropagation(); expDrop.classList.toggle('open'); });
document.addEventListener('click', () => expDrop.classList.remove('open'));

// Toast
function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer'), t = document.createElement('div');
    t.className = `toast ${type}`; t.innerHTML = `${{ success:'✓', error:'✕', info:'ℹ' }[type]||'ℹ'} ${msg}`;
    c.appendChild(t); setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3500);
}

// Render all
function renderAll() { renderStats(); renderFurnace(); renderInventory(); renderHistory(); }

// Demo data
function initDemo() {
    if (rolos.length || historico.length) return;
    const n = Date.now(), d = 864e5;
    rolos = [
        { id: gid(), posicao: 0, data_troca: new Date(n - 2*d).toISOString(), turno: 'TM', diametro: 320.5, obs_motivo: 'Preventiva — troca programada' },
        { id: gid(), posicao: 1, data_troca: new Date(n - 7*d).toISOString(), turno: 'TN', diametro: 315.0, obs_motivo: 'Desgaste detectado na inspeção' },
        { id: gid(), posicao: 2, data_troca: new Date(n - 12*d).toISOString(), turno: 'TT', diametro: 310.2, obs_motivo: 'Marca na chapa — substituição urgente' },
        { id: gid(), posicao: 3, data_troca: new Date(n - 4*d).toISOString(), turno: 'TM', diametro: 322.0, obs_motivo: 'Preventiva' },
        { id: gid(), posicao: 4, data_troca: new Date(n - 9*d).toISOString(), turno: 'TN', diametro: 318.7, obs_motivo: 'Desgaste acumulado' }
    ];
    estoque = [
        { id: gid(), diametro: 325.0, obs: 'Novo — lote 2026-A', data_entrada: new Date().toISOString() },
        { id: gid(), diametro: 320.0, obs: 'Retificado', data_entrada: new Date().toISOString() },
        { id: gid(), diametro: 318.5, obs: 'Novo', data_entrada: new Date().toISOString() }
    ];
    historico = [
        { id: gid(), posicao: 0, data_troca: new Date(n - 20*d).toISOString(), turno: 'TN', diametro: 319.0, obs_motivo: 'Quebra — trinca superficial', idade_dias: 18 },
        { id: gid(), posicao: 2, data_troca: new Date(n - 25*d).toISOString(), turno: 'TT', diametro: 312.5, obs_motivo: 'Desgaste excessivo', idade_dias: 13 },
        { id: gid(), posicao: 1, data_troca: new Date(n - 15*d).toISOString(), turno: 'TM', diametro: 316.0, obs_motivo: 'Marca na chapa', idade_dias: 8 }
    ];
    save(KEYS.R, rolos); save(KEYS.E, estoque); save(KEYS.H, historico);
}
initDemo(); renderAll(); setInterval(renderAll, 60000);
