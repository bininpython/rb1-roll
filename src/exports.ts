/** RB1 Roll — Export Functions (PDF + Excel) — Fixed for ES Modules */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate } from './store';

function toast(msg: string, type: string) { (window as any).__rb1Toast?.(msg, type); }

function getExportData() {
  const allRolos = [0,1,2,3,4].map(i => {
    const r = getRolo(i); const days = r ? calcDays(r.data_troca) : null; const st = getStatus(days);
    return {
      posicao: `Rolo ${i}`,
      status: st === 'green' ? 'Normal' : st === 'yellow' ? 'Atencao' : st === 'red' ? 'Critico' : 'Vazio',
      diametro: r ? `${r.diametro} mm` : '-', idade: days !== null ? `${days} dias` : '-',
      turno: r ? r.turno : '-', motivo: r ? r.obs_motivo : '-',
      data_troca: r ? fmtDate(r.data_troca) : '-'
    };
  });
  const histData = [...historico].sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime()).map(h => ({
    data: fmtDate(h.data_troca), posicao: `Rolo ${h.posicao}`, turno: h.turno,
    diametro: `${h.diametro} mm`, motivo: h.obs_motivo, idade: `${h.idade_dias} dias`
  }));
  const estoqueData = estoque.map(e => ({
    diametro: `${e.diametro} mm`, obs: e.obs || '-', entrada: fmtDate(e.data_entrada)
  }));
  // Monthly data
  const monthlyData: Record<string, typeof histData> = {};
  const mNames = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  historico.forEach(h => {
    const d = new Date(h.data_troca);
    const key = `${mNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!monthlyData[key]) monthlyData[key] = [];
    monthlyData[key].push({ data: fmtDate(h.data_troca), posicao: `Rolo ${h.posicao}`, turno: h.turno, diametro: `${h.diametro} mm`, motivo: h.obs_motivo, idade: `${h.idade_dias} dias` });
  });
  return { allRolos, histData, estoqueData, monthlyData };
}

export function exportPDF(tipo: string) {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const now = new Date().toLocaleString('pt-BR');
    const data = getExportData();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const tStyle = { fontSize: 8, cellPadding: 3, textColor: [60, 60, 80] as [number,number,number], lineColor: [200, 200, 210] as [number,number,number], lineWidth: 0.3 };
    const hStyle = { fillColor: [30, 30, 45] as [number,number,number], textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold' as const, fontSize: 8 };

    function addHeader(title: string) {
      doc.setFillColor(20, 20, 30); doc.rect(0, 0, pw, 22, 'F');
      doc.setFontSize(14); doc.setTextColor(249, 115, 22); doc.text('RB1 Roll', 14, 11);
      doc.setFontSize(8); doc.setTextColor(150, 150, 170); doc.text('Linha de Recozimento - Aperam', 14, 17);
      doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.text(title, pw / 2, 13, { align: 'center' });
      doc.setFontSize(7); doc.setTextColor(130, 130, 150); doc.text(`Gerado: ${now}`, pw - 14, 11, { align: 'right' });
      doc.setDrawColor(60, 60, 80); doc.line(0, 22, pw, 22);
    }
    function addFooter(pageNum: number, total: number) {
      doc.setFontSize(7); doc.setTextColor(130, 130, 150);
      doc.text(`RB1 Roll - Aperam | Pag ${pageNum}/${total}`, pw / 2, ph - 5, { align: 'center' });
    }

    if (tipo === 'completo' || tipo === 'kanban') {
      addHeader(tipo === 'completo' ? 'Relatorio Completo' : 'Relatorio Kanban');
      doc.setFontSize(10); doc.setTextColor(60, 60, 80); doc.text('Status Kanban dos Rolos', 14, 32);
      autoTable(doc, { startY: 36, head: [['Posicao','Status','Diametro','Idade','Turno','Motivo','Data']], body: data.allRolos.map(r => [r.posicao,r.status,r.diametro,r.idade,r.turno,r.motivo,r.data_troca]), theme: 'striped', styles: tStyle, headStyles: hStyle, margin: { left: 14, right: 14 } });
      if (tipo === 'completo' && data.estoqueData.length) {
        const y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10); doc.setTextColor(60, 60, 80); doc.text('Estoque de Rolos', 14, y);
        autoTable(doc, { startY: y + 4, head: [['Diametro','Observacao','Entrada']], body: data.estoqueData.map(e => [e.diametro,e.obs,e.entrada]), theme: 'striped', styles: tStyle, headStyles: hStyle, margin: { left: 14, right: 14 } });
      }
    }
    if (tipo === 'completo' || tipo === 'trocas') {
      if (tipo === 'completo') doc.addPage();
      addHeader(tipo === 'trocas' ? 'Relatorio de Trocas' : 'Historico de Substituicoes');
      if (data.histData.length) {
        autoTable(doc, { startY: 32, head: [['Data','Posicao','Turno','Diametro','Motivo','Idade']], body: data.histData.map(h => [h.data,h.posicao,h.turno,h.diametro,h.motivo,h.idade]), theme: 'striped', styles: tStyle, headStyles: hStyle, margin: { left: 14, right: 14 } });
      } else { doc.setFontSize(10); doc.setTextColor(150, 150, 170); doc.text('Nenhum registro.', pw/2, 50, { align: 'center' }); }
    }
    if (tipo === 'completo' || tipo === 'mensal') {
      if (tipo === 'completo') doc.addPage();
      addHeader('Trocas por Mes');
      let curY = 32;
      const entries = Object.entries(data.monthlyData);
      if (entries.length) {
        entries.forEach(([month, records]) => {
          if (curY > ph - 40) { doc.addPage(); addHeader('Trocas por Mes (cont.)'); curY = 32; }
          doc.setFontSize(9); doc.setTextColor(249, 115, 22); doc.text(month, 14, curY); curY += 4;
          autoTable(doc, { startY: curY, head: [['Data','Posicao','Turno','Diametro','Motivo']], body: records.map(r => [r.data,r.posicao,r.turno,r.diametro,r.motivo]), theme: 'striped', styles: { ...tStyle, fontSize: 7 }, headStyles: { ...hStyle, fontSize: 7 }, margin: { left: 14, right: 14 } });
          curY = (doc as any).lastAutoTable.finalY + 8;
        });
      } else { doc.setFontSize(10); doc.setTextColor(150, 150, 170); doc.text('Nenhuma troca registrada.', pw/2, 50, { align: 'center' }); }
    }
    // Add page numbers
    const tp = doc.getNumberOfPages();
    for (let i = 1; i <= tp; i++) { doc.setPage(i); addFooter(i, tp); }
    doc.save(`RB1_Roll_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`);
    toast(`PDF ${tipo} exportado com sucesso!`, 'success');
  } catch (err: any) {
    console.error('Erro ao exportar PDF:', err);
    toast(`Erro na exportacao: ${err.message}`, 'error');
  }
}

export function exportExcel() {
  try {
    const data = getExportData();
    const wb = XLSX.utils.book_new();
    // Kanban
    const ws1 = XLSX.utils.aoa_to_sheet([['RB1 Roll - Status Kanban','','','','','',''],['Posicao','Status','Diametro','Idade','Turno','Motivo','Data'],...data.allRolos.map(r => [r.posicao,r.status,r.diametro,r.idade,r.turno,r.motivo,r.data_troca])]);
    ws1['!cols'] = [{wch:12},{wch:14},{wch:12},{wch:10},{wch:8},{wch:35},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Kanban');
    // Historico
    const ws2 = XLSX.utils.aoa_to_sheet([['RB1 Roll - Historico','','','','',''],['Data','Posicao','Turno','Diametro','Motivo','Idade'],...data.histData.map(h => [h.data,h.posicao,h.turno,h.diametro,h.motivo,h.idade])]);
    ws2['!cols'] = [{wch:18},{wch:10},{wch:8},{wch:12},{wch:35},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Historico');
    // Estoque
    const ws3 = XLSX.utils.aoa_to_sheet([['RB1 Roll - Estoque','',''],['Diametro','Observacao','Entrada'],...data.estoqueData.map(e => [e.diametro,e.obs,e.entrada])]);
    ws3['!cols'] = [{wch:14},{wch:25},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Estoque');
    // Monthly sheets
    Object.entries(data.monthlyData).forEach(([month, records]) => {
      const sheetName = month.slice(0, 31); // Max 31 chars for sheet name
      const ws = XLSX.utils.aoa_to_sheet([[`Trocas - ${month}`,'','','',''],['Data','Posicao','Turno','Diametro','Motivo'],...records.map(r => [r.data,r.posicao,r.turno,r.diametro,r.motivo])]);
      ws['!cols'] = [{wch:18},{wch:10},{wch:8},{wch:12},{wch:35}];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    // Diameters
    const dSheet: string[][] = [['RB1 Roll - Diametros','','',''],['Posicao','Diametro Atual','Status','Dias']];
    for (let i = 0; i < 5; i++) { const r = getRolo(i); const d = r ? calcDays(r.data_troca) : null; dSheet.push([`Rolo ${i}`, r ? String(r.diametro) : '-', getStatus(d), d !== null ? String(d) : '-']); }
    const ws4 = XLSX.utils.aoa_to_sheet(dSheet);
    ws4['!cols'] = [{wch:14},{wch:18},{wch:18},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws4, 'Diametros');
    XLSX.writeFile(wb, `RB1_Roll_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast('Planilha Excel exportada com sucesso!', 'success');
  } catch (err: any) {
    console.error('Erro ao exportar Excel:', err);
    toast(`Erro na exportacao: ${err.message}`, 'error');
  }
}
