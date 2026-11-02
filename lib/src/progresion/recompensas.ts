// Recompensa de fin de partida (ExperienceCalculation.cs) y bonificaciones.
//
// La fórmula de MiniFighter, en palabras:
//   EXP     = base por nivel  (×2/3 si perdiste)  + tiempo jugado/5  + 20 por muerte (dungeon: 4 por muerte)
//   Monedas = (120 + 400·participación + tiempo/3)  (×2/3 si perdiste)  + 20 por muerte,  y todo ×20
//   - El tiempo cuenta desde el segundo 60 y como máximo 600 s (evita partidas cortas para farmear y AFK largos).
//   - Más de 20 muertes rinden menos: se descuenta un tercio (anti-farmeo entre amigos).
//   - Tope de 30.000 para cada cosa.
// Bug del original que conviene conocer: `400 * (presentes / total)` era división ENTERA, así que daba 400 solo
// si nadie se iba y 0 en cualquier otro caso. Acá la participación es una fracción real.

export interface DatosPartida {
  readonly nivel: number;
  readonly gano: boolean;
  readonly muertes: number;
  readonly duracionMs: number;
  /** Jugadores que terminaron / jugadores que empezaron. */
  readonly presentes: number;
  readonly total: number;
}

export interface ParametrosRecompensa {
  /** [nivel mínimo, EXP base] ordenado de menor a mayor. Debajo del primero, la base es `baseMinima`. */
  readonly basePorNivel: ReadonlyArray<readonly [number, number]>;
  readonly baseMinima: number;
  readonly factorDerrota: number;
  readonly segundosSinPremio: number;
  readonly segundosMaximos: number;
  readonly divisorTiempoExp: number;
  readonly divisorTiempoMonedas: number;
  readonly expPorMuerte: number;
  readonly monedasPorMuerte: number;
  readonly muertesSinPenalidad: number;
  readonly monedasBase: number;
  readonly monedasParticipacion: number;
  readonly multiplicadorMonedas: number;
  readonly tope: number;
}

export const RECOMPENSA_MINIFIGHTER: ParametrosRecompensa = {
  basePorNivel: [[30, 300], [40, 400], [50, 500], [60, 600], [70, 700], [80, 800], [90, 900], [100, 1000]],
  baseMinima: 1,
  factorDerrota: 2 / 3,
  segundosSinPremio: 60,
  segundosMaximos: 600,
  divisorTiempoExp: 5,
  divisorTiempoMonedas: 3,
  expPorMuerte: 20,
  monedasPorMuerte: 20,
  muertesSinPenalidad: 20,
  monedasBase: 120,
  monedasParticipacion: 400,
  multiplicadorMonedas: 20,
  tope: 30000,
};

/** Variante de mazmorra: cada muerte vale la quinta parte. */
export const RECOMPENSA_MAZMORRA_MINIFIGHTER: ParametrosRecompensa = { ...RECOMPENSA_MINIFIGHTER, expPorMuerte: 4 };

function baseDeNivel(nivel: number, p: ParametrosRecompensa): number {
  let base = p.baseMinima;
  for (const [desde, valor] of p.basePorNivel) {
    if (nivel >= desde) {
      base = valor;
    }
  }
  return base;
}

function muertesEfectivas(muertes: number, p: ParametrosRecompensa): number {
  return muertes > p.muertesSinPenalidad ? muertes - Math.floor(muertes / 3) : muertes;
}

function segundosPremiados(duracionMs: number, p: ParametrosRecompensa): number {
  return Math.min(p.segundosMaximos, Math.max(0, Math.floor(duracionMs / 1000) - p.segundosSinPremio));
}

export function recompensaPartida(d: DatosPartida, p: ParametrosRecompensa = RECOMPENSA_MINIFIGHTER): { exp: number; monedas: number } {
  const participacion = d.total > 0 ? Math.min(1, d.presentes / d.total) : 1;
  const segundos = segundosPremiados(d.duracionMs, p);
  const muertes = muertesEfectivas(d.muertes, p);

  let exp = baseDeNivel(d.nivel, p);
  if (!d.gano) exp = Math.floor(exp * p.factorDerrota);
  exp += Math.floor(segundos / p.divisorTiempoExp) + p.expPorMuerte * muertes;

  let monedas = Math.floor(p.monedasBase + p.monedasParticipacion * participacion + Math.floor(segundos / p.divisorTiempoMonedas));
  if (!d.gano) monedas = Math.floor(monedas * p.factorDerrota);
  monedas += p.monedasPorMuerte * muertes;
  monedas = Math.floor(monedas * p.multiplicadorMonedas);

  return { exp: Math.min(Math.max(0, exp), p.tope), monedas: Math.min(Math.max(0, monedas), p.tope) };
}

/** valor × (100 + porcentaje) / 100. Pociones de EXP, eventos globales, VIP... se suman en `porcentaje`. */
export function aplicarBonus(valor: number, porcentaje: number): number {
  return valor <= 0 || porcentaje <= 0 ? valor : Math.floor((valor * (100 + porcentaje)) / 100);
}

export interface PremioDeNivel {
  readonly nivel: number;
  readonly objeto: number;
  readonly cantidad: number;
  readonly monedas: number;
}

/** Premios de los niveles alcanzados al subir de `antes` a `despues` (EventLevel: también si se saltan niveles). */
export function premiosPorSubida(tabla: readonly PremioDeNivel[], antes: number, despues: number): PremioDeNivel[] {
  return tabla.filter((p) => p.nivel > antes && p.nivel <= despues);
}
