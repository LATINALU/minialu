// Ranking y temporadas (RankingProvider.cs, GameClient.OnRanking).
// El original armaba listas ordenadas por EXP de batalla, EXP de pelea y puntos de gremio, cerraba la consulta
// de 4 a 7 de la mañana (recálculo) y entregaba la guerra de castillo al gremio ganador a las 20:30.
// No tenía temporadas: eso es lo que más le falta para que el ranking no quede congelado por los veteranos.
//
// Este módulo: puntajes por jugador, puestos con empates, cierre de temporada con premios por puesto y
// reinicio parcial, y Elo para ranking por habilidad (sirve para el emparejamiento).

export interface Puesto {
  readonly jugador: string;
  readonly puntos: number;
  /** 1 = primero. Empates comparten puesto (1, 2, 2, 4). */
  readonly puesto: number;
}

export interface PremioPuesto<P> {
  /** Puesto máximo que cubre (1 = solo el primero, 10 = del puesto anterior hasta el 10). */
  readonly hasta: number;
  readonly premio: P;
}

export class Ranking {
  private puntos = new Map<string, number>();
  private llegada = new Map<string, number>();
  private orden = 0;
  temporada = 1;

  sumar(jugador: string, delta: number): number {
    const nuevo = Math.max(0, (this.puntos.get(jugador) ?? 0) + delta);
    return this.fijar(jugador, nuevo);
  }

  fijar(jugador: string, valor: number): number {
    if (valor !== this.puntos.get(jugador)) this.llegada.set(jugador, this.orden++); // a igual puntaje, primero el que llegó antes
    this.puntos.set(jugador, valor);
    return valor;
  }

  puntosDe(jugador: string): number {
    return this.puntos.get(jugador) ?? 0;
  }

  tabla(): Puesto[] {
    const filas = [...this.puntos]
      .sort((a, b) => b[1] - a[1] || (this.llegada.get(a[0]) ?? 0) - (this.llegada.get(b[0]) ?? 0));
    const res: Puesto[] = [];
    filas.forEach(([jugador, puntos], i) => {
      const puesto = i > 0 && filas[i - 1][1] === puntos ? res[i - 1].puesto : i + 1;
      res.push({ jugador, puntos, puesto });
    });
    return res;
  }

  top(n: number): Puesto[] {
    return this.tabla().slice(0, n);
  }

  puestoDe(jugador: string): Puesto | undefined {
    return this.tabla().find((p) => p.jugador === jugador);
  }

  /**
   * Cierra la temporada: devuelve el premio de cada jugador según su puesto y reinicia los puntos.
   * `conservar` = fracción que se mantiene (0 = todos a cero, 0.5 = reinicio suave).
   */
  cerrarTemporada<P>(premios: readonly PremioPuesto<P>[], conservar = 0): { jugador: string; puesto: number; premio: P }[] {
    const ordenados = [...premios].sort((a, b) => a.hasta - b.hasta);
    const entregas: { jugador: string; puesto: number; premio: P }[] = [];
    for (const p of this.tabla()) {
      const tramo = ordenados.find((t) => p.puesto <= t.hasta);
      if (tramo !== undefined && p.puntos > 0) entregas.push({ jugador: p.jugador, puesto: p.puesto, premio: tramo.premio });
    }
    const nuevos = new Map<string, number>();
    for (const [j, v] of this.puntos) {
      const queda = Math.floor(v * conservar);
      if (queda > 0) nuevos.set(j, queda);
    }
    this.puntos = nuevos;
    this.temporada++;
    return entregas;
  }
}

/** Probabilidad esperada de que A le gane a B. */
export function esperadoElo(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/** Nuevo Elo de A y B. `resultado` = 1 gana A, 0 gana B, 0.5 empate. */
export function actualizarElo(a: number, b: number, resultado: number, k = 32): [number, number] {
  const ea = esperadoElo(a, b);
  const delta = Math.round(k * (resultado - ea));
  return [a + delta, b - delta];
}
