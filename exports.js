/* RB1 Roll — Export Functions (PDF + Excel) */

function getExportData() {
    const allRolos = [];
    for (let i = 0; i < 5; i++) {
        const r = getRolo(i);
        const days = r ? calcDays(r.data_troca) : null;
        const st = getStatus(days);
        allRolos.push({
            posicao: `Rolo ${i}`, status: st === 'green' ? '🟢 Normal' : st === 'yellow' ? '🟡 Atenção' : st === 'red' ? '🔴 Crítico' : '⚪ Vazio',
            diametro: r ? `${r.diametro} mm` : '—', idade: days !== null ? `${days} dias` : '—',
            turno: r ? r.turno : '—', motivo: r ? r.obs_motivo : '—',
            data_troca: r ? fmtDate(r.data_troca) : '—'
        });
    }
    const histData = [...historico].sort((a, b) => new Date(b.data_troca) - new Date(a.data_troca)).map(h => ({
        data: fmtDate(h.data_troca), posicao: `Rolo ${h.posicao}`, turno: h.turno,
        diametro: `${h.diametro} mm`, motivo: h.obs_motivo,
        idade: `${h.idade_dias != null ? h.idade_dias : calcDays(h.data_troca)} dias`
    }));
    const estoqueData = estoque.map(e => ({
        diametro: `${e.diametro} mm`, obs: e.obs || '—',
        entrada: fmtDate(e.data_entrada)
    }));
    return { allRolos, histData, estoqueData };
}

