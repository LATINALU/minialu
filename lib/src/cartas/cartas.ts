// Cartas = personajes coleccionables (CharCard.cs, CardGenerator.cs). Es el corazón "gacha" de MiniFighter:
//   - Cada carta tiene tipo (normal, especial, despertar, furia), nivel (0~11 = 1~12 estrellas), personaje y stats.
//   - Se consiguen al ganar partidas (casi siempre 1-2★) o en cajas de la tienda cash (5★ para arriba).
//   - Tres cartas del mismo tipo y nivel se FUSIONAN en una: con probabilidad p sube un nivel, si no queda igual.
//     Así 3 cartas se vuelven 1: la fusión es el gran sumidero de cartas (y de oro, por su costo).
//   - Un objeto de MEJORA suma +1~+5 a todos los stats sin pasar el máximo de su nivel.
// Todo está parametrizado: un juego nuevo cambia tablas, no código.

import { elegirPonderado, elegirUno, tirar, type Azar } from "../core/azar.ts";
import { exito, fallo, type Resultado } from "../core/resultado.ts";

// ---------------- Rareza ----------------

/** Tabla acumulada [nivel, probabilidad]. */
export type TablaRareza = ReadonlyArray<readonly [number, number]>;

/** Carta que se gana al terminar una partida: 1★ 63%, 2★ 32%, 3★ 4%, 4★ 1% (resto: 5★). */
export const RAREZA_PARTIDA: TablaRareza = [[0, 0.63], [1, 0.32], [2, 0.04], [3, 0.01]];

/** Caja aleatoria de la tienda cash, valores originales del juego (5★ 60% ... 12★ 0,0001%). */
export const RAREZA_CAJA_ORIGINAL: TablaRareza = [
  [4, 0.6], [5, 0.2], [6, 0.12], [7, 0.065], [8, 0.005], [9, 0.0003], [10, 0.00002], [11, 0.000001],
];

export function tirarRareza(azar: Azar, tabla: TablaRareza, sobrantes: readonly number[] = []): number {
  return elegirPonderado(azar, tabla, sobrantes);
}

/** Probabilidad de salir con una tabla acumulada (para mostrarla al jugador, obligatorio en muchos países). */
export function probabilidadesVisibles(tabla: TablaRareza): { nivel: number; porcentaje: number }[] {
  const total = tabla.reduce((s, [, p]) => s + p, 0);
  const resto = Math.max(0, 1 - total);
  return tabla.map(([nivel, p], i) => ({ nivel, porcentaje: (p + (i === 0 ? resto : 0)) * 100 }));
}

// ---------------- Fusión ----------------

export interface CartaBase {
  readonly tipo: number;
  readonly nivel: number;
  readonly personaje: number;
}

export interface ReglasFusion<C extends CartaBase> {
  readonly azar: Azar;
  /** Probabilidad (0~1) de subir desde ese nivel para ese tipo. Sin dato = 1 (siempre). */
  readonly probabilidad: (tipo: number, nivel: number) => number | undefined;
  readonly nivelMaximo: number;
  /** Personajes posibles si las tres cartas son de personajes distintos (mismo "grado" que las de entrada). */
  readonly personajesPosibles: (cartas: readonly C[]) => readonly number[];
  readonly crear: (tipo: number, nivel: number, personaje: number) => C;
}

export type ErrorFusion = "distinto-nivel" | "distinto-tipo" | "nivel-maximo";

/**
 * Tres cartas iguales en tipo y nivel -> una carta. `suerte` (carta de la suerte / de éxito) asegura subir.
 * Con MixInfo original: hasta 5★ siempre sube, 6★ 30%, de 7★ en adelante 0% sin carta de éxito.
 */
export function fusionar<C extends CartaBase>(
  cartas: readonly [C, C, C],
  reglas: ReglasFusion<C>,
  suerte = false,
): Resultado<{ carta: C; subio: boolean }, ErrorFusion> {
  const [a, b, c] = cartas;
  if (a.nivel !== b.nivel || a.nivel !== c.nivel) return fallo("distinto-nivel");
  if (a.tipo !== b.tipo || a.tipo !== c.tipo) return fallo("distinto-tipo");
  if (a.nivel >= reglas.nivelMaximo) return fallo("nivel-maximo");

  const personaje = a.personaje === b.personaje && a.personaje === c.personaje
    ? a.personaje
    : elegirUno(reglas.azar, reglas.personajesPosibles(cartas));
  const prob = reglas.probabilidad(a.tipo, a.nivel) ?? 1;
  const subio = suerte || tirar(reglas.azar, prob);
  return exito({ carta: reglas.crear(a.tipo, subio ? a.nivel + 1 : a.nivel, personaje), subio });
}

/** Costo en oro de fusionar, por nivel de las cartas (CardGenerator.MixCardPrice). */
export const COSTO_FUSION_MINIFIGHTER: readonly number[] = [
  300, 600, 1000, 3000, 10000, 50000, 100000, 1000000, 1500000, 2000000, 3000000, 10000000,
];

/** Probabilidades originales de MixInfo(KR).txt para cartas normales (10.0 = siempre). */
export const PROB_FUSION_NORMAL_MINIFIGHTER: ReadonlyMap<number, number> = new Map([
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 0.3], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0],
]);

// ---------------- Mejora (encantamiento) ----------------

export type Stats = Record<string, number>;

/** +1 20%, +2 30%, +3 30%, +4 10%, +5 10% (CardGenerator.EnchantCard). */
export const INCREMENTO_MEJORA_MINIFIGHTER: TablaRareza = [[1, 0.2], [2, 0.3], [3, 0.3], [4, 0.1], [5, 0.1]];

/**
 * Suma el mismo incremento a todos los stats sin pasar `maximos`. Falla si ya están todos al máximo
 * (el original devolvía -2 y no gastaba el objeto).
 */
export function mejorar(
  stats: Stats,
  maximos: Readonly<Stats>,
  azar: Azar,
  tabla: TablaRareza = INCREMENTO_MEJORA_MINIFIGHTER,
): Resultado<{ incremento: number; stats: Stats }, "al-maximo"> {
  const claves = Object.keys(maximos);
  if (claves.every((k) => (stats[k] ?? 0) >= maximos[k])) {
    return fallo("al-maximo");
  }
  const incremento = elegirPonderado(azar, tabla);
  const nuevos: Stats = { ...stats };
  for (const k of claves) {
    nuevos[k] = Math.min((stats[k] ?? 0) + incremento, maximos[k]);
  }
  return exito({ incremento, stats: nuevos });
}

/** Stats de una carta nueva: cada uno al azar entre el mínimo y el máximo de su nivel (CardDefine). */
export function generarStats(azar: Azar, minimos: Readonly<Stats>, maximos: Readonly<Stats>): Stats {
  const stats: Stats = {};
  for (const k of Object.keys(maximos)) {
    const min = minimos[k] ?? 0;
    stats[k] = min + Math.floor(azar.siguiente() * (maximos[k] - min + 1));
  }
  return stats;
}
