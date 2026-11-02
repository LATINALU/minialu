// Composición de stats (GameClient.GetProcessUserPower). El poder final de un jugador es una SUMA de capas:
//   base fija  +  carta del personaje elegido  +  puntos de habilidad  +  opciones del equipo  (+ buffs)
// En MiniFighter la base era 200 para todo y 3500 de HP. Modelarlo como capas permite mostrar en la interfaz
// de dónde sale cada punto y agregar capas nuevas (mascotas, runas, títulos) sin tocar la fórmula.

export const STATS_MINIFIGHTER = [
  "golpe", "patada", "defensa", "hp", "mp", "habilidad", "habilidadNueva", "especial", "especialFinal", "agarre",
] as const;

export type Stat = (typeof STATS_MINIFIGHTER)[number];

export type Capa = Readonly<Partial<Record<string, number>>>;

export const BASE_MINIFIGHTER: Capa = {
  golpe: 200, patada: 200, defensa: 200, hp: 3500, mp: 200,
  habilidad: 200, habilidadNueva: 200, especial: 200, especialFinal: 200, agarre: 200,
};

export function componerStats(capas: readonly Capa[]): Record<string, number> {
  const total: Record<string, number> = {};
  for (const capa of capas) {
    for (const [stat, valor] of Object.entries(capa)) {
      if (valor !== undefined) {
        total[stat] = (total[stat] ?? 0) + valor;
      }
    }
  }
  return total;
}

/** Desglose por capa de un stat (para tooltips: "Golpe 540 = 200 base + 310 carta + 30 equipo"). */
export function desglose(capas: Readonly<Record<string, Capa>>, stat: string): { capa: string; valor: number }[] {
  return Object.entries(capas)
    .map(([capa, valores]) => ({ capa, valor: valores[stat] ?? 0 }))
    .filter((d) => d.valor !== 0);
}
