/** RB1 Roll — Robust Data Store (localStorage with integrity & security) */
import type { Rolo, EstoqueItem, HistoricoRecord, Posicao, Turno, KanbanStatus } from './types';

const KEYS = { R: 'rb1_v2_rolos', E: 'rb1_v2_estoque', H: 'rb1_v2_historico' } as const;
const VALID_TURNOS: Turno[] = ['TN', 'TM', 'TT'];
const VALID_POS: Posicao[] = [0, 1, 2, 3, 4];

// ===== Security: Sanitize user text input =====
export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 500); // max length
}

function isValidTurno(t: string): t is Turno { return VALID_TURNOS.includes(t as Turno); }
function isValidPos(p: number): p is Posicao { return VALID_POS.includes(p as Posicao); }
function isValidDate(d: string): boolean { return !isNaN(new Date(d).getTime()); }
function isValidDiam(d: number): boolean { return typeof d === 'number' && d > 0 && d < 2000 && isFinite(d); }

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
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
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 864e5));
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
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ===== CRUD with full validation =====

/** Register a new roll substitution. Archives old roll to history (IMMUTABLE). Removes stock item. */
export function registrarSubstituicao(
  posicao: Posicao, turno: Turno, estoqueId: string,
  data_troca: string, obs_motivo: string
): void {
  // Validate all inputs
  if (!isValidPos(posicao)) throw new Error('Posição inválida');
  if (!isValidTurno(turno)) throw new Error('Turno inválido');
  if (!isValidDate(data_troca)) throw new Error('Data inválida');
  if (!obs_motivo.trim()) throw new Error('Motivo obrigatório');
  if (typeof estoqueId !== 'string' || !estoqueId.trim()) throw new Error('Selecione um rolo do estoque');

  const safeMotivo = sanitize(obs_motivo);

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
    diametro: stockItem.diametro, obs_motivo: safeMotivo
  };
  rolos = [...rolos, newRolo];
  save(KEYS.R, rolos);

  // Remove stock item (auto-deduction)
  estoque = estoque.filter(e => e.id !== estoqueId);
  save(KEYS.E, estoque);
}

/** Edit a history record (only turno, data_troca, obs_motivo). NEVER delete. */
export function editarHistorico(id: string, turno: Turno, data_troca: string, obs_motivo: string): void {
  if (!isValidTurno(turno)) throw new Error('Turno inválido');
  if (!isValidDate(data_troca)) throw new Error('Data inválida');
  if (!obs_motivo.trim()) throw new Error('Motivo obrigatório');
  const safeMotivo = sanitize(obs_motivo);
  historico = historico.map(h =>
    h.id === id ? { ...h, turno, data_troca, obs_motivo: safeMotivo } : h
  );
  save(KEYS.H, historico);
}

/** Add a roll to stock */
export function adicionarEstoque(diametro: number, obs: string): void {
  if (!isValidDiam(diametro)) throw new Error('Diâmetro inválido');
  const safeObs = sanitize(obs);
  const item: EstoqueItem = { id: genId(), diametro, obs: safeObs, data_entrada: new Date().toISOString() };
  estoque = [...estoque, item];
  save(KEYS.E, estoque);
}

/** Remove a stock item */
export function removerEstoque(id: string): void {
  if (typeof id !== 'string' || !id.trim()) return;
  estoque = estoque.filter(e => e.id !== id);
  save(KEYS.E, estoque);
}

// ===== Initialization =====
export function initDemo(): void {
  // O sistema agora inicia totalmente vazio ("virgem") conforme solicitado.
  // Nenhuma carga de demonstração será injetada.
}
