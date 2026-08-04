/** RB1 System - Type Definitions */
export type Turno = 'TN' | 'TM' | 'TT';
export type KanbanStatus = 'green' | 'yellow' | 'red' | 'empty';
export type Posicao = number;

export interface Rolo {
        readonly id: string;
        posicao: Posicao;
        data_troca: string;
        turno: Turno;
        diametro: number;
        obs_motivo: string;
        rolamento?: string;
}

export interface EstoqueItem {
        readonly id: string;
        diametro: number;
        obs: string;
        data_entrada: string;
}

export interface RoloRegistro extends Rolo {}

export interface HistoricoRecord {
        id: string;
        posicao: Posicao;
        data_troca: string;
        turno: Turno;
        diametro: number;
        obs_motivo: string;
        idade_dias: number;
        created_at: string;
        rolamento?: string;
}
export interface AmostraDecapagem {
    id: string;
    created_at: string;
    tipo: string;
    operador: string;
    hora: string;
    condutividade: number | null;
    ph: number | null;
    fe_eletrolitica: number | null;
    hf: number | null;
    fe_quimica: number | null;
    hno3: number | null;
}

export interface HistoricoTanque {
    id: string;
    created_at: string;
    tanque: string;
    aco: string;
    nivel: number;
    hf: number | null;
    hno3: number | null;
    fe: number | null;
    operador: string;
    data: string;
    hora: string;
}
