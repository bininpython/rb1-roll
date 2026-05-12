/** RB1 Roll — Robust Data Store (localStorage with integrity) */
import type { Rolo, EstoqueItem, HistoricoRecord, Posicao, Turno, KanbanStatus } from './types';

const KEYS = { R: 'rb1_v2_rolos', E: 'rb1_v2_estoque', H: 'rb1_v2_historico' } as const;

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== State =====
export let rolos: Rolo[] = load<Rolo>(KEYS.R);
export let estoque: EstoqueItem[] = load<EstoqueItem>(KEYS.E);
export let historico: HistoricoRecord[] = load<HistoricoRecord>(KEYS.H);

// ===== Kanban Logic =====
export function calcDays(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 864e5));
}

export function getStatus(days: number | null): KanbanStatus {
  if (days === null) return 'empty';
  if (days <= 5) return 'green';
  if (days <= 10) return 'yellow';
  return 'red';
}

export function getRolo(pos: number): Rolo | undefined {
  return rolos.find(r => r.posicao === pos);
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ===== CRUD Operations =====

/** Register a new roll substitution. Archives old roll to history (IMMUTABLE). Removes stock item. */
export function registrarSubstituicao(
  posicao: Posicao, turno: Turno, estoqueId: string,
  data_troca: string, obs_motivo: string
): void {
  // Find stock item
  const stockItem = estoque.find(e => e.id === estoqueId);
  if (!stockItem) throw new Error('Rolo do estoque não encontrado');

  // Archive existing roll to history (IMMUTABLE - never deleted)
  const existing = getRolo(posicao);
  if (existing) {
    const record: HistoricoRecord = {
      id: genId(),
      posicao: existing.posicao,
      data_troca: existing.data_troca,
      turno: existing.turno,
      diametro: existing.diametro,
      obs_motivo: existing.obs_motivo,
      idade_dias: calcDays(existing.data_troca),
      created_at: new Date().toISOString()
    };
    historico = [...historico, record];
    save(KEYS.H, historico);
  }

  // Remove old roll and install new from stock
  rolos = rolos.filter(r => r.posicao !== posicao);
  const newRolo: Rolo = {
    id: genId(), posicao, data_troca, turno,
    diametro: stockItem.diametro, obs_motivo
  };
  rolos = [...rolos, newRolo];
  save(KEYS.R, rolos);

  // Remove stock item (auto-deduction)
  estoque = estoque.filter(e => e.id !== estoqueId);
  save(KEYS.E, estoque);
}

/** Edit a history record (only turno, data_troca, obs_motivo). NEVER delete. */
export function editarHistorico(id: string, turno: Turno, data_troca: string, obs_motivo: string): void {
  historico = historico.map(h =>
    h.id === id ? { ...h, turno, data_troca, obs_motivo } : h
  );
  save(KEYS.H, historico);
}

/** Add a roll to stock */
export function adicionarEstoque(diametro: number, obs: string): void {
  const item: EstoqueItem = { id: genId(), diametro, obs, data_entrada: new Date().toISOString() };
  estoque = [...estoque, item];
  save(KEYS.E, estoque);
}

/** Remove a stock item (only from stock, not from history) */
export function removerEstoque(id: string): void {
  estoque = estoque.filter(e => e.id !== id);
  save(KEYS.E, estoque);
}

// ===== Demo Data =====
export function initDemo(): void {
  if (rolos.length || historico.length) return;
  const n = Date.now(), d = 864e5;
  rolos = [
    { id: genId(), posicao: 0, data_troca: new Date(n - 2*d).toISOString(), turno: 'TM', diametro: 320.5, obs_motivo: 'Preventiva — troca programada' },
    { id: genId(), posicao: 1, data_troca: new Date(n - 7*d).toISOString(), turno: 'TN', diametro: 315.0, obs_motivo: 'Desgaste detectado na inspeção' },
    { id: genId(), posicao: 2, data_troca: new Date(n - 12*d).toISOString(), turno: 'TT', diametro: 310.2, obs_motivo: 'Marca na chapa — substituição urgente' },
    { id: genId(), posicao: 3, data_troca: new Date(n - 4*d).toISOString(), turno: 'TM', diametro: 322.0, obs_motivo: 'Preventiva' },
    { id: genId(), posicao: 4, data_troca: new Date(n - 9*d).toISOString(), turno: 'TN', diametro: 318.7, obs_motivo: 'Desgaste acumulado' }
  ];
  estoque = [
    { id: genId(), diametro: 325.0, obs: 'Novo — lote 2026-A', data_entrada: new Date().toISOString() },
    { id: genId(), diametro: 320.0, obs: 'Retificado', data_entrada: new Date().toISOString() },
    { id: genId(), diametro: 318.5, obs: 'Novo', data_entrada: new Date().toISOString() }
  ];
  historico = [
    { id: genId(), posicao: 0, data_troca: new Date(n - 20*d).toISOString(), turno: 'TN', diametro: 319.0, obs_motivo: 'Quebra — trinca superficial', idade_dias: 18, created_at: new Date(n - 2*d).toISOString() },
    { id: genId(), posicao: 2, data_troca: new Date(n - 25*d).toISOString(), turno: 'TT', diametro: 312.5, obs_motivo: 'Desgaste excessivo', idade_dias: 13, created_at: new Date(n - 12*d).toISOString() },
    { id: genId(), posicao: 1, data_troca: new Date(n - 15*d).toISOString(), turno: 'TM', diametro: 316.0, obs_motivo: 'Marca na chapa', idade_dias: 8, created_at: new Date(n - 7*d).toISOString() }
  ];
  save(KEYS.R, rolos); save(KEYS.E, estoque); save(KEYS.H, historico);
}
