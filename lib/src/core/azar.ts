// Azar inyectable. En MiniFighter había un único System.Random compartido por todos los hilos y se rompía
// (devolvía siempre 0). Acá el azar siempre se pasa como parámetro: en producción el del sistema, en los tests
// uno con semilla para que los resultados sean repetibles.

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
}

export class AzarSistema implements Azar {
  siguiente(): number {
    return Math.random();
  }
}

/** Generador determinista (mulberry32). Misma semilla = misma secuencia. */
export class AzarSemilla implements Azar {
  private estado: number;

  constructor(semilla: number) {
    this.estado = semilla >>> 0;
  }

  siguiente(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** Entero en [0, max). */
export function entero(azar: Azar, max: number): number {
  return Math.floor(azar.siguiente() * max);
}

/** true con probabilidad `prob` (0~1; 1 o más = siempre). */
export function tirar(azar: Azar, prob: number): boolean {
  return azar.siguiente() < prob;
}

export function elegirUno<T>(azar: Azar, lista: readonly T[]): T {
  if (lista.length === 0) {
    throw new Error("elegirUno: lista vacía");
  }
  return lista[entero(azar, lista.length)];
}

/**
 * Tabla de probabilidades acumuladas, como `RandomPicker` del servidor: se recorre restando cada probabilidad.
 * Si la suma no llega a 1, el resto cae en `sobrantes` (elegido al azar) o, sin sobrantes, en la primera entrada.
 * Ejemplo (nivel de carta al ganar una partida): [[0, 0.63], [1, 0.32], [2, 0.04], [3, 0.01]].
 */
export function elegirPonderado<T>(
  azar: Azar,
  tabla: ReadonlyArray<readonly [T, number]>,
  sobrantes: readonly T[] = [],
): T {
  if (tabla.length === 0) {
    throw new Error("elegirPonderado: tabla vacía");
  }
  let resto = azar.siguiente();
  for (const [valor, prob] of tabla) {
    if (resto < prob) {
      return valor;
    }
    resto -= prob;
  }
  return sobrantes.length > 0 ? elegirUno(azar, sobrantes) : tabla[0][0];
}

/** Elección por pesos relativos (no hace falta que sumen 1). */
export function elegirPorPeso<T>(azar: Azar, tabla: ReadonlyArray<readonly [T, number]>): T {
  const total = tabla.reduce((s, [, peso]) => s + Math.max(0, peso), 0);
  if (total <= 0) {
    throw new Error("elegirPorPeso: pesos en cero");
  }
  let resto = azar.siguiente() * total;
  for (const [valor, peso] of tabla) {
    resto -= Math.max(0, peso);
    if (resto < 0) {
      return valor;
    }
  }
  return tabla[tabla.length - 1][0];
}