function exportPDF(tipo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const now = new Date().toLocaleString('pt-BR');
    const data = getExportData();
    const pageW = doc.internal.pageSize.getWidth();

    // Header helper
    function addHeader(title) {
        doc.setFillColor(15, 15, 25);
        doc.rect(0, 0, pageW, 25, 'F');
        doc.setFontSize(16);
        doc.setTextColor(249, 115, 22);
        doc.text('RB1 Roll', 14, 12);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 170);
        doc.text('Linha de Recozimento · Aperam', 14, 18);
        doc.setFontSize(12);
        doc.setTextColor(240, 240, 245);
        doc.text(title, pageW / 2, 12, { align: 'center' });
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 150);
        doc.text(`Gerado em: ${now}`, pageW - 14, 12, { align: 'right' });
        doc.setDrawColor(42, 42, 66);
        doc.line(0, 25, pageW, 25);
    }

    if (tipo === 'completo' || tipo === 'kanban') {
        addHeader(tipo === 'completo' ? 'Relatório Completo' : 'Relatório Kanban');

        // Kanban table
        doc.setFontSize(11);
        doc.setTextColor(240, 240, 245);
        doc.text('Status Kanban dos Rolos', 14, 35);

        doc.autoTable({
            startY: 40,
            head: [['Posição', 'Status', 'Diâmetro', 'Idade', 'Turno', 'Motivo da Troca', 'Data Troca']],
            body: data.allRolos.map(r => [r.posicao, r.status, r.diametro, r.idade, r.turno, r.motivo, r.data_troca]),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, textColor: [200, 200, 220], fillColor: [20, 20, 35], lineColor: [42, 42, 66], lineWidth: 0.3 },
            headStyles: { fillColor: [30, 30, 50], textColor: [249, 115, 22], fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [25, 25, 40] },
            margin: { left: 14, right: 14 }
        });

        // Estoque table
        if (tipo === 'completo' && data.estoqueData.length) {
            const y = doc.lastAutoTable.finalY + 12;
            doc.setFontSize(11);
            doc.setTextColor(240, 240, 245);
            doc.text('Estoque de Rolos', 14, y);

            doc.autoTable({
                startY: y + 5,
                head: [['Diâmetro', 'Observação', 'Data de Entrada']],
                body: data.estoqueData.map(e => [e.diametro, e.obs, e.entrada]),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3, textColor: [200, 200, 220], fillColor: [20, 20, 35], lineColor: [42, 42, 66], lineWidth: 0.3 },
                headStyles: { fillColor: [30, 30, 50], textColor: [129, 140, 248], fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: [25, 25, 40] },
                margin: { left: 14, right: 14 }
            });
        }
    }

    if (tipo === 'completo' || tipo === 'trocas') {
        if (tipo === 'completo') doc.addPage('landscape');
        if (tipo === 'trocas') addHeader('Relatório de Trocas');
        else {
            addHeader('Histórico de Substituições');
        }

        if (data.histData.length) {
            doc.autoTable({
                startY: 35,
                head: [['Data/Hora', 'Posição', 'Turno', 'Diâmetro', 'Motivo da Troca', 'Idade no Forno']],
                body: data.histData.map(h => [h.data, h.posicao, h.turno, h.diametro, h.motivo, h.idade]),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3, textColor: [200, 200, 220], fillColor: [20, 20, 35], lineColor: [42, 42, 66], lineWidth: 0.3 },
                headStyles: { fillColor: [30, 30, 50], textColor: [249, 115, 22], fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: [25, 25, 40] },
                margin: { left: 14, right: 14 }
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 170);
            doc.text('Nenhum registro de troca encontrado.', pageW / 2, 50, { align: 'center' });
        }
    }

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 120);
        doc.text(`RB1 Roll · Aperam — Página ${i} de ${totalPages}`, pageW / 2, h - 6, { align: 'center' });
    }

    doc.save(`RB1_Roll_${tipo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast(`PDF ${tipo} exportado com sucesso!`, 'success');
}

function exportExcel() {
    const data = getExportData();
    const wb = XLSX.utils.book_new();

    // Sheet 1: Kanban Status
    const ws1Data = [['RB1 Roll — Status Kanban', '', '', '', '', '', ''],
        ['Posição', 'Status', 'Diâmetro', 'Idade', 'Turno', 'Motivo da Troca', 'Data Troca'],
        ...data.allRolos.map(r => [r.posicao, r.status, r.diametro, r.idade, r.turno, r.motivo, r.data_troca])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 35 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Kanban');

    // Sheet 2: Histórico
    const ws2Data = [['RB1 Roll — Histórico de Substituições', '', '', '', '', ''],
        ['Data/Hora', 'Posição', 'Turno', 'Diâmetro', 'Motivo', 'Idade'],
        ...data.histData.map(h => [h.data, h.posicao, h.turno, h.diametro, h.motivo, h.idade])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 35 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Histórico');

    // Sheet 3: Estoque
    const ws3Data = [['RB1 Roll — Estoque de Rolos', '', ''],
        ['Diâmetro', 'Observação', 'Data Entrada'],
        ...data.estoqueData.map(e => [e.diametro, e.obs, e.entrada])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Estoque');

    // Sheet 4: Diâmetros (análise)
    const diamData = [['RB1 Roll — Análise de Diâmetros', '', '', ''],
        ['Posição', 'Diâmetro Atual (mm)', 'Status', 'Dias no Forno']];
    for (let i = 0; i < 5; i++) {
        const r = getRolo(i);
        const days = r ? calcDays(r.data_troca) : null;
        diamData.push([`Rolo ${i}`, r ? r.diametro : '—', getStatus(days), days !== null ? days : '—']);
    }
    if (historico.length) {
        diamData.push([], ['Histórico de Diâmetros por Posição', '', '', '']);
        diamData.push(['Posição', 'Diâmetro (mm)', 'Data da Troca', 'Motivo']);
        historico.forEach(h => diamData.push([`Rolo ${h.posicao}`, h.diametro, fmtDate(h.data_troca), h.obs_motivo]));
    }
    const ws4 = XLSX.utils.aoa_to_sheet(diamData);
    ws4['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Diâmetros');

    XLSX.writeFile(wb, `RB1_Roll_Dados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Planilha Excel exportada com sucesso!', 'success');
}
