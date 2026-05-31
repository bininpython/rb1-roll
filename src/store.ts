import type { Rolo, EstoqueItem, HistoricoRecord, Posicao, Turno, KanbanStatus } from './types';
import { supabase } from './supabase';

export let rolos: Rolo[] = [];
export let estoque: EstoqueItem[] = [];
export let historico: HistoricoRecord[] = [];

export interface RollerInfo {
  readonly posicao: number;
  readonly nome: string;
  readonly perimetro: number;
  readonly diametroPadrao: number;
  readonly tipo: 'Rolo' | 'Escova' | string;
  readonly secao: string;
  readonly rolamentoPadrao?: string;
}

export const DECAPAGEM_MAP: Record<number, RollerInfo> = {
  100: { posicao: 100, nome: 'Defletor Entrada', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Eletrolítico' },
  101: { posicao: 101, nome: 'Defletor 1', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  102: { posicao: 102, nome: 'Fundo do tanque 1', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  103: { posicao: 103, nome: 'Mergulhador ELE 1', perimetro: 3925, diametroPadrao: 1250, tipo: 'Rolo', secao: 'Eletrolítico' },
  104: { posicao: 104, nome: 'Fundo do tanque 2', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  105: { posicao: 105, nome: 'Defletor 2', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  106: { posicao: 106, nome: 'Centragem', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Eletrolítico' },
  107: { posicao: 107, nome: 'Defletor 3', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  108: { posicao: 108, nome: 'Fundo do tanque 3', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  109: { posicao: 109, nome: 'Mergulhador ELE 2', perimetro: 3925, diametroPadrao: 1250, tipo: 'Rolo', secao: 'Eletrolítico' },
  110: { posicao: 110, nome: 'Fundo do tanque 4', perimetro: 320, diametroPadrao: 101.9, tipo: 'Rolo', secao: 'Eletrolítico' },
  111: { posicao: 111, nome: 'Defletor 4', perimetro: 1884, diametroPadrao: 600, tipo: 'Rolo', secao: 'Eletrolítico' },
  // Espremedor 1 - Expandido
  112: { posicao: 112, nome: 'Espremedor 1 — Superior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  126: { posicao: 126, nome: 'Espremedor 1 — Inferior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  // Escovador 1 (Eletrolítico) - Expandido
  113: { posicao: 113, nome: 'Escovador 1 — Rolo de encosto escova superior', perimetro: 1036, diametroPadrao: 329.8, tipo: 'Rolo', secao: 'Eletrolítico' },
  120: { posicao: 120, nome: 'Escovador 1 — Escova superior', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Eletrolítico' },
  121: { posicao: 121, nome: 'Escovador 1 — Rolo de encosto escova inferior', perimetro: 1036, diametroPadrao: 329.8, tipo: 'Rolo', secao: 'Eletrolítico' },
  122: { posicao: 122, nome: 'Escovador 1 — Escova inferior', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Eletrolítico' },
  // Espremedor 2 - Expandido
  114: { posicao: 114, nome: 'Espremedor 2 — Superior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  127: { posicao: 127, nome: 'Espremedor 2 — Inferior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Eletrolítico' },
  
  115: { posicao: 115, nome: 'Mergulhador QUIM 1', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Químico' },
  116: { posicao: 116, nome: 'Mergulhador QUIM 2', perimetro: 3140, diametroPadrao: 1000, tipo: 'Rolo', secao: 'Químico' },
  // Espremedor 3 - Expandido
  117: { posicao: 117, nome: 'Espremedor 3 — Superior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' },
  128: { posicao: 128, nome: 'Espremedor 3 — Inferior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' },
  // Escovador 2 (Químico) - Expandido
  118: { posicao: 118, nome: 'Escovador 2 — Rolo de encosto escova superior', perimetro: 1036, diametroPadrao: 329.8, tipo: 'Rolo', secao: 'Químico' },
  123: { posicao: 123, nome: 'Escovador 2 — Escova superior', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico' },
  124: { posicao: 124, nome: 'Escovador 2 — Rolo de encosto escova inferior', perimetro: 1036, diametroPadrao: 329.8, tipo: 'Rolo', secao: 'Químico' },
  125: { posicao: 125, nome: 'Escovador 2 — Escova inferior', perimetro: 785, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico' },
  // Espremedor 4 - Expandido
  119: { posicao: 119, nome: 'Espremedor 4 — Superior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' },
  129: { posicao: 129, nome: 'Espremedor 4 — Inferior', perimetro: 800, diametroPadrao: 254.6, tipo: 'Rolo', secao: 'Químico' }
};

export const DECAPAGEM_ORDER = [
  100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
  112, 126, // Espremedor 1 (Sup / Inf)
  113, 120, 121, 122, // Escovador 1
  114, 127, // Espremedor 2 (Sup / Inf)
  115, 116,
  117, 128, // Espremedor 3 (Sup / Inf)
  118, 123, 124, 125, // Escovador 2
  119, 129 // Espremedor 4 (Sup / Inf)
];

export const RB1_COMPLETA_MAP: Record<number, RollerInfo> = {
  // Forno section
  0: { posicao: 0, nome: 'Rolo Forno 0', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Forno', rolamentoPadrao: 'Alta Temp' },
  1: { posicao: 1, nome: 'Rolo Forno 1', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Forno', rolamentoPadrao: 'Alta Temp' },
  2: { posicao: 2, nome: 'Rolo Forno 2', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Forno', rolamentoPadrao: 'Alta Temp' },
  3: { posicao: 3, nome: 'Rolo Forno 3', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Forno', rolamentoPadrao: 'Alta Temp' },
  4: { posicao: 4, nome: 'Rolo Forno 4', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Forno', rolamentoPadrao: 'Alta Temp' },
  200: { posicao: 200, nome: 'Bobina / Rolo Grande 200', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' },
  201: { posicao: 201, nome: 'Rolo 201', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  202: { posicao: 202, nome: 'Rolo 202', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  203: { posicao: 203, nome: 'Bobina / Rolo Grande 203', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' },
  204: { posicao: 204, nome: 'Bobina / Rolo Grande 204', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' },
  205: { posicao: 205, nome: 'Rolo 205', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  206: { posicao: 206, nome: 'Rolo 206', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  207: { posicao: 207, nome: 'Rolo 207', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  208: { posicao: 208, nome: 'Rolo 208', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  209: { posicao: 209, nome: 'Rolo 209', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  210: { posicao: 210, nome: 'Rolo 210', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  211: { posicao: 211, nome: 'Rolo 211', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  212: { posicao: 212, nome: 'Rolo 212', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  213: { posicao: 213, nome: 'Rolo 213', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  214: { posicao: 214, nome: 'Rolo 214', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  215: { posicao: 215, nome: 'Rolo 215', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  216: { posicao: 216, nome: 'Rolo 216', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  217: { posicao: 217, nome: 'Rolo 217', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  218: { posicao: 218, nome: 'Rolo 218', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  219: { posicao: 219, nome: 'Rolo 219', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  220: { posicao: 220, nome: 'Rolo 220', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  221: { posicao: 221, nome: 'Rolo 221', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  222: { posicao: 222, nome: 'Rolo 222', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  223: { posicao: 223, nome: 'Rolo 223', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  224: { posicao: 224, nome: 'Rolo 224', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  225: { posicao: 225, nome: 'Rolo 225', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  226: { posicao: 226, nome: 'Rolo 226', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  227: { posicao: 227, nome: 'Bobina / Rolo Grande 227', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' },
  228: { posicao: 228, nome: 'Rolo 228', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  229: { posicao: 229, nome: 'Rolo 229', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  230: { posicao: 230, nome: 'Rolo 230', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  231: { posicao: 231, nome: 'Rolo 231', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  232: { posicao: 232, nome: 'Rolo 232', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  233: { posicao: 233, nome: 'Rolo 233', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  234: { posicao: 234, nome: 'Rolo 234', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  235: { posicao: 235, nome: 'Rolo 235', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  236: { posicao: 236, nome: 'Rolo 236', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  237: { posicao: 237, nome: 'Rolo 237', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  238: { posicao: 238, nome: 'Rolo 238', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  239: { posicao: 239, nome: 'Rolo 239', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  240: { posicao: 240, nome: 'Rolo 240', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  241: { posicao: 241, nome: 'Rolo 241', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  242: { posicao: 242, nome: 'Rolo 242', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  243: { posicao: 243, nome: 'Rolo 243', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  244: { posicao: 244, nome: 'Rolo 244', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  245: { posicao: 245, nome: 'Rolo 245', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  246: { posicao: 246, nome: 'Rolo 246', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  247: { posicao: 247, nome: 'Rolo 247', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  248: { posicao: 248, nome: 'Rolo 248', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  249: { posicao: 249, nome: 'Rolo 249', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  250: { posicao: 250, nome: 'Rolo 250', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  251: { posicao: 251, nome: 'Rolo 251', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  252: { posicao: 252, nome: 'Rolo 252', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  253: { posicao: 253, nome: 'Rolo 253', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  254: { posicao: 254, nome: 'Rolo 254', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  255: { posicao: 255, nome: 'Bobina / Rolo Grande 255', perimetro: 0, diametroPadrao: 1000, tipo: 'Bobina', secao: 'Geral' },
  256: { posicao: 256, nome: 'Rolo 256', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  257: { posicao: 257, nome: 'Rolo 257', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  258: { posicao: 258, nome: 'Rolo 258', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  259: { posicao: 259, nome: 'Rolo 259', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  260: { posicao: 260, nome: 'Rolo 260', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  261: { posicao: 261, nome: 'Rolo 261', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  262: { posicao: 262, nome: 'Rolo 262', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  263: { posicao: 263, nome: 'Rolo 263', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  264: { posicao: 264, nome: 'Rolo 264', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  265: { posicao: 265, nome: 'Rolo 265', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  266: { posicao: 266, nome: 'Rolo 266', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  267: { posicao: 267, nome: 'Rolo 267', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  268: { posicao: 268, nome: 'Rolo 268', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  269: { posicao: 269, nome: 'Rolo 269', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  270: { posicao: 270, nome: 'Rolo 270', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  271: { posicao: 271, nome: 'Rolo 271', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  272: { posicao: 272, nome: 'Rolo 272', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  273: { posicao: 273, nome: 'Rolo 273', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  274: { posicao: 274, nome: 'Rolo 274', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  275: { posicao: 275, nome: 'Rolo 275', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  276: { posicao: 276, nome: 'Rolo 276', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  277: { posicao: 277, nome: 'Rolo 277', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  278: { posicao: 278, nome: 'Rolo 278', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  279: { posicao: 279, nome: 'Rolo 279', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  280: { posicao: 280, nome: 'Rolo 280', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  281: { posicao: 281, nome: 'Rolo 281', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  282: { posicao: 282, nome: 'Rolo 282', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  283: { posicao: 283, nome: 'Rolo 283', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  284: { posicao: 284, nome: 'Rolo 284', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  285: { posicao: 285, nome: 'Rolo 285', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  286: { posicao: 286, nome: 'Rolo 286', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  287: { posicao: 287, nome: 'Rolo 287', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  288: { posicao: 288, nome: 'Rolo 288', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  289: { posicao: 289, nome: 'Rolo 289', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  290: { posicao: 290, nome: 'Rolo 290', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  291: { posicao: 291, nome: 'Rolo 291', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  292: { posicao: 292, nome: 'Rolo 292', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  293: { posicao: 293, nome: 'Rolo 293', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  294: { posicao: 294, nome: 'Rolo 294', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  295: { posicao: 295, nome: 'Rolo 295', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  296: { posicao: 296, nome: 'Rolo 296', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  297: { posicao: 297, nome: 'Rolo 297', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  298: { posicao: 298, nome: 'Rolo 298', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  299: { posicao: 299, nome: 'Rolo 299', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  300: { posicao: 300, nome: 'Rolo 300', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  301: { posicao: 301, nome: 'Rolo 301', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  302: { posicao: 302, nome: 'Rolo 302', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  303: { posicao: 303, nome: 'Rolo 303', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  304: { posicao: 304, nome: 'Rolo 304', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  305: { posicao: 305, nome: 'Rolo 305', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Entrada/Processo' },
  306: { posicao: 306, nome: 'Rolo 306', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  307: { posicao: 307, nome: 'Rolo 307', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  308: { posicao: 308, nome: 'Rolo 308', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  309: { posicao: 309, nome: 'Rolo 309', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  310: { posicao: 310, nome: 'Rolo 310', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  311: { posicao: 311, nome: 'Rolo 311', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  312: { posicao: 312, nome: 'Rolo 312', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  313: { posicao: 313, nome: 'Rolo 313', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  314: { posicao: 314, nome: 'Rolo 314', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  315: { posicao: 315, nome: 'Rolo 315', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  316: { posicao: 316, nome: 'Rolo 316', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  317: { posicao: 317, nome: 'Rolo 317', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  318: { posicao: 318, nome: 'Rolo 318', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  319: { posicao: 319, nome: 'Rolo 319', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  320: { posicao: 320, nome: 'Rolo 320', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  321: { posicao: 321, nome: 'Rolo 321', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  322: { posicao: 322, nome: 'Rolo 322', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  323: { posicao: 323, nome: 'Rolo 323', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  324: { posicao: 324, nome: 'Rolo 324', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  325: { posicao: 325, nome: 'Rolo 325', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  326: { posicao: 326, nome: 'Rolo 326', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  327: { posicao: 327, nome: 'Rolo 327', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  328: { posicao: 328, nome: 'Rolo 328', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  329: { posicao: 329, nome: 'Rolo 329', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  330: { posicao: 330, nome: 'Rolo 330', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  331: { posicao: 331, nome: 'Rolo 331', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  332: { posicao: 332, nome: 'Rolo 332', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  333: { posicao: 333, nome: 'Rolo 333', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  334: { posicao: 334, nome: 'Rolo 334', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  335: { posicao: 335, nome: 'Rolo 335', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  336: { posicao: 336, nome: 'Rolo 336', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  337: { posicao: 337, nome: 'Rolo 337', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  338: { posicao: 338, nome: 'Rolo 338', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  339: { posicao: 339, nome: 'Rolo 339', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  340: { posicao: 340, nome: 'Rolo 340', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },


  441: { posicao: 441, nome: 'Corretor 1', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  442: { posicao: 442, nome: 'Corretor 2', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  443: { posicao: 443, nome: 'Corretor 3', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  444: { posicao: 444, nome: 'Corretor 4', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  445: { posicao: 445, nome: 'Corretor 5', perimetro: 0, diametroPadrao: 500, tipo: 'Corretor', secao: 'Geral', rolamentoPadrao: 'Alinhamento' },
  
  450: { posicao: 450, nome: 'Escovador 1 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  451: { posicao: 451, nome: 'Escovador 1 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  452: { posicao: 452, nome: 'Escovador 1 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  453: { posicao: 453, nome: 'Escovador 1 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  
  460: { posicao: 460, nome: 'Escovador 2 - Sup Esq', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },
  461: { posicao: 461, nome: 'Escovador 2 - Escova Inf', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  462: { posicao: 462, nome: 'Escovador 2 - Escova Sup', perimetro: 0, diametroPadrao: 250, tipo: 'Escova', secao: 'Químico', rolamentoPadrao: 'Alta Rotação' },
  463: { posicao: 463, nome: 'Escovador 2 - Inf Dir', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Químico' },

  341: { posicao: 341, nome: 'Rolo 341', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  342: { posicao: 342, nome: 'Rolo 342', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  343: { posicao: 343, nome: 'Rolo 343', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  344: { posicao: 344, nome: 'Rolo 344', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  345: { posicao: 345, nome: 'Rolo 345', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  346: { posicao: 346, nome: 'Rolo 346', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  347: { posicao: 347, nome: 'Rolo 347', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  348: { posicao: 348, nome: 'Rolo 348', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  349: { posicao: 349, nome: 'Rolo 349', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  350: { posicao: 350, nome: 'Rolo 350', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  351: { posicao: 351, nome: 'Rolo 351', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  352: { posicao: 352, nome: 'Rolo 352', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  353: { posicao: 353, nome: 'Rolo 353', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  354: { posicao: 354, nome: 'Rolo 354', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  355: { posicao: 355, nome: 'Rolo 355', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  356: { posicao: 356, nome: 'Rolo 356', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  357: { posicao: 357, nome: 'Rolo 357', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  358: { posicao: 358, nome: 'Rolo 358', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  359: { posicao: 359, nome: 'Rolo 359', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  360: { posicao: 360, nome: 'Rolo 360', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  361: { posicao: 361, nome: 'Rolo 361', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
  362: { posicao: 362, nome: 'Rolo 362', perimetro: 0, diametroPadrao: 200, tipo: 'Rolo', secao: 'Geral' },
};


// Funções Utilitárias e de Segurança
export const genId = () => Math.random().toString(36).substring(2, 9);
export const calcDays = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
export const getStatus = (days: number | null): KanbanStatus => { if (days === null) return 'empty'; return days <= 5 ? 'green' : days <= 10 ? 'yellow' : 'red'; };

export const getRolo = (p: number): Rolo | undefined => {
  const r = rolos.find(x => x.posicao === p);
  if (r) return r;
  const meta = DECAPAGEM_MAP[p] || RB1_COMPLETA_MAP[p];
  if (meta) {
    // Consistent fallback data based on position
    const daysAgo = (p % 4) + 1; // 1 to 4 days ago
    const dt = new Date();
    dt.setDate(dt.getDate() - daysAgo);
    return {
      id: `virtual-${p}`,
      posicao: p,
      data_troca: dt.toISOString(),
      turno: 'TT',
      diametro: meta.diametroPadrao,
      obs_motivo: '',
      rolamento: meta.rolamentoPadrao || 'Padrão'
    };
  }
  return undefined;
};

export const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

export function sanitize(str: string): string {
  if (!str) return str;
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;' };
  return str.replace(/[&<>"'/]/ig, match => (map[match]));
}

export function unsanitize(str: string): string {
  if (!str) return str;
  return str.replace(/&#x2F;/g, '/').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
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
    if (resR.data) rolos = resR.data.map((r: any) => ({ ...r, obs_motivo: unsanitize(r.obs_motivo) }));
    if (resE.data) estoque = resE.data.map((e: any) => ({ ...e, obs: unsanitize(e.obs) }));
    if (resH.data) historico = resH.data.map((h: any) => ({ ...h, obs_motivo: unsanitize(h.obs_motivo) }));
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
  if ((pos < 0 || pos > 4) && !DECAPAGEM_MAP[pos] && !RB1_COMPLETA_MAP[pos]) throw new Error('Posição inválida.');

  const motSafe = motivo;
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
  if (motivo) h.obs_motivo = motivo;
  h.turno = turno;

  // Background Sync com o Supabase
  await supabase.from('historico').update({ data_troca: h.data_troca, obs_motivo: h.obs_motivo, turno: h.turno }).eq('id', h.id);
}

export async function adicionarEstoque(diam: number, obs: string) {
  if (diam < 100 || diam > 1300) throw new Error('Diâmetro fora do padrão (100-1300mm).');
  
  const newItem: EstoqueItem = {
    id: genId(), diametro: diam, obs: obs, data_entrada: new Date().toISOString()
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


// ===== Gestão de Metadados Editáveis =====
export function loadMetadataOverrides() {
  try {
    const saved = localStorage.getItem('RB1_METADATA_OVERRIDES');
    if (saved) {
      const overrides = JSON.parse(saved);
      for (const pos in overrides) {
        const numPos = parseInt(pos, 10);
        if (DECAPAGEM_MAP[numPos]) {
          Object.assign(DECAPAGEM_MAP[numPos], overrides[numPos]);
        } else if (RB1_COMPLETA_MAP[numPos]) {
          Object.assign(RB1_COMPLETA_MAP[numPos], overrides[numPos]);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao carregar metadados:', err);
  }
}

export function salvarMetadados(posicao: number, novosDados: Partial<RollerInfo>) {
  if (DECAPAGEM_MAP[posicao]) {
    Object.assign(DECAPAGEM_MAP[posicao], novosDados);
  } else if (RB1_COMPLETA_MAP[posicao]) {
    Object.assign(RB1_COMPLETA_MAP[posicao], novosDados);
  } else {
    throw new Error('Roller metadata not found');
  }

  try {
    const saved = localStorage.getItem('RB1_METADATA_OVERRIDES');
    const overrides = saved ? JSON.parse(saved) : {};
    if (!overrides[posicao]) overrides[posicao] = {};
    Object.assign(overrides[posicao], novosDados);
    localStorage.setItem('RB1_METADATA_OVERRIDES', JSON.stringify(overrides));
  } catch (err) {
    console.error('Erro ao salvar metadados:', err);
    throw new Error('Falha ao salvar no armazenamento local');
  }
}

// Chamar na inicialização
loadMetadataOverrides();
