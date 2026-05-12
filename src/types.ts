/** RB1 Roll — Type Definitions */

export type Turno = 'TN' | 'TM' | 'TT';
export type KanbanStatus = 'green' | 'yellow' | 'red' | 'empty';
export type Posicao = 0 | 1 | 2 | 3 | 4;

export interface Rolo {
  readonly id: string;
  posicao: Posicao;
  data_troca: string;
  turno: Turno;
  diametro: number;
  obs_motivo: string;
}

export interface EstoqueItem {
  readonly id: string;
  diametro: number;
  obs: string;
  data_entrada: string;
}

export interface HistoricoRecord {
  readonly id: string;
  readonly posicao: Posicao;
  data_troca: string;
  turno: Turno;
  readonly diametro: number;
  obs_motivo: string;
  readonly idade_dias: number;
  readonly created_at: string;
}
