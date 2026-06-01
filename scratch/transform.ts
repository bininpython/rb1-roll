// Helper to map coordinates
export function T(x: number, y: number): [number, number] {
  if (x < 1450) return [x, y];
  if (x < 2780) return [x - 1400, y + 450];
  if (x < 3900) return [x - 2680, y + 1050];
  if (x < 5850) return [x - 3820, y + 1550];
  return [x - 5780, y + 2150];
}

export function TX(x: number): number { return T(x, 0)[0]; }
export function TY(x: number, y: number): number { return T(x, y)[1]; }
