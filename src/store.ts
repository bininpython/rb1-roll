import type { Rolo, EstoqueItem, HistoricoTroca, Posicao, Turno, KanbanStatus } from './types';
import { supabase } from './supabase';

export let rolos: Rolo[] = [];
export let estoque: EstoqueItem[] = [];
export let historico: HistoricoTroca[] = [];

// Funções Utilitárias e de Segurança
export const genId = () => Math.random().toString(36).substring(2, 9);
export const calcDays = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
export const getStatus = (days: number | null): KanbanStatus => { if (days === null) return 'empty'; return days <= 10 ? 'green' : days <= 15 ? 'yellow' : 'red'; };
export const getRolo = (p: number) => rolos.find(r => r.posicao === p);
export const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

export function sanitize(str: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;' };
  return str.replace(/[&<>"'/]/ig, match => (map[match]));
}

// ===== Cloud Sync (Supabase) =====

// Carregar tudo do Supabase no início
export async function loadData() {
  try {
    const [resR, resE, resH] = await Promise.all([
      supabase.from('rolos').select('*'),
      supabase.from('estoque').select('*'),
      supabase.from('historico').select('*')
    ]);
    if (resR.data) rolos = resR.data;
    if (resE.data) estoque = resE.data;
    if (resH.data) historico = resH.data;
    // Dispara evento para o main.ts renderizar a tela após carregar
    window.dispatchEvent(new Event('dataLoaded'));
  } catch (e) {
    console.error("Erro ao carregar do Supabase:", e);
  }
}

// ===== Operações CRUD Sincronizadas =====

export async function registrarSubstituicao(pos: Posicao, turno: Turno, estoqueId: string, dtStr: string, motivo: string) {
  const estItem = estoque.find(e => e.id === estoqueId);
  if (!estItem) throw new Error('Rolo selecionado não existe mais no estoque.');
  if (isNaN(new Date(dtStr).getTime())) throw new Error('Data inválida.');
  if (!['TM', 'TT', 'TN'].includes(turno)) throw new Error('Turno inválido.');
  if (pos < 0 || pos > 4) throw new Error('Posição inválida.');

  const motSafe = sanitize(motivo);
  const oldRolo = getRolo(pos);
  const age = oldRolo ? calcDays(oldRolo.data_troca) : 0;
  
  // Cria novos registros
  const newHist: HistoricoTroca = {
    id: genId(), posicao: pos, data_troca: new Date(dtStr).toISOString(), turno,
    diametro: estItem.diametro, obs_motivo: motSafe, idade_dias: age, created_at: new Date().toISOString()
  };
  const newRolo: Rolo = {
    id: genId(), posicao: pos, data_troca: new Date(dtStr).toISOString(),
    turno, diametro: estItem.diametro, obs_motivo: motSafe
  };

  // Atualização Otimista UI (Rápida)
  historico.unshift(newHist);
  const rIdx = rolos.findIndex(r => r.posicao === pos);
  if (rIdx >= 0) rolos[rIdx] = newRolo; else rolos.push(newRolo);
  estoque = estoque.filter(e => e.id !== estoqueId);

  // Background Sync com o Supabase
  await supabase.from('historico').insert([newHist]);
  if (rIdx >= 0) {
    await supabase.from('rolos').update(newRolo).eq('posicao', pos);
  } else {
    await supabase.from('rolos').insert([newRolo]);
  }
  await supabase.from('estoque').delete().eq('id', estoqueId);
}

export async function editarHistorico(id: string, turno: Turno, dtStr: string, motivo: string) {
  const hIdx = historico.findIndex(h => h.id === id);
  if (hIdx === -1) throw new Error('Registro não encontrado.');
  if (!['TM', 'TT', 'TN'].includes(turno)) throw new Error('Turno inválido.');
  
  const h = historico[hIdx];
  const dObj = new Date(dtStr);
  if (dtStr && !isNaN(dObj.getTime())) h.data_troca = dObj.toISOString();
  if (motivo) h.obs_motivo = sanitize(motivo);
  h.turno = turno;

  // Background Sync com o Supabase
  await supabase.from('historico').update({ data_troca: h.data_troca, obs_motivo: h.obs_motivo, turno: h.turno }).eq('id', h.id);
}

export async function adicionarEstoque(diam: number, obs: string) {
  if (diam < 100 || diam > 1000) throw new Error('Diâmetro fora do padrão (100-1000mm).');
  
  const newItem: EstoqueItem = {
    id: genId(), diametro: diam, obs: sanitize(obs), data_entrada: new Date().toISOString()
  };

  // Atualização Otimista
  estoque.unshift(newItem);

  // Background Sync
  await supabase.from('estoque').insert([newItem]);
}

export async function removerEstoque(id: string) {
  estoque = estoque.filter(e => e.id !== id);
  await supabase.from('estoque').delete().eq('id', id);
}

export function initDemo(): void {
  // Chamamos o carregamento assíncrono agora
  loadData();
}
