/** RB1 Roll — Export Functions (PDF + Excel) */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { rolos, estoque, historico, calcDays, getStatus, getRolo, fmtDate } from './store';

function toast(msg: string, type: string) { (window as any).__rb1Toast?.(msg, type); }

function getExportData() {
  const allRolos = [0,1,2,3,4].map(i => {
    const r = getRolo(i); const days = r ? calcDays(r.data_troca) : null; const st = getStatus(days);
    return {
      posicao: `Rolo ${i}`,
      status: st === 'green' ? '🟢 Normal' : st === 'yellow' ? '🟡 Atenção' : st === 'red' ? '🔴 Crítico' : '⚪ Vazio',
      diametro: r ? `${r.diametro} mm` : '—', idade: days !== null ? `${days} dias` : '—',
      turno: r ? r.turno : '—', motivo: r ? r.obs_motivo : '—',
      data_troca: r ? fmtDate(r.data_troca) : '—'
    };
  });
  const histData = [...historico].sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime()).map(h => ({
    data: fmtDate(h.data_troca), posicao: `Rolo ${h.posicao}`, turno: h.turno,
    diametro: `${h.diametro} mm`, motivo: h.obs_motivo, idade: `${h.idade_dias} dias`
  }));
  const estoqueData = estoque.map(e => ({
    diametro: `${e.diametro} mm`, obs: e.obs || '—', entrada: fmtDate(e.data_entrada)
  }));
  return { allRolos, histData, estoqueData };
}

export function exportPDF(tipo: string) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date().toLocaleString('pt-BR');
  const data = getExportData();
  const pw = doc.internal.pageSize.getWidth();
  const tStyle = { fontSize: 8, cellPadding: 3, textColor: [200, 200, 220] as any, fillColor: [20, 20, 35] as any, lineColor: [42, 42, 66] as any, lineWidth: 0.3 };
  const hStyle = { fillColor: [30, 30, 50] as any, textColor: [249, 115, 22] as any, fontStyle: 'bold' as const, fontSize: 8 };

  function addHeader(title: string) {
    doc.setFillColor(15, 15, 25); doc.rect(0, 0, pw, 25, 'F');
    doc.setFontSize(16); doc.setTextColor(249, 115, 22); doc.text('RB1 Roll', 14, 12);
    doc.setFontSize(9); doc.setTextColor(150, 150, 170); doc.text('Linha de Recozimento · Aperam', 14, 18);
    doc.setFontSize(12); doc.setTextColor(240, 240, 245); doc.text(title, pw / 2, 12, { align: 'center' });
    doc.setFontSize(8); doc.setTextColor(130, 130, 150); doc.text(`Gerado: ${now}`, pw - 14, 12, { align: 'right' });
  }

  if (tipo === 'completo' || tipo === 'kanban') {
    addHeader(tipo === 'completo' ? 'Relatório Completo' : 'Relatório Kanban');
    doc.setFontSize(11); doc.setTextColor(240, 240, 245); doc.text('Status Kanban dos Rolos', 14, 35);
    (doc as any).autoTable({ startY: 40, head: [['Posição','Status','Diâmetro','Idade','Turno','Motivo','Data']], body: data.allRolos.map(r => [r.posicao,r.status,r.diametro,r.idade,r.turno,r.motivo,r.data_troca]), theme: 'grid', styles: tStyle, headStyles: hStyle, alternateRowStyles: { fillColor: [25,25,40] as any }, margin: { left: 14, right: 14 } });
    if (tipo === 'completo' && data.estoqueData.length) {
      const y = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setTextColor(240, 240, 245); doc.text('Estoque de Rolos', 14, y);
      (doc as any).autoTable({ startY: y + 5, head: [['Diâmetro','Observação','Entrada']], body: data.estoqueData.map(e => [e.diametro,e.obs,e.entrada]), theme: 'grid', styles: tStyle, headStyles: { ...hStyle, textColor: [129,140,248] as any }, alternateRowStyles: { fillColor: [25,25,40] as any }, margin: { left: 14, right: 14 } });
    }
  }
  if (tipo === 'completo' || tipo === 'trocas') {
    if (tipo === 'completo') (doc as any).addPage('landscape');
    addHeader(tipo === 'trocas' ? 'Relatório de Trocas' : 'Histórico de Substituições');
    if (data.histData.length) {
      (doc as any).autoTable({ startY: 35, head: [['Data','Posição','Turno','Diâmetro','Motivo','Idade']], body: data.histData.map(h => [h.data,h.posicao,h.turno,h.diametro,h.motivo,h.idade]), theme: 'grid', styles: tStyle, headStyles: hStyle, alternateRowStyles: { fillColor: [25,25,40] as any }, margin: { left: 14, right: 14 } });
    } else { doc.setFontSize(10); doc.setTextColor(150, 150, 170); doc.text('Nenhum registro.', pw/2, 50, { align: 'center' }); }
  }
  const tp = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= tp; i++) { (doc as any).setPage(i); doc.setFontSize(7); doc.setTextColor(100, 100, 120); doc.text(`RB1 Roll · Aperam — Pág ${i}/${tp}`, pw/2, doc.internal.pageSize.getHeight()-6, { align: 'center' }); }
  doc.save(`RB1_Roll_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`);
  toast(`PDF ${tipo} exportado!`, 'success');
}

export function exportExcel() {
  const data = getExportData();
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([['RB1 Roll — Status Kanban'],['Posição','Status','Diâmetro','Idade','Turno','Motivo','Data'],...data.allRolos.map(r => [r.posicao,r.status,r.diametro,r.idade,r.turno,r.motivo,r.data_troca])]);
  ws1['!cols'] = [{wch:12},{wch:14},{wch:12},{wch:10},{wch:8},{wch:35},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Kanban');
  const ws2 = XLSX.utils.aoa_to_sheet([['RB1 Roll — Histórico'],['Data','Posição','Turno','Diâmetro','Motivo','Idade'],...data.histData.map(h => [h.data,h.posicao,h.turno,h.diametro,h.motivo,h.idade])]);
  ws2['!cols'] = [{wch:18},{wch:10},{wch:8},{wch:12},{wch:35},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Histórico');
  const ws3 = XLSX.utils.aoa_to_sheet([['RB1 Roll — Estoque'],['Diâmetro','Observação','Entrada'],...data.estoqueData.map(e => [e.diametro,e.obs,e.entrada])]);
  ws3['!cols'] = [{wch:14},{wch:25},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Estoque');
  // Diameters analysis sheet
  const dSheet = [['RB1 Roll — Diâmetros'],['Posição','Diâmetro Atual','Status','Dias']];
  for (let i = 0; i < 5; i++) { const r = getRolo(i); const d = r ? calcDays(r.data_troca) : null; dSheet.push([`Rolo ${i}`, r ? String(r.diametro) : '—', getStatus(d), d !== null ? String(d) : '—']); }
  if (historico.length) { dSheet.push([]); dSheet.push(['Histórico de Diâmetros']); dSheet.push(['Posição','Diâmetro','Data','Motivo']); historico.forEach(h => dSheet.push([`Rolo ${h.posicao}`,String(h.diametro),fmtDate(h.data_troca),h.obs_motivo])); }
  const ws4 = XLSX.utils.aoa_to_sheet(dSheet);
  ws4['!cols'] = [{wch:14},{wch:18},{wch:18},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws4, 'Diâmetros');
  XLSX.writeFile(wb, `RB1_Roll_${new Date().toISOString().slice(0,10)}.xlsx`);
  toast('Planilha exportada!', 'success');
}
