import type { Rolo, EstoqueItem, HistoricoRecord, Posicao, Turno, KanbanStatus } from './types';
import { supabase } from './supabase';

export let rolos: Rolo[] = [];
export let estoque: EstoqueItem[] = [];
export let historico: HistoricoRecord[] = [];

export interface DecapagemRollerInfo {
  readonly posicao: number;
  readonly nome: string;
  readonly perimetro: number;
  readonly diametroPadrao: number;
  readonly tipo: 'Rolo' | 'Escova';
  readonly secao: 'Eletrolítico' | 'Químico';
}

export const DECAPAGEM_MAP: Record<number, DecapagemRollerInfo> = {
  100: { posicao: 100, nome: 'Deflector Entrada', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Eletrolítico' },
  101: { posicao: 101, nome: 'Deflector 1', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  102: { posicao: 102, nome: 'Fundo do tanque 1', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  103: { posicao: 103, nome: 'Mergulhador ELE 1', perimetro: 3925, diametroPadrao: 1250, tipo: 'Rolo', secao: 'Eletrolítico' },
  104: { posicao: 104, nome: 'Fundo do tanque 2', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  105: { posicao: 105, nome: 'Deflector 2', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  106: { posicao: 106, nome: 'Centragem', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Eletrolítico' },
  107: { posicao: 107, nome: 'Deflector 3', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  108: { posicao: 108, nome: 'Fundo do tanque 3', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  109: { posicao: 109, nome: 'Mergulhador ELE 2', perimetro: 3925, diametroPadrao: 1250, tipo: 'Rolo', secao: 'Eletrolítico' },
  110: { posicao: 110, nome: 'Fundo do tanque 4', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  111: { posicao: 111, nome: 'Deflector 4', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  112: { posicao: 112, nome: 'Espremedor 1', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  113: { posicao: 113, nome: 'Escovador 1', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Eletrolítico' },
  114: { posicao: 114, nome: 'Espremedor 2', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  115: { posicao: 115, nome: 'Mergulhador QUIM 1', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Químico' },
  116: { posicao: 116, nome: 'Mergulhador QUIM 2', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Químico' },
  117: { posicao: 117, nome: 'Espremedor 3', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' },
  118: { posicao: 118, nome: 'Escovador 2', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico' },
  119: { posicao: 119, nome: 'Espremedor 4', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' }
};

// Funções Utilitárias e de Segurança
export const genId = () => Math.random().toString(36).substring(2, 9);
export const calcDays = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
export const getStatus = (days: number | null): KanbanStatus => { if (days === null) return 'empty'; return days <= 5 ? 'green' : days <= 10 ? 'yellow' : 'red'; };

export const getRolo = (p: number): Rolo | undefined => {
  const r = rolos.find(x => x.posicao === p);
  if (r) return r;
  if (p >= 100 && p <= 119) {
    const meta = DECAPAGEM_MAP[p];
    if (meta) {
      // Consistent fallback data based on position
      const daysAgo = (p % 4) + 1; // 1 to 4 days ago
      const dt = new Date();
      dt.setDate(dt.getDate() - daysAgo);
      return {
        id: `virtual-${p}`,
        posicao: p,
        data_troca: dt.toISOString(),
        turno: (['TN', 'TM', 'TT'][p % 3]) as Turno,
        diametro: meta.diametroPadrao,
        obs_motivo: 'Inicialização automática do sistema'
      };
    }
  }
  return undefined;
};

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
  if ((pos < 0 || pos > 4) && (pos < 100 || pos > 119)) throw new Error('Posição inválida.');

  const motSafe = sanitize(motivo);
  const oldRolo = getRolo(pos);
  const age = oldRolo ? calcDays(oldRolo.data_troca) : 0;
  
  // Cria novos registros
  const newHist: HistoricoRecord = {
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
  if (diam < 100 || diam > 1300) throw new Error('Diâmetro fora do padrão (100-1300mm).');
  
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
